import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/surum_bottom_nav.dart';
import '../../auth/controllers/auth_controller.dart';
import '../../fields/views/field_management_view.dart';
import '../../herd/views/herd_management_view.dart';
import '../../home/controllers/home_controller.dart';
import '../../home/views/home_view.dart';
import '../../settings/views/settings_view.dart';
import '../controllers/navigation_controller.dart';

class MainShell extends GetView<NavigationController> {
  const MainShell({super.key});

  @override
  Widget build(BuildContext context) {
    const pages = [
      HomeView(),
      FieldManagementView(),
      HerdManagementView(),
      SettingsView(),
    ];
    return Scaffold(
      drawer: _drawer(context),
      body: Obx(
        () => IndexedStack(
          index: controller.selectedIndex.value,
          children: pages,
        ),
      ),
      bottomNavigationBar: const SurumBottomNav(),
    );
  }

  Widget _drawer(BuildContext context) {
    return Drawer(
      child: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 18, 20, 22),
              child: Row(
                children: [
                  const CircleAvatar(
                    radius: 27,
                    backgroundColor: AppColors.primary,
                    child: Icon(Icons.agriculture, color: Colors.white),
                  ),
                  const SizedBox(width: 13),
                  // Kullanici ve isletme adi oturumdaki gercek veriden gelir.
                  Expanded(
                    child: Obx(() {
                      final home = Get.find<HomeController>();
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            home.userName.isEmpty ? '—' : home.userName,
                            style: const TextStyle(fontWeight: FontWeight.w800),
                          ),
                          Text(
                            home.farmName.isEmpty ? '—' : home.farmName,
                            style: const TextStyle(
                              color: AppColors.muted,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      );
                    }),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            _drawerTile(context, Icons.home_outlined, 'Ana Sayfa', 0),
            _drawerTile(context, Icons.grass, 'Tarlalar', 1),
            _drawerTile(context, Icons.pets_outlined, 'Sürü Yönetimi', 2),
            _drawerTile(context, Icons.settings_outlined, 'Ayarlar', 3),
            const Spacer(),
            ListTile(
              onTap: controller.toggleTheme,
              leading: const Icon(Icons.contrast),
              title: const Text('Görünüm Modu'),
              trailing: const Icon(Icons.chevron_right),
            ),
            ListTile(
              onTap: Get.find<AuthController>().logout,
              leading: const Icon(Icons.logout, color: AppColors.danger),
              title: const Text(
                'Çıkış Yap',
                style: TextStyle(color: AppColors.danger),
              ),
            ),
            const SizedBox(height: 10),
          ],
        ),
      ),
    );
  }

  Widget _drawerTile(
    BuildContext context,
    IconData icon,
    String label,
    int index,
  ) {
    return Obx(
      () => ListTile(
        selected: controller.selectedIndex.value == index,
        selectedColor: AppColors.primary,
        leading: Icon(icon),
        title: Text(label),
        onTap: () {
          controller.select(index);
          Navigator.pop(context);
        },
      ),
    );
  }
}
