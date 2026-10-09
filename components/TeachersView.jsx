'use client';

import React, { useState } from 'react';
import { useSchoolStore, getNextTeacherId, getActiveSchoolId } from '../lib/store';
import { exportFacultyToExcel, exportFacultyPDF } from '../lib/exportUtils';
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
  FileText
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
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [selectedTeacherForHistory, setSelectedTeacherForHistory] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    password: 'teacher123',
    assignedClass: '10th',
    assignedSection: 'A'
  });

  const activeSchoolId = getActiveSchoolId();

  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setFormData({
      name: '',
      mobile: '',
      password: '123456',
      assignedClass: settings.schoolClasses?.[0] || '10th',
      assignedSection: 'A'
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (t) => {
    setEditingTeacher(t);
    setFormData({
      name: t.name,
      mobile: t.mobile || '',
      password: t.password || '123456',
      assignedClass: t.assignedClass || '10th',
      assignedSection: t.assignedSection || 'A'
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
        const uid = editingTeacher.authUid || editingTeacher.id;
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

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-extrabold text-text tracking-tight">
            Faculty & Teacher Management
          </h2>
          <p className="text-xs lg:text-sm text-text-secondary">
            Manage faculty profiles, name-based auth emails, and teacher portal credentials
          </p>
        </div>

        <div className="flex items-center gap-2">
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
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add New Teacher</span>
          </button>
        </div>
      </div>

      {/* Teachers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teachers.length === 0 ? (
          <div className="col-span-full py-16 text-center text-text-muted text-xs bg-white border border-border rounded-2xl">
            No teachers added yet. Click 'Add New Teacher' to allocate faculty responsibilities.
          </div>
        ) : (
          teachers.map((teacher, idx) => {
            const teacherKey = teacher.authUid || teacher.id || `tch_${idx}`;
            const displayEmail = teacher.authEmail || teacher.email || `${(teacher.name || 'teacher').toLowerCase().replace(/[^a-z0-9]/g, '')}.${(teacher.teacherId || `T${idx+1}`).toLowerCase()}@${schoolPart}.teachers`;

            return (
              <div
                key={teacherKey}
                className="bg-card border border-border rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-primary text-white flex items-center justify-center font-bold text-base shadow-xs">
                        {teacher.name?.charAt(0) || 'T'}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-text">{teacher.name}</h4>
                        <div className="text-[10px] text-text-secondary font-mono font-bold text-primary">
                          {teacher.teacherId || `T${String(idx + 1).padStart(3, '0')}`}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(teacher)}
                        className="p-1.5 rounded-lg bg-surface2 hover:bg-border text-text-muted hover:text-text cursor-pointer"
                        title="Edit Teacher"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteTeacher(teacher.authUid || teacher.id)}
                        className="p-1.5 rounded-lg bg-surface2 hover:bg-rose-100 text-text-muted hover:text-rose-600 cursor-pointer"
                        title="Delete Teacher"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 py-2.5 border-y border-border/60 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary font-medium">Assigned Class:</span>
                      <span className="font-bold text-primary px-2 py-0.5 rounded-md bg-primary/10 text-[11px]">
                        Class {teacher.assignedClass} — Sec {teacher.assignedSection || 'A'}
                      </span>
                    </div>

                    {/* Auth Login Email */}
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-text-secondary font-medium shrink-0">Auth Email:</span>
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="font-mono text-[11px] text-indigo-950 font-bold truncate max-w-[170px]" title={displayEmail}>
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
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-text-secondary font-medium">Base Salary:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-emerald-600 font-mono text-[11px] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          ₹{(teacher.salary || 25000).toLocaleString()} / mo
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedTeacherForHistory(teacher)}
                          className="px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold border border-indigo-200 cursor-pointer transition-colors"
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
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle className="w-3 h-3" />
                    <span>Active Faculty</span>
                  </span>
                  <span className="text-[10px] text-text-muted font-medium">Class Teacher</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-border bg-surface2 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-text">
                  {editingTeacher ? 'Edit Teacher Details' : 'Add New Teacher'}
                </h3>
                <p className="text-[11px] text-text-secondary">
                  Creates dedicated Auth credentials & database mapping
                </p>
              </div>
              <button onClick={() => setIsAddOpen(false)} className="p-1 text-text-muted hover:text-text cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              {/* Teacher Name */}
              <div>
                <label className="block font-bold text-text mb-1">
                  Teacher Name <span className="text-rose-500">*</span>
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

              {/* Dynamic Generated Email Preview */}
              <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-indigo-950 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-indigo-600" />
                    <span>Auto Generated Auth Email:</span>
                  </span>
                  <span className="text-[10px] text-indigo-600 font-mono font-bold">
                    {editingTeacher?.teacherId || nextTeacherId}
                  </span>
                </div>
                <div className="font-mono text-[11px] text-indigo-900 font-bold break-all bg-white px-2 py-1 rounded-lg border border-indigo-200/60">
                  {previewEmail}
                </div>
                <p className="text-[10px] text-slate-500">
                  This name-based email will be saved in Firebase Auth & Users table so you can identify the teacher easily.
                </p>
              </div>

              {/* Phone Number (Optional) */}
              <div>
                <label className="block font-bold text-text mb-1 flex items-center justify-between">
                  <span>Phone Number</span>
                  <span className="text-[10px] text-text-muted font-normal">(Optional)</span>
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface2 border border-border text-xs text-text font-mono focus:outline-none focus:border-primary"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block font-bold text-text mb-1 flex items-center justify-between">
                  <span>Login Password <span className="text-rose-500">*</span></span>
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

              {/* Assigned Class & Section */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-text mb-1">
                    Assign Class <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.assignedClass}
                    onChange={(e) => setFormData({ ...formData, assignedClass: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-surface2 border border-border text-xs text-text font-bold focus:outline-none focus:border-primary cursor-pointer"
                  >
                    {settings.schoolClasses?.map(c => <option key={c} value={c}>Class {c}</option>)}
                    {settings.computerCourses?.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-text mb-1">Section</label>
                  <select
                    value={formData.assignedSection}
                    onChange={(e) => setFormData({ ...formData, assignedSection: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-surface2 border border-border text-xs text-text font-bold focus:outline-none focus:border-primary cursor-pointer"
                  >
                    {['A', 'B', 'C', 'D', 'E'].map(s => <option key={s} value={s}>Section {s}</option>)}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl bg-surface2 text-text font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold cursor-pointer shadow-md transition-all"
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
                  Salary & Payroll Register ?" {selectedTeacherForHistory.name}
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
                  { month: 'September 2026', amount: selectedTeacherForHistory.salary || 25000, date: '04/09/2026', ref: 'PAY-2026-09-082', status: 'PAID' },
                  { month: 'August 2026', amount: selectedTeacherForHistory.salary || 25000, date: '05/08/2026', ref: 'PAY-2026-08-071', status: 'PAID' },
                  { month: 'July 2026', amount: selectedTeacherForHistory.salary || 25000, date: '06/07/2026', ref: 'PAY-2026-07-063', status: 'PAID' },
                ].map((item, idx) => (
                  <div key={idx} className="p-3 bg-surface2/60 rounded-xl border border-border flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-text">{item.month}</div>
                      <div className="text-[10px] text-text-secondary">Ref: {item.ref} | Date: {item.date}</div>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <div className="font-extrabold text-emerald-600 font-mono">₹{item.amount.toLocaleString()}</div>
                        <span className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                          {item.status}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          showToast(`Downloading Payslip for ${selectedTeacherForHistory.name} (${item.month})`, 'success');
                          window.print();
                        }}
                        className="px-2.5 py-1 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold text-[10px] cursor-pointer"
                      >
                        Payslip
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-3 border-t border-border bg-surface2/50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedTeacherForHistory(null)}
                className="px-4 py-2 rounded-xl bg-surface2 border border-border text-xs font-bold text-text cursor-pointer hover:bg-surface2/80"
              >
                Close Register
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
