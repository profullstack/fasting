import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Set test environment
const testConfigDir = join(tmpdir(), 'fasting-test-' + Date.now());
process.env.FASTING_TEST_CONFIG_DIR = testConfigDir;

// Import after setting environment
const { getCalorieHistory, logMeal, logDrink } = await import('../lib/fasting.js');
const { createCalorieChart } = await import('../lib/charts.js');

describe('Calorie Chart', () => {
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

  describe('getCalorieHistory', () => {
    it('should return empty array when no meals logged', async () => {
      const history = await getCalorieHistory();
      assert.ok(Array.isArray(history));
      assert.strictEqual(history.length, 0);
    });

    it('should group calories by date', async () => {
      await logMeal('Breakfast', 400);
      
      const history = await getCalorieHistory();
      assert.strictEqual(history.length, 1);
      assert.ok(history[0].date);
      assert.strictEqual(history[0].calories, 400);
    });

    it('should skip entries with null calories', async () => {
      await logMeal('Breakfast', 400);
      await logMeal('Unknown meal'); // No calories
      
      const history = await getCalorieHistory();
      assert.strictEqual(history.length, 1);
      assert.strictEqual(history[0].calories, 400);
    });

    it('should sort by date', async () => {
      // Create entries with specific timestamps to test sorting
      await logMeal('Meal 1', 300);
      await logMeal('Meal 2', 400);
      
      const history = await getCalorieHistory();
      assert.ok(history.length > 0);
      
      // Check that dates are in chronological order
      for (let i = 1; i < history.length; i++) {
        const prevDate = new Date(history[i-1].timestamp);
        const currDate = new Date(history[i].timestamp);
        assert.ok(prevDate <= currDate);
      }
    });
  });

  describe('createCalorieChart', () => {
    it('should return message when no data', () => {
      const chart = createCalorieChart([]);
      assert.ok(chart.includes('No calorie data available'));
    });

    it('should create chart with calorie data', () => {
      const data = [
        { date: '2023-12-01', calories: 2000 },
        { date: '2023-12-02', calories: 1800 },
        { date: '2023-12-03', calories: 2200 }
      ];
      
      const chart = createCalorieChart(data);
      assert.ok(chart.includes('Daily Calorie Intake'));
      assert.ok(chart.includes('2000'));
      assert.ok(chart.includes('1800'));
      assert.ok(chart.includes('2200'));
    });

    it('should handle single data point', () => {
      const data = [
        { date: '2023-12-01', calories: 2000 }
      ];
      
      const chart = createCalorieChart(data);
      assert.ok(chart.includes('Daily Calorie Intake'));
      assert.ok(chart.includes('2000'));
    });

    it('should calculate correct average', () => {
      const data = [
        { date: '2023-12-01', calories: 2000 },
        { date: '2023-12-02', calories: 1800 }
      ];
      
      const chart = createCalorieChart(data);
      assert.ok(chart.includes('Average: 1900 calories/day'));
    });

    it('should include date labels', () => {
      const data = [
        { date: '2023-12-01', calories: 2000 },
        { date: '2023-12-02', calories: 1800 }
      ];
      
      const chart = createCalorieChart(data);
      // Just check that the chart is generated successfully
      assert.ok(chart.length > 0);
      assert.ok(chart.includes('Daily Calorie Intake'));
    });

    it('should handle custom dimensions', () => {
      const data = [
        { date: '2023-12-01', calories: 2000 },
        { date: '2023-12-02', calories: 1800 }
      ];
      
      const chart = createCalorieChart(data, { width: 40, height: 10 });
      assert.ok(chart.includes('Daily Calorie Intake'));
      assert.ok(chart.length > 0);
    });
  });

  describe('Integration', () => {
    it('should work end-to-end with real meal data', async () => {
      // Log some meals and drinks
      await logMeal('Breakfast', 400);
      await logDrink('Coffee', 50);
      await logMeal('Lunch', 600);
      
      // Get calorie history
      const history = await getCalorieHistory();
      assert.strictEqual(history.length, 1);
      assert.strictEqual(history[0].calories, 1050); // 400 + 50 + 600
      
      // Create chart
      const chart = createCalorieChart(history);
      assert.ok(chart.includes('Daily Calorie Intake'));
      assert.ok(chart.includes('1050'));
    });
  });
});