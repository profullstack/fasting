import { loadWeights, saveWeight } from './storage.js';

export const logWeight = async (weight) => {
  const weightEntry = { weight, timestamp: new Date().toISOString() };
  await saveWeight(weightEntry);
};

export const getWeightHistory = async () => {
  return await loadWeights();
};
