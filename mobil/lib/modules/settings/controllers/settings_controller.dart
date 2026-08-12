import 'package:get/get.dart';

import '../../../data/services/api_service.dart';

class SettingsController extends GetxController {
  SettingsController(this._api);

  final ApiService _api;
  final business = <String, dynamic>{}.obs;
  final user = <String, dynamic>{}.obs;
  final subscription = <String, dynamic>{}.obs;
  final preferences = <String, dynamic>{}.obs;
  final twoFactorEnabled = true.obs;
  final isLoading = false.obs;
  final isSaving = false.obs;
  final errorMessage = RxnString();

  Future<void> loadSettings() async {
    isLoading.value = true;
    errorMessage.value = null;
    try {
      final response = await _api.getSettings();
      business.assignAll(Map<String, dynamic>.from(response['business'] ?? const {}));
      user.assignAll(Map<String, dynamic>.from(response['user'] ?? const {}));
      subscription.assignAll(
        Map<String, dynamic>.from(response['subscription'] ?? const {}),
      );
      preferences.assignAll(
        Map<String, dynamic>.from(response['preferences'] ?? const {}),
      );
      final security = Map<String, dynamic>.from(response['security'] ?? const {});
      twoFactorEnabled.value = security['twoFactorEnabled'] == true;
    } on ApiException catch (error) {
      errorMessage.value = error.message;
    } catch (_) {
      errorMessage.value = 'Ayarlar alınamadı.';
    } finally {
      isLoading.value = false;
    }
  }

  /// Anahtarı önce yerel olarak çevirir (anında geri bildirim), sunucu
  /// reddederse eski konuma döner.
  Future<void> togglePreference(String key) async {
    final next = preferences[key] != true;
    preferences[key] = next;
    preferences.refresh();
    try {
      await _api.updatePreference(key, next);
    } catch (_) {
      preferences[key] = !next;
      preferences.refresh();
      Get.snackbar('Kaydedilemedi', 'Tercih güncellenemedi.');
    }
  }

  /// İşletme bilgileri formunu kaydeder.
  Future<void> saveBusiness(Map<String, dynamic> payload) async {
    isSaving.value = true;
    try {
      await _api.updateBusiness(payload);
      await loadSettings();
      Get.snackbar('Kaydedildi', 'İşletme bilgileri güncellendi.');
    } on ApiException catch (error) {
      Get.snackbar('Kaydedilemedi', error.message);
    } finally {
      isSaving.value = false;
    }
  }

  /// Profil formunu kaydeder.
  Future<void> saveProfile(Map<String, dynamic> payload) async {
    isSaving.value = true;
    try {
      await _api.updateProfile(payload);
      await loadSettings();
      Get.snackbar('Kaydedildi', 'Profil bilgileriniz güncellendi.');
    } on ApiException catch (error) {
      Get.snackbar('Kaydedilemedi', error.message);
    } finally {
      isSaving.value = false;
    }
  }

  void save() {
    Get.snackbar('Kaydedildi', 'Bilgileriniz başarıyla güncellendi.');
  }
}
