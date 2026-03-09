import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import './Payment.css';

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  total: number;
}

interface OrderData {
  items: OrderItem[];
  totalItems: number;
  totalPrice: number;
}

const Payment = () => {
  const location = useLocation();
  const { toast } = useToast();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMethod, setCurrentMethod] = useState<any>(null);
  const [showThankYou, setShowThankYou] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const orderParam = params.get('order');
    
    if (orderParam) {
      try {
        const data = JSON.parse(decodeURIComponent(orderParam));
        setOrderData(data);
      } catch (e) {
        console.error('Error parsing order data:', e);
      }
    }
  }, [location]);

  const methodData = {
    paypal: {
      label: 'PayPal',
      color: '#003087',
      bg: 'rgba(0,48,135,.08)',
      title: 'Pay via PayPal',
      desc: 'Open PayPal → Send & Request → Scan QR Code. Point at the code below.',
      note: 'powered by PayPal',
      qrType: 'image',
      qrSrc: '/paypal.jpeg'
    },
    venmo: {
      label: 'Venmo',
      color: '#008cff',
      bg: 'rgba(0,140,255,.08)',
      title: 'Pay via Venmo',
      desc: 'Open Venmo → Tap the QR icon → Switch to Scan → Point at the code below.',
      note: 'powered by Venmo',
      qrType: 'image',
      qrSrc: '/Venmo.png'
    }
  };

  const openModal = (method: string) => {
    setCurrentMethod(methodData[method as keyof typeof methodData]);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const confirmPayment = async () => {
    try {
      // Save order to database
      const orderNumber = `ORD-${Date.now()}`;
      const { error } = await supabase.from('orders').insert({
        order_number: orderNumber,
        items: orderData.items,
        total_items: orderData.totalItems,
        total_price: orderData.totalPrice,
        payment_method: currentMethod?.label || 'Unknown',
        status: 'completed'
      });

      if (error) {
        console.error('Error saving order:', error);
      }
    } catch (err) {
      console.error('Error:', err);
    }

    closeModal();
    setShowThankYou(true);
    localStorage.removeItem('gxz-cart');
    
    toast({
      title: "Payment Confirmed!",
      description: "Thank you for your order."
    });
  };

  if (!orderData) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h2>No Order Found</h2>
          <p>Please add items to your cart first.</p>
          <Link to="/products" style={{ color: '#2563eb' }}>Browse Products</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <header>
        <div className="header-inner">
          <Link to="/" className="logo">
            <div className="logo-icon">
              <img src="/GXZ-Health.png" alt="GXZ Logo" />
            </div>
            <span className="logo-text">GXZ<span>HEALTH</span></span>
          </Link>
        </div>
      </header>

      <section className="hero">
        <div className="hero-bg">
          <div className="hero-orb hero-orb-1"></div>
          <div className="hero-orb hero-orb-2"></div>
        </div>

        <div className="hero-badge">Payment Guide</div>
        <h1>Complete Your<br/><em>Payment</em></h1>
        <p>Choose your preferred payment method below. Scan the QR code and complete your order.</p>

        <div className="hero-methods">
          <div className="method-pill"><span className="method-pill-dot" style={{background:'#009cde'}}></span>PayPal</div>
          <div className="method-pill"><span className="method-pill-dot" style={{background:'#008cff'}}></span>Venmo</div>
        </div>
      </section>

      {/* Order Summary */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px' }}>
        <div className="order-summary" style={{ background: 'white', borderRadius: '32px', padding: '36px', marginBottom: '40px', boxShadow: '0 2px 8px rgba(37,99,235,.08)', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.5rem', fontWeight: '800', marginBottom: '24px', color: '#0a1628' }}>Order Summary</h3>
          
          <div style={{ marginBottom: '24px' }}>
            {orderData.items.map((item, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>{item.name}</div>
                  <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>${item.price.toFixed(2)} × {item.quantity}</div>
                </div>
                <div style={{ fontWeight: '600', color: '#1e293b' }}>${item.total.toFixed(2)}</div>
              </div>
            ))}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '24px', borderTop: '2px solid #1e293b', marginTop: '16px' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0a1628' }}>Total Amount</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '2rem', fontWeight: '800', color: '#2563eb' }}>
              ${orderData.totalPrice.toFixed(2)}
            </div>
          </div>
          
          <div style={{ background: '#eff6ff', padding: '16px', borderRadius: '12px', marginTop: '24px', borderLeft: '4px solid #2563eb' }}>
            <div style={{ fontWeight: '600', color: '#0a1628', marginBottom: '8px' }}>📦 Total Items: {orderData.totalItems}</div>
            <div style={{ fontSize: '0.875rem', color: '#475569' }}>Please scan the QR code below and send exactly <strong>${orderData.totalPrice.toFixed(2)}</strong></div>
          </div>
        </div>
      </div>

      <main>
        <div className="section-label">Choose a Method</div>
        <h2 className="section-title">Select How You'd Like to Pay</h2>

        <div className="cards-grid">
          <div className="card card-paypal fade-in visible">
            <div className="card-header">
              <div className="card-logo-wrap logo-paypal">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                  <path d="M19.5 7.5c.4 1.3.3 3.3-1.1 4.8C17 13.8 15.3 14.5 13 14.5H11l-1.5 6H7l3-12h5.5c1.8 0 3.2.4 4 2zm-7 4.5h1.5c1.2 0 2-.3 2.4-.8.4-.5.5-1.2.2-2C16.3 8.7 15.6 8.5 14.5 8.5H12.5L11.5 12z"/>
                </svg>
              </div>
              <div>
                <div className="card-title">PayPal</div>
                <div className="card-subtitle">Safe & Instant Transfers</div>
              </div>
            </div>

            <p className="card-desc">
              PayPal is one of the world's most trusted online payment platforms. Use the app or website to send money instantly using my unique QR code.
            </p>

            <div className="steps-label">How It Works</div>
            <ul className="steps">
              <li className="step">
                <span className="step-num">1</span>
                <span className="step-text">Open the <strong>PayPal app</strong> or visit <strong>paypal.com</strong> and log in.</span>
              </li>
              <li className="step">
                <span className="step-num">2</span>
                <span className="step-text">Tap <strong>"Send & Request"</strong> then select <strong>"Send"</strong>.</span>
              </li>
              <li className="step">
                <span className="step-num">3</span>
                <span className="step-text">Tap the <strong>QR code icon</strong> to open the scanner.</span>
              </li>
              <li className="step">
                <span className="step-num">4</span>
                <span className="step-text">Scan <strong>my QR code</strong> below, enter <strong>${orderData.totalPrice.toFixed(2)}</strong> & hit <strong>Send</strong>.</span>
              </li>
            </ul>

            <button className="btn-cta btn-paypal" onClick={() => openModal('paypal')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
              </svg>
              Pay ${orderData.totalPrice.toFixed(2)} with PayPal
            </button>
          </div>

          <div className="card card-venmo fade-in visible">
            <div className="card-header">
              <div className="card-logo-wrap logo-venmo">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
                  <path d="M19 4c.6 1 .8 2 .8 3.3 0 4.1-3.5 9.5-6.3 13.3H7.2L4.5 5.2l5-.5 1.4 11.3c1.3-2.2 2.9-5.6 2.9-7.9 0-1.3-.2-2.1-.5-2.8L19 4z"/>
                </svg>
              </div>
              <div>
                <div className="card-title">Venmo</div>
                <div className="card-subtitle">Social Payments Made Easy</div>
              </div>
            </div>

            <p className="card-desc">
              Venmo makes paying friends and businesses incredibly easy. Scan my QR code directly from the Venmo app — it takes less than 30 seconds.
            </p>

            <div className="steps-label">How It Works</div>
            <ul className="steps">
              <li className="step">
                <span className="step-num">1</span>
                <span className="step-text">Open the <strong>Venmo app</strong> on your phone and log in.</span>
              </li>
              <li className="step">
                <span className="step-num">2</span>
                <span className="step-text">Tap the <strong>QR code icon</strong> at the top of the screen.</span>
              </li>
              <li className="step">
                <span className="step-num">3</span>
                <span className="step-text">Switch to <strong>"Scan"</strong> mode and point your camera at my QR code.</span>
              </li>
              <li className="step">
                <span className="step-num">4</span>
                <span className="step-text">Enter <strong>${orderData.totalPrice.toFixed(2)}</strong>, add an optional <strong>note</strong>, and tap <strong>Pay</strong>.</span>
              </li>
            </ul>

            <button className="btn-cta btn-venmo" onClick={() => openModal('venmo')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
              </svg>
              Pay ${orderData.totalPrice.toFixed(2)} with Venmo
            </button>
          </div>
        </div>
      </main>

      <div className="trust-bar">
        <div className="trust-bar-inner">
          <div className="trust-bar-title">Trusted & Secure Payments</div>
          <div className="trust-bar-sub">Every method listed is end-to-end encrypted and verified by the platform.</div>
          <div className="trust-items">
            <div className="trust-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Bank-Level Security
            </div>
            <div className="trust-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Instant Transfers
            </div>
            <div className="trust-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              No Extra Fees
            </div>
            <div className="trust-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
              Mobile Friendly
            </div>
          </div>
        </div>
      </div>

      <footer>
        <div className="footer-inner">
          <div className="footer-bottom">
            <p>&copy; 2025 GXZHEALTH. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Modal */}
      {isModalOpen && currentMethod && (
        <div className={`modal-overlay ${isModalOpen ? 'active' : ''}`} onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              <X size={16} />
            </button>

            <div className="modal-badge" style={{ color: currentMethod.color, background: currentMethod.bg, borderColor: currentMethod.color + '40' }}>
              {currentMethod.label}
            </div>
            <div className="modal-title">{currentMethod.title}</div>
            <p className="modal-desc">Amount to send: <strong style={{ fontSize: '1.5rem', color: '#2563eb' }}>${orderData.totalPrice.toFixed(2)}</strong></p>

            <div className="qr-frame">
              {currentMethod.qrType === 'image' ? (
                <img src={currentMethod.qrSrc} alt="QR Code" style={{ width: '200px', height: '200px', borderRadius: '12px', objectFit: 'contain' }} />
              ) : (
                <div className="qr-placeholder">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="7" height="7" rx="1"/>
                    <rect x="14" y="3" width="7" height="7" rx="1"/>
                    <rect x="3" y="14" width="7" height="7" rx="1"/>
                    <path d="M14 14h3M14 17v3M17 14v3M21 17h-1M21 20h-4"/>
                  </svg>
                  Your QR Code Here
                </div>
              )}
            </div>

            <button 
              onClick={confirmPayment}
              style={{
                width: '100%',
                padding: '14px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                marginTop: '20px',
                fontSize: '0.9rem'
              }}
            >
              ✓ I've Completed the Payment
            </button>

            <p className="modal-note">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Encrypted & Secure — {currentMethod.note}
            </p>
          </div>
        </div>
      )}

      {/* Thank You Modal */}
      {showThankYou && (
        <div className="modal-overlay active" onClick={() => setShowThankYou(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: '80px', height: '80px', background: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h2 style={{ fontFamily: 'Inter, sans-serif', fontSize: '2rem', fontWeight: '800', marginBottom: '16px' }}>Thank You!</h2>
              <p style={{ fontSize: '1.125rem', color: '#475569', marginBottom: '16px' }}>
                Your payment has been received successfully.
              </p>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '32px' }}>
                A confirmation email will be sent to you shortly with your order details.
              </p>
              <Link to="/" style={{ display: 'inline-block', padding: '14px 32px', background: '#2563eb', color: 'white', borderRadius: '12px', textDecoration: 'none', fontWeight: '600' }}>
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payment;
