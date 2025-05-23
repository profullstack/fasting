import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from './config.js';

let supabaseClient = null;

function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  const config = getSupabaseConfig();
  if (!config.url || !config.serviceRoleKey) {
    return null;
  }

  supabaseClient = createClient(config.url, config.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  return supabaseClient;
}

/**
 * Initialize Supabase tables if they don't exist
 */
export async function initializeSupabaseTables() {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase client not configured');
  }

  // Create tables if they don't exist
  const tables = [
    {
      name: 'fasting_meals',
      sql: `
        CREATE TABLE IF NOT EXISTS fasting_meals (
          id SERIAL PRIMARY KEY,
          type VARCHAR(10) NOT NULL,
          description TEXT NOT NULL,
          calories INTEGER,
          timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `
    },
    {
      name: 'fasting_weights',
      sql: `
        CREATE TABLE IF NOT EXISTS fasting_weights (
          id SERIAL PRIMARY KEY,
          weight DECIMAL(5,2) NOT NULL,
          timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `
    },
    {
      name: 'fasting_fasts',
      sql: `
        CREATE TABLE IF NOT EXISTS fasting_fasts (
          id SERIAL PRIMARY KEY,
          start_time TIMESTAMPTZ NOT NULL,
          end_time TIMESTAMPTZ,
          duration_hours DECIMAL(5,2),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `
    },
    {
      name: 'fasting_exercises',
      sql: `
        CREATE TABLE IF NOT EXISTS fasting_exercises (
          id SERIAL PRIMARY KEY,
          description TEXT NOT NULL,
          duration INTEGER NOT NULL,
          calories_burned INTEGER,
          timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `
    }
  ];

  for (const table of tables) {
    const { error } = await client.rpc('exec_sql', { sql: table.sql });
    if (error) {
      console.warn(`Warning: Could not create table ${table.name}:`, error.message);
    }
  }
}

/**
 * Test Supabase connection
 */
export async function testSupabaseConnection() {
  const client = getSupabaseClient();
  if (!client) {
    return false;
  }

  try {
    const { data, error } = await client.from('fasting_meals').select('count').limit(1);
    return !error;
  } catch (error) {
    return false;
  }
}

/**
 * Check if Supabase is configured and available
 */
export function isSupabaseConfigured() {
  const config = getSupabaseConfig();
  return !!(config.url && config.serviceRoleKey);
}

export { getSupabaseClient };