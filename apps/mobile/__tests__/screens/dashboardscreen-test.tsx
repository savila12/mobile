import { render, screen, userEvent } from '@testing-library/react-native';

import { DashboardScreen } from '../../src/screens/DashboardScreen';

const mockUseAppContext = jest.fn();
const mockUseAutoTrack = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../../src/lib/AppContext', () => ({
    useAppContext: () => mockUseAppContext(),
}));

jest.mock('../../src/hooks/useAutoTrack', () => ({
    useAutoTrack: (...args: unknown[]) => mockUseAutoTrack(...args),
}));

jest.mock('@react-navigation/native', () => {
    const actual = jest.requireActual('@react-navigation/native');
    return {
        ...actual,
        useNavigation: () => ({ navigate: mockNavigate }),
    };
});

describe('DashboardScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseAppContext.mockReturnValue({
            userId: 'user-1',
            activeVehicleId: 'vehicle-1',
        });
        mockUseAutoTrack.mockReturnValue({
            activeVehicle: { year: 2020, make: 'Honda', model: 'Civic' },
            fuelLogs: [
                { id: 'fuel-1', date: '2026-05-01T00:00:00.000Z', odometer: 10000, total_cost: 42.5, mpg: 30, quantity: 10 },
                { id: 'fuel-2', date: '2026-05-03T00:00:00.000Z', odometer: 10300, total_cost: 47.25, mpg: 32, quantity: 11 },
            ],
            tasks: [
                { id: 'task-1', title: 'Oil Change', status: 'upcoming', due_date: '2026-05-20T00:00:00.000Z' },
            ],
        });
    });

    it('shows the active vehicle summary and dashboard cards', () => {
        render(<DashboardScreen />);

        expect(screen.getByText('Dashboard')).toBeOnTheScreen();
        expect(screen.getByText('2020 Honda Civic')).toBeOnTheScreen();
        expect(screen.getByText('Miles This Month')).toBeOnTheScreen();
        expect(screen.getByText('Monthly Spend')).toBeOnTheScreen();
        expect(screen.getByText('Fuel Efficiency')).toBeOnTheScreen();
        expect(screen.getByText('Oil Change')).toBeOnTheScreen();
    });

    it('shows the empty vehicle prompt when no active vehicle exists', () => {
        mockUseAutoTrack.mockReturnValue({
            activeVehicle: null,
            fuelLogs: [],
            tasks: [],
        });

        render(<DashboardScreen />);

        expect(screen.getByText('Add a vehicle to start tracking')).toBeOnTheScreen();
        expect(screen.getByText('--')).toBeOnTheScreen();
        expect(screen.getByText('None')).toBeOnTheScreen();
    });

    it('navigates to Fuel from the quick add action', async () => {
        render(<DashboardScreen />);
        const user = userEvent.setup();

        await user.press(screen.getByRole('button', { name: 'Log Fuel Fill-up' }));

        expect(mockNavigate).toHaveBeenCalledWith('Fuel');
    });
});