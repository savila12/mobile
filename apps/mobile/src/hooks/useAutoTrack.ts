import { useMemo } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  completeMaintenanceTask,
  createFuelLog,
  createMaintenanceTask,
  createServiceRecord,
  createVehicle,
  deleteVehicle,
  getFuelLogs,
  getMaintenanceTasks,
  getProfile,
  getServiceHistory,
  getVehicles,
  setActiveVehicle,
} from '../lib/api';
import { FuelLog, MaintenanceTask, ServiceRecord, UnitSystem, Vehicle } from '../types/models';

const queryKeys = (userId?: string | null, vehicleId?: string | null) => {
  return {
    profile: ['profile', userId],
    vehicles: ['vehicles', userId],
    fuelLogs: ['fuelLogs', vehicleId],
    tasks: ['tasks', vehicleId],
    history: ['history', vehicleId],
  } as const;
}

export const useAutoTrack = (userId?: string | null, activeVehicleId?: string | null) => {
  const queryClient = useQueryClient();

  const vehicleKeys = queryKeys(userId, null);

  const profileQuery = useQuery({
    queryKey: vehicleKeys.profile,
    enabled: Boolean(userId),
    queryFn: () => getProfile(userId as string),
  });

  const vehiclesQuery = useQuery({
    queryKey: vehicleKeys.vehicles,
    enabled: Boolean(userId),
    queryFn: () => getVehicles(userId as string),
  });

  const resolvedVehicleId = useMemo(() => {
    const vehicles = (vehiclesQuery.data || []) as Vehicle[];

    if (activeVehicleId && vehicles.some((vehicle) => vehicle.id === activeVehicleId)) {
      return activeVehicleId;
    }

    return vehicles.find((vehicle) => vehicle.is_primary)?.id || vehicles[0]?.id || null;
  }, [activeVehicleId, vehiclesQuery.data]);

  const keys = queryKeys(userId, resolvedVehicleId);

  const fuelLogsQuery = useQuery({
    queryKey: keys.fuelLogs,
    enabled: Boolean(resolvedVehicleId),
    queryFn: () => getFuelLogs(resolvedVehicleId as string),
  });

  const tasksQuery = useQuery({
    queryKey: keys.tasks,
    enabled: Boolean(resolvedVehicleId),
    queryFn: () => getMaintenanceTasks(resolvedVehicleId as string),
  });

  const historyQuery = useQuery({
    queryKey: keys.history,
    enabled: Boolean(resolvedVehicleId),
    queryFn: () => getServiceHistory(resolvedVehicleId as string),
  });

  const activeVehicle = useMemo(() => {
    const vehicles = vehiclesQuery.data || [];

    if (resolvedVehicleId) {
      return vehicles.find((vehicle) => vehicle.id === resolvedVehicleId) || null;
    }

    return null;
  }, [resolvedVehicleId, vehiclesQuery.data]);

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: keys.profile }),
      queryClient.invalidateQueries({ queryKey: keys.vehicles }),
      queryClient.invalidateQueries({ queryKey: keys.fuelLogs }),
      queryClient.invalidateQueries({ queryKey: keys.tasks }),
      queryClient.invalidateQueries({ queryKey: keys.history }),
    ]);
  };

  const createVehicleMutation = useMutation({
    mutationFn: (payload: {
      year: number;
      make: string;
      model: string;
      trim?: string;
      color?: string;
      vin?: string;
      photo_url?: string;
      unit_system: UnitSystem;
      current_odometer?: number;
    }) => createVehicle(userId as string, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: keys.vehicles });
    },
  });

  const setActiveVehicleMutation = useMutation({
    mutationFn: (vehicleId: string) => setActiveVehicle(userId as string, vehicleId),
    onSuccess: async () => {
      await refresh();
    },
  });

  const createFuelLogMutation = useMutation({
    mutationFn: (payload: {
      date: string;
      odometer: number;
      quantity: number;
      price_per_unit: number;
      total_cost: number;
      unit_system: UnitSystem;
    }) => createFuelLog(userId as string, resolvedVehicleId as string, payload),
    onSuccess: async () => {
      await refresh();
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: (payload: {
      title: string;
      description?: string;
      due_date?: string;
      due_odometer?: number;
      interval_miles?: number;
    }) => createMaintenanceTask(userId as string, resolvedVehicleId as string, payload),
    onSuccess: async () => {
      await refresh();
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: (payload: {
      task: MaintenanceTask;
      odometer: number;
      cost: number;
      notes?: string;
      photo_url?: string;
    }) => completeMaintenanceTask(userId as string, resolvedVehicleId as string, payload.task, payload),
    onSuccess: async () => {
      await refresh();
    },
  });

  const addServiceRecordMutation = useMutation({
    mutationFn: (payload: {
      event_type: 'maintenance' | 'repair' | 'fuel';
      title: string;
      date: string;
      odometer: number;
      cost: number;
      notes?: string;
      photo_url?: string;
      source_ref_id?: string;
    }) => createServiceRecord(userId as string, resolvedVehicleId as string, payload),
    onSuccess: async () => {
      await refresh();
    },
  });

  const deleteVehicleMutation = useMutation({
    mutationFn: (vehicleId: string) => deleteVehicle(userId as string, vehicleId),
    onSuccess: async () => {
      await refresh();
    },
  });

  return {
    profile: profileQuery.data,
    vehicles: (vehiclesQuery.data || []) as Vehicle[],
    fuelLogs: (fuelLogsQuery.data || []) as FuelLog[],
    tasks: (tasksQuery.data || []) as MaintenanceTask[],
    history: (historyQuery.data || []) as ServiceRecord[],
    activeVehicle,
    isLoading:
      profileQuery.isLoading ||
      vehiclesQuery.isLoading ||
      fuelLogsQuery.isLoading ||
      tasksQuery.isLoading ||
      historyQuery.isLoading,
    refresh,
    createVehicle: createVehicleMutation.mutateAsync,
    setActiveVehicle: setActiveVehicleMutation.mutateAsync,
    createFuelLog: createFuelLogMutation.mutateAsync,
    createTask: createTaskMutation.mutateAsync,
    completeTask: completeTaskMutation.mutateAsync,
    addServiceRecord: addServiceRecordMutation.mutateAsync,
    deleteVehicle: deleteVehicleMutation.mutateAsync,
  };
}
