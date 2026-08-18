'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSchoolStore } from '../lib/store';
import {
  Menu, Search, Plus, CreditCard, Clock, Calendar, ShieldCheck,
  UserCheck, Bell, ChevronDown, User, Settings, Key, LogOut, X, ShieldAlert,
  Wifi, WifiOff, RefreshCw, CheckCircle2, AlertCircle
} from 'lucide-react';

export default function Header({ onMenuClick }) {
  const {
    settings,
    stats,
    themeMode,
    toggleTheme,
    setIsAddStudentOpen,
    setIsGlobalSearchOpen,
    currentUser,
    logout,
    currentPath,
    navigate,
    syncStatus
  } = useSchoolStore();

  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState(new Date());
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  if (!currentUser) return null;

  const viewTitles = {
    '/dashboard': 'Dashboard',
    '/students': 'Student Directory',
    '/fees': 'Fees & Collections',
    '/attendance': 'Daily Attendance',
    '/results': 'Exam Results',
    '/idcards': 'ID Cards Studio',
    '/teachers': 'Faculty Management',
    '/reports': 'Report Center',
    '/qrscanner': 'QR Scanner',
    '/settings': 'System Settings',
    '/communication': 'Communication Center',
    '/users': 'User Account Management',
    '/profile': 'My Account Profile',
    '/setup': 'Initial Setup Wizard',
    '/access-denied': 'Access Restrained'
  };

  const isPrincipal = currentUser.role === 'principal';

  const handleLogoutConfirm = () => {
    setIsLogoutModalOpen(false);
    logout();
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-5 lg:px-8 h-16 w-full bg-white/90 backdrop-blur-md border-b border-border shadow-sm">
      
      {/* Left */}
      <div className="flex items-center gap-4 min-w-0">
        <button onClick={onMenuClick} className="lg:hidden p-2 rounded-xl bg-surface2 hover:bg-border text-text transition-colors cursor-pointer">
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-text truncate">{viewTitles[currentPath] || 'Dashboard'}</h1>
          <p className="text-xs text-text-secondary font-semibold truncate hidden sm:block">
            {settings.instituteName || 'Apex Academy'} &nbsp;·&nbsp; Session {settings.currentSession || '2026-27'}
          </p>
        </div>
      </div>

      {/* Center — Search */}
      <button
        onClick={() => setIsGlobalSearchOpen(true)}
        className="hidden md:flex flex-1 max-w-sm h-10 items-center gap-2.5 px-4 rounded-full bg-[#eff4ff] border border-[#c8c4d5]/50 text-[#777584] text-xs hover:border-[#1f108e]/50 hover:bg-white transition-all cursor-pointer group shadow-2xs"
      >
        <Search className="w-4 h-4 text-[#777584] group-hover:text-[#1f108e] transition-colors flex-shrink-0" />
        <span className="truncate text-left text-xs font-medium group-hover:text-[#0b1c30]">Search students, roll no, fees…</span>
        <span className="ml-auto text-[10px] bg-white border border-[#c8c4d5]/60 rounded px-1.5 py-0.5 font-mono text-[#777584] font-bold shadow-2xs">⌃ K</span>
      </button>

      {/* Right */}
      <div className="flex items-center gap-4 flex-shrink-0">
        {/* Date & Time */}
        {mounted && (
          <div className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl bg-surface2 border border-border text-xs font-bold text-text">
            <Calendar className="w-4 h-4 text-primary" />
            <span>{time.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
            <span className="text-text-muted mx-1">·</span>
            <Clock className="w-4 h-4 text-primary" />
            <span>{time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()}</span>
          </div>
        )}

        {/* Add Student */}
        <button
          onClick={() => setIsAddStudentOpen(true)}
          className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden lg:inline">Add Student</span>
        </button>

        {/* Firebase Sync Status Indicator */}
        {(() => {
          const configs = {
            synced:       { icon: CheckCircle2, label: 'Live', cls: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
            syncing:      { icon: RefreshCw,    label: 'Syncing…', cls: 'text-blue-600 bg-blue-50 border-blue-200 animate-pulse' },
            reconnecting: { icon: WifiOff,      label: 'Reconnecting…', cls: 'text-amber-600 bg-amber-50 border-amber-200 animate-pulse' },
            cached:       { icon: Wifi,         label: 'Cached', cls: 'text-slate-500 bg-slate-50 border-slate-200' },
            error:        { icon: AlertCircle,  label: 'Sync Error', cls: 'text-rose-600 bg-rose-50 border-rose-200' },
          };
          const cfg = configs[syncStatus] || configs.syncing;
          const Icon = cfg.icon;
          return (
            <div
              title={`Firebase sync: ${syncStatus}`}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold transition-all ${cfg.cls}`}
            >
              <Icon className="w-3 h-3" />
              <span className="hidden lg:inline">{cfg.label}</span>
            </div>
          );
        })()}

        {/* User Info Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(p => !p)}
            className="flex items-center gap-2.5 pl-2 border-l border-border hover:opacity-85 transition-opacity cursor-pointer text-left"
          >
            <div className="w-10 h-10 rounded-full border border-border bg-primary/10 text-primary flex items-center justify-center font-bold text-sm overflow-hidden flex-shrink-0 shadow-2xs">
              {currentUser.photoPath ? (
                <img src={currentUser.photoPath} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                currentUser.name?.substring(0, 2).toUpperCase()
              )}
            </div>
            <div className="hidden lg:block leading-none">
              <p className="font-bold text-xs text-text">{currentUser.name}</p>
              <p className="text-[10px] text-text-secondary mt-0.5 capitalize">{currentUser.role === 'principal' ? 'Principal / Admin' : 'Teacher'}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-text-secondary hidden lg:block" />
          </button>

          {/* Premium Dropdown menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-2xl shadow-xl py-2 overflow-hidden text-xs z-50 animate-in fade-in slide-in-from-top-3 duration-200">
              {/* Profile Card Header */}
              <div className="px-4 py-3 border-b border-border space-y-1">
                <p className="font-bold text-text leading-tight">{currentUser.name}</p>
                <p className="text-[10px] text-text-secondary font-mono">{currentUser.email}</p>
                <div className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-primary/15 text-primary text-[9px] font-bold uppercase tracking-wider font-mono">
                  {currentUser.role === 'principal' ? 'Admin Access' : 'Teacher Access'}
                </div>
              </div>

              {/* Options */}
              <div className="p-1 space-y-0.5 font-semibold text-text-secondary">
                <button
                  onClick={() => { setIsDropdownOpen(false); navigate('/profile'); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-surface2 hover:text-text text-left transition-colors cursor-pointer"
                >
                  <User className="w-4 h-4 text-primary" />
                  <span>My Profile</span>
                </button>

                {isPrincipal && (
                  <button
                    onClick={() => { setIsDropdownOpen(false); navigate('/settings'); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-surface2 hover:text-text text-left transition-colors cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-primary" />
                    <span>Account Settings</span>
                  </button>
                )}

                <button
                  onClick={() => { setIsDropdownOpen(false); navigate('/profile'); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-surface2 hover:text-text text-left transition-colors cursor-pointer"
                >
                  <Key className="w-4 h-4 text-primary" />
                  <span>Change Password</span>
                </button>

                <div className="border-t border-border my-1" />

                <button
                  onClick={() => { setIsDropdownOpen(false); setIsLogoutModalOpen(true); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-rose-500/10 text-rose-600 hover:text-rose-700 text-left transition-colors cursor-pointer font-bold"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── SECURE LOGOUT CONFIRMATION MODAL ─── */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200 shadow-xs animate-pulse">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-text">Are you sure you want to logout?</h3>
                <p className="text-[10px] text-text-secondary">Your active administrative session will be terminated.</p>
              </div>
            </div>
            <div className="flex border-t border-border text-xs font-bold divide-x divide-border">
              <button
                onClick={() => setIsLogoutModalOpen(false)}
                className="flex-1 py-3 text-center text-text-secondary hover:bg-surface2 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleLogoutConfirm}
                className="flex-1 py-3 text-center text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer font-extrabold"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
