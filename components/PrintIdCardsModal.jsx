'use client';

import React from 'react';
import { useSchoolStore } from '../lib/store';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, X } from 'lucide-react';

export default function PrintIdCardsModal({ students, template, onClose }) {
  const { settings } = useSchoolStore();

  if (!students || students.length === 0) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card border border-border w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header (Hidden during Print) */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-surface2/60 print:hidden">
          <div>
            <h3 className="font-extrabold text-sm text-text">
              Batch Student ID Cards Print Preview ({students.length})
            </h3>
            <p className="text-xs text-text-secondary">
              Official front and back print layout optimized for standard card stock.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print All ({students.length})</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-text-secondary hover:text-text hover:bg-surface2 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ─── BATCH ID CARDS PRINT GRID ─── */}
        <div className="p-6 overflow-y-auto max-h-[75vh] bg-surface2/30 print:bg-white print:p-0 print:overflow-visible">
          <div className="grid grid-cols-1 gap-8 justify-items-center print:block print:space-y-6">
            {students.map((student) => (
              <div
                key={student.id}
                className="flex flex-col sm:flex-row gap-4 items-center print:flex-row print:gap-4 print:page-break-inside-avoid print:justify-center"
              >
                {/* ─── FRONT SIDE OF ID CARD ─── */}
                <div className="w-[400px] h-[250px] rounded-lg shadow-xl overflow-hidden flex flex-col border border-amber-400/40 bg-gradient-to-br from-[#0A1128] to-[#1C2541] text-white select-none print:shadow-none print:border">
                  {/* Top Gold Accent Bar */}
                  <div className="bg-[#FFD700] text-[#0A1128] px-3.5 py-0.5 flex items-center justify-between text-[9px] font-black tracking-wider uppercase">
                    <span>OFFICIAL STUDENT ID</span>
                    <span>SESSION {student.session || settings.currentSession || '2026-27'}</span>
                  </div>

                  {/* Institute Header */}
                  <div className="bg-[#0A1128] px-3 py-1.5 text-center border-b border-[#FFD700]/40">
                    <h3 className="font-extrabold text-xs tracking-wide uppercase text-white leading-tight">
                      {settings.instituteName || "MISSION NAVODAYA PUBLIC SCHOOL"}
                    </h3>
                    <p className="text-[8px] text-[#FFD700] tracking-wide truncate mt-0.5 font-medium">
                      {settings.address || "Mora Mairi, Bhagwaanpur, Siwan, Bihar 841507"}
                    </p>
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 p-3 flex items-center gap-3">
                    {/* Photo */}
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className="w-[76px] h-[88px] rounded border-2 border-[#FFD700] overflow-hidden bg-[#0A1128] flex items-center justify-center shadow-md">
                        {student.photoPath ? (
                          <img src={student.photoPath} alt={student.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl font-black text-white">{student.name?.charAt(0) || 'S'}</span>
                        )}
                      </div>
                      <div className="mt-1 bg-[#FFD700] text-[#0A1128] text-[7.5px] font-black uppercase px-1.5 py-0.5 rounded shadow-2xs">
                        STUDENT
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 space-y-0.5 text-[9.5px]">
                      <h4 className="font-black text-xs uppercase text-white tracking-wide truncate mb-1">
                        {student.name}
                      </h4>
                      <div className="flex"><span className="w-14 font-bold text-amber-300">ID NO:</span><span className="font-semibold">{student.studentId}</span></div>
                      <div className="flex"><span className="w-14 font-bold text-amber-300">ADM NO:</span><span className="font-semibold">{student.admissionNumber || student.studentId}</span></div>
                      <div className="flex">
                        <span className="w-14 font-bold text-amber-300">{student.studentType === 'school' ? 'CLASS:' : 'COURSE:'}</span>
                        <span className="font-semibold">{student.studentType === 'school' ? `Class ${student.className || ''} - ${student.section || 'A'}` : student.course}</span>
                      </div>
                      <div className="flex"><span className="w-14 font-bold text-amber-300">FATHER:</span><span className="font-semibold truncate">{student.fatherName || '—'}</span></div>
                      <div className="flex"><span className="w-14 font-bold text-amber-300">MOBILE:</span><span className="font-semibold">{student.mobile}</span></div>
                    </div>

                    {/* QR Code */}
                    <div className="flex flex-col items-center flex-shrink-0 bg-white/5 p-1 rounded-lg border border-white/10">
                      <div className="p-0.5 bg-white rounded">
                        <QRCodeSVG
                          value={`ID:${student.studentId}|Name:${student.name}|Mobile:${student.mobile}`}
                          size={52}
                          level="M"
                        />
                      </div>
                      <span className="text-[6.5px] text-slate-400 mt-1 uppercase font-bold tracking-widest">
                        SCAN TO VERIFY
                      </span>
                    </div>
                  </div>

                  {/* Bottom Footer Bar */}
                  <div className="bg-[#05091E] px-3.5 py-1 flex items-center justify-between text-[7.5px] border-t border-[#FFD700]/20">
                    <span className="text-slate-400 font-semibold uppercase truncate max-w-[240px]">
                      PROPERTY OF {settings.instituteName || "MISSION NAVODAYA PUBLIC SCHOOL"}
                    </span>
                    <span className="text-[#FFD700] font-black uppercase tracking-wider">
                      AUTH SIGNATURE
                    </span>
                  </div>
                </div>

                {/* ─── BACK SIDE OF ID CARD ─── */}
                <div className="w-[400px] h-[250px] rounded-lg shadow-xl overflow-hidden flex flex-col border border-amber-400/40 bg-[#0A1128] text-white select-none print:shadow-none print:border">
                  {/* Top Bar Spacer */}
                  <div className="h-2 bg-[#FFD700]" />

                  {/* Back content */}
                  <div className="flex-1 p-5 flex flex-col justify-between">
                    <div className="space-y-2">
                      <h4 className="font-bold text-xs uppercase text-[#FFD700] tracking-wider">
                        Terms & Conditions
                      </h4>
                      <ol className="list-decimal pl-4 text-[9px] text-slate-300 space-y-1 leading-snug">
                        <li>This card is non-transferable and must be presented upon request.</li>
                        <li>If found, please return to the institute address below.</li>
                        <li>Loss of this card must be reported immediately.</li>
                      </ol>
                    </div>

                    <div className="w-full h-0.5 bg-[#FFD700]/40 my-2" />

                    <div className="flex items-end justify-between text-[8px] text-slate-300">
                      <div className="space-y-0.5 leading-tight max-w-[220px]">
                        <p className="font-bold text-white text-[9.5px]">
                          {settings.instituteName || "Mission Navodaya Public School"}
                        </p>
                        <p>Ph: {settings.mobile || "9876543210"}</p>
                        <p className="truncate">{settings.address || "Mora Mairi, Bhagwaanpur, Siwan, Bihar 841507"}</p>
                      </div>

                      <div className="text-center flex-shrink-0">
                        <div className="w-24 border-t border-white/60 mb-0.5" />
                        <span className="text-[7.5px] uppercase font-bold text-slate-400">Principal Sign</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
