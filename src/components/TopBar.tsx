import React from 'react';
import { Menu, ShoppingCart, ShieldCheck } from 'lucide-react';
import { useGramosStore } from '../context/StoreContext';
import { NavSection, StaffRole } from '../types/gramos';

const SECTION_TITLES: Record<NavSection, string> = {
  dashboard: 'Command Overview',
  pos: 'POS & Multi-Channel Billing',
  inventory: 'Product Catalogue & 3-Tier Inventory',
  registers: '10 Registers, Cash Control & Profit Distribution',
  suppliers: 'Supplier Network & Made in Hadoti',
  crm: 'CRM, Enquiries, Complaints & Customer Club',
  operations: 'Store Zones (A–I), SOPs & Governance',
  daksh: 'DAKSH MARKET — Universal B2B Commerce & Procurement',
  gramosfuel: 'GRAMOSFUEL — Brand, Product Sourcing & Launch OS (DKS-P04-GF)',
  library: 'GRAMOS Universal Product Library (GRM-PL-001)',
  governance: 'Enterprise Governance — Legal, Quality Assurance, HR & Logistics (Docs 13–16)',
};

const ROLES: StaffRole[] = [
  'Founder / Operator',
  'Store Manager',
  'Billing Operator',
  'Stock Assistant',
];

export const TopBar: React.FC = () => {
  const {
    activeNav,
    setActiveNav,
    activeRole,
    setActiveRole,
    setMobileMenuOpen,
    state,
  } = useGramosStore();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-6 no-print">
      {/* Zone 1: Breadcrumb & Mobile Menu Button */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open side menu"
          className="inline-flex lg:hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 text-sm min-w-0">
          <span className="hidden sm:inline font-medium text-slate-500 whitespace-nowrap">
            Apna Bazar · {state.outletConfig.format}
          </span>
          <span className="hidden sm:inline text-slate-300" aria-hidden="true">
            /
          </span>
          <h1 className="font-display text-sm sm:text-base font-semibold text-slate-900 truncate">
            {SECTION_TITLES[activeNav]}
          </h1>
        </div>
      </div>

      {/* Zone 2 & 3: Active Role Access Switcher + Single Primary Action */}
      <div className="flex items-center gap-3 shrink-0">
        <label className="hidden md:flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600">
          <ShieldCheck className="h-3.5 w-3.5 text-teal-700 shrink-0" />
          <span className="whitespace-nowrap text-slate-500">Role:</span>
          <select
            value={activeRole}
            onChange={(e) => setActiveRole(e.target.value as StaffRole)}
            aria-label="Active staff role"
            className="bg-transparent font-medium text-slate-900 focus:outline-none cursor-pointer"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>

        {activeNav !== 'pos' && (
          <button
            type="button"
            onClick={() => setActiveNav('pos')}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-teal-600"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>Open POS Billing</span>
          </button>
        )}
      </div>
    </header>
  );
};
