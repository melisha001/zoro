import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Video, Link, Calendar, Clock, User, Layers, CheckCircle2 } from 'lucide-react';
import { createCourse } from '../../api/courseApi';
import { getTrainers } from '../../api/userApi';
import FileUploader from '../common/FileUploader';

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AddCoursePage({ setActiveScreen }) {
  const [trainersList, setTrainersList] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: '3 Months',
    fee: '15000',
    fees: '15000',
    mode: 'Online', // 'Online' | 'Recorded' | 'Hybrid'
    audience: 'student', // 'student' | 'trainer'
    ageGroup: '7-12 Years',
    certificate: 'Yes',
    trainerId: '',
    assignedTrainer: '',
    googleMeetUrl: '',
    classDays: ['Monday', 'Wednesday', 'Friday'],
    startTime: '05:00 PM',
    endTime: '06:00 PM',
    youtubeUrl: '',
    overview: '',
    thumbnail: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=800'
  });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function fetchTrainers() {
      try {
        const res = await getTrainers();
        const list = res.data || [];
        setTrainersList(list);
      } catch (err) {
        console.error('Failed to load trainers:', err);
      }
    }
    fetchTrainers();
  }, []);

  const handleToggleDay = (dayName) => {
    const current = formData.classDays || [];
    let updated;
    if (current.includes(dayName)) {
      updated = current.filter(d => d !== dayName);
    } else {
      updated = [...current, dayName];
    }
    setFormData({ ...formData, classDays: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.audience) {
      setErrorMsg('Course For selection is required. Please select Student or Trainer.');
      return;
    }
    if (formData.mode !== 'Recorded' && (!formData.trainerId || !formData.assignedTrainer)) {
      setErrorMsg(`A real trainer is required for ${formData.mode} courses. Please select a trainer.`);
      return;
    }
    setErrorMsg('');
    setSaving(true);
    await createCourse({
      ...formData,
      trainerId: formData.trainerId || null,
      assignedTrainer: formData.assignedTrainer || (formData.mode === 'Recorded' ? 'None (Self-Paced)' : ''),
      audience: formData.audience || 'student',
      fee: Number(formData.fee || 15000),
      fees: Number(formData.fees || formData.fee || 15000)
    });
    setSaving(false);
    setActiveScreen('admin-manage-courses');
  };

  const isOnlineOrHybrid = formData.mode === 'Online' || formData.mode === 'Hybrid';
  const isRecordedOrHybrid = formData.mode === 'Recorded' || formData.mode === 'Hybrid';

  return (
    <div className="p-6 sm:p-8 space-y-6 bg-slate-50 min-h-screen">
      <button
        onClick={() => setActiveScreen('admin-manage-courses')}
        className="inline-flex items-center space-x-2 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Course Management</span>
      </button>

      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Add New Course</h1>
          <p className="text-xs text-slate-500 font-medium">Configure course details, target audience (Student/Trainer), mode, and settings.</p>
        </div>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-md max-w-4xl">
        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl flex items-center justify-between">
            <span>⚠️ {errorMsg}</span>
            <button type="button" onClick={() => setErrorMsg('')} className="text-rose-500 hover:text-rose-700 font-extrabold">✕</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Course Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Advanced English Grammar"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Course Description *</label>
            <textarea
              rows={3}
              required
              placeholder="Short course description..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Duration Value *</label>
              <input
                type="number"
                min="1"
                required
                placeholder="3"
                value={formData.durationValue || '3'}
                onChange={(e) => {
                  const val = e.target.value;
                  const unit = formData.durationUnit || 'Months';
                  setFormData({ ...formData, durationValue: val, duration: `${val} ${unit}` });
                }}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Duration Unit *</label>
              <select
                value={formData.durationUnit || 'Months'}
                onChange={(e) => {
                  const unit = e.target.value;
                  const val = formData.durationValue || '3';
                  setFormData({ ...formData, durationUnit: unit, duration: `${val} ${unit}` });
                }}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white cursor-pointer"
              >
                <option value="Months">Months</option>
                <option value="Month">Month</option>
                <option value="Years">Years</option>
                <option value="Year">Year</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Course Fee (₹)</label>
              <input
                type="number"
                placeholder="15000"
                value={formData.fee}
                onChange={(e) => setFormData({ ...formData, fee: e.target.value, fees: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
              />
            </div>

            {/* REQUIREMENT #1: COURSE MODE SELECTION */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Course Mode *</label>
              <select
                value={formData.mode}
                onChange={(e) => {
                  const newMode = e.target.value;
                  setFormData({ 
                    ...formData, 
                    mode: newMode,
                    trainerId: newMode === 'Recorded' ? '' : formData.trainerId,
                    assignedTrainer: newMode === 'Recorded' ? 'None (Self-Paced)' : (formData.assignedTrainer === 'None (Self-Paced)' ? '' : formData.assignedTrainer)
                  });
                }}
                className="w-full px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs font-black text-blue-900 focus:bg-white"
              >
                <option value="Online">Online (Live Sessions)</option>
                <option value="Recorded">Recorded (Modules & Videos)</option>
                <option value="Hybrid">Hybrid (Live + Recorded)</option>
              </select>
            </div>

            {/* REQUIREMENT: COURSE FOR (AUDIENCE) SELECTION */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Course For *</label>
              <select
                required
                value={formData.audience || 'student'}
                onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                className="w-full px-4 py-2.5 bg-purple-50 border border-purple-200 rounded-xl text-xs font-black text-purple-900 focus:bg-white"
              >
                <option value="student">Student (Public & LMS)</option>
                <option value="trainer">Trainer (Trainer's Courses Only)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Assign Trainer {formData.mode === 'Recorded' ? '(Optional)' : '*'}
              </label>
              <select
                required={formData.mode !== 'Recorded'}
                value={formData.trainerId || ''}
                onChange={(e) => {
                  const selId = e.target.value;
                  const matched = trainersList.find(t => t.id === selId);
                  setFormData({
                    ...formData,
                    trainerId: selId,
                    assignedTrainer: matched ? matched.name : (formData.mode === 'Recorded' ? 'None (Self-Paced)' : '')
                  });
                }}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
              >
                {formData.mode === 'Recorded' && <option value="">None (Self-Paced)</option>}
                {trainersList.length === 0 ? (
                  <option value="" disabled={formData.mode !== 'Recorded'}>No trainers available</option>
                ) : (
                  <>
                    <option value="">-- Select Trainer --</option>
                    {trainersList.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} {t.specialty ? `(${t.specialty})` : ''}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>
          </div>

          {/* REQUIREMENT #2: ONLINE & HYBRID LIVE SESSION FIELDS */}
          {isOnlineOrHybrid && (
            <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-200 space-y-4">
              <h3 className="text-xs font-black text-blue-900 flex items-center gap-2 uppercase tracking-wider">
                <Video className="w-4 h-4 text-blue-600" />
                Live Session Configuration ({formData.mode} Mode)
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Google Meet Link *</label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/abc-defg-hij"
                  value={formData.googleMeetUrl}
                  onChange={(e) => setFormData({ ...formData, googleMeetUrl: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="text"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">End Time</label>
                  <input
                    type="text"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Class Schedule Days</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {ALL_DAYS.map((dayName) => {
                    const isSel = (formData.classDays || []).includes(dayName);
                    return (
                      <button
                        key={dayName}
                        type="button"
                        onClick={() => handleToggleDay(dayName)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          isSel ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200'
                        }`}
                      >
                        <span>{dayName}</span>
                        {isSel && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* RECORDED / HYBRID MODULES INFO BANNER */}
          {isRecordedOrHybrid && (
            <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 text-xs font-medium text-purple-900 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-purple-600 shrink-0" />
                <span>Recorded modules & private video uploads can be managed via <strong>"Course Modules"</strong> after saving.</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Course Thumbnail Image</label>
            <FileUploader 
              label="Click to upload course thumbnail image" 
              accept=".png,.jpg,.jpeg,.webp"
              category="thumbnail"
              onUploadComplete={(result) => {
                setFormData(prev => ({ ...prev, thumbnail: result.url }));
              }}
              onUploadingStateChange={(isUploading) => {
                setSaving(isUploading);
              }}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow-lg transition-transform transform active:scale-95 flex items-center justify-center space-x-2 text-sm cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Course...' : 'Save & Publish Course'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
