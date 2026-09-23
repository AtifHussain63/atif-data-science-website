export interface UserProfile {
  uid: string;
  studentId: string;
  name: string;
  email: string;
  phone?: string;
  country?: string;
  profileImage?: string;
  role: 'student' | 'admin';
  status: 'active' | 'suspended';
  createdAt: string;
  lastLogin: string;
}

export interface Course {
  id: string;
  title: string;
  slug?: string;
  description: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  instructor: string;
  thumbnail: string;
  passingPercentage: number;
  published: boolean;
  featured?: boolean;
  certificateTemplateId?: string; // Assigned custom certificate template ID
  learningOutcomes?: string[];
  prerequisites?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  order: number;
}

export interface Lesson {
  id: string;
  courseId: string;
  moduleId: string;
  title: string;
  description?: string;
  videoUrl?: string;
  youtubeVideoId?: string;
  youtubeChannelTitle?: string;
  youtubeThumbnailUrl?: string;
  notes?: string;
  materialUrl?: string;
  materialName?: string;
  required: boolean;
  order: number;
  durationMinutes?: number;
  sourceType?: 'youtube' | 'custom';
}

export interface QuizQuestion {
  id: string;
  questionNumber?: number;
  question: string;
  options: string[];
  correctAnswer: number; // 0, 1, 2, 3
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'advanced';
  topic?: string;
}

export interface Quiz {
  id: string;
  courseId: string;
  title: string;
  passingPercentage: number;
  timeLimitMinutes?: number;
  questions: QuizQuestion[];
  totalQuestions?: number;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  enrolledAt: string;
  status: 'active' | 'completed';
  completedAt?: string;
}

export interface LessonProgress {
  id: string;
  studentId: string;
  courseId: string;
  lessonId: string;
  completed: boolean;
  completedAt: string;
}

export interface QuizAttempt {
  id: string;
  studentId: string;
  courseId: string;
  quizId: string;
  score: number;
  passed: boolean;
  totalQuestions: number;
  correctAnswers: number;
  attemptedAt: string;
}

export interface CertificateFieldPosition {
  id: string; // 'student_name' | 'course_name' | 'completion_date' | 'certificate_id' | 'authorized_name' | 'qr_code' | 'course_category' | 'course_duration' | 'signatory_title' | 'partner_authorized_name' | 'partner_title' | string;
  label: string; // "Student Full Name"
  placeholder: string; // "{{student_name}}"
  x: number; // 0 - 100 percentage from left
  y: number; // 0 - 100 percentage from top
  width?: number; // percentage width or px
  fontSize: number; // in pt/px relative scale (e.g. 24)
  fontFamily: string; // e.g. "'Montserrat', sans-serif", "'Great Vibes', cursive", "'Cinzel', serif"
  fontWeight: 'normal' | 'medium' | 'semibold' | 'bold' | '800' | string;
  fontStyle?: 'normal' | 'italic';
  color: string; // e.g. "#0a1a3a", "#000000", "#d4af37"
  textAlign: 'left' | 'center' | 'right';
  letterSpacing?: string; // e.g. "0px", "1px", "2px"
  textTransform?: 'none' | 'uppercase' | 'capitalize' | 'lowercase';
  visible: boolean;
  isQrCode?: boolean;
  qrSize?: number; // size in px or % (e.g. 70)
  customFormat?: string; // e.g. "Completed on {{completion_date}}"
}

export interface CertificateTemplate {
  id: string;
  name: string; // e.g. "Python for Data Science Template", "General Certificate Template"
  imageUrl: string; // High-res uploaded certificate background image URL / base64
  thumbnailUrl?: string;
  description?: string;
  isDefault: boolean;
  status: 'active' | 'archived';
  fields: CertificateFieldPosition[];
  includeWebsiteLogo?: boolean;
  includeCollabLogo?: boolean;
  includeSignature?: boolean;
  includePartnerSignature?: boolean;
  aspectRatio?: number; // 1.414 for A4 landscape
  createdAt: string;
  updatedAt: string;
}

export interface Certificate {
  certificateId: string; // e.g. "ASH-2026-00001"
  studentId: string;
  studentName: string;
  studentEmail?: string;
  courseId: string;
  courseName: string;
  courseCategory?: string;
  courseLevel?: string;
  courseDuration?: string;
  completionDate: string;
  verificationUrl: string;
  status: 'VALID' | 'REVOKED';
  revocationReason?: string;
  createdAt: string;
  templateId?: string; // Reference to assigned CertificateTemplate
  templateImageUrl?: string; // Direct background image URL if using template
  templateFields?: CertificateFieldPosition[]; // Snapshot of field positions at issuance
  logoUrl?: string;
  signatureUrl?: string;
  authorizedName?: string;
  signatoryTitle?: string;
  websiteName?: string;
  tagline?: string;
  score?: number;
  collaborationEnabled?: boolean;
  collaborationName?: string;
  collaborationEmail?: string;
  collaborationType?: string;
  collaborationLogoUrl?: string;
  partnerAuthorizedName?: string;
  partnerSignatoryTitle?: string;
  partnerSignatureUrl?: string;
}

export interface CollaborationSettings {
  enabled: boolean;
  partnerName: string;
  partnerEmail: string;
  collaborationType: string;
  description: string;
  logoUrl?: string;
  mainLogoUrl?: string;
  updatedAt?: string;
}

export interface CertificateSettings {
  websiteName: string;
  tagline: string;
  certificateTitle: string;
  certificateSubtitle: string;
  certificatePrefix: string;
  authorizedName: string;
  signatoryTitle: string;
  description: string;
  logoUrl?: string;
  signatureUrl?: string;
  activeTemplateId?: string; // Active/default template ID
  collaborationLogoUrl?: string;
  collaborationName?: string;
  collaborationEmail?: string;
  collaborationEnabled?: boolean;
  partnerAuthorizedName?: string;
  partnerSignatoryTitle?: string;
  partnerSignatureUrl?: string;
  borderStyle?: 'executive-geometric' | 'academic-classic' | 'modern-minimal';
  themeAccent?: 'navy-gold' | 'sapphire-amber' | 'emerald-bronze';
  showCourseMeta?: boolean;
  showHonorsSeal?: boolean;
  updatedAt?: string;
}

export interface PlatformSettings {
  platformName: string;
  authorizedSignatory: string;
  signatoryTitle: string;
  verificationDomain: string;
  primaryColor: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalCourses: number;
  totalEnrollments: number;
  activeStudents: number;
  completedCourses: number;
  certificatesIssued: number;
}

export interface Collaboration {
  id: string;
  name: string;
  email: string;
  category: string;
  description: string;
  status: 'active' | 'inactive';
  websiteUrl?: string;
  logoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthorizedEmailAccount {
  id: string;
  name: string;
  email: string;
  type: 'Collaboration / Support' | 'Main Admin / Authorized Email' | string;
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface EmailLog {
  id: string;
  senderEmail: string;
  senderName: string;
  recipientEmail: string;
  subject: string;
  message: string;
  emailType: 'Test Email' | 'Announcement' | 'Support' | 'Notification' | string;
  status: 'Sent' | 'Delivered' | 'Failed';
  sentAt: string;
}

export interface YouTubeCourseVideo {
  id: string; // `${courseId}_${videoId}`
  videoId: string;
  videoUrl: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  channelId?: string;
  courseId: string;
  lessonId?: string;
  moduleId?: string;
  publishedAt?: string;
  duration?: string;
  durationMinutes?: number;
  addedAt: string;
  status: 'saved' | 'added_to_lesson';
}

export interface YouTubeCoursePlaylist {
  id: string; // `${courseId}_${playlistId}`
  playlistId: string;
  playlistUrl: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  channelId?: string;
  courseId: string;
  itemCount: number;
  publishedAt?: string;
  addedAt: string;
}

export interface YouTubeSearchResultItem {
  id: string;
  type: 'video' | 'playlist';
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  channelId?: string;
  publishedAt: string;
  url: string;
  duration?: string;
  durationMinutes?: number;
  itemCount?: number;
  embeddable?: boolean;
  alreadyInCourse?: boolean;
  existingLessonId?: string;
}

export interface YouTubePlaylistItem {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  position: number;
  videoUrl: string;
  duration?: string;
  durationMinutes?: number;
}

export interface YouTubeSettings {
  apiKey?: string;
  defaultRegion?: string;
  relevanceLanguage?: string;
  maxResults?: number;
  updatedAt?: string;
}

export interface StudentRecord {
  id: string; // `${studentId}_${courseId}`
  studentUid: string;
  studentId: string; // e.g. "ASH-STU-00001"
  studentName: string;
  email: string;
  registrationDate: string;
  courseId: string; // e.g. "python-ds" or "—"
  courseName: string; // e.g. "Python for Data Science & Machine Learning"
  enrollmentDate: string; // formatted date or "Not Enrolled"
  courseStatus: 'Not Enrolled' | 'Enrolled' | 'In Progress' | 'Completed';
  courseProgressPercentage: number; // 0 - 100
  totalLessons: number;
  completedLessons: number;
  quizScore: string; // e.g. "43/50" or "—"
  quizPercentage: number; // e.g. 86
  quizResult: 'NOT_ATTEMPTED' | 'PASSED' | 'FAILED';
  quizAttemptsCount?: number;
  certificateStatus: 'LOCKED' | 'ELIGIBLE' | 'ISSUED';
  certificateId: string; // e.g. "ASH-2026-00001" or "—"
  certificatePercentage: number; // e.g. 86
  certificateIssueDate: string; // e.g. "March 1, 2026" or "—"
  lastActivity: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentSummaryRecord {
  studentUid: string;
  studentId: string;
  name: string;
  email: string;
  phone?: string;
  country?: string;
  registrationDate: string;
  status: 'active' | 'suspended';
  totalCoursesEnrolled: number;
  totalCoursesCompleted: number;
  totalCertificatesIssued: number;
  averageProgressPercentage: number;
  averageQuizPercentage: number;
  lastActivity: string;
  courses: StudentRecord[];
}

