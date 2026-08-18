import 'dart:async';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/teacher_model.dart';

enum AppRole { principal, teacher }

class SessionService {
  static final SessionService instance = SessionService._internal();
  SessionService._internal();

  static const _kRole = 'session_role';
  static const _kSchoolUid = 'session_school_uid';
  static const _kTeacherId = 'session_teacher_id';
  static const _kTeacherName = 'session_teacher_name';
  static const _kAssignedClass = 'session_assigned_class';
  static const _kAssignedSection = 'session_assigned_section';

  AppRole? _role;
  String? _schoolUid;
  String? _teacherId;
  String? _teacherName;
  String? _assignedClass;
  String? _assignedSection;
  bool _loaded = false;

  // Broadcast stream — fires whenever schoolUid is set (login / session change).
  // firestoreRealtimeSyncProvider listens to this to re-trigger startForUser()
  // after login, solving the race condition where authStateChanges fires before
  // setPrincipalSession() / setTeacherSession() is called.
  final _schoolUidController = StreamController<String?>.broadcast();
  Stream<String?> get onSchoolUidChanged => _schoolUidController.stream;

  AppRole? get role => _role;
  String? get activeSchoolUid => _schoolUid;
  String? get teacherId => _teacherId;
  String? get teacherName => _teacherName;
  String? get assignedClass => _assignedClass;
  String? get assignedSection => _assignedSection;
  bool get isPrincipal => _role == AppRole.principal;
  bool get isTeacher => _role == AppRole.teacher;
  bool get hasSession => _role != null && _schoolUid != null;

  /// FIX: Defined assignedClassLabel getter
  String get assignedClassLabel {
    final cls = _assignedClass ?? '';
    final sec = _assignedSection ?? '';
    if (cls.isEmpty) return 'Not Assigned';
    return '$cls${sec.isNotEmpty ? ' - Sec $sec' : ''}';
  }

  Future<void> restore() async {
    if (_loaded) return;
    final prefs = await SharedPreferences.getInstance();
    final roleStr = prefs.getString(_kRole);
    _role = roleStr == 'principal'
        ? AppRole.principal
        : roleStr == 'teacher'
        ? AppRole.teacher
        : null;
    _schoolUid = prefs.getString(_kSchoolUid);
    _teacherId = prefs.getString(_kTeacherId);
    _teacherName = prefs.getString(_kTeacherName);
    _assignedClass = prefs.getString(_kAssignedClass);
    _assignedSection = prefs.getString(_kAssignedSection);
    _loaded = true;
  }

  Future<void> setPrincipalSession(String schoolUid) async {
    _role = AppRole.principal;
    _schoolUid = schoolUid;
    _teacherId = null;
    _teacherName = null;
    _assignedClass = null;
    _assignedSection = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kRole, 'principal');
    await prefs.setString(_kSchoolUid, schoolUid);
    await prefs.remove(_kTeacherId);
    await prefs.remove(_kTeacherName);
    await prefs.remove(_kAssignedClass);
    await prefs.remove(_kAssignedSection);
    // Notify listeners so firestoreRealtimeSyncProvider re-triggers startForUser()
    _schoolUidController.add(schoolUid);
  }

  /// Backward compatible setTeacherSession supporting both individual parameters and TeacherModel
  Future<void> setTeacherSession({
    required String schoolUid,
    TeacherModel? teacher,
    String? teacherId,
    String? teacherName,
    String? assignedClass,
    String? assignedSection,
  }) async {
    _role = AppRole.teacher;
    _schoolUid = schoolUid;
    _teacherId = teacher?.teacherId ?? teacherId;
    _teacherName = teacher?.name ?? teacherName;
    _assignedClass = teacher?.assignedClass ?? assignedClass;
    _assignedSection = teacher?.assignedSection ?? assignedSection;

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kRole, 'teacher');
    await prefs.setString(_kSchoolUid, schoolUid);
    if (_teacherId != null) await prefs.setString(_kTeacherId, _teacherId!);
    if (_teacherName != null) await prefs.setString(_kTeacherName, _teacherName!);

    if (_assignedClass != null && _assignedClass!.isNotEmpty) {
      await prefs.setString(_kAssignedClass, _assignedClass!);
    } else {
      await prefs.remove(_kAssignedClass);
    }

    if (_assignedSection != null && _assignedSection!.isNotEmpty) {
      await prefs.setString(_kAssignedSection, _assignedSection!);
    } else {
      await prefs.remove(_kAssignedSection);
    }
    // Notify listeners so firestoreRealtimeSyncProvider re-triggers startForUser()
    _schoolUidController.add(schoolUid);
  }

  Future<void> clear() async {
    _role = null;
    _schoolUid = null;
    _teacherId = null;
    _teacherName = null;
    _assignedClass = null;
    _assignedSection = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_kRole);
    await prefs.remove(_kSchoolUid);
    await prefs.remove(_kTeacherId);
    await prefs.remove(_kTeacherName);
    await prefs.remove(_kAssignedClass);
    await prefs.remove(_kAssignedSection);
  }
}