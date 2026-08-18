import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/constants/app_colors.dart';

class WhatsAppService {
  static const MethodChannel _channel = MethodChannel('school_app/whatsapp');

  static Future<Map<String, bool>> checkInstalledApps() async {
    try {
      final result = await _channel.invokeMethod<Map>('checkWhatsAppInstalled');
      if (result != null) {
        return {
          'whatsapp': result['whatsapp'] == true,
          'business': result['business'] == true,
        };
      }
    } catch (e) {
      debugPrint('WhatsApp check error: $e');
    }
    return {'whatsapp': false, 'business': false};
  }

  static Future<String?> showChooserDialog(BuildContext context) async {
    return showModalBottomSheet<String>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => const _WhatsAppChooserSheet(),
    );
  }

  static Future<void> sendMessage({
    required BuildContext context,
    required String phone,
    required String message,
  }) async {
    final apps = await checkInstalledApps();
    final hasWa = apps['whatsapp'] == true;
    final hasW4b = apps['business'] == true;

    if (!hasWa && !hasW4b) {
      // Fallback via URL launcher if MethodChannel package check doesn't detect installed app or on desktop/emulator
      final cleaned = phone.replaceAll(RegExp(r'\D'), '');
      final number = cleaned.startsWith('91') ? cleaned : '91$cleaned';
      final encoded = Uri.encodeComponent(message);
      final uri = Uri.parse('https://wa.me/$number?text=$encoded');
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
        return;
      }
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('WhatsApp / WhatsApp Business not installed on this device'),
            backgroundColor: AppColors.error,
          ),
        );
      }
      return;
    }

    String? selectedPackage;
    if (hasWa && hasW4b) {
      if (!context.mounted) return;
      selectedPackage = await showChooserDialog(context);
      if (selectedPackage == null) return; // Cancelled
    } else if (hasWa) {
      selectedPackage = 'com.whatsapp';
    } else {
      selectedPackage = 'com.whatsapp.w4b';
    }

    try {
      await _channel.invokeMethod('sendWhatsAppMessage', {
        'phone': phone,
        'message': message,
        'package': selectedPackage,
      });
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error launching WhatsApp: $e'), backgroundColor: AppColors.error),
        );
      }
    }
  }

  static Future<void> sendPdf({
    required BuildContext context,
    required String phone,
    required String message,
    required String filePath,
  }) async {
    final apps = await checkInstalledApps();
    final hasWa = apps['whatsapp'] == true;
    final hasW4b = apps['business'] == true;

    if (!hasWa && !hasW4b) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('WhatsApp / WhatsApp Business not installed on this device'),
            backgroundColor: AppColors.error,
          ),
        );
      }
      return;
    }

    String? selectedPackage;
    if (hasWa && hasW4b) {
      if (!context.mounted) return;
      selectedPackage = await showChooserDialog(context);
      if (selectedPackage == null) return; // Cancelled
    } else if (hasWa) {
      selectedPackage = 'com.whatsapp';
    } else {
      selectedPackage = 'com.whatsapp.w4b';
    }

    try {
      await _channel.invokeMethod('sendWhatsAppPdf', {
        'phone': phone,
        'message': message,
        'filePath': filePath,
        'package': selectedPackage,
      });
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error sharing PDF to WhatsApp: $e'), backgroundColor: AppColors.error),
        );
      }
    }
  }

  static String feeReminderMessage({
    required String studentName,
    required String instituteName,
    required double remaining,
    required double total,
  }) {
    return '''Dear Parent of $studentName,

This is a reminder from $instituteName.

📋 Fee Details:
Total Fees: ₹${total.toInt()}
Remaining: ₹${remaining.toInt()}

Please clear the pending fees at the earliest.

Thank you!
$instituteName''';
  }

  static String feeReceiptMessage({
    required String studentName,
    required String admissionNumber,
    required String receiptNumber,
    required String instituteName,
  }) {
    return '''Dear Parent,

Please find the fee receipt of $studentName attached.

Student: $studentName
Admission No: $admissionNumber
Receipt No: $receiptNumber

Regards,
$instituteName''';
  }

  static String admissionConfirmationMessage({
    required String studentName,
    required String studentId,
    required String admissionNumber,
    required String instituteName,
    required String classOrCourse,
  }) {
    return '''Dear Parent,

🎉 Admission Confirmed!

Student: $studentName
Student ID: $studentId
Admission No: $admissionNumber
Class/Course: $classOrCourse

Welcome to $instituteName!
We look forward to a bright future together.

Regards,
$instituteName''';
  }

  static String attendanceNotificationMessage({
    required String studentName,
    required String status,
    required String date,
    required String instituteName,
  }) {
    final emoji = status == 'present' ? '✅' : status == 'absent' ? '❌' : '🟡';
    return '''Dear Parent,

$emoji Attendance Update

Student: $studentName
Date: $date
Status: ${status.toUpperCase()}

$instituteName''';
  }
}

class WhatsAppButtons extends StatelessWidget {
  final String studentName;
  final String mobile;
  final double? remainingFees;
  final double? totalFees;
  final String? studentId;
  final String? admissionNumber;
  final String? classOrCourse;
  final String instituteName;

  const WhatsAppButtons({
    super.key,
    required this.studentName,
    required this.mobile,
    required this.instituteName,
    this.remainingFees,
    this.totalFees,
    this.studentId,
    this.admissionNumber,
    this.classOrCourse,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (remainingFees != null && remainingFees! > 0)
          _WAButton(
            label: 'Send Fee Reminder',
            icon: Icons.payments_outlined,
            color: AppColors.warning,
            onTap: () async {
              try {
                await WhatsAppService.sendMessage(
                  context: context,
                  phone: mobile,
                  message: WhatsAppService.feeReminderMessage(
                    studentName: studentName,
                    instituteName: instituteName,
                    remaining: remainingFees!,
                    total: totalFees ?? 0,
                  ),
                );
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error),
                  );
                }
              }
            },
          ),
        if (studentId != null)
          _WAButton(
            label: 'Send Admission Confirmation',
            icon: Icons.verified_outlined,
            color: AppColors.success,
            onTap: () async {
              try {
                await WhatsAppService.sendMessage(
                  context: context,
                  phone: mobile,
                  message: WhatsAppService.admissionConfirmationMessage(
                    studentName: studentName,
                    studentId: studentId!,
                    admissionNumber: admissionNumber ?? '',
                    instituteName: instituteName,
                    classOrCourse: classOrCourse ?? '',
                  ),
                );
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error),
                  );
                }
              }
            },
          ),
      ],
    );
  }
}

class _WAButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _WAButton({
    required this.label,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: OutlinedButton.icon(
        onPressed: onTap,
        icon: Icon(icon, size: 18),
        label: Text(label),
        style: OutlinedButton.styleFrom(
          foregroundColor: color,
          side: BorderSide(color: color),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      ),
    );
  }
}

/// Bottom-sheet picker shown when both WhatsApp and WhatsApp Business are
/// installed — replaces the old centered AlertDialog. Slides up from the
/// bottom, matches the app's rounded-card + AppColors look, and each option
/// is a full-width tappable row instead of a plain ListTile.
class _WhatsAppChooserSheet extends StatelessWidget {
  const _WhatsAppChooserSheet();

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return SafeArea(
      child: Container(
        margin: const EdgeInsets.fromLTRB(12, 0, 12, 12),
        decoration: BoxDecoration(
          color: cs.surface,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.12), blurRadius: 24, offset: const Offset(0, -4)),
          ],
        ),
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Drag handle
            Container(
              width: 40, height: 4,
              margin: const EdgeInsets.only(bottom: 18),
              decoration: BoxDecoration(
                color: cs.onSurfaceVariant.withOpacity(0.3),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            Row(
              children: [
                Container(
                  width: 40, height: 40,
                  decoration: BoxDecoration(
                    color: const Color(0xFF25D366).withOpacity(0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.chat_bubble_rounded, color: Color(0xFF25D366), size: 22),
                ),
                const SizedBox(width: 12),
                Text('Choose WhatsApp',
                    style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16, color: cs.onSurface)),
              ],
            ),
            const SizedBox(height: 18),
            _chooserRow(
              context: context,
              icon: Icons.chat_bubble_rounded,
              iconColor: const Color(0xFF25D366),
              title: 'WhatsApp',
              subtitle: 'Send via the regular WhatsApp app',
              onTap: () => Navigator.pop(context, 'com.whatsapp'),
            ),
            const SizedBox(height: 10),
            _chooserRow(
              context: context,
              icon: Icons.store_rounded,
              iconColor: const Color(0xFF075E54),
              title: 'WhatsApp Business',
              subtitle: 'Send via WhatsApp Business',
              onTap: () => Navigator.pop(context, 'com.whatsapp.w4b'),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: TextButton(
                onPressed: () => Navigator.pop(context, null),
                style: TextButton.styleFrom(foregroundColor: cs.onSurfaceVariant),
                child: const Text('Cancel'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _chooserRow({
    required BuildContext context,
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    final cs = Theme.of(context).colorScheme;
    return InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: cs.surfaceVariant.withOpacity(0.4),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: cs.outline.withOpacity(0.25)),
        ),
        child: Row(
          children: [
            Container(
              width: 44, height: 44,
              decoration: BoxDecoration(
                color: iconColor.withOpacity(0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: iconColor, size: 24),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14.5, color: cs.onSurface)),
                  const SizedBox(height: 2),
                  Text(subtitle, style: TextStyle(fontSize: 11.5, color: cs.onSurfaceVariant)),
                ],
              ),
            ),
            Icon(Icons.chevron_right_rounded, color: cs.onSurfaceVariant),
          ],
        ),
      ),
    );
  }
}