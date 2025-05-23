import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Set test environment
const testConfigDir = join(tmpdir(), 'fasting-test-' + Date.now());
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
    it('should log weight with timestamp', async () => {
      await logWeight(175.5);
      const history = await getWeightHistory();
      assert.strictEqual(history.length, 1);
      assert.strictEqual(history[0].weight, 175.5);
      assert.ok(history[0].timestamp);
    });

    it('should handle integer weights', async () => {
      await logWeight(180);
      const history = await getWeightHistory();
      assert.strictEqual(history.length, 1);
      assert.strictEqual(history[0].weight, 180);
    });

    it('should handle multiple weight entries', async () => {
      await logWeight(175);
      await logWeight(174.5);
      await logWeight(174);
      
      const history = await getWeightHistory();
      assert.strictEqual(history.length, 3);
      assert.strictEqual(history[0].weight, 175);
      assert.strictEqual(history[1].weight, 174.5);
      assert.strictEqual(history[2].weight, 174);
    });
  });

  describe('getWeightHistory', () => {
    it('should return empty array when no weights logged', async () => {
      const history = await getWeightHistory();
      assert.ok(Array.isArray(history));
      assert.strictEqual(history.length, 0);
    });

    it('should return all weight entries in chronological order', async () => {
      await logWeight(180);
      await logWeight(179.5);
      await logWeight(179);
      await logWeight(178.5);
      await logWeight(178);
      
      const history = await getWeightHistory();
      assert.strictEqual(history.length, 5);
      assert.strictEqual(history[0].weight, 180);
      assert.strictEqual(history[1].weight, 179.5);
      assert.strictEqual(history[2].weight, 179);
      assert.strictEqual(history[3].weight, 178.5);
      assert.strictEqual(history[4].weight, 178);
    });

    it('should preserve timestamps correctly', async () => {
      await logWeight(175);
      await logWeight(174);
      await logWeight(173);
      
      const history = await getWeightHistory();
      assert.strictEqual(history.length, 3);
      
      // Check that all entries have valid timestamps
      history.forEach(entry => {
        assert.ok(entry.timestamp);
        assert.ok(new Date(entry.timestamp).getTime() > 0);
      });
      
      // Check chronological order
      for (let i = 1; i < history.length; i++) {
        const prevTime = new Date(history[i-1].timestamp);
        const currTime = new Date(history[i].timestamp);
        assert.ok(prevTime <= currTime);
      }
    });
  });

  describe('Weight trends', () => {
    it('should track weight loss progression', async () => {
      await logWeight(180);
      await logWeight(179);
      await logWeight(178);
      await logWeight(177);
      await logWeight(176);
      
      const history = await getWeightHistory();
      assert.strictEqual(history.length, 5);
      
      // Verify downward trend
      for (let i = 1; i < history.length; i++) {
        assert.ok(history[i].weight <= history[i-1].weight);
      }
    });

    it('should track weight gain progression', async () => {
      await logWeight(170);
      await logWeight(171);
      await logWeight(172);
      await logWeight(173);
      await logWeight(174);
      
      const history = await getWeightHistory();
      assert.strictEqual(history.length, 5);
      
      // Verify upward trend
      for (let i = 1; i < history.length; i++) {
        assert.ok(history[i].weight >= history[i-1].weight);
      }
    });

    it('should handle fluctuating weights', async () => {
      await logWeight(175);
      await logWeight(174);
      await logWeight(175.5);
      await logWeight(174.5);
      await logWeight(175);
      
      const history = await getWeightHistory();
      assert.strictEqual(history.length, 5);
      
      // Just verify all weights are recorded correctly
      const expectedWeights = [175, 174, 175.5, 174.5, 175];
      history.forEach((entry, index) => {
        assert.strictEqual(entry.weight, expectedWeights[index]);
      });
    });
  });
});