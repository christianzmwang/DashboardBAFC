import { NextResponse } from 'next/server';
import { loadRefundLocationData } from '../../../lib/parseCsv';

export async function GET() {
  try {
    const data = loadRefundLocationData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error loading refund aggregates:', error);
    return NextResponse.json({ error: 'Failed to load refund aggregates' }, { status: 500 });
  }
}


