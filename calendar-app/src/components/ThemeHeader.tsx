import React from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Calendar, MessageSquare, Settings, User } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius } from '../theme/Theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HORIZONTAL_PADDING = Spacing.lg;
const TAB_BAR_WIDTH = SCREEN_WIDTH - (HORIZONTAL_PADDING * 2);
const TAB_WIDTH = TAB_BAR_WIDTH / 4;

export const ThemeHeader = ({ state, descriptors, navigation, position }: any) => {
  const insets = useSafeAreaInsets();
  
  if (!state) return null;

  // Animation for the active pill background
  const translateX = position.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: [0, TAB_WIDTH, TAB_WIDTH * 2, TAB_WIDTH * 3],
    extrapolate: 'clamp',
  });

  const tabs = [
    { name: 'Calendar', Icon: Home },
    { name: 'MonthCalendar', Icon: Calendar },
    { name: 'Chatbot', Icon: MessageSquare },
    { name: 'Profile', Icon: User },
  ];

  const handleTabPress = (routeName: string, isFocused: boolean) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: routeName,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(routeName);
    }
  };

  return (
    <View style={[styles.headerContainer, { paddingTop: insets.top + Spacing.sm }]}>
      <View style={styles.header}>
        <View style={styles.tabBarContainer}>
          {/* Sliding active background */}
          <Animated.View 
            style={[
              styles.activePill, 
              { 
                width: TAB_WIDTH - 8,
                transform: [{ translateX: Animated.add(translateX, new Animated.Value(4)) }] 
              }
            ]} 
          />
          
          {tabs.map((tab, index) => {
            const isFocused = state.index === index;
            const IconComponent = tab.Icon;

            // Opacity for the white icon (only visible when pill is underneath)
            const whiteOpacity = position.interpolate({
              inputRange: [index - 0.6, index, index + 0.6],
              outputRange: [0, 1, 0],
              extrapolate: 'clamp',
            });

            // Opacity for the black icon (fades out when pill is underneath)
            const blackOpacity = position.interpolate({
              inputRange: [index - 0.6, index, index + 0.6],
              outputRange: [1, 0, 1],
              extrapolate: 'clamp',
            });

            return (
              <TouchableOpacity 
                key={tab.name}
                style={[styles.tabButton, { width: TAB_WIDTH }]} 
                onPress={() => handleTabPress(tab.name, isFocused)}
                activeOpacity={0.7}
              >
                <View style={styles.iconStack}>
                  {/* Black Icon (Default) */}
                  <Animated.View style={{ opacity: blackOpacity }}>
                    <IconComponent size={22} color={Colors.text} />
                  </Animated.View>
                  
                  {/* White Icon (Active - Overlayed) */}
                  <Animated.View style={[StyleSheet.absoluteFill, { opacity: whiteOpacity, justifyContent: 'center', alignItems: 'center' }]}>
                    <IconComponent size={22} color={Colors.white} />
                  </Animated.View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: Colors.background,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: Spacing.md,
  },
  tabBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.round,
    paddingVertical: 4,
    height: 48,
    width: TAB_BAR_WIDTH,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  activePill: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    backgroundColor: Colors.black,
    borderRadius: BorderRadius.round,
  },
  tabButton: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  iconStack: {
    width: 22,
    height: 22,
    position: 'relative',
  }
});
