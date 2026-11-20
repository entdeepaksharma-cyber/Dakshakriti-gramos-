import React, { useState } from 'react';
import { CheckSquare, LayoutGrid, Shield, Square } from 'lucide-react';
import { useGramosStore } from '../../context/StoreContext';
import { formatDateShort } from '../../utils/formatters';

const STORE_ZONES = [
  {
    code: 'Zone A',
    title: 'Entrance & Customer Welcome',
    role: 'Primary GRAMOS Mart identity, category signposts, clean access without clutter.',
    shop: 'Shop 1',
  },
  {
    code: 'Zone B',
    title: 'Main Retail Display',
    role: 'Organized category-wise shelving for grains, pulses, packaged foods & staples.',
    shop: 'Shop 1',
  },
  {
    code: 'Zone C',
    title: 'GRAMOSFUEL Product Section',
    role: 'Distinct brand display for Sattu, Roasted Chana, Millet Energy Bars & Seeds.',
    shop: 'Shop 1',
  },
  {
    code: 'Zone D',
    title: 'Made in Hadoti / Regional Products',
    role: 'Dedicated showcase for SHG pickles, papad, women-led & regional artisan items.',
    shop: 'Shop 1',
  },
  {
    code: 'Zone E',
    title: 'Household & Everyday Essentials',
    role: 'Cleaning, kitchen utilities & daily consumables (physically separated from food).',
    shop: 'Shop 1',
  },
  {
    code: 'Zone F',
    title: 'Billing & Customer Service Counter',
    role: 'POS terminal, UPI QR display, cash drawer, bill printing & entrance oversight.',
    shop: 'Shop 1',
  },
  {
    code: 'Zone G',
    title: 'Receiving & Stock Verification',
    role: 'Incoming count, batch & expiry check, invoice verification & ownership tagging.',
    shop: 'Shop 2 (or Back)',
  },
  {
    code: 'Zone H',
    title: 'Back Storage (3-Tier Tagged)',
    role: 'Dry, ventilated, pest-safe racks separating Owned, Credit & Consignment stock.',
    shop: 'Shop 2 (or Back)',
  },
  {
    code: 'Zone I',
    title: 'Damaged, Expired & Return Quarantine',
    role: 'Isolated zone preventing expired, damaged, or uninspected returns from shelf sale.',
    shop: 'Shop 2 (or Back)',
  },
];

export const OperationsView: React.FC = () => {
  const {
    state,
    toggleSopItem,
    togglePilotMilestone,
    updateOutletConfig,
  } = useGramosStore();

  const [tab, setTab] = useState<'zones' | 'sops' | 'governance'>('zones');

  const sopGroups: ('Opening SOP' | 'Closing SOP' | 'Cleanliness SOP')[] = [
    'Opening SOP',
    'Closing SOP',
    'Cleanliness SOP',
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setTab('zones')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              tab === 'zones'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Physical Zones (A–I) & Format
          </button>
          <button
            type="button"
            onClick={() => setTab('sops')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              tab === 'sops'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Daily Store SOPs & 90-Day Plan
          </button>
          <button
            type="button"
            onClick={() => setTab('governance')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              tab === 'governance'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Charter & Audit Trail ({state.auditLogs.length})
          </button>
        </div>
      </div>

      {/* TAB 1: Physical Store Zones (GRM-PAR-001) */}
      {tab === 'zones' && (
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-teal-700">
                <LayoutGrid className="h-4 w-4" />
                <span>Site Plan · Nav Durga Mandir, Opp. Kotri Steel Bridge, Kota</span>
              </div>
              <h3 className="font-display text-base font-bold text-slate-900 mt-1">
                Active Format: {state.outletConfig.format}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {state.outletConfig.format === 'One-Shop Pilot'
                  ? 'Recommended low-cost pilot using Shop 1 for retail + compact receiving & storage.'
                  : 'Shop 1 dedicated to retail Zones A–F; Shop 2 dedicated to receiving, storage & bulk wholesale packing (Zones G–I).'}
              </p>
            </div>

            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 shrink-0">
              {(['One-Shop Pilot', 'Two-Shop Integrated'] as const).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => updateOutletConfig({ format: fmt })}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {STORE_ZONES.map((z) => {
              const zoneProducts = state.products.filter((p) => p.zone === z.code);
              return (
                <div
                  key={z.code}
                  className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-semibold text-teal-700">{z.code}</span>
                      <span className="text-slate-400">
                        {state.outletConfig.format === 'One-Shop Pilot'
                          ? 'Single Outlet'
                          : z.shop}
                      </span>
                    </div>
                    <h4 className="font-display text-sm font-bold text-slate-900 mt-1">
                      {z.title}
                    </h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{z.role}</p>
                  </div>

                  {zoneProducts.length > 0 && (
                    <div className="border-t border-slate-100 pt-2.5 text-[11px] font-mono text-slate-500">
                      {zoneProducts.length} active SKUs assigned
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Daily SOP Checklists & 90-Day Pilot Plan */}
      {tab === 'sops' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7 space-y-4">
            {sopGroups.map((group) => {
              const items = state.sopChecklist.filter((i) => i.group === group);
              const done = items.filter((i) => i.completed).length;
              return (
                <div key={group} className="rounded-xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="font-display text-sm font-bold text-slate-900">{group}</h3>
                    <span className="font-mono text-xs text-slate-500 tabular-nums">
                      {done}/{items.length} completed
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleSopItem(item.id)}
                        className="flex w-full items-start gap-3 rounded-lg px-2 py-1.5 text-left hover:bg-slate-50 transition-colors"
                      >
                        {item.completed ? (
                          <CheckSquare className="h-4 w-4 text-teal-700 shrink-0 mt-0.5" />
                        ) : (
                          <Square className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 text-xs">
                          <div
                            className={
                              item.completed ? 'text-slate-400 line-through' : 'text-slate-800 font-medium'
                            }
                          >
                            {item.stepNumber}. {item.label}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Assigned: {item.assignedRole}
                            {item.lastUpdated ? ` · Checked ${item.lastUpdated}` : ''}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-5 h-fit">
            <h3 className="font-display text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              90-Day Pilot Execution Roadmap (GRM-BP-001)
            </h3>
            <div className="mt-3 space-y-3">
              {state.pilotMilestones.map((m) => (
                <label
                  key={m.id}
                  className="flex items-start gap-2.5 text-xs cursor-pointer py-1"
                >
                  <input
                    type="checkbox"
                    checked={m.completed}
                    onChange={() => togglePilotMilestone(m.id)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-teal-700"
                  />
                  <div>
                    <div className="text-[11px] font-semibold text-teal-700">{m.phase}</div>
                    <div className={m.completed ? 'text-slate-400 line-through' : 'text-slate-800'}>
                      {m.task}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Governance Charter & Immutable Audit Log */}
      {tab === 'governance' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-5 space-y-4 h-fit">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Shield className="h-4 w-4 text-teal-700" />
              <h3 className="font-display text-base font-bold text-slate-900">
                Governance & IP Boundary (GRM-GOV-001)
              </h3>
            </div>
            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div>
                <strong className="text-slate-900">Brand Hierarchy:</strong> GRAMOS Mart (Primary Retail) · GRAMOSFUEL (Consumer Product Brand) · Made in Hadoti (Producer Discovery) · Gramodaya Udyam (Sourcing Network) · Dakshakriti (Management & Tech Ecosystem).
              </div>
              <div>
                <strong className="text-slate-900">Property Owner Participation:</strong> 15–20% of outlet Distributable Profit only. Does not confer ownership of GRAMOS/GRAMOSFUEL brands, operating software, supplier contracts, or unrelated outlets.
              </div>
              <div>
                <strong className="text-slate-900">Role-Based Access Control:</strong> Billing Operators cannot alter unit prices, apply unauthorized discounts, or delete sales records. Every stock adjustment and cash reconciliation is logged below.
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4">
              <h3 className="font-display text-base font-semibold text-slate-900">
                System Audit Trail
              </h3>
              <p className="text-xs text-slate-500">
                Traceable record of billing, stock receipts, quarantine, settlements & cash closings
              </p>
            </div>
            <div className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto">
              {state.auditLogs.map((log) => (
                <div key={log.id} className="px-5 py-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-900">
                      {log.module} · {log.action}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      {formatDateShort(log.timestamp)}
                    </span>
                  </div>
                  <div className="text-slate-600 mt-0.5">{log.details}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Actor: {log.actor}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
