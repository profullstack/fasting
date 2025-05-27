import { test } from 'node:test';
import assert from 'node:assert';
import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cliPath = join(__dirname, '../bin/cli.js');
const packageJsonPath = join(__dirname, '../package.json');

/**
 * Helper function to run CLI command and capture output
 * @param {string[]} args - Command line arguments
 * @returns {Promise<{stdout: string, stderr: string, exitCode: number}>}
 */
function runCLI(args) {
  return new Promise((resolve) => {
    const child = spawn('node', [cliPath, ...args], {
      stdio: 'pipe'
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (exitCode) => {
      resolve({
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode
      });
    });
  });
}

test('CLI version flag tests', async (t) => {
  // Read expected version from package.json
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  const expectedVersion = packageJson.version;
  
  await t.test('should display version with --version flag', async () => {
    const result = await runCLI(['--version']);
    
    assert.strictEqual(result.exitCode, 0, 'Should exit with code 0');
    assert.strictEqual(result.stdout, expectedVersion, `Should display version ${expectedVersion}`);
    assert.strictEqual(result.stderr, '', 'Should not have stderr output');
  });
  
  await t.test('should display version with -v flag', async () => {
    const result = await runCLI(['-v']);
    
    assert.strictEqual(result.exitCode, 0, 'Should exit with code 0');
    assert.strictEqual(result.stdout, expectedVersion, `Should display version ${expectedVersion}`);
    assert.strictEqual(result.stderr, '', 'Should not have stderr output');
  });
  
  await t.test('should include version option in help text', async () => {
    const result = await runCLI(['--help']);
    
    assert.strictEqual(result.exitCode, 0, 'Should exit with code 0');
    assert.ok(result.stdout.includes('-v, --version'), 'Help should include version option');
    assert.ok(result.stdout.includes('Display version number'), 'Help should include version description');
  });
  
  await t.test('should have proper program name and description in help', async () => {
    const result = await runCLI(['--help']);
    
    assert.strictEqual(result.exitCode, 0, 'Should exit with code 0');
    assert.ok(result.stdout.includes('Usage: fasting'), 'Help should show proper program name');
    assert.ok(result.stdout.includes('A comprehensive CLI for 16:8 intermittent fasting'), 'Help should show program description');
  });
});