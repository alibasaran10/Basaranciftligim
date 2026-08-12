import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/design_widgets.dart';
import '../../../shared/widgets/surum_bottom_nav.dart';
import '../controllers/integrations_controller.dart';

class SyncView extends GetView<IntegrationsController> {
  const SyncView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      bottomNavigationBar: const SurumBottomNav(),
      body: SafeArea(
        bottom: false,
        child: Obx(() {
          if (controller.isLoading.value && controller.sync.isEmpty) {
            return const LoadingView();
          }
          final sync = controller.sync;
          return ListView(
            children: [
              PageBody(
                child: Column(
                  children: [
                    _header(context),
                    const SizedBox(height: 13),
                    _status(context, sync),
                    const SizedBox(height: 10),
                    _statistics(context, sync),
                    const SizedBox(height: 10),
                    _categories(context, sync),
                    const SizedBox(height: 10),
                    _settings(context),
                    const SizedBox(height: 13),
                    Obx(
                      () => FilledButton.icon(
                        onPressed: controller.isLoading.value
                            ? null
                            : controller.synchronize,
                        icon: controller.isLoading.value
                            ? const SizedBox(
                                width: 19,
                                height: 19,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Icon(Icons.sync),
                        label: const Text('Şimdi Senkronize Et'),
                      ),
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
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        IconButton(onPressed: Get.back, icon: const Icon(Icons.arrow_back)),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Veri Senkronizasyonu',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const Text(
                'Verilerinizin bulut sunucu ile senkronizasyon\ndurumunu takip edin.',
                style: TextStyle(color: AppColors.muted, fontSize: 12),
              ),
            ],
          ),
        ),
        IconButton(
          onPressed: () =>
              Get.snackbar('Bilgi', 'Senkronizasyon yardım içeriği açıldı.'),
          icon: const Icon(Icons.info_outline),
        ),
      ],
    );
  }

  Widget _status(BuildContext context, Map<String, dynamic> sync) {
    return SurumCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Senkronizasyon Durumu',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              SizedBox(
                width: 96,
                height: 96,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    const CircularProgressIndicator(
                      value: .86,
                      strokeWidth: 7,
                      color: AppColors.primary,
                      backgroundColor: Color(0xFFC8DDCB),
                    ),
                    Icon(
                      Icons.cloud_upload,
                      color: AppColors.primary,
                      size: 31,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 20),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      '●  Eşzamanlı',
                      style: TextStyle(fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Son Senkronizasyon',
                      style: TextStyle(color: AppColors.muted, fontSize: 12),
                    ),
                    Text(
                      '${sync['lastSync']}',
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 5),
                    const Text(
                      'Otomatik senkronizasyon aktif',
                      style: TextStyle(color: AppColors.primary, fontSize: 12),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _statistics(BuildContext context, Map<String, dynamic> sync) {
    final items = [
      (Icons.storage, 'Bugünkü Veri', '${sync['today']}', AppColors.ink),
      (
        Icons.schedule,
        'Bekleyen Veri',
        '${sync['pending']}',
        AppColors.warning,
      ),
      (Icons.check_circle, 'Başarılı', '${sync['success']}', AppColors.success),
      (Icons.cancel_outlined, 'Hatalı', '${sync['failed']}', AppColors.danger),
    ];
    return SurumCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Senkronizasyon İstatistikleri',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 9),
          Row(
            children: List.generate(items.length, (index) {
              final item = items[index];
              return Expanded(
                child: Container(
                  margin: EdgeInsets.only(right: index == 3 ? 0 : 7),
                  padding: const EdgeInsets.all(9),
                  decoration: BoxDecoration(
                    border: Border.all(color: Theme.of(context).dividerColor),
                    borderRadius: BorderRadius.circular(9),
                  ),
                  child: Row(
                    children: [
                      Icon(item.$1, color: item.$4, size: 22),
                      const SizedBox(width: 6),
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

  Widget _categories(BuildContext context, Map<String, dynamic> sync) {
    final categories = List<Map<String, dynamic>>.from(
      sync['categories'] ?? const [],
    );
    return SurumCard(
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(13),
            child: Text(
              'Veri Kategorileri',
              style: Theme.of(context).textTheme.titleMedium,
            ),
          ),
          ...categories.map(
            (item) => Column(
              children: [
                Divider(height: 1, color: Theme.of(context).dividerColor),
                ListTile(
                  dense: true,
                  leading: const Icon(
                    Icons.dataset_outlined,
                    color: AppColors.primary,
                  ),
                  title: Text(
                    '${item['name']}',
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 12,
                    ),
                  ),
                  subtitle: Text(
                    'Son senkronizasyon: ${item['time']}',
                    style: const TextStyle(fontSize: 10),
                  ),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        '${item['size']}',
                        style: const TextStyle(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w700,
                          fontSize: 11,
                        ),
                      ),
                      const SizedBox(width: 8),
                      const Icon(
                        Icons.check_circle,
                        color: AppColors.success,
                        size: 17,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _settings(BuildContext context) {
    return SurumCard(
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(13),
            child: Text(
              'Senkronizasyon Ayarları',
              style: Theme.of(context).textTheme.titleMedium,
            ),
          ),
          const Divider(height: 1),
          ListTile(
            leading: const Icon(Icons.settings_suggest_outlined),
            title: const Text(
              'Otomatik Senkronizasyon',
              style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12),
            ),
            subtitle: const Text(
              'Veriler arka planda otomatik senkronize edilir',
              style: TextStyle(fontSize: 10),
            ),
            trailing: Obx(
              () => Switch(
                value: controller.automaticSync.value,
                onChanged: (value) => controller.automaticSync.value = value,
              ),
            ),
          ),
          const Divider(height: 1),
          const ListTile(
            leading: Icon(Icons.timer_outlined),
            title: Text(
              'Senkronizasyon Sıklığı',
              style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12),
            ),
            trailing: Text(
              '15 Dakika  ›',
              style: TextStyle(
                color: AppColors.primary,
                fontWeight: FontWeight.w700,
                fontSize: 11,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
