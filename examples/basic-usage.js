#!/usr/bin/env node

/**
 * Basic usage example for the Fasting App
 * Demonstrates CLI commands and basic functionality
 */

import { spawn } from 'child_process';

console.log('🍽️  Fasting App - Basic Usage Example\n');

const commands = [
  {
    cmd: 'node',
    args: ['bin/cli.js', 'fast', 'start'],
    description: 'Start a new fast'
  },
  {
    cmd: 'node', 
    args: ['bin/cli.js', 'meal', 'Grilled chicken salad', '--calories', '350'],
    description: 'Log a meal with manual calories'
  },
  {
    cmd: 'node',
    args: ['bin/cli.js', 'drink', 'Green tea', '--calories', '0'],
    description: 'Log a drink'
  },
  {
    cmd: 'node',
    args: ['bin/cli.js', 'weight', '175'],
    description: 'Log weight'
  },
  {
    cmd: 'node',
    args: ['bin/cli.js', 'summary'],
    description: 'Show comprehensive summary'
  },
  {
    cmd: 'node',
    args: ['bin/cli.js', 'fast', 'end'],
    description: 'End the current fast'
  }
];

async function runCommand(command) {
  return new Promise((resolve) => {
    console.log(`📋 ${command.description}`);
    console.log(`   Command: ${command.cmd} ${command.args.join(' ')}\n`);
    
    const process = spawn(command.cmd, command.args, { stdio: 'inherit' });
    
    process.on('close', (code) => {
      console.log(`   ✅ Completed with exit code: ${code}\n`);
      console.log('─'.repeat(60) + '\n');
      resolve(code);
    });
  });
}

async function runExample() {
  console.log('This example demonstrates basic CLI usage:\n');
  
  for (const command of commands) {
    await runCommand(command);
    // Small delay between commands
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('🎉 Basic usage example completed!');
  console.log('\nTry these commands yourself:');
  console.log('  fasting fast start');
  console.log('  fasting meal "Your meal description"');
  console.log('  fasting weight 175');
  console.log('  fasting summary');
}

runExample().catch(console.error);