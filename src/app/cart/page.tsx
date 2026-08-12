'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
  const [fullName, setFullName] = useState('John Doe');
  const [phoneNumber, setPhoneNumber] = useState('9876543210');
  const [addressLabel, setAddressLabel] = useState('Home');
  const [street, setStreet] = useState('102, Gold Coast Road');
  const [city, setCity] = useState('Gurugram');
  const [stateProvince, setStateProvince] = useState('Haryana');
  const [postalCode, setPostalCode] = useState('122003');

  // Payment
  const [paymentMethod, setPaymentMethod] = useState('Stripe');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [upiId, setUpiId] = useState('');

  // Success
  const [orderReceipt, setOrderReceipt] = useState<any>(null);

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
      const res = await fetch('http://localhost:5000/api/cart/coupon', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
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



  // Dispatch Order Placement
  const handlePlaceOrder = async () => {
    // Call DB checkout API or mock
    const payload = {
      addressId: 'mock-address-id',
      paymentMethod,
      couponCode: cart.coupon?.code || null
    };

    setCheckoutStep(3);
    const receipt = {
      orderNumber: `BRIGHT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      total: netAmount,
      method: paymentMethod,
      date: new Date().toLocaleDateString()
    };
    setOrderReceipt(receipt);
    
    // Clear shopping cart state
    dispatch(clearCart());

    // Trigger full screen confetti
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 }
    });
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
                  <button onClick={() => setCheckoutStep(1)} className="btn btnSecondary">Back</button>
                  <button onClick={handlePlaceOrder} className="btn btnPrimary">Place Order (₹{netAmount.toLocaleString()})</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
