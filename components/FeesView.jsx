'use client';

import React, { useState } from 'react';
import { useSchoolStore, calculateStudentFeeMetrics } from '../lib/store';
import {
  CreditCard, Plus, Search, Download, Printer, MessageSquare,
  Receipt, FileSpreadsheet, AlertCircle, TrendingUp, CheckCircle2,
  Trash2, Calendar, X, BarChart3, Info, Sparkles
} from 'lucide-react';
import { exportPaymentsToExcel, exportDefaultersToExcel, openWhatsAppFeeReminder, openWhatsAppReceiptShare, exportReceiptPDF } from '../lib/exportUtils';
import CollectFeeModal from './CollectFeeModal';
import WhatsAppReminderModal from './WhatsAppReminderModal';

export default function FeesView() {
  const {
    students,
    payments,
    settings,
    stats,
    collectFeeStudent,
    setCollectFeeStudent,
    feeDetailStudent,
    setFeeDetailStudent,
    setPrintReceiptData,
    whatsAppReminderData,
    setWhatsAppReminderData,
    deletePayment
  } = useSchoolStore();

  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'ledger' | 'defaulters'
  const [searchQuery, setSearchQuery] = useState('');

  // Filter payments ledger
  const filteredPayments = payments.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const student = students.find(s => s.id === p.studentId);
    return (
      p.receiptNumber?.toLowerCase().includes(q) ||
      p.studentName?.toLowerCase().includes(q) ||
      student?.name?.toLowerCase().includes(q) ||
      p.paymentMode?.toLowerCase().includes(q) ||
      p.feeMonth?.toLowerCase().includes(q)
    );
  });

  // Filter Defaulters using live auto-accrued dues
  const defaultersList = students.map(s => ({
    ...s,
    feeMetrics: calculateStudentFeeMetrics(s, payments)
  })).filter(s => {
    if (s.feeMetrics.currentDue <= 0) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.studentId?.toLowerCase().includes(q) ||
      s.mobile?.includes(q)
    );
  });

  // Global Dynamic Fee Totals
  const totalCollected = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const totalPending = students.reduce((acc, s) => {
    const m = calculateStudentFeeMetrics(s, payments);
    return acc + (Number(m.currentDue) || 0);
  }, 0);
  const totalExpected = totalCollected + totalPending;

  // Today's Real Collections
  const todayStr = new Date().toISOString().split('T')[0];
  const todayPayments = payments.filter(p => p.paymentDate && p.paymentDate.startsWith(todayStr));
  const todayCollected = todayPayments.reduce((a, p) => a + (Number(p.amount) || 0), 0);

  // Dynamic breakdown across fee heads from actual payment particulars
  const feeHeadTotals = {
    admissionFee: 0,
    tuitionFee: 0,
    examinationFee: 0,
    previousDues: 0,
    gameFee: 0,
    reAdmissionFee: 0,
    developmentFee: 0,
    schoolId: 0,
    tieBagBelt: 0,
    backDues: 0,
    transportFee: 0,
    otherFee: 0,
    lateFine: 0
  };

  payments.forEach(p => {
    if (p.particulars) {
      Object.keys(feeHeadTotals).forEach(k => {
        if (p.particulars[k]) feeHeadTotals[k] += Number(p.particulars[k]) || 0;
      });
    } else {
      feeHeadTotals.tuitionFee += Number(p.amount) || 0;
    }
  });

  const feeHeadItems = [
    { label: 'Tuition Fee', val: feeHeadTotals.tuitionFee, color: 'bg-[#0051d5]' },
    { label: 'Admission Fee', val: feeHeadTotals.admissionFee, color: 'bg-[#1f108e]' },
    { label: 'Examination Fee', val: feeHeadTotals.examinationFee, color: 'bg-amber-500' },
    { label: 'Transport / Bus Fee', val: feeHeadTotals.transportFee, color: 'bg-blue-600' },
    { label: 'Previous Dues', val: feeHeadTotals.previousDues, color: 'bg-rose-500' },
    { label: 'Development & Lab Fee', val: feeHeadTotals.developmentFee, color: 'bg-purple-500' },
    { label: 'Game & Sports Fee', val: feeHeadTotals.gameFee, color: 'bg-teal-500' },
    { label: 'School ID, Tie & Bag', val: (feeHeadTotals.schoolId + feeHeadTotals.tieBagBelt), color: 'bg-cyan-600' },
    { label: 'Re-Admission Fee', val: feeHeadTotals.reAdmissionFee, color: 'bg-indigo-400' },
    { label: 'Late Fine', val: feeHeadTotals.lateFine, color: 'bg-orange-500' },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200 font-sans">
      {/* Top Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-1 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${activeTab === 'dashboard'
              ? 'bg-primary text-white shadow-xs'
              : 'text-text-secondary hover:text-text hover:bg-surface2'
            }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Fee Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${activeTab === 'ledger'
              ? 'bg-primary text-white shadow-xs'
              : 'text-text-secondary hover:text-text hover:bg-surface2'
            }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Transactions Register ({payments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('defaulters')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${activeTab === 'defaulters'
              ? 'bg-primary text-white shadow-xs'
              : 'text-text-secondary hover:text-text hover:bg-surface2'
            }`}
        >
          <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
          <span>Outstanding Defaulters ({defaultersList.length})</span>
        </button>
      </div>

      {activeTab === 'dashboard' ? (
        /* ─── DASHBOARD VIEW ─── */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl lg:text-2xl font-bold text-text tracking-tight">Fee Management</h2>
              <p className="text-xs text-text-secondary mt-0.5">Track collections, manage dues, and monitor fee structure allocations.</p>
            </div>

            <div className="flex items-center gap-2.5">
              {students.length > 0 && (
                <button
                  onClick={() => setFeeDetailStudent(students[0])}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Student Fee Structure & Pay</span>
                </button>
              )}
              <button
                onClick={() => exportPaymentsToExcel(payments, settings.instituteName)}
                className="px-3.5 py-2 rounded-xl bg-white border border-border hover:bg-surface2 text-text flex items-center gap-1.5 cursor-pointer text-xs font-bold"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Export Report</span>
              </button>
            </div>
          </div>

          {/* Stats metrics cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-border rounded-2xl p-5 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-text-secondary uppercase">Total Collections</div>
                <div className="text-2xl font-black text-text mt-1">₹{totalCollected.toLocaleString('en-IN')}</div>
                <p className="text-[10px] text-text-muted font-semibold mt-1">{payments.length} receipts issued</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">₹</div>
            </div>

            <div className="bg-white border border-border rounded-2xl p-5 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-text-secondary uppercase flex items-center gap-1.5">
                  <span>Pending Dues</span>
                  {totalPending > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 text-[8px] font-bold">Action Needed</span>
                  )}
                </div>
                <div className="text-2xl font-black text-rose-600 mt-1">₹{totalPending.toLocaleString('en-IN')}</div>
                <p className="text-[10px] text-text-muted mt-1">{defaultersList.length} students with pending dues</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">!</div>
            </div>

            <div className="bg-white border border-border rounded-2xl p-5 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-text-secondary uppercase">Today's Collection</div>
                <div className="text-2xl font-black text-primary mt-1">₹{todayCollected.toLocaleString('en-IN')}</div>
                <p className="text-[10px] text-text-muted mt-1">{todayPayments.length} transactions today</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">✔</div>
            </div>
          </div>

          {/* Table & Structure layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left table: Recent Transactions */}
            <div className="lg:col-span-8 bg-white border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-border bg-surface2/40 flex items-center justify-between">
                <span className="font-bold text-xs text-text uppercase">Recent Transactions ({payments.length})</span>
                {payments.length > 0 && (
                  <span className="text-[10px] font-bold text-primary cursor-pointer hover:underline" onClick={() => setActiveTab('ledger')}>View All</span>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-surface2/60 border-b border-border text-text-secondary font-bold text-[10px] uppercase">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Fee Month</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4 text-center">Mode</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-text">
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-10 text-center text-text-muted text-xs">
                          No fee payments recorded yet. Open a student's profile to record payments.
                        </td>
                      </tr>
                    ) : (
                      payments.slice(0, 5).map((p, idx) => {
                        const student = students.find(s => s.id === p.studentId);
                        return (
                          <tr
                            key={p.id ? `${p.id}_${idx}` : `pay_${idx}`}
                            onClick={() => student && setFeeDetailStudent(student)}
                            className="hover:bg-surface2/50 transition-colors cursor-pointer"
                            title="Click to view & manage student fee structure"
                          >
                            <td className="py-3 px-4 font-mono text-text-secondary">{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '-'}</td>
                            <td className="py-3 px-4 font-bold">
                              <div>
                                <div className="text-primary hover:underline">{p.studentName || student?.name}</div>
                                <div className="text-[9px] text-text-muted">ID: {student?.studentId || '-'} · {student?.admissionNumber || ''}</div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-text-secondary">{p.feeMonth || 'Monthly'}</td>
                            <td className="py-3 px-4 text-right font-black text-primary">₹{(Number(p.amount) || 0).toLocaleString('en-IN')}</td>
                            <td className="py-3 px-4 text-center"><span className="px-2 py-0.5 rounded bg-surface2 border border-border text-[9px] font-bold font-mono">{p.paymentMode || 'Cash'}</span></td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right panel: Fee Collections Distribution */}
            <div className="lg:col-span-4 space-y-5">
              <div className="bg-white border border-border rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-text">Fee Collections Distribution</h3>
                  <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">Active</span>
                </div>
                <p className="text-xs text-text-muted">Breakdown of recorded payments across institutional fee heads.</p>

                <div className="space-y-3 text-xs font-semibold text-text-secondary max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                  {totalCollected === 0 ? (
                    <div className="py-8 text-center text-text-muted text-xs">
                      No collections recorded yet.
                    </div>
                  ) : (
                    feeHeadItems.filter(f => f.val > 0).map((fee, idx) => {
                      const pct = Math.round((fee.val / totalCollected) * 100);
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between">
                            <span className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${fee.color}`} />
                              <span className="text-[11px] text-text">{fee.label}</span>
                            </span>
                            <span className="font-bold text-text text-[11px]">₹{fee.val.toLocaleString('en-IN')} ({pct}%)</span>
                          </div>
                          <div className="w-full h-1.5 bg-surface2 rounded-full overflow-hidden">
                            <div className={`h-full ${fee.color} rounded-full`} style={{ width: `${pct}%` }}></div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'ledger' ? (
        /* ─── TRANSACTIONS REGISTER ─── */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl lg:text-2xl font-bold text-text tracking-tight">Transactions Register</h2>
              <p className="text-xs text-text-secondary mt-0.5">Spreadsheet ledger of all recorded student fee receipts.</p>
            </div>
            <button
              onClick={() => exportPaymentsToExcel(filteredPayments, settings.instituteName)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Ledger (.xlsx)</span>
            </button>
          </div>

          <div className="bg-white border border-border rounded-2xl p-4 shadow-sm">
            <div className="relative">
              <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by receipt no, student name, payment mode, or month..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface2 border border-border text-xs text-text focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface2/60 border-b border-border text-text-secondary font-bold text-[10px] uppercase">
                    <th className="py-3 px-4">Receipt</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4">Fee Month</th>
                    <th className="py-3 px-4 text-right">Paid</th>
                    <th className="py-3 px-4 text-right text-rose-600">Remaining Due</th>
                    <th className="py-3 px-4 text-center">Mode</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-text font-medium">
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-text-muted text-xs">
                        No transactions found.
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((p, idx) => {
                      const student = students.find(s => s.id === p.studentId);
                      return (
                        <tr key={p.id ? `${p.id}_${idx}` : `ledger_${idx}`} className="hover:bg-surface2/30 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-primary">{p.receiptNumber}</td>
                          <td className="py-3.5 px-4 font-mono text-text-secondary">{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '-'}</td>
                          <td className="py-3.5 px-4 font-bold text-text">{p.studentName || student?.name}</td>
                          <td className="py-3.5 px-4 text-text-secondary">{student ? (student.studentType === 'school' ? `Class ${student.className}` : student.course) : '-'}</td>
                          <td className="py-3.5 px-4">{p.feeMonth}</td>
                          <td className="py-3.5 px-4 text-right font-black text-emerald-600">₹{(Number(p.amount) || 0).toLocaleString('en-IN')}</td>
                          <td className="py-3.5 px-4 text-right">
                            {(() => {
                              let rem = 0;
                              if (p.balanceDue !== undefined && p.balanceDue !== null && !isNaN(Number(p.balanceDue))) {
                                rem = Number(p.balanceDue);
                              } else if (p.remainingFees !== undefined && p.remainingFees !== null && !isNaN(Number(p.remainingFees))) {
                                rem = Number(p.remainingFees);
                              } else if (p.totalPending !== undefined && p.totalPending !== null && !isNaN(Number(p.totalPending))) {
                                rem = Number(p.totalPending);
                              } else {
                                const st = students.find(s => s.id === p.studentId || (s.studentId && s.studentId === p.studentId));
                                if (st) {
                                  const m = calculateStudentFeeMetrics(st, payments);
                                  rem = m.currentDue;
                                }
                              }
                              return (
                                <span className={`font-black font-mono text-xs ${rem > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                  ₹{rem.toLocaleString('en-IN')}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="py-3.5 px-4 text-center"><span className="px-2 py-0.5 rounded bg-surface2 border border-border text-[9px] font-bold font-mono">{p.paymentMode}</span></td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openWhatsAppReceiptShare(p, student, settings)}
                                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 cursor-pointer transition-colors"
                                title="Share Receipt Voucher on WhatsApp"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setPrintReceiptData({
                                  payment: p,
                                  student: student || { name: p.studentName, studentId: p.studentId, session: settings.currentSession },
                                  settings
                                })}
                                className="p-1.5 rounded-lg bg-surface2 hover:bg-primary/10 text-primary border border-border cursor-pointer transition-colors"
                                title="Print Receipt Slip"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => deletePayment(p.id)}
                                className="p-1.5 rounded-lg bg-surface2 hover:bg-rose-100 text-rose-600 border border-border cursor-pointer transition-colors"
                                title="Delete Transaction"
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
        /* ─── OUTSTANDING DEFAULTERS ─── */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl lg:text-2xl font-bold text-rose-600 tracking-tight">Outstanding Defaulters</h2>
              <p className="text-xs text-text-secondary mt-0.5">List of students with auto-accrued monthly dues and quick reminders.</p>
            </div>
            <div className="flex items-center gap-2">
              {defaultersList.length > 0 && (
                <button
                  onClick={() => setWhatsAppReminderData({ students: defaultersList })}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Bulk WhatsApp ({defaultersList.length})</span>
                </button>
              )}
              <button
                onClick={() => exportDefaultersToExcel(defaultersList, settings.instituteName)}
                className="px-4 py-2 rounded-xl bg-white border border-border hover:bg-surface2 text-text font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-rose-600" />
                <span>Export Defaulters</span>
              </button>
            </div>
          </div>

          <div className="bg-white border border-border rounded-2xl p-4 shadow-sm">
            <div className="relative">
              <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search defaulters by student name, roll number, or phone..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface2 border border-border text-xs text-text focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface2/60 border-b border-border text-text-secondary font-bold text-[10px] uppercase">
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4 text-center">Set Monthly Fee</th>
                    <th className="py-3 px-4 text-right">Accrued Expected</th>
                    <th className="py-3 px-4 text-right">Paid Fees</th>
                    <th className="py-3 px-4 text-right">Outstanding Dues</th>
                    <th className="py-3 px-4">Mobile</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-text font-medium">
                  {defaultersList.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-text-muted text-xs">
                        🎉 No pending fee defaulters. All active student accounts are cleared.
                      </td>
                    </tr>
                  ) : (
                    defaultersList.map(s => {
                      const m = s.feeMetrics;
                      return (
                        <tr key={s.id} className="hover:bg-surface2/30 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-text">
                            <div>{s.name}</div>
                            <div className="text-[9px] text-text-muted font-normal">ID: {s.studentId} · Adm: {s.admissionNumber || '-'}</div>
                          </td>
                          <td className="py-3.5 px-4 text-text-secondary">{s.studentType === 'school' ? `Class ${s.className}` : s.course}</td>
                          <td className="py-3.5 px-4 text-center font-semibold">₹{m.monthlyFee.toLocaleString('en-IN')}/mo</td>
                          <td className="py-3.5 px-4 text-right text-text-secondary font-mono">₹{m.accruedExpected.toLocaleString('en-IN')} ({m.elapsedMonths} mos)</td>
                          <td className="py-3.5 px-4 text-right text-emerald-600 font-bold font-mono">₹{m.totalPaid.toLocaleString('en-IN')}</td>
                          <td className="py-3.5 px-4 text-right font-black text-rose-600 font-mono text-sm">₹{m.currentDue.toLocaleString('en-IN')}</td>
                          <td className="py-3.5 px-4 font-mono text-text-secondary">{s.mobile || '-'}</td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {s.mobile && (
                                <button
                                  onClick={() => setWhatsAppReminderData({ student: s, dueAmount: m.currentDue })}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[11px] flex items-center gap-1 border border-emerald-200 cursor-pointer"
                                  title="Send WhatsApp Fee Due Reminder (Hindi / English)"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                  <span>WhatsApp</span>
                                </button>
                              )}
                              <button
                                onClick={() => setFeeDetailStudent(s)}
                                className="px-2.5 py-1 rounded-lg bg-primary text-white hover:bg-primary-dark font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-2xs"
                              >
                                <CreditCard className="w-3 h-3" />
                                <span>Fee Structure</span>
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

      {/* WhatsApp Reminder Modal (Hindi & English) */}
      <WhatsAppReminderModal
        isOpen={!!whatsAppReminderData}
        onClose={() => setWhatsAppReminderData(null)}
        {...(whatsAppReminderData || {})}
      />
    </div>
  );
}
