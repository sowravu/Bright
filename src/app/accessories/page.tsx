'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { addToCart } from '../../store/cartSlice';
import { Filter, ShoppingBag } from 'lucide-react';
import styles from '../products/products.module.css';
import { useToast } from '../../context/ToastContext';

function AccessoriesCatalog() {
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const { showToast } = useToast();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [selectedBrand, setSelectedBrand] = useState('');
  const [priceMax, setPriceMax] = useState(40000);
  const [sortBy, setSortBy] = useState('popularity');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Dynamic Metadata States
  const [brandsList, setBrandsList] = useState<string[]>([]);
  const [accessoryTypesList, setAccessoryTypesList] = useState<any[]>([]);

  // Load products catalog from persistent Redux state
  const productsCatalog = useSelector((state: RootState) => state.products.items);

  // Synchronize URL search params
  useEffect(() => {
    const searchParam = searchParams.get('search');
    setSearchQuery(searchParam || '');
    const brandParam = searchParams.get('brand');
    if (brandParam) setSelectedBrand(brandParam);
  }, [searchParams]);

  // Fetch dynamic Brands and Accessory Types from MongoDB API
  useEffect(() => {
    const fetchMetaData = async () => {
      try {
        const [brandsRes, typesRes] = await Promise.all([
          fetch('http://localhost:5000/api/brands').catch(() => null),
          fetch('http://localhost:5000/api/accessory-types').catch(() => null),
        ]);

        if (brandsRes && brandsRes.ok) {
          const data = await brandsRes.json();
          const list = data.brands || (Array.isArray(data) ? data : []);
          const names = list.map((b: any) => b.name).filter(Boolean);
          if (names.length > 0) setBrandsList(names);
        }

        if (typesRes && typesRes.ok) {
          const data = await typesRes.json();
          const types = data.accessoryTypes || (Array.isArray(data) ? data : []);
          setAccessoryTypesList(types);
        }
      } catch (_) {}
    };
    fetchMetaData();
  }, []);

  // Fetch & filter accessories
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        let rawList: any[] = [];
        const queryParams = new URLSearchParams();
        if (selectedBrand) queryParams.append('brand', selectedBrand);
        if (selectedCategory) queryParams.append('accessoryType', selectedCategory);

        try {
          const res = await fetch(`http://localhost:5000/api/accessories?${queryParams.toString()}`);
          if (res.ok) {
            const data = await res.json();
            rawList = data.accessories || (Array.isArray(data) ? data : []);
          }
        } catch (_) {}

        // Fall back to Redux catalog if backend returned empty list
        let filtered = rawList.length > 0
          ? rawList
          : productsCatalog.filter((p: any) => p.category?.toLowerCase() === 'accessories');

        // Search text matching
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          filtered = filtered.filter(
            (p: any) =>
              p.name?.toLowerCase().includes(q) ||
              (p.brand?.name ? p.brand.name.toLowerCase().includes(q) : String(p.brand || '').toLowerCase().includes(q))
          );
        }

        // Brand matching
        if (selectedBrand) {
          filtered = filtered.filter((p: any) => {
            const bName = typeof p.brand === 'object' ? (p.brand?.name || '') : (p.brand || '');
            return bName.toLowerCase() === selectedBrand.toLowerCase();
          });
        }

        // Price limit matching
        filtered = filtered.filter(
          (p: any) => (p.discountPrice || p.basePrice || p.price || 0) <= priceMax
        );

        // Accessory Type / Category dropdown matching
        if (selectedCategory) {
          filtered = filtered.filter((p: any) => {
            const typeName = typeof p.accessoryType === 'object' ? (p.accessoryType?.name || '') : (p.accessoryType || '');
            const typeSlug = typeof p.accessoryType === 'object' ? (p.accessoryType?.slug || '') : '';
            return typeName.toLowerCase() === selectedCategory.toLowerCase() || typeSlug.toLowerCase() === selectedCategory.toLowerCase();
          });
        }

        // Sorting
        if (sortBy === 'price_asc') {
          filtered.sort((a: any, b: any) => (a.discountPrice || a.basePrice || a.price || 0) - (b.discountPrice || b.basePrice || b.price || 0));
        } else if (sortBy === 'price_desc') {
          filtered.sort((a: any, b: any) => (b.discountPrice || b.basePrice || b.price || 0) - (a.discountPrice || a.basePrice || a.price || 0));
        } else if (sortBy === 'rating') {
          filtered.sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));
        }

        setProducts(filtered);
      } catch (err) {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, [selectedBrand, priceMax, sortBy, searchQuery, selectedCategory, productsCatalog]);

  // Add to cart helper
  const handleAddToCart = (prod: any) => {
    const itemPrice = prod.discountPrice || prod.basePrice || prod.price || 0;
    let variantId = '';
    if (prod.variants && prod.variants.length > 0) {
      variantId = prod.variants[0]._id || prod.variants[0].id || '';
    }
    dispatch(
      addToCart({
        productId: prod.id || prod._id,
        variantId,
        name: prod.name,
        image: prod.images?.[0] || '',
        brand: prod.brand?.name || (typeof prod.brand === 'string' ? prod.brand : 'Smart'),
        ram: 'N/A',
        storage: 'N/A',
        color: prod.colors?.[0] || prod.variants?.[0]?.color || 'Default',
        price: itemPrice,
        quantity: 1
      })
    );
    showToast(`${prod.name} added to cart!`, 'success');
  };

  return (
    <div className={`${styles.productsPage} container`}>
      <div className={styles.layoutGrid}>
        {/* 1. Sidebar Filters */}
        <aside className={`${styles.sidebar} glass`}>
          <div className={styles.filterTitle}>
            <Filter size={18} />
            <h2>Accessories Filters</h2>
          </div>

          {/* Text Search Filter */}
          <div className={styles.filterGroup} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
            <h3>Text Search</h3>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search accessories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--foreground)',
                  fontSize: '14px'
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--foreground-secondary)',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 700
                  }}
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Dynamic Accessory Category Dropdown */}
          <div className={styles.filterGroup}>
            <h3>Select Category</h3>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={styles.selectFilter}
            >
              <option value="">All Categories</option>
              {accessoryTypesList.map((t: any) => (
                <option key={t._id || t.name} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic Brand Filter checkboxes */}
          <div className={styles.filterGroup}>
            <h3>Brand</h3>
            <div className={styles.options}>
              {(brandsList.length > 0 ? brandsList : ['Vivo', 'Lava', 'Samsung', 'Apple', 'OnePlus', 'Nothing', 'Xiaomi']).map((b: string) => (
                <label key={b} className={styles.checkLabel}>
                  <input
                    type="radio"
                    name="brand"
                    checked={selectedBrand?.toLowerCase() === b.toLowerCase()}
                    onChange={() => setSelectedBrand(b)}
                  />
                  <span>{b}</span>
                </label>
              ))}
              <button className={styles.clearBtn} onClick={() => setSelectedBrand('')}>Clear Brand</button>
            </div>
          </div>

          {/* Price Range Slider */}
          <div className={styles.filterGroup}>
            <h3>Max Price: ₹{priceMax.toLocaleString('en-IN')}</h3>
            <input
              type="range"
              min={500}
              max={40000}
              step={500}
              value={priceMax}
              onChange={(e) => setPriceMax(parseInt(e.target.value))}
              className={styles.rangeInput}
            />
          </div>
        </aside>

        {/* 2. Main Content Grid */}
        <main className={styles.mainContent}>
          {/* Toolbar */}
          <div className={`${styles.toolbar} glass`}>
            <div className={styles.toolbarInfo}>
              <span>Sort By:</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="popularity">Best Popularity</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>

          {/* Products grid */}
          {loading ? (
            <div className={styles.loader}>Searching accessories catalog...</div>
          ) : products.length === 0 ? (
            <div className={styles.loader}>No accessories matching your criteria.</div>
          ) : (
            <div className={styles.productsGrid}>
              {products.map((prod) => {
                const itemSlug = prod.slug || prod.id || prod._id;
                const overallStock = prod.stock || 0;
                const mainPrice = prod.discountPrice || prod.basePrice || prod.price || 0;
                const oldPrice = prod.basePrice || prod.price || 0;

                return (
                  <div key={prod.id || prod._id} className={`${styles.productCard} glassCard`}>
                    <Link href={`/products/${itemSlug}`}>
                      <img src={prod.images?.[0] || 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=600'} alt={prod.name} className={styles.productImg} />
                    </Link>
                    <div className={styles.brandBadge}>{prod.brand?.name || (typeof prod.brand === 'string' ? prod.brand : 'Brand')}</div>
                    <Link href={`/products/${itemSlug}`}>
                      <h3 className={styles.name}>{prod.name}</h3>
                    </Link>
                    <p className={styles.briefSpecs}>
                      {prod.accessoryType?.name || prod.specs?.compatibility || 'Official Mobile Accessory'}
                    </p>
                    <div style={{ marginTop: '8px', marginBottom: '12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: overallStock > 0 ? (overallStock <= 5 ? 'var(--warning)' : 'var(--success)') : 'var(--error)',
                        display: 'inline-block'
                      }} />
                      <span style={{ color: overallStock > 0 ? (overallStock <= 5 ? 'var(--warning)' : 'var(--success)') : 'var(--error)', fontWeight: 600 }}>
                        {overallStock > 0 ? (overallStock <= 5 ? 'Few Stock Only' : 'In Stock') : 'Out of Stock'}
                      </span>
                    </div>
                    <div className={styles.cardFooter}>
                      <div className={styles.priceCol}>
                        <span className={styles.price}>
                          ₹{Number(mainPrice).toLocaleString('en-IN')}
                        </span>
                        {prod.discountPrice && oldPrice > mainPrice && (
                          <span className={styles.oldPrice}>
                            ₹{Number(oldPrice).toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleAddToCart(prod)}
                        className={styles.cartIconBtn}
                        style={{
                          opacity: overallStock > 0 ? 1 : 0.5,
                          cursor: overallStock > 0 ? 'pointer' : 'not-allowed'
                        }}
                        title={overallStock > 0 ? "Add to Cart" : "Out of Stock"}
                        disabled={overallStock === 0}
                      >
                        <ShoppingBag size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function AccessoriesPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Loading accessories catalog...</div>}>
      <AccessoriesCatalog />
    </Suspense>
  );
}
