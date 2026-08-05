import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'mission_tracking_screen.dart';

class ClientHomeScreen extends ConsumerStatefulWidget {
  const ClientHomeScreen({super.key});

  @override
  ConsumerState<ClientHomeScreen> createState() => _ClientHomeScreenState();
}

class _ClientHomeScreenState extends ConsumerState<ClientHomeScreen> {
  String selectedCity = 'Douala';
  String selectedCategory = 'Supervision Chantier';

  final _titleController = TextEditingController();
  final _descController = TextEditingController();

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    super.dispose();
  }

  void _submitEscrowOrder() {
    if (_titleController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Veuillez spécifier le titre de la mission')),
      );
      return;
    }

    final missionTitle = _titleController.text;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF141228),
        title: const Text('Confirmation de paiement sous séquestre'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Ville: $selectedCity'),
            Text('Catégorie: $selectedCategory'),
            const SizedBox(height: 8),
            const Text(
              'Montant total à débiter (Mobile Money): 25 000 FCFA',
              style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF4ADE80)),
            ),
            const SizedBox(height: 8),
            const Text(
              '🔒 Vos fonds restent retenus sous séquestre jusqu\'à la validation des preuves photos.',
              style: TextStyle(fontSize: 12, color: Colors.white70),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Annuler', style: TextStyle(color: Colors.white60)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  backgroundColor: Color(0xFF16A34A),
                  content: Text('✓ Paiement séquestre validé ! Recherche de l\'agent en cours à Douala...'),
                ),
              );
              
              // Navigate to MissionTrackingScreen (Fix BUG-03)
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => MissionTrackingScreen(
                    missionTitle: missionTitle,
                    agentName: 'Samuel Kouamé',
                    city: selectedCity,
                  ),
                ),
              );

              _titleController.clear();
              _descController.clear();
            },
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF16A34A)),
            child: const Text('Payer via MoMo / Orange'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Send Moi — Espace Client'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: DropdownButton<String>(
              value: selectedCity,
              dropdownColor: const Color(0xFF141228),
              underline: const SizedBox(),
              items: ['Douala', 'Yaoundé'].map((city) {
                return DropdownMenuItem(
                  value: city,
                  child: Text('📍 $city', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                );
              }).toList(),
              onChanged: (val) {
                if (val != null) setState(() => selectedCity = val);
              },
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Banner
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF5B21B6), Color(0xFF7C3AED)],
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                children: [
                  const Icon(Icons.shield, size: 40, color: Colors.white),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        Text(
                          'Paiement Sous Séquestre Garanti',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white),
                        ),
                        Text(
                          'L\'agent ne reçoit sa rémunération qu\'après votre validation des photos.',
                          style: TextStyle(fontSize: 12, color: Colors.white70),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            const Text(
              'Créer une nouvelle mission',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            const SizedBox(height: 12),

            // Service Category selector
            Row(
              children: [
                Expanded(
                  child: ChoiceChip(
                    label: const Text('🏗️ Supervision Chantier'),
                    selected: selectedCategory == 'Supervision Chantier',
                    selectedColor: const Color(0xFF7C3AED),
                    onSelected: (_) => setState(() => selectedCategory = 'Supervision Chantier'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ChoiceChip(
                    label: const Text('🛍️ Courses & Achats'),
                    selected: selectedCategory == 'Courses & Achats',
                    selectedColor: const Color(0xFF0D9488),
                    onSelected: (_) => setState(() => selectedCategory = 'Courses & Achats'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Title Input
            TextField(
              controller: _titleController,
              decoration: InputDecoration(
                labelText: 'Titre de la mission',
                hintText: selectedCategory == 'Supervision Chantier'
                    ? 'Ex: Inspection coulage dalle Makepe'
                    : 'Ex: Achat vivres marché Sandaga',
                filled: true,
                fillColor: const Color(0xFF141228),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 12),

            // Description Input
            TextField(
              controller: _descController,
              maxLines: 3,
              decoration: InputDecoration(
                labelText: 'Instructions précises pour l\'agent',
                hintText: 'Précisez l\'adresse exacte et les vérifications à effectuer...',
                filled: true,
                fillColor: const Color(0xFF141228),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 20),

            // Order CTA
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton.icon(
                onPressed: _submitEscrowOrder,
                icon: const Icon(Icons.payment),
                label: const Text('Valider & Bloquer les fonds (Séquestre)'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
