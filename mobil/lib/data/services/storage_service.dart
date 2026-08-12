import 'package:get/get.dart';

/// Basit anahtar/değer deposu (oturum jetonları ve kullanıcı bilgisi).
///
/// Uygulama ömrü boyunca bellekte tutulur; kalıcı saklama gerektiğinde bu
/// sınıfın gövdesi güvenli bir depoya (flutter_secure_storage) taşınabilir,
/// çağıran katmanlar değişmez.
class StorageService extends GetxService {
  final _memory = <String, dynamic>{};

  static const accessTokenKey = 'accessToken';
  static const refreshTokenKey = 'refreshToken';
  static const userKey = 'user';

  T? read<T>(String key) => _memory[key] as T?;

  Future<void> write(String key, dynamic value) async {
    _memory[key] = value;
  }

  Future<void> remove(String key) async {
    _memory.remove(key);
  }

  Future<void> clearSession() async {
    _memory.remove(accessTokenKey);
    _memory.remove(refreshTokenKey);
    _memory.remove(userKey);
  }

  String? get accessToken => read<String>(accessTokenKey);
  String? get refreshToken => read<String>(refreshTokenKey);
  Map<String, dynamic>? get user => read<Map<String, dynamic>>(userKey);
  bool get isAuthenticated => (accessToken ?? '').isNotEmpty;
}
