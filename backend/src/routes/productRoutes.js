const express = require('express');
const router = express.Router();
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  generateProductDescription,
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public routes
router.get('/', getProducts);
router.post('/generate-description', generateProductDescription);
router.get('/:id', getProductById);

// Protected Admin routes
router.post('/', protect, authorize('ADMIN'), upload.array('images', 5), createProduct);
router.put('/:id', protect, authorize('ADMIN'), upload.array('images', 5), updateProduct);
router.delete('/:id', protect, authorize('ADMIN'), deleteProduct);

module.exports = router;
