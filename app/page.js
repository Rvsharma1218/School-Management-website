'use client';

import React, { useState, useEffect } from 'react';
import { SchoolProvider, useSchoolStore } from '../lib/store';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import DashboardView from '../components/DashboardView';
import StudentsView from '../components/StudentsView';
import FeesView from '../components/FeesView';
import AttendanceView from '../components/AttendanceView';
import ResultsView from '../components/ResultsView';
import IdCardView from '../components/IdCardView';
import TeachersView from '../components/TeachersView';
import ReportsView from '../components/ReportsView';
import QrScannerView from '../components/QrScannerView';
import SettingsView from '../components/SettingsView';
import CommunicationView from '../components/CommunicationView';
import PrintReceiptModal from '../components/PrintReceiptModal';
import PrintResultModal from '../components/PrintResultModal';
import PrintIdCardsModal from '../components/PrintIdCardsModal';
import GlobalSearchModal from '../components/GlobalSearchModal';
import AddEditStudentModal from '../components/AddEditStudentModal';
import CollectFeeModal from '../components/CollectFeeModal';
import StudentFeeDetailModal from '../components/StudentFeeDetailModal';
import { ToastContainer, ConfirmDialog } from '../components/ToastNotification';

// Auth Components
import SignInView from '../components/SignInView';
import SignUpView from '../components/SignUpView';
import ForgotPasswordView from '../components/ForgotPasswordView';
import SetupWizardView from '../components/SetupWizardView';
import AccessDeniedView from '../components/AccessDeniedView';
import UserManagementView from '../components/UserManagementView';
import ProfileView from '../components/ProfileView';

function AppContent() {
  const {
    currentPath,
    currentUser,
    settings,
    navigate,
    isAddStudentOpen, setIsAddStudentOpen,
    editingStudent, setEditingStudent,
    collectFeeStudent, setCollectFeeStudent,
    feeDetailStudent, setFeeDetailStudent,
    printReceiptData, setPrintReceiptData,
    printResultData,  setPrintResultData,
    printIdCardsData, setPrintIdCardsData,
    isGlobalSearchOpen, setIsGlobalSearchOpen
  } = useSchoolStore();

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Security route guards
  useEffect(() => {
    // 1. Force Sign In if unauthenticated
    if (!currentUser) {
      if (!['/signin', '/signup', '/forgot-password'].includes(currentPath)) {
        navigate('/signin');
      }
      return;
    }

    // 2. Redirect to Dashboard if logged in user visits signin/signup/forgot
    if (['/signin', '/signup', '/forgot-password'].includes(currentPath)) {
      navigate('/dashboard');
      return;
    }

    // 3. Block restricted teacher modules
    const adminPaths = ['/users', '/teachers', '/settings', '/fees', '/reports'];
    if (currentUser.role === 'teacher' && adminPaths.includes(currentPath)) {
      navigate('/access-denied');
      return;
    }

    // 4. Default route redirect
    if (currentPath === '/' || currentPath === '/setup') {
      navigate('/dashboard');
    }
  }, [currentUser, currentPath]);

  // ── Render 1: Public full-screen auth routes
  const isPublicRoute = ['/signin', '/signup', '/forgot-password'].includes(currentPath);
  if (!currentUser && isPublicRoute) {
    return (
      <>
        {currentPath === '/signin' && <SignInView />}
        {currentPath === '/signup' && <SignUpView />}
        {currentPath === '/forgot-password' && <ForgotPasswordView />}
      </>
    );
  }

  // ── Render 2: Onboarding Setup Wizard
  if (currentUser && currentPath === '/setup' && !settings.isSetupComplete) {
    return <SetupWizardView />;
  }

  // ── Render 3: Authenticated App Frame (Sidebar & Header)
  return (
    <div className="min-h-screen bg-bg text-text font-sans transition-colors duration-200 flex">

      {/* Fixed Sidebar — passes collapse state up via callback */}
      <Sidebar
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        collapsed={sidebarCollapsed}
        onCollapseChange={setSidebarCollapsed}
      />

      {/* Spacer — matches sidebar width */}
      <div
        className={`hidden lg:block flex-shrink-0 transition-all duration-300 ${sidebarCollapsed ? 'w-[72px]' : 'w-72'}`}
        aria-hidden="true"
      />

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <Header onMenuClick={() => setIsMobileNavOpen(true)} />
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-[1600px] mx-auto">
            {currentPath === '/dashboard' && <DashboardView />}
            {currentPath === '/communication' && <CommunicationView />}
            {currentPath === '/students' && <StudentsView />}
            {currentPath === '/fees' && (currentUser.role === 'principal' ? <FeesView /> : <AccessDeniedView />)}
            {currentPath === '/attendance' && <AttendanceView />}
            {currentPath === '/results' && <ResultsView />}
            {currentPath === '/idcards' && <IdCardView />}
            {currentPath === '/teachers' && <TeachersView />}
            {currentPath === '/reports' && <ReportsView />}
            {currentPath === '/documents' && <ReportsView />}
            {currentPath === '/import-export' && <ReportsView />}
            {currentPath === '/qrscanner' && <QrScannerView />}
            {currentPath === '/settings' && <SettingsView />}
            {currentPath === '/users' && <UserManagementView />}
            {currentPath === '/profile' && <ProfileView />}
            {currentPath === '/access-denied' && <AccessDeniedView />}
          </div>
        </main>
      </div>

      {/* Modals */}
      {isAddStudentOpen && (
        <AddEditStudentModal
          isOpen={isAddStudentOpen}
          student={editingStudent}
          onClose={() => { setIsAddStudentOpen(false); setEditingStudent(null); }}
        />
      )}
      {collectFeeStudent && currentUser?.role === 'principal' && (
        <CollectFeeModal
          isOpen={!!collectFeeStudent}
          student={collectFeeStudent}
          onClose={() => setCollectFeeStudent(null)}
        />
      )}
      {feeDetailStudent && currentUser?.role === 'principal' && (
        <StudentFeeDetailModal
          isOpen={!!feeDetailStudent}
          student={feeDetailStudent}
          onClose={() => setFeeDetailStudent(null)}
        />
      )}
      {printReceiptData && (
        <PrintReceiptModal payment={printReceiptData.payment} student={printReceiptData.student} onClose={() => setPrintReceiptData(null)} />
      )}
      {printResultData && (
        <PrintResultModal result={printResultData.result} student={printResultData.student} onClose={() => setPrintResultData(null)} />
      )}
      {printIdCardsData && (
        <PrintIdCardsModal students={printIdCardsData.students} template={printIdCardsData.template} onClose={() => setPrintIdCardsData(null)} />
      )}
      {isGlobalSearchOpen && (
        <GlobalSearchModal isOpen={isGlobalSearchOpen} onClose={() => setIsGlobalSearchOpen(false)} />
      )}

      {/* Global Theme-matched Toast Notifications & Confirmation Dialog */}
      <ToastContainer />
      <ConfirmDialog />
    </div>
  );
}

export default function Home() {
  return (
    <SchoolProvider>
      <AppContent />
    </SchoolProvider>
  );
}
