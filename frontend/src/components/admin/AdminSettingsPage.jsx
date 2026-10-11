import React, { useState, useEffect } from 'react';
import { Building, Check, Save, Globe, Info } from 'lucide-react';
import { getWebsiteSettings, saveWebsiteSettings } from '../../api/websiteSettingsApi';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('landing_content');
  const [savedSuccess, setSavedSuccess] = useState(false);

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
    featuresSubtitle: 'Empowering children with lifelong cognitive abilities and practical skills.'
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
    businessHours: 'Monday – Saturday: 9:00 AM – 7:00 PM IST'
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
    try {
      await saveWebsiteSettings({
        landingPageContent,
        aboutPageContent,
        contactPageContent,
        generalInfo
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
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
      </div>

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
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="bg-[#0F52BA] hover:bg-blue-700 text-white font-extrabold px-6 py-3 rounded-xl shadow-md inline-flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Landing Page Content</span>
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
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="bg-[#0F52BA] hover:bg-blue-700 text-white font-extrabold px-6 py-3 rounded-xl shadow-md inline-flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save About & Contact Info</span>
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
              className="bg-[#0F52BA] hover:bg-blue-700 text-white font-extrabold px-6 py-2.5 rounded-xl shadow-xs inline-flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save General Info</span>
            </button>
          </div>
        </form>
      )}

    </div>
  );
}
