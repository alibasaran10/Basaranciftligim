import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../app/routes/app_routes.dart';
import '../../../core/constants/app_assets.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/design_widgets.dart';
import '../../navigation/controllers/navigation_controller.dart';
import '../controllers/home_controller.dart';

class HomeView extends GetView<HomeController> {
  const HomeView({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: Obx(() {
        if (controller.isLoading.value && controller.dashboard.isEmpty) {
          return const LoadingView();
        }
        return RefreshIndicator(
          onRefresh: controller.loadDashboard,
          color: AppColors.primary,
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverToBoxAdapter(
                child: PageBody(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _header(context),
                      const SizedBox(height: 12),
                      _weatherAndHerd(context),
                      const SizedBox(height: 15),
                      _quickOverview(context),
                      const SizedBox(height: 17),
                      const SectionTitle(
                        'Son Bildirimler',
                        action: 'Tümünü Gör',
                      ),
                      _notifications(context),
                      const SizedBox(height: 17),
                      const SectionTitle('Stok Durumu', action: 'Tümünü Gör'),
                      _stocks(context),
                    ],
                  ),
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
          onPressed: () => Scaffold.maybeOf(context)?.openDrawer(),
          icon: const Icon(Icons.menu, size: 29),
        ),
        const SizedBox(width: 7),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Hoş Geldiniz',
                style: Theme.of(context).textTheme.bodySmall,
              ),
              Text(
                controller.userName.isEmpty ? '—' : controller.userName,
                style: Theme.of(
                  context,
                ).textTheme.titleLarge?.copyWith(color: AppColors.primaryDark),
              ),
            ],
          ),
        ),
        Stack(
          clipBehavior: Clip.none,
          children: [
            IconButton(
              onPressed: () => Get.snackbar(
                'Bildirimler',
                '${controller.alertCount} aktif alarmınız bulunuyor.',
              ),
              icon: const Icon(Icons.notifications_none_rounded, size: 28),
            ),
            // Rozet yalnizca acik alarm varken gosterilir.
            if (controller.alertCount > 0)
              Positioned(
                right: 6,
                top: 4,
                child: Container(
                  width: 17,
                  height: 17,
                  alignment: Alignment.center,
                  decoration: const BoxDecoration(
                    color: AppColors.danger,
                    shape: BoxShape.circle,
                  ),
                  child: Text(
                    '${controller.alertCount}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ],
    );
  }

  Widget _weatherAndHerd(BuildContext context) {
    final weather = Map<String, dynamic>.from(
      controller.dashboard['weather'] ?? const {},
    );
    return SurumCard(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Çiftlik Hava Durumu',
                  style: TextStyle(color: AppColors.muted, fontSize: 13),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    const Icon(
                      Icons.wb_sunny_outlined,
                      color: Color(0xFFFFB21C),
                      size: 35,
                    ),
                    const SizedBox(width: 9),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${weather['temperature'] ?? 24}°C',
                          style: const TextStyle(
                            fontSize: 23,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        Text(
                          '${weather['condition'] ?? 'Güneşli'}',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
          Container(
            height: 75,
            width: 1,
            color: Theme.of(context).dividerColor,
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Sürü Durumu',
                  style: TextStyle(color: AppColors.muted, fontSize: 13),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    const Text('🐄', style: TextStyle(fontSize: 29)),
                    const SizedBox(width: 10),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${controller.dashboard['animalCount'] ?? 56}',
                          style: const TextStyle(
                            fontSize: 23,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const Text(
                          'Toplam Hayvan',
                          style: TextStyle(fontSize: 11),
                        ),
                      ],
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

  Widget _quickOverview(BuildContext context) {
    final items = controller.maps('quickStats');
    const icons = [
      Icons.grass,
      Icons.inventory_2_outlined,
      Icons.pregnant_woman,
      Icons.notification_important_outlined,
    ];
    const colors = [
      AppColors.success,
      AppColors.success,
      AppColors.purple,
      AppColors.danger,
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionTitle('Hızlı Bakış'),
        Row(
          children: List.generate(items.length, (index) {
            final item = items[index];
            return Expanded(
              child: Padding(
                padding: EdgeInsets.only(
                  right: index == items.length - 1 ? 0 : 8,
                ),
                child: SurumCard(
                  padding: const EdgeInsets.symmetric(
                    vertical: 13,
                    horizontal: 6,
                  ),
                  child: Column(
                    children: [
                      Icon(icons[index], color: colors[index], size: 25),
                      const SizedBox(height: 5),
                      Text(
                        '${item['value']}',
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${item['label']}',
                        textAlign: TextAlign.center,
                        maxLines: 1,
                        style: const TextStyle(fontSize: 10),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }),
        ),
      ],
    );
  }

  Widget _notifications(BuildContext context) {
    final items = controller.maps('notifications');
    return Column(
      children: List.generate(items.length, (index) {
        final item = items[index];
        final type = '${item['type']}';
        final color = type == 'danger'
            ? AppColors.danger
            : type == 'birth'
            ? AppColors.purple
            : AppColors.success;
        final icon = type == 'danger'
            ? Icons.notification_important
            : type == 'birth'
            ? Icons.pregnant_woman
            : Icons.description_outlined;
        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: SurumCard(
            color: color.withValues(alpha: Get.isDarkMode ? .12 : .06),
            borderColor: color.withValues(alpha: .23),
            onTap: type == 'danger'
                ? () {
                    Get.find<NavigationController>().select(2);
                    Get.toNamed(AppRoutes.herdDetail);
                  }
                : null,
            padding: const EdgeInsets.all(11),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                RoundIcon(icon, color: color, size: 37),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${item['title']}',
                        style: TextStyle(
                          color: color,
                          fontWeight: FontWeight.w700,
                          fontSize: 13,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        '${item['description']}',
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 11.5),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Column(
                  children: [
                    if (type == 'danger')
                      ClipRRect(
                        borderRadius: BorderRadius.circular(6),
                        child: Image.asset(
                          AppAssets.cameraBarn,
                          width: 76,
                          height: 53,
                          fit: BoxFit.cover,
                        ),
                      ),
                    const SizedBox(height: 3),
                    Text(
                      '${item['time']}',
                      style: Theme.of(
                        context,
                      ).textTheme.bodySmall?.copyWith(fontSize: 9),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      }),
    );
  }

  Widget _stocks(BuildContext context) {
    final items = controller.maps('stocks');
    const emoji = ['🌿', '🌽', '🧺'];
    return Row(
      children: List.generate(items.length, (index) {
        final item = items[index];
        return Expanded(
          child: Padding(
            padding: EdgeInsets.only(right: index == items.length - 1 ? 0 : 8),
            child: SurumCard(
              padding: const EdgeInsets.all(11),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(emoji[index], style: const TextStyle(fontSize: 25)),
                  const SizedBox(height: 5),
                  Text(
                    '${item['name']}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${item['amount']}',
                    style: const TextStyle(fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${item['silo']}',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
            ),
          ),
        );
      }),
    );
  }
}
