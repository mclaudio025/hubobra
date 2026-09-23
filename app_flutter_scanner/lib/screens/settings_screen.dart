import 'package:flutter/material.dart';
import '../config/supabase_config.dart';
import '../config/theme.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Configurações & Conexão'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // Card de Status do Supabase
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 12,
                        height: 12,
                        decoration: const BoxDecoration(
                          color: AppTheme.accentGreen,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 8),
                      const Text(
                        'Conectado ao Supabase Pro',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  const Text('URL do Projeto:', style: TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
                  Text(SupabaseConfig.supabaseUrl, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13)),
                  const SizedBox(height: 8),
                  const Text('Tabelas Ativas:', style: TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
                  const Text('• products\n• categories\n• product_images', style: TextStyle(fontSize: 13)),
                ],
              ),
            ),
          ),

          const SizedBox(height: 20),

          // Informações do App
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'HubScanner Mobile v1.0',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Aplicativo Coletor e Scanner Inteligente de Estoque conectado ao banco Supabase PostgreSQL em tempo real.',
                    style: TextStyle(color: AppTheme.textSecondary, fontSize: 13),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
