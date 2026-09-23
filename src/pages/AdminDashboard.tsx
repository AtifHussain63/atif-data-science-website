import React, { useState, useEffect } from 'react';
import {
  Users,
  BookOpen,
  Award,
  TrendingUp,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Shield,
  ExternalLink,
  Settings,
  Sparkles,
  Layers,
  Save,
  Check,
  Download,
  Loader2,
  LogOut,
} from 'lucide-react';
import {
  UserProfile,
  Course,
  Certificate,
  CertificateTemplate,
  PlatformSettings,
  Enrollment,
} from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ThemeToggle } from '../components/common/ThemeToggle';
import {
  getAllStudents,
  toggleStudentStatus,
  getPlatformStats,
  resetStudentProgress,
} from '../services/studentService';
import {
  getAllCourses,
  saveCourse,
  deleteCourse,
} from '../services/courseService';
import {
  getAllCertificates,
  issueCertificate,
  revokeCertificate,
  reactivateCertificate,
  getPlatformSettings,
  updatePlatformSettings,
} from '../services/certificateService';
import { getAllCertificateTemplates } from '../services/templateService';
import { CertificateView } from '../components/certificate/CertificateView';
import { downloadCertificateImage } from '../components/certificate/PDFGenerator';
import { CertificateSettingsManager } from '../components/admin/CertificateSettingsManager';
import { CollaborationsManager } from '../components/admin/CollaborationsManager';
import { EmailManager } from '../components/admin/EmailManager';
import { YouTubeCourseManager } from '../components/admin/YouTubeCourseManager';
import { AdminPartnerAccessManager } from '../components/admin/AdminPartnerAccessManager';
import { CourseQuizManager } from '../components/admin/CourseQuizManager';
import { StudentRecordsDatabase } from '../components/admin/StudentRecordsDatabase';
import { COURSE_CATEGORIES } from '../data/coursesData';
import { Handshake, Mail, Youtube, UserCheck, ShieldCheck, HelpCircle, FileSpreadsheet } from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (view: string, param?: string) => void;
  initialTab?: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate, initialTab }) => {
  const { user, isAdmin, profile, logout, partnerAdminEmail } = useAuth();
  const { success, error, info } = useToast();

  const isFounder = user?.email?.toLowerCase() === 'atifhuss773@gmail.com';
  const isPartner = user?.email?.toLowerCase() === 'dostdar.cui@gmail.com' || user?.email?.toLowerCase() === partnerAdminEmail?.toLowerCase();

  const [activeTab, setActiveTab] = useState<
    'analytics' | 'courses' | 'quizzes' | 'youtube-content' | 'students' | 'certificates' | 'collaborations' | 'email-management' | 'settings' | 'admin-access'
  >(() => {
    if (initialTab === 'students' || initialTab === 'courses' || initialTab === 'certificates' || initialTab === 'settings' || initialTab === 'admin-access') {
      return initialTab as any;
    }
    if (initialTab === 'certificate-settings') {
      return 'settings';
    }
    return 'analytics';
  });

  useEffect(() => {
    if (initialTab) {
      if (initialTab === 'students' || initialTab === 'courses' || initialTab === 'certificates' || initialTab === 'settings' || initialTab === 'admin-access') {
        setActiveTab(initialTab as any);
      } else if (initialTab === 'certificate-settings') {
        setActiveTab('settings');
      }
    }
  }, [initialTab]);

  const handleAdminLogout = async () => {
    try {
      await logout();
      success('Logged Out', 'You have been signed out of the Administrator Console.');
      onNavigate('home');
    } catch (err: any) {
      error('Logout Failed', err?.message || 'Could not log out.');
    }
  };

  // Stats
  const [stats, setStats] = useState<{
    totalStudents: number;
    totalCourses: number;
    totalCertificates: number;
    totalEnrollments: number;
  }>({
    totalStudents: 0,
    totalCourses: 0,
    totalCertificates: 0,
    totalEnrollments: 0,
  });

  // Data lists
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [settings, setSettings] = useState<PlatformSettings>({
    platformName: 'Atif Skills Hub',
    authorizedSignatory: 'Atif Hussain',
    signatoryTitle: 'Founder & Director of Learning',
    verificationDomain: 'atifskillshub.org',
    primaryColor: '#F59E0B',
  });

  // UI Search & Filters
  const [studentSearch, setStudentSearch] = useState('');
  const [courseSearch, setCourseSearch] = useState('');
  const [certSearch, setCertSearch] = useState('');

  // Modals & Active Edit State
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [downloadingCertId, setDownloadingCertId] = useState<string | null>(null);
  const [editingCourse, setEditingCourse] = useState<Partial<Course> | null>(null);
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [manualCertModalOpen, setManualCertModalOpen] = useState(false);
  const [manualCertData, setManualCertData] = useState({
    studentId: '',
    courseId: '',
    score: 95,
  });

  const [loading, setLoading] = useState(true);

  const reloadData = async () => {
    setLoading(true);
    const [stList, cList, certList, pStats, pSettings, tplList] = await Promise.all([
      getAllStudents(),
      getAllCourses(),
      getAllCertificates(),
      getPlatformStats(),
      getPlatformSettings(),
      getAllCertificateTemplates(),
    ]);

    setStudents(stList);
    setCourses(cList);
    setCertificates(certList);
    setStats(pStats);
    setTemplates(tplList);
    if (pSettings) setSettings(pSettings);
    setLoading(false);
  };

  useEffect(() => {
    reloadData();
  }, []);

  // Course Actions
  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse?.title || !editingCourse?.category) {
      error('Validation', 'Course Title and Category are required');
      return;
    }

    try {
      const courseId = editingCourse.id || `course_${Date.now()}`;
      const toSave: Course = {
        id: courseId,
        title: editingCourse.title,
        slug: editingCourse.slug || editingCourse.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        category: editingCourse.category,
        description: editingCourse.description || '',
        difficulty: (editingCourse.difficulty as any) || 'Beginner',
        duration: editingCourse.duration || '6 Weeks',
        instructor: editingCourse.instructor || 'Atif Hussain',
        thumbnail: editingCourse.thumbnail || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=60',
        passingPercentage: Number(editingCourse.passingPercentage) || 70,
        certificateTemplateId: editingCourse.certificateTemplateId || undefined,
        published: true,
        createdAt: editingCourse.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveCourse(toSave);
      success('Course Saved', `Successfully updated "${toSave.title}"`);
      setCourseModalOpen(false);
      setEditingCourse(null);
      await reloadData();
    } catch (err) {
      console.error(err);
      error('Save Failed', 'Could not save course data.');
    }
  };

  const handleDeleteCourse = async (courseId: string, courseTitle: string) => {
    if (confirm(`Are you sure you want to delete course "${courseTitle}"?`)) {
      try {
        await deleteCourse(courseId);
        success('Course Deleted', `Removed ${courseTitle}`);
        await reloadData();
      } catch (err) {
        console.error(err);
        error('Delete Failed', 'Could not delete course.');
      }
    }
  };

  // Student Actions
  const handleToggleStudent = async (studentId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    try {
      await toggleStudentStatus(studentId, newStatus as any);
      success('Status Updated', `Student status changed to ${newStatus}`);
      await reloadData();
    } catch (err) {
      console.error(err);
      error('Update Failed', 'Could not update student status.');
    }
  };

  const handleResetProgress = async (studentId: string, studentName: string) => {
    const courseId = prompt(`Enter Course ID to reset progress for ${studentName} (or leave blank to cancel):`);
    if (!courseId) return;

    try {
      await resetStudentProgress(studentId, courseId);
      success('Progress Reset', `Reset course ${courseId} for ${studentName}`);
      await reloadData();
    } catch (err) {
      console.error(err);
      error('Reset Failed', 'Could not reset student progress.');
    }
  };

  // Certificate Actions
  const handleRevokeCert = async (certId: string) => {
    const reason = prompt('Enter revocation reason (optional):', 'Administrative revocation');
    if (reason === null) return;

    try {
      await revokeCertificate(certId, reason);
      success('Certificate Revoked', `Certificate ${certId} marked as REVOKED.`);
      await reloadData();
    } catch (err) {
      console.error(err);
      error('Revocation Error', 'Failed to revoke certificate.');
    }
  };

  const handleReactivateCert = async (certId: string) => {
    try {
      await reactivateCertificate(certId);
      success('Certificate Reactivated', `Certificate ${certId} is now VALID.`);
      await reloadData();
    } catch (err) {
      console.error(err);
      error('Error', 'Failed to reactivate certificate.');
    }
  };

  const handleManualIssueCert = async (e: React.FormEvent) => {
    e.preventDefault();
    const st = students.find((s) => s.uid === manualCertData.studentId);
    const cr = courses.find((c) => c.id === manualCertData.courseId);

    if (!st || !cr) {
      error('Missing Selection', 'Please select both a student and a course.');
      return;
    }

    try {
      const cert = await issueCertificate(
        st.uid,
        st.name || st.email,
        st.email,
        cr,
        Number(manualCertData.score) || 95
      );
      success('Certificate Issued', `Created ${cert.certificateId} for ${st.name}`);
      setManualCertModalOpen(false);
      await reloadData();
    } catch (err) {
      console.error(err);
      error('Issue Failed', 'Could not issue certificate.');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updatePlatformSettings(settings);
      success('Settings Saved', 'Platform & Signatory configurations updated.');
    } catch (err) {
      console.error(err);
      error('Save Failed', 'Could not update settings.');
    }
  };

  // Filtered lists
  const filteredStudents = students.filter(
    (s) =>
      s.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.email?.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.studentId?.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const filteredCourses = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(courseSearch.toLowerCase()) ||
      c.category.toLowerCase().includes(courseSearch.toLowerCase())
  );

  const filteredCerts = certificates.filter(
    (c) =>
      c.certificateId.toLowerCase().includes(certSearch.toLowerCase()) ||
      c.studentName.toLowerCase().includes(certSearch.toLowerCase()) ||
      c.courseName.toLowerCase().includes(certSearch.toLowerCase())
  );

  return (
    <div id="admin-portal-page" className="min-h-screen bg-slate-950 text-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  ADMINISTRATOR CONSOLE
                </span>
                <span className="text-xs text-slate-400">Atif Skills Hub</span>
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                  isFounder
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    : isPartner
                    ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                    : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                }`}>
                  {isFounder
                    ? '👑 Founder & Director (Atif Hussain)'
                    : isPartner
                    ? '🤝 Partner / Support (Dostdar - dostdar.cui@gmail.com)'
                    : `🛡️ Admin (${user?.email})`}
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-white mt-0.5">
                Executive Control Hub
              </h1>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <ThemeToggle />
            <button
              onClick={() => {
                setEditingCourse({
                  title: '',
                  category: 'Data Science',
                  difficulty: 'Beginner',
                  duration: '6 Weeks',
                  passingPercentage: 70,
                  instructor: 'Atif Hussain',
                });
                setCourseModalOpen(true);
              }}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <Plus className="w-4 h-4 text-amber-400" /> New Course
            </button>
            <button
              onClick={() => setManualCertModalOpen(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-900/30 hover:brightness-105 transition-all"
            >
              <Award className="w-4 h-4" /> Issue Certificate
            </button>
            
            {/* Direct Admin Logout Button */}
            <button
              id="admin-header-logout-btn"
              onClick={handleAdminLogout}
              className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              title="Sign Out of Admin Console"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
          {[
            { id: 'analytics', label: 'Platform Overview', icon: TrendingUp },
            { id: 'courses', label: `Courses (${courses.length})`, icon: BookOpen },
            { id: 'quizzes', label: '50-MCQ Quizzes', icon: HelpCircle },
            { id: 'youtube-content', label: 'YouTube Course Content', icon: Youtube },
            { id: 'students', label: 'Student Records & Excel Database', icon: FileSpreadsheet },
            { id: 'certificates', label: `Certificates (${certificates.length})`, icon: Award },
            { id: 'settings', label: 'Certificate Settings & Design', icon: Settings },
            { id: 'collaborations', label: 'Collaborations', icon: Handshake },
            { id: 'email-management', label: 'Email Management', icon: Mail },
            { id: 'admin-access', label: 'Admin & Partner Access', icon: UserCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all ${
                  isActive
                    ? tab.id === 'youtube-content'
                      ? 'bg-red-600 text-white shadow-md shadow-red-950/50'
                      : 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              
              <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-medium">Total Registered</span>
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <p className="text-3xl font-black text-white">{stats.totalStudents}</p>
                <p className="text-[11px] text-slate-500">Student accounts registered</p>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-medium">Active Courses</span>
                  <BookOpen className="w-5 h-5 text-purple-400" />
                </div>
                <p className="text-3xl font-black text-white">{stats.totalCourses}</p>
                <p className="text-[11px] text-slate-500">Curricula in catalog</p>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-medium">Issued Certificates</span>
                  <Award className="w-5 h-5 text-amber-400" />
                </div>
                <p className="text-3xl font-black text-amber-400">{stats.totalCertificates}</p>
                <p className="text-[11px] text-slate-500">Verifiable credentials</p>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-medium">Total Enrollments</span>
                  <Layers className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-3xl font-black text-white">{stats.totalEnrollments}</p>
                <p className="text-[11px] text-slate-500">Active classroom seats</p>
              </div>

            </div>

            {/* Quick Overview Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Recent Enrollments */}
              <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" /> Recently Registered Students
                </h3>
                <div className="divide-y divide-slate-800/80">
                  {students.slice(0, 5).map((st) => (
                    <div key={st.uid} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-white">{st.name || 'Unnamed Student'}</p>
                        <p className="text-slate-400 font-mono text-[11px]">{st.studentId} • {st.email}</p>
                      </div>
                      <span className="px-2.5 py-0.5 bg-slate-950 border border-slate-800 rounded text-slate-300 text-[10px]">
                        {st.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Certificates Issued */}
              <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" /> Recently Issued Certificates
                </h3>
                <div className="divide-y divide-slate-800/80">
                  {certificates.slice(0, 5).map((cert) => (
                    <div key={cert.certificateId} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-white">{cert.studentName}</p>
                        <p className="text-amber-400 font-mono text-[11px]">{cert.certificateId} • {cert.courseName}</p>
                      </div>
                      <span className="text-[10px] text-slate-400">{cert.completionDate}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: COURSE MANAGEMENT */}
        {activeTab === 'courses' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  placeholder="Search courses by name or category..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <button
                onClick={() => {
                  setEditingCourse({
                    title: '',
                    category: 'Data Science',
                    difficulty: 'Beginner',
                    duration: '6 Weeks',
                    passingPercentage: 70,
                    instructor: 'Atif Hussain',
                  });
                  setCourseModalOpen(true);
                }}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" /> Add New Course
              </button>
            </div>

            {/* Courses Table */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-4">Course</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Difficulty</th>
                      <th className="p-4">Duration</th>
                      <th className="p-4">Passing %</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredCourses.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-900/50">
                        <td className="p-4 font-bold text-white flex items-center gap-3">
                          <img
                            src={c.thumbnail}
                            alt={c.title}
                            className="w-10 h-10 rounded-lg object-cover bg-slate-950 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <span className="truncate max-w-xs">{c.title}</span>
                        </td>
                        <td className="p-4 text-amber-400 font-medium">{c.category}</td>
                        <td className="p-4">{c.difficulty}</td>
                        <td className="p-4">{c.duration}</td>
                        <td className="p-4">{c.passingPercentage}%</td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setActiveTab('youtube-content')}
                              className="px-2.5 py-1.5 text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-1.5 transition-colors"
                              title="Search & Attach YouTube Content"
                            >
                              <Youtube className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">YouTube Content</span>
                            </button>
                            <button
                              onClick={() => {
                                setEditingCourse(c);
                                setCourseModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-amber-400 bg-slate-800 hover:bg-slate-700 rounded-lg"
                              title="Edit Course"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCourse(c.id, c.title)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-slate-700 rounded-lg"
                              title="Delete Course"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: 50-MCQ QUIZ & QUESTION BANK MANAGEMENT */}
        {activeTab === 'quizzes' && (
          <CourseQuizManager
            courses={courses}
            onNavigateToPreview={(courseId) => onNavigate('quiz', courseId)}
          />
        )}

        {/* TAB: YOUTUBE COURSE CONTENT */}
        {activeTab === 'youtube-content' && (
          <YouTubeCourseManager
            courses={courses}
            onRefreshCourses={reloadData}
            onNavigateToLearning={(courseId) => onNavigate('learning', courseId)}
          />
        )}

        {/* TAB 3: AUTOMATIC STUDENT DATA RECORDS & EXCEL DATABASE */}
        {activeTab === 'students' && (
          <StudentRecordsDatabase
            onViewCertificate={(certId) => {
              const cert = certificates.find((c) => c.certificateId === certId);
              if (cert) {
                setSelectedCert(cert);
              } else {
                onNavigate('verify', certId);
              }
            }}
          />
        )}

        {/* TAB 4: CERTIFICATE HUB */}
        {activeTab === 'certificates' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={certSearch}
                  onChange={(e) => setCertSearch(e.target.value)}
                  placeholder="Search certificates by ID, student, or course..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <button
                onClick={() => setManualCertModalOpen(true)}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Award className="w-4 h-4" /> Issue Manual Certificate
              </button>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-4">Certificate ID</th>
                      <th className="p-4">Student</th>
                      <th className="p-4">Course</th>
                      <th className="p-4">Issue Date</th>
                      <th className="p-4">Score</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredCerts.map((c) => {
                      const isValid = c.status === 'VALID';
                      return (
                        <tr key={c.certificateId} className="hover:bg-slate-900/50">
                          <td className="p-4 font-mono font-bold text-amber-400">{c.certificateId}</td>
                          <td className="p-4 font-bold text-white">{c.studentName}</td>
                          <td className="p-4 truncate max-w-xs">{c.courseName}</td>
                          <td className="p-4 text-slate-400">{c.completionDate}</td>
                          <td className="p-4 font-bold">{c.score ? `${c.score}%` : '100%'}</td>
                          <td className="p-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                isValid
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              }`}
                            >
                              {c.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setSelectedCert(c)}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium border border-slate-700 transition-colors"
                              >
                                View
                              </button>
                              <button
                                onClick={async () => {
                                  setDownloadingCertId(c.certificateId);
                                  try {
                                    await downloadCertificateImage(c);
                                  } catch {
                                    setSelectedCert(c);
                                  } finally {
                                    setDownloadingCertId(null);
                                  }
                                }}
                                disabled={downloadingCertId === c.certificateId}
                                className="p-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors cursor-pointer disabled:opacity-60"
                                title="Download Certificate Image directly"
                              >
                                {downloadingCertId === c.certificateId ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Download className="w-3.5 h-3.5" />
                                )}
                              </button>
                              {isValid ? (
                                <button
                                  onClick={() => handleRevokeCert(c.certificateId)}
                                  className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-semibold"
                                >
                                  Revoke
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleReactivateCert(c.certificateId)}
                                  className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold"
                                >
                                  Reactivate
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: CERTIFICATE SETTINGS & DESIGN */}
        {activeTab === 'settings' && (
          <CertificateSettingsManager />
        )}

        {/* TAB 6: COLLABORATIONS & PARTNERSHIPS */}
        {activeTab === 'collaborations' && (
          <CollaborationsManager />
        )}

        {/* TAB 7: AUTHORIZED EMAIL MANAGEMENT */}
        {activeTab === 'email-management' && (
          <EmailManager />
        )}

        {/* TAB 8: DUAL-ADMIN & PARTNER ACCESS CONTROL */}
        {activeTab === 'admin-access' && (
          <AdminPartnerAccessManager />
        )}

      </div>

      {/* MODAL: Course Editor */}
      {courseModalOpen && editingCourse && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {editingCourse.id ? 'Edit Course' : 'Create New Course'}
              </h2>
              <button
                onClick={() => setCourseModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Course Title *</label>
                <input
                  type="text"
                  value={editingCourse.title || ''}
                  onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
                  required
                  placeholder="e.g. Advanced Deep Learning with PyTorch"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Category *</label>
                  <select
                    value={editingCourse.category || 'Data Science'}
                    onChange={(e) => setEditingCourse({ ...editingCourse, category: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                  >
                    {COURSE_CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Difficulty Level</label>
                  <select
                    value={editingCourse.difficulty || 'Beginner'}
                    onChange={(e) => setEditingCourse({ ...editingCourse, difficulty: e.target.value as any })}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  value={editingCourse.description || ''}
                  onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                  rows={3}
                  placeholder="Comprehensive curriculum details..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Duration</label>
                  <input
                    type="text"
                    value={editingCourse.duration || '6 Weeks'}
                    onChange={(e) => setEditingCourse({ ...editingCourse, duration: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Passing %</label>
                  <input
                    type="number"
                    value={editingCourse.passingPercentage || 70}
                    onChange={(e) => setEditingCourse({ ...editingCourse, passingPercentage: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Instructor</label>
                  <input
                    type="text"
                    value={editingCourse.instructor || 'Atif Hussain'}
                    onChange={(e) => setEditingCourse({ ...editingCourse, instructor: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Thumbnail Image URL</label>
                <input
                  type="url"
                  value={editingCourse.thumbnail || ''}
                  onChange={(e) => setEditingCourse({ ...editingCourse, thumbnail: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Assigned Certificate Template</span>
                  <span className="text-[10px] text-amber-400 font-normal">Custom Canva/Photoshop Design</span>
                </label>
                <select
                  value={editingCourse.certificateTemplateId || ''}
                  onChange={(e) =>
                    setEditingCourse({
                      ...editingCourse,
                      certificateTemplateId: e.target.value || undefined,
                    })
                  }
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-amber-500"
                >
                  <option value="">-- Use Default Platform Template --</option>
                  {templates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.name} {tpl.isDefault ? '(Default)' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  When students complete this course, their certificate will be generated using this assigned template.
                </p>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCourseModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 text-slate-950 rounded-xl font-bold"
                >
                  Save Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Manual Issue Certificate */}
      {manualCertModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" /> Issue Manual Certificate
              </h2>
              <button
                onClick={() => setManualCertModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualIssueCert} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Select Student *</label>
                <select
                  value={manualCertData.studentId}
                  onChange={(e) => setManualCertData({ ...manualCertData, studentId: e.target.value })}
                  required
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                >
                  <option value="">-- Choose Registered Student --</option>
                  {students.map((s) => (
                    <option key={s.uid} value={s.uid}>
                      {s.name || s.email} ({s.studentId || 'ID'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Select Course Program *</label>
                <select
                  value={manualCertData.courseId}
                  onChange={(e) => setManualCertData({ ...manualCertData, courseId: e.target.value })}
                  required
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                >
                  <option value="">-- Choose Course --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Assessment Final Score (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={manualCertData.score}
                  onChange={(e) => setManualCertData({ ...manualCertData, score: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setManualCertModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 rounded-xl font-bold"
                >
                  Issue & Generate QR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Certificate Viewer */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-5xl max-h-[95vh] overflow-y-auto">
            <CertificateView
              certificate={selectedCert}
              onClose={() => setSelectedCert(null)}
            />
          </div>
        </div>
      )}

    </div>
  );
};
