import 'package:flutter/material.dart';
import 'package:get/get.dart';

class NavigationController extends GetxController {
  final selectedIndex = const int.fromEnvironment(
    'START_TAB',
    defaultValue: 0,
  ).obs;
  final themeMode = ThemeMode.system.obs;

  void select(int index) => selectedIndex.value = index;

  void toggleTheme() {
    themeMode.value = Get.isDarkMode ? ThemeMode.light : ThemeMode.dark;
    Get.changeThemeMode(themeMode.value);
  }
}
