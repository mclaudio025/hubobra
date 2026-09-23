import 'dart:math';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../config/supabase_config.dart';
import '../models/product_model.dart';
import '../models/category_model.dart';
import '../utils/text_normalizer.dart';

class CreateProductResult {
  final bool success;
  final ProductModel? product;
  final String? errorMessage;

  CreateProductResult({
    required this.success,
    this.product,
    this.errorMessage,
  });
}

class SupabaseService {
  final SupabaseClient _client = Supabase.instance.client;

  /// Gerador de UUID v4 seguro e compatível com PostgreSQL
  static String generateUuid() {
    final random = Random.secure();
    final values = List<int>.generate(16, (i) => random.nextInt(256));
    values[6] = (values[6] & 0x0f) | 0x40; // Version 4
    values[8] = (values[8] & 0x3f) | 0x80; // Variant
    final hex = values.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
    return '${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}';
  }

  /// Busca um produto pelo código de barras exato (EAN-13, EAN-8, etc.) ou SKU
  Future<ProductModel?> findProductByBarcode(String barcode) async {
    try {
      final cleanBarcode = barcode.trim();
      
      final response = await _client
          .from(SupabaseConfig.productsTable)
          .select('*, category:categories(id, name), images:product_images(url)')
          .or('barcode.eq.$cleanBarcode,sku.eq.$cleanBarcode')
          .maybeSingle();

      if (response == null) {
        return null;
      }

      return ProductModel.fromJson(response);
    } catch (e) {
      try {
        final directResponse = await _client
            .from(SupabaseConfig.productsTable)
            .select()
            .or('barcode.eq.${barcode.trim()},sku.eq.${barcode.trim()}')
            .maybeSingle();

        if (directResponse != null) {
          return ProductModel.fromJson(directResponse);
        }
      } catch (err) {
        print('Erro ao buscar produto no Supabase: $err');
      }
      return null;
    }
  }

  /// Busca produtos por texto (nome, descrição, marca ou SKU)
  Future<List<ProductModel>> searchProductsByQuery(String query, {int limit = 25}) async {
    try {
      final clean = query.trim();
      if (clean.isEmpty) return [];

      final response = await _client
          .from(SupabaseConfig.productsTable)
          .select('*, category:categories(id, name), images:product_images(url)')
          .or('name.ilike.%$clean%,description.ilike.%$clean%,brand.ilike.%$clean%,sku.ilike.%$clean%')
          .order('name')
          .limit(limit);

      return (response as List).map((p) => ProductModel.fromJson(p)).toList();
    } catch (e) {
      print('Erro ao buscar produtos por texto no Supabase: $e');
      try {
        final fallbackResponse = await _client
            .from(SupabaseConfig.productsTable)
            .select()
            .ilike('name', '%${query.trim()}%')
            .order('name')
            .limit(limit);

        return (fallbackResponse as List).map((p) => ProductModel.fromJson(p)).toList();
      } catch (fallbackErr) {
        print('Erro no fallback de busca: $fallbackErr');
        return [];
      }
    }
  }

  /// Atualiza o estoque no Supabase instantaneamente
  Future<bool> updateProductStock(String productId, int newStock) async {
    try {
      await _client
          .from(SupabaseConfig.productsTable)
          .update({
            'stock': newStock,
            'updatedAt': DateTime.now().toUtc().toIso8601String(),
          })
          .eq('id', productId);
      return true;
    } catch (e) {
      print('Erro ao atualizar estoque no Supabase: $e');
      return false;
    }
  }

  /// Atualiza o preço de venda no Supabase instantaneamente
  Future<bool> updateProductPrice(String productId, double newPrice) async {
    try {
      await _client
          .from(SupabaseConfig.productsTable)
          .update({
            'price': newPrice,
            'updatedAt': DateTime.now().toUtc().toIso8601String(),
          })
          .eq('id', productId);
      return true;
    } catch (e) {
      print('Erro ao atualizar preço no Supabase: $e');
      return false;
    }
  }

  /// Cadastra um produto novo gerado automaticamente pelo scanner com UUID e timestamps
  Future<CreateProductResult> createNewProduct({
    required String name,
    required double price,
    required int stock,
    required String barcode,
    required String sku,
    required String categoryId,
    String? brand,
    String? description,
    String? specifications,
    String? imageUrl,
  }) async {
    try {
      final now = DateTime.now().toUtc().toIso8601String();
      final productId = generateUuid();
      final cleanSku = sku.trim().isNotEmpty
          ? sku.trim()
          : 'SKU-${barcode.trim().isNotEmpty ? barcode.trim() : productId.substring(0, 8)}';
      final normalizedName = TextNormalizer.normalizeProductName(name);
      final normalizedBrand = brand != null && brand.trim().isNotEmpty ? TextNormalizer.normalizeBrand(brand) : null;
      final normalizedDesc = description != null && description.trim().isNotEmpty ? TextNormalizer.normalizeDescription(description) : normalizedName;

      final newProductData = {
        'id': productId,
        'name': normalizedName,
        'price': price,
        'cost': price > 0 ? (price * 0.6) : null,
        'stock': stock,
        'minStock': 5,
        'barcode': barcode.trim().isNotEmpty ? barcode.trim() : null,
        'sku': cleanSku,
        'categoryId': categoryId,
        'brand': (normalizedBrand != null && normalizedBrand.isNotEmpty) ? normalizedBrand : null,
        'description': normalizedDesc,
        'specifications': specifications,
        'active': true,
        'featured': false,
        'hasVariations': false,
        'isVariation': false,
        'rating': 0.0,
        'reviewCount': 0,
        'viewCount': 0,
        'saleCount': 0,
        'createdAt': now,
        'updatedAt': now,
      };

      final response = await _client
          .from(SupabaseConfig.productsTable)
          .insert(newProductData)
          .select('*, category:categories(id, name)')
          .single();

      final created = ProductModel.fromJson(response);

      // Se houver foto selecionada, insere na tabela product_images
      if (imageUrl != null && imageUrl.isNotEmpty) {
        try {
          await _client.from(SupabaseConfig.productImagesTable).insert({
            'id': generateUuid(),
            'productId': productId,
            'url': imageUrl,
            'alt': name.trim(),
            'order': 0,
            'createdAt': now,
          });
        } catch (imgErr) {
          print('Aviso ao salvar foto no banco: $imgErr');
        }
      }

      return CreateProductResult(
        success: true,
        product: created,
      );
    } catch (e) {
      print('Erro ao cadastrar novo produto no Supabase: $e');
      String msg = e.toString();
      if (msg.contains('23505') || msg.contains('unique constraint')) {
        msg = 'Código SKU ou de Barras já cadastrado em outro produto.';
      } else if (msg.contains('23503') || msg.contains('foreign key')) {
        msg = 'Categoria selecionada não encontrada no banco.';
      }
      return CreateProductResult(
        success: false,
        errorMessage: msg,
      );
    }
  }

  /// Busca categorias cadastradas no Supabase
  Future<List<CategoryModel>> getCategories() async {
    try {
      final response = await _client
          .from(SupabaseConfig.categoriesTable)
          .select()
          .eq('active', true)
          .order('name');

      return (response as List).map((c) => CategoryModel.fromJson(c)).toList();
    } catch (e) {
      print('Erro ao buscar categorias: $e');
      return [];
    }
  }

  /// Busca histórico de produtos recentes / auditados
  Future<List<ProductModel>> getRecentProducts({int limit = 20}) async {
    try {
      final response = await _client
          .from(SupabaseConfig.productsTable)
          .select('*, category:categories(id, name), images:product_images(url)')
          .order('updatedAt', ascending: false)
          .limit(limit);

      return (response as List).map((p) => ProductModel.fromJson(p)).toList();
    } catch (e) {
      print('Erro ao buscar produtos recentes: $e');
      return [];
    }
  }
}
