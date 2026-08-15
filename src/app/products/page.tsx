'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { addToCart } from '../../store/cartSlice';
import { Filter, ArrowUpDown, ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './products.module.css';
import { useToast } from '../../context/ToastContext';

function ProductsCatalog() {
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const { showToast } = useToast();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brand') || '');
  const [priceMax, setPriceMax] = useState(150000);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');

  // Accessories Filters
  const [selectedAccessoryType, setSelectedAccessoryType] = useState(searchParams.get('type') || '');
  const [selectedDeviceCompatibility, setSelectedDeviceCompatibility] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  // Smartphones Filters
  const [selectedRam, setSelectedRam] = useState('');
  const [selectedStorage, setSelectedStorage] = useState('');

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState('popular');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBrand, selectedCategory, priceMax, selectedAccessoryType, selectedDeviceCompatibility, selectedColor, selectedRam, selectedStorage, sortBy]);

  useEffect(() => {
    const fetchCatalog = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (selectedBrand) queryParams.set('brand', selectedBrand);
        if (selectedCategory) queryParams.set('category', selectedCategory);

        const res = await fetch(`http://localhost:5000/api/products?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : (data.products || []);
          setProducts(items.map((p: any) => ({
            id: p._id || p.id,
            slug: p.slug || p._id || p.id,
            name: p.name,
            brand: p.brand,
            category: p.category || 'smartphones',
            basePrice: p.price || p.basePrice || 0,
            discountPrice: p.discountPrice || p.price || p.basePrice || 0,
            images: (p.images && p.images.length > 0)
              ? p.images
              : [p.image || 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=400'],
            variants: p.variants || [],
            stock: p.stock ?? 10,
            ramVariants: p.ramVariants || [],
            storageVariants: p.storageVariants || [],
            colorVariants: p.colorVariants || [],
            specifications: p.specifications || {},
            accessoryType: p.accessoryType || '',
            compatibleModels: p.compatibleModels || [],
          })));
        }
      } catch (_) {
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, [selectedBrand, selectedCategory]);

  const uniqueBrands = Array.from(new Set(products.map((p) => typeof p.brand === 'string' ? p.brand : (p.brand?.name || 'Smart'))));
  const uniqueAccessoryTypes = Array.from(new Set(products.map((p) => p.accessoryType).filter(Boolean)));
  const uniqueColors = Array.from(new Set(products.flatMap((p) => p.colorVariants || []).filter(Boolean)));

  // Filter Logic
  const filteredProducts = products.filter((prod) => {
    if (selectedBrand && (typeof prod.brand === 'string' ? prod.brand.toLowerCase() : (prod.brand?.name || '').toLowerCase()) !== selectedBrand.toLowerCase()) return false;
    if (selectedCategory && prod.category.toLowerCase() !== selectedCategory.toLowerCase()) return false;
    if (prod.discountPrice > priceMax) return false;

    if (selectedCategory === 'accessories') {
      if (selectedAccessoryType && prod.accessoryType.toLowerCase() !== selectedAccessoryType.toLowerCase()) return false;
      if (selectedDeviceCompatibility && !prod.compatibleModels?.some((m: string) => m.toLowerCase().includes(selectedDeviceCompatibility.toLowerCase()))) return false;
    }

    if (selectedCategory === 'smartphones' || !selectedCategory) {
      if (selectedRam && !prod.ramVariants?.includes(selectedRam)) return false;
      if (selectedStorage && !prod.storageVariants?.includes(selectedStorage)) return false;
    }

    if (selectedColor && !prod.colorVariants?.includes(selectedColor)) return false;

    return true;
  });

  // Sort Logic
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-low') return a.discountPrice - b.discountPrice;
    if (sortBy === 'price-high') return b.discountPrice - a.discountPrice;
    return 0;
  });

  // Pagination Logic
  const totalItems = sortedProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = sortedProducts.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };

  // Handle Quick Add to Cart
  const handleQuickAdd = (prod: any) => {
    const defaultVar = prod.variants?.[0] || {};
    const defaultColor = defaultVar.color || prod.colorVariants?.[0] || 'Standard';
    const defaultRam = defaultVar.ram || prod.ramVariants?.[0] || '';
    const defaultStorage = defaultVar.storage || prod.storageVariants?.[0] || '';

    dispatch(
      addToCart({
        id: `${prod.id}-${defaultColor}-${defaultRam}`,
        productId: prod.id,
        variantId: defaultVar._id || defaultVar.id || '',
        name: prod.name,
        brand: typeof prod.brand === 'string' ? prod.brand : (prod.brand?.name || 'Smart'),
        color: defaultColor,
        ram: defaultRam,
        storage: defaultStorage,
        price: prod.discountPrice || prod.basePrice,
        image: prod.images[0],
        quantity: 1,
      })
    );
    showToast(`Added "${prod.name}" to cart!`, 'success');
  };

  return (
    <div className={`${styles.catalogPage} container`}>
      <header className={styles.header}>
        <h1>Official Products Directory</h1>
        <p>Explore genuine smartphones, wireless earbuds, fast chargers, and accessories.</p>
      </header>

      <div className={styles.contentLayout}>
        {/* Sidebar Filters */}
        <aside className={`${styles.sidebar} glass`}>
          <div className={styles.filterGroup}>
            <h3><Filter size={16} /> Max Price</h3>
            <div className={styles.priceRange}>
              <input
                type="range"
                min="500"
                max="150000"
                step="1000"
                value={priceMax}
                onChange={(e) => setPriceMax(Number(e.target.value))}
              />
              <span>Up to ₹{priceMax.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className={styles.filterGroup}>
            <h3>Brand Ecosystem</h3>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className={styles.selectFilter}
            >
              <option value="">All Brands</option>
              {uniqueBrands.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Accessories Filters */}
          {selectedCategory === 'accessories' && (
            <>
              {uniqueAccessoryTypes.length > 0 && (
                <div className={styles.filterGroup}>
                  <h3>Accessory Type</h3>
                  <select
                    value={selectedAccessoryType}
                    onChange={(e) => setSelectedAccessoryType(e.target.value)}
                    className={styles.selectFilter}
                  >
                    <option value="">All Types</option>
                    {uniqueAccessoryTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className={styles.filterGroup}>
                <h3>Device Compatibility</h3>
                <input
                  type="text"
                  placeholder="e.g. S24 Ultra, iPhone 15..."
                  value={selectedDeviceCompatibility}
                  onChange={(e) => setSelectedDeviceCompatibility(e.target.value)}
                  className={styles.textInputFilter}
                />
              </div>
            </>
          )}

          {/* Smartphone Hardware Specs Filters */}
          {(selectedCategory === 'smartphones' || !selectedCategory) && (
            <>
              <div className={styles.filterGroup}>
                <h3>RAM Capacity</h3>
                <div className={styles.chipList}>
                  {['', '8GB', '12GB', '16GB'].map((ram) => (
                    <button
                      key={ram}
                      onClick={() => setSelectedRam(ram)}
                      className={`${styles.chip} ${selectedRam === ram ? styles.chipActive : ''}`}
                    >
                      {ram || 'Any'}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.filterGroup}>
                <h3>Internal Storage</h3>
                <div className={styles.chipList}>
                  {['', '128GB', '256GB', '512GB', '1TB'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setSelectedStorage(st)}
                      className={`${styles.chip} ${selectedStorage === st ? styles.chipActive : ''}`}
                    >
                      {st || 'Any'}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {uniqueColors.length > 0 && (
            <div className={styles.filterGroup}>
              <h3>Color Variant</h3>
              <select
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className={styles.selectFilter}
              >
                <option value="">All Colors</option>
                {uniqueColors.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}
        </aside>

        {/* Main Products Grid */}
        <main className={styles.mainGrid}>
          <div className={styles.gridTopBar}>
            <span className={styles.resultsCount}>
              Showing <strong>{totalItems > 0 ? `${startIndex + 1}–${Math.min(startIndex + itemsPerPage, totalItems)}` : 0}</strong> of <strong>{totalItems}</strong> catalog items
            </span>
            <div className={styles.sortBox}>
              <ArrowUpDown size={14} />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="popular">Most Popular</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className={styles.loadingState}>
              <p>Loading products catalog...</p>
            </div>
          ) : paginatedProducts.length === 0 ? (
            <div className={styles.emptyState}>
              <h3>No matching products found</h3>
              <p>Try resetting filters or adjusting search parameters.</p>
              <button
                onClick={() => {
                  setSelectedBrand('');
                  setSelectedCategory('');
                  setSelectedAccessoryType('');
                  setSelectedRam('');
                  setSelectedStorage('');
                  setPriceMax(150000);
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
                  const overallStock = prod.stock ?? 10;

                  return (
                    <div key={prod.id} className={styles.productCard}>
                      <div className={styles.cardHeader}>
                        <span className={styles.brandTag}>
                          {typeof prod.brand === 'string' ? prod.brand : (prod.brand?.name || 'Smart')}
                        </span>
                        {prod.category === 'accessories' && prod.accessoryType && (
                          <span className={styles.accessoryTag}>{prod.accessoryType}</span>
                        )}
                      </div>

                      <div className={styles.imageWrap}>
                        <img src={prod.images[0]} alt={prod.name} />
                      </div>

                      <Link href={`/products/${prod.slug}`} className={styles.titleLink}>
                        <h3>{prod.name}</h3>
                      </Link>

                      <div className={styles.cardPriceRow}>
                        <span className={styles.priceCurrent}>₹{prod.discountPrice.toLocaleString('en-IN')}</span>
                        {prod.basePrice > prod.discountPrice && (
                          <span className={styles.priceOld}>₹{prod.basePrice.toLocaleString('en-IN')}</span>
                        )}
                      </div>

                      <div className={styles.cardActions}>
                        <Link href={`/products/${prod.slug}`} className="btn btnSecondary" style={{ flex: 1, fontSize: '12px' }}>
                          View Details
                        </Link>
                        <button
                          onClick={() => handleQuickAdd(prod)}
                          className="btn btnPrimary"
                          title="Add to Shopping Cart"
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
                    Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({totalItems} total products)
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

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: '60px', textAlign: 'center' }}>Loading Catalog...</div>}>
      <ProductsCatalog />
    </Suspense>
  );
}
