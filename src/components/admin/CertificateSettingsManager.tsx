import React, { useState, useEffect, useRef } from 'react';
import {
  Award,
  Upload,
  Image as ImageIcon,
  CheckCircle,
  Save,
  RefreshCw,
  Eye,
  Trash2,
  Handshake,
  FileText,
  ShieldCheck,
  Check,
  AlertCircle,
  Sliders,
  Type,
  PenTool,
  Plus,
  Star,
  Copy,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  CertificateSettings,
  CertificateTemplate,
  Certificate,
} from '../../types';
import {
  getCertificateSettings,
  saveCertificateSettings,
  uploadWebsiteLogo,
  uploadAuthorizedSignature,
  uploadPartnerSignature,
  subscribeToCertificateSettings,
} from '../../services/certificateService';
import {
  getAllCertificateTemplates,
  subscribeToCertificateTemplates,
  saveCertificateTemplate,
  deleteCertificateTemplate,
  setDefaultCertificateTemplate,
  uploadCertificateTemplateImage,
  INITIAL_DEFAULT_TEMPLATE,
} from '../../services/templateService';
import { uploadCollaborationLogo } from '../../services/collaborationService';
import { CertificateView } from '../certificate/CertificateView';
import { TemplatePositioningEditor } from './TemplatePositioningEditor';
import { AtifFounderSignature } from '../certificate/AtifFounderSignature';
import { useToast } from '../../context/ToastContext';

export const CertificateSettingsManager: React.FC = () => {
  const { success, error, info } = useToast();
  
  // Active sub-tab
  const [activeTab, setActiveTab] = useState<'templates' | 'positioning' | 'branding' | 'general'>('templates');

  // Certificate Settings
  const [settings, setSettings] = useState<CertificateSettings>({
    websiteName: 'ATIF SKILLS HUB',
    tagline: 'Empowering Careers, Transforming Skills',
    certificateTitle: 'CERTIFICATE',
    certificateSubtitle: 'OF APPRECIATION',
    certificatePrefix: 'ASH',
    authorizedName: 'ATIF HUSSAIN',
    signatoryTitle: 'Founder',
    description:
      'For successfully completing the course / program organized by Atif Skills Hub and Mathematics Seeker Academy. In recognition of your dedication, hard work, and commitment to learning. Keep Learning, Keep Growing!',
    logoUrl: '',
    signatureUrl: '',
    collaborationLogoUrl: '',
    collaborationName: 'Mathematics & Seeker Academy',
    collaborationEmail: 'dostdar.cui@gmail.com',
    collaborationEnabled: true,
    partnerAuthorizedName: 'MATHEMATICS & SEEKER ACADEMY',
    partnerSignatoryTitle: 'Research to explore',
    partnerSignatureUrl: '',
  });

  // Templates
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<CertificateTemplate | null>(null);
  const [isEditingPositions, setIsEditingPositions] = useState<boolean>(false);
  const [isCreatingNewTemplate, setIsCreatingNewTemplate] = useState<boolean>(false);
  const [newTemplateName, setNewTemplateName] = useState<string>('');
  const [newTemplateDesc, setNewTemplateDesc] = useState<string>('');

  // Loading / Upload states
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [uploadingTemplate, setUploadingTemplate] = useState<boolean>(false);
  const [uploadingLogo, setUploadingLogo] = useState<boolean>(false);
  const [uploadingCollabLogo, setUploadingCollabLogo] = useState<boolean>(false);
  const [uploadingSig, setUploadingSig] = useState<boolean>(false);
  const [uploadingPartnerSig, setUploadingPartnerSig] = useState<boolean>(false);

  // Preview Modal
  const [previewModalOpen, setPreviewModalOpen] = useState<boolean>(false);
  const [previewTemplate, setPreviewTemplate] = useState<CertificateTemplate | null>(null);

  // File Input Refs
  const templateFileInputRef = useRef<HTMLInputElement>(null);
  const newTemplateFileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const collabLogoInputRef = useRef<HTMLInputElement>(null);
  const sigInputRef = useRef<HTMLInputElement>(null);
  const partnerSigInputRef = useRef<HTMLInputElement>(null);

  // Subscriptions
  useEffect(() => {
    const unsubSettings = subscribeToCertificateSettings((data) => {
      setSettings(data);
    });

    const unsubTemplates = subscribeToCertificateTemplates((list) => {
      setTemplates(list);
      if (list.length > 0) {
        // Keep selected or pick default
        setSelectedTemplate((prev) => {
          if (prev) {
            const found = list.find((t) => t.id === prev.id);
            if (found) return found;
          }
          const defaultTpl = list.find((t) => t.isDefault) || list[0];
          return defaultTpl;
        });
      }
      setLoading(false);
    });

    return () => {
      unsubSettings();
      unsubTemplates();
    };
  }, []);

  // Save general settings
  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      await saveCertificateSettings(settings);
      success('Settings Saved', 'Certificate branding configuration saved successfully.');
    } catch (err) {
      console.error(err);
      error('Save Failed', 'Could not save certificate settings.');
    } finally {
      setSaving(false);
    }
  };

  // Upload Background Image for Selected Template
  const handleTemplateImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTemplate) return;

    // Validate image format
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(png|jpe?g|webp|pdf)$/i)) {
      error('Invalid Format', 'Please upload a PNG, JPG, JPEG, or WebP image file.');
      return;
    }

    try {
      setUploadingTemplate(true);
      const imageUrl = await uploadCertificateTemplateImage(file);
      
      const updated: CertificateTemplate = {
        ...selectedTemplate,
        imageUrl,
        updatedAt: new Date().toISOString(),
      };

      await saveCertificateTemplate(updated);
      setSelectedTemplate(updated);
      success('Template Uploaded', `Custom certificate design uploaded for "${updated.name}"`);
    } catch (err) {
      console.error('Template upload error:', err);
      error('Upload Failed', 'Could not upload certificate design. Please try again.');
    } finally {
      setUploadingTemplate(false);
      if (e.target) e.target.value = '';
    }
  };

  // Create New Certificate Template
  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) {
      error('Validation', 'Please enter a template name.');
      return;
    }

    try {
      setSaving(true);
      const newTpl: CertificateTemplate = {
        id: `tpl_${Date.now()}`,
        name: newTemplateName.trim(),
        description: newTemplateDesc.trim() || 'Custom Certificate Template',
        imageUrl: '',
        isDefault: templates.length === 0,
        status: 'active',
        fields: INITIAL_DEFAULT_TEMPLATE.fields,
        includeWebsiteLogo: false,
        includeCollabLogo: false,
        includeSignature: false,
        includePartnerSignature: false,
        aspectRatio: 1.414,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveCertificateTemplate(newTpl);
      setSelectedTemplate(newTpl);
      setIsCreatingNewTemplate(false);
      setNewTemplateName('');
      setNewTemplateDesc('');
      success('Template Created', `New template "${newTpl.name}" created. Now upload your certificate background image.`);
    } catch (err) {
      console.error(err);
      error('Create Failed', 'Could not create template.');
    } finally {
      setSaving(false);
    }
  };

  // Set As Default
  const handleSetDefault = async (templateId: string) => {
    try {
      await setDefaultCertificateTemplate(templateId);
      success('Default Template Set', 'This template will now be used for all courses by default.');
    } catch (err) {
      console.error(err);
      error('Error', 'Failed to set default template.');
    }
  };

  // Delete Template
  const handleDeleteTemplate = async (templateId: string, templateName: string) => {
    if (templates.length <= 1) {
      error('Cannot Delete', 'You must have at least one certificate template.');
      return;
    }
    if (confirm(`Are you sure you want to delete template "${templateName}"?`)) {
      try {
        await deleteCertificateTemplate(templateId);
        success('Template Deleted', `Removed template "${templateName}"`);
      } catch (err) {
        console.error(err);
        error('Delete Failed', 'Could not delete template.');
      }
    }
  };

  // Delete Template Background Image Only
  const handleDeleteTemplateImage = async () => {
    if (!selectedTemplate) return;
    if (confirm(`Remove the uploaded background image for "${selectedTemplate.name}"?`)) {
      try {
        const updated = { ...selectedTemplate, imageUrl: '', updatedAt: new Date().toISOString() };
        await saveCertificateTemplate(updated);
        setSelectedTemplate(updated);
        info('Background Removed', 'Certificate template background image cleared.');
      } catch (err) {
        console.error(err);
        error('Error', 'Failed to remove background image.');
      }
    }
  };

  // Branding Uploads
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingLogo(true);
      const url = await uploadWebsiteLogo(file);
      setSettings((prev) => ({ ...prev, logoUrl: url }));
      success('Logo Uploaded', 'Website logo updated.');
    } catch (err) {
      console.error(err);
      error('Upload Error', 'Failed to upload website logo.');
    } finally {
      setUploadingLogo(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleCollabLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingCollabLogo(true);
      const url = await uploadCollaborationLogo(file);
      setSettings((prev) => ({ ...prev, collaborationLogoUrl: url }));
      success('Partner Logo Uploaded', 'Collaboration logo updated.');
    } catch (err) {
      console.error(err);
      error('Upload Error', 'Failed to upload collaboration logo.');
    } finally {
      setUploadingCollabLogo(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSigUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingSig(true);
      const url = await uploadAuthorizedSignature(file);
      setSettings((prev) => ({ ...prev, signatureUrl: url }));
      success('Signature Uploaded', 'Authorized signature image updated.');
    } catch (err) {
      console.error(err);
      error('Upload Error', 'Failed to upload signature image.');
    } finally {
      setUploadingSig(false);
      if (e.target) e.target.value = '';
    }
  };

  const handlePartnerSigUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingPartnerSig(true);
      const url = await uploadPartnerSignature(file);
      setSettings((prev) => ({ ...prev, partnerSignatureUrl: url }));
      success('Partner Signature Uploaded', 'Partner signature image updated.');
    } catch (err) {
      console.error(err);
      error('Upload Error', 'Failed to upload partner signature image.');
    } finally {
      setUploadingPartnerSig(false);
      if (e.target) e.target.value = '';
    }
  };

  // Sample certificate object for live preview
  const sampleCertificate: Certificate = {
    certificateId: 'ASH-2026-00001',
    studentId: 'std_sample_01',
    studentName: 'Atif Hussain',
    studentEmail: 'atifhuss773@gmail.com',
    courseId: 'python-data-science',
    courseName: 'Python for Data Science',
    courseCategory: 'Data Science & AI',
    courseLevel: 'Professional',
    courseDuration: '6 Weeks',
    completionDate: '27 August 2026',
    verificationUrl: `${window.location.origin}/#verify/ASH-2026-00001`,
    status: 'VALID',
    createdAt: new Date().toISOString(),
    templateId: selectedTemplate?.id,
    templateImageUrl: selectedTemplate?.imageUrl,
    templateFields: selectedTemplate?.fields,
    logoUrl: settings.logoUrl,
    signatureUrl: settings.signatureUrl,
    authorizedName: settings.authorizedName || 'ATIF HUSSAIN',
    signatoryTitle: settings.signatoryTitle || 'Founder, Atif Skills Hub',
    websiteName: settings.websiteName || 'ATIF SKILLS HUB',
    tagline: settings.tagline || 'Empowering Careers, Transforming Skills',
    score: 98,
    collaborationEnabled: settings.collaborationEnabled,
    collaborationName: settings.collaborationName,
    collaborationEmail: settings.collaborationEmail,
    collaborationLogoUrl: settings.collaborationLogoUrl,
    partnerAuthorizedName: settings.partnerAuthorizedName,
    partnerSignatoryTitle: settings.partnerSignatoryTitle,
    partnerSignatureUrl: settings.partnerSignatureUrl,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin text-amber-500 mr-3" />
        <span>Loading certificate templates & settings...</span>
      </div>
    );
  }

  return (
    <div id="certificate-settings-manager" className="space-y-6">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={templateFileInputRef}
        onChange={handleTemplateImageUpload}
        accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
        className="hidden"
      />
      <input
        type="file"
        ref={logoInputRef}
        onChange={handleLogoUpload}
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
      />
      <input
        type="file"
        ref={collabLogoInputRef}
        onChange={handleCollabLogoUpload}
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
      />
      <input
        type="file"
        ref={sigInputRef}
        onChange={handleSigUpload}
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
      />
      <input
        type="file"
        ref={partnerSigInputRef}
        onChange={handlePartnerSigUpload}
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
      />

      {/* Main Top Header & Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">
              Certificate Template & Design System
            </h1>
            <p className="text-xs text-slate-400">
              Upload custom Canva/Photoshop certificates, customize text positions, and assign templates to courses.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setPreviewTemplate(selectedTemplate);
              setPreviewModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 transition-all shadow-sm"
          >
            <Eye className="w-4 h-4 text-amber-400" />
            <span>Preview Certificate</span>
          </button>

          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 shadow-lg shadow-amber-950/40 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => {
            setActiveTab('templates');
            setIsEditingPositions(false);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'templates' && !isEditingPositions
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Certificate Templates ({templates.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('positioning');
            setIsEditingPositions(true);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'positioning' || isEditingPositions
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Template Positioning & Coordinates</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('branding');
            setIsEditingPositions(false);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'branding'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <PenTool className="w-4 h-4" />
          <span>Logos & Signatures</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('general');
            setIsEditingPositions(false);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'general'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Type className="w-4 h-4" />
          <span>General & Certificate ID</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CERTIFICATE TEMPLATES (UPLOAD & MANAGEMENT)                        */}
      {/* ========================================================================= */}
      {activeTab === 'templates' && !isEditingPositions && (
        <div className="space-y-6">
          {/* Top Banner Notice */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3.5 text-xs text-amber-200">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-300 mb-0.5">
                Custom Certificate Upload System Active
              </p>
              <p className="text-amber-200/90 leading-relaxed">
                You can design your certificate in <strong>Canva, Photoshop, or Illustrator</strong>, export it as a high-resolution <strong>PNG / JPG (A4 Landscape, 297 &times; 210 mm)</strong>, and upload it here. The website will use your exact uploaded image as the background and dynamically overlay student names, course titles, dates, IDs, and QR codes at the coordinates you choose.
              </p>
            </div>
          </div>

          {/* Template Grid & Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map((tpl) => {
              const isSelected = selectedTemplate?.id === tpl.id;
              return (
                <div
                  key={tpl.id}
                  onClick={() => setSelectedTemplate(tpl)}
                  className={`relative flex flex-col p-4 rounded-3xl border transition-all cursor-pointer bg-slate-900/80 ${
                    isSelected
                      ? 'border-amber-500 ring-2 ring-amber-500/30 shadow-xl shadow-amber-950/30'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Default / Active Badges */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      {tpl.isDefault ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500 text-slate-950 shadow-sm">
                          <Star className="w-3 h-3 fill-current" /> Default Template
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetDefault(tpl.id);
                          }}
                          className="text-[10px] font-semibold text-slate-400 hover:text-amber-400 bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded-lg transition-colors"
                        >
                          Set as Default
                        </button>
                      )}
                    </div>

                    <span className="text-[10px] font-mono text-slate-500">
                      {new Date(tpl.updatedAt || tpl.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Thumbnail / Image Preview */}
                  <div className="w-full aspect-[1.414/1] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden relative mb-3.5 flex items-center justify-center">
                    {tpl.imageUrl ? (
                      <img
                        src={tpl.imageUrl}
                        alt={tpl.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-4 text-center text-slate-500">
                        <ImageIcon className="w-8 h-8 mb-1.5 text-slate-600" />
                        <span className="text-xs font-semibold">No Image Uploaded</span>
                        <span className="text-[10px] text-slate-600">Click to upload Canva/PS design</span>
                      </div>
                    )}

                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-amber-500 text-slate-950 p-1 rounded-full shadow-md">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  {/* Title & Info */}
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-white mb-1 truncate">{tpl.name}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                      {tpl.description || 'Custom certificate template'}
                    </p>
                  </div>

                  {/* Quick Card Action Buttons */}
                  <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTemplate(tpl);
                        setIsEditingPositions(true);
                      }}
                      className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-[11px] font-semibold transition-colors flex items-center justify-center gap-1"
                    >
                      <Sliders className="w-3 h-3 text-amber-400" /> Edit Positions
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewTemplate(tpl);
                        setPreviewModalOpen(true);
                      }}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
                      title="Preview Template"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    {templates.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTemplate(tpl.id, tpl.name);
                        }}
                        className="p-1.5 bg-slate-800 hover:bg-rose-900/50 text-rose-400 rounded-xl transition-colors"
                        title="Delete Template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Add New Template Card */}
            <div
              onClick={() => setIsCreatingNewTemplate(true)}
              className="flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-dashed border-slate-800 hover:border-amber-500/60 bg-slate-900/30 hover:bg-slate-900/60 transition-all cursor-pointer text-center group min-h-[260px]"
            >
              <div className="p-4 rounded-2xl bg-slate-800 group-hover:bg-amber-500 text-slate-400 group-hover:text-slate-950 mb-3 transition-colors">
                <Plus className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Create New Template</h4>
              <p className="text-xs text-slate-400 max-w-[200px]">
                Add template for specific programs (e.g. Python, AI, Data Science)
              </p>
            </div>
          </div>

          {/* Modal / Dialog for creating a new template */}
          {isCreatingNewTemplate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
                <h3 className="text-lg font-bold text-white mb-1">Create Certificate Template</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Define a new template name and assign it to courses.
                </p>

                <form onSubmit={handleCreateTemplate} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Template Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Python for Data Science Certificate"
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Description / Program Note
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Official certificate for students passing the Python Data Science Track."
                      value={newTemplateDesc}
                      onChange={(e) => setNewTemplateDesc(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCreatingNewTemplate(false)}
                      className="flex-1 py-2.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 py-2.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl"
                    >
                      {saving ? 'Creating...' : 'Create & Upload Image'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Selected Template Management & Upload Area */}
          {selectedTemplate && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white">{selectedTemplate.name}</h2>
                    {selectedTemplate.isDefault && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500 text-slate-950">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Recommended: A4 Landscape (297 &times; 210 mm) at 300 DPI (approx. 3508 &times; 2480 px)
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => templateFileInputRef.current?.click()}
                    disabled={uploadingTemplate}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{selectedTemplate.imageUrl ? 'Replace Template Image' : 'Upload Template Image'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsEditingPositions(true)}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-all"
                  >
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    <span>Edit Field Positions</span>
                  </button>

                  {selectedTemplate.imageUrl && (
                    <button
                      type="button"
                      onClick={handleDeleteTemplateImage}
                      className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl border border-rose-500/20 transition-all"
                      title="Remove background image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Large Interactive Preview of the Uploaded Design with dynamic fields */}
              <div className="flex flex-col items-center">
                <div className="w-full max-w-4xl">
                  <CertificateView
                    certificate={sampleCertificate}
                    template={selectedTemplate}
                    showActions={false}
                    previewMode={true}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TEMPLATE POSITIONING EDITOR                                       */}
      {/* ========================================================================= */}
      {(activeTab === 'positioning' || isEditingPositions) && selectedTemplate && (
        <div className="space-y-4">
          <TemplatePositioningEditor
            template={selectedTemplate}
            onSave={(updated) => {
              setSelectedTemplate(updated);
            }}
            onClose={() => {
              setIsEditingPositions(false);
              setActiveTab('templates');
            }}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BRANDING, LOGOS & SIGNATURES                                       */}
      {/* ========================================================================= */}
      {activeTab === 'branding' && !isEditingPositions && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Main Website Logo & Authorized Signature */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" /> Atif Skills Hub Branding
            </h3>

            {/* Logo */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                Main Platform Logo
              </label>
              <div className="flex items-center gap-4 p-3 bg-slate-950 rounded-2xl border border-slate-800">
                <div className="w-24 h-14 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center p-1">
                  {settings.logoUrl ? (
                    <img src={settings.logoUrl} alt="Logo" className="max-h-12 object-contain" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-slate-600" />
                  )}
                </div>
                <div className="flex-1">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
                  >
                    {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                  </button>
                  <p className="text-[10px] text-slate-500 mt-1">PNG with transparent background recommended</p>
                </div>
              </div>
            </div>

            {/* Signature */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                Founder Authorized Signature
              </label>
              <div className="flex items-center gap-4 p-3 bg-slate-950 rounded-2xl border border-slate-800">
                <div className="w-28 h-14 bg-white/95 rounded-xl border border-slate-800 flex items-center justify-center p-1.5 overflow-hidden">
                  {settings.signatureUrl ? (
                    <img src={settings.signatureUrl} alt="Signature" className="max-h-12 object-contain" />
                  ) : (
                    <AtifFounderSignature className="h-11 w-auto" color="#002D84" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => sigInputRef.current?.click()}
                      disabled={uploadingSig}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
                    >
                      {uploadingSig ? 'Uploading...' : 'Upload New'}
                    </button>
                    {settings.signatureUrl && (
                      <button
                        type="button"
                        onClick={() => setSettings((prev) => ({ ...prev, signatureUrl: '' }))}
                        className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs font-medium border border-rose-500/20 transition-colors"
                        title="Reset to authentic handwritten signature"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    {settings.signatureUrl ? 'Custom signature active' : 'Authentic handwritten pen signature active by default'}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Authorized Signatory Full Name
              </label>
              <input
                type="text"
                value={settings.authorizedName || ''}
                onChange={(e) => setSettings((prev) => ({ ...prev, authorizedName: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Signatory Title
              </label>
              <input
                type="text"
                value={settings.signatoryTitle || ''}
                onChange={(e) => setSettings((prev) => ({ ...prev, signatoryTitle: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Partner & Collaboration Branding */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Handshake className="w-4 h-4 text-pink-400" /> Collaboration / Partner Branding
            </h3>

            {/* Partner Logo */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                Partner / Academy Logo
              </label>
              <div className="flex items-center gap-4 p-3 bg-slate-950 rounded-2xl border border-slate-800">
                <div className="w-24 h-14 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center p-1">
                  {settings.collaborationLogoUrl ? (
                    <img src={settings.collaborationLogoUrl} alt="Collab Logo" className="max-h-12 object-contain" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-slate-600" />
                  )}
                </div>
                <div className="flex-1">
                  <button
                    type="button"
                    onClick={() => collabLogoInputRef.current?.click()}
                    disabled={uploadingCollabLogo}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
                  >
                    {uploadingCollabLogo ? 'Uploading...' : 'Upload Partner Logo'}
                  </button>
                  <p className="text-[10px] text-slate-500 mt-1">Mathematics & Seeker Academy logo</p>
                </div>
              </div>
            </div>

            {/* Partner Signature */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                Partner Signatory Signature
              </label>
              <div className="flex items-center gap-4 p-3 bg-slate-950 rounded-2xl border border-slate-800">
                <div className="w-28 h-14 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center p-1">
                  {settings.partnerSignatureUrl ? (
                    <img src={settings.partnerSignatureUrl} alt="Partner Sig" className="max-h-12 object-contain" />
                  ) : (
                    <PenTool className="w-6 h-6 text-slate-600" />
                  )}
                </div>
                <div className="flex-1">
                  <button
                    type="button"
                    onClick={() => partnerSigInputRef.current?.click()}
                    disabled={uploadingPartnerSig}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
                  >
                    {uploadingPartnerSig ? 'Uploading...' : 'Upload Partner Signature'}
                  </button>
                  <p className="text-[10px] text-slate-500 mt-1">Partner authorized signature image</p>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Partner Organization Name
              </label>
              <input
                type="text"
                value={settings.collaborationName || ''}
                onChange={(e) => setSettings((prev) => ({ ...prev, collaborationName: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Partner Authorized Name
              </label>
              <input
                type="text"
                value={settings.partnerAuthorizedName || ''}
                onChange={(e) => setSettings((prev) => ({ ...prev, partnerAuthorizedName: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: GENERAL SETTINGS & ID PREFIX                                       */}
      {/* ========================================================================= */}
      {activeTab === 'general' && !isEditingPositions && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            General Certificate & ID Formatting
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Platform Name
              </label>
              <input
                type="text"
                value={settings.websiteName || ''}
                onChange={(e) => setSettings((prev) => ({ ...prev, websiteName: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Certificate ID Prefix (e.g. ASH)
              </label>
              <input
                type="text"
                value={settings.certificatePrefix || 'ASH'}
                onChange={(e) => setSettings((prev) => ({ ...prev, certificatePrefix: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Generates unique IDs like: <code>{settings.certificatePrefix || 'ASH'}-2026-00001</code>
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Certificate Official Description / Citation
            </label>
            <textarea
              rows={3}
              value={settings.description || ''}
              onChange={(e) => setSettings((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
      )}

      {/* Live Preview Modal */}
      {previewModalOpen && previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-5xl w-full shadow-2xl flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">{previewTemplate.name} — Live Certificate Preview</h3>
                <p className="text-xs text-slate-400">Rendering real student sample data & dynamic QR code on the template</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors"
              >
                Close Preview
              </button>
            </div>

            <div className="w-full">
              <CertificateView
                certificate={sampleCertificate}
                template={previewTemplate}
                showActions={true}
                onClose={() => setPreviewModalOpen(false)}
                previewMode={false}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
