import OpenAI from 'openai';
import { getOpenAIKey, getUnitSystem } from './config.js';
import { getTodaysEntries, getCalorieHistory } from './index.js';
import { getCurrentFast } from './fast.js';
import { getWeightHistory } from './weight.js';

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
 * Get user context for better recommendations
 * @returns {Promise<Object>} User context including recent meals, fasting status, etc.
 */
async function getUserContext() {
  try {
    const [todaysEntries, currentFast, recentWeights, calorieHistory] = await Promise.all([
      getTodaysEntries(),
      getCurrentFast(),
      getWeightHistory(),
      getCalorieHistory()
    ]);

    const context = {
      todaysCalories: todaysEntries.reduce((sum, entry) => sum + entry.calories, 0),
      todaysEntries: todaysEntries.slice(-3), // Last 3 meals today
      isFasting: !!currentFast,
      fastingHours: currentFast ? Math.round((Date.now() - new Date(currentFast.startTime).getTime()) / (1000 * 60 * 60) * 10) / 10 : 0,
      recentWeight: recentWeights.length > 0 ? recentWeights[recentWeights.length - 1] : null,
      avgDailyCalories: calorieHistory.length > 0 ? Math.round(calorieHistory.reduce((sum, day) => sum + day.calories, 0) / calorieHistory.length) : null,
      unitSystem: getUnitSystem()
    };

    return context;
  } catch (error) {
    console.warn('Could not load user context:', error.message);
    return {
      todaysCalories: 0,
      todaysEntries: [],
      isFasting: false,
      fastingHours: 0,
      recentWeight: null,
      avgDailyCalories: null,
      unitSystem: getUnitSystem()
    };
  }
}

/**
 * Generate meal recommendations using AI
 * @param {string} preference - User's food preference/category (optional)
 * @param {Object} options - Additional options like meal type, dietary restrictions
 * @returns {Promise<Array>} Array of meal recommendations
 */
export async function generateMealRecommendations(preference = '', options = {}) {
  const client = getOpenAIClient();
  const context = await getUserContext();
  
  // Build the prompt based on user context and preferences
  let prompt = `As a nutrition expert, recommend 3-5 healthy meal options`;
  
  if (preference) {
    prompt += ` focusing on ${preference}`;
  }
  
  prompt += `. Consider the following user context:

Current Status:
- Today's calories consumed: ${context.todaysCalories}
- Currently fasting: ${context.isFasting ? `Yes (${context.fastingHours} hours)` : 'No'}
- Unit system: ${context.unitSystem}`;

  if (context.recentWeight) {
    prompt += `\n- Current weight: ${context.recentWeight.weight} ${context.recentWeight.unit}`;
  }

  if (context.avgDailyCalories) {
    prompt += `\n- Average daily calories: ${context.avgDailyCalories}`;
  }

  if (context.todaysEntries.length > 0) {
    prompt += `\n- Recent meals today: ${context.todaysEntries.map(e => e.description).join(', ')}`;
  }

  if (options.mealType) {
    prompt += `\n- Meal type: ${options.mealType}`;
  }

  if (options.dietaryRestrictions) {
    prompt += `\n- Dietary restrictions: ${options.dietaryRestrictions}`;
  }

  if (options.calorieTarget) {
    prompt += `\n- Target calories for this meal: ${options.calorieTarget}`;
  }

  prompt += `

Please provide recommendations in the following JSON format (respond with ONLY the JSON, no markdown formatting or code blocks):
{
  "recommendations": [
    {
      "name": "Meal name",
      "description": "Brief description",
      "calories": estimated_calories_number,
      "ingredients": ["ingredient1", "ingredient2"],
      "prep_time": "preparation time",
      "portion_size": "portion size in ${context.unitSystem} units",
      "nutrition_notes": "brief nutrition highlights"
    }
  ],
  "general_advice": "Brief personalized advice based on their current status"
}

Make sure:
- Respond with ONLY valid JSON, no markdown code blocks
- Calories are realistic and appropriate
- Portion sizes use ${context.unitSystem} measurements
- Consider their fasting status and recent meals
- Provide variety in recommendations
- Include practical, achievable meals`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a knowledgeable nutritionist who provides practical, healthy meal recommendations. Always respond with ONLY valid JSON in the exact format requested. Do not use markdown formatting, code blocks, or any other text outside the JSON structure.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.7,
    });

    const responseText = response.choices[0].message.content.trim();
    
    // Try to parse JSON response
    try {
      // First try direct parsing
      let jsonText = responseText;
      
      // If the response is wrapped in markdown code blocks, extract the JSON
      const codeBlockMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (codeBlockMatch) {
        jsonText = codeBlockMatch[1];
      }
      
      const recommendations = JSON.parse(jsonText);
      return recommendations;
    } catch (parseError) {
      console.warn('Could not parse AI response as JSON, attempting to extract from text...');
      
      // Try to extract JSON from the response text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const recommendations = JSON.parse(jsonMatch[0]);
          return recommendations;
        } catch (secondParseError) {
          console.warn('Second JSON parse attempt failed, using fallback format');
        }
      }
      
      // Fallback: create a simple structure from the text response
      return {
        recommendations: [
          {
            name: "AI Recommendation",
            description: responseText.substring(0, 200) + "...",
            calories: 400,
            ingredients: ["See full response above"],
            prep_time: "15-30 minutes",
            portion_size: "1 serving",
            nutrition_notes: "Balanced meal option"
          }
        ],
        general_advice: "Please refer to the detailed response above for complete recommendations."
      };
    }
  } catch (error) {
    console.warn('Error getting AI recommendations:', error.message);
    
    // Provide fallback recommendations
    const fallbackRecommendations = getFallbackRecommendations(preference, context);
    return fallbackRecommendations;
  }
}

/**
 * Provide fallback recommendations when AI is unavailable
 * @param {string} preference - User preference
 * @param {Object} context - User context
 * @returns {Object} Fallback recommendations
 */
function getFallbackRecommendations(preference, context) {
  const isMetric = context.unitSystem === 'metric';
  
  const fallbacks = {
    sandwiches: [
      {
        name: "Grilled Chicken Sandwich",
        description: "Lean protein with vegetables on whole grain bread",
        calories: 450,
        ingredients: ["Grilled chicken breast", "Whole grain bread", "Lettuce", "Tomato", "Avocado"],
        prep_time: "15 minutes",
        portion_size: isMetric ? "150g chicken, 2 slices bread" : "6oz chicken, 2 slices bread",
        nutrition_notes: "High protein, good fiber"
      }
    ],
    salads: [
      {
        name: "Mediterranean Salad",
        description: "Fresh vegetables with olive oil and feta cheese",
        calories: 350,
        ingredients: ["Mixed greens", "Cucumber", "Tomatoes", "Feta cheese", "Olive oil"],
        prep_time: "10 minutes",
        portion_size: isMetric ? "200g vegetables, 30g cheese" : "7oz vegetables, 1oz cheese",
        nutrition_notes: "Rich in vitamins and healthy fats"
      }
    ],
    default: [
      {
        name: "Balanced Meal",
        description: "A well-rounded meal with protein, vegetables, and healthy carbs",
        calories: 400,
        ingredients: ["Lean protein", "Vegetables", "Whole grains"],
        prep_time: "20 minutes",
        portion_size: isMetric ? "150g protein, 200g vegetables" : "6oz protein, 7oz vegetables",
        nutrition_notes: "Balanced macronutrients"
      }
    ]
  };

  const categoryKey = preference.toLowerCase();
  const recommendations = fallbacks[categoryKey] || fallbacks.default;

  return {
    recommendations,
    general_advice: `Based on your current status (${context.todaysCalories} calories today), these recommendations should help you maintain a balanced diet. ${context.isFasting ? 'Since you\'re currently fasting, consider these for when you break your fast.' : ''}`
  };
}

/**
 * Format recommendations for display
 * @param {Object} recommendations - Recommendations object from AI
 * @returns {string} Formatted text for display
 */
export function formatRecommendations(recommendations) {
  let output = '\n🍽️  MEAL RECOMMENDATIONS\n';
  output += '═'.repeat(50) + '\n\n';

  recommendations.recommendations.forEach((meal, index) => {
    output += `${index + 1}. ${meal.name}\n`;
    output += `   ${meal.description}\n`;
    output += `   📊 Calories: ${meal.calories}\n`;
    output += `   ⏱️  Prep time: ${meal.prep_time}\n`;
    output += `   📏 Portion: ${meal.portion_size}\n`;
    output += `   🥗 Ingredients: ${meal.ingredients.join(', ')}\n`;
    output += `   💡 Notes: ${meal.nutrition_notes}\n\n`;
  });

  if (recommendations.general_advice) {
    output += '💭 PERSONALIZED ADVICE\n';
    output += '─'.repeat(30) + '\n';
    output += recommendations.general_advice + '\n\n';
  }

  output += '💡 TIP: Use "fasting meal" command to log any of these meals!\n';
  
  return output;
}