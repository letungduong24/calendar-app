import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, Alert, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { Calendar, Clock, Type, X, UserPlus, CheckCircle2 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors, Spacing, Typography, BorderRadius } from '../theme/Theme';
import { ThemeText } from '../components/ThemeText';
import { ThemeButton } from '../components/ThemeButton';
import { usePeople } from '../hooks/usePeople';
import { useAppointments, Appointment } from '../hooks/useAppointments';

const REMINDER_OPTIONS = [
  { label: 'Không', value: 0 },
  { label: '5 phút', value: 5 },
  { label: '10 phút', value: 10 },
  { label: '30 phút', value: 30 },
  { label: '1 giờ', value: 60 },
];

export default function AddEventScreen({ navigation, route }: any) {
  const editAppointment: Appointment | undefined = route.params?.appointment;
  const initialDateStr = route.params?.initialDate;
  const isEditing = !!editAppointment;

  const parseTime = (timeStr: string) => {
    if (!timeStr) return new Date();
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  };

  const [title, setTitle] = useState(editAppointment?.title || '');
  const [dateObj, setDateObj] = useState(
    editAppointment?.date ? new Date(editAppointment.date) : 
    (initialDateStr ? new Date(initialDateStr) : new Date())
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [timeObj, setTimeObj] = useState(
    isEditing ? parseTime(editAppointment!.time) : new Date()
  );
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  const [endTimeObj, setEndTimeObj] = useState(() => {
    if (isEditing && editAppointment?.endTime) return parseTime(editAppointment.endTime);
    let t = new Date();
    t.setHours(t.getHours() + 1);
    return t;
  });
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const [reminder, setReminder] = useState(editAppointment?.reminder || 0);
  const [selectedPeopleIds, setSelectedPeopleIds] = useState<number[]>(
    editAppointment?.attendees?.map(p => p.id) || []
  );
  const [quickFriendName, setQuickFriendName] = useState('');
  const [isAddingQuickFriend, setIsAddingQuickFriend] = useState(false);

  const { people, createPerson } = usePeople();
  const { createAppointment, updateAppointment } = useAppointments();
  const [saving, setSaving] = useState(false);

  const handleQuickAddFriend = async () => {
    if (!quickFriendName.trim()) return;
    try {
      const newPerson = await createPerson({ name: quickFriendName.trim() });
      setSelectedPeopleIds(prev => [...prev, newPerson.id]);
      setQuickFriendName('');
      setIsAddingQuickFriend(false);
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể thêm bạn nhanh');
    }
  };

  const togglePersonSelection = (id: number) => {
    setSelectedPeopleIds(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!title) {
      Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề');
      return;
    }
    
    const finalDate = dateObj.toISOString().split('T')[0];
    const finalTime = timeObj.getHours().toString().padStart(2, '0') + ':' + timeObj.getMinutes().toString().padStart(2, '0');
    const finalEndTime = endTimeObj.getHours().toString().padStart(2, '0') + ':' + endTimeObj.getMinutes().toString().padStart(2, '0');
    
    try {
      setSaving(true);
      const data = {
        title,
        date: finalDate,
        time: finalTime,
        endTime: finalEndTime,
        reminder,
        attendeeIds: selectedPeopleIds,
      };

      if (isEditing) {
        await updateAppointment({ id: editAppointment!.id, ...data });
      } else {
        await createAppointment(data);
      }
      
      navigation.goBack();
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể lưu lịch hẹn');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <ThemeText variant="h3" numberOfLines={1} style={styles.headerTitle}>
              {isEditing ? 'Chỉnh sửa lịch hẹn' : 'Tạo lịch hẹn'}
            </ThemeText>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <ThemeText variant="small" color={Colors.textSecondary} style={styles.label}>TIÊU ĐỀ</ThemeText>
            <View style={styles.inputContainer}>
              <Type color={Colors.textTertiary} size={20} style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                value={title} 
                onChangeText={setTitle} 
                placeholder="Ví dụ: Họp team UI/UX" 
                placeholderTextColor={Colors.placeholder}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <ThemeText variant="small" color={Colors.textSecondary} style={styles.label}>NGÀY</ThemeText>
            <TouchableOpacity 
              activeOpacity={0.8} 
              style={styles.inputContainer} 
              onPress={() => setShowDatePicker(true)}
            >
              <Calendar color={Colors.textTertiary} size={20} style={styles.inputIcon} />
              <ThemeText style={styles.inputValue}>
                {dateObj.toLocaleDateString('vi-VN')}
              </ThemeText>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={dateObj}
                mode="date"
                display="default"
                onChange={(e, date) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (date) setDateObj(date);
                }}
              />
            )}
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
              <ThemeText variant="small" color={Colors.textSecondary} style={styles.label}>BẮT ĐẦU</ThemeText>
              <TouchableOpacity 
                activeOpacity={0.8} 
                style={styles.inputContainer} 
                onPress={() => setShowTimePicker(true)}
              >
                <Clock color={Colors.textTertiary} size={20} style={styles.inputIcon} />
                <ThemeText style={styles.inputValue}>
                  {timeObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </ThemeText>
              </TouchableOpacity>
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <ThemeText variant="small" color={Colors.textSecondary} style={styles.label}>KẾT THÚC</ThemeText>
              <TouchableOpacity 
                activeOpacity={0.8} 
                style={styles.inputContainer} 
                onPress={() => setShowEndTimePicker(true)}
              >
                <Clock color={Colors.textTertiary} size={20} style={styles.inputIcon} />
                <ThemeText style={styles.inputValue}>
                  {endTimeObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </ThemeText>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <ThemeText variant="small" color={Colors.textSecondary} style={styles.label}>NHẮC NHỞ TRƯỚC</ThemeText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.peopleScroll}>
              {REMINDER_OPTIONS.map((option) => (
                <TouchableOpacity 
                  key={option.value} 
                  onPress={() => setReminder(option.value)}
                  style={[
                    styles.personPill, 
                    reminder === option.value && styles.personPillSelected
                  ]}
                >
                  <ThemeText color={reminder === option.value ? Colors.white : Colors.text} style={{ fontWeight: '600' }}>
                    {option.label}
                  </ThemeText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {showTimePicker && (
            <DateTimePicker value={timeObj} mode="time" is24Hour={true} display="default" onChange={(e, t) => { setShowTimePicker(Platform.OS === 'ios'); if (t) setTimeObj(t); }} />
          )}
          {showEndTimePicker && (
            <DateTimePicker value={endTimeObj} mode="time" is24Hour={true} display="default" onChange={(e, t) => { setShowEndTimePicker(Platform.OS === 'ios'); if (t) setEndTimeObj(t); }} />
          )}

          <View style={styles.formGroup}>
            <View style={styles.labelRow}>
              <ThemeText variant="small" color={Colors.textSecondary} style={styles.label}>BẠN BÈ THAM GIA</ThemeText>
              <TouchableOpacity onPress={() => setIsAddingQuickFriend(!isAddingQuickFriend)}>
                <ThemeText variant="small" color={Colors.primary} style={{ fontWeight: '700' }}>
                  {isAddingQuickFriend ? 'Hủy' : '+ Thêm nhanh'}
                </ThemeText>
              </TouchableOpacity>
            </View>

            {isAddingQuickFriend && (
              <View style={[styles.inputContainer, { marginBottom: 10, borderColor: Colors.primary, borderWidth: 1 }]}>
                <TextInput 
                  style={styles.input} 
                  value={quickFriendName} 
                  onChangeText={setQuickFriendName} 
                  placeholder="Tên bạn bè..." 
                  placeholderTextColor={Colors.placeholder}
                  onSubmitEditing={handleQuickAddFriend}
                />
                <TouchableOpacity onPress={handleQuickAddFriend}>
                   <CheckCircle2 color={Colors.primary} size={24} />
                </TouchableOpacity>
              </View>
            )}

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.peopleScroll}>
              {people.map((person) => {
                const isSelected = selectedPeopleIds.includes(person.id);
                return (
                  <TouchableOpacity 
                    key={person.id} 
                    onPress={() => togglePersonSelection(person.id)}
                    style={[styles.personPill, isSelected && styles.personPillSelected]}
                  >
                    <ThemeText color={isSelected ? Colors.white : Colors.text} style={{ fontWeight: '600' }}>
                      {person.name}
                    </ThemeText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.footer}>
            <ThemeButton 
              title={isEditing ? "Cập nhật" : "Lưu"} 
              onPress={handleSave} 
              disabled={saving}
            >
              {saving && <ActivityIndicator color={Colors.white} />}
            </ThemeButton>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  keyboardView: { flex: 1 },
  scrollContainer: { padding: Spacing.lg, paddingBottom: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl, marginTop: Spacing.xl },
  headerTitle: { flex: 1, marginRight: Spacing.md },
  closeButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.secondary, justifyContent: 'center', alignItems: 'center' },
  formGroup: { marginBottom: Spacing.lg },
  label: { marginBottom: Spacing.xs, marginLeft: Spacing.sm },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs, paddingRight: Spacing.sm },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: BorderRadius.xl, paddingHorizontal: Spacing.lg, height: 60 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 17, color: Colors.text, height: '100%', fontWeight: '600' },
  inputValue: { flex: 1 },
  row: { flexDirection: 'row' },
  peopleScroll: { flexDirection: 'row', marginTop: 5 },
  personPill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: Colors.white, marginRight: 10, borderWidth: 1, borderColor: Colors.secondary },
  personPillSelected: { backgroundColor: Colors.black, borderColor: Colors.black },
  footer: { marginTop: Spacing.xl },
});
