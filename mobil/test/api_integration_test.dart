// Mobil API katmaninin CALISAN backend'e karsi ucdan uca dogrulamasi.
//
// Bu test sahte (mock) veri kullanmaz: gercek `/api/v1` ucuna baglanir, seed
// edilmis hesapla oturum acar ve her ekranin besledigi metodun dolu veri
// dondurdugunu kontrol eder. Boylece "ekranda statik veri kalmadi" iddiasi
// makine tarafindan dogrulanir.
//
// Calistirmak icin backend ayakta olmalidir:
//   cd backend && npm start
//   cd mobil && flutter test test/api_integration_test.dart
//
// Farkli bir adres icin:
//   flutter test --dart-define=API_BASE_URL=http://127.0.0.1:4000/api/v1

import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:get/get.dart';
import 'package:surum/data/services/api_service.dart';
import 'package:surum/data/services/storage_service.dart';

void main() {
  // flutter_test varsayilan olarak tum HTTP isteklerini engeller (400 doner).
  // Bu paket gercek backend'e karsi calistigi icin engel kaldirilir.
  HttpOverrides.global = null;

  late ApiService api;
  late StorageService storage;

  setUpAll(() async {
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
    expect(storage.isAuthenticated, isTrue, reason: 'Jeton saklanmadi');
  });

  tearDownAll(Get.reset);

  test('giris kullanici ve ciftlik bilgisini dondurur', () {
    final user = storage.user;
    expect(user, isNotNull);
    expect('${user!['name']}', isNotEmpty);
    expect('${user['email']}', 'info@yesilvadiciftligi.com');
  });

  test('ana ekran verisi dolu gelir', () async {
    final data = await api.getDashboard();

    expect('${data['userName']}', isNotEmpty);
    expect('${data['farmName']}', isNotEmpty);
    expect(data['animalCount'], greaterThan(0));
    expect(data['quickStats'], isA<List<dynamic>>());
    expect((data['quickStats'] as List).length, greaterThan(0));
    expect((data['notifications'] as List), isNotEmpty);
    expect((data['stocks'] as List), isNotEmpty);
    expect(data['weather'], isA<Map<dynamic, dynamic>>());
  });

  test('tarla listesi dolu gelir ve alanlari eslesir', () async {
    final fields = await api.getFields();

    expect(fields, isNotEmpty);
    final field = fields.first;
    for (final key in ['id', 'name', 'size', 'soil', 'irrigation', 'crop']) {
      expect('${field[key]}', isNotEmpty, reason: '"$key" alani bos geldi');
    }
  });

  test('suru ozeti ve hayvan listesi dolu gelir', () async {
    final herd = await api.getHerd();

    final summary = herd['summary'] as List<dynamic>;
    final animals = herd['animals'] as List<dynamic>;
    expect(summary, isNotEmpty);
    expect(animals, isNotEmpty);

    final animal = animals.first as Map<String, dynamic>;
    expect('${animal['tag']}', isNotEmpty);
    expect('${animal['breed']}', isNotEmpty);
  });

  test('hayvan detayi biyolojik takvim ve saglik gecmisi icerir', () async {
    final herd = await api.getHerd();
    final animals = herd['animals'] as List<dynamic>;
    final id = '${(animals.first as Map<String, dynamic>)['id']}';

    final detail = await api.getAnimalDetail(id);
    expect('${detail['tag']}', isNotEmpty);
    expect('${detail['breed']}', isNotEmpty);
    // Soyagaci ve dogum tarihi artik sunucudan gelir (ekranda sabit deger yok).
    expect(detail.containsKey('birthDate'), isTrue);
    expect(detail.containsKey('sire'), isTrue);
    expect(detail.containsKey('dam'), isTrue);
    expect(detail['timeline'], isA<List<dynamic>>());
    expect(detail['healthRecords'], isA<List<dynamic>>());
  });

  test('ayarlar isletme, kullanici ve abonelik bilgisini dondurur', () async {
    final settings = await api.getSettings();

    final business = settings['business'] as Map<String, dynamic>;
    final user = settings['user'] as Map<String, dynamic>;
    final subscription = settings['subscription'] as Map<String, dynamic>;

    expect('${business['name']}', isNotEmpty);
    expect('${user['name']}', isNotEmpty);
    expect('${subscription['package']}', isNotEmpty);
    expect(subscription['animalsLimit'], isNotNull);
  });

  test('entegrasyonlar kamera, tasma ve senkronizasyon verisi dondurur', () async {
    final data = await api.getIntegrations();

    final cameras = data['cameras'] as Map<String, dynamic>;
    final wearables = data['wearables'] as List<dynamic>;
    final sync = data['sync'] as Map<String, dynamic>;

    expect(cameras['total'], greaterThan(0));
    expect(wearables, isNotEmpty);
    expect('${sync['lastSync']}', isNotEmpty);
    expect(sync['categories'], isA<List<dynamic>>());
  });
}
