import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Calendar, PlusCircle, Trash2, User } from 'lucide-react-native';
import { ThemeText } from './ThemeText';
import { ThemeButton } from './ThemeButton';
import { Colors, Spacing, BorderRadius } from '../theme/Theme';
import { AppointmentDetailModal } from './AppointmentDetailModal';
import AppointmentCard from './AppointmentCard';
import type { Appointment } from '../hooks/useAppointments';

// ── Loading row ───────────────────────────────────────────────────────────────
function LoadingRow({ label }: { label: string }) {
  return (
    <View style={styles.loadingRow}>
      <ActivityIndicator size="small" color={Colors.textTertiary} />
      <ThemeText style={styles.loadingLabel}>{label}</ThemeText>
    </View>
  );
}

// ── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <View style={styles.skeletonCard}>
      <View style={[styles.skeletonLine, { width: '55%' }]} />
      <View style={[styles.skeletonLine, { width: '35%', marginTop: 8 }]} />
    </View>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, color }: { icon: any; title: string; color?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Icon size={13} color={color || Colors.textSecondary} />
      <ThemeText style={[styles.sectionTitle, color ? { color } : {}]}>{title}</ThemeText>
    </View>
  );
}

// ── Tappable appointment card wrapper ─────────────────────────────────────────
function TappableAppointmentCard({ item }: { item: any }) {
  const [modalVisible, setModalVisible] = useState(false);

  const appointment: Appointment = {
    id: item.id,
    title: item.title,
    date: item.date || '',
    time: item.time,
    endTime: item.endTime || undefined,
    description: item.description || undefined,
    location: item.location || undefined,
    reminder: item.reminder ?? 0,
    attendees: (item.attendees ?? []).map((a: any) => ({ id: a.id, name: a.name })),
  };

  return (
    <>
      <AppointmentCard
        appointment={appointment}
        variant="compact"
        onPress={() => setModalVisible(true)}
      />
      <AppointmentDetailModal
        isVisible={modalVisible}
        appointment={appointment}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}

// ── tool-getAppointments ──────────────────────────────────────────────────────
export function GetAppointmentsResult({ part }: { part: any }) {
  if (part.state === 'input-streaming' || part.state === 'input-available') {
    return (
      <View style={styles.toolCard}>
        <LoadingRow label="Đang tìm kiếm lịch hẹn..." />
        <SkeletonCard />
        <SkeletonCard />
      </View>
    );
  }
  if (part.state === 'output-available') {
    const appointments: any[] = Array.isArray(part.output) ? part.output : [];
    return (
      <View style={styles.toolCard}>
        <SectionHeader
          icon={Calendar}
          title={appointments.length > 0 ? `${appointments.length} lịch hẹn` : 'Không có lịch hẹn'}
        />
        {appointments.length === 0 ? (
          <ThemeText style={styles.emptyText}>Không có lịch hẹn nào trong ngày này.</ThemeText>
        ) : (
          appointments.map((item, i) => (
            <TappableAppointmentCard key={item.id ?? i} item={item} />
          ))
        )}
      </View>
    );
  }
  return null;
}

// ── tool-createAppointment ────────────────────────────────────────────────────
export function CreateAppointmentResult({ 
  part, 
  onResolveConflict 
}: { 
  part: any; 
  onResolveConflict?: (action: 'replace' | 'ignore', conflictingId: number, title: string) => void;
}) {
  if (part.state === 'input-streaming' || part.state === 'input-available') {
    return <LoadingRow label="Đang tạo lịch hẹn..." />;
  }
  if (part.state === 'output-available') {
    const output = part.output as { success: boolean; appointment?: any; message?: string; errorType?: string; conflictingAppointment?: any } | undefined;
    
    if (output?.errorType === 'CONFLICT') {
      return (
        <View style={[styles.toolCard, styles.toolCardError]}>
          <SectionHeader icon={Calendar} title="Lịch hẹn bị trùng" color={Colors.error} />
          <ThemeText style={styles.errorText}>{output.message}</ThemeText>
          {output.conflictingAppointment && (
            <View style={{ marginTop: Spacing.sm }}>
              <ThemeText variant="small" color={Colors.textSecondary} style={{ marginBottom: 4, fontWeight: '800' }}>
                LỊCH HIỆN TẠI:
              </ThemeText>
              <TappableAppointmentCard item={output.conflictingAppointment} />
              
              <View style={styles.conflictActions}>
                <ThemeButton 
                  title="Thay thế lịch cũ" 
                  size="sm"
                  onPress={() => onResolveConflict?.('replace', output.conflictingAppointment.id, output.conflictingAppointment.title)}
                  style={{ flex: 1 }}
                />
                <ThemeButton 
                  title="Bỏ qua" 
                  variant="outline" 
                  size="sm"
                  onPress={() => onResolveConflict?.('ignore', output.conflictingAppointment.id, output.conflictingAppointment.title)}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          )}
        </View>
      );
    }

    if (!output?.success) {
      return (
        <View style={[styles.toolCard, styles.toolCardError]}>
          <ThemeText style={styles.errorText}>Không thể tạo: {output?.message || 'Lỗi không xác định'}</ThemeText>
        </View>
      );
    }
    return (
      <View style={[styles.toolCard, styles.toolCardSuccess]}>
        <SectionHeader icon={PlusCircle} title="Đã tạo lịch hẹn" color="#4CAF50" />
        {output.appointment && <TappableAppointmentCard item={output.appointment} />}
      </View>
    );
  }
  return null;
}

// ── tool-deleteAppointment ────────────────────────────────────────────────────
export function DeleteAppointmentResult({ part }: { part: any }) {
  if (part.state === 'input-streaming' || part.state === 'input-available') {
    return <LoadingRow label="Đang xóa lịch hẹn..." />;
  }
  if (part.state === 'output-available') {
    const output = part.output as { success: boolean; title?: string; message?: string } | undefined;
    const success = output?.success ?? false;
    return (
      <View style={[styles.toolCard, success ? styles.toolCardSuccess : styles.toolCardError]}>
        <SectionHeader
          icon={Trash2}
          title={success ? `Đã xóa: ${output?.title || 'Lịch hẹn'}` : 'Không thể xóa lịch hẹn'}
          color={success ? '#4CAF50' : Colors.error}
        />
        {!success && output?.message && (
          <ThemeText style={styles.errorText}>{output.message}</ThemeText>
        )}
      </View>
    );
  }
  return null;
}

// ── tool-deleteMultipleAppointments ───────────────────────────────────────────
export function DeleteMultipleAppointmentsResult({ part }: { part: any }) {
  if (part.state === 'input-streaming' || part.state === 'input-available') {
    return <LoadingRow label="Đang xóa các lịch hẹn..." />;
  }
  if (part.state === 'output-available') {
    const output = part.output as { success: boolean; count?: number; message?: string } | undefined;
    const success = output?.success ?? false;
    return (
      <View style={[styles.toolCard, success ? styles.toolCardSuccess : styles.toolCardError]}>
        <SectionHeader
          icon={Trash2}
          title={success ? `Đã xóa ${output?.count} lịch hẹn` : 'Không thể xóa các lịch hẹn'}
          color={success ? '#4CAF50' : Colors.error}
        />
        {output?.message && (
          <ThemeText style={styles.errorText}>{output.message}</ThemeText>
        )}
      </View>
    );
  }
  return null;
}

// ── tool-resolveAttendees ─────────────────────────────────────────────────────
export function ResolveAttendeesResult({ part }: { part: any }) {
  if (part.state === 'input-streaming' || part.state === 'input-available') {
    return <LoadingRow label="Đang tìm kiếm người tham gia..." />;
  }
  if (part.state === 'output-available') {
    const output = part.output as {
      attendees: { id: number; name: string }[];
      newlyCreated: string[];
    };
    const attendees = output?.attendees ?? [];
    const newlyCreated = new Set(output?.newlyCreated ?? []);

    return (
      <View style={styles.toolCard}>
        <SectionHeader
          icon={User}
          title={`${attendees.length} người tham gia`}
        />
        {attendees.map((c) => (
          <View key={c.id} style={styles.contactRow}>
            <View style={styles.contactAvatar}>
              <ThemeText style={styles.contactInitial}>
                {c.name.trim().charAt(0).toUpperCase()}
              </ThemeText>
            </View>
            <ThemeText style={styles.contactName}>{c.name}</ThemeText>
            {newlyCreated.has(c.name) && (
              <View style={styles.newBadge}>
                <ThemeText style={styles.newBadgeText}>MỚI</ThemeText>
              </View>
            )}
          </View>
        ))}
        {newlyCreated.size > 0 && (
          <ThemeText style={styles.newlyCreatedNote}>
            Đã tự động thêm {newlyCreated.size} người mới vào danh bạ.
          </ThemeText>
        )}
      </View>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  // Loading
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  loadingLabel: {
    fontSize: 13,
    color: Colors.textTertiary,
    fontWeight: '600',
  },

  // Skeleton
  skeletonCard: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.xs,
    minHeight: 85,
  },
  skeletonLine: {
    height: 10,
    backgroundColor: 'rgba(0,0,0,0.07)',
    borderRadius: 4,
  },

  // Tool card wrapper
  toolCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    gap: Spacing.xs,
  },
  toolCardSuccess: {
    borderColor: 'rgba(76,175,80,0.25)',
    backgroundColor: 'rgba(76,175,80,0.04)',
  },
  toolCardError: {
    borderColor: 'rgba(244,67,54,0.25)',
    backgroundColor: 'rgba(244,67,54,0.04)',
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  // Empty / error text
  emptyText: {
    fontSize: 13,
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 13,
    color: Colors.error,
    fontWeight: '600',
  },

  // Contact row
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  contactAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  contactInitial: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.text,
  },
  contactName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    flexShrink: 1,
  },
  newBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#4CAF50',
    marginLeft: 'auto',
  },
  newBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
  },
  newlyCreatedNote: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    fontStyle: 'italic',
    marginTop: Spacing.xs,
  },
  conflictActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: Spacing.md,
  },
});
