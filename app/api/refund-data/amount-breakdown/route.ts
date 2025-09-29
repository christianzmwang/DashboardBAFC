import { NextResponse } from 'next/server';
import { loadMonthlyRefundAmountBreakdown } from '../../../../lib/parseCsv';

export async function GET() {
  try {
    const breakdown = loadMonthlyRefundAmountBreakdown();
    return NextResponse.json({ breakdown });
  } catch (error) {
    console.error('Error loading refund amount breakdown:', error);
    return NextResponse.json(
      { error: 'Failed to load refund amount breakdown' },
      { status: 500 }
    );
  }
}


