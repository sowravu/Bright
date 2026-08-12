const Brand = require('../models/Brand');

/**
 * @desc    Create a new Brand
 * @route   POST /api/brands
 * @access  Private/Admin
 */
const createBrand = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Brand name is required' });
    }

    const existing = await Brand.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
    if (existing) {
      return res.status(400).json({ message: 'A brand with this name already exists' });
    }

    let logoPath = '';
    if (req.file) {
      logoPath = `/uploads/${req.file.filename}`;
    }

    const brand = await Brand.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      logo: logoPath,
    });

    res.status(201).json({
      message: 'Brand created successfully',
      brand,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all Brands
 * @route   GET /api/brands
 * @access  Public
 */
const getBrands = async (req, res, next) => {
  try {
    const { activeOnly } = req.query;
    const filter = activeOnly === 'true' ? { isActive: true } : {};
    const brands = await Brand.find(filter).sort({ name: 1 });
    res.json({ count: brands.length, brands });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single Brand by ID
 * @route   GET /api/brands/:id
 * @access  Public
 */
const getBrandById = async (req, res, next) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }
    res.json(brand);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update Brand
 * @route   PUT /api/brands/:id
 * @access  Private/Admin
 */
const updateBrand = async (req, res, next) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }

    const { name, description, isActive } = req.body;

    if (name && name.trim() !== brand.name) {
      const existing = await Brand.findOne({
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        _id: { $ne: brand._id },
      });
      if (existing) {
        return res.status(400).json({ message: 'Another brand with this name already exists' });
      }
      brand.name = name.trim();
    }

    if (description !== undefined) brand.description = description.trim();
    if (isActive !== undefined) brand.isActive = isActive === 'true' || isActive === true;

    if (req.file) {
      brand.logo = `/uploads/${req.file.filename}`;
    }

    await brand.save();
    res.json({ message: 'Brand updated successfully', brand });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete Brand
 * @route   DELETE /api/brands/:id
 * @access  Private/Admin
 */
const deleteBrand = async (req, res, next) => {
  try {
    const brand = await Brand.findByIdAndDelete(req.params.id);
    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }
    res.json({ message: 'Brand deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBrand,
  getBrands,
  getBrandById,
  updateBrand,
  deleteBrand,
};
