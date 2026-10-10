'use client';

import React, { useState } from 'react';
import { useSchoolStore } from '../lib/store';
import {
  Sparkles, CheckCircle2, ShieldCheck, Zap, Crown,
  CreditCard, Headphones, Calendar, ArrowRight, Check,
  QrCode, ExternalLink, HelpCircle, PhoneCall, MessageCircle,
  Building2, School, Star
} from 'lucide-react';

export default function SubscriptionView() {
  const { settings, currentUser, showToast } = useSchoolStore();
  const [billingCycle, setBillingCycle] = useState('annual'); // 'monthly' | 'annual' | 'triennial'
  const [selectedPlanModal, setSelectedPlanModal] = useState(null);

  const schoolName = settings.instituteName || settings.schoolName || 'My Institute';
  const currentSession = settings.currentSession || '2026-27';

  const plans = [
    {
      id: 'monthly',
      name: 'Monthly All-Access',
      badge: 'Flexible Monthly',
      badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
      price: '₹999',
      period: '/ month',
      description: 'Ideal for month-to-month flexibility with complete feature access.',
      allAccessTag: '100% Features Unlocked',
      features: [
        'Complete All-Access to All 15+ Management Modules',
        'Unlimited Students, Classes & Section Records',
        'Mark Entry Desk (Theory, Practical, Internal & Max Marks)',
        'Official Marksheet PDF & Statement of Marks Studio',
        'Automated Fee Collection & Multi-Format Receipts',
        'Student ID Card & Admit Card Studio with QR Codes',
        'Daily Student & Teacher Attendance with Reports',
        'WhatsApp Payment Reminders & Notice Board Alerts',
        'Teacher Role & Access Permission Controls',
        'Real-time Cloud Database Sync with Android App',
      ],
      popular: false,
    },
    {
      id: 'annual',
      name: 'Annual Pro All-Access',
      badge: 'Recommended • Most Popular',
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
      price: '₹8,999',
      period: '/ full session (12 mo)',
      savings: 'Save 25% (Save ₹3,000)',
      description: 'Full academic year uninterrupted access with priority support helpline.',
      allAccessTag: '100% Features Unlocked',
      features: [
        'Everything in Monthly Plan (100% All Features Included)',
        'Full 12 Months Uninterrupted Cloud Access',
        'Official Stamp & Principal Signature Tuning (White, Gold, Blue, Dark)',
        'Priority Phone & WhatsApp Support Helpline',
        'Automated Cloud Backups & Instant JSON Restore',
        'Multi-Device Support (Web, Android App & Tablets)',
        'Class Timetable & Teacher Scheduling Module',
        'Zero Transaction Surcharge on Direct UPI QR Payments',
      ],
      popular: true,
    },
    {
      id: 'triennial',
      name: '3-Year Enterprise All-Access',
      badge: 'Best Value • 3 Full Sessions',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
      price: '₹19,999',
      period: '/ 3 full academic years',
      savings: 'Save 35% (Save ₹16,000)',
      description: 'Maximum long-term savings for established schools and coaching institutes.',
      allAccessTag: '100% Features Unlocked',
      features: [
        'Everything in Annual Pro Plan (100% All Features Included)',
        'Covers 3 Full Academic Sessions (2026 to 2029)',
        'Dedicated Institution Account Manager',
        'Custom Header & Marksheet Formatting on Request',
        'Free Staff Onboarding & Remote Video Guidance',
        'Guaranteed Zero Price Escalation for 3 Full Years',
      ],
      popular: false,
    },
  ];

  const handleOpenPlan = (plan) => {
    setSelectedPlanModal(plan);
  };

  const handleConfirmPlan = () => {
    showToast(`Subscription request for "${selectedPlanModal.name}" received! Our team is processing activation.`, 'success');
    setSelectedPlanModal(null);
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
              Cloud School Management Plans
            </h1>
            <p className="text-sm text-white/80 max-w-2xl leading-relaxed">
              Transparent, student-friendly pricing for schools & computer coaching centers.
              <strong className="text-amber-300 font-bold ml-1">
                Every subscription includes 100% Full Access to all features & modules.
              </strong>
            </p>
          </div>

          {/* Active Plan Status Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-5 flex items-center gap-4 min-w-[280px]">
            <div className="w-12 h-12 rounded-xl bg-emerald-400/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 flex-shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  ALL ACCESS ACTIVE
                </span>
              </div>
              <div className="text-sm font-black text-white">{schoolName}</div>
              <div className="text-[11px] text-white/70">Session: {currentSession} • Unlimited Students</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── All-Access Guarantee Callout ─── */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 dark:from-emerald-950/20 dark:via-teal-950/20 dark:to-blue-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <Zap className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-text dark:text-white flex items-center gap-2">
              <span>All Access Included in Every Subscription</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-black">
                ZERO PAYWALLS
              </span>
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              We never restrict student admissions, receipt printing, or exam results. Pick any duration — all 15+ features are 100% unlocked.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://wa.me/918568643490?text=Hello%2C%20I%20want%20to%20inquire%20about%20the%20School%20Management%20Subscription%20Plan."
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp Helpline</span>
          </a>
        </div>
      </div>

      {/* ─── Subscription Plans Grid ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => (
          <div
            key={p.id}
            className={`relative rounded-3xl bg-white dark:bg-surface border transition-all duration-200 flex flex-col ${
              p.popular
                ? 'border-primary ring-2 ring-primary/20 shadow-xl scale-[1.02] dark:border-primary-light'
                : 'border-border shadow-sm hover:shadow-md hover:border-primary/40'
            }`}
          >
            {p.popular && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-white text-[11px] font-black tracking-wide shadow-md flex items-center gap-1.5">
                <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                <span>MOST POPULAR • RECOMMENDED</span>
              </div>
            )}

            <div className="p-6 border-b border-border space-y-4">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${p.badgeColor}`}>
                  {p.badge}
                </span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                  {p.allAccessTag}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-black text-text dark:text-white">{p.name}</h3>
                <p className="text-xs text-text-secondary mt-1">{p.description}</p>
              </div>

              <div className="pt-2 flex items-baseline gap-1">
                <span className="text-3xl font-black text-text dark:text-white tracking-tight">{p.price}</span>
                <span className="text-xs font-bold text-text-muted">{p.period}</span>
              </div>

              {p.savings && (
                <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  {p.savings}
                </div>
              )}

              <button
                onClick={() => handleOpenPlan(p)}
                className={`w-full py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm active:scale-95 ${
                  p.popular
                    ? 'bg-primary hover:bg-primary-dark text-white shadow-primary/25'
                    : 'bg-surface2 hover:bg-primary/10 text-text dark:text-white border border-border hover:border-primary/40'
                }`}
              >
                <span>Subscribe & Activate</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Plan Feature List */}
            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2.5 text-xs">
                <div className="text-[11px] font-black uppercase tracking-wider text-text-secondary">
                  Includes All Access:
                </div>
                {p.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-text-secondary">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-text dark:text-white font-medium">{feat}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-between text-[11px] text-text-muted">
                <span>Multi-user support</span>
                <span className="font-bold text-emerald-600">Active Instantly</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Comprehensive All-Access Feature Matrix Table ─── */}
      <div className="bg-white dark:bg-surface border border-border rounded-3xl p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-black text-text dark:text-white">Feature Comparison Matrix</h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Every single tool in our suite is accessible across every plan without any tier discrimination.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface2/60 border-b border-border text-text-secondary font-bold text-[10px] uppercase">
                <th className="py-3 px-4">Feature / Tool</th>
                <th className="py-3 px-4 text-center">Monthly All-Access</th>
                <th className="py-3 px-4 text-center bg-primary/5 text-primary">Annual Pro (Session)</th>
                <th className="py-3 px-4 text-center">3-Year Enterprise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-text dark:text-white font-medium">
              {[
                { title: 'Student Management & Admissions', desc: 'School & Computer Course students' },
                { title: 'Fee Collection & Receipt Studio', desc: 'Custom receipt templates, PDF print' },
                { title: 'Mark Entry Desk (Theory, Pract, Int)', desc: 'Multi-subject bulk marks entry & out-of score' },
                { title: 'Official Report Cards & Marksheets', desc: 'Seals & principal signatures integration' },
                { title: 'Student ID Cards Studio', desc: 'Barcode, QR Code & bulk printable cards' },
                { title: 'Admit Card Studio', desc: 'Official student exam admit cards' },
                { title: 'Teacher Roles & Access Permissions', desc: 'Granular permissions on/off controls' },
                { title: 'Attendance Register & Reports', desc: 'Daily tracking for students & teachers' },
                { title: 'WhatsApp Reminders & Alerts', desc: 'One-click payment alerts & notices' },
                { title: 'Cloud Database & Offline Sync', desc: 'Android App & Web real-time sync' },
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-surface2/30 transition-colors">
                  <td className="py-3 px-4 font-bold">
                    <div>{row.title}</div>
                    <div className="text-[10px] text-text-muted font-normal">{row.desc}</div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Full Access</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center bg-primary/5">
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Full Access</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Full Access</span>
                    </span>
                  </td>
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
              Contact our direct merchant desk for GST invoice, official quotation, or custom multi-school licenses.
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
          <a
            href="https://wa.me/918568643490?text=Hello%20Team%2C%20I%20want%20to%20activate%20School%20Management%20Cloud%20Subscription."
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Chat on WhatsApp</span>
          </a>
        </div>
      </div>

      {/* ─── Plan Activation Modal ─── */}
      {selectedPlanModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-surface border border-border rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                <h3 className="font-extrabold text-base text-text dark:text-white">Confirm Subscription</h3>
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
                <span className="text-xs text-text-secondary font-bold">Total Price:</span>
                <span className="text-lg font-black text-text dark:text-white">{selectedPlanModal.price}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary font-bold">Feature Access:</span>
                <span className="text-xs font-black text-emerald-600 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                  100% All Features Unlocked
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary font-bold">School Name:</span>
                <span className="text-xs font-bold text-text truncate max-w-[200px]">{schoolName}</span>
              </div>
            </div>

            {/* Direct Instant UPI QR option */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-xs space-y-2">
              <div className="font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-emerald-600" />
                <span>Instant UPI Transfer (0% Gateway Fee):</span>
              </div>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                Scan or send directly to School / Admin UPI ID: <strong className="text-text font-mono font-bold">8568643490@upi</strong> or pay using GPay / PhonePe / Paytm.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedPlanModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-text-secondary hover:bg-surface2 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPlan}
                className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-black shadow-md cursor-pointer transition-all active:scale-95"
              >
                Confirm & Activate Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
