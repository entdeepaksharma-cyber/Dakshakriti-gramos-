import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  BookOpenCheck,
  Truck,
  Users,
  ClipboardCheck,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  RotateCcw,
  Network,
  FlaskConical,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import { useGramosStore } from '../context/StoreContext';
import { NavSection } from '../types/gramos';

interface NavItem {
  id: NavSection;
  label: string;
  shortLabel: string;
  icon: React.FC<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Command Overview', shortLabel: 'Overview', icon: LayoutDashboard },
  { id: 'pos', label: 'POS & Billing', shortLabel: 'POS', icon: ShoppingCart },
  { id: 'inventory', label: 'Catalogue & Stock', shortLabel: 'Inventory', icon: Boxes },
  { id: 'registers', label: '10 Registers & Finance', shortLabel: 'Registers', icon: BookOpenCheck },
  { id: 'suppliers', label: 'Suppliers & Hadoti', shortLabel: 'Suppliers', icon: Truck },
  { id: 'crm', label: 'CRM & Loyalty Club', shortLabel: 'CRM', icon: Users },
  { id: 'operations', label: 'Store Zones & SOPs', shortLabel: 'SOPs', icon: ClipboardCheck },
  { id: 'gramosfuel', label: 'GRAMOSFUEL Sourcing', shortLabel: 'Sourcing', icon: FlaskConical },
  { id: 'library', label: 'Product Library', shortLabel: 'Library', icon: Layers },
  { id: 'daksh', label: 'Daksh Market B2B', shortLabel: 'Daksh B2B', icon: Network },
  { id: 'governance', label: 'Legal, QA, HR & Log', shortLabel: 'Gov & QA', icon: ShieldCheck },
];

export const Sidebar: React.FC = () => {
  const {
    activeNav,
    setActiveNav,
    sidebarCollapsed,
    setSidebarCollapsed,
    mobileMenuOpen,
    setMobileMenuOpen,
    metrics,
    resetStore,
  } = useGramosStore();

  const handleSelect = (id: NavSection) => {
    setActiveNav(id);
    setMobileMenuOpen(false);
  };

  const navContent = (isMobileDrawer: boolean) => {
    const collapsed = !isMobileDrawer && sidebarCollapsed;

    return (
      <div className="flex h-full flex-col bg-white border-r border-slate-200 select-none">
        {/* Brand Header + Minimize Control */}
        <div
          className={`flex items-center border-b border-slate-200 h-16 px-3 ${
            collapsed ? 'justify-center' : 'justify-between'
          }`}
        >
          {!collapsed && (
            <div className="min-w-0 pr-2">
              <div className="font-display text-base font-bold tracking-tight text-slate-900 truncate">
                GRAMOS Mart
              </div>
              <div className="text-[11px] font-medium text-teal-700 truncate">
                Apna Bazar · Kota Pilot
              </div>
            </div>
          )}

          {isMobileDrawer ? (
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close navigation menu"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors focus-visible:outline-2 focus-visible:outline-teal-600"
            >
              <X className="h-5 w-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              aria-label={collapsed ? 'Expand side menu' : 'Minimize side menu'}
              title={collapsed ? 'Expand side menu' : 'Minimize side menu'}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors focus-visible:outline-2 focus-visible:outline-teal-600"
            >
              {collapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-4 space-y-1" aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            const hasAlert =
              item.id === 'registers' && metrics.overdueCreditCount > 0;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                title={collapsed ? item.label : undefined}
                aria-current={isActive ? 'page' : undefined}
                className={`group flex w-full items-center rounded-lg transition-colors text-left focus-visible:outline-2 focus-visible:outline-teal-600 ${
                  collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'
                } ${
                  isActive
                    ? 'bg-teal-50 text-teal-900 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                }`}
              >
                <Icon
                  className={`h-[18px] w-[18px] shrink-0 ${
                    isActive ? 'text-teal-700' : 'text-slate-500 group-hover:text-slate-800'
                  }`}
                />
                {!collapsed && (
                  <span className="flex-1 text-sm whitespace-nowrap truncate">{item.label}</span>
                )}
                {!collapsed && hasAlert && (
                  <span className="text-[11px] font-mono font-semibold text-red-600 shrink-0">
                    {metrics.overdueCreditCount} due
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Governance Summary & Collapse/Reset */}
        <div className="border-t border-slate-200 p-2.5 space-y-1.5">
          {!collapsed && (
            <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5 text-xs text-slate-600 space-y-1">
              <div className="font-medium text-slate-900 truncate">Dakshakriti Ecosystem</div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Owned Stock</span>
                <span className="font-mono tabular-nums text-slate-800">
                  ₹{Math.round(metrics.selfFundedInventoryValue / 1000)}k
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Consignment</span>
                <span className="font-mono tabular-nums text-slate-800">
                  ₹{Math.round(metrics.consignmentStockRetailValue / 1000)}k
                </span>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              resetStore();
              setMobileMenuOpen(false);
            }}
            title="Reset sample pilot data"
            className={`flex w-full items-center rounded-lg text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors ${
              collapsed ? 'justify-center py-2' : 'gap-2.5 px-3 py-2'
            }`}
          >
            <RotateCcw className="h-3.5 w-3.5 shrink-0" />
            {!collapsed && <span className="whitespace-nowrap">Reset Pilot Data</span>}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Minimizable Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 transition-[width] duration-200 ease-out no-print ${
          sidebarCollapsed ? 'w-[68px]' : 'w-[252px]'
        }`}
      >
        <div className="sticky top-0 h-screen">{navContent(false)}</div>
      </aside>

      {/* Mobile / Tablet Compact Overlay Drawer (never covers full screen on load) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden no-print">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px]"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-[264px] max-w-[82vw] h-full shadow-xl">
            {navContent(true)}
          </aside>
        </div>
      )}
    </>
  );
};
