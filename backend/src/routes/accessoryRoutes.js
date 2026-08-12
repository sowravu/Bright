const express = require('express');
const router = express.Router();
const {
  createAccessory,
  getAccessories,
  getAccessoryById,
  updateAccessory,
  deleteAccessory,
  generateAccessoryDescription,
} = require('../controllers/accessoryController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public routes
router.get('/', getAccessories);
router.post('/generate-description', generateAccessoryDescription);
router.get('/:id', getAccessoryById);

// Protected Admin routes
router.post('/', protect, authorize('ADMIN'), upload.array('images', 5), createAccessory);
router.put('/:id', protect, authorize('ADMIN'), upload.array('images', 5), updateAccessory);
router.delete('/:id', protect, authorize('ADMIN'), deleteAccessory);

module.exports = router;
