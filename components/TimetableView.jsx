'use client';

import React, { useState, useEffect } from 'react';
import { useSchoolStore } from '../lib/store';
import {
  Calendar, Clock, Plus, Trash2, Printer, Download, BookOpen, User, Building, CheckCircle2, Share2, Save
} from 'lucide-react';

const defaultClassSchedule = {
  Monday: [
    { id: 1, period: 1, time: '09:00 AM - 09:45 AM', subject: 'Hindi', teacher: 'Ramesh Sir', room: '101' },
    { id: 2, period: 2, time: '09:45 AM - 10:30 AM', subject: 'English', teacher: 'Pooja Ma\'am', room: '101' },
    { id: 3, period: 3, time: '10:45 AM - 11:30 AM', subject: 'Mathematics', teacher: 'Vikram Sir', room: '101' },
    { id: 4, period: 4, time: '11:30 AM - 12:15 PM', subject: 'Science', teacher: 'Anjali Ma\'am', room: '101' },
    { id: 5, period: 5, time: '12:45 PM - 01:30 PM', subject: 'Social Studies', teacher: 'Sanjay Sir', room: '101' },
  ],
  Tuesday: [
    { id: 6, period: 1, time: '09:00 AM - 09:45 AM', subject: 'Mathematics', teacher: 'Vikram Sir', room: '101' },
    { id: 7, period: 2, time: '09:45 AM - 10:30 AM', subject: 'Science', teacher: 'Anjali Ma\'am', room: '101' },
    { id: 8, period: 3, time: '10:45 AM - 11:30 AM', subject: 'Hindi', teacher: 'Ramesh Sir', room: '101' },
  ],
  Wednesday: [
    { id: 9, period: 1, time: '09:00 AM - 09:45 AM', subject: 'English', teacher: 'Pooja Ma\'am', room: '101' },
    { id: 10, period: 2, time: '09:45 AM - 10:30 AM', subject: 'Computer Lab', teacher: 'Amit Sir', room: 'Lab 1' },
  ],
  Thursday: [
    { id: 11, period: 1, time: '09:00 AM - 09:45 AM', subject: 'Science', teacher: 'Anjali Ma\'am', room: '101' },
    { id: 12, period: 2, time: '09:45 AM - 10:30 AM', subject: 'Maths', teacher: 'Vikram Sir', room: '101' },
  ],
  Friday: [
    { id: 13, period: 1, time: '09:00 AM - 09:45 AM', subject: 'Social Studies', teacher: 'Sanjay Sir', room: '101' },
    { id: 14, period: 2, time: '09:45 AM - 10:30 AM', subject: 'Drawing & Art', teacher: 'Sunita Ma\'am', room: 'Art Room' },
  ],
  Saturday: [
    { id: 15, period: 1, time: '09:00 AM - 09:45 AM', subject: 'Physical Education', teacher: 'Rana Sir', room: 'Playground' },
    { id: 16, period: 2, time: '09:45 AM - 10:30 AM', subject: 'Moral Science', teacher: 'Principal Ma\'am', room: '101' },
  ],
};

export default function TimetableView() {
  const { settings, showToast } = useSchoolStore();
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const [activeDay, setActiveDay] = useState('Monday');
  const [selectedClass, setSelectedClass] = useState('10th');

  const schoolClasses = settings.schoolClasses && settings.schoolClasses.length > 0
    ? settings.schoolClasses
    : ['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];

  const [timetable, setTimetable] = useState(defaultClassSchedule);
  const [isAdding, setIsAdding] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newTeacher, setNewTeacher] = useState('');
  const [newTime, setNewTime] = useState('09:00 AM - 09:45 AM');
  const [newRoom, setNewRoom] = useState('101');
  const [currentTimeStr, setCurrentTimeStr] = useState('');

  // Load schedule for selected class from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`school_timetable_${selectedClass}`);
      if (stored) {
        setTimetable(JSON.parse(stored));
      } else {
        setTimetable(defaultClassSchedule);
      }
    } catch (e) {
      setTimetable(defaultClassSchedule);
    }
    setCurrentTimeStr(new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }));
  }, [selectedClass]);

  const handleSaveCurrentClass = (updatedData) => {
    const dataToSave = updatedData || timetable;
    setTimetable(dataToSave);
    try {
      localStorage.setItem(`school_timetable_${selectedClass}`, JSON.stringify(dataToSave));
      showToast(`Timetable for Class ${selectedClass} saved!`, 'success');
    } catch (e) {
      showToast('Error saving timetable', 'error');
    }
  };

  const handleAddPeriod = (e) => {
    e.preventDefault();
    if (!newSubject.trim()) {
      showToast('Subject name is required', 'error');
      return;
    }
    const currentList = timetable[activeDay] || [];
    const newEntry = {
      id: Date.now(),
      period: currentList.length + 1,
      time: newTime.trim(),
      subject: newSubject.trim(),
      teacher: newTeacher.trim() || 'Staff Faculty',
      room: newRoom.trim() || '101'
    };
    const updated = { ...timetable, [activeDay]: [...currentList, newEntry] };
    handleSaveCurrentClass(updated);
    setNewSubject('');
    setNewTeacher('');
    setIsAdding(false);
  };

  const handleDeletePeriod = (id) => {
    const currentList = timetable[activeDay] || [];
    const updated = {
      ...timetable,
      [activeDay]: currentList.filter(item => item.id !== id)
    };
    handleSaveCurrentClass(updated);
    showToast('Period removed', 'info');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Class ${selectedClass} Timetable - ${settings.instituteName || 'School'}`,
          text: `Official Routine & Weekly Timetable for Class ${selectedClass}. Generated on ${currentTimeStr}`,
          url: window.location.href,
        });
      } catch (e) { }
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Link copied to clipboard for sharing!', 'success');
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Controls (Hidden on Print) */}
      <div className="print:hidden flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-border shadow-xs">
        <div>
          <h1 className="text-xl font-black text-text flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" />
            Class Routine & Weekly Timetable
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Configure periods, assign subject teachers, and export class schedules.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-surface2 px-3 py-1.5 rounded-xl border border-border">
            <span className="text-xs font-bold text-text-secondary">Class:</span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-transparent text-xs font-bold text-primary focus:outline-none cursor-pointer"
            >
              {schoolClasses.map(c => (
                <option key={c} value={c}>Class {c}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleShare}
            className="px-4 py-2 rounded-xl bg-surface2 hover:bg-surface2/80 text-text font-bold text-xs border border-border transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Share2 className="w-4 h-4 text-primary" />
            <span>Share</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Print Routine (PDF)</span>
          </button>
        </div>
      </div>

      {/* Weekday Switcher (Hidden on Print) */}
      <div className="print:hidden flex items-center gap-2 overflow-x-auto pb-1">
        {days.map(day => {
          const isActive = activeDay === day;
          const count = (timetable[day] || []).length;
          return (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white border border-border text-text-secondary hover:text-text'
              }`}
            >
              <span>{day}</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${isActive ? 'bg-white/20 text-white' : 'bg-surface2 text-text-secondary'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Routine Table Container (Printable) */}
      <div className="bg-white border-2 border-indigo-950/20 rounded-2xl p-6 shadow-sm text-black">
        {/* Printable Official Header */}
        <div className="border-b-2 border-indigo-950 pb-4 mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-black text-lg uppercase text-indigo-950">
              {settings.instituteName || 'Mission Navodaya Public School'}
            </h2>
            <p className="text-xs text-gray-700 font-semibold">
              Weekly Academic Schedule & Timetable - <strong>Class {selectedClass}</strong>
            </p>
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-md text-xs font-bold text-indigo-950 uppercase">
              Day: {activeDay}
            </span>
            <p className="text-[10px] text-gray-500 mt-1 font-mono">
              Generated: {currentTimeStr}
            </p>
          </div>
        </div>

        {/* Periods List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-gray-300 border-collapse">
            <thead className="bg-indigo-950 text-white">
              <tr>
                <th className="p-2.5 border border-indigo-950">Period</th>
                <th className="p-2.5 border border-indigo-950">Timing</th>
                <th className="p-2.5 border border-indigo-950">Subject</th>
                <th className="p-2.5 border border-indigo-950">Faculty / Teacher</th>
                <th className="p-2.5 border border-indigo-950">Room</th>
                <th className="p-2.5 border border-indigo-950 text-right print:hidden">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(!timetable[activeDay] || timetable[activeDay].length === 0) ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-500">
                    No periods scheduled for {activeDay} in Class {selectedClass}. Click "+ Add Period" to add.
                  </td>
                </tr>
              ) : (
                timetable[activeDay].map((p, idx) => (
                  <tr key={p.id || idx} className="hover:bg-gray-50">
                    <td className="p-2.5 border border-gray-300 font-bold text-indigo-950">Period {p.period || idx + 1}</td>
                    <td className="p-2.5 border border-gray-300 font-semibold">{p.time}</td>
                    <td className="p-2.5 border border-gray-300 font-black text-indigo-900">{p.subject}</td>
                    <td className="p-2.5 border border-gray-300 font-semibold">{p.teacher}</td>
                    <td className="p-2.5 border border-gray-300">{p.room}</td>
                    <td className="p-2.5 border border-gray-300 text-right print:hidden">
                      <button
                        onClick={() => handleDeletePeriod(p.id)}
                        className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                        title="Delete period"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Add Period Form (Hidden on Print) */}
        <div className="mt-4 print:hidden">
          {isAdding ? (
            <form onSubmit={handleAddPeriod} className="p-4 bg-surface2 rounded-xl border border-border space-y-3">
              <h3 className="font-bold text-xs text-text">Add New Period to {activeDay} (Class {selectedClass})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  placeholder="Subject (e.g. Science)"
                  required
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="px-3 py-2 bg-white rounded-lg border border-border text-xs font-semibold"
                />
                <input
                  type="text"
                  placeholder="Timing (e.g. 09:00 AM - 09:45 AM)"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="px-3 py-2 bg-white rounded-lg border border-border text-xs font-semibold"
                />
                <input
                  type="text"
                  placeholder="Faculty Name (e.g. Ramesh Sir)"
                  value={newTeacher}
                  onChange={(e) => setNewTeacher(e.target.value)}
                  className="px-3 py-2 bg-white rounded-lg border border-border text-xs font-semibold"
                />
                <input
                  type="text"
                  placeholder="Room (e.g. 101)"
                  value={newRoom}
                  onChange={(e) => setNewRoom(e.target.value)}
                  className="px-3 py-2 bg-white rounded-lg border border-border text-xs font-semibold"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-bold text-xs cursor-pointer shadow-sm"
                >
                  Save Period
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 rounded-lg bg-white border border-border text-xs font-bold text-text-secondary cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="px-4 py-2.5 rounded-xl border border-dashed border-primary text-primary hover:bg-primary/5 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Period to {activeDay}</span>
            </button>
          )}
        </div>

        {/* Printable Footer */}
        <div className="mt-8 pt-4 border-t border-gray-400 flex items-center justify-between text-[11px] font-bold">
          <div>Class Teacher Signature</div>
          <div>Principal Signature & Seal</div>
        </div>
      </div>
    </div>
  );
}
