import 'dart:convert';
import 'package:http/http.dart' as http;

class WebImageItem {
  final String url;
  final String title;
  final String cleanName;
  final String cleanBrand;

  WebImageItem({
    required this.url,
    this.title = '',
    this.cleanName = '',
    this.cleanBrand = '',
  });
}

class AutoEnrichedProductData {
  final String name;
  final String brand;
  final String? description;
  final String? categorySuggestion;
  final String? imageUrl;
  final String barcode;
  final double? price;
  final double? listPrice;
  final String? store;
  final List<WebImageItem> candidateImages;

  AutoEnrichedProductData({
    required this.name,
    required this.brand,
    this.description,
    this.categorySuggestion,
    this.imageUrl,
    required this.barcode,
    this.price,
    this.listPrice,
    this.store,
    this.candidateImages = const [],
  });
}

class BarcodeLookupService {
  static const String _userAgent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

  static final Map<String, String> _headers = {
    'User-Agent': _userAgent,
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
  };

  /// Decodifica entidades HTML básicas
  static String _decodeHtml(String str) {
    if (str.isEmpty) return '';
    return str
        .replaceAll('&quot;', '"')
        .replaceAll('&amp;', '&')
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>')
        .replaceAll('&#39;', "'")
        .replaceAll(RegExp(r'&ccedil;', caseSensitive: false), 'ç')
        .replaceAll(RegExp(r'&atilde;', caseSensitive: false), 'ã')
        .replaceAll(RegExp(r'&otilde;', caseSensitive: false), 'õ')
        .replaceAll(RegExp(r'&eacute;', caseSensitive: false), 'é')
        .replaceAll(RegExp(r'&aacute;', caseSensitive: false), 'á')
        .replaceAll(RegExp(r'&iacute;', caseSensitive: false), 'í')
        .replaceAll(RegExp(r'&oacute;', caseSensitive: false), 'ó')
        .replaceAll(RegExp(r'&uacute;', caseSensitive: false), 'ú')
        .replaceAll(RegExp(r'&acirc;', caseSensitive: false), 'â')
        .replaceAll(RegExp(r'&ecirc;', caseSensitive: false), 'ê')
        .replaceAll(RegExp(r'&ocirc;', caseSensitive: false), 'ô')
        .replaceAll('&mdash;', '—')
        .replaceAll('&ndash;', '–');
  }

  /// Limpa menções de concorrentes nos nomes dos produtos
  static String cleanProductName(String raw) {
    if (raw.trim().isEmpty) return '';
    return raw
        .replaceAll(RegExp(r'\|\s*Normatel', caseSensitive: false), '')
        .replaceAll(RegExp(r'\|\s*Acal', caseSensitive: false), '')
        .replaceAll(RegExp(r'\|\s*Carajás', caseSensitive: false), '')
        .replaceAll(RegExp(r'\|\s*Leroy Merlin', caseSensitive: false), '')
        .replaceAll(RegExp(r'\|\s*JC Materiais', caseSensitive: false), '')
        .replaceAll(RegExp(r'Exclusivo\s+(Acal|Normatel|Carajás|Leroy\s*Merlin|JC\s*Materiais)', caseSensitive: false), '')
        .replaceAll(RegExp(r'\s+'), ' ')
        .trim();
  }

  /// Busca produtos diretamente na JC Materiais de Construção (Nuvemshop)
  Future<List<AutoEnrichedProductData>> _searchJCMateriais(String query) async {
    try {
      final url = Uri.parse(
        'https://www.jcmateriais.com.br/search/?q=${Uri.encodeComponent(query)}',
      );
      final headers = Map<String, String>.from(_headers)
        ..['Accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8';
      
      final response = await http.get(url, headers: headers).timeout(const Duration(seconds: 6));

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final html = response.body;
        final List<AutoEnrichedProductData> list = [];
        
        final jsonLdRegex = RegExp(
          r"""<script\s+type=["']application\/ld\+json["']\s+data-component=['"]structured-data\.item['"]>([\s\S]*?)<\/script>""",
          caseSensitive: false,
        );

        final matches = jsonLdRegex.allMatches(html);
        for (final match in matches) {
          try {
            final jsonText = match.group(1)?.trim();
            if (jsonText == null || jsonText.isEmpty) continue;
            
            final Map<String, dynamic> item = json.decode(jsonText);
            if (item['@type'] == 'Product') {
              final offer = item['offers'] is Map<String, dynamic> ? item['offers'] as Map<String, dynamic> : {};
              
              String brand = 'JC Materiais';
              if (item['brand'] is Map<String, dynamic>) {
                brand = item['brand']['name'] ?? 'JC Materiais';
              } else if (item['brand'] is String) {
                brand = item['brand'];
              }

              final rawPrice = offer['price'];
              double price = 0.0;
              if (rawPrice is num) {
                price = rawPrice.toDouble();
              } else if (rawPrice is String) {
                price = double.tryParse(rawPrice) ?? 0.0;
              }

              final rawName = item['name'] ?? '';
              final cleanName = cleanProductName(_decodeHtml(rawName));
              final desc = _decodeHtml(item['description'] ?? '');

              String? imgUrl;
              if (item['image'] is List && (item['image'] as List).isNotEmpty) {
                imgUrl = (item['image'] as List).first.toString();
              } else if (item['image'] is String) {
                imgUrl = item['image'];
              }

              if (imgUrl != null && imgUrl.startsWith('//')) {
                imgUrl = 'https:$imgUrl';
              }

              final sku = item['sku']?.toString() ?? '';

              if (cleanName.isNotEmpty && price > 0) {
                final imgList = imgUrl != null && imgUrl.isNotEmpty
                    ? [
                        WebImageItem(
                          url: imgUrl,
                          title: cleanName,
                          cleanName: cleanName,
                          cleanBrand: brand,
                        )
                      ]
                    : <WebImageItem>[];

                list.add(AutoEnrichedProductData(
                  name: cleanName,
                  brand: brand,
                  barcode: sku,
                  description: desc.isNotEmpty ? desc : 'Produto $cleanName de alta qualidade ($brand).',
                  imageUrl: imgUrl,
                  price: price,
                  listPrice: price,
                  store: 'JC Materiais',
                  candidateImages: imgList,
                ));
              }
            }
          } catch (_) {}
        }

        return list;
      }
    } catch (_) {}
    return [];
  }

  /// Busca produtos diretamente na Carajás Home Center (API VTEX)
  Future<List<AutoEnrichedProductData>> _searchCarajas(String query) async {
    try {
      // 1. Intelligent Search
      try {
        final isUrl = Uri.parse('https://www.carajas.com.br/api/io/_v/api/intelligent-search/product_search/?query=${Uri.encodeComponent(query)}');
        final response = await http.get(isUrl, headers: _headers).timeout(const Duration(seconds: 5));
        if (response.statusCode >= 200 && response.statusCode < 300) {
          final Map<String, dynamic> jsonBody = json.decode(response.body);
          final List<dynamic> prods = jsonBody['products'] ?? [];
          if (prods.isNotEmpty) {
            return _parseVtexJsonList(prods, 'Carajás');
          }
        }
      } catch (_) {}

      // 2. Catalog System
      final url = Uri.parse(
        'https://carajas.vtexcommercestable.com.br/api/catalog_system/pub/products/search?ft=${Uri.encodeComponent(query)}',
      );
      final headers = Map<String, String>.from(_headers)
        ..['Referer'] = 'https://www.carajas.com.br/';
      final response = await http.get(url, headers: headers).timeout(const Duration(seconds: 5));

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final List<dynamic> data = json.decode(response.body);
        return _parseVtexJsonList(data, 'Carajás');
      }
    } catch (_) {}
    return [];
  }

  /// Busca produtos diretamente na Acal Home Center (API VTEX)
  Future<List<AutoEnrichedProductData>> _searchAcal(String query) async {
    try {
      final url = Uri.parse(
        'https://www.acalhomecenter.com.br/api/catalog_system/pub/products/search?ft=${Uri.encodeComponent(query)}',
      );
      final headers = Map<String, String>.from(_headers)
        ..['Referer'] = 'https://www.acalhomecenter.com.br/';
      final response = await http.get(url, headers: headers).timeout(const Duration(seconds: 5));

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final List<dynamic> data = json.decode(response.body);
        return _parseVtexJsonList(data, 'Acal');
      }
    } catch (_) {}
    return [];
  }

  /// Busca produtos diretamente na Telhanorte (API VTEX)
  Future<List<AutoEnrichedProductData>> _searchTelhanorte(String query) async {
    try {
      final url = Uri.parse(
        'https://www.telhanorte.com.br/api/catalog_system/pub/products/search?ft=${Uri.encodeComponent(query)}',
      );
      final headers = Map<String, String>.from(_headers)
        ..['Referer'] = 'https://www.telhanorte.com.br/';
      final response = await http.get(url, headers: headers).timeout(const Duration(seconds: 5));

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final List<dynamic> data = json.decode(response.body);
        return _parseVtexJsonList(data, 'Telhanorte');
      }
    } catch (_) {}
    return [];
  }

  /// Busca produtos diretamente na Obramax (API VTEX Intelligent Search)
  Future<List<AutoEnrichedProductData>> _searchObramax(String query) async {
    try {
      // 1. Intelligent Search para sinônimos
      try {
        final isUrl = Uri.parse('https://www.obramax.com.br/api/io/_v/api/intelligent-search/product_search/?query=${Uri.encodeComponent(query)}');
        final response = await http.get(isUrl, headers: _headers).timeout(const Duration(seconds: 5));
        if (response.statusCode >= 200 && response.statusCode < 300) {
          final Map<String, dynamic> jsonBody = json.decode(response.body);
          final List<dynamic> prods = jsonBody['products'] ?? [];
          if (prods.isNotEmpty) {
            return _parseVtexJsonList(prods, 'Obramax');
          }
        }
      } catch (_) {}

      // 2. Catalog Fallback
      final url = Uri.parse(
        'https://www.obramax.com.br/api/catalog_system/pub/products/search?ft=${Uri.encodeComponent(query)}',
      );
      final headers = Map<String, String>.from(_headers)
        ..['Referer'] = 'https://www.obramax.com.br/';
      final response = await http.get(url, headers: headers).timeout(const Duration(seconds: 5));

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final List<dynamic> data = json.decode(response.body);
        return _parseVtexJsonList(data, 'Obramax');
      }
    } catch (_) {}
    return [];
  }

  /// Converte JSON padrão VTEX em AutoEnrichedProductData
  List<AutoEnrichedProductData> _parseVtexJsonList(List<dynamic> data, String storeName) {
    final List<AutoEnrichedProductData> list = [];
    for (final item in data) {
      final items = item['items'] as List<dynamic>? ?? [];
      final firstSku = items.isNotEmpty ? items[0] : {};
      final sellers = firstSku['sellers'] as List<dynamic>? ?? [];
      final commOffer = sellers.isNotEmpty ? sellers[0]['commertialOffer'] ?? {} : {};
      final images = firstSku['images'] as List<dynamic>? ?? [];
      final imgUrl = images.isNotEmpty ? images[0]['imageUrl'] : null;

      final rawName = item['productName'] ?? item['name'] ?? '';
      final cleanName = cleanProductName(rawName);
      final price = (commOffer['Price'] as num?)?.toDouble() ?? 0.0;
      final listPrice = (commOffer['ListPrice'] as num?)?.toDouble() ?? price;
      final ean = firstSku['ean'] ?? item['productReference'] ?? '';
      final brand = item['brand'] ?? storeName;
      final desc = item['description'] ?? '';

      if (cleanName.isNotEmpty) {
        final imgList = images
            .map((im) => WebImageItem(
                  url: im['imageUrl'] ?? '',
                  title: cleanName,
                  cleanName: cleanName,
                  cleanBrand: brand,
                ))
            .where((im) => im.url.isNotEmpty)
            .toList();

        list.add(AutoEnrichedProductData(
          name: cleanName,
          brand: brand,
          barcode: ean,
          description: desc.isNotEmpty ? desc : 'Produto $cleanName de alta qualidade ($brand).',
          imageUrl: imgUrl,
          price: price,
          listPrice: listPrice,
          store: storeName,
          candidateImages: imgList,
        ));
      }
    }
    return list;
  }

  /// Consulta por código de barras EAN nos Home Centers
  Future<AutoEnrichedProductData?> lookupBarcode(String barcode) async {
    final cleanBarcode = barcode.trim();
    if (cleanBarcode.isEmpty) return null;

    // Busca simultânea nos grandes Home Centers e JC Materiais
    final results = await Future.wait([
      _searchJCMateriais(cleanBarcode),
      _searchCarajas(cleanBarcode),
      _searchAcal(cleanBarcode),
      _searchTelhanorte(cleanBarcode),
      _searchObramax(cleanBarcode),
    ]);

    final all = [...results[0], ...results[1], ...results[2], ...results[3], ...results[4]];

    // 1. Tenta match exato por código EAN
    for (final prod in all) {
      if (prod.barcode == cleanBarcode && prod.name.isNotEmpty) {
        return prod;
      }
    }

    // 2. Se retornou resultado mesmo com EAN diferente, utiliza o primeiro de referência
    if (all.isNotEmpty) {
      final first = all.first;
      return AutoEnrichedProductData(
        name: first.name,
        brand: first.brand,
        description: first.description,
        imageUrl: first.imageUrl,
        barcode: cleanBarcode, // Mantém o código lido no scanner
        price: first.price,
        listPrice: first.listPrice,
        store: first.store,
        candidateImages: first.candidateImages,
      );
    }

    // 3. Fallback limpo (sem inventar itens de farmácia/cosméticos)
    return AutoEnrichedProductData(
      name: '',
      brand: '',
      description: '',
      imageUrl: null,
      candidateImages: [],
      barcode: cleanBarcode,
    );
  }

  /// Busca produtos nos Home Centers por nome, termo ou marca
  Future<List<AutoEnrichedProductData>> searchWebProducts(String query, {int limit = 30}) async {
    final clean = query.trim();
    if (clean.isEmpty) return [];

    final results = await Future.wait([
      _searchJCMateriais(clean),
      _searchCarajas(clean),
      _searchAcal(clean),
      _searchTelhanorte(clean),
      _searchObramax(clean),
    ]);

    final all = [...results[0], ...results[1], ...results[2], ...results[3], ...results[4]];
    
    // Remove duplicidades por nome
    final List<AutoEnrichedProductData> uniqueList = [];
    final Set<String> seenNames = {};

    for (final p in all) {
      final key = p.name.toLowerCase().replaceAll(RegExp(r'\s+'), '');
      if (!seenNames.contains(key)) {
        seenNames.add(key);
        uniqueList.add(p);
      }
      if (uniqueList.length >= limit) break;
    }

    return uniqueList;
  }

  /// Retorna lista de imagens de referência dos Home Centers
  Future<List<WebImageItem>> searchProductImagesWithDetails(
    String query, {
    int limit = 24,
    bool isNumericBarcodeQuery = false,
  }) async {
    final prods = await searchWebProducts(query, limit: limit);
    final List<WebImageItem> images = [];

    for (final p in prods) {
      if (p.imageUrl != null && p.imageUrl!.isNotEmpty) {
        images.add(WebImageItem(
          url: p.imageUrl!,
          title: p.name,
          cleanName: p.name,
          cleanBrand: p.brand,
        ));
      }
      images.addAll(p.candidateImages);
    }

    return images;
  }
}
