class SubjectResult {
  final String subjectName;
  final double marks;
  final double totalMarks;

  SubjectResult({
    required this.subjectName,
    required this.marks,
    required this.totalMarks,
  });

  double get percentage => totalMarks > 0 ? (marks / totalMarks) * 100 : 0;

  String get grade {
    final p = percentage;
    if (p >= 90) return 'A+';
    if (p >= 80) return 'A';
    if (p >= 70) return 'B+';
    if (p >= 60) return 'B';
    if (p >= 50) return 'C';
    if (p >= 40) return 'D';
    return 'F';
  }

  Map<String, dynamic> toMap() {
    return {
      'subjectName': subjectName,
      'marks': marks,
      'totalMarks': totalMarks,
    };
  }

  factory SubjectResult.fromMap(Map<String, dynamic> map) {
    return SubjectResult(
      subjectName: map['subjectName'] ?? '',
      marks: (map['marks'] ?? 0).toDouble(),
      totalMarks: (map['totalMarks'] ?? 100).toDouble(),
    );
  }
}

class ResultModel {
  final String id;
  final String studentId;
  final String examName;
  final List<SubjectResult> subjects;
  final DateTime createdAt;

  ResultModel({
    required this.id,
    required this.studentId,
    required this.examName,
    required this.subjects,
    required this.createdAt,
  });

  double get totalMarks => subjects.fold(0, (sum, s) => sum + s.totalMarks);
  double get obtainedMarks => subjects.fold(0, (sum, s) => sum + s.marks);
  double get overallPercentage => totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;
  
  String get overallGrade {
    final p = overallPercentage;
    if (p >= 90) return 'A+';
    if (p >= 80) return 'A';
    if (p >= 70) return 'B+';
    if (p >= 60) return 'B';
    if (p >= 50) return 'C';
    if (p >= 40) return 'D';
    return 'F';
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'studentId': studentId,
      'examName': examName,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  factory ResultModel.fromMap(Map<String, dynamic> map, List<SubjectResult> subjects) {
    return ResultModel(
      id: map['id'] ?? '',
      studentId: map['studentId'] ?? '',
      examName: map['examName'] ?? '',
      subjects: subjects,
      createdAt: DateTime.parse(map['createdAt']),
    );
  }
}
