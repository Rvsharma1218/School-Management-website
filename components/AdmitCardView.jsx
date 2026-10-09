'use client';

import React, { useState, useMemo } from 'react';
import { useSchoolStore } from '../lib/store';
import {
  Printer, Download, Plus, Trash2, Calendar,
  GraduationCap, FileText, CheckCircle2, User, Search
} from 'lucide-react';

export default function AdmitCardView() {
  const { students, settings, showToast } = useSchoolStore();

  const [selectedClass, setSelectedClass] = useState('10th');
  const [examTitle, setExamTitle] = useState('Half Yearly Examination 2026-27');
  const [searchQuery, setSearchQuery] = useState('');

  // Editable Timetable
  const [timetable, setTimetable] = useState([
    { subject: 'Hindi', date: '2026-10-15', time: '09:00 AM - 12:00 PM' },
    { subject: 'English', date: '2026-10-17', time: '09:00 AM - 12:00 PM' },
    { subject: 'Mathematics', date: '2026-10-19', time: '09:00 AM - 12:00 PM' },
    { subject: 'Science', date: '2026-10-22', time: '09:00 AM - 12:00 PM' },
    { subject: 'Social Science', date: '2026-10-24', time: '09:00 AM - 12:00 PM' },
  ]);

  const [newSubject, setNewSubject] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('09:00 AM - 12:00 PM');
  const [isAddingSubject, setIsAddingSubject] = useState(false);

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchClass = selectedClass === 'all' || s.className === selectedClass;
      const matchSearch = !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || (s.rollNumber && s.rollNumber.includes(searchQuery));
      return matchClass && matchSearch;
    });
  }, [students, selectedClass, searchQuery]);

  const handleAddSubject = (e) => {
    e.preventDefault();
    if (!newSubject.trim() || !newDate) {
      showToast('Please enter subject and date', 'error');
      return;
    }
    setTimetable([...timetable, { subject: newSubject.trim(), date: newDate, time: newTime.trim() }]);
    setNewSubject('');
    setNewDate('');
    setIsAddingSubject(false);
    showToast('Subject added to timetable', 'success');
  };

  const handleRemoveSubject = (index) => {
    setTimetable(timetable.filter((_, i) => i !== index));
  };

  const handlePrint = () => {
    window.print();
  };

  const schoolClasses = settings.schoolClasses && settings.schoolClasses.length > 0
    ? settings.schoolClasses
    : ['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Controls (Hidden on Print) */}
      <div className="print:hidden flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-border shadow-xs">
        <div>
          <h1 className="text-xl font-black text-text flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Admit Card & Hall Ticket Studio
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Generate, customize timetable, and batch print student admit cards.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            disabled={filteredStudents.length === 0}
            className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>Print {filteredStudents.length} Admit Cards</span>
          </button>
        </div>
      </div>

      {/* Settings Grid (Hidden on Print) */}
      <div className="print:hidden grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Exam & Class Config */}
        <div className="bg-white p-5 rounded-2xl border border-border space-y-4">
          <h2 className="text-sm font-bold text-text flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-primary" />
            1. Select Class & Exam Name
          </h2>

          <div>
            <label className="text-[11px] font-bold text-text-secondary uppercase">Select Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="mt-1 w-full px-3 py-2 bg-surface2 rounded-xl border border-border text-xs font-semibold text-text focus:outline-primary"
            >
              <option value="all">All Classes ({students.length})</option>
              {schoolClasses.map(c => (
                <option key={c} value={c}>Class {c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-text-secondary uppercase">Exam Title</label>
            <input
              type="text"
              value={examTitle}
              onChange={(e) => setExamTitle(e.target.value)}
              className="mt-1 w-full px-3 py-2 bg-surface2 rounded-xl border border-border text-xs font-semibold text-text focus:outline-primary"
              placeholder="e.g. Half Yearly Examination 2026-27"
            />
          </div>

          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
            Found {filteredStudents.length} students in selected class.
          </div>
        </div>

        {/* 2. Timetable Management */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-border space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-text flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              2. Exam Time Table Schedule ({timetable.length} Subjects)
            </h2>
            <button
              onClick={() => setIsAddingSubject(!isAddingSubject)}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Subject</span>
            </button>
          </div>

          {/* Add Subject Inline Form */}
          {isAddingSubject && (
            <form onSubmit={handleAddSubject} className="p-3 bg-surface2 rounded-xl border border-border flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Subject Name"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white rounded-lg border border-border font-semibold flex-1 min-w-[120px]"
              />
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white rounded-lg border border-border font-semibold"
              />
              <input
                type="text"
                placeholder="Timing"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white rounded-lg border border-border font-semibold w-36"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 cursor-pointer"
              >
                Save
              </button>
            </form>
          )}

          {/* Timetable List */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-border rounded-xl">
              <thead className="bg-surface2 text-text-secondary uppercase text-[10px] font-black">
                <tr>
                  <th className="py-2 px-3">Subject</th>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Exam Timing</th>
                  <th className="py-2 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {timetable.map((item, idx) => (
                  <tr key={idx} className="hover:bg-surface2/50">
                    <td className="py-2 px-3 font-bold text-text">{item.subject}</td>
                    <td className="py-2 px-3 text-text-secondary font-semibold">{item.date}</td>
                    <td className="py-2 px-3 text-text-secondary font-semibold">{item.time}</td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={() => handleRemoveSubject(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Printable Admit Cards Grid */}
      <div className="space-y-6">
        <h2 className="print:hidden text-sm font-bold text-text">
          Previewing Admit Cards ({filteredStudents.length} Students)
        </h2>

        {filteredStudents.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-border text-text-secondary text-sm">
            No students found in this class.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-1 print:gap-10">
            {filteredStudents.map((s) => (
              <div
                key={s.id}
                className="bg-white border-2 border-indigo-950 rounded-xl p-5 shadow-sm print:shadow-none print:break-after-page text-black font-sans relative"
              >
                {/* Header */}
                <div className="flex items-center gap-3 border-b-2 border-indigo-950 pb-3">
                  {settings.logoUrl || settings.logoPath || settings.logo ? (
                    <img
                      src={settings.logoUrl || settings.logoPath || settings.logo}
                      alt="Logo"
                      className="w-14 h-14 object-contain"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-indigo-900 text-white rounded-lg flex items-center justify-center font-bold text-xl">
                      MN
                    </div>
                  )}
                  <div className="flex-1 text-center pr-10">
                    <h2 className="font-black text-base uppercase text-indigo-950 leading-tight">
                      {settings.instituteName || 'Mission Navodaya Public School'}
                    </h2>
                    <p className="text-[10px] text-gray-700 font-semibold">{settings.address || 'School Campus'}</p>
                    <p className="text-[10px] text-indigo-900 font-black">
                      Session: {settings.currentSession || '2026-27'} | Mobile: {settings.mobile || ''}
                    </p>
                  </div>
                </div>

                {/* Exam Title Badge */}
                <div className="my-3 text-center">
                  <span className="inline-block px-4 py-1 bg-indigo-100 text-indigo-950 font-black text-xs uppercase tracking-wider rounded-md border border-indigo-200">
                    {examTitle}
                  </span>
                </div>

                {/* Student Info & Photo */}
                <div className="bg-gray-50 border border-gray-300 rounded-lg p-3 flex justify-between gap-3 text-xs mb-3">
                  <div className="space-y-1 font-semibold">
                    <p><span className="font-bold text-gray-600">Student Name:</span> <strong className="text-black uppercase">{s.name}</strong></p>
                    <p><span className="font-bold text-gray-600">Father's Name:</span> {s.fatherName || '-'}</p>
                    <p><span className="font-bold text-gray-600">Class & Section:</span> <strong>{s.className} {s.section || ''}</strong></p>
                    <p><span className="font-bold text-gray-600">Roll No:</span> <strong>{s.rollNumber || s.id}</strong> | <span className="font-bold text-gray-600">Admission No:</span> {s.admissionNumber || s.id}</p>
                    <p><span className="font-bold text-gray-600">Aadhaar Card No:</span> <strong className="text-indigo-950 font-bold">{s.aadhaarNumber || s.aadharNumber || s.aadhaar || 'N/A'}</strong></p>
                  </div>
                  <div className="w-20 h-24 border border-gray-400 bg-white flex items-center justify-center text-[10px] font-bold text-gray-400 uppercase text-center overflow-hidden">
                    {s.photoUrl || s.photoPath ? (
                      <img src={s.photoUrl || s.photoPath} alt="Photo" className="w-full h-full object-cover" />
                    ) : (
                      'STUDENT PHOTO'
                    )}
                  </div>
                </div>

                {/* Timetable Table */}
                <div className="mb-3">
                  <div className="text-[10px] font-black uppercase text-indigo-950 mb-1">Examination Schedule:</div>
                  <table className="w-full text-left text-[10px] border border-gray-400 border-collapse">
                    <thead className="bg-indigo-50 font-bold border-b border-gray-400">
                      <tr>
                        <th className="p-1 border-r border-gray-400">Date</th>
                        <th className="p-1 border-r border-gray-400">Subject</th>
                        <th className="p-1 border-r border-gray-400">Timing</th>
                        <th className="p-1">Invigilator Sign</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-300">
                      {timetable.map((t, idx) => (
                        <tr key={idx}>
                          <td className="p-1 border-r border-gray-400 font-semibold">{t.date}</td>
                          <td className="p-1 border-r border-gray-400 font-bold">{t.subject}</td>
                          <td className="p-1 border-r border-gray-400">{t.time}</td>
                          <td className="p-1"></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Instructions */}
                <div className="text-[8px] text-gray-600 space-y-0.5 border-t border-gray-300 pt-2 mb-8">
                  <p className="font-bold text-black uppercase">Instructions for Candidate:</p>
                  <p>1. Admit card must be presented on each day of examination.</p>
                  <p>2. Report to examination room 15 minutes before exam start.</p>
                  <p>3. Possession of mobile phones or smart watches is strictly prohibited.</p>
                </div>

                {/* Signatures */}
                <div className="flex justify-between items-end border-t border-gray-400 pt-3 mt-4 text-[10px] font-bold">
                  <div className="text-center">
                    <div className="w-28 border-b border-gray-400 mb-1" />
                    <span>Class Teacher Sign</span>
                  </div>
                  <div className="text-center flex flex-col items-center">
                    {settings.principalSignature || settings.signatureUrl ? (
                      <img
                        src={settings.principalSignature || settings.signatureUrl}
                        alt="Signature"
                        className="h-8 object-contain mb-1"
                      />
                    ) : (
                      <div className="h-8" />
                    )}
                    <div className="w-28 border-b border-gray-400 mb-1" />
                    <span>Principal Signature</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
