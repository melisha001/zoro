import React, { useState, useEffect } from 'react';
import { Award, Users, Globe, CheckCircle, ArrowRight, Play, Sparkles } from 'lucide-react';
import { getCourses } from '../../api/courseApi';
import { getCompetitions } from '../../api/competitionApi';
import { getWebsiteSettings } from '../../api/websiteSettingsApi';
import { resolveFileUrl } from '../../api/fileApi';
import { formatDate } from '../../utils/dateFormatter';

export default function HomePage({ setActiveScreen, onOpenEnquire }) {
  const [courses, setCourses] = useState([]);
  const [featuredComp, setFeaturedComp] = useState(null);
  const [siteSettings, setSiteSettings] = useState(null);

  useEffect(() => {
    async function loadHomeData() {
      try {
        const sRes = await getWebsiteSettings();
        if (sRes.success && sRes.data) {
          setSiteSettings(sRes.data);
        }

        const cRes = await getCourses();
        if (cRes.success && Array.isArray(cRes.data)) {
          // Filter ONLY Student courses for Public Landing Page
          const studentCourses = cRes.data.filter(c => (c.audience || 'student') === 'student');
          setCourses(studentCourses);
        }

        const compRes = await getCompetitions();
        if (compRes.success && Array.isArray(compRes.data)) {
          // Filter ONLY Active competitions for Public Landing Page (Requirement #7 & #8)
          const activeComps = compRes.data.filter(c => (c.status || '').toLowerCase() === 'active');
          if (activeComps.length > 0) {
            setFeaturedComp(activeComps[0]); // Dynamically select FIRST active competition
          } else {
            setFeaturedComp(null);
          }
        }
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      }
    }
    loadHomeData();
  }, []);

  const highlights = [
    { title: 'Expert Trainers', desc: 'Certified & passionate educators', icon: Users, color: 'bg-blue-50 text-blue-600' },
    { title: 'Interactive Learning', desc: 'Live small-group online classes', icon: CheckCircle, color: 'bg-emerald-50 text-emerald-600' },
    { title: 'Global Competitions', desc: 'National & international leagues', icon: Globe, color: 'bg-purple-50 text-purple-600' },
    { title: 'Certified Programs', desc: 'Govt. recognized skill certificates', icon: Award, color: 'bg-amber-50 text-amber-600' },
  ];

  const defaultThumbnailFallback = 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=800';

  const landingContent = siteSettings?.landingPageContent || {
    heroBadge: 'Learn Today. Grow Tomorrow.',
    heroHeading: 'Skills for a Brighter Tomorrow',
    heroDescription: 'Build skills. Boost confidence. Unlock potential through world-class interactive live classes tailored for children aged 5 to 16.',
    heroPrimaryBtnText: 'Explore Courses',
    heroSecondaryBtnText: 'Join a Competition',
    featuresTitle: 'Featured Learning Programs',
    featuresSubtitle: 'Empowering children with lifelong cognitive abilities and practical skills.',
    spotlightTitle: 'National Championship & Competitions Spotlight'
  };

  const showCourses = siteSettings?.portalControls?.publicWebsite?.showFeaturedCourses !== false;

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* HERO SECTION */}
      <section 
        className="relative text-white overflow-hidden py-16 md:py-24 bg-cover bg-right sm:bg-center bg-no-repeat min-h-[500px] flex items-center"
        style={{ backgroundImage: "url('/assets/hero-bg.jpg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/75 to-slate-950/10"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center space-x-2 bg-blue-600/30 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-blue-400/40 text-xs font-semibold text-blue-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{landingContent.heroBadge}</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white">
                {landingContent.heroHeading}
              </h1>

              <p className="text-slate-200 text-base max-w-xl leading-relaxed">
                {landingContent.heroDescription}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => setActiveScreen('public-course')}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-xl font-extrabold text-sm shadow-xl hover:shadow-blue-500/30 transition-all flex items-center space-x-2 group cursor-pointer"
                >
                  <span>{landingContent.heroPrimaryBtnText}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => setActiveScreen('public-competition')}
                  className="bg-white/10 hover:bg-white/20 text-white px-7 py-3.5 rounded-xl font-bold text-sm border border-white/30 backdrop-blur-md transition-all cursor-pointer"
                >
                  {landingContent.heroSecondaryBtnText}
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* HIGHLIGHT FEATURES GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {highlights.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={idx} 
                className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl border border-slate-100 transition-all transform hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${item.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">{item.title}</h3>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* COURSES SECTION - Dynamic Course Thumbnail Handling (Requirement #2 & #3) */}
      {showCourses && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">{landingContent.featuresTitle}</h2>
            <p className="text-slate-500 text-sm mt-2">{landingContent.featuresSubtitle}</p>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {courses.slice(0, 6).map((course) => {
            const courseImg = resolveFileUrl(course.thumbnail || course.videoUrl) || defaultThumbnailFallback;

            return (
              <div key={course.id} className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-md hover:shadow-xl transition-all group flex flex-col justify-between">
                <div>
                  <div className="relative h-48 overflow-hidden bg-slate-100">
                    <img 
                      src={courseImg} 
                      alt={course.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src = defaultThumbnailFallback;
                      }}
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                      <span className="text-blue-600">{course.duration || '3 Months'} • {course.mode || 'Online'}</span>
                      <span className="text-emerald-600 font-black">
                        {course.price != null && Number(course.price) > 0 ? `₹${Number(course.price).toLocaleString('en-IN')}` : 'Free'}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mt-1">{course.title}</h3>
                    <p className="text-slate-500 text-xs mt-2 line-clamp-2">{course.description}</p>
                  </div>
                </div>
                <div className="p-6 pt-0 flex items-center justify-between border-t border-slate-100 mt-4">
                  <span className="text-xs font-extrabold text-slate-700">★ {course.rating || '4.9'} ({course.enrolled || 50}+ Students)</span>
                  <button 
                    onClick={() => setActiveScreen('public-course')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1 cursor-pointer"
                  >
                    <span>View Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      )}

      {/* NATIONAL COMPETITION SPOTLIGHT - Dynamic Sync */}
      {featuredComp && (() => {
        const compTitle = featuredComp.title || featuredComp.name || 'Competition';
        const compFee = Number(featuredComp.registrationFee || 0);

        return (
          <section className="bg-slate-900 text-white py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider">
                    {featuredComp.status || 'Active Event'}
                  </span>
                  {featuredComp.category && (
                    <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider">
                      {featuredComp.category}
                    </span>
                  )}
                </div>

                <h2 className="text-3xl font-black">{compTitle}</h2>
                {featuredComp.description && (
                  <p className="text-slate-300 text-sm max-w-xl line-clamp-3">{featuredComp.description}</p>
                )}

                <div className="flex flex-wrap items-center gap-6 text-xs text-slate-300 pt-2">
                  {(featuredComp.regStartDate || featuredComp.regEndDate) && (
                    <div>
                      <strong className="text-blue-300 block text-sm sm:text-base font-bold">
                        {formatDate(featuredComp.regStartDate)}{featuredComp.regEndDate ? ` – ${formatDate(featuredComp.regEndDate)}` : ''}
                      </strong> 
                      Registration Dates
                    </div>
                  )}

                  {(featuredComp.startDate || featuredComp.endDate) && (
                    <div>
                      <strong className="text-white block text-sm sm:text-base font-bold">
                        {formatDate(featuredComp.startDate)}{featuredComp.endDate && featuredComp.endDate !== featuredComp.startDate ? ` – ${formatDate(featuredComp.endDate)}` : ''}
                      </strong> 
                      Competition Dates
                    </div>
                  )}

                  {(featuredComp.startTime || featuredComp.endTime) && (
                    <div>
                      <strong className="text-white block text-sm sm:text-base font-bold">
                        {featuredComp.startTime}{featuredComp.endTime ? ` - ${featuredComp.endTime}` : ''}
                      </strong> 
                      Timing
                    </div>
                  )}

                  <div>
                    <strong className="text-emerald-400 block text-sm sm:text-base font-black">
                      {compFee > 0 ? `₹${compFee.toLocaleString('en-IN')}` : 'FREE'}
                    </strong> 
                    Fee
                  </div>

                  {featuredComp.venue && (
                    <div>
                      <strong className="text-white block text-sm sm:text-base font-bold">
                        {featuredComp.venue}
                      </strong> 
                      Venue
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => setActiveScreen('public-competition')}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black px-8 py-4 rounded-xl text-base shadow-lg transition-transform transform hover:scale-105 shrink-0 cursor-pointer"
              >
                Explore Competition
              </button>
            </div>
          </section>
        );
      })()}

      {/* ABOUT SECTION (Database-backed from website settings) */}
      <section id="about" className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-black tracking-wider uppercase bg-blue-100 text-blue-700 px-3.5 py-1.5 rounded-full">
              About Zoro Academy
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {siteSettings?.aboutPageContent?.heading || 'About Zoro English Academy'}
            </h2>
            <p className="text-base text-slate-600 font-medium">
              {siteSettings?.aboutPageContent?.subtitle || 'Nurturing Young Minds Through Small Steps and Big Communication.'}
            </p>
          </div>

          <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-sm space-y-8">
            <p className="text-slate-700 leading-relaxed text-base font-normal">
              {siteSettings?.aboutPageContent?.introParagraph || 'Zoro English Academy is dedicated to empowering students with exceptional communication, phonics, grammar, public speaking, and analytical skills. Our structured curriculum and passionate educators ensure every child steps forward with confidence.'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
              <div className="p-6 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-2">
                <span className="text-xs font-extrabold text-blue-800 uppercase tracking-wider">Our Mission</span>
                <p className="text-sm text-slate-700 font-medium">
                  {siteSettings?.aboutPageContent?.missionStatement || 'To make world-class skill development accessible, engaging, and transformative for every child.'}
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-2">
                <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider">Our Vision</span>
                <p className="text-sm text-slate-700 font-medium">
                  {siteSettings?.aboutPageContent?.visionStatement || 'Creating a global generation of articulate, confident, and empathetic leaders of tomorrow.'}
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-2">
                <span className="text-xs font-extrabold text-purple-800 uppercase tracking-wider">Core Values</span>
                <p className="text-sm text-slate-700 font-medium">
                  {siteSettings?.aboutPageContent?.coreValues || 'Excellence, Continuous Growth, Integrity, Student-Centric Empathy'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT SECTION (Database-backed from website settings) */}
      <section id="contact" className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-black tracking-wider uppercase bg-emerald-100 text-emerald-800 px-3.5 py-1.5 rounded-full">
              Get in Touch
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {siteSettings?.contactPageContent?.heading || 'Contact Us'}
            </h2>
            <p className="text-base text-slate-600 font-medium">
              {siteSettings?.contactPageContent?.subtitle || "We are here to support your child's learning journey. Get in touch with our team."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 space-y-6">
              <h3 className="text-xl font-black text-slate-900">Academy Contact Information</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Phone</span>
                  <a href={`tel:${siteSettings?.contactPageContent?.contactPhone || '+919876543210'}`} className="font-extrabold text-blue-600 hover:underline">
                    {siteSettings?.contactPageContent?.contactPhone || '+91 98765 43210'}
                  </a>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Email</span>
                  <a href={`mailto:${siteSettings?.contactPageContent?.contactEmail || 'contact@zoroacademy.com'}`} className="font-extrabold text-blue-600 hover:underline">
                    {siteSettings?.contactPageContent?.contactEmail || 'contact@zoroacademy.com'}
                  </a>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Address</span>
                  <p className="font-semibold text-slate-800">
                    {siteSettings?.contactPageContent?.contactAddress || 'No. 12, Main Road, Skill Nagar, Chennai - 600001, Tamil Nadu, India'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Working Hours</span>
                  <p className="font-semibold text-slate-800">
                    {siteSettings?.contactPageContent?.businessHours || 'Monday – Saturday: 9:00 AM – 7:00 PM IST'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-900 to-slate-900 text-white p-8 sm:p-10 rounded-3xl shadow-xl flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <span className="text-xs font-black tracking-wider uppercase text-blue-300">Admission Enquiries</span>
                <h3 className="text-2xl font-black text-white">Have questions about our programs?</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Speak directly with our academic counselors to understand batch timings, fees, curriculum, and free demo sessions.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenEnquire}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black py-4 px-8 rounded-2xl shadow-lg transition text-center cursor-pointer"
              >
                Enquire Now
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
