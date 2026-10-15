import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, useParams, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DialogProvider } from './context/DialogContext';
import { WebsiteSettingsProvider, useWebsiteSettings } from './context/WebsiteSettingsContext';
import PublicNavbar from './components/layout/PublicNavbar';
import DashboardSidebar from './components/layout/DashboardSidebar';
import DashboardHeader from './components/layout/DashboardHeader';
import ErrorBoundary from './components/common/ErrorBoundary';

import HomePage from './components/public/HomePage';
import CoursePage from './components/public/CoursePage';
import CompetitionPage from './components/public/CompetitionPage';
import ContactPage from './components/public/ContactPage';
import EnquireModal from './components/public/EnquireModal';
import LoginModal from './components/public/LoginModal';
import { getWebsiteSettings } from './api/websiteSettingsApi';

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
const AdminTrainerAssignmentsPage = lazy(() => import('./components/admin/AdminTrainerAssignmentsPage'));
const AdminDoubtsPage = lazy(() => import('./components/admin/AdminDoubtsPage'));
const AdminEnquiryPage = lazy(() => import('./components/admin/AdminEnquiryPage'));
const AdminReportsPage = lazy(() => import('./components/admin/AdminReportsPage'));
const AdminNotificationsPage = lazy(() => import('./components/admin/AdminNotificationsPage'));
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
const StudentNotificationsPage = lazy(() => import('./components/student/StudentNotificationsPage'));
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

function getActiveScreenFromPath(path) {
  if (path === '/' || path === '/home') return 'public-home';
  if (path === '/courses') return 'public-course';
  if (path === '/competitions') return 'public-competition';
  if (path === '/contact') return 'public-contact';

  if (path === '/admin' || path === '/admin/') return 'admin-dash';
  if (path === '/admin/courses') return 'admin-manage-courses';
  if (path === '/admin/courses/new') return 'admin-add-course';
  if (path.includes('/admin/courses/') && path.includes('/edit')) return 'admin-edit-course';
  if (path.includes('/admin/courses/') && path.includes('/content')) return 'admin-course-content';
  if (path === '/admin/batches') return 'admin-batch-management';
  if (path === '/admin/students') return 'admin-manage-students';
  if (path === '/admin/trainers') return 'admin-manage-trainers';
  if (path === '/admin/attendance') return 'admin-attendance';
  if (path === '/admin/schedules') return 'admin-schedule';
  if (path === '/admin/assignments') return 'admin-assignments';
  if (path === '/admin/trainer-assignments') return 'admin-trainer-assignments';
  if (path === '/admin/doubts') return 'admin-doubts';
  if (path === '/admin/enquiries') return 'admin-enquiries';
  if (path === '/admin/fees') return 'admin-fees';
  if (path === '/admin/expenses') return 'admin-expenses';
  if (path === '/admin/salary') return 'admin-salary';
  if (path === '/admin/daily-reports') return 'admin-daily-reports';
  if (path === '/admin/competitions') return 'admin-competition';
  if (path.includes('/admin/competitions/') && path.includes('/modules')) return 'admin-competition-modules';
  if (path === '/admin/competitions/registrations') return 'admin-competition-registrations';
  if (path === '/admin/reports') return 'admin-reports';
  if (path === '/admin/notifications') return 'admin-notifications';
  if (path === '/admin/settings') return 'admin-settings';

  if (path === '/trainer' || path === '/trainer/') return 'trainer-dash';
  if (path === '/trainer/courses') return 'trainer-courses';
  if (path === '/trainer/students') return 'trainer-students';
  if (path === '/trainer/schedules') return 'trainer-schedule';
  if (path === '/trainer/sessions') return 'trainer-sessions';
  if (path === '/trainer/assignments') return 'trainer-assignments';
  if (path === '/trainer/submissions') return 'trainer-submissions';
  if (path === '/trainer/doubts') return 'trainer-doubts';
  if (path === '/trainer/attendance') return 'trainer-attendance';
  if (path === '/trainer/notifications') return 'trainer-notifications';
  if (path === '/trainer/profile') return 'trainer-profile';

  if (path === '/student' || path === '/student/') return 'student-dash';
  if (path === '/student/courses') return 'student-course-learn';
  if (path === '/student/attendance') return 'student-attendance';
  if (path === '/student/join') return 'student-join';
  if (path === '/student/assignments') return 'student-assignment';
  if (path === '/student/doubts') return 'student-doubt';
  if (path === '/student/notifications') return 'student-notifications';
  if (path === '/student/profile') return 'student-profile';

  return 'public-home';
}

function screenToPath(screen, params = {}) {
  switch (screen) {
    case 'public-home': return '/';
    case 'public-course': return '/courses';
    case 'public-competition': return '/competitions';
    case 'public-contact': return '/contact';

    // Admin
    case 'admin-dash': return '/admin';
    case 'admin-manage-courses': return '/admin/courses';
    case 'admin-add-course': return '/admin/courses/new';
    case 'admin-edit-course': return params.courseId ? `/admin/courses/${params.courseId}/edit` : '/admin/courses';
    case 'admin-course-content': return params.courseId ? `/admin/courses/${params.courseId}/content` : '/admin/courses';
    case 'admin-batch-management': return '/admin/batches';
    case 'admin-manage-students': return '/admin/students';
    case 'admin-manage-trainers': return '/admin/trainers';
    case 'admin-attendance': return '/admin/attendance';
    case 'admin-schedule': return '/admin/schedules';
    case 'admin-assignments': return '/admin/assignments';
    case 'admin-trainer-assignments': return '/admin/trainer-assignments';
    case 'admin-doubts': return '/admin/doubts';
    case 'admin-enquiries': return '/admin/enquiries';
    case 'admin-fees': return '/admin/fees';
    case 'admin-expenses': return '/admin/expenses';
    case 'admin-salary': return '/admin/salary';
    case 'admin-daily-reports': return '/admin/daily-reports';
    case 'admin-competition': return '/admin/competitions';
    case 'admin-competition-modules': return params.competitionId ? `/admin/competitions/${params.competitionId}/modules` : '/admin/competitions';
    case 'admin-competition-registrations': return '/admin/competitions/registrations';
    case 'admin-reports': return '/admin/reports';
    case 'admin-notifications': return '/admin/notifications';
    case 'admin-settings': return '/admin/settings';

    // Trainer
    case 'trainer-dash': return '/trainer';
    case 'trainer-courses': return '/trainer/courses';
    case 'trainer-students': return '/trainer/students';
    case 'trainer-schedule': return '/trainer/schedules';
    case 'trainer-sessions': return '/trainer/sessions';
    case 'trainer-assignments': return '/trainer/assignments';
    case 'trainer-submissions': return '/trainer/submissions';
    case 'trainer-doubts': return '/trainer/doubts';
    case 'trainer-attendance': return '/trainer/attendance';
    case 'trainer-notifications': return '/trainer/notifications';
    case 'trainer-profile': return '/trainer/profile';

    // Student
    case 'student-dash': return '/student';
    case 'student-course-learn': return '/student/courses';
    case 'student-attendance': return '/student/attendance';
    case 'student-join': return '/student/join';
    case 'student-assignment': return '/student/assignments';
    case 'student-doubt': return '/student/doubts';
    case 'student-notifications': return '/student/notifications';
    case 'student-profile': return '/student/profile';

    default:
      if (typeof screen === 'string' && screen.startsWith('/')) return screen;
      return '/';
  }
}

// Protected route component that checks auth and role
function ProtectedRoute({ allowedRoles, children }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-300 font-medium">Loading Zoro English Academy...</p>
      </div>
    );
  }

  // Unauthenticated users can NEVER view dashboard screens
  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  const currentRole = (user.role || role || '').toUpperCase();
  if (allowedRoles && !allowedRoles.includes(currentRole)) {
    if (currentRole === 'ADMIN' || currentRole === 'SUPER_ADMIN') {
      return <Navigate to="/admin" replace />;
    } else if (currentRole === 'TRAINER') {
      return <Navigate to="/trainer" replace />;
    } else {
      return <Navigate to="/student" replace />;
    }
  }

  return children;
}

// Public website layout
function PublicLayout({ onOpenLogin, onOpenEnquire }) {
  const location = useLocation();
  const navigate = useNavigate();
  const activeScreen = getActiveScreenFromPath(location.pathname);
  const { settings: siteSettings, academyName, contactEmail, contactPhone, address } = useWebsiteSettings();

  const handleSetActiveScreen = (screen) => {
    if (screen === 'public-login') {
      onOpenLogin();
    } else {
      navigate(screenToPath(screen));
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans antialiased text-slate-900">
      <PublicNavbar 
        activeScreen={activeScreen} 
        setActiveScreen={handleSetActiveScreen}
        onOpenLogin={onOpenLogin}
        onOpenEnquire={onOpenEnquire}
        siteSettings={siteSettings}
      />
      <main className="flex-1">
        <Outlet context={{ onOpenLogin, onOpenEnquire, setActiveScreen: handleSetActiveScreen }} />
      </main>
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center space-x-3 text-center sm:text-left gap-2 sm:gap-0">
            <img src="/assets/logo.png" alt={`${academyName} Logo`} className="h-7 w-auto object-contain" />
            <div>
              <span className="font-extrabold text-white text-sm block sm:inline">{academyName}</span>
              <span className="block sm:inline sm:ml-2">© 2026 {academyName}. All rights reserved.</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-400 font-medium">
            {contactEmail && (
              <a href={`mailto:${contactEmail}`} className="hover:text-white transition-colors">
                {contactEmail}
              </a>
            )}
            {contactPhone && (
              <a href={`tel:${contactPhone.replace(/\s+/g, '')}`} className="hover:text-white transition-colors">
                {contactPhone}
              </a>
            )}
            {address && (
              <span className="hidden lg:inline text-slate-500">
                {address}
              </span>
            )}
          </div>
          <div className="flex space-x-6 text-slate-400 font-semibold">
            <a href="#" className="hover:text-white">Privacy Policy</a>
            <a href="#" className="hover:text-white">Terms of Service</a>
            <button 
              onClick={() => navigate('/contact')}
              className="hover:text-white cursor-pointer"
            >
              Contact Us
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Authenticated portal dashboard layout (Strictly authenticated user, no fake fallbacks)
function DashboardLayout({ expectedRole }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const selectedCourseIdRef = useRef('');
  const selectedCompIdRef = useRef('');

  const activeScreen = getActiveScreenFromPath(location.pathname);
  const currentRole = (user?.role || expectedRole || '').toUpperCase();

  const handleSetActiveScreen = (screen) => {
    if (screen === 'admin-edit-course') {
      navigate(selectedCourseIdRef.current ? `/admin/courses/${selectedCourseIdRef.current}/edit` : '/admin/courses');
    } else if (screen === 'admin-course-content') {
      navigate(selectedCourseIdRef.current ? `/admin/courses/${selectedCourseIdRef.current}/content` : '/admin/courses');
    } else if (screen === 'admin-competition-modules') {
      navigate(selectedCompIdRef.current ? `/admin/competitions/${selectedCompIdRef.current}/modules` : '/admin/competitions');
    } else {
      navigate(screenToPath(screen));
    }
  };

  const setSelectedCourseIdForEdit = (id) => {
    selectedCourseIdRef.current = id;
  };

  const setSelectedCompIdForModules = (id) => {
    selectedCompIdRef.current = id;
  };

  return (
    <div className="h-screen w-full flex overflow-hidden bg-slate-50 font-sans antialiased text-slate-900">
      <DashboardSidebar 
        role={currentRole} 
        activeScreen={activeScreen} 
        setActiveScreen={handleSetActiveScreen} 
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <DashboardHeader 
          user={user} 
          onMobileMenuToggle={() => setIsMobileMenuOpen(true)}
          setActiveScreen={handleSetActiveScreen}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Suspense fallback={<PortalLoadingFallback />}>
            <ErrorBoundary>
              <Outlet context={{ 
                setActiveScreen: handleSetActiveScreen, 
                setSelectedCourseIdForEdit, 
                setSelectedCompIdForModules 
              }} />
            </ErrorBoundary>
          </Suspense>
        </main>
      </div>
    </div>
  );
}

// Wrapper components for parameterized route views
function EditCourseWrapper() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  return <EditCoursePage courseId={courseId} setActiveScreen={(s) => navigate(screenToPath(s))} />;
}

function CourseContentWrapper() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  return <CourseContentPage courseId={courseId} setActiveScreen={(s) => navigate(screenToPath(s))} />;
}

function CompetitionModulesWrapper() {
  const { competitionId } = useParams();
  const navigate = useNavigate();
  return <AdminCompetitionModulesPage competitionId={competitionId} setActiveScreen={(s) => navigate(screenToPath(s))} />;
}

function PublicHomeWrapper() {
  const navigate = useNavigate();
  const [isEnquireOpen, setIsEnquireOpen] = useState(false);
  return (
    <>
      <HomePage 
        setActiveScreen={(s) => navigate(screenToPath(s))} 
        onOpenEnquire={() => setIsEnquireOpen(true)} 
      />
      <EnquireModal isOpen={isEnquireOpen} onClose={() => setIsEnquireOpen(false)} />
    </>
  );
}

function PublicCourseWrapper() {
  const navigate = useNavigate();
  const [isEnquireOpen, setIsEnquireOpen] = useState(false);
  return (
    <>
      <CoursePage 
        onOpenEnquire={() => setIsEnquireOpen(true)} 
        setActiveScreen={(s) => navigate(screenToPath(s))} 
      />
      <EnquireModal isOpen={isEnquireOpen} onClose={() => setIsEnquireOpen(false)} />
    </>
  );
}

function PublicCompetitionWrapper() {
  const [isEnquireOpen, setIsEnquireOpen] = useState(false);
  return (
    <>
      <CompetitionPage onOpenEnquire={() => setIsEnquireOpen(true)} />
      <EnquireModal isOpen={isEnquireOpen} onClose={() => setIsEnquireOpen(false)} />
    </>
  );
}

function PublicContactWrapper() {
  const [isEnquireOpen, setIsEnquireOpen] = useState(false);
  return (
    <>
      <ContactPage onOpenEnquire={() => setIsEnquireOpen(true)} />
      <EnquireModal isOpen={isEnquireOpen} onClose={() => setIsEnquireOpen(false)} />
    </>
  );
}

function AppRoutes() {
  const { loading, authNotice, clearAuthNotice } = useAuth();
  const navigate = useNavigate();
  const [isEnquireOpen, setIsEnquireOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  useEffect(() => {
    if (authNotice) {
      setIsLoginOpen(true);
    }
  }, [authNotice]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-300 font-medium">Loading Zoro English Academy...</p>
      </div>
    );
  }

  const handleLoginSuccess = (loggedUser) => {
    setIsLoginOpen(false);
    const roleUpper = (loggedUser?.role || '').toUpperCase();
    if (roleUpper === 'ADMIN' || roleUpper === 'SUPER_ADMIN') {
      navigate('/admin');
    } else if (roleUpper === 'TRAINER') {
      navigate('/trainer');
    } else {
      navigate('/student');
    }
  };

  return (
    <>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route element={<PublicLayout onOpenLogin={() => setIsLoginOpen(true)} onOpenEnquire={() => setIsEnquireOpen(true)} />}>
          <Route path="/" element={<PublicHomeWrapper />} />
          <Route path="/courses" element={<PublicCourseWrapper />} />
          <Route path="/competitions" element={<PublicCompetitionWrapper />} />
          <Route path="/contact" element={<PublicContactWrapper />} />
        </Route>

        {/* ADMIN ROUTES */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
            <DashboardLayout expectedRole="ADMIN" />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard setActiveScreen={(s) => navigate(screenToPath(s))} />} />
          <Route path="courses" element={<ManageCoursesPage setActiveScreen={(s) => navigate(screenToPath(s))} setSelectedCourseIdForEdit={(id) => navigate(`/admin/courses/${id}/edit`)} />} />
          <Route path="courses/new" element={<AddCoursePage setActiveScreen={(s) => navigate(screenToPath(s))} />} />
          <Route path="courses/:courseId/edit" element={<EditCourseWrapper />} />
          <Route path="courses/:courseId/content" element={<CourseContentWrapper />} />
          <Route path="batches" element={<AdminBatchManagementPage />} />
          <Route path="students" element={<ManageStudentsPage />} />
          <Route path="trainers" element={<ManageTrainersPage />} />
          <Route path="attendance" element={<AdminAttendancePage setActiveScreen={(s) => navigate(screenToPath(s))} />} />
          <Route path="schedules" element={<AdminSchedulePage />} />
          <Route path="assignments" element={<AdminAssignmentsPage />} />
          <Route path="trainer-assignments" element={<AdminTrainerAssignmentsPage />} />
          <Route path="doubts" element={<AdminDoubtsPage />} />
          <Route path="enquiries" element={<AdminEnquiryPage />} />
          <Route path="fees" element={<AdminFeesPage />} />
          <Route path="expenses" element={<AdminExpensesPage setActiveScreen={(s) => navigate(screenToPath(s))} />} />
          <Route path="salary" element={<AdminSalaryPage />} />
          <Route path="daily-reports" element={<AdminDailyReportPage />} />
          <Route path="competitions" element={<AdminCompetitionPage setActiveScreen={(s) => navigate(screenToPath(s))} setSelectedCompIdForModules={(id) => navigate(`/admin/competitions/${id}/modules`)} />} />
          <Route path="competitions/:competitionId/modules" element={<CompetitionModulesWrapper />} />
          <Route path="competitions/registrations" element={<AdminCompetitionRegistrationsPage setActiveScreen={(s) => navigate(screenToPath(s))} />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="notifications" element={<AdminNotificationsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>

        {/* TRAINER ROUTES */}
        <Route path="/trainer" element={
          <ProtectedRoute allowedRoles={['TRAINER']}>
            <DashboardLayout expectedRole="TRAINER" />
          </ProtectedRoute>
        }>
          <Route index element={<TrainerDashboard setActiveScreen={(s) => navigate(screenToPath(s))} />} />
          <Route path="courses" element={<TrainerCoursesPage />} />
          <Route path="students" element={<TrainerStudentsPage />} />
          <Route path="schedules" element={<TrainerSchedulePage setActiveScreen={(s) => navigate(screenToPath(s))} />} />
          <Route path="sessions" element={<TrainerSessionsPage />} />
          <Route path="assignments" element={<TrainerAssignmentsPage />} />
          <Route path="submissions" element={<TrainerSubmissionsPage />} />
          <Route path="doubts" element={<TrainerDoubtsPage />} />
          <Route path="attendance" element={<TrainerAttendancePage />} />
          <Route path="notifications" element={<TrainerNotificationsPage />} />
          <Route path="profile" element={<TrainerProfilePage />} />
          <Route path="*" element={<Navigate to="/trainer" replace />} />
        </Route>

        {/* STUDENT ROUTES */}
        <Route path="/student" element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <DashboardLayout expectedRole="STUDENT" />
          </ProtectedRoute>
        }>
          <Route index element={<StudentDashboard setActiveScreen={(s) => navigate(screenToPath(s))} />} />
          <Route path="courses" element={<CourseLearningPage setActiveScreen={(s) => navigate(screenToPath(s))} />} />
          <Route path="attendance" element={<StudentAttendancePage setActiveScreen={(s) => navigate(screenToPath(s))} />} />
          <Route path="join" element={<JoinSessionPage setActiveScreen={(s) => navigate(screenToPath(s))} />} />
          <Route path="assignments" element={<AssignmentPage setActiveScreen={(s) => navigate(screenToPath(s))} />} />
          <Route path="doubts" element={<DoubtPage setActiveScreen={(s) => navigate(screenToPath(s))} />} />
          <Route path="notifications" element={<StudentNotificationsPage setActiveScreen={(s) => navigate(screenToPath(s))} />} />
          <Route path="profile" element={<StudentProfilePage />} />
          <Route path="*" element={<Navigate to="/student" replace />} />
        </Route>

        {/* CATCH-ALL REDIRECT TO HOME */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global Modals */}
      <EnquireModal isOpen={isEnquireOpen} onClose={() => setIsEnquireOpen(false)} />
      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={() => {
          setIsLoginOpen(false);
          clearAuthNotice();
        }} 
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DialogProvider>
          <WebsiteSettingsProvider>
            <AppRoutes />
          </WebsiteSettingsProvider>
        </DialogProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
