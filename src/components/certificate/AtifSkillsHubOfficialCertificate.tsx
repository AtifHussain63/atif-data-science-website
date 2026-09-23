import React, { useState, useEffect } from 'react';
import { Calendar, Award, ShieldCheck } from 'lucide-react';
import QRCode from 'qrcode';
import { Certificate } from '../../types';
import { AtifFounderSignature } from './AtifFounderSignature';

interface AtifSkillsHubOfficialCertificateProps {
  certificate: Certificate;
  qrCodeUrl?: string;
  className?: string;
}

export const AtifSkillsHubOfficialCertificate: React.FC<AtifSkillsHubOfficialCertificateProps> = ({
  certificate,
  qrCodeUrl: propQrCodeUrl,
  className = '',
}) => {
  const [activeQrUrl, setActiveQrUrl] = useState<string>(propQrCodeUrl || '');

  const studentName = certificate.studentName || 'Atif Hussain';
  const courseName = certificate.courseName;
  const completionDate = certificate.completionDate || '27 August 2026';
  const certId = certificate.certificateId || 'ASH-2026-00001';
  const authorizedName = certificate.authorizedName || 'ATIF HUSSAIN';

  // Automatically generate QR code if not provided as prop
  useEffect(() => {
    if (propQrCodeUrl) {
      setActiveQrUrl(propQrCodeUrl);
      return;
    }
    const targetUrl =
      certificate.verificationUrl ||
      `${window.location.origin}/#verify/${certId}`;
    
    QRCode.toDataURL(targetUrl, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 256,
      color: {
        dark: '#081838',
        light: '#ffffff',
      },
    })
      .then((url) => setActiveQrUrl(url))
      .catch((err) => console.warn('QR Code generation notice:', err));
  }, [propQrCodeUrl, certificate.verificationUrl, certId]);

  return (
    <div
      id="atif-official-certificate-container"
      className={`w-full aspect-[1.414/1] bg-white text-slate-900 relative overflow-hidden select-text ${className}`}
      style={{
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.4)',
        fontFamily: "'Montserrat', sans-serif",
      }}
    >
      {/* ========================================================================= */}
      {/* 1. OUTER DEEP NAVY BORDER & INNER GOLDEN LINE TRIM                       */}
      {/* ========================================================================= */}
      {/* Outer Navy Border (14px equivalent in vector/CSS) */}
      <div className="absolute inset-0 border-[8px] sm:border-[12px] md:border-[14px] border-[#081838] pointer-events-none z-10">
        {/* Inner Golden Double Border */}
        <div className="w-full h-full border border-[#d4af37]/80 p-0.5 sm:p-1">
          <div className="w-full h-full border-[1.5px] border-[#c99a3e] relative"></div>
        </div>
      </div>

      {/* Subtle luxury geometric diamond watermark background */}
      <div className="absolute inset-0 bg-[#ffffff] opacity-100 z-0 pointer-events-none">
        <svg className="w-full h-full opacity-[0.02]" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <defs>
            <pattern id="ash-cert-pattern" width="36" height="36" patternUnits="userSpaceOnUse">
              <path d="M 18 0 L 36 18 L 18 36 L 0 18 Z" fill="none" stroke="#081838" strokeWidth="1" />
              <circle cx="18" cy="18" r="1.5" fill="#c99a3e" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#ash-cert-pattern)" />
        </svg>
      </div>

      {/* ========================================================================= */}
      {/* 2. TOP-LEFT ANGLED GEOMETRIC RIBBONS (Navy, Cyan, Magenta, Gold)         */}
      {/* ========================================================================= */}
      <div className="absolute top-0 left-0 w-[23%] h-[30%] z-10 pointer-events-none overflow-hidden">
        <svg viewBox="0 0 230 300" className="w-full h-full" preserveAspectRatio="none">
          {/* Magenta / Pink background accent */}
          <polygon points="0,0 210,0 0,270" fill="#E6007E" />
          {/* Gold separator line 1 */}
          <polygon points="0,0 185,0 0,240" fill="#E5B858" />
          {/* Vibrant Cyan Ribbon */}
          <polygon points="0,0 175,0 0,225" fill="#00A2DB" />
          {/* Gold separator line 2 */}
          <polygon points="0,0 130,0 0,165" fill="#E5B858" />
          {/* Deep Navy Blue main triangular ribbon */}
          <polygon points="0,0 120,0 0,150" fill="#081838" />
        </svg>
      </div>

      {/* ========================================================================= */}
      {/* 3. BOTTOM-LEFT ANGLED GEOMETRIC RIBBONS (Magenta, Navy, Cyan, Gold)      */}
      {/* ========================================================================= */}
      <div className="absolute bottom-0 left-0 w-[10%] sm:w-[13%] h-[14%] sm:h-[18%] z-0 pointer-events-none overflow-hidden">
        <svg viewBox="0 0 140 180" className="w-full h-full" preserveAspectRatio="none">
          {/* Magenta / Rose Pink large lower accent */}
          <polygon points="0,180 0,50 140,180" fill="#E6007E" />
          {/* Gold separator line */}
          <polygon points="0,180 0,90 110,180" fill="#E5B858" />
          {/* Deep Navy triangular slice */}
          <polygon points="0,180 0,100 100,180" fill="#081838" />
          {/* Cyan corner slice */}
          <polygon points="0,180 0,140 55,180" fill="#00A2DB" />
        </svg>
      </div>

      {/* ========================================================================= */}
      {/* 4. LEFT SCALLOPED ROSETTE MEDAL WITH RIBBON (LEARNING / GROWTH / SUCCESS) */}
      {/* ========================================================================= */}
      <div className="absolute top-[34%] sm:top-[36%] left-[3.5%] sm:left-[5%] z-20 pointer-events-none flex flex-col items-center select-none">
        {/* Hanging Ribbons Behind Badge */}
        <div className="absolute top-8 sm:top-10 flex justify-center gap-1 w-10 sm:w-14 h-12 sm:h-16 -z-10">
          {/* Blue ribbon tail */}
          <div
            className="w-3 sm:w-4 h-12 sm:h-16 bg-[#081838] shadow-xs"
            style={{
              clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)',
            }}
          />
          {/* Magenta ribbon tail */}
          <div
            className="w-3 sm:w-4 h-12 sm:h-16 bg-[#E6007E] shadow-xs"
            style={{
              clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)',
            }}
          />
        </div>

        {/* Golden Rosette 24-point Scallop Seal */}
        <div className="relative w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 flex items-center justify-center filter drop-shadow-md">
          <svg viewBox="0 0 120 120" className="w-full h-full">
            <defs>
              <linearGradient id="ash-gold-medal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FDE68A" />
                <stop offset="35%" stopColor="#D4AF37" />
                <stop offset="70%" stopColor="#926207" />
                <stop offset="100%" stopColor="#F5D77F" />
              </linearGradient>
            </defs>

            {/* 24-point Scalloped Starburst */}
            <path
              d="M 60 4 
                 L 67 11 L 76 6 L 81 16 L 91 14 L 94 24 L 104 26 L 104 36 L 113 42 L 109 52 L 116 60 L 109 68 L 113 78 L 104 84 L 104 94 L 94 96 L 91 106 L 81 104 L 76 114 L 67 109 L 60 116 L 53 109 L 44 114 L 39 104 L 29 106 L 26 96 L 16 94 L 16 84 L 7 78 L 11 68 L 4 60 L 11 52 L 7 42 L 16 36 L 16 26 L 26 24 L 29 14 L 39 16 L 44 6 L 53 11 Z"
              fill="url(#ash-gold-medal-grad)"
              stroke="#784e00"
              strokeWidth="1.2"
            />

            {/* Inner Gold Beaded Ring */}
            <circle cx="60" cy="60" r="44" fill="#081838" stroke="#E5B858" strokeWidth="2" />
            <circle cx="60" cy="60" r="41" fill="none" stroke="#D4AF37" strokeWidth="0.8" strokeDasharray="2,2" />

            {/* 3 Gold Stars */}
            <g fill="#F5D77F">
              <path d="M 50 34 L 51 37 L 54 37 L 51.5 39 L 52.5 42 L 50 40 L 47.5 42 L 48.5 39 L 46 37 L 49 37 Z" />
              <path d="M 60 30 L 61.2 33.5 L 65 33.5 L 62 35.8 L 63.2 39.5 L 60 37.2 L 56.8 39.5 L 58 35.8 L 55 33.5 L 58.8 33.5 Z" />
              <path d="M 70 34 L 71 37 L 74 37 L 71.5 39 L 72.5 42 L 70 40 L 67.5 42 L 68.5 39 L 66 37 L 69 37 Z" />
            </g>
          </svg>

          {/* Text inside the badge */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pt-2 sm:pt-2.5 text-center pointer-events-none">
            <span className="text-[5px] sm:text-[6.5px] md:text-[7.5px] font-black text-white tracking-widest leading-tight">
              LEARNING
            </span>
            <span className="text-[5px] sm:text-[6.5px] md:text-[7.5px] font-black text-white tracking-widest leading-tight">
              GROWTH
            </span>
            <span className="text-[5px] sm:text-[6.5px] md:text-[7.5px] font-black text-amber-300 tracking-widest leading-tight">
              SUCCESS
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4.1 RIGHT SIDE COMPACT "SCAN TO VERIFY" BADGE                             */}
      {/* ========================================================================= */}
      <div className="absolute top-[34%] sm:top-[36%] right-[3.5%] sm:right-[5%] z-20 flex flex-col items-center select-none">
        <div className="bg-white/95 backdrop-blur-xs p-1 sm:p-1.5 rounded-lg border border-[#D4AF37] shadow-md flex flex-col items-center hover:scale-105 transition-transform duration-200">
          <div className="bg-slate-50 p-0.5 rounded border border-slate-200 shadow-inner">
            {activeQrUrl ? (
              <img
                src={activeQrUrl}
                alt="Certificate Verification QR Code"
                className="w-8 h-8 sm:w-11 sm:h-11 md:w-14 md:h-14 object-contain rounded"
              />
            ) : (
              <div className="w-8 h-8 sm:w-11 sm:h-11 md:w-14 md:h-14 bg-slate-100 flex items-center justify-center rounded">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-[#00A2DB]" />
              </div>
            )}
          </div>
          <div className="mt-0.5 flex flex-col items-center text-center">
            <span className="text-[5.5px] sm:text-[7.5px] font-black text-[#081838] uppercase tracking-wider leading-none">
              Scan To Verify
            </span>
            <span className="text-[4.5px] sm:text-[6px] font-bold text-[#00A2DB] tracking-tight mt-0.5">
              Online Verification
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. MAIN CONTENT BODY (HEADER, TITLE, NAME, STATEMENT, SIGNATURES, FOOTER)  */}
      {/* ========================================================================= */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between px-6 sm:px-12 md:px-16 pt-3 sm:pt-4 md:pt-5 pb-2.5 sm:pb-3.5 md:pb-4">
        
        {/* --------------------------------------------------------------------- */}
        {/* TOP HEADER: DUAL PARTNER LOGOS (Atif Skills Hub | Math Seeker Academy) */}
        {/* --------------------------------------------------------------------- */}
        <div className="w-full flex items-center justify-center gap-6 sm:gap-8 pt-0.5">
          {/* Left: ATIF SKILLS HUB */}
          <div className="flex items-center gap-2">
            {certificate.logoUrl ? (
              <img
                src={certificate.logoUrl}
                alt={certificate.websiteName || 'Atif Skills Hub'}
                className="w-9 h-9 sm:w-11 sm:h-11 object-contain rounded-md shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              /* Custom Modern "A" Ribbon Logo Icon */
              <div className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {/* Stylized Cyan and Navy 3D "A" ribbon */}
                  <polygon points="15,85 45,15 65,15 35,85" fill="#00A2DB" />
                  <polygon points="45,15 85,85 65,85 38,35" fill="#081838" />
                  <polygon points="25,58 75,58 70,70 32,70" fill="#00A2DB" />
                  <circle cx="85" cy="20" r="4" fill="#00A2DB" />
                  <circle cx="92" cy="28" r="2.5" fill="#00A2DB" />
                </svg>
              </div>
            )}
            <div className="flex flex-col">
              <div className="flex items-center">
                <span className="text-base sm:text-lg md:text-xl font-black text-[#081838] tracking-wider leading-none">ATIF</span>
              </div>
              <div className="bg-[#00A2DB] text-white px-2 py-0.5 rounded-xs text-[7px] sm:text-[8px] md:text-[8.5px] font-black tracking-wider uppercase text-center mt-0.5">
                SKILLS HUB
              </div>
              <span className="text-[5.5px] sm:text-[6.5px] md:text-[7px] text-slate-500 font-medium tracking-tight mt-0.5">
                Empowering Careers, Transforming Skills
              </span>
            </div>
          </div>

          {/* Center Vertical Divider */}
          <div className="h-8 sm:h-9 w-[1.5px] bg-slate-300 mx-1"></div>

          {/* Right: MATHEMATICS & SEEKER ACADEMY (Original Real Logo) */}
          <div className="flex items-center gap-2.5">
            {/* If a custom uploaded partner logo exists, show it directly; otherwise show the exact 3D folded ribbon logo */}
            {certificate.collaborationLogoUrl ? (
              <img
                src={certificate.collaborationLogoUrl}
                alt="Mathematics & Seeker Academy"
                className="w-9 h-9 sm:w-11 sm:h-11 object-contain rounded-md shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              /* Real Mathematics & Seeker Academy 3D Folded Ribbon Logo matching user image */
              <div className="w-9 h-9 sm:w-11 sm:h-11 flex-shrink-0 relative flex items-center justify-center">
                <svg viewBox="0 0 120 120" className="w-full h-full filter drop-shadow-sm" fill="none">
                  <defs>
                    {/* Top Loop Gradient (Bright Vibrant Red/Rose/Pink with Top Glow) */}
                    <linearGradient id="mathseeker-top-grad" x1="20%" y1="0%" x2="80%" y2="100%">
                      <stop offset="0%" stopColor="#FF4A7A" />
                      <stop offset="35%" stopColor="#E6004C" />
                      <stop offset="100%" stopColor="#C4003E" />
                    </linearGradient>

                    {/* Inside 3D Shadow Fold (Deep Crimson / Dark Burgundy) */}
                    <linearGradient id="mathseeker-shadow-fold" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#4A0014" />
                      <stop offset="50%" stopColor="#750024" />
                      <stop offset="100%" stopColor="#A80036" />
                    </linearGradient>

                    {/* Bottom Diagonal Ribbon Band (Rich Crimson to Vibrant Rose) */}
                    <linearGradient id="mathseeker-bottom-grad" x1="0%" y1="30%" x2="100%" y2="70%">
                      <stop offset="0%" stopColor="#9E002E" />
                      <stop offset="45%" stopColor="#D90045" />
                      <stop offset="100%" stopColor="#FF2E6B" />
                    </linearGradient>

                    {/* Glossy Top Edge Highlight */}
                    <linearGradient id="mathseeker-gloss" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#FFA3BE" stopOpacity="0.9" />
                      <stop offset="60%" stopColor="#FF4D80" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#E6004C" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* 1. Inside 3D Shadow Fold (The inner recessed curve behind the loop) */}
                  <path
                    d="M 52 24 C 64 24 74 34 76 46 C 77 56 68 68 54 78 C 48 70 48 58 56 46 C 60 40 60 32 54 26 Z"
                    fill="url(#mathseeker-shadow-fold)"
                  />

                  {/* 2. Main Bottom Diagonal Crossing Ribbon */}
                  <path
                    d="M 28 72 L 48 52 C 54 46 62 42 70 48 C 76 52 82 60 90 74 L 66 74 C 60 66 56 62 50 62 L 38 74 Z"
                    fill="url(#mathseeker-bottom-grad)"
                  />

                  {/* 3. Upper Folded Ribbon Arc (Front looping face with sharp left tail) */}
                  <path
                    d="M 28 54 C 32 44 38 32 46 25 C 54 18 68 18 78 26 C 88 34 88 48 82 58 C 76 66 66 72 58 72 C 64 64 72 56 74 46 C 76 34 68 28 58 28 C 48 28 42 36 38 46 L 28 54 Z"
                    fill="url(#mathseeker-top-grad)"
                  />

                  {/* 4. Crisp Top Highlight Sheen */}
                  <path
                    d="M 38 46 C 42 34 50 28 60 28 C 70 28 76 34 74 46"
                    stroke="url(#mathseeker-gloss)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            )}
            <div className="flex flex-col text-left">
              <span
                className="text-[10px] sm:text-[11px] md:text-xs font-black text-[#E6004C] italic leading-tight"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Mathematics &amp;
              </span>
              <span
                className="text-[10px] sm:text-[11px] md:text-xs font-black text-[#081838] italic leading-none"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                seeker academy
              </span>
              <span
                className="text-[6px] sm:text-[7px] md:text-[7.5px] text-[#4A0014] font-medium italic tracking-tight mt-0.5"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Research to explore
              </span>
            </div>
          </div>
        </div>

        {/* --------------------------------------------------------------------- */}
        {/* TITLE: CERTIFICATE OF APPRECIATION                                   */}
        {/* --------------------------------------------------------------------- */}
        <div className="text-center mt-0.5">
          <h1
            className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-[#081838] tracking-[0.16em] leading-tight"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            CERTIFICATE
          </h1>

          {/* Subtitle flanked with golden diamond lines */}
          <div className="flex items-center justify-center gap-2 mt-0.5">
            <div className="flex items-center gap-1">
              <span className="w-5 sm:w-8 md:w-10 h-[1px] bg-[#c99a3e]"></span>
              <span className="w-1.5 h-1.5 rotate-45 bg-[#c99a3e]"></span>
            </div>
            <span
              className="text-[8px] sm:text-[10px] md:text-[11px] font-bold text-[#081838] tracking-[0.22em] uppercase"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              OF APPRECIATION
            </span>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rotate-45 bg-[#c99a3e]"></span>
              <span className="w-5 sm:w-8 md:w-10 h-[1px] bg-[#c99a3e]"></span>
            </div>
          </div>
        </div>

        {/* --------------------------------------------------------------------- */}
        {/* STUDENT PRESENTATION & DYNAMIC SIMPLE CLEAN NAME                      */}
        {/* --------------------------------------------------------------------- */}
        <div className="text-center mt-0.5 max-w-[62%] sm:max-w-[70%] md:max-w-[75%] mx-auto">
          <p className="text-[7px] sm:text-[8.5px] md:text-[9.5px] text-slate-600 font-medium tracking-wide">
            This Certificate is Proudly Presented to
          </p>

          {/* Dynamic Student Name (Simple, Prestigious, Clean Design) */}
          <div className="relative inline-block my-0.5 sm:my-1 px-3 max-w-full">
            <h2
              className="text-lg sm:text-2xl md:text-3xl lg:text-[34px] font-extrabold text-[#081838] tracking-wider truncate leading-tight uppercase"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                letterSpacing: '0.04em',
              }}
            >
              {studentName}
            </h2>
            {/* Elegant Simple Clean Underline with Diamond Accent */}
            <div className="flex items-center justify-center gap-1.5 mt-0.5 sm:mt-1">
              <span className="w-8 sm:w-16 md:w-28 h-[1.5px] bg-[#c99a3e]"></span>
              <span className="w-1.5 h-1.5 rotate-45 bg-[#c99a3e]"></span>
              <span className="w-8 sm:w-16 md:w-28 h-[1.5px] bg-[#c99a3e]"></span>
            </div>
          </div>
        </div>

        {/* --------------------------------------------------------------------- */}
        {/* COURSE COMPLETION STATEMENT                                          */}
        {/* --------------------------------------------------------------------- */}
        <div className="text-center max-w-[62%] sm:max-w-[70%] md:max-w-[75%] mx-auto">
          <p className="text-[7px] sm:text-[8px] md:text-[9px] text-slate-700 leading-tight font-normal">
            For successfully completing the course / program organized by
          </p>
          <div className="flex items-center justify-center flex-wrap gap-x-1.5 gap-y-0.5 my-0.5">
            <span className="text-[8px] sm:text-[9.5px] md:text-[11px] font-black text-[#081838]">
              Atif Skills Hub
            </span>
            <span className="text-[7.5px] sm:text-[8.5px] md:text-[10px] font-medium text-slate-500">
              and
            </span>
            <span className="text-[8px] sm:text-[9.5px] md:text-[11px] font-black text-[#E6007E]">
              Mathematics Seeker Academy
            </span>
          </div>
          {courseName && (
            <div className="inline-block my-0.5 px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-full">
              <p className="text-[7px] sm:text-[8px] md:text-[9px] font-bold text-[#00A2DB]">
                &ldquo;{courseName}&rdquo;
              </p>
            </div>
          )}
          <p className="text-[6.5px] sm:text-[7.5px] md:text-[8.5px] text-slate-600 leading-tight">
            In recognition of your dedication, hard work, and commitment to learning.
          </p>
          <p className="text-[7px] sm:text-[8px] md:text-[9px] font-bold text-[#081838] mt-0.5">
            Keep Learning, Keep Growing!
          </p>
        </div>

        {/* --------------------------------------------------------------------- */}
        {/* SIGNATURES, GOLDEN LAUREL SEAL & EMBEDDED QR CODE                      */}
        {/* --------------------------------------------------------------------- */}
        <div className="w-full grid grid-cols-12 items-end pt-0.5 px-2 sm:px-6">
          {/* Left: Founder Signature */}
          <div className="col-span-4 text-center flex flex-col items-center">
            {/* Real Signature stroke matching handwritten image */}
            <div className="h-8 sm:h-10 md:h-12 flex items-end justify-center mb-0.5">
              {certificate.signatureUrl ? (
                <img
                  src={certificate.signatureUrl}
                  alt="Founder Signature"
                  className="max-h-8 sm:max-h-10 object-contain mx-auto"
                />
              ) : (
                <AtifFounderSignature
                  className="h-8 sm:h-10 md:h-12 w-auto filter drop-shadow-xs"
                  color="#002D84"
                />
              )}
            </div>
            <div className="w-24 sm:w-30 h-[1.5px] bg-[#081838] mt-0.5 mb-0.5"></div>
            <span className="text-[8px] sm:text-[9px] md:text-[9.5px] font-black text-[#081838] uppercase tracking-wider block leading-tight">
              {authorizedName}
            </span>
            <span className="text-[7px] sm:text-[7.5px] text-[#081838] font-bold block leading-tight">
              Founder
            </span>
            <span className="text-[7px] sm:text-[7.5px] text-[#00A2DB] font-bold block leading-tight">
              Atif Skills Hub
            </span>
          </div>

          {/* Center: Golden Laurel Wreath Seal */}
          <div className="col-span-4 flex flex-col items-center justify-center text-center">
            <div className="relative w-14 h-11 sm:w-18 sm:h-13 md:w-20 md:h-14 flex items-center justify-center">
              <svg viewBox="0 0 160 120" className="w-full h-full">
                {/* 3 Gold Stars Top */}
                <g fill="#D4AF37">
                  <path d="M 68 18 L 69.5 22 L 73.5 22 L 70.5 24.5 L 71.5 28.5 L 68 26 L 64.5 28.5 L 65.5 24.5 L 62.5 22 L 66.5 22 Z" />
                  <path d="M 80 12 L 81.8 17 L 87 17 L 83 20 L 84.5 25 L 80 22 L 75.5 25 L 77 20 L 73 17 L 78.2 17 Z" />
                  <path d="M 92 18 L 93.5 22 L 97.5 22 L 94.5 24.5 L 95.5 28.5 L 92 26 L 88.5 28.5 L 89.5 24.5 L 86.5 22 L 90.5 22 Z" />
                </g>

                {/* Left Laurel Branch */}
                <path
                  d="M 30 85 C 20 60, 35 30, 70 25 C 65 35, 45 50, 48 85 Z"
                  fill="none"
                  stroke="#C99A3E"
                  strokeWidth="2"
                />
                {/* Left Laurel Leaves */}
                <g fill="#D4AF37">
                  <path d="M 40 38 Q 30 35 35 48 Q 45 42 40 38 Z" />
                  <path d="M 32 52 Q 22 52 30 63 Q 38 56 32 52 Z" />
                  <path d="M 32 68 Q 24 72 34 80 Q 40 73 32 68 Z" />
                  <path d="M 40 82 Q 35 88 48 90 Q 50 82 40 82 Z" />
                </g>

                {/* Right Laurel Branch */}
                <path
                  d="M 130 85 C 140 60, 125 30, 90 25 C 95 35, 115 50, 112 85 Z"
                  fill="none"
                  stroke="#C99A3E"
                  strokeWidth="2"
                />
                {/* Right Laurel Leaves */}
                <g fill="#D4AF37">
                  <path d="M 120 38 Q 130 35 125 48 Q 115 42 120 38 Z" />
                  <path d="M 128 52 Q 138 52 130 63 Q 122 56 128 52 Z" />
                  <path d="M 128 68 Q 136 72 126 80 Q 120 73 128 68 Z" />
                  <path d="M 120 82 Q 125 88 112 90 Q 110 82 120 82 Z" />
                </g>
              </svg>

              {/* Text inside laurel */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                <span className="text-[5px] sm:text-[6px] md:text-[6.5px] font-black text-[#081838] tracking-wider leading-tight">
                  COMMITMENT
                </span>
                <span className="text-[5px] sm:text-[6px] md:text-[6.5px] font-black text-[#081838] tracking-wider leading-tight">
                  KNOWLEDGE
                </span>
                <span className="text-[5px] sm:text-[6px] md:text-[6.5px] font-black text-[#c99a3e] tracking-wider leading-tight">
                  EXCELLENCE
                </span>
              </div>
            </div>
          </div>

          {/* Right: Academy Signature */}
          <div className="col-span-4 text-center flex flex-col items-center">
            <div className="h-8 sm:h-10 md:h-12 flex items-end justify-center mb-0.5">
              {certificate.partnerSignatureUrl ? (
                <img
                  src={certificate.partnerSignatureUrl}
                  alt="Academy Signature"
                  className="max-h-8 sm:max-h-10 object-contain mx-auto"
                />
              ) : (
                /* Real hand-drawn signature for Mathematics & Seeker Academy (Dost) matching uploaded photo */
                <svg
                  viewBox="0 0 100 95"
                  className="h-8 sm:h-10 md:h-12 w-24 sm:w-28 text-[#182d7a] filter drop-shadow-xs"
                  fill="none"
                >
                  <path
                    d="M 10 62 L 28 33"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M 28 33 L 22 58"
                    stroke="currentColor"
                    strokeWidth="2.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M 28 33 C 40 37, 55 41, 51 50 C 47 57, 26 57, 22 58"
                    stroke="currentColor"
                    strokeWidth="2.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M 44 54 C 44 48, 53 47, 53 52 C 53 56, 44 56, 44 52"
                    stroke="currentColor"
                    strokeWidth="2.1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M 52 49 C 58 46, 64 45, 64 48 C 64 52, 57 52, 62 55"
                    stroke="currentColor"
                    strokeWidth="2.1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M 62 55 C 65 54, 69 46, 70 38 L 67 60"
                    stroke="currentColor"
                    strokeWidth="2.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M 58 54 L 84 52"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 49 58 C 42 58, 29 61, 28 63 C 28 65, 45 64, 70 62"
                    stroke="currentColor"
                    strokeWidth="2.1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M 59 57 L 63 86"
                    stroke="currentColor"
                    strokeWidth="2.3"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 41 76 L 68 67"
                    stroke="currentColor"
                    strokeWidth="2.1"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 58 79 C 68 76, 75 77, 75 80 C 75 81.5, 62 81.5, 58 79"
                    stroke="currentColor"
                    strokeWidth="2.0"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <div className="w-24 sm:w-30 h-[1.5px] bg-[#081838] mt-0.5 mb-0.5"></div>
            <span className="text-[7.5px] sm:text-[8.5px] md:text-[9px] font-black text-[#081838] uppercase tracking-tight block leading-tight">
              MATHEMATICS &amp;
            </span>
            <span className="text-[7.5px] sm:text-[8.5px] md:text-[9px] font-black text-[#081838] uppercase tracking-tight block leading-tight">
              SEEKER ACADEMY
            </span>
            <span className="text-[6.5px] sm:text-[7px] text-[#E6007E] font-bold block leading-tight">
              Research to explore
            </span>
          </div>
        </div>

        {/* --------------------------------------------------------------------- */}
        {/* FOOTER: DATE (Left) & CERTIFICATE ID (Right)                          */}
        {/* --------------------------------------------------------------------- */}
        <div className="w-full flex items-center justify-between pt-1 pb-0.5 px-3 border-t border-slate-200 text-[8px] sm:text-[9px] md:text-[10px] text-slate-700">
          {/* Left: Date */}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#081838]" />
            <span className="font-bold text-slate-800">Date:</span>
            <span className="font-extrabold text-[#081838]">
              {completionDate}
            </span>
          </div>

          {/* Right: Certificate ID */}
          <div className="flex items-center gap-1.5">
            <Award className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#00A2DB]" />
            <span className="font-bold text-slate-800">Certificate ID:</span>
            <span className="font-mono font-extrabold text-[#081838]">
              {certId}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};

