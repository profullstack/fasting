import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { existsSync } from 'fs';
import { getExercisePath, getConfigDir } from './config.js';

const ensureConfigDir = () => {
  const configDir = getConfigDir();
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }
};

const loadExercises = () => {
  const exercisePath = getExercisePath();
  if (!existsSync(exercisePath)) {
    return [];
  }
  try {
    return JSON.parse(readFileSync(exercisePath, 'utf-8') || '[]');
  } catch (error) {
    console.warn('Error loading exercise data:', error.message);
    return [];
  }
};

const saveExercises = data => {
  const exercisePath = getExercisePath();
  ensureConfigDir();
  writeFileSync(exercisePath, JSON.stringify(data, null, 2));
};

export const logExercise = (description, duration, caloriesBurned = null) => {
  const exercises = loadExercises();
  exercises.push({ 
    description, 
    duration, 
    caloriesBurned, 
    timestamp: new Date().toISOString() 
  });
  saveExercises(exercises);
};

export const getTodaysExercises = () => {
  const exercises = loadExercises();
  const today = new Date().toISOString().slice(0, 10);
  return exercises.filter(exercise => exercise.timestamp.startsWith(today));
};

export const getExerciseHistory = () => {
  const exercises = loadExercises();
  
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

export const getAllExercises = () => loadExercises();