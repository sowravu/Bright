'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { useToast } from '../../../context/ToastContext';
import { Building2, Plus, Trash2, Edit3, X, Search, CheckCircle2, Sparkles, Wand2 } from 'lucide-react';
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

  // AI Logo Prompt Modal State
  const [showAiPromptModal, setShowAiPromptModal] = useState<{ target: 'new' | 'edit'; brandName: string } | null>(null);
  const [aiCustomPrompt, setAiCustomPrompt] = useState('');
  const [generatingAiLogo, setGeneratingAiLogo] = useState(false);

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
          showToast(`Logo "${file.name}" loaded from computer!`, 'success');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const openAiPromptModal = (target: 'new' | 'edit') => {
    const bName = target === 'new' ? newBrandName.trim() : editBrandName.trim();
    if (!bName) {
      showToast('Please type a Brand Name first before opening AI Generator!', 'warning');
      return;
    }
    setShowAiPromptModal({ target, brandName: bName });
    setAiCustomPrompt(`Official ${bName} vector logo`);
  };

  const handleExecuteGenerateAiLogo = async () => {
    if (!showAiPromptModal) return;
    const { target, brandName } = showAiPromptModal;

    setGeneratingAiLogo(true);
    try {
      const res = await fetch('http://localhost:5000/api/brands/ai-logo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify({
          name: brandName,
          prompt: aiCustomPrompt
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.logo) {
          if (target === 'new') {
            setNewBrandLogo(data.logo);
          } else {
            setEditBrandLogo(data.logo);
          }
          showToast(`✨ Generated AI Logo for "${brandName}" via Gemini API!`, 'success');
          setShowAiPromptModal(null);
        } else {
          showToast('Could not generate AI logo', 'error');
        }
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.message || 'AI logo generation failed', 'error');
      }
    } catch (_) {
      showToast('Network error generating AI logo', 'error');
    } finally {
      setGeneratingAiLogo(false);
    }
  };

  const handleAddBrandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newBrandName.trim();
    if (!trimmed) return;

    try {
      const res = await fetch('http://localhost:5000/api/brands', {
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
      });

      if (res.ok) {
        showToast(`Brand "${trimmed}" added successfully!`, 'success');
        await fetchDbBrands();
        setNewBrandName('');
        setNewBrandDesc('');
        setNewBrandLogo('');
        setShowAddBrandModal(false);
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.message || 'Failed to add brand', 'error');
      }
    } catch (_) {
      showToast('Error adding brand', 'error');
    }
  };

  const handleEditBrandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrand || !editBrandName.trim()) return;

    try {
      const res = await fetch(`http://localhost:5000/api/brands/${editingBrand.id}`, {
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
      });

      if (res.ok) {
        showToast(`Brand "${editBrandName.trim()}" logo & info saved to MongoDB!`, 'success');
        await fetchDbBrands();
        setEditingBrand(null);
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.message || 'Failed to save brand changes', 'error');
      }
    } catch (_) {
      showToast('Error saving brand changes', 'error');
    }
  };

  const confirmExecuteRemoveBrand = async () => {
    if (!deleteBrandTarget) return;

    try {
      const res = await fetch(`http://localhost:5000/api/brands/${deleteBrandTarget.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${auth.token}` }
      });

      if (res.ok) {
        showToast(`Brand "${deleteBrandTarget.name}" removed from directory.`, 'info');
        await fetchDbBrands();
      }
    } catch (_) {
      showToast('Error deleting brand', 'error');
    } finally {
      setDeleteBrandTarget(null);
    }
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
                  Manage official manufacturer partners, Gemini AI prompt-generated logos, and brand profiles.
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
                  background: '#ffffff', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  overflow: 'hidden', 
                  border: '1px solid var(--border-color)',
                  padding: '6px',
                  flexShrink: 0
                }}>
                  {b.logo ? (
                    <img 
                      src={b.logo} 
                      alt={b.name} 
                      onError={(e) => {
                        const initials = b.name ? b.name.substring(0, 2).toUpperCase() : 'BR';
                        e.currentTarget.src = `data:image/svg+xml;utf8,${encodeURIComponent(
                          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" rx="40" fill="#a855f7"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="70" fill="#fff">${initials}</text></svg>`
                        )}`;
                      }}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                    />
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
          <div className={styles.modalContent} style={{ maxWidth: '540px', background: 'var(--card-bg)' }}>
            <div className={styles.modalHeader}>
              <h2>Add Brand Partner to MongoDB</h2>
              <button onClick={() => setShowAddBrandModal(false)} className={styles.modalClose}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddBrandSubmit} className={styles.formFields}>
              <div className={styles.inputGroup}>
                <label>Brand Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Google, Samsung, Xiaomi, Motorola" 
                  value={newBrandName} 
                  onChange={(e) => setNewBrandName(e.target.value)} 
                  required 
                />
              </div>

              <div className={styles.inputGroup}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ margin: 0 }}>Brand Logo Image</label>
                  <button
                    type="button"
                    onClick={() => openAiPromptModal('new')}
                    style={{
                      background: 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '5px 12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      boxShadow: '0 2px 8px rgba(168, 85, 247, 0.3)'
                    }}
                  >
                    <Sparkles size={12} /> ✨ Prompt Gemini AI Logo
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => handleLocalFileUpload(e, setNewBrandLogo)}
                  />
                  <input 
                    type="text" 
                    placeholder="Or paste direct image URL (https://...)" 
                    value={newBrandLogo.startsWith('data:') ? '' : newBrandLogo} 
                    onChange={(e) => setNewBrandLogo(e.target.value)}
                  />
                </div>
                {newBrandLogo && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                    <img src={newBrandLogo} alt="Brand Logo Preview" style={{ width: '56px', height: '56px', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--border-color)', background: '#fff', padding: '4px' }} />
                    <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 700 }}>✓ Logo image loaded</span>
                  </div>
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
          <div className={styles.modalContent} style={{ maxWidth: '540px', background: 'var(--card-bg)' }}>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ margin: 0 }}>Brand Logo Image</label>
                  <button
                    type="button"
                    onClick={() => openAiPromptModal('edit')}
                    style={{
                      background: 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '5px 12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      boxShadow: '0 2px 8px rgba(168, 85, 247, 0.3)'
                    }}
                  >
                    <Sparkles size={12} /> ✨ Prompt Gemini AI Logo
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => handleLocalFileUpload(e, setEditBrandLogo)}
                  />
                  <input 
                    type="text" 
                    placeholder="Or paste direct image URL (https://...)" 
                    value={editBrandLogo.startsWith('data:') ? '' : editBrandLogo} 
                    onChange={(e) => setEditBrandLogo(e.target.value)}
                  />
                </div>
                {editBrandLogo && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                    <img src={editBrandLogo} alt="Brand Logo Preview" style={{ width: '56px', height: '56px', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--border-color)', background: '#fff', padding: '4px' }} />
                    <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 700 }}>✓ Logo image loaded</span>
                  </div>
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

      {/* Interactive Gemini AI Logo Prompt Modal */}
      {showAiPromptModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '480px', background: 'var(--card-bg)' }}>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} style={{ color: '#a855f7' }} />
                <h2 style={{ fontSize: '18px', margin: 0 }}>Gemini AI Logo Generator Prompt</h2>
              </div>
              <button onClick={() => setShowAiPromptModal(null)} className={styles.modalClose}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '8px' }}>
              <p style={{ fontSize: '13px', color: 'var(--foreground-secondary)', margin: 0 }}>
                Specify what logo you want for <strong>{showAiPromptModal.brandName}</strong>. Type your exact prompt or choose a preset option below:
              </p>

              <div className={styles.inputGroup}>
                <label>Custom AI Prompt Instructions</label>
                <input 
                  type="text" 
                  value={aiCustomPrompt} 
                  onChange={(e) => setAiCustomPrompt(e.target.value)}
                  placeholder="e.g. Official Samsung blue vector text logo, or 3D gold emblem..."
                  style={{ width: '100%', fontWeight: 600 }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--foreground-secondary)', display: 'block', marginBottom: '8px' }}>
                  Quick Preset Prompt Chips:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {[
                    `Official ${showAiPromptModal.brandName} vector logo`,
                    `3D glassmorphic modern tech emblem`,
                    `Minimalist neon vector icon`,
                    `Luxury 3D gold metallic badge`
                  ].map((preset, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => setAiCustomPrompt(preset)}
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '6px 12px',
                        borderRadius: '20px',
                        border: aiCustomPrompt === preset ? '1px solid #a855f7' : '1px solid var(--border-color)',
                        background: aiCustomPrompt === preset ? 'rgba(168, 85, 247, 0.12)' : 'var(--bg-secondary)',
                        color: aiCustomPrompt === preset ? '#a855f7' : 'var(--foreground)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '14px' }}>
                <button onClick={() => setShowAiPromptModal(null)} className="btn btnSecondary" style={{ fontSize: '13px' }}>
                  Cancel
                </button>
                <button 
                  onClick={handleExecuteGenerateAiLogo} 
                  disabled={generatingAiLogo}
                  className="btn btnPrimary" 
                  style={{ fontSize: '13px', background: 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Wand2 size={15} />
                  {generatingAiLogo ? 'Generating Logo...' : '✨ Generate AI Logo'}
                </button>
              </div>
            </div>
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
