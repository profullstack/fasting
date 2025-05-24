#!/usr/bin/env node

import { Command } from 'commander';
import prompts from 'prompts';
import { logMeal, logDrink, getTodaysEntries, getCalorieHistory, getWeightHistory, startFast, endFast, getCurrentFast, getFastHistory, getFastStats, logExercise, getTodaysExercises, getExerciseHistory } from '../lib/index.js';
import { logWeight } from '../lib/weight.js';
import { estimateCalories } from '../lib/calorie-estimator.js';
import { estimateExerciseCalories } from '../lib/exercise-estimator.js';
import { setOpenAIKey, getOpenAIKey, getConfigPath, cleanData, getConfigDir, setSupabaseConfig, getSupabaseConfig, setStorageMode, getStorageMode, isSupabaseConfigured, getWeightUnit, setWeightUnit, getUnitSystem, setUnitSystem, getTimezone, setTimezone } from '../lib/config.js';
import { getSizeExamples } from '../lib/units.js';
import { createWeightChart, createFastChart, createCalorieChart, createExerciseChart, createSummaryTable } from '../lib/charts.js';
import { initializeSupabaseTables, testSupabaseConnection } from '../lib/supabase.js';
import { generateMealRecommendations, formatRecommendations } from '../lib/meal-recommender.js';

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
      try {
        finalCalories = await estimateCalories(description, 'meal', size);
        console.log(`Estimated calories: ${finalCalories}`);
      } catch (error) {
        console.error(`❌ ${error.message}`);
        const unitSystem = getUnitSystem();
        const examples = getSizeExamples('weight');
        console.log('\n💡 Size examples for your unit system:');
        examples.forEach(example => console.log(`  --size "${example}"`));
        process.exit(1);
      }
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
      try {
        finalCalories = await estimateCalories(description, 'drink', size);
        console.log(`Estimated calories: ${finalCalories}`);
      } catch (error) {
        console.error(`❌ ${error.message}`);
        const unitSystem = getUnitSystem();
        const examples = getSizeExamples('volume');
        console.log('\n💡 Size examples for your unit system:');
        examples.forEach(example => console.log(`  --size "${example}"`));
        process.exit(1);
      }
    }
    
    const sizeInfo = size ? ` (${size})` : '';
    await logDrink(description, finalCalories);
    console.log(`Drink logged: ${description}${sizeInfo} (${finalCalories} calories)`);
  });

program
  .command('weight <value>')
  .description('Log your weight with optional units (e.g., "305.8lbs", "138.5kg", "305.8")')
  .action(async (value) => {
    try {
      const result = await logWeight(value);
      console.log(`Weight logged: ${result.stored}`);
      if (result.original !== result.stored) {
        console.log(`(converted from ${result.original})`);
      }
    } catch (error) {
      console.error(`❌ ${error.message}`);
      console.log('\n💡 Examples:');
      console.log('  fasting weight 305.8lbs');
      console.log('  fasting weight 138.5kg');
      console.log('  fasting weight 305.8    # Uses your preferred unit');
      console.log('  fasting weight 12oz');
      process.exit(1);
    }
  });

program
  .command('exercise <description> <duration>')
  .option('-c, --calories <number>', 'Override automatic calorie burn estimation with manual value')
  .description('Log exercise with duration (e.g., "30", "30 minutes", "1.5 hours")')
  .action(async (description, duration, { calories }) => {
    // Parse duration - handle minutes, hours, and plain numbers
    let durationInMinutes;
    if (typeof duration === 'string') {
      // Extract number and unit from strings like "30 minutes", "1.5 hours", "45min", "2h", etc.
      const match = duration.match(/(\d+(?:\.\d+)?)\s*(minutes?|mins?|hours?|hrs?|h|m)?/i);
      if (match) {
        const value = Number(match[1]);
        const unit = match[2] ? match[2].toLowerCase() : 'minutes'; // Default to minutes
        
        // Convert to minutes
        if (unit.startsWith('h')) { // hours, hour, hrs, hr, h
          durationInMinutes = value * 60;
        } else { // minutes, minute, mins, min, m, or no unit
          durationInMinutes = value;
        }
      } else {
        console.error(`❌ Invalid duration format: "${duration}". Please use formats like "30", "30 minutes", "1.5 hours"`);
        process.exit(1);
      }
    } else {
      durationInMinutes = Number(duration);
    }
    
    if (isNaN(durationInMinutes) || durationInMinutes <= 0) {
      console.error(`❌ Invalid duration: "${duration}". Please provide a positive number.`);
      process.exit(1);
    }
    
    // Round to reasonable precision
    durationInMinutes = Math.round(durationInMinutes * 10) / 10;
    
    let finalCalories = null;
    
    if (calories) {
      finalCalories = Number(calories);
      console.log(`Using manual calorie burn count: ${finalCalories}`);
    } else {
      console.log(`Estimating calories burned for: ${description} (${durationInMinutes} minutes)...`);
      try {
        finalCalories = await estimateExerciseCalories(description, durationInMinutes);
        console.log(`Estimated calories burned: ${finalCalories}`);
      } catch (error) {
        console.error(`❌ Error estimating calories: ${error.message}`);
        console.log('Using fallback estimate...');
        finalCalories = Math.round(durationInMinutes * 5); // 5 calories per minute fallback
        console.log(`Estimated calories burned: ${finalCalories}`);
      }
    }
    
    await logExercise(description, durationInMinutes, finalCalories);
    console.log(`Exercise logged: ${description} (${durationInMinutes} min, ${finalCalories} calories burned)`);
  });

program
  .command('recommend [preference]')
  .option('-t, --type <type>', 'Meal type (breakfast, lunch, dinner, snack)')
  .option('-c, --calories <number>', 'Target calories for the meal')
  .option('-d, --dietary <restrictions>', 'Dietary restrictions (vegetarian, vegan, gluten-free, etc.)')
  .description('Get AI-powered meal recommendations based on your preferences and current status')
  .action(async (preference, { type, calories, dietary }) => {
    console.log('🤖 Generating personalized meal recommendations...\n');
    
    try {
      const options = {};
      if (type) options.mealType = type;
      if (calories) options.calorieTarget = Number(calories);
      if (dietary) options.dietaryRestrictions = dietary;
      
      const recommendations = await generateMealRecommendations(preference || '', options);
      const formattedOutput = formatRecommendations(recommendations);
      
      console.log(formattedOutput);
      
    } catch (error) {
      console.error(`❌ ${error.message}`);
      
      if (error.message.includes('OpenAI API key')) {
        console.log('\n💡 To use AI recommendations, run: fasting setup');
      } else {
        console.log('\n💡 Here are some general healthy meal ideas:');
        console.log('• Grilled chicken with vegetables');
        console.log('• Quinoa salad with mixed greens');
        console.log('• Salmon with sweet potato');
        console.log('• Greek yogurt with berries and nuts');
        console.log('• Vegetable stir-fry with brown rice');
      }
      
      process.exit(1);
    }
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
  .option('--weight-unit', 'Configure weight unit preference (lbs or kg)')
  .option('--units', 'Configure unit system preference (imperial or metric)')
  .option('--timezone', 'Configure timezone preference')
  .description('Configure OpenAI API key, unit systems, timezone, and optionally Supabase cloud storage')
  .action(async ({ supabase, local, weightUnit, units, timezone }) => {
    console.log('🔧 Fasting App Setup\n');
    
    if (local) {
      setStorageMode('local');
      console.log('✅ Switched to local file storage.');
      console.log(`📁 Data will be stored in: ${getConfigDir()}`);
      return;
    }
    
    if (units) {
      console.log('📏 Unit System Configuration\n');
      
      const currentSystem = getUnitSystem();
      const currentWeightUnit = getWeightUnit();
      console.log(`Current unit system: ${currentSystem}`);
      console.log(`Current weight unit: ${currentWeightUnit}`);
      
      const { newSystem } = await prompts({
        type: 'select',
        name: 'newSystem',
        message: 'Choose your preferred unit system:',
        choices: [
          { title: 'Imperial (lbs, oz, fl oz, cups) - US Standard', value: 'imperial' },
          { title: 'Metric (kg, g, ml, l) - International Standard', value: 'metric' }
        ],
        initial: currentSystem === 'metric' ? 1 : 0
      });
      
      if (!newSystem) {
        console.log('Setup cancelled.');
        return;
      }
      
      setUnitSystem(newSystem);
      console.log(`✅ Unit system set to: ${newSystem}`);
      console.log(`✅ Weight unit automatically set to: ${newSystem === 'metric' ? 'kg' : 'lbs'}`);
      
      console.log('\n💡 Examples:');
      if (newSystem === 'imperial') {
        console.log('  Weight: fasting weight 305.8lbs');
        console.log('  Meals:  fasting meal "Chicken breast" --size "6oz"');
        console.log('  Drinks: fasting drink "Orange juice" --size "16oz"');
      } else {
        console.log('  Weight: fasting weight 138.5kg');
        console.log('  Meals:  fasting meal "Chicken breast" --size "150g"');
        console.log('  Drinks: fasting drink "Orange juice" --size "500ml"');
      }
      return;
    }
    
    if (weightUnit) {
      console.log('⚖️  Weight Unit Configuration\n');
      
      const currentUnit = getWeightUnit();
      console.log(`Current weight unit: ${currentUnit}`);
      
      const { newUnit } = await prompts({
        type: 'select',
        name: 'newUnit',
        message: 'Choose your preferred weight unit:',
        choices: [
          { title: 'Pounds (lbs) - Imperial', value: 'lbs' },
          { title: 'Kilograms (kg) - Metric', value: 'kg' }
        ],
        initial: currentUnit === 'kg' ? 1 : 0
      });
      
      if (!newUnit) {
        console.log('Setup cancelled.');
        return;
      }
      
      setWeightUnit(newUnit);
      console.log(`✅ Weight unit set to: ${newUnit}`);
      console.log('\n💡 Examples:');
      if (newUnit === 'lbs') {
        console.log('  fasting weight 305.8lbs');
        console.log('  fasting weight 305.8     # Will use lbs');
        console.log('  fasting weight 138.5kg   # Will convert to lbs');
      } else {
        console.log('  fasting weight 138.5kg');
        console.log('  fasting weight 138.5     # Will use kg');
        console.log('  fasting weight 305.8lbs  # Will convert to kg');
      }
      return;
    }
    
    if (timezone) {
      console.log('🌍 Timezone Configuration\n');
      
      const currentTimezone = getTimezone();
      console.log(`Current timezone: ${currentTimezone}`);
      
      // Get common timezones
      const commonTimezones = [
        'America/New_York',
        'America/Chicago',
        'America/Denver',
        'America/Los_Angeles',
        'America/Phoenix',
        'Europe/London',
        'Europe/Paris',
        'Europe/Berlin',
        'Asia/Tokyo',
        'Asia/Shanghai',
        'Asia/Kolkata',
        'Australia/Sydney',
        'UTC'
      ];
      
      const { useCommon } = await prompts({
        type: 'confirm',
        name: 'useCommon',
        message: 'Would you like to choose from common timezones?',
        initial: true
      });
      
      let newTimezone;
      
      if (useCommon) {
        const { selectedTimezone } = await prompts({
          type: 'select',
          name: 'selectedTimezone',
          message: 'Choose your timezone:',
          choices: commonTimezones.map(tz => ({
            title: `${tz} (${new Date().toLocaleString('en-US', { timeZone: tz, timeZoneName: 'short' })})`,
            value: tz
          })),
          initial: commonTimezones.indexOf(currentTimezone) >= 0 ? commonTimezones.indexOf(currentTimezone) : 0
        });
        newTimezone = selectedTimezone;
      } else {
        const { customTimezone } = await prompts({
          type: 'text',
          name: 'customTimezone',
          message: 'Enter timezone (e.g., America/New_York, Europe/London):',
          initial: currentTimezone,
          validate: value => {
            try {
              new Intl.DateTimeFormat('en-US', { timeZone: value });
              return true;
            } catch {
              return 'Invalid timezone. Use format like America/New_York or Europe/London';
            }
          }
        });
        newTimezone = customTimezone;
      }
      
      if (!newTimezone) {
        console.log('Setup cancelled.');
        return;
      }
      
      try {
        setTimezone(newTimezone);
        console.log(`✅ Timezone set to: ${newTimezone}`);
        
        const now = new Date();
        const localTime = now.toLocaleString('en-US', { timeZone: newTimezone });
        console.log(`🕐 Current time in ${newTimezone}: ${localTime}`);
        
        console.log('\n💡 This affects how "today\'s" data is calculated for meals, exercises, and summaries.');
      } catch (error) {
        console.error(`❌ Error setting timezone: ${error.message}`);
        process.exit(1);
      }
      return;
    }
    
    if (supabase) {
      console.log('� Supabase Cloud Storage Setup');
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
      let apiKeyConfigured = !!currentKey;
      
      if (currentKey) {
        console.log('✅ OpenAI API key is already configured.');
        const { reconfigure } = await prompts({
          type: 'confirm',
          name: 'reconfigure',
          message: 'Do you want to update your API key?',
          initial: false
        });
        
        if (!reconfigure) {
          // Skip API key setup but continue to unit system setup
          apiKeyConfigured = true;
        } else {
          apiKeyConfigured = false; // Will configure new API key
        }
      }
      
      if (!apiKeyConfigured) {
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
          console.log('🎉 OpenAI API key setup complete!');
        } catch (error) {
          console.error('❌ Error saving API key:', error.message);
          process.exit(1);
        }
      }
      
      // Now prompt for unit system configuration (for both new and existing API key users)
      console.log('\n📏 Unit System Configuration\n');
      
      const currentSystem = getUnitSystem();
      const currentWeightUnit = getWeightUnit();
      console.log(`Current unit system: ${currentSystem}`);
      console.log(`Current weight unit: ${currentWeightUnit}`);
      
      const { configureUnits } = await prompts({
        type: 'confirm',
        name: 'configureUnits',
        message: 'Would you like to configure your unit system preference?',
        initial: true
      });
      
      if (configureUnits) {
        const { newSystem } = await prompts({
          type: 'select',
          name: 'newSystem',
          message: 'Choose your preferred unit system:',
          choices: [
            { title: 'Imperial (lbs, oz, fl oz, cups) - US Standard', value: 'imperial' },
            { title: 'Metric (kg, g, ml, l) - International Standard', value: 'metric' }
          ],
          initial: currentSystem === 'metric' ? 1 : 0
        });
        
        if (newSystem) {
          setUnitSystem(newSystem);
          console.log(`✅ Unit system set to: ${newSystem}`);
          console.log(`✅ Weight unit automatically set to: ${newSystem === 'metric' ? 'kg' : 'lbs'}`);
          
          console.log('\n💡 Examples:');
          if (newSystem === 'imperial') {
            console.log('  Weight: fasting weight 305.8lbs');
            console.log('  Meals:  fasting meal "Chicken breast" --size "6oz"');
            console.log('  Drinks: fasting drink "Orange juice" --size "16oz"');
          } else {
            console.log('  Weight: fasting weight 138.5kg');
            console.log('  Meals:  fasting meal "Chicken breast" --size "150g"');
            console.log('  Drinks: fasting drink "Orange juice" --size "500ml"');
          }
        }
      }
      
      // Now prompt for timezone configuration (for both new and existing users)
      console.log('\n🌍 Timezone Configuration\n');
      
      const currentTimezone = getTimezone();
      console.log(`Current timezone: ${currentTimezone}`);
      
      const { configureTimezone } = await prompts({
        type: 'confirm',
        name: 'configureTimezone',
        message: 'Would you like to configure your timezone preference?',
        initial: true
      });
      
      if (configureTimezone) {
        // Get common timezones
        const commonTimezones = [
          'America/New_York',
          'America/Chicago',
          'America/Denver',
          'America/Los_Angeles',
          'America/Phoenix',
          'Europe/London',
          'Europe/Paris',
          'Europe/Berlin',
          'Asia/Tokyo',
          'Asia/Shanghai',
          'Asia/Kolkata',
          'Australia/Sydney',
          'UTC'
        ];
        
        const { useCommon } = await prompts({
          type: 'confirm',
          name: 'useCommon',
          message: 'Would you like to choose from common timezones?',
          initial: true
        });
        
        let newTimezone;
        
        if (useCommon) {
          const { selectedTimezone } = await prompts({
            type: 'select',
            name: 'selectedTimezone',
            message: 'Choose your timezone:',
            choices: commonTimezones.map(tz => ({
              title: `${tz} (${new Date().toLocaleString('en-US', { timeZone: tz, timeZoneName: 'short' })})`,
              value: tz
            })),
            initial: commonTimezones.indexOf(currentTimezone) >= 0 ? commonTimezones.indexOf(currentTimezone) : 0
          });
          newTimezone = selectedTimezone;
        } else {
          const { customTimezone } = await prompts({
            type: 'text',
            name: 'customTimezone',
            message: 'Enter timezone (e.g., America/New_York, Europe/London):',
            initial: currentTimezone,
            validate: value => {
              try {
                new Intl.DateTimeFormat('en-US', { timeZone: value });
                return true;
              } catch {
                return 'Invalid timezone. Use format like America/New_York or Europe/London';
              }
            }
          });
          newTimezone = customTimezone;
        }
        
        if (newTimezone) {
          try {
            setTimezone(newTimezone);
            console.log(`✅ Timezone set to: ${newTimezone}`);
            
            const now = new Date();
            const localTime = now.toLocaleString('en-US', { timeZone: newTimezone });
            console.log(`🕐 Current time in ${newTimezone}: ${localTime}`);
            
            console.log('\n💡 This affects how "today\'s" data is calculated for meals, exercises, and summaries.');
          } catch (error) {
            console.error(`❌ Error setting timezone: ${error.message}`);
          }
        }
      }
      
      console.log('\n� Setup complete! You can now use automatic calorie estimation.');
      console.log('\nTry it out:');
      const finalSystem = getUnitSystem();
      if (finalSystem === 'imperial') {
        console.log('  fasting meal "Grilled chicken" --size "6oz"');
        console.log('  fasting drink "Orange juice" --size "16oz"');
      } else {
        console.log('  fasting meal "Grilled chicken" --size "150g"');
        console.log('  fasting drink "Orange juice" --size "500ml"');
      }
      console.log('  fasting exercise "Running" 30');
      console.log('  fasting recommend sandwiches');
      console.log('  fasting recommend --type breakfast');
      
      const currentMode = getStorageMode();
      console.log(`\n📊 Current storage mode: ${currentMode}`);
      console.log('\nTo configure other settings:');
      console.log('  fasting setup --units     # Configure unit system (imperial/metric)');
      console.log('  fasting setup --timezone  # Configure timezone');
      console.log('  fasting setup --local     # Use local files');
      console.log('  fasting setup --supabase  # Use Supabase cloud storage');
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
