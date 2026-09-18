import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, Settings, Edit3, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { updateTrainerProfile } from '../../api/userApi';

export default function TrainerProfilePage() {
  const { user, updateUserInContext } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || 'Trainer',
    role: user?.role || 'TRAINER',
    email: user?.email || '',
    phone: user?.phone || '+91 98765 43210',
    joinedOn: user?.joinedDate || '10 Jan 2025'
  });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || 'Trainer',
        role: user.role || 'TRAINER',
        email: user.email || '',
        phone: user.phone || '+91 98765 43210',
        joinedOn: user.joinedDate || '10 Jan 2025'
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (isEditing) {
      try {
        const res = await updateTrainerProfile(user.id || user.email, profileData);
        if (res.success) {
          updateUserInContext(res.data);
          setMsg('Profile updated successfully.');
          setTimeout(() => setMsg(''), 3000);
        }
      } catch (err) {
        setMsg('Failed to update profile.');
      }
    }
    setIsEditing(!isEditing);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">My Profile</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your account details.</p>
      </div>

      {msg && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-[#0F52BA] text-sm rounded-xl">
          {msg}
        </div>
      )}

      {/* Tabs - Note: Change Password option is explicitly removed for Trainers as per requirement */}
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
            <div className="w-20 h-20 rounded-full bg-[#0F52BA] text-white flex items-center justify-center font-bold text-3xl shadow-md uppercase">
              {profileData.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{profileData.name}</h2>
              <p className="text-sm font-semibold text-[#0F52BA]">{profileData.role}</p>
              <p className="text-xs font-mono text-slate-400 mt-0.5">{profileData.email}</p>
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
              <p className="font-semibold text-slate-800">{profileData.email}</p>
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
              onClick={handleSave}
              className="bg-white hover:bg-blue-50 text-[#0F52BA] border border-[#0F52BA] font-semibold px-4 py-2 rounded-xl text-sm inline-flex items-center gap-2 shadow-xs transition-colors"
            >
              {isEditing ? <Check className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              <span>{isEditing ? 'Save Profile' : 'Edit Profile'}</span>
            </button>
          </div>
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

