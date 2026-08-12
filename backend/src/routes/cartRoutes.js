const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getCart,
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
  validateCoupon,
  checkoutOrder,
} = require('../controllers/cartController');

router.get('/', protect, getCart);
router.post('/', protect, addToCart);
router.put('/:itemId', protect, updateCartItemQuantity);
router.delete('/:itemId', protect, removeFromCart);
router.delete('/', protect, clearCart);
router.post('/coupon', validateCoupon);
router.post('/checkout', protect, checkoutOrder);

module.exports = router;
