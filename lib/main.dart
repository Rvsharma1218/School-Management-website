import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'core/constants/app_routes.dart';
import 'core/theme/app_theme.dart';
import 'data/services/database_service.dart';
import 'data/services/firestore_service.dart';
import 'data/services/session_service.dart';
import 'data/services/providers.dart';
import 'features/auth/login_screen.dart';
import 'features/dashboard/dashboard_screen.dart';
import 'features/students/add_student_screen.dart';
import 'features/students/student_list_screen.dart';
import 'features/students/student_profile_screen.dart';
import 'features/students/edit_student_screen.dart';
import 'features/fees/fee_screen.dart';
import 'features/attendance/attendance_screen.dart';
import 'features/attendance/attendance_report_screen.dart';
import 'features/attendance/attendance_report_options_screen.dart';
import 'features/results/result_screen.dart';
import 'features/id_card/id_card_screen.dart';
import 'features/reports/reports_screen.dart';
import 'features/settings/settings_screen.dart';
import 'features/backup/backup_restore_screen.dart';
import 'features/qr/qr_scanner_screen.dart';
import 'features/fees/fees_overview_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
    ),
  );

  // Initialize local SQLite database
  await DatabaseService.instance.initialize();

  // Restore role/school session (Principal vs Teacher) BEFORE any Firestore
  // call happens — see session_service.dart. Firebase Auth's own session
  // restore doesn't tell us which of the two this signed-in user is.
  await SessionService.instance.restore();

  // Initialize Firebase (if fails, app still works offline via SQLite)
  try {
    if (kIsWeb) {
      await Firebase.initializeApp(
        options: const FirebaseOptions(
          apiKey: "AIzaSyAtdW6QpcFjnvfrNHOkPwNCXeuX47qoijs",
          authDomain: "school-app-c24f9.firebaseapp.com",
          projectId: "school-app-c24f9",
          storageBucket: "school-app-c24f9.firebasestorage.app",
          messagingSenderId: "905557514986",
          appId: "1:905557514986:web:d996f41e3cda177b01d593",
        ),
      );
    } else {
      await Firebase.initializeApp();
    }
    FirestoreService.instance.init(); // ← enable persistence + Firestore
    debugPrint('[Firebase] ✅ Initialized successfully');

    // Background: bulk-sync any students already in SQLite → Firestore.
    // FIXED: Only do this for Principal. Teacher does not own the school data
    // and should not push SQLite data to Firestore — they receive it FROM
    // Firestore via realtime streams. Pushing teacher-device SQLite data could
    // overwrite more recent data added by Principal from another device.
    if (SessionService.instance.isPrincipal) {
      DatabaseService.instance.getAllStudents().then((students) {
        if (students.isNotEmpty) {
          FirestoreService.instance.bulkSyncStudents(students);
        }
      });
    }
  } catch (e) {
    debugPrint('[Firebase] ❌ Init failed (offline mode): $e');
    FirestoreService.instance.disable();
  }

  runApp(const ProviderScope(child: SchoolApp()));
}

class SchoolApp extends ConsumerWidget {
  const SchoolApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeModeProvider);
    // Starts the Firestore → SQLite → Riverpod real-time sync (PART 13).
    // Watching it here means it's alive for the whole app session; no
    // return value is needed, we just need the provider to be built.
    ref.watch(firestoreRealtimeSyncProvider);
    return MaterialApp(
      title: 'School Manager',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themeMode,
      // If PIN already set → show login, else show login to SET pin
      home: const LoginScreen(),
      routes: {
        AppRoutes.login: (_) => const LoginScreen(),
        AppRoutes.dashboard: (_) => const DashboardScreen(),
        AppRoutes.addStudent: (_) => const AddStudentScreen(),
        AppRoutes.studentList: (_) => const StudentListScreen(),
        AppRoutes.attendance: (_) => const AttendanceScreen(),
        AppRoutes.attendanceReport: (_) => const AttendanceReportScreen(),
        AppRoutes.reports: (_) => const ReportsScreen(),
        AppRoutes.settings: (_) => const SettingsScreen(),
        AppRoutes.backup: (_) => const BackupRestoreScreen(),
        AppRoutes.qrScanner: (_) => const QrScannerScreen(),
        AppRoutes.feesCollected: (_) => const FeesCollectedScreen(),
        AppRoutes.feesPending: (_) => const FeesPendingScreen(),
      },
      onGenerateRoute: (settings) {
        switch (settings.name) {
          case AppRoutes.studentProfile:
            return MaterialPageRoute(
              builder: (_) => StudentProfileScreen(studentId: settings.arguments as String),
            );
          case AppRoutes.editStudent:
            return MaterialPageRoute(
              builder: (_) => EditStudentScreen(studentId: settings.arguments as String),
            );
          case AppRoutes.fees:
            return MaterialPageRoute(
              builder: (_) => FeeScreen(studentId: settings.arguments as String),
            );
          case AppRoutes.result:
            return MaterialPageRoute(
              builder: (_) => ResultScreen(studentId: settings.arguments as String),
            );
          case AppRoutes.idCard:
            return MaterialPageRoute(
              builder: (_) => IdCardScreen(studentId: settings.arguments as String),
            );
          case AppRoutes.attendanceReportOptions:
            return MaterialPageRoute(
              builder: (_) => AttendanceReportOptionsScreen(studentId: settings.arguments as String),
            );
          default:
            return MaterialPageRoute(builder: (_) => const DashboardScreen());
        }
      },
    );
  }
}