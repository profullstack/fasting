import OpenAI from 'openai';
import { getOpenAIKey, getUnitSystem } from './config.js';
import { getTodaysEntries } from './index.js';
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
 * Get user context for better drink recommendations
 * @returns {Promise<Object>} User context including recent drinks, fasting status, etc.
 */
async function getUserContext() {
  try {
    const [todaysEntries, currentFast, recentWeights] = await Promise.all([
      getTodaysEntries(),
      getCurrentFast(),
      getWeightHistory()
    ]);

    // Filter for drinks only
    const todaysDrinks = todaysEntries.filter(entry => entry.type === 'drink');

    const context = {
      todaysDrinks,
      todaysCalories: todaysEntries.reduce((sum, entry) => sum + entry.calories, 0),
      isFasting: !!currentFast,
      fastingHours: currentFast ? Math.round((Date.now() - new Date(currentFast.startTime).getTime()) / (1000 * 60 * 60) * 10) / 10 : 0,
      recentWeight: recentWeights.length > 0 ? recentWeights[recentWeights.length - 1] : null,
      unitSystem: getUnitSystem()
    };

    return context;
  } catch (error) {
    console.warn('Could not load user context:', error.message);
    return {
      todaysDrinks: [],
      todaysCalories: 0,
      isFasting: false,
      fastingHours: 0,
      recentWeight: null,
      unitSystem: getUnitSystem()
    };
  }
}

/**
 * Generate drink recommendations using AI
 * @param {string} preference - User's drink preference/category (optional)
 * @param {Object} options - Additional options like type, calories, dietary restrictions
 * @returns {Promise<Array>} Array of drink recommendations
 */
export async function generateDrinkRecommendations(preference = '', options = {}) {
  const client = getOpenAIClient();
  const context = await getUserContext();
  
  // Build the prompt based on user context and preferences
  let prompt = `As a nutrition expert, recommend 3-5 healthy drink options`;
  
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

  if (context.todaysDrinks.length > 0) {
    prompt += `\n- Today's drinks: ${context.todaysDrinks.map(d => d.description).join(', ')}`;
  }

  if (options.drinkType) {
    prompt += `\n- Drink type: ${options.drinkType}`;
  }

  if (options.dietaryRestrictions) {
    prompt += `\n- Dietary restrictions: ${options.dietaryRestrictions}`;
  }

  if (options.calorieTarget) {
    prompt += `\n- Target calories for this drink: ${options.calorieTarget}`;
  }

  if (options.purpose) {
    prompt += `\n- Purpose: ${options.purpose} (e.g., hydration, energy, post-workout, relaxation)`;
  }

  prompt += `

Please provide recommendations in the following JSON format (respond with ONLY the JSON, no markdown formatting or code blocks):
{
  "recommendations": [
    {
      "name": "Drink name",
      "description": "Brief description of the drink",
      "calories": estimated_calories_number,
      "ingredients": ["ingredient1 with quantity", "ingredient2 with quantity"],
      "recipe": [
        "Step 1: Preparation instructions",
        "Step 2: Mixing or brewing instructions",
        "Step 3: Serving suggestions"
      ],
      "prep_time": "preparation time",
      "serving_size": "serving size in ${context.unitSystem} units",
      "nutrition_notes": "brief nutrition highlights and health benefits",
      "best_time": "optimal time to consume (morning, afternoon, evening, etc.)",
      "temperature": "hot/cold/room temperature",
      "variations": "alternative ingredients or modifications"
    }
  ],
  "general_advice": "Brief personalized advice based on their current status"
}

DRINK REQUIREMENTS - Each drink MUST include:
- Complete ingredient list with quantities (use ${context.unitSystem} measurements)
- Clear preparation instructions
- Nutritional benefits and purpose
- Optimal serving temperature and timing
- Variations or substitutions

Make sure:
- Respond with ONLY valid JSON, no markdown code blocks
- Calories are realistic for the drink type
- Serving sizes use ${context.unitSystem} measurements consistently
- Consider their fasting status (fasting-friendly drinks if currently fasting)
- Provide variety in drink types (smoothies, teas, infused waters, etc.)
- Include practical, achievable recipes with common ingredients
- Focus on hydration and health benefits
- Consider the time of day and purpose of the drink`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a knowledgeable nutritionist who provides healthy drink recommendations. Always respond with ONLY valid JSON in the exact format requested. Do not use markdown formatting, code blocks, or any other text outside the JSON structure.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1200,
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
            name: "AI Drink Recommendation",
            description: responseText.substring(0, 200) + "...",
            calories: 50,
            ingredients: ["See full response above"],
            prep_time: "5 minutes",
            serving_size: "1 cup",
            nutrition_notes: "Healthy beverage option"
          }
        ],
        general_advice: "Please refer to the detailed response above for complete recommendations."
      };
    }
  } catch (error) {
    console.warn('Error getting AI recommendations:', error.message);
    
    // Provide fallback recommendations
    const fallbackRecommendations = getFallbackDrinkRecommendations(preference, context);
    return fallbackRecommendations;
  }
}

/**
 * Provide fallback drink recommendations when AI is unavailable
 * @param {string} preference - User preference
 * @param {Object} context - User context
 * @returns {Object} Fallback recommendations
 */
function getFallbackDrinkRecommendations(preference, context) {
  const isMetric = context.unitSystem === 'metric';
  
  const fallbacks = {
    smoothies: [
      {
        name: "Green Power Smoothie",
        description: "Nutrient-packed smoothie with spinach, banana, and protein",
        calories: 250,
        ingredients: [
          isMetric ? "200ml unsweetened almond milk" : "3/4 cup unsweetened almond milk",
          "1 medium banana",
          isMetric ? "50g fresh spinach leaves" : "2 cups fresh spinach leaves",
          "1 tbsp almond butter",
          "1 tsp honey (optional)",
          isMetric ? "100g frozen mango chunks" : "1/2 cup frozen mango chunks",
          "1/2 tsp vanilla extract",
          isMetric ? "150ml ice cubes" : "1/2 cup ice cubes"
        ],
        recipe: [
          "Add almond milk to blender first for easier blending",
          "Add spinach leaves and blend until smooth to avoid chunks",
          "Add banana, mango, almond butter, honey, and vanilla",
          "Blend on high speed for 60-90 seconds until completely smooth",
          "Add ice cubes and blend for another 30 seconds",
          "Pour into a tall glass and serve immediately"
        ],
        prep_time: "5 minutes",
        serving_size: isMetric ? "400ml" : "14 fl oz",
        nutrition_notes: "High in vitamins A, C, K, potassium, and healthy fats",
        best_time: "Morning or post-workout",
        temperature: "Cold",
        variations: "Substitute spinach with kale, or add protein powder for extra protein"
      }
    ],
    tea: [
      {
        name: "Ginger Lemon Green Tea",
        description: "Antioxidant-rich green tea with digestive benefits",
        calories: 5,
        ingredients: [
          "1 green tea bag or 1 tsp loose green tea",
          isMetric ? "250ml hot water (80°C)" : "1 cup hot water (175°F)",
          "1 inch fresh ginger root",
          "1/2 fresh lemon (juice)",
          "1 tsp honey (optional)"
        ],
        recipe: [
          "Slice fresh ginger into thin rounds",
          "Heat water to 175°F (80°C) - not boiling to avoid bitter tea",
          "Add ginger slices to hot water and steep for 2 minutes",
          "Add green tea bag or loose tea and steep for 2-3 minutes",
          "Remove tea bag/strain loose tea and ginger",
          "Add fresh lemon juice and honey if desired",
          "Stir gently and serve hot"
        ],
        prep_time: "7 minutes",
        serving_size: isMetric ? "250ml" : "8 fl oz",
        nutrition_notes: "Rich in antioxidants, supports metabolism and digestion",
        best_time: "Morning or afternoon (avoid late evening due to caffeine)",
        temperature: "Hot",
        variations: "Try with mint leaves or substitute with white tea for less caffeine"
      }
    ],
    water: [
      {
        name: "Cucumber Mint Infused Water",
        description: "Refreshing hydrating water with natural flavors",
        calories: 5,
        ingredients: [
          isMetric ? "500ml cold water" : "2 cups cold water",
          "1/2 medium cucumber",
          "8-10 fresh mint leaves",
          "1/2 lime (sliced)",
          isMetric ? "150ml ice cubes" : "1/2 cup ice cubes"
        ],
        recipe: [
          "Wash cucumber and slice into thin rounds",
          "Gently muddle mint leaves in the bottom of a pitcher to release oils",
          "Add cucumber slices and lime slices to the pitcher",
          "Pour cold water over the ingredients",
          "Add ice cubes and stir gently",
          "Refrigerate for at least 30 minutes for best flavor",
          "Serve over ice and garnish with extra mint"
        ],
        prep_time: "5 minutes (plus 30 minutes infusion time)",
        serving_size: isMetric ? "250ml" : "8 fl oz",
        nutrition_notes: "Excellent for hydration, contains vitamins and minerals",
        best_time: "Any time, especially during hot weather",
        temperature: "Cold",
        variations: "Try with lemon and basil, or strawberry and mint"
      }
    ],
    coffee: [
      {
        name: "Iced Vanilla Almond Coffee",
        description: "Creamy iced coffee with natural sweeteners",
        calories: 80,
        ingredients: [
          isMetric ? "200ml strong cold brew coffee" : "3/4 cup strong cold brew coffee",
          isMetric ? "100ml unsweetened almond milk" : "1/3 cup unsweetened almond milk",
          "1/2 tsp vanilla extract",
          "1 tsp maple syrup or honey",
          isMetric ? "150ml ice cubes" : "1/2 cup ice cubes",
          "Cinnamon for dusting (optional)"
        ],
        recipe: [
          "Brew strong coffee and let it cool, or use pre-made cold brew",
          "In a tall glass, combine vanilla extract and maple syrup",
          "Add a splash of almond milk and stir to combine sweeteners",
          "Fill glass with ice cubes",
          "Pour cold coffee over ice, leaving room for more milk",
          "Top with remaining almond milk",
          "Stir gently and dust with cinnamon if desired"
        ],
        prep_time: "3 minutes (plus coffee brewing time)",
        serving_size: isMetric ? "300ml" : "10 fl oz",
        nutrition_notes: "Provides caffeine and antioxidants with lower calories than traditional coffee drinks",
        best_time: "Morning or early afternoon",
        temperature: "Cold",
        variations: "Use coconut milk instead of almond, or add a dash of cocoa powder"
      }
    ],
    default: [
      {
        name: "Lemon Honey Water",
        description: "Simple, hydrating drink with vitamin C and natural sweetness",
        calories: 25,
        ingredients: [
          isMetric ? "250ml warm water" : "1 cup warm water",
          "1/2 fresh lemon (juice)",
          "1 tsp raw honey",
          "Pinch of sea salt (optional)"
        ],
        recipe: [
          "Heat water to warm but not boiling temperature",
          "Squeeze fresh lemon juice into a mug",
          "Add honey and optional sea salt",
          "Pour warm water over the mixture",
          "Stir well until honey is completely dissolved",
          "Drink while warm for best benefits"
        ],
        prep_time: "3 minutes",
        serving_size: isMetric ? "250ml" : "8 fl oz",
        nutrition_notes: "Supports hydration, provides vitamin C, and may aid digestion",
        best_time: "First thing in the morning or when feeling under the weather",
        temperature: "Warm",
        variations: "Add fresh ginger for extra digestive benefits, or mint for refreshing taste"
      }
    ]
  };

  const categoryKey = preference.toLowerCase();
  const recommendations = fallbacks[categoryKey] || fallbacks.default;

  return {
    recommendations,
    general_advice: `Based on your current status, these drinks should support your hydration and nutrition goals. ${context.isFasting ? 'Since you\'re currently fasting, focus on zero or very low-calorie options like herbal teas or infused water.' : ''}`
  };
}

/**
 * Format drink recommendations for display
 * @param {Object} recommendations - Recommendations object from AI
 * @returns {string} Formatted text for display
 */
export function formatDrinkRecommendations(recommendations) {
  let output = '\n🥤 DRINK RECOMMENDATIONS\n';
  output += '═'.repeat(50) + '\n\n';

  recommendations.recommendations.forEach((drink, index) => {
    output += `${index + 1}. ${drink.name}\n`;
    output += `   ${drink.description}\n`;
    output += `   📊 Calories: ${drink.calories}\n`;
    output += `   🌡️  Temperature: ${drink.temperature}\n`;
    output += `   ⏰ Best time: ${drink.best_time}\n`;
    
    if (drink.prep_time) {
      output += `   ⏱️  Prep time: ${drink.prep_time}\n`;
    }
    
    output += `   📏 Serving: ${drink.serving_size}\n`;
    output += `   🥗 Ingredients: ${drink.ingredients.join(', ')}\n`;
    
    // Recipe instructions
    if (drink.recipe && Array.isArray(drink.recipe) && drink.recipe.length > 0) {
      output += `   👨‍🍳 Recipe:\n`;
      drink.recipe.forEach((step, stepIndex) => {
        output += `      ${stepIndex + 1}. ${step}\n`;
      });
    }
    
    output += `   ✨ Benefits: ${drink.nutrition_notes}\n`;
    
    // Variations
    if (drink.variations) {
      output += `   🔄 Variations: ${drink.variations}\n`;
    }
    
    output += '\n';
  });

  if (recommendations.general_advice) {
    output += '💭 PERSONALIZED ADVICE\n';
    output += '─'.repeat(30) + '\n';
    output += recommendations.general_advice + '\n\n';
  }

  output += '💡 TIP: Use "fasting drink" command to log any of these beverages!\n';
  
  return output;
}