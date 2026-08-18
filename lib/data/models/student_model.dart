class StudentModel {
  final String id;
  final String admissionNumber;
  final String studentId;
  final String name;
  final String fatherName;
  final String? motherName;
  final String mobile;
  final String? alternateMobile;
  final String? email; // optional
  final DateTime dob;
  final String gender;
  final String address;
  final String? photoPath;
  final String studentType; // 'school' | 'computer'

  // School fields
  final String? className;
  final String? section;
  final String? rollNumber;

  // Computer fields
  final String? course;
  final String? batch;
  final int? courseDurationMonths; // e.g. 6, 12
  final DateTime? expectedCompletionDate;

  // Status & Session
  final String status; // 'active' | 'completed' | 'left' | 'suspended'
  final String? session; // e.g. '2026-27'

  final DateTime admissionDate;
  final DateTime createdAt;

  StudentModel({
    required this.id,
    required this.admissionNumber,
    required this.studentId,
    required this.name,
    required this.fatherName,
    this.motherName,
    required this.mobile,
    this.alternateMobile,
    this.email,
    required this.dob,
    required this.gender,
    required this.address,
    this.photoPath,
    required this.studentType,
    this.className,
    this.section,
    this.rollNumber,
    this.course,
    this.batch,
    this.courseDurationMonths,
    this.expectedCompletionDate,
    this.status = 'active',
    this.session,
    required this.admissionDate,
    required this.createdAt,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'admissionNumber': admissionNumber,
      'studentId': studentId,
      'name': name,
      'fatherName': fatherName,
      'motherName': motherName,
      'mobile': mobile,
      'alternateMobile': alternateMobile,
      'email': email,
      'dob': dob.toIso8601String(),
      'gender': gender,
      'address': address,
      'photoPath': photoPath,
      'studentType': studentType,
      'className': className,
      'section': section,
      'rollNumber': rollNumber,
      'course': course,
      'batch': batch,
      'courseDurationMonths': courseDurationMonths,
      'expectedCompletionDate': expectedCompletionDate?.toIso8601String(),
      'status': status,
      'session': session,
      'admissionDate': admissionDate.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
    };
  }

  factory StudentModel.fromMap(Map<String, dynamic> map) {
    return StudentModel(
      id: map['id'] ?? '',
      admissionNumber: map['admissionNumber'] ?? '',
      studentId: map['studentId'] ?? '',
      name: map['name'] ?? '',
      fatherName: map['fatherName'] ?? '',
      motherName: map['motherName'],
      mobile: map['mobile'] ?? '',
      alternateMobile: map['alternateMobile'],
      email: map['email'],
      dob: DateTime.parse(map['dob']),
      gender: map['gender'] ?? '',
      address: map['address'] ?? '',
      photoPath: map['photoPath'],
      studentType: map['studentType'] ?? 'school',
      className: map['className'],
      section: map['section'],
      rollNumber: map['rollNumber'],
      course: map['course'],
      batch: map['batch'],
      courseDurationMonths: map['courseDurationMonths'] as int?,
      expectedCompletionDate: map['expectedCompletionDate'] != null
          ? DateTime.tryParse(map['expectedCompletionDate'])
          : null,
      status: map['status'] ?? 'active',
      session: map['session'],
      admissionDate: DateTime.parse(map['admissionDate']),
      createdAt: DateTime.parse(map['createdAt']),
    );
  }

  StudentModel copyWith({
    String? id,
    String? admissionNumber,
    String? studentId,
    String? name,
    String? fatherName,
    String? motherName,
    String? mobile,
    String? alternateMobile,
    String? email,
    DateTime? dob,
    String? gender,
    String? address,
    String? photoPath,
    String? studentType,
    String? className,
    String? section,
    String? rollNumber,
    String? course,
    String? batch,
    int? courseDurationMonths,
    DateTime? expectedCompletionDate,
    String? status,
    String? session,
    DateTime? admissionDate,
    DateTime? createdAt,
  }) {
    return StudentModel(
      id: id ?? this.id,
      admissionNumber: admissionNumber ?? this.admissionNumber,
      studentId: studentId ?? this.studentId,
      name: name ?? this.name,
      fatherName: fatherName ?? this.fatherName,
      motherName: motherName ?? this.motherName,
      mobile: mobile ?? this.mobile,
      alternateMobile: alternateMobile ?? this.alternateMobile,
      email: email ?? this.email,
      dob: dob ?? this.dob,
      gender: gender ?? this.gender,
      address: address ?? this.address,
      photoPath: photoPath ?? this.photoPath,
      studentType: studentType ?? this.studentType,
      className: className ?? this.className,
      section: section ?? this.section,
      rollNumber: rollNumber ?? this.rollNumber,
      course: course ?? this.course,
      batch: batch ?? this.batch,
      courseDurationMonths: courseDurationMonths ?? this.courseDurationMonths,
      expectedCompletionDate: expectedCompletionDate ?? this.expectedCompletionDate,
      status: status ?? this.status,
      session: session ?? this.session,
      admissionDate: admissionDate ?? this.admissionDate,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  String get displayClass {
    if (studentType == 'school') {
      final cls = className ?? '';
      final sec = section ?? '';
      if (cls.isEmpty) return 'School Student';
      return 'Class $cls${sec.isNotEmpty ? ' - $sec' : ''}';
    }
    return course ?? 'Computer Student';
  }

  String get statusLabel {
    switch (status) {
      case 'completed': return 'Completed';
      case 'left': return 'Left';
      case 'suspended': return 'Suspended';
      default: return 'Active';
    }
  }

  // Status color helper
  static const statusColors = {
    'active': 0xFF2E7D32,     // green
    'completed': 0xFF1565C0,  // blue
    'left': 0xFFF57F17,       // orange
    'suspended': 0xFFC62828,  // red
  };

  int get statusColor => statusColors[status] ?? statusColors['active']!;
}
