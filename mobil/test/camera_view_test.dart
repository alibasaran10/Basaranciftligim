import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:get/get.dart';
import 'package:surum/data/services/api_service.dart';
import 'package:surum/data/services/storage_service.dart';
import 'package:surum/modules/integrations/controllers/integrations_controller.dart';
import 'package:surum/modules/integrations/views/camera_view.dart';
import 'package:surum/modules/navigation/controllers/navigation_controller.dart';

/// Kamera ekraninin GERCEK backend verisiyle ciziledigini dogrular.
///
/// Bu ekran daha once tamamen statikti (Image.asset + sabit satirlar);
/// test, ekranda gorunen metinlerin sunucudan geldigini kanitlar --- yani
/// statige geri donulurse test kirilir.
void main() {
  // Widget testlerinde TestWidgetsFlutterBinding tum HTTP isteklerini 400
  // ile yanitlayan bir HttpOverrides kurar. Bu ekran gercek backend'e karsi
  // dogrulandigi icin binding KURULDUKTAN SONRA override kaldirilmali ---
  // dosyanin basinda yapmak yetmez, binding sonradan geri yaziyor.
  TestWidgetsFlutterBinding.ensureInitialized();
  HttpOverrides.global = null;

  late ApiService api;
  late StorageService storage;
  late IntegrationsController controller;

  setUpAll(() async {
    HttpOverrides.global = null;
    storage = StorageService();
    api = ApiService(storage);
    Get.put<StorageService>(storage);
    Get.put<ApiService>(api);
    api.onInit();

    final result = await api.login(
      email: 'info@yesilvadiciftligi.com',
      password: 'Parola123',
    );
    expect(result['success'], isTrue, reason: 'Seed hesabiyla giris yapilamadi');

    controller = IntegrationsController(api);
    Get.put<IntegrationsController>(controller);
    // Ekran alt gezinme cubugunu icerir; o da kendi denetleyicisini arar.
    Get.put(NavigationController());
    await controller.loadIntegrations();
  });

  tearDownAll(Get.reset);

  test('kamera listesi sunucudan dolu gelir', () {
    expect(controller.cameraList, isNotEmpty);

    final camera = controller.cameraList.first;
    expect(camera['id'], isNotNull);
    expect('${camera['name']}', isNotEmpty);
    // Canli akis alani sunucudan geliyor olmali.
    expect(camera.containsKey('live'), isTrue);
  });

  test('yayindaki kamera icin akis jetonu alinir', () async {
    final live = controller.cameraList.where((c) => c['live'] == true).toList();
    if (live.isEmpty) {
      // Saha ajani bagli degilken bu adim atlanir; asil dogrulama
      // pi-agent calisirken yapilir.
      return;
    }

    await controller.selectCamera('${live.first['id']}');
    expect(controller.streamUrl.value, isNotNull);
    expect(controller.streamUrl.value, contains('stream.mjpeg'));
    expect(controller.streamUrl.value, contains('token='));
  });

  testWidgets('kamera ekrani sunucudan gelen kamera adini gosterir', (tester) async {
    await tester.pumpWidget(
      GetMaterialApp(home: const CameraView()),
    );
    await tester.pump(const Duration(milliseconds: 300));

    final expectedName = '${controller.selectedCamera?['name']}';
    expect(expectedName, isNotEmpty);

    // Ekranda gercekten SUNUCUDAN gelen ad yaziyor mu.
    expect(find.text(expectedName), findsWidgets);

    // Eski statik metinler artik ekranda olmamali.
    expect(find.text('Ahır 1 - Doğum Bölümü'), findsNothing);
    expect(find.text('Doğum Bölümü Sağ Köşe'), findsNothing);
  });

  testWidgets('kamera listesi sekmesi sunucudaki kameralari listeler', (tester) async {
    controller.selectedCameraTab.value = 1;

    await tester.pumpWidget(
      GetMaterialApp(home: const CameraView()),
    );
    await tester.pump(const Duration(milliseconds: 300));

    final firstName = '${controller.cameraList.first['name']}';
    expect(find.text(firstName), findsWidgets);

    controller.selectedCameraTab.value = 0;
  });
}
