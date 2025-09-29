import { NextResponse } from 'next/server';
import { loadRefundLocationAmountBreakdown } from '../../../../lib/parseCsv';

export async function GET() {
  try {
    const data = loadRefundLocationAmountBreakdown();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error loading refund amount breakdown by location:', error);
    return NextResponse.json(
      { error: 'Failed to load refund amount breakdown by location' },
      { status: 500 }
    );
  }
}


