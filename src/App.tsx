/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { CrmView } from './components/views/CrmView';
import { DashboardView } from './components/views/DashboardView';
import { InventoryView } from './components/views/InventoryView';
import { OperationsView } from './components/views/OperationsView';
import { PosView } from './components/views/PosView';
import { RegistersView } from './components/views/RegistersView';
import { SuppliersView } from './components/views/SuppliersView';
import { DakshMarketView } from './components/views/DakshMarketView';
import { GramosfuelView } from './components/views/GramosfuelView';
import { GovernanceView } from './components/views/GovernanceView';
import { ProductLibraryView } from './components/views/ProductLibraryView';
import { StoreProvider, useGramosStore } from './context/StoreContext';

const MainWorkspace: React.FC = () => {
  const { activeNav } = useGramosStore();

  const renderView = () => {
    switch (activeNav) {
      case 'dashboard':
        return <DashboardView />;
      case 'pos':
        return <PosView />;
      case 'inventory':
        return <InventoryView />;
      case 'registers':
        return <RegistersView />;
      case 'suppliers':
        return <SuppliersView />;
      case 'crm':
        return <CrmView />;
      case 'operations':
        return <OperationsView />;
      case 'daksh':
        return <DakshMarketView />;
      case 'gramosfuel':
        return <GramosfuelView />;
      case 'library':
        return <ProductLibraryView />;
      case 'governance':
        return <GovernanceView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <TopBar />
        <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 py-5 sm:px-6 sm:py-6">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <MainWorkspace />
    </StoreProvider>
  );
}
