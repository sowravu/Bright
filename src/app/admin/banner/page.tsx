'use client';

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../store';
import { setBanner, resetBannerState } from '../../../store/bannerSlice';
import { useToast } from '../../../context/ToastContext';
import { Sparkles, ArrowRight, Upload, Image as ImageIcon, RotateCcw, Save, CheckCircle, ExternalLink, Palette, Gift, Zap, Sun } from 'lucide-react';
import Link from 'next/link';
import homeStyles from '../../page.module.css';

const presetTemplates = [
  {
    id: 'onam',
    name: 'Onam Grand Sale 🌼',
    badge: '🌼 Onam Grand Festive Offer',
    title: 'Grand Onam Tech Celebration',
    description: 'Celebrate Onam with golden discounts on top 5G smartphones, earbuds & accessories! Get up to 40% OFF with official brand warranty.',
    ctaText: 'Claim Onam Offers',
    buttonColor: '#d97706',
    buttonTextColor: '#ffffff',
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=800',
    colorName: 'Golden Amber',
  },
  {
    id: 'christmas',
    name: 'Christmas & New Year 🎅',
    badge: '🎅 Festive Christmas & New Year Sale',
    title: 'Merry Christmas Tech Savings',
    description: "Unwrap joy this holiday season! Special Christmas price drops on iPhone 15, Samsung Galaxy, and wireless accessories.",
    ctaText: "Shop Santa's Deals",
    buttonColor: '#dc2626',
    buttonTextColor: '#ffffff',
    image: 'https://images.unsplash.com/photo-1512909006721-3d6018887383?q=80&w=800',
    colorName: 'Crimson Red',
  },
  {
    id: 'flash',
    name: 'Tech Dhamaka Sale ⚡',
    badge: '⚡ 24-Hour Super Tech Dhamaka',
    title: 'Flash Sale - Massive Discounts!',
    description: 'Limited stock flash deal! Get extra exchange bonuses, no-cost EMI options, and express 2-hour home delivery.',
    ctaText: 'Grab Flash Deals Now',
    buttonColor: '#9333ea',
    buttonTextColor: '#ffffff',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800',
    colorName: 'Neon Purple',
  },
  {
    id: 'default',
    name: 'Classic Store Banner 📱',
    badge: 'Official Mobile & Accessories Store',
    title: 'Welcome to Bright Mobile',
    description: 'Discover premium smartphones, wireless earbuds, fast chargers, and accessories with official brand warranty.',
    ctaText: 'Explore Catalog',
    buttonColor: '#2563eb',
    buttonTextColor: '#ffffff',
    image: '',
    colorName: 'Bright Blue',
  },
];

const colorSwatches = [
  { label: 'Primary Blue', bg: '#2563eb', text: '#ffffff' },
  { label: 'Golden Gold', bg: '#d97706', text: '#ffffff' },
  { label: 'Crimson Red', bg: '#dc2626', text: '#ffffff' },
  { label: 'Neon Purple', bg: '#9333ea', text: '#ffffff' },
  { label: 'Emerald Green', bg: '#059669', text: '#ffffff' },
  { label: 'Sunset Orange', bg: '#ea580c', text: '#ffffff' },
  { label: 'Midnight Dark', bg: '#0f172a', text: '#ffffff' },
];

export default function AdminBannerPage() {
  const dispatch = useDispatch();
  const bannerState = useSelector((state: RootState) => state.banner);
  const auth = useSelector((state: RootState) => state.auth);
  const { showToast } = useToast();

  const [title, setTitle] = useState(bannerState.title || '');
  const [description, setDescription] = useState(bannerState.description || '');
  const [badge, setBadge] = useState(bannerState.badge || '');
  const [image, setImage] = useState(bannerState.image || '');
  const [ctaText, setCtaText] = useState(bannerState.ctaText || 'Explore Catalog');
  const [ctaLink, setCtaLink] = useState(bannerState.ctaLink || '/products');
  const [buttonColor, setButtonColor] = useState(bannerState.buttonColor || '#2563eb');
  const [buttonTextColor, setButtonTextColor] = useState(bannerState.buttonTextColor || '#ffffff');
  const [secondaryCtaText, setSecondaryCtaText] = useState(bannerState.secondaryCtaText || 'Admin Store Manager');
  const [secondaryCtaLink, setSecondaryCtaLink] = useState(bannerState.secondaryCtaLink || '/admin');
  const [showSecondaryBtn, setShowSecondaryBtn] = useState(bannerState.showSecondaryBtn || false);
  const [selectedTemplate, setSelectedTemplate] = useState(bannerState.templateName || 'default');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setTitle(bannerState.title || 'Welcome to Bright Mobile');
    setDescription(
      bannerState.description ||
        'Discover premium smartphones, wireless earbuds, fast chargers, and accessories with official brand warranty.'
    );
    setBadge(bannerState.badge || 'Official Mobile & Accessories Store');
    setImage(bannerState.image || '');
    setCtaText(bannerState.ctaText || 'Explore Catalog');
    setCtaLink(bannerState.ctaLink || '/products');
    setButtonColor(bannerState.buttonColor || '#2563eb');
    setButtonTextColor(bannerState.buttonTextColor || '#ffffff');
    setSecondaryCtaText(bannerState.secondaryCtaText || 'Admin Store Manager');
    setSecondaryCtaLink(bannerState.secondaryCtaLink || '/admin');
    setShowSecondaryBtn(bannerState.showSecondaryBtn || false);
    setSelectedTemplate(bannerState.templateName || 'default');
  }, [bannerState]);

  const applyTemplate = (tpl: (typeof presetTemplates)[0]) => {
    setSelectedTemplate(tpl.id);
    setTitle(tpl.title);
    setDescription(tpl.description);
    setBadge(tpl.badge);
    setCtaText(tpl.ctaText);
    setButtonColor(tpl.buttonColor);
    setButtonTextColor(tpl.buttonTextColor);
    setImage(tpl.image);
    showToast(`Applied "${tpl.name}" template preset! Click Save to apply storewide.`, 'success');
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showToast('Image size exceeds 10MB limit. Please choose a smaller image.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImage(reader.result);
          showToast(`Image "${file.name}" uploaded successfully!`, 'success');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Banner title cannot be empty', 'error');
      return;
    }
    if (!description.trim()) {
      showToast('Banner description cannot be empty', 'error');
      return;
    }

    setIsSaving(true);
    const updatedData = {
      title: title.trim(),
      description: description.trim(),
      badge: badge.trim(),
      image: image.trim(),
      ctaText: ctaText.trim() || 'Explore Catalog',
      ctaLink: ctaLink.trim() || '/products',
      buttonColor: buttonColor || '#2563eb',
      buttonTextColor: buttonTextColor || '#ffffff',
      secondaryCtaText: secondaryCtaText.trim() || 'Admin Store Manager',
      secondaryCtaLink: secondaryCtaLink.trim() || '/admin',
      showSecondaryBtn: showSecondaryBtn,
      templateName: selectedTemplate,
      isActive: true,
    };

    // Dispatch to Redux (which also syncs to localStorage)
    dispatch(setBanner(updatedData));

    // Persist to backend API if available
    try {
      const res = await fetch('http://localhost:5000/api/banner', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify(updatedData),
      });

      if (res.ok) {
        const saved = await res.json();
        dispatch(setBanner(saved));
        showToast('Banner, colors & festival templates updated live on store!', 'success');
      } else {
        showToast('Banner updated locally (backend offline or unavailable)', 'info');
      }
    } catch (_) {
      showToast('Banner updated locally in store memory', 'info');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset the banner to default system settings?')) return;

    dispatch(resetBannerState());
    showToast('Banner reset to default settings.', 'success');

    try {
      await fetch('http://localhost:5000/api/banner/reset', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });
    } catch (_) {}
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1200px' }}>
      {/* Page Title Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={24} style={{ color: 'var(--primary)' }} />
            Store Banner, Festival Templates & Styling
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--foreground-secondary)' }}>
            Select festival theme presets (Onam, Christmas, Flash Sale), customize button text & background colors, and control user storefront visibility.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={handleReset}
            className="btn btnSecondary"
            style={{ fontSize: '13px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RotateCcw size={15} />
            <span>Reset Default</span>
          </button>
          <Link
            href="/"
            target="_blank"
            className="btn btnPrimary"
            style={{ fontSize: '13px', padding: '8px 14px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <ExternalLink size={15} />
            <span>View User Storefront</span>
          </Link>
        </div>
      </div>

      {/* Festival Presets Carousel / Cards */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '24px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Gift size={18} style={{ color: '#d97706' }} />
          1-Click Festive Theme Templates
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
          {presetTemplates.map((tpl) => {
            const isSelected = selectedTemplate === tpl.id;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => applyTemplate(tpl)}
                style={{
                  textAlign: 'left',
                  background: isSelected ? 'rgba(37, 99, 235, 0.08)' : 'var(--background-secondary)',
                  border: isSelected ? `2px solid ${tpl.buttonColor}` : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--foreground)' }}>{tpl.name}</h4>
                  <span
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      background: tpl.buttonColor,
                      display: 'inline-block',
                    }}
                  />
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--foreground-secondary)', lineHeight: '1.4' }}>
                  {tpl.badge}
                </p>
                <div style={{ marginTop: '10px', fontSize: '11px', fontWeight: 700, color: tpl.buttonColor }}>
                  Load Template →
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Preview Section */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={18} style={{ color: '#10b981' }} />
            Live Preview (How Users See It)
          </h3>
          <span style={{ fontSize: '12px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', padding: '4px 10px', borderRadius: '12px', fontWeight: 600 }}>
            Real-Time Sync Active
          </span>
        </div>

        {/* Embedded User Hero Card */}
        <section className={`${homeStyles.hero} glass`} style={{ margin: 0, width: '100%' }}>
          <div className={homeStyles.heroContent}>
            {badge && (
              <div className={homeStyles.badgeRow}>
                <Sparkles size={16} />
                <span>{badge}</span>
              </div>
            )}
            <h1>{title || 'Welcome to Bright Mobile'}</h1>
            <p className={homeStyles.heroSub}>
              {description || 'Discover premium smartphones, wireless earbuds, fast chargers, and accessories with official brand warranty.'}
            </p>
            <div className={homeStyles.heroCTAs}>
              <button
                className="btn"
                type="button"
                style={{
                  pointerEvents: 'none',
                  backgroundColor: buttonColor,
                  color: buttonTextColor,
                  borderColor: buttonColor,
                  fontWeight: 700,
                }}
              >
                {ctaText || 'Explore Catalog'} <ArrowRight size={16} />
              </button>

              {showSecondaryBtn && (
                <button className="btn btnSecondary" type="button" style={{ pointerEvents: 'none' }}>
                  {secondaryCtaText || 'Admin Store Manager'}
                </button>
              )}
            </div>
          </div>
          <div className={homeStyles.heroImage}>
            {image ? (
              <img
                src={image}
                alt="Banner Preview"
                style={{ maxHeight: '280px', objectFit: 'contain', width: '100%', borderRadius: '12px' }}
              />
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '220px',
                  color: 'var(--foreground-secondary)',
                  border: '2px dashed var(--border-color)',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center',
                }}
              >
                <ImageIcon size={48} style={{ opacity: 0.5, marginBottom: '8px' }} />
                <p style={{ fontWeight: 600, margin: '4px 0', fontSize: '14px' }}>Default Catalog Image Displayed</p>
                <span style={{ fontSize: '12px', opacity: 0.8 }}>
                  Upload a custom banner image or choose a festival template above.
                </span>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Admin Form Controls */}
      <form onSubmit={handleSaveBanner} style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '32px', display: 'flex', flexDirection: 'column', gap: '28px', boxShadow: 'var(--card-shadow)' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--foreground)' }}>Customize Content & Button Styling</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--foreground-secondary)' }}>
            Fine-tune title, description, badge text, button colors, and custom images to create high-converting promotional banners.
          </p>
        </div>

        {/* Content Section Card */}
        <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} style={{ color: 'var(--primary)' }} />
            Banner Text Content
          </h4>

          {/* Badge Input */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--foreground)' }}>
              Top Badge / Offer Tagline
            </label>
            <input
              type="text"
              className="input"
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              placeholder="e.g. 🌼 Onam Grand Festive Offer"
            />
          </div>

          {/* Title Input */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--foreground)' }}>
              Banner Main Heading / Title *
            </label>
            <input
              type="text"
              className="input"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Grand Onam Tech Celebration"
              style={{ fontSize: '15px', fontWeight: 600 }}
            />
          </div>

          {/* Description Input */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--foreground)' }}>
              Banner Subtitle / Description *
            </label>
            <textarea
              className="textarea"
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter the details and promotional offer description..."
              style={{ resize: 'vertical', lineHeight: '1.5' }}
            />
          </div>
        </div>

        {/* Button Color & Text Styling Controls */}
        <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Palette size={18} style={{ color: buttonColor }} />
            Primary CTA Button Styling
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--foreground)' }}>
                Button Label Text
              </label>
              <input
                type="text"
                className="input"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                placeholder="Claim Onam Offers"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--foreground)' }}>
                Button Background Color
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '42px', height: '42px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-color)', flexShrink: 0 }}>
                  <input
                    type="color"
                    value={buttonColor}
                    onChange={(e) => setButtonColor(e.target.value)}
                    style={{ position: 'absolute', top: '-10px', left: '-10px', width: '60px', height: '60px', border: 'none', cursor: 'pointer' }}
                  />
                </div>
                <input
                  type="text"
                  className="input"
                  value={buttonColor}
                  onChange={(e) => setButtonColor(e.target.value)}
                  style={{ flex: 1, fontSize: '13px', fontFamily: 'monospace', fontWeight: 600 }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--foreground)' }}>
                Button Text Color
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '42px', height: '42px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-color)', flexShrink: 0 }}>
                  <input
                    type="color"
                    value={buttonTextColor}
                    onChange={(e) => setButtonTextColor(e.target.value)}
                    style={{ position: 'absolute', top: '-10px', left: '-10px', width: '60px', height: '60px', border: 'none', cursor: 'pointer' }}
                  />
                </div>
                <input
                  type="text"
                  className="input"
                  value={buttonTextColor}
                  onChange={(e) => setButtonTextColor(e.target.value)}
                  style={{ flex: 1, fontSize: '13px', fontFamily: 'monospace', fontWeight: 600 }}
                />
              </div>
            </div>
          </div>

          {/* Quick Color Swatches */}
          <div>
            <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: 'var(--foreground-secondary)' }}>
              Quick Preset Color Palette:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {colorSwatches.map((swatch) => (
                <button
                  key={swatch.bg}
                  type="button"
                  onClick={() => {
                    setButtonColor(swatch.bg);
                    setButtonTextColor(swatch.text);
                  }}
                  style={{
                    background: swatch.bg,
                    color: swatch.text,
                    border: buttonColor === swatch.bg ? '2px solid var(--foreground)' : 'none',
                    borderRadius: '16px',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                    transition: 'transform 0.15s ease',
                  }}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff' }} />
                  {swatch.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Secondary Button Toggle Card */}
        <div style={{ background: 'var(--bg-secondary)', padding: '18px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--foreground)' }}>"Admin Store Manager" Secondary Button</h4>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--foreground-secondary)' }}>
              Controls whether the second button is visible to standard public users. (Always visible to logged in admins).
            </p>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '13px', color: 'var(--foreground)' }}>
            <input
              type="checkbox"
              checked={showSecondaryBtn}
              onChange={(e) => setShowSecondaryBtn(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
            />
            <span>Show to Public Users</span>
          </label>
        </div>

        {/* Banner Image Upload & URL Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: 'var(--bg-secondary)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <label style={{ fontSize: '14px', fontWeight: 700, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Upload size={16} style={{ color: 'var(--primary)' }} />
            Banner Image Options
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', alignItems: 'center' }}>
            <div>
              <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--foreground)' }}>
                Upload Custom File
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageFileUpload}
                style={{ fontSize: '12px', width: '100%' }}
              />
            </div>

            <div>
              <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--foreground)' }}>
                Or Direct Image URL
              </span>
              <input
                type="url"
                className="input"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                style={{ fontSize: '13px' }}
              />
            </div>
          </div>

          {image && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
              <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>✓ Custom image active</span>
              <button
                type="button"
                onClick={() => setImage('')}
                className="btn btnSecondary"
                style={{ fontSize: '11px', padding: '4px 10px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
              >
                Clear Custom Image
              </button>
            </div>
          )}
        </div>

        {/* Submit Action Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '4px' }}>
          <button
            type="submit"
            disabled={isSaving}
            className="btn"
            style={{
              padding: '12px 32px',
              fontSize: '15px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: buttonColor,
              color: buttonTextColor,
              borderColor: buttonColor,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
              cursor: 'pointer',
            }}
          >
            <Save size={18} />
            <span>{isSaving ? 'Saving Banner...' : 'Apply & Save Banner Storewide'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
