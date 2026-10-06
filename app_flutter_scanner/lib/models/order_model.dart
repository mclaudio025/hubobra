class OrderItemModel {
  final String id;
  final String? productId;
  final String productName;
  final int quantityPurchased;
  final int quantityDelivered;
  final int quantityRemaining;
  final double unitPrice;
  final double total;

  OrderItemModel({
    required this.id,
    this.productId,
    required this.productName,
    required this.quantityPurchased,
    required this.quantityDelivered,
    required this.quantityRemaining,
    required this.unitPrice,
    required this.total,
  });

  factory OrderItemModel.fromJson(Map<String, dynamic> json) {
    final qty = (json['quantity'] as num?)?.toInt() ?? 1;
    final qtyPurchased = (json['quantityPurchased'] as num?)?.toInt() ?? qty;
    final qtyDelivered = (json['quantityDelivered'] as num?)?.toInt() ?? 0;
    final qtyRemaining = (json['quantityRemaining'] as num?)?.toInt() ?? (qtyPurchased - qtyDelivered);
    final price = (json['price'] as num?)?.toDouble() ?? 0.0;
    
    String name = 'Material da Obra';
    if (json['product'] != null && json['product'] is Map) {
      name = json['product']['name'] ?? name;
    }

    return OrderItemModel(
      id: json['id']?.toString() ?? '',
      productId: json['productId']?.toString(),
      productName: name,
      quantityPurchased: qtyPurchased,
      quantityDelivered: qtyDelivered,
      quantityRemaining: qtyRemaining,
      unitPrice: price,
      total: (json['total'] as num?)?.toDouble() ?? (price * qty),
    );
  }
}

class OrderModel {
  final String id;
  final String orderNumber;
  final String status;
  final String deliveryMode;
  final double total;
  final String customerName;
  final String? customerPhone;
  final String? customerAddress;
  final String? signatureUrl;
  final String? receivedBy;
  final String? notes;
  final DateTime createdAt;
  final List<OrderItemModel> items;

  OrderModel({
    required this.id,
    required this.orderNumber,
    required this.status,
    required this.deliveryMode,
    required this.total,
    required this.customerName,
    this.customerPhone,
    this.customerAddress,
    this.signatureUrl,
    this.receivedBy,
    this.notes,
    required this.createdAt,
    required this.items,
  });

  bool get isFutureDelivery => deliveryMode == 'FUTURE_PICKUP';
  bool get hasRemainingItems => items.any((i) => i.quantityRemaining > 0);
  bool get isDelivered => status == 'DELIVERED' || status == 'ENTREGUE';

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    String name = 'Cliente Balcão';
    String? phone;
    String? address;

    if (json['user'] != null && json['user'] is Map) {
      name = json['user']['name'] ?? name;
      phone = json['user']['phone'];
    }

    if (json['shippingAddress'] != null && json['shippingAddress'] is Map) {
      final addr = json['shippingAddress'];
      address = '${addr['street'] ?? ''}, ${addr['number'] ?? ''} - ${addr['neighborhood'] ?? ''}';
    }

    final rawItems = json['items'] as List<dynamic>? ?? [];
    final itemsList = rawItems.map((i) => OrderItemModel.fromJson(i as Map<String, dynamic>)).toList();

    return OrderModel(
      id: json['id']?.toString() ?? '',
      orderNumber: json['orderNumber']?.toString() ?? 'S/N',
      status: json['status']?.toString().toUpperCase() ?? 'PENDING',
      deliveryMode: json['deliveryMode']?.toString().toUpperCase() ?? 'IMMEDIATE',
      total: (json['total'] as num?)?.toDouble() ?? 0.0,
      customerName: name,
      customerPhone: phone,
      customerAddress: address,
      signatureUrl: json['signatureUrl'],
      receivedBy: json['receivedBy'],
      notes: json['notes'],
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : DateTime.now(),
      items: itemsList,
    );
  }
}
