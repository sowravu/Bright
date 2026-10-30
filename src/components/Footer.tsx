'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Send, ShieldCheck, Truck, Lock, MessageSquare } from 'lucide-react';
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
            <h4>100% Tested & Verified</h4>
            <p>Multi-point hardware & quality checked</p>
          </div>
        </div>
        <div className={styles.benefitItem}>
          <Truck size={32} className={styles.benefitIcon} />
          <div>
            <h4>Express Pan-India Delivery</h4>
            <p>Carefully packed & insured shipping</p>
          </div>
        </div>
        <div className={styles.benefitItem}>
          <Lock size={32} className={styles.benefitIcon} />
          <div>
            <h4>100% Secure Payments</h4>
            <p>Safe checkout via UPI & Razorpay</p>
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
            Bright is your premier destination for certified refurbished smartphones and mobile accessories. Every device is thoroughly inspected, tested, and delivered across India.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
            <a 
              href="https://wa.me/917907924190?text=Hi%20Bright%2C%20I%20have%20an%20inquiry%20about%20a%20smartphone"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#25D366',
                color: '#FFFFFF',
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                fontSize: '12px',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(37, 211, 102, 0.25)'
              }}
            >
              <MessageSquare size={14} /> WhatsApp Support
            </a>
          </div>
        </div>

        {/* Links Column 1 */}
        <div className={styles.linksCol}>
          <h3>Top Brands</h3>
          <ul>
            <li><Link href="/products?brand=Apple">Apple iPhone</Link></li>
            <li><Link href="/products?brand=Samsung">Samsung Galaxy</Link></li>
            <li><Link href="/products?brand=OnePlus">OnePlus</Link></li>
            <li><Link href="/products?brand=Xiaomi">Xiaomi / Redmi</Link></li>
            <li><Link href="/products?brand=Vivo">Vivo</Link></li>
            <li><Link href="/products">All Smartphones →</Link></li>
          </ul>
        </div>

        {/* Links Column 2 */}
        <div className={styles.linksCol}>
          <h3>Catalog & Quick Links</h3>
          <ul>
            <li><Link href="/products">Refurbished Phones</Link></li>
            <li><Link href="/accessories">Mobile Accessories</Link></li>
            <li><Link href="/compare">Compare Devices</Link></li>
            <li><Link href="/cart">Shopping Cart</Link></li>
            <li><Link href="/user">My Account & Orders</Link></li>
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
            <span>Razorpay Secured</span>
            <span>UPI & NetBanking</span>
            <span>Quality Tested</span>
            <span>Express Delivery</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
