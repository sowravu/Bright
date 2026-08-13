const Order = require('../models/Order');
const { restoreStockForOrder } = require('../utils/stockManager');

/**
 * @desc    Get current user's orders from DB
 * @route   GET /api/orders/my-orders
 * @access  Private
 */
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel an order by ID (if not delivered or already cancelled)
 * @route   PUT /api/orders/:orderId/cancel
 * @access  Private
 */
const cancelOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.orderStatus === 'Delivered') {
      return res.status(400).json({ message: 'Delivered orders cannot be cancelled.' });
    }

    if (order.orderStatus === 'Cancelled') {
      return res.status(400).json({ message: 'Order is already cancelled.' });
    }

    order.orderStatus = 'Cancelled';
    await order.save();

    // Atomically restore product/accessory stock to MongoDB upon order cancellation
    if (order.items && order.items.length > 0) {
      await restoreStockForOrder(order.items);
    }

    res.json({ message: 'Order cancelled successfully', order });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyOrders,
  cancelOrder,
};
