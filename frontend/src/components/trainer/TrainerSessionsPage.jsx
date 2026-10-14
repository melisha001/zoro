import React, { useState, useEffect } from 'react';
import { Video, Copy, Calendar, Clock, AlertTriangle, Eye, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getTrainerSchedules } from '../../api/scheduleApi';
import { sortSchedulesChronologically, isValidGoogleMeetUrl } from '../../utils/scheduleSortUtil';
import UniversalFileViewerModal from '../common/UniversalFileViewerModal';

export default function TrainerSessionsPage() {
  const { user } = useAuth();
  const trainerName = user?.name || '';
  const isInactive = (user?.status || '').toLowerCase() === 'inactive';

  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('student list'); // Removed 'session notes' tab as per Requirement 3.2
  const [schedules, setSchedules] = useState([]);
  const [selectedScheduleIndex, setSelectedScheduleIndex] = useState(0);
  const [viewerFile, setViewerFile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSchedules() {
      setLoading(true);
      try {
        const res = await getTrainerSchedules(trainerName);
        const list = sortSchedulesChronologically(res.data || []);
        setSchedules(list);
      } catch (err) {
        console.error('Failed to load trainer schedules for sessions:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSchedules();
  }, [trainerName]);

  const currentSchedule = schedules[selectedScheduleIndex] || schedules[0] || null;

  const getAttachedResource = (item, type) => {
    if (!item) return null;
    if (item.resources && item.resources[type]) {
      const res = item.resources[type];
      return typeof res === 'string' ? { name: `${type.toUpperCase()} - ${item.title}`, url: res, type: 'pdf' } : res;
    }
    if (item[type]) {
      const res = item[type];
      return typeof res === 'string' ? { name: `${type.toUpperCase()} - ${item.title}`, url: res, type: 'pdf' } : res;
    }
    return null;
  };

  const rawMeetUrl = currentSchedule?.googleMeetUrl || currentSchedule?.meetingUrl || currentSchedule?.meetLink || '';
  const hasValidMeet = isValidGoogleMeetUrl(rawMeetUrl);

  const handleCopyLink = () => {
    if (!hasValidMeet) return;
    navigator.clipboard.writeText(rawMeetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const studentAttendance = [
    { id: 1, name: 'S.J. Abhishek', status: 'Joined', joinTime: '5:01 PM' },
    { id: 2, name: 'Nivetha R', status: 'Joined', joinTime: '5:02 PM' },
    { id: 3, name: 'Tharun K', status: 'Not Joined', joinTime: '–' },
    { id: 4, name: 'Divya S', status: 'Joined', joinTime: '5:01 PM' },
  ];

  if (isInactive) {
    return (
      <div className="p-6 sm:p-8 space-y-6 bg-slate-50 min-h-screen">
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-6 rounded-3xl space-y-2">
          <div className="flex items-center space-x-2 font-black text-base">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <span>Account Inactive</span>
          </div>
          <p className="text-xs font-semibold">
            Your trainer account status is currently set to <strong>Inactive</strong> by administration. Assigned sessions and portal resources are restricted.
          </p>
        </div>
      </div>
    );
  }

  const asg = getAttachedResource(currentSchedule, 'assignment');
  const ws = getAttachedResource(currentSchedule, 'worksheet');
  const notes = getAttachedResource(currentSchedule, 'notes');
  const hasResources = Boolean(asg || ws || notes);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-50 min-h-screen">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Trainer Live Sessions</h1>
          <p className="text-xs text-slate-500 font-medium">Conduct live Google Meet sessions and view real-time participant attendance for {trainerName}.</p>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs font-bold text-slate-400">Loading schedules...</div>
      ) : !currentSchedule ? (
        <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center text-xs font-bold text-slate-400">
          No live sessions currently scheduled for {trainerName}.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Schedule Selector if multiple schedules exist */}
          {schedules.length > 1 && (
            <div className="flex items-center space-x-2 overflow-x-auto pb-2">
              <span className="text-xs font-bold text-slate-500 shrink-0">Select Session:</span>
              {schedules.map((s, idx) => (
                <button
                  key={s.id || idx}
                  onClick={() => setSelectedScheduleIndex(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold shrink-0 cursor-pointer transition-all border ${
                    selectedScheduleIndex === idx
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {s.batch} • {s.time}
                </button>
              ))}
            </div>
          )}

          {/* Current Session Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-md space-y-6">
            <div>
              <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase">Current Live Session</span>
              <h2 className="text-xl font-black text-slate-900 mt-2">{currentSchedule.title}</h2>
              
              <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-500 mt-2">
                {currentSchedule.date && (
                  <span className="flex items-center space-x-1"><Calendar className="w-3.5 h-3.5 text-blue-600" /> {currentSchedule.date}</span>
                )}
                <span className="flex items-center space-x-1"><Clock className="w-3.5 h-3.5 text-blue-600" /> {currentSchedule.time}</span>
                <span className="flex items-center space-x-1"><Video className="w-3.5 h-3.5 text-emerald-600" /> Live Interactive Session</span>
                <span className="bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold">{currentSchedule.batch}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button 
                disabled={!hasValidMeet}
                onClick={() => {
                  if (hasValidMeet) {
                    window.open(rawMeetUrl, '_blank');
                  }
                }}
                className={`font-extrabold px-6 py-3 rounded-xl shadow-md text-xs flex items-center space-x-2 ${
                  hasValidMeet
                    ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                <Video className="w-4 h-4" />
                <span>{hasValidMeet ? 'Start Session (Google Meet)' : 'Meeting link not set'}</span>
              </button>

              <button 
                disabled={!hasValidMeet}
                onClick={handleCopyLink}
                className={`font-bold px-5 py-3 rounded-xl text-xs flex items-center space-x-2 border ${
                  hasValidMeet
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 cursor-pointer'
                    : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                }`}
              >
                <Copy className="w-4 h-4 text-slate-500" />
                <span>{copied ? 'Copied Link!' : 'Copy Meet Link'}</span>
              </button>
            </div>
          </div>

          {/* Tabs & Student Join List & Resources (Requirement 3.2: "session notes" tab removed) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex border-b border-slate-200 space-x-6 text-xs font-bold">
              {['student list', 'resources'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 capitalize border-b-2 cursor-pointer ${
                    activeTab === tab ? 'border-blue-600 text-blue-600 font-black' : 'border-transparent text-slate-400'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === 'student list' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold">
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Join Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {studentAttendance.map((s) => (
                      <tr key={s.id}>
                        <td className="py-4 px-4 font-mono text-slate-400">{s.id}</td>
                        <td className="py-4 px-4 font-black text-slate-900">{s.name}</td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                            s.status === 'Joined' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-500 font-bold">{s.joinTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Requirement 3.1: SESSION RESOURCES VIEW ONLY */}
            {activeTab === 'resources' && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <div className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Session Attached Resources</div>
                {hasResources ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {asg && (
                      <button
                        type="button"
                        onClick={() => setViewerFile(asg)}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-extrabold text-xs px-4 py-2 rounded-xl flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Eye className="w-4 h-4 text-blue-600" />
                        <span>View Assignment</span>
                      </button>
                    )}
                    {ws && (
                      <button
                        type="button"
                        onClick={() => setViewerFile(ws)}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-extrabold text-xs px-4 py-2 rounded-xl flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Eye className="w-4 h-4 text-emerald-600" />
                        <span>View Worksheet</span>
                      </button>
                    )}
                    {notes && (
                      <button
                        type="button"
                        onClick={() => setViewerFile(notes)}
                        className="bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-extrabold text-xs px-4 py-2 rounded-xl flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Eye className="w-4 h-4 text-purple-600" />
                        <span>View Notes</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-xs font-semibold text-slate-400">
                    No resources attached to this session by Admin.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <UniversalFileViewerModal
        isOpen={Boolean(viewerFile)}
        onClose={() => setViewerFile(null)}
        file={viewerFile}
        hideDownload={true}
      />

    </div>
  );
}
