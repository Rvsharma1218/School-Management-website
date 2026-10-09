'use client';

import React, { useState, useMemo } from 'react';
import { useSchoolStore } from '../lib/store';
import {
  Printer, Download, Plus, Trash2, Calendar,
  GraduationCap, FileText, CheckCircle2, User, Search, Share2, Shield, QrCode
} from 'lucide-react';
import { jsPDF } from 'jspdf';

export default function AdmitCardView() {
  const { students, settings, showToast } = useSchoolStore();

  const [selectedClass, setSelectedClass] = useState('all');
  const [examTitle, setExamTitle] = useState('Annual Board & Final Examination 2026-27');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExportingPdf, setIsExportingPdf] = useState(false);

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
      const q = searchQuery.trim().toLowerCase();
      const matchSearch = !q ||
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.rollNumber && String(s.rollNumber).toLowerCase().includes(q)) ||
        (s.aadhaarNumber && String(s.aadhaarNumber).toLowerCase().includes(q)) ||
        (s.admissionNumber && String(s.admissionNumber).toLowerCase().includes(q));
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

  // Browser Print All with multi-page support
  const handlePrintAll = () => {
    window.print();
  };

  // Direct jsPDF Multi-Page PDF Download for All or Single Student
  const handleDownloadPdf = async (singleStudent = null) => {
    const targetList = singleStudent ? [singleStudent] : filteredStudents;
    if (targetList.length === 0) {
      showToast('No students to export', 'error');
      return;
    }

    setIsExportingPdf(true);
    showToast(`Generating official PDF for ${targetList.length} student(s)...`, 'info');

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const schoolName = (settings.instituteName || 'MISSION NAVODAYA PUBLIC SCHOOL').toUpperCase();
      const session = settings.currentSession || '2026-27';
      const address = settings.address || 'Mora Mairi, Bhagwaanpur, Siwan, Bihar';
      const phone = settings.mobile || '';

      targetList.forEach((s, index) => {
        if (index > 0) {
          doc.addPage();
        }

        const W = 210;
        const M = 12;
        const cardW = W - 2 * M;
        const cardH = 265;

        // Outer Dark Navy Border
        doc.setDrawColor(10, 17, 40); // #0A1128
        doc.setLineWidth(1.2);
        doc.roundedRect(M, M, cardW, cardH, 3, 3);

        // Header Background Banner
        doc.setFillColor(10, 17, 40);
        doc.rect(M, M, cardW, 28, 'F');

        // Header Title
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(schoolName, W / 2, M + 10, { align: 'center' });

        doc.setTextColor(255, 215, 0); // Gold
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.text(address, W / 2, M + 17, { align: 'center' });

        doc.setTextColor(200, 220, 255);
        doc.setFontSize(8);
        doc.text(`SESSION: ${session} | HELPLINE: ${phone}`, W / 2, M + 23, { align: 'center' });

        // Official Hall Ticket Ribbon
        doc.setFillColor(238, 242, 255);
        doc.rect(M, M + 28, cardW, 11, 'F');
        doc.setDrawColor(10, 17, 40);
        doc.setLineWidth(0.4);
        doc.line(M, M + 39, M + cardW, M + 39);

        doc.setTextColor(10, 17, 40);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(`OFFICIAL ADMIT CARD / HALL TICKET - ${examTitle.toUpperCase()}`, W / 2, M + 35, { align: 'center' });

        // Student Info & Aadhaar Box
        const infoTop = M + 44;
        const infoH = 46;
        doc.setFillColor(248, 249, 250);
        doc.setDrawColor(200, 200, 210);
        doc.roundedRect(M + 4, infoTop, cardW - 8, infoH, 2, 2, 'FD');

        // Text details
        doc.setFontSize(9);
        doc.setTextColor(50, 50, 60);

        const leftX = M + 8;
        doc.setFont('helvetica', 'bold');
        doc.text('Student Name:', leftX, infoTop + 8);
        doc.setTextColor(10, 17, 40);
        doc.text((s.name || '').toUpperCase(), leftX + 28, infoTop + 8);

        doc.setTextColor(50, 50, 60);
        doc.text('Father Name:', leftX, infoTop + 16);
        doc.setTextColor(20, 20, 20);
        doc.text((s.fatherName || '-').toUpperCase(), leftX + 28, infoTop + 16);

        doc.setTextColor(50, 50, 60);
        doc.text('Class & Sec:', leftX, infoTop + 24);
        doc.setTextColor(20, 20, 20);
        doc.text(`${s.className || ''} ${s.section ? '(' + s.section + ')' : ''}`, leftX + 28, infoTop + 24);

        doc.setTextColor(50, 50, 60);
        doc.text('Roll Number:', leftX, infoTop + 32);
        doc.setTextColor(10, 17, 40);
        doc.setFont('helvetica', 'bold');
        doc.text(String(s.rollNumber || s.id || '-'), leftX + 28, infoTop + 32);

        // Aadhaar ID Badge (Highlighted in Deep Blue Box)
        const aadhaar = s.aadhaarNumber || s.aadharNumber || s.aadhaar || 'NA-NOT-LINKED';
        doc.setFillColor(224, 231, 255);
        doc.setDrawColor(99, 102, 241);
        doc.roundedRect(leftX, infoTop + 36, 110, 7.5, 1.5, 1.5, 'FD');
        doc.setTextColor(30, 27, 75);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(`Official Aadhaar ID: ${aadhaar}`, leftX + 3, infoTop + 41);

        // Right side: Photo Frame
        const photoX = M + cardW - 36;
        const photoY = infoTop + 4;
        doc.setDrawColor(180, 180, 180);
        doc.setFillColor(255, 255, 255);
        doc.rect(photoX, photoY, 28, 36, 'FD');
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text('AFFIX PHOTO', photoX + 14, photoY + 18, { align: 'center' });

        // Timetable Section
        const tableTop = infoTop + infoH + 8;
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(10, 17, 40);
        doc.text('EXAMINATION TIMETABLE & VERIFICATION SCHEDULE', M + 4, tableTop);

        // Table Header
        const thY = tableTop + 4;
        doc.setFillColor(10, 17, 40);
        doc.rect(M + 4, thY, cardW - 8, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.text('Date', M + 8, thY + 5.5);
        doc.text('Subject', M + 45, thY + 5.5);
        doc.text('Exam Timing', M + 105, thY + 5.5);
        doc.text('Invigilator Sign', M + 155, thY + 5.5);

        // Table Rows
        let rowY = thY + 8;
        timetable.forEach((t, i) => {
          doc.setFillColor(i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 249, i % 2 === 0 ? 255 : 252);
          doc.rect(M + 4, rowY, cardW - 8, 7, 'F');
          doc.setDrawColor(220, 220, 230);
          doc.line(M + 4, rowY + 7, M + cardW - 4, rowY + 7);

          doc.setTextColor(40, 40, 40);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.text(t.date || '', M + 8, rowY + 5);
          doc.setFont('helvetica', 'bold');
          doc.text(t.subject || '', M + 45, rowY + 5);
          doc.setFont('helvetica', 'normal');
          doc.text(t.time || '', M + 105, rowY + 5);
          doc.setTextColor(180, 180, 180);
          doc.text('___________________', M + 150, rowY + 5);

          rowY += 7;
        });

        // Instructions
        const instY = rowY + 8;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(10, 17, 40);
        doc.text('CANDIDATE INSTRUCTIONS:', M + 4, instY);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(80, 80, 90);
        doc.text('1. Candidates must carry this physical Admit Card along with valid Aadhaar identification to all exams.', M + 4, instY + 5);
        doc.text('2. Entry to the examination hall closes exactly 15 minutes prior to the scheduled exam commencement.', M + 4, instY + 9.5);
        doc.text('3. Mobile phones, smart watches, bags and study materials are strictly prohibited inside examination room.', M + 4, instY + 14);

        // Bold Signature Section with High Contrast Plaque
        const sigY = cardH - 14;
        doc.setDrawColor(10, 17, 40);
        doc.setLineWidth(0.8);
        doc.line(M + 12, sigY, M + 65, sigY);
        doc.line(M + cardW - 65, sigY, M + cardW - 12, sigY);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(10, 17, 40); // Deep Dark Navy for maximum clarity
        doc.text('Class Teacher Signature', M + 38, sigY + 5, { align: 'center' });
        doc.text('Authorized Principal Signature', M + cardW - 38, sigY + 5, { align: 'center' });
      });

      const filename = singleStudent
        ? `Admit_Card_${(singleStudent.name || 'Student').replace(/\s+/g, '_')}_${singleStudent.className || 'Class'}.pdf`
        : `All_Admit_Cards_${selectedClass}_${new Date().toISOString().slice(0, 10)}.pdf`;

      doc.save(filename);
      showToast(`Admit card PDF downloaded successfully! (${targetList.length} cards)`, 'success');
    } catch (err) {
      console.error('PDF error:', err);
      showToast('Error generating PDF document', 'error');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Student Admit Cards - ${settings.instituteName || 'School'}`,
          text: `Official Student Admit Cards for ${examTitle}. Total students: ${filteredStudents.length}.`,
          url: window.location.href,
        });
      } catch (err) {
        console.warn('Share cancelled or not supported');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Page link copied to clipboard for sharing!', 'success');
    }
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
            Official Admit Cards with Aadhaar ID, QR Code verification, and full multi-page PDF export.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleShare}
            className="px-4 py-2.5 rounded-xl bg-surface2 hover:bg-surface2/80 text-text font-bold text-xs border border-border transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Share2 className="w-4 h-4 text-primary" />
            <span>Share</span>
          </button>
          <button
            onClick={() => handleDownloadPdf()}
            disabled={filteredStudents.length === 0 || isExportingPdf}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>{isExportingPdf ? 'Exporting...' : `Save All as PDF (${filteredStudents.length})`}</span>
          </button>
          <button
            onClick={handlePrintAll}
            disabled={filteredStudents.length === 0}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Print All ({filteredStudents.length})</span>
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
              <option value="all">All Classes Booklet ({students.length} Students)</option>
              {schoolClasses.map(c => (
                <option key={c} value={c}>Class {c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-text-secondary uppercase">Search Single Student</label>
            <div className="relative mt-1">
              <Search className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, roll, or Aadhaar..."
                className="w-full pl-9 pr-3 py-2 bg-surface2 rounded-xl border border-border text-xs font-semibold text-text focus:outline-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-text-secondary uppercase">Exam Title (Editable)</label>
            <input
              type="text"
              value={examTitle}
              onChange={(e) => setExamTitle(e.target.value)}
              className="mt-1 w-full px-3 py-2 bg-surface2 rounded-xl border border-border text-xs font-semibold text-text focus:outline-primary"
              placeholder="e.g. Annual Board & Final Examination 2026-27"
            />
          </div>

          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs font-semibold text-primary flex items-center justify-between">
            <span>Ready to Print:</span>
            <span className="font-bold">{filteredStudents.length} Students</span>
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
              <span>{isAddingSubject ? 'Cancel' : 'Add Subject'}</span>
            </button>
          </div>

          {isAddingSubject && (
            <form onSubmit={handleAddSubject} className="p-3 bg-surface2 rounded-xl border border-border space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Subject Name"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="px-3 py-1.5 bg-white rounded-lg border border-border text-xs font-semibold"
                />
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="px-3 py-1.5 bg-white rounded-lg border border-border text-xs font-semibold"
                />
                <input
                  type="text"
                  placeholder="Timing (e.g. 09:00 AM - 12:00 PM)"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="px-3 py-1.5 bg-white rounded-lg border border-border text-xs font-semibold"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs"
              >
                Save Subject to Schedule
              </button>
            </form>
          )}

          <div className="overflow-x-auto border border-border rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface2 font-bold text-text-secondary border-b border-border">
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
        <div className="print:hidden flex items-center justify-between">
          <h2 className="text-sm font-bold text-text">
            Previewing Admit Cards ({filteredStudents.length} Students)
          </h2>
          <span className="text-xs text-text-secondary">
            Aadhaar ID & QR Verification Included  Each student card prints on full page
          </span>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-border text-text-secondary text-sm">
            No students found matching the selected class/search filter.
          </div>
        ) : (
          <div className="admit-cards-container grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-1 print:gap-0">
            {filteredStudents.map((s) => {
              const aadhaar = s.aadhaarNumber || s.aadharNumber || s.aadhaar || 'NA-NOT-LINKED';
              const qrData = encodeURIComponent(`STUDENT ADMIT CARD | Name: ${s.name} | Roll: ${s.rollNumber || s.id} | Class: ${s.className} | Aadhaar: ${aadhaar} | Session: ${settings.currentSession || '2026-27'}`);
              const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${qrData}`;

              return (
                <div
                  key={s.id}
                  className="admit-card-item bg-white border-2 border-indigo-950 rounded-xl p-5 shadow-sm print:shadow-none print:break-after-page text-black font-sans relative"
                >
                  {/* Individual Action Bar (Hidden on Print) */}
                  <div className="print:hidden flex items-center justify-between pb-3 mb-3 border-b border-gray-200">
                    <span className="text-[11px] font-bold text-gray-500 uppercase">Roll: {s.rollNumber || s.id}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownloadPdf(s)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1 transition-all"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download Single PDF</span>
                      </button>
                    </div>
                  </div>

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
                    <div className="flex-1 text-center pr-2">
                      <h2 className="font-black text-base uppercase text-indigo-950 leading-tight">
                        {settings.instituteName || 'Mission Navodaya Public School'}
                      </h2>
                      <p className="text-[10px] text-gray-700 font-semibold">{settings.address || 'Mora Mairi, Bhagwaanpur, Siwan, Bihar'}</p>
                      <p className="text-[10px] text-indigo-900 font-black">
                        Session: {settings.currentSession || '2026-27'} | Mobile: {settings.mobile || ''}
                      </p>
                    </div>
                  </div>

                  {/* Exam Title Badge */}
                  <div className="my-3 text-center flex items-center justify-between">
                    <span className="text-[9px] font-bold text-gray-600 uppercase tracking-wider">
                      OFFICIAL HALL TICKET
                    </span>
                    <span className="inline-block px-4 py-1 bg-indigo-100 text-indigo-950 font-black text-xs uppercase tracking-wider rounded-md border border-indigo-200 shadow-2xs">
                      {examTitle}
                    </span>
                    <span className="text-[9px] font-bold text-indigo-800">
                      SESSION {settings.currentSession || '2026-27'}
                    </span>
                  </div>

                  {/* Student Info, Photo & QR Code */}
                  <div className="bg-gray-50 border border-gray-300 rounded-lg p-3 flex justify-between gap-3 text-xs mb-3">
                    <div className="space-y-1 font-semibold flex-1">
                      <p><span className="font-bold text-gray-600">Student Name:</span> <strong className="text-black uppercase">{s.name}</strong></p>
                      <p><span className="font-bold text-gray-600">Father Name:</span> {s.fatherName || '-'}</p>
                      <p><span className="font-bold text-gray-600">Class & Section:</span> <strong>{s.className} {s.section || 'A'}</strong></p>
                      <p><span className="font-bold text-gray-600">Roll No:</span> <strong>{s.rollNumber || s.id}</strong> | <span className="font-bold text-gray-600">Admission No:</span> {s.admissionNumber || s.id}</p>
                      <p className="pt-1 border-t border-gray-200">
                        <span className="font-bold text-indigo-950">Aadhaar Card No (Official ID):</span>{' '}
                        <strong className="text-indigo-950 font-black bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          {aadhaar}
                        </strong>
                      </p>
                    </div>

                    {/* QR Code */}
                    <div className="flex flex-col items-center justify-center p-1 bg-white border border-gray-300 rounded-lg">
                      <img
                        src={qrUrl}
                        alt="Admit Card QR"
                        className="w-16 h-16 object-contain"
                      />
                      <span className="text-[7px] text-gray-500 font-bold tracking-tighter uppercase mt-0.5">
                        SCAN TO VERIFY
                      </span>
                    </div>

                    {/* Photo */}
                    <div className="w-20 h-24 border border-gray-400 bg-white flex items-center justify-center text-[10px] font-bold text-gray-400 uppercase text-center overflow-hidden rounded">
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
                          <th className="p-1 text-center">Invigilator Sign</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-300">
                        {timetable.map((t, idx) => (
                          <tr key={idx}>
                            <td className="p-1 border-r border-gray-400 font-semibold">{t.date}</td>
                            <td className="p-1 border-r border-gray-400 font-bold">{t.subject}</td>
                            <td className="p-1 border-r border-gray-400">{t.time}</td>
                            <td className="p-1 text-center text-gray-400">__________</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Instructions */}
                  <div className="text-[8px] text-gray-600 space-y-0.5 border-t border-gray-300 pt-2 mb-6">
                    <p className="font-bold text-black uppercase">Instructions for Candidate:</p>
                    <p>1. Candidate must carry this Admit Card with Aadhaar verification to all examinations.</p>
                    <p>2. Report to examination room at least 15 minutes before the scheduled time.</p>
                    <p>3. Electronic gadgets and unauthorized materials are strictly forbidden inside the hall.</p>
                  </div>

                  {/* Signatures with Bold Deep Dark Navy Highlight */}
                  <div className="flex justify-between items-end border-t-2 border-indigo-950 pt-3 mt-4 text-[10px] font-black text-indigo-950">
                    <div className="text-center">
                      <div className="w-32 border-b-2 border-indigo-950 mb-1" />
                      <span className="uppercase tracking-wider">Class Teacher Sign</span>
                    </div>
                    <div className="text-center flex flex-col items-center">
                      {settings.principalSignature || settings.signatureUrl ? (
                        <img
                          src={settings.principalSignature || settings.signatureUrl}
                          alt="Signature"
                          className="h-9 object-contain mb-1 filter drop-shadow-sm"
                        />
                      ) : (
                        <div className="h-9" />
                      )}
                      <div className="w-36 border-b-2 border-indigo-950 mb-1" />
                      <span className="uppercase tracking-wider">Authorized Principal Sign</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
