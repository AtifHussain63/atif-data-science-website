import React, { useEffect, useState, useRef } from 'react';
import {
  Copy,
  Check,
  ShieldCheck,
  AlertTriangle,
  Printer,
  Handshake,
  QrCode,
  Sparkles,
  LayoutTemplate,
  Download,
  FileDown,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { Certificate, CertificateTemplate, CertificateFieldPosition } from '../../types';
import { generateVerificationQRCode } from '../../services/certificateService';
import {
  getCertificateTemplateById,
  getDefaultCertificateTemplate,
  formatTemplatePlaceholderText,
  DEFAULT_CERTIFICATE_FIELDS,
} from '../../services/templateService';
import { useToast } from '../../context/ToastContext';
import { AtifSkillsHubOfficialCertificate } from './AtifSkillsHubOfficialCertificate';
import { ACTAISkillBridgeCertificate } from './ACTAISkillBridgeCertificate';
import { downloadCertificatePDF, downloadCertificateImage } from './PDFGenerator';

interface CertificateViewProps {
  certificate: Certificate;
  template?: CertificateTemplate | null;
  showActions?: boolean;
  onClose?: () => void;
  previewMode?: boolean;
  defaultDesign?: 'actai' | 'ash';
}

export const CertificateView: React.FC<CertificateViewProps> = ({
  certificate,
  template: propTemplate,
  showActions = true,
  onClose,
  previewMode = false,
  defaultDesign = 'ash',
}) => {
  const { success, error } = useToast();
  const [activeTemplate, setActiveTemplate] = useState<CertificateTemplate | null>(propTemplate || null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [showQRModal, setShowQRModal] = useState<boolean>(false);
  const [mobileViewMode, setMobileViewMode] = useState<'fit' | 'scroll'>('fit');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [isDownloadingImage, setIsDownloadingImage] = useState<boolean>(false);
  const [selectedDesign, setSelectedDesign] = useState<'actai' | 'ash'>(
    certificate.courseName?.includes('ACT AI') || certificate.certificateId?.includes('ACTAI') ? 'actai' : defaultDesign
  );
  const certificateRef = useRef<HTMLDivElement>(null);

  const verificationUrl =
    certificate.verificationUrl ||
    `${window.location.origin}/#verify/${certificate.certificateId}`;

  // Load template if not passed as prop
  useEffect(() => {
    if (propTemplate) {
      setActiveTemplate(propTemplate);
      return;
    }

    let isMounted = true;
    const loadTemplate = async () => {
      try {
        if (certificate.templateId) {
          const t = await getCertificateTemplateById(certificate.templateId);
          if (isMounted && t) {
            setActiveTemplate(t);
            return;
          }
        }
        const def = await getDefaultCertificateTemplate();
        if (isMounted) setActiveTemplate(def);
      } catch (err) {
        console.warn('Error loading certificate template:', err);
      }
    };
    loadTemplate();
    return () => {
      isMounted = false;
    };
  }, [certificate.templateId, propTemplate]);

  // Generate QR Code data URL dynamically
  useEffect(() => {
    let isMounted = true;
    generateVerificationQRCode(verificationUrl).then((url) => {
      if (isMounted) setQrCodeUrl(url);
    });
    return () => {
      isMounted = false;
    };
  }, [verificationUrl]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verificationUrl);
    setCopied(true);
    success('Link Copied', 'Verification URL copied to clipboard');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadPDF = async () => {
    if (isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    try {
      await downloadCertificatePDF(certificate, certificateRef.current);
      success('PDF Downloaded!', 'Certificate PDF (A4 Landscape) generated directly from the view.');
    } catch (err) {
      console.error('PDF download error:', err);
      error('Download Failed', 'Could not generate certificate PDF. Please try again.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadImage = async () => {
    if (isDownloadingImage) return;
    setIsDownloadingImage(true);
    try {
      await downloadCertificateImage(certificate, certificateRef.current);
      success('Certificate Image Downloaded!', 'High-definition certificate image has been saved to your device.');
    } catch (err) {
      console.error('Image download error:', err);
      error('Download Failed', 'Could not save certificate image. Please try again.');
    } finally {
      setIsDownloadingImage(false);
    }
  };

  const handlePrint = () => {
    document.body.classList.add('printing-certificate');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-certificate');
    }, 1000);
  };

  const isValid = certificate.status === 'VALID';

  // Determine template image
  const backgroundImageUrl =
    activeTemplate?.imageUrl ||
    certificate.templateImageUrl ||
    '';

  // Fields to render
  const fieldsToRender: CertificateFieldPosition[] =
    activeTemplate?.fields ||
    certificate.templateFields ||
    DEFAULT_CERTIFICATE_FIELDS;

  // Resolve dynamic value for each field
  const getFieldValue = (field: CertificateFieldPosition): string => {
    if (field.customFormat) {
      return formatTemplatePlaceholderText(field.customFormat, certificate);
    }
    switch (field.id) {
      case 'student_name':
        return certificate.studentName || 'Student Full Name';
      case 'course_name':
        return certificate.courseName || 'Course Name';
      case 'completion_date':
        return certificate.completionDate || 'Completion Date';
      case 'certificate_id':
        return certificate.certificateId || 'ASH-2026-00001';
      case 'authorized_name':
        return certificate.authorizedName || 'ATIF HUSSAIN';
      case 'signatory_title':
        return certificate.signatoryTitle || 'Founder, Atif Skills Hub';
      case 'course_category':
        return certificate.courseCategory || 'Data Science';
      case 'course_duration':
        return certificate.courseDuration || '6 Weeks';
      case 'partner_authorized_name':
        return certificate.partnerAuthorizedName || 'MATHEMATICS & SEEKER ACADEMY';
      case 'score':
        return `${certificate.score || 100}%`;
      default:
        return formatTemplatePlaceholderText(field.placeholder, certificate);
    }
  };

  return (
    <div id="certificate-viewer-container" className="flex flex-col items-center w-full max-w-5xl mx-auto my-1 sm:my-2 px-1 sm:px-0">
      {/* Top Action Bar */}
      {showActions && (
        <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 sm:mb-4 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-3 sm:p-4 rounded-2xl shadow-xl print:hidden">
          <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2 sm:gap-2.5">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider ${
                  isValid
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                }`}
              >
                {isValid ? <ShieldCheck className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                {certificate.status}
              </span>
              <span className="text-amber-400 text-[11px] sm:text-xs font-mono font-bold bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                ID: {certificate.certificateId}
              </span>
            </div>

            {/* Mobile View Mode Switcher */}
            <div className="flex sm:hidden items-center gap-1 bg-slate-950 px-1.5 py-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setMobileViewMode('fit')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                  mobileViewMode === 'fit'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Fit Screen
              </button>
              <button
                type="button"
                onClick={() => setMobileViewMode('scroll')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                  mobileViewMode === 'scroll'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Full Detail
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              id="btn-copy-verify-link"
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 rounded-xl transition-all shadow-sm"
              title="Copy verification link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Share'}</span>
            </button>

            <button
              id="btn-open-qr"
              type="button"
              onClick={() => setShowQRModal(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 rounded-xl transition-all shadow-sm"
              title="Scan QR Code"
            >
              <QrCode className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">QR Code</span>
            </button>

            <button
              id="btn-print-certificate"
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 rounded-xl transition-all shadow-sm"
              title="Print Certificate (A4 Landscape)"
            >
              <Printer className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              id="btn-download-image"
              type="button"
              onClick={handleDownloadImage}
              disabled={isDownloadingImage}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 rounded-xl transition-all shadow-sm disabled:opacity-60"
              title="Download Certificate PNG Image directly to your device"
            >
              {isDownloadingImage ? (
                <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              ) : (
                <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>{isDownloadingImage ? 'Generating Image...' : 'Image (PNG)'}</span>
            </button>

            <button
              id="btn-download-pdf"
              type="button"
              onClick={handleDownloadPDF}
              disabled={isDownloadingPdf}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 px-4 py-2 text-xs sm:text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 rounded-xl shadow-lg shadow-amber-900/30 transition-all cursor-pointer disabled:opacity-60"
              title="Download Certificate as PDF (A4 Landscape, 100% exact copy of view)"
            >
              {isDownloadingPdf ? (
                <Loader2 className="w-4 h-4 text-slate-950 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4 text-slate-950" />
              )}
              <span>{isDownloadingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
            </button>

            {onClose && (
              <button
                id="btn-close-cert-modal"
                type="button"
                onClick={onClose}
                className="px-2.5 sm:px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 100% UPLOADED CUSTOM CERTIFICATE TEMPLATE CANVAS (A4 LANDSCAPE: 297 x 210) */}
      {/* ========================================================================= */}
      {/* Responsive Container for Mobile & Desktop Screens */}
      <div
        className={`w-full ${
          mobileViewMode === 'scroll' ? 'overflow-x-auto pb-3' : 'overflow-hidden'
        } sm:overflow-visible scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900 rounded-xl shadow-2xl`}
      >
        <div
          className={`w-full mx-auto ${
            mobileViewMode === 'scroll' ? 'min-w-[660px]' : 'min-w-0 max-w-full'
          } sm:min-w-full`}
        >
          {!backgroundImageUrl ? (
            <div id="certificate-print-frame" ref={certificateRef} className="w-full">
              {selectedDesign === 'actai' ? (
                <ACTAISkillBridgeCertificate
                  certificate={certificate}
                  qrCodeUrl={qrCodeUrl}
                  className="rounded-lg shadow-2xl print:shadow-none print:m-0 print:rounded-none"
                />
              ) : (
                <AtifSkillsHubOfficialCertificate
                  certificate={certificate}
                  qrCodeUrl={qrCodeUrl}
                  className="rounded-lg shadow-2xl print:shadow-none print:m-0 print:rounded-none"
                />
              )}
            </div>
          ) : (
        <div
          id="certificate-print-frame"
          ref={certificateRef}
          className="w-full aspect-[1.414/1] bg-white text-slate-900 rounded-lg shadow-2xl relative overflow-hidden select-text print:shadow-none print:m-0 print:rounded-none"
          style={{
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.4)',
          }}
        >
          {/* ----------------------------------------------------------------------- */}
          {/* 1. UPLOADED CERTIFICATE TEMPLATE (BACKGROUND)                            */}
          {/* ----------------------------------------------------------------------- */}
          <img
            src={backgroundImageUrl}
            alt="Uploaded Certificate Template"
            className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none z-0"
            referrerPolicy="no-referrer"
          />

          {/* ----------------------------------------------------------------------- */}
          {/* 2. OPTIONAL LOGOS & SIGNATURES IF ENABLED IN TEMPLATE SETTINGS          */}
          {/* ----------------------------------------------------------------------- */}
          {activeTemplate?.includeWebsiteLogo && certificate.logoUrl && (
            <div className="absolute top-[8%] left-[8%] z-10 pointer-events-none max-w-[120px] max-h-[60px]">
              <img src={certificate.logoUrl} alt="Logo" className="max-h-12 object-contain" />
            </div>
          )}

          {activeTemplate?.includeCollabLogo && certificate.collaborationLogoUrl && (
            <div className="absolute top-[8%] right-[8%] z-10 pointer-events-none max-w-[120px] max-h-[60px]">
              <img src={certificate.collaborationLogoUrl} alt="Collab Logo" className="max-h-12 object-contain" />
            </div>
          )}

          {activeTemplate?.includeSignature && certificate.signatureUrl && (
            <div className="absolute bottom-[16%] left-[20%] z-10 pointer-events-none max-w-[140px]">
              <img src={certificate.signatureUrl} alt="Signature" className="max-h-10 object-contain mx-auto" />
            </div>
          )}

          {activeTemplate?.includePartnerSignature && certificate.partnerSignatureUrl && (
            <div className="absolute bottom-[16%] right-[20%] z-10 pointer-events-none max-w-[140px]">
              <img src={certificate.partnerSignatureUrl} alt="Partner Signature" className="max-h-10 object-contain mx-auto" />
            </div>
          )}

          {/* ----------------------------------------------------------------------- */}
          {/* 3. DYNAMIC OVERLAY FIELDS POSITIONED BY PERCENTAGE COORDINATES          */}
          {/* ----------------------------------------------------------------------- */}
          {fieldsToRender
            .filter((f) => f.visible !== false)
            .map((field) => {
              const isQr = field.isQrCode || field.id === 'qr_code';
              const value = getFieldValue(field);

              const textAlignClass =
                field.textAlign === 'left'
                  ? 'text-left'
                  : field.textAlign === 'right'
                  ? 'text-right'
                  : 'text-center';

              const transformOrigin =
                field.textAlign === 'left'
                  ? 'translate(0, -50%)'
                  : field.textAlign === 'right'
                  ? 'translate(-100%, -50%)'
                  : 'translate(-50%, -50%)';

              return (
                <div
                  key={field.id}
                  id={`cert-field-${field.id}`}
                  className={`absolute z-20 pointer-events-none select-text ${textAlignClass}`}
                  style={{
                    left: `${field.x}%`,
                    top: `${field.y}%`,
                    transform: transformOrigin,
                    width: field.width ? `${field.width}%` : 'auto',
                    maxWidth: field.width ? `${field.width}%` : '90%',
                    fontFamily: field.fontFamily || "'Montserrat', sans-serif",
                    fontSize: `clamp(10px, ${field.fontSize * 0.11}vw, ${field.fontSize}px)`,
                    fontWeight: field.fontWeight as any,
                    fontStyle: field.fontStyle || 'normal',
                    color: field.color || '#0a1a3a',
                    letterSpacing: field.letterSpacing || 'normal',
                    textTransform: field.textTransform || 'none',
                    whiteSpace: isQr ? 'normal' : 'nowrap',
                  }}
                >
                  {isQr ? (
                    <div className="flex flex-col items-center justify-center p-1 bg-white/90 rounded-lg shadow-sm border border-slate-200">
                      {qrCodeUrl ? (
                        <img
                          src={qrCodeUrl}
                          alt="Verification QR Code"
                          style={{
                            width: `${field.qrSize || 64}px`,
                            height: `${field.qrSize || 64}px`,
                          }}
                          className="object-contain"
                        />
                      ) : (
                        <div
                          style={{
                            width: `${field.qrSize || 64}px`,
                            height: `${field.qrSize || 64}px`,
                          }}
                          className="bg-slate-200 flex items-center justify-center"
                        >
                          <QrCode className="w-6 h-6 text-slate-400 animate-spin" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <span>{value}</span>
                  )}
                </div>
              );
            })}
        </div>
      )}
        </div>
      </div>

      {/* Helpful Download hint */}
      {showActions && (
        <div className="w-full text-center mt-3 print:hidden">
          <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5 font-medium flex-wrap">
            <Download className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              Click <strong className="text-amber-400">Download Certificate</strong> to save your high-definition certificate image directly to your device.
            </span>
          </p>
        </div>
      )}

      {/* Verification & QR Code Modal */}
      {showQRModal && (
        <div
          id="qr-verification-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
          onClick={() => setShowQRModal(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-amber-400">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Scan to Verify Authenticity</h3>
            <p className="text-xs text-slate-400 mb-6">
              Scan this QR code with any mobile camera or QR scanner to verify this official certificate directly on the portal.
            </p>

            <div className="bg-white p-4 rounded-2xl inline-block shadow-inner mb-4">
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48 object-contain mx-auto" />
              ) : (
                <div className="w-48 h-48 bg-slate-100 flex items-center justify-center">
                  <QrCode className="w-8 h-8 text-slate-400 animate-pulse" />
                </div>
              )}
            </div>

            <p className="text-xs font-mono text-amber-400 font-semibold mb-6 break-all">
              {verificationUrl}
            </p>

            <button
              type="button"
              onClick={() => setShowQRModal(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

