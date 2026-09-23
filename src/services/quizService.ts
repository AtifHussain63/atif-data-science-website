import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Quiz, QuizQuestion, QuizAttempt } from '../types';
import { generateCourse50Questions } from '../data/quizQuestionsBank';
import { INITIAL_COURSES } from '../data/coursesData';

const QUIZZES_COL = 'quizzes';
const QUIZ_ATTEMPTS_COL = 'quizAttempts';

/**
 * Gets or initializes the 50-MCQ quiz for a given course
 */
export const getCourseQuiz = async (courseId: string): Promise<Quiz> => {
  const course = INITIAL_COURSES.find((c) => c.id === courseId);
  const courseTitle = course ? course.title : courseId;
  const cleanTitle = courseTitle.replace(/^\d+\.\s*/, '');

  try {
    const qSnap = await getDocs(
      query(collection(db, QUIZZES_COL), where('courseId', '==', courseId))
    );

    if (qSnap.docs.length > 0) {
      const savedQuiz = qSnap.docs[0].data() as Quiz;
      // If quiz has 50 questions, return it
      if (savedQuiz.questions && savedQuiz.questions.length >= 50) {
        return savedQuiz;
      }
    }
  } catch (err) {
    console.warn('Notice reading quiz from Firestore, falling back to 50-MCQ generator:', err);
  }

  // Generate the full 50 MCQs
  const questions = generateCourse50Questions(courseId, courseTitle);
  const defaultQuiz: Quiz = {
    id: `${courseId}-quiz-50`,
    courseId,
    title: `Final Certification Assessment: ${cleanTitle}`,
    passingPercentage: 80,
    timeLimitMinutes: 45,
    totalQuestions: 50,
    questions,
  };

  // Try background save if authenticated
  try {
    setDoc(doc(db, QUIZZES_COL, defaultQuiz.id), defaultQuiz).catch(() => {});
  } catch {}

  return defaultQuiz;
};

/**
 * Save / Update full quiz
 */
export const saveCourseQuiz = async (quiz: Quiz): Promise<void> => {
  const quizToSave: Quiz = {
    ...quiz,
    totalQuestions: quiz.questions.length,
    passingPercentage: quiz.passingPercentage || 80,
  };
  await setDoc(doc(db, QUIZZES_COL, quiz.id), quizToSave);
};

/**
 * Reset course questions to the curated 50-question blueprint
 */
export const resetCourseQuizToDefault = async (courseId: string, courseTitle: string): Promise<Quiz> => {
  const cleanTitle = courseTitle.replace(/^\d+\.\s*/, '');
  const questions = generateCourse50Questions(courseId, courseTitle);
  const defaultQuiz: Quiz = {
    id: `${courseId}-quiz-50`,
    courseId,
    title: `Final Certification Assessment: ${cleanTitle}`,
    passingPercentage: 80,
    timeLimitMinutes: 45,
    totalQuestions: 50,
    questions,
  };

  await setDoc(doc(db, QUIZZES_COL, defaultQuiz.id), defaultQuiz);
  return defaultQuiz;
};

/**
 * Shuffle questions and options for a student attempt
 */
export const randomizeQuizForStudent = (quiz: Quiz): Quiz => {
  const shuffledQuestions = [...quiz.questions].map((q) => {
    // Pair options with original index
    const paired = q.options.map((opt, idx) => ({ opt, isCorrect: idx === q.correctAnswer }));
    
    // Fisher-Yates shuffle
    for (let i = paired.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [paired[i], paired[j]] = [paired[j], paired[i]];
    }

    const newOptions = paired.map((p) => p.opt);
    const newCorrect = paired.findIndex((p) => p.isCorrect);

    return {
      ...q,
      options: newOptions,
      correctAnswer: newCorrect >= 0 ? newCorrect : 0,
    };
  });

  return {
    ...quiz,
    questions: shuffledQuestions,
  };
};

/**
 * Calculate Quiz Score
 */
export const calculateQuizScore = (
  questions: QuizQuestion[],
  answers: Record<string, number>,
  passingPercentage = 80
): {
  score: number;
  passed: boolean;
  correctCount: number;
  totalCount: number;
  results: Array<{
    questionId: string;
    questionNumber: number;
    question: string;
    selectedAnswer: number;
    correctAnswer: number;
    isCorrect: boolean;
    explanation?: string;
  }>;
} => {
  let correctCount = 0;
  const results = questions.map((q, idx) => {
    const selected = answers[q.id];
    const isCorrect = selected !== undefined && selected === q.correctAnswer;
    if (isCorrect) correctCount++;

    return {
      questionId: q.id,
      questionNumber: q.questionNumber || idx + 1,
      question: q.question,
      selectedAnswer: selected ?? -1,
      correctAnswer: q.correctAnswer,
      isCorrect,
      explanation: q.explanation,
    };
  });

  const totalCount = questions.length || 50;
  const score = Math.round((correctCount / totalCount) * 100);
  const passed = score >= passingPercentage;

  return {
    score,
    passed,
    correctCount,
    totalCount,
    results,
  };
};

/**
 * Fetch Course Quiz Performance Statistics for Admin
 */
export interface CourseQuizAnalytics {
  courseId: string;
  courseTitle: string;
  totalAttempts: number;
  passedAttempts: number;
  passRate: number;
  averageScore: number;
  highestScore: number;
}

export const getCourseQuizAnalytics = async (courseId: string): Promise<CourseQuizAnalytics> => {
  try {
    const q = query(collection(db, QUIZ_ATTEMPTS_COL), where('courseId', '==', courseId));
    const snap = await getDocs(q);
    const attempts = snap.docs.map((d) => d.data() as QuizAttempt);

    if (attempts.length === 0) {
      return {
        courseId,
        courseTitle: courseId,
        totalAttempts: 0,
        passedAttempts: 0,
        passRate: 0,
        averageScore: 0,
        highestScore: 0,
      };
    }

    const totalAttempts = attempts.length;
    const passedAttempts = attempts.filter((a) => a.passed || a.score >= 80).length;
    const passRate = Math.round((passedAttempts / totalAttempts) * 100);
    const totalScore = attempts.reduce((sum, a) => sum + a.score, 0);
    const averageScore = Math.round(totalScore / totalAttempts);
    const highestScore = attempts.reduce((max, a) => Math.max(max, a.score), 0);

    return {
      courseId,
      courseTitle: courseId,
      totalAttempts,
      passedAttempts,
      passRate,
      averageScore,
      highestScore,
    };
  } catch (err) {
    console.error('Error fetching quiz analytics:', err);
    return {
      courseId,
      courseTitle: courseId,
      totalAttempts: 0,
      passedAttempts: 0,
      passRate: 0,
      averageScore: 0,
      highestScore: 0,
    };
  }
};
