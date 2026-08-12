require('dotenv').config();
const mongoose = require('mongoose');

const Brand = require('./src/models/Brand');
const AccessoryType = require('./src/models/AccessoryType');
const Product = require('./src/models/Product');
const Accessory = require('./src/models/Accessory');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bright';

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB successfully.');

    // 1. Seed Brands
    console.log('Seeding Brand Partners...');
    await Brand.deleteMany({});
    
    const brandsData = [
      { name: 'Vivo', logo: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=400', description: 'Innovative camera smartphones with ZEISS optics' },
      { name: 'Lava', logo: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=400', description: 'Proudly Indian mobile brand engineered with excellence' },
      { name: 'Samsung', logo: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=80&w=400', description: 'Next-generation Galaxy flagship smartphones and wearables' },
      { name: 'Apple', logo: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?q=80&w=400', description: 'Flagship iPhone lineup with A-series Bionic chips' },
      { name: 'OnePlus', logo: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?q=80&w=400', description: 'Never Settle flagship performance with Hasselblad cameras' },
      { name: 'Nothing', logo: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?q=80&w=400', description: 'Transparent aesthetics with iconic Glyph lighting design' },
      { name: 'Xiaomi', logo: 'https://images.unsplash.com/photo-1546054454-aa26e2b734c7?q=80&w=400', description: 'High performance smartphones with Leica imaging technology' },
    ];

    const insertedBrands = await Brand.insertMany(brandsData);
    console.log(`Inserted ${insertedBrands.length} Brand Partners.`);

    const brandMap = {};
    insertedBrands.forEach(b => {
      brandMap[b.name] = b._id;
    });

    // 2. Seed Accessory Types
    console.log('Seeding Accessory Types...');
    await AccessoryType.deleteMany({});

    const typesData = [
      { name: 'Fast Chargers', slug: 'fast-chargers', icon: 'Zap', description: 'High wattage wall chargers, GaN adapters, and fast power bricks' },
      { name: 'Protective Cases', slug: 'protective-cases', icon: 'Shield', description: 'Shockproof bumper cases, silicone covers, and armor shields' },
      { name: 'Wireless Earbuds', slug: 'wireless-earbuds', icon: 'Headphones', description: 'TWS earbuds with Active Noise Cancellation & Spatial Audio' },
      { name: 'Power Banks', slug: 'power-banks', icon: 'BatteryCharging', description: 'MagSafe wireless power banks and high-capacity portable batteries' },
      { name: 'Screen Protectors', slug: 'screen-protectors', icon: 'Maximize2', description: 'Tempered glass, privacy screens, and 3D curved protectors' },
    ];

    const insertedTypes = await AccessoryType.insertMany(typesData);
    console.log(`Inserted ${insertedTypes.length} Accessory Types.`);

    const typeMap = {};
    insertedTypes.forEach(t => {
      typeMap[t.name] = t._id;
    });

    // 3. Seed Smartphones Catalog
    console.log('Seeding Smartphones Catalog...');
    await Product.deleteMany({});

    const smartphones = [
      {
        name: 'Vivo V30 Pro 5G',
        brand: brandMap['Vivo'],
        category: 'smartphones',
        price: 46999,
        discountPrice: 41999,
        stock: 45,
        description: 'Co-engineered with ZEISS optics, the Vivo V30 Pro feature a 50MP Sony IMX920 main camera, Dimensity 8200 chipset, 3D Curved AMOLED Display, and 80W FlashCharge in a ultra-slim glass body.',
        colorVariants: ['Andaman Blue', 'Classic Black', 'Velvet Red'],
        ramVariants: ['8GB', '12GB'],
        storageVariants: ['256GB', '512GB'],
        colorImages: {
          'Andaman Blue': 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=600',
          'Classic Black': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=600',
          'Velvet Red': 'https://images.unsplash.com/photo-1580910051074-3eb694886505?q=80&w=600',
        },
        variants: [
          { color: 'Andaman Blue', ram: '8GB', storage: '256GB', price: 41999, discountPrice: 38999, stock: 15, image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=600' },
          { color: 'Andaman Blue', ram: '12GB', storage: '512GB', price: 46999, discountPrice: 43999, stock: 10, image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=600' },
          { color: 'Classic Black', ram: '8GB', storage: '256GB', price: 41999, discountPrice: 38999, stock: 12, image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=600' },
          { color: 'Velvet Red', ram: '12GB', storage: '512GB', price: 46999, discountPrice: 43999, stock: 8, image: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?q=80&w=600' },
        ],
        specifications: {
          ram: '8GB / 12GB LPDDR5X',
          storage: '256GB / 512GB UFS 3.1',
          color: 'Andaman Blue, Classic Black, Velvet Red',
          camera: '50MP ZEISS Sony IMX920 + 50MP Portrait + 50MP Ultrawide',
          battery: '5000 mAh with 80W FlashCharge',
          processor: 'MediaTek Dimensity 8200 (4nm)',
          warranty: '1 Year Brand Warranty',
        },
        images: [
          'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=600',
          'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=600',
        ],
        isFeatured: true,
        isActive: true,
      },
      {
        name: 'Vivo X100 Pro 5G',
        brand: brandMap['Vivo'],
        category: 'smartphones',
        price: 92999,
        discountPrice: 84999,
        stock: 14,
        description: 'Ultimate Imaging Flagship powered by ZEISS 1-inch main sensor, APO Floating Telephoto lens, MediaTek Dimensity 9300 chipset, V3 Imaging Chip, and 5400mAh battery with 100W charging.',
        colorVariants: ['Asteroid Black', 'Sunset Orange'],
        ramVariants: ['16GB'],
        storageVariants: ['512GB'],
        colorImages: {
          'Asteroid Black': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=600',
          'Sunset Orange': 'https://images.unsplash.com/photo-1580910051074-3eb694886505?q=80&w=600',
        },
        variants: [
          { color: 'Asteroid Black', ram: '16GB', storage: '512GB', price: 89999, discountPrice: 84999, stock: 8, image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=600' },
          { color: 'Sunset Orange', ram: '16GB', storage: '512GB', price: 92999, discountPrice: 86999, stock: 6, image: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?q=80&w=600' },
        ],
        specifications: {
          ram: '16GB LPDDR5T',
          storage: '512GB UFS 4.0',
          color: 'Asteroid Black, Sunset Orange',
          camera: '50MP 1-inch ZEISS Sony IMX989 + 50MP APO Telephoto + 50MP Ultrawide',
          battery: '5400 mAh with 100W Dual-Cell FlashCharge',
          processor: 'MediaTek Dimensity 9300 (4nm)',
          warranty: '1 Year Brand Warranty',
        },
        images: [
          'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=600',
          'https://images.unsplash.com/photo-1580910051074-3eb694886505?q=80&w=600',
        ],
        isFeatured: true,
        isActive: true,
      },
      {
        name: 'Lava Agni 2 5G',
        brand: brandMap['Lava'],
        category: 'smartphones',
        price: 25999,
        discountPrice: 19999,
        stock: 25,
        description: 'India’s curved screen revolutionary 5G smartphone featuring a 6.78-inch FHD+ 120Hz 3D Curved AMOLED Display, MediaTek Dimensity 7050, 50MP AI Quad Camera, and clean Bloatware-free Android.',
        colorVariants: ['Glass Viridian'],
        ramVariants: ['8GB'],
        storageVariants: ['256GB'],
        colorImages: {
          'Glass Viridian': 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=600',
        },
        variants: [
          { color: 'Glass Viridian', ram: '8GB', storage: '256GB', price: 25999, discountPrice: 19999, stock: 25, image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=600' },
        ],
        specifications: {
          ram: '8GB LPDDR5',
          storage: '256GB UFS 3.1',
          color: 'Glass Viridian',
          camera: '50MP Main (1.0µm pixel) + 8MP Ultrawide + 2MP Macro + 2MP Depth',
          battery: '4700 mAh with 66W Fast Charging',
          processor: 'MediaTek Dimensity 7050 (6nm)',
          warranty: '1 Year Free Replacement Warranty at Home',
        },
        images: [
          'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=600',
        ],
        isFeatured: true,
        isActive: true,
      },
      {
        name: 'Samsung Galaxy S24 Ultra 5G',
        brand: brandMap['Samsung'],
        category: 'smartphones',
        price: 139999,
        discountPrice: 119999,
        stock: 21,
        description: 'Galaxy AI is here. Powered by Titanium frame, Snapdragon 8 Gen 3 for Galaxy, 200MP Main sensor with 5x Optical Telephoto Zoom, integrated S Pen, and 7 years of OS upgrades.',
        colorVariants: ['Titanium Gray', 'Titanium Black', 'Titanium Violet'],
        ramVariants: ['12GB'],
        storageVariants: ['256GB', '512GB', '1TB'],
        colorImages: {
          'Titanium Gray': 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=80&w=600',
          'Titanium Black': 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?q=80&w=600',
          'Titanium Violet': 'https://images.unsplash.com/photo-1580910051074-3eb694886505?q=80&w=600',
        },
        variants: [
          { color: 'Titanium Gray', ram: '12GB', storage: '256GB', price: 129999, discountPrice: 119999, stock: 10, image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=80&w=600' },
          { color: 'Titanium Black', ram: '12GB', storage: '512GB', price: 139999, discountPrice: 129999, stock: 7, image: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?q=80&w=600' },
          { color: 'Titanium Violet', ram: '12GB', storage: '1TB', price: 159999, discountPrice: 149999, stock: 4, image: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?q=80&w=600' },
        ],
        specifications: {
          ram: '12GB LPDDR5X',
          storage: '256GB / 512GB / 1TB UFS 4.0',
          color: 'Titanium Gray, Titanium Black, Titanium Violet',
          camera: '200MP Main + 50MP 5x Zoom + 10MP 3x Zoom + 12MP Ultrawide',
          battery: '5000 mAh with 45W Fast Charging',
          processor: 'Snapdragon 8 Gen 3 for Galaxy (4nm)',
          warranty: '1 Year Manufacturer Warranty',
        },
        images: [
          'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=80&w=600',
          'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?q=80&w=600',
        ],
        isFeatured: true,
        isActive: true,
      },
      {
        name: 'Apple iPhone 15 Pro Max',
        brand: brandMap['Apple'],
        category: 'smartphones',
        price: 179900,
        discountPrice: 148900,
        stock: 23,
        description: 'Forged in titanium and featuring the groundbreaking A17 Pro chip, a customizable Action button, USB-C connector with USB 3 speeds, and the most powerful iPhone camera system ever with 5x Telephoto optical zoom.',
        colorVariants: ['Natural Titanium', 'Blue Titanium', 'Black Titanium'],
        ramVariants: ['8GB'],
        storageVariants: ['256GB', '512GB', '1TB'],
        colorImages: {
          'Natural Titanium': 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?q=80&w=600',
          'Blue Titanium': 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?q=80&w=600',
        },
        variants: [
          { color: 'Natural Titanium', ram: '8GB', storage: '256GB', price: 159900, discountPrice: 148900, stock: 14, image: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?q=80&w=600' },
          { color: 'Blue Titanium', ram: '8GB', storage: '512GB', price: 179900, discountPrice: 166900, stock: 9, image: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?q=80&w=600' },
        ],
        specifications: {
          ram: '8GB Unified Memory',
          storage: '256GB / 512GB / 1TB NVMe',
          color: 'Natural Titanium, Blue Titanium, Black Titanium',
          camera: '48MP Main Sensor + 12MP 5x Telephoto + 12MP Ultrawide',
          battery: '4422 mAh with MagSafe 15W & USB 3 Fast Charge',
          processor: 'Apple A17 Pro (3nm)',
          warranty: '1 Year AppleCare Warranty',
        },
        images: [
          'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?q=80&w=600',
          'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?q=80&w=600',
        ],
        isFeatured: true,
        isActive: true,
      },
      {
        name: 'OnePlus 12 5G',
        brand: brandMap['OnePlus'],
        category: 'smartphones',
        price: 69999,
        discountPrice: 59999,
        stock: 30,
        description: 'Smooth Beyond Belief. Snapdragon 8 Gen 3, 4th Gen Hasselblad Camera System for Mobile, 2K 120Hz ProXDR Display with 4500 nits peak brightness, 5400mAh Battery, and 100W SUPERVOOC charging.',
        colorVariants: ['Silky Black', 'Flowy Emerald'],
        ramVariants: ['12GB', '16GB'],
        storageVariants: ['256GB', '512GB'],
        colorImages: {
          'Silky Black': 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?q=80&w=600',
          'Flowy Emerald': 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=600',
        },
        variants: [
          { color: 'Silky Black', ram: '12GB', storage: '256GB', price: 64999, discountPrice: 59999, stock: 18, image: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?q=80&w=600' },
          { color: 'Flowy Emerald', ram: '16GB', storage: '512GB', price: 69999, discountPrice: 64999, stock: 12, image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=600' },
        ],
        specifications: {
          ram: '12GB / 16GB LPDDR5X',
          storage: '256GB / 512GB UFS 4.0',
          color: 'Silky Black, Flowy Emerald',
          camera: '50MP Sony LYT-808 + 64MP 3x Periscope Telephoto + 48MP Ultrawide',
          battery: '5400 mAh with 100W SUPERVOOC Fast Charge',
          processor: 'Snapdragon 8 Gen 3 (4nm)',
          warranty: '1 Year Brand Warranty',
        },
        images: [
          'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?q=80&w=600',
        ],
        isFeatured: true,
        isActive: true,
      },
      {
        name: 'Nothing Phone (2)',
        brand: brandMap['Nothing'],
        category: 'smartphones',
        price: 49999,
        discountPrice: 36999,
        stock: 35,
        description: 'Iconic transparent design powered by Glyph Interface 2.0 with customizable LED lighting patterns, Snapdragon 8+ Gen 1, Dual 50MP Sony IMX890 rear camera, and 120Hz LTPO OLED Display.',
        colorVariants: ['White', 'Dark Gray'],
        ramVariants: ['8GB', '12GB'],
        storageVariants: ['128GB', '256GB', '512GB'],
        colorImages: {
          'White': 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?q=80&w=600',
          'Dark Gray': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=600',
        },
        variants: [
          { color: 'White', ram: '8GB', storage: '128GB', price: 44999, discountPrice: 36999, stock: 15, image: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?q=80&w=600' },
          { color: 'Dark Gray', ram: '12GB', storage: '256GB', price: 49999, discountPrice: 39999, stock: 20, image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=600' },
        ],
        specifications: {
          ram: '8GB / 12GB LPDDR5',
          storage: '128GB / 256GB / 512GB UFS 3.1',
          color: 'White, Dark Gray',
          camera: '50MP Sony IMX890 OIS + 50MP Samsung JN1 Ultrawide',
          battery: '4700 mAh with 45W PPS Fast Charging',
          processor: 'Snapdragon 8+ Gen 1 (4nm)',
          warranty: '1 Year Manufacturer Warranty',
        },
        images: [
          'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?q=80&w=600',
        ],
        isFeatured: true,
        isActive: true,
      },
    ];

    const insertedSmartphones = await Product.insertMany(smartphones);
    console.log(`Inserted ${insertedSmartphones.length} Smartphones.`);

    // 4. Seed Accessories Catalog
    console.log('Seeding Accessories Catalog...');
    await Accessory.deleteMany({});

    const accessories = [
      {
        name: 'Vivo 80W FlashCharge Adapter',
        brand: brandMap['Vivo'],
        accessoryType: typeMap['Fast Chargers'],
        price: 2499,
        discountPrice: 1999,
        stock: 50,
        description: 'Official Vivo 80W FlashCharge Wall Charger with intelligent temperature protection, multi-layer voltage protection, and Type-C cable included.',
        colorVariants: ['Pure White'],
        colorImages: {
          'Pure White': 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=600',
        },
        variants: [
          { color: 'Pure White', price: 2499, discountPrice: 1999, stock: 50, image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=600' },
        ],
        specifications: {
          color: 'Pure White',
          compatibility: 'Vivo V series, X series, and USB-C PD devices',
          material: 'Fireproof Polycarbonate (PC)',
          warranty: '1 Year Brand Warranty',
        },
        images: ['https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=600'],
        isFeatured: true,
        isActive: true,
      },
      {
        name: 'Lava Pro Wireless TWS Earbuds',
        brand: brandMap['Lava'],
        accessoryType: typeMap['Wireless Earbuds'],
        price: 3999,
        discountPrice: 2499,
        stock: 35,
        description: 'True Wireless Stereo Earbuds with 30dB Active Noise Cancellation, Quad Mic Environmental Noise Cancellation for crystal clear calls, and 40-hour playback.',
        colorVariants: ['Midnight Black', 'Pearl White'],
        colorImages: {
          'Midnight Black': 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=600',
          'Pearl White': 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?q=80&w=600',
        },
        variants: [
          { color: 'Midnight Black', price: 3999, discountPrice: 2499, stock: 20, image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=600' },
          { color: 'Pearl White', price: 3999, discountPrice: 2499, stock: 15, image: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?q=80&w=600' },
        ],
        specifications: {
          color: 'Midnight Black, Pearl White',
          compatibility: 'Android & iOS Bluetooth 5.3',
          material: 'Matte ABS Plastic',
          warranty: '1 Year Replacement Warranty',
        },
        images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=600'],
        isFeatured: true,
        isActive: true,
      },
      {
        name: 'Samsung 45W Super Fast Wall Charger',
        brand: brandMap['Samsung'],
        accessoryType: typeMap['Fast Chargers'],
        price: 3499,
        discountPrice: 2999,
        stock: 40,
        description: 'Super Fast Charging 2.0 45W Power Adapter with USB Type-C to Type-C 5A Cable included for Galaxy S24 Ultra, S23 Ultra, and Tab S9.',
        colorVariants: ['Black', 'White'],
        colorImages: {
          'Black': 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=600',
        },
        variants: [
          { color: 'Black', price: 3499, discountPrice: 2999, stock: 25, image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=600' },
          { color: 'White', price: 3499, discountPrice: 2999, stock: 15, image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=600' },
        ],
        specifications: {
          color: 'Black, White',
          compatibility: 'Samsung Galaxy smartphones, tablets, laptops',
          material: 'Flame-retardant PC',
          warranty: '1 Year Samsung Warranty',
        },
        images: ['https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=600'],
        isFeatured: true,
        isActive: true,
      },
      {
        name: 'Apple AirPods Pro (2nd Gen, USB-C)',
        brand: brandMap['Apple'],
        accessoryType: typeMap['Wireless Earbuds'],
        price: 24900,
        discountPrice: 21900,
        stock: 25,
        description: 'Up to 2x more Active Noise Cancellation, Adaptive Audio, Transparency mode, Personalized Spatial Audio, and MagSafe Charging Case with USB-C connector.',
        colorVariants: ['White'],
        colorImages: {
          'White': 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?q=80&w=600',
        },
        variants: [
          { color: 'White', price: 24900, discountPrice: 21900, stock: 25, image: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?q=80&w=600' },
        ],
        specifications: {
          color: 'White',
          compatibility: 'iPhone, iPad, Mac, Apple Watch',
          material: 'Glossy Recycled Plastic',
          warranty: '1 Year AppleCare Warranty',
        },
        images: ['https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?q=80&w=600'],
        isFeatured: true,
        isActive: true,
      },
      {
        name: 'Apple MagSafe 10000mAh Magnetic Power Bank',
        brand: brandMap['Apple'],
        accessoryType: typeMap['Power Banks'],
        price: 4999,
        discountPrice: 3499,
        stock: 45,
        description: 'Strong N52 magnetic snap-on wireless power bank with 15W MagSafe wireless charging, 22.5W USB-C PD fast wired charging, and LED battery percentage indicator.',
        colorVariants: ['Titanium Gray', 'Silky White'],
        colorImages: {
          'Titanium Gray': 'https://images.unsplash.com/photo-1609592424109-dd9892f1b177?q=80&w=600',
          'Silky White': 'https://images.unsplash.com/photo-1609592424109-dd9892f1b177?q=80&w=600',
        },
        variants: [
          { color: 'Titanium Gray', price: 4999, discountPrice: 3499, stock: 25, image: 'https://images.unsplash.com/photo-1609592424109-dd9892f1b177?q=80&w=600' },
          { color: 'Silky White', price: 4999, discountPrice: 3499, stock: 20, image: 'https://images.unsplash.com/photo-1609592424109-dd9892f1b177?q=80&w=600' },
        ],
        specifications: {
          color: 'Titanium Gray, Silky White',
          compatibility: 'iPhone 12/13/14/15 series MagSafe & Qi devices',
          material: 'Aluminum Alloy Shell',
          warranty: '1 Year Warranty',
        },
        images: ['https://images.unsplash.com/photo-1609592424109-dd9892f1b177?q=80&w=600'],
        isFeatured: true,
        isActive: true,
      },
    ];

    const insertedAccessories = await Accessory.insertMany(accessories);
    console.log(`Inserted ${insertedAccessories.length} Accessories.`);

    console.log('--- DATABASE SEEDING COMPLETED SUCCESSFULLY ---');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
