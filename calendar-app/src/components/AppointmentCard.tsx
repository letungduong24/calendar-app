import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../theme/Theme';
import { ThemeText } from './ThemeText';
import { Appointment } from '../hooks/useAppointments';

interface Props {
  appointment: Appointment;
  variant?: 'default' | 'compact';
  onPress?: () => void;
}

export default function AppointmentCard({ appointment, variant = 'default', onPress }: Props) {
  const { id, title, description, time, endTime, attendees } = appointment;
  
  // Pick a color pair based on appointment ID
  const colorPair = Colors.cards[id % Colors.cards.length];
  const bgColor = colorPair.bg;
  const textColor = colorPair.text;
  
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    return `${days[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}`;
  };

  const displayTime = endTime ? `${time} - ${endTime}` : time;
  const hasAttendees = attendees && attendees.length > 0;
  const isCompact = variant === 'compact';

  return (
    <TouchableOpacity 
      activeOpacity={0.8} 
      onPress={onPress}
      style={[
        styles.card, 
        { backgroundColor: bgColor },
        isCompact && styles.cardCompact
      ]}
    >
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <ThemeText 
            variant="caption" 
            color={textColor} 
            style={{ opacity: 0.8, marginBottom: isCompact ? 0 : 4, fontSize: isCompact ? 10 : 12 }}
          >
            {formatDate(appointment.date)}
          </ThemeText>
          <ThemeText 
            variant={isCompact ? 'title' : 'h3'} 
            numberOfLines={isCompact ? 1 : 2} 
            color={textColor}
            style={{ fontWeight: '800' }}
          >
            {title}
          </ThemeText>
        </View>
      </View>
      
      {!isCompact && description && (
        <ThemeText 
          variant="body" 
          color={textColor} 
          style={{ marginTop: 8, opacity: 0.7 }}
          numberOfLines={2}
        >
          {description}
        </ThemeText>
      )}
      
      <View style={[styles.cardBottomRow, isCompact && styles.cardBottomRowCompact]}>
        {/* Time Badge with inverted colors */}
        <View style={[styles.timeBadge, { backgroundColor: textColor }]}>
          <ThemeText 
            variant={isCompact ? 'small' : 'caption'} 
            color={bgColor}
            style={{ fontWeight: '800', textTransform: 'none', letterSpacing: 0 }}
          >
            {displayTime}
          </ThemeText>
        </View>
        
        {hasAttendees && (
          <View style={styles.avatarsWrapper}>
            {attendees.slice(0, 3).map((person, i) => (
              <View 
                key={person.id} 
                style={[
                  styles.avatarCircle, 
                  isCompact && styles.avatarCircleCompact,
                  { 
                    backgroundColor: Colors.white, 
                    borderColor: bgColor, 
                    marginLeft: i > 0 ? (isCompact ? -8 : -12) : 0 
                  }
                ]}
              >
                <ThemeText 
                  variant="small" 
                  color={textColor} 
                  style={{ fontSize: isCompact ? 8 : 10, fontWeight: '900' }}
                >
                  {person.name.charAt(0).toUpperCase()}
                </ThemeText>
              </View>
            ))}
            {attendees.length > 3 && (
              <View 
                style={[
                  styles.avatarCircle, 
                  isCompact && styles.avatarCircleCompact,
                  { backgroundColor: Colors.secondary, borderColor: bgColor, marginLeft: isCompact ? -8 : -12 }
                ]}
              >
                <ThemeText 
                  variant="small" 
                  color={textColor} 
                  style={{ fontSize: isCompact ? 8 : 10, fontWeight: '900' }}
                >
                  +{attendees.length - 3}
                </ThemeText>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
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
  },
  cardCompact: {
    padding: Spacing.md,
    minHeight: 85,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  timeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  avatarsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarCircleCompact: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
  },
  cardBottomRowCompact: {
    borderTopWidth: 0,
    paddingTop: 0,
    marginTop: 2,
  },
});
