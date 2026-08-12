import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/design_widgets.dart';
import '../../../shared/widgets/mjpeg_view.dart';
import '../../../shared/widgets/surum_bottom_nav.dart';
import '../controllers/integrations_controller.dart';

class CameraView extends GetView<IntegrationsController> {
  const CameraView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      bottomNavigationBar: const SurumBottomNav(),
      body: SafeArea(
        bottom: false,
        child: Obx(() {
          if (controller.isLoading.value && controller.cameras.isEmpty) {
            return const LoadingView();
          }
          final camera = controller.cameras;
          return ListView(
            children: [
              PageBody(
                child: Column(
                  children: [
                    _header(context),
                    const SizedBox(height: 13),
                    _status(context, camera),
                    const SizedBox(height: 12),
                    _tabs(context),
                    const SizedBox(height: 12),
                    ..._tabContent(context),
                  ],
                ),
              ),
            ],
          );
        }),
      ),
    );
  }

  Widget _header(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        IconButton(onPressed: Get.back, icon: const Icon(Icons.arrow_back)),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Kamera Entegrasyonu',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 3),
              const Text(
                'Güvenlik kameralarınızı sisteme bağlayın ve\ncanlı görüntüleri izleyin.',
                style: TextStyle(color: AppColors.muted, fontSize: 12),
              ),
            ],
          ),
        ),
        IconButton(
          onPressed: () =>
              Get.snackbar('Bilgi', 'Kamera yardım içeriği açıldı.'),
          icon: const Icon(Icons.info_outline),
        ),
      ],
    );
  }

  Widget _status(BuildContext context, Map<String, dynamic> camera) {
    final items = [
      (
        Icons.videocam_outlined,
        'Canlı Yayın',
        '${camera['live'] ?? 0} / ${camera['total']}',
        AppColors.ink,
      ),
      (
        Icons.security,
        'Kayıt Durumu',
        '${camera['recording']} Aktif',
        AppColors.success,
      ),
      (
        Icons.sync,
        'Son Senkronizasyon',
        '${camera['lastSync']}',
        AppColors.muted,
      ),
    ];
    return SurumCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Sistem Durumu', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 10),
          Row(
            children: List.generate(items.length, (index) {
              final item = items[index];
              return Expanded(
                child: Container(
                  margin: EdgeInsets.only(right: index == 2 ? 0 : 8),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 9,
                    vertical: 12,
                  ),
                  decoration: BoxDecoration(
                    border: Border.all(color: Theme.of(context).dividerColor),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    children: [
                      Icon(item.$1, size: 20, color: item.$4),
                      const SizedBox(width: 7),
                      Expanded(child: LabelValue(item.$2, item.$3)),
                    ],
                  ),
                ),
              );
            }),
          ),
        ],
      ),
    );
  }

  Widget _tabs(BuildContext context) {
    const tabs = ['Canlı İzleme', 'Kamera Listesi', 'Kayıtlar'];
    return Obx(
      () => Row(
        children: List.generate(tabs.length, (index) {
          final active = controller.selectedCameraTab.value == index;
          return Expanded(
            child: InkWell(
              onTap: () => controller.selectedCameraTab.value = index,
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 10),
                decoration: BoxDecoration(
                  border: Border(
                    bottom: BorderSide(
                      color: active
                          ? AppColors.primary
                          : Theme.of(context).dividerColor,
                      width: active ? 2 : 1,
                    ),
                  ),
                ),
                child: Text(
                  tabs[index],
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: active ? AppColors.primary : AppColors.muted,
                    fontWeight: active ? FontWeight.w700 : FontWeight.w500,
                  ),
                ),
              ),
            ),
          );
        }),
      ),
    );
  }

  /// Seçili sekmeye göre içerik. Üç sekme de gerçek veriden beslenir.
  List<Widget> _tabContent(BuildContext context) {
    switch (controller.selectedCameraTab.value) {
      case 1:
        return [_cameraList(context)];
      case 2:
        return [_events(context)];
      default:
        return [
          _selector(context),
          const SizedBox(height: 10),
          _liveView(),
          const SizedBox(height: 10),
          _quickActions(context),
          const SizedBox(height: 10),
          _information(context),
        ];
    }
  }

  /// Kamera seçici: dokununca kamera listesi açılır.
  Widget _selector(BuildContext context) {
    final camera = controller.selectedCamera;
    final live = camera?['live'] == true;

    return InkWell(
      onTap: () => _openCameraPicker(context),
      child: SurumCard(
        padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 10),
        child: Row(
          children: [
            Expanded(
              child: Text(
                '${camera?['name'] ?? 'Kamera seçin'}',
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
            ),
            StatusPill(
              live ? '• Canlı' : '• ${camera?['status'] ?? 'Çevrimdışı'}',
              compact: true,
            ),
            const Icon(Icons.keyboard_arrow_down),
          ],
        ),
      ),
    );
  }

  void _openCameraPicker(BuildContext context) {
    final list = controller.cameraList;
    Get.bottomSheet(
      SafeArea(
        child: Container(
          color: Theme.of(context).scaffoldBackgroundColor,
          child: ListView(
            shrinkWrap: true,
            children: [
              const Padding(
                padding: EdgeInsets.all(14),
                child: Text(
                  'Kamera Seç',
                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                ),
              ),
              ...list.map(
                (camera) => ListTile(
                  leading: Icon(
                    camera['live'] == true
                        ? Icons.videocam
                        : Icons.videocam_off_outlined,
                    color: camera['live'] == true
                        ? AppColors.success
                        : AppColors.muted,
                  ),
                  title: Text('${camera['name']}'),
                  subtitle: Text('${camera['group']} · ${camera['status']}'),
                  selected: camera['id'] == controller.selectedCameraId.value,
                  onTap: () {
                    Get.back();
                    controller.selectCamera('${camera['id']}');
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Canlı görüntü. Ajan yayında değilse son bilinen kare gösterilir.
  Widget _liveView() {
    return Obx(() {
      final camera = controller.selectedCamera;
      final url = controller.streamUrl.value;
      final error = controller.streamError.value;

      return ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: AspectRatio(
          aspectRatio: 1.72,
          child: url != null && camera?['live'] == true
              ? MjpegView(streamUrl: url)
              : _offlinePoster(camera, error),
        ),
      );
    });
  }

  Widget _offlinePoster(Map<String, dynamic>? camera, String? error) {
    return Stack(
      fit: StackFit.expand,
      children: [
        if (camera != null)
          Image.asset('${camera['image']}', fit: BoxFit.cover)
        else
          Container(color: const Color(0xFF13251E)),
        Container(color: Colors.black.withValues(alpha: 0.45)),
        Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.videocam_off_outlined, color: Colors.white70),
              const SizedBox(height: 6),
              Text(
                error ?? 'Bu kamera şu an yayında değil',
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white70, fontSize: 11),
              ),
            ],
          ),
        ),
      ],
    );
  }

  /// "Kamera Listesi" sekmesi.
  Widget _cameraList(BuildContext context) {
    final list = controller.cameraList;
    if (list.isEmpty) {
      return const SurumCard(
        child: Padding(
          padding: EdgeInsets.symmetric(vertical: 18),
          child: Center(
            child: Text(
              'Kayıtlı kamera yok.',
              style: TextStyle(color: AppColors.muted, fontSize: 12),
            ),
          ),
        ),
      );
    }

    return SurumCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Kameralar', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 6),
          ...list.map(
            (camera) => ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Icon(
                camera['live'] == true
                    ? Icons.videocam
                    : Icons.videocam_off_outlined,
                color: camera['live'] == true
                    ? AppColors.success
                    : AppColors.muted,
              ),
              title: Text(
                '${camera['name']}',
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
              ),
              subtitle: Text(
                '${camera['location']} · ${camera['recording']}',
                style: const TextStyle(fontSize: 11),
              ),
              trailing: Text(
                '${camera['time']}',
                style: const TextStyle(color: AppColors.muted, fontSize: 11),
              ),
              onTap: () {
                controller.selectCamera('${camera['id']}');
                controller.selectedCameraTab.value = 0;
              },
            ),
          ),
        ],
      ),
    );
  }

  /// "Kayıtlar" sekmesi — sunucudan gelen kamera olayları.
  Widget _events(BuildContext context) {
    final events = controller.cameraEvents;
    if (events.isEmpty) {
      return const SurumCard(
        child: Padding(
          padding: EdgeInsets.symmetric(vertical: 18),
          child: Center(
            child: Text(
              'Henüz kayıt yok.',
              style: TextStyle(color: AppColors.muted, fontSize: 12),
            ),
          ),
        ),
      );
    }

    return SurumCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Son Kayıtlar', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          ...events.map(
            (event) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 6),
              child: Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: Image.asset(
                      '${event['image']}',
                      width: 64,
                      height: 40,
                      fit: BoxFit.cover,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${event['title']}',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        Text(
                          '${event['camera']}',
                          style: const TextStyle(fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                  Text(
                    '${event['time']}',
                    style: const TextStyle(color: AppColors.muted, fontSize: 11),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _quickActions(BuildContext context) {
    final items = [
      (Icons.camera_alt_outlined, 'Anlık Görüntü\nAl', AppColors.primary),
      (Icons.radio_button_checked, 'Kayıt Başlat', AppColors.danger),
      (Icons.volume_up_outlined, 'Hoparlör\nAç', AppColors.blue),
      (Icons.lightbulb_outline, 'Işık\nYak', AppColors.purple),
    ];
    return SurumCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Hızlı İşlemler',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 9),
          Row(
            children: List.generate(items.length, (index) {
              final item = items[index];
              return Expanded(
                child: InkWell(
                  onTap: () {
                    if (index == 1) controller.isRecording.toggle();
                    Get.snackbar('Kamera', item.$2.replaceAll('\n', ' '));
                  },
                  child: Container(
                    margin: EdgeInsets.only(right: index == 3 ? 0 : 8),
                    padding: const EdgeInsets.symmetric(vertical: 11),
                    decoration: BoxDecoration(
                      border: Border.all(color: Theme.of(context).dividerColor),
                      borderRadius: BorderRadius.circular(9),
                    ),
                    child: Column(
                      children: [
                        Icon(item.$1, color: item.$3),
                        const SizedBox(height: 6),
                        Text(
                          item.$2,
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontSize: 10),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }),
          ),
        ],
      ),
    );
  }

  Widget _information(BuildContext context) {
    final camera = controller.selectedCamera;
    final rows = <(String, String)>[
      ('Kamera Adı', '${camera?['name'] ?? '—'}'),
      ('Konum', '${camera?['location'] ?? '—'}'),
      ('Kayıt Modu', '${camera?['recording'] ?? '—'}'),
      if (camera?['agentModel'] != null) ('Cihaz', '${camera!['agentModel']}'),
      (
        'Bağlantı',
        camera?['live'] == true
            ? '◉ Canlı'
            : camera?['online'] == true
                ? '◉ Çevrimiçi'
                : '○ Çevrimdışı',
      ),
    ];
    return SurumCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Kamera Bilgileri',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          ...rows.map(
            (row) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 5),
              child: Row(
                children: [
                  Text(row.$1, style: const TextStyle(fontSize: 12)),
                  const Spacer(),
                  Text(
                    row.$2,
                    style: TextStyle(
                      fontSize: 12,
                      // Bağlantı satırı durumu renkle de anlatır; çevrimdışı
                      // bir kamerayı yeşil göstermek yanıltıcı olurdu.
                      color: row.$1 != 'Bağlantı'
                          ? null
                          : row.$2.startsWith('◉')
                              ? AppColors.success
                              : AppColors.muted,
                      fontWeight: row.$1 == 'Bağlantı'
                          ? FontWeight.w700
                          : FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
