'use client';

import React, { useState } from 'react';
import { useSchoolStore } from '../lib/store';
import {
  Sparkles, CheckCircle2, ShieldCheck, Zap, Crown,
  CreditCard, Headphones, Calendar, ArrowRight, Check,
  QrCode, ExternalLink, HelpCircle, PhoneCall, MessageCircle,
  Building2, School, Star, KeyRound, AlertTriangle, Users
} from 'lucide-react';

export default function SubscriptionView() {
  const { settings, students, currentUser, showToast } = useSchoolStore();
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'
  const [selectedPlanModal, setSelectedPlanModal] = useState(null);
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
  const [licenseKeyInput, setLicenseKeyInput] = useState('');

  const schoolName = settings.instituteName || settings.schoolName || 'My Institute';
  const currentSession = settings.currentSession || '2026-27';
  const activePlanId = settings.subscriptionPlan || 'free_trial';
  const rawStudentLimit = settings.studentLimit !== undefined ? Number(settings.studentLimit) : 10;
  const isUnlimited = rawStudentLimit <= 0 || rawStudentLimit >= 99999;
  const studentCount = (students || []).length;
  const capacityPercent = isUnlimited ? 0 : Math.min(100, Math.round((studentCount / rawStudentLimit) * 100));

  const plans = [
    {
      id: 'free_trial',
      name: 'Free Trial',
      badge: 'Test Drive',
      badgeColor: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      monthlyPrice: '₹0',
      yearlyPrice: '₹0',
      period: 'forever',
      studentLimit: 10,
      studentLimitLabel: 'Max 10 Students',
      description: 'Ideal to test drive the app and website with 10 student records.',
      allAccessTag: '100% Features Unlocked',
      features: [
        'Max 10 Student Admissions',
        'Mark Entry Desk (Theory, Pract, Int)',
        'Marksheet PDF & Statement of Marks',
        'Fee Collection & Multi-Format Receipts',
        'Student ID Card & Admit Card Studio',
        'Daily Student & Teacher Attendance',
        'Android App & Web Real-time Sync',
      ],
      popular: false,
    },
    {
      id: 'starter',
      name: 'Starter Plan',
      badge: 'Affordable',
      badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
      monthlyPrice: '₹199',
      yearlyPrice: '₹1,790',
      period: billingCycle === 'monthly' ? '/ month' : '/ year',
      savings: billingCycle === 'yearly' ? 'Save 25% (Save ₹598)' : null,
      studentLimit: 50,
      studentLimitLabel: 'Up to 50 Students',
      description: 'Perfect for computer institutes and small coaching centers.',
      allAccessTag: '100% Features Unlocked',
      features: [
        'Up to 50 Student Admissions',
        'Everything in Free Trial',
        'Class & Course Batch Management',
        'Automated Monthly Fee Dues Tracker',
        'WhatsApp Payment Reminders & Notices',
        'Offline Local DB + Cloud Backup',
        'Standard Email & WhatsApp Support',
      ],
      popular: false,
    },
    {
      id: 'standard',
      name: 'Standard School',
      badge: 'Most Popular',
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
      monthlyPrice: '₹399',
      yearlyPrice: '₹3,590',
      period: billingCycle === 'monthly' ? '/ month' : '/ year',
      savings: billingCycle === 'yearly' ? 'Save 25% (Save ₹1,198)' : null,
      studentLimit: 200,
      studentLimitLabel: 'Up to 200 Students',
      description: 'Recommended for formal schools and growing academies.',
      allAccessTag: '100% Features Unlocked',
      features: [
        'Up to 200 Student Admissions',
        'Everything in Starter Plan',
        'Official School Seal & Stamp Integration',
        'Admit Card & Exam Roll Sheet Generator',
        'Teacher Role & Permission Access Controls',
        'Timetable & Class Schedule Generator',
        'Priority Phone & WhatsApp Support',
      ],
      popular: true,
    },
    {
      id: 'pro_unlimited',
      name: 'Pro Unlimited',
      badge: 'Unlimited Growth',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
      monthlyPrice: '₹699',
      yearlyPrice: '₹6,290',
      period: billingCycle === 'monthly' ? '/ month' : '/ year',
      savings: billingCycle === 'yearly' ? 'Save 25% (Save ₹2,098)' : null,
      studentLimit: 0,
      studentLimitLabel: 'Unlimited Students',
      description: 'Zero limits. Complete peace of mind for large institutions.',
      allAccessTag: '100% Features Unlocked',
      features: [
        'Unlimited Student Admissions (No Limits)',
        'Everything in Standard Plan',
        'Multi-Branch & Multi-Teacher Staff',
        'Automated Daily Cloud Backups',
        'Custom Marksheet Formats on Request',
        'VIP Helpline & Instant Remote Setup',
        'Guaranteed Zero Price Escalation',
      ],
      popular: false,
    },
  ];

  const handleOpenPlan = (plan) => {
    setSelectedPlanModal(plan);
  };

  const getActivePlanName = () => {
    const found = plans.find(p => p.id === activePlanId);
    return found ? found.name : 'Active Plan';
  };

  const handleWhatsAppContact = (planName) => {
    const text = encodeURIComponent(
      `Hello Admin, I want to activate/upgrade the "${planName || 'Standard School'}" plan for ${schoolName}. School ID: ${settings.schoolId || 'N/A'}. Please guide me with payment details.`
    );
    window.open(`https://wa.me/918568643490?text=${text}`, '_blank');
  };

  const handleActivateLicense = () => {
    if (!licenseKeyInput.trim()) {
      showToast('Please enter your license activation key', 'error');
      return;
    }
    const cleanKey = licenseKeyInput.trim().toUpperCase();
    if (cleanKey.length < 8) {
      showToast('Invalid license key format.', 'error');
      return;
    }
    showToast(`License key request submitted! Admin will verify and activate within 10 minutes.`, 'success');
    setIsLicenseModalOpen(false);
    setLicenseKeyInput('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* ─── Top Header Banner ─── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1f108e] via-[#281ab5] to-[#160b6a] p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-black backdrop-blur-md">
              <Crown className="w-3.5 h-3.5 text-amber-300" />
              <span>INSTITUTION SUBSCRIPTION & LICENSES</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Affordable School Management Plans
            </h1>
            <p className="text-sm text-white/80 max-w-2xl leading-relaxed">
              Transparent, low-priced plans starting at just ₹199/month.
              <strong className="text-amber-300 font-bold ml-1">
                Every single plan includes 100% full access to all 15+ features & modules.
              </strong>
            </p>
          </div>

          {/* Active Plan & Capacity Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-5 min-w-[300px] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-300" />
                <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                  CURRENT PLAN: {getActivePlanName().toUpperCase()}
                </span>
              </div>
              <button
                onClick={() => setIsLicenseModalOpen(true)}
                className="text-[11px] font-bold text-amber-300 hover:text-white flex items-center gap-1 underline underline-offset-2 cursor-pointer"
              >
                <KeyRound className="w-3 h-3" />
                <span>Enter Key</span>
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/80 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  <span>Student Capacity</span>
                </span>
                <span className="font-black text-white">
                  {studentCount} / {isUnlimited ? '∞ Unlimited' : rawStudentLimit}
                </span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    capacityPercent >= 90 ? 'bg-rose-400' : capacityPercent >= 70 ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${isUnlimited ? 15 : capacityPercent}%` }}
                />
              </div>
              {!isUnlimited && capacityPercent >= 80 && (
                <div className="text-[10px] text-amber-200 font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Approaching plan capacity limit ({studentCount}/{rawStudentLimit})</span>
                </div>
              )}
            </div>

            <div className="text-[11px] text-white/70 pt-1 border-t border-white/10 flex items-center justify-between">
              <span>{schoolName}</span>
              <span>Session: {currentSession}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Billing Cycle Toggle ─── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-surface border border-border rounded-2xl p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs sm:text-sm text-text dark:text-white">Choose Billing Cycle</h3>
            <p className="text-[11px] text-text-secondary">Switch to annual billing to save 25% on all plans.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-surface2 p-1 rounded-xl border border-border">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              billingCycle === 'monthly'
                ? 'bg-primary text-white shadow-xs'
                : 'text-text-secondary hover:text-text'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              billingCycle === 'yearly'
                ? 'bg-primary text-white shadow-xs'
                : 'text-text-secondary hover:text-text'
            }`}
          >
            <span>Annual (12 Mo)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-400 text-slate-900">
              SAVE 25%
            </span>
          </button>
        </div>
      </div>

      {/* ─── Subscription Plans Grid (4 Plans) ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {plans.map((p) => {
          const isCurrentActive = activePlanId === p.id;
          const displayPrice = billingCycle === 'monthly' ? p.monthlyPrice : p.yearlyPrice;

          return (
            <div
              key={p.id}
              className={`relative rounded-3xl bg-white dark:bg-surface border transition-all duration-200 flex flex-col ${
                p.popular
                  ? 'border-primary ring-2 ring-primary/20 shadow-xl lg:-translate-y-1 dark:border-primary-light'
                  : 'border-border shadow-xs hover:shadow-md hover:border-primary/40'
              }`}
            >
              {p.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-primary text-white text-[10px] font-black tracking-wide shadow-md flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                  <span>RECOMMENDED</span>
                </div>
              )}

              <div className="p-5 border-b border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${p.badgeColor}`}>
                    {p.badge}
                  </span>
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                    {p.studentLimitLabel}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-black text-text dark:text-white flex items-center gap-1.5">
                    <span>{p.name}</span>
                    {isCurrentActive && (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-emerald-500 text-white">
                        Current
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-text-secondary mt-0.5 leading-snug">{p.description}</p>
                </div>

                <div className="pt-1 flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-black text-text dark:text-white tracking-tight">
                    {displayPrice}
                  </span>
                  <span className="text-xs font-bold text-text-muted">{p.period}</span>
                </div>

                {p.savings && (
                  <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    {p.savings}
                  </div>
                )}

                <button
                  onClick={() => handleOpenPlan(p)}
                  className={`w-full py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs active:scale-95 ${
                    isCurrentActive
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : p.popular
                      ? 'bg-primary hover:bg-primary-dark text-white shadow-primary/25'
                      : 'bg-surface2 hover:bg-primary/10 text-text dark:text-white border border-border hover:border-primary/40'
                  }`}
                >
                  <span>{isCurrentActive ? 'Active Plan Details' : p.id === 'free_trial' ? 'Start Free Trial' : 'Subscribe & Activate'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Plan Feature List */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2 text-xs">
                  <div className="text-[10px] font-black uppercase tracking-wider text-text-secondary">
                    Plan Features:
                  </div>
                  {p.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-text-secondary">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-[11px] text-text dark:text-white font-medium leading-snug">{feat}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between text-[10px] text-text-muted">
                  <span>Android + Web App</span>
                  <span className="font-bold text-emerald-600">All 15+ Modules</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Zero Lock Guarantee Callout ─── */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 dark:from-emerald-950/20 dark:via-teal-950/20 dark:to-blue-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <Zap className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-text dark:text-white flex items-center gap-2">
              <span>All 15+ Modules Included in Every Plan</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-black">
                ZERO HIDDEN CHARGES
              </span>
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Fees collection, marksheet generator, ID cards, admit cards, and attendance are included across all plans.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleWhatsAppContact('General Inquiry')}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp Helpline</span>
          </button>
        </div>
      </div>

      {/* ─── Feature Comparison Matrix Table ─── */}
      <div className="bg-white dark:bg-surface border border-border rounded-3xl p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-black text-text dark:text-white">Feature Comparison Matrix</h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Compare student capacity and features across all available tiers.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface2/60 border-b border-border text-text-secondary font-bold text-[10px] uppercase">
                <th className="py-3 px-4">Feature / Module</th>
                <th className="py-3 px-3 text-center">Free Trial</th>
                <th className="py-3 px-3 text-center">Starter (₹199)</th>
                <th className="py-3 px-3 text-center bg-primary/5 text-primary">Standard (₹399)</th>
                <th className="py-3 px-3 text-center">Pro (₹699)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-text dark:text-white font-medium">
              {[
                { title: 'Student Capacity Limit', free: '10 Students', start: '50 Students', std: '200 Students', pro: 'Unlimited (∞)' },
                { title: 'Student Admissions & Bio', free: '✓', start: '✓', std: '✓', pro: '✓' },
                { title: 'Monthly Fees & Receipts Studio', free: '✓', start: '✓', std: '✓', pro: '✓' },
                { title: 'Marks Entry & Marksheets PDF', free: '✓', start: '✓', std: '✓', pro: '✓' },
                { title: 'ID Cards & Admit Cards Studio', free: '✓', start: '✓', std: '✓', pro: '✓' },
                { title: 'Teacher Attendance & Log', free: '✓', start: '✓', std: '✓', pro: '✓' },
                { title: 'Class Timetable Generator', free: '✓', start: '✓', std: '✓', pro: '✓' },
                { title: 'WhatsApp Fee Reminder Alerts', free: '✓', start: '✓', std: '✓', pro: '✓' },
                { title: 'Android App Real-time Sync', free: '✓', start: '✓', std: '✓', pro: '✓' },
                { title: 'Dedicated Priority Helpline', free: 'Community', start: 'WhatsApp', std: 'Phone + Chat', pro: '24/7 VIP' },
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-surface2/30 transition-colors">
                  <td className="py-3 px-4 font-bold">{row.title}</td>
                  <td className="py-3 px-3 text-center font-semibold text-text-secondary">{row.free}</td>
                  <td className="py-3 px-3 text-center font-semibold text-text-secondary">{row.start}</td>
                  <td className="py-3 px-3 text-center font-black text-primary bg-primary/5">{row.std}</td>
                  <td className="py-3 px-3 text-center font-bold text-emerald-600">{row.pro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Direct UPI & Helpline Assistance Card ─── */}
      <div className="bg-surface2 border border-border rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center flex-shrink-0 shadow-md">
            <Headphones className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-text dark:text-white">Need Custom Billing or Institution Invoice?</h4>
            <p className="text-xs text-text-secondary mt-0.5">
              Contact our direct merchant desk for GST invoice, official quotation, or custom school licenses.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="tel:8568643490"
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-surface hover:bg-surface2 text-text dark:text-white border border-border text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
          >
            <PhoneCall className="w-3.5 h-3.5 text-primary" />
            <span>Call: 8568643490</span>
          </a>
          <button
            onClick={() => handleWhatsAppContact('Quick Inquiry')}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Chat on WhatsApp</span>
          </button>
        </div>
      </div>

      {/* ─── Plan Activation / Upgrade Modal ─── */}
      {selectedPlanModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-surface border border-border rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                <h3 className="font-extrabold text-base text-text dark:text-white">
                  {selectedPlanModal.id === 'free_trial' ? 'Free Trial Details' : 'Subscribe to Plan'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPlanModal(null)}
                className="p-1 rounded-lg hover:bg-surface2 text-text-muted hover:text-text cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-surface2 border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary font-bold">Selected Plan:</span>
                <span className="text-sm font-black text-primary">{selectedPlanModal.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary font-bold">Price ({billingCycle}):</span>
                <span className="text-lg font-black text-text dark:text-white">
                  {billingCycle === 'monthly' ? selectedPlanModal.monthlyPrice : selectedPlanModal.yearlyPrice}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary font-bold">Student Capacity:</span>
                <span className="text-xs font-black text-emerald-600 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                  {selectedPlanModal.studentLimitLabel}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary font-bold">School Name:</span>
                <span className="text-xs font-bold text-text truncate max-w-[200px]">{schoolName}</span>
              </div>
            </div>

            {selectedPlanModal.id !== 'free_trial' && (
              <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-xs space-y-2">
                <div className="font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-emerald-600" />
                  <span>Direct UPI Transfer (0% Gateway Charges):</span>
                </div>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  UPI ID: <strong className="text-text font-mono font-bold">8568643490@upi</strong> or pay using PhonePe / Google Pay / Paytm, then send the payment screenshot on WhatsApp.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedPlanModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-text-secondary hover:bg-surface2 cursor-pointer transition-colors"
              >
                Close
              </button>
              {selectedPlanModal.id === 'free_trial' ? (
                <button
                  onClick={() => {
                    showToast('Free Trial is already active with 10 students limit!', 'info');
                    setSelectedPlanModal(null);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-800 text-white text-xs font-black shadow-md cursor-pointer transition-all"
                >
                  Trial Active
                </button>
              ) : (
                <button
                  onClick={() => {
                    handleWhatsAppContact(selectedPlanModal.name);
                    setSelectedPlanModal(null);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Activate via WhatsApp</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Enter License Key Modal ─── */}
      {isLicenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-surface border border-border rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-primary" />
                <h3 className="font-extrabold text-base text-text dark:text-white">Activate License Key</h3>
              </div>
              <button
                onClick={() => setIsLicenseModalOpen(false)}
                className="p-1 rounded-lg hover:bg-surface2 text-text-muted hover:text-text cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-text-secondary">
              If you received an offline license activation code or institution key from admin, enter it below to activate your plan immediately.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-text-secondary uppercase">License Key</label>
              <input
                type="text"
                placeholder="e.g. SCH-PRO-8492-2026"
                value={licenseKeyInput}
                onChange={(e) => setLicenseKeyInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface2 font-mono text-sm uppercase tracking-wider focus:outline-hidden focus:border-primary"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsLicenseModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-text-secondary hover:bg-surface2 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleActivateLicense}
                className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-black shadow-md cursor-pointer transition-all"
              >
                Verify & Activate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
