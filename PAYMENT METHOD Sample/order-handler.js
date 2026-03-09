// Order Handler - Add this to your payment method page

// Get order data from URL
function getOrderData() {
  const urlParams = new URLSearchParams(window.location.search);
  const orderParam = urlParams.get('order');
  
  if (orderParam) {
    try {
      return JSON.parse(decodeURIComponent(orderParam));
    } catch (e) {
      console.error('Error parsing order data:', e);
      return null;
    }
  }
  return null;
}

// Display order summary
function displayOrderSummary() {
  const orderData = getOrderData();
  
  if (!orderData) {
    console.log('No order data found');
    return;
  }

  // Create order summary HTML
  const orderSummaryHTML = `
    <div class="order-summary" style="background: white; border-radius: 16px; padding: 24px; margin: 24px auto; max-width: 600px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
      <h3 style="font-size: 24px; font-weight: 700; margin-bottom: 20px; color: #1a1a1a;">Order Summary</h3>
      
      <div class="order-items" style="margin-bottom: 20px;">
        ${orderData.items.map(item => `
          <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e5e5;">
            <div>
              <div style="font-weight: 600; color: #1a1a1a;">${item.name}</div>
              <div style="font-size: 14px; color: #666;">$${item.price.toFixed(2)} × ${item.quantity}</div>
            </div>
            <div style="font-weight: 600; color: #1a1a1a;">$${item.total.toFixed(2)}</div>
          </div>
        `).join('')}
      </div>
      
      <div style="display: flex; justify-content: space-between; padding: 16px 0; border-top: 2px solid #1a1a1a; margin-top: 16px;">
        <div style="font-size: 20px; font-weight: 700; color: #1a1a1a;">Total Amount</div>
        <div style="font-size: 28px; font-weight: 800; color: #009cde;">$${orderData.totalPrice.toFixed(2)}</div>
      </div>
      
      <div style="background: #f0f9ff; padding: 16px; border-radius: 12px; margin-top: 20px; border-left: 4px solid #009cde;">
        <div style="font-weight: 600; color: #1a1a1a; margin-bottom: 8px;">📦 Total Items: ${orderData.totalItems}</div>
        <div style="font-size: 14px; color: #666;">Please scan the QR code below and send exactly <strong>$${orderData.totalPrice.toFixed(2)}</strong></div>
      </div>
    </div>
  `;

  // Insert order summary after hero section
  const heroSection = document.querySelector('.hero');
  if (heroSection) {
    heroSection.insertAdjacentHTML('afterend', orderSummaryHTML);
  }
}

// Show thank you message after payment
function showThankYouMessage() {
  const thankYouHTML = `
    <div class="thank-you-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 10000;">
      <div class="thank-you-modal" style="background: white; border-radius: 24px; padding: 48px; max-width: 500px; text-align: center; animation: slideUp 0.3s ease;">
        <div style="width: 80px; height: 80px; background: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h2 style="font-size: 32px; font-weight: 800; margin-bottom: 16px; color: #1a1a1a;">Thank You!</h2>
        <p style="font-size: 18px; color: #666; margin-bottom: 24px;">Your payment has been received successfully.</p>
        <p style="font-size: 14px; color: #999; margin-bottom: 32px;">A confirmation email will be sent to you shortly with your order details.</p>
        <button onclick="closeThankYou()" style="background: #009cde; color: white; border: none; padding: 16px 32px; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer;">Close</button>
      </div>
    </div>
    <style>
      @keyframes slideUp {
        from { transform: translateY(30px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    </style>
  `;
  
  document.body.insertAdjacentHTML('beforeend', thankYouHTML);
}

function closeThankYou() {
  const overlay = document.querySelector('.thank-you-overlay');
  if (overlay) {
    overlay.remove();
  }
}

// Add "I've Paid" button to modal
function addPaymentConfirmButton() {
  const modal = document.querySelector('.modal');
  if (modal && getOrderData()) {
    const buttonHTML = `
      <button onclick="confirmPayment()" style="width: 100%; background: #10b981; color: white; border: none; padding: 16px; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer; margin-top: 20px;">
        ✓ I've Completed the Payment
      </button>
    `;
    modal.insertAdjacentHTML('beforeend', buttonHTML);
  }
}

// Confirm payment and send email
async function confirmPayment() {
  const orderData = getOrderData();
  
  // Show thank you message
  closeModal();
  showThankYouMessage();
  
  // TODO: Send email confirmation
  // You'll need to implement this with your backend/email service
  console.log('Payment confirmed for order:', orderData);
  
  // Optional: Clear cart in localStorage
  localStorage.removeItem('gxz-cart');
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
  displayOrderSummary();
  
  // Add payment confirm button when modal opens
  const originalOpenModal = window.openModal;
  window.openModal = function(method) {
    originalOpenModal(method);
    setTimeout(addPaymentConfirmButton, 100);
  };
});
