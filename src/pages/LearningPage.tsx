import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  BookOpen,
  CheckCircle2,
  Circle,
  PlayCircle,
  Download,
  ArrowLeft,
  ArrowRight,
  Award,
  FileText,
  Lock,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import { Course, Module, Lesson, Quiz, Certificate } from '../types';
import {
  getCourseFullDetail,
  markLessonComplete,
  getStudentCourseProgress,
  enrollStudent,
} from '../services/courseService';
import {
  checkCertificateEligibility,
  issueCertificate,
} from '../services/certificateService';
import { getYouTubeEmbedUrl } from '../services/youtubeService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CertificateView } from '../components/certificate/CertificateView';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { AITutorDrawer } from '../components/learning/AITutorDrawer';

interface LearningPageProps {
  courseId: string;
  onNavigate: (view: string, param?: string) => void;
}

export const LearningPage: React.FC<LearningPageProps> = ({ courseId, onNavigate }) => {
  const { user, profile } = useAuth();
  const { success, error, info } = useToast();

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string>('');
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [aiTutorOpen, setAiTutorOpen] = useState<boolean>(false);

  // Certificate state
  const [eligibility, setEligibility] = useState<{
    isEligible: boolean;
    progressPercentage: number;
    completedLessonsCount: number;
    totalRequiredLessons: number;
    quizPassed: boolean;
    bestQuizScore: number;
    existingCertificate?: Certificate | null;
  }>({
    isEligible: false,
    progressPercentage: 0,
    completedLessonsCount: 0,
    totalRequiredLessons: 0,
    quizPassed: false,
    bestQuizScore: 0,
  });

  const [certificateModal, setCertificateModal] = useState<Certificate | null>(null);
  const [generatingCert, setGeneratingCert] = useState<boolean>(false);

  const reloadProgressAndEligibility = async (uid: string, cid: string) => {
    const prog = await getStudentCourseProgress(uid, cid);
    const completedSet = new Set(prog.filter((p) => p.completed).map((p) => p.lessonId));
    setCompletedLessonIds(completedSet);

    const elig = await checkCertificateEligibility(uid, cid);
    setEligibility(elig);
    if (elig.existingCertificate) {
      setCertificateModal(elig.existingCertificate);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      if (user) {
        await enrollStudent(user.uid, courseId);
      }

      const detail = await getCourseFullDetail(courseId);
      setCourse(detail.course);
      setModules(detail.modules);
      setLessons(detail.lessons);
      setQuiz(detail.quiz);

      if (detail.lessons.length > 0) {
        setActiveLessonId(detail.lessons[0].id);
      }

      if (user) {
        await reloadProgressAndEligibility(user.uid, courseId);
      }
      setLoading(false);
    };

    load();
  }, [courseId, user]);

  const activeLesson = lessons.find((l) => l.id === activeLessonId) || lessons[0];
  const activeIndex = lessons.findIndex((l) => l.id === activeLessonId);
  const isCurrentCompleted = activeLesson ? completedLessonIds.has(activeLesson.id) : false;

  const handleToggleComplete = async () => {
    if (!user || !activeLesson) return;
    const newStatus = !isCurrentCompleted;

    try {
      await markLessonComplete(user.uid, courseId, activeLesson.id, newStatus);
      if (newStatus) {
        setCompletedLessonIds((prev) => new Set([...prev, activeLesson.id]));
        success('Lesson Completed!', `Marked "${activeLesson.title}" as complete.`);
      } else {
        setCompletedLessonIds((prev) => {
          const updated = new Set(prev);
          updated.delete(activeLesson.id);
          return updated;
        });
        info('Lesson Updated', `Marked "${activeLesson.title}" as incomplete.`);
      }

      await reloadProgressAndEligibility(user.uid, courseId);
    } catch (err) {
      console.error(err);
      error('Update Failed', 'Could not update lesson progress.');
    }
  };

  const handleClaimCertificate = async () => {
    if (!user || !course) return;

    try {
      setGeneratingCert(true);
      const cert = await issueCertificate(
        user.uid,
        profile?.name || user.displayName || 'Student',
        user.email || '',
        course,
        eligibility.bestQuizScore || 100
      );

      setCertificateModal(cert);
      success('Certificate Issued!', `Congratulations on completing ${course.title}!`);

      // Confetti celebration
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });

      await reloadProgressAndEligibility(user.uid, courseId);
    } catch (err) {
      console.error(err);
      error('Certificate Error', 'Could not generate certificate.');
    } finally {
      setGeneratingCert(false);
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
          Return to Courses
        </button>
      </div>
    );
  }

  return (
    <div id="student-learning-page" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      
      {/* Top Learning Bar */}
      <div className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('courses')}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            title="Back to Catalog"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-xs sm:text-sm font-bold text-white max-w-[200px] sm:max-w-md truncate">
            {course.title}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Progress pill */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-950 px-3 py-1 rounded-full border border-slate-800 text-xs">
            <span className="text-slate-400">Progress:</span>
            <strong className="text-amber-400">{eligibility.progressPercentage}%</strong>
          </div>

          {/* Classroom Theme Toggle */}
          <ThemeToggle />

          {/* AI Tutor Assistant Button */}
          <button
            onClick={() => setAiTutorOpen(!aiTutorOpen)}
            className="px-2.5 sm:px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Ask AI Academic Tutor"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">AI Tutor</span>
          </button>

          {/* Certificate Trigger Button */}
          {eligibility.existingCertificate ? (
            <button
              onClick={() => setCertificateModal(eligibility.existingCertificate!)}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Award className="w-3.5 h-3.5" /> View Certificate
            </button>
          ) : eligibility.isEligible ? (
            <button
              onClick={handleClaimCertificate}
              disabled={generatingCert}
              className="px-3 py-1 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md shadow-amber-900/30 animate-bounce"
            >
              <Sparkles className="w-3.5 h-3.5" /> {generatingCert ? 'Generating...' : 'Claim Certificate!'}
            </button>
          ) : null}

          {/* Mobile Sidebar Toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Curriculum Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:static inset-y-14 left-0 w-80 sm:w-96 bg-slate-900/95 lg:bg-slate-900 border-r border-slate-800 flex flex-col z-30 transition-transform duration-200`}
        >
          {/* Progress Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-950/60">
            <div className="flex items-center justify-between text-xs font-semibold mb-2">
              <span className="text-slate-300">Course Completion</span>
              <span className="text-amber-400">{eligibility.progressPercentage}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500"
                style={{ width: `${eligibility.progressPercentage}%` }}
              />
            </div>
            <div className="mt-2 text-[11px] text-slate-400 flex justify-between">
              <span>{eligibility.completedLessonsCount} of {eligibility.totalRequiredLessons} lessons done</span>
              <span>Quiz: {eligibility.quizPassed ? 'Passed ✓' : 'Pending'}</span>
            </div>
          </div>

          {/* Modules List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {modules.map((mod, modIdx) => {
              const modLessons = lessons.filter((l) => l.moduleId === mod.id);
              return (
                <div key={mod.id} className="space-y-1">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
                    Module {modIdx + 1}: {mod.title.replace(/^Module\s+\d+:\s*/, '')}
                  </p>

                  <div className="space-y-0.5">
                    {modLessons.map((les) => {
                      const isCompleted = completedLessonIds.has(les.id);
                      const isActive = les.id === activeLessonId;

                      return (
                        <button
                          key={les.id}
                          onClick={() => {
                            setActiveLessonId(les.id);
                            setSidebarOpen(false);
                          }}
                          className={`w-full p-2.5 rounded-xl text-left text-xs flex items-start gap-2.5 transition-all ${
                            isActive
                              ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300 font-semibold'
                              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                          }`}
                        >
                          <div className="shrink-0 mt-0.5">
                            {isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="truncate leading-tight">{les.title}</p>
                            <span className="text-[10px] text-slate-500 block mt-0.5">
                              {les.durationMinutes || 25} mins
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Final Assessment Item */}
            {quiz && (
              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={() => onNavigate('quiz', course.id)}
                  className={`w-full p-3 rounded-xl text-left text-xs flex items-center justify-between border transition-all ${
                    eligibility.quizPassed
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <div>
                      <p className="font-bold">Final 50-MCQ Assessment</p>
                      <span className="text-[10px] text-slate-400">
                        {eligibility.quizPassed
                          ? `Passed with ${eligibility.bestQuizScore}% (≥80%) ✓`
                          : `Passing criteria: ${quiz.passingPercentage || 80}% (50 MCQs)`}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold underline">
                    {eligibility.quizPassed ? 'View / Retake →' : 'Take Quiz →'}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Certificate Status Footer in Sidebar */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/80 text-center">
            {eligibility.existingCertificate ? (
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                <p className="text-xs font-bold text-emerald-400">Certificate Unlocked!</p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {eligibility.existingCertificate.certificateId}</p>
              </div>
            ) : eligibility.isEligible ? (
              <button
                onClick={handleClaimCertificate}
                disabled={generatingCert}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold text-xs rounded-xl shadow-md"
              >
                {generatingCert ? 'Generating...' : 'Claim Official Certificate'}
              </button>
            ) : (
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                Complete lessons & pass quiz for certificate
              </div>
            )}
          </div>

        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 max-w-5xl mx-auto w-full">
          
          {activeLesson ? (
            <div className="space-y-6">
              
              {/* Video Player */}
              <div className="aspect-video bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
                {activeLesson.videoUrl || activeLesson.youtubeVideoId ? (
                  <iframe
                    src={getYouTubeEmbedUrl(activeLesson.videoUrl || activeLesson.youtubeVideoId)}
                    title={activeLesson.title}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                    <PlayCircle className="w-16 h-16 mb-2" />
                    <p className="text-sm">Interactive Video Lecture</p>
                  </div>
                )}
              </div>

              {/* Lesson Title & Mark Complete Control */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white">
                    {activeLesson.title}
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    {activeLesson.description}
                  </p>
                </div>

                <button
                  id="btn-mark-lesson-complete"
                  onClick={handleToggleComplete}
                  className={`px-5 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shrink-0 ${
                    isCurrentCompleted
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isCurrentCompleted ? 'Lesson Completed ✓' : 'Mark Lesson Complete'}
                </button>
              </div>

              {/* Lesson Notes / Theory */}
              <div className="bg-slate-900/60 border border-slate-800 p-6 sm:p-8 rounded-2xl space-y-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-400" />
                  Comprehensive Lesson Notes & Code
                </h2>

                <div className="prose prose-invert max-w-none text-xs sm:text-sm text-slate-300 leading-relaxed space-y-4 whitespace-pre-line font-sans">
                  {activeLesson.notes || 'In this lesson, you will master practical implementation and core mechanics.'}
                </div>

                {/* Material Download Box */}
                {activeLesson.materialUrl && (
                  <div className="mt-6 pt-6 border-t border-slate-800 flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className="text-xs font-semibold text-white">
                          {activeLesson.materialName || 'Lesson-Resources.pdf'}
                        </p>
                        <p className="text-[10px] text-slate-400">Downloadable dataset & cheat sheet</p>
                      </div>
                    </div>
                    <a
                      href={activeLesson.materialUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 border border-slate-700"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </a>
                  </div>
                )}
              </div>

              {/* Bottom Navigation */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-900">
                <button
                  onClick={() => {
                    if (activeIndex > 0) {
                      setActiveLessonId(lessons[activeIndex - 1].id);
                    }
                  }}
                  disabled={activeIndex === 0}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40"
                >
                  <ArrowLeft className="w-4 h-4" /> Previous Lesson
                </button>

                {activeIndex < lessons.length - 1 ? (
                  <button
                    onClick={() => {
                      setActiveLessonId(lessons[activeIndex + 1].id);
                    }}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow"
                  >
                    Next Lesson <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => onNavigate('quiz', course.id)}
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow"
                  >
                    Take Final Assessment <Award className="w-4 h-4" />
                  </button>
                )}
              </div>

            </div>
          ) : (
            <div className="p-8 text-center text-slate-500">No lessons available.</div>
          )}

        </main>
      </div>

      {/* Modal: Certificate Viewer */}
      {certificateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-5xl max-h-[95vh] overflow-y-auto">
            <CertificateView
              certificate={certificateModal}
              onClose={() => setCertificateModal(null)}
            />
          </div>
        </div>
      )}

      {/* AI Academic Tutor Drawer */}
      <AITutorDrawer
        course={course}
        lesson={activeLesson}
        studentName={profile?.name || user?.displayName || 'Student'}
        isOpen={aiTutorOpen}
        onClose={() => setAiTutorOpen(false)}
      />

    </div>
  );
};
