const Banner = require('../models/Banner');

const defaultBannerData = {
  title: 'Welcome to Bright Mobile',
  description:
    'Discover premium smartphones, wireless earbuds, fast chargers, and accessories with official brand warranty.',
  badge: 'Official Mobile & Accessories Store',
  image: '',
  ctaText: 'Explore Catalog',
  ctaLink: '/products',
  buttonColor: '#2563eb',
  buttonTextColor: '#ffffff',
  secondaryCtaText: 'Admin Store Manager',
  secondaryCtaLink: '/admin',
  showSecondaryBtn: false,
  templateName: 'default',
  isActive: true,
};

// @desc    Get active homepage banner
// @route   GET /api/banner
// @access  Public
exports.getBanner = async (req, res) => {
  try {
    let banner = await Banner.findOne({ isActive: true }).sort({ updatedAt: -1 });
    if (!banner) {
      return res.json(defaultBannerData);
    }
    res.json(banner);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error fetching banner' });
  }
};

// @desc    Update or create homepage banner
// @route   PUT /api/banner
// @access  Private/Admin
exports.updateBanner = async (req, res) => {
  try {
    const {
      title,
      description,
      badge,
      image,
      ctaText,
      ctaLink,
      buttonColor,
      buttonTextColor,
      secondaryCtaText,
      secondaryCtaLink,
      showSecondaryBtn,
      templateName,
      isActive,
    } = req.body;

    let banner = await Banner.findOne({ isActive: true }).sort({ updatedAt: -1 });

    if (banner) {
      if (title !== undefined) banner.title = title;
      if (description !== undefined) banner.description = description;
      if (badge !== undefined) banner.badge = badge;
      if (image !== undefined) banner.image = image;
      if (ctaText !== undefined) banner.ctaText = ctaText;
      if (ctaLink !== undefined) banner.ctaLink = ctaLink;
      if (buttonColor !== undefined) banner.buttonColor = buttonColor;
      if (buttonTextColor !== undefined) banner.buttonTextColor = buttonTextColor;
      if (secondaryCtaText !== undefined) banner.secondaryCtaText = secondaryCtaText;
      if (secondaryCtaLink !== undefined) banner.secondaryCtaLink = secondaryCtaLink;
      if (showSecondaryBtn !== undefined) banner.showSecondaryBtn = showSecondaryBtn;
      if (templateName !== undefined) banner.templateName = templateName;
      if (isActive !== undefined) banner.isActive = isActive;

      const updatedBanner = await banner.save();
      return res.json(updatedBanner);
    } else {
      banner = new Banner({
        title: title || defaultBannerData.title,
        description: description || defaultBannerData.description,
        badge: badge !== undefined ? badge : defaultBannerData.badge,
        image: image || defaultBannerData.image,
        ctaText: ctaText || defaultBannerData.ctaText,
        ctaLink: ctaLink || defaultBannerData.ctaLink,
        buttonColor: buttonColor || defaultBannerData.buttonColor,
        buttonTextColor: buttonTextColor || defaultBannerData.buttonTextColor,
        secondaryCtaText: secondaryCtaText || defaultBannerData.secondaryCtaText,
        secondaryCtaLink: secondaryCtaLink || defaultBannerData.secondaryCtaLink,
        showSecondaryBtn: showSecondaryBtn !== undefined ? showSecondaryBtn : false,
        templateName: templateName || defaultBannerData.templateName,
        isActive: isActive !== undefined ? isActive : true,
      });

      const savedBanner = await banner.save();
      return res.status(201).json(savedBanner);
    }
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update banner' });
  }
};

// @desc    Reset banner to default system banner
// @route   POST /api/banner/reset
// @access  Private/Admin
exports.resetBanner = async (req, res) => {
  try {
    await Banner.deleteMany({});
    const banner = new Banner(defaultBannerData);
    const savedBanner = await banner.save();
    res.json(savedBanner);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to reset banner' });
  }
};
