import 'dart:math' as math;

import 'package:flutter/widgets.dart';

extension ResponsiveContext on BuildContext {
  Size get screenSize => MediaQuery.sizeOf(this);
  bool get isCompact => screenSize.width < 380;
  bool get isTablet => screenSize.width >= 600;

  double scale(double value, {double minScale = .86, double maxScale = 1.2}) {
    final factor = (screenSize.width / 390).clamp(minScale, maxScale);
    return value * factor;
  }

  double get horizontalPadding =>
      math.min(isTablet ? 32 : 16, screenSize.width * .08);

  double get contentWidth => math.min(screenSize.width, 560);
}
