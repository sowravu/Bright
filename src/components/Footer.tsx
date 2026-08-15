'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Send, Smartphone, ShieldCheck, RefreshCw, Landmark } from 'lucide-react';
import styles from './Footer.module.css';

export default function Footer() {
  const pathname = usePathname();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  // Suppress site footer on admin routes
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className={styles.footer}>
      {/* Benefits Banner */}
      <div className={styles.benefitsGrid}>
        <div className={styles.benefitItem}>
          <ShieldCheck size={32} className={styles.benefitIcon} />
          <div>
            <h4>100% Genuine Guarantee</h4>
            <p>Direct brand warranty on Vivo & Lava</p>
          </div>
        </div>
        <div className={styles.benefitItem}>
          <RefreshCw size={32} className={styles.benefitIcon} />
          <div>
            <h4>7-Day Easy Returns</h4>
            <p>Hassle-free replacement policy</p>
          </div>
        </div>
        <div className={styles.benefitItem}>
          <Landmark size={32} className={styles.benefitIcon} />
          <div>
            <h4>Flexible Finance Options</h4>
            <p>No-cost EMIs up to 12 months</p>
          </div>
        </div>
      </div>

      <div className={`${styles.mainFooter} container`}>
        {/* Brand info */}
        <div className={styles.brandCol}>
          <Link href="/" className={styles.logo}>
            Bright
          </Link>
          <p className={styles.tagline}>"Bright Choices. Smarter Phones."</p>
          <p className={styles.desc}>
            Bright is India's premium e-commerce experience offering direct authorization smartphones from Vivo and Lava. Designed to feel luxurious, buy smart.
          </p>
          <div className={styles.appBadges}>
            <div className={styles.appBadge}>Google Play</div>
            <div className={styles.appBadge}>App Store</div>
          </div>
        </div>

        {/* Links Column 1 */}
        <div className={styles.linksCol}>
          <h3>Primary Brands</h3>
          <ul>
            <li><Link href="/products?brand=Vivo">Vivo Flagships</Link></li>
            <li><Link href="/products?brand=Vivo">Vivo V-Series</Link></li>
            <li><Link href="/products?brand=Lava">Lava Agni Series</Link></li>
            <li><Link href="/products?brand=Lava">Lava Yuva Series</Link></li>
            <li><Link href="/products?brand=Lava">Lava Blaze Series</Link></li>
          </ul>
        </div>

        {/* Links Column 2 */}
        <div className={styles.linksCol}>
          <h3>Offers & Catalog</h3>
          <ul>
            <li><Link href="/products">All Smartphones</Link></li>
            <li><Link href="/offers">Student Discounts</Link></li>
            <li><Link href="/offers">EMI Calculator</Link></li>
            <li><Link href="/offers">Exchange Offers</Link></li>
            <li><Link href="/products">New Arrivals</Link></li>
          </ul>
        </div>

        {/* Subscription Column */}
        <div className={styles.subCol}>
          <h3>Newsletter</h3>
          <p>Subscribe to receive price drops, flash deals, and coupon updates instantly.</p>
          <form onSubmit={handleSubscribe} className={styles.subForm}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" className={styles.subBtn}>
              <Send size={16} />
            </button>
          </form>
          {subscribed && <span className={styles.successMsg}>Subscribed successfully!</span>}
        </div>
      </div>

      <div className={styles.bottomFooter}>
        <div className={`${styles.bottomContainer} container`}>
          <p>© {new Date().getFullYear()} Bright E-Commerce. All rights reserved.</p>
          <div className={styles.paymentsStrip}>
            <span>Stripe Secured</span>
            <span>Razorpay Enabled</span>
            <span>UPI Auto</span>
            <span>Private Courier Delivery</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
