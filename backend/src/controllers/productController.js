const mongoose = require('mongoose');
const Product = require('../models/Product');
const Brand = require('../models/Brand');

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
      if (Array.isArray(parsed)) return parsed;
    } catch (_) {}
  }

  return list.map((v) => ({
    color: v.color || '',
    ram: v.ram || '',
    storage: v.storage || '',
    price: v.price !== undefined && v.price !== '' ? Number(v.price) : Number(defaultPrice),
    discountPrice: v.discountPrice !== undefined && v.discountPrice !== '' ? Number(v.discountPrice) : (v.price !== undefined ? Number(v.price) : Number(defaultDiscount)),
    stock: Number(v.stock) || 0,
    image: v.image || '',
    sku: v.sku || '',
  }));
};

/**
 * @desc    Create a new Product (Smartphone / Device)
 * @route   POST /api/products
 * @access  Private/Admin
 */
const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      brand,
      category,
      price,
      discountPrice,
      stock,
      description,
      colorVariants,
      ramVariants,
      storageVariants,
      colorImages,
      variants,
      specifications,
      isFeatured,
      images: imageUrls,
    } = req.body;

    if (!name || !brand) {
      return res.status(400).json({ message: 'Product name and brand are required' });
    }

    // Resolve Brand ID or auto-create if passed as string name
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

    const product = await Product.create({
      name: name.trim(),
      brand: brandId,
      category: category || 'smartphones',
      price: basePrice,
      discountPrice: baseDiscount,
      stock: totalStock,
      description: description ? description.trim() : '',
      colorVariants: parseArray(colorVariants),
      ramVariants: parseArray(ramVariants),
      storageVariants: parseArray(storageVariants),
      colorImages: parsedColorImages,
      variants: parsedVariantsList,
      images: imagePaths,
      specifications: parsedSpecs,
      isFeatured: isFeatured === 'true' || isFeatured === true,
    });

    const populatedProduct = await Product.findById(product._id).populate('brand', 'name logo');

    res.status(201).json({
      message: 'Product created successfully',
      product: populatedProduct,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all Products
 * @route   GET /api/products
 * @access  Public
 */
const getProducts = async (req, res, next) => {
  try {
    const { category, brand, search, activeOnly, page = 1, limit = 100 } = req.query;
    const filter = {};

    if (activeOnly === 'true') filter.isActive = true;
    if (category) filter.category = category;

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

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('brand', 'name logo')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    res.json({
      count: products.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      products,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single Product by ID
 * @route   GET /api/products/:id
 * @access  Public
 */
const getProductById = async (req, res, next) => {
  try {
    const id = req.params.id;
    let product = null;

    if (mongoose.isValidObjectId(id)) {
      product = await Product.findById(id).populate('brand', 'name logo');
      if (!product) {
        const Accessory = require('../models/Accessory');
        product = await Accessory.findById(id).populate('brand', 'name logo').populate('accessoryType', 'name');
      }
    }

    if (!product) {
      product = await Product.findOne({
        $or: [{ slug: id }, { name: new RegExp('^' + id.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + '$', 'i') }]
      }).populate('brand', 'name logo');
    }

    if (!product) {
      const Accessory = require('../models/Accessory');
      product = await Accessory.findOne({
        $or: [{ slug: id }, { name: new RegExp('^' + id.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + '$', 'i') }]
      }).populate('brand', 'name logo').populate('accessoryType', 'name');
    }

    if (!product) {
      return res.status(404).json({ message: 'Product or Accessory not found' });
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update Product
 * @route   PUT /api/products/:id
 * @access  Private/Admin
 */
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const {
      name,
      brand,
      category,
      price,
      discountPrice,
      stock,
      description,
      colorVariants,
      ramVariants,
      storageVariants,
      colorImages,
      variants,
      specifications,
      isFeatured,
      isActive,
    } = req.body;

    if (name) product.name = name.trim();
    if (brand) {
      if (mongoose.Types.ObjectId.isValid(brand)) {
        product.brand = brand;
      } else {
        let brandDoc = await Brand.findOne({ name: { $regex: new RegExp(`^${String(brand).trim()}$`, 'i') } });
        if (!brandDoc) {
          brandDoc = await Brand.create({ name: String(brand).trim() });
        }
        product.brand = brandDoc._id;
      }
    }
    if (category) product.category = category;
    if (description !== undefined) product.description = description.trim();
    if (colorVariants !== undefined) product.colorVariants = parseArray(colorVariants);
    if (ramVariants !== undefined) product.ramVariants = parseArray(ramVariants);
    if (storageVariants !== undefined) product.storageVariants = parseArray(storageVariants);
    if (isFeatured !== undefined) product.isFeatured = isFeatured === 'true' || isFeatured === true;
    if (isActive !== undefined) product.isActive = isActive === 'true' || isActive === true;

    if (colorImages !== undefined) {
      let parsedColorImages = {};
      if (typeof colorImages === 'string') {
        try {
          parsedColorImages = JSON.parse(colorImages);
        } catch (_) {}
      } else if (typeof colorImages === 'object' && colorImages !== null) {
        parsedColorImages = colorImages;
      }
      product.colorImages = parsedColorImages;
    }

    if (variants !== undefined) {
      const parsedVariantsList = parseVariants(variants, product.price, product.discountPrice);
      product.variants = parsedVariantsList;
      if (parsedVariantsList.length > 0) {
        product.stock = parsedVariantsList.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
        product.price = parsedVariantsList[0].price || product.price;
        product.discountPrice = parsedVariantsList[0].discountPrice || product.price;
      } else if (stock !== undefined) {
        product.stock = Number(stock);
      }
    } else {
      if (price !== undefined) product.price = Number(price);
      if (discountPrice !== undefined) product.discountPrice = Number(discountPrice);
      if (stock !== undefined) product.stock = Number(stock);
    }

    if (specifications) {
      let parsedSpecs = specifications;
      if (typeof specifications === 'string') {
        try {
          parsedSpecs = JSON.parse(specifications);
        } catch (_) {}
      }
      product.specifications = { ...product.specifications, ...parsedSpecs };
    }

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const newImages = req.files.map((file) => `/uploads/${file.filename}`);
      product.images = [...product.images, ...newImages];
    }

    await product.save();

    const updatedProduct = await Product.findById(product._id).populate('brand', 'name logo');

    res.json({ message: 'Product updated successfully', product: updatedProduct });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete Product
 * @route   DELETE /api/products/:id
 * @access  Private/Admin
 */
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate AI Description for Product / Smartphone
 * @route   POST /api/products/generate-description
 * @access  Public / Admin
 */
const generateProductDescription = async (req, res, next) => {
  try {
    const { name, brand, category, subcategory, specifications } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Product name is required to generate AI description' });
    }

    const { generateAiData } = require('../utils/aiGenerator');
    const result = await generateAiData({
      name: name.trim(),
      brand,
      category: category || 'smartphones',
      subcategory,
      specifications,
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  generateProductDescription,
};
