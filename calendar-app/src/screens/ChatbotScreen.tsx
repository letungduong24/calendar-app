import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  TextInput, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  SafeAreaView,
  Keyboard,
  RefreshControl,
} from 'react-native';
import { useChat } from '@ai-sdk/react';
import { useQueryClient } from '@tanstack/react-query';
import { DefaultChatTransport } from 'ai';
import { fetch as expoFetch } from 'expo/fetch';
import { Send, Bot, Trash2 } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Typography } from '../theme/Theme';
import { ThemeText } from '../components/ThemeText';
import { useAuthStore } from '../store/useAuthStore';
import { useAlertStore } from '../store/useAlertStore';
import {
  GetAppointmentsResult,
  CreateAppointmentResult,
  DeleteAppointmentResult,
  ResolveAttendeesResult,
} from '../components/ChatToolResults';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export default function ChatbotScreen() {
  const token = useAuthStore(state => state.token);
  const { show: showAlert } = useAlertStore();
  const queryClient = useQueryClient();
  const scrollViewRef = useRef<ScrollView>(null);
  const [input, setInput] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: `${API_URL}/api/chat`,
      headers: {
        Authorization: `Bearer ${token || ''}`,
      },
      fetch: expoFetch as unknown as typeof globalThis.fetch,
    }),
    onError: (err) => console.error('Chat error:', err),
  });

  const isLoading = status === 'submitted' || status === 'streaming';



  // Invalidate relevant queries when a tool completes successfully
  useEffect(() => {
    if (status === 'ready') {
      const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
      const hasToolResults = lastAssistantMessage?.parts?.some(
        (p: any) => p.type?.startsWith('tool-') && p.state === 'output-available'
      );
      
      if (hasToolResults) {
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
        queryClient.invalidateQueries({ queryKey: ['people'] });
      }
    }
  }, [status, messages, queryClient]);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 50);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleScroll = (event: any) => {
    // No-op without history
  };

  const handleClearHistory = () => {
    showAlert(
      'Xóa lịch sử chat',
      'Toàn bộ lịch sử trò chuyện sẽ bị xóa vĩnh viễn. Bạn chắc chắn không?',
      [
        { text: 'Hủy', variant: 'outline' },
        {
          text: 'Xóa',
          variant: 'primary',
          onPress: () => {
            setMessages([]);
          },
        },
      ],
    );
  };

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      sendMessage({ text: input });
      setInput('');
    }
  };

  // Render từng part theo đúng type — giống train-booking switch pattern
  const renderPart = (part: any, index: number, m: any) => {
    switch (part.type) {
      case 'text': {
        if (!part.text?.trim()) return null;
        // AI text: ẩn hoàn toàn nếu message có bất kỳ tool part nào
        // (dù đang streaming hay đã có kết quả) → luôn dùng component UI
        if (m.role === 'assistant') {
          const hasValidToolResult = m.parts?.some((p: any) =>
            ['tool-getAppointments', 'tool-createAppointment', 'tool-deleteAppointment', 'tool-resolveAttendees'].includes(p.type) &&
            (p.output !== undefined || p.result !== undefined || p.state === 'input-streaming' || p.state === 'input-available')
          );
          // Chỉ ẩn text nếu có ít nhất 1 tool có kết quả hoặc đang chạy
          if (hasValidToolResult) return null;
        }
        return (
          <ThemeText key={index} style={[
            styles.messageText,
            m.role === 'user' ? styles.userText : styles.aiText,
          ]}>
            {part.text}
          </ThemeText>
        );
      }
      case 'tool-getAppointments':
      case 'tool-createAppointment':
      case 'tool-deleteAppointment':
      case 'tool-resolveAttendees': {
        const hasData = part.output !== undefined || part.result !== undefined;
        const isInteracting = part.state === 'input-streaming' || part.state === 'input-available' || part.state === 'call';
        
        // Nếu không có dữ liệu và cũng không phải đang chạy -> không render component lỗi
        if (!hasData && !isInteracting) return null;
        
        // Cần đảm bảo component nhận được data đúng field
        const enhancedPart = { ...part, output: part.output ?? part.result };

        if (part.type === 'tool-getAppointments') return <GetAppointmentsResult key={index} part={enhancedPart} />;
        if (part.type === 'tool-createAppointment') return <CreateAppointmentResult key={index} part={enhancedPart} />;
        if (part.type === 'tool-deleteAppointment') return <DeleteAppointmentResult key={index} part={enhancedPart} />;
        if (part.type === 'tool-resolveAttendees') return <ResolveAttendeesResult key={index} part={enhancedPart} />;
        return null;
      }
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { paddingBottom: keyboardHeight }]}>
      <View style={styles.flex}>
        <View style={styles.header}>
          <View>
            <ThemeText style={styles.headerTitle}>Trợ lý AI</ThemeText>
            <ThemeText style={styles.headerSub}>Luôn sẵn sàng hỗ trợ</ThemeText>
          </View>
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={handleClearHistory}
            disabled={isLoading || messages.length === 0}
          >
            <Trash2 size={18} color={messages.length === 0 ? Colors.textTertiary : Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          ref={scrollViewRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >

          {messages.length === 0 && (
            <View style={styles.welcomeContainer}>
              <View style={styles.aiIconContainer}>
                <Bot size={40} color={Colors.primary} />
              </View>
              <ThemeText style={styles.welcomeTitle}>Xin chào!</ThemeText>
              <ThemeText style={styles.welcomeSub}>
                Tôi có thể giúp bạn kiểm tra lịch, tạo cuộc hẹn mới hoặc tìm kiếm danh bạ. Bạn muốn bắt đầu từ đâu?
              </ThemeText>
            </View>
          )}

          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (m.parts ?? []).map((part: any, i: number) => {
              if (part.type === 'text') {
                const rendered = renderPart(part, i, m);
                if (!rendered) return null;
                return (
                  <View key={`${m.id}-${i}`} style={isUser ? styles.userWrapper : styles.aiWrapper}>
                    <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
                      {rendered}
                    </View>
                  </View>
                );
              }
              // Tool parts — full width, không bị giới hạn maxWidth
              const rendered = renderPart(part, i, m);
              if (!rendered) return null;
              return (
                <View key={`${m.id}-${i}`} style={styles.toolWrapper}>
                  {rendered}
                </View>
              );
            });
          })}

          {isLoading && (() => {
            const lastMsg = messages[messages.length - 1];
            const lastIsUser = lastMsg?.role === "user";
            const hasToolOutput = lastMsg?.parts?.some(
                (p: any) => [
                  'tool-getAppointments', 
                  'tool-createAppointment', 
                  'tool-deleteAppointment', 
                  'tool-searchContacts'
                ].includes(p.type) && p.state === 'output-available'
            );
            const lastIsEmptyAssistant = lastMsg?.role === "assistant" &&
                !lastMsg.parts?.some((p: any) => p.type === "text" && p.text?.trim());
            
            if (!lastIsUser && (!lastIsEmptyAssistant || hasToolOutput)) return null;

            return (
              <View style={styles.aiWrapper}>
                <View style={[styles.messageBubble, styles.aiBubble]}>
                  <ActivityIndicator size="small" color={Colors.textTertiary} />
                </View>
              </View>
            );
          })()}

          {error && (
            <View style={styles.errorContainer}>
              <ThemeText style={styles.errorText}>Có lỗi xảy ra: {error.message}</ThemeText>
            </View>
          )}
        </ScrollView>

        {/* Suggestion chips — luôn hiển thị, cuộn ngang */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
          contentContainerStyle={styles.chipsContainer}
          keyboardShouldPersistTaps="handled"
        >
            {[
              'Hôm nay có lịch gì?',
              'Tạo lịch họp',
              'Lịch tuần tới',
              'Tạo lịch với bạn',
              'Xóa lịch hẹn',
            ].map((text) => (
              <TouchableOpacity
                key={text}
                style={[styles.chip, isLoading && styles.chipDisabled]}
                onPress={() => { if (!isLoading) sendMessage({ text }); }}
                disabled={isLoading}
              >
                <ThemeText style={styles.chipText}>{text}</ThemeText>
              </TouchableOpacity>
            ))}
        </ScrollView>

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Nhắn tin cho trợ lý..."
              placeholderTextColor={Colors.placeholder}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={500}
            />
            <TouchableOpacity 
              style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!input.trim() || isLoading}
            >
              <Send size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    backgroundColor: Colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  headerSub: { fontSize: 12, color: Colors.textTertiary, fontWeight: '600' },
  clearBtn: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.round,
  },
  chatArea: { flex: 1 },
  chatContent: { padding: Spacing.lg, paddingBottom: Spacing.xl },
  messageWrapper: { marginBottom: Spacing.md, maxWidth: '85%' },
  userWrapper: { alignSelf: 'flex-end', marginBottom: Spacing.md },
  aiWrapper: { alignSelf: 'flex-start', marginBottom: Spacing.md, maxWidth: '92%' },
  toolResultWrapper: { marginTop: Spacing.xs, width: '100%' },
  toolWrapper: {
    alignSelf: 'stretch',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  messageBubble: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.lg,
  },
  userBubble: {
    backgroundColor: Colors.black,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  messageText: { fontSize: 16, lineHeight: 22 },
  userText: { color: Colors.white, fontWeight: '500' },
  aiText: { color: Colors.text, fontWeight: '500' },
  welcomeContainer: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: Spacing.xl,
  },
  aiIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  welcomeTitle: { fontSize: 24, fontWeight: '900', color: Colors.text, marginBottom: Spacing.sm },
  welcomeSub: { fontSize: 16, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  inputContainer: {
    padding: Spacing.md,
    paddingBottom: Spacing.md + 4,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.text,
    maxHeight: 120,
    textAlignVertical: 'center',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    marginRight: 4,
  },
  sendBtnDisabled: { backgroundColor: Colors.textTertiary, opacity: 0.5 },
  toolContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    marginTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  toolText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  errorContainer: {
    padding: Spacing.md,
    backgroundColor: '#FFE5E5',
    borderRadius: BorderRadius.md,
    marginVertical: Spacing.sm,
  },
  errorText: { color: '#D32F2F', fontSize: 14, fontWeight: '600' },
  historyLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  historyLoadingText: {
    fontSize: 13,
    color: Colors.textTertiary,
    fontWeight: '600',
  },
  // Suggestion chips
  chipsScroll: {
    flexGrow: 0,
    marginBottom: Spacing.sm,
  },
  chipsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xs,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    backgroundColor: Colors.surface,
  },
  chipDisabled: { opacity: 0.5 },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
});
