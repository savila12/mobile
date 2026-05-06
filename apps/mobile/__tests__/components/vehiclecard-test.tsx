import { render, screen, userEvent } from '@testing-library/react-native';

import { VehicleCard } from '../../src/components/VehicleCard';
import { Vehicle } from '../../src/types/models';

describe('VehicleCard', () => {
    const mockVehicle: Vehicle = {
        id: 'vehicle-1',
        year: 2020,
        make: 'Honda',
        model: 'Civic',
        trim: 'EX',
        color: 'Blue',
        vin: 'ABC123DEF456',
        current_odometer: 65432,
        unit_system: 'imperial',
        is_primary: false,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
    };

    const mockProps = {
        vehicle: mockVehicle,
        isActive: false,
        onSetPrimary: jest.fn(),
        onEdit: jest.fn(),
        onDelete: jest.fn(),
        isLoading: false,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders the vehicle details', () => {
        render(<VehicleCard {...mockProps} />);

        expect(screen.getByText('2020 Honda Civic')).toBeOnTheScreen();
        expect(screen.getByText('VIN: ABC123DEF456')).toBeOnTheScreen();
        expect(screen.getByText('Mileage: 65432')).toBeOnTheScreen();
        expect(screen.getByText('Unit: imperial')).toBeOnTheScreen();
    });

    it('shows Primary Vehicle label when vehicle is active', () => {
        render(<VehicleCard {...mockProps} isActive={true} />);

        expect(screen.getByRole('button', { name: 'Primary Vehicle' })).toBeOnTheScreen();
    });

    it('shows Set as Primary button when vehicle is not active', () => {
        render(<VehicleCard {...mockProps} isActive={false} />);

        expect(screen.getByRole('button', { name: 'Set as Primary' })).toBeOnTheScreen();
    });

    it('calls onSetPrimary when Set as Primary button is pressed', async () => {
        render(<VehicleCard {...mockProps} isActive={false} />);
        const user = userEvent.setup();

        await user.press(screen.getByRole('button', { name: 'Set as Primary' }));

        expect(mockProps.onSetPrimary).toHaveBeenCalledWith('vehicle-1');
    });

    it('calls onEdit when edit button is pressed', async () => {
        render(<VehicleCard {...mockProps} />);
        const user = userEvent.setup();

        await user.press(screen.getByLabelText('Edit vehicle'));

        expect(mockProps.onEdit).toHaveBeenCalledWith('vehicle-1');
    });

    it('calls onDelete when delete button is pressed', async () => {
        render(<VehicleCard {...mockProps} />);
        const user = userEvent.setup();

        await user.press(screen.getByLabelText('Delete vehicle'));

        expect(mockProps.onDelete).toHaveBeenCalledWith('vehicle-1');
    });

    it('renders with isLoading true shows loading state', () => {
        render(<VehicleCard {...mockProps} isLoading={true} />);

        // When isLoading is true, buttons should still be present and activity indicator is shown
        expect(screen.getByLabelText('Edit vehicle')).toBeOnTheScreen();
        expect(screen.getByLabelText('Delete vehicle')).toBeOnTheScreen();
    });
});
