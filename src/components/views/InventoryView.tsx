import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownToLine,
  PackagePlus,
  Search,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';
import { useGramosStore } from '../../context/StoreContext';
import { MASTER_INDUSTRIES } from '../../data/seedData';
import {
  MovementVelocity,
  OwnershipType,
  Product,
  ProductReviewAction,
  SourceType,
} from '../../types/gramos';
import { daysUntil, formatDateShort, formatINR } from '../../utils/formatters';

export const InventoryView: React.FC = () => {
  const {
    state,
    activeRole,
    addProduct,
    receiveStock,
    quarantineStock,
    adjustStock,
  } = useGramosStore();

  const [subTab, setSubTab] = useState<'catalogue' | 'movements' | 'quarantine'>('catalogue');
  const [ownershipFilter, setOwnershipFilter] = useState<'All' | OwnershipType>('All');
  const [industryFilter, setIndustryFilter] = useState<string>('All');
  const [search, setSearch] = useState('');

  // Modals
  const [showAddSku, setShowAddSku] = useState(false);
  const [receivingProduct, setReceivingProduct] = useState<Product | null>(null);
  const [quarantineTarget, setQuarantineTarget] = useState<Product | null>(null);
  const [adjustTarget, setAdjustTarget] = useState<Product | null>(null);

  // Add SKU form state
  const [skuForm, setSkuForm] = useState({
    name: '',
    brand: 'GRAMOSFUEL',
    industry: MASTER_INDUSTRIES[1] as string,
    category: 'Sattu Products',
    subcategory: 'Packaged Nutrition',
    unitSize: '500 g',
    ownershipType: 'Self-Funded' as OwnershipType,
    sourceType: 'Third-Party Manufacturing' as SourceType,
    supplierId: state.suppliers[0]?.id || '',
    batchNumber: 'GF-2611-01',
    expiryDate: '2027-05-15',
    purchaseCost: 60,
    freightAndHandling: 4,
    packagingAndTax: 6,
    mrp: 120,
    sellingPrice: 105,
    stockQty: 25,
    reorderLevel: 10,
    velocity: 'Fast' as MovementVelocity,
    zone: 'Zone C' as Product['zone'],
    consignmentCommissionPct: 20,
    creditTermDays: 15,
  });

  // Receive Stock form
  const [recQty, setRecQty] = useState(20);
  const [recBatch, setRecBatch] = useState('');
  const [recExpiry, setRecExpiry] = useState('');
  const [recInvoice, setRecInvoice] = useState('');

  // Quarantine / Adjust form
  const [actionQty, setActionQty] = useState(1);
  const [actionType, setActionType] = useState<'Damage Quarantine' | 'Expiry Quarantine'>('Damage Quarantine');
  const [actionReason, setActionReason] = useState('');

  const canManageCatalogue =
    activeRole === 'Founder / Operator' || activeRole === 'Store Manager';

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.products.filter((p) => {
      if (ownershipFilter !== 'All' && p.ownershipType !== ownershipFilter) return false;
      if (industryFilter !== 'All' && p.industry !== industryFilter) return false;
      if (!q) return true;
      return (
        p.sku.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.batchNumber.toLowerCase().includes(q)
      );
    });
  }, [state.products, ownershipFilter, industryFilter, search]);

  const industryNames = useMemo(
    () =>
      state.dakshMarket?.industries?.filter((i) => i.active).map((i) => i.name) ||
      [...MASTER_INDUSTRIES],
    [state.dakshMarket?.industries]
  );

  const handleCreateSku = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skuForm.name.trim()) return;
    const indIdx = String(
      Math.max(1, industryNames.indexOf(skuForm.industry) + 1)
    ).padStart(2, '0');
    const seq = String(state.products.length + 1).padStart(3, '0');
    const landedCost =
      skuForm.purchaseCost + skuForm.freightAndHandling + skuForm.packagingAndTax;

    addProduct({
      sku: `GRM-${indIdx}-01-01-${seq}`,
      name: skuForm.name.trim(),
      brand: skuForm.brand,
      industry: skuForm.industry,
      category: skuForm.category,
      subcategory: skuForm.subcategory,
      unitSize: skuForm.unitSize,
      ownershipType: skuForm.ownershipType,
      sourceType: skuForm.sourceType,
      supplierId: skuForm.supplierId,
      batchNumber: skuForm.batchNumber,
      mfgDate: new Date().toISOString().slice(0, 10),
      expiryDate: skuForm.expiryDate || null,
      purchaseCost: skuForm.purchaseCost,
      freightAndHandling: skuForm.freightAndHandling,
      packagingAndTax: skuForm.packagingAndTax,
      landedCost,
      mrp: skuForm.mrp,
      sellingPrice: skuForm.sellingPrice,
      gstPercent: 5,
      stockQty: skuForm.stockQty,
      quarantinedQty: 0,
      reorderLevel: skuForm.reorderLevel,
      velocity: skuForm.velocity,
      reviewAction: 'Maintain' as ProductReviewAction,
      zone: skuForm.zone,
      consignmentCommissionPct:
        skuForm.ownershipType === 'Consignment'
          ? skuForm.consignmentCommissionPct
          : undefined,
      creditTermDays:
        skuForm.ownershipType === 'Supplier-Credit'
          ? skuForm.creditTermDays
          : undefined,
      active: true,
    });
    setShowAddSku(false);
    setSkuForm((prev) => ({ ...prev, name: '' }));
  };

  const calculatedLanded =
    skuForm.purchaseCost + skuForm.freightAndHandling + skuForm.packagingAndTax;
  const calculatedMarginPct =
    skuForm.sellingPrice > 0
      ? (((skuForm.sellingPrice - calculatedLanded) / skuForm.sellingPrice) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="space-y-5">
      {/* Top Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setSubTab('catalogue')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              subTab === 'catalogue'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Master Catalogue ({state.products.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('movements')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              subTab === 'movements'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Stock Movement Ledger ({state.movements.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('quarantine')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              subTab === 'quarantine'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Zone I Quarantine
          </button>
        </div>

        {canManageCatalogue && (
          <button
            type="button"
            onClick={() => setShowAddSku(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-800 transition-colors self-start sm:self-auto"
          >
            <PackagePlus className="h-4 w-4" />
            <span>Register New SKU</span>
          </button>
        )}
      </div>

      {subTab === 'catalogue' && (
        <>
          {/* Filter Controls */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by SKU, product name, batch, or brand..."
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                {(['All', 'Self-Funded', 'Supplier-Credit', 'Consignment'] as const).map(
                  (own) => (
                    <button
                      key={own}
                      type="button"
                      onClick={() => setOwnershipFilter(own)}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                        ownershipFilter === own
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {own}
                    </button>
                  )
                )}
              </div>

              <select
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
                aria-label="Filter by industry"
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-teal-600 focus:outline-none"
              >
                <option value="All">All {industryNames.length} Industries</option>
                {industryNames.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Inventory Data Grid */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                    <th className="py-3 px-4">SKU & Product</th>
                    <th className="py-3 px-3">Ownership · Source</th>
                    <th className="py-3 px-3 text-right">Landed Cost</th>
                    <th className="py-3 px-3 text-right">Selling · Margin</th>
                    <th className="py-3 px-3 text-right">Saleable Stock</th>
                    <th className="py-3 px-3">Batch · FEFO Expiry</th>
                    <th className="py-3 px-4 text-right">SOP Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((p) => {
                    const marginPct =
                      p.sellingPrice > 0
                        ? (((p.sellingPrice - p.landedCost) / p.sellingPrice) * 100).toFixed(1)
                        : '0.0';
                    const expDays = daysUntil(p.expiryDate);
                    const isNearExpiry = expDays !== null && expDays <= 35;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4">
                          <div className="font-mono text-[11px] text-slate-500">
                            {p.sku} · {p.zone}
                          </div>
                          <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                            {p.name}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {p.brand} · {p.category} · {p.unitSize}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-xs">
                          <div
                            className={`font-semibold ${
                              p.ownershipType === 'Self-Funded'
                                ? 'text-emerald-700'
                                : p.ownershipType === 'Supplier-Credit'
                                ? 'text-amber-700'
                                : 'text-teal-800'
                            }`}
                          >
                            {p.ownershipType}
                          </div>
                          <div className="text-[11px] text-slate-500">{p.sourceType}</div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-xs tabular-nums text-slate-700">
                          {formatINR(p.landedCost)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="font-mono text-xs font-semibold tabular-nums text-slate-900">
                            {formatINR(p.sellingPrice)}
                          </div>
                          <div className="font-mono text-[11px] tabular-nums text-teal-700">
                            {marginPct}% ({p.reviewAction})
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div
                            className={`font-mono text-xs font-semibold tabular-nums ${
                              p.stockQty <= p.reorderLevel ? 'text-amber-700' : 'text-slate-900'
                            }`}
                          >
                            {p.stockQty} units
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {p.velocity} · Min {p.reorderLevel}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-xs">
                          <div className="font-mono text-slate-700">{p.batchNumber}</div>
                          <div
                            className={`text-[11px] ${
                              isNearExpiry ? 'font-semibold text-amber-700' : 'text-slate-500'
                            }`}
                          >
                            {p.expiryDate
                              ? `${formatDateShort(p.expiryDate)} (${expDays}d)`
                              : 'Non-perishable'}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setReceivingProduct(p);
                                setRecQty(20);
                                setRecBatch(p.batchNumber);
                                setRecExpiry(p.expiryDate || '');
                                setRecInvoice('');
                              }}
                              title="Zone G Stock Receipt"
                              className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                            >
                              <ArrowDownToLine className="h-3 w-3" />
                              Receive
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setQuarantineTarget(p);
                                setActionQty(1);
                                setActionReason('');
                              }}
                              title="Move to Zone I Quarantine"
                              className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-medium text-amber-800 hover:bg-amber-50"
                            >
                              <ShieldAlert className="h-3 w-3" />
                              Zone I
                            </button>
                            {canManageCatalogue && (
                              <button
                                type="button"
                                onClick={() => {
                                  setAdjustTarget(p);
                                  setActionQty(0);
                                  setActionReason('');
                                }}
                                title="Physical Stock Adjustment"
                                className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100"
                              >
                                <SlidersHorizontal className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {subTab === 'movements' && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">SKU & Product</th>
                  <th className="py-3 px-3">Ownership</th>
                  <th className="py-3 px-3">Movement Type</th>
                  <th className="py-3 px-3 text-right">Qty Delta</th>
                  <th className="py-3 px-4">Verified Reason & Actor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.movements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 font-mono text-xs text-slate-600">
                      {formatDateShort(m.date)}
                    </td>
                    <td className="py-2.5 px-4 text-xs">
                      <div className="font-semibold text-slate-900">{m.productName}</div>
                      <div className="font-mono text-[11px] text-slate-400">{m.sku}</div>
                    </td>
                    <td className="py-2.5 px-3 text-xs text-slate-700">{m.ownershipType}</td>
                    <td className="py-2.5 px-3 text-xs font-medium text-slate-800">
                      {m.movementType}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-mono text-xs font-semibold tabular-nums ${
                        m.qtyDelta >= 0 ? 'text-emerald-700' : 'text-slate-900'
                      }`}
                    >
                      {m.qtyDelta >= 0 ? `+${m.qtyDelta}` : m.qtyDelta}
                    </td>
                    <td className="py-2.5 px-4 text-xs text-slate-600">
                      <div>{m.reason}</div>
                      <div className="text-[11px] text-slate-400">Logged by {m.actor}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === 'quarantine' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex items-start gap-3 border-b border-slate-100 pb-4">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900">
                Zone I — Damaged, Expired & Returned Stock Quarantine
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                SOP Rule: Quarantined units are physically isolated from shelves and blocked from POS billing until supplier return, replacement, or documented disposal.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-medium text-slate-500">
                  <th className="py-2.5 pr-4">SKU & Product</th>
                  <th className="py-2.5 px-3">Ownership</th>
                  <th className="py-2.5 px-3">Batch · Expiry</th>
                  <th className="py-2.5 pl-3 text-right">Quarantined Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.products
                  .filter((p) => p.quarantinedQty > 0)
                  .map((p) => (
                    <tr key={p.id}>
                      <td className="py-3 pr-4">
                        <div className="text-sm font-semibold text-slate-900">{p.name}</div>
                        <div className="font-mono text-xs text-slate-500">{p.sku}</div>
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-700">{p.ownershipType}</td>
                      <td className="py-3 px-3 text-xs text-slate-600 font-mono">
                        {p.batchNumber} · {p.expiryDate ? formatDateShort(p.expiryDate) : 'N/A'}
                      </td>
                      <td className="py-3 pl-3 text-right font-mono text-sm font-semibold text-red-600 tabular-nums">
                        {p.quarantinedQty} units
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add SKU Modal */}
      {showAddSku && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <form
            onSubmit={handleCreateSku}
            className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-display text-lg font-semibold text-slate-900">
                Register Product SKU & Landed Cost Calculation
              </h3>
              <button
                type="button"
                onClick={() => setShowAddSku(false)}
                className="text-xs text-slate-500 hover:text-slate-900"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block text-xs sm:col-span-2">
                <span className="font-medium text-slate-700">Product Name</span>
                <input
                  required
                  type="text"
                  value={skuForm.name}
                  onChange={(e) => setSkuForm({ ...skuForm, name: e.target.value })}
                  placeholder="e.g., GRAMOSFUEL Unsweetened Sattu 1kg"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                />
              </label>

              <label className="block text-xs">
                <span className="font-medium text-slate-700">Level 1 — Master Industry</span>
                <select
                  value={skuForm.industry}
                  onChange={(e) => setSkuForm({ ...skuForm, industry: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
                >
                  {industryNames.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs">
                <span className="font-medium text-slate-700">Brand Identity</span>
                <input
                  type="text"
                  value={skuForm.brand}
                  onChange={(e) => setSkuForm({ ...skuForm, brand: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
                />
              </label>

              <label className="block text-xs">
                <span className="font-medium text-slate-700">Inventory Ownership Classification</span>
                <select
                  value={skuForm.ownershipType}
                  onChange={(e) =>
                    setSkuForm({ ...skuForm, ownershipType: e.target.value as OwnershipType })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
                >
                  <option value="Self-Funded">Type 1 — Self-Funded Owned</option>
                  <option value="Supplier-Credit">Type 2 — Supplier-Credit</option>
                  <option value="Consignment">Type 3 — Consignment (Supplier Owned)</option>
                </select>
              </label>

              <label className="block text-xs">
                <span className="font-medium text-slate-700">Approved Supplier</span>
                <select
                  value={skuForm.supplierId}
                  onChange={(e) => setSkuForm({ ...skuForm, supplierId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
                >
                  {state.suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs">
                <span className="font-medium text-slate-700">Purchase Cost (₹)</span>
                <input
                  type="number"
                  min={1}
                  value={skuForm.purchaseCost}
                  onChange={(e) =>
                    setSkuForm({ ...skuForm, purchaseCost: Number(e.target.value) || 0 })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:border-teal-600 focus:outline-none"
                />
              </label>

              <label className="block text-xs">
                <span className="font-medium text-slate-700">Freight + Packaging/Tax (₹)</span>
                <input
                  type="number"
                  min={0}
                  value={skuForm.freightAndHandling + skuForm.packagingAndTax}
                  onChange={(e) =>
                    setSkuForm({
                      ...skuForm,
                      freightAndHandling: Number(e.target.value) || 0,
                      packagingAndTax: 0,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:border-teal-600 focus:outline-none"
                />
              </label>

              <label className="block text-xs">
                <span className="font-medium text-slate-700">Selling Price (₹)</span>
                <input
                  type="number"
                  min={1}
                  value={skuForm.sellingPrice}
                  onChange={(e) =>
                    setSkuForm({ ...skuForm, sellingPrice: Number(e.target.value) || 0 })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:border-teal-600 focus:outline-none"
                />
              </label>

              <label className="block text-xs">
                <span className="font-medium text-slate-700">Opening Stock Qty</span>
                <input
                  type="number"
                  min={0}
                  value={skuForm.stockQty}
                  onChange={(e) =>
                    setSkuForm({ ...skuForm, stockQty: Number(e.target.value) || 0 })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:border-teal-600 focus:outline-none"
                />
              </label>

              <label className="block text-xs">
                <span className="font-medium text-slate-700">Expiry / Best-Before Date</span>
                <input
                  type="date"
                  value={skuForm.expiryDate}
                  onChange={(e) => setSkuForm({ ...skuForm, expiryDate: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:border-teal-600 focus:outline-none"
                />
              </label>

              <label className="block text-xs">
                <span className="font-medium text-slate-700">Store Display Zone</span>
                <select
                  value={skuForm.zone}
                  onChange={(e) =>
                    setSkuForm({ ...skuForm, zone: e.target.value as Product['zone'] })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
                >
                  <option value="Zone B">Zone B — Main Retail Display</option>
                  <option value="Zone C">Zone C — GRAMOSFUEL Section</option>
                  <option value="Zone D">Zone D — Made in Hadoti</option>
                  <option value="Zone E">Zone E — Household Essentials</option>
                </select>
              </label>
            </div>

            <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 flex items-center justify-between text-xs">
              <span>
                Calculated Landed Cost:{' '}
                <strong className="font-mono text-slate-900">{formatINR(calculatedLanded)}</strong>
              </span>
              <span>
                Gross Margin:{' '}
                <strong className="font-mono text-teal-700">{calculatedMarginPct}%</strong>
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddSku(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800"
              >
                Save SKU to Catalogue
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Zone G Stock Receipt Modal */}
      {receivingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
            <h3 className="font-display text-base font-semibold text-slate-900">
              Zone G Stock Verification & Receipt
            </h3>
            <div className="text-xs text-slate-600">
              <strong>{receivingProduct.name}</strong> · Ownership:{' '}
              <span className="font-semibold text-slate-900">
                {receivingProduct.ownershipType}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <label className="block">
                <span className="font-medium text-slate-700">Verified Quantity Received</span>
                <input
                  type="number"
                  min={1}
                  value={recQty}
                  onChange={(e) => setRecQty(Number(e.target.value) || 0)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                />
              </label>
              <label className="block">
                <span className="font-medium text-slate-700">Batch Number</span>
                <input
                  type="text"
                  value={recBatch}
                  onChange={(e) => setRecBatch(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                />
              </label>
              <label className="block">
                <span className="font-medium text-slate-700">Invoice / Challan Ref</span>
                <input
                  type="text"
                  value={recInvoice}
                  onChange={(e) => setRecInvoice(e.target.value)}
                  placeholder="e.g., INV-2611-09"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                />
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReceivingProduct(null)}
                className="rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  receiveStock({
                    productId: receivingProduct.id,
                    qty: recQty,
                    batchNumber: recBatch,
                    expiryDate: recExpiry || null,
                    invoiceRef: recInvoice,
                    isCreditPurchase: receivingProduct.ownershipType === 'Supplier-Credit',
                    creditDays: receivingProduct.creditTermDays,
                  });
                  setReceivingProduct(null);
                }}
                className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800"
              >
                Verify & Enter Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Zone I Quarantine Modal */}
      {quarantineTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
            <h3 className="font-display text-base font-semibold text-slate-900">
              Move Stock to Zone I Quarantine
            </h3>
            <p className="text-xs text-slate-500">
              {quarantineTarget.name} (Available: {quarantineTarget.stockQty})
            </p>
            <div className="space-y-3 text-xs">
              <label className="block">
                <span className="font-medium text-slate-700">Quarantine Type</span>
                <select
                  value={actionType}
                  onChange={(e) =>
                    setActionType(e.target.value as 'Damage Quarantine' | 'Expiry Quarantine')
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  <option value="Damage Quarantine">Damaged Packaging / Spoilage</option>
                  <option value="Expiry Quarantine">Expired / Near-Expiry Pull</option>
                </select>
              </label>
              <label className="block">
                <span className="font-medium text-slate-700">Quantity</span>
                <input
                  type="number"
                  min={1}
                  max={quarantineTarget.stockQty}
                  value={actionQty}
                  onChange={(e) => setActionQty(Number(e.target.value) || 1)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                />
              </label>
              <label className="block">
                <span className="font-medium text-slate-700">Mandatory Reason</span>
                <input
                  type="text"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Describe defect or expiry batch..."
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setQuarantineTarget(null)}
                className="rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!actionReason.trim()}
                onClick={() => {
                  quarantineStock(quarantineTarget.id, actionQty, actionType, actionReason);
                  setQuarantineTarget(null);
                }}
                className="rounded-lg bg-amber-700 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-800 disabled:opacity-50"
              >
                Quarantine Units
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Physical Stock Adjustment Modal */}
      {adjustTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
            <h3 className="font-display text-base font-semibold text-slate-900">
              Physical Stock Count Adjustment
            </h3>
            <p className="text-xs text-slate-500">
              SOP Rule 6: No stock adjustment without a documented audit reason.
            </p>
            <div className="space-y-3 text-xs">
              <label className="block">
                <span className="font-medium text-slate-700">Quantity Delta (+ / -)</span>
                <input
                  type="number"
                  value={actionQty}
                  onChange={(e) => setActionQty(Number(e.target.value) || 0)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                />
              </label>
              <label className="block">
                <span className="font-medium text-slate-700">Audit Explanation</span>
                <input
                  type="text"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="e.g., Weekly physical shelf verification discrepancy"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAdjustTarget(null)}
                className="rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!actionReason.trim() || actionQty === 0}
                onClick={() => {
                  adjustStock(adjustTarget.id, actionQty, actionReason);
                  setAdjustTarget(null);
                }}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                Record Adjustment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
