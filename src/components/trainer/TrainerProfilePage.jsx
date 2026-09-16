import React, { useState } from 'react';
import { User, Mail, Phone, Calendar, Key, Settings, Edit3, Check } from 'lucide-react';

export default function TrainerProfilePage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: 'Ms. Priya',
    role: 'English Trainer',
    code: 'ZA-TR-001',
    email: 'priya@zoroacademy.com',
    phone: '+91 98765 43210',
    joinedOn: '10 Jan 2025'
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">My Profile</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your account details.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'profile'
              ? 'border-[#0F52BA] text-[#0F52BA]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveTab('password')}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'password'
              ? 'border-[#0F52BA] text-[#0F52BA]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Change Password
        </button>
        <button
          onClick={() => setActiveTab('preferences')}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'preferences'
              ? 'border-[#0F52BA] text-[#0F52BA]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Preferences
        </button>
      </div>

      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 max-w-2xl">
          {/* Avatar and Basic info */}
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-[#0F52BA] text-white flex items-center justify-center font-bold text-3xl shadow-md">
              P
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{profileData.name}</h2>
              <p className="text-sm font-semibold text-[#0F52BA]">{profileData.role}</p>
              <p className="text-xs font-mono text-slate-400 mt-0.5">{profileData.code}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-sm">
            <div>
              <label className="block text-xs text-slate-400 font-semibold mb-1">Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.name}
                  aria-label="Name"
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0F52BA]"
                />
              ) : (
                <p className="font-semibold text-slate-800">{profileData.name}</p>
              )}
            </div>

            <div>
              <label className="block text-xs text-slate-400 font-semibold mb-1">Email</label>
              {isEditing ? (
                <input
                  type="email"
                  value={profileData.email}
                  aria-label="Email"
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0F52BA]"
                />
              ) : (
                <p className="font-semibold text-slate-800">{profileData.email}</p>
              )}
            </div>

            <div>
              <label className="block text-xs text-slate-400 font-semibold mb-1">Phone</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.phone}
                  aria-label="Phone"
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0F52BA]"
                />
              ) : (
                <p className="font-semibold text-slate-800">{profileData.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-xs text-slate-400 font-semibold mb-1">Joined On</label>
              <p className="font-semibold text-slate-800">{profileData.joinedOn}</p>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-white hover:bg-blue-50 text-[#0F52BA] border border-[#0F52BA] font-semibold px-4 py-2 rounded-xl text-sm inline-flex items-center gap-2 shadow-xs transition-colors"
            >
              {isEditing ? <Check className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              <span>{isEditing ? 'Save Profile' : 'Edit Profile'}</span>
            </button>
          </div>
        </div>
      )}

      {activeTab === 'password' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 max-w-md">
          <h3 className="font-bold text-slate-900 text-lg">Change Password</h3>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Current Password</label>
            <input 
              type="password"
              placeholder="••••••••"
              aria-label="Current Password"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F52BA]/20 focus:border-[#0F52BA]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">New Password</label>
            <input 
              type="password"
              placeholder="••••••••"
              aria-label="New Password"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F52BA]/20 focus:border-[#0F52BA]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Confirm New Password</label>
            <input 
              type="password"
              placeholder="••••••••"
              aria-label="Confirm New Password"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F52BA]/20 focus:border-[#0F52BA]"
            />
          </div>
          <button className="w-full bg-[#0F52BA] hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl shadow-xs transition-colors text-sm">
            Update Password
          </button>
        </div>
      )}

      {activeTab === 'preferences' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 max-w-md">
          <h3 className="font-bold text-slate-900 text-lg">Notification Preferences</h3>
          <div className="space-y-3 text-sm">
            <label className="flex items-center gap-3 text-slate-700 font-medium">
              <input type="checkbox" defaultChecked className="rounded border-slate-300 text-[#0F52BA] focus:ring-[#0F52BA]" />
              Email Notifications for New Submissions
            </label>
            <label className="flex items-center gap-3 text-slate-700 font-medium">
              <input type="checkbox" defaultChecked className="rounded border-slate-300 text-[#0F52BA] focus:ring-[#0F52BA]" />
              SMS Alerts for Class Reminders
            </label>
            <label className="flex items-center gap-3 text-slate-700 font-medium">
              <input type="checkbox" defaultChecked className="rounded border-slate-300 text-[#0F52BA] focus:ring-[#0F52BA]" />
              Notify on New Student Doubts
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
