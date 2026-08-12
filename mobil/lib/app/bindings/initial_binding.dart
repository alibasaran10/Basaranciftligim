import 'package:get/get.dart';

import '../../data/services/api_service.dart';
import '../../data/services/storage_service.dart';
import '../../modules/auth/controllers/auth_controller.dart';
import '../../modules/fields/controllers/fields_controller.dart';
import '../../modules/herd/controllers/herd_controller.dart';
import '../../modules/home/controllers/home_controller.dart';
import '../../modules/integrations/controllers/integrations_controller.dart';
import '../../modules/navigation/controllers/navigation_controller.dart';
import '../../modules/settings/controllers/settings_controller.dart';

class InitialBinding extends Bindings {
  @override
  void dependencies() {
    // Depo once kurulur; ApiService istek basliklarinda jetonu buradan okur.
    final storage = Get.put(StorageService(), permanent: true);
    final api = Get.put(ApiService(storage), permanent: true);

    Get.put(AuthController(api, storage), permanent: true);
    Get.put(NavigationController(), permanent: true);
    Get.put(HomeController(api), permanent: true);
    Get.put(FieldsController(api), permanent: true);
    Get.put(HerdController(api), permanent: true);
    Get.put(SettingsController(api), permanent: true);
    Get.put(IntegrationsController(api), permanent: true);
  }
}
