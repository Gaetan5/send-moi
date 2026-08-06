import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';
import '../../core/realtime_client.dart';

class PhoneOtpScreen extends ConsumerStatefulWidget {
  final VoidCallback? onAuthSuccess;

  const PhoneOtpScreen({super.key, this.onAuthSuccess});

  @override
  ConsumerState<PhoneOtpScreen> createState() => _PhoneOtpScreenState();
}

class _PhoneOtpScreenState extends ConsumerState<PhoneOtpScreen> {
  bool isOtpSent = false;
  bool isLoading = false;
  final _phoneController = TextEditingController(text: '+237 699 00 00 00');
  final _otpController = TextEditingController();

  @override
  void dispose() {
    _phoneController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  Future<void> _requestOtp() async {
    if (_phoneController.text.isEmpty) return;

    setState(() => isLoading = true);
    try {
      final cleanPhone = _phoneController.text.replaceAll(RegExp(r'\s+'), '').trim();
      await ApiClient.post('/auth/request-otp', {
        'phone': cleanPhone,
      });
      setState(() {
        isOtpSent = true;
        isLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: Color(0xFF16A34A),
            content: Text('📱 Code OTP envoyé par SMS à votre numéro.'),
          ),
        );
      }
    } catch (e) {
      setState(() => isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(backgroundColor: Colors.redAccent, content: Text('Erreur: ${e.toString()}')),
        );
      }
    }
  }

  Future<void> _verifyOtp() async {
    if (_otpController.text.isEmpty) return;

    setState(() => isLoading = true);
    try {
      final cleanPhone = _phoneController.text.replaceAll(RegExp(r'\s+'), '').trim();
      final response = await ApiClient.post('/auth/verify-otp', {
        'phone': cleanPhone,
        'code': _otpController.text.trim(),
      });

      final accessToken = response['accessToken'];
      if (accessToken != null) {
        ApiClient.setAuthToken(accessToken);
        RealtimeClient.connect(accessToken);
      }

      setState(() => isLoading = false);
      widget.onAuthSuccess?.call();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: Color(0xFF16A34A),
            content: Text('✓ Authentification réussie ! Connexion sécurisée.'),
          ),
        );
      }
    } catch (e) {
      setState(() => isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(backgroundColor: Colors.redAccent, content: Text('Code OTP invalide.')),
        );
      }
    }
  }

  Future<void> _googleAuth() async {
    setState(() => isLoading = true);
    try {
      final response = await ApiClient.post('/auth/google', {
        'googleId': 'google_user_demo_123',
        'email': 'user.demo@gmail.com',
        'fullName': 'Utilisateur Google',
        'avatarUrl': 'https://lh3.googleusercontent.com/a/default-user',
      });

      final accessToken = response['accessToken'];
      if (accessToken != null) {
        ApiClient.setAuthToken(accessToken);
        RealtimeClient.connect(accessToken);
      }

      setState(() => isLoading = false);
      widget.onAuthSuccess?.call();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: Color(0xFF16A34A),
            content: Text('✓ Authentification Google / Email réussie !'),
          ),
        );
      }
    } catch (e) {
      setState(() => isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(backgroundColor: Colors.redAccent, content: Text('Erreur Google: ${e.toString()}')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0B0A14),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: const Color(0xFF7C3AED).withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Icon(Icons.phone_android, color: Color(0xFF7C3AED), size: 32),
              ),
              const SizedBox(height: 24),
              const Text(
                'Bienvenue sur Send Moi',
                style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white),
              ),
              const SizedBox(height: 8),
              Text(
                isOtpSent
                    ? 'Entrez le code à 6 chiffres envoyé au ${_phoneController.text}'
                    : 'Choisissez votre mode de connexion (SMS OTP ou Compte Google).',
                style: const TextStyle(fontSize: 14, color: Colors.white70),
              ),
              const SizedBox(height: 32),

              if (!isOtpSent) ...[
                TextField(
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    labelText: 'Numéro de téléphone (+237...)',
                    prefixIcon: const Icon(Icons.phone, color: Color(0xFF7C3AED)),
                    filled: true,
                    fillColor: const Color(0xFF141228),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: _requestOtp,
                    child: const Text('Recevoir le code OTP par SMS'),
                  ),
                ),
                const SizedBox(height: 16),
                const Row(
                  children: [
                    Expanded(child: Divider(color: Colors.white24)),
                    Padding(
                      padding: EdgeInsets.symmetric(horizontal: 12),
                      child: Text('OU', style: TextStyle(color: Colors.white54, fontWeight: FontWeight.bold)),
                    ),
                    Expanded(child: Divider(color: Colors.white24)),
                  ],
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: OutlinedButton.icon(
                    onPressed: _googleAuth,
                    icon: const Icon(Icons.g_mobiledata, size: 28, color: Colors.white),
                    label: const Text('Continuer avec Google / Email', style: TextStyle(color: Colors.white)),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Colors.white24),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
              ] else ...[
                TextField(
                  controller: _otpController,
                  keyboardType: TextInputType.number,
                  maxLength: 6,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.white, fontSize: 24, letterSpacing: 8, fontWeight: FontWeight.bold),
                  decoration: InputDecoration(
                    hintText: '123456',
                    filled: true,
                    fillColor: const Color(0xFF141228),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: _verifyOtp,
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF16A34A)),
                    child: const Text('Valider et Accéder à l\'App'),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
