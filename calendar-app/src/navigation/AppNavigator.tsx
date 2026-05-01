import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import CalendarScreen from '../screens/CalendarScreen';
import AddEventScreen from '../screens/AddEventScreen';
import PeopleScreen from '../screens/PeopleScreen';
import CalendarMonthScreen from '../screens/CalendarMonthScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ChatbotScreen from '../screens/ChatbotScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AppointmentDetailScreen from '../screens/AppointmentDetailScreen';
import { useAuthStore } from '../store/useAuthStore';
import { ThemeHeader } from '../components/ThemeHeader';
import { Colors } from '../theme/Theme';

const Stack = createNativeStackNavigator();
const Tab = createMaterialTopTabNavigator();

const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.background,
    card: Colors.background,
  },
};

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <ThemeHeader {...props} />}
      screenOptions={{
        swipeEnabled: true,
      }}
    >
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="MonthCalendar" component={CalendarMonthScreen} />
      <Tab.Screen name="Chatbot" component={ChatbotScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

import { navigationRef } from './navigationUtils';

export default function AppNavigator() {
  const user = useAuthStore((state) => state.user);

  return (
    <NavigationContainer theme={AppTheme} ref={navigationRef}>
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background }
        }}
      >
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen 
              name="AddEvent" 
              component={AddEventScreen} 
              options={{ 
                presentation: 'modal',
                animation: 'slide_from_bottom' 
              }} 
            />
            <Stack.Screen 
              name="AppointmentDetail" 
              component={AppointmentDetailScreen} 
              options={{ 
                presentation: 'modal',
                animation: 'slide_from_bottom' 
              }} 
            />
            <Stack.Screen 
              name="People" 
              component={PeopleScreen} 
              options={{ headerShown: true, title: 'Bạn bè' }} 
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
