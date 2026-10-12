'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSchoolStore } from '../lib/store';
import {
  Calendar, Clock, Plus, Trash2, Printer, Download, BookOpen, User, Building,
  CheckCircle2, Share2, Save, Sparkles, Copy, Layers, Users, AlertTriangle,
  ArrowRight, Filter, Check, CheckSquare, Square, X
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

function format12h(time24) {
  if (!time24) return '';
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr ? mStr.padStart(2, '0') : '00';
  if (isNaN(h)) return time24;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
}

function addMinutesToTime(time24, mins) {
  if (!time24) return '09:45';
  const [hStr, mStr] = time24.split(':');
  let totalMin = (parseInt(hStr, 10) || 0) * 60 + (parseInt(mStr, 10) || 0) + mins;
  totalMin = (totalMin + 1440) % 1440;
  const newH = Math.floor(totalMin / 60);
  const newM = totalMin % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

function calculateDuration(start24, end24) {
  if (!start24 || !end24) return 45;
  const [sh, sm] = start24.split(':').map(Number);
  const [eh, em] = end24.split(':').map(Number);
  let startTot = sh * 60 + sm;
  let endTot = eh * 60 + em;
  if (endTot < startTot) endTot += 1440;
  return Math.max(1, endTot - startTot);
}

export default function TimetableView() {
  const { settings, teachers, showToast } = useSchoolStore();
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const [activeDay, setActiveDay] = useState('Monday');
  const [selectedClass, setSelectedClass] = useState('10th');

  // Main View Mode: 'class' | 'teacher'
  const [viewMode, setViewMode] = useState('class');

  const schoolClasses = settings.schoolClasses && settings.schoolClasses.length > 0
    ? settings.schoolClasses
    : ['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];

  const [timetable, setTimetable] = useState(defaultClassSchedule);
  const [isAdding, setIsAdding] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newTeacher, setNewTeacher] = useState('');
  const [newRoom, setNewRoom] = useState('101');
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // ─── Time Dialer State (Start & End Time pickers) ──────────────────────────
  const [dialerStart, setDialerStart] = useState('09:00');
  const [dialerEnd, setDialerEnd] = useState('09:45');

  // ─── Bulk Copy Schedule to Other Classes Modal ────────────────────────────
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [targetClasses, setTargetClasses] = useState([]);
  const [copyScope, setCopyScope] = useState('all_days'); // 'all_days' | 'current_day'

  // ─── Teacher Routine Inspector State ──────────────────────────────────────
  const [selectedTeacher, setSelectedTeacher] = useState('all');

  const handleOpenAdd = () => {
    const existingList = timetable[activeDay] || [];
    if (existingList.length > 0) {
      // Auto-set start time based on previous period end time if possible
      const lastP = existingList[existingList.length - 1];
      if (lastP.time && lastP.time.includes('-')) {
        const parts = lastP.time.split('-').map(s => s.trim());
        // Simple heuristic: set next period to start at previous end or default
      }
    }
    setDialerStart('09:00');
    setDialerEnd('09:45');
    setIsAdding(true);
  };

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

    const formattedSlot = `${format12h(dialerStart)} - ${format12h(dialerEnd)}`;
    const currentList = timetable[activeDay] || [];
    const newPeriod = {
      id: Date.now(),
      period: currentList.length + 1,
      time: formattedSlot,
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
    showToast(`Period added to ${activeDay} (${formattedSlot})!`, 'success');
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

  // ─── Bulk Copy Handler: Replicate Schedule to Multiple Classes ───────────
  const handleOpenCopyModal = () => {
    // Default select all other classes
    const others = schoolClasses.filter(c => c !== selectedClass);
    setTargetClasses(others);
    setIsCopyModalOpen(true);
  };

  const handleToggleTargetClass = (cls) => {
    setTargetClasses(prev =>
      prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]
    );
  };

  const handleToggleAllClasses = () => {
    const others = schoolClasses.filter(c => c !== selectedClass);
    if (targetClasses.length === others.length) {
      setTargetClasses([]);
    } else {
      setTargetClasses(others);
    }
  };

  const handleApplyBulkCopy = () => {
    if (targetClasses.length === 0) {
      showToast('Please select at least one class to copy to.', 'error');
      return;
    }

    try {
      targetClasses.forEach(targetClass => {
        let existingTarget = {};
        try {
          const raw = localStorage.getItem(`timetable_${targetClass}`);
          if (raw) existingTarget = JSON.parse(raw);
        } catch (_) {}

        let newSchedule;
        if (copyScope === 'all_days') {
          // Replicate full week schedule
          newSchedule = JSON.parse(JSON.stringify(timetable));
        } else {
          // Replicate current active day schedule only
          newSchedule = {
            ...existingTarget,
            [activeDay]: JSON.parse(JSON.stringify(timetable[activeDay] || []))
          };
        }
        localStorage.setItem(`timetable_${targetClass}`, JSON.stringify(newSchedule));
      });

      showToast(`Schedule successfully copied to ${targetClasses.length} classes!`, 'success');
      setIsCopyModalOpen(false);
    } catch (e) {
      showToast('Failed to copy timetable: ' + e.message, 'error');
    }
  };

  // ─── Gather Teacher Schedule Across ALL School Classes ────────────────────
  const teacherScheduleData = useMemo(() => {
    const teacherMap = {};
    const allUniqueTeachers = new Set();

    if (teachers && teachers.length > 0) {
      teachers.forEach(t => {
        if (t.name) allUniqueTeachers.add(t.name.trim());
      });
    }

    schoolClasses.forEach(cls => {
      let clsSched = null;
      try {
        const raw = localStorage.getItem(`timetable_${cls}`);
        if (raw) clsSched = JSON.parse(raw);
      } catch (_) {}

      if (!clsSched) {
        if (cls === selectedClass) clsSched = timetable;
        else clsSched = defaultClassSchedule;
      }

      days.forEach(day => {
        const pList = clsSched[day] || [];
        pList.forEach(p => {
          const tName = (p.teacher || 'Faculty').trim();
          if (tName) {
            allUniqueTeachers.add(tName);
            if (!teacherMap[tName]) teacherMap[tName] = [];
            teacherMap[tName].push({
              className: cls,
              day,
              period: p.period,
              time: p.time,
              subject: p.subject,
              room: p.room,
              id: `${cls}_${day}_${p.period}_${p.id || Math.random()}`
            });
          }
        });
      });
    });

    const teacherList = Array.from(allUniqueTeachers).sort();
    return { teacherMap, teacherList };
  }, [schoolClasses, selectedClass, timetable, teachers]);

  // Compute conflicts (teacher scheduled for 2 classes at same day & time)
  const teacherConflicts = useMemo(() => {
    if (selectedTeacher === 'all') return [];
    const list = teacherScheduleData.teacherMap[selectedTeacher] || [];
    const timeSlotMap = {};
    const conflicts = [];

    list.forEach(item => {
      const key = `${item.day}_${item.time}`;
      if (!timeSlotMap[key]) {
        timeSlotMap[key] = [];
      }
      timeSlotMap[key].push(item);
    });

    Object.entries(timeSlotMap).forEach(([k, items]) => {
      if (items.length > 1) {
        conflicts.push({
          day: items[0].day,
          time: items[0].time,
          classes: items.map(i => i.className).join(' & ')
        });
      }
    });

    return conflicts;
  }, [selectedTeacher, teacherScheduleData]);

  // ─── jsPDF Routine Document Generator ─────────────────────────────────────
  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const W = 297, H = 210, M = 10;
      const contentW = W - 2 * M;

      const logoSrc = settings.logoUrl || settings.logoPath || settings.logo;
      const sigSrc = settings.principalSignature || settings.signatureUrl || settings.sealUrl;
      const [logoData, sigData] = await Promise.all([
        getImageDataUrl(logoSrc),
        getImageDataUrl(sigSrc),
      ]);

      // Outer Border
      doc.setDrawColor(30, 58, 138);
      doc.setLineWidth(1.2);
      doc.rect(M, M, contentW, H - 2 * M);

      doc.setDrawColor(219, 234, 254);
      doc.setLineWidth(0.4);
      doc.rect(M + 1.5, M + 1.5, contentW - 3, H - 2 * M - 3);

      let y = M + 8;
      if (logoData) {
        try {
          doc.addImage(logoData, 'PNG', M + 8, y, 18, 18);
        } catch (e) { }
      }

      doc.setTextColor(30, 58, 138);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text((settings.instituteName || 'MY SCHOOL & COMPUTER INSTITUTE').toUpperCase(), W / 2, y + 4, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`${settings.address || 'Address'} | Contact: ${settings.phone || settings.mobile || 'Phone'}`, W / 2, y + 9.5, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text(`OFFICIAL WEEKLY ROUTINE & TIMETABLE — CLASS ${selectedClass}`, W / 2, y + 16, { align: 'center' });

      y += 22;
      doc.setDrawColor(30, 58, 138);
      doc.setLineWidth(0.8);
      doc.line(M, y, W - M, y);
      y += 4;

      // Table layout
      const dayColW = 32;
      const numPeriods = 6;
      const periodColW = (contentW - dayColW) / numPeriods;
      const tableW = contentW;
      const headerH = 10;

      // Header row
      doc.setFillColor(30, 58, 138);
      doc.rect(M, y, tableW, headerH, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('DAY / PERIOD', M + dayColW / 2, y + 6.5, { align: 'center' });

      for (let p = 1; p <= numPeriods; p++) {
        const pX = M + dayColW + (p - 1) * periodColW;
        doc.text(`PERIOD ${p}`, pX + periodColW / 2, y + 6.5, { align: 'center' });
      }

      let rowY = y + headerH;
      const rowH = 17;

      days.forEach((day, dIdx) => {
        doc.setFillColor(dIdx % 2 === 0 ? 255 : 249, dIdx % 2 === 0 ? 255 : 250, dIdx % 2 === 0 ? 255 : 251);
        doc.rect(M, rowY, tableW, rowH, 'F');
        doc.setDrawColor(229, 231, 235);
        doc.rect(M, rowY, tableW, rowH);

        doc.setFillColor(243, 244, 246);
        doc.rect(M, rowY, dayColW, rowH, 'F');
        doc.setDrawColor(209, 213, 219);
        doc.line(M + dayColW, rowY, M + dayColW, rowY + rowH);

        doc.setTextColor(30, 58, 138);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.text(day.toUpperCase(), M + dayColW / 2, rowY + rowH / 2 + 1.5, { align: 'center' });

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

      const footerY = H - 18;
      doc.setDrawColor(156, 163, 175);
      doc.setLineWidth(0.8);
      doc.line(M + 10, footerY, M + 70, footerY);
      doc.setTextColor(55, 65, 81);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Class Teacher Signature', M + 40, footerY + 5, { align: 'center' });

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
      showToast(`Timetable PDF downloaded for Class ${selectedClass}!`, 'success');
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
      {/* Top Controls & View Mode Switcher */}
      <div className="print:hidden flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black text-text flex items-center gap-2">
              <Calendar className="w-6 h-6 text-primary" />
              <span>Routine & Weekly Timetable Studio</span>
            </h1>
            {/* View Mode Toggle: Class Routine vs Teacher Schedule */}
            <div className="flex items-center p-1 bg-surface2 rounded-xl border border-border">
              <button
                type="button"
                onClick={() => setViewMode('class')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'class'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-text-secondary hover:text-text'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Class Routine</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('teacher')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'teacher'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-text-secondary hover:text-text'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Teacher Schedule</span>
              </button>
            </div>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            {viewMode === 'class'
              ? 'Complete class routine with interactive time dialers, multi-class bulk generator, and PDF download.'
              : 'Inspect any teacher\'s assigned periods, timings, and class allocations across Monday to Saturday.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {viewMode === 'class' ? (
            <>
              {/* Class Selector */}
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

              {/* Bulk Copy Routine to Other Classes */}
              <button
                type="button"
                onClick={handleOpenCopyModal}
                className="px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
                title="Quickly copy this routine to other classes"
              >
                <Copy className="w-4 h-4 text-indigo-600" />
                <span>Copy to Other Classes</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="px-4 py-2.5 rounded-xl bg-surface2 hover:bg-surface2/80 text-text font-bold text-xs border border-border transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Share2 className="w-4 h-4 text-primary" />
                <span>Share</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isExportingPdf}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isExportingPdf ? 'Exporting...' : 'Export Timetable PDF'}</span>
              </button>
            </>
          ) : (
            <>
              {/* Teacher Selector for Inspector */}
              <div className="flex items-center gap-2 bg-surface2 px-3.5 py-2 rounded-xl border border-border">
                <span className="text-xs font-bold text-text-secondary uppercase">Teacher:</span>
                <select
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  className="bg-transparent text-xs font-bold text-primary focus:outline-none cursor-pointer"
                >
                  <option value="all">-- Select Teacher to Inspect --</option>
                  {teacherScheduleData.teacherList.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MODE 1: CLASS ROUTINE VIEW
          ══════════════════════════════════════════════════════════════════════ */}
      {viewMode === 'class' && (
        <>
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

          {/* Routine Cards Grid */}
          <div className="bg-white border-2 border-indigo-950/20 rounded-2xl p-6 shadow-sm text-black">
            <div className="border-b-2 border-indigo-950 pb-4 mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-black text-lg uppercase text-indigo-950">
                  {settings.instituteName || 'School Name'}
                </h2>
                <p className="text-xs text-gray-700 font-semibold mt-0.5">
                  Weekly Routine Schedule · <strong>Class {selectedClass} ({activeDay})</strong>
                </p>
              </div>
              <div className="text-right flex items-center gap-2">
                <span className="inline-block px-3.5 py-1.5 bg-indigo-50 border border-indigo-200 rounded-lg text-xs font-black text-indigo-950 uppercase tracking-wide">
                  {activeDay} Schedule ({(timetable[activeDay] || []).length} Periods)
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
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-900 text-[11px] font-bold border border-indigo-200 flex items-center gap-1 font-mono">
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

            {/* Add Period Form with Interactive Time Dialer */}
            <div className="mt-4 print:hidden">
              {isAdding ? (
                <form onSubmit={handleAddPeriod} className="p-5 bg-slate-900 text-white rounded-2xl border border-slate-700 space-y-4 shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-400" />
                      <span>Add New Period to {activeDay} (Class {selectedClass})</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* ─── TIME DIALER COMPONENT ─── */}
                  <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Period Timing Dialer:</span>
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold border border-emerald-500/30">
                        {format12h(dialerStart)} — {format12h(dialerEnd)} ({calculateDuration(dialerStart, dialerEnd)} mins)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-300 block mb-1">
                          Period Start Time:
                        </label>
                        <input
                          type="time"
                          value={dialerStart}
                          onChange={(e) => {
                            const newS = e.target.value;
                            setDialerStart(newS);
                            // Keep duration same
                            const dur = calculateDuration(dialerStart, dialerEnd);
                            setDialerEnd(addMinutesToTime(newS, dur));
                          }}
                          className="w-full px-3 py-2 bg-slate-900 rounded-lg border border-slate-600 text-white font-mono font-bold text-sm focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-300 block mb-1">
                          Period End Time:
                        </label>
                        <input
                          type="time"
                          value={dialerEnd}
                          onChange={(e) => setDialerEnd(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 rounded-lg border border-slate-600 text-white font-mono font-bold text-sm focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Quick Duration Buttons to auto-calculate end time */}
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Auto Duration:</span>
                      {[30, 40, 45, 50, 60].map(mins => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setDialerEnd(addMinutesToTime(dialerStart, mins))}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all cursor-pointer ${
                            calculateDuration(dialerStart, dialerEnd) === mins
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black'
                              : 'bg-slate-900 text-slate-300 hover:bg-slate-700 border-slate-600'
                          }`}
                        >
                          +{mins}m
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">Subject Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Science / Mathematics"
                        required
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 rounded-lg border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">Teacher / Faculty Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Ramesh Sir / Pooja Ma'am"
                        value={newTeacher}
                        onChange={(e) => setNewTeacher(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 rounded-lg border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">Room / Lab (optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. 101 / Lab 1"
                        value={newRoom}
                        onChange={(e) => setNewRoom(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 rounded-lg border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-md flex items-center gap-1.5 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save Period</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-300 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={handleOpenAdd}
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
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODE 2: TEACHER SCHEDULE INSPECTOR
          ══════════════════════════════════════════════════════════════════════ */}
      {viewMode === 'teacher' && (
        <div className="bg-white border-2 border-indigo-950/20 rounded-2xl p-6 shadow-sm text-black space-y-6">
          <div className="border-b-2 border-indigo-950 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-black text-lg text-indigo-950 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <span>Teacher Routine Inspector & Schedule Analyzer</span>
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                Check exact periods, classes, timings and workload for any faculty across the school.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-700">Select Teacher:</span>
              <select
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-surface2 border border-border text-xs font-bold text-primary focus:outline-none cursor-pointer"
              >
                <option value="all">-- All Teachers Overview --</option>
                {teacherScheduleData.teacherList.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Time Clash / Conflict Warning Banner */}
          {teacherConflicts.length > 0 && (
            <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-xl text-rose-900 space-y-1">
              <div className="flex items-center gap-2 font-black text-sm text-rose-700">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>SCHEDULE CONFLICT DETECTED FOR {selectedTeacher.toUpperCase()}!</span>
              </div>
              <p className="text-xs text-rose-800">
                This teacher is double-booked across different classes at the same time:
              </p>
              <ul className="text-xs list-disc list-inside space-y-0.5 font-semibold text-rose-900">
                {teacherConflicts.map((c, idx) => (
                  <li key={idx}>
                    {c.day} at {c.time} in {c.classes}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {selectedTeacher === 'all' ? (
            /* All Teachers Workload Summary Table */
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-800">Faculty Workload Summary:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teacherScheduleData.teacherList.map(tName => {
                  const periods = teacherScheduleData.teacherMap[tName] || [];
                  const uniqueCls = Array.from(new Set(periods.map(p => p.className)));
                  return (
                    <div
                      key={tName}
                      onClick={() => setSelectedTeacher(tName)}
                      className="p-4 rounded-xl border border-gray-200 hover:border-indigo-400 bg-gray-50/50 hover:bg-indigo-50/30 transition-all cursor-pointer shadow-2xs group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-black text-sm text-indigo-950 group-hover:text-indigo-600 flex items-center gap-1.5">
                          <User className="w-4 h-4 text-indigo-500" />
                          <span>{tName}</span>
                        </h4>
                        <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[11px] font-black">
                          {periods.length} Periods/wk
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>Classes: <strong className="text-gray-900">{uniqueCls.join(', ') || 'None'}</strong></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Selected Teacher Detailed Weekly Breakdown */
            <div className="space-y-5">
              <div className="flex items-center justify-between bg-indigo-50 p-4 rounded-xl border border-indigo-200">
                <div>
                  <h3 className="font-black text-base text-indigo-950 flex items-center gap-2">
                    <span>{selectedTeacher}</span>
                    <span className="text-xs font-bold text-indigo-700 bg-white px-2.5 py-0.5 rounded-full border border-indigo-200">
                      {(teacherScheduleData.teacherMap[selectedTeacher] || []).length} Total Weekly Periods
                    </span>
                  </h3>
                  <p className="text-xs text-indigo-700 mt-0.5">
                    Classes Taught: {Array.from(new Set((teacherScheduleData.teacherMap[selectedTeacher] || []).map(p => `Class ${p.className}`))).join(', ')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTeacher('all')}
                  className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                >
                  ← Back to All Teachers
                </button>
              </div>

              {/* Day-by-day periods for selected teacher */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {days.map(day => {
                  const allTeacherPeriods = (teacherScheduleData.teacherMap[selectedTeacher] || []);
                  const dayPeriods = allTeacherPeriods
                    .filter(p => p.day === day)
                    .sort((a, b) => a.period - b.period);

                  return (
                    <div key={day} className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-2xs">
                      <div className="px-4 py-2 bg-indigo-950 text-white flex items-center justify-between text-xs font-bold">
                        <span>{day}</span>
                        <span className="bg-white/20 px-2 py-0.5 rounded text-[10px]">
                          {dayPeriods.length} Classes
                        </span>
                      </div>

                      <div className="p-3 space-y-2 min-h-[120px]">
                        {dayPeriods.length === 0 ? (
                          <div className="text-center py-6 text-xs text-gray-400 font-medium">
                            Free Day (No periods scheduled)
                          </div>
                        ) : (
                          dayPeriods.map((p, idx) => (
                            <div key={idx} className="p-2.5 rounded-lg bg-gray-50 border border-gray-200 text-xs space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-black text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded text-[11px]">
                                  Period {p.period} · Class {p.className}
                                </span>
                                <span className="font-mono text-[10px] text-gray-600 font-bold">
                                  {p.time}
                                </span>
                              </div>
                              <div className="font-bold text-gray-900 text-sm">
                                {p.subject}
                              </div>
                              <div className="text-[11px] text-gray-500">
                                Room {p.room || '101'}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          BULK COPY TO OTHER CLASSES MODAL
          ══════════════════════════════════════════════════════════════════════ */}
      {isCopyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-5 animate-in fade-in zoom-in-95 text-black">
            <div className="flex items-center justify-between border-b pb-3 border-gray-200">
              <div className="flex items-center gap-2 text-indigo-950">
                <Copy className="w-5 h-5 text-indigo-600" />
                <h3 className="font-black text-base">Replicate Timetable to Other Classes</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCopyModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-gray-600">
              Replicate routine template from <strong>Class {selectedClass}</strong> to other classes in one click.
            </div>

            {/* Scope selection */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
              <span className="text-xs font-bold text-gray-800 block">Copy Scope:</span>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="copyScope"
                    checked={copyScope === 'all_days'}
                    onChange={() => setCopyScope('all_days')}
                    className="accent-indigo-600"
                  />
                  <span>Entire Week (Monday to Saturday)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="copyScope"
                    checked={copyScope === 'current_day'}
                    onChange={() => setCopyScope('current_day')}
                    className="accent-indigo-600"
                  />
                  <span>{activeDay} Only</span>
                </label>
              </div>
            </div>

            {/* Target Classes Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800">Select Target Classes:</span>
                <button
                  type="button"
                  onClick={handleToggleAllClasses}
                  className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                >
                  {targetClasses.length === schoolClasses.filter(c => c !== selectedClass).length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-xl bg-gray-50">
                {schoolClasses.filter(c => c !== selectedClass).map(cls => {
                  const isChecked = targetClasses.includes(cls);
                  return (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => handleToggleTargetClass(cls)}
                      className={`p-2 rounded-lg text-xs font-bold flex items-center justify-between border transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400'
                      }`}
                    >
                      <span>Class {cls}</span>
                      {isChecked ? <Check className="w-3.5 h-3.5" /> : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setIsCopyModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyBulkCopy}
                disabled={targetClasses.length === 0}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Apply to {targetClasses.length} Classes</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
