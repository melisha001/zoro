import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trophy, CheckCircle2, AlertCircle, CreditCard, ShieldCheck, User, Mail, Building2, MapPin, ArrowRight, Lock, Eye, EyeOff } from 'lucide-react';
import { createRazorpayOrder, verifyRazorpayPayment } from '../../api/paymentApi';
import { initiateRazorpayPayment } from '../../utils/razorpay';
import { createNotification } from '../../api/notificationApi';
import { checkEmailExists } from '../../api/userApi';
import { formatDate } from '../../utils/dateFormatter';
import { validatePhone, SUBMIT_PHONE_ERROR } from '../../utils/phoneValidator';
import PhoneInput from '../common/PhoneInput';
import ButtonSpinner from '../common/ButtonSpinner';

export default function CompetitionRegisterModal({ competition, isOpen, onClose, currentUser, onSuccess }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successDialog, setSuccessDialog] = useState(null); // { competitionTitle, data }
  const [failureDialog, setFailureDialog] = useState(null); // string reason
  const [accountExists, setAccountExists] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    studentName: currentUser?.name || currentUser?.studentName || '',
    studentEmail: currentUser?.email || '',
    studentPhone: currentUser?.phone || currentUser?.mobile || '',
    studentId: currentUser?.studentId || currentUser?.id || null,
    age: '',
    school: '',
    city: ''
  });

  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        studentName: currentUser.name || currentUser.studentName || '',
        studentEmail: currentUser.email || '',
        studentPhone: currentUser.phone || currentUser.mobile || '',
        studentId: currentUser.studentId || currentUser.id || null
      }));
    }
  }, [currentUser, competition]);

  // Window Focus Failsafe: If user returns to tab while payment is processing, reset loading if payment didn't resolve
  useEffect(() => {
    if (!loading) return;

    const handleWindowFocus = () => {
      setTimeout(() => {
        setLoading(false);
      }, 1200);
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => {
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [loading]);

  if (!isOpen || !competition) return null;

  const regFee = Number(competition.registrationFee || competition.fee || 0);

  const handleCheckEmail = async (emailVal) => {
    if (currentUser) {
      setAccountExists(false);
      return;
    }
    const clean = (emailVal || '').trim();
    if (!clean || !clean.includes('@') || !clean.includes('.')) {
      setAccountExists(false);
      return;
    }
    setIsCheckingEmail(true);
    try {
      const exists = await checkEmailExists(clean);
      setAccountExists(exists);
      if (exists) {
        setErrorMsg('You already have an account. Please log in to register.');
      } else if (errorMsg === 'You already have an account. Please log in to register.') {
        setErrorMsg('');
      }
    } catch (e) {
      // ignore
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.studentName.trim() || !formData.studentEmail.trim() || !formData.studentPhone.trim()) {
      setErrorMsg('Please fill in all required contact details.');
      return;
    }

    if (!validatePhone(formData.studentPhone)) {
      setErrorMsg(SUBMIT_PHONE_ERROR);
      return;
    }

    if (!currentUser && accountExists) {
      setErrorMsg('You already have an account. Please log in to register.');
      return;
    }

    if (!currentUser && (!password || password.trim().length < 8)) {
      setErrorMsg('Password is required and must be at least 8 characters.');
      return;
    }

    setLoading(true);

    try {
      // 1. Server-driven order creation / registration check
      const orderPayload = {
        competitionId: competition.id,
        studentName: formData.studentName.trim(),
        studentEmail: formData.studentEmail.trim(),
        studentPhone: formData.studentPhone.trim(),
        studentId: formData.studentId || null,
        password: !currentUser ? password.trim() : null,
        age: formData.age ? Number(formData.age) : null,
        school: formData.school ? formData.school.trim() : null,
        city: formData.city ? formData.city.trim() : null
      };

      const orderRes = await createRazorpayOrder(orderPayload);
      if (!orderRes.success || !orderRes.data) {
        setFailureDialog(orderRes.message || 'Failed to initialize competition registration.');
        setLoading(false);
        return;
      }

      const orderData = orderRes.data;

      // Free competition -> Confirmed directly by server
      if (orderData.free) {
        if (formData.studentEmail) {
          await createNotification({
            trainerName: '',
            title: `Registration Confirmed: ${competition.name || competition.title}`,
            desc: `Your registration for ${competition.name || competition.title} is confirmed.${(competition.startDate || competition.date) ? ` Date: ${formatDate(competition.startDate || competition.date)}.` : ''}${competition.venue ? ` Venue: ${competition.venue}` : ''}`,
            studentEmail: formData.studentEmail,
            type: 'competition_reg'
          }).catch(err => console.warn('Notification error:', err));
        }

        setSuccessDialog({
          competitionTitle: competition.name || competition.title,
          data: { id: orderData.registrationId }
        });
        return;
      }

      // Paid competition -> Open Razorpay checkout with server-returned orderId and keyId
      let paymentResult = null;
      try {
        paymentResult = await initiateRazorpayPayment({
          keyId: orderData.keyId,
          orderId: orderData.orderId,
          amount: orderData.amount,
          currency: orderData.currency,
          competitionName: competition.name || competition.title,
          participantName: formData.studentName,
          participantEmail: formData.studentEmail,
          participantPhone: formData.studentPhone,
          description: `Registration fee for ${competition.name || competition.title}`
        });
      } catch (payErr) {
        setFailureDialog(payErr.message || 'Payment cancelled or failed. Your registration was not completed.');
        setLoading(false);
        return;
      }

      // Verify payment with server
      const verifyRes = await verifyRazorpayPayment({
        orderId: paymentResult.razorpayOrderId,
        paymentId: paymentResult.razorpayPaymentId,
        signature: paymentResult.razorpaySignature
      });

      if (!verifyRes.success) {
        setFailureDialog(verifyRes.message || 'Payment verification failed on the server. Please contact support.');
        setLoading(false);
        return;
      }

      // Send In-App Notification if user is registered student
      if (formData.studentEmail) {
        await createNotification({
          trainerName: '',
          title: `Registration Confirmed: ${competition.name || competition.title}`,
          desc: `Your registration for ${competition.name || competition.title} is confirmed.${(competition.startDate || competition.date) ? ` Date: ${formatDate(competition.startDate || competition.date)}.` : ''}${competition.venue ? ` Venue: ${competition.venue}` : ''}`,
          studentEmail: formData.studentEmail,
          type: 'competition_reg'
        }).catch(err => console.warn('Notification error:', err));
      }

      setSuccessDialog({
        competitionTitle: competition.name || competition.title,
        data: verifyRes.data
      });

    } catch (err) {
      console.error('Registration submission error:', err);
      setFailureDialog(err.message || 'An unexpected error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  // Render Success App Dialog
  if (successDialog) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black text-slate-900">Registration Confirmed!</h3>
            <p className="text-sm font-semibold text-slate-600 leading-relaxed">
              You have been successfully registered for <span className="font-bold text-slate-900">{successDialog.competitionTitle}</span>.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                const data = successDialog.data;
                setSuccessDialog(null);
                if (onSuccess) onSuccess(data);
                onClose();
              }}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition cursor-pointer text-xs"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                const data = successDialog.data;
                setSuccessDialog(null);
                if (onSuccess) onSuccess(data);
                onClose();
                navigate(currentUser ? '/competition' : '/login');
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-[#0F52BA] hover:bg-blue-700 text-white font-bold transition flex items-center justify-center space-x-1 cursor-pointer text-xs shadow-md"
            >
              <span>Go to portal</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Failure App Dialog
  if (failureDialog) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <AlertCircle className="w-9 h-9" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black text-slate-900">Registration Failed</h3>
            <p className="text-sm font-semibold text-slate-600 leading-relaxed px-2">
              {failureDialog}
            </p>
          </div>
          <div className="pt-4">
            <button
              type="button"
              onClick={() => setFailureDialog(null)}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition cursor-pointer text-xs shadow-md"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto text-xs animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full cursor-pointer transition"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 text-amber-600">
          <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">Register for Competition</h3>
            <p className="text-slate-500 text-xs font-semibold">{competition.name || competition.title}</p>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-slate-700 font-semibold">
          {(competition.startDate || competition.date) && (
            <div className="flex justify-between">
              <span className="text-slate-500">Date & Time:</span>
              <span className="text-slate-900 font-bold">
                {formatDate(competition.startDate || competition.date)}{competition.startTime ? ` (${competition.startTime})` : ''}
              </span>
            </div>
          )}
          {competition.venue && (
            <div className="flex justify-between">
              <span className="text-slate-500">Venue:</span>
              <span className="text-slate-900 font-bold">{competition.venue}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-slate-200 pt-2 text-sm">
            <span className="text-slate-800 font-black">Registration Fee:</span>
            <span className="text-emerald-700 font-black">
              {regFee > 0 ? `₹${regFee.toLocaleString('en-IN')}` : 'FREE (₹0)'}
            </span>
          </div>
        </div>

        {/* Form Validation Feedback */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded-2xl flex items-center space-x-2 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Participant Full Name *</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                placeholder="Full Name"
                value={formData.studentName}
                onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="participant@example.com"
                  value={formData.studentEmail}
                  onBlur={(e) => handleCheckEmail(e.target.value)}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({ ...formData, studentEmail: val });
                    if (accountExists) setAccountExists(false);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Mobile Phone (10 Digits) *</label>
              <PhoneInput
                showIcon={true}
                required
                value={formData.studentPhone}
                onChange={(e) => {
                  setFormData({ ...formData, studentPhone: e.target.value });
                  if (errorMsg === SUBMIT_PHONE_ERROR) setErrorMsg('');
                }}
                error={errorMsg === SUBMIT_PHONE_ERROR ? errorMsg : ''}
                onErrorClear={() => {
                  if (errorMsg === SUBMIT_PHONE_ERROR) setErrorMsg('');
                }}
              />
            </div>
          </div>

          {/* Account Exists Warning */}
          {accountExists && !currentUser && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-semibold">You already have an account. Please log in to register.</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/login');
                }}
                className="ml-2 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg cursor-pointer text-xs shrink-0"
              >
                Log in
              </button>
            </div>
          )}

          {/* Password field only shown when email is new and user is not logged in */}
          {!currentUser && !accountExists && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Account Password (min 8 characters) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  placeholder="Enter at least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">This password will be used to log in to your Competition Portal account.</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Age (Optional)</label>
              <input
                type="number"
                min="5"
                max="100"
                placeholder="e.g. 14"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">School / Institution</label>
              <div className="relative">
                <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="School Name"
                  value={formData.school}
                  onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">City</label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          <ButtonSpinner
            type="submit"
            loading={loading}
            disabled={loading || (!currentUser && accountExists)}
            className={`w-full text-white font-black py-4 rounded-xl shadow-lg transition-transform transform active:scale-95 flex items-center justify-center space-x-2 text-xs cursor-pointer mt-2 ${
              !currentUser && accountExists ? 'bg-slate-400 cursor-not-allowed opacity-60' : 'bg-[#0F52BA] hover:bg-blue-700'
            }`}
          >
            {regFee > 0 ? <CreditCard className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            <span>
              {regFee > 0 
                ? `Proceed to Razorpay Payment (₹${regFee})` 
                : 'Confirm Free Registration'}
            </span>
          </ButtonSpinner>
        </form>

      </div>
    </div>
  );
}
