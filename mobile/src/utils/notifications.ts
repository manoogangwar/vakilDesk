import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import api from './api';

// Configure how notifications appear when the app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function registerPushToken(): Promise<void> {
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return;
    const tokenData = await Notifications.getExpoPushTokenAsync();
    await api.post('/messages/push-token/', { token: tokenData.data });
  } catch {
    // Non-critical — silently skip if push token registration fails
  }
}

type UpcomingCase = { id: number; case_name: string; next_date: string };

export async function scheduleHearingReminders(cases: UpcomingCase[]): Promise<void> {
  const granted = await requestNotificationPermission();
  if (!granted) return;

  // Cancel all previously scheduled hearing notifications
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const hearingNotifs = scheduled.filter(n => n.content.data?.type === 'hearing_reminder');
  await Promise.all(hearingNotifs.map(n => Notifications.cancelScheduledNotificationAsync(n.identifier)));

  const now = new Date();

  for (const c of cases) {
    if (!c.next_date) continue;

    // Fire at 9 AM the day before the hearing
    const hearing = new Date(c.next_date + 'T00:00:00');
    const reminder = new Date(hearing);
    reminder.setDate(hearing.getDate() - 1);
    reminder.setHours(9, 0, 0, 0);

    if (reminder <= now) continue; // already passed

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📅 Hearing Tomorrow',
        body: `${c.case_name} has a hearing scheduled for tomorrow.`,
        data: { type: 'hearing_reminder', caseId: c.id },
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminder },
    });

    // Also fire a notification on the hearing day at 8 AM
    const dayOf = new Date(hearing);
    dayOf.setHours(8, 0, 0, 0);
    if (dayOf > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⚖️ Hearing Today',
          body: `${c.case_name} has a hearing today. All the best!`,
          data: { type: 'hearing_reminder', caseId: c.id },
          sound: true,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: dayOf },
      });
    }
  }
}
