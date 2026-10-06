import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../config/theme.dart';
import '../models/order_model.dart';
import '../services/supabase_service.dart';
import '../widgets/signature_pad.dart';

class OrderDispatchScreen extends StatefulWidget {
  const OrderDispatchScreen({super.key});

  @override
  State<OrderDispatchScreen> createState() => _OrderDispatchScreenState();
}

class _OrderDispatchScreenState extends State<OrderDispatchScreen> {
  final SupabaseService _supabaseService = SupabaseService();
  final TextEditingController _searchController = TextEditingController();

  List<OrderModel> _orders = [];
  bool _isLoading = true;
  String _filterStatus = 'ALL';

  @override
  void initState() {
    super.initState();
    _loadOrders();
  }

  Future<void> _loadOrders() async {
    setState(() => _isLoading = true);
    try {
      final rawList = await _supabaseService.fetchDispatchOrders();
      final parsed = rawList.map((j) => OrderModel.fromJson(j as Map<String, dynamic>)).toList();
      setState(() {
        _orders = parsed;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erro ao carregar pedidos: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  List<OrderModel> get _filteredOrders {
    final query = _searchController.text.toLowerCase().trim();
    return _orders.filter((o) {
      final matchQuery = query.isEmpty ||
          o.orderNumber.toLowerCase().contains(query) ||
          o.customerName.toLowerCase().contains(query) ||
          (o.customerPhone != null && o.customerPhone!.contains(query));

      if (!matchQuery) return false;

      if (_filterStatus == 'PENDING') {
        return !o.isDelivered;
      } else if (_filterStatus == 'DONE') {
        return o.isDelivered;
      }
      return true;
    }).toList();
  }

  void _openDispatchModal(OrderModel order) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.darkSurface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) => _DispatchSignatureSheet(
        order: order,
        onDispatched: () {
          Navigator.pop(context);
          _loadOrders();
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final currency = NumberFormat.currency(locale: 'pt_BR', symbol: 'R\$');

    return Scaffold(
      appBar: AppBar(
        title: const Row(
          children: [
            Icon(Icons.local_shipping, color: Color(0xFFFDB813)),
            SizedBox(width: 10),
            Text(
              'Expedição & Entregas',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
            ),
          ],
        ),
        actions: [
          IconButton(
            onPressed: _loadOrders,
            icon: const Icon(Icons.refresh),
            tooltip: 'Atualizar Fila',
          ),
        ],
      ),
      body: Column(
        children: [
          // Campo de busca
          Padding(
            padding: const EdgeInsets.all(12.0),
            child: TextField(
              controller: _searchController,
              onChanged: (_) => setState(() {}),
              decoration: InputDecoration(
                hintText: 'Buscar por cliente, pedido ou telefone...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                          setState(() {});
                        },
                      )
                    : null,
                filled: true,
                fillColor: AppTheme.darkCard,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),

          // Filtros Rápidos (Pílulas)
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Row(
              children: [
                _buildFilterChip('ALL', 'Todos (${_orders.length})'),
                const SizedBox(width: 8),
                _buildFilterChip('PENDING', 'Pendentes / Na Fila'),
                const SizedBox(width: 8),
                _buildFilterChip('DONE', 'Concluídos com Assinatura'),
              ],
            ),
          ),
          const SizedBox(height: 8),

          // Lista de Pedidos
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _filteredOrders.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.inbox_outlined, size: 64, color: Colors.grey.shade600),
                            const SizedBox(height: 12),
                            Text(
                              'Nenhum pedido encontrado na fila',
                              style: TextStyle(color: Colors.grey.shade400, fontSize: 16),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(12),
                        itemCount: _filteredOrders.length,
                        itemBuilder: (context, index) {
                          final order = _filteredOrders[index];
                          final isFractional = order.isFutureDelivery;

                          return Card(
                            color: AppTheme.darkCard,
                            margin: const EdgeInsets.only(bottom: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                              side: BorderSide(
                                color: order.isDelivered
                                    ? Colors.emerald.withOpacity(0.4)
                                    : (isFractional ? Colors.amber.withOpacity(0.4) : Colors.blue.withOpacity(0.3)),
                                width: 1.2,
                              ),
                            ),
                            child: InkWell(
                              onTap: () => _openDispatchModal(order),
                              borderRadius: BorderRadius.circular(16),
                              child: Padding(
                                padding: const EdgeInsets.all(14),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    // Cabeçalho do Card
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Row(
                                          children: [
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                              decoration: BoxDecoration(
                                                color: const Color(0xFF003366),
                                                borderRadius: BorderRadius.circular(8),
                                              ),
                                              child: Text(
                                                '#${order.orderNumber}',
                                                style: const TextStyle(
                                                  fontWeight: FontWeight.bold,
                                                  color: Colors.white,
                                                  fontSize: 13,
                                                ),
                                              ),
                                            ),
                                            const SizedBox(width: 8),
                                            if (isFractional)
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                                decoration: BoxDecoration(
                                                  color: Colors.amber.shade900.withOpacity(0.3),
                                                  borderRadius: BorderRadius.circular(8),
                                                  border: Border.all(color: Colors.amber.shade700, width: 0.8),
                                                ),
                                                child: const Text(
                                                  'RETIRADA FRACIONADA',
                                                  style: TextStyle(
                                                    color: Colors.amberAccent,
                                                    fontSize: 10,
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                                ),
                                              ),
                                          ],
                                        ),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                          decoration: BoxDecoration(
                                            color: order.isDelivered
                                                ? Colors.green.withOpacity(0.2)
                                                : Colors.blue.withOpacity(0.2),
                                            borderRadius: BorderRadius.circular(8),
                                          ),
                                          child: Text(
                                            order.isDelivered ? '✓ ENTREGUE' : 'AGUARDANDO EXPEDIÇÃO',
                                            style: TextStyle(
                                              color: order.isDelivered ? Colors.greenAccent : Colors.lightBlueAccent,
                                              fontSize: 11,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 10),

                                    // Nome do Cliente
                                    Row(
                                      children: [
                                        const Icon(Icons.person, size: 16, color: Colors.grey),
                                        const SizedBox(width: 6),
                                        Expanded(
                                          child: Text(
                                            order.customerName,
                                            style: const TextStyle(
                                              fontWeight: FontWeight.bold,
                                              fontSize: 15,
                                              color: Colors.white,
                                            ),
                                          ),
                                        ),
                                        Text(
                                          currency.format(order.total),
                                          style: const TextStyle(
                                            fontWeight: FontWeight.w900,
                                            color: Color(0xFFFDB813),
                                            fontSize: 14,
                                          ),
                                        ),
                                      ],
                                    ),

                                    if (order.customerAddress != null && order.customerAddress!.trim().isNotEmpty) ...[
                                      const SizedBox(height: 4),
                                      Row(
                                        children: [
                                          const Icon(Icons.location_on_outlined, size: 14, color: Colors.grey),
                                          const SizedBox(width: 6),
                                          Expanded(
                                            child: Text(
                                              order.customerAddress!,
                                              style: TextStyle(color: Colors.grey.shade400, fontSize: 12),
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],

                                    const Divider(height: 18, color: Colors.white10),

                                    // Resumo de Itens
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: order.items.take(3).map((it) {
                                        final hasRemaining = it.quantityRemaining > 0;
                                        return Padding(
                                          padding: const EdgeInsets.only(bottom: 4),
                                          child: Row(
                                            children: [
                                              Icon(
                                                hasRemaining ? Icons.circle : Icons.check_circle,
                                                size: 10,
                                                color: hasRemaining ? Colors.amber : Colors.green,
                                              ),
                                              const SizedBox(width: 8),
                                              Expanded(
                                                child: Text(
                                                  '${it.quantityPurchased}x ${it.productName}',
                                                  style: const TextStyle(color: Colors.white70, fontSize: 12),
                                                  maxLines: 1,
                                                  overflow: TextOverflow.ellipsis,
                                                ),
                                              ),
                                              if (isFractional)
                                                Text(
                                                  'Saldo: ${it.quantityRemaining}',
                                                  style: TextStyle(
                                                    color: it.quantityRemaining > 0 ? Colors.amberAccent : Colors.grey,
                                                    fontSize: 11,
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                                ),
                                            ],
                                          ),
                                        );
                                      }).toList(),
                                    ),

                                    if (order.items.length > 3)
                                      Padding(
                                        padding: const EdgeInsets.only(top: 2),
                                        child: Text(
                                          '+ mais ${order.items.length - 3} itens...',
                                          style: TextStyle(color: Colors.grey.shade500, fontSize: 11),
                                        ),
                                      ),

                                    const SizedBox(height: 8),

                                    // Botão de Assinatura Rápida
                                    Align(
                                      alignment: Alignment.centerRight,
                                      child: ElevatedButton.icon(
                                        onPressed: () => _openDispatchModal(order),
                                        icon: Icon(
                                          order.signatureUrl != null ? Icons.visibility : Icons.draw,
                                          size: 16,
                                        ),
                                        label: Text(order.signatureUrl != null ? 'Ver Assinatura' : 'Coletar Assinatura'),
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: order.signatureUrl != null
                                              ? Colors.grey.shade800
                                              : const Color(0xFF009DE0),
                                          foregroundColor: Colors.white,
                                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                          textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                        ),
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

  Widget _buildFilterChip(String status, String label) {
    final isSelected = _filterStatus == status;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (_) => setState(() => _filterStatus = status),
      selectedColor: const Color(0xFF009DE0),
      backgroundColor: AppTheme.darkCard,
      labelStyle: TextStyle(
        color: isSelected ? Colors.white : Colors.grey.shade400,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        fontSize: 12,
      ),
    );
  }
}

class _DispatchSignatureSheet extends StatefulWidget {
  final OrderModel order;
  final VoidCallback onDispatched;

  const _DispatchSignatureSheet({
    required this.order,
    required this.onDispatched,
  });

  @override
  State<_DispatchSignatureSheet> createState() => _DispatchSignatureSheetState();
}

class _DispatchSignatureSheetState extends State<_DispatchSignatureSheet> {
  final SupabaseService _supabaseService = SupabaseService();
  final GlobalKey<DigitalSignaturePadState> _sigPadKey = GlobalKey<DigitalSignaturePadState>();
  final TextEditingController _receiverNameController = TextEditingController();
  final TextEditingController _receiverDocController = TextEditingController();
  final TextEditingController _vehiclePlateController = TextEditingController();

  final Map<String, int> _quantitiesToWithdraw = {};
  bool _isSaving = false;
  bool _hasSignature = false;

  @override
  void initState() {
    super.initState();
    _receiverNameController.text = widget.order.customerName;
    for (final it in widget.order.items) {
      _quantitiesToWithdraw[it.id] = it.quantityRemaining > 0 ? it.quantityRemaining : it.quantityPurchased;
    }
  }

  Future<void> _handleConfirm() async {
    final receiver = _receiverNameController.text.trim();
    if (receiver.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Por favor, informe o nome de quem está recebendo o material.')),
      );
      return;
    }

    final signatureBase64 = await _sigPadKey.currentState?.captureSignatureAsBase64();
    if (signatureBase64 == null && widget.order.signatureUrl == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Por favor, colete a assinatura do recebedor na tela.')),
      );
      return;
    }

    setState(() => _isSaving = true);

    try {
      final isFractional = widget.order.isFutureDelivery;

      if (isFractional) {
        // Retirada fracionada de materiais
        final itemsData = widget.order.items.map((it) {
          final qty = _quantitiesToWithdraw[it.id] ?? 0;
          return {
            'orderItemId': it.id,
            'productId': it.productId,
            'productName': it.productName,
            'quantityWithdrawn': qty,
          };
        }).where((m) => (m['quantityWithdrawn'] as int) > 0).toList();

        await _supabaseService.recordFractionalWithdrawal(
          orderId: widget.order.id,
          itemsToWithdraw: itemsData,
          withdrawnBy: receiver,
          receiverDoc: _receiverDocController.text.trim(),
          vehiclePlate: _vehiclePlateController.text.trim(),
          signatureBase64: signatureBase64 ?? widget.order.signatureUrl,
        );
      } else {
        // Entrega total direta
        await _supabaseService.signAndCompleteOrder(
          orderId: widget.order.id,
          signatureBase64: signatureBase64 ?? widget.order.signatureUrl ?? '',
          receivedBy: receiver,
          receiverDoc: _receiverDocController.text.trim(),
        );
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✓ Entrega e Assinatura gravadas com sucesso no Supabase!'),
            backgroundColor: Colors.green,
          ),
        );
        widget.onDispatched();
      }
    } catch (e) {
      setState(() => _isSaving = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erro ao salvar: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
        left: 16,
        right: 16,
        top: 20,
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: [
            // Barra superior modal
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.shade600,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 14),

            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Pedido #${widget.order.orderNumber}',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.white),
                    ),
                    Text(
                      widget.order.customerName,
                      style: TextStyle(color: Colors.grey.shade400, fontSize: 13),
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            const Divider(height: 20, color: Colors.white12),

            // Conferência de Itens a Entregar / Retirar
            const Text(
              'Itens para Liberação / Retirada:',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 14),
            ),
            const SizedBox(height: 8),

            ...widget.order.items.map((it) {
              final isFractional = widget.order.isFutureDelivery;
              final maxQty = it.quantityRemaining > 0 ? it.quantityRemaining : it.quantityPurchased;
              final currentQty = _quantitiesToWithdraw[it.id] ?? maxQty;

              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppTheme.darkCard,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.white10),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.check_box, color: Color(0xFF009DE0), size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            it.productName,
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13),
                          ),
                          Text(
                            'Comprado: ${it.quantityPurchased} un | Saldo: ${it.quantityRemaining} un',
                            style: TextStyle(color: Colors.grey.shade400, fontSize: 11),
                          ),
                        ],
                      ),
                    ),

                    if (isFractional) ...[
                      // Seletor de Quantidade Fracionada
                      IconButton(
                        icon: const Icon(Icons.remove_circle_outline, size: 20, color: Colors.redAccent),
                        onPressed: currentQty > 0
                            ? () => setState(() => _quantitiesToWithdraw[it.id] = currentQty - 1)
                            : null,
                      ),
                      Text(
                        '$currentQty',
                        style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.amberAccent, fontSize: 15),
                      ),
                      IconButton(
                        icon: const Icon(Icons.add_circle_outline, size: 20, color: Colors.greenAccent),
                        onPressed: currentQty < maxQty
                            ? () => setState(() => _quantitiesToWithdraw[it.id] = currentQty + 1)
                            : null,
                      ),
                    ] else ...[
                      Text(
                        '${it.quantityPurchased} un',
                        style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                    ],
                  ],
                ),
              );
            }),

            const SizedBox(height: 12),

            // Campos do Recebedor
            TextField(
              controller: _receiverNameController,
              decoration: InputDecoration(
                labelText: 'Nome de quem está recebendo / retirando *',
                prefixIcon: const Icon(Icons.badge_outlined),
                filled: true,
                fillColor: AppTheme.darkCard,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 10),

            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _receiverDocController,
                    decoration: InputDecoration(
                      labelText: 'RG ou CPF (Opcional)',
                      prefixIcon: const Icon(Icons.credit_card),
                      filled: true,
                      fillColor: AppTheme.darkCard,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: TextField(
                    controller: _vehiclePlateController,
                    decoration: InputDecoration(
                      labelText: 'Placa Veículo (Opcional)',
                      prefixIcon: const Icon(Icons.directions_car_outlined),
                      filled: true,
                      fillColor: AppTheme.darkCard,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Seção de Assinatura Digital
            const Row(
              children: [
                Icon(Icons.draw, color: Color(0xFFFDB813), size: 18),
                SizedBox(width: 8),
                Text(
                  'Assinatura Digital do Recebedor:',
                  style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 14),
                ),
              ],
            ),
            const SizedBox(height: 8),

            DigitalSignaturePad(
              key: _sigPadKey,
              onHasSignatureChanged: (has) => setState(() => _hasSignature = has),
            ),

            const SizedBox(height: 16),

            // Botão Salvar
            ElevatedButton(
              onPressed: _isSaving ? null : _handleConfirm,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF009DE0),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: _isSaving
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                    )
                  : const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.check_circle_outline, size: 20),
                        SizedBox(width: 8),
                        Text(
                          'CONFIRMAR ENTREGA & SALVAR ASSINATURA',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                      ],
                    ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

extension ListFilter<E> on List<E> {
  List<E> filter(bool Function(E element) test) {
    final result = <E>[];
    for (final element in this) {
      if (test(element)) {
        result.add(element);
      }
    }
    return result;
  }
}
