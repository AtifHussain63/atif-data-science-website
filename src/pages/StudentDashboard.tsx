import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Award,
  TrendingUp,
  PlayCircle,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  Printer,
  Download,
  Loader2,
  LogOut,
} from 'lucide-react';
import { Course, Enrollment, Certificate } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getAllCourses, getStudentEnrollments, getStudentCourseProgress } from '../services/courseService';
import { getStudentCertificates } from '../services/certificateService';
import { CertificateView } from '../components/certificate/CertificateView';
import { downloadCertificateImage } from '../components/certificate/PDFGenerator';

interface StudentDashboardProps {
  onNavigate: (view: string, param?: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigate }) => {
  const { user, profile, logout } = useAuth();
  const { success, error } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      success('Logged Out', 'You have been signed out successfully.');
      onNavigate('home');
    } catch (err: any) {
      error('Logout Failed', err?.message || 'Could not log out.');
    }
  };

  const [enrolledCourses, setEnrolledCourses] = useState<Array<{
    course: Course;
    progressPercentage: number;
    completedLessons: number;
    totalLessons: number;
  }>>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [downloadingCertId, setDownloadingCertId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);

      const [allCourses, enrollments, certs] = await Promise.all([
        getAllCourses(),
        getStudentEnrollments(user.uid),
        getStudentCertificates(user.uid),
      ]);

      const courseMap = new Map(allCourses.map((c) => [c.id, c]));

      const list = await Promise.all(
        enrollments.map(async (enr) => {
          const course = courseMap.get(enr.courseId);
          if (!course) return null;

          const progress = await getStudentCourseProgress(user.uid, enr.courseId);
          const completedLessons = progress.filter((p) => p.completed).length;
          const totalLessons = 4; // default 4 lessons per course
          const progressPercentage = Math.min(100, Math.round((completedLessons / totalLessons) * 100));

          return {
            course,
            progressPercentage,
            completedLessons,
            totalLessons,
          };
        })
      );

      setEnrolledCourses(list.filter(Boolean) as any);
      setCertificates(certs);
      setLoading(false);
    };

    load();
  }, [user]);

  const completedCount = enrolledCourses.filter((c) => c.progressPercentage === 100).length;
  const avgProgress =
    enrolledCourses.length > 0
      ? Math.round(
          enrolledCourses.reduce((acc, curr) => acc + curr.progressPercentage, 0) /
            enrolledCourses.length
        )
      : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
        <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div id="student-dashboard-page" className="min-h-screen bg-slate-950 text-slate-100 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-400 text-xs font-mono font-bold rounded-md border border-amber-500/30">
                {profile?.studentId || 'ASH-STU-00001'}
              </span>
              <span className="text-xs text-slate-400">Student Portal</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
              Welcome back, {profile?.name || user?.displayName || 'Student'}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
              Track your learning milestones, access enrolled courses, and view verified certificates.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              onClick={() => onNavigate('courses')}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-900/30 transition-transform hover:scale-105"
            >
              <Sparkles className="w-4 h-4" /> Explore Courses
            </button>

            <button
              id="student-dashboard-logout-btn"
              onClick={handleLogout}
              className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 transition-colors"
              title="Sign out of student account"
            >
              <LogOut className="w-4 h-4" /> Log Out
            </button>
          </div>
        </div>

        {/* 4 Key Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-white">{enrolledCourses.length}</p>
              <p className="text-xs text-slate-400 font-medium">Enrolled Courses</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-white">{completedCount}</p>
              <p className="text-xs text-slate-400 font-medium">Completed Courses</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-amber-400">{certificates.length}</p>
              <p className="text-xs text-slate-400 font-medium">Certificates Earned</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-white">{avgProgress}%</p>
              <p className="text-xs text-slate-400 font-medium">Overall Progress</p>
            </div>
          </div>

        </div>

        {/* Continue Learning Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-amber-400" /> Continue Learning
            </h2>
            <button
              onClick={() => onNavigate('my-courses')}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              View all ({enrolledCourses.length}) <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {enrolledCourses.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800">
              <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-white">You haven't enrolled in any courses yet</p>
              <p className="text-xs text-slate-400 mt-1">Browse our 46 courses in Data Science, Machine Learning, and AI.</p>
              <button
                onClick={() => onNavigate('courses')}
                className="mt-4 px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs"
              >
                Browse Catalog
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.slice(0, 3).map(({ course, progressPercentage, completedLessons, totalLessons }) => (
                <div
                  key={course.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-colors shadow-lg"
                >
                  <div className="flex gap-4">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-20 h-20 rounded-xl object-cover shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">{course.category}</span>
                      <h3 className="text-sm font-bold text-white truncate mt-0.5">{course.title}</h3>
                      <p className="text-[11px] text-slate-400 mt-1">{completedLessons} of {totalLessons} lessons done</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-xs mb-1.5 font-semibold">
                      <span className="text-slate-400">Progress</span>
                      <span className="text-amber-400">{progressPercentage}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-4">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-yellow-400"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>

                    <button
                      onClick={() => onNavigate('learning', course.id)}
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <PlayCircle className="w-4 h-4 text-amber-400" /> Continue Classroom
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Certificates Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" /> Recent Certificates ({certificates.length})
            </h2>
            <button
              onClick={() => onNavigate('my-certificates')}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              View all certificates <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {certificates.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800">
              <Award className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-white">No certificates earned yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Complete the course lessons and pass the final 50-MCQ quiz (≥80%) to automatically receive your certificate.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certificates.map((cert) => (
                <div
                  key={cert.certificateId}
                  className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold text-amber-400">{cert.certificateId}</span>
                      <h3 className="text-sm font-bold text-white">{cert.courseName}</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">Completed {cert.completionDate}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => setSelectedCert(cert)}
                      className="flex-1 sm:flex-initial px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={async () => {
                        setDownloadingCertId(cert.certificateId);
                        try {
                          await downloadCertificateImage(cert);
                        } catch {
                          setSelectedCert(cert);
                        } finally {
                          setDownloadingCertId(null);
                        }
                      }}
                      disabled={downloadingCertId === cert.certificateId}
                      className="flex-1 sm:flex-initial px-3 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-sm cursor-pointer disabled:opacity-60"
                      title="Download Certificate Image directly"
                    >
                      {downloadingCertId === cert.certificateId ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
                      ) : (
                        <Download className="w-3.5 h-3.5 text-slate-950" />
                      )}
                      <span>{downloadingCertId === cert.certificateId ? 'Generating...' : 'Download Image'}</span>
                    </button>
                    <button
                      onClick={() => onNavigate('verify', cert.certificateId)}
                      className="px-2.5 py-2 text-slate-400 hover:text-emerald-400 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors flex items-center gap-1 text-xs"
                      title="Open verification page"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Verify</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>

      {/* Modal: Certificate Viewer */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto">
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
