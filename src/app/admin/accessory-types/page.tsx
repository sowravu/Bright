'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { useToast } from '../../../context/ToastContext';
import { Layers, Plus, Trash2, Edit3, X, Search, CheckCircle2, Loader2 } from 'lucide-react';
import styles from '../admin.module.css';
import { compressImageFile } from '../../../utils/imageCompressor';

export default function AccessoryTypesAdminPage() {
  const auth = useSelector((state: RootState) => state.auth);
  const { showToast } = useToast();

  const [accessoryTypesList, setAccessoryTypesList] = useState<any[]>([]);
  const [typeSearchQuery, setTypeSearchQuery] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeIcon, setNewTypeIcon] = useState('');
  const [newTypeDesc, setNewTypeDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingType, setEditingType] = useState<any | null>(null);
  const [editTypeName, setEditTypeName] = useState('');
  const [editTypeIcon, setEditTypeIcon] = useState('');
  const [editTypeDesc, setEditTypeDesc] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  const fetchDbAccessoryTypes = async () => {
    try {
      const res = await fetch('/api/accessory-types');
      if (res.ok) {
        const data = await res.json();
        const list = data.accessoryTypes || (Array.isArray(data) ? data : []);
        setAccessoryTypesList(list.map((t: any) => ({
          id: t._id || t.id,
          _id: t._id || t.id,
          name: t.name,
          slug: t.slug || t.name.toLowerCase().replace(/\s+/g, '-'),
          icon: t.icon || '',
          description: t.description || '',
          isActive: t.isActive !== false,
        })));
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchDbAccessoryTypes();
  }, []);

  const handleLocalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImageFile(file, 600, 0.85);
        callback(compressedBase64);
        showToast(`Icon image "${file.name}" compressed and selected!`, 'success');
      } catch (_) {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            callback(reader.result);
            showToast(`Icon image "${file.name}" selected from computer!`, 'success');
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleAddTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    const trimmed = newTypeName.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/accessory-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: trimmed,
          description: newTypeDesc,
          icon: newTypeIcon
        })
      });

      if (res.ok) {
        showToast(`Accessory Type "${trimmed}" created successfully!`, 'success');
        await fetchDbAccessoryTypes();
        setNewTypeName('');
        setNewTypeDesc('');
        setNewTypeIcon('');
        setShowAddModal(false);
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.message || 'Failed to create accessory type', 'error');
      }
    } catch (_) {
      showToast('Network error creating accessory type', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!editingType || !editTypeName.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/accessory-types/${editingType.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editTypeName.trim(),
          description: editTypeDesc,
          icon: editTypeIcon
        })
      });

      if (res.ok) {
        showToast(`Accessory Type "${editTypeName.trim()}" updated successfully!`, 'success');
        await fetchDbAccessoryTypes();
        setEditingType(null);
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.message || 'Failed to update accessory type', 'error');
      }
    } catch (_) {
      showToast('Network error updating accessory type', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmExecuteRemoveType = () => {
    if (!deleteTarget) return;

    fetch(`/api/accessory-types/${deleteTarget.id}`, {
      method: 'DELETE',
    })
      .then(() => fetchDbAccessoryTypes())
      .catch(() => {});

    showToast(`Accessory Type "${deleteTarget.name}" removed from MongoDB.`, 'info');
    setDeleteTarget(null);
  };

  const filteredTypes = accessoryTypesList.filter(t => 
    t.name.toLowerCase().includes(typeSearchQuery.toLowerCase()) ||
    t.slug.toLowerCase().includes(typeSearchQuery.toLowerCase()) ||
    (t.description && t.description.toLowerCase().includes(typeSearchQuery.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Bar */}
      <div className={styles.tableCard} style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius-md)', padding: '24px', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Layers size={24} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em' }}>Accessory Types</h2>
                <span style={{ fontSize: '13px', color: 'var(--foreground-secondary)' }}>
                  Manage subcategory types (e.g. Backcovers, Chargers, Headphones, Power Banks, Screen Guards).
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, padding: '6px 14px', borderRadius: 'var(--radius-full)', background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
              {accessoryTypesList.length} Types Configured
            </span>
            <button 
              onClick={() => setShowAddModal(true)}
              className="btn btnPrimary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '13px', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)' }}
            >
              <Plus size={16} /> Add Accessory Type
            </button>
          </div>
        </div>

        {/* Filter Search Input */}
        <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '450px' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--foreground-secondary)' }} />
            <input 
              type="text" 
              placeholder="Search accessory types by name, slug, or description..." 
              value={typeSearchQuery} 
              onChange={(e) => setTypeSearchQuery(e.target.value)}
              className={styles.searchInput}
              style={{ paddingLeft: '42px', width: '100%' }}
            />
          </div>
        </div>
      </div>

      {/* Accessory Types Cards Grid */}
      {filteredTypes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', background: 'var(--card-bg)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)' }}>
          <Layers size={44} style={{ color: 'var(--foreground-secondary)', marginBottom: '12px', opacity: 0.6 }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 6px 0' }}>No Accessory Types Found</h3>
          <p style={{ fontSize: '13px', color: 'var(--foreground-secondary)', margin: 0 }}>
            {typeSearchQuery ? 'No type matches your search query.' : 'Click "+ Add Accessory Type" to create your first subcategory!'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {filteredTypes.map((t) => (
            <div 
              key={t.id} 
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
                  {t.icon ? (
                    <img src={t.icon} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Layers size={26} style={{ color: '#3b82f6' }} />
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: 'var(--foreground)', textTransform: 'capitalize' }}>
                      {t.name}
                    </h3>
                  </div>
                  <span style={{ display: 'inline-block', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', marginTop: '4px' }}>
                    slug: {t.slug}
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--foreground-secondary)', margin: 0, lineHeight: '1.5', minHeight: '38px' }}>
                {t.description || 'Accessory subcategory type in MongoDB catalog.'}
              </p>

              <div style={{ display: 'flex', gap: '10px', paddingTop: '14px', borderTop: '1px solid var(--border-color)' }}>
                <button 
                  onClick={() => { setEditingType(t); setEditTypeName(t.name); setEditTypeIcon(t.icon || ''); setEditTypeDesc(t.description || ''); }}
                  className="btn btnSecondary"
                  style={{ flex: 1, fontSize: '12px', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Edit3 size={14} /> Edit Category
                </button>
                <button 
                  onClick={() => setDeleteTarget(t)}
                  className="btn btnSecondary"
                  style={{ fontSize: '12px', padding: '8px 12px', color: '#ef4444', borderColor: '#fca5a5' }}
                  title="Remove Type"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Accessory Type Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '520px', background: 'var(--card-bg)' }}>
            <div className={styles.modalHeader}>
              <h2>Add New Accessory Type</h2>
              <button onClick={() => setShowAddModal(false)} className={styles.modalClose}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddTypeSubmit} className={styles.formFields}>
              <div className={styles.inputGroup}>
                <label>Accessory Type Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Earbuds, Power Bank, Screen Guard" 
                  value={newTypeName} 
                  onChange={(e) => setNewTypeName(e.target.value)} 
                  required 
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Category Icon / Image (Upload from Computer)</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handleLocalFileUpload(e, setNewTypeIcon)}
                />
                {newTypeIcon && (
                  <img src={newTypeIcon} alt="Type Icon Preview" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', marginTop: '8px' }} />
                )}
              </div>

              <div className={styles.inputGroup}>
                <label>Type Overview & Description</label>
                <textarea 
                  placeholder="Overview description for this accessory category..." 
                  value={newTypeDesc} 
                  onChange={(e) => setNewTypeDesc(e.target.value)} 
                  rows={3}
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="btn btnPrimary" 
                style={{ 
                  width: '100%', 
                  marginTop: '12px', 
                  background: isSubmitting ? '#93c5fd' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="spinner" />
                    Adding Type...
                  </>
                ) : (
                  'Add Accessory Type to MongoDB'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Accessory Type Modal */}
      {editingType && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '520px', background: 'var(--card-bg)' }}>
            <div className={styles.modalHeader}>
              <h2>Edit Accessory Type: {editingType.name}</h2>
              <button onClick={() => setEditingType(null)} className={styles.modalClose}><X size={20} /></button>
            </div>
            <form onSubmit={handleEditTypeSubmit} className={styles.formFields}>
              <div className={styles.inputGroup}>
                <label>Accessory Type Name</label>
                <input 
                  type="text" 
                  value={editTypeName} 
                  onChange={(e) => setEditTypeName(e.target.value)} 
                  required 
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Category Icon / Image (Upload New Image)</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handleLocalFileUpload(e, setEditTypeIcon)}
                />
                {editTypeIcon && (
                  <img src={editTypeIcon} alt="Type Icon Preview" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', marginTop: '8px' }} />
                )}
              </div>

              <div className={styles.inputGroup}>
                <label>Type Overview & Description</label>
                <textarea 
                  value={editTypeDesc} 
                  onChange={(e) => setEditTypeDesc(e.target.value)} 
                  rows={3}
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="btn btnPrimary" 
                style={{ 
                  width: '100%', 
                  marginTop: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="spinner" />
                    Saving Changes...
                  </>
                ) : (
                  'Save Accessory Type Changes'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '420px', textAlign: 'center', background: 'var(--card-bg)' }}>
            <h3>Confirm Removal</h3>
            <p>Are you sure you want to remove <strong>{deleteTarget.name}</strong> from accessory types?</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '16px' }}>
              <button onClick={() => setDeleteTarget(null)} className="btn btnSecondary">Cancel</button>
              <button onClick={confirmExecuteRemoveType} className="btn btnPrimary" style={{ background: '#ef4444' }}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
