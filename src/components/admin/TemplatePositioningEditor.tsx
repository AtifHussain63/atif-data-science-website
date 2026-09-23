import React, { useState, useRef, useEffect } from 'react';
import {
  Move,
  Type,
  Maximize2,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  Sparkles,
  QrCode,
  Sliders,
  Check,
  ChevronDown,
  Layers,
  HelpCircle,
  Play,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Plus,
  Trash2,
} from 'lucide-react';
import { CertificateTemplate, CertificateFieldPosition, Certificate } from '../../types';
import {
  saveCertificateTemplate,
  formatTemplatePlaceholderText,
  DEFAULT_CERTIFICATE_FIELDS,
} from '../../services/templateService';
import { generateVerificationQRCode } from '../../services/certificateService';
import { useToast } from '../../context/ToastContext';
import { AtifSkillsHubOfficialCertificate } from '../certificate/AtifSkillsHubOfficialCertificate';

interface TemplatePositioningEditorProps {
  template: CertificateTemplate;
  onSave?: (updatedTemplate: CertificateTemplate) => void;
  onClose?: () => void;
}

const SAMPLE_CERTIFICATE_DATA: Partial<Certificate> = {
  studentName: 'Atif Hussain',
  courseName: 'Python for Data Science',
  completionDate: '27 August 2026',
  certificateId: 'ASH-2026-00001',
  authorizedName: 'ATIF HUSSAIN',
  signatoryTitle: 'Founder, Atif Skills Hub',
  courseCategory: 'Data Science & AI',
  courseDuration: '6 Weeks',
  partnerAuthorizedName: 'MATHEMATICS & SEEKER ACADEMY',
  score: 98,
};

const AVAILABLE_FONTS = [
  { name: 'Great Vibes (Cursive Script)', value: "'Great Vibes', cursive" },
  { name: 'Alex Brush (Calligraphy)', value: "'Alex Brush', cursive" },
  { name: 'Allura (Formal Script)', value: "'Allura', cursive" },
  { name: 'Pinyon Script (Classic Signature)', value: "'Pinyon Script', cursive" },
  { name: 'Sacramento (Handwritten)', value: "'Sacramento', cursive" },
  { name: 'Cinzel (Classical Serif Display)', value: "'Cinzel', serif" },
  { name: 'Playfair Display (Editorial Serif)', value: "'Playfair Display', serif" },
  { name: 'Montserrat (Modern Geometric Sans)', value: "'Montserrat', sans-serif" },
  { name: 'Plus Jakarta Sans (Clean Modern Sans)', value: "'Plus Jakarta Sans', sans-serif" },
];

const PRESET_COLORS = [
  '#0a1a3a', // Navy
  '#000000', // Black
  '#1e293b', // Slate
  '#00a2db', // Cyan
  '#d4af37', // Gold
  '#d81159', // Magenta
  '#059669', // Emerald
  '#475569', // Muted Slate
  '#ffffff', // White
];

export const TemplatePositioningEditor: React.FC<TemplatePositioningEditorProps> = ({
  template,
  onSave,
  onClose,
}) => {
  const { success, error, info } = useToast();
  const [fields, setFields] = useState<CertificateFieldPosition[]>(
    template.fields && template.fields.length > 0
      ? template.fields
      : DEFAULT_CERTIFICATE_FIELDS
  );
  const [selectedFieldId, setSelectedFieldId] = useState<string>('student_name');
  const [previewMode, setPreviewMode] = useState<'sample' | 'placeholder'>('sample');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  const [includeWebsiteLogo, setIncludeWebsiteLogo] = useState<boolean>(template.includeWebsiteLogo || false);
  const [includeCollabLogo, setIncludeCollabLogo] = useState<boolean>(template.includeCollabLogo || false);
  const [includeSignature, setIncludeSignature] = useState<boolean>(template.includeSignature || false);
  const [includePartnerSignature, setIncludePartnerSignature] = useState<boolean>(template.includePartnerSignature || false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  const draggingFieldIdRef = useRef<string | null>(null);

  // Generate sample QR code
  useEffect(() => {
    generateVerificationQRCode('https://atifskillshub.org/#verify/ASH-2026-00001').then((url) => {
      setQrCodeDataUrl(url);
    });
  }, []);

  const selectedField = fields.find((f) => f.id === selectedFieldId) || fields[0];

  const updateSelectedField = (updates: Partial<CertificateFieldPosition>) => {
    if (!selectedFieldId) return;
    setFields((prev) =>
      prev.map((f) => (f.id === selectedFieldId ? { ...f, ...updates } : f))
    );
  };

  // Canvas Drag & Drop handlers
  const handleMouseDown = (e: React.MouseEvent, fieldId: string) => {
    e.stopPropagation();
    setSelectedFieldId(fieldId);
    isDraggingRef.current = true;
    draggingFieldIdRef.current = fieldId;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !draggingFieldIdRef.current || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let xPercent = Math.round((mouseX / rect.width) * 1000) / 10;
    let yPercent = Math.round((mouseY / rect.height) * 1000) / 10;

    // Constrain to 0 - 100%
    xPercent = Math.max(0, Math.min(100, xPercent));
    yPercent = Math.max(0, Math.min(100, yPercent));

    setFields((prev) =>
      prev.map((f) =>
        f.id === draggingFieldIdRef.current ? { ...f, x: xPercent, y: yPercent } : f
      )
    );
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    draggingFieldIdRef.current = null;
  };

  // Save changes
  const handleSavePositions = async () => {
    try {
      setIsSaving(true);
      const updatedTemplate: CertificateTemplate = {
        ...template,
        fields,
        includeWebsiteLogo,
        includeCollabLogo,
        includeSignature,
        includePartnerSignature,
        updatedAt: new Date().toISOString(),
      };
      await saveCertificateTemplate(updatedTemplate);
      success('Positions Saved', 'Certificate template coordinates updated successfully.');
      if (onSave) onSave(updatedTemplate);
    } catch (err) {
      console.error(err);
      error('Save Failed', 'Could not save template positions.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Reset all field coordinates and styles to default recommendations?')) {
      setFields(DEFAULT_CERTIFICATE_FIELDS);
      info('Reset Done', 'Field positions reset to standard layout.');
    }
  };

  // Add custom field
  const handleAddCustomField = () => {
    const customId = `custom_field_${Date.now().toString().slice(-4)}`;
    const newField: CertificateFieldPosition = {
      id: customId,
      label: 'Custom Field',
      placeholder: `{{${customId}}}`,
      x: 50,
      y: 50,
      fontSize: 14,
      fontFamily: "'Montserrat', sans-serif",
      fontWeight: 'semibold',
      color: '#0a1a3a',
      textAlign: 'center',
      visible: true,
      customFormat: 'Custom Certificate Notice',
    };
    setFields((prev) => [...prev, newField]);
    setSelectedFieldId(customId);
    success('Field Added', 'New editable overlay field added.');
  };

  const handleDeleteField = (fieldId: string) => {
    setFields((prev) => prev.filter((f) => f.id !== fieldId));
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(fields[0]?.id || '');
    }
  };

  return (
    <div
      id="template-positioning-editor"
      className="flex flex-col h-full w-full bg-slate-950 text-slate-100 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden"
      onMouseUp={handleMouseUp}
    >
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">{template.name}</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                A4 Landscape 297x210mm
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Drag fields on canvas or adjust percentage coordinates below to position dynamic text
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Preview Mode Toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setPreviewMode('sample')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                previewMode === 'sample'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sample Data View
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode('placeholder')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                previewMode === 'placeholder'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {`{{placeholders}}`}
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 transition-all text-xs flex items-center gap-1.5"
            title="Reset to default coordinates"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            type="button"
            onClick={handleSavePositions}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 shadow-lg shadow-amber-950/40 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving Positions...' : 'Save Positions'}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors"
            >
              Done
            </button>
          )}
        </div>
      </div>

      {/* Main Workspace: Left Sidebar (Controls) + Center/Right Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
        {/* Left Side: Field List & Selected Field Settings */}
        <div className="lg:col-span-4 bg-slate-900/60 border-r border-slate-800 p-5 overflow-y-auto max-h-[calc(100vh-220px)] flex flex-col gap-5">
          {/* Field Selection Pill List */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                Certificate Overlay Fields
              </label>
              <button
                type="button"
                onClick={handleAddCustomField}
                className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20"
              >
                <Plus className="w-3 h-3" /> Add Field
              </button>
            </div>

            <div className="space-y-1.5">
              {fields.map((f) => {
                const isSelected = f.id === selectedFieldId;
                return (
                  <div
                    key={f.id}
                    onClick={() => setSelectedFieldId(f.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500/40 text-white shadow-sm'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: f.visible ? f.color || '#f59e0b' : '#64748b' }}
                      />
                      <span className="font-semibold">{f.label}</span>
                      <span className="text-[10px] font-mono text-slate-500">
                        ({f.x}%, {f.y}%)
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFields((prev) =>
                            prev.map((item) =>
                              item.id === f.id ? { ...item, visible: !item.visible } : item
                            )
                          );
                        }}
                        className={`p-1 rounded-lg hover:bg-slate-800 transition-colors ${
                          f.visible ? 'text-emerald-400' : 'text-slate-600'
                        }`}
                        title={f.visible ? 'Visible on Certificate' : 'Hidden from Certificate'}
                      >
                        {f.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>

                      {f.id.startsWith('custom_') && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteField(f.id);
                          }}
                          className="p-1 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Field Style Controls */}
          {selectedField && (
            <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Editing: {selectedField.label}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {selectedField.placeholder}
                </span>
              </div>

              {/* Coordinates X & Y */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 mb-1 flex items-center justify-between">
                    <span>Horizontal (X%)</span>
                    <span className="text-amber-400 font-mono">{selectedField.x}%</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="0.5"
                    value={selectedField.x}
                    onChange={(e) => updateSelectedField({ x: Number(e.target.value) })}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 mb-1 flex items-center justify-between">
                    <span>Vertical (Y%)</span>
                    <span className="text-amber-400 font-mono">{selectedField.y}%</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="0.5"
                    value={selectedField.y}
                    onChange={(e) => updateSelectedField({ y: Number(e.target.value) })}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Font Size & Weight / QR Size */}
              {selectedField.isQrCode || selectedField.id === 'qr_code' ? (
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 mb-1 flex items-center justify-between">
                    <span>QR Code Size (px)</span>
                    <span className="text-amber-400 font-mono">{selectedField.qrSize || 68}px</span>
                  </label>
                  <input
                    type="range"
                    min="32"
                    max="140"
                    step="2"
                    value={selectedField.qrSize || 68}
                    onChange={(e) => updateSelectedField({ qrSize: Number(e.target.value) })}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 mb-1 flex items-center justify-between">
                        <span>Font Size</span>
                        <span className="text-amber-400 font-mono">{selectedField.fontSize}px</span>
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="72"
                        value={selectedField.fontSize}
                        onChange={(e) => updateSelectedField({ fontSize: Number(e.target.value) })}
                        className="w-full accent-amber-500 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 mb-1 block">
                        Font Weight
                      </label>
                      <select
                        value={selectedField.fontWeight}
                        onChange={(e) => updateSelectedField({ fontWeight: e.target.value as any })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                      >
                        <option value="normal">Regular (400)</option>
                        <option value="medium">Medium (500)</option>
                        <option value="semibold">Semibold (600)</option>
                        <option value="bold">Bold (700)</option>
                        <option value="800">Extra Bold (800)</option>
                      </select>
                    </div>
                  </div>

                  {/* Font Family Dropdown */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 mb-1 block">
                      Typography / Font Family
                    </label>
                    <select
                      value={selectedField.fontFamily}
                      onChange={(e) => updateSelectedField({ fontFamily: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    >
                      {AVAILABLE_FONTS.map((font) => (
                        <option key={font.value} value={font.value}>
                          {font.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Text Color & Alignment */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 mb-1 block">
                        Text Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={selectedField.color || '#0a1a3a'}
                          onChange={(e) => updateSelectedField({ color: e.target.value })}
                          className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                        />
                        <div className="flex flex-wrap gap-1">
                          {PRESET_COLORS.slice(0, 5).map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => updateSelectedField({ color })}
                              style={{ backgroundColor: color }}
                              className="w-4 h-4 rounded-full border border-slate-700 hover:scale-110 transition-transform"
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 mb-1 block">
                        Alignment
                      </label>
                      <div className="flex items-center bg-slate-900 p-0.5 rounded-xl border border-slate-800">
                        <button
                          type="button"
                          onClick={() => updateSelectedField({ textAlign: 'left' })}
                          className={`flex-1 py-1 flex items-center justify-center rounded-lg ${
                            selectedField.textAlign === 'left' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                          }`}
                        >
                          <AlignLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => updateSelectedField({ textAlign: 'center' })}
                          className={`flex-1 py-1 flex items-center justify-center rounded-lg ${
                            selectedField.textAlign === 'center' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                          }`}
                        >
                          <AlignCenter className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => updateSelectedField({ textAlign: 'right' })}
                          className={`flex-1 py-1 flex items-center justify-center rounded-lg ${
                            selectedField.textAlign === 'right' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                          }`}
                        >
                          <AlignRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Letter Spacing & Custom format */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 mb-1 block">
                      Custom Format (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder={selectedField.placeholder}
                      value={selectedField.customFormat || ''}
                      onChange={(e) => updateSelectedField({ customFormat: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Example: <code>Awarded on {`{{completion_date}}`}</code>
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Logo & Signature Inclusion Toggles */}
          <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Logo & Signature Overlays
            </span>
            <p className="text-[11px] text-slate-500">
              Only enable these if your uploaded design does NOT already include logos or signatures.
            </p>

            <div className="space-y-2">
              <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeWebsiteLogo}
                  onChange={(e) => setIncludeWebsiteLogo(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-0 w-4 h-4 bg-slate-900 border-slate-800"
                />
                <span>Overlay Website Logo</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeCollabLogo}
                  onChange={(e) => setIncludeCollabLogo(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-0 w-4 h-4 bg-slate-900 border-slate-800"
                />
                <span>Overlay Partner / Collab Logo</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSignature}
                  onChange={(e) => setIncludeSignature(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-0 w-4 h-4 bg-slate-900 border-slate-800"
                />
                <span>Overlay Authorized Signature</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePartnerSignature}
                  onChange={(e) => setIncludePartnerSignature(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-0 w-4 h-4 bg-slate-900 border-slate-800"
                />
                <span>Overlay Partner Signature</span>
              </label>
            </div>
          </div>
        </div>

        {/* Center/Right: Interactive Visual Canvas */}
        <div className="lg:col-span-8 p-6 flex flex-col items-center justify-center bg-slate-950 overflow-y-auto">
          <div className="w-full max-w-4xl flex flex-col items-center">
            <div className="w-full flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Live Interactive Canvas — Click & drag any element to reposition
              </span>
              <span className="font-mono text-[11px] text-slate-500">
                A4 Aspect (1.414:1)
              </span>
            </div>

            {/* Canvas Container */}
            <div
              id="interactive-certificate-canvas"
              ref={canvasRef}
              onMouseMove={handleMouseMove}
              className="w-full aspect-[1.414/1] bg-white rounded-lg shadow-2xl relative overflow-hidden select-none border border-slate-800"
              style={{
                boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5)',
              }}
            >
              {/* Background Image (The Uploaded Certificate Design) */}
              {template.imageUrl ? (
                <img
                  src={template.imageUrl}
                  alt="Template Background"
                  className="absolute inset-0 w-full h-full object-fill pointer-events-none z-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-90">
                  <AtifSkillsHubOfficialCertificate
                    certificate={{
                      certificateId: SAMPLE_CERTIFICATE_DATA.certificateId || 'ASH-2026-00001',
                      studentId: 'STU-001',
                      studentName: SAMPLE_CERTIFICATE_DATA.studentName || 'Atif Hussain',
                      courseId: 'course-1',
                      courseName: SAMPLE_CERTIFICATE_DATA.courseName || 'Python for Data Science',
                      completionDate: SAMPLE_CERTIFICATE_DATA.completionDate || '27 August 2026',
                      status: 'VALID',
                      verificationUrl: `https://atifskillshub.web.app/#verify/${SAMPLE_CERTIFICATE_DATA.certificateId || 'ASH-2026-00001'}`,
                      createdAt: new Date().toISOString(),
                    }}
                    qrCodeUrl={qrCodeDataUrl}
                  />
                </div>
              )}

              {/* Dynamic Interactive Fields */}
              {fields
                .filter((f) => f.visible)
                .map((field) => {
                  const isSelected = field.id === selectedFieldId;
                  const isQr = field.isQrCode || field.id === 'qr_code';

                  // Display value
                  let textValue = field.placeholder;
                  if (previewMode === 'sample') {
                    if (field.customFormat) {
                      textValue = formatTemplatePlaceholderText(field.customFormat, SAMPLE_CERTIFICATE_DATA);
                    } else {
                      switch (field.id) {
                        case 'student_name':
                          textValue = SAMPLE_CERTIFICATE_DATA.studentName || 'Atif Hussain';
                          break;
                        case 'course_name':
                          textValue = SAMPLE_CERTIFICATE_DATA.courseName || 'Python for Data Science';
                          break;
                        case 'completion_date':
                          textValue = SAMPLE_CERTIFICATE_DATA.completionDate || '27 August 2026';
                          break;
                        case 'certificate_id':
                          textValue = SAMPLE_CERTIFICATE_DATA.certificateId || 'ASH-2026-00001';
                          break;
                        case 'authorized_name':
                          textValue = SAMPLE_CERTIFICATE_DATA.authorizedName || 'ATIF HUSSAIN';
                          break;
                        case 'signatory_title':
                          textValue = SAMPLE_CERTIFICATE_DATA.signatoryTitle || 'Founder, Atif Skills Hub';
                          break;
                        case 'course_category':
                          textValue = SAMPLE_CERTIFICATE_DATA.courseCategory || 'Data Science & AI';
                          break;
                        case 'course_duration':
                          textValue = SAMPLE_CERTIFICATE_DATA.courseDuration || '6 Weeks';
                          break;
                        default:
                          textValue = formatTemplatePlaceholderText(field.placeholder, SAMPLE_CERTIFICATE_DATA);
                      }
                    }
                  }

                  const transformOrigin =
                    field.textAlign === 'left'
                      ? 'translate(0, -50%)'
                      : field.textAlign === 'right'
                      ? 'translate(-100%, -50%)'
                      : 'translate(-50%, -50%)';

                  return (
                    <div
                      key={field.id}
                      onMouseDown={(e) => handleMouseDown(e, field.id)}
                      className={`absolute z-20 cursor-move transition-shadow select-none group ${
                        isSelected
                          ? 'ring-2 ring-amber-500 ring-offset-2 bg-amber-500/10'
                          : 'hover:ring-1 hover:ring-slate-400 hover:bg-slate-400/10'
                      }`}
                      style={{
                        left: `${field.x}%`,
                        top: `${field.y}%`,
                        transform: transformOrigin,
                        fontFamily: field.fontFamily || "'Montserrat', sans-serif",
                        fontSize: `clamp(9px, ${field.fontSize * 0.11}vw, ${field.fontSize}px)`,
                        fontWeight: field.fontWeight as any,
                        color: field.color || '#0a1a3a',
                        letterSpacing: field.letterSpacing || 'normal',
                        textAlign: field.textAlign,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        whiteSpace: isQr ? 'normal' : 'nowrap',
                      }}
                    >
                      {isQr ? (
                        <div className="flex flex-col items-center justify-center p-1 bg-white rounded shadow-sm border border-slate-300">
                          {qrCodeDataUrl ? (
                            <img
                              src={qrCodeDataUrl}
                              alt="QR"
                              style={{ width: `${field.qrSize || 64}px`, height: `${field.qrSize || 64}px` }}
                              className="pointer-events-none"
                            />
                          ) : (
                            <QrCode className="w-12 h-12 text-slate-800" />
                          )}
                        </div>
                      ) : (
                        <span>{textValue}</span>
                      )}

                      {/* Tooltip / Handle Label */}
                      {isSelected && (
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-amber-500 text-slate-950 font-mono text-[9px] font-bold rounded shadow whitespace-nowrap pointer-events-none">
                          {field.label} ({field.x}%, {field.y}%)
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>

            {/* Quick Helper Notes */}
            <div className="mt-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400 w-full flex items-start gap-3">
              <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-300 mb-1">Canvas Positioning Tips:</p>
                <ul className="list-disc pl-4 space-y-0.5 text-slate-400 text-[11px]">
                  <li>Click and drag any element on the canvas to place it in the exact right spot.</li>
                  <li>Use the coordinate sliders on the left for pixel-precise fine-tuning.</li>
                  <li>If your design already includes a signature or date line, turn off that field or drag it directly on top of the blank line.</li>
                  <li>Hit <strong>Save Positions</strong> to update certificates platform-wide.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
