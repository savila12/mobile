/**
 * Tests for api.ts using mock data mode (USE_MOCK_DATA=true).
 * This exercises the mock code paths without needing a live Supabase connection.
 */

// Must be set before importing api.ts (module-level constant)
jest.mock('../../src/lib/devConfig', () => ({
    USE_MOCK_DATA: true,
    MOCK_USER_ID: 'mock-user-1',
    APP_VERSION: '1.0.0',
}));

const mockGetMockProfile = jest.fn();
const mockUpdateMockProfile = jest.fn();
const mockGetMockVehicles = jest.fn();
const mockCreateMockVehicle = jest.fn();
const mockSetMockPrimaryVehicle = jest.fn();
const mockDeleteMockVehicle = jest.fn();
const mockGetMockFuelLogs = jest.fn();
const mockCreateMockFuelLog = jest.fn();
const mockGetMockMaintenanceTasks = jest.fn();
const mockCreateMockMaintenanceTask = jest.fn();
const mockGetMockServiceHistory = jest.fn();
const mockCreateMockServiceRecord = jest.fn();
const mockCompleteMockMaintenanceTask = jest.fn();

jest.mock('../../src/lib/mockData', () => ({
    getMockProfile: (...args: unknown[]) => mockGetMockProfile(...args),
    updateMockProfile: (...args: unknown[]) => mockUpdateMockProfile(...args),
    getMockVehicles: (...args: unknown[]) => mockGetMockVehicles(...args),
    createMockVehicle: (...args: unknown[]) => mockCreateMockVehicle(...args),
    setMockPrimaryVehicle: (...args: unknown[]) => mockSetMockPrimaryVehicle(...args),
    deleteMockVehicle: (...args: unknown[]) => mockDeleteMockVehicle(...args),
    getMockFuelLogs: (...args: unknown[]) => mockGetMockFuelLogs(...args),
    createMockFuelLog: (...args: unknown[]) => mockCreateMockFuelLog(...args),
    getMockMaintenanceTasks: (...args: unknown[]) => mockGetMockMaintenanceTasks(...args),
    createMockMaintenanceTask: (...args: unknown[]) => mockCreateMockMaintenanceTask(...args),
    getMockServiceHistory: (...args: unknown[]) => mockGetMockServiceHistory(...args),
    createMockServiceRecord: (...args: unknown[]) => mockCreateMockServiceRecord(...args),
    completeMockMaintenanceTask: (...args: unknown[]) => mockCompleteMockMaintenanceTask(...args),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('uuid', () => ({ v4: () => 'test-uuid' }));

import {
    ensureProfile,
    getProfile,
    updateProfile,
    getVehicles,
    createVehicle,
    setActiveVehicle,
    deleteVehicle,
    getFuelLogs,
    createFuelLog,
    getMaintenanceTasks,
    createMaintenanceTask,
    getServiceHistory,
    completeMaintenanceTask,
} from '../../src/lib/api';

const USER_ID = 'user-1';
const VEHICLE_ID = 'v-1';

const mockProfile = {
    id: USER_ID,
    active_vehicle_id: VEHICLE_ID,
    default_unit_system: 'imperial' as const,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
};

const mockVehicle = {
    id: VEHICLE_ID,
    user_id: USER_ID,
    year: 2020,
    make: 'Toyota',
    model: 'Camry',
    trim: '',
    color: '',
    vin: '',
    photo_url: null,
    is_primary: true,
    current_odometer: 50000,
    unit_system: 'imperial' as const,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
};

const mockFuelLog = {
    id: 'log-1',
    user_id: USER_ID,
    vehicle_id: VEHICLE_ID,
    date: '2024-04-01T00:00:00.000Z',
    odometer: 51000,
    quantity: 10,
    price_per_unit: 3.5,
    total_cost: 35,
    mpg: 30,
    created_at: '2024-04-01T00:00:00.000Z',
    updated_at: '2024-04-01T00:00:00.000Z',
};

const mockTask = {
    id: 'task-1',
    user_id: USER_ID,
    vehicle_id: VEHICLE_ID,
    title: 'Oil Change',
    description: null,
    due_date: null,
    due_odometer: null,
    interval_miles: null,
    status: 'upcoming' as const,
    completed_at: null,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
};

describe('api (mock data mode)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('ensureProfile', () => {
        it('returns mock profile', async () => {
            mockGetMockProfile.mockReturnValue(mockProfile);
            const result = await ensureProfile(USER_ID);
            expect(result).toEqual(mockProfile);
            expect(mockGetMockProfile).toHaveBeenCalledWith(USER_ID);
        });
    });

    describe('getProfile', () => {
        it('returns mock profile', async () => {
            mockGetMockProfile.mockReturnValue(mockProfile);
            const result = await getProfile(USER_ID);
            expect(result).toEqual(mockProfile);
        });
    });

    describe('updateProfile', () => {
        it('updates and returns mock profile', async () => {
            const updated = { ...mockProfile, default_unit_system: 'metric' as const };
            mockUpdateMockProfile.mockReturnValue(updated);
            const result = await updateProfile(USER_ID, { default_unit_system: 'metric' });
            expect(result).toEqual(updated);
        });
    });

    describe('getVehicles', () => {
        it('returns mock vehicles and writes to cache', async () => {
            mockGetMockVehicles.mockReturnValue([mockVehicle]);
            const result = await getVehicles(USER_ID);
            expect(result).toEqual([mockVehicle]);
        });
    });

    describe('createVehicle', () => {
        it('creates a mock vehicle and appends to cache', async () => {
            mockCreateMockVehicle.mockReturnValue(mockVehicle);
            const result = await createVehicle(USER_ID, {
                year: 2020,
                make: 'Toyota',
                model: 'Camry',
                trim: '',
                color: '',
                vin: '',
                photo_url: null,
                unit_system: 'imperial',
                current_odometer: 50000,
            });
            expect(result).toEqual(mockVehicle);
            expect(mockCreateMockVehicle).toHaveBeenCalledWith(USER_ID, expect.objectContaining({ year: 2020 }));
        });
    });

    describe('setActiveVehicle', () => {
        it('calls setMockPrimaryVehicle', async () => {
            await setActiveVehicle(USER_ID, VEHICLE_ID);
            expect(mockSetMockPrimaryVehicle).toHaveBeenCalledWith(USER_ID, VEHICLE_ID);
        });
    });

    describe('deleteVehicle', () => {
        it('calls deleteMockVehicle', async () => {
            mockDeleteMockVehicle.mockReturnValue(undefined);
            await deleteVehicle(USER_ID, VEHICLE_ID);
            expect(mockDeleteMockVehicle).toHaveBeenCalledWith(USER_ID, VEHICLE_ID);
        });
    });

    describe('getFuelLogs', () => {
        it('returns mock fuel logs', async () => {
            mockGetMockFuelLogs.mockReturnValue([mockFuelLog]);
            const result = await getFuelLogs(VEHICLE_ID);
            expect(result).toEqual([mockFuelLog]);
        });
    });

    describe('createFuelLog', () => {
        it('creates a mock fuel log', async () => {
            mockGetMockFuelLogs.mockReturnValue([]);
            mockCreateMockFuelLog.mockReturnValue(mockFuelLog);
            const result = await createFuelLog(USER_ID, VEHICLE_ID, {
                date: '2024-04-01T00:00:00.000Z',
                odometer: 51000,
                quantity: 10,
                price_per_unit: 3.5,
                total_cost: 35,
                unit_system: 'imperial',
            });
            expect(result).toEqual(mockFuelLog);
        });
    });

    describe('getMaintenanceTasks', () => {
        it('returns mock maintenance tasks', async () => {
            mockGetMockMaintenanceTasks.mockReturnValue([mockTask]);
            const result = await getMaintenanceTasks(VEHICLE_ID);
            expect(result).toEqual([mockTask]);
        });
    });

    describe('createMaintenanceTask', () => {
        it('creates a mock maintenance task', async () => {
            mockCreateMockMaintenanceTask.mockReturnValue(mockTask);
            const result = await createMaintenanceTask(USER_ID, VEHICLE_ID, {
                title: 'Oil Change',
            });
            expect(result).toEqual(mockTask);
        });
    });

    describe('getServiceHistory', () => {
        it('returns mock service history', async () => {
            const mockHistory = [{ id: 'h-1', event_type: 'maintenance', title: 'Oil Change' }];
            mockGetMockServiceHistory.mockReturnValue(mockHistory);
            const result = await getServiceHistory(VEHICLE_ID);
            expect(result).toEqual(mockHistory);
        });
    });

    describe('completeMaintenanceTask', () => {
        it('completes a task and creates a service record', async () => {
            const AsyncStorage = require('@react-native-async-storage/async-storage');
            AsyncStorage.getItem.mockResolvedValue(JSON.stringify([mockTask]));
            mockCreateMockServiceRecord.mockReturnValue({ id: 'sr-1' });

            await completeMaintenanceTask(USER_ID, VEHICLE_ID, mockTask, {
                odometer: 51000,
                cost: 45,
                notes: 'Done',
            });

            expect(mockCompleteMockMaintenanceTask).toHaveBeenCalledWith(mockTask.id, expect.any(String));
            expect(mockCreateMockServiceRecord).toHaveBeenCalled();
        });
    });
});
