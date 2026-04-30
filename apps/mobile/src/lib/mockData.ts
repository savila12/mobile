import { FuelLog, MaintenanceTask, ServiceRecord, UserProfile, Vehicle } from '../types/models';

const MOCK_USER_ID = 'mock-user-1';

const now = '2026-04-27T09:00:00.000Z';

const seedVehicles: Vehicle[] = [
  {
    id: 'veh-honda-civic-2018',
    user_id: MOCK_USER_ID,
    year: 2018,
    make: 'Honda',
    model: 'Civic',
    trim: 'EX',
    color: 'Blue',
    vin: 'MOCKHNDCVC2018EX01',
    photo_url: null,
    is_primary: true,
    current_odometer: 74210,
    unit_system: 'imperial',
    created_at: '2024-01-12T10:00:00.000Z',
    updated_at: now,
  },
  {
    id: 'veh-toyota-rav4-2020',
    user_id: MOCK_USER_ID,
    year: 2020,
    make: 'Toyota',
    model: 'RAV4',
    trim: 'XLE',
    color: 'Silver',
    vin: 'MOCKTYTRAV42020XLE',
    photo_url: null,
    is_primary: false,
    current_odometer: 51244,
    unit_system: 'imperial',
    created_at: '2024-02-20T10:00:00.000Z',
    updated_at: now,
  },
  {
    id: 'veh-ford-f150-2016',
    user_id: MOCK_USER_ID,
    year: 2016,
    make: 'Ford',
    model: 'F-150',
    trim: 'Lariat',
    color: 'Black',
    vin: 'MOCKFRDF1502016LRT',
    photo_url: null,
    is_primary: false,
    current_odometer: 98350,
    unit_system: 'imperial',
    created_at: '2024-03-14T10:00:00.000Z',
    updated_at: now,
  },
  {
    id: 'veh-subaru-outback-2019',
    user_id: MOCK_USER_ID,
    year: 2019,
    make: 'Subaru',
    model: 'Outback',
    trim: 'Premium',
    color: 'Green',
    vin: 'MOCKSUBOUT2019PREM',
    photo_url: null,
    is_primary: false,
    current_odometer: 66890,
    unit_system: 'imperial',
    created_at: '2024-04-05T10:00:00.000Z',
    updated_at: now,
  },
];

const maintenanceTemplate: Array<{
  title: string;
  description: string;
  intervalMiles: number;
  status: 'upcoming' | 'completed';
  offsetDays: number;
  mileageDelta: number;
}> = [
  {
    title: 'Oil Change',
    description: 'Replace engine oil and filter',
    intervalMiles: 5000,
    status: 'completed',
    offsetDays: 120,
    mileageDelta: 5000,
  },
  {
    title: 'Tire Rotation',
    description: 'Rotate tires front-to-back pattern',
    intervalMiles: 6000,
    status: 'completed',
    offsetDays: 95,
    mileageDelta: 6000,
  },
  {
    title: 'Brake Inspection',
    description: 'Inspect pads and rotor wear',
    intervalMiles: 10000,
    status: 'completed',
    offsetDays: 75,
    mileageDelta: 10000,
  },
  {
    title: 'Engine Air Filter',
    description: 'Replace engine intake air filter',
    intervalMiles: 15000,
    status: 'completed',
    offsetDays: 50,
    mileageDelta: 15000,
  },
  {
    title: 'Cabin Air Filter',
    description: 'Replace HVAC cabin filter',
    intervalMiles: 12000,
    status: 'completed',
    offsetDays: 30,
    mileageDelta: 12000,
  },
  {
    title: 'Coolant Flush',
    description: 'Flush and refill coolant system',
    intervalMiles: 30000,
    status: 'upcoming',
    offsetDays: -15,
    mileageDelta: 30000,
  },
];

const toIsoDate = (offsetDays: number): string => {
  const baseDate = new Date('2026-04-27T00:00:00.000Z');
  baseDate.setUTCDate(baseDate.getUTCDate() - offsetDays);
  return baseDate.toISOString();
};

const seedMaintenanceTasks: MaintenanceTask[] = seedVehicles.flatMap((vehicle, vehicleIndex) => {
  return maintenanceTemplate.map((template, templateIndex) => {
    const createdAt = toIsoDate(template.offsetDays + vehicleIndex * 4 + templateIndex);
    const completedAt = template.status === 'completed' ? toIsoDate(template.offsetDays - 3) : null;

    return {
      id: `task-${vehicle.id}-${templateIndex + 1}`,
      user_id: vehicle.user_id,
      vehicle_id: vehicle.id,
      title: template.title,
      description: template.description,
      due_date: toIsoDate(template.offsetDays),
      due_odometer: Math.max(1000, vehicle.current_odometer - template.mileageDelta),
      interval_miles: template.intervalMiles,
      status: template.status,
      completed_at: completedAt,
      created_at: createdAt,
      updated_at: createdAt,
    };
  });
});

export const mockVehicles: Vehicle[] = seedVehicles;
export const mockMaintenanceTasks: MaintenanceTask[] = seedMaintenanceTasks;

const fuelTemplate: Array<{
  daysAgo: number;
  milesAgo: number;
  quantity: number;
  pricePerUnit: number;
  mpg: number;
}> = [
  { daysAgo: 14, milesAgo: 350, quantity: 11.2, pricePerUnit: 3.59, mpg: 31.2 },
  { daysAgo: 29, milesAgo: 710, quantity: 10.9, pricePerUnit: 3.49, mpg: 32.1 },
  { daysAgo: 45, milesAgo: 1080, quantity: 11.5, pricePerUnit: 3.55, mpg: 30.4 },
  { daysAgo: 63, milesAgo: 1450, quantity: 12.0, pricePerUnit: 3.62, mpg: 29.7 },
  { daysAgo: 82, milesAgo: 1810, quantity: 11.0, pricePerUnit: 3.68, mpg: 31.5 },
  { daysAgo: 101, milesAgo: 2180, quantity: 11.7, pricePerUnit: 3.71, mpg: 30.1 },
  { daysAgo: 121, milesAgo: 2540, quantity: 11.3, pricePerUnit: 3.63, mpg: 31.0 },
];

const seedFuelLogs: FuelLog[] = seedVehicles.flatMap((vehicle, vehicleIndex) => {
  return fuelTemplate.map((template, templateIndex) => {
    const date = toIsoDate(template.daysAgo + vehicleIndex * 2 + templateIndex);
    const odometer = Math.max(500, vehicle.current_odometer - template.milesAgo);

    return {
      id: `fuel-${vehicle.id}-${templateIndex + 1}`,
      user_id: vehicle.user_id,
      vehicle_id: vehicle.id,
      date,
      odometer,
      quantity: template.quantity,
      price_per_unit: template.pricePerUnit,
      total_cost: Number((template.quantity * template.pricePerUnit).toFixed(2)),
      mpg: template.mpg,
      created_at: date,
      updated_at: date,
    };
  });
});

const mapFuelAsHistory = (logs: FuelLog[]): ServiceRecord[] => {
  return logs.map((log) => ({
    id: `history-${log.id}`,
    user_id: log.user_id,
    vehicle_id: log.vehicle_id,
    event_type: 'fuel',
    title: 'Fuel Fill-up',
    date: log.date,
    odometer: log.odometer,
    cost: log.total_cost,
    notes: log.mpg ? `${log.mpg} MPG` : null,
    photo_url: null,
    source_ref_id: log.id,
    created_at: log.created_at,
  }));
};

const mapCompletedTasksAsHistory = (tasks: MaintenanceTask[]): ServiceRecord[] => {
  return tasks
    .filter((task) => task.status === 'completed')
    .map((task) => ({
      id: `history-${task.id}`,
      user_id: task.user_id,
      vehicle_id: task.vehicle_id,
      event_type: 'maintenance',
      title: task.title,
      date: task.completed_at || task.updated_at,
      odometer: task.due_odometer ?? 0,
      cost: 0,
      notes: task.description || null,
      photo_url: null,
      source_ref_id: task.id,
      created_at: task.created_at,
    }));
};

const seedRepairHistory: ServiceRecord[] = [
  {
    id: 'repair-veh-honda-civic-2018-alternator',
    user_id: MOCK_USER_ID,
    vehicle_id: 'veh-honda-civic-2018',
    event_type: 'repair',
    title: 'Alternator Replacement',
    date: '2026-01-18T14:20:00.000Z',
    odometer: 71920,
    cost: 545.0,
    notes: 'Replaced alternator and serpentine belt.',
    photo_url: null,
    source_ref_id: null,
    created_at: '2026-01-18T14:20:00.000Z',
  },
  {
    id: 'repair-veh-toyota-rav4-2020-brakes',
    user_id: MOCK_USER_ID,
    vehicle_id: 'veh-toyota-rav4-2020',
    event_type: 'repair',
    title: 'Front Brake Pad Replacement',
    date: '2026-02-07T10:15:00.000Z',
    odometer: 49870,
    cost: 320.0,
    notes: 'Pads replaced, rotors resurfaced.',
    photo_url: null,
    source_ref_id: null,
    created_at: '2026-02-07T10:15:00.000Z',
  },
  {
    id: 'repair-veh-ford-f150-2016-battery',
    user_id: MOCK_USER_ID,
    vehicle_id: 'veh-ford-f150-2016',
    event_type: 'repair',
    title: 'Battery Replacement',
    date: '2026-01-30T09:00:00.000Z',
    odometer: 97210,
    cost: 210.0,
    notes: 'Installed new AGM battery.',
    photo_url: null,
    source_ref_id: null,
    created_at: '2026-01-30T09:00:00.000Z',
  },
  {
    id: 'repair-veh-subaru-outback-2019-wheel-bearing',
    user_id: MOCK_USER_ID,
    vehicle_id: 'veh-subaru-outback-2019',
    event_type: 'repair',
    title: 'Rear Wheel Bearing',
    date: '2026-03-02T11:30:00.000Z',
    odometer: 65580,
    cost: 430.0,
    notes: 'Replaced noisy right rear bearing.',
    photo_url: null,
    source_ref_id: null,
    created_at: '2026-03-02T11:30:00.000Z',
  },
];

let vehiclesStore: Vehicle[] = seedVehicles.map((item) => ({ ...item }));
let tasksStore: MaintenanceTask[] = seedMaintenanceTasks.map((item) => ({ ...item }));
let fuelLogsStore: FuelLog[] = seedFuelLogs.map((item) => ({ ...item }));
let serviceRecordsStore: ServiceRecord[] = seedRepairHistory.map((item) => ({ ...item }));

const mockId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
};

export const getMockVehicles = (userId: string): Vehicle[] => {
  vehiclesStore = vehiclesStore.map((vehicle) => ({ ...vehicle, user_id: userId }));
  return vehiclesStore
    .map((vehicle) => ({ ...vehicle }))
    .sort((a, b) => new Date(b.created_at).valueOf() - new Date(a.created_at).valueOf());
};

export const getMockMaintenanceTasks = (vehicleId: string): MaintenanceTask[] => {
  const ownerId = vehiclesStore.find((vehicle) => vehicle.id === vehicleId)?.user_id || MOCK_USER_ID;
  return tasksStore
    .filter((task) => task.vehicle_id === vehicleId)
    .map((task) => ({ ...task, user_id: ownerId, vehicle_id: vehicleId }))
    .sort((a, b) => new Date(b.created_at).valueOf() - new Date(a.created_at).valueOf());
};

export const getMockFuelLogs = (vehicleId: string): FuelLog[] => {
  const ownerId = vehiclesStore.find((vehicle) => vehicle.id === vehicleId)?.user_id || MOCK_USER_ID;
  return fuelLogsStore
    .filter((log) => log.vehicle_id === vehicleId)
    .sort((a, b) => new Date(b.date).valueOf() - new Date(a.date).valueOf())
    .map((log) => ({ ...log, user_id: ownerId, vehicle_id: vehicleId }));
};

export const getMockServiceHistory = (vehicleId: string): ServiceRecord[] => {
  const ownerId = vehiclesStore.find((vehicle) => vehicle.id === vehicleId)?.user_id || MOCK_USER_ID;
  const fuelHistory = mapFuelAsHistory(getMockFuelLogs(vehicleId));
  const taskHistory = mapCompletedTasksAsHistory(getMockMaintenanceTasks(vehicleId));
  const repairHistory = serviceRecordsStore
    .filter((entry) => entry.vehicle_id === vehicleId)
    .map((entry) => ({ ...entry, user_id: ownerId, vehicle_id: vehicleId }));

  return [...repairHistory, ...taskHistory, ...fuelHistory].sort(
    (a, b) => new Date(b.date).valueOf() - new Date(a.date).valueOf(),
  );
};

export const createMockVehicle = (
  userId: string,
  payload: Pick<Vehicle, 'year' | 'make' | 'model' | 'trim' | 'color' | 'vin' | 'photo_url' | 'unit_system'> & {
    current_odometer?: number;
  },
): Vehicle => {
  const created: Vehicle = {
    id: mockId('veh'),
    user_id: userId,
    year: payload.year,
    make: payload.make,
    model: payload.model,
    trim: payload.trim || null,
    color: payload.color || null,
    vin: payload.vin || null,
    photo_url: payload.photo_url || null,
    is_primary: vehiclesStore.length === 0,
    current_odometer: payload.current_odometer || 0,
    unit_system: payload.unit_system,
    created_at: now,
    updated_at: now,
  };

  vehiclesStore = [created, ...vehiclesStore];
  return { ...created };
};

export const setMockPrimaryVehicle = (userId: string, vehicleId: string): void => {
  vehiclesStore = vehiclesStore.map((vehicle) => {
    if (vehicle.user_id !== userId) {
      return vehicle;
    }

    return {
      ...vehicle,
      is_primary: vehicle.id === vehicleId,
      updated_at: now,
    };
  });
};

export const createMockFuelLog = (fuelLog: FuelLog): FuelLog => {
  fuelLogsStore = [fuelLog, ...fuelLogsStore];

  vehiclesStore = vehiclesStore.map((vehicle) => {
    if (vehicle.id !== fuelLog.vehicle_id || vehicle.user_id !== fuelLog.user_id) {
      return vehicle;
    }

    return {
      ...vehicle,
      current_odometer: fuelLog.odometer,
      updated_at: fuelLog.updated_at,
    };
  });

  return { ...fuelLog };
};

export const createMockMaintenanceTask = (task: MaintenanceTask): MaintenanceTask => {
  tasksStore = [task, ...tasksStore];
  return { ...task };
};

export const completeMockMaintenanceTask = (taskId: string, completedAt: string): void => {
  tasksStore = tasksStore.map((task) => {
    if (task.id !== taskId) {
      return task;
    }

    return {
      ...task,
      status: 'completed',
      completed_at: completedAt,
      updated_at: completedAt,
    };
  });
};

export const createMockServiceRecord = (record: ServiceRecord): ServiceRecord => {
  serviceRecordsStore = [record, ...serviceRecordsStore];
  return { ...record };
};

export const deleteMockVehicle = (userId: string, vehicleId: string): void => {
  vehiclesStore = vehiclesStore.filter((vehicle) => !(vehicle.user_id === userId && vehicle.id === vehicleId));
  tasksStore = tasksStore.filter((task) => task.vehicle_id !== vehicleId);
  fuelLogsStore = fuelLogsStore.filter((log) => log.vehicle_id !== vehicleId);
  serviceRecordsStore = serviceRecordsStore.filter((record) => record.vehicle_id !== vehicleId);
};

// ─── Mock Profile Store ──────────────────────────────────────────────────────

let profilesStore: Record<string, UserProfile> = {};

export const getMockProfile = (userId: string): UserProfile => {
  if (!profilesStore[userId]) {
    profilesStore[userId] = {
      id: userId,
      active_vehicle_id: vehiclesStore.find((v) => v.is_primary)?.id ?? vehiclesStore[0]?.id ?? null,
      default_unit_system: 'imperial',
      created_at: now,
      updated_at: now,
    };
  }
  return { ...profilesStore[userId] };
};

export const updateMockProfile = (
  userId: string,
  patch: Partial<Pick<UserProfile, 'default_unit_system'>>,
): UserProfile => {
  const existing = getMockProfile(userId);
  profilesStore[userId] = { ...existing, ...patch, updated_at: new Date().toISOString() };
  return { ...profilesStore[userId] };
};
