import React, { useState, Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import PublicNavbar from './components/layout/PublicNavbar';
import DashboardSidebar from './components/layout/DashboardSidebar';
import DashboardHeader from './components/layout/DashboardHeader';

import HomePage from './components/public/HomePage';
import CoursePage from './components/public/CoursePage';
import CompetitionPage from './components/public/CompetitionPage';
import ContactPage from './components/public/ContactPage';
import EnquireModal from './components/public/EnquireModal';
import LoginModal from './components/public/LoginModal';

// Code-splitting via React.lazy for portal screens
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));
const ManageCoursesPage = lazy(() => import('./components/admin/ManageCoursesPage'));
const AdminBatchManagementPage = lazy(() => import('./components/admin/AdminBatchManagementPage'));
const AddCoursePage = lazy(() => import('./components/admin/AddCoursePage'));
const EditCoursePage = lazy(() => import('./components/admin/EditCoursePage'));
const CourseContentPage = lazy(() => import('./components/admin/CourseContentPage'));
const ManageStudentsPage = lazy(() => import('./components/admin/ManageStudentsPage'));
const ManageTrainersPage = lazy(() => import('./components/admin/ManageTrainersPage'));
const AdminAttendancePage = lazy(() => import('./components/admin/AttendancePage'));
const AdminSchedulePage = lazy(() => import('./components/admin/AdminSchedulePage'));
const AdminFeesPage = lazy(() => import('./components/admin/AdminFeesPage'));
const AdminExpensesPage = lazy(() => import('./components/admin/AdminExpensesPage'));
const AdminSalaryPage = lazy(() => import('./components/admin/AdminSalaryPage'));
const AdminDailyReportPage = lazy(() => import('./components/admin/AdminDailyReportPage'));
const AdminCompetitionPage = lazy(() => import('./components/admin/AdminCompetitionPage'));
const AdminCompetitionRegistrationsPage = lazy(() => import('./components/admin/AdminCompetitionRegistrationsPage'));
const AdminCompetitionModulesPage = lazy(() => import('./components/admin/AdminCompetitionModulesPage'));
const AdminAssignmentsPage = lazy(() => import('./components/admin/AdminAssignmentsPage'));
const AdminDoubtsPage = lazy(() => import('./components/admin/AdminDoubtsPage'));
const AdminEnquiryPage = lazy(() => import('./components/admin/AdminEnquiryPage'));
const AdminReportsPage = lazy(() => import('./components/admin/AdminReportsPage'));
const AdminSettingsPage = lazy(() => import('./components/admin/AdminSettingsPage'));

const TrainerDashboard = lazy(() => import('./components/trainer/TrainerDashboard'));
const TrainerCoursesPage = lazy(() => import('./components/trainer/TrainerCoursesPage'));
const TrainerStudentsPage = lazy(() => import('./components/trainer/TrainerStudentsPage'));
const TrainerSchedulePage = lazy(() => import('./components/trainer/TrainerSchedulePage'));
const TrainerSessionsPage = lazy(() => import('./components/trainer/TrainerSessionsPage'));
const TrainerAssignmentsPage = lazy(() => import('./components/trainer/TrainerAssignmentsPage'));
const TrainerSubmissionsPage = lazy(() => import('./components/trainer/TrainerSubmissionsPage'));
const TrainerDoubtsPage = lazy(() => import('./components/trainer/TrainerDoubtsPage'));
const TrainerAttendancePage = lazy(() => import('./components/trainer/TrainerAttendancePage'));
const TrainerNotificationsPage = lazy(() => import('./components/trainer/TrainerNotificationsPage'));
const TrainerProfilePage = lazy(() => import('./components/trainer/TrainerProfilePage'));

const StudentDashboard = lazy(() => import('./components/student/StudentDashboard'));
const CourseLearningPage = lazy(() => import('./components/student/CourseLearningPage'));
const StudentAttendancePage = lazy(() => import('./components/student/AttendancePage'));
const JoinSessionPage = lazy(() => import('./components/student/JoinSessionPage'));
const AssignmentPage = lazy(() => import('./components/student/AssignmentPage'));
const DoubtPage = lazy(() => import('./components/student/DoubtPage'));
const StudentProfilePage = lazy(() => import('./components/student/StudentProfilePage'));

function PortalLoadingFallback() {
  return (
    <div className="flex h-64 w-full items-center justify-center">
      <div className="flex flex-col items-center space-y-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        <span className="text-sm font-medium text-slate-500">Loading module...</span>
      </div>
    </div>
  );
}

function MainApp() {
  const { user, role, loading } = useAuth();
  const [activeScreen, setActiveScreen] = useState('public-home');
  const [isEnquireOpen, setIsEnquireOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedCourseIdForEdit, setSelectedCourseIdForEdit] = useState('english-comm');
  const [selectedCompIdForModules, setSelectedCompIdForModules] = useState('comp-spell-bee');

  const isPublicPage = activeScreen.startsWith('public-');
  const isAdminPage = activeScreen.startsWith('admin-');
  const isTrainerPage = activeScreen.startsWith('trainer-');
  const isStudentPage = activeScreen.startsWith('student-');

  const currentRole = role || (isAdminPage ? 'ADMIN' : isTrainerPage ? 'TRAINER' : 'STUDENT');

  // Sync activeScreen with browser URL path (supports refresh & direct URL navigation)
  React.useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname.toLowerCase();
      if (path === '/contact') {
        setActiveScreen('public-contact');
      } else if (path === '/courses') {
        setActiveScreen('public-course');
      } else if (path === '/competitions') {
        setActiveScreen('public-competition');
      } else if (path === '/' || path === '/home') {
        if (!user) {
          setActiveScreen('public-home');
        }
      }
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, [user]);

  // If session restored and user is authenticated on home path, redirect to their role dashboard
  React.useEffect(() => {
    if (!loading && user && activeScreen === 'public-home') {
      const path = window.location.pathname.toLowerCase();
      if (path === '/' || path === '/home' || path === '') {
        const roleUpper = (user.role || role || 'STUDENT').toUpperCase();
        if (roleUpper === 'ADMIN' || roleUpper === 'SUPER_ADMIN') {
          setActiveScreen('admin-dash');
        } else if (roleUpper === 'TRAINER') {
          setActiveScreen('trainer-dash');
        } else {
          setActiveScreen('student-dash');
        }
      }
    }
  }, [loading, user, role, activeScreen]);

  // If user logs out, redirect to public home
  React.useEffect(() => {
    if (!loading && !user && !isPublicPage) {
      setActiveScreen('public-home');
    }
  }, [loading, user, isPublicPage]);

  // Update browser URL when public screens change
  React.useEffect(() => {
    if (activeScreen === 'public-home') {
      if (window.location.pathname !== '/' && window.location.pathname !== '/home') {
        window.history.pushState(null, '', '/');
      }
    } else if (activeScreen === 'public-contact') {
      if (window.location.pathname !== '/contact') {
        window.history.pushState(null, '', '/contact');
      }
    } else if (activeScreen === 'public-course') {
      if (window.location.pathname !== '/courses') {
        window.history.pushState(null, '', '/courses');
      }
    } else if (activeScreen === 'public-competition') {
      if (window.location.pathname !== '/competitions') {
        window.history.pushState(null, '', '/competitions');
      }
    }
  }, [activeScreen]);

  // Enforce Role Route Protection
  React.useEffect(() => {
    if (role === 'STUDENT' && (isAdminPage || isTrainerPage)) {
      setActiveScreen('student-dash');
    } else if (role === 'TRAINER' && (isAdminPage || isStudentPage)) {
      setActiveScreen('trainer-dash');
    } else if ((role === 'ADMIN' || role === 'SUPER_ADMIN') && (isTrainerPage || isStudentPage)) {
      setActiveScreen('admin-dash');
    }
  }, [role, activeScreen, isAdminPage, isTrainerPage, isStudentPage]);

  // Session restore loading screen
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-300 font-medium">Loading Zoro English Academy...</p>
      </div>
    );
  }

  const currentUser = user || (
    isAdminPage
      ? { name: 'Admin', role: 'System Administrator', avatar: '' }
      : isTrainerPage
      ? { name: 'Trainer', role: 'Trainer', avatar: '' }
      : { name: 'Student', role: 'Student', avatar: '' }
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
            {activeScreen === 'public-contact' && (
              <ContactPage onOpenEnquire={() => setIsEnquireOpen(true)} />
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
                <button 
                  onClick={() => setActiveScreen('public-contact')}
                  className="hover:text-white cursor-pointer"
                >
                  Contact Us
                </button>
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
              setActiveScreen={setActiveScreen}
            />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
              <Suspense fallback={<PortalLoadingFallback />}>
                {/* Admin Views */}
                {activeScreen === 'admin-dash' && <AdminDashboard setActiveScreen={setActiveScreen} />}
                {activeScreen === 'admin-manage-courses' && (
                  <ManageCoursesPage 
                    setActiveScreen={setActiveScreen} 
                    setSelectedCourseIdForEdit={setSelectedCourseIdForEdit} 
                  />
                )}
                {activeScreen === 'admin-batch-management' && <AdminBatchManagementPage />}
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
                {activeScreen === 'admin-assignments' && <AdminAssignmentsPage />}
                {activeScreen === 'admin-doubts' && <AdminDoubtsPage />}
                {activeScreen === 'admin-enquiries' && <AdminEnquiryPage />}
                {activeScreen === 'admin-fees' && <AdminFeesPage />}
                {activeScreen === 'admin-expenses' && <AdminExpensesPage setActiveScreen={setActiveScreen} />}
                {activeScreen === 'admin-salary' && <AdminSalaryPage />}
                {activeScreen === 'admin-daily-reports' && <AdminDailyReportPage />}
                {activeScreen === 'admin-competition' && (
                  <AdminCompetitionPage 
                    setActiveScreen={setActiveScreen} 
                    setSelectedCompIdForModules={setSelectedCompIdForModules} 
                  />
                )}
                {activeScreen === 'admin-competition-modules' && (
                  <AdminCompetitionModulesPage 
                    competitionId={selectedCompIdForModules} 
                    setActiveScreen={setActiveScreen} 
                  />
                )}
                {activeScreen === 'admin-competition-registrations' && (
                  <AdminCompetitionRegistrationsPage setActiveScreen={setActiveScreen} />
                )}
                {activeScreen === 'admin-reports' && <AdminReportsPage />}
                {activeScreen === 'admin-settings' && <AdminSettingsPage />}


                {/* Trainer Views */}
                {activeScreen === 'trainer-dash' && <TrainerDashboard setActiveScreen={setActiveScreen} />}
                {activeScreen === 'trainer-courses' && <TrainerCoursesPage />}
                {activeScreen === 'trainer-students' && <TrainerStudentsPage />}
                {activeScreen === 'trainer-schedule' && <TrainerSchedulePage setActiveScreen={setActiveScreen} />}
                {activeScreen === 'trainer-sessions' && <TrainerSessionsPage />}
                {activeScreen === 'trainer-assignments' && <TrainerAssignmentsPage />}
                {activeScreen === 'trainer-submissions' && <TrainerSubmissionsPage />}
                {activeScreen === 'trainer-doubts' && <TrainerDoubtsPage />}
                {activeScreen === 'trainer-attendance' && <TrainerAttendancePage />}
                {activeScreen === 'trainer-notifications' && <TrainerNotificationsPage />}
                {activeScreen === 'trainer-profile' && <TrainerProfilePage />}

                {/* Student Views */}
                {activeScreen === 'student-dash' && <StudentDashboard setActiveScreen={setActiveScreen} />}
                {activeScreen === 'student-course-learn' && (
                  <CourseLearningPage setActiveScreen={setActiveScreen} />
                )}
                {activeScreen === 'student-attendance' && <StudentAttendancePage setActiveScreen={setActiveScreen} />}
                {activeScreen === 'student-join' && <JoinSessionPage setActiveScreen={setActiveScreen} />}
                {activeScreen === 'student-assignment' && <AssignmentPage setActiveScreen={setActiveScreen} />}
                {activeScreen === 'student-doubt' && <DoubtPage setActiveScreen={setActiveScreen} />}
                {activeScreen === 'student-profile' && <StudentProfilePage />}
              </Suspense>
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
