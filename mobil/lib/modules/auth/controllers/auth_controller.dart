import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../app/routes/app_routes.dart';
import '../../../data/services/api_service.dart';
import '../../../data/services/storage_service.dart';

class AuthController extends GetxController {
  AuthController(this._api, this._storage);

  final ApiService _api;
  final StorageService _storage;

  final emailController = TextEditingController(
    text: 'info@yesilvadiciftligi.com',
  );
  final passwordController = TextEditingController(text: 'Parola123');
  final isPasswordHidden = true.obs;
  final rememberMe = true.obs;
  final isLoading = false.obs;
  final currentOnboardingPage = 0.obs;

  Future<void> continueFromSplash() async {
    await Future<void>.delayed(const Duration(milliseconds: 1350));
    if (Get.currentRoute == AppRoutes.splash) {
      Get.offAllNamed(AppRoutes.onboarding);
    }
  }

  Future<void> login() async {
    if (emailController.text.trim().isEmpty ||
        passwordController.text.isEmpty) {
      Get.snackbar('Eksik bilgi', 'E-posta ve şifrenizi girin.');
      return;
    }

    isLoading.value = true;
    try {
      final response = await _api.login(
        email: emailController.text.trim(),
        password: passwordController.text,
      );
      if (response['success'] == true) {
        if (rememberMe.value) {
          await _storage.write('token', response['token']);
        }
        Get.offAllNamed(AppRoutes.main);
      }
    } finally {
      isLoading.value = false;
    }
  }

  void useDemoAccount() {
    emailController.text = 'info@yesilvadiciftligi.com';
    passwordController.text = 'Parola123';
    login();
  }

  void logout() {
    _storage.remove('token');
    Get.offAllNamed(AppRoutes.login);
  }

  @override
  void onClose() {
    emailController.dispose();
    passwordController.dispose();
    super.onClose();
  }
}
