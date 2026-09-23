import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../models/category_model.dart';
import '../services/supabase_service.dart';
import '../services/barcode_lookup_service.dart';
import '../config/theme.dart';

class AutoCreateScreen extends StatefulWidget {
  final String barcode;
  final AutoEnrichedProductData? initialData;

  const AutoCreateScreen({
    super.key,
    required this.barcode,
    this.initialData,
  });

  @override
  State<AutoCreateScreen> createState() => _AutoCreateScreenState();
}

class _AutoCreateScreenState extends State<AutoCreateScreen> {
  final SupabaseService _supabaseService = SupabaseService();
  final BarcodeLookupService _lookupService = BarcodeLookupService();

  late TextEditingController _nameController;
  late TextEditingController _brandController;
  late TextEditingController _descriptionController;
  late TextEditingController _priceController;
  late TextEditingController _stockController;
  late TextEditingController _skuController;

  String? _imageUrl;
  List<CategoryModel> _categories = [];
  String? _selectedCategoryId;
  bool _loading = false;
  bool _fetchingCategories = true;
  bool _searchingImages = false;
  List<WebImageItem> _candidateImages = [];

  @override
  void initState() {
    super.initState();
    final initialName = widget.initialData?.name ?? '';
    final initialBrand = widget.initialData?.brand ?? '';

    _nameController = TextEditingController(text: initialName);
    _brandController = TextEditingController(text: initialBrand);
    _descriptionController = TextEditingController(text: widget.initialData?.description ?? '');
    _priceController = TextEditingController(text: '0.00');
    _stockController = TextEditingController(text: '10');
    final barcodeSuffix = widget.barcode.trim().isNotEmpty
        ? widget.barcode.substring(widget.barcode.length > 6 ? widget.barcode.length - 6 : 0)
        : DateTime.now().millisecondsSinceEpoch.toString().substring(7);

    _skuController = TextEditingController(text: 'SKU-$barcodeSuffix');
    _imageUrl = widget.initialData?.imageUrl;
    _candidateImages = widget.initialData?.candidateImages ?? [];

    _loadCategories();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _brandController.dispose();
    _descriptionController.dispose();
    _priceController.dispose();
    _stockController.dispose();
    _skuController.dispose();
    super.dispose();
  }

  Future<void> _loadCategories() async {
    final list = await _supabaseService.getCategories();
    setState(() {
      _categories = list;
      if (list.isNotEmpty) {
        _autoMatchCategory(_nameController.text, list);
      }
      _fetchingCategories = false;
    });
  }

  void _autoMatchCategory(String name, List<CategoryModel> categories) {
    if (name.isEmpty) return;
    final lower = name.toLowerCase();
    for (final cat in categories) {
      final catLower = cat.name.toLowerCase();
      if (lower.contains('tinta') || lower.contains('spray') || lower.contains('verniz') || lower.contains('esmalte sint')) {
        if (catLower.contains('tinta') || catLower.contains('verniz') || catLower.contains('quimic')) {
          _selectedCategoryId = cat.id;
          return;
        }
      }
      if (lower.contains('desengripante') ||
          lower.contains('lubrificante') ||
          lower.contains('mp-80') ||
          lower.contains('mp80') ||
          lower.contains('limpa contato')) {
        if (catLower.contains('quimic') ||
            catLower.contains('ferramenta') ||
            catLower.contains('acessorio') ||
            catLower.contains('tintas')) {
          _selectedCategoryId = cat.id;
          return;
        }
      }
      if (lower.contains('cimento') && (catLower.contains('básica') || catLower.contains('cimento'))) {
        _selectedCategoryId = cat.id;
        return;
      }
      if ((lower.contains('adesivo') || lower.contains('pvc') || lower.contains('tubo')) && catLower.contains('hidraul')) {
        _selectedCategoryId = cat.id;
        return;
      }
    }
    if (_selectedCategoryId == null && categories.isNotEmpty) {
      _selectedCategoryId = categories.first.id;
    }
  }

  /// Busca imagens online a partir do Nome, Marca ou Código de Barras
  Future<void> _searchImagesOnline({String? customQuery}) async {
    final name = _nameController.text.trim();
    final brand = _brandController.text.trim();
    final query = customQuery ??
        ('$name $brand'.trim().isNotEmpty ? '$name $brand'.trim() : widget.barcode);

    setState(() => _searchingImages = true);
    final images = await _lookupService.searchProductImagesWithDetails(query, limit: 24);
    setState(() {
      _searchingImages = false;
      _candidateImages = images;
    });

    if (!mounted) return;

    if (images.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Nenhuma foto encontrada para "$query". Tente outro termo.')),
      );
      return;
    }

    // Abre Modal de Galeria de Fotos Interativo com Busca
    _showImageGallerySheet(images, initialQuery: query);
  }

  void _showImageGallerySheet(List<WebImageItem> initialImages, {String initialQuery = ''}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.darkSurface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        List<WebImageItem> modalImages = List.from(initialImages);
        final searchInputController = TextEditingController(text: initialQuery);
        bool isModalLoading = false;

        return StatefulBuilder(
          builder: (context, setModalState) {
            void performModalSearch(String term) async {
              if (term.trim().isEmpty) return;
              setModalState(() => isModalLoading = true);
              final res = await _lookupService.searchProductImagesWithDetails(term.trim(), limit: 24);
              setModalState(() {
                isModalLoading = false;
                modalImages = res;
              });
              setState(() => _candidateImages = res);
            }

            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom,
              ),
              child: Container(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
                height: MediaQuery.of(context).size.height * 0.8,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Cabeçalho do Modal
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          '📸 Galeria e Busca de Fotos na Web',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close),
                          onPressed: () => Navigator.pop(ctx),
                        ),
                      ],
                    ),

                    const SizedBox(height: 8),

                    // Barra de Pesquisa Interativa dentro do Modal
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: searchInputController,
                            style: const TextStyle(color: Colors.white, fontSize: 13),
                            decoration: InputDecoration(
                              hintText: 'Digite o nome do produto (ex: Tinta Spray Preto)',
                              hintStyle: const TextStyle(color: Colors.white38, fontSize: 12),
                              isDense: true,
                              filled: true,
                              fillColor: AppTheme.darkCard,
                              prefixIcon: const Icon(Icons.search, size: 18, color: AppTheme.primary),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(10),
                                borderSide: BorderSide.none,
                              ),
                            ),
                            onSubmitted: performModalSearch,
                          ),
                        ),
                        const SizedBox(width: 8),
                        ElevatedButton(
                          onPressed: isModalLoading
                              ? null
                              : () => performModalSearch(searchInputController.text),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.primary,
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          child: isModalLoading
                              ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                              : const Text('Buscar', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                        ),
                      ],
                    ),

                    const SizedBox(height: 10),

                    // Chips de Atalhos de Busca Rápida
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          '🎨 Tinta Spray',
                          '🎨 Tinta Spray Preto Fosco',
                          '🎨 Tinta Spray Mundial Prime',
                          '🎨 Tinta Spray Tekbond',
                          '✨ Verniz Spray',
                          '🔩 Desengripante MP-80',
                          '🧴 Silicone Acético',
                        ].map((suggestion) {
                          return Padding(
                            padding: const EdgeInsets.only(right: 6.0),
                            child: ActionChip(
                              backgroundColor: AppTheme.darkCard,
                              side: const BorderSide(color: Colors.white12),
                              label: Text(suggestion, style: const TextStyle(fontSize: 11, color: Colors.white70)),
                              onPressed: () {
                                final cleanQuery = suggestion.replaceAll(RegExp(r'^[^\w]+'), '').trim();
                                searchInputController.text = cleanQuery;
                                performModalSearch(cleanQuery);
                              },
                            ),
                          );
                        }).toList(),
                      ),
                    ),

                    const SizedBox(height: 12),

                    const Text(
                      'Toque na foto correta para preencher os dados oficiais:',
                      style: TextStyle(color: AppTheme.textSecondary, fontSize: 12),
                    ),

                    const SizedBox(height: 10),

                    // Grade de Fotos
                    Expanded(
                      child: isModalLoading
                          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
                          : modalImages.isEmpty
                              ? Center(
                                  child: Column(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.search_off, size: 48, color: Colors.white30),
                                      const SizedBox(height: 8),
                                      const Text('Nenhuma foto encontrada para esta busca.', style: TextStyle(color: Colors.white60)),
                                      const SizedBox(height: 4),
                                      const Text('Tente digitar o nome da marca ou produto acima.', style: TextStyle(color: Colors.white38, fontSize: 12)),
                                    ],
                                  ),
                                )
                              : GridView.builder(
                                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                                    crossAxisCount: 2,
                                    crossAxisSpacing: 12,
                                    mainAxisSpacing: 12,
                                    childAspectRatio: 0.82,
                                  ),
                                  itemCount: modalImages.length,
                                  itemBuilder: (context, index) {
                                    final item = modalImages[index];
                                    final isSelected = _imageUrl == item.url;

                                    return InkWell(
                                      onTap: () {
                                        setState(() {
                                          _imageUrl = item.url;
                                          if (item.cleanName.isNotEmpty) {
                                            _nameController.text = item.cleanName;
                                          }
                                          if (item.cleanBrand.isNotEmpty) {
                                            _brandController.text = item.cleanBrand;
                                          }
                                          if (_categories.isNotEmpty && item.cleanName.isNotEmpty) {
                                            _autoMatchCategory(item.cleanName, _categories);
                                          }
                                        });
                                        Navigator.pop(ctx);
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          SnackBar(
                                            backgroundColor: AppTheme.accentGreen,
                                            content: Text(
                                              item.cleanName.isNotEmpty
                                                  ? '✅ Foto e Nome atualizados: ${item.cleanName}'
                                                  : '✅ Foto do produto selecionada!',
                                            ),
                                          ),
                                        );
                                      },
                                      borderRadius: BorderRadius.circular(12),
                                      child: Container(
                                        decoration: BoxDecoration(
                                          color: AppTheme.darkCard,
                                          borderRadius: BorderRadius.circular(12),
                                          border: Border.all(
                                            color: isSelected ? AppTheme.accentGreen : Colors.white12,
                                            width: isSelected ? 2.5 : 1,
                                          ),
                                        ),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.stretch,
                                          children: [
                                            Expanded(
                                              child: ClipRRect(
                                                borderRadius: const BorderRadius.vertical(top: Radius.circular(11)),
                                                child: CachedNetworkImage(
                                                  imageUrl: item.url,
                                                  fit: BoxFit.contain,
                                                  placeholder: (_, __) => const Center(child: CircularProgressIndicator(strokeWidth: 2)),
                                                  errorWidget: (_, __, ___) => const Icon(Icons.broken_image, color: Colors.white24),
                                                ),
                                              ),
                                            ),
                                            if (item.cleanName.isNotEmpty)
                                              Padding(
                                                padding: const EdgeInsets.all(8.0),
                                                child: Text(
                                                  item.cleanName,
                                                  maxLines: 2,
                                                  overflow: TextOverflow.ellipsis,
                                                  style: const TextStyle(fontSize: 11, color: Colors.white70, fontWeight: FontWeight.w500),
                                                ),
                                              ),
                                          ],
                                        ),
                                      ),
                                    );
                                  },
                                ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  Future<void> _publishProduct() async {
    String finalName = _nameController.text.trim();
    if (finalName.isEmpty) {
      if (_candidateImages.isNotEmpty && _candidateImages.first.cleanName.isNotEmpty) {
        finalName = _candidateImages.first.cleanName;
        _nameController.text = finalName;
      } else {
        finalName = widget.barcode.trim().isNotEmpty ? 'Produto ${widget.barcode}' : 'Novo Produto';
        _nameController.text = finalName;
      }
    }

    if (_selectedCategoryId == null) {
      if (_categories.isNotEmpty) {
        _selectedCategoryId = _categories.first.id;
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Selecione uma categoria')),
        );
        return;
      }
    }

    setState(() => _loading = true);

    final price = double.tryParse(_priceController.text.replaceAll(',', '.')) ?? 0.0;
    final stock = int.tryParse(_stockController.text) ?? 0;

    final barcodeToSave = widget.barcode.trim().isNotEmpty
        ? widget.barcode.trim()
        : (widget.initialData?.barcode.trim().isNotEmpty == true
            ? widget.initialData!.barcode.trim()
            : '');

    final result = await _supabaseService.createNewProduct(
      name: finalName,
      price: price,
      stock: stock,
      barcode: barcodeToSave,
      sku: _skuController.text.trim(),
      categoryId: _selectedCategoryId!,
      brand: _brandController.text.trim(),
      description: _descriptionController.text.trim(),
      imageUrl: _imageUrl,
    );

    setState(() => _loading = false);

    if (mounted) {
      if (result.success && result.product != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: AppTheme.accentGreen,
            content: Text('🎉 Produto Cadastrado e Publicado no Supabase com Sucesso!'),
          ),
        );
        Navigator.pop(context, result.product);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppTheme.accentRed,
            duration: const Duration(seconds: 4),
            content: Text('❌ Falha ao cadastrar: ${result.errorMessage ?? "Verifique os dados."}'),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Auto-Cadastro com IA'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Banner de Código de Barras Detectado
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppTheme.primary.withOpacity(0.15),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.primary.withOpacity(0.4)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.qr_code_scanner, color: AppTheme.primary, size: 28),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'CÓDIGO DE BARRAS NOVO DETECTADO',
                          style: TextStyle(color: AppTheme.primary, fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                        Text(
                          widget.barcode,
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 1.5),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 18),

            // Foto do Produto com Botão de Trocar / Buscar
            Center(
              child: Column(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: Container(
                      width: 160,
                      height: 160,
                      color: AppTheme.darkCard,
                      child: _imageUrl != null && _imageUrl!.isNotEmpty
                          ? CachedNetworkImage(
                              imageUrl: _imageUrl!,
                              fit: BoxFit.contain,
                              placeholder: (_, __) => const Center(child: CircularProgressIndicator()),
                              errorWidget: (context, url, error) => const Icon(Icons.broken_image, size: 40),
                            )
                          : const Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.image_search, color: Colors.white54, size: 44),
                                SizedBox(height: 6),
                                Text('Sem Foto', style: TextStyle(color: Colors.white54, fontSize: 12)),
                              ],
                            ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  // Botão Buscar Fotos na Web
                  ElevatedButton.icon(
                    onPressed: _searchingImages ? null : () => _searchImagesOnline(),
                    icon: _searchingImages
                        ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const Icon(Icons.image_search, size: 18),
                    label: Text(_searchingImages ? 'Buscando fotos...' : '🔍 Buscar Fotos do Produto na Web'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      textStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Nome do Produto
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Nome Oficial do Produto', style: TextStyle(fontWeight: FontWeight.bold)),
                if (_nameController.text.isNotEmpty)
                  GestureDetector(
                    onTap: () => _searchImagesOnline(customQuery: _nameController.text.trim()),
                    child: const Text(
                      '🔍 Buscar Fotos deste Nome',
                      style: TextStyle(color: AppTheme.primary, fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 6),
            TextField(
              controller: _nameController,
              style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w600),
              decoration: InputDecoration(
                hintText: 'Ex: Tinta Spray Preto Fosco 400ml',
                hintStyle: const TextStyle(color: Colors.white30, fontStyle: FontStyle.italic),
                filled: true,
                fillColor: AppTheme.darkSurface,
                suffixIcon: IconButton(
                  icon: const Icon(Icons.search, color: AppTheme.primary),
                  tooltip: 'Buscar fotos na web com este nome',
                  onPressed: () => _searchImagesOnline(customQuery: _nameController.text.trim()),
                ),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              ),
              onChanged: (val) {
                if (_categories.isNotEmpty) _autoMatchCategory(val, _categories);
              },
            ),

            // Chips com Sugestões de Nomes Encontrados na Web
            if (_candidateImages.any((it) => it.cleanName.isNotEmpty))
              Padding(
                padding: const EdgeInsets.only(top: 8.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Sugestões encontradas na web (toque para aplicar):',
                      style: TextStyle(color: AppTheme.textSecondary, fontSize: 11),
                    ),
                    const SizedBox(height: 4),
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: _candidateImages
                            .where((it) => it.cleanName.isNotEmpty)
                            .take(4)
                            .map((it) {
                          return Padding(
                            padding: const EdgeInsets.only(right: 8.0),
                            child: ActionChip(
                              backgroundColor: AppTheme.primary.withOpacity(0.15),
                              side: BorderSide(color: AppTheme.primary.withOpacity(0.4)),
                              avatar: const Icon(Icons.bolt, size: 16, color: AppTheme.primary),
                              label: Text(
                                it.cleanName,
                                style: const TextStyle(fontSize: 12, color: Colors.white),
                              ),
                              onPressed: () {
                                setState(() {
                                  _nameController.text = it.cleanName;
                                  if (it.cleanBrand.isNotEmpty) _brandController.text = it.cleanBrand;
                                  if (it.url.isNotEmpty && (_imageUrl == null || _imageUrl!.isEmpty)) {
                                    _imageUrl = it.url;
                                  }
                                  if (_categories.isNotEmpty) _autoMatchCategory(it.cleanName, _categories);
                                });
                              },
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                  ],
                ),
              ),

            const SizedBox(height: 16),

            // Marca e SKU
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Marca', style: TextStyle(fontWeight: FontWeight.bold)),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _brandController,
                        style: const TextStyle(color: Colors.white),
                        decoration: InputDecoration(
                          hintText: 'Ex: Mundial Prime, Tekbond',
                          hintStyle: const TextStyle(color: Colors.white30, fontStyle: FontStyle.italic),
                          filled: true,
                          fillColor: AppTheme.darkSurface,
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Código SKU', style: TextStyle(fontWeight: FontWeight.bold)),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _skuController,
                        style: const TextStyle(color: Colors.white),
                        decoration: InputDecoration(
                          filled: true,
                          fillColor: AppTheme.darkSurface,
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 16),

            // Preço e Saldo Inicial
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Preço de Venda (R\$)', style: TextStyle(fontWeight: FontWeight.bold)),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _priceController,
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                        decoration: InputDecoration(
                          filled: true,
                          fillColor: AppTheme.darkSurface,
                          prefixIcon: const Icon(Icons.attach_money, color: AppTheme.primary),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Estoque Inicial', style: TextStyle(fontWeight: FontWeight.bold)),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _stockController,
                        keyboardType: TextInputType.number,
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.accentGreen),
                        decoration: InputDecoration(
                          filled: true,
                          fillColor: AppTheme.darkSurface,
                          suffixText: 'un',
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 16),

            // Categoria no Supabase
            const Text('Categoria da Loja', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 6),
            _fetchingCategories
                ? const LinearProgressIndicator()
                : Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    decoration: BoxDecoration(
                      color: AppTheme.darkSurface,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: _selectedCategoryId,
                        isExpanded: true,
                        dropdownColor: AppTheme.darkSurface,
                        items: _categories.map((cat) {
                          return DropdownMenuItem(
                            value: cat.id,
                            child: Text(cat.name),
                          );
                        }).toList(),
                        onChanged: (val) {
                          if (val != null) setState(() => _selectedCategoryId = val);
                        },
                      ),
                    ),
                  ),

            const SizedBox(height: 28),

            // Botão Cadastrar e Publicar
            SizedBox(
              width: double.infinity,
              height: 54,
              child: ElevatedButton.icon(
                onPressed: _loading ? null : _publishProduct,
                icon: _loading
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Icon(Icons.rocket_launch),
                label: Text(
                  _loading ? 'Publicando no Supabase...' : 'Cadastrar e Publicar no Site',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.accentGreen,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
