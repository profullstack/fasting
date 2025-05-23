import { strict as assert } from 'assert';
import { parseSize, convertVolume, formatSize, getSizeExamples, convertToPreferredSystem } from '../lib/units.js';
import { setUnitSystem, getUnitSystem } from '../lib/config.js';

console.log('🧪 Testing units.js...');

// Test parseSize function
console.log('  Testing parseSize...');

// Volume parsing tests
try {
  const result1 = parseSize('500ml', 'volume');
  assert.equal(result1.value, 500);
  assert.equal(result1.unit, 'ml');
  assert.equal(result1.systemType, 'metric');
  console.log('    ✅ parseSize volume metric');
} catch (error) {
  console.log('    ❌ parseSize volume metric:', error.message);
}

try {
  const result2 = parseSize('16oz', 'volume');
  assert.equal(result2.value, 16);
  assert.equal(result2.unit, 'fl oz');
  assert.equal(result2.systemType, 'imperial');
  console.log('    ✅ parseSize volume imperial');
} catch (error) {
  console.log('    ❌ parseSize volume imperial:', error.message);
}

try {
  const result3 = parseSize('2 cups', 'volume');
  assert.equal(result3.value, 2);
  assert.equal(result3.unit, 'cup');
  assert.equal(result3.systemType, 'imperial');
  console.log('    ✅ parseSize volume with spaces');
} catch (error) {
  console.log('    ❌ parseSize volume with spaces:', error.message);
}

// Weight parsing tests
try {
  const result4 = parseSize('150g', 'weight');
  assert.equal(result4.value, 150);
  assert.equal(result4.unit, 'g');
  assert.equal(result4.systemType, 'metric');
  console.log('    ✅ parseSize weight metric');
} catch (error) {
  console.log('    ❌ parseSize weight metric:', error.message);
}

try {
  const result5 = parseSize('8oz', 'weight');
  assert.equal(result5.value, 8);
  assert.equal(result5.unit, 'oz');
  assert.equal(result5.systemType, 'imperial');
  console.log('    ✅ parseSize weight imperial');
} catch (error) {
  console.log('    ❌ parseSize weight imperial:', error.message);
}

// Test default unit assignment based on system
try {
  setUnitSystem('metric');
  const result6 = parseSize('250', 'volume');
  assert.equal(result6.value, 250);
  assert.equal(result6.unit, 'ml');
  console.log('    ✅ parseSize default metric volume unit');
} catch (error) {
  console.log('    ❌ parseSize default metric volume unit:', error.message);
}

try {
  setUnitSystem('imperial');
  const result7 = parseSize('16', 'volume');
  assert.equal(result7.value, 16);
  assert.equal(result7.unit, 'fl oz');
  console.log('    ✅ parseSize default imperial volume unit');
} catch (error) {
  console.log('    ❌ parseSize default imperial volume unit:', error.message);
}

// Test error handling
try {
  parseSize('invalid', 'volume');
  console.log('    ❌ parseSize error handling: should have thrown');
} catch (error) {
  console.log('    ✅ parseSize error handling');
}

// Test convertVolume function
console.log('  Testing convertVolume...');

try {
  const result8 = convertVolume(1000, 'ml', 'l');
  assert.equal(result8, 1);
  console.log('    ✅ convertVolume ml to l');
} catch (error) {
  console.log('    ❌ convertVolume ml to l:', error.message);
}

try {
  const result9 = convertVolume(16, 'fl oz', 'ml');
  assert.equal(result9, 473.18); // 16 * 29.5735 rounded
  console.log('    ✅ convertVolume fl oz to ml');
} catch (error) {
  console.log('    ❌ convertVolume fl oz to ml:', error.message);
}

try {
  const result10 = convertVolume(2, 'cup', 'ml');
  assert.equal(result10, 473.18); // 2 * 236.588 rounded
  console.log('    ✅ convertVolume cups to ml');
} catch (error) {
  console.log('    ❌ convertVolume cups to ml:', error.message);
}

try {
  const result11 = convertVolume(500, 'ml', 'fl oz');
  assert.equal(result11, 16.91); // 500 / 29.5735 rounded
  console.log('    ✅ convertVolume ml to fl oz');
} catch (error) {
  console.log('    ❌ convertVolume ml to fl oz:', error.message);
}

// Test same unit conversion
try {
  const result12 = convertVolume(100, 'ml', 'ml');
  assert.equal(result12, 100);
  console.log('    ✅ convertVolume same unit');
} catch (error) {
  console.log('    ❌ convertVolume same unit:', error.message);
}

// Test formatSize function
console.log('  Testing formatSize...');

try {
  const result13 = formatSize(500, 'ml');
  assert.equal(result13, '500 ml');
  console.log('    ✅ formatSize');
} catch (error) {
  console.log('    ❌ formatSize:', error.message);
}

// Test getSizeExamples function
console.log('  Testing getSizeExamples...');

try {
  setUnitSystem('metric');
  const examples1 = getSizeExamples('volume');
  assert(examples1.includes('500ml'));
  assert(examples1.includes('1l'));
  console.log('    ✅ getSizeExamples metric volume');
} catch (error) {
  console.log('    ❌ getSizeExamples metric volume:', error.message);
}

try {
  setUnitSystem('imperial');
  const examples2 = getSizeExamples('volume');
  assert(examples2.includes('16oz'));
  assert(examples2.includes('1 cup'));
  console.log('    ✅ getSizeExamples imperial volume');
} catch (error) {
  console.log('    ❌ getSizeExamples imperial volume:', error.message);
}

try {
  setUnitSystem('metric');
  const examples3 = getSizeExamples('weight');
  assert(examples3.includes('250g'));
  assert(examples3.includes('1kg'));
  console.log('    ✅ getSizeExamples metric weight');
} catch (error) {
  console.log('    ❌ getSizeExamples metric weight:', error.message);
}

try {
  setUnitSystem('imperial');
  const examples4 = getSizeExamples('weight');
  assert(examples4.includes('4oz'));
  assert(examples4.includes('1lb'));
  console.log('    ✅ getSizeExamples imperial weight');
} catch (error) {
  console.log('    ❌ getSizeExamples imperial weight:', error.message);
}

// Test convertToPreferredSystem function
console.log('  Testing convertToPreferredSystem...');

try {
  setUnitSystem('metric');
  const parsed = parseSize('16oz', 'volume');
  const converted = await convertToPreferredSystem(parsed, 'metric');
  assert.equal(converted.unit, 'ml');
  assert.equal(converted.value, 473.18);
  console.log('    ✅ convertToPreferredSystem volume to metric');
} catch (error) {
  console.log('    ❌ convertToPreferredSystem volume to metric:', error.message);
}

try {
  setUnitSystem('imperial');
  const parsed2 = parseSize('500ml', 'volume');
  const converted2 = await convertToPreferredSystem(parsed2, 'imperial');
  assert.equal(converted2.unit, 'fl oz');
  assert.equal(converted2.value, 16.91);
  console.log('    ✅ convertToPreferredSystem volume to imperial');
} catch (error) {
  console.log('    ❌ convertToPreferredSystem volume to imperial:', error.message);
}

try {
  setUnitSystem('metric');
  const parsed3 = parseSize('8oz', 'weight');
  const converted3 = await convertToPreferredSystem(parsed3, 'metric');
  assert.equal(converted3.unit, 'g');
  assert.equal(converted3.value, 226.8); // 8 * 28.3495
  console.log('    ✅ convertToPreferredSystem weight to metric');
} catch (error) {
  console.log('    ❌ convertToPreferredSystem weight to metric:', error.message);
}

try {
  setUnitSystem('imperial');
  const parsed4 = parseSize('250g', 'weight');
  const converted4 = await convertToPreferredSystem(parsed4, 'imperial');
  assert.equal(converted4.unit, 'oz');
  assert.equal(converted4.value, 8.82); // 250 / 28.3495
  console.log('    ✅ convertToPreferredSystem weight to imperial');
} catch (error) {
  console.log('    ❌ convertToPreferredSystem weight to imperial:', error.message);
}

// Test no conversion needed
try {
  setUnitSystem('metric');
  const parsed5 = parseSize('500ml', 'volume');
  const converted5 = await convertToPreferredSystem(parsed5, 'metric');
  assert.equal(converted5.unit, 'ml');
  assert.equal(converted5.value, 500);
  console.log('    ✅ convertToPreferredSystem no conversion needed');
} catch (error) {
  console.log('    ❌ convertToPreferredSystem no conversion needed:', error.message);
}

console.log('✅ units.test.js completed');