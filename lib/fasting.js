import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { existsSync } from 'fs';
import { getMealsPath, getConfigDir } from './config.js';
import { dirname } from 'path';

const ensureConfigDir = () => {
  const configDir = getConfigDir();
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }
};

const loadMeals = () => {
  const mealsPath = getMealsPath();
  if (!existsSync(mealsPath)) {
    return [];
  }
  try {
    return JSON.parse(readFileSync(mealsPath, 'utf-8') || '[]');
  } catch (error) {
    console.warn('Error loading meals data:', error.message);
    return [];
  }
};

const saveMeals = data => {
  const mealsPath = getMealsPath();
  ensureConfigDir();
  writeFileSync(mealsPath, JSON.stringify(data, null, 2));
};

export const logMeal = (description, calories = null) => {
  const meals = loadMeals();
  meals.push({ type: 'meal', description, calories, timestamp: new Date().toISOString() });
  saveMeals(meals);
};

export const logDrink = (description, calories = null) => {
  const meals = loadMeals();
  meals.push({ type: 'drink', description, calories, timestamp: new Date().toISOString() });
  saveMeals(meals);
};

export const getTodaysEntries = () => {
  const meals = loadMeals();
  const today = new Date().toISOString().slice(0, 10);
  return meals.filter(entry => entry.timestamp.startsWith(today));
};
