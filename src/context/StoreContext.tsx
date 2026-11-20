import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { GramosStoreState, INITIAL_STORE_STATE, PRODUCT_UNIVERSE_INDUSTRIES } from '../data/seedData';
import {
  AttendanceEntry,
  AuditLogEntry,
  B2bOrder,
  B2bOrderStage,
  BoqPackage,
  BuyerRequirement,
  CashReconciliation,
  CategoryComplianceRule,
  CommercialDecisionOutcome,
  CommercialRelationship,
  CommissionEntry,
  CommissionStatus,
  ContractManufacturerChecklist,
  CreditAgeingStatus,
  Customer,
  CustomerComplaint,
  CustomerEnquiry,
  DakshWorkspaceTab,
  DispatchRecord,
  DispatchStatus,
  DistributionPhaseGate,
  EmployeeRecord,
  EmployeeTrainingMatrix,
  EntityVerificationStatus,
  ExpenseRecord,
  GovernanceTab,
  GramosfuelIndustryGroup,
  GramosfuelLaunchStage,
  GramosfuelWorkspaceTab,
  GrnInspectionRecord,
  LibraryBatchRoadmapItem,
  LibraryBrandTrack,
  LibraryComplianceGate,
  LibraryEvaluationScorecard,
  LibraryWorkflowStatus,
  LibraryWorkspaceTab,
  NavSection,
  OrganizationRoleType,
  OutletConfig,
  OwnershipType,
  PayrollEntry,
  ProducerCollectionRecord,
  Product,
  ProductApprovalDecision,
  ProductApprovalRecord,
  ProductCandidate,
  ProductLibraryRecord,
  ProductQualitySpec,
  ProductUnitEconomics,
  ProductUniverseIndustry,
  ProjectProcurement,
  RecallRecord,
  RecallStatus,
  RequirementLineItem,
  Rfq,
  RfqQuotation,
  SaleTransaction,
  SampleEvaluation,
  StaffRole,
  StaffingModelOption,
  StockTransferRecord,
  Supplier,
  SupplierCreditEntry,
  SupplyMatch,
  UniversalOrganization,
  VendorListing,
  VerificationStatus,
} from '../types/gramos';
import { daysUntil } from '../utils/formatters';

const STORAGE_KEY = 'gramos_mart_apna_bazar_v1';
const SIDEBAR_KEY = 'gramos_mart_sidebar_collapsed_v1';

export interface ComputedMetrics {
  grossSales: number;
  returnsTotal: number;
  netSales: number;
  cogsTotal: number;
  grossProfit: number;
  grossMarginPct: number;
  operatingExpenses: number;
  netOperatingProfit: number;
  reserveAmount: number;
  distributableProfit: number;
  propertyOwnerShare: number;
  founderRetainedShare: number;
  hasOverdueSupplierLiabilities: boolean;
  selfFundedInventoryValue: number;
  supplierCreditInventoryValue: number;
  ownedAndCreditInventoryValue: number;
  consignmentStockRetailValue: number;
  supplierCreditOutstanding: number;
  overdueCreditCount: number;
  consignmentPayable: number;
  availableCash: number;
  bankBalance: number;
  workingCapital: number;
  salesByChannel: Record<string, number>;
  channelGrossProfit: Record<string, number>;
}

interface StoreContextValue {
  state: GramosStoreState;
  activeNav: NavSection;
  setActiveNav: (nav: NavSection) => void;
  activeRole: StaffRole;
  setActiveRole: (role: StaffRole) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (val: boolean) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (val: boolean) => void;
  metrics: ComputedMetrics;
  getCreditStatus: (entry: SupplierCreditEntry) => CreditAgeingStatus;
  recordSale: (sale: Omit<SaleTransaction, 'id' | 'billNo' | 'timestamp'>) => SaleTransaction;
  processReturn: (saleId: string) => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
  receiveStock: (params: {
    productId: string;
    qty: number;
    batchNumber: string;
    expiryDate: string | null;
    invoiceRef: string;
    isCreditPurchase: boolean;
    creditDays?: number;
  }) => void;
  quarantineStock: (productId: string, qty: number, type: 'Damage Quarantine' | 'Expiry Quarantine', reason: string) => void;
  adjustStock: (productId: string, qtyDelta: number, reason: string) => void;
  addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  paySupplierCredit: (creditId: string, amount: number, mode: 'Bank / UPI' | 'Cash') => void;
  settleConsignment: (consignmentId: string, unitsToSettle: number, paymentRef: string) => void;
  addExpense: (expense: Omit<ExpenseRecord, 'id'>) => void;
  recordCashReconciliation: (rec: Omit<CashReconciliation, 'id' | 'difference'>) => void;
  addCustomer: (customer: Omit<Customer, 'id' | 'customerCode' | 'totalSpent' | 'visitCount' | 'lastVisit'>) => void;
  addEnquiry: (enquiry: Omit<CustomerEnquiry, 'id'>) => void;
  updateEnquiryStatus: (id: string, status: CustomerEnquiry['status']) => void;
  addComplaint: (complaint: Omit<CustomerComplaint, 'id'>) => void;
  resolveComplaint: (id: string, actionTaken: string) => void;
  toggleSopItem: (id: string) => void;
  togglePilotMilestone: (id: string) => void;
  updateOutletConfig: (partial: Partial<OutletConfig>) => void;
  resetStore: () => void;
  // DAKSH MARKET synchronized actions
  dakshTab: DakshWorkspaceTab;
  setDakshTab: (tab: DakshWorkspaceTab) => void;
  addUniversalIndustry: (name: string) => void;
  createOrganization: (input: {
    name: string;
    city: string;
    state: string;
    contactPerson: string;
    phone: string;
    email: string;
    gstOrLicense: string;
    roles: OrganizationRoleType[];
    proposedCategories: string[];
    notes?: string;
  }) => UniversalOrganization;
  updateOrganizationStatus: (orgId: string, status: VerificationStatus) => void;
  createRelationship: (rel: Omit<CommercialRelationship, 'id'>) => void;
  submitVendorListing: (
    listing: Omit<VendorListing, 'id' | 'listingCode' | 'sourceTimestamp' | 'lastVerifiedAt'>
  ) => VendorListing;
  updateListingStatus: (
    listingId: string,
    status: VendorListing['status'],
    syncToRetail?: boolean
  ) => void;
  createRequirement: (input: {
    buyerOrgId: string;
    title: string;
    rawPrompt: string;
    deliveryLocation: string;
    targetDeliveryDate: string | null;
    budgetCeiling: number | null;
    installationNeeded: boolean | null;
    missingInfoFlags: string[];
    items: Omit<RequirementLineItem, 'id'>[];
    projectId?: string;
    sourceEnquiryId?: string;
  }) => BuyerRequirement;
  clarifyRequirement: (
    reqId: string,
    updates: {
      deliveryLocation?: string;
      targetDeliveryDate?: string | null;
      budgetCeiling?: number | null;
      installationNeeded?: boolean | null;
    }
  ) => void;
  runSupplyMatching: (reqId: string) => void;
  createRfqFromRequirement: (params: {
    requirementId: string;
    invitedVendorIds: string[];
    dueDate: string;
    sellerId?: string;
  }) => Rfq | null;
  submitQuotation: (
    quote: Omit<RfqQuotation, 'id' | 'quoteCode' | 'createdAt' | 'humanApprovedAt' | 'status'>
  ) => RfqQuotation;
  awardQuotationToOrder: (quotationId: string) => B2bOrder | null;
  advanceB2bOrderStage: (
    orderId: string,
    stage: B2bOrderStage,
    referenceNote: string,
    syncToGramosStock?: boolean
  ) => void;
  updateCommissionStatus: (
    commissionId: string,
    status: CommissionStatus,
    paymentRef?: string
  ) => void;
  createProject: (input: {
    name: string;
    clientOrgId: string;
    location: string;
    totalBudget: number;
    targetLaunchDate: string;
    packages: Omit<BoqPackage, 'id'>[];
  }) => ProjectProcurement;
  updateBoqPackage: (projectId: string, packageId: string, partial: Partial<BoqPackage>) => void;
  convertEnquiryToRequirement: (enquiryId: string) => void;
  // GRAMOSFUEL Brand & Product Sourcing OS (DKS-P04-GF)
  gramosfuelTab: GramosfuelWorkspaceTab;
  setGramosfuelTab: (tab: GramosfuelWorkspaceTab) => void;
  createProductCandidate: (input: {
    name: string;
    industryGroup: GramosfuelIndustryGroup;
    category: string;
    unitSize: string;
    customerProblem: string;
    competitorBenchmark: string;
    targetPriceBand: string;
    sourcingModel: ProductCandidate['sourcingModel'];
    linkedSupplierId?: string;
    sourceEnquiryId?: string;
  }) => ProductCandidate;
  advanceCandidateStage: (candidateId: string, stage: GramosfuelLaunchStage) => void;
  recordSampleEvaluation: (
    sample: Omit<SampleEvaluation, 'id' | 'sampleCode'>
  ) => SampleEvaluation;
  updateCandidateEconomics: (
    candidateId: string,
    economics: Partial<ProductUnitEconomics>
  ) => void;
  updateCandidateSpec: (candidateId: string, spec: Partial<ProductQualitySpec>) => void;
  linkCandidateSupplier: (candidateId: string, supplierId: string, dakshVendorId?: string) => void;
  sendCandidateToDakshRfq: (candidateId: string) => void;
  launchCandidateToPilotInventory: (candidateId: string) => Product | null;
  decideCandidateCommercial: (
    candidateId: string,
    outcome: CommercialDecisionOutcome,
    notes: string
  ) => void;
  convertEnquiryToGramosfuelIdea: (enquiryId: string) => void;
  toggleManufacturerCheckField: (
    checkId: string,
    field: keyof Omit<ContractManufacturerChecklist, 'id' | 'supplierId' | 'supplierName' | 'dakshVendorId' | 'notes'>
  ) => void;
  toggleGfDocumentCheck: (docId: string) => void;
  updateDistributionPhaseStatus: (
    phaseId: string,
    status: DistributionPhaseGate['status']
  ) => void;
  // Enterprise Governance OS (Docs 13–16: Legal, QA, HR & Logistics)
  governanceTab: GovernanceTab;
  setGovernanceTab: (tab: GovernanceTab) => void;
  updateEntityVerificationStatus: (itemId: string, status: EntityVerificationStatus) => void;
  toggleLegalChecklistItem: (itemId: string) => void;
  toggleShopClauseConfirmed: (clauseId: string) => void;
  updateCategoryComplianceStatus: (
    categoryId: string,
    status: CategoryComplianceRule['status']
  ) => void;
  toggleLegalFolderReady: (folderId: string) => void;
  recordProductApproval: (
    approval: Omit<ProductApprovalRecord, 'id' | 'reviewedDate'>
  ) => void;
  recordGrnInspection: (
    inspection: Omit<GrnInspectionRecord, 'id' | 'grnCode'>
  ) => GrnInspectionRecord;
  createRecallCase: (
    recall: Omit<RecallRecord, 'id' | 'recallCode'>,
    quarantineNowQty?: number
  ) => RecallRecord;
  updateRecallStatus: (recallId: string, status: RecallStatus) => void;
  toggleQualityAuditTask: (taskId: string) => void;
  setStaffingModel: (model: StaffingModelOption) => void;
  addEmployee: (
    emp: Omit<EmployeeRecord, 'id' | 'empCode' | 'status' | 'exitAccessRevoked'>
  ) => EmployeeRecord;
  toggleEmployeeTrainingModule: (
    empId: string,
    moduleKey: keyof EmployeeTrainingMatrix
  ) => void;
  markEmployeeExitRevoked: (empId: string) => void;
  recordAttendance: (entry: Omit<AttendanceEntry, 'id'>) => void;
  recordPayrollEntry: (
    entry: Omit<PayrollEntry, 'id'>,
    syncToExpenses?: boolean
  ) => void;
  createDispatchRecord: (
    dispatch: Omit<DispatchRecord, 'id' | 'dispatchCode' | 'deliveryCode'>
  ) => DispatchRecord;
  updateDispatchStatus: (
    dispatchId: string,
    status: DispatchStatus,
    podNote?: string
  ) => void;
  createStockTransfer: (
    transfer: Omit<StockTransferRecord, 'id' | 'transferCode'>
  ) => StockTransferRecord;
  markTransferReceived: (transferId: string) => void;
  recordProducerCollection: (
    collection: Omit<ProducerCollectionRecord, 'id' | 'collectionCode'>
  ) => ProducerCollectionRecord;
  // GRAMOS Universal Product Library (GRM-PL-001)
  libraryTab: LibraryWorkspaceTab;
  setLibraryTab: (tab: LibraryWorkspaceTab) => void;
  addLibraryProduct: (input: {
    productName: string;
    variantOrPackSize: string;
    industry: ProductUniverseIndustry;
    category: string;
    subcategory: string;
    batchCode: string;
    description: string;
    marketRelevance: string;
    brandTrack: LibraryBrandTrack;
    sourcingOptions: string[];
    estimatedCostRange: string;
    targetSellingPriceRange: string;
    shelfLifeAndStorage: string;
    regulatoryRequirements: string;
  }) => ProductLibraryRecord;
  updateLibraryStatus: (
    libraryId: string,
    status: LibraryWorkflowStatus,
    rejectionReason?: string
  ) => { ok: boolean; error?: string };
  updateLibraryQuotationAndTesting: (
    libraryId: string,
    partial: {
      linkedSupplierId?: string;
      linkedSupplierName?: string;
      actualQuotedLandedCost?: number | null;
      actualProposedSellingPrice?: number | null;
      actualMrp?: number | null;
      quotationSourceRef?: string;
      sampleTestingNotes?: string;
      testingEvidenceLogged?: boolean;
      complianceGate?: Partial<LibraryComplianceGate>;
    }
  ) => void;
  updateLibraryScorecard: (
    libraryId: string,
    scorecard: Partial<LibraryEvaluationScorecard>
  ) => void;
  promoteLibraryToCommercialCatalogue: (params: {
    libraryId: string;
    ownershipType: OwnershipType;
    zone: Product['zone'];
    initialStockQty: number;
    gstPercent: number;
    batchNumber?: string;
    expiryDate?: string | null;
  }) => { ok: boolean; product?: Product; error?: string };
  sendLibraryToDakshMarket: (libraryId: string) => void;
  sendLibraryToGramosfuel: (libraryId: string) => void;
  updateBatchStatus: (batchId: string, status: LibraryBatchRoadmapItem['status']) => void;
  // Batch 01 Decision Tracker (GRM-PL-B01)
  toggleBatch01Candidate: (candidateId: string) => void;
  selectAllBatch01Candidates: (selectAll: boolean) => void;
  selectBatch01PriorityFive: () => void;
  prepareBatch01ResearchCards: () => { createdCount: number; firstRecordId: string | null };
  // Batch 02 Decision Tracker (GRM-PL-B02)
  toggleBatch02Candidate: (candidateId: string) => void;
  selectAllBatch02Candidates: (selectAll: boolean) => void;
  selectBatch02PriorityTen: () => void;
  prepareBatch02ResearchCards: () => { createdCount: number; firstRecordId: string | null };
  // Batch 03 Decision Tracker (GRM-PL-B03)
  toggleBatch03Candidate: (candidateId: string) => void;
  selectAllBatch03Candidates: (selectAll: boolean) => void;
  selectBatch03PriorityEight: () => void;
  prepareBatch03ResearchCards: () => { createdCount: number; firstRecordId: string | null };
  // Batch 04 Decision Tracker (GRM-PL-B04)
  toggleBatch04Candidate: (candidateId: string) => void;
  selectAllBatch04Candidates: (selectAll: boolean) => void;
  selectBatch04PriorityEight: () => void;
  prepareBatch04ResearchCards: () => { createdCount: number; firstRecordId: string | null };
  // Batch 05 Decision Tracker (GRM-PL-B05)
  toggleBatch05Candidate: (candidateId: string) => void;
  selectAllBatch05Candidates: (selectAll: boolean) => void;
  selectBatch05PriorityTen: () => void;
  prepareBatch05ResearchCards: () => { createdCount: number; firstRecordId: string | null };
  createVariantResearchCard: (
    sourceLibraryId: string,
    variantPackSize: string
  ) => ProductLibraryRecord | null;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GramosStoreState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<GramosStoreState>;
        return {
          ...INITIAL_STORE_STATE,
          ...parsed,
          outletConfig: {
            ...INITIAL_STORE_STATE.outletConfig,
            ...(parsed.outletConfig || {}),
          },
          dakshMarket: {
            ...INITIAL_STORE_STATE.dakshMarket,
            ...(parsed.dakshMarket || {}),
          },
          gramosfuel: {
            ...INITIAL_STORE_STATE.gramosfuel,
            ...(parsed.gramosfuel || {}),
          },
          governance: {
            ...INITIAL_STORE_STATE.governance,
            ...(parsed.governance || {}),
          },
          productLibrary: {
            ...INITIAL_STORE_STATE.productLibrary,
            ...(parsed.productLibrary || {}),
            batch01Candidates:
              parsed.productLibrary?.batch01Candidates &&
              parsed.productLibrary.batch01Candidates.length === 50
                ? parsed.productLibrary.batch01Candidates
                : INITIAL_STORE_STATE.productLibrary.batch01Candidates,
            batch02Candidates:
              parsed.productLibrary?.batch02Candidates &&
              parsed.productLibrary.batch02Candidates.length === 50
                ? parsed.productLibrary.batch02Candidates
                : INITIAL_STORE_STATE.productLibrary.batch02Candidates,
            batch03Candidates:
              parsed.productLibrary?.batch03Candidates &&
              parsed.productLibrary.batch03Candidates.length === 50
                ? parsed.productLibrary.batch03Candidates
                : INITIAL_STORE_STATE.productLibrary.batch03Candidates,
            batch04Candidates:
              parsed.productLibrary?.batch04Candidates &&
              parsed.productLibrary.batch04Candidates.length === 50
                ? parsed.productLibrary.batch04Candidates
                : INITIAL_STORE_STATE.productLibrary.batch04Candidates,
            batch05Candidates:
              parsed.productLibrary?.batch05Candidates &&
              parsed.productLibrary.batch05Candidates.length === 50
                ? parsed.productLibrary.batch05Candidates
                : INITIAL_STORE_STATE.productLibrary.batch05Candidates,
          },
        };
      }
    } catch {
      // ignore storage errors
    }
    return INITIAL_STORE_STATE;
  });

  const [activeNav, setActiveNav] = useState<NavSection>('dashboard');
  const [dakshTab, setDakshTab] = useState<DakshWorkspaceTab>('buyer');
  const [gramosfuelTab, setGramosfuelTab] = useState<GramosfuelWorkspaceTab>('pipeline');
  const [governanceTab, setGovernanceTab] = useState<GovernanceTab>('legal');
  const [libraryTab, setLibraryTab] = useState<LibraryWorkspaceTab>('universe');
  const [activeRole, setActiveRole] = useState<StaffRole>('Founder / Operator');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SIDEBAR_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota errors
    }
  }, [state]);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, String(sidebarCollapsed));
    } catch {
      // ignore
    }
  }, [sidebarCollapsed]);

  const appendAudit = (prev: GramosStoreState, module: string, action: string, details: string): AuditLogEntry[] => {
    const entry: AuditLogEntry = {
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      actor: activeRole,
      module,
      action,
      details,
    };
    return [entry, ...prev.auditLogs].slice(0, 80);
  };

  const getCreditStatus = (entry: SupplierCreditEntry): CreditAgeingStatus => {
    const balance = entry.totalAmount - entry.paidAmount;
    if (balance <= 0) return 'Settled';
    if (entry.disputedAmount > 0) return 'Disputed';
    const d = daysUntil(entry.dueDate);
    if (d !== null && d < 0) return 'Overdue';
    if (d !== null && d <= 5) return 'Due Shortly';
    return 'Not Yet Due';
  };

  const metrics = useMemo<ComputedMetrics>(() => {
    const validSales = state.sales.filter((s) => !s.isReturned);
    const returnedSales = state.sales.filter((s) => s.isReturned);

    const grossSales = state.sales.reduce((sum, s) => sum + s.grandTotal, 0);
    const returnsTotal = returnedSales.reduce((sum, s) => sum + s.grandTotal, 0);
    const netSales = validSales.reduce((sum, s) => sum + s.grandTotal, 0);
    const cogsTotal = validSales.reduce((sum, s) => sum + s.cogsTotal, 0);
    const grossProfit = netSales - cogsTotal;
    const grossMarginPct = netSales > 0 ? (grossProfit / netSales) * 100 : 0;

    const operatingExpenses = state.expenses
      .filter((e) => e.category !== 'One-Time Fit-Out')
      .reduce((sum, e) => sum + e.amount, 0);

    const fixedRentCost =
      state.outletConfig.propertyArrangement === 'Fixed Rent Quote (₹35,000)'
        ? state.outletConfig.fixedRentMonthly
        : 0;

    const netOperatingProfit = grossProfit - operatingExpenses - fixedRentCost;

    const reserveAmount =
      netOperatingProfit > 0
        ? Math.round((netOperatingProfit * state.outletConfig.reserveRetentionPercent) / 100)
        : 0;

    const distributableProfit = Math.max(0, netOperatingProfit - reserveAmount);
    const propertyOwnerShare =
      state.outletConfig.propertyArrangement === 'Profit Participation (15–20%)' && distributableProfit > 0
        ? Math.round((distributableProfit * state.outletConfig.ownerSharePercent) / 100)
        : 0;

    const founderRetainedShare = distributableProfit - propertyOwnerShare;

    const selfFundedInventoryValue = state.products
      .filter((p) => p.ownershipType === 'Self-Funded')
      .reduce((sum, p) => sum + p.stockQty * p.landedCost, 0);

    const supplierCreditInventoryValue = state.products
      .filter((p) => p.ownershipType === 'Supplier-Credit')
      .reduce((sum, p) => sum + p.stockQty * p.landedCost, 0);

    const ownedAndCreditInventoryValue = selfFundedInventoryValue + supplierCreditInventoryValue;

    const consignmentStockRetailValue = state.products
      .filter((p) => p.ownershipType === 'Consignment')
      .reduce((sum, p) => sum + p.stockQty * p.sellingPrice, 0);

    const supplierCreditOutstanding = state.creditEntries.reduce(
      (sum, c) => sum + Math.max(0, c.totalAmount - c.paidAmount),
      0
    );

    const overdueCreditCount = state.creditEntries.filter(
      (c) => getCreditStatus(c) === 'Overdue'
    ).length;

    const consignmentPayable = state.consignments.reduce((sum, con) => {
      const unsettledUnits = Math.max(0, con.soldQty - con.settledQty);
      const payoutPerUnit = con.unitSellingPrice * (1 - con.gramosCommissionPct / 100);
      return sum + Math.round(unsettledUnits * payoutPerUnit);
    }, 0);

    const availableCash = state.outletConfig.openingCashFloat;
    const bankBalance = state.outletConfig.bankBalance;
    const customerReceivables = state.customers.reduce((sum, c) => sum + c.outstandingCredit, 0);
    const currentAssets = availableCash + bankBalance + ownedAndCreditInventoryValue + customerReceivables;
    const currentLiabilities = supplierCreditOutstanding + consignmentPayable;
    const workingCapital = currentAssets - currentLiabilities;

    const salesByChannel: Record<string, number> = {
      'Direct Retail': 0,
      'WhatsApp Order': 0,
      'Local Delivery': 0,
      Wholesale: 0,
      Institutional: 0,
    };
    const channelGrossProfit: Record<string, number> = { ...salesByChannel };

    for (const s of validSales) {
      salesByChannel[s.channel] = (salesByChannel[s.channel] || 0) + s.grandTotal;
      channelGrossProfit[s.channel] =
        (channelGrossProfit[s.channel] || 0) + (s.grandTotal - s.cogsTotal);
    }

    return {
      grossSales,
      returnsTotal,
      netSales,
      cogsTotal,
      grossProfit,
      grossMarginPct,
      operatingExpenses: operatingExpenses + fixedRentCost,
      netOperatingProfit,
      reserveAmount,
      distributableProfit,
      propertyOwnerShare,
      founderRetainedShare,
      hasOverdueSupplierLiabilities: overdueCreditCount > 0,
      selfFundedInventoryValue,
      supplierCreditInventoryValue,
      ownedAndCreditInventoryValue,
      consignmentStockRetailValue,
      supplierCreditOutstanding,
      overdueCreditCount,
      consignmentPayable,
      availableCash,
      bankBalance,
      workingCapital,
      salesByChannel,
      channelGrossProfit,
    };
  }, [state]);

  const recordSale = (saleInput: Omit<SaleTransaction, 'id' | 'billNo' | 'timestamp'>): SaleTransaction => {
    const billSeq = 100 + state.sales.length + 1;
    const newSale: SaleTransaction = {
      ...saleInput,
      id: `sale-${Date.now()}`,
      billNo: `GRM-2611-0${billSeq}`,
      timestamp: new Date().toISOString(),
    };

    setState((prev) => {
      // Deduct stock
      const updatedProducts = prev.products.map((p) => {
        const soldItem = newSale.items.find((i) => i.productId === p.id);
        if (!soldItem) return p;
        return { ...p, stockQty: Math.max(0, p.stockQty - soldItem.qty) };
      });

      // Update consignment soldQty if consignment items sold
      const updatedConsignments = prev.consignments.map((con) => {
        const soldItem = newSale.items.find((i) => i.productId === con.productId);
        if (!soldItem) return con;
        return { ...con, soldQty: con.soldQty + soldItem.qty };
      });

      // Record stock movements
      const newMovements = newSale.items.map((item) => ({
        id: `mov-${Date.now()}-${item.productId}`,
        date: new Date().toISOString().slice(0, 10),
        productId: item.productId,
        sku: item.sku,
        productName: item.name,
        ownershipType: item.ownershipType,
        movementType: 'Customer Sale' as const,
        qtyDelta: -item.qty,
        reason: `Bill ${newSale.billNo} (${newSale.channel})`,
        actor: newSale.billerRole,
      }));

      // Update customer stats if linked
      const updatedCustomers = prev.customers.map((c) => {
        if (c.id !== newSale.customerId) return c;
        return {
          ...c,
          totalSpent: c.totalSpent + newSale.grandTotal,
          visitCount: c.visitCount + 1,
          lastVisit: new Date().toISOString().slice(0, 10),
          outstandingCredit:
            newSale.paymentMode === 'Approved Credit'
              ? c.outstandingCredit + newSale.grandTotal
              : c.outstandingCredit,
        };
      });

      // Update cash or bank balance
      const nextOutlet = { ...prev.outletConfig };
      if (newSale.paymentMode === 'Cash') {
        nextOutlet.openingCashFloat += newSale.grandTotal;
      } else if (newSale.paymentMode === 'UPI / Digital') {
        nextOutlet.bankBalance += newSale.grandTotal;
      }

      return {
        ...prev,
        outletConfig: nextOutlet,
        products: updatedProducts,
        consignments: updatedConsignments,
        movements: [...newMovements, ...prev.movements],
        sales: [newSale, ...prev.sales],
        customers: updatedCustomers,
        auditLogs: appendAudit(
          prev,
          'POS Billing',
          'Bill Issued',
          `${newSale.billNo} · ${newSale.channel} · ₹${newSale.grandTotal} (${newSale.paymentMode})`
        ),
      };
    });

    return newSale;
  };

  const processReturn = (saleId: string) => {
    setState((prev) => {
      const target = prev.sales.find((s) => s.id === saleId);
      if (!target || target.isReturned) return prev;

      const updatedSales = prev.sales.map((s) =>
        s.id === saleId ? { ...s, isReturned: true } : s
      );

      // Move returned items to Zone I quarantine for inspection (per SOP 12: never directly to saleable stock until inspected)
      const updatedProducts = prev.products.map((p) => {
        const retItem = target.items.find((i) => i.productId === p.id);
        if (!retItem) return p;
        return { ...p, quarantinedQty: p.quarantinedQty + retItem.qty };
      });

      const returnMovements = target.items.map((item) => ({
        id: `mov-ret-${Date.now()}-${item.productId}`,
        date: new Date().toISOString().slice(0, 10),
        productId: item.productId,
        sku: item.sku,
        productName: item.name,
        ownershipType: item.ownershipType,
        movementType: 'Customer Return' as const,
        qtyDelta: item.qty,
        reason: `Customer return on ${target.billNo} · Held in Zone I for inspection`,
        actor: activeRole,
      }));

      const nextOutlet = { ...prev.outletConfig };
      if (target.paymentMode === 'Cash') {
        nextOutlet.openingCashFloat = Math.max(0, nextOutlet.openingCashFloat - target.grandTotal);
      } else if (target.paymentMode === 'UPI / Digital') {
        nextOutlet.bankBalance = Math.max(0, nextOutlet.bankBalance - target.grandTotal);
      }

      return {
        ...prev,
        outletConfig: nextOutlet,
        sales: updatedSales,
        products: updatedProducts,
        movements: [...returnMovements, ...prev.movements],
        auditLogs: appendAudit(
          prev,
          'Returns SOP',
          'Sale Returned',
          `Bill ${target.billNo} refunded (₹${target.grandTotal}); stock held in Zone I inspection`
        ),
      };
    });
  };

  const addProduct = (product: Omit<Product, 'id'>) => {
    const newProd: Product = { ...product, id: `prod-${Date.now()}` };
    setState((prev) => {
      const extraConsignments = [...prev.consignments];
      if (newProd.ownershipType === 'Consignment') {
        const sup = prev.suppliers.find((s) => s.id === newProd.supplierId);
        extraConsignments.unshift({
          id: `con-${Date.now()}`,
          supplierId: newProd.supplierId,
          supplierName: sup?.name || 'Regional Producer',
          productId: newProd.id,
          productName: newProd.name,
          sku: newProd.sku,
          agreementRef: `CON-${Date.now().toString().slice(-4)}`,
          receivedDate: new Date().toISOString().slice(0, 10),
          openingQty: newProd.stockQty,
          receivedQty: newProd.stockQty,
          soldQty: 0,
          settledQty: 0,
          returnedQty: 0,
          damagedQty: 0,
          unitSellingPrice: newProd.sellingPrice,
          gramosCommissionPct: newProd.consignmentCommissionPct ?? 20,
          returnTerms: sup?.returnPolicy || 'Unsold stock returnable under agreement',
          lastSettlementDate: null,
          lastPaymentRef: null,
        });
      }

      return {
        ...prev,
        products: [newProd, ...prev.products],
        consignments: extraConsignments,
        movements: [
          {
            id: `mov-${Date.now()}`,
            date: new Date().toISOString().slice(0, 10),
            productId: newProd.id,
            sku: newProd.sku,
            productName: newProd.name,
            ownershipType: newProd.ownershipType,
            movementType:
              newProd.ownershipType === 'Consignment' ? 'Consignment Receipt' : 'Opening Stock',
            qtyDelta: newProd.stockQty,
            reason: `SKU Registered (${newProd.ownershipType})`,
            actor: activeRole,
          },
          ...prev.movements,
        ],
        auditLogs: appendAudit(
          prev,
          'Catalogue',
          'SKU Created',
          `${newProd.sku} · ${newProd.name} (${newProd.ownershipType})`
        ),
      };
    });
  };

  const receiveStock = (params: {
    productId: string;
    qty: number;
    batchNumber: string;
    expiryDate: string | null;
    invoiceRef: string;
    isCreditPurchase: boolean;
    creditDays?: number;
  }) => {
    setState((prev) => {
      const prod = prev.products.find((p) => p.id === params.productId);
      if (!prod) return prev;
      const sup = prev.suppliers.find((s) => s.id === prod.supplierId);

      const updatedProducts = prev.products.map((p) =>
        p.id === prod.id
          ? {
              ...p,
              stockQty: p.stockQty + params.qty,
              batchNumber: params.batchNumber || p.batchNumber,
              expiryDate: params.expiryDate !== undefined ? params.expiryDate : p.expiryDate,
            }
          : p
      );

      let updatedCredits = prev.creditEntries;
      let updatedConsignments = prev.consignments;
      const nextOutlet = { ...prev.outletConfig };

      if (prod.ownershipType === 'Consignment') {
        updatedConsignments = prev.consignments.map((c) =>
          c.productId === prod.id ? { ...c, receivedQty: c.receivedQty + params.qty } : c
        );
      } else if (params.isCreditPurchase || prod.ownershipType === 'Supplier-Credit') {
        const days = params.creditDays || prod.creditTermDays || 15;
        const due = new Date();
        due.setDate(due.getDate() + days);
        updatedCredits = [
          {
            id: `crd-${Date.now()}`,
            supplierId: prod.supplierId,
            supplierName: sup?.name || 'Supplier',
            invoiceNo: params.invoiceRef || `INV-${Date.now().toString().slice(-5)}`,
            purchaseDate: new Date().toISOString().slice(0, 10),
            dueDate: due.toISOString().slice(0, 10),
            creditDays: days,
            totalAmount: params.qty * prod.purchaseCost,
            paidAmount: 0,
            disputedAmount: 0,
            notes: `Zone G receipt for ${prod.name} (${params.qty} units)`,
          },
          ...prev.creditEntries,
        ];
      } else {
        // Self-funded direct purchase reduces bank balance
        nextOutlet.bankBalance = Math.max(0, nextOutlet.bankBalance - params.qty * prod.purchaseCost);
      }

      return {
        ...prev,
        outletConfig: nextOutlet,
        products: updatedProducts,
        creditEntries: updatedCredits,
        consignments: updatedConsignments,
        movements: [
          {
            id: `mov-${Date.now()}`,
            date: new Date().toISOString().slice(0, 10),
            productId: prod.id,
            sku: prod.sku,
            productName: prod.name,
            ownershipType: prod.ownershipType,
            movementType:
              prod.ownershipType === 'Consignment' ? 'Consignment Receipt' : 'Purchase Receipt',
            qtyDelta: params.qty,
            reason: `Zone G Verified · Ref ${params.invoiceRef || 'Direct'} · Batch ${params.batchNumber}`,
            actor: activeRole,
          },
          ...prev.movements,
        ],
        auditLogs: appendAudit(
          prev,
          'Zone G Receiving',
          'Stock Received',
          `+${params.qty} ${prod.name} (${prod.ownershipType}) · Ref ${params.invoiceRef}`
        ),
      };
    });
  };

  const quarantineStock = (
    productId: string,
    qty: number,
    type: 'Damage Quarantine' | 'Expiry Quarantine',
    reason: string
  ) => {
    setState((prev) => {
      const prod = prev.products.find((p) => p.id === productId);
      if (!prod || qty <= 0) return prev;
      const moveQty = Math.min(qty, prod.stockQty);
      return {
        ...prev,
        products: prev.products.map((p) =>
          p.id === productId
            ? { ...p, stockQty: p.stockQty - moveQty, quarantinedQty: p.quarantinedQty + moveQty }
            : p
        ),
        movements: [
          {
            id: `mov-${Date.now()}`,
            date: new Date().toISOString().slice(0, 10),
            productId: prod.id,
            sku: prod.sku,
            productName: prod.name,
            ownershipType: prod.ownershipType,
            movementType: type,
            qtyDelta: -moveQty,
            reason: `Moved to Zone I Quarantine: ${reason}`,
            actor: activeRole,
          },
          ...prev.movements,
        ],
        auditLogs: appendAudit(
          prev,
          'Zone I Quarantine',
          type,
          `${moveQty} units of ${prod.name} quarantined · ${reason}`
        ),
      };
    });
  };

  const adjustStock = (productId: string, qtyDelta: number, reason: string) => {
    if (!reason.trim()) return;
    setState((prev) => {
      const prod = prev.products.find((p) => p.id === productId);
      if (!prod) return prev;
      return {
        ...prev,
        products: prev.products.map((p) =>
          p.id === productId ? { ...p, stockQty: Math.max(0, p.stockQty + qtyDelta) } : p
        ),
        movements: [
          {
            id: `mov-${Date.now()}`,
            date: new Date().toISOString().slice(0, 10),
            productId: prod.id,
            sku: prod.sku,
            productName: prod.name,
            ownershipType: prod.ownershipType,
            movementType: 'Physical Adjustment',
            qtyDelta,
            reason,
            actor: activeRole,
          },
          ...prev.movements,
        ],
        auditLogs: appendAudit(
          prev,
          'Inventory Audit',
          'Physical Stock Adjustment',
          `${prod.sku} (${qtyDelta >= 0 ? '+' : ''}${qtyDelta}) · Reason: ${reason}`
        ),
      };
    });
  };

  const addSupplier = (supplier: Omit<Supplier, 'id'>) => {
    const newSup: Supplier = { ...supplier, id: `sup-${Date.now()}` };
    setState((prev) => ({
      ...prev,
      suppliers: [newSup, ...prev.suppliers],
      auditLogs: appendAudit(
        prev,
        'Supplier Network',
        'Supplier Onboarded',
        `${newSup.name} (${newSup.group}) · ${newSup.paymentTerms}`
      ),
    }));
  };

  const paySupplierCredit = (creditId: string, amount: number, mode: 'Bank / UPI' | 'Cash') => {
    setState((prev) => {
      const entry = prev.creditEntries.find((c) => c.id === creditId);
      if (!entry || amount <= 0) return prev;
      const payable = entry.totalAmount - entry.paidAmount;
      const payAmt = Math.min(amount, payable);
      const nextOutlet = { ...prev.outletConfig };
      if (mode === 'Cash') {
        nextOutlet.openingCashFloat = Math.max(0, nextOutlet.openingCashFloat - payAmt);
      } else {
        nextOutlet.bankBalance = Math.max(0, nextOutlet.bankBalance - payAmt);
      }
      return {
        ...prev,
        outletConfig: nextOutlet,
        creditEntries: prev.creditEntries.map((c) =>
          c.id === creditId ? { ...c, paidAmount: c.paidAmount + payAmt } : c
        ),
        auditLogs: appendAudit(
          prev,
          'Supplier Payment',
          'Credit Settled',
          `Paid ₹${payAmt} to ${entry.supplierName} (${entry.invoiceNo}) via ${mode}`
        ),
      };
    });
  };

  const settleConsignment = (consignmentId: string, unitsToSettle: number, paymentRef: string) => {
    setState((prev) => {
      const con = prev.consignments.find((c) => c.id === consignmentId);
      if (!con || unitsToSettle <= 0) return prev;
      const unsettled = Math.max(0, con.soldQty - con.settledQty);
      const actualUnits = Math.min(unitsToSettle, unsettled);
      const payout = Math.round(
        actualUnits * con.unitSellingPrice * (1 - con.gramosCommissionPct / 100)
      );
      const nextOutlet = {
        ...prev.outletConfig,
        bankBalance: Math.max(0, prev.outletConfig.bankBalance - payout),
      };
      return {
        ...prev,
        outletConfig: nextOutlet,
        consignments: prev.consignments.map((c) =>
          c.id === consignmentId
            ? {
                ...c,
                settledQty: c.settledQty + actualUnits,
                lastSettlementDate: new Date().toISOString().slice(0, 10),
                lastPaymentRef: paymentRef || `CON-PAY-${Date.now().toString().slice(-4)}`,
              }
            : c
        ),
        auditLogs: appendAudit(
          prev,
          'Consignment Settlement',
          'Producer Paid',
          `Settled ${actualUnits} sold units of ${con.productName} with ${con.supplierName} · ₹${payout}`
        ),
      };
    });
  };

  const addExpense = (expense: Omit<ExpenseRecord, 'id'>) => {
    const newExp: ExpenseRecord = { ...expense, id: `exp-${Date.now()}` };
    setState((prev) => {
      const nextOutlet = { ...prev.outletConfig };
      if (newExp.paymentMode === 'Cash') {
        nextOutlet.openingCashFloat = Math.max(0, nextOutlet.openingCashFloat - newExp.amount);
      } else {
        nextOutlet.bankBalance = Math.max(0, nextOutlet.bankBalance - newExp.amount);
      }
      return {
        ...prev,
        outletConfig: nextOutlet,
        expenses: [newExp, ...prev.expenses],
        auditLogs: appendAudit(
          prev,
          'Expense Register',
          'Expense Approved',
          `${newExp.head} · ₹${newExp.amount} (${newExp.voucherRef})`
        ),
      };
    });
  };

  const recordCashReconciliation = (rec: Omit<CashReconciliation, 'id' | 'difference'>) => {
    const diff = rec.actualCountedCash - rec.expectedClosingCash;
    const newRec: CashReconciliation = { ...rec, id: `rec-${Date.now()}`, difference: diff };
    setState((prev) => ({
      ...prev,
      reconciliations: [newRec, ...prev.reconciliations],
      auditLogs: appendAudit(
        prev,
        'Cash Control',
        'Daily Closing Reconciled',
        `Counted ₹${rec.actualCountedCash} vs Expected ₹${rec.expectedClosingCash} (Variance: ${diff >= 0 ? '+' : ''}₹${diff})`
      ),
    }));
  };

  const addCustomer = (
    customer: Omit<Customer, 'id' | 'customerCode' | 'totalSpent' | 'visitCount' | 'lastVisit'>
  ) => {
    const seq = String(state.customers.length + 1).padStart(6, '0');
    const newCus: Customer = {
      ...customer,
      id: `cus-${Date.now()}`,
      customerCode: `GRM-CUS-${seq}`,
      totalSpent: 0,
      visitCount: 0,
      lastVisit: new Date().toISOString().slice(0, 10),
    };
    setState((prev) => ({
      ...prev,
      customers: [newCus, ...prev.customers],
      auditLogs: appendAudit(
        prev,
        'CRM',
        'Customer Registered',
        `${newCus.customerCode} · ${newCus.name} (${newCus.type})`
      ),
    }));
  };

  const addEnquiry = (enquiry: Omit<CustomerEnquiry, 'id'>) => {
    const newEnq: CustomerEnquiry = { ...enquiry, id: `enq-${Date.now()}` };
    setState((prev) => ({
      ...prev,
      enquiries: [newEnq, ...prev.enquiries],
      auditLogs: appendAudit(
        prev,
        'CRM Enquiries',
        'Product Request Logged',
        `${newEnq.requestedItem} (${newEnq.channel})`
      ),
    }));
  };

  const updateEnquiryStatus = (id: string, status: CustomerEnquiry['status']) => {
    setState((prev) => ({
      ...prev,
      enquiries: prev.enquiries.map((e) => (e.id === id ? { ...e, status } : e)),
    }));
  };

  const addComplaint = (complaint: Omit<CustomerComplaint, 'id'>) => {
    const newCmp: CustomerComplaint = { ...complaint, id: `cmp-${Date.now()}` };
    setState((prev) => ({
      ...prev,
      complaints: [newCmp, ...prev.complaints],
      auditLogs: appendAudit(
        prev,
        'Customer Care',
        'Complaint Logged',
        `${newCmp.category} · ${newCmp.productName} (${newCmp.status})`
      ),
    }));
  };

  const resolveComplaint = (id: string, actionTaken: string) => {
    setState((prev) => ({
      ...prev,
      complaints: prev.complaints.map((c) =>
        c.id === id
          ? {
              ...c,
              actionTaken,
              status: 'Resolved',
              closureDate: new Date().toISOString().slice(0, 10),
            }
          : c
      ),
      auditLogs: appendAudit(
        prev,
        'Customer Care',
        'Complaint Resolved',
        `Complaint ${id} resolved: ${actionTaken}`
      ),
    }));
  };

  const toggleSopItem = (id: string) => {
    const nowTime = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    setState((prev) => ({
      ...prev,
      sopChecklist: prev.sopChecklist.map((item) =>
        item.id === id
          ? { ...item, completed: !item.completed, lastUpdated: !item.completed ? nowTime : undefined }
          : item
      ),
    }));
  };

  const togglePilotMilestone = (id: string) => {
    setState((prev) => ({
      ...prev,
      pilotMilestones: prev.pilotMilestones.map((m) =>
        m.id === id ? { ...m, completed: !m.completed } : m
      ),
    }));
  };

  const updateOutletConfig = (partial: Partial<OutletConfig>) => {
    setState((prev) => ({
      ...prev,
      outletConfig: { ...prev.outletConfig, ...partial },
      auditLogs: appendAudit(
        prev,
        'Governance',
        'Outlet Configuration Updated',
        Object.keys(partial).join(', ')
      ),
    }));
  };

  const resetStore = () => {
    setState(INITIAL_STORE_STATE);
    localStorage.removeItem(STORAGE_KEY);
  };

  /* --------------------------------------------------------------------------
   * DAKSH MARKET Synchronized Engine Methods
   * ------------------------------------------------------------------------ */

  const evaluateMatchesForItems = (
    items: RequirementLineItem[],
    listings: VendorListing[],
    organizations: UniversalOrganization[]
  ): SupplyMatch[] => {
    const matches: SupplyMatch[] = [];
    const nowIso = new Date().toISOString();

    for (const item of items) {
      const descLower = `${item.description} ${item.category} ${item.industry}`.toLowerCase();
      // 1. Check Published & Verified VendorListings strictly
      const publishedMatches = listings.filter((l) => {
        if (l.status !== 'Published') return false;
        const text = `${l.industry} ${l.category} ${l.subcategory} ${l.productFamily} ${l.productName}`.toLowerCase();
        const catHit = item.category && text.includes(item.category.toLowerCase());
        const indHit = item.industry && l.industry.toLowerCase() === item.industry.toLowerCase();
        const wordHit = item.description
          .toLowerCase()
          .split(/\s+/)
          .some((w) => w.length > 3 && text.includes(w));
        return catHit || (indHit && wordHit);
      });

      if (publishedMatches.length > 0) {
        for (const l of publishedMatches) {
          const moqOk = item.qty >= l.moq;
          const stockOk = l.availableCapacityOrStock >= item.qty;
          matches.push({
            id: `mat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            lineItemId: item.id,
            listingId: l.id,
            vendorId: l.vendorId,
            vendorName: l.vendorName,
            productName: l.productName,
            sku: l.sku,
            status: moqOk && stockOk ? 'Verified Match' : 'Potential Match',
            indicativeUnitPrice: l.publicIndicativePrice,
            moq: l.moq,
            evidenceReason:
              moqOk && stockOk
                ? `Published SKU ${l.sku} matches category (${l.category}), qty ${item.qty} >= MOQ ${l.moq}, capacity ${l.availableCapacityOrStock} available.`
                : `Published SKU ${l.sku} matches category, but requires MOQ/capacity check (Req: ${item.qty}, MOQ: ${l.moq}, Avail: ${l.availableCapacityOrStock}).`,
            sourceTimestamp: l.sourceTimestamp,
          });
        }
        continue;
      }

      // 2. Check onboarding/unverified vendors with proposed categories (strictly labeled Insufficient Data)
      const onboardingOrgs = organizations.filter(
        (o) =>
          o.roleIds.vendorId &&
          o.proposedCategories.some(
            (cat) =>
              descLower.includes(cat.toLowerCase()) ||
              item.category.toLowerCase().includes(cat.toLowerCase())
          )
      );

      if (onboardingOrgs.length > 0) {
        for (const org of onboardingOrgs) {
          matches.push({
            id: `mat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            lineItemId: item.id,
            listingId: null,
            vendorId: org.roleIds.vendorId || org.orgId,
            vendorName: `${org.name} (${org.verificationStatus})`,
            productName: `Proposed Category: ${item.category || item.description}`,
            sku: 'UNVERIFIED',
            status: 'Insufficient Data',
            indicativeUnitPrice: null,
            moq: null,
            evidenceReason: `Vendor ${org.roleIds.vendorId} lists matching proposed category, but has 0 verified published SKUs/pricing yet.`,
            sourceTimestamp: nowIso,
          });
        }
      } else {
        matches.push({
          id: `mat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          lineItemId: item.id,
          listingId: null,
          vendorId: 'NONE',
          vendorName: 'No Verified Vendor Found',
          productName: item.description,
          sku: 'NONE',
          status: 'Insufficient Data',
          indicativeUnitPrice: null,
          moq: null,
          evidenceReason: 'No published verified SKU currently matches this specification in DAKSH MARKET.',
          sourceTimestamp: nowIso,
        });
      }
    }

    return matches;
  };

  const addUniversalIndustry = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setState((prev) => {
      if (prev.dakshMarket.industries.some((i) => i.name.toLowerCase() === trimmed.toLowerCase())) {
        return prev;
      }
      const nextNum = String(prev.dakshMarket.industries.length + 1).padStart(2, '0');
      return {
        ...prev,
        dakshMarket: {
          ...prev.dakshMarket,
          industries: [
            ...prev.dakshMarket.industries,
            {
              id: `ind-${Date.now()}`,
              name: trimmed,
              code: `IND-${nextNum}`,
              isCoreGramos: false,
              active: true,
            },
          ],
        },
        auditLogs: appendAudit(
          prev,
          'Universal Taxonomy',
          'Industry Added',
          `IND-${nextNum} · ${trimmed} enabled across DAKSH MARKET & GRAMOS Inventory`
        ),
      };
    });
  };

  const createOrganization = (input: {
    name: string;
    city: string;
    state: string;
    contactPerson: string;
    phone: string;
    email: string;
    gstOrLicense: string;
    roles: OrganizationRoleType[];
    proposedCategories: string[];
    notes?: string;
  }): UniversalOrganization => {
    const orgSeq = String(state.dakshMarket.organizations.length + 1).padStart(6, '0');
    const countWithRole = (r: OrganizationRoleType) =>
      String(state.dakshMarket.organizations.filter((o) => o.roles.includes(r)).length + 1).padStart(6, '0');

    const roleIds: UniversalOrganization['roleIds'] = {};
    if (input.roles.includes('Manufacturer')) roleIds.manufacturerId = `MFR-${countWithRole('Manufacturer')}`;
    if (input.roles.includes('Vendor')) roleIds.vendorId = `VND-${countWithRole('Vendor')}`;
    if (input.roles.includes('Distributor')) roleIds.distributorId = `DST-${countWithRole('Distributor')}`;
    if (input.roles.includes('Seller')) roleIds.sellerId = `SLR-${countWithRole('Seller')}`;
    if (input.roles.includes('Buyer')) roleIds.buyerId = `BUY-${countWithRole('Buyer')}`;
    if (input.roles.includes('Service Provider')) roleIds.serviceProviderId = `SRV-${countWithRole('Service Provider')}`;
    if (input.roles.includes('Logistics Provider')) roleIds.logisticsProviderId = `LOG-${countWithRole('Logistics Provider')}`;

    const newOrg: UniversalOrganization = {
      id: `dm-org-${Date.now()}`,
      orgId: `ORG-${orgSeq}`,
      personId: `PER-${orgSeq}`,
      name: input.name.trim(),
      city: input.city.trim(),
      state: input.state.trim() || 'Rajasthan',
      contactPerson: input.contactPerson.trim(),
      phone: input.phone.trim(),
      email: input.email.trim(),
      gstOrLicense: input.gstOrLicense.trim() || 'Pending Compliance Check',
      roles: input.roles,
      roleIds,
      verificationStatus: 'Pending Verification',
      proposedCategories: input.proposedCategories,
      notes: input.notes,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    setState((prev) => ({
      ...prev,
      dakshMarket: {
        ...prev.dakshMarket,
        organizations: [newOrg, ...prev.dakshMarket.organizations],
      },
      auditLogs: appendAudit(
        prev,
        'Universal Identity',
        'Organization Registered',
        `${newOrg.orgId} · ${newOrg.name} (${newOrg.roles.join(', ')})`
      ),
    }));

    return newOrg;
  };

  const updateOrganizationStatus = (orgId: string, status: VerificationStatus) => {
    setState((prev) => {
      const target = prev.dakshMarket.organizations.find((o) => o.orgId === orgId);
      if (!target) return prev;

      const updatedOrgs = prev.dakshMarket.organizations.map((o) =>
        o.orgId === orgId ? { ...o, verificationStatus: status } : o
      );

      // Sync with GRAMOS Mart Suppliers if Vendor verified and not yet linked
      let updatedSuppliers = prev.suppliers;
      if ((status === 'Verified' || status === 'Approved') && target.roleIds.vendorId) {
        const existingSup = prev.suppliers.find((s) => s.id === target.linkedSupplierId);
        if (!existingSup) {
          const newSupId = `sup-dm-${Date.now()}`;
          updatedSuppliers = [
            {
              id: newSupId,
              name: target.name,
              group: target.roles.includes('Manufacturer')
                ? 'Manufacturers'
                : 'Institutional & B2B Suppliers',
              location: `${target.city}, ${target.state}`,
              contactPerson: target.contactPerson,
              phone: target.phone,
              gstOrLicense: target.gstOrLicense,
              categories: target.proposedCategories.length > 0 ? target.proposedCategories : ['General B2B'],
              paymentTerms: 'Advance / Direct',
              creditLimit: 0,
              returnPolicy: 'As per DAKSH MARKET B2B quotation terms',
              classification: 'Approved',
              isRegionalHadoti: target.city.toLowerCase().includes('kota') || target.city.toLowerCase().includes('bundi'),
              womenLedOrShg: false,
              scores: { quality: 4, pricing: 4, delivery: 4, documentation: 4, continuity: 4 },
              verified: true,
            },
            ...prev.suppliers,
          ];
          const orgIdx = updatedOrgs.findIndex((o) => o.orgId === orgId);
          if (orgIdx >= 0) {
            updatedOrgs[orgIdx] = { ...updatedOrgs[orgIdx], linkedSupplierId: newSupId };
          }
        }
      }

      return {
        ...prev,
        suppliers: updatedSuppliers,
        dakshMarket: {
          ...prev.dakshMarket,
          organizations: updatedOrgs,
        },
        auditLogs: appendAudit(
          prev,
          'Daksh Admin',
          'Organization Verification Updated',
          `${target.orgId} (${target.name}) -> ${status}`
        ),
      };
    });
  };

  const createRelationship = (rel: Omit<CommercialRelationship, 'id'>) => {
    const newRel: CommercialRelationship = { ...rel, id: `rel-${Date.now()}` };
    setState((prev) => ({
      ...prev,
      dakshMarket: {
        ...prev.dakshMarket,
        relationships: [newRel, ...prev.dakshMarket.relationships],
      },
      auditLogs: appendAudit(
        prev,
        'Commercial Governance',
        'Vendor-Seller Relationship Linked',
        `${newRel.vendorId} -> ${newRel.sellerId} (${newRel.status})`
      ),
    }));
  };

  const submitVendorListing = (
    listingInput: Omit<VendorListing, 'id' | 'listingCode' | 'sourceTimestamp' | 'lastVerifiedAt'>
  ): VendorListing => {
    const seq = String(state.dakshMarket.listings.length + 1).padStart(4, '0');
    const nowIso = new Date().toISOString();
    const newListing: VendorListing = {
      ...listingInput,
      id: `dm-lst-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      listingCode: `DM-LST-${seq}`,
      sourceTimestamp: nowIso,
      lastVerifiedAt: listingInput.status === 'Published' ? nowIso.slice(0, 10) : null,
    };

    setState((prev) => ({
      ...prev,
      dakshMarket: {
        ...prev.dakshMarket,
        listings: [newListing, ...prev.dakshMarket.listings],
      },
      auditLogs: appendAudit(
        prev,
        'Vendor OS',
        'Listing Submitted',
        `${newListing.listingCode} · ${newListing.productName} (${newListing.vendorId}) · ${newListing.status}`
      ),
    }));

    return newListing;
  };

  const updateListingStatus = (
    listingId: string,
    status: VendorListing['status'],
    syncToRetail = false
  ) => {
    setState((prev) => {
      const target = prev.dakshMarket.listings.find((l) => l.id === listingId);
      if (!target) return prev;

      let updatedProducts = prev.products;
      let syncedRetailProductId = target.syncedRetailProductId;

      if (status === 'Published' && syncToRetail && !syncedRetailProductId) {
        const org = prev.dakshMarket.organizations.find((o) => o.orgId === target.vendorOrgId);
        const supplierId = org?.linkedSupplierId || prev.suppliers[0]?.id || 'sup-1';
        const newProdId = `prod-dm-${Date.now()}`;
        const newProd: Product = {
          id: newProdId,
          sku: target.sku,
          name: target.productName,
          brand: target.vendorName,
          industry: target.industry,
          category: target.category,
          subcategory: target.subcategory,
          unitSize: target.variant || target.unitOfMeasure,
          ownershipType: 'Supplier-Credit',
          sourceType: 'External Supplier',
          supplierId,
          batchNumber: `DM-${new Date().toISOString().slice(2, 7).replace('-', '')}`,
          mfgDate: new Date().toISOString().slice(0, 10),
          expiryDate: null,
          purchaseCost: target.confidentialCostPrice,
          freightAndHandling: 0,
          packagingAndTax: 0,
          landedCost: target.confidentialCostPrice,
          mrp: Math.round(target.publicIndicativePrice * 1.15),
          sellingPrice: target.publicIndicativePrice,
          gstPercent: target.gstPercent,
          stockQty: 0,
          quarantinedQty: 0,
          reorderLevel: target.moq,
          velocity: 'Medium',
          reviewAction: 'Maintain',
          zone: 'Zone E',
          creditTermDays: 15,
          active: true,
        };
        updatedProducts = [newProd, ...prev.products];
        syncedRetailProductId = newProdId;
      }

      return {
        ...prev,
        products: updatedProducts,
        dakshMarket: {
          ...prev.dakshMarket,
          listings: prev.dakshMarket.listings.map((l) =>
            l.id === listingId
              ? {
                  ...l,
                  status,
                  syncedRetailProductId,
                  lastVerifiedAt:
                    status === 'Published' || status === 'Approved'
                      ? new Date().toISOString().slice(0, 10)
                      : l.lastVerifiedAt,
                }
              : l
          ),
        },
        auditLogs: appendAudit(
          prev,
          'Universal Catalogue',
          `Listing ${status}`,
          `${target.listingCode} · ${target.productName}${syncToRetail ? ' (Synced to GRAMOS Mart SKU)' : ''}`
        ),
      };
    });
  };

  const createRequirement = (input: {
    buyerOrgId: string;
    title: string;
    rawPrompt: string;
    deliveryLocation: string;
    targetDeliveryDate: string | null;
    budgetCeiling: number | null;
    installationNeeded: boolean | null;
    missingInfoFlags: string[];
    items: Omit<RequirementLineItem, 'id'>[];
    projectId?: string;
    sourceEnquiryId?: string;
  }): BuyerRequirement => {
    const buyerOrg =
      state.dakshMarket.organizations.find((o) => o.orgId === input.buyerOrgId) ||
      state.dakshMarket.organizations[0];
    const seq = String(state.dakshMarket.requirements.length + 1).padStart(6, '0');
    const itemsWithIds: RequirementLineItem[] = input.items.map((it, idx) => ({
      ...it,
      id: `rli-${Date.now()}-${idx}`,
    }));
    const matches = evaluateMatchesForItems(
      itemsWithIds,
      state.dakshMarket.listings,
      state.dakshMarket.organizations
    );

    const newReq: BuyerRequirement = {
      id: `dm-req-${Date.now()}`,
      reqCode: `REQ-${seq}`,
      buyerOrgId: buyerOrg.orgId,
      buyerId: buyerOrg.roleIds.buyerId || 'BUY-000001',
      buyerName: buyerOrg.name,
      projectId: input.projectId,
      title: input.title.trim(),
      rawPrompt: input.rawPrompt.trim(),
      deliveryLocation: input.deliveryLocation.trim() || 'Kota, Rajasthan',
      targetDeliveryDate: input.targetDeliveryDate,
      budgetCeiling: input.budgetCeiling,
      installationNeeded: input.installationNeeded,
      missingInfoFlags: input.missingInfoFlags,
      items: itemsWithIds,
      matches,
      status: input.missingInfoFlags.length > 0 ? 'Clarification Needed' : 'Ready for RFQ',
      sourceEnquiryId: input.sourceEnquiryId,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    setState((prev) => ({
      ...prev,
      dakshMarket: {
        ...prev.dakshMarket,
        requirements: [newReq, ...prev.dakshMarket.requirements],
      },
      auditLogs: appendAudit(
        prev,
        'Buyer OS',
        'Requirement Structured',
        `${newReq.reqCode} · ${newReq.title} (${newReq.items.length} line items)`
      ),
    }));

    return newReq;
  };

  const clarifyRequirement = (
    reqId: string,
    updates: {
      deliveryLocation?: string;
      targetDeliveryDate?: string | null;
      budgetCeiling?: number | null;
      installationNeeded?: boolean | null;
    }
  ) => {
    setState((prev) => ({
      ...prev,
      dakshMarket: {
        ...prev.dakshMarket,
        requirements: prev.dakshMarket.requirements.map((r) => {
          if (r.id !== reqId) return r;
          const nextBudget = updates.budgetCeiling !== undefined ? updates.budgetCeiling : r.budgetCeiling;
          const nextDate =
            updates.targetDeliveryDate !== undefined ? updates.targetDeliveryDate : r.targetDeliveryDate;
          const nextInst =
            updates.installationNeeded !== undefined ? updates.installationNeeded : r.installationNeeded;
          const nextLoc = updates.deliveryLocation || r.deliveryLocation;
          const flags: string[] = [];
          if (!nextBudget) flags.push('Target budget range not specified');
          if (!nextDate) flags.push('Required delivery date not specified');
          if (nextInst === null) flags.push('Installation scope not confirmed');
          return {
            ...r,
            deliveryLocation: nextLoc,
            targetDeliveryDate: nextDate,
            budgetCeiling: nextBudget,
            installationNeeded: nextInst,
            missingInfoFlags: flags,
            status: flags.length === 0 && r.status === 'Clarification Needed' ? 'Ready for RFQ' : r.status,
          };
        }),
      },
      auditLogs: appendAudit(
        prev,
        'Buyer OS',
        'Requirement Clarified',
        `Updated budget/delivery/installation details for requirement ${reqId}`
      ),
    }));
  };

  const runSupplyMatching = (reqId: string) => {
    setState((prev) => {
      const target = prev.dakshMarket.requirements.find((r) => r.id === reqId);
      if (!target) return prev;
      const freshMatches = evaluateMatchesForItems(
        target.items,
        prev.dakshMarket.listings,
        prev.dakshMarket.organizations
      );
      return {
        ...prev,
        dakshMarket: {
          ...prev.dakshMarket,
          requirements: prev.dakshMarket.requirements.map((r) =>
            r.id === reqId ? { ...r, matches: freshMatches } : r
          ),
        },
        auditLogs: appendAudit(
          prev,
          'Matching Assistant',
          'Evidence-Based Matching Run',
          `${target.reqCode} evaluated against ${prev.dakshMarket.listings.filter((l) => l.status === 'Published').length} published listings`
        ),
      };
    });
  };

  const createRfqFromRequirement = (params: {
    requirementId: string;
    invitedVendorIds: string[];
    dueDate: string;
    sellerId?: string;
  }): Rfq | null => {
    const req = state.dakshMarket.requirements.find((r) => r.id === params.requirementId);
    if (!req || params.invitedVendorIds.length === 0) return null;

    const seq = String(state.dakshMarket.rfqs.length + 1).padStart(6, '0');
    const newRfq: Rfq = {
      id: `dm-rfq-${Date.now()}`,
      rfqCode: `RFQ-${seq}`,
      requirementId: req.id,
      projectId: req.projectId,
      buyerOrgId: req.buyerOrgId,
      buyerId: req.buyerId,
      buyerName: req.buyerName,
      sellerOrgId: params.sellerId ? 'ORG-000001' : undefined,
      sellerId: params.sellerId,
      invitedVendorIds: params.invitedVendorIds,
      title: req.title,
      deliveryLocation: req.deliveryLocation,
      dueDate: params.dueDate,
      items: req.items,
      status: 'Open',
      createdAt: new Date().toISOString().slice(0, 10),
    };

    setState((prev) => ({
      ...prev,
      dakshMarket: {
        ...prev.dakshMarket,
        rfqs: [newRfq, ...prev.dakshMarket.rfqs],
        requirements: prev.dakshMarket.requirements.map((r) =>
          r.id === req.id ? { ...r, status: 'RFQ Issued' } : r
        ),
      },
      auditLogs: appendAudit(
        prev,
        'RFQ Engine',
        'RFQ Issued',
        `${newRfq.rfqCode} sent to ${newRfq.invitedVendorIds.join(', ')} for ${req.reqCode}`
      ),
    }));

    return newRfq;
  };

  const submitQuotation = (
    quoteInput: Omit<RfqQuotation, 'id' | 'quoteCode' | 'createdAt' | 'humanApprovedAt' | 'status'>
  ): RfqQuotation => {
    const seq = String(state.dakshMarket.quotations.length + 1).padStart(6, '0');
    const nowIso = new Date().toISOString();
    const newQuote: RfqQuotation = {
      ...quoteInput,
      id: `dm-qtn-${Date.now()}`,
      quoteCode: `QTN-${seq}`,
      status: 'Submitted',
      humanApprovedAt: nowIso,
      createdAt: nowIso.slice(0, 10),
    };

    setState((prev) => ({
      ...prev,
      dakshMarket: {
        ...prev.dakshMarket,
        quotations: [newQuote, ...prev.dakshMarket.quotations],
        rfqs: prev.dakshMarket.rfqs.map((r) =>
          r.id === newQuote.rfqId && r.status === 'Open' ? { ...r, status: 'Quotes Received' } : r
        ),
      },
      auditLogs: appendAudit(
        prev,
        'Vendor OS',
        'Quotation Submitted (Human Approved)',
        `${newQuote.quoteCode} by ${newQuote.vendorId} · Landed ₹${newQuote.landedTotal}`
      ),
    }));

    return newQuote;
  };

  const awardQuotationToOrder = (quotationId: string): B2bOrder | null => {
    const quote = state.dakshMarket.quotations.find((q) => q.id === quotationId);
    if (!quote) return null;
    const rfq = state.dakshMarket.rfqs.find((r) => r.id === quote.rfqId);
    if (!rfq) return null;

    const seq = String(state.dakshMarket.orders.length + 1).padStart(6, '0');
    const newOrder: B2bOrder = {
      id: `dm-po-${Date.now()}`,
      orderCode: `PO-${seq}`,
      rfqId: rfq.id,
      quotationId: quote.id,
      projectId: rfq.projectId,
      buyerOrgId: rfq.buyerOrgId,
      buyerId: rfq.buyerId,
      buyerName: rfq.buyerName,
      vendorOrgId: quote.vendorOrgId,
      vendorId: quote.vendorId,
      vendorName: quote.vendorName,
      sellerId: quote.sellerId || rfq.sellerId,
      title: rfq.title,
      landedTotal: quote.landedTotal,
      stage: 'PO Issued',
      paymentReference: null,
      fulfilmentTracking: null,
      deliveryAcceptedAt: null,
      syncedToGramosInventory: false,
      approvedByRole: activeRole,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    setState((prev) => {
      // Check if an active commission agreement applies for this vendor + seller
      const sellerId = newOrder.sellerId;
      const agreement = sellerId
        ? prev.dakshMarket.commissionAgreements.find(
            (a) => a.vendorId === newOrder.vendorId && a.sellerId === sellerId && a.status === 'Active'
          )
        : undefined;

      let nextCommissions = prev.dakshMarket.commissions;
      if (agreement && sellerId) {
        const commAmt =
          agreement.basis === 'Fixed Per Order'
            ? agreement.fixedAmount
            : Math.round((quote.subtotal * agreement.ratePercent) / 100);
        const commSeq = String(prev.dakshMarket.commissions.length + 1).padStart(5, '0');
        const newComm: CommissionEntry = {
          id: `dm-com-${Date.now()}`,
          entryCode: `COM-${commSeq}`,
          orderId: newOrder.id,
          orderCode: newOrder.orderCode,
          sellerId,
          sellerName: agreement.sellerName,
          vendorId: newOrder.vendorId,
          vendorName: newOrder.vendorName,
          agreementId: agreement.id,
          basisAmount: quote.subtotal,
          commissionAmount: commAmt,
          status: 'Estimated',
          paymentRef: null,
          updatedAt: new Date().toISOString().slice(0, 10),
        };
        nextCommissions = [newComm, ...nextCommissions];
      }

      return {
        ...prev,
        dakshMarket: {
          ...prev.dakshMarket,
          orders: [newOrder, ...prev.dakshMarket.orders],
          commissions: nextCommissions,
          quotations: prev.dakshMarket.quotations.map((q) => {
            if (q.id === quote.id) return { ...q, status: 'Awarded' };
            if (q.rfqId === quote.rfqId) return { ...q, status: 'Rejected' };
            return q;
          }),
          rfqs: prev.dakshMarket.rfqs.map((r) =>
            r.id === rfq.id ? { ...r, status: 'Awarded' } : r
          ),
          requirements: prev.dakshMarket.requirements.map((req) =>
            req.id === rfq.requirementId ? { ...req, status: 'Awarded' } : req
          ),
        },
        auditLogs: appendAudit(
          prev,
          'Procurement PO',
          'Quotation Awarded to PO',
          `${newOrder.orderCode} awarded to ${newOrder.vendorId} (${newOrder.vendorName}) · Landed ₹${newOrder.landedTotal}`
        ),
      };
    });

    return newOrder;
  };

  const advanceB2bOrderStage = (
    orderId: string,
    stage: B2bOrderStage,
    referenceNote: string,
    syncToGramosStock = false
  ) => {
    setState((prev) => {
      const target = prev.dakshMarket.orders.find((o) => o.id === orderId);
      if (!target) return prev;

      const today = new Date().toISOString().slice(0, 10);
      const updatedOrders = prev.dakshMarket.orders.map((o) => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          stage,
          paymentReference: stage === 'Payment Recorded' ? referenceNote || o.paymentReference : o.paymentReference,
          fulfilmentTracking: stage === 'In Fulfilment' ? referenceNote || o.fulfilmentTracking : o.fulfilmentTracking,
          deliveryAcceptedAt: stage === 'Delivered & Accepted' ? today : o.deliveryAcceptedAt,
          syncedToGramosInventory:
            stage === 'Delivered & Accepted' && syncToGramosStock ? true : o.syncedToGramosInventory,
        };
      });

      // Transition Estimated Commission -> Accrued upon Delivered & Accepted
      let updatedCommissions = prev.dakshMarket.commissions;
      if (stage === 'Delivered & Accepted') {
        updatedCommissions = prev.dakshMarket.commissions.map((c) =>
          c.orderId === orderId && c.status === 'Estimated'
            ? { ...c, status: 'Accrued', updatedAt: today }
            : c
        );
      }

      // Sync to GRAMOS Mart Supplier Credit ledger if GRAMOS Mart is the Buyer and delivery is accepted
      let updatedCredits = prev.creditEntries;
      if (stage === 'Delivered & Accepted' && syncToGramosStock && !target.syncedToGramosInventory) {
        const vendorOrg = prev.dakshMarket.organizations.find((o) => o.orgId === target.vendorOrgId);
        const due = new Date();
        due.setDate(due.getDate() + 15);
        updatedCredits = [
          {
            id: `crd-dm-${Date.now()}`,
            supplierId: vendorOrg?.linkedSupplierId || 'sup-1',
            supplierName: target.vendorName,
            invoiceNo: target.orderCode,
            purchaseDate: today,
            dueDate: due.toISOString().slice(0, 10),
            creditDays: 15,
            totalAmount: target.landedTotal,
            paidAmount: target.paymentReference ? target.landedTotal : 0,
            disputedAmount: 0,
            notes: `DAKSH MARKET B2B Order ${target.orderCode} accepted · ${target.title}`,
          },
          ...prev.creditEntries,
        ];
      }

      return {
        ...prev,
        creditEntries: updatedCredits,
        dakshMarket: {
          ...prev.dakshMarket,
          orders: updatedOrders,
          commissions: updatedCommissions,
        },
        auditLogs: appendAudit(
          prev,
          'B2B Order Fulfilment',
          stage,
          `${target.orderCode} -> ${stage}${referenceNote ? ` · ${referenceNote}` : ''}`
        ),
      };
    });
  };

  const updateCommissionStatus = (
    commissionId: string,
    status: CommissionStatus,
    paymentRef?: string
  ) => {
    setState((prev) => {
      const target = prev.dakshMarket.commissions.find((c) => c.id === commissionId);
      if (!target) return prev;
      const today = new Date().toISOString().slice(0, 10);

      return {
        ...prev,
        dakshMarket: {
          ...prev.dakshMarket,
          commissions: prev.dakshMarket.commissions.map((c) =>
            c.id === commissionId
              ? {
                  ...c,
                  status,
                  paymentRef: paymentRef ?? c.paymentRef,
                  updatedAt: today,
                }
              : c
          ),
        },
        auditLogs: appendAudit(
          prev,
          'Seller Commission Ledger',
          `Commission ${status}`,
          `${target.entryCode} (${target.orderCode}) · ₹${target.commissionAmount} -> ${status}`
        ),
      };
    });
  };

  const createProject = (input: {
    name: string;
    clientOrgId: string;
    location: string;
    totalBudget: number;
    targetLaunchDate: string;
    packages: Omit<BoqPackage, 'id'>[];
  }): ProjectProcurement => {
    const client =
      state.dakshMarket.organizations.find((o) => o.orgId === input.clientOrgId) ||
      state.dakshMarket.organizations[0];
    const seq = String(state.dakshMarket.projects.length + 1).padStart(6, '0');
    const newProject: ProjectProcurement = {
      id: `dm-prj-${Date.now()}`,
      projectCode: `PRJ-${seq}`,
      name: input.name.trim(),
      clientOrgId: client.orgId,
      clientName: client.name,
      location: input.location.trim(),
      totalBudget: input.totalBudget,
      targetLaunchDate: input.targetLaunchDate,
      packages: input.packages.map((p, idx) => ({
        ...p,
        id: `pkg-${Date.now()}-${idx}`,
      })),
      status: 'Active Procurement',
    };

    setState((prev) => ({
      ...prev,
      dakshMarket: {
        ...prev.dakshMarket,
        projects: [newProject, ...prev.dakshMarket.projects],
      },
      auditLogs: appendAudit(
        prev,
        'Project Procurement OS',
        'Project Created',
        `${newProject.projectCode} · ${newProject.name} (Budget ₹${newProject.totalBudget})`
      ),
    }));

    return newProject;
  };

  const updateBoqPackage = (
    projectId: string,
    packageId: string,
    partial: Partial<BoqPackage>
  ) => {
    setState((prev) => ({
      ...prev,
      dakshMarket: {
        ...prev.dakshMarket,
        projects: prev.dakshMarket.projects.map((prj) =>
          prj.id !== projectId
            ? prj
            : {
                ...prj,
                packages: prj.packages.map((pkg) =>
                  pkg.id === packageId ? { ...pkg, ...partial } : pkg
                ),
              }
        ),
      },
      auditLogs: appendAudit(
        prev,
        'Project Procurement OS',
        'BOQ Package Updated',
        `Project ${projectId} package updated`
      ),
    }));
  };

  const convertEnquiryToRequirement = (enquiryId: string) => {
    const enq = state.enquiries.find((e) => e.id === enquiryId);
    if (!enq) return;

    createRequirement({
      buyerOrgId: 'ORG-000001',
      title: `Customer Demand Sourcing: ${enq.requestedItem}`,
      rawPrompt: `Converted from GRAMOS Mart CRM Enquiry (${enq.channel}) by ${enq.customerName}: ${enq.requestedItem}. Notes: ${enq.notes || 'None'}`,
      deliveryLocation: 'GRAMOS Mart, Kotri Steel Bridge, Kota, Rajasthan',
      targetDeliveryDate: null,
      budgetCeiling: null,
      installationNeeded: false,
      missingInfoFlags: ['Target B2B procurement budget not specified', 'Required delivery date not specified'],
      items: [
        {
          description: enq.requestedItem,
          industry: 'Food and Grocery',
          category: 'Customer Requested SKU',
          offeringType: 'Physical Product',
          qty: 20,
          unit: 'Units',
          specs: enq.notes || 'Verify regional availability & wholesale MOQ',
        },
      ],
      sourceEnquiryId: enq.id,
    });

    updateEnquiryStatus(enq.id, 'Sourcing Evaluated');
    setDakshTab('buyer');
    setActiveNav('daksh');
  };

  /* --------------------------------------------------------------------------
   * GRAMOSFUEL Brand & Product Sourcing OS (DKS-P04-GF / GF-PF-001)
   * ------------------------------------------------------------------------ */

  const createProductCandidate = (input: {
    name: string;
    industryGroup: GramosfuelIndustryGroup;
    category: string;
    unitSize: string;
    customerProblem: string;
    competitorBenchmark: string;
    targetPriceBand: string;
    sourcingModel: ProductCandidate['sourcingModel'];
    linkedSupplierId?: string;
    sourceEnquiryId?: string;
  }): ProductCandidate => {
    const seq = String(state.gramosfuel.candidates.length + 1).padStart(3, '0');
    const today = new Date().toISOString().slice(0, 10);
    const newCandidate: ProductCandidate = {
      id: `gf-cand-${Date.now()}`,
      ideaCode: `GF-PRD-${seq}`,
      name: input.name.trim(),
      industryGroup: input.industryGroup,
      category: input.category.trim() || 'Everyday Consumer Product',
      unitSize: input.unitSize.trim() || '500 g',
      stage: 'Stage 1 — Idea',
      isStartingHypothesis: false,
      customerProblem: input.customerProblem.trim(),
      competitorBenchmark: input.competitorBenchmark.trim(),
      targetPriceBand: input.targetPriceBand.trim() || 'TBD after costing',
      sourcingModel: input.sourcingModel,
      linkedSupplierId: input.linkedSupplierId,
      sourceEnquiryId: input.sourceEnquiryId,
      economics: {
        manufacturingCost: 50,
        packagingCost: 6,
        labellingCost: 2,
        transportationCost: 4,
        storageCost: 1,
        taxesPerUnit: 4,
        distributorMarginPerUnit: 6,
        retailerMarginPerUnit: 10,
        marketingPerUnit: 2,
        wastageReservePerUnit: 2,
        proposedMrp: 115,
        proposedSellingPrice: 105,
        pilotBatchUnits: 50,
      },
      spec: {
        ingredientsOrMaterials: 'To be documented during Stage 4 & 6 verification',
        compositionSummary: 'Standard consumer spec pending sample evaluation',
        packagingSpec: 'Food-grade / sealed tamper-evident packaging',
        qualityRequirements: 'Zero moisture ingress, batch stamp mandatory',
        storageConditions: 'Clean dry shelf away from direct sunlight',
        shelfLifeDays: 180,
        fssaiOrLicenceVerified: false,
        labellingAndAllergenChecked: false,
        noUnsubstantiatedClaimsVerified: true,
        batchTraceabilityReady: false,
      },
      commercialDecision: 'Pending Review',
      decisionNotes: 'Created in GRAMOSFUEL Product Launch System.',
      createdAt: today,
      updatedAt: today,
    };

    setState((prev) => ({
      ...prev,
      gramosfuel: {
        ...prev.gramosfuel,
        candidates: [newCandidate, ...prev.gramosfuel.candidates],
      },
      auditLogs: appendAudit(
        prev,
        'GRAMOSFUEL Sourcing',
        'Product Idea Registered',
        `${newCandidate.ideaCode} · ${newCandidate.name} (${newCandidate.industryGroup})`
      ),
    }));

    return newCandidate;
  };

  const advanceCandidateStage = (candidateId: string, stage: GramosfuelLaunchStage) => {
    const today = new Date().toISOString().slice(0, 10);
    setState((prev) => ({
      ...prev,
      gramosfuel: {
        ...prev.gramosfuel,
        candidates: prev.gramosfuel.candidates.map((c) =>
          c.id === candidateId ? { ...c, stage, updatedAt: today } : c
        ),
      },
      auditLogs: appendAudit(
        prev,
        'GRAMOSFUEL Launch',
        'Stage Updated',
        `Candidate ${candidateId} moved to ${stage}`
      ),
    }));
  };

  const recordSampleEvaluation = (
    sampleInput: Omit<SampleEvaluation, 'id' | 'sampleCode'>
  ): SampleEvaluation => {
    const seq = String(state.gramosfuel.samples.length + 1).padStart(2, '0');
    const newSample: SampleEvaluation = {
      ...sampleInput,
      id: `smp-${Date.now()}`,
      sampleCode: `SMP-2611-${seq}`,
    };
    const today = new Date().toISOString().slice(0, 10);

    setState((prev) => ({
      ...prev,
      gramosfuel: {
        ...prev.gramosfuel,
        samples: [newSample, ...prev.gramosfuel.samples],
        candidates: prev.gramosfuel.candidates.map((c) => {
          if (c.id !== newSample.candidateId) return c;
          const shouldAdvance =
            newSample.verdict === 'Approved' &&
            (c.stage === 'Stage 1 — Idea' ||
              c.stage === 'Stage 2 — Research' ||
              c.stage === 'Stage 3 — Supplier Discovery' ||
              c.stage === 'Stage 4 — Sample');
          return {
            ...c,
            linkedSupplierId: newSample.supplierId || c.linkedSupplierId,
            stage: shouldAdvance ? 'Stage 5 — Costing' : c.stage,
            updatedAt: today,
          };
        }),
      },
      auditLogs: appendAudit(
        prev,
        'Sample Register',
        `Sample ${newSample.verdict}`,
        `${newSample.sampleCode} · ${newSample.candidateName} (${newSample.supplierName})`
      ),
    }));

    return newSample;
  };

  const updateCandidateEconomics = (
    candidateId: string,
    economics: Partial<ProductUnitEconomics>
  ) => {
    const today = new Date().toISOString().slice(0, 10);
    setState((prev) => ({
      ...prev,
      gramosfuel: {
        ...prev.gramosfuel,
        candidates: prev.gramosfuel.candidates.map((c) =>
          c.id === candidateId
            ? { ...c, economics: { ...c.economics, ...economics }, updatedAt: today }
            : c
        ),
      },
      auditLogs: appendAudit(
        prev,
        'GRAMOSFUEL Costing',
        'Unit Economics Updated',
        `Updated financial control & unit costing for ${candidateId}`
      ),
    }));
  };

  const updateCandidateSpec = (candidateId: string, spec: Partial<ProductQualitySpec>) => {
    const today = new Date().toISOString().slice(0, 10);
    setState((prev) => ({
      ...prev,
      gramosfuel: {
        ...prev.gramosfuel,
        candidates: prev.gramosfuel.candidates.map((c) =>
          c.id === candidateId ? { ...c, spec: { ...c.spec, ...spec }, updatedAt: today } : c
        ),
      },
    }));
  };

  const linkCandidateSupplier = (
    candidateId: string,
    supplierId: string,
    dakshVendorId?: string
  ) => {
    const today = new Date().toISOString().slice(0, 10);
    setState((prev) => ({
      ...prev,
      gramosfuel: {
        ...prev.gramosfuel,
        candidates: prev.gramosfuel.candidates.map((c) =>
          c.id === candidateId
            ? {
                ...c,
                linkedSupplierId: supplierId,
                linkedDakshVendorId: dakshVendorId,
                stage:
                  c.stage === 'Stage 1 — Idea' ||
                  c.stage === 'Stage 2 — Research' ||
                  c.stage === 'Stage 3 — Supplier Discovery'
                    ? 'Stage 4 — Sample'
                    : c.stage,
                updatedAt: today,
              }
            : c
        ),
      },
      auditLogs: appendAudit(
        prev,
        'GRAMOSFUEL Sourcing',
        'Supplier Linked',
        `Candidate ${candidateId} linked to supplier ${supplierId}${dakshVendorId ? ` (${dakshVendorId})` : ''}`
      ),
    }));
  };

  const sendCandidateToDakshRfq = (candidateId: string) => {
    const cand = state.gramosfuel.candidates.find((c) => c.id === candidateId);
    if (!cand) return;

    const req = createRequirement({
      buyerOrgId: 'ORG-000001',
      title: `GRAMOSFUEL Contract Mfg Sourcing: ${cand.name}`,
      rawPrompt: `Source contract manufacturer / supplier for GRAMOSFUEL ${cand.name} (${cand.unitSize}). Model: ${cand.sourcingModel}. Specs: ${cand.spec.packagingSpec}`,
      deliveryLocation: 'GRAMOS Mart, Kotri Steel Bridge, Kota, Rajasthan',
      targetDeliveryDate: null,
      budgetCeiling:
        cand.economics.manufacturingCost * cand.economics.pilotBatchUnits +
        cand.economics.packagingCost * cand.economics.pilotBatchUnits,
      installationNeeded: false,
      missingInfoFlags: ['Required pilot delivery date not specified'],
      items: [
        {
          description: `${cand.name} (${cand.unitSize})`,
          industry: 'GRAMOSFUEL Consumer Products',
          category: cand.category,
          offeringType: 'Made-to-Order',
          qty: cand.economics.pilotBatchUnits,
          unit: 'Units',
          specs: `${cand.spec.ingredientsOrMaterials} · ${cand.spec.packagingSpec}`,
        },
      ],
    });

    const today = new Date().toISOString().slice(0, 10);
    setState((prev) => ({
      ...prev,
      gramosfuel: {
        ...prev.gramosfuel,
        candidates: prev.gramosfuel.candidates.map((c) =>
          c.id === candidateId
            ? {
                ...c,
                linkedDakshReqId: req.reqCode,
                stage:
                  c.stage === 'Stage 1 — Idea' || c.stage === 'Stage 2 — Research'
                    ? 'Stage 3 — Supplier Discovery'
                    : c.stage,
                updatedAt: today,
              }
            : c
        ),
      },
    }));

    setDakshTab('buyer');
    setActiveNav('daksh');
  };

  const launchCandidateToPilotInventory = (candidateId: string): Product | null => {
    const cand = state.gramosfuel.candidates.find((c) => c.id === candidateId);
    if (!cand) return null;

    // Gate check: compliance & batch traceability must be checked before pilot retail release
    if (
      !cand.spec.fssaiOrLicenceVerified ||
      !cand.spec.labellingAndAllergenChecked ||
      !cand.spec.noUnsubstantiatedClaimsVerified ||
      !cand.spec.batchTraceabilityReady
    ) {
      return null;
    }

    if (cand.linkedRetailProductId) {
      const existing = state.products.find((p) => p.id === cand.linkedRetailProductId);
      if (existing) return existing;
    }

    const seq = String(state.products.length + 1).padStart(3, '0');
    const today = new Date().toISOString().slice(0, 10);
    const expiryDate = cand.spec.shelfLifeDays
      ? new Date(Date.now() + cand.spec.shelfLifeDays * 86400000).toISOString().slice(0, 10)
      : null;

    const landedCost =
      cand.economics.manufacturingCost +
      cand.economics.packagingCost +
      cand.economics.labellingCost +
      cand.economics.transportationCost +
      cand.economics.taxesPerUnit;

    const newProdId = `prod-gf-${Date.now()}`;
    const newProduct: Product = {
      id: newProdId,
      sku: `GRM-02-01-01-${seq}`,
      name: cand.name.startsWith('GRAMOSFUEL') ? cand.name : `GRAMOSFUEL ${cand.name}`,
      brand: 'GRAMOSFUEL',
      industry: 'GRAMOSFUEL Consumer Products',
      category: cand.category,
      subcategory: cand.industryGroup.split('—')[1]?.trim() || cand.category,
      unitSize: cand.unitSize,
      ownershipType: 'Self-Funded',
      sourceType:
        cand.sourcingModel === 'Private Label'
          ? 'White-Label'
          : cand.sourcingModel === 'Regional Hadoti / Gramodaya'
          ? 'Regional Producer'
          : 'Third-Party Manufacturing',
      supplierId: cand.linkedSupplierId || state.suppliers[0]?.id || 'sup-1',
      batchNumber: `GF-PLT-${seq}`,
      mfgDate: today,
      expiryDate,
      purchaseCost:
        cand.economics.manufacturingCost +
        cand.economics.packagingCost +
        cand.economics.labellingCost,
      freightAndHandling: cand.economics.transportationCost,
      packagingAndTax: cand.economics.taxesPerUnit,
      landedCost,
      mrp: cand.economics.proposedMrp,
      sellingPrice: cand.economics.proposedSellingPrice,
      gstPercent: 5,
      stockQty: cand.economics.pilotBatchUnits,
      quarantinedQty: 0,
      reorderLevel: Math.max(10, Math.round(cand.economics.pilotBatchUnits * 0.25)),
      velocity: 'Medium',
      reviewAction: 'Maintain',
      zone: cand.industryGroup === 'Industry B — Household Essentials' ? 'Zone E' : 'Zone C',
      active: true,
    };

    setState((prev) => ({
      ...prev,
      products: [newProduct, ...prev.products],
      movements: [
        {
          id: `mov-gf-${Date.now()}`,
          date: today,
          productId: newProduct.id,
          sku: newProduct.sku,
          productName: newProduct.name,
          ownershipType: 'Self-Funded',
          movementType: 'Opening Stock',
          qtyDelta: newProduct.stockQty,
          reason: `GRAMOSFUEL Stage 7 Pilot Launch (${cand.ideaCode})`,
          actor: activeRole,
        },
        ...prev.movements,
      ],
      gramosfuel: {
        ...prev.gramosfuel,
        candidates: prev.gramosfuel.candidates.map((c) =>
          c.id === candidateId
            ? {
                ...c,
                stage: 'Stage 7 — Pilot',
                linkedRetailProductId: newProduct.id,
                updatedAt: today,
              }
            : c
        ),
      },
      auditLogs: appendAudit(
        prev,
        'GRAMOSFUEL Launch',
        'Pilot SKU Launched to GRAMOS Mart',
        `${cand.ideaCode} -> ${newProduct.sku} (${newProduct.stockQty} units @ ₹${newProduct.sellingPrice})`
      ),
    }));

    return newProduct;
  };

  const decideCandidateCommercial = (
    candidateId: string,
    outcome: CommercialDecisionOutcome,
    notes: string
  ) => {
    const today = new Date().toISOString().slice(0, 10);
    setState((prev) => {
      const target = prev.gramosfuel.candidates.find((c) => c.id === candidateId);
      if (!target) return prev;

      const mappedReview: Product['reviewAction'] =
        outcome === 'Expand'
          ? 'Expand'
          : outcome === 'Revise'
          ? 'Improve'
          : outcome === 'Pause'
          ? 'Reduce'
          : outcome === 'Discontinue'
          ? 'Discontinue'
          : 'Maintain';

      const updatedProducts = target.linkedRetailProductId
        ? prev.products.map((p) =>
            p.id === target.linkedRetailProductId ? { ...p, reviewAction: mappedReview } : p
          )
        : prev.products;

      return {
        ...prev,
        products: updatedProducts,
        gramosfuel: {
          ...prev.gramosfuel,
          candidates: prev.gramosfuel.candidates.map((c) =>
            c.id === candidateId
              ? {
                  ...c,
                  stage: 'Stage 9 — Commercial Decision',
                  commercialDecision: outcome,
                  decisionNotes: notes || c.decisionNotes,
                  updatedAt: today,
                }
              : c
          ),
        },
        auditLogs: appendAudit(
          prev,
          'GRAMOSFUEL Commercial',
          `Decision: ${outcome}`,
          `${target.ideaCode} · ${target.name} -> ${outcome}${notes ? ` (${notes})` : ''}`
        ),
      };
    });
  };

  const convertEnquiryToGramosfuelIdea = (enquiryId: string) => {
    const enq = state.enquiries.find((e) => e.id === enquiryId);
    if (!enq) return;

    createProductCandidate({
      name: enq.requestedItem,
      industryGroup: 'Industry A — Food and Nutrition',
      category: 'Customer Demand Idea',
      unitSize: 'Standard Pack',
      customerProblem: `Requested via ${enq.channel} by ${enq.customerName}: ${enq.notes || enq.requestedItem}`,
      competitorBenchmark: 'Evaluate Kota retail shelf & local mandi pricing',
      targetPriceBand: 'Evaluate in Stage 5 Costing',
      sourcingModel: 'Contract Manufacturing',
      sourceEnquiryId: enq.id,
    });

    updateEnquiryStatus(enq.id, 'Sourcing Evaluated');
    setGramosfuelTab('pipeline');
    setActiveNav('gramosfuel');
  };

  const toggleManufacturerCheckField = (
    checkId: string,
    field: keyof Omit<ContractManufacturerChecklist, 'id' | 'supplierId' | 'supplierName' | 'dakshVendorId' | 'notes'>
  ) => {
    setState((prev) => ({
      ...prev,
      gramosfuel: {
        ...prev.gramosfuel,
        manufacturerChecks: prev.gramosfuel.manufacturerChecks.map((mc) =>
          mc.id === checkId ? { ...mc, [field]: !mc[field] } : mc
        ),
      },
    }));
  };

  const toggleGfDocumentCheck = (docId: string) => {
    setState((prev) => ({
      ...prev,
      gramosfuel: {
        ...prev.gramosfuel,
        documentationRoadmap: prev.gramosfuel.documentationRoadmap.map((d) =>
          d.id === docId ? { ...d, completed: !d.completed } : d
        ),
      },
    }));
  };

  const updateDistributionPhaseStatus = (
    phaseId: string,
    status: DistributionPhaseGate['status']
  ) => {
    setState((prev) => ({
      ...prev,
      gramosfuel: {
        ...prev.gramosfuel,
        distributionPhases: prev.gramosfuel.distributionPhases.map((p) =>
          p.id === phaseId ? { ...p, status } : p
        ),
      },
      auditLogs: appendAudit(
        prev,
        'GRAMOSFUEL Distribution',
        'Expansion Gate Updated',
        `Distribution phase ${phaseId} -> ${status}`
      ),
    }));
  };

  /* --------------------------------------------------------------------------
   * Enterprise Governance OS (Docs 13–16: Legal, QA, HR & Logistics)
   * ------------------------------------------------------------------------ */

  const updateEntityVerificationStatus = (
    itemId: string,
    status: EntityVerificationStatus
  ) => {
    setState((prev) => ({
      ...prev,
      governance: {
        ...prev.governance,
        entityVerifications: prev.governance.entityVerifications.map((ev) =>
          ev.id === itemId ? { ...ev, status } : ev
        ),
      },
      auditLogs: appendAudit(
        prev,
        'Legal & Compliance (GRM-LGL-001)',
        'Entity Check Updated',
        `Verification item ${itemId} -> ${status}`
      ),
    }));
  };

  const toggleLegalChecklistItem = (itemId: string) => {
    setState((prev) => ({
      ...prev,
      governance: {
        ...prev.governance,
        legalChecklist: prev.governance.legalChecklist.map((item) =>
          item.id === itemId ? { ...item, completed: !item.completed } : item
        ),
      },
    }));
  };

  const toggleShopClauseConfirmed = (clauseId: string) => {
    setState((prev) => ({
      ...prev,
      governance: {
        ...prev.governance,
        shopAgreementClauses: prev.governance.shopAgreementClauses.map((cl) =>
          cl.id === clauseId ? { ...cl, confirmed: !cl.confirmed } : cl
        ),
      },
    }));
  };

  const updateCategoryComplianceStatus = (
    categoryId: string,
    status: CategoryComplianceRule['status']
  ) => {
    setState((prev) => ({
      ...prev,
      governance: {
        ...prev.governance,
        categoryCompliance: prev.governance.categoryCompliance.map((cat) =>
          cat.id === categoryId ? { ...cat, status } : cat
        ),
      },
      auditLogs: appendAudit(
        prev,
        'Legal & Compliance (GRM-LGL-001)',
        'Category Gate Updated',
        `Category ${categoryId} -> ${status}`
      ),
    }));
  };

  const toggleLegalFolderReady = (folderId: string) => {
    setState((prev) => ({
      ...prev,
      governance: {
        ...prev.governance,
        legalFolders: prev.governance.legalFolders.map((lf) =>
          lf.id === folderId ? { ...lf, ready: !lf.ready } : lf
        ),
      },
    }));
  };

  const recordProductApproval = (
    approval: Omit<ProductApprovalRecord, 'id' | 'reviewedDate'>
  ) => {
    const today = new Date().toISOString().slice(0, 10);
    const entry: ProductApprovalRecord = {
      ...approval,
      id: `qa-pa-${Date.now()}`,
      reviewedDate: today,
    };

    setState((prev) => ({
      ...prev,
      governance: {
        ...prev.governance,
        productApprovals: [
          entry,
          ...prev.governance.productApprovals.filter((p) => p.productId !== approval.productId),
        ],
      },
      auditLogs: appendAudit(
        prev,
        'Quality Assurance (GRM-QAC-001)',
        `Product ${approval.decision}`,
        `${approval.sku} · ${approval.productName}`
      ),
    }));
  };

  const recordGrnInspection = (
    inspection: Omit<GrnInspectionRecord, 'id' | 'grnCode'>
  ): GrnInspectionRecord => {
    const seq = String(state.governance.grnInspections.length + 1).padStart(6, '0');
    const newGrn: GrnInspectionRecord = {
      ...inspection,
      id: `grn-${Date.now()}`,
      grnCode: `GRM-GRN-${seq}`,
    };

    setState((prev) => ({
      ...prev,
      governance: {
        ...prev.governance,
        grnInspections: [newGrn, ...prev.governance.grnInspections],
      },
      auditLogs: appendAudit(
        prev,
        'Receiving QA (GRM-QAC-001)',
        `GRN ${newGrn.decision}`,
        `${newGrn.grnCode} · ${newGrn.productName} (${newGrn.passedPoints.length}/13 checks)`
      ),
    }));

    return newGrn;
  };

  const createRecallCase = (
    recall: Omit<RecallRecord, 'id' | 'recallCode'>,
    quarantineNowQty = 0
  ): RecallRecord => {
    const seq = String(state.governance.recalls.length + 1).padStart(6, '0');
    const newRecall: RecallRecord = {
      ...recall,
      id: `rcl-${Date.now()}`,
      recallCode: `GRM-RCL-${seq}`,
    };
    const today = new Date().toISOString().slice(0, 10);

    setState((prev) => {
      let updatedProducts = prev.products;
      let updatedMovements = prev.movements;

      if (quarantineNowQty > 0) {
        const targetProd = prev.products.find((p) => p.id === recall.productId);
        if (targetProd) {
          const safeQty = Math.min(targetProd.stockQty, quarantineNowQty);
          updatedProducts = prev.products.map((p) =>
            p.id === recall.productId
              ? {
                  ...p,
                  stockQty: Math.max(0, p.stockQty - safeQty),
                  quarantinedQty: p.quarantinedQty + safeQty,
                }
              : p
          );
          if (safeQty > 0) {
            updatedMovements = [
              {
                id: `mov-rcl-${Date.now()}`,
                date: today,
                productId: targetProd.id,
                sku: targetProd.sku,
                productName: targetProd.name,
                ownershipType: targetProd.ownershipType,
                movementType: 'Damage Quarantine',
                qtyDelta: -safeQty,
                reason: `Stop-Sale Recall Quarantine (${newRecall.recallCode}) · ${recall.reason}`,
                actor: activeRole,
              },
              ...prev.movements,
            ];
          }
        }
      }

      return {
        ...prev,
        products: updatedProducts,
        movements: updatedMovements,
        governance: {
          ...prev.governance,
          recalls: [newRecall, ...prev.governance.recalls],
        },
        auditLogs: appendAudit(
          prev,
          'Recall Management (GRM-QAC-001)',
          'Recall Case Opened',
          `${newRecall.recallCode} · ${newRecall.productName} (Batch ${newRecall.batchNo})`
        ),
      };
    });

    return newRecall;
  };

  const updateRecallStatus = (recallId: string, status: RecallStatus) => {
    setState((prev) => ({
      ...prev,
      governance: {
        ...prev.governance,
        recalls: prev.governance.recalls.map((r) =>
          r.id === recallId ? { ...r, status } : r
        ),
      },
      auditLogs: appendAudit(
        prev,
        'Recall Management (GRM-QAC-001)',
        'Recall Status Updated',
        `${recallId} -> ${status}`
      ),
    }));
  };

  const toggleQualityAuditTask = (taskId: string) => {
    const today = new Date().toISOString().slice(0, 10);
    setState((prev) => ({
      ...prev,
      governance: {
        ...prev.governance,
        qualityAudits: prev.governance.qualityAudits.map((t) =>
          t.id === taskId
            ? {
                ...t,
                completed: !t.completed,
                lastCompletedDate: !t.completed ? today : t.lastCompletedDate,
              }
            : t
        ),
      },
    }));
  };

  const setStaffingModel = (model: StaffingModelOption) => {
    setState((prev) => ({
      ...prev,
      governance: {
        ...prev.governance,
        staffingModel: model,
      },
      auditLogs: appendAudit(
        prev,
        'HR & Staffing (GRM-HR-001)',
        'Staffing Model Updated',
        model
      ),
    }));
  };

  const addEmployee = (
    emp: Omit<EmployeeRecord, 'id' | 'empCode' | 'status' | 'exitAccessRevoked'>
  ): EmployeeRecord => {
    const seq = String(state.governance.employees.length + 1).padStart(3, '0');
    const newEmp: EmployeeRecord = {
      ...emp,
      id: `emp-${Date.now()}`,
      empCode: `EMP-${seq}`,
      status: 'Active',
      exitAccessRevoked: false,
    };

    setState((prev) => ({
      ...prev,
      governance: {
        ...prev.governance,
        employees: [...prev.governance.employees, newEmp],
      },
      auditLogs: appendAudit(
        prev,
        'HR & Staffing (GRM-HR-001)',
        'Staff Onboarded',
        `${newEmp.empCode} · ${newEmp.name} (${newEmp.roleTitle})`
      ),
    }));

    return newEmp;
  };

  const toggleEmployeeTrainingModule = (
    empId: string,
    moduleKey: keyof EmployeeTrainingMatrix
  ) => {
    setState((prev) => ({
      ...prev,
      governance: {
        ...prev.governance,
        employees: prev.governance.employees.map((e) =>
          e.id === empId
            ? {
                ...e,
                trainingModules: {
                  ...e.trainingModules,
                  [moduleKey]: !e.trainingModules[moduleKey],
                },
              }
            : e
        ),
      },
    }));
  };

  const markEmployeeExitRevoked = (empId: string) => {
    setState((prev) => ({
      ...prev,
      governance: {
        ...prev.governance,
        employees: prev.governance.employees.map((e) =>
          e.id === empId ? { ...e, status: 'Exited', exitAccessRevoked: true } : e
        ),
      },
      auditLogs: appendAudit(
        prev,
        'HR & Exit Control (GRM-HR-001)',
        'Staff Exit & Access Revoked',
        `Revoked POS/inventory/keys/UPI access for ${empId}`
      ),
    }));
  };

  const recordAttendance = (entry: Omit<AttendanceEntry, 'id'>) => {
    const newAtt: AttendanceEntry = {
      ...entry,
      id: `att-${Date.now()}`,
    };
    setState((prev) => ({
      ...prev,
      governance: {
        ...prev.governance,
        attendance: [newAtt, ...prev.governance.attendance],
      },
    }));
  };

  const recordPayrollEntry = (
    entry: Omit<PayrollEntry, 'id'>,
    syncToExpenses = false
  ) => {
    const newPay: PayrollEntry = {
      ...entry,
      id: `pay-${Date.now()}`,
    };
    setState((prev) => ({
      ...prev,
      expenses:
        syncToExpenses && entry.status === 'Paid'
          ? [
              {
                id: `exp-hr-${Date.now()}`,
                date: entry.paymentDate,
                category: 'Fixed / Recurring',
                head: 'Staff Salaries',
                description: `Payroll ${entry.month} · ${entry.empName} (${entry.empCode})`,
                amount: entry.netPaid,
                paymentMode: 'Bank / UPI',
                approvedBy: activeRole,
                voucherRef: entry.paymentRef || entry.empCode,
              },
              ...prev.expenses,
            ]
          : prev.expenses,
      governance: {
        ...prev.governance,
        payroll: [newPay, ...prev.governance.payroll],
      },
      auditLogs: appendAudit(
        prev,
        'HR Payroll (GRM-HR-001)',
        'Payroll Recorded',
        `${entry.empName} (${entry.month}) · ₹${entry.netPaid} · ${entry.status}`
      ),
    }));
  };

  const createDispatchRecord = (
    dispatch: Omit<DispatchRecord, 'id' | 'dispatchCode' | 'deliveryCode'>
  ): DispatchRecord => {
    const seq = String(state.governance.dispatches.length + 1).padStart(6, '0');
    const newDispatch: DispatchRecord = {
      ...dispatch,
      id: `dsp-${Date.now()}`,
      dispatchCode: `GRM-DSP-${seq}`,
      deliveryCode: `GRM-DEL-${seq}`,
    };

    setState((prev) => ({
      ...prev,
      governance: {
        ...prev.governance,
        dispatches: [newDispatch, ...prev.governance.dispatches],
      },
      auditLogs: appendAudit(
        prev,
        'Logistics & Dispatch (GRM-LOG-001)',
        'Dispatch Logged',
        `${newDispatch.dispatchCode} -> ${newDispatch.customerOrDestination} (${newDispatch.deliveryModel})`
      ),
    }));

    return newDispatch;
  };

  const updateDispatchStatus = (
    dispatchId: string,
    status: DispatchStatus,
    podNote?: string
  ) => {
    const nowStamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
    setState((prev) => ({
      ...prev,
      governance: {
        ...prev.governance,
        dispatches: prev.governance.dispatches.map((d) =>
          d.id === dispatchId
            ? {
                ...d,
                status,
                deliveredAt: status === 'Delivered — POD Verified' ? nowStamp : d.deliveredAt,
                podNote: podNote !== undefined ? podNote : d.podNote,
              }
            : d
        ),
      },
      auditLogs: appendAudit(
        prev,
        'Logistics & Dispatch (GRM-LOG-001)',
        `Dispatch ${status}`,
        `${dispatchId}${podNote ? ` · ${podNote}` : ''}`
      ),
    }));
  };

  const createStockTransfer = (
    transfer: Omit<StockTransferRecord, 'id' | 'transferCode'>
  ): StockTransferRecord => {
    const seq = String(state.governance.stockTransfers.length + 1).padStart(6, '0');
    const newTransfer: StockTransferRecord = {
      ...transfer,
      id: `stk-${Date.now()}`,
      transferCode: `GRM-STK-${seq}`,
    };

    // Note: "A stock transfer is not a sale" — zero revenue impact
    setState((prev) => ({
      ...prev,
      governance: {
        ...prev.governance,
        stockTransfers: [newTransfer, ...prev.governance.stockTransfers],
      },
      auditLogs: appendAudit(
        prev,
        'Stock Transfer (GRM-LOG-001)',
        'Non-Sale Stock Transfer Created',
        `${newTransfer.transferCode} · ${newTransfer.qty}x ${newTransfer.productName} (${newTransfer.fromOutlet} -> ${newTransfer.toOutlet})`
      ),
    }));

    return newTransfer;
  };

  const markTransferReceived = (transferId: string) => {
    setState((prev) => ({
      ...prev,
      governance: {
        ...prev.governance,
        stockTransfers: prev.governance.stockTransfers.map((t) =>
          t.id === transferId ? { ...t, status: 'Received & Verified' } : t
        ),
      },
    }));
  };

  const recordProducerCollection = (
    collection: Omit<ProducerCollectionRecord, 'id' | 'collectionCode'>
  ): ProducerCollectionRecord => {
    const seq = String(state.governance.producerCollections.length + 1).padStart(6, '0');
    const newCol: ProducerCollectionRecord = {
      ...collection,
      id: `col-${Date.now()}`,
      collectionCode: `GRM-COL-${seq}`,
    };

    setState((prev) => ({
      ...prev,
      governance: {
        ...prev.governance,
        producerCollections: [newCol, ...prev.governance.producerCollections],
      },
      auditLogs: appendAudit(
        prev,
        'Hadoti Collection (GRM-LOG-001)',
        'Producer Pickup Logged',
        `${newCol.collectionCode} · ${newCol.producerName} (${newCol.qtyCollected} ${newCol.unit})`
      ),
    }));

    return newCol;
  };

  /* --------------------------------------------------------------------------
   * GRAMOS Universal Product Library (GRM-PL-001) Actions
   * ------------------------------------------------------------------------ */

  const addLibraryProduct: StoreContextValue['addLibraryProduct'] = (input) => {
    const indMeta = PRODUCT_UNIVERSE_INDUSTRIES.find((i) => i.id === input.industry);
    const indCode = indMeta?.code || 'GEN-PRD';
    const seq = String(state.productLibrary.records.length + 1).padStart(4, '0');
    const today = new Date().toISOString().slice(0, 10);

    const newRec: ProductLibraryRecord = {
      id: `pl-${Date.now()}`,
      libraryCode: `GRM-${indCode}-${seq}`,
      batchCode: input.batchCode || 'Batch 01',
      productName: input.productName.trim(),
      variantOrPackSize: input.variantOrPackSize.trim() || 'Standard Pack',
      industry: input.industry,
      category: input.category.trim() || 'General',
      subcategory: input.subcategory.trim() || 'Standard',
      description: input.description.trim(),
      marketRelevance: input.marketRelevance.trim(),
      brandTrack: input.brandTrack,
      sourcingOptions:
        input.sourcingOptions.length > 0 ? input.sourcingOptions : ['Supplier Purchase'],
      status: 'Discovered',
      estimatedCostRange: input.estimatedCostRange.trim() || 'Estimate pending',
      targetSellingPriceRange: input.targetSellingPriceRange.trim() || 'Target TBD',
      actualQuotedLandedCost: null,
      actualProposedSellingPrice: null,
      actualMrp: null,
      quotationSourceRef: 'No verified supplier quotation yet (Discovery only)',
      shelfLifeAndStorage: input.shelfLifeAndStorage.trim() || 'Check storage conditions before sample',
      regulatoryRequirements:
        input.regulatoryRequirements.trim() || 'Verify FSSAI / Legal Metrology / GST before approval',
      sampleTestingNotes: 'Logged into Level 1 Master Product Library; no sample tested yet.',
      testingEvidenceLogged: false,
      rejectionReason: '',
      scorecard: {
        productQuality: 0,
        customerUsefulness: 0,
        marketDemand: 0,
        purchaseCost: 0,
        potentialSellingPrice: 0,
        grossMarginPotential: 0,
        supplierReliability: 0,
        packagingPresentation: 0,
        storageShelfLife: 0,
        repeatPurchasePotential: 0,
      },
      complianceGate: {
        sampleTested: false,
        safetyCheckPassed: false,
        legalLabellingPassed: false,
        qualityTestPassed: false,
      },
      discoveredDate: today,
      updatedAt: today,
    };

    setState((prev) => ({
      ...prev,
      productLibrary: {
        ...prev.productLibrary,
        records: [newRec, ...prev.productLibrary.records],
      },
      auditLogs: appendAudit(
        prev,
        'Product Library (GRM-PL-001)',
        'Discovery Product Added',
        `${newRec.libraryCode} · ${newRec.productName} (${newRec.variantOrPackSize}) -> ${newRec.batchCode}`
      ),
    }));

    return newRec;
  };

  const updateLibraryStatus: StoreContextValue['updateLibraryStatus'] = (
    libraryId,
    status,
    rejectionReason
  ) => {
    const target = state.productLibrary.records.find((r) => r.id === libraryId);
    if (!target) return { ok: false, error: 'Product library record not found.' };

    // Hard Approval & Commercial Gate: high score NEVER overrides failed safety/legal/quality/testing checks
    if (
      status === 'Approved' ||
      status === 'Commercial Catalogue' ||
      status === 'Market Performance'
    ) {
      if (
        !target.testingEvidenceLogged ||
        !target.complianceGate.sampleTested ||
        !target.complianceGate.safetyCheckPassed ||
        !target.complianceGate.legalLabellingPassed ||
        !target.complianceGate.qualityTestPassed
      ) {
        return {
          ok: false,
          error:
            'Approval blocked: Testing evidence and all 4 compliance gates (Sample, Safety, Legal/Labelling, Quality) must pass first.',
        };
      }
      if (
        target.actualQuotedLandedCost === null ||
        target.actualProposedSellingPrice === null ||
        target.actualMrp === null
      ) {
        return {
          ok: false,
          error:
            'Approval blocked: Log a verified supplier quotation (landed cost, selling price & MRP) before approving.',
        };
      }
    }

    if (status === 'Rejected' && (!rejectionReason || !rejectionReason.trim())) {
      return {
        ok: false,
        error: 'Rejection requires a documented reason so the record stays in institutional memory.',
      };
    }

    const today = new Date().toISOString().slice(0, 10);
    setState((prev) => ({
      ...prev,
      productLibrary: {
        ...prev.productLibrary,
        records: prev.productLibrary.records.map((r) =>
          r.id === libraryId
            ? {
                ...r,
                status,
                rejectionReason:
                  status === 'Rejected' ? (rejectionReason || '').trim() : r.rejectionReason,
                updatedAt: today,
              }
            : r
        ),
      },
      auditLogs: appendAudit(
        prev,
        'Product Library (GRM-PL-001)',
        `Workflow -> ${status}`,
        `${target.libraryCode} · ${target.productName}${
          status === 'Rejected' && rejectionReason ? ` (${rejectionReason.trim()})` : ''
        }`
      ),
    }));

    return { ok: true };
  };

  const updateLibraryQuotationAndTesting: StoreContextValue['updateLibraryQuotationAndTesting'] = (
    libraryId,
    partial
  ) => {
    const today = new Date().toISOString().slice(0, 10);
    setState((prev) => {
      const target = prev.productLibrary.records.find((r) => r.id === libraryId);
      if (!target) return prev;

      return {
        ...prev,
        productLibrary: {
          ...prev.productLibrary,
          records: prev.productLibrary.records.map((r) => {
            if (r.id !== libraryId) return r;
            const nextGate: LibraryComplianceGate = {
              ...r.complianceGate,
              ...(partial.complianceGate || {}),
            };
            const nextStatus: LibraryWorkflowStatus =
              r.status === 'Discovered' || r.status === 'Shortlisted'
                ? partial.actualQuotedLandedCost !== undefined && partial.actualQuotedLandedCost !== null
                  ? 'Testing'
                  : partial.linkedSupplierName
                  ? 'Supplier Identified'
                  : r.status
                : r.status;

            return {
              ...r,
              linkedSupplierId:
                partial.linkedSupplierId !== undefined ? partial.linkedSupplierId : r.linkedSupplierId,
              linkedSupplierName:
                partial.linkedSupplierName !== undefined
                  ? partial.linkedSupplierName
                  : r.linkedSupplierName,
              actualQuotedLandedCost:
                partial.actualQuotedLandedCost !== undefined
                  ? partial.actualQuotedLandedCost
                  : r.actualQuotedLandedCost,
              actualProposedSellingPrice:
                partial.actualProposedSellingPrice !== undefined
                  ? partial.actualProposedSellingPrice
                  : r.actualProposedSellingPrice,
              actualMrp: partial.actualMrp !== undefined ? partial.actualMrp : r.actualMrp,
              quotationSourceRef:
                partial.quotationSourceRef !== undefined
                  ? partial.quotationSourceRef
                  : r.quotationSourceRef,
              sampleTestingNotes:
                partial.sampleTestingNotes !== undefined
                  ? partial.sampleTestingNotes
                  : r.sampleTestingNotes,
              testingEvidenceLogged:
                partial.testingEvidenceLogged !== undefined
                  ? partial.testingEvidenceLogged
                  : r.testingEvidenceLogged,
              complianceGate: nextGate,
              status: nextStatus,
              updatedAt: today,
            };
          }),
        },
        auditLogs: appendAudit(
          prev,
          'Product Library (GRM-PL-001)',
          'Quotation / Testing Updated',
          `${target.libraryCode} · ${target.productName}`
        ),
      };
    });
  };

  const updateLibraryScorecard: StoreContextValue['updateLibraryScorecard'] = (
    libraryId,
    scorecard
  ) => {
    const today = new Date().toISOString().slice(0, 10);
    setState((prev) => ({
      ...prev,
      productLibrary: {
        ...prev.productLibrary,
        records: prev.productLibrary.records.map((r) =>
          r.id === libraryId
            ? {
                ...r,
                scorecard: { ...r.scorecard, ...scorecard },
                updatedAt: today,
              }
            : r
        ),
      },
    }));
  };

  const promoteLibraryToCommercialCatalogue: StoreContextValue['promoteLibraryToCommercialCatalogue'] = ({
    libraryId,
    ownershipType,
    zone,
    initialStockQty,
    gstPercent,
    batchNumber,
    expiryDate,
  }) => {
    const rec = state.productLibrary.records.find((r) => r.id === libraryId);
    if (!rec) return { ok: false, error: 'Library record not found.' };

    if (
      !rec.testingEvidenceLogged ||
      !rec.complianceGate.sampleTested ||
      !rec.complianceGate.safetyCheckPassed ||
      !rec.complianceGate.legalLabellingPassed ||
      !rec.complianceGate.qualityTestPassed
    ) {
      return {
        ok: false,
        error:
          'Cannot promote to Level 3 Commercial Catalogue: Sample testing & all 4 safety/legal/quality compliance gates must be passed.',
      };
    }

    if (
      rec.actualQuotedLandedCost === null ||
      rec.actualProposedSellingPrice === null ||
      rec.actualMrp === null
    ) {
      return {
        ok: false,
        error:
          'Cannot promote without verified supplier landed cost, selling price, and MRP.',
      };
    }

    if (rec.status !== 'Approved' && rec.status !== 'Commercial Catalogue') {
      return {
        ok: false,
        error: 'Product must be marked Approved before launching to Commercial Catalogue.',
      };
    }

    if (rec.linkedRetailProductId) {
      const existing = state.products.find((p) => p.id === rec.linkedRetailProductId);
      if (existing) return { ok: true, product: existing };
    }

    const seq = String(state.products.length + 1).padStart(3, '0');
    const today = new Date().toISOString().slice(0, 10);
    const landed = rec.actualQuotedLandedCost;
    const basePurchase = Math.max(1, Math.round(landed * 0.92));
    const freight = Math.max(0, Math.round((landed - basePurchase) * 0.5));
    const taxPack = Math.max(0, landed - basePurchase - freight);

    const mappedBrand =
      rec.brandTrack === 'GRAMOSFUEL'
        ? 'GRAMOSFUEL'
        : rec.brandTrack === 'Made in Hadoti'
        ? 'Made in Hadoti'
        : rec.brandTrack === 'GRAMOS / Apna Bazar Select'
        ? 'Apna Bazar Select'
        : rec.linkedSupplierName || 'Third-Party Select';

    const mappedSource: Product['sourceType'] = rec.sourcingOptions.includes('Own Production')
      ? 'Own Production'
      : rec.sourcingOptions.includes('Contract Manufacturing')
      ? 'Third-Party Manufacturing'
      : rec.sourcingOptions.includes('White-Label')
      ? 'White-Label'
      : rec.sourcingOptions.includes('Regional Producer')
      ? 'Regional Producer'
      : 'External Supplier';

    const newProdId = `prod-pl-${Date.now()}`;
    const newProduct: Product = {
      id: newProdId,
      sku: `GRM-PL-${seq}`,
      name: `${rec.productName} (${rec.variantOrPackSize})`,
      brand: mappedBrand,
      industry: rec.industry.replace(/^\d+\.\s*/, ''),
      category: rec.category,
      subcategory: rec.subcategory,
      unitSize: rec.variantOrPackSize,
      ownershipType,
      sourceType: mappedSource,
      supplierId: rec.linkedSupplierId || state.suppliers[0]?.id || 'sup-1',
      batchNumber: batchNumber?.trim() || `PL-${seq}`,
      mfgDate: today,
      expiryDate: expiryDate !== undefined ? expiryDate : null,
      purchaseCost: basePurchase,
      freightAndHandling: freight,
      packagingAndTax: taxPack,
      landedCost: landed,
      mrp: rec.actualMrp,
      sellingPrice: rec.actualProposedSellingPrice,
      gstPercent,
      stockQty: Math.max(0, initialStockQty),
      quarantinedQty: 0,
      reorderLevel: Math.max(5, Math.round(initialStockQty * 0.25)),
      velocity: 'Medium',
      reviewAction: 'Maintain',
      zone,
      consignmentCommissionPct: ownershipType === 'Consignment' ? 20 : undefined,
      creditTermDays: ownershipType === 'Supplier-Credit' ? 15 : undefined,
      active: true,
    };

    const newApproval: ProductApprovalRecord = {
      id: `qa-app-${Date.now()}`,
      productId: newProduct.id,
      sku: newProduct.sku,
      productName: newProduct.name,
      supplierName: rec.linkedSupplierName || 'Approved Library Supplier',
      stage1ProductId: true,
      stage2Docs: rec.complianceGate.legalLabellingPassed,
      stage3Physical: rec.complianceGate.sampleTested && rec.complianceGate.qualityTestPassed,
      stage4Commercial: true,
      decision: 'Approved',
      reviewedBy: activeRole,
      reviewedDate: today,
      notes: `Promoted from Product Library ${rec.libraryCode} (${rec.quotationSourceRef}).`,
    };

    setState((prev) => {
      const extraConsignments = [...prev.consignments];
      if (ownershipType === 'Consignment') {
        extraConsignments.unshift({
          id: `con-pl-${Date.now()}`,
          supplierId: newProduct.supplierId,
          supplierName: rec.linkedSupplierName || 'Regional Producer',
          productId: newProduct.id,
          productName: newProduct.name,
          sku: newProduct.sku,
          agreementRef: `CON-${rec.libraryCode}`,
          receivedDate: today,
          openingQty: newProduct.stockQty,
          receivedQty: newProduct.stockQty,
          soldQty: 0,
          settledQty: 0,
          returnedQty: 0,
          damagedQty: 0,
          unitSellingPrice: newProduct.sellingPrice,
          gramosCommissionPct: 20,
          returnTerms: 'Unsold stock returnable under consignment schedule',
          lastSettlementDate: null,
          lastPaymentRef: null,
        });
      }

      return {
        ...prev,
        products: [newProduct, ...prev.products],
        consignments: extraConsignments,
        movements: [
          {
            id: `mov-pl-${Date.now()}`,
            date: today,
            productId: newProduct.id,
            sku: newProduct.sku,
            productName: newProduct.name,
            ownershipType,
            movementType: ownershipType === 'Consignment' ? 'Consignment Receipt' : 'Opening Stock',
            qtyDelta: newProduct.stockQty,
            reason: `Level 3 Commercial Promotion from ${rec.libraryCode}`,
            actor: activeRole,
          },
          ...prev.movements,
        ],
        governance: {
          ...prev.governance,
          productApprovals: [newApproval, ...prev.governance.productApprovals],
        },
        productLibrary: {
          ...prev.productLibrary,
          records: prev.productLibrary.records.map((r) =>
            r.id === libraryId
              ? {
                  ...r,
                  status: 'Commercial Catalogue',
                  linkedRetailProductId: newProduct.id,
                  updatedAt: today,
                }
              : r
          ),
        },
        auditLogs: appendAudit(
          prev,
          'Product Library -> Commercial',
          'Promoted to Level 3 Store Catalogue',
          `${rec.libraryCode} -> ${newProduct.sku} (${newProduct.stockQty} units · ${ownershipType})`
        ),
      };
    });

    return { ok: true, product: newProduct };
  };

  const sendLibraryToDakshMarket = (libraryId: string) => {
    const rec = state.productLibrary.records.find((r) => r.id === libraryId);
    if (!rec) return;

    const req = createRequirement({
      buyerOrgId: 'ORG-000001',
      title: `Library Sample & Quote Sourcing: ${rec.productName} (${rec.variantOrPackSize})`,
      rawPrompt: `Source supplier & written sample quote for Product Library item ${rec.libraryCode}: ${rec.productName} (${rec.variantOrPackSize}) under ${rec.industry}. Target price band: ${rec.targetSellingPriceRange}.`,
      deliveryLocation: 'GRAMOS Mart, Kotri Steel Bridge, Kota, Rajasthan',
      targetDeliveryDate: null,
      budgetCeiling: null,
      installationNeeded: false,
      missingInfoFlags: ['Sample pack & written landed cost quote required from vendor'],
      items: [
        {
          description: `${rec.productName} — ${rec.variantOrPackSize}`,
          industry: rec.industry.replace(/^\d+\.\s*/, ''),
          category: rec.category,
          offeringType: rec.sourcingOptions.includes('Contract Manufacturing')
            ? 'Made-to-Order'
            : 'Physical Product',
          qty: 50,
          unit: 'Units',
          specs: `${rec.regulatoryRequirements} · ${rec.shelfLifeAndStorage}`,
        },
      ],
    });

    const today = new Date().toISOString().slice(0, 10);
    setState((prev) => ({
      ...prev,
      productLibrary: {
        ...prev.productLibrary,
        records: prev.productLibrary.records.map((r) =>
          r.id === libraryId
            ? {
                ...r,
                linkedDakshReqCode: req.reqCode,
                status: r.status === 'Discovered' ? 'Shortlisted' : r.status,
                updatedAt: today,
              }
            : r
        ),
      },
    }));

    setDakshTab('buyer');
    setActiveNav('daksh');
  };

  const sendLibraryToGramosfuel = (libraryId: string) => {
    const rec = state.productLibrary.records.find((r) => r.id === libraryId);
    if (!rec) return;

    const industryMap: Record<ProductUniverseIndustry, GramosfuelIndustryGroup> = {
      '01. Food & Grocery': 'Industry A — Food and Nutrition',
      '02. Snacks & Traditional Foods': 'Industry A — Food and Nutrition',
      '03. Beverages': 'Industry A — Food and Nutrition',
      '04. Household & Cleaning': 'Industry B — Household Essentials',
      '05. Personal Care': 'Industry C — Personal Care',
      '06. Stationery & Education': 'Industry E — Lifestyle and Utility',
      '07. Agriculture & Gardening': 'Industry D — Agriculture and Rural Products',
      '08. Regional & Handicraft Products': 'Industry D — Agriculture and Rural Products',
      '09. Kitchen & Utility': 'Industry E — Lifestyle and Utility',
      '10. Home & Lifestyle': 'Industry E — Lifestyle and Utility',
      '11. Apparel & Everyday Accessories': 'Industry E — Lifestyle and Utility',
      '12. Seasonal, Festival & Gift Products': 'Industry E — Lifestyle and Utility',
    };

    const cand = createProductCandidate({
      name: rec.productName,
      industryGroup: industryMap[rec.industry] || 'Industry E — Lifestyle and Utility',
      category: rec.category,
      unitSize: rec.variantOrPackSize,
      customerProblem: rec.marketRelevance || rec.description,
      competitorBenchmark: `Library Estimate: ${rec.estimatedCostRange} · Target ${rec.targetSellingPriceRange}`,
      targetPriceBand: rec.targetSellingPriceRange,
      sourcingModel: rec.sourcingOptions.includes('Regional Producer')
        ? 'Regional Hadoti / Gramodaya'
        : rec.sourcingOptions.includes('White-Label')
        ? 'Private Label'
        : 'Contract Manufacturing',
      linkedSupplierId: rec.linkedSupplierId,
    });

    const today = new Date().toISOString().slice(0, 10);
    setState((prev) => ({
      ...prev,
      productLibrary: {
        ...prev.productLibrary,
        records: prev.productLibrary.records.map((r) =>
          r.id === libraryId
            ? {
                ...r,
                linkedGramosfuelCandidateId: cand.id,
                updatedAt: today,
              }
            : r
        ),
      },
    }));

    setGramosfuelTab('pipeline');
    setActiveNav('gramosfuel');
  };

  const updateBatchStatus: StoreContextValue['updateBatchStatus'] = (batchId, status) => {
    setState((prev) => ({
      ...prev,
      productLibrary: {
        ...prev.productLibrary,
        batches: prev.productLibrary.batches.map((b) =>
          b.id === batchId ? { ...b, status } : b
        ),
      },
      auditLogs: appendAudit(
        prev,
        'Product Library Batches',
        'Batch Status Updated',
        `Batch ${batchId} -> ${status}`
      ),
    }));
  };

  const toggleBatch01Candidate = (candidateId: string) => {
    setState((prev) => ({
      ...prev,
      productLibrary: {
        ...prev.productLibrary,
        batch01Candidates: prev.productLibrary.batch01Candidates.map((c) =>
          c.id === candidateId ? { ...c, selected: !c.selected } : c
        ),
      },
    }));
  };

  const selectAllBatch01Candidates = (selectAll: boolean) => {
    setState((prev) => ({
      ...prev,
      productLibrary: {
        ...prev.productLibrary,
        batch01Candidates: prev.productLibrary.batch01Candidates.map((c) => ({
          ...c,
          selected: selectAll,
        })),
      },
    }));
  };

  const selectBatch01PriorityFive = () => {
    setState((prev) => ({
      ...prev,
      productLibrary: {
        ...prev.productLibrary,
        batch01Candidates: prev.productLibrary.batch01Candidates.map((c) => ({
          ...c,
          selected: c.isTestingPriority,
        })),
      },
    }));
  };

  const prepareBatch01ResearchCards = () => {
    const selectedItems = state.productLibrary.batch01Candidates.filter((c) => c.selected);
    if (selectedItems.length === 0) {
      return { createdCount: 0, firstRecordId: null };
    }

    const today = new Date().toISOString().slice(0, 10);
    const existingByCode = new Map(
      state.productLibrary.records.map((r) => [r.libraryCode, r])
    );

    const newRecords: ProductLibraryRecord[] = [];
    const linkMap = new Map<string, string>();
    let firstRecordId: string | null = null;

    for (const item of selectedItems) {
      const existing =
        (item.preparedLibraryId &&
          state.productLibrary.records.find((r) => r.id === item.preparedLibraryId)) ||
        existingByCode.get(item.researchId);

      if (existing) {
        linkMap.set(item.id, existing.id);
        if (!firstRecordId) firstRecordId = existing.id;
        continue;
      }

      const recId = `pl-b01-${String(item.itemNo).padStart(2, '0')}-${Date.now().toString().slice(-4)}`;
      const newRec: ProductLibraryRecord = {
        id: recId,
        libraryCode: item.researchId,
        batchCode: 'Batch 01',
        productName: item.name,
        variantOrPackSize: 'Standard Pack (Create distinct IDs per pack size variant)',
        industry: item.industry,
        category: item.category,
        subcategory: item.categoryGroup.split('—')[1]?.trim() || item.category,
        description: `${item.subtitle} Prepared from Batch 01 discovery checklist (${item.researchId}).`,
        marketRelevance: item.isTestingPriority
          ? 'Priority Batch 01 testing candidate connected to GRAMOSFUEL & everyday household demand (Not yet commercially validated).'
          : 'Everyday Kota household staple candidate queued for supplier discovery & sample verification.',
        brandTrack: item.brandTrack,
        sourcingOptions:
          item.brandTrack === 'GRAMOSFUEL'
            ? ['Contract Manufacturing', 'White-Label']
            : item.brandTrack === 'Made in Hadoti'
            ? ['Regional Producer', 'Supplier Purchase']
            : ['Supplier Purchase', 'White-Label'],
        status: 'Shortlisted',
        estimatedCostRange: 'Estimate pending supplier discovery',
        targetSellingPriceRange: 'Target TBD after Kota benchmark check',
        actualQuotedLandedCost: null,
        actualProposedSellingPrice: null,
        actualMrp: null,
        quotationSourceRef: 'Discovery candidate — no supplier quotation logged yet',
        shelfLifeAndStorage: 'Verify moisture barrier, FEFO & Zone assignment before sample approval',
        regulatoryRequirements:
          'Verify FSSAI licence, Legal Metrology net weight/MRP, veg mark & applicable GST slab',
        sampleTestingNotes:
          'Research card prepared from Batch 01 tracker. Selection does not mean tested or approved.',
        testingEvidenceLogged: false,
        rejectionReason: '',
        scorecard: {
          productQuality: 0,
          customerUsefulness: 0,
          marketDemand: 0,
          purchaseCost: 0,
          potentialSellingPrice: 0,
          grossMarginPotential: 0,
          supplierReliability: 0,
          packagingPresentation: 0,
          storageShelfLife: 0,
          repeatPurchasePotential: 0,
        },
        complianceGate: {
          sampleTested: false,
          safetyCheckPassed: false,
          legalLabellingPassed: false,
          qualityTestPassed: false,
        },
        discoveredDate: today,
        updatedAt: today,
      };

      newRecords.push(newRec);
      linkMap.set(item.id, newRec.id);
      if (!firstRecordId) firstRecordId = newRec.id;
    }

    setState((prev) => ({
      ...prev,
      productLibrary: {
        ...prev.productLibrary,
        records: [...newRecords, ...prev.productLibrary.records],
        batch01Candidates: prev.productLibrary.batch01Candidates.map((c) =>
          linkMap.has(c.id) ? { ...c, preparedLibraryId: linkMap.get(c.id) } : c
        ),
      },
      auditLogs: appendAudit(
        prev,
        'Batch 01 Tracker (GRM-PL-B01)',
        'Research Cards Prepared',
        `Prepared ${newRecords.length} new Level 1 research card(s) from ${selectedItems.length} selected Batch 01 candidates`
      ),
    }));

    return { createdCount: newRecords.length, firstRecordId };
  };

  const toggleBatch02Candidate = (candidateId: string) => {
    setState((prev) => ({
      ...prev,
      productLibrary: {
        ...prev.productLibrary,
        batch02Candidates: prev.productLibrary.batch02Candidates.map((c) =>
          c.id === candidateId ? { ...c, selected: !c.selected } : c
        ),
      },
    }));
  };

  const selectAllBatch02Candidates = (selectAll: boolean) => {
    setState((prev) => ({
      ...prev,
      productLibrary: {
        ...prev.productLibrary,
        batch02Candidates: prev.productLibrary.batch02Candidates.map((c) => ({
          ...c,
          selected: selectAll,
        })),
      },
    }));
  };

  const selectBatch02PriorityTen = () => {
    setState((prev) => ({
      ...prev,
      productLibrary: {
        ...prev.productLibrary,
        batch02Candidates: prev.productLibrary.batch02Candidates.map((c) => ({
          ...c,
          selected: c.isTestingPriority,
        })),
      },
    }));
  };

  const prepareBatch02ResearchCards = () => {
    const selectedItems = state.productLibrary.batch02Candidates.filter((c) => c.selected);
    if (selectedItems.length === 0) {
      return { createdCount: 0, firstRecordId: null };
    }

    const today = new Date().toISOString().slice(0, 10);
    const existingByCode = new Map(
      state.productLibrary.records.map((r) => [r.libraryCode, r])
    );

    const newRecords: ProductLibraryRecord[] = [];
    const linkMap = new Map<string, string>();
    let firstRecordId: string | null = null;

    for (const item of selectedItems) {
      const existing =
        (item.preparedLibraryId &&
          state.productLibrary.records.find((r) => r.id === item.preparedLibraryId)) ||
        existingByCode.get(item.researchId);

      if (existing) {
        linkMap.set(item.id, existing.id);
        if (!firstRecordId) firstRecordId = existing.id;
        continue;
      }

      const recId = `pl-b02-${String(item.itemNo).padStart(2, '0')}-${Date.now().toString().slice(-4)}`;
      const handlingWarning = item.requiresFreshOrColdSupply
        ? `${item.specialHandlingNote || 'Fresh or temperature-controlled supply required.'} Do not treat like ordinary shelf-stable namkeen.`
        : item.specialHandlingNote
        ? `${item.specialHandlingNote} Verify packaging strength, moisture barrier & shelf-life evidence.`
        : 'Verify packaging strength, crispness/moisture barrier, FEFO & Zone suitability before sample approval.';

      const newRec: ProductLibraryRecord = {
        id: recId,
        libraryCode: item.researchId,
        batchCode: 'Batch 02',
        productName: item.name,
        variantOrPackSize: 'Standard Pack (Create distinct IDs per pack size variant)',
        industry: item.industry,
        category: item.category,
        subcategory: item.categoryGroup.split('—')[1]?.trim() || item.category,
        description: `${item.subtitle} Prepared from Batch 02 discovery checklist (${item.researchId}).`,
        marketRelevance: item.isTestingPriority
          ? 'Initial sample-testing priority in Batch 02 (Suggested research priority only — not a confirmed sales performer).'
          : 'Traditional snack, sweet or regional food candidate queued for manufacturer discovery & personal sample evaluation.',
        brandTrack: item.brandTrack,
        sourcingOptions:
          item.brandTrack === 'GRAMOSFUEL'
            ? ['Contract Manufacturing', 'White-Label']
            : item.brandTrack === 'Made in Hadoti'
            ? ['Regional Producer', 'Supplier Purchase']
            : ['Supplier Purchase', 'White-Label'],
        status: 'Shortlisted',
        estimatedCostRange: 'Estimate pending supplier discovery',
        targetSellingPriceRange: 'Target TBD after Kota benchmark & margin check',
        actualQuotedLandedCost: null,
        actualProposedSellingPrice: null,
        actualMrp: null,
        quotationSourceRef: 'Discovery candidate — no supplier quotation logged yet',
        shelfLifeAndStorage: handlingWarning,
        regulatoryRequirements:
          'Verify FSSAI compliance, ingredient & allergen label declarations, batch traceability & applicable GST slab',
        sampleTestingNotes:
          'Prepared from Batch 02 tracker (Selection does not mean tested or approved). Log: manufacturer/supplier details, sample cost & MOQ, taste/aroma/texture/consistency, ingredient safety, packaging & shelf-life evidence, landed cost/MRP/margin, FSSAI/traceability, storage & transport suitability.',
        testingEvidenceLogged: false,
        rejectionReason: '',
        scorecard: {
          productQuality: 0,
          customerUsefulness: 0,
          marketDemand: 0,
          purchaseCost: 0,
          potentialSellingPrice: 0,
          grossMarginPotential: 0,
          supplierReliability: 0,
          packagingPresentation: 0,
          storageShelfLife: 0,
          repeatPurchasePotential: 0,
        },
        complianceGate: {
          sampleTested: false,
          safetyCheckPassed: false,
          legalLabellingPassed: false,
          qualityTestPassed: false,
        },
        discoveredDate: today,
        updatedAt: today,
      };

      newRecords.push(newRec);
      linkMap.set(item.id, newRec.id);
      if (!firstRecordId) firstRecordId = newRec.id;
    }

    setState((prev) => ({
      ...prev,
      productLibrary: {
        ...prev.productLibrary,
        records: [...newRecords, ...prev.productLibrary.records],
        batch02Candidates: prev.productLibrary.batch02Candidates.map((c) =>
          linkMap.has(c.id) ? { ...c, preparedLibraryId: linkMap.get(c.id) } : c
        ),
      },
      auditLogs: appendAudit(
        prev,
        'Batch 02 Tracker (GRM-PL-B02)',
        'Research Cards Prepared',
        `Prepared ${newRecords.length} new Level 1 research card(s) from ${selectedItems.length} selected Batch 02 candidates`
      ),
    }));

    return { createdCount: newRecords.length, firstRecordId };
  };

  const toggleBatch03Candidate = (candidateId: string) => {
    setState((prev) => ({
      ...prev,
      productLibrary: {
        ...prev.productLibrary,
        batch03Candidates: prev.productLibrary.batch03Candidates.map((c) =>
          c.id === candidateId ? { ...c, selected: !c.selected } : c
        ),
      },
    }));
  };

  const selectAllBatch03Candidates = (selectAll: boolean) => {
    setState((prev) => ({
      ...prev,
      productLibrary: {
        ...prev.productLibrary,
        batch03Candidates: prev.productLibrary.batch03Candidates.map((c) => ({
          ...c,
          selected: selectAll,
        })),
      },
    }));
  };

  const selectBatch03PriorityEight = () => {
    setState((prev) => ({
      ...prev,
      productLibrary: {
        ...prev.productLibrary,
        batch03Candidates: prev.productLibrary.batch03Candidates.map((c) => ({
          ...c,
          selected: c.isTestingPriority,
        })),
      },
    }));
  };

  const prepareBatch03ResearchCards = () => {
    const selectedItems = state.productLibrary.batch03Candidates.filter((c) => c.selected);
    if (selectedItems.length === 0) {
      return { createdCount: 0, firstRecordId: null };
    }

    const today = new Date().toISOString().slice(0, 10);
    const existingByCode = new Map(
      state.productLibrary.records.map((r) => [r.libraryCode, r])
    );

    const newRecords: ProductLibraryRecord[] = [];
    const linkMap = new Map<string, string>();
    let firstRecordId: string | null = null;

    for (const item of selectedItems) {
      const existing =
        (item.preparedLibraryId &&
          state.productLibrary.records.find((r) => r.id === item.preparedLibraryId)) ||
        existingByCode.get(item.researchId);

      if (existing) {
        linkMap.set(item.id, existing.id);
        if (!firstRecordId) firstRecordId = existing.id;
        continue;
      }

      const recId = `pl-b03-${String(item.itemNo).padStart(2, '0')}-${Date.now().toString().slice(-4)}`;
      const storageNote =
        item.handlingAndClaimsFlag === 'cold-chain-expiry'
          ? `${item.specialHandlingNote || 'Dairy / fresh juice cold-chain and expiry management check required.'} Verify refrigeration / aseptic barrier & FEFO rotation.`
          : 'Verify packaging compatibility, moisture/light barrier, shelf-life evidence & Zone suitability.';

      const regulatoryNote =
        item.handlingAndClaimsFlag === 'claims-regulatory'
          ? `${item.specialHandlingNote || 'Careful FSSAI category, caffeine/electrolyte limits & nutritional claims review required.'} Verify ingredient declarations & microbiological safety.`
          : 'Verify FSSAI category & licensing, ingredient declarations, nutritional claims, microbiological safety & GST slab.';

      const newRec: ProductLibraryRecord = {
        id: recId,
        libraryCode: item.researchId,
        batchCode: 'Batch 03',
        productName: item.name,
        variantOrPackSize: 'Standard Pack (Create distinct IDs per pack size / format)',
        industry: item.industry,
        category: item.category,
        subcategory: item.categoryGroup.split('—')[1]?.trim() || item.category,
        description: `${item.subtitle} Prepared from Batch 03 discovery checklist (${item.researchId}).`,
        marketRelevance: item.isGramosfuelOpportunity
          ? 'GRAMOSFUEL beverage opportunity & initial sample candidate (Not yet tested or commercially approved).'
          : item.isTestingPriority
          ? 'Initial sample-sourcing priority in Batch 03 (Candidate for sample sourcing, not an approved product).'
          : 'Beverage, traditional drink or concentrate discovery candidate queued for supplier & sample evaluation.',
        brandTrack: item.brandTrack,
        sourcingOptions:
          item.brandTrack === 'GRAMOSFUEL'
            ? ['Contract Manufacturing', 'White-Label']
            : item.brandTrack === 'Made in Hadoti'
            ? ['Regional Producer', 'Supplier Purchase']
            : ['Supplier Purchase', 'White-Label'],
        status: 'Shortlisted',
        estimatedCostRange: 'Estimate pending supplier discovery',
        targetSellingPriceRange: 'Target TBD after Kota benchmark & margin check',
        actualQuotedLandedCost: null,
        actualProposedSellingPrice: null,
        actualMrp: null,
        quotationSourceRef: 'Discovery candidate — no supplier quotation logged yet',
        shelfLifeAndStorage: storageNote,
        regulatoryRequirements: regulatoryNote,
        sampleTestingNotes:
          'Prepared from Batch 03 tracker (Candidate for sample sourcing, not an approved product). Pre-approval checks: FSSAI category/licensing, ingredient declarations, nutritional claims, microbiological safety, shelf-life evidence, packaging compatibility, storage conditions & actual landed cost.',
        testingEvidenceLogged: false,
        rejectionReason: '',
        scorecard: {
          productQuality: 0,
          customerUsefulness: 0,
          marketDemand: 0,
          purchaseCost: 0,
          potentialSellingPrice: 0,
          grossMarginPotential: 0,
          supplierReliability: 0,
          packagingPresentation: 0,
          storageShelfLife: 0,
          repeatPurchasePotential: 0,
        },
        complianceGate: {
          sampleTested: false,
          safetyCheckPassed: false,
          legalLabellingPassed: false,
          qualityTestPassed: false,
        },
        discoveredDate: today,
        updatedAt: today,
      };

      newRecords.push(newRec);
      linkMap.set(item.id, newRec.id);
      if (!firstRecordId) firstRecordId = newRec.id;
    }

    setState((prev) => ({
      ...prev,
      productLibrary: {
        ...prev.productLibrary,
        records: [...newRecords, ...prev.productLibrary.records],
        batch03Candidates: prev.productLibrary.batch03Candidates.map((c) =>
          linkMap.has(c.id) ? { ...c, preparedLibraryId: linkMap.get(c.id) } : c
        ),
      },
      auditLogs: appendAudit(
        prev,
        'Batch 03 Tracker (GRM-PL-B03)',
        'Research Cards Prepared',
        `Prepared ${newRecords.length} new Level 1 research card(s) from ${selectedItems.length} selected Batch 03 candidates`
      ),
    }));

    return { createdCount: newRecords.length, firstRecordId };
  };

  const toggleBatch04Candidate = (candidateId: string) => {
    setState((prev) => ({
      ...prev,
      productLibrary: {
        ...prev.productLibrary,
        batch04Candidates: prev.productLibrary.batch04Candidates.map((c) =>
          c.id === candidateId ? { ...c, selected: !c.selected } : c
        ),
      },
    }));
  };

  const selectAllBatch04Candidates = (selectAll: boolean) => {
    setState((prev) => ({
      ...prev,
      productLibrary: {
        ...prev.productLibrary,
        batch04Candidates: prev.productLibrary.batch04Candidates.map((c) => ({
          ...c,
          selected: selectAll,
        })),
      },
    }));
  };

  const selectBatch04PriorityEight = () => {
    setState((prev) => ({
      ...prev,
      productLibrary: {
        ...prev.productLibrary,
        batch04Candidates: prev.productLibrary.batch04Candidates.map((c) => ({
          ...c,
          selected: c.isTestingPriority,
        })),
      },
    }));
  };

  const prepareBatch04ResearchCards = () => {
    const selectedItems = state.productLibrary.batch04Candidates.filter((c) => c.selected);
    if (selectedItems.length === 0) {
      return { createdCount: 0, firstRecordId: null };
    }

    const today = new Date().toISOString().slice(0, 10);
    const existingByCode = new Map(
      state.productLibrary.records.map((r) => [r.libraryCode, r])
    );

    const newRecords: ProductLibraryRecord[] = [];
    const linkMap = new Map<string, string>();
    let firstRecordId: string | null = null;

    for (const item of selectedItems) {
      const existing =
        (item.preparedLibraryId &&
          state.productLibrary.records.find((r) => r.id === item.preparedLibraryId)) ||
        existingByCode.get(item.researchId);

      if (existing) {
        linkMap.set(item.id, existing.id);
        if (!firstRecordId) firstRecordId = existing.id;
        continue;
      }

      const recId = `pl-b04-${String(item.itemNo).padStart(2, '0')}-${Date.now().toString().slice(-4)}`;
      const storageNote = item.specialHandlingNote
        ? `${item.specialHandlingNote} Store in Zone E (Non-Food / Personal Care) separated from food inventory; verify manufacturing & expiry dates.`
        : 'Store in Zone E (Personal Care & Hygiene), separated from food inventory; verify packaging integrity, mfg & expiry dates.';

      const regulatoryNote =
        item.regulatoryFocus === 'medical-device-hygiene'
          ? `${item.specialHandlingNote || 'Verify BIS / CDSCO medical-device / hygiene standards.'} Verify manufacturer licence, ingredient/label declarations & batch traceability. Do not sell with unverified medical or therapeutic claims.`
          : 'Verify manufacturer cosmetic/AYUSH licence, Drugs & Cosmetics regulations, ingredient & label declarations, batch traceability, mfg/expiry dates & GST slab. Personal-care products must NOT be sold with unverified medical or therapeutic claims.';

      const newRec: ProductLibraryRecord = {
        id: recId,
        libraryCode: item.researchId,
        batchCode: 'Batch 04',
        productName: item.name,
        variantOrPackSize: 'Standard Pack (Create distinct IDs per size / variant)',
        industry: item.industry,
        category: item.category,
        subcategory: item.categoryGroup.split('—')[1]?.trim() || item.category,
        description: `${item.subtitle} Prepared from Batch 04 discovery checklist (${item.researchId}).`,
        marketRelevance: item.isGramosfuelOpportunity
          ? 'GRAMOSFUEL / private-label personal-care opportunity queued for contract manufacturing or white-label verification (Not yet tested or approved).'
          : item.isTestingPriority
          ? 'Initial research priority in Batch 04 (Research priority only — not a validated demand ranking).'
          : 'Personal care, beauty or hygiene discovery candidate queued for supplier & sample evaluation.',
        brandTrack: item.brandTrack,
        sourcingOptions:
          item.brandTrack === 'GRAMOSFUEL'
            ? ['Contract Manufacturing', 'White-Label']
            : item.brandTrack === 'Made in Hadoti'
            ? ['Regional Producer', 'Supplier Purchase']
            : ['Supplier Purchase', 'White-Label'],
        status: 'Shortlisted',
        estimatedCostRange: 'Estimate pending supplier discovery',
        targetSellingPriceRange: 'Target TBD after Kota benchmark & margin check',
        actualQuotedLandedCost: null,
        actualProposedSellingPrice: null,
        actualMrp: null,
        quotationSourceRef: 'Discovery candidate — no supplier quotation logged yet',
        shelfLifeAndStorage: storageNote,
        regulatoryRequirements: regulatoryNote,
        sampleTestingNotes:
          'Prepared from Batch 04 tracker (Research priority != validated demand or approval). Approval checks: manufacturer licence, cosmetics regulations, ingredient/label declarations, batch traceability, mfg & expiry dates, quality testing, packaging integrity, supplier reliability & actual landed cost. No unverified medical or therapeutic claims.',
        testingEvidenceLogged: false,
        rejectionReason: '',
        scorecard: {
          productQuality: 0,
          customerUsefulness: 0,
          marketDemand: 0,
          purchaseCost: 0,
          potentialSellingPrice: 0,
          grossMarginPotential: 0,
          supplierReliability: 0,
          packagingPresentation: 0,
          storageShelfLife: 0,
          repeatPurchasePotential: 0,
        },
        complianceGate: {
          sampleTested: false,
          safetyCheckPassed: false,
          legalLabellingPassed: false,
          qualityTestPassed: false,
        },
        discoveredDate: today,
        updatedAt: today,
      };

      newRecords.push(newRec);
      linkMap.set(item.id, newRec.id);
      if (!firstRecordId) firstRecordId = newRec.id;
    }

    setState((prev) => ({
      ...prev,
      productLibrary: {
        ...prev.productLibrary,
        records: [...newRecords, ...prev.productLibrary.records],
        batch04Candidates: prev.productLibrary.batch04Candidates.map((c) =>
          linkMap.has(c.id) ? { ...c, preparedLibraryId: linkMap.get(c.id) } : c
        ),
      },
      auditLogs: appendAudit(
        prev,
        'Batch 04 Tracker (GRM-PL-B04)',
        'Research Cards Prepared',
        `Prepared ${newRecords.length} new Level 1 research card(s) from ${selectedItems.length} selected Batch 04 candidates`
      ),
    }));

    return { createdCount: newRecords.length, firstRecordId };
  };

  const toggleBatch05Candidate = (candidateId: string) => {
    setState((prev) => ({
      ...prev,
      productLibrary: {
        ...prev.productLibrary,
        batch05Candidates: prev.productLibrary.batch05Candidates.map((c) =>
          c.id === candidateId ? { ...c, selected: !c.selected } : c
        ),
      },
    }));
  };

  const selectAllBatch05Candidates = (selectAll: boolean) => {
    setState((prev) => ({
      ...prev,
      productLibrary: {
        ...prev.productLibrary,
        batch05Candidates: prev.productLibrary.batch05Candidates.map((c) => ({
          ...c,
          selected: selectAll,
        })),
      },
    }));
  };

  const selectBatch05PriorityTen = () => {
    setState((prev) => ({
      ...prev,
      productLibrary: {
        ...prev.productLibrary,
        batch05Candidates: prev.productLibrary.batch05Candidates.map((c) => ({
          ...c,
          selected: c.isTestingPriority,
        })),
      },
    }));
  };

  const prepareBatch05ResearchCards = () => {
    const selectedItems = state.productLibrary.batch05Candidates.filter((c) => c.selected);
    if (selectedItems.length === 0) {
      return { createdCount: 0, firstRecordId: null };
    }

    const today = new Date().toISOString().slice(0, 10);
    const existingByCode = new Map(
      state.productLibrary.records.map((r) => [r.libraryCode, r])
    );

    const newRecords: ProductLibraryRecord[] = [];
    const linkMap = new Map<string, string>();
    let firstRecordId: string | null = null;

    for (const item of selectedItems) {
      const existing =
        (item.preparedLibraryId &&
          state.productLibrary.records.find((r) => r.id === item.preparedLibraryId)) ||
        existingByCode.get(item.researchId);

      if (existing) {
        linkMap.set(item.id, existing.id);
        if (!firstRecordId) firstRecordId = existing.id;
        continue;
      }

      const recId = `pl-b05-${String(item.itemNo).padStart(2, '0')}-${Date.now().toString().slice(-4)}`;
      const storageNote = item.specialHandlingNote
        ? `${item.specialHandlingNote} Mandatory Zone E physical separation from food, grain, beverage & snack shelves; verify packaging leakage and batch details.`
        : 'Store strictly in Zone E (Non-Food & Household Cleaning) separated from food inventory; verify packaging leakage, cap seal & batch details.';

      const regulatoryNote =
        item.safetyRegulatoryFlag === 'cibrc-pest-control'
          ? 'Pest-control products need particular regulatory scrutiny; verify applicable CIBRC (Central Insecticides Board & Registration Committee) requirements, Insecticides Act registration number, hazard symbols & safety labelling before considering sale.'
          : item.safetyRegulatoryFlag === 'corrosive-chemical-zone-e'
          ? 'Verify manufacturer, product composition, applicable BIS/QCO & hazardous-chemical safety labelling, clear usage/dilution instructions, batch details, leakage containment & Zone E physical separation from food.'
          : 'Verify manufacturer, product composition, applicable BIS/QCO and regulatory requirements, safety labelling, usage instructions, batch details, packaging leakage, performance & actual landed cost.';

      const newRec: ProductLibraryRecord = {
        id: recId,
        libraryCode: item.researchId,
        batchCode: 'Batch 05',
        productName: item.name,
        variantOrPackSize: 'Standard Pack (Create distinct IDs per pack size / format)',
        industry: item.industry,
        category: item.category,
        subcategory: item.categoryGroup.split('—')[1]?.trim() || item.category,
        description: `${item.subtitle} Prepared from Batch 05 discovery checklist (${item.researchId}).`,
        marketRelevance: item.isGramosfuelOpportunity
          ? 'GRAMOSFUEL private-label home-care opportunity queued for supplier & contract-manufacturing verification (Not yet tested or approved).'
          : item.isTestingPriority
          ? 'Initial sourcing priority in Batch 05 (Initial research priority only — not a confirmed demand ranking).'
          : 'Home care, cleaning, laundry or household-essential discovery candidate queued for supplier & sample evaluation.',
        brandTrack: item.brandTrack,
        sourcingOptions:
          item.brandTrack === 'GRAMOSFUEL'
            ? ['Contract Manufacturing', 'White-Label']
            : item.brandTrack === 'Made in Hadoti'
            ? ['Regional Producer', 'Supplier Purchase']
            : ['Supplier Purchase', 'White-Label'],
        status: 'Shortlisted',
        estimatedCostRange: 'Estimate pending supplier discovery',
        targetSellingPriceRange: 'Target TBD after Kota benchmark & margin check',
        actualQuotedLandedCost: null,
        actualProposedSellingPrice: null,
        actualMrp: null,
        quotationSourceRef: 'Discovery candidate — no supplier quotation logged yet',
        shelfLifeAndStorage: storageNote,
        regulatoryRequirements: regulatoryNote,
        sampleTestingNotes:
          'Prepared from Batch 05 tracker (Initial research priorities are not confirmed demand rankings). 9 Quality & Compliance checks required: manufacturer, composition, BIS/QCO & regulatory rules, safety labelling, usage instructions, batch details, packaging leakage, performance & actual landed cost.',
        testingEvidenceLogged: false,
        rejectionReason: '',
        scorecard: {
          productQuality: 0,
          customerUsefulness: 0,
          marketDemand: 0,
          purchaseCost: 0,
          potentialSellingPrice: 0,
          grossMarginPotential: 0,
          supplierReliability: 0,
          packagingPresentation: 0,
          storageShelfLife: 0,
          repeatPurchasePotential: 0,
        },
        complianceGate: {
          sampleTested: false,
          safetyCheckPassed: false,
          legalLabellingPassed: false,
          qualityTestPassed: false,
        },
        discoveredDate: today,
        updatedAt: today,
      };

      newRecords.push(newRec);
      linkMap.set(item.id, newRec.id);
      if (!firstRecordId) firstRecordId = newRec.id;
    }

    setState((prev) => ({
      ...prev,
      productLibrary: {
        ...prev.productLibrary,
        records: [...newRecords, ...prev.productLibrary.records],
        batch05Candidates: prev.productLibrary.batch05Candidates.map((c) =>
          linkMap.has(c.id) ? { ...c, preparedLibraryId: linkMap.get(c.id) } : c
        ),
      },
      auditLogs: appendAudit(
        prev,
        'Batch 05 Tracker (GRM-PL-B05)',
        'Research Cards Prepared',
        `Prepared ${newRecords.length} new Level 1 research card(s) from ${selectedItems.length} selected Batch 05 candidates`
      ),
    }));

    return { createdCount: newRecords.length, firstRecordId };
  };

  const createVariantResearchCard = (
    sourceLibraryId: string,
    variantPackSize: string
  ): ProductLibraryRecord | null => {
    const src = state.productLibrary.records.find((r) => r.id === sourceLibraryId);
    const trimmedVariant = variantPackSize.trim();
    if (!src || !trimmedVariant) return null;

    const baseCode = src.libraryCode.replace(/-V\d+$/, '');
    const siblingCount = state.productLibrary.records.filter((r) =>
      r.libraryCode.startsWith(baseCode)
    ).length;
    const today = new Date().toISOString().slice(0, 10);

    const variantRec: ProductLibraryRecord = {
      ...src,
      id: `pl-var-${Date.now()}`,
      libraryCode: `${baseCode}-V${siblingCount + 1}`,
      variantOrPackSize: trimmedVariant,
      status: 'Shortlisted',
      actualQuotedLandedCost: null,
      actualProposedSellingPrice: null,
      actualMrp: null,
      quotationSourceRef: 'Separate variant SKU — pending written supplier quote for this pack size',
      sampleTestingNotes: `Separate pack/variant card cloned from ${src.libraryCode}; requires independent sample verification.`,
      testingEvidenceLogged: false,
      rejectionReason: '',
      complianceGate: {
        sampleTested: false,
        safetyCheckPassed: false,
        legalLabellingPassed: false,
        qualityTestPassed: false,
      },
      linkedRetailProductId: undefined,
      linkedGramosfuelCandidateId: undefined,
      linkedDakshReqCode: undefined,
      discoveredDate: today,
      updatedAt: today,
    };

    setState((prev) => ({
      ...prev,
      productLibrary: {
        ...prev.productLibrary,
        records: [variantRec, ...prev.productLibrary.records],
      },
      auditLogs: appendAudit(
        prev,
        'Product Library Variants',
        'Distinct Variant Research ID Created',
        `${variantRec.libraryCode} · ${variantRec.productName} (${variantRec.variantOrPackSize})`
      ),
    }));

    return variantRec;
  };

  return (
    <StoreContext.Provider
      value={{
        state,
        activeNav,
        setActiveNav,
        activeRole,
        setActiveRole,
        sidebarCollapsed,
        setSidebarCollapsed,
        mobileMenuOpen,
        setMobileMenuOpen,
        metrics,
        getCreditStatus,
        recordSale,
        processReturn,
        addProduct,
        receiveStock,
        quarantineStock,
        adjustStock,
        addSupplier,
        paySupplierCredit,
        settleConsignment,
        addExpense,
        recordCashReconciliation,
        addCustomer,
        addEnquiry,
        updateEnquiryStatus,
        addComplaint,
        resolveComplaint,
        toggleSopItem,
        togglePilotMilestone,
        updateOutletConfig,
        resetStore,
        dakshTab,
        setDakshTab,
        addUniversalIndustry,
        createOrganization,
        updateOrganizationStatus,
        createRelationship,
        submitVendorListing,
        updateListingStatus,
        createRequirement,
        clarifyRequirement,
        runSupplyMatching,
        createRfqFromRequirement,
        submitQuotation,
        awardQuotationToOrder,
        advanceB2bOrderStage,
        updateCommissionStatus,
        createProject,
        updateBoqPackage,
        convertEnquiryToRequirement,
        gramosfuelTab,
        setGramosfuelTab,
        createProductCandidate,
        advanceCandidateStage,
        recordSampleEvaluation,
        updateCandidateEconomics,
        updateCandidateSpec,
        linkCandidateSupplier,
        sendCandidateToDakshRfq,
        launchCandidateToPilotInventory,
        decideCandidateCommercial,
        convertEnquiryToGramosfuelIdea,
        toggleManufacturerCheckField,
        toggleGfDocumentCheck,
        updateDistributionPhaseStatus,
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
        libraryTab,
        setLibraryTab,
        addLibraryProduct,
        updateLibraryStatus,
        updateLibraryQuotationAndTesting,
        updateLibraryScorecard,
        promoteLibraryToCommercialCatalogue,
        sendLibraryToDakshMarket,
        sendLibraryToGramosfuel,
        updateBatchStatus,
        toggleBatch01Candidate,
        selectAllBatch01Candidates,
        selectBatch01PriorityFive,
        prepareBatch01ResearchCards,
        toggleBatch02Candidate,
        selectAllBatch02Candidates,
        selectBatch02PriorityTen,
        prepareBatch02ResearchCards,
        toggleBatch03Candidate,
        selectAllBatch03Candidates,
        selectBatch03PriorityEight,
        prepareBatch03ResearchCards,
        toggleBatch04Candidate,
        selectAllBatch04Candidates,
        selectBatch04PriorityEight,
        prepareBatch04ResearchCards,
        toggleBatch05Candidate,
        selectAllBatch05Candidates,
        selectBatch05PriorityTen,
        prepareBatch05ResearchCards,
        createVariantResearchCard,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useGramosStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useGramosStore must be used inside StoreProvider');
  return ctx;
};
