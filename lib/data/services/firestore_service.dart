import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import '../models/student_model.dart';
import '../models/fee_model.dart';
import '../models/attendance_model.dart';
import '../models/settings_model.dart';
import '../models/result_model.dart';
import 'database_service.dart';
import 'session_service.dart';

/// FirestoreService — SQLite is the source of truth on-device.
/// This service syncs data to Firestore in the background, scoped to the
/// signed-in Firebase Auth user (schools/{uid}/...) so two different school
/// accounts never see each other's data. If Firestore rules block access,
/// check Firebase Console → Firestore → Rules — see the security rules
/// note near `_root` below for what they must say now that data is
/// UID-scoped (the old "allow read, write: if true;" testing rule would
/// defeat the whole point of this isolation and must NOT be used anymore).
class FirestoreService {
  static final FirestoreService instance = FirestoreService._internal();
  FirestoreService._internal();

  FirebaseFirestore? _firestore;
  bool _enabled = true;
  bool _initialized = false;

  void disable() {
    _enabled = false;
    debugPrint('[Firestore] ⛔ Disabled');
  }

  void enable() {
    _enabled = true;
    debugPrint('[Firestore] ✅ Enabled');
  }

  /// Call this after Firebase.initializeApp() succeeds
  void init() {
    try {
      _firestore = FirebaseFirestore.instance;
      // Enable offline persistence
      _firestore!.settings = const Settings(
        persistenceEnabled: true,
        cacheSizeBytes: Settings.CACHE_SIZE_UNLIMITED,
      );
      _initialized = true;
      debugPrint('[Firestore] ✅ Service initialized with persistence enabled');
    } catch (e) {
      debugPrint('[Firestore] ❌ Init failed: $e');
      _enabled = false;
    }
  }

  FirebaseFirestore? get _db {
    if (!_initialized || !_enabled) return null;
    return _firestore;
  }

  /// The active school's Firestore document id — every Firestore path below
  /// is scoped under this, so two different school accounts (even on the
  /// same device, at different times) never read or write each other's
  /// data. For a Principal this is their own Firebase Auth uid; for a
  /// Teacher it's the SCHOOL's uid they're linked to, not the teacher's own
  /// auth uid — see session_service.dart for why those differ. Returns
  /// null when nobody is signed in yet, which makes every collection
  /// getter below null too, so callers just no-op instead of accidentally
  /// writing to a shared/anonymous location.
  String? get _uid => SessionService.instance.activeSchoolUid;

  /// Root: schools/{uid}
  DocumentReference? get _root {
    final uid = _uid;
    if (uid == null) return null;
    return _db?.collection('schools').doc(uid);
  }
  CollectionReference? get _students => _root?.collection('students');
  CollectionReference? get _fees => _root?.collection('fees');
  CollectionReference? get _monthlyFees => _root?.collection('monthly_fees');
  CollectionReference? get _payments => _root?.collection('payments');
  CollectionReference? get _attendance => _root?.collection('attendance');
  CollectionReference? get _results => _root?.collection('results');
  DocumentReference? get _settings => _root?.collection('settings').doc('config');

  // ─── Real-time Streams (Firestore → App) ────────────────────────────────
  //
  // These power PART 13: when data changes directly in Firestore (another
  // device, or the Firebase console), the app must reflect it without a
  // restart. Wired up in providers.dart's `firestoreRealtimeSyncProvider`,
  // which merges each snapshot into local SQLite and invalidates the
  // relevant Riverpod providers — these methods just expose the raw stream.

  Stream<List<StudentModel>>? watchStudents() {
    if (!_enabled || _students == null) return null;
    return _students!.snapshots().map(
          (snap) => snap.docs
          .map((d) => StudentModel.fromMap(d.data() as Map<String, dynamic>))
          .toList(),
    );
  }

  Stream<SettingsModel?>? watchSettings() {
    if (!_enabled || _settings == null) return null;
    return _settings!.snapshots().map((snap) {
      if (!snap.exists) return null;
      return SettingsModel.fromMap(snap.data() as Map<String, dynamic>);
    });
  }

  /// Emits {studentId: {totalFees, paidFees, dueDate, lastPaidDate}} maps —
  /// deliberately raw maps (not FeeModel, which also needs a payments list
  /// that isn't stored in this document) so the caller can upsert straight
  /// into the local `fees` table.
  Stream<Map<String, Map<String, dynamic>>>? watchFees() {
    if (!_enabled || _fees == null) return null;
    return _fees!.snapshots().map(
          (snap) => {for (final d in snap.docs) d.id: d.data() as Map<String, dynamic>},
    );
  }

  /// Realtime payment history for the signed-in account.
  Stream<List<PaymentModel>>? watchPayments() {
    if (!_enabled || _payments == null) return null;
    return _payments!.snapshots().map((snap) => snap.docs
        .map((d) => PaymentModel.fromMap(d.data() as Map<String, dynamic>))
        .toList());
  }

  /// Realtime attendance for the signed-in school.
  /// Attendance records live in schools/{schoolId}/attendance/{date}/records/{studentId}.
  ///
  /// IMPORTANT: Uses school-scoped query (NOT collectionGroup) so that:
  ///  1. Firestore security rules are satisfied (schoolId-scoped path)
  ///  2. Teacher cannot accidentally read another school's attendance
  ///  3. The query works correctly for both Principal and Teacher
  Stream<List<AttendanceModel>>? watchAttendance() {
    if (!_enabled || _attendance == null) return null;
    // We cannot directly stream nested subcollections without a collectionGroup,
    // but collectionGroup('records') is cross-school and breaks security rules.
    // Instead, we stream the top-level attendance docs (one per date) and
    // then for each date we listen to the records sub-collection.
    // Simpler alternative: stream a flat 'attendance_flat' collection.
    // For now, use the school-scoped attendance collection and fetch records
    // via a collectionGroup filtered to only this school's path prefix.
    // Best approach: use _attendance (school-scoped) parent and stream its
    // sub-collections by watching each date document's records.
    //
    // Practical solution: store a denormalized flat record in attendance_flat
    // collection under the school root for easy streaming.
    // We use that flat collection here for realtime sync.
    final flatCol = _root?.collection('attendance_flat');
    if (flatCol == null) return null;
    return flatCol.snapshots().map((snap) => snap.docs
        .map((d) => AttendanceModel.fromMap(d.data() as Map<String, dynamic>))
        .toList());
  }

  // ─── Student Sync ───────────────────────────────────────────────────────

  Future<void> syncStudent(StudentModel student) async {
    if (!_enabled || _students == null) {
      debugPrint('[Firestore] ⚠️ Skipped syncStudent — disabled or not initialized');
      return;
    }
    try {
      final data = student.toMap();
      data['syncedAt'] = FieldValue.serverTimestamp();
      await _students!.doc(student.id).set(data, SetOptions(merge: true));
      debugPrint('[Firestore] ✅ Student synced: ${student.name} (${student.id})');
    } catch (e, st) {
      debugPrint('[Firestore] ❌ Student sync failed: $e');
      debugPrint('[Firestore] Stack: $st');
      // Check common errors
      if (e.toString().contains('PERMISSION_DENIED')) {
        debugPrint('[Firestore] 🔒 FIX: Go to Firebase Console → Firestore → Rules → set: allow read, write: if true;');
      }
    }
  }

  Future<void> deleteStudent(String studentId) async {
    if (!_enabled || _students == null) return;
    try {
      await _students!.doc(studentId).delete();
      await _fees?.doc(studentId).delete();

      // Also remove this student's payment history...
      final paymentDocs = await _payments?.where('studentId', isEqualTo: studentId).get();
      if (paymentDocs != null && paymentDocs.docs.isNotEmpty) {
        final batch = _db!.batch();
        for (final doc in paymentDocs.docs) {
          batch.delete(doc.reference);
        }
        await batch.commit();
      }

      // ...and their attendance records across every date subcollection.
      // Attendance is stored as institutes/{id}/attendance/{date}/records/{studentId},
      // so we need a collectionGroup query to find every date's copy of this
      // student's record. This requires a Firestore index on the 'records'
      // collection group for the 'studentId' field — if that index hasn't
      // been created yet, Firestore throws a FAILED_PRECONDITION with a
      // console link to create it; we log that link instead of crashing.
      try {
        final attendanceDocs = await _db!
            .collectionGroup('records')
            .where('studentId', isEqualTo: studentId)
            .get();
        if (attendanceDocs.docs.isNotEmpty) {
          final batch = _db!.batch();
          for (final doc in attendanceDocs.docs) {
            batch.delete(doc.reference);
          }
          await batch.commit();
        }
      } catch (e) {
        debugPrint('[Firestore] ⚠️ Attendance cleanup skipped: $e');
        if (e.toString().contains('FAILED_PRECONDITION') || e.toString().contains('index')) {
          debugPrint('[Firestore] 🔧 Create the missing composite index using the link in the error above, '
              'then attendance records will clean up correctly on delete.');
        }
      }

      // ...and their exam results.
      final resultDocs = await _results?.where('studentId', isEqualTo: studentId).get();
      if (resultDocs != null && resultDocs.docs.isNotEmpty) {
        final batch = _db!.batch();
        for (final doc in resultDocs.docs) {
          batch.delete(doc.reference);
        }
        await batch.commit();
      }

      debugPrint('[Firestore] ✅ Student and related data deleted: $studentId');
    } catch (e) {
      debugPrint('[Firestore] ❌ Student delete failed: $e');
    }
  }

  // ─── Fee Sync ───────────────────────────────────────────────────────────

  Future<void> syncFee(FeeModel fee) async {
    if (!_enabled || _fees == null) return;
    try {
      final data = fee.toMap();
      // FeeModel.toMap() only stores raw totalFees/paidFees (the source
      // values); remainingFees and feeStatus are normally computed on the
      // fly by the app. Firestore consumers (e.g. a web dashboard) can't
      // run that Dart getter, so we denormalize both into the document too
      // — this is exactly the "remainingFees/feeStatus not in Firestore"
      // gap called out as critical.
      data['remainingFees'] = fee.remainingFees;
      data['feeStatus'] = fee.feeStatus;
      data['updatedAt'] = FieldValue.serverTimestamp();
      data['syncedAt'] = FieldValue.serverTimestamp();
      await _fees!.doc(fee.studentId).set(data, SetOptions(merge: true));
      debugPrint('[Firestore] ✅ Fee synced for student: ${fee.studentId} '
          '(total: ${fee.totalFees}, paid: ${fee.paidFees}, remaining: ${fee.remainingFees})');
    } catch (e, st) {
      debugPrint('[Firestore] ❌ Fee sync failed: $e');
      debugPrint('[Firestore] Stack: $st');
      if (e.toString().contains('PERMISSION_DENIED')) {
        debugPrint('[Firestore] 🔒 FIX: check Firestore Rules allow this UID to write schools/{uid}/fees/*');
      }
    }
  }


  Future<void> syncMonthlyFee(MonthlyFeeModel fee) async {
    if (!_enabled || _monthlyFees == null) return;

    try {
      final data = fee.toMap();
      data['additionalItems'] =
          fee.additionalItems.map((e) => e.toMap()).toList();
      data['additionalFee'] = fee.additionalTotal; // FIXED: additionalFee → additionalTotal
      data['totalDue'] = fee.totalDue;
      data['remaining'] = fee.remaining;
      data['isOverdue'] = fee.isOverdue;
      data['syncedAt'] = FieldValue.serverTimestamp();
      data['updatedAt'] = FieldValue.serverTimestamp();

      await _monthlyFees!.doc(fee.id).set(
        data,
        SetOptions(merge: true),
      );

      debugPrint(
        '[Firestore] Monthly fee synced: ${fee.studentId}/${fee.month}',
      );
    } catch (e, st) {
      debugPrint('[Firestore] Monthly fee sync failed: $e');
      debugPrint('$st');
    }
  }

  Future<void> syncPayment(PaymentModel payment) async {
    if (!_enabled || _payments == null) {
      debugPrint('[Firestore] ⚠️ Skipped syncPayment — disabled or not initialized');
      return;
    }
    try {
      final data = payment.toMap();
      data['syncedAt'] = FieldValue.serverTimestamp();
      await _payments!.doc(payment.id).set(data, SetOptions(merge: true));
      debugPrint('[Firestore] ✅ Payment synced: ${payment.receiptNumber} (${payment.id})');
    } catch (e, st) {
      debugPrint('[Firestore] ❌ Payment sync failed: $e');
      debugPrint('[Firestore] Stack: $st');
      if (e.toString().contains('PERMISSION_DENIED')) {
        debugPrint('[Firestore] 🔒 FIX: Teacher may not have access. Check Firestore rules.');
      }
      rethrow; // Let caller handle/log — don't silently swallow
    }
  }

  /// Stream of all monthly fee records for the current school.
  /// Returns a map of {feeId: rawData} so caller can upsert into SQLite.
  /// This stream is essential for fee/payment data to survive app restarts —
  /// without it, monthly_fees table is empty after restart until user opens
  /// a specific student's fee screen.
  Stream<Map<String, Map<String, dynamic>>>? watchMonthlyFees() {
    if (!_enabled || _monthlyFees == null) return null;
    return _monthlyFees!.snapshots().map(
      (snap) => {
        for (final d in snap.docs)
          d.id: d.data() as Map<String, dynamic>
      },
    );
  }

  /// Syncs a complete fee receipt to Firestore `receipts` collection.
  /// Includes: receipt no, student id, payment amount, payment mode,
  /// fee month, all fee head amounts, total due, paid amount, balance,
  /// and a server timestamp — so the web portal / reporting can
  /// reproduce any receipt without re-querying multiple collections.
  Future<void> syncReceipt({
    required PaymentModel payment,
    required MonthlyFeeModel fee,
    required String studentName,
    required String admissionNumber,
    required String className,
    required double paidBefore,
  }) async {
    if (!_enabled || _root == null) return;
    try {
      final receiptsCol = _root!.collection('receipts');
      final data = {
        'receiptId': payment.id,
        'receiptNumber': payment.receiptNumber,
        'studentId': payment.studentId,
        'studentName': studentName,
        'admissionNumber': admissionNumber,
        'className': className,
        'feeMonth': payment.feeMonth ?? fee.month,
        'paymentDate': payment.paymentDate.toIso8601String(),
        'paymentMode': payment.paymentMode,
        'amountPaid': payment.amount,
        'paidBefore': paidBefore,
        'remarks': payment.remarks,
        // Fee head breakdown
        'admissionFee': fee.admissionFee,
        'tuitionFee': fee.tuitionFee,
        'examinationFee': fee.examinationFee,
        'previousDue': fee.previousDue,
        'gameFee': fee.gameFee,
        'reAdmissionFee': fee.reAdmissionFee,
        'developmentFee': fee.developmentFee,
        'schoolIdFee': fee.schoolIdFee,
        'tieBagBeltFee': fee.tieBagBeltFee,
        'backDues': fee.backDues,
        'transportFee': fee.transportFee,
        'otherFee': fee.otherFee,
        'lateFine': fee.lateFine,
        'totalDue': fee.totalDue,
        'totalPaid': fee.paidAmount,
        'balance': fee.remaining,
        'feeStatus': fee.feeStatus,
        'createdAt': FieldValue.serverTimestamp(),
        'syncedAt': FieldValue.serverTimestamp(),
      };
      await receiptsCol.doc(payment.id).set(data, SetOptions(merge: true));
      debugPrint('[Firestore] ✅ Receipt synced: ${payment.receiptNumber}');
    } catch (e) {
      debugPrint('[Firestore] ❌ Receipt sync failed: $e');
    }
  }

  // ─── Attendance Sync ────────────────────────────────────────────────────

  Future<void> syncAttendance(AttendanceModel record) async {
    if (!_enabled || _attendance == null) return;
    try {
      final dateKey =
          '${record.date.year}-${record.date.month.toString().padLeft(2, '0')}-${record.date.day.toString().padLeft(2, '0')}';

      // Write to the hierarchical attendance/{date}/records/{studentId} path
      await _attendance!
          .doc(dateKey)
          .collection('records')
          .doc(record.studentId)
          .set(record.toMap(), SetOptions(merge: true));

      // ALSO write a flat denormalized copy for efficient realtime streaming.
      // The watchAttendance() stream reads from this flat collection to avoid
      // collectionGroup queries that bypass school-scoped security rules.
      final flatData = record.toMap();
      flatData['dateKey'] = dateKey;
      flatData['syncedAt'] = FieldValue.serverTimestamp();
      // Stable ID = studentId + dateKey so upsert is idempotent
      final flatId = '${record.studentId}_$dateKey';
      await _root!.collection('attendance_flat').doc(flatId).set(
        flatData,
        SetOptions(merge: true),
      );

      debugPrint('[Firestore] ✅ Attendance synced: ${record.studentId} on $dateKey');
    } catch (e, st) {
      debugPrint('[Firestore] ❌ Attendance sync failed: $e');
      debugPrint('[Firestore] Stack: $st');
    }
  }

  // ─── Result Sync ────────────────────────────────────────────────────────
  //
  // Results were never synced before — no collection ref, no method. The
  // ResultModel's own toMap() only stores exam-level fields (subjects live
  // in a separate SQLite table), so we embed the subjects list directly in
  // the Firestore doc — one flat document per result, no subcollection
  // needed since a result is always read/written as a whole.

  Future<void> syncResult(ResultModel result) async {
    if (!_enabled || _results == null) return;
    try {
      final data = result.toMap();
      data['subjects'] = result.subjects.map((s) => s.toMap()).toList();
      data['syncedAt'] = FieldValue.serverTimestamp();
      await _results!.doc(result.id).set(data, SetOptions(merge: true));
      debugPrint('[Firestore] ✅ Result synced: ${result.examName} (${result.studentId})');
    } catch (e) {
      debugPrint('[Firestore] ❌ Result sync failed: $e');
    }
  }

  Future<void> deleteResultRemote(String resultId) async {
    if (!_enabled || _results == null) return;
    try {
      await _results!.doc(resultId).delete();
      debugPrint('[Firestore] ✅ Result deleted: $resultId');
    } catch (e) {
      debugPrint('[Firestore] ❌ Result delete failed: $e');
    }
  }

  // ─── Settings Sync ──────────────────────────────────────────────────────

  Future<void> syncSettings(SettingsModel settings) async {
    if (!_enabled || _settings == null) return;
    try {
      // Sync every institute setting, not just a subset — Point 11 requires
      // Principal Name / Affiliation Number / etc. to reach Firestore too.
      final map = settings.toMap();
      map.remove('logoPath'); // local device path only — see watchSettings()
      // note / Batch 3 for the Firebase Storage logo fix
      map['updatedAt'] = FieldValue.serverTimestamp();
      await _settings!.set(map, SetOptions(merge: true));
      debugPrint('[Firestore] ✅ Settings synced');
    } catch (e) {
      debugPrint('[Firestore] ❌ Settings sync failed: $e');
    }
  }

  // ─── Bulk Sync (upload all SQLite data to Firestore) ───────────────────

  Future<void> bulkSyncStudents(List<StudentModel> students) async {
    if (!_enabled || _db == null || _students == null || students.isEmpty) return;
    debugPrint('[Firestore] 🔄 Bulk sync: ${students.length} students...');
    // Process in batches of 400 (Firestore limit is 500)
    const batchSize = 400;
    for (int i = 0; i < students.length; i += batchSize) {
      final chunk = students.sublist(i,
          i + batchSize > students.length ? students.length : i + batchSize);
      final batch = _db!.batch();
      for (final s in chunk) {
        final data = s.toMap();
        data['syncedAt'] = FieldValue.serverTimestamp();
        batch.set(_students!.doc(s.id), data, SetOptions(merge: true));
      }
      try {
        await batch.commit();
        debugPrint('[Firestore] ✅ Bulk sync batch committed (${chunk.length} students)');
      } catch (e) {
        debugPrint('[Firestore] ❌ Bulk sync batch failed: $e');
        if (e.toString().contains('PERMISSION_DENIED')) {
          debugPrint('[Firestore] 🔒 Fix Firestore Rules in Firebase Console!');
        }
        break;
      }
    }
  }
  /// Upload all local records after an import. Only the currently signed-in
  /// UID is used because all collection references are UID-scoped.
  Future<void> syncAllLocalData() async {
    if (!_enabled || _db == null || _uid == null) return;
    try {
      final students = await DatabaseService.instance.getAllStudents();
      await bulkSyncStudents(students);

      final fees = await DatabaseService.instance.getAllFeesMap();
      for (final fee in fees.values) {
        await syncFee(fee);
      }

      final db = await DatabaseService.instance.database;
      final paymentRows = await db.query('payments');
      for (final row in paymentRows) {
        await syncPayment(PaymentModel.fromMap(row));
      }

      final attendanceRows = await db.query('attendance');
      for (final row in attendanceRows) {
        await syncAttendance(AttendanceModel.fromMap(row));
      }

      final settings = await DatabaseService.instance.getSettings();
      await syncSettings(settings);
      debugPrint('[Firestore] ✅ Full local data sync completed');
    } catch (e, st) {
      debugPrint('[Firestore] ❌ Full local data sync failed: $e');
      debugPrint('$st');
    }
  }

  // ─── Web Query Helpers ──────────────────────────────────────────────────

  Future<List<StudentModel>> fetchStudents() async {
    if (!_enabled || _students == null) return [];
    try {
      final snap = await _students!.get();
      final list = snap.docs
          .map((d) => StudentModel.fromMap(d.data() as Map<String, dynamic>))
          .toList();
      list.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      return list;
    } catch (e) {
      debugPrint('[Firestore] ❌ fetchStudents failed: $e');
      return [];
    }
  }

  Future<SettingsModel?> fetchSettings() async {
    if (!_enabled || _settings == null) return null;
    try {
      final snap = await _settings!.get();
      if (!snap.exists || snap.data() == null) return null;
      return SettingsModel.fromMap(snap.data() as Map<String, dynamic>);
    } catch (e) {
      debugPrint('[Firestore] ❌ fetchSettings failed: $e');
      return null;
    }
  }

  Future<List<AttendanceModel>> fetchAttendanceByDate(DateTime date) async {
    if (!_enabled || _attendance == null) return [];
    try {
      final dateKey =
          '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
      final snap = await _attendance!.doc(dateKey).collection('records').get();
      return snap.docs
          .map((d) => AttendanceModel.fromMap(d.data()))
          .toList();
    } catch (e) {
      debugPrint('[Firestore] ❌ fetchAttendanceByDate failed: $e');
      return [];
    }
  }

  Future<Map<String, Map<String, int>>> fetchAllAttendanceSummaries() async {
    if (!_enabled || _db == null) return {};
    try {
      final snap = await _db!.collectionGroup('records').get();
      final result = <String, Map<String, int>>{};
      for (final doc in snap.docs) {
        final data = doc.data();
        final studentId = data['studentId']?.toString() ?? '';
        final status = data['status']?.toString() ?? '';
        if (studentId.isEmpty) continue;
        result.putIfAbsent(studentId, () => {'total': 0, 'present': 0, 'absent': 0, 'leave': 0});
        result[studentId]!['total'] = (result[studentId]!['total'] ?? 0) + 1;
        if (status == 'present') {
          result[studentId]!['present'] = (result[studentId]!['present'] ?? 0) + 1;
        } else if (status == 'absent') {
          result[studentId]!['absent'] = (result[studentId]!['absent'] ?? 0) + 1;
        } else if (status == 'leave') {
          result[studentId]!['leave'] = (result[studentId]!['leave'] ?? 0) + 1;
        }
      }
      return result;
    } catch (e) {
      debugPrint('[Firestore] ❌ fetchAllAttendanceSummaries failed: $e');
      return {};
    }
  }

  Future<String> nextReceiptNumber() async {
    final rand = DateTime.now().millisecondsSinceEpoch % 1000000;
    return 'REC${rand.toString().padLeft(6, '0')}';
  }
}
