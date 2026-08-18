import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../data/models/teacher_model.dart';
import '../../data/services/auth_service.dart';
import '../../data/services/session_service.dart';
import '../../data/services/teacher_service.dart';
import '../../widgets/common_widgets.dart';

class TeacherManagementScreen extends StatefulWidget {
  const TeacherManagementScreen({super.key});

  @override
  State<TeacherManagementScreen> createState() => _TeacherManagementScreenState();
}

class _TeacherManagementScreenState extends State<TeacherManagementScreen> {
  List<TeacherModel> _teachers = [];
  bool _loading = true;
  String? _schoolUid;
  String? _schoolEmail;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    _schoolUid = SessionService.instance.activeSchoolUid;
    _schoolEmail = AuthService.instance.currentUser?.email;
    if (_schoolUid == null || _schoolEmail == null) {
      setState(() => _loading = false);
      return;
    }
    final list = await TeacherService.instance.listAllTeachers(_schoolUid!);
    if (mounted) setState(() { _teachers = list; _loading = false; });
  }

  Future<void> _showAddTeacherSheet() async {
    final cs = Theme.of(context).colorScheme;
    final nameCtrl = TextEditingController();
    final passwordCtrl = TextEditingController();
    final classCtrl = TextEditingController();
    final sectionCtrl = TextEditingController();
    final formKey = GlobalKey<FormState>();
    bool obscure = true;
    bool saving = false;
    String? error;

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Padding(
          padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
          child: Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: cs.surface,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: Form(
              key: formKey,
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 40, height: 4,
                      margin: const EdgeInsets.only(bottom: 16),
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: cs.onSurfaceVariant.withOpacity(0.4),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    Text('Add Teacher',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: cs.onSurface)),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: nameCtrl,
                      style: TextStyle(color: cs.onSurface),
                      decoration: const InputDecoration(labelText: 'Teacher Name *', border: OutlineInputBorder()),
                      validator: (v) => (v == null || v.trim().isEmpty) ? 'Name is required' : null,
                    ),
                    const SizedBox(height: 14),
                    TextFormField(
                      controller: passwordCtrl,
                      obscureText: obscure,
                      style: TextStyle(color: cs.onSurface),
                      decoration: InputDecoration(
                        labelText: 'Set Password *',
                        border: const OutlineInputBorder(),
                        suffixIcon: IconButton(
                          icon: Icon(obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                          onPressed: () => setSheetState(() => obscure = !obscure),
                        ),
                      ),
                      validator: (v) => (v == null || v.length < 6) ? 'At least 6 characters' : null,
                    ),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: classCtrl,
                            style: TextStyle(color: cs.onSurface),
                            decoration: const InputDecoration(
                              labelText: 'Assign Class (e.g. Class 5)',
                              border: OutlineInputBorder(),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: TextFormField(
                            controller: sectionCtrl,
                            style: TextStyle(color: cs.onSurface),
                            decoration: const InputDecoration(
                              labelText: 'Section (e.g. A)',
                              border: OutlineInputBorder(),
                            ),
                          ),
                        ),
                      ],
                    ),
                    if (error != null) ...[
                      const SizedBox(height: 10),
                      Text(error!, style: const TextStyle(color: AppColors.error, fontSize: 12)),
                    ],
                    const SizedBox(height: 18),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                        ),
                        onPressed: saving
                            ? null
                            : () async {
                          if (!formKey.currentState!.validate()) return;
                          setSheetState(() { saving = true; error = null; });
                          try {
                            await TeacherService.instance.createTeacher(
                              schoolUid: _schoolUid!,
                              schoolEmail: _schoolEmail!,
                              name: nameCtrl.text,
                              password: passwordCtrl.text,
                              assignedClass: classCtrl.text,
                              assignedSection: sectionCtrl.text,
                            );
                            if (ctx.mounted) Navigator.pop(ctx);
                            _load();
                          } catch (e) {
                            setSheetState(() { saving = false; error = 'Could not add teacher: $e'; });
                          }
                        },
                        child: saving
                            ? const SizedBox(width: 20, height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white))
                            : const Text('Add Teacher', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _editTeacher(TeacherModel teacher) async {
    final cs = Theme.of(context).colorScheme;
    final nameCtrl = TextEditingController(text: teacher.name);
    final classCtrl = TextEditingController(text: teacher.assignedClass ?? '');
    final sectionCtrl = TextEditingController(text: teacher.assignedSection ?? '');

    await showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('Edit ${teacher.name}'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameCtrl,
                decoration: const InputDecoration(labelText: 'Teacher Name', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: classCtrl,
                decoration: const InputDecoration(labelText: 'Assigned Class / Course', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: sectionCtrl,
                decoration: const InputDecoration(labelText: 'Section (optional)', border: OutlineInputBorder()),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              if (nameCtrl.text.trim().isEmpty) return;
              Navigator.pop(ctx);
              await TeacherService.instance.updateTeacherDetails(
                schoolUid: _schoolUid!,
                schoolEmail: _schoolEmail!,
                teacher: teacher,
                newName: nameCtrl.text,
                assignedClass: classCtrl.text,
                assignedSection: sectionCtrl.text,
              );
              _load();
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  Future<void> _toggleActive(TeacherModel teacher) async {
    await TeacherService.instance.setTeacherActive(
      schoolUid: _schoolUid!, schoolEmail: _schoolEmail!, teacher: teacher, active: !teacher.active,
    );
    _load();
  }

  Future<void> _deleteTeacher(TeacherModel teacher) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Delete Teacher?'),
        content: Text(
          'Are you sure you want to delete ${teacher.name}? This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            child: const Text('Delete', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
    if (confirm != true) return;

    try {
      await TeacherService.instance.deleteTeacher(
        schoolUid: _schoolUid!,
        schoolEmail: _schoolEmail!,
        teacher: teacher,
      );
      _load();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${teacher.name} has been deleted.'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Delete failed: $e'), backgroundColor: AppColors.error),
        );
      }
    }
  }

  Future<void> _resetPassword(TeacherModel teacher) async {
    final passwordCtrl = TextEditingController();
    bool obscure = true;
    final newPassword = await showDialog<String>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Text('Reset Password — ${teacher.name}'),
          content: TextField(
            controller: passwordCtrl,
            obscureText: obscure,
            decoration: InputDecoration(
              labelText: 'New Password',
              border: const OutlineInputBorder(),
              suffixIcon: IconButton(
                icon: Icon(obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                onPressed: () => setDialogState(() => obscure = !obscure),
              ),
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () {
                if (passwordCtrl.text.length < 6) return;
                Navigator.pop(ctx, passwordCtrl.text);
              },
              child: const Text('Reset'),
            ),
          ],
        ),
      ),
    );
    if (newPassword == null) return;
    try {
      await TeacherService.instance.resetTeacherPassword(
        schoolUid: _schoolUid!, schoolEmail: _schoolEmail!, teacher: teacher, newPassword: newPassword,
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Password reset. Share the new password with the teacher.'),
              backgroundColor: AppColors.success),
        );
      }
      _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Reset failed: $e'), backgroundColor: AppColors.error),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      backgroundColor: cs.background,
      appBar: AppBar(
        title: const Text('Teacher Management'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showAddTeacherSheet,
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text(
          'Add Teacher',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
        ),
      ),
      body: _loading
          ? const LoadingWidget()
          : _teachers.isEmpty
          ? const EmptyState(icon: Icons.school_outlined, title: 'No Teachers Added')
          : RefreshIndicator(
        onRefresh: _load,
        child: ListView.builder(
          padding: const EdgeInsets.all(14),
          itemCount: _teachers.length,
          itemBuilder: (ctx, i) {
            final t = _teachers[i];
            return Card(
              color: cs.surface,
              margin: const EdgeInsets.only(bottom: 10),
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        CircleAvatar(
                          backgroundColor: AppColors.primary.withOpacity(0.12),
                          child: const Icon(Icons.school_outlined, color: AppColors.primary),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                t.name,
                                style: TextStyle(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 15,
                                  color: cs.onSurface,
                                ),
                              ),
                              Text(
                                'Teacher ID: ${t.teacherId}',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: cs.onSurfaceVariant,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'Assigned: ${t.displayAssignedClass}',
                                style: TextStyle(
                                  fontSize: 11.5,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.primary,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: t.active ? AppColors.successLight : AppColors.errorLight,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            t.active ? 'Active' : 'Disabled',
                            style: TextStyle(
                              fontSize: 11, fontWeight: FontWeight.w700,
                              color: t.active ? AppColors.success : AppColors.error,
                            ),
                          ),
                        ),
                      ],
                    ),
                    Divider(height: 20, color: cs.outlineVariant),
                    Wrap(
                      alignment: WrapAlignment.spaceBetween,
                      spacing: 4,
                      runSpacing: 4,
                      children: [
                        TextButton.icon(
                          onPressed: () => _editTeacher(t),
                          icon: Icon(Icons.edit_outlined, size: 16, color: cs.primary),
                          label: Text('Edit', style: TextStyle(color: cs.primary)),
                        ),
                        TextButton.icon(
                          onPressed: () => _resetPassword(t),
                          icon: Icon(Icons.lock_reset, size: 16, color: cs.primary),
                          label: Text('Reset', style: TextStyle(color: cs.primary)),
                        ),
                        TextButton.icon(
                          onPressed: () => _toggleActive(t),
                          icon: Icon(t.active ? Icons.block : Icons.check_circle_outline, size: 16),
                          label: Text(t.active ? 'Disable' : 'Enable'),
                          style: TextButton.styleFrom(
                            foregroundColor: t.active ? AppColors.error : AppColors.success,
                          ),
                        ),
                        TextButton.icon(
                          onPressed: () => _deleteTeacher(t),
                          icon: const Icon(Icons.delete_outline, size: 16),
                          label: const Text('Delete'),
                          style: TextButton.styleFrom(
                            foregroundColor: AppColors.error,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}