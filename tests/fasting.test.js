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
    it('should log a meal with calories', async () => {
      await logMeal('Chicken breast', 300);
      const entries = await getTodaysEntries();
      assert.strictEqual(entries.length, 1);
      assert.strictEqual(entries[0].type, 'meal');
      assert.strictEqual(entries[0].description, 'Chicken breast');
      assert.strictEqual(entries[0].calories, 300);
    });

    it('should log a meal with null calories when not specified', async () => {
      await logMeal('Salad');
      const entries = await getTodaysEntries();
      assert.strictEqual(entries.length, 1);
      assert.strictEqual(entries[0].type, 'meal');
      assert.strictEqual(entries[0].description, 'Salad');
      assert.strictEqual(entries[0].calories, null);
    });
  });

  describe('logDrink', () => {
    it('should log a drink with calories', async () => {
      await logDrink('Orange juice', 120);
      const entries = await getTodaysEntries();
      assert.strictEqual(entries.length, 1);
      assert.strictEqual(entries[0].type, 'drink');
      assert.strictEqual(entries[0].description, 'Orange juice');
      assert.strictEqual(entries[0].calories, 120);
    });

    it('should log a drink with null calories when not specified', async () => {
      await logDrink('Water');
      const entries = await getTodaysEntries();
      assert.strictEqual(entries.length, 1);
      assert.strictEqual(entries[0].type, 'drink');
      assert.strictEqual(entries[0].description, 'Water');
      assert.strictEqual(entries[0].calories, null);
    });
  });

  describe('getTodaysEntries', () => {
    it('should return empty array when no entries', async () => {
      const entries = await getTodaysEntries();
      assert.ok(Array.isArray(entries));
      assert.strictEqual(entries.length, 0);
    });

    it('should return only today\'s entries', async () => {
      await logMeal('Breakfast', 400);
      await logDrink('Coffee', 50);
      await logMeal('Lunch', 600);
      
      const entries = await getTodaysEntries();
      assert.strictEqual(entries.length, 3);
      assert.strictEqual(entries[0].description, 'Breakfast');
      assert.strictEqual(entries[1].description, 'Coffee');
      assert.strictEqual(entries[2].description, 'Lunch');
    });

    it('should maintain chronological order', async () => {
      await logMeal('First meal', 300);
      await logMeal('Second meal', 400);
      
      const entries = await getTodaysEntries();
      assert.strictEqual(entries.length, 2);
      assert.strictEqual(entries[0].description, 'First meal');
      assert.strictEqual(entries[1].description, 'Second meal');
      
      // Check timestamps are in order
      const time1 = new Date(entries[0].timestamp);
      const time2 = new Date(entries[1].timestamp);
      assert.ok(time1 <= time2);
    });
  });

  describe('Multiple entries', () => {
    it('should handle mixed meals and drinks', async () => {
      await logMeal('Breakfast', 400);
      await logDrink('Coffee', 50);
      await logMeal('Snack', 200);
      await logDrink('Water', 0);
      await logMeal('Lunch', 600);
      
      const entries = await getTodaysEntries();
      assert.strictEqual(entries.length, 5);
      
      // Check types
      assert.strictEqual(entries[0].type, 'meal');
      assert.strictEqual(entries[1].type, 'drink');
      assert.strictEqual(entries[2].type, 'meal');
      assert.strictEqual(entries[3].type, 'drink');
      assert.strictEqual(entries[4].type, 'meal');
    });
  });
});