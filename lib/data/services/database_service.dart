import 'dart:io';
import 'package:flutter/foundation.dart' show kIsWeb, debugPrint;
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import 'package:path_provider/path_provider.dart';
import 'package:uuid/uuid.dart';
import '../models/student_model.dart';
import '../models/fee_model.dart';
import '../models/attendance_model.dart';
import '../models/result_model.dart';
import '../models/settings_model.dart';
import 'firestore_service.dart';

class DatabaseService {
  static final DatabaseService instance = DatabaseService._internal();
  DatabaseService._internal();

  Database? _db;

  Future<void> initialize() async {
    if (kIsWeb) return; // SQLite not supported on web — Firestore is used directly
    _db = await _openDatabase();
  }

  Future<Database> get database async {
    if (kIsWeb) {
      throw UnsupportedError('SQLite database cannot be accessed directly on Web.');
    }
    _db ??= await _openDatabase();
    return _db!;
  }

  Future<Database> _openDatabase() async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, 'school_app.db');

    return openDatabase(
      path,
      version: 7,
      onCreate: _createTables,
      onUpgrade: _onUpgrade,
    );
  }

  Future<void> _onUpgrade(
      Database db,
      int oldVersion,
      int newVersion,
      ) async {
    if (oldVersion < 2) {
      try {
        await db.execute(
          'ALTER TABLE monthly_fees '
              'ADD COLUMN monthlyFee REAL NOT NULL DEFAULT 0',
        );
      } catch (_) {}
    }

    if (oldVersion < 3) {
      final columns = <String>[
        'admissionFee',
        'examinationFee',
        'previousDue',
        'gameFee',
        'reAdmissionFee',
        'developmentFee',
        'schoolIdFee',
        'tieBagBeltFee',
        'backDues',
        'transportFee',
        'otherFee',
      ];

      for (final column in columns) {
        try {
          await db.execute(
            'ALTER TABLE monthly_fees '
                'ADD COLUMN $column REAL NOT NULL DEFAULT 0',
          );
        } catch (_) {}
      }

      try {
        await db.execute(
          'ALTER TABLE monthly_fees ADD COLUMN remarks TEXT',
        );
      } catch (_) {}

      try {
        await db.execute(
          'ALTER TABLE monthly_fees ADD COLUMN createdAt TEXT',
        );
      } catch (_) {}

      try {
        await db.execute(
          'ALTER TABLE monthly_fees ADD COLUMN updatedAt TEXT',
        );
      } catch (_) {}
    }

    if (oldVersion < 6) {
      try {
        await db.execute(
          'ALTER TABLE monthly_fees '
              'ADD COLUMN monthlyFee REAL NOT NULL DEFAULT 0',
        );
      } catch (_) {}
    }

    if (oldVersion < 7) {
      try {
        await db.execute(
          'ALTER TABLE monthly_fees '
              'ADD COLUMN lateFine REAL NOT NULL DEFAULT 0',
        );
      } catch (_) {}
      try {
        await db.execute('''
          CREATE TABLE IF NOT EXISTS fee_structures (
            studentId TEXT PRIMARY KEY,
            tuitionFee REAL NOT NULL DEFAULT 0,
            transportFee REAL NOT NULL DEFAULT 0,
            gameFee REAL NOT NULL DEFAULT 0,
            dueDay INTEGER NOT NULL DEFAULT 10,
            finePerDay REAL NOT NULL DEFAULT 0,
            updatedAt TEXT NOT NULL,
            FOREIGN KEY (studentId) REFERENCES students(id)
          )
        ''');
      } catch (_) {}
    }
  }

  Future<void> _createTables(Database db, int version) async {
    // ============================================================
    // STUDENTS
    // ============================================================
    await db.execute('''
    CREATE TABLE students (
      id TEXT PRIMARY KEY,
      admissionNumber TEXT UNIQUE NOT NULL,
      studentId TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      fatherName TEXT NOT NULL,
      motherName TEXT,
      mobile TEXT NOT NULL,
      alternateMobile TEXT,
      dob TEXT NOT NULL,
      gender TEXT NOT NULL,
      address TEXT NOT NULL,
      photoPath TEXT,
      studentType TEXT NOT NULL,
      className TEXT,
      section TEXT,
      rollNumber TEXT,
      course TEXT,
      batch TEXT,
      courseDurationMonths INTEGER,
      expectedCompletionDate TEXT,
      status TEXT NOT NULL DEFAULT "active",
      session TEXT,
      email TEXT,
      admissionDate TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )
  ''');

    // ============================================================
    // OLD FEES TABLE
    // ============================================================
    await db.execute('''
    CREATE TABLE fees (
      studentId TEXT PRIMARY KEY,
      totalFees REAL NOT NULL DEFAULT 0,
      paidFees REAL NOT NULL DEFAULT 0,
      dueDate TEXT,
      lastPaidDate TEXT
    )
  ''');

    // ============================================================
    // MONTHLY FEES
    // ============================================================
    await db.execute('''
CREATE TABLE monthly_fees (
  id TEXT PRIMARY KEY,
  studentId TEXT NOT NULL,
  month TEXT NOT NULL,
  monthlyFee REAL NOT NULL DEFAULT 0,
  admissionFee REAL NOT NULL DEFAULT 0,
  tuitionFee REAL NOT NULL DEFAULT 0,
  examinationFee REAL NOT NULL DEFAULT 0,
  previousDue REAL NOT NULL DEFAULT 0,
  gameFee REAL NOT NULL DEFAULT 0,
  reAdmissionFee REAL NOT NULL DEFAULT 0,
  developmentFee REAL NOT NULL DEFAULT 0,
  schoolIdFee REAL NOT NULL DEFAULT 0,
  tieBagBeltFee REAL NOT NULL DEFAULT 0,
  backDues REAL NOT NULL DEFAULT 0,
  transportFee REAL NOT NULL DEFAULT 0,
  otherFee REAL NOT NULL DEFAULT 0,
  paidAmount REAL NOT NULL DEFAULT 0,
  lateFine REAL NOT NULL DEFAULT 0,
  dueDate TEXT,
  lastPaymentDate TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  remarks TEXT,
  UNIQUE(studentId, month),
  FOREIGN KEY (studentId) REFERENCES students(id)
)
''');

    // ============================================================
    // FEE STRUCTURES (per-student recurring monthly template)
    // ============================================================
    await db.execute('''
    CREATE TABLE fee_structures (
      studentId TEXT PRIMARY KEY,
      tuitionFee REAL NOT NULL DEFAULT 0,
      transportFee REAL NOT NULL DEFAULT 0,
      gameFee REAL NOT NULL DEFAULT 0,
      dueDay INTEGER NOT NULL DEFAULT 10,
      finePerDay REAL NOT NULL DEFAULT 0,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (studentId) REFERENCES students(id)
    )
  ''');

    // ============================================================
    // PAYMENTS
    // ============================================================
    await db.execute('''
    CREATE TABLE payments (
      id TEXT PRIMARY KEY,
      studentId TEXT NOT NULL,
      amount REAL NOT NULL,
      paymentDate TEXT NOT NULL,
      paymentMode TEXT NOT NULL,
      remarks TEXT,
      receiptNumber TEXT NOT NULL,
      feeMonth TEXT,
      FOREIGN KEY (studentId) REFERENCES students(id)
    )
  ''');

    // ============================================================
    // ATTENDANCE
    // ============================================================
    await db.execute('''
    CREATE TABLE attendance (
      id TEXT PRIMARY KEY,
      studentId TEXT NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL,
      FOREIGN KEY (studentId) REFERENCES students(id),
      UNIQUE(studentId, date)
    )
  ''');

    // ============================================================
    // RESULTS
    // ============================================================
    await db.execute('''
    CREATE TABLE results (
      id TEXT PRIMARY KEY,
      studentId TEXT NOT NULL,
      examName TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (studentId) REFERENCES students(id)
    )
  ''');

    // ============================================================
    // SUBJECT RESULTS
    // ============================================================
    await db.execute('''
    CREATE TABLE subject_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      resultId TEXT NOT NULL,
      subjectName TEXT NOT NULL,
      marks REAL NOT NULL,
      totalMarks REAL NOT NULL,
      FOREIGN KEY (resultId) REFERENCES results(id)
    )
  ''');

    // ============================================================
    // SETTINGS
    // ============================================================
    await db.execute('''
    CREATE TABLE settings (
      id INTEGER PRIMARY KEY,
      instituteName TEXT NOT NULL,
      logoPath TEXT,
      address TEXT NOT NULL,
      mobile TEXT NOT NULL,
      email TEXT,
      website TEXT,
      principalName TEXT,
      affiliationNumber TEXT,
      currentSession TEXT DEFAULT "2026-27",
      themeMode TEXT DEFAULT "system"
    )
  ''');

    // ============================================================
    // RECEIPT COUNTER
    // ============================================================
    await db.execute('''
    CREATE TABLE receipt_counter (
      id INTEGER PRIMARY KEY,
      counter INTEGER NOT NULL DEFAULT 0
    )
  ''');

    // ============================================================
    // DEFAULT DATA
    // ============================================================
    await db.insert('settings', {
      'id': 1,
      'instituteName': 'My School & Computer Institute',
      'address': 'Enter Your Address Here',
      'mobile': '9876543210',
      'currentSession': '2026-27',
      'themeMode': 'system',
    });

    await db.insert(
      'receipt_counter',
      {
        'id': 1,
        'counter': 0,
      },
    );
  }


  String? _activeUserUid;

  /// Switches the active school user context WITHOUT wiping local SQLite data.
  ///
  /// IMPORTANT: We intentionally do NOT delete any tables here.
  /// SQLite is the local cache / offline-first database. Wiping it on every
  /// app restart or role switch causes the exact data-loss bugs described in
  /// the issue (students/fees/payments disappearing after restart).
  ///
  /// Correct flow:
  ///   App start → Firebase Auth restores session → SessionService.restore()
  ///   → switchLocalUser(schoolId) [just sets the active context]
  ///   → Firestore realtime streams UPSERT new/updated records into SQLite
  ///   → Riverpod providers invalidate → UI rebuilds with fresh data
  ///
  /// For explicit user logout, call clearAllLocalData() separately.
  Future<void> switchLocalUser(String? uid) async {
    if (_activeUserUid == uid) return;
    _activeUserUid = uid;
    debugPrint('[DB] switchLocalUser → $uid (local SQLite data preserved)');
    // Do NOT delete any tables. Firestore streams will upsert the correct
    // school data. This prevents the blank-screen-after-restart bug.
  }

  /// Explicitly clears all local school data.
  /// Call this ONLY during a real user logout (sign-out button), never on
  /// restart or role switch. This allows a different school account to start
  /// fresh on the same device without seeing the previous school's data.
  Future<void> clearAllLocalData() async {
    if (kIsWeb) return;
    final db = await database;
    await db.transaction((txn) async {
      for (final table in [
        'subject_results', 'results', 'attendance', 'payments',
        'monthly_fees', 'fee_structures', 'fees', 'students'
      ]) {
        await txn.delete(table);
      }
      await txn.delete('settings');
      await txn.delete('receipt_counter');
      await txn.insert('settings', {
        'id': 1,
        'instituteName': 'My School & Computer Institute',
        'address': 'Enter Your Address Here',
        'mobile': '9876543210',
        'currentSession': '2026-27',
        'themeMode': 'system',
      });
      await txn.insert('receipt_counter', {'id': 1, 'counter': 0});
    });
    _activeUserUid = null;
    debugPrint('[DB] clearAllLocalData — all tables cleared');
  }

  String? get activeUserUid => _activeUserUid;

  Future<void> upsertPaymentFromRemote(Map<String, dynamic> data) async {
    final db = await database;
    final studentId = data['studentId']?.toString() ?? '';
    if (studentId.isEmpty) return;
    final exists = await db.query('students', where: 'id = ?', whereArgs: [studentId]);
    if (exists.isEmpty) return;
    await db.insert('payments', {
      'id': data['id']?.toString() ?? const Uuid().v4(),
      'studentId': studentId, 'amount': (data['amount'] as num?)?.toDouble() ?? 0,
      'paymentDate': data['paymentDate']?.toString() ?? DateTime.now().toIso8601String(),
      'paymentMode': data['paymentMode']?.toString() ?? 'Cash',
      'remarks': data['remarks']?.toString(), 'receiptNumber': data['receiptNumber']?.toString() ?? '',
      'feeMonth': data['feeMonth']?.toString(),
    }, conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<void> upsertAttendanceFromRemote(AttendanceModel record) async {
    final db = await database;
    final exists = await db.query('students', where: 'id = ?', whereArgs: [record.studentId]);
    if (exists.isEmpty) return;
    await db.insert('attendance', record.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<void> replaceRemotePayments(List<PaymentModel> payments) async {
    final db = await database;
    await db.delete('payments');
    for (final payment in payments) {
      final exists = await db.query('students', where: 'id = ?', whereArgs: [payment.studentId]);
      if (exists.isNotEmpty) await db.insert('payments', payment.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
    }
  }

  Future<void> replaceRemoteAttendance(List<AttendanceModel> records) async {
    final db = await database;
    await db.delete('attendance');
    for (final record in records) {
      final exists = await db.query('students', where: 'id = ?', whereArgs: [record.studentId]);
      if (exists.isNotEmpty) await db.insert('attendance', record.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
    }
  }

  // ─── RECEIPT COUNTER ──────────────────────────────────────────────────────

  Future<String> generateReceiptNumber() async {
    if (kIsWeb) return FirestoreService.instance.nextReceiptNumber();
    final db = await database;
    final result = await db.rawQuery('SELECT counter FROM receipt_counter WHERE id = 1');
    final current = result.isEmpty ? 0 : (result.first['counter'] as int);
    final next = current + 1;
    await db.update('receipt_counter', {'counter': next}, where: 'id = 1');
    return 'REC${next.toString().padLeft(6, '0')}';
  }

  // ─── STUDENT CRUD ─────────────────────────────────────────────────────────

  Future<void> insertStudent(StudentModel student) async {
    if (kIsWeb) {
      await FirestoreService.instance.syncStudent(student);
      return;
    }
    final db = await database;
    await db.insert('students', student.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
    await db.insert('fees', {
      'studentId': student.id,
      'totalFees': 0.0,
      'paidFees': 0.0,
    }, conflictAlgorithm: ConflictAlgorithm.ignore);
  }

  /// Upserts a student that arrived from a Firestore real-time snapshot.
  /// Same as insertStudent (safe to call whether the student is new or
  /// already exists locally) — kept as a separate name so call sites make
  /// clear this write originated remotely and should NOT be re-synced back
  /// to Firestore (that would create a redundant round-trip).
  Future<void> upsertStudentFromRemote(StudentModel student) => insertStudent(student);

  /// Upserts fee fields (totalFees/paidFees/dueDate/lastPaidDate) that
  /// arrived from a Firestore real-time snapshot, keyed by studentId.
  /// Ignored if no local student with that ID exists yet (it will be
  /// picked up once the matching student document syncs in).
  Future<void> upsertFeeFromRemote(String studentId, Map<String, dynamic> data) async {
    final db = await database;
    final studentExists = await db.query('students', where: 'id = ?', whereArgs: [studentId]);
    if (studentExists.isEmpty) return;
    await db.insert(
      'fees',
      {
        'studentId': studentId,
        'totalFees': (data['totalFees'] as num?)?.toDouble() ?? 0.0,
        'paidFees': (data['paidFees'] as num?)?.toDouble() ?? 0.0,
        'dueDate': data['dueDate'],
        'lastPaidDate': data['lastPaidDate'],
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<bool> isAdmissionNumberExists(String admissionNumber, {String? excludeId}) async {
    if (admissionNumber.trim().isEmpty) return false;
    if (kIsWeb) {
      final list = await getAllStudents();
      return list.any((s) => s.admissionNumber == admissionNumber && s.id != excludeId);
    }
    final db = await database;
    final result = await db.query(
      'students',
      where: excludeId != null
          ? 'admissionNumber = ? AND id != ?'
          : 'admissionNumber = ?',
      whereArgs: excludeId != null ? [admissionNumber, excludeId] : [admissionNumber],
    );
    return result.isNotEmpty;
  }

  Future<bool> isStudentIdExists(String studentId, {String? excludeId}) async {
    if (studentId.trim().isEmpty) return false;
    if (kIsWeb) {
      final list = await getAllStudents();
      return list.any((s) => s.studentId == studentId && s.id != excludeId);
    }
    final db = await database;
    final result = await db.query(
      'students',
      where: excludeId != null
          ? 'studentId = ? AND id != ?'
          : 'studentId = ?',
      whereArgs: excludeId != null ? [studentId, excludeId] : [studentId],
    );
    return result.isNotEmpty;
  }

  Future<List<StudentModel>> getAllStudents() async {
    if (kIsWeb) {
      return FirestoreService.instance.fetchStudents();
    }
    final db = await database;
    final maps = await db.query('students', orderBy: 'createdAt DESC');
    return maps.map(StudentModel.fromMap).toList();
  }

  Future<StudentModel?> getStudentById(String id) async {
    if (kIsWeb) {
      final list = await getAllStudents();
      try {
        return list.firstWhere((s) => s.id == id);
      } catch (_) {
        return null;
      }
    }
    final db = await database;
    final maps = await db.query('students', where: 'id = ?', whereArgs: [id]);
    if (maps.isEmpty) return null;
    return StudentModel.fromMap(maps.first);
  }

  Future<StudentModel?> getStudentByQrId(String studentId) async {
    if (kIsWeb) {
      final list = await getAllStudents();
      try {
        return list.firstWhere((s) => s.studentId == studentId);
      } catch (_) {
        return null;
      }
    }
    final db = await database;
    final maps = await db.query('students', where: 'studentId = ?', whereArgs: [studentId]);
    if (maps.isEmpty) return null;
    return StudentModel.fromMap(maps.first);
  }

  Future<List<StudentModel>> searchStudents(String query) async {
    if (kIsWeb) {
      final list = await getAllStudents();
      final q = query.toLowerCase();
      return list.where((s) =>
        s.name.toLowerCase().contains(q) ||
        s.admissionNumber.toLowerCase().contains(q) ||
        s.studentId.toLowerCase().contains(q) ||
        s.mobile.contains(q) ||
        s.fatherName.toLowerCase().contains(q)
      ).toList();
    }
    final db = await database;
    final q = '%$query%';
    final maps = await db.query(
      'students',
      where: 'name LIKE ? OR admissionNumber LIKE ? OR studentId LIKE ? OR mobile LIKE ? OR fatherName LIKE ?',
      whereArgs: [q, q, q, q, q],
      orderBy: 'name ASC',
    );
    return maps.map(StudentModel.fromMap).toList();
  }

  Future<List<StudentModel>> getStudentsByFilter({
    String? type, // school | computer
    String? status, // active | completed | left | suspended
    String? className,
    String? section,
    String? course,
    String? batch,
    String? session,
  }) async {
    if (kIsWeb) {
      final list = await getAllStudents();
      return list.where((s) {
        if (type != null && type != 'all' && s.studentType != type) return false;
        if (status != null && status != 'all' && s.status != status) return false;
        if (className != null && className.isNotEmpty && s.className != className) return false;
        if (section != null && section.isNotEmpty && s.section != section) return false;
        if (course != null && course.isNotEmpty && s.course != course) return false;
        if (batch != null && batch.isNotEmpty && s.batch != batch) return false;
        if (session != null && session.isNotEmpty && s.session != session) return false;
        return true;
      }).toList();
    }
    final db = await database;
    final conditions = <String>[];
    final args = <dynamic>[];

    if (type != null && type != 'all') { conditions.add('studentType = ?'); args.add(type); }
    if (status != null && status != 'all') { conditions.add('status = ?'); args.add(status); }
    if (className != null && className.isNotEmpty) { conditions.add('className = ?'); args.add(className); }
    if (section != null && section.isNotEmpty) { conditions.add('section = ?'); args.add(section); }
    if (course != null && course.isNotEmpty) { conditions.add('course = ?'); args.add(course); }
    if (batch != null && batch.isNotEmpty) { conditions.add('batch = ?'); args.add(batch); }
    if (session != null && session.isNotEmpty) { conditions.add('session = ?'); args.add(session); }

    final where = conditions.isEmpty ? null : conditions.join(' AND ');
    final maps = await db.query('students', where: where, whereArgs: args.isEmpty ? null : args, orderBy: 'name ASC');
    return maps.map(StudentModel.fromMap).toList();
  }

  Future<void> updateStudent(StudentModel student) async {
    if (kIsWeb) {
      await FirestoreService.instance.syncStudent(student);
      return;
    }
    final db = await database;
    await db.update('students', student.toMap(), where: 'id = ?', whereArgs: [student.id]);
  }

  Future<void> deleteStudent(String id) async {
    if (kIsWeb) {
      await FirestoreService.instance.deleteStudent(id);
      return;
    }
    final db = await database;
    await db.delete('students', where: 'id = ?', whereArgs: [id]);
    await db.delete('fees', where: 'studentId = ?', whereArgs: [id]);
    await db.delete('payments', where: 'studentId = ?', whereArgs: [id]);
    await db.delete('attendance', where: 'studentId = ?', whereArgs: [id]);
    await db.delete('results', where: 'studentId = ?', whereArgs: [id]);
  }

  Future<int> getStudentCount() async {
    final db = await database;
    final result = await db.rawQuery('SELECT COUNT(*) as count FROM students');
    return result.first['count'] as int;
  }

  Future<int> getStudentCountByType(String type) async {
    final db = await database;
    final result = await db.rawQuery('SELECT COUNT(*) as count FROM students WHERE studentType = ?', [type]);
    return result.first['count'] as int;
  }

  Future<Map<String, int>> getStudentsByClass() async {
    final db = await database;
    final result = await db.rawQuery(
        "SELECT className, COUNT(*) as count FROM students WHERE studentType = 'school' AND className IS NOT NULL GROUP BY className ORDER BY CAST(className AS INTEGER)");
    return {for (var row in result) (row['className'] as String): row['count'] as int};
  }

  Future<Map<String, int>> getStudentsByCourse() async {
    final db = await database;
    final result = await db.rawQuery(
        "SELECT course, COUNT(*) as count FROM students WHERE studentType = 'computer' AND course IS NOT NULL GROUP BY course");
    return {for (var row in result) (row['course'] as String): row['count'] as int};
  }

  // ─── FEE CRUD ─────────────────────────────────────────────────────────────

  Future<FeeModel?> getFeeByStudentId(String studentId) async {
    final map = await getAllFeesMap();
    return map[studentId];
  }

  /// Batch-load all fees with payments — avoids N+1 queries during export.
  Future<Map<String, FeeModel>> getAllFeesMap() async {
    final db = await database;
    final fees = await db.query('fees');
    final payments = await db.query('payments', orderBy: 'paymentDate DESC');

    final paymentsByStudent = <String, List<PaymentModel>>{};
    for (final row in payments) {
      final payment = PaymentModel.fromMap(row);
      paymentsByStudent.putIfAbsent(payment.studentId, () => []).add(payment);
    }

    final result = <String, FeeModel>{};
    for (final feeRow in fees) {
      final studentId = feeRow['studentId'] as String? ?? '';
      if (studentId.isEmpty) continue;
      // FIXED: Added named parameter 'payments'
      result[studentId] = FeeModel.fromMap(
        feeRow,
        payments: paymentsByStudent[studentId] ?? const [],
      );
    }
    return result;
  }

  Future<void> updateFeeTotal(String studentId, double totalFees) async {
    final db = await database;
    await db.update('fees', {'totalFees': totalFees}, where: 'studentId = ?', whereArgs: [studentId]);
  }

  /// Directly SETS (not increments) fee values — used by Excel/PDF import.
  /// Unlike addPayment(), this never adds to paidFees, so re-importing the
  /// same file (Update Existing) can't double-count what was already
  /// imported. A payment history row is still created here (if paidFees >
  /// 0 and none exists yet from a prior import) so "Payment Mode" /
  /// "Last Payment Date" from the file are preserved and getTotalCollected()
  /// stays consistent with what the fees table shows.
  Future<void> setFeeFromImport(
      String studentId, {
        double? totalFees,
        double? paidFees,
        DateTime? lastPaymentDate,
        String? paymentMode,
      }) async {
    final db = await database;
    final updates = <String, Object?>{};
    if (totalFees != null) updates['totalFees'] = totalFees;
    if (paidFees != null) {
      updates['paidFees'] = paidFees;
      if (lastPaymentDate != null) updates['lastPaidDate'] = lastPaymentDate.toIso8601String();
    }
    if (updates.isNotEmpty) {
      await db.update('fees', updates, where: 'studentId = ?', whereArgs: [studentId]);
    }

    if (paidFees != null && paidFees > 0) {
      // Only record a payment history row the first time we import a paid
      // amount for this student — avoids piling up duplicate payment rows
      // if the same file is imported more than once.
      final existingPayments = await db.query('payments',
          where: 'studentId = ? AND remarks = ?',
          whereArgs: [studentId, 'Imported from file']);
      if (existingPayments.isEmpty) {
        final receipt = await generateReceiptNumber();
        await db.insert('payments', {
          'id': const Uuid().v4(),
          'studentId': studentId,
          'amount': paidFees,
          'paymentDate': (lastPaymentDate ?? DateTime.now()).toIso8601String(),
          'paymentMode': (paymentMode == null || paymentMode.isEmpty) ? 'Cash' : paymentMode,
          'remarks': 'Imported from file',
          'receiptNumber': receipt,
        });
      }
    }
  }

  Future<void> updateFeeDueDate(String studentId, DateTime? dueDate) async {
    final db = await database;
    await db.update('fees', {'dueDate': dueDate?.toIso8601String()},
        where: 'studentId = ?', whereArgs: [studentId]);
  }

  /// Imports the 12 fee particulars from an Excel row into the actual
  /// monthly-fee ledger (the one fee_screen.dart / the receipt / the
  /// demand slip all read from) — NOT the old flat totalFees/paidFees
  /// aggregate that setFeeFromImport() above writes to. Without this, an
  /// imported "Tuition Fee: 3000, Transport Fee: 800, ..." row never
  /// showed up anywhere the Principal actually looks.
  ///
  /// Target month is taken from the row's due date (YYYY-MM) when present,
  /// otherwise defaults to the current month — the import template has no
  /// separate "Month" column, so the due date doubles as the anchor.
  Future<void> importMonthlyFeeParticulars(
      String studentId, {
        required String month,
        double? admissionFee,
        double? tuitionFee,
        double? examinationFee,
        double? gameFee,
        double? reAdmissionFee,
        double? developmentFee,
        double? schoolIdFee,
        double? tieBagBeltFee,
        double? backDues,
        double? transportFee,
        double? otherFee,
        double? paidAmount,
        DateTime? dueDate,
      }) async {
    final hasAnyParticular = [
      admissionFee, tuitionFee, examinationFee, gameFee, reAdmissionFee,
      developmentFee, schoolIdFee, tieBagBeltFee, backDues, transportFee, otherFee,
    ].any((v) => v != null);
    if (!hasAnyParticular && paidAmount == null) return; // nothing to import for this row

    final additionalFees = <FeeLineItem>[
      FeeLineItem(key: 'admissionFee', label: 'Admission Fee', amount: admissionFee ?? 0),
      FeeLineItem(key: 'examinationFee', label: 'Examination Fee', amount: examinationFee ?? 0),
      FeeLineItem(key: 'gameFee', label: 'Game Fee', amount: gameFee ?? 0),
      FeeLineItem(key: 'reAdmissionFee', label: 'Re-Admission Fee', amount: reAdmissionFee ?? 0),
      FeeLineItem(key: 'developmentFee', label: 'Development Fee', amount: developmentFee ?? 0),
      FeeLineItem(key: 'schoolIdFee', label: 'School ID', amount: schoolIdFee ?? 0),
      FeeLineItem(key: 'tieBagBeltFee', label: 'Tie, Bag, Belt', amount: tieBagBeltFee ?? 0),
      FeeLineItem(key: 'backDues', label: 'Back Dues', amount: backDues ?? 0),
      FeeLineItem(key: 'transportFee', label: 'Transport Fee', amount: transportFee ?? 0),
      FeeLineItem(key: 'otherFee', label: 'Other Fee', amount: otherFee ?? 0),
    ];

    final saved = await saveMonthlyFeeStructure(
      studentId: studentId,
      month: month,
      tuitionFee: tuitionFee ?? 0,
      additionalFees: additionalFees,
      dueDate: dueDate,
      remarks: 'Imported from file',
    );

    if (paidAmount != null && paidAmount > 0 && paidAmount != saved.paidAmount) {
      await _saveMonthlyFeeRow(saved.copyWith(paidAmount: paidAmount, updatedAt: DateTime.now()));
      await _propagatePreviousDueForward(studentId, month);
      await refreshLegacyFeeAggregate(studentId);
    }
  }

  Future<void> addPayment(PaymentModel payment) async {
    final db = await database;
    await db.insert('payments', payment.toMap());
    await db.rawUpdate(
      'UPDATE fees SET paidFees = paidFees + ?, lastPaidDate = ? WHERE studentId = ?',
      [payment.amount, payment.paymentDate.toIso8601String(), payment.studentId],
    );
  }

  Future<double> getTotalCollected() async {
    final db = await database;
    // JOIN against students so a payment row can never be counted for a
    // student that no longer exists — even if some other bug ever left an
    // orphan row behind, the dashboard total stays correct.
    final result = await db.rawQuery('''
      SELECT SUM(p.amount) as total
      FROM payments p
      INNER JOIN students s ON s.id = p.studentId
    ''');
    return (result.first['total'] as num?)?.toDouble() ?? 0;
  }

  Future<double> getTotalPendingFees() async {
    final db = await database;
    // Same defense-in-depth JOIN — this is the fix for the "₹5,000 pending
    // with 0 students" dashboard bug: any fee row without a matching
    // current student is now excluded from the sum at the source.
    final result = await db.rawQuery('''
      SELECT SUM(f.totalFees - f.paidFees) as pending
      FROM fees f
      INNER JOIN students s ON s.id = f.studentId
      WHERE f.totalFees > f.paidFees
    ''');
    return (result.first['pending'] as num?)?.toDouble() ?? 0;
  }

  Future<int> getOverdueFeeCount() async {
    final db = await database;
    final today = DateTime.now().toIso8601String().substring(0, 10);
    final result = await db.rawQuery('''
      SELECT COUNT(*) as count
      FROM fees f
      INNER JOIN students s ON s.id = f.studentId
      WHERE f.dueDate < ? AND f.totalFees > f.paidFees AND f.dueDate IS NOT NULL
    ''', [today]);
    return result.first['count'] as int;
  }

  Future<List<Map<String, dynamic>>> getMonthlyCollection({int months = 6}) async {
    final db = await database;
    final result = await db.rawQuery('''
      SELECT strftime('%Y-%m', p.paymentDate) as month, SUM(p.amount) as total
      FROM payments p
      INNER JOIN students s ON s.id = p.studentId
      WHERE p.paymentDate >= date('now', '-$months months')
      GROUP BY month
      ORDER BY month ASC
    ''');
    return result.map((r) => {'month': r['month'], 'total': (r['total'] as num?)?.toDouble() ?? 0.0}).toList();
  }


  // ─── MONTHLY FEE LEDGER ────────────────────────────────────────────────────

  String _previousMonthKey(String month) {
    final parts = month.split('-');
    var year = int.parse(parts[0]);
    var m = int.parse(parts[1]);
    m--;
    if (m == 0) {
      year--;
      m = 12;
    }
    return '$year-${m.toString().padLeft(2, '0')}';
  }

  String _nextMonthKey(String month) {
    final parts = month.split('-');
    var year = int.parse(parts[0]);
    var m = int.parse(parts[1]);
    m++;
    if (m == 13) {
      year++;
      m = 1;
    }
    return '$year-${m.toString().padLeft(2, '0')}';
  }

  MonthlyFeeModel _monthlyFeeFromRow(Map<String, dynamic> row) {
    return MonthlyFeeModel.fromMap(
      Map<String, dynamic>.from(row),
    );
  }

  // ─── Fee Structure (recurring per-student monthly template) ─────────────

  StudentFeeStructureModel _feeStructureFromRow(Map<String, dynamic> row) {
    return StudentFeeStructureModel.fromMap(Map<String, dynamic>.from(row));
  }

  Future<StudentFeeStructureModel?> getFeeStructure(String studentId) async {
    final db = await database;
    final rows = await db.query(
      'fee_structures',
      where: 'studentId = ?',
      whereArgs: [studentId],
      limit: 1,
    );
    if (rows.isEmpty) return null;
    return _feeStructureFromRow(rows.first);
  }

  /// Sets/updates the student's recurring Fee Structure. This does NOT
  /// retroactively touch any already-created month (same behaviour as the
  /// existing tuition-fee-carry-forward logic below) — it only affects
  /// months created from now on via [ensureMonthlyFee].
  Future<StudentFeeStructureModel> saveFeeStructure({
    required String studentId,
    required double tuitionFee,
    double transportFee = 0,
    double gameFee = 0,
    int dueDay = 10,
    double finePerDay = 0,
  }) async {
    final db = await database;
    final structure = StudentFeeStructureModel(
      studentId: studentId,
      tuitionFee: tuitionFee,
      transportFee: transportFee,
      gameFee: gameFee,
      dueDay: dueDay,
      finePerDay: finePerDay,
      updatedAt: DateTime.now(),
    );
    await db.insert('fee_structures', structure.toMap(),
        conflictAlgorithm: ConflictAlgorithm.replace);
    return structure;
  }

  /// Due date for [month] ('YYYY-MM') from the structure's dueDay, clamped
  /// to that month's real last day (e.g. dueDay=30 in February -> 28/29).
  DateTime? _dueDateFromStructure(
      String month, StudentFeeStructureModel? structure) {
    if (structure == null) return null;
    final parts = month.split('-');
    if (parts.length != 2) return null;
    final y = int.tryParse(parts[0]);
    final m = int.tryParse(parts[1]);
    if (y == null || m == null) return null;
    final lastDayOfMonth = DateTime(y, m + 1, 0).day;
    final day = structure.dueDay.clamp(1, lastDayOfMonth);
    return DateTime(y, m, day);
  }

  /// ₹ fine for being overdue as of today — days-late × finePerDay, same
  /// formula as the reference fee-structure design. Zero once the balance
  /// for this month (excluding any already-applied fine) is cleared.
  double _computeLateFine(
      DateTime? dueDate, double finePerDay, double remainingExcludingFine) {
    if (dueDate == null || finePerDay <= 0 || remainingExcludingFine <= 0) {
      return 0;
    }
    final now = DateTime.now();
    final due = DateTime(dueDate.year, dueDate.month, dueDate.day);
    final today = DateTime(now.year, now.month, now.day);
    if (!today.isAfter(due)) return 0;
    final daysLate = today.difference(due).inDays;
    return daysLate * finePerDay;
  }

  /// Recomputes lateFine on [fee] against the student's current Fee
  /// Structure. Returns [fee] unchanged if there's nothing to update.
  MonthlyFeeModel _withRecalculatedLateFine(
      MonthlyFeeModel fee, StudentFeeStructureModel? structure) {
    if (structure == null) {
      return fee.lateFine == 0 ? fee : fee.copyWith(lateFine: 0);
    }
    final remainingExcludingFine =
    (fee.totalDue - fee.lateFine - fee.paidAmount)
        .clamp(0.0, double.infinity);
    final fine = _computeLateFine(
        fee.dueDate, structure.finePerDay, remainingExcludingFine);
    if (fine == fee.lateFine) return fee;
    return fee.copyWith(lateFine: fine, updatedAt: DateTime.now());
  }

  Future<MonthlyFeeModel?> getMonthlyFee(
      String studentId,
      String month,
      ) async {
    final db = await database;
    final rows = await db.query(
      'monthly_fees',
      where: 'studentId = ? AND month = ?',
      whereArgs: [studentId, month],
      limit: 1,
    );
    if (rows.isEmpty) return null;
    return _monthlyFeeFromRow(rows.first);
  }

  Future<List<MonthlyFeeModel>> getMonthlyFees(String studentId) async {
    final db = await database;
    final rows = await db.query(
      'monthly_fees',
      where: 'studentId = ?',
      whereArgs: [studentId],
      orderBy: 'month DESC',
    );
    return rows.map(_monthlyFeeFromRow).toList();
  }

  Future<void> _saveMonthlyFeeRow(MonthlyFeeModel fee) async {
    final db = await database;
    // MonthlyFeeModel.toMap() also includes computed/denormalized fields
    // (additionalTotal, totalDue, remaining, status) — those exist so the
    // Firestore document is self-describing for other consumers (e.g. a
    // web dashboard) without them needing to reimplement the Dart getters.
    // SQLite's monthly_fees table only stores the raw source columns, so
    // strip the computed ones before inserting or SQLite throws "table
    // monthly_fees has no column named additionalTotal".
    final map = fee.toMap()
      ..remove('additionalTotal')
      ..remove('totalDue')
      ..remove('remaining')
      ..remove('status');
    await db.insert('monthly_fees', map,
        conflictAlgorithm: ConflictAlgorithm.replace);
  }

  /// After a payment/fee update, carry the new remaining amount
  /// into the next already-created month's Previous Due, then continue
  /// through the existing chain.
  Future<void> _propagatePreviousDueForward(
      String studentId,
      String fromMonth,
      ) async {
    var previousMonth = fromMonth;
    var previous = await getMonthlyFee(studentId, previousMonth);

    if (previous == null) return;

    while (true) {
      final nextMonth = _nextMonthKey(previousMonth);
      final next = await getMonthlyFee(studentId, nextMonth);

      if (next == null) break;

      final updatedNext = next.copyWith(
        previousDue: previous?.remaining ?? 0,
        updatedAt: DateTime.now(),
      );

      await _saveMonthlyFeeRow(updatedNext);

      previousMonth = nextMonth;
      previous = updatedNext;
    }
  }

  Future<MonthlyFeeModel> saveMonthlyFeeStructure({
    required String studentId,
    required String month,
    required double tuitionFee,
    required List<FeeLineItem> additionalFees,
    DateTime? dueDate,
    String? remarks,
  }) async {
    final existing = await getMonthlyFee(studentId, month);
    final previous = await getMonthlyFee(studentId, _previousMonthKey(month));
    final now = DateTime.now();

    double amount(String key) => additionalFees
        .where((e) => e.key == key)
        .fold<double>(0, (sum, e) => sum + e.amount);

    final fee = MonthlyFeeModel(
      id: existing?.id ?? const Uuid().v4(),
      studentId: studentId,
      month: month,
      admissionFee: amount('admissionFee'),
      tuitionFee: tuitionFee,
      examinationFee: amount('examinationFee'),
      previousDue: existing?.previousDue ?? (previous?.remaining ?? 0),
      gameFee: amount('gameFee'),
      reAdmissionFee: amount('reAdmissionFee'),
      developmentFee: amount('developmentFee'),
      schoolIdFee: amount('schoolIdFee'),
      tieBagBeltFee: amount('tieBagBeltFee'),
      backDues: amount('backDues'),
      transportFee: amount('transportFee'),
      otherFee: amount('otherFee'),
      paidAmount: existing?.paidAmount ?? 0,
      lateFine: existing?.lateFine ?? 0,
      dueDate: dueDate ?? existing?.dueDate,
      lastPaymentDate: existing?.lastPaymentDate,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      remarks: remarks ?? existing?.remarks,
    );
    await _saveMonthlyFeeRow(fee);
    await _propagatePreviousDueForward(studentId, month);
    await refreshLegacyFeeAggregate(studentId);
    return fee;
  }

  /// Saves an already-built monthly fee record (for example when only the
  /// due date or another field is changed from the UI).
  Future<void> saveMonthlyFee(MonthlyFeeModel fee) async {
    await _saveMonthlyFeeRow(fee);
    await _propagatePreviousDueForward(fee.studentId, fee.month);
    await refreshLegacyFeeAggregate(fee.studentId);
  }

  Future<List<MonthlyFeeModel>> generateMissingMonthlyFees({
    required String studentId,
    required String startMonth,
    required String endMonth,
    required double monthlyFee,
  }) async {
    final created = <MonthlyFeeModel>[];
    var month = startMonth;
    while (true) {
      var fee = await getMonthlyFee(studentId, month);
      if (fee == null) {
        final previous = await getMonthlyFee(studentId, _previousMonthKey(month));
        // FIXED: Added missing named parameters dueDate, month, studentId
        fee = MonthlyFeeModel(
          id: const Uuid().v4(),
          studentId: studentId,
          month: month,
          tuitionFee: monthlyFee,
          previousDue: previous?.remaining ?? 0,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
          dueDate: null, // Added
          admissionFee: 0,
          examinationFee: 0,
          gameFee: 0,
          reAdmissionFee: 0,
          developmentFee: 0,
          schoolIdFee: 0,
          tieBagBeltFee: 0,
          backDues: 0,
          transportFee: 0,
          otherFee: 0,
          paidAmount: 0,
          lastPaymentDate: null,
          remarks: null,
        );
        await _saveMonthlyFeeRow(fee);
        created.add(fee);
      }
      if (month == endMonth) break;
      month = _nextMonthKey(month);
    }
    await refreshLegacyFeeAggregate(studentId);
    return created;
  }

  Future<MonthlyFeeModel> addMonthlyFeePayment({
    required String studentId,
    required String month,
    required double amount,
    required String paymentMode,
    String? remarks,
  }) async {
    if (amount <= 0) throw Exception('Payment amount must be greater than zero.');
    final fee = await getMonthlyFee(studentId, month);
    if (fee == null) throw Exception('Monthly fee record not found.');
    if (amount > fee.remaining) {
      throw Exception('Payment cannot exceed remaining fee ₹${fee.remaining.toStringAsFixed(2)}.');
    }
    final now = DateTime.now();
    final receiptNumber = await generateReceiptNumber();
    final updated = fee.copyWith(
      paidAmount: fee.paidAmount + amount,
      lastPaymentDate: now, updatedAt: now, remarks: remarks ?? fee.remarks,
    );
    await _saveMonthlyFeeRow(updated);
    await _propagatePreviousDueForward(studentId, month);
    await dbInsertMonthlyPayment(
      studentId: studentId, amount: amount, paymentDate: now,
      paymentMode: paymentMode, remarks: remarks ?? 'Monthly fee: $month',
      receiptNumber: receiptNumber, feeMonth: month,
    );
    await refreshLegacyFeeAggregate(studentId);
    return updated;
  }

  Future<MonthlyFeeModel> ensureMonthlyFee({
    required String studentId,
    required String month,
    double tuitionFee = 0,
    double monthlyFee = 0,
    double admissionFee = 0,
    double examinationFee = 0,
    double gameFee = 0,
    double reAdmissionFee = 0,
    double developmentFee = 0,
    double schoolIdFee = 0,
    double tieBagBeltFee = 0,
    double backDues = 0,
    double transportFee = 0,
    double otherFee = 0,
    DateTime? dueDate,
    String? remarks,
  }) async {
    final structure = await getFeeStructure(studentId);

    final existing = await getMonthlyFee(studentId, month);
    if (existing != null) {
      // Fine keeps accruing day by day even on an already-created month,
      // so refresh it every time the month is loaded (e.g. screen reopened
      // a few days later) rather than only at creation time.
      final refreshed = _withRecalculatedLateFine(existing, structure);
      if (refreshed.lateFine != existing.lateFine) {
        await _saveMonthlyFeeRow(refreshed);
        await refreshLegacyFeeAggregate(studentId);
        return refreshed;
      }
      return existing;
    }

    final previous = await getMonthlyFee(studentId, _previousMonthKey(month));
    final now = DateTime.now();
    // "Set Monthly Amount" behaviour: when creating a brand-new month with
    // no explicit tuition/monthly fee passed in, prefer the student's Fee
    // Structure (if one is set), else fall back to whatever the PREVIOUS
    // month's tuition fee was, so the amount stays the same every month
    // automatically until the Principal changes it — instead of silently
    // resetting to 0 and forcing a manual re-entry each month.
    final effectiveTuition = tuitionFee != 0
        ? tuitionFee
        : (monthlyFee != 0
        ? monthlyFee
        : (structure?.tuitionFee ?? previous?.tuitionFee ?? 0));
    final effectiveTransport =
    transportFee != 0 ? transportFee : (structure?.transportFee ?? 0);
    final effectiveGame = gameFee != 0 ? gameFee : (structure?.gameFee ?? 0);
    final effectiveDueDate =
        dueDate ?? _dueDateFromStructure(month, structure);
    var fee = MonthlyFeeModel(
      id: const Uuid().v4(),
      studentId: studentId,
      month: month,
      admissionFee: admissionFee,
      tuitionFee: effectiveTuition,
      examinationFee: examinationFee,
      previousDue: previous?.remaining ?? 0,
      gameFee: effectiveGame,
      reAdmissionFee: reAdmissionFee,
      developmentFee: developmentFee,
      schoolIdFee: schoolIdFee,
      tieBagBeltFee: tieBagBeltFee,
      backDues: backDues,
      transportFee: effectiveTransport,
      otherFee: otherFee,
      dueDate: effectiveDueDate,
      createdAt: now,
      updatedAt: now,
      remarks: remarks,
      paidAmount: 0,
      lastPaymentDate: null,
    );
    fee = _withRecalculatedLateFine(fee, structure);
    await _saveMonthlyFeeRow(fee);
    await refreshLegacyFeeAggregate(studentId);
    return fee;
  }

  Future<void> updateMonthlyFeeDueDate({
    required String studentId,
    required String month,
    required DateTime? dueDate,
  }) async {
    final fee = await getMonthlyFee(studentId, month);
    if (fee == null) return;

    final updated = fee.copyWith(
      dueDate: dueDate,
      updatedAt: DateTime.now(),
    );

    await _saveMonthlyFeeRow(updated);
    await _propagatePreviousDueForward(studentId, month);
    await refreshLegacyFeeAggregate(studentId);
  }

  Future<MonthlyFeeModel> addMonthlyPayment({
    required String studentId,
    required String month,
    required double amount,
    required String paymentMode,
    String? remarks,
  }) => addMonthlyFeePayment(
    studentId: studentId, month: month, amount: amount,
    paymentMode: paymentMode, remarks: remarks,
  );

  Future<double> getPaidBeforePayment(String studentId, String month, [String? paymentId, DateTime? paymentDate]) async {
    final db = await database;
    final rows = await db.query('payments', where: 'studentId = ? AND feeMonth = ?', whereArgs: [studentId, month]);
    var total = 0.0;
    for (final row in rows) {
      if (paymentId != null && row['id']?.toString() == paymentId) continue;
      final d = DateTime.tryParse(row['paymentDate']?.toString() ?? '');
      if (paymentDate != null && d != null && !d.isBefore(paymentDate)) continue;
      total += (row['amount'] as num?)?.toDouble() ?? 0;
    }
    return total;
  }

  Future<List<PaymentModel>> getMonthlyPaymentHistory(String studentId, String month) async {
    final db = await database;
    final rows = await db.query('payments', where: 'studentId = ? AND feeMonth = ?', whereArgs: [studentId, month], orderBy: 'paymentDate DESC');
    return rows.map(PaymentModel.fromMap).toList();
  }

  Future<List<PaymentModel>> getStudentPaymentHistory(
      String studentId,
      ) async {
    final db = await database;

    final rows = await db.query(
      'payments',
      where: 'studentId = ?',
      whereArgs: [studentId],
      orderBy: 'paymentDate DESC',
    );

    return rows
        .map((row) => PaymentModel.fromMap(row))
        .toList();
  }

  Future<void> dbInsertMonthlyPayment({
    required String studentId, required double amount, required DateTime paymentDate,
    required String paymentMode, required String remarks, required String receiptNumber,
    required String feeMonth,
  }) async {
    final db = await database;
    await db.insert('payments', {
      'id': const Uuid().v4(),
      'studentId': studentId,
      'amount': amount,
      'paymentDate': paymentDate.toIso8601String(),
      'paymentMode': paymentMode,
      'remarks': remarks,
      'receiptNumber': receiptNumber,
      'feeMonth': feeMonth,
    }, conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<void> upsertMonthlyFeeFromRemote(
      String studentId,
      Map<String, dynamic> data,
      ) async {
    final db = await database;

    final exists = await db.query(
      'students',
      where: 'id = ?',
      whereArgs: [studentId],
      limit: 1,
    );
    if (exists.isEmpty) return;

    final fee = MonthlyFeeModel.fromMap({
      ...data,
      'studentId': studentId,
    });

    await _saveMonthlyFeeRow(fee);
    await refreshLegacyFeeAggregate(studentId);
  }

  Future<void> refreshLegacyFeeAggregate(String studentId) async {
    final db = await database;
    final rows = await db.query(
      'monthly_fees',
      where: 'studentId = ?',
      whereArgs: [studentId],
    );

    double totalFees = 0;
    double paidFees = 0;
    DateTime? latestPayment;
    DateTime? latestDueDate;

    for (final row in rows) {
      final fee = _monthlyFeeFromRow(row);
      totalFees += fee.totalDue;
      paidFees += fee.paidAmount;

      if (fee.lastPaymentDate != null &&
          (latestPayment == null ||
              fee.lastPaymentDate!.isAfter(latestPayment))) {
        latestPayment = fee.lastPaymentDate;
      }

      if (fee.dueDate != null &&
          (latestDueDate == null ||
              fee.dueDate!.isAfter(latestDueDate))) {
        latestDueDate = fee.dueDate;
      }
    }

    await db.insert(
      'fees',
      {
        'studentId': studentId,
        'totalFees': totalFees,
        'paidFees': paidFees,
        'dueDate': latestDueDate?.toIso8601String(),
        'lastPaidDate': latestPayment?.toIso8601String(),
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  // ─── ATTENDANCE CRUD ──────────────────────────────────────────────────────

  /// Upsert attendance — if record for same student+date exists, update it.
  /// This prevents duplicate counts every time attendance is re-saved.
  Future<void> markAttendance(AttendanceModel attendance) async {
    if (kIsWeb) {
      await FirestoreService.instance.syncAttendance(attendance);
      return;
    }
    final db = await database;
    final dateStr = attendance.date.toIso8601String().substring(0, 10);
    // Check if record already exists for this student on this date
    final existing = await db.query(
      'attendance',
      where: "studentId = ? AND date LIKE ?",
      whereArgs: [attendance.studentId, '$dateStr%'],
    );
    if (existing.isNotEmpty) {
      // UPDATE existing record's status
      await db.update(
        'attendance',
        {'status': attendance.status},
        where: "studentId = ? AND date LIKE ?",
        whereArgs: [attendance.studentId, '$dateStr%'],
      );
    } else {
      // INSERT new record
      await db.insert('attendance', attendance.toMap());
    }
  }

  /// Imports a historical attendance SUMMARY from Excel/PDF (total/present/
  /// absent/leave counts) as synthetic per-day records, so the existing
  /// COUNT/SUM-based getAttendanceSummary() shows the same numbers the file
  /// contained. Records are dated on distinct days going backwards from
  /// YESTERDAY — today is deliberately never touched, so an import can never
  /// mark a student Absent/Present for today; "today" stays "Not Marked"
  /// until someone actually takes attendance.
  ///
  /// Any existing imported/real attendance rows for this student are left
  /// alone except where they'd collide with a synthetic date — the UNIQUE
  /// (studentId, date) constraint plus ConflictAlgorithm.replace keeps this
  /// safe to re-run.
  Future<void> importAttendanceSummary(
      String studentId, {
        required int total,
        required int present,
        required int absent,
        required int leave,
      }) async {
    if (total <= 0) return;
    if (kIsWeb) return;
    final db = await database;
    // FIXED: Changed 'final' to 'const' for constant value
    const uuid = Uuid();

    // Build a status list of exactly `total` entries matching the requested
    // present/absent/leave split (clamped so it never exceeds `total`).
    final p = present.clamp(0, total);
    final remaining1 = total - p;
    final a = absent.clamp(0, remaining1);
    final remaining2 = remaining1 - a;
    final l = leave.clamp(0, remaining2);
    // Any leftover (e.g. counts didn't add up exactly) is filled as present
    // so the total always matches what was imported.
    final leftover = total - p - a - l;

    final statuses = <String>[
      ...List.filled(p + leftover, 'present'),
      ...List.filled(a, 'absent'),
      ...List.filled(l, 'leave'),
    ];

    final batch = db.batch();
    var dayOffset = 1; // start from yesterday, never today
    for (final status in statuses) {
      final date = DateTime.now().subtract(Duration(days: dayOffset));
      dayOffset++;
      batch.insert(
        'attendance',
        {
          'id': uuid.v4(),
          'studentId': studentId,
          'date': date.toIso8601String(),
          'status': status,
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    }
    await batch.commit(noResult: true);
  }

  Future<List<AttendanceModel>> getAttendanceByDate(DateTime date) async {
    if (kIsWeb) return FirestoreService.instance.fetchAttendanceByDate(date);
    final db = await database;
    final dateStr = date.toIso8601String().substring(0, 10);
    final maps = await db.query('attendance', where: "date LIKE ?", whereArgs: ['$dateStr%']);
    return maps.map(AttendanceModel.fromMap).toList();
  }

  Future<List<AttendanceModel>> getAttendanceByStudentId(String studentId) async {
    if (kIsWeb) {
      final list = await getAttendanceByDate(DateTime.now());
      return list.where((a) => a.studentId == studentId).toList();
    }
    final db = await database;
    final maps = await db.query('attendance',
        where: 'studentId = ?', whereArgs: [studentId], orderBy: 'date DESC');
    return maps.map(AttendanceModel.fromMap).toList();
  }

  Future<Map<String, int>> getAttendanceSummary(String studentId) async {
    final map = await getAllAttendanceSummaries();
    return map[studentId] ?? {'total': 0, 'present': 0, 'absent': 0, 'leave': 0};
  }

  /// Batch-load attendance summaries keyed by student ID.
  Future<Map<String, Map<String, int>>> getAllAttendanceSummaries() async {
    if (kIsWeb) return FirestoreService.instance.fetchAllAttendanceSummaries();
    final db = await database;
    final rows = await db.rawQuery('''
      SELECT studentId,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN status = 'leave' THEN 1 ELSE 0 END) as leaveCount
      FROM attendance
      GROUP BY studentId
    ''');

    final result = <String, Map<String, int>>{};
    for (final row in rows) {
      final studentId = row['studentId'] as String? ?? '';
      if (studentId.isEmpty) continue;
      final total = (row['total'] as num?)?.toInt() ?? 0;
      final present = (row['present'] as num?)?.toInt() ?? 0;
      final absent = (row['absent'] as num?)?.toInt() ?? 0;
      final leave = (row['leaveCount'] as num?)?.toInt() ?? 0;
      result[studentId] = {
        'total': total,
        'present': present,
        'absent': absent,
        'leave': leave > 0 ? leave : (total - present - absent).clamp(0, 999999),
      };
    }
    return result;
  }

  /// Returns count of students with 'present' status on today's date.
  /// Calculated dynamically — never cumulative.
  Future<int> getTodayPresentCount() async {
    if (kIsWeb) {
      final records = await getAttendanceByDate(DateTime.now());
      return records.where((r) => r.status == 'present').map((r) => r.studentId).toSet().length;
    }
    final db = await database;
    final today = DateTime.now().toIso8601String().substring(0, 10);
    final result = await db.rawQuery(
        "SELECT COUNT(DISTINCT studentId) as count FROM attendance WHERE date LIKE ? AND status = 'present'",
        ['$today%']);
    return (result.first['count'] as int?) ?? 0;
  }

  /// Returns today's full attendance summary {present, absent, leave}.
  Future<Map<String, int>> getTodayAttendanceSummary() async {
    if (kIsWeb) {
      final records = await getAttendanceByDate(DateTime.now());
      final summary = {'present': 0, 'absent': 0, 'leave': 0};
      final seen = <String>{};
      for (final r in records) {
        if (!seen.add(r.studentId)) continue;
        if (summary.containsKey(r.status)) {
          summary[r.status] = (summary[r.status] ?? 0) + 1;
        }
      }
      return summary;
    }
    final db = await database;
    final today = DateTime.now().toIso8601String().substring(0, 10);
    final result = await db.rawQuery(
        "SELECT status, COUNT(DISTINCT studentId) as count FROM attendance WHERE date LIKE ? GROUP BY status",
        ['$today%']);
    final Map<String, int> summary = {'present': 0, 'absent': 0, 'leave': 0};
    for (final row in result) {
      final status = row['status'] as String;
      summary[status] = (row['count'] as int?) ?? 0;
    }
    return summary;
  }

  // ─── FILTERED STAT QUERIES (class/section scoped) ─────────────────────────
  //
  // These are used by dashboardStatsProvider when a Teacher has selected a
  // class and section. They JOIN the students table so every count/sum only
  // covers students in the specified class+section. Existing methods above
  // remain untouched — Principal still uses those whole-school versions.

  /// Build a WHERE clause + args list for class/section filtering on `students`.
  /// Returns an empty string and empty list when no filter is needed.
  (String, List<dynamic>) _classFilter({String? className, String? section}) {
    final conditions = <String>[];
    final args = <dynamic>[];
    if (className != null && className.isNotEmpty) {
      conditions.add("students.className = ?");
      args.add(className);
    }
    if (section != null && section.isNotEmpty) {
      conditions.add("students.section = ?");
      args.add(section);
    }
    if (conditions.isEmpty) return ('', []);
    return ('AND ${conditions.join(' AND ')}', args);
  }

  /// Total student count for a specific class and/or section.
  Future<int> getStudentCountFiltered({String? className, String? section}) async {
    if (kIsWeb) {
      final list = await getStudentsByFilter(className: className, section: section);
      return list.length;
    }
    final db = await database;
    final (filterClause, filterArgs) = _classFilter(className: className, section: section);
    final result = await db.rawQuery(
      'SELECT COUNT(*) as count FROM students WHERE 1=1 ${filterClause.replaceAll('AND students.', 'AND ')}',
      filterArgs,
    );
    return (result.first['count'] as int?) ?? 0;
  }

  /// Today's attendance summary {present, absent, leave} for a specific class/section.
  /// JOINs attendance with students to apply class/section filter.
  Future<Map<String, int>> getTodayAttendanceSummaryFiltered({
    String? className,
    String? section,
  }) async {
    if (kIsWeb) {
      final students = await getStudentsByFilter(className: className, section: section);
      final studentIds = students.map((s) => s.id).toSet();
      final records = await getAttendanceByDate(DateTime.now());
      final summary = {'present': 0, 'absent': 0, 'leave': 0};
      for (final r in records) {
        if (studentIds.contains(r.studentId) && summary.containsKey(r.status)) {
          summary[r.status] = (summary[r.status] ?? 0) + 1;
        }
      }
      return summary;
    }
    final db = await database;
    final today = DateTime.now().toIso8601String().substring(0, 10);
    final (filterClause, filterArgs) = _classFilter(className: className, section: section);
    final result = await db.rawQuery(
      '''
      SELECT a.status, COUNT(DISTINCT a.studentId) as count
      FROM attendance a
      INNER JOIN students ON students.id = a.studentId
      WHERE a.date LIKE ? $filterClause
      GROUP BY a.status
      ''',
      ['$today%', ...filterArgs],
    );
    final Map<String, int> summary = {'present': 0, 'absent': 0, 'leave': 0};
    for (final row in result) {
      final status = row['status'] as String;
      summary[status] = (row['count'] as int?) ?? 0;
    }
    return summary;
  }

  /// Total pending fees for students in a specific class/section.
  Future<double> getTotalPendingFeesFiltered({String? className, String? section}) async {
    if (kIsWeb) return 0.0;
    final db = await database;
    final (filterClause, filterArgs) = _classFilter(className: className, section: section);
    final result = await db.rawQuery(
      '''
      SELECT SUM(f.totalFees - f.paidFees) as pending
      FROM fees f
      INNER JOIN students ON students.id = f.studentId
      WHERE f.totalFees > f.paidFees $filterClause
      ''',
      filterArgs,
    );
    return (result.first['pending'] as num?)?.toDouble() ?? 0;
  }

  /// Total collected fees for students in a specific class/section.
  Future<double> getTotalCollectedFiltered({String? className, String? section}) async {
    if (kIsWeb) return 0.0;
    final db = await database;
    final (filterClause, filterArgs) = _classFilter(className: className, section: section);
    final result = await db.rawQuery(
      '''
      SELECT SUM(p.amount) as total
      FROM payments p
      INNER JOIN students ON students.id = p.studentId
      WHERE 1=1 $filterClause
      ''',
      filterArgs,
    );
    return (result.first['total'] as num?)?.toDouble() ?? 0;
  }

  /// Overdue fee count for students in a specific class/section.
  Future<int> getOverdueFeeCountFiltered({String? className, String? section}) async {
    if (kIsWeb) return 0;
    final db = await database;
    final today = DateTime.now().toIso8601String().substring(0, 10);
    final (filterClause, filterArgs) = _classFilter(className: className, section: section);
    final result = await db.rawQuery(
      '''
      SELECT COUNT(*) as count
      FROM fees f
      INNER JOIN students ON students.id = f.studentId
      WHERE f.dueDate < ? AND f.totalFees > f.paidFees AND f.dueDate IS NOT NULL
      $filterClause
      ''',
      [today, ...filterArgs],
    );
    return (result.first['count'] as int?) ?? 0;
  }

  // ─── RESULT CRUD ──────────────────────────────────────────────────────────

  Future<void> insertResult(ResultModel result) async {
    if (kIsWeb) {
      await FirestoreService.instance.syncResult(result);
      return;
    }
    final db = await database;
    await db.insert('results', result.toMap());
    for (final subject in result.subjects) {
      await db.insert('subject_results', {
        'resultId': result.id,
        'subjectName': subject.subjectName,
        'marks': subject.marks,
        'totalMarks': subject.totalMarks,
      });
    }
  }

  Future<List<ResultModel>> getResultsByStudentId(String studentId) async {
    if (kIsWeb) return [];
    final db = await database;
    final results = await db.query('results',
        where: 'studentId = ?', whereArgs: [studentId], orderBy: 'createdAt DESC');
    List<ResultModel> models = [];
    for (final result in results) {
      final subjects = await db.query('subject_results', where: 'resultId = ?', whereArgs: [result['id']]);
      models.add(ResultModel.fromMap(result, subjects.map(SubjectResult.fromMap).toList()));
    }
    return models;
  }

  Future<void> deleteResult(String id) async {
    if (kIsWeb) {
      await FirestoreService.instance.deleteResultRemote(id);
      return;
    }
    final db = await database;
    await db.delete('results', where: 'id = ?', whereArgs: [id]);
    await db.delete('subject_results', where: 'resultId = ?', whereArgs: [id]);
  }

  // ─── SETTINGS ─────────────────────────────────────────────────────────────

  Future<SettingsModel> getSettings() async {
    if (kIsWeb) {
      final remote = await FirestoreService.instance.fetchSettings();
      if (remote != null) return remote;
      return SettingsModel.defaultSettings();
    }
    final db = await database;
    final maps = await db.query('settings', where: 'id = 1');
    if (maps.isEmpty) return SettingsModel.defaultSettings();
    return SettingsModel.fromMap(maps.first);
  }

  Future<void> saveSettings(SettingsModel settings) async {
    if (kIsWeb) {
      await FirestoreService.instance.syncSettings(settings);
      return;
    }
    final db = await database;
    final map = settings.toMap();
    map['id'] = 1;
    await db.insert('settings', map, conflictAlgorithm: ConflictAlgorithm.replace);
  }

  // ─── BACKUP & RESTORE ─────────────────────────────────────────────────────

  Future<String> getDbPath() async {
    final dbPath = await getDatabasesPath();
    return join(dbPath, 'school_app.db');
  }

  Future<String> exportDatabase() async {
    final srcPath = await getDbPath();
    final dir = await getExternalStorageDirectory();
    final destDir = dir?.path ?? (await getApplicationDocumentsDirectory()).path;
    final timestamp = DateTime.now().toIso8601String().replaceAll(':', '-').substring(0, 16);
    final destPath = '$destDir/school_backup_$timestamp.db';
    await File(srcPath).copy(destPath);
    return destPath;
  }

  Future<void> importDatabase(String backupPath) async {
    await _db?.close();
    _db = null;
    final destPath = await getDbPath();
    await File(backupPath).copy(destPath);
    _db = await _openDatabase();
  }
}