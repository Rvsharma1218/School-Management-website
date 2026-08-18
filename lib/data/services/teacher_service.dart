import 'dart:math';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';
import '../models/teacher_model.dart';

class TeacherService {
  static final TeacherService instance = TeacherService._internal();
  TeacherService._internal();

  static const _secondaryAppName = 'teacherAdmin';

  FirebaseFirestore get _db => FirebaseFirestore.instance;

  DocumentReference _schoolRoot(String schoolUid) =>
      _db.collection('schools').doc(schoolUid);

  CollectionReference _teachersCol(String schoolUid) =>
      _schoolRoot(schoolUid).collection('teachers');

  DocumentReference _directoryDoc(String schoolEmail) =>
      _db.collection('schoolDirectory').doc(_normalizeEmail(schoolEmail));

  CollectionReference _publicTeachersCol(String schoolEmail) =>
      _directoryDoc(schoolEmail).collection('teachersPublic');

  String _normalizeEmail(String email) => email.trim().toLowerCase();

  Future<void> ensureSchoolDirectoryEntry({
    required String schoolEmail,
    required String schoolUid,
    required String instituteName,
  }) async {
    try {
      await _directoryDoc(schoolEmail).set({
        'schoolUid': schoolUid,
        'instituteName': instituteName,
        'updatedAt': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));
    } catch (e) {
      debugPrint('[TeacherService] ⚠️ Could not update school directory: $e');
    }
  }

  Future<Map<String, String>?> lookupSchoolByEmail(String schoolEmail) async {
    final snap = await _directoryDoc(schoolEmail).get();
    if (!snap.exists) return null;
    final data = snap.data() as Map<String, dynamic>;
    final uid = data['schoolUid'] as String?;
    if (uid == null) return null;
    return {
      'schoolUid': uid,
      'instituteName': (data['instituteName'] as String?) ?? '',
    };
  }

  Future<List<TeacherModel>> listPublicTeachers(String schoolEmail) async {
    final snap = await _publicTeachersCol(schoolEmail)
        .where('active', isEqualTo: true)
        .get();
    return snap.docs
        .map((d) => TeacherModel.fromPublicMap(d.data() as Map<String, dynamic>))
        .toList()
      ..sort((a, b) => a.name.compareTo(b.name));
  }

  Future<List<TeacherModel>> listAllTeachers(String schoolUid) async {
    final snap = await _teachersCol(schoolUid).get();
    return snap.docs
        .map((d) => TeacherModel.fromMap(d.data() as Map<String, dynamic>))
        .toList()
      ..sort((a, b) => a.name.compareTo(b.name));
  }

  String _randomSuffix() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    final rnd = Random.secure();
    return List.generate(8, (_) => chars[rnd.nextInt(chars.length)]).join();
  }

  Future<String> _nextTeacherId(String schoolUid) async {
    final counterRef = _schoolRoot(schoolUid).collection('meta').doc('counters');
    return _db.runTransaction((tx) async {
      final snap = await tx.get(counterRef);
      final current = snap.exists ? ((snap.data() as Map)['teacherSeq'] ?? 0) as int : 0;
      final next = current + 1;
      tx.set(counterRef, {'teacherSeq': next}, SetOptions(merge: true));
      return 'T${next.toString().padLeft(3, '0')}';
    });
  }

  Future<UserCredential> _createAuthAccountViaSecondaryApp({
    required String email,
    required String password,
  }) async {
    final appName = '${_secondaryAppName}_${DateTime.now().millisecondsSinceEpoch}';
    final secondaryApp = await Firebase.initializeApp(
      name: appName,
      options: Firebase.app().options,
    );
    try {
      final secondaryAuth = FirebaseAuth.instanceFor(app: secondaryApp);
      final cred = await secondaryAuth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );
      await secondaryAuth.signOut();
      return cred;
    } finally {
      await secondaryApp.delete();
    }
  }

  Future<TeacherModel> createTeacher({
    required String schoolUid,
    required String schoolEmail,
    required String name,
    required String password,
    String? assignedClass,
    String? assignedSection,
  }) async {
    final teacherId = await _nextTeacherId(schoolUid);
    final syntheticEmail =
        '${teacherId.toLowerCase()}.${_randomSuffix()}@teachers.internal';

    final cred = await _createAuthAccountViaSecondaryApp(
      email: syntheticEmail,
      password: password,
    );
    final authUid = cred.user!.uid;

    final teacher = TeacherModel(
      authUid: authUid,
      teacherId: teacherId,
      name: name.trim(),
      authEmail: syntheticEmail,
      assignedClass: assignedClass?.trim().isEmpty == true ? null : assignedClass?.trim(),
      assignedSection: assignedSection?.trim().isEmpty == true ? null : assignedSection?.trim(),
      active: true,
      createdAt: DateTime.now(),
    );

    await _teachersCol(schoolUid).doc(authUid).set(teacher.toMap());
    await _publicTeachersCol(schoolEmail).doc(authUid).set(teacher.toPublicMap());

    return teacher;
  }

  Future<void> updateTeacherDetails({
    required String schoolUid,
    required String schoolEmail,
    required TeacherModel teacher,
    required String newName,
    String? assignedClass,
    String? assignedSection,
  }) async {
    final updates = {
      'name': newName.trim(),
      'assignedClass': assignedClass?.trim().isEmpty == true ? null : assignedClass?.trim(),
      'assignedSection': assignedSection?.trim().isEmpty == true ? null : assignedSection?.trim(),
    };

    await _teachersCol(schoolUid).doc(teacher.authUid).update(updates);
    await _publicTeachersCol(schoolEmail).doc(teacher.authUid).update(updates);
  }

  Future<void> setTeacherActive({
    required String schoolUid,
    required String schoolEmail,
    required TeacherModel teacher,
    required bool active,
  }) async {
    await _teachersCol(schoolUid).doc(teacher.authUid).update({'active': active});
    await _publicTeachersCol(schoolEmail).doc(teacher.authUid).update({'active': active});
  }

  Future<TeacherModel> resetTeacherPassword({
    required String schoolUid,
    required String schoolEmail,
    required TeacherModel teacher,
    required String newPassword,
  }) async {
    final syntheticEmail =
        '${teacher.teacherId.toLowerCase()}.${_randomSuffix()}@teachers.internal';
    final cred = await _createAuthAccountViaSecondaryApp(
      email: syntheticEmail,
      password: newPassword,
    );
    final newAuthUid = cred.user!.uid;

    final migrated = TeacherModel(
      authUid: newAuthUid,
      teacherId: teacher.teacherId,
      name: teacher.name,
      authEmail: syntheticEmail,
      assignedClass: teacher.assignedClass,
      assignedSection: teacher.assignedSection,
      active: teacher.active,
      createdAt: teacher.createdAt,
    );

    final batch = _db.batch();
    batch.set(_teachersCol(schoolUid).doc(newAuthUid), migrated.toMap());
    batch.delete(_teachersCol(schoolUid).doc(teacher.authUid));
    batch.set(_publicTeachersCol(schoolEmail).doc(newAuthUid), migrated.toPublicMap());
    batch.delete(_publicTeachersCol(schoolEmail).doc(teacher.authUid));
    await batch.commit();

    return migrated;
  }

  Future<TeacherModel> signInTeacher({
    required String schoolUid,
    required String authEmail,
    required String password,
  }) async {
    final cred = await FirebaseAuth.instance.signInWithEmailAndPassword(
      email: authEmail,
      password: password,
    );
    final doc = await _teachersCol(schoolUid).doc(cred.user!.uid).get();
    if (!doc.exists) {
      await FirebaseAuth.instance.signOut();
      throw FirebaseAuthException(
        code: 'teacher-not-found',
        message: 'This teacher account is no longer linked to a school. Contact your Principal.',
      );
    }
    final teacher = TeacherModel.fromMap(doc.data() as Map<String, dynamic>);
    if (!teacher.active) {
      await FirebaseAuth.instance.signOut();
      throw FirebaseAuthException(
        code: 'teacher-disabled',
        message: 'This teacher account has been disabled. Contact your Principal.',
      );
    }
    return teacher;
  }

  /// Deletes a teacher: first disables them (blocking login), then removes
  /// their Firestore documents from the school's private and public collections.
  /// Note: Firebase Auth account cannot be deleted from client SDK — the
  /// signInTeacher() method already checks doc existence + active flag,
  /// so removing the doc effectively locks them out.
  Future<void> deleteTeacher({
    required String schoolUid,
    required String schoolEmail,
    required TeacherModel teacher,
  }) async {
    // Step 1: Disable first (in case batch delete is slow)
    try {
      await _teachersCol(schoolUid).doc(teacher.authUid).update({'active': false});
      await _publicTeachersCol(schoolEmail).doc(teacher.authUid).update({'active': false});
    } catch (_) {
      // Doc may already be missing — continue to delete
    }

    // Step 2: Delete the documents
    final batch = _db.batch();
    batch.delete(_teachersCol(schoolUid).doc(teacher.authUid));
    batch.delete(_publicTeachersCol(schoolEmail).doc(teacher.authUid));
    await batch.commit();
  }
}