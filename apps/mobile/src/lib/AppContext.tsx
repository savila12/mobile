import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { UnitSystem } from '../types/models';
import { ensureProfile, updateProfile } from './api';

type AppContextValue = {
  userId: string;
  activeVehicleId: string | null;
  setActiveVehicleId: (vehicleId: string | null) => void;
  unitSystem: UnitSystem;
  saveProfile: (patch: { default_unit_system?: UnitSystem }) => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider = ({ userId, children }: PropsWithChildren<{ userId: string }>) => {
  const [activeVehicleId, setActiveVehicleId] = useState<string | null>(null);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('imperial');

  useEffect(() => {
    ensureProfile(userId)
      .then((profile) => {
        setActiveVehicleId(profile.active_vehicle_id || null);
        setUnitSystem(profile.default_unit_system ?? 'imperial');
      })
      .catch(() => {
        setActiveVehicleId(null);
      });
  }, [userId]);

  const saveProfile = useCallback(
    async (patch: { default_unit_system?: UnitSystem }) => {
      const updated = await updateProfile(userId, patch);
      if (patch.default_unit_system !== undefined) setUnitSystem(updated.default_unit_system ?? 'imperial');
    },
    [userId],
  );

  const value = useMemo(
    () => ({
      userId,
      activeVehicleId,
      setActiveVehicleId,
      unitSystem,
      saveProfile,
    }),
    [activeVehicleId, saveProfile, unitSystem, userId],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useAppContext must be used inside AppProvider');
  }

  return context;
};
