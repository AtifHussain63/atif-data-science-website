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
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Course, Module, Lesson, Quiz, Enrollment, LessonProgress, QuizAttempt } from '../types';
import { INITIAL_COURSES, generateDefaultCurriculum } from '../data/coursesData';
import { syncStudentRecord } from './studentRecordService';

const COURSES_COL = 'courses';
const MODULES_COL = 'modules';
const LESSONS_COL = 'lessons';
const QUIZZES_COL = 'quizzes';
const ENROLLMENTS_COL = 'enrollments';
const PROGRESS_COL = 'progress';
const QUIZ_ATTEMPTS_COL = 'quizAttempts';

/**
 * Initializes and seeds courses in Firestore if not already present
 */
export const seedInitialCourses = async (): Promise<void> => {
  try {
    if (!auth.currentUser) {
      // Writing to Firestore courses collection requires an authenticated session
      return;
    }

    const coursesSnap = await getDocs(collection(db, COURSES_COL));
    if (coursesSnap.size >= 46) {
      return; // Already fully seeded
    }

    const existingIds = new Set(coursesSnap.docs.map((d) => d.id));

    for (const course of INITIAL_COURSES) {
      if (!existingIds.has(course.id)) {
        await setDoc(doc(db, COURSES_COL, course.id), course);

        // Generate curriculum
        const { modules, lessons, quiz } = generateDefaultCurriculum(course.id, course.title);

        for (const mod of modules) {
          await setDoc(doc(db, MODULES_COL, mod.id), mod);
        }

        for (const les of lessons) {
          await setDoc(doc(db, LESSONS_COL, les.id), les);
        }

        await setDoc(doc(db, QUIZZES_COL, quiz.id), quiz);
      }
    }
  } catch (err: any) {
    if (err?.code === 'permission-denied' || err?.message?.includes('permission')) {
      // Permission denied when unauthenticated or during security rule evaluation
      return;
    }
    console.warn('Notice seeding courses to Firestore:', err);
  }
};

/**
 * Fetch all courses
 */
export const getAllCourses = async (includeUnpublished = false): Promise<Course[]> => {
  try {
    const snap = await getDocs(collection(db, COURSES_COL));
    let list = snap.docs.map((d) => d.data() as Course);

    if (list.length === 0) {
      // Return local courses immediately while async seeding if authenticated
      if (auth.currentUser) {
        seedInitialCourses().catch(() => {});
      }
      list = INITIAL_COURSES;
    }

    if (!includeUnpublished) {
      return list.filter((c) => c.published !== false);
    }
    return list;
  } catch (err) {
    console.warn('Error fetching courses from Firestore, returning local data:', err);
    return INITIAL_COURSES;
  }
};

/**
 * Fetch course details with modules, lessons, and final quiz
 */
export const getCourseFullDetail = async (
  courseId: string
): Promise<{
  course: Course | null;
  modules: Module[];
  lessons: Lesson[];
  quiz: Quiz | null;
}> => {
  try {
    // 1. Course doc
    const courseDoc = await getDoc(doc(db, COURSES_COL, courseId));
    let course: Course | null = courseDoc.exists() ? (courseDoc.data() as Course) : null;

    if (!course) {
      const fallback = INITIAL_COURSES.find((c) => c.id === courseId);
      if (fallback) course = fallback;
    }

    if (!course) return { course: null, modules: [], lessons: [], quiz: null };

    // 2. Modules
    const modQuery = query(collection(db, MODULES_COL), where('courseId', '==', courseId));
    const modSnap = await getDocs(modQuery);
    let modules = modSnap.docs.map((d) => d.data() as Module).sort((a, b) => a.order - b.order);

    // 3. Lessons
    const lesQuery = query(collection(db, LESSONS_COL), where('courseId', '==', courseId));
    const lesSnap = await getDocs(lesQuery);
    let lessons = lesSnap.docs.map((d) => d.data() as Lesson).sort((a, b) => a.order - b.order);

    // 4. Quiz
    const quizQuery = query(collection(db, QUIZZES_COL), where('courseId', '==', courseId));
    const quizSnap = await getDocs(quizQuery);
    let quiz = quizSnap.docs.length > 0 ? (quizSnap.docs[0].data() as Quiz) : null;

    // Fallback if curriculum was not seeded in Firestore yet
    if (modules.length === 0 || lessons.length === 0 || !quiz) {
      const def = generateDefaultCurriculum(course.id, course.title);
      if (modules.length === 0) modules = def.modules;
      if (lessons.length === 0) lessons = def.lessons;
      if (!quiz) quiz = def.quiz;
    }

    return { course, modules, lessons, quiz };
  } catch (err) {
    console.error('Error fetching course full detail:', err);
    const fallback = INITIAL_COURSES.find((c) => c.id === courseId);
    if (fallback) {
      const def = generateDefaultCurriculum(fallback.id, fallback.title);
      return { course: fallback, modules: def.modules, lessons: def.lessons, quiz: def.quiz };
    }
    return { course: null, modules: [], lessons: [], quiz: null };
  }
};

/**
 * Course CRUD
 */
export const saveCourse = async (course: Course): Promise<void> => {
  await setDoc(doc(db, COURSES_COL, course.id), course);
};

export const deleteCourse = async (courseId: string): Promise<void> => {
  await deleteDoc(doc(db, COURSES_COL, courseId));
};

export const saveModule = async (module: Module): Promise<void> => {
  await setDoc(doc(db, MODULES_COL, module.id), module);
};

export const deleteModule = async (moduleId: string): Promise<void> => {
  await deleteDoc(doc(db, MODULES_COL, moduleId));
};

export const saveLesson = async (lesson: Lesson): Promise<void> => {
  await setDoc(doc(db, LESSONS_COL, lesson.id), lesson);
};

export const deleteLesson = async (lessonId: string): Promise<void> => {
  await deleteDoc(doc(db, LESSONS_COL, lessonId));
};

export const saveQuiz = async (quiz: Quiz): Promise<void> => {
  await setDoc(doc(db, QUIZZES_COL, quiz.id), quiz);
};

/**
 * Student Enrollment
 */
export const enrollStudent = async (studentId: string, courseId: string): Promise<Enrollment> => {
  const enrollmentId = `${studentId}_${courseId}`;
  const enrollmentDoc = doc(db, ENROLLMENTS_COL, enrollmentId);
  const snap = await getDoc(enrollmentDoc);

  if (snap.exists()) {
    syncStudentRecord(studentId, courseId).catch((e) => console.warn('Could not sync student record on enroll check:', e));
    return snap.data() as Enrollment;
  }

  const enrollment: Enrollment = {
    id: enrollmentId,
    studentId,
    courseId,
    enrolledAt: new Date().toISOString(),
    status: 'active',
  };

  await setDoc(enrollmentDoc, enrollment);
  syncStudentRecord(studentId, courseId).catch((e) => console.warn('Could not sync student record on new enroll:', e));
  return enrollment;
};

export const getStudentEnrollments = async (studentId: string): Promise<Enrollment[]> => {
  try {
    const q = query(collection(db, ENROLLMENTS_COL), where('studentId', '==', studentId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Enrollment);
  } catch (err) {
    console.error('Error fetching student enrollments:', err);
    return [];
  }
};

/**
 * Lesson Progress
 */
export const markLessonComplete = async (
  studentId: string,
  courseId: string,
  lessonId: string,
  completed: boolean
): Promise<void> => {
  const progressId = `${studentId}_${lessonId}`;
  const progressRef = doc(db, PROGRESS_COL, progressId);

  const data: LessonProgress = {
    id: progressId,
    studentId,
    courseId,
    lessonId,
    completed,
    completedAt: new Date().toISOString(),
  };

  await setDoc(progressRef, data);
  syncStudentRecord(studentId, courseId).catch((e) => console.warn('Could not sync student record on lesson progress:', e));
};

export const getStudentCourseProgress = async (
  studentId: string,
  courseId: string
): Promise<LessonProgress[]> => {
  try {
    const q = query(
      collection(db, PROGRESS_COL),
      where('studentId', '==', studentId),
      where('courseId', '==', courseId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as LessonProgress);
  } catch (err) {
    console.error('Error fetching course progress:', err);
    return [];
  }
};

/**
 * Quiz Attempt
 */
export const saveQuizAttempt = async (attempt: QuizAttempt): Promise<void> => {
  const attemptRef = doc(db, QUIZ_ATTEMPTS_COL, attempt.id);
  await setDoc(attemptRef, attempt);
  syncStudentRecord(attempt.studentId, attempt.courseId).catch((e) => console.warn('Could not sync student record on quiz attempt:', e));
};

export const getStudentQuizAttempts = async (
  studentId: string,
  courseId: string
): Promise<QuizAttempt[]> => {
  try {
    const q = query(
      collection(db, QUIZ_ATTEMPTS_COL),
      where('studentId', '==', studentId),
      where('courseId', '==', courseId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as QuizAttempt);
  } catch (err) {
    console.error('Error fetching quiz attempts:', err);
    return [];
  }
};
