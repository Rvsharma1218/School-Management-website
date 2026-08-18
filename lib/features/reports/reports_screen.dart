import 'package:flutter/material.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:excel/excel.dart';

import '../../core/constants/app_routes.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/app_utils.dart';
import '../../core/utils/file_saver.dart';
import '../../data/services/database_service.dart';
import '../../data/services/import_service.dart';
import '../../data/services/session_service.dart';
import '../../widgets/responsive_web_layout.dart';

// Same folder relative imports
import 'complete_export_service.dart';
import 'import_screen.dart';

class ReportsScreen extends StatelessWidget {
  const ReportsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isPrincipal = SessionService.instance.isPrincipal;
    final isDesktop = MediaQuery.of(context).size.width >= 850;

    final content = Scaffold(
      backgroundColor: cs.surface,
      appBar: isDesktop ? null : AppBar(
        title: const Text('Reports'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // ── Student List Report ──────────────────────────────────────────
          _ReportCard(
            icon: Icons.people_alt_rounded,
            title: 'Student List Report',
            subtitle: 'Export all student details',
            color: AppColors.primary,
            onExcelTap: () => _exportStudentExcel(context),
            onPdfTap: () => _exportStudentPdf(context),
          ),
          const SizedBox(height: 12),

          // ── Fees Report (Principal Only) ─────────────────────────────────
          if (isPrincipal) ...[
            _ReportCard(
              icon: Icons.account_balance_wallet_rounded,
              title: 'Fees Report',
              subtitle: 'Export fees collection & pending',
              color: AppColors.secondary,
              onExcelTap: () => _exportFeesExcel(context),
              onPdfTap: () => _exportFeesPdf(context),
            ),
            const SizedBox(height: 12),
          ],

          // ── Attendance Report ────────────────────────────────────────────
          _ReportCard(
            icon: Icons.how_to_reg_rounded,
            title: 'Attendance Report',
            subtitle: 'Export monthly attendance data',
            color: AppColors.warning,
            onExcelTap: () => _exportAttendanceExcel(context),
            onPdfTap: null,
          ),
          const SizedBox(height: 12),

          // ── Complete Student Data (Principal Only) ───────────────────────
          if (isPrincipal)
            _CompleteDataCard(
              onExcelExport: () => _exportCompleteExcel(context),
              onPdfExport: () => _exportCompletePdf(context),
              onExcelImport: () => Navigator.push(context,
                  MaterialPageRoute(builder: (_) => const ImportScreen(initialTab: 0))),
              onPdfImport: () => Navigator.push(context,
                  MaterialPageRoute(builder: (_) => const ImportScreen(initialTab: 1))),
              onTemplate: () => _downloadTemplate(context),
            ),
        ],
      ),
    );

    if (isDesktop) {
      return ResponsiveWebLayout(
        title: 'All Reports & Export',
        currentRoute: AppRoutes.reports,
        body: content,
      );
    }

    return content;
  }

  // ─── Helpers & Export methods ─────────────────────────────────────────────

  Future<(pw.Font, pw.Font)> _loadFonts() async {
    final regular = await PdfGoogleFonts.notoSansRegular();
    final bold = await PdfGoogleFonts.notoSansBold();
    return (regular, bold);
  }

  String _rs(double amount) => '\u20B9${amount.toInt()}';

  void _showLoading(BuildContext context, {String message = 'Generating report...'}) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => AlertDialog(
        content: Row(
          children: [
            const CircularProgressIndicator(),
            const SizedBox(width: 16),
            Text(message),
          ],
        ),
      ),
    );
  }

  Future<void> _exportStudentExcel(BuildContext context) async {
    try {
      _showLoading(context);
      final students = await DatabaseService.instance.getAllStudents();
      final excel = Excel.createExcel();
      final sheet = excel['Students'];
      sheet.appendRow([
        TextCellValue('Admission No'), TextCellValue('Student ID'), TextCellValue('Name'),
        TextCellValue("Father's Name"), TextCellValue('Mobile'), TextCellValue('Type'),
        TextCellValue('Class/Course'), TextCellValue('Status'), TextCellValue('Admission Date'),
      ]);
      for (final s in students) {
        sheet.appendRow([
          TextCellValue(s.admissionNumber), TextCellValue(s.studentId), TextCellValue(s.name),
          TextCellValue(s.fatherName), TextCellValue(s.mobile), TextCellValue(s.studentType),
          TextCellValue(s.displayClass), TextCellValue(s.statusLabel),
          TextCellValue(AppUtils.formatDate(s.admissionDate)),
        ]);
      }
      final bytes = excel.encode()!;
      if (!context.mounted) return;
      Navigator.pop(context);
      final ts = DateTime.now().toIso8601String().substring(0, 10);
      await FileSaver.showSaveShareSheet(
        context,
        bytes: bytes,
        filename: 'students_report_$ts.xlsx',
        subject: 'Student List Report',
        icon: Icons.people_alt_rounded,
        color: AppColors.primary,
      );
    } catch (e) {
      if (context.mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error),
        );
      }
    }
  }

  Future<void> _exportStudentPdf(BuildContext context) async {
    try {
      _showLoading(context);
      final students = await DatabaseService.instance.getAllStudents();
      final settings = await DatabaseService.instance.getSettings();
      final (regular, bold) = await _loadFonts();

      final pdf = pw.Document();
      pdf.addPage(pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        theme: pw.ThemeData.withFont(base: regular, bold: bold),
        build: (ctx) => [
          pw.Center(
            child: pw.Column(children: [
              pw.Text(settings.instituteName,
                  style: pw.TextStyle(font: bold, fontSize: 18)),
              pw.Text('Student List Report',
                  style: pw.TextStyle(font: regular, fontSize: 14)),
              pw.SizedBox(height: 8),
            ]),
          ),
          pw.TableHelper.fromTextArray(
            headers: ['Adm No', 'Student ID', 'Name', "Father's Name", 'Mobile', 'Type', 'Class/Course', 'Status'],
            data: students.map((s) => [
              s.admissionNumber, s.studentId, s.name, s.fatherName,
              s.mobile, s.studentType, s.displayClass, s.statusLabel,
            ]).toList(),
            headerStyle: pw.TextStyle(font: bold, fontSize: 9),
            headerDecoration: const pw.BoxDecoration(color: PdfColors.indigo100),
            cellHeight: 25,
            cellStyle: pw.TextStyle(font: regular, fontSize: 8),
          ),
          pw.SizedBox(height: 10),
          pw.Text('Total Students: ${students.length}',
              style: pw.TextStyle(font: bold, fontSize: 10)),
        ],
      ));
      if (context.mounted) Navigator.pop(context);
      await Printing.layoutPdf(onLayout: (_) => pdf.save());
    } catch (e) {
      if (context.mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error),
        );
      }
    }
  }

  Future<void> _exportFeesExcel(BuildContext context) async {
    try {
      _showLoading(context);
      final students = await DatabaseService.instance.getAllStudents();
      final excel = Excel.createExcel();
      final sheet = excel['Fees'];
      sheet.appendRow([
        TextCellValue('Student Name'), TextCellValue('Student ID'), TextCellValue('Total Fees (INR)'),
        TextCellValue('Paid Fees (INR)'), TextCellValue('Remaining (INR)'), TextCellValue('Status'),
      ]);
      for (final s in students) {
        final fee = await DatabaseService.instance.getFeeByStudentId(s.id);
        if (fee != null) {
          sheet.appendRow([
            TextCellValue(s.name), TextCellValue(s.studentId),
            DoubleCellValue(fee.totalFees), DoubleCellValue(fee.paidFees),
            DoubleCellValue(fee.remainingFees), TextCellValue(fee.feeStatus),
          ]);
        }
      }
      final bytes = excel.encode()!;
      if (!context.mounted) return;
      Navigator.pop(context);
      final ts = DateTime.now().toIso8601String().substring(0, 10);
      await FileSaver.showSaveShareSheet(
        context,
        bytes: bytes,
        filename: 'fees_report_$ts.xlsx',
        subject: 'Fees Report',
        icon: Icons.account_balance_wallet_rounded,
        color: AppColors.secondary,
      );
    } catch (e) {
      if (context.mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error),
        );
      }
    }
  }

  Future<void> _exportFeesPdf(BuildContext context) async {
    try {
      _showLoading(context);
      final students = await DatabaseService.instance.getAllStudents();
      final settings = await DatabaseService.instance.getSettings();
      final (regular, bold) = await _loadFonts();

      final rows = <List<String>>[];
      double totalPending = 0, totalCollected = 0;
      for (final s in students) {
        final fee = await DatabaseService.instance.getFeeByStudentId(s.id);
        if (fee != null) {
          rows.add([
            s.name, s.studentId,
            _rs(fee.totalFees), _rs(fee.paidFees), _rs(fee.remainingFees),
            fee.feeStatus,
          ]);
          totalPending += fee.remainingFees;
          totalCollected += fee.paidFees;
        }
      }

      final pdf = pw.Document();
      pdf.addPage(pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        theme: pw.ThemeData.withFont(base: regular, bold: bold),
        build: (ctx) => [
          pw.Center(
            child: pw.Column(children: [
              pw.Text(settings.instituteName,
                  style: pw.TextStyle(font: bold, fontSize: 18)),
              pw.Text('Fees Report',
                  style: pw.TextStyle(font: regular, fontSize: 14)),
              pw.SizedBox(height: 8),
            ]),
          ),
          pw.TableHelper.fromTextArray(
            headers: ['Name', 'ID', 'Total', 'Paid', 'Remaining', 'Status'],
            data: rows,
            headerStyle: pw.TextStyle(font: bold, fontSize: 9),
            headerDecoration: const pw.BoxDecoration(color: PdfColors.teal100),
            cellStyle: pw.TextStyle(font: regular, fontSize: 9),
          ),
          pw.SizedBox(height: 12),
          pw.Container(
            padding: const pw.EdgeInsets.all(10),
            decoration: const pw.BoxDecoration(
              color: PdfColors.grey100,
              borderRadius: pw.BorderRadius.all(pw.Radius.circular(6)),
            ),
            child: pw.Row(children: [
              pw.Expanded(
                child: pw.Text(
                  'Total Collected: ${_rs(totalCollected)}',
                  style: pw.TextStyle(font: bold, fontSize: 11, color: PdfColors.green700),
                ),
              ),
              pw.Expanded(
                child: pw.Text(
                  'Total Pending: ${_rs(totalPending)}',
                  style: pw.TextStyle(font: bold, fontSize: 11, color: PdfColors.orange700),
                ),
              ),
            ]),
          ),
        ],
      ));
      if (context.mounted) Navigator.pop(context);
      await Printing.layoutPdf(onLayout: (_) => pdf.save());
    } catch (e) {
      if (context.mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error),
        );
      }
    }
  }

  Future<void> _exportAttendanceExcel(BuildContext context) async {
    try {
      _showLoading(context);
      final students = await DatabaseService.instance.getAllStudents();
      final excel = Excel.createExcel();
      final sheet = excel['Attendance'];
      sheet.appendRow([
        TextCellValue('Name'), TextCellValue('Student ID'), TextCellValue('Total Days'),
        TextCellValue('Present'), TextCellValue('Absent'), TextCellValue('Leave'), TextCellValue('Percentage'),
      ]);
      for (final s in students) {
        final summary = await DatabaseService.instance.getAttendanceSummary(s.id);
        final total = summary['total'] ?? 0;
        final present = summary['present'] ?? 0;
        final pct = total > 0 ? (present / total * 100).toStringAsFixed(1) : '0.0';
        sheet.appendRow([
          TextCellValue(s.name), TextCellValue(s.studentId), IntCellValue(total),
          IntCellValue(present), IntCellValue(summary['absent'] ?? 0),
          IntCellValue(summary['leave'] ?? 0), TextCellValue('$pct%'),
        ]);
      }
      final bytes = excel.encode()!;
      if (!context.mounted) return;
      Navigator.pop(context);
      final ts = DateTime.now().toIso8601String().substring(0, 10);
      await FileSaver.showSaveShareSheet(
        context,
        bytes: bytes,
        filename: 'attendance_report_$ts.xlsx',
        subject: 'Attendance Report',
        icon: Icons.how_to_reg_rounded,
        color: AppColors.warning,
      );
    } catch (e) {
      if (context.mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error),
        );
      }
    }
  }

  Future<void> _exportCompleteExcel(BuildContext context) async {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => const _ProgressDialog(message: 'Exporting complete data...'),
    );
    try {
      final (bytes, filename) = await CompleteExportService.instance.exportCompleteExcel();
      if (!context.mounted) return;
      Navigator.pop(context);

      await FileSaver.showSaveShareSheet(
        context,
        bytes: bytes,
        filename: filename,
        subject: 'Complete Student Data',
        icon: Icons.table_chart_rounded,
        color: AppColors.primary,
      );
    } catch (e) {
      if (context.mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Export failed: $e'), backgroundColor: AppColors.error),
        );
      }
    }
  }

  Future<void> _exportCompletePdf(BuildContext context) async {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => const _ProgressDialog(message: 'Building PDF report...'),
    );
    try {
      final (bytes, filename) = await CompleteExportService.instance.exportCompletePdf();
      if (!context.mounted) return;
      Navigator.pop(context);

      await FileSaver.showSaveShareSheet(
        context,
        bytes: bytes,
        filename: filename,
        subject: 'Complete Student Data',
        icon: Icons.picture_as_pdf_rounded,
        color: AppColors.error,
      );
    } catch (e) {
      if (context.mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Export failed: $e'), backgroundColor: AppColors.error),
        );
      }
    }
  }

  Future<void> _downloadTemplate(BuildContext context) async {
    _showLoading(context, message: 'Creating template...');
    try {
      final bytes = await ImportService.instance.buildImportTemplateBytes();
      if (!context.mounted) return;
      Navigator.pop(context);
      await FileSaver.showSaveShareSheet(
        context,
        bytes: bytes,
        filename: 'student_import_template.xlsx',
        subject: 'Student Import Template',
        icon: Icons.table_chart_rounded,
        color: const Color(0xFF4A148C),
      );
    } catch (e) {
      if (context.mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error),
        );
      }
    }
  }
}

class _ProgressDialog extends StatelessWidget {
  final String message;
  const _ProgressDialog({required this.message});

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      content: Row(children: [
        const CircularProgressIndicator(),
        const SizedBox(width: 16),
        Expanded(child: Text(message)),
      ]),
    );
  }
}

class _CompleteDataCard extends StatelessWidget {
  final VoidCallback onExcelExport;
  final VoidCallback onPdfExport;
  final VoidCallback onExcelImport;
  final VoidCallback onPdfImport;
  final VoidCallback onTemplate;

  const _CompleteDataCard({
    required this.onExcelExport,
    required this.onPdfExport,
    required this.onExcelImport,
    required this.onPdfImport,
    required this.onTemplate,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Card(
      color: cs.surface,
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF4A148C), Color(0xFF7B1FA2)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.dataset_rounded, color: Colors.white, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Complete Student Data',
                        style: TextStyle(fontWeight: FontWeight.w700,
                            fontSize: 15, color: cs.onSurface)),
                    Text('Export/Import all student info',
                        style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant)),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF4A148C).withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text('NEW',
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800,
                        color: Color(0xFF4A148C))),
              ),
            ]),
            const SizedBox(height: 14),
            const Divider(height: 1),
            const SizedBox(height: 12),

            Text('📊 Export',
                style: TextStyle(fontWeight: FontWeight.w700,
                    fontSize: 13, color: cs.onSurface)),
            const SizedBox(height: 8),
            Row(children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: onExcelExport,
                  icon: const Icon(Icons.table_chart_rounded, size: 18),
                  label: const Text('Export Excel', style: TextStyle(fontSize: 13)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green.shade700,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 10),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: onPdfExport,
                  icon: const Icon(Icons.picture_as_pdf_rounded, size: 18),
                  label: const Text('Export PDF', style: TextStyle(fontSize: 13)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.red.shade700,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 10),
                  ),
                ),
              ),
            ]),
            const SizedBox(height: 12),

            Text('📥 Import',
                style: TextStyle(fontWeight: FontWeight.w700,
                    fontSize: 13, color: cs.onSurface)),
            const SizedBox(height: 8),
            Row(children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: onExcelImport,
                  icon: const Icon(Icons.upload_file_rounded, size: 18),
                  label: const Text('Import Excel', style: TextStyle(fontSize: 13)),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.green.shade700,
                    side: BorderSide(color: Colors.green.shade400),
                    padding: const EdgeInsets.symmetric(vertical: 10),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: onPdfImport,
                  icon: const Icon(Icons.picture_as_pdf_outlined, size: 18),
                  label: const Text('Import PDF', style: TextStyle(fontSize: 13)),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.red.shade700,
                    side: BorderSide(color: Colors.red.shade300),
                    padding: const EdgeInsets.symmetric(vertical: 10),
                  ),
                ),
              ),
            ]),
            const SizedBox(height: 10),

            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: onTemplate,
                icon: const Icon(Icons.download_rounded, size: 18),
                label: const Text('Download Import Template'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFF4A148C),
                  side: const BorderSide(color: Color(0xFF4A148C)),
                  padding: const EdgeInsets.symmetric(vertical: 10),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ReportCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final VoidCallback? onExcelTap;
  final VoidCallback? onPdfTap;

  const _ReportCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    this.onExcelTap,
    this.onPdfTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Card(
      color: cs.surface,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(icon, color: color, size: 24),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title,
                          style: TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 15,
                              color: cs.onSurface)),
                      Text(subtitle,
                          style: TextStyle(
                              fontSize: 12, color: cs.onSurfaceVariant)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                if (onExcelTap != null)
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: onExcelTap,
                      icon: const Icon(Icons.table_chart_outlined, size: 18),
                      label: const Text('Excel'),
                      style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green.shade700,
                          foregroundColor: Colors.white),
                    ),
                  ),
                if (onExcelTap != null && onPdfTap != null)
                  const SizedBox(width: 10),
                if (onPdfTap != null)
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: onPdfTap,
                      icon: const Icon(Icons.picture_as_pdf_outlined, size: 18),
                      label: const Text('PDF'),
                      style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.red.shade700,
                          side: BorderSide(color: Colors.red.shade300)),
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}