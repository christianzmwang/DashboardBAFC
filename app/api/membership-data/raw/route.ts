import { NextResponse } from 'next/server';
import { loadMembers } from '../../../../lib/parseCsv';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
  const file = searchParams.get('file') || 'memberships_all.csv';
  const allowed = ['memberships_all.csv','memberships_first.csv'];
    if (!allowed.includes(file)) {
      return NextResponse.json({ error: 'Invalid file parameter' }, { status: 400 });
    }
    const members = loadMembers(file);
    // Strip planId before returning
    const safeMembers = members.map(({ planId, ...rest }) => rest);
    return NextResponse.json({ members: safeMembers });
  } catch (e) {
    console.error('Error loading raw members:', e);
    return NextResponse.json({ error: 'Failed to load members' }, { status: 500 });
  }
}
