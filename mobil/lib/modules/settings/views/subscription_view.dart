import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/design_widgets.dart';
import '../../../shared/widgets/surum_bottom_nav.dart';
import '../controllers/settings_controller.dart';

class SubscriptionView extends GetView<SettingsController> {
  const SubscriptionView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      bottomNavigationBar: const SurumBottomNav(),
      body: SafeArea(
        bottom: false,
        child: Obx(() {
          if (controller.isLoading.value && controller.subscription.isEmpty) {
            return const LoadingView();
          }
          final data = controller.subscription;
          return ListView(
            children: [
              PageBody(
                child: Column(
                  children: [
                    _header(context),
                    const SizedBox(height: 12),
                    _package(data),
                    const SizedBox(height: 12),
                    _usage(context, data),
                    const SizedBox(height: 15),
                    _features(context),
                    const SizedBox(height: 14),
                    _invoice(context),
                    const SizedBox(height: 14),
                    FilledButton(
                      onPressed: () =>
                          Get.snackbar('Abonelik', 'Abonelik yönetimi açıldı.'),
                      child: const Text('Aboneliği Yönet'),
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
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Abonelik & Lisans',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const Text(
                'Mevcut paketiniz ve kullanım detayları',
                style: TextStyle(color: AppColors.muted, fontSize: 12),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _package(Map<String, dynamic> data) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(19),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.primary, AppColors.primaryDark],
        ),
        borderRadius: BorderRadius.circular(15),
      ),
      child: Row(
        children: [
          const RoundIcon(
            Icons.workspace_premium,
            color: AppColors.primary,
            background: Colors.white,
            size: 53,
          ),
          const SizedBox(width: 15),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Mevcut Paket',
                  style: TextStyle(color: Colors.white, fontSize: 12),
                ),
                Row(
                  children: [
                    Text(
                      '${data['package']}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(width: 8),
                    const StatusPill('Aktif', color: AppColors.lime),
                  ],
                ),
                const SizedBox(height: 12),
                const Text(
                  'Yıllık Abonelik',
                  style: TextStyle(color: Colors.white),
                ),
                Text(
                  'Bitiş Tarihi: ${data['renewal']}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
          OutlinedButton(
            onPressed: () =>
                Get.snackbar('Paket', 'Paket yükseltme seçenekleri açıldı.'),
            style: OutlinedButton.styleFrom(
              minimumSize: const Size(0, 42),
              foregroundColor: Colors.white,
              side: const BorderSide(color: Colors.white70),
              padding: const EdgeInsets.symmetric(horizontal: 12),
            ),
            child: const Text('Paketi Yükselt'),
          ),
        ],
      ),
    );
  }

  Widget _usage(BuildContext context, Map<String, dynamic> data) {
    final items = [
      (
        'Hayvan Sayısı',
        data['animals'],
        data['animalsLimit'],
        Icons.pets_outlined,
      ),
      ('Tarla Sayısı', data['fields'], data['fieldsLimit'], Icons.grass),
      (
        'Kamera Entegrasyonu',
        data['cameras'],
        data['camerasLimit'],
        Icons.camera_alt_outlined,
      ),
      (
        'Depolama Kullanımı',
        data['storage'],
        data['storageLimit'],
        Icons.cloud_outlined,
      ),
    ];
    return SurumCard(
      padding: const EdgeInsets.all(9),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Kullanım Özeti',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 9),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: items.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 8,
              crossAxisSpacing: 8,
              childAspectRatio: 2.35,
            ),
            itemBuilder: (context, index) {
              final item = items[index];
              return Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: .04),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Theme.of(context).dividerColor),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(item.$1, style: const TextStyle(fontSize: 11)),
                          const Spacer(),
                          RichText(
                            text: TextSpan(
                              style: TextStyle(
                                color: Theme.of(context).colorScheme.onSurface,
                              ),
                              children: [
                                TextSpan(
                                  text: '${item.$2}',
                                  style: const TextStyle(
                                    color: AppColors.primary,
                                    fontSize: 20,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                                TextSpan(text: ' / ${item.$3}'),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    RoundIcon(item.$4, size: 38),
                  ],
                ),
              );
            },
          ),
          const SizedBox(height: 11),
          const Row(
            children: [
              Text('Toplam Kullanım', style: TextStyle(fontSize: 12)),
              Spacer(),
              Text('%64', style: TextStyle(fontWeight: FontWeight.w700)),
            ],
          ),
          const SizedBox(height: 6),
          const LinearProgressIndicator(
            value: .64,
            minHeight: 7,
            backgroundColor: AppColors.divider,
            valueColor: AlwaysStoppedAnimation(AppColors.success),
            borderRadius: BorderRadius.all(Radius.circular(8)),
          ),
        ],
      ),
    );
  }

  Widget _features(BuildContext context) {
    const features = [
      'Sınırsız Tarla Yönetimi',
      'Sınırsız Hayvan Kaydı',
      'Canlı Kamera Entegrasyonu (10 Adet)',
      '7/24 Teknik Destek',
      'Veri Yedekleme',
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Paket Özellikleri',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 7),
        ...features.map(
          (feature) => Padding(
            padding: const EdgeInsets.symmetric(vertical: 3),
            child: Row(
              children: [
                const Icon(
                  Icons.check_circle_outline,
                  color: AppColors.primary,
                  size: 18,
                ),
                const SizedBox(width: 9),
                Text(feature, style: const TextStyle(fontSize: 12)),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _invoice(BuildContext context) {
    return SurumCard(
      child: Row(
        children: [
          const RoundIcon(Icons.receipt_long_outlined, size: 46),
          const SizedBox(width: 11),
          const Expanded(
            child: LabelValue('Fatura Bilgileri', 'Son Fatura\n24.05.2024'),
          ),
          Container(
            width: 1,
            height: 40,
            color: Theme.of(context).dividerColor,
          ),
          const SizedBox(width: 15),
          const Expanded(child: LabelValue('Tutar', '₺2.400,00')),
          IconButton(
            onPressed: () =>
                Get.snackbar('Fatura', 'Fatura indirilmeye hazır.'),
            icon: const Icon(Icons.download_outlined, color: AppColors.primary),
          ),
        ],
      ),
    );
  }
}
