const mongoose = require('mongoose');
const Accessory = require('../models/Accessory');
const Brand = require('../models/Brand');
const AccessoryType = require('../models/AccessoryType');

// Helper to parse array inputs
const parseArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch (_) {}
    return val
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

// Helper to parse variants array with variant-specific price support
const parseVariants = (val, defaultPrice = 0, defaultDiscount = 0) => {
  let list = [];
  if (Array.isArray(val)) list = val;
  else if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) list = parsed;
    } catch (_) {}
  }

  return list.map((v) => ({
    color: v.color || '',
    price: v.price !== undefined && v.price !== '' ? Number(v.price) : Number(defaultPrice),
    discountPrice: v.discountPrice !== undefined && v.discountPrice !== '' ? Number(v.discountPrice) : (v.price !== undefined ? Number(v.price) : Number(defaultDiscount)),
    stock: Number(v.stock) || 0,
    image: v.image || '',
    sku: v.sku || '',
  }));
};

/**
 * @desc    Create a new Accessory
 * @route   POST /api/accessories
 * @access  Private/Admin
 */
const createAccessory = async (req, res, next) => {
  try {
    const {
      name,
      brand,
      accessoryType,
      price,
      discountPrice,
      stock,
      description,
      colorVariants,
      colorImages,
      variants,
      specifications,
      isFeatured,
      images: imageUrls,
    } = req.body;

    if (!name || !brand) {
      return res.status(400).json({ message: 'Name and brand are required' });
    }

    // Resolve Brand ID or auto-create if string
    let brandId = brand;
    if (mongoose.Types.ObjectId.isValid(brand)) {
      const brandDoc = await Brand.findById(brand);
      if (!brandDoc) {
        return res.status(404).json({ message: 'Referenced Brand not found' });
      }
    } else {
      let brandDoc = await Brand.findOne({ name: { $regex: new RegExp(`^${String(brand).trim()}$`, 'i') } });
      if (!brandDoc) {
        brandDoc = await Brand.create({ name: String(brand).trim() });
      }
      brandId = brandDoc._id;
    }

    // Resolve AccessoryType ID or auto-create if string
    let typeId = accessoryType;
    if (accessoryType) {
      if (mongoose.Types.ObjectId.isValid(accessoryType)) {
        const typeDoc = await AccessoryType.findById(accessoryType);
        if (!typeDoc) {
          return res.status(404).json({ message: 'Referenced Accessory Type not found' });
        }
      } else {
        let typeDoc = await AccessoryType.findOne({ name: { $regex: new RegExp(`^${String(accessoryType).trim()}$`, 'i') } });
        if (!typeDoc) {
          typeDoc = await AccessoryType.create({ name: String(accessoryType).trim() });
        }
        typeId = typeDoc._id;
      }
    } else {
      let typeDoc = await AccessoryType.findOne({ name: 'General' });
      if (!typeDoc) typeDoc = await AccessoryType.create({ name: 'General' });
      typeId = typeDoc._id;
    }

    // Process uploaded images
    const imagePaths = [];
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      req.files.forEach((file) => {
        imagePaths.push(`/uploads/${file.filename}`);
      });
    } else if (imageUrls) {
      if (Array.isArray(imageUrls)) {
        imagePaths.push(...imageUrls);
      } else if (typeof imageUrls === 'string') {
        imagePaths.push(imageUrls);
      }
    }

    let parsedSpecs = {};
    if (typeof specifications === 'string') {
      try {
        parsedSpecs = JSON.parse(specifications);
      } catch (_) {
        parsedSpecs = {};
      }
    } else if (typeof specifications === 'object' && specifications !== null) {
      parsedSpecs = specifications;
    }

    let parsedColorImages = {};
    if (typeof colorImages === 'string') {
      try {
        parsedColorImages = JSON.parse(colorImages);
      } catch (_) {}
    } else if (typeof colorImages === 'object' && colorImages !== null) {
      parsedColorImages = colorImages;
    }

    const parsedVariantsList = parseVariants(variants, price || 0, discountPrice || 0);

    let basePrice = price !== undefined && price !== '' ? Number(price) : 0;
    let baseDiscount = discountPrice !== undefined && discountPrice !== '' ? Number(discountPrice) : basePrice;

    if (parsedVariantsList.length > 0) {
      if (!basePrice || basePrice === 0) {
        basePrice = parsedVariantsList[0].price || 0;
        baseDiscount = parsedVariantsList[0].discountPrice || basePrice;
      }
    }

    let totalStock = stock ? Number(stock) : 0;
    if (parsedVariantsList.length > 0) {
      totalStock = parsedVariantsList.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
    }

    const accessory = await Accessory.create({
      name: name.trim(),
      brand: brandId,
      accessoryType: typeId,
      price: basePrice,
      discountPrice: baseDiscount,
      stock: totalStock,
      description: description ? description.trim() : '',
      colorVariants: parseArray(colorVariants),
      colorImages: parsedColorImages,
      variants: parsedVariantsList,
      images: imagePaths,
      specifications: parsedSpecs,
      isFeatured: isFeatured === 'true' || isFeatured === true,
    });

    const populatedAccessory = await Accessory.findById(accessory._id)
      .populate('brand', 'name logo')
      .populate('accessoryType', 'name icon');

    res.status(201).json({
      message: 'Accessory created successfully',
      accessory: populatedAccessory,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all Accessories
 * @route   GET /api/accessories
 * @access  Public
 */
const getAccessories = async (req, res, next) => {
  try {
    const { brand, accessoryType, search, activeOnly } = req.query;
    const filter = {};

    if (activeOnly === 'true') filter.isActive = true;

    if (brand) {
      if (mongoose.isValidObjectId(brand)) {
        filter.brand = brand;
      } else {
        const brandDoc = await Brand.findOne({ name: { $regex: new RegExp(`^${brand}$`, 'i') } });
        if (brandDoc) {
          filter.brand = brandDoc._id;
        } else {
          filter.brand = new mongoose.Types.ObjectId();
        }
      }
    }

    if (accessoryType) {
      if (mongoose.isValidObjectId(accessoryType)) {
        filter.accessoryType = accessoryType;
      } else {
        const typeDoc = await AccessoryType.findOne({
          $or: [
            { name: { $regex: new RegExp(`^${accessoryType}$`, 'i') } },
            { slug: accessoryType.toLowerCase() }
          ]
        });
        if (typeDoc) {
          filter.accessoryType = typeDoc._id;
        } else {
          filter.accessoryType = new mongoose.Types.ObjectId();
        }
      }
    }

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const accessories = await Accessory.find(filter)
      .populate('brand', 'name logo')
      .populate('accessoryType', 'name icon')
      .sort({ createdAt: -1 });

    res.json({ count: accessories.length, accessories });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single Accessory by ID
 * @route   GET /api/accessories/:id
 * @access  Public
 */
const getAccessoryById = async (req, res, next) => {
  try {
    const accessory = await Accessory.findById(req.params.id)
      .populate('brand', 'name logo')
      .populate('accessoryType', 'name icon');

    if (!accessory) {
      return res.status(404).json({ message: 'Accessory not found' });
    }
    res.json(accessory);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update Accessory
 * @route   PUT /api/accessories/:id
 * @access  Private/Admin
 */
const updateAccessory = async (req, res, next) => {
  try {
    const accessory = await Accessory.findById(req.params.id);
    if (!accessory) {
      return res.status(404).json({ message: 'Accessory not found' });
    }

    const {
      name,
      brand,
      accessoryType,
      price,
      discountPrice,
      stock,
      description,
      colorVariants,
      colorImages,
      variants,
      specifications,
      isFeatured,
      isActive,
    } = req.body;

    if (name) accessory.name = name.trim();
    if (brand) {
      if (mongoose.Types.ObjectId.isValid(brand)) {
        accessory.brand = brand;
      } else {
        let brandDoc = await Brand.findOne({ name: { $regex: new RegExp(`^${String(brand).trim()}$`, 'i') } });
        if (!brandDoc) {
          brandDoc = await Brand.create({ name: String(brand).trim() });
        }
        accessory.brand = brandDoc._id;
      }
    }
    if (accessoryType) {
      if (mongoose.Types.ObjectId.isValid(accessoryType)) {
        accessory.accessoryType = accessoryType;
      } else {
        let typeDoc = await AccessoryType.findOne({ name: { $regex: new RegExp(`^${String(accessoryType).trim()}$`, 'i') } });
        if (!typeDoc) {
          typeDoc = await AccessoryType.create({ name: String(accessoryType).trim() });
        }
        accessory.accessoryType = typeDoc._id;
      }
    }
    if (description !== undefined) accessory.description = description.trim();
    if (colorVariants !== undefined) accessory.colorVariants = parseArray(colorVariants);
    if (isFeatured !== undefined) accessory.isFeatured = isFeatured === 'true' || isFeatured === true;
    if (isActive !== undefined) accessory.isActive = isActive === 'true' || isActive === true;

    if (colorImages !== undefined) {
      let parsedColorImages = {};
      if (typeof colorImages === 'string') {
        try {
          parsedColorImages = JSON.parse(colorImages);
        } catch (_) {}
      } else if (typeof colorImages === 'object' && colorImages !== null) {
        parsedColorImages = colorImages;
      }
      accessory.colorImages = parsedColorImages;
    }

    if (variants !== undefined) {
      const parsedVariantsList = parseVariants(variants, accessory.price, accessory.discountPrice);
      accessory.variants = parsedVariantsList;
      if (parsedVariantsList.length > 0) {
        accessory.stock = parsedVariantsList.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
        accessory.price = parsedVariantsList[0].price || accessory.price;
        accessory.discountPrice = parsedVariantsList[0].discountPrice || accessory.price;
      } else if (stock !== undefined) {
        accessory.stock = Number(stock);
      }
    } else {
      if (price !== undefined) accessory.price = Number(price);
      if (discountPrice !== undefined) accessory.discountPrice = Number(discountPrice);
      if (stock !== undefined) accessory.stock = Number(stock);
    }

    if (specifications) {
      let parsedSpecs = specifications;
      if (typeof specifications === 'string') {
        try {
          parsedSpecs = JSON.parse(specifications);
        } catch (_) {}
      }
      accessory.specifications = { ...accessory.specifications, ...parsedSpecs };
    }

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const newImages = req.files.map((file) => `/uploads/${file.filename}`);
      accessory.images = [...accessory.images, ...newImages];
    }

    await accessory.save();

    const updatedAccessory = await Accessory.findById(accessory._id)
      .populate('brand', 'name logo')
      .populate('accessoryType', 'name icon');

    res.json({ message: 'Accessory updated successfully', accessory: updatedAccessory });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete Accessory
 * @route   DELETE /api/accessories/:id
 * @access  Private/Admin
 */
const deleteAccessory = async (req, res, next) => {
  try {
    const accessory = await Accessory.findByIdAndDelete(req.params.id);
    if (!accessory) {
      return res.status(404).json({ message: 'Accessory not found' });
    }
    res.json({ message: 'Accessory deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate AI Description for Accessory
 * @route   POST /api/accessories/generate-description
 * @access  Public / Admin
 */
const generateAccessoryDescription = async (req, res, next) => {
  try {
    const { name, brand, accessoryType, specifications } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Accessory name is required to generate AI description' });
    }

    const { generateAiDescription } = require('../utils/aiGenerator');
    const description = await generateAiDescription({
      name: name.trim(),
      brand,
      category: 'accessories',
      subcategory: accessoryType,
      specifications,
    });

    return res.status(200).json({ description });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAccessory,
  getAccessories,
  getAccessoryById,
  updateAccessory,
  deleteAccessory,
  generateAccessoryDescription,
};
