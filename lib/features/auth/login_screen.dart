import 'dart:async';
import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../data/models/teacher_model.dart';
import '../../data/services/auth_service.dart';
import '../../data/services/database_service.dart';
import '../../data/services/session_service.dart';
import '../../data/services/teacher_service.dart';
import 'pin_lock_screen.dart';

enum _LoginRole { principal, teacher }

/// First auth layer: email/password via Firebase Auth. On success this
/// hands off to [PinLockScreen] (the existing 4-digit PIN), which then
/// leads to the dashboard — same two-step flow, PIN behaviour untouched.
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _confirmPasswordCtrl = TextEditingController();

  bool _obscure = true;
  bool _obscureConfirm = true;
  bool _isSignUp = false;
  bool _submitting = false;
  bool _checkingSession = true;
  String? _errorMsg;

  // ── Teacher-mode state ─────────────────────────────────────────────
  _LoginRole _role = _LoginRole.principal;
  final _teacherSchoolEmailCtrl = TextEditingController();
  final _teacherPasswordCtrl = TextEditingController();
  bool _obscureTeacherPassword = true;
  bool _lookingUpSchool = false;
  String? _resolvedSchoolUid;
  String? _resolvedInstituteName;
  List<TeacherModel> _teacherList = [];
  TeacherModel? _selectedTeacher;

  late final Animation<double> _fadeAnim;

  @override
  void initState() {
    super.initState();
    _fadeAnim = CurvedAnimation(
      parent: AnimationController(vsync: this, duration: const Duration(milliseconds: 800))
        ..forward(),
      curve: Curves.easeIn,
    );
    _checkExistingSession();
  }

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _confirmPasswordCtrl.dispose();
    _teacherSchoolEmailCtrl.dispose();
    _teacherPasswordCtrl.dispose();
    super.dispose();
  }

  /// Firebase keeps the session alive across app restarts, so if the user
  /// is already signed in we skip straight to the PIN screen instead of
  /// asking for email/password every single launch.
  Future<void> _checkExistingSession() async {
    if (AuthService.instance.isLoggedIn) {
      if (!mounted) return;
      _goToPinLock();
      return;
    }
    if (mounted) setState(() => _checkingSession = false);
  }

  void _goToPinLock() {
    Navigator.of(context).pushAndRemoveUntil(
      PageRouteBuilder(
        pageBuilder: (_, a, __) => const PinLockScreen(),
        transitionsBuilder: (_, anim, __, child) =>
            FadeTransition(opacity: anim, child: child),
        transitionDuration: const Duration(milliseconds: 400),
      ),
          (route) => false,
    );
  }

  Future<void> _submit() async {
    if (_role == _LoginRole.teacher) {
      await _submitTeacherLogin();
      return;
    }
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _submitting = true;
      _errorMsg = null;
    });
    try {
      if (_isSignUp) {
        await AuthService.instance.signUp(
          email: _emailCtrl.text.trim(),
          password: _passwordCtrl.text,
        );
      } else {
        await AuthService.instance.signIn(
          email: _emailCtrl.text.trim(),
          password: _passwordCtrl.text,
        );
      }
      final uid = AuthService.instance.currentUser!.uid;
      final email = _emailCtrl.text.trim();
      await SessionService.instance.setPrincipalSession(uid);
      // Best-effort — lets the Teacher-login screen resolve this school by
      // email later. Local settings may not exist yet on a brand-new
      // account; that's fine, it just means no institute name to show yet.
      final localSettings = await DatabaseService.instance.getSettings();
      unawaited(TeacherService.instance.ensureSchoolDirectoryEntry(
        schoolEmail: email,
        schoolUid: uid,
        instituteName: localSettings.instituteName,
      ));
      if (!mounted) return;
      _goToPinLock();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _submitting = false;
        _errorMsg = AuthService.instance.friendlyError(e);
      });
    }
  }

  // ── Teacher-mode flow ────────────────────────────────────────────────

  Future<void> _lookupSchool() async {
    final email = _teacherSchoolEmailCtrl.text.trim();
    if (email.isEmpty || !email.contains('@')) {
      setState(() => _errorMsg = 'Enter a valid school email first');
      return;
    }
    setState(() {
      _lookingUpSchool = true;
      _errorMsg = null;
      _resolvedSchoolUid = null;
      _teacherList = [];
      _selectedTeacher = null;
    });
    try {
      final school = await TeacherService.instance.lookupSchoolByEmail(email);
      if (school == null) {
        setState(() {
          _lookingUpSchool = false;
          _errorMsg = 'No school found for this email';
        });
        return;
      }
      final teachers = await TeacherService.instance.listPublicTeachers(email);
      if (!mounted) return;
      setState(() {
        _resolvedSchoolUid = school['schoolUid'];
        _resolvedInstituteName = school['instituteName'];
        _teacherList = teachers;
        _lookingUpSchool = false;
        if (teachers.isEmpty) {
          _errorMsg = 'No teachers have been added for this school yet';
        }
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _lookingUpSchool = false;
        _errorMsg = 'Could not look up school: $e';
      });
    }
  }

  Future<void> _submitTeacherLogin() async {
    if (_resolvedSchoolUid == null) {
      setState(() => _errorMsg = 'Look up your school email first');
      return;
    }
    if (_selectedTeacher == null) {
      setState(() => _errorMsg = 'Select your name from the list');
      return;
    }
    if (_teacherPasswordCtrl.text.isEmpty) {
      setState(() => _errorMsg = 'Enter your password');
      return;
    }
    setState(() {
      _submitting = true;
      _errorMsg = null;
    });
    try {
      final teacher = await TeacherService.instance.signInTeacher(
        schoolUid: _resolvedSchoolUid!,
        authEmail: _selectedTeacher!.authEmail,
        password: _teacherPasswordCtrl.text,
      );
      await SessionService.instance.setTeacherSession(
        schoolUid: _resolvedSchoolUid!,
        teacherId: teacher.teacherId,
        teacherName: teacher.name,
        assignedClass: teacher.assignedClass,
        assignedSection: teacher.assignedSection,
      );
      if (!mounted) return;
      _goToPinLock();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _submitting = false;
        _errorMsg = AuthService.instance.friendlyError(e);
      });
    }
  }

  void _setRole(_LoginRole role) {
    setState(() {
      _role = role;
      _errorMsg = null;
      _resolvedSchoolUid = null;
      _teacherList = [];
      _selectedTeacher = null;
      _teacherPasswordCtrl.clear();
    });
  }

  void _toggleMode() {
    setState(() {
      _isSignUp = !_isSignUp;
      _errorMsg = null;
      _passwordCtrl.clear();
      _confirmPasswordCtrl.clear();
      _formKey.currentState?.reset();
    });
  }

  Widget _buildPrincipalForm() {
    return Form(
      key: _formKey,
      child: Column(
        children: [
          TextFormField(
            controller: _emailCtrl,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.next,
            style: const TextStyle(color: Colors.white),
            decoration: _inputDecoration('Email', Icons.email_outlined),
            validator: (v) {
              if (v == null || v.trim().isEmpty) return 'Email is required';
              if (!v.contains('@') || !v.contains('.')) return 'Enter a valid email';
              return null;
            },
          ),
          const SizedBox(height: 14),
          TextFormField(
            controller: _passwordCtrl,
            obscureText: _obscure,
            textInputAction: _isSignUp ? TextInputAction.next : TextInputAction.done,
            style: const TextStyle(color: Colors.white),
            decoration: _inputDecoration('Password', Icons.lock_outline).copyWith(
              suffixIcon: IconButton(
                icon: Icon(
                  _obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                  color: Colors.white70,
                ),
                onPressed: () => setState(() => _obscure = !_obscure),
              ),
            ),
            validator: (v) {
              if (v == null || v.isEmpty) return 'Password is required';
              if (v.length < 6) return 'Password must be at least 6 characters';
              return null;
            },
            onFieldSubmitted: (_) {
              if (_isSignUp) return;
              if (!_submitting) _submit();
            },
          ),
          if (_isSignUp) ...[
            const SizedBox(height: 14),
            TextFormField(
              controller: _confirmPasswordCtrl,
              obscureText: _obscureConfirm,
              textInputAction: TextInputAction.done,
              style: const TextStyle(color: Colors.white),
              decoration: _inputDecoration('Confirm Password', Icons.lock_outline).copyWith(
                suffixIcon: IconButton(
                  icon: Icon(
                    _obscureConfirm ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                    color: Colors.white70,
                  ),
                  onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
                ),
              ),
              validator: (v) {
                if (v == null || v.isEmpty) return 'Please confirm your password';
                if (v != _passwordCtrl.text) return 'Passwords do not match';
                return null;
              },
              onFieldSubmitted: (_) => _submitting ? null : _submit(),
            ),
          ],
          const SizedBox(height: 6),
          Align(
            alignment: Alignment.centerRight,
            child: _isSignUp
                ? const SizedBox.shrink()
                : TextButton(
                    onPressed: _submitting ? null : _showForgotPasswordDialog,
                    child: const Text(
                      'Forgot Password?',
                      style: TextStyle(color: Colors.white70, fontSize: 13),
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildTeacherForm() {
    return Column(
      children: [
        TextFormField(
          controller: _teacherSchoolEmailCtrl,
          keyboardType: TextInputType.emailAddress,
          textInputAction: TextInputAction.done,
          style: const TextStyle(color: Colors.white),
          enabled: _resolvedSchoolUid == null,
          decoration: _inputDecoration('School Email', Icons.email_outlined).copyWith(
            suffixIcon: _lookingUpSchool
                ? const Padding(
                    padding: EdgeInsets.all(14),
                    child: SizedBox(
                        width: 16, height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)),
                  )
                : (_resolvedSchoolUid != null
                    ? IconButton(
                        icon: const Icon(Icons.edit, color: Colors.white70, size: 18),
                        onPressed: () => setState(() {
                          _resolvedSchoolUid = null;
                          _teacherList = [];
                          _selectedTeacher = null;
                        }),
                      )
                    : IconButton(
                        icon: const Icon(Icons.arrow_forward, color: Colors.white70),
                        onPressed: _lookupSchool,
                      )),
          ),
          onFieldSubmitted: (_) => _lookupSchool(),
        ),

        if (_resolvedSchoolUid != null) ...[
          const SizedBox(height: 4),
          Align(
            alignment: Alignment.centerLeft,
            child: Text(
              _resolvedInstituteName?.isNotEmpty == true ? _resolvedInstituteName! : 'School found',
              style: const TextStyle(color: Colors.greenAccent, fontSize: 12, fontWeight: FontWeight.w600),
            ),
          ),
          const SizedBox(height: 14),
          DropdownButtonFormField<TeacherModel>(
            value: _selectedTeacher,
            dropdownColor: const Color(0xFF1A2A9C),
            style: const TextStyle(color: Colors.white),
            decoration: _inputDecoration('Select Teacher', Icons.person_outline),
            items: _teacherList
                .map((t) => DropdownMenuItem(value: t, child: Text(t.name)))
                .toList(),
            onChanged: (t) => setState(() => _selectedTeacher = t),
          ),
          const SizedBox(height: 14),
          TextFormField(
            controller: _teacherPasswordCtrl,
            obscureText: _obscureTeacherPassword,
            textInputAction: TextInputAction.done,
            style: const TextStyle(color: Colors.white),
            decoration: _inputDecoration('Password', Icons.lock_outline).copyWith(
              suffixIcon: IconButton(
                icon: Icon(
                  _obscureTeacherPassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                  color: Colors.white70,
                ),
                onPressed: () => setState(() => _obscureTeacherPassword = !_obscureTeacherPassword),
              ),
            ),
            onFieldSubmitted: (_) => _submitting ? null : _submitTeacherLogin(),
          ),
        ],
      ],
    );
  }

  Future<void> _showForgotPasswordDialog() async {
    final ctrl = TextEditingController(text: _emailCtrl.text.trim());
    final formKey = GlobalKey<FormState>();
    bool sending = false;
    String? localError;
    String? localSuccess;

    await showDialog<void>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Row(
            children: [
              Icon(Icons.lock_reset, color: AppColors.primary),
              SizedBox(width: 8),
              Text('Reset Password'),
            ],
          ),
          content: Form(
            key: formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  "Enter your account's email and we'll send a password reset link.",
                  style: TextStyle(fontSize: 13),
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: ctrl,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(
                    labelText: 'Email',
                    prefixIcon: Icon(Icons.email_outlined),
                    border: OutlineInputBorder(),
                  ),
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) return 'Email is required';
                    if (!v.contains('@') || !v.contains('.')) return 'Enter a valid email';
                    return null;
                  },
                ),
                if (localError != null) ...[
                  const SizedBox(height: 10),
                  Text(localError!, style: const TextStyle(color: AppColors.error, fontSize: 12)),
                ],
                if (localSuccess != null) ...[
                  const SizedBox(height: 10),
                  Text(localSuccess!, style: const TextStyle(color: Colors.green, fontSize: 12)),
                ],
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Close'),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
              onPressed: sending
                  ? null
                  : () async {
                if (!formKey.currentState!.validate()) return;
                setDialogState(() {
                  sending = true;
                  localError = null;
                });
                try {
                  await AuthService.instance.sendPasswordReset(ctrl.text.trim());
                  setDialogState(() {
                    sending = false;
                    localSuccess = 'Reset link sent! Check your email.';
                  });
                } catch (e) {
                  setDialogState(() {
                    sending = false;
                    localError = AuthService.instance.friendlyError(e);
                  });
                }
              },
              child: sending
                  ? const SizedBox(
                  width: 16, height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('Send Link'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_checkingSession) {
      return const Scaffold(
        backgroundColor: AppColors.primary,
        body: Center(child: CircularProgressIndicator(color: Colors.white)),
      );
    }

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [
              Color(0xFF0D1B6E),
              Color(0xFF1A2A9C),
              Color(0xFF2B4FD8),
            ],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: SafeArea(
          child: FadeTransition(
            opacity: _fadeAnim,
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 28),
              child: Column(
                children: [
                  const SizedBox(height: 50),

                  // ── Logo ────────────────────────────────────────────
                  Hero(
                    tag: 'app_logo',
                    child: Container(
                      width: 90, height: 90,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            Colors.white.withOpacity(0.25),
                            Colors.white.withOpacity(0.1),
                          ],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white.withOpacity(0.4), width: 2),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.2),
                            blurRadius: 20,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: const Icon(Icons.school_rounded, size: 48, color: Colors.white),
                    ),
                  ),
                  const SizedBox(height: 20),

                  const Text(
                    'School Manager',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 28,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'School & Computer Institute',
                    style: TextStyle(color: Colors.white.withOpacity(0.65), fontSize: 13),
                  ),
                  const SizedBox(height: 36),

                  // ── Principal / Teacher toggle ─────────────────────
                  Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: Colors.white.withOpacity(0.15)),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: _RoleTab(
                            label: 'Principal',
                            icon: Icons.admin_panel_settings_outlined,
                            selected: _role == _LoginRole.principal,
                            onTap: () => _setRole(_LoginRole.principal),
                          ),
                        ),
                        Expanded(
                          child: _RoleTab(
                            label: 'Teacher',
                            icon: Icons.school_outlined,
                            selected: _role == _LoginRole.teacher,
                            onTap: () => _setRole(_LoginRole.teacher),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      _role == _LoginRole.teacher
                          ? 'Teacher Sign In'
                          : (_isSignUp ? 'Create Account' : 'Sign In'),
                      style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w700),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      _role == _LoginRole.teacher
                          ? 'Enter your school email, then select your name'
                          : (_isSignUp
                              ? 'Set up a new account to access the app'
                              : 'Enter your email and password to continue'),
                      style: const TextStyle(color: Colors.white70, fontSize: 13),
                    ),
                  ),
                  const SizedBox(height: 24),

                  if (_role == _LoginRole.principal) _buildPrincipalForm(),
                  if (_role == _LoginRole.teacher) _buildTeacherForm(),

                  if (_errorMsg != null) ...[
                    const SizedBox(height: 8),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      decoration: BoxDecoration(
                        color: Colors.red.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: Colors.red.withOpacity(0.4), width: 1),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.error_outline, color: Colors.white70, size: 16),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(_errorMsg!,
                                style: const TextStyle(color: Colors.white, fontSize: 13)),
                          ),
                        ],
                      ),
                    ),
                  ],

                  const SizedBox(height: 20),

                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      onPressed: _submitting ? null : _submit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: AppColors.primary,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      child: _submitting
                          ? const SizedBox(
                          width: 22, height: 22,
                          child: CircularProgressIndicator(strokeWidth: 2.5, color: AppColors.primary))
                          : Text(
                          _role == _LoginRole.teacher
                              ? 'Login'
                              : (_isSignUp ? 'Create Account' : 'Sign In'),
                          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                    ),
                  ),

                  const SizedBox(height: 16),
                  if (_role == _LoginRole.principal)
                    TextButton(
                      onPressed: _submitting ? null : _toggleMode,
                      child: RichText(
                        text: TextSpan(
                          style: const TextStyle(color: Colors.white70, fontSize: 13.5),
                          children: [
                            TextSpan(text: _isSignUp ? 'Already have an account? ' : "Don't have an account? "),
                            TextSpan(
                              text: _isSignUp ? 'Sign In' : 'Create Account',
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
                            ),
                          ],
                        ),
                      ),
                    ),

                  const SizedBox(height: 32),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(String label, IconData icon) {
    return InputDecoration(
      labelText: label,
      labelStyle: const TextStyle(color: Colors.white70),
      prefixIcon: Icon(icon, color: Colors.white70),
      filled: true,
      fillColor: Colors.white.withOpacity(0.08),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.white.withOpacity(0.25)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Colors.white, width: 1.5),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Colors.redAccent),
      ),
      errorStyle: const TextStyle(color: Colors.redAccent, fontSize: 12),
    );
  }
}

class _RoleTab extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  const _RoleTab({
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 11),
        decoration: BoxDecoration(
          color: selected ? Colors.white : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 16, color: selected ? AppColors.primary : Colors.white70),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                color: selected ? AppColors.primary : Colors.white70,
                fontWeight: FontWeight.w700,
                fontSize: 13,
              ),
            ),
          ],
        ),
      ),
    );
  }
}