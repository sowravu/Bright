'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { addToCart } from '../../store/cartSlice';
import { Filter, ShoppingBag, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
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

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBrand, priceMax, sortBy, searchQuery, selectedCategory]);

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

  // Pagination Calculation
  const totalItems = products.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = products.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };

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
    <div className={`${styles.catalogPage} container`}>
      <header className={styles.header}>
        <h1>Official Accessories & Audio Directory</h1>
        <p>Discover fast chargers, GaN power adapters, TWS earbuds, and protective cases.</p>
      </header>

      <div className={styles.contentLayout}>
        {/* 1. Sidebar Filters */}
        <aside className={`${styles.sidebar} glass`}>
          <div className={styles.filterGroup}>
            <h3><Filter size={16} /> Text Search</h3>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search accessories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.textInputFilter}
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
            <h3>Accessory Type</h3>
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

          {/* Dynamic Brand Filter */}
          <div className={styles.filterGroup}>
            <h3>Brand Ecosystem</h3>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className={styles.selectFilter}
            >
              <option value="">All Brands</option>
              {(brandsList.length > 0 ? brandsList : ['Vivo', 'Lava', 'Samsung', 'Apple', 'OnePlus', 'Nothing', 'Xiaomi']).map((b: string) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Price Range Slider */}
          <div className={styles.filterGroup}>
            <h3>Max Price</h3>
            <div className={styles.priceRange}>
              <input
                type="range"
                min={500}
                max={40000}
                step={500}
                value={priceMax}
                onChange={(e) => setPriceMax(parseInt(e.target.value))}
              />
              <span>Up to ₹{priceMax.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </aside>

        {/* 2. Main Content Grid */}
        <main className={styles.mainGrid}>
          {/* Top Bar Toolbar */}
          <div className={styles.gridTopBar}>
            <span className={styles.resultsCount}>
              Showing <strong>{totalItems > 0 ? `${startIndex + 1}–${Math.min(startIndex + itemsPerPage, totalItems)}` : 0}</strong> of <strong>{totalItems}</strong> accessory items
            </span>
            <div className={styles.sortBox}>
              <ArrowUpDown size={14} />
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
            <div className={styles.loadingState}>
              <p>Searching accessories catalog...</p>
            </div>
          ) : paginatedProducts.length === 0 ? (
            <div className={styles.emptyState}>
              <h3>No matching accessories found</h3>
              <p>Try clearing your search query or adjusting price filters.</p>
              <button
                onClick={() => {
                  setSelectedBrand('');
                  setSelectedCategory('');
                  setSearchQuery('');
                  setPriceMax(40000);
                }}
                className="btn btnSecondary"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className={styles.productsGrid}>
                {paginatedProducts.map((prod) => {
                  const itemSlug = prod.slug || prod.id || prod._id;
                  const overallStock = prod.stock ?? 10;
                  const mainPrice = prod.discountPrice || prod.basePrice || prod.price || 0;
                  const oldPrice = prod.basePrice || prod.price || 0;
                  const brandName = prod.brand?.name || (typeof prod.brand === 'string' ? prod.brand : 'Brand');
                  const accessoryTypeName = prod.accessoryType?.name || (typeof prod.accessoryType === 'string' ? prod.accessoryType : 'Accessory');

                  return (
                    <div key={prod.id || prod._id} className={styles.productCard}>
                      <div className={styles.cardHeader}>
                        <span className={styles.brandTag}>{brandName}</span>
                        <span className={styles.accessoryTag}>{accessoryTypeName}</span>
                      </div>

                      <div className={styles.imageWrap}>
                        <img src={prod.images?.[0] || 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=600'} alt={prod.name} />
                      </div>

                      <Link href={`/products/${itemSlug}`} className={styles.titleLink}>
                        <h3>{prod.name}</h3>
                      </Link>

                      <div className={styles.cardPriceRow}>
                        <span className={styles.priceCurrent}>₹{Number(mainPrice).toLocaleString('en-IN')}</span>
                        {prod.discountPrice && oldPrice > mainPrice && (
                          <span className={styles.priceOld}>₹{Number(oldPrice).toLocaleString('en-IN')}</span>
                        )}
                      </div>

                      <div className={styles.cardActions}>
                        <Link href={`/products/${itemSlug}`} className="btn btnSecondary" style={{ flex: 1, fontSize: '12px' }}>
                          View Details
                        </Link>
                        <button
                          onClick={() => handleAddToCart(prod)}
                          className="btn btnPrimary"
                          title={overallStock > 0 ? "Add to Shopping Cart" : "Out of Stock"}
                          disabled={overallStock === 0}
                        >
                          <ShoppingBag size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Row */}
              {totalPages > 1 && (
                <div className={styles.paginationRow}>
                  <span className={styles.paginationInfo}>
                    Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({totalItems} total accessories)
                  </span>

                  <div className={styles.paginationNav}>
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={styles.pageNavBtn}
                    >
                      <ChevronLeft size={16} /> Previous
                    </button>

                    <div className={styles.pageNumbers}>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`${styles.pageBtn} ${currentPage === pageNum ? styles.pageBtnActive : ''}`}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={styles.pageNavBtn}
                    >
                      Next <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default function AccessoriesPage() {
  return (
    <Suspense fallback={<div style={{ padding: '60px', textAlign: 'center' }}>Loading accessories catalog...</div>}>
      <AccessoriesCatalog />
    </Suspense>
  );
}
