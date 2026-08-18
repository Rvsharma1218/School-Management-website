'use client';

import React, { useState, useEffect } from 'react';
import { useSchoolStore } from '../lib/store';
import {
  CalendarCheck, CheckCircle2, XCircle, Clock, MessageSquare,
  FileSpreadsheet, Users, GraduationCap, Monitor, ChevronLeft,
  ChevronRight, Filter, Check, X, AlertTriangle, Share2, Printer, ArrowRight, Search, Download, FileText, Calendar
} from 'lucide-react';
import {
  exportAttendanceToExcel,
  openWhatsAppAttendanceAlert,
  exportTodayAttendancePDF,
  exportDateRangeAttendancePDF,
  exportStudentAttendancePDF
} from '../lib/exportUtils';

export default function AttendanceView() {
  const {
    students,
    attendance,
    settings,
    currentUser,
    markStudentAttendance,
    bulkMarkAttendance,
    showToast
  } = useSchoolStore();

  const isPrincipal = currentUser?.role === 'principal';
  const assignedClass = currentUser?.assignedClass || '10th';

  const [activeTab, setActiveTab] = useState('daily'); // default directly to daily register for teacher ease
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedType, setSelectedType] = useState('all'); // 'all' | 'school' | 'computer'
  const [selectedClass, setSelectedClass] = useState(isPrincipal ? 'all' : assignedClass);
  const [searchQuery, setSearchQuery] = useState('');

  // Reset to assigned class on view mount or role change
  useEffect(() => {
    if (!isPrincipal && assignedClass) {
      setSelectedClass(assignedClass);
    }
  }, [assignedClass, isPrincipal]);

  // Date Range state for Range PDF Export
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);

  // Daily records for selected date
  const dayAttendance = attendance[selectedDate] || {};

  // Filter students
  const filteredStudents = students.filter(s => {
    if (selectedType === 'school' && s.studentType !== 'school') return false;
    if (selectedType === 'computer' && s.studentType !== 'computer') return false;
    if (selectedClass !== 'all') {
      if (s.studentType === 'school' && s.className !== selectedClass) return false;
      if (s.studentType === 'computer' && s.course !== selectedClass) return false;
    }
    if (searchQuery.trim()) {
      return s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
             s.studentId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
             s.admissionNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  // Calculate daily stats
  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let unmarkedCount = 0;

  filteredStudents.forEach(s => {
    const st = dayAttendance[s.id];
    if (st === 'present') presentCount++;
    else if (st === 'absent') absentCount++;
    else if (st === 'leave' || st === 'late') lateCount++;
    else unmarkedCount++;
  });

  const rate = filteredStudents.length > 0 ? Math.round((presentCount / filteredStudents.length) * 100) : 0;

  // Calculate overall institutional attendance rate across all recorded days (for active students only)
  const activeStudentIdSet = new Set(students.map(s => s.id));
  let totalAllLogs = 0;
  let totalAllPresents = 0;

  if (students.length > 0) {
    Object.values(attendance).forEach(dayMap => {
      Object.entries(dayMap).forEach(([stuId, status]) => {
        if (activeStudentIdSet.has(stuId)) {
          totalAllLogs++;
          if (status === 'present') totalAllPresents++;
        }
      });
    });
  }

  const overallRate = totalAllLogs > 0 ? Math.round((totalAllPresents / totalAllLogs) * 100) : 0;

  // Dynamic Trend of logged dates (sorted)
  const loggedDates = Object.keys(attendance).sort().slice(-10);
  const trendData = loggedDates.map(d => {
    const dayObj = attendance[d] || {};
    let total = 0;
    let presents = 0;
    Object.entries(dayObj).forEach(([stuId, status]) => {
      if (activeStudentIdSet.has(stuId)) {
        total++;
        if (status === 'present') presents++;
      }
    });
    const pct = total > 0 ? Math.round((presents / total) * 100) : 0;
    return { date: d, pct, total, presents };
  }).filter(t => t.total > 0);

  // Calculate per-student attendance rate for alerts (<75%)
  const studentAlerts = students.map(s => {
    let studentLogs = 0;
    let studentPresents = 0;
    Object.values(attendance).forEach(dayMap => {
      if (dayMap[s.id]) {
        studentLogs++;
        if (dayMap[s.id] === 'present') studentPresents++;
      }
    });
    const sRate = studentLogs > 0 ? Math.round((studentPresents / studentLogs) * 100) : 100;
    return { ...s, attendanceRate: sRate, totalDays: studentLogs };
  }).filter(s => s.totalDays > 0 && s.attendanceRate < 75);

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleSubmitAttendance = () => {
    showToast(`Attendance for ${selectedDate} saved! Total: ${filteredStudents.length} · Present: ${presentCount} · Absent: ${absentCount}`, 'success');
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Top Tabs */}
      <div className="flex items-center justify-between gap-4 border-b border-border pb-1">
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'bg-primary text-white shadow-xs'
                : 'text-text-secondary hover:text-text hover:bg-surface2'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Attendance Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('daily')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'daily'
                ? 'bg-primary text-white shadow-xs'
                : 'text-text-secondary hover:text-text hover:bg-surface2'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Mark Daily Attendance</span>
          </button>
        </div>

        {/* Global Export Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDateRangeOpen(!isDateRangeOpen)}
            className="px-3.5 py-2 rounded-xl bg-white border border-border hover:bg-surface2 text-text font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Download Date Range Attendance PDF"
          >
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">Date Range PDF</span>
          </button>

          <button
            onClick={() => exportTodayAttendancePDF(filteredStudents, attendance, selectedDate, settings)}
            className="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
            title="Download Today's Attendance Register as PDF"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Today's Register PDF</span>
          </button>
        </div>
      </div>

      {/* Date Range Selector Box */}
      {isDateRangeOpen && (
        <div className="p-4 bg-white border border-border rounded-2xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-primary" />
            <div>
              <h4 className="text-xs font-bold text-text">Export Date Range Attendance Sheet</h4>
              <p className="text-[11px] text-text-muted">Select span to download complete matrix attendance register PDF.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-text-secondary">From:</span>
              <input
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-surface2 border border-border text-xs font-bold text-text"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-text-secondary">To:</span>
              <input
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-surface2 border border-border text-xs font-bold text-text"
              />
            </div>
            <button
              onClick={() => {
                exportDateRangeAttendancePDF(filteredStudents, attendance, fromDate, toDate, settings);
                setIsDateRangeOpen(false);
              }}
              className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      )}

      {activeTab === 'overview' ? (
        /* ─── OVERVIEW DASHBOARD VIEW ─── */
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl lg:text-2xl font-bold text-text tracking-tight">Attendance Overview</h2>
              <p className="text-xs text-text-secondary mt-0.5">Real-time attendance metrics for the current academic session.</p>
            </div>
            <button
              onClick={() => exportTodayAttendancePDF(filteredStudents, attendance, selectedDate, settings)}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Generate Attendance Report (PDF)</span>
            </button>
          </div>

          {/* Stats Cards Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="bg-white border border-border rounded-2xl p-5 shadow-xs">
              <div className="text-text-secondary font-bold uppercase text-[9px] tracking-wider">Overall Attendance</div>
              <div className="text-2xl font-black text-primary mt-1.5">{overallRate}%</div>
              <p className="text-[10px] text-text-muted font-medium mt-1">{totalAllLogs} total attendance logs</p>
            </div>

            <div className="bg-white border border-border rounded-2xl p-5 shadow-xs">
              <div className="text-text-secondary font-bold uppercase text-[9px] tracking-wider">Present Today</div>
              <div className="text-2xl font-black text-text mt-1.5">{presentCount} / {filteredStudents.length}</div>
              <p className="text-[10px] text-text-muted mt-1">{rate}% present for {selectedDate}</p>
            </div>

            <div className="bg-white border border-border rounded-2xl p-5 shadow-xs">
              <div className="text-text-secondary font-bold uppercase text-[9px] tracking-wider">Students Absent</div>
              <div className="text-2xl font-black text-rose-600 mt-1.5">{absentCount}</div>
              <p className="text-[10px] text-rose-500 font-bold mt-1">● Absent for {selectedDate}</p>
            </div>

            <div className="bg-white border border-border rounded-2xl p-5 shadow-xs">
              <div className="text-text-secondary font-bold uppercase text-[9px] tracking-wider">Leave & Late</div>
              <div className="text-2xl font-black text-amber-500 mt-1.5">{lateCount}</div>
              <p className="text-[10px] text-amber-600 font-bold mt-1">● Marked leave/late</p>
            </div>
          </div>

          {/* Chart & Alerts split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Card: 30-Day Trend Chart */}
            <div className="lg:col-span-8 bg-white border border-border rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-base text-text">Attendance Trend History</h3>
                <span className="text-[10px] text-text-muted font-mono">{trendData.length} days recorded</span>
              </div>
              
              {trendData.length === 0 ? (
                <div className="h-44 flex items-center justify-center text-text-muted text-xs border-b border-border">
                  No attendance history logged yet. Go to 'Mark Daily Attendance' to record today's register.
                </div>
              ) : (
                <div className="h-44 flex items-end justify-start gap-3 pt-4 border-b border-border overflow-x-auto pb-1 custom-scrollbar">
                  {trendData.map((day, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1.5 min-w-[40px] group">
                      <div className="text-[8px] font-mono font-bold text-text opacity-0 group-hover:opacity-100 transition-opacity">{day.pct}%</div>
                      <div
                        style={{ height: `${Math.max(8, day.pct * 1.3)}px` }}
                        className="w-7 rounded-t bg-primary group-hover:bg-primary-dark transition-all shadow-xs"
                      />
                      <span className="text-[8px] text-text-muted mt-1 font-mono whitespace-nowrap">{day.date.slice(5)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Card: Attendance Alerts */}
            <div className="lg:col-span-4 bg-white border border-border rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-base text-rose-600 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <span>Low Attendance (&lt;75%)</span>
              </h3>
              
              <div className="space-y-3 text-xs">
                {studentAlerts.length === 0 ? (
                  <div className="p-4 text-center text-text-muted text-xs">
                    🎉 No attendance alerts. All students have satisfactory attendance.
                  </div>
                ) : (
                  studentAlerts.slice(0, 4).map(s => (
                    <div key={s.id} className="p-2.5 bg-rose-50/50 border border-rose-100 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center font-bold text-[10px]">
                          {s.name?.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-text">{s.name}</div>
                          <div className="text-[9px] text-text-muted">{s.studentType === 'school' ? `Class ${s.className}` : s.course}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className="text-rose-600 font-mono">{s.attendanceRate}%</span>
                        <button
                          onClick={() => openWhatsAppAttendanceAlert(s, 'absent', selectedDate, settings)}
                          className="p-1 rounded bg-white border border-rose-200 text-rose-500 hover:bg-rose-50 cursor-pointer shadow-2xs"
                          title="Send WhatsApp Low Attendance Warning"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ─── DAILY ATTENDANCE REGISTER ─── */
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Controls Bar */}
          <div className="bg-white border border-border rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                onClick={handlePrevDay}
                className="p-2 rounded-xl bg-surface2 hover:bg-border text-text transition-colors cursor-pointer"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-surface2 border border-border text-xs font-bold text-text focus:outline-none focus:border-primary"
              />
              <button
                onClick={handleNextDay}
                className="p-2 rounded-xl bg-surface2 hover:bg-border text-text transition-colors cursor-pointer"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <select
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-surface2 border border-border text-xs font-bold text-text focus:outline-none cursor-pointer"
              >
                <option value="all">All Classes</option>
                {settings.schoolClasses?.map(c => <option key={c} value={c}>Class {c}</option>)}
                {settings.computerCourses?.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              {!isPrincipal && selectedClass !== assignedClass && (
                <button
                  onClick={() => setSelectedClass(assignedClass)}
                  className="px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap"
                  title="Return to your assigned class"
                >
                  <span>↩ Back to Class {assignedClass}</span>
                </button>
              )}
            </div>

            {/* Quick Bulk Actions */}
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
              <button
                onClick={() => bulkMarkAttendance(filteredStudents.map(s => s.id), selectedDate, 'present')}
                className="px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark All Present</span>
              </button>
              <button
                onClick={() => bulkMarkAttendance(filteredStudents.map(s => s.id), selectedDate, 'absent')}
                className="px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap"
              >
                <X className="w-3.5 h-3.5" />
                <span>Mark All Absent</span>
              </button>
              <button
                onClick={handleSubmitAttendance}
                className="px-4 py-1.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs cursor-pointer transition-all shadow-xs whitespace-nowrap"
              >
                Save Register
              </button>
            </div>
          </div>

          {/* Student attendance table */}
          <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface2/60 border-b border-border text-text-secondary font-bold text-[10px] uppercase">
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4">Roll No.</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-text font-medium">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-text-muted text-xs">
                        No students enrolled yet. Add students to take attendance.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map(s => {
                      const st = dayAttendance[s.id] || 'unmarked';
                      return (
                        <tr key={s.id} className="hover:bg-surface2/30 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-text">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                {s.name?.charAt(0)}
                              </div>
                              <div>
                                <div>{s.name}</div>
                                <div className="text-[9px] text-text-muted">ID: {s.studentId} · Adm: {s.admissionNumber || s.studentId}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-text-secondary">{s.studentType === 'school' ? `Class ${s.className}` : s.course}</td>
                          <td className="py-3.5 px-4 font-mono">{s.rollNumber || '-'}</td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex items-center gap-1.5 p-1 bg-surface2 rounded-xl border border-border">
                              <button
                                onClick={() => markStudentAttendance(s.id, selectedDate, 'present')}
                                className={`px-2.5 py-1 rounded-lg font-bold text-[10px] uppercase tracking-wider cursor-pointer transition-all ${
                                  st === 'present' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-text-secondary hover:text-text'
                                }`}
                              >
                                Present
                              </button>
                              <button
                                onClick={() => markStudentAttendance(s.id, selectedDate, 'absent')}
                                className={`px-2.5 py-1 rounded-lg font-bold text-[10px] uppercase tracking-wider cursor-pointer transition-all ${
                                  st === 'absent' ? 'bg-rose-600 text-white shadow-2xs' : 'text-text-secondary hover:text-text'
                                }`}
                              >
                                Absent
                              </button>
                              <button
                                onClick={() => markStudentAttendance(s.id, selectedDate, 'leave')}
                                className={`px-2.5 py-1 rounded-lg font-bold text-[10px] uppercase tracking-wider cursor-pointer transition-all ${
                                  st === 'leave' || st === 'late' ? 'bg-amber-500 text-white shadow-2xs' : 'text-text-secondary hover:text-text'
                                }`}
                              >
                                Leave
                              </button>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openWhatsAppAttendanceAlert(s, st, selectedDate, settings)}
                                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 cursor-pointer"
                                title="Send WhatsApp Attendance Message to Parent"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => exportStudentAttendancePDF(s, attendance, settings)}
                                className="p-1.5 rounded-lg bg-surface2 hover:bg-border text-text border border-border cursor-pointer"
                                title="Download Student Attendance PDF"
                              >
                                <Download className="w-3.5 h-3.5" />
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
      )}
    </div>
  );
}
