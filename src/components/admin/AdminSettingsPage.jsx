import React, { useState } from 'react';
import { Settings, Shield, CreditCard, Building, Check, Save } from 'lucide-react';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [generalInfo, setGeneralInfo] = useState({
    academyName: 'Zoro English Academy',
    tagline: 'Small Steps Big Communication',
    contactEmail: 'contact@zoroacademy.com',
    contactPhone: '+91 98765 43210',
    address: 'No. 12, Main Road, Skill Nagar, Chennai - 600001',
    currency: 'INR (₹)'
  });

  const [securitySettings, setSecuritySettings] = useState({
    autoGeneratePasswords: true,
    requirePasswordChange: false,
    sessionTimeoutMins: 60,
    notifyOnNewEnrollment: true
  });

  const handleSave = (e) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Academy Settings</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Configure academy preferences, general details, security, and notification options.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('general')}
          className={`pb-3 text-xs font-bold transition-colors border-b-2 ${
            activeTab === 'general'
              ? 'border-[#0F52BA] text-[#0F52BA]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          General Information
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 text-xs font-bold transition-colors border-b-2 ${
            activeTab === 'security'
              ? 'border-[#0F52BA] text-[#0F52BA]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Security & Access
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`pb-3 text-xs font-bold transition-colors border-b-2 ${
            activeTab === 'notifications'
              ? 'border-[#0F52BA] text-[#0F52BA]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Notification Triggers
        </button>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Academy settings saved successfully!</span>
        </div>
      )}

      {/* General Settings Form */}
      {activeTab === 'general' && (
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-2xl space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Academy Name</label>
              <input
                type="text"
                required
                value={generalInfo.academyName}
                onChange={(e) => setGeneralInfo({ ...generalInfo, academyName: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Tagline</label>
              <input
                type="text"
                value={generalInfo.tagline}
                onChange={(e) => setGeneralInfo({ ...generalInfo, tagline: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Official Contact Email</label>
              <input
                type="email"
                required
                value={generalInfo.contactEmail}
                onChange={(e) => setGeneralInfo({ ...generalInfo, contactEmail: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Official Phone Number</label>
              <input
                type="text"
                required
                value={generalInfo.contactPhone}
                onChange={(e) => setGeneralInfo({ ...generalInfo, contactPhone: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Academy Physical Address</label>
            <textarea
              rows={2}
              value={generalInfo.address}
              onChange={(e) => setGeneralInfo({ ...generalInfo, address: e.target.value })}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="bg-[#0F52BA] hover:bg-blue-700 text-white font-extrabold px-6 py-2.5 rounded-xl shadow-xs inline-flex items-center gap-2 text-xs transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Settings</span>
            </button>
          </div>
        </form>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-2xl space-y-4 text-xs">
          <div className="space-y-3">
            <label className="flex items-center gap-3 text-slate-700 font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={securitySettings.autoGeneratePasswords}
                onChange={(e) => setSecuritySettings({ ...securitySettings, autoGeneratePasswords: e.target.checked })}
                className="rounded text-[#0F52BA] border-slate-300 w-4 h-4"
              />
              Auto-generate default passwords for new Student & Trainer accounts
            </label>

            <label className="flex items-center gap-3 text-slate-700 font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={securitySettings.requirePasswordChange}
                onChange={(e) => setSecuritySettings({ ...securitySettings, requirePasswordChange: e.target.checked })}
                className="rounded text-[#0F52BA] border-slate-300 w-4 h-4"
              />
              Require students to change password upon first login
            </label>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="bg-[#0F52BA] hover:bg-blue-700 text-white font-extrabold px-6 py-2.5 rounded-xl shadow-xs inline-flex items-center gap-2 text-xs transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Update Security Policies</span>
            </button>
          </div>
        </form>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-2xl space-y-4 text-xs">
          <div className="space-y-3">
            <label className="flex items-center gap-3 text-slate-700 font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={securitySettings.notifyOnNewEnrollment}
                onChange={(e) => setSecuritySettings({ ...securitySettings, notifyOnNewEnrollment: e.target.checked })}
                className="rounded text-[#0F52BA] border-slate-300 w-4 h-4"
              />
              Send instant email notification to Admin when a new student registers/enquires
            </label>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="bg-[#0F52BA] hover:bg-blue-700 text-white font-extrabold px-6 py-2.5 rounded-xl shadow-xs inline-flex items-center gap-2 text-xs transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Notification Triggers</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
