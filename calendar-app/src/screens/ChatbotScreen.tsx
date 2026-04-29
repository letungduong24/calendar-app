import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { MessageSquare } from 'lucide-react-native';
import { Colors, Spacing } from '../theme/Theme';
import { ThemeText } from '../components/ThemeText';

export default function ChatbotScreen() {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ThemeText variant="h2" style={styles.pageTitle}>AI Assistant</ThemeText>
        
        <View style={styles.emptyContent}>
          <MessageSquare size={80} color={Colors.textTertiary as string} />
          <ThemeText style={styles.emptyText}>Tính năng chatbot đang được phát triển...</ThemeText>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  pageTitle: { marginTop: Spacing.md, marginBottom: Spacing.xl },
  emptyContent: { 
    marginTop: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: { marginTop: Spacing.lg, color: Colors.textSecondary }
});
