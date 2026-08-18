import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:uuid/uuid.dart';
import '../../core/constants/app_colors.dart';
import '../../data/models/result_model.dart';
import '../../data/models/student_model.dart';
import '../../data/services/database_service.dart';
import '../../data/services/providers.dart';
import '../../widgets/common_widgets.dart';


class ResultScreen extends ConsumerStatefulWidget {
  final String studentId;
  const ResultScreen({super.key, required this.studentId});

  @override
  ConsumerState<ResultScreen> createState() => _ResultScreenState();
}

class _ResultScreenState extends ConsumerState<ResultScreen> {
  final _examNameCtrl = TextEditingController();
  List<_SubjectEntry> _subjects = [_SubjectEntry()];
  List<ResultModel> _results = [];
  StudentModel? _student;
  bool _loading = true;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final db = DatabaseService.instance;
    final student = await db.getStudentById(widget.studentId);
    final results = await db.getResultsByStudentId(widget.studentId);
    if (mounted) {
      setState(() {
        _student = student;
        _results = results;
        _loading = false;
      });
    }
  }

  Future<void> _saveResult() async {
    if (_examNameCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter exam name'), backgroundColor: AppColors.error),
      );
      return;
    }
    setState(() => _saving = true);
    try {
      final subjects = _subjects.where((s) => s.nameCtrl.text.isNotEmpty).map((s) {
        return SubjectResult(
          subjectName: s.nameCtrl.text.trim(),
          marks: double.tryParse(s.marksCtrl.text) ?? 0,
          totalMarks: double.tryParse(s.totalCtrl.text) ?? 100,
        );
      }).toList();

      if (subjects.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Add at least one subject'), backgroundColor: AppColors.error),
        );
        setState(() => _saving = false);
        return;
      }

      final result = ResultModel(
        id: const Uuid().v4(),
        studentId: widget.studentId,
        examName: _examNameCtrl.text.trim(),
        subjects: subjects,
        createdAt: DateTime.now(),
      );

      await ref.read(resultNotifierProvider(widget.studentId).notifier).add(result);
      await _load();
      _examNameCtrl.clear();
      setState(() => _subjects = [_SubjectEntry()]);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Result saved!'), backgroundColor: AppColors.success),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _printResult(ResultModel result) async {
    final student = _student;
    if (student == null) return;
    final settings = await DatabaseService.instance.getSettings();

    // Load fonts supporting ₹ and all characters
    final ttf = await PdfGoogleFonts.notoSansRegular();
    final ttfBold = await PdfGoogleFonts.notoSansBold();

    final pdf = pw.Document();
    pdf.addPage(pw.Page(
      pageFormat: PdfPageFormat.a4,
      build: (ctx) => pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Center(
            child: pw.Column(children: [
              pw.Text(settings.instituteName,
                  style: pw.TextStyle(font: ttfBold, fontSize: 20)),
              pw.Text(settings.address, style: pw.TextStyle(font: ttf)),
              pw.SizedBox(height: 8),
              pw.Text('RESULT CARD — ${result.examName}',
                  style: pw.TextStyle(
                      font: ttfBold,
                      fontSize: 16,
                      decoration: pw.TextDecoration.underline)),
            ]),
          ),
          pw.SizedBox(height: 16),
          pw.Divider(),
          _pdfRow('Student Name', student.name, ttf, ttfBold),
          _pdfRow('Student ID', student.studentId, ttf, ttfBold),
          _pdfRow('Admission No.', student.admissionNumber, ttf, ttfBold),
          _pdfRow('Class / Course', student.displayClass, ttf, ttfBold),
          pw.Divider(),
          pw.SizedBox(height: 8),
          pw.Text('Subject-wise Result',
              style: pw.TextStyle(font: ttfBold, fontSize: 13)),
          pw.SizedBox(height: 8),
          pw.Table(
            border: pw.TableBorder.all(),
            columnWidths: {
              0: const pw.FlexColumnWidth(3),
              1: const pw.FlexColumnWidth(1.5),
              2: const pw.FlexColumnWidth(1.5),
              3: const pw.FlexColumnWidth(1.5),
              4: const pw.FlexColumnWidth(1),
            },
            children: [
              pw.TableRow(
                decoration: const pw.BoxDecoration(color: PdfColors.grey300),
                children: ['Subject', 'Marks', 'Total', 'Percentage', 'Grade']
                    .map((h) => pw.Padding(
                  padding: const pw.EdgeInsets.all(6),
                  child: pw.Text(h,
                      style: pw.TextStyle(font: ttfBold, fontSize: 11)),
                ))
                    .toList(),
              ),
              ...result.subjects.map((s) => pw.TableRow(
                children: [
                  s.subjectName,
                  '${s.marks.toInt()}',
                  '${s.totalMarks.toInt()}',
                  '${s.percentage.toStringAsFixed(1)}%',
                  s.grade
                ]
                    .map((v) => pw.Padding(
                  padding: const pw.EdgeInsets.all(6),
                  child: pw.Text(v, style: pw.TextStyle(font: ttf, fontSize: 11)),
                ))
                    .toList(),
              )),
            ],
          ),
          pw.SizedBox(height: 16),
          pw.Divider(),
          _pdfRow('Total Marks',
              '${result.obtainedMarks.toInt()} / ${result.totalMarks.toInt()}',
              ttf, ttfBold),
          _pdfRow('Overall Percentage',
              '${result.overallPercentage.toStringAsFixed(1)}%', ttf, ttfBold),
          _pdfRow('Overall Grade', result.overallGrade, ttf, ttfBold),
          pw.SizedBox(height: 32),
          pw.Row(
            mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
            children: [
              pw.Text('Student Signature', style: pw.TextStyle(font: ttf)),
              pw.Text("Class Teacher's Signature", style: pw.TextStyle(font: ttf)),
              pw.Text("Principal's Signature", style: pw.TextStyle(font: ttf)),
            ],
          ),
        ],
      ),
    ));
    await Printing.layoutPdf(onLayout: (_) => pdf.save());
  }

  pw.Widget _pdfRow(String label, String value, pw.Font ttf, pw.Font ttfBold) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(vertical: 4),
      child: pw.Row(
        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
        children: [
          pw.Text(label, style: pw.TextStyle(font: ttf, fontSize: 11, color: PdfColors.grey700)),
          pw.Text(value, style: pw.TextStyle(font: ttfBold, fontSize: 11)),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(body: LoadingWidget());

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('Results — ${_student?.name ?? ''}'),
        backgroundColor: AppColors.primary,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Add result card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Add New Result', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: AppColors.primary)),
                  const Divider(height: 20),
                  TextFormField(
                    controller: _examNameCtrl,
                    decoration: const InputDecoration(labelText: 'Exam Name *', prefixIcon: Icon(Icons.quiz_outlined)),
                  ),
                  const SizedBox(height: 16),
                  const Text('Subjects', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                  const SizedBox(height: 8),
                  ..._subjects.asMap().entries.map((e) => _SubjectRow(
                    entry: e.value,
                    index: e.key,
                    onRemove: _subjects.length > 1 ? () => setState(() => _subjects.removeAt(e.key)) : null,
                  )),
                  TextButton.icon(
                    onPressed: () => setState(() => _subjects.add(_SubjectEntry())),
                    icon: const Icon(Icons.add),
                    label: const Text('Add Subject'),
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _saving ? null : _saveResult,
                      icon: _saving
                          ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : const Icon(Icons.save_rounded),
                      label: Text(_saving ? 'Saving...' : 'Save Result'),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),

          if (_results.isNotEmpty) ...[
            const Text('Previous Results', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
            const SizedBox(height: 10),
            ..._results.map((r) => Card(
              margin: const EdgeInsets.only(bottom: 10),
              child: Column(
                children: [
                  ListTile(
                    title: Row(
                      children: [
                        Expanded(
                          child: Text(r.examName,
                              style: const TextStyle(fontWeight: FontWeight.w700)),
                        ),
                      ],
                    ),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Student name shown clearly
                        Text(
                          _student?.name ?? '',
                          style: const TextStyle(
                              fontWeight: FontWeight.w600,
                              color: AppColors.primary,
                              fontSize: 13),
                        ),
                        Text(
                          'Score: ${r.obtainedMarks.toInt()}/${r.totalMarks.toInt()} | ${r.overallPercentage.toStringAsFixed(1)}% | Grade: ${r.overallGrade}',
                        ),
                      ],
                    ),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton(
                          icon: const Icon(Icons.print_outlined, color: AppColors.primary),
                          onPressed: () => _printResult(r),
                          tooltip: 'Print',
                        ),
                        IconButton(
                          icon: const Icon(Icons.delete_outline, color: AppColors.error),
                          onPressed: () async {
                            await ref.read(resultNotifierProvider(widget.studentId).notifier).remove(r.id);
                            _load();
                          },
                          tooltip: 'Delete',
                        ),
                      ],
                    ),
                    isThreeLine: true,
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                    child: Table(
                      border: TableBorder.all(
                          color: AppColors.border, borderRadius: BorderRadius.circular(4)),
                      columnWidths: const {
                        0: FlexColumnWidth(3),
                        1: FlexColumnWidth(1.5),
                        2: FlexColumnWidth(1.5),
                        3: FlexColumnWidth(1),
                      },
                      children: [
                        const TableRow(
                          decoration: BoxDecoration(color: AppColors.primary),
                          children: [
                            _TableCell('Subject', isHeader: true),
                            _TableCell('Marks', isHeader: true),
                            _TableCell('Total', isHeader: true),
                            _TableCell('Grade', isHeader: true),
                          ],
                        ),
                        ...r.subjects.asMap().entries.map((e) => TableRow(
                          decoration: BoxDecoration(
                            color: e.key.isEven
                                ? Colors.white
                                : AppColors.surfaceVariant,
                          ),
                          children: [
                            _TableCell(e.value.subjectName),
                            _TableCell('${e.value.marks.toInt()}'),
                            _TableCell('${e.value.totalMarks.toInt()}'),
                            _TableCell(e.value.grade,
                                gradeColor: _gradeColor(e.value.grade)),
                          ],
                        )),
                      ],
                    ),
                  ),
                ],
              ),
            )),
          ] else
            const EmptyState(icon: Icons.assignment_outlined, title: 'No Results Yet', subtitle: 'Add a result above'),
          const SizedBox(height: 40),
        ],
      ),
    );
  }
}

class _TableCell extends StatelessWidget {
  final String text;
  final bool isHeader;
  final Color? gradeColor;
  const _TableCell(this.text, {this.isHeader = false, this.gradeColor});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 13,
          fontWeight: isHeader ? FontWeight.w700 : FontWeight.w500,
          color: isHeader
              ? Colors.white
              : (gradeColor ?? const Color(0xFF212121)),
        ),
      ),
    );
  }
}

Color _gradeColor(String grade) {
  switch (grade) {
    case 'A+': case 'A': return AppColors.success;
    case 'B': return AppColors.secondary;
    case 'C': return AppColors.warning;
    case 'D': return Colors.orange;
    default: return AppColors.error;
  }
}

class _SubjectEntry {
  final nameCtrl = TextEditingController();
  final marksCtrl = TextEditingController();
  final totalCtrl = TextEditingController(text: '100');
}

class _SubjectRow extends StatelessWidget {
  final _SubjectEntry entry;
  final int index;
  final VoidCallback? onRemove;

  const _SubjectRow({required this.entry, required this.index, this.onRemove});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Expanded(
            flex: 3,
            child: TextFormField(
              controller: entry.nameCtrl,
              decoration: InputDecoration(labelText: 'Subject ${index + 1}'),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            flex: 2,
            child: TextFormField(
              controller: entry.marksCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Marks'),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            flex: 2,
            child: TextFormField(
              controller: entry.totalCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Total'),
            ),
          ),
          if (onRemove != null)
            IconButton(
              icon: const Icon(Icons.remove_circle_outline, color: AppColors.error),
              onPressed: onRemove,
            ),
        ],
      ),
    );
  }
}