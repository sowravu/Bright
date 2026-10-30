'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { 
  TrendingUp, ShoppingBag, Users, AlertTriangle, 
  Smartphone, Headphones, Building2, BarChart3, ChevronRight, Sparkles 
} from 'lucide-react';
import styles from './admin.module.css';

export default function AdminDashboardOverview() {
  const productsCatalog = useSelector((state: RootState) => state.products.items);
  const auth = useSelector((state: RootState) => state.auth);

  const [analytics, setAnalytics] = useState<any>({
    summary: { 
      totalSales: 0, 
      totalOrders: 0, 
      completedOrders: 0,
      todayOrders: 0,
      usersCount: 0, 
      productsCount: productsCatalog.length, 
      lowStockCount: productsCatalog.filter((p: any) => p.stock <= 5).length 
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

  const lowStockItems = productsCatalog.filter((p: any) => (p.stock || 0) <= 5);

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Stat KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={`${styles.kpiCard} glass`}>
          <TrendingUp className={styles.kpiIcon} />
          <div>
            <span>Total Sales Revenue</span>
            <h2>₹{(analytics.summary?.totalSales ?? 0).toLocaleString('en-IN')}</h2>
            <div className={`${styles.kpiMeta} ${analytics.summary?.totalSales > 0 ? styles.kpiTrendUp : ''}`}>
              {analytics.summary?.totalSales > 0 ? 'Verified database sales' : 'No sales recorded yet'}
            </div>
          </div>
        </div>

        <div className={`${styles.kpiCard} glass`}>
          <ShoppingBag className={styles.kpiIcon} style={{ color: '#10b981' }} />
          <div>
            <span>Total Completed Orders</span>
            <h2>{analytics.summary?.completedOrders ?? 0}</h2>
            <div className={`${styles.kpiMeta} ${styles.kpiTrendUp}`}>
              {analytics.summary?.todayOrders ? `+${analytics.summary.todayOrders} orders today` : `${analytics.summary?.totalOrders ?? 0} total orders placed`}
            </div>
          </div>
        </div>

        <div className={`${styles.kpiCard} glass`}>
          <Users className={styles.kpiIcon} style={{ color: '#a855f7' }} />
          <div>
            <span>Registered Customers</span>
            <h2>{analytics.summary?.usersCount ?? 0}</h2>
            <div className={styles.kpiMeta}>Connected to MongoDB</div>
          </div>
        </div>

        <div className={`${styles.kpiCard} ${styles.kpiAlert} glass`}>
          <AlertTriangle className={styles.kpiIcon} />
          <div>
            <span>Low Stock Items</span>
            <h2>{lowStockItems.length}</h2>
            <div className={`${styles.kpiMeta} ${styles.kpiTrendDown}`}>Requires Restocking</div>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <Link href="/admin/banner" style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'inherit' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Sparkles size={24} style={{ color: 'var(--primary)' }} />
            <div>
              <h4 style={{ margin: 0, fontSize: '15px', color: 'var(--foreground)' }}>Banner & Description</h4>
              <span style={{ fontSize: '12px', color: 'var(--foreground-secondary)' }}>Home Hero Banner</span>
            </div>
          </div>
          <ChevronRight size={18} style={{ color: 'var(--foreground-secondary)' }} />
        </Link>

        <Link href="/admin/smartphones" style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'inherit' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Smartphone size={24} style={{ color: '#06b6d4' }} />
            <div>
              <h4 style={{ margin: 0, fontSize: '15px', color: 'var(--foreground)' }}>Smartphones</h4>
              <span style={{ fontSize: '12px', color: 'var(--foreground-secondary)' }}>Handsets & variants</span>
            </div>
          </div>
          <ChevronRight size={18} style={{ color: 'var(--foreground-secondary)' }} />
        </Link>

        <Link href="/admin/accessories" style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'inherit' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Headphones size={24} style={{ color: '#10b981' }} />
            <div>
              <h4 style={{ margin: 0, fontSize: '15px', color: 'var(--foreground)' }}>Accessories</h4>
              <span style={{ fontSize: '12px', color: 'var(--foreground-secondary)' }}>Cases, chargers, audio</span>
            </div>
          </div>
          <ChevronRight size={18} style={{ color: 'var(--foreground-secondary)' }} />
        </Link>

        <Link href="/admin/brands" style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'inherit' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Building2 size={24} style={{ color: '#a855f7' }} />
            <div>
              <h4 style={{ margin: 0, fontSize: '15px', color: 'var(--foreground)' }}>Brands</h4>
              <span style={{ fontSize: '12px', color: 'var(--foreground-secondary)' }}>Brand partners</span>
            </div>
          </div>
          <ChevronRight size={18} style={{ color: 'var(--foreground-secondary)' }} />
        </Link>

        <Link href="/admin/users" style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'inherit' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Users size={24} style={{ color: '#ec4899' }} />
            <div>
              <h4 style={{ margin: 0, fontSize: '15px', color: 'var(--foreground)' }}>Users Directory</h4>
              <span style={{ fontSize: '12px', color: 'var(--foreground-secondary)' }}>Account management</span>
            </div>
          </div>
          <ChevronRight size={18} style={{ color: 'var(--foreground-secondary)' }} />
        </Link>
      </div>

      {/* Sales Overview Chart Section */}
      <div className={styles.chartCard} style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius-md)', padding: '24px', border: '1px solid var(--border-color)' }}>
        <div className={styles.chartHeader}>
          <h2>Monthly Sales Performance ({new Date().getFullYear()})</h2>
          <Link href="/admin/analytics" className="btn btnSecondary" style={{ fontSize: '12px', padding: '6px 12px', textDecoration: 'none' }}>
            <BarChart3 size={14} /> View Analytics
          </Link>
        </div>
        <div className={styles.chartBarsContainer}>
          {displayMonthlyData.map((d: any) => {
            const hasSales = (d.total || 0) > 0;
            const barHeightPct = hasSales ? Math.min(Math.max((d.total / maxSales) * 100, 8), 100) : 4;
            const smartPhonePct = hasSales ? ((d.smartphones || 0) / d.total) * 100 : 0;
            const accessoryPct = hasSales ? ((d.accessories || 0) / d.total) * 100 : 0;
            return (
              <div key={d.month} className={styles.chartBarColumn}>
                <div 
                  className={styles.barWrapper} 
                  style={{ height: `${barHeightPct}%` }}
                  title={`${d.month}: ₹${(d.total || 0).toLocaleString('en-IN')}`}
                >
                  {hasSales ? (
                    <>
                      <div className={styles.barSmartphone} style={{ height: `${smartPhonePct}%` }} />
                      <div className={styles.barAccessory} style={{ height: `${accessoryPct}%` }} />
                    </>
                  ) : (
                    <div style={{ height: '100%', width: '100%', background: 'var(--border-color)', opacity: 0.25, borderRadius: '4px' }} />
                  )}
                </div>
                <span className={styles.chartLabel}>{d.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Low Stock Items Section */}
      <div className={styles.tableCard} style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius-md)', padding: '24px', border: '1px solid var(--border-color)' }}>
        <div className={styles.tableHeaderBar}>
          <h2>Low Stock Alert Items</h2>
        </div>
        {lowStockItems.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--foreground-secondary)', padding: '16px 0', margin: 0 }}>
            All product inventory levels are healthy! No items currently low in stock.
          </p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th className={styles.adminTh}>PRODUCT MODEL</th>
                  <th className={styles.adminTh}>BRAND</th>
                  <th className={styles.adminTh}>CATEGORY</th>
                  <th className={styles.adminTh}>STOCK COUNT</th>
                  <th className={styles.adminTh}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map((prod: any) => (
                  <tr key={prod.id || prod._id}>
                    <td className={styles.adminTd} style={{ fontWeight: 600 }}>{prod.name}</td>
                    <td className={styles.adminTd}>{typeof prod.brand === 'object' ? prod.brand.name : prod.brand}</td>
                    <td className={styles.adminTd} style={{ textTransform: 'capitalize' }}>{prod.category}</td>
                    <td className={styles.adminTd} style={{ fontWeight: 700, color: '#ef4444' }}>{prod.stock} units</td>
                    <td className={styles.adminTd}>
                      <span className={styles.categoryBadge} style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>Restock Needed</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
