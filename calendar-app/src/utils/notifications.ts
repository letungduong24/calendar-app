import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

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
  if (reminderMinutes === 0) return null;

  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  
  const eventDate = new Date(year, month - 1, day, hour, minute);
  const triggerDate = new Date(eventDate.getTime() - reminderMinutes * 60000);

  // If trigger date is in the past, don't schedule
  if (triggerDate.getTime() <= Date.now()) {
    return null;
  }

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Nhắc hẹn: ' + title,
      body: `Diễn ra lúc ${time} hôm nay.`,
      data: { appointmentId },
    },
    trigger: triggerDate as any,
  });

  return identifier;
}

export async function cancelNotification(identifier: string) {
  if (!identifier) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch (e) {
    console.error('Error canceling notification:', e);
  }
}
