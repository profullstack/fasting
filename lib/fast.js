import { loadFasts, saveFast, updateFast } from './storage.js';

export const startFast = async (startTime = null) => {
  const fasts = await loadFasts();
  
  // Check if there's already an active fast
  const activeFast = fasts.find(fast => !fast.endTime);
  if (activeFast) {
    throw new Error('There is already an active fast. End it first before starting a new one.');
  }
  
  const timestamp = startTime ? new Date(startTime).toISOString() : new Date().toISOString();
  const fast = { startTime: timestamp, endTime: null, durationHours: null };
  
  await saveFast(fast);
  return timestamp;
};

export const endFast = async (endTime = null) => {
  const fasts = await loadFasts();
  
  // Find the active fast
  const activeFast = fasts.find(fast => !fast.endTime);
  if (!activeFast) {
    throw new Error('No active fast found. Start a fast first.');
  }
  
  const endTimestamp = endTime ? new Date(endTime).toISOString() : new Date().toISOString();
  const startTimestamp = new Date(activeFast.startTime);
  const endTimestampDate = new Date(endTimestamp);
  
  if (endTimestampDate <= startTimestamp) {
    throw new Error('End time must be after start time.');
  }
  
  const durationMs = endTimestampDate - startTimestamp;
  const durationHours = Math.round((durationMs / (1000 * 60 * 60)) * 10) / 10;
  
  const completedFast = {
    startTime: activeFast.startTime,
    endTime: endTimestamp,
    durationHours
  };
  
  await updateFast(completedFast);
  return completedFast;
};

export const getCurrentFast = async () => {
  const fasts = await loadFasts();
  return fasts.find(fast => !fast.endTime) || null;
};

export const getFastHistory = async () => {
  const fasts = await loadFasts();
  return fasts.filter(fast => fast.endTime); // Only completed fasts
};

export const getAllFasts = async () => {
  return await loadFasts();
};

export const getFastStats = async () => {
  const completedFasts = await getFastHistory();
  
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
    averageDuration: Math.round((totalDuration / validFasts.length) * 10) / 10,
    longestFast: Math.max(...durations),
    shortestFast: Math.min(...durations)
  };
};