import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Clock,
  Award,
  CheckCircle,
  PlayCircle,
  FileText,
  Lock,
  ArrowLeft,
  Users,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { Course, Module, Lesson, Quiz } from '../types';
import { getCourseFullDetail, enrollStudent, getStudentEnrollments } from '../services/courseService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface CourseDetailPageProps {
  courseId: string;
  onNavigate: (view: string, param?: string) => void;
}

export const CourseDetailPage: React.FC<CourseDetailPageProps> = ({ courseId, onNavigate }) => {
  const { user, isSuspended } = useAuth();
  const { success, error, info } = useToast();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isEnrolled, setIsEnrolled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [enrolling, setEnrolling] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const detail = await getCourseFullDetail(courseId);
      setCourse(detail.course);
      setModules(detail.modules);
      setLessons(detail.lessons);
      setQuiz(detail.quiz);

      if (user) {
        const enrollments = await getStudentEnrollments(user.uid);
        setIsEnrolled(enrollments.some((e) => e.courseId === courseId));
      }
      setLoading(false);
    };
    load();
  }, [courseId, user]);

  const handleEnroll = async () => {
    if (!user) {
      info('Account Required', 'Please register or log in to enroll in this course.');
      onNavigate('auth', 'register');
      return;
    }

    if (isSuspended) {
      error('Account Suspended', 'Your student account is currently suspended. Please contact admin.');
      return;
    }

    try {
      setEnrolling(true);
      await enrollStudent(user.uid, courseId);
      setIsEnrolled(true);
      success('Enrolled Successfully!', `You are now enrolled in ${course?.title}`);
      onNavigate('learning', courseId);
    } catch (err) {
      console.error(err);
      error('Enrollment Failed', 'Could not complete enrollment. Please try again.');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
        <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-8">
        <h2 className="text-xl font-bold">Course Not Found</h2>
        <button
          onClick={() => onNavigate('courses')}
          className="mt-4 px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  return (
    <div id="course-detail-page" className="min-h-screen bg-slate-950 text-slate-100 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Button */}
        <button
          id="btn-back-to-courses"
          onClick={() => onNavigate('courses')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Courses
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Left Content: Title, Overview, Curriculum */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Header info */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold rounded-full">
                  {course.category}
                </span>
                <span className="px-3 py-1 bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium rounded-full">
                  {course.difficulty}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
                {course.title}
              </h1>

              <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
                {course.description}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-6 text-xs text-slate-400 pt-4 border-t border-slate-900">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-slate-500" /> Instructor: <strong className="text-white">{course.instructor || 'Atif Hussain'}</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-500" /> Duration: <strong className="text-white">{course.duration}</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500" /> Passing Score: <strong className="text-amber-400">{course.passingPercentage || 70}%</strong>
                </span>
              </div>
            </div>

            {/* Curriculum Breakdown */}
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                Course Curriculum ({modules.length} Modules, {lessons.length} Lessons)
              </h2>

              <div className="space-y-4">
                {modules.map((mod, modIdx) => {
                  const modLessons = lessons.filter((l) => l.moduleId === mod.id);
                  return (
                    <div key={mod.id} className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
                      <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-amber-400">Module {modIdx + 1}</p>
                          <h3 className="text-sm font-semibold text-white mt-0.5">{mod.title}</h3>
                        </div>
                        <span className="text-xs text-slate-400 font-mono">{modLessons.length} lessons</span>
                      </div>

                      <div className="divide-y divide-slate-900">
                        {modLessons.map((les) => (
                          <div key={les.id} className="p-3.5 px-4 flex items-center justify-between text-xs hover:bg-slate-900/40 transition-colors">
                            <div className="flex items-center gap-3">
                              <PlayCircle className="w-4 h-4 text-slate-400" />
                              <span className="text-slate-200 font-medium">{les.title}</span>
                              {les.required && (
                                <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">Required</span>
                              )}
                            </div>
                            <span className="text-slate-400">{les.durationMinutes || 25} mins</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Final Assessment Item */}
                {quiz && (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                        <Award className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-amber-300">{quiz.title}</h4>
                        <p className="text-[11px] text-slate-400">Passing score: {quiz.passingPercentage}% ({quiz.questions?.length || 5} Questions)</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-amber-400">Certificate Requirement</span>
                  </div>
                )}
              </div>
            </div>

            {/* Certification Details */}
            <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">Official Certificate Included</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Upon completing all required lessons and passing the final quiz with ≥{course.passingPercentage}%, you will immediately receive an official certificate with authorized signature and unique QR code.
                </p>
              </div>
            </div>

          </div>

          {/* Right Action Sidebar Card */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl sticky top-24">
              <div className="h-48 overflow-hidden relative">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <span className="text-xs text-slate-400 font-medium">Full Access</span>
                  <div className="text-2xl font-black text-white mt-0.5">Free Enrollment</div>
                </div>

                {isEnrolled ? (
                  <button
                    id="btn-goto-learning"
                    onClick={() => onNavigate('learning', course.id)}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-900/30 transition-all flex items-center justify-center gap-2"
                  >
                    <PlayCircle className="w-4 h-4" /> Continue Learning
                  </button>
                ) : (
                  <button
                    id="btn-enroll-course"
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-900/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <BookOpen className="w-4 h-4" />
                    {enrolling ? 'Enrolling...' : 'Enroll in Course'}
                  </button>
                )}

                <div className="space-y-2.5 text-xs text-slate-400 border-t border-slate-800 pt-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> {lessons.length} on-demand video & text lessons
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Downloadable notes & practice notebooks
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Interactive Final Quiz Assessment
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Verifiable Certificate with QR Code
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
