import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { existsSync } from 'fs';

const configDir = process.env.FASTING_TEST_CONFIG_DIR || join(homedir(), '.config', 'fasting');
const configPath = join(configDir, 'config.json');
const mealsPath = join(configDir, 'meals.json');
const weightPath = join(configDir, 'weight.json');
const fastPath = join(configDir, 'fasts.json');
const exercisePath = join(configDir, 'exercises.json');

// Storage mode - 'local' or 'supabase'
let storageMode = null;

/**
 * Ensures the config directory exists
 */
function ensureConfigDir() {
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }
}

/**
 * Loads the configuration from ~/.config/fasting.json
 * @returns {Object} Configuration object
 */
export function loadConfig() {
  try {
    if (!existsSync(configPath)) {
      return {};
    }
    return JSON.parse(readFileSync(configPath, 'utf-8'));
  } catch (error) {
    console.warn('Error loading config:', error.message);
    return {};
  }
}

/**
 * Saves the configuration to ~/.config/fasting.json
 * @param {Object} config - Configuration object to save
 */
export function saveConfig(config) {
  try {
    ensureConfigDir();
    writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('Error saving config:', error.message);
    throw error;
  }
}

/**
 * Gets the OpenAI API key from config or environment
 * @returns {string|null} The API key or null if not found
 */
export function getOpenAIKey() {
  // First check environment variable
  if (process.env.OPENAI_API_KEY) {
    return process.env.OPENAI_API_KEY;
  }
  
  // Then check config file
  const config = loadConfig();
  return config.openaiApiKey || null;
}

/**
 * Sets the OpenAI API key in the config
 * @param {string} apiKey - The API key to save
 */
export function setOpenAIKey(apiKey) {
  const config = loadConfig();
  config.openaiApiKey = apiKey;
  saveConfig(config);
}

/**
 * Gets the config file path for display purposes
 * @returns {string} The full path to the config file
 */
export function getConfigPath() {
  return configPath;
}

/**
 * Gets the meals data file path
 * @returns {string} The full path to the meals file
 */
export function getMealsPath() {
  return mealsPath;
}

/**
 * Gets the weight data file path
 * @returns {string} The full path to the weight file
 */
export function getWeightPath() {
  return weightPath;
}

/**
 * Gets the fast data file path
 * @returns {string} The full path to the fast file
 */
export function getFastPath() {
  return fastPath;
}

/**
 * Gets the exercise data file path
 * @returns {string} The full path to the exercise file
 */
export function getExercisePath() {
  return exercisePath;
}

/**
 * Gets the config directory path
 * @returns {string} The full path to the config directory
 */
export function getConfigDir() {
  return configDir;
}

/**
 * Cleans all data files (meals, weight, config)
 * @param {boolean} keepConfig - Whether to keep the config file (API key)
 */
export function cleanData(keepConfig = false) {
  try {
    if (existsSync(mealsPath)) {
      writeFileSync(mealsPath, '[]');
    }
    if (existsSync(weightPath)) {
      writeFileSync(weightPath, '[]');
    }
    if (existsSync(fastPath)) {
      writeFileSync(fastPath, '[]');
    }
    if (existsSync(exercisePath)) {
      writeFileSync(exercisePath, '[]');
    }
    if (!keepConfig && existsSync(configPath)) {
      writeFileSync(configPath, '{}');
    }
  } catch (error) {
    console.error('Error cleaning data:', error.message);
    throw error;
  }
}

/**
 * Gets the Supabase configuration from config or environment
 * @returns {Object} Supabase configuration object
 */
export function getSupabaseConfig() {
  const config = loadConfig();
  
  return {
    url: process.env.SUPABASE_URL || config.supabaseUrl || null,
    key: process.env.SUPABASE_KEY || config.supabaseKey || null,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || config.supabaseServiceRoleKey || null,
    dbPassword: process.env.SUPABASE_DB_PASSWORD || config.supabaseDbPassword || null,
    accessToken: process.env.SUPABASE_ACCESS_TOKEN || config.supabaseAccessToken || null
  };
}

/**
 * Sets the Supabase configuration in the config
 * @param {Object} supabaseConfig - The Supabase configuration to save
 */
export function setSupabaseConfig(supabaseConfig) {
  const config = loadConfig();
  config.supabaseUrl = supabaseConfig.url;
  config.supabaseKey = supabaseConfig.key;
  config.supabaseServiceRoleKey = supabaseConfig.serviceRoleKey;
  config.supabaseDbPassword = supabaseConfig.dbPassword;
  config.supabaseAccessToken = supabaseConfig.accessToken;
  config.storageMode = 'supabase';
  saveConfig(config);
}

/**
 * Gets the current storage mode
 * @returns {string} 'local' or 'supabase'
 */
export function getStorageMode() {
  if (storageMode) {
    return storageMode;
  }
  
  // Check environment variable first
  if (process.env.FASTING_STORAGE_MODE) {
    storageMode = process.env.FASTING_STORAGE_MODE;
    return storageMode;
  }
  
  // Check config file
  const config = loadConfig();
  if (config.storageMode) {
    storageMode = config.storageMode;
    return storageMode;
  }
  
  // Check if Supabase is configured
  const supabaseConfig = getSupabaseConfig();
  if (supabaseConfig.url && supabaseConfig.serviceRoleKey) {
    storageMode = 'supabase';
    return storageMode;
  }
  
  // Default to local
  storageMode = 'local';
  return storageMode;
}

/**
 * Sets the storage mode
 * @param {string} mode - 'local' or 'supabase'
 */
export function setStorageMode(mode) {
  const config = loadConfig();
  config.storageMode = mode;
  saveConfig(config);
  storageMode = mode;
}

/**
 * Checks if Supabase is configured
 * @returns {boolean} True if Supabase is configured
 */
export function isSupabaseConfigured() {
  const config = getSupabaseConfig();
  return !!(config.url && config.serviceRoleKey);
}

/**
 * Gets the preferred weight unit from config
 * @returns {string} 'lbs' or 'kg'
 */
export function getWeightUnit() {
  const config = loadConfig();
  return config.weightUnit || 'lbs'; // Default to lbs
}

/**
 * Sets the preferred weight unit in the config
 * @param {string} unit - 'lbs' or 'kg'
 */
export function setWeightUnit(unit) {
  if (!['lbs', 'kg'].includes(unit)) {
    throw new Error('Weight unit must be "lbs" or "kg"');
  }
  const config = loadConfig();
  config.weightUnit = unit;
  saveConfig(config);
}

/**
 * Gets the preferred unit system from config
 * @returns {string} 'imperial' or 'metric'
 */
export function getUnitSystem() {
  const config = loadConfig();
  return config.unitSystem || 'imperial'; // Default to imperial
}

/**
 * Sets the preferred unit system in the config
 * @param {string} system - 'imperial' or 'metric'
 */
export function setUnitSystem(system) {
  if (!['imperial', 'metric'].includes(system)) {
    throw new Error('Unit system must be "imperial" or "metric"');
  }
  const config = loadConfig();
  config.unitSystem = system;
  
  // Also update weight unit to match the system
  if (system === 'metric') {
    config.weightUnit = 'kg';
  } else {
    config.weightUnit = 'lbs';
  }
  
  saveConfig(config);
}

/**
 * Gets the preferred timezone from config
 * @returns {string} Timezone identifier (e.g., 'America/Los_Angeles', 'UTC')
 */
export function getTimezone() {
  const config = loadConfig();
  return config.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone; // Default to system timezone
}

/**
 * Sets the preferred timezone in the config
 * @param {string} timezone - Timezone identifier (e.g., 'America/Los_Angeles', 'UTC')
 */
export function setTimezone(timezone) {
  // Validate timezone by trying to create a date formatter with it
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone });
  } catch (error) {
    throw new Error(`Invalid timezone: ${timezone}`);
  }
  
  const config = loadConfig();
  config.timezone = timezone;
  saveConfig(config);
}

/**
 * Gets today's date in YYYY-MM-DD format using the configured timezone
 * @returns {string} Today's date in local timezone
 */
export function getTodaysDate() {
  const timezone = getTimezone();
  const now = new Date();
  
  // Use the configured timezone to get the local date
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  return formatter.format(now); // Returns YYYY-MM-DD format
}

/**
 * Gets the current timestamp in ISO format using the configured timezone
 * @returns {string} Current timestamp in ISO format
 */
export function getCurrentTimestamp() {
  // Simply return the current UTC timestamp - the timezone handling
  // should be done when displaying times, not when storing them
  return new Date().toISOString();
}

/**
 * Gets the default volume units for the current unit system
 * @returns {Object} Object with common volume units for the system
 */
export function getVolumeUnits() {
  const system = getUnitSystem();
  
  if (system === 'metric') {
    return {
      small: 'ml',
      medium: 'ml',
      large: 'l',
      examples: ['250ml', '500ml', '1l', '1.5l']
    };
  } else {
    return {
      small: 'fl oz',
      medium: 'fl oz',
      large: 'fl oz',
      examples: ['8oz', '16oz', '32oz', '64oz']
    };
  }
}

/**
 * Gets the default weight units for the current unit system
 * @returns {Object} Object with common weight units for the system
 */
export function getWeightUnits() {
  const system = getUnitSystem();
  
  if (system === 'metric') {
    return {
      small: 'g',
      medium: 'g',
      large: 'kg',
      examples: ['50g', '100g', '250g', '500g', '1kg']
    };
  } else {
    return {
      small: 'oz',
      medium: 'oz',
      large: 'lbs',
      examples: ['2oz', '4oz', '8oz', '1lb', '2lbs']
    };
  }
}

/**
 * Gets the activity level from config
 * @returns {string} 'sedentary', 'moderate', or 'active'
 */
export function getActivityLevel() {
  const config = loadConfig();
  return config.activityLevel || 'moderate'; // Default to moderate
}

/**
 * Sets the activity level in the config
 * @param {string} level - 'sedentary', 'moderate', or 'active'
 */
export function setActivityLevel(level) {
  if (!['sedentary', 'moderate', 'active'].includes(level)) {
    throw new Error('Activity level must be "sedentary", "moderate", or "active"');
  }
  const config = loadConfig();
  config.activityLevel = level;
  saveConfig(config);
}

/**
 * Gets the medical conditions from config
 * @returns {Array<string>} Array of medical conditions
 */
export function getMedicalConditions() {
  const config = loadConfig();
  return config.medicalConditions || [];
}

/**
 * Sets the medical conditions in the config
 * @param {Array<string>} conditions - Array of medical conditions
 */
export function setMedicalConditions(conditions) {
  if (!Array.isArray(conditions)) {
    throw new Error('Medical conditions must be an array');
  }
  const config = loadConfig();
  config.medicalConditions = conditions;
  saveConfig(config);
}

/**
 * Adds a medical condition to the config
 * @param {string} condition - Medical condition to add
 */
export function addMedicalCondition(condition) {
  if (!condition || typeof condition !== 'string') {
    throw new Error('Medical condition must be a non-empty string');
  }
  const conditions = getMedicalConditions();
  if (!conditions.includes(condition.toLowerCase())) {
    conditions.push(condition.toLowerCase());
    setMedicalConditions(conditions);
  }
}

/**
 * Removes a medical condition from the config
 * @param {string} condition - Medical condition to remove
 */
export function removeMedicalCondition(condition) {
  if (!condition || typeof condition !== 'string') {
    throw new Error('Medical condition must be a non-empty string');
  }
  const conditions = getMedicalConditions();
  const filteredConditions = conditions.filter(c => c !== condition.toLowerCase());
  setMedicalConditions(filteredConditions);
}

/**
 * Gets user profile information for OpenAI calls
 * @returns {Object} User profile with activity level and medical conditions
 */
export function getUserProfile() {
  return {
    activityLevel: getActivityLevel(),
    medicalConditions: getMedicalConditions(),
    unitSystem: getUnitSystem(),
    weightUnit: getWeightUnit(),
    timezone: getTimezone()
  };
}