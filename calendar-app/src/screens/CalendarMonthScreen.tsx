import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Plus } from 'lucide-react-native';

LocaleConfig.locales['vi'] = {
  monthNames: ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'],
  monthNamesShort: ['Thg 1','Thg 2','Thg 3','Thg 4','Thg 5','Thg 6','Thg 7','Thg 8','Thg 9','Thg 10','Thg 11','Thg 12'],
  dayNames: ['Chủ Nhật','Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy'],
  dayNamesShort: ['CN','T2','T3','T4','T5','T6','T7'],
  today: 'Hôm nay'
};
LocaleConfig.defaultLocale = 'vi';
import { Colors, Spacing, BorderRadius } from '../theme/Theme';
import { ThemeText } from '../components/ThemeText';
import AppointmentCard from '../components/AppointmentCard';
import { AppointmentDetailModal } from '../components/AppointmentDetailModal';
import { useAppointments, Appointment } from '../hooks/useAppointments';
import { useAlertStore } from '../store/useAlertStore';

export default function CalendarMonthScreen({ navigation }: any) {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const { appointments, isLoading, deleteAppointment } = useAppointments(selectedDate);

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
      {/* Fixed Calendar Section */}
      <View style={styles.fixedHeader}>
        <View style={styles.calendarCard}>
          <Calendar
            current={selectedDate}
            onDayPress={(day: any) => setSelectedDate(day.dateString)}
            markedDates={{
              [selectedDate]: { selected: true, selectedColor: Colors.black },
            }}
            theme={{
              backgroundColor: Colors.white,
              calendarBackground: Colors.white,
              textSectionTitleColor: Colors.textSecondary,
              selectedDayBackgroundColor: Colors.black,
              selectedDayTextColor: Colors.white,
              todayTextColor: Colors.primary,
              dayTextColor: Colors.text,
              textDisabledColor: Colors.textTertiary,
              dotColor: Colors.primary,
              arrowColor: Colors.black,
              monthTextColor: Colors.black,
              textDayFontWeight: '800',
              textMonthFontWeight: '900',
              textDayHeaderFontWeight: '700',
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 13,
            }}
          />
        </View>

        <View style={styles.sectionHeader}>
          <ThemeText style={styles.sectionTitle}>Sự kiện ngày {new Date(selectedDate).toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' })}</ThemeText>
          <TouchableOpacity 
            style={styles.addBtn}
            onPress={() => navigation.navigate('AddEvent', { initialDate: selectedDate })}
          >
            <Plus size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable Appointments Section */}
      <ScrollView 
        style={styles.scrollArea} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {appointments.map((appt) => (
          <AppointmentCard 
            key={appt.id} 
            appointment={appt} 
            variant="compact"
            onPress={() => {
              setSelectedAppointment(appt);
              setIsModalVisible(true);
            }}
          />
        ))}

        {appointments.length === 0 && (
          <View style={styles.emptyContainer}>
            <ThemeText color={Colors.textTertiary}>Không có lịch hẹn nào</ThemeText>
          </View>
        )}
      </ScrollView>

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
  container: { flex: 1, backgroundColor: Colors.background },
  fixedHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: Colors.background,
  },
  calendarCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.sm,
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: { 
    paddingHorizontal: Spacing.lg, 
    paddingBottom: Spacing.xxl 
  },
  emptyContainer: { alignItems: 'center', marginTop: 30 },
});
