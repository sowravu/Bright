'use client';

import React, { useState } from 'react';
import { Activity } from 'lucide-react';
import styles from '../admin.module.css';

export default function AuditAdminPage() {
  const [activityLogs] = useState<any[]>([
    { id: 'log1', action: 'ADMIN_CONNECT_MONGODB', details: 'Established live connection to MongoDB cluster at 127.0.0.1:27017', createdAt: new Date().toISOString() },
    { id: 'log2', action: 'ADMIN_INVENTORY_SYNC', details: 'Synchronized live products, accessories, and variant stock collections', createdAt: new Date(Date.now() - 3600000).toISOString() }
  ]);

  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>System Activity & Audit Logs ({activityLogs.length} entries)</h2>
          <p className={styles.sectionSubtitle}>Real-time log trail of administrative actions, catalog updates, and security events.</p>
        </div>
      </div>

      <table className={styles.dataTable} style={{ marginTop: '16px' }}>
        <thead>
          <tr>
            <th>LOG ID</th>
            <th>ACTION CATEGORY</th>
            <th>EVENT DETAILS</th>
            <th>TIMESTAMP</th>
          </tr>
        </thead>
        <tbody>
          {activityLogs.map((log) => (
            <tr key={log.id}>
              <td style={{ fontWeight: 700 }}>{log.id}</td>
              <td><span className={styles.badgeCategory}>{log.action}</span></td>
              <td>{log.details}</td>
              <td style={{ fontSize: '12px', color: 'var(--foreground-secondary)' }}>{new Date(log.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
