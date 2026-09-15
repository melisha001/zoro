import React from 'react';
import { 
  LayoutDashboard, Users, BookOpen, UserCheck, Calendar, 
  CreditCard, FileText, HelpCircle, Trophy, BarChart3, Settings, 
  MessageSquare, User, Video, Clock, CheckSquare, Bell, LogOut 
} from 'lucide-react';

export default function DashboardSidebar({ role, activeScreen, setActiveScreen }) {
  let menuItems = [];

  if (role === 'Admin') {
    menuItems = [
      { id: 'admin-dash', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'students', label: 'Students', icon: Users, badge: '128' },
      { id: 'courses', label: 'Courses', icon: BookOpen },
      { id: 'trainers', label: 'Trainers', icon: UserCheck },
      { id: 'schedule', label: 'Schedule', icon: Calendar },
      { id: 'fees', label: 'Fees', icon: CreditCard },
      { id: 'assignments', label: 'Assignments', icon: FileText, badge: '7' },
      { id: 'doubts', label: 'Doubts', icon: HelpCircle, badge: '3' },
      { id: 'competitions', label: 'Competitions', icon: Trophy },
      { id: 'reports', label: 'Reports', icon: BarChart3 },
      { id: 'settings', label: 'Settings', icon: Settings },
    ];
  } else if (role === 'Trainer') {
    menuItems = [
      { id: 'trainer-dash', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'my-students', label: 'My Students', icon: Users },
      { id: 'my-schedule', label: 'My Schedule', icon: Calendar },
      { id: 'my-sessions', label: 'My Sessions', icon: Video, badge: '3 Today' },
      { id: 'assignments', label: 'Assignments', icon: FileText },
      { id: 'submissions', label: 'Submissions', icon: CheckSquare, badge: '5' },
      { id: 'doubts', label: 'Doubts', icon: HelpCircle, badge: '2' },
      { id: 'messages', label: 'Messages', icon: MessageSquare },
      { id: 'profile', label: 'Profile', icon: User },
    ];
  } else {
    // Student
    menuItems = [
      { id: 'student-dash', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'my-courses', label: 'My Courses', icon: BookOpen },
      { id: 'student-join', label: 'My Schedule / Session', icon: Calendar, badge: 'Next: 6 PM' },
      { id: 'student-assignment', label: 'Assignments', icon: FileText, badge: '2 Pending' },
      { id: 'my-submissions', label: 'My Submissions', icon: CheckSquare },
      { id: 'student-doubt', label: 'My Doubts', icon: HelpCircle, badge: '1 Open' },
      { id: 'attendance', label: 'My Attendance', icon: Clock, badge: '92%' },
      { id: 'notifications', label: 'Notifications', icon: Bell },
      { id: 'profile', label: 'My Profile', icon: User },
    ];
  }

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full min-h-screen border-r border-slate-800 shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img 
            src="/assets/logo.png" 
            alt="ZORO Logo" 
            className="h-9 w-auto object-contain" 
          />
          <div>
            <h1 className="font-extrabold text-lg text-white tracking-tight leading-none">ZORO</h1>
            <p className="text-[10px] text-blue-400 font-semibold tracking-wide uppercase mt-0.5">{role} Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveScreen(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium text-sm transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-blue-800 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer / Switch back */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50">
        <button
          onClick={() => setActiveScreen('public-home')}
          className="w-full flex items-center justify-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white py-2 px-3 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit to Public Site</span>
        </button>
      </div>
    </aside>
  );
}
