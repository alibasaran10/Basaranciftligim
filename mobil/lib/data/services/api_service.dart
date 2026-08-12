import 'package:get/get.dart';

import '../../core/constants/app_assets.dart';
import '../../core/constants/app_strings.dart';
import 'storage_service.dart';

/// Sunucudan dönen hata; ekranlarda kullanıcıya gösterilecek mesajı taşır.
class ApiException implements Exception {
  ApiException(this.message, {this.statusCode = 0});

  final String message;
  final int statusCode;

  @override
  String toString() => message;
}

/// Uygulamadaki tüm uzak veri erişiminin tek giriş noktası.
///
/// Backend (Node.js + Express) `/api/v1` altındaki uçlara bağlanır. Sunucu
/// yanıtları `{ success, data, meta }` zarfıyla gelir; bu sınıf zarfı açar ve
/// ekranların beklediği düz haritalara dönüştürür. Böylece view/controller
/// katmanı sunucu şemasından bağımsız kalır.
class ApiService extends GetConnect {
  ApiService(this._storage);

  final StorageService _storage;

  @override
  void onInit() {
    httpClient.baseUrl = AppStrings.apiBaseUrl;
    httpClient.timeout = const Duration(seconds: 20);

    httpClient.addRequestModifier<dynamic>((request) {
      request.headers['Accept'] = 'application/json';
      final token = _storage.accessToken;
      if (token != null && token.isNotEmpty) {
        request.headers['Authorization'] = 'Bearer $token';
      }
      return request;
    });

    super.onInit();
  }

  // ---------------------------------------------------------------------------
  // Alt seviye istek yardımcıları
  // ---------------------------------------------------------------------------

  /// GET isteği atar; 401 alırsa jetonu bir kez tazeleyip tekrar dener.
  Future<Map<String, dynamic>> _get(String path) async {
    var response = await get(path);

    if (response.statusCode == 401 && await _refreshToken()) {
      response = await get(path);
    }

    return _unwrap(response);
  }

  Future<Map<String, dynamic>> _post(String path, Map<String, dynamic> body) async {
    var response = await post(path, body);

    if (response.statusCode == 401 && await _refreshToken()) {
      response = await post(path, body);
    }

    return _unwrap(response);
  }

  Future<Map<String, dynamic>> _patch(String path, Map<String, dynamic> body) async {
    var response = await patch(path, body);

    if (response.statusCode == 401 && await _refreshToken()) {
      response = await patch(path, body);
    }

    return _unwrap(response);
  }

  /// `{ success, data }` zarfını açar, hata durumunda [ApiException] fırlatır.
  Map<String, dynamic> _unwrap(Response<dynamic> response) {
    final status = response.statusCode ?? 0;
    final body = response.body;

    if (status == 0) {
      throw ApiException(
        'Sunucuya ulaşılamıyor. Backend çalışıyor mu? (${AppStrings.apiBaseUrl})',
      );
    }

    if (body is! Map) {
      throw ApiException('Beklenmeyen sunucu yanıtı.', statusCode: status);
    }

    if (status >= 400 || body['success'] == false) {
      final error = body['error'];
      final message = (error is Map ? error['message'] : null) ?? body['message'];
      throw ApiException(
        '${message ?? 'İstek başarısız'} ($status)',
        statusCode: status,
      );
    }

    final data = body['data'];
    if (data is Map) return Map<String, dynamic>.from(data);
    // Liste dönen uçlarda tek tip erişim için sarmalanır.
    return {'items': data, 'meta': body['meta']};
  }

  /// Refresh jetonuyla yeni access jetonu alır. Başarısızsa oturum düşer.
  Future<bool> _refreshToken() async {
    final refresh = _storage.refreshToken;
    if (refresh == null || refresh.isEmpty) return false;

    final response = await post('/auth/refresh', {'refreshToken': refresh});
    final body = response.body;
    if (response.statusCode != 200 || body is! Map || body['data'] is! Map) {
      await _storage.clearSession();
      return false;
    }

    final data = Map<String, dynamic>.from(body['data'] as Map);
    await _storage.write(StorageService.accessTokenKey, data['accessToken']);
    if (data['refreshToken'] != null) {
      await _storage.write(StorageService.refreshTokenKey, data['refreshToken']);
    }
    return true;
  }

  List<Map<String, dynamic>> _list(dynamic value) {
    if (value is List) {
      return value.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
    }
    return const [];
  }

  Map<String, dynamic> _map(dynamic value) =>
      value is Map ? Map<String, dynamic>.from(value) : <String, dynamic>{};

  // ---------------------------------------------------------------------------
  // Biçimlendirme yardımcıları (Türkçe)
  // ---------------------------------------------------------------------------

  static const _months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
  ];

  String _date(dynamic iso) {
    final date = _parseDate(iso);
    if (date == null) return '—';
    return '${_two(date.day)}.${_two(date.month)}.${date.year}';
  }

  String _dateTime(dynamic iso) {
    final date = _parseDate(iso);
    if (date == null) return '—';
    return '${_date(iso)} ${_two(date.hour)}:${_two(date.minute)}';
  }

  String _time(dynamic iso) {
    final date = _parseDate(iso);
    if (date == null) return '—';
    return '${_two(date.hour)}:${_two(date.minute)}';
  }

  String _longDate(dynamic iso) {
    final date = _parseDate(iso);
    if (date == null) return '—';
    return '${date.day} ${_months[date.month - 1]} ${date.year}';
  }

  /// "2 dk önce", "3 saat önce", "Dün", "12.05.2026"
  String _relative(dynamic iso) {
    final date = _parseDate(iso);
    if (date == null) return '—';
    final diff = DateTime.now().difference(date);
    if (diff.inMinutes < 1) return 'Az önce';
    if (diff.inMinutes < 60) return '${diff.inMinutes} dk önce';
    if (diff.inHours < 24) return '${diff.inHours} saat önce';
    if (diff.inDays == 1) return 'Dün';
    if (diff.inDays < 7) return '${diff.inDays} gün önce';
    return _date(iso);
  }

  DateTime? _parseDate(dynamic iso) {
    if (iso == null) return null;
    return DateTime.tryParse('$iso')?.toLocal();
  }

  String _two(int value) => value.toString().padLeft(2, '0');

  /// 1234.5 -> "1.234,5"
  String _number(dynamic value, {int decimals = 0}) {
    final number = (value is num) ? value : num.tryParse('$value') ?? 0;
    final fixed = number.toStringAsFixed(decimals);
    final parts = fixed.split('.');
    final buffer = StringBuffer();
    final digits = parts[0].replaceAll('-', '');
    for (var i = 0; i < digits.length; i++) {
      if (i > 0 && (digits.length - i) % 3 == 0) buffer.write('.');
      buffer.write(digits[i]);
    }
    final sign = number < 0 ? '-' : '';
    return parts.length > 1 ? '$sign$buffer,${parts[1]}' : '$sign$buffer';
  }

  // ---------------------------------------------------------------------------
  // Kimlik doğrulama
  // ---------------------------------------------------------------------------

  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    try {
      final data = await _post('/auth/login', {
        'email': email.trim(),
        'password': password,
      });

      final user = _map(data['user']);
      await _storage.write(StorageService.accessTokenKey, data['accessToken']);
      await _storage.write(StorageService.refreshTokenKey, data['refreshToken']);
      await _storage.write(StorageService.userKey, user);

      return {'success': true, 'user': user};
    } on ApiException catch (error) {
      return {'success': false, 'message': error.message};
    }
  }

  Future<void> logout() async {
    try {
      await _post('/auth/logout', const {});
    } catch (_) {
      // Sunucuya ulaşılamasa da yerel oturum temizlenir.
    }
    await _storage.clearSession();
  }

  // ---------------------------------------------------------------------------
  // Ana ekran
  // ---------------------------------------------------------------------------

  Future<Map<String, dynamic>> getDashboard() async {
    final results = await Future.wait([
      _get('/dashboard/overview'),
      _get('/alerts?limit=5&status=acik'),
    ]);

    final overview = results[0];
    final alerts = _list(results[1]['items']);
    final totals = _map(overview['totals']);
    final weather = _map(overview['weather']);

    // Bildirim kartlarının rengini alarm kaynağı/önceliği belirler.
    String toneOf(Map<String, dynamic> alert) {
      if (alert['severity'] == 'kritik') return 'danger';
      if (alert['type'] == 'dogum_yaklasiyor') return 'birth';
      return 'harvest';
    }

    return {
      'farmName': overview['farmName'] ?? '',
      'userName': _storage.user?['name'] ?? '',
      'weather': {
        'temperature': weather['temperature'] ?? 0,
        'condition': weather['condition'] ?? '—',
        'humidity': weather['humidity'],
      },
      'animalCount': totals['animals'] ?? 0,
      'alertCount': totals['openAlerts'] ?? 0,
      'quickStats': [
        {'label': 'Tarlalar', 'value': '${totals['fields'] ?? 0}', 'icon': 'fields'},
        {
          'label': 'Stok (${totals['stockUnit'] ?? 'Ton'})',
          'value': _number(totals['stockQuantity'], decimals: 1),
          'icon': 'stock',
        },
        {'label': 'Yaklaşan Doğum', 'value': '${totals['upcomingBirths'] ?? 0}', 'icon': 'birth'},
        {'label': 'Aktif Alarm', 'value': '${totals['openAlerts'] ?? 0}', 'icon': 'alarm'},
      ],
      'notifications': alerts.map((alert) {
        return {
          'id': alert['id'],
          'type': toneOf(alert),
          'title': alert['title'] ?? '',
          'description': alert['message'] ?? '',
          'time': _relative(alert['createdAt']),
          'animalId': _map(alert['animal'])['id'],
        };
      }).toList(),
      'stocks': _list(overview['stockDistribution']).take(3).map((item) {
        return {
          'name': item['name'],
          'amount': '${_number(item['value'], decimals: 1)} ${totals['stockUnit'] ?? 'Ton'}',
          'silo': '',
        };
      }).toList(),
    };
  }

  // ---------------------------------------------------------------------------
  // Tarlalar
  // ---------------------------------------------------------------------------

  Future<List<Map<String, dynamic>>> getFields() async {
    final data = await _get('/fields/view?limit=50');
    final fields = _list(data['items']);

    return fields.map((field) {
      final irrigation = _map(field['irrigation']);
      final harvest = _parseDate(field['expectedHarvestDate']);
      final daysLeft = harvest?.difference(DateTime.now()).inDays;

      return {
        'id': field['id'],
        'code': field['code'] ?? '',
        'name': field['name'] ?? '',
        'slug': field['slug'],
        'size': '${_number(field['areaDonum'])} Dönüm',
        'soil': field['soilType'] ?? '—',
        'irrigation': irrigation['method'] ?? '—',
        'irrigationLabel': irrigation['label'] ?? '—',
        'moisture': irrigation['moisturePercent'],
        'image': AppStrings.assetFor('${field['imageUrl']}', AppAssets.fieldNorth),
        'crop': field['crop'] ?? '—',
        'variety': field['cropVariety'] ?? '',
        'stage': field['growthStage'] ?? '—',
        'sowing': _date(field['sowingDate']),
        'harvest': _date(field['expectedHarvestDate']),
        'days': daysLeft == null
            ? '—'
            : daysLeft >= 0
                ? '$daysLeft gün'
                : 'Tamamlandı',
        'altitude': field['altitudeMeters'] == null ? '—' : '${field['altitudeMeters']} m',
        'expectedYield': field['expectedYieldPerDonum'],
        'actualYield': field['actualYieldPerDonum'],
        'yieldUnit': field['yieldUnit'] ?? 'Ton',
        'updatedAt': _date(field['updatedAt']),
      };
    }).toList();
  }

  // ---------------------------------------------------------------------------
  // Sürü
  // ---------------------------------------------------------------------------

  Future<Map<String, dynamic>> getHerd() async {
    final results = await Future.wait([
      _get('/animals/summary'),
      _get('/animals/view?limit=50'),
      _get('/alerts?limit=30&status=acik&source=suru'),
    ]);

    final summary = results[0];
    final animals = _list(results[1]['items']);
    final alerts = _list(results[2]['items']);
    final totals = _map(summary['totals']);

    // Hayvan başına açık alarm başlığı (liste kartlarındaki uyarı rozeti).
    final alarmByAnimal = <String, String>{};
    for (final alert in alerts) {
      final animalId = _map(alert['animal'])['id'];
      if (animalId != null) {
        alarmByAnimal.putIfAbsent('$animalId', () => '${alert['title'] ?? ''}');
      }
    }

    return {
      'summary': [
        {'label': 'Toplam Hayvan', 'value': '${totals['total'] ?? 0}'},
        {'label': 'Sağmal', 'value': '${totals['milking'] ?? 0}'},
        {'label': 'Kuru', 'value': '${totals['dry'] ?? 0}'},
        {'label': 'Buzağı', 'value': '${totals['calves'] ?? 0}'},
      ],
      'breeds': summary['breeds'] ?? const [],
      'animals': animals.map((animal) {
        final device = _map(animal['device']);
        return {
          'id': animal['id'],
          'tag': animal['earTag'] ?? '',
          'name': animal['name'] ?? '',
          'breed': animal['breed'] ?? '—',
          'age': animal['ageLabel'] ?? '—',
          'gender': animal['genderLabel'] ?? '—',
          'weight': animal['weightKg'] == null ? '—' : '${animal['weightKg']} kg',
          'status': animal['lactationLabel'] ?? '—',
          'health': animal['healthLabel'] ?? '—',
          'battery': device['batteryLevel'] ?? 0,
          'barn': animal['barnSection'] ?? '—',
          'milk': '${_number(animal['dailyMilkLiters'], decimals: 1)} L',
          'birthDate': _date(animal['birthDate']),
          'sire': animal['sireTag'] ?? '—',
          'dam': animal['damTag'] ?? '—',
          'insemination': _date(animal['lastInseminationAt']),
          'expectedBirth': _date(animal['expectedBirthAt']),
          'daysToBirth': animal['daysToBirth'],
          'photo': AppStrings.assetFor('${animal['photoUrl']}', AppAssets.cowPortrait),
          'alarm': alarmByAnimal['${animal['id']}'] ?? '',
        };
      }).toList(),
    };
  }

  /// Hayvan detay ekranı: üreme takvimi ve sağlık geçmişi dahil.
  Future<Map<String, dynamic>> getAnimalDetail(String id) async {
    final data = await _get('/animals/$id/detail');
    final animal = _map(data['animal']);
    final derived = _map(data['derived']);
    final device = _map(animal['device']);

    return {
      'id': animal['_id'],
      'tag': animal['earTag'] ?? '',
      'breed': animal['breed'] ?? '—',
      'age': derived['ageLabel'] ?? '—',
      'gender': animal['gender'] == 'disi' ? 'Dişi' : 'Erkek',
      'weight': animal['weightKg'] == null ? '—' : '${animal['weightKg']} kg',
      'status': derived['lactationLabel'] ?? '—',
      'health': derived['healthLabel'] ?? '—',
      'birthDate': _date(animal['birthDate']),
      'sire': animal['sireTag'] ?? '—',
      'dam': animal['damTag'] ?? '—',
      'battery': device['batteryLevel'] ?? 0,
      'photo': AppStrings.assetFor('${animal['photoUrl']}', AppAssets.cowPortrait),
      'alarm': _list(data['alerts']).isEmpty ? '' : '${_list(data['alerts']).first['title'] ?? ''}',
      'timeline': _list(data['timeline']).map((step) {
        final date = _parseDate(step['date']);
        final diff = date?.difference(DateTime.now()).inDays;
        return {
          'label': step['label'],
          'date': _date(step['date']),
          'done': step['done'] == true,
          'note': diff == null
              ? ''
              : diff >= 0
                  ? '$diff gün kaldı'
                  : '${diff.abs()} gün önce',
        };
      }).toList(),
      'healthRecords': _list(data['healthRecords']).map((record) {
        return {
          'title': record['title'],
          'date': _date(record['date']),
          'by': record['performedBy'] ?? '',
        };
      }).toList(),
      'alerts': _list(data['alerts']).map((alert) {
        return {
          'title': alert['title'] ?? alert['type'],
          'message': alert['message'],
          'time': _dateTime(alert['createdAt']),
          'severity': alert['severity'],
        };
      }).toList(),
    };
  }

  // ---------------------------------------------------------------------------
  // Ayarlar / profil / abonelik
  // ---------------------------------------------------------------------------

  Future<Map<String, dynamic>> getSettings() async {
    final results = await Future.wait([
      _get('/farm/settings'),
      _get('/users/me/profile'),
    ]);

    final settings = results[0];
    final profile = results[1];
    final business = _map(settings['business']);
    final subscription = _map(settings['subscription']);
    final preferences = _map(settings['preferences']);
    final security = _map(settings['security']);

    Map<String, dynamic> usage(String key) => _map(subscription[key]);

    // Genel kullanım oranı: paket limitlerine göre ortalama doluluk.
    final metrics = ['animals', 'fields', 'cameras', 'storage']
        .map((key) => usage(key)['percent'])
        .whereType<num>()
        .toList();
    final overall = metrics.isEmpty
        ? 0
        : (metrics.reduce((a, b) => a + b) / metrics.length).round();

    return {
      'business': {
        'name': business['name'] ?? '',
        'type': business['businessType'] ?? '',
        'tax': business['taxNumber'] ?? '',
        'address': business['address'] ?? '',
        'phone': business['phone'] ?? '',
        'email': business['email'] ?? '',
      },
      'user': {
        'name': profile['name'] ?? '',
        'email': profile['email'] ?? '',
        'phone': profile['phone'] ?? '—',
        'birthDate': _date(profile['birthDate']),
        'role': profile['roleLabel'] ?? '',
      },
      'subscription': {
        'package': subscription['plan'] ?? '',
        'renewal': _date(subscription['renewalAt']),
        'animals': usage('animals')['used'] ?? 0,
        'animalsLimit': usage('animals')['limit'] ?? 0,
        'fields': usage('fields')['used'] ?? 0,
        'fieldsLimit': usage('fields')['limit'] ?? 0,
        'cameras': usage('cameras')['used'] ?? 0,
        'camerasLimit': usage('cameras')['limit'] ?? 0,
        'storage': usage('storage')['used'] ?? 0,
        'storageLimit': usage('storage')['limit'] ?? 0,
        'overallPercent': overall,
        'features': subscription['features'] ?? const [],
        'price': '₺${_number(subscription['annualPrice'], decimals: 2)}',
        'lastInvoice': _date(subscription['lastInvoiceAt']),
        'startedAt': _longDate(subscription['startedAt']),
      },
      'preferences': preferences,
      'security': {
        'twoFactorEnabled': security['twoFactorEnabled'] == true,
        'passwordChangedDaysAgo': security['passwordChangedDaysAgo'],
      },
    };
  }

  /// Ayarlar ekranındaki açık/kapalı anahtarları kaydeder.
  Future<void> updatePreference(String key, bool value) async {
    await _patch('/farm/preferences', {key: value});
  }

  /// İşletme bilgileri formu.
  Future<void> updateBusiness(Map<String, dynamic> payload) async {
    await _patch('/farm/settings', payload);
  }

  /// Profil formu.
  Future<void> updateProfile(Map<String, dynamic> payload) async {
    final data = await _patch('/users/me/profile', payload);
    await _storage.write(StorageService.userKey, data);
  }

  // ---------------------------------------------------------------------------
  // Entegrasyonlar (kamera / tasma / senkronizasyon)
  // ---------------------------------------------------------------------------

  /// Canlı görüntü için kısa ömürlü jeton alır.
  ///
  /// Görüntü yükleyici `Authorization` başlığı gönderemediği için jeton
  /// URL'ye girmek zorundadır; bu yüzden erişim jetonu yerine yalnızca tek
  /// bir kameraya kapsamlı, 2 dakika ömürlü ayrı bir jeton kullanılır.
  Future<Map<String, dynamic>> getCameraStreamToken(String cameraId) async {
    final data = await _post('/cameras/$cameraId/stream-token', const {});
    return {
      'token': data['token'],
      'streamUrl': '${AppStrings.apiBaseUrl}/cameras/$cameraId/stream.mjpeg'
          '?token=${Uri.encodeQueryComponent('${data['token']}')}',
      'snapshotUrl': '${AppStrings.apiBaseUrl}/cameras/$cameraId/snapshot.jpg'
          '?token=${Uri.encodeQueryComponent('${data['token']}')}',
      'expiresInSeconds': data['expiresInSeconds'] ?? 120,
      'online': data['online'] == true,
    };
  }

  Future<Map<String, dynamic>> getIntegrations() async {
    final results = await Future.wait([
      _get('/cameras/overview'),
      _get('/devices/summary'),
      _get('/telemetry/sync-status'),
    ]);

    final cameras = results[0];
    final devices = results[1];
    final sync = results[2];

    final cameraTotals = _map(cameras['totals']);
    final deviceTotals = _map(devices['totals']);
    final syncTotals = _map(sync['totals']);
    final gateway = _map(devices['gateway']);

    return {
      'cameras': {
        'connected': cameraTotals['online'] ?? 0,
        'total': cameraTotals['total'] ?? 0,
        'recording': cameraTotals['recording'] ?? 0,
        'offline': cameraTotals['offline'] ?? 0,
        'lastSync': _time(cameraTotals['lastSync']),
        'live': cameraTotals['live'] ?? 0,
        'list': _list(cameras['cameras']).map((camera) {
          return {
            'id': camera['id'],
            'name': camera['name'],
            'group': camera['group'],
            'location': camera['location'],
            'status': camera['statusLabel'],
            'online': camera['online'] == true,
            // Saha ajani su an kare gonderiyor -> canli akis acilabilir.
            'live': camera['live'] == true,
            'source': camera['source'],
            'agentModel': camera['agentModel'],
            'recording': camera['recordingLabel'],
            'time': camera['lastFrameLabel'],
            'image': AppStrings.assetFor('${camera['snapshotUrl']}', AppAssets.cameraBarn),
          };
        }).toList(),
        'events': _list(cameras['events']).map((event) {
          return {
            'title': event['typeLabel'],
            'camera': event['cameraName'],
            'time': event['timeLabel'],
            'image': AppStrings.assetFor('${event['thumbnailUrl']}', AppAssets.cameraBarn),
          };
        }).toList(),
      },
      'deviceTotals': {
        'total': deviceTotals['total'] ?? 0,
        'active': deviceTotals['active'] ?? 0,
        'lowBattery': deviceTotals['lowBattery'] ?? 0,
        'offline': deviceTotals['offline'] ?? 0,
      },
      'gateway': {
        'online': gateway['online'] == true,
        'statusLabel': gateway['online'] == true ? '●  Online' : '●  Çevrimdışı',
        'lastSeen': _dateTime(gateway['lastSeenAt']),
        'signal': gateway['signalLabel'] ?? '—',
        'connected': gateway['connectedDevices'] ?? 0,
      },
      'wearables': _list(devices['devices']).map((device) {
        final animal = _map(device['animal']);
        return {
          'id': device['id'],
          'tag': animal['earTag'] ?? device['label'] ?? '—',
          'breed': [animal['breed'], device['label']]
              .where((value) => value != null && '$value'.isNotEmpty)
              .join(' • '),
          'status': device['statusLabel'] ?? '—',
          'battery': device['batteryLevel'] ?? 0,
          'lastSeen': _relative(device['lastSeenAt']),
        };
      }).toList(),
      'sync': {
        'lastSync': _dateTime(sync['lastSyncAt']),
        'today': _number(syncTotals['today']),
        'pending': _number(syncTotals['pending']),
        'success': _number(syncTotals['success']),
        'failed': _number(syncTotals['failed']),
        'categories': _list(sync['categories']).map((category) {
          return {
            'name': category['name'],
            'size': '${_number(category['count'])} ${category['unit']}',
            'time': category['timeLabel'],
          };
        }).toList(),
      },
    };
  }
}
