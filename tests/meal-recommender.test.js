import { strict as assert } from 'assert';
import { formatRecommendations } from '../lib/meal-recommender.js';

console.log('🧪 Testing meal recommender...');

// Test formatRecommendations function
console.log('  Testing formatRecommendations...');

const mockRecommendations = {
  recommendations: [
    {
      name: "Grilled Chicken Salad",
      description: "Fresh mixed greens with grilled chicken breast",
      calories: 350,
      ingredients: ["Mixed greens", "Grilled chicken", "Cherry tomatoes", "Cucumber"],
      prep_time: "15 minutes",
      portion_size: "150g chicken, 200g vegetables",
      nutrition_notes: "High protein, low carb"
    },
    {
      name: "Quinoa Bowl",
      description: "Nutritious quinoa with roasted vegetables",
      calories: 400,
      ingredients: ["Quinoa", "Roasted vegetables", "Avocado", "Olive oil"],
      prep_time: "25 minutes",
      portion_size: "100g quinoa, 150g vegetables",
      nutrition_notes: "Complete protein, high fiber"
    }
  ],
  general_advice: "These meals provide balanced nutrition for your current activity level."
};

try {
  const formatted = formatRecommendations(mockRecommendations);
  
  // Check that the output contains expected elements
  assert(formatted.includes('MEAL RECOMMENDATIONS'));
  assert(formatted.includes('Grilled Chicken Salad'));
  assert(formatted.includes('Quinoa Bowl'));
  assert(formatted.includes('350'));
  assert(formatted.includes('400'));
  assert(formatted.includes('15 minutes'));
  assert(formatted.includes('25 minutes'));
  assert(formatted.includes('PERSONALIZED ADVICE'));
  assert(formatted.includes('balanced nutrition'));
  assert(formatted.includes('fasting meal'));
  
  console.log('    ✅ formatRecommendations basic formatting');
} catch (error) {
  console.log('    ❌ formatRecommendations basic formatting:', error.message);
}

// Test with minimal recommendations
try {
  const minimalRecommendations = {
    recommendations: [
      {
        name: "Simple Meal",
        description: "Basic healthy meal",
        calories: 300,
        ingredients: ["Protein", "Vegetables"],
        prep_time: "10 minutes",
        portion_size: "1 serving",
        nutrition_notes: "Balanced"
      }
    ],
    general_advice: "Keep it simple."
  };
  
  const formatted = formatRecommendations(minimalRecommendations);
  assert(formatted.includes('Simple Meal'));
  assert(formatted.includes('300'));
  assert(formatted.includes('Keep it simple'));
  
  console.log('    ✅ formatRecommendations minimal data');
} catch (error) {
  console.log('    ❌ formatRecommendations minimal data:', error.message);
}

// Test with no general advice
try {
  const noAdviceRecommendations = {
    recommendations: [
      {
        name: "Test Meal",
        description: "Test description",
        calories: 250,
        ingredients: ["Test ingredient"],
        prep_time: "5 minutes",
        portion_size: "1 portion",
        nutrition_notes: "Test notes"
      }
    ]
  };
  
  const formatted = formatRecommendations(noAdviceRecommendations);
  assert(formatted.includes('Test Meal'));
  assert(formatted.includes('250'));
  // Should not crash without general_advice
  
  console.log('    ✅ formatRecommendations without advice');
} catch (error) {
  console.log('    ❌ formatRecommendations without advice:', error.message);
}

// Test empty recommendations
try {
  const emptyRecommendations = {
    recommendations: [],
    general_advice: "No recommendations available."
  };
  
  const formatted = formatRecommendations(emptyRecommendations);
  assert(formatted.includes('MEAL RECOMMENDATIONS'));
  assert(formatted.includes('No recommendations available'));
  
  console.log('    ✅ formatRecommendations empty list');
} catch (error) {
  console.log('    ❌ formatRecommendations empty list:', error.message);
}

// Test formatting consistency
try {
  const testRecommendations = {
    recommendations: [
      {
        name: "Test Meal with Long Name and Special Characters!",
        description: "A very detailed description that might be quite long and contain various details about the meal preparation and ingredients",
        calories: 999,
        ingredients: ["Ingredient 1", "Ingredient 2", "Ingredient 3", "Ingredient 4", "Ingredient 5"],
        prep_time: "45 minutes",
        portion_size: "Large serving with specific measurements",
        nutrition_notes: "Detailed nutrition information with multiple benefits"
      }
    ],
    general_advice: "This is a longer piece of advice that might span multiple lines and contain detailed information about dietary recommendations."
  };
  
  const formatted = formatRecommendations(testRecommendations);
  
  // Check that long content is handled properly
  assert(formatted.includes('Test Meal with Long Name'));
  assert(formatted.includes('999'));
  assert(formatted.includes('45 minutes'));
  assert(formatted.includes('Ingredient 1, Ingredient 2'));
  
  console.log('    ✅ formatRecommendations long content');
} catch (error) {
  console.log('    ❌ formatRecommendations long content:', error.message);
}

// Test JSON parsing with markdown code blocks (simulating the issue)
console.log('  Testing JSON parsing with markdown...');

// Mock the parsing logic from meal-recommender.js
function parseAIResponse(responseText) {
  try {
    // First try direct parsing
    let jsonText = responseText;
    
    // If the response is wrapped in markdown code blocks, extract the JSON
    const codeBlockMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1];
    }
    
    return JSON.parse(jsonText);
  } catch (parseError) {
    // Try to extract JSON from the response text
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (secondParseError) {
        throw new Error('Could not parse JSON');
      }
    }
    throw new Error('No JSON found');
  }
}

try {
  const markdownResponse = '```json\n{"recommendations": [{"name": "Test", "calories": 300}], "general_advice": "Good choice"}\n```';
  const parsed = parseAIResponse(markdownResponse);
  assert(parsed.recommendations);
  assert(parsed.recommendations[0].name === 'Test');
  assert(parsed.general_advice === 'Good choice');
  console.log('    ✅ parseAIResponse markdown code blocks');
} catch (error) {
  console.log('    ❌ parseAIResponse markdown code blocks:', error.message);
}

try {
  const plainJsonResponse = '{"recommendations": [{"name": "Plain", "calories": 250}], "general_advice": "Simple"}';
  const parsed = parseAIResponse(plainJsonResponse);
  assert(parsed.recommendations[0].name === 'Plain');
  console.log('    ✅ parseAIResponse plain JSON');
} catch (error) {
  console.log('    ❌ parseAIResponse plain JSON:', error.message);
}

try {
  const mixedResponse = 'Some text before\n{"recommendations": [{"name": "Mixed", "calories": 400}]}\nSome text after';
  const parsed = parseAIResponse(mixedResponse);
  assert(parsed.recommendations[0].name === 'Mixed');
  console.log('    ✅ parseAIResponse mixed content');
} catch (error) {
  console.log('    ❌ parseAIResponse mixed content:', error.message);
}

console.log('✅ meal-recommender.test.js completed');