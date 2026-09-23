/// Utilitário de normalização de texto para o app Flutter Hub Scanner.
/// Converte nomes para Title Case Inteligente, descrições para Sentence Case e ajusta Marcas e Siglas.

class TextNormalizer {
  static const Set<String> _prepositions = {
    'de', 'da', 'do', 'das', 'dos', 'e', 'em', 'para', 'com', 'sem', 'por',
    'a', 'o', 'as', 'os', 'um', 'uma', 'na', 'no', 'nas', 'nos', 'sob', 'sobre',
    'ao', 'aos', 'à', 'às', 'c/', 's/', 'p/'
  };

  static const Set<String> _acronyms = {
    'PVC', 'PPR', 'CPVC', 'EPI', 'LED', 'HDTV', 'UHF', 'VHF', 'TPI', 'HP',
    'CV', 'BTU', 'BTUS', 'BIVOLT', 'NBR', 'ABNT', 'EAN', 'SKU', 'MDF', 'MDP',
    'PU', 'MS', 'UV', 'EPDM', 'ABS', 'SDR', 'DN', 'PN', 'SCH', 'DWT', '3M',
    'CSN', 'RGB', 'AC', 'DC', 'USB', 'IP65', 'IP66', 'IP67', 'IP68', 'GLP', 'GN'
  };

  static const Map<String, String> _knownBrands = {
    'starrett': 'Starrett',
    'votoran': 'Votoran',
    'tigre': 'Tigre',
    'amanco': 'Amanco',
    'krona': 'Krona',
    'tramontina': 'Tramontina',
    'vonder': 'Vonder',
    'dewalt': 'DeWalt',
    'bosch': 'Bosch',
    'makita': 'Makita',
    'stanley': 'Stanley',
    'irwin': 'Irwin',
    'gedore': 'Gedore',
    'coral': 'Coral',
    'suvinil': 'Suvinil',
    'quartzolit': 'Quartzolit',
    'fortlev': 'Fortlev',
    'deca': 'Deca',
    'docol': 'Docol',
    'lorenzetti': 'Lorenzetti',
    'guerda': 'Gerdau',
    'gerdau': 'Gerdau',
    'belgo': 'Belgo',
    '3m': '3M',
  };

  /// Normaliza o nome do produto para Title Case inteligente
  static String normalizeProductName(String? name) {
    if (name == null || name.trim().isEmpty) return '';

    final clean = name.trim().replaceAll(RegExp(r'\s+'), ' ');
    final words = clean.split(' ');

    final normalized = words.asMap().entries.map((entry) {
      final index = entry.key;
      final rawWord = entry.value;

      final match = RegExp(r'^([^a-zA-Z0-9À-ÿ]*)([a-zA-Z0-9À-ÿ/".-]+)([^a-zA-Z0-9À-ÿ]*)$').firstMatch(rawWord);
      if (match == null) return rawWord;

      final prefix = match.group(1) ?? '';
      final word = match.group(2) ?? '';
      final suffix = match.group(3) ?? '';
      final wordUpper = word.toUpperCase();
      final wordLower = word.toLowerCase();

      // 1. Siglas
      if (_acronyms.contains(wordUpper)) {
        return '$prefix$wordUpper$suffix';
      }

      // 2. Marcas
      if (_knownBrands.containsKey(wordLower)) {
        return '$prefix${_knownBrands[wordLower]}$suffix';
      }

      // 3. Padrão de medidas / voltagem / potência
      if (RegExp(r'^\d+(?:[.,]\d+)?(?:kg|g|mg|l|ml|m|cm|mm|m2|m3|pol|"|v|w|a|kva|kwh|cv|hp|un|pcs|pc)$', caseSensitive: false).hasMatch(word)) {
        final adjusted = word.replaceAllMapped(
          RegExp(r'(v|w|a|kva|kwh|cv|hp)$', caseSensitive: false),
          (m) => m.group(0)!.toUpperCase(),
        );
        return '$prefix$adjusted$suffix';
      }

      // 4. Frações de polegada (1/2, 3/4)
      if (RegExp(r'^\d*(?:\.\d+)?\/\d+(?:"|pol)?$', caseSensitive: false).hasMatch(word)) {
        return '$prefix$word$suffix';
      }

      // 5. Palavras com hífen
      if (word.contains('-')) {
        final parts = word.split('-');
        final formattedParts = parts.map((part) {
          final pUpper = part.toUpperCase();
          if (_acronyms.contains(pUpper)) return pUpper;
          if (part.isEmpty) return part;
          return '${part[0].toUpperCase()}${part.substring(1).toLowerCase()}';
        });
        return '$prefix${formattedParts.join('-')}$suffix';
      }

      // 6. Preposições
      if (index > 0 && _prepositions.contains(wordLower)) {
        return '$prefix$wordLower$suffix';
      }

      // 7. Palavra regular
      if (word.isEmpty) return prefix + suffix;
      return '$prefix${word[0].toUpperCase()}${word.substring(1).toLowerCase()}$suffix';
    }).toList();

    return normalized.join(' ');
  }

  /// Normaliza a descrição para Sentence Case
  static String normalizeDescription(String? description) {
    if (description == null || description.trim().isEmpty) return '';

    final trimmed = description.trim();
    final isAllCaps = trimmed == trimmed.toUpperCase() && RegExp(r'[A-Z]').hasMatch(trimmed);
    final isAllLower = trimmed == trimmed.toLowerCase() && RegExp(r'[a-z]').hasMatch(trimmed);

    if (!isAllCaps && !isAllLower) {
      return trimmed;
    }

    final lines = trimmed.split('\n');
    final normalizedLines = lines.map((line) {
      final lineTrimmed = line.trim();
      if (lineTrimmed.isEmpty) return '';

      var formatted = lineTrimmed.toLowerCase().replaceAllMapped(
        RegExp(r'(^\s*|[.!?]\s+)([a-zà-ÿ])'),
        (match) => '${match.group(1)}${match.group(2)!.toUpperCase()}',
      );

      for (final acronym in _acronyms) {
        formatted = formatted.replaceAll(RegExp('\\b$acronym\\b', caseSensitive: false), acronym);
      }

      for (final entry in _knownBrands.entries) {
        formatted = formatted.replaceAll(RegExp('\\b${entry.key}\\b', caseSensitive: false), entry.value);
      }

      return formatted;
    });

    return normalizedLines.join('\n');
  }

  /// Normaliza a marca
  static String normalizeBrand(String? brand) {
    if (brand == null || brand.trim().isEmpty) return '';
    final trimmed = brand.trim();
    final lower = trimmed.toLowerCase();

    if (_knownBrands.containsKey(lower)) {
      return _knownBrands[lower]!;
    }

    if (_acronyms.contains(trimmed.toUpperCase())) {
      return trimmed.toUpperCase();
    }

    return normalizeProductName(trimmed);
  }
}
