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

  /// Limpa menções de concorrentes nos nomes dos produtos
  static String cleanProductName(String raw) {
    if (raw.trim().isEmpty) return '';
    return raw
        .replaceAll(RegExp(r'\|\s*Normatel', caseSensitive: false), '')
        .replaceAll(RegExp(r'\|\s*Acal', caseSensitive: false), '')
        .replaceAll(RegExp(r'\|\s*Carajás', caseSensitive: false), '')
        .replaceAll(RegExp(r'\|\s*Leroy Merlin', caseSensitive: false), '')
        .replaceAll(RegExp(r'Exclusivo\s+(Acal|Normatel|Carajás|Leroy\s*Merlin)', caseSensitive: false), '')
        .replaceAll(RegExp(r'\s+'), ' ')
        .trim();
  }

  /// Busca produtos diretamente na Carajás Home Center (API VTEX)
  Future<List<AutoEnrichedProductData>> _searchCarajas(String query) async {
    try {
      final url = Uri.parse(
        'https://www.carajas.com.br/api/catalog_system/pub/products/search?ft=${Uri.encodeComponent(query)}&_from=0&_to=15',
      );
      final headers = Map<String, String>.from(_headers)
        ..['Referer'] = 'https://www.carajas.com.br/';
      final response = await http.get(url, headers: headers).timeout(const Duration(seconds: 6));

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final List<dynamic> data = json.decode(response.body);
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
          final brand = item['brand'] ?? 'Carajás';
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
              store: 'Carajás',
              candidateImages: imgList,
            ));
          }
        }
        return list;
      }
    } catch (e) {
      // Ignora erro silenciosamente
    }
    return [];
  }

  /// Busca produtos diretamente na Acal Home Center (API VTEX)
  Future<List<AutoEnrichedProductData>> _searchAcal(String query) async {
    try {
      final url = Uri.parse(
        'https://www.acalhomecenter.com.br/api/catalog_system/pub/products/search?ft=${Uri.encodeComponent(query)}&_from=0&_to=15',
      );
      final headers = Map<String, String>.from(_headers)
        ..['Referer'] = 'https://www.acalhomecenter.com.br/';
      final response = await http.get(url, headers: headers).timeout(const Duration(seconds: 6));

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final List<dynamic> data = json.decode(response.body);
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
          final brand = item['brand'] ?? 'Acal';
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
              store: 'Acal',
              candidateImages: imgList,
            ));
          }
        }
        return list;
      }
    } catch (e) {
      // Ignora erro silenciosamente
    }
    return [];
  }

  /// Busca produtos diretamente na Normatel Home Center
  Future<List<AutoEnrichedProductData>> _searchNormatel(String query) async {
    try {
      final url = Uri.parse('https://www.normatel.com.br/busca?termo=${Uri.encodeComponent(query)}');
      final headers = Map<String, String>.from(_headers)
        ..['Referer'] = 'https://www.normatel.com.br/';
      final response = await http.get(url, headers: headers).timeout(const Duration(seconds: 6));

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final html = response.body;
        final imgRegex = RegExp(r'https://normatel\.fbitsstatic\.net/img/p/([a-z0-9-]+)/(\d+)-1\.jpg[^\s"\x27]*', caseSensitive: false);
        final matches = imgRegex.allMatches(html);

        final List<AutoEnrichedProductData> list = [];
        final Set<String> seen = {};

        for (final m in matches) {
          final slug = m.group(1) ?? '';
          final fullImg = '${m.group(0)?.split('?').first}?w=500&h=500';
          if (slug.isEmpty || seen.contains(slug)) continue;
          seen.add(slug);

          final cleanName = cleanProductName(
            slug.replaceAll(RegExp(r'-\d+$'), '').split('-').map((w) => w.isNotEmpty ? '${w[0].toUpperCase()}${w.substring(1)}' : '').join(' ')
          );

          final imgPos = m.start;
          final chunkEnd = (imgPos + 1500) < html.length ? (imgPos + 1500) : html.length;
          final chunk = html.substring(imgPos, chunkEnd);
          final priceMatch = RegExp(r'data-price=([\d\.]+)').firstMatch(chunk) ?? RegExp(r'R\$\s*([\d\.,]+)').firstMatch(chunk);
          double price = 49.9;
          if (priceMatch != null) {
            final rawPrice = priceMatch.group(1)!.replaceAll('.', '').replaceAll(',', '.');
            price = double.tryParse(rawPrice) ?? 49.9;
          }

          if (cleanName.isNotEmpty) {
            list.add(AutoEnrichedProductData(
              name: cleanName,
              brand: 'Normatel',
              barcode: '',
              description: 'Produto $cleanName disponível na Normatel Home Center.',
              imageUrl: fullImg,
              price: price,
              listPrice: price * 1.15,
              store: 'Normatel',
              candidateImages: [
                WebImageItem(
                  url: fullImg,
                  title: cleanName,
                  cleanName: cleanName,
                  cleanBrand: 'Normatel',
                ),
              ],
            ));
          }
          if (list.length >= 15) break;
        }
        return list;
      }
    } catch (_) {}
    return [];
  }

  /// Consulta por código de barras EAN nos Home Centers
  Future<AutoEnrichedProductData?> lookupBarcode(String barcode) async {
    final cleanBarcode = barcode.trim();
    if (cleanBarcode.isEmpty) return null;

    // Busca simultânea nos grandes Home Centers
    final results = await Future.wait([
      _searchCarajas(cleanBarcode),
      _searchAcal(cleanBarcode),
    ]);

    final all = [...results[0], ...results[1]];

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
      _searchCarajas(clean),
      _searchAcal(clean),
      _searchNormatel(clean),
    ]);

    final all = [...results[0], ...results[1], ...results[2]];
    
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
