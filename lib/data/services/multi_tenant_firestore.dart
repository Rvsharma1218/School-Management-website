import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import '../models/student_model.dart';
import '../models/fee_model.dart';
import '../models/attendance_model.dart';
import '../models/settings_model.dart';

class MultiTenantFirestore {
  static final MultiTenantFirestore instance = MultiTenantFirestore._internal();
  MultiTenantFirestore._internal();

  FirebaseFirestore get _db => FirebaseFirestore.instance;

  String? get currentUid => FirebaseAuth.instance.currentUser?.uid;

  DocumentReference? get _schoolDoc {
    final uid = currentUid;
    if (uid == null) return null;
    return _db.collection('schools').doc(uid);
  }

  CollectionReference? get _students => _schoolDoc?.collection('students');
  CollectionReference? get _fees => _schoolDoc?.collection('fees');
  CollectionReference? get _payments => _schoolDoc?.collection('payments');
  CollectionReference? get _attendance => _schoolDoc?.collection('attendance');
  DocumentReference? get _settings => _schoolDoc?.collection('settings').doc('institute');

  // ─── Institute Settings ─────────────────────────────────────────

  Future<SettingsModel?> getInstituteSettings() async {
    if (_settings == null) return null;
    try {
      final snap = await _settings!.get();
      if (!snap.exists || snap.data() == null) return null;
      return SettingsModel.fromMap(snap.data() as Map<String, dynamic>);
    } catch (e) {
      debugPrint('[MultiTenantFirestore] Error loading settings: $e');
      return null;
    }
  }

  Future<void> saveInstituteSettings(SettingsModel settings) async {
    if (_settings == null) return;
    final data = settings.toMap();
    data['ownerId'] = currentUid;
    data['updatedAt'] = FieldValue.serverTimestamp();
    await _settings!.set(data, SetOptions(merge: true));
  }

  Stream<SettingsModel?> watchInstituteSettings() {
    if (_settings == null) return Stream.value(null);
    return _settings!.snapshots().map((snap) {
      if (!snap.exists || snap.data() == null) return null;
      return SettingsModel.fromMap(snap.data() as Map<String, dynamic>);
    });
  }

  // ─── Student Operations ──────────────────────────────────────────

  Future<List<StudentModel>> getStudents() async {
    if (_students == null) return [];
    final snap = await _students!.get();
    return snap.docs
        .map((d) => StudentModel.fromMap(d.data() as Map<String, dynamic>))
        .toList();
  }

  Stream<List<StudentModel>> watchStudents() {
    if (_students == null) return Stream.value([]);
    return _students!.snapshots().map(
          (snap) => snap.docs
              .map((d) => StudentModel.fromMap(d.data() as Map<String, dynamic>))
              .toList(),
        );
  }

  Future<void> saveStudent(StudentModel student) async {
    if (_students == null) return;
    final data = student.toMap();
    data['ownerId'] = currentUid;
    data['updatedAt'] = FieldValue.serverTimestamp();
    await _students!.doc(student.id).set(data, SetOptions(merge: true));
  }

  Future<void> deleteStudent(String studentId) async {
    if (_students == null) return;
    await _students!.doc(studentId).delete();
    await _fees?.doc(studentId).delete();
  }

  // ─── Fee Operations ─────────────────────────────────────────────

  Future<FeeModel?> getFee(String studentId) async {
    if (_fees == null) return null;
    final snap = await _fees!.doc(studentId).get();
    if (!snap.exists || snap.data() == null) return null;
    return FeeModel.fromMap(snap.data() as Map<String, dynamic>, []);
  }

  Stream<FeeModel?> watchFee(String studentId) {
    if (_fees == null) return Stream.value(null);
    return _fees!.doc(studentId).snapshots().map((snap) {
      if (!snap.exists || snap.data() == null) return null;
      return FeeModel.fromMap(snap.data() as Map<String, dynamic>, []);
    });
  }

  Future<void> saveFee(FeeModel fee) async {
    if (_fees == null) return;
    final data = fee.toMap();
    data['ownerId'] = currentUid;
    data['updatedAt'] = FieldValue.serverTimestamp();
    await _fees!.doc(fee.studentId).set(data, SetOptions(merge: true));
  }

  Future<void> savePayment(PaymentModel payment) async {
    if (_payments == null) return;
    final data = payment.toMap();
    data['ownerId'] = currentUid;
    await _payments!.doc(payment.id).set(data, SetOptions(merge: true));
  }

  // ─── Attendance Operations ────────────────────────────────────────

  Future<List<AttendanceModel>> getAttendanceByDate(DateTime date) async {
    if (_attendance == null) return [];
    final dateKey =
        '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
    final snap = await _attendance!.doc(dateKey).collection('records').get();
    return snap.docs
        .map((d) => AttendanceModel.fromMap(d.data() as Map<String, dynamic>))
        .toList();
  }

  Future<void> saveAttendanceBatch(List<AttendanceModel> records) async {
    if (_attendance == null || records.isEmpty) return;
    final batch = _db.batch();
    for (final r in records) {
      final dateKey =
          '${r.date.year}-${r.date.month.toString().padLeft(2, '0')}-${r.date.day.toString().padLeft(2, '0')}';
      final ref = _attendance!.doc(dateKey).collection('records').doc(r.studentId);
      final data = r.toMap();
      data['ownerId'] = currentUid;
      batch.set(ref, data, SetOptions(merge: true));
    }
    await batch.commit();
  }
}
