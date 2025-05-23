import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Set test environment
const testConfigDir = join(tmpdir(), 'fasting-test-exercise-' + Date.now());
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
    it('should log exercise with calories', () => {
      logExercise('Running', 30, 300);
      
      const exercises = getTodaysExercises();
      assert.strictEqual(exercises.length, 1);
      assert.strictEqual(exercises[0].description, 'Running');
      assert.strictEqual(exercises[0].duration, 30);
      assert.strictEqual(exercises[0].caloriesBurned, 300);
      assert.ok(exercises[0].timestamp);
    });

    it('should log exercise with null calories when not specified', () => {
      logExercise('Walking', 20);
      
      const exercises = getTodaysExercises();
      assert.strictEqual(exercises.length, 1);
      assert.strictEqual(exercises[0].caloriesBurned, null);
    });
  });

  describe('getTodaysExercises', () => {
    it('should return empty array when no exercises logged', () => {
      const exercises = getTodaysExercises();
      assert.ok(Array.isArray(exercises));
      assert.strictEqual(exercises.length, 0);
    });

    it('should return only today\'s exercises', () => {
      logExercise('Running', 30, 300);
      logExercise('Cycling', 45, 400);
      logExercise('Swimming', 60, 500);
      
      const exercises = getTodaysExercises();
      assert.strictEqual(exercises.length, 3);
      
      // Check that all exercises are from today
      const today = new Date().toDateString();
      exercises.forEach(exercise => {
        const exerciseDate = new Date(exercise.timestamp).toDateString();
        assert.strictEqual(exerciseDate, today);
      });
    });
  });

  describe('getExerciseHistory', () => {
    it('should return empty array when no exercises logged', () => {
      const history = getExerciseHistory();
      assert.ok(Array.isArray(history));
      assert.strictEqual(history.length, 0);
    });

    it('should group calories by date', () => {
      logExercise('Running', 30, 300);
      logExercise('Walking', 20, 100);
      logExercise('Cycling', 45, 400);
      
      const history = getExerciseHistory();
      assert.strictEqual(history.length, 1);
      assert.strictEqual(history[0].caloriesBurned, 800); // 300 + 100 + 400
      assert.ok(history[0].date);
      assert.ok(history[0].timestamp);
    });

    it('should skip entries with null calories', () => {
      logExercise('Exercise without calories', 30); // null calories
      logExercise('Exercise with calories', 30, 300);
      
      const history = getExerciseHistory();
      assert.strictEqual(history.length, 1);
      assert.strictEqual(history[0].caloriesBurned, 300);
    });
  });

  describe('getAllExercises', () => {
    it('should return all exercises', () => {
      logExercise('Running', 30, 300);
      logExercise('Walking', 20, 100);
      
      const allExercises = getAllExercises();
      assert.strictEqual(allExercises.length, 2);
      assert.strictEqual(allExercises[0].description, 'Running');
      assert.strictEqual(allExercises[1].description, 'Walking');
    });
  });
});

describe('Exercise Chart', () => {
  describe('createExerciseChart', () => {
    it('should return message when no data', () => {
      const chart = createExerciseChart([]);
      assert.strictEqual(chart, 'No exercise data available');
    });

    it('should create chart with exercise data', () => {
      const exerciseData = [
        { date: '2023-12-01', caloriesBurned: 300, timestamp: '2023-12-01T12:00:00Z' },
        { date: '2023-12-02', caloriesBurned: 450, timestamp: '2023-12-02T12:00:00Z' },
        { date: '2023-12-03', caloriesBurned: 200, timestamp: '2023-12-03T12:00:00Z' }
      ];
      
      const chart = createExerciseChart(exerciseData);
      assert.ok(chart.includes('Daily Calories Burned (Exercise)'));
      assert.ok(chart.includes('450'));
      assert.ok(chart.includes('200'));
      assert.ok(chart.includes('●'));
      assert.ok(chart.includes('Average:'));
    });

    it('should handle single data point', () => {
      const exerciseData = [
        { date: '2023-12-01', caloriesBurned: 300, timestamp: '2023-12-01T12:00:00Z' }
      ];
      
      const chart = createExerciseChart(exerciseData);
      assert.ok(chart.includes('Daily Calories Burned (Exercise)'));
      assert.ok(chart.includes('300'));
      assert.ok(chart.includes('Average: 300'));
    });

    it('should calculate correct average', () => {
      const exerciseData = [
        { date: '2023-12-01', caloriesBurned: 200, timestamp: '2023-12-01T12:00:00Z' },
        { date: '2023-12-02', caloriesBurned: 400, timestamp: '2023-12-02T12:00:00Z' },
        { date: '2023-12-03', caloriesBurned: 300, timestamp: '2023-12-03T12:00:00Z' }
      ];
      
      const chart = createExerciseChart(exerciseData);
      assert.ok(chart.includes('Average: 300 calories burned/day'));
    });
  });
});