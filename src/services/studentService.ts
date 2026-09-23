import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, DashboardStats, Enrollment, Certificate, QuizAttempt, LessonProgress } from '../types';
import { getAllCourses, getCourseFullDetail } from './courseService';
import { getStudentCertificates } from './certificateService';

const USERS_COL = 'users';
const ENROLLMENTS_COL = 'enrollments';
const PROGRESS_COL = 'progress';
const QUIZ_ATTEMPTS_COL = 'quizAttempts';
const CERTIFICATES_COL = 'certificates';

/**
 * Fetch all registered students (Role = 'student' or all users)
 */
export const getAllStudents = async (): Promise<UserProfile[]> => {
  try {
    const snap = await getDocs(collection(db, USERS_COL));
    return snap.docs
      .map((d) => d.data() as UserProfile)
      .filter((u) => u.role !== 'admin');
  } catch (err) {
    console.error('Error fetching students:', err);
    return [];
  }
};

/**
 * Toggle student status between active and suspended
 */
export const toggleStudentStatus = async (
  studentId: string,
  newStatus: 'active' | 'suspended'
): Promise<void> => {
  await updateDoc(doc(db, USERS_COL, studentId), { status: newStatus });
};

/**
 * Reset student progress for a course
 */
export const resetStudentProgress = async (studentId: string, courseId: string): Promise<void> => {
  try {
    // Delete progress docs
    const progQuery = query(
      collection(db, PROGRESS_COL),
      where('studentId', '==', studentId),
      where('courseId', '==', courseId)
    );
    const progSnap = await getDocs(progQuery);
    for (const d of progSnap.docs) {
      await deleteDoc(d.ref);
    }

    // Delete quiz attempts
    const quizQuery = query(
      collection(db, QUIZ_ATTEMPTS_COL),
      where('studentId', '==', studentId),
      where('courseId', '==', courseId)
    );
    const quizSnap = await getDocs(quizQuery);
    for (const d of quizSnap.docs) {
      await deleteDoc(d.ref);
    }
  } catch (err) {
    console.error('Error resetting student progress:', err);
  }
};

/**
 * Real-time listener for students collection
 */
export const subscribeToStudents = (callback: (students: UserProfile[]) => void) => {
  return onSnapshot(
    collection(db, USERS_COL),
    (snap) => {
      const students = snap.docs
        .map((d) => d.data() as UserProfile)
        .filter((u) => u.role !== 'admin');
      callback(students);
    },
    (err) => {
      console.warn('Subscription notice for students:', err);
    }
  );
};

/**
 * Fetch comprehensive dashboard metrics for Admin
 */
export const getAdminDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const [usersSnap, coursesSnap, enrollmentsSnap, certsSnap] = await Promise.all([
      getDocs(collection(db, USERS_COL)),
      getDocs(collection(db, 'courses')),
      getDocs(collection(db, ENROLLMENTS_COL)),
      getDocs(collection(db, CERTIFICATES_COL)),
    ]);

    const students = usersSnap.docs
      .map((d) => d.data() as UserProfile)
      .filter((u) => u.role !== 'admin');

    const activeStudents = students.filter((s) => s.status !== 'suspended').length;
    const enrollments = enrollmentsSnap.docs.map((d) => d.data() as Enrollment);
    const completedEnrollments = enrollments.filter((e) => e.status === 'completed').length;
    const certsCount = certsSnap.docs.filter((d) => (d.data() as Certificate).status === 'VALID').length;

    return {
      totalStudents: students.length,
      totalCourses: Math.max(coursesSnap.size, 46),
      totalEnrollments: enrollmentsSnap.size,
      activeStudents,
      completedCourses: completedEnrollments + certsCount,
      certificatesIssued: certsSnap.size,
    };
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    return {
      totalStudents: 0,
      totalCourses: 46,
      totalEnrollments: 0,
      activeStudents: 0,
      completedCourses: 0,
      certificatesIssued: 0,
    };
  }
};

export const getPlatformStats = async () => {
  const adminStats = await getAdminDashboardStats();
  return {
    totalStudents: adminStats.totalStudents,
    totalCourses: adminStats.totalCourses,
    totalCertificates: adminStats.certificatesIssued,
    totalEnrollments: adminStats.totalEnrollments,
  };
};

/**
 * Fetch detailed student report for Admin
 */
export interface StudentDetailReport {
  student: UserProfile;
  enrolledCourses: Array<{
    courseId: string;
    courseTitle: string;
    category: string;
    enrolledAt: string;
    progressPercentage: number;
    completedLessonsCount: number;
    totalLessonsCount: number;
    status: 'Not Started' | 'In Progress' | 'Completed';
    quizScore?: number;
    quizPassed: boolean;
  }>;
  certificates: Certificate[];
}

export const getStudentDetailReport = async (studentId: string): Promise<StudentDetailReport | null> => {
  try {
    const userDoc = await getDoc(doc(db, USERS_COL, studentId));
    if (!userDoc.exists()) return null;
    const student = userDoc.data() as UserProfile;

    const enrSnap = await getDocs(
      query(collection(db, ENROLLMENTS_COL), where('studentId', '==', studentId))
    );
    const enrollments = enrSnap.docs.map((d) => d.data() as Enrollment);

    const allCourses = await getAllCourses(true);
    const courseMap = new Map(allCourses.map((c) => [c.id, c]));

    const enrolledCoursesData = await Promise.all(
      enrollments.map(async (enr) => {
        const course = courseMap.get(enr.courseId);
        const courseTitle = course ? course.title : enr.courseId;
        const category = course ? course.category : 'General';

        const { lessons, quiz } = await getCourseFullDetail(enr.courseId);
        const requiredLessons = lessons.filter((l) => l.required);

        const progSnap = await getDocs(
          query(
            collection(db, PROGRESS_COL),
            where('studentId', '==', studentId),
            where('courseId', '==', enr.courseId),
            where('completed', '==', true)
          )
        );

        const completedCount = progSnap.size;
        const totalCount = requiredLessons.length || lessons.length || 1;
        const progressPercentage = Math.min(100, Math.round((completedCount / totalCount) * 100));

        const quizSnap = await getDocs(
          query(
            collection(db, QUIZ_ATTEMPTS_COL),
            where('studentId', '==', studentId),
            where('courseId', '==', enr.courseId)
          )
        );

        let bestScore: number | undefined;
        let quizPassed = false;
        if (quizSnap.docs.length > 0) {
          const attempts = quizSnap.docs.map((d) => d.data() as QuizAttempt);
          bestScore = attempts.reduce((max, a) => Math.max(max, a.score), 0);
          quizPassed = attempts.some((a) => a.passed);
        }

        let status: 'Not Started' | 'In Progress' | 'Completed' = 'Not Started';
        if (progressPercentage === 100 && (quiz ? quizPassed : true)) {
          status = 'Completed';
        } else if (progressPercentage > 0) {
          status = 'In Progress';
        }

        return {
          courseId: enr.courseId,
          courseTitle,
          category,
          enrolledAt: enr.enrolledAt,
          progressPercentage,
          completedLessonsCount: completedCount,
          totalLessonsCount: totalCount,
          status,
          quizScore: bestScore,
          quizPassed,
        };
      })
    );

    const certificates = await getStudentCertificates(studentId);

    return {
      student,
      enrolledCourses: enrolledCoursesData,
      certificates,
    };
  } catch (err) {
    console.error('Error fetching student detail report:', err);
    return null;
  }
};

/**
 * Suspend or Activate Student
 */
export const updateStudentStatus = async (
  studentId: string,
  status: 'active' | 'suspended'
): Promise<void> => {
  await updateDoc(doc(db, USERS_COL, studentId), { status });
};
