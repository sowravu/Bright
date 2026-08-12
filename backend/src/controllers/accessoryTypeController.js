const AccessoryType = require('../models/AccessoryType');

/**
 * @desc    Create a new Accessory Type
 * @route   POST /api/accessory-types
 * @access  Private/Admin
 */
const createAccessoryType = async (req, res, next) => {
  try {
    const { name, description, icon } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Accessory Type name is required' });
    }

    const existing = await AccessoryType.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
    });
    if (existing) {
      return res.status(400).json({ message: 'An accessory type with this name already exists' });
    }

    let iconPath = icon || '';
    if (req.file) {
      iconPath = `/uploads/${req.file.filename}`;
    }

    const accessoryType = await AccessoryType.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      icon: iconPath,
    });

    res.status(201).json({
      message: 'Accessory Type created successfully',
      accessoryType,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all Accessory Types
 * @route   GET /api/accessory-types
 * @access  Public
 */
const getAccessoryTypes = async (req, res, next) => {
  try {
    const { activeOnly } = req.query;
    const filter = activeOnly === 'true' ? { isActive: true } : {};
    const accessoryTypes = await AccessoryType.find(filter).sort({ name: 1 });
    res.json({ count: accessoryTypes.length, accessoryTypes });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single Accessory Type by ID
 * @route   GET /api/accessory-types/:id
 * @access  Public
 */
const getAccessoryTypeById = async (req, res, next) => {
  try {
    const accessoryType = await AccessoryType.findById(req.params.id);
    if (!accessoryType) {
      return res.status(404).json({ message: 'Accessory Type not found' });
    }
    res.json(accessoryType);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update Accessory Type
 * @route   PUT /api/accessory-types/:id
 * @access  Private/Admin
 */
const updateAccessoryType = async (req, res, next) => {
  try {
    const accessoryType = await AccessoryType.findById(req.params.id);
    if (!accessoryType) {
      return res.status(404).json({ message: 'Accessory Type not found' });
    }

    const { name, description, icon, isActive } = req.body;

    if (name && name.trim() !== accessoryType.name) {
      const existing = await AccessoryType.findOne({
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        _id: { $ne: accessoryType._id },
      });
      if (existing) {
        return res.status(400).json({ message: 'Another accessory type with this name already exists' });
      }
      accessoryType.name = name.trim();
    }

    if (description !== undefined) accessoryType.description = description.trim();
    if (isActive !== undefined) accessoryType.isActive = isActive === 'true' || isActive === true;
    if (icon !== undefined) accessoryType.icon = icon;

    if (req.file) {
      accessoryType.icon = `/uploads/${req.file.filename}`;
    }

    await accessoryType.save();
    res.json({ message: 'Accessory Type updated successfully', accessoryType });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete Accessory Type
 * @route   DELETE /api/accessory-types/:id
 * @access  Private/Admin
 */
const deleteAccessoryType = async (req, res, next) => {
  try {
    const accessoryType = await AccessoryType.findByIdAndDelete(req.params.id);
    if (!accessoryType) {
      return res.status(404).json({ message: 'Accessory Type not found' });
    }
    res.json({ message: 'Accessory Type deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAccessoryType,
  getAccessoryTypes,
  getAccessoryTypeById,
  updateAccessoryType,
  deleteAccessoryType,
};
