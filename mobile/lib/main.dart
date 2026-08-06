import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'src/core/theme.dart';
import 'src/core/api_client.dart';
import 'src/features/auth/phone_otp_screen.dart';
import 'src/features/role_switcher/role_provider.dart';
import 'src/features/client/client_home_screen.dart';
import 'src/features/client/my_requests_screen.dart';
import 'src/features/client/messages_screen.dart';
import 'src/features/client/profile_screen.dart';
import 'src/features/agent/agent_home_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ApiClient.init();
  runApp(const ProviderScope(child: SendMoiApp()));
}

class SendMoiApp extends ConsumerStatefulWidget {
  const SendMoiApp({super.key});

  @override
  ConsumerState<SendMoiApp> createState() => _SendMoiAppState();
}

class _SendMoiAppState extends ConsumerState<SendMoiApp> {
  bool isAuthenticated = false;
  int _currentTabIndex = 0;

  @override
  Widget build(BuildContext context) {
    final currentRole = ref.watch(userRoleProvider);

    final List<Widget> clientPages = [
      const ClientHomeScreen(),
      const MyRequestsScreen(),
      const MessagesScreen(),
      ProfileScreen(onLogout: () => setState(() => isAuthenticated = false)),
    ];

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
                  ? clientPages[_currentTabIndex]
                  : const AgentHomeScreen(),
              bottomNavigationBar: BottomNavigationBar(
                type: BottomNavigationBarType.fixed,
                backgroundColor: const Color(0xFF141228),
                selectedItemColor: const Color(0xFF7C3AED),
                unselectedItemColor: Colors.white60,
                currentIndex: currentRole == UserRole.client ? _currentTabIndex : 0,
                onTap: (index) {
                  if (currentRole == UserRole.client) {
                    setState(() => _currentTabIndex = index);
                  }
                },
                items: currentRole == UserRole.client
                    ? const [
                        BottomNavigationBarItem(
                          icon: Icon(Icons.home),
                          label: 'Accueil',
                        ),
                        BottomNavigationBarItem(
                          icon: Icon(Icons.list_alt),
                          label: 'Mes Demandes',
                        ),
                        BottomNavigationBarItem(
                          icon: Icon(Icons.chat_bubble_outline),
                          label: 'Messages',
                        ),
                        BottomNavigationBarItem(
                          icon: Icon(Icons.person_outline),
                          label: 'Profil',
                        ),
                      ]
                    : const [
                        BottomNavigationBarItem(
                          icon: Icon(Icons.engineering),
                          label: 'Missions Agent',
                        ),
                      ],
              ),
            ),
    );
  }
}
