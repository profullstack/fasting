import { test } from 'node:test';
import { strict as assert } from 'assert';
import { createTestEnvironmentWithConfig, CONFIG_FIXTURES } from './test-utils.js';

test('Config module with different fixtures', async (t) => {
  
  await t.test('should use default values with empty config', async () => {
    const { config, cleanup } = await createTestEnvironmentWithConfig(CONFIG_FIXTURES.DEFAULT);
    
    try {
      assert.equal(config.getUnitSystem(), 'imperial', 'Default unit system should be imperial');
      assert.equal(config.getWeightUnit(), 'lbs', 'Default weight unit should be lbs');
      assert.equal(config.getActivityLevel(), 'moderate', 'Default activity level should be moderate');
      assert.deepEqual(config.getMedicalConditions(), [], 'Default medical conditions should be empty');
      assert.equal(config.getStorageMode(), 'local', 'Default storage mode should be local');
    } finally {
      cleanup();
    }
  });

  await t.test('should load imperial config correctly', async () => {
    const { config, cleanup } = await createTestEnvironmentWithConfig(CONFIG_FIXTURES.IMPERIAL);
    
    try {
      assert.equal(config.getUnitSystem(), 'imperial', 'Should use imperial unit system');
      assert.equal(config.getWeightUnit(), 'lbs', 'Should use lbs weight unit');
      assert.equal(config.getTimezone(), 'America/New_York', 'Should use correct timezone');
      assert.equal(config.getActivityLevel(), 'moderate', 'Should use moderate activity level');
    } finally {
      cleanup();
    }
  });

  await t.test('should load metric config correctly', async () => {
    const { config, cleanup } = await createTestEnvironmentWithConfig(CONFIG_FIXTURES.METRIC);
    
    try {
      assert.equal(config.getUnitSystem(), 'metric', 'Should use metric unit system');
      assert.equal(config.getWeightUnit(), 'kg', 'Should use kg weight unit');
      assert.equal(config.getTimezone(), 'Europe/London', 'Should use correct timezone');
      assert.equal(config.getActivityLevel(), 'active', 'Should use active activity level');
    } finally {
      cleanup();
    }
  });

  await t.test('should load config with medical conditions', async () => {
    const { config, cleanup } = await createTestEnvironmentWithConfig(CONFIG_FIXTURES.WITH_CONDITIONS);
    
    try {
      assert.equal(config.getActivityLevel(), 'sedentary', 'Should use sedentary activity level');
      const conditions = config.getMedicalConditions();
      assert.equal(conditions.length, 3, 'Should have 3 medical conditions');
      assert.ok(conditions.includes('diabetes'), 'Should include diabetes');
      assert.ok(conditions.includes('high blood pressure'), 'Should include high blood pressure');
      assert.ok(conditions.includes('heart disease'), 'Should include heart disease');
    } finally {
      cleanup();
    }
  });

  await t.test('should load supabase config correctly', async () => {
    const { config, cleanup } = await createTestEnvironmentWithConfig(CONFIG_FIXTURES.SUPABASE);
    
    try {
      assert.equal(config.getStorageMode(), 'supabase', 'Should use supabase storage mode');
      assert.equal(config.getUnitSystem(), 'metric', 'Should use metric unit system');
      assert.equal(config.getTimezone(), 'UTC', 'Should use UTC timezone');
      
      const supabaseConfig = config.getSupabaseConfig();
      assert.equal(supabaseConfig.url, 'https://test.supabase.co', 'Should have correct Supabase URL');
      assert.equal(supabaseConfig.serviceRoleKey, 'test-service-role-key', 'Should have correct service role key');
      
      assert.ok(config.isSupabaseConfigured(), 'Should detect Supabase as configured');
    } finally {
      cleanup();
    }
  });

  await t.test('should get complete user profile from config', async () => {
    const { config, cleanup } = await createTestEnvironmentWithConfig(CONFIG_FIXTURES.WITH_CONDITIONS);
    
    try {
      const profile = config.getUserProfile();
      
      assert.equal(profile.activityLevel, 'sedentary', 'Profile should include activity level');
      assert.equal(profile.unitSystem, 'imperial', 'Profile should include unit system');
      assert.equal(profile.weightUnit, 'lbs', 'Profile should include weight unit');
      assert.equal(profile.timezone, 'America/Los_Angeles', 'Profile should include timezone');
      assert.ok(Array.isArray(profile.medicalConditions), 'Profile should include medical conditions array');
      assert.equal(profile.medicalConditions.length, 3, 'Profile should have correct number of conditions');
    } finally {
      cleanup();
    }
  });

  await t.test('should handle config modifications correctly', async () => {
    const { config, cleanup } = await createTestEnvironmentWithConfig(CONFIG_FIXTURES.DEFAULT);
    
    try {
      // Test setting unit system
      config.setUnitSystem('metric');
      assert.equal(config.getUnitSystem(), 'metric', 'Should update unit system');
      assert.equal(config.getWeightUnit(), 'kg', 'Should auto-update weight unit');
      
      // Test setting activity level
      config.setActivityLevel('active');
      assert.equal(config.getActivityLevel(), 'active', 'Should update activity level');
      
      // Test adding medical conditions
      config.addMedicalCondition('diabetes');
      config.addMedicalCondition('high blood pressure');
      const conditions = config.getMedicalConditions();
      assert.equal(conditions.length, 2, 'Should have 2 conditions');
      assert.ok(conditions.includes('diabetes'), 'Should include diabetes');
      
      // Test removing medical condition
      config.removeMedicalCondition('diabetes');
      const updatedConditions = config.getMedicalConditions();
      assert.equal(updatedConditions.length, 1, 'Should have 1 condition after removal');
      assert.ok(!updatedConditions.includes('diabetes'), 'Should not include diabetes');
    } finally {
      cleanup();
    }
  });

  await t.test('should validate timezone correctly', async () => {
    const { config, cleanup } = await createTestEnvironmentWithConfig(CONFIG_FIXTURES.DEFAULT);
    
    try {
      // Test valid timezone
      config.setTimezone('America/Chicago');
      assert.equal(config.getTimezone(), 'America/Chicago', 'Should set valid timezone');
      
      // Test invalid timezone
      assert.throws(() => {
        config.setTimezone('Invalid/Timezone');
      }, /Invalid timezone/, 'Should throw error for invalid timezone');
    } finally {
      cleanup();
    }
  });

  await t.test('should validate unit system and activity level', async () => {
    const { config, cleanup } = await createTestEnvironmentWithConfig(CONFIG_FIXTURES.DEFAULT);
    
    try {
      // Test invalid unit system
      assert.throws(() => {
        config.setUnitSystem('invalid');
      }, /Unit system must be/, 'Should throw error for invalid unit system');
      
      // Test invalid weight unit
      assert.throws(() => {
        config.setWeightUnit('invalid');
      }, /Weight unit must be/, 'Should throw error for invalid weight unit');
      
      // Test invalid activity level
      assert.throws(() => {
        config.setActivityLevel('invalid');
      }, /Activity level must be/, 'Should throw error for invalid activity level');
    } finally {
      cleanup();
    }
  });
});