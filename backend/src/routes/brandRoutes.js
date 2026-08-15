const express = require('express');
const router = express.Router();
const {
  createBrand,
  getBrands,
  getBrandById,
  updateBrand,
  deleteBrand,
  generateAiLogo,
} = require('../controllers/brandController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public routes
router.get('/', getBrands);
router.get('/:id', getBrandById);

// Protected Admin routes
router.post('/ai-logo', protect, authorize('ADMIN'), generateAiLogo);
router.post('/', protect, authorize('ADMIN'), upload.single('logo'), createBrand);
router.put('/:id', protect, authorize('ADMIN'), upload.single('logo'), updateBrand);
router.delete('/:id', protect, authorize('ADMIN'), deleteBrand);

module.exports = router;
