import { strict as assert } from 'assert';
import { withSpinner, Spinner } from '../lib/spinner.js';

console.log('🧪 Testing Spinner functionality...\n');

// Test basic spinner creation
console.log('Testing Spinner class...');
const spinner = new Spinner('Test message');
assert.ok(spinner, 'Spinner should be created');
assert.equal(spinner.text, 'Test message', 'Spinner should store text');
assert.equal(spinner.isSpinning, false, 'Spinner should not be spinning initially');
console.log('✅ Spinner class works correctly');

// Test withSpinner utility function
console.log('\nTesting withSpinner function...');

// Test successful operation
const result = await withSpinner(
  'Testing async operation',
  () => new Promise(resolve => setTimeout(() => resolve('success'), 100))
);
assert.equal(result, 'success', 'withSpinner should return the result of the async function');
console.log('✅ withSpinner handles successful operations');

// Test error handling
try {
  await withSpinner(
    'Testing error handling',
    () => new Promise((resolve, reject) => setTimeout(() => reject(new Error('test error')), 100))
  );
  assert.fail('Should have thrown an error');
} catch (error) {
  assert.equal(error.message, 'test error', 'withSpinner should propagate errors');
  console.log('✅ withSpinner handles errors correctly');
}

// Test spinner frames
console.log('\nTesting spinner frames...');
const testSpinner = new Spinner('Frame test');
assert.ok(Array.isArray(testSpinner.frames), 'Spinner should have frames array');
assert.ok(testSpinner.frames.length > 0, 'Spinner should have at least one frame');
assert.ok(testSpinner.frames.every(frame => typeof frame === 'string'), 'All frames should be strings');
console.log('✅ Spinner frames are properly configured');

// Test text update
console.log('\nTesting text update...');
const updateSpinner = new Spinner('Initial text');
updateSpinner.updateText('Updated text');
assert.equal(updateSpinner.text, 'Updated text', 'Spinner text should be updatable');
console.log('✅ Spinner text update works');

console.log('\n🎉 All spinner tests passed!');