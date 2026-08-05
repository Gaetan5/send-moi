import 'package:flutter_riverpod/flutter_riverpod.dart';

enum UserRole { client, agent }

class UserRoleNotifier extends StateNotifier<UserRole> {
  UserRoleNotifier() : super(UserRole.client);

  void toggleRole() {
    state = state == UserRole.client ? UserRole.agent : UserRole.client;
  }

  void setRole(UserRole role) {
    state = role;
  }
}

final userRoleProvider = StateNotifierProvider<UserRoleNotifier, UserRole>((ref) {
  return UserRoleNotifier();
});
