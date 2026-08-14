const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Order = require('../models/Order');

/**
 * @desc    Get user's cart from DB
 * @route   GET /api/cart
 * @access  Private
 */
const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }
    res.json(cart);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add item or sync items to user's cart
 * @route   POST /api/cart
 * @access  Private
 */
const addToCart = async (req, res, next) => {
  try {
    const { productId, variantId, name, image, brand, ram, storage, color, price, quantity } = req.body;

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const existingIndex = cart.items.findIndex((i) => {
      if (String(i.productId) !== String(productId)) return false;
      if (variantId && i.variantId) return String(i.variantId) === String(variantId);
      const sameColor = (i.color || '').trim().toLowerCase() === (color || '').trim().toLowerCase();
      const sameRam = (i.ram || '').trim().toLowerCase() === (ram || '').trim().toLowerCase();
      const sameStorage = (i.storage || '').trim().toLowerCase() === (storage || '').trim().toLowerCase();
      return sameColor && sameRam && sameStorage;
    });

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += Number(quantity || 1);
    } else {
      cart.items.push({
        productId,
        variantId: variantId || '',
        name,
        image: image || '',
        brand: brand || '',
        ram: ram || '',
        storage: storage || '',
        color: color || '',
        price: Number(price || 0),
        quantity: Number(quantity || 1),
      });
    }

    await cart.save();
    res.json(cart);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update quantity of specific cart item
 * @route   PUT /api/cart/:itemId
 * @access  Private
 */
const updateCartItemQuantity = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const itemId = req.params.itemId;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    item.quantity = Math.max(1, Number(quantity));
    await cart.save();
    res.json(cart);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove item from cart
 * @route   DELETE /api/cart/:itemId
 * @access  Private
 */
const removeFromCart = async (req, res, next) => {
  try {
    const itemId = req.params.itemId;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter((i) => String(i._id) !== String(itemId) && String(i.productId) !== String(itemId));
    await cart.save();
    res.json(cart);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Clear user's cart
 * @route   DELETE /api/cart
 * @access  Private
 */
const clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      cart.coupon = { code: '', discount: 0, isPercent: false };
      await cart.save();
    }
    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Validate and apply promo coupon
 * @route   POST /api/cart/coupon
 * @access  Public / Private
 */
const validateCoupon = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ message: 'Coupon code is required' });
    }

    const upper = code.trim().toUpperCase();
    let couponData = null;

    if (upper === 'WELCOME10') {
      couponData = { code: 'WELCOME10', discount: 10, isPercent: true };
    } else if (upper === 'BRIGHTFEST') {
      couponData = { code: 'BRIGHTFEST', discount: 2000, isPercent: false };
    } else if (upper === 'FLAT500') {
      couponData = { code: 'FLAT500', discount: 500, isPercent: false };
    } else {
      return res.status(400).json({ message: 'Invalid or expired promo code' });
    }

    if (req.user) {
      const cart = await Cart.findOne({ user: req.user._id });
      if (cart) {
        cart.coupon = couponData;
        await cart.save();
      }
    }

    res.json(couponData);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Process checkout and place Order in DB
 * @route   POST /api/cart/checkout
 * @access  Private
 */
const { decrementStockForOrder } = require('../utils/stockManager');

const checkoutOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, paymentMethod, couponCode } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'No items in order checkout' });
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.street || !shippingAddress.city) {
      return res.status(400).json({ message: 'Valid shipping address is required' });
    }

    // Atomically decrement product/accessory inventory stock in MongoDB (Race Condition Safe)
    await decrementStockForOrder(items);

    const subtotal = items.reduce((sum, i) => sum + Number(i.price) * Number(i.quantity), 0);
    
    let discount = 0;
    if (couponCode) {
      const upper = couponCode.trim().toUpperCase();
      if (upper === 'WELCOME10') discount = Math.round(subtotal * 0.1);
      else if (upper === 'BRIGHTFEST') discount = 2000;
      else if (upper === 'FLAT500') discount = 500;
    }

    const shippingFee = subtotal > 5000 || subtotal === 0 ? 0 : 150;
    const totalAmount = Math.max(0, subtotal - discount + shippingFee);

    const orderNumber = `BRIGHT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const order = await Order.create({
      orderNumber,
      user: req.user._id,
      items: items.map((i) => ({
        productId: mongoose.isValidObjectId(i.productId) ? i.productId : null,
        variantId: i.variantId || '',
        name: i.name,
        image: i.image || '',
        brand: i.brand || '',
        ram: i.ram || '',
        storage: i.storage || '',
        color: i.color || '',
        price: Number(i.price),
        quantity: Number(i.quantity),
      })),
      shippingAddress: {
        fullName: shippingAddress.fullName,
        phone: shippingAddress.phone || '9876543210',
        street: shippingAddress.street,
        city: shippingAddress.city,
        state: shippingAddress.state || 'State',
        postalCode: shippingAddress.postalCode || '100001',
        addressLabel: shippingAddress.addressLabel || 'Home',
      },
      paymentMethod: paymentMethod || 'Stripe',
      paymentStatus: 'Paid',
      orderStatus: 'Processing',
      subtotal,
      discount,
      shippingFee,
      totalAmount,
      couponCode: couponCode || '',
    });

    // Clear cart in DB
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      cart.coupon = { code: '', discount: 0, isPercent: false };
      await cart.save();
    }

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
  validateCoupon,
  checkoutOrder,
};
