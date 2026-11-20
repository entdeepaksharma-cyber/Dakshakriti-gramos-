import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  PlusCircle,
  Wallet,
} from 'lucide-react';
import { useGramosStore } from '../../context/StoreContext';
import { ConsignmentRecord, ExpenseRecord, SupplierCreditEntry } from '../../types/gramos';
import { daysUntil, downloadCsv, formatDateShort, formatINR } from '../../utils/formatters';

type RegisterTab =
  | 'credit'
  | 'consignment'
  | 'ageing'
  | 'cash'
  | 'expenses';

export const RegistersView: React.FC = () => {
  const {
    state,
    metrics,
    activeRole,
    getCreditStatus,
    paySupplierCredit,
    settleConsignment,
    recordCashReconciliation,
    addExpense,
  } = useGramosStore();

  const [tab, setTab] = useState<RegisterTab>('credit');
  const [payingCredit, setPayingCredit] = useState<SupplierCreditEntry | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payMode, setPayMode] = useState<'Bank / UPI' | 'Cash'>('Bank / UPI');

  const [settlingCon, setSettlingCon] = useState<ConsignmentRecord | null>(null);
  const [settleUnits, setSettleUnits] = useState(0);
  const [settleRef, setSettleRef] = useState('');

  // Cash Reconciliation form
  const [countedCash, setCountedCash] = useState(state.outletConfig.openingCashFloat);
  const [digitalVerified, setDigitalVerified] = useState(true);
  const [cashRemarks, setCashRemarks] = useState('');

  // Expense form
  const [showExpModal, setShowExpModal] = useState(false);
  const [expForm, setExpForm] = useState<{
    category: ExpenseRecord['category'];
    head: ExpenseRecord['head'];
    description: string;
    amount: number;
    paymentMode: 'Cash' | 'Bank / UPI';
    voucherRef: string;
  }>({
    category: 'Variable',
    head: 'Packaging & Labels',
    description: '',
    amount: 500,
    paymentMode: 'Cash',
    voucherRef: `VCH-2611-${String(state.expenses.length + 1).padStart(2, '0')}`,
  });

  const handleExportCurrent = () => {
    if (tab === 'credit') {
      downloadCsv(
        'gramos-supplier-credit-register.csv',
        ['Supplier', 'Invoice', 'Purchase Date', 'Due Date', 'Total', 'Paid', 'Balance', 'Status'],
        state.creditEntries.map((c) => [
          c.supplierName,
          c.invoiceNo,
          c.purchaseDate,
          c.dueDate,
          c.totalAmount,
          c.paidAmount,
          c.totalAmount - c.paidAmount,
          getCreditStatus(c),
        ])
      );
    } else if (tab === 'consignment') {
      downloadCsv(
        'gramos-consignment-settlement-register.csv',
        ['Agreement', 'Supplier', 'SKU', 'Product', 'Received', 'Sold', 'Settled', 'Payable (₹)'],
        state.consignments.map((c) => {
          const pending = Math.max(0, c.soldQty - c.settledQty);
          const payable = Math.round(
            pending * c.unitSellingPrice * (1 - c.gramosCommissionPct / 100)
          );
          return [
            c.agreementRef,
            c.supplierName,
            c.sku,
            c.productName,
            c.receivedQty,
            c.soldQty,
            c.settledQty,
            payable,
          ];
        })
      );
    } else if (tab === 'ageing') {
      downloadCsv(
        'gramos-stock-ageing-expiry-register.csv',
        ['SKU', 'Product', 'Ownership', 'Batch', 'Expiry', 'Stock Qty', 'Cost Value'],
        state.products.map((p) => [
          p.sku,
          p.name,
          p.ownershipType,
          p.batchNumber,
          p.expiryDate || 'Non-perishable',
          p.stockQty,
          p.stockQty * p.landedCost,
        ])
      );
    } else if (tab === 'expenses') {
      downloadCsv(
        'gramos-expense-register.csv',
        ['Date', 'Voucher', 'Category', 'Head', 'Description', 'Amount', 'Mode'],
        state.expenses.map((e) => [
          e.date,
          e.voucherRef,
          e.category,
          e.head,
          e.description,
          e.amount,
          e.paymentMode,
        ])
      );
    }
  };

  return (
    <div className="space-y-5">
      {/* Register Switcher + Export */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {[
            { id: 'credit', label: 'Supplier Credit & Limits' },
            { id: 'consignment', label: 'Consignment Settlement' },
            { id: 'ageing', label: 'Ownership & FEFO Ageing' },
            { id: 'cash', label: 'Cash Control & Working Capital' },
            { id: 'expenses', label: 'Expenses & Capital' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id as RegisterTab)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                tab === item.id
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleExportCurrent}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 self-start sm:self-auto"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* TAB 1: Supplier Credit, Outstanding Payment & Credit Limit Registers */}
      {tab === 'credit' && (
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-semibold text-slate-900">
                  Supplier Credit & Outstanding Payment Ageing Register
                </h3>
                <p className="text-xs text-slate-500">
                  Never treat supplier credit as free working capital · Track due dates and settlement history
                </p>
              </div>
              <div className="font-mono text-sm font-semibold tabular-nums text-slate-900">
                Total Due: {formatINR(metrics.supplierCreditOutstanding)}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                    <th className="py-3 px-4">Supplier & Invoice</th>
                    <th className="py-3 px-3">Terms · Due Date</th>
                    <th className="py-3 px-3 text-right">Invoice Amt</th>
                    <th className="py-3 px-3 text-right">Paid</th>
                    <th className="py-3 px-3 text-right">Outstanding</th>
                    <th className="py-3 px-3">Ageing Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {state.creditEntries.map((c) => {
                    const balance = c.totalAmount - c.paidAmount;
                    const status = getCreditStatus(c);
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4">
                          <div className="text-xs font-semibold text-slate-900">
                            {c.supplierName}
                          </div>
                          <div className="font-mono text-[11px] text-slate-500">
                            {c.invoiceNo} · {formatDateShort(c.purchaseDate)}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-xs text-slate-600">
                          <div>{c.creditDays}-day credit</div>
                          <div className="font-mono text-[11px]">{formatDateShort(c.dueDate)}</div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-xs tabular-nums text-slate-700">
                          {formatINR(c.totalAmount)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-xs tabular-nums text-emerald-700">
                          {formatINR(c.paidAmount)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-xs font-semibold tabular-nums text-slate-900">
                          {formatINR(balance)}
                        </td>
                        <td className="py-3 px-3 text-xs">
                          <span
                            className={`font-semibold ${
                              status === 'Overdue'
                                ? 'text-red-600'
                                : status === 'Due Shortly'
                                ? 'text-amber-700'
                                : status === 'Settled'
                                ? 'text-emerald-700'
                                : 'text-slate-700'
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {balance > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setPayingCredit(c);
                                setPayAmount(balance);
                              }}
                              className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                            >
                              Record Payment
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Supplier Credit Limit Register */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-display text-base font-semibold text-slate-900 mb-3">
              Supplier Credit Limit Register
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {state.suppliers
                .filter((s) => s.creditLimit > 0)
                .map((s) => {
                  const used = state.creditEntries
                    .filter((c) => c.supplierId === s.id)
                    .reduce((sum, c) => sum + Math.max(0, c.totalAmount - c.paidAmount), 0);
                  const pct = Math.min(100, Math.round((used / s.creditLimit) * 100));
                  return (
                    <div key={s.id} className="rounded-lg border border-slate-200 p-3.5 space-y-2">
                      <div className="text-xs font-semibold text-slate-900 truncate">
                        {s.name}
                      </div>
                      <div className="flex justify-between text-xs font-mono tabular-nums text-slate-600">
                        <span>Used: {formatINR(used)}</span>
                        <span>Limit: {formatINR(s.creditLimit)}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full ${pct > 80 ? 'bg-red-600' : 'bg-teal-700'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Consignment Inventory & Sales Settlement Registers */}
      {tab === 'consignment' && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900">
                Consignment Inventory & Sales Settlement Register
              </h3>
              <p className="text-xs text-slate-500">
                Supplier retains ownership until sale · Settle strictly for sold units per written terms
              </p>
            </div>
            <div className="font-mono text-sm font-semibold tabular-nums text-slate-900">
              Pending Settlement: {formatINR(metrics.consignmentPayable)}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                  <th className="py-3 px-4">Consignor & Product</th>
                  <th className="py-3 px-3 text-right">Received</th>
                  <th className="py-3 px-3 text-right">Sold</th>
                  <th className="py-3 px-3 text-right">Settled</th>
                  <th className="py-3 px-3 text-right">Unsettled</th>
                  <th className="py-3 px-3 text-right">Payable (Net of Comm)</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.consignments.map((con) => {
                  const unsettled = Math.max(0, con.soldQty - con.settledQty);
                  const payoutPerUnit =
                    con.unitSellingPrice * (1 - con.gramosCommissionPct / 100);
                  const payable = Math.round(unsettled * payoutPerUnit);

                  return (
                    <tr key={con.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <div className="text-xs font-semibold text-slate-900">
                          {con.productName}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {con.supplierName} · {con.agreementRef} · {con.gramosCommissionPct}% margin
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-xs tabular-nums">
                        {con.receivedQty}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-xs tabular-nums font-medium">
                        {con.soldQty}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-xs tabular-nums text-emerald-700">
                        {con.settledQty}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-xs tabular-nums font-semibold text-amber-700">
                        {unsettled}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-xs tabular-nums font-semibold text-slate-900">
                        {formatINR(payable)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {unsettled > 0 ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSettlingCon(con);
                              setSettleUnits(unsettled);
                              setSettleRef('');
                            }}
                            className="rounded-md bg-teal-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-800"
                          >
                            Settle Sold
                          </button>
                        ) : (
                          <span className="text-xs text-emerald-700 font-medium">Settled</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Inventory Ownership & Stock Ageing / Expiry Register */}
      {tab === 'ageing' && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="font-display text-base font-semibold text-slate-900">
              Inventory Ownership & Stock Ageing / FEFO Expiry Register
            </h3>
            <p className="text-xs text-slate-500">
              Self-Funded vs Supplier-Credit vs Consignment classification + expiry alerts
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                  <th className="py-3 px-4">SKU & Product</th>
                  <th className="py-3 px-3">Ownership Class</th>
                  <th className="py-3 px-3">Batch · Expiry</th>
                  <th className="py-3 px-3 text-right">Days Left</th>
                  <th className="py-3 px-3 text-right">Stock Qty</th>
                  <th className="py-3 px-4 text-right">Cost Valuation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.products.map((p) => {
                  const d = daysUntil(p.expiryDate);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-4 text-xs">
                        <div className="font-semibold text-slate-900">{p.name}</div>
                        <div className="font-mono text-[11px] text-slate-400">{p.sku}</div>
                      </td>
                      <td className="py-2.5 px-3 text-xs font-medium text-slate-800">
                        {p.ownershipType}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-xs text-slate-600">
                        {p.batchNumber} · {p.expiryDate ? formatDateShort(p.expiryDate) : 'None'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-xs tabular-nums">
                        {d === null ? (
                          '—'
                        ) : (
                          <span
                            className={
                              d < 0
                                ? 'text-red-600 font-semibold'
                                : d <= 35
                                ? 'text-amber-700 font-semibold'
                                : 'text-slate-700'
                            }
                          >
                            {d}d
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-xs tabular-nums">
                        {p.stockQty}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-xs font-semibold tabular-nums text-slate-900">
                        {p.ownershipType === 'Consignment'
                          ? 'Off-Balance'
                          : formatINR(p.stockQty * p.landedCost)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Working Capital & Daily Cash Reconciliation SOP */}
      {tab === 'cash' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Wallet className="h-4 w-4 text-teal-700" />
              <h3 className="font-display text-base font-semibold text-slate-900">
                Daily Closing Cash Reconciliation (SOP-07)
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Record counted physical cash vs expected drawer balance. Never silently adjust cash differences.
            </p>

            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Expected Drawer Balance</span>
                <span className="font-mono font-semibold tabular-nums text-slate-900">
                  {formatINR(metrics.availableCash)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Bank / UPI Balance</span>
                <span className="font-mono font-semibold tabular-nums text-slate-900">
                  {formatINR(metrics.bankBalance)}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <label className="block">
                <span className="font-medium text-slate-700">Actual Physical Cash Counted (₹)</span>
                <input
                  type="number"
                  value={countedCash}
                  onChange={(e) => setCountedCash(Number(e.target.value) || 0)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
                />
              </label>

              <label className="flex items-center gap-2 text-slate-700">
                <input
                  type="checkbox"
                  checked={digitalVerified}
                  onChange={(e) => setDigitalVerified(e.target.checked)}
                  className="h-4 w-4 accent-teal-700"
                />
                <span>UPI settlement statement matched with POS bills</span>
              </label>

              <label className="block">
                <span className="font-medium text-slate-700">Variance Remarks</span>
                <input
                  type="text"
                  value={cashRemarks}
                  onChange={(e) => setCashRemarks(e.target.value)}
                  placeholder="Note coin rounding or variance investigation..."
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  recordCashReconciliation({
                    date: new Date().toISOString().slice(0, 10),
                    openingCash: 10000,
                    expectedCashSales: metrics.availableCash - 10000,
                    cashExpenses: 0,
                    cashRefunds: 0,
                    expectedClosingCash: metrics.availableCash,
                    actualCountedCash: countedCash,
                    digitalCollections: metrics.bankBalance,
                    digitalVerified,
                    remarks: cashRemarks || 'Daily closing verified',
                    closedBy: activeRole,
                  });
                  setCashRemarks('');
                }}
                className="w-full rounded-lg bg-slate-900 py-2.5 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Submit Daily Closing Report
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4 flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-slate-900">
                Working Capital & Reconciliation History
              </h3>
              <span className="font-mono text-xs font-semibold text-teal-700 tabular-nums">
                Net WC: {formatINR(metrics.workingCapital)}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-3 text-right">Expected Cash</th>
                    <th className="py-3 px-3 text-right">Counted Cash</th>
                    <th className="py-3 px-3 text-right">Difference</th>
                    <th className="py-3 px-4">Remarks & Closed By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {state.reconciliations.map((r) => (
                    <tr key={r.id}>
                      <td className="py-3 px-4 font-mono text-xs">{formatDateShort(r.date)}</td>
                      <td className="py-3 px-3 text-right font-mono text-xs tabular-nums">
                        {formatINR(r.expectedClosingCash)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-xs tabular-nums font-semibold">
                        {formatINR(r.actualCountedCash)}
                      </td>
                      <td
                        className={`py-3 px-3 text-right font-mono text-xs font-semibold tabular-nums ${
                          r.difference === 0 ? 'text-emerald-700' : 'text-red-600'
                        }`}
                      >
                        {r.difference >= 0 ? `+${r.difference}` : r.difference}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        <div>{r.remarks}</div>
                        <div className="text-[11px] text-slate-400">{r.closedBy}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Expense Register & Capital Contributions */}
      {tab === 'expenses' && (
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-semibold text-slate-900">
                  Approved Expense Register (GRM-FIN-001)
                </h3>
                <p className="text-xs text-slate-500">
                  Every business expense requires voucher reference and approval; personal expenses strictly excluded
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowExpModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-800"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Log Expense
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                    <th className="py-3 px-4">Date · Voucher</th>
                    <th className="py-3 px-3">Category · Head</th>
                    <th className="py-3 px-3">Description</th>
                    <th className="py-3 px-3">Mode · Approved By</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {state.expenses.map((e) => (
                    <tr key={e.id}>
                      <td className="py-3 px-4 text-xs">
                        <div className="font-mono text-slate-900">{e.voucherRef}</div>
                        <div className="text-[11px] text-slate-500">{formatDateShort(e.date)}</div>
                      </td>
                      <td className="py-3 px-3 text-xs">
                        <div className="font-semibold text-slate-900">{e.head}</div>
                        <div className="text-[11px] text-slate-500">{e.category}</div>
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-700">{e.description}</td>
                      <td className="py-3 px-3 text-xs text-slate-600">
                        {e.paymentMode} · {e.approvedBy}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs font-semibold tabular-nums text-slate-900">
                        {formatINR(e.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-display text-base font-semibold text-slate-900 mb-3">
              Capital Contribution Record
            </h3>
            {state.capitalContributions.map((cap) => (
              <div
                key={cap.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-slate-200 p-3.5 text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-900">{cap.contributor}</div>
                  <div className="text-slate-500">
                    {formatDateShort(cap.date)} · {cap.nature} · {cap.purpose}
                  </div>
                </div>
                <div className="font-mono text-base font-semibold tabular-nums text-teal-800">
                  {formatINR(cap.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pay Supplier Credit Modal */}
      {payingCredit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
            <h3 className="font-display text-base font-semibold text-slate-900">
              Settle Supplier Credit Invoice
            </h3>
            <div className="text-xs text-slate-600">
              <strong>{payingCredit.supplierName}</strong> · Inv {payingCredit.invoiceNo}
            </div>
            <div className="space-y-3 text-xs">
              <label className="block">
                <span className="font-medium text-slate-700">Payment Amount (₹)</span>
                <input
                  type="number"
                  min={1}
                  max={payingCredit.totalAmount - payingCredit.paidAmount}
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value) || 0)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                />
              </label>
              <label className="block">
                <span className="font-medium text-slate-700">Payment Mode</span>
                <select
                  value={payMode}
                  onChange={(e) => setPayMode(e.target.value as 'Bank / UPI' | 'Cash')}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  <option value="Bank / UPI">Bank / UPI</option>
                  <option value="Cash">Cash Drawer</option>
                </select>
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPayingCredit(null)}
                className="rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  paySupplierCredit(payingCredit.id, payAmount, payMode);
                  setPayingCredit(null);
                }}
                className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settle Consignment Modal */}
      {settlingCon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
            <h3 className="font-display text-base font-semibold text-slate-900">
              Settle Sold Consignment Units
            </h3>
            <div className="text-xs text-slate-600">
              <strong>{settlingCon.supplierName}</strong> · {settlingCon.productName}
            </div>
            <div className="space-y-3 text-xs">
              <label className="block">
                <span className="font-medium text-slate-700">
                  Units to Settle (Max {settlingCon.soldQty - settlingCon.settledQty})
                </span>
                <input
                  type="number"
                  min={1}
                  max={settlingCon.soldQty - settlingCon.settledQty}
                  value={settleUnits}
                  onChange={(e) => setSettleUnits(Number(e.target.value) || 1)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                />
              </label>
              <label className="block">
                <span className="font-medium text-slate-700">UPI / Payment Reference</span>
                <input
                  type="text"
                  value={settleRef}
                  onChange={(e) => setSettleRef(e.target.value)}
                  placeholder="e.g., UPI-884201"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                />
              </label>
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 flex justify-between">
                <span>Producer Payout ({100 - settlingCon.gramosCommissionPct}%):</span>
                <strong className="font-mono text-slate-900">
                  {formatINR(
                    Math.round(
                      settleUnits *
                        settlingCon.unitSellingPrice *
                        (1 - settlingCon.gramosCommissionPct / 100)
                    )
                  )}
                </strong>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSettlingCon(null)}
                className="rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  settleConsignment(settlingCon.id, settleUnits, settleRef);
                  setSettlingCon(null);
                }}
                className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white"
              >
                Record Settlement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showExpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
            <h3 className="font-display text-base font-semibold text-slate-900">
              Record Approved Operating Expense
            </h3>
            <div className="space-y-3 text-xs">
              <label className="block">
                <span className="font-medium text-slate-700">Expense Classification</span>
                <select
                  value={expForm.category}
                  onChange={(e) =>
                    setExpForm({
                      ...expForm,
                      category: e.target.value as ExpenseRecord['category'],
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  <option value="Fixed / Recurring">Fixed / Recurring</option>
                  <option value="Variable">Variable</option>
                  <option value="One-Time Fit-Out">One-Time Fit-Out</option>
                </select>
              </label>
              <label className="block">
                <span className="font-medium text-slate-700">Expense Head</span>
                <select
                  value={expForm.head}
                  onChange={(e) =>
                    setExpForm({ ...expForm, head: e.target.value as ExpenseRecord['head'] })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  <option value="Staff Salaries">Staff Salaries</option>
                  <option value="Utilities & Electricity">Utilities & Electricity</option>
                  <option value="Internet & POS Software">Internet & POS Software</option>
                  <option value="Transportation & Logistics">Transportation & Logistics</option>
                  <option value="Packaging & Labels">Packaging & Labels</option>
                  <option value="Marketing & Sampling">Marketing & Sampling</option>
                  <option value="Repairs & Maintenance">Repairs & Maintenance</option>
                  <option value="Shelving & Equipment">Shelving & Equipment</option>
                </select>
              </label>
              <label className="block">
                <span className="font-medium text-slate-700">Description</span>
                <input
                  type="text"
                  value={expForm.description}
                  onChange={(e) => setExpForm({ ...expForm, description: e.target.value })}
                  placeholder="Invoice/receipt details..."
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="font-medium text-slate-700">Amount (₹)</span>
                  <input
                    type="number"
                    min={1}
                    value={expForm.amount}
                    onChange={(e) =>
                      setExpForm({ ...expForm, amount: Number(e.target.value) || 0 })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                  />
                </label>
                <label className="block">
                  <span className="font-medium text-slate-700">Voucher Ref</span>
                  <input
                    type="text"
                    value={expForm.voucherRef}
                    onChange={(e) => setExpForm({ ...expForm, voucherRef: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                  />
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowExpModal(false)}
                className="rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!expForm.description.trim()}
                onClick={() => {
                  addExpense({
                    date: new Date().toISOString().slice(0, 10),
                    category: expForm.category,
                    head: expForm.head,
                    description: expForm.description.trim(),
                    amount: expForm.amount,
                    paymentMode: expForm.paymentMode,
                    approvedBy: activeRole,
                    voucherRef: expForm.voucherRef,
                  });
                  setShowExpModal(false);
                }}
                className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                Save Expense
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
