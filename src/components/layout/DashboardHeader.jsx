import React from 'react';
import { Search, Bell, Calendar as CalendarIcon, ChevronDown, Menu } from 'lucide-react';

export default function DashboardHeader({ user, onMobileMenuToggle }) {
  return (
    <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      
      {/* Mobile Sidebar Toggle Button */}
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

        {/* Search Input */}
        <div className="relative w-44 sm:w-64 md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search students, assignments, sessions..."
            className="w-full pl-9 pr-4 py-2 bg-slate-100 focus:bg-white text-xs font-medium rounded-lg border border-transparent focus:border-blue-500 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Right User & Utility Controls */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Date Filter */}
        <div className="hidden md:flex items-center space-x-1.5 bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 border border-slate-200">
          <CalendarIcon className="w-3.5 h-3.5 text-slate-500" />
          <span>Monday, 15 September 2026</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </div>

        {/* Notifications Icon */}
        <button className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white"></span>
        </button>

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
