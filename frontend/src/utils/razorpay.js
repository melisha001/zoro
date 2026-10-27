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

export const initiateRazorpayPayment = async (inputOptions = {}, callbackSuccess, callbackError) => {
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded) {
    const loadErr = new Error('Payment could not be started. Please try again.');
    if (typeof callbackError === 'function') callbackError(loadErr);
    throw loadErr;
  }

  // Handle both camelCase and snake_case parameter names
  const key = inputOptions?.keyId || inputOptions?.key;
  const orderId = inputOptions?.orderId || inputOptions?.order_id;
  const amount = inputOptions?.amount;
  const currency = inputOptions?.currency || 'INR';
  const name = inputOptions?.name || 'Zoro English Academy';
  const description = inputOptions?.description || `Registration for ${inputOptions?.competitionName || 'Competition'}`;
  const prefill = inputOptions?.prefill || {
    name: inputOptions?.participantName || '',
    email: inputOptions?.participantEmail || '',
    contact: inputOptions?.participantPhone || ''
  };

  if (!key || String(key).trim() === '') {
    console.error('Razorpay initiation error: No public key provided to initiateRazorpayPayment');
    const keyErr = new Error('Payment could not be started. Please try again.');
    if (typeof callbackError === 'function') callbackError(keyErr);
    throw keyErr;
  }

  return new Promise((resolve, reject) => {
    const options = {
      key: String(key).trim(),
      order_id: orderId,
      amount: Number(amount), // Amount in paise as returned by backend
      currency: currency || 'INR',
      name: name,
      description: description,
      image: '/assets/logo.png',
      handler: function (response) {
        if (response && response.razorpay_payment_id) {
          const result = {
            success: true,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id || orderId,
            razorpay_order_id: response.razorpay_order_id || orderId,
            razorpaySignature: response.razorpay_signature || '',
            razorpay_signature: response.razorpay_signature || ''
          };
          if (typeof callbackSuccess === 'function') {
            try {
              callbackSuccess(result);
            } catch (cbErr) {
              console.error('Error in payment success callback:', cbErr);
            }
          }
          resolve(result);
        } else {
          const err = new Error('Payment could not be verified. If money was deducted it will be refunded or confirmed shortly.');
          if (typeof callbackError === 'function') callbackError(err);
          reject(err);
        }
      },
      prefill: prefill,
      theme: inputOptions?.theme || {
        color: '#0F52BA'
      },
      modal: {
        ondismiss: function () {
          const cancelErr = new Error('Payment was cancelled.');
          if (typeof callbackError === 'function') callbackError(cancelErr);
          reject(cancelErr);
        }
      }
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        console.error('Razorpay gateway payment.failed event:', response?.error);
        const failErr = new Error('Payment could not be started. Please try again.');
        if (typeof callbackError === 'function') callbackError(failErr);
        reject(failErr);
      });
      rzp.open();
    } catch (err) {
      console.error('Razorpay Modal error:', err);
      const friendlyErr = new Error('Payment could not be started. Please try again.');
      if (typeof callbackError === 'function') callbackError(friendlyErr);
      reject(friendlyErr);
    }
  });
};
