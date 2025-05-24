import OpenAI from 'openai';
import { getOpenAIKey, getUnitSystem, getUserProfile } from './config.js';
import { getTodaysExercises, getExerciseHistory } from './exercise.js';
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
 * Get user context for better exercise recommendations
 * @returns {Promise<Object>} User context including recent exercises, fasting status, etc.
 */
async function getUserContext() {
  try {
    const [todaysExercises, currentFast, recentWeights, exerciseHistory] = await Promise.all([
      getTodaysExercises(),
      getCurrentFast(),
      getWeightHistory(),
      getExerciseHistory()
    ]);

    const userProfile = getUserProfile();

    const context = {
      todaysExercises,
      todaysCaloriesBurned: todaysExercises.reduce((sum, exercise) => sum + (exercise.caloriesBurned || 0), 0),
      isFasting: !!currentFast,
      fastingHours: currentFast ? Math.round((Date.now() - new Date(currentFast.startTime).getTime()) / (1000 * 60 * 60) * 10) / 10 : 0,
      recentWeight: recentWeights.length > 0 ? recentWeights[recentWeights.length - 1] : null,
      avgDailyCaloriesBurned: exerciseHistory.length > 0 ? Math.round(exerciseHistory.reduce((sum, day) => sum + day.caloriesBurned, 0) / exerciseHistory.length) : null,
      unitSystem: getUnitSystem(),
      activityLevel: userProfile.activityLevel,
      medicalConditions: userProfile.medicalConditions
    };

    return context;
  } catch (error) {
    console.warn('Could not load user context:', error.message);
    const userProfile = getUserProfile();
    return {
      todaysExercises: [],
      todaysCaloriesBurned: 0,
      isFasting: false,
      fastingHours: 0,
      recentWeight: null,
      avgDailyCaloriesBurned: null,
      unitSystem: getUnitSystem(),
      activityLevel: userProfile.activityLevel,
      medicalConditions: userProfile.medicalConditions
    };
  }
}

/**
 * Generate exercise recommendations using AI
 * @param {string} preference - User's exercise preference/category (optional)
 * @param {Object} options - Additional options like duration, intensity, equipment
 * @returns {Promise<Array>} Array of exercise recommendations
 */
export async function generateExerciseRecommendations(preference = '', options = {}) {
  const client = getOpenAIClient();
  const context = await getUserContext();
  
  // Build the prompt based on user context and preferences
  let prompt = `As a fitness expert, recommend 3-5 exercise routines`;
  
  if (preference) {
    prompt += ` focusing on ${preference}`;
  }
  
  prompt += `. Consider the following user context:

Current Status:
- Today's calories burned: ${context.todaysCaloriesBurned}
- Currently fasting: ${context.isFasting ? `Yes (${context.fastingHours} hours)` : 'No'}
- Unit system: ${context.unitSystem}
- Activity level: ${context.activityLevel}`;

  if (context.medicalConditions.length > 0) {
    prompt += `\n- Medical conditions: ${context.medicalConditions.join(', ')}`;
  }

  if (context.recentWeight) {
    prompt += `\n- Current weight: ${context.recentWeight.weight} ${context.recentWeight.unit}`;
  }

  if (context.avgDailyCaloriesBurned) {
    prompt += `\n- Average daily calories burned: ${context.avgDailyCaloriesBurned}`;
  }

  if (context.todaysExercises.length > 0) {
    prompt += `\n- Today's exercises: ${context.todaysExercises.map(e => `${e.description} (${e.duration} min)`).join(', ')}`;
  }

  if (options.duration) {
    prompt += `\n- Target duration: ${options.duration} minutes`;
  }

  if (options.intensity) {
    prompt += `\n- Preferred intensity: ${options.intensity}`;
  }

  if (options.equipment) {
    prompt += `\n- Available equipment: ${options.equipment}`;
  }

  if (options.location) {
    prompt += `\n- Location preference: ${options.location}`;
  }

  prompt += `

Please provide recommendations in the following JSON format (respond with ONLY the JSON, no markdown formatting or code blocks):
{
  "recommendations": [
    {
      "name": "Exercise name",
      "description": "Brief description of the workout",
      "duration": estimated_duration_in_minutes,
      "calories_burned": estimated_calories_burned,
      "intensity": "low/moderate/high",
      "equipment": ["equipment1", "equipment2", "none"],
      "instructions": [
        "Step 1: Detailed warm-up instructions",
        "Step 2: Main exercise instructions with proper form",
        "Step 3: Cool-down and stretching instructions"
      ],
      "sets_reps": "Sets and reps information or time-based instructions",
      "target_muscles": ["muscle1", "muscle2"],
      "benefits": "Health and fitness benefits",
      "modifications": "Easier or harder variations",
      "safety_tips": "Important safety considerations"
    }
  ],
  "general_advice": "Brief personalized advice based on their current status"
}

EXERCISE REQUIREMENTS - Each exercise MUST include:
- Clear step-by-step instructions with proper form cues
- Specific duration, sets, or reps information
- Target muscle groups and benefits
- Equipment needed (or "none" for bodyweight)
- Safety tips and proper form guidance
- Modifications for different fitness levels

Make sure:
- Respond with ONLY valid JSON, no markdown code blocks
- Calories burned are realistic for the exercise type, duration, and user's activity level
- Consider their fasting status for exercise intensity recommendations
- Consider their activity level (${context.activityLevel}) for appropriate exercise intensity and duration
${context.medicalConditions.length > 0 ? `- Consider their medical conditions (${context.medicalConditions.join(', ')}) and recommend safe, appropriate exercises with modifications` : ''}
- Provide variety in exercise types (cardio, strength, flexibility)
- Include practical, achievable exercises
- Instructions should be detailed enough for a beginner to follow safely
- Include proper warm-up and cool-down guidance
- Specify equipment clearly or note if bodyweight only
- Consider their recent exercise history to avoid overtraining`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a knowledgeable fitness trainer who provides safe, effective exercise recommendations. Consider the user's activity level (${context.activityLevel}) and medical conditions (${context.medicalConditions.join(', ') || 'none'}) when making recommendations. Always respond with ONLY valid JSON in the exact format requested. Do not use markdown formatting, code blocks, or any other text outside the JSON structure.`
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
            name: "AI Exercise Recommendation",
            description: responseText.substring(0, 200) + "...",
            duration: 30,
            calories_burned: 150,
            intensity: "moderate",
            equipment: ["none"],
            instructions: ["See full response above"],
            sets_reps: "As recommended above",
            target_muscles: ["full body"],
            benefits: "General fitness improvement"
          }
        ],
        general_advice: "Please refer to the detailed response above for complete recommendations."
      };
    }
  } catch (error) {
    console.warn('Error getting AI recommendations:', error.message);
    
    // Provide fallback recommendations
    const fallbackRecommendations = getFallbackExerciseRecommendations(preference, context);
    return fallbackRecommendations;
  }
}

/**
 * Provide fallback exercise recommendations when AI is unavailable
 * @param {string} preference - User preference
 * @param {Object} context - User context
 * @returns {Object} Fallback recommendations
 */
function getFallbackExerciseRecommendations(preference, context) {
  const fallbacks = {
    cardio: [
      {
        name: "Interval Walking/Jogging",
        description: "Low-impact cardio that alternates between walking and jogging",
        duration: 30,
        calories_burned: 200,
        intensity: "moderate",
        equipment: ["none"],
        instructions: [
          "Warm up with 5 minutes of slow walking",
          "Alternate 2 minutes of brisk walking with 1 minute of light jogging",
          "Repeat the walking/jogging cycle 8 times",
          "Cool down with 5 minutes of slow walking and stretching"
        ],
        sets_reps: "8 cycles of 3 minutes each",
        target_muscles: ["legs", "cardiovascular system"],
        benefits: "Improves cardiovascular health, burns calories, builds endurance",
        modifications: "Beginners: walk only. Advanced: increase jogging intervals",
        safety_tips: "Stay hydrated, listen to your body, stop if you feel dizzy"
      }
    ],
    strength: [
      {
        name: "Bodyweight Strength Circuit",
        description: "Full-body strength workout using only bodyweight exercises",
        duration: 25,
        calories_burned: 150,
        intensity: "moderate",
        equipment: ["none"],
        instructions: [
          "Warm up with 5 minutes of light movement (arm circles, leg swings)",
          "Perform each exercise for 45 seconds, rest 15 seconds between exercises",
          "Complete 3 rounds of the circuit with 2-minute rest between rounds",
          "Cool down with 5 minutes of stretching"
        ],
        sets_reps: "3 rounds of 6 exercises, 45 seconds each",
        target_muscles: ["full body", "core", "arms", "legs"],
        benefits: "Builds functional strength, improves muscle tone, no equipment needed",
        modifications: "Easier: reduce time to 30 seconds. Harder: add jump variations",
        safety_tips: "Focus on proper form over speed, modify exercises as needed"
      }
    ],
    yoga: [
      {
        name: "Beginner Yoga Flow",
        description: "Gentle yoga sequence for flexibility and relaxation",
        duration: 20,
        calories_burned: 80,
        intensity: "low",
        equipment: ["yoga mat (optional)"],
        instructions: [
          "Start in child's pose for 1 minute to center yourself",
          "Move through cat-cow stretches for spinal mobility",
          "Flow through sun salutation sequence 3 times",
          "Hold warrior poses and downward dog for strength and balance",
          "End with 5 minutes in savasana (corpse pose) for relaxation"
        ],
        sets_reps: "Hold each pose for 30-60 seconds",
        target_muscles: ["full body", "core", "flexibility"],
        benefits: "Improves flexibility, reduces stress, enhances mind-body connection",
        modifications: "Use blocks or straps for support, skip challenging poses",
        safety_tips: "Never force a stretch, breathe deeply, listen to your body"
      }
    ],
    default: [
      {
        name: "Quick Full-Body Workout",
        description: "Efficient workout combining cardio and strength",
        duration: 20,
        calories_burned: 120,
        intensity: "moderate",
        equipment: ["none"],
        instructions: [
          "Warm up with 3 minutes of marching in place and arm swings",
          "Perform jumping jacks for 1 minute",
          "Do bodyweight squats for 1 minute",
          "Perform push-ups (modified as needed) for 1 minute",
          "Hold plank position for 30 seconds",
          "Repeat the circuit 3 times with 1-minute rest between rounds",
          "Cool down with 3 minutes of stretching"
        ],
        sets_reps: "3 rounds of 4 exercises",
        target_muscles: ["full body", "cardiovascular system"],
        benefits: "Time-efficient, improves both strength and cardio fitness",
        modifications: "Beginners: reduce intensity. Advanced: add weights or resistance",
        safety_tips: "Maintain proper form, stay hydrated, rest when needed"
      }
    ]
  };

  const categoryKey = preference.toLowerCase();
  const recommendations = fallbacks[categoryKey] || fallbacks.default;

  return {
    recommendations,
    general_advice: `Based on your current status (${context.todaysCaloriesBurned} calories burned today), these exercises should complement your fitness routine. ${context.isFasting ? 'Since you\'re currently fasting, consider lower intensity exercises and stay well hydrated.' : ''}`
  };
}

/**
 * Format exercise recommendations for display
 * @param {Object} recommendations - Recommendations object from AI
 * @returns {string} Formatted text for display
 */
export function formatExerciseRecommendations(recommendations) {
  let output = '\n🏃‍♂️ EXERCISE RECOMMENDATIONS\n';
  output += '═'.repeat(50) + '\n\n';

  recommendations.recommendations.forEach((exercise, index) => {
    output += `${index + 1}. ${exercise.name}\n`;
    output += `   ${exercise.description}\n`;
    output += `   ⏱️  Duration: ${exercise.duration} minutes\n`;
    output += `   🔥 Calories burned: ~${exercise.calories_burned}\n`;
    output += `   💪 Intensity: ${exercise.intensity}\n`;
    output += `   🏋️  Equipment: ${exercise.equipment.join(', ')}\n`;
    output += `   🎯 Target muscles: ${exercise.target_muscles.join(', ')}\n`;
    
    if (exercise.sets_reps) {
      output += `   📊 Sets/Reps: ${exercise.sets_reps}\n`;
    }
    
    // Exercise instructions
    if (exercise.instructions && Array.isArray(exercise.instructions) && exercise.instructions.length > 0) {
      output += `   📋 Instructions:\n`;
      exercise.instructions.forEach((step, stepIndex) => {
        output += `      ${stepIndex + 1}. ${step}\n`;
      });
    }
    
    output += `   ✨ Benefits: ${exercise.benefits}\n`;
    
    if (exercise.modifications) {
      output += `   🔄 Modifications: ${exercise.modifications}\n`;
    }
    
    if (exercise.safety_tips) {
      output += `   ⚠️  Safety: ${exercise.safety_tips}\n`;
    }
    
    output += '\n';
  });

  if (recommendations.general_advice) {
    output += '💭 PERSONALIZED ADVICE\n';
    output += '─'.repeat(30) + '\n';
    output += recommendations.general_advice + '\n\n';
  }

  output += '💡 TIP: Use "fasting exercise" command to log any of these workouts!\n';
  
  return output;
}