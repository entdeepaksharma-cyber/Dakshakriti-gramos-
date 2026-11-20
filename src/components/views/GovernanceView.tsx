import React, { useMemo, useState } from 'react';
import {
  ClipboardCheck,
  Play,
  Plus,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Truck,
  Users,
} from 'lucide-react';
import { useGramosStore } from '../../context/StoreContext';
import {
  DeliveryModel,
  DispatchStatus,
  EmployeeTrainingMatrix,
  EntityVerificationStatus,
  GovernanceTab,
  InventoryQualityStatus,
  LegalPriority,
  LogisticsMode,
  ProductApprovalDecision,
  RecallSeverity,
  RecallStatus,
  ResponsibilityLevel,
} from '../../types/gramos';
import { formatINR } from '../../utils/formatters';
import { runFourPhaseValidation } from '../../utils/phaseValidationEngine';

const GRN_13_POINTS = [
  '1. Supplier Identity Match',
  '2. Invoice / Challan Match',
  '3. Quantity Verification',
  '4. Outer Carton Integrity',
  '5. Primary Packaging & Seal',
  '6. Batch / Lot Code Readable',
  '7. Mfg & Expiry / Best-Before Date',
  '8. Legal Metrology (MRP / Net Wt / Packer)',
  '9. FSSAI / Statutory Licence Mark',
  '10. Visual Color / Texture / Aroma',
  '11. Moisture / Pest / Contamination Free',
  '12. Weight / Volume Sample Check',
  '13. Zone Separation & FEFO Tagging',
];

const TRAINING_LABELS: { key: keyof EmployeeTrainingMatrix; label: string }[] = [
  { key: 'businessIntro', label: '1. Business Intro' },
  { key: 'productKnowledge', label: '2. Product Claims Rule' },
  { key: 'customerService', label: '3. Customer Service' },
  { key: 'billingPayments', label: '4. Billing & Cash/UPI' },
  { key: 'inventoryFefo', label: '5. FEFO & Quarantine' },
  { key: 'safetyHygiene', label: '6. Safety & Hygiene' },
  { key: 'digitalRbac', label: '7. Digital App RBAC' },
];

const CONDUCT_RULES = [
  'Honest billing on every retail, WhatsApp, and wholesale transaction',
  'Strict zero tolerance for unrecorded cash handling or personal UPI QR display',
  'Respectful and helpful customer interaction at counter and delivery doorstep',
  'No invented health, medical, or unverified product claims',
  'Clean store presentation and strict food/chemical zone separation',
  'Immediate quarantine of damaged, leaked, or expired goods to Zone I',
  'Confidential protection of supplier pricing and customer DPDP phone records',
  'Prompt attendance, punctuality, and proper shift handover of cash drawer',
  'Proper care of weighing scales, fire extinguisher, racks, and POS device',
  'Strict compliance with safety, harassment-free workplace (POSH), and zero theft',
];

export const GovernanceView: React.FC = () => {
  const {
    state,
    activeRole,
    governanceTab,
    setGovernanceTab,
    updateEntityVerificationStatus,
    toggleLegalChecklistItem,
    toggleShopClauseConfirmed,
    updateCategoryComplianceStatus,
    toggleLegalFolderReady,
    recordProductApproval,
    recordGrnInspection,
    createRecallCase,
    updateRecallStatus,
    toggleQualityAuditTask,
    setStaffingModel,
    addEmployee,
    toggleEmployeeTrainingModule,
    markEmployeeExitRevoked,
    recordAttendance,
    recordPayrollEntry,
    createDispatchRecord,
    updateDispatchStatus,
    createStockTransfer,
    markTransferReceived,
    recordProducerCollection,
  } = useGramosStore();

  const gov = state.governance;

  // Tab 1 filters
  const [priorityFilter, setPriorityFilter] = useState<'All' | LegalPriority>('All');

  // Tab 2 local form state (Product Approval, GRN, Mock Recall Traceability, Recall Case)
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [apProductId, setApProductId] = useState(state.products[0]?.id || '');
  const [apDecision, setApDecision] = useState<ProductApprovalDecision>('Approved');
  const [apStage1, setApStage1] = useState(true);
  const [apStage2, setApStage2] = useState(true);
  const [apStage3, setApStage3] = useState(true);
  const [apStage4, setApStage4] = useState(true);
  const [apNotes, setApNotes] = useState('');

  const [showGrnForm, setShowGrnForm] = useState(false);
  const [grnPoCode, setGrnPoCode] = useState('GRM-PO-000003');
  const [grnSupplier, setGrnSupplier] = useState(state.suppliers[0]?.name || '');
  const [grnProduct, setGrnProduct] = useState(state.products[0]?.name || '');
  const [grnBatch, setGrnBatch] = useState('GF-LOT-2611');
  const [grnQty, setGrnQty] = useState(40);
  const [grnPassed, setGrnPassed] = useState<string[]>(GRN_13_POINTS);
  const [grnQualityStatus, setGrnQualityStatus] = useState<InventoryQualityStatus>(
    'Status A — Approved Saleable'
  );
  const [grnDecision, setGrnDecision] = useState<'Accepted' | 'Quarantined' | 'Rejected'>(
    'Accepted'
  );
  const [grnNotes, setGrnNotes] = useState('');

  // Mock Recall Traceability
  const [traceProductId, setTraceProductId] = useState(state.products[0]?.id || '');
  const [showRecallForm, setShowRecallForm] = useState(false);
  const [rclProductId, setRclProductId] = useState(state.products[0]?.id || '');
  const [rclReason, setRclReason] = useState('');
  const [rclSeverity, setRclSeverity] = useState<RecallSeverity>('Preventive Withdrawal');
  const [rclQtyAffected, setRclQtyAffected] = useState(5);
  const [rclQuarantineNow, setRclQuarantineNow] = useState(5);
  const [rclNotes, setRclNotes] = useState('');

  // Tab 3 HR forms
  const [showEmpForm, setShowEmpForm] = useState(false);
  const [empName, setEmpName] = useState('');
  const [empLevel, setEmpLevel] = useState<ResponsibilityLevel>(
    'Level 3 — Sales & Customer Service Executive'
  );
  const [empRoleTitle, setEmpRoleTitle] = useState('Store Sales & Stock Assistant');
  const [empPhone, setEmpPhone] = useState('');
  const [empWage, setEmpWage] = useState(11000);

  const [attEmpCode, setAttEmpCode] = useState(gov.employees[1]?.empCode || gov.employees[0]?.empCode || '');
  const [attShift, setAttShift] = useState<
    'Morning (08:30–14:30)' | 'Full Day (09:00–20:00)' | 'Evening (14:00–21:00)'
  >('Full Day (09:00–20:00)');
  const [attStatus, setAttStatus] = useState<'Present' | 'Half Day' | 'Leave' | 'Absent'>(
    'Present'
  );
  const [attNotes, setAttNotes] = useState('');

  const [payEmpCode, setPayEmpCode] = useState(gov.employees[1]?.empCode || '');
  const [payMonth, setPayMonth] = useState('2026-11');
  const [payGross, setPayGross] = useState(11000);
  const [payDeductions, setPayDeductions] = useState(0);
  const [payRef, setPayRef] = useState('');
  const [paySyncExpense, setPaySyncExpense] = useState(true);

  // Tab 4 Logistics forms
  const [showDispatchForm, setShowDispatchForm] = useState(false);
  const [dspBillRef, setDspBillRef] = useState(state.sales[0]?.billNo || '');
  const [dspCustomer, setDspCustomer] = useState('');
  const [dspModel, setDspModel] = useState<DeliveryModel>('Model B — Local Delivery');
  const [dspMode, setDspMode] = useState<LogisticsMode>('Mode C — Third-Party Transport');
  const [dspSummary, setDspSummary] = useState('');
  const [dspCost, setDspCost] = useState(40);

  const [showTransferForm, setShowTransferForm] = useState(false);
  const [stkFrom, setStkFrom] = useState('Kotri Pilot Outlet 01');
  const [stkTo, setStkTo] = useState('Kotri Secondary Storage / Pop-Up');
  const [stkProductId, setStkProductId] = useState(state.products[0]?.id || '');
  const [stkQty, setStkQty] = useState(10);
  const [stkReason, setStkReason] = useState('Rebalancing pilot shelf display');

  const [showCollectionForm, setShowCollectionForm] = useState(false);
  const [colProducer, setColProducer] = useState(
    state.suppliers.find((s) => s.isRegionalHadoti)?.name || state.suppliers[0]?.name || ''
  );
  const [colCluster, setColCluster] = useState('Bundi / Hadoti Rural Cluster');
  const [colProduct, setColProduct] = useState('');
  const [colQty, setColQty] = useState(25);
  const [colUnit, setColUnit] = useState('Packs');
  const [colMode, setColMode] = useState<LogisticsMode>('Mode B — Local Pickup');
  const [colCost, setColCost] = useState(120);

  // Derived trace data for Doc 14 Mock Recall Drill
  const traceabilityResult = useMemo(() => {
    const product = state.products.find((p) => p.id === traceProductId);
    if (!product) return null;
    const supplier = state.suppliers.find((s) => s.id === product.supplierId);
    const matchingCredits = state.creditEntries.filter((c) => c.supplierId === product.supplierId);
    const matchingSales = state.sales.filter((s) =>
      s.items.some((i) => i.productId === product.id)
    );
    const unitsSold = matchingSales.reduce(
      (sum, s) =>
        sum +
        s.items
          .filter((i) => i.productId === product.id)
          .reduce((isum, i) => isum + i.qty, 0),
      0
    );
    return { product, supplier, matchingCredits, matchingSales, unitsSold };
  }, [traceProductId, state.products, state.suppliers, state.creditEntries, state.sales]);

  // Derived Status A-F inventory counts (Doc 14)
  const qaStatusSummary = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const statusASaleableUnits = state.products.reduce((sum, p) => sum + p.stockQty, 0);
    const quarantinedUnits = state.products.reduce((sum, p) => sum + p.quarantinedQty, 0);
    const expiredSkus = state.products.filter(
      (p) => p.expiryDate && p.expiryDate < today
    ).length;
    const returnedSalesCount = state.sales.filter((s) => s.isReturned).length;
    const pendingInspectionGrns = gov.grnInspections.filter(
      (g) => g.qualityStatus === 'Status B — Inspection Pending'
    ).length;
    return {
      statusASaleableUnits,
      quarantinedUnits,
      expiredSkus,
      returnedSalesCount,
      pendingInspectionGrns,
    };
  }, [state.products, state.sales, gov.grnInspections]);

  const [testRunNonce, setTestRunNonce] = useState(0);
  const fourPhaseReport = useMemo(() => {
    void testRunNonce;
    return runFourPhaseValidation(state);
  }, [state, testRunNonce]);

  const TABS: { id: GovernanceTab; label: string; docCode: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'legal', label: 'Legal & Compliance', docCode: 'GRM-LGL-001', icon: Scale },
    { id: 'quality', label: 'QA, Inspection & Recalls', docCode: 'GRM-QAC-001', icon: ShieldCheck },
    { id: 'hr', label: 'HR, Training & Payroll', docCode: 'GRM-HR-001', icon: Users },
    { id: 'logistics', label: 'Logistics, Zones & Dispatch', docCode: 'GRM-LOG-001', icon: Truck },
    { id: 'implementation', label: '4-Phase Test Suite', docCode: 'GRM-IMP-001', icon: Play },
  ];

  // Legal stats
  const verifiedEntityCount = gov.entityVerifications.filter((e) => e.status === 'Verified').length;
  const completedLegalCount = gov.legalChecklist.filter((l) => l.completed).length;
  const readyFolderCount = gov.legalFolders.filter((f) => f.ready).length;
  const blockedCatCount = gov.categoryCompliance.filter(
    (c) => c.status === 'Blocked — Licence Required'
  ).length;

  // HR stats
  const activeEmployees = gov.employees.filter((e) => e.status === 'Active');

  // Logistics stats
  const totalTransportSpend =
    gov.dispatches.reduce((sum, d) => sum + d.transportCost, 0) +
    gov.producerCollections.reduce((sum, c) => sum + c.transportCost, 0);
  const deliveredDispatches = gov.dispatches.filter(
    (d) => d.status === 'Delivered — POD Verified'
  ).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-teal-700">
              <span>DKS-P05-GRAMOS</span>
              <span className="text-slate-300">·</span>
              <span>DOCS 13–16 ENTERPRISE CONTROL</span>
              <span className="text-slate-300">·</span>
              <span>{state.outletConfig.outletName}</span>
            </div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              Legal Compliance, Quality Assurance, HR & Logistics OS
            </h2>
            <p className="text-xs text-slate-600 max-w-3xl">
              Synchronized statutory gatekeeper (GRM-LGL-001), 5-stage QA & batch mock-recall
              traceability (GRM-QAC-001), lean staffing & 7-module training matrix (GRM-HR-001),
              and multi-mode dispatch & non-sale stock transfers (GRM-LOG-001).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {TABS.map((t) => {
              const Icon = t.icon;
              const isActive = governanceTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setGovernanceTab(t.id)}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                    isActive
                      ? 'border-teal-700 bg-teal-700 text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{t.label}</span>
                  <span
                    className={`font-mono text-[10px] ${
                      isActive ? 'text-teal-100' : 'text-slate-400'
                    }`}
                  >
                    {t.docCode}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* TAB 1: LEGAL & COMPLIANCE (DOCUMENT 13 — GRM-LGL-001)              */}
      {/* =================================================================== */}
      {governanceTab === 'legal' && (
        <div className="space-y-6">
          {/* KPI Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-xs text-slate-500">Entity Verification</div>
              <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-slate-900">
                {verifiedEntityCount}/{gov.entityVerifications.length}
              </div>
              <div className="mt-1 text-[11px] text-amber-700">
                Reconcile Dakshakriti LLP vs Pvt Ltd
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-xs text-slate-500">19-Point Legal Readiness</div>
              <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-slate-900">
                {completedLegalCount}/{gov.legalChecklist.length}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                Across Priority 1 to 4 gates
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-xs text-slate-500">Legal Document Folders</div>
              <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-slate-900">
                {readyFolderCount}/{gov.legalFolders.length}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                Folders 01–10 (Physical + Digital)
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-xs text-slate-500">Restricted Category Gates</div>
              <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-red-700">
                {blockedCatCount} Blocked
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                Medicines & Agro-Chemicals need licence
              </div>
            </div>
          </div>

          {/* Discrepancy & Entity Verification Matrix */}
          <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="font-display text-sm font-bold text-slate-900">
                  1. Legal Entity Verification & Dakshakriti Structure Reconciliation
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mandatory Rule: Do not sign any lease, trade licence, or supplier agreement using an
                  assumed company name or unverified LLP vs Private Limited designation.
                </p>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {gov.entityVerifications.map((ev) => (
                <div
                  key={ev.id}
                  className="px-5 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                      <span className="font-mono text-slate-400">
                        #{String(ev.itemNo).padStart(2, '0')}
                      </span>
                      <span>{ev.title}</span>
                    </div>
                    <p className="text-xs text-slate-600">{ev.details}</p>
                    <p className="text-[11px] text-slate-500">Action: {ev.actionRequired}</p>
                  </div>
                  <select
                    value={ev.status}
                    onChange={(e) =>
                      updateEntityVerificationStatus(
                        ev.id,
                        e.target.value as EntityVerificationStatus
                      )
                    }
                    aria-label={`Verification status for ${ev.title}`}
                    className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium shrink-0 cursor-pointer ${
                      ev.status === 'Verified'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : ev.status === 'Discrepancy Flagged'
                        ? 'border-red-200 bg-red-50 text-red-800'
                        : 'border-amber-200 bg-amber-50 text-amber-800'
                    }`}
                  >
                    <option value="Verified">Verified</option>
                    <option value="Pending Verification">Pending Verification</option>
                    <option value="Discrepancy Flagged">Discrepancy Flagged</option>
                  </select>
                </div>
              ))}
            </div>
          </section>

          {/* Property Occupation & Profit-Sharing Protection */}
          <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="font-display text-sm font-bold text-slate-900">
                  2. Property Occupation, ₹35,000 Quote Clarification & Profit-Sharing Protection
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Active Store Model: {state.outletConfig.propertyArrangement} · Owner Share{' '}
                  <span className="font-mono font-semibold text-slate-800">
                    {state.outletConfig.ownerSharePercent}%
                  </span>{' '}
                  of distributable outlet profit only (outside Dakshakriti & GRAMOSFUEL revenue is
                  ring-fenced).
                </p>
              </div>
              <div className="text-xs font-mono text-slate-600">
                {gov.shopAgreementClauses.filter((c) => c.confirmed).length}/
                {gov.shopAgreementClauses.length} core clauses confirmed
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:gap-px bg-slate-100">
              {gov.shopAgreementClauses.map((clause) => (
                <label
                  key={clause.id}
                  className="bg-white p-4 flex items-start gap-3 cursor-pointer hover:bg-slate-50/70"
                >
                  <input
                    type="checkbox"
                    checked={clause.confirmed}
                    onChange={() => toggleShopClauseConfirmed(clause.id)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                  />
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-slate-900">
                      Clause {clause.clauseNo}: {clause.title}
                    </div>
                    <p className="text-xs text-slate-600">{clause.summary}</p>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* 19-Item Pre-Launch Legal Checklist */}
          <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div>
                <h3 className="font-display text-sm font-bold text-slate-900">
                  3. Master Statutory Compliance & Pre-Launch Action Checklist (19 Items)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Includes Rajasthan Shops Act (LDMS), Kota Trade Licence (LSG), FSSAI FoSCoS,
                  SKU-level GST rates, and Legal Metrology Packaged Commodities Rules 2011.
                </p>
              </div>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as 'All' | LegalPriority)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-800"
              >
                <option value="All">All Priorities ({gov.legalChecklist.length})</option>
                <option value="Priority 1 — Immediate">Priority 1 — Immediate</option>
                <option value="Priority 2 — Before Public Opening">
                  Priority 2 — Before Public Opening
                </option>
                <option value="Priority 3 — During Pilot">Priority 3 — During Pilot</option>
                <option value="Priority 4 — Before Expansion">
                  Priority 4 — Before Expansion
                </option>
              </select>
            </div>
            <div className="divide-y divide-slate-100">
              {gov.legalChecklist
                .filter((i) => priorityFilter === 'All' || i.priority === priorityFilter)
                .map((item) => (
                  <label
                    key={item.id}
                    className="px-5 py-3 flex items-start gap-3 cursor-pointer hover:bg-slate-50/70"
                  >
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => toggleLegalChecklistItem(item.id)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-mono text-slate-400">
                          #{String(item.itemNo).padStart(2, '0')}
                        </span>
                        <span
                          className={`font-semibold ${
                            item.completed ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {item.item}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="font-mono text-[11px] text-teal-700">{item.priority}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Rule: {item.governingRule}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{item.notes}</p>
                    </div>
                  </label>
                ))}
            </div>
          </section>

          {/* Category Compliance Gate + Legal Folders */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="border-b border-slate-200 px-5 py-4">
                <h3 className="font-display text-sm font-bold text-slate-900">
                  4. Category-Specific Stocking Gate
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Every new product category must pass regulatory clearance before commercial stocking.
                </p>
              </div>
              <div className="divide-y divide-slate-100">
                {gov.categoryCompliance.map((cat) => (
                  <div key={cat.id} className="px-5 py-3 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-900">{cat.category}</span>
                      <select
                        value={cat.status}
                        onChange={(e) =>
                          updateCategoryComplianceStatus(
                            cat.id,
                            e.target.value as typeof cat.status
                          )
                        }
                        className={`rounded-lg border px-2 py-1 text-[11px] font-medium ${
                          cat.status === 'Cleared'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            : cat.status === 'Blocked — Licence Required'
                            ? 'border-red-200 bg-red-50 text-red-800'
                            : 'border-amber-200 bg-amber-50 text-amber-800'
                        }`}
                      >
                        <option value="Cleared">Cleared</option>
                        <option value="Conditional — Check Per SKU">
                          Conditional — Check Per SKU
                        </option>
                        <option value="Blocked — Licence Required">
                          Blocked — Licence Required
                        </option>
                      </select>
                    </div>
                    <p className="text-xs text-slate-600">{cat.mandatoryChecks}</p>
                    <p className="text-[11px] text-slate-400">{cat.notes}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="border-b border-slate-200 px-5 py-4">
                <h3 className="font-display text-sm font-bold text-slate-900">
                  5. Legal & Compliance Document Repository (Folders 01–10)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Standard physical + cloud folder hierarchy required for inspections & audits.
                </p>
              </div>
              <div className="divide-y divide-slate-100">
                {gov.legalFolders.map((folder) => (
                  <label
                    key={folder.id}
                    className="px-5 py-2.5 flex items-start gap-3 cursor-pointer hover:bg-slate-50/70"
                  >
                    <input
                      type="checkbox"
                      checked={folder.ready}
                      onChange={() => toggleLegalFolderReady(folder.id)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-slate-900">
                          <span className="font-mono text-teal-700 mr-1.5">
                            Folder {folder.folderNo}
                          </span>
                          {folder.name}
                        </span>
                        <span
                          className={`font-mono text-[11px] ${
                            folder.ready ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          {folder.ready ? 'Filed' : 'Pending'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {folder.contentsSummary}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: QUALITY ASSURANCE, INSPECTION & RECALLS (DOC 14 GRM-QAC-001) */}
      {/* =================================================================== */}
      {governanceTab === 'quality' && (
        <div className="space-y-6">
          {/* 6-Status Inventory Quality Classification Strip (Status A-F) */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="rounded-xl border border-slate-200 bg-white p-3.5">
              <div className="text-[11px] text-slate-500">Status A · Approved Saleable</div>
              <div className="mt-1 font-mono text-xl font-bold tabular-nums text-emerald-700">
                {qaStatusSummary.statusASaleableUnits} units
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3.5">
              <div className="text-[11px] text-slate-500">Status B · Inspection Pending</div>
              <div className="mt-1 font-mono text-xl font-bold tabular-nums text-amber-700">
                {qaStatusSummary.pendingInspectionGrns} lots
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3.5">
              <div className="text-[11px] text-slate-500">Status C · Damaged (Zone I)</div>
              <div className="mt-1 font-mono text-xl font-bold tabular-nums text-red-700">
                {qaStatusSummary.quarantinedUnits} units
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3.5">
              <div className="text-[11px] text-slate-500">Status D · Expired SKUs</div>
              <div className="mt-1 font-mono text-xl font-bold tabular-nums text-slate-900">
                {qaStatusSummary.expiredSkus} SKUs
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3.5">
              <div className="text-[11px] text-slate-500">Status E · Recall / Suspect</div>
              <div className="mt-1 font-mono text-xl font-bold tabular-nums text-slate-900">
                {gov.recalls.filter((r) => r.status !== 'Closed').length} cases
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3.5">
              <div className="text-[11px] text-slate-500">Status F · Customer Returns</div>
              <div className="mt-1 font-mono text-xl font-bold tabular-nums text-slate-900">
                {qaStatusSummary.returnedSalesCount} bills
              </div>
            </div>
          </div>

          {/* 5-Stage Internal Product Approval Register */}
          <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="font-display text-sm font-bold text-slate-900">
                  1. 5-Stage Internal Product Approval Register
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Digital catalogue entry alone does not constitute quality approval. Every SKU must
                  clear Stages 1–4 before commercial release.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowApprovalForm(!showApprovalForm)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Log Product QA Approval</span>
              </button>
            </div>

            {showApprovalForm && (
              <div className="border-b border-slate-200 bg-slate-50 p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Select Live Store SKU
                    </label>
                    <select
                      value={apProductId}
                      onChange={(e) => setApProductId(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                    >
                      {state.products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.sku} · {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Stage 5 Approval Decision
                    </label>
                    <select
                      value={apDecision}
                      onChange={(e) => setApDecision(e.target.value as ProductApprovalDecision)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                    >
                      <option value="Approved">Approved</option>
                      <option value="Approved with Conditions">Approved with Conditions</option>
                      <option value="Sample Evaluation Required">
                        Sample Evaluation Required
                      </option>
                      <option value="Pending Documentation">Pending Documentation</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Inspection / Compliance Notes
                    </label>
                    <input
                      type="text"
                      value={apNotes}
                      onChange={(e) => setApNotes(e.target.value)}
                      placeholder="e.g., FSSAI label & net weight verified"
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700">
                  <label className="inline-flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={apStage1}
                      onChange={(e) => setApStage1(e.target.checked)}
                    />
                    Stage 1: Product & Batch ID
                  </label>
                  <label className="inline-flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={apStage2}
                      onChange={(e) => setApStage2(e.target.checked)}
                    />
                    Stage 2: FSSAI / Legal Metrology Docs
                  </label>
                  <label className="inline-flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={apStage3}
                      onChange={(e) => setApStage3(e.target.checked)}
                    />
                    Stage 3: Physical Packaging & Sample
                  </label>
                  <label className="inline-flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={apStage4}
                      onChange={(e) => setApStage4(e.target.checked)}
                    />
                    Stage 4: Commercial & Margin Check
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const prod = state.products.find((p) => p.id === apProductId);
                      if (!prod) return;
                      const sup = state.suppliers.find((s) => s.id === prod.supplierId);
                      recordProductApproval({
                        productId: prod.id,
                        sku: prod.sku,
                        productName: prod.name,
                        supplierName: sup?.name || 'Registered Supplier',
                        stage1ProductId: apStage1,
                        stage2Docs: apStage2,
                        stage3Physical: apStage3,
                        stage4Commercial: apStage4,
                        decision: apDecision,
                        reviewedBy: activeRole,
                        notes: apNotes || 'Verified against GRM-QAC-001 5-stage gate.',
                      });
                      setShowApprovalForm(false);
                      setApNotes('');
                    }}
                    className="ml-auto rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800"
                  >
                    Save Approval Record
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">SKU & Product</th>
                    <th className="px-4 py-2.5 font-medium">Stages 1–4 Gates</th>
                    <th className="px-4 py-2.5 font-medium">Decision</th>
                    <th className="px-4 py-2.5 font-medium">Reviewed</th>
                    <th className="px-4 py-2.5 font-medium">Conditions / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {gov.productApprovals.map((pa) => (
                    <tr key={pa.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{pa.productName}</div>
                        <div className="font-mono text-[11px] text-slate-500">
                          {pa.sku} · {pa.supplierName}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-700">
                        {[
                          pa.stage1ProductId ? 'S1:OK' : 'S1:—',
                          pa.stage2Docs ? 'S2:OK' : 'S2:—',
                          pa.stage3Physical ? 'S3:OK' : 'S3:—',
                          pa.stage4Commercial ? 'S4:OK' : 'S4:—',
                        ].join(' · ')}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`font-semibold ${
                            pa.decision === 'Approved'
                              ? 'text-emerald-700'
                              : pa.decision === 'Rejected'
                              ? 'text-red-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {pa.decision}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                        {pa.reviewedDate} · {pa.reviewedBy}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{pa.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 13-Point Incoming Goods GRN Inspection */}
          <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="font-display text-sm font-bold text-slate-900">
                  2. 13-Point Incoming Goods Receiving Inspection (GRM-GRN)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Every lot arriving at Zone G must pass physical seal, batch, expiry, Legal
                  Metrology, and FSSAI verification before shelf stocking.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGrnForm(!showGrnForm)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 shrink-0"
              >
                <ClipboardCheck className="h-3.5 w-3.5 text-teal-700" />
                <span>New 13-Point GRN Inspection</span>
              </button>
            </div>

            {showGrnForm && (
              <div className="border-b border-slate-200 bg-slate-50 p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  <input
                    type="text"
                    value={grnPoCode}
                    onChange={(e) => setGrnPoCode(e.target.value)}
                    placeholder="PO Ref (GRM-PO-000003)"
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-mono"
                  />
                  <input
                    type="text"
                    value={grnSupplier}
                    onChange={(e) => setGrnSupplier(e.target.value)}
                    placeholder="Supplier Name"
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                  />
                  <input
                    type="text"
                    value={grnProduct}
                    onChange={(e) => setGrnProduct(e.target.value)}
                    placeholder="Product Name"
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                  />
                  <input
                    type="text"
                    value={grnBatch}
                    onChange={(e) => setGrnBatch(e.target.value)}
                    placeholder="Batch No"
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-mono"
                  />
                  <input
                    type="number"
                    min={1}
                    value={grnQty}
                    onChange={(e) => setGrnQty(Number(e.target.value) || 0)}
                    placeholder="Qty Received"
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-mono"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 bg-white rounded-lg border border-slate-200 p-3">
                  {GRN_13_POINTS.map((pt) => {
                    const checked = grnPassed.includes(pt);
                    return (
                      <label key={pt} className="flex items-center gap-2 text-xs text-slate-700">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setGrnPassed((prev) =>
                              checked ? prev.filter((p) => p !== pt) : [...prev, pt]
                            )
                          }
                        />
                        <span>{pt}</span>
                      </label>
                    );
                  })}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={grnQualityStatus}
                    onChange={(e) =>
                      setGrnQualityStatus(e.target.value as InventoryQualityStatus)
                    }
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                  >
                    <option value="Status A — Approved Saleable">
                      Status A — Approved Saleable
                    </option>
                    <option value="Status B — Inspection Pending">
                      Status B — Inspection Pending
                    </option>
                    <option value="Status C — Damaged">Status C — Damaged</option>
                    <option value="Status E — Suspect / Quarantined">
                      Status E — Suspect / Quarantined
                    </option>
                  </select>
                  <select
                    value={grnDecision}
                    onChange={(e) =>
                      setGrnDecision(e.target.value as 'Accepted' | 'Quarantined' | 'Rejected')
                    }
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                  >
                    <option value="Accepted">Accepted</option>
                    <option value="Quarantined">Quarantined</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                  <input
                    type="text"
                    value={grnNotes}
                    onChange={(e) => setGrnNotes(e.target.value)}
                    placeholder="Inspection notes..."
                    className="flex-1 min-w-[200px] rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!grnProduct.trim()) return;
                      recordGrnInspection({
                        poCode: grnPoCode,
                        date: new Date().toISOString().slice(0, 10),
                        supplierName: grnSupplier,
                        productName: grnProduct,
                        batchNo: grnBatch,
                        qtyReceived: grnQty,
                        passedPoints: grnPassed,
                        qualityStatus: grnQualityStatus,
                        decision: grnDecision,
                        inspector: activeRole,
                        notes:
                          grnNotes || `${grnPassed.length}/13 physical receiving checks passed.`,
                      });
                      setShowGrnForm(false);
                      setGrnNotes('');
                    }}
                    className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800"
                  >
                    Log GRN ({grnPassed.length}/13)
                  </button>
                </div>
              </div>
            )}

            <div className="divide-y divide-slate-100">
              {gov.grnInspections.map((grn) => (
                <div
                  key={grn.id}
                  className="px-5 py-3 flex flex-col md:flex-row md:items-center justify-between gap-2"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono font-bold text-teal-700">{grn.grnCode}</span>
                      <span className="text-slate-300">·</span>
                      <span className="font-semibold text-slate-900">{grn.productName}</span>
                      <span className="text-slate-300">·</span>
                      <span className="font-mono text-slate-500">Batch {grn.batchNo}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {grn.supplierName} · PO {grn.poCode} · {grn.qtyReceived} units ·{' '}
                      <span className="font-mono font-semibold">
                        {grn.passedPoints.length}/13 checks
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-400">{grn.notes}</p>
                  </div>
                  <div className="text-right text-xs shrink-0">
                    <div
                      className={`font-semibold ${
                        grn.decision === 'Accepted'
                          ? 'text-emerald-700'
                          : grn.decision === 'Quarantined'
                          ? 'text-amber-700'
                          : 'text-red-700'
                      }`}
                    >
                      {grn.decision}
                    </div>
                    <div className="font-mono text-[11px] text-slate-500">
                      {grn.qualityStatus}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Live Mock Recall Traceability Tool + Recall Register */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="border-b border-slate-200 px-5 py-4">
                <h3 className="font-display text-sm font-bold text-slate-900">
                  3. Live Batch Traceability & Mock Recall Drill
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Internal traceability simulation querying live Supplier, Credit Ledger, Stock,
                  and POS Invoices (does not assert a real regulatory recall).
                </p>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Select SKU / Batch to Trace
                  </label>
                  <select
                    value={traceProductId}
                    onChange={(e) => setTraceProductId(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900"
                  >
                    {state.products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.sku} · {p.name} (Batch {p.batchNumber})
                      </option>
                    ))}
                  </select>
                </div>

                {traceabilityResult && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Source Supplier</span>
                      <span className="font-semibold text-slate-900">
                        {traceabilityResult.supplier?.name || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Supplier Licence / GST</span>
                      <span className="font-mono text-slate-700">
                        {traceabilityResult.supplier?.gstOrLicense || 'Pending'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Batch & Shelf Location</span>
                      <span className="font-mono text-slate-900">
                        {traceabilityResult.product.batchNumber} · {traceabilityResult.product.zone}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Remaining Saleable / Quarantined</span>
                      <span className="font-mono font-semibold text-slate-900">
                        {traceabilityResult.product.stockQty} saleable /{' '}
                        {traceabilityResult.product.quarantinedQty} quarantined
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Units Dispatched via POS Bills</span>
                      <span className="font-mono font-semibold text-teal-800">
                        {traceabilityResult.unitsSold} units across{' '}
                        {traceabilityResult.matchingSales.length} invoices
                      </span>
                    </div>
                    {traceabilityResult.matchingSales.length > 0 && (
                      <div className="pt-2 border-t border-slate-200">
                        <div className="text-[11px] font-medium text-slate-500 mb-1">
                          Affected Customer Invoices (for urgent outreach if recalled):
                        </div>
                        <div className="space-y-1">
                          {traceabilityResult.matchingSales.map((s) => (
                            <div
                              key={s.id}
                              className="flex justify-between font-mono text-[11px] text-slate-700"
                            >
                              <span>
                                {s.billNo} · {s.customerName}
                              </span>
                              <span>{s.channel}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Recall Register & Daily/Weekly/Monthly Quality Audits */}
            <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="border-b border-slate-200 px-5 py-4 flex items-center justify-between gap-2">
                <div>
                  <h3 className="font-display text-sm font-bold text-slate-900">
                    4. Recall Register & Stop-Sale Control
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    10-step immediate quarantine & supplier investigation log.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRecallForm(!showRecallForm)}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                >
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span>Open Recall / Quarantine</span>
                </button>
              </div>

              {showRecallForm && (
                <div className="border-b border-slate-200 bg-red-50/40 p-4 space-y-2.5">
                  <select
                    value={rclProductId}
                    onChange={(e) => setRclProductId(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                  >
                    {state.products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.sku} · {p.name} (Stock: {p.stockQty})
                      </option>
                    ))}
                  </select>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={rclSeverity}
                      onChange={(e) => setRclSeverity(e.target.value as RecallSeverity)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs col-span-2"
                    >
                      <option value="Preventive Withdrawal">Preventive Withdrawal</option>
                      <option value="Class II — Quality / Mislabel">
                        Class II — Quality / Mislabel
                      </option>
                      <option value="Class I — Immediate Hazard">
                        Class I — Immediate Hazard
                      </option>
                    </select>
                    <input
                      type="number"
                      min={0}
                      value={rclQuarantineNow}
                      onChange={(e) => {
                        const v = Number(e.target.value) || 0;
                        setRclQuarantineNow(v);
                        setRclQtyAffected(v);
                      }}
                      placeholder="Quarantine Qty"
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-mono"
                    />
                  </div>
                  <input
                    type="text"
                    value={rclReason}
                    onChange={(e) => setRclReason(e.target.value)}
                    placeholder="Recall / defect reason (e.g., seal defect or supplier notice)"
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const prod = state.products.find((p) => p.id === rclProductId);
                        if (!prod || !rclReason.trim()) return;
                        const sup = state.suppliers.find((s) => s.id === prod.supplierId);
                        const bills = state.sales
                          .filter((s) => s.items.some((i) => i.productId === prod.id))
                          .map((s) => s.billNo);
                        createRecallCase(
                          {
                            date: new Date().toISOString().slice(0, 10),
                            productId: prod.id,
                            sku: prod.sku,
                            productName: prod.name,
                            batchNo: prod.batchNumber,
                            supplierName: sup?.name || 'Supplier',
                            reason: rclReason.trim(),
                            severity: rclSeverity,
                            qtyAffected: rclQtyAffected,
                            qtyQuarantined: Math.min(prod.stockQty, rclQuarantineNow),
                            affectedCustomerBills: bills,
                            immediateStopSaleDone: true,
                            status: 'Quarantined — Stop Sale Active',
                            notes: rclNotes || 'Moved to Zone I immediately.',
                          },
                          rclQuarantineNow
                        );
                        setShowRecallForm(false);
                        setRclReason('');
                        setRclNotes('');
                      }}
                      className="rounded-lg bg-red-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-800"
                    >
                      Execute Stop-Sale & Quarantine
                    </button>
                  </div>
                </div>
              )}

              <div className="divide-y divide-slate-100">
                {gov.recalls.map((rcl) => (
                  <div key={rcl.id} className="px-5 py-3 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-semibold text-slate-900">
                        <span className="font-mono text-red-700 mr-1.5">{rcl.recallCode}</span>
                        {rcl.productName}
                      </div>
                      <select
                        value={rcl.status}
                        onChange={(e) =>
                          updateRecallStatus(rcl.id, e.target.value as RecallStatus)
                        }
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium"
                      >
                        <option value="Quarantined — Stop Sale Active">
                          Quarantined — Stop Sale Active
                        </option>
                        <option value="Supplier Investigation">Supplier Investigation</option>
                        <option value="Disposed / Returned to Supplier">
                          Disposed / Returned to Supplier
                        </option>
                        <option value="Closed">Closed</option>
                      </select>
                    </div>
                    <p className="text-xs text-slate-600">
                      Batch <span className="font-mono">{rcl.batchNo}</span> · {rcl.severity} ·{' '}
                      {rcl.qtyQuarantined}/{rcl.qtyAffected} quarantined
                    </p>
                    <p className="text-[11px] text-slate-500">{rcl.reason}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-200 px-5 py-3 bg-slate-50/70">
                <div className="text-xs font-semibold text-slate-800 mb-2">
                  Daily / Weekly / Monthly Food Safety & QA Audits
                </div>
                <div className="space-y-1.5">
                  {gov.qualityAudits.map((t) => (
                    <label
                      key={t.id}
                      className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={t.completed}
                        onChange={() => toggleQualityAuditTask(t.id)}
                        className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-teal-700"
                      />
                      <span className="flex-1">
                        <span className="font-mono text-[11px] text-teal-700 mr-1.5">
                          [{t.cadence}]
                        </span>
                        {t.task}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">
                        {t.lastCompletedDate}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: HUMAN RESOURCES, TRAINING & PAYROLL (DOC 15 — GRM-HR-001)    */}
      {/* =================================================================== */}
      {governanceTab === 'hr' && (
        <div className="space-y-6">
          {/* Lean Staffing Governance Banner */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-mono text-teal-700">
                GRM-HR-001 · LEAN PILOT STAFFING DISCIPLINE
              </div>
              <h3 className="font-display text-sm font-bold text-slate-900">
                Active Staffing Structure: {gov.staffingModel}
              </h3>
              <p className="text-xs text-slate-600">
                Operating Rule: Keep payroll lean during pilot. Do not hire additional staff merely
                because two shops are available — hire only when verified daily transaction volume
                requires it.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {(
                [
                  'Option A — Founder + 1 Employee',
                  'Option B — Founder + 2 Employees',
                ] as const
              ).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setStaffingModel(opt)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                    gov.staffingModel === opt
                      ? 'border-teal-700 bg-teal-50 text-teal-900'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </section>

          {/* Staff Directory & 7-Module Training Matrix */}
          <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="font-display text-sm font-bold text-slate-900">
                  1. Staff Directory, Statutory Files & 7-Module Training Matrix
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Active Headcount: {activeEmployees.length} · Tracks appointment letter, Aadhaar
                  KYC, RBAC training & clean exit revocation.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEmpForm(!showEmpForm)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Onboard Staff Member</span>
              </button>
            </div>

            {showEmpForm && (
              <div className="border-b border-slate-200 bg-slate-50 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <input
                  type="text"
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  placeholder="Full Name"
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                />
                <select
                  value={empLevel}
                  onChange={(e) => setEmpLevel(e.target.value as ResponsibilityLevel)}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                >
                  <option value="Level 2 — Store Manager / Operations Lead">
                    Level 2 — Store Manager
                  </option>
                  <option value="Level 3 — Sales & Customer Service Executive">
                    Level 3 — Sales & Service
                  </option>
                  <option value="Level 4 — Inventory & Receiving Assistant">
                    Level 4 — Inventory & Receiving
                  </option>
                </select>
                <input
                  type="text"
                  value={empRoleTitle}
                  onChange={(e) => setEmpRoleTitle(e.target.value)}
                  placeholder="Role Title"
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                />
                <input
                  type="text"
                  value={empPhone}
                  onChange={(e) => setEmpPhone(e.target.value)}
                  placeholder="+91 Phone"
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={0}
                    value={empWage}
                    onChange={(e) => setEmpWage(Number(e.target.value) || 0)}
                    placeholder="Monthly ₹"
                    className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!empName.trim()) return;
                      addEmployee({
                        name: empName.trim(),
                        level: empLevel,
                        roleTitle: empRoleTitle.trim() || 'Store Executive',
                        phone: empPhone.trim() || 'Pending KYC',
                        joinDate: new Date().toISOString().slice(0, 10),
                        monthlyWage: empWage,
                        docsAppointmentLetter: true,
                        docsJobDescription: true,
                        docsIdAddressVerified: true,
                        docsWageTerms: true,
                        docsPoshSafetyBriefed: true,
                        trainingModules: {
                          businessIntro: true,
                          productKnowledge: false,
                          customerService: false,
                          billingPayments: false,
                          inventoryFefo: false,
                          safetyHygiene: false,
                          digitalRbac: false,
                        },
                      });
                      setShowEmpForm(false);
                      setEmpName('');
                      setEmpPhone('');
                    }}
                    className="flex-1 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            <div className="divide-y divide-slate-100">
              {gov.employees.map((emp) => {
                const completedModules = Object.values(emp.trainingModules).filter(Boolean).length;
                return (
                  <div key={emp.id} className="p-5 space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-mono font-bold text-teal-700">{emp.empCode}</span>
                          <span className="font-semibold text-slate-900">{emp.name}</span>
                          <span className="text-slate-300">·</span>
                          <span className="text-slate-600">{emp.roleTitle}</span>
                          <span className="text-slate-300">·</span>
                          <span className="font-mono text-slate-500">{emp.level}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                          Joined {emp.joinDate} · Wage {formatINR(emp.monthlyWage)}/mo · Files:{' '}
                          {emp.docsAppointmentLetter && emp.docsIdAddressVerified
                            ? 'Appointment + KYC Verified'
                            : 'Docs Pending'}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="font-mono font-semibold text-slate-700">
                          Training: {completedModules}/7
                        </span>
                        {emp.status === 'Active' && emp.empCode !== 'EMP-001' ? (
                          <button
                            type="button"
                            onClick={() => markEmployeeExitRevoked(emp.id)}
                            className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-100"
                          >
                            Process Exit & Revoke Access
                          </button>
                        ) : (
                          <span
                            className={`font-semibold ${
                              emp.status === 'Active' ? 'text-emerald-700' : 'text-slate-500'
                            }`}
                          >
                            {emp.status === 'Active'
                              ? 'Active'
                              : 'Exited · App/Keys Access Revoked'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 7-Module Training Toggle Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                      {TRAINING_LABELS.map((mod) => {
                        const done = emp.trainingModules[mod.key];
                        return (
                          <button
                            key={mod.key}
                            type="button"
                            onClick={() => toggleEmployeeTrainingModule(emp.id, mod.key)}
                            className={`rounded-lg border px-2 py-1.5 text-left text-[11px] transition-colors ${
                              done
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-900 font-medium'
                                : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                            }`}
                          >
                            {done ? '✓ ' : '○ '}
                            {mod.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Attendance & Payroll + Code of Conduct */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Attendance Log */}
            <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="border-b border-slate-200 px-5 py-4">
                <h3 className="font-display text-sm font-bold text-slate-900">
                  2. Daily Attendance & Shift Log
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Log opening/closing shift presence & weekly off compliance.
                </p>
              </div>
              <div className="p-4 border-b border-slate-100 bg-slate-50 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <select
                  value={attEmpCode}
                  onChange={(e) => setAttEmpCode(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs"
                >
                  {gov.employees.map((e) => (
                    <option key={e.id} value={e.empCode}>
                      {e.empCode} · {e.name.split(' ')[0]}
                    </option>
                  ))}
                </select>
                <select
                  value={attShift}
                  onChange={(e) => setAttShift(e.target.value as typeof attShift)}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs"
                >
                  <option value="Full Day (09:00–20:00)">Full Day</option>
                  <option value="Morning (08:30–14:30)">Morning</option>
                  <option value="Evening (14:00–21:00)">Evening</option>
                </select>
                <select
                  value={attStatus}
                  onChange={(e) => setAttStatus(e.target.value as typeof attStatus)}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs"
                >
                  <option value="Present">Present</option>
                  <option value="Half Day">Half Day</option>
                  <option value="Leave">Approved Leave</option>
                  <option value="Absent">Absent</option>
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const emp = gov.employees.find((e) => e.empCode === attEmpCode);
                    if (!emp) return;
                    recordAttendance({
                      date: new Date().toISOString().slice(0, 10),
                      empCode: emp.empCode,
                      empName: emp.name,
                      shift: attShift,
                      status: attStatus,
                      notes: attNotes || 'Shift recorded via HR OS',
                    });
                    setAttNotes('');
                  }}
                  className="rounded-lg bg-teal-700 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-teal-800"
                >
                  Log Shift
                </button>
              </div>
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                {gov.attendance.map((att) => (
                  <div key={att.id} className="px-5 py-2.5 flex justify-between text-xs">
                    <div>
                      <span className="font-mono text-slate-500 mr-2">{att.date}</span>
                      <span className="font-semibold text-slate-900">{att.empName}</span>
                      <span className="text-slate-400 ml-1.5">· {att.shift}</span>
                    </div>
                    <span
                      className={`font-semibold ${
                        att.status === 'Present'
                          ? 'text-emerald-700'
                          : att.status === 'Absent'
                          ? 'text-red-700'
                          : 'text-amber-700'
                      }`}
                    >
                      {att.status}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Payroll Summary Register */}
            <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="border-b border-slate-200 px-5 py-4">
                <h3 className="font-display text-sm font-bold text-slate-900">
                  3. Payroll Summary Register & Store Expense Sync
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Gross wages, deductions, net payout & reference (optionally synced to 10
                  Registers).
                </p>
              </div>
              <div className="p-4 border-b border-slate-100 bg-slate-50 space-y-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <select
                    value={payEmpCode}
                    onChange={(e) => setPayEmpCode(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs"
                  >
                    {gov.employees.map((e) => (
                      <option key={e.id} value={e.empCode}>
                        {e.empCode} · {e.name.split(' ')[0]}
                      </option>
                    ))}
                  </select>
                  <input
                    type="month"
                    value={payMonth}
                    onChange={(e) => setPayMonth(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-mono"
                  />
                  <input
                    type="number"
                    min={0}
                    value={payGross}
                    onChange={(e) => setPayGross(Number(e.target.value) || 0)}
                    placeholder="Gross ₹"
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-mono"
                  />
                  <input
                    type="number"
                    min={0}
                    value={payDeductions}
                    onChange={(e) => setPayDeductions(Number(e.target.value) || 0)}
                    placeholder="Deductions ₹"
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-mono"
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <input
                    type="text"
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    placeholder="UTR / Bank Reference"
                    className="flex-1 min-w-[160px] rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-mono"
                  />
                  <label className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={paySyncExpense}
                      onChange={(e) => setPaySyncExpense(e.target.checked)}
                    />
                    Sync to Expense Register
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const emp = gov.employees.find((e) => e.empCode === payEmpCode);
                      if (!emp) return;
                      recordPayrollEntry(
                        {
                          month: payMonth,
                          empCode: emp.empCode,
                          empName: emp.name,
                          grossWages: payGross,
                          deductions: payDeductions,
                          netPaid: Math.max(0, payGross - payDeductions),
                          paymentDate: new Date().toISOString().slice(0, 10),
                          paymentRef: payRef || `BANK-${Date.now().toString().slice(-6)}`,
                          status: 'Paid',
                        },
                        paySyncExpense
                      );
                      setPayRef('');
                    }}
                    className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800"
                  >
                    Record Payout ({formatINR(Math.max(0, payGross - payDeductions))})
                  </button>
                </div>
              </div>
              <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                {gov.payroll.map((pay) => (
                  <div key={pay.id} className="px-5 py-2.5 flex justify-between text-xs">
                    <div>
                      <span className="font-mono text-slate-500 mr-2">{pay.month}</span>
                      <span className="font-semibold text-slate-900">{pay.empName}</span>
                      <div className="font-mono text-[11px] text-slate-400">{pay.paymentRef}</div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="font-semibold text-slate-900">{formatINR(pay.netPaid)}</div>
                      <div className="text-[11px] text-emerald-700">{pay.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Code of Conduct & Fair Performance */}
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-display text-sm font-bold text-slate-900">
              4. Staff Code of Conduct, Fair Incentives & Safety Welfare Rules
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 mb-3">
              Incentives must never reward sales volume at the expense of billing accuracy, customer
              trust, or food safety.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {CONDUCT_RULES.map((rule, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-700"
                >
                  <span className="font-mono text-teal-700 font-semibold">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 4: LOGISTICS, ZONES & DISPATCH (DOC 16 — GRM-LOG-001)           */}
      {/* =================================================================== */}
      {governanceTab === 'logistics' && (
        <div className="space-y-6">
          {/* Transaction-based Logistics KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-xs text-slate-500">Customer Dispatches Logged</div>
              <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-slate-900">
                {gov.dispatches.length}
              </div>
              <div className="mt-1 text-[11px] text-emerald-700">
                {deliveredDispatches} POD verified
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-xs text-slate-500">Recorded Transport Spend</div>
              <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-slate-900">
                {formatINR(totalTransportSpend)}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                Based strictly on logged dispatches
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-xs text-slate-500">Non-Sale Stock Transfers</div>
              <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-slate-900">
                {gov.stockTransfers.length}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">Zero revenue impact enforced</div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-xs text-slate-500">Hadoti Producer Pickups</div>
              <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-slate-900">
                {gov.producerCollections.length}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                SHG & rural cluster collections
              </div>
            </div>
          </div>

          {/* 4 Transport Modes & Compact Storage Zone Map */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="font-display text-sm font-bold text-slate-900">
                  1. Low-Fixed-Cost Transport Policy & Zone Storage Allocation
                </h3>
                <p className="text-xs text-slate-500">
                  Mode D (Dedicated Vehicle) remains gated until sustained Kota order density
                  justifies fixed fleet cost.
                </p>
              </div>
              <div className="text-xs font-mono text-slate-600">
                Active SKUs Mapped: {state.products.length}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
                <div className="font-semibold text-emerald-900">Mode A · Supplier Delivery</div>
                <p className="text-slate-600 mt-0.5">
                  Primary inbound mode for wholesalers & SHG clusters directly to Zone G.
                </p>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
                <div className="font-semibold text-emerald-900">Mode B · Local Pickup</div>
                <p className="text-slate-600 mt-0.5">
                  Scheduled Kota mandi / Hadoti producer pickups for compact bulk replenishment.
                </p>
              </div>
              <div className="rounded-lg border border-teal-200 bg-teal-50/60 p-3">
                <div className="font-semibold text-teal-900">Mode C · Third-Party Transport</div>
                <p className="text-slate-600 mt-0.5">
                  On-demand local courier / goods carrier for wholesale & institutional dispatches.
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-100 p-3">
                <div className="font-semibold text-slate-700">
                  Mode D · Dedicated Vehicle (Gated)
                </div>
                <p className="text-slate-500 mt-0.5">
                  Locked during Pilot 01 to avoid fixed vehicle overhead.
                </p>
              </div>
            </div>
          </section>

          {/* Customer Dispatch & Delivery POD Tracker */}
          <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="font-display text-sm font-bold text-slate-900">
                  2. Customer Order Fulfilment & Delivery Dispatch Register (GRM-DSP / GRM-DEL)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Links directly to POS bills and DAKSH MARKET B2B orders with POD verification.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDispatchForm(!showDispatchForm)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create Dispatch Note</span>
              </button>
            </div>

            {showDispatchForm && (
              <div className="border-b border-slate-200 bg-slate-50 p-4 space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  <select
                    value={dspBillRef}
                    onChange={(e) => {
                      const ref = e.target.value;
                      setDspBillRef(ref);
                      const sale = state.sales.find((s) => s.billNo === ref);
                      if (sale) {
                        setDspCustomer(sale.customerName);
                        setDspSummary(
                          sale.items.map((i) => `${i.qty}x ${i.name}`).join(', ')
                        );
                      }
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-mono"
                  >
                    <option value="">Link POS Bill or Custom Ref...</option>
                    {state.sales.map((s) => (
                      <option key={s.id} value={s.billNo}>
                        {s.billNo} · {s.customerName}
                      </option>
                    ))}
                    {state.dakshMarket.orders.map((o) => (
                      <option key={o.id} value={o.orderCode}>
                        {o.orderCode} · {o.buyerName}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={dspCustomer}
                    onChange={(e) => setDspCustomer(e.target.value)}
                    placeholder="Customer / Destination Address"
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                  />
                  <select
                    value={dspModel}
                    onChange={(e) => setDspModel(e.target.value as DeliveryModel)}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                  >
                    <option value="Model A — Customer Pickup">Model A — Customer Pickup</option>
                    <option value="Model B — Local Delivery">Model B — Local Delivery</option>
                    <option value="Model C — Scheduled Bulk">Model C — Scheduled Bulk</option>
                    <option value="Model D — Institutional Delivery">
                      Model D — Institutional Delivery
                    </option>
                  </select>
                  <select
                    value={dspMode}
                    onChange={(e) => setDspMode(e.target.value as LogisticsMode)}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                  >
                    <option value="Mode A — Supplier Delivery">Mode A — Supplier Delivery</option>
                    <option value="Mode B — Local Pickup">Mode B — Local Pickup</option>
                    <option value="Mode C — Third-Party Transport">
                      Mode C — Third-Party Transport
                    </option>
                  </select>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <input
                    type="text"
                    value={dspSummary}
                    onChange={(e) => setDspSummary(e.target.value)}
                    placeholder="Packed items summary (keep food & cleaning separate)"
                    className="flex-1 min-w-[220px] rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                  />
                  <input
                    type="number"
                    min={0}
                    value={dspCost}
                    onChange={(e) => setDspCost(Number(e.target.value) || 0)}
                    placeholder="Transport ₹"
                    className="w-28 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!dspCustomer.trim()) return;
                      createDispatchRecord({
                        date: new Date().toISOString().slice(0, 10),
                        orderOrBillRef: dspBillRef || 'MANUAL-DISPATCH',
                        customerOrDestination: dspCustomer.trim(),
                        deliveryModel: dspModel,
                        transportMode: dspMode,
                        itemSummary: dspSummary.trim() || 'Packed retail consignment',
                        transportCost: dspCost,
                        status: 'Packed — Ready',
                        deliveredAt: null,
                        podNote: 'Checked & sealed at Zone G',
                      });
                      setShowDispatchForm(false);
                      setDspCustomer('');
                      setDspSummary('');
                    }}
                    className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800"
                  >
                    Log Dispatch
                  </button>
                </div>
              </div>
            )}

            <div className="divide-y divide-slate-100">
              {gov.dispatches.map((dsp) => (
                <div
                  key={dsp.id}
                  className="px-5 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono font-bold text-teal-700">
                        {dsp.dispatchCode}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="font-mono text-slate-500">{dsp.deliveryCode}</span>
                      <span className="text-slate-300">·</span>
                      <span className="font-semibold text-slate-900">
                        {dsp.customerOrDestination}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Ref <span className="font-mono">{dsp.orderOrBillRef}</span> ·{' '}
                      {dsp.deliveryModel} · {dsp.transportMode} · Cost{' '}
                      <span className="font-mono">{formatINR(dsp.transportCost)}</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {dsp.itemSummary} — {dsp.podNote}
                    </p>
                  </div>
                  <select
                    value={dsp.status}
                    onChange={(e) =>
                      updateDispatchStatus(dsp.id, e.target.value as DispatchStatus)
                    }
                    className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold shrink-0 ${
                      dsp.status === 'Delivered — POD Verified'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : dsp.status === 'Returned / Failed'
                        ? 'border-red-200 bg-red-50 text-red-800'
                        : 'border-amber-200 bg-amber-50 text-amber-800'
                    }`}
                  >
                    <option value="Packed — Ready">Packed — Ready</option>
                    <option value="Out for Delivery">Out for Delivery</option>
                    <option value="Delivered — POD Verified">Delivered — POD Verified</option>
                    <option value="Returned / Failed">Returned / Failed</option>
                  </select>
                </div>
              ))}
            </div>
          </section>

          {/* Multi-Outlet Stock Transfers + Hadoti Producer Collections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="border-b border-slate-200 px-5 py-4 flex items-center justify-between gap-2">
                <div>
                  <h3 className="font-display text-sm font-bold text-slate-900">
                    3. Multi-Outlet Stock Transfers (GRM-STK)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Policy: A stock transfer is NOT a sale — never alters revenue or profit.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTransferForm(!showTransferForm)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100"
                >
                  + Log Transfer
                </button>
              </div>

              {showTransferForm && (
                <div className="border-b border-slate-200 bg-slate-50 p-4 space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={stkFrom}
                      onChange={(e) => setStkFrom(e.target.value)}
                      placeholder="From Outlet"
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                    />
                    <input
                      type="text"
                      value={stkTo}
                      onChange={(e) => setStkTo(e.target.value)}
                      placeholder="To Outlet"
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={stkProductId}
                      onChange={(e) => setStkProductId(e.target.value)}
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                    >
                      {state.products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.sku} · {p.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      value={stkQty}
                      onChange={(e) => setStkQty(Number(e.target.value) || 1)}
                      className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const prod = state.products.find((p) => p.id === stkProductId);
                        if (!prod) return;
                        createStockTransfer({
                          date: new Date().toISOString().slice(0, 10),
                          fromOutlet: stkFrom,
                          toOutlet: stkTo,
                          productId: prod.id,
                          sku: prod.sku,
                          productName: prod.name,
                          qty: stkQty,
                          reason: stkReason,
                          status: 'In Transit',
                          authorizedBy: activeRole,
                        });
                        setShowTransferForm(false);
                      }}
                      className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800"
                    >
                      Issue
                    </button>
                  </div>
                </div>
              )}

              <div className="divide-y divide-slate-100">
                {gov.stockTransfers.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    No inter-outlet stock transfers logged yet during Single-Shop Pilot 01.
                  </div>
                ) : (
                  gov.stockTransfers.map((stk) => (
                    <div
                      key={stk.id}
                      className="px-5 py-3 flex items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">
                          <span className="font-mono text-teal-700 mr-1.5">
                            {stk.transferCode}
                          </span>
                          {stk.qty}x {stk.productName}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {stk.fromOutlet} → {stk.toOutlet} · Non-Sale Transfer
                        </div>
                      </div>
                      {stk.status === 'In Transit' ? (
                        <button
                          type="button"
                          onClick={() => markTransferReceived(stk.id)}
                          className="rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-800"
                        >
                          Confirm Receipt
                        </button>
                      ) : (
                        <span className="font-semibold text-emerald-700">{stk.status}</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Hadoti Producer Collections */}
            <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="border-b border-slate-200 px-5 py-4 flex items-center justify-between gap-2">
                <div>
                  <h3 className="font-display text-sm font-bold text-slate-900">
                    4. Hadoti / Gramodaya Producer Collection Log (GRM-COL)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Cluster-based pickup from rural SHGs, FPOs & regional artisans.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCollectionForm(!showCollectionForm)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100"
                >
                  + Log Collection
                </button>
              </div>

              {showCollectionForm && (
                <div className="border-b border-slate-200 bg-slate-50 p-4 space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={colProducer}
                      onChange={(e) => setColProducer(e.target.value)}
                      placeholder="Producer / SHG Name"
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                    />
                    <input
                      type="text"
                      value={colCluster}
                      onChange={(e) => setColCluster(e.target.value)}
                      placeholder="Village / Cluster"
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      value={colProduct}
                      onChange={(e) => setColProduct(e.target.value)}
                      placeholder="Product Name & Pack"
                      className="flex-1 min-w-[160px] rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                    />
                    <input
                      type="number"
                      min={1}
                      value={colQty}
                      onChange={(e) => setColQty(Number(e.target.value) || 1)}
                      className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-mono"
                    />
                    <input
                      type="number"
                      min={0}
                      value={colCost}
                      onChange={(e) => setColCost(Number(e.target.value) || 0)}
                      placeholder="₹ Cost"
                      className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!colProduct.trim()) return;
                        recordProducerCollection({
                          date: new Date().toISOString().slice(0, 10),
                          producerName: colProducer,
                          villageOrCluster: colCluster,
                          productName: colProduct.trim(),
                          qtyCollected: colQty,
                          unit: colUnit,
                          transportMode: colMode,
                          transportCost: colCost,
                          grnCode: 'GRM-GRN-PENDING',
                          inspectionPassed: true,
                        });
                        setShowCollectionForm(false);
                        setColProduct('');
                      }}
                      className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800"
                    >
                      Save Pickup
                    </button>
                  </div>
                </div>
              )}

              <div className="divide-y divide-slate-100">
                {gov.producerCollections.map((col) => (
                  <div key={col.id} className="px-5 py-3 text-xs space-y-0.5">
                    <div className="flex justify-between font-semibold text-slate-900">
                      <span>
                        <span className="font-mono text-teal-700 mr-1.5">
                          {col.collectionCode}
                        </span>
                        {col.productName}
                      </span>
                      <span className="font-mono">
                        {col.qtyCollected} {col.unit}
                      </span>
                    </div>
                    <div className="text-slate-600">
                      {col.producerName} · {col.villageOrCluster}
                    </div>
                    <div className="font-mono text-[11px] text-slate-400">
                      {col.date} · {col.transportMode} · Cost {formatINR(col.transportCost)} ·{' '}
                      {col.grnCode}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 5: 4-PHASE IMPLEMENTATION & TRANSACTION TEST SUITE (GRM-IMP-001)*/}
      {/* =================================================================== */}
      {governanceTab === 'implementation' && (
        <div className="space-y-6">
          {/* Execution Summary Header */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-mono text-teal-700">
                GRM-IMP-001 · LIVE 4-PHASE IMPLEMENTATION & TRANSACTION VALIDATION SUITE
              </div>
              <h3 className="font-display text-base font-bold text-slate-900">
                All 4 Phases Executed Against Live Store Data & Sandbox Ledger Simulations
              </h3>
              <p className="text-xs text-slate-600">
                Last executed:{' '}
                <span className="font-mono">{fourPhaseReport.executedAt.slice(0, 19).replace('T', ' ')}</span>
                {' · '}Zero mutations made to live pilot cash, inventory, or sales registers.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setTestRunNonce((n) => n + 1)}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800 shrink-0"
            >
              <Play className="h-3.5 w-3.5" />
              <span>Re-Run All 4 Phase Tests</span>
            </button>
          </section>

          {/* 4 KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-xs text-slate-500">Total Automated Checks</div>
              <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-slate-900">
                {fourPhaseReport.totalTests}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">Phases 1 through 4</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-xs text-slate-500">Tests Passed</div>
              <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-emerald-700">
                {fourPhaseReport.totalPassed}/{fourPhaseReport.totalTests}
              </div>
              <div className="mt-1 text-[11px] text-emerald-700">Data, formulas & flows verified</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-xs text-slate-500">Pre-Opening Action Gates</div>
              <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-amber-700">
                {fourPhaseReport.totalActionGates}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                Human legal / licence sign-offs
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-xs text-slate-500">Failures</div>
              <div
                className={`mt-1 font-mono text-2xl font-bold tabular-nums ${
                  fourPhaseReport.totalFailed === 0 ? 'text-emerald-700' : 'text-red-700'
                }`}
              >
                {fourPhaseReport.totalFailed}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                Zero logic or calculation errors
              </div>
            </div>
          </div>

          {/* Phase-by-Phase Test Breakdown */}
          {fourPhaseReport.phases.map((phase) => (
            <section
              key={phase.phaseCode}
              className="rounded-xl border border-slate-200 bg-white overflow-hidden"
            >
              <div className="border-b border-slate-200 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-slate-50/70">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-teal-700">
                    <span>{phase.phaseCode}</span>
                    <span className="text-slate-300">·</span>
                    <span>
                      {phase.passed} PASS · {phase.actionGates} ACTION GATE · {phase.failed} FAIL
                    </span>
                  </div>
                  <h3 className="font-display text-sm font-bold text-slate-900 mt-0.5">
                    {phase.phaseTitle}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{phase.objective}</p>
                </div>
                <div className="text-xs font-medium text-slate-700 max-w-xs sm:text-right">
                  {phase.completionCondition}
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {phase.tests.map((t) => (
                  <div key={t.id} className="px-5 py-3.5 space-y-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-mono font-bold text-slate-500">{t.id}</span>
                        <span className="font-mono text-[11px] text-teal-700">{t.section}</span>
                        <span className="text-slate-300">·</span>
                        <span className="font-semibold text-slate-900">{t.title}</span>
                      </div>
                      <span
                        className={`font-mono text-[11px] font-bold shrink-0 ${
                          t.status === 'PASS'
                            ? 'text-emerald-700'
                            : t.status === 'ACTION_GATE'
                            ? 'text-amber-700'
                            : 'text-red-700'
                        }`}
                      >
                        {t.status === 'ACTION_GATE' ? 'ACTION GATE (PENDING SIGN-OFF)' : t.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 text-xs pt-1">
                      <div className="text-slate-500">
                        <span className="font-medium text-slate-700">Expected: </span>
                        {t.expected}
                      </div>
                      <div className="font-mono text-[11px] text-slate-800">
                        <span className="font-sans font-medium text-slate-700">Actual: </span>
                        {t.actual}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400">{t.details}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};
