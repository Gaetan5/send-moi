import 'package:flutter/material.dart';
import '../../core/api_client.dart';

class AgentKycScreen extends StatefulWidget {
  const AgentKycScreen({super.key});

  @override
  State<AgentKycScreen> createState() => _AgentKycScreenState();
}

class _AgentKycScreenState extends State<AgentKycScreen> {
  final _cniController = TextEditingController();
  final _zonesController = TextEditingController(text: 'Akwa, Makepe, Bonapriso');
  final _momoController = TextEditingController(text: '+237 699 00 11 22');
  String selectedCity = 'Douala';
  String selectedProvider = 'MTN Mobile Money';
  bool isSubmitting = false;

  @override
  void dispose() {
    _cniController.dispose();
    _zonesController.dispose();
    _momoController.dispose();
    super.dispose();
  }

  Future<void> _submitApplication() async {
    if (_cniController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Veuillez saisir votre numéro de CNI')),
      );
      return;
    }

    setState(() => isSubmitting = true);

    try {
      final payload = {
        'cniNumber': _cniController.text.trim(),
        'momoNumber': _momoController.text.trim(),
        'preferredZones': _zonesController.text.split(',').map((z) => z.trim()).toList(),
      };

      await ApiClient.post('/users/apply-agent', payload);

      setState(() => isSubmitting = false);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: Color(0xFF16A34A),
            content: Text('🎉 Dossier KYC soumis avec succès ! Examen par l\'équipe sous 48h.'),
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      setState(() => isSubmitting = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(backgroundColor: Colors.redAccent, content: Text('Erreur: ${e.toString()}')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Candidature Agent Indépendant'),
        backgroundColor: const Color(0xFF141228),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Formulaire de Vérification KYC',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            const SizedBox(height: 8),
            const Text(
              'Veuillez fournir vos informations d\'identification pour recevoir des missions à Douala ou Yaoundé.',
              style: TextStyle(fontSize: 13, color: Colors.white70),
            ),
            const SizedBox(height: 24),

            TextField(
              controller: _cniController,
              decoration: InputDecoration(
                labelText: 'Numéro de CNI / Passeport',
                hintText: 'Ex: 118293849',
                filled: true,
                fillColor: const Color(0xFF141228),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 16),

            DropdownButtonFormField<String>(
              initialValue: selectedCity,
              decoration: InputDecoration(
                labelText: 'Ville d\'intervention',
                filled: true,
                fillColor: const Color(0xFF141228),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              dropdownColor: const Color(0xFF141228),
              items: ['Douala', 'Yaoundé'].map((city) {
                return DropdownMenuItem(value: city, child: Text(city));
              }).toList(),
              onChanged: (val) => setState(() => selectedCity = val!),
            ),
            const SizedBox(height: 16),

            TextField(
              controller: _zonesController,
              decoration: InputDecoration(
                labelText: 'Quartiers / Zones privilégiées',
                filled: true,
                fillColor: const Color(0xFF141228),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 16),

            TextField(
              controller: _momoController,
              keyboardType: TextInputType.phone,
              decoration: InputDecoration(
                labelText: 'Numéro Mobile Money pour vos reversements',
                filled: true,
                fillColor: const Color(0xFF141228),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 24),

            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: _submitApplication,
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF7C3AED)),
                child: const Text('Soumettre mon dossier KYC'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
