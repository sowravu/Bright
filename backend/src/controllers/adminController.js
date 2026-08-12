const User = require('../models/User');
const Product = require('../models/Product');
const Accessory = require('../models/Accessory');
const Brand = require('../models/Brand');

/**
 * @desc    Get all registered users for Admin directory
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    const formatted = users.map((u) => ({
      id: u._id.toString(),
      _id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status || 'ACTIVE',
      joinedDate: u.createdAt ? u.createdAt.toISOString().split('T')[0] : '2026-01-01',
    }));
    res.json({ count: formatted.length, users: formatted });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle block/unblock status for a user account
 * @route   PUT /api/admin/users/:id/block
 * @access  Private/Admin
 */
const toggleUserBlock = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'ADMIN') {
      return res.status(400).json({ message: 'Cannot block primary administrator account' });
    }

    user.status = user.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED';
    await user.save();

    res.json({
      message: `User ${user.email} is now ${user.status}`,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Admin Dashboard & Analytics statistics
 * @route   GET /api/admin/analytics
 * @access  Private/Admin
 */
const getAnalytics = async (req, res, next) => {
  try {
    const [productsCount, accessoriesCount, usersCount, brandsCount, lowStockProducts] = await Promise.all([
      Product.countDocuments({}),
      Accessory.countDocuments({}),
      User.countDocuments({}),
      Brand.countDocuments({}),
      Product.countDocuments({ stock: { $lte: 5 } }),
    ]);

    const monthlySalesData = [
      { month: 'Jan', smartphones: 28000, accessories: 5000, total: 33000 },
      { month: 'Feb', smartphones: 34000, accessories: 7500, total: 41500 },
      { month: 'Mar', smartphones: 45000, accessories: 9200, total: 54200 },
      { month: 'Apr', smartphones: 38000, accessories: 8100, total: 46100 },
      { month: 'May', smartphones: 52000, accessories: 11000, total: 63000 },
      { month: 'Jun', smartphones: 68000, accessories: 14500, total: 82500 },
      { month: 'Jul', smartphones: 119998, accessories: 27000, total: 146998 },
    ];

    res.json({
      summary: {
        totalSales: 146998,
        totalOrders: 14,
        usersCount,
        productsCount: productsCount + accessoriesCount,
        smartphonesCount: productsCount,
        accessoriesCount,
        brandsCount,
        lowStockCount: lowStockProducts,
      },
      monthlySalesData,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  toggleUserBlock,
  getAnalytics,
};
