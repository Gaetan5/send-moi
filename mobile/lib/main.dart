import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'src/core/theme.dart';
import 'src/features/auth/phone_otp_screen.dart';
import 'src/features/role_switcher/role_provider.dart';
import 'src/features/client/client_home_screen.dart';
import 'src/features/agent/agent_home_screen.dart';

void main() {
  runApp(const ProviderScope(child: SendMoiApp()));
}

class SendMoiApp extends ConsumerStatefulWidget {
  const SendMoiApp({super.key});

  @override
  ConsumerState<SendMoiApp> createState() => _SendMoiAppState();
}

class _SendMoiAppState extends ConsumerState<SendMoiApp> {
  bool isAuthenticated = false;

  @override
  Widget build(BuildContext context) {
    final currentRole = ref.watch(userRoleProvider);

    return MaterialApp(
      title: 'Send Moi',
      debugShowCheckedModeBanner: false,
      theme: SendMoiTheme.darkTheme,
      home: !isAuthenticated
          ? PhoneOtpScreen(
              onAuthSuccess: () => setState(() => isAuthenticated = true),
            )
          : Scaffold(
              body: currentRole == UserRole.client
                  ? const ClientHomeScreen()
                  : const AgentHomeScreen(),
              bottomNavigationBar: BottomNavigationBar(
                backgroundColor: const Color(0xFF141228),
                selectedItemColor: const Color(0xFF7C3AED),
                unselectedItemColor: Colors.white60,
                currentIndex: currentRole == UserRole.client ? 0 : 1,
                onTap: (index) {
                  ref.read(userRoleProvider.notifier).setRole(
                        index == 0 ? UserRole.client : UserRole.agent,
                      );
                },
                items: const [
                  BottomNavigationBarItem(
                    icon: Icon(Icons.person),
                    label: 'Client',
                  ),
                  BottomNavigationBarItem(
                    icon: Icon(Icons.engineering),
                    label: 'Agent (Terrain)',
                  ),
                ],
              ),
            ),
    );
  }
}
