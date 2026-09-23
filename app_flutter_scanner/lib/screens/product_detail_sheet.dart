import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../models/product_model.dart';
import '../services/supabase_service.dart';
import '../config/theme.dart';

class ProductDetailSheet extends StatefulWidget {
  final ProductModel product;
  final VoidCallback onUpdated;

  const ProductDetailSheet({
    super.key,
    required this.product,
    required this.onUpdated,
  });

  @override
  State<ProductDetailSheet> createState() => _ProductDetailSheetState();
}

class _ProductDetailSheetState extends State<ProductDetailSheet> {
  final SupabaseService _supabaseService = SupabaseService();
  
  late int _currentStock;
  late double _currentPrice;
  bool _saving = false;

  final TextEditingController _priceController = TextEditingController();
  final TextEditingController _stockController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _currentStock = widget.product.stock;
    _currentPrice = widget.product.price;
    _priceController.text = _currentPrice.toStringAsFixed(2);
    _stockController.text = _currentStock.toString();
  }

  @override
  void dispose() {
    _priceController.dispose();
    _stockController.dispose();
    super.dispose();
  }

  void _adjustStock(int delta) {
    setState(() {
      _currentStock = (_currentStock + delta).clamp(0, 999999);
      _stockController.text = _currentStock.toString();
    });
  }

  Future<void> _saveChanges() async {
    setState(() => _saving = true);

    final newPrice = double.tryParse(_priceController.text.replaceAll(',', '.')) ?? _currentPrice;
    final newStock = int.tryParse(_stockController.text) ?? _currentStock;

    bool priceSuccess = true;
    bool stockSuccess = true;

    if (newPrice != widget.product.price) {
      priceSuccess = await _supabaseService.updateProductPrice(widget.product.id, newPrice);
    }

    if (newStock != widget.product.stock) {
      stockSuccess = await _supabaseService.updateProductStock(widget.product.id, newStock);
    }

    setState(() => _saving = false);

    if (mounted) {
      if (priceSuccess && stockSuccess) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: AppTheme.accentGreen,
            content: Text('✅ Atualizado no Supabase com Sucesso!'),
          ),
        );
        widget.onUpdated();
        Navigator.pop(context);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: AppTheme.accentRed,
            content: Text('❌ Erro ao salvar alterações no banco.'),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final hasImage = widget.product.imageUrls.isNotEmpty;

    return Container(
      padding: EdgeInsets.only(
        top: 20,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Barra superior com indicador
            Center(
              child: Container(
                width: 48,
                height: 5,
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Header com Foto e Informações Básicas
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    width: 76,
                    height: 76,
                    color: AppTheme.darkCard,
                    child: hasImage
                        ? CachedNetworkImage(
                            imageUrl: widget.product.imageUrls.first,
                            fit: BoxFit.cover,
                            placeholder: (_, __) => const Center(child: CircularProgressIndicator(strokeWidth: 2)),
                            errorWidget: (context, url, error) => const Icon(Icons.inventory_2, color: Colors.white54),
                          )
                        : const Icon(Icons.inventory_2, color: Colors.white54, size: 36),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (widget.product.brand != null && widget.product.brand!.isNotEmpty)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppTheme.primary.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            widget.product.brand!.toUpperCase(),
                            style: const TextStyle(color: AppTheme.primary, fontSize: 11, fontWeight: FontWeight.bold),
                          ),
                        ),
                      const SizedBox(height: 4),
                      Text(
                        widget.product.name,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'EAN: ${widget.product.barcode ?? widget.product.sku}',
                        style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const Divider(color: Colors.white12, height: 28),

            // Seção de Ajuste Rápido de Estoque
            const Text(
              '📦 Saldo de Estoque (Depósito / Loja)',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  flex: 3,
                  child: TextField(
                    controller: _stockController,
                    keyboardType: TextInputType.number,
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppTheme.accentGreen),
                    decoration: InputDecoration(
                      filled: true,
                      fillColor: AppTheme.darkCard,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      suffixText: 'un',
                    ),
                    onChanged: (val) {
                      final parsed = int.tryParse(val);
                      if (parsed != null) _currentStock = parsed;
                    },
                  ),
                ),
                const SizedBox(width: 8),
                _quickButton('+1', () => _adjustStock(1)),
                const SizedBox(width: 6),
                _quickButton('+5', () => _adjustStock(5)),
                const SizedBox(width: 6),
                _quickButton('+10', () => _adjustStock(10)),
              ],
            ),

            const SizedBox(height: 18),

            // Seção de Atualização de Preço
            const Text(
              '💰 Preço de Venda (R\$)',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _priceController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white),
              decoration: InputDecoration(
                filled: true,
                fillColor: AppTheme.darkCard,
                prefixIcon: const Icon(Icons.attach_money, color: AppTheme.primary),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              ),
            ),

            const SizedBox(height: 24),

            // Botão de Salvar no Supabase
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton.icon(
                onPressed: _saving ? null : _saveChanges,
                icon: _saving
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Icon(Icons.cloud_upload_outlined),
                label: Text(
                  _saving ? 'Salvando no Supabase...' : 'Salvar no Banco em Tempo Real',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _quickButton(String label, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        decoration: BoxDecoration(
          color: AppTheme.darkCard,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Colors.white12),
        ),
        child: Text(
          label,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppTheme.accentGreen),
        ),
      ),
    );
  }
}
