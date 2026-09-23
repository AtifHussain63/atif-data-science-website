import React, { useState, useEffect, useRef } from 'react';
import {
  Handshake,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Search,
  Mail,
  Globe,
  ExternalLink,
  Info,
  Sparkles,
  Save,
  X,
  Check,
  Copy,
  Upload,
  Image as ImageIcon,
  Eye,
  RefreshCw,
  Award,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { Collaboration, CollaborationSettings, Certificate } from '../../types';
import {
  getAllCollaborations,
  saveCollaboration,
  deleteCollaboration,
  toggleCollaborationStatus,
  subscribeToCollaborations,
  getCollaborationSettings,
  saveCollaborationSettings,
  subscribeToCollaborationSettings,
  uploadCollaborationLogo,
  deleteCollaborationLogo,
  DEFAULT_COLLABORATION_SETTINGS,
} from '../../services/collaborationService';
import { CertificateView } from '../certificate/CertificateView';
import { useToast } from '../../context/ToastContext';

export const CollaborationsManager: React.FC = () => {
  const { success, error, info } = useToast();
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [collabSettings, setCollabSettings] = useState<CollaborationSettings>(
    DEFAULT_COLLABORATION_SETTINGS
  );
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Logo upload state
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [previewCertModal, setPreviewCertModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Settings form dirty state
  const [savingSettings, setSavingSettings] = useState(false);

  // Modal State for Partner entries
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCollab, setEditingCollab] = useState<Partial<Collaboration> | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribeCollabs = subscribeToCollaborations((data) => {
      setCollaborations(data);
      setLoading(false);
    }, true);

    const unsubscribeSettings = subscribeToCollaborationSettings((settingsData) => {
      setCollabSettings(settingsData);
    });

    return () => {
      unsubscribeCollabs();
      unsubscribeSettings();
    };
  }, []);

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image format
    const validFormats = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validFormats.includes(file.type)) {
      error('Invalid Format', 'Supported formats: PNG, JPG, JPEG, WebP.');
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      error('File Too Large', 'Maximum image size is 5MB.');
      return;
    }

    try {
      setUploadingLogo(true);
      const url = await uploadCollaborationLogo(file);
      success('Logo Uploaded', 'Collaboration logo uploaded and saved to Firestore.');
      setCollabSettings((prev) => ({ ...prev, logoUrl: url }));
    } catch (err) {
      console.error(err);
      error('Upload Failed', 'Could not upload collaboration logo.');
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteLogo = async () => {
    if (confirm('Are you sure you want to remove the collaboration logo?')) {
      try {
        await deleteCollaborationLogo();
        setCollabSettings((prev) => ({ ...prev, logoUrl: '' }));
        success('Logo Removed', 'Collaboration logo deleted.');
      } catch (err) {
        console.error(err);
        error('Error', 'Failed to remove logo.');
      }
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      await saveCollaborationSettings(collabSettings);
      success('Settings Saved', 'Collaboration settings updated successfully.');
    } catch (err) {
      console.error(err);
      error('Save Failed', 'Could not save collaboration settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggleCollabEnabled = async () => {
    const newEnabled = !collabSettings.enabled;
    try {
      const updated = await saveCollaborationSettings({ enabled: newEnabled });
      setCollabSettings(updated);
      success(
        'Status Updated',
        newEnabled
          ? 'Collaboration branding is now ACTIVE on certificates and website.'
          : 'Collaboration branding is now DISABLED.'
      );
    } catch (err) {
      console.error(err);
      error('Error', 'Failed to toggle collaboration status.');
    }
  };

  const handleOpenAddModal = () => {
    setEditingCollab({
      name: '',
      email: '',
      category: 'Education & Learning Partner',
      description: '',
      status: 'active',
      websiteUrl: '',
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (collab: Collaboration) => {
    setEditingCollab({ ...collab });
    setModalOpen(true);
  };

  const handleSaveCollabEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCollab?.name || !editingCollab?.email) {
      error('Validation Error', 'Organization Name and Email are required.');
      return;
    }

    try {
      const toSave: Collaboration = {
        id: editingCollab.id || `collab_${Date.now()}`,
        name: editingCollab.name.trim(),
        email: editingCollab.email.trim(),
        category: editingCollab.category || 'Education & Learning Partner',
        description: editingCollab.description || '',
        status: (editingCollab.status as 'active' | 'inactive') || 'active',
        websiteUrl: editingCollab.websiteUrl || '',
        updatedAt: new Date().toISOString(),
        createdAt: editingCollab.createdAt || new Date().toISOString(),
      };

      await saveCollaboration(toSave);
      success('Collaboration Saved', `Successfully updated "${toSave.name}".`);
      setModalOpen(false);
      setEditingCollab(null);
    } catch (err) {
      console.error(err);
      error('Save Failed', 'Could not save collaboration to Firestore.');
    }
  };

  const handleDelete = async (collab: Collaboration) => {
    if (confirm(`Are you sure you want to delete the collaboration with "${collab.name}"?`)) {
      try {
        await deleteCollaboration(collab.id);
        success('Deleted', `Collaboration with "${collab.name}" was removed.`);
      } catch (err) {
        console.error(err);
        error('Delete Failed', 'Could not delete collaboration.');
      }
    }
  };

  const handleToggleStatus = async (collab: Collaboration) => {
    const nextStatus = collab.status === 'active' ? 'inactive' : 'active';
    try {
      await toggleCollaborationStatus(collab.id, nextStatus);
      success(
        'Status Updated',
        `"${collab.name}" is now marked as ${nextStatus.toUpperCase()}.`
      );
    } catch (err) {
      console.error(err);
      error('Error', 'Failed to update collaboration status.');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(text);
    setTimeout(() => setCopiedEmail(null), 2500);
  };

  // Sample Certificate for Live Preview Modal
  const previewCertificateData: Certificate = {
    certificateId: 'ASH-2026-SAMPLE',
    studentId: 'STU-9901',
    studentName: 'Atif Hussain',
    studentEmail: 'atifhuss773@gmail.com',
    courseId: 'course_python_data_science',
    courseName: 'Python for Data Science & AI',
    completionDate: new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date()),
    verificationUrl: `${window.location.origin}/#verify/ASH-2026-SAMPLE`,
    status: 'VALID',
    createdAt: new Date().toISOString(),
    authorizedName: 'Atif Hussain',
    score: 98,
    collaborationEnabled: collabSettings.enabled,
    collaborationName: collabSettings.partnerName,
    collaborationEmail: collabSettings.partnerEmail,
    collaborationType: collabSettings.collaborationType,
    collaborationLogoUrl: collabSettings.logoUrl,
  };

  const filtered = collaborations.filter((c) => {
    const matchesSearch =
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.category?.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ? true : c.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      {/* Hidden File Input for Logo Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleLogoFileChange}
        accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
        className="hidden"
      />

      {/* SECTION 1: COLLABORATION LOGO & CERTIFICATE CO-BRANDING */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-amber-500/30 shadow-2xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 text-xs font-bold uppercase tracking-wider border border-amber-500/30">
                Official Collaboration & Co-Branding
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  collabSettings.enabled
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {collabSettings.enabled ? 'ACTIVE ON CERTIFICATES' : 'DISABLED'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Handshake className="w-6 h-6 text-amber-400" /> Collaboration Logo & Certificate Settings
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl">
              Upload the official partner logo and configure co-branding details. When active, new certificates and verification pages automatically include the collaboration logo and accreditation details.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleToggleCollabEnabled}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border ${
                collabSettings.enabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {collabSettings.enabled ? (
                <>
                  <ToggleRight className="w-4 h-4 text-emerald-400" /> Collaboration Enabled
                </>
              ) : (
                <>
                  <ToggleLeft className="w-4 h-4 text-slate-400" /> Collaboration Disabled
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setPreviewCertModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-900/30 hover:from-amber-400 hover:to-yellow-300 transition-all"
            >
              <Eye className="w-4 h-4" /> Live Preview Certificate
            </button>
          </div>
        </div>

        {/* LOGO UPLOAD & PREVIEW GRID */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Logo Card */}
          <div className="md:col-span-4 bg-slate-950/80 border border-slate-800/90 rounded-2xl p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-amber-400" /> Collaboration Logo
                </label>
                <span className="text-[10px] text-slate-500 font-mono">PNG / JPG / WEBP</span>
              </div>

              {/* Image Preview Box */}
              <div className="w-full h-44 rounded-xl bg-slate-900/90 border-2 border-dashed border-slate-800 flex items-center justify-center p-3 relative overflow-hidden group">
                {collabSettings.logoUrl ? (
                  <img
                    src={collabSettings.logoUrl}
                    alt="Collaboration Official Logo"
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="text-center p-4 space-y-2">
                    <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-slate-500">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-semibold text-slate-400">No logo uploaded yet</p>
                    <p className="text-[10px] text-slate-500">Upload official logo image for Atif Skills Hub Support & Mathematics Seeker Academy</p>
                  </div>
                )}

                {uploadingLogo && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="w-6 h-6 text-amber-400 animate-spin" />
                    <span className="text-xs text-amber-300 font-bold">Uploading to Storage...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Logo Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={uploadingLogo}
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
              >
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                {collabSettings.logoUrl ? 'Replace Image' : 'Upload Image'}
              </button>

              {collabSettings.logoUrl && (
                <button
                  type="button"
                  onClick={handleDeleteLogo}
                  disabled={uploadingLogo}
                  className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold rounded-xl border border-rose-500/30 transition-colors"
                  title="Delete Logo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Settings Form */}
          <form onSubmit={handleSaveSettings} className="md:col-span-8 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Partner Organization Name *
                </label>
                <input
                  type="text"
                  value={collabSettings.partnerName}
                  onChange={(e) =>
                    setCollabSettings({ ...collabSettings, partnerName: e.target.value })
                  }
                  required
                  placeholder="Atif Skills Hub Support & Mathematics Seeker Academy"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-semibold focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Partner Official Email *
                </label>
                <input
                  type="email"
                  value={collabSettings.partnerEmail}
                  onChange={(e) =>
                    setCollabSettings({ ...collabSettings, partnerEmail: e.target.value })
                  }
                  required
                  placeholder="dostdar.cui@gmail.com"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-amber-400 text-xs font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Collaboration Category / Type *
                </label>
                <input
                  type="text"
                  value={collabSettings.collaborationType}
                  onChange={(e) =>
                    setCollabSettings({ ...collabSettings, collaborationType: e.target.value })
                  }
                  required
                  placeholder="Education & Learning Collaboration"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Logo Download URL (Firebase Storage)
                </label>
                <input
                  type="text"
                  readOnly
                  value={collabSettings.logoUrl || 'No logo uploaded'}
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 text-slate-500 text-xs rounded-xl font-mono truncate cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Collaboration Description
              </label>
              <textarea
                value={collabSettings.description}
                onChange={(e) =>
                  setCollabSettings({ ...collabSettings, description: e.target.value })
                }
                rows={3}
                placeholder="Atif Skills Hub Support & Mathematics Seeker Academy is a collaborative education and learning partner providing support and learning resources."
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs leading-relaxed focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                {collabSettings.updatedAt
                  ? `Last updated: ${new Date(collabSettings.updatedAt).toLocaleString()}`
                  : 'Default system configurations'}
              </span>

              <button
                type="submit"
                disabled={savingSettings}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-900/20 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {savingSettings ? 'Saving Settings...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* SECTION 2: ALL PARTNER ORGANIZATIONS DIRECTORY */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Handshake className="w-5 h-5 text-amber-400" /> Partner Organizations Registry
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Active partners appear in the public website &quot;Collaborations &amp; Partners&quot; showcase.
            </p>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Partner Organization
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search partners by name, email, or category..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Filter:</span>
            {(['all', 'active', 'inactive'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                  statusFilter === st
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Collaborations Grid List */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Loading collaborations from Firestore...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-3xl space-y-3">
            <Handshake className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-slate-300">No Collaborations Found</p>
            <p className="text-xs text-slate-500">
              {search ? 'Try adjusting your search query.' : 'Click "Add Partner Organization" above to add one.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filtered.map((collab) => (
              <div
                key={collab.id}
                className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 space-y-4 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    {collab.logoUrl || (collab.id === 'partner-math-seeker-academy' && collabSettings.logoUrl) ? (
                      <div className="w-12 h-12 rounded-2xl bg-white/10 border border-amber-500/30 p-1 flex items-center justify-center shrink-0">
                        <img
                          src={collab.logoUrl || collabSettings.logoUrl}
                          alt={`${collab.name} Logo`}
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                        <Handshake className="w-6 h-6" />
                      </div>
                    )}
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base sm:text-lg font-bold text-white">
                          {collab.name}
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-amber-400 text-[11px] font-mono font-medium">
                          {collab.category}
                        </span>
                        <button
                          onClick={() => handleToggleStatus(collab)}
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                            collab.status === 'active'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30'
                          }`}
                        >
                          {collab.status === 'active' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" /> Active on Public Site
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" /> Inactive (Hidden)
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-0.5">
                        <div className="flex items-center gap-1.5 font-mono text-amber-300/90">
                          <Mail className="w-3.5 h-3.5 text-amber-400" />
                          <span>{collab.email}</span>
                          <button
                            onClick={() => handleCopy(collab.email)}
                            className="text-slate-500 hover:text-slate-300 ml-1"
                          >
                            {copiedEmail === collab.email ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        {collab.websiteUrl && (
                          <a
                            href={collab.websiteUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-blue-400 hover:underline"
                          >
                            <Globe className="w-3.5 h-3.5" /> Website
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-start">
                    <button
                      onClick={() => handleToggleStatus(collab)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                        collab.status === 'active'
                          ? 'bg-slate-950 text-slate-400 hover:text-rose-400 border-slate-800'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                      }`}
                    >
                      {collab.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(collab)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl border border-slate-700"
                      title="Edit details"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(collab)}
                      className="p-2 bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-400 rounded-xl border border-slate-700"
                      title="Delete partner"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Description Body */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {collab.description || (
                    <span className="text-slate-500 italic">No description provided.</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: LIVE PREVIEW CERTIFICATE */}
      {previewCertModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CertificateView
              certificate={previewCertificateData}
              onClose={() => setPreviewCertModal(false)}
            />
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT PARTNER */}
      {modalOpen && editingCollab && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Handshake className="w-5 h-5 text-amber-400" />
                {editingCollab.id ? 'Edit Partner Collaboration' : 'Add New Partner Organization'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCollabEntry} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Partner / Organization Name *
                </label>
                <input
                  type="text"
                  value={editingCollab.name || ''}
                  onChange={(e) => setEditingCollab({ ...editingCollab, name: e.target.value })}
                  required
                  placeholder="e.g. Atif Skills Hub Support & Mathematics Seeker Academy"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Partner Email *
                  </label>
                  <input
                    type="email"
                    value={editingCollab.email || ''}
                    onChange={(e) => setEditingCollab({ ...editingCollab, email: e.target.value })}
                    required
                    placeholder="e.g. dostdar.cui@gmail.com"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Category *</label>
                  <input
                    type="text"
                    value={editingCollab.category || 'Education & Learning Partner'}
                    onChange={(e) => setEditingCollab({ ...editingCollab, category: e.target.value })}
                    required
                    placeholder="e.g. Education & Learning Partner"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Status</label>
                  <select
                    value={editingCollab.status || 'active'}
                    onChange={(e) =>
                      setEditingCollab({
                        ...editingCollab,
                        status: e.target.value as 'active' | 'inactive',
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                  >
                    <option value="active">Active (Visible on Website)</option>
                    <option value="inactive">Inactive (Hidden)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Website URL (Optional)</label>
                  <input
                    type="text"
                    value={editingCollab.websiteUrl || ''}
                    onChange={(e) => setEditingCollab({ ...editingCollab, websiteUrl: e.target.value })}
                    placeholder="https://... or mailto:..."
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Description / Collaboration Scope
                </label>
                <textarea
                  value={editingCollab.description || ''}
                  onChange={(e) =>
                    setEditingCollab({ ...editingCollab, description: e.target.value })
                  }
                  rows={4}
                  placeholder="Atif Skills Hub Support & Mathematics Seeker Academy is a collaborative education and learning partner providing support and learning resources."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs leading-relaxed"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> Save Collaboration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
