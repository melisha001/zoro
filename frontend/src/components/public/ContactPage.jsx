import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle, Sparkles, MessageSquare } from 'lucide-react';
import { getWebsiteSettings } from '../../api/websiteSettingsApi';
import { createEnquiry } from '../../api/enquiryApi';
import { sanitizePhone, validatePhone } from '../../utils/phoneValidator';

export default function ContactPage({ onOpenEnquire }) {
  const [siteSettings, setSiteSettings] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    course: 'General Enquiry',
    message: ''
  });
  const [phoneError, setPhoneError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await getWebsiteSettings();
        if (res.success && res.data) {
          setSiteSettings(res.data);
        }
      } catch (err) {
        console.error('Failed to load contact settings:', err);
      }
    }
    loadSettings();
  }, []);

  const contactContent = siteSettings?.contactPageContent || {
    heading: 'Contact Us',
    subtitle: "We are here to support your child's learning journey. Get in touch with our expert academic team.",
    contactPhone: '+91 98765 43210',
    contactEmail: 'contact@zoroacademy.com',
    contactAddress: 'No. 12, Main Road, Skill Nagar, Chennai - 600001, Tamil Nadu, India',
    businessHours: 'Monday – Saturday: 9:00 AM – 7:00 PM IST'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validatePhone(formData.phone)) {
      setPhoneError('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
      return;
    }
    setPhoneError('');
    setIsSubmitting(true);
    try {
      await createEnquiry({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        course: formData.course,
        message: formData.message.trim() || 'Direct website contact form inquiry'
      });
      setSubmitted(true);
      setFormData({ name: '', phone: '', email: '', course: 'General Enquiry', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      console.error('Error submitting contact form:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Header Banner */}
      <section className="bg-blue-950 text-white py-16 px-4 sm:px-6 lg:px-8 border-b border-blue-900">
        <div className="max-w-7xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center space-x-2 bg-blue-600/30 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-blue-400/40 text-xs font-semibold text-blue-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>24/7 Academic Support & Counseling</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
            {contactContent.heading}
          </h1>
          <p className="text-slate-300 text-base max-w-2xl mx-auto leading-relaxed">
            {contactContent.subtitle}
          </p>
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Contact Information & Hours Card */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-md space-y-6">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Academy Headquarters
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Feel free to visit our campus, call our counselors, or send us an email. We look forward to partnering in your educational growth.
              </p>

              <div className="space-y-5 pt-2">
                <div className="flex items-start space-x-4">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 text-blue-600">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Phone & WhatsApp</span>
                    <a 
                      href={`tel:${contactContent.contactPhone.replace(/\s+/g, '')}`} 
                      className="text-base font-extrabold text-blue-600 hover:underline"
                    >
                      {contactContent.contactPhone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 text-emerald-600">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</span>
                    <a 
                      href={`mailto:${contactContent.contactEmail}`} 
                      className="text-base font-extrabold text-slate-900 hover:text-blue-600 hover:underline"
                    >
                      {contactContent.contactEmail}
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0 text-purple-600">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Campus Address</span>
                    <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                      {contactContent.contactAddress}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 text-amber-600">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Working Hours</span>
                    <p className="text-sm font-semibold text-slate-800">
                      {contactContent.businessHours}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Demo CTA Card */}
            <div className="bg-gradient-to-br from-blue-900 to-slate-900 text-white rounded-3xl p-8 shadow-xl space-y-4">
              <span className="text-xs font-black tracking-wider uppercase text-blue-300">Free Assessment</span>
              <h3 className="text-xl font-black text-white">Book a Free Live Demo Session</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Experience our interactive virtual classroom and curriculum before enrolling. No obligation.
              </p>
              <button
                type="button"
                onClick={onOpenEnquire}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black py-3 rounded-xl transition shadow-md cursor-pointer text-sm"
              >
                Schedule Free Demo
              </button>
            </div>
          </div>

          {/* Contact Inquiry Form */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-md">
            <div className="mb-6">
              <span className="text-xs font-black tracking-wider uppercase text-blue-600">Send a Message</span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">Get in Touch with Our Counselors</h2>
              <p className="text-xs text-slate-500 mt-1">
                Fill in the details below and an academic advisor will get back to you within 2 working hours.
              </p>
            </div>

            {submitted ? (
              <div className="py-12 text-center space-y-3">
                <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto" />
                <h3 className="text-2xl font-black text-slate-900">Message Received!</h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  Thank you for reaching out. One of our course advisors will call or WhatsApp you shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Student / Parent Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">10-Digit Mobile Number *</label>
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
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email Address (Optional)</label>
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Course of Interest</label>
                    <select
                      value={formData.course}
                      onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none"
                    >
                      <option value="General Enquiry">General Enquiry</option>
                      <option value="English Communication">English Communication</option>
                      <option value="Phonics Level 1 & Level 2">Phonics Level 1 & Level 2</option>
                      <option value="Creative Writing & Public Speaking">Creative Writing & Public Speaking</option>
                      <option value="Spelling Bee Championship">Spelling Bee Championship</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Message / Requirements</label>
                  <textarea
                    rows={4}
                    placeholder="Tell us about the student's age, grade, or specific learning goals..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
