import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../app/routes/app_routes.dart';
import '../../core/theme/app_colors.dart';
import '../../modules/navigation/controllers/navigation_controller.dart';

class SurumBottomNav extends GetView<NavigationController> {
  const SurumBottomNav({super.key});

  static const _items = [
    (Icons.home_rounded, 'Ana Sayfa'),
    (Icons.format_list_bulleted_rounded, 'Tarlalar'),
    (Icons.pets_rounded, 'Sürü'),
    (Icons.settings_rounded, 'Ayarlar'),
  ];

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      final selected = controller.selectedIndex.value;
      return ColoredBox(
        color: AppColors.bottomBar,
        child: SafeArea(
          top: false,
          child: SizedBox(
            height: 74,
            child: Stack(
              clipBehavior: Clip.none,
              alignment: Alignment.bottomCenter,
              children: [
                Container(
                  height: 68,
                  padding: const EdgeInsets.symmetric(horizontal: 7),
                  decoration: const BoxDecoration(
                    color: AppColors.bottomBar,
                    borderRadius: BorderRadius.vertical(
                      top: Radius.circular(14),
                    ),
                  ),
                  child: Row(
                    children: [
                      _item(context, 0, selected),
                      _item(context, 1, selected),
                      const SizedBox(width: 58),
                      _item(context, 2, selected),
                      _item(context, 3, selected),
                    ],
                  ),
                ),
                Positioned(
                  top: -4,
                  child: Semantics(
                    button: true,
                    label: 'Hızlı kayıt ekle',
                    child: Material(
                      color: AppColors.primary,
                      shape: const CircleBorder(
                        side: BorderSide(color: Colors.white, width: 3),
                      ),
                      elevation: 2,
                      child: InkWell(
                        customBorder: const CircleBorder(),
                        onTap: () => _showAddMenu(context),
                        child: const SizedBox(
                          width: 60,
                          height: 60,
                          child: Icon(Icons.add, color: Colors.white, size: 32),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    });
  }

  Widget _item(BuildContext context, int index, int selected) {
    final item = _items[index];
    final isSelected = selected == index;
    return Expanded(
      child: InkWell(
        onTap: () {
          controller.select(index);
          if (Get.currentRoute != AppRoutes.main) {
            Get.offAllNamed(AppRoutes.main);
          }
        },
        child: Padding(
          padding: const EdgeInsets.only(top: 8, bottom: 5),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                item.$1,
                color: isSelected ? Colors.white : Colors.white60,
                size: 24,
              ),
              const SizedBox(height: 3),
              Text(
                item.$2,
                maxLines: 1,
                style: TextStyle(
                  color: isSelected ? Colors.white : Colors.white60,
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                  fontSize: 10,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showAddMenu(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Hızlı Kayıt',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  _addAction(context, Icons.grass, 'Tarla'),
                  _addAction(context, Icons.pets, 'Hayvan'),
                  _addAction(context, Icons.inventory_2_outlined, 'Stok'),
                  _addAction(context, Icons.note_add_outlined, 'Not'),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _addAction(BuildContext context, IconData icon, String label) {
    return Expanded(
      child: InkWell(
        onTap: () {
          Navigator.pop(context);
          Get.snackbar('Yeni $label', '$label kayıt formu hazır.');
        },
        child: Column(
          children: [
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: AppColors.primarySoft,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, color: AppColors.primary),
            ),
            const SizedBox(height: 6),
            Text(label, style: const TextStyle(fontSize: 12)),
          ],
        ),
      ),
    );
  }
}
