import { loadWeights, saveWeight } from './storage.js';
import { loadConfig, getUnitSystem, getCurrentTimestamp } from './config.js';

/**
 * Parse weight input with units and convert to preferred unit system
 * @param {string} input - Weight input like "305.8lbs", "138.5kg", "305.8", etc.
 * @returns {Object} - { value: number, unit: string, originalInput: string }
 */
export const parseWeight = (input) => {
  const config = loadConfig();
  const preferredUnit = config.weightUnit || 'lbs'; // Default to lbs
  
  // Remove spaces and convert to lowercase for parsing
  const cleanInput = input.toString().trim().toLowerCase();
  
  // Extract number and unit
  const match = cleanInput.match(/^(\d+(?:\.\d+)?)\s*(lbs?|pounds?|kg|kilograms?|g|grams?|oz|ounces?)?$/);
  
  if (!match) {
    throw new Error(`Invalid weight format: "${input}". Use formats like "305.8lbs", "138.5kg", or "305.8"`);
  }
  
  const value = parseFloat(match[1]);
  let unit = match[2] || preferredUnit;
  
  // Normalize unit names
  if (unit.startsWith('lb') || unit.startsWith('pound')) {
    unit = 'lbs';
  } else if (unit.startsWith('kg') || unit.startsWith('kilogram')) {
    unit = 'kg';
  } else if (unit.startsWith('g') && !unit.startsWith('gram')) {
    unit = 'g';
  } else if (unit.startsWith('gram')) {
    unit = 'g';
  } else if (unit.startsWith('oz') || unit.startsWith('ounce')) {
    unit = 'oz';
  }
  
  return {
    value,
    unit,
    originalInput: input
  };
};

/**
 * Convert weight between units
 * @param {number} value - Weight value
 * @param {string} fromUnit - Source unit
 * @param {string} toUnit - Target unit
 * @returns {number} - Converted weight value
 */
export const convertWeight = (value, fromUnit, toUnit) => {
  if (fromUnit === toUnit) return value;
  
  // Convert everything to grams first, then to target unit
  let grams;
  
  switch (fromUnit) {
    case 'lbs':
      grams = value * 453.592;
      break;
    case 'kg':
      grams = value * 1000;
      break;
    case 'oz':
      grams = value * 28.3495;
      break;
    case 'g':
      grams = value;
      break;
    default:
      throw new Error(`Unsupported weight unit: ${fromUnit}`);
  }
  
  switch (toUnit) {
    case 'lbs':
      return Math.round((grams / 453.592) * 100) / 100;
    case 'kg':
      return Math.round((grams / 1000) * 100) / 100;
    case 'oz':
      return Math.round((grams / 28.3495) * 100) / 100;
    case 'g':
      return Math.round(grams * 100) / 100;
    default:
      throw new Error(`Unsupported weight unit: ${toUnit}`);
  }
};

/**
 * Format weight for display
 * @param {number} value - Weight value
 * @param {string} unit - Weight unit
 * @returns {string} - Formatted weight string
 */
export const formatWeight = (value, unit) => {
  return `${value} ${unit}`;
};

export const logWeight = async (weightInput) => {
  const config = loadConfig();
  const preferredUnit = config.weightUnit || 'lbs';
  
  const parsed = parseWeight(weightInput);
  
  // Convert to preferred unit for storage
  const convertedValue = convertWeight(parsed.value, parsed.unit, preferredUnit);
  
  const weightEntry = {
    weight: convertedValue,
    unit: preferredUnit,
    originalInput: parsed.originalInput,
    timestamp: getCurrentTimestamp()
  };
  
  await saveWeight(weightEntry);
  
  return {
    stored: formatWeight(convertedValue, preferredUnit),
    original: parsed.originalInput
  };
};

export const getWeightHistory = async () => {
  return await loadWeights();
};
