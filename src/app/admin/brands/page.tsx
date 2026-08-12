'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { useToast } from '../../../context/ToastContext';
import { Building2, Plus, Trash2, Edit3, X, Search, CheckCircle2 } from 'lucide-react';
import styles from '../admin.module.css';

export default function BrandsAdminPage() {
  const auth = useSelector((state: RootState) => state.auth);
  const { showToast } = useToast();

  const [brandsDetailList, setBrandsDetailList] = useState<any[]>([]);
  const [brandSearchQuery, setBrandSearchQuery] = useState('');
  const [showAddBrandModal, setShowAddBrandModal] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandLogo, setNewBrandLogo] = useState('');
  const [newBrandDesc, setNewBrandDesc] = useState('');

  const [editingBrand, setEditingBrand] = useState<any | null>(null);
  const [editBrandName, setEditBrandName] = useState('');
  const [editBrandLogo, setEditBrandLogo] = useState('');
  const [editBrandDesc, setEditBrandDesc] = useState('');
  const [deleteBrandTarget, setDeleteBrandTarget] = useState<any | null>(null);

  const fetchDbBrands = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/brands');
      if (res.ok) {
        const data = await res.json();
        const bList = data.brands || (Array.isArray(data) ? data : []);
        setBrandsDetailList(bList.map((b: any) => ({
          id: b._id || b.id,
          name: b.name,
          logo: b.logo || '',
          description: b.description || ''
        })));
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchDbBrands();
  }, []);

  const handleLocalFileUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          callback(reader.result);
          showToast(`Logo "${file.name}" selected from computer!`, 'success');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddBrandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newBrandName.trim();
    if (!trimmed) return;

    fetch('http://localhost:5000/api/brands', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.token}`
      },
      body: JSON.stringify({
        name: trimmed,
        description: newBrandDesc,
        logo: newBrandLogo
      })
    }).then(() => fetchDbBrands()).catch(() => {});

    showToast(`Brand "${trimmed}" added successfully!`, 'success');
    setNewBrandName('');
    setNewBrandDesc('');
    setNewBrandLogo('');
    setShowAddBrandModal(false);
  };

  const handleEditBrandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrand || !editBrandName.trim()) return;

    fetch(`http://localhost:5000/api/brands/${editingBrand.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.token}`
      },
      body: JSON.stringify({
        name: editBrandName.trim(),
        description: editBrandDesc,
        logo: editBrandLogo
      })
    }).then(() => fetchDbBrands()).catch(() => {});

    showToast(`Brand "${editBrandName.trim()}" updated successfully!`, 'success');
    setEditingBrand(null);
  };

  const confirmExecuteRemoveBrand = () => {
    if (!deleteBrandTarget) return;

    fetch(`http://localhost:5000/api/brands/${deleteBrandTarget.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${auth.token}` }
    }).then(() => fetchDbBrands()).catch(() => {});

    showToast(`Brand "${deleteBrandTarget.name}" removed from directory.`, 'info');
    setDeleteBrandTarget(null);
  };

  const filteredBrands = brandsDetailList.filter(b => 
    b.name.toLowerCase().includes(brandSearchQuery.toLowerCase()) ||
    (b.description && b.description.toLowerCase().includes(brandSearchQuery.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Bar */}
      <div className={styles.tableCard} style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius-md)', padding: '24px', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.12)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={24} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em' }}>Brands Directory</h2>
                <span style={{ fontSize: '13px', color: 'var(--foreground-secondary)' }}>
                  Manage official manufacturer partners, logos, and brand profiles.
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, padding: '6px 14px', borderRadius: 'var(--radius-full)', background: 'rgba(168, 85, 247, 0.12)', color: '#a855f7' }}>
              {brandsDetailList.length} Active Partners
            </span>
            <button 
              onClick={() => setShowAddBrandModal(true)}
              className="btn btnPrimary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '13px', background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)', boxShadow: '0 4px 14px rgba(168, 85, 247, 0.35)' }}
            >
              <Plus size={16} /> Add Brand Partner
            </button>
          </div>
        </div>

        {/* Filter Search Input */}
        <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '450px' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--foreground-secondary)' }} />
            <input 
              type="text" 
              placeholder="Search brand partners by name or description..." 
              value={brandSearchQuery} 
              onChange={(e) => setBrandSearchQuery(e.target.value)}
              className={styles.searchInput}
              style={{ paddingLeft: '42px', width: '100%' }}
            />
          </div>
        </div>
      </div>

      {/* Brand Cards Grid */}
      {filteredBrands.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', background: 'var(--card-bg)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)' }}>
          <Building2 size={44} style={{ color: 'var(--foreground-secondary)', marginBottom: '12px', opacity: 0.6 }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 6px 0' }}>No Brand Partners Found</h3>
          <p style={{ fontSize: '13px', color: 'var(--foreground-secondary)', margin: 0 }}>
            {brandSearchQuery ? 'No brand matches your search filter.' : 'Click "+ Add Brand Partner" to add your first official brand to MongoDB!'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {filteredBrands.map((b) => (
            <div 
              key={b.id} 
              style={{ 
                background: 'var(--card-bg)', 
                padding: '20px', 
                borderRadius: 'var(--radius-md)', 
                border: '1px solid var(--border-color)', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between', 
                gap: '16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                transition: 'all 0.25s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <div style={{ 
                  width: '56px', 
                  height: '56px', 
                  borderRadius: '12px', 
                  background: 'var(--bg-secondary)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  overflow: 'hidden', 
                  border: '1px solid var(--border-color)',
                  flexShrink: 0
                }}>
                  {b.logo ? (
                    <img src={b.logo} alt={b.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Building2 size={26} style={{ color: '#a855f7' }} />
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: 'var(--foreground)', textTransform: 'capitalize' }}>
                      {b.name}
                    </h3>
                  </div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#10b981', fontWeight: 700, marginTop: '4px' }}>
                    <CheckCircle2 size={12} /> Active Brand Partner
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--foreground-secondary)', margin: 0, lineHeight: '1.5', minHeight: '38px' }}>
                {b.description || 'Official brand manufacturer partner in MongoDB catalog.'}
              </p>

              <div style={{ display: 'flex', gap: '10px', paddingTop: '14px', borderTop: '1px solid var(--border-color)' }}>
                <button 
                  onClick={() => { setEditingBrand(b); setEditBrandName(b.name); setEditBrandLogo(b.logo || ''); setEditBrandDesc(b.description || ''); }}
                  className="btn btnSecondary"
                  style={{ flex: 1, fontSize: '12px', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Edit3 size={14} /> Edit Partner
                </button>
                <button 
                  onClick={() => setDeleteBrandTarget(b)}
                  className="btn btnSecondary"
                  style={{ fontSize: '12px', padding: '8px 12px', color: '#ef4444', borderColor: '#fca5a5' }}
                  title="Remove Brand"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Brand Modal */}
      {showAddBrandModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '520px', background: 'var(--card-bg)' }}>
            <div className={styles.modalHeader}>
              <h2>Add Brand Partner to MongoDB</h2>
              <button onClick={() => setShowAddBrandModal(false)} className={styles.modalClose}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddBrandSubmit} className={styles.formFields}>
              <div className={styles.inputGroup}>
                <label>Brand Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Google, Samsung, Xiaomi" 
                  value={newBrandName} 
                  onChange={(e) => setNewBrandName(e.target.value)} 
                  required 
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Brand Logo (Upload from Computer)</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handleLocalFileUpload(e, setNewBrandLogo)}
                />
                {newBrandLogo && (
                  <img src={newBrandLogo} alt="Brand Logo Preview" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', marginTop: '8px' }} />
                )}
              </div>

              <div className={styles.inputGroup}>
                <label>Brand Overview & Description</label>
                <textarea 
                  placeholder="Brand summary, manufacturer info, specialty..." 
                  value={newBrandDesc} 
                  onChange={(e) => setNewBrandDesc(e.target.value)} 
                  rows={3}
                />
              </div>

              <button type="submit" className="btn btnPrimary" style={{ width: '100%', marginTop: '12px', background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)' }}>
                Add Brand to MongoDB Catalog
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Brand Modal */}
      {editingBrand && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '520px', background: 'var(--card-bg)' }}>
            <div className={styles.modalHeader}>
              <h2>Edit Brand: {editingBrand.name}</h2>
              <button onClick={() => setEditingBrand(null)} className={styles.modalClose}><X size={20} /></button>
            </div>
            <form onSubmit={handleEditBrandSubmit} className={styles.formFields}>
              <div className={styles.inputGroup}>
                <label>Brand Name</label>
                <input 
                  type="text" 
                  value={editBrandName} 
                  onChange={(e) => setEditBrandName(e.target.value)} 
                  required 
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Brand Logo (Upload New Logo)</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handleLocalFileUpload(e, setEditBrandLogo)}
                />
                {editBrandLogo && (
                  <img src={editBrandLogo} alt="Brand Logo Preview" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', marginTop: '8px' }} />
                )}
              </div>

              <div className={styles.inputGroup}>
                <label>Brand Overview & Description</label>
                <textarea 
                  value={editBrandDesc} 
                  onChange={(e) => setEditBrandDesc(e.target.value)} 
                  rows={3}
                />
              </div>

              <button type="submit" className="btn btnPrimary" style={{ width: '100%', marginTop: '12px' }}>
                Save Brand Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Brand Modal */}
      {deleteBrandTarget && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '420px', textAlign: 'center', background: 'var(--card-bg)' }}>
            <h3>Confirm Removal</h3>
            <p>Are you sure you want to remove <strong>{deleteBrandTarget.name}</strong> from your brand directory?</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '16px' }}>
              <button onClick={() => setDeleteBrandTarget(null)} className="btn btnSecondary">Cancel</button>
              <button onClick={confirmExecuteRemoveBrand} className="btn btnPrimary" style={{ background: '#ef4444' }}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
