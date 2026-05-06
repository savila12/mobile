import { Alert, TextInput } from 'react-native';
import { fireEvent, render, screen, userEvent, waitFor } from '@testing-library/react-native';

import { GarageScreen } from '../../src/screens/GarageScreen';

const mockUseAppContext = jest.fn();
const mockUseAutoTrack = jest.fn();
const mockSetActiveVehicleId = jest.fn();
const mockCreateVehicle = jest.fn();
const mockSetActiveVehicle = jest.fn();
const mockDeleteVehicle = jest.fn();

jest.mock('../../src/lib/AppContext', () => ({
    useAppContext: () => mockUseAppContext(),
}));

jest.mock('../../src/hooks/useAutoTrack', () => ({
    useAutoTrack: (...args: unknown[]) => mockUseAutoTrack(...args),
}));

describe('GarageScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseAppContext.mockReturnValue({
            userId: 'user-1',
            activeVehicleId: null,
            setActiveVehicleId: mockSetActiveVehicleId,
        });
        mockCreateVehicle.mockResolvedValue({
            id: 'vehicle-1',
            year: 2024,
            make: 'Toyota',
            model: 'Camry',
        });
        mockSetActiveVehicle.mockResolvedValue(undefined);
        mockDeleteVehicle.mockResolvedValue(undefined);
        mockUseAutoTrack.mockReturnValue({
            vehicles: [],
            createVehicle: mockCreateVehicle,
            setActiveVehicle: mockSetActiveVehicle,
            deleteVehicle: mockDeleteVehicle,
        });
    });

    it('renders the garage heading and add vehicle CTA', () => {
        render(<GarageScreen />);

        expect(screen.getByText('Garage')).toBeOnTheScreen();
        expect(screen.getByText('Add and manage every vehicle in one place.')).toBeOnTheScreen();
        expect(screen.getByRole('button', { name: 'Add Vehicle' })).toBeOnTheScreen();
    });

    it('shows an alert when required vehicle details are missing', async () => {
        const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
        render(<GarageScreen />);
        const user = userEvent.setup();

        await user.press(screen.getByRole('button', { name: 'Add Vehicle' }));
        await user.press(screen.getByRole('button', { name: 'Add Vehicle' }));

        expect(alertSpy).toHaveBeenCalledWith('Missing details', 'Year, make, and model are required.');
        expect(mockCreateVehicle).not.toHaveBeenCalled();
    });

    it('creates a vehicle and sets it as primary when none is active', async () => {
        const view = render(<GarageScreen />);
        const user = userEvent.setup();

        await user.press(screen.getByRole('button', { name: 'Add Vehicle' }));

        const [yearInput, makeInput, modelInput] = view.UNSAFE_getAllByType(TextInput);
        fireEvent.changeText(yearInput, '2024');
        fireEvent.changeText(makeInput, 'Toyota');
        fireEvent.changeText(modelInput, 'Camry');
        await user.press(screen.getByRole('button', { name: 'Add Vehicle' }));

        await waitFor(() => {
            expect(mockCreateVehicle).toHaveBeenCalledWith({
                year: 2024,
                make: 'Toyota',
                model: 'Camry',
                trim: '',
                color: '',
                vin: '',
                unit_system: 'imperial',
                current_odometer: 0,
            });
        });

        expect(mockSetActiveVehicle).toHaveBeenCalledWith('vehicle-1');
        expect(mockSetActiveVehicleId).toHaveBeenCalledWith('vehicle-1');
    });

    it('does not set active vehicle when one is already active', async () => {
        mockUseAppContext.mockReturnValue({
            userId: 'user-1',
            activeVehicleId: 'existing-vehicle',
            setActiveVehicleId: mockSetActiveVehicleId,
        });
        const view = render(<GarageScreen />);
        const user = userEvent.setup();

        await user.press(screen.getByRole('button', { name: 'Add Vehicle' }));
        const [yearInput, makeInput, modelInput] = view.UNSAFE_getAllByType(TextInput);
        fireEvent.changeText(yearInput, '2023');
        fireEvent.changeText(makeInput, 'Honda');
        fireEvent.changeText(modelInput, 'Civic');
        await user.press(screen.getByRole('button', { name: 'Add Vehicle' }));

        await waitFor(() => expect(mockCreateVehicle).toHaveBeenCalled());
        expect(mockSetActiveVehicle).not.toHaveBeenCalled();
    });

    it('shows alert when createVehicle throws', async () => {
        const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
        mockCreateVehicle.mockRejectedValue(new Error('DB error'));
        const view = render(<GarageScreen />);
        const user = userEvent.setup();

        await user.press(screen.getByRole('button', { name: 'Add Vehicle' }));
        const [yearInput, makeInput, modelInput] = view.UNSAFE_getAllByType(TextInput);
        fireEvent.changeText(yearInput, '2022');
        fireEvent.changeText(makeInput, 'Ford');
        fireEvent.changeText(modelInput, 'F-150');
        await user.press(screen.getByRole('button', { name: 'Add Vehicle' }));

        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith('Could not add vehicle', 'DB error');
        });
    });

    it('shows onEdit alert when edit button is pressed', async () => {
        const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
        mockUseAutoTrack.mockReturnValue({
            vehicles: [{ id: 'v1', year: 2020, make: 'BMW', model: '3 Series', trim: '', color: '', vin: '', unit_system: 'imperial', current_odometer: 0, user_id: 'user-1', created_at: '' }],
            createVehicle: mockCreateVehicle,
            setActiveVehicle: mockSetActiveVehicle,
            deleteVehicle: mockDeleteVehicle,
        });

        render(<GarageScreen />);
        const user = userEvent.setup();

        await user.press(screen.getByLabelText('Edit vehicle'));

        expect(alertSpy).toHaveBeenCalledWith('Edit Vehicle', expect.stringContaining('v1'));
    });

    it('calls deleteVehicle when delete is confirmed', async () => {
        jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons) => {
            const deleteBtn = (buttons as { text: string; onPress?: () => void }[])?.find(b => b.text === 'Delete');
            deleteBtn?.onPress?.();
        });
        mockUseAutoTrack.mockReturnValue({
            vehicles: [{ id: 'v1', year: 2020, make: 'BMW', model: '3 Series', trim: '', color: '', vin: '', unit_system: 'imperial', current_odometer: 0, user_id: 'user-1', created_at: '' }],
            createVehicle: mockCreateVehicle,
            setActiveVehicle: mockSetActiveVehicle,
            deleteVehicle: mockDeleteVehicle,
        });

        render(<GarageScreen />);
        const user = userEvent.setup();

        await user.press(screen.getByLabelText('Delete vehicle'));

        await waitFor(() => {
            expect(mockDeleteVehicle).toHaveBeenCalledWith('v1');
        });
    });

    it('shows alert when setActiveVehicle throws', async () => {
        const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
        mockSetActiveVehicle.mockRejectedValue(new Error('Cannot set primary'));
        mockUseAutoTrack.mockReturnValue({
            vehicles: [{ id: 'v1', year: 2020, make: 'BMW', model: '3 Series', trim: '', color: '', vin: '', unit_system: 'imperial', current_odometer: 0, user_id: 'user-1', created_at: '' }],
            createVehicle: mockCreateVehicle,
            setActiveVehicle: mockSetActiveVehicle,
            deleteVehicle: mockDeleteVehicle,
        });

        render(<GarageScreen />);
        const user = userEvent.setup();

        await user.press(screen.getByRole('button', { name: 'Set as Primary' }));

        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith('Could not set primary vehicle', 'Cannot set primary');
        });
    });
});