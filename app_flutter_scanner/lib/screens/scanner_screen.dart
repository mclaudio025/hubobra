import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../services/supabase_service.dart';
import '../services/barcode_lookup_service.dart';
import '../config/theme.dart';
import 'product_detail_sheet.dart';
import 'auto_create_screen.dart';
import 'product_search_sheet.dart';

class ScannerScreen extends StatefulWidget {
  const ScannerScreen({super.key});

  @override
  State<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends State<ScannerScreen> {
  final MobileScannerController _scannerController = MobileScannerController(
    detectionSpeed: DetectionSpeed.normal,
    detectionTimeoutMs: 1200,
    formats: const [
      BarcodeFormat.ean13,
      BarcodeFormat.ean8,
      BarcodeFormat.code128,
      BarcodeFormat.code39,
      BarcodeFormat.qrCode,
      BarcodeFormat.upcA,
      BarcodeFormat.upcE,
    ],
    facing: CameraFacing.back,
    torchEnabled: false,
    returnImage: false,
  );

  final SupabaseService _supabaseService = SupabaseService();
  final BarcodeLookupService _lookupService = BarcodeLookupService();

  bool _isProcessing = false;
  bool _isTorchOn = false;
  String? _lastScannedBarcode;
  DateTime? _lastScanTime;

  void _onDetect(BarcodeCapture capture) async {
    if (_isProcessing) return;

    final List<Barcode> barcodes = capture.barcodes;
    if (barcodes.isEmpty) return;

    final String? rawValue = barcodes.first.rawValue;
    if (rawValue == null || rawValue.trim().length < 4) return;

    final cleanCode = rawValue.trim();
    final now = DateTime.now();

    // Evita leituras duplicadas acidentais consecutivas em menos de 2 segundos
    if (_lastScannedBarcode == cleanCode &&
        _lastScanTime != null &&
        now.difference(_lastScanTime!).inMilliseconds < 2000) {
      return;
    }

    _lastScannedBarcode = cleanCode;
    _lastScanTime = now;
    _handleBarcode(cleanCode);
  }

  Future<void> _handleBarcode(String barcode) async {
    if (_isProcessing) return;
    setState(() => _isProcessing = true);
    HapticFeedback.mediumImpact();

    try {
      // 1. Consulta no Supabase
      final existingProduct = await _supabaseService.findProductByBarcode(barcode);

      if (!mounted) return;

      if (existingProduct != null) {
        // PRODUTO JÁ EXISTE -> Abre Ficha de Ajuste Rápido
        await showModalBottomSheet(
          context: context,
          isScrollControlled: true,
          backgroundColor: Colors.transparent,
          builder: (_) => ProductDetailSheet(
            product: existingProduct,
            onUpdated: () {},
          ),
        );
      } else {
        // PRODUTO NOVO -> Busca dados na IA/Base e abre tela de cadastro
        final enriched = await _lookupService.lookupBarcode(barcode);
        if (!mounted) return;

        await Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => AutoCreateScreen(
              barcode: barcode,
              initialData: enriched,
            ),
          ),
        );
      }
    } catch (e) {
      print('Erro ao processar código de barras: $e');
    } finally {
      // Quando fechar o modal ou tela, reabilita o scanner e permite ler o mesmo produto novamente
      if (mounted) {
        Future.delayed(const Duration(milliseconds: 1200), () {
          if (mounted) {
            setState(() {
              _isProcessing = false;
              _lastScannedBarcode = null;
            });
          }
        });
      }
    }
  }

  void _showManualInputDialog() {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.darkSurface,
        title: const Text('Digitar Código Manualmente'),
        content: TextField(
          controller: controller,
          keyboardType: TextInputType.number,
          autofocus: true,
          decoration: const InputDecoration(
            hintText: 'Ex: 7898231403577',
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () {
              final code = controller.text.trim();
              Navigator.pop(ctx);
              if (code.isNotEmpty) _handleBarcode(code);
            },
            child: const Text('Pesquisar'),
          ),
        ],
      ),
    );
  }

  void _showSearchByDescriptionSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const ProductSearchSheet(),
    );
  }

  @override
  void dispose() {
    _scannerController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // 1. Câmera Scanner em Tela Cheia
          MobileScanner(
            controller: _scannerController,
            onDetect: _onDetect,
          ),

          // 2. Máscara Escura com Janela Central
          SafeArea(
            child: Column(
              children: [
                // Top Bar com Controles de Lanterna e Câmera
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.6),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.bolt, color: AppTheme.accentGreen, size: 18),
                            SizedBox(width: 6),
                            Text('HubScanner Live', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                          ],
                        ),
                      ),
                      Row(
                        children: [
                          IconButton(
                            icon: Icon(
                              _isTorchOn ? Icons.flash_on : Icons.flash_off,
                              color: _isTorchOn ? AppTheme.accentAmber : Colors.white,
                            ),
                            style: IconButton.styleFrom(backgroundColor: Colors.black54),
                            onPressed: () {
                              setState(() => _isTorchOn = !_isTorchOn);
                              _scannerController.toggleTorch();
                            },
                          ),
                          const SizedBox(width: 8),
                          IconButton(
                            icon: const Icon(Icons.flip_camera_ios, color: Colors.white),
                            style: IconButton.styleFrom(backgroundColor: Colors.black54),
                            onPressed: () => _scannerController.switchCamera(),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                const Spacer(),

                // Janela de Leitura Central
                Center(
                  child: Container(
                    width: 280,
                    height: 180,
                    decoration: BoxDecoration(
                      border: Border.all(color: AppTheme.primary, width: 2.5),
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: AppTheme.primary.withOpacity(0.2),
                          blurRadius: 20,
                          spreadRadius: 2,
                        ),
                      ],
                    ),
                    child: Stack(
                      children: [
                        // Linha Laser Animada
                        Animate(
                          onPlay: (controller) => controller.repeat(reverse: true),
                          effects: const [
                            MoveEffect(
                              begin: Offset(0, -70),
                              end: Offset(0, 70),
                              duration: Duration(milliseconds: 1400),
                              curve: Curves.easeInOut,
                            ),
                          ],
                          child: Center(
                            child: Container(
                              height: 3,
                              color: AppTheme.accentRed,
                              margin: const EdgeInsets.symmetric(horizontal: 16),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 20),
                const Text(
                  'Aponte para o código de barras EAN do produto',
                  style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w500, shadows: [Shadow(blurRadius: 4)]),
                ),

                const Spacer(),

                // Bottom Actions: Digitação Manual & Busca por Nome/Descrição
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
                  child: Row(
                    children: [
                      // Botão 1: Digitar Código Manual
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: _showManualInputDialog,
                          icon: const Icon(Icons.keyboard, size: 18),
                          label: const Text(
                            'Digitar Código',
                            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.black.withOpacity(0.75),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(24),
                              side: const BorderSide(color: Colors.white24),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      // Botão 2: Buscar na Web / Cadastrar
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: _showSearchByDescriptionSheet,
                          icon: const Icon(Icons.travel_explore, size: 18, color: Colors.white),
                          label: const Text(
                            'Buscar na Web',
                            style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.primary,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            elevation: 4,
                            shadowColor: AppTheme.primary.withOpacity(0.4),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(24),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Loading Overlay se estiver processando
          if (_isProcessing)
            Container(
              color: Colors.black.withOpacity(0.5),
              child: const Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircularProgressIndicator(color: AppTheme.primary),
                    SizedBox(height: 16),
                    Text('Consultando no Supabase...', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
