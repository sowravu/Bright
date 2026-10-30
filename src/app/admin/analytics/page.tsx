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
      totalSales: 0, 
      totalOrders: 0, 
      completedOrders: 0,
      todayOrders: 0,
      usersCount: 0, 
      productsCount: productsCatalog.length, 
      lowStockCount: productsCatalog.filter((p: any) => p.stock <= 5).length,
      smartphonesRevenue: 0,
      accessoriesRevenue: 0
    },
    monthlySalesData: []
  });

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const res = await fetch('/api/admin/analytics');
        if (res.ok) {
          const data = await res.json();
          setAnalytics(data);
        }
      } catch (_) {}
    };
    if (auth.isAuthenticated) {
      fetchAdminStats();
    }
  }, [auth.isAuthenticated]);

  const displayMonthlyData = analytics.monthlySalesData && analytics.monthlySalesData.length > 0
    ? analytics.monthlySalesData
    : [
        { month: 'Jan', smartphones: 0, accessories: 0, total: 0 },
        { month: 'Feb', smartphones: 0, accessories: 0, total: 0 },
        { month: 'Mar', smartphones: 0, accessories: 0, total: 0 },
        { month: 'Apr', smartphones: 0, accessories: 0, total: 0 },
        { month: 'May', smartphones: 0, accessories: 0, total: 0 },
        { month: 'Jun', smartphones: 0, accessories: 0, total: 0 },
        { month: 'Jul', smartphones: 0, accessories: 0, total: 0 },
        { month: 'Aug', smartphones: 0, accessories: 0, total: 0 },
        { month: 'Sep', smartphones: 0, accessories: 0, total: 0 },
        { month: 'Oct', smartphones: 0, accessories: 0, total: 0 },
        { month: 'Nov', smartphones: 0, accessories: 0, total: 0 },
        { month: 'Dec', smartphones: 0, accessories: 0, total: 0 }
      ];

  const maxSales = Math.max(...displayMonthlyData.map((d: any) => d.total || 0), 10000);
  const totalRev = (analytics.summary?.totalSales || 0);
  const spRev = (analytics.summary?.smartphonesRevenue || 0);
  const accRev = (analytics.summary?.accessoriesRevenue || 0);
  const spPct = totalRev > 0 ? ((spRev / totalRev) * 100).toFixed(1) : '0';
  const accPct = totalRev > 0 ? ((accRev / totalRev) * 100).toFixed(1) : '0';

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Advanced Store Analytics & Revenue Reports ({new Date().getFullYear()})</h2>
            <p className={styles.sectionSubtitle}>Detailed live sales metrics, revenue velocity, and catalog performance breakdown from MongoDB.</p>
          </div>
        </div>

        {/* Sales Overview Chart Section */}
        <div className={styles.chartBars} style={{ marginTop: '24px' }}>
          {displayMonthlyData.map((d: any) => {
            const hasSales = (d.total || 0) > 0;
            const barHeightPct = hasSales ? Math.min(Math.max((d.total / maxSales) * 100, 8), 100) : 4;
            return (
              <div key={d.month} className={styles.chartCol}>
                <div className={styles.barTrack}>
                  <div 
                    className={styles.barFill} 
                    style={{ height: `${barHeightPct}%`, opacity: hasSales ? 1 : 0.2 }}
                    title={`₹${(d.total || 0).toLocaleString('en-IN')} (Smartphones: ₹${(d.smartphones || 0).toLocaleString('en-IN')}, Accessories: ₹${(d.accessories || 0).toLocaleString('en-IN')})`}
                  />
                </div>
                <span className={styles.barLabel}>{d.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '24px' }}>
        <div className={styles.sectionCard}>
          <h3>Smartphones vs Accessories Sales</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span>Smartphones Revenue</span>
                <strong>₹{spRev.toLocaleString('en-IN')} ({spPct}%)</strong>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${spPct}%`, background: 'var(--primary)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span>Accessories Revenue</span>
                <strong>₹{accRev.toLocaleString('en-IN')} ({accPct}%)</strong>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${accPct}%`, background: '#10b981' }} />
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
