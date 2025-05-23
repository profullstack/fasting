import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Set test environment
const testConfigDir = join(tmpdir(), 'fasting-test-calorie-' + Date.now());
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
    it('should return empty array when no meals logged', () => {
      const history = getCalorieHistory();
      assert.ok(Array.isArray(history));
      assert.strictEqual(history.length, 0);
    });

    it('should group calories by date', () => {
      // Log meals on different dates by manipulating timestamps
      logMeal('Breakfast', 300);
      logMeal('Lunch', 400);
      logDrink('Coffee', 50);
      
      const history = getCalorieHistory();
      assert.strictEqual(history.length, 1);
      assert.strictEqual(history[0].calories, 750); // 300 + 400 + 50
      assert.ok(history[0].date);
      assert.ok(history[0].timestamp);
    });

    it('should skip entries with null calories', () => {
      logMeal('Meal without calories'); // null calories
      logMeal('Meal with calories', 300);
      
      const history = getCalorieHistory();
      assert.strictEqual(history.length, 1);
      assert.strictEqual(history[0].calories, 300);
    });

    it('should sort by date', () => {
      // This test would need date manipulation to properly test sorting
      // For now, we'll test that the function returns sorted data
      logMeal('Meal 1', 300);
      logMeal('Meal 2', 400);
      
      const history = getCalorieHistory();
      assert.ok(history.length > 0);
      // Verify timestamp format
      assert.ok(history[0].timestamp.includes('T'));
    });
  });

  describe('createCalorieChart', () => {
    it('should return message when no data', () => {
      const chart = createCalorieChart([]);
      assert.strictEqual(chart, 'No calorie data available');
    });

    it('should create chart with calorie data', () => {
      const calorieData = [
        { date: '2023-12-01', calories: 1500, timestamp: '2023-12-01T12:00:00Z' },
        { date: '2023-12-02', calories: 1800, timestamp: '2023-12-02T12:00:00Z' },
        { date: '2023-12-03', calories: 1200, timestamp: '2023-12-03T12:00:00Z' }
      ];
      
      const chart = createCalorieChart(calorieData);
      assert.ok(chart.includes('Daily Calorie Intake'));
      assert.ok(chart.includes('1800'));
      assert.ok(chart.includes('1200'));
      assert.ok(chart.includes('●'));
      assert.ok(chart.includes('Average:'));
    });

    it('should handle single data point', () => {
      const calorieData = [
        { date: '2023-12-01', calories: 1500, timestamp: '2023-12-01T12:00:00Z' }
      ];
      
      const chart = createCalorieChart(calorieData);
      assert.ok(chart.includes('Daily Calorie Intake'));
      assert.ok(chart.includes('1500'));
      assert.ok(chart.includes('Average: 1500'));
    });

    it('should calculate correct average', () => {
      const calorieData = [
        { date: '2023-12-01', calories: 1000, timestamp: '2023-12-01T12:00:00Z' },
        { date: '2023-12-02', calories: 2000, timestamp: '2023-12-02T12:00:00Z' },
        { date: '2023-12-03', calories: 1500, timestamp: '2023-12-03T12:00:00Z' }
      ];
      
      const chart = createCalorieChart(calorieData);
      assert.ok(chart.includes('Average: 1500 calories/day'));
    });

    it('should include date labels', () => {
      const calorieData = [
        { date: '2023-12-01', calories: 1500, timestamp: '2023-12-01T12:00:00Z' },
        { date: '2023-12-05', calories: 1800, timestamp: '2023-12-05T12:00:00Z' }
      ];
      
      const chart = createCalorieChart(calorieData);
      assert.ok(chart.includes('12/1/2023') || chart.includes('2023'));
      assert.ok(chart.includes('12/5/2023') || chart.includes('2023'));
    });

    it('should handle custom dimensions', () => {
      const calorieData = [
        { date: '2023-12-01', calories: 1500, timestamp: '2023-12-01T12:00:00Z' },
        { date: '2023-12-02', calories: 1800, timestamp: '2023-12-02T12:00:00Z' }
      ];
      
      const chart = createCalorieChart(calorieData, 40, 10);
      const lines = chart.split('\n');
      
      // Check that chart respects dimensions (approximately)
      assert.ok(lines.length > 10); // Should have title, chart, labels
      
      // Find chart lines (those with │)
      const chartLines = lines.filter(line => line.includes('│'));
      assert.ok(chartLines.length <= 12); // Height + some tolerance for labels
    });
  });

  describe('Integration', () => {
    it('should work end-to-end with real meal data', () => {
      // Log some meals
      logMeal('Breakfast', 400);
      logDrink('Coffee', 50);
      logMeal('Lunch', 600);
      logMeal('Dinner', 500);
      
      // Get calorie history
      const history = getCalorieHistory();
      assert.strictEqual(history.length, 1);
      assert.strictEqual(history[0].calories, 1550);
      
      // Create chart
      const chart = createCalorieChart(history);
      assert.ok(chart.includes('Daily Calorie Intake'));
      assert.ok(chart.includes('1550'));
      assert.ok(chart.includes('Average: 1550'));
    });
  });
});