import 'package:flutter/foundation.dart';

class PendingProofAction {
  final String missionId;
  final String mediaPath;
  final double latitude;
  final double longitude;
  final DateTime timestamp;

  PendingProofAction({
    required this.missionId,
    required this.mediaPath,
    required this.latitude,
    required this.longitude,
    required this.timestamp,
  });

  Map<String, dynamic> toJson() => {
        'missionId': missionId,
        'mediaPath': mediaPath,
        'latitude': latitude,
        'longitude': longitude,
        'timestamp': timestamp.toIso8601String(),
      };

  factory PendingProofAction.fromJson(Map<String, dynamic> json) {
    return PendingProofAction(
      missionId: json['missionId'],
      mediaPath: json['mediaPath'],
      latitude: json['latitude'],
      longitude: json['longitude'],
      timestamp: DateTime.parse(json['timestamp']),
    );
  }
}

class OfflineQueueService extends ChangeNotifier {
  final List<PendingProofAction> _queue = [];

  List<PendingProofAction> get pendingActions => List.unmodifiable(_queue);

  void addPendingProof(PendingProofAction action) {
    _queue.add(action);
    _saveToDisk();
    notifyListeners();
    debugPrint('⚡ [OfflineQueue] Preuve sauvegardée sur disque pour la mission ${action.missionId}');
  }

  void _saveToDisk() {
    // In production Flutter app: Hive.box('offline_actions').put('queue', _queue.map((e) => e.toJson()).toList());
    debugPrint('💾 [OfflineQueue] File d\'attente synchronisée sur le stockage local du téléphone.');
  }

  Future<void> syncQueue() async {
    if (_queue.isEmpty) return;
    debugPrint('🔄 [OfflineQueue] Tentative de synchronisation de ${_queue.length} preuves...');
    
    // Simulate uploading queue items once connectivity is restored
    _queue.clear();
    _saveToDisk();
    notifyListeners();
    debugPrint('✅ [OfflineQueue] File d\'attente synchronisée avec succès !');
  }
}
