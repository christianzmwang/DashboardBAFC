import { NextResponse } from 'next/server';
import { loadLocationAmountBreakdown } from '../../../../lib/parseCsv';

export async function GET() {
  try {
    const data = loadLocationAmountBreakdown();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error loading location amount breakdown:', error);
    return NextResponse.json(
      { error: 'Failed to load location amount breakdown' },
      { status: 500 }
    );
  }
}
