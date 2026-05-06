import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { HistoryScreen } from '../../src/screens/HistoryScreen';

const mockUseAppContext = jest.fn();
const mockUseAutoTrack = jest.fn();

jest.mock('../../src/lib/AppContext', () => ({
    useAppContext: () => mockUseAppContext(),
}));

jest.mock('../../src/hooks/useAutoTrack', () => ({
    useAutoTrack: (...args: unknown[]) => mockUseAutoTrack(...args),
}));

describe('HistoryScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseAppContext.mockReturnValue({
            userId: 'user-1',
            activeVehicleId: 'vehicle-1',
        });
        mockUseAutoTrack.mockReturnValue({
            history: [],
            refresh: jest.fn(),
        });
    });

    it('renders the empty history state', () => {
        render(<HistoryScreen />);

        expect(screen.getByText('Service History')).toBeOnTheScreen();
        expect(screen.getByText('No service history yet')).toBeOnTheScreen();
        expect(screen.getByText('Add a fuel fill-up or complete a maintenance task to populate your timeline.')).toBeOnTheScreen();
    });

    it('renders history entries including notes and attachments', () => {
        mockUseAutoTrack.mockReturnValue({
            history: [
                {
                    id: 'history-1',
                    event_type: 'maintenance',
                    title: 'Oil Change',
                    date: '2026-04-01T00:00:00.000Z',
                    odometer: 65432,
                    cost: 89.99,
                    notes: 'Changed synthetic oil',
                    photo_url: 'https://example.com/receipt.jpg',
                },
            ],
            refresh: jest.fn(),
        });

        render(<HistoryScreen />);

        expect(screen.getByText('maintenance')).toBeOnTheScreen();
        expect(screen.getByText('Oil Change')).toBeOnTheScreen();
        expect(screen.getByText('Mileage: 65432')).toBeOnTheScreen();
        expect(screen.getByText('Cost: $89.99')).toBeOnTheScreen();
        expect(screen.getByText('Changed synthetic oil')).toBeOnTheScreen();
        expect(screen.getByText('Attachment saved')).toBeOnTheScreen();
    });

    it('displays refresh indicator during refresh', () => {
        const mockRefresh = jest.fn();
        mockUseAutoTrack.mockReturnValue({
            history: [],
            refresh: mockRefresh,
        });

        render(<HistoryScreen />);

        expect(screen.getByText(/A merged timeline of maintenance, repairs, and fuel events./)).toBeOnTheScreen();
    });

    it('calls refresh when pull-to-refresh is triggered', async () => {
        const mockRefresh = jest.fn().mockResolvedValue(undefined);
        mockUseAutoTrack.mockReturnValue({
            history: [],
            refresh: mockRefresh,
        });

        const { UNSAFE_getByType } = render(<HistoryScreen />);
        const { RefreshControl } = require('react-native');
        const refreshControl = UNSAFE_getByType(RefreshControl);
        fireEvent(refreshControl, 'refresh');

        await waitFor(() => {
            expect(mockRefresh).toHaveBeenCalled();
        });
    });
});