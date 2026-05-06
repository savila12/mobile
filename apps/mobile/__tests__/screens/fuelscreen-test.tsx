import { Alert, TextInput } from 'react-native';
import { fireEvent, render, screen, userEvent, waitFor } from '@testing-library/react-native';

import { FuelScreen } from '../../src/screens/FuelScreen';

const mockUseAppContext = jest.fn();
const mockUseAutoTrack = jest.fn();
const mockCreateFuelLog = jest.fn();

jest.mock('../../src/lib/AppContext', () => ({
    useAppContext: () => mockUseAppContext(),
}));

jest.mock('../../src/hooks/useAutoTrack', () => ({
    useAutoTrack: (...args: unknown[]) => mockUseAutoTrack(...args),
}));

jest.mock('react-native-gifted-charts', () => ({
    LineChart: () => null,
}));

describe('FuelScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseAppContext.mockReturnValue({
            userId: 'user-1',
            activeVehicleId: 'vehicle-1',
        });
        mockCreateFuelLog.mockResolvedValue(undefined);
        mockUseAutoTrack.mockReturnValue({
            activeVehicle: { id: 'vehicle-1', unit_system: 'imperial' },
            fuelLogs: [],
            createFuelLog: mockCreateFuelLog,
        });
    });

    it('renders the fuel form and empty chart state', () => {
        render(<FuelScreen />);

        expect(screen.getByText('Fuel & Mileage')).toBeOnTheScreen();
        expect(screen.getByText('Log fill-ups and track efficiency trends over time.')).toBeOnTheScreen();
        expect(screen.getByText('Add at least two fill-ups to visualize MPG.')).toBeOnTheScreen();
        expect(screen.getByRole('button', { name: 'Save Fill-up' })).toBeOnTheScreen();
    });

    it('shows an alert when saving without an active vehicle', async () => {
        const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
        mockUseAutoTrack.mockReturnValue({
            activeVehicle: null,
            fuelLogs: [],
            createFuelLog: mockCreateFuelLog,
        });

        render(<FuelScreen />);
        const user = userEvent.setup();

        await user.press(screen.getByRole('button', { name: 'Save Fill-up' }));

        expect(alertSpy).toHaveBeenCalledWith('No active vehicle', 'Set a primary vehicle first.');
        expect(mockCreateFuelLog).not.toHaveBeenCalled();
    });

    it('saves a fill-up with computed total cost and clears the inputs', async () => {
        const view = render(<FuelScreen />);
        const user = userEvent.setup();
        const [dateInput, odometerInput, quantityInput, priceInput] = view.UNSAFE_getAllByType(TextInput);

        fireEvent.changeText(dateInput, '2026-05-05');
        fireEvent.changeText(odometerInput, '12345');
        fireEvent.changeText(quantityInput, '10');
        fireEvent.changeText(priceInput, '4.25');
        await user.press(screen.getByRole('button', { name: 'Save Fill-up' }));

        await waitFor(() => {
            expect(mockCreateFuelLog).toHaveBeenCalledWith({
                date: new Date('2026-05-05').toISOString(),
                odometer: 12345,
                quantity: 10,
                price_per_unit: 4.25,
                total_cost: 42.5,
                unit_system: 'imperial',
            });
        });

        await waitFor(() => {
            const [, nextOdometerInput, nextQuantityInput, nextPriceInput] = view.UNSAFE_getAllByType(TextInput);
            expect(nextOdometerInput.props.value).toBe('');
            expect(nextQuantityInput.props.value).toBe('');
            expect(nextPriceInput.props.value).toBe('');
        });
    });
});