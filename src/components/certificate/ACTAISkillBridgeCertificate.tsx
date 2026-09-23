import React from 'react';
import { Certificate } from '../../types';
import { ShieldCheck, Award } from 'lucide-react';

interface ACTAISkillBridgeCertificateProps {
  certificate: Certificate;
  qrCodeUrl?: string;
  className?: string;
}

export const ACTAISkillBridgeCertificate: React.FC<ACTAISkillBridgeCertificateProps> = ({
  certificate,
  qrCodeUrl,
  className = '',
}) => {
  const studentName = certificate.studentName || 'Atif Hussain';
  const university = 'KARAKORAM INTERNATIONAL UNIVERSITY, GILGIT';
  const courseName = certificate.courseName || 'ACT AI National AI Training Programme';
  const certNo = certificate.certificateId?.startsWith('ACTAI')
    ? certificate.certificateId
    : `ACTAI-C1-2026-${certificate.certificateId || '00460-SSW3'}`;
  const securityCode = '39ZGE-K7S3H';
  const issueDate = certificate.completionDate || '29 JULY 2026';
  const verifyHost = certificate.verificationUrl
    ? certificate.verificationUrl.replace(/^https?:\/\//, '')
    : 'ACTAI.AISKILLBRIDGE.PK/VERIFY';

  return (
    <div
      id="actai-official-certificate-container"
      className={`w-full aspect-[1.414/1] bg-[#FCFBF8] text-slate-900 relative overflow-hidden select-text ${className}`}
      style={{
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
        fontFamily: "'Montserrat', sans-serif",
      }}
    >
      {/* ========================================================================= */}
      {/* 1. DUAL LUXURY BORDERS (Teal outer & Gold inner)                         */}
      {/* ========================================================================= */}
      {/* Outer Deep Teal/Navy Border */}
      <div className="absolute inset-0 border-[8px] sm:border-[12px] md:border-[16px] border-[#0A3D44] pointer-events-none z-20">
        {/* Inner Gold Thin Border with corner spacing */}
        <div className="w-full h-full p-1 sm:p-1.5 border border-[#c49a45]/60">
          <div className="w-full h-full border-[1.5px] border-[#C49A45] relative">
            {/* Subtle corner golden squares */}
            <div className="absolute -top-1 -left-1 w-2 h-2 bg-[#C49A45]"></div>
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#C49A45]"></div>
            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-[#C49A45]"></div>
            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#C49A45]"></div>
          </div>
        </div>
      </div>

      {/* Subtle Guilloché / Parchment texture watermark */}
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none z-0">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="actai-guilloche" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 0 15 Q 15 0 30 15 Q 15 30 0 15 Z" fill="none" stroke="#0A3D44" strokeWidth="0.75" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#actai-guilloche)" />
        </svg>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN CERTIFICATE CONTENT                                              */}
      {/* ========================================================================= */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between px-8 sm:px-14 md:px-20 py-6 sm:py-8 md:py-10">
        
        {/* --------------------------------------------------------------------- */}
        {/* HEADER: AI SKILLBRIDGE (LEFT) & PARTNER LOGOS (RIGHT)                 */}
        {/* --------------------------------------------------------------------- */}
        <div className="w-full flex items-center justify-between pt-1 border-b border-slate-200/60 pb-3">
          {/* Left: AI SKILLBRIDGE LOGO */}
          <div className="flex items-center gap-2.5">
            {/* 4 Colored Geometric Squares / Blocks Logo */}
            <div className="grid grid-cols-2 gap-1 w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0">
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-[#0A3D44] rounded-tl-sm"></div>
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-[#00A3C4] rounded-tr-sm"></div>
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-[#2D3748] rounded-bl-sm"></div>
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-[#D97706] rounded-br-sm"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-sm sm:text-base md:text-lg font-black text-[#0A3D44] tracking-wider leading-none">
                AI SKILLBRIDGE
              </span>
              <span className="text-[6.5px] sm:text-[7.5px] md:text-[8px] font-bold text-[#64748B] uppercase tracking-[0.2em] mt-0.5">
                National AI Execution Partner
              </span>
            </div>
          </div>

          {/* Right: PARTNER LOGOS (PM Youth Programme, HEC, NAVTTC, AXI Tech) */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* 1. Prime Minister's Youth Programme */}
            <div className="flex flex-col items-center">
              <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <path d="M 20 50 C 20 25, 75 25, 75 50 C 75 75, 20 75, 20 50" fill="none" stroke="#15803D" strokeWidth="8" />
                  <path d="M 45 30 Q 65 30 65 50 Q 65 70 45 70 Q 55 50 45 30 Z" fill="#15803D" />
                  <circle cx="70" cy="35" r="5" fill="#15803D" />
                </svg>
              </div>
              <span className="text-[5.5px] sm:text-[6.5px] font-bold text-[#15803D] leading-tight tracking-tight">
                Prime Minister&apos;s
              </span>
              <span className="text-[4.5px] sm:text-[5.5px] text-slate-500 leading-none">
                Youth Programme
              </span>
            </div>

            {/* 2. Higher Education Commission (HEC) */}
            <div className="flex flex-col items-center">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-emerald-600 bg-white p-0.5 flex items-center justify-center shadow-xs">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <circle cx="50" cy="50" r="46" fill="none" stroke="#059669" strokeWidth="4" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#059669" strokeWidth="1" strokeDasharray="2,2" />
                  <text x="50" y="56" textAnchor="middle" fill="#065F46" fontSize="22" fontWeight="bold" fontFamily="sans-serif">
                    HEC
                  </text>
                </svg>
              </div>
            </div>

            {/* 3. NAVTTC */}
            <div className="flex flex-col items-center">
              <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#166534" strokeWidth="4" />
                  <path d="M 30 70 L 50 30 L 70 70 Z" fill="none" stroke="#166534" strokeWidth="3" />
                  <circle cx="50" cy="50" r="6" fill="#166534" />
                </svg>
              </div>
              <span className="text-[5px] sm:text-[6px] font-bold text-[#166534] tracking-tighter">
                NAVTTC
              </span>
            </div>

            {/* 4. AXI TECHNOLOGIES */}
            <div className="flex flex-col items-center">
              <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <polygon points="10,85 50,15 70,15 30,85" fill="#0284C7" />
                  <polygon points="50,15 90,85 70,85 40,35" fill="#0369A1" />
                  <polygon points="20,55 80,55 75,65 25,65" fill="#38BDF8" />
                </svg>
              </div>
              <span className="text-[5px] sm:text-[6px] font-extrabold text-[#0369A1] tracking-tighter">
                AXI TECHNOLOGIES
              </span>
            </div>
          </div>
        </div>

        {/* --------------------------------------------------------------------- */}
        {/* CERTIFICATE HEADING & ACT AI TITLE                                   */}
        {/* --------------------------------------------------------------------- */}
        <div className="text-center mt-1 sm:mt-2">
          {/* Spaced Gold Heading */}
          <p
            className="text-[9px] sm:text-[11px] md:text-[13px] font-bold text-[#C49A45] tracking-[0.35em] uppercase"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            CERTIFICATE OF COMPLETION
          </p>

          {/* Large Bold ACT AI */}
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-black text-[#0A3D44] tracking-tight mt-0.5 sm:mt-1 leading-none"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            ACT AI
          </h1>

          {/* Subtitle */}
          <p
            className="text-[9px] sm:text-[11px] md:text-[12px] font-serif italic text-slate-800 mt-1"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Awareness, Competency &amp; Tools Training for Artificial Intelligence
          </p>

          {/* Initiatives & Partnerships */}
          <p className="text-[7px] sm:text-[8.5px] md:text-[9.5px] text-slate-600 mt-0.5 font-serif italic">
            A National Initiative under the Prime Minister&apos;s Youth Programme
          </p>
          <p className="text-[6.5px] sm:text-[7.5px] md:text-[8.5px] text-slate-500 font-serif italic">
            Delivered in partnership with the Higher Education Commission and the National Vocational &amp; Technical Training Commission
          </p>

          {/* Diamond Separator */}
          <div className="flex items-center justify-center gap-2 mt-1 sm:mt-1.5">
            <span className="w-10 sm:w-16 h-[0.75px] bg-[#C49A45]"></span>
            <span className="w-1.5 h-1.5 rotate-45 bg-[#C49A45]"></span>
            <span className="w-10 sm:w-16 h-[0.75px] bg-[#C49A45]"></span>
          </div>
        </div>

        {/* --------------------------------------------------------------------- */}
        {/* STUDENT PRESENTATION & HIGH-CONTRAST NAME                             */}
        {/* --------------------------------------------------------------------- */}
        <div className="text-center mt-1">
          <p
            className="text-[8px] sm:text-[9.5px] md:text-[10.5px] text-slate-600 italic font-serif"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            This is to certify that
          </p>

          {/* Student Name */}
          <h2
            className="text-2xl sm:text-3xl md:text-4xl text-slate-900 font-black tracking-tight my-0.5 sm:my-1"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            {studentName}
          </h2>

          {/* University / Department / Institute */}
          <p className="text-[9px] sm:text-[11px] md:text-[12.5px] font-black text-[#00828A] tracking-wider uppercase mt-0.5">
            {university}
          </p>
        </div>

        {/* --------------------------------------------------------------------- */}
        {/* COMPLETION STATEMENT & 5 PILLARS OF STUDY                             */}
        {/* --------------------------------------------------------------------- */}
        <div className="text-center max-w-2xl mx-auto -mt-1">
          <p className="text-[7px] sm:text-[8.5px] md:text-[9.5px] text-slate-700 leading-relaxed font-normal">
            has successfully completed the eight-week ACT AI National AI Training Programme — Cycle 1, delivered live to HEC Smart Classrooms nationwide, fulfilling all requirements of attendance, the nationally proctored midterm, the final assessment and the Final Course Project, across the following areas of study:
          </p>

          {/* 5 Pillars of Study */}
          <div className="my-1.5 py-1 px-3 bg-[#0A3D44]/[0.03] border border-[#0A3D44]/15 rounded-md inline-block">
            <p className="text-[7px] sm:text-[8px] md:text-[9.5px] font-black text-[#0A3D44] tracking-wide uppercase">
              AI FOUNDATIONS &nbsp;·&nbsp; GENERATIVE AI &nbsp;·&nbsp; AGENTIC AI &nbsp;·&nbsp; AI TOOLS &amp; PRODUCTIVITY &nbsp;·&nbsp; FREELANCING WITH AI
            </p>
          </div>
        </div>

        {/* --------------------------------------------------------------------- */}
        {/* FOOTER: QR CODE (LEFT), GOLDEN SEAL (CENTER), CYCLE DETAILS (RIGHT)    */}
        {/* --------------------------------------------------------------------- */}
        <div className="w-full grid grid-cols-12 items-end pt-1 pb-1">
          
          {/* Left: QR Code & Verification Data */}
          <div className="col-span-4 flex items-start gap-2.5">
            {/* Live QR Code Box */}
            <div className="flex flex-col items-center bg-white p-1 rounded-sm border border-slate-300 shadow-2xs flex-shrink-0">
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt="Certificate Verification QR Code"
                  className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 object-contain"
                />
              ) : (
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-slate-100 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-[#0A3D44]" />
                </div>
              )}
            </div>

            {/* Metadata Text */}
            <div className="flex flex-col text-[6px] sm:text-[7px] md:text-[8px] text-slate-600 leading-tight">
              <span className="font-semibold text-slate-500 uppercase">CERTIFICATE NO.</span>
              <span className="font-mono font-bold text-slate-900">{certNo}</span>

              <div className="flex items-center gap-1 mt-0.5">
                <span className="font-semibold text-slate-500">SECURITY CODE</span>
                <span className="font-mono font-bold text-slate-800">{securityCode}</span>
              </div>

              <div className="flex items-center gap-1">
                <span className="font-semibold text-slate-500">DATE OF ISSUE</span>
                <span className="font-bold text-slate-800">{issueDate}</span>
              </div>

              <span className="font-mono text-[#00828A] font-semibold tracking-tight mt-0.5 uppercase truncate max-w-[140px]">
                {verifyHost}
              </span>

              <span className="text-[5.5px] sm:text-[6.5px] font-black text-[#C49A45] tracking-[0.2em] uppercase mt-0.5">
                S C A N &nbsp; T O &nbsp; V E R I F Y
              </span>
            </div>
          </div>

          {/* Center: Official Golden Seal */}
          <div className="col-span-4 flex justify-center">
            <div className="relative w-18 h-18 sm:w-22 sm:h-22 md:w-26 md:h-26 flex items-center justify-center">
              <svg viewBox="0 0 140 140" className="w-full h-full">
                <defs>
                  <linearGradient id="actai-gold-seal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F9E8A2" />
                    <stop offset="40%" stopColor="#C49A45" />
                    <stop offset="70%" stopColor="#8C6615" />
                    <stop offset="100%" stopColor="#DFBF68" />
                  </linearGradient>
                  {/* Circular Text Paths */}
                  <path id="upper-seal-path" d="M 22 70 A 48 48 0 0 1 118 70" fill="none" />
                  <path id="lower-seal-path" d="M 118 70 A 48 48 0 0 1 22 70" fill="none" />
                </defs>

                {/* Outer Gear / Scallop Teeth */}
                <circle cx="70" cy="70" r="66" fill="none" stroke="url(#actai-gold-seal-grad)" strokeWidth="3" strokeDasharray="3,2" />
                <circle cx="70" cy="70" r="62" fill="none" stroke="#C49A45" strokeWidth="1.5" />
                <circle cx="70" cy="70" r="58" fill="#FFFDF8" stroke="#C49A45" strokeWidth="1" />

                {/* Curved Text Top: NATIONAL AI TRAINING INITIATIVE */}
                <text fill="#0A3D44" fontSize="6" fontWeight="bold" letterSpacing="1">
                  <textPath href="#upper-seal-path" startOffset="50%" textAnchor="middle">
                    ★ NATIONAL AI TRAINING INITIATIVE ★
                  </textPath>
                </text>

                {/* Curved Text Bottom: PRIME MINISTER'S YOUTH PROGRAMME */}
                <text fill="#0A3D44" fontSize="5.5" fontWeight="bold" letterSpacing="0.8">
                  <textPath href="#lower-seal-path" startOffset="50%" textAnchor="middle">
                    PRIME MINISTER&apos;S YOUTH PROGRAMME
                  </textPath>
                </text>

                {/* Inner Gold Box for ACT AI */}
                <circle cx="70" cy="70" r="34" fill="none" stroke="#C49A45" strokeWidth="1" strokeDasharray="2,2" />
                <rect x="42" y="55" width="56" height="30" fill="#0A3D44" rx="3" />
                
                <text x="70" y="68" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="900" fontFamily="sans-serif">
                  ACT AI
                </text>
                <text x="70" y="76" textAnchor="middle" fill="#F9E8A2" fontSize="5" fontWeight="bold" letterSpacing="1">
                  CYCLE 1
                </text>
                <text x="70" y="82" textAnchor="middle" fill="#FFFFFF" fontSize="4.5" fontWeight="bold" letterSpacing="1.5">
                  2 0 2 6
                </text>
              </svg>
            </div>
          </div>

          {/* Right: Cohort & Venue Details */}
          <div className="col-span-4 text-right flex flex-col items-end text-[7px] sm:text-[8px] md:text-[9px] text-slate-700 leading-relaxed">
            <span className="font-black text-[#0A3D44] uppercase tracking-wider">
              ACT AI &nbsp;·&nbsp; CYCLE 1
            </span>
            <span className="font-semibold text-slate-600">
              8 JUNE &ndash; 29 JULY 2026
            </span>
            <span className="font-medium text-slate-500 uppercase tracking-tight">
              HEC CENTRAL STUDIO, ISLAMABAD
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};
