import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  query,
  where,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { db } from '../lib/firebase';
import {
  StudentRecord,
  StudentSummaryRecord,
  UserProfile,
  Course,
  Enrollment,
  LessonProgress,
  QuizAttempt,
  Certificate,
} from '../types';
import { getAllCourses, getCourseFullDetail } from './courseService';
import { getStudentCertificates } from './certificateService';

const USERS_COL = 'users';
const ENROLLMENTS_COL = 'enrollments';
const PROGRESS_COL = 'progress';
const QUIZ_ATTEMPTS_COL = 'quizAttempts';
const CERTIFICATES_COL = 'certificates';
const STUDENT_RECORDS_COL = 'student_records';

/**
 * Format ISO timestamp to readable date/time
 */
export const formatReportDate = (isoStr?: string): string => {
  if (!isoStr) return '—';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return isoStr;
  }
};

/**
 * Format simple date (e.g. March 1, 2026)
 */
export const formatSimpleDate = (isoStr?: string): string => {
  if (!isoStr) return '—';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d);
  } catch {
    return isoStr;
  }
};

/**
 * Sync a single student's course record in Firestore
 */
export const syncStudentRecord = async (
  studentUid: string,
  courseId: string
): Promise<StudentRecord | null> => {
  try {
    // 1. Fetch Student User Profile
    const userDoc = await getDoc(doc(db, USERS_COL, studentUid));
    let userProfile: UserProfile | null = userDoc.exists() ? (userDoc.data() as UserProfile) : null;

    if (!userProfile) {
      userProfile = {
        uid: studentUid,
        studentId: `ASH-STU-${studentUid.slice(0, 5).toUpperCase()}`,
        name: 'Student',
        email: 'student@atifskillshub.org',
        role: 'student',
        status: 'active',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };
    }

    // 2. Fetch Course Details
    const { course, lessons, quiz } = await getCourseFullDetail(courseId);
    const courseName = course ? course.title.replace(/^\d+\.\s*/, '') : courseId;
    const requiredLessons = lessons.filter((l) => l.required);
    const totalLessons = requiredLessons.length || lessons.length || 1;

    // 3. Fetch Enrollment
    const enrollmentSnap = await getDoc(doc(db, ENROLLMENTS_COL, `${studentUid}_${courseId}`));
    const enrollment: Enrollment | null = enrollmentSnap.exists()
      ? (enrollmentSnap.data() as Enrollment)
      : null;

    const enrollmentDate = enrollment ? formatReportDate(enrollment.enrolledAt) : formatReportDate(new Date().toISOString());

    // 4. Fetch Progress
    const progQuery = query(
      collection(db, PROGRESS_COL),
      where('studentId', '==', studentUid),
      where('courseId', '==', courseId),
      where('completed', '==', true)
    );
    const progSnap = await getDocs(progQuery);
    const completedLessons = progSnap.size;
    const courseProgressPercentage = Math.min(100, Math.round((completedLessons / totalLessons) * 100));

    // 5. Fetch Quiz Attempts
    const quizQuery = query(
      collection(db, QUIZ_ATTEMPTS_COL),
      where('studentId', '==', studentUid),
      where('courseId', '==', courseId)
    );
    const quizSnap = await getDocs(quizQuery);
    const quizAttempts = quizSnap.docs.map((d) => d.data() as QuizAttempt);

    let quizScore = '—';
    let quizPercentage = 0;
    let quizResult: 'NOT_ATTEMPTED' | 'PASSED' | 'FAILED' = 'NOT_ATTEMPTED';

    if (quizAttempts.length > 0) {
      // Find best attempt
      const bestAttempt = quizAttempts.reduce((prev, curr) => (curr.score > prev.score ? curr : prev));
      quizScore = `${bestAttempt.correctAnswers || 0} / ${bestAttempt.totalQuestions || 50}`;
      quizPercentage = bestAttempt.score;
      quizResult = bestAttempt.passed || bestAttempt.score >= (course?.passingPercentage || 80) ? 'PASSED' : 'FAILED';
    }

    // 6. Fetch Certificate
    const certQuery = query(
      collection(db, CERTIFICATES_COL),
      where('studentId', '==', studentUid),
      where('courseId', '==', courseId)
    );
    const certSnap = await getDocs(certQuery);
    const certificate: Certificate | null = certSnap.docs.length > 0 ? (certSnap.docs[0].data() as Certificate) : null;

    let certificateStatus: 'LOCKED' | 'ELIGIBLE' | 'ISSUED' = 'LOCKED';
    let certificateId = '—';
    let certificatePercentage = 0;
    let certificateIssueDate = '—';

    if (certificate && certificate.status === 'VALID') {
      certificateStatus = 'ISSUED';
      certificateId = certificate.certificateId;
      certificatePercentage = certificate.score || quizPercentage || 100;
      certificateIssueDate = certificate.completionDate;
    } else if (courseProgressPercentage === 100 && (quiz ? quizResult === 'PASSED' : true)) {
      certificateStatus = 'ELIGIBLE';
      certificatePercentage = quizPercentage || 100;
    }

    // 7. Course Status
    let courseStatus: 'Not Enrolled' | 'Enrolled' | 'In Progress' | 'Completed' = 'Enrolled';
    if (certificateStatus === 'ISSUED' || (courseProgressPercentage === 100 && (quiz ? quizResult === 'PASSED' : true))) {
      courseStatus = 'Completed';
    } else if (courseProgressPercentage > 0 || quizAttempts.length > 0) {
      courseStatus = 'In Progress';
    }

    // 8. Compute Last Activity
    const activityDates: number[] = [
      new Date(userProfile.lastLogin || userProfile.createdAt || 0).getTime(),
    ];
    if (enrollment) activityDates.push(new Date(enrollment.enrolledAt).getTime());
    progSnap.docs.forEach((d) => {
      const p = d.data() as LessonProgress;
      if (p.completedAt) activityDates.push(new Date(p.completedAt).getTime());
    });
    quizAttempts.forEach((a) => {
      if (a.attemptedAt) activityDates.push(new Date(a.attemptedAt).getTime());
    });
    if (certificate) activityDates.push(new Date(certificate.createdAt).getTime());

    const maxActivity = Math.max(...activityDates.filter((n) => !isNaN(n) && n > 0));
    const lastActivity = maxActivity > 0 ? formatReportDate(new Date(maxActivity).toISOString()) : formatReportDate(userProfile.lastLogin);

    const record: StudentRecord = {
      id: `${userProfile.studentId}_${courseId}`,
      studentUid,
      studentId: userProfile.studentId || `ASH-STU-${studentUid.slice(0, 5).toUpperCase()}`,
      studentName: userProfile.name || 'Student',
      email: userProfile.email || '',
      registrationDate: formatSimpleDate(userProfile.createdAt),
      courseId,
      courseName,
      enrollmentDate,
      courseStatus,
      courseProgressPercentage,
      totalLessons,
      completedLessons,
      quizScore,
      quizPercentage,
      quizResult,
      quizAttemptsCount: quizAttempts.length,
      certificateStatus,
      certificateId,
      certificatePercentage,
      certificateIssueDate,
      lastActivity,
      updatedAt: new Date().toISOString(),
    };

    // Save record to Firestore collection student_records
    await setDoc(doc(db, STUDENT_RECORDS_COL, record.id), record, { merge: true });
    return record;
  } catch (err) {
    console.error('Error syncing student record:', err);
    return null;
  }
};

/**
 * Record student registration in student_records
 */
export const recordStudentRegistration = async (profile: UserProfile): Promise<void> => {
  try {
    const regRecord: StudentRecord = {
      id: `${profile.studentId}_registered`,
      studentUid: profile.uid,
      studentId: profile.studentId,
      studentName: profile.name,
      email: profile.email,
      registrationDate: formatSimpleDate(profile.createdAt),
      courseId: '—',
      courseName: 'Registered (No Course Enrolled Yet)',
      enrollmentDate: '—',
      courseStatus: 'Not Enrolled',
      courseProgressPercentage: 0,
      totalLessons: 0,
      completedLessons: 0,
      quizScore: '—',
      quizPercentage: 0,
      quizResult: 'NOT_ATTEMPTED',
      certificateStatus: 'LOCKED',
      certificateId: '—',
      certificatePercentage: 0,
      certificateIssueDate: '—',
      lastActivity: formatReportDate(profile.lastLogin || profile.createdAt),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, STUDENT_RECORDS_COL, regRecord.id), regRecord, { merge: true });
  } catch (err) {
    console.warn('Could not save registration record:', err);
  }
};

/**
 * Fetch all student records live from Firestore with dynamic fallback & aggregation
 */
export const getAllStudentRecords = async (): Promise<{
  records: StudentRecord[];
  summaries: StudentSummaryRecord[];
}> => {
  try {
    // 1. Fetch all students
    const usersSnap = await getDocs(collection(db, USERS_COL));
    const allUsers = usersSnap.docs
      .map((d) => d.data() as UserProfile)
      .filter((u) => u.role !== 'admin');

    // 2. Fetch all enrollments
    const enrollmentsSnap = await getDocs(collection(db, ENROLLMENTS_COL));
    const allEnrollments = enrollmentsSnap.docs.map((d) => d.data() as Enrollment);

    // 3. Fetch all progress
    const progressSnap = await getDocs(collection(db, PROGRESS_COL));
    const allProgress = progressSnap.docs
      .map((d) => d.data() as LessonProgress)
      .filter((p) => p.completed);

    // 4. Fetch all quiz attempts
    const quizSnap = await getDocs(collection(db, QUIZ_ATTEMPTS_COL));
    const allQuizAttempts = quizSnap.docs.map((d) => d.data() as QuizAttempt);

    // 5. Fetch all certificates
    const certsSnap = await getDocs(collection(db, CERTIFICATES_COL));
    const allCerts = certsSnap.docs.map((d) => d.data() as Certificate);

    // 6. Fetch courses
    const allCourses = await getAllCourses(true);
    const courseMap = new Map<string, Course>(allCourses.map((c) => [c.id, c]));

    // Maps for fast aggregation
    const userMap = new Map<string, UserProfile>(allUsers.map((u) => [u.uid, u]));
    const certsByKey = new Map<string, Certificate>();
    allCerts.forEach((c) => {
      if (c.status === 'VALID') {
        certsByKey.set(`${c.studentId}_${c.courseId}`, c);
      }
    });

    const enrollmentsByStudent = new Map<string, Enrollment[]>();
    allEnrollments.forEach((e) => {
      const list = enrollmentsByStudent.get(e.studentId) || [];
      list.push(e);
      enrollmentsByStudent.set(e.studentId, list);
    });

    const progressByStudentCourse = new Map<string, LessonProgress[]>();
    allProgress.forEach((p) => {
      const key = `${p.studentId}_${p.courseId}`;
      const list = progressByStudentCourse.get(key) || [];
      list.push(p);
      progressByStudentCourse.set(key, list);
    });

    const quizByStudentCourse = new Map<string, QuizAttempt[]>();
    allQuizAttempts.forEach((q) => {
      const key = `${q.studentId}_${q.courseId}`;
      const list = quizByStudentCourse.get(key) || [];
      list.push(q);
      quizByStudentCourse.set(key, list);
    });

    const studentRecords: StudentRecord[] = [];
    const summaryRecords: StudentSummaryRecord[] = [];

    for (const student of allUsers) {
      const studentId = student.studentId || `ASH-STU-${student.uid.slice(0, 5).toUpperCase()}`;
      const studentEnrollments = enrollmentsByStudent.get(student.uid) || [];
      const studentCourses: StudentRecord[] = [];

      if (studentEnrollments.length === 0) {
        // Registered student with no course enrollments yet
        const regRecord: StudentRecord = {
          id: `${studentId}_registered`,
          studentUid: student.uid,
          studentId,
          studentName: student.name || 'Student',
          email: student.email || '',
          registrationDate: formatSimpleDate(student.createdAt),
          courseId: '—',
          courseName: 'No Course Enrolled Yet',
          enrollmentDate: '—',
          courseStatus: 'Not Enrolled',
          courseProgressPercentage: 0,
          totalLessons: 0,
          completedLessons: 0,
          quizScore: '—',
          quizPercentage: 0,
          quizResult: 'NOT_ATTEMPTED',
          quizAttemptsCount: 0,
          certificateStatus: 'LOCKED',
          certificateId: '—',
          certificatePercentage: 0,
          certificateIssueDate: '—',
          lastActivity: formatReportDate(student.lastLogin || student.createdAt),
          updatedAt: new Date().toISOString(),
        };
        studentRecords.push(regRecord);
        studentCourses.push(regRecord);
      } else {
        // Loop each enrolled course
        for (const enr of studentEnrollments) {
          const course = courseMap.get(enr.courseId);
          const courseName = course ? course.title.replace(/^\d+\.\s*/, '') : enr.courseId;
          const passingPct = course?.passingPercentage || 80;

          const progList = progressByStudentCourse.get(`${student.uid}_${enr.courseId}`) || [];
          const completedLessons = progList.length;
          // Approximate total lessons or default 10 lessons
          const totalLessons = 10;
          const courseProgressPercentage = Math.min(100, Math.round((completedLessons / totalLessons) * 100));

          const quizAttempts = quizByStudentCourse.get(`${student.uid}_${enr.courseId}`) || [];
          let quizScore = '—';
          let quizPercentage = 0;
          let quizResult: 'NOT_ATTEMPTED' | 'PASSED' | 'FAILED' = 'NOT_ATTEMPTED';

          if (quizAttempts.length > 0) {
            const best = quizAttempts.reduce((a, b) => (b.score > a.score ? b : a));
            quizScore = `${best.correctAnswers || Math.round((best.score / 100) * 50)} / ${best.totalQuestions || 50}`;
            quizPercentage = best.score;
            quizResult = best.passed || best.score >= passingPct ? 'PASSED' : 'FAILED';
          }

          const cert = certsByKey.get(`${student.uid}_${enr.courseId}`);
          let certificateStatus: 'LOCKED' | 'ELIGIBLE' | 'ISSUED' = 'LOCKED';
          let certificateId = '—';
          let certificatePercentage = 0;
          let certificateIssueDate = '—';

          if (cert && cert.status === 'VALID') {
            certificateStatus = 'ISSUED';
            certificateId = cert.certificateId;
            certificatePercentage = cert.score || quizPercentage || 100;
            certificateIssueDate = cert.completionDate;
          } else if (courseProgressPercentage === 100 && quizResult === 'PASSED') {
            certificateStatus = 'ELIGIBLE';
            certificatePercentage = quizPercentage || 100;
          }

          let courseStatus: 'Not Enrolled' | 'Enrolled' | 'In Progress' | 'Completed' = 'Enrolled';
          if (certificateStatus === 'ISSUED' || (courseProgressPercentage === 100 && quizResult === 'PASSED')) {
            courseStatus = 'Completed';
          } else if (courseProgressPercentage > 0 || quizAttempts.length > 0) {
            courseStatus = 'In Progress';
          }

          // Last activity
          const dates = [
            new Date(student.lastLogin || 0).getTime(),
            new Date(enr.enrolledAt || 0).getTime(),
          ];
          progList.forEach((p) => {
            if (p.completedAt) dates.push(new Date(p.completedAt).getTime());
          });
          quizAttempts.forEach((a) => {
            if (a.attemptedAt) dates.push(new Date(a.attemptedAt).getTime());
          });
          if (cert) dates.push(new Date(cert.createdAt).getTime());

          const maxAct = Math.max(...dates.filter((n) => !isNaN(n) && n > 0));
          const lastActivity = maxAct > 0 ? formatReportDate(new Date(maxAct).toISOString()) : formatReportDate(student.lastLogin);

          const cRecord: StudentRecord = {
            id: `${studentId}_${enr.courseId}`,
            studentUid: student.uid,
            studentId,
            studentName: student.name || 'Student',
            email: student.email || '',
            registrationDate: formatSimpleDate(student.createdAt),
            courseId: enr.courseId,
            courseName,
            enrollmentDate: formatReportDate(enr.enrolledAt),
            courseStatus,
            courseProgressPercentage,
            totalLessons,
            completedLessons,
            quizScore,
            quizPercentage,
            quizResult,
            quizAttemptsCount: quizAttempts.length,
            certificateStatus,
            certificateId,
            certificatePercentage,
            certificateIssueDate,
            lastActivity,
            updatedAt: new Date().toISOString(),
          };

          studentRecords.push(cRecord);
          studentCourses.push(cRecord);
        }
      }

      // Compute student summary record
      const enrolledCount = studentEnrollments.length;
      const completedCount = studentCourses.filter((c) => c.courseStatus === 'Completed').length;
      const certsCount = studentCourses.filter((c) => c.certificateStatus === 'ISSUED').length;
      const avgProgress = enrolledCount > 0
        ? Math.round(studentCourses.reduce((sum, c) => sum + c.courseProgressPercentage, 0) / enrolledCount)
        : 0;
      const attemptedQuizCourses = studentCourses.filter((c) => c.quizResult !== 'NOT_ATTEMPTED');
      const avgQuiz = attemptedQuizCourses.length > 0
        ? Math.round(attemptedQuizCourses.reduce((sum, c) => sum + c.quizPercentage, 0) / attemptedQuizCourses.length)
        : 0;

      summaryRecords.push({
        studentUid: student.uid,
        studentId,
        name: student.name || 'Student',
        email: student.email || '',
        phone: student.phone || '—',
        country: student.country || 'Global',
        registrationDate: formatSimpleDate(student.createdAt),
        status: student.status || 'active',
        totalCoursesEnrolled: enrolledCount,
        totalCoursesCompleted: completedCount,
        totalCertificatesIssued: certsCount,
        averageProgressPercentage: avgProgress,
        averageQuizPercentage: avgQuiz,
        lastActivity: formatReportDate(student.lastLogin || student.createdAt),
        courses: studentCourses,
      });
    }

    return { records: studentRecords, summaries: summaryRecords };
  } catch (err) {
    console.error('Error fetching all student records:', err);
    return { records: [], summaries: [] };
  }
};

/**
 * Real-time listener for student records
 */
export const subscribeToStudentRecords = (
  callback: (data: { records: StudentRecord[]; summaries: StudentSummaryRecord[] }) => void
) => {
  return onSnapshot(
    collection(db, USERS_COL),
    async () => {
      try {
        const data = await getAllStudentRecords();
        callback(data);
      } catch (err) {
        console.warn('Notice in student records listener callback:', err);
      }
    },
    (err) => {
      console.warn('Subscription notice for student records:', err);
    }
  );
};

/**
 * Generate and download professional Excel database (.xlsx) using SheetJS
 */
export const exportStudentRecordsToExcel = (
  records: StudentRecord[],
  summaries: StudentSummaryRecord[]
): void => {
  const wb = XLSX.utils.book_new();

  // 1. SHEET 1: All Student Records (Detailed Course-Level Records)
  const detailedData = records.map((r, idx) => ({
    'Sr No': idx + 1,
    'Student ID': r.studentId,
    'Student Name': r.studentName,
    'Email': r.email,
    'Registration Date': r.registrationDate,
    'Course ID': r.courseId,
    'Course Name': r.courseName,
    'Enrollment Date': r.enrollmentDate,
    'Course Progress %': `${r.courseProgressPercentage}%`,
    'Total Lessons': r.totalLessons,
    'Completed Lessons': r.completedLessons,
    'Final Quiz Score': r.quizScore,
    'Final Quiz %': r.quizPercentage > 0 ? `${r.quizPercentage}%` : '—',
    'Quiz Result': r.quizResult,
    'Certificate Status': r.certificateStatus,
    'Certificate ID': r.certificateId,
    'Certificate %': r.certificatePercentage > 0 ? `${r.certificatePercentage}%` : '—',
    'Certificate Issue Date': r.certificateIssueDate,
    'Last Activity': r.lastActivity,
  }));

  const wsDetails = XLSX.utils.json_to_sheet(detailedData);
  wsDetails['!cols'] = [
    { wch: 8 },  // Sr No
    { wch: 16 }, // Student ID
    { wch: 24 }, // Student Name
    { wch: 28 }, // Email
    { wch: 18 }, // Registration Date
    { wch: 18 }, // Course ID
    { wch: 36 }, // Course Name
    { wch: 22 }, // Enrollment Date
    { wch: 18 }, // Course Progress %
    { wch: 14 }, // Total Lessons
    { wch: 16 }, // Completed Lessons
    { wch: 18 }, // Final Quiz Score
    { wch: 16 }, // Final Quiz %
    { wch: 16 }, // Quiz Result
    { wch: 18 }, // Certificate Status
    { wch: 20 }, // Certificate ID
    { wch: 16 }, // Certificate %
    { wch: 22 }, // Certificate Issue Date
    { wch: 22 }, // Last Activity
  ];

  XLSX.utils.book_append_sheet(wb, wsDetails, 'All Student Records');

  // 2. SHEET 2: Student Summary (1 Row per Student)
  const summaryData = summaries.map((s, idx) => ({
    'Sr No': idx + 1,
    'Student ID': s.studentId,
    'Student Name': s.name,
    'Email': s.email,
    'Phone': s.phone || '—',
    'Country': s.country || 'Global',
    'Registration Date': s.registrationDate,
    'Account Status': s.status.toUpperCase(),
    'Enrolled Courses': s.totalCoursesEnrolled,
    'Completed Courses': s.totalCoursesCompleted,
    'Certificates Earned': s.totalCertificatesIssued,
    'Average Progress %': `${s.averageProgressPercentage}%`,
    'Average Quiz Score %': s.averageQuizPercentage > 0 ? `${s.averageQuizPercentage}%` : '—',
    'Last Activity': s.lastActivity,
  }));

  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  wsSummary['!cols'] = [
    { wch: 8 },
    { wch: 16 },
    { wch: 24 },
    { wch: 28 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 16 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
    { wch: 22 },
  ];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Student Profiles Summary');

  // 3. SHEET 3: Meta & Generation Info
  const auditData = [
    { Property: 'Report Title', Value: 'ATIF SKILLS HUB - AUTOMATIC STUDENT DATABASE' },
    { Property: 'Generated On', Value: new Date().toLocaleString() },
    { Property: 'Platform Owner', Value: 'Atif Hussain (Founder, Atif Skills Hub)' },
    { Property: 'Academic Partner', Value: 'Mathematics & Seeker Academy' },
    { Property: 'Total Registered Students', Value: summaries.length },
    { Property: 'Total Course Enrollments', Value: records.filter((r) => r.courseId !== '—').length },
    { Property: 'Total Completed Courses', Value: records.filter((r) => r.courseStatus === 'Completed').length },
    { Property: 'Total Valid Certificates Issued', Value: records.filter((r) => r.certificateStatus === 'ISSUED').length },
    { Property: 'System Integrity', Value: 'Live Firestore Real-Time Synchronized' },
  ];
  const wsAudit = XLSX.utils.json_to_sheet(auditData);
  wsAudit['!cols'] = [{ wch: 30 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, wsAudit, 'System Audit Info');

  // Download the Excel file
  XLSX.writeFile(wb, 'Atif-Skills-Hub-Student-Records.xlsx');
};
