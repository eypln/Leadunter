import { supabaseAdmin } from './client';

/**
 * Test Supabase connection
 * Returns connection status and project info
 */
export async function testSupabaseConnection() {
  try {
    // Simple query to test connection - query pg_tables to see if we can connect
    const { data, error } = await supabaseAdmin
      .from('pg_tables')
      .select('tablename')
      .limit(1);

    if (error) {
      return {
        success: false,
        message: 'Failed to connect to Supabase',
        error: error.message
      };
    }

    return {
      success: true,
      message: 'Connected to Supabase successfully! Database is ready.',
      error: null,
      data: data
    };
  } catch (err) {
    return {
      success: false,
      message: 'Failed to connect to Supabase',
      error: err instanceof Error ? err.message : 'Unknown error'
    };
  }
}
