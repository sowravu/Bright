const express = require('express');
const bannerController = require('../controllers/bannerController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Public route to fetch current active banner
router.get('/', bannerController.getBanner);

// Protected admin routes to edit or reset banner
router.put('/', protect, authorize('ADMIN'), bannerController.updateBanner);
router.post('/reset', protect, authorize('ADMIN'), bannerController.resetBanner);

module.exports = router;
