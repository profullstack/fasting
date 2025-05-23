import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { existsSync } from 'fs';
import { getWeightPath, getConfigDir } from './config.js';

const ensureConfigDir = () => {
  const configDir = getConfigDir();
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }
};

const loadWeights = () => {
  const weightPath = getWeightPath();
  if (!existsSync(weightPath)) {
    return [];
  }
  try {
    return JSON.parse(readFileSync(weightPath, 'utf-8') || '[]');
  } catch (error) {
    console.warn('Error loading weight data:', error.message);
    return [];
  }
};

const saveWeights = data => {
  const weightPath = getWeightPath();
  ensureConfigDir();
  writeFileSync(weightPath, JSON.stringify(data, null, 2));
};

export const logWeight = (weight) => {
  const weights = loadWeights();
  weights.push({ weight, timestamp: new Date().toISOString() });
  saveWeights(weights);
};

export const getWeightHistory = () => loadWeights();
