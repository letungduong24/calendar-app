import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Settings, ChevronRight, Bell, Moon, Shield, Info } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius } from '../theme/Theme';
import { ThemeText } from '../components/ThemeText';

export default function SettingsScreen() {
  const sections = [
    { title: 'Thông báo', icon: <Bell size={20} color={Colors.text} />, value: 'Bật' },
    { title: 'Giao diện', icon: <Moon size={20} color={Colors.text} />, value: 'Sáng' },
    { title: 'Bảo mật', icon: <Shield size={20} color={Colors.text} />, value: '' },
    { title: 'Giới thiệu', icon: <Info size={20} color={Colors.text} />, value: 'v1.0.0' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ThemeText variant="h2" style={styles.pageTitle}>Cài đặt</ThemeText>
        
        <View style={styles.section}>
          {sections.map((item, index) => (
            <TouchableOpacity key={index} style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={styles.iconBox}>{item.icon}</View>
                <ThemeText style={styles.rowTitle}>{item.title}</ThemeText>
              </View>
              <View style={styles.rowRight}>
                {item.value ? <ThemeText color={Colors.textTertiary} style={styles.rowValue}>{item.value}</ThemeText> : null}
                <ChevronRight size={20} color={Colors.textTertiary} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  pageTitle: { marginTop: Spacing.md, marginBottom: Spacing.xl },
  section: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  rowTitle: { fontSize: 16, fontWeight: '600' },
  rowRight: { flexDirection: 'row', alignItems: 'center' },
  rowValue: { marginRight: 8, fontSize: 14 },
});
