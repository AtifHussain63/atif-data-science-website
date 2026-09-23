import React, { useEffect, useState } from 'react';
import { Award, ExternalLink, Download, Loader2 } from 'lucide-react';
import { Certificate } from '../types';
import { useAuth } from '../context/AuthContext';
import { getStudentCertificates } from '../services/certificateService';
import { CertificateView } from '../components/certificate/CertificateView';
import { downloadCertificateImage } from '../components/certificate/PDFGenerator';

interface MyCertificatesPageProps {
  onNavigate: (view: string, param?: string) => void;
}

export const MyCertificatesPage: React.FC<MyCertificatesPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [downloadingCertId, setDownloadingCertId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      const list = await getStudentCertificates(user.uid);
      setCertificates(list);
      setLoading(false);
    };
    load();
  }, [user]);

  return (
    <div id="my-certificates-page" className="min-h-screen bg-slate-950 text-slate-100 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-8">
          <p className="text-amber-400 text-xs font-bold uppercase tracking-wider">Official Credentials</p>
          <h1 className="text-3xl font-extrabold text-white mt-1">My Earned Certificates</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            View, verify authenticity, and share instant QR-verification links.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2].map((n) => (
              <div key={n} className="h-64 bg-slate-900 rounded-2xl animate-pulse border border-slate-800" />
            ))}
          </div>
        ) : certificates.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 max-w-lg mx-auto">
            <Award className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No certificates yet</h3>
            <p className="text-xs text-slate-400 mt-1">
              Complete course modules and score 80%+ on the final 50-MCQ assessment to earn your official credential.
            </p>
            <button
              onClick={() => onNavigate('courses')}
              className="mt-5 px-6 py-2.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl"
            >
              Start a Course
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((cert) => {
              const isValid = cert.status === 'VALID';
              return (
                <div
                  key={cert.certificateId}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all shadow-xl"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/30">
                        {cert.certificateId}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isValid
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {cert.status}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white leading-snug">{cert.courseName}</h3>
                    <p className="text-xs text-slate-400 mt-1">Issued: {cert.completionDate}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Authorized: {cert.authorizedName || 'Atif Hussain'}</p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800 flex items-center gap-2">
                    <button
                      onClick={() => setSelectedCert(cert)}
                      className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={async () => {
                        setDownloadingCertId(cert.certificateId);
                        try {
                          await downloadCertificateImage(cert);
                        } catch {
                          setSelectedCert(cert);
                        } finally {
                          setDownloadingCertId(null);
                        }
                      }}
                      disabled={downloadingCertId === cert.certificateId}
                      className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-60"
                      title="Download Certificate Image directly"
                    >
                      {downloadingCertId === cert.certificateId ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
                      ) : (
                        <Download className="w-3.5 h-3.5 text-slate-950" />
                      )}
                      <span>{downloadingCertId === cert.certificateId ? 'Generating...' : 'Download Image'}</span>
                    </button>
                    <button
                      onClick={() => onNavigate('verify', cert.certificateId)}
                      className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 rounded-xl text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1"
                      title="Verify Certificate"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Modal: Certificate Viewer */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-5xl max-h-[95vh] overflow-y-auto">
            <CertificateView
              certificate={selectedCert}
              onClose={() => setSelectedCert(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
