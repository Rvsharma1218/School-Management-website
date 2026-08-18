import 'dart:async';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/fee_model.dart';
import '../models/student_model.dart';
import '../models/attendance_model.dart';
import '../models/result_model.dart';
import '../models/settings_model.dart';
import 'database_service.dart';
import 'firestore_service.dart';
import 'session_service.dart';

// ─── SEARCH & FILTER PROVIDERS ─────────────────────────────────────────────

final studentSearchProvider = StateProvider<String>((ref) => '');
final studentFilterProvider = StateProvider<String>((ref) => 'all');
final studentStatusFilterProvider = StateProvider<String>((ref) => 'all');
final classFilterProvider = StateProvider<String>((ref) => '');
final sectionFilterProvider = StateProvider<String>((ref) => '');
final courseFilterProvider = StateProvider<String>((ref) => '');
final batchFilterProvider = StateProvider<String>((ref) => '');
final feeStatusFilterProvider = StateProvider<String>((ref) => 'all');

// ─── TEACHER WORKING CONTEXT ───────────────────────────────────────────────
// These hold the teacher's selected class/section that persists across
// Dashboard → Students → Attendance → Results navigation.

final teacherSelectedClassProvider = StateProvider<String>((ref) => '');
final teacherSelectedSectionProvider = StateProvider<String>((ref) => '');

// ─── STUDENT PROVIDERS ─────────────────────────────────────────────────────

final studentsProvider = StateNotifierProvider<StudentsNotifier, AsyncValue<List<StudentModel>>>((ref) {
  return StudentsNotifier(ref);
});

class StudentsNotifier extends StateNotifier<AsyncValue<List<StudentModel>>> {
  final Ref _ref;
  StudentsNotifier(this._ref) : super(const AsyncLoading()) {
    loadStudents();
  }

  Future<void> loadStudents() async {
    try {
      final students = await DatabaseService.instance.getAllStudents();
      state = AsyncData(students);
    } catch (e, st) {
      state = AsyncError(e, st);
    }
  }

  Future<void> addStudent(StudentModel student) async {
    await DatabaseService.instance.insertStudent(student);
    await loadStudents();
    _ref.invalidate(dashboardStatsProvider);
    // FIXED: await the Firestore write so it doesn't silently fail
    // and data actually reaches Firestore before app could close.
    try {
      await FirestoreService.instance.syncStudent(student);
    } catch (e) {
      debugPrint('[StudentsNotifier] ❌ Firestore sync failed after addStudent: $e');
    }
  }

  Future<void> updateStudent(StudentModel student) async {
    await DatabaseService.instance.updateStudent(student);
    await loadStudents();
    _ref.invalidate(dashboardStatsProvider);
    // FIXED: await the Firestore write
    try {
      await FirestoreService.instance.syncStudent(student);
    } catch (e) {
      debugPrint('[StudentsNotifier] ❌ Firestore sync failed after updateStudent: $e');
    }
  }

  Future<void> deleteStudent(String id) async {
    await DatabaseService.instance.deleteStudent(id);
    await loadStudents();
    _ref.invalidate(dashboardStatsProvider);
    _ref.invalidate(feeProvider(id));
    _ref.invalidate(studentAttendanceProvider(id));
    // FIXED: await the Firestore delete
    try {
      await FirestoreService.instance.deleteStudent(id);
    } catch (e) {
      debugPrint('[StudentsNotifier] ❌ Firestore delete failed: $e');
    }
  }
}

final filteredStudentsProvider = Provider<AsyncValue<List<StudentModel>>>((ref) {
  final studentsAsync = ref.watch(studentsProvider);
  final search = ref.watch(studentSearchProvider).toLowerCase().trim();
  final typeFilter = ref.watch(studentFilterProvider);
  final statusFilter = ref.watch(studentStatusFilterProvider);
  final classFilter = ref.watch(classFilterProvider);
  final sectionFilter = ref.watch(sectionFilterProvider);
  final courseFilter = ref.watch(courseFilterProvider);
  final batchFilter = ref.watch(batchFilterProvider);

  return studentsAsync.whenData((students) {
    return students.where((s) {
      if (typeFilter != 'all' && s.studentType != typeFilter) return false;
      if (statusFilter != 'all' && s.status != statusFilter) return false;
      if (classFilter.isNotEmpty && s.className != classFilter) return false;
      if (sectionFilter.isNotEmpty && s.section != sectionFilter) return false;
      if (courseFilter.isNotEmpty && s.course != courseFilter) return false;
      if (batchFilter.isNotEmpty && s.batch != batchFilter) return false;
      if (search.isNotEmpty) {
        final match = s.name.toLowerCase().contains(search) ||
            s.admissionNumber.toLowerCase().contains(search) ||
            s.studentId.toLowerCase().contains(search) ||
            s.mobile.contains(search) ||
            s.fatherName.toLowerCase().contains(search);
        if (!match) return false;
      }
      return true;
    }).toList();
  });
});

// ─── FEE PROVIDERS ─────────────────────────────────────────────────────────

final feeProvider = StateNotifierProvider.family<FeeNotifier, AsyncValue<FeeModel?>, String>((ref, studentId) {
  return FeeNotifier(ref, studentId);
});

class FeeNotifier extends StateNotifier<AsyncValue<FeeModel?>> {
  final Ref _ref;
  final String studentId;

  FeeNotifier(this._ref, this.studentId) : super(const AsyncLoading()) {
    _load();
  }

  Future<void> _load() async {
    try {
      final fee = await DatabaseService.instance.getFeeByStudentId(studentId);
      state = AsyncData(fee);
    } catch (e, st) {
      state = AsyncError(e, st);
    }
  }

  Future<void> updateTotal(double amount) async {
    await DatabaseService.instance.updateFeeTotal(studentId, amount);
    await _load();
    _ref.invalidate(dashboardStatsProvider);
    final fee = await DatabaseService.instance.getFeeByStudentId(studentId);
    // FIXED: await Firestore write
    if (fee != null) {
      try {
        await FirestoreService.instance.syncFee(fee);
      } catch (e) {
        debugPrint('[FeeNotifier] ❌ Firestore syncFee failed (updateTotal): $e');
      }
    }
  }

  Future<void> updateDueDate(DateTime? dueDate) async {
    await DatabaseService.instance.updateFeeDueDate(studentId, dueDate);
    await _load();
    _ref.invalidate(dashboardStatsProvider);
    final fee = await DatabaseService.instance.getFeeByStudentId(studentId);
    // FIXED: await Firestore write
    if (fee != null) {
      try {
        await FirestoreService.instance.syncFee(fee);
      } catch (e) {
        debugPrint('[FeeNotifier] ❌ Firestore syncFee failed (updateDueDate): $e');
      }
    }
  }

  Future<void> addPayment(PaymentModel payment) async {
    await DatabaseService.instance.addPayment(payment);
    await _load();
    _ref.invalidate(dashboardStatsProvider);
    // FIXED: await both Firestore writes so payment persists before app close
    try {
      await FirestoreService.instance.syncPayment(payment);
    } catch (e) {
      debugPrint('[FeeNotifier] ❌ Firestore syncPayment failed: $e');
    }
    final fee = await DatabaseService.instance.getFeeByStudentId(studentId);
    if (fee != null) {
      try {
        await FirestoreService.instance.syncFee(fee);
      } catch (e) {
        debugPrint('[FeeNotifier] ❌ Firestore syncFee failed (addPayment): $e');
      }
    }
  }
}

// ─── ATTENDANCE PROVIDERS ──────────────────────────────────────────────────

final attendanceDateProvider = StateProvider<DateTime>((ref) => DateTime.now());

final attendanceProvider = StateNotifierProvider.family<AttendanceNotifier, AsyncValue<List<AttendanceModel>>, DateTime>((ref, date) {
  return AttendanceNotifier(ref, date);
});

class AttendanceNotifier extends StateNotifier<AsyncValue<List<AttendanceModel>>> {
  final Ref _ref;
  final DateTime date;
  AttendanceNotifier(this._ref, this.date) : super(const AsyncLoading()) {
    _load();
  }

  Future<void> _load() async {
    try {
      final records = await DatabaseService.instance.getAttendanceByDate(date);
      state = AsyncData(records);
    } catch (e, st) {
      state = AsyncError(e, st);
    }
  }

  Future<void> mark(AttendanceModel attendance) async {
    await DatabaseService.instance.markAttendance(attendance);
    await _load();
    _ref.invalidate(dashboardStatsProvider);
    _ref.invalidate(studentAttendanceProvider(attendance.studentId));
    FirestoreService.instance.syncAttendance(attendance);
  }
}

final studentAttendanceProvider = FutureProvider.family<List<AttendanceModel>, String>((ref, studentId) {
  return DatabaseService.instance.getAttendanceByStudentId(studentId);
});

// ─── RESULT PROVIDER ──────────────────────────────────────────────────────

final resultsProvider = FutureProvider.family<List<ResultModel>, String>((ref, studentId) {
  return DatabaseService.instance.getResultsByStudentId(studentId);
});

final resultNotifierProvider = StateNotifierProvider.family<ResultNotifier, void, String>((ref, studentId) {
  return ResultNotifier(ref, studentId);
});

class ResultNotifier extends StateNotifier<void> {
  final Ref _ref;
  final String studentId;

  ResultNotifier(this._ref, this.studentId) : super(null);

  // FIX: Explicitly defined parameter 'ResultModel result'
  Future<void> add(ResultModel result) async {
    await DatabaseService.instance.insertResult(result);
    _ref.invalidate(resultsProvider(studentId));
    // FIXED: await Firestore write
    try {
      await FirestoreService.instance.syncResult(result);
    } catch (e) {
      debugPrint('[ResultNotifier] ❌ Firestore syncResult failed: $e');
    }
  }

  Future<void> remove(String resultId) async {
    await DatabaseService.instance.deleteResult(resultId);
    _ref.invalidate(resultsProvider(studentId));
    // FIXED: await Firestore delete
    try {
      await FirestoreService.instance.deleteResultRemote(resultId);
    } catch (e) {
      debugPrint('[ResultNotifier] ❌ Firestore deleteResult failed: $e');
    }
  }
}

// ─── DASHBOARD PROVIDER ───────────────────────────────────────────────────

final dashboardStatsProvider = FutureProvider<DashboardStats>((ref) async {
  // Watch students so dashboard rebuilds after any add/edit/delete.
  ref.watch(studentsProvider);

  // Watch teacher class/section selection — when teacher changes class,
  // this FutureProvider automatically re-runs with the new values.
  final teacherClass   = ref.watch(teacherSelectedClassProvider);
  final teacherSection = ref.watch(teacherSelectedSectionProvider);

  final isTeacher = SessionService.instance.isTeacher;

  // ── Teacher with NO class/section selected ─────────────────────────────
  // Return a zeroed-out stats object so the UI can show the
  // "Select Class & Section" placeholder instead of misleading
  // whole-school numbers.
  if (isTeacher && teacherClass.isEmpty) {
    return DashboardStats(
      totalStudents: 0,
      schoolStudents: 0,
      computerStudents: 0,
      totalCollected: 0,
      totalPending: 0,
      presentToday: 0,
      absentToday: 0,
      leaveToday: 0,
      overdueCount: 0,
      studentsByClass: const {},
      studentsByCourse: const {},
      monthlyCollection: const [],
      isFiltered: false,
      filterLabel: '',
    );
  }

  // ── Teacher with class/section selected ────────────────────────────────
  // Use filtered queries so stats only cover the selected class+section.
  if (isTeacher && teacherClass.isNotEmpty) {
    final db = DatabaseService.instance;

    final total        = await db.getStudentCountFiltered(className: teacherClass, section: teacherSection.isEmpty ? null : teacherSection);
    final attendance   = await db.getTodayAttendanceSummaryFiltered(className: teacherClass, section: teacherSection.isEmpty ? null : teacherSection);
    final pending      = await db.getTotalPendingFeesFiltered(className: teacherClass, section: teacherSection.isEmpty ? null : teacherSection);
    final collected    = await db.getTotalCollectedFiltered(className: teacherClass, section: teacherSection.isEmpty ? null : teacherSection);
    final overdueCount = await db.getOverdueFeeCountFiltered(className: teacherClass, section: teacherSection.isEmpty ? null : teacherSection);
    final byClass      = await db.getStudentsByClass();
    final byCourse     = await db.getStudentsByCourse();

    final label = teacherSection.isNotEmpty
        ? 'Class $teacherClass - Section $teacherSection'
        : 'Class $teacherClass';

    return DashboardStats(
      totalStudents: total,
      schoolStudents: total, // all students in the filtered class are "school" type
      computerStudents: 0,
      totalCollected: collected,
      totalPending: pending,
      presentToday: attendance['present'] ?? 0,
      absentToday: attendance['absent'] ?? 0,
      leaveToday: attendance['leave'] ?? 0,
      overdueCount: overdueCount,
      studentsByClass: byClass,
      studentsByCourse: byCourse,
      monthlyCollection: const [],
      isFiltered: true,
      filterLabel: label,
    );
  }

  // ── Principal (or teacher with no role set) ────────────────────────────
  // Whole-school queries — unchanged from the original implementation.
  final total        = await DatabaseService.instance.getStudentCount();
  final school       = await DatabaseService.instance.getStudentCountByType('school');
  final computer     = await DatabaseService.instance.getStudentCountByType('computer');
  final collected    = await DatabaseService.instance.getTotalCollected();
  final pending      = await DatabaseService.instance.getTotalPendingFees();
  final presentToday = await DatabaseService.instance.getTodayPresentCount();
  final todayAtt     = await DatabaseService.instance.getTodayAttendanceSummary();
  final overdueCount = await DatabaseService.instance.getOverdueFeeCount();
  final byClass      = await DatabaseService.instance.getStudentsByClass();
  final byCourse     = await DatabaseService.instance.getStudentsByCourse();
  final monthly      = await DatabaseService.instance.getMonthlyCollection();

  return DashboardStats(
    totalStudents: total,
    schoolStudents: school,
    computerStudents: computer,
    totalCollected: collected,
    totalPending: pending,
    presentToday: presentToday,
    absentToday: todayAtt['absent'] ?? 0,
    leaveToday: todayAtt['leave'] ?? 0,
    overdueCount: overdueCount,
    studentsByClass: byClass,
    studentsByCourse: byCourse,
    monthlyCollection: monthly,
    isFiltered: false,
    filterLabel: '',
  );
});

class DashboardStats {
  final int totalStudents;
  final int schoolStudents;
  final int computerStudents;
  final double totalCollected;
  final double totalPending;
  final int presentToday;
  /// Absent count for today — populated for both Principal (whole-school)
  /// and Teacher (filtered to their class/section).
  final int absentToday;
  /// Leave count for today — same scoping as [absentToday].
  final int leaveToday;
  final int overdueCount;
  final Map<String, int> studentsByClass;
  final Map<String, int> studentsByCourse;
  final List<Map<String, dynamic>> monthlyCollection;
  /// True when stats are filtered to a specific class+section.
  /// False for Principal (whole-school) and Teacher with no selection.
  final bool isFiltered;
  /// Human-readable label of the active filter, e.g. "Class 8 - Section A".
  final String filterLabel;

  DashboardStats({
    required this.totalStudents,
    required this.schoolStudents,
    required this.computerStudents,
    required this.totalCollected,
    required this.totalPending,
    required this.presentToday,
    required this.absentToday,
    required this.leaveToday,
    required this.overdueCount,
    required this.studentsByClass,
    required this.studentsByCourse,
    required this.monthlyCollection,
    required this.isFiltered,
    required this.filterLabel,
  });
}

// ─── SETTINGS PROVIDER ────────────────────────────────────────────────────

final settingsProvider = StateNotifierProvider<SettingsNotifier, AsyncValue<SettingsModel>>((ref) {
  return SettingsNotifier();
});

class SettingsNotifier extends StateNotifier<AsyncValue<SettingsModel>> {
  SettingsNotifier() : super(const AsyncLoading()) {
    _load();
  }

  Future<void> _load() async {
    try {
      final settings = await DatabaseService.instance.getSettings();
      state = AsyncData(settings);
    } catch (e, st) {
      state = AsyncError(e, st);
    }
  }

  Future<void> save(SettingsModel settings) async {
    await DatabaseService.instance.saveSettings(settings);
    await _load();
    // FIXED: await Firestore write
    try {
      await FirestoreService.instance.syncSettings(settings);
    } catch (e) {
      debugPrint('[SettingsNotifier] ❌ Firestore syncSettings failed: $e');
    }
  }
}

// ─── THEME PROVIDER ───────────────────────────────────────────────────────

final themeModeProvider = StateNotifierProvider<ThemeModeNotifier, ThemeMode>((ref) {
  return ThemeModeNotifier(ref);
});

class ThemeModeNotifier extends StateNotifier<ThemeMode> {
  final Ref _ref;
  ThemeModeNotifier(this._ref) : super(ThemeMode.light) {
    _loadFromSettings();
  }

  Future<void> _loadFromSettings() async {
    final settingsAsync = _ref.read(settingsProvider);
    settingsAsync.whenData((s) => _applyMode(s.themeMode));
    _ref.listen(settingsProvider, (_, next) {
      next.whenData((s) => _applyMode(s.themeMode));
    });
  }

  void _applyMode(String mode) {
    switch (mode) {
      case 'dark':
        state = ThemeMode.dark;
        break;
      case 'system':
        state = ThemeMode.system;
        break;
      default:
        state = ThemeMode.light;
        break;
    }
  }

  Future<void> setMode(String mode) async {
    _applyMode(mode);
    final settingsAsync = _ref.read(settingsProvider);
    settingsAsync.whenData((s) async {
      await _ref.read(settingsProvider.notifier).save(s.copyWith(themeMode: mode));
    });
  }
}

// ─── FIRESTORE REAL-TIME SYNC + ACCOUNT SWITCHING ─────────────────────────

final authStateChangesProvider = StreamProvider<User?>((ref) {
  return FirebaseAuth.instance.authStateChanges();
});

final firestoreRealtimeSyncProvider = Provider<void>((ref) {
  StreamSubscription<User?>? authSub;
  StreamSubscription<String?>? sessionSub; // listens for post-login session set
  final dataSubs = <StreamSubscription>[];
  String? subscribedUid;
  bool switching = false;

  Future<void> cancelDataSubscriptions() async {
    for (final sub in dataSubs) {
      await sub.cancel();
    }
    dataSubs.clear();
    subscribedUid = null;
  }

  Future<void> startForUser(User user) async {
    if (switching) return;

    // FIXED: Always use SessionService schoolId — never fall back to user.uid.
    // Falling back to user.uid for a Teacher would scope Firestore to the
    // teacher's own UID instead of the school's UID, causing a PERMISSION_DENIED
    // error (their teacher doc lives under the principal's schoolId, not their uid).
    //
    // SessionService.restore() is called in main() before Firebase init,
    // so the session should already be loaded. But restore() is idempotent, so
    // calling it again here is safe and ensures correctness.
    await SessionService.instance.restore();
    final activeSchoolUid = SessionService.instance.activeSchoolUid;

    if (activeSchoolUid == null) {
      // No session stored yet — this happens on the very first app launch
      // before the user has logged in. Do nothing; auth will call us again
      // after login completes and setPrincipalSession/setTeacherSession runs.
      debugPrint('[FirestoreSync] No schoolId in session for ${user.uid} — waiting for login');
      return;
    }

    if (subscribedUid == activeSchoolUid) return; // already subscribed
    switching = true;

    try {
      await cancelDataSubscriptions();

      // FIXED: switchLocalUser no longer wipes SQLite. It just records the
      // active school context. SQLite data is preserved across restarts.
      await DatabaseService.instance.switchLocalUser(activeSchoolUid);

      ref.invalidate(studentsProvider);
      ref.invalidate(dashboardStatsProvider);
      ref.invalidate(settingsProvider);

      // ── Students stream ─────────────────────────────────────────────────
      final studentsStream = FirestoreService.instance.watchStudents();
      if (studentsStream != null) {
        dataSubs.add(studentsStream.listen((remoteStudents) async {
          for (final student in remoteStudents) {
            await DatabaseService.instance.upsertStudentFromRemote(student);
          }
          ref.read(studentsProvider.notifier).loadStudents();
          ref.invalidate(dashboardStatsProvider);
        }, onError: (e) => debugPrint('[FirestoreSync] students error: $e')));
      }

      // ── Fees stream (legacy aggregate fees table) ───────────────────────
      final feesStream = FirestoreService.instance.watchFees();
      if (feesStream != null) {
        dataSubs.add(feesStream.listen((remoteFees) async {
          for (final entry in remoteFees.entries) {
            await DatabaseService.instance.upsertFeeFromRemote(entry.key, entry.value);
          }
          ref.invalidate(dashboardStatsProvider);
          for (final id in remoteFees.keys) {
            ref.invalidate(feeProvider(id));
          }
        }, onError: (e) => debugPrint('[FirestoreSync] fees error: $e')));
      }

      // ── Monthly Fees stream ─────────────────────────────────────────────
      // ADDED: This was the missing stream causing monthly fee/payment data
      // to disappear after restart. Without this, monthly_fees table was
      // empty on restart until a user manually opened a fee screen.
      final monthlyFeesStream = FirestoreService.instance.watchMonthlyFees();
      if (monthlyFeesStream != null) {
        dataSubs.add(monthlyFeesStream.listen((remoteMonthlyFees) async {
          final affectedStudentIds = <String>{};
          for (final entry in remoteMonthlyFees.entries) {
            final data = entry.value;
            final studentId = data['studentId']?.toString() ?? '';
            if (studentId.isNotEmpty) {
              await DatabaseService.instance.upsertMonthlyFeeFromRemote(studentId, data);
              affectedStudentIds.add(studentId);
            }
          }
          ref.invalidate(dashboardStatsProvider);
          for (final id in affectedStudentIds) {
            ref.invalidate(feeProvider(id));
          }
        }, onError: (e) => debugPrint('[FirestoreSync] monthly_fees error: $e')));
      }

      // ── Payments stream ─────────────────────────────────────────────────
      // FIXED: Changed from replaceRemotePayments (which deleted all payments
      // first) to per-payment upsert. The old approach caused a race condition:
      // if students hadn't arrived yet when payments were processed, all
      // payments would be silently dropped (FK check failed).
      final paymentsStream = FirestoreService.instance.watchPayments();
      if (paymentsStream != null) {
        dataSubs.add(paymentsStream.listen((payments) async {
          // Upsert each payment individually — idempotent, no data loss
          for (final p in payments) {
            await DatabaseService.instance.upsertPaymentFromRemote(p.toMap());
          }
          ref.invalidate(dashboardStatsProvider);
          final ids = payments.map((p) => p.studentId).toSet();
          for (final id in ids) {
            ref.invalidate(feeProvider(id));
          }
        }, onError: (e) => debugPrint('[FirestoreSync] payments error: $e')));
      }

      // ── Attendance stream ───────────────────────────────────────────────
      // FIXED: watchAttendance() now uses school-scoped attendance_flat
      // collection instead of cross-school collectionGroup('records').
      final attendanceStream = FirestoreService.instance.watchAttendance();
      if (attendanceStream != null) {
        dataSubs.add(attendanceStream.listen((records) async {
          for (final record in records) {
            await DatabaseService.instance.upsertAttendanceFromRemote(record);
          }
          ref.invalidate(dashboardStatsProvider);
          final dates = records.map((r) => DateTime(r.date.year, r.date.month, r.date.day)).toSet();
          final ids = records.map((r) => r.studentId).toSet();
          for (final date in dates) {
            ref.invalidate(attendanceProvider(date));
          }
          for (final id in ids) {
            ref.invalidate(studentAttendanceProvider(id));
          }
        }, onError: (e) => debugPrint('[FirestoreSync] attendance error: $e')));
      }

      // ── Settings stream ─────────────────────────────────────────────────
      final settingsStream = FirestoreService.instance.watchSettings();
      if (settingsStream != null) {
        dataSubs.add(settingsStream.listen((remote) async {
          if (remote == null) return;
          final local = await DatabaseService.instance.getSettings();
          await DatabaseService.instance.saveSettings(remote.copyWith(logoPath: local.logoPath));
          ref.invalidate(settingsProvider);
        }, onError: (e) => debugPrint('[FirestoreSync] settings error: $e')));
      }

      subscribedUid = activeSchoolUid;
      debugPrint('[FirestoreSync] ✅ Subscribed to school: $activeSchoolUid (role: ${SessionService.instance.role?.name})');
    } catch (e, st) {
      debugPrint('[FirestoreSync] ❌ startForUser failed: $e');
      debugPrint('$st');
    } finally {
      switching = false;
    }
  }

  Future<void> handleAuth(User? user) async {
    if (user == null) {
      // User logged out — cancel streams but do NOT wipe SQLite here.
      // clearAllLocalData() is called explicitly from the logout button/flow
      // so data is only cleared when the user intentionally signs out.
      await cancelDataSubscriptions();
      await DatabaseService.instance.switchLocalUser(null);
      ref.invalidate(studentsProvider);
      ref.invalidate(dashboardStatsProvider);
      ref.invalidate(settingsProvider);
      return;
    }
    await startForUser(user);
  }

  // ── Auth state listener ─────────────────────────────────────────────────
  // Fires on app start (session restore) and on explicit login/logout.
  authSub = FirebaseAuth.instance.authStateChanges().listen(
    (user) => handleAuth(user),
    onError: (e) => debugPrint('[AuthSync] $e'),
  );

  // ── Session change listener ────────────────────────────────────────────
  // CRITICAL FIX: authStateChanges fires BEFORE setPrincipalSession() or
  // setTeacherSession() is called in login_screen.dart. At that point,
  // SessionService.activeSchoolUid is still null, so startForUser() returns
  // early and NO Firestore streams are subscribed.
  //
  // This listener fires when setPrincipalSession/setTeacherSession emits on
  // onSchoolUidChanged. At that point the current Firebase user is available
  // and activeSchoolUid is correctly set, so we reset subscribedUid and
  // re-run startForUser() to actually subscribe all data streams.
  //
  // This means: login → data loads automatically, NO restart needed.
  sessionSub = SessionService.instance.onSchoolUidChanged.listen(
    (newSchoolUid) async {
      if (newSchoolUid == null) return;
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) return;
      // Reset so startForUser() doesn't skip due to subscribedUid == newSchoolUid
      subscribedUid = null;
      debugPrint('[FirestoreSync] Session set → re-triggering startForUser() for $newSchoolUid');
      await startForUser(user);
    },
    onError: (e) => debugPrint('[SessionSync] $e'),
  );

  ref.onDispose(() async {
    await authSub?.cancel();
    await sessionSub?.cancel();
    await cancelDataSubscriptions();
  });
});