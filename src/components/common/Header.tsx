import React, { useState } from 'react';
import {
  GraduationCap,
  Menu,
  X,
  BookOpen,
  Award,
  User,
  LogOut,
  Shield,
  Search,
  CheckCircle,
  LayoutDashboard,
  Layers,
  Settings,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  const { user, profile, isAdmin, isStudent, logout, partnerAdminEmail } = useAuth();
  const { success } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      setUserDropdownOpen(false);
      setMobileMenuOpen(false);
      success('Logged Out', 'You have been signed out successfully.');
      onNavigate('home');
    } catch (e) {
      console.error(e);
    }
  };

  const nav = (view: string, param?: string) => {
    onNavigate(view, param);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  return (
    <header id="main-header" className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Brand Name */}
          <div
            id="brand-logo-button"
            onClick={() => nav(isAdmin ? 'admin-dashboard' : user ? 'student-dashboard' : 'home')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 p-0.5 shadow-lg shadow-amber-900/30 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-amber-400" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white font-sans flex items-center gap-1.5">
                ATIF SKILLS HUB
                {isAdmin && (
                  <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold rounded-full uppercase tracking-wider">
                    Admin
                  </span>
                )}
              </span>
              <span className="text-[10px] text-amber-400/90 font-medium tracking-wide hidden sm:block">
                Learn Skills • Build Your Future • Get Certified
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {!isAdmin ? (
              <>
                <button
                  id="nav-home"
                  onClick={() => nav('home')}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    currentView === 'home' ? 'text-amber-400 bg-amber-500/10' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  Home
                </button>

                <button
                  id="nav-courses"
                  onClick={() => nav('courses')}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    currentView === 'courses' ? 'text-amber-400 bg-amber-500/10' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  Courses (46)
                </button>

                <button
                  id="nav-verify"
                  onClick={() => nav('verify')}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    currentView === 'verify' ? 'text-amber-400 bg-amber-500/10' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Verify Certificate
                </button>

                {user && (
                  <>
                    <button
                      id="nav-dashboard"
                      onClick={() => nav('student-dashboard')}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                        currentView === 'student-dashboard' ? 'text-amber-400 bg-amber-500/10' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </button>

                    <button
                      id="nav-my-courses"
                      onClick={() => nav('my-courses')}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        currentView === 'my-courses' ? 'text-amber-400 bg-amber-500/10' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      My Courses
                    </button>

                    <button
                      id="nav-my-certificates"
                      onClick={() => nav('my-certificates')}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                        currentView === 'my-certificates' ? 'text-amber-400 bg-amber-500/10' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <Award className="w-4 h-4 text-amber-400" />
                      Certificates
                    </button>
                  </>
                )}
              </>
            ) : (
              /* Admin Navigation Bar */
              <>
                <button
                  id="nav-admin-dashboard"
                  onClick={() => nav('admin-dashboard')}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    currentView === 'admin-dashboard' ? 'text-amber-400 bg-amber-500/10' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </button>

                <button
                  id="nav-admin-students"
                  onClick={() => nav('admin-students')}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    currentView === 'admin-students' ? 'text-amber-400 bg-amber-500/10' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Students
                </button>

                <button
                  id="nav-admin-courses"
                  onClick={() => nav('admin-courses')}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    currentView === 'admin-courses' ? 'text-amber-400 bg-amber-500/10' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  Courses
                </button>

                <button
                  id="nav-admin-certificates"
                  onClick={() => nav('admin-certificates')}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    currentView === 'admin-certificates' ? 'text-amber-400 bg-amber-500/10' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Award className="w-4 h-4 text-amber-400" />
                  Certificates
                </button>

                <button
                  id="nav-admin-settings"
                  onClick={() => nav('admin-certificate-settings')}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    currentView === 'admin-certificate-settings' ? 'text-amber-400 bg-amber-500/10' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  Certificate Settings
                </button>

                <button
                  id="nav-admin-preview-courses"
                  onClick={() => nav('courses')}
                  className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 border border-slate-700 rounded-lg ml-2"
                >
                  Catalog View
                </button>
              </>
            )}
          </nav>

          {/* Right Action / Auth Profile Button & Theme Switcher */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Theme Toggle Button */}
            <ThemeToggle />

            {user ? (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    id="user-profile-menu-button"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-3 p-1.5 pl-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl transition-all"
                  >
                    <div className="flex flex-col text-right">
                      <span className="text-sm font-semibold text-white max-w-[140px] truncate">
                        {profile?.name || user.displayName || 'User'}
                      </span>
                      <span className="text-[10px] text-amber-400 font-mono">
                        {user.email === 'atifhuss773@gmail.com'
                          ? 'FOUNDER ADMIN'
                          : user.email === 'dostdar.cui@gmail.com' || user.email === partnerAdminEmail
                          ? 'PARTNER / SUPPORT'
                          : profile?.studentId || (isAdmin ? 'ADMINISTRATOR' : 'STUDENT')}
                      </span>
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 font-bold flex items-center justify-center shadow">
                      {profile?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {userDropdownOpen && (
                    <div
                      id="user-dropdown-menu"
                      className="absolute right-0 mt-2 w-60 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2"
                    >
                      <div className="px-4 py-2 border-b border-slate-800">
                        <p className="text-xs text-slate-400 font-medium">Signed in as</p>
                        <p className="text-sm font-semibold text-slate-100 truncate">{user.email}</p>
                        <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded ${
                          user.email === 'atifhuss773@gmail.com'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : user.email === 'dostdar.cui@gmail.com' || user.email === partnerAdminEmail
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            : isAdmin
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {user.email === 'atifhuss773@gmail.com'
                            ? '👑 Founder & Director'
                            : user.email === 'dostdar.cui@gmail.com' || user.email === partnerAdminEmail
                            ? '🤝 Partner / Support'
                            : isAdmin
                            ? '🛡️ Administrator'
                            : '🎓 Student'}
                        </span>
                      </div>

                      <button
                        id="dropdown-profile"
                        onClick={() => nav('profile')}
                        className="w-full px-4 py-2.5 text-left text-sm text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        My Profile
                      </button>

                      {isAdmin ? (
                        <button
                          id="dropdown-admin-panel"
                          onClick={() => nav('admin-dashboard')}
                          className="w-full px-4 py-2.5 text-left text-sm text-amber-400 hover:bg-slate-800 flex items-center gap-2"
                        >
                          <Shield className="w-4 h-4" />
                          Admin Panel
                        </button>
                      ) : (
                        <button
                          id="dropdown-student-dashboard"
                          onClick={() => nav('student-dashboard')}
                          className="w-full px-4 py-2.5 text-left text-sm text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2"
                        >
                          <LayoutDashboard className="w-4 h-4 text-slate-400" />
                          Student Dashboard
                        </button>
                      )}

                      <div className="border-t border-slate-800 my-1" />

                      <button
                        id="dropdown-logout"
                        onClick={handleLogout}
                        className="w-full px-4 py-2.5 text-left text-sm text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        Log Out (Sign Out)
                      </button>
                    </div>
                  )}
                </div>

                {/* Direct 1-Click Logout Button on Header */}
                <button
                  id="direct-header-logout-btn"
                  onClick={handleLogout}
                  title="Log Out (Sign Out)"
                  className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">Log Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="btn-header-login"
                  onClick={() => nav('auth', 'login')}
                  className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all"
                >
                  Log In
                </button>
                <button
                  id="btn-header-register"
                  onClick={() => nav('auth', 'register')}
                  className="px-4 py-2 text-sm font-semibold text-slate-950 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 rounded-xl shadow-md shadow-amber-900/20 transition-all font-medium"
                >
                  Create Account
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu & Theme Button */}
          <div className="flex lg:hidden items-center gap-2">
            <ThemeToggle />
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div id="mobile-nav-drawer" className="lg:hidden bg-slate-950 border-b border-slate-800 px-4 pt-2 pb-6 space-y-2">
          {user && (
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white">{profile?.name || user.email}</p>
                <p className="text-xs text-amber-400 font-mono">{profile?.studentId || (isAdmin ? 'ADMIN' : 'STUDENT')}</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${isAdmin ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                {profile?.role || 'User'}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-1">
            {!isAdmin ? (
              <>
                <button
                  onClick={() => nav('home')}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white text-sm font-medium"
                >
                  Home
                </button>
                <button
                  onClick={() => nav('courses')}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white text-sm font-medium flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  All 46 Courses
                </button>
                <button
                  onClick={() => nav('verify')}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white text-sm font-medium flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Verify Certificate
                </button>

                {user && (
                  <>
                    <button
                      onClick={() => nav('student-dashboard')}
                      className="w-full text-left px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white text-sm font-medium flex items-center gap-2"
                    >
                      <LayoutDashboard className="w-4 h-4 text-blue-400" />
                      Student Dashboard
                    </button>
                    <button
                      onClick={() => nav('my-courses')}
                      className="w-full text-left px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white text-sm font-medium"
                    >
                      My Courses
                    </button>
                    <button
                      onClick={() => nav('my-certificates')}
                      className="w-full text-left px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white text-sm font-medium flex items-center gap-2"
                    >
                      <Award className="w-4 h-4 text-amber-400" />
                      My Certificates
                    </button>
                    <button
                      onClick={() => nav('profile')}
                      className="w-full text-left px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white text-sm font-medium flex items-center gap-2"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      My Profile
                    </button>
                  </>
                )}
              </>
            ) : (
              /* Mobile Admin Links */
              <>
                <button
                  onClick={() => nav('admin-dashboard')}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-amber-400 font-semibold text-sm flex items-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Admin Dashboard
                </button>
                <button
                  onClick={() => nav('admin-students')}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 text-sm flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Students Management
                </button>
                <button
                  onClick={() => nav('admin-courses')}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 text-sm flex items-center gap-2"
                >
                  <Layers className="w-4 h-4" />
                  Course Management
                </button>
                <button
                  onClick={() => nav('admin-certificates')}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 text-sm flex items-center gap-2"
                >
                  <Award className="w-4 h-4 text-amber-400" />
                  Issued Certificates
                </button>
                <button
                  onClick={() => nav('admin-certificate-settings')}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 text-sm flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Certificate & Logo Settings
                </button>
                <button
                  onClick={() => nav('courses')}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 text-xs"
                >
                  Preview Student Catalog
                </button>
              </>
            )}
          </div>

          {/* Mobile Theme Switcher Row */}
          <div className="pt-3 pb-1 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Theme Appearance</span>
            <ThemeToggle variant="segmented" />
          </div>

          <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
            {user ? (
              <button
                onClick={handleLogout}
                className="w-full py-2.5 px-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => nav('auth', 'login')}
                  className="py-2.5 bg-slate-900 border border-slate-800 text-white rounded-xl text-sm font-semibold text-center"
                >
                  Log In
                </button>
                <button
                  onClick={() => nav('auth', 'register')}
                  className="py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-sm text-center shadow-md shadow-amber-900/30"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
