import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const requestNotificationPermission = async () => {
  const settings = await Notifications.getPermissionsAsync();

  if (settings.granted) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
};

export const scheduleMaintenanceReminder = async (
  identifier: string,
  title: string,
  body: string,
  dueDateIso: string,
) => {
  const dueDate = new Date(dueDateIso);

  if (Number.isNaN(dueDate.valueOf()) || dueDate <= new Date()) {
    return null;
  }

  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: {
        identifier,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: dueDate,
    },
  });
};

export const cancelMaintenanceReminder = async (identifier: string): Promise<boolean> => {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();

  const target = scheduled.find((notification) => {
    const data = notification.content.data;

    if (!data || typeof data !== 'object') {
      return false;
    }

    const candidate = (data as { identifier?: unknown }).identifier;
    return typeof candidate === 'string' && candidate === identifier;
  });

  if (!target) {
    return false;
  }

  await Notifications.cancelScheduledNotificationAsync(target.identifier);
  return true;
};
