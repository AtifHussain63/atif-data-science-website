import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Award,
  Calendar,
  Building,
  User,
  BookOpen,
  Handshake,
  Mail,
  Eye,
  Printer,
  Download,
  Loader2,
} from 'lucide-react';
import { Certificate, CollaborationSettings } from '../types';
import { getCertificateById } from '../services/certificateService';
import { getCollaborationSettings } from '../services/collaborationService';
import { CertificateView } from '../components/certificate/CertificateView';
import { useToast } from '../context/ToastContext';
import { downloadCertificateImage } from '../components/certificate/PDFGenerator';

interface VerifyCertificatePageProps {
  initialCertId?: string;
  onNavigate: (view: string, param?: string) => void;
}

export const VerifyCertificatePage: React.FC<VerifyCertificatePageProps> = ({
  initialCertId = '',
  onNavigate,
}) => {
  const [searchId, setSearchId] = useState<string>(initialCertId);
  const [searchedId, setSearchedId] = useState<string>(initialCertId);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [globalCollab, setGlobalCollab] = useState<CollaborationSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [showCertificateModal, setShowCertificateModal] = useState<boolean>(true);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const { success, error } = useToast();

  const handleDownloadImage = async () => {
    if (!certificate || isDownloading) return;
    setIsDownloading(true);
    try {
      await downloadCertificateImage(certificate);
      success('Certificate Downloaded!', 'High-definition certificate image saved to your device.');
    } catch (err) {
      console.error('Image download error:', err);
      error('Download Failed', 'Could not save certificate image. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    getCollaborationSettings().then((settings) => {
      setGlobalCollab(settings);
    });
  }, []);

  const performVerification = async (idToVerify: string) => {
    const cleanId = idToVerify.trim();
    if (!cleanId) return;

    setLoading(true);
    setHasSearched(true);
    setSearchedId(cleanId);

    try {
      const cert = await getCertificateById(cleanId);
      setCertificate(cert);
    } catch (err) {
      console.error(err);
      setCertificate(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialCertId) {
      setSearchId(initialCertId);
      performVerification(initialCertId);
    }
  }, [initialCertId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performVerification(searchId);
  };

  const isValid = certificate?.status === 'VALID';
  const isRevoked = certificate?.status === 'REVOKED';

  // Check if collaboration should be displayed on this verified certificate
  const hasCollab =
    certificate &&
    (certificate.collaborationEnabled !== false || globalCollab?.enabled) &&
    Boolean(
      certificate.collaborationName ||
      certificate.collaborationLogoUrl ||
      globalCollab?.partnerName
    );

  const collabName =
    certificate?.collaborationName ||
    globalCollab?.partnerName ||
    'Atif Skills Hub Support & Mathematics Seeker Academy';
  const collabEmail =
    certificate?.collaborationEmail ||
    globalCollab?.partnerEmail ||
    'dostdar.cui@gmail.com';
  const collabType =
    certificate?.collaborationType ||
    globalCollab?.collaborationType ||
    'Education & Learning Collaboration';
  const collabLogo =
    certificate?.collaborationLogoUrl ||
    globalCollab?.logoUrl;

  return (
    <div id="verify-certificate-page" className="min-h-screen bg-slate-950 text-slate-100 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-4 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Official Credential Verification
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Certificate Verification</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-lg mx-auto leading-relaxed">
            Verify the authenticity of any completion certificate issued by <strong>Atif Skills Hub</strong> using the unique Certificate ID or QR code.
          </p>
        </div>

        {/* Verification Search Bar */}
        <form onSubmit={handleSearchSubmit} className="mb-10">
          <div className="flex gap-2 p-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="input-verify-cert-id"
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="Enter Certificate ID (e.g. ASH-2026-00001)"
                className="w-full pl-10 pr-4 py-3 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none uppercase font-mono"
              />
            </div>
            <button
              id="btn-verify-lookup"
              type="submit"
              disabled={loading || !searchId.trim()}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-amber-900/30 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify Now'}
            </button>
          </div>
        </form>

        {/* Verification Results View */}
        {loading ? (
          <div className="p-12 text-center bg-slate-900/50 rounded-2xl border border-slate-800">
            <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400">Auditing credential verification registry...</p>
          </div>
        ) : hasSearched && !certificate ? (
          /* NOT FOUND STATE */
          <div id="result-not-found" className="p-8 sm:p-10 text-center bg-slate-900/80 border border-rose-500/30 rounded-3xl shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <XCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white">Certificate Not Found</h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              No matching certificate was found for identifier <span className="font-mono font-bold text-rose-300">{searchedId}</span>. Please verify the ID format and try again.
            </p>
          </div>
        ) : certificate ? (
          /* CERTIFICATE FOUND: VALID or REVOKED */
          <div
            id="result-found-box"
            className={`p-8 sm:p-10 rounded-3xl border shadow-2xl space-y-6 ${
              isValid
                ? 'bg-slate-900/90 border-emerald-500/40 shadow-emerald-950/20'
                : 'bg-slate-900/90 border-rose-500/40 shadow-rose-950/20'
            }`}
          >
            {/* Status Header Banner */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    isValid
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                  }`}
                >
                  {isValid ? <CheckCircle2 className="w-7 h-7" /> : <AlertTriangle className="w-7 h-7" />}
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                    {isValid ? '✓ Certificate Valid' : 'Certificate Revoked'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isValid
                      ? 'This certificate is authentic, active, and verified in our registry.'
                      : 'This certificate has been revoked by platform administration.'}
                  </p>
                </div>
              </div>

              <span
                className={`px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-wider border ${
                  isValid
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}
              >
                STATUS: {certificate.status}
              </span>
            </div>

            {/* Audit Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              
              <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl space-y-1">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <Award className="w-3.5 h-3.5 text-amber-400" /> Certificate ID
                </span>
                <p className="text-sm font-mono font-bold text-amber-400">{certificate.certificateId}</p>
              </div>

              <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl space-y-1">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <User className="w-3.5 h-3.5 text-blue-400" /> Student Recipient
                </span>
                <p className="text-sm font-bold text-white">{certificate.studentName}</p>
              </div>

              <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl space-y-1 sm:col-span-2">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <BookOpen className="w-3.5 h-3.5 text-purple-400" /> Course Program
                </span>
                <p className="text-base font-bold text-white">{certificate.courseName}</p>
              </div>

              <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl space-y-1">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Completion Date
                </span>
                <p className="text-sm font-semibold text-white">{certificate.completionDate}</p>
              </div>

              <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl space-y-1">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <Building className="w-3.5 h-3.5 text-slate-400" /> Issued By
                </span>
                <p className="text-sm font-bold text-amber-400">Atif Skills Hub</p>
              </div>

            </div>

            {/* Academic Collaboration Partner Verification Section */}
            {hasCollab && (
              <div className="p-5 bg-amber-500/5 border border-amber-500/30 rounded-2xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3">
                    {collabLogo ? (
                      <img
                        src={collabLogo}
                        alt="Collaboration Partner Logo"
                        className="h-12 w-12 object-contain bg-white/5 p-1 rounded-xl border border-amber-500/20 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                        <Handshake className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                          In Academic Collaboration With
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Verified Partner
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-0.5">{collabName}</h4>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-slate-400">
                        <span>{collabType}</span>
                        <span className="text-slate-600">•</span>
                        <a
                          href={`mailto:${collabEmail}`}
                          className="text-amber-400/90 hover:underline flex items-center gap-1 font-mono"
                        >
                          <Mail className="w-3 h-3" /> {collabEmail}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            {isValid && (
              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-[11px] text-slate-400">
                  Authorized Signatory: <strong>{certificate.authorizedName || 'Atif Hussain'}</strong>
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setShowCertificateModal(!showCertificateModal)}
                    className="w-full sm:w-auto px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all border border-slate-700 shadow-sm"
                  >
                    <Eye className="w-4 h-4 text-cyan-400" /> {showCertificateModal ? 'Hide Certificate' : 'View Certificate'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadImage}
                    disabled={isDownloading}
                    className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-900/20 transition-all cursor-pointer disabled:opacity-60"
                    title="Download Certificate Image directly"
                  >
                    {isDownloading ? (
                      <Loader2 className="w-4 h-4 text-slate-950 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 text-slate-950" />
                    )}
                    <span>{isDownloading ? 'Generating...' : 'Download Image'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Embedded Full Certificate View when opened */}
            {showCertificateModal && isValid && (
              <div className="mt-6 pt-6 border-t border-slate-800">
                <div className="text-center mb-3">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Official Certificate Preview</h3>
                  <p className="text-[11px] text-slate-400">Exact digital facsimile matching physical issuance</p>
                </div>
                <CertificateView certificate={certificate} showActions={true} />
              </div>
            )}

          </div>
        ) : (
          /* Empty / Default State */
          <div className="p-8 text-center bg-slate-900/30 rounded-2xl border border-slate-800/60 text-xs text-slate-400">
            Enter a valid Certificate ID above or scan the QR code located on any physical or digital certificate issued by Atif Skills Hub.
          </div>
        )}

      </div>
    </div>
  );
};
