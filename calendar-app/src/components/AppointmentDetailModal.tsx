import React, { useEffect, useState } from 'react';
import { View, Modal, StyleSheet, TouchableOpacity, ScrollView, TouchableWithoutFeedback, Dimensions, InteractionManager } from 'react-native';
import { X, Calendar, Clock, Users, Bell, MapPin, AlignLeft } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring, 
  Easing, 
  runOnJS 
} from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius } from '../theme/Theme';
import { ThemeText } from './ThemeText';
import { ThemeButton } from './ThemeButton';
import { Appointment } from '../hooks/useAppointments';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AppointmentDetailModalProps {
  isVisible: boolean;
  appointment: Appointment | null;
  onClose: () => void;
  onDelete?: (id: number) => void;
  onEdit?: (appointment: Appointment) => void;
}

export const AppointmentDetailModal: React.FC<AppointmentDetailModalProps> = ({ 
  isVisible, 
  appointment, 
  onClose,
  onDelete,
  onEdit
}) => {
  const [shouldRender, setShouldRender] = useState(isVisible);
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withTiming(0, { 
        duration: 400, 
        easing: Easing.out(Easing.cubic) 
      });
    } else {
      opacity.value = withTiming(0, { duration: 250 });
      translateY.value = withTiming(SCREEN_HEIGHT, { 
        duration: 300,
        easing: Easing.in(Easing.cubic)
      }, (finished) => {
        if (finished) {
          runOnJS(setShouldRender)(false);
        }
      });
    }
  }, [isVisible]);

  const animatedOverlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const animatedContentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleClose = () => {
    onClose();
  };

  const getReminderLabel = (minutes: number) => {
    if (!minutes || minutes === 0) return 'Không nhắc';
    if (minutes < 60) return `Trước ${minutes} phút`;
    
    // Specially handle 12 hours as requested
    if (minutes === 720) return 'Trước 12 tiếng';
    
    // Check if it's exactly one or more days
    if (minutes % 1440 === 0) {
      return `Trước ${minutes / 1440} ngày`;
    }
    
    // Check if it's exactly one or more hours
    if (minutes % 60 === 0) {
      return `Trước ${minutes / 60} tiếng`;
    }
    
    return `Trước ${minutes} phút`;
  };

  if (!shouldRender && !isVisible) return null;

  return (
    <Modal
      visible={shouldRender}
      animationType="none"
      transparent={true}
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View style={[styles.modalOverlay, animatedOverlayStyle]} />
        </TouchableWithoutFeedback>
        
        <Animated.View style={[styles.modalContent, animatedContentStyle]}>
          <View style={styles.header}>
            <ThemeText variant="h3" numberOfLines={1} style={styles.headerTitle}>Chi tiết lịch hẹn</ThemeText>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={18} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={styles.scrollContent}
          >
            <ThemeText style={styles.title}>{appointment?.title}</ThemeText>

            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <Calendar size={20} color={Colors.primary} />
              </View>
              <View>
                <ThemeText color={Colors.textSecondary} variant="small">NGÀY</ThemeText>
                <ThemeText style={styles.infoText}>
                  {appointment?.date ? new Date(appointment.date).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                </ThemeText>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <Clock size={20} color={Colors.primary} />
              </View>
              <View>
                <ThemeText color={Colors.textSecondary} variant="small">THỜI GIAN</ThemeText>
                <ThemeText style={styles.infoText}>
                  {appointment?.time} {appointment?.endTime ? `- ${appointment.endTime}` : ''}
                </ThemeText>
              </View>
            </View>

            {appointment?.location && (
              <View style={styles.infoRow}>
                <View style={styles.iconContainer}>
                  <MapPin size={20} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemeText color={Colors.textSecondary} variant="small">ĐỊA ĐIỂM</ThemeText>
                  <ThemeText style={styles.infoText}>
                    {appointment.location}
                  </ThemeText>
                </View>
              </View>
            )}

            {appointment?.description && (
              <View style={styles.infoRow}>
                <View style={styles.iconContainer}>
                  <AlignLeft size={20} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemeText color={Colors.textSecondary} variant="small">MÔ TẢ</ThemeText>
                  <ThemeText style={[styles.infoText, { fontWeight: '500', lineHeight: 22 }]}>
                    {appointment.description}
                  </ThemeText>
                </View>
              </View>
            )}

            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <Bell size={20} color={Colors.primary} />
              </View>
              <View>
                <ThemeText color={Colors.textSecondary} variant="small">NHẮC NHỞ</ThemeText>
                <ThemeText style={styles.infoText}>
                  {getReminderLabel(appointment?.reminder || 0)}
                </ThemeText>
              </View>
            </View>

            {appointment?.attendees && appointment.attendees.length > 0 && (
              <View style={styles.infoRow}>
                <View style={styles.iconContainer}>
                  <Users size={20} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemeText color={Colors.textSecondary} variant="small">NGƯỜI THAM GIA</ThemeText>
                  <View style={styles.attendeesList}>
                    {appointment.attendees.map((person) => (
                      <View key={person.id} style={styles.attendeeTag}>
                        <ThemeText variant="small">{person.name}</ThemeText>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}

            <View style={styles.actionContainer}>
              {onEdit && appointment && (
                <ThemeButton 
                  title="Chỉnh sửa" 
                  variant="secondary" 
                  onPress={() => onEdit(appointment)}
                  style={styles.actionBtn}
                />
              )}
              {onDelete && appointment && (
                <ThemeButton 
                  title="Xóa lịch hẹn" 
                  variant="outline" 
                  onPress={() => onDelete(appointment.id)}
                  style={styles.actionBtn}
                />
              )}
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.xl,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    flex: 1,
    marginRight: Spacing.md,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: Spacing.xl,
    lineHeight: 34,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xl,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F5F5F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  infoText: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  attendeesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  attendeeTag: {
    backgroundColor: '#F5F5F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  actionContainer: {
    marginTop: Spacing.xl,
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
  }
});
