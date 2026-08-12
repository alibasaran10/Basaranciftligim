import 'package:flutter_test/flutter_test.dart';
import 'package:get/get.dart';
import 'package:surum/app/app.dart';

void main() {
  setUp(() {
    Get.testMode = true;
  });

  tearDown(Get.reset);

  testWidgets('SÜRÜM splash screen renders', (tester) async {
    await tester.pumpWidget(const SurumApp());
    await tester.pump();

    expect(find.text('SÜRÜM'), findsOneWidget);
    expect(find.text('Akıllı Çiftlik Yönetim Sistemi'), findsOneWidget);

    await tester.pump(const Duration(seconds: 2));
    await tester.pumpAndSettle();
    expect(find.text('Çiftliğinizi\nAkıllı Yönetin'), findsOneWidget);
  });
}
