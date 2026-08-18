class SettingsModel {
  final String instituteName;
  final String? logoPath;
  final String address;
  final String mobile;
  final String? email;
  final String? website;
  final String? principalName;
  final String? affiliationNumber;
  final String currentSession; // e.g. '2026-27'
  final String themeMode; // 'system' | 'light' | 'dark'

  SettingsModel({
    required this.instituteName,
    this.logoPath,
    required this.address,
    required this.mobile,
    this.email,
    this.website,
    this.principalName,
    this.affiliationNumber,
    this.currentSession = '2026-27',
    this.themeMode = 'light', // Default: Light Mode
  });

  Map<String, dynamic> toMap() {
    return {
      'instituteName': instituteName,
      'logoPath': logoPath,
      'address': address,
      'mobile': mobile,
      'email': email,
      'website': website,
      'principalName': principalName,
      'affiliationNumber': affiliationNumber,
      'currentSession': currentSession,
      'themeMode': themeMode,
    };
  }

  factory SettingsModel.fromMap(Map<String, dynamic> map) {
    return SettingsModel(
      instituteName: map['instituteName'] ?? 'My Institute',
      logoPath: map['logoPath'],
      address: map['address'] ?? '',
      mobile: map['mobile'] ?? '',
      email: map['email'],
      website: map['website'],
      principalName: map['principalName'],
      affiliationNumber: map['affiliationNumber'],
      currentSession: map['currentSession'] ?? '2026-27',
      themeMode: map['themeMode'] ?? 'light', // Default: Light Mode
    );
  }

  factory SettingsModel.defaultSettings() {
    return SettingsModel(
      instituteName: 'My School & Institute',
      address: 'Enter Address Here',
      mobile: '9876543210',
      currentSession: '2026-27',
      themeMode: 'light', // Default: Light Mode
    );
  }

  SettingsModel copyWith({
    String? instituteName,
    String? logoPath,
    String? address,
    String? mobile,
    String? email,
    String? website,
    String? principalName,
    String? affiliationNumber,
    String? currentSession,
    String? themeMode,
  }) {
    return SettingsModel(
      instituteName: instituteName ?? this.instituteName,
      logoPath: logoPath ?? this.logoPath,
      address: address ?? this.address,
      mobile: mobile ?? this.mobile,
      email: email ?? this.email,
      website: website ?? this.website,
      principalName: principalName ?? this.principalName,
      affiliationNumber: affiliationNumber ?? this.affiliationNumber,
      currentSession: currentSession ?? this.currentSession,
      themeMode: themeMode ?? this.themeMode,
    );
  }

  // Generate list of sessions (current ± 3 years)
  static List<String> getSessions() {
    final now = DateTime.now();
    final List<String> sessions = [];
    for (int i = -1; i <= 3; i++) {
      final y = now.year + i;
      sessions.add('${y}-${(y + 1).toString().substring(2)}');
    }
    return sessions;
  }
}
