import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

class ApiClient {
  static const String baseUrl = String.fromEnvironment('API_BASE_URL', defaultValue: 'http://localhost:3000');
  static const _storage = FlutterSecureStorage();
  static String? _jwtToken;

  static Future<void> init() async {
    _jwtToken = await _storage.read(key: 'jwt_token');
  }

  static Future<void> setAuthToken(String token) async {
    _jwtToken = token;
    await _storage.write(key: 'jwt_token', value: token);
  }

  static Future<void> clearAuthToken() async {
    _jwtToken = null;
    await _storage.delete(key: 'jwt_token');
  }

  static Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (_jwtToken != null) 'Authorization': 'Bearer $_jwtToken',
      };

  static Future<dynamic> get(String path) async {
    final response = await http.get(Uri.parse('$baseUrl$path'), headers: _headers);
    return _handleResponse(response);
  }

  static Future<dynamic> post(String path, Map<String, dynamic> body) async {
    final response = await http.post(
      Uri.parse('$baseUrl$path'),
      headers: _headers,
      body: jsonEncode(body),
    );
    return _handleResponse(response);
  }

  static Future<dynamic> patch(String path, [Map<String, dynamic>? body]) async {
    final response = await http.patch(
      Uri.parse('$baseUrl$path'),
      headers: _headers,
      body: body != null ? jsonEncode(body) : null,
    );
    return _handleResponse(response);
  }

  static dynamic _handleResponse(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (response.body.isEmpty) return null;
      return jsonDecode(response.body);
    } else {
      debugPrint('⚠️ [API Error] ${response.statusCode}: ${response.body}');
      throw Exception('Erreur API (${response.statusCode}): ${response.body}');
    }
  }
}
