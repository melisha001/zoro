import React, { useState, useEffect } from 'react';
import { BookOpen, Award, Layers, Clock, Video, FileText, CheckCircle2, UserCheck, Search, Send, AlertCircle, Plus, Check } from 'lucide-react';
import { getCourses, getTrainerCourseRequests, createTrainerCourseRequest } from '../../api/courseApi';
import { resolveFileUrl } from '../../api/fileApi';
import { useAuth } from '../../context/AuthContext';

function matchesTrainer(course, user) {
  if (!course || !user) return false;
  if (course.trainerId && user.id && course.trainerId === user.id) return true;
  const assigned = course.assignedTrainer || course.trainerName || course.trainer;
  if (!assigned || assigned === 'None (Self-Paced)' || assigned === 'Unassigned') return false;
  const a = String(assigned).toLowerCase().trim();
  const name = String(user.name || '').toLowerCase().trim();
  const email = String(user.email || '').toLowerCase().trim();
  if (name && (a === name || a.includes(name) || name.includes(a))) return true;
  if (email && a === email) return true;
  return false;
}

function formatModulesDuration(modules) {
  if (!modules || modules.length === 0) return '';
  let totalSec = 0;
  let hasValid = false;
  for (const m of modules) {
    if (!m.duration) continue;
    const dur = m.duration.trim();
    if (/^\d+:\d+(:\d+)?$/.test(dur)) {
      const parts = dur.split(':').map(Number);
      if (parts.length === 2) {
        totalSec += parts[0] * 60 + parts[1];
        hasValid = true;
      } else if (parts.length === 3) {
        totalSec += parts[0] * 3600 + parts[1] * 60 + parts[2];
        hasValid = true;
      }
    } else {
      const hrs = dur.match(/(\d+)\s*(h|hr|hrs|hour|hours)/i);
      const mins = dur.match(/(\d+)\s*(m|min|mins|minute|minutes)/i);
      if (hrs || mins) {
        if (hrs) totalSec += parseInt(hrs[1], 10) * 3600;
        if (mins) totalSec += parseInt(mins[1], 10) * 60;
        hasValid = true;
      }
    }
  }
  if (!hasValid || totalSec <= 0) return '';
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  if (m > 0) return s > 0 ? `${m}m ${s}s` : `${m} mins`;
  return `${s}s`;
}

export default function TrainerCoursesPage() {
  const { user } = useAuth();
  const trainerId = user?.id || '';
  const trainerName = user?.name || '';
  const trainerEmail = user?.email || '';

  const [activeSubTab, setActiveSubTab] = useState('enrolled'); // 'enrolled' | 'available'
  const [courses, setCourses] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const loadTrainerCourses = async () => {
    setLoading(true);
    try {
      const [cRes, rRes] = await Promise.all([
        getCourses(),
        getTrainerCourseRequests()
      ]);

      if (cRes.success && Array.isArray(cRes.data)) {
        setCourses(cRes.data);
      }
      if (rRes.success && Array.isArray(rRes.data)) {
        setRequests(rRes.data);
      }
    } catch (err) {
      console.error('Failed to load trainer courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrainerCourses();
  }, [trainerEmail]);

  const handleRequestCourse = async (course) => {
    const existingReq = getRequestForCourse(course.id, course.title);
    if (existingReq && existingReq.status === 'Pending') {
      setToastMsg(`Your access request for "${course.title}" is currently pending Admin approval.`);
      setTimeout(() => setToastMsg(''), 4000);
      return;
    }
    const res = await createTrainerCourseRequest({
      trainerId,
      trainerName,
      trainerEmail,
      courseId: course.id,
      courseTitle: course.title
    });
    if (res.success) {
      setToastMsg(`Access request for "${course.title}" submitted successfully! Admin has been notified.`);
      setTimeout(() => setToastMsg(''), 4000);
      await loadTrainerCourses();
    }
  };

  const getRequestForCourse = (courseId, courseTitle) => {
    return requests.find(r => 
      ((trainerId && r.trainerId === trainerId) ||
       (trainerEmail && r.trainerEmail === trainerEmail) || 
       (trainerName && r.trainerName === trainerName)) && 
      (r.courseId === courseId || r.courseTitle === courseTitle)
    );
  };

  // Requirement 2.1: ONLY display courses where course.audience === 'trainer'. No fallback to student courses!
  const legitimateCourses = courses.filter(c => c.audience === 'trainer');

  // Requirement 2.2: Distinguish Enrolled / Active vs Available courses for trainer
  const enrolledCourses = legitimateCourses.filter(c => {
    const req = getRequestForCourse(c.id, c.title);
    return matchesTrainer(c, user) || (req && req.status === 'Approved');
  });

  const availableCourses = legitimateCourses.filter(c => {
    const isEnrolled = enrolledCourses.some(e => e.id === c.id);
    return !isEnrolled;
  });

  const currentTabCourses = activeSubTab === 'enrolled' ? enrolledCourses : availableCourses;

  const filteredCourses = currentTabCourses.filter(c => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      (c.title && c.title.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-50 min-h-screen">
      
      {toastMsg && (
        <div className="p-4 bg-emerald-600 text-white font-bold text-xs rounded-2xl shadow-lg flex items-center justify-between">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg('')} className="p-1 hover:bg-emerald-700 rounded-lg">✕</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 bg-purple-100 text-purple-800 font-extrabold text-[10px] px-3 py-1 rounded-full uppercase tracking-wider">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Trainer Portal Access</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Trainer's Courses
          </h1>
          <p className="text-xs text-slate-500 font-semibold">
            Assigned teaching modules and legitimate professional trainer programs for {trainerName}.
          </p>
        </div>

        {/* Tab Selection: Enrolled / Active vs Available (Requirement 8) */}
        <div className="flex bg-slate-200/80 p-1 rounded-2xl gap-1 text-xs font-black">
          <button
            onClick={() => setActiveSubTab('enrolled')}
            className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'enrolled' ? 'bg-purple-700 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Enrolled / Active ({enrolledCourses.length})
          </button>
          <button
            onClick={() => setActiveSubTab('available')}
            className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'available' ? 'bg-purple-700 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Available Courses ({availableCourses.length})
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search trainer courses by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 text-xs font-bold text-slate-400">
          Loading trainer courses...
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <BookOpen className="w-12 h-12 text-purple-300 mx-auto" />
          <h3 className="text-base font-black text-slate-800">
            No {activeSubTab === 'enrolled' ? 'Enrolled / Active' : 'Available'} Trainer Courses Found
          </h3>
          <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
            {activeSubTab === 'enrolled' 
              ? 'You do not have any actively assigned or approved teaching courses yet.'
              : 'There are no additional available trainer courses to request at this moment.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredCourses.map((course) => {
            const req = getRequestForCourse(course.id, course.title);
            const isAssignedToMe = matchesTrainer(course, user);

            return (
              <div key={course.id} className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden flex flex-col justify-between group hover:shadow-lg transition-shadow">
                
                <div>
                  {/* Course Thumbnail */}
                  <div className="relative h-48 bg-slate-900 overflow-hidden">
                    <img
                      src={resolveFileUrl(course.thumbnail) || 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=800'}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=800';
                      }}
                    />
                    <div className="absolute top-3 right-3 bg-purple-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full shadow">
                      {isAssignedToMe ? 'Assigned Educator' : 'Trainer Course'}
                    </div>

                    {/* Requirement 10.2: Course Duration Display */}
                    <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-xl shadow flex items-center space-x-2">
                      <Clock className="w-3.5 h-3.5 text-purple-400" />
                      <span>Duration: {course.duration || formatModulesDuration(course.modules) || 'Flexible'}</span>
                    </div>
                  </div>

                  {/* Content Details */}
                  <div className="p-6 space-y-4">
                    <div>
                      {course.category && (
                        <div className="text-[10px] font-extrabold text-purple-600 uppercase tracking-wider">
                          {course.category}
                        </div>
                      )}
                      <h2 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
                        {course.title}
                      </h2>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {course.description}
                    </p>

                    {/* Program Highlights */}
                    {course.benefits && course.benefits.length > 0 && (
                      <div className="space-y-1.5 pt-2">
                        <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Program Highlights</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {course.benefits.slice(0, 4).map((benefit, idx) => (
                            <div key={idx} className="flex items-center space-x-2 text-xs font-semibold text-slate-700 bg-slate-50 p-2 rounded-xl border border-slate-100">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span className="truncate">{benefit}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Fee & Mode Specs */}
                    <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200/60 text-xs">
                      <div>
                        <div className="text-slate-400 font-semibold text-[10px]">Course Fee</div>
                        <div className="font-extrabold text-emerald-600 text-xs mt-0.5">
                          {course.price != null && Number(course.price) > 0 ? `₹${Number(course.price).toLocaleString('en-IN')}` : 'Free'}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400 font-semibold text-[10px]">Mode</div>
                        <div className="font-extrabold text-slate-800 text-xs mt-0.5">{course.mode || 'Online'}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 font-semibold text-[10px]">Duration</div>
                        <div className="font-extrabold text-purple-900 text-xs mt-0.5">{course.duration || formatModulesDuration(course.modules) || 'Flexible'}</div>
                      </div>
                    </div>

                  </div>
                </div>

                <div className="p-6 pt-0 border-t border-slate-100 mt-2">
                  <div className="pt-4 flex items-center justify-between text-xs font-bold text-slate-500">
                    <div className="flex items-center space-x-1 text-purple-700 font-extrabold">
                      <Layers className="w-4 h-4" />
                      <span>{(course.modules || []).length} {(course.modules || []).length === 1 ? 'Module' : 'Modules'}{formatModulesDuration(course.modules) ? ` • ${formatModulesDuration(course.modules)}` : ''}</span>
                    </div>

                    {isAssignedToMe || (req && req.status === 'Approved') ? (
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-full text-xs font-extrabold flex items-center space-x-1">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Enrolled / Active Access</span>
                      </span>
                    ) : req && req.status === 'Pending' ? (
                      <button
                        type="button"
                        disabled={true}
                        className="bg-amber-100 text-amber-900 border border-amber-300 px-4 py-2 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 cursor-not-allowed opacity-80"
                      >
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Request Sent</span>
                      </button>
                    ) : req && req.status === 'Rejected' ? (
                      <button
                        type="button"
                        onClick={() => handleRequestCourse(course)}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold px-4 py-2 rounded-xl shadow-xs text-xs flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Request Again</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRequestCourse(course)}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold px-4 py-2 rounded-xl shadow-xs text-xs flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Request Access / Enquire</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
