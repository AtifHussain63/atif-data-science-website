import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { HomePage } from './pages/HomePage';
import { CoursesPage } from './pages/CoursesPage';
import { CourseDetailPage } from './pages/CourseDetailPage';
import { LearningPage } from './pages/LearningPage';
import { QuizPage } from './pages/QuizPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { MyCoursesPage } from './pages/MyCoursesPage';
import { MyCertificatesPage } from './pages/MyCertificatesPage';
import { VerifyCertificatePage } from './pages/VerifyCertificatePage';
import { ProfilePage } from './pages/ProfilePage';
import { AuthPage } from './pages/AuthPage';
import { AdminDashboard } from './pages/AdminDashboard';

interface RouteState {
  view: string;
  param?: string;
}

const AppContent: React.FC = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [route, setRoute] = useState<RouteState>({ view: 'home' });

  // Parse URL hash on startup & window hash changes
  const parseHash = () => {
    const hash = window.location.hash.replace(/^#\/?/, '');
    if (!hash) {
      setRoute({ view: 'home' });
      return;
    }

    const parts = hash.split('/');
    const view = parts[0] || 'home';
    const param = parts.slice(1).join('/');
    setRoute({ view, param });
  };

  useEffect(() => {
    parseHash();
    window.addEventListener('hashchange', parseHash);
    return () => window.removeEventListener('hashchange', parseHash);
  }, []);

  const handleNavigate = (view: string, param?: string) => {
    setRoute({ view, param });
    const newHash = param ? `#${view}/${param}` : `#${view}`;
    window.location.hash = newHash;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderProtectedRoute = (component: React.ReactNode) => {
    if (authLoading) {
      return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-9 h-9 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-3" />
          <p className="text-xs text-slate-400 font-medium">Verifying account authentication...</p>
        </div>
      );
    }
    if (!user) {
      return <AuthPage initialTab="login" onNavigate={handleNavigate} />;
    }
    return component;
  };

  // Render current view
  const renderView = () => {
    switch (route.view) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />;

      case 'courses':
        return <CoursesPage initialCategory={route.param} onNavigate={handleNavigate} />;

      case 'course-detail':
        return <CourseDetailPage courseId={route.param || 'course-python-ds'} onNavigate={handleNavigate} />;

      case 'learning':
        return renderProtectedRoute(
          <LearningPage courseId={route.param || 'course-python-ds'} onNavigate={handleNavigate} />
        );

      case 'quiz':
        return renderProtectedRoute(
          <QuizPage courseId={route.param || 'course-python-ds'} onNavigate={handleNavigate} />
        );

      case 'dashboard':
      case 'student-dashboard':
        return renderProtectedRoute(<StudentDashboard onNavigate={handleNavigate} />);

      case 'my-courses':
        return renderProtectedRoute(<MyCoursesPage onNavigate={handleNavigate} />);

      case 'my-certificates':
        return renderProtectedRoute(<MyCertificatesPage onNavigate={handleNavigate} />);

      case 'verify':
        return <VerifyCertificatePage initialCertId={route.param || ''} onNavigate={handleNavigate} />;

      case 'profile':
        return renderProtectedRoute(<ProfilePage onNavigate={handleNavigate} />);

      case 'auth':
        return <AuthPage initialTab={(route.param as any) || 'login'} onNavigate={handleNavigate} />;

      case 'admin':
      case 'admin-dashboard':
      case 'admin-students':
      case 'admin-courses':
      case 'admin-certificates':
      case 'admin-certificate-settings':
        if (authLoading) {
          return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
              <div className="w-9 h-9 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-3" />
              <p className="text-xs text-slate-400 font-medium">Verifying executive access...</p>
            </div>
          );
        }
        if (!user) {
          return <AuthPage initialTab="login" onNavigate={handleNavigate} />;
        }
        if (!isAdmin) {
          return (
            <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-4 text-rose-400 text-2xl font-bold">
                🔒
              </div>
              <h2 className="text-2xl font-bold text-rose-400">Executive Access Restricted</h2>
              <p className="text-xs text-slate-400 mt-2 max-w-md leading-relaxed">
                This administrative panel is strictly restricted. Only <strong>Atif Hussain (Founder)</strong> and authorized <strong>Partner / Support (dostdar.cui@gmail.com)</strong> can access this executive portal.
              </p>
              <div className="mt-4 p-3 bg-slate-900 border border-slate-800 rounded-xl text-[11px] text-slate-400 font-mono">
                Current account: <span className="text-amber-400 font-bold">{user.email}</span> (Student)
              </div>
              <button
                onClick={() => handleNavigate('home')}
                className="mt-6 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-lg shadow-amber-500/20"
              >
                Return to Home
              </button>
            </div>
          );
        }
        return <AdminDashboard onNavigate={handleNavigate} initialTab={route.view.startsWith('admin-') ? route.view.replace('admin-', '') : undefined} />;

      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  const isClassroom = route.view === 'learning';

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950">
      {!isClassroom && <Header currentView={route.view} onNavigate={handleNavigate} />}
      <main className="flex-1">{renderView()}</main>
      {!isClassroom && <Footer onNavigate={handleNavigate} />}
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
