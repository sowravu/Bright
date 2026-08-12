const express = require('express');
const router = express.Router();
const {
  createAccessoryType,
  getAccessoryTypes,
  getAccessoryTypeById,
  updateAccessoryType,
  deleteAccessoryType,
} = require('../controllers/accessoryTypeController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public routes
router.get('/', getAccessoryTypes);
router.get('/:id', getAccessoryTypeById);

// Protected Admin routes
router.post('/', protect, authorize('ADMIN'), upload.single('icon'), createAccessoryType);
router.put('/:id', protect, authorize('ADMIN'), upload.single('icon'), updateAccessoryType);
router.delete('/:id', protect, authorize('ADMIN'), deleteAccessoryType);

module.exports = router;
