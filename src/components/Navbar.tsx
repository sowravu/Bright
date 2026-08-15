'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '../context/ThemeContext';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { logout, updateUser } from '../store/authSlice';
import { Search, ShoppingCart, User, Moon, Sun, Sparkles, ShieldCheck } from 'lucide-react';
import styles from './Navbar.module.css';
import { useToast } from '../context/ToastContext';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const auth = useSelector((state: RootState) => state.auth);
  const cart = useSelector((state: RootState) => state.cart);
  const productsCatalog = useSelector((state: RootState) => state.products.items);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [brandsDropdownOpen, setBrandsDropdownOpen] = useState(false);
  const [dynamicBrands, setDynamicBrands] = useState<string[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const brandsDropdownRef = useRef<HTMLDivElement>(null);

  // Dynamic Brands fetching - strictly currently available brands from API and products catalog
  useEffect(() => {
    const fetchBrandsList = async () => {
      let fetchedNames: string[] = [];
      try {
        const res = await fetch('http://localhost:5000/api/brands');
        if (res.ok) {
          const data = await res.json();
          const list = data.brands || (Array.isArray(data) ? data : []);
          fetchedNames = list.map((b: any) => b.name).filter(Boolean);
        }
      } catch (_) {}

      const catalogBrands = (productsCatalog || [])
        .map((p: any) => (typeof p.brand === 'object' ? p.brand?.name : p.brand))
        .filter(Boolean);

      // Only combine brands that exist in DB or active product catalog
      const combined = Array.from(
        new Set([...fetchedNames, ...catalogBrands])
      ).sort((a, b) => a.localeCompare(b));

      setDynamicBrands(combined);
    };

    fetchBrandsList();
  }, [productsCatalog]);

  // Instant session block verification on mount / page refresh
  useEffect(() => {
    const token = auth.token || (typeof window !== 'undefined' ? localStorage.getItem('bright_token') : null);
    if (!token) return;

    const verifySessionStatus = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/auth/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 403 || res.status === 401) {
          const data = await res.json().catch(() => ({}));
          dispatch(logout());
          showToast(data.message || 'Your account has been blocked by an administrator.', 'error');
          if (pathname !== '/login') {
            router.push('/login');
          }
        } else if (res.ok) {
          const profile = await res.json();
          if (profile.status === 'BLOCKED') {
            dispatch(logout());
            showToast('Your account has been blocked by an administrator.', 'error');
            if (pathname !== '/login') {
              router.push('/login');
            }
          } else {
            dispatch(updateUser(profile));
          }
        }
      } catch (_) { }
    };

    verifySessionStatus();
  }, [auth.token, pathname, dispatch, router, showToast]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (brandsDropdownRef.current && !brandsDropdownRef.current.contains(event.target as Node)) {
        setBrandsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions based on query
  useEffect(() => {
    if (searchQuery.trim().length > 2) {
      const fetchSuggestions = async () => {
        try {
          const res = await fetch(`http://localhost:5000/api/products/ai-search?query=${encodeURIComponent(searchQuery)}`);
          if (res.ok) {
            const data = await res.json();
            setSearchSuggestions(data.results.slice(0, 5));
            setShowDropdown(true);
            return;
          }
        } catch (_) { }

        const matches = productsCatalog.filter(
          (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.brand?.name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setSearchSuggestions(matches.slice(0, 5));
        setShowDropdown(true);
      };
      fetchSuggestions();
    } else {
      setSearchSuggestions([]);
      setShowDropdown(false);
    }
  }, [searchQuery, productsCatalog]);

  // Suppress storefront navbar on admin workspace routes
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowDropdown(false);
      window.location.href = `/products?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    showToast('Successfully logged out.', 'info');
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Brand Logo */}
        <Link href="/" className={styles.logo}>
          <Sparkles className={styles.sparkleIcon} size={24} />
          <span>Bright</span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className={styles.nav}>
          <Link href="/" className={`${styles.navLink} ${pathname === '/' ? styles.active : ''}`}>
            Home
          </Link>
          <Link href="/products" className={`${styles.navLink} ${pathname === '/products' ? styles.active : ''}`}>
            Smartphones
          </Link>

          {/* Brands Dropdown */}
          <div className={styles.dropdownContainer} ref={brandsDropdownRef}>
            <button
              onClick={() => setBrandsDropdownOpen(!brandsDropdownOpen)}
              className={styles.navButton}
            >
              Brands <span className={styles.arrow}>{brandsDropdownOpen ? '▲' : '▼'}</span>
            </button>
            {brandsDropdownOpen && (
              <div className={styles.navDropdownMenu}>
                <Link
                  href="/products"
                  onClick={() => setBrandsDropdownOpen(false)}
                  style={{ fontWeight: 700, color: 'var(--primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', marginBottom: '4px' }}
                >
                  All Brands
                </Link>
                {dynamicBrands.length > 0 ? (
                  dynamicBrands.map((bName) => (
                    <Link
                      key={bName}
                      href={`/products?brand=${encodeURIComponent(bName)}`}
                      onClick={() => setBrandsDropdownOpen(false)}
                    >
                      {bName}
                    </Link>
                  ))
                ) : (
                  <span style={{ fontSize: '12px', color: 'var(--foreground-secondary)', padding: '6px 12px' }}>
                    No active brands available
                  </span>
                )}
              </div>
            )}
          </div>

          <Link href="/accessories" className={`${styles.navLink} ${pathname === '/accessories' ? styles.active : ''}`}>
            Accessories
          </Link>
        </nav>

        {/* Header Actions */}
        <div className={styles.actions}>
          {/* AI Search Input Container */}
          <div className={styles.searchWrapper} ref={dropdownRef}>
            <form onSubmit={handleSearchSubmit} className={styles.searchBar}>
              <input
                type="text"
                placeholder="AI Smart Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className={styles.searchBtn} aria-label="Search">
                <Search size={16} />
              </button>
            </form>

            {/* AI Search Live Dropdown Results */}
            {showDropdown && searchSuggestions.length > 0 && (
              <div className={styles.dropdown}>
                <div className={styles.dropdownTitle}>Suggestions</div>
                {searchSuggestions.map((item) => (
                  <Link
                    key={item.id || item._id}
                    href={`/products/${item.slug || item.id || item._id}`}
                    className={styles.dropdownItem}
                    onClick={() => {
                      setShowDropdown(false);
                      setSearchQuery('');
                    }}
                  >
                    {item.images?.[0] && (
                      <img src={item.images[0]} alt={item.name} />
                    )}
                    <div className={styles.itemMeta}>
                      <span className={styles.itemName}>{item.name}</span>
                      <span className={styles.itemPrice}>
                        ₹{(item.discountPrice || item.basePrice || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Cart Link */}
          {(() => {
            const totalCartItems = cart.items?.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0) || 0;
            return (
              <Link href="/cart" className={styles.iconBtn} title="Shopping Cart">
                <ShoppingCart size={20} />
                {totalCartItems > 0 && (
                  <span className={styles.badge}>{totalCartItems}</span>
                )}
              </Link>
            );
          })()}

          {/* Theme Toggle */}
          <button onClick={toggleTheme} className={styles.iconBtn} title="Toggle Theme">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Auth State Button */}
          {auth.isAuthenticated ? (
            <div className={styles.userMenu}>
              {auth.user?.role === 'ADMIN' && (
                <Link href="/admin" className={styles.adminWorkspaceBtn} title="Admin Workspace Portal">
                  <ShieldCheck size={15} />
                  <span>Admin Workspace</span>
                </Link>
              )}
              <Link href="/user" className={styles.userProfileLink} title="Account Profile">
                <User size={18} />
                <span>{auth.user?.name || 'Account'}</span>
              </Link>
              <button onClick={handleLogout} className={styles.logoutBtn}>
                Logout
              </button>
            </div>
          ) : (
            <Link href="/login" className={styles.loginBtn}>
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
