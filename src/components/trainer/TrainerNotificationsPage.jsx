import React, { useState } from 'react';
import { Bell, Calendar, BookOpen, HelpCircle, AlertTriangle, Info } from 'lucide-react';

export default function TrainerNotificationsPage() {
  const [activeTab, setActiveTab] = useState('all');

  const notifications = [
    {
      id: 1,
      title: 'Schedule Update',
      desc: 'Level 2 session rescheduled to 16 Sep, 5:00 PM',
      time: 'Today, 10:30 AM',
      type: 'schedule',
      icon: Calendar,
      color: 'bg-blue-50 text-blue-600 border-blue-200'
    },
    {
      id: 2,
      title: 'New Assignment',
      desc: 'Grammar Practice has been assigned to EN-L2',
      time: 'Today, 9:15 AM',
      type: 'assignments',
      icon: BookOpen,
      color: 'bg-[#0F52BA]/10 text-[#0F52BA] border-blue-200'
    },
    {
      id: 3,
      title: 'Student Doubt',
      desc: 'Abhishek sent a new doubt',
      time: 'Today, 8:20 AM',
      type: 'all',
      icon: HelpCircle,
      color: 'bg-amber-50 text-amber-600 border-amber-200'
    },
    {
      id: 4,
      title: 'Announcement',
      desc: 'Centre will be closed on 2 Oct (Gandhi Jayanti)',
      time: 'Yesterday, 6:00 PM',
      type: 'announcements',
      icon: Info,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200'
    },
    {
      id: 5,
      title: 'Assignment Overdue',
      desc: '2 submissions are overdue',
      time: 'Yesterday, 4:10 PM',
      type: 'assignments',
      icon: AlertTriangle,
      color: 'bg-rose-50 text-rose-600 border-rose-200'
    }
  ];

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'all') return true;
    return n.type === activeTab;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Notifications</h1>
        <p className="text-slate-500 text-sm mt-1">Stay updated with important information.</p>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200 gap-6 no-scrollbar">
        {[
          { id: 'all', label: 'All' },
          { id: 'announcements', label: 'Announcements' },
          { id: 'schedule', label: 'Schedule' },
          { id: 'assignments', label: 'Assignments' },
          { id: 'system', label: 'System' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-[#0F52BA] text-[#0F52BA]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
        {filteredNotifications.map(item => {
          const IconComponent = item.icon;
          return (
            <div key={item.id} className="p-4 hover:bg-slate-50/80 transition-colors flex items-start gap-4">
              <div className={`p-2.5 rounded-full border ${item.color} shrink-0`}>
                <IconComponent className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-slate-900 text-base">{item.title}</h3>
                  <span className="text-xs text-slate-400 shrink-0 font-medium">{item.time}</span>
                </div>
                <p className="text-sm text-slate-600 mt-0.5">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
