import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Set test environment
const testConfigDir = join(tmpdir(), 'fasting-test-' + Date.now());
process.env.FASTING_TEST_CONFIG_DIR = testConfigDir;

// Import after setting environment
const { logExercise, getTodaysExercises, getExerciseHistory, getAllExercises } = await import('../lib/exercise.js');
const { createExerciseChart } = await import('../lib/charts.js');

describe('Exercise Tracking', () => {
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

  describe('logExercise', () => {
    it('should log exercise with calories', async () => {
      await logExercise('Running', 30, 300);
      const exercises = await getTodaysExercises();
      assert.strictEqual(exercises.length, 1);
      assert.strictEqual(exercises[0].description, 'Running');
      assert.strictEqual(exercises[0].duration, 30);
      assert.strictEqual(exercises[0].caloriesBurned, 300);
    });

    it('should log exercise with null calories when not specified', async () => {
      await logExercise('Walking', 45);
      const exercises = await getTodaysExercises();
      assert.strictEqual(exercises.length, 1);
      assert.strictEqual(exercises[0].description, 'Walking');
      assert.strictEqual(exercises[0].duration, 45);
      assert.strictEqual(exercises[0].caloriesBurned, null);
    });
  });

  describe('getTodaysExercises', () => {
    it('should return empty array when no exercises logged', async () => {
      const exercises = await getTodaysExercises();
      assert.ok(Array.isArray(exercises));
      assert.strictEqual(exercises.length, 0);
    });

    it('should return only today\'s exercises', async () => {
      await logExercise('Running', 30, 300);
      await logExercise('Weight lifting', 45, 200);
      await logExercise('Yoga', 60, 150);
      
      const exercises = await getTodaysExercises();
      assert.strictEqual(exercises.length, 3);
      assert.strictEqual(exercises[0].description, 'Running');
      assert.strictEqual(exercises[1].description, 'Weight lifting');
      assert.strictEqual(exercises[2].description, 'Yoga');
    });
  });

  describe('getExerciseHistory', () => {
    it('should return empty array when no exercises logged', async () => {
      const history = await getExerciseHistory();
      assert.ok(Array.isArray(history));
      assert.strictEqual(history.length, 0);
    });

    it('should group calories by date', async () => {
      await logExercise('Running', 30, 300);
      
      const history = await getExerciseHistory();
      assert.strictEqual(history.length, 1);
      assert.ok(history[0].date);
      assert.strictEqual(history[0].caloriesBurned, 300);
    });

    it('should skip entries with null calories', async () => {
      await logExercise('Running', 30, 300);
      await logExercise('Walking', 45); // No calories
      
      const history = await getExerciseHistory();
      assert.strictEqual(history.length, 1);
      assert.strictEqual(history[0].caloriesBurned, 300);
    });
  });

  describe('getAllExercises', () => {
    it('should return all exercises', async () => {
      await logExercise('Running', 30, 300);
      await logExercise('Cycling', 45, 400);
      
      const exercises = await getAllExercises();
      assert.strictEqual(exercises.length, 2);
      assert.strictEqual(exercises[0].description, 'Running');
      assert.strictEqual(exercises[1].description, 'Cycling');
    });
  });
});

describe('Exercise Chart', () => {
  describe('createExerciseChart', () => {
    it('should return message when no data', () => {
      const chart = createExerciseChart([]);
      assert.ok(chart.includes('No exercise data available'));
    });

    it('should create chart with exercise data', () => {
      const data = [
        { date: '2023-12-01', caloriesBurned: 300 },
        { date: '2023-12-02', caloriesBurned: 250 },
        { date: '2023-12-03', caloriesBurned: 400 }
      ];
      
      const chart = createExerciseChart(data);
      assert.ok(chart.includes('Daily Calories Burned (Exercise)'));
      // Check that chart contains some of the calorie values (they might be formatted differently)
      assert.ok(chart.includes('300') || chart.includes('250') || chart.includes('400'));
    });

    it('should handle single data point', () => {
      const data = [
        { date: '2023-12-01', caloriesBurned: 300 }
      ];
      
      const chart = createExerciseChart(data);
      assert.ok(chart.includes('Daily Calories Burned (Exercise)'));
      assert.ok(chart.includes('300'));
    });

    it('should calculate correct average', () => {
      const data = [
        { date: '2023-12-01', caloriesBurned: 300 },
        { date: '2023-12-02', caloriesBurned: 200 }
      ];
      
      const chart = createExerciseChart(data);
      assert.ok(chart.includes('Average: 250 calories burned/day'));
    });
  });
});