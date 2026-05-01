import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from './Skeleton';
import { Spacing, BorderRadius, Colors } from '../theme/Theme';

export const AppointmentSkeleton = () => {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Skeleton width={100} height={12} borderRadius={4} style={{ marginBottom: 8 }} />
          <Skeleton width="85%" height={24} borderRadius={6} />
        </View>
      </View>
      
      <View style={styles.cardBottomRow}>
        <Skeleton width={80} height={28} borderRadius={20} />
        <View style={styles.avatarsWrapper}>
          <Skeleton width={32} height={32} borderRadius={16} />
          <Skeleton width={32} height={32} borderRadius={16} style={{ marginLeft: -12 }} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    minHeight: 150,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    width: '100%',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
  },
  avatarsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
