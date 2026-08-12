/**
 * AI Product & Accessory Description & Structured Specs Generator
 * Supports direct real-time live queries to Google Gemini API (or OpenAI API)
 * with a built-in domain-aware fallback generator.
 */

async function generateAiData({ name, brand, category, subcategory, specifications }) {
  const cleanName = name ? name.trim() : '';
  const brandName = (brand && typeof brand === 'string' && brand.trim()) ? brand.trim() : extractBrandFromName(cleanName);

  const description = await generateAiDescription({
    name: cleanName,
    brand: brandName,
    category: category || 'smartphones',
    subcategory,
    specifications
  });

  const specs = generateSmartphoneSpecs(cleanName, brandName);

  return {
    description,
    specifications: specs
  };
}

async function generateAiDescription({ name, brand, category, subcategory, specifications }) {
  if (!name || typeof name !== 'string') {
    return 'High-performance mobile product designed for premium usability, durability, and modern digital lifestyle.';
  }

  const cleanName = name.trim();
  const lowerName = cleanName.toLowerCase();
  const brandName = (brand && typeof brand === 'string' && brand.trim()) ? brand.trim() : extractBrandFromName(cleanName);

  // 1. Fetch live from Google Gemini API if GEMINI_API_KEY is configured
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (geminiApiKey && geminiApiKey.trim()) {
    try {
      const geminiText = await fetchFromGeminiApi({
        name: cleanName,
        brand: brandName,
        category: category || 'smartphones',
        subcategory,
        specifications,
        apiKey: geminiApiKey.trim(),
      });
      if (geminiText) return geminiText;
    } catch (err) {
      console.warn('Gemini API call failed, falling back to built-in generator:', err.message);
    }
  }

  // 2. Fetch live from OpenAI API if OPENAI_API_KEY is configured
  const openAiApiKey = process.env.OPENAI_API_KEY;
  if (openAiApiKey && openAiApiKey.trim()) {
    try {
      const openAiText = await fetchFromOpenAiApi({
        name: cleanName,
        brand: brandName,
        category: category || 'smartphones',
        subcategory,
        specifications,
        apiKey: openAiApiKey.trim(),
      });
      if (openAiText) return openAiText;
    } catch (err) {
      console.warn('OpenAI API call failed, falling back to built-in generator:', err.message);
    }
  }

  // 3. Smart domain-aware fallback generator
  if (category === 'accessories' || isAccessory(lowerName, subcategory)) {
    return generateAccessoryDescription(cleanName, brandName, subcategory || getAccessoryType(lowerName));
  }

  return generateSmartphoneDescription(cleanName, brandName);
}

/**
 * Direct HTTP request to Google Gemini API
 */
async function fetchFromGeminiApi({ name, brand, category, subcategory, apiKey }) {
  let prompt = '';
  if (category === 'smartphones' || !category) {
    prompt = `Write a comprehensive, accurate product description and feature overview for the smartphone named "${name}" (Brand: ${brand || 'Any'}).
You MUST explicitly cover all four of these smartphone specifications in detail:
1. Display Details (screen size, panel tech e.g. AMOLED/OLED, refresh rate in Hz, peak brightness or resolution).
2. Processor (exact chip/processor name e.g. Snapdragon, Apple A-series, Dimensity, Tensor).
3. Back / Rear Cameras (main megapixel, OIS, ultra-wide/telephoto/zoom specs).
4. Front Camera (selfie camera megapixel and portrait capabilities).

Do NOT include markdown headings, bullet points, or quotes; return ONLY clean, cohesive paragraph text.`;
  } else {
    prompt = `Write a concise 3 to 4 sentence product description and feature overview for the mobile accessory named "${name}" (Brand: ${brand || 'Any'}${subcategory ? `, Type: ${subcategory}` : ''}). State real specs (materials, power/wattage, compatibility, noise cancellation, or protection rating) accurately. Do NOT include markdown headings or bullet points; return ONLY clean paragraph text.`;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (response.ok) {
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text && text.trim()) {
      return text.trim().replace(/^["']|["']$/g, '');
    }
  }
  return null;
}

/**
 * Direct HTTP request to OpenAI API
 */
async function fetchFromOpenAiApi({ name, brand, category, subcategory, apiKey }) {
  let prompt = '';
  if (category === 'smartphones' || !category) {
    prompt = `Write a 3 to 4 sentence overview for smartphone "${name}" (Brand: ${brand || 'Any'}) explicitly detailing: 1. Display Specs, 2. Processor, 3. Back Cameras, and 4. Front Selfie Camera. Return only clean text without markdown bullet points.`;
  } else {
    prompt = `Write a concise 3 to 4 sentence product overview for accessory "${name}" (Brand: ${brand || 'Any'}${subcategory ? `, Type: ${subcategory}` : ''}). Return only clean text.`;
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 280,
      temperature: 0.7,
    }),
  });

  if (response.ok) {
    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;
    if (text && text.trim()) {
      return text.trim().replace(/^["']|["']$/g, '');
    }
  }
  return null;
}

function extractBrandFromName(name) {
  const brands = [
    'Apple', 'iPhone', 'Samsung', 'Galaxy', 'Vivo', 'Oppo', 'OnePlus',
    'Realme', 'Xiaomi', 'Redmi', 'Poco', 'Google', 'Pixel', 'Motorola',
    'Moto', 'Nothing', 'iQOO', 'Lava', 'Tecno', 'Infinix', 'Sony', 'Anker', 'Boat', 'JBL'
  ];
  for (const b of brands) {
    if (name.toLowerCase().includes(b.toLowerCase())) {
      if (b === 'iPhone') return 'Apple';
      if (b === 'Galaxy') return 'Samsung';
      if (b === 'Redmi' || b === 'Poco') return 'Xiaomi';
      if (b === 'Moto') return 'Motorola';
      return b;
    }
  }
  return 'Generic';
}

function isAccessory(lowerName, subcategory) {
  const keywords = ['case', 'cover', 'charger', 'cable', 'adapter', 'screen guard', 'tempered', 'earbuds', 'headphone', 'headset', 'power bank', 'tws', 'airpods', 'strap', 'holder', 'mount', 'stand'];
  if (subcategory && subcategory.toLowerCase() !== 'general' && subcategory.toLowerCase() !== 'smartphones') return true;
  return keywords.some(k => lowerName.includes(k));
}

function getAccessoryType(lowerName) {
  if (lowerName.includes('charger') || lowerName.includes('adapter')) return 'Charger';
  if (lowerName.includes('cable')) return 'Cable';
  if (lowerName.includes('case') || lowerName.includes('cover')) return 'Cover & Case';
  if (lowerName.includes('earbuds') || lowerName.includes('tws') || lowerName.includes('headphone') || lowerName.includes('airpods')) return 'Audio & Headphones';
  if (lowerName.includes('power bank') || lowerName.includes('battery')) return 'Power Bank';
  if (lowerName.includes('guard') || lowerName.includes('glass') || lowerName.includes('protector')) return 'Screen Guard';
  return 'Accessory';
}

function generateSmartphoneSpecs(name, brand) {
  const lower = name.toLowerCase();

  let display = '6.67-inch 120Hz FHD+ AMOLED Display (1800 nits)';
  let processor = 'Octa-Core 4nm Flagship Processor';
  let rearCamera = '50MP OIS Main + 8MP Ultra-Wide + 2MP Macro';
  let frontCamera = '32MP HD Selfie Camera';
  let battery = '5000 mAh';
  let charging = '67W Turbo Fast Charging';
  let operatingSystem = 'Android 14';
  let refreshRate = '120Hz';
  let network = '5G Dual SIM';
  let warranty = '1 Year Manufacturer Warranty';

  if (lower.includes('iqoo') || lower.includes('neo')) {
    processor = 'Qualcomm Snapdragon 8s Gen 3 (4nm)';
    display = '6.78-inch 1.5K 144Hz AMOLED (4500 nits)';
    rearCamera = '50MP Sony OIS Main + 8MP Ultra-Wide';
    frontCamera = '16MP HD Selfie Camera';
    battery = '6000 mAh';
    charging = '120W FlashCharge';
    operatingSystem = 'Android 14 (Funtouch OS 14)';
    refreshRate = '144Hz';
  } else if (lower.includes('iphone') || brand.toLowerCase() === 'apple') {
    display = lower.includes('max') || lower.includes('plus')
      ? '6.7-inch Super Retina XDR OLED (120Hz ProMotion)'
      : '6.1-inch Super Retina XDR OLED (120Hz ProMotion)';
    processor = lower.includes('pro') ? 'Apple A17 Pro (3nm)' : 'Apple A16 Bionic (4nm)';
    rearCamera = lower.includes('pro')
      ? '48MP Main OIS + 12MP 5x Telephoto + 12MP Ultra-Wide'
      : '48MP Main OIS + 12MP Ultra-Wide';
    frontCamera = '12MP TrueDepth Front Camera with Autofocus';
    battery = '4383 mAh MagSafe';
    charging = '27W Wired & 15W MagSafe Wireless';
    operatingSystem = 'iOS 17';
  } else if (lower.includes('samsung') || lower.includes('galaxy') || brand.toLowerCase() === 'samsung') {
    display = lower.includes('ultra')
      ? '6.8-inch QHD+ Dynamic AMOLED 2X (120Hz Adaptive, 2600 nits)'
      : '6.6-inch FHD+ Dynamic AMOLED 2X (120Hz Adaptive)';
    processor = lower.includes('ultra') || lower.includes('s24')
      ? 'Snapdragon 8 Gen 3 for Galaxy (4nm)'
      : 'Exynos 2400 / Snapdragon 8 Gen 3';
    rearCamera = lower.includes('ultra')
      ? '200MP Main OIS + 50MP 5x Periscope + 10MP 3x Telephoto + 12MP Ultra-Wide (100x Space Zoom)'
      : '50MP Main OIS + 12MP Ultra-Wide + 10MP 3x Telephoto';
    frontCamera = '12MP Dual Pixel Selfie Camera';
    battery = '5000 mAh';
    charging = '45W Super Fast Charging 2.0';
    operatingSystem = 'Android 14 (One UI 6.1 with Galaxy AI)';
  } else if (lower.includes('vivo') || brand.toLowerCase() === 'vivo') {
    display = '6.78-inch 3D Curved 1.5K 120Hz AMOLED (2800 nits)';
    processor = 'MediaTek Dimensity 9300 / 8200 (4nm)';
    rearCamera = '50MP Sony VCS OIS Main + 50MP ZEISS Portrait + 50MP Ultra-Wide';
    frontCamera = '50MP Eye-AF Group Selfie Camera';
    battery = '5000 mAh';
    charging = '80W FlashCharge';
    operatingSystem = 'Android 14 (Funtouch OS 14)';
  } else if (lower.includes('oneplus') || brand.toLowerCase() === 'oneplus') {
    display = '6.82-inch 2K 120Hz ProXDR AMOLED (LTPO 3.0, 4500 nits)';
    processor = 'Qualcomm Snapdragon 8 Gen 3 (4nm)';
    rearCamera = '50MP Sony LYT-808 Main + 64MP Periscope 3x + 48MP Ultra-Wide';
    frontCamera = '32MP Sony IMX615 Selfie Camera';
    battery = '5400 mAh';
    charging = '100W SUPERVOOC Fast Charging';
    operatingSystem = 'Android 14 (OxygenOS 14)';
  } else if (lower.includes('pixel') || brand.toLowerCase() === 'google') {
    display = '6.7-inch Super Actua LTPO OLED (120Hz, 2400 nits)';
    processor = 'Google Tensor G3 (4nm)';
    rearCamera = '50MP Main OIS + 48MP 5x Telephoto + 48MP Ultra-Wide Macro';
    frontCamera = '10.5MP Dual PD Selfie Camera with Autofocus';
    battery = '5050 mAh';
    charging = '30W Fast Charging & Wireless Qi';
    operatingSystem = 'Android 14 Stock UI';
  } else if (lower.includes('xiaomi') || lower.includes('redmi') || lower.includes('poco')) {
    display = '6.67-inch 1.5K 120Hz CrystalRes AMOLED (1800 nits)';
    processor = 'Snapdragon 8s Gen 3 / MediaTek Dimensity 8300 Ultra';
    rearCamera = '200MP / 50MP OIS Main + 8MP Ultra-Wide + 2MP Macro';
    frontCamera = '16MP HD Selfie Camera';
    battery = '5000 mAh';
    charging = '90W / 120W HyperCharge';
    operatingSystem = 'Android 14 (Xiaomi HyperOS)';
  } else if (lower.includes('lava') || brand.toLowerCase() === 'lava') {
    display = '6.78-inch Curved 120Hz FHD+ AMOLED Screen';
    processor = 'MediaTek Dimensity 7050 Octa-Core';
    rearCamera = '50MP Quad AI Camera Setup';
    frontCamera = '16MP HD Selfie Camera';
    battery = '4700 mAh';
    charging = '66W Fast Charging';
    operatingSystem = 'Android 13 Clean UI';
  }

  return {
    display,
    processor,
    rearCamera,
    frontCamera,
    battery,
    charging,
    operatingSystem,
    refreshRate,
    network,
    warranty,
  };
}

function generateSmartphoneDescription(name, brand) {
  const lower = name.toLowerCase();

  let displayTech = '6.67-inch 120Hz FHD+ AMOLED display with 1.5K resolution and 1800 nits peak brightness';
  let processor = 'flagship 4nm Octa-Core processor for high efficiency and responsive gaming';
  let rearCameraTech = '50MP OIS primary rear camera paired with an 8MP ultra-wide lens and 2MP macro sensor';
  let frontCameraTech = '32MP High-Res front selfie camera with AI portrait mode';
  let batteryTech = '5000mAh battery supporting 67W Turbo Fast Charging';

  if (lower.includes('iphone') || brand.toLowerCase() === 'apple') {
    displayTech = lower.includes('max') || lower.includes('plus')
      ? '6.7-inch Super Retina XDR OLED display with ProMotion 120Hz and Ceramic Shield protection'
      : '6.1-inch Super Retina XDR OLED display with ProMotion 120Hz and Ceramic Shield protection';
    processor = lower.includes('pro') ? 'groundbreaking Apple A17 Pro (3nm) chip with 6-core GPU' : 'Apple A16 Bionic chip with 5-core GPU';
    rearCameraTech = lower.includes('pro')
      ? 'Pro 48MP Main camera (sensor-shift OIS) + 12MP 5x Telephoto + 12MP Ultra Wide with 4K ProRes video'
      : 'Advanced dual camera system featuring 48MP Main lens + 12MP Ultra Wide with Smart HDR 5';
    frontCameraTech = '12MP TrueDepth front selfie camera with Photonic Engine and Autofocus';
    batteryTech = 'all-day battery life with MagSafe wireless fast charging';
  } else if (lower.includes('samsung') || lower.includes('galaxy') || brand.toLowerCase() === 'samsung') {
    displayTech = lower.includes('ultra')
      ? '6.8-inch QHD+ Dynamic AMOLED 2X display with 120Hz adaptive refresh rate and 2600 nits peak brightness'
      : '6.6-inch FHD+ Dynamic AMOLED 2X display with 120Hz adaptive refresh rate';
    processor = lower.includes('ultra') || lower.includes('s24')
      ? 'Snapdragon 8 Gen 3 for Galaxy with integrated Galaxy AI tools'
      : 'Samsung Exynos / Snapdragon Octa-Core processor';
    rearCameraTech = lower.includes('ultra')
      ? 'revolutionary 200MP Quad Camera setup (200MP Main OIS + 50MP Periscope 5x + 10MP Telephoto 3x + 12MP Ultra Wide with 100x Space Zoom)'
      : '50MP Triple Camera setup (50MP OIS + 12MP Ultra Wide + 10MP Telephoto with 30x Space Zoom)';
    frontCameraTech = '12MP Dual Pixel Dual-Focus front selfie camera with 4K60fps video capture';
    batteryTech = '5000mAh intelligent battery with 45W Super Fast Charging 2.0';
  } else if (lower.includes('vivo') || brand.toLowerCase() === 'vivo') {
    displayTech = '6.78-inch 3D Curved 120Hz AMOLED display with 1.5K resolution and 2800 nits local peak brightness';
    processor = 'MediaTek Dimensity 8200 / 9300 4nm flagship processor with Extended RAM 3.0';
    rearCameraTech = 'ZEISS Professional Optics 50MP Sony VCS Main Camera + 50MP Portrait Camera + 50MP Ultra Wide-Angle lens';
    frontCameraTech = '50MP Eye AF Ultra-Clear Group Selfie front camera';
    batteryTech = '5000mAh battery with 80W FlashCharge technology';
  } else if (lower.includes('oneplus') || brand.toLowerCase() === 'oneplus') {
    displayTech = '6.82-inch 2K 120Hz ProXDR AMOLED display with LTPO 3.0 dynamic refresh rate';
    processor = 'Qualcomm Snapdragon 8 Gen 3 mobile platform with Dual Cryo-velocity VC cooling';
    rearCameraTech = '4th Gen Hasselblad Camera System featuring 50MP Sony LYT-808 Main + 64MP Periscope Telephoto + 48MP Ultra Wide';
    frontCameraTech = '32MP Sony IMX615 front camera with EIS video stabilization';
    batteryTech = '5400mAh dual-cell battery with 100W SUPERVOOC fast charging';
  } else if (lower.includes('pixel') || brand.toLowerCase() === 'google') {
    displayTech = '6.7-inch Super Actua OLED display with 120Hz refresh rate and 2400 nits peak brightness';
    processor = 'Google Tensor G3 custom security-focused AI chip';
    rearCameraTech = 'Pro Triple Rear Camera system with 50MP Main OIS + 48MP Ultra-Wide with Macro Focus + 48MP 5x Telephoto Zoom';
    frontCameraTech = '10.5MP Dual PD front selfie camera with Auto-Focus and Magic Eraser';
    batteryTech = '5050mAh 24+ hour battery with 30W Fast Wired and Qi Wireless Charging';
  } else if (lower.includes('xiaomi') || lower.includes('redmi') || lower.includes('poco')) {
    displayTech = '6.67-inch 120Hz CrystalRes AMOLED display with Dolby Vision, HDR10+, and 1920Hz PWM dimming';
    processor = 'Qualcomm Snapdragon / MediaTek Dimensity high-speed gaming chipset';
    rearCameraTech = '200MP / 50MP OIS primary rear camera with 8MP Ultra-Wide and 2MP Macro lens';
    frontCameraTech = '16MP / 32MP In-display HD Selfie Camera with AI Beauty mode';
    batteryTech = '5000mAh battery with 67W / 120W HyperCharge fast charger';
  }

  return `The ${name} is engineered for exceptional mobile performance. It features an immersive ${displayTech}. Powered by the ${processor}, it delivers seamless gaming, multitasking, and AI capabilities. The photography setup includes an advanced rear camera system (${rearCameraTech}) along with a high-clarity front camera (${frontCameraTech}). Backed by a ${batteryTech}, it keeps up with your busiest days.`;
}

function generateAccessoryDescription(name, brand, subcategory) {
  const lower = name.toLowerCase();

  if (lower.includes('charger') || lower.includes('adapter') || subcategory === 'Charger') {
    const wattage = name.match(/(\d+)\s*W/i)?.[1] || '65W';
    return `The ${name} features advanced GaN (Gallium Nitride) technology, delivering high-speed ${wattage} Power Delivery charging in an ultra-compact footprint. Equipped with multi-layer safety protections against over-voltage, overheating, and short circuits, it safely fast-charges smartphones, tablets, and laptops simultaneously.`;
  }

  if (lower.includes('case') || lower.includes('cover') || subcategory === 'Cover & Case') {
    return `Designed specifically for precision fit, the ${name} offers military-grade drop defense combined with a sleek, non-slip grip. Features raised lip bevels around the display and camera lenses for maximum impact absorption without adding bulk to your device.`;
  }

  if (lower.includes('earbuds') || lower.includes('headphone') || lower.includes('tws') || subcategory === 'Audio & Headphones') {
    return `Immerse yourself in rich, high-fidelity sound with the ${name}. Equipped with precision dynamic drivers, Active Noise Cancellation (ANC), and crystal-clear HD microphones for calls. Provides up to 30 hours of extended playtime with fast-charging case support and IPX5 sweat resistance.`;
  }

  if (lower.includes('power bank') || lower.includes('battery') || subcategory === 'Power Bank') {
    const capacity = name.match(/(\d+k|\d+,\d+|\d+)\s*mAh/i)?.[0] || '10,000mAh';
    return `Stay powered anywhere with the ${name}. Featuring a high-capacity ${capacity} lithium-polymer core with dual USB-C and USB-A output ports, it fast-charges multiple devices on the go with LED digital power indicators and multi-protect safety circuitry.`;
  }

  if (lower.includes('guard') || lower.includes('glass') || lower.includes('protector') || subcategory === 'Screen Guard') {
    return `Engineered with premium 9H hardness tempered glass, the ${name} delivers edge-to-edge scratch resistance while preserving touch sensitivity and HD optical clarity. Treated with an oleophobic coating to repel fingerprint smudges and oils.`;
  }

  return `The ${name} is engineered with premium materials for maximum durability and seamless device compatibility. Designed to enhance your daily smartphone experience with ergonomic handling and reliable performance.`;
}

module.exports = {
  generateAiDescription,
  generateAiData,
  generateSmartphoneSpecs,
};
