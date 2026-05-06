/**
 * Tests for offlineQueue.ts
 */

import * as storage from '../../src/lib/storage';
import NetInfo from '@react-native-community/netinfo';
import { enqueueOperation, clearQueue, flushQueue } from '../../src/lib/offlineQueue';
import { OfflineOperation } from '../../src/types/models';

jest.mock('@react-native-community/netinfo');
jest.mock('../../src/lib/storage');

const QUEUE_KEY = 'autotrack:offlineQueue';

describe('offlineQueue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('enqueueOperation', () => {
    it('should add operation to queue', async () => {
      const mockQueue: OfflineOperation[] = [];
      (storage.readCache as jest.Mock).mockResolvedValue(mockQueue);
      (storage.writeCache as jest.Mock).mockResolvedValue(undefined);

      const operation: OfflineOperation = {
        id: 'op1',
        type: 'create_vehicle',
        timestamp: Date.now(),
        data: { make: 'Tesla', model: 'Model 3' },
      };

      await enqueueOperation(operation);

      expect(storage.readCache).toHaveBeenCalledWith(QUEUE_KEY);
      expect(storage.writeCache).toHaveBeenCalledWith(QUEUE_KEY, [operation]);
    });

    it('should append to existing queue', async () => {
      const existingQueue: OfflineOperation[] = [
        {
          id: 'op1',
          type: 'create_vehicle',
          timestamp: Date.now(),
          data: { make: 'Tesla' },
        },
      ];
      const existingQueueSnapshot = [...existingQueue];
      (storage.readCache as jest.Mock).mockResolvedValue(existingQueue);
      (storage.writeCache as jest.Mock).mockResolvedValue(undefined);

      const newOperation: OfflineOperation = {
        id: 'op2',
        type: 'create_fuel_log',
        timestamp: Date.now(),
        data: { gallons: 10 },
      };

      await enqueueOperation(newOperation);

      expect(storage.writeCache).toHaveBeenCalledWith(QUEUE_KEY, [
        ...existingQueueSnapshot,
        newOperation,
      ]);
    });

    it('should handle empty queue', async () => {
      (storage.readCache as jest.Mock).mockResolvedValue(null);
      (storage.writeCache as jest.Mock).mockResolvedValue(undefined);

      const operation: OfflineOperation = {
        id: 'op1',
        type: 'create_vehicle',
        timestamp: Date.now(),
        data: {},
      };

      await enqueueOperation(operation);

      expect(storage.writeCache).toHaveBeenCalledWith(QUEUE_KEY, [operation]);
    });
  });

  describe('clearQueue', () => {
    it('should clear the queue', async () => {
      (storage.writeCache as jest.Mock).mockResolvedValue(undefined);

      await clearQueue();

      expect(storage.writeCache).toHaveBeenCalledWith(QUEUE_KEY, []);
    });
  });

  describe('flushQueue', () => {
    it('should return 0 when no network', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: false });

      const executor = jest.fn();
      const result = await flushQueue(executor);

      expect(result).toBe(0);
      expect(executor).not.toHaveBeenCalled();
    });

    it('should return 0 when queue is empty', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
      (storage.readCache as jest.Mock).mockResolvedValue([]);

      const executor = jest.fn();
      const result = await flushQueue(executor);

      expect(result).toBe(0);
      expect(executor).not.toHaveBeenCalled();
    });

    it('should execute all operations and return count', async () => {
      const queue: OfflineOperation[] = [
        { id: 'op1', type: 'create_vehicle', timestamp: Date.now(), data: {} },
        { id: 'op2', type: 'create_fuel_log', timestamp: Date.now(), data: {} },
        { id: 'op3', type: 'create_maintenance_task', timestamp: Date.now(), data: {} },
      ];

      (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
      (storage.readCache as jest.Mock).mockResolvedValue(queue);
      (storage.writeCache as jest.Mock).mockResolvedValue(undefined);

      const executor = jest.fn().mockResolvedValue(undefined);
      const result = await flushQueue(executor);

      expect(result).toBe(3);
      expect(executor).toHaveBeenCalledTimes(3);
      expect(storage.writeCache).toHaveBeenCalledWith(QUEUE_KEY, []);
    });

    it('should keep failed operations in queue', async () => {
      const queue: OfflineOperation[] = [
        { id: 'op1', type: 'create_vehicle', timestamp: Date.now(), data: {} },
        { id: 'op2', type: 'create_fuel_log', timestamp: Date.now(), data: {} },
        { id: 'op3', type: 'create_maintenance_task', timestamp: Date.now(), data: {} },
      ];

      (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
      (storage.readCache as jest.Mock).mockResolvedValue(queue);
      (storage.writeCache as jest.Mock).mockResolvedValue(undefined);

      const executor = jest.fn()
        .mockResolvedValueOnce(undefined) // op1 succeeds
        .mockRejectedValueOnce(new Error('Network error')) // op2 fails
        .mockResolvedValueOnce(undefined); // op3 succeeds

      const result = await flushQueue(executor);

      expect(result).toBe(2); // 2 succeeded
      expect(storage.writeCache).toHaveBeenCalledWith(QUEUE_KEY, [queue[1]]); // op2 remains
    });

    it('should handle partial failures', async () => {
      const queue: OfflineOperation[] = [
        { id: 'op1', type: 'create_vehicle', timestamp: Date.now(), data: {} },
        { id: 'op2', type: 'create_fuel_log', timestamp: Date.now(), data: {} },
      ];

      (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
      (storage.readCache as jest.Mock).mockResolvedValue(queue);
      (storage.writeCache as jest.Mock).mockResolvedValue(undefined);

      const executor = jest.fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockResolvedValueOnce(undefined);

      const result = await flushQueue(executor);

      expect(result).toBe(1);
      expect(executor).toHaveBeenCalledTimes(2);
    });

    it('should handle all failed operations', async () => {
      const queue: OfflineOperation[] = [
        { id: 'op1', type: 'create_vehicle', timestamp: Date.now(), data: {} },
        { id: 'op2', type: 'create_fuel_log', timestamp: Date.now(), data: {} },
      ];

      (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
      (storage.readCache as jest.Mock).mockResolvedValue(queue);
      (storage.writeCache as jest.Mock).mockResolvedValue(undefined);

      const executor = jest.fn().mockRejectedValue(new Error('All fail'));

      const result = await flushQueue(executor);

      expect(result).toBe(0);
      expect(storage.writeCache).toHaveBeenCalledWith(QUEUE_KEY, queue); // all remain
    });
  });
});
