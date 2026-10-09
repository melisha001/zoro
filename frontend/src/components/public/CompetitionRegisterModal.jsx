import React, { useState, useEffect } from 'react';
import { X, Trophy, CheckCircle2, AlertCircle, CreditCard, ShieldCheck, User, Mail, Phone, Building2, MapPin } from 'lucide-react';
import { createCompetitionRegistration, checkDuplicateRegistration } from '../../api/competitionRegistrationApi';
import { initiateRazorpayPayment } from '../../utils/razorpay';
import { createNotification } from '../../api/notificationApi';
import { sanitizePhone, validatePhone } from '../../utils/phoneValidator';

export default function CompetitionRegisterModal({ competition, isOpen, onClose, currentUser, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.studentName.trim() || !formData.studentEmail.trim() || !formData.studentPhone.trim()) {
      setErrorMsg('Please fill in all required contact details.');
      return;
    }

    if (!validatePhone(formData.studentPhone)) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    setLoading(true);

    try {
      // 1. Check duplicate registration by phone, email, or studentId
      const isDup = await checkDuplicateRegistration(
        formData.studentEmail,
        competition.id,
        formData.studentPhone,
        formData.studentId
      );
      if (isDup) {
        setErrorMsg('Already registered for this competition.');
        setLoading(false);
        return;
      }

      let paymentResult = null;

      // 2. Razorpay Online Payment Flow if fee > 0
      if (regFee > 0) {
        try {
          paymentResult = await initiateRazorpayPayment({
            amount: regFee,
            competitionName: competition.name,
            participantName: formData.studentName,
            participantEmail: formData.studentEmail,
            participantPhone: formData.studentPhone,
            description: `Registration fee for ${competition.name}`
          });
        } catch (payErr) {
          setErrorMsg(payErr.message || 'Payment cancelled or failed. Registration not completed.');
          setLoading(false);
          return;
        }
        if (regFee > 0 && !paymentResult?.razorpayPaymentId) {
          setErrorMsg('Payment verification failed. Payment was not completed.');
          setLoading(false);
          return;
        }
      }

      // 3. Create Registration Record
      const regPayload = {
        competitionId: competition.id,
        competitionName: competition.name,
        studentId: formData.studentId || null,
        studentName: formData.studentName,
        studentEmail: formData.studentEmail,
        studentPhone: formData.studentPhone,
        age: formData.age ? Number(formData.age) : null,
        school: formData.school || null,
        city: formData.city || null,
        registrationFee: regFee,
        paymentStatus: regFee > 0 ? (paymentResult?.razorpayPaymentId ? 'Paid' : 'Failed') : 'Pending',
        registrationStatus: 'Registered',
        razorpayPaymentId: paymentResult?.razorpayPaymentId || null,
        razorpayOrderId: paymentResult?.razorpayOrderId || null,
        paymentDate: paymentResult?.paymentDate || new Date().toLocaleString('en-GB')
      };

      const res = await createCompetitionRegistration(regPayload);

      if (!res.success) {
        setErrorMsg(res.message || 'Failed to complete competition registration.');
        setLoading(false);
        return;
      }

      // 4. Send In-App Notification if user is registered student
      if (formData.studentEmail) {
        await createNotification({
          trainerName: '',
          title: `Registration Confirmed: ${competition.name}`,
          desc: `Your registration for ${competition.name} is confirmed. Date: ${competition.date || competition.startDate}. Venue: ${competition.venue || 'Online'}`,
          studentEmail: formData.studentEmail,
          type: 'competition_reg'
        });
      }

      setSuccessMsg(`Registration Confirmed for ${competition.name}!`);
      setTimeout(() => {
        if (onSuccess) onSuccess(res.data);
        onClose();
        setSuccessMsg('');
      }, 1500);

    } catch (err) {
      console.error('Registration submission error:', err);
      setErrorMsg('An unexpected error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto text-xs">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full cursor-pointer"
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
            <p className="text-slate-500 text-xs font-semibold">{competition.name}</p>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-slate-700 font-semibold">
          <div className="flex justify-between">
            <span className="text-slate-500">Date & Time:</span>
            <span className="text-slate-900 font-bold">{competition.date || competition.startDate} ({competition.startTime || '10:00 AM'})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Venue:</span>
            <span className="text-slate-900 font-bold">{competition.venue || 'Online'}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 text-sm">
            <span className="text-slate-800 font-black">Registration Fee:</span>
            <span className="text-emerald-700 font-black">
              {regFee > 0 ? `₹${regFee}` : 'FREE (₹0)'}
            </span>
          </div>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded-2xl flex items-center space-x-2 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold rounded-2xl flex items-center space-x-2 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
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
                  onChange={(e) => setFormData({ ...formData, studentEmail: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Mobile Phone (10 Digits) *</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  required
                  placeholder="9876543210"
                  value={formData.studentPhone}
                  onChange={(e) => setFormData({ ...formData, studentPhone: sanitizePhone(e.target.value) })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>
          </div>

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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0F52BA] hover:bg-blue-700 disabled:bg-slate-300 text-white font-black py-4 rounded-xl shadow-lg transition-transform transform active:scale-95 flex items-center justify-center space-x-2 text-xs cursor-pointer mt-2"
          >
            {regFee > 0 ? <CreditCard className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            <span>
              {loading 
                ? 'Processing...' 
                : regFee > 0 
                ? `Proceed to Razorpay Payment (₹${regFee})` 
                : 'Confirm Free Registration'}
            </span>
          </button>
        </form>

      </div>
    </div>
  );
}
