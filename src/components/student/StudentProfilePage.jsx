import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, BookOpen, Key, Check, Edit3, Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getStudentEnrolledCourses } from '../../api/enrollmentApi';
import { updateStudent, updateStudentPassword } from '../../api/userApi';

export default function StudentProfilePage() {
  const { user, updateUserInContext } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  
  const [profileData, setProfileData] = useState({
    name: user?.name || 'Arjun M',
    email: user?.email || 'arjun@student.com',
    phone: user?.phone || '+91 98765 43210',
    address: user?.address || 'No. 45, Gandhi Street, Chennai - 600001',
    joinedOn: user?.joinedOn || '12 Jan 2026'
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user?.email || user?.id) {
      getStudentEnrolledCourses(user.id || user.email).then(courses => {
        setEnrolledCourses(courses || []);
      });
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (user?.id) {
      await updateStudent(user.id, profileData);
      updateUserInContext(profileData);
    }
    setIsEditing(false);
    setMsg({ type: 'success', text: 'Profile updated successfully!' });
    setTimeout(() => setMsg({ type: '', text: '' }), 3000);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setMsg({ type: 'error', text: 'Please fill in all password fields.' });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMsg({ type: 'error', text: 'New password and confirm password do not match.' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMsg({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }

    const res = await updateStudentPassword(
      user?.id || user?.email || 'arjun@student.com',
      passwordData.currentPassword,
      passwordData.newPassword
    );

    if (res.success) {
      setMsg({ type: 'success', text: 'Password changed successfully! Next login will require your new password.' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      updateUserInContext({ password: passwordData.newPassword });
    } else {
      setMsg({ type: 'error', text: res.message || 'Failed to change password. Please check your current password.' });
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 bg-slate-50 min-h-screen">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Student Profile</h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">Manage your account credentials, contact information, and security preferences.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs sm:text-sm font-bold">
        <button
          onClick={() => { setActiveTab('profile'); setMsg({ type: '', text: '' }); }}
          className={`pb-3 transition-colors border-b-2 cursor-pointer ${
            activeTab === 'profile'
              ? 'border-blue-600 text-blue-600 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          My Details & Enrolled Courses
        </button>
        <button
          onClick={() => { setActiveTab('password'); setMsg({ type: '', text: '' }); }}
          className={`pb-3 transition-colors border-b-2 cursor-pointer ${
            activeTab === 'password'
              ? 'border-blue-600 text-blue-600 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Change Password
        </button>
      </div>

      {msg.text && (
        <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 max-w-2xl ${
          msg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {msg.type === 'success' ? <Check className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Profile Details Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-md space-y-6 max-w-2xl">
          {/* Avatar and Basic info */}
          <div className="flex items-center gap-5 border-b border-slate-100 pb-6">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200'}
              alt={profileData.name}
              className="w-20 h-20 rounded-full object-cover ring-4 ring-blue-100 shadow-md"
            />
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{profileData.name}</h2>
              <span className="inline-block bg-blue-50 text-blue-700 font-extrabold text-[10px] px-3 py-1 rounded-full uppercase tracking-wider mt-1 border border-blue-200">
                Active Student
              </span>
              <p className="text-xs font-mono text-slate-400 mt-1">{profileData.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
            <div>
              <label className="block text-slate-400 font-bold mb-1 uppercase tracking-wider text-[10px]">Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white"
                />
              ) : (
                <p className="font-extrabold text-slate-900 text-sm">{profileData.name}</p>
              )}
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1 uppercase tracking-wider text-[10px]">Email Address</label>
              <p className="font-bold text-blue-900">{profileData.email}</p>
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1 uppercase tracking-wider text-[10px]">Phone Number</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white"
                />
              ) : (
                <p className="font-extrabold text-slate-800">{profileData.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1 uppercase tracking-wider text-[10px]">Joined Date</label>
              <p className="font-bold text-slate-800">{profileData.joinedOn}</p>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-400 font-bold mb-1 uppercase tracking-wider text-[10px]">Residential Address</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.address}
                  onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white"
                />
              ) : (
                <p className="font-bold text-slate-800">{profileData.address}</p>
              )}
            </div>
          </div>

          {/* Enrolled Courses Card Section */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>Enrolled Skill Programs</span>
            </h3>

            {enrolledCourses.length > 0 ? (
              <div className="space-y-2">
                {enrolledCourses.map(c => (
                  <div key={c.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex justify-between items-center text-xs">
                    <div>
                      <h4 className="font-extrabold text-slate-900">{c.title}</h4>
                      <p className="text-[10px] text-slate-500 font-medium">{c.duration} • {c.mode}</p>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full">
                      ACTIVE
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No courses currently enrolled.</p>
            )}
          </div>

          <div className="pt-2">
            <button
              onClick={isEditing ? handleSaveProfile : () => setIsEditing(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-black px-5 py-2.5 rounded-xl shadow-md text-xs inline-flex items-center space-x-2 cursor-pointer transition-colors"
            >
              {isEditing ? <Check className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              <span>{isEditing ? 'Save Changes' : 'Edit Profile Information'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Change Password Tab */}
      {activeTab === 'password' && (
        <form onSubmit={handleChangePassword} className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-md space-y-4 max-w-md text-xs">
          <h3 className="font-black text-slate-900 text-base border-b border-slate-100 pb-3 flex items-center space-x-2">
            <Key className="w-4 h-4 text-blue-600" />
            <span>Change Student Account Password</span>
          </h3>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Current Password</label>
            <input 
              type="password"
              required
              placeholder="Enter current password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
            <input 
              type="password"
              required
              placeholder="Enter new password (min 6 characters)"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password</label>
            <input 
              type="password"
              required
              placeholder="Re-enter new password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl shadow-md transition-all text-xs cursor-pointer mt-2"
          >
            Update Account Password
          </button>
        </form>
      )}

    </div>
  );
}
