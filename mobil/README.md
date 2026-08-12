# SÜRÜM Mobil

GetX tabanlı, responsive, dark/light mode uyumlu akıllı çiftlik yönetim
uygulaması.

## Çalıştırma

```bash
flutter pub get
flutter run
```

Demo giriş bilgileri:

- E-posta: `info@yesilvadiciftligi.com`
- Şifre: `123456`

## Mimari

```text
lib/
├── app/             # Binding, route ve uygulama başlangıcı
├── core/            # Merkezi tema, renk, sabit ve responsive araçları
├── data/services/   # API ve yerel saklama servisleri
├── modules/         # Controller ve view katmanları
└── shared/widgets/  # Ortak tasarım bileşenleri
```

Servis yanıtları controller katmanında `Map<String, dynamic>` ve
`List<Map<String, dynamic>>` olarak işlenir. View katmanı yalnızca controller
tarafından sunulan `Rx` alanlarını `Obx` ile dinler; ayrı model sınıfı
kullanılmaz.

Gerçek backend bağlantısında
`lib/data/services/api_service.dart` içindeki demo metotlarının `GetConnect`
çağrılarıyla değiştirilmesi yeterlidir.

## Kalite Kontrol

```bash
dart analyze --fatal-infos
flutter test
```

Görsel QA sırasında bir ekranı doğrudan başlatmak için:

```bash
flutter run --dart-define=START_ROUTE=/camera-integration
flutter run --dart-define=START_ROUTE=/main --dart-define=START_TAB=3
```
