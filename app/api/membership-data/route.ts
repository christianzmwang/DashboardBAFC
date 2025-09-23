import { NextResponse } from 'next/server';
import { loadMembershipData } from '../../../lib/parseCsv';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
  const file = searchParams.get('file') || 'memberships_all.csv';
  const allowed = ['memberships_all.csv','memberships_first.csv'];
    if (!allowed.includes(file)) {
      return NextResponse.json({ error: 'Invalid file parameter.' }, { status: 400 });
    }
    const data = loadMembershipData(file);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error loading membership data:', error);
    return NextResponse.json(
      { error: 'Failed to load membership data' },
      { status: 500 }
    );
  }
}
