import 'dart:convert';
import 'package:http/http.dart' as http;
import '../utils/text_normalizer.dart';

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
  final List<WebImageItem> candidateImages;

  AutoEnrichedProductData({
    required this.name,
    required this.brand,
    this.description,
    this.categorySuggestion,
    this.imageUrl,
    required this.barcode,
    this.candidateImages = const [],
  });
}

class BarcodeLookupService {
  static const String _userAgent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

  static final List<String> _knownBrands = [
    'Mundial Prime',
    'Tekbond',
    'ChemiColor',
    'Chemicolor',
    'Colorart',
    'Radcolor',
    'Baston',
    'Quartzolit',
    'Vedacit',
    'Votoran',
    'Votorantim',
    'Coral',
    'Suvinil',
    'Sherwin Williams',
    'Lukscolor',
    'Tigre',
    'Amanco',
    'Fortlev',
    'Lorenzetti',
    'Tramontina',
    'Starrett',
    'Norton',
    'Bosch',
    'Makita',
    'DeWalt',
    'Irwin',
    'Gerdau',
    'Sil',
    'Cobrecom',
    'Fame',
    'Schneider',
    'Alumbra',
    'Pial Legrand',
    'Legrand',
    'Docol',
    'Deca',
    'Celite',
    'Incepa',
    'Portobello',
    'Eliane',
    'Stihl',
    '3M',
    'WD-40',
    'Loctite',
    'Super Bonder',
    'Sika',
    'Viapol',
    'Otto Baumgart',
    'Brasilit',
    'Eternit',
    'Krona',
    'Plastilit',
    'Atlas',
    'Condor',
    'Pacetta',
    'Vonder',
    'Sparta',
    'MTX',
  ];

  static final List<String> _irrelevantKeywords = [
    'locao',
    'loção',
    'hidratante',
    'proctermilk',
    'cosmetico',
    'cosmético',
    'shampoo',
    'condicionador',
    'batom',
    'esmalte',
    'farmacia',
    'farmácia',
    'drogaria',
    'medicamento',
    'remedio',
    'remédio',
    'fralda',
    'perfumaria',
    'suplemento',
  ];

  /// Limpa título extraído de buscas na web
  static Map<String, String> cleanTitleAndBrand(String raw) {
    if (raw.trim().isEmpty) return {'name': '', 'brand': ''};

    String clean = raw
        .replaceAll('&quot;', '"')
        .replaceAll('&amp;', '&')
        .replaceAll('&#39;', "'")
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>')
        .replaceAll('&#x27;', "'")
        .replaceAll(RegExp(r'-\s*GTIN/EAN/UPC.*$', caseSensitive: false), '')
        .replaceAll(RegExp(r'\s*-\s*(Mercado Livre|Shopee|Magazine Luiza|Amazon|Carrefour|ConstruFIO|Elgro|Leroy Merlin|C&C|Telhanorte|Loja do Mecânico|Cobasi|Petz|Drogasil|Droga Raia|Pague Menos|VFarma3|Preço Popular).*$', caseSensitive: false), '')
        .replaceAll(RegExp(r'\s*\|\s*.*$'), '')
        .replaceAll(RegExp(r'\.\.\.$'), '')
        .trim();

    String foundBrand = '';
    for (final b in _knownBrands) {
      if (RegExp('\\b${RegExp.escape(b)}\\b', caseSensitive: false).hasMatch(clean)) {
        foundBrand = b;
        break;
      }
    }

    final normalizedName = TextNormalizer.normalizeProductName(clean);
    final normalizedBrand = foundBrand.isNotEmpty ? TextNormalizer.normalizeBrand(foundBrand) : '';

    return {
      'name': normalizedName,
      'brand': normalizedBrand,
    };
  }

  /// Verifica se um resultado de imagem é relevante ou se é um falso positivo de farmácia/cosméticos
  static bool isResultRelevant(String title, String url, {bool isNumericQuery = false}) {
    final lowerTitle = title.toLowerCase();
    final lowerUrl = url.toLowerCase();

    // Se a busca era por código numérico bruto e retornou cosméticos/farmácia, descarta!
    if (isNumericQuery) {
      for (final bad in _irrelevantKeywords) {
        if (lowerTitle.contains(bad) || lowerUrl.contains(bad)) {
          return false;
        }
      }
    }

    return true;
  }

  /// Consulta bases públicas e web para descobrir nome, marca e foto pelo código EAN
  Future<AutoEnrichedProductData?> lookupBarcode(String barcode) async {
    final cleanBarcode = barcode.trim();
    final isNumeric = RegExp(r'^\d+$').hasMatch(cleanBarcode);

    // 1. Tenta consulta no Open Food Facts / Open Products
    try {
      final url = Uri.parse('https://world.openfoodfacts.org/api/v2/product/$cleanBarcode.json');
      final response = await http.get(url).timeout(const Duration(seconds: 3));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['status'] == 1 && data['product'] != null) {
          final p = data['product'];
          final name = p['product_name_pt'] ?? p['product_name'] ?? '';
          final brand = p['brands'] ?? '';
          final imageUrl = p['image_front_url'] ?? p['image_url'];

          if (name.isNotEmpty) {
            final images = await searchProductImagesWithDetails('$name $brand'.trim());
            return AutoEnrichedProductData(
              name: name,
              brand: brand,
              description: p['generic_name_pt'] ?? p['generic_name'] ?? name,
              imageUrl: imageUrl ?? (images.isNotEmpty ? images.first.url : null),
              candidateImages: images,
              barcode: cleanBarcode,
            );
          }
        }
      }
    } catch (_) {}

    // 2. Busca na Web pelo próprio EAN com validação de relevância
    try {
      final webImages = await searchProductImagesWithDetails(cleanBarcode, isNumericBarcodeQuery: isNumeric);
      
      // Filtra apenas itens relevantes (sem falsos positivos)
      final validItems = webImages.where((it) => isResultRelevant(it.title, it.url, isNumericQuery: isNumeric)).toList();

      if (validItems.isNotEmpty) {
        final bestItem = validItems.first;

        return AutoEnrichedProductData(
          name: bestItem.cleanName.isNotEmpty ? bestItem.cleanName : '',
          brand: bestItem.cleanBrand,
          description: 'Produto auto-identificado via código $cleanBarcode.',
          imageUrl: bestItem.url,
          candidateImages: validItems,
          barcode: cleanBarcode,
        );
      }
    } catch (_) {}

    // 3. Fallback Padrão Limpo (Não insere dados errados de terceiros)
    return AutoEnrichedProductData(
      name: '',
      brand: '',
      description: '',
      imageUrl: null,
      candidateImages: [],
      barcode: cleanBarcode,
    );
  }

  /// Busca múltiplas fotos e títulos do produto na web por EAN, Nome ou Marca
  Future<List<WebImageItem>> searchProductImagesWithDetails(
    String query, {
    int limit = 24,
    bool isNumericBarcodeQuery = false,
  }) async {
    if (query.trim().isEmpty) return [];

    try {
      final cleanQuery = query.replaceAll(RegExp(r'[*#_\\/]'), ' ').trim();
      final url = Uri.parse(
        'https://www.bing.com/images/search?q=${Uri.encodeComponent(cleanQuery)}&form=HDRSC2&first=1',
      );

      final response = await http.get(
        url,
        headers: {
          'User-Agent': _userAgent,
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        },
      ).timeout(const Duration(seconds: 6));

      if (response.statusCode == 200) {
        final html = response.body;
        final regex = RegExp(r'murl&quot;:&quot;(https?://[^&"]+)&quot;.*?&quot;t&quot;:&quot;([^&"]+)&quot;');
        final matches = regex.allMatches(html);

        final List<WebImageItem> results = [];
        final seenUrls = <String>{};

        for (final match in matches) {
          final imgUrl = match.group(1);
          final rawTitle = match.group(2) ?? '';

          if (imgUrl != null && !seenUrls.contains(imgUrl)) {
            final lower = imgUrl.toLowerCase();
            if (!lower.contains('.svg') &&
                !lower.contains('favicon') &&
                !lower.contains('tracking') &&
                !lower.contains('pixel')) {
              
              if (!isResultRelevant(rawTitle, imgUrl, isNumericQuery: isNumericBarcodeQuery)) {
                continue;
              }

              seenUrls.add(imgUrl);
              final parsed = cleanTitleAndBrand(rawTitle);

              results.add(WebImageItem(
                url: imgUrl,
                title: rawTitle,
                cleanName: parsed['name'] ?? '',
                cleanBrand: parsed['brand'] ?? '',
              ));
            }
          }
          if (results.length >= limit) break;
        }

        return results;
      }
    } catch (e) {
      print('Erro ao buscar imagens na web: $e');
    }

    return [];
  }

  /// Busca produtos na internet por nome ou descrição para cadastro automático
  Future<List<AutoEnrichedProductData>> searchWebProducts(String query, {int limit = 15}) async {
    final clean = query.trim();
    if (clean.isEmpty) return [];

    try {
      final webImages = await searchProductImagesWithDetails(
        clean,
        limit: 24,
        isNumericBarcodeQuery: false,
      );

      final List<AutoEnrichedProductData> candidates = [];
      final seenTitles = <String>{};

      for (final item in webImages) {
        final title = item.cleanName.isNotEmpty ? item.cleanName : item.title;
        final simpleKey = title.toLowerCase().replaceAll(RegExp(r'\s+'), '');

        if (simpleKey.isEmpty || seenTitles.contains(simpleKey)) continue;
        seenTitles.add(simpleKey);

        // Tenta detectar EAN de 13 dígitos no título
        String extractedBarcode = '';
        final eanMatch = RegExp(r'\b(789\d{10}|\d{13})\b').firstMatch(item.title);
        if (eanMatch != null) {
          extractedBarcode = eanMatch.group(1) ?? '';
        }

        candidates.add(AutoEnrichedProductData(
          name: title,
          brand: item.cleanBrand,
          description: 'Produto localizado na web: $title.',
          imageUrl: item.url,
          candidateImages: [item],
          barcode: extractedBarcode,
        ));

        if (candidates.length >= limit) break;
      }

      return candidates;
    } catch (e) {
      print('Erro ao buscar produtos na web para cadastro: $e');
      return [];
    }
  }
}
