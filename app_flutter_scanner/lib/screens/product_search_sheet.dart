import 'dart:async';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../services/barcode_lookup_service.dart';
import '../config/theme.dart';
import 'auto_create_screen.dart';

class ProductSearchSheet extends StatefulWidget {
  const ProductSearchSheet({super.key});

  @override
  State<ProductSearchSheet> createState() => _ProductSearchSheetState();
}

class _ProductSearchSheetState extends State<ProductSearchSheet> {
  final BarcodeLookupService _lookupService = BarcodeLookupService();
  final TextEditingController _searchController = TextEditingController();

  List<AutoEnrichedProductData> _results = [];
  bool _isLoading = false;
  bool _hasSearched = false;
  Timer? _debounceTimer;

  @override
  void dispose() {
    _debounceTimer?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged(String query) {
    _debounceTimer?.cancel();
    if (query.trim().isEmpty) {
      setState(() {
        _results = [];
        _isLoading = false;
        _hasSearched = false;
      });
      return;
    }

    _debounceTimer = Timer(const Duration(milliseconds: 400), () {
      _performSearch(query);
    });
  }

  Future<void> _performSearch(String query) async {
    final clean = query.trim();
    if (clean.isEmpty) return;

    setState(() {
      _isLoading = true;
      _hasSearched = true;
    });

    final results = await _lookupService.searchWebProducts(clean, limit: 20);

    if (mounted) {
      setState(() {
        _results = results;
        _isLoading = false;
      });
    }
  }

  void _openAutoCreate(AutoEnrichedProductData item) {
    Navigator.pop(context); // Fecha o modal de busca
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => AutoCreateScreen(
          barcode: item.barcode,
          initialData: item,
        ),
      ),
    );
  }

  void _openManualCreateBlank() {
    Navigator.pop(context);
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => AutoCreateScreen(
          barcode: '',
          initialData: AutoEnrichedProductData(
            name: _searchController.text.trim(),
            brand: '',
            barcode: '',
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.90,
      decoration: const BoxDecoration(
        color: AppTheme.darkBg,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        children: [
          // Drag Handle
          Center(
            child: Container(
              width: 44,
              height: 5,
              margin: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(
                color: Colors.white24,
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),

          // Header com Título e Botão Fechar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Row(
                  children: [
                    Icon(Icons.public, color: AppTheme.primary, size: 24),
                    SizedBox(width: 8),
                    Text(
                      'Buscar na Web para Cadastrar',
                      style: TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.white54),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),

          // Subtítulo Explicativo
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 20, vertical: 2),
            child: Text(
              'Pesquise no Google/Web por nome ou marca para auto-preencher fotos e dados e cadastrar no estoque.',
              style: TextStyle(color: Colors.white60, fontSize: 12),
            ),
          ),

          const SizedBox(height: 8),

          // Campo de Busca
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: TextField(
              controller: _searchController,
              autofocus: true,
              style: const TextStyle(color: Colors.white, fontSize: 15),
              decoration: InputDecoration(
                hintText: 'Ex: Cimento Poty 50kg, Tubo 25mm Tigre...',
                hintStyle: const TextStyle(color: Colors.white38, fontSize: 14),
                prefixIcon: const Icon(Icons.search, color: AppTheme.primary),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, color: Colors.white54, size: 20),
                        onPressed: () {
                          _searchController.clear();
                          _onSearchChanged('');
                        },
                      )
                    : null,
                filled: true,
                fillColor: AppTheme.darkSurface,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: const BorderSide(color: Colors.white12),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: const BorderSide(color: AppTheme.primary, width: 1.5),
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              ),
              onChanged: _onSearchChanged,
              onSubmitted: _performSearch,
            ),
          ),

          // Sugestões Rápidas de Construção
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  '🧱 Cimento Poty 50kg',
                  '🧱 Cimento Votoran',
                  '🚿 Tubo PVC 25mm Tigre',
                  '🎨 Tinta Suvinil Fosco',
                  '✨ Argamassa AC3 Quartzolit',
                  '🔩 Desengripante MP-80',
                  '🧴 Silicone Tekbond',
                ].map((tag) {
                  final cleanQuery = tag.replaceAll(RegExp(r'^[^\w]+'), '').trim();
                  return Padding(
                    padding: const EdgeInsets.only(right: 6.0),
                    child: ActionChip(
                      backgroundColor: AppTheme.darkSurface,
                      side: const BorderSide(color: Colors.white12),
                      label: Text(
                        tag,
                        style: const TextStyle(fontSize: 11, color: Colors.white70),
                      ),
                      onPressed: () {
                        _searchController.text = cleanQuery;
                        _performSearch(cleanQuery);
                      },
                    ),
                  );
                }).toList(),
              ),
            ),
          ),

          const Divider(color: Colors.white10, height: 12),

          // Lista de Resultados da Internet
          Expanded(
            child: _isLoading
                ? const Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        CircularProgressIndicator(color: AppTheme.primary),
                        SizedBox(height: 12),
                        Text(
                          'Buscando produtos e fotos na internet...',
                          style: TextStyle(color: Colors.white70, fontSize: 13),
                        ),
                      ],
                    ),
                  )
                : !_hasSearched
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.travel_explore, size: 60, color: Colors.white.withOpacity(0.2)),
                            const SizedBox(height: 12),
                            const Text(
                              'Digite o nome de qualquer material de construção',
                              style: TextStyle(color: Colors.white70, fontSize: 14, fontWeight: FontWeight.w500),
                            ),
                            const SizedBox(height: 4),
                            const Text(
                              'O app encontra fotos e dados oficiais para você cadastrar em segundos',
                              style: TextStyle(color: Colors.white38, fontSize: 12),
                            ),
                          ],
                        ),
                      )
                    : _results.isEmpty
                        ? Center(
                            child: Padding(
                              padding: const EdgeInsets.all(24),
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.search_off, size: 56, color: Colors.white.withOpacity(0.3)),
                                  const SizedBox(height: 12),
                                  Text(
                                    'Nenhum resultado online para "${_searchController.text.trim()}"',
                                    textAlign: TextAlign.center,
                                    style: const TextStyle(color: Colors.white70, fontSize: 14),
                                  ),
                                  const SizedBox(height: 16),
                                  ElevatedButton.icon(
                                    onPressed: _openManualCreateBlank,
                                    icon: const Icon(Icons.add),
                                    label: const Text('Cadastrar Manualmente com este Nome'),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: AppTheme.primary,
                                      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          )
                        : ListView.builder(
                            itemCount: _results.length,
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                            itemBuilder: (context, index) {
                              final item = _results[index];
                              final hasImage = item.imageUrl != null && item.imageUrl!.isNotEmpty;

                              return Card(
                                color: AppTheme.darkSurface,
                                elevation: 0,
                                margin: const EdgeInsets.only(bottom: 10),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(16),
                                  side: BorderSide(
                                    color: Colors.white.withOpacity(0.08),
                                  ),
                                ),
                                child: InkWell(
                                  borderRadius: BorderRadius.circular(16),
                                  onTap: () => _openAutoCreate(item),
                                  child: Padding(
                                    padding: const EdgeInsets.all(12),
                                    child: Row(
                                      children: [
                                        // Foto Encontrada na Internet
                                        ClipRRect(
                                          borderRadius: BorderRadius.circular(12),
                                          child: Container(
                                            width: 68,
                                            height: 68,
                                            color: Colors.black26,
                                            child: hasImage
                                                ? CachedNetworkImage(
                                                    imageUrl: item.imageUrl!,
                                                    fit: BoxFit.cover,
                                                    placeholder: (_, __) => const Center(
                                                      child: CircularProgressIndicator(strokeWidth: 2),
                                                    ),
                                                    errorWidget: (_, __, ___) => const Icon(
                                                      Icons.construction,
                                                      color: Colors.white38,
                                                      size: 28,
                                                    ),
                                                  )
                                                : const Icon(
                                                    Icons.construction,
                                                    color: Colors.white38,
                                                    size: 28,
                                                  ),
                                          ),
                                        ),

                                        const SizedBox(width: 14),

                                        // Informações da Web
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                item.name,
                                                maxLines: 2,
                                                overflow: TextOverflow.ellipsis,
                                                style: const TextStyle(
                                                  color: Colors.white,
                                                  fontSize: 14,
                                                  fontWeight: FontWeight.w600,
                                                ),
                                              ),
                                              const SizedBox(height: 4),
                                              Row(
                                                children: [
                                                  if (item.brand.isNotEmpty)
                                                    Container(
                                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                      margin: const EdgeInsets.only(right: 6),
                                                      decoration: BoxDecoration(
                                                        color: AppTheme.primary.withOpacity(0.15),
                                                        borderRadius: BorderRadius.circular(6),
                                                        border: Border.all(
                                                          color: AppTheme.primary.withOpacity(0.3),
                                                        ),
                                                      ),
                                                      child: Text(
                                                        item.brand,
                                                        style: const TextStyle(
                                                          color: Colors.white,
                                                          fontSize: 10,
                                                          fontWeight: FontWeight.bold,
                                                        ),
                                                      ),
                                                    ),
                                                  if (item.barcode.isNotEmpty)
                                                    Text(
                                                      'EAN: ${item.barcode}',
                                                      style: const TextStyle(
                                                        color: AppTheme.accentGreen,
                                                        fontSize: 11,
                                                        fontWeight: FontWeight.w500,
                                                      ),
                                                    )
                                                  else
                                                    const Text(
                                                      'Web Match',
                                                      style: TextStyle(
                                                        color: Colors.white38,
                                                        fontSize: 11,
                                                      ),
                                                    ),
                                                ],
                                              ),
                                              const SizedBox(height: 6),
                                              Row(
                                                mainAxisAlignment: MainAxisAlignment.end,
                                                children: [
                                                  Container(
                                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                                    decoration: BoxDecoration(
                                                      color: AppTheme.primary,
                                                      borderRadius: BorderRadius.circular(10),
                                                    ),
                                                    child: const Row(
                                                      mainAxisSize: MainAxisSize.min,
                                                      children: [
                                                        Icon(Icons.add, size: 14, color: Colors.white),
                                                        SizedBox(width: 4),
                                                        Text(
                                                          'Cadastrar',
                                                          style: TextStyle(
                                                            color: Colors.white,
                                                            fontSize: 12,
                                                            fontWeight: FontWeight.bold,
                                                          ),
                                                        ),
                                                      ],
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              );
                            },
                          ),
          ),
        ],
      ),
    );
  }
}
