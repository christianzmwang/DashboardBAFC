import { NextResponse } from 'next/server';
import { loadLocationAmountBreakdown } from '../../../../lib/parseCsv';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const net = searchParams.get('net') === '1';
    const filename = net ? 'payments_after_refunds.csv' : 'payments.csv';
    const data = loadLocationAmountBreakdown(filename);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error loading location amount breakdown:', error);
    return NextResponse.json(
      { error: 'Failed to load location amount breakdown' },
      { status: 500 }
    );
  }
}
