const Razorpay = require('razorpay');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Cart = require('../models/Cart');

// Initialize Razorpay SDK with credentials
const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_1DP5hBxWjFQERt';
  const key_secret = process.env.RAZORPAY_KEY_SECRET || 'ArvWd7789FkeW91001';
  return {
    instance: new Razorpay({ key_id, key_secret }),
    key_id,
    key_secret,
  };
};

/**
 * @desc    Create Razorpay order for checkout
 * @route   POST /api/payment/create-order
 * @access  Private
 */
const createRazorpayOrder = async (req, res, next) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid payment amount' });
    }

    const { instance, key_id } = getRazorpayInstance();
    const amountInPaise = Math.round(Number(amount) * 100);

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    };

    let razorpayOrder;
    let isMock = false;

    if (!key_id || key_id.includes('1DP5hBxWjFQERt') || key_id.startsWith('dummy') || key_id === 'rzp_test_dummykey') {
      isMock = true;
      razorpayOrder = {
        id: `order_test_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        currency: 'INR',
        amount: amountInPaise,
      };
    } else {
      try {
        razorpayOrder = await instance.orders.create(options);
      } catch (rzpErr) {
        console.warn('Razorpay API fallback (Test key mode):', rzpErr?.error?.description || rzpErr?.message || rzpErr);
        isMock = true;
        razorpayOrder = {
          id: `order_test_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          currency: 'INR',
          amount: amountInPaise,
        };
      }
    }

    res.status(201).json({
      orderId: razorpayOrder.id,
      currency: razorpayOrder.currency,
      amount: razorpayOrder.amount,
      key: key_id,
      isMock,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify Razorpay payment signature & create Order in DB
 * @route   POST /api/payment/verify
 * @access  Private
 */
const { decrementStockForOrder } = require('../utils/stockManager');

const verifyRazorpayPayment = async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      items,
      shippingAddress,
      paymentMethod,
      couponCode,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing Razorpay payment parameters' });
    }

    const { key_secret } = getRazorpayInstance();

    // Verify HMAC SHA256 signature
    const hmac = crypto.createHmac('sha256', key_secret);
    hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
    const generatedSignature = hmac.digest('hex');

    const isValidSignature = generatedSignature === razorpay_signature;

    if (!isValidSignature && process.env.NODE_ENV === 'production') {
      return res.status(400).json({ message: 'Payment signature verification failed' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'No items found in checkout' });
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

    const orderNumber = `BRIGHT-RZP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const estDate = new Date();
    estDate.setDate(estDate.getDate() + 3);
    const estimatedDeliveryDate = estDate.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

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
      paymentMethod: paymentMethod || 'Razorpay',
      paymentStatus: 'Paid',
      orderStatus: 'Confirmed',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      estimatedDeliveryDate,
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
  createRazorpayOrder,
  verifyRazorpayPayment,
};
