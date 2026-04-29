import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Colors, Spacing, Typography, BorderRadius } from '../theme/Theme';
import { ThemeText } from '../components/ThemeText';
import { ThemeButton } from '../components/ThemeButton';
import { useAuthStore } from '../store/useAuthStore';
import { Mail, Lock } from 'lucide-react-native';
import { BASE_URL } from '../api/client';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const setToken = useAuthStore((state) => state.setToken);
  const getMe = useAuthStore((state) => state.getMe);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }

    try {
      setLoading(true);
      await login({ email, password });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Đăng nhập thất bại';
      Alert.alert('Lỗi', Array.isArray(message) ? message[0] : message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      const redirectUrl = Linking.createURL('auth-callback');
      const authUrl = `${BASE_URL}/auth/google?redirect=${encodeURIComponent(redirectUrl)}`;
      
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

      if (result.type === 'success' && result.url) {
        const { queryParams } = Linking.parse(result.url);
        if (queryParams?.token) {
          await setToken(queryParams.token as string);
          await getMe();
        }
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể đăng nhập bằng Google');
    } finally {
      setGoogleLoading(false);
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
          <View style={styles.header}>
            <ThemeText variant="h1" style={styles.title}>Chào mừng trở lại</ThemeText>
            <ThemeText variant="body" color={Colors.textSecondary}>Đăng nhập để quản lý lịch trình của bạn</ThemeText>
          </View>

          <View style={styles.form}>
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
              title={loading ? "" : "Đăng nhập"}
              onPress={handleLogin}
              variant="primary"
              size="lg"
              style={styles.loginButton}
              disabled={loading || googleLoading}
            >
              {loading && <ActivityIndicator color={Colors.white} />}
            </ThemeButton>
          </View>

          <View style={styles.divider}>
            <View style={styles.line} />
            <ThemeText variant="small" color={Colors.textTertiary} style={styles.dividerText}>HOẶC</ThemeText>
            <View style={styles.line} />
          </View>

          <TouchableOpacity 
            style={styles.googleButton} 
            onPress={handleGoogleLogin}
            disabled={loading || googleLoading}
          >
            {googleLoading ? (
              <ActivityIndicator color={Colors.text} />
            ) : (
              <>
                <Image 
                  source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }} 
                  style={styles.googleIcon} 
                />
                <ThemeText style={{ fontWeight: '700' }}>Tiếp tục với Google</ThemeText>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.footerLink} 
            onPress={() => navigation.navigate('Register')}
          >
            <ThemeText color={Colors.textSecondary}>
              Chưa có tài khoản? <ThemeText color={Colors.primary} style={{ fontWeight: '700' }}>Đăng ký ngay</ThemeText>
            </ThemeText>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: Spacing.xl, flexGrow: 1, justifyContent: 'center' },
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
  loginButton: { marginTop: Spacing.md },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.secondary,
  },
  dividerText: {
    marginHorizontal: Spacing.md,
    fontWeight: '700',
  },
  googleButton: {
    height: 56,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.secondary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: Spacing.md,
  },
  footerLink: {
    marginTop: Spacing.xxl,
    alignItems: 'center',
  }
});
