import OpenAI from 'openai';
import { getOpenAIKey } from './config.js';
import { getWeightHistory } from './weight.js';

function getOpenAIClient() {
  const apiKey = getOpenAIKey();
  if (!apiKey) {
    return null;
  }
  
  return new OpenAI({
    apiKey: apiKey
  });
}

function getCurrentWeight() {
  const weightHistory = getWeightHistory();
  if (weightHistory.length === 0) {
    return 150; // Default weight if none recorded
  }
  return weightHistory[weightHistory.length - 1].weight;
}

/**
 * Estimates calories burned for exercise using OpenAI
 * @param {string} description - Exercise description
 * @param {number} duration - Duration in minutes
 * @param {number} weight - User's weight in pounds (optional, uses latest recorded weight)
 * @returns {Promise<number>} Estimated calories burned
 */
export async function estimateExerciseCalories(description, duration, weight = null) {
  const client = getOpenAIClient();
  
  if (!client) {
    // Fallback estimation without OpenAI
    return Math.round(duration * 5); // Rough estimate: 5 calories per minute
  }

  const userWeight = weight || getCurrentWeight();
  
  try {
    const prompt = `Estimate calories burned for this exercise:
Exercise: ${description}
Duration: ${duration} minutes
Person's weight: ${userWeight} pounds

Please provide only a number representing the estimated calories burned. Consider the person's weight, exercise intensity, and duration. Be realistic and accurate.`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a fitness expert who accurately estimates calories burned during exercise. Respond with only a number.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 50,
      temperature: 0.1
    });

    const caloriesText = response.choices[0].message.content.trim();
    const calories = parseInt(caloriesText.replace(/[^\d]/g, ''));
    
    if (isNaN(calories) || calories <= 0) {
      throw new Error('Invalid response from OpenAI');
    }
    
    return calories;
    
  } catch (error) {
    console.warn('Error estimating exercise calories with OpenAI:', error.message);
    // Fallback calculation
    return Math.round(duration * 5);
  }
}