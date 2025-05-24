import { loadMeals, saveMeal } from './storage.js';
import { getTodaysDate, getCurrentTimestamp } from './config.js';

export const logMeal = async (description, calories = null) => {
  const meal = { type: 'meal', description, calories, timestamp: getCurrentTimestamp() };
  await saveMeal(meal);
};

export const logDrink = async (description, calories = null) => {
  const drink = { type: 'drink', description, calories, timestamp: getCurrentTimestamp() };
  await saveMeal(drink);
};

export const getTodaysEntries = async () => {
  const meals = await loadMeals();
  // Use timezone-aware date function
  const today = getTodaysDate();
  return meals.filter(entry => entry.timestamp.startsWith(today));
};

export const getCalorieHistory = async () => {
  const meals = await loadMeals();
  
  // Group meals by date and calculate total calories per day
  const caloriesByDate = {};
  
  meals.forEach(entry => {
    if (entry.calories === null) return; // Skip entries without calorie data
    
    const date = entry.timestamp.slice(0, 10); // Get YYYY-MM-DD
    if (!caloriesByDate[date]) {
      caloriesByDate[date] = 0;
    }
    caloriesByDate[date] += entry.calories;
  });
  
  // Convert to array format with date and calories
  return Object.entries(caloriesByDate)
    .map(([date, calories]) => ({
      date,
      calories,
      timestamp: new Date(date + 'T12:00:00Z').toISOString() // Use noon UTC for consistent sorting
    }))
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
};
