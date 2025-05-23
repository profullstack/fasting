#!/usr/bin/env node

/**
 * API usage example for the Fasting App
 * Demonstrates programmatic usage of the Node.js module
 */

import { 
  startFast, 
  endFast, 
  getCurrentFast, 
  getFastHistory, 
  getFastStats,
  logMeal, 
  logDrink, 
  getTodaysEntries,
  logWeight, 
  getWeightHistory 
} from '../lib/index.js';

console.log('🔧 Fasting App - API Usage Example\n');

async function demonstrateAPI() {
  try {
    // Fast tracking
    console.log('📊 Fast Tracking API:');
    console.log('─'.repeat(30));
    
    // Check if there's already an ongoing fast
    let currentFast = getCurrentFast();
    if (currentFast) {
      console.log('⚠️  Found existing fast, ending it first...');
      const completedFast = endFast();
      console.log(`✅ Existing fast completed! Duration: ${completedFast.durationHours} hours`);
    }
    
    console.log('Starting a new fast...');
    const fastStart = startFast();
    console.log(`✅ Fast started at: ${new Date(fastStart).toLocaleString()}`);
    
    currentFast = getCurrentFast();
    console.log(`📍 Current fast ID: ${currentFast.id}`);
    
    // Simulate ending the fast after some time
    console.log('\nEnding the fast...');
    const completedFast = endFast();
    console.log(`✅ Fast completed! Duration: ${completedFast.durationHours} hours`);
    
    // Meal and drink logging
    console.log('\n🍽️  Meal & Drink Logging API:');
    console.log('─'.repeat(35));
    
    logMeal('Grilled salmon with vegetables', 420);
    console.log('✅ Logged meal: Grilled salmon with vegetables (420 cal)');
    
    logDrink('Green smoothie', 180);
    console.log('✅ Logged drink: Green smoothie (180 cal)');
    
    logMeal('Greek yogurt with berries', 150);
    console.log('✅ Logged meal: Greek yogurt with berries (150 cal)');
    
    const todaysEntries = getTodaysEntries();
    console.log(`\n📋 Today's entries: ${todaysEntries.length} items`);
    
    let totalCalories = 0;
    todaysEntries.forEach(entry => {
      const time = new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const type = entry.type === 'meal' ? '🍽️' : '🥤';
      console.log(`   ${time} ${type} ${entry.description} (${entry.calories} cal)`);
      totalCalories += entry.calories || 0;
    });
    console.log(`   Total calories: ${totalCalories}`);
    
    // Weight tracking
    console.log('\n⚖️  Weight Tracking API:');
    console.log('─'.repeat(30));
    
    logWeight(175.5);
    console.log('✅ Logged weight: 175.5 lbs');
    
    logWeight(175.2);
    console.log('✅ Logged weight: 175.2 lbs');
    
    logWeight(174.8);
    console.log('✅ Logged weight: 174.8 lbs');
    
    const weightHistory = getWeightHistory();
    console.log(`\n📈 Weight history: ${weightHistory.length} entries`);
    weightHistory.slice(-3).forEach(entry => {
      const date = new Date(entry.timestamp).toLocaleDateString();
      console.log(`   ${date}: ${entry.weight} lbs`);
    });
    
    // Fast statistics
    console.log('\n📊 Fast Statistics API:');
    console.log('─'.repeat(30));
    
    const fastStats = getFastStats();
    console.log(`Total completed fasts: ${fastStats.totalFasts}`);
    console.log(`Average duration: ${fastStats.averageDuration}h`);
    console.log(`Longest fast: ${fastStats.longestFast}h`);
    console.log(`Shortest fast: ${fastStats.shortestFast}h`);
    
    const fastHistory = getFastHistory();
    console.log(`\n📋 Fast history: ${fastHistory.length} completed fasts`);
    
    console.log('\n🎉 API demonstration completed!');
    console.log('\nThis example shows how to use the fasting app programmatically.');
    console.log('All functions return data that can be used in your own applications.');
    
  } catch (error) {
    console.error('❌ Error during API demonstration:', error.message);
    process.exit(1);
  }
}

demonstrateAPI();