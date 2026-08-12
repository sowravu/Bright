'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setCredentials } from '../store/authSlice';
import { ShieldCheck, Mail, Lock, KeyRound, Sparkles, AlertCircle, MailCheck, User, Phone } from 'lucide-react';
import styles from './AuthPortal.module.css';
import { useToast } from '../context/ToastContext';
import BrightLoader from './BrightLoader';
import { useGoogleLogin } from '@react-oauth/google';

type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'EMPLOYEE' | 'ADMIN';
  phone?: string;
};

export function AuthPortal({ initialRegister = false }: { initialRegister?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const authState = useSelector((state: RootState) => state.auth);
  const { showToast } = useToast();

  const redirectPath = searchParams.get('redirect');

  // If user is already authenticated when visiting /login or /signup
  useEffect(() => {
    if (authState.hydrated && authState.isAuthenticated && authState.user) {
      if (authState.user.role === 'ADMIN') {
        router.push(redirectPath || '/admin');
      } else if (redirectPath) {
        router.push(redirectPath);
      }
    }
  }, [authState.hydrated, authState.isAuthenticated, authState.user, router, redirectPath]);

  // Preserve any ?redirect=... when moving between /login and /signup.
  const redirectQuery = searchParams.get('redirect')
    ? `?redirect=${encodeURIComponent(searchParams.get('redirect') as string)}`
    : '';

  // Post-auth branded splash shown right before redirecting
  const [showWelcomeLoader, setShowWelcomeLoader] = useState(false);

  const completeLogin = (credentials: { token: string; user: AuthUser }) => {
    dispatch(setCredentials(credentials));
    showToast(`Login successful! Welcome back, ${credentials.user.name}.`, 'success');
    setShowWelcomeLoader(true);
    setTimeout(() => {
      if (credentials.user.role === 'ADMIN') {
        router.push(redirectPath || '/admin');
      } else {
        router.push(redirectPath || '/');
      }
    }, 1400);
  };

  // Auth Modes: 'password' | '2fa' | 'verify-email' | 'forgot-password' | 'reset-password'
  const [authMode, setAuthMode] = useState<'password' | '2fa' | 'verify-email' | 'forgot-password' | 'reset-password'>('password');

  // Credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const isRegistering = initialRegister;

  // Forgot Password / Reset Password
  const [resetCode, setResetCode] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Email verification (post-registration)
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingUser, setPendingUser] = useState<{ email: string; name: string; phone: string } | null>(null);

  // 2FA
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorUserId, setTwoFactorUserId] = useState('');

  // Status
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!resetEmail.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Password reset code sent! Check your email inbox.', 'success');
        setAuthMode('reset-password');
      } else {
        setErrorMsg(data.message || 'Could not send reset code.');
      }
    } catch {
      showToast('Dev mode: Use reset code 123456 to test reset.', 'info');
      setAuthMode('reset-password');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!resetCode.trim()) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail.trim() || email.trim(),
          code: resetCode.trim(),
          newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        completeLogin(data);
      } else {
        setErrorMsg(data.message || 'Invalid or expired reset code.');
      }
    } catch {
      if (resetCode.trim() === '123456') {
        completeLogin({
          token: 'mock-reset-token-123456',
          user: { id: `user-reset-${Date.now()}`, email: resetEmail || 'user@bright.com', name: 'Bright Customer', role: 'USER' },
        });
      } else {
        setErrorMsg('Invalid reset code.');
      }
    } finally {
      setLoading(false);
    }
  };

  const triggerPasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (isRegistering && password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const endpoint = isRegistering ? 'register' : 'login';
      const body = isRegistering ? { email, password, name, phone } : { email, password };

      const res = await fetch(`http://localhost:5000/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        if (isRegistering) {
          setPendingUser({ email, name: name || 'New Customer', phone });
          setVerificationCode('');
          setAuthMode('verify-email');
        } else if (data.require2FA) {
          setTwoFactorUserId(data.userId);
          setAuthMode('2fa');
        } else {
          completeLogin(data);
        }
      } else {
        // Backend reachable but rejected the request — show its real error.
        setErrorMsg(data.message || 'Something went wrong. Please try again.');
      }
    } catch {
      // Backend unreachable — fall back to built-in demo accounts.
      fallbackAuthCheck();
    } finally {
      setLoading(false);
    }
  };

  const fallbackAuthCheck = () => {
    // Simulated credential check for easy validation
    if (!isRegistering) {
      if (email === 'admin@bright.com' && password === 'admin123') {
        completeLogin({
          token: 'mock-admin-token-123456',
          user: { id: 'admin-1', email: 'admin@bright.com', name: 'Bright Admin', role: 'ADMIN' }
        });
      } else if (email === 'user@bright.com' && password === 'user123') {
        completeLogin({
          token: 'mock-user-token-123456',
          user: { id: 'user-1', email: 'user@bright.com', name: 'John Doe', role: 'USER', phone: '+919876543210' }
        });
      } else {
        setErrorMsg('Invalid email or password (Try admin@bright.com / admin123 or user@bright.com / user123).');
      }
    } else {
      // Mock registration: require email verification before granting access
      setPendingUser({ email, name: name || 'New Customer', phone });
      setAuthMode('verify-email');
    }
  };

  const handleVerifyEmail = async () => {
    if (!pendingUser) return;
    setErrorMsg('');

    if (!verificationCode.trim()) {
      setErrorMsg('Please enter the verification code sent to your email.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingUser.email, code: verificationCode.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        completeLogin(data);
      } else {
        setErrorMsg(data.message || 'Invalid verification code.');
      }
    } catch {
      // Offline fallback (backend unreachable): accept the mock code.
      if (verificationCode.trim() === '123456') {
        completeLogin({
          token: 'mock-new-user-token',
          user: { id: `user-${Date.now()}`, email: pendingUser.email, name: pendingUser.name, role: 'USER', phone: pendingUser.phone },
        });
      } else {
        setErrorMsg('Could not reach the server. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!pendingUser) return;
    setErrorMsg('');
    try {
      const res = await fetch('http://localhost:5000/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingUser.email }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('A new verification code has been sent to your email.', 'success');
      } else {
        setErrorMsg(data.message || 'Could not resend the code.');
      }
    } catch {
      setErrorMsg('Could not reach the server to resend the code.');
    }
  };

  // Real Google Sign in handler
  const handleGoogleSuccess = async (googleData: { idToken?: string; gUser?: { email: string; name: string; sub?: string; picture?: string } }) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('http://localhost:5000/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(googleData),
      });

      const data = await res.json();
      if (res.ok) {
        if (data.isExistingAccount) {
          showToast(`Welcome back! Logged into your existing account (${data.user.email}).`, 'info');
        } else {
          showToast(`Account created & verified with Google!`, 'success');
        }
        completeLogin(data);
      } else {
        setErrorMsg(data.message || 'Google Sign-In failed.');
      }
    } catch {
      // Backend unreachable or offline demo mode fallback
      const mockEmail = googleData.gUser?.email || 'google.user@bright.com';
      const mockName = googleData.gUser?.name || 'Google Account User';
      completeLogin({
        token: 'mock-google-token-123456',
        user: { id: `user-google-${Date.now()}`, email: mockEmail, name: mockName, role: 'USER' }
      });
    } finally {
      setLoading(false);
    }
  };

  // Google modal state for local dev/demo mode when NEXT_PUBLIC_GOOGLE_CLIENT_ID isn't configured in .env
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('sowravuusuresh@gmail.com');
  const [googleNameInput, setGoogleNameInput] = useState('Sowrav Suresh');

  const triggerGoogleLogin = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${codeResponse.access_token}` },
        });
        const userInfo = await userInfoRes.json();
        handleGoogleSuccess({
          gUser: {
            email: userInfo.email,
            name: userInfo.name,
            sub: userInfo.sub,
            picture: userInfo.picture,
          },
        });
      } catch {
        setErrorMsg('Failed to retrieve Google user profile.');
      }
    },
    onError: (errorResponse) => {
      console.warn('Google OAuth error or fallback mode:', errorResponse);
      setShowGoogleModal(true);
    },
  });

  const handleGoogleBtnClick = () => {
    const envClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (envClientId && !envClientId.includes('dummygoogleclientid') && envClientId.trim() !== '') {
      try {
        triggerGoogleLogin();
      } catch {
        setShowGoogleModal(true);
      }
    } else {
      setShowGoogleModal(true);
    }
  };

  if (showWelcomeLoader) {
    return <BrightLoader message="Taking you to Bright..." />;
  }

  return (
    <div className={`${styles.loginPage} container`}>
      <div className={`${styles.authCard} glass`}>
        <div className={styles.cardHeader}>
          <ShieldCheck className={styles.headerIcon} size={32} />
          <h2>
            {authMode === '2fa'
              ? '2-Factor Check'
              : authMode === 'verify-email'
              ? 'Verify Your Email'
              : authMode === 'forgot-password'
              ? 'Forgot Password'
              : authMode === 'reset-password'
              ? 'Reset Password'
              : isRegistering
              ? 'Register on Bright'
              : 'Welcome to Bright'}
          </h2>
          <p>Bright Choices. Smarter Phones.</p>
        </div>

        {errorMsg && (
          <div className={styles.errorBanner}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 1. PASSWORD MODE */}
        {authMode === 'password' && (
          <form onSubmit={triggerPasswordAuth} className={styles.authForm}>
            {isRegistering && (
              <div className={styles.inputField}>
                <label>Full Name</label>
                <div className={styles.inputWrap}>
                  <User size={16} />
                  <input type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
              </div>
            )}
            {isRegistering && (
              <div className={styles.inputField}>
                <label>Phone Number</label>
                <div className={styles.inputWrap}>
                  <Phone size={16} />
                  <input
                    type="tel"
                    placeholder="+91 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}
            <div className={styles.inputField}>
              <label>Email Address</label>
              <div className={styles.inputWrap}>
                <Mail size={16} />
                <input type="email" placeholder="user@bright.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>
            <div className={styles.inputField}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>Password</label>
                {!isRegistering && (
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setAuthMode('forgot-password');
                      setErrorMsg('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className={styles.inputWrap}>
                <Lock size={16} />
                <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
            </div>

            {isRegistering && (
              <div className={styles.inputField}>
                <label>Confirm Password</label>
                <div className={styles.inputWrap}>
                  <Lock size={16} />
                  <input type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                </div>
              </div>
            )}

            <button type="submit" className="btn btnPrimary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Please wait...' : isRegistering ? 'Create Account' : 'Sign In'}
            </button>
          </form>
        )}

        {/* 2. EMAIL VERIFICATION MODE (post-registration) */}
        {authMode === 'verify-email' && (
          <div className={styles.authForm}>
            <div className={styles.verifyEmailBanner}>
              <MailCheck size={28} />
              <p>
                We&apos;ve sent a 6-digit verification code to <strong>{pendingUser?.email}</strong>.
                Enter it below to activate your account.
              </p>
            </div>
            <div className={styles.inputField}>
              <label>Verification Code</label>
              <div className={styles.inputWrap}>
                <KeyRound size={16} />
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleVerifyEmail();
                  }}
                />
              </div>
            </div>
            <button
              onClick={handleVerifyEmail}
              className="btn btnPrimary"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Verify & Activate Account'}
            </button>
            <button type="button" onClick={handleResendVerification} className={styles.resendLink}>
              Didn&apos;t get a code? Resend
            </button>
          </div>
        )}

        {/* 3. 2-FACTOR SECURE PROMPT MODE */}
        {authMode === '2fa' && (
          <div className={styles.authForm}>
            <div className={styles.inputField}>
              <label>Input 2FA Token Code</label>
              <div className={styles.inputWrap}>
                <KeyRound size={16} />
                <input type="text" placeholder="Enter code (mock: 123456)" value={twoFactorCode} onChange={(e) => setTwoFactorCode(e.target.value)} />
              </div>
              <button 
                onClick={() => {
                  if (twoFactorCode === '123456') {
                    completeLogin({
                      token: 'mock-2fa-token',
                      user: { id: twoFactorUserId, email: 'user@bright.com', name: 'Secure Account User', role: 'USER' }
                    });
                  } else {
                    setErrorMsg('Invalid 2FA code. Try 123456.');
                  }
                }} 
                className="btn btnPrimary" 
                style={{ width: '100%', marginTop: '12px' }}
              >
                Complete Authorization
              </button>
            </div>
          </div>
        )}

        {/* 4. FORGOT PASSWORD MODE (Request Code) */}
        {authMode === 'forgot-password' && (
          <form onSubmit={handleRequestPasswordReset} className={styles.authForm}>
            <div className={styles.verifyEmailBanner}>
              <MailCheck size={28} />
              <p>Enter your registered email address and we will send you a 6-digit code to reset your password.</p>
            </div>

            <div className={styles.inputField}>
              <label>Email Address</label>
              <div className={styles.inputWrap}>
                <Mail size={16} />
                <input
                  type="email"
                  placeholder="user@bright.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btnPrimary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Sending Code...' : 'Send Reset Code'}
            </button>

            <button
              type="button"
              onClick={() => setAuthMode('password')}
              className={styles.resendLink}
              style={{ marginTop: '4px' }}
            >
              Back to Sign In
            </button>
          </form>
        )}

        {/* 5. RESET PASSWORD MODE (Verify Code & Set Password) */}
        {authMode === 'reset-password' && (
          <form onSubmit={handleConfirmPasswordReset} className={styles.authForm}>
            <div className={styles.verifyEmailBanner}>
              <KeyRound size={28} />
              <p>Enter the 6-digit verification code sent to <strong>{resetEmail}</strong> and your new password.</p>
            </div>

            <div className={styles.inputField}>
              <label>6-Digit Reset Code</label>
              <div className={styles.inputWrap}>
                <KeyRound size={16} />
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>
            </div>

            <div className={styles.inputField}>
              <label>New Password</label>
              <div className={styles.inputWrap}>
                <Lock size={16} />
                <input
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className={styles.inputField}>
              <label>Confirm New Password</label>
              <div className={styles.inputWrap}>
                <Lock size={16} />
                <input
                  type="password"
                  placeholder="Re-enter new password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btnPrimary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Resetting Password...' : 'Reset Password & Sign In'}
            </button>

            <button
              type="button"
              onClick={() => setAuthMode('password')}
              className={styles.resendLink}
              style={{ marginTop: '4px' }}
            >
              Back to Sign In
            </button>
          </form>
        )}

        {/* Mode switches — navigate between /login and /signup routes */}
        {authMode === 'password' && (
          <div className={styles.switches}>
            <button
              onClick={() =>
                router.push(isRegistering ? `/login${redirectQuery}` : `/signup${redirectQuery}`)
              }
            >
              {isRegistering ? 'Already have an account? Sign In' : 'New to Bright? Register'}
            </button>
          </div>
        )}

        {authMode === 'password' && (
          <>
            <div className={styles.divider}>
              <span>OR</span>
            </div>

            <button onClick={handleGoogleBtnClick} className={`${styles.googleBtn} glass`}>
              <Sparkles size={16} /> Continue with Google
            </button>
          </>
        )}
      </div>

      {/* Google Account Selector Modal (shown when NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured in .env or for dev authentication) */}
      {showGoogleModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className={`${styles.authCard} glass`} style={{ maxWidth: '420px', background: 'var(--bg-primary, #121212)', border: '1px solid var(--border-color)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            <div className={styles.cardHeader}>
              <Sparkles className={styles.headerIcon} size={32} />
              <h2>Sign in with Google</h2>
              <p>Enter your Google account email to proceed</p>
            </div>

            <div className={styles.authForm}>
              <div className={styles.inputField}>
                <label>Google Email Address</label>
                <div className={styles.inputWrap}>
                  <Mail size={16} />
                  <input
                    type="email"
                    value={googleEmailInput}
                    onChange={(e) => setGoogleEmailInput(e.target.value)}
                    placeholder="sowravuusuresh@gmail.com"
                    required
                  />
                </div>
              </div>

              <div className={styles.inputField}>
                <label>Account Holder Name</label>
                <div className={styles.inputWrap}>
                  <User size={16} />
                  <input
                    type="text"
                    value={googleNameInput}
                    onChange={(e) => setGoogleNameInput(e.target.value)}
                    placeholder="Sowrav Suresh"
                    required
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!googleEmailInput.trim()) return;
                  setShowGoogleModal(false);
                  handleGoogleSuccess({
                    gUser: {
                      email: googleEmailInput.trim(),
                      name: googleNameInput.trim() || 'Google Account User',
                      sub: `google_${Date.now()}`,
                    },
                  });
                }}
                className="btn btnPrimary"
                style={{ width: '100%' }}
                disabled={loading}
              >
                {loading ? 'Authenticating...' : `Sign in as ${googleEmailInput || 'Google User'}`}
              </button>

              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className={styles.resendLink}
                style={{ marginTop: '4px' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
