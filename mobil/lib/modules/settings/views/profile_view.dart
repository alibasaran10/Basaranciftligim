import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/constants/app_assets.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/design_widgets.dart';
import '../../../shared/widgets/surum_bottom_nav.dart';
import '../../auth/controllers/auth_controller.dart';
import '../controllers/settings_controller.dart';

class ProfileView extends GetView<SettingsController> {
  const ProfileView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      bottomNavigationBar: const SurumBottomNav(),
      body: SafeArea(
        bottom: false,
        child: Obx(() {
          if (controller.isLoading.value && controller.user.isEmpty) {
            return const LoadingView();
          }
          final user = controller.user;
          return ListView(
            children: [
              PageBody(
                child: Column(
                  children: [
                    _header(context),
                    const SizedBox(height: 12),
                    _profile(user),
                    const SizedBox(height: 14),
                    _personal(context, user),
                    const SizedBox(height: 14),
                    _security(context),
                    const SizedBox(height: 28),
                    OutlinedButton(
                      onPressed: Get.find<AuthController>().logout,
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.danger,
                        side: const BorderSide(color: AppColors.danger),
                      ),
                      child: const Text('Çıkış Yap'),
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
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Kullanıcı Profili',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const Text(
                'Kişisel bilgilerinizi görüntüleyin ve güncelleyin',
                style: TextStyle(color: AppColors.muted, fontSize: 12),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _profile(Map<String, dynamic> user) {
    return SurumCard(
      child: Row(
        children: [
          Stack(
            children: [
              ClipOval(
                child: Image.asset(
                  AppAssets.profileFarmer,
                  width: 105,
                  height: 105,
                  fit: BoxFit.cover,
                ),
              ),
              Positioned(
                right: 0,
                bottom: 0,
                child: CircleAvatar(
                  radius: 17,
                  backgroundColor: Colors.white,
                  child: IconButton(
                    padding: EdgeInsets.zero,
                    iconSize: 17,
                    onPressed: () => Get.snackbar(
                      'Fotoğraf',
                      'Profil fotoğrafı değiştirilebilir.',
                    ),
                    icon: const Icon(Icons.camera_alt_outlined),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(width: 17),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        '${user['name']}',
                        style: const TextStyle(
                          fontSize: 19,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    const SizedBox(width: 7),
                    const StatusPill('Yönetici', compact: true),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  '✉  ${user['email']}',
                  style: const TextStyle(fontSize: 12),
                ),
                const SizedBox(height: 7),
                Text(
                  '⌕  ${user['phone']}',
                  style: const TextStyle(fontSize: 12),
                ),
                const SizedBox(height: 7),
                const Text(
                  'Son giriş: 24.05.2024 14:30',
                  style: TextStyle(color: AppColors.muted, fontSize: 11),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _personal(BuildContext context, Map<String, dynamic> user) {
    final fields = [
      ('Ad Soyad', '${user['name']}', TextInputType.name),
      ('E-posta', '${user['email']}', TextInputType.emailAddress),
      ('Telefon', '${user['phone']}', TextInputType.phone),
      ('Doğum Tarihi', '${user['birthDate']}', TextInputType.datetime),
      ('Göreviniz', '${user['role']}', TextInputType.text),
    ];
    return SurumCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Kişisel Bilgiler',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 9),
          ...fields.map(
            (field) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Row(
                children: [
                  SizedBox(
                    width: 112,
                    child: Text(field.$1, style: const TextStyle(fontSize: 12)),
                  ),
                  Expanded(
                    child: TextFormField(
                      initialValue: field.$2,
                      keyboardType: field.$3,
                      decoration: const InputDecoration(
                        isDense: true,
                        contentPadding: EdgeInsets.symmetric(
                          horizontal: 13,
                          vertical: 12,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _security(BuildContext context) {
    return SurumCard(
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(13),
            child: Text(
              'Güvenlik',
              style: Theme.of(context).textTheme.titleMedium,
            ),
          ),
          const Divider(height: 1),
          ListTile(
            onTap: () =>
                Get.snackbar('Şifre', 'Şifre değiştirme formu açıldı.'),
            leading: const Icon(Icons.lock_outline),
            title: const Text(
              'Şifre Değiştir',
              style: TextStyle(fontWeight: FontWeight.w600),
            ),
            trailing: const Icon(Icons.chevron_right),
          ),
          const Divider(height: 1),
          ListTile(
            onTap: controller.twoFactorEnabled.toggle,
            leading: const Icon(Icons.security_outlined),
            title: const Text(
              'İki Aşamalı Doğrulama',
              style: TextStyle(fontWeight: FontWeight.w600),
            ),
            trailing: Obx(
              () => Text(
                controller.twoFactorEnabled.value ? 'Aktif  ›' : 'Kapalı  ›',
                style: TextStyle(
                  color: controller.twoFactorEnabled.value
                      ? AppColors.success
                      : AppColors.muted,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
