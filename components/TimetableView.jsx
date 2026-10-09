'use client';

import React, { useState } from 'react';
import { useSchoolStore } from '../lib/store';
import {
  Calendar, Clock, Plus, Trash2, Printer, Download, BookOpen, User, Building, CheckCircle2
} from 'lucide-react';

export default function TimetableView() {
  const { settings, showToast } = useSchoolStore();
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const [activeDay, setActiveDay] = useState('Monday');
  const [selectedClass, setSelectedClass] = useState('10th');

  const [timetable, setTimetable] = useState({
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
  });

  const [isAdding, setIsAdding] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newTeacher, setNewTeacher] = useState('');
  const [newTime, setNewTime] = useState('09:00 AM - 09:45 AM');
  const [newRoom, setNewRoom] = useState('101');

  const currentPeriods = timetable[activeDay] || [];

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newSubject.trim()) {
      showToast('Subject name is required', 'error');
      return;
    }
    const item = {
      id: Date.now(),
      period: currentPeriods.length + 1,
      time: newTime,
      subject: newSubject.trim(),
      teacher: newTeacher.trim() || 'Teacher',
      room: newRoom.trim() || '101',
    };
    setTimetable({
      ...timetable,
      [activeDay]: [...currentPeriods, item],
    });
    setNewSubject('');
    setNewTeacher('');
    setIsAdding(false);
    showToast(`Period added for ${activeDay}`, 'success');
  };

  const handleDelete = (id) => {
    setTimetable({
      ...timetable,
      [activeDay]: currentPeriods.filter(p => p.id !== id),
    });
    showToast('Period removed', 'info');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-text-primary flex items-center gap-2.5">
            <Calendar className="w-6 h-6 text-primary" />
            <span>Class Timetable & Schedule</span>
          </h2>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Manage weekly classroom periods, teacher allocations, and print PDF schedules.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-border bg-muted text-xs font-bold text-text-primary"
          >
            {['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'].map(c => (
              <option key={c} value={c}>Class {c}</option>
            ))}
          </select>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold flex items-center gap-2 shadow-xs hover:bg-primary-dark transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Timetable</span>
          </button>
        </div>
      </div>

      {/* Day Selector Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {days.map(d => {
          const count = (timetable[d] || []).length;
          const isActive = activeDay === d;
          return (
            <button
              key={d}
              onClick={() => setActiveDay(d)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                isActive
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-card border border-border text-text-muted hover:text-text-primary hover:bg-muted'
              }`}
            >
              <span>{d}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? 'bg-white/20 text-white' : 'bg-muted text-text-muted'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Day Content */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="font-extrabold text-sm text-text-primary flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span>{activeDay} Schedule ({currentPeriods.length} Lectures)</span>
          </h3>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Period</span>
          </button>
        </div>

        {/* Add Period Form */}
        {isAdding && (
          <form onSubmit={handleAdd} className="bg-muted/40 border border-border p-4 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-text-primary">Add New Lecture to {activeDay}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Subject (e.g. Mathematics)"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border bg-card text-xs"
                required
              />
              <input
                type="text"
                placeholder="Teacher (e.g. Ramesh Sir)"
                value={newTeacher}
                onChange={(e) => setNewTeacher(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border bg-card text-xs"
              />
              <input
                type="text"
                placeholder="Time (09:00 AM - 09:45 AM)"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border bg-card text-xs"
              />
              <input
                type="text"
                placeholder="Room No (101)"
                value={newRoom}
                onChange={(e) => setNewRoom(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border bg-card text-xs"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-text-muted hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary-dark"
              >
                Save Period
              </button>
            </div>
          </form>
        )}

        {/* Periods List */}
        {currentPeriods.length === 0 ? (
          <div className="text-center py-12 text-text-muted text-xs">
            No periods scheduled for {activeDay}. Click &quot;Add Period&quot; to begin.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {currentPeriods.map((p, idx) => (
              <div
                key={p.id}
                className="p-4 rounded-xl border border-border bg-muted/20 hover:border-primary/40 transition-all flex items-start justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-primary text-white text-[11px] font-bold flex items-center justify-center">
                      P{p.period}
                    </span>
                    <span className="font-extrabold text-sm text-text-primary">{p.subject}</span>
                  </div>
                  <div className="text-xs text-text-muted flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-text-muted" />
                    <span>{p.time}</span>
                  </div>
                  <div className="text-xs text-text-muted flex items-center gap-1.5">
                    <User className="w-3 h-3 text-text-muted" />
                    <span>{p.teacher}</span>
                    {p.room && (
                      <span className="ml-1 px-1.5 py-0.2 rounded bg-muted text-[10px] font-bold text-text-primary">
                        Rm {p.room}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="text-text-muted hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                  title="Delete Period"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
