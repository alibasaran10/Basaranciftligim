import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/constants/app_assets.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/design_widgets.dart';
import '../../../shared/widgets/surum_bottom_nav.dart';
import '../controllers/herd_controller.dart';

class HerdDetailView extends GetView<HerdController> {
  const HerdDetailView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      bottomNavigationBar: const SurumBottomNav(),
      body: SafeArea(
        bottom: false,
        child: Obx(() {
          final animal = controller.selectedAnimal;
          if (animal.isEmpty) return const LoadingView();
          return ListView(
            children: [
              PageBody(
                child: Column(
                  children: [
                    _header(context),
                    const SizedBox(height: 9),
                    _profile(animal),
                    const SizedBox(height: 11),
                    _iconTabs(context),
                    const SizedBox(height: 9),
                    _general(context, animal),
                    const SizedBox(height: 10),
                    _calendar(context),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () =>
                                showSuccess('Not', 'Sürü notu eklenebilir.'),
                            icon: const Icon(Icons.note_add_outlined),
                            label: const Text('Not Ekle'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: FilledButton(
                            onPressed: () => showSuccess(
                              'Veteriner',
                              'Veteriner notu oluşturuldu.',
                            ),
                            child: const Text('Veteriner Notu'),
                          ),
                        ),
                      ],
                    ),
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
      children: [
        IconButton(onPressed: Get.back, icon: const Icon(Icons.arrow_back)),
        Expanded(
          child: Text(
            'Sürü Detayı',
            style: Theme.of(context).textTheme.titleLarge,
          ),
        ),
        TextButton(
          onPressed: () =>
              showSuccess('Düzenle', 'Hayvan bilgileri düzenlenebilir.'),
          child: const Text(
            'Düzenle',
            style: TextStyle(
              color: AppColors.primary,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ],
    );
  }

  Widget _profile(Map<String, dynamic> animal) {
    return SurumCard(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipOval(
            child: Image.asset(
              AppAssets.cowPortrait,
              width: 112,
              height: 112,
              fit: BoxFit.cover,
            ),
          ),
          const SizedBox(width: 15),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        '${animal['tag']}',
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 18,
                        ),
                      ),
                    ),
                    const StatusPill(
                      'Kızgınlık / Stres Alarmı',
                      color: AppColors.danger,
                      compact: true,
                    ),
                  ],
                ),
                const SizedBox(height: 15),
                Row(
                  children: [
                    Expanded(child: LabelValue('Irk', '${animal['breed']}')),
                    Expanded(child: LabelValue('Yaş', '${animal['age']}')),
                  ],
                ),
                const SizedBox(height: 10),
                LabelValue('Cinsiyet', '${animal['gender']}'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _iconTabs(BuildContext context) {
    const tabs = [
      (Icons.info_outline, 'Genel Bilgi'),
      (Icons.calendar_month_outlined, 'Takvim'),
      (Icons.health_and_safety_outlined, 'Sağlık'),
      (Icons.notifications_none, 'Alarm Geçmişi'),
      (Icons.camera_alt_outlined, 'Kamera'),
    ];
    return Row(
      children: List.generate(tabs.length, (index) {
        final active = index == 0;
        return Expanded(
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 8),
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
            child: Column(
              children: [
                Icon(
                  tabs[index].$1,
                  size: 22,
                  color: active ? AppColors.primary : AppColors.muted,
                ),
                const SizedBox(height: 5),
                Text(
                  tabs[index].$2,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 9,
                    color: active ? AppColors.primary : AppColors.muted,
                    fontWeight: active ? FontWeight.w700 : FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        );
      }),
    );
  }

  Widget _general(BuildContext context, Map<String, dynamic> animal) {
    final data = [
      ('Kulak Küpe No', '${animal['tag']}', Icons.sell_outlined),
      ('Doğum Tarihi', '${animal['birthDate'] ?? '—'}', Icons.calendar_month_outlined),
      ('Baba', '${animal['sire'] ?? '—'}', Icons.pets_outlined),
      ('Anne', '${animal['dam'] ?? '—'}', Icons.pets_outlined),
      ('Ağırlık', '${animal['weight']}', Icons.monitor_weight_outlined),
      ('Durum', '${animal['status']}', Icons.verified_outlined),
    ];
    return SurumCard(
      padding: const EdgeInsets.all(10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Genel Bilgiler',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: data.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              childAspectRatio: 2.6,
            ),
            itemBuilder: (context, index) {
              final item = data[index];
              return Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  border: Border.all(color: Theme.of(context).dividerColor),
                ),
                child: Row(
                  children: [
                    Icon(item.$3, size: 17, color: AppColors.muted),
                    const SizedBox(width: 8),
                    Expanded(child: LabelValue(item.$1, item.$2)),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _calendar(BuildContext context) {
    final events = [
      ('Tohumlama Tarihi', '10.04.2024', '42 gün önce', AppColors.success),
      ('Tahmini Doğum', '15.01.2025', '123 gün kaldı', AppColors.success),
      ('Kuruya Ayırma', '05.11.2024', '52 gün kaldı', AppColors.warning),
      ('Doğum Geçmişi', '2 Doğum', '', AppColors.muted),
    ];
    return SurumCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Üreme Takvimi', style: Theme.of(context).textTheme.titleMedium),
          const Divider(),
          ...events.map(
            (event) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 5),
              child: Row(
                children: [
                  Icon(Icons.circle_outlined, size: 13, color: event.$4),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(event.$1, style: const TextStyle(fontSize: 12)),
                  ),
                  Text(
                    event.$2,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  SizedBox(
                    width: 88,
                    child: Text(
                      event.$3,
                      textAlign: TextAlign.right,
                      style: TextStyle(
                        fontSize: 10,
                        color: event.$4,
                        fontWeight: FontWeight.w700,
                      ),
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
