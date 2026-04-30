import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform, Switch } from 'react-native';
import { toast } from 'react-native-sonner';
import { useAlertStore } from '../store/useAlertStore';
import { User, Mail, Lock, LogOut, Camera, Bell, Moon, Info, ChevronRight, Shield } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius } from '../theme/Theme';
import { ThemeText } from '../components/ThemeText';
import { ThemeButton } from '../components/ThemeButton';
import { sendTestNotification } from '../utils/notifications';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';
import * as Notifications from 'expo-notifications';
import { rescheduleAllNotifications } from '../utils/notifications';

export default function ProfileScreen() {
  const { user, logout, updateProfile } = useAuthStore();
  const { notificationsEnabled, setNotificationsEnabled } = useSettingsStore();
  
  const handleToggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);
    if (!value) {
      // If turned off, cancel ALL scheduled notifications immediately
      await Notifications.cancelAllScheduledNotificationsAsync();
      toast.info('Đã tắt và hủy tất cả thông báo');
    } else {
      // If turned back on, reschedule all future appointments
      await rescheduleAllNotifications();
      toast.success('Đã bật và lên lịch lại tất cả thông báo');
    }
  };
  const [name, setName] = useState(user?.name || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Sync local name state with user state from store
  React.useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user?.name]);

  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      toast.error('Vui lòng nhập tên');
      return;
    }

    if (password && password !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsUpdating(true);
    try {
      await updateProfile({ name, password: password || undefined });
      setPassword('');
      setConfirmPassword('');
      toast.success('Cập nhật thông tin thành công');
    } catch (error: any) {
      // Handled by store
    } finally {
      setIsUpdating(false);
    }
  };

  const { show: showAlert } = useAlertStore();

  const handleLogout = () => {
    showAlert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', variant: 'outline' },
        { text: 'Đăng xuất', variant: 'primary', onPress: () => logout() }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSpacer} />

        <View style={styles.section}>
          <ThemeText style={styles.sectionLabel}>Cài đặt ứng dụng</ThemeText>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconBox, { backgroundColor: '#E5F1FF' }]}>
                  <Bell size={20} color={Colors.primary} />
                </View>
                <ThemeText style={styles.settingTitle}>Thông báo đẩy</ThemeText>
              </View>
              <Switch 
                value={notificationsEnabled}
                onValueChange={handleToggleNotifications}
                trackColor={{ false: '#D1D1D6', true: Colors.primary }}
                thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
              />
            </View>

            <TouchableOpacity 
              style={[styles.settingRow, { borderBottomWidth: 0 }]}
              onPress={sendTestNotification}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconBox, { backgroundColor: '#F2F2F7' }]}>
                  <Info size={20} color={Colors.textSecondary} />
                </View>
                <ThemeText style={styles.settingTitle}>Kiểm tra thông báo</ThemeText>
              </View>
              <ThemeText color={Colors.primary}>Gửi thử</ThemeText>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <ThemeText style={styles.sectionLabel}>Thông tin tài khoản</ThemeText>
          
          <View style={styles.inputGroup}>
            <ThemeText style={styles.label}>Họ và tên</ThemeText>
            <View style={styles.inputWrapper}>
              <User size={18} color={Colors.textTertiary} style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Nhập tên của bạn"
                placeholderTextColor={Colors.placeholder}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <ThemeText style={styles.label}>Email</ThemeText>
            <View style={[styles.inputWrapper, styles.disabledInput]}>
              <Mail size={18} color={Colors.textTertiary} style={styles.inputIcon} />
              <TextInput 
                style={[styles.input, { color: Colors.textTertiary }]}
                value={user?.email}
                editable={false}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <ThemeText style={styles.sectionLabel}>Bảo mật</ThemeText>
          
          <View style={styles.inputGroup}>
            <ThemeText style={styles.label}>Mật khẩu mới</ThemeText>
            <View style={styles.inputWrapper}>
              <Lock size={18} color={Colors.textTertiary} style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={Colors.placeholder}
                secureTextEntry
              />
            </View>
          </View>

          {password.length > 0 && (
            <View style={styles.inputGroup}>
              <ThemeText style={styles.label}>Xác nhận mật khẩu</ThemeText>
              <View style={styles.inputWrapper}>
                <Lock size={18} color={Colors.textTertiary} style={styles.inputIcon} />
                <TextInput 
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.placeholder}
                  secureTextEntry
                />
              </View>
            </View>
          )}

          <ThemeButton 
            title="Cập nhật thông tin" 
            onPress={handleUpdateProfile}
            loading={isUpdating}
            style={styles.updateBtn}
          />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={20} color="#FF3B30" />
          <ThemeText style={styles.logoutText}>Đăng xuất</ThemeText>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  headerSpacer: { height: Spacing.lg },
  section: { marginBottom: Spacing.xl },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    marginLeft: 4,
  },
  inputGroup: { marginBottom: Spacing.md },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textTertiary, marginBottom: 8, marginLeft: 4 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 54,
  },
  disabledInput: { backgroundColor: '#F2F2F7', opacity: 0.8 },
  inputIcon: { marginRight: Spacing.sm },
  input: { flex: 1, fontSize: 16, fontWeight: '600', color: Colors.text },
  updateBtn: { marginTop: Spacing.sm },
  settingsCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  logoutText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});
