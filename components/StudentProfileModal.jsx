'use client';

import React, { useState } from 'react';
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
  Monitor,
  Award,
  Contact,
  MessageSquare,
  Edit,
  Trash2,
  Printer,
  Plus,
  Receipt,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { openWhatsAppFeeReminder } from '../lib/exportUtils';
import { QRCodeSVG } from 'qrcode.react';

export default function StudentProfileModal({ student, onClose }) {
  const {
    settings,
    payments,
    attendance,
    results,
    setCollectFeeStudent,
    setEditingStudent,
    setPrintReceiptData,
    setPrintIdCardsData,
    deleteStudent
  } = useSchoolStore();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'fees' | 'attendance' | 'results' | 'idcard'

  if (!student) return null;

  const studentPayments = payments.filter(p => p.studentId === student.id);
  const studentResults = results.filter(r => r.studentId === student.id);

  // Attendance stats for this student
  let totalMarked = 0;
  let presentDays = 0;
  let absentDays = 0;
  let leaveDays = 0;
  const attendanceHistory = [];

  Object.entries(attendance).forEach(([dateStr, dayRecords]) => {
    const status = dayRecords[student.id];
    if (status) {
      totalMarked++;
      if (status === 'present') presentDays++;
      if (status === 'absent') absentDays++;
      if (status === 'leave') leaveDays++;
      attendanceHistory.push({ date: dateStr, status });
    }
  });

  attendanceHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

  const attendancePercent = totalMarked > 0 ? Math.round((presentDays / totalMarked) * 100) : 100;
  const pendingFees = Math.max(0, (student.totalFees || 0) - (student.paidFees || 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-card border border-border rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header Hero */}
        <div className="relative bg-gradient-to-r from-primary via-indigo-900 to-indigo-950 p-6 text-white flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="w-20 h-20 rounded-2xl bg-white/10 border-2 border-white/20 overflow-hidden flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 shadow-lg">
              {student.photoPath || student.photoUrl ? (
                <img
                  src={student.photoPath || student.photoUrl}
                  alt={student.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                student.name?.charAt(0) || 'S'
              )}
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h3 className="text-xl lg:text-2xl font-black text-white">{student.name}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-slate-950">
                  {student.studentType === 'school' ? 'School' : 'Computer Institute'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {student.status || 'Active'}
                </span>
              </div>

              <p className="text-xs text-indigo-200">
                {student.studentType === 'school' 
                  ? `Class ${student.className || ''}${student.section ? ` - ${student.section}` : ''} • Roll No: ${student.rollNumber || 'N/A'}`
                  : `${student.course || ''} • Batch: ${student.batch || 'General'}`}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-indigo-200/80 pt-1">
                <span>Student ID: <strong className="text-white">{student.studentId}</strong></span>
                <span>Admission No: <strong className="text-white">{student.admissionNumber}</strong></span>
                <span>Mobile: <strong className="text-white">{student.mobile}</strong></span>
              </div>
            </div>

            {/* Top Quick Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => openWhatsAppFeeReminder(student, settings)}
                className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-md transition-all cursor-pointer"
                title="Send WhatsApp Message"
              >
                <MessageSquare className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setEditingStudent(student);
                  onClose();
                }}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                title="Edit Student"
              >
                <Edit className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  deleteStudent(student.id);
                  onClose();
                }}
                className="p-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white transition-all cursor-pointer"
                title="Delete Student"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-6 border-t border-white/10 pt-3 overflow-x-auto custom-scrollbar">
            {[
              { id: 'overview', label: 'Overview', icon: User },
              { id: 'fees', label: `Fees (₹${pendingFees} Due)`, icon: CreditCard },
              { id: 'attendance', label: `Attendance (${attendancePercent}%)`, icon: Calendar },
              { id: 'results', label: `Exam Results (${studentResults.length})`, icon: Award },
              { id: 'idcard', label: 'ID Card', icon: Contact },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    isActive 
                      ? 'bg-white text-slate-900 shadow-md' 
                      : 'text-indigo-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Financial Snapshot */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-surface2/50 border border-border">
                  <span className="text-[10px] font-bold text-text-secondary uppercase">Total Fees</span>
                  <div className="text-lg font-black text-text mt-1">₹{(student.totalFees || 0).toLocaleString('en-IN')}</div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase">Paid Fees</span>
                  <div className="text-lg font-black text-emerald-600 mt-1">₹{(student.paidFees || 0).toLocaleString('en-IN')}</div>
                </div>

                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <span className="text-[10px] font-bold text-rose-600 uppercase">Pending Balance</span>
                  <div className="text-lg font-black text-rose-600 mt-1">₹{pendingFees.toLocaleString('en-IN')}</div>
                </div>
              </div>

              {/* Personal & Academic Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-surface2/40 border border-border space-y-3">
                  <h4 className="text-xs font-bold text-text uppercase tracking-wider">Personal Particulars</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-text-secondary">Father's Name</span>
                      <span className="font-semibold text-text">{student.fatherName || '—'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-text-secondary">Mother's Name</span>
                      <span className="font-semibold text-text">{student.motherName || '—'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-text-secondary">Date of Birth</span>
                      <span className="font-semibold text-text">{student.dob || '—'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-text-secondary">Gender</span>
                      <span className="font-semibold text-text">{student.gender || '—'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-text-secondary">Address</span>
                      <span className="font-semibold text-text text-right max-w-xs">{student.address || '—'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-surface2/40 border border-border space-y-3">
                  <h4 className="text-xs font-bold text-text uppercase tracking-wider">Academic Particulars</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-text-secondary">Enrollment Type</span>
                      <span className="font-semibold text-text capitalize">{student.studentType}</span>
                    </div>
                    {student.studentType === 'school' ? (
                      <>
                        <div className="flex justify-between py-1 border-b border-border/50">
                          <span className="text-text-secondary">Class & Section</span>
                          <span className="font-semibold text-text">Class {student.className} ({student.section || 'A'})</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-border/50">
                          <span className="text-text-secondary">Roll Number</span>
                          <span className="font-semibold text-text">{student.rollNumber || '—'}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between py-1 border-b border-border/50">
                          <span className="text-text-secondary">Course Name</span>
                          <span className="font-semibold text-text">{student.course}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-border/50">
                          <span className="text-text-secondary">Batch Schedule</span>
                          <span className="font-semibold text-text">{student.batch || '—'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-border/50">
                          <span className="text-text-secondary">Duration</span>
                          <span className="font-semibold text-text">{student.courseDurationMonths || 6} Months</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-text-secondary">Academic Session</span>
                      <span className="font-semibold text-text">{student.session || '2026-27'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-text-secondary">Admission Date</span>
                      <span className="font-semibold text-text">{student.admissionDate || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FEES */}
          {activeTab === 'fees' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-text uppercase tracking-wider">Payment History</h4>
                  <p className="text-[11px] text-text-secondary">Receipts and transactions for this student</p>
                </div>
                <button
                  onClick={() => setCollectFeeStudent(student)}
                  className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Collect Payment</span>
                </button>
              </div>

              {studentPayments.length === 0 ? (
                <div className="p-8 text-center bg-surface2/30 rounded-xl border border-dashed border-border text-text-muted text-xs">
                  No payment transactions recorded yet.
                </div>
              ) : (
                <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
                  {studentPayments.map(pay => (
                    <div key={pay.id} className="p-3.5 flex items-center justify-between hover:bg-surface2/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                          <Receipt className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-text">{pay.receiptNumber}</div>
                          <div className="text-[11px] text-text-secondary">
                            {pay.feeMonth || 'Fee Payment'} • {pay.paymentMode} • {new Date(pay.paymentDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-black text-sm text-emerald-600">
                          ₹{pay.amount.toLocaleString('en-IN')}
                        </span>
                        <button
                          onClick={() => setPrintReceiptData({ payment: pay, student, settings })}
                          className="p-1.5 rounded-lg bg-surface2 hover:bg-surface2/80 text-text-secondary hover:text-text cursor-pointer"
                          title="Print Receipt"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-3 rounded-xl bg-surface2/60 border border-border">
                  <div className="text-base font-black text-text">{totalMarked}</div>
                  <div className="text-[10px] text-text-secondary font-bold uppercase">Total Days</div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="text-base font-black text-emerald-600">{presentDays}</div>
                  <div className="text-[10px] text-emerald-600 font-bold uppercase">Present</div>
                </div>
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <div className="text-base font-black text-rose-600">{absentDays}</div>
                  <div className="text-[10px] text-rose-600 font-bold uppercase">Absent</div>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div className="text-base font-black text-amber-600">{leaveDays}</div>
                  <div className="text-[10px] text-amber-600 font-bold uppercase">Leave</div>
                </div>
              </div>

              <div className="border border-border rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 bg-surface2/60 text-xs font-bold text-text uppercase">
                  Recent Attendance Logs
                </div>
                <div className="divide-y divide-border max-h-60 overflow-y-auto">
                  {attendanceHistory.length === 0 ? (
                    <div className="p-6 text-center text-text-muted text-xs">No attendance marked yet.</div>
                  ) : (
                    attendanceHistory.map((item, idx) => (
                      <div key={idx} className="px-4 py-2.5 flex items-center justify-between text-xs">
                        <span className="font-semibold text-text">{item.date}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          item.status === 'present' 
                            ? 'bg-emerald-500/15 text-emerald-600' 
                            : item.status === 'absent' 
                            ? 'bg-rose-500/15 text-rose-600' 
                            : 'bg-amber-500/15 text-amber-600'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: RESULTS */}
          {activeTab === 'results' && (
            <div className="space-y-4">
              {studentResults.length === 0 ? (
                <div className="p-8 text-center bg-surface2/30 rounded-xl border border-dashed border-border text-text-muted text-xs">
                  No exam results registered for this student yet. Go to Exam Results tab to create one.
                </div>
              ) : (
                studentResults.map(res => {
                  const total = res.subjects.reduce((sum, s) => sum + Number(s.totalMarks), 0);
                  const obt = res.subjects.reduce((sum, s) => sum + Number(s.marks), 0);
                  const pct = total > 0 ? Math.round((obt / total) * 100) : 0;
                  return (
                    <div key={res.id} className="p-4 rounded-xl bg-surface2/40 border border-border space-y-3">
                      <div className="flex items-center justify-between border-b border-border pb-2">
                        <div>
                          <h5 className="font-bold text-xs text-text">{res.examName}</h5>
                          <span className="text-[10px] text-text-secondary">{new Date(res.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-primary">{pct}%</span>
                          <div className="text-[10px] font-bold text-emerald-600">Passed</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {res.subjects.map((sub, i) => (
                          <div key={i} className="p-2 rounded-lg bg-card border border-border text-xs flex justify-between">
                            <span className="text-text-secondary truncate">{sub.subjectName}</span>
                            <span className="font-bold text-text">{sub.marks}/{sub.totalMarks}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 5: ID CARD */}
          {activeTab === 'idcard' && (
            <div className="flex flex-col items-center justify-center p-6 space-y-4">
              {/* Card Preview */}
              <div className="w-80 rounded-2xl bg-gradient-to-br from-indigo-900 via-primary to-indigo-950 text-white p-4 shadow-xl border border-white/20 relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/20 pb-2 mb-3">
                  <div>
                    <h5 className="font-black text-[11px] uppercase tracking-wider text-amber-300 truncate max-w-[180px]">
                      {settings.instituteName}
                    </h5>
                    <span className="text-[9px] text-indigo-200">STUDENT IDENTITY CARD</span>
                  </div>
                  <span className="text-[9px] font-mono bg-white/20 px-1.5 py-0.5 rounded text-white">
                    {student.session || '2026-27'}
                  </span>
                </div>

                <div className="flex gap-3 items-center">
                  <div className="w-16 h-20 rounded-xl bg-white/20 border border-white/30 overflow-hidden flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                    {student.photoPath ? (
                      <img src={student.photoPath} alt={student.name} className="w-full h-full object-cover" />
                    ) : (
                      student.name?.charAt(0) || 'S'
                    )}
                  </div>

                  <div className="text-[10px] space-y-0.5 min-w-0 flex-1">
                    <div className="font-extrabold text-xs text-white truncate">{student.name}</div>
                    <div className="text-amber-200 truncate">
                      {student.studentType === 'school' ? `Class ${student.className}` : student.course}
                    </div>
                    <div className="text-indigo-200">ID: {student.studentId}</div>
                    <div className="text-indigo-200">Adm: {student.admissionNumber}</div>
                    <div className="text-indigo-200">Mob: {student.mobile}</div>
                  </div>

                  <div className="p-1 bg-white rounded-lg flex-shrink-0 shadow-xs">
                    <QRCodeSVG value={`STUDENT:${student.studentId}|NAME:${student.name}|ADM:${student.admissionNumber}`} size={46} />
                  </div>
                </div>
              </div>

              <button
                onClick={() => setPrintIdCardsData({ students: [student], settings })}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official ID Card</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
