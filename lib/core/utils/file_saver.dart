import 'dart:io';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

/// Handles saving files to device storage or sharing via share sheet.
class FileSaver {
  /// Saves [bytes] to the most accessible storage path on this device.
  /// Returns the saved file path.
  static Future<String> saveToDownloads(List<int> bytes, String filename) async {
    // ─── Try public Downloads folder (/storage/emulated/0/Download)
    try {
      final extDir = await getExternalStorageDirectory();
      if (extDir != null) {
        // External app path: /storage/emulated/0/Android/data/com.xxx/files
        // Navigate up to root: /storage/emulated/0
        final parts = extDir.path.split('/Android');
        if (parts.length >= 2) {
          final downloadsPath = '${parts[0]}/Download';
          final downloadsDir = Directory(downloadsPath);
          if (await downloadsDir.exists()) {
            final file = File('$downloadsPath/$filename');
            await file.writeAsBytes(bytes, flush: true);
            return file.path;
          }
        }
        // Fallback to app-specific external dir
        await extDir.create(recursive: true);
        final file = File('${extDir.path}/$filename');
        await file.writeAsBytes(bytes, flush: true);
        return file.path;
      }
    } catch (_) {}

    // ─── Last resort: app documents directory
    final appDir = await getApplicationDocumentsDirectory();
    final file = File('${appDir.path}/$filename');
    await file.writeAsBytes(bytes, flush: true);
    return file.path;
  }

  /// Shows a stylish bottom sheet with Save to Device + Share buttons.
  static Future<void> showSaveShareSheet(
    BuildContext context, {
    required List<int> bytes,
    required String filename,
    required String subject,
    IconData icon = Icons.table_chart_rounded,
    Color color = const Color(0xFF2E7D32),
  }) async {
    final tempDir = await getTemporaryDirectory();
    final tempFile = File('${tempDir.path}/$filename')
      ..writeAsBytesSync(bytes);

    if (!context.mounted) return;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => _SaveShareSheet(
        bytes: bytes,
        tempFile: tempFile,
        filename: filename,
        subject: subject,
        icon: icon,
        color: color,
      ),
    );
  }
}

class _SaveShareSheet extends StatefulWidget {
  final List<int> bytes;
  final File tempFile;
  final String filename;
  final String subject;
  final IconData icon;
  final Color color;

  const _SaveShareSheet({
    required this.bytes,
    required this.tempFile,
    required this.filename,
    required this.subject,
    required this.icon,
    required this.color,
  });

  @override
  State<_SaveShareSheet> createState() => _SaveShareSheetState();
}

class _SaveShareSheetState extends State<_SaveShareSheet> {
  bool _saving = false;
  String? _savedPath;

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      final path = await FileSaver.saveToDownloads(widget.bytes, widget.filename);
      if (mounted) setState(() { _saving = false; _savedPath = path; });
    } catch (e) {
      if (mounted) {
        setState(() => _saving = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Save failed: $e'), backgroundColor: Colors.red.shade700),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final kb = (widget.bytes.length / 1024).toStringAsFixed(1);

    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        child: Container(
          margin: const EdgeInsets.fromLTRB(12, 0, 12, 12),
          decoration: BoxDecoration(
            color: cs.surface,
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 20),
            ],
          ),
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Handle bar
              Container(
                width: 40, height: 4,
                decoration: BoxDecoration(
                  color: cs.onSurfaceVariant.withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 20),

              // File info
              Row(children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: widget.color.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Icon(widget.icon, color: widget.color, size: 28),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(widget.filename,
                          style: TextStyle(fontWeight: FontWeight.w700,
                              fontSize: 15, color: cs.onSurface),
                          maxLines: 1, overflow: TextOverflow.ellipsis),
                      const SizedBox(height: 2),
                      Row(children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: widget.color.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text('EXCEL', style: TextStyle(fontSize: 10,
                              fontWeight: FontWeight.w800, color: widget.color)),
                        ),
                        const SizedBox(width: 6),
                        Text('$kb KB', style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant)),
                      ]),
                    ],
                  ),
                ),
              ]),
              const SizedBox(height: 16),

              // Saved path banner
              if (_savedPath != null) ...[
                AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.green.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.green.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.check_circle_rounded, color: Colors.green, size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('File saved to device!',
                                style: TextStyle(fontWeight: FontWeight.w700,
                                    color: Colors.green, fontSize: 13)),
                            const SizedBox(height: 4),
                            Text(_savedPath!,
                                style: TextStyle(fontSize: 11, color: Colors.green.shade700),
                                maxLines: 3, overflow: TextOverflow.ellipsis),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),
              ],

              // Action buttons
              Row(children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _saving ? null : _save,
                    icon: _saving
                        ? const SizedBox(width: 16, height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white))
                        : Icon(_savedPath != null ? Icons.check_rounded : Icons.download_rounded),
                    label: Text(
                      _saving
                          ? 'Saving...'
                          : _savedPath != null
                              ? 'Saved ✓'
                              : 'Save to Device',
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _savedPath != null ? Colors.green.shade800 : Colors.green.shade700,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () async {
                      await Share.shareXFiles(
                        [XFile(widget.tempFile.path)],
                        subject: widget.subject,
                      );
                    },
                    icon: const Icon(Icons.share_rounded),
                    label: const Text('Share', style: TextStyle(fontWeight: FontWeight.w700)),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.blue.shade700,
                      side: BorderSide(color: Colors.blue.shade300, width: 1.5),
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
              ]),
              const SizedBox(height: 10),
              TextButton(
                onPressed: () => Navigator.pop(context),
                style: TextButton.styleFrom(foregroundColor: cs.onSurfaceVariant),
                child: const Text('Close'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
