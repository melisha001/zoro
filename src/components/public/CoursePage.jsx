import React, { useState, useEffect } from 'react';
import { 
  Calculator, MessageCircle, Play, Check, ChevronDown, ChevronUp, 
  Clock, Monitor, Award, Users, FileText 
} from 'lucide-react';
import { getCourses } from '../../api/courseApi';

export default function CoursePage({ onOpenEnquire }) {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedFaq, setExpandedFaq] = useState(null);

  useEffect(() => {
    async function loadCourses() {
      try {
        const res = await getCourses();
        if (res.success && res.data) {
          setCourses(res.data);
          if (res.data.length > 0) {
            setSelectedCourseId(res.data[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load courses on course page', err);
      }
    }
    loadCourses();
  }, []);

  const selectedCourse = courses.find(c => c.id === selectedCourseId) || courses[0] || {};

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Grid: Left Sidebar + Right Course Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Course Selector Sidebar (Wireframe 2 Left Column) */}
          <div className="lg:col-span-3 space-y-2">
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <h3 className="px-3 py-2 text-xs font-black text-slate-400 uppercase tracking-wider">All Courses</h3>
              {courses.map((course) => {
                const isActive = course.id === selectedCourseId;
                return (
                  <button
                    key={course.id}
                    onClick={() => setSelectedCourseId(course.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-between ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{course.title}</span>
                    {isActive && <span className="w-2 h-2 rounded-full bg-white"></span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Main Course View (Wireframe 2 Main Panel) */}
          <div className="lg:col-span-9 space-y-8">
            
            {/* Header & Main Info */}
            {selectedCourse.id ? (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                  
                  {/* Text Content */}
                  <div className="md:col-span-7 space-y-4">
                    <div className="inline-block bg-blue-100 text-blue-700 font-extrabold text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                      Featured Course
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                      {selectedCourse.title}
                    </h1>
                    <h2 className="text-base font-bold text-blue-600">
                      {selectedCourse.subtitle || selectedCourse.level || 'Professional Certification'}
                    </h2>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      {selectedCourse.description}
                    </p>

                    {/* Course Details Box */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/60 text-xs">
                      <div>
                        <div className="text-slate-400 font-semibold">Duration</div>
                        <div className="font-extrabold text-slate-800 text-sm mt-0.5">{selectedCourse.duration || '3 Months'}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 font-semibold">Mode</div>
                        <div className="font-extrabold text-slate-800 text-sm mt-0.5">{selectedCourse.mode || 'Online'}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 font-semibold">Age Group</div>
                        <div className="font-extrabold text-slate-800 text-sm mt-0.5">{selectedCourse.ageGroup || 'Kids'}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 font-semibold">Certificate</div>
                        <div className="font-extrabold text-slate-800 text-sm mt-0.5">{selectedCourse.certificate || 'Zoro Certificate'}</div>
                      </div>
                    </div>

                    <button
                      onClick={onOpenEnquire}
                      className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-8 py-3.5 rounded-xl shadow-lg transition-transform transform hover:-translate-y-0.5"
                    >
                      Enquire Now
                    </button>
                  </div>

                  {/* Video Preview Card */}
                  <div className="md:col-span-5">
                    <div className="relative rounded-2xl overflow-hidden shadow-lg border-2 border-slate-200 group bg-slate-900">
                      <img
                        src={selectedCourse.videoUrl || '/assets/hero-bg.jpg'}
                        alt={selectedCourse.title}
                        className="w-full h-56 object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center">
                        <button className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                          <Play className="w-7 h-7 fill-current ml-1" />
                        </button>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3 text-center text-xs font-bold text-white bg-slate-900/80 backdrop-blur-sm py-1.5 px-3 rounded-lg">
                        Watch Course Demo & Syllabus Overview
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-500">
                Loading courses...
              </div>
            )}

            {/* Tabs Bar (Overview, Benefits, Curriculum, FAQs) */}
            {selectedCourse.id && (
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-8 space-y-6">
                
                <div className="flex border-b border-slate-200 space-x-6 text-sm font-bold">
                  {['overview', 'benefits', 'curriculum', 'faqs'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`pb-4 transition-all capitalize border-b-2 ${
                        activeTab === tab
                          ? 'border-blue-600 text-blue-600 font-extrabold'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Tab Content Panels */}
                {activeTab === 'overview' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-extrabold text-slate-900">Course Overview</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{selectedCourse.overview || selectedCourse.description}</p>
                  </div>
                )}

                {activeTab === 'benefits' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-extrabold text-slate-900">Key Learning Benefits</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(selectedCourse.benefits || ['Interactive live classes', 'Comprehensive curriculum', 'Certificate upon completion']).map((b, i) => (
                        <div key={i} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                          <div className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-xs shrink-0">✓</div>
                          <span className="text-xs font-bold text-slate-700">{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'curriculum' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-extrabold text-slate-900">Module Syllabus</h3>
                    <div className="space-y-2">
                      {(selectedCourse.curriculum || ['Module 1: Introduction', 'Module 2: Fundamentals', 'Module 3: Advanced Concepts', 'Module 4: Final Assessment']).map((m, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center space-x-3 text-xs font-bold text-slate-800">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span>{m}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'faqs' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-extrabold text-slate-900">Frequently Asked Questions</h3>
                    <div className="space-y-3">
                      {(selectedCourse.faqs || [
                        { q: "What is the class schedule?", a: "Classes are held twice weekly in small interactive online batches." },
                        { q: "Will I get a certificate?", a: "Yes, a verifiable certificate of completion is awarded." }
                      ]).map((faq, index) => (
                        <div key={index} className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                          <div 
                            className="flex justify-between items-center cursor-pointer font-bold text-sm text-slate-900"
                            onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                          >
                            <span>{faq.q}</span>
                            {expandedFaq === index ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                          </div>
                          {expandedFaq === index && (
                            <p className="text-xs text-slate-600 mt-2 pt-2 border-t border-slate-200/60 leading-relaxed">
                              {faq.a}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}

