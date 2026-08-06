import 'package:flutter/material.dart';
import 'mission_chat_widget.dart';

class MissionTrackingScreen extends StatefulWidget {
  final String missionTitle;
  final String agentName;
  final String city;

  const MissionTrackingScreen({
    super.key,
    required this.missionTitle,
    required this.agentName,
    required this.city,
  });

  @override
  State<MissionTrackingScreen> createState() => _MissionTrackingScreenState();
}

class _MissionTrackingScreenState extends State<MissionTrackingScreen> {
  bool isDisputed = false;
  bool isValidated = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.missionTitle),
        backgroundColor: const Color(0xFF141228),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status Header
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF141228),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white10),
              ),
              child: Row(
                children: [
                  Icon(
                    isValidated
                        ? Icons.check_circle
                        : isDisputed
                            ? Icons.warning
                            : Icons.photo_camera,
                    color: isValidated
                        ? const Color(0xFF4ADE80)
                        : isDisputed
                            ? Colors.redAccent
                            : const Color(0xFF7C3AED),
                    size: 32,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          isValidated
                              ? 'Mission Validée & Agent Payé'
                              : isDisputed
                                  ? 'Litige ouvert — Examen sous 24h'
                                  : 'Preuve Soumise par l\'Agent',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white),
                        ),
                        Text(
                          'Agent : ${widget.agentName} (${widget.city})',
                          style: const TextStyle(fontSize: 12, color: Colors.white70),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            const Text(
              'Preuve Photo Horodatée & Géolocalisée',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            const SizedBox(height: 12),

            // Proof Image Preview Box with GPS Metadata
            Container(
              height: 220,
              width: double.infinity,
              decoration: BoxDecoration(
                color: const Color(0xFF1E1B38),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF7C3AED).withValues(alpha: 0.4)),
              ),
              child: Stack(
                children: [
                  const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.image, size: 48, color: Colors.white38),
                        SizedBox(height: 8),
                        Text('Photo HD : Coulage dalle béton Makepe', style: TextStyle(color: Colors.white70, fontSize: 13)),
                      ],
                    ),
                  ),
                  Positioned(
                    bottom: 12,
                    left: 12,
                    right: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.8),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: const [
                          Text('📍 4.0511° N, 9.7679° E (Douala)', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                          Text('⏱️ Aujourd\'hui 14:32', style: TextStyle(color: Color(0xFF4ADE80), fontSize: 11)),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Realtime Chat Widget
            MissionChatWidget(agentName: widget.agentName),

            const SizedBox(height: 24),

            // Escrow Validation Actions
            if (!isValidated && !isDisputed) ...[
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton.icon(
                  onPressed: () {
                    setState(() => isValidated = true);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        backgroundColor: Color(0xFF16A34A),
                        content: Text('✓ Preuve validée ! Fonds débloqués et versés à l\'agent.'),
                      ),
                    );
                  },
                  icon: const Icon(Icons.check),
                  label: const Text('Confirmer & Libérer les fonds (Séquestre)'),
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF16A34A)),
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: OutlinedButton.icon(
                  onPressed: () {
                    setState(() => isDisputed = true);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        backgroundColor: Colors.redAccent,
                        content: Text('⚠️ Litige ouvert. Le paiement reste gelé sous séquestre.'),
                      ),
                    );
                  },
                  icon: const Icon(Icons.flag, color: Colors.redAccent),
                  label: const Text('Refuser la preuve / Ouvrir un litige', style: TextStyle(color: Colors.redAccent)),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
