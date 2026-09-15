import React from 'react';
import { Eye, Shield, UserCheck, GraduationCap, Video, FileText, HelpCircle, Globe } from 'lucide-react';

export default function TopRoleBar({ activeScreen, setActiveScreen }) {
  const screens = [
    { id: 'public-home', label: 'Public Home', category: 'Public', icon: Globe },
    { id: 'public-course', label: 'Course Page', category: 'Public', icon: Eye },
    { id: 'public-competition', label: 'Competition Page', category: 'Public', icon: Eye },
    { id: 'admin-dash', label: 'Admin Dashboard', category: 'Admin', icon: Shield },
    { id: 'trainer-dash', label: 'Trainer Dashboard', category: 'Trainer', icon: UserCheck },
    { id: 'student-dash', label: 'Student Dashboard', category: 'Student', icon: GraduationCap },
    { id: 'student-join', label: 'Student - Join Session', category: 'Student', icon: Video },
    { id: 'student-assignment', label: 'Student - Assignment', category: 'Student', icon: FileText },
    { id: 'student-doubt', label: 'Student - Ask Doubt', category: 'Student', icon: HelpCircle },
  ];

  return (
    <div className="bg-slate-900 text-white px-4 py-2 text-xs flex flex-wrap items-center justify-between border-b border-slate-800 sticky top-0 z-50 shadow-md">
      <div className="flex items-center space-x-2 font-semibold tracking-wide text-blue-400">
        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping"></span>
        <span>ZORO ACADEMY DEMO SWITCHER</span>
        <span className="text-slate-400 font-normal hidden md:inline">| Click to preview any of the 9 wireframes:</span>
      </div>

      <div className="flex items-center flex-wrap gap-1.5 mt-1 sm:mt-0">
        {screens.map((screen) => {
          const Icon = screen.icon;
          const isActive = activeScreen === screen.id;
          return (
            <button
              key={screen.id}
              onClick={() => setActiveScreen(screen.id)}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition-all font-medium ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400 scale-105'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{screen.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
