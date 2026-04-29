import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator, StyleProp } from 'react-native';
import { Colors, BorderRadius, Spacing, Typography } from '../theme/Theme';

interface ThemeButtonProps {
  title?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  active?: boolean;
  disabled?: boolean;
  loading?: boolean;
  children?: React.ReactNode;
}

export const ThemeButton: React.FC<ThemeButtonProps> = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  size = 'md',
  icon,
  style,
  textStyle,
  active = false,
  disabled = false,
  loading = false,
  children
}) => {
  const getStyles = () => {
    let base: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: BorderRadius.xl,
    };
    
    let text: TextStyle = {
      ...Typography.body,
      textAlign: 'center',
    };
    
    // Size styles
    if (size === 'sm') {
      base.paddingVertical = 8;
      base.paddingHorizontal = 16;
      text = { ...Typography.small };
    } else if (size === 'md') {
      base.paddingVertical = 12;
      base.paddingHorizontal = 24;
    } else if (size === 'lg') {
      base.height = 60;
      base.paddingHorizontal = 24;
      text = { ...Typography.body, fontSize: 17 };
    }

    // Variant styles
    if (variant === 'primary') {
      base.backgroundColor = Colors.primary;
      text.color = Colors.white;
    } else if (variant === 'secondary') {
      base.backgroundColor = Colors.secondary;
      text.color = Colors.text;
    } else if (variant === 'outline') {
      base.borderWidth = 1;
      base.borderColor = Colors.secondary;
      base.backgroundColor = 'transparent';
      text.color = Colors.text;
    } else if (variant === 'ghost') {
      base.backgroundColor = 'transparent';
      text.color = Colors.text;
    }

    if (active) {
      base.backgroundColor = Colors.primary;
      text.color = Colors.white;
    }

    if (disabled || loading) {
      base.opacity = 0.5;
    }

    return { base, text };
  };

  const { base, text } = getStyles();

  return (
    <TouchableOpacity 
      style={[base, style]} 
      onPress={onPress} 
      activeOpacity={0.8}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={text.color} size="small" />
      ) : (
        <>
          {icon && icon}
          {title && <Text numberOfLines={1} ellipsizeMode="tail" style={[text, textStyle, (icon || children) && title ? { marginLeft: 8 } : {}]}>{title}</Text>}
          {children}
        </>
      )}
    </TouchableOpacity>
  );
};
