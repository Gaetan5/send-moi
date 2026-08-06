import 'package:flutter/material.dart';
import '../../core/realtime_client.dart';

class MessagesScreen extends StatefulWidget {
  final String missionId;

  const MessagesScreen({super.key, this.missionId = 'demo_mission_123'});

  @override
  State<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends State<MessagesScreen> {
  final List<Map<String, String>> messages = [
    {'sender': 'Agent Terrain', 'text': 'Bonjour ! Je suis en route vers le chantier.'},
    {'sender': 'Moi', 'text': 'Super, merci de vérifier le coulage de la dalle à l\'arrivée.'},
  ];

  final _msgController = TextEditingController();

  @override
  void initState() {
    super.initState();
    RealtimeClient.joinMission(widget.missionId);
    RealtimeClient.onChatMessage((senderId, text) {
      if (mounted) {
        setState(() {
          messages.add({'sender': 'Agent Terrain', 'text': text});
        });
      }
    });
  }

  @override
  void dispose() {
    _msgController.dispose();
    super.dispose();
  }

  void _sendMessage() {
    if (_msgController.text.trim().isEmpty) return;

    final text = _msgController.text.trim();
    RealtimeClient.sendChatMessage(widget.missionId, text);

    setState(() {
      messages.add({'sender': 'Moi', 'text': text});
      _msgController.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0B0A14),
      appBar: AppBar(
        title: const Text('Messagerie Temps Réel'),
        backgroundColor: const Color(0xFF141228),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: messages.length,
                itemBuilder: (ctx, i) {
                  final msg = messages[i];
                  final isMe = msg['sender'] == 'Moi';

                  return Align(
                    alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      decoration: BoxDecoration(
                        color: isMe ? const Color(0xFF7C3AED) : const Color(0xFF141228),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Column(
                        crossAxisAlignment: isMe ? CrossAlignment.end : CrossAlignment.start,
                        children: [
                          Text(msg['sender']!, style: const TextStyle(color: Colors.white54, fontSize: 10, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 4),
                          Text(msg['text']!, style: const TextStyle(color: Colors.white, fontSize: 14)),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
            Container(
              padding: const EdgeInsets.all(12),
              color: const Color(0xFF141228),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _msgController,
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        hintText: 'Écrire un message en direct...',
                        hintStyle: const TextStyle(color: Colors.white54),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12),
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.send, color: Color(0xFF7C3AED)),
                    onPressed: _sendMessage,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
