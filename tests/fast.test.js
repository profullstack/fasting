import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { mkdirSync, rmSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Set test environment
const testConfigDir = join(tmpdir(), 'fasting-test-' + Date.now());
process.env.FASTING_TEST_CONFIG_DIR = testConfigDir;

// Import after setting environment
const { startFast, endFast, getCurrentFast, getFastHistory, getFastStats } = await import('../lib/fast.js');

describe('Fast Tracking', () => {
  beforeEach(() => {
    // Create test directory
    if (existsSync(testConfigDir)) {
      rmSync(testConfigDir, { recursive: true, force: true });
    }
    mkdirSync(testConfigDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up test directory
    if (existsSync(testConfigDir)) {
      rmSync(testConfigDir, { recursive: true, force: true });
    }
  });

  describe('startFast', () => {
    it('should start a fast with current time', async () => {
      const timestamp = await startFast();
      assert.ok(timestamp);
      assert.ok(new Date(timestamp).getTime() > 0);
      
      const currentFast = await getCurrentFast();
      assert.ok(currentFast);
      assert.strictEqual(currentFast.startTime, timestamp);
      assert.strictEqual(currentFast.endTime, null);
    });

    it('should start a fast with custom time', async () => {
      const customTime = '2023-12-01 18:00';
      const timestamp = await startFast(customTime);
      
      const currentFast = await getCurrentFast();
      assert.ok(currentFast);
      assert.strictEqual(currentFast.startTime, new Date(customTime).toISOString());
    });

    it('should throw error if fast already active', async () => {
      await startFast();
      await assert.rejects(async () => {
        await startFast();
      }, /already an active fast/);
    });
  });

  describe('endFast', () => {
    it('should end an active fast', async () => {
      const startTime = '2023-12-01 18:00';
      await startFast(startTime);
      
      const endTime = '2023-12-02 10:00';
      const completedFast = await endFast(endTime);
      
      assert.ok(completedFast);
      assert.strictEqual(completedFast.startTime, new Date(startTime).toISOString());
      assert.strictEqual(completedFast.endTime, new Date(endTime).toISOString());
      assert.strictEqual(completedFast.durationHours, 16);
    });

    it('should throw error if no active fast', async () => {
      await assert.rejects(async () => {
        await endFast();
      }, /No active fast found/);
    });

    it('should calculate duration correctly', async () => {
      const startTime = '2023-12-01 20:00';
      await startFast(startTime);
      
      const endTime = '2023-12-02 12:30';
      const completedFast = await endFast(endTime);
      
      assert.strictEqual(completedFast.durationHours, 16.5);
    });
  });

  describe('getCurrentFast', () => {
    it('should return null when no active fast', async () => {
      const currentFast = await getCurrentFast();
      assert.strictEqual(currentFast, null);
    });

    it('should return active fast', async () => {
      await startFast();
      const currentFast = await getCurrentFast();
      assert.ok(currentFast);
      assert.ok(currentFast.startTime);
      assert.strictEqual(currentFast.endTime, null);
    });
  });

  describe('getFastHistory', () => {
    it('should return empty array when no completed fasts', async () => {
      const history = await getFastHistory();
      assert.ok(Array.isArray(history));
      assert.strictEqual(history.length, 0);
    });

    it('should return only completed fasts', async () => {
      // Start and complete a fast
      await startFast('2023-12-01 18:00');
      await endFast('2023-12-02 10:00');
      
      // Start another fast but don't complete it
      await startFast('2023-12-02 20:00');
      
      const history = await getFastHistory();
      assert.strictEqual(history.length, 1);
      assert.ok(history[0].endTime);
      assert.strictEqual(history[0].durationHours, 16);
    });
  });

  describe('getFastStats', () => {
    it('should return zero stats when no completed fasts', async () => {
      const stats = await getFastStats();
      assert.deepStrictEqual(stats, {
        totalFasts: 0,
        averageDuration: 0,
        longestFast: 0,
        shortestFast: 0
      });
    });

    it('should calculate stats correctly', async () => {
      // Complete multiple fasts
      await startFast('2023-12-01 18:00');
      await endFast('2023-12-02 10:00'); // 16 hours
      
      await startFast('2023-12-02 20:00');
      await endFast('2023-12-03 14:00'); // 18 hours
      
      await startFast('2023-12-03 19:00');
      await endFast('2023-12-04 09:00'); // 14 hours
      
      const stats = await getFastStats();
      assert.strictEqual(stats.totalFasts, 3);
      assert.strictEqual(stats.averageDuration, 16);
      assert.strictEqual(stats.longestFast, 18);
      assert.strictEqual(stats.shortestFast, 14);
    });
  });
});