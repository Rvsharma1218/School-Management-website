import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

// ─── Helper: Generate Individual Fee Receipt jsPDF Document ───────────────
export function createReceiptPDFDoc(payment, student, settings = {}) {
  const doc = new jsPDF({ format: 'a5', unit: 'mm' });
  const W = 148, H = 210, M = 8;
  const contentW = W - 2 * M;

  // Outer Border Box
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.rect(M, M, contentW, H - 2 * M);

  let y = M + 6;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 30, 30);
  doc.text('OFFICIAL FEE RECEIPT VOUCHER', W / 2, y, { align: 'center' });
  y += 5.5;

  doc.setFontSize(12);
  doc.text((settings.instituteName || 'MY SCHOOL & COMPUTER INSTITUTE').toUpperCase(), W / 2, y, { align: 'center' });
  y += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Add- ${settings.address || 'Siwan, Bihar'}`, W / 2, y, { align: 'center' });
  y += 4;
  doc.text(`Mob- ${settings.mobile || '9876543210'}`, W / 2, y, { align: 'center' });
  y += 3.5;

  // Divider Line
  doc.setLineWidth(0.3);
  doc.line(M, y, W - M, y);
  y += 5;

  // Meta details
  const payDateObj = payment.paymentDate ? new Date(payment.paymentDate) : new Date();
  const paymentDate = isNaN(payDateObj.getTime()) ? new Date() : payDateObj;
  const dateFormatted = paymentDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeFormatted = paymentDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const monthKey = payment.monthKey || `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;
  // Use particularsSnapshot from payment if available (live at time of payment), else fall back to student.monthlyParticulars
  const mp = payment.particularsSnapshot || student.monthlyParticulars?.[monthKey] || {};

  doc.setFontSize(7.5);
  // Row 1: Receipt No & Date
  doc.setFont('helvetica', 'normal');
  doc.text('Receipt No: ', M + 4, y);
  doc.setFont('helvetica', 'bold');
  doc.text(payment.receiptNumber || 'REC000001', M + 20, y);

  doc.setFont('helvetica', 'normal');
  doc.text('Payment Date: ', W - M - 48, y);
  doc.setFont('helvetica', 'bold');
  doc.text(`${dateFormatted} ${timeFormatted}`, W - M - 4, y, { align: 'right' });
  y += 4.5;

  // Row 2: Student Name & System ID
  doc.setFont('helvetica', 'normal');
  doc.text("Student's Name:", M + 4, y);
  doc.setFont('helvetica', 'bold');
  doc.text((student.name || '').toUpperCase(), M + 26, y);

  doc.setFont('helvetica', 'normal');
  doc.text('Student ID: ', W - M - 48, y);
  doc.setFont('helvetica', 'bold');
  doc.text(student.studentId || '-', W - M - 4, y, { align: 'right' });
  y += 4.5;

  // Row 3: Admission No & Father's Name
  doc.setFont('helvetica', 'normal');
  doc.text('Admission No: ', M + 4, y);
  doc.setFont('helvetica', 'bold');
  doc.text(student.admissionNumber || '-', M + 24, y);

  doc.setFont('helvetica', 'normal');
  doc.text("Father's Name: ", W - M - 48, y);
  doc.setFont('helvetica', 'bold');
  doc.text(student.fatherName || '-', W - M - 4, y, { align: 'right' });
  y += 4.5;

  // Row 4: Class/Course & Roll No
  const classStr = student.studentType === 'school' ? `Class ${student.className || ''} - ${student.section || 'A'}` : (student.course || 'ADCA');
  doc.setFont('helvetica', 'normal');
  doc.text('Class / Course: ', M + 4, y);
  doc.setFont('helvetica', 'bold');
  doc.text(classStr, M + 24, y);

  doc.setFont('helvetica', 'normal');
  doc.text('Roll No: ', W - M - 48, y);
  doc.setFont('helvetica', 'bold');
  doc.text(student.rollNumber || '-', W - M - 4, y, { align: 'right' });
  y += 4.5;

  // Row 5: Fee Month & Payment Mode
  doc.setFont('helvetica', 'normal');
  doc.text('Fees For Period: ', M + 4, y);
  doc.setFont('helvetica', 'bold');
  doc.text(payment.feeMonth || 'Monthly Tuition Fee', M + 25, y);

  doc.setFont('helvetica', 'normal');
  doc.text('Payment Mode: ', W - M - 48, y);
  doc.setFont('helvetica', 'bold');
  doc.text(payment.paymentMode || 'Cash', W - M - 4, y, { align: 'right' });
  y += 5;

  // 13 Particulars Table
  const tableX = M + 3;
  const tableW = contentW - 6;
  const colSN = 9;
  const colAmt = 22;
  const colP = 7;
  const colPart = tableW - colSN - colAmt - colP;

  // Table Header
  doc.setFillColor(245, 245, 245);
  doc.rect(tableX, y, tableW, 4.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('S.N.', tableX + colSN / 2, y + 3.2, { align: 'center' });
  doc.text('Particulars', tableX + colSN + 2, y + 3.2);
  doc.text('Amount (Rs)', tableX + colSN + colPart + colAmt - 2, y + 3.2, { align: 'right' });
  doc.text('P.', tableX + colSN + colPart + colAmt + colP / 2, y + 3.2, { align: 'center' });

  // Column vertical gridlines
  doc.line(tableX + colSN, y, tableX + colSN, y + 4.5);
  doc.line(tableX + colSN + colPart, y, tableX + colSN + colPart, y + 4.5);
  doc.line(tableX + colSN + colPart + colAmt, y, tableX + colSN + colPart + colAmt, y + 4.5);
  y += 4.5;

  const items = [
    { sn: '1', label: 'Admission Fee', amt: mp.admissionFee || 0 },
    { sn: '2', label: 'Tuition Fee', amt: mp.tuitionFee !== undefined ? mp.tuitionFee : (payment.amount || 0) },
    { sn: '3', label: 'Examination Fee', amt: mp.examinationFee || 0 },
    { sn: '4', label: 'Previous Dues', amt: mp.previousDues || 0 },
    { sn: '5', label: 'Game Fee', amt: mp.gameFee || 0 },
    { sn: '6', label: 'Re-Admission Fee', amt: mp.reAdmissionFee || 0 },
    { sn: '7', label: 'Development Fee', amt: mp.developmentFee || 0 },
    { sn: '8', label: 'School ID', amt: mp.schoolId || 0 },
    { sn: '9', label: 'Tie, Bag, Belt', amt: mp.tieBagBelt || 0 },
    { sn: '10', label: 'Back Dues', amt: mp.backDues || 0 },
    { sn: '11', label: 'Transport Fee', amt: mp.transportFee || 0 },
    { sn: '12', label: 'Other Fee', amt: mp.otherFee || 0 },
    { sn: '★', label: 'Late Fine', amt: mp.lateFine || 0, isLate: true },
  ];

  const totalCalculated = items.reduce((acc, p) => acc + (Number(p.amt) || 0), 0);

  // Use stored payment-time values if available; else calculate live
  const amountPaid = Number(payment.amount || 0);
  const totalAmount = Number(payment.totalMonthDemand) || (totalCalculated > 0 ? totalCalculated : amountPaid);
  const previousPaidThisMonth = Number(payment.alreadyPaid) ?? 0;
  const totalPaidAfter = Number(payment.totalPaidAfter) || (previousPaidThisMonth + amountPaid);
  const balanceDue = Number(payment.balanceDue) !== undefined ? Number(payment.balanceDue) : Math.max(0, totalAmount - totalPaidAfter);
  const prevDueCarried = Number(payment.previousDue) || Number(mp.previousDues) || 0;

  const rowH = 4;
  items.forEach((item) => {
    doc.rect(tableX, y, tableW, rowH);
    doc.line(tableX + colSN, y, tableX + colSN, y + rowH);
    doc.line(tableX + colSN + colPart, y, tableX + colSN + colPart, y + rowH);
    doc.line(tableX + colSN + colPart + colAmt, y, tableX + colSN + colPart + colAmt, y + rowH);

    doc.setFont('helvetica', item.isLate ? 'bold' : 'normal');
    doc.setFontSize(6.5);
    doc.text(item.sn, tableX + colSN / 2, y + 2.8, { align: 'center' });
    doc.text(item.label, tableX + colSN + 2, y + 2.8);
    if (item.amt > 0) {
      doc.text(Number(item.amt).toFixed(2), tableX + colSN + colPart + colAmt - 2, y + 2.8, { align: 'right' });
      doc.text('00', tableX + colSN + colPart + colAmt + colP / 2, y + 2.8, { align: 'center' });
    }
    y += rowH;
  });

  // Summary Rows
  const summaryRows = [
    { label: 'Total Fee Demand (This Month)', amt: totalAmount },
    { label: 'Previous Due (Carried Forward)', amt: prevDueCarried, isCarryFwd: true },
    { label: 'Current Payment (This Voucher)',  amt: amountPaid, isHighlight: true },
    { label: 'Remaining Balance Due',          amt: balanceDue, isPending: true }
  ];

  summaryRows.forEach((row, i) => {
    if (row.isHighlight)  doc.setFillColor(235, 248, 235);
    else if (row.isPending && row.amt > 0) doc.setFillColor(254, 242, 242);
    else if (row.isCarryFwd && row.amt > 0) doc.setFillColor(255, 251, 235);
    else if (i === 0)     doc.setFillColor(240, 240, 240);

    const fill = row.isHighlight || (row.isPending && row.amt > 0) || (row.isCarryFwd && row.amt > 0) || i === 0;
    doc.rect(tableX, y, tableW, rowH, fill ? 'FD' : 'D');
    doc.line(tableX + colSN + colPart, y, tableX + colSN + colPart, y + rowH);
    doc.line(tableX + colSN + colPart + colAmt, y, tableX + colSN + colPart + colAmt, y + rowH);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(row.isPending && row.amt > 0 ? 180 : 0, 0, row.isCarryFwd && row.amt > 0 ? 0 : 0);
    if (row.isPending && row.amt > 0) doc.setTextColor(180, 30, 30);
    else if (row.isCarryFwd && row.amt > 0) doc.setTextColor(160, 100, 0);
    else doc.setTextColor(30, 30, 30);

    doc.text(row.label, tableX + colSN + colPart - 2, y + 2.8, { align: 'right' });
    doc.text(Number(row.amt).toFixed(2), tableX + colSN + colPart + colAmt - 2, y + 2.8, { align: 'right' });
    doc.text('00', tableX + colSN + colPart + colAmt + colP / 2, y + 2.8, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    y += rowH;
  });

  y += 4;

  // Number to Words
  function toWords(num) {
    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const n = Math.floor(num || 0);
    if (n === 0) return 'Zero';
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + ' ' + a[n % 10];
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred ' + toWords(n % 100);
    if (n < 100000) return toWords(Math.floor(n / 1000)) + ' Thousand ' + toWords(n % 1000);
    if (n < 10000000) return toWords(Math.floor(n / 100000)) + ' Lakh ' + toWords(n % 100000);
    return 'Rupees';
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Amount in Words: ', M + 4, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${toWords(amountPaid).trim()} Rupees Only`, M + 28, y);
  y += 3.5;

  doc.line(M, y, W - M, y);
  y += 3.5;

  // Green Paid Stamp Badge
  doc.setDrawColor(46, 125, 50);
  doc.setFillColor(240, 248, 235);
  doc.roundedRect(W / 2 - 38, y, 76, 5, 1, 1, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(46, 125, 50);
  const paidDateLong = paymentDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  doc.text(`Paid: Rs. ${amountPaid.toLocaleString('en-IN')} on ${paidDateLong} via ${payment.paymentMode || 'Cash'}`, W / 2, y + 3.5, { align: 'center' });
  y += 8;

  // Signatures
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Cashier / Accountant Sign.', M + 4, y);
  doc.setFont('helvetica', 'bold');
  doc.text(`FOR ${(settings.instituteName || 'MY SCHOOL & COMPUTER INSTITUTE').toUpperCase()}`, W - M - 4, y, { align: 'right' });
  y += 3.5;

  doc.line(M, y, W - M, y);
  y += 3.5;

  // Rules
  const dueDay = student.feeStructure?.dueDay || 10;
  const lateFinePerDay = student.feeStructure?.lateFinePerDay || 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('Terms & Conditions:-', M + 4, y);
  y += 3;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(`1. Fees once deposited will not be refunded under any circumstances.`, M + 4, y);
  y += 2.8;
  doc.text(`2. Monthly fee must be cleared on or before ${dueDay}th of each month. Late fine: Rs. ${lateFinePerDay}/day.`, M + 4, y);

  return doc;
}

// ─── PDF: Individual Fee Receipt (Exact School Voucher Design) ───────────────
export function exportReceiptPDF(payment, student, settings = {}) {
  try {
    const doc = createReceiptPDFDoc(payment, student, settings);
    doc.save(`Receipt_${payment.receiptNumber || 'receipt'}.pdf`);
  } catch (err) {
    console.error("PDF generation error:", err);
  }
}

// ─── PDF: Fee Structure (Class-wise) ─────────────────────────────────────────
export function exportFeeStructurePDF(students, settings) {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  const W = 210, M = 15;

  doc.setFillColor(26, 35, 126); doc.rect(0, 0, W, 28, 'F');
  doc.setTextColor(255, 215, 0); doc.setFontSize(16); doc.setFont('helvetica', 'bold');
  doc.text(settings.instituteName || 'School Manager', W / 2, 12, { align: 'center' });
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(200, 210, 255);
  doc.text('FEE STRUCTURE REPORT — ' + (settings.currentSession || new Date().getFullYear()), W / 2, 19, { align: 'center' });
  doc.text('Generated: ' + new Date().toLocaleDateString('en-IN'), W / 2, 25, { align: 'center' });

  // Group by class
  const groups = {};
  students.forEach(s => {
    const key = s.studentType === 'school' ? `Class ${s.className || 'Other'}` : (s.course || 'Other');
    if (!groups[key]) groups[key] = [];
    groups[key].push(s);
  });

  let y = 36;
  Object.entries(groups).sort().forEach(([cls, studs]) => {
    const total   = studs.reduce((a, s) => a + (s.totalFees || 0), 0);
    const paid    = studs.reduce((a, s) => a + (s.paidFees  || 0), 0);
    const pending = total - paid;

    doc.setFillColor(240, 243, 255); doc.roundedRect(M, y, W - 2 * M, 10, 2, 2, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(26, 35, 126);
    doc.text(cls, M + 4, y + 7);
    doc.setFontSize(8.5); doc.setTextColor(60, 60, 80);
    doc.text(`${studs.length} Students`, W - M - 4, y + 7, { align: 'right' });
    y += 12;

    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(40, 40, 60);
    [
      [`Total Fee Expected:`, `Rs. ${total.toLocaleString('en-IN')}`],
      [`Total Fee Collected:`, `Rs. ${paid.toLocaleString('en-IN')}`],
      [`Total Pending:`, `Rs. ${pending.toLocaleString('en-IN')}`],
    ].forEach(([lbl, val]) => {
      doc.text(lbl, M + 6, y); doc.text(val, W - M - 4, y, { align: 'right' });
      y += 6;
    });
    y += 4;
    if (y > 265) { doc.addPage(); y = 20; }
  });

  // Grand total
  doc.setFillColor(26, 35, 126); doc.roundedRect(M, y, W - 2 * M, 14, 2, 2, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(255, 255, 255);
  const gt = students.reduce((a, s) => a + (s.totalFees || 0), 0);
  const gp = students.reduce((a, s) => a + (s.paidFees  || 0), 0);
  doc.text(`GRAND TOTAL — Expected: Rs. ${gt.toLocaleString('en-IN')}  |  Collected: Rs. ${gp.toLocaleString('en-IN')}  |  Pending: Rs. ${(gt - gp).toLocaleString('en-IN')}`, W / 2, y + 9, { align: 'center' });

  doc.save(`FeeStructure_${settings.currentSession || 'report'}.pdf`);
}

// ─── PDF: Full Student List ───────────────────────────────────────────────────
export function exportStudentsPDF(students, settings) {
  const doc = new jsPDF({ orientation: 'landscape', format: 'a4', unit: 'mm' });
  const W = 297, M = 10;

  doc.setFillColor(26, 35, 126); doc.rect(0, 0, W, 20, 'F');
  doc.setTextColor(255, 215, 0); doc.setFontSize(13); doc.setFont('helvetica', 'bold');
  doc.text(`${settings.instituteName || 'School'} — Student Master List`, W / 2, 8, { align: 'center' });
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(200, 210, 255);
  doc.text(`Session: ${settings.currentSession || ''} | Total: ${students.length} | Generated: ${new Date().toLocaleDateString('en-IN')}`, W / 2, 15, { align: 'center' });

  const headers = ['#', 'ID', 'Name', 'Father', 'Class/Course', 'Mobile', 'Total Fee', 'Paid', 'Pending', 'Status'];
  const colW =    [ 8,   18,   42,     38,        28,             28,       22,          18,     22,         18];
  let y = 25;

  doc.setFillColor(240, 243, 255); doc.rect(M, y, W - 2 * M, 8, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(26, 35, 126);
  let x = M + 2;
  headers.forEach((h, i) => { doc.text(h, x, y + 5.5); x += colW[i]; });
  y += 9;

  doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(30, 30, 50);
  students.forEach((s, idx) => {
    if (y > 188) { doc.addPage(); y = 15; }
    const pending = Math.max(0, (s.totalFees || 0) - (s.paidFees || 0));
    const row = [
      String(idx + 1), s.studentId || '', s.name || '', s.fatherName || '',
      s.studentType === 'school' ? `Cls ${s.className || ''}${s.section ? '-' + s.section : ''}` : (s.course || ''),
      s.mobile || '',
      `Rs.${(s.totalFees || 0).toLocaleString('en-IN')}`,
      `Rs.${(s.paidFees  || 0).toLocaleString('en-IN')}`,
      `Rs.${pending.toLocaleString('en-IN')}`,
      (s.status || 'Active').toUpperCase()
    ];
    if (idx % 2 === 0) { doc.setFillColor(248, 249, 255); doc.rect(M, y - 1, W - 2 * M, 7, 'F'); }
    x = M + 2;
    if (pending > 0) doc.setTextColor(180, 30, 30); else doc.setTextColor(30, 30, 50);
    row.forEach((v, i) => {
      if (i !== row.length - 1 && i !== row.length - 2) doc.setTextColor(30, 30, 50);
      doc.text(String(v).substring(0, 20), x, y + 4.5); x += colW[i];
    });
    y += 7;
  });

  doc.save(`Students_${settings.instituteName?.replace(/[^a-zA-Z0-9]/g, '_') || 'list'}_${new Date().toISOString().split('T')[0]}.pdf`);
}

// ─── EXCEL IMPORT: Parse uploaded Excel → student objects ────────────────────
export function importStudentsFromExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb  = XLSX.read(e.target.result, { type: 'array' });
        const ws  = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
        const students = rows.map((r, idx) => ({
          name:         r['Full Name']  || r['Name'] || r['Student Name'] || '',
          fatherName:   r['Father Name'] || r['Father'] || '',
          motherName:   r['Mother Name'] || r['Mother'] || '',
          mobile:       String(r['Mobile'] || r['Phone'] || ''),
          alternateMobile: String(r['WhatsApp'] || r['Alternate Mobile'] || ''),
          gender:       r['Gender'] || '',
          dob:          r['DOB'] || r['Date of Birth'] || '',
          address:      r['Address'] || '',
          studentType:  (r['Type'] || '').toLowerCase().includes('computer') ? 'computer' : 'school',
          className:    r['Class'] || r['Class / Course'] || '',
          section:      r['Section'] || '',
          course:       r['Course'] || '',
          batch:        r['Batch'] || r['Roll / Batch'] || '',
          rollNumber:   String(r['Roll No'] || r['Roll Number'] || ''),
          totalFees:    Number(r['Total Fees (₹)'] || r['Total Fees'] || r['Total Fee'] || 0),
          paidFees:     Number(r['Paid Fees (₹)']  || r['Paid Fees']  || r['Paid Fee']  || 0),
          status:       (r['Status'] || 'active').toLowerCase(),
          admissionDate: r['Admission Date'] || '',
        })).filter(s => s.name.trim() !== '');
        resolve(students);
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}



/**
 * Export student list to Excel (.xlsx)
 */
export function exportStudentsToExcel(students, instituteName = 'Institute') {
  const data = students.map((s, idx) => ({
    'S.No': idx + 1,
    'Student ID': s.studentId || '',
    'Admission No': s.admissionNumber || '',
    'Full Name': s.name || '',
    'Father Name': s.fatherName || '',
    'Mother Name': s.motherName || '',
    'Type': s.studentType === 'school' ? 'School' : 'Computer Institute',
    'Class / Course': s.studentType === 'school' ? (s.className ? `Class ${s.className}${s.section ? ` - ${s.section}` : ''}` : '') : (s.course || ''),
    'Roll / Batch': s.studentType === 'school' ? (s.rollNumber || '') : (s.batch || ''),
    'Mobile': s.mobile || '',
    'WhatsApp': s.alternateMobile || s.mobile || '',
    'Gender': s.gender || '',
    'DOB': s.dob || '',
    'Total Fees (₹)': s.totalFees || 0,
    'Paid Fees (₹)': s.paidFees || 0,
    'Pending Fees (₹)': Math.max(0, (s.totalFees || 0) - (s.paidFees || 0)),
    'Status': s.status?.toUpperCase() || 'ACTIVE',
    'Admission Date': s.admissionDate || '',
    'Address': s.address || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

  // Auto-fit column widths
  const max_width = data.reduce((w, r) => Math.max(w, 20), 10);
  worksheet['!cols'] = Object.keys(data[0] || {}).map(() => ({ wch: 18 }));

  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `${instituteName.replace(/[^a-zA-Z0-9]/g, '_')}_Students_${dateStr}.xlsx`);
}

/**
 * Export payments history / ledger to Excel
 */
export function exportPaymentsToExcel(payments, instituteName = 'Institute') {
  const data = payments.map((p, idx) => ({
    'S.No': idx + 1,
    'Receipt No': p.receiptNumber || '',
    'Student Name': p.studentName || '',
    'Amount (₹)': p.amount || 0,
    'Payment Mode': p.paymentMode || 'Cash',
    'Date': p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '',
    'Fee Month / Term': p.feeMonth || '',
    'Remarks': p.remarks || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Fee Ledger');
  worksheet['!cols'] = Object.keys(data[0] || {}).map(() => ({ wch: 18 }));

  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `${instituteName.replace(/[^a-zA-Z0-9]/g, '_')}_Fee_Ledger_${dateStr}.xlsx`);
}

/**
 * Export Pending Fees / Defaulters List to Excel
 */
export function exportDefaultersToExcel(students, instituteName = 'Institute') {
  const defaulters = students
    .filter(s => ((s.totalFees || 0) - (s.paidFees || 0)) > 0)
    .map((s, idx) => {
      const pending = (s.totalFees || 0) - (s.paidFees || 0);
      return {
        'S.No': idx + 1,
        'Student ID': s.studentId || '',
        'Name': s.name || '',
        'Father Name': s.fatherName || '',
        'Class / Course': s.studentType === 'school' ? `Class ${s.className || ''}` : (s.course || ''),
        'Mobile': s.mobile || '',
        'Total Fees (₹)': s.totalFees || 0,
        'Paid Fees (₹)': s.paidFees || 0,
        'Pending Dues (₹)': pending,
        'Due Date': s.dueDate || 'N/A',
        'Status': s.status?.toUpperCase() || 'ACTIVE'
      };
    });

  const worksheet = XLSX.utils.json_to_sheet(defaulters);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Defaulters List');
  worksheet['!cols'] = Object.keys(defaulters[0] || {}).map(() => ({ wch: 18 }));

  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `${instituteName.replace(/[^a-zA-Z0-9]/g, '_')}_Fee_Defaulters_${dateStr}.xlsx`);
}

/**
 * Export Attendance Report to Excel
 */
export function exportAttendanceToExcel(students, attendance, dateStr, instituteName = 'Institute') {
  const dayRecords = attendance[dateStr] || {};
  const data = students.map((s, idx) => ({
    'S.No': idx + 1,
    'Student ID': s.studentId || '',
    'Roll No': s.rollNumber || '',
    'Name': s.name || '',
    'Father Name': s.fatherName || '',
    'Class / Course': s.studentType === 'school' ? `Class ${s.className || ''}` : (s.course || ''),
    'Date': dateStr,
    'Status': (dayRecords[s.id] || 'unmarked').toUpperCase(),
    'Mobile': s.mobile || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Attendance_${dateStr}`);
  worksheet['!cols'] = Object.keys(data[0] || {}).map(() => ({ wch: 18 }));

  XLSX.writeFile(workbook, `${instituteName.replace(/[^a-zA-Z0-9]/g, '_')}_Attendance_${dateStr}.xlsx`);
}

/**
 * Generate WhatsApp Fee Receipt Voucher Share (PDF File Direct Share & WhatsApp Web)
 */
export async function openWhatsAppReceiptShare(payment, student, settings = {}) {
  const mobile = student?.alternateMobile || student?.mobile || payment?.mobile;
  const cleanMobile = mobile ? mobile.replace(/[^0-9]/g, '') : '';
  const finalMobile = cleanMobile.length === 10 ? `91${cleanMobile}` : cleanMobile;

  // 1. Generate the exact Official Fee Receipt PDF Document
  let pdfFile = null;
  let pdfBlob = null;
  try {
    const doc = createReceiptPDFDoc(payment, student, settings);
    pdfBlob = doc.output('blob');
    pdfFile = new File([pdfBlob], `Receipt_${payment.receiptNumber || 'voucher'}.pdf`, {
      type: 'application/pdf',
      lastModified: Date.now()
    });
  } catch (err) {
    console.warn("Could not construct PDF file for WhatsApp share:", err);
  }

  // 2. Try Native / Mobile Web Share API Level 2 (Directly shares actual .PDF file to WhatsApp)
  if (pdfFile && typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
    try {
      await navigator.share({
        files: [pdfFile],
        title: `Fee Receipt Voucher - ${payment.receiptNumber || ''}`,
        text: `Official Fee Receipt for ${student?.name || payment?.studentName || 'Student'} (Receipt No: ${payment?.receiptNumber || '-'})`
      });
      return;
    } catch (shareErr) {
      if (shareErr.name === 'AbortError') {
        return; // User cancelled share modal
      }
      console.warn("navigator.share failed, continuing to desktop flow:", shareErr);
    }
  }

  // 3. Fallback for Desktop Browsers:
  // Automatically download the PDF Voucher so user has the PDF ready, and launch WhatsApp chat
  if (pdfBlob) {
    try {
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Receipt_${payment.receiptNumber || 'voucher'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e) {
      console.warn("Auto-download error:", e);
    }
  }

  if (finalMobile) {
    const paymentDate = payment?.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
    const classStr = student?.studentType === 'school' ? `Class ${student?.className || ''} - ${student?.section || 'A'}` : (student?.course || 'Student');

    const msg = `🧾 *OFFICIAL FEE RECEIPT VOUCHER (PDF)*
*${(settings?.instituteName || 'Smart School').toUpperCase()}*
📍 ${settings?.address || 'School Campus'} | 📞 ${settings?.mobile || '9876543210'}
━━━━━━━━━━━━━━━━━━━━
👤 *Student:* ${student?.name || payment?.studentName || '-'}
🆔 *Student ID:* ${student?.studentId || '-'}
📄 *Admission No:* ${student?.admissionNumber || '-'}
🏫 *Class / Course:* ${classStr}
💳 *Receipt No:* ${payment?.receiptNumber || 'REC000001'}
📅 *Payment Date:* ${paymentDate}
💵 *Amount Paid:* ₹${Number(payment?.amount || 0).toLocaleString('en-IN')} via ${payment?.paymentMode || 'Cash'}

📄 *The Official Fee Receipt PDF voucher has been generated for your records.*`;

    const waUrl = `https://wa.me/${finalMobile}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  } else {
    console.warn("Receipt PDF downloaded! No parent mobile number is registered for this student to open WhatsApp.");
  }
}

/**
 * Generate WhatsApp Fee Reminder URL
 */
export function openWhatsAppFeeReminder(student, settings) {
  const pending = Math.max(0, (student.totalFees || 0) - (student.paidFees || 0));
  const mobile = student.alternateMobile || student.mobile;
  if (!mobile) {
    console.warn("No mobile number found for this student!");
    return;
  }
  const cleanMobile = mobile.replace(/[^0-9]/g, '');
  const finalMobile = cleanMobile.length === 10 ? `91${cleanMobile}` : cleanMobile;

  const msg = `Dear Parent/Student,

Greetings from *${settings.instituteName}*!

This is a gentle reminder regarding the pending fee balance for *${student.name}* (${student.studentType === 'school' ? `Class ${student.className || ''}` : student.course || 'Student'}).

💰 *Total Fee:* ₹${student.totalFees || 0}
✅ *Fee Paid:* ₹${student.paidFees || 0}
⚠️ *Remaining Due:* ₹${pending}
${student.dueDate ? `📅 *Due Date:* ${student.dueDate}\n` : ''}
Kindly clear the balance at the earliest to ensure uninterrupted academic services.

For any queries, contact: ${settings.mobile}
Thank you!
*${settings.instituteName}*`;

  const url = `https://wa.me/${finalMobile}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

/**
 * Generate WhatsApp Attendance Notification URL
 */
export function openWhatsAppAttendanceAlert(student, status, dateStr, settings) {
  const mobile = student.alternateMobile || student.mobile;
  if (!mobile) {
    console.warn("No mobile number found for this student!");
    return;
  }
  const cleanMobile = mobile.replace(/[^0-9]/g, '');
  const finalMobile = cleanMobile.length === 10 ? `91${cleanMobile}` : cleanMobile;

  const actualStatus = typeof status === 'object' ? (status.status || 'present') : (status || 'present');
  const actualDate = typeof status === 'object' ? (status.date || dateStr || new Date().toISOString().split('T')[0]) : (dateStr || new Date().toISOString().split('T')[0]);
  const statusText = actualStatus === 'absent' ? '❌ ABSENT' : actualStatus === 'leave' ? '📝 ON LEAVE' : '✅ PRESENT';

  const msg = `Dear Parent,

Attendance Notification from *${settings?.instituteName || 'Smart School'}*:

👤 Student: *${student.name}*
🎓 Class/Course: *${student.studentType === 'school' ? `Class ${student.className || ''}` : student.course || ''}*
🆔 Roll / Adm No: *${student.admissionNumber || student.rollNumber || student.studentId || ''}*
📅 Date: *${actualDate}*
📊 Attendance: *${statusText}*

For any queries, please contact: ${settings?.mobile || ''}

Regards,
*${settings?.instituteName || 'Smart School'}*`;

  const url = `https://wa.me/${finalMobile}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

/**
 * PDF: Export Today's Daily Attendance Register
 */
export function exportTodayAttendancePDF(students, attendance, dateStr, settings) {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  const W = 210, M = 15;
  const dayRecords = attendance[dateStr] || {};

  // Header Banner
  doc.setFillColor(31, 16, 142);
  doc.rect(0, 0, W, 26, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15); doc.setFont('helvetica', 'bold');
  doc.text(settings?.instituteName || 'Smart School Management', W / 2, 10, { align: 'center' });
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.setTextColor(220, 233, 255);
  doc.text(`DAILY ATTENDANCE REGISTER — DATE: ${dateStr}`, W / 2, 17, { align: 'center' });
  doc.text(`Session: ${settings?.currentSession || '2026-27'}  |  Generated: ${new Date().toLocaleTimeString('en-IN')}`, W / 2, 22, { align: 'center' });

  // Summary Metrics Bar
  const total = students.length;
  let present = 0, absent = 0, leave = 0;
  students.forEach(s => {
    const st = dayRecords[s.id];
    if (st === 'present') present++;
    else if (st === 'absent') absent++;
    else if (st === 'leave') leave++;
  });
  const unmarked = total - (present + absent + leave);
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;

  doc.setFillColor(239, 244, 255);
  doc.roundedRect(M, 32, W - 2 * M, 14, 2, 2, 'F');
  doc.setFontSize(9); doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 16, 142);
  doc.text(`Total Students: ${total}`, M + 5, 41);
  doc.setTextColor(16, 185, 129);
  doc.text(`Present: ${present}`, M + 45, 41);
  doc.setTextColor(239, 68, 68);
  doc.text(`Absent: ${absent}`, M + 80, 41);
  doc.setTextColor(245, 158, 11);
  doc.text(`Leave: ${leave}`, M + 115, 41);
  doc.setTextColor(31, 16, 142);
  doc.text(`Rate: ${pct}%`, W - M - 20, 41);

  // Table Header
  let y = 54;
  doc.setFillColor(220, 233, 255);
  doc.rect(M, y - 5, W - 2 * M, 8, 'F');
  doc.setFontSize(8); doc.setFont('helvetica', 'bold');
  doc.setTextColor(11, 28, 48);
  doc.text('#', M + 2, y);
  doc.text('Adm No / ID', M + 10, y);
  doc.text('Student Name', M + 40, y);
  doc.text('Father Name', M + 85, y);
  doc.text('Class / Course', M + 130, y);
  doc.text('Status', W - M - 20, y);

  // Table Rows
  doc.setFont('helvetica', 'normal');
  students.forEach((s, idx) => {
    y += 7.5;
    if (y > 275) {
      doc.addPage();
      y = 20;
    }
    const st = dayRecords[s.id] || 'unmarked';
    doc.setTextColor(100, 100, 100);
    doc.text(String(idx + 1), M + 2, y);
    doc.setTextColor(31, 16, 142);
    doc.text(s.admissionNumber || s.studentId || '-', M + 10, y);
    doc.setTextColor(11, 28, 48);
    doc.setFont('helvetica', 'bold');
    doc.text(s.name || '-', M + 40, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(70, 70, 80);
    doc.text(s.fatherName || '-', M + 85, y);
    const cls = s.studentType === 'school' ? `Class ${s.className || ''}` : (s.course || '');
    doc.text(cls, M + 130, y);

    if (st === 'present') {
      doc.setTextColor(16, 185, 129); doc.setFont('helvetica', 'bold');
      doc.text('PRESENT', W - M - 20, y);
    } else if (st === 'absent') {
      doc.setTextColor(239, 68, 68); doc.setFont('helvetica', 'bold');
      doc.text('ABSENT', W - M - 20, y);
    } else if (st === 'leave') {
      doc.setTextColor(245, 158, 11); doc.setFont('helvetica', 'bold');
      doc.text('LEAVE', W - M - 20, y);
    } else {
      doc.setTextColor(150, 150, 150); doc.setFont('helvetica', 'normal');
      doc.text('UNMARKED', W - M - 20, y);
    }
    doc.setDrawColor(230, 235, 245); doc.line(M, y + 2, W - M, y + 2);
  });

  doc.save(`Daily_Attendance_${dateStr}.pdf`);
}

/**
 * PDF: Date Range Attendance Register (e.g. Month or Custom Span)
 */
export function exportDateRangeAttendancePDF(students, attendance, fromDate, toDate, settings) {
  const doc = new jsPDF({ orientation: 'landscape', format: 'a4', unit: 'mm' });
  const W = 297, M = 12;

  // Header Banner
  doc.setFillColor(31, 16, 142);
  doc.rect(0, 0, W, 24, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15); doc.setFont('helvetica', 'bold');
  doc.text(settings?.instituteName || 'Smart School Management', W / 2, 9, { align: 'center' });
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.setTextColor(220, 233, 255);
  doc.text(`ATTENDANCE REGISTER REPORT: ${fromDate} TO ${toDate}`, W / 2, 16, { align: 'center' });
  doc.text(`Session: ${settings?.currentSession || '2026-27'}  |  Total Enrolled: ${students.length}`, W / 2, 21, { align: 'center' });

  // Generate list of dates in range
  const dates = [];
  const curr = new Date(fromDate);
  const end = new Date(toDate);
  while (curr <= end && dates.length <= 31) {
    dates.push(curr.toISOString().split('T')[0]);
    curr.setDate(curr.getDate() + 1);
  }

  let y = 35;
  doc.setFillColor(220, 233, 255);
  doc.rect(M, y - 5, W - 2 * M, 7, 'F');
  doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
  doc.setTextColor(11, 28, 48);
  doc.text('Adm No', M + 2, y);
  doc.text('Student Name', M + 28, y);
  doc.text('Class', M + 68, y);

  // Date column headers
  const colStart = M + 95;
  const colW = Math.min(6, (W - colStart - M - 25) / Math.max(1, dates.length));
  dates.forEach((d, i) => {
    const dayNum = d.split('-')[2];
    doc.text(dayNum, colStart + i * colW, y);
  });
  doc.text('P', W - M - 22, y);
  doc.text('A', W - M - 14, y);
  doc.text('%', W - M - 6, y);

  // Table rows
  students.forEach((s, idx) => {
    y += 6.5;
    if (y > 195) {
      doc.addPage();
      y = 20;
    }
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
    doc.setTextColor(31, 16, 142);
    doc.text(s.admissionNumber || s.studentId || '-', M + 2, y);
    doc.setTextColor(11, 28, 48);
    doc.text(s.name?.substring(0, 18) || '-', M + 28, y);
    const cls = s.studentType === 'school' ? (s.className || '') : (s.course?.substring(0, 10) || '');
    doc.text(cls, M + 68, y);

    let pCount = 0, aCount = 0, totalMarked = 0;
    dates.forEach((d, i) => {
      const st = attendance[d]?.[s.id];
      if (st === 'present') {
        pCount++; totalMarked++;
        doc.setTextColor(16, 185, 129);
        doc.text('P', colStart + i * colW, y);
      } else if (st === 'absent') {
        aCount++; totalMarked++;
        doc.setTextColor(239, 68, 68);
        doc.text('A', colStart + i * colW, y);
      } else if (st === 'leave') {
        totalMarked++;
        doc.setTextColor(245, 158, 11);
        doc.text('L', colStart + i * colW, y);
      } else {
        doc.setTextColor(180, 180, 180);
        doc.text('-', colStart + i * colW, y);
      }
    });

    const pct = totalMarked > 0 ? Math.round((pCount / totalMarked) * 100) : 0;
    doc.setTextColor(16, 185, 129); doc.setFont('helvetica', 'bold');
    doc.text(String(pCount), W - M - 22, y);
    doc.setTextColor(239, 68, 68);
    doc.text(String(aCount), W - M - 14, y);
    doc.setTextColor(pct >= 75 ? 31 : 239, pct >= 75 ? 16 : 68, pct >= 75 ? 142 : 68);
    doc.text(`${pct}%`, W - M - 6, y);

    doc.setDrawColor(235, 240, 250); doc.line(M, y + 1.5, W - M, y + 1.5);
  });

  doc.save(`Attendance_Report_${fromDate}_to_${toDate}.pdf`);
}

/**
 * PDF: Individual Student Attendance Card
 */
export function exportStudentAttendancePDF(student, attendance, settings) {
  const doc = new jsPDF({ format: 'a5', unit: 'mm' });
  const W = 148, M = 12;

  // Header Banner
  doc.setFillColor(31, 16, 142);
  doc.rect(0, 0, W, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13); doc.setFont('helvetica', 'bold');
  doc.text(settings?.instituteName || 'Smart School', W / 2, 9, { align: 'center' });
  doc.setFontSize(8); doc.setFont('helvetica', 'normal');
  doc.setTextColor(220, 233, 255);
  doc.text('STUDENT ATTENDANCE PERFORMANCE REPORT', W / 2, 15, { align: 'center' });
  doc.text(`Session: ${settings?.currentSession || '2026-27'}`, W / 2, 19.5, { align: 'center' });

  // Student Particulars Card
  doc.setFillColor(239, 244, 255);
  doc.roundedRect(M, 28, W - 2 * M, 24, 2, 2, 'F');
  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(11, 28, 48);
  doc.text(student.name || '-', M + 4, 35);
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(70, 70, 90);
  const clsStr = student.studentType === 'school' ? `Class ${student.className || ''} (Sec ${student.section || 'A'})` : student.course || '';
  doc.text(`Class/Course: ${clsStr}`, M + 4, 41);
  doc.text(`Adm No: ${student.admissionNumber || '-'}  |  Roll: ${student.rollNumber || '-'}  |  ID: ${student.studentId || '-'}`, M + 4, 47);
  doc.text(`Father's Name: ${student.fatherName || '-'}  |  Mobile: ${student.mobile || '-'}`, M + 4, 53);

  // Compute attendance stats
  let presentDays = 0, absentDays = 0, leaveDays = 0, totalMarked = 0;
  const logEntries = [];
  Object.keys(attendance).sort().reverse().forEach(dateStr => {
    const st = attendance[dateStr]?.[student.id];
    if (st) {
      totalMarked++;
      if (st === 'present') presentDays++;
      else if (st === 'absent') absentDays++;
      else if (st === 'leave') leaveDays++;
      logEntries.push({ date: dateStr, status: st });
    }
  });

  const rate = totalMarked > 0 ? Math.round((presentDays / totalMarked) * 100) : 100;

  // Stat summary pills
  let y = 58;
  doc.setFontSize(8.5); doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text(`Present: ${presentDays}`, M + 4, y);
  doc.setTextColor(239, 68, 68);
  doc.text(`Absent: ${absentDays}`, M + 35, y);
  doc.setTextColor(245, 158, 11);
  doc.text(`Leave: ${leaveDays}`, M + 65, y);
  doc.setTextColor(31, 16, 142);
  doc.text(`Attendance Rate: ${rate}%`, W - M - 36, y);

  // Recent History Table
  y = 68;
  doc.setFillColor(220, 233, 255);
  doc.rect(M, y - 4, W - 2 * M, 6, 'F');
  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(11, 28, 48);
  doc.text('Date', M + 4, y);
  doc.text('Status', W / 2, y);
  doc.text('Remarks', W - M - 25, y);

  logEntries.slice(0, 15).forEach((entry, idx) => {
    y += 6;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
    doc.setTextColor(50, 50, 70);
    doc.text(entry.date, M + 4, y);
    if (entry.status === 'present') {
      doc.setTextColor(16, 185, 129); doc.setFont('helvetica', 'bold');
      doc.text('PRESENT', W / 2, y);
    } else if (entry.status === 'absent') {
      doc.setTextColor(239, 68, 68); doc.setFont('helvetica', 'bold');
      doc.text('ABSENT', W / 2, y);
    } else {
      doc.setTextColor(245, 158, 11); doc.setFont('helvetica', 'bold');
      doc.text('LEAVE', W / 2, y);
    }
    doc.setFont('helvetica', 'normal'); doc.setTextColor(120, 120, 140);
    doc.text('Recorded on cloud', W - M - 25, y);
    doc.setDrawColor(240, 240, 250); doc.line(M, y + 1.5, W - M, y + 1.5);
  });

  doc.save(`Attendance_${student.name?.replace(/\s+/g, '_')}.pdf`);
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * FULL STUDENT MASTER IMPORT & EXPORT SUITE (Aligned with Mobile App Schema)
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const STUDENT_TEMPLATE_COLUMNS = [
  { key: 'admissionNumber', header: 'Admission Number', example1: 'ADM-2026-001', example2: 'ADM-2026-002', required: true },
  { key: 'studentId', header: 'Student ID', example1: 'STU2026001', example2: 'STU2026002', required: true },
  { key: 'name', header: 'Student Name', example1: 'Rahul Sharma', example2: 'Priya Singh', required: true },
  { key: 'fatherName', header: "Father's Name", example1: 'Rajesh Sharma', example2: 'Suresh Singh', required: true },
  { key: 'motherName', header: "Mother's Name", example1: 'Sunita Sharma', example2: 'Kavita Singh', required: false },
  { key: 'mobile', header: 'Mobile', example1: '9876543210', example2: '9876543211', required: true },
  { key: 'alternateMobile', header: 'Alternate Mobile', example1: '9876543212', example2: '', required: false },
  { key: 'gender', header: 'Gender', example1: 'Male', example2: 'Female', required: false },
  { key: 'dob', header: 'Date of Birth', example1: '2010-01-01', example2: '2012-06-15', required: false },
  { key: 'address', header: 'Address', example1: 'Main Market, Siwan', example2: 'Station Road, Patna', required: true },
  { key: 'studentType', header: 'Student Type', example1: 'school', example2: 'computer', required: true },
  { key: 'className', header: 'Class', example1: '10th', example2: '', required: false },
  { key: 'section', header: 'Section', example1: 'A', example2: '', required: false },
  { key: 'rollNumber', header: 'Roll Number', example1: '15', example2: '', required: false },
  { key: 'course', header: 'Course', example1: '', example2: 'ADCA (12 Months)', required: false },
  { key: 'batch', header: 'Batch', example1: '', example2: '10:00 AM - 12:00 PM', required: false },
  { key: 'admissionDate', header: 'Admission Date', example1: '2026-04-01', example2: '2026-04-05', required: false },
  { key: 'session', header: 'Academic Session', example1: '2026-27', example2: '2026-27', required: false },
  { key: 'status', header: 'Status', example1: 'active', example2: 'active', required: false },
  { key: 'admissionFee', header: 'Admission Fee', example1: '2500', example2: '2000', required: false },
  { key: 'tuitionFee', header: 'Tuition Fee', example1: '3000', example2: '3500', required: false },
  { key: 'monthlyFee', header: 'Monthly Fee', example1: '1500', example2: '1800', required: false },
  { key: 'examinationFee', header: 'Examination Fee', example1: '500', example2: '500', required: false },
  { key: 'previousDues', header: 'Previous Dues', example1: '0', example2: '0', required: false },
  { key: 'gameFee', header: 'Game Fee', example1: '300', example2: '300', required: false },
  { key: 'reAdmissionFee', header: 'Re-Admission Fee', example1: '0', example2: '0', required: false },
  { key: 'developmentFee', header: 'Development Fee', example1: '500', example2: '500', required: false },
  { key: 'schoolIdFee', header: 'School ID Fee', example1: '150', example2: '150', required: false },
  { key: 'tieBagBeltFee', header: 'Tie Bag Belt Fee', example1: '450', example2: '450', required: false },
  { key: 'backDues', header: 'Back Dues', example1: '0', example2: '0', required: false },
  { key: 'transportFee', header: 'Transport Fee', example1: '800', example2: '0', required: false },
  { key: 'otherFee', header: 'Other Fee', example1: '0', example2: '0', required: false },
  { key: 'totalFees', header: 'Total Annual Fees', example1: '9700', example2: '8900', required: false },
  { key: 'paidFees', header: 'Paid Fees', example1: '3000', example2: '8900', required: false },
  { key: 'dueDate', header: 'Due Date', example1: '2026-05-10', example2: '2026-05-10', required: false }
];

/**
 * 1. Download Official Excel Import Template (.xlsx) matching Mobile App Template
 */
export function downloadStudentImportTemplate(instituteName = 'Smart School') {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Template Data with Header + Example Rows
  const headers = STUDENT_TEMPLATE_COLUMNS.map(c => c.header);
  const rowExample1 = STUDENT_TEMPLATE_COLUMNS.map(c => c.example1);
  const rowExample2 = STUDENT_TEMPLATE_COLUMNS.map(c => c.example2);
  const promptRow = ['← Start entering student data here from row 4'];

  const wsData = [headers, rowExample1, rowExample2, promptRow];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  ws['!cols'] = STUDENT_TEMPLATE_COLUMNS.map(() => ({ wch: 20 }));
  XLSX.utils.book_append_sheet(wb, ws, 'Import Template');

  // Sheet 2: Instructions Sheet
  const instructions = [
    ['STUDENT DATABASE IMPORT TEMPLATE INSTRUCTIONS'],
    [''],
    ['1. Do NOT delete or rename the "Import Template" sheet.'],
    ['2. Do NOT modify or re-order the header row (Row 1).'],
    ['3. Example rows (2 and 3) are for reference only and will NOT be imported.'],
    ['4. Enter your new student records starting from Row 4.'],
    ['5. Required columns: Admission Number, Student ID, Student Name, Father\'s Name, Mobile, Address, Student Type.'],
    ['6. Student Type must be either "school" or "computer" (lowercase).'],
    ['7. Date format: YYYY-MM-DD or DD-MM-YYYY (e.g. 2026-04-01 or 01-04-2026).'],
    ['8. Status options: active | left | completed | suspended.'],
    ['9. Fee amounts must be numbers only (without ₹ or currency symbols).'],
    ['10. Save the file and upload back via the Reports / Import Center on Web or Mobile App.']
  ];
  const wsInst = XLSX.utils.aoa_to_sheet(instructions);
  wsInst['!cols'] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsInst, 'Instructions');

  const cleanName = (instituteName || 'Smart_School').replace(/[^a-zA-Z0-9]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `${cleanName}_Student_Import_Template_${dateStr}.xlsx`);
}

/**
 * 2. Export Complete Student Master Database to Excel (.xlsx) with all 35+ fields
 */
export function exportFullStudentsMasterToExcel(students, instituteName = 'Institute') {
  const data = students.map((s, idx) => {
    const totalFees = Number(s.totalFees) || 0;
    const paidFees = Number(s.paidFees) || 0;
    const pendingDues = Math.max(0, totalFees - paidFees);
    const fs = s.feeStructure || {};

    return {
      'S.No': idx + 1,
      'Admission Number': s.admissionNumber || '',
      'Student ID': s.studentId || '',
      'Student Name': s.name || '',
      "Father's Name": s.fatherName || '',
      "Mother's Name": s.motherName || '',
      'Mobile': s.mobile || '',
      'Alternate Mobile': s.alternateMobile || '',
      'Gender': s.gender || 'Male',
      'Date of Birth': s.dob || '',
      'Residential Address': s.address || '',
      'Student Type': s.studentType === 'school' ? 'School' : 'Computer Institute',
      'Class': s.studentType === 'school' ? (s.className || '') : '',
      'Section': s.studentType === 'school' ? (s.section || 'A') : '',
      'Roll Number': s.rollNumber || '',
      'Course': s.studentType === 'computer' ? (s.course || '') : '',
      'Batch': s.studentType === 'computer' ? (s.batch || '') : '',
      'Admission Date': s.admissionDate || '',
      'Academic Session': s.session || '2026-27',
      'Enrollment Status': (s.status || 'Active').toUpperCase(),
      'Admission Fee (₹)': Number(fs.admissionFee || 0),
      'Tuition Fee (₹)': Number(fs.tuitionFee || s.monthlyFee || 0),
      'Monthly Fee (₹)': Number(s.monthlyFee || fs.tuitionFee || 0),
      'Examination Fee (₹)': Number(fs.examinationFee || 0),
      'Previous Dues (₹)': Number(fs.previousDues || 0),
      'Game Fee (₹)': Number(fs.gameFee || 0),
      'Re-Admission Fee (₹)': Number(fs.reAdmissionFee || 0),
      'Development Fee (₹)': Number(fs.developmentFee || 0),
      'School ID Fee (₹)': Number(fs.schoolIdFee || 0),
      'Tie Bag Belt Fee (₹)': Number(fs.tieBagBeltFee || 0),
      'Back Dues (₹)': Number(fs.backDues || 0),
      'Transport Fee (₹)': Number(fs.transportFee || 0),
      'Other Fee (₹)': Number(fs.otherFee || 0),
      'Total Annual Fees (₹)': totalFees,
      'Total Paid Fees (₹)': paidFees,
      'Outstanding Dues (₹)': pendingDues,
      'Fee Status': pendingDues === 0 && totalFees > 0 ? 'PAID' : (paidFees === 0 ? 'UNPAID' : 'PARTIAL DUE'),
      'Due Date': s.dueDate || '10th of Month'
    };
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Student Master Directory');

  ws['!cols'] = Object.keys(data[0] || {}).map(() => ({ wch: 18 }));

  const cleanName = (instituteName || 'Smart_School').replace(/[^a-zA-Z0-9]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `${cleanName}_Complete_Student_Master_${dateStr}.xlsx`);
}

/**
 * 3. Export Complete Student Master Database to Formal Landscape PDF
 */
export function exportFullStudentsMasterPDF(students, settings = {}) {
  const doc = new jsPDF({ orientation: 'landscape', format: 'a4', unit: 'mm' });
  const W = 297, M = 10;

  // Header Banner
  doc.setFillColor(31, 16, 142);
  doc.rect(0, 0, W, 25, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16); doc.setFont('helvetica', 'bold');
  doc.text((settings?.instituteName || 'Smart School').toUpperCase(), W / 2, 9, { align: 'center' });
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.setTextColor(220, 233, 255);
  doc.text('OFFICIAL COMPREHENSIVE STUDENT MASTER DIRECTORY REGISTER', W / 2, 16, { align: 'center' });
  doc.text(`Academic Session: ${settings?.currentSession || '2026-27'}  |  Total Enrolled Students: ${students.length}  |  Generated: ${new Date().toLocaleDateString('en-GB')}`, W / 2, 21, { align: 'center' });

  let y = 33;
  // Table Column Headers
  doc.setFillColor(220, 233, 255);
  doc.rect(M, y - 4, W - 2 * M, 7, 'F');
  doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
  doc.setTextColor(11, 28, 48);

  doc.text('S.N', M + 2, y);
  doc.text('Adm No', M + 10, y);
  doc.text('Student Name', M + 34, y);
  doc.text("Father's Name", M + 75, y);
  doc.text('Class / Course', M + 115, y);
  doc.text('Roll', M + 145, y);
  doc.text('Mobile', M + 158, y);
  doc.text('Total (₹)', M + 185, y);
  doc.text('Paid (₹)', M + 205, y);
  doc.text('Due (₹)', M + 225, y);
  doc.text('Fee Status', M + 245, y);
  doc.text('Status', M + 268, y);

  // Table Body Rows
  students.forEach((s, idx) => {
    y += 6.2;
    if (y > 192) {
      doc.addPage();
      y = 20;
      // Repeat header on new page
      doc.setFillColor(220, 233, 255);
      doc.rect(M, y - 4, W - 2 * M, 7, 'F');
      doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
      doc.setTextColor(11, 28, 48);
      doc.text('S.N', M + 2, y);
      doc.text('Adm No', M + 10, y);
      doc.text('Student Name', M + 34, y);
      doc.text("Father's Name", M + 75, y);
      doc.text('Class / Course', M + 115, y);
      doc.text('Roll', M + 145, y);
      doc.text('Mobile', M + 158, y);
      doc.text('Total (₹)', M + 185, y);
      doc.text('Paid (₹)', M + 205, y);
      doc.text('Due (₹)', M + 225, y);
      doc.text('Fee Status', M + 245, y);
      doc.text('Status', M + 268, y);
      y += 6.2;
    }

    const totalFees = Number(s.totalFees) || 0;
    const paidFees = Number(s.paidFees) || 0;
    const dues = Math.max(0, totalFees - paidFees);
    const clsStr = s.studentType === 'school' ? `Class ${s.className || ''} (${s.section || 'A'})` : (s.course?.substring(0, 14) || '');

    doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
    doc.setTextColor(50, 50, 70);
    doc.text(String(idx + 1), M + 2, y);
    doc.setTextColor(31, 16, 142); doc.setFont('helvetica', 'bold');
    doc.text(s.admissionNumber || s.studentId || '-', M + 10, y);
    doc.setTextColor(11, 28, 48);
    doc.text((s.name || '').substring(0, 20), M + 34, y);
    doc.setFont('helvetica', 'normal');
    doc.text((s.fatherName || '-').substring(0, 18), M + 75, y);
    doc.text(clsStr, M + 115, y);
    doc.text(s.rollNumber || '-', M + 145, y);
    doc.text(s.mobile || '-', M + 158, y);

    doc.text(String(totalFees), M + 185, y);
    doc.setTextColor(16, 185, 129);
    doc.text(String(paidFees), M + 205, y);
    doc.setTextColor(dues > 0 ? 239 : 16, dues > 0 ? 68 : 185, dues > 0 ? 68 : 129);
    doc.text(String(dues), M + 225, y);

    // Fee Status Badge text
    if (dues === 0 && totalFees > 0) {
      doc.setTextColor(16, 185, 129); doc.setFont('helvetica', 'bold');
      doc.text('PAID', M + 245, y);
    } else if (paidFees === 0) {
      doc.setTextColor(239, 68, 68); doc.setFont('helvetica', 'bold');
      doc.text('UNPAID', M + 245, y);
    } else {
      doc.setTextColor(245, 158, 11); doc.setFont('helvetica', 'bold');
      doc.text('DUE', M + 245, y);
    }

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(16, 185, 129);
    doc.text((s.status || 'Active').toUpperCase(), M + 268, y);

    doc.setDrawColor(235, 240, 250);
    doc.line(M, y + 1.8, W - M, y + 1.8);
  });

  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`Student_Master_Register_${dateStr}.pdf`);
}

/**
 * 4. Comprehensive Excel / CSV Import Parser (matching Mobile App Template)
 */
export function importFullStudentsFromExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (json.length < 2) {
          throw new Error("The Excel file is empty or does not contain a header row.");
        }

        const rawHeaders = json[0] || [];
        const normalize = (str) => String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '');

        // Map column header index to field
        const headerIndexMap = {};
        rawHeaders.forEach((h, idx) => {
          const norm = normalize(h);
          if (norm.includes('admissionno') || norm.includes('admno') || norm === 'admissionnumber') headerIndexMap.admissionNumber = idx;
          else if (norm.includes('studentid') || norm === 'id') headerIndexMap.studentId = idx;
          else if (norm.includes('name') && !norm.includes('father') && !norm.includes('mother')) headerIndexMap.name = idx;
          else if (norm.includes('father')) headerIndexMap.fatherName = idx;
          else if (norm.includes('mother')) headerIndexMap.motherName = idx;
          else if (norm === 'mobile' || norm.includes('phone') || norm.includes('contact')) headerIndexMap.mobile = idx;
          else if (norm.includes('alt') || norm.includes('whatsapp')) headerIndexMap.alternateMobile = idx;
          else if (norm.includes('gender') || norm.includes('sex')) headerIndexMap.gender = idx;
          else if (norm.includes('dob') || norm.includes('birth')) headerIndexMap.dob = idx;
          else if (norm.includes('address') || norm.includes('city')) headerIndexMap.address = idx;
          else if (norm.includes('type')) headerIndexMap.studentType = idx;
          else if (norm === 'class' || norm.includes('grade') || norm.includes('classname')) headerIndexMap.className = idx;
          else if (norm === 'section' || norm.includes('sec')) headerIndexMap.section = idx;
          else if (norm.includes('roll')) headerIndexMap.rollNumber = idx;
          else if (norm.includes('course')) headerIndexMap.course = idx;
          else if (norm.includes('batch')) headerIndexMap.batch = idx;
          else if (norm.includes('session')) headerIndexMap.session = idx;
          else if (norm.includes('status')) headerIndexMap.status = idx;
          else if (norm.includes('admissionfee')) headerIndexMap.admissionFee = idx;
          else if (norm.includes('tuitionfee')) headerIndexMap.tuitionFee = idx;
          else if (norm.includes('monthlyfee')) headerIndexMap.monthlyFee = idx;
          else if (norm.includes('examfee') || norm.includes('examinationfee')) headerIndexMap.examinationFee = idx;
          else if (norm.includes('prevdue') || norm.includes('previousdue')) headerIndexMap.previousDues = idx;
          else if (norm.includes('gamefee')) headerIndexMap.gameFee = idx;
          else if (norm.includes('transportfee')) headerIndexMap.transportFee = idx;
          else if (norm.includes('totalfee') || norm.includes('total')) headerIndexMap.totalFees = idx;
          else if (norm.includes('paidfee') || norm.includes('paid')) headerIndexMap.paidFees = idx;
          else if (norm.includes('duedate')) headerIndexMap.dueDate = idx;
        });

        const rows = json.slice(1);
        const importedStudents = [];

        rows.forEach((row, rowIdx) => {
          if (!row || row.length === 0) return;
          const val = (idx) => (idx !== undefined && row[idx] !== undefined) ? String(row[idx]).trim() : '';

          const name = val(headerIndexMap.name) || val(2);
          if (!name || name.startsWith('←') || name.toLowerCase().includes('example') || name === 'Student Name') return;

          const fatherName = val(headerIndexMap.fatherName) || val(3) || 'Father';
          const mobile = val(headerIndexMap.mobile) || val(5) || '9876543210';
          const studentType = (val(headerIndexMap.studentType) || 'school').toLowerCase().includes('comp') ? 'computer' : 'school';
          const className = val(headerIndexMap.className) || '10th';
          const section = val(headerIndexMap.section) || 'A';
          const rollNumber = val(headerIndexMap.rollNumber) || String(rowIdx + 1);
          const course = val(headerIndexMap.course) || 'ADCA (12 Months)';
          const batch = val(headerIndexMap.batch) || '10:00 AM - 12:00 PM';
          const address = val(headerIndexMap.address) || val(9) || 'Siwan, Bihar';
          const dob = val(headerIndexMap.dob) || '2010-01-01';
          const gender = val(headerIndexMap.gender) || 'Male';
          const admNo = val(headerIndexMap.admissionNumber) || val(0) || `ADM-${Date.now().toString().slice(-4)}`;
          const stuId = val(headerIndexMap.studentId) || val(1) || `STU${Date.now().toString().slice(-4)}`;

          const totalFees = Number(val(headerIndexMap.totalFees)) || Number(val(headerIndexMap.tuitionFee)) || 5000;
          const paidFees = Number(val(headerIndexMap.paidFees)) || 0;

          importedStudents.push({
            name,
            fatherName,
            motherName: val(headerIndexMap.motherName) || '',
            mobile,
            alternateMobile: val(headerIndexMap.alternateMobile) || '',
            studentType,
            className,
            section,
            rollNumber,
            course,
            batch,
            address,
            dob,
            gender,
            admissionNumber: admNo,
            studentId: stuId,
            session: val(headerIndexMap.session) || '2026-27',
            status: val(headerIndexMap.status) || 'active',
            admissionDate: new Date().toISOString().split('T')[0],
            totalFees,
            paidFees,
            feeStructure: {
              admissionFee: Number(val(headerIndexMap.admissionFee)) || 0,
              tuitionFee: Number(val(headerIndexMap.tuitionFee)) || totalFees,
              monthlyFee: Number(val(headerIndexMap.monthlyFee)) || 0,
              examinationFee: Number(val(headerIndexMap.examinationFee)) || 0,
              previousDues: Number(val(headerIndexMap.previousDues)) || 0,
              gameFee: Number(val(headerIndexMap.gameFee)) || 0,
              transportFee: Number(val(headerIndexMap.transportFee)) || 0,
              lateFinePerDay: 0,
              dueDay: 10
            }
          });
        });

        if (importedStudents.length === 0) {
          throw new Error("No valid student rows found in the selected Excel sheet. Please make sure data starts from row 4 or headers are valid.");
        }

        resolve(importedStudents);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

