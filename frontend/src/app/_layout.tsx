import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/colors';

// Prevent splash screen from auto-hiding before navigation is ready
SplashScreen.preventAutoHideAsync().catch(() => {
  // Splash screen might already be hidden in some environments
});

export default function RootLayout() {
  useEffect(() => {
    // Hide native splash screen once React component mounts
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.warmIvory },
          animation: 'fade',
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
            title: 'Splash',
          }}
        />
        <Stack.Screen
          name="login"
          options={{
            headerShown: false,
            title: 'Login',
            animation: 'fade_from_bottom',
          }}
        />
        <Stack.Screen
          name="register"
          options={{
            headerShown: false,
            title: 'Registration',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="home"
          options={{
            headerShown: false,
            title: 'Home Dashboard',
            animation: 'fade',
          }}
        />
      </Stack>
    </>
  );
}
