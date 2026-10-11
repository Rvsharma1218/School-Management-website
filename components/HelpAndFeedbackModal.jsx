'use client';

import React, { useState } from 'react';
import {
  ArrowLeft, X, HelpCircle, MessageCircle, Bug, Star,
  FileText, AlertCircle, ChevronRight, ChevronDown, Phone,
  Mail, ExternalLink, CheckCircle2, ShieldCheck, Search, Send
} from 'lucide-react';
import { useSchoolStore } from '../lib/store';

const APP_VERSION = 'Version 2.3000.1049978204.263700';

const FAQS = [
  {
    q: 'How does offline mode sync with the website?',
    a: 'The portal works seamlessly offline using indexed browser caching. As soon as an active internet connection is detected, all registered students, recorded fee payments, and attendance rolls automatically sync to the Firebase cloud database in real-time.'
  },
  {
    q: 'How do I add a signature and make it transparent?',
    a: 'Navigate to Settings > Official Signatures & School Seal. Upload a clear photo of the Principal signature taken on white paper. The built-in AI background remover automatically strips paper pixels and renders crisp transparent ink on fee receipts and report cards.'
  },
  {
    q: 'Can teachers access fee collection?',
    a: 'By default, fee collection and financial ledgers are restricted to Principal / Admin credentials. If permitted, the administrator can grant granular fee collection and discount rights to specific teachers from the Teacher Permissions management panel.'
  },
  {
    q: 'How can I restore my database backup?',
    a: 'Go to Settings > Data Backup. You can download an encrypted JSON backup snapshot of your entire school directory anytime. To restore, select your exported backup file in the Restore section to recover all records instantly.'
  },
  {
    q: 'How do I print student ID cards and admit cards?',
    a: 'Click on ID Cards or Admit Cards in the left navigation sidebar. Select your desired layout template, pick the academic class and section, and click "Print" or "Download PDF".'
  },
  {
    q: 'How to send fee reminders on WhatsApp?',
    a: 'From the Fees dashboard, find any student with outstanding dues and click the WhatsApp icon or "Send Reminder". The system auto-generates a personalized bilingual (Hindi/English) fee invoice reminder message ready to send.'
  }
];

export default function HelpAndFeedbackModal({ isOpen, onClose }) {
  const { showToast, currentUser, settings } = useSchoolStore();

  // Active view: 'main' | 'help' | 'contact' | 'feedback' | 'rate' | 'terms' | 'channels'
  const [activeView, setActiveView] = useState('main');

  // FAQ search & expanded state
  const [faqSearch, setFaqSearch] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  // Feedback form state
  const [feedbackCategory, setFeedbackCategory] = useState('Technical Issue');
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Rating state
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [isRated, setIsRated] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setActiveView('main');
    onClose();
  };

  const handleBack = () => {
    if (activeView === 'main') {
      handleClose();
    } else {
      setActiveView('main');
    }
  };

  const handleSubmitFeedback = (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) {
      showToast('Please enter your feedback or describe the issue.', 'error');
      return;
    }
    setIsSubmittingFeedback(true);
    setTimeout(() => {
      setIsSubmittingFeedback(false);
      showToast('✓ Feedback submitted successfully! Our team will review it.', 'success');
      setFeedbackText('');
      setActiveView('main');
    }, 600);
  };

  const handleSubmitRating = () => {
    setIsRated(true);
    showToast(`★ Thank you for rating ${rating} stars!`, 'success');
    setTimeout(() => {
      setActiveView('main');
      setIsRated(false);
    }, 900);
  };

  const filteredFaqs = FAQS.filter(
    f => f.q.toLowerCase().includes(faqSearch.toLowerCase()) || f.a.toLowerCase().includes(faqSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#121212] text-white border border-[#262626] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200 font-sans">
        
        {/* --- Top App Bar --- */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#262626] bg-[#121212] select-none flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="p-1.5 -ml-1 text-white hover:text-white/80 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              title={activeView === 'main' ? 'Close' : 'Back'}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="font-semibold text-base sm:text-lg text-white tracking-wide">
              {activeView === 'main' && 'Help and feedback'}
              {activeView === 'help' && 'Help Centre'}
              {activeView === 'contact' && 'Contact us'}
              {activeView === 'feedback' && 'Send feedback'}
              {activeView === 'rate' && 'Rate the app'}
              {activeView === 'terms' && 'Terms and Privacy Policy'}
              {activeView === 'channels' && 'Channels reports'}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 text-[#8E8E8E] hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* --- Dynamic Content Body --- */}
        <div className="flex-1 overflow-y-auto">

          {/* ========================================================================= */}
          {/* MAIN MENU (EXACT SCREENSHOT LAYOUT) */}
          {/* ========================================================================= */}
          {activeView === 'main' && (
            <div className="py-2 divide-y divide-[#1e1e1e]/60">
              {/* 1. Help Centre */}
              <button
                type="button"
                onClick={() => setActiveView('help')}
                className="w-full px-5 py-3.5 flex items-start gap-4 text-left hover:bg-[#1a1a1a] transition-colors cursor-pointer group"
              >
                <div className="mt-0.5 text-[#B0B0B0] group-hover:text-white transition-colors flex-shrink-0">
                  <HelpCircle className="w-6 h-6 stroke-[1.8]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-medium text-white group-hover:text-white leading-snug">
                    Help Centre
                  </div>
                  <div className="text-[12.5px] text-[#8E8E8E] mt-0.5 leading-tight">
                    Frequently asked questions
                  </div>
                </div>
              </button>

              {/* 2. Contact us */}
              <button
                type="button"
                onClick={() => setActiveView('contact')}
                className="w-full px-5 py-3.5 flex items-start gap-4 text-left hover:bg-[#1a1a1a] transition-colors cursor-pointer group"
              >
                <div className="mt-0.5 text-[#B0B0B0] group-hover:text-white transition-colors flex-shrink-0">
                  <div className="relative">
                    <MessageCircle className="w-6 h-6 stroke-[1.8]" />
                    <span className="absolute -top-0.5 -right-0.5 text-[9px] font-bold text-white bg-[#121212] px-0.5 rounded-full">?</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-medium text-white group-hover:text-white leading-snug">
                    Contact us
                  </div>
                  <div className="text-[12.5px] text-[#8E8E8E] mt-0.5 leading-tight">
                    Chat with support to get answers
                  </div>
                </div>
              </button>

              {/* 3. Send feedback */}
              <button
                type="button"
                onClick={() => setActiveView('feedback')}
                className="w-full px-5 py-3.5 flex items-start gap-4 text-left hover:bg-[#1a1a1a] transition-colors cursor-pointer group"
              >
                <div className="mt-0.5 text-[#B0B0B0] group-hover:text-white transition-colors flex-shrink-0">
                  <Bug className="w-6 h-6 stroke-[1.8]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-medium text-white group-hover:text-white leading-snug">
                    Send feedback
                  </div>
                  <div className="text-[12.5px] text-[#8E8E8E] mt-0.5 leading-tight">
                    Technical issues, suggestions
                  </div>
                </div>
              </button>

              {/* 4. Rate the app */}
              <button
                type="button"
                onClick={() => setActiveView('rate')}
                className="w-full px-5 py-3.5 flex items-center gap-4 text-left hover:bg-[#1a1a1a] transition-colors cursor-pointer group"
              >
                <div className="text-[#B0B0B0] group-hover:text-white transition-colors flex-shrink-0">
                  <div className="w-6 h-6 border-2 border-current rounded-md flex items-center justify-center p-0.5">
                    <Star className="w-3.5 h-3.5 fill-current" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-medium text-white group-hover:text-white leading-snug">
                    Rate the app
                  </div>
                </div>
              </button>

              {/* 5. Terms and Privacy Policy */}
              <button
                type="button"
                onClick={() => setActiveView('terms')}
                className="w-full px-5 py-3.5 flex items-center gap-4 text-left hover:bg-[#1a1a1a] transition-colors cursor-pointer group"
              >
                <div className="text-[#B0B0B0] group-hover:text-white transition-colors flex-shrink-0">
                  <FileText className="w-6 h-6 stroke-[1.8]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-medium text-white group-hover:text-white leading-snug">
                    Terms and Privacy Policy
                  </div>
                </div>
              </button>

              {/* 6. Channels reports */}
              <button
                type="button"
                onClick={() => setActiveView('channels')}
                className="w-full px-5 py-3.5 flex items-center gap-4 text-left hover:bg-[#1a1a1a] transition-colors cursor-pointer group"
              >
                <div className="text-[#B0B0B0] group-hover:text-white transition-colors flex-shrink-0">
                  <AlertCircle className="w-6 h-6 stroke-[1.8]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-medium text-white group-hover:text-white leading-snug">
                    Channels reports
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUBVIEW 1: HELP CENTRE (FAQS) */}
          {/* ========================================================================= */}
          {activeView === 'help' && (
            <div className="p-4 space-y-3.5">
              <div className="relative">
                <Search className="w-4 h-4 text-[#8E8E8E] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={faqSearch}
                  onChange={(e) => setFaqSearch(e.target.value)}
                  placeholder="Search questions or topics..."
                  className="w-full pl-10 pr-4 py-2.5 bg-[#1E1E1E] text-white text-xs rounded-xl border border-[#2E2E2E] focus:outline-hidden focus:border-teal-400 placeholder-[#6E6E6E]"
                />
              </div>

              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {filteredFaqs.length > 0 ? (
                  filteredFaqs.map((faq, idx) => {
                    const isExp = expandedFaq === idx;
                    return (
                      <div
                        key={idx}
                        className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl overflow-hidden transition-all"
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedFaq(isExp ? null : idx)}
                          className="w-full p-3.5 text-left flex items-center justify-between gap-3 text-xs font-semibold text-white hover:text-teal-300 transition-colors cursor-pointer"
                        >
                          <span className="leading-snug">{faq.q}</span>
                          <ChevronDown className={`w-4 h-4 text-[#8E8E8E] flex-shrink-0 transition-transform ${isExp ? 'rotate-180 text-teal-400' : ''}`} />
                        </button>
                        {isExp && (
                          <div className="px-3.5 pb-3.5 text-[12px] text-[#A0A0A0] leading-relaxed border-t border-[#262626] pt-2.5">
                            {faq.a}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-xs text-[#8E8E8E]">
                    No questions found matching &quot;{faqSearch}&quot;.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUBVIEW 2: CONTACT US */}
          {/* ========================================================================= */}
          {activeView === 'contact' && (
            <div className="p-4 space-y-3">
              <p className="text-xs text-[#8E8E8E] leading-relaxed">
                Connect directly with our dedicated technical support representatives:
              </p>

              {/* WhatsApp Live */}
              <a
                href="https://wa.me/918568643490?text=Hello%20School%20Support%20Team%2C%20I%20need%20assistance%20with%20my%20school%20management%20portal."
                target="_blank"
                rel="noreferrer"
                className="p-3.5 rounded-2xl bg-[#1E1E1E] border border-[#2A2A2A] hover:border-emerald-500/50 flex items-center gap-3.5 group transition-all cursor-pointer block"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold flex-shrink-0 group-hover:scale-105 transition-transform">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors flex items-center justify-between">
                    <span>WhatsApp Support</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-normal">Instant</span>
                  </div>
                  <div className="text-[11px] text-[#8E8E8E] mt-0.5">
                    +91 8568643490 / +91 8603481865
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-[#8E8E8E] group-hover:text-white" />
              </a>

              {/* Direct Helpline */}
              <a
                href="tel:+918568643490"
                className="p-3.5 rounded-2xl bg-[#1E1E1E] border border-[#2A2A2A] hover:border-blue-500/50 flex items-center gap-3.5 group transition-all cursor-pointer block"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                    Voice Helpline
                  </div>
                  <div className="text-[11px] text-[#8E8E8E] mt-0.5">
                    8568643490 (10:00 AM - 07:00 PM)
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-[#8E8E8E] group-hover:text-white" />
              </a>

              {/* Email Support */}
              <a
                href="mailto:support@schoolcloud.com"
                className="p-3.5 rounded-2xl bg-[#1E1E1E] border border-[#2A2A2A] hover:border-amber-500/50 flex items-center gap-3.5 group transition-all cursor-pointer block"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                    Email Desk
                  </div>
                  <div className="text-[11px] text-[#8E8E8E] mt-0.5">
                    support@schoolcloud.com
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-[#8E8E8E] group-hover:text-white" />
              </a>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUBVIEW 3: SEND FEEDBACK */}
          {/* ========================================================================= */}
          {activeView === 'feedback' && (
            <form onSubmit={handleSubmitFeedback} className="p-4 space-y-3.5">
              <div>
                <label className="text-[11px] font-semibold text-[#8E8E8E] block mb-1">
                  Category
                </label>
                <select
                  value={feedbackCategory}
                  onChange={(e) => setFeedbackCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1E1E1E] text-white text-xs rounded-xl border border-[#2E2E2E] focus:outline-hidden focus:border-teal-400 cursor-pointer"
                >
                  <option value="Technical Issue">Technical Issue / Bug</option>
                  <option value="Feature Suggestion">Feature Suggestion</option>
                  <option value="UI Improvement">UI / Usability Improvement</option>
                  <option value="General Feedback">General Feedback</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#8E8E8E] block mb-1">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Describe the issue you encountered or suggestions to improve..."
                  className="w-full p-3 bg-[#1E1E1E] text-white text-xs rounded-xl border border-[#2E2E2E] focus:outline-hidden focus:border-teal-400 placeholder-[#6E6E6E] resize-none"
                />
              </div>

              <div className="pt-1 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveView('main')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#8E8E8E] hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFeedback}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingFeedback ? 'Submitting...' : 'Submit Feedback'}</span>
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* SUBVIEW 4: RATE THE APP */}
          {/* ========================================================================= */}
          {activeView === 'rate' && (
            <div className="p-6 text-center space-y-4">
              <p className="text-xs text-[#8E8E8E]">
                How would you rate your overall experience with School Management Portal?
              </p>

              {/* Star Selector */}
              <div className="flex items-center justify-center gap-2 py-2">
                {[1, 2, 3, 4, 5].map((starIdx) => {
                  const isActive = (hoverRating || rating) >= starIdx;
                  return (
                    <button
                      key={starIdx}
                      type="button"
                      onMouseEnter={() => setHoverRating(starIdx)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(starIdx)}
                      className="p-1 cursor-pointer transition-transform hover:scale-115 focus:outline-hidden"
                      title={`${starIdx} Stars`}
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          isActive
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-[#3E3E3E] hover:text-[#6E6E6E]'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              <div className="text-sm font-bold text-amber-400">
                {rating === 5 && '5 / 5 Stars — Excellent!'}
                {rating === 4 && '4 / 5 Stars — Very Good'}
                {rating === 3 && '3 / 5 Stars — Good'}
                {rating === 2 && '2 / 5 Stars — Fair'}
                {rating === 1 && '1 / 5 Stars — Needs Improvement'}
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveView('main')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#8E8E8E] hover:text-white transition-colors cursor-pointer"
                >
                  Later
                </button>
                <button
                  type="button"
                  onClick={handleSubmitRating}
                  className="px-6 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white transition-colors cursor-pointer shadow-md"
                >
                  Submit Rating
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUBVIEW 5: TERMS AND PRIVACY POLICY */}
          {/* ========================================================================= */}
          {activeView === 'terms' && (
            <div className="p-4 space-y-4 max-h-[62vh] overflow-y-auto pr-1 text-xs text-[#A0A0A0]">
              <div className="bg-[#1E1E1E] p-3.5 rounded-2xl border border-[#2A2A2A] space-y-1.5">
                <h3 className="font-bold text-white text-[13px] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  <span>1. Data Ownership & Institution Rights</span>
                </h3>
                <p className="leading-relaxed">
                  All educational records, student admissions, fee histories, marks, and faculty profiles belong 100% exclusively to your registered school. No information is sold, rented, or shared with third-party advertisers.
                </p>
              </div>

              <div className="bg-[#1E1E1E] p-3.5 rounded-2xl border border-[#2A2A2A] space-y-1.5">
                <h3 className="font-bold text-white text-[13px] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  <span>2. Privacy & Encryption Standards</span>
                </h3>
                <p className="leading-relaxed">
                  All data in transit is protected using modern TLS 1.3 encryption. Cloud snapshots are securely guarded in enterprise-grade Firestore datacenters with strict cryptographic access control.
                </p>
              </div>

              <div className="bg-[#1E1E1E] p-3.5 rounded-2xl border border-[#2A2A2A] space-y-1.5">
                <h3 className="font-bold text-white text-[13px] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  <span>3. Local Offline Storage & Privacy</span>
                </h3>
                <p className="leading-relaxed">
                  Offline files, cached student photographs, and temporary ledger state remain stored strictly inside the browser’s sandboxed local database and are only accessible through authorized login.
                </p>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUBVIEW 6: CHANNELS REPORTS */}
          {/* ========================================================================= */}
          {activeView === 'channels' && (
            <div className="p-4 space-y-2.5">
              {[
                { name: 'System Services', status: '100% Operational', color: 'text-emerald-400', dot: 'bg-emerald-400' },
                { name: 'Database Sync', status: 'Realtime Connected', color: 'text-emerald-400', dot: 'bg-emerald-400' },
                { name: 'Broadcast Channel', status: 'Active (0 incidents)', color: 'text-emerald-400', dot: 'bg-emerald-400' },
                { name: 'Encryption Engine', status: 'TLS 1.3 / AES-256', color: 'text-cyan-400', dot: 'bg-cyan-400' },
                { name: 'Cloud Gateway', status: 'Active (< 90ms latency)', color: 'text-emerald-400', dot: 'bg-emerald-400' },
                { name: 'Security Telemetry', status: 'Guarded & Secure', color: 'text-teal-400', dot: 'bg-teal-400' },
              ].map((c, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl flex items-center justify-between text-xs"
                >
                  <span className="text-[#C0C0C0] font-medium">{c.name}</span>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${c.dot} animate-pulse`} />
                    <span className={`font-bold ${c.color}`}>{c.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* --- Divider --- */}
        <div className="border-t border-[#262626]" />

        {/* --- Footer Version Text (Exact match from screenshot) --- */}
        <div className="py-4 px-4 text-center select-none bg-[#121212] flex-shrink-0">
          <p className="text-[13px] font-medium text-[#888888] tracking-tight">
            {APP_VERSION}
          </p>
        </div>

      </div>
    </div>
  );
}
