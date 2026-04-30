import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { toast } from 'react-native-sonner';
import { Calendar, Clock, Type, X, UserPlus, CheckCircle2, MapPin } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors, Spacing, Typography, BorderRadius } from '../theme/Theme';
import { ThemeText } from '../components/ThemeText';
import { ThemeButton } from '../components/ThemeButton';
import { usePeople } from '../hooks/usePeople';
import { useAppointments, Appointment } from '../hooks/useAppointments';
import { useAlertStore } from '../store/useAlertStore';
import AppointmentCard from '../components/AppointmentCard';
import { AppointmentDetailModal } from '../components/AppointmentDetailModal';
import apiClient from '../api/client';

const REMINDER_OPTIONS = [
  { label: 'Không', value: 0 },
  { label: '5 phút', value: 5 },
  { label: '10 phút', value: 10 },
  { label: '30 phút', value: 30 },
  { label: '1 giờ', value: 60 },
  { label: '12 tiếng', value: 720 },
  { label: '1 ngày', value: 1440 },
  { label: '1 tuần', value: 10080 },
];

export default function AddEventScreen({ navigation, route }: any) {
  const [editAppointment, setEditAppointment] = useState<Appointment | undefined>(route.params?.appointment);
  const appointmentId = route.params?.appointmentId;
  const initialDateStr = route.params?.initialDate;
  const isEditing = !!editAppointment;
  const [isLoadingAppt, setIsLoadingAppt] = useState(!!appointmentId && !editAppointment);

  useEffect(() => {
    if (appointmentId && !editAppointment) {
      const fetchAppt = async () => {
        try {
          const res = await apiClient.get(`/appointments/${appointmentId}`);
          setEditAppointment(res.data);
        } catch (e) {
          toast.error('Không tìm thấy lịch hẹn');
          navigation.goBack();
        } finally {
          setIsLoadingAppt(false);
        }
      };
      fetchAppt();
    }
  }, [appointmentId]);

  const parseTime = (timeStr: string) => {
    if (!timeStr) return new Date();
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  };

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [dateObj, setDateObj] = useState(new Date());
  const [timeObj, setTimeObj] = useState(new Date());
  const [endTimeObj, setEndTimeObj] = useState(() => {
    let t = new Date();
    t.setHours(t.getHours() + 1);
    return t;
  });
  const [reminder, setReminder] = useState(720);
  const [selectedPeopleIds, setSelectedPeopleIds] = useState<number[]>([]);
  const [hasEndTime, setHasEndTime] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [quickFriendName, setQuickFriendName] = useState('');
  const [isAddingQuickFriend, setIsAddingQuickFriend] = useState(false);

  // Sync state when editAppointment changes (e.g. after fetch)
  useEffect(() => {
    if (editAppointment) {
      setTitle(editAppointment.title || '');
      setDescription(editAppointment.description || '');
      setLocation(editAppointment.location || '');
      setDateObj(editAppointment.date ? new Date(editAppointment.date) : new Date());
      setTimeObj(parseTime(editAppointment.time));
      if (editAppointment.endTime) {
        setEndTimeObj(parseTime(editAppointment.endTime));
        setHasEndTime(true);
      }
      setReminder(editAppointment.reminder ?? 720);
      setSelectedPeopleIds(editAppointment.attendees?.map(p => p.id) || []);
    } else if (initialDateStr) {
      setDateObj(new Date(initialDateStr));
    }
  }, [editAppointment, initialDateStr]);

  const { people, createPerson } = usePeople();
  const { createAppointment, updateAppointment, deleteAppointment } = useAppointments();
  const { show: showAlert } = useAlertStore();
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState<any>(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);

  const handleQuickAddFriend = async () => {
    if (!quickFriendName.trim()) return;
    try {
      const newPerson = await createPerson({ name: quickFriendName.trim() });
      setSelectedPeopleIds(prev => [...prev, newPerson.id]);
      setQuickFriendName('');
      setIsAddingQuickFriend(false);
    } catch (e) {
      toast.error('Không thể thêm bạn nhanh');
    }
  };

  const togglePersonSelection = (id: number) => {
    setSelectedPeopleIds(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!title) {
      toast.error('Vui lòng nhập tiêu đề');
      return;
    }
    
    const finalDate = dateObj.toISOString().split('T')[0];
    const finalTime = timeObj.getHours().toString().padStart(2, '0') + ':' + timeObj.getMinutes().toString().padStart(2, '0');
    const finalEndTime = hasEndTime 
      ? endTimeObj.getHours().toString().padStart(2, '0') + ':' + endTimeObj.getMinutes().toString().padStart(2, '0')
      : undefined;
    
    try {
      setSaving(true);
      const data = {
        title,
        description: description || undefined,
        location: location || undefined,
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
    } catch (e: any) {
      if (e.response?.status === 409) {
        setConflict(e.response.data.conflictingAppointment);
        setSaving(false);
        // We still show toast or alert if needed, but the UI will show the card now
        toast.error('Phát hiện trùng lịch hẹn');
      }
    } finally {
      if (!conflict) setSaving(false);
    }
  };

  const handleResolveConflict = async () => {
    if (!conflict) return;
    try {
      setSaving(true);
      await deleteAppointment(conflict.id);
      setConflict(null);
      // Retry save
      handleSave();
    } catch (err) {
      toast.error('Không thể xử lý lịch cũ');
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
            <ThemeText variant="small" color={Colors.textSecondary} style={styles.label}>ĐỊA ĐIỂM</ThemeText>
            <View style={styles.inputContainer}>
              <MapPin color={Colors.textTertiary} size={20} style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                value={location} 
                onChangeText={setLocation} 
                placeholder="Ví dụ: Phòng họp 1 hoặc Google Meet" 
                placeholderTextColor={Colors.placeholder}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <ThemeText variant="small" color={Colors.textSecondary} style={styles.label}>MÔ TẢ</ThemeText>
            <View style={[styles.inputContainer, { height: 100, alignItems: 'flex-start', paddingTop: 15 }]}>
              <TextInput 
                style={[styles.input, { textAlignVertical: 'top' }]} 
                value={description} 
                onChangeText={setDescription} 
                placeholder="Thêm mô tả cho lịch hẹn..." 
                placeholderTextColor={Colors.placeholder}
                multiline
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
                onChange={(event, date) => {
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
              <View style={styles.labelRow}>
                <ThemeText variant="small" color={Colors.textSecondary} style={styles.label}>KẾT THÚC</ThemeText>
                <TouchableOpacity onPress={() => setHasEndTime(!hasEndTime)}>
                  <ThemeText variant="small" color={hasEndTime ? Colors.error : Colors.primary} style={{ fontWeight: '700' }}>
                    {hasEndTime ? 'Gỡ bỏ' : 'Thiết lập'}
                  </ThemeText>
                </TouchableOpacity>
              </View>
              <TouchableOpacity 
                activeOpacity={hasEndTime ? 0.8 : 1} 
                style={[styles.inputContainer, !hasEndTime && { opacity: 0.5 }]} 
                onPress={() => hasEndTime && setShowEndTimePicker(true)}
              >
                <Clock color={Colors.textTertiary} size={20} style={styles.inputIcon} />
                <ThemeText style={[styles.inputValue, !hasEndTime && { color: Colors.textTertiary }]}>
                  {hasEndTime 
                    ? endTimeObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                    : 'Chưa thiết lập'}
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
            <DateTimePicker 
              value={timeObj} 
              mode="time" 
              is24Hour={true} 
              display="default" 
              onChange={(event, date) => {
                setShowTimePicker(Platform.OS === 'ios');
                if (date) setTimeObj(date);
              }}
            />
          )}
          {showEndTimePicker && (
            <DateTimePicker 
              value={endTimeObj} 
              mode="time" 
              is24Hour={true} 
              display="default" 
              onChange={(event, date) => {
                setShowEndTimePicker(Platform.OS === 'ios');
                if (date) setEndTimeObj(date);
              }}
            />
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

          {conflict && (
            <View style={styles.conflictBox}>
              <ThemeText variant="small" color={Colors.error} style={[styles.label, { fontWeight: '800' }]}>TRÙNG LỊCH HẸN</ThemeText>
              <AppointmentCard 
                appointment={{
                  ...conflict,
                  attendees: conflict.attendees || []
                }} 
                variant="compact"
                onPress={() => setIsDetailVisible(true)}
              />
              <View style={styles.conflictActions}>
                <ThemeButton 
                  title="Xóa lịch cũ & Lưu mới" 
                  onPress={handleResolveConflict}
                  disabled={saving}
                  style={{ flex: 1.5 }}
                />
                <ThemeButton 
                  title="Bỏ qua" 
                  variant="outline" 
                  onPress={() => setConflict(null)}
                  disabled={saving}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          )}

          <View style={styles.footer}>
            <ThemeButton 
              title={isEditing ? "Cập nhật" : "Lưu"} 
              onPress={handleSave} 
              disabled={saving}
            >
              {saving && <ActivityIndicator color={Colors.white} />}
            </ThemeButton>
          </View>
          
          {conflict && (
            <AppointmentDetailModal
              isVisible={isDetailVisible}
              appointment={{
                ...conflict,
                attendees: conflict.attendees || []
              }}
              onClose={() => setIsDetailVisible(false)}
            />
          )}
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
  conflictBox: {
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    backgroundColor: 'rgba(244, 67, 54, 0.05)',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(244, 67, 54, 0.2)',
  },
  conflictActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: Spacing.md,
  },
});
