const mongoose = require('mongoose');
const Product = require('../models/Product');
const Accessory = require('../models/Accessory');

/**
 * Robust helper to locate the exact variant inside a product/accessory variants array.
 */
const findMatchingVariant = (variants, item) => {
  if (!variants || !Array.isArray(variants) || variants.length === 0) {
    return null;
  }

  // 1. Match by exact variantId if provided
  if (item.variantId) {
    const matchedById = variants.find(
      (v) => String(v._id) === String(item.variantId) || String(v.id) === String(item.variantId)
    );
    if (matchedById) return matchedById;
  }

  const itemColor = (item.color || '').trim().toLowerCase();
  const itemRam = (item.ram || '').trim().toLowerCase();
  const itemStorage = (item.storage || '').trim().toLowerCase();

  // 2. Filter candidates by Color first if color is provided
  let candidates = variants;
  if (itemColor && itemColor !== 'default' && itemColor !== 'default color') {
    const colorMatched = variants.filter(
      (v) => (v.color || '').trim().toLowerCase() === itemColor
    );
    if (colorMatched.length > 0) {
      candidates = colorMatched;
    }
  }

  // If candidates has exactly 1 match, return it immediately
  if (candidates.length === 1) {
    return candidates[0];
  }

  // 3. Match by Storage within candidates
  if (itemStorage) {
    const storageMatched = candidates.find(
      (v) => (v.storage || '').trim().toLowerCase() === itemStorage
    );
    if (storageMatched) return storageMatched;
  }

  // 4. Match by RAM within candidates
  if (itemRam) {
    const ramMatched = candidates.find(
      (v) => (v.ram || '').trim().toLowerCase() === itemRam
    );
    if (ramMatched) return ramMatched;
  }

  return candidates[0] || variants[0];
};

/**
 * Atomically decrement inventory stock for order items in MongoDB.
 * Uses MongoDB arrayFilters to target the EXACT matching variant sub-document by _id.
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
        // Validate main stock first
        if (product.stock < qty) {
          throw new Error(`Out of stock: "${item.name}" has only ${product.stock} items left in stock.`);
        }

        // If product has variants, match exact variant and validate variant stock
        let matchingVariant = null;
        if (product.variants && product.variants.length > 0) {
          matchingVariant = findMatchingVariant(product.variants, item);

          if (matchingVariant) {
            if (matchingVariant.stock < qty) {
              throw new Error(`Out of stock: Variant "${matchingVariant.color || ''} ${matchingVariant.ram || ''} ${matchingVariant.storage || ''}". Only ${matchingVariant.stock} available.`);
            }

            // Decrement exact variant stock using arrayFilters targeting matchingVariant._id
            await Product.updateOne(
              { _id: product._id },
              { $inc: { 'variants.$[v].stock': -qty } },
              { arrayFilters: [{ 'v._id': matchingVariant._id, 'v.stock': { $gte: qty } }] }
            );
            console.log(`[StockManager] Decremented variant stock (${matchingVariant.color || 'Variant'} ID: ${matchingVariant._id}) for product "${product.name}". Previous: ${matchingVariant.stock}, Quantity: ${qty}`);
          }
        }

        // Decrement main stock
        const updatedProduct = await Product.findOneAndUpdate(
          { _id: product._id, stock: { $gte: qty } },
          { $inc: { stock: -qty } },
          { new: true }
        );

        if (!updatedProduct) {
          throw new Error(`Failed to update stock for "${item.name}". Stock may have been depleted.`);
        }

        console.log(`[StockManager] Decremented main stock for product "${product.name}". New main stock: ${updatedProduct.stock}`);
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
        if (accessory.stock < qty) {
          throw new Error(`Out of stock: "${item.name}" has only ${accessory.stock} items left in stock.`);
        }

        let matchingVariant = null;
        if (accessory.variants && accessory.variants.length > 0) {
          matchingVariant = findMatchingVariant(accessory.variants, item);

          if (matchingVariant) {
            if (matchingVariant.stock < qty) {
              throw new Error(`Out of stock: Variant "${matchingVariant.color || 'Option'}". Only ${matchingVariant.stock} available.`);
            }

            await Accessory.updateOne(
              { _id: accessory._id },
              { $inc: { 'variants.$[v].stock': -qty } },
              { arrayFilters: [{ 'v._id': matchingVariant._id, 'v.stock': { $gte: qty } }] }
            );
            console.log(`[StockManager] Decremented variant stock (${matchingVariant.color || 'Variant'} ID: ${matchingVariant._id}) for accessory "${accessory.name}". Previous: ${matchingVariant.stock}, Quantity: ${qty}`);
          }
        }

        const updatedAccessory = await Accessory.findOneAndUpdate(
          { _id: accessory._id, stock: { $gte: qty } },
          { $inc: { stock: -qty } },
          { new: true }
        );

        if (!updatedAccessory) {
          throw new Error(`Failed to update stock for accessory "${item.name}".`);
        }

        console.log(`[StockManager] Decremented main stock for accessory "${accessory.name}". New main stock: ${updatedAccessory.stock}`);
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
          const matchingVariant = findMatchingVariant(product.variants, item);

          if (matchingVariant) {
            await Product.updateOne(
              { _id: product._id },
              { $inc: { 'variants.$[v].stock': qty } },
              { arrayFilters: [{ 'v._id': matchingVariant._id }] }
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
          const matchingVariant = findMatchingVariant(accessory.variants, item);

          if (matchingVariant) {
            await Accessory.updateOne(
              { _id: accessory._id },
              { $inc: { 'variants.$[v].stock': qty } },
              { arrayFilters: [{ 'v._id': matchingVariant._id }] }
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
