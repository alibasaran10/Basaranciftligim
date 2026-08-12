import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../core/constants/app_strings.dart';
import '../core/theme/app_theme.dart';
import 'bindings/initial_binding.dart';
import 'routes/app_pages.dart';
import 'routes/app_routes.dart';

class SurumApp extends StatelessWidget {
  const SurumApp({super.key});

  static const _startRoute = String.fromEnvironment(
    'START_ROUTE',
    defaultValue: AppRoutes.splash,
  );

  @override
  Widget build(BuildContext context) {
    return GetMaterialApp(
      title: AppStrings.appName,
      debugShowCheckedModeBanner: false,
      initialBinding: InitialBinding(),
      initialRoute: _startRoute,
      getPages: AppPages.pages,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: ThemeMode.system,
      defaultTransition: Transition.cupertino,
      locale: const Locale('tr', 'TR'),
      fallbackLocale: const Locale('tr', 'TR'),
    );
  }
}
