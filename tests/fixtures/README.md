# Test Fixtures

This directory contains mock configuration files used for testing various configuration scenarios.

## Available Fixtures

### `config-default.json`
Empty configuration file to test default values:
- Unit system: imperial (default)
- Weight unit: lbs (default)
- Activity level: moderate (default)
- Medical conditions: empty array (default)
- Storage mode: local (default)

### `config-imperial.json`
Imperial unit system configuration:
- Unit system: imperial
- Weight unit: lbs
- Timezone: America/New_York
- Activity level: moderate

### `config-metric.json`
Metric unit system configuration:
- Unit system: metric
- Weight unit: kg
- Timezone: Europe/London
- Activity level: active

### `config-with-conditions.json`
Configuration with medical conditions:
- Unit system: imperial
- Weight unit: lbs
- Timezone: America/Los_Angeles
- Activity level: sedentary
- Medical conditions: diabetes, high blood pressure, heart disease

### `config-supabase.json`
Supabase cloud storage configuration:
- Unit system: metric
- Weight unit: kg
- Timezone: UTC
- Activity level: moderate
- Storage mode: supabase
- Supabase URL: https://test.supabase.co
- Service role key: test-service-role-key
- OpenAI API key: sk-test-key

## Usage

Use these fixtures with the test utilities:

```javascript
import { createTestEnvironmentWithConfig, CONFIG_FIXTURES } from './test-utils.js';

// Test with default config
const { config, cleanup } = await createTestEnvironmentWithConfig(CONFIG_FIXTURES.DEFAULT);

// Test with imperial config
const { config, cleanup } = await createTestEnvironmentWithConfig(CONFIG_FIXTURES.IMPERIAL);

// Test with metric config
const { config, cleanup } = await createTestEnvironmentWithConfig(CONFIG_FIXTURES.METRIC);

// Test with medical conditions
const { config, cleanup } = await createTestEnvironmentWithConfig(CONFIG_FIXTURES.WITH_CONDITIONS);

// Test with Supabase config
const { config, cleanup } = await createTestEnvironmentWithConfig(CONFIG_FIXTURES.SUPABASE);
```

## Adding New Fixtures

To add a new fixture:

1. Create a new JSON file in this directory with the desired configuration
2. Add the fixture name to the `CONFIG_FIXTURES` object in `test-utils.js`
3. Document the fixture in this README

## Notes

- All fixtures are copied to temporary test directories during test execution
- Tests are isolated and don't affect the main configuration
- The test utilities handle cleanup automatically