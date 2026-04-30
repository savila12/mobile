import { v4 as uuidv4 } from 'uuid';
import NetInfo from '@react-native-community/netinfo';

import {
  FuelLog,
  MaintenanceTask,
  OfflineOperation,
  ServiceRecord,
  UnitSystem,
  UserProfile,
  Vehicle,
} from '../types/models';
import { calculateMpg } from './calculations';
import {
  createMockFuelLog,
  createMockMaintenanceTask,
  createMockServiceRecord,
  createMockVehicle,
  deleteMockVehicle,
  getMockFuelLogs,
  getMockMaintenanceTasks,
  getMockServiceHistory,
  getMockVehicles,
  setMockPrimaryVehicle,
  completeMockMaintenanceTask,
  getMockProfile,
  updateMockProfile,
} from './mockData';
import { enqueueOperation } from './offlineQueue';
import { keys, readCache, writeCache } from './storage';
import { supabase } from './supabase';
import { USE_MOCK_DATA, MOCK_USER_ID as MOCK_USER_ID_CONFIG } from './devConfig';

const useMockData = USE_MOCK_DATA;

const nowIso = () => {
  return new Date().toISOString();
}

const cacheAppend = async <T>(key: string, item: T) =>{
  const current = (await readCache<T[]>(key)) || [];
  await writeCache(key, [item, ...current]);
}

const isMissingProfilesTableError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const maybeError = error as { code?: string; message?: string; details?: string; hint?: string };
  const parts = [maybeError.message, maybeError.details, maybeError.hint]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return maybeError.code === 'PGRST205' && parts.includes('public.profiles');
};

const isMissingMaintenanceTasksTableError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const maybeError = error as { code?: string; message?: string; details?: string; hint?: string };
  const parts = [maybeError.message, maybeError.details, maybeError.hint]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return maybeError.code === 'PGRST205' && parts.includes('public.maintenance_tasks');
};

const setPrimaryVehicleFallback = async (userId: string, vehicleId: string): Promise<void> => {
  const { error: resetError } = await supabase
    .from('vehicles')
    .update({ is_primary: false, updated_at: nowIso() })
    .eq('user_id', userId);

  if (resetError) {
    throw resetError;
  }

  const { data: activated, error: activateError } = await supabase
    .from('vehicles')
    .update({ is_primary: true, updated_at: nowIso() })
    .eq('id', vehicleId)
    .eq('user_id', userId)
    .select('id')
    .maybeSingle();

  if (activateError) {
    throw activateError;
  }

  if (!activated) {
    throw new Error('Unable to set primary vehicle. Vehicle was not updated.');
  }
};

export const ensureProfile = async (userId: string): Promise<UserProfile> => {
  if (useMockData) {
    return getMockProfile(userId);
  }

  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId }, { onConflict: 'id' })
    .select('*')
    .single();

  if (error) {
    if (isMissingProfilesTableError(error)) {
      return { id: userId, created_at: nowIso(), updated_at: nowIso() } as UserProfile;
    }
    throw error;
  }

  return data as UserProfile;
}

export const getProfile = async (userId: string): Promise<UserProfile | null> => {
  if (useMockData) {
    return getMockProfile(userId);
  }

  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();

  if (error) {
    throw error;
  }

  return (data as UserProfile | null) ?? null;
}

export const updateProfile = async (
  userId: string,
  patch: Partial<Pick<UserProfile, 'default_unit_system'>>,
): Promise<UserProfile> => {
  if (useMockData) {
    return updateMockProfile(userId, patch);
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ ...patch, updated_at: nowIso() })
    .eq('id', userId)
    .select('*')
    .single();

  if (error) {
    if (isMissingProfilesTableError(error)) {
      return { id: userId, ...patch, created_at: nowIso(), updated_at: nowIso() } as UserProfile;
    }
    throw error;
  }

  return data as UserProfile;
};

export const getVehicles = async (userId: string): Promise<Vehicle[]> => {
  const cacheKey = keys.vehicles(userId);

  if (useMockData) {
    const vehicles = getMockVehicles(userId);
    await writeCache(cacheKey, vehicles);
    return vehicles;
  }

  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const vehicles = (data || []) as Vehicle[];
    await writeCache(cacheKey, vehicles);
    return vehicles;
  } catch {
    return (await readCache<Vehicle[]>(cacheKey)) || [];
  }
}

export const createVehicle = async (
  userId: string,
  payload: Pick<Vehicle, 'year' | 'make' | 'model' | 'trim' | 'color' | 'vin' | 'photo_url' | 'unit_system'> & {
    current_odometer?: number;
  },
): Promise<Vehicle> => {
  if (useMockData) {
    const created = createMockVehicle(userId, payload);
    await cacheAppend(keys.vehicles(userId), created);
    return created;
  }

  const vehicleDraft = {
    id: uuidv4(),
    user_id: userId,
    year: payload.year,
    make: payload.make,
    model: payload.model,
    trim: payload.trim || null,
    color: payload.color || null,
    vin: payload.vin || null,
    photo_url: payload.photo_url || null,
    is_primary: false,
    current_odometer: payload.current_odometer || 0,
    unit_system: payload.unit_system,
    created_at: nowIso(),
    updated_at: nowIso(),
  } satisfies Vehicle;

  try {
    const { data, error } = await supabase.from('vehicles').insert(vehicleDraft).select('*').single();
    if (error) {
      throw error;
    }

    const created = data as Vehicle;
    await cacheAppend(keys.vehicles(userId), created);
    return created;
  } catch {
    await enqueueOperation({
      id: uuidv4(),
      action: 'create_vehicle',
      payload: vehicleDraft,
      createdAt: nowIso(),
    });

    await cacheAppend(keys.vehicles(userId), vehicleDraft);
    return vehicleDraft;
  }
}

export const setActiveVehicle = async (userId: string, vehicleId: string): Promise<void> => {
  if (useMockData) {
    setMockPrimaryVehicle(userId, vehicleId);
    return;
  }

  try {
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ id: userId, active_vehicle_id: vehicleId }, { onConflict: 'id' });

    if (profileError) {
      // Some environments may not have the profiles table yet.
      // Primary-vehicle switching should still work via vehicles.is_primary.
      if (!isMissingProfilesTableError(profileError)) {
        throw profileError;
      }
    }

    // Prefer the atomic RPC when available.
    const { error: primaryError } = await supabase.rpc('set_primary_vehicle', {
      p_vehicle_id: vehicleId,
    });

    if (primaryError) {
      // Fallback covers missing RPC, stale schema cache, or execute permission issues.
      try {
        await setPrimaryVehicleFallback(userId, vehicleId);
      } catch (fallbackError) {
        if (fallbackError instanceof Error) {
          throw fallbackError;
        }
        throw primaryError;
      }
    }
  } catch (error) {
    const networkState = await NetInfo.fetch();

    // Queue only when offline. If online, surface the real backend error.
    if (!networkState.isConnected) {
      await enqueueOperation({
        id: uuidv4(),
        action: 'set_active_vehicle',
        payload: {
          userId,
          vehicleId,
        },
        createdAt: nowIso(),
      });
      return;
    }

    throw error;
  }
}

export const getFuelLogs = async (vehicleId: string): Promise<FuelLog[]> => {
  const cacheKey = keys.fuelLogs(vehicleId);

  if (useMockData) {
    const logs = getMockFuelLogs(vehicleId);
    await writeCache(cacheKey, logs);
    return logs;
  }

  try {
    const { data, error } = await supabase
      .from('fuel_logs')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('date', { ascending: false });

    if (error) {
      throw error;
    }

    const logs = (data || []) as FuelLog[];
    await writeCache(cacheKey, logs);
    return logs;
  } catch {
    return (await readCache<FuelLog[]>(cacheKey)) || [];
  }
}

export const createFuelLog = async (
  userId: string,
  vehicleId: string,
  payload: {
    date: string;
    odometer: number;
    quantity: number;
    price_per_unit: number;
    total_cost: number;
    unit_system: UnitSystem;
  },
): Promise<FuelLog> => {
  const existing = await getFuelLogs(vehicleId);
  const prevLog = [...existing].sort((a, b) => b.odometer - a.odometer)[0] || null;

  const mpg = calculateMpg(
    payload.odometer,
    prevLog?.odometer ?? null,
    payload.quantity,
    payload.unit_system,
  );

  const fuelLog: FuelLog = {
    id: uuidv4(),
    user_id: userId,
    vehicle_id: vehicleId,
    date: payload.date,
    odometer: payload.odometer,
    quantity: payload.quantity,
    price_per_unit: payload.price_per_unit,
    total_cost: payload.total_cost,
    mpg,
    created_at: nowIso(),
    updated_at: nowIso(),
  };

  if (useMockData) {
    const inserted = createMockFuelLog(fuelLog);
    await cacheAppend(keys.fuelLogs(vehicleId), inserted);
    return inserted;
  }

  try {
    const { data, error } = await supabase.from('fuel_logs').insert(fuelLog).select('*').single();
    if (error) {
      throw error;
    }

    const inserted = data as FuelLog;
    await cacheAppend(keys.fuelLogs(vehicleId), inserted);

    const { error: odometerError } = await supabase
      .from('vehicles')
      .update({ current_odometer: payload.odometer, updated_at: nowIso() })
      .eq('id', vehicleId)
      .eq('user_id', userId);

    if (odometerError) {
      throw odometerError;
    }

    return inserted;
  } catch {
    await enqueueOperation({
      id: uuidv4(),
      action: 'create_fuel_log',
      payload: {
        ...fuelLog,
        unit_system: payload.unit_system,
      },
      createdAt: nowIso(),
    });

    await cacheAppend(keys.fuelLogs(vehicleId), fuelLog);
    return fuelLog;
  }
}

export const getMaintenanceTasks = async (vehicleId: string): Promise<MaintenanceTask[]> => {
  const cacheKey = keys.tasks(vehicleId);

  if (useMockData) {
    const tasks = getMockMaintenanceTasks(vehicleId);
    await writeCache(cacheKey, tasks);
    return tasks;
  }

  try {
    const { data, error } = await supabase
      .from('maintenance_tasks')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const tasks = (data || []) as MaintenanceTask[];
    await writeCache(cacheKey, tasks);
    return tasks;
  } catch {
    return (await readCache<MaintenanceTask[]>(cacheKey)) || [];
  }
}

export const createMaintenanceTask = async (
  userId: string,
  vehicleId: string,
  payload: {
    title: string;
    description?: string;
    due_date?: string;
    due_odometer?: number;
    interval_miles?: number;
  },
): Promise<MaintenanceTask> => {
  const task: MaintenanceTask = {
    id: uuidv4(),
    user_id: userId,
    vehicle_id: vehicleId,
    title: payload.title,
    description: payload.description || null,
    due_date: payload.due_date || null,
    due_odometer: payload.due_odometer ?? null,
    interval_miles: payload.interval_miles ?? null,
    status: 'upcoming',
    completed_at: null,
    created_at: nowIso(),
    updated_at: nowIso(),
  };

  if (useMockData) {
    const inserted = createMockMaintenanceTask(task);
    await cacheAppend(keys.tasks(vehicleId), inserted);
    return inserted;
  }

  try {
    const { data, error } = await supabase.from('maintenance_tasks').insert(task).select('*').single();
    if (error) {
      throw error;
    }

    const inserted = data as MaintenanceTask;
    await cacheAppend(keys.tasks(vehicleId), inserted);
    return inserted;
  } catch {
    await enqueueOperation({
      id: uuidv4(),
      action: 'create_maintenance_task',
      payload: task,
      createdAt: nowIso(),
    });

    await cacheAppend(keys.tasks(vehicleId), task);
    return task;
  }
}

export const createServiceRecord = async (
  userId: string,
  vehicleId: string,
  payload: {
    event_type: 'maintenance' | 'repair' | 'fuel';
    title: string;
    date: string;
    odometer: number;
    cost: number;
    notes?: string;
    photo_url?: string;
    source_ref_id?: string;
  },
): Promise<ServiceRecord> => {
  const record: ServiceRecord = {
    id: uuidv4(),
    user_id: userId,
    vehicle_id: vehicleId,
    event_type: payload.event_type,
    title: payload.title,
    date: payload.date,
    odometer: payload.odometer,
    cost: payload.cost,
    notes: payload.notes || null,
    photo_url: payload.photo_url || null,
    source_ref_id: payload.source_ref_id || null,
    created_at: nowIso(),
  };

  if (useMockData) {
    const inserted = createMockServiceRecord(record);
    await cacheAppend(keys.serviceHistory(vehicleId), inserted);
    return inserted;
  }

  try {
    const { data, error } = await supabase.from('service_records').insert(record).select('*').single();
    if (error) {
      throw error;
    }

    const inserted = data as ServiceRecord;
    await cacheAppend(keys.serviceHistory(vehicleId), inserted);
    return inserted;
  } catch {
    await enqueueOperation({
      id: uuidv4(),
      action: 'create_service_record',
      payload: record,
      createdAt: nowIso(),
    });

    await cacheAppend(keys.serviceHistory(vehicleId), record);
    return record;
  }
}

export const completeMaintenanceTask = async (
  userId: string,
  vehicleId: string,
  task: MaintenanceTask,
  payload: {
    odometer: number;
    cost: number;
    notes?: string;
    photo_url?: string;
  },
): Promise<void> => {
  const completedAt = nowIso();
  const updatedAt = nowIso();
  const updatedTask: MaintenanceTask = {
    ...task,
    status: 'completed',
    completed_at: completedAt,
    updated_at: updatedAt,
  };

  if (useMockData) {
    completeMockMaintenanceTask(task.id, completedAt);

    const cachedTasks = (await readCache<MaintenanceTask[]>(keys.tasks(vehicleId))) || [];
    const mergedTasks = cachedTasks.map((item) => {
      if (item.id === task.id) {
        return updatedTask;
      }
      return item;
    });
    await writeCache(keys.tasks(vehicleId), mergedTasks);

    await createServiceRecord(userId, vehicleId, {
      event_type: 'maintenance',
      title: task.title,
      date: completedAt,
      odometer: payload.odometer,
      cost: payload.cost,
      notes: payload.notes,
      photo_url: payload.photo_url,
      source_ref_id: task.id,
    });

    return;
  }

  try {
    const { error: updateError } = await supabase
      .from('maintenance_tasks')
      .update({ status: 'completed', completed_at: completedAt, updated_at: updatedAt })
      .eq('id', task.id)
      .eq('user_id', userId);

    if (updateError) {
      // Some environments may not expose maintenance_tasks yet.
      // Continue to history logging so completion still works.
      if (!isMissingMaintenanceTasksTableError(updateError)) {
        throw updateError;
      }
    }

    const cachedTasks = (await readCache<MaintenanceTask[]>(keys.tasks(vehicleId))) || [];
    const mergedTasks = cachedTasks.map((item) => {
      if (item.id === task.id) {
        return updatedTask;
      }
      return item;
    });
    await writeCache(keys.tasks(vehicleId), mergedTasks);

    try {
      await createServiceRecord(userId, vehicleId, {
        event_type: 'maintenance',
        title: task.title,
        date: completedAt,
        odometer: payload.odometer,
        cost: payload.cost,
        notes: payload.notes,
        photo_url: payload.photo_url,
        source_ref_id: task.id,
      });
    } catch {
      // History can still be rendered from completed maintenance_tasks fallback.
    }
  } catch (error) {
    const networkState = await NetInfo.fetch();

    if (networkState.isConnected) {
      throw error;
    }

    await enqueueOperation({
      id: uuidv4(),
      action: 'complete_maintenance_task',
      payload: {
        userId,
        vehicleId,
        task,
        completedAt,
        odometer: payload.odometer,
        cost: payload.cost,
        notes: payload.notes,
        photo_url: payload.photo_url,
      },
      createdAt: nowIso(),
    });

    const cachedTasks = (await readCache<MaintenanceTask[]>(keys.tasks(vehicleId))) || [];
    const mergedTasks = cachedTasks.map((item) => {
      if (item.id === task.id) {
        return updatedTask;
      }
      return item;
    });
    await writeCache(keys.tasks(vehicleId), mergedTasks);
  }
}

export const getServiceHistory = async (vehicleId: string): Promise<ServiceRecord[]> => {
  const cacheKey = keys.serviceHistory(vehicleId);
  const fuelCacheKey = keys.fuelLogs(vehicleId);
  const tasksCacheKey = keys.tasks(vehicleId);

  if (useMockData) {
    const mockHistory = getMockServiceHistory(vehicleId);
    await writeCache(cacheKey, mockHistory);
    return mockHistory;
  }

  const mapFuelAsHistory = (logs: FuelLog[]): ServiceRecord[] => {
    return logs.map((log) => ({
      id: `fuel-${log.id}`,
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
        id: `task-${task.id}`,
        user_id: task.user_id,
        vehicle_id: task.vehicle_id,
        event_type: 'maintenance',
        title: task.title,
        date: task.completed_at || task.updated_at,
        odometer: 0,
        cost: 0,
        notes: task.description || 'Completed maintenance task',
        photo_url: null,
        source_ref_id: task.id,
        created_at: task.created_at,
      }));
  };

  const { data: recordsData } = await supabase
    .from('service_records')
    .select('*')
    .eq('vehicle_id', vehicleId);

  const { data: fuelData } = await supabase
    .from('fuel_logs')
    .select('*')
    .eq('vehicle_id', vehicleId);

  const { data: completedTasksData } = await supabase
    .from('maintenance_tasks')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .eq('status', 'completed');

  const maintenanceAndRepair = ((recordsData || []) as ServiceRecord[]).map((item) => ({
    ...item,
    event_type: item.event_type ?? 'maintenance',
  }));

  const remoteFuelAsHistory = mapFuelAsHistory((fuelData || []) as FuelLog[]);
  const remoteTaskHistory = mapCompletedTasksAsHistory((completedTasksData || []) as MaintenanceTask[]);
  const knownMaintenanceSourceIds = new Set(
    maintenanceAndRepair
      .filter((entry) => entry.event_type === 'maintenance' && entry.source_ref_id)
      .map((entry) => entry.source_ref_id as string),
  );
  const dedupedTaskHistory = remoteTaskHistory.filter((entry) => {
    return !entry.source_ref_id || !knownMaintenanceSourceIds.has(entry.source_ref_id);
  });

  if (maintenanceAndRepair.length || remoteFuelAsHistory.length || dedupedTaskHistory.length) {
    const mergedRemote = [...maintenanceAndRepair, ...dedupedTaskHistory, ...remoteFuelAsHistory].sort(
      (a, b) => new Date(b.date).valueOf() - new Date(a.date).valueOf(),
    );

    await writeCache(cacheKey, mergedRemote);
    return mergedRemote;
  }

  const cachedHistory = (await readCache<ServiceRecord[]>(cacheKey)) || [];
  const cachedFuelLogs = (await readCache<FuelLog[]>(fuelCacheKey)) || [];
  const cachedTasks = (await readCache<MaintenanceTask[]>(tasksCacheKey)) || [];
  const cachedFuelAsHistory = mapFuelAsHistory(cachedFuelLogs);
  const cachedTaskHistory = mapCompletedTasksAsHistory(cachedTasks);

  const knownCachedMaintenanceSourceIds = new Set(
    cachedHistory
      .filter((entry) => entry.event_type === 'maintenance' && entry.source_ref_id)
      .map((entry) => entry.source_ref_id as string),
  );
  const dedupedCachedTaskHistory = cachedTaskHistory.filter((entry) => {
    return !entry.source_ref_id || !knownCachedMaintenanceSourceIds.has(entry.source_ref_id);
  });

  const mergedCached = [...cachedHistory, ...dedupedCachedTaskHistory, ...cachedFuelAsHistory].sort(
    (a, b) => new Date(b.date).valueOf() - new Date(a.date).valueOf(),
  );

  // Dedupe by id to avoid duplicate fuel entries when both caches contain them.
  const deduped = mergedCached.filter((item, index, arr) => {
    return arr.findIndex((entry) => entry.id === item.id) === index;
  });

  return deduped;
}

export const executeOfflineOperation = async (operation: OfflineOperation): Promise<void> => {
  switch (operation.action) {
    case 'create_vehicle': {
      const { error } = await supabase.from('vehicles').insert(operation.payload);
      if (error) {
        throw error;
      }
      break;
    }
    case 'set_active_vehicle': {
      const payload = operation.payload as { userId: string; vehicleId: string };
      await setActiveVehicle(payload.userId, payload.vehicleId);
      break;
    }
    case 'create_fuel_log': {
      const { unit_system: _unitSystem, ...insertPayload } = operation.payload as Record<string, unknown>;
      const { error } = await supabase.from('fuel_logs').insert(insertPayload);
      if (error) {
        throw error;
      }
      break;
    }
    case 'create_maintenance_task': {
      const { error } = await supabase.from('maintenance_tasks').insert(operation.payload);
      if (error) {
        throw error;
      }
      break;
    }
    case 'complete_maintenance_task': {
      const payload = operation.payload as {
        userId: string;
        vehicleId: string;
        task: MaintenanceTask;
        completedAt: string;
        odometer: number;
        cost: number;
        notes?: string;
        photo_url?: string;
      };

      await completeMaintenanceTask(payload.userId, payload.vehicleId, payload.task, {
        odometer: payload.odometer,
        cost: payload.cost,
        notes: payload.notes,
        photo_url: payload.photo_url,
      });
      break;
    }
    case 'create_service_record': {
      const { error } = await supabase.from('service_records').insert(operation.payload);
      if (error) {
        throw error;
      }
      break;
    }
    default:
      throw new Error(`Unsupported offline operation: ${operation.action}`);
  }
} 

export const deleteVehicle = async (userId: string, vehicleId: string): Promise<void> => {
  if (useMockData) {
    deleteMockVehicle(userId, vehicleId);
    return;
  }

  try {
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', vehicleId)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }
  } catch {
    await enqueueOperation({
      id: uuidv4(),
      action: 'delete_vehicle',
      payload: {
        userId,
        vehicleId,
      },
      createdAt: nowIso(),
    });
  }
}
