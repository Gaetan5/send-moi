import 'package:flutter/material.dart';

class SendMoiTheme {
  static const Color primary = Color(0xFF5B21B6);
  static const Color primaryLight = Color(0xFF7C3AED);
  static const Color success = Color(0xFF16A34A);
  static const Color bgDark = Color(0xFF0A0914);
  static const Color bgCard = Color(0xFF141228);
  static const Color textMain = Color(0xFFF3F4F6);
  static const Color textMuted = Color(0xFF9CA3AF);

  static ThemeData get darkTheme {
    return ThemeData.dark().copyWith(
      scaffoldBackgroundColor: bgDark,
      primaryColor: primary,
      colorScheme: const ColorScheme.dark(
        primary: primaryLight,
        secondary: success,
        surface: bgCard,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: bgCard,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(
          color: textMain,
          fontSize: 18,
          fontWeight: FontWeight.bold,
        ),
      ),
      cardTheme: CardThemeData(
        color: bgCard,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: Colors.white10),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryLight,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(30),
          ),
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 24),
          textStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
        ),
      ),
    );
  }
}
