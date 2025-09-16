import { NextResponse } from 'next/server';
import { loadMonthlyAmountBreakdown } from '../../../../lib/parseCsv';

export async function GET() {
  try {
    const breakdown = loadMonthlyAmountBreakdown();
    return NextResponse.json({ breakdown });
  } catch (error) {
    console.error('Error loading revenue amount breakdown:', error);
    return NextResponse.json(
      { error: 'Failed to load revenue amount breakdown' },
      { status: 500 }
    );
  }
}
