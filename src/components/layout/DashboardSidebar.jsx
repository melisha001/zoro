import React from 'react';
import { 
  LayoutDashboard, Users, BookOpen, UserCheck, Calendar, 
  CreditCard, FileText, HelpCircle, BarChart3, Settings, 
  User, Video, Clock, LogOut, Bell, CheckSquare, X 
} from 'lucide-react';

export default function DashboardSidebar({ role, activeScreen, setActiveScreen, isMobileOpen, onMobileClose }) {
  let menuItems = [];

  if (role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'Admin') {
    menuItems = [
      { id: 'admin-dash', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'admin-manage-courses', label: 'Manage Courses', icon: BookOpen },
      { id: 'admin-manage-students', label: 'Manage Students', icon: Users },
      { id: 'admin-manage-trainers', label: 'Manage Trainers', icon: UserCheck },
      { id: 'admin-attendance', label: 'Attendance Reports', icon: Clock },
      { id: 'schedule', label: 'Schedule', icon: Calendar },
      { id: 'fees', label: 'Fees & Finance', icon: CreditCard },
      { id: 'assignments', label: 'Assignments', icon: FileText },
      { id: 'doubts', label: 'Doubts', icon: HelpCircle },
      { id: 'reports', label: 'Reports', icon: BarChart3 },
      { id: 'settings', label: 'Settings', icon: Settings },
    ];
  } else if (role === 'TRAINER' || role === 'Trainer') {
    menuItems = [
      { id: 'trainer-dash', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'trainer-students', label: 'Students', icon: Users },
      { id: 'trainer-schedule', label: 'Schedule', icon: Calendar },
      { id: 'trainer-sessions', label: 'Sessions', icon: Video },
      { id: 'trainer-assignments', label: 'Assignments', icon: FileText },
      { id: 'trainer-submissions', label: 'Submissions', icon: CheckSquare },
      { id: 'trainer-doubts', label: 'Doubts', icon: HelpCircle },
      { id: 'trainer-attendance', label: 'Attendance', icon: Clock },
      { id: 'trainer-notifications', label: 'Notifications', icon: Bell },
      { id: 'trainer-profile', label: 'My Profile', icon: User },
    ];
  } else {
    // Student
    menuItems = [
      { id: 'student-dash', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'student-course-learn', label: 'My Courses (LMS)', icon: BookOpen },
      { id: 'student-attendance', label: 'My Attendance', icon: Clock, badge: '92%' },
      { id: 'student-join', label: 'Join Session', icon: Calendar, badge: 'Live' },
      { id: 'student-assignment', label: 'Assignments', icon: FileText },
      { id: 'student-doubt', label: 'My Doubts', icon: HelpCircle },
      { id: 'profile', label: 'My Profile', icon: User },
    ];
  }

  const content = (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full min-h-screen border-r border-slate-800 shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img 
            src="/assets/logo.png" 
            alt="Zoro English Academy Logo" 
            className="h-9 w-auto object-contain" 
          />
          <div>
            <h1 className="font-extrabold text-xs text-white tracking-tight leading-none">Zoro English Academy</h1>
            <p className="text-[10px] text-blue-400 font-semibold tracking-wide uppercase mt-0.5">{role} Portal</p>
          </div>
        </div>

        {onMobileClose && (
          <button onClick={onMobileClose} className="md:hidden text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveScreen(item.id);
                if (onMobileClose) onMobileClose();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium text-xs transition-all ${
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

      {/* Footer / Exit */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50">
        <div className="text-[10px] text-slate-400 font-bold mb-3 text-center">Small Steps Big Communication</div>
        <button
          onClick={() => {
            setActiveScreen('public-home');
            if (onMobileClose) onMobileClose();
          }}
          className="w-full flex items-center justify-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white py-2 px-3 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit to Public Site</span>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:block h-full">
        {content}
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-slate-950/60" onClick={onMobileClose}></div>
          <div className="relative z-10">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
