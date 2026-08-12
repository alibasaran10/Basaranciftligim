import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/constants/app_assets.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/design_widgets.dart';
import '../../../shared/widgets/surum_bottom_nav.dart';
import '../controllers/settings_controller.dart';

class BusinessInfoView extends GetView<SettingsController> {
  const BusinessInfoView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      bottomNavigationBar: const SurumBottomNav(),
      body: SafeArea(
        bottom: false,
        child: Obx(() {
          if (controller.isLoading.value && controller.business.isEmpty) {
            return const LoadingView();
          }
          final data = controller.business;
          return ListView(
            children: [
              _header(context),
              const SizedBox(height: 4),
              SizedBox(
                height: 122,
                width: double.infinity,
                child: Image.asset(AppAssets.farmHero, fit: BoxFit.cover),
              ),
              PageBody(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                child: Transform.translate(
                  offset: const Offset(0, -25),
                  child: Column(
                    children: [
                      _businessBadge(data),
                      const SizedBox(height: 13),
                      _basic(context, data),
                      const SizedBox(height: 13),
                      Align(
                        alignment: Alignment.centerLeft,
                        child: Text(
                          'Lokasyon',
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                      ),
                      const SizedBox(height: 8),
                      _map(),
                      const SizedBox(height: 16),
                      FilledButton(
                        onPressed: controller.save,
                        child: const Text('Kaydet'),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        }),
      ),
    );
  }

  Widget _header(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      child: Row(
        children: [
          IconButton(onPressed: Get.back, icon: const Icon(Icons.arrow_back)),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'İşletme Bilgileri',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const Text(
                  'İşletmenizin temel bilgilerini yönetin',
                  style: TextStyle(color: AppColors.muted, fontSize: 12),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _businessBadge(Map<String, dynamic> data) {
    return SurumCard(
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
      child: Row(
        children: [
          Container(
            width: 72,
            height: 72,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                colors: [AppColors.primary, AppColors.primaryDark],
              ),
            ),
            child: const Icon(
              Icons.agriculture_outlined,
              color: Colors.white,
              size: 40,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Çiftlik Adı',
                  style: TextStyle(color: AppColors.muted, fontSize: 12),
                ),
                Text(
                  '${data['name']}',
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          ),
          const StatusPill('Doğrulanmış'),
        ],
      ),
    );
  }

  Widget _basic(BuildContext context, Map<String, dynamic> data) {
    final rows = [
      (Icons.badge_outlined, 'İşletme Adı', '${data['name']}'),
      (Icons.business_center_outlined, 'İşletme Türü', '${data['type']}'),
      (Icons.receipt_long_outlined, 'Vergi No', '${data['tax']}'),
      (Icons.location_on_outlined, 'Adres', '${data['address']}'),
      (Icons.phone_outlined, 'Telefon', '${data['phone']}'),
      (Icons.mail_outline, 'E-posta', '${data['email']}'),
    ];
    return SurumCard(
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(13, 13, 13, 4),
            child: Text(
              'Temel Bilgiler',
              style: Theme.of(context).textTheme.titleMedium,
            ),
          ),
          ...rows.map(
            (row) => Column(
              children: [
                DataRowTile(
                  icon: row.$1,
                  label: row.$2,
                  value: row.$3,
                  onTap: () =>
                      Get.snackbar('Düzenle', '${row.$2} düzenlenebilir.'),
                ),
                if (row != rows.last)
                  Divider(
                    height: 1,
                    indent: 48,
                    color: Theme.of(context).dividerColor,
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _map() {
    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: SizedBox(
        height: 137,
        child: Stack(
          fit: StackFit.expand,
          children: [
            Image.asset(AppAssets.farmMap, fit: BoxFit.cover),
            const Center(
              child: Icon(
                Icons.location_on,
                color: AppColors.primary,
                size: 44,
              ),
            ),
            Positioned(
              left: 0,
              bottom: 0,
              child: FilledButton.icon(
                onPressed: () =>
                    Get.snackbar('Konum', 'Güncel konum kaydedildi.'),
                style: FilledButton.styleFrom(
                  backgroundColor: Colors.white.withValues(alpha: .9),
                  foregroundColor: AppColors.primary,
                  minimumSize: const Size(0, 42),
                  shape: const RoundedRectangleBorder(
                    borderRadius: BorderRadius.only(
                      topRight: Radius.circular(10),
                    ),
                  ),
                ),
                icon: const Icon(Icons.location_on_outlined, size: 17),
                label: const Text('Konumu Güncelle'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
