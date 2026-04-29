import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Toaster } from 'react-native-sonner';
import { ThemeAlert } from './src/components/ThemeAlert';
import AppNavigator from './src/navigation/AppNavigator';
import { initDB } from './src/db/database';
import { registerForPushNotificationsAsync } from './src/utils/notifications';
import { View, Text } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './src/store/useAuthStore';

// Create a client
const queryClient = new QueryClient();

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const getMe = useAuthStore((state) => state.getMe);

  useEffect(() => {
    async function setup() {
      try {
        await initDB();
        await registerForPushNotificationsAsync();
        // Try to fetch user profile on app start
        await getMe();
      } catch (e) {
        console.warn(e);
      } finally {
        setIsReady(true);
      }
    }
    setup();
  }, [getMe]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <AppNavigator />
          <Toaster theme="light" />
          <ThemeAlert />
          <StatusBar style="auto" />
        </QueryClientProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
