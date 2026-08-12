import 'dart:async';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

/// Canlı kamera görüntüsü (MJPEG).
///
/// NEDEN ELLE AYRIŞTIRIYORUZ:
/// Flutter'ın `Image.network`'ü çok parçalı (`multipart/x-mixed-replace`)
/// yanıtı anlamaz — ilk kareyi çizip akışı bırakır. Bu yüzden yanıt
/// baytları `dart:io` ile okunur ve JPEG sınırlayıcılarına (SOI `FFD8`,
/// EOI `FFD9`) göre kareler ayrılır. Böylece ek bir pakete ihtiyaç
/// duymadan gerçek canlı akış elde edilir.
///
/// Bağlantı koparsa (şebeke değişimi, sunucu yeniden başlatma) widget
/// kendiliğinden yeniden bağlanır; sahada mobil veriyle çalışırken bu
/// olağandır.
class MjpegView extends StatefulWidget {
  const MjpegView({
    super.key,
    required this.streamUrl,
    this.fit = BoxFit.cover,
    this.placeholder,
  });

  /// Akış jetonu URL'ye gömülü olarak gelir.
  final String streamUrl;
  final BoxFit fit;

  /// İlk kare gelene kadar (veya bağlantı koptuğunda) gösterilir.
  final Widget? placeholder;

  @override
  State<MjpegView> createState() => _MjpegViewState();
}

class _MjpegViewState extends State<MjpegView> {
  static const _soi = 0xD8; // JPEG basi  (FF D8)
  static const _eoi = 0xD9; // JPEG sonu  (FF D9)

  /// Bozuk akışta belleğin şişmemesi için tampon tavanı.
  static const _maxBufferBytes = 4 * 1024 * 1024;

  HttpClient? _client;
  StreamSubscription<List<int>>? _subscription;
  Uint8List? _frame;
  String? _error;
  bool _disposed = false;
  int _retryCount = 0;
  Timer? _retryTimer;

  final _buffer = BytesBuilder(copy: false);
  bool _inFrame = false;

  @override
  void initState() {
    super.initState();
    _connect();
  }

  @override
  void didUpdateWidget(covariant MjpegView oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Jeton yenilendiğinde veya başka kameraya geçildiğinde yeniden bağlan.
    if (oldWidget.streamUrl != widget.streamUrl) {
      _restart();
    }
  }

  Future<void> _connect() async {
    if (_disposed) return;

    try {
      final client = HttpClient()..connectionTimeout = const Duration(seconds: 10);
      _client = client;

      final request = await client.getUrl(Uri.parse(widget.streamUrl));
      final response = await request.close();

      if (response.statusCode != 200) {
        _fail('Görüntü alınamadı (${response.statusCode})');
        return;
      }

      if (!mounted || _disposed) return;
      setState(() {
        _error = null;
        _retryCount = 0;
      });

      _subscription = response.listen(
        _onBytes,
        onError: (Object error) => _fail('Bağlantı koptu'),
        onDone: () => _fail('Yayın sona erdi'),
        cancelOnError: true,
      );
    } catch (_) {
      _fail('Sunucuya ulaşılamıyor');
    }
  }

  /// Gelen baytlardan tam JPEG kareleri ayıklar.
  void _onBytes(List<int> chunk) {
    for (var i = 0; i < chunk.length; i++) {
      final byte = chunk[i];

      if (!_inFrame) {
        // Kare başlangıcını (FF D8) ara; aradaki multipart başlıkları atla.
        if (byte == 0xFF && i + 1 < chunk.length && chunk[i + 1] == _soi) {
          _inFrame = true;
          _buffer.add([0xFF, _soi]);
          i++;
        }
        continue;
      }

      _buffer.addByte(byte);

      // Kare sonu (FF D9).
      if (byte == _eoi) {
        final bytes = _buffer.toBytes();
        if (bytes.length > 3 && bytes[bytes.length - 2] == 0xFF) {
          _emitFrame(bytes);
          _buffer.clear();
          _inFrame = false;
          continue;
        }
      }

      // Bozuk akışta sonsuza dek büyümeyi engelle.
      if (_buffer.length > _maxBufferBytes) {
        _buffer.clear();
        _inFrame = false;
      }
    }
  }

  void _emitFrame(Uint8List bytes) {
    if (!mounted || _disposed) return;
    setState(() => _frame = bytes);
  }

  void _fail(String message) {
    if (!mounted || _disposed) return;
    setState(() => _error = message);
    _scheduleRetry();
  }

  /// Artan bekleme ile yeniden bağlan; şebeke dönene kadar pes etme.
  void _scheduleRetry() {
    _retryTimer?.cancel();
    final seconds = (1 << _retryCount.clamp(0, 4)).clamp(1, 16);
    _retryCount++;
    _retryTimer = Timer(Duration(seconds: seconds), () {
      if (_disposed) return;
      _cleanupConnection();
      _connect();
    });
  }

  void _restart() {
    _retryTimer?.cancel();
    _cleanupConnection();
    _retryCount = 0;
    _connect();
  }

  void _cleanupConnection() {
    _subscription?.cancel();
    _subscription = null;
    _client?.close(force: true);
    _client = null;
    _buffer.clear();
    _inFrame = false;
  }

  @override
  void dispose() {
    _disposed = true;
    _retryTimer?.cancel();
    _cleanupConnection();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final frame = _frame;

    if (frame != null) {
      return Stack(
        fit: StackFit.expand,
        children: [
          Image.memory(
            frame,
            fit: widget.fit,
            // Her kare yeni bir Uint8List; Flutter'ın kareler arasında
            // titremesini engeller.
            gaplessPlayback: true,
          ),
          if (_error != null)
            const Positioned(
              left: 8,
              top: 8,
              child: _Badge('Yeniden bağlanıyor…', color: AppColors.muted),
            )
          else
            const Positioned(
              left: 8,
              top: 8,
              child: _Badge('CANLI', color: AppColors.danger),
            ),
        ],
      );
    }

    return Container(
      color: const Color(0xFF13251E),
      alignment: Alignment.center,
      child: widget.placeholder ??
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (_error == null)
                const SizedBox(
                  width: 22,
                  height: 22,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              else
                const Icon(Icons.videocam_off_outlined, color: AppColors.muted),
              const SizedBox(height: 8),
              Text(
                _error ?? 'Görüntü bekleniyor…',
                style: const TextStyle(color: AppColors.muted, fontSize: 11),
              ),
            ],
          ),
    );
  }
}

class _Badge extends StatelessWidget {
  const _Badge(this.label, {required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        label,
        style: const TextStyle(color: Colors.white, fontSize: 9, letterSpacing: 0.4),
      ),
    );
  }
}
