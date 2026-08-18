'use client';

import React, { useState, useEffect } from 'react';
import { useSchoolStore } from '../lib/store';
import {
  Search,
  X,
  User,
  CreditCard,
  CalendarCheck,
  Award,
  Contact,
  GraduationCap,
  Monitor,
  ArrowRight
} from 'lucide-react';

export default function GlobalSearchModal({ isOpen, onClose }) {
  const {
    students,
    payments,
    setActiveView,
    setSelectedStudentId,
    setIsAddStudentOpen,
    setCollectFeeStudent
  } = useSchoolStore();

  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  const matchedStudents = q
    ? students.filter(s =>
        s.name?.toLowerCase().includes(q) ||
        s.studentId?.toLowerCase().includes(q) ||
        s.admissionNumber?.toLowerCase().includes(q) ||
        s.rollNumber?.toLowerCase().includes(q) ||
        s.mobile?.includes(q) ||
        s.fatherName?.toLowerCase().includes(q) ||
        s.className?.toLowerCase().includes(q) ||
        s.course?.toLowerCase().includes(q)
      ).slice(0, 6)
    : [];

  const matchedPayments = q
    ? payments.filter(p =>
        p.receiptNumber?.toLowerCase().includes(q) ||
        p.studentName?.toLowerCase().includes(q) ||
        p.paymentMode?.toLowerCase().includes(q)
      ).slice(0, 4)
    : [];

  const quickNav = [
    { label: 'Add New Student Admission', icon: User, action: () => setIsAddStudentOpen(true) },
    { label: 'Open Daily Attendance Register', icon: CalendarCheck, action: () => setActiveView('attendance') },
    { label: 'Collect Fee Payment', icon: CreditCard, action: () => setActiveView('fees') },
    { label: 'Print ID Cards', icon: Contact, action: () => setActiveView('idcards') },
    { label: 'Examinations & Marksheets', icon: Award, action: () => setActiveView('results') },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 bg-black/60 backdrop-blur-xs">
      <div className="bg-card border border-border rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-border flex items-center gap-3 bg-surface2/40">
          <Search className="w-5 h-5 text-text-muted" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type student name, roll number, student ID, or receipt..."
            className="flex-1 bg-transparent text-sm text-text placeholder-text-muted focus:outline-none"
          />
          <button onClick={onClose} className="p-1 text-text-muted hover:text-text cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4 custom-scrollbar text-xs">
          {/* Matched Students */}
          {matchedStudents.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">
                Students ({matchedStudents.length})
              </div>
              <div className="space-y-1">
                {matchedStudents.map(s => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedStudentId(s.id);
                      setActiveView('students');
                      onClose();
                    }}
                    className="w-full p-2.5 rounded-xl hover:bg-surface2 flex items-center justify-between transition-colors text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        {s.name?.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-text group-hover:text-primary transition-colors">
                          {s.name}
                        </div>
                        <div className="text-[10px] text-text-secondary">
                          {s.studentType === 'school' ? `Class ${s.className || ''}` : s.course} • ID: {s.studentId}
                        </div>
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matched Payments */}
          {matchedPayments.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">
                Payments ({matchedPayments.length})
              </div>
              <div className="space-y-1">
                {matchedPayments.map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setActiveView('fees');
                      onClose();
                    }}
                    className="w-full p-2.5 rounded-xl hover:bg-surface2 flex items-center justify-between transition-colors text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs">
                        ₹
                      </div>
                      <div>
                        <div className="font-bold text-text">{p.receiptNumber} — ₹{p.amount}</div>
                        <div className="text-[10px] text-text-secondary">
                          {p.studentName} • {p.paymentMode} • {new Date(p.paymentDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No results message */}
          {query.trim() && matchedStudents.length === 0 && matchedPayments.length === 0 && (
            <div className="py-8 text-center text-text-muted">
              No matching students or receipts found for "{query}".
            </div>
          )}

          {/* Default Quick Actions when query is empty */}
          {!query.trim() && (
            <div>
              <div className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">
                Quick Shortcuts
              </div>
              <div className="space-y-1">
                {quickNav.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        item.action();
                        onClose();
                      }}
                      className="w-full p-2.5 rounded-xl hover:bg-surface2 flex items-center justify-between text-text transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-primary" />
                        <span className="font-semibold text-xs">{item.label}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-text-muted group-hover:text-primary transition-colors" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border bg-surface2/50 flex items-center justify-between text-[11px] text-text-muted">
          <span>Navigate with mouse or keyboard</span>
          <kbd className="px-1.5 py-0.5 rounded bg-card border border-border font-mono text-[10px]">ESC</kbd>
        </div>
      </div>
    </div>
  );
}
