import React, { useState, useEffect } from 'react';
import { Settings, Shield, CreditCard, Building, Check, Save, Globe, Sliders, Info, PhoneCall } from 'lucide-react';
import { getSettings, saveSettings } from '../../api/settingsApi';
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

  const [securitySettings, setSecuritySettings] = useState({
    autoGeneratePasswords: true,
    requirePasswordChange: false,
    sessionTimeoutMins: 60,
    notifyOnNewEnrollment: true
  });

  const [notificationTriggers, setNotificationTriggers] = useState({
    emailOnEnrollment: true,
    smsOnReminder: true,
    notifyOnDoubt: true
  });

  // Website Content & Portal Controls State
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
    visionStatement: 'Creating a global generation of articulate, confident, and empathetic leaders of tomorrow.'
  });

  const [contactPageContent, setContactPageContent] = useState({
    heading: 'Contact Us',
    subtitle: 'We are here to support your child\'s learning journey.',
    contactPhone: '+91 98765 43210',
    contactEmail: 'contact@zoroacademy.com',
    contactAddress: 'No. 12, Main Road, Skill Nagar, Chennai - 600001, Tamil Nadu, India',
    businessHours: 'Monday – Saturday: 9:00 AM – 7:00 PM IST'
  });

  const [portalControls, setPortalControls] = useState({
    adminPortal: {
      enableDailyReports: true,
      enableSalaryDisbursal: true,
      maintenanceMode: false
    },
    trainerPortal: {
      allowAssignmentCreation: true,
      showSelfAttendance: true,
      allowSubmissionsGrading: true
    },
    studentPortal: {
      enableDoubtsForum: true,
      allowSessionJoin: true,
      showAttendanceBadges: true
    },
    publicWebsite: {
      enablePublicCompetitionReg: true,
      enableEnquiryModal: true,
      showFeaturedCourses: true
    }
  });

  useEffect(() => {
    loadSettingsData();
  }, []);

  const loadSettingsData = async () => {
    try {
      const res = await getSettings();
      if (res.data) {
        if (res.data.generalInfo) setGeneralInfo(res.data.generalInfo);
        if (res.data.securitySettings) setSecuritySettings(res.data.securitySettings);
        if (res.data.notificationTriggers) setNotificationTriggers(res.data.notificationTriggers);
      }

      const webRes = await getWebsiteSettings();
      if (webRes.data) {
        if (webRes.data.landingPageContent) setLandingPageContent(webRes.data.landingPageContent);
        if (webRes.data.aboutPageContent) setAboutPageContent(webRes.data.aboutPageContent);
        if (webRes.data.contactPageContent) setContactPageContent(webRes.data.contactPageContent);
        if (webRes.data.portalControls) setPortalControls(webRes.data.portalControls);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const handleSaveAll = async (e) => {
    if (e) e.preventDefault();
    try {
      await saveSettings({
        generalInfo,
        securitySettings,
        notificationTriggers
      });

      await saveWebsiteSettings({
        landingPageContent,
        aboutPageContent,
        contactPageContent,
        portalControls
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
            Manage public website text, landing page content, about/contact info, portal functionality controls, and security policies.
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
          onClick={() => setActiveTab('portal_controls')}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'portal_controls' ? 'border-[#0F52BA] text-[#0F52BA] font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Portal Controls & Features
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
          onClick={() => setActiveTab('security')}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'security' ? 'border-[#0F52BA] text-[#0F52BA] font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          Security & Access
        </button>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>All website content, settings, and portal controls saved successfully!</span>
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

      {/* 3. PORTAL CONTROLS TAB (Requirement #20 & #21) */}
      {activeTab === 'portal_controls' && (
        <form onSubmit={handleSaveAll} className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs max-w-3xl space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-900">Portal Functionality & Access Controls</h3>
            <p className="text-slate-500 text-xs font-medium">Enable or disable specific features across Admin, Trainer, Student, and Public Portals.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Student Portal Controls */}
            <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 space-y-3">
              <h4 className="font-black text-blue-900 text-sm">Student Portal Controls</h4>

              <label className="flex items-center gap-3 text-slate-800 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={portalControls.studentPortal.enableDoubtsForum}
                  onChange={(e) => setPortalControls({
                    ...portalControls,
                    studentPortal: { ...portalControls.studentPortal, enableDoubtsForum: e.target.checked }
                  })}
                  className="rounded text-blue-600 border-slate-300 w-4 h-4"
                />
                Enable Student Doubts Forum
              </label>

              <label className="flex items-center gap-3 text-slate-800 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={portalControls.studentPortal.allowSessionJoin}
                  onChange={(e) => setPortalControls({
                    ...portalControls,
                    studentPortal: { ...portalControls.studentPortal, allowSessionJoin: e.target.checked }
                  })}
                  className="rounded text-blue-600 border-slate-300 w-4 h-4"
                />
                Allow Direct Live Session Joining
              </label>

              <label className="flex items-center gap-3 text-slate-800 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={portalControls.studentPortal.showAttendanceBadges}
                  onChange={(e) => setPortalControls({
                    ...portalControls,
                    studentPortal: { ...portalControls.studentPortal, showAttendanceBadges: e.target.checked }
                  })}
                  className="rounded text-blue-600 border-slate-300 w-4 h-4"
                />
                Display Attendance Percentage Badges
              </label>
            </div>

            {/* Trainer Portal Controls */}
            <div className="bg-purple-50/50 p-5 rounded-2xl border border-purple-100 space-y-3">
              <h4 className="font-black text-purple-900 text-sm">Trainer Portal Controls</h4>

              <label className="flex items-center gap-3 text-slate-800 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={portalControls.trainerPortal.allowAssignmentCreation}
                  onChange={(e) => setPortalControls({
                    ...portalControls,
                    trainerPortal: { ...portalControls.trainerPortal, allowAssignmentCreation: e.target.checked }
                  })}
                  className="rounded text-purple-600 border-slate-300 w-4 h-4"
                />
                Allow Assignment Creation
              </label>

              <label className="flex items-center gap-3 text-slate-800 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={portalControls.trainerPortal.showSelfAttendance}
                  onChange={(e) => setPortalControls({
                    ...portalControls,
                    trainerPortal: { ...portalControls.trainerPortal, showSelfAttendance: e.target.checked }
                  })}
                  className="rounded text-purple-600 border-slate-300 w-4 h-4"
                />
                Enable Trainer Attendance Self-Marking
              </label>
            </div>

            {/* Public Website Controls */}
            <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 space-y-3">
              <h4 className="font-black text-emerald-900 text-sm">Public Website Controls</h4>

              <label className="flex items-center gap-3 text-slate-800 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={portalControls.publicWebsite.enablePublicCompetitionReg}
                  onChange={(e) => setPortalControls({
                    ...portalControls,
                    publicWebsite: { ...portalControls.publicWebsite, enablePublicCompetitionReg: e.target.checked }
                  })}
                  className="rounded text-emerald-600 border-slate-300 w-4 h-4"
                />
                Enable Public Competition Registrations
              </label>

              <label className="flex items-center gap-3 text-slate-800 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={portalControls.publicWebsite.enableEnquiryModal}
                  onChange={(e) => setPortalControls({
                    ...portalControls,
                    publicWebsite: { ...portalControls.publicWebsite, enableEnquiryModal: e.target.checked }
                  })}
                  className="rounded text-emerald-600 border-slate-300 w-4 h-4"
                />
                Enable Online Enquiry Form Modal
              </label>
            </div>

            {/* Admin Portal Controls */}
            <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100 space-y-3">
              <h4 className="font-black text-amber-900 text-sm">Admin Portal Controls</h4>

              <label className="flex items-center gap-3 text-slate-800 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={portalControls.adminPortal.enableDailyReports}
                  onChange={(e) => setPortalControls({
                    ...portalControls,
                    adminPortal: { ...portalControls.adminPortal, enableDailyReports: e.target.checked }
                  })}
                  className="rounded text-amber-600 border-slate-300 w-4 h-4"
                />
                Enable Admin Daily Reports View
              </label>

              <label className="flex items-center gap-3 text-slate-800 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={portalControls.adminPortal.enableSalaryDisbursal}
                  onChange={(e) => setPortalControls({
                    ...portalControls,
                    adminPortal: { ...portalControls.adminPortal, enableSalaryDisbursal: e.target.checked }
                  })}
                  className="rounded text-amber-600 border-slate-300 w-4 h-4"
                />
                Allow Trainer Salary Disbursal Marking
              </label>
            </div>

          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="bg-[#0F52BA] hover:bg-blue-700 text-white font-extrabold px-6 py-3 rounded-xl shadow-md inline-flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Update Portal Controls</span>
            </button>
          </div>
        </form>
      )}

      {/* 4. GENERAL TAB */}
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

      {/* 5. SECURITY TAB */}
      {activeTab === 'security' && (
        <form onSubmit={handleSaveAll} className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs max-w-2xl space-y-4">
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

            <div className="pt-2">
              <label className="block font-bold text-slate-700 mb-1">Session Timeout (Minutes)</label>
              <input
                type="number"
                value={securitySettings.sessionTimeoutMins || 60}
                onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeoutMins: Number(e.target.value) })}
                className="w-32 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="bg-[#0F52BA] hover:bg-blue-700 text-white font-extrabold px-6 py-2.5 rounded-xl shadow-xs inline-flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Update Security Policies</span>
            </button>
          </div>
        </form>
      )}

    </div>
  );
}
