import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import QRCode from 'qrcode';
import { db } from '../lib/firebase';
import { Certificate, CertificateSettings, Course, PlatformSettings } from '../types';
import { getCourseFullDetail, getStudentCourseProgress, getStudentQuizAttempts } from './courseService';
import { getCollaborationSettings } from './collaborationService';
import { uploadFile } from './storageService';
import { getCertificateTemplateById, getDefaultCertificateTemplate } from './templateService';
import { syncStudentRecord } from './studentRecordService';

const CERTIFICATES_COL = 'certificates';
const SETTINGS_DOC = 'certificateSettings/global';

export const DEFAULT_CERTIFICATE_SETTINGS: CertificateSettings = {
  websiteName: 'ATIF SKILLS HUB',
  tagline: 'Learn Skills. Build Your Future. Get Certified.',
  certificateTitle: 'CERTIFICATE',
  certificateSubtitle: 'OF COMPLETION',
  certificatePrefix: 'ASH',
  authorizedName: 'ATIF HUSSAIN',
  signatoryTitle: 'Founder, Atif Skills Hub',
  description: 'In recognition of your dedication, hard work, and commitment to learning. Keep Learning, Keep Growing!',
  logoUrl: '',
  signatureUrl: '',
  collaborationLogoUrl: '',
  collaborationName: 'Atif Skills Hub Support & Mathematics Seeker Academy',
  collaborationEmail: 'dostdar.cui@gmail.com',
  collaborationEnabled: true,
  partnerAuthorizedName: 'MATHEMATICS & SEEKER ACADEMY',
  partnerSignatoryTitle: 'Research to explore',
  partnerSignatureUrl: '',
  borderStyle: 'executive-geometric',
  themeAccent: 'navy-gold',
  showCourseMeta: true,
  showHonorsSeal: true,
};

/**
 * Fetch or initialize global certificate settings
 */
export const getCertificateSettings = async (): Promise<CertificateSettings> => {
  try {
    const snap = await getDoc(doc(db, SETTINGS_DOC));
    if (snap.exists()) {
      return { ...DEFAULT_CERTIFICATE_SETTINGS, ...(snap.data() as CertificateSettings) };
    }
  } catch (err) {
    console.warn('Error fetching certificate settings from Firestore, returning defaults:', err);
  }
  return DEFAULT_CERTIFICATE_SETTINGS;
};

/**
 * Real-time subscription to certificate settings
 */
export const subscribeToCertificateSettings = (
  callback: (settings: CertificateSettings) => void
) => {
  return onSnapshot(
    doc(db, SETTINGS_DOC),
    (snap) => {
      if (snap.exists()) {
        callback({ ...DEFAULT_CERTIFICATE_SETTINGS, ...(snap.data() as CertificateSettings) });
      } else {
        callback(DEFAULT_CERTIFICATE_SETTINGS);
      }
    },
    (err) => {
      console.warn('Subscription error for certificate settings:', err);
      callback(DEFAULT_CERTIFICATE_SETTINGS);
    }
  );
};

/**
 * Save global certificate settings
 */
export const saveCertificateSettings = async (settings: Partial<CertificateSettings>): Promise<CertificateSettings> => {
  const current = await getCertificateSettings();
  const updated: CertificateSettings = {
    ...current,
    ...settings,
    updatedAt: new Date().toISOString(),
  };
  await setDoc(doc(db, SETTINGS_DOC), updated);
  return updated;
};

/**
 * Upload main website logo for certificates
 */
export const uploadWebsiteLogo = async (file: File): Promise<string> => {
  const url = await uploadFile(file, 'logos');
  await saveCertificateSettings({ logoUrl: url });
  return url;
};

/**
 * Upload authorized signature image for certificates
 */
export const uploadAuthorizedSignature = async (file: File): Promise<string> => {
  const url = await uploadFile(file, 'signatures');
  await saveCertificateSettings({ signatureUrl: url });
  return url;
};

/**
 * Upload partner signature image for certificates
 */
export const uploadPartnerSignature = async (file: File): Promise<string> => {
  const url = await uploadFile(file, 'signatures');
  await saveCertificateSettings({ partnerSignatureUrl: url });
  return url;
};

export const getPlatformSettings = async (): Promise<PlatformSettings> => {
  const s = await getCertificateSettings();
  return {
    platformName: s.websiteName || 'ATIF SKILLS HUB',
    authorizedSignatory: s.authorizedName || 'ATIF HUSSAIN',
    signatoryTitle: s.signatoryTitle || 'Founder, Atif Skills Hub',
    verificationDomain: 'atifskillshub.org',
    primaryColor: '#F59E0B',
  };
};

export const updatePlatformSettings = async (settings: PlatformSettings): Promise<void> => {
  await saveCertificateSettings({
    websiteName: settings.platformName,
    authorizedName: settings.authorizedSignatory,
    signatoryTitle: settings.signatoryTitle,
  });
};

/**
 * Generate unique Certificate ID (e.g. ASH-2026-00001)
 */
export const generateUniqueCertificateId = async (prefix = 'ASH'): Promise<string> => {
  const currentYear = new Date().getFullYear();
  try {
    const snap = await getDocs(collection(db, CERTIFICATES_COL));
    const nextSeq = snap.size + 1;
    const padded = String(nextSeq).padStart(5, '0');
    return `${prefix}-${currentYear}-${padded}`;
  } catch (err) {
    console.warn('Error computing sequence ID, using timestamp hash:', err);
    const rand = Math.floor(10000 + Math.random() * 90000);
    return `${prefix}-${currentYear}-${rand}`;
  }
};

/**
 * Generate real QR Code Data URL for public verification link
 */
export const generateVerificationQRCode = async (verificationUrl: string): Promise<string> => {
  try {
    return await QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 256,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    return '';
  }
};

/**
 * Check if a student is eligible to receive a certificate for a course
 */
export const checkCertificateEligibility = async (
  studentId: string,
  courseId: string
): Promise<{
  isEligible: boolean;
  progressPercentage: number;
  completedLessonsCount: number;
  totalRequiredLessons: number;
  quizPassed: boolean;
  bestQuizScore: number;
  passingPercentage: number;
  existingCertificate?: Certificate | null;
}> => {
  const certQuery = query(
    collection(db, CERTIFICATES_COL),
    where('studentId', '==', studentId),
    where('courseId', '==', courseId)
  );
  const certSnap = await getDocs(certQuery);
  const existingCert = certSnap.docs.length > 0 ? (certSnap.docs[0].data() as Certificate) : null;

  const { course, lessons, quiz } = await getCourseFullDetail(courseId);
  if (!course) {
    return {
      isEligible: false,
      progressPercentage: 0,
      completedLessonsCount: 0,
      totalRequiredLessons: 0,
      quizPassed: false,
      bestQuizScore: 0,
      passingPercentage: 80,
      existingCertificate: existingCert,
    };
  }

  const requiredLessons = lessons.filter((l) => l.required);
  const progressList = await getStudentCourseProgress(studentId, courseId);
  const completedIds = new Set(progressList.filter((p) => p.completed).map((p) => p.lessonId));

  const completedRequiredCount = requiredLessons.filter((l) => completedIds.has(l.id)).length;
  const progressPercentage =
    requiredLessons.length > 0
      ? Math.round((completedRequiredCount / requiredLessons.length) * 100)
      : 100;

  const quizAttempts = await getStudentQuizAttempts(studentId, courseId);
  const passingPct = course.passingPercentage || 80;
  const bestScore = quizAttempts.reduce((max, attempt) => Math.max(max, attempt.score), 0);
  const quizPassed = quizAttempts.some((attempt) => attempt.passed || attempt.score >= passingPct);

  const isEligible =
    completedRequiredCount >= requiredLessons.length &&
    (quiz ? quizPassed : true);

  return {
    isEligible,
    progressPercentage,
    completedLessonsCount: completedRequiredCount,
    totalRequiredLessons: requiredLessons.length,
    quizPassed: quiz ? quizPassed : true,
    bestQuizScore: bestScore,
    passingPercentage: passingPct,
    existingCertificate: existingCert,
  };
};

/**
 * Issues and saves certificate in Firestore with real data binding
 */
export const issueCertificate = async (
  studentId: string,
  studentName: string,
  studentEmail: string,
  course: Course,
  score?: number
): Promise<Certificate> => {
  const certQuery = query(
    collection(db, CERTIFICATES_COL),
    where('studentId', '==', studentId),
    where('courseId', '==', course.id)
  );
  const certSnap = await getDocs(certQuery);
  if (certSnap.docs.length > 0) {
    return certSnap.docs[0].data() as Certificate;
  }

  const settings = await getCertificateSettings();
  const collabSettings = await getCollaborationSettings();
  const certificateId = await generateUniqueCertificateId(settings.certificatePrefix || 'ASH');
  
  const appOrigin = window.location.origin;
  const verificationUrl = `${appOrigin}/#verify/${certificateId}`;

  const completionDate = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  const isCollabActive =
    settings.collaborationEnabled !== false &&
    collabSettings.enabled !== false;

  // Retrieve assigned certificate template for the course, or default template
  let assignedTemplate = null;
  try {
    if (course.certificateTemplateId) {
      assignedTemplate = await getCertificateTemplateById(course.certificateTemplateId);
    } else {
      assignedTemplate = await getDefaultCertificateTemplate();
    }
  } catch (tErr) {
    console.warn('Error fetching template for certificate issuance:', tErr);
  }

  const certificate: Certificate = {
    certificateId,
    studentId,
    studentName,
    studentEmail,
    courseId: course.id,
    courseName: course.title.replace(/^\d+\.\s*/, ''),
    courseCategory: course.category || 'Data Science & Technology',
    courseLevel: course.difficulty || 'All Levels',
    courseDuration: course.duration || '6 Weeks',
    completionDate,
    verificationUrl,
    status: 'VALID',
    createdAt: new Date().toISOString(),
    templateId: assignedTemplate?.id,
    templateImageUrl: assignedTemplate?.imageUrl,
    templateFields: assignedTemplate?.fields,
    logoUrl: settings.logoUrl || collabSettings.mainLogoUrl || '',
    signatureUrl: settings.signatureUrl || '',
    authorizedName: settings.authorizedName || 'ATIF HUSSAIN',
    signatoryTitle: settings.signatoryTitle || 'Founder, Atif Skills Hub',
    websiteName: settings.websiteName || 'ATIF SKILLS HUB',
    tagline: settings.tagline || 'Learn Skills. Build Your Future. Get Certified.',
    score: score || 100,
    collaborationEnabled: isCollabActive,
    collaborationName: isCollabActive
      ? (settings.collaborationName || collabSettings.partnerName || 'Atif Skills Hub Support & Mathematics Seeker Academy')
      : undefined,
    collaborationEmail: isCollabActive
      ? (settings.collaborationEmail || collabSettings.partnerEmail || 'dostdar.cui@gmail.com')
      : undefined,
    collaborationType: isCollabActive
      ? (collabSettings.collaborationType || 'Education & Learning Collaboration')
      : undefined,
    collaborationLogoUrl: isCollabActive
      ? (settings.collaborationLogoUrl || collabSettings.logoUrl || '')
      : undefined,
    partnerAuthorizedName: isCollabActive
      ? (settings.partnerAuthorizedName || 'MATHEMATICS & SEEKER ACADEMY')
      : undefined,
    partnerSignatoryTitle: isCollabActive
      ? (settings.partnerSignatoryTitle || 'Research to explore')
      : undefined,
    partnerSignatureUrl: isCollabActive ? settings.partnerSignatureUrl : undefined,
  };

  await setDoc(doc(db, CERTIFICATES_COL, certificateId), certificate);
  syncStudentRecord(studentId, course.id).catch((e) => console.warn('Could not sync student record on certificate issuance:', e));
  return certificate;
};

/**
 * Fetch certificate by ID (Public verification)
 */
export const getCertificateById = async (certificateId: string): Promise<Certificate | null> => {
  try {
    const snap = await getDoc(doc(db, CERTIFICATES_COL, certificateId.trim()));
    if (snap.exists()) {
      return snap.data() as Certificate;
    }
    return null;
  } catch (err) {
    console.error('Error fetching certificate by ID:', err);
    return null;
  }
};

/**
 * Fetch all certificates for a student
 */
export const getStudentCertificates = async (studentId: string): Promise<Certificate[]> => {
  try {
    const q = query(collection(db, CERTIFICATES_COL), where('studentId', '==', studentId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Certificate);
  } catch (err) {
    console.error('Error fetching student certificates:', err);
    return [];
  }
};

/**
 * Fetch all certificates (Admin)
 */
export const getAllCertificates = async (): Promise<Certificate[]> => {
  try {
    const snap = await getDocs(collection(db, CERTIFICATES_COL));
    return snap.docs.map((d) => d.data() as Certificate);
  } catch (err) {
    console.error('Error fetching all certificates:', err);
    return [];
  }
};

/**
 * Revoke or Reactivate Certificate (Admin)
 */
export const updateCertificateStatus = async (
  certificateId: string,
  status: 'VALID' | 'REVOKED'
): Promise<void> => {
  await updateDoc(doc(db, CERTIFICATES_COL, certificateId), { status });
};

export const revokeCertificate = async (certificateId: string, reason?: string): Promise<void> => {
  await updateDoc(doc(db, CERTIFICATES_COL, certificateId), {
    status: 'REVOKED',
    revocationReason: reason || 'Administrative action',
  });
};

export const reactivateCertificate = async (certificateId: string): Promise<void> => {
  await updateDoc(doc(db, CERTIFICATES_COL, certificateId), {
    status: 'VALID',
    revocationReason: '',
  });
};
