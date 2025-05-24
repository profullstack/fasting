#!/usr/bin/env node

import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const testFiles = [
  'fast.test.js',
  'charts.test.js',
  'fasting.test.js',
  'weight.test.js',
  'calorie-chart.test.js',
  'exercise.test.js',
  'units.test.js',
  'config-units.test.js',
  'exercise-duration.test.js',
  'meal-recommender.test.js',
  'exercise-recommender.test.js',
  'drink-recommender.test.js',
  'activity-conditions.test.js'
];

console.log('🧪 Running Fasting App Tests\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

async function runTest(testFile) {
  return new Promise((resolve) => {
    console.log(`📋 Running ${testFile}...`);
    
    const testProcess = spawn('node', ['--test', join(__dirname, testFile)], {
      stdio: 'pipe'
    });
    
    let output = '';
    let errorOutput = '';
    
    testProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    testProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${testFile} - PASSED`);
        
        // Count tests from output
        const testMatches = output.match(/# tests \d+/g);
        if (testMatches) {
          const testsCount = parseInt(testMatches[0].match(/\d+/)[0]);
          totalTests += testsCount;
          passedTests += testsCount;
        }
      } else {
        console.log(`❌ ${testFile} - FAILED`);
        console.log('Error output:', errorOutput);
        console.log('Standard output:', output);
        failedTests++;
      }
      
      resolve(code === 0);
    });
  });
}

async function runAllTests() {
  const results = [];
  
  for (const testFile of testFiles) {
    const result = await runTest(testFile);
    results.push(result);
  }
  
  console.log('\n📊 Test Summary');
  console.log('═'.repeat(40));
  console.log(`Total test files: ${testFiles.length}`);
  console.log(`Passed: ${results.filter(r => r).length}`);
  console.log(`Failed: ${results.filter(r => !r).length}`);
  
  if (totalTests > 0) {
    console.log(`\nIndividual tests: ${totalTests} total, ${passedTests} passed, ${failedTests} failed`);
  }
  
  const allPassed = results.every(r => r);
  
  if (allPassed) {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('\n💥 Some tests failed!');
    process.exit(1);
  }
}

runAllTests().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});