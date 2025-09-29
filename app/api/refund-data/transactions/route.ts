import { NextResponse } from 'next/server';
import { loadRefunds } from '../../../../lib/parseCsv';

export async function GET() {
  try {
    const refunds = loadRefunds();
    const rows = refunds
      .filter(r => r.transactionDate)
      .map(r => {
        const date = r.transactionDate.split('T')[0] || r.transactionDate;
        const month = date.slice(0, 7);
        return {
          invoiceNumber: r.invoiceNumber,
          invoiceId: r.invoiceId,
          transactionId: r.transactionId,
          transactionDate: date,
          month,
          payer: r.payer,
          payerHomeLocation: r.payerHomeLocation,
          transactionAmount: Number.isFinite(r.transactionAmount) ? r.transactionAmount : 0,
          currency: r.currency,
        };
      })
      .filter(r => r.month && r.month >= '2022-01');

    return NextResponse.json({ refunds: rows });
  } catch (error) {
    console.error('Error loading refund transactions:', error);
    return NextResponse.json({ error: 'Failed to load refund transactions' }, { status: 500 });
  }
}


