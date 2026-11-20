import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Minus,
  Plus,
  Printer,
  RotateCcw,
  Search,
  ShoppingBag,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { useGramosStore } from '../../context/StoreContext';
import { PaymentMode, Product, SaleLineItem, SaleTransaction, SalesChannel } from '../../types/gramos';
import { daysUntil, formatDateShort, formatINR } from '../../utils/formatters';

const CHANNELS: SalesChannel[] = [
  'Direct Retail',
  'WhatsApp Order',
  'Local Delivery',
  'Wholesale',
  'Institutional',
];

const PAYMENT_MODES: PaymentMode[] = ['Cash', 'UPI / Digital', 'Approved Credit'];

export const PosView: React.FC = () => {
  const { state, activeRole, recordSale, processReturn } = useGramosStore();

  const [tab, setTab] = useState<'billing' | 'history'>('billing');
  const [search, setSearch] = useState('');
  const [zoneFilter, setZoneFilter] = useState<string>('All');
  const [channel, setChannel] = useState<SalesChannel>('Direct Retail');
  const [customerId, setCustomerId] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI / Digital');
  const [digitalRef, setDigitalRef] = useState('');
  const [cart, setCart] = useState<{ product: Product; qty: number; discount: number }[]>([]);
  const [lastReceipt, setLastReceipt] = useState<SaleTransaction | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canModifyDiscount =
    activeRole === 'Founder / Operator' || activeRole === 'Store Manager';

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.products.filter((p) => {
      if (!p.active) return false;
      const matchesZone =
        zoneFilter === 'All' ||
        (zoneFilter === 'GRAMOSFUEL' && p.brand === 'GRAMOSFUEL') ||
        (zoneFilter === 'Made in Hadoti' && p.brand === 'Made in Hadoti') ||
        (zoneFilter === 'Grocery' && p.industry === 'Food and Grocery') ||
        (zoneFilter === 'Household' && p.industry === 'Household Essentials');
      if (!matchesZone) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q)
      );
    });
  }, [state.products, search, zoneFilter]);

  const addToCart = (product: Product) => {
    setErrorMsg(null);
    const expDays = daysUntil(product.expiryDate);
    if (expDays !== null && expDays < 0) {
      setErrorMsg(`Blocked by FEFO SOP: ${product.name} batch ${product.batchNumber} is expired.`);
      return;
    }
    if (product.stockQty <= 0) {
      setErrorMsg(`${product.name} is out of saleable stock.`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id);
      if (existing) {
        if (existing.qty + 1 > product.stockQty) {
          setErrorMsg(`Only ${product.stockQty} units available in stock.`);
          return prev;
        }
        return prev.map((c) =>
          c.product.id === product.id ? { ...c, qty: c.qty + 1 } : c
        );
      }
      return [...prev, { product, qty: 1, discount: 0 }];
    });
  };

  const addBundle = (skus: string[]) => {
    for (const sku of skus) {
      const p = state.products.find((item) => item.sku === sku);
      if (p && p.stockQty > 0) addToCart(p);
    }
  };

  const updateCartQty = (productId: string, delta: number) => {
    setErrorMsg(null);
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.product.id !== productId) return c;
          const nextQty = c.qty + delta;
          if (nextQty > c.product.stockQty) {
            setErrorMsg(`Max available stock for ${c.product.name} is ${c.product.stockQty}.`);
            return c;
          }
          return { ...c, qty: nextQty };
        })
        .filter((c) => c.qty > 0)
    );
  };

  const updateCartDiscount = (productId: string, val: number) => {
    if (!canModifyDiscount) {
      setErrorMsg('SOP-06 Guardrail: Billing Operators cannot apply custom discounts without Manager/Founder approval.');
      return;
    }
    setCart((prev) =>
      prev.map((c) => (c.product.id === productId ? { ...c, discount: Math.max(0, val) } : c))
    );
  };

  const subtotal = cart.reduce((sum, c) => sum + c.product.sellingPrice * c.qty, 0);
  const discountTotal = cart.reduce((sum, c) => sum + c.discount, 0);
  const grandTotal = Math.max(0, subtotal - discountTotal);
  const cogsTotal = cart.reduce((sum, c) => sum + c.product.landedCost * c.qty, 0);

  const selectedCustomer = state.customers.find((c) => c.id === customerId) || null;

  const handleCheckout = () => {
    setErrorMsg(null);
    if (cart.length === 0) return;

    if (paymentMode === 'Approved Credit') {
      if (!selectedCustomer || selectedCustomer.creditLimit <= 0) {
        setErrorMsg('SOP-13 Rule: Approved Credit sales require a verified Wholesale/Institutional customer with an active credit limit.');
        return;
      }
      if (selectedCustomer.outstandingCredit + grandTotal > selectedCustomer.creditLimit) {
        setErrorMsg(
          `Credit limit exceeded for ${selectedCustomer.name}. Available credit: ${formatINR(
            selectedCustomer.creditLimit - selectedCustomer.outstandingCredit
          )}.`
        );
        return;
      }
    }

    if (paymentMode === 'UPI / Digital' && !digitalRef.trim()) {
      setErrorMsg('SOP-07 Rule: Enter UPI / bank transaction reference ID before completing digital billing.');
      return;
    }

    const items: SaleLineItem[] = cart.map((c) => ({
      productId: c.product.id,
      sku: c.product.sku,
      name: c.product.name,
      brand: c.product.brand,
      ownershipType: c.product.ownershipType,
      qty: c.qty,
      unitPrice: c.product.sellingPrice,
      landedCost: c.product.landedCost,
      discount: c.discount,
      lineTotal: Math.max(0, c.product.sellingPrice * c.qty - c.discount),
    }));

    const sale = recordSale({
      channel,
      customerId: selectedCustomer?.id || null,
      customerName: selectedCustomer?.name || 'Walk-in Customer',
      items,
      subtotal,
      discountTotal,
      grandTotal,
      cogsTotal,
      paymentMode,
      digitalRef: paymentMode === 'UPI / Digital' ? digitalRef.trim() : undefined,
      billerRole: activeRole,
    });

    setLastReceipt(sale);
    setCart([]);
    setDigitalRef('');
  };

  return (
    <div className="space-y-5">
      {/* Sub-navigation tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setTab('billing')}
            className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              tab === 'billing'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active Billing Counter (Zone F)
          </button>
          <button
            type="button"
            onClick={() => setTab('history')}
            className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              tab === 'history'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sales Register & Returns ({state.sales.length})
          </button>
        </div>

        <div className="text-xs text-slate-500">
          FEFO batch control active ·{' '}
          <span className="font-medium text-slate-700">
            {canModifyDiscount ? 'Discount authority enabled' : 'Standard counter pricing (no custom discount)'}
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-medium text-red-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
          <button type="button" onClick={() => setErrorMsg(null)} className="underline">
            Dismiss
          </button>
        </div>
      )}

      {tab === 'billing' ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          {/* Left Product Picker */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search SKU (GRM-...), product name, or brand..."
                    className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div className="flex flex-wrap gap-1">
                  {['All', 'GRAMOSFUEL', 'Made in Hadoti', 'Grocery', 'Household'].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setZoneFilter(f)}
                      className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                        zoneFilter === f
                          ? 'bg-teal-700 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cross-selling Quick Combos (Document 04 §10) */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="text-slate-500 font-medium">Quick Cross-Sell Bundles:</span>
                <button
                  type="button"
                  onClick={() => addBundle(['GRM-02-01-01-001', 'GRM-02-02-01-002'])}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-medium text-slate-700 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-900 transition-colors"
                >
                  + Sattu & Roasted Chana
                </button>
                <button
                  type="button"
                  onClick={() => addBundle(['GRM-01-08-01-009', 'GRM-06-01-01-005'])}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-medium text-slate-700 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-900 transition-colors"
                >
                  + Hadoti Mustard Oil & Pickle
                </button>
              </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((p) => {
                const expDays = daysUntil(p.expiryDate);
                const isNearExpiry = expDays !== null && expDays <= 35 && expDays >= 0;
                const isExpired = expDays !== null && expDays < 0;

                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={p.stockQty <= 0 || isExpired}
                    onClick={() => addToCart(p)}
                    className={`flex flex-col justify-between rounded-xl border bg-white p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-teal-600 ${
                      p.stockQty <= 0 || isExpired
                        ? 'border-slate-200 opacity-55 cursor-not-allowed'
                        : 'border-slate-200 hover:border-teal-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 font-mono">
                        <span className="truncate">{p.sku}</span>
                        <span className="shrink-0">{p.zone}</span>
                      </div>
                      <h4 className="mt-1.5 text-sm font-semibold text-slate-900 line-clamp-2">
                        {p.name}
                      </h4>
                      <div className="mt-1 text-xs text-slate-500">
                        {p.brand} · {p.unitSize} · {p.ownershipType}
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div>
                        <span className="font-mono text-base font-semibold tabular-nums text-slate-900">
                          {formatINR(p.sellingPrice)}
                        </span>
                        <span className="ml-1.5 font-mono text-[11px] line-through text-slate-400 tabular-nums">
                          {formatINR(p.mrp)}
                        </span>
                      </div>
                      <div className="text-right">
                        <div
                          className={`font-mono text-xs font-medium tabular-nums ${
                            p.stockQty <= p.reorderLevel ? 'text-amber-700' : 'text-slate-600'
                          }`}
                        >
                          {p.stockQty} left
                        </div>
                        {isNearExpiry && (
                          <div className="text-[10px] font-semibold text-amber-700">
                            FEFO · {expDays}d left
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Billing Terminal */}
          <div className="lg:col-span-5 xl:col-span-4 rounded-xl border border-slate-200 bg-white p-5 space-y-4 lg:sticky lg:top-20">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-teal-700" />
                <h3 className="font-display text-base font-semibold text-slate-900">
                  Current Bill
                </h3>
              </div>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCart([])}
                  className="text-xs text-slate-500 hover:text-red-600"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <label className="block text-xs">
                <span className="font-medium text-slate-700">Sales Channel</span>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as SalesChannel)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-teal-600 focus:outline-none"
                >
                  {CHANNELS.map((ch) => (
                    <option key={ch} value={ch}>
                      {ch}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs">
                <span className="font-medium text-slate-700">Customer (Optional for Walk-in)</span>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-teal-600 focus:outline-none"
                >
                  <option value="">Walk-in Customer (Unregistered)</option>
                  {state.customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {c.type} ({c.customerCode})
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Cart Items */}
            {cart.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 py-8 px-4 text-center text-xs text-slate-500">
                Select products from the catalogue to start billing.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[280px] overflow-y-auto pr-1">
                {cart.map((c) => (
                  <div key={c.product.id} className="py-2.5 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-900 truncate">
                          {c.product.name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                          {formatINR(c.product.sellingPrice)} × {c.qty} · {c.product.ownershipType}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateCartQty(c.product.id, -c.qty)}
                        aria-label="Remove item"
                        className="text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="inline-flex items-center rounded-md border border-slate-200">
                        <button
                          type="button"
                          onClick={() => updateCartQty(c.product.id, -1)}
                          className="px-2 py-1 text-slate-600 hover:bg-slate-100"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-2.5 font-mono text-xs tabular-nums font-medium">
                          {c.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQty(c.product.id, 1)}
                          className="px-2 py-1 text-slate-600 hover:bg-slate-100"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {canModifyDiscount && (
                          <input
                            type="number"
                            min={0}
                            value={c.discount}
                            onChange={(e) =>
                              updateCartDiscount(c.product.id, Number(e.target.value) || 0)
                            }
                            aria-label="Line discount in rupees"
                            placeholder="Disc ₹"
                            className="w-16 rounded border border-slate-200 px-1.5 py-0.5 text-right font-mono text-xs tabular-nums"
                          />
                        )}
                        <span className="font-mono text-xs font-semibold tabular-nums text-slate-900">
                          {formatINR(Math.max(0, c.product.sellingPrice * c.qty - c.discount))}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Payment Mode & Totals */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="grid grid-cols-3 gap-1.5">
                {PAYMENT_MODES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMode(m)}
                    className={`rounded-lg border px-2 py-2 text-[11px] font-medium transition-colors whitespace-nowrap ${
                      paymentMode === m
                        ? 'border-teal-700 bg-teal-50 text-teal-900 font-semibold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {paymentMode === 'UPI / Digital' && (
                <input
                  type="text"
                  value={digitalRef}
                  onChange={(e) => setDigitalRef(e.target.value)}
                  placeholder="Enter verified UPI / NEFT transaction ID"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs text-slate-900 focus:border-teal-600 focus:outline-none"
                />
              )}

              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-mono tabular-nums">{formatINR(subtotal)}</span>
                </div>
                {discountTotal > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Authorised Discount</span>
                    <span className="font-mono tabular-nums">-{formatINR(discountTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-slate-900 pt-1">
                  <span>Net Payable</span>
                  <span className="font-mono tabular-nums">{formatINR(grandTotal)}</span>
                </div>
              </div>

              <button
                type="button"
                disabled={cart.length === 0}
                onClick={handleCheckout}
                className="w-full rounded-lg bg-teal-700 py-2.5 px-4 text-sm font-semibold text-white hover:bg-teal-800 disabled:bg-slate-200 disabled:text-slate-400 transition-colors"
              >
                Issue Bill & Record Transaction
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Sales Register & Returns */
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                  <th className="py-3 px-4">Bill No</th>
                  <th className="py-3 px-4">Date & Channel</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.sales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-900">
                      {s.billNo}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      <div>{formatDateShort(s.timestamp)}</div>
                      <div className="text-slate-400">{s.channel}</div>
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-slate-800">
                      {s.customerName}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      {s.items.map((i) => `${i.name} (×${i.qty})`).join(', ')}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      <div>{s.paymentMode}</div>
                      {s.digitalRef && (
                        <div className="font-mono text-[11px] text-slate-400">{s.digitalRef}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs font-semibold tabular-nums text-slate-900">
                      {s.isReturned ? (
                        <span className="text-red-600 line-through">{formatINR(s.grandTotal)}</span>
                      ) : (
                        formatINR(s.grandTotal)
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setLastReceipt(s)}
                          className="text-xs font-medium text-teal-700 hover:underline"
                        >
                          Receipt
                        </button>
                        {!s.isReturned && (
                          <button
                            type="button"
                            onClick={() => processReturn(s.id)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-red-600"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Return
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Printable Bill Receipt Modal */}
      {lastReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-700 no-print">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Bill Recorded</span>
                </div>
                <h3 className="font-display text-lg font-bold text-slate-900 mt-1">
                  GRAMOS MART — APNA BAZAR
                </h3>
                <p className="text-xs text-slate-500">
                  Nav Durga Mandir, Opp. Kotri Steel Bridge, Kota
                </p>
              </div>
              <div className="text-right font-mono text-xs text-slate-600">
                <div className="font-semibold text-slate-900">{lastReceipt.billNo}</div>
                <div>{formatDateShort(lastReceipt.timestamp)}</div>
              </div>
            </div>

            <div className="text-xs text-slate-600 flex justify-between">
              <span>Customer: {lastReceipt.customerName}</span>
              <span>Channel: {lastReceipt.channel}</span>
            </div>

            <div className="border-y border-slate-200 py-2.5 divide-y divide-slate-100 text-xs">
              {lastReceipt.items.map((item) => (
                <div key={item.sku} className="py-1.5 flex justify-between gap-2">
                  <div>
                    <div className="font-medium text-slate-900">{item.name}</div>
                    <div className="font-mono text-[11px] text-slate-500">
                      {item.qty} × {formatINR(item.unitPrice)}
                    </div>
                  </div>
                  <div className="font-mono font-semibold tabular-nums text-slate-900">
                    {formatINR(item.lineTotal)}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between font-bold text-sm text-slate-900">
                <span>Total Paid ({lastReceipt.paymentMode})</span>
                <span className="font-mono tabular-nums">{formatINR(lastReceipt.grandTotal)}</span>
              </div>
              {lastReceipt.digitalRef && (
                <div className="font-mono text-[11px] text-slate-500">
                  Ref: {lastReceipt.digitalRef}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 no-print">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <Printer className="h-3.5 w-3.5" />
                Print Bill
              </button>
              <button
                type="button"
                onClick={() => setLastReceipt(null)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
