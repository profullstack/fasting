import { mkdtempSync, rmSync, copyFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { tmpdir } from 'os';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Creates a test environment with a temporary config directory
 * @param {string} configFixture - Name of the config fixture file (without .json)
 * @returns {Object} Test environment with cleanup function
 */
export function createTestEnvironment(configFixture = null) {
  // Create temporary directory for test config
  const tempDir = mkdtempSync(join(tmpdir(), 'fasting-test-'));
  const originalConfigDir = process.env.FASTING_TEST_CONFIG_DIR;
  
  // Set environment variable to use temp directory
  process.env.FASTING_TEST_CONFIG_DIR = tempDir;
  
  // Copy fixture config if specified
  if (configFixture) {
    const fixturePath = join(__dirname, 'fixtures', `config-${configFixture}.json`);
    const configPath = join(tempDir, 'config.json');
    copyFileSync(fixturePath, configPath);
  }
  
  // Create empty data files
  const dataFiles = ['meals.json', 'weight.json', 'fasts.json', 'exercises.json'];
  dataFiles.forEach(file => {
    writeFileSync(join(tempDir, file), '[]');
  });
  
  // Cleanup function
  function cleanup() {
    try {
      rmSync(tempDir, { recursive: true, force: true });
      if (originalConfigDir) {
        process.env.FASTING_TEST_CONFIG_DIR = originalConfigDir;
      } else {
        delete process.env.FASTING_TEST_CONFIG_DIR;
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }
  
  return {
    tempDir,
    cleanup,
    configPath: join(tempDir, 'config.json'),
    mealsPath: join(tempDir, 'meals.json'),
    weightPath: join(tempDir, 'weight.json'),
    fastsPath: join(tempDir, 'fasts.json'),
    exercisesPath: join(tempDir, 'exercises.json')
  };
}

/**
 * Creates a test environment and imports config module with fresh state
 * @param {string} configFixture - Name of the config fixture file (without .json)
 * @returns {Object} Test environment with config module and cleanup function
 */
export async function createTestEnvironmentWithConfig(configFixture = null) {
  const env = createTestEnvironment(configFixture);
  
  // Force a fresh import by adding a cache-busting query parameter
  const timestamp = Date.now();
  const configModule = await import(`../lib/config.js?t=${timestamp}`);
  
  return {
    ...env,
    config: configModule
  };
}

/**
 * Available config fixtures
 */
export const CONFIG_FIXTURES = {
  DEFAULT: 'default',
  IMPERIAL: 'imperial', 
  METRIC: 'metric',
  WITH_CONDITIONS: 'with-conditions',
  SUPABASE: 'supabase'
};