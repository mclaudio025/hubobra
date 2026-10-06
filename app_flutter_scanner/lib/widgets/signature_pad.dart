import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';

class SignaturePoint {
  final Offset offset;
  final Paint paint;

  SignaturePoint(this.offset, this.paint);
}

class DigitalSignaturePad extends StatefulWidget {
  final Function(String base64Image)? onSigned;
  final ValueChanged<bool>? onHasSignatureChanged;

  const DigitalSignaturePad({
    super.key,
    this.onSigned,
    this.onHasSignatureChanged,
  });

  @override
  State<DigitalSignaturePad> createState() => DigitalSignaturePadState();
}

class DigitalSignaturePadState extends State<DigitalSignaturePad> {
  final GlobalKey _globalKey = GlobalKey();
  final List<List<Offset>> _strokes = [];
  List<Offset> _currentStroke = [];

  bool get hasSignature => _strokes.isNotEmpty;

  void clear() {
    setState(() {
      _strokes.clear();
      _currentStroke.clear();
    });
    widget.onHasSignatureChanged?.call(false);
  }

  Future<String?> captureSignatureAsBase64() async {
    if (!hasSignature) return null;

    try {
      final boundary = _globalKey.currentContext?.findRenderObject() as RenderRepaintBoundary?;
      if (boundary == null) return null;

      final ui.Image image = await boundary.toImage(pixelRatio: 2.0);
      final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
      if (byteData == null) return null;

      final bytes = byteData.buffer.asUint8List();
      final uri = Uri.dataFromBytes(bytes, mimeType: 'image/png');
      return uri.toString(); // data:image/png;base64,...
    } catch (e) {
      debugPrint('Erro ao capturar assinatura: $e');
      return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: [
        RepaintBoundary(
          key: _globalKey,
          child: Container(
            height: 180,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: hasSignature ? const Color(0xFF009DE0) : Colors.grey.shade300,
                width: 2,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.08),
                  blurRadius: 8,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(14),
              child: Stack(
                children: [
                  // Linha pontilhada / Guia de assinatura
                  Positioned(
                    left: 20,
                    right: 20,
                    bottom: 35,
                    child: Row(
                      children: List.generate(
                        30,
                        (index) => Expanded(
                          child: Container(
                            height: 1,
                            color: index % 2 == 0 ? Colors.grey.shade400 : Colors.transparent,
                          ),
                        ),
                      ),
                    ),
                  ),

                  // Texto de instrução caso esteja em branco
                  if (!hasSignature && _currentStroke.isEmpty)
                    Center(
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.edit_outlined, size: 20, color: Colors.grey.shade400),
                          const SizedBox(width: 8),
                          Text(
                            'Assine aqui com o dedo',
                            style: TextStyle(
                              color: Colors.grey.shade400,
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),

                  // Canvas de desenho
                  GestureDetector(
                    onPanStart: (details) {
                      setState(() {
                        _currentStroke = [details.localPosition];
                        _strokes.add(_currentStroke);
                      });
                      widget.onHasSignatureChanged?.call(true);
                    },
                    onPanUpdate: (details) {
                      setState(() {
                        _currentStroke.add(details.localPosition);
                      });
                    },
                    onPanEnd: (details) {
                      _currentStroke = [];
                    },
                    child: CustomPaint(
                      painter: _SignaturePainter(_strokes),
                      size: Size.infinite,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'X _______________________________',
              style: TextStyle(color: Colors.grey.shade500, fontSize: 11),
            ),
            TextButton.icon(
              onPressed: hasSignature ? clear : null,
              icon: const Icon(Icons.refresh, size: 16),
              label: const Text('Limpar Assinatura'),
              style: TextButton.styleFrom(
                foregroundColor: Colors.redAccent,
                textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _SignaturePainter extends CustomPainter {
  final List<List<Offset>> strokes;

  _SignaturePainter(this.strokes);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFF00264D) // Azul marinho profundo profissional
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..strokeWidth = 3.5;

    for (final stroke in strokes) {
      if (stroke.isEmpty) continue;
      if (stroke.length == 1) {
        canvas.drawCircle(stroke.first, 1.75, paint);
      } else {
        final path = Path();
        path.moveTo(stroke.first.dx, stroke.first.dy);
        for (int i = 1; i < stroke.length; i++) {
          path.lineTo(stroke[i].dx, stroke[i].dy);
        }
        canvas.drawPath(path, paint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant _SignaturePainter oldDelegate) => true;
}
