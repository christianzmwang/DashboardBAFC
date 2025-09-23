import { NextResponse } from 'next/server';
import { loadPayments } from '../../../../lib/parseCsv';

export async function GET() {
  try {
    const payments = loadPayments();

    const transactions = payments
      .filter(p => p.transactionAt)
      .map(p => {
        const [datePart = '', timePart = ''] = p.transactionAt.split(' ');
        const month = datePart.slice(0, 7);
        return {
          invoiceNumber: p.invoiceNumber,
          invoiceId: p.invoiceId,
          invoiceStatus: p.invoiceStatus,
          transactionAt: p.transactionAt,
          transactionDate: datePart,
          transactionTime: timePart,
          month,
          transactionStatus: p.transactionStatus,
          transactionType: p.transactionType,
          paymentMethod: p.paymentMethod,
          payer: p.payer,
          payerHomeLocation: p.payerHomeLocation,
          paymentAmount: Number.isFinite(p.paymentAmount) ? p.paymentAmount : 0,
          transactionAmount: Number.isFinite(p.transactionAmount) ? p.transactionAmount : 0,
          amountBucket: String(Math.round(Number.isFinite(p.paymentAmount) ? p.paymentAmount : 0)),
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
