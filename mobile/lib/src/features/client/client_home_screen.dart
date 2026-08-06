import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'new_request_screen.dart';

class ClientHomeScreen extends ConsumerStatefulWidget {
  const ClientHomeScreen({super.key});

  @override
  ConsumerState<ClientHomeScreen> createState() => _ClientHomeScreenState();
}

class _ClientHomeScreenState extends ConsumerState<ClientHomeScreen> {
  String selectedCity = 'Douala';
  String selectedCategory = 'Supervision Chantier';
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

            // Service Category Cards (Navigation vers NewRequestScreen Option B)
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 1.3,
              children: [
                _CategoryCard(
                  icon: Icons.engineering,
                  title: 'Supervision Chantier',
                  subtitle: 'Photos/Vidéos géolocalisées',
                  color: const Color(0xFF7C3AED),
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const NewRequestScreen(category: 'SUPERVISION')),
                  ),
                ),
                _CategoryCard(
                  icon: Icons.shopping_cart,
                  title: 'Courses & Achats',
                  subtitle: 'Livraison contrôlée',
                  color: const Color(0xFF0D9488),
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const NewRequestScreen(category: 'COURSES')),
                  ),
                ),
                _CategoryCard(
                  icon: Icons.local_shipping,
                  title: 'Livraison Colis',
                  subtitle: 'Remise en main propre',
                  color: const Color(0xFFD97706),
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const NewRequestScreen(category: 'LIVRAISON')),
                  ),
                ),
                _CategoryCard(
                  icon: Icons.more_horiz,
                  title: 'Autre Mission',
                  subtitle: 'Traitement personnalisé',
                  color: const Color(0xFF2563EB),
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const NewRequestScreen(category: 'AUTRE')),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _CategoryCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;

  const _CategoryCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFF141228),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withValues(alpha: 0.3)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 8),
            Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
            const SizedBox(height: 2),
            Text(subtitle, style: const TextStyle(color: Colors.white54, fontSize: 10)),
          ],
        ),
      ),
    );
  }
}
