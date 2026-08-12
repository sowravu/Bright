'use client';

import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import styles from '../admin.module.css';

export default function ReturnsAdminPage() {
  const [returnRequests] = useState<any[]>([]);

  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Return & Refund Requests ({returnRequests.length} requests)</h2>
          <p className={styles.sectionSubtitle}>Manage item return authorizations, inspection approvals, and buyer refunds.</p>
        </div>
      </div>

      {returnRequests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px dashed var(--border-color)', margin: '16px 0' }}>
          <RotateCcw size={36} style={{ color: 'var(--foreground-secondary)', marginBottom: '8px' }} />
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground-secondary)', margin: 0 }}>
            No return or refund requests submitted. Customer return claims will be managed here.
          </p>
        </div>
      ) : (
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>CLAIM ID</th>
              <th>CUSTOMER</th>
              <th>PRODUCT</th>
              <th>REFUND VALUE</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {returnRequests.map((r) => (
              <tr key={r.id}>
                <td style={{ fontWeight: 700 }}>{r.id}</td>
                <td>{r.customerName}</td>
                <td>{r.productName}</td>
                <td>₹{r.refundAmount?.toLocaleString('en-IN')}</td>
                <td><span className={styles.badgeCategory}>{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
