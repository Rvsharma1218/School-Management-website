'use client';

import React, { useState, useRef } from 'react';
import { useSchoolStore } from '../lib/store';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  GraduationCap,
  Briefcase,
  Award,
  BookOpen,
  Edit,
  Trash2,
  Copy,
  CheckCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Camera,
  Upload,
  Crop,
  Download,
  Share2,
  Check
} from 'lucide-react';
import ImageCropperModal from './ImageCropperModal';

export default function TeacherProfileModal({ teacher, onClose, onEdit, onOpenPermissions }) {
  const {
    settings,
    updateTeacher,
    deleteTeacher,
    showToast,
    teacherAttendance
  } = useSchoolStore();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'professional' | 'credentials' | 'attendance'
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const photoInputRef = useRef(null);

  if (!teacher) return null;

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    showToast(`Copied ${fieldName} to clipboard!`, 'info');
    setTimeout(() => setCopiedField(null), 2000);
  };

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

  const handleCropComplete = async (croppedDataUrl) => {
    try {
      const uid = teacher.authUid || teacher.id || teacher.teacherId;
      await updateTeacher(uid, { ...teacher, photoUrl: croppedDataUrl });
      setIsCropperOpen(false);
      showToast('Profile photo updated successfully!', 'success');
    } catch (err) {
      showToast(`Error saving photo: ${err.message || err}`, 'error');
    }
  };

  const handleDelete = () => {
    deleteTeacher(teacher);
    onClose();
  };

  const isClassTeacher = teacher.assignedClass && teacher.assignedClass !== 'none' && teacher.assignedClass !== 'None';
  const roleLabel = isClassTeacher
    ? `Class Teacher: Class ${teacher.assignedClass}${teacher.assignedSection ? ` - ${teacher.assignedSection}` : ''}`
    : 'Subject Teacher (All Classes)';

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs p-2 sm:p-4 lg:p-6 flex justify-center items-start animate-in fade-in duration-200"
    >
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-2 sm:my-6 flex flex-col relative animate-in zoom-in-95 duration-200">
        
        {/* Cover Gradient Banner */}
        <div className="h-28 sm:h-36 bg-gradient-to-r from-indigo-700 via-primary to-blue-600 relative p-4 flex justify-between items-start">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white font-mono font-extrabold text-[11px] shadow-xs">
              {teacher.teacherId || 'T-ID'}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/80 backdrop-blur-md text-white font-bold text-[10px] flex items-center gap-1 shadow-xs">
              <CheckCircle className="w-3 h-3" />
              <span>Active Faculty</span>
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center cursor-pointer transition-all active:scale-95"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Avatar & Top Bar */}
        <div className="px-5 sm:px-6 pb-4 relative -mt-14 sm:-mt-16 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/80 bg-card">
          <div className="flex items-end gap-3.5 sm:gap-4">
            {/* Avatar with Crop / Upload overlay */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-card bg-surface2 overflow-hidden shadow-lg flex items-center justify-center text-primary font-black text-3xl">
                {teacher.photoUrl ? (
                  <img src={teacher.photoUrl} alt={teacher.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{teacher.name?.charAt(0) || 'T'}</span>
                )}
              </div>
              
              {/* Photo Change Action Overlay */}
              <button
                onClick={() => photoInputRef.current?.click()}
                className="absolute inset-0 m-auto w-full h-full rounded-2xl bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 cursor-pointer"
                title="Change Profile Photo"
              >
                <Camera className="w-5 h-5" />
                <span className="text-[10px] font-bold">Change DP</span>
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoFileSelect}
              />
            </div>

            <div className="min-w-0 pb-1">
              <h2 className="text-lg sm:text-xl font-extrabold text-text truncate">
                {teacher.name}
              </h2>
              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                <span className="text-xs font-bold text-primary">
                  {teacher.designation || 'Teacher'}
                </span>
                <span className="text-text-muted">•</span>
                <span className="text-[11px] text-text-secondary font-medium">
                  {teacher.subject || 'All Subjects'}
                </span>
              </div>
              <div className="mt-1">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10.5px] font-bold ${
                  isClassTeacher ? 'bg-primary/10 text-primary' : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                }`}>
                  <BookOpen className="w-3 h-3" />
                  <span>{roleLabel}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 self-start sm:self-end pt-1">
            {onOpenPermissions && (
              <button
                onClick={() => {
                  onClose();
                  onOpenPermissions(teacher);
                }}
                className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                title="Configure Teacher Access & Permissions"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Access</span>
              </button>
            )}

            <button
              onClick={() => {
                onClose();
                onEdit(teacher);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>

            <button
              onClick={handleDelete}
              className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 font-bold text-xs border border-rose-200 dark:border-rose-900 cursor-pointer transition-all active:scale-95"
              title="Delete Teacher"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border bg-surface2 px-5 sm:px-6 gap-1 overflow-x-auto">
          {[
            { id: 'overview', label: 'Personal Info', icon: User },
            { id: 'professional', label: 'Academic & Salary', icon: Briefcase },
            { id: 'credentials', label: 'Portal Login', icon: Mail },
            { id: 'attendance', label: 'Attendance', icon: Calendar }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-secondary hover:text-text'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div className="p-3 rounded-xl bg-surface2 border border-border/70 space-y-1">
                  <span className="text-[10.5px] text-text-muted font-medium block">Full Name</span>
                  <span className="font-bold text-text text-sm block">{teacher.name}</span>
                </div>

                <div className="p-3 rounded-xl bg-surface2 border border-border/70 space-y-1">
                  <span className="text-[10.5px] text-text-muted font-medium block">Father's Name</span>
                  <span className="font-bold text-text text-sm block">{teacher.fatherName || '—'}</span>
                </div>

                <div className="p-3 rounded-xl bg-surface2 border border-border/70 space-y-1">
                  <span className="text-[10.5px] text-text-muted font-medium block">Mother's Name</span>
                  <span className="font-bold text-text text-sm block">{teacher.motherName || '—'}</span>
                </div>

                <div className="p-3 rounded-xl bg-surface2 border border-border/70 space-y-1">
                  <span className="text-[10.5px] text-text-muted font-medium block">Date of Birth & Gender</span>
                  <span className="font-bold text-text text-sm block">
                    {teacher.dob || '—'} ({teacher.gender || 'Male'})
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-surface2 border border-border/70 space-y-1">
                  <span className="text-[10.5px] text-text-muted font-medium block">Primary Mobile</span>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-text text-sm">{teacher.mobile || '—'}</span>
                    {teacher.mobile && (
                      <button
                        onClick={() => handleCopy(teacher.mobile, 'Mobile')}
                        className="text-text-muted hover:text-primary p-1 cursor-pointer"
                        title="Copy Mobile"
                      >
                        {copiedField === 'Mobile' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-surface2 border border-border/70 space-y-1">
                  <span className="text-[10.5px] text-text-muted font-medium block">Alternate Mobile</span>
                  <span className="font-mono font-bold text-text text-sm block">{teacher.alternateMobile || '—'}</span>
                </div>

                <div className="p-3 rounded-xl bg-surface2 border border-border/70 space-y-1 sm:col-span-2">
                  <span className="text-[10.5px] text-text-muted font-medium block">Aadhaar Card Number</span>
                  <span className="font-mono font-bold text-text text-sm block">
                    {teacher.aadhaarNumber || teacher.aadharNumber || 'Not Linked / Verified'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-surface2 border border-border/70 space-y-1 sm:col-span-2">
                  <span className="text-[10.5px] text-text-muted font-medium block">Residential Address</span>
                  <span className="font-medium text-text text-xs leading-relaxed block">
                    {teacher.address || 'Address not registered'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'professional' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div className="p-3 rounded-xl bg-surface2 border border-border/70 space-y-1">
                  <span className="text-[10.5px] text-text-muted font-medium block">Highest Qualification</span>
                  <span className="font-bold text-text text-sm block">{teacher.qualification || 'B.Ed, Master Degree'}</span>
                </div>

                <div className="p-3 rounded-xl bg-surface2 border border-border/70 space-y-1">
                  <span className="text-[10.5px] text-text-muted font-medium block">Designation</span>
                  <span className="font-bold text-text text-sm block">{teacher.designation || 'Teacher'}</span>
                </div>

                <div className="p-3 rounded-xl bg-surface2 border border-border/70 space-y-1">
                  <span className="text-[10.5px] text-text-muted font-medium block">Specialization / Subject</span>
                  <span className="font-bold text-indigo-900 dark:text-indigo-300 text-sm block">{teacher.subject || 'All Subjects'}</span>
                </div>

                <div className="p-3 rounded-xl bg-surface2 border border-border/70 space-y-1">
                  <span className="text-[10.5px] text-text-muted font-medium block">Assigned Class</span>
                  <span className="font-bold text-primary text-sm block">
                    {teacher.assignedClass && teacher.assignedClass !== 'none'
                      ? `Class ${teacher.assignedClass}${teacher.assignedSection ? ` - ${teacher.assignedSection}` : ''}`
                      : 'Subject Teacher (All Classes)'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-surface2 border border-border/70 space-y-1">
                  <span className="text-[10.5px] text-text-muted font-medium block">Joining Date</span>
                  <span className="font-bold text-text text-sm block">{teacher.joiningDate || '—'}</span>
                </div>

                <div className="p-3 rounded-xl bg-surface2 border border-border/70 space-y-1">
                  <span className="text-[10.5px] text-text-muted font-medium block">Base Monthly Salary</span>
                  <span className="font-mono font-extrabold text-emerald-600 text-sm block">
                    ₹{Number(teacher.salary || 25000).toLocaleString('en-IN')} / month
                  </span>
                </div>
              </div>

              {/* Annual CTC Badge */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 block">Annual Estimated CTC</span>
                  <span className="text-[10px] text-text-secondary">Based on base monthly salary allocation</span>
                </div>
                <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                  ₹{(Number(teacher.salary || 25000) * 12).toLocaleString('en-IN')} / yr
                </span>
              </div>
            </div>
          )}

          {activeTab === 'credentials' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200">
                <span className="font-bold block mb-0.5">Faculty Portal Credentials:</span>
                Teachers can log in directly using this unique Auth Email and Password to mark attendance, manage timetable, and view records.
              </div>

              <div className="space-y-3 text-xs">
                {/* Auth Email */}
                <div className="p-3.5 rounded-xl bg-surface2 border border-border/70 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10.5px] text-text-muted font-medium block">Login Auth Email</span>
                    <span className="font-mono font-bold text-text text-xs sm:text-sm truncate block" title={teacher.authEmail || teacher.email}>
                      {teacher.authEmail || teacher.email || '—'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(teacher.authEmail || teacher.email, 'Email')}
                    className="px-2.5 py-1.5 rounded-lg bg-card hover:bg-surface border border-border text-text font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0 transition-all"
                  >
                    {copiedField === 'Email' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'Email' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {/* Password with Reveal */}
                <div className="p-3.5 rounded-xl bg-surface2 border border-border/70 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10.5px] text-text-muted font-medium block">Portal Password</span>
                    <span className="font-mono font-bold text-text text-sm block">
                      {showPassword ? (teacher.password || '123456') : '••••••••'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1.5 rounded-lg bg-card hover:bg-surface border border-border text-text-muted hover:text-text cursor-pointer"
                      title={showPassword ? 'Hide Password' : 'Show Password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleCopy(teacher.password || '123456', 'Password')}
                      className="px-2.5 py-1.5 rounded-lg bg-card hover:bg-surface border border-border text-text font-bold text-xs flex items-center gap-1 cursor-pointer transition-all"
                    >
                      {copiedField === 'Password' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedField === 'Password' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Teacher System ID */}
                <div className="p-3.5 rounded-xl bg-surface2 border border-border/70 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10.5px] text-text-muted font-medium block">System Teacher ID</span>
                    <span className="font-mono font-bold text-text text-sm">{teacher.teacherId || 'T001'}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(teacher.teacherId, 'Teacher ID')}
                    className="px-2.5 py-1.5 rounded-lg bg-card hover:bg-surface border border-border text-text font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0 transition-all"
                  >
                    {copiedField === 'Teacher ID' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'Teacher ID' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'attendance' && (() => {
            const teacherKey = teacher.id || teacher.teacherId || teacher.authUid;
            const historyLogs = [];
            let totalDays = 0;
            let presentDays = 0;
            let absentDays = 0;
            let leaveDays = 0;

            if (teacherAttendance && typeof teacherAttendance === 'object') {
              Object.entries(teacherAttendance).forEach(([date, recMap]) => {
                if (recMap && typeof recMap === 'object') {
                  const status = recMap[teacherKey] || recMap[teacher.teacherId] || recMap[teacher.authUid];
                  if (status) {
                    totalDays++;
                    if (status === 'present') presentDays++;
                    else if (status === 'absent') absentDays++;
                    else leaveDays++;
                    historyLogs.push({ date, status });
                  }
                }
              });
            }
            historyLogs.sort((a, b) => b.date.localeCompare(a.date));
            const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

            return (
              <div className="space-y-4">
                {/* Metrics row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300 block">Attendance Rate</span>
                    <span className="text-xl font-extrabold text-emerald-800 dark:text-emerald-200 block mt-0.5">{attendanceRate}%</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block">{presentDays} / {totalDays} logged days</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-surface2 border border-border/70">
                    <span className="text-[10px] uppercase font-bold text-text-secondary block">Present</span>
                    <span className="text-xl font-extrabold text-text block mt-0.5">{presentDays}</span>
                    <span className="text-[10px] text-text-muted block">Days present</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900">
                    <span className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-300 block">Absent</span>
                    <span className="text-xl font-extrabold text-rose-800 dark:text-rose-200 block mt-0.5">{absentDays}</span>
                    <span className="text-[10px] text-rose-600 dark:text-rose-400 block">Days recorded absent</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900">
                    <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300 block">Leave / Half Day</span>
                    <span className="text-xl font-extrabold text-amber-800 dark:text-amber-200 block mt-0.5">{leaveDays}</span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 block">Official leave logged</span>
                  </div>
                </div>

                {/* History table */}
                <div className="rounded-xl border border-border overflow-hidden bg-card">
                  <div className="px-4 py-2.5 bg-surface2 border-b border-border flex items-center justify-between">
                    <span className="text-xs font-bold text-text">Recent Attendance Records</span>
                    <span className="text-[10.5px] text-text-muted">{historyLogs.length} entries</span>
                  </div>

                  {historyLogs.length === 0 ? (
                    <div className="py-8 text-center text-xs text-text-muted">
                      No attendance logged for this faculty member yet.
                      <p className="text-[11px] mt-1 text-text-secondary">Mark daily teacher attendance in the Attendance module.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border max-h-56 overflow-y-auto">
                      {historyLogs.slice(0, 20).map(log => {
                        let badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                        let label = 'PRESENT';
                        if (log.status === 'absent') {
                          badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
                          label = 'ABSENT';
                        } else if (log.status === 'half_day') {
                          badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
                          label = 'HALF DAY';
                        } else if (log.status === 'leave') {
                          badgeStyle = 'bg-purple-50 text-purple-700 border-purple-200';
                          label = 'LEAVE';
                        }

                        return (
                          <div key={log.date} className="px-4 py-2.5 flex items-center justify-between text-xs hover:bg-surface2/50 transition-colors">
                            <span className="font-semibold text-text">{log.date}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeStyle}`}>
                              {label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-border bg-surface2 flex items-center justify-between text-xs">
          <span className="text-text-muted text-[11px]">
            Faculty ID: <strong className="font-mono text-text">{teacher.teacherId || 'T-ID'}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-card hover:bg-surface border border-border text-text font-bold text-xs cursor-pointer transition-all active:scale-95"
          >
            Close
          </button>
        </div>

      </div>

      {/* Embedded Photo Cropper */}
      {isCropperOpen && (
        <ImageCropperModal
          imageSrc={imageToCrop}
          onCropComplete={handleCropComplete}
          onClose={() => setIsCropperOpen(false)}
          aspectRatio={3 / 4}
        />
      )}
    </div>
  );
}
