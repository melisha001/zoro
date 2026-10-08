import React, { useState } from 'react';
import { LogIn, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage({ setActiveScreen, onLoginSuccess }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('student@zoroenglish.com');
  const [password, setPassword] = useState('password123');
  const [selectedRole, setSelectedRole] = useState('STUDENT');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }
    const loggedUser = login(email, password, selectedRole);
    if (onLoginSuccess) {
      onLoginSuccess(loggedUser);
    } else {
      if (selectedRole === 'ADMIN' || selectedRole === 'SUPER_ADMIN') {
        setActiveScreen('admin-dash');
      } else if (selectedRole === 'TRAINER') {
        setActiveScreen('trainer-dash');
      } else {
        setActiveScreen('student-dash');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      
      {/* Top Back Navigation */}
      <div className="max-w-md w-full mx-auto px-4 mb-4">
        <button
          onClick={() => setActiveScreen('public-home')}
          className="inline-flex items-center space-x-2 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <img 
          src="/assets/logo.png" 
          alt="Zoro English Academy Logo" 
          className="h-16 w-auto mx-auto object-contain" 
        />
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
          Zoro English Academy
        </h2>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Sign in to your account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl border border-slate-200/80 space-y-6">
          
          {/* Role Selector Tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Select Account Type</label>
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl text-[10px] font-extrabold text-slate-600">
              {[
                { id: 'STUDENT', label: 'Student' },
                { id: 'TRAINER', label: 'Trainer' },
                { id: 'ADMIN', label: 'Admin' },
                { id: 'SUPER_ADMIN', label: 'Super Admin' }
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRole(r.id)}
                  className={`py-2 rounded-lg transition-all ${
                    selectedRole === r.id ? 'bg-blue-600 text-white shadow-xs' : 'hover:bg-slate-200'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email / Username</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@zoroenglish.com"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <span className="font-semibold text-slate-600">Remember me</span>
              </label>
              <a href="#" className="font-bold text-blue-600 hover:text-blue-800">Forgot password?</a>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow-lg transition-transform transform active:scale-95 flex items-center justify-center space-x-2 text-sm"
            >
              <LogIn className="w-4 h-4" />
              <span>Login as {selectedRole.replace('_', ' ')}</span>
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center text-xs">
            <span className="text-slate-500">Don't have an account? </span>
            <button
              onClick={() => setActiveScreen('public-register')}
              className="font-bold text-blue-600 hover:underline"
            >
              Register as Student
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
