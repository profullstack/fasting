import { test } from 'node:test';
import { strict as assert } from 'assert';
import { createTestEnvironmentWithConfig, CONFIG_FIXTURES } from './test-utils.js';

test('Activity Level and Medical Conditions', async (t) => {
  
  await t.test('should have default activity level as moderate', async () => {
    const { config, cleanup } = await createTestEnvironmentWithConfig(CONFIG_FIXTURES.DEFAULT);
    
    try {
      const defaultLevel = config.getActivityLevel();
      assert.equal(defaultLevel, 'moderate', 'Default activity level should be moderate');
    } finally {
      cleanup();
    }
  });

  await t.test('should allow setting valid activity levels', async () => {
    const { config, cleanup } = await createTestEnvironmentWithConfig(CONFIG_FIXTURES.DEFAULT);
    
    try {
      config.setActivityLevel('sedentary');
      assert.equal(config.getActivityLevel(), 'sedentary', 'Activity level should be sedentary');
      
      config.setActivityLevel('active');
      assert.equal(config.getActivityLevel(), 'active', 'Activity level should be active');
      
      config.setActivityLevel('moderate');
      assert.equal(config.getActivityLevel(), 'moderate', 'Activity level should be moderate');
    } finally {
      cleanup();
    }
  });

  await t.test('should throw error for invalid activity level', async () => {
    const { config, cleanup } = await createTestEnvironmentWithConfig(CONFIG_FIXTURES.DEFAULT);
    
    try {
      assert.throws(() => {
        config.setActivityLevel('invalid');
      }, /Activity level must be/, 'Should throw error for invalid activity level');
    } finally {
      cleanup();
    }
  });

  await t.test('should have default empty medical conditions', async () => {
    const { config, cleanup } = await createTestEnvironmentWithConfig(CONFIG_FIXTURES.DEFAULT);
    
    try {
      const defaultConditions = config.getMedicalConditions();
      assert.ok(Array.isArray(defaultConditions), 'Medical conditions should be an array');
      assert.equal(defaultConditions.length, 0, 'Default conditions should be empty');
    } finally {
      cleanup();
    }
  });

  await t.test('should allow setting medical conditions', async () => {
    const { config, cleanup } = await createTestEnvironmentWithConfig(CONFIG_FIXTURES.DEFAULT);
    
    try {
      config.setMedicalConditions(['diabetes', 'high blood pressure']);
      const conditions = config.getMedicalConditions();
      assert.equal(conditions.length, 2, 'Should have 2 conditions');
      assert.ok(conditions.includes('diabetes'), 'Should include diabetes');
      assert.ok(conditions.includes('high blood pressure'), 'Should include high blood pressure');
    } finally {
      cleanup();
    }
  });

  await t.test('should allow adding medical conditions', async () => {
    const { config, cleanup } = await createTestEnvironmentWithConfig(CONFIG_FIXTURES.DEFAULT);
    
    try {
      config.setMedicalConditions(['diabetes']);
      config.addMedicalCondition('heart disease');
      const conditions = config.getMedicalConditions();
      assert.equal(conditions.length, 2, 'Should have 2 conditions after adding');
      assert.ok(conditions.includes('heart disease'), 'Should include heart disease');
    } finally {
      cleanup();
    }
  });

  await t.test('should not add duplicate conditions', async () => {
    const { config, cleanup } = await createTestEnvironmentWithConfig(CONFIG_FIXTURES.DEFAULT);
    
    try {
      config.setMedicalConditions(['diabetes']);
      config.addMedicalCondition('diabetes');
      const conditions = config.getMedicalConditions();
      assert.equal(conditions.length, 1, 'Should still have 1 condition (no duplicates)');
    } finally {
      cleanup();
    }
  });

  await t.test('should allow removing medical conditions', async () => {
    const { config, cleanup } = await createTestEnvironmentWithConfig(CONFIG_FIXTURES.DEFAULT);
    
    try {
      config.setMedicalConditions(['diabetes', 'high blood pressure']);
      config.removeMedicalCondition('diabetes');
      const conditions = config.getMedicalConditions();
      assert.equal(conditions.length, 1, 'Should have 1 condition after removal');
      assert.ok(!conditions.includes('diabetes'), 'Should not include diabetes');
    } finally {
      cleanup();
    }
  });

  await t.test('should throw error for invalid condition operations', async () => {
    const { config, cleanup } = await createTestEnvironmentWithConfig(CONFIG_FIXTURES.DEFAULT);
    
    try {
      assert.throws(() => {
        config.addMedicalCondition('');
      }, /non-empty string/, 'Should throw error for empty condition');

      assert.throws(() => {
        config.setMedicalConditions('not an array');
      }, /must be an array/, 'Should throw error for non-array conditions');
    } finally {
      cleanup();
    }
  });

  await t.test('should return complete user profile', async () => {
    const { config, cleanup } = await createTestEnvironmentWithConfig(CONFIG_FIXTURES.DEFAULT);
    
    try {
      config.setActivityLevel('active');
      config.setMedicalConditions(['high blood pressure', 'diabetes']);
      
      const profile = config.getUserProfile();
      assert.equal(profile.activityLevel, 'active', 'Profile should include activity level');
      assert.ok(Array.isArray(profile.medicalConditions), 'Profile should include medical conditions array');
      assert.equal(profile.medicalConditions.length, 2, 'Profile should have 2 medical conditions');
      assert.ok(profile.unitSystem, 'Profile should include unit system');
      assert.ok(profile.weightUnit, 'Profile should include weight unit');
      assert.ok(profile.timezone, 'Profile should include timezone');
    } finally {
      cleanup();
    }
  });
});
