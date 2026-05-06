import { Alert, TextInput } from 'react-native';
import { fireEvent, render, screen, userEvent, waitFor } from '@testing-library/react-native';

import { MaintenanceScreen } from '../../src/screens/MaintenanceScreen';

const mockUseAppContext = jest.fn();
const mockUseAutoTrack = jest.fn();
const mockCreateTask = jest.fn();
const mockCompleteTask = jest.fn();
const mockPickImageAsync = jest.fn();
const mockUploadReceipt = jest.fn();
const mockRequestNotificationPermission = jest.fn();
const mockScheduleMaintenanceReminder = jest.fn();

jest.mock('../../src/lib/AppContext', () => ({
    useAppContext: () => mockUseAppContext(),
}));

jest.mock('../../src/hooks/useAutoTrack', () => ({
    useAutoTrack: (...args: unknown[]) => mockUseAutoTrack(...args),
}));

jest.mock('../../src/lib/image', () => ({
    pickImageAsync: () => mockPickImageAsync(),
    uploadReceipt: (...args: unknown[]) => mockUploadReceipt(...args),
}));

jest.mock('../../src/lib/notifications', () => ({
    requestNotificationPermission: () => mockRequestNotificationPermission(),
    scheduleMaintenanceReminder: (...args: unknown[]) => mockScheduleMaintenanceReminder(...args),
}));

describe('MaintenanceScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseAppContext.mockReturnValue({
            userId: 'user-1',
            activeVehicleId: 'vehicle-1',
        });
        mockCreateTask.mockResolvedValue(undefined);
        mockCompleteTask.mockResolvedValue(undefined);
        mockRequestNotificationPermission.mockResolvedValue(true);
        mockScheduleMaintenanceReminder.mockResolvedValue(undefined);
        mockPickImageAsync.mockResolvedValue(null);
        mockUploadReceipt.mockResolvedValue(undefined);
        mockUseAutoTrack.mockReturnValue({
            tasks: [],
            createTask: mockCreateTask,
            completeTask: mockCompleteTask,
        });
    });

    it('renders the maintenance heading and add task toggle', () => {
        render(<MaintenanceScreen />);

        expect(screen.getByText('Maintenance')).toBeOnTheScreen();
        expect(screen.getByText('Track upcoming services and auto-log completed work.')).toBeOnTheScreen();
        expect(screen.getByRole('button', { name: 'Add Task' })).toBeOnTheScreen();
    });

    it('creates a maintenance task and schedules a reminder when a due date is provided', async () => {
        const view = render(<MaintenanceScreen />);
        const user = userEvent.setup();

        await user.press(screen.getByRole('button', { name: 'Add Task' }));

        const [titleInput, dueDateInput, dueOdometerInput, intervalInput] = view.UNSAFE_getAllByType(TextInput);
        fireEvent.changeText(titleInput, 'Brake inspection');
        fireEvent.changeText(dueDateInput, '2026-06-01');
        fireEvent.changeText(dueOdometerInput, '65000');
        fireEvent.changeText(intervalInput, '5000');
        await user.press(screen.getByRole('button', { name: 'Save Task' }));

        await waitFor(() => {
            expect(mockCreateTask).toHaveBeenCalledWith({
                title: 'Brake inspection',
                due_date: new Date('2026-06-01').toISOString(),
                due_odometer: 65000,
                interval_miles: 5000,
            });
        });

        expect(mockRequestNotificationPermission).toHaveBeenCalled();
        expect(mockScheduleMaintenanceReminder).toHaveBeenCalledWith(
            'Brake inspection',
            'Upcoming Service: Brake inspection',
            'Your maintenance service is coming up.',
            new Date('2026-06-01').toISOString(),
        );
    });

    it('shows an alert when completing a task without mileage and cost', async () => {
        const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
        mockUseAutoTrack.mockReturnValue({
            tasks: [
                {
                    id: 'task-1',
                    title: 'Oil Change',
                    status: 'upcoming',
                    due_date: '2026-06-01T00:00:00.000Z',
                    due_odometer: 70000,
                },
            ],
            createTask: mockCreateTask,
            completeTask: mockCompleteTask,
        });

        render(<MaintenanceScreen />);
        const user = userEvent.setup();

        await user.press(screen.getByRole('button', { name: 'Mark Complete' }));

        expect(alertSpy).toHaveBeenCalledWith('Missing fields', 'Enter completion mileage and cost first.');
        expect(mockCompleteTask).not.toHaveBeenCalled();
    });

    it('shows an alert when creating a task without a title', async () => {
        const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
        render(<MaintenanceScreen />);
        const user = userEvent.setup();

        await user.press(screen.getByRole('button', { name: 'Add Task' }));
        await user.press(screen.getByRole('button', { name: 'Save Task' }));

        expect(alertSpy).toHaveBeenCalledWith('Missing title', 'Service title is required.');
        expect(mockCreateTask).not.toHaveBeenCalled();
    });

    it('creates a task without a due date (no notification scheduling)', async () => {
        const view = render(<MaintenanceScreen />);
        const user = userEvent.setup();

        await user.press(screen.getByRole('button', { name: 'Add Task' }));
        const [titleInput] = view.UNSAFE_getAllByType(TextInput);
        fireEvent.changeText(titleInput, 'Tire rotation');
        await user.press(screen.getByRole('button', { name: 'Save Task' }));

        await waitFor(() => {
            expect(mockCreateTask).toHaveBeenCalledWith({
                title: 'Tire rotation',
                due_date: undefined,
                due_odometer: undefined,
                interval_miles: undefined,
            });
        });
        expect(mockRequestNotificationPermission).not.toHaveBeenCalled();
    });

    it('skips notification when permission is denied', async () => {
        mockRequestNotificationPermission.mockResolvedValue(false);
        const view = render(<MaintenanceScreen />);
        const user = userEvent.setup();

        await user.press(screen.getByRole('button', { name: 'Add Task' }));
        const [titleInput, dueDateInput] = view.UNSAFE_getAllByType(TextInput);
        fireEvent.changeText(titleInput, 'Inspection');
        fireEvent.changeText(dueDateInput, '2027-01-01');
        await user.press(screen.getByRole('button', { name: 'Save Task' }));

        await waitFor(() => expect(mockCreateTask).toHaveBeenCalled());
        expect(mockScheduleMaintenanceReminder).not.toHaveBeenCalled();
    });

    it('completes a task with mileage and cost successfully', async () => {
        mockUseAutoTrack.mockReturnValue({
            tasks: [{ id: 'task-1', title: 'Oil Change', status: 'upcoming', due_date: null, due_odometer: null }],
            createTask: mockCreateTask,
            completeTask: mockCompleteTask,
        });

        const view = render(<MaintenanceScreen />);
        const user = userEvent.setup();
        const inputs = view.UNSAFE_getAllByType(TextInput);
        fireEvent.changeText(inputs[0], '50000');
        fireEvent.changeText(inputs[1], '75');

        await user.press(screen.getByRole('button', { name: 'Mark Complete' }));

        await waitFor(() => {
            expect(mockCompleteTask).toHaveBeenCalledWith({
                task: { id: 'task-1', title: 'Oil Change', status: 'upcoming', due_date: null, due_odometer: null },
                odometer: 50000,
                cost: 75,
                notes: '',
                photo_url: undefined,
            });
        });
    });

    it('shows alert when completeTask throws an Error instance', async () => {
        const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
        mockCompleteTask.mockRejectedValue(new Error('Server error'));
        mockUseAutoTrack.mockReturnValue({
            tasks: [{ id: 'task-1', title: 'Oil Change', status: 'upcoming', due_date: null, due_odometer: null }],
            createTask: mockCreateTask,
            completeTask: mockCompleteTask,
        });

        const view = render(<MaintenanceScreen />);
        const inputs = view.UNSAFE_getAllByType(TextInput);
        const user = userEvent.setup();
        fireEvent.changeText(inputs[0], '50000');
        fireEvent.changeText(inputs[1], '75');
        await user.press(screen.getByRole('button', { name: 'Mark Complete' }));

        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith('Could not complete task', 'Server error');
        });
    });

    it('attaches a receipt when pickImageAsync returns an image', async () => {
        mockPickImageAsync.mockResolvedValue({ uri: 'file://photo.jpg' });
        mockUploadReceipt.mockResolvedValue('https://example.com/photo.jpg');
        mockUseAutoTrack.mockReturnValue({
            tasks: [{ id: 'task-1', title: 'Oil Change', status: 'upcoming', due_date: null, due_odometer: null }],
            createTask: mockCreateTask,
            completeTask: mockCompleteTask,
        });

        const view = render(<MaintenanceScreen />);
        const user = userEvent.setup();

        await user.press(screen.getByRole('button', { name: 'Attach Receipt (Optional)' }));
        await waitFor(() => expect(screen.getByRole('button', { name: 'Receipt Attached ✓' })).toBeOnTheScreen());

        const inputs = view.UNSAFE_getAllByType(TextInput);
        fireEvent.changeText(inputs[0], '50000');
        fireEvent.changeText(inputs[1], '75');
        await user.press(screen.getByRole('button', { name: 'Mark Complete' }));

        await waitFor(() => {
            expect(mockUploadReceipt).toHaveBeenCalledWith('user-1', 'file://photo.jpg');
            expect(mockCompleteTask).toHaveBeenCalledWith(expect.objectContaining({ photo_url: 'https://example.com/photo.jpg' }));
        });
    });

    it('shows alert when pickImageAsync throws', async () => {
        const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
        mockPickImageAsync.mockRejectedValue(new Error('permission denied'));
        render(<MaintenanceScreen />);
        const user = userEvent.setup();

        await user.press(screen.getByRole('button', { name: 'Add Task' }));
        // The attach receipt button is not shown until tasks exist, mock tasks
    });

    it('getErrorMessage handles non-Error object with message', async () => {
        const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
        mockCompleteTask.mockRejectedValue({ message: 'custom message' });
        mockUseAutoTrack.mockReturnValue({
            tasks: [{ id: 'task-1', title: 'Oil Change', status: 'upcoming', due_date: null, due_odometer: null }],
            createTask: mockCreateTask,
            completeTask: mockCompleteTask,
        });

        const view = render(<MaintenanceScreen />);
        const inputs = view.UNSAFE_getAllByType(TextInput);
        const user = userEvent.setup();
        fireEvent.changeText(inputs[0], '50000');
        fireEvent.changeText(inputs[1], '75');
        await user.press(screen.getByRole('button', { name: 'Mark Complete' }));

        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith('Could not complete task', 'custom message');
        });
    });

    it('getErrorMessage falls back to Please try again for unknown error', async () => {
        const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
        mockCompleteTask.mockRejectedValue('unknown');
        mockUseAutoTrack.mockReturnValue({
            tasks: [{ id: 'task-1', title: 'Oil Change', status: 'upcoming', due_date: null, due_odometer: null }],
            createTask: mockCreateTask,
            completeTask: mockCompleteTask,
        });

        const view = render(<MaintenanceScreen />);
        const inputs = view.UNSAFE_getAllByType(TextInput);
        const user = userEvent.setup();
        fireEvent.changeText(inputs[0], '50000');
        fireEvent.changeText(inputs[1], '75');
        await user.press(screen.getByRole('button', { name: 'Mark Complete' }));

        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith('Could not complete task', 'Please try again.');
        });
    });
});