import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Video, Eye, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getTrainerSchedules } from '../../api/scheduleApi';
import { sortSchedulesChronologically } from '../../utils/scheduleSortUtil';
import UniversalFileViewerModal from '../common/UniversalFileViewerModal';

export default function TrainerSchedulePage({ setActiveScreen }) {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewerFile, setViewerFile] = useState(null);

  const trainerName = user?.name || '';

  useEffect(() => {
    async function loadSchedules() {
      setLoading(true);
      try {
        const res = await getTrainerSchedules(trainerName);
        setSchedules(res.data || []);
      } catch (err) {
        console.error('Failed to load trainer schedules:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSchedules();
  }, [trainerName]);

  const sortedSchedules = sortSchedulesChronologically(schedules);

  const getAttachedResource = (item, type) => {
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Schedule</h1>
          <p className="text-xs text-slate-500 font-medium">Assigned sessions for {trainerName}.</p>
        </div>
      </div>

      {/* Calendar Header Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <h3 className="text-base font-black text-slate-900">Timetable & Session Resources</h3>
          </div>
        </div>

        {/* Schedule List */}
        <div className="space-y-4 pt-2">
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Assigned Classes (Time Slot Ascending)</h4>
          
          {loading ? (
            <div className="p-6 text-center text-xs font-bold text-slate-400">Loading assigned schedules...</div>
          ) : sortedSchedules.length === 0 ? (
            <div className="p-6 text-center text-xs font-bold text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
              No sessions currently scheduled for {trainerName}.
            </div>
          ) : (
            sortedSchedules.map((item) => {
              const asg = getAttachedResource(item, 'assignment');
              const ws = getAttachedResource(item, 'worksheet');
              const notes = getAttachedResource(item, 'notes');
              const hasResources = Boolean(asg || ws || notes);

              return (
                <div key={item.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-bold text-slate-500">{item.time}</span>
                        <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{item.batch}</span>
                        {item.date && <span className="text-[10px] font-bold text-slate-400">{item.date}</span>}
                      </div>
                      <h5 className="text-sm font-black text-slate-900">{item.title}</h5>
                      <p className="text-xs font-semibold text-slate-500">{item.course}</p>
                    </div>

                    <button 
                      onClick={() => setActiveScreen && setActiveScreen('trainer-sessions')}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs shadow-xs self-start sm:self-auto flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Video className="w-4 h-4" />
                      <span>Start Session</span>
                    </button>
                  </div>

                  {/* Attached Resources Section (Requirement 2 & 2.1) */}
                  {hasResources && (
                    <div className="pt-3 border-t border-slate-200/60 space-y-2">
                      <div className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">Resources</div>
                      <div className="flex flex-wrap gap-2">
                        {asg && (
                          <button
                            type="button"
                            onClick={() => setViewerFile(asg)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-extrabold text-[11px] px-3 py-1.5 rounded-xl flex items-center space-x-1.5 cursor-pointer transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-600" />
                            <span>View Assignment</span>
                          </button>
                        )}
                        {ws && (
                          <button
                            type="button"
                            onClick={() => setViewerFile(ws)}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-extrabold text-[11px] px-3 py-1.5 rounded-xl flex items-center space-x-1.5 cursor-pointer transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5 text-emerald-600" />
                            <span>View Worksheet</span>
                          </button>
                        )}
                        {notes && (
                          <button
                            type="button"
                            onClick={() => setViewerFile(notes)}
                            className="bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-extrabold text-[11px] px-3 py-1.5 rounded-xl flex items-center space-x-1.5 cursor-pointer transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5 text-purple-600" />
                            <span>View Notes</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <UniversalFileViewerModal
        isOpen={Boolean(viewerFile)}
        onClose={() => setViewerFile(null)}
        file={viewerFile}
        hideDownload={true}
      />
    </div>
  );
}
