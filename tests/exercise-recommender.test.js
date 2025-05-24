import { generateExerciseRecommendations, formatExerciseRecommendations } from '../lib/exercise-recommender.js';

// Test fallback recommendations (when no OpenAI key is available)
async function testExerciseRecommendations() {
  console.log('Testing exercise recommendations...\n');
  
  try {
    // Test cardio recommendations
    const cardioRecs = await generateExerciseRecommendations('cardio');
    console.log('✅ Cardio recommendations generated successfully');
    console.log(`   Found ${cardioRecs.recommendations.length} recommendations`);
    
    // Test strength recommendations
    const strengthRecs = await generateExerciseRecommendations('strength');
    console.log('✅ Strength recommendations generated successfully');
    console.log(`   Found ${strengthRecs.recommendations.length} recommendations`);
    
    // Test formatting
    const formatted = formatExerciseRecommendations(cardioRecs);
    console.log('✅ Exercise recommendations formatted successfully');
    console.log(`   Formatted output length: ${formatted.length} characters`);
    
    console.log('\n🎉 All exercise recommendation tests passed!');
    
  } catch (error) {
    console.error('❌ Exercise recommendation test failed:', error.message);
    process.exit(1);
  }
}

testExerciseRecommendations();