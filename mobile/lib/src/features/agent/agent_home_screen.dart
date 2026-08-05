import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'agent_kyc_screen.dart';

class AgentHomeScreen extends ConsumerStatefulWidget {
  const AgentHomeScreen({super.key});

  @override
  ConsumerState<AgentHomeScreen> createState() => _AgentHomeScreenState();
}

class _AgentHomeScreenState extends ConsumerState<AgentHomeScreen> {
  int secondsRemaining = 300; // 5 minutes timer
  Timer? _timer;
  bool isMissionAccepted = false;
  bool isProofCaptured = false;

  @override
  void initState() {
    super.initState();
    _startCountdown();
  }

  void _startCountdown() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (secondsRemaining > 0 && !isMissionAccepted) {
        setState(() => secondsRemaining--);
      } else {
        timer.cancel();
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  String get formattedTime {
    final minutes = (secondsRemaining ~/ 60).toString().padLeft(2, '0');
    final seconds = (secondsRemaining % 60).toString().padLeft(2, '0');
    return '$minutes:$seconds';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Espace Agent — Douala / Yaoundé'),
        backgroundColor: const Color(0xFF141228),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Agent Profile & Wallet Header
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Row(
                  children: [
                    const CircleAvatar(
                      backgroundColor: Color(0xFF7C3AED),
                      child: Text('SK', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Text('Samuel Kouamé', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                          Text('Agent Vérifié • Douala (Makepe)', style: TextStyle(fontSize: 12, color: Colors.white70)),
                        ],
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        const Text('Solde Semaine', style: TextStyle(fontSize: 10, color: Colors.white60)),
                        const Text('85 000 FCFA', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF4ADE80))),
                        const SizedBox(height: 4),
                        InkWell(
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(builder: (context) => const AgentKycScreen()),
                            );
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFF7C3AED).withValues(alpha: 0.3),
                              borderRadius: BorderRadius.circular(4),
                              border: Border.all(color: const Color(0xFF7C3AED)),
                            ),
                            child: const Text('Dossier KYC', style: TextStyle(fontSize: 10, color: Colors.white, fontWeight: FontWeight.bold)),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            const Text(
              'Mission Disponible (Compte à Rebours)',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            const SizedBox(height: 12),

            // Job Available Card with Timer
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFF5B21B6),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Text('SUPERVISION CHANTIER', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                        ),
                        Row(
                          children: [
                            const Icon(Icons.timer, size: 16, color: Color(0xFFD97706)),
                            const SizedBox(width: 4),
                            Text(
                              formattedTime,
                              style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFFD97706)),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    const Text('Inspection Dalle Béton R+1', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    const SizedBox(height: 4),
                    const Text('Lieu: Douala — Makepe, Bloc L', style: TextStyle(color: Colors.white70, fontSize: 13)),
                    const SizedBox(height: 4),
                    const Text('Rémunération Agent: 22 500 FCFA', style: TextStyle(color: Color(0xFF4ADE80), fontWeight: FontWeight.bold)),
                    const SizedBox(height: 16),

                    if (!isMissionAccepted)
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: () {
                            setState(() => isMissionAccepted = true);
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                backgroundColor: Color(0xFF16A34A),
                                content: Text('✓ Mission acceptée ! Rendez-vous sur le site à Makepe.'),
                              ),
                            );
                          },
                          style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF16A34A)),
                          child: const Text('Accepter la mission'),
                        ),
                      )
                    else ...[
                      const Divider(color: Colors.white10),
                      const SizedBox(height: 8),
                      const Text('📷 Prise de preuve (Appareil photo sécurisé avec GPS & Horodatage):', style: TextStyle(fontSize: 12, color: Colors.white70)),
                      const SizedBox(height: 12),

                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          onPressed: () {
                            setState(() => isProofCaptured = true);
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                backgroundColor: Color(0xFF7C3AED),
                                content: Text('📷 Photo capturée ! GPS: 4.0511° N, 9.7679° E (Vérifiée)'),
                              ),
                            );
                          },
                          icon: const Icon(Icons.camera_alt),
                          label: Text(isProofCaptured ? '✓ Photo de preuve enregistrée' : 'Prendre la photo horodatée'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: isProofCaptured ? const Color(0xFF16A34A) : const Color(0xFF7C3AED),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
