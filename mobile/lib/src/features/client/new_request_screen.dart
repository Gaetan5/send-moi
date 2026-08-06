import 'package:flutter/material.dart';
import '../../core/api_client.dart';
import 'request_confirmation_screen.dart';

class NewRequestScreen extends StatefulWidget {
  final String category;

  const NewRequestScreen({super.key, required this.category});

  @override
  State<NewRequestScreen> createState() => _NewRequestScreenState();
}

class _NewRequestScreenState extends State<NewRequestScreen> {
  String selectedCity = 'DOUALA';
  DateTime selectedDate = DateTime.now().add(const Duration(days: 1));
  TimeOfDay selectedTime = const TimeOfDay(hour: 09, minute: 00);

  final _titleController = TextEditingController();
  final _instructionsController = TextEditingController();

  // Dynamic fields for Supervision
  final _siteAddressController = TextEditingController();
  final _elementsToVerifyController = TextEditingController();

  // Dynamic fields for Courses
  final _itemsListController = TextEditingController();
  final _maxBudgetController = TextEditingController(text: '15000');

  // Dynamic fields for Livraison
  final _pickupAddressController = TextEditingController();
  final _deliveryAddressController = TextEditingController();

  bool isSubmitting = false;

  @override
  void dispose() {
    _titleController.dispose();
    _instructionsController.dispose();
    _siteAddressController.dispose();
    _elementsToVerifyController.dispose();
    _itemsListController.dispose();
    _maxBudgetController.dispose();
    _pickupAddressController.dispose();
    _deliveryAddressController.dispose();
    super.dispose();
  }

  Future<void> _submitRequest() async {
    if (_titleController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Veuillez saisir un titre pour la demande.')),
      );
      return;
    }

    setState(() => isSubmitting = true);

    try {
      // Build dynamic category payload based on Option B
      Map<String, dynamic> categoryPayload = {};

      if (widget.category.toUpperCase() == 'SUPERVISION') {
        categoryPayload = {
          'siteAddress': _siteAddressController.text.trim(),
          'elementsToVerify': _elementsToVerifyController.text.trim(),
        };
      } else if (widget.category.toUpperCase() == 'COURSES') {
        categoryPayload = {
          'itemsList': _itemsListController.text.trim(),
          'maxBudget': int.tryParse(_maxBudgetController.text.trim()) ?? 15000,
        };
      } else if (widget.category.toUpperCase() == 'LIVRAISON') {
        categoryPayload = {
          'pickupAddress': _pickupAddressController.text.trim(),
          'deliveryAddress': _deliveryAddressController.text.trim(),
        };
      }

      final payload = {
        'title': _titleController.text.trim(),
        'description': _instructionsController.text.trim(),
        'category': widget.category.toUpperCase(),
        'city': selectedCity,
        'amount': 25000, // FCFA (Montant fixé pour séquestre)
        'categoryPayload': categoryPayload,
        'milestones': [
          {'title': 'Arrivée sur site et vérification visuelle', 'percentage': 30},
          {'title': 'Rapport d\'exécution détaillé', 'percentage': 40},
          {'title': 'Clôture de la mission', 'percentage': 30},
        ],
      };

      final response = await ApiClient.post('/missions', payload);

      setState(() => isSubmitting = false);

      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (_) => RequestConfirmationScreen(missionData: response),
          ),
        );
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
      backgroundColor: const Color(0xFF0B0A14),
      appBar: AppBar(
        title: Text('Nouvelle demande — ${widget.category}'),
        backgroundColor: const Color(0xFF141228),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Tronc Commun: Titre & Ville
              const Text('1. Informations Générales', style: TextStyle(color: Colors.white70, fontSize: 14, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),

              TextField(
                controller: _titleController,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  labelText: 'Intitulé de la demande',
                  hintText: 'Ex: Supervision coulage dalle Makepe',
                  filled: true,
                  fillColor: const Color(0xFF141228),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 16),

              DropdownButtonFormField<String>(
                value: selectedCity,
                dropdownColor: const Color(0xFF141228),
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  labelText: 'Ville d\'intervention',
                  filled: true,
                  fillColor: const Color(0xFF141228),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
                items: const [
                  DropdownMenuItem(value: 'DOUALA', child: Text('Douala')),
                  DropdownMenuItem(value: 'YAOUNDE', child: Text('Yaoundé')),
                ],
                onChanged: (val) => setState(() => selectedCity = val!),
              ),
              const SizedBox(height: 24),

              // Section Dynamique selon Option B
              Text('2. Détails de la demande (${widget.category})', style: const TextStyle(color: Colors.white70, fontSize: 14, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),

              if (widget.category.toUpperCase() == 'SUPERVISION') ...[
                TextField(
                  controller: _siteAddressController,
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    labelText: 'Adresse exacte du chantier',
                    hintText: 'Quartier, repère géographique',
                    filled: true,
                    fillColor: const Color(0xFF141228),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _elementsToVerifyController,
                  maxLines: 3,
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    labelText: 'Éléments précis à vérifier',
                    hintText: 'Ex: Qualité du béton, présence des ferrailleurs, photos de la dalles',
                    filled: true,
                    fillColor: const Color(0xFF141228),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ] else if (widget.category.toUpperCase() == 'COURSES') ...[
                TextField(
                  controller: _itemsListController,
                  maxLines: 3,
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    labelText: 'Liste complète des articles à acheter',
                    hintText: 'Ex: 2 sacs de ciment Dangote, 10 barres de fer de 12',
                    filled: true,
                    fillColor: const Color(0xFF141228),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _maxBudgetController,
                  keyboardType: TextInputType.number,
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    labelText: 'Budget Max estimé (FCFA)',
                    filled: true,
                    fillColor: const Color(0xFF141228),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ] else ...[
                TextField(
                  controller: _instructionsController,
                  maxLines: 4,
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    labelText: 'Instructions détaillées pour l\'agent',
                    hintText: 'Précisez vos besoins pour l\'agent de terrain...',
                    filled: true,
                    fillColor: const Color(0xFF141228),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ],

              const SizedBox(height: 32),

              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: isSubmitting ? null : _submitRequest,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF7C3AED),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: isSubmitting
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Text('Soumettre & Bloquer le Séquestre (25 000 FCFA)', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
