'use client';

import React, { useState, useEffect } from 'react';
import { useSchoolStore } from '../lib/store';
import { translations } from '../lib/translations';
import {
  GraduationCap, Mail, Lock, Eye, EyeOff, ShieldCheck,
  School, ArrowRight, AlertCircle, CheckCircle2,
  User, ChevronDown, ChevronRight, Phone, Hash, ArrowLeft, BookOpen,
  Users, CalendarCheck, CreditCard, Shield, FileText, CheckCircle,
  Award, Heart, Compass, Sparkles, Building, Quote, Check,
  Activity, Monitor, Trophy, HelpCircle, MapPin, Clock, MessageSquare,
  Globe, Briefcase, Menu, X, ExternalLink, Calendar, Star,
  TrendingUp, QrCode, CheckCircle as CheckIcon, Zap, Smartphone,
  Layers, Database, Laptop, Printer, UserCheck, PlayCircle
} from 'lucide-react';

export default function SignInView() {
  const {
    signIn,
    teacherSignIn,
    parentSignIn,
    demoSignIn,
    fetchSchoolTeachersByEmail,
    teachers,
    settings,
    currentUser,
    navigate,
    language = 'en',
    toggleLanguage,
    openEnquiriesModal,
    setIsEnquiriesModalOpen
  } = useSchoolStore();

  const isHi = language === 'hi';

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('principal'); // 'principal' | 'teacher' | 'parent'
  const [parentAdmissionNo, setParentAdmissionNo] = useState('');
  const [parentMobile, setParentMobile] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'

  // Generic SaaS Institution Details
  const appName = 'Smart School ERP';
  const appSubtitle = 'Institutional Cloud Management Software';
  const supportPhone = '+91 9162724680';
  const supportEmail = 'admin@smartschoolerp.com';
  const currentSession = settings?.currentSession || '2026-27';

  useEffect(() => {
    if (role === 'teacher' && email) {
      fetchSchoolTeachersByEmail(email).then(list => {
        if (list && list.length > 0) {
          setSelectedTeacherId(prev => {
            const match = list.find(t => (t.authUid || t.id) === prev);
            return match ? prev : (list[0].authUid || list[0].id || '');
          });
        }
      });
    }
  }, [role, email, fetchSchoolTeachersByEmail]);

  useEffect(() => {
    if (teachers && teachers.length > 0 && !selectedTeacherId) {
      setSelectedTeacherId(teachers[0].authUid || teachers[0].id || '');
    }
  }, [teachers, role, selectedTeacherId]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const openPortalLogin = (targetRole = 'principal') => {
    setRole(targetRole);
    setError('');
    setIsLoginModalOpen(true);
    setIsMobileMenuOpen(false);
  };

  const fillDemoCredentials = (targetRole) => {
    setRole(targetRole);
    setError('');
    if (targetRole === 'principal') {
      setEmail('admin@smartschoolerp.com');
      setPassword('admin123');
    } else if (targetRole === 'teacher') {
      setEmail('teacher@school.com');
      setPassword('teacher123');
    } else {
      setParentAdmissionNo('ADM-101');
      setParentMobile('9876543210');
    }
  };

  const handle1ClickInstantDemo = (targetRole) => {
    try {
      if (typeof demoSignIn === 'function') {
        demoSignIn(targetRole);
      } else {
        fillDemoCredentials(targetRole);
        setIsLoginModalOpen(true);
      }
    } catch (e) {
      console.warn('Demo login note:', e);
      fillDemoCredentials(targetRole);
      setIsLoginModalOpen(true);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (role === 'parent') {
        if (!parentAdmissionNo.trim()) {
          throw new Error('Please enter your child’s Admission No or Roll No.');
        }
        await parentSignIn(email.trim(), parentAdmissionNo.trim(), parentMobile.trim());
      } else if (role === 'teacher') {
        if (!email.trim() || !password.trim()) {
          throw new Error('Please enter School Email and Password.');
        }
        await teacherSignIn(email.trim(), selectedTeacherId, password.trim());
      } else {
        if (!email.trim() || !password.trim()) {
          throw new Error('Please enter registered Email and Password.');
        }
        await signIn(email.trim(), password.trim());
      }
      setIsLoginModalOpen(false);
    } catch (err) {
      console.error('Portal Login Error:', err);
      let userMsg = err.message || 'Login failed. Please check your credentials.';
      if (userMsg.includes('invalid-credential') || userMsg.includes('wrong-password') || userMsg.includes('user-not-found')) {
        userMsg = 'Invalid email or password. You can also use 1-Click Demo Login to explore.';
      }
      setError(userMsg);
    } finally {
      setLoading(false);
    }
  };

  const scrollToSection = (id) => {
    setIsMobileMenuOpen(false);
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#070e1e] text-slate-100 font-sans selection:bg-[#316bf3] selection:text-white antialiased">
      
      {/* ── 1. Top Announcement & Support Bar ── */}
      <div className="bg-gradient-to-r from-[#0d1a35] via-[#102747] to-[#0d1a35] border-b border-white/10 px-4 py-2 text-xs text-slate-300">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold text-[11px] border border-emerald-500/30">
              <Sparkles className="w-3 h-3" /> New Release 2026-27
            </span>
            <span className="hidden sm:inline text-slate-300">
              WhatsApp Fee Receipts, Automated Admit Cards & Mobile QR Attendance Engine Live!
            </span>
          </div>
          <div className="flex items-center gap-4 text-[12px] font-medium ml-auto">
            <a
              href={`https://wa.me/919162724680?text=${encodeURIComponent('Hello, I am interested in Smart School ERP software for my school.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp Sales: {supportPhone}</span>
            </a>
            <button
              onClick={() => openPortalLogin('principal')}
              className="text-[#5b95ff] hover:text-white transition-colors hidden md:inline font-semibold"
            >
              Portal Login →
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Primary Navigation Header ── */}
      <header className="sticky top-0 z-40 bg-[#070e1e]/90 backdrop-blur-xl border-b border-white/10 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#316bf3] via-[#1f108e] to-[#7928ca] p-0.5 shadow-lg shadow-blue-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-[#0b152d] rounded-[14px] flex items-center justify-center text-blue-400">
                <School className="w-6 h-6" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xl tracking-tight text-white">{appName}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950">
                  Cloud ERP
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block font-medium">
                Multi-Tenant Institutional Management System
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-slate-300">
            <button onClick={() => scrollToSection('features')} className="hover:text-blue-400 transition-colors">
              Features
            </button>
            <button onClick={() => scrollToSection('subscriptions')} className="hover:text-blue-400 transition-colors flex items-center gap-1">
              Pricing & Plans
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                ₹0 Trial
              </span>
            </button>
            <button onClick={() => scrollToSection('demo')} className="hover:text-blue-400 transition-colors">
              1-Click Demo
            </button>
            <button onClick={() => scrollToSection('onboarding')} className="hover:text-blue-400 transition-colors">
              How It Works
            </button>
            <button onClick={() => navigate('/setup-wizard')} className="hover:text-blue-400 transition-colors">
              Setup Wizard
            </button>
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={() => handle1ClickInstantDemo('principal')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <PlayCircle className="w-3.5 h-3.5 text-blue-400" />
              <span>Live Demo</span>
            </button>
            <button
              onClick={() => openPortalLogin('principal')}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all shadow-sm"
            >
              School Login
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#316bf3] to-[#1f108e] hover:brightness-110 shadow-lg shadow-blue-600/30 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Register School</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-slate-300 hover:text-white focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-[#0a1428] border-b border-white/10 px-4 py-6 space-y-4 animate-in slide-in-from-top-4 duration-200">
            <div className="flex flex-col gap-3 font-semibold text-sm text-slate-200">
              <button onClick={() => scrollToSection('features')} className="text-left py-2 border-b border-white/5">
                Features Overview
              </button>
              <button onClick={() => scrollToSection('subscriptions')} className="text-left py-2 border-b border-white/5 flex items-center justify-between">
                <span>Subscriptions & Pricing</span>
                <span className="px-2 py-0.5 text-[10px] rounded-full bg-blue-500/20 text-blue-300">Free ₹0</span>
              </button>
              <button onClick={() => scrollToSection('demo')} className="text-left py-2 border-b border-white/5">
                1-Click Interactive Demo
              </button>
              <button onClick={() => scrollToSection('onboarding')} className="text-left py-2 border-b border-white/5">
                Onboarding & Setup
              </button>
              <button onClick={() => { setIsMobileMenuOpen(false); navigate('/setup-wizard'); }} className="text-left py-2 border-b border-white/5 text-blue-400">
                Setup Wizard (/setup-wizard)
              </button>
            </div>
            
            <div className="pt-2 flex flex-col gap-2.5">
              <button
                onClick={() => { setIsMobileMenuOpen(false); handle1ClickInstantDemo('principal'); }}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-blue-600/20 text-blue-300 border border-blue-500/30 flex items-center justify-center gap-2"
              >
                <PlayCircle className="w-4 h-4 text-blue-400" />
                <span>Test Live Demo (1-Click)</span>
              </button>
              <button
                onClick={() => openPortalLogin('principal')}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-white/10 text-white border border-white/10"
              >
                School Portal Login
              </button>
              <button
                onClick={() => { setIsMobileMenuOpen(false); navigate('/signup'); }}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-[#316bf3] to-[#1f108e] text-white shadow-lg"
              >
                Register School & Start Free Trial
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ── 3. High-Converting Hero Section ── */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-blue-600/20 via-indigo-600/15 to-purple-600/20 blur-[130px] -z-0 pointer-events-none" />
        <div className="absolute top-1/3 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-[100px] -z-0 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-500/15 to-purple-500/15 border border-blue-400/30 text-blue-300 text-xs font-bold shadow-inner">
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>Next-Gen Cloud School Management ERP Platform</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12]">
              Everything Your School Needs to Run{' '}
              <span className="bg-gradient-to-r from-[#4f8eff] via-[#60a5fa] to-[#a78bfa] bg-clip-text text-transparent">
                Smarter, Faster & Paperless
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
              Complete multi-school ERP software for modern schools, colleges, and coaching academies.
              Manage student admissions, fee counters with instant WhatsApp alerts, daily attendance,
              report cards, ID & admit card studios, and Android app synchronization in one unified dashboard.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3.5 pt-3">
              <button
                onClick={() => handle1ClickInstantDemo('principal')}
                className="px-6 py-3.5 rounded-2xl font-black text-sm text-slate-950 bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 hover:brightness-105 shadow-xl shadow-amber-500/20 transition-all flex items-center gap-2 transform hover:-translate-y-0.5 cursor-pointer"
              >
                <PlayCircle className="w-5 h-5 text-slate-950" />
                <span>Try 1-Click Live Demo</span>
              </button>

              <button
                onClick={() => navigate('/signup')}
                className="px-6 py-3.5 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-[#316bf3] to-[#1f108e] hover:brightness-110 shadow-xl shadow-blue-600/30 transition-all flex items-center gap-2 transform hover:-translate-y-0.5 cursor-pointer"
              >
                <School className="w-5 h-5 text-blue-200" />
                <span>Register School (Free Trial)</span>
              </button>

              <button
                onClick={() => openPortalLogin('principal')}
                className="px-5 py-3.5 rounded-2xl font-bold text-sm text-slate-200 bg-white/5 hover:bg-white/10 border border-white/15 transition-all flex items-center gap-2"
              >
                <Lock className="w-4 h-4 text-slate-400" />
                <span>Portal Login</span>
              </button>
            </div>

            {/* Value Checkpoints */}
            <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-6 pt-4 text-xs font-semibold text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Separate School Database & ID</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Instant WhatsApp Automation</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Print-Ready ID & Admit Cards</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>No Installation Needed</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 4. 1-Click Interactive Demo Bar (Test Drive Desk) ── */}
      <section id="demo" className="py-10 bg-gradient-to-b from-[#0b162f] to-[#070e1e] border-y border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-br from-[#122247] via-[#0d1a38] to-[#16274e] border border-blue-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
              <div className="space-y-1.5 text-center lg:text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 font-bold text-xs border border-blue-500/30">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Instant Test Drive
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Experience the Full ERP in Action — No Password Needed
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                  Click any role below to launch the pre-configured live interactive simulation with sample students, fee receipts, and marksheet desks.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => handle1ClickInstantDemo('principal')}
                  className="px-4 py-3 rounded-2xl bg-[#1f3769] hover:bg-[#254382] border border-blue-400/30 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-all transform hover:-translate-y-0.5"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Test as Principal / Admin</span>
                </button>

                <button
                  onClick={() => handle1ClickInstantDemo('teacher')}
                  className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-all transform hover:-translate-y-0.5"
                >
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>Test as Faculty Desk</span>
                </button>

                <button
                  onClick={() => handle1ClickInstantDemo('parent')}
                  className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-all transform hover:-translate-y-0.5"
                >
                  <User className="w-4 h-4 text-purple-400" />
                  <span>Test as Parent Portal</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Subscriptions & Pricing Plans Section ── */}
      <section id="subscriptions" className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-500/15 text-blue-300 font-bold text-xs border border-blue-500/30">
            <CreditCard className="w-3.5 h-3.5 text-blue-400" />
            <span>Affordable Plans for Every School</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Transparent Pricing with No Hidden Charges
          </h2>
          <p className="text-sm sm:text-base text-slate-300">
            Start completely free with up to 10 students. Upgrade easily as your campus enrollment grows.
          </p>

          {/* Billing Cycle Switch */}
          <div className="inline-flex items-center p-1 rounded-2xl bg-slate-800/80 border border-white/10 mt-2">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                billingCycle === 'monthly' ? 'bg-[#316bf3] text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                billingCycle === 'yearly' ? 'bg-[#316bf3] text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Annual Billing</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-400 text-slate-950 font-black">
                Save 25%
              </span>
            </button>
          </div>
        </div>

        {/* 4 Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Plan 1: Free Trial */}
          <div className="bg-[#0b162f] border border-white/10 rounded-3xl p-6 flex flex-col justify-between hover:border-blue-500/40 transition-all hover:shadow-xl hover:shadow-blue-500/5 group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  Test Drive
                </span>
                <span className="text-xs text-slate-400 font-semibold">Max 10 Students</span>
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Free Trial</h3>
                <p className="text-xs text-slate-400 mt-1">Perfect for trying out all ERP features before onboarding.</p>
              </div>
              <div className="pt-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">₹0</span>
                  <span className="text-xs text-slate-400 font-medium">/ forever</span>
                </div>
              </div>
              <ul className="space-y-2.5 pt-4 border-t border-white/5 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Up to 10 Student Admissions</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Mark Entry Desk & Marksheets</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Fee Collection & Printed Receipts</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>ID Card & Admit Card Studio</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Daily Roll & Attendance</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => navigate('/signup')}
              className="mt-6 w-full py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-all"
            >
              Start Free Trial
            </button>
          </div>

          {/* Plan 2: Starter */}
          <div className="bg-[#0b162f] border border-white/10 rounded-3xl p-6 flex flex-col justify-between hover:border-blue-500/40 transition-all hover:shadow-xl hover:shadow-blue-500/5 group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Affordable
                </span>
                <span className="text-xs text-slate-400 font-semibold">Up to 50 Students</span>
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Starter Plan</h3>
                <p className="text-xs text-slate-400 mt-1">Ideal for small coaching centers and primary schools.</p>
              </div>
              <div className="pt-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">
                    {billingCycle === 'monthly' ? '₹199' : '₹1,790'}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {billingCycle === 'monthly' ? '/ month' : '/ year'}
                  </span>
                </div>
              </div>
              <ul className="space-y-2.5 pt-4 border-t border-white/5 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Up to 50 Student Admissions</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Class & Batch Management</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Automated Monthly Fee Dues Tracker</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>WhatsApp Payment Reminders</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Cloud Backup & WhatsApp Support</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => navigate('/signup')}
              className="mt-6 w-full py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-all"
            >
              Choose Starter
            </button>
          </div>

          {/* Plan 3: Standard (Featured) */}
          <div className="bg-gradient-to-b from-[#122247] to-[#0d1a38] border-2 border-blue-500 rounded-3xl p-6 flex flex-col justify-between shadow-xl shadow-blue-500/10 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow">
              Most Popular
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Standard School
                </span>
                <span className="text-xs text-blue-200 font-semibold">Up to 250 Students</span>
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Standard School</h3>
                <p className="text-xs text-slate-300 mt-1">Recommended for high schools, academies & institutes.</p>
              </div>
              <div className="pt-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">
                    {billingCycle === 'monthly' ? '₹499' : '₹4,490'}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {billingCycle === 'monthly' ? '/ month' : '/ year'}
                  </span>
                </div>
              </div>
              <ul className="space-y-2.5 pt-4 border-t border-white/10 text-xs text-slate-200">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Up to 250 Student Admissions</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Timetable & Schedule Generator</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Custom Admit Cards & ID Studio</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Teacher Permissions & Roles</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Priority Phone & WhatsApp Support</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => navigate('/signup')}
              className="mt-6 w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 hover:brightness-105 shadow-lg transition-all"
            >
              Get Standard Plan
            </button>
          </div>

          {/* Plan 4: Pro Unlimited */}
          <div className="bg-[#0b162f] border border-white/10 rounded-3xl p-6 flex flex-col justify-between hover:border-purple-500/40 transition-all hover:shadow-xl hover:shadow-purple-500/5 group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Unlimited
                </span>
                <span className="text-xs text-purple-300 font-semibold">Unlimited Students</span>
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Pro Unlimited</h3>
                <p className="text-xs text-slate-400 mt-1">For large schools, colleges, and multi-branch campuses.</p>
              </div>
              <div className="pt-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">
                    {billingCycle === 'monthly' ? '₹999' : '₹8,990'}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {billingCycle === 'monthly' ? '/ month' : '/ year'}
                  </span>
                </div>
              </div>
              <ul className="space-y-2.5 pt-4 border-t border-white/5 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Unlimited Student Capacity</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Multi-Teacher & Staff Logins</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Custom Branding & Logo Printing</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Full WhatsApp Automation Engine</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>24/7 Dedicated Account Manager</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => navigate('/signup')}
              className="mt-6 w-full py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg transition-all"
            >
              Go Unlimited
            </button>
          </div>

        </div>
      </section>

      {/* ── 6. 12 Core ERP Modules Grid ── */}
      <section id="features" className="py-20 bg-[#0a1329] border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-500/15 text-blue-300 font-bold text-xs border border-blue-500/30">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>Complete Campus Suite</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Powerful Modules Built Specifically for Indian Schools
            </h2>
            <p className="text-sm sm:text-base text-slate-300">
              Replace disorganized spreadsheets and register books with a modern, integrated digital management ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* 1. Admissions & Students */}
            <div className="bg-[#0e1b38] border border-white/10 p-6 rounded-3xl hover:border-blue-500/40 transition-all hover:shadow-lg">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Student Information & Admissions</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Complete student records with photos, blood group, parent details, category, admission numbers, roll numbers, and multi-format Excel exports.
              </p>
            </div>

            {/* 2. Fee Counter */}
            <div className="bg-[#0e1b38] border border-white/10 p-6 rounded-3xl hover:border-emerald-500/40 transition-all hover:shadow-lg">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-4">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Smart Fee Counter & WhatsApp Receipts</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Instant fee collection desk with automated receipt numbering, due amounts tracking, printable receipts, and 1-click WhatsApp payment reminders.
              </p>
            </div>

            {/* 3. Attendance & QR Scanner */}
            <div className="bg-[#0e1b38] border border-white/10 p-6 rounded-3xl hover:border-amber-500/40 transition-all hover:shadow-lg">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center mb-4">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Daily Attendance & Mobile QR Scanner</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Mark class-wise attendance in seconds. Scan student QR codes directly with phone cameras for high-speed automated morning roll calls.
              </p>
            </div>

            {/* 4. Results & Marksheet */}
            <div className="bg-[#0e1b38] border border-white/10 p-6 rounded-3xl hover:border-purple-500/40 transition-all hover:shadow-lg">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/15 text-purple-400 flex items-center justify-center mb-4">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Examination & Marksheet Studio</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Configure exam terms, enter theory, practical & internal marks, compute percentage & division ranks, and print professional CBSE/State marksheets.
              </p>
            </div>

            {/* 5. ID Card Designer */}
            <div className="bg-[#0e1b38] border border-white/10 p-6 rounded-3xl hover:border-pink-500/40 transition-all hover:shadow-lg">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/15 text-pink-400 flex items-center justify-center mb-4">
                <Printer className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Student ID Card Studio</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Generate landscape and portrait ID cards with school logo, barcode/QR codes, student photo, guardian contact, and bulk print sheets.
              </p>
            </div>

            {/* 6. Admit Card Generator */}
            <div className="bg-[#0e1b38] border border-white/10 p-6 rounded-3xl hover:border-indigo-500/40 transition-all hover:shadow-lg">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Exam Admit Card Generator</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Create examination admit cards with exam dates, subjects, roll numbers, student photo, and instructions. Print single or class batches.
              </p>
            </div>

            {/* 7. Timetable Builder */}
            <div className="bg-[#0e1b38] border border-white/10 p-6 rounded-3xl hover:border-cyan-500/40 transition-all hover:shadow-lg">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Automated Timetable Builder</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Schedule weekly periods, allocate subject teachers and room numbers with conflict checks. Generate print-ready class schedules in one click.
              </p>
            </div>

            {/* 8. Staff Permissions */}
            <div className="bg-[#0e1b38] border border-white/10 p-6 rounded-3xl hover:border-rose-500/40 transition-all hover:shadow-lg">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-400 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Granular Teacher Permissions</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Principals can grant or restrict access per teacher: fee collection, marksheet entry, report export, or admit card printing with full audit logs.
              </p>
            </div>

            {/* 9. Notice Board & Audio Notes */}
            <div className="bg-[#0e1b38] border border-white/10 p-6 rounded-3xl hover:border-teal-500/40 transition-all hover:shadow-lg">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/15 text-teal-400 flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Notice Board & Audio Voice Notes</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Broadcast school circulars, holiday announcements, and record spoken audio memos that play instantly on the mobile app for parents and staff.
              </p>
            </div>

            {/* 10. Multi-School Architecture */}
            <div className="bg-[#0e1b38] border border-white/10 p-6 rounded-3xl hover:border-blue-500/40 transition-all hover:shadow-lg">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center mb-4">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Multi-School Isolated Architecture</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Every school gets its own isolated workspace and sequential ID (SCHOOL_001, SCHOOL_002...). No school can ever see another school’s data.
              </p>
            </div>

            {/* 11. Android App Real-time Sync */}
            <div className="bg-[#0e1b38] border border-white/10 p-6 rounded-3xl hover:border-green-500/40 transition-all hover:shadow-lg">
              <div className="w-12 h-12 rounded-2xl bg-green-500/15 text-green-400 flex items-center justify-center mb-4">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Real-Time Mobile App Sync</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Changes made on the web dashboard sync instantaneously to the Android app. Teachers and parents stay updated with real-time notifications.
              </p>
            </div>

            {/* 12. Offline Local Storage */}
            <div className="bg-[#0e1b38] border border-white/10 p-6 rounded-3xl hover:border-yellow-500/40 transition-all hover:shadow-lg">
              <div className="w-12 h-12 rounded-2xl bg-yellow-500/15 text-yellow-400 flex items-center justify-center mb-4">
                <Laptop className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Offline Ready + Cloud Backup</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Continue working smoothly even during internet outages using local offline fallback cache, with automatic cloud sync once reconnected.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── 7. How Onboarding Works (3 Simple Steps) ── */}
      <section id="onboarding" className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-500/15 text-blue-300 font-bold text-xs border border-blue-500/30">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Fast Setup in 10 Minutes</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            How Schools Onboard to Smart School ERP
          </h2>
          <p className="text-sm sm:text-base text-slate-300">
            Getting your entire school digitized is as easy as 1, 2, 3.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          
          {/* Step 1 */}
          <div className="bg-[#0b162f] border border-white/10 rounded-3xl p-8 relative space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              1
            </div>
            <h3 className="text-xl font-bold text-white">Register School Profile</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Click “Register School” and enter your institute name, principal details, and pick an academic year. Your unique School ID is generated instantly.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-[#0b162f] border border-white/10 rounded-3xl p-8 relative space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              2
            </div>
            <h3 className="text-xl font-bold text-white">Configure in Setup Wizard</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Use our guided Setup Wizard to configure classes (Nursery to 12th), sections, fee structures, and grading systems in just a few clicks.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-[#0b162f] border border-white/10 rounded-3xl p-8 relative space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              3
            </div>
            <h3 className="text-xl font-bold text-white">Go Live Immediately</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Add student records, generate ID cards, print fee receipts, and mark attendance from any laptop, tablet, or smartphone!
            </p>
          </div>

        </div>

        <div className="mt-12 text-center">
          <button
            onClick={() => navigate('/signup')}
            className="px-8 py-4 rounded-2xl font-black text-sm text-slate-950 bg-gradient-to-r from-amber-400 to-orange-400 hover:brightness-105 shadow-xl transition-all inline-flex items-center gap-2 transform hover:-translate-y-0.5"
          >
            <Sparkles className="w-5 h-5" />
            <span>Register Your School & Start Free Trial</span>
          </button>
        </div>
      </section>

      {/* ── 8. Dedicated School Portal Login Modal ── */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0e1b38] border border-blue-500/30 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 relative">
            
            {/* Close Button */}
            <button
              onClick={() => setIsLoginModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="space-y-1 text-center pr-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto mb-2 border border-blue-500/30">
                <School className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">Institutional Portal Login</h2>
              <p className="text-xs text-slate-300">Select your account role to access your designated workspace</p>
            </div>

            {/* Role Switch Tabs */}
            <div className="grid grid-cols-3 p-1 rounded-2xl bg-slate-900 border border-white/10">
              <button
                type="button"
                onClick={() => { setRole('principal'); setError(''); }}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  role === 'principal' ? 'bg-[#316bf3] text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Principal
              </button>
              <button
                type="button"
                onClick={() => { setRole('teacher'); setError(''); }}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  role === 'teacher' ? 'bg-[#316bf3] text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Teacher
              </button>
              <button
                type="button"
                onClick={() => { setRole('parent'); setError(''); }}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  role === 'parent' ? 'bg-[#316bf3] text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Parent
              </button>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              
              {role === 'parent' ? (
                <>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-200">School Code or Email (Optional)</label>
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. SCHOOL_001 or leave blank for default"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-200">Student Admission No or Roll No *</label>
                    <input
                      type="text"
                      required
                      value={parentAdmissionNo}
                      onChange={(e) => setParentAdmissionNo(e.target.value)}
                      placeholder="e.g. ADM-101 or 14"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-200">Registered Parent Mobile Number (Optional)</label>
                    <input
                      type="tel"
                      value={parentMobile}
                      onChange={(e) => setParentMobile(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-200">
                      {role === 'principal' ? 'Administrator / School Email *' : 'School Email / Teacher ID *'}
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={role === 'principal' ? 'admin@smartschoolerp.com' : 'teacher@school.com'}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {role === 'teacher' && teachers && teachers.length > 0 && (
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-200">Select Teacher Profile *</label>
                      <select
                        value={selectedTeacherId}
                        onChange={(e) => setSelectedTeacherId(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white focus:outline-none focus:border-blue-500"
                      >
                        {teachers.map((t) => (
                          <option key={t.authUid || t.id} value={t.authUid || t.id}>
                            {t.name} (Class {t.assignedClass || 'General'})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-200">Password *</label>
                      {role === 'principal' && (
                        <button
                          type="button"
                          onClick={() => { setIsLoginModalOpen(false); navigate('/forgot-password'); }}
                          className="text-[11px] text-blue-400 hover:underline"
                        >
                          Forgot Password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
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
                </>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-black text-white bg-gradient-to-r from-[#316bf3] to-[#1f108e] hover:brightness-110 shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Login to {role === 'principal' ? 'Admin Portal' : role === 'teacher' ? 'Faculty Desk' : 'Parent Portal'}</span>
                  </>
                )}
              </button>

              {/* Auto Fill Demo Button */}
              <button
                type="button"
                onClick={() => fillDemoCredentials(role)}
                className="w-full py-2 rounded-xl text-xs font-bold text-amber-400 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 transition-all"
              >
                ⚡ Auto-Fill Demo Credentials ({role.toUpperCase()})
              </button>

              {/* Onboarding Link */}
              <div className="text-center pt-2 border-t border-white/10">
                <p className="text-xs text-slate-400">
                  New School?{' '}
                  <button
                    type="button"
                    onClick={() => { setIsLoginModalOpen(false); navigate('/signup'); }}
                    className="font-bold text-blue-400 hover:underline"
                  >
                    Register Your School Here (Free Trial)
                  </button>
                </p>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ── 9. Footer ── */}
      <footer className="bg-[#050b18] border-t border-white/10 pt-16 pb-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            
            {/* Col 1: Brand */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  <School className="w-4 h-4" />
                </div>
                <span className="font-black text-lg text-white">{appName}</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Cloud-based all-in-one School Management ERP Software empowering Indian educational institutions with modern automation.
              </p>
              <div className="pt-1 text-slate-300">
                <span className="font-bold text-white">Direct Sales & Support:</span><br />
                WhatsApp: {supportPhone}<br />
                Email: {supportEmail}
              </div>
            </div>

            {/* Col 2: ERP Modules */}
            <div className="space-y-2.5">
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Core Features</h4>
              <ul className="space-y-1.5">
                <li><button onClick={() => scrollToSection('features')} className="hover:text-white">Fee Counter & WhatsApp Dues</button></li>
                <li><button onClick={() => scrollToSection('features')} className="hover:text-white">Student ID Card Studio</button></li>
                <li><button onClick={() => scrollToSection('features')} className="hover:text-white">Exam Admit Card Generator</button></li>
                <li><button onClick={() => scrollToSection('features')} className="hover:text-white">CBSE/State Marksheet Desk</button></li>
                <li><button onClick={() => scrollToSection('features')} className="hover:text-white">Daily QR Roll Attendance</button></li>
                <li><button onClick={() => scrollToSection('features')} className="hover:text-white">Automated Timetable Builder</button></li>
              </ul>
            </div>

            {/* Col 3: Subscriptions & Portals */}
            <div className="space-y-2.5">
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Portals & Plans</h4>
              <ul className="space-y-1.5">
                <li><button onClick={() => scrollToSection('subscriptions')} className="hover:text-white">Free Trial (₹0)</button></li>
                <li><button onClick={() => scrollToSection('subscriptions')} className="hover:text-white">Starter Plan (₹199)</button></li>
                <li><button onClick={() => scrollToSection('subscriptions')} className="hover:text-white">Standard School (₹499)</button></li>
                <li><button onClick={() => scrollToSection('subscriptions')} className="hover:text-white">Pro Unlimited (₹999)</button></li>
                <li><button onClick={() => openPortalLogin('principal')} className="hover:text-white">Principal / Admin Login</button></li>
                <li><button onClick={() => openPortalLogin('teacher')} className="hover:text-white">Faculty / Teacher Desk</button></li>
              </ul>
            </div>

            {/* Col 4: Onboarding */}
            <div className="space-y-2.5">
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Get Started</h4>
              <p className="text-slate-400">
                Ready to transform your school into a smart paperless campus?
              </p>
              <button
                onClick={() => navigate('/signup')}
                className="w-full py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 shadow transition-all text-center block mt-2"
              >
                Register Your School Now
              </button>
              <button
                onClick={() => navigate('/setup-wizard')}
                className="w-full py-2 rounded-xl font-bold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-center block"
              >
                Launch Setup Wizard
              </button>
            </div>

          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
            <div>
              &copy; {new Date().getFullYear()} {appName}. All Rights Reserved. Built for Educational Excellence.
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <span>Secure Cloud Architecture</span>
              <span>•</span>
              <span>100% Data Isolation</span>
              <span>•</span>
              <span>Session {currentSession}</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
