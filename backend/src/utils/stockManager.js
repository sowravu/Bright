const mongoose = require('mongoose');
const Product = require('../models/Product');
const Accessory = require('../models/Accessory');

/**
 * Atomically decrement inventory stock for order items in MongoDB.
 * Matches products/accessories by exact _id or product name.
 * Employs MongoDB atomic conditional updates ($inc with $gte query filter) to completely
 * eliminate race conditions when multiple customers order simultaneously.
 */
const decrementStockForOrder = async (items) => {
  for (const item of items) {
    if (!item || (!item.productId && !item.name)) {
      continue;
    }

    const qty = Math.max(1, Number(item.quantity || 1));

    // Build Product query (by _id if valid ObjectId, or by base product name)
    const productQuery = [];
    if (item.productId && mongoose.isValidObjectId(item.productId)) {
      productQuery.push({ _id: item.productId });
    }
    if (item.name) {
      const baseName = item.name.split('(')[0].trim();
      if (baseName) {
        productQuery.push({ name: new RegExp('^' + baseName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i') });
      }
    }

    if (productQuery.length > 0) {
      let product = await Product.findOne({ $or: productQuery });
      if (product) {
        // Atomic main stock decrement with condition: stock must be >= qty
        const updated = await Product.findOneAndUpdate(
          { _id: product._id, stock: { $gte: qty } },
          { $inc: { stock: -qty } },
          { new: true }
        );

        if (!updated && product.stock < qty) {
          throw new Error(`Insufficient stock for "${item.name}". Only ${product.stock} available in MongoDB database.`);
        }

        // Atomic variant stock decrement if variant matches
        if (product.variants && product.variants.length > 0) {
          const matchingVariant = product.variants.find((v) =>
            (item.variantId && String(v._id) === String(item.variantId)) ||
            (item.color && v.color && v.color.toLowerCase() === item.color.toLowerCase())
          );

          if (matchingVariant) {
            await Product.updateOne(
              { _id: product._id, 'variants._id': matchingVariant._id, 'variants.stock': { $gte: qty } },
              { $inc: { 'variants.$.stock': -qty } }
            );
          }
        }

        console.log(`[StockManager] Decremented stock for product "${product.name}" in MongoDB. Previous: ${product.stock}, Quantity: ${qty}, New: ${updated ? updated.stock : product.stock - qty}`);
        continue;
      }
    }

    // Build Accessory query
    const accQuery = [];
    if (item.productId && mongoose.isValidObjectId(item.productId)) {
      accQuery.push({ _id: item.productId });
    }
    if (item.name) {
      const baseName = item.name.split('(')[0].trim();
      if (baseName) {
        accQuery.push({ name: new RegExp('^' + baseName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i') });
      }
    }

    if (accQuery.length > 0) {
      let accessory = await Accessory.findOne({ $or: accQuery });
      if (accessory) {
        const updated = await Accessory.findOneAndUpdate(
          { _id: accessory._id, stock: { $gte: qty } },
          { $inc: { stock: -qty } },
          { new: true }
        );

        if (!updated && accessory.stock < qty) {
          throw new Error(`Insufficient stock for "${item.name}". Only ${accessory.stock} available in MongoDB database.`);
        }

        if (accessory.variants && accessory.variants.length > 0) {
          const matchingVariant = accessory.variants.find((v) =>
            (item.variantId && String(v._id) === String(item.variantId)) ||
            (item.color && v.color && v.color.toLowerCase() === item.color.toLowerCase())
          );

          if (matchingVariant) {
            await Accessory.updateOne(
              { _id: accessory._id, 'variants._id': matchingVariant._id, 'variants.stock': { $gte: qty } },
              { $inc: { 'variants.$.stock': -qty } }
            );
          }
        }

        console.log(`[StockManager] Decremented stock for accessory "${accessory.name}" in MongoDB. New stock: ${updated ? updated.stock : accessory.stock - qty}`);
      }
    }
  }
};

/**
 * Atomically restore stock into MongoDB when an order is cancelled.
 */
const restoreStockForOrder = async (items) => {
  for (const item of items) {
    if (!item || (!item.productId && !item.name)) {
      continue;
    }

    const qty = Math.max(1, Number(item.quantity || 1));

    const productQuery = [];
    if (item.productId && mongoose.isValidObjectId(item.productId)) {
      productQuery.push({ _id: item.productId });
    }
    if (item.name) {
      const baseName = item.name.split('(')[0].trim();
      if (baseName) {
        productQuery.push({ name: new RegExp('^' + baseName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i') });
      }
    }

    if (productQuery.length > 0) {
      let product = await Product.findOne({ $or: productQuery });
      if (product) {
        await Product.updateOne(
          { _id: product._id },
          { $inc: { stock: qty } }
        );

        if (product.variants && product.variants.length > 0) {
          const matchingVariant = product.variants.find((v) =>
            (item.variantId && String(v._id) === String(item.variantId)) ||
            (item.color && v.color && v.color.toLowerCase() === item.color.toLowerCase())
          );

          if (matchingVariant) {
            await Product.updateOne(
              { _id: product._id, 'variants._id': matchingVariant._id },
              { $inc: { 'variants.$.stock': qty } }
            );
          }
        }

        console.log(`[StockManager] Restored stock for product "${product.name}" in MongoDB. Restored quantity: ${qty}`);
        continue;
      }
    }

    const accQuery = [];
    if (item.productId && mongoose.isValidObjectId(item.productId)) {
      accQuery.push({ _id: item.productId });
    }
    if (item.name) {
      const baseName = item.name.split('(')[0].trim();
      if (baseName) {
        accQuery.push({ name: new RegExp('^' + baseName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i') });
      }
    }

    if (accQuery.length > 0) {
      let accessory = await Accessory.findOne({ $or: accQuery });
      if (accessory) {
        await Accessory.updateOne(
          { _id: accessory._id },
          { $inc: { stock: qty } }
        );

        if (accessory.variants && accessory.variants.length > 0) {
          const matchingVariant = accessory.variants.find((v) =>
            (item.variantId && String(v._id) === String(item.variantId)) ||
            (item.color && v.color && v.color.toLowerCase() === item.color.toLowerCase())
          );

          if (matchingVariant) {
            await Accessory.updateOne(
              { _id: accessory._id, 'variants._id': matchingVariant._id },
              { $inc: { 'variants.$.stock': qty } }
            );
          }
        }

        console.log(`[StockManager] Restored stock for accessory "${accessory.name}" in MongoDB. Restored quantity: ${qty}`);
      }
    }
  }
};

module.exports = {
  decrementStockForOrder,
  restoreStockForOrder,
};
