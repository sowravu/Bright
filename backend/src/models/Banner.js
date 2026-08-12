const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      default: 'Welcome to Bright Mobile',
    },
    description: {
      type: String,
      required: true,
      default:
        'Discover premium smartphones, wireless earbuds, fast chargers, and accessories with official brand warranty.',
    },
    badge: {
      type: String,
      default: 'Official Mobile & Accessories Store',
    },
    image: {
      type: String,
      default: '',
    },
    ctaText: {
      type: String,
      default: 'Explore Catalog',
    },
    ctaLink: {
      type: String,
      default: '/products',
    },
    buttonColor: {
      type: String,
      default: '#2563eb', // Default Bright Primary Blue
    },
    buttonTextColor: {
      type: String,
      default: '#ffffff',
    },
    secondaryCtaText: {
      type: String,
      default: 'Admin Store Manager',
    },
    secondaryCtaLink: {
      type: String,
      default: '/admin',
    },
    showSecondaryBtn: {
      type: Boolean,
      default: false,
    },
    templateName: {
      type: String,
      default: 'default',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Banner', bannerSchema);
