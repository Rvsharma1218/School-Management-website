'use client';

import TeacherPermissionsModal from './TeacherPermissionsModal';

import React, { useState, useRef } from 'react';
import { useSchoolStore, getNextTeacherId, getActiveSchoolId } from '../lib/store';
import { t } from '../lib/translations';
import { exportFacultyToExcel, exportFacultyPDF } from '../lib/exportUtils';
import ImageCropperModal from './ImageCropperModal';
import {
  GraduationCap,
  Plus,
  Trash2,
  Edit,
  Phone,
  Mail,
  ShieldCheck,
  UserCheck,
  CheckCircle,
  X,
  Search,
  Key,
  Copy,
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
  MapPin,
  User,
  BookOpen,
  Briefcase,
  Award,
  CreditCard,
  Camera,
  Upload,
  Crop
} from 'lucide-react';

export default function TeachersView() {
  const {
    teachers,
    settings,
    addTeacher,
    updateTeacher,
    deleteTeacher,
    userRole,
    setUserRole,
    currentTeacher,
    setCurrentTeacher,
    showToast
  } = useSchoolStore();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isPermsModalOpen, setIsPermsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [selectedTeacherForHistory, setSelectedTeacherForHistory] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const photoInputRef = useRef(null);

  const handlePhotoFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        setImageToCrop(dataUrl);
        setIsCropperOpen(true);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleCropComplete = (croppedDataUrl) => {
    setFormData(prev => ({
      ...prev,
      photoUrl: croppedDataUrl
    }));
    showToast('Teacher profile photo cropped & applied!', 'success');
  };

  const defaultFormData = {
    name: '',
    fatherName: '',
    motherName: '',
    mobile: '',
    alternateMobile: '',
    password: '123456',
    assignedClass: '',
    assignedSection: '',
    dob: '1992-05-15',
    gender: 'Male',
    address: '',
    aadhaarNumber: '',
    qualification: 'B.Ed, M.Sc',
    designation: 'Subject Teacher',
    subject: 'All Subjects',
    joiningDate: new Date().toISOString().split('T')[0],
    salary: 25000,
    photoUrl: ''
  };

  const [formData, setFormData] = useState(defaultFormData);

  const activeSchoolId = getActiveSchoolId();

  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setFormData({
      ...defaultFormData,
      assignedClass: ''
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (t) => {
    setEditingTeacher(t);
    setFormData({
      name: t.name || '',
      fatherName: t.fatherName || '',
      motherName: t.motherName || '',
      mobile: t.mobile || '',
      alternateMobile: t.alternateMobile || '',
      password: t.password || '123456',
      assignedClass: (t.assignedClass && t.assignedClass !== 'none' && t.assignedClass !== 'None') ? t.assignedClass : '',
      assignedSection: t.assignedSection || '',
      dob: t.dob ? (typeof t.dob === 'string' ? t.dob.split('T')[0] : t.dob) : '1992-05-15',
      gender: t.gender || 'Male',
      address: t.address || '',
      aadhaarNumber: t.aadhaarNumber || t.aadharNumber || '',
      qualification: t.qualification || 'B.Ed, M.Sc',
      designation: t.designation || 'Teacher',
      subject: t.subject || t.subjects || 'All Subjects',
      joiningDate: t.joiningDate ? (typeof t.joiningDate === 'string' ? t.joiningDate.split('T')[0] : t.joiningDate) : new Date().toISOString().split('T')[0],
      salary: t.salary || 25000,
      photoUrl: t.photoUrl || ''
    });
    setIsAddOpen(true);
  };

  const handleCopyEmail = (email, id) => {
    if (!email) return;
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    showToast(`Copied "${email}" to clipboard!`, 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      showToast("Please enter teacher name.", "error");
      return;
    }

    try {
      if (editingTeacher) {
        const uid = editingTeacher.authUid || editingTeacher.id || editingTeacher.teacherId;
        await updateTeacher(uid, formData);
        showToast(`Teacher "${formData.name}" updated successfully!`, "success");
      } else {
        await addTeacher(formData);
        showToast(`Teacher "${formData.name}" added successfully with name-based Auth email!`, "success");
      }
      setIsAddOpen(false);
    } catch (err) {
      showToast(`Error saving teacher: ${err.message || err}`, "error");
    }
  };

  // Preview generated email in the modal
  const nextTeacherId = getNextTeacherId(teachers);
  const namePart = (formData.name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 12);
  const schoolPart = (activeSchoolId || 'school001').toLowerCase().replace(/[^a-z0-9]/g, '');
  const previewEmail = `${namePart || 'name'}.${(editingTeacher?.teacherId || nextTeacherId).toLowerCase()}@${schoolPart}.teachers`;

  const filteredTeachers = teachers.filter(t => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (t.name && t.name.toLowerCase().includes(q)) ||
      (t.teacherId && t.teacherId.toLowerCase().includes(q)) ||
      (t.mobile && t.mobile.includes(q)) ||
      (t.subject && t.subject.toLowerCase().includes(q)) ||
      (t.qualification && t.qualification.toLowerCase().includes(q)) ||
      (t.assignedClass && String(t.assignedClass).toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-extrabold text-text tracking-tight">
            Faculty & Teacher Management
          </h2>
          <p className="text-xs lg:text-sm text-text-secondary">
            Complete teacher profiles, personal & academic details, and portal credentials
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {teachers.length > 0 && (
            <>
              <button
                onClick={() => exportFacultyToExcel(teachers, settings.instituteName || 'School')}
                className="px-3 py-2 rounded-xl bg-surface2 hover:bg-border text-text font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                title="Export Faculty List to Excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">Export Excel</span>
              </button>
              <button
                onClick={() => exportFacultyPDF(teachers, settings)}
                className="px-3 py-2 rounded-xl bg-surface2 hover:bg-border text-text font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                title="Export Faculty List to PDF"
              >
                <FileText className="w-4 h-4 text-primary" />
                <span className="hidden sm:inline">Export PDF</span>
              </button>
            </>
          )}

          <button
            onClick={() => setIsPermsModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#1E3A8A] hover:bg-[#152865] text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            title="Configure teacher login access (ON / OFF switches)"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{t('teacherAccess', settings?.appLanguage || 'en')}</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add New Teacher</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search teacher by name, ID, subject, mobile..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-xs text-text font-medium focus:outline-none focus:border-primary shadow-xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Teachers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeachers.length === 0 ? (
          <div className="col-span-full py-16 text-center text-text-muted text-xs bg-card border border-border rounded-2xl">
            {searchQuery ? 'No teachers found matching your search.' : "No teachers added yet. Click 'Add New Teacher' to allocate faculty responsibilities."}
          </div>
        ) : (
          filteredTeachers.map((teacher, idx) => {
            const teacherKey = teacher.authUid || teacher.id || `tch_${idx}`;
            const displayEmail = teacher.authEmail || teacher.email || `${(teacher.name || 'teacher').toLowerCase().replace(/[^a-z0-9]/g, '')}.${(teacher.teacherId || `T${idx+1}`).toLowerCase()}@${schoolPart}.teachers`;

            return (
              <div
                key={teacherKey}
                className="bg-card border border-border rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-primary text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0 overflow-hidden">
                        {teacher.photoUrl ? (
                          <img src={teacher.photoUrl} alt={teacher.name} className="w-full h-full object-cover" />
                        ) : (
                          teacher.name?.charAt(0) || 'T'
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-text truncate">{teacher.name}</h4>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] text-primary font-mono font-bold">
                            {teacher.teacherId || `T${String(idx + 1).padStart(3, '0')}`}
                          </span>
                          {teacher.designation && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface2 text-text-secondary font-medium">
                              {teacher.designation}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(teacher)}
                        className="p-1.5 rounded-lg bg-surface2 hover:bg-border text-text-muted hover:text-text cursor-pointer transition-colors"
                        title="Edit Teacher"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteTeacher(teacher)}
                        className="p-1.5 rounded-lg bg-surface2 hover:bg-rose-100 text-text-muted hover:text-rose-600 cursor-pointer transition-colors"
                        title="Delete Teacher"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 py-2.5 border-y border-border/60 text-xs">
                    {/* Assigned Class / Role */}
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary font-medium">Role / Class:</span>
                      {teacher.assignedClass && teacher.assignedClass !== 'none' && teacher.assignedClass !== 'None' ? (
                        <span className="font-bold text-primary px-2 py-0.5 rounded-md bg-primary/10 text-[11px]">
                          Class {teacher.assignedClass}{teacher.assignedSection ? ` — Sec ${teacher.assignedSection}` : ''}
                        </span>
                      ) : (
                        <span className="font-bold text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-[11px] flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-emerald-600" />
                          <span>Subject Teacher (All Classes)</span>
                        </span>
                      )}
                    </div>

                    {teacher.subject && (
                      <div className="flex items-center justify-between">
                        <span className="text-text-secondary font-medium">Subject(s):</span>
                        <span className="font-semibold text-text text-[11px]">{teacher.subject}</span>
                      </div>
                    )}

                    {teacher.qualification && (
                      <div className="flex items-center justify-between">
                        <span className="text-text-secondary font-medium">Qualification:</span>
                        <span className="font-semibold text-text text-[11px]">{teacher.qualification}</span>
                      </div>
                    )}

                    {teacher.fatherName && (
                      <div className="flex items-center justify-between">
                        <span className="text-text-secondary font-medium">Father's Name:</span>
                        <span className="font-semibold text-text text-[11px]">{teacher.fatherName}</span>
                      </div>
                    )}

                    {/* Auth Login Email */}
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-text-secondary font-medium shrink-0">Auth Email:</span>
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="font-mono text-[11px] text-indigo-950 dark:text-indigo-200 font-bold truncate max-w-[170px]" title={displayEmail}>
                          {displayEmail}
                        </span>
                        <button
                          onClick={() => handleCopyEmail(displayEmail, teacherKey)}
                          className="p-1 text-slate-400 hover:text-primary rounded cursor-pointer"
                          title="Copy Email"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {teacher.mobile && (
                      <div className="flex items-center justify-between">
                        <span className="text-text-secondary font-medium">Mobile:</span>
                        <span className="font-mono text-text font-semibold">{teacher.mobile}</span>
                      </div>
                    )}

                    {teacher.alternateMobile && (
                      <div className="flex items-center justify-between">
                        <span className="text-text-secondary font-medium">Alt Phone:</span>
                        <span className="font-mono text-text font-semibold">{teacher.alternateMobile}</span>
                      </div>
                    )}

                    {teacher.address && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-text-secondary font-medium shrink-0">Address:</span>
                        <span className="text-text font-normal truncate text-[11px]" title={teacher.address}>{teacher.address}</span>
                      </div>
                    )}

                    {/* Salary & History */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-text-secondary font-medium">Base Salary:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-emerald-600 font-mono text-[11px] bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                          ₹{Number(teacher.salary || 25000).toLocaleString()} / mo
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedTeacherForHistory(teacher)}
                          className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold border border-indigo-200 dark:border-indigo-800 cursor-pointer transition-colors"
                        >
                          Salary History
                        </button>
                      </div>
                    </div>

                    {teacher.password && (
                      <div className="flex items-center justify-between">
                        <span className="text-text-secondary font-medium">Login Password:</span>
                        <span className="font-mono text-text font-semibold">{teacher.password}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle className="w-3 h-3" />
                    <span>Active Faculty</span>
                  </span>
                  <span className="text-[10px] text-text-muted font-medium">
                    {teacher.designation || 'Class Teacher'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Teacher Modal (Complete Student-Like Details) */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="px-5 sm:px-6 py-4 border-b border-border bg-surface2 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-text">
                  {editingTeacher ? `Edit Faculty Details: ${editingTeacher.name}` : 'Add New Faculty / Teacher'}
                </h3>
                <p className="text-[11px] text-text-secondary">
                  Complete personal, academic, employment details & dedicated portal credentials
                </p>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-border/60 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 text-xs max-h-[80vh] overflow-y-auto">
              {/* Photo Avatar with Actions (Identical to Student) */}
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-surface2/60 p-3.5 rounded-2xl border border-border/80">
                <div className="w-20 h-24 rounded-2xl bg-slate-900 border-2 border-dashed border-amber-400/60 overflow-hidden relative flex items-center justify-center text-text-muted group shadow-xs shrink-0">
                  {formData.photoUrl ? (
                    <img
                      src={formData.photoUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                      <User className="w-8 h-8 mb-1 text-slate-400/80" />
                      <span className="text-[9px] font-bold text-slate-400">No Photo</span>
                    </div>
                  )}

                  <label className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold">
                    <Camera className="w-4 h-4 mb-1 text-amber-300" />
                    <span>{formData.photoUrl ? 'Change' : 'Upload'}</span>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex flex-col gap-1.5 text-center sm:text-left">
                  <span className="font-bold text-xs text-text">Teacher Profile Photo (DP)</span>
                  <span className="text-[10px] text-text-muted">High-res compressed photo (&lt;100KB, 3:4 aspect ratio)</span>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="px-2.5 py-1 rounded-lg bg-primary hover:bg-primary-dark text-white text-[11px] font-bold flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                    >
                      <Upload className="w-3 h-3" />
                      <span>{formData.photoUrl ? 'Change Photo' : 'Upload Photo'}</span>
                    </button>
                    {formData.photoUrl && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setImageToCrop(formData.photoUrl);
                            setIsCropperOpen(true);
                          }}
                          className="px-2 py-1 rounded-lg bg-amber-400 hover:bg-amber-500 text-slate-950 text-[11px] font-bold flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                        >
                          <Crop className="w-3 h-3" />
                          <span>Crop</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, photoUrl: '' }))}
                          className="p-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-[11px] font-bold cursor-pointer transition-colors"
                          title="Remove Photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 1: Personal Information */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-border text-primary font-bold text-xs uppercase tracking-wider">
                  <User className="w-3.5 h-3.5" />
                  <span>1. Personal Information</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-text mb-1">
                      Teacher Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Suraj Sharma"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface2 border border-border text-xs text-text font-bold focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-text mb-1">
                      Father's Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Sharma"
                      value={formData.fatherName}
                      onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface2 border border-border text-xs text-text font-medium focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-text mb-1">
                      Mother's Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sunita Devi"
                      value={formData.motherName}
                      onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface2 border border-border text-xs text-text font-medium focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-text mb-1">
                      Gender
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-surface2 border border-border text-xs text-text font-medium focus:outline-none focus:border-primary cursor-pointer"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-text mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface2 border border-border text-xs text-text font-medium focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-text mb-1">
                      Aadhaar Number
                    </label>
                    <input
                      type="text"
                      maxLength={12}
                      placeholder="e.g. 1234 5678 9012"
                      value={formData.aadhaarNumber}
                      onChange={(e) => setFormData({ ...formData, aadhaarNumber: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface2 border border-border text-xs text-text font-mono focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Contact & Residential Details */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-border text-primary font-bold text-xs uppercase tracking-wider">
                  <Phone className="w-3.5 h-3.5" />
                  <span>2. Contact & Address</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-text mb-1">
                      Primary Mobile Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface2 border border-border text-xs text-text font-mono focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-text mb-1">
                      Alternate Mobile / WhatsApp
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 9123456789"
                      value={formData.alternateMobile}
                      onChange={(e) => setFormData({ ...formData, alternateMobile: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface2 border border-border text-xs text-text font-mono focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-text mb-1">
                      Residential Address
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Village/Town, Post, District, PIN Code"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface2 border border-border text-xs text-text font-medium focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Academic & Employment Details */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-border text-primary font-bold text-xs uppercase tracking-wider">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>3. Academic & Employment Details</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-text mb-1">
                      Highest Qualification
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. B.Ed, M.Sc (Mathematics)"
                      value={formData.qualification}
                      onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface2 border border-border text-xs text-text font-medium focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-text mb-1">
                      Designation / Role
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Senior Faculty / TGT / PRT"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface2 border border-border text-xs text-text font-medium focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-text mb-1">
                      Teaching Subject(s)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Mathematics, Science"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface2 border border-border text-xs text-text font-medium focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-text mb-1">
                      Monthly Base Salary (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 25000"
                      value={formData.salary}
                      onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface2 border border-border text-xs text-text font-mono font-bold focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-text mb-1 flex items-center justify-between">
                      <span>Assign Class (Optional)</span>
                      <span className="text-[10px] text-text-muted font-normal">Optional if Subject Teacher</span>
                    </label>
                    <select
                      value={formData.assignedClass}
                      onChange={(e) => setFormData({ ...formData, assignedClass: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface2 border border-border text-xs text-text font-bold focus:outline-none focus:border-primary cursor-pointer"
                    >
                      <option value="">-- None (Subject Teacher / All Classes) --</option>
                      {settings.schoolClasses?.map(c => <option key={c} value={c}>Class {c}</option>)}
                      {settings.computerCourses?.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-text mb-1">Section</label>
                    <select
                      disabled={!formData.assignedClass || formData.assignedClass === 'none'}
                      value={formData.assignedSection}
                      onChange={(e) => setFormData({ ...formData, assignedSection: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface2 border border-border text-xs text-text font-bold focus:outline-none focus:border-primary cursor-pointer disabled:opacity-50"
                    >
                      <option value="">None / Not Applicable</option>
                      {['A', 'B', 'C', 'D', 'E'].map(s => <option key={s} value={s}>Section {s}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-text mb-1">Date of Joining</label>
                    <input
                      type="date"
                      value={formData.joiningDate}
                      onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface2 border border-border text-xs text-text font-medium focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: Portal Credentials */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-border text-primary font-bold text-xs uppercase tracking-wider">
                  <Key className="w-3.5 h-3.5" />
                  <span>4. Teacher Portal Login Credentials</span>
                </div>

                {/* Dynamic Generated Email Preview */}
                <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Auto Generated Auth Email:</span>
                    </span>
                    <span className="text-[10px] text-indigo-600 font-mono font-bold">
                      {editingTeacher?.teacherId || nextTeacherId}
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-indigo-900 dark:text-indigo-300 font-bold break-all bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-indigo-200/60 dark:border-indigo-800">
                    {previewEmail}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-text mb-1 flex items-center justify-between">
                    <span>Portal Login Password <span className="text-rose-500">*</span></span>
                    <span className="text-[10px] text-text-muted font-normal">For Teacher Login</span>
                  </label>
                  <div className="relative">
                    <Key className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Enter password (e.g. 123456)"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-surface2 border border-border text-xs text-text font-mono focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-surface2 hover:bg-border text-text font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold cursor-pointer shadow-md transition-all"
                >
                  {editingTeacher ? 'Update Teacher' : 'Save Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Salary History & Payslip Modal */}
      {selectedTeacherForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-border bg-surface2 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-text">
                  Salary & Payroll Register — {selectedTeacherForHistory.name}
                </h3>
                <p className="text-[11px] text-text-secondary">
                  Class {selectedTeacherForHistory.assignedClass} Teacher | Monthly Base: ₹{(selectedTeacherForHistory.salary || 25000).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedTeacherForHistory(null)}
                className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-surface2 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-2.5">
                {[
                  { month: 'October 2026', amount: selectedTeacherForHistory.salary || 25000, date: '05/10/2026', ref: 'PAY-2026-10-098', status: 'PAID' },
                  { month: 'September 2026', amount: selectedTeacherForHistory.salary || 25000, date: '04/09/2026', ref: 'PAY-2026-09-074', status: 'PAID' },
                  { month: 'August 2026', amount: selectedTeacherForHistory.salary || 25000, date: '05/08/2026', ref: 'PAY-2026-08-051', status: 'PAID' }
                ].map((s, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-border bg-surface2 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-text">{s.month}</div>
                      <div className="text-[10px] text-text-muted">Paid on {s.date} • {s.ref}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-xs text-emerald-600">₹{s.amount.toLocaleString()}</div>
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                        {s.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {isPermsModalOpen && (
        <TeacherPermissionsModal
          isOpen={isPermsModalOpen}
          onClose={() => setIsPermsModalOpen(false)}
        />
      )}

      {/* Teacher Photo Cropper Modal */}
      <ImageCropperModal
        isOpen={isCropperOpen}
        imageSrc={imageToCrop}
        title="Crop Teacher Profile Photo (DP)"
        initialAspect="3:4"
        onCropComplete={handleCropComplete}
        onClose={() => setIsCropperOpen(false)}
      />
    </div>
  );
}
