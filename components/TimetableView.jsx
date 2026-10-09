'use client';

import React, { useState, useEffect } from 'react';
import { useSchoolStore } from '../lib/store';
import {
  Calendar, Clock, Plus, Trash2, Printer, Download, BookOpen, User, Building, CheckCircle2, Share2, Save, Sparkles
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { getImageDataUrl } from '../lib/exportUtils';

const defaultClassSchedule = {
  Monday: [
    { id: 1, period: 1, time: '09:00 AM - 09:45 AM', subject: 'Hindi', teacher: 'Ramesh Sir', room: '101' },
    { id: 2, period: 2, time: '09:45 AM - 10:30 AM', subject: 'English', teacher: 'Pooja Ma\'am', room: '101' },
    { id: 3, period: 3, time: '10:45 AM - 11:30 AM', subject: 'Mathematics', teacher: 'Vikram Sir', room: '101' },
    { id: 4, period: 4, time: '11:30 AM - 12:15 PM', subject: 'Science', teacher: 'Anjali Ma\'am', room: '101' },
    { id: 5, period: 5, time: '12:45 PM - 01:30 PM', subject: 'Social Studies', teacher: 'Sanjay Sir', room: '101' },
    { id: 6, period: 6, time: '01:30 PM - 02:15 PM', subject: 'Computer', teacher: 'Amit Sir', room: 'Lab 1' },
  ],
  Tuesday: [
    { id: 7, period: 1, time: '09:00 AM - 09:45 AM', subject: 'Mathematics', teacher: 'Vikram Sir', room: '101' },
    { id: 8, period: 2, time: '09:45 AM - 10:30 AM', subject: 'Science', teacher: 'Anjali Ma\'am', room: '101' },
    { id: 9, period: 3, time: '10:45 AM - 11:30 AM', subject: 'Hindi', teacher: 'Ramesh Sir', room: '101' },
    { id: 10, period: 4, time: '11:30 AM - 12:15 PM', subject: 'English', teacher: 'Pooja Ma\'am', room: '101' },
    { id: 11, period: 5, time: '12:45 PM - 01:30 PM', subject: 'Drawing & Art', teacher: 'Sunita Ma\'am', room: 'Art Room' },
  ],
  Wednesday: [
    { id: 12, period: 1, time: '09:00 AM - 09:45 AM', subject: 'English', teacher: 'Pooja Ma\'am', room: '101' },
    { id: 13, period: 2, time: '09:45 AM - 10:30 AM', subject: 'Computer Lab', teacher: 'Amit Sir', room: 'Lab 1' },
    { id: 14, period: 3, time: '10:45 AM - 11:30 AM', subject: 'Mathematics', teacher: 'Vikram Sir', room: '101' },
    { id: 15, period: 4, time: '11:30 AM - 12:15 PM', subject: 'Science', teacher: 'Anjali Ma\'am', room: '101' },
  ],
  Thursday: [
    { id: 16, period: 1, time: '09:00 AM - 09:45 AM', subject: 'Science', teacher: 'Anjali Ma\'am', room: '101' },
    { id: 17, period: 2, time: '09:45 AM - 10:30 AM', subject: 'Maths', teacher: 'Vikram Sir', room: '101' },
    { id: 18, period: 3, time: '10:45 AM - 11:30 AM', subject: 'Social Studies', teacher: 'Sanjay Sir', room: '101' },
    { id: 19, period: 4, time: '11:30 AM - 12:15 PM', subject: 'Hindi', teacher: 'Ramesh Sir', room: '101' },
  ],
  Friday: [
    { id: 20, period: 1, time: '09:00 AM - 09:45 AM', subject: 'Social Studies', teacher: 'Sanjay Sir', room: '101' },
    { id: 21, period: 2, time: '09:45 AM - 10:30 AM', subject: 'Drawing & Art', teacher: 'Sunita Ma\'am', room: 'Art Room' },
    { id: 22, period: 3, time: '10:45 AM - 11:30 AM', subject: 'Mathematics', teacher: 'Vikram Sir', room: '101' },
    { id: 23, period: 4, time: '11:30 AM - 12:15 PM', subject: 'English', teacher: 'Pooja Ma\'am', room: '101' },
  ],
  Saturday: [
    { id: 24, period: 1, time: '09:00 AM - 09:45 AM', subject: 'Physical Education', teacher: 'Rana Sir', room: 'Playground' },
    { id: 25, period: 2, time: '09:45 AM - 10:30 AM', subject: 'Moral Science', teacher: 'Principal Ma\'am', room: '101' },
    { id: 26, period: 3, time: '10:45 AM - 11:30 AM', subject: 'General Knowledge', teacher: 'Pooja Ma\'am', room: '101' },
  ],
};

export default function TimetableView() {
  const { settings, showToast } = useSchoolStore();
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const [activeDay, setActiveDay] = useState('Monday');
  const [selectedClass, setSelectedClass] = useState('10th');

  const schoolClasses = settings.schoolClasses && settings.schoolClasses.length > 0
    ? settings.schoolClasses
    : ['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];

  const [timetable, setTimetable] = useState(defaultClassSchedule);
  const [isAdding, setIsAdding] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newTeacher, setNewTeacher] = useState('');
  const [newTime, setNewTime] = useState('09:00 AM - 09:45 AM');
  const [newRoom, setNewRoom] = useState('101');
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`timetable_${selectedClass}`);
      if (saved) {
        setTimetable(JSON.parse(saved));
      } else {
        setTimetable(defaultClassSchedule);
      }
    } catch (e) {
      setTimetable(defaultClassSchedule);
    }
    setCurrentTimeStr(new Date().toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }));
  }, [selectedClass]);

  const saveTimetable = (updated) => {
    setTimetable(updated);
    try {
      localStorage.setItem(`timetable_${selectedClass}`, JSON.stringify(updated));
    } catch (e) { }
  };

  const handleAddPeriod = (e) => {
    e.preventDefault();
    if (!newSubject.trim()) {
      showToast('Please enter subject name', 'error');
      return;
    }

    const currentList = timetable[activeDay] || [];
    const newPeriod = {
      id: Date.now(),
      period: currentList.length + 1,
      time: newTime.trim() || '09:00 AM - 09:45 AM',
      subject: newSubject.trim(),
      teacher: newTeacher.trim() || 'Faculty',
      room: newRoom.trim() || '101',
    };

    const updated = {
      ...timetable,
      [activeDay]: [...currentList, newPeriod]
    };

    saveTimetable(updated);
    setNewSubject('');
    setNewTeacher('');
    setIsAdding(false);
    showToast(`Period added to ${activeDay} successfully!`, 'success');
  };

  const handleDeletePeriod = (id) => {
    const currentList = timetable[activeDay] || [];
    const updated = {
      ...timetable,
      [activeDay]: currentList.filter(p => p.id !== id).map((p, idx) => ({ ...p, period: idx + 1 }))
    };
    saveTimetable(updated);
    showToast('Period removed', 'info');
  };

  // Dedicated jsPDF Routine Document Generator with School Logo & Principal Signature
  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    showToast(`Generating official timetable PDF for Class ${selectedClass}...`, 'info');

    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const schoolName = (settings.instituteName || settings.schoolName || 'MISSION NAVODAYA PUBLIC SCHOOL').toUpperCase();
      const session = settings.currentSession || settings.academicYear || '2026-27';
      const address = settings.address || 'Mora Mairi, BagwaanPur hat ,Siwan,Bihar 841507';
      const phone = settings.mobile || settings.phone || '8568643490';

      const logoData = await getImageDataUrl(settings.logoUrl || settings.logoPath || settings.logo);
      const sigData = await getImageDataUrl(settings.principalSignature || settings.signatureUrl || settings.signature);

      const W = 297;
      const H = 210;
      const M = 12;

      // Header Banner
      doc.setFillColor(30, 58, 138); // #1E3A8A
      doc.roundedRect(M, M, W - 2 * M, 24, 3, 3, 'F');

      if (logoData) {
        try {
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(M + 3, M + 3, 18, 18, 2, 2, 'F');
          doc.addImage(logoData, 'PNG', M + 4, M + 4, 16, 16);
        } catch (e) { }
      }

      const textX = logoData ? M + 25 : M + 8;
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(schoolName, textX, M + 10);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(`${address} | Helpline: ${phone}`, textX, M + 17);

      // Right Side Header Badge
      doc.setTextColor(255, 215, 0); // Gold
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`CLASS: ${selectedClass.toUpperCase()}`, W - M - 6, M + 10, { align: 'right' });

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8.5);
      doc.text(`Academic Session: ${session}`, W - M - 6, M + 17, { align: 'right' });

      // Title
      const titleY = M + 32;
      doc.setTextColor(30, 58, 138);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`WEEKLY ACADEMIC ROUTINE & PERIOD SCHEDULE - CLASS ${selectedClass.toUpperCase()}`, M + 2, titleY);

      // Timetable Matrix (Table)
      const tableTop = titleY + 4;
      const tableW = W - 2 * M;
      const dayColW = 32;
      const numPeriods = 6;
      const periodColW = (tableW - dayColW) / numPeriods;

      // Header Row (Periods)
      doc.setFillColor(243, 244, 246);
      doc.rect(M, tableTop, tableW, 10, 'F');
      doc.setDrawColor(209, 213, 219);
      doc.rect(M, tableTop, tableW, 10);

      doc.setTextColor(17, 24, 39);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text('DAY', M + dayColW / 2, tableTop + 6.5, { align: 'center' });

      const periodTimes = [
        '09:00-09:45', '09:45-10:30', '10:45-11:30',
        '11:30-12:15', '12:45-01:30', '01:30-02:15'
      ];

      for (let p = 1; p <= numPeriods; p++) {
        const pX = M + dayColW + (p - 1) * periodColW;
        doc.line(pX, tableTop, pX, tableTop + 10);
        doc.text(`PERIOD ${p}`, pX + periodColW / 2, tableTop + 5, { align: 'center' });
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(75, 85, 99);
        doc.text(periodTimes[p - 1] || '', pX + periodColW / 2, tableTop + 8.5, { align: 'center' });
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(17, 24, 39);
      }

      // Day Rows
      let rowY = tableTop + 10;
      const rowH = 17;

      days.forEach((day, dIdx) => {
        doc.setFillColor(dIdx % 2 === 0 ? 255 : 249, dIdx % 2 === 0 ? 255 : 250, dIdx % 2 === 0 ? 255 : 251);
        doc.rect(M, rowY, tableW, rowH, 'F');
        doc.setDrawColor(229, 231, 235);
        doc.rect(M, rowY, tableW, rowH);

        // Day Name Cell
        doc.setFillColor(243, 244, 246);
        doc.rect(M, rowY, dayColW, rowH, 'F');
        doc.setDrawColor(209, 213, 219);
        doc.line(M + dayColW, rowY, M + dayColW, rowY + rowH);

        doc.setTextColor(30, 58, 138);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.text(day.toUpperCase(), M + dayColW / 2, rowY + rowH / 2 + 1.5, { align: 'center' });

        // Period Cells
        const dayPeriods = timetable[day] || [];
        for (let p = 1; p <= numPeriods; p++) {
          const pX = M + dayColW + (p - 1) * periodColW;
          doc.line(pX, rowY, pX, rowY + rowH);

          const matched = dayPeriods.find(item => item.period === p);
          if (matched) {
            doc.setTextColor(17, 24, 39);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9.5);
            doc.text(matched.subject || '', pX + periodColW / 2, rowY + 6, { align: 'center' });

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            doc.setTextColor(55, 65, 81);
            doc.text(matched.teacher || '', pX + periodColW / 2, rowY + 11, { align: 'center' });

            doc.setTextColor(107, 114, 128);
            doc.setFontSize(7);
            doc.text(matched.room ? `Room ${matched.room}` : (matched.time || ''), pX + periodColW / 2, rowY + 15, { align: 'center' });
          } else {
            doc.setTextColor(180, 180, 180);
            doc.text('-', pX + periodColW / 2, rowY + rowH / 2, { align: 'center' });
          }
        }

        rowY += rowH;
      });

      // Footer Signatures
      const footerY = H - 18;
      doc.setDrawColor(156, 163, 175);
      doc.setLineWidth(0.8);
      doc.line(M + 10, footerY, M + 70, footerY);
      doc.setTextColor(55, 65, 81);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Class Teacher Signature', M + 40, footerY + 5, { align: 'center' });

      // Right: Principal Signature
      const rightSigX = W - M - 75;
      if (sigData) {
        try {
          doc.addImage(sigData, 'PNG', rightSigX + 12, footerY - 14, 38, 12);
        } catch (e) { }
      }
      doc.setDrawColor(30, 58, 138);
      doc.setLineWidth(1.0);
      doc.line(rightSigX, footerY, rightSigX + 65, footerY);

      doc.setTextColor(30, 58, 138);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Principal Signature & Seal', rightSigX + 32, footerY + 5, { align: 'center' });

      doc.save(`Class_${selectedClass}_Routine_Timetable.pdf`);
      showToast(`Timetable PDF downloaded successfully for Class ${selectedClass}!`, 'success');
    } catch (err) {
      console.error('Timetable PDF error:', err);
      showToast('Error generating timetable PDF', 'error');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Class ${selectedClass} Timetable - ${settings.instituteName || 'School'}`,
          text: `Official Routine & Weekly Timetable for Class ${selectedClass}.`,
          url: window.location.href,
        });
      } catch (e) { }
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Link copied to clipboard for sharing!', 'success');
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Controls */}
      <div className="print:hidden flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-border shadow-xs">
        <div>
          <h1 className="text-xl font-black text-text flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" />
            Class Routine & Weekly Timetable Studio
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Complete routine management with period timings, faculty allocation, and high-res PDF generation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-surface2 px-3.5 py-2 rounded-xl border border-border">
            <span className="text-xs font-bold text-text-secondary uppercase">Class:</span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-transparent text-xs font-bold text-primary focus:outline-none cursor-pointer"
            >
              {schoolClasses.map(c => (
                <option key={c} value={c}>Class {c}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleShare}
            className="px-4 py-2.5 rounded-xl bg-surface2 hover:bg-surface2/80 text-text font-bold text-xs border border-border transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Share2 className="w-4 h-4 text-primary" />
            <span>Share</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isExportingPdf ? 'Exporting...' : 'Export Timetable PDF'}</span>
          </button>
        </div>
      </div>

      {/* Weekday Switcher */}
      <div className="print:hidden flex items-center gap-2 overflow-x-auto pb-1">
        {days.map(day => {
          const isActive = activeDay === day;
          const count = (timetable[day] || []).length;
          return (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white border border-border text-text-secondary hover:text-text'
              }`}
            >
              <span>{day}</span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${isActive ? 'bg-white/20 text-white' : 'bg-surface2 text-text-secondary'}`}>
                {count} Periods
              </span>
            </button>
          );
        })}
      </div>

      {/* Routine Cards Grid (Matching Modern App Layout) */}
      <div className="bg-white border-2 border-indigo-950/20 rounded-2xl p-6 shadow-sm text-black">
        {/* Header inside container */}
        <div className="border-b-2 border-indigo-950 pb-4 mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-black text-lg uppercase text-indigo-950">
              {settings.instituteName || 'Mission Navodaya Public School'}
            </h2>
            <p className="text-xs text-gray-700 font-semibold mt-0.5">
              Weekly Routine Schedule  <strong>Class {selectedClass} ({activeDay})</strong>
            </p>
          </div>
          <div className="text-right">
            <span className="inline-block px-3.5 py-1.5 bg-indigo-50 border border-indigo-200 rounded-lg text-xs font-black text-indigo-950 uppercase tracking-wide">
              {activeDay} Schedule ({ (timetable[activeDay] || []).length } Periods)
            </span>
          </div>
        </div>

        {/* Modern Period Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {(!timetable[activeDay] || timetable[activeDay].length === 0) ? (
            <div className="col-span-full p-8 text-center bg-gray-50 rounded-xl border border-gray-200 text-gray-500 text-sm">
              No periods scheduled for {activeDay} in Class {selectedClass}. Click "+ Add Period to {activeDay}" below.
            </div>
          ) : (
            timetable[activeDay].map((p, idx) => (
              <div
                key={p.id || idx}
                className="bg-white rounded-xl border-2 border-indigo-100 hover:border-indigo-300 p-4 shadow-2xs hover:shadow-sm transition-all relative group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-1 rounded-md bg-indigo-950 text-white text-[11px] font-black uppercase tracking-wider">
                      Period {p.period || idx + 1}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-900 text-[11px] font-bold border border-indigo-200 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-indigo-600" />
                        <span>{p.time}</span>
                      </span>
                      <button
                        onClick={() => handleDeletePeriod(p.id)}
                        className="text-rose-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                        title="Remove Period"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-black text-indigo-950 mb-2">
                    {p.subject}
                  </h3>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                  <div className="flex items-center gap-1.5 font-bold">
                    <User className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{p.teacher}</span>
                  </div>
                  <div className="flex items-center gap-1 font-semibold text-gray-500">
                    <Building className="w-3.5 h-3.5" />
                    <span>Room {p.room || '101'}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Period Form */}
        <div className="mt-4 print:hidden">
          {isAdding ? (
            <form onSubmit={handleAddPeriod} className="p-4 bg-surface2 rounded-xl border border-border space-y-3">
              <h3 className="font-bold text-xs text-text">Add New Period to {activeDay} (Class {selectedClass})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  placeholder="Subject (e.g. Science)"
                  required
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="px-3 py-2 bg-white rounded-lg border border-border text-xs font-semibold"
                />
                <input
                  type="text"
                  placeholder="Timing (e.g. 09:00 AM - 09:45 AM)"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="px-3 py-2 bg-white rounded-lg border border-border text-xs font-semibold"
                />
                <input
                  type="text"
                  placeholder="Faculty Name (e.g. Ramesh Sir)"
                  value={newTeacher}
                  onChange={(e) => setNewTeacher(e.target.value)}
                  className="px-3 py-2 bg-white rounded-lg border border-border text-xs font-semibold"
                />
                <input
                  type="text"
                  placeholder="Room (e.g. 101)"
                  value={newRoom}
                  onChange={(e) => setNewRoom(e.target.value)}
                  className="px-3 py-2 bg-white rounded-lg border border-border text-xs font-semibold"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-bold text-xs cursor-pointer shadow-sm"
                >
                  Save Period
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 rounded-lg bg-white border border-border text-xs font-bold text-text-secondary cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="px-4 py-2.5 rounded-xl border border-dashed border-primary text-primary hover:bg-primary/5 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Period to {activeDay}</span>
            </button>
          )}
        </div>

        {/* Printable Footer */}
        <div className="mt-8 pt-4 border-t border-gray-300 flex items-center justify-between text-xs font-bold text-gray-700">
          <div>Class Teacher Signature</div>
          <div className="text-right text-[#1E3A8A] font-black uppercase">
            Authorized Principal Signature & Seal
          </div>
        </div>
      </div>
    </div>
  );
}
