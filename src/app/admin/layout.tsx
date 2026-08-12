'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { logout } from '../../store/authSlice';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import Link from 'next/link';
import {
  LayoutDashboard, Smartphone, Headphones, Layers, Building2, Users,
  ShoppingBag, RotateCcw, BarChart3, Activity, Sun, Moon, LogOut, Menu, ShieldCheck, Home, Sparkles
} from 'lucide-react';
import styles from './admin.module.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const auth = useSelector((state: RootState) => state.auth);
  const { showToast } = useToast();
  const { theme, toggleTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!auth.hydrated || isLoggingOut) return;

    if (!auth.isAuthenticated || auth.user?.role !== 'ADMIN') {
      showToast('Access denied. Admin permissions required.', 'error');
      router.push('/login');
    }
  }, [auth, isLoggingOut, router, showToast]);

  const handleAdminLogout = () => {
    setIsLoggingOut(true);
    dispatch(logout());
    showToast('Logged out of Admin Workspace.', 'info');
    router.push('/login');
  };

  const navItems = [
    { label: 'Dashboard Overview', path: '/admin', icon: LayoutDashboard },
    { label: 'Banner & Description', path: '/admin/banner', icon: Sparkles },
    { label: 'Smartphones Inventory', path: '/admin/smartphones', icon: Smartphone },
    { label: 'Accessories Inventory', path: '/admin/accessories', icon: Headphones },
    { label: 'Accessory Types', path: '/admin/accessory-types', icon: Layers },
    { label: 'Brands Directory', path: '/admin/brands', icon: Building2 },
    { label: 'User Directory', path: '/admin/users', icon: Users },
    { label: 'Orders Management', path: '/admin/orders', icon: ShoppingBag },
    { label: 'Returns & Refunds', path: '/admin/returns', icon: RotateCcw },
    { label: 'Advanced Analytics', path: '/admin/analytics', icon: BarChart3 },
    { label: 'Activity Audit Logs', path: '/admin/audit', icon: Activity },
  ];

  if (!mounted || !auth.hydrated || !auth.isAuthenticated || auth.user?.role !== 'ADMIN') {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
        <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--foreground-secondary)' }}>
          Verifying Admin Access...
        </p>
      </div>
    );
  }

  return (
    <div className={styles.adminLayout}>
      {/* Main Admin Sidebar */}
      <aside className={styles.sidebar} style={{ transform: isMobileSidebarOpen ? 'translateX(0)' : undefined }}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarHeaderTop}>
            <div className={styles.sidebarBrand}>
              <ShieldCheck size={24} style={{ color: 'var(--primary)' }} />
              <span>Bright Admin</span>
            </div>
            <span className={styles.sidebarBadge}>V2.0</span>
          </div>
        </div>

        <nav className={styles.sidebarNav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path || (item.path !== '/admin' && pathname.startsWith(item.path));

            return (
              <Link
                key={item.path}
                href={item.path}
                className={`${styles.sidebarNavItem} ${isActive ? styles.sidebarNavItemActive : ''}`}
                onClick={() => setIsMobileSidebarOpen(false)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.adminProfile}>
            <div className={styles.adminAvatar}>
              {auth.user?.name ? auth.user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className={styles.adminInfo}>
              <h4>{auth.user?.name || 'Admin'}</h4>
              <span>{auth.user?.email || 'admin@bright.com'}</span>
            </div>
          </div>
          <button 
            onClick={handleAdminLogout} 
            className="btn btnSecondary"
            style={{ width: '100%', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            title="Logout of Admin Panel"
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={styles.mainContent}>
        {/* Top Control Bar */}
        <div className={styles.topControlBar}>
          <div className={styles.topLeftActions}>
            <button 
              className="btn btnSecondary"
              style={{ padding: '6px 10px', display: 'none' }}
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            >
              <Menu size={18} />
            </button>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800 }}>
              {navItems.find(n => n.path === pathname || (n.path !== '/admin' && pathname.startsWith(n.path)))?.label || 'Admin Workspace'}
            </h1>
          </div>

          <div className={styles.topRightProfile}>
            <button 
              onClick={toggleTheme} 
              className="btn btnSecondary"
              style={{ padding: '6px 12px', fontSize: '12px' }}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <Link href="/" className="btn btnPrimary" style={{ fontSize: '12px', padding: '6px 12px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Home size={14} />
              <span>View Store</span>
            </Link>
          </div>
        </div>

        {/* Dynamic Subpage Body */}
        {children}
      </div>
    </div>
  );
}
