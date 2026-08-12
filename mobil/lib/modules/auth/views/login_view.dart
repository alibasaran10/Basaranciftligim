import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/constants/app_assets.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/responsive.dart';
import '../controllers/auth_controller.dart';

class LoginView extends GetView<AuthController> {
  const LoginView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          Positioned.fill(
            bottom: context.screenSize.height * .54,
            child: Image.asset(AppAssets.farmHero, fit: BoxFit.cover),
          ),
          Positioned(
            top: MediaQuery.paddingOf(context).top + 14,
            left: 18,
            child: IconButton.filledTonal(
              onPressed: Get.back,
              style: IconButton.styleFrom(
                backgroundColor: Colors.black.withValues(alpha: .2),
                foregroundColor: Colors.white,
              ),
              icon: const Icon(Icons.arrow_back),
            ),
          ),
          Align(
            alignment: Alignment.bottomCenter,
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 560),
              child: Container(
                height: context.screenSize.height * .65,
                padding: EdgeInsets.fromLTRB(
                  context.horizontalPadding + 4,
                  34,
                  context.horizontalPadding + 4,
                  18,
                ),
                decoration: BoxDecoration(
                  color: Theme.of(context).scaffoldBackgroundColor,
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(30),
                  ),
                ),
                child: SingleChildScrollView(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            'Hoş Geldiniz',
                            style: Theme.of(context).textTheme.headlineMedium
                                ?.copyWith(color: AppColors.primaryDark),
                          ),
                          const SizedBox(width: 10),
                          const Icon(
                            Icons.eco,
                            color: AppColors.primary,
                            size: 28,
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'SÜRÜM ile çiftliğinizi yönetmeye devam edin.',
                        style: TextStyle(color: AppColors.muted),
                      ),
                      const SizedBox(height: 24),
                      TextField(
                        controller: controller.emailController,
                        keyboardType: TextInputType.emailAddress,
                        decoration: const InputDecoration(
                          hintText: 'E-posta adresiniz',
                          prefixIcon: Icon(Icons.mail_outline),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Obx(
                        () => TextField(
                          controller: controller.passwordController,
                          obscureText: controller.isPasswordHidden.value,
                          onSubmitted: (_) => controller.login(),
                          decoration: InputDecoration(
                            hintText: 'Şifreniz',
                            prefixIcon: const Icon(Icons.lock_outline),
                            suffixIcon: IconButton(
                              onPressed: () =>
                                  controller.isPasswordHidden.toggle(),
                              icon: Icon(
                                controller.isPasswordHidden.value
                                    ? Icons.visibility_off_outlined
                                    : Icons.visibility_outlined,
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          Obx(
                            () => Checkbox(
                              value: controller.rememberMe.value,
                              activeColor: AppColors.primary,
                              onChanged: (value) =>
                                  controller.rememberMe.value = value ?? false,
                            ),
                          ),
                          const Text('Beni Hatırla'),
                          const Spacer(),
                          TextButton(
                            onPressed: () => Get.snackbar(
                              'Şifre Sıfırlama',
                              'Sıfırlama bağlantısı e-postanıza gönderildi.',
                            ),
                            child: const Text(
                              'Şifremi Unuttum?',
                              style: TextStyle(
                                color: AppColors.primary,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Obx(
                        () => FilledButton(
                          onPressed: controller.isLoading.value
                              ? null
                              : controller.login,
                          child: controller.isLoading.value
                              ? const SizedBox(
                                  width: 23,
                                  height: 23,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : const Text('Giriş Yap'),
                        ),
                      ),
                      const SizedBox(height: 18),
                      Row(
                        children: [
                          const Expanded(child: Divider()),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            child: Text(
                              'veya',
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ),
                          const Expanded(child: Divider()),
                        ],
                      ),
                      const SizedBox(height: 16),
                      OutlinedButton(
                        onPressed: controller.useDemoAccount,
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Get.isDarkMode
                              ? Colors.white
                              : AppColors.ink,
                          side: BorderSide(
                            color: Theme.of(context).dividerColor,
                          ),
                        ),
                        child: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              'G',
                              style: TextStyle(
                                color: Color(0xFF4285F4),
                                fontSize: 20,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            SizedBox(width: 10),
                            Text('Google ile Devam Et'),
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Text(
                            'Hesabınız yok mu? ',
                            style: TextStyle(color: AppColors.muted),
                          ),
                          TextButton(
                            onPressed: () => Get.snackbar(
                              'Kayıt Ol',
                              'Kayıt formu yakında kullanıma açılacak.',
                            ),
                            child: const Text(
                              'Kayıt Ol',
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
        ],
      ),
    );
  }
}
