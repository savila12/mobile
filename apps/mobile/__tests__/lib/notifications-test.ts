import * as Notifications from 'expo-notifications';
import { requestNotificationPermission, scheduleMaintenanceReminder } from '../../src/lib/notifications';

jest.mock('expo-notifications');

describe('notifications', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('requestNotificationPermission', () => {
        it('returns true if permission is already granted', async () => {
            (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ granted: true });

            const result = await requestNotificationPermission();

            expect(result).toBe(true);
        });

        it('requests permission if not granted', async () => {
            (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ granted: false });
            (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ granted: true });

            const result = await requestNotificationPermission();

            expect(result).toBe(true);
            expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
        });

        it('returns false if permission is denied', async () => {
            (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ granted: false });
            (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ granted: false });

            const result = await requestNotificationPermission();

            expect(result).toBe(false);
        });
    });

    describe('scheduleMaintenanceReminder', () => {
        it('schedules notification for future date', async () => {
            const futureDate = new Date(Date.now() + 86400000).toISOString(); // 24 hours from now
            (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('notification-id');

            const result = await scheduleMaintenanceReminder('task-123', 'Oil Change', 'Due soon', futureDate);

            expect(result).toBe('notification-id');
            expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
                expect.objectContaining({
                    content: {
                        title: 'Oil Change',
                        body: 'Due soon',
                        data: { identifier: 'task-123' },
                    },
                }),
            );
        });

        it('returns null for past date', async () => {
            const pastDate = new Date(Date.now() - 86400000).toISOString(); // 24 hours ago

            const result = await scheduleMaintenanceReminder('task-123', 'Oil Change', 'Overdue', pastDate);

            expect(result).toBeNull();
            expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
        });

        it('returns null for invalid date', async () => {
            const invalidDate = 'invalid-date-string';

            const result = await scheduleMaintenanceReminder('task-123', 'Oil Change', 'Invalid', invalidDate);

            expect(result).toBeNull();
            expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
        });

        it('returns null when date equals current time', async () => {
            const now = new Date().toISOString();

            const result = await scheduleMaintenanceReminder('task-123', 'Oil Change', 'Now', now);

            expect(result).toBeNull();
        });
    });
});
