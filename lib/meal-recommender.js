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
      "ingredients": ["ingredient1 with quantity", "ingredient2 with quantity", "seasoning/spices"],
      "recipe": [
        "Step 1: Detailed preparation instruction with specific techniques",
        "Step 2: Cooking method with temperatures and timing",
        "Step 3: Assembly or finishing steps",
        "Step 4: Serving suggestions"
      ],
      "prep_time": "preparation time",
      "cook_time": "cooking time",
      "total_time": "total time",
      "portion_size": "portion size in ${context.unitSystem} units",
      "nutrition_notes": "brief nutrition highlights and health benefits",
      "tips": "helpful cooking tips, variations, or substitutions"
    }
  ],
  "general_advice": "Brief personalized advice based on their current status"
}

RECIPE REQUIREMENTS - Each recipe MUST include:
- Complete ingredient list with quantities (use ${context.unitSystem} measurements)
- Detailed step-by-step cooking instructions (minimum 4-6 steps)
- Specific cooking temperatures, times, and techniques
- Proper seasoning and flavor development steps
- Assembly and plating instructions
- Food safety considerations where relevant

Make sure:
- Respond with ONLY valid JSON, no markdown code blocks
- Calories are realistic and appropriate for the meal type
- Portion sizes use ${context.unitSystem} measurements consistently
- Consider their fasting status and recent meals for appropriate recommendations
- Provide variety in cooking methods and cuisines
- Include practical, achievable meals with common ingredients
- Recipe steps should be detailed enough for a beginner to follow successfully
- Include helpful cooking tips, ingredient substitutions, and variations
- Specify prep time, cook time, and total time accurately
- Ensure ingredients list includes quantities and measurements
- Focus on balanced nutrition and flavor development`;

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
        ingredients: [
          isMetric ? "150g boneless chicken breast" : "6oz boneless chicken breast",
          "2 slices whole grain bread",
          "2-3 lettuce leaves",
          "1 medium tomato",
          "1/2 ripe avocado",
          "1 tbsp olive oil",
          "1/2 tsp salt",
          "1/4 tsp black pepper",
          "1 tsp lemon juice (optional)"
        ],
        recipe: [
          "Pat chicken breast dry and season both sides with salt and pepper, let sit for 5 minutes",
          "Heat grill pan or outdoor grill to medium-high heat (about 400°F/200°C)",
          "Brush chicken with half the olive oil and place on grill",
          "Grill for 6-7 minutes per side without moving, until internal temperature reaches 165°F (74°C)",
          "Remove chicken and let rest for 3 minutes to retain juices, then slice diagonally",
          "Toast bread slices until golden brown and crispy",
          "Mash avocado with lemon juice and a pinch of salt",
          "Wash and dry lettuce, slice tomato into 1/4 inch rounds",
          "Assemble sandwich: spread avocado mash on one slice, layer lettuce, tomato, and sliced chicken",
          "Top with second slice of bread, press gently, and cut diagonally to serve"
        ],
        prep_time: "10 minutes",
        cook_time: "15 minutes",
        total_time: "25 minutes",
        portion_size: isMetric ? "150g chicken, 2 slices bread" : "6oz chicken, 2 slices bread",
        nutrition_notes: "High protein (35g), good fiber from whole grains, healthy fats from avocado",
        tips: "For extra flavor, marinate chicken in lemon juice and herbs for 30 minutes before grilling. Chicken can be grilled ahead and stored in fridge for 3 days."
      }
    ],
    salads: [
      {
        name: "Mediterranean Salad",
        description: "Fresh vegetables with olive oil and feta cheese",
        calories: 350,
        ingredients: [
          isMetric ? "150g mixed greens (arugula, spinach, lettuce)" : "5oz mixed greens (arugula, spinach, lettuce)",
          "1 medium cucumber",
          isMetric ? "200g cherry tomatoes" : "1 cup cherry tomatoes",
          "1/4 medium red onion",
          isMetric ? "60g feta cheese" : "2oz feta cheese",
          "10-12 Kalamata olives",
          "3 tbsp extra virgin olive oil",
          "2 tbsp fresh lemon juice",
          "1 tsp dried oregano",
          "1/4 tsp salt",
          "1/4 tsp black pepper"
        ],
        recipe: [
          "Wash mixed greens in cold water, spin dry thoroughly, and tear into bite-sized pieces",
          "Peel cucumber and dice into 1/2 inch cubes, removing seeds if desired",
          "Wash cherry tomatoes and cut in half lengthwise",
          "Slice red onion into thin half-moons, soak in cold water for 5 minutes to reduce sharpness, then drain",
          "Crumble feta cheese into bite-sized chunks using your hands or a fork",
          "In a large salad bowl, layer the greens as a base",
          "Arrange cucumber, tomatoes, and drained onion over the greens",
          "In a small bowl, whisk together olive oil, lemon juice, oregano, salt, and pepper until emulsified",
          "Drizzle dressing evenly over salad and toss gently with salad tongs",
          "Top with crumbled feta cheese and olives",
          "Let sit for 2-3 minutes for flavors to meld, then serve immediately"
        ],
        prep_time: "15 minutes",
        cook_time: "0 minutes",
        total_time: "15 minutes",
        portion_size: isMetric ? "200g vegetables, 60g cheese" : "7oz vegetables, 2oz cheese",
        nutrition_notes: "Rich in vitamins A, C, K, healthy monounsaturated fats, and calcium from feta",
        tips: "For best flavor, use room temperature ingredients. Add protein like grilled chicken or chickpeas to make it a complete meal."
      }
    ],
    pasta: [
      {
        name: "Garlic Lemon Pasta with Vegetables",
        description: "Light pasta dish with seasonal vegetables and fresh herbs",
        calories: 420,
        ingredients: [
          isMetric ? "100g whole wheat pasta (penne or fusilli)" : "3.5oz whole wheat pasta (penne or fusilli)",
          "1 medium zucchini",
          "1 red bell pepper",
          "1 yellow bell pepper",
          "4 cloves garlic",
          "1 large lemon (juice and zest)",
          "4 tbsp extra virgin olive oil",
          "1/4 cup fresh basil leaves",
          isMetric ? "30g Parmesan cheese, grated" : "1oz Parmesan cheese, grated",
          "1 tsp salt (for pasta water)",
          "1/2 tsp salt (for seasoning)",
          "1/4 tsp black pepper",
          "Red pepper flakes (optional)"
        ],
        recipe: [
          "Fill a large pot with water, add 1 tsp salt, and bring to a rolling boil",
          "Add pasta and cook according to package directions until al dente (usually 8-10 minutes)",
          "While pasta cooks, wash and dice zucchini into 1/2 inch cubes",
          "Remove seeds from bell peppers and cut into thin strips",
          "Mince garlic cloves finely and zest the lemon",
          "Heat olive oil in a large skillet over medium heat",
          "Add minced garlic and cook for 30-60 seconds until fragrant but not browned",
          "Add bell peppers and cook for 3-4 minutes until slightly softened",
          "Add zucchini and cook for 3-4 minutes until tender-crisp",
          "Reserve 1/2 cup pasta cooking water, then drain pasta",
          "Add drained pasta to the skillet with vegetables",
          "Add lemon juice, lemon zest, and 1/4 cup pasta water",
          "Toss everything together, adding more pasta water if needed for silky consistency",
          "Remove from heat, add torn basil leaves and grated Parmesan",
          "Season with salt, pepper, and red pepper flakes if desired",
          "Serve immediately while hot"
        ],
        prep_time: "15 minutes",
        cook_time: "15 minutes",
        total_time: "30 minutes",
        portion_size: isMetric ? "100g pasta, 200g vegetables" : "3.5oz pasta, 7oz vegetables",
        nutrition_notes: "Good source of fiber, vitamins A and C, complex carbohydrates",
        tips: "Save pasta water before draining - the starch helps create a silky sauce. Don't overcook vegetables to maintain their vibrant color and crunch."
      }
    ],
    breakfast: [
      {
        name: "Veggie Scrambled Eggs",
        description: "Protein-rich breakfast with colorful vegetables",
        calories: 320,
        ingredients: [
          "3 large eggs",
          isMetric ? "50g fresh spinach leaves" : "2 cups fresh spinach leaves",
          "1/2 red bell pepper",
          isMetric ? "60g button mushrooms" : "2oz button mushrooms",
          "1/4 medium yellow onion",
          isMetric ? "30g shredded cheese (cheddar or Swiss)" : "1oz shredded cheese (cheddar or Swiss)",
          "1 tbsp olive oil",
          "2 tbsp milk or cream",
          "1/2 tsp salt",
          "1/4 tsp black pepper",
          "1/4 tsp garlic powder (optional)",
          "Fresh chives for garnish (optional)"
        ],
        recipe: [
          "Crack eggs into a bowl, add milk, salt, pepper, and garlic powder",
          "Whisk eggs vigorously for 30 seconds until well combined and slightly frothy",
          "Dice bell pepper into small 1/4 inch pieces",
          "Slice mushrooms into thin pieces and dice onion finely",
          "Wash spinach leaves and remove any thick stems",
          "Heat olive oil in a non-stick pan over medium-low heat",
          "Add diced onion and cook for 2-3 minutes until translucent",
          "Add bell pepper and mushrooms, cook for 3-4 minutes until softened",
          "Add spinach and cook for 1 minute until just wilted",
          "Pour beaten eggs into the pan and let sit for 30 seconds without stirring",
          "Using a spatula, gently push eggs from edges toward center, tilting pan to let uncooked egg flow underneath",
          "Continue this process for 2-3 minutes until eggs are almost set but still slightly wet",
          "Sprinkle cheese over eggs and gently fold in",
          "Remove from heat immediately and let residual heat finish cooking for 30 seconds",
          "Garnish with fresh chives if desired and serve immediately"
        ],
        prep_time: "10 minutes",
        cook_time: "8 minutes",
        total_time: "18 minutes",
        portion_size: isMetric ? "3 eggs, 140g vegetables" : "3 eggs, 5oz vegetables",
        nutrition_notes: "High protein (22g), rich in vitamins A, K, folate, and B12",
        tips: "Keep heat at medium-low to prevent eggs from becoming rubbery. Add a splash of milk for creamier texture. Vegetables can be prepped the night before."
      }
    ],
    default: [
      {
        name: "Baked Salmon with Roasted Vegetables",
        description: "A well-rounded meal with protein, vegetables, and healthy fats",
        calories: 400,
        ingredients: [
          isMetric ? "150g salmon fillet (skin-on or skinless)" : "6oz salmon fillet (skin-on or skinless)",
          isMetric ? "200g broccoli florets" : "1 large head broccoli, cut into florets",
          "1 medium sweet potato",
          "3 tbsp extra virgin olive oil",
          "1 large lemon (juice and wedges)",
          "3 cloves garlic",
          "1 tsp fresh thyme (or 1/2 tsp dried)",
          "1 tsp salt",
          "1/2 tsp black pepper",
          "1/4 tsp paprika",
          "Fresh parsley for garnish (optional)"
        ],
        recipe: [
          "Preheat oven to 425°F (220°C) and line a large baking sheet with parchment paper",
          "Wash and peel sweet potato, then cut into 3/4 inch cubes",
          "Cut broccoli into uniform florets for even cooking",
          "In a large bowl, toss sweet potato cubes with 1 tbsp olive oil, 1/2 tsp salt, and 1/4 tsp pepper",
          "Spread sweet potato on one side of the baking sheet and roast for 15 minutes",
          "Meanwhile, toss broccoli with 1 tbsp olive oil, remaining salt and pepper",
          "After 15 minutes, add broccoli to the baking sheet with sweet potato",
          "Pat salmon dry with paper towels and season both sides with salt, pepper, thyme, and paprika",
          "Mince garlic and mix with remaining 1 tbsp olive oil and lemon juice",
          "Make space on the baking sheet and place salmon skin-side down",
          "Brush salmon with the garlic-oil mixture",
          "Return to oven and bake for 12-15 minutes until salmon flakes easily with a fork",
          "Internal temperature of salmon should reach 145°F (63°C)",
          "Remove from oven and let rest for 2-3 minutes",
          "Garnish with fresh parsley and serve with lemon wedges"
        ],
        prep_time: "15 minutes",
        cook_time: "27 minutes",
        total_time: "42 minutes",
        portion_size: isMetric ? "150g salmon, 200g vegetables" : "6oz salmon, 7oz vegetables",
        nutrition_notes: "Balanced macronutrients, omega-3 fatty acids, vitamins A and C, fiber",
        tips: "Don't overcook salmon - it should be slightly pink in the center. If using skin-on salmon, place skin-side down for crispy skin. Vegetables can be prepped ahead of time."
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
    
    // Time information
    if (meal.prep_time && meal.cook_time && meal.total_time) {
      output += `   ⏱️  Prep: ${meal.prep_time} | Cook: ${meal.cook_time} | Total: ${meal.total_time}\n`;
    } else if (meal.prep_time) {
      output += `   ⏱️  Prep time: ${meal.prep_time}\n`;
    }
    
    output += `   📏 Portion: ${meal.portion_size}\n`;
    output += `   🥗 Ingredients: ${meal.ingredients.join(', ')}\n`;
    
    // Recipe instructions
    if (meal.recipe && Array.isArray(meal.recipe) && meal.recipe.length > 0) {
      output += `   👨‍🍳 Recipe:\n`;
      meal.recipe.forEach((step, stepIndex) => {
        output += `      ${stepIndex + 1}. ${step}\n`;
      });
    }
    
    output += `   � Notes: ${meal.nutrition_notes}\n`;
    
    // Cooking tips
    if (meal.tips) {
      output += `   💭 Tip: ${meal.tips}\n`;
    }
    
    output += '\n';
  });

  if (recommendations.general_advice) {
    output += '💭 PERSONALIZED ADVICE\n';
    output += '─'.repeat(30) + '\n';
    output += recommendations.general_advice + '\n\n';
  }

  output += '💡 TIP: Use "fasting meal" command to log any of these meals!\n';
  
  return output;
}