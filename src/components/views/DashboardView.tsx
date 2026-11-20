import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  IndianRupee,
  Lock,
  TrendingUp,
} from 'lucide-react';
import { useGramosStore } from '../../context/StoreContext';
import { daysUntil, formatINR } from '../../utils/formatters';

export const DashboardView: React.FC = () => {
  const {
    state,
    metrics,
    setActiveNav,
    setDakshTab,
    setGramosfuelTab,
    updateOutletConfig,
    togglePilotMilestone,
  } = useGramosStore();

  const [simFixedCosts, setSimFixedCosts] = useState<number>(30000);
  const [simMarginPct, setSimMarginPct] = useState<number>(
    Math.round(metrics.grossMarginPct) || 22
  );

  const breakEvenSales =
    simMarginPct > 0 ? Math.round(simFixedCosts / (simMarginPct / 100)) : 0;

  const lowStockProducts = state.products.filter(
    (p) => p.stockQty <= p.reorderLevel
  );
  const nearExpiryProducts = state.products.filter((p) => {
    const d = daysUntil(p.expiryDate);
    return d !== null && d <= 35;
  });

  const completedMilestones = state.pilotMilestones.filter((m) => m.completed).length;

  return (
    <div className="space-y-6">
      {/* Executive Header Context */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">
            Project DKS-P05-GRAMOS · {state.outletConfig.location}
          </p>
          <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-0.5">
            {state.outletConfig.outletName}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
            {(['One-Shop Pilot', 'Two-Shop Integrated'] as const).map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => updateOutletConfig({ format: fmt })}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  state.outletConfig.format === fmt
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4-Column Financial & Inventory KPI Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">
            Net Sales · Gross Margin
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="font-mono text-2xl font-semibold tabular-nums text-slate-900">
              {formatINR(metrics.netSales)}
            </span>
            <span className="font-mono text-xs font-medium tabular-nums text-teal-700">
              {metrics.grossMarginPct.toFixed(1)}% margin
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 font-mono tabular-nums">
            Gross Profit {formatINR(metrics.grossProfit)} · COGS {formatINR(metrics.cogsTotal)}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">
            Cash & Bank · Working Capital
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="font-mono text-2xl font-semibold tabular-nums text-slate-900">
              {formatINR(metrics.availableCash + metrics.bankBalance)}
            </span>
            <span className="font-mono text-xs font-medium tabular-nums text-slate-600">
              WC {formatINR(metrics.workingCapital)}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 font-mono tabular-nums">
            Drawer {formatINR(metrics.availableCash)} · Bank {formatINR(metrics.bankBalance)}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">
            Business Inventory Valuation
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="font-mono text-2xl font-semibold tabular-nums text-slate-900">
              {formatINR(metrics.ownedAndCreditInventoryValue)}
            </span>
            <span className="text-xs font-medium text-slate-500">
              Cost basis
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 font-mono tabular-nums">
            Owned {formatINR(metrics.selfFundedInventoryValue)} · Credit{' '}
            {formatINR(metrics.supplierCreditInventoryValue)}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">
            Supplier & Consignment Dues
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="font-mono text-2xl font-semibold tabular-nums text-slate-900">
              {formatINR(metrics.supplierCreditOutstanding + metrics.consignmentPayable)}
            </span>
            {metrics.overdueCreditCount > 0 ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600">
                <AlertTriangle className="h-3.5 w-3.5" />
                {metrics.overdueCreditCount} overdue
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Current
              </span>
            )}
          </div>
          <div className="mt-2 text-xs text-slate-500 font-mono tabular-nums">
            Credit {formatINR(metrics.supplierCreditOutstanding)} · Consignment{' '}
            {formatINR(metrics.consignmentPayable)}
          </div>
        </div>
      </div>

      {/* 5 Revenue Engines + 3-Tier Inventory Ownership Split */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900">
                Five Revenue Engines Performance
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Channel-wise net sales and gross profit contribution (GRM-MOD-001)
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveNav('pos')}
              className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-900 whitespace-nowrap"
            >
              <span>New Sale</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-medium text-slate-500">
                  <th className="py-2.5 pr-4">Sales Channel</th>
                  <th className="py-2.5 px-3 text-right">Net Revenue</th>
                  <th className="py-2.5 px-3 text-right">Gross Profit</th>
                  <th className="py-2.5 pl-3 text-right">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(metrics.salesByChannel).map(([channel, rev]) => {
                  const gp = metrics.channelGrossProfit[channel] || 0;
                  const sharePct =
                    metrics.netSales > 0 ? ((rev / metrics.netSales) * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={channel} className="hover:bg-slate-50/80">
                      <td className="py-2.5 pr-4 font-medium text-slate-800">{channel}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-900">
                        {formatINR(rev)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-teal-700">
                        {formatINR(gp)}
                      </td>
                      <td className="py-2.5 pl-3 text-right font-mono tabular-nums text-slate-500">
                        {sharePct}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Three-Tier Inventory Ownership Governance */}
        <section className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-display text-base font-semibold text-slate-900">
                  Inventory Ownership Separation
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Strict accounting firewall (GRM-INV-001)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveNav('inventory')}
                className="text-xs font-medium text-teal-700 hover:text-teal-900 whitespace-nowrap"
              >
                Manage Stock
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    1. Self-Funded Owned Stock
                  </div>
                  <div className="text-xs text-slate-500">
                    Purchased with founder capital · Asset owned by GRAMOS Mart
                  </div>
                </div>
                <div className="font-mono text-sm font-semibold tabular-nums text-slate-900">
                  {formatINR(metrics.selfFundedInventoryValue)}
                </div>
              </div>

              <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    2. Supplier-Credit Stock
                  </div>
                  <div className="text-xs text-slate-500">
                    7 / 15 / 30-day deferred terms · Tracked against payable liability
                  </div>
                </div>
                <div className="font-mono text-sm font-semibold tabular-nums text-amber-700">
                  {formatINR(metrics.supplierCreditInventoryValue)}
                </div>
              </div>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    3. Consignment Stock (Off-Balance)
                  </div>
                  <div className="text-xs text-slate-500">
                    Supplier retains ownership until sale · Hadoti SHGs & Guilds
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm font-semibold tabular-nums text-slate-900">
                    {formatINR(metrics.consignmentStockRetailValue)}
                  </div>
                  <div className="text-[11px] text-slate-500">Retail value</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs text-slate-600">
            Rule: Buying inventory does not count as monthly expense. Cost is recognized strictly as COGS when sold.
          </div>
        </section>
      </div>

      {/* Property Owner Profit Participation & Break-Even Simulator */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900">
                Property Owner Profit Participation (GRM-FIN-001)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Applied strictly to Distributable Profit, never gross sales
              </p>
            </div>
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
              {(
                ['Profit Participation (15–20%)', 'Fixed Rent Quote (₹35,000)'] as const
              ).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => updateOutletConfig({ propertyArrangement: mode })}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                    state.outletConfig.propertyArrangement === mode
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {mode === 'Profit Participation (15–20%)' ? '15–20% Profit Share' : '₹35k Fixed Rent'}
                </button>
              ))}
            </div>
          </div>

          {state.outletConfig.propertyArrangement === 'Profit Participation (15–20%)' && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs text-slate-700">
                Negotiated Owner Participation:{' '}
                <span className="font-mono font-semibold text-slate-900">
                  {state.outletConfig.ownerSharePercent}%
                </span>{' '}
                · Founder Retained:{' '}
                <span className="font-mono font-semibold text-teal-700">
                  {100 - state.outletConfig.ownerSharePercent}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={15}
                  max={20}
                  step={1}
                  value={state.outletConfig.ownerSharePercent}
                  onChange={(e) =>
                    updateOutletConfig({ ownerSharePercent: Number(e.target.value) })
                  }
                  aria-label="Property owner profit share percentage"
                  className="w-28 accent-teal-700 cursor-pointer"
                />
                <span className="font-mono text-xs font-semibold tabular-nums text-slate-900 w-10 text-right">
                  {state.outletConfig.ownerSharePercent}%
                </span>
              </div>
            </div>
          )}

          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between py-1.5">
              <span className="text-slate-600">Net Sales Revenue</span>
              <span className="font-mono tabular-nums font-medium text-slate-900">
                {formatINR(metrics.netSales)}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-600">Less: Cost of Goods Sold (Sold Units)</span>
              <span className="font-mono tabular-nums text-slate-700">
                -{formatINR(metrics.cogsTotal)}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-t border-slate-100 font-medium">
              <span className="text-slate-800">Gross Profit</span>
              <span className="font-mono tabular-nums text-slate-900">
                {formatINR(metrics.grossProfit)}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-600">
                Less: Approved Operating Expenses{' '}
                {state.outletConfig.propertyArrangement === 'Fixed Rent Quote (₹35,000)'
                  ? '(incl. ₹35,000 rent)'
                  : ''}
              </span>
              <span className="font-mono tabular-nums text-slate-700">
                -{formatINR(metrics.operatingExpenses)}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-600">
                Less: Working Capital Reserve ({state.outletConfig.reserveRetentionPercent}%)
              </span>
              <span className="font-mono tabular-nums text-slate-700">
                -{formatINR(metrics.reserveAmount)}
              </span>
            </div>
            <div className="flex justify-between py-2 border-t border-slate-200 font-semibold">
              <span className="text-slate-900">Distributable Profit</span>
              <span className="font-mono tabular-nums text-slate-900">
                {formatINR(metrics.distributableProfit)}
              </span>
            </div>

            {state.outletConfig.propertyArrangement === 'Profit Participation (15–20%)' && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="text-xs text-slate-500">
                    Property Owner ({state.outletConfig.ownerSharePercent}%)
                  </div>
                  <div className="mt-1 font-mono text-lg font-semibold tabular-nums text-slate-900">
                    {formatINR(metrics.propertyOwnerShare)}
                  </div>
                </div>
                <div className="rounded-lg border border-teal-200 bg-teal-50/60 p-3">
                  <div className="text-xs text-teal-800">
                    Founder / Dakshakriti ({100 - state.outletConfig.ownerSharePercent}%)
                  </div>
                  <div className="mt-1 font-mono text-lg font-semibold tabular-nums text-teal-900">
                    {formatINR(metrics.founderRetainedShare)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {metrics.hasOverdueSupplierLiabilities && (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-800">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 shrink-0 text-red-600" />
                <span>
                  Governance Lock: Do not distribute profit while{' '}
                  {metrics.overdueCreditCount} supplier credit invoice(s) are overdue.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveNav('registers')}
                className="font-semibold underline whitespace-nowrap"
              >
                Settle Dues
              </button>
            </div>
          )}
        </section>

        {/* Break-Even Calculator & Operational Alerts */}
        <section className="lg:col-span-5 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <TrendingUp className="h-4 w-4 text-teal-700" />
              <h3 className="font-display text-base font-semibold text-slate-900">
                Break-Even Sales Calculator
              </h3>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Formula: Fixed Operating Costs ÷ Contribution Margin Ratio (GRM-BP-001)
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="block text-xs">
                <span className="font-medium text-slate-700">Monthly Fixed Costs (₹)</span>
                <input
                  type="number"
                  min={5000}
                  step={1000}
                  value={simFixedCosts}
                  onChange={(e) => setSimFixedCosts(Number(e.target.value) || 0)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm tabular-nums text-slate-900 focus:border-teal-600 focus:outline-none"
                />
              </label>

              <label className="block text-xs">
                <span className="font-medium text-slate-700">Contribution Margin (%)</span>
                <input
                  type="number"
                  min={5}
                  max={60}
                  step={1}
                  value={simMarginPct}
                  onChange={(e) => setSimMarginPct(Number(e.target.value) || 1)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm tabular-nums text-slate-900 focus:border-teal-600 focus:outline-none"
                />
              </label>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-900 px-4 py-3 text-white">
              <div>
                <div className="text-xs text-slate-300">Monthly Break-Even Target</div>
                <div className="text-[11px] text-slate-400">
                  Daily avg ~{formatINR(Math.round(breakEvenSales / 30))} / day
                </div>
              </div>
              <div className="font-mono text-xl font-semibold tabular-nums flex items-center">
                <IndianRupee className="h-4 w-4 mr-0.5 text-teal-400" />
                {breakEvenSales.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Actionable Alerts & 90-Day Pilot Progress */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-display text-base font-semibold text-slate-900">
                90-Day Pilot & Stock Alerts
              </h3>
              <span className="font-mono text-xs text-slate-500 tabular-nums">
                {completedMilestones}/{state.pilotMilestones.length} done
              </span>
            </div>

            <div className="mt-3 space-y-2">
              {nearExpiryProducts.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveNav('registers')}
                  className="flex w-full items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-left text-xs text-amber-900 hover:bg-amber-100/70 transition-colors"
                >
                  <span>
                    <strong>FEFO Alert:</strong> {nearExpiryProducts.length} batch(es) within 35 days of expiry
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                </button>
              )}

              {lowStockProducts.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveNav('inventory')}
                  className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs text-slate-800 hover:bg-slate-100 transition-colors"
                >
                  <span>
                    <strong>Replenishment Review:</strong> {lowStockProducts.length} SKU(s) at or below minimum
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                </button>
              )}

              <div className="pt-2 space-y-1.5">
                {state.pilotMilestones.slice(4, 8).map((m) => (
                  <label
                    key={m.id}
                    className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer py-1"
                  >
                    <input
                      type="checkbox"
                      checked={m.completed}
                      onChange={() => togglePilotMilestone(m.id)}
                      className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 accent-teal-700"
                    />
                    <span className={m.completed ? 'line-through text-slate-400' : ''}>
                      <span className="text-slate-400">{m.phase.split(':')[0]} · </span>
                      {m.task}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Synced DAKSH MARKET B2B & Procurement Network Summary */}
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100">
            <div>
              <div className="text-[11px] font-medium text-teal-700">
                Connected Universal Commerce Engine
              </div>
              <h3 className="font-display text-base font-semibold text-slate-900">
                DAKSH MARKET — B2B Procurement & Partner Network
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { id: 'buyer', label: 'Buyer OS' },
                  { id: 'vendor', label: 'Vendor OS' },
                  { id: 'seller', label: 'Seller OS' },
                  { id: 'projects', label: 'Project BOQ' },
                ] as const
              ).map((ws) => (
                <button
                  key={ws.id}
                  type="button"
                  onClick={() => {
                    setDakshTab(ws.id);
                    setActiveNav('daksh');
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <span>{ws.label}</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4 text-xs">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
              <div className="text-slate-500">Participants & Pending</div>
              <div className="mt-1 font-mono text-lg font-semibold tabular-nums text-slate-900">
                {state.dakshMarket.organizations.length} orgs
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {
                  state.dakshMarket.organizations.filter(
                    (o) => o.verificationStatus === 'Pending Verification'
                  ).length
                }{' '}
                pending verification
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
              <div className="text-slate-500">Published B2B SKUs</div>
              <div className="mt-1 font-mono text-lg font-semibold tabular-nums text-slate-900">
                {state.dakshMarket.listings.filter((l) => l.status === 'Published').length}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Across {state.dakshMarket.industries.filter((i) => i.active).length} active industries
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
              <div className="text-slate-500">Requirements & RFQs</div>
              <div className="mt-1 font-mono text-lg font-semibold tabular-nums text-slate-900">
                {state.dakshMarket.requirements.length} req · {state.dakshMarket.rfqs.length} RFQ
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {state.dakshMarket.quotations.length} quotation(s) submitted
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
              <div className="text-slate-500">Project BOQs & Orders</div>
              <div className="mt-1 font-mono text-lg font-semibold tabular-nums text-slate-900">
                {state.dakshMarket.projects.length} project · {state.dakshMarket.orders.length} PO
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {state.dakshMarket.commissions.length} commission ledger entries
              </div>
            </div>
          </div>
        </section>

        {/* Synced GRAMOSFUEL Brand & Product Sourcing OS (DKS-P04-GF) */}
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100">
            <div>
              <div className="text-[11px] font-medium text-teal-700">
                Upstream Brand &amp; Sourcing Blueprint · DKS-P04-GF
              </div>
              <h3 className="font-display text-base font-semibold text-slate-900">
                GRAMOSFUEL — 9-Stage Product Sourcing &amp; Launch OS
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { id: 'pipeline', label: '9-Stage Pipeline' },
                  { id: 'samples', label: 'Sample Eval' },
                  { id: 'economics', label: 'Unit Economics' },
                  { id: 'quality', label: 'Quality & FSSAI' },
                ] as const
              ).map((gfTab) => (
                <button
                  key={gfTab.id}
                  type="button"
                  onClick={() => {
                    setGramosfuelTab(gfTab.id);
                    setActiveNav('gramosfuel');
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <span>{gfTab.label}</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4 text-xs">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
              <div className="text-slate-500">Product Candidates</div>
              <div className="mt-1 font-mono text-lg font-semibold tabular-nums text-slate-900">
                {state.gramosfuel.candidates.length} tracked
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {state.gramosfuel.candidates.filter((c) => Boolean(c.linkedRetailProductId)).length}{' '}
                live in GRAMOS Mart POS
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
              <div className="text-slate-500">Samples &amp; Contract Mfg</div>
              <div className="mt-1 font-mono text-lg font-semibold tabular-nums text-slate-900">
                {state.gramosfuel.samples.filter((s) => s.verdict === 'Approved').length}/
                {state.gramosfuel.samples.length} approved
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {state.gramosfuel.manufacturerChecks.length} manufacturers audited
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
              <div className="text-slate-500">Distribution Gate</div>
              <div className="mt-1 font-mono text-lg font-semibold tabular-nums text-slate-900">
                Phase 1 Active
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Kota &amp; Hadoti local validation
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
              <div className="text-slate-500">Offline Register Sync</div>
              <div className="mt-1 font-mono text-lg font-semibold tabular-nums text-slate-900">
                {state.gramosfuel.documentationRoadmap.filter((d) => d.completed).length}/
                {state.gramosfuel.documentationRoadmap.length} phases
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                GF-PF-001 governance active
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
