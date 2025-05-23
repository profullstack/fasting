import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { existsSync } from 'fs';
import { getFastPath, getConfigDir } from './config.js';

const ensureConfigDir = () => {
  const configDir = getConfigDir();
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }
};

const loadFasts = () => {
  const fastPath = getFastPath();
  if (!existsSync(fastPath)) {
    return [];
  }
  try {
    return JSON.parse(readFileSync(fastPath, 'utf-8') || '[]');
  } catch (error) {
    console.warn('Error loading fast data:', error.message);
    return [];
  }
};

const saveFasts = data => {
  const fastPath = getFastPath();
  ensureConfigDir();
  writeFileSync(fastPath, JSON.stringify(data, null, 2));
};

export const startFast = (startTime = null) => {
  const fasts = loadFasts();
  const timestamp = startTime ? new Date(startTime).toISOString() : new Date().toISOString();
  
  // Check if there's an ongoing fast
  const ongoingFast = fasts.find(fast => !fast.endTime);
  if (ongoingFast) {
    throw new Error('There is already an ongoing fast. End it first before starting a new one.');
  }
  
  fasts.push({
    id: Date.now(),
    startTime: timestamp,
    endTime: null
  });
  
  saveFasts(fasts);
  return timestamp;
};

export const endFast = (endTime = null) => {
  const fasts = loadFasts();
  const timestamp = endTime ? new Date(endTime).toISOString() : new Date().toISOString();
  
  // Find the ongoing fast
  const ongoingFast = fasts.find(fast => !fast.endTime);
  if (!ongoingFast) {
    throw new Error('No ongoing fast found. Start a fast first.');
  }
  
  ongoingFast.endTime = timestamp;
  
  // Calculate duration in hours
  const startTime = new Date(ongoingFast.startTime);
  const endTimeDate = new Date(timestamp);
  ongoingFast.durationHours = Math.round((endTimeDate - startTime) / (1000 * 60 * 60) * 10) / 10;
  
  saveFasts(fasts);
  return { ...ongoingFast };
};

export const getCurrentFast = () => {
  const fasts = loadFasts();
  return fasts.find(fast => !fast.endTime) || null;
};

export const getFastHistory = () => {
  const fasts = loadFasts();
  return fasts.filter(fast => fast.endTime); // Only completed fasts
};

export const getAllFasts = () => loadFasts();

export const getFastStats = () => {
  const completedFasts = getFastHistory();
  
  // Filter out invalid fasts (negative durations)
  const validFasts = completedFasts.filter(fast => fast.durationHours > 0);
  
  if (validFasts.length === 0) {
    return {
      totalFasts: 0,
      averageDuration: 0,
      longestFast: 0,
      shortestFast: 0
    };
  }
  
  const durations = validFasts.map(fast => fast.durationHours);
  const totalDuration = durations.reduce((sum, duration) => sum + duration, 0);
  
  return {
    totalFasts: validFasts.length,
    averageDuration: Math.round(totalDuration / validFasts.length * 10) / 10,
    longestFast: Math.max(...durations),
    shortestFast: Math.min(...durations)
  };
};