import { loadConfig } from './config.js';

/**
 * Parse size input with units and convert to preferred unit system
 * @param {string} input - Size input like "32oz", "500ml", "2 cups", "1lb", etc.
 * @param {string} type - 'volume' or 'weight'
 * @returns {Object} - { value: number, unit: string, originalInput: string, systemType: string }
 */
export const parseSize = (input, type = 'volume') => {
  const config = loadConfig();
  const unitSystem = config.unitSystem || 'imperial';
  
  // Remove spaces and convert to lowercase for parsing
  const cleanInput = input.toString().trim().toLowerCase();
  
  // Volume units regex
  const volumeMatch = cleanInput.match(/^(\d+(?:\.\d+)?)\s*(ml|milliliters?|l|liters?|litres?|fl\s*oz|fluid\s*ounces?|oz|ounces?|cups?|pints?|quarts?|gallons?|tbsp|tablespoons?|tsp|teaspoons?)?$/);
  
  // Weight units regex  
  const weightMatch = cleanInput.match(/^(\d+(?:\.\d+)?)\s*(g|grams?|kg|kilograms?|oz|ounces?|lbs?|pounds?)?$/);
  
  let match, value, unit;
  
  if (type === 'volume' && volumeMatch) {
    match = volumeMatch;
    value = parseFloat(match[1]);
    unit = match[2] || (unitSystem === 'metric' ? 'ml' : 'fl oz');
  } else if (type === 'weight' && weightMatch) {
    match = weightMatch;
    value = parseFloat(match[1]);
    unit = match[2] || (unitSystem === 'metric' ? 'g' : 'oz');
  } else {
    throw new Error(`Invalid ${type} format: "${input}". Use formats like ${type === 'volume' ? '"32oz", "500ml", "2 cups"' : '"8oz", "250g", "1lb"'}`);
  }
  
  // Normalize unit names
  unit = normalizeUnit(unit, type);
  
  return {
    value,
    unit,
    originalInput: input,
    systemType: getUnitSystemType(unit, type)
  };
};

/**
 * Normalize unit names to standard forms
 * @param {string} unit - Unit to normalize
 * @param {string} type - 'volume' or 'weight'
 * @returns {string} - Normalized unit
 */
function normalizeUnit(unit, type) {
  if (!unit) return unit;
  
  const normalized = unit.toLowerCase().replace(/\s+/g, '');
  
  if (type === 'volume') {
    // Volume units
    if (normalized.match(/^(ml|milliliters?)$/)) return 'ml';
    if (normalized.match(/^(l|liters?|litres?)$/)) return 'l';
    if (normalized.match(/^(floz|fluidounces?|oz|ounces?)$/)) return 'fl oz';
    if (normalized.match(/^(cups?)$/)) return 'cup';
    if (normalized.match(/^(pints?)$/)) return 'pint';
    if (normalized.match(/^(quarts?)$/)) return 'quart';
    if (normalized.match(/^(gallons?)$/)) return 'gallon';
    if (normalized.match(/^(tbsp|tablespoons?)$/)) return 'tbsp';
    if (normalized.match(/^(tsp|teaspoons?)$/)) return 'tsp';
  } else if (type === 'weight') {
    // Weight units
    if (normalized.match(/^(g|grams?)$/)) return 'g';
    if (normalized.match(/^(kg|kilograms?)$/)) return 'kg';
    if (normalized.match(/^(oz|ounces?)$/)) return 'oz';
    if (normalized.match(/^(lbs?|pounds?)$/)) return 'lbs';
  }
  
  return unit;
}

/**
 * Determine if a unit belongs to metric or imperial system
 * @param {string} unit - The unit to check
 * @param {string} type - 'volume' or 'weight'
 * @returns {string} - 'metric' or 'imperial'
 */
function getUnitSystemType(unit, type) {
  if (type === 'volume') {
    const metricVolume = ['ml', 'l'];
    const imperialVolume = ['fl oz', 'cup', 'pint', 'quart', 'gallon', 'tbsp', 'tsp'];
    
    if (metricVolume.includes(unit)) return 'metric';
    if (imperialVolume.includes(unit)) return 'imperial';
  } else if (type === 'weight') {
    const metricWeight = ['g', 'kg'];
    const imperialWeight = ['oz', 'lbs'];
    
    if (metricWeight.includes(unit)) return 'metric';
    if (imperialWeight.includes(unit)) return 'imperial';
  }
  
  return 'unknown';
}

/**
 * Convert volume between units
 * @param {number} value - Volume value
 * @param {string} fromUnit - Source unit
 * @param {string} toUnit - Target unit
 * @returns {number} - Converted volume value
 */
export const convertVolume = (value, fromUnit, toUnit) => {
  if (fromUnit === toUnit) return value;
  
  // Convert everything to ml first, then to target unit
  let ml;
  
  switch (fromUnit) {
    case 'ml':
      ml = value;
      break;
    case 'l':
      ml = value * 1000;
      break;
    case 'fl oz':
      ml = value * 29.5735;
      break;
    case 'cup':
      ml = value * 236.588;
      break;
    case 'pint':
      ml = value * 473.176;
      break;
    case 'quart':
      ml = value * 946.353;
      break;
    case 'gallon':
      ml = value * 3785.41;
      break;
    case 'tbsp':
      ml = value * 14.7868;
      break;
    case 'tsp':
      ml = value * 4.92892;
      break;
    default:
      throw new Error(`Unsupported volume unit: ${fromUnit}`);
  }
  
  switch (toUnit) {
    case 'ml':
      return Math.round(ml * 100) / 100;
    case 'l':
      return Math.round((ml / 1000) * 100) / 100;
    case 'fl oz':
      return Math.round((ml / 29.5735) * 100) / 100;
    case 'cup':
      return Math.round((ml / 236.588) * 100) / 100;
    case 'pint':
      return Math.round((ml / 473.176) * 100) / 100;
    case 'quart':
      return Math.round((ml / 946.353) * 100) / 100;
    case 'gallon':
      return Math.round((ml / 3785.41) * 100) / 100;
    case 'tbsp':
      return Math.round((ml / 14.7868) * 100) / 100;
    case 'tsp':
      return Math.round((ml / 4.92892) * 100) / 100;
    default:
      throw new Error(`Unsupported volume unit: ${toUnit}`);
  }
};

/**
 * Format size for display
 * @param {number} value - Size value
 * @param {string} unit - Size unit
 * @returns {string} - Formatted size string
 */
export const formatSize = (value, unit) => {
  return `${value} ${unit}`;
};

/**
 * Get appropriate size examples for the current unit system
 * @param {string} type - 'volume' or 'weight'
 * @returns {Array} - Array of example size strings
 */
export const getSizeExamples = (type = 'volume') => {
  const config = loadConfig();
  const unitSystem = config.unitSystem || 'imperial';
  
  if (type === 'volume') {
    if (unitSystem === 'metric') {
      return ['250ml', '500ml', '1l', '1.5l'];
    } else {
      return ['8oz', '16oz', '32oz', '1 cup', '2 cups'];
    }
  } else if (type === 'weight') {
    if (unitSystem === 'metric') {
      return ['50g', '100g', '250g', '500g', '1kg'];
    } else {
      return ['2oz', '4oz', '8oz', '1lb'];
    }
  }
  
  return [];
};

/**
 * Convert size to preferred unit system for consistent AI prompts
 * @param {Object} parsedSize - Result from parseSize()
 * @param {string} preferredSystem - 'metric' or 'imperial'
 * @returns {Object} - { value: number, unit: string, originalInput: string }
 */
export const convertToPreferredSystem = async (parsedSize, preferredSystem = null) => {
  const config = loadConfig();
  const targetSystem = preferredSystem || config.unitSystem || 'imperial';
  
  // If already in preferred system, return as-is
  if (parsedSize.systemType === targetSystem) {
    return parsedSize;
  }
  
  // Determine if this is volume or weight based on unit
  const isVolume = ['ml', 'l', 'fl oz', 'cup', 'pint', 'quart', 'gallon', 'tbsp', 'tsp'].includes(parsedSize.unit);
  const isWeight = ['g', 'kg', 'oz', 'lbs'].includes(parsedSize.unit);
  
  if (isVolume) {
    // Convert volume to preferred system
    let targetUnit;
    if (targetSystem === 'metric') {
      targetUnit = parsedSize.value >= 1000 ? 'l' : 'ml';
    } else {
      targetUnit = 'fl oz';
    }
    
    const convertedValue = convertVolume(parsedSize.value, parsedSize.unit, targetUnit);
    return {
      value: convertedValue,
      unit: targetUnit,
      originalInput: parsedSize.originalInput
    };
  } else if (isWeight) {
    // Import weight conversion from weight.js
    const { convertWeight } = await import('./weight.js');
    
    let targetUnit;
    if (targetSystem === 'metric') {
      targetUnit = parsedSize.value >= 1000 ? 'kg' : 'g';
    } else {
      targetUnit = parsedSize.value >= 16 ? 'lbs' : 'oz';
    }
    
    const convertedValue = convertWeight(parsedSize.value, parsedSize.unit, targetUnit);
    return {
      value: convertedValue,
      unit: targetUnit,
      originalInput: parsedSize.originalInput
    };
  }
  
  // If we can't determine type, return original
  return parsedSize;
};