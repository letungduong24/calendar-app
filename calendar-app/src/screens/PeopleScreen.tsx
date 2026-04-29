import React, { useEffect, useState } from 'react';
import { View, TextInput, StyleSheet, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { toast } from 'react-native-sonner';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getDB } from '../db/database';
import { Phone, User, PlusCircle, UserCircle2 } from 'lucide-react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../theme/Theme';
import { ThemeText } from '../components/ThemeText';
import { ThemeButton } from '../components/ThemeButton';

export default function PeopleScreen({ navigation }: any) {
  const [people, setPeople] = useState([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    loadPeople();
  }, []);

  const loadPeople = async () => {
    try {
      const db = await getDB();
      const allRows = await db.getAllAsync('SELECT * FROM people ORDER BY name ASC');
      setPeople(allRows as any);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdd = async () => {
    if (!name) {
      toast.error('Vui lòng nhập tên');
      return;
    }
    try {
      const db = await getDB();
      await db.runAsync('INSERT INTO people (name, phone) VALUES (?, ?)', [String(name), String(phone)]);
      setName('');
      setPhone('');
      loadPeople();
    } catch (e) {
      console.error('Database error in PeopleScreen:', e);
      toast.error('Không thể thêm liên hệ');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <ThemeText variant="h2">Danh bạ</ThemeText>
        </View>

        <FlatList
          data={people}
          contentContainerStyle={styles.listContent}
          keyExtractor={(item: any) => item.id.toString()}
          renderItem={({ item, index }: any) => (
            <View style={[styles.card, { backgroundColor: index % 2 === 0 ? Colors.cardTeal : Colors.cardLavender }]}>
              <View style={styles.avatarContainer}>
                <ThemeText variant="h3" color={Colors.white}>{item.name.charAt(0).toUpperCase()}</ThemeText>
              </View>
              <View style={styles.cardContent}>
                <ThemeText variant="title">{item.name}</ThemeText>
                {item.phone ? <ThemeText variant="body" color={Colors.textSecondary}>{item.phone}</ThemeText> : null}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <UserCircle2 color={Colors.textTertiary} size={60} style={styles.emptyIcon} />
              <ThemeText variant="body" color={Colors.textTertiary}>Chưa có liên hệ nào</ThemeText>
            </View>
          }
        />

        <View style={styles.addSection}>
          <ThemeText variant="title" style={styles.addSectionTitle}>Thêm liên hệ mới</ThemeText>
          <View style={styles.inputContainer}>
            <User color={Colors.textTertiary} size={20} style={styles.inputIcon} />
            <TextInput 
              style={styles.input} 
              placeholder="Tên" 
              placeholderTextColor={Colors.textTertiary}
              value={name} 
              onChangeText={setName} 
            />
          </View>
          <View style={[styles.inputContainer, { marginTop: 12 }]}>
            <Phone color={Colors.textTertiary} size={20} style={styles.inputIcon} />
            <TextInput 
              style={styles.input} 
              placeholder="Số điện thoại (Tùy chọn)" 
              placeholderTextColor={Colors.textTertiary}
              keyboardType="phone-pad"
              value={phone} 
              onChangeText={setPhone} 
            />
          </View>
          <ThemeButton 
            title="Thêm liên hệ" 
            onPress={handleAdd} 
            size="lg" 
            style={{ marginTop: 15 }}
            icon={<PlusCircle color={Colors.white} size={20} />}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  keyboardView: { flex: 1 },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: 20 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: 12,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  cardContent: { flex: 1 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  emptyIcon: { marginBottom: 10 },
  addSection: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  addSectionTitle: { marginBottom: 15 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: 15,
    height: 60,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: Colors.text, height: '100%', fontWeight: '600' },
});
