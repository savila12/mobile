/**
 * Non-mock path tests for api.ts.
 */

const mockReadCache = jest.fn();
const mockWriteCache = jest.fn();
const mockEnqueueOperation = jest.fn();
const mockNetInfoFetch = jest.fn();
const mockFrom = jest.fn();
const mockRpc = jest.fn();

jest.mock('uuid', () => ({ v4: () => 'test-uuid' }));

jest.mock('../../src/lib/devConfig', () => ({
  USE_MOCK_DATA: false,
  MOCK_USER_ID: 'mock-user-1',
  APP_VERSION: '1.0.0',
}));

jest.mock('../../src/lib/storage', () => ({
  keys: {
    vehicles: (userId: string) => `vehicles:${userId}`,
    fuelLogs: (vehicleId: string) => `fuelLogs:${vehicleId}`,
    tasks: (vehicleId: string) => `tasks:${vehicleId}`,
    serviceHistory: (vehicleId: string) => `history:${vehicleId}`,
    queue: 'autotrack:offlineQueue',
  },
  readCache: (...args: unknown[]) => mockReadCache(...args),
  writeCache: (...args: unknown[]) => mockWriteCache(...args),
}));

jest.mock('../../src/lib/offlineQueue', () => ({
  enqueueOperation: (...args: unknown[]) => mockEnqueueOperation(...args),
}));

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    fetch: (...args: unknown[]) => mockNetInfoFetch(...args),
  },
}));

jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

jest.mock('../../src/lib/mockData', () => ({
  createMockFuelLog: jest.fn(),
  createMockMaintenanceTask: jest.fn(),
  createMockServiceRecord: jest.fn(),
  createMockVehicle: jest.fn(),
  deleteMockVehicle: jest.fn(),
  getMockFuelLogs: jest.fn(),
  getMockMaintenanceTasks: jest.fn(),
  getMockServiceHistory: jest.fn(),
  getMockVehicles: jest.fn(),
  setMockPrimaryVehicle: jest.fn(),
  completeMockMaintenanceTask: jest.fn(),
  getMockProfile: jest.fn(),
  updateMockProfile: jest.fn(),
}));

import {
  createFuelLog,
  createVehicle,
  deleteVehicle,
  ensureProfile,
  executeOfflineOperation,
  getVehicles,
  setActiveVehicle,
  updateProfile,
} from '../../src/lib/api';

type Builder = {
  select: jest.Mock;
  eq: jest.Mock;
  order: jest.Mock;
  update: jest.Mock;
  insert: jest.Mock;
  delete: jest.Mock;
  upsert: jest.Mock;
  single: jest.Mock;
  maybeSingle: jest.Mock;
};

const makeBuilder = (): Builder => {
  const builder = {} as Builder;
  builder.select = jest.fn(() => builder);
  builder.eq = jest.fn(() => builder);
  builder.order = jest.fn(() => builder);
  builder.update = jest.fn(() => builder);
  builder.insert = jest.fn(() => builder);
  builder.delete = jest.fn(() => builder);
  builder.upsert = jest.fn(() => builder);
  builder.single = jest.fn();
  builder.maybeSingle = jest.fn();
  return builder;
};

describe('api (non-mock mode)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ensureProfile falls back when profiles table is missing', async () => {
    const profiles = makeBuilder();
    profiles.single.mockResolvedValue({
      data: null,
      error: { code: 'PGRST205', message: 'Could not find table public.profiles' },
    });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') return profiles;
      throw new Error(`Unexpected table: ${table}`);
    });

    const result = await ensureProfile('user-1');

    expect(result.id).toBe('user-1');
    expect(result.created_at).toBeDefined();
  });

  it('updateProfile falls back when profiles table is missing', async () => {
    const profiles = makeBuilder();
    profiles.single.mockResolvedValue({
      data: null,
      error: { code: 'PGRST205', details: 'Relation public.profiles does not exist' },
    });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') return profiles;
      throw new Error(`Unexpected table: ${table}`);
    });

    const result = await updateProfile('user-1', { default_unit_system: 'metric' });

    expect(result.id).toBe('user-1');
    expect(result.default_unit_system).toBe('metric');
  });

  it('ensureProfile rethrows non-missing-table errors', async () => {
    const profiles = makeBuilder();
    profiles.single.mockResolvedValue({
      data: null,
      error: new Error('permission denied'),
    });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') return profiles;
      throw new Error(`Unexpected table: ${table}`);
    });

    await expect(ensureProfile('user-1')).rejects.toThrow('permission denied');
  });

  it('getVehicles returns cached data when remote request fails', async () => {
    const vehicles = makeBuilder();
    vehicles.order.mockResolvedValue({ data: null, error: new Error('db error') });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'vehicles') return vehicles;
      throw new Error(`Unexpected table: ${table}`);
    });
    mockReadCache.mockResolvedValue([{ id: 'cached-vehicle' }]);

    const result = await getVehicles('user-1');

    expect(result).toEqual([{ id: 'cached-vehicle' }]);
    expect(mockReadCache).toHaveBeenCalledWith('vehicles:user-1');
  });

  it('createVehicle enqueues and caches when insert fails', async () => {
    const vehicles = makeBuilder();
    vehicles.single.mockRejectedValue(new Error('insert failed'));
    mockFrom.mockImplementation((table: string) => {
      if (table === 'vehicles') return vehicles;
      throw new Error(`Unexpected table: ${table}`);
    });
    mockReadCache.mockResolvedValue([]);

    const result = await createVehicle('user-1', {
      year: 2022,
      make: 'Honda',
      model: 'Civic',
      trim: '',
      color: '',
      vin: '',
      photo_url: null,
      unit_system: 'imperial',
      current_odometer: 12345,
    });

    expect(result.id).toBe('test-uuid');
    expect(mockEnqueueOperation).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'create_vehicle',
      }),
    );
    expect(mockWriteCache).toHaveBeenCalledWith(
      'vehicles:user-1',
      expect.arrayContaining([expect.objectContaining({ make: 'Honda' })]),
    );
  });

  it('setActiveVehicle enqueues when offline and profile update errors', async () => {
    const profiles = makeBuilder();
    profiles.upsert.mockResolvedValue({ error: new Error('profile update failed') });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') return profiles;
      throw new Error(`Unexpected table: ${table}`);
    });
    mockNetInfoFetch.mockResolvedValue({ isConnected: false });

    await setActiveVehicle('user-1', 'vehicle-1');

    expect(mockEnqueueOperation).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'set_active_vehicle',
        payload: { userId: 'user-1', vehicleId: 'vehicle-1' },
      }),
    );
  });

  it('setActiveVehicle throws when online and profile update errors', async () => {
    const profiles = makeBuilder();
    profiles.upsert.mockResolvedValue({ error: new Error('profile update failed') });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') return profiles;
      throw new Error(`Unexpected table: ${table}`);
    });
    mockNetInfoFetch.mockResolvedValue({ isConnected: true });

    await expect(setActiveVehicle('user-1', 'vehicle-1')).rejects.toThrow('profile update failed');
  });

  it('createFuelLog enqueues and caches when insert fails', async () => {
    const fuelLogs = makeBuilder();
    const vehicles = makeBuilder();

    fuelLogs.order.mockResolvedValue({ data: [], error: null });
    fuelLogs.single.mockRejectedValue(new Error('insert failed'));

    mockFrom.mockImplementation((table: string) => {
      if (table === 'fuel_logs') return fuelLogs;
      if (table === 'vehicles') return vehicles;
      throw new Error(`Unexpected table: ${table}`);
    });

    mockReadCache.mockResolvedValue([]);

    const result = await createFuelLog('user-1', 'vehicle-1', {
      date: '2024-05-01T00:00:00.000Z',
      odometer: 60000,
      quantity: 10,
      price_per_unit: 3,
      total_cost: 30,
      unit_system: 'imperial',
    });

    expect(result.vehicle_id).toBe('vehicle-1');
    expect(mockEnqueueOperation).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'create_fuel_log' }),
    );
    expect(mockWriteCache).toHaveBeenCalledWith(
      'fuelLogs:vehicle-1',
      expect.arrayContaining([expect.objectContaining({ total_cost: 30 })]),
    );
  });

  it('executeOfflineOperation strips unit_system before fuel log insert', async () => {
    const fuelLogs = makeBuilder();
    fuelLogs.insert.mockResolvedValue({ error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'fuel_logs') return fuelLogs;
      throw new Error(`Unexpected table: ${table}`);
    });

    await executeOfflineOperation({
      id: 'op-1',
      action: 'create_fuel_log',
      payload: {
        id: 'log-1',
        unit_system: 'imperial',
        quantity: 9,
      },
      createdAt: '2024-01-01T00:00:00.000Z',
    });

    expect(fuelLogs.insert).toHaveBeenCalledWith({
      id: 'log-1',
      quantity: 9,
    });
  });

  it('executeOfflineOperation inserts create_vehicle payload', async () => {
    const vehicles = makeBuilder();
    vehicles.insert.mockResolvedValue({ error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'vehicles') return vehicles;
      throw new Error(`Unexpected table: ${table}`);
    });

    await executeOfflineOperation({
      id: 'op-vehicle',
      action: 'create_vehicle',
      payload: { id: 'v1', make: 'Subaru' },
      createdAt: '2024-01-01T00:00:00.000Z',
    });

    expect(vehicles.insert).toHaveBeenCalledWith({ id: 'v1', make: 'Subaru' });
  });

  it('executeOfflineOperation inserts service record payload', async () => {
    const serviceRecords = makeBuilder();
    serviceRecords.insert.mockResolvedValue({ error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'service_records') return serviceRecords;
      throw new Error(`Unexpected table: ${table}`);
    });

    await executeOfflineOperation({
      id: 'op-sr',
      action: 'create_service_record',
      payload: { id: 'sr1', title: 'Brake Service' },
      createdAt: '2024-01-01T00:00:00.000Z',
    });

    expect(serviceRecords.insert).toHaveBeenCalledWith({ id: 'sr1', title: 'Brake Service' });
  });

  it('executeOfflineOperation throws when maintenance task insert fails', async () => {
    const tasks = makeBuilder();
    tasks.insert.mockResolvedValue({ error: new Error('task insert failed') });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'maintenance_tasks') return tasks;
      throw new Error(`Unexpected table: ${table}`);
    });

    await expect(
      executeOfflineOperation({
        id: 'op-task',
        action: 'create_maintenance_task',
        payload: { id: 'task-1', title: 'Rotate tires' },
        createdAt: '2024-01-01T00:00:00.000Z',
      }),
    ).rejects.toThrow('task insert failed');
  });

  it('executeOfflineOperation throws on unsupported actions', async () => {
    await expect(
      executeOfflineOperation({
        id: 'op-1',
        action: 'delete_vehicle',
        payload: {},
        createdAt: '2024-01-01T00:00:00.000Z',
      }),
    ).rejects.toThrow('Unsupported offline operation: delete_vehicle');
  });

  it('deleteVehicle enqueues operation when remote delete fails', async () => {
    const vehicles = makeBuilder();
    vehicles.eq.mockReturnValue(vehicles);
    vehicles.eq.mockReturnValueOnce(vehicles).mockReturnValueOnce(Promise.resolve({ error: new Error('delete failed') }));

    mockFrom.mockImplementation((table: string) => {
      if (table === 'vehicles') return vehicles;
      throw new Error(`Unexpected table: ${table}`);
    });

    await deleteVehicle('user-1', 'vehicle-1');

    expect(mockEnqueueOperation).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'delete_vehicle',
        payload: { userId: 'user-1', vehicleId: 'vehicle-1' },
      }),
    );
  });
});
