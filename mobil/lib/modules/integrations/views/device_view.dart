import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/constants/app_assets.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/design_widgets.dart';
import '../../../shared/widgets/surum_bottom_nav.dart';
import '../controllers/integrations_controller.dart';

class DeviceView extends GetView<IntegrationsController> {
  const DeviceView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      bottomNavigationBar: const SurumBottomNav(),
      body: SafeArea(
        bottom: false,
        child: Obx(() {
          if (controller.isLoading.value && controller.wearables.isEmpty) {
            return const LoadingView();
          }
          return ListView(
            children: [
              PageBody(
                child: Column(
                  children: [
                    _header(context),
                    const SizedBox(height: 13),
                    _summary(context),
                    const SizedBox(height: 11),
                    _tabs(context),
                    const SizedBox(height: 11),
                    _filters(context),
                    const SizedBox(height: 8),
                    ...controller.wearables.map(
                      (item) => Padding(
                        padding: const EdgeInsets.only(bottom: 7),
                        child: _wearable(context, item),
                      ),
                    ),
                    const SizedBox(height: 3),
                    FilledButton.icon(
                      onPressed: () => Get.snackbar(
                        'Yeni Tasma',
                        'Tasma ekleme formu açıldı.',
                      ),
                      icon: const Icon(Icons.add_circle_outline),
                      label: const Text('Yeni Tasma Ekle'),
                    ),
                    const SizedBox(height: 14),
                    _gateway(context),
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
                'Cihaz & Tasma Ayarları',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const Text(
                'Akıllı tasmalar ve gateway cihazlarınızın\nayarlarını yönetin.',
                style: TextStyle(color: AppColors.muted, fontSize: 12),
              ),
            ],
          ),
        ),
        IconButton(
          onPressed: () =>
              Get.snackbar('Bilgi', 'Cihaz yardım içeriği açıldı.'),
          icon: const Icon(Icons.info_outline),
        ),
      ],
    );
  }

  Widget _summary(BuildContext context) {
    final items = [
      (Icons.settings_input_antenna, 'Toplam Tasma', '42', AppColors.ink),
      (Icons.check_circle, 'Aktif Cihaz', '40', AppColors.success),
      (
        Icons.battery_alert_outlined,
        'Düşük Pil Uyarısı',
        '2',
        AppColors.warning,
      ),
      (Icons.wifi_off, 'Çevrimdışı', '0', AppColors.muted),
    ];
    return SurumCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Sistem Özeti', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 10),
          Row(
            children: List.generate(items.length, (index) {
              final item = items[index];
              return Expanded(
                child: Container(
                  margin: EdgeInsets.only(right: index == 3 ? 0 : 7),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 11,
                  ),
                  decoration: BoxDecoration(
                    border: Border.all(color: Theme.of(context).dividerColor),
                    borderRadius: BorderRadius.circular(9),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(item.$1, color: item.$4, size: 23),
                      const SizedBox(height: 11),
                      Text(
                        item.$2,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 9),
                      ),
                      Text(
                        item.$3,
                        style: TextStyle(
                          color: item.$4,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
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

  Widget _tabs(BuildContext context) {
    const tabs = ['Tasmalar', 'Gateway', 'Ayarlar'];
    return Obx(
      () => Row(
        children: List.generate(tabs.length, (index) {
          final active = controller.selectedDeviceTab.value == index;
          return Expanded(
            child: InkWell(
              onTap: () => controller.selectedDeviceTab.value = index,
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 10),
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
                  textAlign: TextAlign.center,
                  style: TextStyle(
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

  Widget _filters(BuildContext context) {
    return Row(
      children: [
        const Expanded(
          child: SizedBox(
            height: 42,
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Tasma ara...',
                prefixIcon: Icon(Icons.search),
                contentPadding: EdgeInsets.zero,
              ),
            ),
          ),
        ),
        const SizedBox(width: 8),
        _filterButton('Tümü'),
        const SizedBox(width: 8),
        _filterButton('Durum'),
      ],
    );
  }

  Widget _filterButton(String label) {
    return OutlinedButton(
      onPressed: () => Get.snackbar('Filtre', '$label filtresi seçildi.'),
      style: OutlinedButton.styleFrom(
        minimumSize: const Size(75, 42),
        padding: const EdgeInsets.symmetric(horizontal: 10),
        foregroundColor: AppColors.muted,
        side: const BorderSide(color: AppColors.divider),
      ),
      child: Row(
        children: [
          Text(label),
          const Icon(Icons.keyboard_arrow_down, size: 17),
        ],
      ),
    );
  }

  Widget _wearable(BuildContext context, Map<String, dynamic> item) {
    final battery = item['battery'] as int? ?? 0;
    final isLow = battery > 0 && battery < 25;
    final offline = battery == 0;
    final statusColor = isLow
        ? AppColors.warning
        : offline
        ? AppColors.muted
        : AppColors.success;
    return SurumCard(
      color: !isLow && !offline
          ? AppColors.primary.withValues(alpha: Get.isDarkMode ? .1 : .035)
          : null,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
      child: Row(
        children: [
          ClipOval(
            child: Image.asset(
              AppAssets.cowPortrait,
              width: 45,
              height: 45,
              fit: BoxFit.cover,
            ),
          ),
          const SizedBox(width: 11),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${item['tag']}',
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                Text(
                  '${item['breed']}',
                  style: const TextStyle(color: AppColors.muted, fontSize: 11),
                ),
              ],
            ),
          ),
          StatusPill('${item['status']}', color: statusColor, compact: true),
          const SizedBox(width: 11),
          Icon(
            Icons.bluetooth,
            color: offline ? AppColors.muted : AppColors.blue,
            size: 19,
          ),
          const SizedBox(width: 9),
          Icon(
            isLow ? Icons.battery_alert : Icons.battery_full,
            color: isLow ? AppColors.danger : statusColor,
            size: 18,
          ),
          Text(
            battery == 0 ? '--' : '%$battery',
            style: TextStyle(
              color: isLow ? AppColors.danger : AppColors.muted,
              fontSize: 11,
            ),
          ),
          const SizedBox(width: 8),
          const Icon(
            Icons.signal_cellular_alt,
            color: AppColors.success,
            size: 18,
          ),
          const Icon(Icons.chevron_right),
        ],
      ),
    );
  }

  Widget _gateway(BuildContext context) {
    return SurumCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Gateway Durumu',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              const RoundIcon(Icons.router_outlined, size: 50),
              const SizedBox(width: 12),
              const Expanded(child: LabelValue('Ana Gateway', '●  Online')),
              Container(
                width: 1,
                height: 42,
                color: Theme.of(context).dividerColor,
              ),
              const SizedBox(width: 12),
              const LabelValue('Son Bağlantı', '24.05.2025 12:40'),
              const SizedBox(width: 12),
              const LabelValue('Sinyal Gücü', '▮▮▮  Güçlü'),
              const Icon(Icons.chevron_right),
            ],
          ),
        ],
      ),
    );
  }
}
