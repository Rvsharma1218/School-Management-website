'use client';

import React from 'react';
import { X, Printer, Award, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { exportSingleResultPDF } from '../lib/exportUtils';
import { useSchoolStore } from '../lib/store';

export default function PrintResultModal({ result: propResult, student: propStudent, data, onClose }) {
  const { settings: storeSettings, showToast } = useSchoolStore();

  const result = propResult || data?.result;
  const student = propStudent || data?.student;
  const settings = data?.settings || storeSettings || {};

  if (!result) return null;

  const rawSubjects = Array.isArray(result.subjects) && result.subjects.length > 0
    ? result.subjects
    : [{ subjectName: result.subject || 'General', totalMarks: result.totalMarks || 100, marks: result.marks || 0 }];

  const hasDetailedBreakdown = rawSubjects.some(
    s => (Number(s.theoryMarks) > 0 || Number(s.practicalMarks) > 0 || Number(s.internalMarks) > 0)
  );

  const total = rawSubjects.reduce((sum, s) => sum + (Number(s.totalMarks) || 0), 0);
  const obt = rawSubjects.reduce((sum, s) => sum + (Number(s.marks) || 0), 0);
  const pct = total > 0 ? ((obt / total) * 100).toFixed(1) : '0.0';
  const grade = Number(pct) >= 90 ? 'A+' : Number(pct) >= 80 ? 'A' : Number(pct) >= 70 ? 'B+' : Number(pct) >= 60 ? 'B' : Number(pct) >= 50 ? 'C' : Number(pct) >= 40 ? 'D' : 'F';
  const isPass = Number(pct) >= 40;

  const passingCriteria = Number(result.passingMarks || 33);
  const failedSubjects = rawSubjects.filter(s => {
    const sMax = Number(s.totalMarks) || 100;
    const sObt = Number(s.marks) || 0;
    const minPass = s.passingMarks != null ? Number(s.passingMarks) : Math.round(sMax * (passingCriteria / 100));
    return sObt < minPass;
  });
  const failCount = failedSubjects.length;

  let finalStatus = 'PASS';
  if (result.status === 'PROMOTED') {
    finalStatus = 'PROMOTED';
  } else if (result.status === 'FAIL') {
    finalStatus = 'FAIL';
  } else if (result.status === 'PASS') {
    finalStatus = 'PASS';
  } else {
    finalStatus = (failCount > 0 || !isPass) ? 'FAIL' : 'PASS';
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    await exportSingleResultPDF(result, student, settings);
    showToast(`Downloaded marksheet PDF for ${student?.name || 'student'}!`, 'success');
  };

  const logoSrc = settings.logoUrl || settings.logoPath || settings.logo;
  const sigSrc = settings.principalSignature || settings.signatureUrl || settings.signaturePath || settings.signature;
  const stampSrc = settings.schoolSeal || settings.schoolStamp || settings.stampUrl || settings.stampPath || settings.sealUrl;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs p-3 sm:p-6 flex justify-center items-start print:p-0 print:bg-white print:static"
    >
      <div className="bg-white text-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-4 sm:my-8 print:shadow-none print:m-0 print:max-w-none print:w-full flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Sticky Print Controls Header */}
        <div className="sticky top-0 z-30 p-3.5 sm:p-4 border-b border-slate-200 bg-slate-100/95 backdrop-blur-md flex items-center justify-between shadow-xs print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 block">Official Marksheet Preview</span>
              <span className="text-[10px] text-slate-500 font-medium">{student?.name || 'Student'} • {result.examName || 'Examination'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              title="Download Marksheet as PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              title="Print Marksheet"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="px-2.5 py-1.5 rounded-lg bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-600 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95"
              title="Close Marksheet Preview"
            >
              <X className="w-4 h-4" />
              <span className="text-xs">Cancel</span>
            </button>
          </div>
        </div>

        {/* MARKSHEET BODY */}
        <div className="p-6 sm:p-8 print:p-6 font-sans overflow-y-auto">
          <div className="border-4 border-double border-indigo-950 p-6 rounded-xl space-y-5 bg-white">
            {/* Header */}
            <div className="text-center border-b-2 border-indigo-950 pb-4 space-y-1">
              {logoSrc && (
                <div className="flex justify-center mb-1">
                  <img src={logoSrc} alt="Logo" className="w-14 h-14 object-contain" />
                </div>
              )}
              <h1 className="text-2xl font-black uppercase tracking-wider text-indigo-950">
                {settings.instituteName || 'Smart School & Computer Institute'}
              </h1>
              <p className="text-xs text-slate-600 font-medium">
                {settings.address || 'Main Campus'} • Affiliation: {settings.affiliationNumber || 'Recognized'}
                {settings.mobile ? ` • Helpline: ${settings.mobile}` : ''}
              </p>
              <div className="inline-block mt-2 px-4 py-1 rounded-full bg-indigo-950 text-amber-300 text-xs font-black uppercase tracking-widest shadow-xs">
                OFFICIAL REPORT CARD & STATEMENT OF MARKS
              </div>
              <p className="text-xs font-bold text-slate-800 pt-1">{result.examName || 'Examination'}</p>
            </div>

            {/* Student Info Box */}
            <div className="grid grid-cols-2 gap-4 text-xs p-3 rounded-lg bg-slate-50 border border-slate-300">
              <div className="space-y-1">
                <div>Student Name: <strong className="text-indigo-950 font-bold">{student?.name || result?.studentName || '—'}</strong></div>
                <div>Father's Name: <strong>{student?.fatherName || '—'}</strong></div>
                <div>Class / Course: <strong>{student?.studentType === 'school' ? `Class ${student?.className || ''} - ${student?.section || 'A'}` : (student?.course || result?.class || '—')}</strong></div>
              </div>
              <div className="space-y-1 text-right">
                <div>Student ID: <strong className="font-mono">{student?.studentId || result?.studentId || '—'}</strong></div>
                <div>Roll Number: <strong>{student?.rollNumber || result?.rollNumber || 'N/A'}</strong></div>
                <div>Academic Session: <strong>{student?.session || settings.currentSession || '2026-27'}</strong></div>
              </div>
            </div>

            {/* Marks Table */}
            <table className="w-full text-xs text-left border-collapse border border-slate-300">
              <thead className="bg-indigo-950 text-white font-bold">
                <tr>
                  <th className="p-2 border border-slate-300 text-center">S.No</th>
                  <th className="p-2 border border-slate-300">Subject Name</th>
                  {hasDetailedBreakdown && (
                    <>
                      <th className="p-2 text-center border border-slate-300">Theory</th>
                      <th className="p-2 text-center border border-slate-300">Practical</th>
                      <th className="p-2 text-center border border-slate-300">Internal</th>
                    </>
                  )}
                  <th className="p-2 text-center border border-slate-300">Max Marks</th>
                  <th className="p-2 text-center border border-slate-300">Marks Obtained</th>
                  <th className="p-2 text-center border border-slate-300">Grade</th>
                  <th className="p-2 text-center border border-slate-300">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {rawSubjects.map((sub, idx) => {
                  const sMax = Number(sub.totalMarks) || 0;
                  const sObt = Number(sub.marks) || 0;
                  const minPass = sub.passingMarks != null ? Number(sub.passingMarks) : Math.round(sMax * (passingCriteria / 100));
                  const subPass = sObt >= minPass;
                  const subPct = sMax > 0 ? (sObt / sMax) * 100 : 0;
                  const subGrade = !subPass ? 'F' : subPct >= 90 ? 'A+' : subPct >= 80 ? 'A' : subPct >= 70 ? 'B+' : subPct >= 60 ? 'B' : subPct >= 50 ? 'C' : 'D';

                  return (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2 border border-slate-300 text-center font-mono">{idx + 1}</td>
                      <td className="p-2 border border-slate-300 font-bold">{sub.subjectName}</td>
                      {hasDetailedBreakdown && (
                        <>
                          <td className="p-2 border border-slate-300 text-center">{sub.theoryMarks != null ? sub.theoryMarks : '-'}</td>
                          <td className="p-2 border border-slate-300 text-center">{sub.practicalMarks != null ? sub.practicalMarks : '-'}</td>
                          <td className="p-2 border border-slate-300 text-center">{sub.internalMarks != null ? sub.internalMarks : '-'}</td>
                        </>
                      )}
                      <td className="p-2 border border-slate-300 text-center">{sub.totalMarks}</td>
                      <td className="p-2 border border-slate-300 text-center font-bold text-indigo-950">{sub.marks}</td>
                      <td className="p-2 border border-slate-300 text-center font-bold">{subGrade}</td>
                      <td className="p-2 border border-slate-300 text-center">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          subPass ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {subPass ? 'PASS' : 'FAIL'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-100 font-black border-t-2 border-indigo-950">
                <tr>
                  <td colSpan={hasDetailedBreakdown ? 5 : 2} className="p-2 border border-slate-300 uppercase">Grand Total</td>
                  <td className="p-2 border border-slate-300 text-center">{total}</td>
                  <td className="p-2 border border-slate-300 text-center text-indigo-950 text-sm">{obt}</td>
                  <td className="p-2 border border-slate-300 text-center">{grade}</td>
                  <td className="p-2 border border-slate-300 text-center">
                    <span className={`text-[10px] font-black ${
                      finalStatus === 'PROMOTED' ? 'text-amber-700' : isPass && failCount === 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                      {finalStatus}
                    </span>
                  </td>
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
              <div className={`font-black text-xs sm:text-sm uppercase px-3.5 py-1 rounded-full border shadow-xs ${
                finalStatus === 'PROMOTED'
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : finalStatus === 'PASS'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border-rose-300'
              }`}>
                {finalStatus === 'PROMOTED'
                  ? 'STATUS: PROMOTED'
                  : finalStatus === 'PASS'
                  ? 'STATUS: PASSED'
                  : `STATUS: FAILED / COMPARTMENT ${failCount > 0 ? `(${failCount} SUBJ)` : ''}`}
              </div>
            </div>

            {/* Signatures & Stamp */}
            <div className="flex items-end justify-between pt-6">
              <div className="text-center space-y-1">
                <div className="w-36 border-b border-indigo-950" />
                <div className="text-[10px] font-bold uppercase text-slate-700">Class Teacher's Sign</div>
              </div>

              {/* QR Code & Center Stamp */}
              <div className="flex items-center gap-3">
                <div className="p-1 border border-slate-300 rounded-md bg-white">
                  <QRCodeSVG value={`RESULT:${result.examName || 'Exam'}|STUDENT:${student?.studentId || result?.studentId}|PCT:${pct}%|GRADE:${grade}|STATUS:${finalStatus}`} size={50} />
                </div>
                {stampSrc && (
                  <div className="text-center flex flex-col items-center">
                    <img src={stampSrc} alt="School Seal" className="h-12 w-12 object-contain opacity-90" />
                    <span className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">Official Seal</span>
                  </div>
                )}
              </div>

              <div className="text-center space-y-1 flex flex-col items-center">
                {sigSrc ? (
                  <img src={sigSrc} alt="Principal Signature" className="h-8 max-w-[120px] object-contain mb-0.5" />
                ) : (
                  <div className="h-8" />
                )}
                <div className="w-36 border-b border-indigo-950" />
                <div className="text-[10px] font-bold uppercase text-slate-700">Principal's Sign & Seal</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
