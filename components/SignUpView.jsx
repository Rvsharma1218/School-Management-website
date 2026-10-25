'use client';

import React, { useState } from 'react';
import { useSchoolStore } from '../lib/store';
import {
  School, User, Mail, Lock, Phone, MapPin, Building,
  ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, Sparkles,
  HelpCircle, MessageSquare, Check, ShieldCheck, CreditCard,
  Zap, Eye, EyeOff
} from 'lucide-react';

export default function SignUpView() {
  const { navigate, signUp, showToast, settings } = useSchoolStore();

  const [activeTab, setActiveTab] = useState('register'); // 'register' | 'demo_inquiry'

  // School Registration Form State
  const [instituteName, setInstituteName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [instituteType, setInstituteType] = useState('School');
  const [cityState, setCityState] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('free_trial'); // 'free_trial' | 'starter' | 'standard' | 'pro_unlimited'

  // Demo Inquiry Form State
  const [inqSchoolName, setInqSchoolName] = useState('');
  const [inqContactName, setInqContactName] = useState('');
  const [inqPhone, setInqPhone] = useState('');
  const [inqStudentsCount, setInqStudentsCount] = useState('100-500');
  const [inqCity, setInqCity] = useState('');
  const [inqMessage, setInqMessage] = useState('');
  const [inqSubmitted, setInqSubmitted] = useState(false);

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const plans = [
    {
      id: 'free_trial',
      name: 'Free Trial',
      price: '₹0',
      period: 'forever',
      badge: 'Test Drive',
      badgeColor: 'bg-slate-700 text-slate-300',
      students: 'Max 10 Students',
      highlight: 'Best to explore all 15+ ERP modules'
    },
    {
      id: 'starter',
      name: 'Starter',
      price: '₹199',
      period: '/ month',
      badge: 'Affordable',
      badgeColor: 'bg-blue-600/30 text-blue-300',
      students: 'Up to 50 Students',
      highlight: 'Ideal for coaching & small centers'
    },
    {
      id: 'standard',
      name: 'Standard School',
      price: '₹499',
      period: '/ month',
      badge: 'Most Popular',
      badgeColor: 'bg-amber-400 text-slate-950 font-black',
      students: 'Up to 250 Students',
      highlight: 'Timetable, admit cards & WhatsApp dues'
    },
    {
      id: 'pro_unlimited',
      name: 'Pro Unlimited',
      price: '₹999',
      period: '/ month',
      badge: 'Unlimited',
      badgeColor: 'bg-purple-600/30 text-purple-300',
      students: 'Unlimited Capacity',
      highlight: 'Multi-branch & 24/7 dedicated support'
    }
  ];

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }
    if (!mobile || mobile.replace(/\D/g, '').length < 10) {
      setError('Please provide a valid 10-digit mobile number for WhatsApp alerts.');
      return;
    }

    setLoading(true);
    try {
      await signUp(
        adminName.trim(),
        instituteName.trim(),
        email.trim().toLowerCase(),
        mobile.trim(),
        password.trim(),
        'principal'
      );
      showToast(`Congratulations! ${instituteName} has been registered successfully.`, 'success');
      navigate('/setup');
    } catch (err) {
      console.error('Registration Error:', err);
      let msg = err.message || 'Registration failed. Please check your details.';
      if (msg.includes('email-already-in-use')) {
        msg = 'This email is already registered. Please sign in or use a different email.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleInquirySubmit = (e) => {
    e.preventDefault();
    setInqSubmitted(true);
    showToast('Demo request received! Our software consultant will call you shortly.', 'success');
  };

  return (
    <div className="min-h-screen bg-[#070e1e] text-slate-100 font-sans selection:bg-[#316bf3] selection:text-white antialiased py-8 px-4 sm:px-6 flex flex-col justify-between">
      
      {/* ── Top Header Bar ── */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between pb-6 border-b border-white/10">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/signin')}>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#316bf3] to-[#1f108e] p-0.5 shadow-lg flex items-center justify-center">
            <div className="w-full h-full bg-[#0b152d] rounded-[14px] flex items-center justify-center text-blue-400">
              <School className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="font-black text-lg tracking-tight text-white">Smart School ERP</span>
            <p className="text-[11px] text-slate-400 font-medium">New School Onboarding</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/signin')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </button>
      </div>

      {/* ── Main Registration Card ── */}
      <div className="max-w-3xl mx-auto w-full my-8 bg-[#0d1a38] border border-blue-500/20 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        
        {/* Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Title */}
        <div className="text-center space-y-2 mb-8 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Launch Your Campus in 2 Minutes</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Register Your School & Start Free Trial
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
            Get instant access to student records, fee collection with WhatsApp receipts, ID card studio, and attendance tracking.
          </p>
        </div>

        {/* Form Type Tabs */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-900 border border-white/10 mb-8 max-w-md mx-auto relative z-10">
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'register' ? 'bg-[#316bf3] text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Instant Self-Registration
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('demo_inquiry')}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'demo_inquiry' ? 'bg-[#316bf3] text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Schedule 1-on-1 Demo
          </button>
        </div>

        {/* Tab 1: Self-Service Registration */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-6 relative z-10 text-xs">
            
            {error && (
              <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* School & Admin Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-200 flex items-center gap-1.5">
                  <School className="w-3.5 h-3.5 text-blue-400" />
                  <span>School / Institute Name *</span>
                </label>
                <input
                  type="text"
                  required
                  value={instituteName}
                  onChange={(e) => setInstituteName(e.target.value)}
                  placeholder="e.g. Modern Public Academy"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-blue-400" />
                  <span>Institute Type</span>
                </label>
                <select
                  value={instituteType}
                  onChange={(e) => setInstituteType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="School">K-12 School (Nursery - 12th)</option>
                  <option value="Primary School">Primary / Middle School</option>
                  <option value="Coaching">Coaching / Tuition Center</option>
                  <option value="College">College / Higher Academy</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-200 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  <span>Principal / Administrator Full Name *</span>
                </label>
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Sharma"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WhatsApp / Mobile Number *</span>
                </label>
                <input
                  type="tel"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="e.g. 9876543210 (10 digits)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  <span>Official Email Address *</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. principal@modernschool.edu"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-200 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>City & State</span>
                </label>
                <input
                  type="text"
                  value={cityState}
                  onChange={(e) => setCityState(e.target.value)}
                  placeholder="e.g. Patna, Bihar or Jaipur, Rajasthan"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-purple-400" />
                  <span>Account Password *</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-900 border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-purple-400" />
                  <span>Confirm Password *</span>
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Plan Selector */}
            <div className="space-y-2 pt-2">
              <label className="font-bold text-slate-200 flex items-center justify-between">
                <span>Select Your Subscription Tier</span>
                <span className="text-[11px] text-blue-400">Can be upgraded anytime</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {plans.map((p) => {
                  const isSelected = selectedPlan === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPlan(p.id)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-600/20 border-blue-400 shadow-md ring-2 ring-blue-500/30'
                          : 'bg-slate-900 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${p.badgeColor}`}>
                          {p.badge}
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                      </div>
                      <div className="font-bold text-white text-sm">{p.name}</div>
                      <div className="text-base font-black text-white mt-1">
                        {p.price} <span className="text-[10px] text-slate-400 font-normal">{p.period}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium mt-1">{p.students}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Submit CTA */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl font-black text-sm text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-orange-400 hover:brightness-105 shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Create School Account & Launch Dashboard</span>
                  </>
                )}
              </button>
              <p className="text-[11px] text-slate-400 text-center mt-2.5">
                By registering, you agree to our Terms of Service. Your data is 100% private and protected.
              </p>
            </div>

          </form>
        )}

        {/* Tab 2: Guided Demo Request */}
        {activeTab === 'demo_inquiry' && (
          <div className="relative z-10 text-xs">
            {inqSubmitted ? (
              <div className="p-8 text-center space-y-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h3 className="text-xl font-bold text-white">Thank You for Your Interest!</h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
                  Our educational software consultant will contact you via WhatsApp / Phone within 30 minutes to conduct a personalized demo.
                </p>
                <div className="pt-2">
                  <a
                    href="https://wa.me/919162724680?text=Hello%2C%20I%20have%20submitted%20a%20demo%20request%20for%20Smart%20School%20ERP."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Chat on WhatsApp Directly</span>
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-200">School / Academy Name *</label>
                    <input
                      type="text"
                      required
                      value={inqSchoolName}
                      onChange={(e) => setInqSchoolName(e.target.value)}
                      placeholder="e.g. St. Xavier International"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-200">Contact Person Name & Designation *</label>
                    <input
                      type="text"
                      required
                      value={inqContactName}
                      onChange={(e) => setInqContactName(e.target.value)}
                      placeholder="e.g. Amit Kumar (Director)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-200">WhatsApp / Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      value={inqPhone}
                      onChange={(e) => setInqPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-200">Approx. Number of Students</label>
                    <select
                      value={inqStudentsCount}
                      onChange={(e) => setInqStudentsCount(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="Under 100">Under 100 Students</option>
                      <option value="100-300">100 to 300 Students</option>
                      <option value="300-800">300 to 800 Students</option>
                      <option value="800+">800+ Students (Multi-Wing)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-200">City / District & State *</label>
                  <input
                    type="text"
                    required
                    value={inqCity}
                    onChange={(e) => setInqCity(e.target.value)}
                    placeholder="e.g. Lucknow, Uttar Pradesh"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-200">Any Specific Requirements or Questions?</label>
                  <textarea
                    rows={3}
                    value={inqMessage}
                    onChange={(e) => setInqMessage(e.target.value)}
                    placeholder="e.g. Need WhatsApp fee reminders and custom admit cards for 500 students..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl font-black text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Request Free 1-on-1 Consultation & Demo</span>
                </button>
              </form>
            )}
          </div>
        )}

      </div>

      {/* ── Footer Link ── */}
      <div className="max-w-5xl mx-auto w-full text-center text-xs text-slate-400 pt-4">
        Already have an active school account?{' '}
        <button
          onClick={() => navigate('/signin')}
          className="font-bold text-blue-400 hover:underline inline-flex items-center gap-1"
        >
          <span>Sign In Here</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
}
