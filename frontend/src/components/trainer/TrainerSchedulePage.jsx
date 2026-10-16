import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Video, Eye, Lock, Clock, ExternalLink, CheckCircle, Sparkles, Layers, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getSchedules, startSchedule, joinSchedule } from '../../api/scheduleApi';
import { sortSchedulesChronologically, getScheduleJoinState, syncServerTime, getNowInKolkata } from '../../utils/scheduleSortUtil';
import UniversalFileViewerModal from '../common/UniversalFileViewerModal';
import { usePolling } from '../../hooks/usePolling';

export default function TrainerSchedulePage({ setActiveScreen }) {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewerFile, setViewerFile] = useState(null);
  const [actionMsg, setActionMsg] = useState('');
  const [actionError, setActionError] = useState('');
  const [, setTimerTick] = useState(0);

  const trainerName = user?.name || '';
  const trainerId = user?.id || '';

  const loadSchedules = async () => {
    try {
      const res = await getSchedules();
      if (res && res.data) {
        setSchedules(res.data);
      }
    } catch (err) {
      console.error('Failed to load trainer schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    syncServerTime();
    loadSchedules();
  }, [user]);

  // Re-evaluate lock and join states periodically based on Asia/Kolkata server time
  usePolling(() => {
    setTimerTick(prev => prev + 1);
  }, 15000);

  const sortedSchedules = sortSchedulesChronologically(schedules);

  const getAttachedResource = (item, type) => {
    if (type === 'assignment') {
      if (item.assignmentPdf) return typeof item.assignmentPdf === 'object' ? item.assignmentPdf : { name: `${item.title} Assignment.pdf`, fileUrl: item.assignmentPdf, type: 'pdf' };
      if (item.assignmentFileUrl) return { name: item.assignmentFileName || `${item.title} Assignment.pdf`, fileUrl: item.assignmentFileUrl, type: 'pdf' };
      if (item.assignmentFile) return item.assignmentFile;
    }
    if (type === 'worksheet') {
      if (item.worksheetPdf) return typeof item.worksheetPdf === 'object' ? item.worksheetPdf : { name: `${item.title} Worksheet.pdf`, fileUrl: item.worksheetPdf, type: 'pdf' };
      if (item.worksheetFileUrl) return { name: item.worksheetFileName || `${item.title} Worksheet.pdf`, fileUrl: item.worksheetFileUrl, type: 'pdf' };
      if (item.worksheetFile) return item.worksheetFile;
    }
    if (type === 'notes') {
      if (item.notesPdf) return typeof item.notesPdf === 'object' ? item.notesPdf : { name: `${item.title} Notes.pdf`, fileUrl: item.notesPdf, type: 'pdf' };
      if (item.notesFileUrl) return { name: item.notesFileName || `${item.title} Notes.pdf`, fileUrl: item.notesFileUrl, type: 'pdf' };
      if (item.notesFile) return item.notesFile;
    }

    if (item.resources && item.resources[type]) {
      const res = item.resources[type];
      return typeof res === 'string' ? { name: `${type.toUpperCase()} - ${item.title}`, fileUrl: res, type: 'pdf' } : res;
    }
    if (item[type]) {
      const res = item[type];
      return typeof res === 'string' ? { name: `${type.toUpperCase()} - ${item.title}`, fileUrl: res, type: 'pdf' } : res;
    }
    return null;
  };

  const handleStartOrJoin = async (item, isAttendee) => {
    setActionMsg('');
    setActionError('');
    try {
      const res = isAttendee ? await joinSchedule(item.id) : await startSchedule(item.id);
      if (res && res.success) {
        const finalUrl = res.data?.meetUrl || res.meetUrl || item.meetLink || item.googleMeetUrl;
        setActionMsg(`Session launched! Attendance automatically recorded as PRESENT.`);
        setTimeout(() => setActionMsg(''), 5000);
        if (finalUrl) {
          window.open(finalUrl, '_blank');
        }
        await loadSchedules();
      } else {
        setActionError(res?.message || 'Unable to start or join session');
        setTimeout(() => setActionError(''), 5000);
      }
    } catch (err) {
      setActionError(err?.message || 'Error occurred while starting/joining session');
      setTimeout(() => setActionError(''), 5000);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-50 min-h-screen">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">My Schedule</h1>
          <p className="text-xs text-slate-500 font-semibold">Assigned teaching sessions and legitimate trainer program classes for {trainerName}.</p>
        </div>
      </div>

      {actionMsg && (
        <div className="p-4 bg-emerald-600 text-white font-bold text-xs rounded-2xl shadow-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4" />
            <span>{actionMsg}</span>
          </div>
          <button onClick={() => setActionMsg('')} className="p-1 hover:bg-emerald-700 rounded-lg">✕</button>
        </div>
      )}

      {actionError && (
        <div className="p-4 bg-rose-600 text-white font-bold text-xs rounded-2xl shadow-lg flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError('')} className="p-1 hover:bg-rose-700 rounded-lg">✕</button>
        </div>
      )}

      {/* Timetable Section */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <CalendarIcon className="w-5 h-5 text-purple-700" />
            <h3 className="text-base font-black text-slate-900">Timetable & Session Resources</h3>
          </div>
        </div>

        {/* Schedule Cards List */}
        <div className="space-y-4 pt-2">
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Assigned Classes (Time Slot Ascending)</h4>
          
          {loading ? (
            <div className="p-12 text-center text-xs font-bold text-slate-400">Loading assigned schedules...</div>
          ) : sortedSchedules.length === 0 ? (
            <div className="p-12 text-center text-xs font-bold text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
              No sessions currently scheduled for {trainerName}.
            </div>
          ) : (
            sortedSchedules.map((item) => {
              const asg = getAttachedResource(item, 'assignment');
              const ws = getAttachedResource(item, 'worksheet');
              const notes = getAttachedResource(item, 'notes');
              const hasResources = Boolean(asg || ws || notes);

              const isTrainerAudience = (item.audience || '').toUpperCase() === 'TRAINER';
              const isInstructor = (item.trainerId && item.trainerId === trainerId) ||
                                   (item.trainer && item.trainer.toLowerCase().trim() === trainerName.toLowerCase().trim());
              const isAttendee = isTrainerAudience && !isInstructor;

              const joinState = getScheduleJoinState(item);

              return (
                <div key={item.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-600 bg-white px-2.5 py-1 rounded-md border border-slate-200">{item.time}</span>
                        {item.batch && (
                          <span className="text-[10px] font-extrabold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200">
                            Batch: {item.batch}
                          </span>
                        )}
                        {item.date && (
                          <span className="text-[10px] font-bold text-slate-500 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                            {item.date}
                          </span>
                        )}
                        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase border ${
                          isAttendee ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}>
                          {isAttendee ? 'Trainer Course (Learner)' : 'Teaching Session'}
                        </span>
                      </div>
                      <h5 className="text-base font-black text-slate-900 pt-1">{item.title}</h5>
                      <p className="text-xs font-semibold text-slate-600 flex items-center gap-2">
                        <span>Course: {item.course}</span>
                        {item.trainer && (
                          <span className="text-slate-400">• Instructor: {item.trainer}</span>
                        )}
                      </p>
                    </div>

                    {/* Action Button: Start Session vs Join Session */}
                    <div className="self-start sm:self-auto min-w-[180px]">
                      {joinState.enabled ? (
                        <button 
                          type="button"
                          onClick={() => handleStartOrJoin(item, isAttendee)}
                          className={`w-full py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-2 shadow-sm transition-transform active:scale-95 cursor-pointer text-white ${
                            isAttendee ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-purple-700 hover:bg-purple-800'
                          }`}
                        >
                          <Video className="w-4 h-4 fill-current" />
                          <span>{isAttendee ? 'Join Session' : 'Start Session'}</span>
                        </button>
                      ) : (
                        <button 
                          type="button"
                          disabled={true}
                          className="w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 bg-slate-200/80 text-slate-400 border border-slate-300 cursor-not-allowed"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span className="truncate">{joinState.label.replace('Join opens at', isAttendee ? 'Join opens at' : 'Starts at')}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Attached View-Only Resources Section */}
                  {hasResources && (
                    <div className="pt-3 border-t border-slate-200/60 space-y-2">
                      <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Classroom Documents (View-Only)</div>
                      <div className="flex flex-wrap gap-2">
                        {asg && (
                          <button
                            type="button"
                            onClick={() => setViewerFile(asg)}
                            className="bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-extrabold text-[11px] px-3 py-1.5 rounded-xl flex items-center space-x-1.5 cursor-pointer transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5 text-purple-600" />
                            <span>View Assignment</span>
                          </button>
                        )}
                        {ws && (
                          <button
                            type="button"
                            onClick={() => setViewerFile(ws)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-extrabold text-[11px] px-3 py-1.5 rounded-xl flex items-center space-x-1.5 cursor-pointer transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-600" />
                            <span>View Worksheet</span>
                          </button>
                        )}
                        {notes && (
                          <button
                            type="button"
                            onClick={() => setViewerFile(notes)}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-extrabold text-[11px] px-3 py-1.5 rounded-xl flex items-center space-x-1.5 cursor-pointer transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5 text-emerald-600" />
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
