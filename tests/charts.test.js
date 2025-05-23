import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createWeightChart, createFastChart, createSummaryTable } from '../lib/charts.js';

describe('Charts', () => {
  describe('createWeightChart', () => {
    it('should return message when no data', () => {
      const chart = createWeightChart([]);
      assert.strictEqual(chart, 'No weight data available');
    });

    it('should create chart with weight data', () => {
      const weightData = [
        { weight: 175, timestamp: '2023-12-01T10:00:00Z' },
        { weight: 174.5, timestamp: '2023-12-02T10:00:00Z' },
        { weight: 174, timestamp: '2023-12-03T10:00:00Z' }
      ];
      
      const chart = createWeightChart(weightData);
      assert.ok(chart.includes('Weight History (lbs)'));
      assert.ok(chart.includes('175.0'));
      assert.ok(chart.includes('174.0'));
      assert.ok(chart.includes('●'));
    });

    it('should handle single data point', () => {
      const weightData = [
        { weight: 175, timestamp: '2023-12-01T10:00:00Z' }
      ];
      
      const chart = createWeightChart(weightData);
      assert.ok(chart.includes('Weight History (lbs)'));
      assert.ok(chart.includes('175.0'));
    });
  });

  describe('createFastChart', () => {
    it('should return message when no data', () => {
      const chart = createFastChart([]);
      assert.strictEqual(chart, 'No completed fasts available');
    });

    it('should create chart with fast data', () => {
      const fastData = [
        { 
          startTime: '2023-12-01T18:00:00Z',
          endTime: '2023-12-02T10:00:00Z',
          durationHours: 16
        },
        { 
          startTime: '2023-12-02T20:00:00Z',
          endTime: '2023-12-03T14:00:00Z',
          durationHours: 18
        }
      ];
      
      const chart = createFastChart(fastData);
      assert.ok(chart.includes('Recent Fast Durations (hours)'));
      assert.ok(chart.includes('16h'));
      assert.ok(chart.includes('18h'));
      assert.ok(chart.includes('Target: 16h'));
      assert.ok(chart.includes('█'));
    });

    it('should limit to maxBars', () => {
      const fastData = Array.from({ length: 15 }, (_, i) => ({
        startTime: `2023-12-${String(i + 1).padStart(2, '0')}T18:00:00Z`,
        endTime: `2023-12-${String(i + 1).padStart(2, '0')}T10:00:00Z`,
        durationHours: 16 + i
      }));
      
      const chart = createFastChart(fastData, 60, 5);
      const lines = chart.split('\n');
      const dataLines = lines.filter(line => line.includes('│') && line.includes('h'));
      assert.ok(dataLines.length <= 5);
    });
  });

  describe('createSummaryTable', () => {
    it('should create comprehensive summary', () => {
      const data = {
        todaysEntries: [
          { 
            type: 'meal',
            description: 'Chicken salad',
            calories: 350,
            timestamp: '2023-12-01T12:00:00Z'
          }
        ],
        recentWeights: [
          { weight: 175, timestamp: '2023-12-01T10:00:00Z' },
          { weight: 174, timestamp: '2023-12-02T10:00:00Z' }
        ],
        fastStats: {
          totalFasts: 5,
          averageDuration: 16.2,
          longestFast: 18,
          shortestFast: 14
        },
        currentFast: {
          startTime: '2023-12-01T18:00:00Z'
        },
        recentFasts: []
      };
      
      const summary = createSummaryTable(data);
      assert.ok(summary.includes('FASTING APP SUMMARY'));
      assert.ok(summary.includes('CURRENT FAST STATUS'));
      assert.ok(summary.includes('FASTING'));
      assert.ok(summary.includes('TODAY\'S FOOD LOG'));
      assert.ok(summary.includes('Chicken salad'));
      assert.ok(summary.includes('350 cal'));
      assert.ok(summary.includes('FAST STATISTICS'));
      assert.ok(summary.includes('Total completed fasts: 5'));
      assert.ok(summary.includes('WEIGHT TRACKING'));
      assert.ok(summary.includes('174 lbs'));
      assert.ok(summary.includes('-1.0 lbs 📉'));
    });

    it('should handle no current fast', () => {
      const data = {
        todaysEntries: [],
        recentWeights: [],
        fastStats: { totalFasts: 0, averageDuration: 0, longestFast: 0, shortestFast: 0 },
        currentFast: null,
        recentFasts: []
      };
      
      const summary = createSummaryTable(data);
      assert.ok(summary.includes('Status: NOT FASTING'));
      assert.ok(summary.includes('Use "fasting fast start"'));
    });

    it('should show 16h target reached', () => {
      const startTime = new Date('2023-12-01T18:00:00Z');
      const now = new Date('2023-12-02T12:00:00Z'); // 18 hours later
      
      // Mock Date.now for this test
      const originalNow = Date.now;
      Date.now = () => now.getTime();
      
      const data = {
        todaysEntries: [],
        recentWeights: [],
        fastStats: { totalFasts: 0, averageDuration: 0, longestFast: 0, shortestFast: 0 },
        currentFast: { startTime: startTime.toISOString() },
        recentFasts: []
      };
      
      const summary = createSummaryTable(data);
      assert.ok(summary.includes('16-hour target reached'));
      
      // Restore original Date.now
      Date.now = originalNow;
    });
  });
});