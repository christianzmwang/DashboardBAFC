import { NextResponse } from 'next/server';
import { loadMonthlyAmountBreakdown } from '../../../../lib/parseCsv';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const net = searchParams.get('net') === '1';
    const filename = net ? 'payments_after_refunds.csv' : 'payments.csv';
    const breakdown = loadMonthlyAmountBreakdown(filename);
    return NextResponse.json({ breakdown });
  } catch (error) {
    console.error('Error loading revenue amount breakdown:', error);
    return NextResponse.json(
      { error: 'Failed to load revenue amount breakdown' },
      { status: 500 }
    );
  }
}
