import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Set test environment
const testConfigDir = join(tmpdir(), 'fasting-test-' + Date.now());
process.env.FASTING_TEST_CONFIG_DIR = testConfigDir;

// Import after setting environment
const { logMeal, logDrink, getTodaysEntries } = await import('../lib/fasting.js');

describe('Fasting (Meals & Drinks)', () => {
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

  describe('logMeal', () => {
    it('should log a meal with calories', () => {
      logMeal('Chicken salad', 350);
      
      const entries = getTodaysEntries();
      assert.strictEqual(entries.length, 1);
      assert.strictEqual(entries[0].type, 'meal');
      assert.strictEqual(entries[0].description, 'Chicken salad');
      assert.strictEqual(entries[0].calories, 350);
      assert.ok(entries[0].timestamp);
    });

    it('should log a meal with null calories when not specified', () => {
      logMeal('Sandwich');
      
      const entries = getTodaysEntries();
      assert.strictEqual(entries.length, 1);
      assert.strictEqual(entries[0].calories, null); // No default in lib layer
    });
  });

  describe('logDrink', () => {
    it('should log a drink with calories', () => {
      logDrink('Orange juice', 120);
      
      const entries = getTodaysEntries();
      assert.strictEqual(entries.length, 1);
      assert.strictEqual(entries[0].type, 'drink');
      assert.strictEqual(entries[0].description, 'Orange juice');
      assert.strictEqual(entries[0].calories, 120);
      assert.ok(entries[0].timestamp);
    });

    it('should log a drink with null calories when not specified', () => {
      logDrink('Water');
      
      const entries = getTodaysEntries();
      assert.strictEqual(entries.length, 1);
      assert.strictEqual(entries[0].calories, null); // No default in lib layer
    });
  });

  describe('getTodaysEntries', () => {
    it('should return empty array when no entries', () => {
      const entries = getTodaysEntries();
      assert.ok(Array.isArray(entries));
      assert.strictEqual(entries.length, 0);
    });

    it('should return only today\'s entries', () => {
      // Log some entries
      logMeal('Breakfast', 300);
      logDrink('Coffee', 50);
      logMeal('Lunch', 400);
      
      const entries = getTodaysEntries();
      assert.strictEqual(entries.length, 3);
      
      // Check that all entries are from today
      const today = new Date().toDateString();
      entries.forEach(entry => {
        const entryDate = new Date(entry.timestamp).toDateString();
        assert.strictEqual(entryDate, today);
      });
    });

    it('should maintain chronological order', () => {
      logMeal('First meal', 300);
      logMeal('Second meal', 400);
      
      const entries = getTodaysEntries();
      assert.strictEqual(entries.length, 2);
      
      const firstTime = new Date(entries[0].timestamp).getTime();
      const secondTime = new Date(entries[1].timestamp).getTime();
      assert.ok(firstTime <= secondTime);
    });
  });

  describe('Multiple entries', () => {
    it('should handle mixed meals and drinks', () => {
      logMeal('Breakfast', 350);
      logDrink('Coffee', 25);
      logMeal('Snack', 150);
      logDrink('Water', 0);
      logMeal('Lunch', 450);
      
      const entries = getTodaysEntries();
      assert.strictEqual(entries.length, 5);
      
      const meals = entries.filter(e => e.type === 'meal');
      const drinks = entries.filter(e => e.type === 'drink');
      
      assert.strictEqual(meals.length, 3);
      assert.strictEqual(drinks.length, 2);
      
      // Check total calories
      const totalCalories = entries.reduce((sum, entry) => sum + entry.calories, 0);
      assert.strictEqual(totalCalories, 975);
    });
  });
});