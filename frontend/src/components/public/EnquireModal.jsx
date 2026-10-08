import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { createEnquiry } from '../../api/enquiryApi';
import { getWebsiteSettings } from '../../api/websiteSettingsApi';
import { sanitizePhone, validatePhone } from '../../utils/phoneValidator';

export default function EnquireModal({ isOpen, onClose }) {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', course: 'Phonics Level 1 & Level 2', message: '' });
  const [phoneError, setPhoneError] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    async function checkSettings() {
      const res = await getWebsiteSettings();
      if (res.success && res.data?.portalControls?.publicWebsite) {
        setIsEnabled(res.data.portalControls.publicWebsite.enableEnquiryModal !== false);
      }
    }
    if (isOpen) {
      checkSettings();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEnabled) return;
    if (!validatePhone(formData.phone)) {
      setPhoneError('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
      return;
    }
    setPhoneError('');
    await createEnquiry({
      ...formData,
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: (formData.email || '').trim()
    });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative border border-slate-100">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!isEnabled ? (
          <div className="text-center py-8 space-y-3">
            <AlertCircle className="w-14 h-14 text-amber-500 mx-auto" />
            <h3 className="text-xl font-extrabold text-slate-900">Enquiries Disabled</h3>
            <p className="text-xs text-slate-500">Public course enquiry modal is currently turned off by system administrator.</p>
          </div>
        ) : submitted ? (
          <div className="text-center py-8 space-y-3">
            <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto" />
            <h3 className="text-xl font-extrabold text-slate-900">Enquiry Submitted!</h3>
            <p className="text-xs text-slate-500">Our course counselor will get in touch with you shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Quick Inquiry</span>
              <h3 className="text-2xl font-black text-slate-900">Enquire Now</h3>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Student / Parent Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number (10 Digits) *</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  required
                  placeholder="9876543210"
                  value={formData.phone}
                  onChange={(e) => {
                    const sanitized = sanitizePhone(e.target.value);
                    setFormData({ ...formData, phone: sanitized });
                    if (phoneError) setPhoneError('');
                  }}
                  className={`w-full px-4 py-2.5 bg-slate-50 border ${phoneError ? 'border-rose-500 bg-rose-50/30' : 'border-slate-200'} rounded-xl text-xs font-medium focus:bg-white focus:outline-none`}
                />
                {phoneError && (
                  <p className="text-[11px] font-bold text-rose-600 mt-1">{phoneError}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Course / Interest</label>
                <select
                  value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                >
                  <option value="Phonics Level 1 & Level 2">Phonics Level 1 & Level 2</option>
                  <option value="Grammar + Phonics + Spoken English">Grammar + Phonics + Spoken English</option>
                  <option value="Hybrid English Programme (Live + Recorded)">Hybrid English Programme (Live + Recorded)</option>
                  <option value="Self-Paced Recorded Phonics Course">Self-Paced Recorded Phonics Course</option>
                  <option value="Train the Trainer Special Course">Train the Trainer Special Course</option>
                  <option value="Zoro Phonics Franchise Model">Zoro Phonics Franchise Model</option>
                  <option value="National Competitions 2026">National Competitions 2026</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Message / Questions (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Tell us about your child or inquiry..."
                  value={formData.message || ''}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 rounded-xl shadow-lg transition-transform transform active:scale-95 text-sm mt-4"
            >
              Submit Request
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
