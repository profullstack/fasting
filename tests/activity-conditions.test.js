import { strict as assert } from 'assert';
import { 
  getActivityLevel, 
  setActivityLevel, 
  getMedicalConditions, 
  setMedicalConditions,
  addMedicalCondition,
  removeMedicalCondition,
  getUserProfile
} from '../lib/config.js';

console.log('🧪 Testing Activity Level and Medical Conditions...\n');

// Test activity level functionality
console.log('Testing activity level...');

// Test default activity level
const defaultLevel = getActivityLevel();
assert.equal(defaultLevel, 'moderate', 'Default activity level should be moderate');
console.log('✅ Default activity level is moderate');

// Test setting valid activity levels
setActivityLevel('sedentary');
assert.equal(getActivityLevel(), 'sedentary', 'Activity level should be sedentary');
console.log('✅ Can set activity level to sedentary');

setActivityLevel('active');
assert.equal(getActivityLevel(), 'active', 'Activity level should be active');
console.log('✅ Can set activity level to active');

setActivityLevel('moderate');
assert.equal(getActivityLevel(), 'moderate', 'Activity level should be moderate');
console.log('✅ Can set activity level to moderate');

// Test invalid activity level
try {
  setActivityLevel('invalid');
  assert.fail('Should throw error for invalid activity level');
} catch (error) {
  assert.ok(error.message.includes('Activity level must be'), 'Should throw appropriate error');
  console.log('✅ Throws error for invalid activity level');
}

// Test medical conditions functionality
console.log('\nTesting medical conditions...');

// Test default (empty) conditions
const defaultConditions = getMedicalConditions();
assert.ok(Array.isArray(defaultConditions), 'Medical conditions should be an array');
console.log('✅ Default medical conditions is an array');

// Test setting conditions
setMedicalConditions(['diabetes', 'high blood pressure']);
const conditions = getMedicalConditions();
assert.equal(conditions.length, 2, 'Should have 2 conditions');
assert.ok(conditions.includes('diabetes'), 'Should include diabetes');
assert.ok(conditions.includes('high blood pressure'), 'Should include high blood pressure');
console.log('✅ Can set medical conditions array');

// Test adding conditions
addMedicalCondition('heart disease');
const updatedConditions = getMedicalConditions();
assert.equal(updatedConditions.length, 3, 'Should have 3 conditions after adding');
assert.ok(updatedConditions.includes('heart disease'), 'Should include heart disease');
console.log('✅ Can add medical condition');

// Test adding duplicate condition (should not duplicate)
addMedicalCondition('diabetes');
const noDuplicates = getMedicalConditions();
assert.equal(noDuplicates.length, 3, 'Should still have 3 conditions (no duplicates)');
console.log('✅ Does not add duplicate conditions');

// Test removing conditions
removeMedicalCondition('diabetes');
const afterRemoval = getMedicalConditions();
assert.equal(afterRemoval.length, 2, 'Should have 2 conditions after removal');
assert.ok(!afterRemoval.includes('diabetes'), 'Should not include diabetes');
console.log('✅ Can remove medical condition');

// Test invalid condition operations
try {
  addMedicalCondition('');
  assert.fail('Should throw error for empty condition');
} catch (error) {
  assert.ok(error.message.includes('non-empty string'), 'Should throw appropriate error');
  console.log('✅ Throws error for empty condition');
}

try {
  setMedicalConditions('not an array');
  assert.fail('Should throw error for non-array');
} catch (error) {
  assert.ok(error.message.includes('must be an array'), 'Should throw appropriate error');
  console.log('✅ Throws error for non-array conditions');
}

// Test getUserProfile function
console.log('\nTesting user profile...');

setActivityLevel('active');
setMedicalConditions(['high blood pressure', 'diabetes']);

const profile = getUserProfile();
assert.equal(profile.activityLevel, 'active', 'Profile should include activity level');
assert.ok(Array.isArray(profile.medicalConditions), 'Profile should include medical conditions array');
assert.equal(profile.medicalConditions.length, 2, 'Profile should have 2 medical conditions');
assert.ok(profile.unitSystem, 'Profile should include unit system');
assert.ok(profile.weightUnit, 'Profile should include weight unit');
assert.ok(profile.timezone, 'Profile should include timezone');
console.log('✅ getUserProfile returns complete profile');

// Clean up for other tests
setMedicalConditions([]);
setActivityLevel('moderate');

console.log('\n🎉 All activity level and medical conditions tests passed!');