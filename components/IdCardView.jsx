'use client';

import React, { useState } from 'react';
import { useSchoolStore } from '../lib/store';
import { QRCodeSVG } from 'qrcode.react';
import {
  Printer, Download, Filter, Users, Sparkles, Layers,
  CheckCircle2, Share2, Eye, Layout, FileText, Check, ChevronRight, RefreshCw, Search
} from 'lucide-react';

export default function IdCardView() {
  const { students, settings, setPrintIdCardsData, showToast } = useSchoolStore();

  // State configurations matching mockup
  const [selectedTemplate, setSelectedTemplate] = useState('modern'); // 'modern' | 'classic' | 'minimal'
  const [primaryColor, setPrimaryColor] = useState('#1f108e'); // brand colors
  const [showBackSide, setShowBackSide] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Toggles for fields to display
  const [displayFields, setDisplayFields] = useState({
    studentId: true,
    dob: true,
    bloodGroup: true,
    busRoute: false,
    emergency: true
  });

  // Selected students for batch print
  const [selectedStudentIds, setSelectedStudentIds] = useState(
    students.slice(0, 4).map(s => s.id) // default select first few
  );

  const toggleField = (field) => {
    setDisplayFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedStudentIds(students.map(s => s.id));
    } else {
      setSelectedStudentIds([]);
    }
  };

  const toggleSelectStudent = (id) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Find preview student
  const previewStudent = students.find(s => selectedStudentIds.includes(s.id)) || students[0];

  const handleExportPDF = () => {
    const list = students.filter(s => selectedStudentIds.includes(s.id));
    if (list.length === 0) {
      showToast("Please select at least one student.", "warning");
      return;
    }
    setPrintIdCardsData({ students: list, template: selectedTemplate });
  };

  const filteredStudents = students.filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return s.name?.toLowerCase().includes(q) || s.studentId?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-text tracking-tight">ID Card Generation</h2>
          <p className="text-xs text-text-secondary mt-0.5">Design, customize, and bulk print student identification cards.</p>
        </div>
        <button
          onClick={handleExportPDF}
          className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
        >
          <Printer className="w-4 h-4" />
          <span>Print Selected ({selectedStudentIds.length})</span>
        </button>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column: Design Studio */}
        <div className="lg:col-span-7 bg-white border border-border rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-border pb-4">
            <h3 className="font-bold text-base text-text flex items-center gap-2">
              <Layout className="w-5 h-5 text-primary" />
              <span>Design Studio</span>
            </h3>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">Design</span>
              <span className="text-[10px] font-bold text-text-secondary cursor-pointer hover:text-primary">Data Fields</span>
            </div>
          </div>

          {/* 1. SELECT TEMPLATE */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-text uppercase tracking-wider">Select Template</label>
            <div className="grid grid-cols-3 gap-3.5">
              {[
                { id: 'modern', label: 'Modern', desc: 'Rounded photo, gold bar' },
                { id: 'classic', label: 'Classic', desc: 'Square photo, blue bar' },
                { id: 'minimal', label: 'Minimal', desc: 'Compact clean text layout' }
              ].map(t => {
                const isActive = selectedTemplate === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t.id)}
                    className={`p-4 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                      isActive ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20' : 'border-border hover:bg-surface2/50 text-text-secondary'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${isActive ? 'bg-primary text-white' : 'bg-surface2 text-text-secondary'}`}>
                      {t.label[0]}
                    </div>
                    <div className="font-bold text-xs">{t.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. BRAND STYLING */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-text uppercase tracking-wider">Brand Styling</label>
            <div className="space-y-2">
              <span className="text-xs text-text-secondary font-medium">Primary Color</span>
              <div className="flex items-center gap-3">
                {[
                  { hex: '#1f108e', name: 'Navy' },
                  { hex: '#ba1a1a', name: 'Red' },
                  { hex: '#0051d5', name: 'Blue' },
                  { hex: '#0b1c30', name: 'Slate' }
                ].map(c => (
                  <button
                    key={c.hex}
                    onClick={() => setPrimaryColor(c.hex)}
                    style={{ backgroundColor: c.hex }}
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${
                      primaryColor === c.hex ? 'scale-110 border-white ring-2 ring-primary/45' : 'border-transparent hover:scale-105'
                    }`}
                    title={c.name}
                  />
                ))}
                <div className="w-8 h-8 rounded-full bg-surface2 border border-border flex items-center justify-center text-text-muted text-xs font-black cursor-pointer hover:bg-border">+</div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <span className="text-xs text-text-secondary font-medium">Background Artwork</span>
              <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary hover:bg-surface2/30 transition-all cursor-pointer flex flex-col items-center justify-center gap-2">
                <Download className="w-5 h-5 text-text-muted" />
                <span className="text-xs font-semibold text-text">Click or drag image to upload logo/seal</span>
                <span className="text-[10px] text-text-muted">SVG, PNG, JPG (max 2MB)</span>
              </div>
            </div>
          </div>

          {/* 3. DATA FIELDS */}
          <div className="space-y-3 border-t border-border pt-4">
            <label className="block text-xs font-bold text-text uppercase tracking-wider">Data Fields to Display</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-semibold text-text-secondary">
              {[
                { key: 'studentId', label: 'Student ID No.' },
                { key: 'dob', label: 'Date of Birth' },
                { key: 'bloodGroup', label: 'Blood Group' },
                { key: 'busRoute', label: 'Bus Route' },
                { key: 'emergency', label: 'Emergency Contact' }
              ].map(f => (
                <label key={f.key} className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={displayFields[f.key]}
                    onChange={() => toggleField(f.key)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary/30 cursor-pointer"
                  />
                  <span>{f.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Live Preview */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white border border-border rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBackSide(false)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  !showBackSide ? 'bg-primary text-white shadow-sm' : 'bg-surface2 text-text-secondary hover:text-text'
                }`}
              >
                Front Side
              </button>
              <button
                onClick={() => setShowBackSide(true)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  showBackSide ? 'bg-primary text-white shadow-sm' : 'bg-surface2 text-text-secondary hover:text-text'
                }`}
              >
                Back Side
              </button>
            </div>
            <button
              onClick={() => setShowBackSide(!showBackSide)}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Flip Card</span>
            </button>
          </div>

          {/* Live Preview Card */}
          <div className="bg-white border border-border rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center">
            {previewStudent ? (
              <div className="relative w-full max-w-[400px] h-[250px] rounded-lg shadow-xl overflow-hidden flex flex-col border border-amber-400/40 bg-gradient-to-br from-[#0A1128] to-[#1C2541] text-white select-none">
                {!showBackSide ? (
                  /* FRONT OF CARD */
                  <div className="flex-1 flex flex-col justify-between">
                    {/* Top Gold Accent Bar */}
                    <div className="bg-[#FFD700] text-[#0A1128] px-3.5 py-0.5 flex items-center justify-between text-[9px] font-black tracking-wider uppercase">
                      <span>OFFICIAL STUDENT ID</span>
                      <span>SESSION {previewStudent.session || settings.currentSession || '2026-27'}</span>
                    </div>

                    {/* Institute Header */}
                    <div className="bg-[#0A1128] px-3 py-1.5 text-center border-b border-[#FFD700]/40">
                      <h3 className="font-extrabold text-xs tracking-wide uppercase text-white leading-tight">
                        {settings.instituteName || "MISSION NAVODAYA PUBLIC SCHOOL"}
                      </h3>
                      <p className="text-[8px] text-[#FFD700] tracking-wide truncate mt-0.5 font-medium">
                        {settings.address || "Mora Mairi, Bhagwaanpur, Siwan, Bihar 841507"}
                      </p>
                    </div>

                    {/* Body Content */}
                    <div className="flex-1 p-3 flex items-center gap-3">
                      {/* Photo */}
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className="w-[74px] h-[86px] rounded border-2 border-[#FFD700] overflow-hidden bg-[#0A1128] flex items-center justify-center shadow-md">
                          {previewStudent.photoPath ? (
                            <img src={previewStudent.photoPath} alt={previewStudent.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl font-black text-white">{previewStudent.name?.charAt(0) || 'S'}</span>
                          )}
                        </div>
                        <div className="mt-1 bg-[#FFD700] text-[#0A1128] text-[7.5px] font-black uppercase px-1.5 py-0.5 rounded shadow-2xs">
                          STUDENT
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0 space-y-0.5 text-[9.5px]">
                        <h4 className="font-black text-xs uppercase text-white tracking-wide truncate mb-1">
                          {previewStudent.name}
                        </h4>
                        <div className="flex"><span className="w-14 font-bold text-amber-300">ID NO:</span><span className="font-semibold">{previewStudent.studentId}</span></div>
                        <div className="flex"><span className="w-14 font-bold text-amber-300">ADM NO:</span><span className="font-semibold">{previewStudent.admissionNumber || previewStudent.studentId}</span></div>
                        <div className="flex">
                          <span className="w-14 font-bold text-amber-300">{previewStudent.studentType === 'school' ? 'CLASS:' : 'COURSE:'}</span>
                          <span className="font-semibold">{previewStudent.studentType === 'school' ? `Class ${previewStudent.className || ''} - ${previewStudent.section || 'A'}` : previewStudent.course}</span>
                        </div>
                        <div className="flex"><span className="w-14 font-bold text-amber-300">FATHER:</span><span className="font-semibold truncate">{previewStudent.fatherName || '—'}</span></div>
                        <div className="flex"><span className="w-14 font-bold text-amber-300">MOBILE:</span><span className="font-semibold">{previewStudent.mobile}</span></div>
                      </div>

                      {/* QR Code */}
                      <div className="flex flex-col items-center flex-shrink-0 bg-white/5 p-1 rounded-lg border border-white/10">
                        <div className="p-0.5 bg-white rounded">
                          <QRCodeSVG
                            value={`ID:${previewStudent.studentId}|Name:${previewStudent.name}|Mobile:${previewStudent.mobile}`}
                            size={50}
                            level="M"
                          />
                        </div>
                        <span className="text-[6px] text-slate-400 mt-1 uppercase font-bold tracking-widest">
                          SCAN TO VERIFY
                        </span>
                      </div>
                    </div>

                    {/* Bottom Footer Bar */}
                    <div className="bg-[#05091E] px-3.5 py-1 flex items-center justify-between text-[7.5px] border-t border-[#FFD700]/20">
                      <span className="text-slate-400 font-semibold uppercase truncate max-w-[240px]">
                        PROPERTY OF {settings.instituteName || "MISSION NAVODAYA PUBLIC SCHOOL"}
                      </span>
                      <span className="text-[#FFD700] font-black uppercase tracking-wider">
                        AUTH SIGNATURE
                      </span>
                    </div>
                  </div>
                ) : (
                  /* BACK OF CARD */
                  <div className="flex-1 flex flex-col justify-between bg-[#0A1128]">
                    {/* Top Bar Spacer */}
                    <div className="h-2 bg-[#FFD700]" />

                    {/* Back content */}
                    <div className="flex-1 p-5 flex flex-col justify-between">
                      <div className="space-y-2">
                        <h4 className="font-bold text-xs uppercase text-[#FFD700] tracking-wider">
                          Terms & Conditions
                        </h4>
                        <ol className="list-decimal pl-4 text-[9px] text-slate-300 space-y-1 leading-snug">
                          <li>This card is non-transferable and must be presented upon request.</li>
                          <li>If found, please return to the institute address below.</li>
                          <li>Loss of this card must be reported immediately.</li>
                        </ol>
                      </div>

                      <div className="w-full h-0.5 bg-[#FFD700]/40 my-2" />

                      <div className="flex items-end justify-between text-[8px] text-slate-300">
                        <div className="space-y-0.5 leading-tight max-w-[220px]">
                          <p className="font-bold text-white text-[9.5px]">
                            {settings.instituteName || "Mission Navodaya Public School"}
                          </p>
                          <p>Ph: {settings.mobile || "9876543210"}</p>
                          <p className="truncate">{settings.address || "Mora Mairi, Bhagwaanpur, Siwan, Bihar 841507"}</p>
                        </div>

                        <div className="text-center flex-shrink-0">
                          <div className="w-24 border-t border-white/60 mb-0.5" />
                          <span className="text-[7.5px] uppercase font-bold text-slate-400">Principal Sign</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-text-muted text-xs">Select a student to load live preview</div>
            )}

            <div className="w-full grid grid-cols-2 gap-3.5 mt-5">
              <button
                onClick={handleExportPDF}
                className="w-full py-2.5 rounded-xl bg-white hover:bg-surface2 text-text font-bold text-xs border border-border flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <FileText className="w-4 h-4 text-primary" />
                <span>Export as PDF</span>
              </button>
              <button
                onClick={() => showToast("PNG archive generated successfully!", "success")}
                className="w-full py-2.5 rounded-xl bg-white hover:bg-surface2 text-text font-bold text-xs border border-border flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Export as PNG</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom select students list table */}
      <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-border bg-surface2/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-xs text-text uppercase">Select Students ({selectedStudentIds.length} Selected)</span>
          </div>
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search student..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface2 border border-border text-xs text-text focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface2/60 border-b border-border text-text-secondary font-bold text-[10px] uppercase">
                <th className="py-3 px-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={selectedStudentIds.length === students.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded text-primary focus:ring-primary/30 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">ID Number</th>
                <th className="py-3 px-4">Grade / Section</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-text">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-text-muted">No students found.</td>
                </tr>
              ) : filteredStudents.map(s => {
                const isChecked = selectedStudentIds.includes(s.id);
                return (
                  <tr key={s.id} className="hover:bg-surface2/30 transition-colors">
                    <td className="py-3.5 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelectStudent(s.id)}
                        className="w-4 h-4 rounded text-primary focus:ring-primary/30 cursor-pointer"
                      />
                    </td>
                    <td className="py-3.5 px-4 font-bold text-text">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs flex-shrink-0 overflow-hidden shadow-2xs">
                          {s.photoPath ? <img src={s.photoPath} alt={s.name} className="w-full h-full object-cover" /> : s.name?.charAt(0)}
                        </div>
                        <span>{s.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-text-secondary font-medium">{s.studentId}</td>
                    <td className="py-3.5 px-4 text-text-secondary font-medium">
                      {s.studentType === 'school' ? `Class ${s.className || '10'} - ${s.section || 'A'}` : s.course}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        s.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {s.status || 'Active'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
