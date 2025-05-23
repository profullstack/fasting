import { strict as assert } from 'assert';
import { getUnitSystem, setUnitSystem, getVolumeUnits, getWeightUnits, getWeightUnit, setWeightUnit } from '../lib/config.js';

console.log('🧪 Testing config unit system functions...');

// Test getUnitSystem and setUnitSystem
console.log('  Testing unit system configuration...');

try {
  // Test default unit system
  const defaultSystem = getUnitSystem();
  assert(['imperial', 'metric'].includes(defaultSystem));
  console.log('    ✅ getUnitSystem returns valid default');
} catch (error) {
  console.log('    ❌ getUnitSystem default:', error.message);
}

try {
  // Test setting imperial system
  setUnitSystem('imperial');
  const imperialSystem = getUnitSystem();
  assert.equal(imperialSystem, 'imperial');
  
  // Check that weight unit was also updated
  const weightUnit = getWeightUnit();
  assert.equal(weightUnit, 'lbs');
  console.log('    ✅ setUnitSystem imperial with weight unit sync');
} catch (error) {
  console.log('    ❌ setUnitSystem imperial:', error.message);
}

try {
  // Test setting metric system
  setUnitSystem('metric');
  const metricSystem = getUnitSystem();
  assert.equal(metricSystem, 'metric');
  
  // Check that weight unit was also updated
  const weightUnit = getWeightUnit();
  assert.equal(weightUnit, 'kg');
  console.log('    ✅ setUnitSystem metric with weight unit sync');
} catch (error) {
  console.log('    ❌ setUnitSystem metric:', error.message);
}

try {
  // Test invalid unit system
  setUnitSystem('invalid');
  console.log('    ❌ setUnitSystem invalid: should have thrown');
} catch (error) {
  console.log('    ✅ setUnitSystem invalid error handling');
}

// Test getVolumeUnits
console.log('  Testing getVolumeUnits...');

try {
  setUnitSystem('metric');
  const metricVolume = getVolumeUnits();
  assert.equal(metricVolume.small, 'ml');
  assert.equal(metricVolume.large, 'l');
  assert(metricVolume.examples.includes('500ml'));
  assert(metricVolume.examples.includes('1l'));
  console.log('    ✅ getVolumeUnits metric');
} catch (error) {
  console.log('    ❌ getVolumeUnits metric:', error.message);
}

try {
  setUnitSystem('imperial');
  const imperialVolume = getVolumeUnits();
  assert.equal(imperialVolume.small, 'fl oz');
  assert.equal(imperialVolume.large, 'fl oz');
  assert(imperialVolume.examples.includes('16oz'));
  assert(imperialVolume.examples.includes('32oz'));
  console.log('    ✅ getVolumeUnits imperial');
} catch (error) {
  console.log('    ❌ getVolumeUnits imperial:', error.message);
}

// Test getWeightUnits
console.log('  Testing getWeightUnits...');

try {
  setUnitSystem('metric');
  const metricWeight = getWeightUnits();
  assert.equal(metricWeight.small, 'g');
  assert.equal(metricWeight.large, 'kg');
  assert(metricWeight.examples.includes('250g'));
  assert(metricWeight.examples.includes('1kg'));
  console.log('    ✅ getWeightUnits metric');
} catch (error) {
  console.log('    ❌ getWeightUnits metric:', error.message);
}

try {
  setUnitSystem('imperial');
  const imperialWeight = getWeightUnits();
  assert.equal(imperialWeight.small, 'oz');
  assert.equal(imperialWeight.large, 'lbs');
  assert(imperialWeight.examples.includes('4oz'));
  assert(imperialWeight.examples.includes('1lb'));
  console.log('    ✅ getWeightUnits imperial');
} catch (error) {
  console.log('    ❌ getWeightUnits imperial:', error.message);
}

// Test backward compatibility with existing weight unit functions
console.log('  Testing weight unit backward compatibility...');

try {
  setWeightUnit('lbs');
  const lbsUnit = getWeightUnit();
  assert.equal(lbsUnit, 'lbs');
  console.log('    ✅ setWeightUnit/getWeightUnit lbs');
} catch (error) {
  console.log('    ❌ setWeightUnit/getWeightUnit lbs:', error.message);
}

try {
  setWeightUnit('kg');
  const kgUnit = getWeightUnit();
  assert.equal(kgUnit, 'kg');
  console.log('    ✅ setWeightUnit/getWeightUnit kg');
} catch (error) {
  console.log('    ❌ setWeightUnit/getWeightUnit kg:', error.message);
}

try {
  setWeightUnit('invalid');
  console.log('    ❌ setWeightUnit invalid: should have thrown');
} catch (error) {
  console.log('    ✅ setWeightUnit invalid error handling');
}

// Test unit system consistency
console.log('  Testing unit system consistency...');

try {
  // Set to metric and verify all related units
  setUnitSystem('metric');
  const system = getUnitSystem();
  const weightUnit = getWeightUnit();
  const volumeUnits = getVolumeUnits();
  const weightUnits = getWeightUnits();
  
  assert.equal(system, 'metric');
  assert.equal(weightUnit, 'kg');
  assert.equal(volumeUnits.small, 'ml');
  assert.equal(weightUnits.small, 'g');
  console.log('    ✅ metric system consistency');
} catch (error) {
  console.log('    ❌ metric system consistency:', error.message);
}

try {
  // Set to imperial and verify all related units
  setUnitSystem('imperial');
  const system = getUnitSystem();
  const weightUnit = getWeightUnit();
  const volumeUnits = getVolumeUnits();
  const weightUnits = getWeightUnits();
  
  assert.equal(system, 'imperial');
  assert.equal(weightUnit, 'lbs');
  assert.equal(volumeUnits.small, 'fl oz');
  assert.equal(weightUnits.small, 'oz');
  console.log('    ✅ imperial system consistency');
} catch (error) {
  console.log('    ❌ imperial system consistency:', error.message);
}

console.log('✅ config-units.test.js completed');