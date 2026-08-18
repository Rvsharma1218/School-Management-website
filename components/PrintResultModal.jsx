'use client';

import React from 'react';
import { X, Printer, Award, School } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function PrintResultModal({ data, onClose }) {
  if (!data) return null;

  const { result, student, settings } = data;

  const total = result.subjects.reduce((sum, s) => sum + Number(s.totalMarks), 0);
  const obt = result.subjects.reduce((sum, s) => sum + Number(s.marks), 0);
  const pct = total > 0 ? ((obt / total) * 100).toFixed(1) : 0;
  const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B+' : pct >= 60 ? 'B' : pct >= 50 ? 'C' : pct >= 40 ? 'D' : 'F';
  const isPass = pct >= 40;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white text-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8 print:shadow-none print:m-0 print:max-w-none print:w-full">
        {/* Print Controls */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between print:hidden">
          <span className="text-xs font-bold text-slate-700">Official Marksheet Preview</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Marksheet</span>
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MARKSHEET BODY */}
        <div className="p-8 print:p-6 font-sans">
          <div className="border-4 border-double border-indigo-950 p-6 rounded-xl space-y-6">
            {/* Header */}
            <div className="text-center border-b-2 border-indigo-950 pb-4 space-y-1">
              <h1 className="text-2xl font-black uppercase tracking-wider text-indigo-950">
                {settings.instituteName}
              </h1>
              <p className="text-xs text-slate-600 font-medium">
                {settings.address} • Affiliation: {settings.affiliationNumber || 'Recognized'}
              </p>
              <div className="inline-block mt-2 px-4 py-1 rounded-full bg-indigo-950 text-amber-300 text-xs font-black uppercase tracking-widest shadow-xs">
                OFFICIAL REPORT CARD & STATEMENT OF MARKS
              </div>
              <p className="text-xs font-bold text-slate-800 pt-1">{result.examName}</p>
            </div>

            {/* Student Info Box */}
            <div className="grid grid-cols-2 gap-4 text-xs p-3 rounded-lg bg-slate-50 border border-slate-300">
              <div className="space-y-1">
                <div>Student Name: <strong className="text-indigo-950 font-bold">{student?.name}</strong></div>
                <div>Father's Name: <strong>{student?.fatherName || '—'}</strong></div>
                <div>Class / Course: <strong>{student?.studentType === 'school' ? `Class ${student?.className || ''}` : student?.course}</strong></div>
              </div>
              <div className="space-y-1 text-right">
                <div>Student ID: <strong className="font-mono">{student?.studentId}</strong></div>
                <div>Roll Number: <strong>{student?.rollNumber || 'N/A'}</strong></div>
                <div>Academic Session: <strong>{student?.session || settings.currentSession || '2026-27'}</strong></div>
              </div>
            </div>

            {/* Marks Table */}
            <table className="w-full text-xs text-left border-collapse border border-slate-300">
              <thead className="bg-indigo-950 text-white font-bold">
                <tr>
                  <th className="p-2 border border-slate-300">S.No</th>
                  <th className="p-2 border border-slate-300">Subject Name</th>
                  <th className="p-2 text-center border border-slate-300">Max Marks</th>
                  <th className="p-2 text-center border border-slate-300">Marks Obtained</th>
                  <th className="p-2 text-center border border-slate-300">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {result.subjects.map((sub, idx) => {
                  const subPct = sub.totalMarks > 0 ? (sub.marks / sub.totalMarks) * 100 : 0;
                  const subGrade = subPct >= 90 ? 'A+' : subPct >= 80 ? 'A' : subPct >= 70 ? 'B+' : subPct >= 60 ? 'B' : subPct >= 50 ? 'C' : subPct >= 40 ? 'D' : 'F';
                  return (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2 border border-slate-300 text-center font-mono">{idx + 1}</td>
                      <td className="p-2 border border-slate-300 font-bold">{sub.subjectName}</td>
                      <td className="p-2 border border-slate-300 text-center">{sub.totalMarks}</td>
                      <td className="p-2 border border-slate-300 text-center font-bold text-indigo-950">{sub.marks}</td>
                      <td className="p-2 border border-slate-300 text-center font-bold">{subGrade}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-100 font-black border-t-2 border-indigo-950">
                <tr>
                  <td colSpan={2} className="p-2 border border-slate-300 uppercase">Grand Total</td>
                  <td className="p-2 border border-slate-300 text-center">{total}</td>
                  <td className="p-2 border border-slate-300 text-center text-indigo-950 text-sm">{obt}</td>
                  <td className="p-2 border border-slate-300 text-center">{grade}</td>
                </tr>
              </tfoot>
            </table>

            {/* Performance Summary Banner */}
            <div className="p-3 rounded-lg border-2 border-indigo-950 flex items-center justify-between text-xs bg-slate-50">
              <div>
                <span>Percentage: <strong className="text-indigo-950 text-sm font-black">{pct}%</strong></span>
                <span className="mx-2">•</span>
                <span>Overall Grade: <strong className="text-sm font-black">{grade}</strong></span>
              </div>
              <div className={`font-black text-sm uppercase px-3 py-0.5 rounded-full ${
                isPass ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {isPass ? 'STATUS: PASSED' : 'STATUS: FAILED / COMPARTMENT'}
              </div>
            </div>

            {/* Signatures & Stamp */}
            <div className="flex items-end justify-between pt-8">
              <div className="text-center space-y-1">
                <div className="w-36 border-b border-indigo-950" />
                <div className="text-[10px] font-bold uppercase text-slate-700">Class Teacher</div>
              </div>

              <div className="p-1 border border-slate-300 rounded-md">
                <QRCodeSVG value={`RESULT:${result.examName}|STUDENT:${student?.studentId}|PCT:${pct}%|GRADE:${grade}`} size={52} />
              </div>

              <div className="text-center space-y-1">
                <div className="w-36 border-b border-indigo-950" />
                <div className="text-[10px] font-bold uppercase text-slate-700">Principal Signature</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
