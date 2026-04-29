import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { Colors, Typography } from '../theme/Theme';

interface ThemeTextProps extends TextProps {
  variant?: keyof typeof Typography;
  color?: string;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
}

export const ThemeText: React.FC<ThemeTextProps> = ({ 
  variant = 'body', 
  color = Colors.text, 
  align = 'left',
  style, 
  children, 
  ...props 
}) => {
  return (
    <Text 
      style={[
        Typography[variant], 
        { color, textAlign: align }, 
        style
      ]} 
      {...props}
    >
      {children}
    </Text>
  );
};
