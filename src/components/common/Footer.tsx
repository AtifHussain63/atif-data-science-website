import React from 'react';
import { GraduationCap, ShieldCheck, Mail, Globe, CheckCircle2 } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface FooterProps {
  onNavigate: (view: string, param?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer id="main-footer" className="bg-slate-950 border-t border-slate-900 text-slate-400 text-sm print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div
              onClick={() => onNavigate('home')}
              className="flex items-center gap-3 cursor-pointer select-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-400 p-0.5 shadow">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-amber-400" />
                </div>
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white font-sans">
                ATIF SKILLS HUB
              </span>
            </div>

            <p className="text-amber-400/90 font-medium text-sm">
              Learn Skills. Build Your Future. Get Certified.
            </p>

            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              Atif Skills Hub is an online learning platform for Data Science, AI, Programming, Data Analytics and Digital Skills in academic collaboration with <strong>Atif Skills Hub Support & Mathematics Seeker Academy</strong>.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                QR-Verifiable Credentials
              </span>
              <span className="flex items-center gap-1.5 text-blue-400 font-medium">
                <ShieldCheck className="w-4 h-4" />
                Industry Standards
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Explore
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('home')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Homepage
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('courses')}
                  className="hover:text-amber-400 transition-colors"
                >
                  All 46 Courses
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('courses', 'Data Science')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Data Science Track
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('courses', 'Machine Learning')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Machine Learning
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('courses', 'Artificial Intelligence')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Artificial Intelligence
                </button>
              </li>
            </ul>
          </div>

          {/* Certification Links */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Certifications
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('verify')}
                  className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors flex items-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verify Certificate
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('my-certificates')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Student Certificates
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('courses')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Assessment Criteria
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('auth', 'admin-login')}
                  className="hover:text-slate-300 text-slate-500 transition-colors"
                >
                  Admin Portal
                </button>
              </li>
            </ul>
          </div>

          {/* Contact & Legal */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Support & Contacts
            </h3>
            <ul className="space-y-2 text-xs">
              <li className="flex items-start gap-1.5 text-slate-400">
                <Mail className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block font-mono">Main Admin / Founder</span>
                  <a href="mailto:atifhuss773@gmail.com" className="text-slate-300 hover:text-amber-400">
                    atifhuss773@gmail.com
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-1.5 text-slate-400">
                <Mail className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block font-mono">Partner / Support</span>
                  <a href="mailto:dostdar.cui@gmail.com" className="text-slate-300 hover:text-blue-300">
                    dostdar.cui@gmail.com
                  </a>
                </div>
              </li>
              <li className="flex items-center gap-1.5 text-slate-400 pt-1">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                Global Online Platform
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2026 Atif Skills Hub. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline">Learn Skills. Build Your Future. Get Certified.</span>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
};
