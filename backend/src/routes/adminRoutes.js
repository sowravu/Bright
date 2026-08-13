const express = require('express');
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require ADMIN role authorization
router.use(protect);
router.use(authorize('ADMIN'));

router.get('/users', adminController.getUsers);
router.put('/users/:id/block', adminController.toggleUserBlock);
router.get('/analytics', adminController.getAnalytics);

// Order Management Routes
router.get('/orders', adminController.getAllOrders);
router.put('/orders/:orderId/status', adminController.updateOrderStatus);

module.exports = router;
