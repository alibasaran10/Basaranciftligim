import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/design_widgets.dart';
import '../../../shared/widgets/surum_bottom_nav.dart';
import '../controllers/fields_controller.dart';

class FieldDetailView extends GetView<FieldsController> {
  const FieldDetailView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      bottomNavigationBar: const SurumBottomNav(),
      body: SafeArea(
        bottom: false,
        child: Obx(() {
          final field = controller.selectedField;
          if (field.isEmpty) return const LoadingView();
          return ListView(
            children: [
              PageBody(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 18),
                child: Column(
                  children: [
                    _header(context),
                    const SizedBox(height: 8),
                    _hero(field),
                    const SizedBox(height: 10),
                    _metrics(field),
                    const SizedBox(height: 10),
                    _tabs(context),
                    const SizedBox(height: 10),
                    _product(context, field),
                    const SizedBox(height: 10),
                    _fieldInformation(field),
                    const SizedBox(height: 15),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () => showSuccess(
                              'Not',
                              'Tarla notu eklemeye hazır.',
                            ),
                            icon: const Icon(Icons.note_add_outlined),
                            label: const Text('Not Ekle'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: FilledButton(
                            onPressed: () => showSuccess(
                              'İşlem',
                              'Tarla işlemi başarıyla kaydedildi.',
                            ),
                            child: const Text('İşlem Kaydet'),
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
            'Tarla Detayı',
            style: Theme.of(context).textTheme.titleLarge,
          ),
        ),
        TextButton(
          onPressed: () => showSuccess('Düzenle', 'Düzenleme modu açıldı.'),
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

  Widget _hero(Map<String, dynamic> field) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(13),
      child: SizedBox(
        height: 137,
        child: Stack(
          fit: StackFit.expand,
          children: [
            Image.asset('${field['image']}', fit: BoxFit.cover),
            const DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Colors.transparent, Color(0xB0000000)],
                ),
              ),
            ),
            Positioned(
              left: 15,
              right: 15,
              bottom: 13,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        '${field['name']}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 19,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(width: 8),
                      const StatusPill('Aktif', compact: true),
                    ],
                  ),
                  const SizedBox(height: 3),
                  Text(
                    '${field['size']} • ${field['soil']} Toprak',
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _metrics(Map<String, dynamic> field) {
    return SurumCard(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
      child: Row(
        children: [
          _metric(Icons.grass, 'Toprak Tipi', '${field['soil']}'),
          _divider(),
          _metric(
            Icons.water_drop_outlined,
            'Sulama Durumu',
            '${field['irrigation']}',
          ),
          _divider(),
          _metric(Icons.terrain_outlined, 'Rakım', '${field['altitude']}'),
        ],
      ),
    );
  }

  Widget _metric(IconData icon, String label, String value) {
    return Expanded(
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          RoundIcon(icon, size: 33),
          const SizedBox(width: 7),
          Flexible(child: LabelValue(label, value)),
        ],
      ),
    );
  }

  Widget _divider() =>
      Container(width: 1, height: 36, color: AppColors.divider);

  Widget _tabs(BuildContext context) {
    const tabs = ['Genel Bilgiler', 'Ekim / Hasat', 'Verim & Stok', 'Geçmiş'];
    return Obx(
      () => Row(
        children: List.generate(tabs.length, (index) {
          final active = controller.selectedTab.value == index;
          return Expanded(
            child: InkWell(
              onTap: () => controller.selectedTab.value = index,
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 9),
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
                  maxLines: 1,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 11,
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

  Widget _product(BuildContext context, Map<String, dynamic> field) {
    return SurumCard(
      padding: const EdgeInsets.all(8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Mevcut Ürün', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: .06),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    const RoundIcon(Icons.eco, size: 42),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        '${field['crop']}',
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                    ),
                    const StatusPill('Yetişme Döneminde', compact: true),
                  ],
                ),
                const SizedBox(height: 13),
                Row(
                  children: [
                    Expanded(
                      child: LabelValue('Ekim Tarihi', '${field['sowing']}'),
                    ),
                    Expanded(
                      child: LabelValue('Tahmini Hasat', '${field['harvest']}'),
                    ),
                    Expanded(
                      child: LabelValue(
                        'Kalan Süre',
                        '${field['days']}',
                        valueColor: AppColors.primary,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _fieldInformation(Map<String, dynamic> field) {
    final rows = [
      ('Tarla Kodu', '${field['id']}'),
      ('Büyüklük', '${field['size']}'),
      ('Toprak Tipi', '${field['soil']}'),
      ('Sulama Yöntemi', '${field['irrigation']}'),
      ('Son İşlem', '05.05.2024'),
    ];
    return SurumCard(
      padding: const EdgeInsets.all(10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Tarla Bilgileri',
            style: TextStyle(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 7),
          ...rows.map(
            (row) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 3),
              child: Row(
                children: [
                  Text(row.$1, style: const TextStyle(color: AppColors.muted)),
                  const Spacer(),
                  Text(
                    row.$2,
                    style: const TextStyle(fontWeight: FontWeight.w600),
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
