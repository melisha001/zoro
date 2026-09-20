import React, { useState, useEffect } from 'react';
import { Bell, Calendar as CalendarIcon, Menu, X, AlertTriangle, Clock, CheckCircle2, Info } from 'lucide-react';
import { getTrainers } from '../../api/userApi';
import { getSchedules } from '../../api/scheduleApi';

export default function DashboardHeader({ user, onMobileMenuToggle }) {
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [notifList, setNotifList] = useState([]);

  const currentDateStr = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  useEffect(() => {
    loadNotifications();
  }, [user]);

  const loadNotifications = async () => {
    try {
      const [trainersRes, schedulesRes] = await Promise.all([
        getTrainers(),
        getSchedules()
      ]);
      
      const items = [];
      const today = new Date();
      const currentDay = today.getDate();

      // 1. Check salary due today or overdue
      (trainersRes.data || []).forEach(trn => {
        const creditDay = parseInt(trn.salaryCreditDate || 25, 10);
        if (currentDay === creditDay) {
          items.push({
            id: `sal_due_${trn.id}`,
            title: 'Salary Due Today',
            desc: `${trn.name}'s salary of ₹${parseFloat(trn.salaryAmount || 25000).toLocaleString()} is due today (${creditDay}th).`,
            time: 'Today',
            type: 'warning'
          });
        } else if (currentDay > creditDay) {
          items.push({
            id: `sal_overdue_${trn.id}`,
            title: 'Salary Payment Overdue',
            desc: `${trn.name}'s salary is overdue (Due on ${creditDay}th of month).`,
            time: 'Action Required',
            type: 'danger'
          });
        }
      });

      // 2. Check upcoming sessions
      (schedulesRes.data || []).filter(s => s.status === 'Upcoming').slice(0, 3).forEach(sch => {
        items.push({
          id: `sch_${sch.id}`,
          title: `Upcoming: ${sch.title}`,
          desc: `${sch.course} (${sch.time}) by ${sch.trainer}`,
          time: sch.time || 'Today',
          type: 'info'
        });
      });

      setNotifList(items);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  const handleDismissNotif = (id) => {
    setNotifList(prev => prev.filter(item => item.id !== id));
  };

  return (
    <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs relative">
      
      {/* Mobile Sidebar Toggle Button & Brand Title */}
      <div className="flex items-center space-x-3">
        {onMobileMenuToggle && (
          <button 
            onClick={onMobileMenuToggle}
            aria-label="Toggle mobile menu"
            className="md:hidden p-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/80 rounded-xl transition-colors shrink-0 flex items-center justify-center shadow-xs cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="text-xs font-black text-slate-800 tracking-tight">
          Zoro English Academy
        </div>
      </div>

      {/* Right User & Utility Controls */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Dynamic Current Date */}
        <div className="hidden md:flex items-center space-x-2 bg-slate-100 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 border border-slate-200 shadow-2xs">
          <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
          <span>{currentDateStr}</span>
        </div>

        {/* Notifications Icon & Bell Button */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifPanel(!showNotifPanel)}
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {notifList.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-600 text-white font-extrabold text-[9px] rounded-full flex items-center justify-center ring-2 ring-white">
                {notifList.length}
              </span>
            )}
          </button>

          {/* Notification Dropdown Panel */}
          {showNotifPanel && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 p-4 space-y-3 z-50 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <Bell className="w-4 h-4 text-blue-600" />
                  <h4 className="text-sm font-black text-slate-900 tracking-tight">Notifications</h4>
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                    {notifList.length}
                  </span>
                </div>
                <button
                  onClick={() => setShowNotifPanel(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2 text-xs">
                {notifList.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 font-semibold text-xs">
                    No new notifications right now.
                  </div>
                ) : (
                  notifList.map(item => (
                    <div 
                      key={item.id} 
                      className={`p-3 rounded-2xl border flex items-start justify-between space-x-3 transition-colors ${
                        item.type === 'danger'
                          ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                          : item.type === 'warning'
                          ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                          : 'bg-blue-50/70 border-blue-200 text-blue-900'
                      }`}
                    >
                      <div className="flex items-start space-x-2.5 min-w-0">
                        {item.type === 'danger' ? (
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        ) : item.type === 'warning' ? (
                          <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        ) : (
                          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0">
                          <div className="font-black text-xs leading-tight">{item.title}</div>
                          <p className="text-[11px] font-medium opacity-90 mt-0.5 leading-snug">{item.desc}</p>
                          <span className="text-[10px] font-bold opacity-75 mt-1 block">{item.time}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDismissNotif(item.id)}
                        className="text-slate-400 hover:text-slate-600 p-1 shrink-0 cursor-pointer"
                        title="Dismiss"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

        {/* User Profile Pill */}
        <div className="flex items-center space-x-2.5 cursor-pointer">
          <img
            src={user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120"}
            alt={user.name}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover ring-2 ring-blue-500/20"
          />
          <div className="hidden sm:block text-left leading-tight">
            <div className="text-xs font-bold text-slate-800">{user.name}</div>
            <div className="text-[10px] font-medium text-slate-500">{user.role}</div>
          </div>
        </div>
      </div>

    </header>
  );
}

