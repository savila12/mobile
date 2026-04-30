export type UnitSystem = 'imperial' | 'metric';

export type Vehicle = {
  id: string;
  user_id: string;
  year: number;
  make: string;
  model: string;
  trim?: string | null;
  color?: string | null;
  vin?: string | null;
  photo_url?: string | null;
  is_primary: boolean;
  current_odometer: number;
  unit_system: UnitSystem;
  created_at: string;
  updated_at: string;
};

export type FuelLog = {
  id: string;
  user_id: string;
  vehicle_id: string;
  date: string;
  odometer: number;
  quantity: number;
  price_per_unit: number;
  total_cost: number;
  mpg: number | null;
  created_at: string;
  updated_at: string;
};

export type MaintenanceTask = {
  id: string;
  user_id: string;
  vehicle_id: string;
  title: string;
  description?: string | null;
  due_date?: string | null;
  due_odometer?: number | null;
  interval_miles?: number | null;
  status: 'upcoming' | 'completed';
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type ServiceRecord = {
  id: string;
  user_id: string;
  vehicle_id: string;
  event_type: 'maintenance' | 'repair' | 'fuel';
  title: string;
  date: string;
  odometer: number;
  cost: number;
  notes?: string | null;
  photo_url?: string | null;
  source_ref_id?: string | null;
  created_at: string;
};

export type UserProfile = {
  id: string;
  active_vehicle_id?: string | null;
  default_unit_system?: UnitSystem | null;
  created_at: string;
  updated_at: string;
};

export type OfflineOperation = {
  id: string;
  action:
    | 'create_vehicle'
    | 'set_active_vehicle'
    | 'create_fuel_log'
    | 'create_maintenance_task'
    | 'complete_maintenance_task'
    | 'create_service_record'
    | 'delete_vehicle';
  payload: Record<string, unknown>;
  createdAt: string;
};
