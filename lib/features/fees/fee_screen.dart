import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path_provider/path_provider.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

import '../../core/constants/app_colors.dart';
import '../../core/utils/app_utils.dart';
import '../../data/models/fee_model.dart';
import '../../data/models/student_model.dart';
import '../../data/services/database_service.dart';
import '../../data/services/providers.dart';
import '../whatsapp/whatsapp_service.dart';
import '../../widgets/common_widgets.dart';
import '../../data/services/firestore_service.dart';

const List<int> _kDueDayOptions = [5, 10, 15, 20, 25];

class FeeScreen extends ConsumerStatefulWidget {
  final String studentId;
  const FeeScreen({super.key, required this.studentId});

  @override
  ConsumerState<FeeScreen> createState() => _FeeScreenState();
}

class _FeeScreenState extends ConsumerState<FeeScreen> {
  StudentModel? _student;
  MonthlyFeeModel? _fee;
  bool _loading = true;
  bool _saving = false;

  DateTime _selectedMonth = DateTime(DateTime.now().year, DateTime.now().month);

  final _paymentCtrl = TextEditingController();
  final _remarksCtrl = TextEditingController();
  String _paymentMode = 'Cash';

  final _modes = [
    'Cash',
    'UPI',
    'Bank Transfer',
    'Card',
    'Cheque',
    'NEFT',
  ];

  final Map<String, TextEditingController> _feeCtrls = {};

  StudentFeeStructureModel? _feeStructure;
  bool _savingStructure = false;
  final _fsTuitionCtrl = TextEditingController();
  final _fsTransportCtrl = TextEditingController();
  final _fsGameCtrl = TextEditingController();
  final _fsFineCtrl = TextEditingController();
  int _fsDueDay = 10;

  static const Map<String, String> _feeFields = {
    'admissionFee': 'Admission Fee',
    'tuitionFee': 'Tuition Fee',
    'examinationFee': 'Examination Fee',
    'previousDue': 'Previous Dues',
    'gameFee': 'Game Fee',
    'reAdmissionFee': 'Re-Admission Fee',
    'developmentFee': 'Development Fee',
    'schoolIdFee': 'School ID',
    'tieBagBeltFee': 'Tie, Bag, Belt',
    'backDues': 'Back Dues',
    'transportFee': 'Transport Fee',
    'otherFee': 'Other Fee',
    'lateFine': 'Late Fine',
  };

  @override
  void initState() {
    super.initState();
    for (final key in _feeFields.keys) {
      _feeCtrls[key] = TextEditingController();
    }
    _load();
  }

  @override
  void dispose() {
    _paymentCtrl.dispose();
    _remarksCtrl.dispose();
    for (final c in _feeCtrls.values) {
      c.dispose();
    }
    _fsTuitionCtrl.dispose();
    _fsTransportCtrl.dispose();
    _fsGameCtrl.dispose();
    _fsFineCtrl.dispose();
    super.dispose();
  }

  String get _monthKey =>
      '${_selectedMonth.year}-${_selectedMonth.month.toString().padLeft(2, '0')}';

  Future<void> _load() async {
    if (!mounted) return;
    setState(() => _loading = true);
    try {
      final student =
      await DatabaseService.instance.getStudentById(widget.studentId);

      final structure =
      await DatabaseService.instance.getFeeStructure(widget.studentId);

      final monthly = await DatabaseService.instance.ensureMonthlyFee(
        studentId: widget.studentId,
        month: _monthKey,
      );

      if (!mounted) return;
      setState(() {
        _student = student;
        _fee = monthly;
        _feeStructure = structure;
        _loading = false;
      });
      _fillControllers(monthly);
      _fillStructureControllers(structure);
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        _error(e.toString());
      }
    }
  }

  void _fillControllers(MonthlyFeeModel fee) {
    final values = {
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
    };

    for (final entry in values.entries) {
      _feeCtrls[entry.key]!.text =
      entry.value == 0 ? '' : entry.value.toStringAsFixed(0);
    }
  }

  void _fillStructureControllers(StudentFeeStructureModel? structure) {
    _fsTuitionCtrl.text = structure == null || structure.tuitionFee == 0
        ? ''
        : structure.tuitionFee.toStringAsFixed(0);
    _fsTransportCtrl.text = structure == null || structure.transportFee == 0
        ? ''
        : structure.transportFee.toStringAsFixed(0);
    _fsGameCtrl.text = structure == null || structure.gameFee == 0
        ? ''
        : structure.gameFee.toStringAsFixed(0);
    _fsFineCtrl.text = structure == null || structure.finePerDay == 0
        ? ''
        : structure.finePerDay.toStringAsFixed(0);
    _fsDueDay = structure?.dueDay ?? 10;
    if (!_kDueDayOptions.contains(_fsDueDay)) _fsDueDay = 10;
  }

  Future<void> _saveFeeStructure() async {
    final tuition = double.tryParse(_fsTuitionCtrl.text.trim()) ?? 0;
    if (tuition <= 0) {
      _error('Tuition Fee / Month is required.');
      return;
    }
    setState(() => _savingStructure = true);
    try {
      final structure = await DatabaseService.instance.saveFeeStructure(
        studentId: widget.studentId,
        tuitionFee: tuition,
        transportFee: double.tryParse(_fsTransportCtrl.text.trim()) ?? 0,
        gameFee: double.tryParse(_fsGameCtrl.text.trim()) ?? 0,
        dueDay: _fsDueDay,
        finePerDay: double.tryParse(_fsFineCtrl.text.trim()) ?? 0,
      );
      if (!mounted) return;
      setState(() => _feeStructure = structure);

      ref.invalidate(feeProvider(widget.studentId));
      ref.invalidate(dashboardStatsProvider);

      _success(
        'Fee structure saved. Applies from the next month created onward.',
      );
    } catch (e) {
      _error(e.toString());
    } finally {
      if (mounted) setState(() => _savingStructure = false);
    }
  }

  double _v(String key) =>
      double.tryParse(_feeCtrls[key]!.text.trim()) ?? 0;

  double get _demandTotal =>
      _feeFields.keys.fold(0.0, (sum, key) => sum + _v(key));

  double get _remaining => _fee == null
      ? 0
      : (_demandTotal - _fee!.paidAmount).clamp(0.0, double.infinity);

  Future<MonthlyFeeModel> _saveDemandInternal() {
    final additionalFees = <FeeLineItem>[
      FeeLineItem(
        key: 'admissionFee',
        label: 'Admission Fee',
        amount: _v('admissionFee'),
      ),
      FeeLineItem(
        key: 'examinationFee',
        label: 'Examination Fee',
        amount: _v('examinationFee'),
      ),
      FeeLineItem(
        key: 'gameFee',
        label: 'Game Fee',
        amount: _v('gameFee'),
      ),
      FeeLineItem(
        key: 'reAdmissionFee',
        label: 'Re-Admission Fee',
        amount: _v('reAdmissionFee'),
      ),
      FeeLineItem(
        key: 'developmentFee',
        label: 'Development Fee',
        amount: _v('developmentFee'),
      ),
      FeeLineItem(
        key: 'schoolIdFee',
        label: 'School ID',
        amount: _v('schoolIdFee'),
      ),
      FeeLineItem(
        key: 'tieBagBeltFee',
        label: 'Tie, Bag, Belt',
        amount: _v('tieBagBeltFee'),
      ),
      FeeLineItem(
        key: 'backDues',
        label: 'Back Dues',
        amount: _v('backDues'),
      ),
      FeeLineItem(
        key: 'transportFee',
        label: 'Transport Fee',
        amount: _v('transportFee'),
      ),
      FeeLineItem(
        key: 'otherFee',
        label: 'Other Fee',
        amount: _v('otherFee'),
      ),
    ];

    return DatabaseService.instance.saveMonthlyFeeStructure(
      studentId: widget.studentId,
      month: _monthKey,
      tuitionFee: _v('tuitionFee'),
      additionalFees: additionalFees,
    );
  }

  Future<void> _saveDemand() async {
    try {
      final updated = await _saveDemandInternal();
      if (!mounted) return;
      setState(() => _fee = updated);
      _fillControllers(updated);

      ref.invalidate(feeProvider(widget.studentId));
      ref.invalidate(dashboardStatsProvider);

      // Sync fee particulars to Firestore
      FirestoreService.instance.syncMonthlyFee(updated);

      _success('Fee particulars saved.');
    } catch (e) {
      _error(e.toString());
    }
  }

  Future<void> _setDueDate() async {
    final fee = _fee;

    if (fee == null) {
      _error('Save the selected month first.');
      return;
    }

    final picked = await showDatePicker(
      context: context,
      initialDate: fee.dueDate ??
          DateTime(
            _selectedMonth.year,
            _selectedMonth.month,
            10,
          ),
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
    );

    if (picked == null) return;

    setState(() {
      _saving = true;
    });

    try {
      await DatabaseService.instance.updateMonthlyFeeDueDate(
        studentId: widget.studentId,
        month: _monthKey,
        dueDate: picked,
      );

      final updated = await DatabaseService.instance.getMonthlyFee(
        widget.studentId,
        _monthKey,
      );

      if (updated != null) {
        await FirestoreService.instance.syncMonthlyFee(
          updated,
        );
      }

      await _load();

      ref.invalidate(feeProvider(widget.studentId));
      ref.invalidate(dashboardStatsProvider);

      _success('Due date updated.');
    } catch (e) {
      _error(e.toString());
    } finally {
      if (mounted) {
        setState(() {
          _saving = false;
        });
      }
    }
  }

  Future<void> _addPayment() async {
    final amount = double.tryParse(_paymentCtrl.text.trim());

    if (amount == null || amount <= 0) {
      _error('Enter a valid payment amount.');
      return;
    }

    if (_fee == null) {
      _error('Fee record not found.');
      return;
    }

    if (amount > _remaining + 0.0001) {
      _error(
        'Payment cannot exceed remaining fee '
            '${AppUtils.formatCurrency(_remaining)}.',
      );
      return;
    }

    setState(() => _saving = true);

    try {
      await _saveDemandInternal();

      final updated = await DatabaseService.instance.addMonthlyPayment(
        studentId: widget.studentId,
        month: _monthKey,
        amount: amount,
        paymentMode: _paymentMode,
        remarks: _remarksCtrl.text.trim().isEmpty
            ? null
            : _remarksCtrl.text.trim(),
      );

      final history = await DatabaseService.instance.getMonthlyPaymentHistory(
        widget.studentId,
        _monthKey,
      );

      final receiptNo =
      history.isNotEmpty ? history.first.receiptNumber : 'Generated';

      if (!mounted) return;

      setState(() => _fee = updated);
      _fillControllers(updated);
      _paymentCtrl.clear();
      _remarksCtrl.clear();

      ref.invalidate(feeProvider(widget.studentId));
      ref.invalidate(dashboardStatsProvider);

      // FIXED: await all Firestore sync calls so payment data persists
      // before the success message is shown. Fire-and-forget was causing
      // payment data to be lost if the app was closed right after payment.
      try {
        await FirestoreService.instance.syncMonthlyFee(updated);
      } catch (e) {
        debugPrint('[FeeScreen] ❌ syncMonthlyFee failed: $e');
      }
      if (history.isNotEmpty) {
        final latestPayment = history.first;
        try {
          await FirestoreService.instance.syncPayment(latestPayment);
        } catch (e) {
          debugPrint('[FeeScreen] ❌ syncPayment failed: $e');
        }

        // Sync complete receipt with all fee heads and student info
        final paidBefore = await DatabaseService.instance.getPaidBeforePayment(
          widget.studentId,
          _monthKey,
          latestPayment.id,
          latestPayment.paymentDate,
        );
        try {
          await FirestoreService.instance.syncReceipt(
            payment: latestPayment,
            fee: updated,
            studentName: _student?.name ?? '',
            admissionNumber: _student?.admissionNumber ?? '',
            className: _student?.displayClass ?? '',
            paidBefore: paidBefore,
          );
        } catch (e) {
          debugPrint('[FeeScreen] ❌ syncReceipt failed: $e');
        }
      }

      _success(
        'Payment ${AppUtils.formatCurrency(amount)} recorded. '
            'Receipt $receiptNo',
      );
    } catch (e) {
      _error(e.toString());
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  static String _numberToWords(double value) {
    final number = value.toInt();
    if (number == 0) return 'Zero';

    const ones = [
      '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven',
      'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen',
      'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
    ];
    const tens = [
      '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty',
      'Sixty', 'Seventy', 'Eighty', 'Ninety',
    ];

    String twoDigits(int n) {
      if (n < 20) return ones[n];
      return '${tens[n ~/ 10]} ${ones[n % 10]}'.trim();
    }

    String threeDigits(int n) {
      if (n >= 100) {
        return '${ones[n ~/ 100]} Hundred${n % 100 > 0 ? ' ${twoDigits(n % 100)}' : ''}';
      }
      return twoDigits(n);
    }

    var n = number;
    final parts = <String>[];
    if (n >= 10000000) {
      parts.add('${threeDigits(n ~/ 10000000)} Crore');
      n %= 10000000;
    }
    if (n >= 100000) {
      parts.add('${twoDigits(n ~/ 100000)} Lakh');
      n %= 100000;
    }
    if (n >= 1000) {
      parts.add('${twoDigits(n ~/ 1000)} Thousand');
      n %= 1000;
    }
    if (n > 0) {
      parts.add(threeDigits(n));
    }
    return parts.join(' ');
  }

  Future<pw.Document> _generateReceiptPdf(
      MonthlyFeeModel fee,
      PaymentModel payment,
      ) async {
    final student = _student;
    if (student == null) return pw.Document();

    final settings = await DatabaseService.instance.getSettings();

    final regular = await PdfGoogleFonts.notoSansRegular();
    final bold = await PdfGoogleFonts.notoSansBold();

    final pdf = pw.Document();

    final paidBefore = await DatabaseService.instance.getPaidBeforePayment(
      widget.studentId, fee.month, payment.id, payment.paymentDate,
    );
    final remainingAtPayment =
    (fee.totalDue - paidBefore - payment.amount).clamp(0.0, double.infinity);

    String fmtDate(DateTime d) =>
        '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';

    String fmtTime(DateTime d) {
      final hour = d.hour == 0 ? 12 : d.hour > 12 ? d.hour - 12 : d.hour;
      final minute = d.minute.toString().padLeft(2, '0');
      final period = d.hour >= 12 ? 'PM' : 'AM';
      return '$hour:$minute $period';
    }

    String fmtDateLong(DateTime d) {
      const m = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];
      return '${d.day} ${m[d.month - 1]} ${d.year}';
    }

    final dueText = fee.dueDate == null
        ? 'Not Set'
        : '${fee.dueDate!.day} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][fee.dueDate!.month - 1]} ${fee.dueDate!.year}';

    final watermarkText = remainingAtPayment <= 0 ? 'PAID' : 'PARTIALLY PAID';

    final feeStructure =
    await DatabaseService.instance.getFeeStructure(widget.studentId);
    final finePerDay = feeStructure?.finePerDay ?? 5;
    final dueDay = feeStructure?.dueDay ?? 10;

    final cream = PdfColor.fromHex('#FFFDF5');
    final darkText = PdfColor.fromHex('#2C1810');

    final particulars = <MapEntry<String, double>>[
      MapEntry('Admission Fee', fee.admissionFee),
      MapEntry('Tuition Fee', fee.tuitionFee),
      MapEntry('Examination Fee', fee.examinationFee),
      MapEntry('Previous Dues', fee.previousDue),
      MapEntry('Game Fee', fee.gameFee),
      MapEntry('Re-Admission Fee', fee.reAdmissionFee),
      MapEntry('Development Fee', fee.developmentFee),
      MapEntry('School ID', fee.schoolIdFee),
      MapEntry('Tie, Bag, Belt', fee.tieBagBeltFee),
      MapEntry('Back Dues', fee.backDues),
      MapEntry('Transport Fee', fee.transportFee),
      MapEntry('Other Fee', fee.otherFee),
    ];

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a5,
        margin: const pw.EdgeInsets.all(10),
        build: (_) {
          return pw.Stack(
            children: [
              if (watermarkText.isNotEmpty)
                pw.Positioned(
                  left: 30,
                  top: 220,
                  child: pw.Transform.rotateBox(
                    angle: -0.45,
                    child: pw.Opacity(
                      opacity: 0.06,
                      child: pw.Text(
                        watermarkText,
                        style: pw.TextStyle(
                          font: bold,
                          fontSize: 60,
                          color: darkText,
                        ),
                      ),
                    ),
                  ),
                ),
              pw.Container(
                decoration: pw.BoxDecoration(
                  color: cream,
                  border: pw.Border.all(color: darkText, width: 1.5),
                ),
                padding: const pw.EdgeInsets.all(10),
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Center(
                      child: pw.Text(
                        'FEE RECEIPT', // FIX: Header changed to FEE RECEIPT
                        style: pw.TextStyle(
                          font: bold, fontSize: 10,
                          color: darkText,
                          letterSpacing: 2,
                        ),
                      ),
                    ),
                    pw.SizedBox(height: 2),
                    pw.Center(
                      child: pw.Text(
                        settings.instituteName.toUpperCase(),
                        textAlign: pw.TextAlign.center,
                        style: pw.TextStyle(
                          font: bold, fontSize: 14,
                          color: darkText,
                          letterSpacing: 1,
                        ),
                      ),
                    ),
                    pw.SizedBox(height: 2),
                    pw.Center(
                      child: pw.Text(
                        'Add- ${settings.address}',
                        textAlign: pw.TextAlign.center,
                        style: pw.TextStyle(font: regular, fontSize: 7.5, color: darkText),
                      ),
                    ),
                    pw.Center(
                      child: pw.Text(
                        'Mob- ${settings.mobile}',
                        style: pw.TextStyle(font: regular, fontSize: 7.5, color: darkText),
                      ),
                    ),
                    pw.SizedBox(height: 5),
                    pw.Divider(color: darkText, thickness: 0.8),
                    pw.SizedBox(height: 4),

                    pw.Row(
                      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                      children: [
                        pw.RichText(text: pw.TextSpan(children: [
                          pw.TextSpan(text: 'SL No. ', style: pw.TextStyle(font: regular, fontSize: 8, color: darkText)),
                          pw.TextSpan(text: payment.receiptNumber, style: pw.TextStyle(font: bold, fontSize: 8, color: darkText)),
                        ])),
                        pw.RichText(text: pw.TextSpan(children: [
                          pw.TextSpan(text: 'Date ', style: pw.TextStyle(font: regular, fontSize: 8, color: darkText)),
                          pw.TextSpan(text: '${fmtDate(payment.paymentDate)} ${fmtTime(payment.paymentDate)}', style: pw.TextStyle(font: bold, fontSize: 8, color: darkText)),
                        ])),
                      ],
                    ),
                    pw.SizedBox(height: 3),

                    _dottedInfoRow("Student's Name", student.name, regular, bold, darkText),
                    pw.Row(children: [
                      pw.Expanded(child: _dottedInfoRow('Class', student.displayClass, regular, bold, darkText)),
                      pw.SizedBox(width: 8),
                      pw.Expanded(child: _dottedInfoRow('Roll No.', student.rollNumber ?? '-', regular, bold, darkText)),
                    ]),
                    _dottedInfoRow("Father's Name", student.fatherName, regular, bold, darkText),
                    pw.Row(children: [
                      pw.Expanded(child: _dottedInfoRow('Fees For Month of', _formatMonth(fee.month), regular, bold, darkText)),
                    ]),
                    pw.Row(children: [
                      pw.Expanded(child: _dottedInfoRow('Due Date', dueText, regular, bold, darkText)),
                      pw.SizedBox(width: 8),
                      pw.Expanded(child: _dottedInfoRow('Session', student.session ?? settings.currentSession, regular, bold, darkText)),
                    ]),

                    pw.SizedBox(height: 6),

                    pw.Table(
                      border: pw.TableBorder.all(color: darkText, width: 0.6),
                      columnWidths: {
                        0: const pw.FixedColumnWidth(22),
                        1: const pw.FlexColumnWidth(5),
                        2: const pw.FixedColumnWidth(50),
                        3: const pw.FixedColumnWidth(18),
                      },
                      children: [
                        pw.TableRow(
                          decoration: pw.BoxDecoration(color: PdfColor.fromHex('#F5F0E8')),
                          children: [
                            _slipCell('S.N.', bold, darkText, center: true),
                            _slipCell('Particulars', bold, darkText),
                            _slipCell('Amount', bold, darkText, right: true),
                            _slipCell('P.', bold, darkText, center: true),
                          ],
                        ),
                        ...List.generate(12, (i) {
                          final amt = particulars[i].value;
                          return pw.TableRow(children: [
                            _slipCell('${i + 1}', regular, darkText, center: true),
                            _slipCell(particulars[i].key, regular, darkText),
                            _slipCell(amt > 0 ? amt.toStringAsFixed(2) : '', regular, darkText, right: true),
                            _slipCell(amt > 0 ? '00' : '', regular, darkText, center: true),
                          ]);
                        }),
                        pw.TableRow(children: [
                          _slipCell('★', bold, darkText, center: true),
                          _slipCell('Late Fine', bold, darkText),
                          _slipCell(fee.lateFine > 0 ? fee.lateFine.toStringAsFixed(2) : '', regular, darkText, right: true),
                          _slipCell(fee.lateFine > 0 ? '00' : '', regular, darkText, center: true),
                        ]),
                        pw.TableRow(
                          decoration: pw.BoxDecoration(color: PdfColor.fromHex('#EDE8D8')),
                          children: [
                            _slipCell('', bold, darkText),
                            _slipCell('Total Amount', bold, darkText, right: true),
                            _slipCell(fee.totalDue.toStringAsFixed(2), bold, darkText, right: true),
                            _slipCell('00', bold, darkText, center: true),
                          ],
                        ),
                        pw.TableRow(children: [
                          _slipCell('', regular, darkText),
                          _slipCell('Amount Paid', regular, darkText, right: true),
                          _slipCell(payment.amount.toStringAsFixed(2), bold, darkText, right: true),
                          _slipCell('00', regular, darkText, center: true),
                        ]),
                        pw.TableRow(children: [
                          _slipCell('', regular, darkText),
                          _slipCell('Balance Due', regular, darkText, right: true),
                          _slipCell(remainingAtPayment.toStringAsFixed(2), bold, darkText, right: true),
                          _slipCell('00', regular, darkText, center: true),
                        ]),
                      ],
                    ),

                    pw.SizedBox(height: 5),

                    pw.RichText(text: pw.TextSpan(children: [
                      pw.TextSpan(
                        text: 'Rupees: ',
                        style: pw.TextStyle(font: bold, fontSize: 7.5, color: darkText),
                      ),
                      pw.TextSpan(
                        text: '${_numberToWords(fee.totalDue)} Only',
                        style: pw.TextStyle(font: regular, fontSize: 7.5, color: darkText),
                      ),
                    ])),

                    pw.SizedBox(height: 4),
                    pw.Divider(color: darkText, thickness: 0.4),
                    pw.SizedBox(height: 2),

                    pw.Center(
                      child: pw.Container(
                        padding: const pw.EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: pw.BoxDecoration(
                          color: PdfColor.fromHex('#F0F8E8'),
                          border: pw.Border.all(color: PdfColor.fromHex('#6B8E4E'), width: 0.5),
                          borderRadius: pw.BorderRadius.circular(2),
                        ),
                        child: pw.RichText(text: pw.TextSpan(children: [
                          pw.TextSpan(
                            text: '☑ ',
                            style: pw.TextStyle(font: bold, fontSize: 8, color: PdfColor.fromHex('#2E7D32')),
                          ),
                          pw.TextSpan(
                            text: 'Paid on ${fmtDateLong(payment.paymentDate)} via ${payment.paymentMode}',
                            style: pw.TextStyle(font: regular, fontSize: 7.5, color: darkText),
                          ),
                        ])),
                      ),
                    ),

                    pw.SizedBox(height: 8),

                    pw.Row(
                      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                      children: [
                        pw.Column(crossAxisAlignment: pw.CrossAxisAlignment.start, children: [
                          pw.Text('Class Teacher Sign.', style: pw.TextStyle(font: regular, fontSize: 7.5, color: darkText)),
                        ]),
                        pw.Column(crossAxisAlignment: pw.CrossAxisAlignment.end, children: [
                          pw.Text('FOR ${settings.instituteName.toUpperCase()}', style: pw.TextStyle(font: bold, fontSize: 6.5, color: darkText)),
                        ]),
                      ],
                    ),

                    pw.SizedBox(height: 6),
                    pw.Divider(color: darkText, thickness: 0.5),
                    pw.SizedBox(height: 3),

                    pw.Text('Rules:-', style: pw.TextStyle(font: bold, fontSize: 7, color: darkText)),
                    pw.SizedBox(height: 2),
                    pw.Text(
                      '1. Last date of fee is ${dueDay}th of the month',
                      style: pw.TextStyle(font: regular, fontSize: 6.5, color: darkText),
                    ),
                    pw.Text(
                      '2. A fine of Rs ${finePerDay.toStringAsFixed(0)}/- per day will be charged if the dues are paid after\n   the due date',
                      style: pw.TextStyle(font: regular, fontSize: 6.5, color: darkText),
                    ),
                    pw.Text(
                      '3. Fee shall be accepted only between 9.am to 2.pm',
                      style: pw.TextStyle(font: regular, fontSize: 6.5, color: darkText),
                    ),

                    pw.SizedBox(height: 6),

                    pw.Align(
                      alignment: pw.Alignment.centerRight,
                      child: pw.Column(
                        crossAxisAlignment: pw.CrossAxisAlignment.end,
                        children: [
                          pw.SizedBox(width: 100, child: pw.Divider(color: darkText)),
                          pw.Text('Auth. Signature', style: pw.TextStyle(font: regular, fontSize: 7, color: darkText)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );

    return pdf;
  }

  pw.Widget _dottedInfoRow(
      String label, String value, pw.Font regular, pw.Font bold, PdfColor color) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(vertical: 1.5),
      child: pw.Row(children: [
        pw.Text('$label: ', style: pw.TextStyle(font: regular, fontSize: 8, color: color)),
        pw.Expanded(
          child: pw.Text(
            value,
            style: pw.TextStyle(font: bold, fontSize: 8, color: color),
            textAlign: pw.TextAlign.right,
          ),
        ),
      ]),
    );
  }

  pw.Widget _slipCell(String text, pw.Font font, PdfColor color,
      {bool center = false, bool right = false}) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(horizontal: 3, vertical: 2.5),
      child: pw.Align(
        alignment: center
            ? pw.Alignment.center
            : right
            ? pw.Alignment.centerRight
            : pw.Alignment.centerLeft,
        child: pw.Text(
          text,
          style: pw.TextStyle(font: font, fontSize: 7, color: color),
        ),
      ),
    );
  }

  String _formatMonth(String month) {
    final parts = month.split('-');
    if (parts.length != 2) return month;
    const names = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    final m = int.tryParse(parts[1]);
    if (m == null || m < 1 || m > 12) return month;
    return '${names[m - 1]} ${parts[0]}';
  }

  bool _isOverdue(MonthlyFeeModel fee) {
    if (fee.dueDate == null || fee.remaining <= 0) return false;
    return DateTime.now().isAfter(fee.dueDate!);
  }

  Widget _moneyField(String key, {bool readOnly = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: TextFormField(
        controller: _feeCtrls[key],
        readOnly: readOnly,
        keyboardType: const TextInputType.numberWithOptions(decimal: true),
        decoration: InputDecoration(
          labelText: _feeFields[key],
          prefixIcon: const Icon(Icons.currency_rupee),
        ),
      ),
    );
  }

  Widget _stat(String label, String value) {
    return Column(
      children: [
        Text(value,
            style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w800,
                fontSize: 16)),
        const SizedBox(height: 2),
        Text(label,
            style: TextStyle(
                color: Colors.white.withValues(alpha: 0.8), fontSize: 10)),
      ],
    );
  }

  void _previousMonth() {
    setState(() {
      _selectedMonth =
          DateTime(_selectedMonth.year, _selectedMonth.month - 1);
    });
    _load();
  }

  void _nextMonth() {
    setState(() {
      _selectedMonth =
          DateTime(_selectedMonth.year, _selectedMonth.month + 1);
    });
    _load();
  }

  void _error(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppColors.error,
      ),
    );
  }

  void _success(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppColors.success,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final name = _student?.name ?? 'Student';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('Fees — $name'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      body: _loading
          ? const LoadingWidget(message: 'Loading fee details...')
          : _fee == null
          ? const Center(child: Text('Fee record not found'))
          : RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Card(
              color: AppColors.primary,
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment:
                      MainAxisAlignment.spaceBetween,
                      children: [
                        IconButton(
                          onPressed: _previousMonth,
                          icon: const Icon(Icons.chevron_left,
                              color: Colors.white),
                        ),
                        Column(
                          children: [
                            const Text('FEE MONTH',
                                style: TextStyle(
                                    color: Colors.white70,
                                    fontSize: 10)),
                            Text(_formatMonth(_fee!.month),
                                style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 18,
                                    fontWeight: FontWeight.w800)),
                          ],
                        ),
                        IconButton(
                          onPressed: _nextMonth,
                          icon: const Icon(Icons.chevron_right,
                              color: Colors.white),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment:
                      MainAxisAlignment.spaceAround,
                      children: [
                        _stat('Total Due',
                            AppUtils.formatCurrency(_demandTotal)),
                        _stat('Paid',
                            AppUtils.formatCurrency(_fee!.paidAmount)),
                        _stat('Remaining',
                            AppUtils.formatCurrency(_remaining)),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 14),

            Card(
              child: Padding(
                padding: const EdgeInsets.all(15),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.settings_outlined,
                            color: AppColors.primary),
                        SizedBox(width: 8),
                        Text(
                          'Fee Structure',
                          style: TextStyle(
                              fontWeight: FontWeight.w800,
                              fontSize: 16),
                        ),
                      ],
                    ),
                    const SizedBox(height: 5),
                    const Text(
                      'Set once — Tuition/Transport/Game auto-fill every '
                          'new month, and Late Fine is calculated automatically '
                          'past the due day.',
                      style: TextStyle(
                          fontSize: 11,
                          color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: 13),
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _fsTuitionCtrl,
                            keyboardType: const TextInputType
                                .numberWithOptions(decimal: true),
                            decoration: const InputDecoration(
                              labelText: 'Tuition Fee / Month *',
                              prefixIcon:
                              Icon(Icons.currency_rupee),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: TextFormField(
                            controller: _fsTransportCtrl,
                            keyboardType: const TextInputType
                                .numberWithOptions(decimal: true),
                            decoration: const InputDecoration(
                              labelText: 'Transport Fee / Month',
                              prefixIcon:
                              Icon(Icons.currency_rupee),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _fsGameCtrl,
                            keyboardType: const TextInputType
                                .numberWithOptions(decimal: true),
                            decoration: const InputDecoration(
                              labelText: 'Game Fee / Month',
                              prefixIcon:
                              Icon(Icons.currency_rupee),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: TextFormField(
                            controller: _fsFineCtrl,
                            keyboardType: const TextInputType
                                .numberWithOptions(decimal: true),
                            decoration: const InputDecoration(
                              labelText: 'Late Fine / Day',
                              prefixIcon:
                              Icon(Icons.currency_rupee),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    DropdownButtonFormField<int>(
                      initialValue: _fsDueDay,
                      decoration: const InputDecoration(
                        labelText: 'Due Day of Month',
                        prefixIcon: Icon(Icons.event_repeat),
                      ),
                      items: _kDueDayOptions
                          .map((d) => DropdownMenuItem(
                        value: d,
                        child: Text('${d}th'),
                      ))
                          .toList(),
                      onChanged: (v) => setState(
                              () => _fsDueDay = v ?? _fsDueDay),
                    ),
                    const SizedBox(height: 13),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: _savingStructure
                            ? null
                            : _saveFeeStructure,
                        icon: _savingStructure
                            ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                                color: Colors.white,
                                strokeWidth: 2))
                            : const Icon(Icons.save_outlined),
                        label: Text(_savingStructure
                            ? 'Saving...'
                            : 'Save Fee Structure'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 14),

            Card(
              child: Padding(
                padding: const EdgeInsets.all(15),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.receipt_long,
                            color: AppColors.primary),
                        SizedBox(width: 8),
                        Text(
                          'Fee Particulars',
                          style: TextStyle(
                              fontWeight: FontWeight.w800,
                              fontSize: 16),
                        ),
                      ],
                    ),
                    const SizedBox(height: 5),
                    const Text(
                      'Previous Dues is automatic from the previous month.',
                      style: TextStyle(
                          fontSize: 11,
                          color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: 13),
                    _moneyField('admissionFee'),
                    _moneyField('tuitionFee'),
                    _moneyField('examinationFee'),
                    _moneyField('previousDue', readOnly: true),
                    _moneyField('gameFee'),
                    _moneyField('reAdmissionFee'),
                    _moneyField('developmentFee'),
                    _moneyField('schoolIdFee'),
                    _moneyField('tieBagBeltFee'),
                    _moneyField('backDues'),
                    _moneyField('transportFee'),
                    _moneyField('otherFee'),
                    _moneyField('lateFine', readOnly: true),
                    const Divider(),
                    Row(
                      mainAxisAlignment:
                      MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('TOTAL',
                            style: TextStyle(
                                fontWeight: FontWeight.w900)),
                        Text(
                          AppUtils.formatCurrency(_demandTotal),
                          style: const TextStyle(
                              fontWeight: FontWeight.w900,
                              fontSize: 18),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: _saving ? null : _saveDemand,
                        icon: const Icon(Icons.save_outlined),
                        label: const Text('Save Fee Particulars'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 14),

            Card(
              child: Padding(
                padding: const EdgeInsets.all(15),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.event_busy,
                            color: AppColors.warning),
                        SizedBox(width: 8),
                        Text('Due Date',
                            style: TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 16)),
                      ],
                    ),
                    const SizedBox(height: 10),
                    OutlinedButton.icon(
                      onPressed: _setDueDate,
                      icon: const Icon(Icons.calendar_month),
                      label: Text(
                        _fee!.dueDate == null
                            ? 'Set Due Date'
                            : '${_fee!.dueDate!.day.toString().padLeft(2, '0')}-'
                            '${_fee!.dueDate!.month.toString().padLeft(2, '0')}-'
                            '${_fee!.dueDate!.year}',
                      ),
                    ),
                    if (_isOverdue(_fee!))
                      const Text(
                        'OVERDUE',
                        style: TextStyle(
                            color: AppColors.error,
                            fontWeight: FontWeight.w800),
                      ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 14),

            Card(
              child: Padding(
                padding: const EdgeInsets.all(15),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.add_card,
                            color: AppColors.success),
                        SizedBox(width: 8),
                        Text('Add Payment',
                            style: TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 16)),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      'Remaining: ${AppUtils.formatCurrency(_remaining)}',
                      style: const TextStyle(
                          fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 10),
                    TextFormField(
                      controller: _paymentCtrl,
                      keyboardType:
                      const TextInputType.numberWithOptions(
                          decimal: true),
                      decoration: const InputDecoration(
                        labelText: 'Payment Amount (₹) *',
                        prefixIcon: Icon(Icons.currency_rupee),
                      ),
                    ),
                    const SizedBox(height: 10),
                    DropdownButtonFormField<String>(
                      initialValue: _paymentMode,
                      decoration: const InputDecoration(
                        labelText: 'Payment Mode',
                        prefixIcon: Icon(Icons.payment),
                      ),
                      items: _modes
                          .map((m) => DropdownMenuItem(
                        value: m,
                        child: Text(m),
                      ))
                          .toList(),
                      onChanged: (v) => setState(() {
                        _paymentMode = v ?? 'Cash';
                      }),
                    ),
                    const SizedBox(height: 10),
                    TextFormField(
                      controller: _remarksCtrl,
                      decoration: const InputDecoration(
                          labelText: 'Remarks (optional)'),
                    ),
                    const SizedBox(height: 13),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: _saving || _remaining <= 0
                            ? null
                            : _addPayment,
                        icon: _saving
                            ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                                color: Colors.white,
                                strokeWidth: 2))
                            : const Icon(Icons.receipt_long),
                        label: Text(
                          _saving
                              ? 'Saving...'
                              : 'Cut Receipt / Record Payment',
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}