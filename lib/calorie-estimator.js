import OpenAI from 'openai';
import { getOpenAIKey, getUnitSystem } from './config.js';
import { parseSize, convertToPreferredSystem, getSizeExamples } from './units.js';

let openai = null;

function getOpenAIClient() {
  if (!openai) {
    const apiKey = getOpenAIKey();
    if (!apiKey) {
      throw new Error('OpenAI API key not found. Please run "fasting setup" to configure your API key.');
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

/**
 * Estimates calories for a food or drink item using OpenAI
 * @param {string} description - Description of the food or drink
 * @param {string} type - Either 'meal' or 'drink'
 * @param {string} size - Optional size specification (e.g., "32oz", "large", "2 cups")
 * @returns {Promise<number>} - Estimated calories
 */
export async function estimateCalories(description, type = 'meal', size = null) {
  try {
    const unitSystem = getUnitSystem();
    let prompt = `Estimate the calories for this ${type}: "${description}"`;
    
    let sizeInfo = '';
    if (size) {
      try {
        // Parse the size and convert to preferred unit system for consistent AI prompts
        const sizeType = type === 'drink' ? 'volume' : 'weight';
        const parsedSize = parseSize(size, sizeType);
        const convertedSize = await convertToPreferredSystem(parsedSize, unitSystem);
        
        sizeInfo = `${convertedSize.value} ${convertedSize.unit}`;
        prompt += ` with size/portion: "${sizeInfo}"`;
      } catch (error) {
        // If size parsing fails, use the original size
        sizeInfo = size;
        prompt += ` with size/portion: "${size}"`;
      }
    }
    
    // Add unit system context to help AI understand the measurement system
    const systemContext = unitSystem === 'metric' ?
      'Use metric measurements (grams, milliliters, etc.) for context.' :
      'Use imperial measurements (ounces, pounds, etc.) for context.';
    
    prompt += `.
    
    ${systemContext}
    Please provide only a numeric estimate (whole number) based on ${size ? 'the specified size/portion' : `typical serving sizes in ${unitSystem} units`}.
    Consider:
    - ${size ? 'The exact size/portion specified' : `Standard portion sizes for the item in ${unitSystem} measurements`}
    - Common preparation methods
    - Average caloric density
    
    Respond with only the number, no additional text or explanation.`;

    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a nutrition expert that provides accurate calorie estimates for food and drinks using ${unitSystem} measurements. Always respond with only a number representing the estimated calories.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 10,
      temperature: 0.1,
    });

    const calorieEstimate = parseInt(response.choices[0].message.content.trim());
    
    if (isNaN(calorieEstimate)) {
      console.warn(`Could not parse calorie estimate for "${description}". Using default estimate.`);
      return type === 'drink' ? 50 : 200; // Default fallback values
    }
    
    return calorieEstimate;
  } catch (error) {
    console.warn(`Error estimating calories for "${description}":`, error.message);
    console.warn('Using default calorie estimate.');
    return type === 'drink' ? 50 : 200; // Default fallback values
  }
}