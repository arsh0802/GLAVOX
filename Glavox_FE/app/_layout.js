import { Stack } from "expo-router";
import { AuthProvider } from '../context/AuthContext';

export default function Layout() {
  return (
    <AuthProvider>
      <Stack 
        screenOptions={{ 
          headerShown: false,
          gestureEnabled: true,
          animation: 'slide_from_right'
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login_page" />
        <Stack.Screen name="signup_page" />
        <Stack.Screen name="home_screen" />
        <Stack.Screen name="profile_screen" />
        <Stack.Screen name="edit_profile" />
        <Stack.Screen name="Ai_page" />
        <Stack.Screen name="ForgotPasswordPage" />
      </Stack>
    </AuthProvider>
  );
}
