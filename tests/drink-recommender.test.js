import { generateDrinkRecommendations, formatDrinkRecommendations } from '../lib/drink-recommender.js';

// Test fallback recommendations (when no OpenAI key is available)
async function testDrinkRecommendations() {
  console.log('Testing drink recommendations...\n');
  
  try {
    // Test smoothie recommendations
    const smoothieRecs = await generateDrinkRecommendations('smoothies');
    console.log('✅ Smoothie recommendations generated successfully');
    console.log(`   Found ${smoothieRecs.recommendations.length} recommendations`);
    
    // Test tea recommendations
    const teaRecs = await generateDrinkRecommendations('tea');
    console.log('✅ Tea recommendations generated successfully');
    console.log(`   Found ${teaRecs.recommendations.length} recommendations`);
    
    // Test water recommendations
    const waterRecs = await generateDrinkRecommendations('water');
    console.log('✅ Water recommendations generated successfully');
    console.log(`   Found ${waterRecs.recommendations.length} recommendations`);
    
    // Test formatting
    const formatted = formatDrinkRecommendations(smoothieRecs);
    console.log('✅ Drink recommendations formatted successfully');
    console.log(`   Formatted output length: ${formatted.length} characters`);
    
    console.log('\n🎉 All drink recommendation tests passed!');
    
  } catch (error) {
    console.error('❌ Drink recommendation test failed:', error.message);
    process.exit(1);
  }
}

testDrinkRecommendations();