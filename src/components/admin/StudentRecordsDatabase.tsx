import React, { useState, useEffect, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  RefreshCw,
  Search,
  Filter,
  User,
  BookOpen,
  Award,
  CheckCircle2,
  Clock,
  Lock,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Eye,
  AlertCircle,
  ExternalLink,
  Layers,
  Sparkles,
  TrendingUp,
  UserCheck,
  UserX,
  RotateCcw,
  GraduationCap,
} from 'lucide-react';
import {
  StudentRecord,
  StudentSummaryRecord,
  UserProfile,
  Course,
  Certificate,
} from '../../types';
import {
  getAllStudentRecords,
  exportStudentRecordsToExcel,
  formatReportDate,
} from '../../services/studentRecordService';
import { updateStudentStatus, resetStudentProgress } from '../../services/studentService';
import { getAllCourses } from '../../services/courseService';
import { useToast } from '../../context/ToastContext';

interface StudentRecordsDatabaseProps {
  onViewCertificate?: (certId: string) => void;
}

export const StudentRecordsDatabase: React.FC<StudentRecordsDatabaseProps> = ({
  onViewCertificate,
}) => {
  const { success, error, info } = useToast();

  const [records, setRecords] = useState<StudentRecord[]>([]);
  const [summaries, setSummaries] = useState<StudentSummaryRecord[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'excel' | 'students'>('excel');

  // Selected Student Drawer
  const [selectedStudent, setSelectedStudent] = useState<StudentSummaryRecord | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load Data
  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [recData, coursesList] = await Promise.all([
        getAllStudentRecords(),
        getAllCourses(true),
      ]);
      setRecords(recData.records);
      setSummaries(recData.summaries);
      setCourses(coursesList);

      if (isManualRefresh) {
        success('Database Refreshed', `Synchronized ${recData.records.length} course records across ${recData.summaries.length} registered students.`);
      }
    } catch (err) {
      console.error('Error fetching student records:', err);
      error('Sync Failed', 'Could not load student records from Firestore.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Records (Excel view)
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.studentName.toLowerCase().includes(q) ||
        r.studentId.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.courseName.toLowerCase().includes(q) ||
        r.courseId.toLowerCase().includes(q) ||
        r.certificateId.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // Status Filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'completed' && r.courseStatus !== 'Completed') return false;
        if (statusFilter === 'in-progress' && r.courseStatus !== 'In Progress') return false;
        if (statusFilter === 'enrolled' && r.courseStatus !== 'Enrolled' && r.courseStatus !== 'In Progress' && r.courseStatus !== 'Completed') return false;
        if (statusFilter === 'cert-issued' && r.certificateStatus !== 'ISSUED') return false;
        if (statusFilter === 'cert-locked' && r.certificateStatus !== 'LOCKED') return false;
      }

      // Course Filter
      if (courseFilter !== 'all' && r.courseId !== courseFilter) {
        return false;
      }

      return true;
    });
  }, [records, searchQuery, statusFilter, courseFilter]);

  // Filtered Students (Grouped view)
  const filteredSummaries = useMemo(() => {
    return summaries.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.courses.some((c) => c.courseName.toLowerCase().includes(q) || c.certificateId.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (statusFilter !== 'all') {
        if (statusFilter === 'completed' && s.totalCoursesCompleted === 0) return false;
        if (statusFilter === 'cert-issued' && s.totalCertificatesIssued === 0) return false;
        if (statusFilter === 'enrolled' && s.totalCoursesEnrolled === 0) return false;
      }

      if (courseFilter !== 'all') {
        const hasCourse = s.courses.some((c) => c.courseId === courseFilter);
        if (!hasCourse) return false;
      }

      return true;
    });
  }, [summaries, searchQuery, statusFilter, courseFilter]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalRegistered = summaries.length;
    const courseEnrollments = records.filter((r) => r.courseId !== '—');
    const inProgressCount = courseEnrollments.filter((r) => r.courseStatus === 'In Progress').length;
    const completedCount = courseEnrollments.filter((r) => r.courseStatus === 'Completed').length;
    const certsIssuedCount = courseEnrollments.filter((r) => r.certificateStatus === 'ISSUED').length;

    const avgProgress = courseEnrollments.length > 0
      ? Math.round(courseEnrollments.reduce((acc, r) => acc + r.courseProgressPercentage, 0) / courseEnrollments.length)
      : 0;

    const quizAttempted = courseEnrollments.filter((r) => r.quizResult !== 'NOT_ATTEMPTED');
    const avgQuiz = quizAttempted.length > 0
      ? Math.round(quizAttempted.reduce((acc, r) => acc + r.quizPercentage, 0) / quizAttempted.length)
      : 0;

    return {
      totalRegistered,
      totalEnrollments: courseEnrollments.length,
      inProgressCount,
      completedCount,
      certsIssuedCount,
      avgProgress,
      avgQuiz,
    };
  }, [summaries, records]);

  // Export to Excel
  const handleExportExcel = () => {
    if (records.length === 0) {
      info('No Records', 'There are no student records to export.');
      return;
    }
    try {
      exportStudentRecordsToExcel(filteredRecords, filteredSummaries);
      success(
        'Excel File Downloaded!',
        `Successfully generated and downloaded "Atif-Skills-Hub-Student-Records.xlsx" (${filteredRecords.length} records).`
      );
    } catch (err) {
      console.error('Export error:', err);
      error('Export Error', 'Could not generate Excel spreadsheet.');
    }
  };

  // Student Actions
  const handleToggleStatus = async (student: StudentSummaryRecord) => {
    const nextStatus = student.status === 'active' ? 'suspended' : 'active';
    setActionLoading(student.studentUid);
    try {
      await updateStudentStatus(student.studentUid, nextStatus);
      setSummaries((prev) =>
        prev.map((s) => (s.studentUid === student.studentUid ? { ...s, status: nextStatus } : s))
      );
      if (selectedStudent && selectedStudent.studentUid === student.studentUid) {
        setSelectedStudent({ ...selectedStudent, status: nextStatus });
      }
      success(
        'Status Updated',
        `Student "${student.name}" is now ${nextStatus.toUpperCase()}.`
      );
    } catch (err) {
      console.error(err);
      error('Failed', 'Could not update student status.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetCourse = async (studentUid: string, studentName: string, courseId: string) => {
    if (!window.confirm(`Are you sure you want to reset all progress for student "${studentName}" on course "${courseId}"?`)) {
      return;
    }
    setActionLoading(`${studentUid}_${courseId}`);
    try {
      await resetStudentProgress(studentUid, courseId);
      await loadData(true);
      success('Progress Reset', `Reset course progress for ${studentName}.`);
    } catch (err) {
      console.error(err);
      error('Reset Failed', 'Could not reset student course progress.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 md:p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white tracking-tight">
                Automatic Student Data Records & Excel Database
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
                LIVE FIRESTORE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live automated database tracking all student registrations, enrollments, 50-MCQ quizzes, and issued certificates.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing || loading}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
            title="Reload from Firestore"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Refresh Data'}</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            title="Download formatted Excel workbook (.xlsx)"
          >
            <Download className="w-4 h-4" />
            <span>Download Student Excel</span>
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold mb-1">
            <span>Students</span>
            <User className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <p className="text-2xl font-black text-white">{metrics.totalRegistered}</p>
          <span className="text-[10px] text-slate-400">Total Registered</span>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold mb-1">
            <span>Enrollments</span>
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400">{metrics.totalEnrollments}</p>
          <span className="text-[10px] text-slate-400">Course Subscriptions</span>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold mb-1">
            <span>In Progress</span>
            <Clock className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <p className="text-2xl font-black text-sky-400">{metrics.inProgressCount}</p>
          <span className="text-[10px] text-slate-400">Active Learners</span>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold mb-1">
            <span>Completed</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400">{metrics.completedCount}</p>
          <span className="text-[10px] text-slate-400">Courses Finished</span>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold mb-1">
            <span>Certificates</span>
            <Award className="w-3.5 h-3.5 text-amber-300" />
          </div>
          <p className="text-2xl font-black text-amber-300">{metrics.certsIssuedCount}</p>
          <span className="text-[10px] text-slate-400">Valid Verified</span>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold mb-1">
            <span>Avg Progress</span>
            <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-purple-400">{metrics.avgProgress}%</p>
          <span className="text-[10px] text-slate-400">Across Courses</span>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold mb-1">
            <span>Avg Quiz</span>
            <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-indigo-400">{metrics.avgQuiz}%</p>
          <span className="text-[10px] text-slate-400">50-MCQ Score</span>
        </div>
      </div>

      {/* CONTROLS BAR: SEARCH, FILTERS & VIEW MODE */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Name, Student ID (ASH-STU-...), Email, Course, or Certificate ID..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="enrolled">Enrolled / Active</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cert-issued">Certificate Issued</option>
              <option value="cert-locked">Certificate Locked</option>
            </select>
          </div>

          {/* Course Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs max-w-[200px]">
            <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer truncate"
            >
              <option value="all">All 46 Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title.replace(/^\d+\.\s*/, '')}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-950 border border-slate-800 p-1 rounded-xl self-start md:self-auto">
          <button
            onClick={() => setViewMode('excel')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              viewMode === 'excel'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel Database View</span>
          </button>
          <button
            onClick={() => setViewMode('students')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              viewMode === 'students'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Student Profiles ({filteredSummaries.length})</span>
          </button>
        </div>
      </div>

      {/* VIEW A: EXCEL TABULAR DATABASE VIEW (1 Row Per Enrollment) */}
      {viewMode === 'excel' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Live Student Records Master Table
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] text-slate-300 font-mono">
                {filteredRecords.length} Rows
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Showing accurate real-time fields matching Excel file export
            </span>
          </div>

          <div className="overflow-x-auto max-h-[640px] overflow-y-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 sticky top-0 z-10">
                <tr>
                  <th className="p-3.5 whitespace-nowrap">#</th>
                  <th className="p-3.5 whitespace-nowrap">Student ID</th>
                  <th className="p-3.5 whitespace-nowrap">Student Name</th>
                  <th className="p-3.5 whitespace-nowrap">Email</th>
                  <th className="p-3.5 whitespace-nowrap">Course ID</th>
                  <th className="p-3.5 whitespace-nowrap">Course Name</th>
                  <th className="p-3.5 whitespace-nowrap">Enrollment Date</th>
                  <th className="p-3.5 whitespace-nowrap">Course Progress</th>
                  <th className="p-3.5 whitespace-nowrap">Lessons</th>
                  <th className="p-3.5 whitespace-nowrap">Final Quiz (50 MCQs)</th>
                  <th className="p-3.5 whitespace-nowrap">Quiz Status</th>
                  <th className="p-3.5 whitespace-nowrap">Certificate Status</th>
                  <th className="p-3.5 whitespace-nowrap">Certificate ID</th>
                  <th className="p-3.5 whitespace-nowrap">Cert Issue Date</th>
                  <th className="p-3.5 whitespace-nowrap">Last Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {loading ? (
                  <tr>
                    <td colSpan={15} className="p-12 text-center text-slate-400">
                      <RefreshCw className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-white">Loading live student database...</p>
                      <p className="text-xs text-slate-500">Querying Firestore collections</p>
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={15} className="p-12 text-center text-slate-400">
                      <FileSpreadsheet className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                      <p className="text-sm font-bold text-white">No student records found</p>
                      <p className="text-xs text-slate-500">
                        {searchQuery ? 'Try adjusting your search criteria' : 'New registered students and enrollments will appear here automatically.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((rec, index) => {
                    const isCompleted = rec.courseStatus === 'Completed';
                    const isInProgress = rec.courseStatus === 'In Progress';
                    const isCertIssued = rec.certificateStatus === 'ISSUED';
                    const isQuizPassed = rec.quizResult === 'PASSED';
                    const isQuizFailed = rec.quizResult === 'FAILED';

                    return (
                      <tr
                        key={`${rec.id}_${index}`}
                        className="hover:bg-slate-800/40 transition-colors group"
                      >
                        <td className="p-3.5 text-slate-500 font-mono">{index + 1}</td>
                        <td className="p-3.5 font-mono font-bold text-amber-400 whitespace-nowrap">
                          {rec.studentId}
                        </td>
                        <td className="p-3.5 font-bold text-white whitespace-nowrap">
                          {rec.studentName}
                        </td>
                        <td className="p-3.5 text-slate-400 whitespace-nowrap">{rec.email}</td>
                        <td className="p-3.5 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                          {rec.courseId}
                        </td>
                        <td className="p-3.5 max-w-xs truncate font-medium text-slate-200" title={rec.courseName}>
                          {rec.courseName}
                        </td>
                        <td className="p-3.5 text-slate-400 whitespace-nowrap">{rec.enrollmentDate}</td>
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  isCompleted
                                    ? 'bg-emerald-500'
                                    : rec.courseProgressPercentage > 0
                                    ? 'bg-amber-500'
                                    : 'bg-slate-700'
                                }`}
                                style={{ width: `${rec.courseProgressPercentage}%` }}
                              />
                            </div>
                            <span className="font-bold text-white text-[11px]">
                              {rec.courseProgressPercentage}%
                            </span>
                          </div>
                        </td>
                        <td className="p-3.5 font-mono text-[11px] whitespace-nowrap">
                          {rec.courseId !== '—' ? `${rec.completedLessons} / ${rec.totalLessons}` : '—'}
                        </td>
                        <td className="p-3.5 font-mono text-[11px] whitespace-nowrap">
                          <span className="font-bold text-slate-200">{rec.quizScore}</span>
                          {rec.quizPercentage > 0 && (
                            <span className="text-slate-400 ml-1">({rec.quizPercentage}%)</span>
                          )}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                              isQuizPassed
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : isQuizFailed
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {rec.quizResult.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${
                              isCertIssued
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 font-mono'
                                : rec.certificateStatus === 'ELIGIBLE'
                                ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                                : 'bg-slate-800 text-slate-500 border-slate-700'
                            }`}
                          >
                            {rec.certificateStatus}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono font-bold whitespace-nowrap text-amber-300">
                          {isCertIssued ? (
                            <div className="flex items-center gap-1.5">
                              <span>{rec.certificateId}</span>
                              {onViewCertificate && (
                                <button
                                  onClick={() => onViewCertificate(rec.certificateId)}
                                  className="text-slate-400 hover:text-amber-400"
                                  title="View Certificate"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        <td className="p-3.5 text-slate-400 whitespace-nowrap">
                          {rec.certificateIssueDate}
                        </td>
                        <td className="p-3.5 text-slate-400 whitespace-nowrap">
                          {rec.lastActivity}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW B: STUDENT DIRECTORY VIEW (1 Card / Group per Student with multiple courses nested) */}
      {viewMode === 'students' && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-slate-400 bg-slate-900/80 border border-slate-800 rounded-3xl">
              <RefreshCw className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-white">Loading student profiles...</p>
            </div>
          ) : filteredSummaries.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-slate-900/80 border border-slate-800 rounded-3xl">
              <User className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-white">No students matched</p>
            </div>
          ) : (
            filteredSummaries.map((student) => {
              const isSuspended = student.status === 'suspended';
              return (
                <div
                  key={student.studentUid}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-md"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Student info */}
                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold shrink-0 text-base">
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="text-sm font-bold text-white">{student.name}</h3>
                          <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                            {student.studentId}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              isSuspended
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            }`}
                          >
                            {student.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-400 mt-1 flex-wrap">
                          <span>{student.email}</span>
                          <span>•</span>
                          <span>Registered: {student.registrationDate}</span>
                          <span>•</span>
                          <span>Last Active: {student.lastActivity}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Summary badges & actions */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
                        <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-slate-300 font-medium">
                          {student.totalCoursesEnrolled} Courses ({student.totalCoursesCompleted} Completed)
                        </span>
                      </div>

                      <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
                        <Award className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-slate-300 font-medium">
                          {student.totalCertificatesIssued} Certificates
                        </span>
                      </div>

                      <button
                        onClick={() => handleToggleStatus(student)}
                        disabled={actionLoading === student.studentUid}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                          isSuspended
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                        }`}
                      >
                        {isSuspended ? 'Activate' : 'Suspend'}
                      </button>

                      <button
                        onClick={() => setSelectedStudent(student)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700"
                      >
                        View Details
                      </button>
                    </div>
                  </div>

                  {/* Enrolled Courses Sub-List */}
                  {student.courses.length > 0 && student.courses[0].courseId !== '—' && (
                    <div className="mt-4 pt-3.5 border-t border-slate-800/80">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Enrolled Courses & 50-MCQ Assessment Status:
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {student.courses.map((c) => (
                          <div
                            key={c.id}
                            className="bg-slate-950/60 border border-slate-800/70 p-3 rounded-xl flex flex-col justify-between text-xs"
                          >
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <span className="font-semibold text-white truncate" title={c.courseName}>
                                {c.courseName}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0 ${
                                  c.courseStatus === 'Completed'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                    : c.courseStatus === 'In Progress'
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                    : 'bg-slate-800 text-slate-400 border-slate-700'
                                }`}
                              >
                                {c.courseStatus}
                              </span>
                            </div>

                            {/* Progress bar */}
                            <div className="space-y-1 my-1">
                              <div className="flex items-center justify-between text-[10px] text-slate-400">
                                <span>Progress: {c.courseProgressPercentage}%</span>
                                <span>Quiz: {c.quizScore}</span>
                              </div>
                              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-amber-500 rounded-full"
                                  style={{ width: `${c.courseProgressPercentage}%` }}
                                />
                              </div>
                            </div>

                            {/* Certificate and reset */}
                            <div className="flex items-center justify-between pt-1.5 text-[10px]">
                              {c.certificateStatus === 'ISSUED' ? (
                                <span className="font-mono text-amber-300 font-bold flex items-center gap-1">
                                  <Award className="w-3 h-3 text-amber-400" /> {c.certificateId}
                                </span>
                              ) : (
                                <span className="text-slate-500">Cert: {c.certificateStatus}</span>
                              )}

                              <button
                                onClick={() => handleResetCourse(student.studentUid, student.name, c.courseId)}
                                className="text-slate-500 hover:text-rose-400 flex items-center gap-0.5"
                                title="Reset Progress"
                              >
                                <RotateCcw className="w-3 h-3" /> Reset
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* STUDENT DETAIL MODAL */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
                  {selectedStudent.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedStudent.name}</h3>
                  <p className="font-mono text-xs text-amber-400">{selectedStudent.studentId}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Email</span>
                <span className="font-semibold text-white truncate block">{selectedStudent.email}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Phone</span>
                <span className="font-semibold text-white">{selectedStudent.phone || '—'}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Country</span>
                <span className="font-semibold text-white">{selectedStudent.country || 'Global'}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Registration Date</span>
                <span className="font-semibold text-white">{selectedStudent.registrationDate}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Account Status</span>
                <span className="font-semibold text-emerald-400 uppercase">{selectedStudent.status}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Last Activity</span>
                <span className="font-semibold text-white">{selectedStudent.lastActivity}</span>
              </div>
            </div>

            {/* Enrolled Courses */}
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                All Enrolled Course Records ({selectedStudent.courses.length})
              </h4>
              <div className="space-y-2.5">
                {selectedStudent.courses.map((c, i) => (
                  <div
                    key={i}
                    className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{c.courseName}</span>
                      <span className="font-mono text-amber-400">{c.courseId}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-400">
                      <div>
                        Status: <span className="font-semibold text-slate-200">{c.courseStatus}</span>
                      </div>
                      <div>
                        Progress: <span className="font-semibold text-slate-200">{c.courseProgressPercentage}%</span>
                      </div>
                      <div>
                        Quiz: <span className="font-semibold text-slate-200">{c.quizScore} ({c.quizResult})</span>
                      </div>
                      <div>
                        Certificate: <span className="font-semibold text-amber-400">{c.certificateId}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
