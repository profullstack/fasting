import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Set test environment
const testConfigDir = join(tmpdir(), 'fasting-test-weight-' + Date.now());
process.env.FASTING_TEST_CONFIG_DIR = testConfigDir;

// Import after setting environment
const { logWeight, getWeightHistory } = await import('../lib/weight.js');

describe('Weight Tracking', () => {
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

  describe('logWeight', () => {
    it('should log weight with timestamp', () => {
      logWeight(175.5);
      
      const history = getWeightHistory();
      assert.strictEqual(history.length, 1);
      assert.strictEqual(history[0].weight, 175.5);
      assert.ok(history[0].timestamp);
      assert.ok(new Date(history[0].timestamp).getTime() > 0);
    });

    it('should handle integer weights', () => {
      logWeight(180);
      
      const history = getWeightHistory();
      assert.strictEqual(history.length, 1);
      assert.strictEqual(history[0].weight, 180);
    });

    it('should handle multiple weight entries', () => {
      logWeight(175);
      logWeight(174.5);
      logWeight(174);
      
      const history = getWeightHistory();
      assert.strictEqual(history.length, 3);
      assert.strictEqual(history[0].weight, 175);
      assert.strictEqual(history[1].weight, 174.5);
      assert.strictEqual(history[2].weight, 174);
    });
  });

  describe('getWeightHistory', () => {
    it('should return empty array when no weights logged', () => {
      const history = getWeightHistory();
      assert.ok(Array.isArray(history));
      assert.strictEqual(history.length, 0);
    });

    it('should return all weight entries in chronological order', () => {
      const weights = [180, 179.5, 179, 178.5, 178];
      
      weights.forEach(weight => {
        logWeight(weight);
      });
      
      const history = getWeightHistory();
      assert.strictEqual(history.length, weights.length);
      
      // Check chronological order
      for (let i = 1; i < history.length; i++) {
        const prevTime = new Date(history[i - 1].timestamp).getTime();
        const currTime = new Date(history[i].timestamp).getTime();
        assert.ok(currTime >= prevTime);
      }
      
      // Check weights are in the order they were logged
      weights.forEach((weight, index) => {
        assert.strictEqual(history[index].weight, weight);
      });
    });

    it('should preserve timestamps correctly', () => {
      const beforeLog = Date.now();
      logWeight(175);
      const afterLog = Date.now();
      
      const history = getWeightHistory();
      const loggedTime = new Date(history[0].timestamp).getTime();
      
      assert.ok(loggedTime >= beforeLog);
      assert.ok(loggedTime <= afterLog);
    });
  });

  describe('Weight trends', () => {
    it('should track weight loss progression', () => {
      const weights = [180, 179, 178, 177, 176];
      weights.forEach(weight => logWeight(weight));
      
      const history = getWeightHistory();
      assert.strictEqual(history.length, 5);
      
      // Verify decreasing trend
      for (let i = 1; i < history.length; i++) {
        assert.ok(history[i].weight < history[i - 1].weight);
      }
    });

    it('should track weight gain progression', () => {
      const weights = [170, 171, 172, 173, 174];
      weights.forEach(weight => logWeight(weight));
      
      const history = getWeightHistory();
      assert.strictEqual(history.length, 5);
      
      // Verify increasing trend
      for (let i = 1; i < history.length; i++) {
        assert.ok(history[i].weight > history[i - 1].weight);
      }
    });

    it('should handle fluctuating weights', () => {
      const weights = [175, 174.5, 175.2, 174.8, 175.1];
      weights.forEach(weight => logWeight(weight));
      
      const history = getWeightHistory();
      assert.strictEqual(history.length, 5);
      
      // Check that all weights are recorded correctly
      weights.forEach((weight, index) => {
        assert.strictEqual(history[index].weight, weight);
      });
    });
  });
});