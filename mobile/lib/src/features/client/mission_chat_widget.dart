import 'package:flutter/material.dart';

class ChatMessage {
  final String sender;
  final String text;
  final bool isClient;
  final DateTime time;

  ChatMessage({
    required this.sender,
    required this.text,
    required this.isClient,
    required this.time,
  });
}

class MissionChatWidget extends StatefulWidget {
  final String agentName;

  const MissionChatWidget({super.key, required this.agentName});

  @override
  State<MissionChatWidget> createState() => _MissionChatWidgetState();
}

class _MissionChatWidgetState extends State<MissionChatWidget> {
  final List<ChatMessage> _messages = [
    ChatMessage(
      sender: 'Agent Samuel',
      text: 'Bonjour ! Je suis en route pour le chantier à Makepe.',
      isClient: false,
      time: DateTime.now().subtract(const Duration(minutes: 25)),
    ),
    ChatMessage(
      sender: 'Vous',
      text: 'Super ! N\'oubliez pas de prendre une photo sous les poteaux du R+1.',
      isClient: true,
      time: DateTime.now().subtract(const Duration(minutes: 20)),
    ),
  ];

  final _textController = TextEditingController();

  void _sendMessage() {
    if (_textController.text.trim().isEmpty) return;
    setState(() {
      _messages.add(
        ChatMessage(
          sender: 'Vous',
          text: _textController.text.trim(),
          isClient: true,
          time: DateTime.now(),
        ),
      );
      _textController.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 300,
      decoration: BoxDecoration(
        color: const Color(0xFF141228),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white10),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: const BoxDecoration(
              border: Border(bottom: BorderSide(color: Colors.white10)),
            ),
            child: Row(
              children: [
                const Icon(Icons.chat_bubble, color: Color(0xFF7C3AED), size: 18),
                const SizedBox(width: 8),
                Text('Messagerie Directe — ${widget.agentName}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              ],
            ),
          ),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final msg = _messages[index];
                return Align(
                  alignment: msg.isClient ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: msg.isClient ? const Color(0xFF7C3AED) : const Color(0xFF1E1B38),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      msg.text,
                      style: const TextStyle(color: Colors.white, fontSize: 12),
                    ),
                  ),
                );
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _textController,
                    style: const TextStyle(fontSize: 13, color: Colors.white),
                    decoration: InputDecoration(
                      hintText: 'Écrire à l\'agent...',
                      hintStyle: const TextStyle(fontSize: 12, color: Colors.white38),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      filled: true,
                      fillColor: const Color(0xFF0A0914),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide.none),
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
    );
  }
}
