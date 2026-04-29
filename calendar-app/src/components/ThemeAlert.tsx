import React from 'react';
import { View, Modal, StyleSheet, TouchableWithoutFeedback, Dimensions } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius, Typography } from '../theme/Theme';
import { ThemeText } from './ThemeText';
import { ThemeButton } from './ThemeButton';
import { useAlertStore } from '../store/useAlertStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const ThemeAlert: React.FC = () => {
  const { isVisible, title, message, buttons, hide } = useAlertStore();

  if (!isVisible) return null;

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="none"
      onRequestClose={hide}
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={hide}>
          <Animated.View 
            entering={FadeIn.duration(200)} 
            exiting={FadeOut.duration(200)} 
            style={styles.backdrop} 
          />
        </TouchableWithoutFeedback>
        
        <Animated.View 
          entering={ZoomIn.duration(300).springify()} 
          exiting={ZoomOut.duration(200)} 
          style={styles.alertCard}
        >
          <ThemeText style={styles.title}>{title}</ThemeText>
          <ThemeText style={styles.message}>{message}</ThemeText>
          
          <View style={styles.buttonContainer}>
            {buttons.map((btn, index) => (
              <ThemeButton
                key={index}
                title={btn.text}
                variant={btn.variant || 'primary'}
                onPress={() => {
                  if (btn.onPress) btn.onPress();
                  hide();
                }}
                style={styles.button}
              />
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  alertCard: {
    width: SCREEN_WIDTH * 0.85,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    flexDirection: 'column-reverse',
    gap: 10, // Adjusted to be tighter but still distinct
  },
  button: {
    width: '100%',
  },
});
