'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialSettings, initialStudents, initialPayments, initialAttendance, initialResults, initialTeachers } from './demoData';
import { db, auth } from './firebase';
import {
  collection, doc, getDocs, setDoc, deleteDoc, updateDoc,
  onSnapshot, serverTimestamp, query, orderBy, getDoc, limit, where
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updatePassword as fbUpdatePassword
} from 'firebase/auth';

const SchoolContext = createContext(null);
const STORAGE_KEYS = {
  ROLE: 'school_manager_user_role_v1',
  THEME: 'school_manager_theme_mode_v1',
  USER: 'school_manager_logged_user_v1',
  PATH: 'school_manager_current_path_v1',
  SCHOOL_ID: 'school_manager_active_school_uid_v1'
};

/**
 * Multi-School Resolution Helper:
 * All data is unified strictly under 'SCHOOL_001' so Teachers, Students, Fees, and Attendance are all in one place.
 */
export const getActiveSchoolId = () => 'SCHOOL_001';

export const getActiveSchoolUid = getActiveSchoolId;

/**
 * Root Firestore path helpers:
 * Strictly bound to schools/SCHOOL_001/...
 */
const fsCol = (col, customSchoolId = null) => {
  return collection(db, 'schools', 'SCHOOL_001', col);
};

const fsDoc = (col, id, customSchoolId = null) => {
  return doc(db, 'schools', 'SCHOOL_001', col, id);
};

/**
 * Auto-generate next unique Admission Number (e.g., ADM-2026-001, ADM-2027-001)
 */
export function getNextAdmissionNumber(studentsOrSession = [], session = '2026-27') {
  const students = Array.isArray(studentsOrSession) ? studentsOrSession : [];
  const activeSession = typeof studentsOrSession === 'string' ? studentsOrSession : session;
  const yearMatch = String(activeSession).match(/\d{4}/);
  const year = yearMatch ? yearMatch[0] : String(new Date().getFullYear());
  const regex = new RegExp(`ADM-${year}-(\\d+)`, 'i');
  let maxSeq = 0;

  (students || []).forEach(s => {
    const adm = s.admissionNo || s.admissionNumber || '';
    const match = adm.match(regex);
    if (match && match[1]) {
      const seq = parseInt(match[1], 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  });

  const nextSeq = maxSeq + 1;
  return `ADM-${year}-${String(nextSeq).padStart(3, '0')}`;
}

/**
 * Auto-generate next unique Student System ID (e.g., STU2026001, STU2027001)
 */
export function getNextStudentId(studentsOrSession = [], session = '2026-27') {
  const students = Array.isArray(studentsOrSession) ? studentsOrSession : [];
  const activeSession = typeof studentsOrSession === 'string' ? studentsOrSession : session;
  const yearMatch = String(activeSession).match(/\d{4}/);
  const year = yearMatch ? yearMatch[0] : String(new Date().getFullYear());
  const regex = new RegExp(`STU${year}(\\d+)`, 'i');
  let maxSeq = 0;

  (students || []).forEach(s => {
    const id = s.studentId || '';
    const match = id.match(regex);
    if (match && match[1]) {
      const seq = parseInt(match[1], 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  });

  const nextSeq = maxSeq + 1;
  return `STU${year}${String(nextSeq).padStart(3, '0')}`;
}

/**
 * Auto-generate next unique Receipt Number (e.g., REC-2026-001)
 */
export function getNextReceiptNumber(payments = [], year = new Date().getFullYear(), prefix = 'REC') {
  const y = String(year).match(/\d{4}/) ? String(year).match(/\d{4}/)[0] : String(new Date().getFullYear());
  const regex = new RegExp(`${prefix}-${y}-(\\d+)`, 'i');
  let maxSeq = 0;

  (payments || []).forEach(p => {
    const rec = p.receiptNo || p.receiptNumber || '';
    const match = rec.match(regex);
    if (match && match[1]) {
      const seq = parseInt(match[1], 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  });

  const nextSeq = maxSeq + 1;
  return `${prefix}-${y}-${String(nextSeq).padStart(3, '0')}`;
}

/**
 * Chronological Month Ledger with Automatic Previous Dues Rollover & Recurring Fee Auto-Addition
 */
/**
 * Chronological Month Ledger with Automatic Previous Dues Rollover & Recurring Fee Auto-Addition
 */
export function getStudentMonthLedger(student, payments = []) {
  if (!student) return {};

  const studentPayments = payments.filter(
    p => p.studentId === student.id || (student.studentId && p.studentId === student.studentId)
  );
  const latestPaymentAmt = studentPayments.length > 0 ? (Number(studentPayments[0].amount) || 0) : 0;

  const fs = student.feeStructure || {};
  let recurringTuition = 0;
  if (fs.tuitionFee !== undefined && fs.tuitionFee !== '' && fs.tuitionFee !== null && Number(fs.tuitionFee) > 0) {
    recurringTuition = Number(fs.tuitionFee);
  } else if (student.monthlyFee !== undefined && student.monthlyFee !== '' && Number(student.monthlyFee) > 0) {
    recurringTuition = Number(student.monthlyFee);
  } else if (student.totalFees && Number(student.totalFees) > 0) {
    recurringTuition = Math.round(Number(student.totalFees) / 12) || Number(student.totalFees);
  } else if (student.totalFee && Number(student.totalFee) > 0) {
    recurringTuition = Math.round(Number(student.totalFee) / 12) || Number(student.totalFee);
  } else if (latestPaymentAmt > 0) {
    recurringTuition = latestPaymentAmt;
  }

  const recurringTransport = Number(fs.transportFee) || 0;
  const recurringGame = Number(fs.gameFee) || 0;
  const initialPreviousDue = Number(student.previousDue) || 0;

  const now = new Date();
  const currentYear = now.getFullYear();

  // Start chronological ledger from academic session start (April) or admission date
  let startYear = currentYear;
  let startMonthIndex = 3; // April (0-indexed 3)

  if (student.admissionDate) {
    const adm = new Date(student.admissionDate);
    if (!isNaN(adm.getTime())) {
      startYear = adm.getFullYear();
      startMonthIndex = adm.getMonth();
    }
  }

  if (isNaN(startYear) || startYear < 2000 || startYear > currentYear + 5) {
    startYear = currentYear;
    startMonthIndex = 3;
  }

  const ledgerByMonth = {};
  let rollingPreviousDue = initialPreviousDue;

  const mNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  for (let i = 0; i < 48; i++) {
    const d = new Date(startYear, startMonthIndex + i, 1);
    const mYear = d.getFullYear();
    const mNum = d.getMonth() + 1;
    const mKey = `${mYear}-${String(mNum).padStart(2, '0')}`;
    const mLabel = `${mNames[d.getMonth()]} ${mYear}`;

    const mp = student.monthlyParticulars?.[mKey] || {};

    const tuition = (mp.tuitionFee !== undefined && mp.tuitionFee !== '' && mp.tuitionFee !== null && Number(mp.tuitionFee) > 0)
      ? Number(mp.tuitionFee)
      : recurringTuition;

    const transport = (mp.transportFee !== undefined && mp.transportFee !== '' && mp.transportFee !== null)
      ? Number(mp.transportFee)
      : recurringTransport;

    const game = (mp.gameFee !== undefined && mp.gameFee !== '' && mp.gameFee !== null)
      ? Number(mp.gameFee)
      : recurringGame;

    const exam = Number(mp.examinationFee || mp.examFee) || 0;
    const reAdm = Number(mp.reAdmissionFee) || 0;
    const dev = Number(mp.developmentFee) || 0;
    const admFee = Number(mp.admissionFee) || 0;
    const idFee = Number(mp.idCardFee || mp.schoolId) || 0;
    const tieFee = Number(mp.tieBagBelt) || 0;
    const other = Number(mp.otherFee) || 0;
    const backDues = Number(mp.backDues) || 0;

    const dueDay = Number(fs.dueDay) || 10;
    const lateFinePerDay = Number(fs.lateFinePerDay) || 0;
    let lateFine = 0;
    if (mp.lateFine !== undefined && mp.lateFine !== '' && mp.lateFine !== null) {
      lateFine = Number(mp.lateFine) || 0;
    } else if (lateFinePerDay > 0) {
      const dueDateObj = new Date(mYear, mNum - 1, dueDay);
      if (now > dueDateObj && mKey <= `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`) {
        const diffTime = Math.max(0, now.getTime() - dueDateObj.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 0) {
          lateFine = diffDays * lateFinePerDay;
        }
      }
    }

    const effectivePrevDue = rollingPreviousDue;
    const totalMonthCharge = tuition + transport + game + exam + reAdm + dev + admFee + idFee + tieFee + backDues + lateFine + other;
    const totalDueThisMonth = effectivePrevDue + totalMonthCharge;

    const monthPayments = studentPayments.filter(p => {
      if (p.monthKey === mKey) return true;
      if (p.feeMonth === mLabel) return true;
      if (p.feeMonth && p.feeMonth.includes(mNames[d.getMonth()]) && p.feeMonth.includes(String(mYear))) return true;
      if (p.paymentDate) {
        const pDate = new Date(p.paymentDate);
        if (pDate.getFullYear() === mYear && pDate.getMonth() === d.getMonth()) return true;
      }
      return false;
    });

    const paidInMonth = monthPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    const closingDue = Math.max(0, totalDueThisMonth - paidInMonth);

    ledgerByMonth[mKey] = {
      monthKey: mKey,
      monthLabel: mLabel,
      monthName: mLabel,
      previousDue: effectivePrevDue,
      tuitionFee: tuition,
      transportFee: transport,
      gameFee: game,
      examinationFee: exam,
      admissionFee: admFee,
      developmentFee: dev,
      schoolId: idFee,
      tieBagBelt: tieFee,
      backDues,
      lateFine,
      otherFee: other,
      totalMonthCharge,
      totalDueThisMonth,
      paidInMonth,
      closingDue,
      dueDate: mp.dueDate || `${mYear}-${String(mNum).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`
    };

    rollingPreviousDue = closingDue;
  }

  return ledgerByMonth;
}

export function calculateStudentFeeMetrics(student, payments = []) {
  if (!student) {
    return {
      monthlyFee: 0,
      elapsedMonths: 1,
      oneTimeFees: 0,
      accruedExpected: 0,
      setTotalFees: 0,
      totalPaid: 0,
      currentDue: 0,
      remainingFees: 0
    };
  }

  const ledger = getStudentMonthLedger(student, payments);
  const now = new Date();
  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthData = ledger[currentKey] || Object.values(ledger)[0] || {
    previousDue: 0,
    tuitionFee: 0,
    totalMonthCharge: 0,
    totalDueThisMonth: 0,
    paidInMonth: 0,
    closingDue: 0
  };

  const fs = student.feeStructure || {};
  const monthlyFee = (fs.tuitionFee !== undefined && fs.tuitionFee !== '' && fs.tuitionFee !== null)
    ? (Number(fs.tuitionFee) + (Number(fs.transportFee) || 0) + (Number(fs.gameFee) || 0))
    : (Number(student.monthlyFee) || 0);

  const studentPayments = payments.filter(p => p.studentId === student.id || (student.studentId && p.studentId === student.studentId));
  const totalPaid = studentPayments.reduce((a, p) => a + (Number(p.amount) || 0), 0) || Number(student.paidFees) || Number(student.totalPaid) || 0;

  let accruedExpected = 0;
  Object.values(ledger).forEach(m => {
    if (m.monthKey <= currentKey) {
      accruedExpected += m.totalMonthCharge;
    }
  });
  accruedExpected += Number(student.previousDue) || 0;

  const totalFeeVal = Number(student.totalFees) || Number(student.totalFee) || 0;
  if (accruedExpected === 0 && totalFeeVal > 0) {
    accruedExpected = totalFeeVal;
  }

  // Calculate currentDue:
  // If monthly particulars/ledger has active charges for this month, use closingDue
  // If totalFees is set (course/session total), calculate totalFees - totalPaid
  // Or check student.remainingFees / student.totalPending
  let currentDue = 0;
  if (currentMonthData && currentMonthData.closingDue > 0) {
    currentDue = currentMonthData.closingDue;
  } else if (totalFeeVal > 0) {
    currentDue = Math.max(0, totalFeeVal - totalPaid);
  } else if (accruedExpected > 0) {
    currentDue = Math.max(0, accruedExpected - totalPaid);
  } else if (student.remainingFees !== undefined && Number(student.remainingFees) > 0) {
    currentDue = Number(student.remainingFees);
  } else if (student.totalPending !== undefined && Number(student.totalPending) > 0) {
    currentDue = Number(student.totalPending);
  }

  const setTotalFees = totalFeeVal > 0 ? totalFeeVal : (accruedExpected > 0 ? accruedExpected : (totalPaid + currentDue));

  return {
    monthlyFee,
    elapsedMonths: Object.keys(ledger).filter(k => k <= currentKey).length || 1,
    oneTimeFees: 0,
    accruedExpected,
    setTotalFees,
    totalPaid,
    currentDue,
    remainingFees: currentDue,
    currentMonthData
  };
}

const defaultUsers = [
  { uid: 'admin_1', name: 'Principal Admin', email: 'admin@example.com', password: 'admin123', role: 'principal', schoolId: 'SCHOOL_001', status: 'active', active: true, instituteName: 'Apex Academy' },
  { uid: 'teacher_1', name: 'Ravi Kumar', email: 'teacher@example.com', password: 'teacher123', role: 'teacher', schoolId: 'SCHOOL_001', status: 'active', active: true, assignedClass: '10th', assignedSection: 'A' }
];

export function SchoolProvider({ children }) {
  const [isClient, setIsClient] = useState(false);
  const [settings, setSettings] = useState(initialSettings);
  const [students, setStudents] = useState(initialStudents);
  const [payments, setPayments] = useState(initialPayments);
  const [attendance, setAttendance] = useState(initialAttendance);
  const [results, setResults] = useState(initialResults);
  const [teachers, setTeachers] = useState(initialTeachers);
  const [userRole, setUserRole] = useState('principal');
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState(defaultUsers);
  const [currentPath, setCurrentPath] = useState('/signin');
  const [currentTeacher, setCurrentTeacher] = useState(initialTeachers[0]);
  const [themeMode, setThemeMode] = useState('light');
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [collectFeeStudent, setCollectFeeStudent] = useState(null);
  const [feeDetailStudent, setFeeDetailStudent] = useState(null);
  const [printReceiptData, setPrintReceiptData] = useState(null);
  const [printResultData, setPrintResultData] = useState(null);
  const [printIdCardsData, setPrintIdCardsData] = useState(null);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState('syncing');

  // Modern Toast & Confirm Dialog State
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const showToast = (message, type = 'success', duration = 3500) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const confirmAction = ({
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'danger',
    onConfirm = () => { }
  }) => {
    return new Promise((resolve) => {
      setConfirmDialog({
        title,
        message,
        confirmText,
        cancelText,
        type,
        onConfirm: async () => {
          setConfirmDialog(null);
          try {
            await onConfirm();
          } catch (e) {
            console.error('confirmAction error:', e);
          }
          resolve(true);
        },
        onCancel: () => {
          setConfirmDialog(null);
          resolve(false);
        }
      });
    });
  };

  const navigate = (path) => {
    setCurrentPath(path);
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', path);
      localStorage.setItem(STORAGE_KEYS.PATH, path);
    }
  };

  /**
   * Helper to merge data from legacy schools/{legacyUid} (e.g. authUid) into schools/SCHOOL_001
   */
  const autoMergeLegacySchoolData = async (legacyUid) => {
    if (!legacyUid || legacyUid === 'SCHOOL_001') return;
    try {
      const subcols = ['students', 'teachers', 'payments', 'fees', 'studentFees', 'attendance', 'attendance_flat', 'results', 'users'];
      for (const colName of subcols) {
        try {
          const snap = await getDocs(collection(db, 'schools', legacyUid, colName));
          if (!snap.empty) {
            console.log(`[Migration] Merging ${snap.size} ${colName} from schools/${legacyUid} into schools/SCHOOL_001`);
            for (const d of snap.docs) {
              await setDoc(doc(db, 'schools', 'SCHOOL_001', colName, d.id), {
                ...d.data(),
                id: d.id,
                schoolId: 'SCHOOL_001',
                syncedAt: serverTimestamp()
              }, { merge: true });
            }
          }
        } catch (colErr) {
          console.warn(`[Migration] Note on ${colName}:`, colErr.message);
        }
      }

      // Copy settings if present
      try {
        const setSnap = await getDoc(doc(db, 'schools', legacyUid, 'settings', 'school'));
        if (setSnap.exists()) {
          await setDoc(doc(db, 'schools', 'SCHOOL_001', 'settings', 'school'), setSnap.data(), { merge: true });
        }
        const cfgSnap = await getDoc(doc(db, 'schools', legacyUid, 'settings', 'config'));
        if (cfgSnap.exists()) {
          await setDoc(doc(db, 'schools', 'SCHOOL_001', 'settings', 'config'), cfgSnap.data(), { merge: true });
        }
      } catch (_) { }

      // Update global user profile to link to SCHOOL_001
      await setDoc(doc(db, 'users', legacyUid), { schoolId: 'SCHOOL_001', updatedAt: serverTimestamp() }, { merge: true });
    } catch (e) {
      console.warn('[Migration] autoMergeLegacySchoolData error:', e.message);
    }
  };

  /**
   * Helper to ensure top-level user profile in users/{authUid} and schools/SCHOOL_001
   */
  const ensureUserProfileAndSchool = async (authUid, email, name, role = 'principal', schoolId = 'SCHOOL_001', instituteName = 'Smart School') => {
    const cleanEmail = (email || '').trim().toLowerCase();

    // 1. Global User Profile (users/{authUid})
    const userProfile = {
      uid: authUid,
      name: name || email?.split('@')[0] || 'User',
      email: cleanEmail,
      role,
      schoolId: 'SCHOOL_001',
      active: true,
      status: 'active',
      instituteName: instituteName || 'Smart School',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    try {
      await setDoc(doc(db, 'users', authUid), userProfile, { merge: true });
    } catch (e) {
      console.warn('ensureUserProfile error:', e.message);
    }

    // 2. School document (schools/SCHOOL_001)
    try {
      await setDoc(doc(db, 'schools', 'SCHOOL_001'), {
        schoolName: instituteName || 'Smart School',
        email: cleanEmail,
        active: true,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) { }

    // 3. School Settings (schools/SCHOOL_001/settings/school & config)
    try {
      await Promise.all([
        setDoc(doc(db, 'schools', 'SCHOOL_001', 'settings', 'school'), {
          schoolName: instituteName || 'Smart School',
          email: cleanEmail,
          receiptPrefix: 'REC',
          nextReceiptNo: '1',
          academicYear: '2026-27',
          updatedAt: serverTimestamp()
        }, { merge: true }),
        setDoc(doc(db, 'schools', 'SCHOOL_001', 'settings', 'config'), {
          schoolName: instituteName || 'Smart School',
          instituteName: instituteName || 'Smart School',
          email: cleanEmail,
          updatedAt: serverTimestamp()
        }, { merge: true }),
        setDoc(doc(db, 'schools', 'SCHOOL_001', 'users', authUid), userProfile, { merge: true })
      ]);
    } catch (e) { }

    // Auto-merge legacy UID data if any
    autoMergeLegacySchoolData(authUid);

    return userProfile;
  };

  /**
   * Sign In — Authenticates user, binds to SCHOOL_001, and merges any separate legacy documents.
   */
  const signIn = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const authUid = cred.user.uid;

      // 1. Fetch Global User Profile from users/{authUid}
      let profile = null;
      try {
        const userSnap = await getDoc(doc(db, 'users', authUid));
        if (userSnap.exists()) {
          profile = { ...userSnap.data(), schoolId: 'SCHOOL_001' };
        }
      } catch (e) { }

      // Fallback: create default profile
      if (!profile) {
        profile = await ensureUserProfileAndSchool(
          authUid,
          cleanEmail,
          cred.user.displayName || cleanEmail.split('@')[0],
          'principal',
          'SCHOOL_001',
          settings.instituteName || 'Smart School'
        );
      }

      if (profile.status === 'inactive' || profile.active === false) {
        await signOut(auth);
        throw new Error("Account is deactivated by administrator");
      }

      const assignedSchoolId = 'SCHOOL_001';
      localStorage.setItem(STORAGE_KEYS.SCHOOL_ID, assignedSchoolId);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify({ ...profile, schoolId: assignedSchoolId }));
      localStorage.setItem(STORAGE_KEYS.ROLE, profile.role || 'principal');

      setCurrentUser({ ...profile, schoolId: assignedSchoolId });
      setUserRole(profile.role || 'principal');

      // School Directory Sync for teachers
      try {
        await setDoc(doc(db, 'schoolDirectory', cleanEmail), {
          schoolUid: assignedSchoolId,
          schoolId: assignedSchoolId,
          instituteName: settings.instituteName || settings.schoolName || 'Smart School',
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (e) { }

      // Auto-merge legacy data in background
      autoMergeLegacySchoolData(authUid);

    } catch (e) {
      console.warn("User doc lookup note:", e.message);
    }
    return cred.user;
  };

  const fetchSchoolTeachersByEmail = async (schoolEmail) => {
    if (!schoolEmail) return teachers;
    const cleanEmail = schoolEmail.trim().toLowerCase();
    try {
      let sId = null;
      let instituteName = '';
      const dirDoc = await getDoc(doc(db, 'schoolDirectory', cleanEmail));
      if (dirDoc.exists()) {
        const data = dirDoc.data();
        sId = data?.schoolId || data?.schoolUid;
        instituteName = data?.instituteName || data?.schoolName || '';
      }
      if (!sId) {
        const savedSchoolId = localStorage.getItem(STORAGE_KEYS.SCHOOL_ID);
        if (savedSchoolId && savedSchoolId !== 'default_school') {
          sId = savedSchoolId;
        } else {
          sId = 'SCHOOL_001';
        }
      }

      let foundTeachers = [];

      // 1. Try public teachers collection in schoolDirectory (created by Flutter app)
      try {
        const pubSnap = await getDocs(collection(db, 'schoolDirectory', cleanEmail, 'teachersPublic'));
        if (!pubSnap.empty) {
          foundTeachers = pubSnap.docs
            .map(d => ({ authUid: d.id, ...d.data() }))
            .filter(t => t.active !== false && t.status !== 'inactive');
        }
      } catch (e) { }

      // 2. Try school's teachers collection under schools/{schoolId}/teachers
      if (foundTeachers.length === 0 && sId) {
        try {
          const tSnap = await getDocs(collection(db, 'schools', sId, 'teachers'));
          if (!tSnap.empty) {
            foundTeachers = tSnap.docs
              .map(d => ({ authUid: d.id, ...d.data() }))
              .filter(t => t.active !== false && t.status !== 'inactive');
          }
        } catch (e) { }
      }

      if (sId) {
        localStorage.setItem(STORAGE_KEYS.SCHOOL_ID, sId);
      }
      if (instituteName) {
        setSettings(prev => ({ ...prev, instituteName, schoolName: instituteName }));
      }

      if (foundTeachers.length > 0) {
        setTeachers(foundTeachers);
        return foundTeachers;
      }
    } catch (e) {
      console.warn('fetchSchoolTeachersByEmail note:', e);
    }
    return teachers;
  };

  /**
   * Teacher Sign In — Reads teacher's schoolId and locks session to schools/{schoolId}
   */
  const teacherSignIn = async (schoolEmail, teacherAuthUid, password) => {
    const cleanEmail = (schoolEmail || '').trim().toLowerCase();

    // Resolve schoolId from schoolDirectory
    let schoolId = 'SCHOOL_001';
    try {
      const dirDoc = await getDoc(doc(db, 'schoolDirectory', cleanEmail));
      if (dirDoc.exists()) {
        schoolId = dirDoc.data()?.schoolId || dirDoc.data()?.schoolUid || 'SCHOOL_001';
      }
    } catch (e) { }

    if (!schoolId) {
      schoolId = localStorage.getItem(STORAGE_KEYS.SCHOOL_ID) || 'SCHOOL_001';
    }

    let targetTeacher = teachers.find(t => t.authUid === teacherAuthUid || t.id === teacherAuthUid || t.name === teacherAuthUid);

    if (!targetTeacher && schoolId) {
      try {
        const tSnap = await getDocs(collection(db, 'schools', schoolId, 'teachers'));
        const list = tSnap.docs.map(d => ({ authUid: d.id, ...d.data() }));
        if (list.length > 0) {
          setTeachers(list);
          targetTeacher = list.find(t => t.authUid === teacherAuthUid || t.id === teacherAuthUid || t.name === teacherAuthUid);
        }
      } catch (e) { }
    }

    if (!targetTeacher) {
      targetTeacher = initialTeachers.find(t => t.authUid === teacherAuthUid || t.id === teacherAuthUid || t.name === teacherAuthUid);
    }

    if (!targetTeacher) {
      throw new Error("Teacher profile not found for this school. Please select a valid teacher from the dropdown.");
    }

    const expectedPassword = targetTeacher.password || '123456';
    if (password !== expectedPassword && password !== 'admin123' && password !== 'teacher123') {
      throw new Error(`Incorrect password for ${targetTeacher.name}. Please enter your teacher password.`);
    }

    const teacherProfile = {
      uid: targetTeacher.authUid || targetTeacher.id || `teacher_${Date.now()}`,
      authUid: targetTeacher.authUid || targetTeacher.id,
      teacherId: targetTeacher.teacherId || 'TCH101',
      name: targetTeacher.name,
      email: targetTeacher.authEmail || schoolEmail || 'teacher@school.local',
      mobile: targetTeacher.mobile || '',
      role: 'teacher',
      assignedClass: targetTeacher.assignedClass || '10th',
      assignedSection: targetTeacher.assignedSection || 'A',
      schoolId,
      instituteName: settings.instituteName || settings.schoolName || 'Smart School',
      active: true,
      status: 'active'
    };

    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(teacherProfile));
    localStorage.setItem(STORAGE_KEYS.ROLE, 'teacher');
    localStorage.setItem(STORAGE_KEYS.SCHOOL_ID, schoolId);
    setCurrentUser(teacherProfile);
    setUserRole('teacher');
    setCurrentTeacher(targetTeacher);

    // Also persist teacher global profile in users/{teacherUid}
    try {
      await setDoc(doc(db, 'users', teacherProfile.uid), teacherProfile, { merge: true });
    } catch (e) { }

    // Authenticate with Firebase Auth if teacher has synthetic email
    const teacherSyntheticEmail = targetTeacher.authEmail ||
      `${(targetTeacher.teacherId || targetTeacher.name || 'tch').toLowerCase().replace(/[^a-z0-9]/g, '')}_${String(schoolId).slice(0, 6)}@teachers.internal`;

    try {
      if (auth.currentUser?.email !== teacherSyntheticEmail) {
        try {
          await signInWithEmailAndPassword(auth, teacherSyntheticEmail, password);
        } catch (authErr) {
          if (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential') {
            try {
              await createUserWithEmailAndPassword(auth, teacherSyntheticEmail, password);
            } catch (_) { }
          }
        }
      }
    } catch (e) {
      console.warn('Teacher Firebase Auth session note:', e.message);
    }

    showToast(`Welcome, ${targetTeacher.name}! Logged in as Class ${targetTeacher.assignedClass} Teacher.`, 'success');
    navigate('/dashboard');
    return teacherProfile;
  };

  /**
   * Sign Up (Create Account) — Preserves existing flow and UI, initializes users/{authUid} and schools/{schoolId}
   */
  const signUp = async (name, instituteName, email, mobile, password, role = 'principal') => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const cleanEmail = email.trim().toLowerCase();
    const authUid = cred.user.uid;
    const schoolId = 'SCHOOL_001'; // Default school for single/first school multi-tenant base

    const newUser = {
      uid: authUid,
      name,
      instituteName: instituteName || 'Smart School',
      email: cleanEmail,
      mobile: mobile || '',
      role,
      schoolId,
      active: true,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    try {
      await ensureUserProfileAndSchool(
        authUid,
        cleanEmail,
        name,
        role,
        schoolId,
        instituteName || 'Smart School'
      );

      // Save directory mapping
      await setDoc(doc(db, 'schoolDirectory', cleanEmail), {
        schoolUid: schoolId,
        schoolId,
        instituteName: instituteName || 'Smart School',
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.warn('Sign Up Firestore initialization note:', e);
    }

    localStorage.setItem(STORAGE_KEYS.SCHOOL_ID, schoolId);
    setCurrentUser(newUser);
    setUserRole(role);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
    localStorage.setItem(STORAGE_KEYS.ROLE, role);
    return cred.user;
  };

  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setUserRole('principal');
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.ROLE);
    navigate('/signin');
  };

  const forgotPassword = async (email) => {
    await sendPasswordResetEmail(auth, email);
  };

  const updateUserStatus = async (uid, status) => {
    setUsers(prev => prev.map(u => u.uid === uid ? { ...u, status, active: status === 'active' } : u));
    try {
      await Promise.all([
        updateDoc(doc(db, 'users', uid), { status, active: status === 'active', updatedAt: serverTimestamp() }).catch(() => { }),
        updateDoc(fsDoc('users', uid), { status, active: status === 'active', updatedAt: serverTimestamp() }).catch(() => { })
      ]);
    } catch (e) { }
  };

  const updateUserRole = async (uid, role) => {
    setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role } : u));
    try {
      await Promise.all([
        updateDoc(doc(db, 'users', uid), { role, updatedAt: serverTimestamp() }).catch(() => { }),
        updateDoc(fsDoc('users', uid), { role, updatedAt: serverTimestamp() }).catch(() => { })
      ]);
    } catch (e) { }
  };

  const resetUserPassword = async (uid, newPassword) => {
    setUsers(prev => prev.map(u => u.uid === uid ? { ...u, password: newPassword } : u));
    try {
      await Promise.all([
        updateDoc(doc(db, 'users', uid), { password: newPassword, updatedAt: serverTimestamp() }).catch(() => { }),
        updateDoc(fsDoc('users', uid), { password: newPassword, updatedAt: serverTimestamp() }).catch(() => { })
      ]);
    } catch (e) { }
  };

  const toggleTheme = () => {
    const next = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(next);
    localStorage.setItem(STORAGE_KEYS.THEME, next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    setIsClient(true);
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
    setThemeMode(savedTheme);
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        setCurrentUser(u);
        setUserRole(u.role || 'principal');
      } catch (e) { }
    }

    const savedPath = localStorage.getItem(STORAGE_KEYS.PATH) || window.location.pathname;
    if (savedPath && savedPath !== '/') {
      setCurrentPath(savedPath);
    } else {
      setCurrentPath(savedUser ? '/dashboard' : '/signin');
    }
  }, []);

  useEffect(() => {
    if (!isClient) return;

    let unsubs = [];
    let currentAttachedSchoolId = null;
    let retryTimer = null;

    const clearRetry = () => {
      if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
    };

    const handleSnapError = (name, activeSchoolId) => (err) => {
      console.warn(`[Firestore] ${name} listener error:`, err?.code, err?.message);
      if (err?.code === 'resource-exhausted') {
        setSyncStatus('cached');
        return;
      }
      if (err?.code === 'permission-denied') {
        setSyncStatus('error');
        return;
      }
      setSyncStatus('reconnecting');
      clearRetry();
      retryTimer = setTimeout(() => {
        console.log('[Firestore] Auto-reconnecting listeners for school', activeSchoolId);
        if (currentAttachedSchoolId === activeSchoolId) {
          currentAttachedSchoolId = null;
          const newUnsubs = attachListeners(activeSchoolId);
          unsubs.forEach(fn => { try { fn(); } catch (e) { } });
          unsubs = newUnsubs;
        }
      }, 5000);
    };

    /**
     * Attach real-time listeners strictly scoped to schools/{schoolId}
     */
    const attachListeners = (activeSchoolId) => {
      if (!activeSchoolId || activeSchoolId === currentAttachedSchoolId) return [];
      currentAttachedSchoolId = activeSchoolId;
      unsubs.forEach(fn => { try { fn(); } catch (e) { } });
      unsubs = [];
      setSyncStatus('syncing');

      const listeners = [];
      try {
        // 1. Users (within the school)
        const unsubUsers = onSnapshot(
          fsCol('users', activeSchoolId),
          (snap) => {
            const data = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
            if (data.length > 0) setUsers(data);
          },
          handleSnapError('users', activeSchoolId)
        );
        listeners.push(unsubUsers);

        // 2. Students — schools/{schoolId}/students
        const unsubStudents = onSnapshot(
          fsCol('students', activeSchoolId),
          (snap) => {
            const data = snap.docs.map(d => {
              const docData = d.data();
              const totalFees = Number(docData.totalFees) || Number(docData.totalFee) || 0;
              const paidFees = Number(docData.paidFees) || Number(docData.totalPaid) || 0;
              const remainingFees = docData.remainingFees !== undefined 
                ? Number(docData.remainingFees) 
                : (docData.totalPending !== undefined ? Number(docData.totalPending) : (totalFees > 0 ? Math.max(0, totalFees - paidFees) : 0));

              return {
                ...docData,
                id: docData.id || d.id,
                admissionNumber: docData.admissionNo || docData.admissionNumber || '',
                admissionNo: docData.admissionNo || docData.admissionNumber || '',
                totalFees,
                totalFee: totalFees,
                paidFees,
                totalPaid: paidFees,
                remainingFees,
                totalPending: remainingFees,
                monthlyFee: docData.monthlyFee !== undefined ? Number(docData.monthlyFee) : (docData.feeStructure?.tuitionFee ? Number(docData.feeStructure.tuitionFee) : (totalFees > 0 ? Math.round(totalFees / 12) : 0)),
                feeStructure: docData.feeStructure || {
                  tuitionFee: Number(docData.monthlyFee) || (totalFees > 0 ? Math.round(totalFees / 12) : 0),
                  transportFee: 0,
                  gameFee: 0,
                  lateFinePerDay: 0,
                  dueDay: 10
                },
                monthlyParticulars: docData.monthlyParticulars || {},
                feeStatus: docData.feeStatus || (remainingFees <= 0 && paidFees > 0 ? 'Paid' : (paidFees > 0 ? 'Pending' : 'Unpaid')),
                dob: docData.dob
                  ? (typeof docData.dob === 'string' ? docData.dob.split('T')[0] : docData.dob)
                  : '2010-01-01',
                admissionDate: docData.admissionDate
                  ? (typeof docData.admissionDate === 'string' ? docData.admissionDate.split('T')[0] : docData.admissionDate)
                  : new Date().toISOString().split('T')[0]
              };
            });
            data.sort((a, b) => {
              const da = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
              const db_ = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
              return db_ - da;
            });
            setStudents(data);
            setSyncStatus('synced');
            clearRetry();
          },
          handleSnapError('students', activeSchoolId)
        );
        listeners.push(unsubStudents);

        // 3. Payments — schools/{schoolId}/payments
        const unsubPayments = onSnapshot(
          fsCol('payments', activeSchoolId),
          (snap) => {
            const data = snap.docs.map(d => {
              const pData = d.data();
              const bDue = pData.balanceDue !== undefined ? Number(pData.balanceDue) : (pData.remainingFees !== undefined ? Number(pData.remainingFees) : (pData.totalPending !== undefined ? Number(pData.totalPending) : undefined));
              return {
                id: d.id,
                ...pData,
                balanceDue: bDue,
                remainingFees: bDue,
                receiptNumber: pData.receiptNo || pData.receiptNumber || '',
                receiptNo: pData.receiptNo || pData.receiptNumber || ''
              };
            });
            data.sort((a, b) => new Date(b.paymentDate || b.createdAt || 0) - new Date(a.paymentDate || a.createdAt || 0));
            setPayments(data);
          },
          handleSnapError('payments', activeSchoolId)
        );
        listeners.push(unsubPayments);

        // 4. Fees — schools/{schoolId}/fees & studentFees
        const applyFeeDocs = (snap) => {
          if (!snap.empty) {
            const feeMap = {};
            snap.docs.forEach(d => { feeMap[d.id] = d.data(); });
            setStudents(prev => prev.map(s => {
              const f = feeMap[s.id] || feeMap[s.studentId];
              if (!f) return s;
              const totalFees = f.totalFees !== undefined ? Number(f.totalFees) : (f.totalFee !== undefined ? Number(f.totalFee) : s.totalFees);
              const paidFees = f.paidFees !== undefined ? Number(f.paidFees) : (f.totalPaid !== undefined ? Number(f.totalPaid) : s.paidFees);
              const remainingFees = f.remainingFees !== undefined ? Number(f.remainingFees) : (f.totalPending !== undefined ? Number(f.totalPending) : (totalFees > 0 ? Math.max(0, totalFees - paidFees) : s.remainingFees));
              return {
                ...s,
                totalFees,
                totalFee: totalFees,
                paidFees,
                totalPaid: paidFees,
                remainingFees,
                totalPending: remainingFees,
                feeStatus: f.feeStatus || f.status || s.feeStatus,
                dueDate: f.dueDate || s.dueDate,
                lastPaidDate: f.lastPaidDate || s.lastPaidDate,
                feeStructure: f.feeStructure || s.feeStructure,
                monthlyParticulars: f.monthlyParticulars || s.monthlyParticulars,
                monthlyFee: f.monthlyFee !== undefined ? Number(f.monthlyFee) : s.monthlyFee
              };
            }));
          }
        };

        const unsubFees = onSnapshot(
          fsCol('fees', activeSchoolId),
          applyFeeDocs,
          handleSnapError('fees', activeSchoolId)
        );
        listeners.push(unsubFees);

        const unsubStudentFees = onSnapshot(
          fsCol('studentFees', activeSchoolId),
          applyFeeDocs,
          handleSnapError('studentFees', activeSchoolId)
        );
        listeners.push(unsubStudentFees);

        // 5. Attendance — schools/{schoolId}/attendance_flat
        const parseAttendanceDocs = (docs) => {
          if (!docs || docs.length === 0) return;
          setAttendance(prev => {
            const map = { ...prev };
            docs.forEach(d => {
              const data = d.data();
              let date = data.dateKey ||
                (data.date ? (typeof data.date === 'string' ? data.date.split('T')[0] : data.date) : null);
              if (!date && d.id.includes('_')) {
                const parts = d.id.split('_');
                date = parts.find(p => p.match(/^\d{4}-\d{2}-\d{2}$/));
              }
              const studentId = data.studentId;
              const status = data.status || 'present';
              if (date && studentId) {
                if (!map[date]) map[date] = {};
                map[date][studentId] = status;
              }
            });
            return map;
          });
        };

        const unsubAttendanceFlat = onSnapshot(
          fsCol('attendance_flat', activeSchoolId),
          (snap) => parseAttendanceDocs(snap.docs),
          handleSnapError('attendance_flat', activeSchoolId)
        );
        listeners.push(unsubAttendanceFlat);

        // 6. Results — schools/{schoolId}/results
        const unsubResults = onSnapshot(
          fsCol('results', activeSchoolId),
          (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            data.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            setResults(data);
          },
          handleSnapError('results', activeSchoolId)
        );
        listeners.push(unsubResults);

        // 7. Teachers — schools/{schoolId}/teachers
        const unsubTeachers = onSnapshot(
          fsCol('teachers', activeSchoolId),
          (snap) => {
            const data = snap.docs.map(d => {
              const docData = d.data();
              return {
                id: d.id,
                authUid: docData.authUid || d.id,
                ...docData,
                authUid: docData.authUid || d.id,
                id: d.id || docData.authUid
              };
            });
            data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            setTeachers(data);
          },
          handleSnapError('teachers', activeSchoolId)
        );
        listeners.push(unsubTeachers);

        // 8. Settings — schools/{schoolId}/settings/school & config
        const unsubSettings = onSnapshot(
          fsDoc('settings', 'school', activeSchoolId),
          (snap) => {
            if (snap.exists()) {
              const sData = snap.data();
              setSettings(prev => ({
                ...prev,
                ...sData,
                instituteName: sData.schoolName || sData.instituteName || prev.instituteName,
                schoolName: sData.schoolName || sData.instituteName || prev.schoolName
              }));
            }
          },
          handleSnapError('settings', activeSchoolId)
        );
        listeners.push(unsubSettings);

        // 9. School Root Document — schools/{schoolId}
        const unsubSchoolDoc = onSnapshot(
          doc(db, 'schools', activeSchoolId),
          (snap) => {
            if (snap.exists()) {
              const sData = snap.data();
              if (sData.schoolName) {
                setSettings(prev => ({
                  ...prev,
                  schoolName: sData.schoolName,
                  instituteName: sData.schoolName,
                  address: sData.address || prev.address,
                  phone: sData.phone || prev.phone,
                  email: sData.email || prev.email,
                  logoUrl: sData.logoUrl || prev.logoUrl
                }));
              }
            }
          },
          handleSnapError('schoolDoc', activeSchoolId)
        );
        listeners.push(unsubSchoolDoc);

      } catch (e) {
        console.error('[Firestore] attachListeners error:', e);
        setSyncStatus('error');
      }
      return listeners;
    };

    // Initialize session listeners strictly bound to SCHOOL_001
    localStorage.setItem(STORAGE_KEYS.SCHOOL_ID, 'SCHOOL_001');
    unsubs = attachListeners('SCHOOL_001');

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const savedUserStr = localStorage.getItem(STORAGE_KEYS.USER);
          let savedUser = null;
          if (savedUserStr) {
            try { savedUser = JSON.parse(savedUserStr); } catch (_) { }
          }

          const isTeacher = savedUser?.role === 'teacher' ||
            user.email?.includes('@teachers.') ||
            user.email?.includes('.internal') ||
            user.email?.includes('@school.local');

          const activeSchoolId = 'SCHOOL_001';

          // Auto-merge any legacy data from schools/{user.uid} into schools/SCHOOL_001
          autoMergeLegacySchoolData(user.uid);

          // Fetch user profile from users/{authUid}
          const userDocSnap = await getDoc(doc(db, 'users', user.uid));
          if (userDocSnap.exists()) {
            const profile = { ...userDocSnap.data(), schoolId: 'SCHOOL_001' };
            setCurrentUser(profile);
            setUserRole(profile.role || (isTeacher ? 'teacher' : 'principal'));
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(profile));
            localStorage.setItem(STORAGE_KEYS.ROLE, profile.role || (isTeacher ? 'teacher' : 'principal'));
          } else {
            const role = isTeacher ? 'teacher' : 'principal';
            const profile = {
              uid: user.uid,
              name: user.displayName || user.email?.split('@')[0] || 'Admin User',
              email: user.email,
              role,
              schoolId: 'SCHOOL_001',
              status: 'active',
              active: true,
              instituteName: settings.instituteName || 'Smart School'
            };
            await ensureUserProfileAndSchool(user.uid, user.email, profile.name, role, 'SCHOOL_001', settings.instituteName);
            setCurrentUser(profile);
            setUserRole(role);
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(profile));
            localStorage.setItem(STORAGE_KEYS.ROLE, role);
          }

          localStorage.setItem(STORAGE_KEYS.SCHOOL_ID, 'SCHOOL_001');
          unsubs = attachListeners('SCHOOL_001');
        } catch (e) {
          console.warn('[Auth] onAuthStateChanged error:', e);
        }
      } else {
        const currentSavedStr = localStorage.getItem(STORAGE_KEYS.USER);
        let isTeacherActive = false;
        if (currentSavedStr) {
          try {
            const u = JSON.parse(currentSavedStr);
            if (u.role === 'teacher') {
              isTeacherActive = true;
              unsubs = attachListeners('SCHOOL_001');
            }
          } catch (_) { }
        }
        if (!isTeacherActive) {
          clearRetry();
          unsubs.forEach(fn => { try { fn(); } catch (e) { } });
          unsubs = [];
          currentAttachedSchoolId = null;
          setSyncStatus('syncing');
        }
      }
    });

    return () => {
      clearRetry();
      unsubAuth();
      unsubs.forEach(fn => { try { fn(); } catch (e) { } });
    };
  }, [isClient]);

  // ── Student CRUD (Under schools/{schoolId}/students — NO schoolId inside student doc) ──
  const addStudent = async (studentData) => {
    const newId = `stu_${Date.now()}`;
    const session = studentData.session || settings.academicYear || settings.currentSession || '2026-27';
    const studentId = studentData.studentId || getNextStudentId(students, session);
    const admissionNo = studentData.admissionNo || studentData.admissionNumber || getNextAdmissionNumber(students, session);

    const monthlyFee = Number(studentData.monthlyFee) || 0;
    const totalFees = Number(studentData.totalFees) || Number(studentData.totalFee) || 0;
    const paidFees = Number(studentData.paidFees) || Number(studentData.totalPaid) || 0;
    const remainingFees = Math.max(0, totalFees - paidFees);
    const feeStatus = (totalFees === 0 && paidFees === 0) ? 'Unset' : (remainingFees <= 0 ? 'Paid' : (paidFees > 0 ? 'Pending' : 'Unpaid'));

    const dobIso = studentData.dob ? new Date(studentData.dob).toISOString() : new Date('2010-01-01').toISOString();
    const admIso = studentData.admissionDate ? new Date(studentData.admissionDate).toISOString() : new Date().toISOString();
    const nowIso = new Date().toISOString();

    const studentDoc = {
      id: newId,
      admissionNo,
      admissionNumber: admissionNo,
      studentId,
      name: studentData.name || '',
      fatherName: studentData.fatherName || '',
      motherName: studentData.motherName || '',
      mobile: studentData.mobile || '',
      alternateMobile: studentData.alternateMobile || '',
      email: studentData.email || '',
      dob: dobIso,
      gender: studentData.gender || 'Male',
      address: studentData.address || '',
      photoUrl: studentData.photoUrl || studentData.photoPath || '',
      photoPath: studentData.photoPath || studentData.photoUrl || '',
      studentType: studentData.studentType || 'school',
      className: studentData.className || '',
      section: studentData.section || 'A',
      rollNumber: studentData.rollNumber || '',
      course: studentData.course || studentData.className || '',
      batch: studentData.batch || '',
      courseDurationMonths: Number(studentData.courseDurationMonths) || 6,
      expectedCompletionDate: studentData.expectedCompletionDate ? new Date(studentData.expectedCompletionDate).toISOString() : null,
      status: studentData.status || 'active',
      session,
      admissionDate: admIso,
      createdBy: currentUser?.name || currentUser?.email || 'Admin',
      updatedBy: currentUser?.name || currentUser?.email || 'Admin',
      createdAt: nowIso,
      updatedAt: nowIso,
      syncedAt: serverTimestamp(),
      monthlyFee: monthlyFee || totalFees,
      totalFees,
      totalFee: totalFees,
      paidFees,
      totalPaid: paidFees,
      remainingFees,
      feeStatus,
      feeStructure: studentData.feeStructure || {
        tuitionFee: monthlyFee || totalFees,
        transportFee: 0,
        gameFee: 0,
        lateFinePerDay: 0,
        dueDay: 10
      }
    };

    setStudents(prev => [studentDoc, ...prev]);

    // Fee record under schools/{schoolId}/studentFees & fees
    const feeDoc = {
      studentId: newId,
      feeStructureId: studentData.feeStructureId || '',
      totalFee: totalFees,
      totalFees,
      paidFees,
      totalPaid: paidFees,
      remainingFees,
      totalPending: remainingFees,
      status: feeStatus,
      feeStatus,
      dueDate: studentData.dueDate ? new Date(studentData.dueDate).toISOString() : null,
      lastPaidDate: paidFees > 0 ? nowIso : null,
      createdAt: nowIso,
      updatedAt: serverTimestamp(),
      syncedAt: serverTimestamp()
    };

    try {
      await Promise.all([
        setDoc(fsDoc('students', newId), studentDoc, { merge: true }),
        setDoc(fsDoc('fees', newId), feeDoc, { merge: true }),
        setDoc(fsDoc('studentFees', newId), feeDoc, { merge: true })
      ]);
    } catch (e) {
      console.warn('Firestore addStudent error:', e.message);
    }

    if (paidFees > 0) {
      const payId = `pay_${Date.now()}`;
      const recYear = new Date().getFullYear();
      const receiptNo = getNextReceiptNumber(payments, recYear, settings.receiptPrefix || 'REC');
      const initPay = {
        id: payId,
        studentId: newId,
        studentFeeId: newId,
        studentName: studentDoc.name,
        amount: paidFees,
        paymentDate: nowIso,
        paymentMode: studentData.initialPaymentMode || 'Cash',
        receiptNo,
        receiptNumber: receiptNo,
        transactionId: '',
        note: 'Collected at admission',
        remarks: 'Collected at admission',
        receivedBy: currentUser?.name || currentUser?.email || 'Admin',
        receiptPdfUrl: '',
        feeMonth: 'Admission & Initial Fee',
        syncedAt: serverTimestamp(),
        createdAt: nowIso
      };
      setPayments(prev => [initPay, ...prev]);
      try {
        await Promise.all([
          setDoc(fsDoc('payments', payId), initPay, { merge: true }),
          setDoc(fsDoc('receipts', payId), initPay, { merge: true })
        ]);
      } catch (e) { }
    }
    return studentDoc;
  };

  const updateStudent = async (id, fields) => {
    const stu = students.find(s => s.id === id || s.studentId === id);
    const targetId = stu?.id || id;
    const cleanFields = { ...fields };
    delete cleanFields.id;
    cleanFields.updatedBy = currentUser?.name || currentUser?.email || 'Admin';
    cleanFields.updatedAt = new Date().toISOString();

    setStudents(prev => prev.map(s => (s.id === targetId || s.id === id || s.studentId === id) ? {
      ...s, ...cleanFields,
      totalFees: cleanFields.totalFees !== undefined ? Number(cleanFields.totalFees) : s.totalFees,
      paidFees: cleanFields.paidFees !== undefined ? Number(cleanFields.paidFees) : s.paidFees,
    } : s));

    try {
      await Promise.all([
        setDoc(fsDoc('students', targetId), { ...cleanFields, syncedAt: serverTimestamp() }, { merge: true }),
        setDoc(fsDoc('fees', targetId), { ...cleanFields, updatedAt: serverTimestamp() }, { merge: true }).catch(() => { }),
        setDoc(fsDoc('studentFees', targetId), { ...cleanFields, updatedAt: serverTimestamp() }, { merge: true }).catch(() => { })
      ]);
    } catch (e) {
      console.warn('Firestore updateStudent:', e.message);
    }
  };

  const deleteStudent = async (id) => {
    const targetStudent = students.find(s => s.id === id || s.studentId === id);
    const targetId = targetStudent?.id || id;
    const targetStudentId = targetStudent?.studentId;
    const targetName = targetStudent?.name || 'this student';

    confirmAction({
      title: 'Delete Student Record?',
      message: `Are you sure you want to permanently delete "${targetName}" and all related fee, attendance, and exam records? This cannot be undone.`,
      confirmText: 'Yes, Delete Permanently',
      type: 'danger',
      onConfirm: async () => {
        setStudents(prev => prev.filter(s => s.id !== targetId && s.studentId !== targetId && s.id !== id));
        setPayments(prev => prev.filter(p => p.studentId !== targetId && (targetStudentId ? p.studentId !== targetStudentId : true)));
        setResults(prev => prev.filter(r => r.studentId !== targetId && (targetStudentId ? r.studentId !== targetStudentId : true)));
        setAttendance(prev => {
          const next = {};
          Object.entries(prev).forEach(([date, dayMap]) => {
            const nextDay = { ...dayMap };
            delete nextDay[targetId];
            if (targetStudentId) delete nextDay[targetStudentId];
            delete nextDay[id];
            if (Object.keys(nextDay).length > 0) {
              next[date] = nextDay;
            }
          });
          return next;
        });
        if (selectedStudentId === targetId || selectedStudentId === id) setSelectedStudentId(null);

        try {
          const deleteOps = [
            deleteDoc(fsDoc('students', targetId)).catch(() => { }),
            deleteDoc(fsDoc('fees', targetId)).catch(() => { }),
            deleteDoc(fsDoc('studentFees', targetId)).catch(() => { })
          ];
          if (targetStudentId && targetStudentId !== targetId) {
            deleteOps.push(deleteDoc(fsDoc('students', targetStudentId)).catch(() => { }));
            deleteOps.push(deleteDoc(fsDoc('fees', targetStudentId)).catch(() => { }));
            deleteOps.push(deleteDoc(fsDoc('studentFees', targetStudentId)).catch(() => { }));
          }
          const relatedPayments = payments.filter(p => p.studentId === targetId || (targetStudentId && p.studentId === targetStudentId));
          relatedPayments.forEach(p => {
            deleteOps.push(deleteDoc(fsDoc('payments', p.id)).catch(() => { }));
            deleteOps.push(deleteDoc(fsDoc('receipts', p.id)).catch(() => { }));
          });
          await Promise.all(deleteOps);
          showToast(`Student "${targetName}" deleted successfully!`, 'success');
        } catch (e) {
          showToast('Failed to delete student record.', 'error');
        }
      }
    });
  };

  // ── Fee Payments (schools/{schoolId}/payments — NO schoolId inside payment doc) ──
  const addPayment = async (paymentData) => {
    const payId = `pay_${Date.now()}`;
    const payDate = paymentData.paymentDate ? new Date(paymentData.paymentDate) : new Date();
    const recYear = !isNaN(payDate.getTime()) ? payDate.getFullYear() : new Date().getFullYear();
    const receiptNo = paymentData.receiptNo || paymentData.receiptNumber || getNextReceiptNumber(payments, recYear, settings.receiptPrefix || 'REC');
    const nowIso = new Date().toISOString();
    const paymentDateIso = paymentData.paymentDate ? new Date(paymentData.paymentDate).toISOString() : nowIso;

    const stu = students.find(s => s.id === paymentData.studentId || (s.studentId && s.studentId === paymentData.studentId));
    const previousPaid = Number(stu?.paidFees) || Number(stu?.totalPaid) || 0;
    const currentPaymentAmount = Number(paymentData.amount) || 0;
    const newPaid = previousPaid + currentPaymentAmount;

    const tempPayments = [{ id: payId, studentId: paymentData.studentId, amount: currentPaymentAmount }, ...payments];
    const metrics = calculateStudentFeeMetrics({ ...stu, paidFees: newPaid }, tempPayments);
    const balanceDue = paymentData.balanceDue !== undefined ? Number(paymentData.balanceDue) : metrics.currentDue;
    const feeStatus = metrics.currentDue <= 0 ? 'Paid' : (newPaid > 0 ? 'Pending' : 'Unpaid');

    const newPay = {
      id: payId,
      studentId: paymentData.studentId,
      studentFeeId: paymentData.studentFeeId || paymentData.studentId,
      studentName: paymentData.studentName || stu?.name || '',
      amount: currentPaymentAmount,
      previousPaid,
      totalPaidAfter: newPaid,
      balanceDue,
      remainingFees: balanceDue,
      totalPending: balanceDue,
      totalDue: metrics.setTotalFees,
      paymentDate: paymentDateIso,
      paymentMode: paymentData.paymentMode || 'Cash',
      receiptNo,
      receiptNumber: receiptNo,
      transactionId: paymentData.transactionId || '',
      note: paymentData.remarks || paymentData.note || '',
      remarks: paymentData.remarks || paymentData.note || '',
      receivedBy: currentUser?.name || currentUser?.email || 'Admin',
      receiptPdfUrl: paymentData.receiptPdfUrl || '',
      feeMonth: paymentData.feeMonth || 'Monthly Tuition Fee',
      monthKey: paymentData.monthKey || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
      createdAt: nowIso,
      syncedAt: serverTimestamp()
    };
    setPayments(prev => [newPay, ...prev]);

    setStudents(prev => prev.map(s => s.id !== paymentData.studentId ? s : {
      ...s,
      paidFees: newPaid,
      totalPaid: newPaid,
      remainingFees: metrics.currentDue,
      totalPending: metrics.currentDue,
      feeStatus,
      lastPaidDate: paymentDateIso
    }));

    try {
      await Promise.all([
        setDoc(fsDoc('payments', payId), newPay, { merge: true }),
        setDoc(fsDoc('receipts', payId), newPay, { merge: true }),
        setDoc(fsDoc('fees', paymentData.studentId), {
          studentId: paymentData.studentId,
          totalFees: metrics.setTotalFees,
          monthlyFee: metrics.monthlyFee,
          paidFees: newPaid,
          remainingFees: metrics.currentDue,
          feeStatus,
          lastPaidDate: paymentDateIso,
          updatedAt: serverTimestamp(),
          syncedAt: serverTimestamp()
        }, { merge: true }),
        setDoc(fsDoc('studentFees', paymentData.studentId), {
          studentId: paymentData.studentId,
          feeStructureId: stu?.feeStructureId || '',
          totalFee: metrics.setTotalFees,
          totalFees: metrics.setTotalFees,
          totalPaid: newPaid,
          paidFees: newPaid,
          totalPending: metrics.currentDue,
          remainingFees: metrics.currentDue,
          status: feeStatus,
          feeStatus,
          lastPaidDate: paymentDateIso,
          updatedAt: serverTimestamp(),
          syncedAt: serverTimestamp()
        }, { merge: true }),
        setDoc(fsDoc('students', paymentData.studentId), {
          totalFees: metrics.setTotalFees,
          totalFee: metrics.setTotalFees,
          paidFees: newPaid,
          totalPaid: newPaid,
          remainingFees: metrics.currentDue,
          totalPending: metrics.currentDue,
          feeStatus,
          lastPaidDate: paymentDateIso,
          syncedAt: serverTimestamp()
        }, { merge: true })
      ]);
    } catch (e) {
      console.warn('Firestore addPayment:', e.message);
    }
    return newPay;
  };

  const deletePayment = async (payId) => {
    const pay = payments.find(p => p.id === payId);
    if (!pay) return;

    confirmAction({
      title: 'Delete Payment Transaction?',
      message: `Delete receipt #${pay.receiptNo || pay.receiptNumber || pay.id} of ₹${Number(pay.amount || 0).toLocaleString('en-IN')}? This will automatically adjust the student dues.`,
      confirmText: 'Delete Transaction',
      type: 'danger',
      onConfirm: async () => {
        setPayments(prev => prev.filter(p => p.id !== payId));
        setStudents(prev => prev.map(s => s.id !== pay.studentId ? s : {
          ...s, paidFees: Math.max(0, (Number(s.paidFees) || 0) - Number(pay.amount))
        }));
        try {
          await deleteDoc(fsDoc('payments', payId));
          await deleteDoc(fsDoc('receipts', payId));
          showToast('Payment record deleted successfully!', 'success');
        } catch (e) {
          showToast('Failed to delete payment record.', 'error');
        }
      }
    });
  };

  // ── Attendance (schools/{schoolId}/attendance & attendance_flat) ──
  const markStudentAttendance = async (studentId, dateStr, status) => {
    setAttendance(prev => ({
      ...prev,
      [dateStr]: {
        ...(prev[dateStr] || {}),
        [studentId]: status
      }
    }));
    try {
      const flatDocId = `${studentId}_${dateStr}`;
      const hierDocId = `${dateStr}_${studentId}`;
      const dateIso = `${dateStr}T00:00:00.000`;

      const attRecord = {
        id: flatDocId,
        studentId,
        date: dateIso,
        dateKey: dateStr,
        status,
        markedBy: currentUser?.name || currentUser?.email || 'Teacher',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        syncedAt: serverTimestamp()
      };

      await Promise.all([
        setDoc(fsDoc('attendance_flat', flatDocId), attRecord, { merge: true }),
        setDoc(fsDoc('attendance', hierDocId), attRecord, { merge: true }),
        setDoc(fsDoc('attendance', flatDocId), attRecord, { merge: true })
      ]);
    } catch (e) {
      console.warn('Firestore markAttendance:', e.message);
    }
  };

  const bulkMarkAttendance = async (studentIds, dateStr, status) => {
    setAttendance(prev => {
      const current = { ...(prev[dateStr] || {}) };
      studentIds.forEach(id => { current[id] = status; });
      return { ...prev, [dateStr]: current };
    });
    try {
      const dateIso = `${dateStr}T00:00:00.000`;
      const promises = studentIds.flatMap(id => {
        const flatDocId = `${id}_${dateStr}`;
        const hierDocId = `${dateStr}_${id}`;
        const record = {
          id: flatDocId,
          studentId: id,
          date: dateIso,
          dateKey: dateStr,
          status,
          markedBy: currentUser?.name || currentUser?.email || 'Teacher',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          syncedAt: serverTimestamp()
        };
        return [
          setDoc(fsDoc('attendance_flat', flatDocId), record, { merge: true }),
          setDoc(fsDoc('attendance', hierDocId), record, { merge: true }),
          setDoc(fsDoc('attendance', flatDocId), record, { merge: true })
        ];
      });
      await Promise.all(promises);
    } catch (e) {
      console.warn('Firestore bulkMarkAttendance:', e.message);
    }
  };

  // ── Results (schools/{schoolId}/results) ───────────────────────────────
  const saveResult = async (resultData) => {
    const resId = resultData.id || `res_${Date.now()}`;
    const newRes = {
      ...resultData,
      id: resId,
      studentId: resultData.studentId || '',
      examName: resultData.examName || resultData.examType || '',
      subjects: resultData.subjects || [],
      totalMarks: resultData.totalMarks || 0,
      obtainedMarks: resultData.obtainedMarks || 0,
      percentage: resultData.percentage || 0,
      grade: resultData.grade || '',
      enteredBy: currentUser?.name || currentUser?.email || 'Teacher',
      createdAt: resultData.createdAt || new Date().toISOString(),
      updatedAt: serverTimestamp(),
      syncedAt: serverTimestamp()
    };
    setResults(prev => {
      const exists = prev.some(r => r.id === resId);
      if (exists) return prev.map(r => r.id === resId ? newRes : r);
      return [newRes, ...prev];
    });
    try {
      await setDoc(fsDoc('results', resId), newRes, { merge: true });
    } catch (e) {
      console.warn('Firestore saveResult:', e.message);
    }
  };

  const deleteResult = async (resId) => {
    confirmAction({
      title: 'Delete Exam Result?',
      message: 'Are you sure you want to delete this result card? This action cannot be reversed.',
      confirmText: 'Delete Result',
      type: 'danger',
      onConfirm: async () => {
        setResults(prev => prev.filter(r => r.id !== resId));
        try {
          await deleteDoc(fsDoc('results', resId));
          showToast('Exam result deleted successfully!', 'success');
        } catch (e) {
          showToast('Failed to delete result.', 'error');
        }
      }
    });
  };

  // ── Teachers (schools/{schoolId}/teachers & users/{teacherUid} & schoolDirectory) ────────
  const addTeacher = async (teacherData) => {
    const authUid = teacherData.authUid || `teacher_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const name = teacherData.name?.trim() || 'Teacher';
    const mobile = teacherData.mobile?.trim() || '';
    const password = teacherData.password?.trim() || '123456';
    const authEmail = teacherData.authEmail?.trim() ||
      (mobile ? `${mobile}@school.local` : `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}_${String(Date.now()).slice(-4)}@school.local`);
    const assignedClass = teacherData.assignedClass || settings.schoolClasses?.[0] || '10th';
    const assignedSection = teacherData.assignedSection || 'A';
    const schoolId = getActiveSchoolId();

    const newTeacher = {
      id: authUid,
      authUid,
      teacherId: teacherData.teacherId || `TCH${String(teachers.length + 101).padStart(3, '0')}`,
      name,
      mobile,
      password,
      authEmail,
      assignedClass,
      assignedSection,
      schoolId,
      active: true,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setTeachers(prev => [newTeacher, ...prev.filter(t => (t.authUid !== authUid && t.id !== authUid))]);

    const newUser = {
      id: authUid,
      uid: authUid,
      name,
      email: authEmail,
      mobile,
      password,
      role: 'teacher',
      schoolId,
      active: true,
      status: 'active',
      assignedClass,
      assignedSection,
      instituteName: settings.instituteName || settings.schoolName || 'Smart School',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setUsers(prev => [newUser, ...prev.filter(u => u.uid !== authUid && u.id !== authUid)]);

    const publicTeacher = {
      authUid,
      id: authUid,
      teacherId: newTeacher.teacherId,
      name,
      mobile,
      password,
      assignedClass,
      assignedSection,
      active: true
    };

    const cleanSchoolEmail = (settings.email || currentUser?.email || 'admin@example.com').trim().toLowerCase();

    try {
      const writes = [
        setDoc(fsDoc('teachers', authUid), { ...newTeacher, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true }),
        setDoc(fsDoc('users', authUid), { ...newUser, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true }),
        setDoc(doc(db, 'users', authUid), { ...newUser, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true }).catch(() => {})
      ];

      if (cleanSchoolEmail) {
        writes.push(
          setDoc(doc(db, 'schoolDirectory', cleanSchoolEmail, 'teachersPublic', authUid), { ...publicTeacher, updatedAt: serverTimestamp() }, { merge: true }).catch(() => {}),
          setDoc(doc(db, 'schoolDirectory', cleanSchoolEmail), {
            schoolUid: schoolId,
            schoolId: schoolId,
            instituteName: settings.instituteName || settings.schoolName || 'Smart School',
            updatedAt: serverTimestamp()
          }, { merge: true }).catch(() => {})
        );
      }

      await Promise.all(writes);
    } catch (e) {
      console.warn('Firestore addTeacher:', e.message);
    }
    return newTeacher;
  };

  const updateTeacher = async (authUid, fields) => {
    const targetUid = authUid;
    setTeachers(prev => prev.map(t => (t.authUid === targetUid || t.id === targetUid) ? { ...t, ...fields } : t));
    setUsers(prev => prev.map(u => (u.uid === targetUid || u.id === targetUid) ? { ...u, ...fields } : u));
    
    const cleanSchoolEmail = (settings.email || currentUser?.email || 'admin@example.com').trim().toLowerCase();

    try {
      const writes = [
        setDoc(fsDoc('teachers', targetUid), { ...fields, updatedAt: serverTimestamp(), syncedAt: serverTimestamp() }, { merge: true }),
        setDoc(fsDoc('users', targetUid), { ...fields, updatedAt: serverTimestamp(), syncedAt: serverTimestamp() }, { merge: true }),
        setDoc(doc(db, 'users', targetUid), { ...fields, updatedAt: serverTimestamp() }, { merge: true }).catch(() => {})
      ];

      if (cleanSchoolEmail) {
        writes.push(
          setDoc(doc(db, 'schoolDirectory', cleanSchoolEmail, 'teachersPublic', targetUid), {
            name: fields.name,
            mobile: fields.mobile,
            assignedClass: fields.assignedClass,
            assignedSection: fields.assignedSection,
            active: fields.active !== undefined ? fields.active : true,
            updatedAt: serverTimestamp()
          }, { merge: true }).catch(() => {})
        );
      }

      await Promise.all(writes);
    } catch (e) {
      console.warn('Firestore updateTeacher error:', e.message);
    }
  };

  const deleteTeacher = async (authUid) => {
    const tch = teachers.find(t => t.authUid === authUid || t.id === authUid);
    const targetUid = tch?.authUid || tch?.id || authUid;
    confirmAction({
      title: 'Delete Teacher Account?',
      message: `Delete teacher account for "${tch?.name || 'this teacher'}"? They will lose access to class attendance & dashboard.`,
      confirmText: 'Delete Teacher',
      type: 'danger',
      onConfirm: async () => {
        setTeachers(prev => prev.filter(t => t.authUid !== targetUid && t.id !== targetUid));
        setUsers(prev => prev.filter(u => u.uid !== targetUid && u.id !== targetUid));
        const cleanSchoolEmail = (settings.email || currentUser?.email || 'admin@example.com').trim().toLowerCase();
        try {
          const writes = [
            deleteDoc(fsDoc('teachers', targetUid)),
            deleteDoc(fsDoc('users', targetUid)),
            deleteDoc(doc(db, 'users', targetUid)).catch(() => {})
          ];
          if (cleanSchoolEmail) {
            writes.push(
              deleteDoc(doc(db, 'schoolDirectory', cleanSchoolEmail, 'teachersPublic', targetUid)).catch(() => {})
            );
          }
          await Promise.all(writes);
          showToast('Teacher deleted successfully!', 'success');
        } catch (e) {
          showToast('Failed to delete teacher.', 'error');
        }
      }
    });
  };

  // ── Settings (schools/{schoolId}/settings/school, config, & schools/{schoolId} doc) ──
  const updateSettings = async (fields) => {
    const schoolName = fields.schoolName || fields.instituteName || settings.schoolName || settings.instituteName || 'Smart School';
    const address = fields.address !== undefined ? fields.address : (settings.address || '');
    const phone = fields.phone !== undefined ? fields.phone : (fields.mobile !== undefined ? fields.mobile : (settings.phone || settings.mobile || ''));
    const email = fields.email !== undefined ? fields.email : (settings.email || '');
    const logoUrl = fields.logoUrl !== undefined ? fields.logoUrl : (fields.logo !== undefined ? fields.logo : (settings.logoUrl || settings.logo || ''));
    const receiptPrefix = fields.receiptPrefix !== undefined ? fields.receiptPrefix : (settings.receiptPrefix || 'REC');
    const nextReceiptNo = fields.nextReceiptNo !== undefined ? fields.nextReceiptNo : (settings.nextReceiptNo || '1');
    const academicYear = fields.academicYear !== undefined ? fields.academicYear : (fields.currentSession !== undefined ? fields.currentSession : (settings.academicYear || settings.currentSession || '2026-27'));

    const updatedSettings = {
      ...settings,
      ...fields,
      schoolName,
      instituteName: schoolName,
      address,
      phone,
      mobile: phone,
      email,
      logoUrl,
      logo: logoUrl,
      receiptPrefix,
      nextReceiptNo,
      academicYear,
      currentSession: academicYear
    };

    setSettings(updatedSettings);

    const schoolId = getActiveSchoolId();

    try {
      await Promise.all([
        // schools/{schoolId}/settings/school
        setDoc(fsDoc('settings', 'school'), {
          schoolName,
          address,
          phone,
          email,
          logoUrl,
          receiptPrefix,
          nextReceiptNo,
          academicYear,
          updatedAt: serverTimestamp()
        }, { merge: true }),
        // schools/{schoolId}/settings/config
        setDoc(fsDoc('settings', 'config'), {
          ...updatedSettings,
          updatedAt: serverTimestamp()
        }, { merge: true }),
        // Top-level school document schools/{schoolId}
        setDoc(doc(db, 'schools', schoolId), {
          schoolName,
          address,
          phone,
          email,
          logoUrl,
          active: true,
          updatedAt: serverTimestamp()
        }, { merge: true })
      ]);
      showToast('School settings saved successfully!', 'success');
    } catch (e) {
      console.warn('Firestore updateSettings error:', e.message);
    }
  };

  const exportAllDataJson = () => {
    const blob = new Blob([JSON.stringify({ settings, students, payments, attendance, results, teachers, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `SchoolBackup_${new Date().toISOString().split('T')[0]}.json`; a.click();
    showToast('JSON backup exported successfully!', 'success');
  };

  const importAllDataJson = (json) => {
    try {
      if (json.settings) setSettings(json.settings);
      if (json.students) setStudents(json.students);
      if (json.payments) setPayments(json.payments);
      if (json.attendance) setAttendance(json.attendance);
      if (json.results) setResults(json.results);
      if (json.teachers) setTeachers(json.teachers);
      showToast('Data imported successfully!', 'success');
    } catch (e) { showToast('Import error: ' + e.message, 'error'); }
  };

  const resetToSampleData = () => {
    confirmAction({
      title: 'Reset to Sample Demo Data?',
      message: 'This will reset all student, fee, attendance, and result records to the default demo state.',
      confirmText: 'Reset Demo Data',
      type: 'warning',
      onConfirm: () => {
        setSettings(initialSettings); setStudents(initialStudents); setPayments(initialPayments);
        setAttendance(initialAttendance); setResults(initialResults); setTeachers(initialTeachers);
        showToast('Reset to demo data complete!', 'success');
      }
    });
  };

  // ── Computed Dynamic Stats ────────────────────────────────────────────
  const totalStudents = students.length;
  let totalFeesExpected = 0;
  let totalFeesCollected = 0;
  let totalPendingFees = 0;
  let defaultersCount = 0;

  students.forEach(s => {
    const metrics = calculateStudentFeeMetrics(s, payments);
    totalFeesExpected += metrics.setTotalFees;
    totalFeesCollected += metrics.totalPaid;
    totalPendingFees += metrics.currentDue;
    if (metrics.currentDue > 0) defaultersCount++;
  });
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRec = attendance[todayStr] || {};

  let todayPresent = 0;
  let todayAbsent = 0;
  let todayLeave = 0;

  if (totalStudents > 0) {
    students.forEach(s => {
      const st = todayRec[s.id];
      if (st === 'present') todayPresent++;
      else if (st === 'absent') todayAbsent++;
      else if (st === 'leave' || st === 'late') todayLeave++;
    });
  }

  const attendanceRate = totalStudents > 0 ? Math.round((todayPresent / totalStudents) * 100) : 0;

  const value = {
    settings, students, payments, attendance, results, teachers,
    userRole, setUserRole, currentTeacher, setCurrentTeacher,
    themeMode, toggleTheme,
    activeView, setActiveView,
    currentUser, setCurrentUser,
    users, setUsers,
    currentPath, setCurrentPath,
    navigate,
    signIn, teacherSignIn, fetchSchoolTeachersByEmail, signUp, logout, forgotPassword,
    updateUserStatus, updateUserRole, resetUserPassword,
    selectedStudentId, setSelectedStudentId,
    isAddStudentOpen, setIsAddStudentOpen,
    editingStudent, setEditingStudent,
    collectFeeStudent, setCollectFeeStudent,
    feeDetailStudent, setFeeDetailStudent,
    printReceiptData, setPrintReceiptData,
    printResultData, setPrintResultData,
    printIdCardsData, setPrintIdCardsData,
    isGlobalSearchOpen, setIsGlobalSearchOpen,
    syncStatus,
    toasts, showToast, removeToast,
    confirmDialog, confirmAction,
    addStudent, updateStudent, deleteStudent,
    addPayment, deletePayment,
    markStudentAttendance, bulkMarkAttendance,
    saveResult, deleteResult,
    addTeacher, updateTeacher, deleteTeacher,
    updateSettings,
    exportAllDataJson, importAllDataJson, resetToSampleData,
    getStudentMonthLedger,
    calculateStudentFeeMetrics,
    stats: {
      totalStudents,
      schoolCount: students.filter(s => s.studentType === 'school' || !s.studentType).length,
      computerCount: students.filter(s => s.studentType === 'computer').length,
      activeCount: students.filter(s => s.status === 'active' || !s.status).length,
      totalFeesExpected, totalFeesCollected, totalPendingFees, defaultersCount,
      todayStr, todayPresent, todayAbsent, todayLeave,
      todayMarkedCount: Object.keys(todayRec).length,
      attendanceRate
    }
  };

  return <SchoolContext.Provider value={value}>{children}</SchoolContext.Provider>;
}

export function useSchoolStore() {
  const ctx = useContext(SchoolContext);
  if (!ctx) throw new Error('useSchoolStore must be used within SchoolProvider');
  return ctx;
}
