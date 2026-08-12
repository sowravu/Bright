'use client';

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../store';
import { setProducts, removeProduct } from '../../../store/productsSlice';
import { useToast } from '../../../context/ToastContext';
import { Headphones, Plus, Trash2, X, Sparkles } from 'lucide-react';
import styles from '../admin.module.css';
import Link from 'next/link';

interface VariantStockRow {
  id: string;
  color: string;
  price?: number;
  discountPrice?: number;
  stock: number;
  image?: string;
}

export default function AccessoriesAdminPage() {
  const dispatch = useDispatch();
  const auth = useSelector((state: RootState) => state.auth);
  const productsCatalog = useSelector((state: RootState) => state.products.items);
  const { showToast } = useToast();

  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const [showAddAccessoryModal, setShowAddAccessoryModal] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductBrand, setNewProductBrand] = useState('');
  const [newProductSubcategory, setNewProductSubcategory] = useState('');
  const [newProductDescription, setNewProductDescription] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const handleGenerateAiDescription = async () => {
    if (!newProductName.trim()) {
      showToast('Please enter the Accessory Model Name first to generate an AI description.', 'error');
      return;
    }

    setIsGeneratingAi(true);
    try {
      const res = await fetch('http://localhost:5000/api/accessories/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProductName.trim(),
          brand: newProductBrand,
          accessoryType: newProductSubcategory,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.description) {
          setNewProductDescription(data.description);
          showToast(`AI Description generated for "${newProductName.trim()}"!`, 'success');
        }
      } else {
        const errData = await res.json().catch(() => ({ message: 'AI generation failed' }));
        showToast(`AI generation failed: ${errData.message}`, 'error');
      }
    } catch (_) {
      showToast('Network error while reaching AI Description service.', 'error');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const [brandsList, setBrandsList] = useState<string[]>([]);
  const [accessoryTypes, setAccessoryTypes] = useState<string[]>([]);
  const [variantStockRows, setVariantStockRows] = useState<VariantStockRow[]>([]);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{ prodId: string; prodName: string } | null>(null);

  const [dbAccessories, setDbAccessories] = useState<any[]>([]);

  const fetchDbData = async () => {
    try {
      const bRes = await fetch('http://localhost:5000/api/brands');
      if (bRes.ok) {
        const bData = await bRes.json();
        const bList = bData.brands || (Array.isArray(bData) ? bData : []);
        const brandNames = bList.map((b: any) => b.name);
        setBrandsList(brandNames);
        if (brandNames.length > 0 && !newProductBrand) {
          setNewProductBrand(brandNames[0]);
        }
      }

      const tRes = await fetch('http://localhost:5000/api/accessory-types');
      if (tRes.ok) {
        const tData = await tRes.json();
        const tList = tData.accessoryTypes || (Array.isArray(tData) ? tData : []);
        const typeNames = tList.map((t: any) => t.name);
        setAccessoryTypes(typeNames);
        if (typeNames.length > 0 && !newProductSubcategory) {
          setNewProductSubcategory(typeNames[0]);
        }
      }

      const aRes = await fetch('http://localhost:5000/api/accessories?limit=200');
      if (aRes.ok) {
        const aData = await aRes.json();
        const accs = aData.accessories || (Array.isArray(aData) ? aData : []);
        const normalized = accs.map((item: any) => ({
          id: item._id || item.id,
          _id: item._id || item.id,
          name: item.name,
          brand: typeof item.brand === 'object' ? item.brand : { name: item.brand || 'Generic' },
          stock: item.stock || 0,
          basePrice: item.price || item.basePrice || 0,
          discountPrice: item.discountPrice || item.price || item.basePrice || 0,
          slug: item.slug || (item.name ? item.name.toLowerCase().replace(/\s+/g, '-') : ''),
          images: item.images || [],
          category: 'accessories',
          subcategory: item.accessoryType ? (item.accessoryType.name || item.accessoryType) : (item.subcategory || 'General'),
          description: item.description || '',
          colorVariants: item.colorVariants || [],
          variants: item.variants || [],
          specs: item.specifications || item.specs || {},
          isActive: item.isActive !== false,
        }));
        setDbAccessories(normalized);
        dispatch(setProducts(normalized));
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchDbData();
  }, []);

  const handleAddVariantRow = () => {
    setVariantStockRows((prev) => [
      ...prev,
      {
        id: `v-${Date.now()}-${Math.random()}`,
        color: 'Default',
        price: 0,
        discountPrice: 0,
        stock: 10,
        image: '',
      },
    ]);
  };

  const handleRemoveVariantRow = (id: string) => {
    setVariantStockRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateVariantRow = (id: string, field: keyof VariantStockRow, value: any) => {
    setVariantStockRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleLocalFileUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          callback(reader.result);
          showToast(`Image "${file.name}" selected from computer!`, 'success');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddAccessorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validate Accessory Name
    if (!newProductName || !newProductName.trim()) {
      showToast('Please enter an accessory model name.', 'error');
      return;
    }

    // 2. Validate Subcategory / Accessory Type
    if (!newProductSubcategory && accessoryTypes.length === 0) {
      showToast('Please select or add an accessory type first.', 'error');
      return;
    }

    // 3. Validate Variants Presence
    if (variantStockRows.length === 0) {
      showToast('Please add at least one variant row with price and image.', 'error');
      return;
    }

    // 4. Validate Prices across all variant rows
    for (let i = 0; i < variantStockRows.length; i++) {
      const row = variantStockRows[i];
      const p = Number(row.price);
      if (row.price === undefined || row.price === null || isNaN(p) || p <= 0) {
        showToast(
          `Please enter a valid price greater than ₹0 for variant #${i + 1}${row.color ? ` (${row.color})` : ''}.`,
          'error'
        );
        return;
      }
      if (row.discountPrice !== undefined && row.discountPrice !== null && row.discountPrice > 0) {
        const dp = Number(row.discountPrice);
        if (dp > p) {
          showToast(
            `Discount price (₹${dp}) cannot be greater than regular price (₹${p}) for variant #${i + 1}.`,
            'error'
          );
          return;
        }
      }
    }

    // 5. Validate Image Uploads across variant rows
    const variantImages = Array.from(
      new Set(variantStockRows.map((r) => r.image).filter((img): img is string => Boolean(img && img.trim())))
    );

    if (variantImages.length === 0) {
      showToast('Please upload at least one image file for the accessory variant.', 'error');
      return;
    }

    const token = auth.token || (typeof window !== 'undefined' ? localStorage.getItem('bright_token') : '');
    if (!token) {
      showToast('Authentication token missing. Please log in as Admin again.', 'error');
      return;
    }

    const firstVariant = variantStockRows[0];
    const basePriceNum = Number(firstVariant.price);
    const discPriceNum = firstVariant.discountPrice !== undefined && firstVariant.discountPrice > 0
      ? Number(firstVariant.discountPrice)
      : basePriceNum;

    const autoColors = Array.from(new Set(variantStockRows.map((r) => r.color.trim()).filter(Boolean)));
    const parsedColors = autoColors.length > 0 ? autoColors : ['Default'];

    const stockNum = variantStockRows.reduce((sum, r) => sum + (Number(r.stock) || 0), 0);

    const colorImagesMap: Record<string, string> = {};
    variantStockRows.forEach((r) => {
      if (r.color && r.image) {
        colorImagesMap[r.color] = r.image;
      }
    });

    const productImages = variantImages;

    const payload = {
      name: newProductName.trim(),
      brand: newProductBrand || (brandsList[0] || 'Generic'),
      accessoryType: newProductSubcategory || (accessoryTypes[0] || 'General'),
      price: basePriceNum,
      discountPrice: discPriceNum,
      stock: stockNum,
      description: newProductDescription.trim(),
      colorVariants: parsedColors,
      colorImages: colorImagesMap,
      variants: variantStockRows.map((r) => ({
        color: r.color,
        price: Number(r.price),
        discountPrice: r.discountPrice !== undefined && r.discountPrice > 0 ? Number(r.discountPrice) : Number(r.price),
        stock: Number(r.stock) || 0,
        image: r.image || '',
      })),
      images: productImages,
    };

    try {
      const res = await fetch('http://localhost:5000/api/accessories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(`Accessory "${newProductName}" added successfully to MongoDB!`, 'success');
        setNewProductName('');
        setNewProductDescription('');
        setVariantStockRows([]);
        setShowAddAccessoryModal(false);
        await fetchDbData();
      } else {
        const errData = await res.json().catch(() => ({ message: 'Failed to add accessory' }));
        showToast(`Failed to save: ${errData.message}`, 'error');
      }
    } catch (_) {
      showToast('Network error when connecting to MongoDB server', 'error');
    }
  };

  const confirmExecuteRemoveAccessory = async () => {
    if (!deleteConfirmTarget) return;
    const { prodId, prodName } = deleteConfirmTarget;
    const token = auth.token || (typeof window !== 'undefined' ? localStorage.getItem('bright_token') : '');

    try {
      const res = await fetch(`http://localhost:5000/api/accessories/${prodId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        dispatch(removeProduct(prodId));
        showToast(`Accessory "${prodName}" removed successfully!`, 'info');
        await fetchDbData();
      } else {
        showToast('Failed to remove accessory from MongoDB', 'error');
      }
    } catch (_) {}
    setDeleteConfirmTarget(null);
  };

  const activeCatalog = dbAccessories.length > 0 ? dbAccessories : productsCatalog;
  const accessoriesList = (activeCatalog || []).filter((p: any) => {
    if (!p) return false;
    const isAcc = (p.category || '').toLowerCase() === 'accessories' || Boolean(p.accessoryType || p.subcategory);
    if (!isAcc) return false;

    if (catalogSearchQuery.trim()) {
      const q = catalogSearchQuery.toLowerCase();
      const bName = typeof p.brand === 'object' ? (p.brand?.name || '') : String(p.brand || '');
      return (p.name || '').toLowerCase().includes(q) || bName.toLowerCase().includes(q);
    }
    return true;
  });

  const totalPages = Math.ceil(accessoriesList.length / pageSize) || 1;
  const paginatedAccessories = accessoriesList.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className={styles.tableCard} style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius-md)', padding: '24px', border: '1px solid var(--border-color)' }}>
      <div className={styles.tableHeaderBar}>
        <div>
          <h2>Accessories Inventory ({accessoriesList.length} items)</h2>
          <span style={{ fontSize: '12px', color: 'var(--foreground-secondary)' }}>Manage mobile cases, chargers, earphones, power banks, and color options.</span>
        </div>
        <button 
          onClick={() => { setVariantStockRows([]); setShowAddAccessoryModal(true); }}
          className="btn btnPrimary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', background: '#10b981' }}
        >
          <Plus size={16} /> Add Accessory Model
        </button>
      </div>

      {/* Search Filter Bar */}
      <div className={styles.searchAndFilter} style={{ margin: '16px 0', flexWrap: 'wrap' }}>
        <input 
          type="text" 
          placeholder="Search accessories by name or brand..." 
          value={catalogSearchQuery} 
          onChange={(e) => { setCatalogSearchQuery(e.target.value); setCurrentPage(1); }}
          className={styles.searchInput}
          style={{ flex: 1 }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--foreground-secondary)' }}>
          <span>Per Page:</span>
          <select 
            value={pageSize} 
            onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
            className={styles.statusSelect}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>
      </div>

      {/* Accessories Table */}
      {paginatedAccessories.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px dashed var(--border-color)', margin: '16px 0' }}>
          <Headphones size={36} style={{ color: 'var(--foreground-secondary)', marginBottom: '8px' }} />
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground-secondary)', margin: 0 }}>
            No accessories found. Click "+ Add Accessory Model" to add your first real accessory to MongoDB!
          </p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.adminTable}>
            <thead>
              <tr>
                <th className={styles.adminTh}>ACCESSORY NAME</th>
                <th className={styles.adminTh}>TYPE / SUBCATEGORY</th>
                <th className={styles.adminTh}>BRAND</th>
                <th className={styles.adminTh}>BASE PRICE</th>
                <th className={styles.adminTh}>CURRENT STOCK</th>
                <th className={styles.adminTh}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAccessories.map((prod: any) => (
                <tr key={prod.id || prod._id}>
                  <td className={styles.adminTd} style={{ fontWeight: 700 }}>{prod.name}</td>
                  <td className={styles.adminTd}>
                    <span className={styles.categoryBadge} style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
                      {(prod.subcategory || 'General').toUpperCase()}
                    </span>
                  </td>
                  <td className={styles.adminTd}>{typeof prod.brand === 'object' ? prod.brand.name : (prod.brand || 'Generic')}</td>
                  <td className={styles.adminTd} style={{ fontWeight: 600 }}>₹{(prod.discountPrice || prod.basePrice || 0).toLocaleString('en-IN')}</td>
                  <td className={styles.adminTd}>
                    <span style={{ fontWeight: 700, color: prod.stock <= 5 ? '#ef4444' : '#10b981' }}>
                      {prod.stock} units
                    </span>
                  </td>
                  <td className={styles.adminTd}>
                    <button 
                      onClick={() => setDeleteConfirmTarget({ prodId: prod.id || prod._id, prodName: prod.name })}
                      className="btn btnSecondary"
                      style={{ fontSize: '11px', padding: '4px 8px', color: '#ef4444', borderColor: '#fca5a5' }}
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {accessoriesList.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', fontSize: '12px', color: 'var(--foreground-secondary)' }}>
          <span>Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, accessoriesList.length)} of {accessoriesList.length} accessory entries</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button 
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage(p => p - 1)}
              style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
            >
              &lt; Prev
            </button>
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx + 1}
                onClick={() => setCurrentPage(idx + 1)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color)',
                  background: currentPage === idx + 1 ? 'var(--primary)' : 'transparent',
                  color: currentPage === idx + 1 ? '#fff' : 'inherit',
                  cursor: 'pointer'
                }}
              >
                {idx + 1}
              </button>
            ))}
            <button 
              disabled={currentPage === totalPages} 
              onClick={() => setCurrentPage(p => p + 1)}
              style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
            >
              Next &gt;
            </button>
          </div>
        </div>
      )}

      {/* Add Accessory Modal */}
      {showAddAccessoryModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '750px', background: 'var(--card-bg)' }}>
            <div className={styles.modalHeader}>
              <h2>Add Accessory Model to Catalog</h2>
              <button onClick={() => setShowAddAccessoryModal(false)} className={styles.modalClose}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddAccessorySubmit} className={styles.formFields}>
              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label>Accessory Model Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 100W Fast Charger or Silicon Bumper Case" 
                    value={newProductName} 
                    onChange={(e) => setNewProductName(e.target.value)} 
                    required 
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Accessory Type (From MongoDB)</label>
                  {accessoryTypes.length > 0 ? (
                    <select 
                      value={newProductSubcategory} 
                      onChange={(e) => setNewProductSubcategory(e.target.value)}
                    >
                      {accessoryTypes.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  ) : (
                    <div style={{ fontSize: '12px', color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '8px 12px', borderRadius: '6px' }}>
                      No accessory types found in MongoDB database.{' '}
                      <Link href="/admin/accessory-types" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'underline' }}>
                        Click here to add one first
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label>Brand (From MongoDB)</label>
                {brandsList.length > 0 ? (
                  <select 
                    value={newProductBrand} 
                    onChange={(e) => setNewProductBrand(e.target.value)}
                  >
                    {brandsList.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                ) : (
                  <div style={{ fontSize: '12px', color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '8px 12px', borderRadius: '6px' }}>
                    No brands found in MongoDB database.{' '}
                    <Link href="/admin/brands" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'underline' }}>
                      Click here to add a brand partner first
                    </Link>
                  </div>
                )}
              </div>

              <div className={styles.inputGroup}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ margin: 0 }}>Accessory Overview & Description</label>
                  <button
                    type="button"
                    onClick={handleGenerateAiDescription}
                    disabled={isGeneratingAi}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'linear-gradient(135deg, #10B981, #059669)',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '5px 12px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: isGeneratingAi ? 'not-allowed' : 'pointer',
                      boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Sparkles size={13} />
                    {isGeneratingAi ? 'Generating AI Description...' : '✨ Generate with AI'}
                  </button>
                </div>
                <textarea 
                  placeholder="Material quality, device compatibility, key features..." 
                  value={newProductDescription} 
                  onChange={(e) => setNewProductDescription(e.target.value)} 
                  rows={4}
                />
              </div>

              {/* Dynamic Variant Manager */}
              <div style={{ marginTop: '14px', marginBottom: '14px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 700 }}>
                    Variant Stock Levels & Color Options ({variantStockRows.length} Variants)
                  </label>
                  <button type="button" onClick={handleAddVariantRow} className="btn btnPrimary" style={{ fontSize: '11px', padding: '4px 10px' }}>
                    + Add Variant Row
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {variantStockRows.map((row) => (
                    <div key={row.id} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', padding: '10px', background: 'var(--bg-primary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                      <div style={{ flex: '1 1 120px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 600 }}>Color Option</span>
                        <input 
                          type="text" 
                          placeholder="e.g. Matte Black" 
                          value={row.color} 
                          onChange={(e) => handleUpdateVariantRow(row.id, 'color', e.target.value)}
                          style={{ padding: '6px', fontSize: '12px', width: '100%' }}
                        />
                      </div>
                      <div style={{ flex: '0 0 90px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 600 }}>Price (₹)</span>
                        <input 
                          type="number" 
                          value={row.price !== undefined ? row.price : ''} 
                          onChange={(e) => handleUpdateVariantRow(row.id, 'price', parseFloat(e.target.value) || 0)}
                          style={{ padding: '6px', fontSize: '12px', width: '100%' }}
                        />
                      </div>
                      <div style={{ flex: '0 0 90px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 600 }}>Disc. Price (₹)</span>
                        <input 
                          type="number" 
                          value={row.discountPrice !== undefined ? row.discountPrice : ''} 
                          onChange={(e) => handleUpdateVariantRow(row.id, 'discountPrice', parseFloat(e.target.value) || 0)}
                          style={{ padding: '6px', fontSize: '12px', width: '100%' }}
                        />
                      </div>
                      <div style={{ flex: '0 0 70px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 600 }}>Stock</span>
                        <input 
                          type="number" 
                          value={row.stock} 
                          onChange={(e) => handleUpdateVariantRow(row.id, 'stock', parseInt(e.target.value) || 0)}
                          style={{ padding: '6px', fontSize: '12px', width: '100%' }}
                        />
                      </div>
                      <div style={{ flex: '1 1 150px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 600 }}>Color Image</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => handleLocalFileUpload(e, (url) => handleUpdateVariantRow(row.id, 'image', url))}
                            style={{ fontSize: '11px' }}
                          />
                          {row.image && (
                            <img src={row.image} alt="Color Variant" style={{ width: '28px', height: '28px', objectFit: 'cover', borderRadius: '4px' }} />
                          )}
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveVariantRow(row.id)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn btnPrimary" style={{ width: '100%', marginTop: '12px', background: '#10b981' }}>
                Add Accessory to Catalog
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmTarget && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '420px', textAlign: 'center', background: 'var(--card-bg)' }}>
            <h3>Confirm Removal</h3>
            <p>Are you sure you want to remove <strong>{deleteConfirmTarget.prodName}</strong>?</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '16px' }}>
              <button onClick={() => setDeleteConfirmTarget(null)} className="btn btnSecondary">Cancel</button>
              <button onClick={confirmExecuteRemoveAccessory} className="btn btnPrimary" style={{ background: '#ef4444' }}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
