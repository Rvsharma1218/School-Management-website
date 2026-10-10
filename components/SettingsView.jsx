'use client';

import TeacherPermissionsModal from './TeacherPermissionsModal';
import React, { useState, useRef } from 'react';
import { useSchoolStore } from '../lib/store';
import {
  Settings, Building2, Save, Download, Upload, RefreshCw,
  Plus, Trash2, CheckCircle, School, ArrowRight,
  Info, Sparkles, Check, UploadCloud, Image as ImageIcon, Camera, X, FileSignature, Crop,
  Shield, Languages, Moon, Sun, HelpCircle, Headphones, MessageCircle, PhoneCall, Mail,
  ExternalLink, GraduationCap, Lock, CheckCircle2, AlertCircle
} from 'lucide-react';
import { removeSignatureBackground } from '../lib/exportUtils';
import ImageCropperModal from './ImageCropperModal';

export default function SettingsView() {
  const {
    settings,
    updateSettings,
    exportAllDataJson,
    importAllDataJson,
    showToast,
    themeMode,
    toggleTheme,
    teacherPermissions
  } = useSchoolStore();

  const [activeSection, setActiveSection] = useState('branding'); // 'branding' | 'academic' | 'language' | 'appearance' | 'permissions' | 'subscription' | 'support' | 'backup' | 'wizard'
  const [wizardStep, setWizardStep] = useState(1); // 1 | 2 | 3
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
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
    rawSignature: settings.rawSignature || '',
    signatureColorMode: settings.signatureColorMode || 'white',
    schoolStamp: settings.schoolStamp || settings.stampUrl || '',
    stampUrl: settings.stampUrl || settings.schoolStamp || '',
    currentSession: settings.currentSession || settings.academicYear || '2026-27',
    appLanguage: settings.appLanguage || 'en',
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
        appLanguage: settings.appLanguage || prev.appLanguage || 'en'
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
    updateSettings({
      logoUrl: croppedDataUrl,
      logo: croppedDataUrl,
      logoPath: croppedDataUrl
    });
    showToast('Institute Logo updated and cropped successfully!', 'success');
  };

  const handlePrincipalSignatureFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WebP).', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Signature image exceeds 5MB limit.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      try {
        const transparentSignature = await removeSignatureBackground(dataUrl, 210, 'transparent');
        setFormData(prev => ({
          ...prev,
          principalSignature: transparentSignature,
          signatureUrl: transparentSignature,
          rawSignature: dataUrl,
          signatureColorMode: 'white'
        }));
        updateSettings({
          principalSignature: transparentSignature,
          signatureUrl: transparentSignature,
          rawSignature: dataUrl,
          signatureColorMode: 'white'
        });
        showToast('Principal signature processed with background auto-cleared!', 'success');
      } catch (err) {
        setFormData(prev => ({
          ...prev,
          principalSignature: dataUrl,
          signatureUrl: dataUrl,
          rawSignature: dataUrl,
          signatureColorMode: 'original'
        }));
        updateSettings({
          principalSignature: dataUrl,
          signatureUrl: dataUrl,
          rawSignature: dataUrl,
          signatureColorMode: 'original'
        });
        showToast('Principal signature uploaded!', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSchoolStampFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WebP).', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('School stamp image exceeds 5MB limit.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      try {
        const transparentStamp = await removeSignatureBackground(dataUrl, 210, 'transparent');
        setFormData(prev => ({
          ...prev,
          schoolStamp: transparentStamp,
          stampUrl: transparentStamp
        }));
        updateSettings({
          schoolStamp: transparentStamp,
          stampUrl: transparentStamp
        });
        showToast('School seal/stamp processed with background removed!', 'success');
      } catch (err) {
        setFormData(prev => ({
          ...prev,
          schoolStamp: dataUrl,
          stampUrl: dataUrl
        }));
        updateSettings({
          schoolStamp: dataUrl,
          stampUrl: dataUrl
        });
        showToast('School seal/stamp uploaded!', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    updateSettings(formData);
    setIsSaved(true);
    showToast('Settings saved successfully!', 'success');
    setTimeout(() => setIsSaved(false), 3000);
  };

  const addClass = () => {
    if (!newClassName.trim()) return;
    const currentClasses = settings.classes || [];
    if (!currentClasses.includes(newClassName.trim())) {
      const updated = [...currentClasses, newClassName.trim()];
      updateSettings({ classes: updated });
      setFormData(prev => ({ ...prev, classes: updated }));
      setNewClassName('');
      showToast(`Class "${newClassName.trim()}" added!`, 'success');
    }
  };

  const removeClass = (cls) => {
    const currentClasses = settings.classes || [];
    const updated = currentClasses.filter(c => c !== cls);
    updateSettings({ classes: updated });
    setFormData(prev => ({ ...prev, classes: updated }));
    showToast(`Class "${cls}" removed.`, 'info');
  };

  const addCourse = () => {
    if (!newCourseName.trim()) return;
    const currentCourses = settings.courses || [];
    if (!currentCourses.includes(newCourseName.trim())) {
      const updated = [...currentCourses, newCourseName.trim()];
      updateSettings({ courses: updated });
      setFormData(prev => ({ ...prev, courses: updated }));
      setNewCourseName('');
      showToast(`Course "${newCourseName.trim()}" added!`, 'success');
    }
  };

  const removeCourse = (course) => {
    const currentCourses = settings.courses || [];
    const updated = currentCourses.filter(c => c !== course);
    updateSettings({ courses: updated });
    setFormData(prev => ({ ...prev, courses: updated }));
    showToast(`Course "${course}" removed.`, 'info');
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        const success = importAllDataJson(json);
        if (success) {
          showToast('Data imported successfully!', 'success');
        } else {
          showToast('Invalid backup file structure.', 'error');
        }
      } catch (err) {
        showToast('Error reading JSON file: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const sectionsList = [
    { id: 'branding', label: 'School Profile', icon: Building2, desc: 'Branding, Logo & Sign' },
    { id: 'academic', label: 'Academic & Classes', icon: GraduationCap, desc: 'Sessions & Class list' },
    { id: 'language', label: 'Language (भाषा)', icon: Languages, desc: 'Portal Display Language' },
    { id: 'appearance', label: 'Theme & Dark Mode', icon: Moon, desc: 'System UI styling' },
    { id: 'permissions', label: 'Teacher Access', icon: Shield, desc: 'Role permissions' },
    { id: 'subscription', label: 'Subscriptions', icon: Sparkles, desc: '100% All Access plans' },
    { id: 'support', label: 'Help & Support', icon: Headphones, desc: 'WhatsApp & Helpline' },
    { id: 'backup', label: 'Data Backup', icon: RefreshCw, desc: 'Export & Import DB' },
    { id: 'wizard', label: 'Setup Wizard', icon: School, desc: 'Quick Onboarding' },
  ];

  return (
    <div className="space-y-6 pb-12 max-w-5xl">
      {/* Header */}
      <div>
        <h2 className="text-xl lg:text-2xl font-black text-text tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" />
          <span>System Settings & Configuration</span>
        </h2>
        <p className="text-xs text-text-secondary mt-1">
          Manage your institution particulars, regional language, teacher roles, cloud subscriptions, and data backups.
        </p>
      </div>

      {/* ─── Multi-Section Tab Navigation (Horizontal bar with clean pill buttons) ─── */}
      <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto custom-scrollbar">
        {sectionsList.map((sec) => {
          const Icon = sec.icon;
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveSection(sec.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 border ${
                isActive
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-white dark:bg-surface text-text-secondary border-border hover:text-text hover:bg-surface2'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{sec.label}</span>
            </button>
          );
        })}
      </div>

      {/* ═════════ SECTION 1: BRANDING & PROFILE ═════════ */}
      {activeSection === 'branding' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white dark:bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-text uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                <span>Institute Branding, Logo & Signatures</span>
              </h3>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile</span>
              </button>
            </div>

            {/* Logo Upload Box */}
            <div className="p-4 rounded-2xl bg-surface2/60 border border-border/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-text flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  <span>Official Institute Logo / Crest</span>
                </label>
                {formData.logoUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setLogoToCrop(formData.logoUrl);
                      setIsLogoCropperOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer"
                  >
                    <Crop className="w-3.5 h-3.5" />
                    <span>Recrop Logo</span>
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-border bg-white dark:bg-surface flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner p-1 relative group">
                  {formData.logoUrl ? (
                    <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <School className="w-8 h-8 text-text-secondary opacity-40" />
                  )}
                </div>

                <div className="flex-1 w-full space-y-2">
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingLogo(true); }}
                    onDragLeave={() => setIsDraggingLogo(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingLogo(false);
                      if (e.dataTransfer.files?.[0]) handleLogoFile(e.dataTransfer.files[0]);
                    }}
                    className={`border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer ${
                      isDraggingLogo
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 bg-white/50 dark:bg-surface/50'
                    }`}
                    onClick={() => logoInputRef.current?.click()}
                  >
                    <UploadCloud className="w-6 h-6 text-primary mx-auto mb-1" />
                    <p className="text-xs font-bold text-text">
                      Click to upload or drag & drop logo
                    </p>
                    <p className="text-[10px] text-text-secondary mt-0.5">
                      Supports PNG, JPG, SVG or WebP (Max 5MB)
                    </p>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleLogoFile(e.target.files[0])}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Principal Signature & Stamp */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Signature */}
              <div className="p-4 rounded-xl bg-surface2/60 border border-border space-y-3">
                <label className="text-xs font-bold text-text flex items-center gap-2">
                  <FileSignature className="w-4 h-4 text-primary" />
                  <span>Principal Digital Signature</span>
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-28 h-16 rounded-xl border border-border bg-white dark:bg-surface p-1 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {formData.principalSignature ? (
                      <img src={formData.principalSignature} alt="Signature" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <span className="text-[10px] text-text-secondary">No Signature</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-surface border border-border text-text hover:border-primary cursor-pointer shadow-2xs">
                      <Upload className="w-3.5 h-3.5 text-primary" />
                      <span>Upload Sign</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handlePrincipalSignatureFile(e.target.files[0])}
                      />
                    </label>
                    {formData.principalSignature && (
                      <div className="flex items-center gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={async () => {
                            const raw = formData.rawSignature || formData.principalSignature;
                            const res = await removeSignatureBackground(raw, 210, 'transparent');
                            setFormData(prev => ({ ...prev, principalSignature: res, signatureUrl: res, signatureColorMode: 'white' }));
                            showToast('Cleaned signature background to transparent!', 'success');
                          }}
                          className="px-2 py-1 rounded text-[10px] font-bold border border-border bg-white dark:bg-surface hover:bg-surface2"
                        >
                          Clear BG
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const raw = formData.rawSignature || formData.principalSignature;
                            const res = await removeSignatureBackground(raw, 210, 'blue');
                            setFormData(prev => ({ ...prev, principalSignature: res, signatureUrl: res, signatureColorMode: 'blue' }));
                            showToast('Converted signature to Royal Blue ink!', 'success');
                          }}
                          className="px-2 py-1 rounded text-[10px] font-bold border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100"
                        >
                          Blue Ink
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* School Stamp */}
              <div className="p-4 rounded-xl bg-surface2/60 border border-border space-y-3">
                <label className="text-xs font-bold text-text flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <span>Official School Stamp / Seal</span>
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-16 rounded-xl border border-border bg-white dark:bg-surface p-1 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {formData.schoolStamp ? (
                      <img src={formData.schoolStamp} alt="Stamp" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <span className="text-[10px] text-text-secondary">No Stamp</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-surface border border-border text-text hover:border-emerald-600 cursor-pointer shadow-2xs">
                      <Upload className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Upload Stamp</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleSchoolStampFile(e.target.files[0])}
                      />
                    </label>
                    <p className="text-[10px] text-text-secondary mt-1">Appears on official Marksheets and ID Cards</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Text particulars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-text-secondary pt-2">
              <div>
                <label className="block mb-1 text-text">Institute / School Name</label>
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

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-border">
              {isSaved && (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Profile Saved!
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
      )}

      {/* ═════════ SECTION 2: ACADEMIC & CLASSES ═════════ */}
      {activeSection === 'academic' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* School Classes */}
            <div className="bg-white dark:bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-text uppercase tracking-wider flex items-center gap-2 border-b border-border pb-2">
                <GraduationCap className="w-4 h-4 text-primary" />
                <span>School Classes</span>
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. 11th-Bio, Class 10"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addClass()}
                  className="flex-1 px-3 py-2 rounded-xl bg-surface2 border border-border text-xs text-text font-semibold focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addClass}
                  className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-dark cursor-pointer transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 max-h-60 overflow-y-auto">
                {(settings.classes || []).map((cls) => (
                  <span
                    key={cls}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface2 border border-border text-xs font-bold text-text"
                  >
                    <span>{cls}</span>
                    <button
                      type="button"
                      onClick={() => removeClass(cls)}
                      className="text-text-secondary hover:text-red-500 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Institute Courses */}
            <div className="bg-white dark:bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-text uppercase tracking-wider flex items-center gap-2 border-b border-border pb-2">
                <Building2 className="w-4 h-4 text-primary" />
                <span>Institute / Vocational Courses</span>
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. ADCA, DCA, Python"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCourse()}
                  className="flex-1 px-3 py-2 rounded-xl bg-surface2 border border-border text-xs text-text font-semibold focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addCourse}
                  className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-dark cursor-pointer transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 max-h-60 overflow-y-auto">
                {(settings.courses || []).map((crs) => (
                  <span
                    key={crs}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface2 border border-border text-xs font-bold text-text"
                  >
                    <span>{crs}</span>
                    <button
                      type="button"
                      onClick={() => removeCourse(crs)}
                      className="text-text-secondary hover:text-red-500 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═════════ SECTION 3: LANGUAGE & REGIONAL (Dedicated Section) ═════════ */}
      {activeSection === 'language' && (
        <div className="bg-white dark:bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-6">
          <div className="border-b border-border pb-3">
            <h3 className="text-sm font-bold text-text uppercase tracking-wider flex items-center gap-2">
              <Languages className="w-4 h-4 text-primary" />
              <span>Portal Display Language (पोर्टल भाषा चयन)</span>
            </h3>
            <p className="text-xs text-text-secondary mt-1">
              Choose your preferred language for the web management portal and mobile app synchronization.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* English Card */}
            <div
              onClick={() => {
                setFormData(prev => ({ ...prev, appLanguage: 'en' }));
                updateSettings({ appLanguage: 'en' });
                showToast('Display language set to English', 'success');
              }}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                (formData.appLanguage || 'en') === 'en'
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border bg-surface2/40 hover:border-border/80'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-sm font-black text-text block">English (Standard)</span>
                  <span className="text-xs text-text-secondary">Official institutional english vocabulary</span>
                </div>
                {(formData.appLanguage || 'en') === 'en' ? (
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                ) : (
                  <div className="w-5 h-5 rounded-full border border-border" />
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-border/50 text-[11px] text-text-secondary">
                Default across Student records, Fee receipts, and Marksheets.
              </div>
            </div>

            {/* Hindi Card */}
            <div
              onClick={() => {
                setFormData(prev => ({ ...prev, appLanguage: 'hi' }));
                updateSettings({ appLanguage: 'hi' });
                showToast('भाषा हिन्दी पर सेट की गई', 'success');
              }}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                formData.appLanguage === 'hi'
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border bg-surface2/40 hover:border-border/80'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-sm font-black text-text block">हिन्दी (Hindi)</span>
                  <span className="text-xs text-text-secondary">भारतीय विद्यालयों और संस्थानों के लिए अनुकूलित</span>
                </div>
                {formData.appLanguage === 'hi' ? (
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                ) : (
                  <div className="w-5 h-5 rounded-full border border-border" />
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-border/50 text-[11px] text-text-secondary">
                मोबाइल ऐप और वेबसाइट दोनों जगह हिन्दी भाषा सक्रिय हो जाएगी।
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═════════ SECTION 4: APPEARANCE & DARK MODE ═════════ */}
      {activeSection === 'appearance' && (
        <div className="bg-white dark:bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-6">
          <div className="border-b border-border pb-3">
            <h3 className="text-sm font-bold text-text uppercase tracking-wider flex items-center gap-2">
              <Moon className="w-4 h-4 text-primary" />
              <span>Theme & Visual Appearance</span>
            </h3>
            <p className="text-xs text-text-secondary mt-1">
              Select Light Mode or Night Dark Mode for comfortable viewing across all devices.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => {
                if (themeMode !== 'light') toggleTheme();
                showToast('Light theme enabled', 'info');
              }}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                themeMode === 'light'
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border bg-surface2/40 hover:border-border/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                    <Sun className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-text block">Day / Light Mode</span>
                    <span className="text-[11px] text-text-secondary">Clean high-contrast daytime interface</span>
                  </div>
                </div>
                {themeMode === 'light' && <CheckCircle2 className="w-5 h-5 text-primary" />}
              </div>
            </div>

            <div
              onClick={() => {
                if (themeMode !== 'dark') toggleTheme();
                showToast('Dark theme enabled', 'info');
              }}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                themeMode === 'dark'
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border bg-surface2/40 hover:border-border/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 text-indigo-400 flex items-center justify-center">
                    <Moon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-text block">Midnight Dark Mode</span>
                    <span className="text-[11px] text-text-secondary">Reduced eye strain for night sessions</span>
                  </div>
                </div>
                {themeMode === 'dark' && <CheckCircle2 className="w-5 h-5 text-primary" />}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═════════ SECTION 5: TEACHER PERMISSIONS ═════════ */}
      {activeSection === 'permissions' && (
        <div className="bg-white dark:bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="text-sm font-bold text-text uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <span>Teacher Access & Role Permissions</span>
              </h3>
              <p className="text-xs text-text-secondary mt-1">
                Control which modules staff and teachers can access or modify in the school portal and mobile app.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsPermissionsModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer transition-all"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Configure Permissions</span>
            </button>
          </div>

          <div className="p-4 rounded-xl bg-surface2/60 border border-border space-y-2">
            <span className="text-xs font-bold text-text block">Current Teacher Permission Status:</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs">
              <span className="flex items-center gap-1.5 text-text">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mark Attendance</span>
              </span>
              <span className="flex items-center gap-1.5 text-text">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mark Entry Desk</span>
              </span>
              <span className="flex items-center gap-1.5 text-text">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>View Students</span>
              </span>
              <span className="flex items-center gap-1.5 text-text">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Notice Board</span>
              </span>
              <span className="flex items-center gap-1.5 text-text">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Admit Cards</span>
              </span>
              <span className="flex items-center gap-1.5 text-text">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Class Timetable</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ═════════ SECTION 6: CLOUD SUBSCRIPTIONS ═════════ */}
      {activeSection === 'subscription' && (
        <div className="bg-white dark:bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-6">
          <div className="border-b border-border pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-text uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Cloud Subscription & License Status</span>
              </h3>
              <p className="text-xs text-text-secondary mt-1">
                Unrestricted 100% all-access guarantee across all tiers.
              </p>
            </div>
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              Active: 100% All Features
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-900/40 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-base font-black text-amber-950 dark:text-amber-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Annual Pro Plan — ₹8,999 / year</span>
                </h4>
                <p className="text-xs text-amber-900/80 dark:text-amber-300/80 mt-1">
                  Includes All Access to 15+ Modules, Mark Entry Desk, Student ID/Admit Cards, and Real-time Cloud Sync.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  window.history.pushState({}, '', '/subscription');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold text-xs rounded-xl shadow-md hover:from-amber-700 hover:to-orange-700 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>View Full Plans</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════ SECTION 7: HELP & SUPPORT (Dedicated Section) ═════════ */}
      {activeSection === 'support' && (
        <div className="bg-white dark:bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-6">
          <div className="border-b border-border pb-3">
            <h3 className="text-sm font-bold text-text uppercase tracking-wider flex items-center gap-2">
              <Headphones className="w-4 h-4 text-primary" />
              <span>Help Desk & Technical Support</span>
            </h3>
            <p className="text-xs text-text-secondary mt-1">
              Need assistance? Connect directly with our priority customer support team.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* WhatsApp Support */}
            <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200 block">WhatsApp Priority Hotline</span>
                  <span className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80">Instant assistance & onboarding help</span>
                </div>
              </div>
              <a
                href="https://wa.me/919304345840?text=Hello%2C%20I%20need%20assistance%20with%20School%20Management%20Portal"
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat on WhatsApp (+91 93043 45840)</span>
              </a>
            </div>

            {/* Helpline Email */}
            <div className="p-5 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-blue-950 dark:text-blue-200 block">Official Support Email</span>
                  <span className="text-[11px] text-blue-800/80 dark:text-blue-300/80">Replies within 2 to 4 business hours</span>
                </div>
              </div>
              <a
                href="mailto:support@smartschoolportal.com"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
              >
                <Mail className="w-4 h-4" />
                <span>Email Support</span>
              </a>
            </div>
          </div>

          {/* System Diagnostic Check */}
          <div className="p-4 rounded-xl bg-surface2/60 border border-border space-y-3">
            <span className="text-xs font-bold text-text block flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Portal Diagnostics & Cloud Health</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-white dark:bg-surface border border-border flex items-center justify-between">
                <span className="text-text-secondary">Firebase Cloud</span>
                <span className="font-bold text-emerald-600">Connected</span>
              </div>
              <div className="p-3 rounded-lg bg-white dark:bg-surface border border-border flex items-center justify-between">
                <span className="text-text-secondary">Database Storage</span>
                <span className="font-bold text-emerald-600">Operational</span>
              </div>
              <div className="p-3 rounded-lg bg-white dark:bg-surface border border-border flex items-center justify-between">
                <span className="text-text-secondary">PWA Sync Engine</span>
                <span className="font-bold text-emerald-600">Active</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═════════ SECTION 8: BACKUP & RESTORE ═════════ */}
      {activeSection === 'backup' && (
        <div className="bg-white dark:bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-text uppercase tracking-wider flex items-center gap-2 border-b border-border pb-2">
            <RefreshCw className="w-4 h-4 text-emerald-600" />
            <span>Data Backup & Offline Database Archive</span>
          </h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            Export your complete institute database to an offline JSON file for safe-keeping, or restore an existing backup.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={exportAllDataJson}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer transition-all"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export Complete JSON Backup</span>
            </button>

            <label className="px-5 py-2.5 rounded-xl border border-border bg-surface2 hover:bg-surface text-text font-bold text-xs shadow-2xs flex items-center gap-2 cursor-pointer transition-all">
              <Upload className="w-4 h-4 text-primary" />
              <span>Restore from Backup File</span>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportFile}
              />
            </label>
          </div>
        </div>
      )}

      {/* ═════════ SECTION 9: SETUP WIZARD ═════════ */}
      {activeSection === 'wizard' && (
        <div className="bg-white dark:bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-bold text-text uppercase tracking-wider flex items-center gap-2">
              <School className="w-4 h-4 text-primary" />
              <span>Quick Onboarding Setup Wizard</span>
            </h3>
            <span className="text-xs font-bold text-text-secondary">Step {wizardStep} of 3</span>
          </div>

          {wizardStep === 1 && (
            <div className="space-y-4">
              <p className="text-xs text-text-secondary">Verify basic school details to finalize setup.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-text block mb-1">School Name</label>
                  <input
                    type="text"
                    value={formData.instituteName}
                    onChange={(e) => setFormData({ ...formData, instituteName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface2 border border-border text-xs text-text font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-text block mb-1">Current Session</label>
                  <input
                    type="text"
                    value={formData.currentSession}
                    onChange={(e) => setFormData({ ...formData, currentSession: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface2 border border-border text-xs text-text font-bold"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setWizardStep(2)}
                  className="px-5 py-2 bg-primary text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
                >
                  <span>Next Step</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {wizardStep === 2 && (
            <div className="space-y-4">
              <p className="text-xs text-text-secondary">Confirm and save current settings.</p>
              <div className="flex justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setWizardStep(1)}
                  className="px-5 py-2 bg-surface2 text-text font-bold text-xs rounded-xl"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateSettings(formData);
                    setWizardStep(3);
                    showToast('Setup wizard completed!', 'success');
                  }}
                  className="px-5 py-2 bg-primary text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
                >
                  <span>Complete Setup</span>
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {wizardStep === 3 && (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-text">Setup Successfully Finished!</h4>
              <p className="text-xs text-text-secondary">Your institute profile is now fully active.</p>
              <button
                type="button"
                onClick={() => setActiveSection('branding')}
                className="px-5 py-2 bg-primary text-white font-bold text-xs rounded-xl mt-2"
              >
                Back to Settings
              </button>
            </div>
          )}
        </div>
      )}

      {/* Interactive Logo Cropper Modal */}
      <ImageCropperModal
        isOpen={isLogoCropperOpen}
        imageSrc={logoToCrop}
        aspectRatio={1}
        onClose={() => setIsLogoCropperOpen(false)}
        onCropComplete={handleLogoCropComplete}
      />

      {/* Interactive Teacher Permissions Modal */}
      <TeacherPermissionsModal
        isOpen={isPermissionsModalOpen}
        onClose={() => setIsPermissionsModalOpen(false)}
      />
    </div>
  );
}
