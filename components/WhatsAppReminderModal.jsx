'use client';

import React, { useState, useEffect } from 'react';
import { useSchoolStore } from '../lib/store';
import {
  MessageSquare, X, Send, Copy, Check, Globe,
  Phone, AlertCircle, Sparkles, CheckCircle2, ChevronRight
} from 'lucide-react';

export default function WhatsAppReminderModal({ isOpen, onClose, student, students = [], dueAmount = null }) {
  const { settings, showToast } = useSchoolStore();
  const [language, setLanguage] = useState('hi'); // 'hi' | 'en'
  const [customMessage, setCustomMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);

  // If a list of students is passed (bulk mode) or single student
  const studentList = students.length > 0 ? students : (student ? [student] : []);
  const activeStudent = studentList[currentIdx] || student;

  const instituteName = settings?.instituteName || settings?.schoolName || 'Smart School';
  const institutePhone = settings?.phone || settings?.mobile || '';

  // Generate Message Template
  const generateMessage = (stu, lang) => {
    if (!stu) return '';
    const pendingDue = dueAmount !== null ? dueAmount : (stu.feeMetrics?.currentDue ?? stu.remainingFees ?? Math.max(0, (stu.totalFees || 0) - (stu.paidFees || 0)));
    const totalFee = stu.totalFees || stu.feeMetrics?.setTotalFees || 0;
    const paidFee = stu.paidFees || stu.feeMetrics?.totalPaid || 0;
    const className = stu.studentType === 'school' ? `Class ${stu.className || ''} ${stu.section ? `(${stu.section})` : ''}` : (stu.course || 'Student');
    const dueDateStr = stu.dueDate ? (stu.dueDate.includes('T') ? stu.dueDate.split('T')[0] : stu.dueDate) : '';

    if (lang === 'hi') {
      return `नमस्ते! *${instituteName}* से सादर अभिवादन।

प्रिय अभिभावक, यह संदेश *${stu.name}* (${className}) की बकाया स्कूल फीस के संबंध में है:

💰 *कुल फीस:* ₹${Number(totalFee).toLocaleString('en-IN')}
✅ *जमा फीस:* ₹${Number(paidFee).toLocaleString('en-IN')}
⚠️ *बकाया राशि (Due):* ₹${Number(pendingDue).toLocaleString('en-IN')}${dueDateStr ? `\n📅 *अंतिम तिथि:* ${dueDateStr}` : ''}

कृपया अंतिम तिथि से पहले बकाया फीस विद्यालय कार्यालय में जमा कराने का कष्ट करें।

📞 सहायता / संपर्क: ${institutePhone}
धन्यवाद,
*${instituteName}*`;
    } else {
      return `Dear Parent / Guardian,

Greetings from *${instituteName}*!

This is a gentle reminder regarding the pending fee balance for *${stu.name}* (${className}):

💰 *Total Fee:* ₹${Number(totalFee).toLocaleString('en-IN')}
✅ *Fee Paid:* ₹${Number(paidFee).toLocaleString('en-IN')}
⚠️ *Outstanding Due:* ₹${Number(pendingDue).toLocaleString('en-IN')}${dueDateStr ? `\n📅 *Due Date:* ${dueDateStr}` : ''}

Kindly clear the pending dues at the earliest to ensure uninterrupted academic records.

📞 Helpline / Contact: ${institutePhone}
Thank you,
*${instituteName}*`;
    }
  };

  // Sync template on student or language change
  useEffect(() => {
    if (activeStudent) {
      setCustomMessage(generateMessage(activeStudent, language));
    }
  }, [activeStudent, language]);

  if (!isOpen || !activeStudent) return null;

  const mobile = activeStudent.alternateMobile || activeStudent.mobile || '';
  const cleanMobile = mobile.replace(/[^0-9]/g, '');
  const finalMobile = cleanMobile.length === 10 ? `91${cleanMobile}` : cleanMobile;

  const handleSendWhatsApp = () => {
    if (!cleanMobile) {
      showToast?.('No valid mobile number found for this student!', 'error');
      return;
    }
    const url = `https://api.whatsapp.com/send?phone=${finalMobile}&text=${encodeURIComponent(customMessage)}`;
    window.open(url, '_blank');
    showToast?.(`WhatsApp reminder opened for ${activeStudent.name}!`, 'success');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(customMessage);
    setCopied(true);
    showToast?.('Message copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const pendingDue = dueAmount !== null ? dueAmount : (activeStudent.feeMetrics?.currentDue ?? activeStudent.remainingFees ?? 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-surface border border-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border bg-surface2/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-text flex items-center gap-2">
                WhatsApp Fee Due Reminder
              </h3>
              <p className="text-xs text-textMuted">
                {studentList.length > 1 ? `Student ${currentIdx + 1} of ${studentList.length}` : 'Send official fee reminder on WhatsApp'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-textMuted hover:text-text hover:bg-surface2 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Student Info Card */}
          <div className="p-3.5 rounded-xl border border-border bg-surface2/30 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-black text-text text-sm truncate">{activeStudent.name}</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                  {activeStudent.studentType === 'school' ? `Class ${activeStudent.className || ''}` : activeStudent.course}
                </span>
              </div>
              <p className="text-xs text-textMuted mt-0.5 flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-emerald-500" />
                <span>{mobile || 'No Mobile Number'}</span>
                {activeStudent.fatherName && <span>• F: {activeStudent.fatherName}</span>}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-[10px] uppercase font-bold text-rose-500 tracking-wider">Due Amount</span>
              <p className="text-base font-black text-rose-500">₹{Number(pendingDue).toLocaleString('en-IN')}</p>
            </div>
          </div>

          {/* Language Selector Tabs */}
          <div>
            <label className="block text-xs font-bold text-text mb-2 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-primary" />
              <span>Choose Message Language / भाषा चुनें:</span>
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-surface2 rounded-xl border border-border">
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${language === 'hi'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-textMuted hover:text-text'
                  }`}
              >
                <span>🇮🇳 हिंदी (Hindi)</span>
                {language === 'hi' && <Check className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${language === 'en'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-textMuted hover:text-text'
                  }`}
              >
                <span>🇬🇧 English</span>
                {language === 'en' && <Check className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Message Textarea Preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-text flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Message Preview (Editable):</span>
              </label>
              <button
                type="button"
                onClick={() => setCustomMessage(generateMessage(activeStudent, language))}
                className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
              >
                Reset Template
              </button>
            </div>
            <textarea
              rows={8}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full text-xs font-medium p-3 rounded-xl border border-border bg-surface2/40 text-text focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-mono leading-relaxed"
              placeholder="Type or modify reminder message here..."
            />
          </div>

          {/* Multi-student Queue Navigation (If Bulk mode) */}
          {studentList.length > 1 && (
            <div className="p-3 bg-surface2 rounded-xl border border-border flex items-center justify-between text-xs">
              <span className="font-bold text-textMuted">
                Queue: {currentIdx + 1} / {studentList.length} Students
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                  className="px-2.5 py-1 rounded-lg border border-border bg-surface font-bold text-text disabled:opacity-40 cursor-pointer"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={currentIdx === studentList.length - 1}
                  onClick={() => setCurrentIdx(prev => Math.min(studentList.length - 1, prev + 1))}
                  className="px-2.5 py-1 rounded-lg border border-border bg-surface font-bold text-text disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border bg-surface2/30 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="px-4 py-2.5 rounded-xl border border-border bg-surface hover:bg-surface2 text-xs font-bold text-text transition-colors flex items-center gap-2 cursor-pointer"
          >
            {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-textMuted" />}
            <span>{copied ? 'Copied!' : 'Copy Text'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-border hover:bg-surface2 text-xs font-bold text-textMuted hover:text-text transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Send on WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
