import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'api_client.dart';

class RealtimeClient {
  static IO.Socket? _socket;

  /// Connect to backend WebSocket Gateway with Bearer JWT Token
  static void connect(String authToken) {
    if (_socket != null && _socket!.connected) return;

    final baseUrl = ApiClient.baseUrl;

    _socket = IO.io(
      baseUrl,
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .setAuth({'token': 'Bearer $authToken'})
          .build(),
    );

    _socket!.onConnect((_) {
      debugPrint('⚡ [WebSockets] Connecté au serveur temps réel Send Moi.');
    });

    _socket!.onDisconnect((_) {
      debugPrint('⚠️ [WebSockets] Déconnecté du serveur temps réel.');
    });

    _socket!.onError((err) {
      debugPrint('🚫 [WebSockets Error] $err');
    });

    _socket!.connect();
  }

  /// Join Mission Room for live GPS tracking & Instant Chat
  static void joinMission(String missionId) {
    _socket?.emit('join_mission', {'missionId': missionId});
  }

  /// Listen for Agent GPS Location updates in real-time
  static void onLocationUpdate(Function(double lat, double lng) callback) {
    _socket?.on('location_changed', (data) {
      if (data != null && data['lat'] != null && data['lng'] != null) {
        callback(
          (data['lat'] as num).toDouble(),
          (data['lng'] as num).toDouble(),
        );
      }
    });
  }

  /// Listen for new chat messages in real-time
  static void onChatMessage(Function(String senderId, String text) callback) {
    _socket?.on('new_chat_message', (data) {
      if (data != null && data['senderId'] != null && data['text'] != null) {
        callback(data['senderId'].toString(), data['text'].toString());
      }
    });
  }

  /// Send agent GPS location update
  static void sendLocationUpdate(String missionId, double lat, double lng) {
    _socket?.emit('agent_location_update', {
      'missionId': missionId,
      'lat': lat,
      'lng': lng,
    });
  }

  /// Send instant chat message
  static void sendChatMessage(String missionId, String text) {
    _socket?.emit('send_chat_message', {
      'missionId': missionId,
      'text': text,
    });
  }

  /// Disconnect socket
  static void disconnect() {
    _socket?.disconnect();
    _socket = null;
  }
}
