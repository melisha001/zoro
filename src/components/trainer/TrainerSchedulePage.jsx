import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Video } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getTrainerSchedules } from '../../api/scheduleApi';

export default function TrainerSchedulePage({ setActiveScreen }) {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  const trainerName = user?.name || 'Priya';

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
            <h3 className="text-base font-black text-slate-900">September 2026 Timetable</h3>
          </div>
        </div>

        {/* Schedule List */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Assigned Classes</h4>
          
          {loading ? (
            <div className="p-6 text-center text-xs font-bold text-slate-400">Loading assigned schedules...</div>
          ) : schedules.length === 0 ? (
            <div className="p-6 text-center text-xs font-bold text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
              No sessions currently scheduled for {trainerName}.
            </div>
          ) : (
            schedules.map((item) => (
              <div key={item.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-slate-500">{item.time}</span>
                    <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{item.batch}</span>
                  </div>
                  <h5 className="text-sm font-black text-slate-900">{item.title}</h5>
                  <p className="text-xs font-semibold text-slate-500">{item.course} • {item.mode}</p>
                </div>

                <button 
                  onClick={() => setActiveScreen('trainer-sessions')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs shadow-xs self-start sm:self-auto flex items-center space-x-1.5"
                >
                  <Video className="w-4 h-4" />
                  <span>Start Session</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

