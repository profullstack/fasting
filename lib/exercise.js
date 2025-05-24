import { loadExercises, saveExercise } from './storage.js';
import { getTodaysDate, getCurrentTimestamp } from './config.js';

export const logExercise = async (description, duration, caloriesBurned = null) => {
  const exercise = {
    description,
    duration,
    caloriesBurned,
    timestamp: getCurrentTimestamp()
  };
  await saveExercise(exercise);
};

export const getTodaysExercises = async () => {
  const exercises = await loadExercises();
  const { getTimezone } = await import('./config.js');
  const timezone = getTimezone();
  const today = getTodaysDate();
  
  return exercises.filter(exercise => {
    // Convert UTC timestamp to local date in the configured timezone
    const exerciseDate = new Date(exercise.timestamp).toLocaleDateString('en-CA', {
      timeZone: timezone
    });
    return exerciseDate === today;
  });
};

export const getExerciseHistory = async () => {
  const exercises = await loadExercises();
  
  // Group exercises by date and calculate total calories burned per day
  const caloriesByDate = {};
  
  exercises.forEach(exercise => {
    if (exercise.caloriesBurned === null) return; // Skip entries without calorie data
    
    const date = exercise.timestamp.slice(0, 10); // Get YYYY-MM-DD
    if (!caloriesByDate[date]) {
      caloriesByDate[date] = 0;
    }
    caloriesByDate[date] += exercise.caloriesBurned;
  });
  
  // Convert to array format with date and calories burned
  return Object.entries(caloriesByDate)
    .map(([date, caloriesBurned]) => ({
      date,
      caloriesBurned,
      timestamp: new Date(date + 'T12:00:00Z').toISOString() // Use noon UTC for consistent sorting
    }))
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
};

export const getAllExercises = async () => {
  return await loadExercises();
};