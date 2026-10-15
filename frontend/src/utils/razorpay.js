/**
 * Razorpay Payment Integration Utility
 * Handles dynamic SDK script loading and secure checkout initialization.
 * NEVER hardcodes Razorpay secret keys in client-side code.
 */

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
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

export const initiateRazorpayPayment = async ({
  amount,
  competitionName,
  participantName,
  participantEmail,
  participantPhone,
  description
}) => {
  const razorpayKey = import.meta.env?.VITE_RAZORPAY_KEY_ID;

  if (!razorpayKey || !razorpayKey.trim()) {
    throw new Error('Razorpay Key ID is not configured. Please set VITE_RAZORPAY_KEY_ID in the environment.');
  }

  const isLoaded = await loadRazorpayScript();
  
  if (!isLoaded) {
    throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
  }

  return new Promise((resolve, reject) => {
    const options = {
      key: razorpayKey.trim(),
      amount: Math.round(Number(amount) * 100), // Amount in paise
      currency: 'INR',
      name: 'Zoro English Academy',
      description: description || `Registration for ${competitionName}`,
      image: '/assets/logo.png',
      handler: function (response) {
        if (response && response.razorpay_payment_id) {
          resolve({
            success: true,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id || `ord_${Date.now()}`,
            razorpaySignature: response.razorpay_signature || '',
            amount: Number(amount),
            paymentDate: new Date().toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })
          });
        } else {
          reject(new Error('Payment failed or returned invalid response from gateway.'));
        }
      },
      prefill: {
        name: participantName || '',
        email: participantEmail || '',
        contact: participantPhone || ''
      },
      theme: {
        color: '#0F52BA'
      },
      modal: {
        ondismiss: function () {
          reject(new Error('Payment cancelled by user.'));
        }
      }
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        reject(new Error(response?.error?.description || 'Payment failed at gateway.'));
      });
      rzp.open();
    } catch (err) {
      console.error('Razorpay Modal error:', err);
      reject(new Error(err?.message || 'Failed to initialize payment gateway.'));
    }
  });
};
