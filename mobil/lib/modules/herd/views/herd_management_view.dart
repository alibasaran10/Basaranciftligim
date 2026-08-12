import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../app/routes/app_routes.dart';
import '../../../core/constants/app_assets.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/design_widgets.dart';
import '../controllers/herd_controller.dart';

class HerdManagementView extends GetView<HerdController> {
  const HerdManagementView({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: Obx(() {
        if (controller.isLoading.value && controller.animals.isEmpty) {
          return const LoadingView();
        }
        return RefreshIndicator(
          onRefresh: controller.loadHerd,
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            children: [
              PageBody(
                child: Column(
                  children: [
                    _header(context),
                    const SizedBox(height: 12),
                    _summary(),
                    const SizedBox(height: 14),
                    _tabs(context),
                    const SizedBox(height: 16),
                    if (controller.animals.isNotEmpty)
                      _alarmCard(context, controller.animals.first),
                    const SizedBox(height: 12),
                    if (controller.animals.length > 1)
                      _birthCard(controller.animals[1]),
                  ],
                ),
              ),
            ],
          ),
        );
      }),
    );
  }

  Widget _header(BuildContext context) {
    return Row(
      children: [
        IconButton(
          onPressed: () => Get.snackbar('Geri', 'Ana sayfaya dönebilirsiniz.'),
          icon: const Icon(Icons.arrow_back),
        ),
        Expanded(
          child: Text(
            'Sürü Yönetimi',
            style: Theme.of(context).textTheme.titleLarge,
          ),
        ),
        IconButton(
          onPressed: () => Get.snackbar('Filtre', 'Sürü filtreleri hazır.'),
          icon: const Icon(Icons.filter_alt_outlined),
        ),
      ],
    );
  }

  Widget _summary() {
    const icons = ['🐄', '🌿', '🐂', '🐮'];
    const colors = [
      AppColors.ink,
      AppColors.success,
      AppColors.warning,
      AppColors.blue,
    ];
    return Row(
      children: List.generate(controller.summary.length, (index) {
        final item = controller.summary[index];
        return Expanded(
          child: Padding(
            padding: EdgeInsets.only(
              right: index == controller.summary.length - 1 ? 0 : 7,
            ),
            child: SurumCard(
              padding: const EdgeInsets.fromLTRB(9, 10, 7, 9),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${item['label']}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: AppColors.muted,
                      fontSize: 10,
                    ),
                  ),
                  const SizedBox(height: 7),
                  Row(
                    children: [
                      Text(
                        '${item['value']}',
                        style: TextStyle(
                          fontSize: 23,
                          fontWeight: FontWeight.w800,
                          color: colors[index],
                        ),
                      ),
                      const Spacer(),
                      Text(icons[index], style: const TextStyle(fontSize: 19)),
                    ],
                  ),
                ],
              ),
            ),
          ),
        );
      }),
    );
  }

  Widget _tabs(BuildContext context) {
    const tabs = ['Hayvan Listesi', 'Takvim', 'Alarmlar'];
    return Obx(
      () => Row(
        children: List.generate(tabs.length, (index) {
          final active = controller.selectedTab.value == index;
          return Expanded(
            child: InkWell(
              onTap: () => controller.selectedTab.value = index,
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 11),
                decoration: BoxDecoration(
                  border: Border(
                    bottom: BorderSide(
                      color: active
                          ? AppColors.primary
                          : Theme.of(context).dividerColor,
                      width: active ? 2.2 : 1,
                    ),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      tabs[index],
                      style: TextStyle(
                        color: active ? AppColors.ink : AppColors.muted,
                        fontWeight: active ? FontWeight.w700 : FontWeight.w500,
                      ),
                    ),
                    if (index == 2) ...[
                      const SizedBox(width: 8),
                      const StatusPill(
                        '2',
                        color: AppColors.danger,
                        compact: true,
                      ),
                    ],
                  ],
                ),
              ),
            ),
          );
        }),
      ),
    );
  }

  Widget _alarmCard(BuildContext context, Map<String, dynamic> animal) {
    return SurumCard(
      color: AppColors.danger.withValues(alpha: Get.isDarkMode ? .11 : .045),
      borderColor: AppColors.danger,
      padding: const EdgeInsets.all(13),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Expanded(
                child: Text(
                  'KIZGINLIK / STRES ALARMI',
                  style: TextStyle(
                    color: AppColors.danger,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              StatusPill('YENİ', color: AppColors.danger, compact: true),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              const RoundIcon(Icons.pets, color: AppColors.ink, size: 46),
              const SizedBox(width: 11),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${animal['tag']}',
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 17,
                      ),
                    ),
                    Text(
                      '${animal['breed']} - ${animal['age']}',
                      style: const TextStyle(color: AppColors.muted),
                    ),
                  ],
                ),
              ),
              const Text(
                '10:24\nBugün',
                textAlign: TextAlign.right,
                style: TextStyle(color: AppColors.muted, fontSize: 12),
              ),
            ],
          ),
          const Divider(height: 24),
          const Text(
            'Tespit Edilen Durum',
            style: TextStyle(color: AppColors.muted, fontSize: 12),
          ),
          const SizedBox(height: 3),
          const Row(
            children: [
              Expanded(
                child: Text(
                  'Anormal hareketlilik (Kızgınlık/Stres)',
                  style: TextStyle(fontWeight: FontWeight.w600),
                ),
              ),
              Icon(Icons.monitor_heart_outlined, color: AppColors.danger),
            ],
          ),
          const SizedBox(height: 12),
          const Text(
            'Kamera Görüntüsü',
            style: TextStyle(color: AppColors.muted),
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: AspectRatio(
              aspectRatio: 1.9,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  Image.asset(AppAssets.cameraBarn, fit: BoxFit.cover),
                  Center(
                    child: Container(
                      width: 52,
                      height: 52,
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.play_arrow,
                        color: AppColors.ink,
                        size: 32,
                      ),
                    ),
                  ),
                  const Positioned(
                    left: 9,
                    bottom: 7,
                    child: Text(
                      'CANLI',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 11),
          Row(
            children: [
              Expanded(
                child: FilledButton(
                  onPressed: () {
                    controller.chooseAnimal(animal);
                    Get.toNamed(AppRoutes.herdDetail);
                  },
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.danger,
                    minimumSize: const Size(0, 45),
                  ),
                  child: const Text('Detayları Gör'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: OutlinedButton(
                  onPressed: () =>
                      Get.snackbar('İşlemler', 'Alarm işlemleri açıldı.'),
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size(0, 45),
                    foregroundColor: AppColors.muted,
                    side: const BorderSide(color: AppColors.muted),
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('İşlemler'),
                      Icon(Icons.keyboard_arrow_down),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _birthCard(Map<String, dynamic> animal) {
    return SurumCard(
      color: AppColors.warning.withValues(alpha: Get.isDarkMode ? .11 : .05),
      borderColor: AppColors.warning,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'DOĞUM YAKLAŞIYOR',
            style: TextStyle(
              color: AppColors.warning,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              const Text('🐄', style: TextStyle(fontSize: 31)),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${animal['tag']}',
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                    Text(
                      '${animal['breed']} - ${animal['age']}',
                      style: const TextStyle(color: AppColors.muted),
                    ),
                  ],
                ),
              ),
              const Text(
                '3 gün kaldı',
                style: TextStyle(
                  color: AppColors.warning,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const Icon(Icons.chevron_right, color: AppColors.warning),
            ],
          ),
        ],
      ),
    );
  }
}
