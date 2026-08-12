import 'dart:io' show Platform;

import 'package:flutter/foundation.dart' show kIsWeb;

abstract final class AppStrings {
  static const appName = 'SÜRÜM';
  static const appTagline = 'Akıllı Çiftlik Yönetim Sistemi';

  /// Derleme sırasında geçilebilir: `--dart-define=API_BASE_URL=https://...`
  static const _override = String.fromEnvironment('API_BASE_URL');

  /// Backend API kök adresi.
  ///
  /// Android emülatöründe `localhost` cihazın kendisidir; ana makineye
  /// `10.0.2.2` üzerinden erişilir. iOS simülatörü ve masaüstü ana makineyi
  /// doğrudan `localhost` ile görür.
  static String get apiBaseUrl {
    if (_override.isNotEmpty) return _override;
    if (!kIsWeb && Platform.isAndroid) return 'http://10.0.2.2:4000/api/v1';
    return 'http://localhost:4000/api/v1';
  }

  /// Sunucudan gelen görsel yolları ("/assets/cow_portrait.png") uygulama
  /// içindeki varlık yollarına ("assets/images/cow_portrait.png") çevrilir.
  static String assetFor(String? remotePath, String fallback) {
    if (remotePath == null || remotePath.isEmpty) return fallback;
    if (remotePath.startsWith('/assets/')) {
      return 'assets/images/${remotePath.substring('/assets/'.length)}';
    }
    if (remotePath.startsWith('assets/')) return remotePath;
    return fallback;
  }
}
