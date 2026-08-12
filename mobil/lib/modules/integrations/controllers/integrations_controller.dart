import 'dart:async';

import 'package:get/get.dart';

import '../../../data/services/api_service.dart';

class IntegrationsController extends GetxController {
  IntegrationsController(this._api);

  final ApiService _api;
  final cameras = <String, dynamic>{}.obs;
  final deviceTotals = <String, dynamic>{}.obs;
  final gateway = <String, dynamic>{}.obs;
  final wearables = <Map<String, dynamic>>[].obs;
  final sync = <String, dynamic>{}.obs;
  final selectedCameraTab = 0.obs;
  final selectedDeviceTab = 0.obs;
  final automaticSync = true.obs;
  final isRecording = false.obs;
  final isLoading = false.obs;
  final errorMessage = RxnString();

  // --- Canlı görüntü ---
  final selectedCameraId = RxnString();
  final streamUrl = RxnString();
  final streamError = RxnString();
  Timer? _streamTokenTimer;

  Future<void> loadIntegrations() async {
    isLoading.value = true;
    errorMessage.value = null;
    try {
      final response = await _api.getIntegrations();
      cameras.assignAll(Map<String, dynamic>.from(response['cameras'] ?? const {}));
      deviceTotals.assignAll(
        Map<String, dynamic>.from(response['deviceTotals'] ?? const {}),
      );
      gateway.assignAll(Map<String, dynamic>.from(response['gateway'] ?? const {}));
      wearables.assignAll(
        List<Map<String, dynamic>>.from(response['wearables'] ?? const []),
      );
      sync.assignAll(Map<String, dynamic>.from(response['sync'] ?? const {}));
      isRecording.value = (cameras['recording'] ?? 0) > 0;

      // Kullanıcı henüz kamera seçmediyse yayında olan ilk kamerayı aç;
      // seçtiği kamera listeden düştüyse seçimi tazele.
      final list = cameraList;
      final stillThere =
          list.any((camera) => camera['id'] == selectedCameraId.value);
      if (!stillThere) {
        final preferred = list.firstWhereOrNull((camera) => camera['live'] == true) ??
            (list.isNotEmpty ? list.first : null);
        if (preferred != null) {
          await selectCamera('${preferred['id']}');
        }
      }
    } on ApiException catch (error) {
      errorMessage.value = error.message;
    } catch (_) {
      errorMessage.value = 'Entegrasyon verileri alınamadı.';
    } finally {
      isLoading.value = false;
    }
  }

  List<Map<String, dynamic>> get cameraList =>
      List<Map<String, dynamic>>.from(cameras['list'] ?? const []);

  /// Ekranda gösterilen kamera (seçim yoksa listenin ilki).
  Map<String, dynamic>? get selectedCamera {
    final list = cameraList;
    if (list.isEmpty) return null;
    return list.firstWhereOrNull((camera) => camera['id'] == selectedCameraId.value) ??
        list.first;
  }

  /// Kamera değiştirir ve canlı görüntü jetonunu alır.
  Future<void> selectCamera(String cameraId) async {
    selectedCameraId.value = cameraId;
    streamUrl.value = null;
    streamError.value = null;
    _streamTokenTimer?.cancel();

    // Ajan bağlı değilse jeton istemenin anlamı yok; ekran poster gösterir.
    final camera = selectedCamera;
    if (camera == null || camera['live'] != true) return;

    await _refreshStreamToken();
  }

  Future<void> _refreshStreamToken() async {
    final cameraId = selectedCameraId.value;
    if (cameraId == null) return;

    try {
      final result = await _api.getCameraStreamToken(cameraId);
      streamUrl.value = '${result['streamUrl']}';
      streamError.value = null;

      // Jeton 2 dakikada dolar; bitmeden yenile ki akış kesintiye uğramasın.
      final ttl = (result['expiresInSeconds'] as num?)?.toInt() ?? 120;
      _streamTokenTimer?.cancel();
      _streamTokenTimer = Timer(
        Duration(seconds: (ttl * 0.75).round().clamp(30, 600)),
        _refreshStreamToken,
      );
    } on ApiException catch (error) {
      streamError.value = error.message;
    } catch (_) {
      streamError.value = 'Canlı görüntü izni alınamadı.';
    }
  }

  @override
  void onClose() {
    _streamTokenTimer?.cancel();
    super.onClose();
  }

  List<Map<String, dynamic>> get cameraEvents =>
      List<Map<String, dynamic>>.from(cameras['events'] ?? const []);

  List<Map<String, dynamic>> get syncCategories =>
      List<Map<String, dynamic>>.from(sync['categories'] ?? const []);

  /// Sunucudan güncel senkronizasyon durumunu yeniden çeker.
  Future<void> synchronize() async {
    await loadIntegrations();
    Get.snackbar('Senkronizasyon', 'Veriler sunucudan yenilendi.');
  }
}
