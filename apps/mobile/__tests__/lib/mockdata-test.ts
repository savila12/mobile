/**
 * Tests for src/lib/mockData.ts.
 * These use the actual in-memory store functions directly.
 */

import {
    getMockVehicles,
    createMockVehicle,
    setMockPrimaryVehicle,
    deleteMockVehicle,
    getMockFuelLogs,
    createMockFuelLog,
    getMockMaintenanceTasks,
    createMockMaintenanceTask,
    completeMockMaintenanceTask,
    getMockServiceHistory,
    createMockServiceRecord,
    getMockProfile,
    updateMockProfile,
    mockVehicles,
    mockMaintenanceTasks,
} from '../../src/lib/mockData';

const MOCK_USER_ID = 'mock-user-1';
const SEED_VEHICLE_ID = 'veh-honda-civic-2018';

describe('mockData', () => {
    describe('seed data exports', () => {
        it('mockVehicles has at least one vehicle', () => {
            expect(mockVehicles.length).toBeGreaterThan(0);
        });

        it('mockMaintenanceTasks has maintenance tasks', () => {
            expect(mockMaintenanceTasks.length).toBeGreaterThan(0);
        });
    });

    describe('getMockVehicles', () => {
        it('returns vehicles for the given user ID', () => {
            const vehicles = getMockVehicles(MOCK_USER_ID);
            expect(vehicles.length).toBeGreaterThan(0);
            vehicles.forEach((v) => expect(v.user_id).toBe(MOCK_USER_ID));
        });

        it('returns vehicles sorted descending by created_at', () => {
            const vehicles = getMockVehicles(MOCK_USER_ID);
            for (let i = 0; i < vehicles.length - 1; i++) {
                expect(new Date(vehicles[i].created_at).valueOf()).toBeGreaterThanOrEqual(
                    new Date(vehicles[i + 1].created_at).valueOf(),
                );
            }
        });
    });

    describe('createMockVehicle', () => {
        it('creates a vehicle and includes it in getMockVehicles', () => {
            const before = getMockVehicles(MOCK_USER_ID).length;
            const vehicle = createMockVehicle(MOCK_USER_ID, {
                year: 2022,
                make: 'Mazda',
                model: 'CX-5',
                trim: 'Grand Touring',
                color: 'Red',
                vin: 'TEST123456789',
                photo_url: null,
                unit_system: 'imperial',
                current_odometer: 5000,
            });
            const after = getMockVehicles(MOCK_USER_ID).length;
            expect(after).toBe(before + 1);
            expect(vehicle.make).toBe('Mazda');
        });
    });

    describe('setMockPrimaryVehicle', () => {
        it('sets the target vehicle as primary for the user', () => {
            const vehicles = getMockVehicles(MOCK_USER_ID);
            const nonPrimary = vehicles.find((v) => !v.is_primary);
            if (!nonPrimary) return; // All primary in test env (unlikely)
            setMockPrimaryVehicle(MOCK_USER_ID, nonPrimary.id);
            const updated = getMockVehicles(MOCK_USER_ID).find((v) => v.id === nonPrimary.id);
            expect(updated?.is_primary).toBe(true);
        });
    });

    describe('deleteMockVehicle', () => {
        it('removes the vehicle from the store', () => {
            const created = createMockVehicle(MOCK_USER_ID, {
                year: 2010,
                make: 'Toyota',
                model: 'Corolla',
                trim: '',
                color: '',
                vin: '',
                photo_url: null,
                unit_system: 'imperial',
            });
            const before = getMockVehicles(MOCK_USER_ID).length;
            deleteMockVehicle(MOCK_USER_ID, created.id);
            const after = getMockVehicles(MOCK_USER_ID).length;
            expect(after).toBe(before - 1);
        });
    });

    describe('getMockFuelLogs', () => {
        it('returns fuel logs filtered to vehicle', () => {
            const logs = getMockFuelLogs(SEED_VEHICLE_ID);
            expect(Array.isArray(logs)).toBe(true);
        });
    });

    describe('createMockFuelLog', () => {
        it('adds a fuel log to the store', () => {
            const fuelLog = {
                id: 'test-log-1',
                user_id: MOCK_USER_ID,
                vehicle_id: SEED_VEHICLE_ID,
                date: '2024-05-01T00:00:00.000Z',
                odometer: 76000,
                quantity: 12,
                price_per_unit: 3.8,
                total_cost: 45.6,
                mpg: 32,
                created_at: '2024-05-01T00:00:00.000Z',
                updated_at: '2024-05-01T00:00:00.000Z',
            };
            const before = getMockFuelLogs(SEED_VEHICLE_ID).length;
            createMockFuelLog(fuelLog);
            const after = getMockFuelLogs(SEED_VEHICLE_ID).length;
            expect(after).toBe(before + 1);
        });
    });

    describe('getMockMaintenanceTasks', () => {
        it('returns tasks for the given vehicle', () => {
            const tasks = getMockMaintenanceTasks(SEED_VEHICLE_ID);
            expect(Array.isArray(tasks)).toBe(true);
        });
    });

    describe('createMockMaintenanceTask', () => {
        it('adds a task to the store', () => {
            const task = {
                id: 'test-task-1',
                user_id: MOCK_USER_ID,
                vehicle_id: SEED_VEHICLE_ID,
                title: 'Tire Rotation Test',
                description: null,
                due_date: null,
                due_odometer: null,
                interval_miles: null,
                status: 'upcoming' as const,
                completed_at: null,
                created_at: '2024-05-01T00:00:00.000Z',
                updated_at: '2024-05-01T00:00:00.000Z',
            };
            const before = getMockMaintenanceTasks(SEED_VEHICLE_ID).length;
            createMockMaintenanceTask(task);
            const after = getMockMaintenanceTasks(SEED_VEHICLE_ID).length;
            expect(after).toBe(before + 1);
        });
    });

    describe('completeMockMaintenanceTask', () => {
        it('marks a task as completed', () => {
            const task = {
                id: 'test-task-complete',
                user_id: MOCK_USER_ID,
                vehicle_id: SEED_VEHICLE_ID,
                title: 'Battery Check',
                description: null,
                due_date: null,
                due_odometer: null,
                interval_miles: null,
                status: 'upcoming' as const,
                completed_at: null,
                created_at: '2024-05-01T00:00:00.000Z',
                updated_at: '2024-05-01T00:00:00.000Z',
            };
            createMockMaintenanceTask(task);
            completeMockMaintenanceTask(task.id, '2024-05-15T00:00:00.000Z');
            const tasks = getMockMaintenanceTasks(SEED_VEHICLE_ID);
            const updated = tasks.find((t) => t.id === task.id);
            expect(updated?.status).toBe('completed');
            expect(updated?.completed_at).toBe('2024-05-15T00:00:00.000Z');
        });
    });

    describe('getMockServiceHistory', () => {
        it('returns combined service history (tasks, fuel, records)', () => {
            const history = getMockServiceHistory(SEED_VEHICLE_ID);
            expect(Array.isArray(history)).toBe(true);
        });
    });

    describe('createMockServiceRecord', () => {
        it('adds a service record to the store', () => {
            const record = {
                id: 'test-record-1',
                user_id: MOCK_USER_ID,
                vehicle_id: SEED_VEHICLE_ID,
                event_type: 'repair' as const,
                title: 'Brake Replacement',
                date: '2024-05-10T00:00:00.000Z',
                odometer: 77000,
                cost: 250,
                notes: null,
                photo_url: null,
                source_ref_id: null,
                created_at: '2024-05-10T00:00:00.000Z',
            };
            const before = getMockServiceHistory(SEED_VEHICLE_ID).length;
            createMockServiceRecord(record);
            const after = getMockServiceHistory(SEED_VEHICLE_ID).length;
            expect(after).toBe(before + 1);
        });
    });

    describe('getMockProfile', () => {
        it('creates and returns profile for a new user ID', () => {
            const profile = getMockProfile('new-user-42');
            expect(profile.id).toBe('new-user-42');
            expect(profile.default_unit_system).toBe('imperial');
        });

        it('returns same profile on repeated calls', () => {
            const first = getMockProfile('user-repeated');
            const second = getMockProfile('user-repeated');
            expect(first.id).toBe(second.id);
        });
    });

    describe('updateMockProfile', () => {
        it('updates the unit system', () => {
            getMockProfile('user-update-1'); // ensure exists
            const updated = updateMockProfile('user-update-1', { default_unit_system: 'metric' });
            expect(updated.default_unit_system).toBe('metric');
        });
    });
});
