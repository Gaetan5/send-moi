import 'package:flutter/material.dart';

class PhoneOtpScreen extends StatefulWidget {
  final VoidCallback onAuthSuccess;

  const PhoneOtpScreen({super.key, required this.onAuthSuccess});

  @override
  State<PhoneOtpScreen> createState() => _PhoneOtpScreenState();
}

class _PhoneOtpScreenState extends State<PhoneOtpScreen> {
  bool isOtpSent = false;
  final _phoneController = TextEditingController(text: '+237 699 00 00 00');
  final _otpController = TextEditingController();

  @override
  void dispose() {
    _phoneController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  void _requestOtp() {
    if (_phoneController.text.isEmpty) return;
    setState(() => isOtpSent = true);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        backgroundColor: Color(0xFF7C3AED),
        content: Text('🔑 Code OTP envoyé par SMS (Ex de test : 123456)'),
      ),
    );
  }

  void _verifyOtp() {
    if (_otpController.text == '123456' || _otpController.text.length == 6) {
      widget.onAuthSuccess();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: Colors.redAccent,
          content: Text('Code OTP invalide. Réessayez avec 123456.'),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0914),
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
                    : 'Saisissez votre numéro de téléphone pour vous connecter.',
                style: const TextStyle(fontSize: 14, color: Colors.white70),
              ),
              const SizedBox(height: 32),

              if (!isOtpSent) ...[
                TextField(
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    labelText: 'Numéro de téléphone',
                    prefixIcon: const Icon(Icons.phone, color: Color(0xFF7C3AED)),
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
                    onPressed: _requestOtp,
                    child: const Text('Recevoir le code OTP par SMS'),
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
