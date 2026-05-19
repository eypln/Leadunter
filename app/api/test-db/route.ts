import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Direct test without helper function
    const { data, error } = await supabaseAdmin
      .from('pg_catalog.pg_tables')
      .select('tablename')
      .limit(1);

    if (error) {
      return NextResponse.json({
        success: false,
        message: 'Supabase query failed',
        error: error.message,
        code: error.code
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Connected to Supabase successfully!',
      tablesFound: data?.length || 0
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      message: 'Exception occurred',
      error: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : undefined
    }, { status: 500 });
  }
}
