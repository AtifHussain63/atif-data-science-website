import React, { useState, useEffect, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Award,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  HelpCircle,
  ShieldCheck,
  Clock,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Filter,
  Layers,
  Shuffle,
  AlertCircle,
  Eye,
  Check,
  CheckSquare,
  Lock,
} from 'lucide-react';
import { Course, Quiz, QuizQuestion, QuizAttempt, Certificate } from '../types';
import { getCourseFullDetail, saveQuizAttempt } from '../services/courseService';
import { getCourseQuiz, randomizeQuizForStudent, calculateQuizScore } from '../services/quizService';
import { issueCertificate, checkCertificateEligibility } from '../services/certificateService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CertificateView } from '../components/certificate/CertificateView';

interface QuizPageProps {
  courseId: string;
  onNavigate: (view: string, param?: string) => void;
}

export const QuizPage: React.FC<QuizPageProps> = ({ courseId, onNavigate }) => {
  const { user, profile } = useAuth();
  const { success, error, info, warning } = useToast();

  const [course, setCourse] = useState<Course | null>(null);
  const [rawQuiz, setRawQuiz] = useState<Quiz | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
    correctCount: number;
    totalCount: number;
    easyScore: { correct: number; total: number };
    mediumScore: { correct: number; total: number };
    advancedScore: { correct: number; total: number };
    timeTakenSeconds: number;
  } | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [certificateModal, setCertificateModal] = useState<Certificate | null>(null);
  const [generatingCert, setGeneratingCert] = useState<boolean>(false);

  // Eligibility details
  const [eligibility, setEligibility] = useState<{
    isEligible: boolean;
    progressPercentage: number;
    completedLessonsCount: number;
    totalRequiredLessons: number;
  } | null>(null);

  // Pagination & Layout Controls
  const [viewMode, setViewMode] = useState<'paged' | 'single' | 'all'>('paged');
  const [currentPage, setCurrentPage] = useState<number>(0); // 10 questions per page
  const [currentSingleIndex, setCurrentSingleIndex] = useState<number>(0);
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'advanced'>('all');
  const [isShuffled, setIsShuffled] = useState<boolean>(false);

  // Timer State
  const [secondsRemaining, setSecondsRemaining] = useState<number>(45 * 60);
  const [timerRunning, setTimerRunning] = useState<boolean>(true);
  const startTimeRef = useRef<number>(Date.now());

  const questionsPerPage = 10;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const detail = await getCourseFullDetail(courseId);
        setCourse(detail.course);

        // Fetch dedicated 50-MCQ quiz
        const q = await getCourseQuiz(courseId);
        setRawQuiz(q);
        setActiveQuiz(q);

        const limit = q.timeLimitMinutes || 45;
        setSecondsRemaining(limit * 60);
        startTimeRef.current = Date.now();

        if (user) {
          const el = await checkCertificateEligibility(user.uid, courseId);
          setEligibility({
            isEligible: el.isEligible,
            progressPercentage: el.progressPercentage,
            completedLessonsCount: el.completedLessonsCount,
            totalRequiredLessons: el.totalRequiredLessons,
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId, user]);

  // Timer countdown hook
  useEffect(() => {
    if (!timerRunning || submitted || loading || secondsRemaining <= 0) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timerRunning, submitted, loading, secondsRemaining]);

  const handleTimeExpired = () => {
    warning('Time Expired', 'The allocated 45-minute timer has ended. Submitting your assessment automatically.');
    handleSubmitQuiz(true);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Toggle Shuffling
  const handleToggleShuffle = () => {
    if (submitted || !rawQuiz) return;
    if (!isShuffled) {
      const randomized = randomizeQuizForStudent(rawQuiz);
      setActiveQuiz(randomized);
      setIsShuffled(true);
      info('Randomized Order', 'Question sequence and options randomized for exam integrity.');
    } else {
      setActiveQuiz(rawQuiz);
      setIsShuffled(false);
      info('Standard Order', 'Question sequence restored to canonical 1-50.');
    }
  };

  // Toggle Flag Question
  const handleToggleFlag = (questionId: string) => {
    setFlaggedQuestions((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  // Handle Option Select
  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  // Filtered Questions by difficulty filter
  const displayedQuestions = useMemo(() => {
    if (!activeQuiz) return [];
    if (difficultyFilter === 'all') return activeQuiz.questions;
    return activeQuiz.questions.filter((q) => q.difficulty === difficultyFilter);
  }, [activeQuiz, difficultyFilter]);

  // Total Answered Count
  const answeredCount = useMemo(() => {
    return Object.keys(selectedAnswers).length;
  }, [selectedAnswers]);

  // Submit assessment
  const handleSubmitQuiz = async (forceSubmit = false) => {
    if (!activeQuiz || !course || !user) return;

    // Check unanswered
    const totalQ = activeQuiz.questions.length;
    const unanswered = activeQuiz.questions.filter((q) => selectedAnswers[q.id] === undefined);

    if (unanswered.length > 0 && !forceSubmit) {
      warning(
        'Incomplete Assessment',
        `You have ${unanswered.length} unanswered questions out of ${totalQ}. Please complete all questions or review your flagged items.`
      );
      return;
    }

    setTimerRunning(false);
    const timeSpent = Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000));

    // Calculate score
    const scoreResult = calculateQuizScore(activeQuiz.questions, selectedAnswers, activeQuiz.passingPercentage || 80);
    const passingPct = activeQuiz.passingPercentage || course.passingPercentage || 80;
    const passed = scoreResult.score >= passingPct;

    // Difficulty breakdowns
    let easyCorrect = 0;
    let easyTotal = 0;
    let medCorrect = 0;
    let medTotal = 0;
    let advCorrect = 0;
    let advTotal = 0;

    activeQuiz.questions.forEach((q) => {
      const isCorrect = selectedAnswers[q.id] === q.correctAnswer;
      if (q.difficulty === 'easy') {
        easyTotal++;
        if (isCorrect) easyCorrect++;
      } else if (q.difficulty === 'medium') {
        medTotal++;
        if (isCorrect) medCorrect++;
      } else {
        advTotal++;
        if (isCorrect) advCorrect++;
      }
    });

    const attempt: QuizAttempt = {
      id: `${user.uid}_${activeQuiz.id}_${Date.now()}`,
      studentId: user.uid,
      courseId,
      quizId: activeQuiz.id,
      score: scoreResult.score,
      passed,
      totalQuestions: totalQ,
      correctAnswers: scoreResult.correctCount,
      attemptedAt: new Date().toISOString(),
    };

    try {
      await saveQuizAttempt(attempt);
      setResult({
        score: scoreResult.score,
        passed,
        correctCount: scoreResult.correctCount,
        totalCount: totalQ,
        easyScore: { correct: easyCorrect, total: easyTotal },
        mediumScore: { correct: medCorrect, total: medTotal },
        advancedScore: { correct: advCorrect, total: advTotal },
        timeTakenSeconds: timeSpent,
      });
      setSubmitted(true);

      // If student passed with >= 80%, automatically issue and register their official certificate!
      if (passed) {
        try {
          setGeneratingCert(true);
          const studentDisplayName = profile?.name || user.displayName || 'Student';
          const cert = await issueCertificate(
            user.uid,
            studentDisplayName,
            user.email || '',
            course,
            scoreResult.score
          );
          setCertificateModal(cert);
          success(
            'Certificate Issued!',
            `Outstanding achievement! You scored ${scoreResult.score}% (Passing: 80%). Official Certificate ID: ${cert.certificateId}`
          );
        } catch (certErr) {
          console.warn('Auto-issue certificate notice:', certErr);
        } finally {
          setGeneratingCert(false);
        }

        confetti({
          particleCount: 220,
          spread: 90,
          origin: { y: 0.55 },
        });
      } else {
        error(
          'Assessment Not Passed',
          `You scored ${scoreResult.score}%. Minimum passing threshold is 80% (40 / 50 questions). Review the detailed explanations below and retake the quiz.`
        );
      }

      // Refresh eligibility
      const el = await checkCertificateEligibility(user.uid, courseId);
      setEligibility({
        isEligible: el.isEligible,
        progressPercentage: el.progressPercentage,
        completedLessonsCount: el.completedLessonsCount,
        totalRequiredLessons: el.totalRequiredLessons,
      });
    } catch (err) {
      console.error(err);
      error('Submission Error', 'Failed to record quiz attempt.');
    }
  };

  const handleRetake = () => {
    setSelectedAnswers({});
    setFlaggedQuestions({});
    setSubmitted(false);
    setResult(null);
    setCurrentPage(0);
    setCurrentSingleIndex(0);
    const limit = rawQuiz?.timeLimitMinutes || 45;
    setSecondsRemaining(limit * 60);
    setTimerRunning(true);
    startTimeRef.current = Date.now();
  };

  const handleClaimCertificate = async () => {
    if (!user || !course || !result) return;
    try {
      setGeneratingCert(true);
      const cert = await issueCertificate(
        user.uid,
        profile?.name || user.displayName || 'Student',
        user.email || '',
        course,
        result.score
      );
      setCertificateModal(cert);
      success('Certificate Generated!', `Official Certificate ID: ${cert.certificateId}`);
      confetti({ particleCount: 200, spread: 100 });
    } catch (err) {
      console.error(err);
      error('Error', 'Could not generate official certificate.');
    } finally {
      setGeneratingCert(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 space-y-4">
        <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-mono">Loading 50-MCQ Assessment System...</p>
      </div>
    );
  }

  if (!activeQuiz || !course) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-8 space-y-4">
        <AlertCircle className="w-12 h-12 text-amber-400" />
        <h2 className="text-xl font-bold">Assessment Not Found</h2>
        <button
          onClick={() => onNavigate('learning', courseId)}
          className="px-5 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs"
        >
          Return to Course Classroom
        </button>
      </div>
    );
  }

  const totalQuestions = activeQuiz.questions.length;
  const progressPct = Math.round((answeredCount / totalQuestions) * 100);
  const totalPages = Math.ceil(displayedQuestions.length / questionsPerPage);

  return (
    <div id="quiz-page" className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Top Breadcrumb & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            onClick={() => onNavigate('learning', courseId)}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Classroom
          </button>

          <div className="flex items-center gap-3">
            {/* Timer Badge */}
            <div
              className={`px-3.5 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 shadow-sm ${
                secondsRemaining < 300
                  ? 'bg-rose-950/60 border-rose-500 text-rose-300 animate-pulse'
                  : 'bg-slate-900 border-slate-800 text-amber-400'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Time Left: {formatTimer(secondsRemaining)}</span>
            </div>

            {/* Shuffle Button */}
            {!submitted && (
              <button
                onClick={handleToggleShuffle}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  isShuffled
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
                title="Randomize Questions and Options"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isShuffled ? 'Randomized' : 'Shuffle'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Assessment Header Card */}
        <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl space-y-4 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-400 text-[11px] font-bold rounded-full border border-amber-500/30 uppercase tracking-wider">
                  Official 50-MCQ Final Assessment
                </span>
                <span className="text-xs text-slate-400">• Passing Score: {activeQuiz.passingPercentage}%</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white">{activeQuiz.title}</h1>
              <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
                Certification for <strong className="text-slate-200">{course.title}</strong>. Contains exactly 50 categorized multiple-choice questions (1-15 Fundamentals, 16-35 Applied Logic, 36-50 Advanced Mastery).
              </p>
            </div>

            {/* Progress Counter Pill */}
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-center gap-4 shrink-0">
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">
                  Progress
                </span>
                <span className="text-base font-extrabold text-white">
                  {answeredCount} <span className="text-xs text-slate-500 font-normal">/ {totalQuestions}</span>
                </span>
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-amber-500 flex items-center justify-center font-bold text-xs text-amber-400">
                {progressPct}%
              </div>
            </div>

          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* RESULTS HERO BANNER (After submission) */}
        {submitted && result && (
          <div
            className={`p-6 sm:p-8 rounded-3xl border shadow-2xl space-y-6 ${
              result.passed
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-100 shadow-emerald-950/20'
                : 'bg-rose-950/60 border-rose-500/50 text-rose-100 shadow-rose-950/20'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              
              <div className="flex items-center gap-5">
                <div
                  className={`w-20 h-20 rounded-3xl flex flex-col items-center justify-center font-black shrink-0 shadow-lg ${
                    result.passed
                      ? 'bg-emerald-500 text-slate-950 shadow-emerald-900/50'
                      : 'bg-rose-500 text-white shadow-rose-900/50'
                  }`}
                >
                  <span className="text-2xl">{result.score}%</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider">
                    {result.passed ? 'PASSED' : 'FAILED'}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-black text-white">
                    {result.passed ? 'Assessment Passed — Official Certificate Unlocked!' : 'Assessment Not Passed'}
                  </h3>
                  <p className="text-xs opacity-90 leading-relaxed max-w-xl">
                    You scored <strong className="text-white">{result.score}%</strong> with <strong className="text-white">{result.correctCount}</strong> out of{' '}
                    <strong className="text-white">{result.totalCount}</strong> questions correct. (Passing criteria: {activeQuiz.passingPercentage || 80}% / 40 questions).
                  </p>
                  <p className="text-[11px] opacity-75">
                    Time taken: {Math.floor(result.timeTakenSeconds / 60)}m {result.timeTakenSeconds % 60}s
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                {result.passed ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      id="btn-view-certificate-quiz"
                      onClick={() => {
                        if (certificateModal) {
                          setCertificateModal({ ...certificateModal });
                        } else {
                          handleClaimCertificate();
                        }
                      }}
                      disabled={generatingCert}
                      className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-900/40 hover:scale-105 transition-transform"
                    >
                      <Sparkles className="w-4 h-4" />
                      {generatingCert ? 'Generating Certificate...' : 'View & Download Official Certificate'}
                    </button>
                    <button
                      onClick={() => onNavigate('my-certificates')}
                      className="px-5 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs flex items-center gap-2 border border-slate-700 shadow-md"
                    >
                      <Award className="w-4 h-4 text-amber-400" /> My Certificates
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={handleRetake}
                      className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-2xl text-xs flex items-center gap-2 shadow-md"
                    >
                      <RotateCcw className="w-4 h-4" /> Retake Assessment
                    </button>
                    <button
                      onClick={() => onNavigate('learning', courseId)}
                      className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs flex items-center gap-2 border border-slate-700 shadow-md"
                    >
                      <ArrowLeft className="w-4 h-4" /> Review Course Lessons
                    </button>
                  </div>
                )}
              </div>

            </div>

            {/* Performance Breakdown Cards */}
            <div className="pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              <div className="p-3.5 bg-black/30 rounded-2xl border border-white/10 space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
                  Easy (Questions 1 - 15)
                </span>
                <p className="text-lg font-bold text-white">
                  {result.easyScore.correct} / {result.easyScore.total}{' '}
                  <span className="text-xs font-normal opacity-80">
                    ({Math.round((result.easyScore.correct / Math.max(1, result.easyScore.total)) * 100)}%)
                  </span>
                </p>
              </div>

              <div className="p-3.5 bg-black/30 rounded-2xl border border-white/10 space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
                  Medium (Questions 16 - 35)
                </span>
                <p className="text-lg font-bold text-white">
                  {result.mediumScore.correct} / {result.mediumScore.total}{' '}
                  <span className="text-xs font-normal opacity-80">
                    ({Math.round((result.mediumScore.correct / Math.max(1, result.mediumScore.total)) * 100)}%)
                  </span>
                </p>
              </div>

              <div className="p-3.5 bg-black/30 rounded-2xl border border-white/10 space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400">
                  Advanced (Questions 36 - 50)
                </span>
                <p className="text-lg font-bold text-white">
                  {result.advancedScore.correct} / {result.advancedScore.total}{' '}
                  <span className="text-xs font-normal opacity-80">
                    ({Math.round((result.advancedScore.correct / Math.max(1, result.advancedScore.total)) * 100)}%)
                  </span>
                </p>
              </div>

            </div>
          </div>
        )}

        {/* QUESTION PALETTE / MATRIX & VIEW SELECTOR */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-400" /> Question Navigator (1 - 50)
              </h3>
              <p className="text-[11px] text-slate-500">
                Click any number to jump directly to that question.
              </p>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setViewMode('paged')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'paged' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                10 Per Page
              </button>
              <button
                onClick={() => setViewMode('single')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'single' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                One by One
              </button>
              <button
                onClick={() => setViewMode('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'all' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                All 50 Questions
              </button>
            </div>
          </div>

          {/* 50 Question Buttons Matrix */}
          <div className="grid grid-cols-10 sm:grid-cols-25 gap-1.5 pt-1">
            {activeQuiz.questions.map((q, idx) => {
              const isAnswered = selectedAnswers[q.id] !== undefined;
              const isFlagged = !!flaggedQuestions[q.id];
              const isCurrentSingle = viewMode === 'single' && currentSingleIndex === idx;

              let btnStyle = 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700';

              if (submitted && result) {
                const isCorrect = selectedAnswers[q.id] === q.correctAnswer;
                btnStyle = isCorrect
                  ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold'
                  : 'bg-rose-950 border-rose-500 text-rose-300 font-bold';
              } else if (isCurrentSingle) {
                btnStyle = 'bg-amber-500 text-slate-950 font-black border-amber-400 ring-2 ring-amber-500/50';
              } else if (isFlagged) {
                btnStyle = 'bg-yellow-500/20 border-yellow-500 text-yellow-300 font-bold';
              } else if (isAnswered) {
                btnStyle = 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold';
              }

              return (
                <button
                  key={q.id}
                  onClick={() => {
                    if (viewMode === 'single') {
                      setCurrentSingleIndex(idx);
                    } else if (viewMode === 'paged') {
                      setCurrentPage(Math.floor(idx / questionsPerPage));
                    }
                    const el = document.getElementById(`quiz-question-${q.id}`);
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }}
                  className={`h-7 rounded-lg border text-xs font-mono transition-all flex items-center justify-center relative ${btnStyle}`}
                  title={`Question ${idx + 1} (${q.difficulty}) ${isAnswered ? '• Answered' : '• Unanswered'} ${isFlagged ? '• Flagged' : ''}`}
                >
                  {idx + 1}
                  {isFlagged && !submitted && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-yellow-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Palette Legend */}
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Answered ({answeredCount})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-600" /> Unanswered ({totalQuestions - answeredCount})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" /> Flagged for Review ({Object.values(flaggedQuestions).filter(Boolean).length})
            </span>
          </div>
        </div>

        {/* QUESTIONS DISPLAY LIST */}
        <div className="space-y-6">
          {(viewMode === 'single'
            ? [activeQuiz.questions[currentSingleIndex]]
            : viewMode === 'paged'
            ? displayedQuestions.slice(
                currentPage * questionsPerPage,
                (currentPage + 1) * questionsPerPage
              )
            : displayedQuestions
          ).map((q, localIdx) => {
            if (!q) return null;
            const globalIndex = activeQuiz.questions.findIndex((item) => item.id === q.id);
            const selectedOpt = selectedAnswers[q.id];
            const isAnswered = selectedOpt !== undefined;
            const isFlagged = !!flaggedQuestions[q.id];
            const isCorrect = isAnswered && selectedOpt === q.correctAnswer;

            const isEasy = q.difficulty === 'easy';
            const isMed = q.difficulty === 'medium';
            const isAdv = q.difficulty === 'advanced';

            return (
              <div
                key={q.id}
                id={`quiz-question-${q.id}`}
                className={`bg-slate-900/80 border rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl transition-all ${
                  isFlagged && !submitted
                    ? 'border-yellow-500/50 ring-1 ring-yellow-500/20'
                    : 'border-slate-800'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 text-amber-400 font-mono text-sm font-bold flex items-center justify-center shrink-0">
                      {globalIndex + 1}
                    </span>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isEasy
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : isMed
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                          }`}
                        >
                          {q.difficulty || (globalIndex < 15 ? 'Easy' : globalIndex < 35 ? 'Medium' : 'Advanced')}
                        </span>
                        {q.topic && (
                          <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            {q.topic}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed">
                        {q.question}
                      </h3>
                    </div>
                  </div>

                  {/* Bookmark Button / Status Badge */}
                  <div className="flex items-center gap-2 shrink-0">
                    {!submitted && (
                      <button
                        onClick={() => handleToggleFlag(q.id)}
                        className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 transition-colors ${
                          isFlagged
                            ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                        title="Flag / Bookmark question for later review"
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{isFlagged ? 'Flagged' : 'Flag'}</span>
                      </button>
                    )}

                    {submitted && (
                      <span
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
                          isCorrect
                            ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-400'
                            : 'bg-rose-950/60 border-rose-500/60 text-rose-400'
                        }`}
                      >
                        {isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        {isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    )}
                  </div>
                </div>

                {/* 4 Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = selectedOpt === optIdx;
                    let optionStyle =
                      'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900/50';

                    if (submitted) {
                      if (optIdx === q.correctAnswer) {
                        optionStyle =
                          'bg-emerald-950/50 border-emerald-500 text-emerald-200 font-semibold ring-1 ring-emerald-500/30';
                      } else if (isSelected && optIdx !== q.correctAnswer) {
                        optionStyle = 'bg-rose-950/50 border-rose-500 text-rose-200';
                      } else {
                        optionStyle = 'bg-slate-950 border-slate-800 text-slate-600 opacity-50';
                      }
                    } else if (isSelected) {
                      optionStyle =
                        'bg-amber-500/10 border-amber-500 text-amber-300 font-semibold shadow-md ring-1 ring-amber-500/30';
                    }

                    const letters = ['A', 'B', 'C', 'D'];

                    return (
                      <button
                        key={optIdx}
                        disabled={submitted}
                        onClick={() => handleSelectOption(q.id, optIdx)}
                        className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm flex items-center gap-3.5 transition-all ${optionStyle}`}
                      >
                        <span
                          className={`w-7 h-7 rounded-xl text-xs font-bold font-mono flex items-center justify-center shrink-0 border ${
                            isSelected
                              ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                              : 'bg-slate-900 text-slate-400 border-slate-800'
                          }`}
                        >
                          {letters[optIdx]}
                        </span>
                        <span className="flex-1 leading-relaxed">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Explanation */}
                {submitted && q.explanation && (
                  <div className="mt-4 p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
                    <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <strong className="text-white">Explanation:</strong>
                      <p className="text-slate-300 leading-relaxed">{q.explanation}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* PAGINATION / NEXT CONTROLS (If Paged or Single) */}
        {viewMode === 'paged' && totalPages > 1 && (
          <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" /> Previous 10
            </button>

            <span className="text-xs text-slate-400 font-semibold">
              Page {currentPage + 1} of {totalPages} (Questions {currentPage * 10 + 1} -{' '}
              {Math.min(displayedQuestions.length, (currentPage + 1) * 10)})
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
              className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40"
            >
              Next 10 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {viewMode === 'single' && (
          <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <button
              onClick={() => setCurrentSingleIndex((idx) => Math.max(0, idx - 1))}
              disabled={currentSingleIndex === 0}
              className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" /> Previous Question
            </button>

            <span className="text-xs text-slate-400 font-semibold">
              Question {currentSingleIndex + 1} of {totalQuestions}
            </span>

            <button
              onClick={() => setCurrentSingleIndex((idx) => Math.min(totalQuestions - 1, idx + 1))}
              disabled={currentSingleIndex >= totalQuestions - 1}
              className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40"
            >
              Next Question <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* BOTTOM SUBMISSION BAR */}
        {!submitted && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-white">
                Ready to submit your 50-MCQ Final Assessment?
              </p>
              <p className="text-xs text-slate-400">
                Answered: <strong className="text-amber-400">{answeredCount}</strong> of{' '}
                <strong className="text-white">{totalQuestions}</strong> questions. (Passing threshold: {activeQuiz.passingPercentage}%).
              </p>
            </div>

            <button
              id="btn-submit-quiz"
              onClick={() => handleSubmitQuiz(false)}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-extrabold rounded-2xl text-sm shadow-xl shadow-amber-900/30 flex items-center justify-center gap-2 transition-all hover:scale-105"
            >
              Submit 50-MCQ Assessment <ShieldCheck className="w-5 h-5" />
            </button>
          </div>
        )}

      </div>

      {/* Certificate Modal */}
      {certificateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-5xl max-h-[95vh] overflow-y-auto">
            <CertificateView
              certificate={certificateModal}
              onClose={() => setCertificateModal(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
