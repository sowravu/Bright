'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { ShoppingBag, Truck, CheckCircle, Clock, Save, MapPin } from 'lucide-react';
import styles from '../admin.module.css';
import { useToast } from '../../../context/ToastContext';

export default function OrdersAdminPage() {
  const auth = useSelector((state: RootState) => state.auth);
  const { showToast } = useToast();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

  const statusOptions = ['Processing', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'Processing': return { background: 'rgba(234, 179, 8, 0.15)', color: '#d97706', border: '1px solid rgba(234, 179, 8, 0.3)' };
      case 'Confirmed': return { background: 'rgba(59, 130, 246, 0.15)', color: '#2563eb', border: '1px solid rgba(59, 130, 246, 0.3)' };
      case 'Shipped': return { background: 'rgba(168, 85, 247, 0.15)', color: '#9333ea', border: '1px solid rgba(168, 85, 247, 0.3)' };
      case 'Out for Delivery': return { background: 'rgba(249, 115, 22, 0.15)', color: '#ea580c', border: '1px solid rgba(249, 115, 22, 0.3)' };
      case 'Delivered': return { background: 'rgba(34, 197, 94, 0.15)', color: '#16a34a', border: '1px solid rgba(34, 197, 94, 0.3)' };
      case 'Cancelled': return { background: 'rgba(239, 68, 68, 0.15)', color: '#dc2626', border: '1px solid rgba(239, 68, 68, 0.3)' };
      default: return { background: 'rgba(100, 116, 139, 0.15)', color: '#475569', border: '1px solid rgba(100, 116, 139, 0.3)' };
    }
  };

  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Customer Orders Management ({orders.length})</h2>
          <p className={styles.sectionSubtitle}>
            Update order fulfillment status (Shipped, Delivered, Confirmed), specify estimated delivery timestamps, and manage customer orders in real time.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--foreground-secondary)' }}>
          Loading customer orders...
        </div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px dashed var(--border-color)', margin: '16px 0' }}>
          <ShoppingBag size={36} style={{ color: 'var(--foreground-secondary)', marginBottom: '8px' }} />
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground-secondary)', margin: 0 }}>
            No customer orders placed yet. Orders placed via Checkout or Razorpay will appear here!
          </p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>ORDER & CUSTOMER</th>
                <th>ITEMS ORDERED</th>
                <th>NET AMOUNT</th>
                <th>DELIVERY DATE / TIMESTAMP</th>
                <th>ORDER STATUS ACTION</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const customerName = o.user?.name || o.shippingAddress?.fullName || 'Customer';
                const customerEmail = o.user?.email || '';
                const customerPhone = o.user?.phone || o.shippingAddress?.phone || '';
                const currentStatus = o.orderStatus || 'Processing';
                const badgeStyle = getStatusBadgeStyle(currentStatus);

                return (
                  <tr key={o._id || o.id}>
                    {/* Customer Meta */}
                    <td style={{ minWidth: '220px' }}>
                      <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '14px' }}>
                        {o.orderNumber}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '13px', marginTop: '2px' }}>
                        {customerName}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--foreground-secondary)' }}>
                        {customerEmail} {customerPhone ? `• ${customerPhone}` : ''}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--foreground-secondary)', marginTop: '4px' }}>
                        <MapPin size={10} style={{ display: 'inline', marginRight: '2px' }} />
                        {o.shippingAddress?.city}, {o.shippingAddress?.state} ({o.shippingAddress?.postalCode})
                      </div>
                    </td>

                    {/* Items */}
                    <td style={{ minWidth: '240px' }}>
                      {o.items && o.items.length > 0 ? (
                        <div style={{ fontSize: '12px' }}>
                          {o.items.map((item: any, iIdx: number) => (
                            <div key={iIdx} style={{ padding: '2px 0' }}>
                              • <strong>{item.name}</strong> {item.ram ? `(${item.ram}/${item.storage})` : ''} x {item.quantity}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--foreground-secondary)' }}>No items detail</span>
                      )}
                    </td>

                    {/* Net Amount */}
                    <td style={{ fontWeight: 700, fontSize: '14px', whiteSpace: 'nowrap' }}>
                      ₹{(o.totalAmount || o.subtotal || 0).toLocaleString('en-IN')}
                      <div style={{ fontSize: '11px', color: 'var(--foreground-secondary)', fontWeight: 400 }}>
                        {o.paymentMethod || 'Razorpay'} ({o.paymentStatus || 'Paid'})
                      </div>
                    </td>

                    {/* Delivery Date / Time Input */}
                    <td style={{ minWidth: '220px' }}>
                      {currentStatus === 'Delivered' ? (
                        <div style={{ fontSize: '12px', color: 'var(--success)', fontWeight: 600 }}>
                          <CheckCircle size={14} style={{ display: 'inline', marginRight: '4px' }} />
                          Delivered: {o.deliveredAt ? new Date(o.deliveredAt).toLocaleString('en-IN') : 'Completed'}
                        </div>
                      ) : (
                        <div>
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <input
                              type="text"
                              value={deliveryDates[o._id] !== undefined ? deliveryDates[o._id] : (o.estimatedDeliveryDate || '')}
                              onChange={(e) => setDeliveryDates({ ...deliveryDates, [o._id]: e.target.value })}
                              placeholder="e.g. 15 Aug 2026, 4:00 PM"
                              style={{
                                padding: '6px 10px',
                                fontSize: '12px',
                                borderRadius: '4px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-secondary)',
                                color: 'var(--foreground)',
                                width: '150px'
                              }}
                            />
                            <button
                              onClick={() => handleSaveDeliveryDate(o._id)}
                              title="Save Delivery Date"
                              className={styles.btnActionOutline}
                              style={{ padding: '6px 8px' }}
                              disabled={updatingId === o._id}
                            >
                              <Save size={14} />
                            </button>
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--foreground-secondary)', marginTop: '2px' }}>
                            Set expected arrival time for buyer
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Status Dropdown Action */}
                    <td style={{ minWidth: '170px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <select
                          value={currentStatus}
                          onChange={(e) => handleStatusChange(o._id, e.target.value)}
                          disabled={updatingId === o._id}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '16px',
                            fontWeight: 700,
                            fontSize: '12px',
                            cursor: 'pointer',
                            outline: 'none',
                            ...badgeStyle
                          }}
                        >
                          {statusOptions.map((opt) => (
                            <option key={opt} value={opt} style={{ background: 'var(--bg-secondary)', color: 'var(--foreground)', fontWeight: 600 }}>
                              {opt}
                            </option>
                          ))}
                        </select>
                        <div style={{ fontSize: '11px', color: 'var(--foreground-secondary)', textAlign: 'center' }}>
                          {updatingId === o._id ? 'Updating status...' : `Placed: ${new Date(o.createdAt).toLocaleDateString('en-IN')}`}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

