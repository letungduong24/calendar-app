import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Calendar, Clock, Users, Bell, MapPin, AlignLeft, Edit3, Trash2 } from 'lucide-react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../theme/Theme';
import { ThemeText } from '../components/ThemeText';
import { ThemeButton } from '../components/ThemeButton';
import { useAppointments, Appointment } from '../hooks/useAppointments';
import { useAlertStore } from '../store/useAlertStore';
import apiClient from '../api/client';
import { toast } from 'react-native-sonner';

export default function AppointmentDetailScreen({ navigation, route }: any) {
  const { appointmentId } = route.params;
  const [appointment, setAppointment] = useState<Appointment | null>(route.params.appointment || null);
  const [loading, setLoading] = useState(!appointment);
  const { deleteAppointment } = useAppointments();
  const { show: showAlert } = useAlertStore();

  useEffect(() => {
    if (!appointment && appointmentId) {
      const fetchAppt = async () => {
        try {
          const res = await apiClient.get(`/appointments/${appointmentId}`);
          setAppointment(res.data);
        } catch (e) {
          toast.error('Không tìm thấy lịch hẹn');
          navigation.goBack();
        } finally {
          setLoading(false);
        }
      };
      fetchAppt();
    }
  }, [appointmentId]);

  const handleEdit = () => {
    if (!appointment) return;
    navigation.replace('AddEvent', { appointment });
  };

  const handleDelete = () => {
    if (!appointment) return;
    showAlert(
      'Xóa lịch hẹn',
      'Bạn có chắc chắn muốn xóa lịch hẹn này không?',
      [
        { text: 'Hủy', variant: 'outline' },
        { 
          text: 'Xóa', 
          variant: 'primary',
          onPress: async () => {
            try {
              await deleteAppointment(appointment.id);
              toast.success('Đã xóa lịch hẹn');
              navigation.goBack();
            } catch (e) {
              toast.error('Không thể xóa lịch hẹn');
            }
          }
        }
      ]
    );
  };

  const getReminderLabel = (minutes: number) => {
    if (!minutes || minutes === 0) return 'Không nhắc';
    if (minutes < 60) return `Trước ${minutes} phút`;
    if (minutes === 720) return 'Trước 12 tiếng';
    if (minutes % 1440 === 0) return `Trước ${minutes / 1440} ngày`;
    if (minutes % 60 === 0) return `Trước ${minutes / 60} tiếng`;
    return `Trước ${minutes} phút`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!appointment) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <X size={24} color={Colors.text} />
        </TouchableOpacity>
        <ThemeText variant="h3">Chi tiết</ThemeText>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        <ThemeText style={styles.title}>{appointment.title}</ThemeText>

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <Calendar size={22} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <ThemeText color={Colors.textTertiary} variant="small">NGÀY</ThemeText>
              <ThemeText style={styles.infoText}>
                {new Date(appointment.date).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </ThemeText>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <Clock size={22} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <ThemeText color={Colors.textTertiary} variant="small">THỜI GIAN</ThemeText>
              <ThemeText style={styles.infoText}>
                {appointment.time} {appointment.endTime ? `- ${appointment.endTime}` : ''}
              </ThemeText>
            </View>
          </View>

          {appointment.location && (
            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <MapPin size={22} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <ThemeText color={Colors.textTertiary} variant="small">ĐỊA ĐIỂM</ThemeText>
                <ThemeText style={styles.infoText}>{appointment.location}</ThemeText>
              </View>
            </View>
          )}

          {appointment.description && (
            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <AlignLeft size={22} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <ThemeText color={Colors.textTertiary} variant="small">MÔ TẢ</ThemeText>
                <ThemeText style={[styles.infoText, { fontWeight: '500', lineHeight: 24 }]}>{appointment.description}</ThemeText>
              </View>
            </View>
          )}

          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <Bell size={22} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <ThemeText color={Colors.textTertiary} variant="small">NHẮC NHỞ</ThemeText>
              <ThemeText style={styles.infoText}>{getReminderLabel(appointment.reminder || 0)}</ThemeText>
            </View>
          </View>

          {appointment.attendees && appointment.attendees.length > 0 && (
            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <Users size={22} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <ThemeText color={Colors.textTertiary} variant="small">NGƯỜI THAM GIA</ThemeText>
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
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: Colors.text,
    marginBottom: Spacing.xxl,
    letterSpacing: -0.5,
  },
  infoSection: {
    gap: Spacing.xl,
  },
  infoRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 2,
  },
  attendeesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  attendeeTag: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
});
