import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, Edit3, Check, Upload, Camera } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { updateTrainerProfile } from '../../api/userApi';
import { sanitizePhone, validatePhone, formatPhone } from '../../utils/phoneValidator';

export default function TrainerProfilePage() {
  const { user, updateUserInContext } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    role: user?.role || 'TRAINER',
    email: user?.email || '',
    phone: user?.phone || '',
    joinedOn: user?.joinedDate || user?.joinedOn || '',
    avatar: user?.avatar || ''
  });
  const [selectedPhoto, setSelectedPhoto] = useState(user?.avatar || '');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        role: user.role || 'TRAINER',
        email: user.email || '',
        phone: user.phone || '',
        joinedOn: user.joinedDate || user.joinedOn || '',
        avatar: user.avatar || ''
      });
      setSelectedPhoto(user.avatar || '');
    }
  }, [user]);

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase()) && !file.name.match(/\.(jpg|jpeg|png|webp)$/i)) {
      alert('Please upload a valid image file (JPG, JPEG, PNG, or WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedPhoto(reader.result);
      setProfileData(prev => ({ ...prev, avatar: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (isEditing) {
      if (profileData.phone && !validatePhone(profileData.phone)) {
        setMsg('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
        setTimeout(() => setMsg(''), 4000);
        return;
      }
      try {
        const payload = {
          name: profileData.name,
          phone: sanitizePhone(profileData.phone),
          avatar: selectedPhoto || profileData.avatar
        };
        const res = await updateTrainerProfile(user.id || user.email, payload);
        if (res.success) {
          updateUserInContext({ ...payload, avatar: selectedPhoto || profileData.avatar });
          setMsg('Profile and photo updated successfully!');
          setTimeout(() => setMsg(''), 3500);
        } else {
          setMsg(res.message || 'Failed to update profile.');
          return;
        }
      } catch (err) {
        setMsg('Failed to update profile.');
        return;
      }
    }
    setIsEditing(!isEditing);
  };

  return (
    <div className="space-y-6 bg-slate-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">My Profile</h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">Manage your trainer profile information and account photo.</p>
      </div>

      {msg && (
        <div className="p-4 bg-emerald-600 text-white text-xs font-bold rounded-2xl shadow-md flex items-center justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg('')} className="p-1 hover:bg-emerald-700 rounded-lg">✕</button>
        </div>
      )}

      {/* Profile Card (Preferences Tab Removed as per Requirement 10.3) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-md space-y-6 max-w-2xl">
        {/* Avatar & Photo Upload Section (Requirement 10) */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100">
          <div className="relative group">
            {selectedPhoto ? (
              <img
                src={selectedPhoto}
                alt={profileData.name}
                className="w-24 h-24 rounded-full object-cover ring-4 ring-blue-500/20 shadow-md"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-[#0F52BA] text-white flex items-center justify-center font-black text-3xl shadow-md uppercase">
                {(profileData.name || 'T').charAt(0)}
              </div>
            )}

            <label className="absolute bottom-0 right-0 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg cursor-pointer transition-transform transform hover:scale-105">
              <Camera className="w-4 h-4" />
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="text-center sm:text-left space-y-1">
            <h2 className="text-2xl font-black text-slate-900">{profileData.name}</h2>
            <p className="text-xs font-extrabold text-[#0F52BA] bg-blue-50 px-3 py-1 rounded-full inline-block border border-blue-200 uppercase tracking-wider">
              {profileData.role}
            </p>
            <p className="text-xs font-mono text-slate-400 mt-1">{profileData.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
          <div>
            <label className="block text-[11px] text-slate-400 font-bold uppercase mb-1">Full Name</label>
            {isEditing ? (
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setFormData ? setFormData({...profileData, name: e.target.value}) : setProfileData({ ...profileData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-[#0F52BA]"
              />
            ) : (
              <p className="font-extrabold text-slate-900 text-sm">{profileData.name}</p>
            )}
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 font-bold uppercase mb-1">Email Address</label>
            <p className="font-bold text-slate-800 text-sm">{profileData.email}</p>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 font-bold uppercase mb-1">Phone Number</label>
            {isEditing ? (
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="9876543210"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: sanitizePhone(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-[#0F52BA]"
              />
            ) : (
              <p className="font-extrabold text-slate-900 text-sm">{formatPhone(profileData.phone) || 'Not set'}</p>
            )}
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 font-bold uppercase mb-1">Date Joined</label>
            <p className="font-bold text-slate-800 text-sm">{profileData.joinedOn}</p>
          </div>
        </div>

        <div className="pt-4 flex items-center space-x-3 border-t border-slate-100">
          <button
            onClick={handleSave}
            className="bg-[#0F52BA] hover:bg-blue-700 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs inline-flex items-center space-x-2 shadow-md transition-all cursor-pointer"
          >
            {isEditing ? <Check className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            <span>{isEditing ? 'Save Profile Changes' : 'Edit Profile Details'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
