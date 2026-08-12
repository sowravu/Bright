const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema(
  {
    color: { type: String, default: '' },
    ram: { type: String, default: '' },
    storage: { type: String, default: '' },
    price: { type: Number, required: true, default: 0, min: 0 },
    discountPrice: { type: Number, default: 0, min: 0 },
    stock: { type: Number, required: true, default: 0, min: 0 },
    image: { type: String, default: '' },
    sku: { type: String, default: '' },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: [true, 'Brand reference is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['smartphones', 'tablets', 'laptops', 'wearables', 'others'],
      default: 'smartphones',
    },
    price: {
      type: Number,
      default: 0,
      min: [0, 'Price cannot be negative'],
    },
    discountPrice: {
      type: Number,
      default: 0,
      min: [0, 'Discount price cannot be negative'],
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    colorVariants: {
      type: [String],
      default: [],
    },
    ramVariants: {
      type: [String],
      default: [],
    },
    storageVariants: {
      type: [String],
      default: [],
    },
    colorImages: {
      type: Map,
      of: String,
      default: {},
    },
    variants: [variantSchema],
    images: {
      type: [String],
      default: [],
    },
    specifications: {
      ram: { type: String, default: '' },
      storage: { type: String, default: '' },
      color: { type: String, default: '' },
      camera: { type: String, default: '' },
      battery: { type: String, default: '' },
      processor: { type: String, default: '' },
      warranty: { type: String, default: '1 Year Brand Warranty' },
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
