-- Seed complete default website settings
INSERT INTO website_settings (
    id,
    hero_headline,
    hero_subheadline,
    contact_email,
    contact_phone,
    address,
    banner_announcement,
    settings_json,
    updated_at
)
VALUES (
    'default',
    'Skills for a Brighter Tomorrow',
    'Build skills. Boost confidence. Unlock potential through world-class interactive live classes tailored for children aged 5 to 16.',
    'contact@zoroacademy.com',
    '+91 98765 43210',
    'No. 12, Main Road, Skill Nagar, Chennai - 600001, Tamil Nadu, India',
    '🎉 Admissions open for new batches! Enroll now for early bird discount.',
    '{
      "landingPageContent": {
        "heroBadge": "Learn Today. Grow Tomorrow.",
        "heroHeading": "Skills for a Brighter Tomorrow",
        "heroDescription": "Build skills. Boost confidence. Unlock potential through world-class interactive live classes tailored for children aged 5 to 16.",
        "heroPrimaryBtnText": "Explore Courses",
        "heroSecondaryBtnText": "Join a Competition",
        "featuresTitle": "Featured Learning Programs",
        "featuresSubtitle": "Empowering children with lifelong cognitive abilities and practical skills.",
        "spotlightTitle": "National Championship & Competitions Spotlight",
        "spotlightSubtitle": "Participate in nationwide academic showdowns and win certificates and badges."
      },
      "aboutPageContent": {
        "heading": "About Zoro English Academy",
        "subtitle": "Nurturing Young Minds Through Small Steps and Big Communication.",
        "introParagraph": "Zoro English Academy is dedicated to empowering students with exceptional communication, phonics, grammar, public speaking, and analytical skills. Our structured curriculum and passionate educators ensure every child steps forward with confidence.",
        "missionStatement": "To make world-class skill development accessible, engaging, and transformative for every child.",
        "visionStatement": "Creating a global generation of articulate, confident, and empathetic leaders of tomorrow.",
        "coreValues": "Excellence, Continuous Growth, Integrity, Student-Centric Empathy"
      },
      "contactPageContent": {
        "heading": "Contact Us",
        "subtitle": "We are here to support your child''s learning journey. Get in touch with our team.",
        "contactPhone": "+91 98765 43210",
        "contactEmail": "contact@zoroacademy.com",
        "contactAddress": "No. 12, Main Road, Skill Nagar, Chennai - 600001, Tamil Nadu, India",
        "businessHours": "Monday – Saturday: 9:00 AM – 7:00 PM IST",
        "googleMapLink": "https://maps.google.com"
      },
      "generalInfo": {
        "academyName": "Zoro English Academy",
        "tagline": "Small Steps Big Communication",
        "contactEmail": "contact@zoroacademy.com",
        "contactPhone": "+91 98765 43210",
        "address": "No. 12, Main Road, Skill Nagar, Chennai - 600001",
        "currency": "INR (₹)"
      }
    }'::jsonb,
    CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO UPDATE SET
    settings_json = EXCLUDED.settings_json || COALESCE(website_settings.settings_json, '{}'::jsonb),
    hero_headline = COALESCE(website_settings.hero_headline, EXCLUDED.hero_headline),
    hero_subheadline = COALESCE(website_settings.hero_subheadline, EXCLUDED.hero_subheadline),
    contact_email = COALESCE(website_settings.contact_email, EXCLUDED.contact_email),
    contact_phone = COALESCE(website_settings.contact_phone, EXCLUDED.contact_phone),
    address = COALESCE(website_settings.address, EXCLUDED.address);
