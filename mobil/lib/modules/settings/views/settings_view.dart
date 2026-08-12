import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../app/routes/app_routes.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/design_widgets.dart';
import '../../auth/controllers/auth_controller.dart';
import '../../navigation/controllers/navigation_controller.dart';

class SettingsView extends StatelessWidget {
  const SettingsView({super.key});

  @override
  Widget build(BuildContext context) {
    final groups = [
      (
        'Hesap & İşletme',
        [
          (
            Icons.assignment_outlined,
            'İşletme Bilgileri',
            'Çiftlik Adı, Adres, İletişim',
            AppRoutes.businessInfo,
          ),
          (
            Icons.person_outline,
            'Kullanıcı Profili',
            'Ad, Soyad, E-posta, Şifre',
            AppRoutes.profile,
          ),
          (
            Icons.workspace_premium_outlined,
            'Abonelik & Lisans',
            'Paket Bilgisi, Yenileme Tarihi',
            AppRoutes.subscription,
          ),
        ],
      ),
      (
        'Sistem Ayarları',
        [
          (
            Icons.notifications_none,
            'Bildirim Ayarları',
            'Alarm, Hatırlatma ve Bildirim Tercihleri',
            '',
          ),
          (
            Icons.camera_alt_outlined,
            'Kamera Entegrasyonu',
            'Kamera Bağlantıları ve Ayarları',
            AppRoutes.camera,
          ),
          (
            Icons.memory_outlined,
            'Cihaz & Tasma Ayarları',
            'Gateway, Tasma ve Sensör Ayarları',
            AppRoutes.device,
          ),
          (
            Icons.cloud_outlined,
            'Veri Senkronizasyonu',
            'Yedekleme ve Senkronizasyon',
            AppRoutes.sync,
          ),
        ],
      ),
      (
        'Diğer',
        [
          (Icons.help_outline, 'Yardım & Destek', 'Sık Sorulan Sorular', ''),
          (Icons.info_outline, 'Hakkında', 'Uygulama Sürümü 1.0.0', ''),
        ],
      ),
    ];

    return SafeArea(
      bottom: false,
      child: ListView(
        children: [
          PageBody(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Ayarlar',
                        style: Theme.of(context).textTheme.headlineMedium,
                      ),
                    ),
                    IconButton(
                      tooltip: 'Tema değiştir',
                      onPressed: Get.find<NavigationController>().toggleTheme,
                      icon: Icon(
                        Get.isDarkMode
                            ? Icons.light_mode_outlined
                            : Icons.dark_mode_outlined,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                ...groups.map(
                  (group) => Padding(
                    padding: const EdgeInsets.only(bottom: 13),
                    child: SurumCard(
                      padding: EdgeInsets.zero,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Padding(
                            padding: const EdgeInsets.fromLTRB(14, 13, 14, 10),
                            child: Text(
                              group.$1,
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                          ),
                          ...group.$2.map(
                            (item) => _settingTile(
                              context,
                              icon: item.$1,
                              title: item.$2,
                              subtitle: item.$3,
                              onTap: () {
                                if (item.$4.isNotEmpty) {
                                  Get.toNamed(item.$4);
                                } else {
                                  Get.snackbar(
                                    item.$2,
                                    '${item.$2} ekranı kullanıma hazır.',
                                  );
                                }
                              },
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                SurumCard(
                  padding: EdgeInsets.zero,
                  child: ListTile(
                    onTap: Get.find<AuthController>().logout,
                    leading: const Icon(Icons.logout, color: AppColors.danger),
                    title: const Text(
                      'Çıkış Yap',
                      style: TextStyle(
                        color: AppColors.danger,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _settingTile(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Column(
      children: [
        Divider(height: 1, color: Theme.of(context).dividerColor),
        ListTile(
          onTap: onTap,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 15,
            vertical: 2,
          ),
          leading: Icon(icon, color: AppColors.primary),
          title: Text(
            title,
            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
          ),
          subtitle: Text(subtitle, style: const TextStyle(fontSize: 11)),
          trailing: const Icon(Icons.chevron_right, size: 21),
        ),
      ],
    );
  }
}
