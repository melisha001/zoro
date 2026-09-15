import React, { useState } from 'react';
import TopRoleBar from './components/layout/TopRoleBar';
import PublicNavbar from './components/layout/PublicNavbar';
import DashboardSidebar from './components/layout/DashboardSidebar';
import DashboardHeader from './components/layout/DashboardHeader';
import HomePage from './components/public/HomePage';
import CoursePage from './components/public/CoursePage';
import CompetitionPage from './components/public/CompetitionPage';
import EnquireModal from './components/public/EnquireModal';
import AdminDashboard from './components/admin/AdminDashboard';
import TrainerDashboard from './components/trainer/TrainerDashboard';
import StudentDashboard from './components/student/StudentDashboard';
import JoinSessionPage from './components/student/JoinSessionPage';
import AssignmentPage from './components/student/AssignmentPage';
import DoubtPage from './components/student/DoubtPage';
import { TRAINER_DATA, STUDENT_DATA } from './data/mockData';

export default function App() {
  const [activeScreen, setActiveScreen] = useState('public-home');
  const [isEnquireOpen, setIsEnquireOpen] = useState(false);

  const isPublicPage = activeScreen.startsWith('public-');
  const isAdminPage = activeScreen.startsWith('admin-');
  const isTrainerPage = activeScreen.startsWith('trainer-');

  // Active user details for headers
  const currentUser = isAdminPage
    ? { name: 'Admin', role: 'System Administrator', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120' }
    : isTrainerPage
    ? { name: TRAINER_DATA.name, role: TRAINER_DATA.role, avatar: TRAINER_DATA.avatar }
    : { name: STUDENT_DATA.name, role: 'Student • Abacus L3', avatar: STUDENT_DATA.avatar };

  const currentRole = isAdminPage ? 'Admin' : isTrainerPage ? 'Trainer' : 'Student';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-900">
      
      {/* Top Demo Bar Switcher */}
      <TopRoleBar activeScreen={activeScreen} setActiveScreen={setActiveScreen} />

      {/* PUBLIC WEBSITE LAYOUT */}
      {isPublicPage ? (
        <div className="flex-1 flex flex-col">
          <PublicNavbar 
            activeScreen={activeScreen} 
            setActiveScreen={setActiveScreen}
            onOpenEnquire={() => setIsEnquireOpen(true)}
          />
          <main className="flex-1">
            {activeScreen === 'public-home' && (
              <HomePage setActiveScreen={setActiveScreen} onOpenEnquire={() => setIsEnquireOpen(true)} />
            )}
            {activeScreen === 'public-course' && (
              <CoursePage onOpenEnquire={() => setIsEnquireOpen(true)} />
            )}
            {activeScreen === 'public-competition' && (
              <CompetitionPage onOpenEnquire={() => setIsEnquireOpen(true)} />
            )}
          </main>
          
          {/* Public Footer */}
          <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-xs">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <img src="/assets/logo.png" alt="ZORO Logo" className="h-7 w-auto object-contain" />
                <span className="font-extrabold text-white text-sm">ZORO Academy</span>
                <span>© 2026 Zoro Inc. All rights reserved.</span>
              </div>
              <div className="flex space-x-6 text-slate-400 font-semibold">
                <a href="#" className="hover:text-white">Privacy Policy</a>
                <a href="#" className="hover:text-white">Terms of Service</a>
                <a href="#" className="hover:text-white">Contact Us</a>
              </div>
            </div>
          </footer>
        </div>
      ) : (
        /* DASHBOARD LAYOUT (Admin, Trainer, Student) */
        <div className="flex-1 flex h-[calc(100vh-41px)] overflow-hidden">
          <DashboardSidebar 
            role={currentRole} 
            activeScreen={activeScreen} 
            setActiveScreen={setActiveScreen} 
          />
          <div className="flex-1 flex flex-col overflow-y-auto">
            <DashboardHeader user={currentUser} />
            <main className="flex-1">
              {activeScreen === 'admin-dash' && <AdminDashboard />}
              {activeScreen === 'trainer-dash' && <TrainerDashboard setActiveScreen={setActiveScreen} />}
              {activeScreen === 'student-dash' && <StudentDashboard setActiveScreen={setActiveScreen} />}
              {activeScreen === 'student-join' && <JoinSessionPage setActiveScreen={setActiveScreen} />}
              {activeScreen === 'student-assignment' && <AssignmentPage setActiveScreen={setActiveScreen} />}
              {activeScreen === 'student-doubt' && <DoubtPage setActiveScreen={setActiveScreen} />}
            </main>
          </div>
        </div>
      )}

      {/* Global Enquiry Popup */}
      <EnquireModal isOpen={isEnquireOpen} onClose={() => setIsEnquireOpen(false)} />

    </div>
  );
}
