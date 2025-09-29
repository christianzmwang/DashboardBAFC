import { NextResponse } from 'next/server';
import { loadPayments } from '../../../../lib/parseCsv';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const net = searchParams.get('net') === '1';
    const filename = net ? 'payments_after_refunds.csv' : 'payments.csv';
    const payments = loadPayments(filename);

    const transactions = payments
      .filter(p => p.transactionDate)
      .map(p => {
        const datePart = p.transactionDate;
        const month = datePart.slice(0, 7);
        return {
          invoiceNumber: p.invoiceNumber,
          invoiceId: p.invoiceId,
          transactionId: p.transactionId,
          transactionDate: datePart,
          month,
          payerHomeLocation: p.payerHomeLocation,
          transactionAmount: Number.isFinite(p.transactionAmount) ? p.transactionAmount : 0,
          amountBucket: String(Math.round(Number.isFinite(p.transactionAmount) ? p.transactionAmount : 0)),
          currency: p.currency,
        };
      })
      .filter(t => t.month && t.month >= '2022-01');

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('Error loading revenue transactions:', error);
    return NextResponse.json(
      { error: 'Failed to load revenue transactions' },
      { status: 500 }
    );
  }
}
