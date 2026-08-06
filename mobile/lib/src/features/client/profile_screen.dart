import 'package:flutter/material.dart';
import '../../core/api_client.dart';
import '../../core/realtime_client.dart';

class ProfileScreen extends StatelessWidget {
  final VoidCallback? onLogout;

  const ProfileScreen({super.key, this.onLogout});

  Future<void> _handleLogout(BuildContext context) async {
    await ApiClient.clearAuthToken();
    RealtimeClient.disconnect();
    if (context.mounted) {
      onLogout?.call();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0B0A14),
      appBar: AppBar(
        title: const Text('Mon Profil & Sécurité'),
        backgroundColor: const Color(0xFF141228),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            children: [
              const SizedBox(height: 20),
              const CircleAvatar(
                radius: 40,
                backgroundColor: Color(0xFF7C3AED),
                child: Icon(Icons.person, size: 48, color: Colors.white),
              ),
              const SizedBox(height: 16),
              const Text('Utilisateur Send Moi', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              const Text('Session sécurisée JWT', style: TextStyle(color: Color(0xFF4ADE80), fontSize: 12)),
              const SizedBox(height: 32),

              Container(
                decoration: BoxDecoration(
                  color: const Color(0xFF141228),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Column(
                  children: [
                    ListTile(
                      leading: Icon(Icons.phone, color: Color(0xFF7C3AED)),
                      title: Text('Numéro de téléphone', style: TextStyle(color: Colors.white)),
                      subtitle: Text('Authentifié via OTP / Google', style: TextStyle(color: Colors.white54, fontSize: 12)),
                    ),
                    Divider(color: Colors.white12, height: 1),
                    ListTile(
                      leading: Icon(Icons.security, color: Color(0xFF16A34A)),
                      title: Text('Protection Séquestre', style: TextStyle(color: Colors.white)),
                      subtitle: Text('Contrats horodatés SHA-256', style: TextStyle(color: Colors.white54, fontSize: 12)),
                    ),
                  ],
                ),
              ),

              const Spacer(),

              SizedBox(
                width: double.infinity,
                height: 50,
                child: OutlinedButton.icon(
                  onPressed: () => _handleLogout(context),
                  icon: const Icon(Icons.logout, color: Colors.redAccent),
                  label: const Text('Se Déconnecter', style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold)),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Colors.redAccent),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}
