import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_routes.dart';
import '../../core/utils/app_utils.dart';
import '../../data/models/fee_model.dart';
import '../../data/models/student_model.dart';
import '../../data/services/database_service.dart';
import '../../data/services/session_service.dart';
import '../../widgets/common_widgets.dart';

/// Defense-in-depth: the Fees tiles are already hidden from a Teacher's
/// Dashboard, but a deep link / restored route could still land here
/// directly, so block both fee screens at this level too.
Widget? _principalOnlyGuard(String title) {
  if (SessionService.instance.isPrincipal) return null;
  return Scaffold(
    backgroundColor: AppColors.background,
    appBar: AppBar(title: Text(title), backgroundColor: AppColors.primary, foregroundColor: Colors.white),
    body: const Center(
      child: Padding(
        padding: EdgeInsets.all(24),
        child: Text(
          'Fee details are only visible to the Principal.',
          textAlign: TextAlign.center,
          style: TextStyle(color: AppColors.textSecondary),
        ),
      ),
    ),
  );
}

// ─── Data Model ───────────────────────────────────────────────────────────────

class _StudentFeeRow {
  final StudentModel student;
  final FeeModel fee;
  _StudentFeeRow(this.student, this.fee);
}

// ─── Fees Collected Screen ────────────────────────────────────────────────────

class FeesCollectedScreen extends ConsumerStatefulWidget {
  const FeesCollectedScreen({super.key});

  @override
  ConsumerState<FeesCollectedScreen> createState() =>
      _FeesCollectedScreenState();
}

class _FeesCollectedScreenState extends ConsumerState<FeesCollectedScreen> {
  List<_StudentFeeRow> _rows = [];
  bool _loading = true;
  String _filter = 'all'; // all | paid | partial

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final students = await DatabaseService.instance.getAllStudents();
      final rows = <_StudentFeeRow>[];
      for (final s in students) {
        final fee = await DatabaseService.instance.getFeeByStudentId(s.id);
        if (fee != null && fee.totalPaid > 0) {
          rows.add(_StudentFeeRow(s, fee));
        }
      }
      if (mounted) setState(() { _rows = rows; _loading = false; });
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error),
        );
      }
    }
  }

  List<_StudentFeeRow> get _filtered {
    if (_filter == 'paid') return _rows.where((r) => r.fee.remaining <= 0).toList();
    if (_filter == 'partial') return _rows.where((r) => r.fee.remaining > 0).toList();
    return _rows;
  }

  double get _totalCollected =>
      _filtered.fold(0, (sum, r) => sum + r.fee.totalPaid);

  @override
  Widget build(BuildContext context) {
    final guard = _principalOnlyGuard('Fees Collected');
    if (guard != null) return guard;

    final cs = Theme.of(context).colorScheme;
    final filtered = _filtered;

    return Scaffold(
      backgroundColor: cs.background,
      appBar: AppBar(
        title: const Text('Fees Collected'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _load),
        ],
      ),
      body: _loading
          ? const LoadingWidget(message: 'Loading fee records...')
          : RefreshIndicator(
              onRefresh: _load,
              child: Column(
                children: [
                  // ── Summary Banner ─────────────────────────────────────
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    color: AppColors.success.withOpacity(0.1),
                    child: Column(children: [
                      Text('Total Collected',
                          style: TextStyle(
                              color: AppColors.success,
                              fontSize: 13,
                              fontWeight: FontWeight.w600)),
                      Text(
                        AppUtils.formatCurrency(_totalCollected),
                        style: const TextStyle(
                            color: AppColors.success,
                            fontSize: 26,
                            fontWeight: FontWeight.w800),
                      ),
                      Text('${filtered.length} student records',
                          style: TextStyle(
                              color: AppColors.success.withOpacity(0.7),
                              fontSize: 12)),
                    ]),
                  ),

                  // ── Filter Chips ───────────────────────────────────────
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 10),
                    child: Row(children: [
                      _chip('All', 'all'),
                      const SizedBox(width: 8),
                      _chip('Fully Paid', 'paid'),
                      const SizedBox(width: 8),
                      _chip('Partial', 'partial'),
                    ]),
                  ),

                  // ── List ──────────────────────────────────────────────
                  Expanded(
                    child: filtered.isEmpty
                        ? const EmptyState(
                            icon: Icons.receipt_long_outlined,
                            title: 'No Records',
                            subtitle: 'No fee payments recorded yet',
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.all(12),
                            itemCount: filtered.length,
                            itemBuilder: (_, i) =>
                                _FeeRow(row: filtered[i], type: 'collected'),
                          ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _chip(String label, String value) {
    final cs = Theme.of(context).colorScheme;
    final sel = _filter == value;
    return GestureDetector(
      onTap: () => setState(() => _filter = value),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: sel ? AppColors.primary : cs.surfaceVariant,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(label,
            style: TextStyle(
                color: sel ? Colors.white : cs.onSurfaceVariant,
                fontWeight: FontWeight.w600,
                fontSize: 13)),
      ),
    );
  }
}

// ─── Fees Pending Screen ──────────────────────────────────────────────────────

class FeesPendingScreen extends ConsumerStatefulWidget {
  const FeesPendingScreen({super.key});

  @override
  ConsumerState<FeesPendingScreen> createState() => _FeesPendingScreenState();
}

class _FeesPendingScreenState extends ConsumerState<FeesPendingScreen> {
  List<_StudentFeeRow> _rows = [];
  bool _loading = true;
  String _sortBy = 'amount'; // amount | name | due

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final students = await DatabaseService.instance.getAllStudents();
      final rows = <_StudentFeeRow>[];
      for (final s in students) {
        final fee = await DatabaseService.instance.getFeeByStudentId(s.id);
        if (fee != null && fee.remaining > 0) {
          rows.add(_StudentFeeRow(s, fee));
        }
      }
      if (mounted) setState(() { _rows = rows; _loading = false; });
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error),
        );
      }
    }
  }

  List<_StudentFeeRow> get _sorted {
    final list = [..._rows];
    if (_sortBy == 'amount') {
      list.sort((a, b) => b.fee.remaining.compareTo(a.fee.remaining));
    } else if (_sortBy == 'name') {
      list.sort((a, b) => a.student.name.compareTo(b.student.name));
    } else if (_sortBy == 'due') {
      list.sort((a, b) {
        if (a.fee.dueDate == null) return 1;
        if (b.fee.dueDate == null) return -1;
        return a.fee.dueDate!.compareTo(b.fee.dueDate!);
      });
    }
    return list;
  }

  double get _totalPending => _rows.fold(0, (s, r) => s + r.fee.remaining);

  @override
  Widget build(BuildContext context) {
    final guard = _principalOnlyGuard('Fees Pending');
    if (guard != null) return guard;

    final cs = Theme.of(context).colorScheme;
    final sorted = _sorted;

    return Scaffold(
      backgroundColor: cs.background,
      appBar: AppBar(
        title: const Text('Fees Pending'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.sort, color: Colors.white),
            onSelected: (v) => setState(() => _sortBy = v),
            itemBuilder: (_) => [
              const PopupMenuItem(value: 'amount', child: Text('Sort by Highest Amount')),
              const PopupMenuItem(value: 'name', child: Text('Sort by Name')),
              const PopupMenuItem(value: 'due', child: Text('Sort by Due Date')),
            ],
          ),
          IconButton(icon: const Icon(Icons.refresh), onPressed: _load),
        ],
      ),
      body: _loading
          ? const LoadingWidget(message: 'Loading pending fees...')
          : RefreshIndicator(
              onRefresh: _load,
              child: Column(
                children: [
                  // ── Summary Banner ─────────────────────────────────────
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    color: AppColors.error.withOpacity(0.08),
                    child: Column(children: [
                      Text('Total Pending',
                          style: TextStyle(
                              color: AppColors.error,
                              fontSize: 13,
                              fontWeight: FontWeight.w600)),
                      Text(
                        AppUtils.formatCurrency(_totalPending),
                        style: const TextStyle(
                            color: AppColors.error,
                            fontSize: 26,
                            fontWeight: FontWeight.w800),
                      ),
                      Text('${sorted.length} students with pending fees',
                          style: TextStyle(
                              color: AppColors.error.withOpacity(0.7),
                              fontSize: 12)),
                    ]),
                  ),

                  // ── List ──────────────────────────────────────────────
                  Expanded(
                    child: sorted.isEmpty
                        ? const EmptyState(
                            icon: Icons.check_circle_outline,
                            title: 'All Clear!',
                            subtitle: 'No pending fees — all students have paid',
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.all(12),
                            itemCount: sorted.length,
                            itemBuilder: (_, i) =>
                                _FeeRow(row: sorted[i], type: 'pending'),
                          ),
                  ),
                ],
              ),
            ),
    );
  }
}

// ─── Shared Fee Row Card ──────────────────────────────────────────────────────

class _FeeRow extends StatelessWidget {
  final _StudentFeeRow row;
  final String type; // collected | pending

  const _FeeRow({required this.row, required this.type});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final s = row.student;
    final fee = row.fee;
    final isPending = type == 'pending';

    return Card(
      color: cs.surface,
      margin: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        onTap: () => Navigator.pushNamed(context, AppRoutes.fees,
            arguments: s.id),
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Name + Status
              Row(children: [
                Expanded(
                  child: Text(s.name,
                      style: TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 15,
                          color: cs.onSurface),
                      overflow: TextOverflow.ellipsis),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: isPending
                        ? (fee.isOverdue ? AppColors.error : AppColors.warning)
                            .withOpacity(0.12)
                        : AppColors.success.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    isPending
                        ? (fee.isOverdue ? 'OVERDUE' : 'PENDING')
                        : fee.feeStatus.toUpperCase(),
                    style: TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.w800,
                      color: isPending
                          ? (fee.isOverdue ? AppColors.error : AppColors.warning)
                          : AppColors.success,
                    ),
                  ),
                ),
              ]),
              const SizedBox(height: 6),
              // Info row
              Row(children: [
                Icon(Icons.numbers, size: 11, color: cs.onSurfaceVariant),
                const SizedBox(width: 3),
                Text(s.admissionNumber,
                    style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant)),
                const SizedBox(width: 10),
                Icon(Icons.school_outlined, size: 11, color: cs.onSurfaceVariant),
                const SizedBox(width: 3),
                Text(s.displayClass,
                    style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant)),
                const SizedBox(width: 10),
                Icon(Icons.phone_outlined, size: 11, color: cs.onSurfaceVariant),
                const SizedBox(width: 3),
                Text(s.mobile,
                    style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant)),
              ]),
              const SizedBox(height: 10),
              // Amounts
              Row(children: [
                _amountBox('Total', fee.totalFees, cs.onSurfaceVariant, cs),
                const SizedBox(width: 8),
                _amountBox('Paid', fee.totalPaid, AppColors.success, cs),
                const SizedBox(width: 8),
                _amountBox(
                  'Remaining',
                  fee.remaining,
                  isPending ? AppColors.error : AppColors.success,
                  cs,
                ),
              ]),
              // Due date (pending only)
              if (isPending && fee.dueDate != null)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Row(children: [
                    Icon(Icons.event,
                        size: 12,
                        color: fee.isOverdue
                            ? AppColors.error
                            : cs.onSurfaceVariant),
                    const SizedBox(width: 4),
                    Text(
                      'Due: ${fee.dueDate!.day}/${fee.dueDate!.month}/${fee.dueDate!.year}'
                      '${fee.isOverdue ? '  ⚠️ ${fee.overdueDays} days overdue' : ''}',
                      style: TextStyle(
                        fontSize: 11,
                        color: fee.isOverdue
                            ? AppColors.error
                            : cs.onSurfaceVariant,
                        fontWeight: fee.isOverdue
                            ? FontWeight.w700
                            : FontWeight.normal,
                      ),
                    ),
                  ]),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _amountBox(String label, double amount, Color color, ColorScheme cs) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
        decoration: BoxDecoration(
          color: color.withOpacity(0.07),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label,
                style: TextStyle(fontSize: 9, color: cs.onSurfaceVariant)),
            const SizedBox(height: 2),
            Text(
              '\u20B9${amount.toStringAsFixed(0)}',
              style: TextStyle(
                  fontSize: 13, fontWeight: FontWeight.w700, color: color),
            ),
          ],
        ),
      ),
    );
  }
}
