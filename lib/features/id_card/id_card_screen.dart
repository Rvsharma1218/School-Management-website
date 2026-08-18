import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'dart:io';
import '../../core/constants/app_colors.dart';
import '../../core/utils/app_utils.dart';
import '../../data/models/student_model.dart';
import '../../data/services/database_service.dart';
import '../../widgets/common_widgets.dart';

class IdCardScreen extends StatefulWidget {
  final String studentId;
  const IdCardScreen({super.key, required this.studentId});

  @override
  State<IdCardScreen> createState() => _IdCardScreenState();
}

class _IdCardScreenState extends State<IdCardScreen> {
  StudentModel? _student;
  bool _loading = true;
  String _instituteName = 'My School & Institute';
  String _address = '';
  String _phone = '';
  bool _showFront = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final db = DatabaseService.instance;
    final student = await db.getStudentById(widget.studentId);
    final settings = await db.getSettings();
    if (mounted) {
      setState(() {
        _student = student;
        _instituteName = settings.instituteName;
        _address = settings.address;
        _phone = settings.mobile;
        _loading = false;
      });
    }
  }

  Future<void> _printIdCard() async {
    final student = _student;
    if (student == null) return;

    final pdf = pw.Document();

    // Front Page
    pdf.addPage(pw.Page(
      pageFormat: const PdfPageFormat(85.6 * PdfPageFormat.mm, 54 * PdfPageFormat.mm),
      margin: pw.EdgeInsets.zero,
      build: (ctx) => pw.Container(
        decoration: pw.BoxDecoration(
          gradient: pw.LinearGradient(
            colors: [PdfColor.fromHex('#0A1128'), PdfColor.fromHex('#1C2541')],
            begin: pw.Alignment.topLeft,
            end: pw.Alignment.bottomRight,
          ),
        ),
        child: pw.Column(
          children: [
            // Top Accent Bar
            pw.Container(
              width: double.infinity,
              padding: const pw.EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: pw.BoxDecoration(
                color: PdfColor.fromHex('#FFD700'),
              ),
              child: pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Text('OFFICIAL STUDENT ID',
                      style: pw.TextStyle(fontSize: 6, fontWeight: pw.FontWeight.bold, color: PdfColor.fromHex('#0A1128'))),
                  pw.Text('SESSION 2026-27',
                      style: pw.TextStyle(fontSize: 6, fontWeight: pw.FontWeight.bold, color: PdfColor.fromHex('#0A1128'))),
                ],
              ),
            ),
            // Header
            pw.Container(
              width: double.infinity,
              padding: const pw.EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              color: PdfColor.fromHex('#0A1128'),
              child: pw.Column(
                children: [
                  pw.Text(_instituteName.toUpperCase(),
                      style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold, color: PdfColors.white),
                      textAlign: pw.TextAlign.center),
                  pw.Text(_address,
                      style: pw.TextStyle(fontSize: 6, color: PdfColor.fromHex('#FFD700')),
                      textAlign: pw.TextAlign.center),
                ],
              ),
            ),
            pw.Divider(height: 1, color: PdfColor.fromHex('#FFD700')),
            // Body
            pw.Expanded(
              child: pw.Padding(
                padding: const pw.EdgeInsets.all(6),
                child: pw.Row(
                  children: [
                    // Photo
                    pw.Column(
                      mainAxisAlignment: pw.MainAxisAlignment.center,
                      children: [
                        pw.Container(
                          width: 44,
                          height: 52,
                          decoration: pw.BoxDecoration(
                            border: pw.Border.all(color: PdfColor.fromHex('#FFD700'), width: 1.5),
                            borderRadius: const pw.BorderRadius.all(pw.Radius.circular(4)),
                          ),
                          child: student.photoPath != null
                              ? pw.Image(pw.MemoryImage(File(student.photoPath!).readAsBytesSync()), fit: pw.BoxFit.cover)
                              : pw.Center(child: pw.Text(AppUtils.getInitials(student.name),
                                  style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold, color: PdfColors.white))),
                        ),
                        pw.SizedBox(height: 2),
                        pw.Container(
                          padding: const pw.EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                          decoration: pw.BoxDecoration(
                            color: PdfColor.fromHex('#FFD700'),
                            borderRadius: const pw.BorderRadius.all(pw.Radius.circular(4)),
                          ),
                          child: pw.Text('STUDENT', style: pw.TextStyle(fontSize: 5, fontWeight: pw.FontWeight.bold, color: PdfColor.fromHex('#0A1128'))),
                        ),
                      ],
                    ),
                    pw.SizedBox(width: 6),
                    // Details
                    pw.Expanded(
                      child: pw.Column(
                        mainAxisAlignment: pw.MainAxisAlignment.center,
                        crossAxisAlignment: pw.CrossAxisAlignment.start,
                        children: [
                          pw.Text(student.name.toUpperCase(),
                              style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold, color: PdfColors.white)),
                          pw.SizedBox(height: 2),
                          _pdfLabelRow('ID NO', student.studentId),
                          _pdfLabelRow('ADM NO', student.admissionNumber),
                          _pdfLabelRow(student.studentType == 'school' ? 'CLASS' : 'COURSE', student.displayClass),
                          _pdfLabelRow('FATHER', student.fatherName),
                          _pdfLabelRow('MOBILE', student.mobile),
                        ],
                      ),
                    ),
                    // QR Code
                    pw.Column(
                      mainAxisAlignment: pw.MainAxisAlignment.center,
                      children: [
                        pw.Container(
                          padding: const pw.EdgeInsets.all(2),
                          decoration: pw.BoxDecoration(
                            color: PdfColors.white,
                            borderRadius: const pw.BorderRadius.all(pw.Radius.circular(4)),
                          ),
                          child: pw.BarcodeWidget(
                            barcode: pw.Barcode.qrCode(),
                            data: 'ID:${student.studentId}|Name:${student.name}|Mobile:${student.mobile}',
                            width: 34,
                            height: 34,
                          ),
                        ),
                        pw.SizedBox(height: 2),
                        pw.Text('SCAN TO VERIFY', style: pw.TextStyle(fontSize: 5, color: PdfColor(1, 1, 1, 0.7))),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            // Footer
            pw.Container(
              width: double.infinity,
              padding: const pw.EdgeInsets.symmetric(vertical: 2, horizontal: 8),
              color: PdfColor.fromHex('#05091E'),
              child: pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Text('PROPERTY OF ${_instituteName.toUpperCase()}',
                      style: pw.TextStyle(fontSize: 5, color: PdfColor(1, 1, 1, 0.6))),
                  pw.Text('AUTH SIGNATURE',
                      style: pw.TextStyle(fontSize: 5, fontWeight: pw.FontWeight.bold, color: PdfColor.fromHex('#FFD700'))),
                ],
              ),
            ),
          ],
        ),
      ),
    ));

    // Back Page
    pdf.addPage(pw.Page(
      pageFormat: const PdfPageFormat(85.6 * PdfPageFormat.mm, 54 * PdfPageFormat.mm),
      margin: pw.EdgeInsets.zero,
      build: (ctx) => pw.Container(
        decoration: pw.BoxDecoration(
          color: PdfColor.fromHex('#0A1128'),
        ),
        padding: const pw.EdgeInsets.all(8),
        child: pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            pw.Text('TERMS & CONDITIONS', style: pw.TextStyle(fontSize: 7, fontWeight: pw.FontWeight.bold, color: PdfColor.fromHex('#FFD700'))),
            pw.SizedBox(height: 3),
            pw.Text('1. This card is non-transferable and must be presented upon request.', style: pw.TextStyle(fontSize: 5.5, color: PdfColors.white)),
            pw.Text('2. If found, please return to the institute address below.', style: pw.TextStyle(fontSize: 5.5, color: PdfColors.white)),
            pw.Text('3. Loss of this card must be reported immediately.', style: pw.TextStyle(fontSize: 5.5, color: PdfColors.white)),
            pw.Spacer(),
            pw.Divider(height: 1, color: PdfColor.fromHex('#FFD700')),
            pw.SizedBox(height: 4),
            pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
              children: [
                pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Text(_instituteName, style: pw.TextStyle(fontSize: 7, fontWeight: pw.FontWeight.bold, color: PdfColors.white)),
                    pw.Text('Ph: $_phone', style: pw.TextStyle(fontSize: 6, color: PdfColor(1, 1, 1, 0.8))),
                    pw.Text(_address, style: pw.TextStyle(fontSize: 5.5, color: PdfColor(1, 1, 1, 0.7))),
                  ],
                ),
                pw.Column(
                  children: [
                    pw.Container(width: 40, height: 1, color: PdfColors.white),
                    pw.SizedBox(height: 2),
                    pw.Text('Principal Sign', style: pw.TextStyle(fontSize: 5.5, color: PdfColors.white)),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    ));

    await Printing.layoutPdf(onLayout: (_) => pdf.save());
  }

  pw.Widget _pdfLabelRow(String label, String value) {
    return pw.Padding(
      padding: const pw.EdgeInsets.only(bottom: 1.5),
      child: pw.Row(
        children: [
          pw.SizedBox(
            width: 36,
            child: pw.Text('$label:', style: pw.TextStyle(fontSize: 6, color: PdfColor.fromHex('#FFD700'))),
          ),
          pw.Expanded(
            child: pw.Text(value,
                style: pw.TextStyle(fontSize: 6, fontWeight: pw.FontWeight.bold, color: PdfColors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(body: LoadingWidget());
    final student = _student;
    if (student == null) return const Scaffold(body: Center(child: Text('Student not found')));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Student ID Card'),
        backgroundColor: AppColors.primary,
        actions: [
          IconButton(
            icon: const Icon(Icons.print_outlined),
            onPressed: _printIdCard,
            tooltip: 'Print / Export ID Card',
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // Toggle Switch
            Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(24),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _showFront = true),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 150),
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          color: _showFront ? AppColors.primary : Colors.transparent,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          'Front Side',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: _showFront ? Colors.white : Theme.of(context).colorScheme.onSurface,
                            fontWeight: FontWeight.w700,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _showFront = false),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 150),
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          color: !_showFront ? AppColors.primary : Colors.transparent,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          'Back Side',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: !_showFront ? Colors.white : Theme.of(context).colorScheme.onSurface,
                            fontWeight: FontWeight.w700,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Card Container
            AspectRatio(
              aspectRatio: 85.6 / 54,
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  gradient: const LinearGradient(
                    colors: [Color(0xFF0A1128), Color(0xFF1C2541)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.35),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                  ],
                  border: Border.all(color: const Color(0xFFFFD700).withOpacity(0.6), width: 1.5),
                ),
                child: _showFront ? _buildFrontCard(student) : _buildBackCard(student),
              ),
            ),
            const SizedBox(height: 32),

            // Action Buttons
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton.icon(
                onPressed: _printIdCard,
                icon: const Icon(Icons.print_rounded),
                label: const Text('Print / Download ID Card (PDF)'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFrontCard(StudentModel student) {
    return Column(
      children: [
        // Top Gold Ribbon Bar
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          decoration: const BoxDecoration(
            color: Color(0xFFFFD700),
            borderRadius: BorderRadius.vertical(top: Radius.circular(14)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: const [
              Text('OFFICIAL STUDENT ID', style: TextStyle(color: Color(0xFF0A1128), fontWeight: FontWeight.w800, fontSize: 10)),
              Text('SESSION 2026-27', style: TextStyle(color: Color(0xFF0A1128), fontWeight: FontWeight.w800, fontSize: 10)),
            ],
          ),
        ),

        // Institute Header
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          child: Column(
            children: [
              Text(
                _instituteName.toUpperCase(),
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 14, letterSpacing: 0.5),
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 2),
              Text(
                _address,
                style: const TextStyle(color: Color(0xFFFFD700), fontSize: 10, fontWeight: FontWeight.w500),
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
        const Divider(height: 1, color: Color(0xFFFFD700)),

        // Body Info
        Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Row(
              children: [
                // Student Photo Frame
                Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 64,
                      height: 76,
                      decoration: BoxDecoration(
                        border: Border.all(color: const Color(0xFFFFD700), width: 2),
                        borderRadius: BorderRadius.circular(8),
                        boxShadow: [
                          BoxShadow(color: Colors.black.withOpacity(0.3), blurRadius: 6),
                        ],
                        color: Colors.white.withOpacity(0.1),
                      ),
                      child: student.photoPath != null
                          ? ClipRRect(
                              borderRadius: BorderRadius.circular(6),
                              child: Image.file(File(student.photoPath!), fit: BoxFit.cover),
                            )
                          : Center(
                              child: Text(
                                AppUtils.getInitials(student.name),
                                style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800),
                              ),
                            ),
                    ),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFD700),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Text(
                        'STUDENT',
                        style: TextStyle(color: Color(0xFF0A1128), fontWeight: FontWeight.w800, fontSize: 9),
                      ),
                    ),
                  ],
                ),
                const SizedBox(width: 12),

                // Key Details
                Expanded(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        student.name.toUpperCase(),
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 14),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      _cardRow('ID NO', student.studentId),
                      _cardRow('ADM NO', student.admissionNumber),
                      _cardRow(student.studentType == 'school' ? 'CLASS' : 'COURSE', student.displayClass),
                      _cardRow('FATHER', student.fatherName),
                      _cardRow('MOBILE', student.mobile),
                    ],
                  ),
                ),

                // QR Code Block
                Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.2), blurRadius: 6)],
                      ),
                      child: QrImageView(
                        data: 'ID:${student.studentId}|Name:${student.name}|Mobile:${student.mobile}',
                        size: 56,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text('VERIFY QR', style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 8, fontWeight: FontWeight.w700)),
                  ],
                ),
              ],
            ),
          ),
        ),

        // Footer Bar
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          decoration: const BoxDecoration(
            color: Color(0xFF05091E),
            borderRadius: BorderRadius.vertical(bottom: Radius.circular(14)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('PROPERTY OF ${_instituteName.toUpperCase()}', style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 8)),
              const Text('AUTH SIGNATURE', style: TextStyle(color: Color(0xFFFFD700), fontWeight: FontWeight.w700, fontSize: 8)),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildBackCard(StudentModel student) {
    return Padding(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('TERMS & CONDITIONS', style: TextStyle(color: Color(0xFFFFD700), fontWeight: FontWeight.w800, fontSize: 12)),
          const SizedBox(height: 6),
          _bulletPoint('This card is mandatory for campus entry and exam attendance.'),
          _bulletPoint('It is non-transferable and remains the property of the institute.'),
          _bulletPoint('If lost, immediately inform administration for a duplicate card.'),
          const Spacer(),
          const Divider(color: Color(0xFFFFD700)),
          const SizedBox(height: 4),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(_instituteName, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 11)),
                  Text('Helpline: $_phone', style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 10)),
                  Text(_address, style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 9)),
                ],
              ),
              Column(
                children: [
                  Container(width: 70, height: 1, color: Colors.white.withOpacity(0.8)),
                  const SizedBox(height: 4),
                  const Text('Principal Sign', style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w600)),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _bulletPoint(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 3),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('• ', style: TextStyle(color: Color(0xFFFFD700), fontSize: 10, fontWeight: FontWeight.w700)),
          Expanded(child: Text(text, style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 9.5))),
        ],
      ),
    );
  }

  Widget _cardRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 2),
      child: Row(
        children: [
          SizedBox(
            width: 48,
            child: Text('$label:', style: const TextStyle(color: Color(0xFFFFD700), fontSize: 9.5, fontWeight: FontWeight.w700)),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(color: Colors.white, fontSize: 9.5, fontWeight: FontWeight.w600),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}

