import 'package:get/get.dart';

import '../../../data/services/api_service.dart';

class HomeController extends GetxController {
  HomeController(this._api);

  final ApiService _api;
  final dashboard = <String, dynamic>{}.obs;
  final isLoading = false.obs;
  final errorMessage = RxnString();

  /// Oturum açıldıktan sonra AuthController tarafından çağrılır.
  Future<void> loadDashboard() async {
    isLoading.value = true;
    errorMessage.value = null;
    try {
      dashboard.assignAll(await _api.getDashboard());
    } on ApiException catch (error) {
      errorMessage.value = error.message;
    } catch (_) {
      errorMessage.value = 'Veriler alınamadı.';
    } finally {
      isLoading.value = false;
    }
  }

  List<Map<String, dynamic>> maps(String key) {
    return List<Map<String, dynamic>>.from(dashboard[key] ?? const []);
  }

  Map<String, dynamic> section(String key) {
    return Map<String, dynamic>.from(dashboard[key] ?? const {});
  }

  String get userName => '${dashboard['userName'] ?? ''}';
  String get farmName => '${dashboard['farmName'] ?? ''}';
  int get alertCount => (dashboard['alertCount'] ?? 0) as int;
}
