import { apiPost } from './client';

/**
 * Creates a server-side verified Razorpay order for competition registration.
 * Computes the fee on the server and generates a Razorpay Order ID.
 */
export const createRazorpayOrder = async (orderPayload) => {
  return apiPost('/payments/razorpay/order', orderPayload);
};

/**
 * Verifies Razorpay payment signature via server-side HMAC-SHA256 constant-time check.
 * Confirms registration and stores payment ID and signature.
 */
export const verifyRazorpayPayment = async (verifyPayload) => {
  return apiPost('/payments/razorpay/verify', verifyPayload);
};
