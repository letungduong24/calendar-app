import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useSettingsStore } from '../store/useSettingsStore';
import apiClient from '../api/client';
import { Appointment } from '../hooks/useAppointments';

// Configure how notifications are handled when the app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function sendTestNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔔 Thông báo thử nghiệm',
      body: 'Nếu bạn thấy thông báo này, hệ thống đang hoạt động tốt!',
      sound: true,
    },
    trigger: {
      seconds: 2,
      type: 'timeInterval',
      channelId: 'default',
    } as any,
  });
}

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  return finalStatus === 'granted';
}

export async function scheduleAppointmentNotification(
  appointmentId: number,
  title: string,
  date: string, // YYYY-MM-DD
  time: string, // HH:mm
  reminderMinutes: number
) {
  // Check if notifications are globally enabled
  const { notificationsEnabled } = useSettingsStore.getState();
  if (!notificationsEnabled) {
    // Still cancel old ones just in case
    await cancelAllNotificationsForAppointment(appointmentId);
    return [];
  }

  // Use local time string parsing for consistency
  const eventDate = new Date(`${date}T${time}:00`);
  const now = new Date();

  if (isNaN(eventDate.getTime())) {
    console.warn(`Invalid date/time: ${date} ${time}`);
    return [];
  }

  // Cancel old notifications first
  await cancelAllNotificationsForAppointment(appointmentId);

  // If the event is in the past, don't schedule anything
  if (eventDate.getTime() <= now.getTime()) {
    return [];
  }

  const scheduled: string[] = [];

  // 1. Reminder notification X minutes before
  if (reminderMinutes > 0) {
    const triggerDate = new Date(eventDate.getTime() - reminderMinutes * 60000);
    if (triggerDate.getTime() > Date.now()) {
      const isToday = reminderMinutes < 1440;
      const [y, m, d] = date.split('-');
      const body = isToday
        ? `Diễn ra lúc ${time} hôm nay.`
        : `Diễn ra lúc ${time} ngày ${d}/${m}/${y}.`;

      const id = await Notifications.scheduleNotificationAsync({
        identifier: `appointment-${appointmentId}-reminder`,
        content: {
          title: '🔔 Nhắc hẹn: ' + title,
          body,
          data: { appointmentId },
          sound: true,
          android: {
            channelId: 'default',
          },
        } as any,
        trigger: {
          type: 'timeInterval',
          seconds: Math.max(1, Math.floor((triggerDate.getTime() - Date.now()) / 1000)),
          channelId: 'default',
        } as any,
      });
      scheduled.push(id);
    }
  }

  // 2. On-time notification — always schedule if event is in the future
  if (eventDate.getTime() > Date.now()) {
    const id = await Notifications.scheduleNotificationAsync({
      identifier: `appointment-${appointmentId}-ontime`,
      content: {
        title: '⏰ Đến giờ: ' + title,
        body: `Lịch hẹn của bạn bắt đầu ngay bây giờ.`,
        data: { appointmentId },
        sound: true,
        android: {
          channelId: 'default',
        },
      } as any,
      trigger: {
        type: 'timeInterval',
        seconds: Math.max(1, Math.floor((eventDate.getTime() - Date.now()) / 1000)),
        channelId: 'default',
      } as any,
    });
    scheduled.push(id);
  }

  return scheduled;
}

export async function cancelAllNotificationsForAppointment(appointmentId: number) {
  try {
    await Notifications.cancelScheduledNotificationAsync(`appointment-${appointmentId}-reminder`);
  } catch (_) {}
  try {
    await Notifications.cancelScheduledNotificationAsync(`appointment-${appointmentId}-ontime`);
  } catch (_) {}
  // Legacy ID support
  try {
    await Notifications.cancelScheduledNotificationAsync(`appointment-${appointmentId}`);
  } catch (_) {}
}

export async function cancelNotification(identifier: string) {
  if (!identifier) return;
  try {
    const fullId = identifier.startsWith('appointment-') ? identifier : `appointment-${identifier}`;
    await Notifications.cancelScheduledNotificationAsync(fullId);
  } catch (e) {
    console.error('Error canceling notification:', e);
  }
}

export async function rescheduleAllNotifications() {
  try {
    const response = await apiClient.get<Appointment[]>('/appointments');
    const appointments = response.data;
    
    // Cancel everything first to avoid duplicates
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    const now = new Date();
    
    for (const appt of appointments) {
      const eventDate = new Date(`${appt.date}T${appt.time}:00`);
      
      // Only schedule if the event is in the future
      if (!isNaN(eventDate.getTime()) && eventDate > now) {
        await scheduleAppointmentNotification(
          appt.id,
          appt.title,
          appt.date,
          appt.time,
          appt.reminder
        );
      }
    }
  } catch (error) {
    console.error('Failed to reschedule notifications:', error);
  }
}
