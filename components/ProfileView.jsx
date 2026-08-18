'use client';

import React, { useState } from 'react';
import { useSchoolStore } from '../lib/store';
import { User, ShieldCheck, Mail, Building, Key, Save, AlertCircle } from 'lucide-react';

export default function ProfileView() {
  const { currentUser, resetUserPassword } = useSchoolStore();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!currentUser) return null;

  const handlePasswordChange = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (oldPassword !== currentUser.password) {
      setErrorMsg("Incorrect current password");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg("New password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("New passwords do not match");
      return;
    }

    resetUserPassword(currentUser.uid, newPassword);
    setSuccessMsg("Password changed successfully!");
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl animate-in fade-in duration-200">
      <div>
        <h2 className="text-xl lg:text-2xl font-bold text-text tracking-tight">My Profile</h2>
        <p className="text-xs text-text-secondary mt-0.5 font-medium font-sans">View your credentials and manage login security credentials.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Side: Info Card */}
        <div className="md:col-span-5 bg-white border border-border rounded-2xl p-6 shadow-sm flex flex-col items-center text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-2xl shadow-sm border border-primary/20">
            {currentUser.name?.substring(0, 2).toUpperCase()}
          </div>

          <div>
            <h3 className="font-bold text-lg text-text leading-snug">{currentUser.name}</h3>
            <p className="text-xs text-text-secondary font-medium font-sans mt-0.5">{currentUser.email}</p>
          </div>

          <div className="w-full space-y-2 border-t border-border pt-4 text-xs font-semibold text-text-secondary text-left">
            <div className="flex items-center gap-2.5 py-1">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>Role: </span>
              <span className="text-text capitalize">{currentUser.role === 'principal' ? 'Principal / Admin' : 'Teacher'}</span>
            </div>
            <div className="flex items-center gap-2.5 py-1">
              <Building className="w-4 h-4 text-primary" />
              <span>Institute: </span>
              <span className="text-text">{currentUser.instituteName || 'Apex Academy'}</span>
            </div>
            <div className="flex items-center gap-2.5 py-1">
              <Mail className="w-4 h-4 text-primary" />
              <span>Status: </span>
              <span className="text-emerald-600 uppercase text-[9px] font-bold bg-emerald-50 px-2 py-0.5 rounded">Active</span>
            </div>
          </div>
        </div>

        {/* Right Side: Password Form */}
        <div className="md:col-span-7 bg-white border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-text flex items-center gap-2 border-b border-border pb-2">
            <Key className="w-5 h-5 text-primary" />
            <span>Change Password</span>
          </h3>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4 text-xs font-semibold text-text-secondary">
            <div>
              <label className="block mb-1 text-text">Current Password</label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface2 border border-border text-text font-semibold focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block mb-1 text-text">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full px-3 py-2 rounded-xl bg-surface2 border border-border text-text font-semibold focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block mb-1 text-text">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface2 border border-border text-text font-semibold focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Update Password</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
