import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_routes.dart';
import '../../data/models/settings_model.dart';
import '../../data/services/providers.dart';
import '../../widgets/common_widgets.dart';
import '../../widgets/responsive_web_layout.dart';
import '../../widgets/student_photo_picker.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  final _nameCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  final _mobileCtrl = TextEditingController();
  final _principalCtrl = TextEditingController();
  final _affiliationCtrl = TextEditingController();
  final _emailCtrl       = TextEditingController();
  bool _saving = false;
  bool _initialized = false;

  @override
  void dispose() {
    _nameCtrl.dispose(); _addressCtrl.dispose();
    _mobileCtrl.dispose(); _principalCtrl.dispose();
    _affiliationCtrl.dispose(); _emailCtrl.dispose();
    super.dispose();
  }

  void _init(SettingsModel s) {
    if (_initialized) return;
    _nameCtrl.text = s.instituteName;
    _addressCtrl.text = s.address;
    _mobileCtrl.text = s.mobile;
    _principalCtrl.text = s.principalName ?? '';
    _affiliationCtrl.text = s.affiliationNumber ?? '';
    _emailCtrl.text = s.email ?? '';
    _initialized = true;
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      final current = ref.read(settingsProvider).valueOrNull!;
      await ref.read(settingsProvider.notifier).save(current.copyWith(
        instituteName: _nameCtrl.text.trim(),
        address: _addressCtrl.text.trim(),
        mobile: _mobileCtrl.text.trim(),
        principalName: _principalCtrl.text.trim().isEmpty ? null : _principalCtrl.text.trim(),
        affiliationNumber: _affiliationCtrl.text.trim().isEmpty ? null : _affiliationCtrl.text.trim(),
        email: _emailCtrl.text.trim().isEmpty ? null : _emailCtrl.text.trim(),
      ));
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Settings saved!'), backgroundColor: AppColors.success),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final settingsAsync = ref.watch(settingsProvider);
    final themeMode = ref.watch(themeModeProvider);
    final cs = Theme.of(context).colorScheme;

    final isDesktop = MediaQuery.of(context).size.width >= 850;

    final content = Scaffold(
      backgroundColor: cs.background,
      appBar: isDesktop ? null : AppBar(
        title: const Text('Settings'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      body: settingsAsync.when(
        data: (settings) {
          _init(settings);
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // ─── Institute Logo ───────────────────────────────────────
              _buildCard('Institute Logo', Icons.image_outlined, [
                Center(
                  child: StudentPhotoPicker(
                    photoPath: settings.logoPath,
                    onChanged: (path) async {
                      await ref.read(settingsProvider.notifier).save(
                          settings.copyWith(logoPath: path));
                    },
                    size: 100,
                    borderRadius: BorderRadius.circular(16),
                    placeholderIcon: Icons.add_photo_alternate_outlined,
                  ),
                ),
              ]),
              const SizedBox(height: 16),

              // ─── Institute Info ───────────────────────────────────────
              _buildCard('Institute Information', Icons.school_outlined, [
                _field(_nameCtrl, 'Institute Name *', Icons.business),
                const SizedBox(height: 14),
                _field(_principalCtrl, 'Principal Name', Icons.person),
                const SizedBox(height: 14),
                _field(_mobileCtrl, 'Phone Number', Icons.phone, inputType: TextInputType.phone),
                const SizedBox(height: 14),
                _field(_addressCtrl, 'Address', Icons.location_on, maxLines: 3),
                const SizedBox(height: 14),
                _field(_affiliationCtrl, 'Affiliation Number', Icons.numbers),
                const SizedBox(height: 14),
                _field(_emailCtrl, 'Institute Email (Optional)', Icons.email_outlined,
                    inputType: TextInputType.emailAddress),
              ]),
              const SizedBox(height: 16),

              // ─── Academic Session ─────────────────────────────────────
              _buildCard('Academic Session', Icons.calendar_month_outlined, [
                DropdownButtonFormField<String>(
                  value: SettingsModel.getSessions().contains(settings.currentSession)
                      ? settings.currentSession
                      : SettingsModel.getSessions().first,
                  style: TextStyle(color: cs.onSurface, fontSize: 14),
                  dropdownColor: cs.surface,
                  decoration: InputDecoration(
                    labelText: 'Current Session',
                    labelStyle: TextStyle(color: cs.onSurfaceVariant),
                    prefixIcon: Icon(Icons.school, color: cs.onSurfaceVariant),
                    filled: true,
                    fillColor: cs.surfaceVariant,
                    border: OutlineInputBorder(borderSide: BorderSide(color: cs.outline),
                        borderRadius: BorderRadius.circular(12)),
                    enabledBorder: OutlineInputBorder(borderSide: BorderSide(color: cs.outline),
                        borderRadius: BorderRadius.circular(12)),
                  ),
                  items: SettingsModel.getSessions()
                      .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                      .toList(),
                  onChanged: (v) async {
                    await ref.read(settingsProvider.notifier).save(settings.copyWith(currentSession: v));
                  },
                ),
              ]),
              const SizedBox(height: 16),

              // ─── Appearance / Dark Mode ───────────────────────────────
              _buildCard('Appearance', Icons.palette_outlined, [
                Row(
                  children: [
                    Expanded(
                      child: _ThemeOption(
                        label: 'Light',
                        icon: Icons.light_mode,
                        selected: settings.themeMode == 'light',
                        onTap: () => ref.read(themeModeProvider.notifier).setMode('light'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _ThemeOption(
                        label: 'Dark',
                        icon: Icons.dark_mode,
                        selected: settings.themeMode == 'dark',
                        onTap: () => ref.read(themeModeProvider.notifier).setMode('dark'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _ThemeOption(
                        label: 'System',
                        icon: Icons.brightness_auto,
                        selected: settings.themeMode == 'system',
                        onTap: () => ref.read(themeModeProvider.notifier).setMode('system'),
                      ),
                    ),
                  ],
                ),
              ]),
              const SizedBox(height: 16),

              // ─── Save Button ──────────────────────────────────────────
              SizedBox(
                height: 54,
                child: ElevatedButton.icon(
                  onPressed: _saving ? null : _save,
                  icon: _saving
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Icon(Icons.save_rounded),
                  label: Text(_saving ? 'Saving...' : 'Save Settings',
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                ),
              ),
              const SizedBox(height: 16),

              // ─── Backup & Restore ─────────────────────────────────────
              OutlinedButton.icon(
                onPressed: () => Navigator.pushNamed(context, AppRoutes.backup),
                icon: const Icon(Icons.backup_outlined),
                label: const Text('Backup & Restore'),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 54),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
              ),
              const SizedBox(height: 12),

              // ─── Lock App ─────────────────────────────────────────────
              OutlinedButton.icon(
                onPressed: () async {
                  final confirm = await showDialog<bool>(
                    context: context,
                    builder: (ctx) => AlertDialog(
                      title: const Text('Lock App'),
                      content: const Text('This will lock the app. Enter your PIN to access again.'),
                      actions: [
                        TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
                        ElevatedButton(
                          style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
                          onPressed: () => Navigator.pop(ctx, true),
                          child: const Text('Lock'),
                        ),
                      ],
                    ),
                  );
                  if (confirm == true && context.mounted) {
                    Navigator.of(context).pushNamedAndRemoveUntil(AppRoutes.login, (r) => false);
                  }
                },
                icon: const Icon(Icons.lock_outline, color: AppColors.error),
                label: const Text('Lock App', style: TextStyle(color: AppColors.error)),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 54),
                  side: const BorderSide(color: AppColors.error),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
              ),
              const SizedBox(height: 24),

              // ─── App Info ─────────────────────────────────────────────
              Card(
                color: cs.surfaceVariant,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(children: [
                    Icon(Icons.school, size: 36, color: AppColors.primary),
                    const SizedBox(height: 8),
                    Text('School Manager', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16, color: cs.onSurface)),
                    Text('Version 2.0.0', style: TextStyle(color: cs.onSurfaceVariant, fontSize: 13)),
                    const SizedBox(height: 4),
                    Text('School & Computer Institute Management',
                        style: TextStyle(color: cs.onSurfaceVariant, fontSize: 12)),
                  ]),
                ),
              ),
              const SizedBox(height: 32),
            ],
          );
        },
        loading: () => const LoadingWidget(),
        error: (e, _) => Center(child: Text('Error: $e')),
      ),
    );

    if (isDesktop) {
      return ResponsiveWebLayout(
        title: 'Institute Settings',
        currentRoute: AppRoutes.settings,
        body: content,
      );
    }

    return content;
  }

  Widget _buildCard(String title, IconData icon, List<Widget> children) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Container(padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(10)),
                child: Icon(icon, size: 20, color: AppColors.primary)),
            const SizedBox(width: 10),
            Text(title, style: Theme.of(context).textTheme.titleMedium),
          ]),
          const Divider(height: 24),
          ...children,
        ]),
      ),
    );
  }

  Widget _field(TextEditingController ctrl, String label, IconData icon,
      {TextInputType? inputType, int? maxLines}) {
    final cs = Theme.of(context).colorScheme;
    return TextFormField(
      controller: ctrl,
      keyboardType: inputType,
      maxLines: maxLines ?? 1,
      style: TextStyle(color: cs.onSurface, fontSize: 14),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: TextStyle(color: cs.onSurfaceVariant, fontSize: 13),
        prefixIcon: Icon(icon, size: 20, color: cs.onSurfaceVariant),
        filled: true,
        fillColor: cs.surfaceVariant,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: cs.outline)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: cs.outline)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: cs.primary, width: 2)),
      ),
    );
  }
}

class _ThemeOption extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  const _ThemeOption({required this.label, required this.icon, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: selected ? cs.primary : cs.surfaceVariant,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: selected ? cs.primary : cs.outline),
        ),
        child: Column(children: [
          Icon(icon, color: selected ? Colors.white : cs.onSurfaceVariant, size: 22),
          const SizedBox(height: 4),
          Text(label, style: TextStyle(
              color: selected ? Colors.white : cs.onSurface,
              fontWeight: FontWeight.w600, fontSize: 12)),
        ]),
      ),
    );
  }
}