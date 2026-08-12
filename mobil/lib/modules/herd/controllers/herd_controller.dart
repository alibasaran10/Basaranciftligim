import 'package:get/get.dart';

import '../../../data/services/api_service.dart';

class HerdController extends GetxController {
  HerdController(this._api);

  final ApiService _api;
  final summary = <Map<String, dynamic>>[].obs;
  final animals = <Map<String, dynamic>>[].obs;
  final selectedAnimal = <String, dynamic>{}.obs;
  final selectedTab = 2.obs;
  final isLoading = false.obs;
  final isDetailLoading = false.obs;
  final errorMessage = RxnString();

  Future<void> loadHerd() async {
    isLoading.value = true;
    errorMessage.value = null;
    try {
      final response = await _api.getHerd();
      summary.assignAll(
        List<Map<String, dynamic>>.from(response['summary'] ?? const []),
      );
      animals.assignAll(
        List<Map<String, dynamic>>.from(response['animals'] ?? const []),
      );
      if (animals.isNotEmpty && selectedAnimal.isEmpty) {
        selectedAnimal.assignAll(animals.first);
      }
    } on ApiException catch (error) {
      errorMessage.value = error.message;
    } catch (_) {
      errorMessage.value = 'Sürü verileri alınamadı.';
    } finally {
      isLoading.value = false;
    }
  }

  /// Liste kartından detaya geçerken tam kaydı (üreme takvimi, sağlık
  /// geçmişi) sunucudan çeker; liste yanıtı bunları içermez.
  Future<void> chooseAnimal(Map<String, dynamic> animal) async {
    selectedAnimal.assignAll(animal);
    final id = animal['id'];
    if (id == null) return;

    isDetailLoading.value = true;
    try {
      final detail = await _api.getAnimalDetail('$id');
      selectedAnimal.assignAll({...animal, ...detail});
    } on ApiException catch (error) {
      errorMessage.value = error.message;
    } catch (_) {
      // Detay alınamazsa liste verisiyle devam edilir.
    } finally {
      isDetailLoading.value = false;
    }
  }

  List<Map<String, dynamic>> get timeline =>
      List<Map<String, dynamic>>.from(selectedAnimal['timeline'] ?? const []);

  List<Map<String, dynamic>> get healthRecords =>
      List<Map<String, dynamic>>.from(selectedAnimal['healthRecords'] ?? const []);
}
