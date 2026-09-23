import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  Award,
  Zap,
  Code2,
  Database,
  Cpu,
  BarChart3,
  CheckCircle2,
  FileCheck2,
  QrCode,
  Users,
  ChevronDown,
  Sparkles,
  Handshake,
  Mail,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { Course, Collaboration } from '../types';
import { getAllCourses } from '../services/courseService';
import { getAllCollaborations } from '../services/collaborationService';

interface HomePageProps {
  onNavigate: (view: string, param?: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [popularCourses, setPopularCourses] = useState<Course[]>([]);
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    getAllCourses().then((courses) => {
      setPopularCourses(courses.slice(0, 6));
      setLoading(false);
    });

    getAllCollaborations().then((collabs) => {
      setCollaborations(collabs);
    });
  }, []);

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2500);
  };

  const categories = [
    { name: 'Data Science', count: '10 Courses', icon: Database, color: 'from-blue-600 to-cyan-500' },
    { name: 'Machine Learning', count: '10 Courses', icon: Cpu, color: 'from-amber-500 to-orange-500' },
    { name: 'Artificial Intelligence', count: '8 Courses', icon: Sparkles, color: 'from-purple-600 to-pink-500' },
    { name: 'Python', count: '8 Courses', icon: Code2, color: 'from-emerald-500 to-teal-500' },
    { name: 'Data Analytics', count: '6 Courses', icon: BarChart3, color: 'from-indigo-500 to-blue-500' },
    { name: 'SQL & Databases', count: '4 Courses', icon: Database, color: 'from-rose-500 to-red-500' },
  ];

  const steps = [
    { num: '01', title: 'Create Free Account', desc: 'Sign up in seconds and get assigned your unique official Student ID.' },
    { num: '02', title: 'Choose Course', desc: 'Select from 46 curated Data Science, AI, and Analytics courses.' },
    { num: '03', title: 'Learn Practical Skills', desc: 'Watch lessons, read comprehensive notes, and download project files.' },
    { num: '04', title: 'Pass Final 50-MCQ Quiz', desc: 'Score 80%+ on the 50 multiple-choice questions assessment to prove your mastery.' },
    { num: '05', title: 'Earn & Verify Certificate', desc: 'Instant certificate issuance with authorized signature and unique QR code.' },
  ];

  const faqs = [
    {
      q: 'How do I receive my certificate on Atif Skills Hub?',
      a: 'To earn your certificate, you must enroll in a course and score 80% or higher (40 out of 50 questions) on the course final 50-MCQ assessment. Your official certificate with QR code verification will be generated automatically.',
    },
    {
      q: 'How does QR Code certificate verification work?',
      a: 'Every certificate contains a unique Certificate ID (e.g. ASH-2026-00001) and an encrypted QR code pointing to our public verification registry. Employers and institutions can scan the QR code to instantly verify authenticity.',
    },
    {
      q: 'Can I print or download my certificate as a PDF?',
      a: 'Yes! Open your certificate from your Student Dashboard or verification page and click "Print / Save as PDF". In your browser\'s print window, select "Save as PDF" to download your high-resolution certificate directly to your device.',
    },
    {
      q: 'Is prior programming experience required?',
      a: 'We offer Beginner tracks (such as Introduction to Data Science, Python Fundamentals, and Excel) as well as Intermediate and Advanced tracks in Deep Learning, NLP, and LLMs.',
    },
  ];

  return (
    <div id="home-page" className="w-full bg-slate-950 text-slate-100 selection:bg-amber-500 selection:text-slate-950">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-32 border-b border-slate-900">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[300px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-6 shadow-sm">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            46 Practical Data Science & AI Courses
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.1] font-sans">
            Learn Skills. <br className="hidden sm:inline" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200">
              Build Your Future.
            </span> <br />
            Get Certified.
          </h1>

          {/* Description */}
          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
            Learn practical Data Science, Artificial Intelligence, Python, SQL, Data Analytics, Machine Learning, Power BI and other digital skills through structured online courses.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              id="btn-hero-explore-courses"
              onClick={() => onNavigate('courses')}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-900/30 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
            >
              <BookOpen className="w-5 h-5" />
              Explore Courses
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              id="btn-hero-create-account"
              onClick={() => onNavigate('auth', 'register')}
              className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold border border-slate-800 hover:border-slate-700 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              Create Free Account
            </button>
          </div>

          {/* Key Metric Highlights */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8 border-t border-slate-900/80">
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 text-center">
              <p className="text-2xl sm:text-3xl font-extrabold text-white">46</p>
              <p className="text-xs text-slate-400 mt-1 font-medium">Complete Courses</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 text-center">
              <p className="text-2xl sm:text-3xl font-extrabold text-amber-400">100%</p>
              <p className="text-xs text-slate-400 mt-1 font-medium">Practical Curriculum</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 text-center">
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400">QR-Ready</p>
              <p className="text-xs text-slate-400 mt-1 font-medium">Verifiable Certificates</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 text-center">
              <p className="text-2xl sm:text-3xl font-extrabold text-blue-400">Live</p>
              <p className="text-xs text-slate-400 mt-1 font-medium">Instant Verification</p>
            </div>
          </div>

        </div>
      </section>

      {/* 2. COURSE CATEGORIES */}
      <section className="py-16 bg-slate-950 border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-10">
            <div>
              <p className="text-amber-400 text-xs font-bold uppercase tracking-wider">Browse by Category</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">Specialized Learning Tracks</h2>
            </div>
            <button
              onClick={() => onNavigate('courses')}
              className="text-sm font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 mt-2 sm:mt-0"
            >
              View all categories <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <div
                  key={cat.name}
                  onClick={() => onNavigate('courses', cat.name)}
                  className="p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/40 cursor-pointer transition-all duration-200 group flex flex-col items-center text-center"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${cat.color} p-0.5 mb-3 group-hover:scale-110 transition-transform`}>
                    <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-slate-200 group-hover:text-amber-400 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1">{cat.count}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. POPULAR COURSES */}
      <section className="py-20 bg-slate-900/30 border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <p className="text-amber-400 text-xs font-bold uppercase tracking-wider">Top Curriculum</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">Popular Data & AI Courses</h2>
            <p className="text-slate-400 text-sm mt-2">
              Start with our most recommended courses in Python, Machine Learning, Deep Learning, and Business Intelligence.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-80 bg-slate-900 rounded-2xl animate-pulse border border-slate-800" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularCourses.map((course) => (
                <div
                  key={course.id}
                  id={`course-card-${course.id}`}
                  onClick={() => onNavigate('course-detail', course.id)}
                  className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-amber-950/20 transition-all duration-300 flex flex-col cursor-pointer group"
                >
                  <div className="relative h-44 overflow-hidden bg-slate-950">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur px-2.5 py-1 rounded-md text-[11px] font-semibold text-amber-400 border border-slate-800">
                      {course.category}
                    </div>
                    <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur px-2 py-0.5 rounded text-[10px] font-medium text-slate-300 border border-slate-800">
                      {course.difficulty}
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                        {course.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                        {course.description}
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">{course.duration}</span>
                      <span className="text-amber-400 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Enroll Course <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-12 text-center">
            <button
              onClick={() => onNavigate('courses')}
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 rounded-xl font-semibold text-sm transition-all"
            >
              Browse All 46 Courses →
            </button>
          </div>
        </div>
      </section>

      {/* 4. WHY CHOOSE ATIF SKILLS HUB */}
      <section className="py-20 bg-slate-950 border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-amber-400 text-xs font-bold uppercase tracking-wider">The Standard in Online Learning</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">Why Choose Atif Skills Hub?</h2>
            <p className="text-slate-400 text-sm mt-2">
              Everything you need to master technical skills and earn industry-recognized credentials.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
                <Code2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Practical Learning</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Hands-on notebooks, downloadable datasets, real-world case studies, and code architectures you can use directly.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Structured Courses</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Step-by-step modular lessons with clear learning goals, structured notes, and video lectures.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Comprehensive Quizzes</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Multiple-choice final assessments with automated scoring and passing criteria to validate your mastery.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Progress Tracking</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Real-time progress calculation across lessons and modules with automated completion indicators.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Professional Certificates</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                High-resolution landscape digital certificates with official website logo, authorized signature, and unique ID.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
                <QrCode className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">QR Certificate Verification</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Every certificate contains a live QR code allowing anyone to audit validity instantly online.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS */}
      <section className="py-20 bg-slate-900/20 border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-amber-400 text-xs font-bold uppercase tracking-wider">Step-By-Step Journey</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">How It Works</h2>
            <p className="text-slate-400 text-sm mt-2">From registration to verified certificate in 5 simple steps.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {steps.map((s, idx) => (
              <div key={s.num} className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between relative">
                <div>
                  <span className="text-3xl font-extrabold text-amber-500/30 font-mono">{s.num}</span>
                  <h3 className="text-sm font-bold text-white mt-2">{s.title}</h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. CERTIFICATES SHOWCASE & VERIFICATION */}
      <section className="py-20 bg-slate-950 border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4" />
                Tamper-Proof Verification
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                Authentic, Verifiable Certificates for Your Career
              </h2>

              <p className="text-slate-300 text-sm leading-relaxed">
                When you pass a course on <strong>Atif Skills Hub</strong>, you unlock a landscape certificate suitable for LinkedIn, resume portfolios, and employer submissions.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-300"><strong className="text-white">Unique Certificate ID:</strong> Auto-generated sequential audit identifier (e.g. ASH-2026-00001).</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-300"><strong className="text-white">Real-Time QR Scanner:</strong> Instant mobile camera verification linking directly to the live verification registry.</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-300"><strong className="text-white">Official Signatures & Seal:</strong> Dynamic authorized signatory and institution crest.</p>
                </div>
              </div>

              <div className="pt-4 flex items-center gap-3">
                <button
                  onClick={() => onNavigate('verify')}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-all flex items-center gap-2 shadow-lg shadow-emerald-950/40"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Try Verification Tool
                </button>
              </div>
            </div>

            {/* Certificate Mock Visual */}
            <div className="relative p-2 bg-gradient-to-tr from-amber-600/30 via-slate-800 to-slate-900 rounded-2xl border border-slate-800 shadow-2xl">
              <div className="bg-[#fdfbf7] text-slate-900 p-6 sm:p-8 rounded-xl border-4 border-slate-900 text-center font-serif">
                <div className="text-xs font-bold tracking-widest text-slate-800 uppercase">ATIF SKILLS HUB</div>
                <div className="text-lg sm:text-xl font-extrabold text-amber-800 uppercase mt-1">Certificate of Completion</div>
                <p className="text-[10px] text-slate-500 italic mt-1">Presented to</p>
                <p className="text-xl sm:text-2xl font-bold text-slate-950 mt-0.5 border-b border-slate-300 pb-1 inline-block">Atif Hussain</p>
                <p className="text-[10px] text-slate-600 mt-1">for successfully completing</p>
                <p className="text-xs sm:text-sm font-bold text-amber-900 mt-0.5">Python for Data Science</p>
                <div className="mt-4 pt-3 border-t border-slate-300 flex items-center justify-between text-[8px] text-slate-500 font-sans">
                  <span>ID: ASH-2026-00001</span>
                  <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">STATUS: VALID</span>
                  <span>Scan to Verify</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 7. COLLABORATIONS & PARTNERS */}
      <section id="collaborations-section" className="py-20 bg-slate-900/30 border-b border-slate-900 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
              <Handshake className="w-3.5 h-3.5 text-amber-400" />
              Collaborations & Partners
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Our Collaboration
            </h2>
            <p className="text-slate-400 text-sm mt-3 leading-relaxed">
              Empowering students through academic collaboration, mentorship, and comprehensive mathematics & learning resources.
            </p>
          </div>

          {collaborations.length === 0 ? (
            <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800 text-center text-slate-400 text-sm">
              Loading collaborations...
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-1 max-w-4xl mx-auto gap-6">
              {collaborations.map((collab) => (
                <div
                  key={collab.id}
                  className="p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-amber-500/20 hover:border-amber-500/40 shadow-2xl transition-all relative group overflow-hidden"
                >
                  {/* Decorative badge glow */}
                  <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-amber-500/10 via-transparent to-transparent rounded-bl-full pointer-events-none" />

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
                    <div className="flex items-start sm:items-center gap-4">
                      {collab.logoUrl ? (
                        <div className="w-16 h-16 rounded-2xl bg-white/10 border border-amber-500/30 p-1 flex items-center justify-center shrink-0 shadow-inner overflow-hidden">
                          <img
                            src={collab.logoUrl}
                            alt={`${collab.name} Logo`}
                            className="w-full h-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
                          <Handshake className="w-7 h-7" />
                        </div>
                      )}
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider">
                            {collab.category || 'Education & Learning Partner'}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Active Collaboration
                          </span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-white mt-2 font-sans tracking-tight">
                          {collab.name}
                        </h3>
                      </div>
                    </div>

                    {/* Email Contact CTA */}
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`mailto:${collab.email}`}
                        className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-900/20 transition-transform transform hover:-translate-y-0.5"
                      >
                        <Mail className="w-4 h-4" /> Contact Partner
                      </a>
                      <button
                        onClick={() => handleCopyEmail(collab.email)}
                        title="Copy Email Address"
                        className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors"
                      >
                        {copiedEmail === collab.email ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="pt-6 space-y-4">
                    <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                      {collab.description}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Official Partner Email</span>
                          <p className="text-xs sm:text-sm font-mono font-bold text-amber-300 select-all">
                            {collab.email}
                          </p>
                        </div>
                        <button
                          onClick={() => handleCopyEmail(collab.email)}
                          className="text-xs text-slate-400 hover:text-amber-400 font-medium px-2 py-1 bg-slate-900 rounded border border-slate-800"
                        >
                          {copiedEmail === collab.email ? 'Copied' : 'Copy'}
                        </button>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Collaboration Scope</span>
                          <p className="text-xs sm:text-sm font-medium text-white">
                            Support & Academic Learning Resources
                          </p>
                        </div>
                        <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded text-[11px] font-mono text-emerald-400">
                          Verified
                        </span>
                      </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>
      </section>

      {/* 8. FAQ */}
      <section className="py-20 bg-slate-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-amber-400 text-xs font-bold uppercase tracking-wider">Got Questions?</p>
            <h2 className="text-3xl font-extrabold text-white mt-1">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between text-sm font-bold text-white hover:text-amber-400 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${openFaq === idx ? 'rotate-180 text-amber-400' : 'text-slate-400'}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};
