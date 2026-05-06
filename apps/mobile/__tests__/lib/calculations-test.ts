import { monthlyMiles, monthlySpend, rollingAverageMpg } from '../../src/lib/calculations';
import { FuelLog } from '../../src/types/models';

describe('calculations', () => {
    describe('monthlyMiles', () => {
        it('returns 0 for empty fuel logs', () => {
            const miles = monthlyMiles([]);
            expect(miles).toBe(0);
        });

        it('calculates miles from multiple fuel logs in the current month', () => {
            const today = new Date();
            const logs: FuelLog[] = [
                {
                    id: '1',
                    vehicle_id: 'v1',
                    date: new Date(today.getFullYear(), today.getMonth(), 1).toISOString(),
                    odometer: 10000,
                    quantity: 10,
                    price_per_unit: 4.25,
                    total_cost: 42.5,
                    mpg: null,
                    unit_system: 'imperial',
                    created_at: new Date().toISOString(),
                },
                {
                    id: '2',
                    vehicle_id: 'v1',
                    date: new Date(today.getFullYear(), today.getMonth(), 15).toISOString(),
                    odometer: 10500,
                    quantity: 12,
                    price_per_unit: 4.25,
                    total_cost: 51,
                    mpg: null,
                    unit_system: 'imperial',
                    created_at: new Date().toISOString(),
                },
            ];

            const miles = monthlyMiles(logs);
            expect(miles).toBe(500);
        });

        it('ignores fuel logs from previous months', () => {
            const today = new Date();
            const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 15);
            const logs: FuelLog[] = [
                {
                    id: '1',
                    vehicle_id: 'v1',
                    date: lastMonth.toISOString(),
                    odometer: 10000,
                    quantity: 10,
                    price_per_unit: 4.25,
                    total_cost: 42.5,
                    mpg: null,
                    unit_system: 'imperial',
                    created_at: new Date().toISOString(),
                },
            ];

            const miles = monthlyMiles(logs);
            expect(miles).toBe(0);
        });
    });

    describe('monthlySpend', () => {
        it('returns 0 for empty fuel logs', () => {
            const spend = monthlySpend([]);
            expect(spend).toBe(0);
        });

        it('sums total costs from fuel logs in the current month', () => {
            const today = new Date();
            const logs: FuelLog[] = [
                {
                    id: '1',
                    vehicle_id: 'v1',
                    date: new Date(today.getFullYear(), today.getMonth(), 1).toISOString(),
                    odometer: 10000,
                    quantity: 10,
                    price_per_unit: 4.25,
                    total_cost: 42.5,
                    mpg: null,
                    unit_system: 'imperial',
                    created_at: new Date().toISOString(),
                },
                {
                    id: '2',
                    vehicle_id: 'v1',
                    date: new Date(today.getFullYear(), today.getMonth(), 15).toISOString(),
                    odometer: 10500,
                    quantity: 12,
                    price_per_unit: 4.25,
                    total_cost: 51,
                    mpg: null,
                    unit_system: 'imperial',
                    created_at: new Date().toISOString(),
                },
            ];

            const spend = monthlySpend(logs);
            expect(spend).toBe(93.5);
        });
    });

    describe('rollingAverageMpg', () => {
        it('returns 0 for empty fuel logs', () => {
            const avg = rollingAverageMpg([]);
            expect(avg).toBe(0);
        });

        it('returns the mpg value when there is only one fuel log', () => {
            const logs: FuelLog[] = [
                {
                    id: '1',
                    vehicle_id: 'v1',
                    date: new Date().toISOString(),
                    odometer: 10000,
                    quantity: 10,
                    price_per_unit: 4.25,
                    total_cost: 42.5,
                    mpg: 30,
                    unit_system: 'imperial',
                    created_at: new Date().toISOString(),
                },
            ];

            const avg = rollingAverageMpg(logs);
            expect(avg).toBe(30);
        });

        it('calculates average mpg from multiple logs', () => {
            const logs: FuelLog[] = [
                {
                    id: '1',
                    vehicle_id: 'v1',
                    date: new Date(2026, 4, 1).toISOString(),
                    odometer: 10000,
                    quantity: 10,
                    price_per_unit: 4.25,
                    total_cost: 42.5,
                    mpg: 30,
                    unit_system: 'imperial',
                    created_at: new Date().toISOString(),
                },
                {
                    id: '2',
                    vehicle_id: 'v1',
                    date: new Date(2026, 4, 2).toISOString(),
                    odometer: 10300,
                    quantity: 10,
                    price_per_unit: 4.25,
                    total_cost: 42.5,
                    mpg: 30,
                    unit_system: 'imperial',
                    created_at: new Date().toISOString(),
                },
            ];

            const avg = rollingAverageMpg(logs);
            expect(avg).toBe(30);
        });
    });
});
