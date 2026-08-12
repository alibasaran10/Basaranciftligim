import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../app/routes/app_routes.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/design_widgets.dart';
import '../../navigation/controllers/navigation_controller.dart';
import '../controllers/fields_controller.dart';

class FieldManagementView extends GetView<FieldsController> {
  const FieldManagementView({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: Obx(() {
        if (controller.isLoading.value && controller.fields.isEmpty) {
          return const LoadingView();
        }
        return RefreshIndicator(
          onRefresh: controller.loadFields,
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            children: [
              PageBody(
                child: Column(
                  children: [
                    _header(context),
                    const SizedBox(height: 15),
                    _tabs(context),
                    const SizedBox(height: 16),
                    ...controller.fields.map(_fieldCard),
                    const SizedBox(height: 9),
                    const SectionTitle(
                      'Son Ekim / Hasat Kayıtları',
                      action: 'Tümünü Gör',
                    ),
                    ...controller.fields.map(_harvestRow),
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
          onPressed: () => Get.find<NavigationController>().select(0),
          icon: const Icon(Icons.arrow_back, size: 27),
        ),
        Expanded(
          child: Text(
            'Tarla Yönetimi',
            style: Theme.of(context).textTheme.titleLarge,
          ),
        ),
        FilledButton.icon(
          onPressed: () =>
              Get.snackbar('Yeni Tarla', 'Yeni tarla formu açıldı.'),
          style: FilledButton.styleFrom(
            minimumSize: const Size(0, 44),
            padding: const EdgeInsets.symmetric(horizontal: 14),
          ),
          icon: const Icon(Icons.add),
          label: const Text('Yeni Tarla'),
        ),
      ],
    );
  }

  Widget _tabs(BuildContext context) {
    return Obx(
      () => Row(
        children: [
          Expanded(
            child: _tab(context, 'Tarlalarım', 0, controller.selectedTab.value),
          ),
          Expanded(
            child: _tab(
              context,
              'Ekim / Hasat Kayıtları',
              1,
              controller.selectedTab.value,
            ),
          ),
        ],
      ),
    );
  }

  Widget _tab(BuildContext context, String label, int index, int selected) {
    final active = index == selected;
    return InkWell(
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
        child: Text(
          label,
          textAlign: TextAlign.center,
          style: TextStyle(
            color: active ? AppColors.primary : AppColors.muted,
            fontWeight: active ? FontWeight.w700 : FontWeight.w500,
          ),
        ),
      ),
    );
  }

  Widget _fieldCard(Map<String, dynamic> field) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 11),
      child: SurumCard(
        onTap: () {
          controller.chooseField(field);
          Get.toNamed(AppRoutes.fieldDetail);
        },
        padding: const EdgeInsets.all(9),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(9),
              child: Image.asset(
                '${field['image']}',
                width: 105,
                height: 88,
                fit: BoxFit.cover,
              ),
            ),
            const SizedBox(width: 13),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${field['name']}',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  Text(
                    '${field['size']}',
                    style: const TextStyle(color: AppColors.muted),
                  ),
                  const SizedBox(height: 7),
                  Row(
                    children: [
                      Expanded(
                        child: LabelValue('Toprak Tipi', '${field['soil']}'),
                      ),
                      Expanded(
                        child: LabelValue(
                          'Sulama Durumu',
                          '${field['irrigation']}',
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, size: 27),
          ],
        ),
      ),
    );
  }

  Widget _harvestRow(Map<String, dynamic> field) {
    final crop = '${field['crop']}';
    return Padding(
      padding: const EdgeInsets.only(bottom: 7),
      child: SurumCard(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
        child: Row(
          children: [
            Text(
              crop.contains('Mısır')
                  ? '🌽'
                  : crop.contains('Buğday')
                  ? '🌾'
                  : '🌿',
              style: const TextStyle(fontSize: 25),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    crop,
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                  Text(
                    '${field['name']}',
                    style: const TextStyle(
                      color: AppColors.muted,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            LabelValue('Ekim', '${field['sowing']}'),
            const SizedBox(width: 14),
            LabelValue('Hasat', '${field['harvest']}'),
          ],
        ),
      ),
    );
  }
}
