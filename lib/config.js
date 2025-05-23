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