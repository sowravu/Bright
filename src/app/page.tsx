'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Sparkles, ArrowRight, Zap, Smartphone, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './page.module.css';

export default function Home() {
  const productsCatalog = useSelector((state: RootState) => state.products.items || []);
  const bannerState = useSelector((state: RootState) => state.banner);
  const auth = useSelector((state: RootState) => state.auth);

  // Flash Deals Countdown Timer
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 34, seconds: 12 });

  // Available Brands State & Horizontal Scroll Ref
  const [brands, setBrands] = useState<any[]>([]);
  const brandsScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { hours: prev.hours, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        clearInterval(timer);
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/brands');
        if (res.ok) {
          const data = await res.json();
          const bList = data.brands || (Array.isArray(data) ? data : []);
          if (bList.length > 0) {
            setBrands(bList);
          }
        }
      } catch (_) {}
    };
    fetchBrands();
  }, []);

  const scrollBrands = (direction: 'left' | 'right') => {
    if (brandsScrollRef.current) {
      const scrollAmount = 320;
      brandsScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const defaultBrands = [
    { name: 'Samsung', tagline: 'Galaxy AI, Foldables & Titanium Ultra', logo: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=80&w=200' },
    { name: 'Apple', tagline: 'iPhone 15 Pro, Bionic & iOS Ecosystem', logo: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?q=80&w=200' },
    { name: 'Vivo', tagline: 'Portrait Masters & ZEISS Optics', logo: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=200' },
    { name: 'Lava', tagline: 'Proudly Indian Agni & Blaze 5G', logo: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?q=80&w=200' },
    { name: 'Nothing', tagline: 'Glyph Matrix & Clean Nothing OS', logo: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=200' },
    { name: 'Xiaomi', tagline: 'Leica Cameras & HyperOS Power', logo: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?q=80&w=200' },
    { name: 'OnePlus', tagline: 'Never Settle - 100W Charging', logo: 'https://images.unsplash.com/photo-1546054454-aa26e2b734c7?q=80&w=200' },
  ];

  const brandThemes: Record<string, { glow: string; color: string }> = {
    samsung: { glow: 'rgba(37, 99, 235, 0.35)', color: '#2563eb' },
    apple: { glow: 'rgba(148, 163, 184, 0.4)', color: '#475569' },
    vivo: { glow: 'rgba(6, 182, 212, 0.35)', color: '#0891b2' },
    lava: { glow: 'rgba(239, 68, 68, 0.35)', color: '#dc2626' },
    nothing: { glow: 'rgba(15, 23, 42, 0.3)', color: '#0f172a' },
    xiaomi: { glow: 'rgba(249, 115, 22, 0.35)', color: '#ea580c' },
    oneplus: { glow: 'rgba(220, 38, 38, 0.35)', color: '#b91c1c' },
  };

  const displayBrands = brands.length > 0 
    ? brands.map((b: any) => {
        const name = b.name || 'Brand';
        const def = defaultBrands.find((d) => d.name.toLowerCase() === name.toLowerCase());
        return {
          _id: b._id || b.id,
          name: b.name,
          logo: b.logo || def?.logo || '',
          description: b.description || def?.tagline || 'Official Brand Warranty & Certified Inventory',
        };
      })
    : defaultBrands;

  // Featured flagship product or first product in real catalog
  const heroProduct = productsCatalog.find((p: any) => p.isFeatured || p.category === 'smartphones') || productsCatalog[0];
  const dealProducts = productsCatalog.slice(0, 3);

  const bannerTitle = bannerState?.title || (heroProduct ? heroProduct.name : 'Welcome to Bright Mobile');
  const bannerDesc = bannerState?.description || (heroProduct
    ? (heroProduct.description || `${heroProduct.brand?.name || ''} smartphone with official warranty and ultra-fast delivery.`)
    : 'Discover premium smartphones, wireless earbuds, fast chargers, and accessories with official brand warranty.');
  const bannerBadge = bannerState?.badge || 'Official Mobile & Accessories Store';
  const bannerImage = bannerState?.image || heroProduct?.images?.[0];
  const ctaText = bannerState?.ctaText || 'Explore Catalog';
  const ctaLink = bannerState?.ctaLink || (heroProduct ? `/products/${heroProduct.slug || heroProduct.id}` : '/products');
  const buttonColor = bannerState?.buttonColor || '#2563eb';
  const buttonTextColor = bannerState?.buttonTextColor || '#ffffff';
  const secondaryCtaText = bannerState?.secondaryCtaText || 'Admin Store Manager';
  const secondaryCtaLink = bannerState?.secondaryCtaLink || '/admin';
  const shouldShowAdminBtn = auth.user?.role === 'ADMIN' || bannerState?.showSecondaryBtn;

  return (
    <div className={styles.home}>
      {/* 1. Flagship Hero Banner */}
      <section className={`${styles.hero} glass`}>
        <div className={styles.heroContent}>
          {bannerBadge && (
            <div className={styles.badgeRow}>
              <Sparkles size={16} />
              <span>{bannerBadge}</span>
            </div>
          )}
          <h1>{bannerTitle}</h1>
          <p className={styles.heroSub}>{bannerDesc}</p>

          {heroProduct && !bannerState?.image ? (
            <div className={styles.priceRow}>
              <span className={styles.currentPrice}>₹{(heroProduct.discountPrice || heroProduct.basePrice || heroProduct.price || 0).toLocaleString('en-IN')}</span>
              {heroProduct.discountPrice && (heroProduct.basePrice || heroProduct.price) && (
                <span className={styles.originalPrice}>₹{(heroProduct.basePrice || heroProduct.price || 0).toLocaleString('en-IN')}</span>
              )}
            </div>
          ) : null}

          <div className={styles.heroCTAs}>
            <Link
              href={ctaLink}
              className="btn"
              style={{
                backgroundColor: buttonColor,
                color: buttonTextColor,
                borderColor: buttonColor,
                fontWeight: 700,
              }}
            >
              {ctaText} <ArrowRight size={16} />
            </Link>

            {shouldShowAdminBtn && (
              <Link href={secondaryCtaLink} className="btn btnSecondary">
                {secondaryCtaText}
              </Link>
            )}
          </div>
        </div>
        <div className={styles.heroImage}>
          {bannerImage ? (
            <img src={bannerImage} alt={bannerTitle} style={{ maxHeight: '300px', objectFit: 'contain', width: '100%' }} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '260px', color: 'var(--foreground-secondary)' }}>
              <Smartphone size={72} style={{ opacity: 0.5, marginBottom: '12px' }} />
              <p style={{ fontWeight: 600 }}>Catalog Ready for Real Products</p>
              <Link href="/admin" className="btn btnPrimary" style={{ marginTop: '12px', fontSize: '12px' }}>
                + Add Real Products in Admin Section
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* 2. Available Brands Single Line Trend Carousel */}
      <section className={styles.brandsSection}>
        <div className={styles.brandsHeader}>
          <div>
            <h2>Explore Available Brands</h2>
            <p>Shop official smartphones & certified accessories by your favorite brand ecosystem</p>
          </div>

          <div className={styles.headerControls}>
            <div className={styles.scrollNavBtns}>
              <button
                onClick={() => scrollBrands('left')}
                aria-label="Scroll left"
                className={styles.scrollNavBtn}
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => scrollBrands('right')}
                aria-label="Scroll right"
                className={styles.scrollNavBtn}
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <Link href="/products" className="btn btnSecondary" style={{ fontSize: '13px' }}>
              View All <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div ref={brandsScrollRef} className={styles.brandsCarousel}>
          {displayBrands.map((b: any, idx: number) => {
            const brandName = typeof b === 'string' ? b : (b.name || 'Brand');
            const count = productsCatalog.filter((p: any) => {
              const pBrand = typeof p.brand === 'string' ? p.brand : (p.brand?.name || '');
              return pBrand.toLowerCase() === brandName.toLowerCase();
            }).length;

            const bKey = brandName.toLowerCase();
            const theme = brandThemes[bKey] || { glow: 'rgba(37, 99, 235, 0.3)', color: '#2563eb' };

            return (
              <Link
                key={b._id || b.id || idx}
                href={`/products?brand=${encodeURIComponent(brandName)}`}
                className={styles.brandCard}
                style={{
                  '--brand-glow': theme.glow,
                  '--brand-color': theme.color,
                } as React.CSSProperties}
              >
                <div className={styles.brandAvatarRing}>
                  {b.logo ? (
                    <img 
                      src={b.logo} 
                      alt={brandName} 
                      className={styles.brandLogo} 
                      onError={(e) => {
                        const initials = brandName.substring(0, 2).toUpperCase();
                        e.currentTarget.src = `data:image/svg+xml;utf8,${encodeURIComponent(
                          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" rx="40" fill="#2563eb"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="70" fill="#fff">${initials}</text></svg>`
                        )}`;
                      }}
                    />
                  ) : (
                    <div className={styles.brandIconFallback}>
                      {brandName.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                <h3 className={styles.brandName}>{brandName}</h3>
                <p className={styles.brandTagline}>
                  {b.description || b.tagline || 'Official Brand Warranty & Certified Inventory'}
                </p>

                <div className={styles.brandFooterRow}>
                  <span className={styles.brandBadge}>
                    <span className={styles.dotLive} />
                    {count > 0 ? `${count} ${count === 1 ? 'Model' : 'Models'}` : 'Catalog Ready'}
                  </span>

                  <span className={styles.exploreArrow}>
                    Explore <ArrowRight size={13} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. Flash Deals & Promotions */}
      {dealProducts.length > 0 && (
        <section className={styles.dealsSection}>
          <div className={styles.sectionHeader}>
            <div className={styles.headerTitle}>
              <Zap className={styles.zapIcon} />
              <h2>Trending Catalog Items</h2>
            </div>
            <div className={styles.countdown}>
              <span>Ends in:</span>
              <div className={styles.timerBox}>{timeLeft.hours.toString().padStart(2, '0')}h</div>
              <div className={styles.timerBox}>{timeLeft.minutes.toString().padStart(2, '0')}m</div>
              <div className={styles.timerBox}>{timeLeft.seconds.toString().padStart(2, '0')}s</div>
            </div>
          </div>

          <div className={styles.dealsGrid}>
            {dealProducts.map((p: any) => (
              <div key={p.id || p._id} className={`${styles.dealCard} glass`}>
                <div className={styles.dealBadge}>{p.category === 'smartphones' ? 'Smartphone' : 'Accessory'}</div>
                <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=300'} alt={p.name} />
                <h3>{p.name}</h3>
                <div className={styles.dealPrice}>
                  <span className={styles.dealNew}>₹{(p.discountPrice || p.basePrice || p.price || 0).toLocaleString('en-IN')}</span>
                  {p.discountPrice && (p.basePrice || p.price) && (
                    <span className={styles.dealOld}>₹{(p.basePrice || p.price || 0).toLocaleString('en-IN')}</span>
                  )}
                </div>
                <Link href={`/products/${p.slug || p.id}`} className={styles.dealLink}>View Details</Link>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
