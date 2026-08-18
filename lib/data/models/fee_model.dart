// Removed unused import 'dart:convert';

class PaymentModel {
  final String id;
  final String studentId;
  final double amount;
  final DateTime paymentDate;
  final String paymentMode;
  final String? remarks;
  final String receiptNumber;
  final String? feeMonth;

  PaymentModel({
    required this.id,
    required this.studentId,
    required this.amount,
    required this.paymentDate,
    required this.paymentMode,
    this.remarks,
    required this.receiptNumber,
    this.feeMonth,
  });

  Map<String, dynamic> toMap() => {
    'id': id,
    'studentId': studentId,
    'amount': amount,
    'paymentDate': paymentDate.toIso8601String(),
    'paymentMode': paymentMode,
    'remarks': remarks,
    'receiptNumber': receiptNumber,
    'feeMonth': feeMonth,
  };

  factory PaymentModel.fromMap(Map<String, dynamic> map) {
    return PaymentModel(
      id: map['id']?.toString() ?? '',
      studentId: map['studentId']?.toString() ?? '',
      amount: (map['amount'] as num?)?.toDouble() ?? 0.0,
      paymentDate:
      DateTime.tryParse(map['paymentDate']?.toString() ?? '') ??
          DateTime.now(),
      paymentMode: map['paymentMode']?.toString() ?? 'Cash',
      remarks: map['remarks']?.toString(),
      receiptNumber: map['receiptNumber']?.toString() ?? '',
      feeMonth: map['feeMonth']?.toString(),
    );
  }
}

class FeeModel {
  final String studentId;
  final double totalFees;
  final double paidFees;
  final List<PaymentModel> payments;
  final DateTime? dueDate;
  final DateTime? lastPaidDate;

  FeeModel({
    required this.studentId,
    required this.totalFees,
    required this.paidFees,
    required this.payments,
    this.dueDate,
    this.lastPaidDate,
  });

  double get remainingFees =>
      totalFees > 0
          ? (totalFees - paidFees).clamp(0.0, double.infinity).toDouble()
          : 0.0;

  double get totalPaid => paidFees;

  double get remaining => remainingFees;

  bool get isOverdue {
    if (dueDate == null || remainingFees <= 0) return false;
    return DateTime.now().isAfter(dueDate!);
  }

  int get overdueDays {
    if (!isOverdue || dueDate == null) return 0;
    return DateTime.now().difference(dueDate!).inDays;
  }

  String get feeStatus {
    if (totalFees <= 0) return 'Not Set';
    if (remainingFees <= 0) return 'Paid';
    if (isOverdue) return 'Overdue';
    if (paidFees <= 0) return 'Unpaid';
    return 'Pending';
  }

  Map<String, dynamic> toMap() => {
    'studentId': studentId,
    'totalFees': totalFees,
    'paidFees': paidFees,
    'dueDate': dueDate?.toIso8601String(),
    'lastPaidDate': lastPaidDate?.toIso8601String(),
  };

  // FIXED: fromMap now properly accepts a map and an optional payments list
  factory FeeModel.fromMap(Map<String, dynamic> map, {List<PaymentModel> payments = const []}) {
    return FeeModel(
      studentId: map['studentId']?.toString() ?? '',
      totalFees: (map['totalFees'] as num?)?.toDouble() ?? 0.0,
      paidFees: (map['paidFees'] as num?)?.toDouble() ?? 0.0,
      payments: payments,
      dueDate: DateTime.tryParse(map['dueDate']?.toString() ?? ''),
      lastPaidDate: DateTime.tryParse(map['lastPaidDate']?.toString() ?? ''),
    );
  }
}

class FeeLineItem {
  final String key;
  final String label;
  final double amount;

  const FeeLineItem({
    String? key,
    String? label,
    String? name,
    required this.amount,
  })  : key = key ?? name ?? '',
        label = label ?? name ?? '';

  String get name => label;

  Map<String, dynamic> toMap() => {
    'key': key,
    'label': label,
    'name': label,
    'amount': amount,
  };

  factory FeeLineItem.fromMap(Map<String, dynamic> map) {
    return FeeLineItem(
      key: map['key']?.toString(),
      label: map['label']?.toString(),
      name: map['name']?.toString(),
      amount: (map['amount'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

/// Monthly fee ledger.
///
/// 12 demand-slip particulars:
/// 1. Admission Fee
/// 2. Tuition Fee / Set Monthly Amount
/// 3. Examination Fee
/// 4. Previous Dues
/// 5. Game Fee
/// 6. Re-Admission Fee
/// 7. Development Fee
/// 8. School ID
/// 9. Tie, Bag, Belt
/// 10. Back Dues
/// 11. Transport Fee
/// 12. Other Fee
class MonthlyFeeModel {
  final String id;
  final String studentId;
  final String month;

  final double admissionFee;
  final double tuitionFee;
  final double examinationFee;
  final double previousDue;
  final double gameFee;
  final double reAdmissionFee;
  final double developmentFee;
  final double schoolIdFee;
  final double tieBagBeltFee;
  final double backDues;
  final double transportFee;
  final double otherFee;

  final double paidAmount;

  // Auto-calculated from the student's Fee Structure (dueDay + finePerDay)
  // — see StudentFeeStructureModel below. Recomputed whenever the fee
  // record is loaded/created; NOT user-typed (shown read-only in the UI).
  final double lateFine;

  final DateTime? dueDate;
  final DateTime? lastPaymentDate;

  final DateTime createdAt;
  final DateTime updatedAt;
  final String? remarks;

  const MonthlyFeeModel({
    required this.id,
    required this.studentId,
    required this.month,

    this.admissionFee = 0.0,
    this.tuitionFee = 0.0,
    this.examinationFee = 0.0,
    this.previousDue = 0.0,
    this.gameFee = 0.0,
    this.reAdmissionFee = 0.0,
    this.developmentFee = 0.0,
    this.schoolIdFee = 0.0,
    this.tieBagBeltFee = 0.0,
    this.backDues = 0.0,
    this.transportFee = 0.0,
    this.otherFee = 0.0,

    this.paidAmount = 0.0,
    this.lateFine = 0.0,

    this.dueDate,
    this.lastPaymentDate,

    required this.createdAt,
    required this.updatedAt,
    this.remarks,
  });

  // ------------------------------------------------------------
  // Compatibility getters
  // ------------------------------------------------------------

  double get monthlyFee => tuitionFee;

  String get status {
    if (totalDue <= 0) return 'Not Set';
    if (remaining <= 0) return 'Paid';
    if (isOverdue) return 'Overdue';
    if (paidAmount <= 0) return 'Unpaid';
    return 'Pending';
  }

  String get feeStatus => status;

  bool get isPaid => totalDue > 0 && remaining <= 0;

  bool get isOverdue {
    if (dueDate == null || remaining <= 0) return false;
    return DateTime.now().isAfter(dueDate!);
  }

  String get monthLabel {
    final parts = month.split('-');

    if (parts.length != 2) {
      return month;
    }

    final year = int.tryParse(parts[0]);
    final monthNumber = int.tryParse(parts[1]);

    if (year == null ||
        monthNumber == null ||
        monthNumber < 1 ||
        monthNumber > 12) {
      return month;
    }

    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    return '${monthNames[monthNumber - 1]} $year';
  }

  // ------------------------------------------------------------
  // Additional fee compatibility
  // ------------------------------------------------------------

  List<FeeLineItem> get additionalFees => [
    FeeLineItem(
      key: 'admissionFee',
      label: 'Admission Fee',
      amount: admissionFee,
    ),
    FeeLineItem(
      key: 'tuitionFee',
      label: 'Tuition Fee',
      amount: tuitionFee,
    ),
    FeeLineItem(
      key: 'examinationFee',
      label: 'Examination Fee',
      amount: examinationFee,
    ),
    FeeLineItem(
      key: 'previousDue',
      label: 'Previous Dues',
      amount: previousDue,
    ),
    FeeLineItem(
      key: 'gameFee',
      label: 'Game Fee',
      amount: gameFee,
    ),
    FeeLineItem(
      key: 'reAdmissionFee',
      label: 'Re-Admission Fee',
      amount: reAdmissionFee,
    ),
    FeeLineItem(
      key: 'developmentFee',
      label: 'Development Fee',
      amount: developmentFee,
    ),
    FeeLineItem(
      key: 'schoolIdFee',
      label: 'School ID',
      amount: schoolIdFee,
    ),
    FeeLineItem(
      key: 'tieBagBeltFee',
      label: 'Tie, Bag, Belt',
      amount: tieBagBeltFee,
    ),
    FeeLineItem(
      key: 'backDues',
      label: 'Back Dues',
      amount: backDues,
    ),
    FeeLineItem(
      key: 'transportFee',
      label: 'Transport Fee',
      amount: transportFee,
    ),
    FeeLineItem(
      key: 'otherFee',
      label: 'Other Fee',
      amount: otherFee,
    ),
    FeeLineItem(
      key: 'lateFine',
      label: 'Late Fine',
      amount: lateFine,
    ),
  ];

  List<FeeLineItem> get additionalItems => additionalFees;

  double get additionalTotal =>
      admissionFee +
          examinationFee +
          gameFee +
          reAdmissionFee +
          developmentFee +
          schoolIdFee +
          tieBagBeltFee +
          backDues +
          transportFee +
          otherFee;

  double get totalDue =>
      admissionFee +
          tuitionFee +
          examinationFee +
          previousDue +
          gameFee +
          reAdmissionFee +
          developmentFee +
          schoolIdFee +
          tieBagBeltFee +
          backDues +
          transportFee +
          otherFee +
          lateFine;

  double get remaining =>
      (totalDue - paidAmount).clamp(0.0, double.infinity).toDouble();

  // ------------------------------------------------------------
  // Database / Firestore
  // ------------------------------------------------------------

  Map<String, dynamic> toMap() => {
    'id': id,
    'studentId': studentId,
    'month': month,

    'admissionFee': admissionFee,
    'tuitionFee': tuitionFee,
    'monthlyFee': tuitionFee,
    'examinationFee': examinationFee,
    'previousDue': previousDue,
    'gameFee': gameFee,
    'reAdmissionFee': reAdmissionFee,
    'developmentFee': developmentFee,
    'schoolIdFee': schoolIdFee,
    'tieBagBeltFee': tieBagBeltFee,
    'backDues': backDues,
    'transportFee': transportFee,
    'otherFee': otherFee,

    'paidAmount': paidAmount,
    'lateFine': lateFine,

    'dueDate': dueDate?.toIso8601String(),
    'lastPaymentDate': lastPaymentDate?.toIso8601String(),

    'createdAt': createdAt.toIso8601String(),
    'updatedAt': updatedAt.toIso8601String(),
    'remarks': remarks,

    'additionalTotal': additionalTotal,
    'totalDue': totalDue,
    'remaining': remaining,
    'status': status,
  };

  factory MonthlyFeeModel.fromMap(Map<String, dynamic> map) {
    double number(String key) {
      final value = map[key];

      if (value is num) {
        return value.toDouble();
      }

      return double.tryParse(value?.toString() ?? '') ?? 0.0;
    }

    DateTime? nullableDate(String key) {
      final value = map[key];

      if (value == null) {
        return null;
      }

      if (value is DateTime) {
        return value;
      }

      return DateTime.tryParse(value.toString());
    }

    DateTime dateOrNow(String key) {
      return nullableDate(key) ?? DateTime.now();
    }

    return MonthlyFeeModel(
      id: map['id']?.toString() ?? '',
      studentId: map['studentId']?.toString() ?? '',
      month: map['month']?.toString() ?? '',

      admissionFee: number('admissionFee'),
      tuitionFee: number(
        map.containsKey('tuitionFee') ? 'tuitionFee' : 'monthlyFee',
      ),
      examinationFee: number('examinationFee'),
      previousDue: number('previousDue'),
      gameFee: number('gameFee'),
      reAdmissionFee: number('reAdmissionFee'),
      developmentFee: number('developmentFee'),
      schoolIdFee: number('schoolIdFee'),
      tieBagBeltFee: number('tieBagBeltFee'),
      backDues: number('backDues'),
      transportFee: number('transportFee'),
      otherFee: number('otherFee'),

      paidAmount: number('paidAmount'),
      lateFine: number('lateFine'),

      dueDate: nullableDate('dueDate'),
      lastPaymentDate: nullableDate('lastPaymentDate'),

      createdAt: dateOrNow('createdAt'),
      updatedAt: dateOrNow('updatedAt'),

      remarks: map['remarks']?.toString(),
    );
  }

  // ------------------------------------------------------------
  // copyWith
  // ------------------------------------------------------------

  MonthlyFeeModel copyWith({
    String? id,
    String? studentId,
    String? month,

    double? admissionFee,
    double? tuitionFee,
    double? examinationFee,
    double? previousDue,
    double? gameFee,
    double? reAdmissionFee,
    double? developmentFee,
    double? schoolIdFee,
    double? tieBagBeltFee,
    double? backDues,
    double? transportFee,
    double? otherFee,

    double? paidAmount,
    double? lateFine,

    DateTime? dueDate,
    DateTime? lastPaymentDate,

    DateTime? createdAt,
    DateTime? updatedAt,

    String? remarks,

    List<FeeLineItem>? additionalFees,
  }) {
    return MonthlyFeeModel(
      id: id ?? this.id,
      studentId: studentId ?? this.studentId,
      month: month ?? this.month,

      admissionFee: admissionFee ?? this.admissionFee,
      tuitionFee: tuitionFee ?? this.tuitionFee,
      examinationFee: examinationFee ?? this.examinationFee,
      previousDue: previousDue ?? this.previousDue,
      gameFee: gameFee ?? this.gameFee,
      reAdmissionFee: reAdmissionFee ?? this.reAdmissionFee,
      developmentFee: developmentFee ?? this.developmentFee,
      schoolIdFee: schoolIdFee ?? this.schoolIdFee,
      tieBagBeltFee: tieBagBeltFee ?? this.tieBagBeltFee,
      backDues: backDues ?? this.backDues,
      transportFee: transportFee ?? this.transportFee,
      otherFee: otherFee ?? this.otherFee,

      paidAmount: paidAmount ?? this.paidAmount,
      lateFine: lateFine ?? this.lateFine,

      dueDate: dueDate ?? this.dueDate,
      lastPaymentDate: lastPaymentDate ?? this.lastPaymentDate,

      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,

      remarks: remarks ?? this.remarks,
    );
  }
}

/// Receipt ke additional fee fields.
const List<String> schoolReceiptAdditionalFeeNames = [
  'Admission Fee',
  'Examination Fee',
  'Game Fee',
  'Re-Admission Fee',
  'Development Fee',
  'School Id',
  'Tie, Bag, Belt',
  'Back Dues',
  'Transport Fee',
  'Other Fee',
];

/// A student's recurring monthly Fee Structure — set once, then reused
/// every month so the Principal doesn't have to retype Tuition/Transport/
/// Game fee each time. Also drives the automatic Due Date and Late Fine
/// for each month's [MonthlyFeeModel] (see DatabaseService.ensureMonthlyFee).
///
/// One row per student (studentId is the primary key) — there's no
/// "history" of structures; changing it only affects months created AFTER
/// the change, exactly like the existing tuition-fee-carry-forward
/// behaviour already in the app.
class StudentFeeStructureModel {
  final String studentId;
  final double tuitionFee;
  final double transportFee;
  final double gameFee;
  final int dueDay; // day-of-month the fee is due, e.g. 10
  final double finePerDay; // ₹ charged per day past the due date
  final DateTime updatedAt;

  const StudentFeeStructureModel({
    required this.studentId,
    this.tuitionFee = 0.0,
    this.transportFee = 0.0,
    this.gameFee = 0.0,
    this.dueDay = 10,
    this.finePerDay = 0.0,
    required this.updatedAt,
  });

  double get monthlyTotal => tuitionFee + transportFee + gameFee;

  bool get isSet => tuitionFee > 0;

  Map<String, dynamic> toMap() => {
    'studentId': studentId,
    'tuitionFee': tuitionFee,
    'transportFee': transportFee,
    'gameFee': gameFee,
    'dueDay': dueDay,
    'finePerDay': finePerDay,
    'updatedAt': updatedAt.toIso8601String(),
  };

  factory StudentFeeStructureModel.fromMap(Map<String, dynamic> map) {
    double number(String key) {
      final value = map[key];
      if (value is num) return value.toDouble();
      return double.tryParse(value?.toString() ?? '') ?? 0.0;
    }

    return StudentFeeStructureModel(
      studentId: map['studentId']?.toString() ?? '',
      tuitionFee: number('tuitionFee'),
      transportFee: number('transportFee'),
      gameFee: number('gameFee'),
      dueDay: int.tryParse(map['dueDay']?.toString() ?? '') ?? 10,
      finePerDay: number('finePerDay'),
      updatedAt: DateTime.tryParse(map['updatedAt']?.toString() ?? '') ??
          DateTime.now(),
    );
  }

  StudentFeeStructureModel copyWith({
    double? tuitionFee,
    double? transportFee,
    double? gameFee,
    int? dueDay,
    double? finePerDay,
    DateTime? updatedAt,
  }) {
    return StudentFeeStructureModel(
      studentId: studentId,
      tuitionFee: tuitionFee ?? this.tuitionFee,
      transportFee: transportFee ?? this.transportFee,
      gameFee: gameFee ?? this.gameFee,
      dueDay: dueDay ?? this.dueDay,
      finePerDay: finePerDay ?? this.finePerDay,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}