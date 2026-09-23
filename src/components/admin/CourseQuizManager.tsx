import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  Download,
  Upload,
  CheckCircle2,
  XCircle,
  Search,
  BookOpen,
  Award,
  Layers,
  Save,
  Check,
  Eye,
  TrendingUp,
  Sliders,
  Copy,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Course, Quiz, QuizQuestion } from '../../types';
import {
  getCourseQuiz,
  saveCourseQuiz,
  resetCourseQuizToDefault,
  getCourseQuizAnalytics,
  CourseQuizAnalytics,
} from '../../services/quizService';
import { useToast } from '../../context/ToastContext';

interface CourseQuizManagerProps {
  courses: Course[];
  onNavigateToPreview?: (courseId: string) => void;
}

export const CourseQuizManager: React.FC<CourseQuizManagerProps> = ({
  courses,
  onNavigateToPreview,
}) => {
  const { success, error, info } = useToast();

  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    courses[0]?.id || 'intro-data-science'
  );
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [analytics, setAnalytics] = useState<CourseQuizAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'advanced'>('all');

  // Question Edit Modal State
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [isNewQuestion, setIsNewQuestion] = useState(false);
  const [questionModalOpen, setQuestionModalOpen] = useState(false);

  // Bulk Import Modal State
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');

  // Settings
  const [passingPercentage, setPassingPercentage] = useState<number>(70);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(45);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

  const loadQuiz = async (courseId: string) => {
    setLoading(true);
    try {
      const q = await getCourseQuiz(courseId);
      setQuiz(q);
      setPassingPercentage(q.passingPercentage || 70);
      setTimeLimitMinutes(q.timeLimitMinutes || 45);

      const a = await getCourseQuizAnalytics(courseId);
      setAnalytics(a);
    } catch (err) {
      console.error(err);
      error('Error', 'Failed to load course quiz.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCourseId) {
      loadQuiz(selectedCourseId);
    }
  }, [selectedCourseId]);

  // Handle Save full quiz
  const handleSaveFullQuiz = async () => {
    if (!quiz) return;
    try {
      setSaving(true);
      const updatedQuiz: Quiz = {
        ...quiz,
        passingPercentage,
        timeLimitMinutes,
        totalQuestions: quiz.questions.length,
      };
      await saveCourseQuiz(updatedQuiz);
      setQuiz(updatedQuiz);
      success('Quiz Saved', `Updated 50-MCQ Quiz for "${selectedCourse?.title || selectedCourseId}"`);
    } catch (err) {
      console.error(err);
      error('Save Failed', 'Could not save quiz questions to database.');
    } finally {
      setSaving(false);
    }
  };

  // Reset to default 50 questions
  const handleResetToDefault = async () => {
    if (!selectedCourse) return;
    if (
      confirm(
        `Are you sure you want to reset "${selectedCourse.title}" questions to the default 50 curated MCQs? Any custom edits will be replaced.`
      )
    ) {
      try {
        setLoading(true);
        const defaultQuiz = await resetCourseQuizToDefault(selectedCourse.id, selectedCourse.title);
        setQuiz(defaultQuiz);
        setPassingPercentage(defaultQuiz.passingPercentage || 70);
        setTimeLimitMinutes(defaultQuiz.timeLimitMinutes || 45);
        success('Reset Successful', `Restored 50 curated MCQs for ${selectedCourse.title}`);
      } catch (err) {
        console.error(err);
        error('Reset Error', 'Could not reset questions.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Delete Question
  const handleDeleteQuestion = (questionId: string) => {
    if (!quiz) return;
    if (confirm('Are you sure you want to delete this question?')) {
      const updatedQuestions = quiz.questions
        .filter((q) => q.id !== questionId)
        .map((q, idx) => ({ ...q, questionNumber: idx + 1 }));

      const updatedQuiz = { ...quiz, questions: updatedQuestions };
      setQuiz(updatedQuiz);
      success('Question Deleted', `Remaining questions: ${updatedQuestions.length}`);
    }
  };

  // Duplicate Question
  const handleDuplicateQuestion = (q: QuizQuestion) => {
    if (!quiz) return;
    const newQ: QuizQuestion = {
      ...q,
      id: `${quiz.courseId}-q-${Date.now()}`,
      questionNumber: quiz.questions.length + 1,
      question: `${q.question} (Copy)`,
    };
    const updated = [...quiz.questions, newQ];
    setQuiz({ ...quiz, questions: updated });
    success('Duplicated', `Added copy to question bank (#${updated.length})`);
  };

  // Open Edit/Add Modal
  const openEditModal = (q?: QuizQuestion) => {
    if (q) {
      setEditingQuestion({ ...q });
      setIsNewQuestion(false);
    } else {
      setEditingQuestion({
        id: `${selectedCourseId}-q-${Date.now()}`,
        questionNumber: (quiz?.questions.length || 0) + 1,
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        explanation: '',
        difficulty: 'easy',
        topic: selectedCourse?.category || 'Foundations',
      });
      setIsNewQuestion(true);
    }
    setQuestionModalOpen(true);
  };

  // Save Modal Question
  const handleSaveModalQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quiz || !editingQuestion) return;

    if (!editingQuestion.question.trim()) {
      error('Validation', 'Question text cannot be blank.');
      return;
    }

    if (editingQuestion.options.some((opt) => !opt.trim())) {
      error('Validation', 'All 4 options must have text.');
      return;
    }

    let updatedQuestions: QuizQuestion[];
    if (isNewQuestion) {
      updatedQuestions = [...quiz.questions, editingQuestion].map((q, idx) => ({
        ...q,
        questionNumber: idx + 1,
      }));
    } else {
      updatedQuestions = quiz.questions.map((q) =>
        q.id === editingQuestion.id ? editingQuestion : q
      );
    }

    setQuiz({ ...quiz, questions: updatedQuestions });
    setQuestionModalOpen(false);
    setEditingQuestion(null);
    success('Question Updated', isNewQuestion ? 'Added new question' : 'Saved question changes');
  };

  // Bulk Export JSON
  const handleExportJson = () => {
    if (!quiz) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(quiz, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${selectedCourseId}-50-mcqs.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    success('Exported', `Downloaded questions for ${selectedCourse?.title}`);
  };

  // Bulk Import JSON
  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(importJsonText);
      let importedQuestions: QuizQuestion[] = [];

      if (Array.isArray(parsed)) {
        importedQuestions = parsed;
      } else if (parsed.questions && Array.isArray(parsed.questions)) {
        importedQuestions = parsed.questions;
      } else {
        throw new Error('Invalid format. Expecting an array of questions or a quiz object.');
      }

      if (importedQuestions.length === 0) {
        throw new Error('No questions found in JSON.');
      }

      const formatted = importedQuestions.map((q, idx) => ({
        id: q.id || `${selectedCourseId}-q-${idx + 1}`,
        questionNumber: idx + 1,
        question: q.question || `Question ${idx + 1}`,
        options: Array.isArray(q.options) && q.options.length >= 4 ? q.options.slice(0, 4) : ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
        explanation: q.explanation || '',
        difficulty: (q.difficulty as any) || (idx < 15 ? 'easy' : idx < 35 ? 'medium' : 'advanced'),
        topic: q.topic || selectedCourse?.category || 'General',
      }));

      if (quiz) {
        setQuiz({
          ...quiz,
          questions: formatted,
          totalQuestions: formatted.length,
        });
      }

      setImportModalOpen(false);
      setImportJsonText('');
      success('Import Successful', `Loaded ${formatted.length} MCQs into ${selectedCourse?.title}`);
    } catch (err: any) {
      console.error(err);
      error('Import Failed', err.message || 'Invalid JSON format');
    }
  };

  // Filtered Questions
  const filteredQuestions = (quiz?.questions || []).filter((q) => {
    const matchesSearch =
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.options.some((opt) => opt.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (q.explanation && q.explanation.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (q.topic && q.topic.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDifficulty =
      difficultyFilter === 'all' || q.difficulty === difficultyFilter;

    return matchesSearch && matchesDifficulty;
  });

  const easyCount = quiz?.questions.filter((q) => q.difficulty === 'easy').length || 0;
  const mediumCount = quiz?.questions.filter((q) => q.difficulty === 'medium').length || 0;
  const advancedCount = quiz?.questions.filter((q) => q.difficulty === 'advanced').length || 0;

  return (
    <div id="course-quiz-manager" className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-400 font-mono text-[11px] font-bold rounded-md border border-amber-500/30 uppercase">
                50 MCQs Quiz Engine
              </span>
              <span className="text-xs text-slate-400">Atif Skills Hub Question Banks</span>
            </div>
            <h2 className="text-xl font-black text-white">
              Course Final Assessments & Question Banks
            </h2>
            <p className="text-xs text-slate-400">
              Manage, customize, and inspect the 50 multiple choice questions required for course certification.
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {onNavigateToPreview && (
              <button
                onClick={() => onNavigateToPreview(selectedCourseId)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
                title="Preview Quiz as a Student"
              >
                <Eye className="w-4 h-4 text-cyan-400" /> Student Preview
              </button>
            )}

            <button
              onClick={handleExportJson}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
              title="Export all 50 questions as JSON"
            >
              <Download className="w-4 h-4 text-emerald-400" /> Export JSON
            </button>

            <button
              onClick={() => setImportModalOpen(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
              title="Bulk import questions from JSON"
            >
              <Upload className="w-4 h-4 text-blue-400" /> Import JSON
            </button>

            <button
              onClick={handleResetToDefault}
              className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5"
              title="Restore the standard 50 curriculum questions"
            >
              <RotateCcw className="w-4 h-4 text-rose-400" /> Reset to Curated 50
            </button>

            <button
              onClick={handleSaveFullQuiz}
              disabled={saving}
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-900/30 disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save All Questions'}
            </button>
          </div>

        </div>

        {/* Course Selector Dropdown & Passing Settings */}
        <div className="pt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" /> Select Course to Manage Questions ({courses.length} Available)
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-amber-500"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.category} • {c.difficulty})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Passing Score (%)
              </label>
              <input
                type="number"
                min={50}
                max={100}
                value={passingPercentage}
                onChange={(e) => setPassingPercentage(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Time Limit (Min)
              </label>
              <input
                type="number"
                min={10}
                max={120}
                value={timeLimitMinutes}
                onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              />
            </div>
          </div>

        </div>
      </div>

      {/* Analytics & Breakdown Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 font-medium">Total MCQs</span>
          <p className="text-2xl font-black text-amber-400">
            {quiz?.questions.length || 0}
          </p>
          <span className="text-[10px] text-slate-500">Standard: 50 Questions</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 font-medium">Easy (Q1 - 15)</span>
          <p className="text-2xl font-black text-emerald-400">{easyCount}</p>
          <span className="text-[10px] text-slate-500">Foundations & Terms</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 font-medium">Medium (Q16 - 35)</span>
          <p className="text-2xl font-black text-amber-400">{mediumCount}</p>
          <span className="text-[10px] text-slate-500">Workflows & Logic</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 font-medium">Advanced (Q36 - 50)</span>
          <p className="text-2xl font-black text-purple-400">{advancedCount}</p>
          <span className="text-[10px] text-slate-500">Deep Optimization</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1 col-span-2 lg:col-span-1">
          <span className="text-[11px] text-slate-400 font-medium">Student Pass Rate</span>
          <p className="text-2xl font-black text-cyan-400">
            {analytics ? `${analytics.passRate}%` : 'N/A'}
          </p>
          <span className="text-[10px] text-slate-500">
            {analytics?.totalAttempts || 0} student attempts
          </span>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search questions by text, explanation, or keyword..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: `All (${quiz?.questions.length || 0})` },
            { id: 'easy', label: `Easy (${easyCount})` },
            { id: 'medium', label: `Medium (${mediumCount})` },
            { id: 'advanced', label: `Advanced (${advancedCount})` },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setDifficultyFilter(f.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                difficultyFilter === f.id
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}

          <button
            onClick={() => openEditModal()}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 border border-slate-700 shrink-0 ml-auto sm:ml-0"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" /> Add Question
          </button>
        </div>

      </div>

      {/* Questions List */}
      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
          <p className="text-xs text-slate-400">Loading 50 MCQs for {selectedCourse?.title}...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((q, idx) => {
            const isEasy = q.difficulty === 'easy';
            const isMedium = q.difficulty === 'medium';
            const isAdv = q.difficulty === 'advanced';

            return (
              <div
                key={q.id}
                className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-3 shadow-md hover:border-slate-700 transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-slate-950 border border-slate-800 text-amber-400 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                      {q.questionNumber || idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isEasy
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : isMedium
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                          }`}
                        >
                          {q.difficulty || (idx < 15 ? 'Easy' : idx < 35 ? 'Medium' : 'Advanced')}
                        </span>
                        {q.topic && (
                          <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            {q.topic}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-semibold text-white leading-relaxed">
                        {q.question}
                      </h4>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleDuplicateQuestion(q)}
                      className="p-1.5 text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded-lg"
                      title="Duplicate Question"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openEditModal(q)}
                      className="p-1.5 text-slate-400 hover:text-amber-400 bg-slate-950 border border-slate-800 rounded-lg"
                      title="Edit Question"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-950 border border-slate-800 rounded-lg"
                      title="Delete Question"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 4 Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {q.options.map((opt, optIdx) => {
                    const isCorrect = optIdx === q.correctAnswer;
                    const letters = ['A', 'B', 'C', 'D'];
                    return (
                      <div
                        key={optIdx}
                        className={`p-2.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                          isCorrect
                            ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200 font-medium'
                            : 'bg-slate-950 border-slate-800/80 text-slate-300'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded font-mono font-bold text-[10px] flex items-center justify-center shrink-0 ${
                            isCorrect
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-slate-900 text-slate-400 border border-slate-800'
                          }`}
                        >
                          {letters[optIdx]}
                        </span>
                        <span className="flex-1 truncate">{opt}</span>
                        {isCorrect && (
                          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider px-1.5 py-0.5 bg-emerald-500/20 rounded">
                            Correct
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {q.explanation && (
                  <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-[11px] text-slate-400 flex items-start gap-2">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">
                      <strong className="text-slate-300">Explanation:</strong> {q.explanation}
                    </span>
                  </div>
                )}

              </div>
            );
          })}

          {filteredQuestions.length === 0 && (
            <div className="p-12 text-center text-slate-500 bg-slate-900/40 rounded-3xl border border-slate-800 space-y-2">
              <HelpCircle className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs">No questions match your current search and filter criteria.</p>
            </div>
          )}
        </div>
      )}

      {/* MODAL: Question Editor */}
      {questionModalOpen && editingQuestion && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-5 shadow-2xl">
            
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-amber-400 font-bold">
                  Question #{editingQuestion.questionNumber}
                </span>
                <h3 className="text-lg font-bold text-white">
                  {isNewQuestion ? 'Create New MCQ' : 'Edit Multiple Choice Question'}
                </h3>
              </div>
              <button
                onClick={() => setQuestionModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModalQuestion} className="space-y-4 text-xs">
              
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Question Text *
                </label>
                <textarea
                  value={editingQuestion.question}
                  onChange={(e) =>
                    setEditingQuestion({ ...editingQuestion, question: e.target.value })
                  }
                  required
                  rows={2}
                  placeholder="e.g. What is the primary purpose of cross-validation?"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Difficulty Level
                  </label>
                  <select
                    value={editingQuestion.difficulty || 'easy'}
                    onChange={(e) =>
                      setEditingQuestion({
                        ...editingQuestion,
                        difficulty: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  >
                    <option value="easy">Easy (Fundamentals & Terminology)</option>
                    <option value="medium">Medium (Workflows & Practical Usage)</option>
                    <option value="advanced">Advanced (Deep Architecture & Edge Cases)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Topic / Sub-Domain
                  </label>
                  <input
                    type="text"
                    value={editingQuestion.topic || ''}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, topic: e.target.value })
                    }
                    placeholder="e.g. Model Evaluation"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
              </div>

              {/* 4 Options */}
              <div className="space-y-2 pt-2">
                <label className="block font-semibold text-slate-300">
                  Options & Correct Answer Selection *
                </label>

                {editingQuestion.options.map((opt, idx) => {
                  const isCorrect = editingQuestion.correctAnswer === idx;
                  const letters = ['A', 'B', 'C', 'D'];
                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 p-2 rounded-xl border ${
                        isCorrect
                          ? 'bg-emerald-950/40 border-emerald-500/60'
                          : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setEditingQuestion({ ...editingQuestion, correctAnswer: idx })
                        }
                        className={`w-7 h-7 rounded-lg font-mono font-bold text-xs flex items-center justify-center shrink-0 ${
                          isCorrect
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                        title="Click to set as correct answer"
                      >
                        {letters[idx]}
                      </button>

                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...editingQuestion.options];
                          newOpts[idx] = e.target.value;
                          setEditingQuestion({ ...editingQuestion, options: newOpts });
                        }}
                        required
                        placeholder={`Option ${letters[idx]} text...`}
                        className="flex-1 bg-transparent text-white text-xs focus:outline-none"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setEditingQuestion({ ...editingQuestion, correctAnswer: idx })
                        }
                        className={`text-[10px] font-bold px-2 py-1 rounded ${
                          isCorrect
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {isCorrect ? 'Correct Answer' : 'Set as Correct'}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Explanation */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Educational Explanation (Shown to students after completing quiz)
                </label>
                <textarea
                  value={editingQuestion.explanation || ''}
                  onChange={(e) =>
                    setEditingQuestion({
                      ...editingQuestion,
                      explanation: e.target.value,
                    })
                  }
                  rows={2}
                  placeholder="Explain why the selected option is correct and provide learning context..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setQuestionModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl shadow"
                >
                  Save MCQ
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: Bulk Import JSON */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-amber-400" /> Bulk Import JSON Questions
              </h3>
              <button
                onClick={() => setImportModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Paste JSON containing an array of 50 questions with fields: <code className="text-amber-300">question</code>, <code className="text-amber-300">options</code> (4 items), <code className="text-amber-300">correctAnswer</code> (0-3), and <code className="text-amber-300">explanation</code>.
            </p>

            <textarea
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              rows={10}
              placeholder={`[
  {
    "question": "What is Python mainly used for?",
    "options": ["Data analysis", "Web development", "Automation", "All of the above"],
    "correctAnswer": 3,
    "explanation": "Python is widely used across data science, web engineering, and scripting."
  }
]`}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-500"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setImportModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleImportJson}
                disabled={!importJsonText.trim()}
                className="px-5 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs disabled:opacity-50"
              >
                Import Questions
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
