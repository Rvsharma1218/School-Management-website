class AttendanceModel {
  final String id;
  final String studentId;
  final DateTime date;
  final String status; // 'present' | 'absent' | 'leave'

  AttendanceModel({
    required this.id,
    required this.studentId,
    required this.date,
    required this.status,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'studentId': studentId,
      'date': date.toIso8601String(),
      'status': status,
    };
  }

  factory AttendanceModel.fromMap(Map<String, dynamic> map) {
    return AttendanceModel(
      id: map['id'] ?? '',
      studentId: map['studentId'] ?? '',
      date: DateTime.parse(map['date']),
      status: map['status'] ?? 'present',
    );
  }
}
