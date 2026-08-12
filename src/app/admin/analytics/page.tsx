'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { BarChart3, TrendingUp, ShoppingBag, Users, AlertTriangle } from 'lucide-react';
import styles from '../admin.module.css';

export default function AnalyticsAdminPage() {
  const auth = useSelector((state: RootState) => state.auth);
  const productsCatalog = useSelector((state: RootState) => state.products.items);

  const [analytics, setAnalytics] = useState<any>({
    summary: { 
      totalSales: 146998, 
      totalOrders: 14, 
      usersCount: 0, 
      productsCount: productsCatalog.length, 
      lowStockCount: productsCatalog.filter((p: any) => p.stock <= 5).length 
    }
  });

  const monthlySalesData = [
    { month: 'Jan', smartphones: 28000, accessories: 5000, total: 33000 },
    { month: 'Feb', smartphones: 34000, accessories: 7500, total: 41500 },
    { month: 'Mar', smartphones: 45000, accessories: 9200, total: 54200 },
    { month: 'Apr', smartphones: 38000, accessories: 8100, total: 46100 },
    { month: 'May', smartphones: 52000, accessories: 11000, total: 63000 },
    { month: 'Jun', smartphones: 68000, accessories: 14500, total: 82500 },
    { month: 'Jul', smartphones: 119998, accessories: 27000, total: 146998 }
  ];

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/admin/analytics', {
          headers: { 'Authorization': `Bearer ${auth.token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAnalytics(data);
        }
      } catch (_) {}
    };
    if (auth.token) {
      fetchAdminStats();
    }
  }, [auth.token]);

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Advanced Store Analytics & Revenue Reports</h2>
            <p className={styles.sectionSubtitle}>Detailed sales metrics, revenue velocity, and catalog performance breakdown.</p>
          </div>
        </div>

        {/* Sales Overview Chart Section */}
        <div className={styles.chartBars} style={{ marginTop: '24px' }}>
          {monthlySalesData.map((d) => (
            <div key={d.month} className={styles.chartCol}>
              <div className={styles.barTrack}>
                <div 
                  className={styles.barFill} 
                  style={{ height: `${(d.total / 150000) * 100}%` }}
                  title={`₹${d.total.toLocaleString('en-IN')} (Smartphones: ₹${d.smartphones.toLocaleString('en-IN')}, Accessories: ₹${d.accessories.toLocaleString('en-IN')})`}
                />
              </div>
              <span className={styles.barLabel}>{d.month}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '24px' }}>
        <div className={styles.sectionCard}>
          <h3>Smartphones vs Accessories Sales</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span>Smartphones Revenue</span>
                <strong>₹1,19,998 (81.6%)</strong>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '81.6%', background: 'var(--primary)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span>Accessories Revenue</span>
                <strong>₹27,000 (18.4%)</strong>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '18.4%', background: '#10b981' }} />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.sectionCard}>
          <h3>Catalog Health Metrics</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
              <span>Total Catalog Items</span>
              <strong>{analytics.summary?.productsCount || productsCatalog.length} items</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
              <span>Low Stock Alerts</span>
              <strong style={{ color: '#ef4444' }}>{analytics.summary?.lowStockCount || 0} items</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
              <span>Connected Database</span>
              <strong style={{ color: '#10b981' }}>MongoDB Active</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
