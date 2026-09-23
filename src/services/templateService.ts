import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CertificateTemplate, CertificateFieldPosition, Certificate } from '../types';
import { uploadFile } from './storageService';

export const TEMPLATES_COL = 'certificateTemplates';

export const DEFAULT_CERTIFICATE_FIELDS: CertificateFieldPosition[] = [
  {
    id: 'student_name',
    label: 'Student Full Name',
    placeholder: '{{student_name}}',
    x: 50,
    y: 47.5,
    fontSize: 38,
    fontFamily: "'Great Vibes', cursive",
    fontWeight: 'normal',
    color: '#0a1a3a',
    textAlign: 'center',
    letterSpacing: '1px',
    visible: true,
  },
  {
    id: 'course_name',
    label: 'Course Name',
    placeholder: '{{course_name}}',
    x: 50,
    y: 63.5,
    fontSize: 18,
    fontFamily: "'Montserrat', sans-serif",
    fontWeight: 'bold',
    color: '#00a2db',
    textAlign: 'center',
    letterSpacing: '0.5px',
    visible: true,
  },
  {
    id: 'completion_date',
    label: 'Completion Date',
    placeholder: '{{completion_date}}',
    x: 23,
    y: 89.5,
    fontSize: 12,
    fontFamily: "'Montserrat', sans-serif",
    fontWeight: 'semibold',
    color: '#1e293b',
    textAlign: 'center',
    visible: true,
  },
  {
    id: 'certificate_id',
    label: 'Certificate ID',
    placeholder: '{{certificate_id}}',
    x: 50,
    y: 91.5,
    fontSize: 11,
    fontFamily: "'Montserrat', sans-serif",
    fontWeight: 'bold',
    color: '#0a1a3a',
    textAlign: 'center',
    letterSpacing: '1px',
    visible: true,
  },
  {
    id: 'authorized_name',
    label: 'Authorized Name',
    placeholder: '{{authorized_name}}',
    x: 23,
    y: 84.5,
    fontSize: 13,
    fontFamily: "'Cinzel', serif",
    fontWeight: 'bold',
    color: '#0a1a3a',
    textAlign: 'center',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    visible: true,
  },
  {
    id: 'qr_code',
    label: 'Verification QR Code',
    placeholder: '{{qr_code}}',
    x: 82.5,
    y: 84.0,
    fontSize: 12,
    fontFamily: "'Montserrat', sans-serif",
    fontWeight: 'normal',
    color: '#000000',
    textAlign: 'center',
    visible: true,
    isQrCode: true,
    qrSize: 68,
  },
  {
    id: 'course_category',
    label: 'Course Category',
    placeholder: '{{course_category}}',
    x: 50,
    y: 69.0,
    fontSize: 12,
    fontFamily: "'Montserrat', sans-serif",
    fontWeight: 'medium',
    color: '#64748b',
    textAlign: 'center',
    visible: false,
  },
  {
    id: 'course_duration',
    label: 'Course Duration',
    placeholder: '{{course_duration}}',
    x: 50,
    y: 72.5,
    fontSize: 11,
    fontFamily: "'Montserrat', sans-serif",
    fontWeight: 'medium',
    color: '#64748b',
    textAlign: 'center',
    visible: false,
  },
];

export const INITIAL_DEFAULT_TEMPLATE: CertificateTemplate = {
  id: 'default-master-template',
  name: 'Standard Master Certificate Template',
  imageUrl: '', // When blank, uses clean high-res canvas or prompts upload
  thumbnailUrl: '',
  description: 'Official default A4 landscape certificate template for Atif Skills Hub.',
  isDefault: true,
  status: 'active',
  fields: DEFAULT_CERTIFICATE_FIELDS,
  includeWebsiteLogo: false,
  includeCollabLogo: false,
  includeSignature: false,
  includePartnerSignature: false,
  aspectRatio: 1.414,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: new Date().toISOString(),
};

/**
 * Fetch all certificate templates from Firestore
 */
export const getAllCertificateTemplates = async (): Promise<CertificateTemplate[]> => {
  try {
    const snap = await getDocs(collection(db, TEMPLATES_COL));
    if (snap.empty) {
      // Return initialized default template
      return [INITIAL_DEFAULT_TEMPLATE];
    }
    const templates = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CertificateTemplate));
    // Sort so default is first
    return templates.sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
  } catch (err) {
    console.warn('Error fetching certificate templates, returning initial default:', err);
    return [INITIAL_DEFAULT_TEMPLATE];
  }
};

/**
 * Subscribe to real-time templates updates
 */
export const subscribeToCertificateTemplates = (
  callback: (templates: CertificateTemplate[]) => void
) => {
  return onSnapshot(
    collection(db, TEMPLATES_COL),
    (snap) => {
      if (snap.empty) {
        callback([INITIAL_DEFAULT_TEMPLATE]);
      } else {
        const templates = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CertificateTemplate));
        templates.sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
        callback(templates);
      }
    },
    (err) => {
      console.warn('Subscription error for certificate templates:', err);
      callback([INITIAL_DEFAULT_TEMPLATE]);
    }
  );
};

/**
 * Get specific template by ID
 */
export const getCertificateTemplateById = async (
  templateId?: string
): Promise<CertificateTemplate> => {
  if (!templateId) {
    return getDefaultCertificateTemplate();
  }
  try {
    const snap = await getDoc(doc(db, TEMPLATES_COL, templateId));
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as CertificateTemplate;
    }
  } catch (err) {
    console.warn(`Error getting template with id ${templateId}:`, err);
  }
  return getDefaultCertificateTemplate();
};

/**
 * Get default certificate template
 */
export const getDefaultCertificateTemplate = async (): Promise<CertificateTemplate> => {
  try {
    const q = query(collection(db, TEMPLATES_COL), where('isDefault', '==', true));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return { id: snap.docs[0].id, ...snap.docs[0].data() } as CertificateTemplate;
    }
    // Check if any template exists
    const all = await getAllCertificateTemplates();
    if (all.length > 0) return all[0];
  } catch (err) {
    console.warn('Error getting default certificate template:', err);
  }
  return INITIAL_DEFAULT_TEMPLATE;
};

/**
 * Save or update a certificate template
 */
export const saveCertificateTemplate = async (
  template: CertificateTemplate
): Promise<CertificateTemplate> => {
  const templateId = template.id || `template_${Date.now()}`;
  const toSave: CertificateTemplate = {
    ...template,
    id: templateId,
    updatedAt: new Date().toISOString(),
    createdAt: template.createdAt || new Date().toISOString(),
  };

  // If this template is marked as default, unmark any previous default templates
  if (toSave.isDefault) {
    try {
      const all = await getAllCertificateTemplates();
      for (const t of all) {
        if (t.id !== templateId && t.isDefault) {
          await updateDoc(doc(db, TEMPLATES_COL, t.id), { isDefault: false });
        }
      }
    } catch (e) {
      console.warn('Error unmarking other default templates:', e);
    }
  }

  await setDoc(doc(db, TEMPLATES_COL, templateId), toSave);
  return toSave;
};

/**
 * Delete a certificate template
 */
export const deleteCertificateTemplate = async (templateId: string): Promise<void> => {
  await deleteDoc(doc(db, TEMPLATES_COL, templateId));
};

/**
 * Upload certificate template image (PNG, JPG, WebP)
 * Stores securely in Firebase Storage with persistent Base64 DataURL fallback
 */
export const uploadCertificateTemplateImage = async (file: File): Promise<string> => {
  const url = await uploadFile(file, 'materials');
  return url;
};

/**
 * Set a template as default
 */
export const setDefaultCertificateTemplate = async (templateId: string): Promise<void> => {
  const all = await getAllCertificateTemplates();
  for (const t of all) {
    await updateDoc(doc(db, TEMPLATES_COL, t.id), {
      isDefault: t.id === templateId,
      updatedAt: new Date().toISOString(),
    });
  }
};

/**
 * Replace placeholders in template text with real data
 */
export const formatTemplatePlaceholderText = (
  rawText: string,
  data: {
    studentName?: string;
    courseName?: string;
    completionDate?: string;
    certificateId?: string;
    courseCategory?: string;
    courseDuration?: string;
    authorizedName?: string;
    score?: number | string;
    [key: string]: any;
  }
): string => {
  if (!rawText) return '';
  return rawText
    .replace(/\{\{student_name\}\}/gi, data.studentName || 'Student Name')
    .replace(/\{\{course_name\}\}/gi, data.courseName || 'Course Title')
    .replace(/\{\{completion_date\}\}/gi, data.completionDate || 'Completion Date')
    .replace(/\{\{certificate_id\}\}/gi, data.certificateId || 'ASH-2026-00000')
    .replace(/\{\{course_category\}\}/gi, data.courseCategory || 'Data Science & AI')
    .replace(/\{\{course_duration\}\}/gi, data.courseDuration || '6 Weeks')
    .replace(/\{\{authorized_name\}\}/gi, data.authorizedName || 'ATIF HUSSAIN')
    .replace(/\{\{score\}\}/gi, String(data.score || 100));
};
