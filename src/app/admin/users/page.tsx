'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { useToast } from '../../../context/ToastContext';
import { Users, UserX, UserCheck } from 'lucide-react';
import styles from '../admin.module.css';

export default function UsersAdminPage() {
  const auth = useSelector((state: RootState) => state.auth);
  const { showToast } = useToast();

  const [managedUsers, setManagedUsers] = useState<any[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  const fetchUsers = async () => {
    const token = auth.token || (typeof window !== 'undefined' ? localStorage.getItem('bright_token') : '');
    try {
      const res = await fetch('http://localhost:5000/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setManagedUsers(data.users || []);
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchUsers();
  }, [auth.token]);

  const handleToggleUserBlock = async (userId: string, currentStatus: string, userName: string) => {
    const token = auth.token || (typeof window !== 'undefined' ? localStorage.getItem('bright_token') : '');
    if (!token) {
      showToast('Authentication token missing. Please log in as Admin again.', 'error');
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${userId}/block`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const updatedStatus = data.user ? data.user.status : (currentStatus === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED');
        setManagedUsers((users) =>
          users.map((u) => (u.id === userId || u._id === userId ? { ...u, status: updatedStatus } : u))
        );
        showToast(
          `User "${userName}" access is now ${updatedStatus}!`,
          updatedStatus === 'BLOCKED' ? 'error' : 'success'
        );
      } else {
        const errData = await res.json().catch(() => ({ message: 'Failed to update user access status' }));
        showToast(`Failed: ${errData.message}`, 'error');
      }
    } catch (_) {
      showToast('Failed to update user access status.', 'error');
    }
  };

  const filteredUsers = managedUsers.filter(
    (u) =>
      u.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  return (
    <div className={styles.tableCard} style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius-md)', padding: '24px', border: '1px solid var(--border-color)' }}>
      <div className={styles.tableHeaderBar}>
        <div>
          <h2>Registered User Directory ({managedUsers.length} accounts)</h2>
          <span style={{ fontSize: '12px', color: 'var(--foreground-secondary)' }}>View registered customer profiles from MongoDB, monitor account roles, and enforce security block controls.</span>
        </div>
      </div>

      <div className={styles.searchAndFilter} style={{ margin: '16px 0' }}>
        <input 
          type="text" 
          placeholder="Filter users by name or email address..." 
          value={userSearchQuery} 
          onChange={(e) => setUserSearchQuery(e.target.value)}
          className={styles.searchInput}
          style={{ width: '100%', maxWidth: '350px' }}
        />
      </div>

      {filteredUsers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px dashed var(--border-color)', margin: '16px 0' }}>
          <Users size={36} style={{ color: 'var(--foreground-secondary)', marginBottom: '8px' }} />
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground-secondary)', margin: 0 }}>
            No user accounts found matching query.
          </p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.adminTable}>
            <thead>
              <tr>
                <th className={styles.adminTh}>USER IDENTITY</th>
                <th className={styles.adminTh}>ACCOUNT ROLE</th>
                <th className={styles.adminTh}>REGISTRATION DATE</th>
                <th className={styles.adminTh}>ACCESS STATUS</th>
                <th className={styles.adminTh}>BLOCK CONTROL</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id || user._id}>
                  <td className={styles.adminTd}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: user.role === 'ADMIN' ? '#a855f7' : '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px' }}>
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <span style={{ fontWeight: 700, display: 'block' }}>{user.name}</span>
                        <span style={{ fontSize: '12px', color: 'var(--foreground-secondary)' }}>{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className={styles.adminTd}>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', background: user.role === 'ADMIN' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(59, 130, 246, 0.15)', color: user.role === 'ADMIN' ? '#a855f7' : '#3b82f6' }}>
                      {user.role}
                    </span>
                  </td>
                  <td className={styles.adminTd} style={{ fontSize: '12px', color: 'var(--foreground-secondary)' }}>
                    {user.joinedDate || '2026-01-01'}
                  </td>
                  <td className={styles.adminTd}>
                    <span className={styles.categoryBadge} style={{ background: user.status === 'BLOCKED' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)', color: user.status === 'BLOCKED' ? '#ef4444' : '#10b981' }}>
                      {user.status || 'ACTIVE'}
                    </span>
                  </td>
                  <td className={styles.adminTd}>
                    {user.role === 'ADMIN' ? (
                      <span style={{ fontSize: '11px', color: 'var(--foreground-secondary)' }}>Protected</span>
                    ) : (
                      <button 
                        onClick={() => handleToggleUserBlock(user.id || user._id, user.status, user.name)}
                        className="btn btnSecondary"
                        style={{ 
                          fontSize: '11px', 
                          padding: '4px 10px',
                          color: user.status === 'BLOCKED' ? '#10b981' : '#ef4444',
                          borderColor: user.status === 'BLOCKED' ? '#6ee7b7' : '#fca5a5'
                        }}
                      >
                        {user.status === 'BLOCKED' ? (
                          <><UserCheck size={14} /> Unblock User</>
                        ) : (
                          <><UserX size={14} /> Block User</>
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
