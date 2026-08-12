import 'package:get/get.dart';

import '../../modules/auth/views/login_view.dart';
import '../../modules/auth/views/onboarding_view.dart';
import '../../modules/auth/views/splash_view.dart';
import '../../modules/fields/views/field_detail_view.dart';
import '../../modules/herd/views/herd_detail_view.dart';
import '../../modules/integrations/views/camera_view.dart';
import '../../modules/integrations/views/device_view.dart';
import '../../modules/integrations/views/sync_view.dart';
import '../../modules/navigation/views/main_shell.dart';
import '../../modules/settings/views/business_info_view.dart';
import '../../modules/settings/views/profile_view.dart';
import '../../modules/settings/views/subscription_view.dart';
import 'app_routes.dart';

abstract final class AppPages {
  static final pages = <GetPage<dynamic>>[
    GetPage(
      name: AppRoutes.splash,
      page: SplashView.new,
      transition: Transition.fadeIn,
    ),
    GetPage(
      name: AppRoutes.onboarding,
      page: OnboardingView.new,
      transition: Transition.fadeIn,
    ),
    GetPage(
      name: AppRoutes.login,
      page: LoginView.new,
      transition: Transition.cupertino,
    ),
    GetPage(
      name: AppRoutes.main,
      page: MainShell.new,
      transition: Transition.fadeIn,
    ),
    GetPage(
      name: AppRoutes.fieldDetail,
      page: FieldDetailView.new,
      transition: Transition.cupertino,
    ),
    GetPage(
      name: AppRoutes.herdDetail,
      page: HerdDetailView.new,
      transition: Transition.cupertino,
    ),
    GetPage(
      name: AppRoutes.businessInfo,
      page: BusinessInfoView.new,
      transition: Transition.cupertino,
    ),
    GetPage(
      name: AppRoutes.profile,
      page: ProfileView.new,
      transition: Transition.cupertino,
    ),
    GetPage(
      name: AppRoutes.subscription,
      page: SubscriptionView.new,
      transition: Transition.cupertino,
    ),
    GetPage(
      name: AppRoutes.camera,
      page: CameraView.new,
      transition: Transition.cupertino,
    ),
    GetPage(
      name: AppRoutes.device,
      page: DeviceView.new,
      transition: Transition.cupertino,
    ),
    GetPage(
      name: AppRoutes.sync,
      page: SyncView.new,
      transition: Transition.cupertino,
    ),
  ];
}
