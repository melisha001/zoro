import { apiGet, apiPut, apiResponse } from './client';

const DEFAULT_WEBSITE_SETTINGS = {
  landingPageContent: {
    heroBadge: 'Learn Today. Grow Tomorrow.',
    heroHeading: 'Skills for a Brighter Tomorrow',
    heroDescription: 'Build skills. Boost confidence. Unlock potential through world-class interactive live classes tailored for children aged 5 to 16.',
    heroPrimaryBtnText: 'Explore Courses',
    heroSecondaryBtnText: 'Join a Competition',
    featuresTitle: 'Featured Learning Programs',
    featuresSubtitle: 'Empowering children with lifelong cognitive abilities and practical skills.',
    spotlightTitle: 'National Championship & Competitions Spotlight',
    spotlightSubtitle: 'Participate in nationwide academic showdowns and win certificates and badges.'
  },
  aboutPageContent: {
    heading: 'About Zoro English Academy',
    subtitle: 'Nurturing Young Minds Through Small Steps and Big Communication.',
    introParagraph: 'Zoro English Academy is dedicated to empowering students with exceptional communication, phonics, grammar, public speaking, and analytical skills. Our structured curriculum and passionate educators ensure every child steps forward with confidence.',
    missionStatement: 'To make world-class skill development accessible, engaging, and transformative for every child.',
    visionStatement: 'Creating a global generation of articulate, confident, and empathetic leaders of tomorrow.',
    coreValues: 'Excellence, Continuous Growth, Integrity, Student-Centric Empathy'
  },
  contactPageContent: {
    heading: 'Contact Us',
    subtitle: 'We are here to support your child\'s learning journey. Get in touch with our team.',
    contactPhone: '+91 98765 43210',
    contactEmail: 'contact@zoroacademy.com',
    contactAddress: 'No. 12, Main Road, Skill Nagar, Chennai - 600001, Tamil Nadu, India',
    businessHours: 'Monday – Saturday: 9:00 AM – 7:00 PM IST',
    googleMapLink: 'https://maps.google.com'
  },
  portalControls: {
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
  }
};

export const getWebsiteSettings = async () => {
  const res = await apiGet('/website-settings');
  if (res && res.success && res.data) {
    let parsedJson = null;
    if (res.data.settingsJson) {
      try {
        parsedJson = typeof res.data.settingsJson === 'string'
          ? JSON.parse(res.data.settingsJson)
          : res.data.settingsJson;
      } catch (e) {}
    }

    const merged = {
      ...DEFAULT_WEBSITE_SETTINGS,
      ...(parsedJson || {}),
      landingPageContent: {
        ...DEFAULT_WEBSITE_SETTINGS.landingPageContent,
        heroHeading: res.data.heroHeadline || parsedJson?.landingPageContent?.heroHeading || DEFAULT_WEBSITE_SETTINGS.landingPageContent.heroHeading,
        heroDescription: res.data.heroSubheadline || parsedJson?.landingPageContent?.heroDescription || DEFAULT_WEBSITE_SETTINGS.landingPageContent.heroDescription,
        ...(parsedJson?.landingPageContent || {})
      },
      contactPageContent: {
        ...DEFAULT_WEBSITE_SETTINGS.contactPageContent,
        contactEmail: res.data.contactEmail || DEFAULT_WEBSITE_SETTINGS.contactPageContent.contactEmail,
        contactPhone: res.data.contactPhone || DEFAULT_WEBSITE_SETTINGS.contactPageContent.contactPhone,
        contactAddress: res.data.address || DEFAULT_WEBSITE_SETTINGS.contactPageContent.contactAddress,
        ...(parsedJson?.contactPageContent || {})
      }
    };
    return apiResponse(merged);
  }
  return apiResponse(DEFAULT_WEBSITE_SETTINGS);
};

export const saveWebsiteSettings = async (newSettingsData) => {
  const { data: current } = await getWebsiteSettings();
  const updated = {
    ...current,
    ...newSettingsData
  };

  const payload = {
    heroHeadline: updated.landingPageContent?.heroHeading,
    heroSubheadline: updated.landingPageContent?.heroDescription,
    contactEmail: updated.contactPageContent?.contactEmail,
    contactPhone: updated.contactPageContent?.contactPhone,
    address: updated.contactPageContent?.contactAddress,
    settingsJson: JSON.stringify(updated)
  };

  const res = await apiPut('/website-settings', payload);
  if (res && res.success) {
    return apiResponse(updated);
  }
  return apiResponse(updated);
};
