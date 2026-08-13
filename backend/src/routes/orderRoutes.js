const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getMyOrders, cancelOrder } = require('../controllers/orderController');

router.get('/my-orders', protect, getMyOrders);
router.put('/:orderId/cancel', protect, cancelOrder);

module.exports = router;
