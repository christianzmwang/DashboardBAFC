import { NextResponse } from 'next/server';
import { loadLocationData } from '../../../lib/parseCsv';

export async function GET() {
  try {
    const data = loadLocationData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error loading revenue data:', error);
    return NextResponse.json(
      { error: 'Failed to load revenue data' },
      { status: 500 }
    );
  }
}
