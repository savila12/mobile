import { FuelLog } from '../types/models';

export const calculateMpg = (
  currentOdometer: number,
  previousOdometer: number | null,
  quantity: number,
  unitSystem: 'imperial' | 'metric',
): number | null => {
  if (!previousOdometer || quantity <= 0 || currentOdometer <= previousOdometer) {
    return null;
  }

  const distance = currentOdometer - previousOdometer;

  if (unitSystem === 'metric') {
    const litersPer100Km = (quantity / distance) * 100;
    return Number((235.215 / litersPer100Km).toFixed(2));
  }

  return Number((distance / quantity).toFixed(2));
};

export const rollingAverageMpg = (logs: FuelLog[]): number => {
  const mpgValues = logs.map((log) => log.mpg).filter((value): value is number => value !== null);

  if (!mpgValues.length) {
    return 0;
  }

  const sum = mpgValues.reduce((acc, value) => acc + value, 0);
  return Number((sum / mpgValues.length).toFixed(2));
};

export const monthlySpend = (logs: FuelLog[], now = new Date()): number => {
  const month = now.getMonth();
  const year = now.getFullYear();

  const total = logs
    .filter((log) => {
      const date = new Date(log.date);
      return date.getMonth() === month && date.getFullYear() === year;
    })
    .reduce((acc, log) => acc + Number(log.total_cost || 0), 0);

  return Number(total.toFixed(2));
};

export const monthlyMiles = (logs: FuelLog[], now = new Date()): number => {
  const month = now.getMonth();
  const year = now.getFullYear();

  const monthLogs = logs
    .filter((log) => {
      const date = new Date(log.date);
      return date.getMonth() === month && date.getFullYear() === year;
    })
    .sort((a, b) => a.odometer - b.odometer);

  if (monthLogs.length < 2) {
    return 0;
  }

  return Math.max(monthLogs[monthLogs.length - 1].odometer - monthLogs[0].odometer, 0);
};
