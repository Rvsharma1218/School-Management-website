'use client';

import React, { useState } from 'react';
import { useSchoolStore } from '../lib/store';
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
  Key
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
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    password: 'teacher123',
    assignedClass: '10th',
    assignedSection: 'A'
  });

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
        showToast(`Teacher "${formData.name}" added successfully!`, "success");
      }
      setIsAddOpen(false);
    } catch (err) {
      showToast(`Error saving teacher: ${err.message || err}`, "error");
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-extrabold text-text tracking-tight">
            Faculty & Teacher Management
          </h2>
          <p className="text-xs lg:text-sm text-text-secondary">
            Manage faculty profiles, assigned classes, and teacher portal credentials
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add New Teacher</span>
        </button>
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
                        <div className="text-[10px] text-text-secondary font-mono">{teacher.teacherId}</div>
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

                  <div className="space-y-2 py-2 border-y border-border/60 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary font-medium">Assigned Class:</span>
                      <span className="font-bold text-primary px-2 py-0.5 rounded-md bg-primary/10 text-[11px]">
                        Class {teacher.assignedClass} — Sec {teacher.assignedSection || 'A'}
                      </span>
                    </div>

                    {teacher.mobile && (
                      <div className="flex items-center justify-between">
                        <span className="text-text-secondary font-medium">Mobile:</span>
                        <span className="font-mono text-text font-semibold">{teacher.mobile}</span>
                      </div>
                    )}

                    {teacher.password && (
                      <div className="flex items-center justify-between">
                        <span className="text-text-secondary font-medium">Login Password:</span>
                        <span className="font-mono text-text font-semibold">••••••</span>
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
              <h3 className="font-bold text-sm text-text">
                {editingTeacher ? 'Edit Teacher Details' : 'Add New Teacher'}
              </h3>
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
                  placeholder="e.g. Vikram Malhotra"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface2 border border-border text-xs text-text font-bold focus:outline-none focus:border-primary"
                />
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
                  <span>Password <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] text-text-muted font-normal">For Teacher Login</span>
                </label>
                <div className="relative">
                  <Key className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
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
    </div>
  );
}
