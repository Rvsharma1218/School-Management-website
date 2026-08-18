import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart' show debugPrint;
import 'database_service.dart';

/// Wraps Firebase Auth for email/password login. This sits IN FRONT OF the
/// existing 4-digit PIN lock (PinLockScreen) — sign-in here just proves the
/// device/user is allowed to use the app at all; the PIN remains the
/// quick day-to-day unlock, same as before.
class AuthService {
  static final AuthService instance = AuthService._internal();
  AuthService._internal();

  final FirebaseAuth _auth = FirebaseAuth.instance;

  User? get currentUser => _auth.currentUser;

  /// Firebase persists the session on-device, so this stays true across
  /// app restarts until the user explicitly logs out.
  bool get isLoggedIn => _auth.currentUser != null;

  Stream<User?> get authStateChanges => _auth.authStateChanges();

  Future<void> signIn({required String email, required String password}) async {
    await _auth.signInWithEmailAndPassword(
      email: email.trim(),
      password: password,
    );
  }

  Future<void> signUp({required String email, required String password}) async {
    await _auth.createUserWithEmailAndPassword(
      email: email.trim(),
      password: password,
    );
  }

  Future<void> sendPasswordReset(String email) async {
    await _auth.sendPasswordResetEmail(email: email.trim());
  }

  /// Signs out the current user and wipes local SQLite school data.
  ///
  /// IMPORTANT: SQLite is ONLY cleared here (on explicit user logout) —
  /// NOT on app restart or role switch. This design ensures:
  ///   - Data persists across restarts (offline-first)
  ///   - A new user signing in on the same device starts fresh
  ///   - Firestore realtime streams repopulate SQLite after login
  Future<void> signOut() async {
    try {
      // Wipe local data BEFORE signing out so the Firestore streams
      // (which stop when auth state changes to null) don't race with the wipe.
      await DatabaseService.instance.clearAllLocalData();
      debugPrint('[AuthService] \u2705 Local SQLite data cleared on logout');
    } catch (e) {
      debugPrint('[AuthService] \u26a0\ufe0f clearAllLocalData failed on logout: $e');
      // Still proceed with sign-out even if local clear fails
    }
    await _auth.signOut();
  }

  /// Maps FirebaseAuthException codes to short, user-friendly messages.
  String friendlyError(Object e) {
    if (e is FirebaseAuthException) {
      switch (e.code) {
        case 'user-not-found':
          return 'No account found for this email.';
        case 'wrong-password':
        case 'invalid-credential':
          return 'Incorrect email or password.';
        case 'invalid-email':
          return 'Please enter a valid email address.';
        case 'user-disabled':
          return 'This account has been disabled.';
        case 'too-many-requests':
          return 'Too many attempts. Please try again later.';
        case 'network-request-failed':
          return 'Network error. Check your internet connection.';
        case 'email-already-in-use':
          return 'An account already exists for this email. Try signing in instead.';
        case 'weak-password':
          return 'Password is too weak. Use at least 6 characters.';
        case 'operation-not-allowed':
          return 'Email/password sign-in is not enabled. Contact the app admin.';
        default:
          return e.message ?? 'Login failed. Please try again.';
      }
    }
    return 'Login failed. Please try again.';
  }
}