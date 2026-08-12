import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';

import '../../../app/routes/app_routes.dart';
import '../../../core/constants/app_assets.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/responsive.dart';
import '../controllers/auth_controller.dart';

class OnboardingView extends GetView<AuthController> {
  const OnboardingView({super.key});

  @override
  Widget build(BuildContext context) {
    SystemChrome.setSystemUIOverlayStyle(
      Get.isDarkMode ? SystemUiOverlayStyle.light : SystemUiOverlayStyle.dark,
    );
    return Scaffold(
      body: SafeArea(
        child: Align(
          alignment: Alignment.topCenter,
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 560),
            child: Padding(
              padding: EdgeInsets.fromLTRB(
                context.horizontalPadding,
                12,
                context.horizontalPadding,
                20,
              ),
              child: Column(
                children: [
                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton(
                      onPressed: () => Get.offAllNamed(AppRoutes.login),
                      child: const Text(
                        'Atla',
                        style: TextStyle(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                  Text(
                    'Çiftliğinizi\nAkıllı Yönetin',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                      color: Get.isDarkMode
                          ? Colors.white
                          : AppColors.primaryDark,
                      height: 1.12,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Tarladan sofraya tüm süreçleri tek uygulamada\n'
                    'takip edin, verimliliğinizi artırın.',
                    textAlign: TextAlign.center,
                    style: Theme.of(
                      context,
                    ).textTheme.bodyMedium?.copyWith(color: AppColors.muted),
                  ),
                  const Spacer(),
                  Flexible(
                    flex: 6,
                    child: AspectRatio(
                      aspectRatio: 1,
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(26),
                        child: Image.asset(
                          AppAssets.onboardingCow,
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                  ),
                  const Spacer(),
                  Obx(
                    () => Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(
                        3,
                        (index) => AnimatedContainer(
                          duration: const Duration(milliseconds: 220),
                          width: controller.currentOnboardingPage.value == index
                              ? 10
                              : 8,
                          height: 8,
                          margin: const EdgeInsets.symmetric(horizontal: 4),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color:
                                controller.currentOnboardingPage.value == index
                                ? AppColors.primary
                                : Colors.black12,
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 34),
                  FilledButton(
                    onPressed: () {
                      if (controller.currentOnboardingPage.value < 2) {
                        controller.currentOnboardingPage.value++;
                      } else {
                        Get.offAllNamed(AppRoutes.login);
                      }
                    },
                    child: Obx(
                      () => Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            controller.currentOnboardingPage.value < 2
                                ? 'Hemen Başlayalım'
                                : 'Girişe Geç',
                          ),
                          const Spacer(),
                          const Icon(Icons.arrow_forward),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text(
                        'Zaten hesabınız var mı? ',
                        style: TextStyle(color: AppColors.muted),
                      ),
                      TextButton(
                        onPressed: () => Get.offAllNamed(AppRoutes.login),
                        child: const Text(
                          'Giriş Yap',
                          style: TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
