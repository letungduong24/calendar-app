import './src/polyfills';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Toaster } from 'react-native-sonner';
import { ThemeAlert } from './src/components/ThemeAlert';
import AppNavigator from './src/navigation/AppNavigator';
import { initDB } from './src/db/database';
import { registerForPushNotificationsAsync } from './src/utils/notifications';
import { View, Text, ActivityIndicator, Image } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './src/api/queryClient';
import { useAuthStore } from './src/store/useAuthStore';
import { Colors } from './src/theme/Theme';

import * as Notifications from 'expo-notifications';
import { navigate } from './src/navigation/navigationUtils';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const getMe = useAuthStore((state) => state.getMe);

  useEffect(() => {
    // Listener for when user clicks a notification
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const appointmentId = response.notification.request.content.data.appointmentId;
      console.log('Notification clicked, appointmentId:', appointmentId);
      if (appointmentId) {
        navigate('AppointmentDetail', { appointmentId });
      }
    });

    return () => subscription.remove();
  }, []);

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
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: Colors.background 
      }}>
        <View style={{ alignItems: 'center' }}>
          <Image 
            source={require('./assets/icon.png')} 
            style={{ 
              width: 100, 
              height: 100, 
              borderRadius: 24,
              marginBottom: 20,
            }} 
          />
          <Text style={{ 
            fontSize: 28, 
            fontWeight: '900', 
            color: Colors.text,
            letterSpacing: 1
          }}>
            Ailendar
          </Text>
          <ActivityIndicator 
            color={Colors.primary} 
            size="small" 
            style={{ marginTop: 40 }} 
          />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
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
    </View>
  );
}
