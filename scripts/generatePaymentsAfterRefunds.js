// Simple Node script to generate a payments_after_refunds.csv by subtracting
// refund amounts from payments per Invoice Number.
// Reads: public/payments.csv, public/refunds.csv
// Writes: public/payments_after_refunds.csv

const fs = require('fs');
const path = require('path');

function amountToNumber(raw) {
  const s = (raw || '').trim();
  if (!s) return 0;
  return Number(s.replace(/[$,\"]/g, ''));
}

function readCsv(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.trim().split(/\r?\n/);
  const headerLine = lines.shift();
  const headers = headerLine.split(',');
  const idx = (h) => headers.indexOf(h);
  const rows = [];
  for (const l of lines) {
    if (!l.trim()) continue;
    const parts = l.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/);
    rows.push({ headers, parts, idx });
  }
  return { headers, rows };
}

function writeCsv(filePath, headers, rows) {
  const headerLine = headers.join(',');
  const body = rows.map((parts) => parts.join(',')).join('\n');
  const out = `${headerLine}\n${body}\n`;
  fs.writeFileSync(filePath, out, 'utf8');
}

function ensureQuoted(value) {
  if (value == null) return '';
  const s = String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/\"/g, '"')}"`;
  return s;
}

function formatCurrency(n) {
  const fixed = (Number.isFinite(n) ? n : 0).toFixed(2);
  // Always quote currency fields to preserve commas
  return `"$${Number(fixed).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}"`;
}

(function main() {
  const root = process.cwd();
  const paymentsPath = path.join(root, 'public', 'payments.csv');
  const refundsPath = path.join(root, 'public', 'refunds.csv');
  const outputPath = path.join(root, 'public', 'payments_after_refunds.csv');

  if (!fs.existsSync(paymentsPath)) {
    throw new Error(`Missing payments file at ${paymentsPath}`);
  }
  if (!fs.existsSync(refundsPath)) {
    throw new Error(`Missing refunds file at ${refundsPath}`);
  }

  const { headers: paymentHeaders, rows: paymentRows } = readCsv(paymentsPath);
  const { headers: refundHeaders, rows: refundRows } = readCsv(refundsPath);

  const invIdxPayments = (h) => paymentHeaders.indexOf(h);
  const invIdxRefunds = (h) => refundHeaders.indexOf(h);

  const pIdx = {
    invoiceNumber: invIdxPayments('Invoice Number'),
    transactionDate: invIdxPayments('Transaction Date'),
    transactionAmount: invIdxPayments('Transaction Amount'),
    payerHomeLocation: invIdxPayments('Payer Home Location'),
    transactionId: invIdxPayments('Transaction ID'),
    invoiceId: invIdxPayments('Invoice ID'),
    currency: invIdxPayments('Currency Code'),
  };

  const rIdx = {
    invoiceNumber: invIdxRefunds('Invoice Number'),
    transactionDate: invIdxRefunds('Transaction Date'),
    transactionAmount: invIdxRefunds('Transaction Amount'),
    payer: invIdxRefunds('Payer'),
    payerHomeLocation: invIdxRefunds('Payer Home Location'),
    transactionId: invIdxRefunds('Transaction ID'),
    invoiceId: invIdxRefunds('Invoice ID'),
    currency: invIdxRefunds('Currency Code'),
  };

  // Build refund totals per invoice number
  const refundTotalByInvoice = new Map();
  for (const row of refundRows) {
    const inv = (row.parts[rIdx.invoiceNumber] || '').replace(/\"/g, '');
    const amt = amountToNumber(row.parts[rIdx.transactionAmount]);
    if (!inv) continue;
    refundTotalByInvoice.set(inv, (refundTotalByInvoice.get(inv) || 0) + amt);
  }

  // Build output rows with net amounts; skip fully refunded payments (<= 0)
  const outHeaders = paymentHeaders; // keep same schema
  const outRows = [];

  for (const row of paymentRows) {
    const inv = (row.parts[pIdx.invoiceNumber] || '').replace(/\"/g, '');
    const gross = amountToNumber(row.parts[pIdx.transactionAmount]);
    const refunded = refundTotalByInvoice.get(inv) || 0;
    const net = gross - refunded;
    if (net <= 0) {
      // Fully refunded or negative due to multiple refunds; drop the row
      continue;
    }

    const parts = [...row.parts];
    // Overwrite Transaction Amount with net amount, formatted as currency
    parts[pIdx.transactionAmount] = formatCurrency(net);

    // Normalize quoting for other fields that might contain commas
    parts[pIdx.payerHomeLocation] = ensureQuoted(parts[pIdx.payerHomeLocation]);

    outRows.push(parts);
  }

  writeCsv(outputPath, outHeaders, outRows);
  console.log(`Wrote ${outRows.length} rows to ${outputPath}`);
})();


