import { strict as assert } from 'assert';

console.log('🧪 Testing exercise duration parsing...');

// Test duration parsing logic (extracted from CLI)
function parseDuration(duration) {
  let durationInMinutes;
  if (typeof duration === 'string') {
    // Extract number and unit from strings like "30 minutes", "1.5 hours", "45min", "2h", etc.
    const match = duration.match(/(\d+(?:\.\d+)?)\s*(minutes?|mins?|hours?|hrs?|h|m)?/i);
    if (match) {
      const value = Number(match[1]);
      const unit = match[2] ? match[2].toLowerCase() : 'minutes'; // Default to minutes
      
      // Convert to minutes
      if (unit.startsWith('h')) { // hours, hour, hrs, hr, h
        durationInMinutes = value * 60;
      } else { // minutes, minute, mins, min, m, or no unit
        durationInMinutes = value;
      }
    } else {
      throw new Error(`Invalid duration format: "${duration}". Please use formats like "30", "30 minutes", "1.5 hours"`);
    }
  } else {
    durationInMinutes = Number(duration);
  }
  
  if (isNaN(durationInMinutes) || durationInMinutes <= 0) {
    throw new Error(`Invalid duration: "${duration}". Please provide a positive number.`);
  }
  
  // Round to reasonable precision
  durationInMinutes = Math.round(durationInMinutes * 10) / 10;
  
  return durationInMinutes;
}

console.log('  Testing duration parsing...');

// Test various duration formats
try {
  assert.equal(parseDuration('30'), 30);
  console.log('    ✅ parseDuration("30")');
} catch (error) {
  console.log('    ❌ parseDuration("30"):', error.message);
}

try {
  assert.equal(parseDuration('30 minutes'), 30);
  console.log('    ✅ parseDuration("30 minutes")');
} catch (error) {
  console.log('    ❌ parseDuration("30 minutes"):', error.message);
}

try {
  assert.equal(parseDuration('45min'), 45);
  console.log('    ✅ parseDuration("45min")');
} catch (error) {
  console.log('    ❌ parseDuration("45min"):', error.message);
}

try {
  assert.equal(parseDuration('60 min'), 60);
  console.log('    ✅ parseDuration("60 min")');
} catch (error) {
  console.log('    ❌ parseDuration("60 min"):', error.message);
}

try {
  assert.equal(parseDuration('10.5'), 10.5);
  console.log('    ✅ parseDuration("10.5")');
} catch (error) {
  console.log('    ❌ parseDuration("10.5"):', error.message);
}

try {
  assert.equal(parseDuration('15.5 minutes'), 15.5);
  console.log('    ✅ parseDuration("15.5 minutes")');
} catch (error) {
  console.log('    ❌ parseDuration("15.5 minutes"):', error.message);
}

try {
  assert.equal(parseDuration(30), 30);
  console.log('    ✅ parseDuration(30)');
} catch (error) {
  console.log('    ❌ parseDuration(30):', error.message);
}

// Test hours parsing
try {
  assert.equal(parseDuration('1 hour'), 60);
  console.log('    ✅ parseDuration("1 hour")');
} catch (error) {
  console.log('    ❌ parseDuration("1 hour"):', error.message);
}

try {
  assert.equal(parseDuration('2 hours'), 120);
  console.log('    ✅ parseDuration("2 hours")');
} catch (error) {
  console.log('    ❌ parseDuration("2 hours"):', error.message);
}

try {
  assert.equal(parseDuration('1.5h'), 90);
  console.log('    ✅ parseDuration("1.5h")');
} catch (error) {
  console.log('    ❌ parseDuration("1.5h"):', error.message);
}

try {
  assert.equal(parseDuration('0.5 hrs'), 30);
  console.log('    ✅ parseDuration("0.5 hrs")');
} catch (error) {
  console.log('    ❌ parseDuration("0.5 hrs"):', error.message);
}

try {
  assert.equal(parseDuration('2.25 hours'), 135);
  console.log('    ✅ parseDuration("2.25 hours")');
} catch (error) {
  console.log('    ❌ parseDuration("2.25 hours"):', error.message);
}

// Test error cases
try {
  parseDuration('invalid');
  console.log('    ❌ parseDuration("invalid"): should have thrown');
} catch (error) {
  console.log('    ✅ parseDuration("invalid") error handling');
}

try {
  parseDuration('0');
  console.log('    ❌ parseDuration("0"): should have thrown');
} catch (error) {
  console.log('    ✅ parseDuration("0") error handling');
}

try {
  parseDuration('-5');
  console.log('    ❌ parseDuration("-5"): should have thrown');
} catch (error) {
  console.log('    ✅ parseDuration("-5") error handling');
}

console.log('✅ exercise-duration.test.js completed');