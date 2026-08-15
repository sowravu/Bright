const Brand = require('../models/Brand');

/**
 * Official Wikimedia Vector SVG Logos for exact brand matching
 */
const officialVectorLogos = {
  samsung: 'https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg',
  apple: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg',
  xiaomi: 'https://upload.wikimedia.org/wikipedia/commons/2/29/Xiaomi_logo.svg',
  vivo: 'https://upload.wikimedia.org/wikipedia/commons/e/e5/Vivo_mobile_logo.svg',
  oneplus: 'https://upload.wikimedia.org/wikipedia/commons/2/2b/OnePlus_logo.svg',
  google: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
  motorola: 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Motorola_logo.svg',
  realme: 'https://upload.wikimedia.org/wikipedia/commons/e/e1/Realme_logo.svg',
  nothing: 'https://upload.wikimedia.org/wikipedia/commons/3/30/Nothing_Technology_logo.svg',
  lava: 'https://upload.wikimedia.org/wikipedia/commons/8/87/Lava_International_logo.svg',
  oppo: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/OPPO_Logo.svg',
  poco: 'https://upload.wikimedia.org/wikipedia/commons/8/8a/POCO_Logo.svg',
};

/**
 * @desc    Create a new Brand
 * @route   POST /api/brands
 * @access  Private/Admin
 */
const createBrand = async (req, res, next) => {
  try {
    const { name, description, logo } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Brand name is required' });
    }

    const existing = await Brand.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
    if (existing) {
      return res.status(400).json({ message: 'A brand with this name already exists' });
    }

    let logoPath = logo || '';
    if (req.file) {
      logoPath = `/uploads/${req.file.filename}`;
    }

    const brand = await Brand.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      logo: logoPath,
    });

    res.status(201).json({
      message: 'Brand created successfully',
      brand,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all Brands
 * @route   GET /api/brands
 * @access  Public
 */
const getBrands = async (req, res, next) => {
  try {
    const { activeOnly } = req.query;
    const filter = activeOnly === 'true' ? { isActive: true } : {};
    let brands = await Brand.find(filter).sort({ name: 1 });

    // Seed default major brands if DB has no brands yet
    if (brands.length === 0) {
      const defaultBrands = [
        { name: 'Samsung', description: 'Galaxy AI, Foldables & Titanium Ultra', logo: officialVectorLogos.samsung },
        { name: 'Apple', description: 'iPhone 15 Pro, Bionic & iOS Ecosystem', logo: officialVectorLogos.apple },
        { name: 'Vivo', description: 'Portrait Masters & ZEISS Optics', logo: officialVectorLogos.vivo },
        { name: 'Lava', description: 'Proudly Indian Agni & Blaze 5G', logo: officialVectorLogos.lava },
        { name: 'Nothing', description: 'Glyph Matrix & Clean Nothing OS', logo: officialVectorLogos.nothing },
        { name: 'Xiaomi', description: 'High performance smartphones with Leica imaging technology', logo: officialVectorLogos.xiaomi },
        { name: 'OnePlus', description: 'Never Settle - 100W Fast Charging', logo: officialVectorLogos.oneplus },
      ];
      await Brand.insertMany(defaultBrands);
      brands = await Brand.find(filter).sort({ name: 1 });
    }

    res.json({ count: brands.length, brands });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single Brand by ID
 * @route   GET /api/brands/:id
 * @access  Public
 */
const getBrandById = async (req, res, next) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }
    res.json(brand);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update Brand
 * @route   PUT /api/brands/:id
 * @access  Private/Admin
 */
const updateBrand = async (req, res, next) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }

    const { name, description, logo, isActive } = req.body;

    if (name && name.trim() !== brand.name) {
      const existing = await Brand.findOne({
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        _id: { $ne: brand._id },
      });
      if (existing) {
        return res.status(400).json({ message: 'Another brand with this name already exists' });
      }
      brand.name = name.trim();
    }

    if (description !== undefined) brand.description = description.trim();
    if (logo !== undefined) brand.logo = logo;
    if (isActive !== undefined) brand.isActive = isActive === 'true' || isActive === true;

    if (req.file) {
      brand.logo = `/uploads/${req.file.filename}`;
    }

    await brand.save();
    res.json({ message: 'Brand updated successfully', brand });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete Brand
 * @route   DELETE /api/brands/:id
 * @access  Private/Admin
 */
const deleteBrand = async (req, res, next) => {
  try {
    const brand = await Brand.findByIdAndDelete(req.params.id);
    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }
    res.json({ message: 'Brand deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper to generate 3D Glassmorphic Vector SVG Data URI for AI Brand Logos
 */
function buildAiBrandSvg(brandName, customPrompt = '') {
  const cleanName = brandName.trim();
  const initials = cleanName.length <= 3 ? cleanName.toUpperCase() : cleanName.substring(0, 2).toUpperCase();

  const themes = {
    samsung: { bg1: '#146ef5', bg2: '#7832ff', accent: '#60a5fa' },
    apple: { bg1: '#334155', bg2: '#0f172a', accent: '#cbd5e1' },
    xiaomi: { bg1: '#ff6900', bg2: '#dc2626', accent: '#fdba74' },
    vivo: { bg1: '#0891b2', bg2: '#0284c7', accent: '#67e8f9' },
    lava: { bg1: '#ef4444', bg2: '#b91c1c', accent: '#fca5a5' },
    nothing: { bg1: '#0f172a', bg2: '#1e293b', accent: '#e2e8f0' },
    oneplus: { bg1: '#dc2626', bg2: '#991b1b', accent: '#f87171' },
    google: { bg1: '#4285f4', bg2: '#ea4335', accent: '#fbbc05' },
  };

  const key = cleanName.toLowerCase();
  let theme = themes[key];

  if (!theme || customPrompt.toLowerCase().includes('gold') || customPrompt.toLowerCase().includes('yellow')) {
    if (customPrompt.toLowerCase().includes('gold')) {
      theme = { bg1: '#d97706', bg2: '#78350f', accent: '#fef08a' };
    } else if (customPrompt.toLowerCase().includes('green')) {
      theme = { bg1: '#059669', bg2: '#064e3b', accent: '#a7f3d0' };
    } else {
      let hash = 0;
      for (let i = 0; i < cleanName.length; i++) hash += cleanName.charCodeAt(i);
      const palettes = [
        { bg1: '#2563eb', bg2: '#7c3aed', accent: '#60a5fa' },
        { bg1: '#ea580c', bg2: '#dc2626', accent: '#fb923c' },
        { bg1: '#0891b2', bg2: '#0284c7', accent: '#22d3ee' },
        { bg1: '#0f172a', bg2: '#334155', accent: '#94a3b8' },
      ];
      theme = palettes[hash % palettes.length];
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${theme.bg1}"/>
        <stop offset="100%" stop-color="${theme.bg2}"/>
      </linearGradient>
      <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9"/>
        <stop offset="100%" stop-color="${theme.accent}" stop-opacity="0.3"/>
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="${theme.bg1}" flood-opacity="0.4"/>
      </filter>
    </defs>
    <rect width="512" height="512" rx="128" fill="url(#bgGrad)" filter="url(#shadow)"/>
    <circle cx="256" cy="256" r="180" fill="none" stroke="url(#ringGrad)" stroke-width="12" opacity="0.6"/>
    <circle cx="256" cy="256" r="140" fill="#ffffff" fill-opacity="0.15" stroke="#ffffff" stroke-width="4"/>
    <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="150" fill="#ffffff" letter-spacing="-2">${initials}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * @desc    Generate AI Logo for Brand using Gemini API / Prompt Engine / Official Vector Directory
 * @route   POST /api/brands/ai-logo
 * @access  Private/Admin
 */
const generateAiLogo = async (req, res, next) => {
  try {
    const { name, prompt } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Brand name is required to generate AI Logo' });
    }

    const cleanName = name.trim();
    const lowerKey = cleanName.toLowerCase();
    const userPrompt = (prompt && typeof prompt === 'string') ? prompt.trim() : '';
    const isOfficialRequest = !userPrompt || userPrompt.toLowerCase().includes('official') || userPrompt.toLowerCase().includes('exact') || userPrompt.toLowerCase().includes('vector');

    let aiLogoUrl = '';

    // 1. If official vector logo requested or matched
    if (isOfficialRequest && officialVectorLogos[lowerKey]) {
      aiLogoUrl = officialVectorLogos[lowerKey];
    } else {
      aiLogoUrl = buildAiBrandSvg(cleanName, userPrompt);
    }

    // 2. Query Gemini API with custom prompt if GEMINI_API_KEY is configured
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (geminiApiKey && geminiApiKey.trim() && userPrompt && !isOfficialRequest) {
      try {
        const fullPrompt = `Provide a single direct HTTP logo image URL for brand "${cleanName}" matching prompt: "${userPrompt}". Return ONLY the raw URL starting with http.`;
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey.trim()}`;
        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (text && (text.startsWith('http://') || text.startsWith('https://')) && (text.endsWith('.png') || text.endsWith('.svg') || text.includes('wikimedia.org') || text.includes('unsplash.com'))) {
            aiLogoUrl = text.split('\n')[0].replace(/^["']|["']$/g, '');
          }
        }
      } catch (err) {
        console.warn('Gemini API custom prompt call failed:', err.message);
      }
    }

    res.json({
      message: `AI Logo generated for ${cleanName}`,
      logo: aiLogoUrl,
      brandName: cleanName,
      userPrompt
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBrand,
  getBrands,
  getBrandById,
  updateBrand,
  deleteBrand,
  generateAiLogo,
};
