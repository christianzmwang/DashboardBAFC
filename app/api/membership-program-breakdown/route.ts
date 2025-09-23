import { NextResponse } from 'next/server';
import { loadMonthlyProgramBreakdown } from '../../../lib/parseCsv';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
  const file = searchParams.get('file') || 'memberships_all.csv';
  const allowed = ['memberships_all.csv','memberships_first.csv'];
    if (!allowed.includes(file)) {
      return NextResponse.json({ error: 'Invalid file parameter.' }, { status: 400 });
    }
    const data = loadMonthlyProgramBreakdown(file);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error loading membership program breakdown:', error);
    return NextResponse.json({ error: 'Failed to load membership program breakdown' }, { status: 500 });
  }
}
