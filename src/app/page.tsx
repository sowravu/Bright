'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Sparkles, ArrowRight, Shield, Award, Zap, ChevronDown, CheckCircle, Smartphone } from 'lucide-react';
import styles from './page.module.css';

export default function Home() {
  const productsCatalog = useSelector((state: RootState) => state.products.items || []);
  const bannerState = useSelector((state: RootState) => state.banner);
  const auth = useSelector((state: RootState) => state.auth);

  // Flash Deals Countdown Timer
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 34, seconds: 12 });

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

  // AI Phone Finder Wizard State
  const [finderStep, setFinderStep] = useState(1);
  const [finderAnswers, setFinderAnswers] = useState({ budget: 0, priority: '', brand: '' });
  const [finderResult, setFinderResult] = useState<any>(null);

  // Interactive Exchange Calculator State
  const [exchangeBrand, setExchangeBrand] = useState('Apple');
  const [exchangeCond, setExchangeCond] = useState('Excellent');
  const [exchangeOrigVal, setExchangeOrigVal] = useState('50000');
  const [exchangeResult, setExchangeResult] = useState<number | null>(null);

  // Interactive EMI Calculator State
  const [emiPrincipal, setEmiPrincipal] = useState('19999');
  const [emiMonths, setEmiMonths] = useState(6);
  const [emiResult, setEmiResult] = useState<number | null>(null);

  // FAQ Active Index
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Featured flagship product or first product in real catalog
  const heroProduct = productsCatalog.find((p: any) => p.isFeatured || p.category === 'smartphones') || productsCatalog[0];
  const dealProducts = productsCatalog.slice(0, 3);

  const handleFinderSubmit = () => {
    if (productsCatalog.length === 0) {
      setFinderResult({
        name: 'Explore Our Catalog',
        brand: 'Bright',
        discountPrice: 0,
        slug: '',
        features: 'All Features',
        images: []
      });
      setFinderStep(4);
      return;
    }

    let recommendation = productsCatalog[0];

    const matchByBudget = productsCatalog.filter((p: any) => (p.discountPrice || p.basePrice) <= (finderAnswers.budget || 100000));
    if (matchByBudget.length > 0) {
      recommendation = matchByBudget[0];
    }

    setFinderResult(recommendation);
    setFinderStep(4);
  };

  const calculateExchange = () => {
    const base = parseFloat(exchangeOrigVal) || 0;
    let multiplier = 0.22;
    if (exchangeCond === 'Excellent') multiplier = 0.45;
    else if (exchangeCond === 'Good') multiplier = 0.35;
    
    let bonus = 1.0;
    if (exchangeBrand === 'Apple') bonus = 1.15;
    else if (exchangeBrand === 'Samsung') bonus = 1.05;

    setExchangeResult(Math.round(base * multiplier * bonus));
  };

  const calculateEMI = () => {
    const p = parseFloat(emiPrincipal) || 0;
    const rate = 14 / 12 / 100; // 14% annual interest
    const emi = (p * rate * Math.pow(1 + rate, emiMonths)) / (Math.pow(1 + rate, emiMonths) - 1);
    setEmiResult(Math.round(emi));
  };

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

      {/* 2. Flash Deals & Promotions */}
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
              <div key={p.id} className={`${styles.dealCard} glass`}>
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

      {/* 3. AI Phone Finder Wizard */}
      <section className={`${styles.wizardSection} glass`}>
        <div className={styles.wizardHeader}>
          <Sparkles className={styles.wizardSparkle} />
          <h2>Smart Product Finder</h2>
          <p>Answer 3 quick questions to get instant personalized phone & accessory recommendations</p>
        </div>

        <div className={styles.wizardCard}>
          {finderStep === 1 && (
            <div className={styles.wizardStep}>
              <h3>1. What is your preferred budget range?</h3>
              <div className={styles.optionsGrid}>
                {[
                  { label: 'Under ₹15,000 (Budget)', val: 15000 },
                  { label: '₹15,000 - ₹35,000 (Mid-Range)', val: 35000 },
                  { label: '₹35,000 - ₹60,000 (Premium)', val: 60000 },
                  { label: '₹60,000+ (Ultra Flagship)', val: 120000 }
                ].map((opt) => (
                  <button
                    key={opt.val}
                    className={`${styles.optBtn} ${finderAnswers.budget === opt.val ? styles.optSelected : ''}`}
                    onClick={() => {
                      setFinderAnswers({ ...finderAnswers, budget: opt.val });
                      setFinderStep(2);
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {finderStep === 2 && (
            <div className={styles.wizardStep}>
              <h3>2. What is your top priority feature?</h3>
              <div className={styles.optionsGrid}>
                {[
                  { label: 'Camera & Portrait Quality', val: 'camera' },
                  { label: 'Gaming & High FPS Performance', val: 'gaming' },
                  { label: 'Battery Life & Super Fast Charge', val: 'battery' },
                  { label: 'Clean UI & Long Software Updates', val: 'display' }
                ].map((opt) => (
                  <button
                    key={opt.val}
                    className={`${styles.optBtn} ${finderAnswers.priority === opt.val ? styles.optSelected : ''}`}
                    onClick={() => {
                      setFinderAnswers({ ...finderAnswers, priority: opt.val });
                      setFinderStep(3);
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {finderStep === 3 && (
            <div className={styles.wizardStep}>
              <h3>3. Select preferred brand ecosystems</h3>
              <div className={styles.optionsGrid}>
                {['Vivo', 'Lava', 'Nothing', 'Samsung', 'OnePlus', 'Apple', 'Any Brand'].map((b) => (
                  <button
                    key={b}
                    className={`${styles.optBtn} ${finderAnswers.brand === b ? styles.optSelected : ''}`}
                    onClick={() => {
                      setFinderAnswers({ ...finderAnswers, brand: b });
                      handleFinderSubmit();
                    }}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          )}

          {finderStep === 4 && finderResult && (
            <div className={styles.wizardResult}>
              <CheckCircle size={40} className={styles.resultIcon} />
              <h3>Your Ideal Match: {finderResult.name}</h3>
              <p style={{ marginTop: '8px' }}>
                Brand: <strong>{finderResult.brand?.name || finderResult.brand}</strong> | Price: <strong>₹{(finderResult.discountPrice || finderResult.price || 0).toLocaleString('en-IN')}</strong>
              </p>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '16px' }}>
                <Link href={finderResult.slug ? `/products/${finderResult.slug}` : '/products'} className="btn btnPrimary">
                  View Full Specifications
                </Link>
                <button
                  className="btn btnSecondary"
                  onClick={() => {
                    setFinderStep(1);
                    setFinderAnswers({ budget: 0, priority: '', brand: '' });
                  }}
                >
                  Retake Quiz
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 4. Interactive Exchange Value Calculator */}
      <section className={styles.calculatorSection}>
        <div className={styles.calcGrid}>
          {/* Exchange Value Widget */}
          <div className={`${styles.calcCard} glass`}>
            <h2>Trade-In Exchange Valuation</h2>
            <p>Check instant estimated trade-in value for your old smartphone</p>

            <div className={styles.calcForm}>
              <div className={styles.formGroup}>
                <label>Old Phone Brand</label>
                <select value={exchangeBrand} onChange={(e) => setExchangeBrand(e.target.value)}>
                  <option value="Apple">Apple iPhone</option>
                  <option value="Samsung">Samsung Galaxy</option>
                  <option value="OnePlus">OnePlus</option>
                  <option value="Vivo">Vivo</option>
                  <option value="Xiaomi">Xiaomi / Redmi</option>
                  <option value="Other">Other Brand</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Original Purchase Price (₹)</label>
                <input
                  type="number"
                  value={exchangeOrigVal}
                  onChange={(e) => setExchangeOrigVal(e.target.value)}
                  placeholder="50000"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Physical Condition</label>
                <select value={exchangeCond} onChange={(e) => setExchangeCond(e.target.value)}>
                  <option value="Excellent">Flawless (No scratches/dents)</option>
                  <option value="Good">Good (Minor light wear)</option>
                  <option value="Fair">Fair (Noticeable scratches)</option>
                </select>
              </div>

              <button className="btn btnPrimary" onClick={calculateExchange} style={{ width: '100%', marginTop: '10px' }}>
                Calculate Estimated Trade Value
              </button>

              {exchangeResult !== null && (
                <div className={styles.calcOutput}>
                  <span>Estimated Exchange Value:</span>
                  <strong>₹{exchangeResult.toLocaleString('en-IN')}</strong>
                </div>
              )}
            </div>
          </div>

          {/* No-Cost EMI Calculator Widget */}
          <div className={`${styles.calcCard} glass`}>
            <h2>No-Cost EMI Estimator</h2>
            <p>Calculate monthly installment budget for your next flagship device</p>

            <div className={styles.calcForm}>
              <div className={styles.formGroup}>
                <label>Device Net Price (₹)</label>
                <input
                  type="number"
                  value={emiPrincipal}
                  onChange={(e) => setEmiPrincipal(e.target.value)}
                  placeholder="24999"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Tenure (Months)</label>
                <select value={emiMonths} onChange={(e) => setEmiMonths(parseInt(e.target.value))}>
                  <option value={3}>3 Months No-Cost EMI</option>
                  <option value={6}>6 Months No-Cost EMI</option>
                  <option value={9}>9 Months Standard EMI</option>
                  <option value={12}>12 Months Standard EMI</option>
                </select>
              </div>

              <button className="btn btnPrimary" onClick={calculateEMI} style={{ width: '100%', marginTop: '10px' }}>
                Compute Monthly Installment
              </button>

              {emiResult !== null && (
                <div className={styles.calcOutput}>
                  <span>Estimated Monthly Payment:</span>
                  <strong>₹{emiResult.toLocaleString('en-IN')} / mo</strong>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 5. Store Benefits */}
      <section className={styles.benefits}>
        <div className={styles.benefitCard}>
          <Shield size={32} className={styles.benefitIcon} />
          <h3>100% Genuine Products</h3>
          <p>Direct brand warranty and certified official inventory</p>
        </div>
        <div className={styles.benefitCard}>
          <Award size={32} className={styles.benefitIcon} />
          <h3>Free Express Shipping</h3>
          <p>Same day dispatch with doorstep delivery nationwide</p>
        </div>
        <div className={styles.benefitCard}>
          <Zap size={32} className={styles.benefitIcon} />
          <h3>Easy 7-Day Replacement</h3>
          <p>Hassle-free replacement policy for defective units</p>
        </div>
      </section>
    </div>
  );
}
