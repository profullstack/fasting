import { getStorageMode } from './config.js';
import { getSupabaseClient } from './supabase.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { getMealsPath, getWeightPath, getFastPath, getExercisePath } from './config.js';

/**
 * Storage abstraction layer that works with both local files and Supabase
 */

// Local storage functions
function loadLocalData(filePath) {
  if (!existsSync(filePath)) {
    return [];
  }
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8') || '[]');
  } catch (error) {
    console.warn(`Error loading local data from ${filePath}:`, error.message);
    return [];
  }
}

function saveLocalData(filePath, data) {
  try {
    writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error saving local data to ${filePath}:`, error.message);
    throw error;
  }
}

// Supabase storage functions
async function loadSupabaseData(tableName) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase client not configured');
  }

  const { data, error } = await client
    .from(tableName)
    .select('*')
    .order('timestamp', { ascending: true });

  if (error) {
    console.warn(`Error loading Supabase data from ${tableName}:`, error.message);
    return [];
  }

  return data || [];
}

async function saveSupabaseData(tableName, record) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase client not configured');
  }

  const { data, error } = await client
    .from(tableName)
    .insert([record])
    .select();

  if (error) {
    console.error(`Error saving Supabase data to ${tableName}:`, error.message);
    throw error;
  }

  return data?.[0];
}

async function clearSupabaseData(tableName) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase client not configured');
  }

  const { error } = await client
    .from(tableName)
    .delete()
    .neq('id', 0); // Delete all records

  if (error) {
    console.error(`Error clearing Supabase data from ${tableName}:`, error.message);
    throw error;
  }
}

// Unified storage interface
export async function loadMeals() {
  const mode = getStorageMode();
  
  if (mode === 'supabase') {
    const data = await loadSupabaseData('fasting_meals');
    return data.map(row => ({
      type: row.type,
      description: row.description,
      calories: row.calories,
      timestamp: row.timestamp
    }));
  } else {
    return loadLocalData(getMealsPath());
  }
}

export async function saveMeal(meal) {
  const mode = getStorageMode();
  
  if (mode === 'supabase') {
    return await saveSupabaseData('fasting_meals', {
      type: meal.type,
      description: meal.description,
      calories: meal.calories,
      timestamp: meal.timestamp
    });
  } else {
    const meals = loadLocalData(getMealsPath());
    meals.push(meal);
    saveLocalData(getMealsPath(), meals);
    return meal;
  }
}

export async function loadWeights() {
  const mode = getStorageMode();
  
  if (mode === 'supabase') {
    const data = await loadSupabaseData('fasting_weights');
    return data.map(row => ({
      weight: parseFloat(row.weight),
      timestamp: row.timestamp
    }));
  } else {
    return loadLocalData(getWeightPath());
  }
}

export async function saveWeight(weight) {
  const mode = getStorageMode();
  
  if (mode === 'supabase') {
    return await saveSupabaseData('fasting_weights', {
      weight: weight.weight,
      timestamp: weight.timestamp
    });
  } else {
    const weights = loadLocalData(getWeightPath());
    weights.push(weight);
    saveLocalData(getWeightPath(), weights);
    return weight;
  }
}

export async function loadFasts() {
  const mode = getStorageMode();
  
  if (mode === 'supabase') {
    const data = await loadSupabaseData('fasting_fasts');
    return data.map(row => ({
      startTime: row.start_time,
      endTime: row.end_time,
      durationHours: row.duration_hours ? parseFloat(row.duration_hours) : null
    }));
  } else {
    return loadLocalData(getFastPath());
  }
}

export async function saveFast(fast) {
  const mode = getStorageMode();
  
  if (mode === 'supabase') {
    return await saveSupabaseData('fasting_fasts', {
      start_time: fast.startTime,
      end_time: fast.endTime,
      duration_hours: fast.durationHours
    });
  } else {
    const fasts = loadLocalData(getFastPath());
    fasts.push(fast);
    saveLocalData(getFastPath(), fasts);
    return fast;
  }
}

export async function updateFast(fastToUpdate) {
  const mode = getStorageMode();
  
  if (mode === 'supabase') {
    const client = getSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not configured');
    }

    const { data, error } = await client
      .from('fasting_fasts')
      .update({
        end_time: fastToUpdate.endTime,
        duration_hours: fastToUpdate.durationHours
      })
      .eq('start_time', fastToUpdate.startTime)
      .is('end_time', null)
      .select();

    if (error) {
      throw error;
    }

    return data?.[0];
  } else {
    const fasts = loadLocalData(getFastPath());
    const fastIndex = fasts.findIndex(f => f.startTime === fastToUpdate.startTime && !f.endTime);
    
    if (fastIndex !== -1) {
      fasts[fastIndex] = fastToUpdate;
      saveLocalData(getFastPath(), fasts);
    }
    
    return fastToUpdate;
  }
}

export async function loadExercises() {
  const mode = getStorageMode();
  
  if (mode === 'supabase') {
    const data = await loadSupabaseData('fasting_exercises');
    return data.map(row => ({
      description: row.description,
      duration: row.duration,
      caloriesBurned: row.calories_burned,
      timestamp: row.timestamp
    }));
  } else {
    return loadLocalData(getExercisePath());
  }
}

export async function saveExercise(exercise) {
  const mode = getStorageMode();
  
  if (mode === 'supabase') {
    return await saveSupabaseData('fasting_exercises', {
      description: exercise.description,
      duration: exercise.duration,
      calories_burned: exercise.caloriesBurned,
      timestamp: exercise.timestamp
    });
  } else {
    const exercises = loadLocalData(getExercisePath());
    exercises.push(exercise);
    saveLocalData(getExercisePath(), exercises);
    return exercise;
  }
}

export async function clearAllData() {
  const mode = getStorageMode();
  
  if (mode === 'supabase') {
    await Promise.all([
      clearSupabaseData('fasting_meals'),
      clearSupabaseData('fasting_weights'),
      clearSupabaseData('fasting_fasts'),
      clearSupabaseData('fasting_exercises')
    ]);
  } else {
    saveLocalData(getMealsPath(), []);
    saveLocalData(getWeightPath(), []);
    saveLocalData(getFastPath(), []);
    saveLocalData(getExercisePath(), []);
  }
}