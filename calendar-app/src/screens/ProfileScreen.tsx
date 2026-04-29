import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { toast } from 'react-native-sonner';
import { useAlertStore } from '../store/useAlertStore';
import { User, Mail, Lock, LogOut, Camera } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius } from '../theme/Theme';
import { ThemeText } from '../components/ThemeText';
import { ThemeButton } from '../components/ThemeButton';
import { useAuthStore } from '../store/useAuthStore';

export default function ProfileScreen() {
  const { user, logout, updateProfile } = useAuthStore();
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
        <ThemeText variant="h2" style={styles.pageTitle}>Cá nhân</ThemeText>

        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <User size={60} color={Colors.textSecondary} />
            <TouchableOpacity style={styles.editAvatarBtn}>
              <Camera size={16} color={Colors.white} />
            </TouchableOpacity>
          </View>
          <ThemeText style={styles.userName}>{user?.name}</ThemeText>
          <ThemeText color={Colors.textTertiary}>{user?.email}</ThemeText>
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
        </View>

        <ThemeButton 
          title="Cập nhật thông tin" 
          onPress={handleUpdateProfile}
          loading={isUpdating}
          style={styles.updateBtn}
        />

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
  pageTitle: { marginTop: Spacing.md, marginBottom: Spacing.xl },
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    position: 'relative',
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.background,
  },
  userName: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
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
  updateBtn: { marginTop: Spacing.md },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xxl,
    paddingVertical: Spacing.md,
  },
  logoutText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});
