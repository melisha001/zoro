import React, { useState } from 'react';
import { KeyRound, Lock, Eye, EyeOff, AlertCircle, LogOut, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { changePassword } from '../../api/userApi';

export default function ForceChangePasswordModal() {
  const { user, updateUserInContext, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // If user does not require password change, do not render modal
  if (!user || !user.mustChangePassword) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!currentPassword) {
      setError('Current / temporary password is required.');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }
    if (newPassword === currentPassword) {
      setError('New password must be different from your temporary password.');
      return;
    }

    setLoading(true);
    try {
      const res = await changePassword(currentPassword, newPassword);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          updateUserInContext({ mustChangePassword: false });
        }, 1200);
      } else {
        setError(res.message || 'Failed to update password. Please check your current password.');
      }
    } catch (err) {
      setError(err?.message || 'An unexpected error occurred while updating your password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 sm:p-8 space-y-6 relative animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="force-password-change-title"
      >
        {/* Header Icon & Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-amber-100 text-amber-700 rounded-2xl shadow-xs">
            <KeyRound className="w-8 h-8" />
          </div>
          <h2 id="force-password-change-title" className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Change Temporary Password
          </h2>
          <p className="text-xs text-slate-500 font-medium leading-relaxed px-2">
            Welcome, <strong className="text-slate-800">{user.name || user.email}</strong>. For account security, you must update your temporary password before accessing the portal.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-2.5 text-xs font-bold text-rose-700 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {/* Success State */}
        {success ? (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2 text-emerald-800 animate-in fade-in">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="text-base font-black">Password Updated Successfully!</h3>
            <p className="text-xs font-medium text-emerald-700">Redirecting to your dashboard...</p>
          </div>
        ) : (
          /* Password Form */
          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
            {/* Current / Temporary Password */}
            <div>
              <label className="block font-extrabold text-slate-800 mb-1">
                Current / Temporary Password *
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block font-extrabold text-slate-800 mb-1">
                New Password (minimum 8 characters) *
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new secure password"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block font-extrabold text-slate-800 mb-1">
                Confirm New Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Update Password & Continue</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={logout}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 font-extrabold rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer text-xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
