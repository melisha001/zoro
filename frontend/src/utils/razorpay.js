/**
 * Razorpay Payment Integration Utility
 * Handles dynamic SDK script loading and opening the checkout dialog with server-provided credentials.
 * The frontend contains NO hardcoded or environment key IDs; keyId and orderId are provided strictly by the server.
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
  keyId,
  orderId,
  amount,
  currency = 'INR',
  competitionName,
  participantName,
  participantEmail,
  participantPhone,
  description
}) => {
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded) {
    throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
  }

  return new Promise((resolve, reject) => {
    const options = {
      key: keyId,
      order_id: orderId,
      amount: Number(amount), // Amount in paise as returned by backend
      currency: currency || 'INR',
      name: 'Zoro English Academy',
      description: description || `Registration for ${competitionName || 'Competition'}`,
      image: '/assets/logo.png',
      handler: function (response) {
        if (response && response.razorpay_payment_id) {
          resolve({
            success: true,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id || orderId,
            razorpaySignature: response.razorpay_signature || ''
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
