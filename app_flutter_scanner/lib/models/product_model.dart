class ProductModel {
  final String id;
  final String name;
  final String? description;
  final String? specifications;
  final double price;
  final double? comparePrice;
  final double? cost;
  final int stock;
  final int minStock;
  final String sku;
  final String? barcode;
  final String? brand;
  final String? model;
  final String? unit;
  final bool active;
  final String categoryId;
  final String? categoryName;
  final List<String> imageUrls;
  final DateTime? updatedAt;

  ProductModel({
    required this.id,
    required this.name,
    this.description,
    this.specifications,
    required this.price,
    this.comparePrice,
    this.cost,
    required this.stock,
    this.minStock = 5,
    required this.sku,
    this.barcode,
    this.brand,
    this.model,
    this.unit,
    this.active = true,
    required this.categoryId,
    this.categoryName,
    this.imageUrls = const [],
    this.updatedAt,
  });

  factory ProductModel.fromJson(Map<String, dynamic> json) {
    // Extrai URLs de imagens se vierem aninhadas ou em formato JSON
    List<String> images = [];
    if (json['images'] != null) {
      if (json['images'] is List) {
        for (var item in json['images']) {
          if (item is Map && item['url'] != null) {
            images.add(item['url'].toString());
          } else if (item is String) {
            images.add(item);
          }
        }
      }
    } else if (json['image'] != null) {
      images.add(json['image'].toString());
    }

    return ProductModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      description: json['description']?.toString(),
      specifications: json['specifications']?.toString(),
      price: (json['price'] is num) ? (json['price'] as num).toDouble() : 0.0,
      comparePrice: (json['comparePrice'] is num) ? (json['comparePrice'] as num).toDouble() : null,
      cost: (json['cost'] is num) ? (json['cost'] as num).toDouble() : null,
      stock: (json['stock'] is num) ? (json['stock'] as num).toInt() : 0,
      minStock: (json['minStock'] is num) ? (json['minStock'] as num).toInt() : 5,
      sku: json['sku']?.toString() ?? '',
      barcode: json['barcode']?.toString(),
      brand: json['brand']?.toString(),
      model: json['model']?.toString(),
      unit: json['unit']?.toString(),
      active: json['active'] == true,
      categoryId: json['categoryId']?.toString() ?? '',
      categoryName: json['category'] != null && json['category'] is Map ? json['category']['name']?.toString() : null,
      imageUrls: images,
      updatedAt: json['updatedAt'] != null ? DateTime.tryParse(json['updatedAt'].toString()) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'specifications': specifications,
      'price': price,
      'comparePrice': comparePrice,
      'cost': cost,
      'stock': stock,
      'minStock': minStock,
      'sku': sku,
      'barcode': barcode,
      'brand': brand,
      'model': model,
      'active': active,
      'categoryId': categoryId,
      'updatedAt': DateTime.now().toIso8601String(),
    };
  }

  ProductModel copyWith({
    String? name,
    double? price,
    double? comparePrice,
    int? stock,
    bool? active,
    String? categoryId,
    List<String>? imageUrls,
  }) {
    return ProductModel(
      id: id,
      name: name ?? this.name,
      description: description,
      specifications: specifications,
      price: price ?? this.price,
      comparePrice: comparePrice ?? this.comparePrice,
      cost: cost,
      stock: stock ?? this.stock,
      minStock: minStock,
      sku: sku,
      barcode: barcode,
      brand: brand,
      model: model,
      active: active ?? this.active,
      categoryId: categoryId ?? this.categoryId,
      categoryName: categoryName,
      imageUrls: imageUrls ?? this.imageUrls,
      updatedAt: DateTime.now(),
    );
  }
}
