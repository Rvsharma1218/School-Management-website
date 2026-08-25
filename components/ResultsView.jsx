'use client';

import React, { useState, useEffect } from 'react';
import { useSchoolStore } from '../lib/store';
import {
  Award, Plus, Search, Printer, Trash2, Edit,
  GraduationCap, Calendar, Percent, CheckCircle2,
  FileSpreadsheet, X, Save, Share2, ClipboardList, TrendingUp, Sparkles, ChevronRight, BarChart, Download, FileText
} from 'lucide-react';
import { exportExamResultsToExcel, exportExamResultsPDF, exportSingleResultPDF } from '../lib/exportUtils';

export default function ResultsView() {
  const {
    students,
    results,
    settings,
    currentUser,
    saveResult,
    deleteResult,
    setPrintResultData,
    showToast
  } = useSchoolStore();

  const isPrincipal = currentUser?.role === 'principal';
  const assignedClass = currentUser?.assignedClass || '10th';

  const [activeTab, setActiveTab] = useState('saved'); // 'saved' | 'entry'
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResult, setEditingResult] = useState(null);

  // New/Edit Result Form State (for single modal entry)
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [examName, setExamName] = useState('Term Examination');
  const [subjects, setSubjects] = useState([
    { subjectName: 'Mathematics', marks: '', totalMarks: 100 },
    { subjectName: 'Science', marks: '', totalMarks: 100 },
    { subjectName: 'English', marks: '', totalMarks: 100 }
  ]);

  // Bulk Mark Entry Form State
  const [bulkClass, setBulkClass] = useState(isPrincipal ? (settings.schoolClasses?.[0] || '10th') : assignedClass);
  const [bulkExam, setBulkExam] = useState('Term Examination');
  
  // Multi-subject list for Bulk Mark Entry Desk
  const [bulkSubjects, setBulkSubjects] = useState([
    { id: 'sub_1', name: 'Mathematics', totalMarks: 100 },
    { id: 'sub_2', name: 'Science', totalMarks: 100 },
    { id: 'sub_3', name: 'English', totalMarks: 100 }
  ]);
  const [activeBulkSubjectId, setActiveBulkSubjectId] = useState('sub_1');
  
  // markEntries: { [subjectId]: { [studentId]: { theory: '', practical: '', internal: '' } } }
  const [markEntries, setMarkEntries] = useState({});

  // Reset to teacher assigned class on mount
  useEffect(() => {
    if (!isPrincipal && assignedClass) {
      setBulkClass(assignedClass);
    }
  }, [assignedClass, isPrincipal]);

  // Set initial selected student in modal
  useEffect(() => {
    if (students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(students[0].id);
    }
  }, [students, selectedStudentId]);

  // Handle single modal entry
  const handleOpenAdd = () => {
    setEditingResult(null);
    setSelectedStudentId(students[0]?.id || '');
    setExamName('Term Examination');
    setSubjects([
      { subjectName: 'Mathematics', marks: '', totalMarks: 100 },
      { subjectName: 'Science', marks: '', totalMarks: 100 },
      { subjectName: 'English', marks: '', totalMarks: 100 }
    ]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (res) => {
    setEditingResult(res);
    setSelectedStudentId(res.studentId);
    setExamName(res.examName);
    setSubjects([...res.subjects]);
    setIsModalOpen(true);
  };

  const handleAddSubjectRow = () => {
    setSubjects(prev => [...prev, { subjectName: '', marks: '', totalMarks: 100 }]);
  };

  const handleRemoveSubjectRow = (idx) => {
    setSubjects(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubjectChange = (idx, field, val) => {
    setSubjects(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedStudentId) return;

    const payload = {
      id: editingResult?.id,
      studentId: selectedStudentId,
      examName,
      subjects: subjects.map(s => ({
        subjectName: s.subjectName || 'Subject',
        marks: Number(s.marks) || 0,
        totalMarks: Number(s.totalMarks) || 100
      }))
    };

    saveResult(payload);
    setIsModalOpen(false);
  };

  // Filter saved results
  const filteredResults = results.filter(r => {
    const student = students.find(s => s.id === r.studentId);
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.examName?.toLowerCase().includes(q) ||
      student?.name?.toLowerCase().includes(q) ||
      student?.studentId?.toLowerCase().includes(q)
    );
  });

  // Filter students for bulk mark entry based on selected class
  const classStudents = students.filter(s => {
    if (s.studentType === 'school') return s.className === bulkClass;
    return s.course === bulkClass;
  });

  // Dynamic pass rate and grade distribution across all real exam results
  let totalResultScores = 0;
  let passedCount = 0;
  const gradeCounts = { 'A+': 0, 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0 };

  results.forEach(res => {
    if (res.subjects && res.subjects.length > 0) {
      const totalMarksObt = res.subjects.reduce((a, s) => a + (Number(s.marks) || 0), 0);
      const totalMax = res.subjects.reduce((a, s) => a + (Number(s.totalMarks) || 100), 0);
      const pct = totalMax > 0 ? Math.round((totalMarksObt / totalMax) * 100) : 0;
      totalResultScores++;
      if (pct >= 40) passedCount++;

      if (pct >= 90) gradeCounts['A+']++;
      else if (pct >= 75) gradeCounts['A']++;
      else if (pct >= 60) gradeCounts['B']++;
      else if (pct >= 45) gradeCounts['C']++;
      else if (pct >= 33) gradeCounts['D']++;
      else gradeCounts['F']++;
    }
  });

  const overallPassRate = totalResultScores > 0 ? Math.round((passedCount / totalResultScores) * 100) : 0;

  // Initialize bulk mark entries when class/exam/subjects change
  useEffect(() => {
    const initial = {};
    bulkSubjects.forEach(bs => {
      initial[bs.id] = {};
      classStudents.forEach(s => {
        const existing = results.find(r => r.studentId === s.id && r.examName === bulkExam);
        const subMark = existing?.subjects?.find(sub => sub.subjectName === bs.name);
        if (subMark) {
          const total = subMark.marks;
          const theory = Math.round(total * 0.8);
          const practical = Math.round(total * 0.15);
          const internal = total - theory - practical;
          initial[bs.id][s.id] = { theory, practical, internal };
        } else {
          initial[bs.id][s.id] = { theory: '', practical: '', internal: '' };
        }
      });
    });
    setMarkEntries(initial);
  }, [bulkClass, bulkExam, bulkSubjects.map(s => s.name).join(','), results]);

  const handleBulkMarkChange = (subjectId, studentId, field, val) => {
    setMarkEntries(prev => ({
      ...prev,
      [subjectId]: {
        ...(prev[subjectId] || {}),
        [studentId]: {
          ...(prev[subjectId]?.[studentId] || { theory: '', practical: '', internal: '' }),
          [field]: val === '' ? '' : Math.max(0, Number(val))
        }
      }
    }));
  };

  const handleAddBulkSubject = () => {
    const newId = `sub_${Date.now()}`;
    const newSub = { id: newId, name: `Subject ${bulkSubjects.length + 1}`, totalMarks: 100 };
    setBulkSubjects(prev => [...prev, newSub]);
    setActiveBulkSubjectId(newId);
  };

  const handleRemoveBulkSubject = (subId) => {
    if (bulkSubjects.length <= 1) {
      showToast("At least one subject is required in mark desk.", "info");
      return;
    }
    setBulkSubjects(prev => prev.filter(s => s.id !== subId));
    if (activeBulkSubjectId === subId) {
      const remaining = bulkSubjects.filter(s => s.id !== subId);
      setActiveBulkSubjectId(remaining[0]?.id || '');
    }
  };

  const handleUpdateBulkSubject = (subId, field, val) => {
    setBulkSubjects(prev => prev.map(s => s.id === subId ? { ...s, [field]: val } : s));
  };

  const handleSaveBulk = (isPublish = false) => {
    classStudents.forEach(s => {
      const existing = results.find(r => r.studentId === s.id && r.examName === bulkExam);
      let updatedSubjects = existing ? [...existing.subjects] : [];

      bulkSubjects.forEach(bs => {
        const entry = markEntries[bs.id]?.[s.id];
        if (!entry) return;

        const theory = Number(entry.theory) || 0;
        const practical = Number(entry.practical) || 0;
        const internal = Number(entry.internal) || 0;
        const total = theory + practical + internal;
        const maxMarks = Number(bs.totalMarks) || 100;

        if (theory === 0 && practical === 0 && internal === 0 && entry.theory === '' && entry.practical === '' && entry.internal === '') {
          return;
        }

        const subIndex = updatedSubjects.findIndex(sub => sub.subjectName === bs.name);
        if (subIndex >= 0) {
          updatedSubjects[subIndex] = { subjectName: bs.name, marks: total, totalMarks: maxMarks };
        } else {
          updatedSubjects.push({ subjectName: bs.name, marks: total, totalMarks: maxMarks });
        }
      });

      if (updatedSubjects.length > 0) {
        saveResult({
          id: existing?.id,
          studentId: s.id,
          examName: bulkExam,
          subjects: updatedSubjects
        });
      }
    });

    showToast(isPublish ? "Marks published successfully for all subjects!" : "Marks saved successfully!", "success");
  };

  const activeSubject = bulkSubjects.find(s => s.id === activeBulkSubjectId) || bulkSubjects[0];

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Top Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-1 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab('saved')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'saved'
              ? 'bg-primary text-white shadow-xs'
              : 'text-text-secondary hover:text-text hover:bg-surface2'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Result Management</span>
        </button>

        <button
          onClick={() => setActiveTab('entry')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'entry'
              ? 'bg-primary text-white shadow-xs'
              : 'text-text-secondary hover:text-text hover:bg-surface2'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5" />
          <span>Mark Entry Desk</span>
        </button>
      </div>

      {activeTab === 'saved' ? (
        /* ─── SAVED MARKSHEETS LIST TABLE VIEW ─── */
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl lg:text-2xl font-bold text-text tracking-tight">Result Management</h2>
              <p className="text-xs text-text-secondary mt-0.5">Examination & Marksheet Register ({results.length} Records)</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
              <button
                onClick={() => exportExamResultsPDF(results, students, settings)}
                className="px-3.5 py-2 rounded-xl bg-surface2 hover:bg-primary/10 text-primary border border-border flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                title="Download consolidated results report PDF"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export PDF</span>
              </button>

              <button
                onClick={() => exportExamResultsToExcel(results, students, settings.instituteName)}
                className="px-3.5 py-2 rounded-xl bg-surface2 hover:bg-emerald-50 text-emerald-700 border border-border flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                title="Export results spreadsheet to Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export Excel</span>
              </button>

              <button
                onClick={handleOpenAdd}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Single Entry</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="bg-white border border-border rounded-2xl p-4 shadow-xs">
              <span className="text-text-secondary font-bold uppercase text-[10px] tracking-wider">Overall Pass Rate</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">{overallPassRate}%</p>
              <p className="text-[10px] text-text-muted mt-0.5">{passedCount} of {totalResultScores} scored passed</p>
            </div>

            <div className="bg-white border border-border rounded-2xl p-4 shadow-xs">
              <span className="text-text-secondary font-bold uppercase text-[10px] tracking-wider">Total Exam Records</span>
              <p className="text-2xl font-black text-primary mt-1">{results.length}</p>
              <p className="text-[10px] text-text-muted mt-0.5">Published marksheets</p>
            </div>

            <div className="bg-white border border-border rounded-2xl p-4 shadow-xs col-span-2">
              <span className="text-text-secondary font-bold uppercase text-[10px] tracking-wider">Grade Distribution</span>
              <div className="flex items-center gap-3 mt-2">
                {Object.entries(gradeCounts).map(([g, cnt]) => (
                  <div key={g} className="flex-1 text-center">
                    <span className="text-xs font-black text-text">{cnt}</span>
                    <div className="text-[9px] font-bold text-text-muted">{g}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="bg-white border border-border rounded-2xl p-4 shadow-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search result records by exam, student name, or ID..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface2 border border-border text-xs text-text focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Results Table */}
          <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface2/60 border-b border-border text-text-secondary font-bold text-[10px] uppercase">
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Exam Name</th>
                    <th className="py-3 px-4 text-center">Subjects</th>
                    <th className="py-3 px-4 text-right">Total Marks</th>
                    <th className="py-3 px-4 text-center">Percentage</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-text font-medium">
                  {filteredResults.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-text-muted text-xs">
                        No result records found. Use 'Mark Entry Desk' or 'Single Entry' to enter marks.
                      </td>
                    </tr>
                  ) : (
                    filteredResults.map(r => {
                      const student = students.find(s => s.id === r.studentId);
                      const totalMarksObt = r.subjects?.reduce((a, s) => a + (Number(s.marks) || 0), 0) || 0;
                      const totalMax = r.subjects?.reduce((a, s) => a + (Number(s.totalMarks) || 100), 0) || 1;
                      const pct = Math.round((totalMarksObt / totalMax) * 100);

                      return (
                        <tr key={r.id} className="hover:bg-surface2/30 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-text">
                            <div>
                              <div>{student?.name || 'Unknown Student'}</div>
                              <div className="text-[9px] text-text-muted">ID: {student?.studentId || '-'} · Class: {student?.className || student?.course || '-'}</div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">{r.examName}</td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                              {r.subjects?.length || 0} Subjects
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-black text-text">
                            {totalMarksObt} / {totalMax}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              pct >= 40 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                            }`}>
                              {pct}%
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  exportSingleResultPDF(r, student, settings);
                                  showToast(`Downloaded marksheet PDF for ${student?.name || 'student'}!`, 'success');
                                }}
                                className="p-1.5 rounded-lg bg-surface2 hover:bg-emerald-100 text-emerald-600 border border-border cursor-pointer transition-colors"
                                title="Download Marksheet PDF"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setPrintResultData({ result: r, student })}
                                className="p-1.5 rounded-lg bg-surface2 hover:bg-primary/10 text-primary border border-border cursor-pointer transition-colors"
                                title="Print Marksheet"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenEdit(r)}
                                className="p-1.5 rounded-lg bg-surface2 hover:bg-primary/10 text-text border border-border cursor-pointer transition-colors"
                                title="Edit Result"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => deleteResult(r.id)}
                                className="p-1.5 rounded-lg bg-surface2 hover:bg-rose-100 text-rose-600 border border-border cursor-pointer transition-colors"
                                title="Delete Result"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ─── BULK MARK ENTRY DESK (MULTI-SUBJECT) ─── */
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white border border-border rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <h3 className="font-bold text-base text-text">Bulk Mark Entry Desk</h3>
                <p className="text-xs text-text-secondary mt-0.5">Enter theory, practical, and internal marks for multiple subjects.</p>
              </div>
              <button
                onClick={() => handleSaveBulk(true)}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-md cursor-pointer transition-all active:scale-95"
              >
                Save & Publish Marks
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
              <div>
                <label className="block text-text-secondary mb-1">Class / Course</label>
                <select
                  value={bulkClass}
                  onChange={e => setBulkClass(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface2 border border-border text-text font-bold"
                >
                  {settings.schoolClasses?.map(c => <option key={c} value={c}>Class {c}</option>)}
                  {settings.computerCourses?.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-text-secondary mb-1">Examination</label>
                <input
                  type="text"
                  value={bulkExam}
                  onChange={e => setBulkExam(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface2 border border-border text-text font-bold"
                  placeholder="e.g. Mid-Term Examination 2026"
                />
              </div>
            </div>

            {/* Subject Tabs / Selector with Add Subject */}
            <div className="pt-3 border-t border-border space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-text-secondary">Subjects in Desk ({bulkSubjects.length})</label>
                <button
                  type="button"
                  onClick={handleAddBulkSubject}
                  className="px-3 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Subject</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {bulkSubjects.map(sub => (
                  <div
                    key={sub.id}
                    onClick={() => setActiveBulkSubjectId(sub.id)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                      activeBulkSubjectId === sub.id
                        ? 'bg-primary text-white border-primary shadow-xs'
                        : 'bg-surface2 text-text border-border hover:border-primary/50'
                    }`}
                  >
                    <span>{sub.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                      activeBulkSubjectId === sub.id ? 'bg-white/20 text-white' : 'bg-border text-text-secondary'
                    }`}>
                      Max: {sub.totalMarks || 100}
                    </span>
                    {bulkSubjects.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveBulkSubject(sub.id);
                        }}
                        className={`p-0.5 rounded hover:bg-rose-500 hover:text-white transition-colors ${
                          activeBulkSubjectId === sub.id ? 'text-white/80' : 'text-text-muted'
                        }`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Active Subject Configuration (Editable Subject Name & Max Marks) */}
              {activeSubject && (
                <div className="p-3 bg-surface2/60 border border-border rounded-xl flex flex-wrap items-center gap-3 text-xs">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] font-bold text-text-secondary mb-1">Active Subject Name</label>
                    <input
                      type="text"
                      value={activeSubject.name}
                      onChange={e => handleUpdateBulkSubject(activeSubject.id, 'name', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-border font-bold text-text"
                      placeholder="e.g. Mathematics"
                    />
                  </div>
                  <div className="w-32">
                    <label className="block text-[10px] font-bold text-text-secondary mb-1">Total Max Marks</label>
                    <input
                      type="number"
                      min="1"
                      value={activeSubject.totalMarks || 100}
                      onChange={e => handleUpdateBulkSubject(activeSubject.id, 'totalMarks', Number(e.target.value) || 100)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-border font-bold text-text text-center font-mono"
                      placeholder="100"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bulk entry table for active subject */}
          <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-3.5 bg-surface2/80 border-b border-border flex items-center justify-between text-xs font-bold">
              <span>Entering marks for: <strong className="text-primary">{activeSubject?.name || 'Subject'}</strong> (Max: {activeSubject?.totalMarks || 100})</span>
              <span className="text-text-secondary">{classStudents.length} Students in Class {bulkClass}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface2/60 border-b border-border text-text-secondary font-bold text-[10px] uppercase">
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4 text-center">Theory</th>
                    <th className="py-3 px-4 text-center">Practical</th>
                    <th className="py-3 px-4 text-center">Internal</th>
                    <th className="py-3 px-4 text-right">Total / Max</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-text font-medium">
                  {classStudents.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-text-muted text-xs">
                        No students enrolled in Class {bulkClass}.
                      </td>
                    </tr>
                  ) : (
                    classStudents.map(s => {
                      const entry = markEntries[activeSubject?.id]?.[s.id] || { theory: '', practical: '', internal: '' };
                      const total = (Number(entry.theory) || 0) + (Number(entry.practical) || 0) + (Number(entry.internal) || 0);
                      const max = activeSubject?.totalMarks || 100;

                      return (
                        <tr key={s.id} className="hover:bg-surface2/30 transition-colors">
                          <td className="py-3 px-4 font-bold">
                            <div>{s.name}</div>
                            <div className="text-[9px] text-text-muted">Roll: {s.rollNumber || '-'} · ID: {s.studentId}</div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <input
                              type="number"
                              min="0"
                              value={entry.theory}
                              onChange={e => handleBulkMarkChange(activeSubject?.id, s.id, 'theory', e.target.value)}
                              placeholder="0"
                              className="w-16 px-2 py-1 rounded-lg bg-surface2 border border-border text-center font-mono font-bold focus:outline-none focus:border-primary"
                            />
                          </td>
                          <td className="py-3 px-4 text-center">
                            <input
                              type="number"
                              min="0"
                              value={entry.practical}
                              onChange={e => handleBulkMarkChange(activeSubject?.id, s.id, 'practical', e.target.value)}
                              placeholder="0"
                              className="w-16 px-2 py-1 rounded-lg bg-surface2 border border-border text-center font-mono font-bold focus:outline-none focus:border-primary"
                            />
                          </td>
                          <td className="py-3 px-4 text-center">
                            <input
                              type="number"
                              min="0"
                              value={entry.internal}
                              onChange={e => handleBulkMarkChange(activeSubject?.id, s.id, 'internal', e.target.value)}
                              placeholder="0"
                              className="w-16 px-2 py-1 rounded-lg bg-surface2 border border-border text-center font-mono font-bold focus:outline-none focus:border-primary"
                            />
                          </td>
                          <td className="py-3 px-4 text-right font-black text-primary font-mono text-sm">
                            {total} / {max}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Single Entry Modal (with editable Total Marks and Add Subject) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-base text-text">
                {editingResult ? 'Edit Exam Result' : 'Enter Student Exam Result'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg hover:bg-surface2 cursor-pointer">
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-text-secondary mb-1">Student</label>
                <select
                  value={selectedStudentId}
                  onChange={e => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface2 border border-border text-text font-bold"
                  required
                >
                  <option value="">-- Select Student --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.studentType === 'school' ? `Class ${s.className}` : s.course}) - {s.studentId}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-text-secondary mb-1">Exam Name</label>
                <input
                  type="text"
                  value={examName}
                  onChange={e => setExamName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface2 border border-border text-text font-bold"
                  placeholder="e.g. Mid-Term Examination"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-text-secondary">Subjects & Total Marks</label>
                  <button
                    type="button"
                    onClick={handleAddSubjectRow}
                    className="text-[11px] text-primary font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Subject</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                  {subjects.map((sub, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-surface2/40 p-2 rounded-xl border border-border">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={sub.subjectName}
                          onChange={e => handleSubjectChange(idx, 'subjectName', e.target.value)}
                          placeholder="Subject Name"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-border text-text font-bold"
                          required
                        />
                      </div>
                      <div className="w-20">
                        <input
                          type="number"
                          min="0"
                          value={sub.marks}
                          onChange={e => handleSubjectChange(idx, 'marks', e.target.value)}
                          placeholder="Marks"
                          className="w-full px-2 py-1.5 rounded-lg bg-white border border-border text-center font-mono font-bold text-text"
                          required
                        />
                      </div>
                      <span className="text-text-muted font-bold">/</span>
                      <div className="w-20">
                        <input
                          type="number"
                          min="1"
                          value={sub.totalMarks || 100}
                          onChange={e => handleSubjectChange(idx, 'totalMarks', Number(e.target.value) || 100)}
                          placeholder="Total"
                          className="w-full px-2 py-1.5 rounded-lg bg-white border border-border text-center font-mono font-bold text-text"
                          title="Manually Editable Total Marks"
                          required
                        />
                      </div>
                      {subjects.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSubjectRow(idx)}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-surface2 hover:bg-border text-text font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold cursor-pointer shadow-sm transition-all active:scale-95"
                >
                  Save Result
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
