import 'dart:async';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../services/barcode_lookup_service.dart';
import '../services/supabase_service.dart';
import '../config/theme.dart';
import 'auto_create_screen.dart';

class HomeCenterExtractorScreen extends StatefulWidget {
  const HomeCenterExtractorScreen({super.key});

  @override
  State<HomeCenterExtractorScreen> createState() => _HomeCenterExtractorScreenState();
}

class _HomeCenterExtractorScreenState extends State<HomeCenterExtractorScreen> {
  final BarcodeLookupService _lookupService = BarcodeLookupService();
  final SupabaseService _supabaseService = SupabaseService();
  final TextEditingController _searchController = TextEditingController();

  List<AutoEnrichedProductData> _products = [];
  bool _isLoading = false;
  bool _hasSearched = false;
  String _selectedStore = 'all';
  Timer? _debounceTimer;

  static const List<String> _quickPills = [
    'Tinta Suvinil 18L',
    'Cimento CP II',
    'Argamassa Quartzolit',
    'Porcelanato 80x80',
    'Tubo Tigre 100mm',
    'Disjuntor Steck',
  ];

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
        _products = [];
        _isLoading = false;
        _hasSearched = false;
      });
      return;
    }

    _debounceTimer = Timer(const Duration(milliseconds: 500), () {
      _executeSearch(query);
    });
  }

  Future<void> _executeSearch(String query) async {
    final clean = query.trim();
    if (clean.isEmpty) return;

    setState(() {
      _isLoading = true;
      _hasSearched = true;
    });

    final results = await _lookupService.searchWebProducts(clean, limit: 30);

    if (mounted) {
      setState(() {
        _products = results;
        _isLoading = false;
      });
    }
  }

  void _importProduct(AutoEnrichedProductData item) {
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

  @override
  Widget build(BuildContext context) {
    final filtered = _products.where((p) {
      if (_selectedStore == 'all') return true;
      return (p.store ?? '').toLowerCase().contains(_selectedStore.toLowerCase());
    }).toList();

    return Scaffold(
      backgroundColor: AppTheme.darkBackground,
      appBar: AppBar(
        backgroundColor: AppTheme.darkSurface,
        elevation: 0,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: AppTheme.primary.withOpacity(0.2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.storefront, color: AppTheme.primary, size: 20),
            ),
            const SizedBox(width: 10),
            const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Extrator Home Centers',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                ),
                Text(
                  'Carajás • Acal • Normatel',
                  style: TextStyle(fontSize: 11, color: Colors.white60),
                ),
              ],
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          // Campo de busca
          Container(
            padding: const EdgeInsets.all(16),
            color: AppTheme.darkSurface,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextField(
                  controller: _searchController,
                  style: const TextStyle(color: Colors.white),
                  onChanged: _onSearchChanged,
                  onSubmitted: _executeSearch,
                  decoration: InputDecoration(
                    hintText: 'Pesquise material (ex: Suvinil, Cimento, Tigre)...',
                    hintStyle: const TextStyle(color: Colors.white38, fontSize: 13),
                    prefixIcon: const Icon(Icons.search, color: AppTheme.primary),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear, color: Colors.white54),
                            onPressed: () {
                              _searchController.clear();
                              _onSearchChanged('');
                            },
                          )
                        : null,
                    filled: true,
                    fillColor: AppTheme.darkBackground,
                    contentPadding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                // Chips de busca rápida
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: _quickPills.map((pill) {
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ActionChip(
                          label: Text(pill, style: const TextStyle(fontSize: 11, color: Colors.white70)),
                          backgroundColor: AppTheme.darkBackground,
                          side: BorderSide(color: Colors.white.withOpacity(0.1)),
                          onPressed: () {
                            _searchController.text = pill;
                            _executeSearch(pill);
                          },
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ],
            ),
          ),

          // Filtros de Loja
          if (_products.isNotEmpty)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              color: AppTheme.darkSurface.withOpacity(0.5),
              child: Row(
                children: [
                  Text(
                    '${filtered.length} encontrados',
                    style: const TextStyle(color: Colors.white60, fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                  const Spacer(),
                  _buildStoreFilterChip('Todas', 'all'),
                  const SizedBox(width: 6),
                  _buildStoreFilterChip('Carajás', 'carajás'),
                  const SizedBox(width: 6),
                  _buildStoreFilterChip('Acal', 'acal'),
                ],
              ),
            ),

          // Lista de Resultados
          Expanded(
            child: _isLoading
                ? const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        CircularProgressIndicator(color: AppTheme.primary),
                        SizedBox(height: 16),
                        Text(
                          'Varrendo Home Centers...',
                          style: TextStyle(color: Colors.white70, fontSize: 13),
                        ),
                      ],
                    ),
                  )
                : filtered.isNotEmpty
                    ? ListView.builder(
                        padding: const EdgeInsets.all(12),
                        itemCount: filtered.length,
                        itemBuilder: (context, index) {
                          final item = filtered[index];
                          return _buildProductCard(item);
                        },
                      )
                    : Center(
                        child: Padding(
                          padding: const EdgeInsets.all(32),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                _hasSearched ? Icons.search_off : Icons.storefront_outlined,
                                size: 56,
                                color: Colors.white24,
                              ),
                              const SizedBox(height: 12),
                              Text(
                                _hasSearched
                                    ? 'Nenhum material encontrado nas lojas'
                                    : 'Pesquise nas grandes redes',
                                style: const TextStyle(color: Colors.white70, fontWeight: FontWeight.bold),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                _hasSearched
                                    ? 'Tente buscar por marca ou termo genérico.'
                                    : 'Conectado direto com Carajás e Acal para fotos HD e preços oficiais.',
                                textAlign: TextAlign.center,
                                style: const TextStyle(color: Colors.white38, fontSize: 12),
                              ),
                            ],
                          ),
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildStoreFilterChip(String label, String storeKey) {
    final isSelected = _selectedStore == storeKey;
    return GestureDetector(
      onTap: () => setState(() => _selectedStore = storeKey),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primary : AppTheme.darkBackground,
          borderRadius: BorderRadius.circular(6),
          border: BorderSide(
            color: isSelected ? AppTheme.primary : Colors.white.withOpacity(0.1),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            color: isSelected ? Colors.white : Colors.white70,
          ),
        ),
      ),
    );
  }

  Widget _buildProductCard(AutoEnrichedProductData item) {
    final isCarajas = (item.store ?? '').toLowerCase().contains('carajás');

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      color: AppTheme.darkSurface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: BorderSide(color: Colors.white.withOpacity(0.08)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Imagem do Produto HD
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: Container(
                width: 80,
                height: 80,
                color: Colors.white,
                child: item.imageUrl != null && item.imageUrl!.isNotEmpty
                    ? CachedNetworkImage(
                        imageUrl: item.imageUrl!,
                        fit: BoxFit.contain,
                        placeholder: (_, __) => const Center(
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                        errorWidget: (_, __, ___) => const Icon(Icons.broken_image, color: Colors.grey),
                      )
                    : const Icon(Icons.image_not_supported, color: Colors.grey),
              ),
            ),
            const SizedBox(width: 12),

            // Informações e Ações
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Loja Badge & Marca
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: isCarajas ? Colors.blue.withOpacity(0.2) : Colors.green.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          item.store ?? 'Home Center',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: isCarajas ? Colors.lightBlueAccent : Colors.lightGreenAccent,
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          item.brand,
                          style: const TextStyle(fontSize: 11, color: Colors.white54),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),

                  // Título do Produto
                  Text(
                    item.name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 6),

                  // Preço de Referência e EAN
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      if (item.price != null && item.price! > 0)
                        Text(
                          'R\$ ${item.price!.toStringAsFixed(2)}',
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.primary,
                          ),
                        )
                      else
                        const SizedBox.shrink(),

                      ElevatedButton.icon(
                        onPressed: () => _importProduct(item),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        icon: const Icon(Icons.add, size: 14),
                        label: const Text('Cadastrar', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    ).animate().fadeIn(duration: 200.ms).slideY(begin: 0.05, end: 0);
  }
}
