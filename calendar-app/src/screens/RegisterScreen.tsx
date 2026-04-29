import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { toast } from 'react-native-sonner';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, BorderRadius } from '../theme/Theme';
import { ThemeText } from '../components/ThemeText';
import { ThemeButton } from '../components/ThemeButton';
import { useAuthStore } from '../store/useAuthStore';
import { Mail, Lock, User, ArrowLeft } from 'lucide-react-native';

export default function RegisterScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((state) => state.register);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    try {
      setLoading(true);
      await register({ name, email, password });
    } catch (error: any) {
      // Handled by store
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <ThemeText variant="h1" style={styles.title}>Tạo tài khoản</ThemeText>
            <ThemeText variant="body" color={Colors.textSecondary}>Bắt đầu quản lý lịch trình của bạn ngay hôm nay</ThemeText>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <ThemeText variant="small" style={styles.label}>HỌ VÀ TÊN</ThemeText>
              <View style={styles.inputContainer}>
                <User size={20} color={Colors.textTertiary} style={styles.icon} />
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Nguyễn Văn A"
                  placeholderTextColor={Colors.placeholder}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemeText variant="small" style={styles.label}>EMAIL</ThemeText>
              <View style={styles.inputContainer}>
                <Mail size={20} color={Colors.textTertiary} style={styles.icon} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="email@example.com"
                  placeholderTextColor={Colors.placeholder}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemeText variant="small" style={styles.label}>MẬT KHẨU</ThemeText>
              <View style={styles.inputContainer}>
                <Lock size={20} color={Colors.textTertiary} style={styles.icon} />
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

            <ThemeButton
              title={loading ? "" : "Đăng ký ngay"}
              onPress={handleRegister}
              variant="primary"
              size="lg"
              style={styles.registerButton}
              disabled={loading}
            >
              {loading && <ActivityIndicator color={Colors.white} />}
            </ThemeButton>
          </View>

          <TouchableOpacity 
            style={styles.footerLink} 
            onPress={() => navigation.navigate('Login')}
          >
            <ThemeText color={Colors.textSecondary}>
              Đã có tài khoản? <ThemeText color={Colors.primary} style={{ fontWeight: '700' }}>Đăng nhập</ThemeText>
            </ThemeText>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: Spacing.xl, flexGrow: 1 },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  header: { marginBottom: Spacing.xxl },
  title: { marginBottom: Spacing.xs },
  form: { gap: Spacing.lg },
  inputGroup: { gap: Spacing.xs },
  label: { marginLeft: Spacing.sm },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    height: 56,
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  icon: { marginRight: Spacing.md },
  input: { flex: 1, fontSize: 16, color: Colors.text },
  registerButton: { marginTop: Spacing.md },
  footerLink: {
    marginTop: Spacing.xxl,
    alignItems: 'center',
    paddingBottom: Spacing.xl,
  }
});
