import React, { useState, useEffect } from 'react';
import { Building, Check, Save, Globe, Info, Loader2, HardDrive, Trash2, RefreshCw, ShieldAlert } from 'lucide-react';
import { getWebsiteSettings, saveWebsiteSettings } from '../../api/websiteSettingsApi';
import { getStorageMetrics, triggerStorageCleanup, updateStorageSettings } from '../../api/storageApi';
import { useDialog } from '../../context/DialogContext';
import { useWebsiteSettings } from '../../context/WebsiteSettingsContext';

export default function AdminSettingsPage() {
  const { showSuccess, showError } = useDialog();
  const { isOfflineFallback, offlineMessage, reloadSettings } = useWebsiteSettings();
  const [activeTab, setActiveTab] = useState('landing_content');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Storage and Cost Control State (Requirement C7)
  const [storageMetrics, setStorageMetrics] = useState(null);
  const [isLoadingStorage, setIsLoadingStorage] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanupDryRun, setCleanupDryRun] = useState(false);
  const [cleanupResult, setCleanupResult] = useState(null);
  const [retentionMonths, setRetentionMonths] = useState(0);
  const [isSavingRetention, setIsSavingRetention] = useState(false);

  const [generalInfo, setGeneralInfo] = useState({
    academyName: 'Zoro English Academy',
    tagline: 'Small Steps Big Communication',
    contactEmail: 'contact@zoroacademy.com',
    contactPhone: '+91 98765 43210',
    address: 'No. 12, Main Road, Skill Nagar, Chennai - 600001',
    currency: 'INR (₹)'
  });

  // Website Content State
  const [landingPageContent, setLandingPageContent] = useState({
    heroBadge: 'Learn Today. Grow Tomorrow.',
    heroHeading: 'Skills for a Brighter Tomorrow',
    heroDescription: 'Build skills. Boost confidence. Unlock potential through world-class interactive live classes tailored for children aged 5 to 16.',
    heroPrimaryBtnText: 'Explore Courses',
    heroSecondaryBtnText: 'Join a Competition',
    featuresTitle: 'Featured Learning Programs',
    featuresSubtitle: 'Empowering children with lifelong cognitive abilities and practical skills.',
    spotlightTitle: 'National Championship & Competitions Spotlight',
    spotlightSubtitle: 'Participate in nationwide academic showdowns and win certificates and badges.'
  });

  const [aboutPageContent, setAboutPageContent] = useState({
    heading: 'About Zoro English Academy',
    subtitle: 'Nurturing Young Minds Through Small Steps and Big Communication.',
    introParagraph: 'Zoro English Academy is dedicated to empowering students with exceptional communication, phonics, grammar, public speaking, and analytical skills.',
    missionStatement: 'To make world-class skill development accessible, engaging, and transformative for every child.',
    visionStatement: 'Creating a global generation of articulate, confident, and empathetic leaders of tomorrow.',
    coreValues: 'Excellence, Continuous Growth, Integrity, Student-Centric Empathy'
  });

  const [contactPageContent, setContactPageContent] = useState({
    heading: 'Contact Us',
    subtitle: 'We are here to support your child\'s learning journey.',
    contactPhone: '+91 98765 43210',
    contactEmail: 'contact@zoroacademy.com',
    contactAddress: 'No. 12, Main Road, Skill Nagar, Chennai - 600001, Tamil Nadu, India',
    businessHours: 'Monday – Saturday: 9:00 AM – 7:00 PM IST',
    googleMapLink: 'https://maps.google.com'
  });

  useEffect(() => {
    loadSettingsData();
  }, []);

  const loadSettingsData = async () => {
    try {
      const webRes = await getWebsiteSettings();
      if (webRes.data) {
        if (webRes.data.landingPageContent) setLandingPageContent(webRes.data.landingPageContent);
        if (webRes.data.aboutPageContent) setAboutPageContent(webRes.data.aboutPageContent);
        if (webRes.data.contactPageContent) setContactPageContent(webRes.data.contactPageContent);
        if (webRes.data.generalInfo) setGeneralInfo(webRes.data.generalInfo);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const handleSaveAll = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const res = await saveWebsiteSettings({
        landingPageContent,
        aboutPageContent,
        contactPageContent,
        generalInfo
      });

      if (res && res.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
        await reloadSettings();
        await showSuccess('Settings saved and published successfully', 'Settings Published');
      } else {
        await showError(res?.message || 'Failed to save website settings', 'Save Failed');
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      await showError(err?.message || 'Failed to save settings', 'Save Failed');
    } finally {
      setIsSaving(false);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const loadStorageMetrics = async () => {
    setIsLoadingStorage(true);
    try {
      const res = await getStorageMetrics();
      if (res && res.success && res.data) {
        setStorageMetrics(res.data);
        setRetentionMonths(res.data.submissionRetentionMonths || 0);
      }
    } catch (err) {
      console.error('Failed to load storage metrics:', err);
    } finally {
      setIsLoadingStorage(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'storage') {
      loadStorageMetrics();
    }
  }, [activeTab]);

  const handleRunCleanup = async () => {
    setIsCleaning(true);
    try {
      const res = await triggerStorageCleanup(cleanupDryRun, 24);
      if (res && res.success && res.data) {
        setCleanupResult(res.data);
        await showSuccess(res.data.message || 'Storage cleanup completed', 'Cleanup Executed');
        await loadStorageMetrics();
      } else {
        await showError(res?.message || 'Failed to execute storage cleanup', 'Cleanup Error');
      }
    } catch (err) {
      await showError(err?.message || 'Failed to trigger cleanup', 'Cleanup Error');
    } finally {
      setIsCleaning(false);
    }
  };

  const handleSaveRetention = async (e) => {
    if (e) e.preventDefault();
    setIsSavingRetention(true);
    try {
      const res = await updateStorageSettings({ submissionRetentionMonths: retentionMonths });
      if (res && res.success && res.data) {
        setStorageMetrics(res.data);
        const policyLabel = retentionMonths === 0 ? 'Disabled (Retain Indefinitely)' : `${retentionMonths} Months`;
        await showSuccess(`Submission retention set to ${policyLabel}`, 'Policy Saved');
      } else {
        await showError(res?.message || 'Failed to save retention policy', 'Save Failed');
      }
    } catch (err) {
      await showError(err?.message || 'Failed to save retention policy', 'Save Failed');
    } finally {
      setIsSavingRetention(false);
    }
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Academy & Website Content Settings</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Manage public website text, landing page content, about/contact info, and academy information.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 flex-wrap font-bold">
        <button
          onClick={() => setActiveTab('landing_content')}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'landing_content' ? 'border-[#0F52BA] text-[#0F52BA] font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Globe className="w-4 h-4" />
          Landing Page Content
        </button>

        <button
          onClick={() => setActiveTab('about_contact')}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'about_contact' ? 'border-[#0F52BA] text-[#0F52BA] font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Info className="w-4 h-4" />
          About & Contact Page Text
        </button>

        <button
          onClick={() => setActiveTab('general')}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'general' ? 'border-[#0F52BA] text-[#0F52BA] font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building className="w-4 h-4" />
          General Information
        </button>

        <button
          onClick={() => setActiveTab('storage')}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'storage' ? 'border-[#0F52BA] text-[#0F52BA] font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          Storage & Cost Control
        </button>
      </div>

      {isOfflineFallback && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{offlineMessage || 'Using default content (server unreachable)'}</span>
        </div>
      )}

      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>All website content and settings saved successfully!</span>
        </div>
      )}

      {/* 1. LANDING PAGE CONTENT TAB (Requirement #15 & #16) */}
      {activeTab === 'landing_content' && (
        <form onSubmit={handleSaveAll} className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs max-w-3xl space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-900">Hero & Spotlight Section Content</h3>
            <p className="text-slate-500 text-xs font-medium">Customize text content dynamically shown on the public homepage without changing source code.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Hero Top Badge / Tagline Quote *</label>
              <input
                type="text"
                required
                value={landingPageContent.heroBadge}
                onChange={(e) => setLandingPageContent({ ...landingPageContent, heroBadge: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Hero Main Heading *</label>
              <input
                type="text"
                required
                value={landingPageContent.heroHeading}
                onChange={(e) => setLandingPageContent({ ...landingPageContent, heroHeading: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-extrabold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Hero Description Paragraph *</label>
              <textarea
                rows={3}
                required
                value={landingPageContent.heroDescription}
                onChange={(e) => setLandingPageContent({ ...landingPageContent, heroDescription: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Primary Button Text</label>
                <input
                  type="text"
                  value={landingPageContent.heroPrimaryBtnText}
                  onChange={(e) => setLandingPageContent({ ...landingPageContent, heroPrimaryBtnText: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Secondary Button Text</label>
                <input
                  type="text"
                  value={landingPageContent.heroSecondaryBtnText}
                  onChange={(e) => setLandingPageContent({ ...landingPageContent, heroSecondaryBtnText: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Featured Courses Section Title</label>
                <input
                  type="text"
                  value={landingPageContent.featuresTitle}
                  onChange={(e) => setLandingPageContent({ ...landingPageContent, featuresTitle: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Featured Courses Subtitle</label>
                <input
                  type="text"
                  value={landingPageContent.featuresSubtitle}
                  onChange={(e) => setLandingPageContent({ ...landingPageContent, featuresSubtitle: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Spotlight Section Title</label>
                <input
                  type="text"
                  value={landingPageContent.spotlightTitle || ''}
                  onChange={(e) => setLandingPageContent({ ...landingPageContent, spotlightTitle: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Spotlight Section Subtitle</label>
                <input
                  type="text"
                  value={landingPageContent.spotlightSubtitle || ''}
                  onChange={(e) => setLandingPageContent({ ...landingPageContent, spotlightSubtitle: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="bg-[#0F52BA] hover:bg-blue-700 text-white font-extrabold px-6 py-3 rounded-xl shadow-md inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isSaving ? 'Saving...' : 'Save and Publish'}</span>
            </button>
          </div>
        </form>
      )}

      {/* 2. ABOUT & CONTACT PAGE CONTENT TAB (Requirement #17 & #18) */}
      {activeTab === 'about_contact' && (
        <form onSubmit={handleSaveAll} className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs max-w-3xl space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-900">About & Contact Details Management</h3>
            <p className="text-slate-500 text-xs font-medium">Manage official contact information, mission, vision, and address displayed on the public site.</p>
          </div>

          <div className="space-y-4">
            <div className="font-extrabold text-slate-900 text-sm">About Section Information</div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">About Heading</label>
              <input
                type="text"
                value={aboutPageContent.heading}
                onChange={(e) => setAboutPageContent({ ...aboutPageContent, heading: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">About Subtitle</label>
              <input
                type="text"
                value={aboutPageContent.subtitle || ''}
                onChange={(e) => setAboutPageContent({ ...aboutPageContent, subtitle: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Intro Paragraph</label>
              <textarea
                rows={3}
                value={aboutPageContent.introParagraph}
                onChange={(e) => setAboutPageContent({ ...aboutPageContent, introParagraph: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Mission Statement</label>
                <textarea
                  rows={2}
                  value={aboutPageContent.missionStatement}
                  onChange={(e) => setAboutPageContent({ ...aboutPageContent, missionStatement: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Vision Statement</label>
                <textarea
                  rows={2}
                  value={aboutPageContent.visionStatement}
                  onChange={(e) => setAboutPageContent({ ...aboutPageContent, visionStatement: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Core Values</label>
              <input
                type="text"
                value={aboutPageContent.coreValues || ''}
                onChange={(e) => setAboutPageContent({ ...aboutPageContent, coreValues: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
              />
            </div>

            <div className="font-extrabold text-slate-900 text-sm pt-4 border-t border-slate-100">Contact Information (Public Site & Footer)</div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Public Phone Number</label>
                <input
                  type="text"
                  value={contactPageContent.contactPhone}
                  onChange={(e) => setContactPageContent({ ...contactPageContent, contactPhone: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Public Email Address</label>
                <input
                  type="email"
                  value={contactPageContent.contactEmail}
                  onChange={(e) => setContactPageContent({ ...contactPageContent, contactEmail: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Official Address</label>
              <textarea
                rows={2}
                value={contactPageContent.contactAddress}
                onChange={(e) => setContactPageContent({ ...contactPageContent, contactAddress: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Business Operating Hours</label>
              <input
                type="text"
                value={contactPageContent.businessHours}
                onChange={(e) => setContactPageContent({ ...contactPageContent, businessHours: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Google Map Directions Link</label>
              <input
                type="url"
                placeholder="https://maps.google.com/?q=..."
                value={contactPageContent.googleMapLink || ''}
                onChange={(e) => setContactPageContent({ ...contactPageContent, googleMapLink: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="bg-[#0F52BA] hover:bg-blue-700 text-white font-extrabold px-6 py-3 rounded-xl shadow-md inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isSaving ? 'Saving...' : 'Save and Publish'}</span>
            </button>
          </div>
        </form>
      )}

      {/* 3. GENERAL TAB */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveAll} className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs max-w-2xl space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Academy Name</label>
              <input
                type="text"
                required
                value={generalInfo.academyName}
                onChange={(e) => setGeneralInfo({ ...generalInfo, academyName: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Tagline</label>
              <input
                type="text"
                value={generalInfo.tagline}
                onChange={(e) => setGeneralInfo({ ...generalInfo, tagline: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
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
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Official Phone Number</label>
              <input
                type="text"
                required
                value={generalInfo.contactPhone}
                onChange={(e) => setGeneralInfo({ ...generalInfo, contactPhone: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Academy Physical Address</label>
            <textarea
              rows={2}
              value={generalInfo.address}
              onChange={(e) => setGeneralInfo({ ...generalInfo, address: e.target.value })}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="bg-[#0F52BA] hover:bg-blue-700 text-white font-extrabold px-6 py-2.5 rounded-xl shadow-xs inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isSaving ? 'Saving...' : 'Save and Publish'}</span>
            </button>
          </div>
        </form>
      )}

      {/* 4. STORAGE & COST CONTROL TAB (Requirement C7) */}
      {activeTab === 'storage' && (
        <div className="space-y-6">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-[#0F52BA]" />
                <span>Bunny Storage & Stream Overview</span>
              </h2>
              <p className="text-slate-500 text-xs mt-0.5">
                Real-time storage telemetry, SHA-256 deduplication stats, and automated cleanup controls.
              </p>
            </div>
            <button
              type="button"
              onClick={loadStorageMetrics}
              disabled={isLoadingStorage}
              className="px-3.5 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStorage ? 'animate-spin' : ''}`} />
              <span>Refresh Metrics</span>
            </button>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-slate-500 font-bold block mb-1">Total Stored Files</span>
              <span className="text-2xl font-black text-slate-900">
                {storageMetrics ? storageMetrics.totalFiles : '—'}
              </span>
              <span className="text-[11px] font-semibold text-slate-400 block mt-1">Across all categories</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-slate-500 font-bold block mb-1">Total Storage Used</span>
              <span className="text-2xl font-black text-[#0F52BA]">
                {storageMetrics ? formatBytes(storageMetrics.totalSizeBytes) : '—'}
              </span>
              <span className="text-[11px] font-semibold text-emerald-600 block mt-1">SHA-256 Deduplicated</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-slate-500 font-bold block mb-1">Orphan Files Detected</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-amber-600">
                  {storageMetrics ? storageMetrics.orphanCount : '0'}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  ({storageMetrics ? formatBytes(storageMetrics.orphanSizeBytes) : '0 B'})
                </span>
              </div>
              <span className="text-[11px] font-semibold text-slate-400 block mt-1">&gt; 24h unreferenced</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-slate-500 font-bold block mb-1">Last Cleanup Run</span>
              <span className="text-sm font-black text-slate-800 block truncate">
                {storageMetrics ? storageMetrics.lastCleanupTime : 'Never'}
              </span>
              <span className="text-[11px] font-semibold text-slate-400 block mt-1">
                Reclaimed: {storageMetrics ? formatBytes(storageMetrics.lastReclaimedBytes) : '0 B'}
              </span>
            </div>
          </div>

          {/* Breakdown By Category */}
          {storageMetrics && storageMetrics.sizeByCategory && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="font-extrabold text-slate-800 text-sm">Storage Usage by Category</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {Object.entries(storageMetrics.sizeByCategory).map(([cat, bytes]) => (
                  <div key={cat} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[11px] uppercase tracking-wider font-extrabold text-slate-500 block truncate">{cat}</span>
                    <span className="text-sm font-black text-slate-900 block mt-1">{formatBytes(bytes)}</span>
                    <span className="text-[10px] text-slate-400 font-bold block">
                      {storageMetrics.countByCategory?.[cat] || 0} files
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cleanup Trigger & Policy Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Manual Cleanup Runner */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>Orphan & Video Cleanup</span>
                </h3>
                <p className="text-slate-500 text-xs mt-1">
                  Permanently deletes files and Bunny Stream videos older than 24 hours that are unreferenced anywhere in courses, modules, schedules, submissions, or website assets.
                </p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="cleanupDryRunToggle"
                  checked={cleanupDryRun}
                  onChange={(e) => setCleanupDryRun(e.target.checked)}
                  className="w-4 h-4 text-[#0F52BA] rounded cursor-pointer"
                />
                <label htmlFor="cleanupDryRunToggle" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Dry-run Preview Mode <span className="text-slate-400 font-medium">(scan & count without deleting)</span>
                </label>
              </div>

              {cleanupResult && (
                <div className={`p-4 rounded-xl text-xs border ${
                  cleanupResult.dryRun ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}>
                  <span className="font-extrabold block mb-1">
                    {cleanupResult.dryRun ? '🔍 Dry-Run Scan Results' : '✅ Cleanup Purge Executed'}
                  </span>
                  <p className="font-medium">{cleanupResult.message}</p>
                </div>
              )}

              <div>
                <button
                  type="button"
                  onClick={handleRunCleanup}
                  disabled={isCleaning}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold px-5 py-2.5 rounded-xl shadow-xs inline-flex items-center gap-2 cursor-pointer disabled:opacity-50 text-xs"
                >
                  {isCleaning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  <span>{isCleaning ? 'Running Cleanup...' : (cleanupDryRun ? 'Preview Cleanup Scan' : 'Run Cleanup Now')}</span>
                </button>
              </div>
            </div>

            {/* 2. Retention Policy */}
            <form onSubmit={handleSaveRetention} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#0F52BA]" />
                  <span>Student Submission Retention Policy</span>
                </h3>
                <p className="text-slate-500 text-xs mt-1">
                  Automatically prune assignment attachments and student submission files older than the specified retention window while preserving grade audit records.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Retention Duration</label>
                <select
                  value={retentionMonths}
                  onChange={(e) => setRetentionMonths(parseInt(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs cursor-pointer"
                >
                  <option value={0}>0 — Disabled (Retain Submission Files Indefinitely)</option>
                  <option value={3}>3 Months (Purge completed submissions older than 3 months)</option>
                  <option value={6}>6 Months (Purge completed submissions older than 6 months)</option>
                  <option value={12}>12 Months (Purge completed submissions older than 1 year)</option>
                  <option value={24}>24 Months (Purge completed submissions older than 2 years)</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingRetention}
                  className="bg-[#0F52BA] hover:bg-blue-700 text-white font-extrabold px-5 py-2.5 rounded-xl shadow-xs inline-flex items-center gap-2 cursor-pointer disabled:opacity-50 text-xs"
                >
                  {isSavingRetention ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{isSavingRetention ? 'Saving Policy...' : 'Save Retention Policy'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
