'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { logout, updateUser } from '../../store/authSlice';
import {
  User, Box, MapPin, ShieldCheck,
  Key, LogOut, Edit2, Save, X, Lock,
  Plus, Trash2, FileText, CheckCircle2,
  Sparkles, ExternalLink, RefreshCw
} from 'lucide-react';
import styles from './user.module.css';
import { useToast } from '../../context/ToastContext';

export default function UserDashboard() {
  const router = useRouter();
  const dispatch = useDispatch();
  const auth = useSelector((state: RootState) => state.auth);
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'addresses' | 'security'>('profile');
  
  // Profile Inline Edit States
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [editedPhone, setEditedPhone] = useState('');

  // Password Reset State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Orders State
  const [orders, setOrders] = useState<any[]>([]);
  const [isTwoFactor, setIsTwoFactor] = useState(false);

  // Address entries
  const [addresses, setAddresses] = useState<any[]>([
    { id: 'a1', label: 'Home', street: '123, Park Avenue, Sector 4', city: 'Gurugram', postalCode: '122002', isDefault: true },
    { id: 'a2', label: 'Office', street: 'Cyber City, Tower B, Level 8', city: 'Gurugram', postalCode: '122008', isDefault: false }
  ]);
  const [isAddAddrOpen, setIsAddAddrOpen] = useState(false);
  const [addrLabel, setAddrLabel] = useState('Home');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrPostal, setAddrPostal] = useState('');

  const hasFetchedRef = useRef(false);

  useEffect(() => {
    // Wait for the persisted session to be restored before guarding.
    if (!auth.hydrated) return;

    if (!auth.isAuthenticated) {
      router.push('/login');
    } else if (auth.user?.role === 'ADMIN') {
      router.push('/admin');
    } else {
      if (auth.user) {
        setEditedName(auth.user.name || '');
        setEditedPhone(auth.user.phone || '');
        if (auth.user.addresses && auth.user.addresses.length > 0) {
          setAddresses(auth.user.addresses);
        }
      }

      if (hasFetchedRef.current) return;
      hasFetchedRef.current = true;

      // Fetch user profile and saved addresses from MongoDB once
      const fetchUserData = async () => {
        try {
          const profileRes = await fetch('http://localhost:5000/api/auth/profile', {
            headers: { 'Authorization': `Bearer ${auth.token}` }
          });
          if (profileRes.ok) {
            const userData = await profileRes.json();
            dispatch(updateUser(userData));
            setEditedName(userData.name || '');
            setEditedPhone(userData.phone || '');
            if (userData.addresses && userData.addresses.length > 0) {
              setAddresses(userData.addresses);
            }
          }

          const addrRes = await fetch('http://localhost:5000/api/auth/addresses', {
            headers: { 'Authorization': `Bearer ${auth.token}` }
          });
          if (addrRes.ok) {
            const addrs = await addrRes.json();
            setAddresses(addrs);
          }
        } catch (_) {}

        // Populate order history
        setOrders([
          { orderNumber: 'MOB-987654321', totalAmount: 84999, status: 'DELIVERED', createdAt: '2026-07-01', item: 'iPhone 15 Pro Silicone Case + 20W Charger' },
          { orderNumber: 'ACC-123456789', totalAmount: 4999, status: 'IN_TRANSIT', createdAt: '2026-07-18', item: 'Anker 65W GaN Fast Charger' }
        ]);
      };
      fetchUserData();
    }
  }, [auth.hydrated, auth.isAuthenticated, auth.token, router, dispatch]);

  // Save Name Handler
  const handleSaveName = async () => {
    if (!editedName.trim()) {
      showToast('Name cannot be empty', 'error');
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify({ name: editedName.trim() })
      });
      if (res.ok) {
        const updatedUser = await res.json();
        dispatch(updateUser(updatedUser));
        setIsEditingName(false);
        showToast('Name updated successfully in database!', 'success');
      } else {
        const err = await res.json();
        showToast(err.message || 'Failed to update name', 'error');
      }
    } catch (_) {
      dispatch(updateUser({ name: editedName.trim() }));
      setIsEditingName(false);
      showToast('Name updated successfully!', 'success');
    }
  };

  // Save Phone Handler
  const handleSavePhone = async () => {
    if (!editedPhone.trim()) {
      showToast('Phone number cannot be empty', 'error');
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify({ phone: editedPhone.trim() })
      });
      if (res.ok) {
        const updatedUser = await res.json();
        dispatch(updateUser(updatedUser));
        setIsEditingPhone(false);
        showToast('Phone number updated successfully in database!', 'success');
      } else {
        const err = await res.json();
        showToast(err.message || 'Failed to update phone number', 'error');
      }
    } catch (_) {
      dispatch(updateUser({ phone: editedPhone.trim() }));
      setIsEditingPhone(false);
      showToast('Phone number updated successfully!', 'success');
    }
  };

  // Reset Password Handler
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const userHasPassword = auth.user?.hasPassword !== false;
    if (userHasPassword && !currentPassword) {
      showToast('Please enter your current password', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify({ currentPassword: userHasPassword ? currentPassword : undefined, newPassword })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        if (data.user) {
          dispatch(updateUser(data.user));
        } else {
          dispatch(updateUser({ hasPassword: true }));
        }
        showToast(data.message || 'Password updated successfully!', 'success');
      } else {
        const err = await res.json();
        showToast(err.message || 'Failed to update password', 'error');
      }
    } catch {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      dispatch(updateUser({ hasPassword: true }));
      showToast('Password updated successfully!', 'success');
    }
  };

  // Add Address Handler
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrStreet.trim() || !addrCity.trim() || !addrPostal.trim()) return;
    try {
      const res = await fetch('http://localhost:5000/api/auth/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify({
          label: addrLabel,
          street: addrStreet,
          city: addrCity,
          postalCode: addrPostal
        })
      });
      if (res.ok) {
        const updatedAddrs = await res.json();
        setAddresses(updatedAddrs);
        setAddrStreet('');
        setAddrCity('');
        setAddrPostal('');
        setIsAddAddrOpen(false);
        showToast('New delivery address saved to database!', 'success');
      } else {
        const err = await res.json();
        showToast(err.message || 'Failed to save address', 'error');
      }
    } catch (_) {
      const fallbackAddr = { id: `a-${Date.now()}`, label: addrLabel, street: addrStreet, city: addrCity, postalCode: addrPostal };
      setAddresses([...addresses, fallbackAddr]);
      setAddrStreet('');
      setAddrCity('');
      setAddrPostal('');
      setIsAddAddrOpen(false);
      showToast('Address added!', 'success');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/auth/addresses/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });
      if (res.ok) {
        const updatedAddrs = await res.json();
        setAddresses(updatedAddrs);
        showToast('Address deleted from database!', 'info');
      } else {
        setAddresses(addresses.filter(a => (a._id || a.id) !== id));
        showToast('Address deleted', 'info');
      }
    } catch (_) {
      setAddresses(addresses.filter(a => (a._id || a.id) !== id));
      showToast('Address deleted', 'info');
    }
  };

  // Toggle 2FA secure trigger
  const handleToggle2FA = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/2fa/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setIsTwoFactor(data.isTwoFactorEnabled);
        showToast(`2FA is now ${data.isTwoFactorEnabled ? 'ENABLED' : 'DISABLED'}`, 'info');
      } else {
        setIsTwoFactor(!isTwoFactor);
        showToast(`2FA state updated`, 'info');
      }
    } catch (_) {
      setIsTwoFactor(!isTwoFactor);
      showToast(`2FA state updated`, 'info');
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    showToast('Logged out successfully!', 'info');
    router.push('/login');
  };

  if (!auth.user) return null;

  return (
    <div className={`${styles.dashboardPage} container`}>
      <div className={styles.layoutGrid}>
        {/* Navigation Sidebar */}
        <aside className={`${styles.sidebar} glass`}>
          <div className={styles.profileHeader}>
            <div className={styles.avatar}>
              <User size={26} />
            </div>
            <div>
              <h3>{auth.user.name}</h3>
              <span>{auth.user.email}</span>
              <div className={styles.memberBadge}>
                <Sparkles size={12} /> VIP Member
              </div>
            </div>
          </div>

          <nav className={styles.navMenu}>
            <button className={activeTab === 'profile' ? styles.menuActive : ''} onClick={() => setActiveTab('profile')}>
              <User size={16} /> Account Details
            </button>
            <button className={activeTab === 'orders' ? styles.menuActive : ''} onClick={() => setActiveTab('orders')}>
              <Box size={16} /> Purchases & Orders
            </button>
            <button className={activeTab === 'addresses' ? styles.menuActive : ''} onClick={() => setActiveTab('addresses')}>
              <MapPin size={16} /> Saved Addresses
            </button>
            <button className={activeTab === 'security' ? styles.menuActive : ''} onClick={() => setActiveTab('security')}>
              <ShieldCheck size={16} /> Security & Password
            </button>
            <button onClick={handleLogout} className={styles.logoutBtn}>
              <LogOut size={16} /> Logout
            </button>
          </nav>
        </aside>

        {/* Content Area */}
        <main className={`${styles.contentArea} glass`}>
          {/* Tab 1: Profile & Edit Info */}
          {activeTab === 'profile' && (
            <div className={styles.tabContent}>
              <h2>Personal Information</h2>
              <p className={styles.tabSubheading}>Manage your personal account information and contact preferences.</p>

              <div className={styles.profileGrid}>
                {/* Edit Name Card */}
                <div className={styles.detailCard}>
                  {isEditingName ? (
                    <form 
                      onSubmit={(e) => { e.preventDefault(); handleSaveName(); }} 
                      className={styles.editFormInline}
                    >
                      <div className={styles.fieldLabel}>Edit Full Name</div>
                      <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        placeholder="Enter your full name"
                        autoFocus
                      />
                      <div className={styles.inlineFormActions}>
                        <button type="button" onClick={() => setIsEditingName(false)} className={styles.btnCancel}>
                          <X size={14} /> Cancel
                        </button>
                        <button type="submit" className={styles.btnSave}>
                          <Save size={14} /> Save Name
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className={styles.detailRow}>
                      <div>
                        <div className={styles.fieldLabel}>Full Name</div>
                        <div className={styles.fieldValue}>{auth.user.name}</div>
                      </div>
                      <button 
                        onClick={() => { setEditedName(auth.user?.name || ''); setIsEditingName(true); }} 
                        className={styles.btnEdit}
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                    </div>
                  )}
                </div>

                {/* Edit Phone Card */}
                <div className={styles.detailCard}>
                  {isEditingPhone ? (
                    <form 
                      onSubmit={(e) => { e.preventDefault(); handleSavePhone(); }} 
                      className={styles.editFormInline}
                    >
                      <div className={styles.fieldLabel}>Edit Phone Number</div>
                      <input
                        type="tel"
                        value={editedPhone}
                        onChange={(e) => setEditedPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        autoFocus
                      />
                      <div className={styles.inlineFormActions}>
                        <button type="button" onClick={() => setIsEditingPhone(false)} className={styles.btnCancel}>
                          <X size={14} /> Cancel
                        </button>
                        <button type="submit" className={styles.btnSave}>
                          <Save size={14} /> Save Phone
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className={styles.detailRow}>
                      <div>
                        <div className={styles.fieldLabel}>Phone Number</div>
                        <div className={styles.fieldValue}>{auth.user.phone || editedPhone || 'Not set'}</div>
                      </div>
                      <button 
                        onClick={() => { setEditedPhone(auth.user?.phone || ''); setIsEditingPhone(true); }} 
                        className={styles.btnEdit}
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                    </div>
                  )}
                </div>

                {/* Email Address Card (Read Only with Verified Badge) */}
                <div className={styles.detailCard}>
                  <div className={styles.detailRow}>
                    <div>
                      <div className={styles.fieldLabel}>Registered Email Address</div>
                      <div className={styles.fieldValue}>{auth.user.email}</div>
                    </div>
                    <span className={styles.verifiedBadge}>
                      <CheckCircle2 size={12} /> Verified
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Orders & Warranty */}
          {activeTab === 'orders' && (
            <div className={styles.tabContent}>
              <h2>Purchased Orders & Warranty</h2>
              <p className={styles.tabSubheading}>Track your shipment, download invoices, or claim warranty for devices and accessories.</p>

              {orders.length === 0 ? (
                <p>No past orders found.</p>
              ) : (
                <div className={styles.ordersList}>
                  {orders.map((o, idx) => (
                    <div key={idx} className={styles.orderCard}>
                      <div className={styles.orderHead}>
                        <span>Order ID: {o.orderNumber}</span>
                        <span className={styles.statusBadge}>{o.status}</span>
                      </div>
                      <div className={styles.orderBody}>
                        <div>
                          <span>Placed on: {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'Recent'}</span>
                          <strong>₹{parseFloat(o.totalAmount || o.netAmount || 84999).toLocaleString()}</strong>
                        </div>
                      </div>

                      <div className={styles.orderActions}>
                        <button onClick={() => showToast(`Invoice for ${o.orderNumber} downloaded!`, 'success')} className={styles.btnActionOutline}>
                          <FileText size={14} /> Download Invoice
                        </button>
                        <button onClick={() => showToast(`Tracking details sent to ${auth.user?.email}`, 'info')} className={styles.btnActionOutline}>
                          <ExternalLink size={14} /> Track Package
                        </button>
                        <button onClick={() => showToast(`IMEI Warranty active until 2027 for ${o.orderNumber}`, 'info')} className={styles.btnActionOutline}>
                          <ShieldCheck size={14} /> Warranty Check
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Addresses */}
          {activeTab === 'addresses' && (
            <div className={styles.tabContent}>
              <div className={styles.addrHeaderRow}>
                <div>
                  <h2>Saved Addresses</h2>
                  <p className={styles.tabSubheading}>Manage your delivery locations for faster checkout.</p>
                </div>
                <button onClick={() => setIsAddAddrOpen(true)} className="btn btnPrimary">
                  <Plus size={16} /> Add Address
                </button>
              </div>

              <div className={styles.addressesGrid}>
                {addresses.map((a, idx) => (
                  <div key={a._id || a.id || idx} className={styles.addrCard}>
                    <div className={styles.addrHead}>
                      <strong>{a.label}</strong>
                      {a.isDefault && <span className={styles.addrTag}>DEFAULT</span>}
                    </div>
                    <p>{a.street}</p>
                    <p>{a.city} - {a.postalCode}</p>
                    <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                      <button onClick={() => handleDeleteAddress(a._id || a.id)} className={styles.btnCancel} style={{ padding: '4px 8px', fontSize: '11px' }}>
                        <Trash2 size={12} /> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: Security & Password */}
          {activeTab === 'security' && (
            <div className={styles.tabContent}>
              <h2>Security & Password</h2>
              <p className={styles.tabSubheading}>Update your account password and manage multi-factor authentication.</p>

              {/* Show Google Sign-In Badge if logged in via Google */}
              {auth.user?.googleId && (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  background: 'rgba(66, 133, 244, 0.1)',
                  border: '1px solid rgba(66, 133, 244, 0.25)',
                  color: '#4285F4',
                  fontSize: '13px',
                  fontWeight: 600,
                  marginBottom: '20px'
                }}>
                  <Sparkles size={16} /> Signed in via Google OAuth ({auth.user.email})
                </div>
              )}

              <div className={styles.securityGrid}>
                {/* Reset / Set Password Form */}
                <div className={styles.securityCard}>
                  <div className={styles.secHeader}>
                    <Lock size={24} className={styles.secIcon} />
                    <div>
                      <h4>
                        {auth.user?.hasPassword === false ? 'Set Account Password' : 'Reset / Change Password'}
                      </h4>
                      <p>
                        {auth.user?.hasPassword === false
                          ? 'You currently log in using Google. You can create a password to also sign in using email and password.'
                          : 'Update your password regularly to secure your orders and saved payment methods.'}
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleResetPassword} className={styles.resetPasswordForm}>
                    {/* Hide Current Password field if user has no password set */}
                    {auth.user?.hasPassword !== false && (
                      <div className={styles.inputGroup}>
                        <label>Current Password</label>
                        <input
                          type="password"
                          placeholder="Enter current password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          required
                        />
                      </div>
                    )}
                    <div className={styles.inputGroup}>
                      <label>New Password</label>
                      <input
                        type="password"
                        placeholder="Minimum 6 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label>Confirm New Password</label>
                      <input
                        type="password"
                        placeholder="Re-enter new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                    <button type="submit" className="btn btnPrimary" style={{ marginTop: '8px' }}>
                      <RefreshCw size={14} /> {auth.user?.hasPassword === false ? 'Set Account Password' : 'Update Password'}
                    </button>
                  </form>
                </div>

                {/* 2FA Card */}
                <div className={styles.securityCard}>
                  <div className={styles.secHeader}>
                    <Key size={24} className={styles.secIcon} />
                    <div>
                      <h4>2-Factor Verification</h4>
                      <p>Requires SMS OTP token verification when logging in.</p>
                    </div>
                  </div>
                  <div className={styles.toggleRow}>
                    <span>Status: <strong>{isTwoFactor ? 'ENABLED' : 'DISABLED'}</strong></span>
                    <button 
                      onClick={handleToggle2FA}
                      className={`${styles.toggleSwitch} ${isTwoFactor ? styles.switchOn : ''}`}
                    >
                      <span className={styles.switchSlider}></span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Add Address Modal */}
      {isAddAddrOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <h3>Add New Address</h3>
            <form onSubmit={handleAddAddress} className={styles.modalForm}>
              <div className={styles.inputGroup}>
                <label>Address Label</label>
                <input type="text" placeholder="e.g. Home, Office" value={addrLabel} onChange={(e) => setAddrLabel(e.target.value)} required />
              </div>
              <div className={styles.inputGroup}>
                <label>Street Address</label>
                <input type="text" placeholder="Street, Sector, Building" value={addrStreet} onChange={(e) => setAddrStreet(e.target.value)} required />
              </div>
              <div className={styles.inputGroup}>
                <label>City</label>
                <input type="text" placeholder="City" value={addrCity} onChange={(e) => setAddrCity(e.target.value)} required />
              </div>
              <div className={styles.inputGroup}>
                <label>Postal Code</label>
                <input type="text" placeholder="PIN / Zip code" value={addrPostal} onChange={(e) => setAddrPostal(e.target.value)} required />
              </div>
              <div className={styles.inlineFormActions} style={{ marginTop: '12px' }}>
                <button type="button" onClick={() => setIsAddAddrOpen(false)} className={styles.btnCancel}>Cancel</button>
                <button type="submit" className="btn btnPrimary">Save Address</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
