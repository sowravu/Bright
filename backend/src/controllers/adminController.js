const User = require('../models/User');
const Product = require('../models/Product');
const Accessory = require('../models/Accessory');
const Brand = require('../models/Brand');
const Order = require('../models/Order');

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
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      productsCount,
      accessoriesCount,
      usersCount,
      customersCount,
      brandsCount,
      lowStockProducts,
      ordersSummary,
      todayOrdersCount,
      allValidOrders,
    ] = await Promise.all([
      Product.countDocuments({}),
      Accessory.countDocuments({}),
      User.countDocuments({}),
      User.countDocuments({ role: { $in: ['USER', 'user'] } }),
      Brand.countDocuments({}),
      Product.countDocuments({ stock: { $lte: 5 } }),
      // Calculate real total revenue and completed orders
      Order.aggregate([
        {
          $group: {
            _id: null,
            totalSales: {
              $sum: {
                $cond: [{ $ne: ['$orderStatus', 'Cancelled'] }, '$totalAmount', 0],
              },
            },
            totalOrders: { $sum: 1 },
            completedOrders: {
              $sum: {
                $cond: [{ $eq: ['$orderStatus', 'Delivered'] }, 1, 0],
              },
            },
          },
        },
      ]),
      Order.countDocuments({ createdAt: { $gte: startOfToday } }),
      Order.find({ orderStatus: { $ne: 'Cancelled' } }).select('items totalAmount createdAt'),
    ]);

    const salesStats = ordersSummary[0] || {
      totalSales: 0,
      totalOrders: 0,
      completedOrders: 0,
    };

    // Calculate real monthly and category revenue from valid orders
    const currentYear = new Date().getFullYear();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlySalesMap = {};
    monthNames.forEach((m) => {
      monthlySalesMap[m] = { smartphones: 0, accessories: 0, total: 0 };
    });

    let smartphonesRevenue = 0;
    let accessoriesRevenue = 0;

    (allValidOrders || []).forEach((order) => {
      const orderDate = new Date(order.createdAt);
      const isCurrentYear = orderDate.getFullYear() === currentYear;
      const monthName = monthNames[orderDate.getMonth()];

      let orderSmartphones = 0;
      let orderAccessories = 0;

      (order.items || []).forEach((item) => {
        const itemTotal = (item.price || 0) * (item.quantity || 1);
        if (item.ram || item.storage) {
          orderSmartphones += itemTotal;
        } else {
          orderAccessories += itemTotal;
        }
      });

      if (orderSmartphones === 0 && orderAccessories === 0) {
        orderSmartphones = order.totalAmount || 0;
      }

      smartphonesRevenue += orderSmartphones;
      accessoriesRevenue += orderAccessories;

      if (isCurrentYear && monthlySalesMap[monthName]) {
        monthlySalesMap[monthName].smartphones += orderSmartphones;
        monthlySalesMap[monthName].accessories += orderAccessories;
        monthlySalesMap[monthName].total += (order.totalAmount || (orderSmartphones + orderAccessories));
      }
    });

    const monthlySalesData = monthNames.map((month) => ({
      month,
      smartphones: monthlySalesMap[month].smartphones,
      accessories: monthlySalesMap[month].accessories,
      total: monthlySalesMap[month].total,
    }));

    res.json({
      summary: {
        totalSales: salesStats.totalSales || 0,
        totalOrders: salesStats.totalOrders || 0,
        completedOrders: salesStats.completedOrders || 0,
        todayOrders: todayOrdersCount || 0,
        usersCount: customersCount > 0 ? customersCount : usersCount,
        allUsersCount: usersCount,
        productsCount: productsCount + accessoriesCount,
        smartphonesCount: productsCount,
        accessoriesCount,
        brandsCount,
        lowStockCount: lowStockProducts,
        smartphonesRevenue,
        accessoriesRevenue,
      },
      monthlySalesData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all customer orders for Admin portal
 * @route   GET /api/admin/orders
 * @access  Private/Admin
 */
const getAllOrders = async (req, res, next) => {
  try {
    const Order = require('../models/Order');
    const orders = await Order.find({})
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update order fulfillment status and delivery date/time
 * @route   PUT /api/admin/orders/:orderId/status
 * @access  Private/Admin
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const Order = require('../models/Order');
    const { restoreStockForOrder } = require('../utils/stockManager');
    const { orderStatus, estimatedDeliveryDate, deliveredAt } = req.body;
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const previousStatus = order.orderStatus;

    if (orderStatus) {
      order.orderStatus = orderStatus;
      if (orderStatus === 'Delivered') {
        order.deliveredAt = deliveredAt ? new Date(deliveredAt) : new Date();
      }
    }

    if (estimatedDeliveryDate !== undefined) {
      order.estimatedDeliveryDate = estimatedDeliveryDate;
    }

    if (deliveredAt !== undefined && orderStatus !== 'Delivered') {
      order.deliveredAt = deliveredAt ? new Date(deliveredAt) : null;
    }

    await order.save();

    // If admin set status to Cancelled from an active status, restore inventory stock
    if (orderStatus === 'Cancelled' && previousStatus !== 'Cancelled' && order.items && order.items.length > 0) {
      await restoreStockForOrder(order.items);
    }

    res.json({ message: 'Order status updated successfully', order });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  toggleUserBlock,
  getAnalytics,
  getAllOrders,
  updateOrderStatus,
};
