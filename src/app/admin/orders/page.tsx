'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { 
  ShoppingBag, Truck, CheckCircle, Clock, Save, MapPin, 
  Search, RefreshCw, Copy, Check, Filter, Calendar, 
  CreditCard, X, ChevronRight, User, Package, AlertCircle, AlertOctagon
} from 'lucide-react';
import styles from './orders.module.css';
import { useToast } from '../../../context/ToastContext';

export default function OrdersAdminPage() {
  const auth = useSelector((state: RootState) => state.auth);
  const { showToast } = useToast();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('All');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');

  // Selected Order for Modal Details
  const [detailOrder, setDetailOrder] = useState<any | null>(null);

  // Copy Feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Editable delivery dates for orders
  const [deliveryDates, setDeliveryDates] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchOrders();
  }, [auth.token]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/admin/orders', {
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
        const datesMap: Record<string, string> = {};
        data.forEach((o: any) => {
          datesMap[o._id] = o.estimatedDeliveryDate || '';
        });
        setDeliveryDates(datesMap);
      }
    } catch (_) {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const estDate = deliveryDates[orderId] || '';
      const res = await fetch(`http://localhost:5000/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify({
          orderStatus: newStatus,
          estimatedDeliveryDate: estDate,
          deliveredAt: newStatus === 'Delivered' ? new Date().toISOString() : undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? data.order : o))
        );
        if (detailOrder && detailOrder._id === orderId) {
          setDetailOrder(data.order);
        }
        showToast(`Order status updated to "${newStatus}"!`, 'success');
      } else {
        const err = await res.json();
        showToast(err.message || 'Failed to update order status', 'error');
      }
    } catch (_) {
      showToast('Network error updating order status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveDeliveryDate = async (orderId: string) => {
    setUpdatingId(orderId);
    try {
      const estDate = deliveryDates[orderId] || '';
      const res = await fetch(`http://localhost:5000/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify({
          estimatedDeliveryDate: estDate
        })
      });

      if (res.ok) {
        const data = await res.json();
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? data.order : o))
        );
        showToast('Estimated delivery date saved!', 'success');
      } else {
        showToast('Failed to save delivery date', 'error');
      }
    } catch (_) {
      showToast('Error saving delivery date', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleQuickPresetDate = (orderId: string, daysAhead: number) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysAhead);
    const dateStr = targetDate.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    setDeliveryDates({ ...deliveryDates, [orderId]: dateStr });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Order ID copied to clipboard!', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Analytics KPIs
  const totalRevenue = useMemo(() => {
    return orders.reduce((sum, o) => sum + (o.totalAmount || o.subtotal || 0), 0);
  }, [orders]);

  const pendingCount = useMemo(() => {
    return orders.filter((o) => o.orderStatus === 'Processing' || o.orderStatus === 'Confirmed').length;
  }, [orders]);

  const deliveredCount = useMemo(() => {
    return orders.filter((o) => o.orderStatus === 'Delivered').length;
  }, [orders]);

  const statusOptions = ['Processing', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'Processing':
        return { background: 'rgba(234, 179, 8, 0.15)', color: '#d97706', border: '1px solid rgba(234, 179, 8, 0.3)' };
      case 'Confirmed':
        return { background: 'rgba(59, 130, 246, 0.15)', color: '#2563eb', border: '1px solid rgba(59, 130, 246, 0.3)' };
      case 'Shipped':
        return { background: 'rgba(168, 85, 247, 0.15)', color: '#9333ea', border: '1px solid rgba(168, 85, 247, 0.3)' };
      case 'Out for Delivery':
        return { background: 'rgba(249, 115, 22, 0.15)', color: '#ea580c', border: '1px solid rgba(249, 115, 22, 0.3)' };
      case 'Delivered':
        return { background: 'rgba(34, 197, 94, 0.15)', color: '#16a34a', border: '1px solid rgba(34, 197, 94, 0.3)' };
      case 'Cancelled':
        return { background: 'rgba(239, 68, 68, 0.15)', color: '#dc2626', border: '1px solid rgba(239, 68, 68, 0.3)' };
      default:
        return { background: 'rgba(100, 116, 139, 0.15)', color: '#475569', border: '1px solid rgba(100, 116, 139, 0.3)' };
    }
  };

  // Filter & Search Logic
  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) => {
        // Tab Filter
        if (selectedTab !== 'All' && (o.orderStatus || 'Processing') !== selectedTab) {
          return false;
        }
        // Search Query
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const orderIdMatch = (o.orderNumber || '').toLowerCase().includes(q) || (o._id || '').toLowerCase().includes(q);
        const nameMatch = (o.user?.name || o.shippingAddress?.fullName || '').toLowerCase().includes(q);
        const emailMatch = (o.user?.email || '').toLowerCase().includes(q);
        const phoneMatch = (o.user?.phone || o.shippingAddress?.phone || '').toLowerCase().includes(q);
        const cityMatch = (o.shippingAddress?.city || '').toLowerCase().includes(q);
        const itemMatch = o.items?.some((i: any) => (i.name || '').toLowerCase().includes(q));

        return orderIdMatch || nameMatch || emailMatch || phoneMatch || cityMatch || itemMatch;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (sortBy === 'highest') return (b.totalAmount || b.subtotal || 0) - (a.totalAmount || a.subtotal || 0);
        if (sortBy === 'lowest') return (a.totalAmount || a.subtotal || 0) - (b.totalAmount || b.subtotal || 0);
        return 0;
      });
  }, [orders, selectedTab, searchQuery, sortBy]);

  const getInitials = (name: string) => {
    if (!name) return 'CU';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  };

  return (
    <div className={styles.container}>
      {/* Header Banner */}
      <div className={styles.headerCard}>
        <div>
          <h2 className={styles.headerTitle}>
            <ShoppingBag size={28} color="#2563eb" />
            Customer Orders Management
          </h2>
          <p className={styles.headerSubtitle}>
            Monitor, update fulfillment status, set estimated delivery dates, and handle customer order details in real time.
          </p>
        </div>
        <button onClick={fetchOrders} className={styles.refreshBtn}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          Refresh Orders
        </button>
      </div>

      {/* Analytics KPI Dashboard Grid */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb' }}>
            <ShoppingBag size={24} />
          </div>
          <div>
            <div className={styles.kpiLabel}>Total Orders</div>
            <div className={styles.kpiValue}>{orders.length}</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <CreditCard size={24} />
          </div>
          <div>
            <div className={styles.kpiLabel}>Total Revenue</div>
            <div className={styles.kpiValue}>₹{totalRevenue.toLocaleString('en-IN')}</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: 'rgba(234, 179, 8, 0.1)', color: '#d97706' }}>
            <Clock size={24} />
          </div>
          <div>
            <div className={styles.kpiLabel}>Action Needed</div>
            <div className={styles.kpiValue}>{pendingCount}</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#16a34a' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <div className={styles.kpiLabel}>Completed / Delivered</div>
            <div className={styles.kpiValue}>{deliveredCount}</div>
          </div>
        </div>
      </div>

      {/* Toolbar Search & Status Tabs */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarTop}>
          {/* Search Box */}
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by Order ID, Customer Name, Email, Phone, City, or Product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className={styles.clearSearch}>
                <X size={16} />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground-secondary)' }}>Sort:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--foreground)',
                fontSize: '13px',
                fontWeight: 600,
                outline: 'none'
              }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Amount</option>
              <option value="lowest">Lowest Amount</option>
            </select>
          </div>
        </div>

        {/* Filter Pills Tabs */}
        <div className={styles.filterTabs}>
          {['All', ...statusOptions].map((tab) => {
            const count = tab === 'All' 
              ? orders.length 
              : orders.filter((o) => (o.orderStatus || 'Processing') === tab).length;
            const isActive = selectedTab === tab;

            return (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`${styles.tabBtn} ${isActive ? styles.tabBtnActive : ''}`}
              >
                {tab}
                <span className={styles.tabBadge}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders List / Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--foreground-secondary)' }}>
          <RefreshCw size={28} className="spin" style={{ marginBottom: '12px', color: '#2563eb' }} />
          <div style={{ fontSize: '15px', fontWeight: 600 }}>Loading Customer Orders Dashboard...</div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'var(--card-bg)',
          borderRadius: '16px',
          border: '1px dashed var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
        }}>
          <ShoppingBag size={48} color="#94a3b8" />
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>No Orders Found</h3>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--foreground-secondary)', maxWidth: '400px' }}>
            {searchQuery 
              ? `No customer orders matched your search "${searchQuery}". Try clearing filters.` 
              : `No orders found in category "${selectedTab}".`}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                marginTop: '8px',
                padding: '8px 16px',
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Clear Search Query
            </button>
          )}
        </div>
      ) : (
        <div className={styles.ordersList}>
          {filteredOrders.map((o) => {
            const customerName = o.user?.name || o.shippingAddress?.fullName || 'Customer';
            const customerEmail = o.user?.email || '';
            const customerPhone = o.user?.phone || o.shippingAddress?.phone || '';
            const currentStatus = o.orderStatus || 'Processing';
            const badgeStyle = getStatusBadgeStyle(currentStatus);
            const initials = getInitials(customerName);

            return (
              <div key={o._id || o.id} className={styles.orderCard}>
                {/* Header Bar */}
                <div className={styles.orderCardHeader}>
                  <div className={styles.orderMetaLeft}>
                    <div
                      className={styles.orderIdPill}
                      onClick={() => copyToClipboard(o.orderNumber || o._id, o._id)}
                      title="Click to copy Order ID"
                    >
                      <span>{o.orderNumber || o._id}</span>
                      {copiedId === o._id ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    </div>

                    <div className={styles.orderDate}>
                      <Calendar size={13} />
                      Placed: {new Date(o.createdAt).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      onClick={() => setDetailOrder(o)}
                      style={{
                        background: 'rgba(37, 99, 235, 0.08)',
                        color: '#2563eb',
                        border: '1px solid rgba(37, 99, 235, 0.2)',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      View Details <ChevronRight size={14} />
                    </button>
                  </div>
                </div>

                {/* Body Content Grid */}
                <div className={styles.orderCardBody}>
                  {/* Customer Information */}
                  <div className={styles.customerCol}>
                    <div className={styles.customerProfile}>
                      <div className={styles.avatarCircle}>{initials}</div>
                      <div className={styles.customerInfo}>
                        <div className={styles.customerName}>{customerName}</div>
                        <div className={styles.customerContact}>
                          {customerEmail || 'No email provided'}
                        </div>
                        {customerPhone && (
                          <div className={styles.customerContact}>📞 {customerPhone}</div>
                        )}
                      </div>
                    </div>

                    <div className={styles.addressBox}>
                      <MapPin size={14} style={{ color: '#2563eb', flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong>{o.shippingAddress?.fullName || customerName}</strong> ({o.shippingAddress?.addressLabel || 'Shipping Address'})<br />
                        {o.shippingAddress?.street || ''}, {o.shippingAddress?.city}, {o.shippingAddress?.state} ({o.shippingAddress?.postalCode})
                      </div>
                    </div>
                  </div>

                  {/* Items Ordered List */}
                  <div className={styles.itemsCol}>
                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--foreground-secondary)' }}>
                      Items Ordered ({o.items?.length || 0})
                    </div>

                    <div className={styles.itemList}>
                      {o.items && o.items.length > 0 ? (
                        o.items.map((item: any, iIdx: number) => (
                          <div key={iIdx} className={styles.itemRow}>
                            {item.image ? (
                              <img src={item.image} alt={item.name} className={styles.itemThumb} />
                            ) : (
                              <div className={styles.itemThumb} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Package size={18} color="#94a3b8" />
                              </div>
                            )}

                            <div className={styles.itemMeta}>
                              <div className={styles.itemName}>{item.name}</div>
                              <div className={styles.itemVariantTag}>
                                {item.color && <span className={styles.variantPill}>Color: {item.color}</span>}
                                {(item.ram || item.storage) && (
                                  <span className={styles.variantPill}>
                                    Specs: {item.ram}{item.ram && item.storage ? '/' : ''}{item.storage}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                              <span className={styles.itemQty}>x{item.quantity}</span>
                              <div style={{ fontSize: '12px', fontWeight: 700, marginTop: '4px' }}>
                                ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ fontSize: '12px', color: 'var(--foreground-secondary)' }}>No items detail recorded</div>
                      )}
                    </div>
                  </div>

                  {/* Payment & Actions */}
                  <div className={styles.actionCol}>
                    <div className={styles.amountBox}>
                      <span className={styles.amountTitle}>Net Amount</span>
                      <span className={styles.amountValue}>
                        ₹{(o.totalAmount || o.subtotal || 0).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className={styles.paymentTag}>
                      <CreditCard size={12} />
                      {o.paymentMethod || 'Razorpay'} • {o.paymentStatus || 'Paid'}
                    </div>

                    {/* Delivery Date Control */}
                    <div className={styles.deliveryInputGroup}>
                      <div className={styles.deliveryLabel}>
                        <Truck size={12} />
                        Estimated Delivery Date
                      </div>

                      {currentStatus === 'Delivered' ? (
                        <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle size={14} />
                          Delivered: {o.deliveredAt ? new Date(o.deliveredAt).toLocaleDateString('en-IN') : 'Completed'}
                        </div>
                      ) : (
                        <>
                          <div className={styles.deliveryFlex}>
                            <input
                              type="text"
                              value={deliveryDates[o._id] !== undefined ? deliveryDates[o._id] : (o.estimatedDeliveryDate || '')}
                              onChange={(e) => setDeliveryDates({ ...deliveryDates, [o._id]: e.target.value })}
                              placeholder="e.g. 18 Aug 2026"
                              className={styles.dateInput}
                            />
                            <button
                              onClick={() => handleSaveDeliveryDate(o._id)}
                              disabled={updatingId === o._id}
                              className={styles.saveDateBtn}
                            >
                              <Save size={13} />
                              Save
                            </button>
                          </div>

                          <div className={styles.presetBtns}>
                            <button onClick={() => handleQuickPresetDate(o._id, 1)} className={styles.presetBtn}>
                              Tomorrow
                            </button>
                            <button onClick={() => handleQuickPresetDate(o._id, 3)} className={styles.presetBtn}>
                              +3 Days
                            </button>
                            <button onClick={() => handleQuickPresetDate(o._id, 5)} className={styles.presetBtn}>
                              +5 Days
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Order Status Selector */}
                    <div className={styles.statusSelectGroup}>
                      <div className={styles.deliveryLabel}>Fulfillment Status</div>
                      <select
                        value={currentStatus}
                        onChange={(e) => handleStatusChange(o._id, e.target.value)}
                        disabled={updatingId === o._id}
                        className={styles.statusSelect}
                        style={{ ...badgeStyle }}
                      >
                        {statusOptions.map((opt) => (
                          <option key={opt} value={opt} style={{ background: 'var(--card-bg)', color: 'var(--foreground)', fontWeight: 600 }}>
                            {opt}
                          </option>
                        ))}
                      </select>
                      <div style={{ fontSize: '11px', color: 'var(--foreground-secondary)', textAlign: 'center', marginTop: '2px' }}>
                        {updatingId === o._id ? 'Saving update...' : 'Changes save automatically'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Details Modal Drawer */}
      {detailOrder && (
        <div className={styles.modalBackdrop} onClick={() => setDetailOrder(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
                  Order Details ({detailOrder.orderNumber})
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--foreground-secondary)' }}>
                  Placed on {new Date(detailOrder.createdAt).toLocaleString('en-IN')}
                </span>
              </div>
              <button
                onClick={() => setDetailOrder(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--foreground-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* Status Update Bar inside Modal */}
              <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--foreground-secondary)' }}>CURRENT STATUS</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, marginTop: '2px' }}>
                    {detailOrder.orderStatus}
                  </div>
                </div>

                <select
                  value={detailOrder.orderStatus}
                  onChange={(e) => handleStatusChange(detailOrder._id, e.target.value)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    outline: 'none',
                    ...getStatusBadgeStyle(detailOrder.orderStatus)
                  }}
                >
                  {statusOptions.map((opt) => (
                    <option key={opt} value={opt} style={{ background: 'var(--card-bg)', color: 'var(--foreground)' }}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer & Address Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#2563eb', marginBottom: '6px' }}>
                    <User size={14} style={{ display: 'inline', marginRight: '4px' }} />
                    CUSTOMER INFO
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>
                    {detailOrder.user?.name || detailOrder.shippingAddress?.fullName}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--foreground-secondary)', marginTop: '2px' }}>
                    {detailOrder.user?.email}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--foreground-secondary)' }}>
                    {detailOrder.user?.phone || detailOrder.shippingAddress?.phone}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#2563eb', marginBottom: '6px' }}>
                    <MapPin size={14} style={{ display: 'inline', marginRight: '4px' }} />
                    SHIPPING ADDRESS
                  </div>
                  <div style={{ fontSize: '13px', lineHeight: 1.4 }}>
                    <strong>{detailOrder.shippingAddress?.fullName}</strong><br />
                    {detailOrder.shippingAddress?.street}<br />
                    {detailOrder.shippingAddress?.city}, {detailOrder.shippingAddress?.state} - {detailOrder.shippingAddress?.postalCode}
                  </div>
                </div>
              </div>

              {/* Items Purchased Table */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>
                  Purchased Items ({detailOrder.items?.length || 0})
                </div>

                <div style={{ border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
                  {detailOrder.items?.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        borderBottom: idx < detailOrder.items.length - 1 ? '1px solid var(--border-color)' : 'none',
                        background: 'var(--card-bg)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {item.image && (
                          <img src={item.image} alt={item.name} style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} />
                        )}
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700 }}>{item.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--foreground-secondary)' }}>
                            {item.color} {item.ram ? `(${item.ram}/${item.storage})` : ''}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700 }}>
                          ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--foreground-secondary)' }}>
                          ₹{item.price.toLocaleString('en-IN')} x {item.quantity}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Summary */}
              <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span>Payment Method:</span>
                  <strong>{detailOrder.paymentMethod || 'Razorpay'} ({detailOrder.paymentStatus || 'Paid'})</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span>Subtotal:</span>
                  <span>₹{(detailOrder.subtotal || detailOrder.totalAmount).toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 800, color: '#10b981', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                  <span>Total Amount Paid:</span>
                  <span>₹{(detailOrder.totalAmount || detailOrder.subtotal).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
