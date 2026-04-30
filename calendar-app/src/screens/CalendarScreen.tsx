import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Plus } from 'lucide-react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../theme/Theme';
import { ThemeText } from '../components/ThemeText';
import AppointmentCard from '../components/AppointmentCard';
import { AppointmentDetailModal } from '../components/AppointmentDetailModal';
import { useAppointments, Appointment } from '../hooks/useAppointments';
import { useAlertStore } from '../store/useAlertStore';

export default function CalendarScreen({ navigation }: any) {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const todayDate = new Date();
  const todayStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;
  const { appointments, isLoading, deleteAppointment } = useAppointments(todayStr);

  const daysVi = ['CHỦ NHẬT', 'THỨ HAI', 'THỨ BA', 'THỨ TƯ', 'THỨ NĂM', 'THỨ SÁU', 'THỨ BẢY'];
  const dayOfWeek = daysVi[todayDate.getDay()];
  
  const dayMonth = todayDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }).replace(/\//g, '.');
  const monthNamesVi = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
  const monthName = monthNamesVi[todayDate.getMonth()].replace('Tháng', 'Thg');

  const handleEdit = () => {
    if (selectedAppointment) {
      setIsModalVisible(false);
      navigation.navigate('AddEvent', { appointment: selectedAppointment });
    }
  };

  const { show: showAlert } = useAlertStore();

  const handleDelete = (id: number) => {
    showAlert(
      'Xóa lịch hẹn', 
      'Bạn có chắc chắn muốn xóa lịch hẹn này không?', 
      [
        { text: 'Hủy', variant: 'outline' },
        { 
          text: 'Xóa', 
          variant: 'primary', 
          onPress: async () => {
            await deleteAppointment(id);
            setIsModalVisible(false);
          } 
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentWrapper}>
        {/* Fixed Header Section */}
        <View style={styles.dateHeader}>
          <View style={styles.unifiedDateCard}>
            <View style={styles.dateTextContainer}>
              <ThemeText style={styles.dayOfWeek}>{dayOfWeek}</ThemeText>
              <View style={styles.dateRow}>
                <ThemeText style={styles.dateNum}>{dayMonth}</ThemeText>
                <ThemeText style={styles.monthLabel}> {monthName}</ThemeText>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.circlePlus} 
              onPress={() => navigation.navigate('AddEvent', { initialDate: todayStr })}
            >
              <Plus size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>
          <ThemeText style={styles.subTitle}>Lịch hẹn hôm nay</ThemeText>
        </View>

        {/* Scrollable Appointments Section */}
        <ScrollView 
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: Spacing.xxl }} />
          ) : appointments.length > 0 ? (
            appointments.map((appt) => (
              <AppointmentCard 
                key={appt.id} 
                appointment={appt} 
                onPress={() => {
                  setSelectedAppointment(appt);
                  setIsModalVisible(true);
                }}
              />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <ThemeText color={Colors.textTertiary}>Hôm nay bạn không có lịch hẹn nào</ThemeText>
            </View>
          )}
        </ScrollView>
      </View>

      <AppointmentDetailModal 
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        appointment={selectedAppointment}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.background,
    alignItems: 'center', // Center content on large screens
  },
  contentWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 600, // Limit width on tablets for better readability
  },
  scrollArea: { flex: 1 },
  scrollContent: { 
    paddingHorizontal: Spacing.lg, 
    paddingBottom: Spacing.xxl 
  },
  dateHeader: { 
    marginTop: Spacing.md, 
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  unifiedDateCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  dateTextContainer: {
    flex: 1,
  },
  dayOfWeek: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: Colors.textSecondary,
    marginBottom: 4,
    letterSpacing: 0.5
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  dateNum: { fontSize: Typography.h2.fontSize, fontWeight: '800', color: Colors.text },
  monthLabel: { fontSize: Typography.title.fontSize, fontWeight: '700', color: Colors.textSecondary },
  subTitle: { fontSize: Typography.title.fontSize + 2, fontWeight: '800', color: Colors.text, marginLeft: 4 },
  circlePlus: {
    width: Spacing.xxl + 8,
    height: Spacing.xxl + 8,
    borderRadius: (Spacing.xxl + 8) / 2,
    backgroundColor: Colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
});
