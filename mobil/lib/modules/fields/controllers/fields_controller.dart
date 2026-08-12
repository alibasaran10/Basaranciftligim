import 'package:get/get.dart';

import '../../../data/services/api_service.dart';

class FieldsController extends GetxController {
  FieldsController(this._api);

  final ApiService _api;
  final fields = <Map<String, dynamic>>[].obs;
  final selectedField = <String, dynamic>{}.obs;
  final selectedTab = 0.obs;
  final isLoading = false.obs;
  final errorMessage = RxnString();

  Future<void> loadFields() async {
    isLoading.value = true;
    errorMessage.value = null;
    try {
      final result = await _api.getFields();
      fields.assignAll(result);
      if (fields.isNotEmpty) selectedField.assignAll(fields.first);
    } on ApiException catch (error) {
      errorMessage.value = error.message;
    } catch (_) {
      errorMessage.value = 'Tarla verileri alınamadı.';
    } finally {
      isLoading.value = false;
    }
  }

  void chooseField(Map<String, dynamic> field) {
    selectedField.assignAll(field);
  }
}
