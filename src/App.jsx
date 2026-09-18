import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import PublicNavbar from './components/layout/PublicNavbar';
import DashboardSidebar from './components/layout/DashboardSidebar';
import DashboardHeader from './components/layout/DashboardHeader';

import HomePage from './components/public/HomePage';
import CoursePage from './components/public/CoursePage';
import CompetitionPage from './components/public/CompetitionPage';
import EnquireModal from './components/public/EnquireModal';
import LoginModal from './components/public/LoginModal';

import AdminDashboard from './components/admin/AdminDashboard';
import ManageCoursesPage from './components/admin/ManageCoursesPage';
import AddCoursePage from './components/admin/AddCoursePage';
import EditCoursePage from './components/admin/EditCoursePage';
import CourseContentPage from './components/admin/CourseContentPage';
import ManageStudentsPage from './components/admin/ManageStudentsPage';
import ManageTrainersPage from './components/admin/ManageTrainersPage';
import AdminAttendancePage from './components/admin/AttendancePage';
import AdminSchedulePage from './components/admin/AdminSchedulePage';
import AdminFeesPage from './components/admin/AdminFeesPage';
import AdminSalaryPage from './components/admin/AdminSalaryPage';
import AdminDailyReportPage from './components/admin/AdminDailyReportPage';
import AdminAssignmentsPage from './components/admin/AdminAssignmentsPage';
import AdminDoubtsPage from './components/admin/AdminDoubtsPage';
import AdminReportsPage from './components/admin/AdminReportsPage';
import AdminSettingsPage from './components/admin/AdminSettingsPage';

import TrainerDashboard from './components/trainer/TrainerDashboard';
import TrainerStudentsPage from './components/trainer/TrainerStudentsPage';
import TrainerSchedulePage from './components/trainer/TrainerSchedulePage';
import TrainerSessionsPage from './components/trainer/TrainerSessionsPage';
import TrainerAssignmentsPage from './components/trainer/TrainerAssignmentsPage';
import TrainerSubmissionsPage from './components/trainer/TrainerSubmissionsPage';
import TrainerDoubtsPage from './components/trainer/TrainerDoubtsPage';
import TrainerAttendancePage from './components/trainer/TrainerAttendancePage';
import TrainerNotificationsPage from './components/trainer/TrainerNotificationsPage';
import TrainerProfilePage from './components/trainer/TrainerProfilePage';

import StudentDashboard from './components/student/StudentDashboard';
import CourseLearningPage from './components/student/CourseLearningPage';
import StudentAttendancePage from './components/student/AttendancePage';
import JoinSessionPage from './components/student/JoinSessionPage';
import AssignmentPage from './components/student/AssignmentPage';
import DoubtPage from './components/student/DoubtPage';
import StudentProfilePage from './components/student/StudentProfilePage';

import { TRAINER_DATA, STUDENT_DATA } from './data/mockData';

function MainApp() {
  const { user, role } = useAuth();
  const [activeScreen, setActiveScreen] = useState('public-home');
  const [isEnquireOpen, setIsEnquireOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedCourseIdForEdit, setSelectedCourseIdForEdit] = useState('english-comm');

  const isPublicPage = activeScreen.startsWith('public-');
  const isAdminPage = activeScreen.startsWith('admin-');
  const isTrainerPage = activeScreen.startsWith('trainer-');
  const isStudentPage = activeScreen.startsWith('student-');

  const currentRole = role || (isAdminPage ? 'ADMIN' : isTrainerPage ? 'TRAINER' : 'STUDENT');

  // Enforce Role Route Protection
  React.useEffect(() => {
    if (role === 'STUDENT' && (isAdminPage || isTrainerPage)) {
      setActiveScreen('student-dash');
    } else if (role === 'TRAINER' && (isAdminPage || isStudentPage)) {
      setActiveScreen('trainer-dash');
    } else if ((role === 'ADMIN' || role === 'SUPER_ADMIN') && (isTrainerPage || isStudentPage)) {
      setActiveScreen('admin-dash');
    }
  }, [role, activeScreen]);

  const currentUser = user || (
    isAdminPage
      ? { name: 'Admin', role: 'System Administrator', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120' }
      : isTrainerPage
      ? { name: TRAINER_DATA.name, role: TRAINER_DATA.role, avatar: TRAINER_DATA.avatar }
      : { name: STUDENT_DATA.name, role: 'Student • English Communication', avatar: STUDENT_DATA.avatar }
  );

  return (
    <div className="bg-slate-50 font-sans antialiased text-slate-900">
      
      {/* PUBLIC WEBSITE */}
      {isPublicPage ? (
        <div className="min-h-screen flex flex-col">
          <PublicNavbar 
            activeScreen={activeScreen} 
            setActiveScreen={setActiveScreen}
            onOpenLogin={() => setIsLoginOpen(true)}
            onOpenEnquire={() => setIsEnquireOpen(true)}
          />
          <main className="flex-1">
            {activeScreen === 'public-home' && (
              <HomePage setActiveScreen={setActiveScreen} onOpenEnquire={() => setIsEnquireOpen(true)} />
            )}
            {activeScreen === 'public-course' && (
              <CoursePage 
                onOpenEnquire={() => setIsEnquireOpen(true)} 
                setActiveScreen={(screen) => {
                  if (screen === 'public-login') setIsLoginOpen(true);
                  else setActiveScreen(screen);
                }} 
              />
            )}
            {activeScreen === 'public-competition' && (
              <CompetitionPage onOpenEnquire={() => setIsEnquireOpen(true)} />
            )}
          </main>
          
          <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-xs">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <img src="/assets/logo.png" alt="Zoro English Academy Logo" className="h-7 w-auto object-contain" />
                <span className="font-extrabold text-white text-sm">Zoro English Academy</span>
                <span>© 2026 Zoro English Academy. All rights reserved.</span>
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
        /* DASHBOARD LAYOUT (FULL 100vh VIEWPORT SHELL) */
        <div className="h-screen w-full flex overflow-hidden">
          <DashboardSidebar 
            role={currentRole} 
            activeScreen={activeScreen} 
            setActiveScreen={setActiveScreen} 
            isMobileOpen={isMobileMenuOpen}
            onMobileClose={() => setIsMobileMenuOpen(false)}
          />
          <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
            <DashboardHeader 
              user={currentUser} 
              onMobileMenuToggle={() => setIsMobileMenuOpen(true)}
            />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
              {/* Admin Views */}
              {activeScreen === 'admin-dash' && <AdminDashboard />}
              {activeScreen === 'admin-manage-courses' && (
                <ManageCoursesPage 
                  setActiveScreen={setActiveScreen} 
                  setSelectedCourseIdForEdit={setSelectedCourseIdForEdit} 
                />
              )}
              {activeScreen === 'admin-add-course' && <AddCoursePage setActiveScreen={setActiveScreen} />}
              {activeScreen === 'admin-edit-course' && (
                <EditCoursePage courseId={selectedCourseIdForEdit} setActiveScreen={setActiveScreen} />
              )}
              {activeScreen === 'admin-course-content' && (
                <CourseContentPage courseId={selectedCourseIdForEdit} setActiveScreen={setActiveScreen} />
              )}
              {activeScreen === 'admin-manage-students' && <ManageStudentsPage />}
              {activeScreen === 'admin-manage-trainers' && <ManageTrainersPage />}
              {activeScreen === 'admin-attendance' && <AdminAttendancePage setActiveScreen={setActiveScreen} />}
              {activeScreen === 'admin-schedule' && <AdminSchedulePage />}
              {activeScreen === 'admin-fees' && <AdminFeesPage />}
              {activeScreen === 'admin-salary' && <AdminSalaryPage />}
              {activeScreen === 'admin-daily-reports' && <AdminDailyReportPage />}
              {activeScreen === 'admin-assignments' && <AdminAssignmentsPage />}
              {activeScreen === 'admin-doubts' && <AdminDoubtsPage />}
              {activeScreen === 'admin-reports' && <AdminReportsPage />}
              {activeScreen === 'admin-settings' && <AdminSettingsPage />}

              {/* Trainer Views (PDF Pages 1-10) */}
              {activeScreen === 'trainer-dash' && <TrainerDashboard setActiveScreen={setActiveScreen} />}
              {activeScreen === 'trainer-students' && <TrainerStudentsPage />}
              {activeScreen === 'trainer-schedule' && <TrainerSchedulePage setActiveScreen={setActiveScreen} />}
              {activeScreen === 'trainer-sessions' && <TrainerSessionsPage />}
              {activeScreen === 'trainer-assignments' && <TrainerAssignmentsPage />}
              {activeScreen === 'trainer-submissions' && <TrainerSubmissionsPage />}
              {activeScreen === 'trainer-doubts' && <TrainerDoubtsPage />}
              {activeScreen === 'trainer-[#0F52BA]' && <TrainerAttendancePage />}
              {activeScreen === 'trainer-attendance' && <TrainerAttendancePage />}
              {activeScreen === 'trainer-notifications' && <TrainerNotificationsPage />}
              {activeScreen === 'trainer-profile' && <TrainerProfilePage />}

              {/* Student Views */}
              {activeScreen === 'student-dash' && <StudentDashboard setActiveScreen={setActiveScreen} />}
              {activeScreen === 'student-course-learn' && (
                <CourseLearningPage courseId="english-comm" setActiveScreen={setActiveScreen} />
              )}
              {activeScreen === 'student-attendance' && <StudentAttendancePage setActiveScreen={setActiveScreen} />}
              {activeScreen === 'student-join' && <JoinSessionPage setActiveScreen={setActiveScreen} />}
              {activeScreen === 'student-assignment' && <AssignmentPage setActiveScreen={setActiveScreen} />}
              {activeScreen === 'student-doubt' && <DoubtPage setActiveScreen={setActiveScreen} />}
              {activeScreen === 'student-profile' && <StudentProfilePage />}
            </main>
          </div>
        </div>
      )}

      {/* Global Modals */}
      <EnquireModal isOpen={isEnquireOpen} onClose={() => setIsEnquireOpen(false)} />

      {/* Login Dialogue Box Modal */}
      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
        onLoginSuccess={(loggedUser) => {
          if (loggedUser.role === 'ADMIN' || loggedUser.role === 'SUPER_ADMIN') {
            setActiveScreen('admin-dash');
          } else if (loggedUser.role === 'TRAINER') {
            setActiveScreen('trainer-dash');
          } else {
            setActiveScreen('student-dash');
          }
        }}
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
