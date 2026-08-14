'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { addToCompare, removeFromCompare } from '../../store/compareSlice';
import { addToCart } from '../../store/cartSlice';
import { Filter, ArrowUpDown, PlusCircle, CheckCircle, ShoppingBag } from 'lucide-react';
import styles from './products.module.css';
import { useToast } from '../../context/ToastContext';

function ProductsCatalog() {
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const compareItems = useSelector((state: RootState) => state.compare.items);
  const { showToast } = useToast();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brand') || '');
  const [priceMax, setPriceMax] = useState(150000);
  const [ram, setRam] = useState('');
  const [is5G, setIs5G] = useState(false);
  const [sortBy, setSortBy] = useState('popularity');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  // Load products catalog from persistent Redux state (allows admin additions to show up!)
  const productsCatalog = useSelector((state: RootState) => state.products.items);

  const [brandsList, setBrandsList] = useState<string[]>([]);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/brands');
        if (res.ok) {
          const data = await res.json();
          const list = data.brands || (Array.isArray(data) ? data : []);
          const names = list.map((b: any) => b.name).filter(Boolean);
          if (names.length > 0) {
            setBrandsList(names);
          }
        }
      } catch (_) {}
    };
    fetchBrands();
  }, []);

  // Synchronize URL search params with local brand filter state
  useEffect(() => {
    const brandParam = searchParams.get('brand');
    setSelectedBrand(brandParam || '');
    const searchParam = searchParams.get('search');
    setSearchQuery(searchParam || '');
  }, [searchParams]);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        let rawList = [];
        const queryParams = new URLSearchParams();
        if (selectedBrand) queryParams.append('brand', selectedBrand);
        queryParams.append('maxPrice', priceMax.toString());
        if (is5G) queryParams.append('is5G', 'true');
        queryParams.append('sort', sortBy);

        try {
          const res = await fetch(`http://localhost:5000/api/products?${queryParams.toString()}`);
          if (res.ok) {
            const data = await res.json();
            rawList = data.products || (Array.isArray(data) ? data : []);
          }
        } catch (_) {}

        // If backend returned nothing or failed, fall back to Redux catalog
        if (!rawList || rawList.length === 0) {
          rawList = productsCatalog.filter((p: any) => p.category === 'smartphones' || !p.category || p.category !== 'accessories');
        }

        // Apply all filters on the client-side as well to ensure flawless offline fallback behavior
        let filtered = [...rawList];

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          filtered = filtered.filter(
            (p) =>
              p.name?.toLowerCase().includes(q) ||
              p.brand?.name?.toLowerCase().includes(q) ||
              (p.specs?.processor && p.specs.processor.toLowerCase().includes(q)) ||
              (p.specs?.ram && p.specs.ram.toLowerCase().includes(q)) ||
              (p.specs?.storage && p.specs.storage.toLowerCase().includes(q))
          );
        }
        
        if (selectedBrand) {
          filtered = filtered.filter((p) => {
            const bName = typeof p.brand === 'object' ? (p.brand?.name || '') : (p.brand || '');
            return bName.toLowerCase() === selectedBrand.toLowerCase();
          });
        }
        
        if (priceMax) {
          filtered = filtered.filter(
            (p) => (p.discountPrice || p.basePrice) <= priceMax
          );
        }
        
        if (is5G) {
          filtered = filtered.filter((p) => p.is5G === true);
        }
        
        if (ram) {
          filtered = filtered.filter((p: any) => {
            const specRam = p.specs?.ram?.toLowerCase() || '';
            const variantRam = p.variants?.some((v: any) => v.ram?.toLowerCase() === ram.toLowerCase());
            return specRam.includes(ram.toLowerCase()) || variantRam;
          });
        }

        // Exclusively show smartphones
        filtered = filtered.filter(
          (p) => !p.category || p.category.toLowerCase() === 'smartphones'
        );

        // Apply sorting
        if (sortBy === 'price_asc') {
          filtered.sort((a, b) => (a.discountPrice || a.basePrice) - (b.discountPrice || b.basePrice));
        } else if (sortBy === 'price_desc') {
          filtered.sort((a, b) => (b.discountPrice || b.basePrice) - (a.discountPrice || a.basePrice));
        } else if (sortBy === 'rating') {
          filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        }

        setProducts(filtered);
      } catch (err) {
        setProducts(productsCatalog);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, [selectedBrand, priceMax, ram, is5G, sortBy, searchQuery]);

  // Handle Compare additions
  const toggleCompare = (prod: any) => {
    const inCompare = compareItems.some((i) => i.id === prod.id);
    if (inCompare) {
      dispatch(removeFromCompare(prod.id));
    } else {
      if (compareItems.length >= 4) {
        showToast('You can only compare a maximum of 4 smartphones.', 'warning');
        return;
      }
      dispatch(
        addToCompare({
          id: prod.id,
          name: prod.name,
          slug: prod.slug,
          image: prod.images[0],
          brand: prod.brand?.name || 'Smart',
          price: prod.discountPrice || prod.basePrice,
          specs: {
            processor: prod.specs?.processor || 'Octa-core',
            camera: prod.specs?.camera || '50MP',
            battery: prod.specs?.battery || '5000mAh',
            display: prod.specs?.display || 'AMOLED',
            refreshRate: prod.specs?.refreshRate || '120Hz'
          }
        })
      );
    }
  };

  // Add to cart helper
  const handleAddToCart = (prod: any) => {
    let variantId = '';
    let selectedColor = 'Default Color';
    let selectedRam = prod.specs?.ram || '8GB';
    let selectedStorage = prod.specs?.storage || '128GB';

    if (prod.variants && prod.variants.length > 0) {
      const firstVar = prod.variants[0];
      variantId = firstVar._id || firstVar.id || '';
      if (firstVar.color) selectedColor = firstVar.color;
      if (firstVar.ram) selectedRam = firstVar.ram;
      if (firstVar.storage) selectedStorage = firstVar.storage;
    }

    dispatch(
      addToCart({
        productId: prod._id || prod.id,
        variantId,
        name: prod.name,
        image: prod.images?.[0] || '',
        brand: prod.brand?.name || 'Smart',
        ram: selectedRam,
        storage: selectedStorage,
        color: selectedColor,
        price: prod.discountPrice || prod.basePrice || prod.price || 0,
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
            <h2>Filters</h2>
          </div>

          {/* Text Search Filter */}
          <div className={styles.filterGroup} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
            <h3>Text Search</h3>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search phones, specs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  color: 'var(--foreground)',
                  outline: 'none'
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

          {/* Brand Filter */}
          <div className={styles.filterGroup}>
            <h3>Brand</h3>
            <div className={styles.options}>
              {(brandsList.length > 0 ? brandsList : ['Vivo', 'Lava', 'Samsung', 'Apple', 'OnePlus', 'Nothing', 'Xiaomi']).map((b) => (
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

          {/* Price Range */}
          <div className={styles.filterGroup}>
            <h3>Max Price: ₹{priceMax.toLocaleString()}</h3>
            <input
              type="range"
              min={8000}
              max={150000}
              step={2000}
              value={priceMax}
              onChange={(e) => setPriceMax(parseInt(e.target.value))}
              className={styles.rangeInput}
            />
          </div>

          {/* RAM selection */}
          <div className={styles.filterGroup}>
            <h3>Memory (RAM)</h3>
            <select value={ram} onChange={(e) => setRam(e.target.value)} className={styles.selectFilter}>
              <option value="">Any Memory</option>
              <option value="16GB">16GB RAM</option>
              <option value="12GB">12GB RAM</option>
              <option value="8GB">8GB RAM</option>
            </select>
          </div>

          {/* 5G filter */}
          <div className={styles.filterGroup}>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={is5G}
                onChange={(e) => setIs5G(e.target.checked)}
              />
              <span>5G Enabled Only</span>
            </label>
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
            <div className={styles.loader}>Searching smarter phones...</div>
          ) : (
            <div className={styles.productsGrid}>
              {products.map((prod) => {
                const itemSlug = prod.slug || prod.id || prod._id;
                const inCompare = compareItems.some((i) => i.id === prod.id);
                const overallStock = prod.variants && prod.variants.length > 0
                  ? prod.variants.reduce((sum: number, v: any) => sum + (v.stock !== undefined ? v.stock : 0), 0)
                  : prod.stock || 0;

                return (
                  <div key={prod.id || prod._id} className={`${styles.productCard} glassCard`}>
                    <Link href={`/products/${itemSlug}`}>
                      <img src={prod.images[0]} alt={prod.name} className={styles.productImg} />
                    </Link>
                    <div className={styles.brandBadge}>{prod.brand?.name}</div>
                    <Link href={`/products/${itemSlug}`}>
                      <h3 className={styles.name}>{prod.name}</h3>
                    </Link>
                    <p className={styles.briefSpecs}>
                      {prod.specs?.processor} • {prod.specs?.battery}
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
                          ₹{(prod.discountPrice || prod.basePrice || prod.price || 0).toLocaleString('en-IN')}
                        </span>
                        {prod.discountPrice && (prod.basePrice || prod.price) && (
                          <span className={styles.oldPrice}>
                            ₹{(prod.basePrice || prod.price || 0).toLocaleString('en-IN')}
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

                    {/* Compare and actions checklist */}
                    <div className={styles.compareRow}>
                      <button
                        onClick={() => toggleCompare(prod)}
                        className={`${styles.compareToggle} ${inCompare ? styles.inCompare : ''}`}
                      >
                        {inCompare ? <CheckCircle size={14} /> : <PlusCircle size={14} />}
                        <span>{inCompare ? 'Compared' : 'Add to Compare'}</span>
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

export default function ProductsList() {
  return (
    <Suspense fallback={<div style={{ padding: '100px 0', textAlign: 'center', color: 'var(--foreground-secondary)' }}>Loading catalog...</div>}>
      <ProductsCatalog />
    </Suspense>
  );
}
