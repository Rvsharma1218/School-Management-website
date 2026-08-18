class TeacherModel {
  final String authUid;
  final String teacherId;
  final String name;
  final String authEmail;
  final String? assignedClass;   // e.g. "Class 5" or "DCA"
  final String? assignedSection; // e.g. "A"
  final bool active;
  final DateTime createdAt;

  TeacherModel({
    required this.authUid,
    required this.teacherId,
    required this.name,
    required this.authEmail,
    this.assignedClass,
    this.assignedSection,
    required this.active,
    required this.createdAt,
  });

  Map<String, dynamic> toMap() {
    return {
      'authUid': authUid,
      'teacherId': teacherId,
      'name': name,
      'authEmail': authEmail,
      'assignedClass': assignedClass,
      'assignedSection': assignedSection,
      'active': active,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  factory TeacherModel.fromMap(Map<String, dynamic> map) {
    return TeacherModel(
      authUid: map['authUid'] ?? '',
      teacherId: map['teacherId'] ?? '',
      name: map['name'] ?? '',
      authEmail: map['authEmail'] ?? '',
      assignedClass: map['assignedClass'],
      assignedSection: map['assignedSection'],
      active: map['active'] ?? true,
      createdAt: DateTime.tryParse(map['createdAt'] ?? '') ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toPublicMap() {
    return {
      'authUid': authUid,
      'teacherId': teacherId,
      'name': name,
      'authEmail': authEmail,
      'assignedClass': assignedClass,
      'assignedSection': assignedSection,
      'active': active,
    };
  }

  factory TeacherModel.fromPublicMap(Map<String, dynamic> map) {
    return TeacherModel(
      authUid: map['authUid'] ?? '',
      teacherId: map['teacherId'] ?? '',
      name: map['name'] ?? '',
      authEmail: map['authEmail'] ?? '',
      assignedClass: map['assignedClass'],
      assignedSection: map['assignedSection'],
      active: map['active'] ?? true,
      createdAt: DateTime.now(),
    );
  }

  String get displayAssignedClass {
    final cls = assignedClass ?? '';
    final sec = assignedSection ?? '';
    if (cls.isEmpty) return 'Not Assigned';
    return '$cls${sec.isNotEmpty ? ' - Section $sec' : ''}';
  }

  TeacherModel copyWith({
    String? name,
    String? assignedClass,
    String? assignedSection,
    bool? active,
  }) {
    return TeacherModel(
      authUid: authUid,
      teacherId: teacherId,
      name: name ?? this.name,
      authEmail: authEmail,
      assignedClass: assignedClass ?? this.assignedClass,
      assignedSection: assignedSection ?? this.assignedSection,
      active: active ?? this.active,
      createdAt: createdAt,
    );
  }
}