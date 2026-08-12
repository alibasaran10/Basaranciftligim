import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../core/theme/app_colors.dart';
import '../../core/utils/responsive.dart';

class PageBody extends StatelessWidget {
  const PageBody({
    required this.child,
    this.padding = const EdgeInsets.fromLTRB(16, 8, 16, 24),
    super.key,
  });

  final Widget child;
  final EdgeInsets padding;

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.topCenter,
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: context.contentWidth),
        child: Padding(padding: padding, child: child),
      ),
    );
  }
}

class SurumCard extends StatelessWidget {
  const SurumCard({
    required this.child,
    this.padding = const EdgeInsets.all(14),
    this.color,
    this.borderColor,
    this.onTap,
    super.key,
  });

  final Widget child;
  final EdgeInsets padding;
  final Color? color;
  final Color? borderColor;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final content = Container(
      width: double.infinity,
      padding: padding,
      decoration: BoxDecoration(
        color: color ?? (isDark ? AppColors.darkSurface : Colors.white),
        borderRadius: BorderRadius.circular(13),
        border: Border.all(
          color: borderColor ?? (isDark ? Colors.white12 : AppColors.divider),
        ),
        boxShadow: isDark
            ? null
            : [
                BoxShadow(
                  color: Colors.black.withValues(alpha: .035),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
      ),
      child: Material(color: Colors.transparent, child: child),
    );
    if (onTap == null) return content;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(13),
        onTap: onTap,
        child: content,
      ),
    );
  }
}

class SectionTitle extends StatelessWidget {
  const SectionTitle(
    this.title, {
    this.action,
    this.onAction,
    this.padding = const EdgeInsets.only(bottom: 10),
    super.key,
  });

  final String title;
  final String? action;
  final VoidCallback? onAction;
  final EdgeInsets padding;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: padding,
      child: Row(
        children: [
          Expanded(
            child: Text(title, style: Theme.of(context).textTheme.titleMedium),
          ),
          if (action != null)
            InkWell(
              onTap: onAction,
              child: Text(
                action!,
                style: const TextStyle(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w700,
                  fontSize: 13,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class StatusPill extends StatelessWidget {
  const StatusPill(
    this.label, {
    this.color = AppColors.success,
    this.compact = false,
    super.key,
  });

  final String label;
  final Color color;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: compact ? 7 : 9,
        vertical: compact ? 3 : 5,
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: .12),
        borderRadius: BorderRadius.circular(7),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.w700,
          fontSize: compact ? 10 : 12,
        ),
      ),
    );
  }
}

class RoundIcon extends StatelessWidget {
  const RoundIcon(
    this.icon, {
    this.color = AppColors.primary,
    this.background,
    this.size = 40,
    super.key,
  });

  final IconData icon;
  final Color color;
  final Color? background;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: background ?? color.withValues(alpha: .09),
      ),
      alignment: Alignment.center,
      child: Icon(icon, color: color, size: size * .52),
    );
  }
}

class LabelValue extends StatelessWidget {
  const LabelValue(
    this.label,
    this.value, {
    this.valueColor,
    this.crossAxisAlignment = CrossAxisAlignment.start,
    super.key,
  });

  final String label;
  final String value;
  final Color? valueColor;
  final CrossAxisAlignment crossAxisAlignment;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: crossAxisAlignment,
      children: [
        Text(label, style: Theme.of(context).textTheme.bodySmall),
        const SizedBox(height: 3),
        Text(
          value,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.w700,
            color: valueColor,
          ),
        ),
      ],
    );
  }
}

class DataRowTile extends StatelessWidget {
  const DataRowTile({
    required this.icon,
    required this.label,
    required this.value,
    this.onTap,
    this.trailing = true,
    super.key,
  });

  final IconData icon;
  final String label;
  final String value;
  final VoidCallback? onTap;
  final bool trailing;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 13),
        child: Row(
          children: [
            Icon(icon, color: AppColors.primary, size: 20),
            const SizedBox(width: 13),
            Expanded(
              flex: 3,
              child: Text(
                label,
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
            ),
            Expanded(
              flex: 5,
              child: Text(
                value,
                textAlign: TextAlign.right,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ),
            if (trailing) ...[
              const SizedBox(width: 5),
              const Icon(Icons.chevron_right, size: 19),
            ],
          ],
        ),
      ),
    );
  }
}

class LoadingView extends StatelessWidget {
  const LoadingView({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: CircularProgressIndicator(color: AppColors.primary),
    );
  }
}

class EmptyView extends StatelessWidget {
  const EmptyView(this.message, {super.key});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.eco_outlined, size: 44, color: AppColors.primary),
          const SizedBox(height: 12),
          Text(message),
        ],
      ),
    );
  }
}

void showSuccess(String title, String message) {
  Get.snackbar(
    title,
    message,
    icon: const Icon(Icons.check_circle, color: Colors.white),
    colorText: Colors.white,
    backgroundColor: AppColors.primary,
  );
}
