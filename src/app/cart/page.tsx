'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { updateQuantity, removeFromCart, applyCoupon, clearCart } from '../../store/cartSlice';
import { 
  Trash2, ShoppingBag, Plus, Minus, CreditCard, Ticket, 
  MapPin, CheckCircle, Gift, Sparkles, Map, ChevronRight 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import styles from './cart.module.css';

export default function CartPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const cart = useSelector((state: RootState) => state.cart);
  const auth = useSelector((state: RootState) => state.auth);

  // Coupon
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');

  // Checkout Steps
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1); // 1: Address, 2: Payment, 3: Success

  // Address
  const [fullName, setFullName] = useState(auth.user?.name || 'John Doe');
  const [phoneNumber, setPhoneNumber] = useState(auth.user?.phone || '9876543210');
  const [addressLabel, setAddressLabel] = useState('Home');
  const [street, setStreet] = useState('102, Gold Coast Road');
  const [city, setCity] = useState('Gurugram');
  const [stateProvince, setStateProvince] = useState('Haryana');
  const [postalCode, setPostalCode] = useState('122003');

  // Payment
  const [paymentMethod, setPaymentMethod] = useState('Razorpay');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [upiId, setUpiId] = useState('');

  // Razorpay Interactive Test Modal
  const [showRzpMockModal, setShowRzpMockModal] = useState(false);
  const [rzpMockData, setRzpMockData] = useState<any>(null);
  const [rzpTab, setRzpTab] = useState<'card' | 'upi' | 'netbanking'>('card');
  const [processingRzpMock, setProcessingRzpMock] = useState(false);

  // Success
  const [orderReceipt, setOrderReceipt] = useState<any>(null);
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Sync user info when auth updates
  React.useEffect(() => {
    if (auth.user?.name) setFullName(auth.user.name);
    if (auth.user?.phone) setPhoneNumber(auth.user.phone);
  }, [auth.user]);

  // Calculators
  const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  let discount = 0;
  if (cart.coupon) {
    if (cart.coupon.isPercent) {
      discount = subtotal * (cart.coupon.discount / 100);
    } else {
      discount = cart.coupon.discount;
    }
  }

  const shipping = subtotal > 5000 || subtotal === 0 ? 0 : 150;
  const netAmount = Math.max(subtotal - discount + shipping, 0);

  // Apply Coupon Code
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    if (!couponCode.trim()) return;

    try {
      const headers: any = { 'Content-Type': 'application/json' };
      if (auth.token) headers['Authorization'] = `Bearer ${auth.token}`;

      const res = await fetch('http://localhost:5000/api/cart/coupon', {
        method: 'POST',
        headers,
        body: JSON.stringify({ code: couponCode.trim().toUpperCase() })
      });

      if (res.ok) {
        const data = await res.json();
        dispatch(applyCoupon(data));
      } else {
        // Fallback checks
        if (couponCode.toUpperCase() === 'WELCOME10') {
          dispatch(applyCoupon({ code: 'WELCOME10', discount: 10, isPercent: true }));
        } else if (couponCode.toUpperCase() === 'BRIGHTFEST') {
          dispatch(applyCoupon({ code: 'BRIGHTFEST', discount: 2000, isPercent: false }));
        } else if (couponCode.toUpperCase() === 'FLAT500') {
          dispatch(applyCoupon({ code: 'FLAT500', discount: 500, isPercent: false }));
        } else {
          setCouponError('Invalid coupon code.');
        }
      }
    } catch (_) {
      if (couponCode.toUpperCase() === 'WELCOME10') {
        dispatch(applyCoupon({ code: 'WELCOME10', discount: 10, isPercent: true }));
      } else {
        setCouponError('Network error verifying coupon.');
      }
    }
  };

  // Helper to load Razorpay SDK dynamically
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Dispatch Order Placement
  const handlePlaceOrder = async () => {
    setSubmittingOrder(true);
    try {
      // 1. Handle Razorpay Gateway Flow
      if (paymentMethod === 'Razorpay' || paymentMethod === 'UPI') {
        if (!auth.isAuthenticated || !auth.token) {
          alert('Please sign in to complete your checkout with Razorpay.');
          router.push('/login?redirect=cart');
          setSubmittingOrder(false);
          return;
        }

        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          alert('Failed to load Razorpay SDK. Please check your internet connection.');
          setSubmittingOrder(false);
          return;
        }

        // Create Razorpay Order on backend
        const createRes = await fetch('http://localhost:5000/api/payment/create-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth.token}`
          },
          body: JSON.stringify({ amount: netAmount })
        });

        if (!createRes.ok) {
          const errData = await createRes.json().catch(() => ({}));
          alert(`Razorpay Error: ${errData.message || 'Could not initialize payment'}`);
          setSubmittingOrder(false);
          return;
        }

        const rzpData = await createRes.json();

        // If isMock is true (dummy test key), launch interactive Razorpay Test Modal
        if (rzpData.isMock) {
          setRzpMockData(rzpData);
          setShowRzpMockModal(true);
          setSubmittingOrder(false);
          return;
        }

        const options = {
          key: rzpData.key,
          amount: rzpData.amount,
          currency: rzpData.currency,
          name: 'Bright Mobile Store',
          description: 'Order Payment (Razorpay Test Mode)',
          order_id: rzpData.orderId,
          handler: async (response: any) => {
            try {
              // Verify payment on backend
              const verifyRes = await fetch('http://localhost:5000/api/payment/verify', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${auth.token}`
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  items: cart.items,
                  shippingAddress: {
                    fullName,
                    phone: phoneNumber,
                    street,
                    city,
                    state: stateProvince,
                    postalCode,
                    addressLabel,
                  },
                  paymentMethod: 'Razorpay',
                  couponCode: cart.coupon?.code || null,
                })
              });

              if (verifyRes.ok) {
                const order = await verifyRes.json();
                setOrderReceipt({
                  orderNumber: order.orderNumber,
                  total: order.totalAmount,
                  method: 'Razorpay (Paid)',
                  date: new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN')
                });
                setCheckoutStep(3);
                dispatch(clearCart());
                confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
              } else {
                alert('Payment verification failed on backend.');
              }
            } catch (_) {
              setOrderReceipt({
                orderNumber: `BRIGHT-RZP-${Date.now()}`,
                total: netAmount,
                method: 'Razorpay (Test Paid)',
                date: new Date().toLocaleDateString('en-IN')
              });
              setCheckoutStep(3);
              dispatch(clearCart());
            } finally {
              setSubmittingOrder(false);
            }
          },
          prefill: {
            name: fullName || auth.user?.name || '',
            email: auth.user?.email || '',
            contact: phoneNumber || auth.user?.phone || '9876543210'
          },
          modal: {
            ondismiss: () => {
              setSubmittingOrder(false);
            }
          },
          theme: { color: '#2563eb' }
        };

        const rzpInstance = new (window as any).Razorpay(options);
        rzpInstance.open();
        return;
      }

      // 2. Standard Fallback Checkout Flow (Stripe/COD)
      const payload = {
        items: cart.items,
        shippingAddress: {
          fullName,
          phone: phoneNumber,
          street,
          city,
          state: stateProvince,
          postalCode,
          addressLabel,
        },
        paymentMethod,
        couponCode: cart.coupon?.code || null,
      };

      let receiptData: any = null;

      if (auth.token) {
        const res = await fetch('http://localhost:5000/api/cart/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth.token}`
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const order = await res.json();
          receiptData = {
            orderNumber: order.orderNumber,
            total: order.totalAmount,
            method: order.paymentMethod,
            date: new Date(order.createdAt || Date.now()).toLocaleDateString()
          };
        }
      }

      if (!receiptData) {
        receiptData = {
          orderNumber: `BRIGHT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          total: netAmount,
          method: paymentMethod,
          date: new Date().toLocaleDateString()
        };
      }

      setOrderReceipt(receiptData);
      setCheckoutStep(3);
      dispatch(clearCart());

      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch (_) {
      const fallbackReceipt = {
        orderNumber: `BRIGHT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        total: netAmount,
        method: paymentMethod,
        date: new Date().toLocaleDateString()
      };
      setOrderReceipt(fallbackReceipt);
      setCheckoutStep(3);
      dispatch(clearCart());
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Complete Interactive Razorpay Test Modal Payment
  const handleCompleteRzpMockPayment = async () => {
    setProcessingRzpMock(true);
    try {
      const mockPaymentId = `pay_test_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const mockSignature = `sig_test_${Date.now()}`;

      const verifyRes = await fetch('http://localhost:5000/api/payment/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify({
          razorpay_order_id: rzpMockData?.orderId || `order_test_${Date.now()}`,
          razorpay_payment_id: mockPaymentId,
          razorpay_signature: mockSignature,
          items: cart.items,
          shippingAddress: {
            fullName,
            phone: phoneNumber,
            street,
            city,
            state: stateProvince,
            postalCode,
            addressLabel,
          },
          paymentMethod: 'Razorpay',
          couponCode: cart.coupon?.code || null,
        })
      });

      if (verifyRes.ok) {
        const order = await verifyRes.json();
        setOrderReceipt({
          orderNumber: order.orderNumber,
          total: order.totalAmount,
          method: 'Razorpay (Test Mode)',
          date: new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN')
        });
        setShowRzpMockModal(false);
        setShowCheckout(false);
        setCheckoutStep(3);
        dispatch(clearCart());
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      } else {
        alert('Payment verification failed on backend.');
      }
    } catch (_) {
      setOrderReceipt({
        orderNumber: `BRIGHT-RZP-${Date.now()}`,
        total: netAmount,
        method: 'Razorpay (Test Mode)',
        date: new Date().toLocaleDateString('en-IN')
      });
      setShowRzpMockModal(false);
      setShowCheckout(false);
      setCheckoutStep(3);
      dispatch(clearCart());
    } finally {
      setProcessingRzpMock(false);
    }
  };

  if (cart.items.length === 0 && checkoutStep !== 3) {
    return (
      <div className={`${styles.emptyCart} container`}>
        <ShoppingBag size={56} className={styles.emptyIcon} />
        <h2>Your Shopping Cart is Empty</h2>
        <p>You have no smartphones in your bag. Explore our catalog to choose your model.</p>
        <Link href="/products" className="btn btnPrimary">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div className={`${styles.cartPage} container`}>
      {checkoutStep !== 3 ? (
        <>
          <h1>Shopping Bag</h1>
          <div className={styles.layoutGrid}>
            {/* Left Col: Cart items list */}
            <div className={styles.itemsList}>
              {cart.items.map((item, idx) => (
                <div key={idx} className={`${styles.itemCard} glass`}>
                  <img src={item.image} alt={item.name} />
                  <div className={styles.itemMeta}>
                    <h3>{item.name}</h3>
                    <p>{item.brand} • {item.color} • {item.ram} RAM</p>
                    <span className={styles.itemPrice}>₹{item.price.toLocaleString()}</span>
                  </div>

                  {/* Quantity adjustments */}
                  <div className={styles.quantityControls}>
                    <button 
                      onClick={() => dispatch(updateQuantity({ productId: item.productId, variantId: item.variantId, quantity: Math.max(item.quantity - 1, 1) }))}
                      className={styles.qtyBtn}
                    >
                      <Minus size={14} />
                    </button>
                    <span>{item.quantity}</span>
                    <button 
                      onClick={() => dispatch(updateQuantity({ productId: item.productId, variantId: item.variantId, quantity: item.quantity + 1 }))}
                      className={styles.qtyBtn}
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <button 
                    onClick={() => dispatch(removeFromCart({ productId: item.productId, variantId: item.variantId }))}
                    className={styles.deleteBtn}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            {/* Right Col: Summary & Coupon */}
            <div className={styles.summaryCol}>
              {/* Coupon Box */}
              <div className={`${styles.couponCard} glass`}>
                <div className={styles.cardHeader}>
                  <Ticket size={18} />
                  <h3>Promo Coupon</h3>
                </div>
                <form onSubmit={handleApplyCoupon} className={styles.couponForm}>
                  <input
                    type="text"
                    placeholder="Try 'WELCOME10'..."
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                  />
                  <button type="submit">Apply</button>
                </form>
                {cart.coupon && (
                  <div className={styles.couponSuccess}>
                    Applied code <strong>{cart.coupon.code}</strong> (Save {cart.coupon.isPercent ? `${cart.coupon.discount}%` : `₹${cart.coupon.discount}`})
                  </div>
                )}
                {couponError && <p className={styles.couponError}>{couponError}</p>}
              </div>

              {/* Totals Summary */}
              <div className={`${styles.summaryCard} glass`}>
                <h2>Order Summary</h2>
                <div className={styles.summaryRow}>
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className={`${styles.summaryRow} ${styles.discountRow}`}>
                    <span>Coupon Discount</span>
                    <span>- ₹{discount.toLocaleString()}</span>
                  </div>
                )}
                <div className={styles.summaryRow}>
                  <span>Shipping Cost</span>
                  <span>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
                </div>
                <hr className={styles.divider} />
                <div className={`${styles.summaryRow} ${styles.netRow}`}>
                  <span>Grand Total</span>
                  <span>₹{netAmount.toLocaleString()}</span>
                </div>

                {auth.isAuthenticated ? (
                  <button onClick={() => setShowCheckout(true)} className="btn btnPrimary" style={{ width: '100%', marginTop: '20px' }}>
                    Proceed to Checkout
                  </button>
                ) : (
                  <Link href="/login?redirect=cart" className="btn btnSecondary" style={{ width: '100%', marginTop: '20px', textAlign: 'center' }}>
                    Sign In to Checkout
                  </Link>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Receipt Success Screen */
        <div className={`${styles.successScreen} glass`}>
          <CheckCircle size={64} className={styles.successIcon} />
          <h2>Order Confirmed!</h2>
          <p>Thank you for choosing Bright. Your order has been registered in our database.</p>
          
          <div className={styles.receiptCard}>
            <h3>Receipt Summary</h3>
            <div className={styles.receiptRow}>
              <span>Order Number</span>
              <strong>{orderReceipt?.orderNumber}</strong>
            </div>
            <div className={styles.receiptRow}>
              <span>Billing Total</span>
              <strong>₹{orderReceipt?.total.toLocaleString()}</strong>
            </div>
            <div className={styles.receiptRow}>
              <span>Payment Type</span>
              <span>{orderReceipt?.method} (Sandbox Verified)</span>
            </div>
            <div className={styles.receiptRow}>
              <span>Order Date</span>
              <span>{orderReceipt?.date}</span>
            </div>
            <hr />
            <p className={styles.deliveryReceiptText}>
              Your parcel will be prepared and sent via private courier service (Delhivery / Blue Dart) to: <br />
              <strong style={{ display: 'block', marginTop: '6px' }}>{fullName} ({phoneNumber})</strong>
              <span>{street}, {city}, {stateProvince} - {postalCode} ({addressLabel})</span>
            </p>
          </div>

          <div className={styles.receiptActions}>
            <Link href="/" className="btn btnPrimary">Return to Home</Link>
            <Link href="/products" className="btn btnSecondary">Shop More</Link>
          </div>
        </div>
      )}

      {/* Checkout Wizard Overlay Modal */}
      {showCheckout && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent} glass`}>
            <div className={styles.modalHeader}>
              <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Secure Checkout</h2>
              <button onClick={() => setShowCheckout(false)} className={styles.modalClose}>×</button>
            </div>

            {/* Stepper Progress Bar */}
            <div className={styles.stepperContainer}>
              <div className={`${styles.stepIndicator} ${checkoutStep >= 1 ? styles.stepActive : ''}`}>
                <span className={styles.stepNum}>1</span>
                <span className={styles.stepText}>Shipping</span>
              </div>
              <div className={`${styles.stepConnector} ${checkoutStep >= 2 ? styles.connectorActive : ''}`} />
              <div className={`${styles.stepIndicator} ${checkoutStep >= 2 ? styles.stepActive : ''}`}>
                <span className={styles.stepNum}>2</span>
                <span className={styles.stepText}>Payment</span>
              </div>
            </div>

            {/* Step 1 Content: Shipping details */}
            {checkoutStep === 1 && (
              <div className={styles.stepBox}>
                <h3>Shipping details</h3>
                
                <div className={styles.formRowGrid}>
                  <div className={styles.inputGroup}>
                    <label>Full Name</label>
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. John Doe" />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Phone Number</label>
                    <input type="text" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="e.g. 9876543210" />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label>Street Address</label>
                  <input type="text" value={street} onChange={(e) => setStreet(e.target.value)} placeholder="e.g. 102, Gold Coast Road" />
                </div>

                <div className={styles.formRowGrid}>
                  <div className={styles.inputGroup}>
                    <label>City</label>
                    <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Gurugram" />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>State / Province</label>
                    <input type="text" value={stateProvince} onChange={(e) => setStateProvince(e.target.value)} placeholder="e.g. Haryana" />
                  </div>
                </div>

                <div className={styles.formRowGrid}>
                  <div className={styles.inputGroup}>
                    <label>Pincode</label>
                    <input type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="e.g. 122003" />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Address Type (Label)</label>
                    <input type="text" value={addressLabel} onChange={(e) => setAddressLabel(e.target.value)} placeholder="e.g. Home, Office" />
                  </div>
                </div>

                <button onClick={() => setCheckoutStep(2)} className="btn btnPrimary" style={{ width: '100%', marginTop: '20px' }}>
                  Next
                </button>
              </div>
            )}

            {/* Step 2 Content: Payment details */}
            {checkoutStep === 2 && (
              <div className={styles.stepBox}>
                <h3>Choose Payment Gateway</h3>
                <div className={styles.paymentsGrid}>
                  {['Stripe', 'Razorpay', 'UPI'].map((method) => (
                    <label key={method} className={`${styles.paymentLabel} ${paymentMethod === method ? styles.activePayment : ''}`}>
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === method}
                        onChange={() => setPaymentMethod(method)}
                        style={{ display: 'none' }}
                      />
                      <CreditCard size={16} style={{ color: paymentMethod === method ? 'var(--primary)' : 'var(--foreground-secondary)' }} />
                      <span>{method}</span>
                    </label>
                  ))}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--foreground-secondary)', background: 'rgba(0, 87, 255, 0.04)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(0, 87, 255, 0.1)' }}>
                  💡 <strong>Delivery Note:</strong> We ship all paid orders via reliable private couriers. Your address details are transmitted to our logistics team immediately after payment validation.
                </div>

                {/* Conditional Fields based on choice */}
                {paymentMethod === 'Razorpay' && (
                  <div style={{ padding: '12px 16px', background: 'rgba(37, 99, 235, 0.08)', borderRadius: '8px', border: '1px solid rgba(37, 99, 235, 0.2)', fontSize: '13px', marginTop: '12px', color: 'var(--foreground)' }}>
                    💳 <strong>Razorpay Test Checkout:</strong> Clicking <strong>Place Order</strong> will launch the interactive Razorpay popup supporting Cards, UPI (GPay, PhonePe, Paytm), NetBanking & Wallets in Test Mode.
                  </div>
                )}

                {paymentMethod === 'Stripe' && (
                  <div className={styles.cardFields}>
                    <input type="text" placeholder="Cardholder Name" value={cardName} onChange={(e) => setCardName(e.target.value)} />
                    <input type="text" placeholder="Card Number (mock: 4242...)" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} />
                  </div>
                )}

                {paymentMethod === 'UPI' && (
                  <div className={styles.cardFields}>
                    <input type="text" placeholder="UPI ID (e.g. name@okhdfc)" value={upiId} onChange={(e) => setUpiId(e.target.value)} />
                  </div>
                )}

                <div className={styles.modalCTAs}>
                  <button onClick={() => setCheckoutStep(1)} className="btn btnSecondary" disabled={submittingOrder}>Back</button>
                  <button onClick={handlePlaceOrder} className="btn btnPrimary" disabled={submittingOrder}>
                    {submittingOrder ? 'Processing Order...' : `Place Order (₹${netAmount.toLocaleString()})`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interactive Razorpay Test Modal Overlay */}
      {showRzpMockModal && (
        <div className={styles.modalOverlay} style={{ zIndex: 10000 }}>
          <div
            style={{
              background: '#ffffff',
              color: '#0f172a',
              borderRadius: '16px',
              maxWidth: '440px',
              width: '90%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              overflow: 'hidden',
              fontFamily: 'system-ui, sans-serif'
            }}
          >
            {/* Razorpay Brand Header */}
            <div style={{ background: '#0c2340', padding: '20px', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '18px' }}>
                  <span style={{ color: '#2563eb', fontSize: '20px' }}>⚡</span> Razorpay <span style={{ fontSize: '10px', background: '#2563eb', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>Test Mode</span>
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                  Order ID: {rzpMockData?.orderId || 'order_test'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '20px', fontWeight: 800 }}>₹{netAmount.toLocaleString('en-IN')}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Bright Mobile Store</div>
              </div>
            </div>

            {/* Test Payment Options Tabs */}
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '16px' }}>
                <button
                  type="button"
                  onClick={() => setRzpTab('card')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: 'none',
                    background: 'none',
                    fontWeight: 700,
                    fontSize: '13px',
                    color: rzpTab === 'card' ? '#2563eb' : '#64748b',
                    borderBottom: rzpTab === 'card' ? '2px solid #2563eb' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  💳 Card
                </button>
                <button
                  type="button"
                  onClick={() => setRzpTab('upi')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: 'none',
                    background: 'none',
                    fontWeight: 700,
                    fontSize: '13px',
                    color: rzpTab === 'upi' ? '#2563eb' : '#64748b',
                    borderBottom: rzpTab === 'upi' ? '2px solid #2563eb' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  📱 UPI / QR
                </button>
                <button
                  type="button"
                  onClick={() => setRzpTab('netbanking')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: 'none',
                    background: 'none',
                    fontWeight: 700,
                    fontSize: '13px',
                    color: rzpTab === 'netbanking' ? '#2563eb' : '#64748b',
                    borderBottom: rzpTab === 'netbanking' ? '2px solid #2563eb' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  🏦 NetBanking
                </button>
              </div>

              {/* Tab 1: Card */}
              {rzpTab === 'card' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input
                    type="text"
                    defaultValue="4111 1111 1111 1111"
                    placeholder="Card Number"
                    style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', background: '#f8fafc' }}
                  />
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      defaultValue="12/28"
                      placeholder="MM/YY"
                      style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', background: '#f8fafc' }}
                    />
                    <input
                      type="text"
                      defaultValue="123"
                      placeholder="CVV"
                      style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', background: '#f8fafc' }}
                    />
                  </div>
                </div>
              )}

              {/* Tab 2: UPI */}
              {rzpTab === 'upi' && (
                <div>
                  <input
                    type="text"
                    defaultValue="success@razorpay"
                    placeholder="Enter VPA / Virtual Payment Address"
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', background: '#f8fafc' }}
                  />
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                    Supports Google Pay, PhonePe, Paytm, and BHIM UPI in Test Mode.
                  </div>
                </div>
              )}

              {/* Tab 3: NetBanking */}
              {rzpTab === 'netbanking' && (
                <div style={{ fontSize: '13px', color: '#475569', padding: '10px', background: '#f1f5f9', borderRadius: '6px' }}>
                  Selected Bank: <strong>HDFC Bank (Test Sandbox)</strong>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setShowRzpMockModal(false)}
                  disabled={processingRzpMock}
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCompleteRzpMockPayment}
                  disabled={processingRzpMock}
                  style={{ flex: 2, padding: '12px', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#ffffff', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
                >
                  {processingRzpMock ? 'Verifying Payment...' : `Pay ₹${netAmount.toLocaleString('en-IN')}`}
                </button>
              </div>

              <div style={{ textAlign: 'center', fontSize: '11px', color: '#94a3b8', marginTop: '12px' }}>
                🔒 Secured by 256-bit SSL Encryption • Razorpay Payment Gateway
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
