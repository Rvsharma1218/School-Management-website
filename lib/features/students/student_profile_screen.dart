import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_routes.dart';
import '../../core/utils/app_utils.dart';
import '../../data/models/fee_model.dart';
import '../../data/models/student_model.dart';
import '../../data/services/database_service.dart';
import '../../data/services/providers.dart';
import '../../data/services/session_service.dart';
import '../attendance/attendance_report_service.dart';
import '../whatsapp/whatsapp_service.dart';
import '../../widgets/common_widgets.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

class StudentProfileScreen extends ConsumerStatefulWidget {
  final String studentId;
  const StudentProfileScreen({super.key, required this.studentId});

  @override
  ConsumerState<StudentProfileScreen> createState() => _StudentProfileScreenState();
}

class _StudentProfileScreenState extends ConsumerState<StudentProfileScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    final isPrincipal = SessionService.instance.isPrincipal;
    _tabController = TabController(length: isPrincipal ? 4 : 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<StudentModel?> _getStudent() =>
      DatabaseService.instance.getStudentById(widget.studentId);

  Future<void> _deleteStudent(BuildContext context, StudentModel student) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Student'),
        content: Text('Are you sure you want to delete ${student.name}? This will remove all their records.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirm == true) {
      await ref.read(studentsProvider.notifier).deleteStudent(student.id);
      ref.invalidate(dashboardStatsProvider);
      if (context.mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Student deleted'), backgroundColor: AppColors.error),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<StudentModel?>(
      future: _getStudent(),
      builder: (ctx, snap) {
        if (snap.connectionState == ConnectionState.waiting) {
          return const Scaffold(body: LoadingWidget());
        }
        final student = snap.data;
        if (student == null) {
          return const Scaffold(body: Center(child: Text('Student not found')));
        }
        return _buildProfile(context, student);
      },
    );
  }

  Widget _buildProfile(BuildContext context, StudentModel student) {
    final isPrincipal = SessionService.instance.isPrincipal;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: NestedScrollView(
        headerSliverBuilder: (ctx, innerScrolled) => [
          SliverAppBar(
            expandedHeight: 350,
            pinned: true,
            floating: false,
            backgroundColor: AppColors.primary,
            actions: [
              IconButton(
                icon: const Icon(Icons.edit_outlined, color: Colors.white),
                onPressed: () async {
                  await Navigator.pushNamed(ctx, AppRoutes.editStudent, arguments: student.id);
                  setState(() {});
                },
              ),
              if (isPrincipal)
                IconButton(
                  icon: const Icon(Icons.delete_outline, color: Colors.white),
                  onPressed: () => _deleteStudent(context, student),
                ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              collapseMode: CollapseMode.pin,
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [AppColors.primaryDark, AppColors.primary, AppColors.primaryLight],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: SafeArea(
                  bottom: false,
                  child: Padding(
                    padding: const EdgeInsets.only(top: 52, bottom: 56),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 3),
                            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.2), blurRadius: 12)],
                          ),
                          child: CircleAvatar(
                            radius: 42,
                            backgroundColor: Colors.white,
                            backgroundImage: student.photoPath != null
                                ? FileImage(File(student.photoPath!)) as ImageProvider
                                : null,
                            child: student.photoPath == null
                                ? Text(
                              AppUtils.getInitials(student.name),
                              style: const TextStyle(
                                fontSize: 28,
                                fontWeight: FontWeight.w700,
                                color: AppColors.primary,
                              ),
                            )
                                : null,
                          ),
                        ),
                        const SizedBox(height: 10),
                        Text(student.name,
                            style: const TextStyle(
                                color: Colors.white, fontSize: 20, fontWeight: FontWeight.w700)),
                        const SizedBox(height: 3),
                        Text(student.studentId,
                            style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 13)),
                        const SizedBox(height: 10),
                        SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              _headerChip(
                                student.studentType == 'school' ? 'School' : 'Computer',
                                student.studentType == 'school' ? Icons.school : Icons.computer,
                              ),
                              if (student.studentType == 'school' &&
                                  (student.className?.isNotEmpty == true ||
                                      student.section?.isNotEmpty == true)) ...[
                                const SizedBox(width: 6),
                                _headerChip(
                                  'Class ${student.className ?? ''}'
                                      '${student.section?.isNotEmpty == true ? ' - ${student.section}' : ''}',
                                  Icons.class_,
                                ),
                              ] else if (student.studentType == 'computer' &&
                                  student.course?.isNotEmpty == true) ...[
                                const SizedBox(width: 6),
                                _headerChip(student.course!, Icons.laptop_outlined),
                              ],
                            ],
                          ),
                        ),
                        const SizedBox(height: 6),
                        SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              _headerChip(student.statusLabel, Icons.circle,
                                  color: Color(student.statusColor)),
                              if (student.session?.isNotEmpty == true) ...[
                                const SizedBox(width: 6),
                                _headerChip('${student.session}', Icons.calendar_today),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            bottom: TabBar(
              controller: _tabController,
              indicatorColor: AppColors.accent,
              labelColor: Colors.white,
              unselectedLabelColor: Colors.white.withOpacity(0.6),
              labelStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, height: 1.2),
              unselectedLabelStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, height: 1.2),
              labelPadding: const EdgeInsets.symmetric(horizontal: 6),
              tabs: [
                const Tab(height: 44, text: 'Info'),
                if (isPrincipal) const Tab(height: 44, text: 'Fees'), // Hide Fee Tab for Teachers
                const Tab(height: 44, text: 'Attendance'),
                const Tab(height: 44, text: 'Results'),
              ],
            ),
          ),
        ],
        body: TabBarView(
          controller: _tabController,
          children: [
            _InfoTab(student: student),
            if (isPrincipal) _FeesTab(studentId: student.id), // Hide Fee Tab View for Teachers
            _AttendanceTab(student: student),
            _ResultsTab(studentId: student.id),
          ],
        ),
      ),
      bottomNavigationBar: _buildBottomBar(context, student),
    );
  }

  Widget _headerChip(String label, IconData icon, {Color? color}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color?.withOpacity(0.3) ?? Colors.white.withOpacity(0.2),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: Colors.white, size: 14),
          const SizedBox(width: 6),
          Text(label, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Widget _buildBottomBar(BuildContext context, StudentModel student) {
    final cs = Theme.of(context).colorScheme;
    final isPrincipal = SessionService.instance.isPrincipal;

    return Container(
      padding: EdgeInsets.fromLTRB(12, 10, 12,
          MediaQuery.of(context).padding.bottom + 10),
      decoration: BoxDecoration(
        color: cs.surface,
        border: Border(top: BorderSide(color: cs.outlineVariant, width: 1)),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.08),
              blurRadius: 12, offset: const Offset(0, -3)),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: _BottomActionButton(
              icon: Icons.badge_outlined,
              label: 'ID Card',
              onTap: () => Navigator.pushNamed(
                  context, AppRoutes.idCard, arguments: student.id),
            ),
          ),
          if (isPrincipal) ...[
            const SizedBox(width: 8),
            Expanded(
              child: _BottomActionButton(
                icon: Icons.receipt_long_outlined,
                label: 'Fee Receipt',
                onTap: () => Navigator.pushNamed(
                    context, AppRoutes.fees, arguments: student.id),
              ),
            ),
          ],
          const SizedBox(width: 8),
          Expanded(
            child: _BottomActionButton(
              icon: Icons.chat_rounded,
              label: 'WhatsApp',
              isWhatsApp: true,
              onTap: () async {
                await WhatsAppService.sendMessage(
                  context: context,
                  phone: student.mobile,
                  message: 'Dear ${student.name}, greetings from our institute!',
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoTab extends StatelessWidget {
  final StudentModel student;
  const _InfoTab({required this.student});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildInfoCard(context, 'Personal Details', [
          _buildRow(context, Icons.badge_outlined, 'Student ID', student.studentId),
          _buildRow(context, Icons.numbers, 'Admission No.', student.admissionNumber),
          _buildRow(context, Icons.person_outline, "Father's Name", student.fatherName),
          if (student.motherName != null)
            _buildRow(context, Icons.person_outline, "Mother's Name", student.motherName!),
          _buildRow(context, Icons.cake_outlined, 'Date of Birth', AppUtils.formatDate(student.dob)),
          _buildRow(context, Icons.people_outline, 'Gender', student.gender),
          _buildRow(context, Icons.phone_outlined, 'Mobile', student.mobile),
          if (student.alternateMobile != null)
            _buildRow(context, Icons.phone_outlined, 'Alt. Mobile', student.alternateMobile!),
          if (student.email != null)
            _buildRow(context, Icons.email_outlined, 'Email', student.email!),
          _buildRow(context, Icons.location_on_outlined, 'Address', student.address),
          _buildRow(context, Icons.event_outlined, 'Admission Date', AppUtils.formatDate(student.admissionDate)),
        ]),
        const SizedBox(height: 16),
        if (student.studentType == 'school')
          _buildInfoCard(context, 'School Details', [
            _buildRow(context, Icons.class_, 'Class',
                '${student.className ?? ''}${student.section?.isNotEmpty == true ? ' - ${student.section}' : ''}'),
            if (student.rollNumber != null)
              _buildRow(context, Icons.format_list_numbered, 'Roll Number', student.rollNumber!),
            _buildRow(context, Icons.circle, 'Status', student.statusLabel),
            if (student.session?.isNotEmpty == true)
              _buildRow(context, Icons.calendar_today, 'Session', student.session!),
          ]),
        if (student.studentType == 'computer')
          _buildInfoCard(context, 'Computer Institute Details', [
            _buildRow(context, Icons.computer_outlined, 'Course', student.course ?? ''),
            if (student.batch != null)
              _buildRow(context, Icons.group_outlined, 'Batch', student.batch!),
            _buildRow(context, Icons.circle, 'Status', student.statusLabel),
            if (student.session?.isNotEmpty == true)
              _buildRow(context, Icons.calendar_today, 'Session', student.session!),
            if (student.courseDurationMonths != null)
              _buildRow(context, Icons.timer_outlined, 'Duration',
                  '${student.courseDurationMonths} months'),
          ]),
        const SizedBox(height: 60),
      ],
    );
  }

  Widget _buildRow(BuildContext context, IconData icon, String label, String value) {
    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(top: 2),
            child: Icon(icon, size: 16, color: cs.onSurfaceVariant),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 11,
                    color: cs.onSurfaceVariant,
                    fontWeight: FontWeight.w500,
                    letterSpacing: 0.2,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  value.isEmpty ? '—' : value,
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                    color: cs.onSurface,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoCard(BuildContext context, String title, List<Widget> children) {
    final cs = Theme.of(context).colorScheme;
    return Card(
      color: cs.surface,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Container(
                width: 4, height: 18,
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 10),
              Text(
                title,
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 15,
                  color: cs.onSurface,
                ),
              ),
            ]),
            Divider(height: 20, color: cs.outlineVariant),
            ...children,
            const SizedBox(height: 4),
          ],
        ),
      ),
    );
  }
}

class _FeesTab extends ConsumerWidget {
  final String studentId;

  const _FeesTab({
    required this.studentId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final feeAsync = ref.watch(feeProvider(studentId));

    return feeAsync.when(
      data: (FeeModel? fee) {
        if (fee == null) {
          return const Center(
            child: Text('No fee record'),
          );
        }

        final payments = [...fee.payments];

        payments.sort(
              (a, b) => b.paymentDate.compareTo(a.paymentDate),
        );

        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            GradientCard(
              gradient: fee.remainingFees <= 0
                  ? AppColors.gradientGreen
                  : AppColors.gradientOrange,

              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _feeItem(
                        'Total',
                        AppUtils.formatCurrency(
                          fee.totalFees,
                        ),
                      ),
                      _feeItem(
                        'Paid',
                        AppUtils.formatCurrency(
                          fee.paidFees,
                        ),
                      ),
                      _feeItem(
                        'Remaining',
                        AppUtils.formatCurrency(
                          fee.remainingFees,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  LinearProgressIndicator(
                    value: fee.totalFees > 0
                        ? (fee.paidFees / fee.totalFees).clamp(0.0, 1.0)
                        : 0,
                    backgroundColor: Colors.white.withValues(alpha: 0.3),
                    valueColor: const AlwaysStoppedAnimation(Colors.white),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    fee.feeStatus,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: () => Navigator.pushNamed(
                context,
                AppRoutes.fees,
                arguments: studentId,
              ),
              icon: const Icon(Icons.add),
              label: const Text(
                'Add Payment / Manage Fees',
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Container(
                  width: 4,
                  height: 22,
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
                const SizedBox(width: 10),
                const Icon(
                  Icons.receipt_long,
                  color: AppColors.primary,
                ),
                const SizedBox(width: 8),
                const Text(
                  'Receipt History',
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (payments.isEmpty)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    children: const [
                      Icon(
                        Icons.receipt_long_outlined,
                        size: 48,
                        color: AppColors.textSecondary,
                      ),
                      SizedBox(height: 10),
                      Text(
                        'No Receipt History',
                        style: TextStyle(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      SizedBox(height: 4),
                      Text(
                        'Payment receipts will appear here.',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
              )
            else
              ...payments.map(
                    (payment) => _ReceiptHistoryCard(
                  studentId: studentId,
                  payment: payment,
                ),
              ),
            const SizedBox(height: 30),
          ],
        );
      },
      loading: () => const LoadingWidget(),
      error: (e, _) => Center(
        child: Text('Error: $e'),
      ),
    );
  }

  Widget _feeItem(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w700,
            fontSize: 18,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.8),
            fontSize: 12,
          ),
        ),
      ],
    );
  }
}

class _ReceiptHistoryCard extends StatelessWidget {
  final String studentId;
  final PaymentModel payment;

  const _ReceiptHistoryCard({
    required this.studentId,
    required this.payment,
  });

  String _formatDate(DateTime date) {
    return '${date.day.toString().padLeft(2, '0')}-'
        '${date.month.toString().padLeft(2, '0')}-'
        '${date.year}';
  }

  String _formatTime(DateTime date) {
    final hour = date.hour == 0
        ? 12
        : date.hour > 12
        ? date.hour - 12
        : date.hour;
    final minute = date.minute.toString().padLeft(2, '0');
    final period = date.hour >= 12 ? 'PM' : 'AM';
    return '$hour:$minute $period';
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: AppColors.successLight,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.receipt_long,
                    color: AppColors.success,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        AppUtils.formatCurrency(payment.amount),
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Receipt: ${payment.receiptNumber}',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
                  decoration: BoxDecoration(
                    color: AppColors.successLight,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    payment.paymentMode,
                    style: const TextStyle(
                      color: AppColors.success,
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            const Divider(height: 1),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: Row(
                    children: [
                      const Icon(Icons.calendar_today, size: 15, color: AppColors.textSecondary),
                      const SizedBox(width: 6),
                      Text(
                        _formatDate(payment.paymentDate),
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: Row(
                    children: [
                      const Icon(Icons.access_time, size: 15, color: AppColors.textSecondary),
                      const SizedBox(width: 6),
                      Text(
                        _formatTime(payment.paymentDate),
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                IconButton(
                  tooltip: 'Send Receipt on WhatsApp',
                  onPressed: () async {
                    await _sendReceiptWhatsApp(context, payment);
                  },
                  icon: const Icon(
                    Icons.chat_rounded,
                    color: Color(0xFF25D366),
                  ),
                ),
                IconButton(
                  tooltip: 'Generate Receipt PDF',
                  onPressed: () async {
                    await _generateReceiptPdf(context, payment);
                  },
                  icon: const Icon(
                    Icons.picture_as_pdf_rounded,
                    color: Colors.red,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _sendReceiptWhatsApp(BuildContext context, PaymentModel payment) async {
    try {
      final student = await DatabaseService.instance.getStudentById(studentId);
      if (student == null) return;

      final file = await _createReceiptPdf(student, payment);

      await WhatsAppService.sendPdf(
        context: context,
        phone: student.mobile,
        message: 'Dear ${student.name},\n\n'
            'Please find your fee payment receipt.\n\n'
            'Receipt No: ${payment.receiptNumber}\n'
            'Amount: ${AppUtils.formatCurrency(payment.amount)}\n'
            'Date: ${_formatDate(payment.paymentDate)}\n'
            'Time: ${_formatTime(payment.paymentDate)}\n'
            'Payment Mode: ${payment.paymentMode}\n\n'
            'Thank you.',
        filePath: file,
      );
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Could not send receipt: $e'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  Future<void> _generateReceiptPdf(BuildContext context, PaymentModel payment) async {
    try {
      final student = await DatabaseService.instance.getStudentById(studentId);
      if (student == null) return;

      final file = await _createReceiptPdf(student, payment);

      await Printing.layoutPdf(
        onLayout: (format) async {
          return File(file).readAsBytes();
        },
      );
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Could not generate receipt: $e'),
          backgroundColor: AppColors.error,
        ),
      );
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
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    String twoDigits(int n) => n < 20 ? ones[n] : '${tens[n ~/ 10]} ${ones[n % 10]}'.trim();
    String threeDigits(int n) =>
        n >= 100 ? '${ones[n ~/ 100]} Hundred${n % 100 > 0 ? ' ${twoDigits(n % 100)}' : ''}' : twoDigits(n);
    var n = number;
    final parts = <String>[];
    if (n >= 10000000) { parts.add('${threeDigits(n ~/ 10000000)} Crore'); n %= 10000000; }
    if (n >= 100000) { parts.add('${twoDigits(n ~/ 100000)} Lakh'); n %= 100000; }
    if (n >= 1000) { parts.add('${twoDigits(n ~/ 1000)} Thousand'); n %= 1000; }
    if (n > 0) { parts.add(threeDigits(n)); }
    return parts.join(' ');
  }

  Future<String> _createReceiptPdf(StudentModel student, PaymentModel payment) async {
    final settings = await DatabaseService.instance.getSettings();
    final regular = await PdfGoogleFonts.notoSansRegular();
    final bold = await PdfGoogleFonts.notoSansBold();
    final pdf = pw.Document();

    final feeMonth = payment.feeMonth;
    MonthlyFeeModel? fee;
    if (feeMonth != null && feeMonth.isNotEmpty) {
      fee = await DatabaseService.instance.getMonthlyFee(studentId, feeMonth);
    }

    final totalDue = fee?.totalDue ?? payment.amount;
    final paidAmount = fee?.paidAmount ?? payment.amount;
    final remaining = fee?.remaining ?? 0;

    final feeStructure = await DatabaseService.instance.getFeeStructure(studentId);
    final finePerDay = feeStructure?.finePerDay ?? 5;
    final dueDay = feeStructure?.dueDay ?? 10;

    String fmtDate(DateTime d) =>
        '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';

    String fmtTime(DateTime d) {
      final hour = d.hour == 0 ? 12 : d.hour > 12 ? d.hour - 12 : d.hour;
      final minute = d.minute.toString().padLeft(2, '0');
      final period = d.hour >= 12 ? 'PM' : 'AM';
      return '$hour:$minute $period';
    }

    String fmtDateLong(DateTime d) {
      const m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return '${d.day} ${m[d.month - 1]} ${d.year}';
    }

    final dueText = fee?.dueDate == null
        ? 'Not Set'
        : '${fee!.dueDate!.day} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][fee.dueDate!.month - 1]} ${fee.dueDate!.year}';

    final feeMonthLabel = feeMonth != null && feeMonth.isNotEmpty
        ? (() {
      final parts = feeMonth.split('-');
      if (parts.length != 2) return feeMonth;
      const names = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      final m = int.tryParse(parts[1]);
      if (m == null || m < 1 || m > 12) return feeMonth;
      return '${names[m - 1]} ${parts[0]}';
    })()
        : '${['January','February','March','April','May','June','July','August','September','October','November','December'][payment.paymentDate.month - 1]} ${payment.paymentDate.year}';

    final watermarkText = remaining <= 0 && totalDue > 0 ? 'PAID' : (paidAmount > 0 ? 'PARTIALLY PAID' : '');

    final darkText = PdfColor.fromHex('#2C1810');
    final cream = PdfColor.fromHex('#FFFDF5');

    final particulars = <MapEntry<String, double>>[
      MapEntry('Admission Fee', fee?.admissionFee ?? 0),
      MapEntry('Tuition Fee', fee?.tuitionFee ?? (fee == null ? payment.amount : 0)),
      MapEntry('Examination Fee', fee?.examinationFee ?? 0),
      MapEntry('Previous Dues', fee?.previousDue ?? 0),
      MapEntry('Game Fee', fee?.gameFee ?? 0),
      MapEntry('Re-Admission Fee', fee?.reAdmissionFee ?? 0),
      MapEntry('Development Fee', fee?.developmentFee ?? 0),
      MapEntry('School ID', fee?.schoolIdFee ?? 0),
      MapEntry('Tie, Bag, Belt', fee?.tieBagBeltFee ?? 0),
      MapEntry('Back Dues', fee?.backDues ?? 0),
      MapEntry('Transport Fee', fee?.transportFee ?? 0),
      MapEntry('Other Fee', fee?.otherFee ?? 0),
    ];

    pw.Widget slipCell(String text, pw.Font font, PdfColor color,
        {bool center = false, bool right = false}) {
      return pw.Padding(
        padding: const pw.EdgeInsets.symmetric(horizontal: 3, vertical: 2.5),
        child: pw.Align(
          alignment: center ? pw.Alignment.center : right ? pw.Alignment.centerRight : pw.Alignment.centerLeft,
          child: pw.Text(text, style: pw.TextStyle(font: font, fontSize: 7, color: color)),
        ),
      );
    }

    pw.Widget dottedRow(String label, String value) {
      return pw.Padding(
        padding: const pw.EdgeInsets.symmetric(vertical: 1.5),
        child: pw.Row(children: [
          pw.Text('$label: ', style: pw.TextStyle(font: regular, fontSize: 8, color: darkText)),
          pw.Expanded(
            child: pw.Text(value, style: pw.TextStyle(font: bold, fontSize: 8, color: darkText), textAlign: pw.TextAlign.right),
          ),
        ]),
      );
    }

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a5,
        margin: const pw.EdgeInsets.all(10),
        build: (_) {
          return pw.Stack(children: [
            if (watermarkText.isNotEmpty)
              pw.Positioned(
                left: 30, top: 220,
                child: pw.Transform.rotateBox(
                  angle: -0.45,
                  child: pw.Opacity(
                    opacity: 0.06,
                    child: pw.Text(watermarkText, style: pw.TextStyle(font: bold, fontSize: 60, color: darkText)),
                  ),
                ),
              ),

            pw.Container(
              decoration: pw.BoxDecoration(color: cream, border: pw.Border.all(color: darkText, width: 1.5)),
              padding: const pw.EdgeInsets.all(10),
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Center(child: pw.Text('SCHOOL FEE', style: pw.TextStyle(font: bold, fontSize: 10, color: darkText, letterSpacing: 2))),
                  pw.SizedBox(height: 2),
                  pw.Center(child: pw.Text(settings.instituteName.toUpperCase(), textAlign: pw.TextAlign.center, style: pw.TextStyle(font: bold, fontSize: 14, color: darkText, letterSpacing: 1))),
                  pw.SizedBox(height: 2),
                  pw.Center(child: pw.Text('Add- ${settings.address}', textAlign: pw.TextAlign.center, style: pw.TextStyle(font: regular, fontSize: 7.5, color: darkText))),
                  pw.Center(child: pw.Text('Mob- ${settings.mobile}', style: pw.TextStyle(font: regular, fontSize: 7.5, color: darkText))),
                  pw.SizedBox(height: 5),
                  pw.Divider(color: darkText, thickness: 0.8),
                  pw.SizedBox(height: 4),

                  pw.Row(mainAxisAlignment: pw.MainAxisAlignment.spaceBetween, children: [
                    pw.RichText(text: pw.TextSpan(children: [
                      pw.TextSpan(text: 'SL No. ', style: pw.TextStyle(font: regular, fontSize: 8, color: darkText)),
                      pw.TextSpan(text: payment.receiptNumber, style: pw.TextStyle(font: bold, fontSize: 8, color: darkText)),
                    ])),
                    pw.RichText(text: pw.TextSpan(children: [
                      pw.TextSpan(text: 'Date ', style: pw.TextStyle(font: regular, fontSize: 8, color: darkText)),
                      pw.TextSpan(text: '${fmtDate(payment.paymentDate)} ${fmtTime(payment.paymentDate)}', style: pw.TextStyle(font: bold, fontSize: 8, color: darkText)),
                    ])),
                  ]),
                  pw.SizedBox(height: 3),
                  dottedRow("Student's Name", student.name),
                  pw.Row(children: [
                    pw.Expanded(child: dottedRow('Class', student.displayClass)),
                    pw.SizedBox(width: 8),
                    pw.Expanded(child: dottedRow('Roll No.', student.rollNumber ?? '-')),
                  ]),
                  dottedRow("Father's Name", student.fatherName),
                  pw.Row(children: [
                    pw.Expanded(child: dottedRow('Fees For Month of', feeMonthLabel)),
                  ]),
                  pw.Row(children: [
                    pw.Expanded(child: dottedRow('Due Date', dueText)),
                    pw.SizedBox(width: 8),
                    pw.Expanded(child: dottedRow('Session', student.session ?? settings.currentSession)),
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
                          slipCell('S.N.', bold, darkText, center: true),
                          slipCell('Particulars', bold, darkText),
                          slipCell('Amount', bold, darkText, right: true),
                          slipCell('P.', bold, darkText, center: true),
                        ],
                      ),
                      ...List.generate(12, (i) {
                        final amt = particulars[i].value;
                        return pw.TableRow(children: [
                          slipCell('${i + 1}', regular, darkText, center: true),
                          slipCell(particulars[i].key, regular, darkText),
                          slipCell(amt > 0 ? amt.toStringAsFixed(2) : '', regular, darkText, right: true),
                          slipCell(amt > 0 ? '00' : '', regular, darkText, center: true),
                        ]);
                      }),
                      pw.TableRow(children: [
                        slipCell('★', bold, darkText, center: true),
                        slipCell('Late Fine', bold, darkText),
                        slipCell((fee?.lateFine ?? 0) > 0 ? fee!.lateFine.toStringAsFixed(2) : '', regular, darkText, right: true),
                        slipCell((fee?.lateFine ?? 0) > 0 ? '00' : '', regular, darkText, center: true),
                      ]),
                      pw.TableRow(
                        decoration: pw.BoxDecoration(color: PdfColor.fromHex('#EDE8D8')),
                        children: [
                          slipCell('', bold, darkText),
                          slipCell('Total Amount', bold, darkText, right: true),
                          slipCell(totalDue.toStringAsFixed(2), bold, darkText, right: true),
                          slipCell('00', bold, darkText, center: true),
                        ],
                      ),
                      pw.TableRow(children: [
                        slipCell('', regular, darkText),
                        slipCell('Amount Paid', regular, darkText, right: true),
                        slipCell(payment.amount.toStringAsFixed(2), bold, darkText, right: true),
                        slipCell('00', regular, darkText, center: true),
                      ]),
                      pw.TableRow(children: [
                        slipCell('', regular, darkText),
                        slipCell('Balance Due', regular, darkText, right: true),
                        slipCell(remaining.toStringAsFixed(2), bold, darkText, right: true),
                        slipCell('00', regular, darkText, center: true),
                      ]),
                    ],
                  ),
                  pw.SizedBox(height: 5),

                  pw.RichText(text: pw.TextSpan(children: [
                    pw.TextSpan(text: 'Rupees: ', style: pw.TextStyle(font: bold, fontSize: 7.5, color: darkText)),
                    pw.TextSpan(text: '${_numberToWords(totalDue)} Only', style: pw.TextStyle(font: regular, fontSize: 7.5, color: darkText)),
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
                        pw.TextSpan(text: '☑ ', style: pw.TextStyle(font: bold, fontSize: 8, color: PdfColor.fromHex('#2E7D32'))),
                        pw.TextSpan(text: 'Paid on ${fmtDateLong(payment.paymentDate)} via ${payment.paymentMode}', style: pw.TextStyle(font: regular, fontSize: 7.5, color: darkText)),
                      ])),
                    ),
                  ),
                  pw.SizedBox(height: 8),

                  pw.Row(mainAxisAlignment: pw.MainAxisAlignment.spaceBetween, children: [
                    pw.Text('Class Teacher Sign.', style: pw.TextStyle(font: regular, fontSize: 7.5, color: darkText)),
                    pw.Text('FOR ${settings.instituteName.toUpperCase()}', style: pw.TextStyle(font: bold, fontSize: 6.5, color: darkText)),
                  ]),
                  pw.SizedBox(height: 6),
                  pw.Divider(color: darkText, thickness: 0.5),
                  pw.SizedBox(height: 3),

                  pw.Text('Rules:-', style: pw.TextStyle(font: bold, fontSize: 7, color: darkText)),
                  pw.SizedBox(height: 2),
                  pw.Text('1. Last date of fee is ${dueDay}th of the month', style: pw.TextStyle(font: regular, fontSize: 6.5, color: darkText)),
                  pw.Text('2. A fine of Rs ${finePerDay.toStringAsFixed(0)}/- per day will be charged if the dues are paid after\n   the due date', style: pw.TextStyle(font: regular, fontSize: 6.5, color: darkText)),
                  pw.Text('3. Fee shall be accepted only between 9.am to 2.pm', style: pw.TextStyle(font: regular, fontSize: 6.5, color: darkText)),
                  pw.SizedBox(height: 6),

                  pw.Align(
                    alignment: pw.Alignment.centerRight,
                    child: pw.Column(crossAxisAlignment: pw.CrossAxisAlignment.end, children: [
                      pw.SizedBox(width: 100, child: pw.Divider(color: darkText)),
                      pw.Text('Auth. Signature', style: pw.TextStyle(font: regular, fontSize: 7, color: darkText)),
                    ]),
                  ),
                ],
              ),
            ),
          ]);
        },
      ),
    );

    final dir = await getTemporaryDirectory();
    final file = File('${dir.path}/receipt_${payment.receiptNumber}.pdf');
    await file.writeAsBytes(await pdf.save());
    return file.path;
  }
}

class _AttendanceTab extends ConsumerStatefulWidget {
  final StudentModel student;
  const _AttendanceTab({required this.student});

  @override
  ConsumerState<_AttendanceTab> createState() => _AttendanceTabState();
}

enum _ReportRange { today, allDays, custom }

class _AttendanceTabState extends ConsumerState<_AttendanceTab> {
  bool _sending = false;

  Future<void> _sendAttendanceReport() async {
    final cs = Theme.of(context).colorScheme;

    final selectedRange = await showModalBottomSheet<_ReportRange>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => SafeArea(
        child: Container(
          margin: const EdgeInsets.fromLTRB(12, 0, 12, 12),
          decoration: BoxDecoration(
            color: cs.surface,
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.2),
                blurRadius: 20,
                offset: const Offset(0, -4),
              ),
            ],
          ),
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 18),
                decoration: BoxDecoration(
                  color: cs.onSurfaceVariant.withOpacity(0.4),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: const Color(0xFF25D366).withOpacity(0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.chat_rounded, color: Color(0xFF25D366), size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Share Attendance Report',
                          style: TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 16,
                            color: cs.onSurface,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Select date range to send via WhatsApp',
                          style: TextStyle(
                            fontSize: 12,
                            color: cs.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              _optionRow(
                context: ctx,
                icon: Icons.today_rounded,
                iconColor: AppColors.primary,
                title: 'Today',
                subtitle: "Only today's attendance status",
                onTap: () => Navigator.pop(ctx, _ReportRange.today),
              ),
              const SizedBox(height: 10),
              _optionRow(
                context: ctx,
                icon: Icons.all_inclusive_rounded,
                iconColor: AppColors.success,
                title: 'All Days',
                subtitle: 'Full history from first record to today',
                onTap: () => Navigator.pop(ctx, _ReportRange.allDays),
              ),
              const SizedBox(height: 10),
              _optionRow(
                context: ctx,
                icon: Icons.date_range_rounded,
                iconColor: AppColors.warning,
                title: 'Custom Date Range',
                subtitle: 'Select specific From and To dates',
                onTap: () => Navigator.pop(ctx, _ReportRange.custom),
              ),
              const SizedBox(height: 14),
              SizedBox(
                width: double.infinity,
                child: TextButton(
                  onPressed: () => Navigator.pop(ctx, null),
                  style: TextButton.styleFrom(
                    foregroundColor: cs.onSurfaceVariant,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  child: const Text('Cancel', style: TextStyle(fontWeight: FontWeight.w600)),
                ),
              ),
            ],
          ),
        ),
      ),
    );

    if (selectedRange == null || !mounted) return;

    DateTime fromDate;
    DateTime toDate = DateTime.now();

    if (selectedRange == _ReportRange.today) {
      fromDate = DateTime(toDate.year, toDate.month, toDate.day);
    } else if (selectedRange == _ReportRange.allDays) {
      final records = await DatabaseService.instance.getAttendanceByStudentId(widget.student.id);
      if (records.isNotEmpty) {
        fromDate = records.map((r) => r.date).reduce((a, b) => a.isBefore(b) ? a : b);
      } else {
        fromDate = DateTime(toDate.year, toDate.month, 1);
      }
    } else {
      final range = await showDateRangePicker(
        context: context,
        firstDate: DateTime(toDate.year - 5),
        lastDate: toDate,
        initialDateRange: DateTimeRange(
          start: DateTime(toDate.year, toDate.month, 1),
          end: toDate,
        ),
        builder: (ctx, child) => Theme(
          data: Theme.of(ctx).copyWith(
            colorScheme: cs.brightness == Brightness.dark
                ? ColorScheme.dark(
              primary: AppColors.primary,
              onPrimary: Colors.white,
              surface: cs.surface,
              onSurface: cs.onSurface,
            )
                : ColorScheme.light(
              primary: AppColors.primary,
              onPrimary: Colors.white,
              surface: cs.surface,
              onSurface: cs.onSurface,
            ),
          ),
          child: child!,
        ),
      );

      if (range == null || !mounted) return;
      fromDate = range.start;
      toDate = range.end;
    }

    setState(() => _sending = true);
    try {
      final settings = await DatabaseService.instance.getSettings();
      final file = await AttendanceReportService.generateStudentAttendancePdf(
        student: widget.student,
        fromDate: fromDate,
        toDate: toDate,
        instituteName: settings.instituteName,
      );
      if (!mounted) return;
      await WhatsAppService.sendPdf(
        context: context,
        phone: widget.student.mobile,
        message: AttendanceReportService.whatsappMessage(
          student: widget.student,
          fromDate: fromDate,
          toDate: toDate,
          instituteName: settings.instituteName,
        ),
        filePath: file.path,
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not generate report: $e'), backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  Widget _optionRow({
    required BuildContext context,
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    final cs = Theme.of(context).colorScheme;
    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: cs.surfaceContainerHighest.withOpacity(0.4),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: cs.outline.withOpacity(0.2)),
        ),
        child: Row(
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: iconColor.withOpacity(0.14),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: iconColor, size: 22),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 14.5,
                      color: cs.onSurface,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 11.5,
                      color: cs.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
            Icon(Icons.chevron_right_rounded, color: cs.onSurfaceVariant, size: 20),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final studentId = widget.student.id;
    final attAsync = ref.watch(studentAttendanceProvider(studentId));
    final cs = Theme.of(context).colorScheme;

    return attAsync.when(
      data: (records) {
        final total = records.length;
        final present = records.where((r) => r.status == 'present').length;
        final absent = records.where((r) => r.status == 'absent').length;
        final leave = records.where((r) => r.status == 'leave').length;
        final pct = total > 0 ? (present / total * 100).toStringAsFixed(1) : '0.0';

        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            GradientCard(
              gradient: double.parse(pct) >= 75 ? AppColors.gradientGreen : AppColors.gradientOrange,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _attItem('$pct%', 'Overall'),
                  _attItem('$present', 'Present'),
                  _attItem('$absent', 'Absent'),
                  _attItem('$leave', 'Leave'),
                ],
              ),
            ),
            const SizedBox(height: 14),

            InkWell(
              borderRadius: BorderRadius.circular(14),
              onTap: _sending ? null : _sendAttendanceReport,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 150),
                padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
                decoration: BoxDecoration(
                  color: const Color(0xFF25D366),
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF25D366).withOpacity(0.3),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _sending
                        ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                        : const Icon(Icons.chat_rounded, color: Colors.white, size: 20),
                    const SizedBox(width: 10),
                    Text(
                      _sending ? 'Preparing report…' : 'Send Attendance Report via WhatsApp',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 16),
            if (records.isEmpty)
              const EmptyState(icon: Icons.event_busy, title: 'No Attendance Records')
            else ...[
              Text(
                'Recent Records',
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 15,
                  color: cs.onSurface,
                ),
              ),
              const SizedBox(height: 10),
              ...records.take(30).map((r) => Card(
                margin: const EdgeInsets.only(bottom: 6),
                child: ListTile(
                  leading: _statusIcon(r.status),
                  title: Text(
                    AppUtils.formatDateLong(r.date),
                    style: TextStyle(color: cs.onSurface, fontWeight: FontWeight.w600),
                  ),
                  trailing: _statusChip(r.status),
                  dense: true,
                ),
              )),
            ],
          ],
        );
      },
      loading: () => const LoadingWidget(),
      error: (e, _) => Center(child: Text('Error: $e')),
    );
  }

  Widget _attItem(String value, String label) {
    return Column(
      children: [
        Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 20)),
        Text(label, style: TextStyle(color: Colors.white.withValues(alpha: 0.8), fontSize: 11)),
      ],
    );
  }

  Widget _statusIcon(String status) {
    Color c;
    IconData i;
    switch (status) {
      case 'present': c = AppColors.success; i = Icons.check_circle; break;
      case 'absent': c = AppColors.error; i = Icons.cancel; break;
      default: c = AppColors.warning; i = Icons.watch_later;
    }
    return Icon(i, color: c);
  }

  Widget _statusChip(String status) {
    Color bg, fg;
    switch (status) {
      case 'present': bg = AppColors.successLight; fg = AppColors.success; break;
      case 'absent': bg = AppColors.errorLight; fg = AppColors.error; break;
      default: bg = AppColors.warningLight; fg = AppColors.warning;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
      child: Text(status.toUpperCase(),
          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: fg)),
    );
  }
}

class _ResultsTab extends ConsumerWidget {
  final String studentId;
  const _ResultsTab({required this.studentId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return FutureBuilder(
      future: DatabaseService.instance.getResultsByStudentId(studentId),
      builder: (ctx, snap) {
        if (snap.connectionState == ConnectionState.waiting) return const LoadingWidget();
        final results = snap.data ?? [];
        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            ElevatedButton.icon(
              onPressed: () => Navigator.pushNamed(ctx, AppRoutes.result, arguments: studentId),
              icon: const Icon(Icons.add),
              label: const Text('Add / View Results'),
            ),
            const SizedBox(height: 16),
            if (results.isEmpty)
              const EmptyState(icon: Icons.assignment_outlined, title: 'No Results Yet')
            else
              ...results.map((r) => Card(
                margin: const EdgeInsets.only(bottom: 10),
                child: ExpansionTile(
                  title: Text(r.examName, style: const TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: Text(
                    '${r.obtainedMarks.toInt()}/${r.totalMarks.toInt()} • ${r.overallPercentage.toStringAsFixed(1)}% • Grade: ${r.overallGrade}',
                  ),
                  children: r.subjects.map((s) => ListTile(
                    title: Text(s.subjectName),
                    trailing: Text('${s.marks.toInt()}/${s.totalMarks.toInt()} (${s.grade})',
                        style: const TextStyle(fontWeight: FontWeight.w600)),
                    dense: true,
                  )).toList(),
                ),
              )),
          ],
        );
      },
    );
  }
}

class _BottomActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool isWhatsApp;

  const _BottomActionButton({
    required this.icon,
    required this.label,
    required this.onTap,
    this.isWhatsApp = false,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    const waGreen = Color(0xFF25D366);

    final bgColor = isWhatsApp ? waGreen : cs.surface;
    final fgColor = isWhatsApp ? Colors.white : cs.onSurface;
    final borderColor = isWhatsApp ? waGreen : cs.outline;

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: borderColor, width: isWhatsApp ? 0 : 1.2),
          boxShadow: isWhatsApp
              ? [BoxShadow(color: waGreen.withOpacity(0.35), blurRadius: 8, offset: const Offset(0, 3))]
              : null,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: fgColor, size: 22),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                color: fgColor,
                fontSize: 11,
                fontWeight: FontWeight.w700,
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}