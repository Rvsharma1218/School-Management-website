import React, { useState, useRef } from 'react';
import { useSchoolStore } from '../lib/store';
import {
  Settings, Building2, Save, Download, Upload, RefreshCw,
  Plus, Trash2, CheckCircle, School, ArrowRight,
  Info, Sparkles, Check, UploadCloud, Image as ImageIcon, Camera, X, FileSignature, Crop
} from 'lucide-react';
import { removeSignatureBackground } from '../lib/exportUtils';
import ImageCropperModal from './ImageCropperModal';

export default function SettingsView() {
  const {
    settings,
    updateSettings,
    exportAllDataJson,
    importAllDataJson,
    showToast
  } = useSchoolStore();

  const [activeSubTab, setActiveSubTab] = useState('config'); // 'config' | 'wizard'
  const [wizardStep, setWizardStep] = useState(1); // 1 | 2 | 3
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [isLogoCropperOpen, setIsLogoCropperOpen] = useState(false);
  const [logoToCrop, setLogoToCrop] = useState(null);
  const logoInputRef = useRef(null);

  const [formData, setFormData] = useState({
    instituteName: settings.instituteName || settings.schoolName || '',
    tagline: settings.tagline || '',
    principalName: settings.principalName || '',
    affiliationNumber: settings.affiliationNumber || '',
    mobile: settings.mobile || settings.phone || '',
    email: settings.email || '',
    address: settings.address || '',
    logoUrl: settings.logoUrl || settings.logoPath || settings.logo || '',
    principalSignature: settings.principalSignature || settings.signatureUrl || '',
    signatureUrl: settings.signatureUrl || settings.principalSignature || '',
    schoolStamp: settings.schoolStamp || settings.stampUrl || '',
    stampUrl: settings.stampUrl || settings.schoolStamp || '',
    currentSession: settings.currentSession || settings.academicYear || '2026-27',
    ...settings
  });
  const [newClassName, setNewClassName] = useState('');
  const [newCourseName, setNewCourseName] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const hasInitializedRef = React.useRef(false);

  // Initialize form once when settings first arrive from Firestore
  React.useEffect(() => {
    if (settings && !hasInitializedRef.current && (settings.instituteName || settings.schoolName || settings.address || settings.logoUrl)) {
      hasInitializedRef.current = true;
      setFormData(prev => ({
        ...settings,
        instituteName: settings.instituteName || settings.schoolName || prev.instituteName || '',
        schoolName: settings.schoolName || settings.instituteName || prev.schoolName || '',
        tagline: settings.tagline !== undefined ? settings.tagline : (prev.tagline || ''),
        principalName: settings.principalName !== undefined ? settings.principalName : (prev.principalName || ''),
        affiliationNumber: settings.affiliationNumber !== undefined ? settings.affiliationNumber : (prev.affiliationNumber || ''),
        mobile: settings.mobile || settings.phone || prev.mobile || '',
        phone: settings.phone || settings.mobile || prev.phone || '',
        email: settings.email || prev.email || '',
        address: settings.address !== undefined ? settings.address : (prev.address || ''),
        logoUrl: settings.logoUrl || settings.logoPath || settings.logo || prev.logoUrl || '',
        principalSignature: settings.principalSignature || settings.signatureUrl || prev.principalSignature || '',
        signatureUrl: settings.signatureUrl || settings.principalSignature || prev.signatureUrl || '',
        currentSession: settings.currentSession || settings.academicYear || prev.currentSession || '2026-27',
      }));
    }
  }, [settings]);

  const handleLogoFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, SVG, WebP).', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size exceeds 5MB limit.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      setLogoToCrop(dataUrl);
      setIsLogoCropperOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleLogoCropComplete = (croppedDataUrl) => {
    setFormData(prev => ({
      ...prev,
      logoUrl: croppedDataUrl,
      logo: croppedDataUrl,
      logoPath: croppedDataUrl
    }));
    showToast('Logo cropped! Click "Save Institute Profile" below to apply.', 'success');
  };

  const handleLogoDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingLogo(true);
  };

  const handleLogoDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingLogo(false);
  };

  const handleLogoDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingLogo(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleLogoFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveLogo = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setFormData(prev => ({
      ...prev,
      logoUrl: '',
      logo: '',
      logoPath: ''
    }));
    if (logoInputRef.current) logoInputRef.current.value = '';
    showToast('Logo removed. Click Save to apply.', 'info');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleAddClass = () => {
    if (!newClassName.trim()) return;
    const current = formData.schoolClasses || [];
    if (!current.includes(newClassName.trim())) {
      const updated = [...current, newClassName.trim()];
      setFormData(prev => ({ ...prev, schoolClasses: updated }));
      updateSettings({ schoolClasses: updated });
    }
    setNewClassName('');
  };

  const handleRemoveClass = (cls) => {
    const updated = (formData.schoolClasses || []).filter(c => c !== cls);
    setFormData(prev => ({ ...prev, schoolClasses: updated }));
    updateSettings({ schoolClasses: updated });
  };

  const handleAddCourse = () => {
    if (!newCourseName.trim()) return;
    const current = formData.computerCourses || [];
    if (!current.includes(newCourseName.trim())) {
      const updated = [...current, newCourseName.trim()];
      setFormData(prev => ({ ...prev, computerCourses: updated }));
      updateSettings({ computerCourses: updated });
    }
    setNewCourseName('');
  };

  const handleRemoveCourse = (course) => {
    const updated = (formData.computerCourses || []).filter(c => c !== course);
    setFormData(prev => ({ ...prev, computerCourses: updated }));
    updateSettings({ computerCourses: updated });
  };

  const handleFileImport = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target.result);
          importAllDataJson(json);
        } catch (err) {
          showToast("Invalid JSON backup file!", "error");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleWizardSubmit = (e) => {
    e.preventDefault();
    if (wizardStep === 1) {
      setWizardStep(2);
    } else if (wizardStep === 2) {
      updateSettings(formData);
      setWizardStep(3);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* Sub tabs navigation */}
      <div className="flex items-center gap-2 border-b border-border pb-1 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveSubTab('config')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeSubTab === 'config'
              ? 'bg-primary text-white shadow-xs'
              : 'text-text-secondary hover:text-text hover:bg-surface2'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>General Config</span>
        </button>

        <button
          onClick={() => { setActiveSubTab('wizard'); setWizardStep(1); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeSubTab === 'wizard'
              ? 'bg-primary text-white shadow-xs'
              : 'text-text-secondary hover:text-text hover:bg-surface2'
          }`}
        >
          <School className="w-3.5 h-3.5" />
          <span>Setup Wizard</span>
        </button>
      </div>

      {activeSubTab === 'config' ? (
        /* ─── GENERAL CONFIGURATION MANAGER ─── */
        <>
          <div>
            <h2 className="text-xl lg:text-2xl font-bold text-text tracking-tight">
              Institute Profile & Settings
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Configure branding, official particulars, academic sessions, and data backups
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Core Institute Details */}
            <div className="bg-white border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-text uppercase tracking-wider flex items-center gap-2 border-b border-border pb-2">
                <Building2 className="w-4 h-4 text-primary" />
                <span>Institute Branding & Logo</span>
              </h3>

              {/* Institute Logo Upload Box (Drag & Drop + File Open) */}
              <div className="p-4 rounded-2xl bg-surface2/60 border border-border/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-text flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-primary" />
                    <span>Official Institute Logo</span>
                  </label>
                  {formData.logoUrl && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Logo Uploaded
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  {/* Current Logo Preview */}
                  <div className="sm:col-span-4 flex items-center gap-3 bg-white p-3 rounded-xl border border-border">
                    <div className="w-16 h-16 rounded-xl border-2 border-dashed border-primary/30 flex items-center justify-center bg-surface2 overflow-hidden flex-shrink-0 relative group">
                      {formData.logoUrl ? (
                        <img
                          src={formData.logoUrl}
                          alt="Institute Logo"
                          className="w-full h-full object-contain p-1 rounded-lg"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <School className="w-8 h-8 text-primary/40" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-text truncate">
                        {formData.logoUrl ? 'Active Logo' : 'No Logo Set'}
                      </p>
                      <p className="text-[10px] text-text-secondary">
                        {formData.logoUrl ? 'Ready for receipts & header' : 'Default icon in use'}
                      </p>
                      {formData.logoUrl && (
                        <div className="flex items-center gap-2 mt-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (formData.logoUrl) {
                                setLogoToCrop(formData.logoUrl);
                                setIsLogoCropperOpen(true);
                              }
                            }}
                            className="text-[10px] font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
                          >
                            <Crop className="w-3 h-3" /> Crop
                          </button>
                          <span className="text-slate-300 text-[10px]">&bull;</span>
                          <button
                            type="button"
                            onClick={handleRemoveLogo}
                            className="text-[10px] font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                          >
                            <X className="w-3 h-3" /> Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Drag & Drop Upload Zone */}
                  <div
                    onDragOver={handleLogoDragOver}
                    onDragLeave={handleLogoDragLeave}
                    onDrop={handleLogoDrop}
                    onClick={() => logoInputRef.current?.click()}
                    className={`sm:col-span-8 border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                      isDraggingLogo
                        ? 'border-primary bg-primary/10 scale-[1.01]'
                        : 'border-border hover:border-primary/60 hover:bg-surface2/80 bg-white'
                    }`}
                  >
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleLogoFile(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                    <UploadCloud className={`w-6 h-6 mb-1 transition-transform ${isDraggingLogo ? 'scale-125 text-primary' : 'text-primary/70'}`} />
                    <p className="text-xs font-bold text-text">
                      Drag & drop your school logo here, or <span className="text-primary underline">Browse File</span>
                    </p>
                    <p className="text-[10px] text-text-secondary mt-0.5">
                      Supports PNG, JPG, SVG or WebP (Max 5MB)
                    </p>
                  </div>
                </div>
              </div>

              {/* School Stamp / Official Seal (मोहर) Upload Box */}
              <div className="p-4 rounded-2xl bg-surface2/60 border border-border/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-text flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    <span>School Stamp / Official Seal (स्कूल की मोहर)</span>
                  </label>
                  {formData.schoolStamp && (
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                      Stamp Active
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  <div className="sm:col-span-4 flex items-center justify-center p-3 rounded-xl border border-dashed border-border bg-white min-h-[90px]">
                    {formData.schoolStamp ? (
                      <div className="relative group">
                        <img
                          src={formData.schoolStamp}
                          alt="School Stamp"
                          className="h-16 w-16 object-contain rounded-full border border-primary/30 p-1"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, schoolStamp: '', stampUrl: '' })}
                          className="absolute -top-2 -right-2 p-1 rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-700 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-center text-text-muted">
                        <Shield className="w-6 h-6 mx-auto mb-1 opacity-40 text-primary" />
                        <p className="text-[10px] font-medium">No Stamp Uploaded</p>
                      </div>
                    )}
                  </div>

                  <div className="sm:col-span-8 space-y-2">
                    <p className="text-[11px] text-text-secondary leading-relaxed">
                      Upload your circular official school seal / stamp (मोहर). It will be printed next to the Principal signature on Admit Cards, Marksheets, and Certificates.
                    </p>
                    <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary-dark cursor-pointer transition-all active:scale-95">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{formData.schoolStamp ? 'Replace Stamp' : 'Upload School Stamp (मोहर)'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (re) => {
                              const b64 = re.target.result;
                              setFormData({ ...formData, schoolStamp: b64, stampUrl: b64 });
                              showToast('Stamp uploaded. Click Save Changes to apply.', 'info');
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Authorized Principal Signature Upload Box (Auto Background Removal) */}
              <div className="p-4 rounded-2xl bg-surface2/60 border border-border/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-text flex items-center gap-2">
                    <FileSignature className="w-4 h-4 text-emerald-600" />
                    <span>Official Authorized Signature (Auto-Clean Background)</span>
                  </label>
                  {formData.principalSignature && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Signature Active
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  {/* Current Signature Preview */}
                  <div className="sm:col-span-4 flex items-center gap-3 bg-white p-3 rounded-xl border border-border">
                    <div className="w-20 h-14 rounded-xl border-2 border-dashed border-amber-400/40 bg-[#0A1128] flex items-center justify-center overflow-hidden flex-shrink-0 p-1">
                      {formData.principalSignature ? (
                        <img
                          src={formData.principalSignature}
                          alt="Principal Signature"
                          className="w-full h-full object-contain"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <span className="text-[10px] text-white/50 font-bold text-center">No Sign</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-text truncate">
                        {formData.principalSignature ? 'Active Sign (White)' : 'No Sign Set'}
                      </p>
                      <p className="text-[10px] text-text-secondary">
                        {formData.principalSignature ? 'Visible on Dark Cards' : 'Upload photo'}
                      </p>
                      {formData.principalSignature && (
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, principalSignature: '', signatureUrl: '' }))}
                          className="mt-1 text-[10px] font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3 h-3" /> Remove
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Drag & Drop / File Input for Signature */}
                  <label className="sm:col-span-8 border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all border-border hover:border-emerald-500/60 hover:bg-emerald-50/20 bg-white">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = async (ev) => {
                          const dataUrl = ev.target?.result;
                          if (dataUrl) {
                            showToast('Removing paper background & converting ink to White contrast...', 'info');
                            const transparent = await removeSignatureBackground(dataUrl, 210, 'white');
                            setFormData(prev => ({
                              ...prev,
                              principalSignature: transparent,
                              signatureUrl: transparent
                            }));
                            showToast('Signature converted to White ink! Click "Save Institute Profile" below to apply.', 'success');
                          }
                        };
                        reader.readAsDataURL(file);
                      }}
                      className="hidden"
                    />
                    <FileSignature className="w-6 h-6 mb-1 text-emerald-600" />
                    <p className="text-xs font-bold text-text">
                      Upload sign photo on paper, <span className="text-emerald-600 underline">Browse Image</span>
                    </p>
                    <p className="text-[10px] text-text-secondary mt-0.5">
                      ✨ Ink is automatically converted to bright <b>White contrast</b> with 100% transparent background for dark ID cards.
                    </p>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-text-secondary">
                <div>
                  <label className="block mb-1 text-text">Institute Name</label>
                  <input
                    type="text"
                    required
                    value={formData.instituteName || ''}
                    onChange={(e) => setFormData({ ...formData, instituteName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface2 border border-border text-xs text-text font-semibold focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-text">Tagline / Motto</label>
                  <input
                    type="text"
                    value={formData.tagline || ''}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface2 border border-border text-xs text-text font-semibold focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-text">Principal / Director Name</label>
                  <input
                    type="text"
                    value={formData.principalName || ''}
                    onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface2 border border-border text-xs text-text font-semibold focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-text">Affiliation / Reg Number</label>
                  <input
                    type="text"
                    value={formData.affiliationNumber || ''}
                    onChange={(e) => setFormData({ ...formData, affiliationNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface2 border border-border text-xs text-text font-semibold focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-text">Contact Mobile</label>
                  <input
                    type="tel"
                    value={formData.mobile || ''}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface2 border border-border text-xs text-text font-semibold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-text">Official Email</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface2 border border-border text-xs text-text font-semibold focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block mb-1 text-text">Campus Address</label>
                  <input
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface2 border border-border text-xs text-text font-semibold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-text">Current Academic Session</label>
                  <input
                    type="text"
                    value={formData.currentSession || '2026-27'}
                    onChange={(e) => setFormData({ ...formData, currentSession: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface2 border border-border text-xs text-text font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                {isSaved && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> Settings Saved!
                  </span>
                )}
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Institute Profile</span>
                </button>
              </div>
            </div>
          </form>

          {/* Class & Course Catalogs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-border rounded-2xl p-6 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-text uppercase tracking-wider">School Classes</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. 11th-Bio"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-surface2 border border-border text-xs text-text focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddClass}
                  className="px-3.5 py-1.5 rounded-xl bg-primary text-white font-bold text-xs cursor-pointer hover:bg-primary-dark transition-all"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto pt-2">
                {formData.schoolClasses?.map(c => (
                  <span key={c} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface2 border border-border text-xs text-text">
                    <span>Class {c}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveClass(c)}
                      className="text-rose-500 hover:text-rose-700 font-bold ml-1.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white border border-border rounded-2xl p-6 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-text uppercase tracking-wider">Computer Institute Courses</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. DCA (6 Months)"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-surface2 border border-border text-xs text-text focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddCourse}
                  className="px-3.5 py-1.5 rounded-xl bg-teal-600 text-white font-bold text-xs cursor-pointer hover:bg-teal-700 transition-all"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto pt-2">
                {formData.computerCourses?.map(c => (
                  <span key={c} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface2 border border-border text-xs text-text">
                    <span>{c}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCourse(c)}
                      className="text-rose-500 hover:text-rose-700 font-bold ml-1.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Backup & System Maintenance */}
          <div className="bg-white border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-text uppercase tracking-wider flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-emerald-600" />
              <span>Data Backup & Restore</span>
            </h3>

            <p className="text-xs text-text-secondary leading-relaxed">
              Export your complete institute database to an offline JSON file for safe-keeping, or restore an existing backup.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={exportAllDataJson}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Export Backup (JSON)</span>
              </button>

              <label className="px-4 py-2.5 rounded-xl bg-surface2 hover:bg-surface2/80 text-text font-bold text-xs border border-border flex items-center gap-2 cursor-pointer transition-all">
                <Upload className="w-4 h-4 text-primary" />
                <span>Restore Backup (JSON)</span>
                <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
              </label>
            </div>
          </div>
        </>
      ) : (
        /* ─── STEP BY STEP SETUP WIZARD ─── */
        <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col p-6 animate-in fade-in duration-200">
          
          {/* Wizard Header Info */}
          <div className="text-center pb-6 border-b border-border">
            <h3 className="text-xl font-bold text-text">Welcome to EduCore SMS</h3>
            <p className="text-xs text-text-secondary mt-1">Let's set up your institute to get started.</p>
          </div>

          {/* Stepper horizontal timeline */}
          <div className="py-6 flex items-center justify-between max-w-xl mx-auto w-full relative">
            {/* Line background */}
            <div className="absolute left-6 right-6 top-[37px] h-0.5 bg-neutral-200 -z-10" />
            <div
              className="absolute left-6 top-[37px] h-0.5 bg-primary -z-10 transition-all duration-300"
              style={{ width: wizardStep === 1 ? '0%' : wizardStep === 2 ? '50%' : '100%' }}
            />

            {/* Step 1 indicator */}
            <div className="flex flex-col items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                wizardStep >= 1 ? 'bg-primary text-white' : 'bg-neutral-200 text-text-secondary'
              }`}>
                1
              </div>
              <span className="text-[10px] font-bold text-text">Institute Info</span>
            </div>

            {/* Step 2 indicator */}
            <div className="flex flex-col items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                wizardStep >= 2 ? 'bg-primary text-white' : 'bg-neutral-200 text-text-secondary'
              }`}>
                2
              </div>
              <span className="text-[10px] font-bold text-text">Academic Session</span>
            </div>

            {/* Step 3 indicator */}
            <div className="flex flex-col items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                wizardStep >= 3 ? 'bg-primary text-white' : 'bg-neutral-200 text-text-secondary'
              }`}>
                3
              </div>
              <span className="text-[10px] font-bold text-text">Complete</span>
            </div>
          </div>

          {/* Wizard step form rendering */}
          <form onSubmit={handleWizardSubmit} className="max-w-2xl mx-auto w-full py-4">
            {wizardStep === 1 && (
              <div className="space-y-4">
                <h4 className="font-bold text-base text-text flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  <span>Institute Information</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-text-secondary">
                  <div className="sm:col-span-2">
                    <label className="block mb-1 text-text">Institute Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Lincoln High School"
                      value={formData.instituteName || ''}
                      onChange={(e) => setFormData({ ...formData, instituteName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-surface2 border border-border text-xs text-text focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-text">Institute Type *</label>
                    <select
                      value={formData.instituteType || 'School'}
                      onChange={(e) => setFormData({ ...formData, instituteType: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-surface2 border border-border text-xs text-text focus:outline-none cursor-pointer"
                    >
                      <option value="School">School</option>
                      <option value="College">College</option>
                      <option value="Coaching Institute">Coaching Institute</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1 text-text">Primary Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+1 (555) 000-0000"
                      value={formData.mobile || ''}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-surface2 border border-border text-xs text-text focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block mb-1 text-text">Official Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="admin@institute.edu"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-surface2 border border-border text-xs text-text focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block mb-1 text-text">Full Address</label>
                    <textarea
                      rows={2}
                      placeholder="123 Education Ave, City, State, Zip"
                      value={formData.address || ''}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-surface2 border border-border text-xs text-text focus:outline-none resize-none"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-2">
                    <label className="block text-text">Institute Logo</label>
                    <div className="border-2 border-dashed border-border hover:border-primary hover:bg-surface2/35 rounded-xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2">
                      <UploadCloud className="w-6 h-6 text-text-muted" />
                      <span className="font-semibold text-text">Click or drag image to upload (Max 2MB)</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Continue Setup
                  </button>
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <div className="space-y-4">
                <h4 className="font-bold text-base text-text flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-accent-gold" />
                  <span>Academic Session & Batches</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-text-secondary">
                  <div>
                    <label className="block mb-1 text-text">Academic Session *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2026-27"
                      value={formData.currentSession || ''}
                      onChange={(e) => setFormData({ ...formData, currentSession: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-surface2 border border-border text-xs text-text focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-text">Motto / Tagline</label>
                    <input
                      type="text"
                      placeholder="Empowering Minds"
                      value={formData.tagline || ''}
                      onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-surface2 border border-border text-xs text-text focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setWizardStep(1)}
                    className="px-6 py-2.5 border border-border bg-surface2 hover:bg-border text-text font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Complete Setup
                  </button>
                </div>
              </div>
            )}

            {wizardStep === 3 && (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-300 shadow-sm animate-bounce">
                  <Check className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-lg text-text">Congratulations!</h4>
                <p className="text-xs text-text-secondary max-w-sm mx-auto leading-relaxed">
                  Institute configurations have been saved. You are ready to start managing students, attendance, fees, and results!
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('config')}
                    className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Return to Settings
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Interactive Logo Cropper Modal */}
      <ImageCropperModal
        isOpen={isLogoCropperOpen}
        imageSrc={logoToCrop}
        title="Crop Institute Logo"
        initialAspect="1:1"
        onCropComplete={handleLogoCropComplete}
        onClose={() => {
          setIsLogoCropperOpen(false);
          setLogoToCrop(null);
        }}
      />
    </div>
  );
}
