#!/usr/bin/env node

import { Command } from 'commander';
import prompts from 'prompts';
import { logMeal, logDrink, getTodaysEntries, getCalorieHistory, logWeight, getWeightHistory, startFast, endFast, getCurrentFast, getFastHistory, getFastStats, logExercise, getTodaysExercises, getExerciseHistory } from '../lib/index.js';
import { estimateCalories } from '../lib/calorie-estimator.js';
import { estimateExerciseCalories } from '../lib/exercise-estimator.js';
import { setOpenAIKey, getOpenAIKey, getConfigPath, cleanData, getConfigDir, setSupabaseConfig, getSupabaseConfig, setStorageMode, getStorageMode, isSupabaseConfigured } from '../lib/config.js';
import { createWeightChart, createFastChart, createCalorieChart, createExerciseChart, createSummaryTable } from '../lib/charts.js';
import { initializeSupabaseTables, testSupabaseConnection } from '../lib/supabase.js';

const program = new Command();

program
  .command('meal <description>')
  .option('-c, --calories <number>', 'Override automatic calorie estimation with manual value')
  .option('-s, --size <size>', 'Specify portion size (e.g., "large", "2 cups", "8oz")')
  .action(async (description, { calories, size }) => {
    let finalCalories = null;
    
    if (calories) {
      finalCalories = Number(calories);
      console.log(`Using manual calorie count: ${finalCalories}`);
    } else {
      const sizeText = size ? ` (${size})` : '';
      console.log(`Estimating calories for: ${description}${sizeText}...`);
      finalCalories = await estimateCalories(description, 'meal', size);
      console.log(`Estimated calories: ${finalCalories}`);
    }
    
    const sizeInfo = size ? ` (${size})` : '';
    await logMeal(description, finalCalories);
    console.log(`Meal logged: ${description}${sizeInfo} (${finalCalories} calories)`);
  });

program
  .command('drink <description>')
  .option('-c, --calories <number>', 'Override automatic calorie estimation with manual value')
  .option('-s, --size <size>', 'Specify portion size (e.g., "32oz", "large", "2 cups")')
  .action(async (description, { calories, size }) => {
    let finalCalories = null;
    
    if (calories) {
      finalCalories = Number(calories);
      console.log(`Using manual calorie count: ${finalCalories}`);
    } else {
      const sizeText = size ? ` (${size})` : '';
      console.log(`Estimating calories for: ${description}${sizeText}...`);
      finalCalories = await estimateCalories(description, 'drink', size);
      console.log(`Estimated calories: ${finalCalories}`);
    }
    
    const sizeInfo = size ? ` (${size})` : '';
    await logDrink(description, finalCalories);
    console.log(`Drink logged: ${description}${sizeInfo} (${finalCalories} calories)`);
  });

program
  .command('weight <value>')
  .action(async (value) => {
    await logWeight(Number(value));
    console.log(`Weight logged: ${value} lbs`);
  });

program
  .command('exercise <description> <duration>')
  .option('-c, --calories <number>', 'Override automatic calorie burn estimation with manual value')
  .description('Log exercise with duration in minutes')
  .action(async (description, duration, { calories }) => {
    const durationNum = Number(duration);
    let finalCalories = null;
    
    if (calories) {
      finalCalories = Number(calories);
      console.log(`Using manual calorie burn count: ${finalCalories}`);
    } else {
      console.log(`Estimating calories burned for: ${description} (${durationNum} minutes)...`);
      finalCalories = await estimateExerciseCalories(description, durationNum);
      console.log(`Estimated calories burned: ${finalCalories}`);
    }
    
    await logExercise(description, durationNum, finalCalories);
    console.log(`Exercise logged: ${description} (${durationNum} min, ${finalCalories} calories burned)`);
  });

program
  .command('fast <action>')
  .option('-t, --time <time>', 'Specify start/end time (e.g., "2023-12-01 18:00" or "18:00")')
  .description('Start or end a fast')
  .action(async (action, { time }) => {
    try {
      if (action === 'start') {
        let startTime = null;
        if (time) {
          // Parse time - if no date provided, use today
          if (time.includes(' ') || time.includes('-')) {
            startTime = time;
          } else {
            // Just time provided, use today's date
            const today = new Date().toISOString().split('T')[0];
            startTime = `${today} ${time}`;
          }
        }
        
        const timestamp = await startFast(startTime);
        const displayTime = new Date(timestamp).toLocaleString();
        console.log(`✅ Fast started at ${displayTime}`);
        console.log('💡 Use "fasting fast end" to complete your fast');
        
      } else if (action === 'end') {
        let endTime = null;
        if (time) {
          if (time.includes(' ') || time.includes('-')) {
            endTime = time;
          } else {
            const today = new Date().toISOString().split('T')[0];
            endTime = `${today} ${time}`;
          }
        }
        
        const completedFast = await endFast(endTime);
        const displayTime = new Date(completedFast.endTime).toLocaleString();
        console.log(`✅ Fast completed at ${displayTime}`);
        console.log(`⏱️  Duration: ${completedFast.durationHours} hours`);
        
        if (completedFast.durationHours >= 16) {
          console.log('🎉 Congratulations! You achieved your 16-hour fasting goal!');
        } else {
          console.log('💪 Great job! Try for 16+ hours next time for optimal benefits.');
        }
        
      } else {
        console.error('❌ Invalid action. Use "start" or "end"');
        process.exit(1);
      }
    } catch (error) {
      console.error(`❌ ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('summary')
  .option('--weight-chart', 'Show weight chart')
  .option('--fast-chart', 'Show fast duration chart')
  .option('--calorie-chart', 'Show daily calorie chart')
  .option('--exercise-chart', 'Show daily exercise calories burned chart')
  .description('Show comprehensive summary with charts')
  .action(async ({ weightChart, fastChart, calorieChart, exerciseChart }) => {
    const todaysEntries = await getTodaysEntries();
    const todaysExercises = await getTodaysExercises();
    const recentWeights = await getWeightHistory();
    const calorieHistory = await getCalorieHistory();
    const exerciseHistory = await getExerciseHistory();
    const fastStats = await getFastStats();
    const currentFast = await getCurrentFast();
    const recentFasts = await getFastHistory();

    // Show main summary
    const summaryData = {
      todaysEntries,
      todaysExercises,
      recentWeights,
      fastStats,
      currentFast,
      recentFasts
    };
    
    console.log(createSummaryTable(summaryData));

    // Show charts if requested
    if (weightChart && recentWeights.length > 0) {
      console.log('\n');
      console.log(createWeightChart(recentWeights));
    }

    if (fastChart && recentFasts.length > 0) {
      console.log('\n');
      console.log(createFastChart(recentFasts));
    }

    if (calorieChart && calorieHistory.length > 0) {
      console.log('\n');
      console.log(createCalorieChart(calorieHistory));
    }

    if (exerciseChart && exerciseHistory.length > 0) {
      console.log('\n');
      console.log(createExerciseChart(exerciseHistory));
    }

    // Show charts automatically if no specific chart requested and data exists
    if (!weightChart && !fastChart && !calorieChart && !exerciseChart) {
      if (recentWeights.length > 1) {
        console.log('\n');
        console.log(createWeightChart(recentWeights));
      }
      
      if (recentFasts.length > 0) {
        console.log('\n');
        console.log(createFastChart(recentFasts));
      }

      if (calorieHistory.length > 1) {
        console.log('\n');
        console.log(createCalorieChart(calorieHistory));
      }

      if (exerciseHistory.length > 1) {
        console.log('\n');
        console.log(createExerciseChart(exerciseHistory));
      }
    }
  });

program
  .command('setup')
  .option('--supabase', 'Configure Supabase cloud storage instead of local files')
  .option('--local', 'Switch to local file storage')
  .description('Configure OpenAI API key and optionally Supabase cloud storage')
  .action(async ({ supabase, local }) => {
    console.log('🔧 Fasting App Setup\n');
    
    if (local) {
      setStorageMode('local');
      console.log('✅ Switched to local file storage.');
      console.log(`📁 Data will be stored in: ${getConfigDir()}`);
      return;
    }
    
    if (supabase) {
      console.log('📊 Supabase Cloud Storage Setup');
      console.log('This will configure cloud storage for your fasting data.\n');
      
      const currentConfig = getSupabaseConfig();
      if (isSupabaseConfigured()) {
        console.log('✅ Supabase is already configured.');
        const { reconfigure } = await prompts({
          type: 'confirm',
          name: 'reconfigure',
          message: 'Do you want to update your Supabase configuration?',
          initial: false
        });
        
        if (!reconfigure) {
          console.log('Setup cancelled.');
          return;
        }
      }
      
      console.log('You need a Supabase project with the following configuration:');
      console.log('Get these values from: https://supabase.com/dashboard\n');
      
      const supabaseConfig = await prompts([
        {
          type: 'text',
          name: 'url',
          message: 'Supabase URL:',
          initial: currentConfig.url || '',
          validate: value => value.length > 0 ? true : 'URL cannot be empty'
        },
        {
          type: 'password',
          name: 'serviceRoleKey',
          message: 'Supabase Service Role Key:',
          initial: currentConfig.serviceRoleKey || '',
          validate: value => value.length > 0 ? true : 'Service role key cannot be empty'
        }
      ]);
      
      if (!supabaseConfig.url || !supabaseConfig.serviceRoleKey) {
        console.log('Setup cancelled.');
        return;
      }
      
      try {
        console.log('\n🔄 Testing Supabase connection...');
        setSupabaseConfig(supabaseConfig);
        
        console.log('\n🗄️  Initializing database tables...');
        await initializeSupabaseTables();
        console.log('✅ Database tables initialized!');
        
        setStorageMode('supabase');
        console.log(`\n✅ Supabase configuration saved to: ${getConfigPath()}`);
        console.log('🎉 Cloud storage setup complete!');
        console.log('\n💡 Your data will now be stored in Supabase cloud storage.');
        
      } catch (error) {
        console.error('❌ Error setting up Supabase:', error.message);
        process.exit(1);
      }
    } else {
      // OpenAI API key setup
      const currentKey = getOpenAIKey();
      if (currentKey) {
        console.log('✅ OpenAI API key is already configured.');
        const { reconfigure } = await prompts({
          type: 'confirm',
          name: 'reconfigure',
          message: 'Do you want to update your API key?',
          initial: false
        });
        
        if (!reconfigure) {
          console.log('Setup cancelled.');
          return;
        }
      }
      
      console.log('To use automatic calorie estimation, you need an OpenAI API key.');
      console.log('Get one at: https://platform.openai.com/api-keys\n');
      
      const { apiKey } = await prompts({
        type: 'password',
        name: 'apiKey',
        message: 'Enter your OpenAI API key:',
        validate: value => value.length > 0 ? true : 'API key cannot be empty'
      });
      
      if (!apiKey) {
        console.log('Setup cancelled.');
        return;
      }
      
      try {
        setOpenAIKey(apiKey);
        console.log(`\n✅ API key saved to: ${getConfigPath()}`);
        console.log('🎉 Setup complete! You can now use automatic calorie estimation.');
        console.log('\nTry it out:');
        console.log('  fasting meal "Grilled chicken" --size "6oz"');
        console.log('  fasting drink "Orange juice" --size "16oz"');
        console.log('  fasting exercise "Running" 30');
        
        const currentMode = getStorageMode();
        console.log(`\n📊 Current storage mode: ${currentMode}`);
        console.log('\nTo switch storage modes:');
        console.log('  fasting setup --local     # Use local files');
        console.log('  fasting setup --supabase  # Use Supabase cloud storage');
        
      } catch (error) {
        console.error('❌ Error saving API key:', error.message);
        process.exit(1);
      }
    }
  });

program
  .command('clean')
  .description('Delete all stored data (meals, weight, fasts, exercises)')
  .option('--config', 'Also delete configuration (API key)')
  .action(async ({ config }) => {
    console.log('🗑️  Clean Data\n');
    
    if (config) {
      console.log('⚠️  This will delete ALL data including your API key configuration.');
    } else {
      console.log('⚠️  This will delete all meals, weight, fast, and exercise data.');
      console.log('Your API key configuration will be preserved.');
    }
    
    const { confirm } = await prompts({
      type: 'confirm',
      name: 'confirm',
      message: 'Are you sure you want to proceed?',
      initial: false
    });
    
    if (!confirm) {
      console.log('Clean cancelled.');
      return;
    }
    
    try {
      const { clearAllData } = await import('../lib/storage.js');
      await clearAllData();
      
      if (config) {
        cleanData(false); // Also clean config
        console.log('✅ All data and configuration deleted.');
        console.log(`📁 Data directory: ${getConfigDir()}`);
        console.log('\nTo start fresh, run: fasting setup');
      } else {
        console.log('✅ Meals, weight, fast, and exercise data deleted.');
        console.log('Your API key configuration has been preserved.');
        console.log('\nYou can start logging new data immediately.');
      }
    } catch (error) {
      console.error('❌ Error cleaning data:', error.message);
      process.exit(1);
    }
  });

program.parse(process.argv);
