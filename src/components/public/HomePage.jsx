import React, { useState, useEffect } from 'react';
import { Award, Users, Globe, CheckCircle, ArrowRight, Play, Sparkles } from 'lucide-react';
import { COMPETITION } from '../../data/mockData';
import { getCourses } from '../../api/courseApi';

export default function HomePage({ setActiveScreen, onOpenEnquire }) {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    async function loadCourses() {
      try {
        const res = await getCourses();
        if (res.success && res.data) {
          setCourses(res.data);
        }
      } catch (err) {
        console.error('Failed to load courses on homepage', err);
      }
    }
    loadCourses();
  }, []);

  const highlights = [
    { title: 'Expert Trainers', desc: 'Certified & passionate educators', icon: Users, color: 'bg-blue-50 text-blue-600' },
    { title: 'Interactive Learning', desc: 'Live small-group online classes', icon: CheckCircle, color: 'bg-emerald-50 text-emerald-600' },
    { title: 'Global Competitions', desc: 'National & international leagues', icon: Globe, color: 'bg-purple-50 text-purple-600' },
    { title: 'Certified Programs', desc: 'Govt. recognized skill certificates', icon: Award, color: 'bg-amber-50 text-amber-600' },
  ];

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* HERO SECTION - Matching Reference Sample Screenshot */}
      <section 
        className="relative text-white overflow-hidden py-16 md:py-24 bg-cover bg-right sm:bg-center bg-no-repeat min-h-[500px] flex items-center"
        style={{ backgroundImage: "url('/assets/hero-bg.jpg')" }}
      >
        {/* Sleek Left-to-Right Dark Overlay (Dark on Left for Text, Clear on Right for Image) */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/75 to-slate-950/10"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center space-x-2 bg-blue-600/30 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-blue-400/40 text-xs font-semibold text-blue-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>India's #1 Skill Development Academy</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white">
                Skills for <br />
                <span className="text-white">
                  a Brighter Tomorrow
                </span>
              </h1>

              <div className="text-lg font-bold text-sky-200 tracking-wide">
                Abacus | English | Chess | and more
              </div>

              <p className="text-slate-200 text-base max-w-xl leading-relaxed">
                Build skills. Boost confidence. Unlock potential through world-class interactive live classes tailored for children aged 5 to 16.
              </p>

              {/* Hero Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => setActiveScreen('public-course')}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-xl font-extrabold text-sm shadow-xl hover:shadow-blue-500/30 transition-all flex items-center space-x-2 group"
                >
                  <span>Explore Courses</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => setActiveScreen('public-competition')}
                  className="bg-white/10 hover:bg-white/20 text-white px-7 py-3.5 rounded-xl font-bold text-sm border border-white/30 backdrop-blur-md transition-all"
                >
                  Join a Competition
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* HIGHLIGHT FEATURES GRID - Wireframe Screen 1 Bottom */}
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

      {/* COURSES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Featured Learning Programs</h2>
          <p className="text-slate-500 text-sm mt-2">Empowering children with lifelong cognitive abilities and practical skills.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {courses.slice(0, 6).map((course) => (
            <div key={course.id} className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-md hover:shadow-xl transition-all group flex flex-col justify-between">
              <div>
                <div className="relative h-48 overflow-hidden bg-slate-100">
                  <img src={course.videoUrl || '/assets/hero-bg.jpg'} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <span className="absolute top-3 right-3 bg-blue-600 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow">
                    {course.ageGroup || 'Kids'}
                  </span>
                </div>
                <div className="p-6">
                  <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">{course.duration || '3 Months'} • {course.mode || 'Online'}</div>
                  <h3 className="text-xl font-bold text-slate-900 mt-1">{course.title}</h3>
                  <p className="text-slate-500 text-xs mt-2 line-clamp-2">{course.description}</p>
                </div>
              </div>
              <div className="p-6 pt-0 flex items-center justify-between border-t border-slate-100 mt-4">
                <span className="text-xs font-extrabold text-slate-700">★ {course.rating || '4.9'} ({course.enrolled || 50}+ Students)</span>
                <button 
                  onClick={() => setActiveScreen('public-course')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* NATIONAL COMPETITION SPOTLIGHT */}
      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4">
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-extrabold">
              UPCOMING EVENT 2026
            </span>
            <h2 className="text-3xl font-black">{COMPETITION.title}</h2>
            <p className="text-slate-300 text-sm max-w-xl">{COMPETITION.about}</p>
            <div className="flex items-center space-x-6 text-xs text-slate-300 pt-2">
              <div><strong className="text-white block text-base">20 Jan 2026</strong> Date</div>
              <div><strong className="text-white block text-base">₹500</strong> Registration Fee</div>
              <div><strong className="text-white block text-base">Online</strong> Mode</div>
            </div>
          </div>
          <button
            onClick={() => setActiveScreen('public-competition')}
            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black px-8 py-4 rounded-xl text-base shadow-lg transition-transform transform hover:scale-105 shrink-0"
          >
            Register Now
          </button>
        </div>
      </section>
    </div>
  );
}

