import 'package:flutter/material.dart';
import '../../core/api_client.dart';
import 'mission_tracking_screen.dart';

class MyRequestsScreen extends StatefulWidget {
  const MyRequestsScreen({super.key});

  @override
  State<MyRequestsScreen> createState() => _MyRequestsScreenState();
}

class _MyRequestsScreenState extends State<MyRequestsScreen> {
  List<dynamic> missions = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchMissions();
  }

  Future<void> _fetchMissions() async {
    setState(() => isLoading = true);
    try {
      final res = await ApiClient.get('/missions');
      if (res is List) {
        setState(() {
          missions = res;
          isLoading = false;
        });
      } else {
        setState(() => isLoading = false);
      }
    } catch (e) {
      setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0B0A14),
      appBar: AppBar(
        title: const Text('Mes Demandes & Missions'),
        backgroundColor: const Color(0xFF141228),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _fetchMissions,
          )
        ],
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF7C3AED)))
          : missions.isEmpty
              ? const Center(
                  child: Text(
                    'Aucune demande enregistrée pour le moment.',
                    style: TextStyle(color: Colors.white60),
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: missions.length,
                  itemBuilder: (ctx, i) {
                    final item = missions[i];
                    final title = item['title'] ?? 'Mission';
                    final category = item['category'] ?? 'SUPERVISION';
                    final status = item['status'] ?? 'SOUMISE';
                    final amount = item['amount'] ?? 25000;

                    return Card(
                      color: const Color(0xFF141228),
                      margin: const EdgeInsets.only(bottom: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      child: ListTile(
                        contentPadding: const EdgeInsets.all(16),
                        title: Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const SizedBox(height: 6),
                            Text('Catégorie: $category | Statut: $status', style: const TextStyle(color: Colors.white60, fontSize: 12)),
                            const SizedBox(height: 4),
                            Text('Séquestre: $amount FCFA', style: const TextStyle(color: Color(0xFF4ADE80), fontWeight: FontWeight.bold, fontSize: 13)),
                          ],
                        ),
                        trailing: const Icon(Icons.chevron_right, color: Colors.white54),
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => MissionTrackingScreen(missionId: item['id'] ?? 'demo_123'),
                            ),
                          );
                        },
                      ),
                    );
                  },
                ),
    );
  }
}
