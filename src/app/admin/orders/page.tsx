'use client';

import React, { useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import styles from '../admin.module.css';

export default function OrdersAdminPage() {
  const [orders] = useState<any[]>([]);

  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Orders Management ({orders.length} orders)</h2>
          <p className={styles.sectionSubtitle}>Track customer purchase orders, fulfillment statuses, and shipping updates.</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px dashed var(--border-color)', margin: '16px 0' }}>
          <ShoppingBag size={36} style={{ color: 'var(--foreground-secondary)', marginBottom: '8px' }} />
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground-secondary)', margin: 0 }}>
            No customer orders placed yet. Orders created by buyers will appear here in real time!
          </p>
        </div>
      ) : (
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>ORDER ID</th>
              <th>CUSTOMER</th>
              <th>NET AMOUNT</th>
              <th>STATUS</th>
              <th>ORDER DATE</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td style={{ fontWeight: 700 }}>{o.orderNumber}</td>
                <td>{o.customerName || 'Customer'}</td>
                <td style={{ fontWeight: 600 }}>₹{o.netAmount?.toLocaleString('en-IN')}</td>
                <td><span className={styles.badgeCategory}>{o.status}</span></td>
                <td>{o.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
