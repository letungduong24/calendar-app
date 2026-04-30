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
  DeleteMultipleAppointmentsResult,
  ResolveAttendeesResult,
} from '../components/ChatToolResults';
import { scheduleAppointmentNotification, cancelNotification } from '../utils/notifications';

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

        // Handle notifications for AI-generated actions
        lastAssistantMessage?.parts?.forEach((p: any) => {
          if (p.type === 'tool-createAppointment' && p.state === 'output-available' && p.output?.success) {
            const appt = p.output.appointment;
            if (appt.reminder > 0) {
              scheduleAppointmentNotification(appt.id, appt.title, appt.date, appt.time, appt.reminder);
            }
          }
          if (p.type === 'tool-deleteAppointment' && p.state === 'output-available' && p.output?.success) {
            // Need ID from input since output doesn't have it
            const apptId = p.args?.id;
            if (apptId) cancelNotification(apptId.toString());
          }
          if (p.type === 'tool-deleteMultipleAppointments' && p.state === 'output-available' && p.output?.success) {
            const ids = p.args?.ids ?? [];
            ids.forEach((id: number) => cancelNotification(id.toString()));
          }
        });
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


  const handleSend = () => {
    if (input.trim() && !isLoading) {
      sendMessage({ text: input });
      setInput('');
    }
  };

  const handleResolveConflict = (action: 'replace' | 'ignore', conflictingId: number, title: string) => {
    if (action === 'replace') {
      sendMessage({ text: `Thay thế lịch cũ "${title}" (ID: ${conflictingId}) bằng lịch mới này giúp tôi.` });
    } else {
      sendMessage({ text: `Tôi đã hiểu, hãy giữ nguyên lịch cũ "${title}" và không tạo lịch mới này nữa.` });
    }
  };

  // Render từng part theo đúng type — giống train-booking switch pattern
  const renderPart = (part: any, index: number, m: any) => {
    // Inject args into part for easier access in results
    const enhancedPart = { ...part, args: m.toolCalls?.find((tc: any) => tc.toolCallId === (part.toolCallId || part.id))?.args };
    
    switch (part.type) {
      case 'text': {
        if (!part.text?.trim()) return null;
        // Ẩn text nếu message có bất kỳ tool part nào (dù đang gọi hay đã có kết quả)
        if (m.role === 'assistant') {
          const hasAnyTool = m.parts?.some((p: any) =>
            p.type?.startsWith('tool-')
          );
          if (hasAnyTool) return null;
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
      case 'tool-deleteMultipleAppointments':
      case 'tool-resolveAttendees': {
        const hasData = enhancedPart.output !== undefined || enhancedPart.result !== undefined;
        const isInteracting = enhancedPart.state === 'input-streaming' || enhancedPart.state === 'input-available' || enhancedPart.state === 'call';
        
        // Nếu không có dữ liệu và cũng không phải đang chạy -> không render component lỗi
        if (!hasData && !isInteracting) return null;
        
        // Cần đảm bảo component nhận được data đúng field
        const finalPart = { ...enhancedPart, output: enhancedPart.output ?? enhancedPart.result };

        if (part.type === 'tool-getAppointments') return <GetAppointmentsResult key={index} part={finalPart} />;
        if (part.type === 'tool-createAppointment') return <CreateAppointmentResult key={index} part={finalPart} onResolveConflict={handleResolveConflict} />;
        if (part.type === 'tool-deleteAppointment') return <DeleteAppointmentResult key={index} part={finalPart} />;
        if (part.type === 'tool-deleteMultipleAppointments') return <DeleteMultipleAppointmentsResult key={index} part={finalPart} />;
        if (part.type === 'tool-resolveAttendees') return <ResolveAttendeesResult key={index} part={finalPart} />;
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
          </View>
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
            
            // Group consecutive tool parts to show them in a single card-like container if possible
            // or just ensure they are close together.
            // For now, let's group all tool parts of a single message into one toolWrapper area
            const toolParts = (m.parts ?? []).filter((p: any) => p.type !== 'text');
            const textParts = (m.parts ?? []).filter((p: any) => p.type === 'text');

            return (
              <View key={m.id}>
                {textParts.map((part: any, i: number) => {
                  const rendered = renderPart(part, i, m);
                  if (!rendered) return null;
                  return (
                    <View key={`${m.id}-text-${i}`} style={isUser ? styles.userWrapper : styles.aiWrapper}>
                      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
                        {rendered}
                      </View>
                    </View>
                  );
                })}
                
                {toolParts.length > 0 && (
                  <View style={styles.toolWrapper}>
                    {toolParts.map((part: any, i: number) => (
                      <View key={`${m.id}-tool-${i}`} style={styles.toolResultItem}>
                        {renderPart(part, i, m)}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}

          {isLoading && (() => {
            const lastMsg = messages[messages.length - 1];
            const lastIsUser = lastMsg?.role === "user";
            const hasToolOutput = lastMsg?.parts?.some(
                (p: any) => [
                  'tool-getAppointments', 
                  'tool-createAppointment', 
                  'tool-deleteAppointment', 
                  'tool-deleteMultipleAppointments',
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
              'Tạo lịch',
              'Lịch hôm nay',
              'Lịch tuần này',
              'Lịch tuần trước',
              'Lịch tháng này',
              'Thứ 6 tới có lịch gì?',
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
  toolResultItem: {
    marginBottom: Spacing.sm,
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
    paddingTop: Spacing.sm,
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
