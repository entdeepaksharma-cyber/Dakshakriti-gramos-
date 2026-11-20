export type NavSection =
  | 'dashboard'
  | 'pos'
  | 'inventory'
  | 'registers'
  | 'suppliers'
  | 'crm'
  | 'operations'
  | 'daksh'
  | 'gramosfuel'
  | 'governance'
  | 'library';

export type StaffRole =
  | 'Founder / Operator'
  | 'Store Manager'
  | 'Billing Operator'
  | 'Stock Assistant';

export type OwnershipType = 'Self-Funded' | 'Supplier-Credit' | 'Consignment';

export type SourceType =
  | 'Own Production'
  | 'Third-Party Manufacturing'
  | 'White-Label'
  | 'External Supplier'
  | 'Regional Producer';

export type MovementVelocity = 'Fast' | 'Medium' | 'Slow' | 'Seasonal';

export type ProductReviewAction =
  | 'Expand'
  | 'Maintain'
  | 'Improve'
  | 'Reprice'
  | 'Reduce'
  | 'Discontinue';

export type SalesChannel =
  | 'Direct Retail'
  | 'WhatsApp Order'
  | 'Local Delivery'
  | 'Wholesale'
  | 'Institutional';

export type PaymentMode = 'Cash' | 'UPI / Digital' | 'Approved Credit';

export type SupplierGroup =
  | 'Manufacturers'
  | 'Contract Manufacturers'
  | 'White-Label Manufacturers'
  | 'Distributors & Wholesalers'
  | 'Local Producers & SHGs'
  | 'Agricultural & Rural Producers'
  | 'Institutional & B2B Suppliers';

export type SupplierClassification =
  | 'Preferred'
  | 'Approved'
  | 'Conditional'
  | 'Under Review'
  | 'Suspended';

export type CustomerType =
  | 'Walk-in'
  | 'Registered'
  | 'Repeat'
  | 'Wholesale'
  | 'Institutional'
  | 'Regional Buyer';

export type CreditAgeingStatus =
  | 'Not Yet Due'
  | 'Due Shortly'
  | 'Overdue'
  | 'Disputed'
  | 'Settled';

export interface Product {
  id: string;
  sku: string; // GRM-IND-CAT-SUB-001
  name: string;
  brand: 'GRAMOSFUEL' | 'Made in Hadoti' | 'Apna Bazar Select' | string;
  industry: string;
  category: string;
  subcategory: string;
  unitSize: string;
  ownershipType: OwnershipType;
  sourceType: SourceType;
  supplierId: string;
  batchNumber: string;
  mfgDate: string;
  expiryDate: string | null; // YYYY-MM-DD or null for non-perishable
  purchaseCost: number;
  freightAndHandling: number;
  packagingAndTax: number;
  landedCost: number;
  mrp: number;
  sellingPrice: number;
  gstPercent: number;
  stockQty: number;
  quarantinedQty: number;
  reorderLevel: number;
  velocity: MovementVelocity;
  reviewAction: ProductReviewAction;
  zone: 'Zone B' | 'Zone C' | 'Zone D' | 'Zone E';
  consignmentCommissionPct?: number; // for Consignment: % retained by GRAMOS Mart
  creditTermDays?: number; // for Supplier-Credit: 7, 15, 30
  active: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  group: SupplierGroup;
  location: string;
  contactPerson: string;
  phone: string;
  gstOrLicense: string;
  categories: string[];
  paymentTerms: 'Advance / Direct' | '7-Day Credit' | '15-Day Credit' | '30-Day Credit' | 'Consignment Sale-Linked';
  creditLimit: number;
  returnPolicy: string;
  classification: SupplierClassification;
  isRegionalHadoti: boolean;
  womenLedOrShg: boolean;
  scores: {
    quality: number;
    pricing: number;
    delivery: number;
    documentation: number;
    continuity: number;
  };
  verified: boolean;
}

export interface SupplierCreditEntry {
  id: string;
  supplierId: string;
  supplierName: string;
  invoiceNo: string;
  purchaseDate: string;
  dueDate: string;
  creditDays: number;
  totalAmount: number;
  paidAmount: number;
  disputedAmount: number;
  notes: string;
}

export interface ConsignmentRecord {
  id: string;
  supplierId: string;
  supplierName: string;
  productId: string;
  productName: string;
  sku: string;
  agreementRef: string;
  receivedDate: string;
  openingQty: number;
  receivedQty: number;
  soldQty: number;
  settledQty: number;
  returnedQty: number;
  damagedQty: number;
  unitSellingPrice: number;
  gramosCommissionPct: number;
  returnTerms: string;
  lastSettlementDate: string | null;
  lastPaymentRef: string | null;
}

export interface StockMovement {
  id: string;
  date: string;
  productId: string;
  sku: string;
  productName: string;
  ownershipType: OwnershipType;
  movementType:
    | 'Opening Stock'
    | 'Purchase Receipt'
    | 'Consignment Receipt'
    | 'Customer Sale'
    | 'Customer Return'
    | 'Supplier Return'
    | 'Damage Quarantine'
    | 'Expiry Quarantine'
    | 'Physical Adjustment';
  qtyDelta: number;
  reason: string;
  actor: StaffRole;
}

export interface SaleLineItem {
  productId: string;
  sku: string;
  name: string;
  brand: string;
  ownershipType: OwnershipType;
  qty: number;
  unitPrice: number;
  landedCost: number;
  discount: number;
  lineTotal: number;
}

export interface SaleTransaction {
  id: string;
  billNo: string;
  timestamp: string;
  channel: SalesChannel;
  customerId: string | null;
  customerName: string;
  items: SaleLineItem[];
  subtotal: number;
  discountTotal: number;
  grandTotal: number;
  cogsTotal: number;
  paymentMode: PaymentMode;
  digitalRef?: string;
  isReturned?: boolean;
  billerRole: StaffRole;
}

export interface ExpenseRecord {
  id: string;
  date: string;
  category: 'Fixed / Recurring' | 'Variable' | 'One-Time Fit-Out';
  head:
    | 'Staff Salaries'
    | 'Utilities & Electricity'
    | 'Internet & POS Software'
    | 'Transportation & Logistics'
    | 'Packaging & Labels'
    | 'Marketing & Sampling'
    | 'Repairs & Maintenance'
    | 'Shelving & Equipment'
    | 'Premises / Rent';
  description: string;
  amount: number;
  paymentMode: 'Cash' | 'Bank / UPI';
  approvedBy: StaffRole;
  voucherRef: string;
}

export interface CapitalContribution {
  id: string;
  date: string;
  contributor: string;
  amount: number;
  purpose: string;
  mode: 'Bank Transfer' | 'Cash';
  nature: 'Founder Equity' | 'Working Capital Injection';
}

export interface CashReconciliation {
  id: string;
  date: string;
  openingCash: number;
  expectedCashSales: number;
  cashExpenses: number;
  cashRefunds: number;
  expectedClosingCash: number;
  actualCountedCash: number;
  digitalCollections: number;
  digitalVerified: boolean;
  difference: number;
  remarks: string;
  closedBy: StaffRole;
}

export interface Customer {
  id: string;
  customerCode: string; // GRM-CUS-000001
  name: string;
  phone: string;
  type: CustomerType;
  clubMember: boolean;
  whatsappOptIn: boolean;
  creditLimit: number;
  outstandingCredit: number;
  totalSpent: number;
  visitCount: number;
  lastVisit: string;
  preferredCategories: string[];
}

export interface CustomerEnquiry {
  id: string;
  date: string;
  customerName: string;
  phone: string;
  requestedItem: string;
  channel: 'In-Store' | 'WhatsApp' | 'Phone';
  status: 'Open' | 'Sourcing Evaluated' | 'Stocked' | 'Closed';
  notes: string;
}

export interface CustomerComplaint {
  id: string;
  date: string;
  customerName: string;
  billNo: string;
  productName: string;
  batchNumber: string;
  category:
    | 'Product Quality'
    | 'Packaging'
    | 'Pricing'
    | 'Billing'
    | 'Availability'
    | 'Safety Escalation';
  description: string;
  actionTaken: string;
  status: 'Open' | 'Escalated' | 'Resolved';
  closureDate?: string;
}

export interface SopChecklistItem {
  id: string;
  group: 'Opening SOP' | 'Closing SOP' | 'Cleanliness SOP';
  stepNumber: number;
  label: string;
  assignedRole: StaffRole;
  completed: boolean;
  lastUpdated?: string;
}

export interface PilotMilestone {
  id: string;
  phase: 'Days 1–15: Validation' | 'Days 16–30: Preparation' | 'Days 31–60: Controlled Launch' | 'Days 61–90: Performance Review';
  task: string;
  completed: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: StaffRole;
  module: string;
  action: string;
  details: string;
}

export interface OutletConfig {
  outletName: string;
  location: string;
  format: 'One-Shop Pilot' | 'Two-Shop Integrated';
  propertyArrangement: 'Profit Participation (15–20%)' | 'Fixed Rent Quote (₹35,000)';
  ownerSharePercent: number; // 15 to 20
  fixedRentMonthly: number; // 35000 if fixed rent selected
  reserveRetentionPercent: number; // e.g. 10% buffer before distributable profit
  openingCashFloat: number;
  bankBalance: number;
}

/* ============================================================================
 * DAKSH MARKET — Universal B2B Commerce & Procurement Network (GRAMOS FULE OS)
 * ============================================================================ */

export type DakshWorkspaceTab =
  | 'buyer'
  | 'vendor'
  | 'seller'
  | 'projects'
  | 'admin';

export type OrganizationRoleType =
  | 'Manufacturer'
  | 'Vendor'
  | 'Distributor'
  | 'Seller'
  | 'Buyer'
  | 'Service Provider'
  | 'Logistics Provider';

export type VerificationStatus =
  | 'Draft'
  | 'Pending Verification'
  | 'Verified'
  | 'Approved'
  | 'Suspended';

export type OfferingType =
  | 'Physical Product'
  | 'Service'
  | 'Bundle / Kit'
  | 'Made-to-Order'
  | 'Custom Specification'
  | 'Rental Asset'
  | 'Project Line Item'
  | 'Recurring Supply'
  | 'Digital Offering';

export interface UniversalIndustry {
  id: string;
  name: string;
  code: string;
  isCoreGramos: boolean;
  active: boolean;
}

export interface UniversalOrganization {
  id: string;
  orgId: string; // ORG-000001
  personId: string; // PER-000001
  name: string;
  city: string;
  state: string;
  contactPerson: string;
  phone: string;
  email: string;
  gstOrLicense: string;
  roles: OrganizationRoleType[];
  roleIds: {
    manufacturerId?: string; // MFR-000001
    vendorId?: string; // VND-000001
    distributorId?: string; // DST-000001
    sellerId?: string; // SLR-000001
    buyerId?: string; // BUY-000001
    serviceProviderId?: string; // SRV-000001
    logisticsProviderId?: string; // LOG-000001
  };
  verificationStatus: VerificationStatus;
  proposedCategories: string[]; // For onboarding vendors before verified SKUs exist
  linkedSupplierId?: string; // Sync bridge to GRAMOS Mart Supplier Network
  linkedCustomerId?: string; // Sync bridge to GRAMOS Mart CRM
  notes?: string;
  createdAt: string;
}

export interface CommercialRelationship {
  id: string;
  vendorOrgId: string; // ORG-...
  vendorId: string; // VND-...
  vendorName: string;
  sellerOrgId: string; // ORG-...
  sellerId: string; // SLR-...
  sellerName: string;
  permissions: Array<'View Cost Price' | 'Quote Buyer' | 'Create RFQ' | 'View Stock'>;
  status: 'Active' | 'Pending Approval' | 'Suspended';
  effectiveFrom: string;
  effectiveTo: string | null;
}

export interface VendorListing {
  id: string;
  listingCode: string; // DM-LST-0001
  vendorOrgId: string;
  vendorId: string; // VND-000001
  vendorName: string;
  manufacturerId?: string; // MFR-...
  inventoryOwnerOrgId: string; // Separate from catalogue access!
  offeringType: OfferingType;
  // 7-Level Universal Product Architecture
  industry: string; // Level 1
  category: string; // Level 2
  subcategory: string; // Level 3
  productFamily: string; // Level 4
  productName: string; // Level 5
  variant: string; // Level 6
  sku: string; // Level 7
  unitOfMeasure: string;
  moq: number;
  leadTimeDays: number;
  // Separate Public vs Confidential Vendor Cost
  publicIndicativePrice: number;
  confidentialCostPrice: number;
  gstPercent: number;
  availableCapacityOrStock: number;
  status: 'Pending Review' | 'Approved' | 'Published' | 'Suspended';
  syncedRetailProductId?: string; // Optional link if synced to GRAMOS Mart SKU
  sourceTimestamp: string;
  lastVerifiedAt: string | null;
}

export interface RequirementLineItem {
  id: string;
  description: string;
  industry: string;
  category: string;
  offeringType: OfferingType;
  qty: number;
  unit: string;
  specs: string;
}

export type MatchEvidenceStatus =
  | 'Verified Match'
  | 'Potential Match'
  | 'Insufficient Data';

export interface SupplyMatch {
  id: string;
  lineItemId: string;
  listingId: string | null;
  vendorId: string;
  vendorName: string;
  productName: string;
  sku: string;
  status: MatchEvidenceStatus;
  indicativeUnitPrice: number | null;
  moq: number | null;
  evidenceReason: string;
  sourceTimestamp: string;
}

export interface BuyerRequirement {
  id: string;
  reqCode: string; // REQ-000001
  buyerOrgId: string;
  buyerId: string; // BUY-000001
  buyerName: string;
  projectId?: string; // PRJ-000001
  title: string;
  rawPrompt: string;
  deliveryLocation: string;
  targetDeliveryDate: string | null;
  budgetCeiling: number | null;
  installationNeeded: boolean | null;
  missingInfoFlags: string[];
  items: RequirementLineItem[];
  matches: SupplyMatch[];
  status: 'Draft' | 'Clarification Needed' | 'Ready for RFQ' | 'RFQ Issued' | 'Awarded';
  sourceEnquiryId?: string; // Link back to GRAMOS Mart CRM enquiry
  createdAt: string;
}

export interface Rfq {
  id: string;
  rfqCode: string; // RFQ-000001
  requirementId: string;
  projectId?: string;
  buyerOrgId: string;
  buyerId: string;
  buyerName: string;
  sellerOrgId?: string;
  sellerId?: string;
  invitedVendorIds: string[]; // VND-... IDs
  title: string;
  deliveryLocation: string;
  dueDate: string;
  items: RequirementLineItem[];
  status: 'Open' | 'Quotes Received' | 'Awarded' | 'Closed';
  createdAt: string;
}

export interface RfqQuotation {
  id: string;
  quoteCode: string; // QTN-000001
  rfqId: string;
  vendorOrgId: string;
  vendorId: string;
  vendorName: string;
  sellerId?: string;
  revision: number;
  unitRatesSummary: string;
  subtotal: number;
  taxesTotal: number;
  freightTotal: number;
  installationTotal: number;
  landedTotal: number; // subtotal + taxes + freight + installation
  moqMet: boolean;
  deliveryDays: number;
  validityDate: string;
  warrantyTerms: string;
  paymentTerms: string;
  status: 'Submitted' | 'Shortlisted' | 'Awarded' | 'Rejected';
  humanApprovedAt: string;
  createdAt: string;
}

export type B2bOrderStage =
  | 'PO Issued'
  | 'Payment Recorded'
  | 'In Fulfilment'
  | 'Delivered & Accepted'
  | 'Cancelled';

export interface B2bOrder {
  id: string;
  orderCode: string; // PO-000001
  rfqId: string;
  quotationId: string;
  projectId?: string;
  buyerOrgId: string;
  buyerId: string;
  buyerName: string;
  vendorOrgId: string;
  vendorId: string;
  vendorName: string;
  sellerId?: string;
  title: string;
  landedTotal: number;
  stage: B2bOrderStage;
  paymentReference: string | null;
  fulfilmentTracking: string | null;
  deliveryAcceptedAt: string | null;
  syncedToGramosInventory: boolean;
  approvedByRole: StaffRole;
  createdAt: string;
}

export interface BoqPackage {
  id: string;
  packageName: string;
  category: string;
  estimatedBudget: number;
  assignedVendorId?: string;
  rfqId?: string;
  orderId?: string;
  deliveryStatus: 'Pending' | 'Partial Delivery' | 'Installed & Accepted';
  milestoneNotes: string;
}

export interface ProjectProcurement {
  id: string;
  projectCode: string; // PRJ-000001
  name: string;
  clientOrgId: string;
  clientName: string;
  location: string;
  totalBudget: number;
  targetLaunchDate: string;
  packages: BoqPackage[];
  status: 'Planning' | 'Active Procurement' | 'Execution' | 'Completed';
}

export interface CommissionAgreement {
  id: string;
  agreementCode: string;
  vendorId: string;
  vendorName: string;
  sellerId: string;
  sellerName: string;
  basis: 'Percentage of Net Subtotal' | 'Fixed Per Order' | 'Tiered';
  ratePercent: number;
  fixedAmount: number;
  effectiveFrom: string;
  status: 'Active' | 'Paused';
}

export type CommissionStatus =
  | 'Estimated'
  | 'Accrued'
  | 'Approved'
  | 'Payable'
  | 'Paid'
  | 'Reversed'
  | 'Disputed';

export interface CommissionEntry {
  id: string;
  entryCode: string;
  orderId: string;
  orderCode: string;
  sellerId: string;
  sellerName: string;
  vendorId: string;
  vendorName: string;
  agreementId: string;
  basisAmount: number;
  commissionAmount: number;
  status: CommissionStatus;
  paymentRef: string | null;
  updatedAt: string;
}

export interface DakshMarketState {
  industries: UniversalIndustry[];
  organizations: UniversalOrganization[];
  relationships: CommercialRelationship[];
  listings: VendorListing[];
  requirements: BuyerRequirement[];
  rfqs: Rfq[];
  quotations: RfqQuotation[];
  orders: B2bOrder[];
  projects: ProjectProcurement[];
  commissionAgreements: CommissionAgreement[];
  commissions: CommissionEntry[];
}

/* ============================================================================
 * GRAMOSFUEL — Brand & Product Sourcing OS (Project ID: DKS-P04-GF / GF-PF-001)
 * ============================================================================ */

export type GramosfuelIndustryGroup =
  | 'Industry A — Food and Nutrition'
  | 'Industry B — Household Essentials'
  | 'Industry C — Personal Care'
  | 'Industry D — Agriculture and Rural Products'
  | 'Industry E — Lifestyle and Utility';

export type GramosfuelLaunchStage =
  | 'Stage 1 — Idea'
  | 'Stage 2 — Research'
  | 'Stage 3 — Supplier Discovery'
  | 'Stage 4 — Sample'
  | 'Stage 5 — Costing'
  | 'Stage 6 — Compliance'
  | 'Stage 7 — Pilot'
  | 'Stage 8 — Customer Feedback'
  | 'Stage 9 — Commercial Decision';

export type CommercialDecisionOutcome =
  | 'Pending Review'
  | 'Expand'
  | 'Revise'
  | 'Pause'
  | 'Discontinue';

export type GramosfuelWorkspaceTab =
  | 'pipeline'
  | 'samples'
  | 'economics'
  | 'quality'
  | 'roadmap';

export interface SampleEvaluation {
  id: string;
  sampleCode: string;
  candidateId: string;
  candidateName: string;
  supplierId: string;
  supplierName: string;
  receivedDate: string;
  tasteOrPerformanceScore: number; // 1-5
  packagingScore: number; // 1-5
  shelfLifeAndSafetyScore: number; // 1-5
  verdict: 'Approved' | 'Revise' | 'Rejected';
  reviewerNotes: string;
}

export interface ProductUnitEconomics {
  manufacturingCost: number;
  packagingCost: number;
  labellingCost: number;
  transportationCost: number;
  storageCost: number;
  taxesPerUnit: number;
  distributorMarginPerUnit: number;
  retailerMarginPerUnit: number;
  marketingPerUnit: number;
  wastageReservePerUnit: number;
  proposedMrp: number;
  proposedSellingPrice: number;
  pilotBatchUnits: number;
}

export interface ProductQualitySpec {
  ingredientsOrMaterials: string;
  compositionSummary: string;
  packagingSpec: string;
  qualityRequirements: string;
  storageConditions: string;
  shelfLifeDays: number | null;
  fssaiOrLicenceVerified: boolean;
  labellingAndAllergenChecked: boolean;
  noUnsubstantiatedClaimsVerified: boolean;
  batchTraceabilityReady: boolean;
}

export interface ProductCandidate {
  id: string;
  ideaCode: string; // GF-PRD-001
  name: string;
  industryGroup: GramosfuelIndustryGroup;
  category: string;
  unitSize: string;
  stage: GramosfuelLaunchStage;
  isStartingHypothesis: boolean;
  customerProblem: string;
  competitorBenchmark: string;
  targetPriceBand: string;
  sourcingModel: 'Contract Manufacturing' | 'Regional Hadoti / Gramodaya' | 'Private Label';
  linkedSupplierId?: string;
  linkedDakshVendorId?: string;
  linkedDakshReqId?: string;
  linkedRetailProductId?: string; // Syncs directly to GRAMOS Mart Inventory & POS!
  sourceEnquiryId?: string; // Syncs from GRAMOS Mart CRM Demand Enquiries
  economics: ProductUnitEconomics;
  spec: ProductQualitySpec;
  commercialDecision: CommercialDecisionOutcome;
  decisionNotes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContractManufacturerChecklist {
  id: string;
  supplierId: string;
  supplierName: string;
  dakshVendorId?: string;
  legalAndRegulatoryChecked: boolean;
  capacityVerified: boolean;
  sampleQualityApproved: boolean;
  certificationsChecked: boolean;
  moqAndLeadTimeAgreed: boolean;
  batchTraceabilityConfirmed: boolean;
  notes: string;
}

export interface DistributionPhaseGate {
  id: string;
  phase:
    | 'Phase 1 — Local Validation (Kota & Hadoti)'
    | 'Phase 2 — Regional Distribution (Bundi, Baran, Jhalawar)'
    | 'Phase 3 — Rajasthan Expansion'
    | 'Phase 4 — National & Global Expansion';
  markets: string;
  gateCriteria: string;
  status: 'Active' | 'Preparing' | 'Locked (Needs Proof)';
}

export interface DocumentationRoadmapItem {
  id: string;
  phase:
    | 'Phase 1 — Foundation'
    | 'Phase 2 — Product Development'
    | 'Phase 3 — Production and Quality'
    | 'Phase 4 — Sales and Distribution'
    | 'Phase 5 — Finance and Growth';
  documentName: string;
  offlineRegisterName: string;
  completed: boolean;
}

export interface GramosfuelState {
  candidates: ProductCandidate[];
  samples: SampleEvaluation[];
  manufacturerChecks: ContractManufacturerChecklist[];
  distributionPhases: DistributionPhaseGate[];
  documentationRoadmap: DocumentationRoadmapItem[];
}

/* --------------------------------------------------------------------------
 * ENTERPRISE GOVERNANCE OS (Documents 13–16: Legal, QA, HR & Logistics)
 * ------------------------------------------------------------------------ */

export type GovernanceTab = 'legal' | 'quality' | 'hr' | 'logistics' | 'implementation';

// Document 13 (GRM-LGL-001): Legal Structure, Licences, Agreements & Compliance
export type EntityVerificationStatus =
  | 'Verified'
  | 'Pending Verification'
  | 'Discrepancy Flagged';

export interface EntityVerificationItem {
  id: string;
  itemNo: number;
  title: string;
  details: string;
  status: EntityVerificationStatus;
  actionRequired: string;
}

export type LegalPriority =
  | 'Priority 1 — Immediate'
  | 'Priority 2 — Before Public Opening'
  | 'Priority 3 — During Pilot'
  | 'Priority 4 — Before Expansion';

export interface LegalChecklistItem {
  id: string;
  itemNo: number;
  priority: LegalPriority;
  item: string;
  governingRule: string;
  completed: boolean;
  notes: string;
}

export interface ShopAgreementClause {
  id: string;
  clauseNo: number;
  title: string;
  summary: string;
  confirmed: boolean;
}

export interface CategoryComplianceRule {
  id: string;
  category: string;
  mandatoryChecks: string;
  status: 'Cleared' | 'Conditional — Check Per SKU' | 'Blocked — Licence Required';
  notes: string;
}

export interface LegalFolderRecord {
  id: string;
  folderNo: string;
  name: string;
  contentsSummary: string;
  ready: boolean;
}

// Document 14 (GRM-QAC-001): Quality Assurance, Verification, Food Safety & Recall
export type InventoryQualityStatus =
  | 'Status A — Approved Saleable'
  | 'Status B — Inspection Pending'
  | 'Status C — Damaged'
  | 'Status D — Expired'
  | 'Status E — Suspect / Quarantined'
  | 'Status F — Returned';

export type ProductApprovalDecision =
  | 'Approved'
  | 'Approved with Conditions'
  | 'Sample Evaluation Required'
  | 'Rejected'
  | 'Pending Documentation';

export interface ProductApprovalRecord {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  supplierName: string;
  stage1ProductId: boolean;
  stage2Docs: boolean;
  stage3Physical: boolean;
  stage4Commercial: boolean;
  decision: ProductApprovalDecision;
  reviewedBy: string;
  reviewedDate: string;
  notes: string;
}

export interface GrnInspectionRecord {
  id: string;
  grnCode: string;
  poCode: string;
  date: string;
  supplierName: string;
  productName: string;
  batchNo: string;
  qtyReceived: number;
  passedPoints: string[];
  qualityStatus: InventoryQualityStatus;
  decision: 'Accepted' | 'Quarantined' | 'Rejected';
  inspector: string;
  notes: string;
}

export type RecallSeverity =
  | 'Class I — Immediate Hazard'
  | 'Class II — Quality / Mislabel'
  | 'Preventive Withdrawal';

export type RecallStatus =
  | 'Quarantined — Stop Sale Active'
  | 'Supplier Investigation'
  | 'Disposed / Returned to Supplier'
  | 'Closed';

export interface RecallRecord {
  id: string;
  recallCode: string;
  date: string;
  productId: string;
  sku: string;
  productName: string;
  batchNo: string;
  supplierName: string;
  reason: string;
  severity: RecallSeverity;
  qtyAffected: number;
  qtyQuarantined: number;
  affectedCustomerBills: string[];
  immediateStopSaleDone: boolean;
  status: RecallStatus;
  notes: string;
}

export interface QualityAuditTask {
  id: string;
  cadence: 'Daily' | 'Weekly' | 'Monthly';
  task: string;
  owner: string;
  lastCompletedDate: string;
  completed: boolean;
}

// Document 15 (GRM-HR-001): Human Resources, Recruitment, Training & Workplace
export type StaffingModelOption =
  | 'Option A — Founder + 1 Employee'
  | 'Option B — Founder + 2 Employees';

export type ResponsibilityLevel =
  | 'Level 1 — Founder / Business Owner'
  | 'Level 2 — Store Manager / Operations Lead'
  | 'Level 3 — Sales & Customer Service Executive'
  | 'Level 4 — Inventory & Receiving Assistant';

export interface EmployeeTrainingMatrix {
  businessIntro: boolean;
  productKnowledge: boolean;
  customerService: boolean;
  billingPayments: boolean;
  inventoryFefo: boolean;
  safetyHygiene: boolean;
  digitalRbac: boolean;
}

export interface EmployeeRecord {
  id: string;
  empCode: string;
  name: string;
  level: ResponsibilityLevel;
  roleTitle: string;
  phone: string;
  joinDate: string;
  monthlyWage: number;
  docsAppointmentLetter: boolean;
  docsJobDescription: boolean;
  docsIdAddressVerified: boolean;
  docsWageTerms: boolean;
  docsPoshSafetyBriefed: boolean;
  trainingModules: EmployeeTrainingMatrix;
  status: 'Active' | 'Exited';
  exitAccessRevoked: boolean;
}

export interface AttendanceEntry {
  id: string;
  date: string;
  empCode: string;
  empName: string;
  shift: 'Morning (08:30–14:30)' | 'Full Day (09:00–20:00)' | 'Evening (14:00–21:00)';
  status: 'Present' | 'Half Day' | 'Leave' | 'Absent';
  notes: string;
}

export interface PayrollEntry {
  id: string;
  month: string;
  empCode: string;
  empName: string;
  grossWages: number;
  deductions: number;
  netPaid: number;
  paymentDate: string;
  paymentRef: string;
  status: 'Paid' | 'Pending';
}

// Document 16 (GRM-LOG-001): Logistics, Warehousing, Transport & Distribution
export type LogisticsMode =
  | 'Mode A — Supplier Delivery'
  | 'Mode B — Local Pickup'
  | 'Mode C — Third-Party Transport'
  | 'Mode D — Dedicated Vehicle';

export type DeliveryModel =
  | 'Model A — Customer Pickup'
  | 'Model B — Local Delivery'
  | 'Model C — Scheduled Bulk'
  | 'Model D — Institutional Delivery';

export type DispatchStatus =
  | 'Packed — Ready'
  | 'Out for Delivery'
  | 'Delivered — POD Verified'
  | 'Returned / Failed';

export interface DispatchRecord {
  id: string;
  dispatchCode: string;
  deliveryCode: string;
  date: string;
  orderOrBillRef: string;
  customerOrDestination: string;
  deliveryModel: DeliveryModel;
  transportMode: LogisticsMode;
  itemSummary: string;
  transportCost: number;
  status: DispatchStatus;
  deliveredAt: string | null;
  podNote: string;
}

export interface StockTransferRecord {
  id: string;
  transferCode: string;
  date: string;
  fromOutlet: string;
  toOutlet: string;
  productId: string;
  sku: string;
  productName: string;
  qty: number;
  reason: string;
  status: 'In Transit' | 'Received & Verified';
  authorizedBy: string;
}

export interface ProducerCollectionRecord {
  id: string;
  collectionCode: string;
  date: string;
  producerName: string;
  villageOrCluster: string;
  productName: string;
  qtyCollected: number;
  unit: string;
  transportMode: LogisticsMode;
  transportCost: number;
  grnCode: string;
  inspectionPassed: boolean;
}

export interface EnterpriseGovernanceState {
  // Doc 13
  entityVerifications: EntityVerificationItem[];
  legalChecklist: LegalChecklistItem[];
  shopAgreementClauses: ShopAgreementClause[];
  categoryCompliance: CategoryComplianceRule[];
  legalFolders: LegalFolderRecord[];
  // Doc 14
  productApprovals: ProductApprovalRecord[];
  grnInspections: GrnInspectionRecord[];
  recalls: RecallRecord[];
  qualityAudits: QualityAuditTask[];
  // Doc 15
  staffingModel: StaffingModelOption;
  employees: EmployeeRecord[];
  attendance: AttendanceEntry[];
  payroll: PayrollEntry[];
  // Doc 16
  dispatches: DispatchRecord[];
  stockTransfers: StockTransferRecord[];
  producerCollections: ProducerCollectionRecord[];
}

/* --------------------------------------------------------------------------
 * GRAMOS UNIVERSAL PRODUCT LIBRARY (GRM-PL-001)
 * ------------------------------------------------------------------------ */

export type ProductUniverseIndustry =
  | '01. Food & Grocery'
  | '02. Snacks & Traditional Foods'
  | '03. Beverages'
  | '04. Household & Cleaning'
  | '05. Personal Care'
  | '06. Stationery & Education'
  | '07. Agriculture & Gardening'
  | '08. Regional & Handicraft Products'
  | '09. Kitchen & Utility'
  | '10. Home & Lifestyle'
  | '11. Apparel & Everyday Accessories'
  | '12. Seasonal, Festival & Gift Products';

export type LibraryWorkflowStatus =
  | 'Discovered'
  | 'Shortlisted'
  | 'Supplier Identified'
  | 'Sample Requested'
  | 'Testing'
  | 'Approved'
  | 'Rejected'
  | 'Commercial Catalogue'
  | 'Market Performance';

export type LibraryLevel =
  | 'Level 1 — Master Product Library'
  | 'Level 2 — Tested Product Library'
  | 'Level 3 — Approved Commercial Catalogue';

export type LibraryBrandTrack =
  | 'GRAMOSFUEL'
  | 'GRAMOS / Apna Bazar Select'
  | 'Made in Hadoti'
  | 'Third-Party Brand';

export type LibraryWorkspaceTab =
  | 'universe'
  | 'batch01'
  | 'batch02'
  | 'batch03'
  | 'batch04'
  | 'batch05'
  | 'research'
  | 'scorecard'
  | 'batches';

export type Batch01CategoryGroup =
  | 'Category A — Grains, rice and cereals'
  | 'Category B — Pulses and legumes'
  | 'Category C — Flour and cooking ingredients'
  | 'Category D — Oils, spices and condiments'
  | 'Category E — Everyday grocery essentials'
  | 'Category F — GRAMOSFUEL product opportunities';

export type Batch02CategoryGroup =
  | 'Category 1 — Namkeen and Savoury Snacks'
  | 'Category 2 — Traditional Dry Snacks'
  | 'Category 3 — Rajasthan and Hadoti Specialities'
  | 'Category 4 — Traditional Sweets and Confectionery'
  | 'Category 5 — Ready-to-Cook, Bakery and Regional Innovations';

export type Batch03CategoryGroup =
  | 'Category 1 — Traditional Indian Drinks'
  | 'Category 2 — Health and Nutrition Drinks'
  | 'Category 3 — Tea, Coffee and Herbal Infusions'
  | 'Category 4 — Fruit and Vegetable Beverages'
  | 'Category 5 — Dairy, Refreshers and Beverage Innovations';

export type Batch04CategoryGroup =
  | 'Category 1 — Bath and Body Care'
  | 'Category 2 — Hair Care'
  | 'Category 3 — Face and Skin Care'
  | 'Category 4 — Oral Care and Hygiene'
  | 'Category 5 — Grooming, Beauty and Accessories';

export type Batch05CategoryGroup =
  | 'Category 1 — Laundry and Fabric Care'
  | 'Category 2 — Floor and Surface Cleaning'
  | 'Category 3 — Dishwashing and Kitchen Hygiene'
  | 'Category 4 — Cleaning Tools and Consumables'
  | 'Category 5 — Household Hygiene and Pest Management';

export interface Batch01CandidateItem {
  id: string;
  itemNo: number;
  researchId: string; // GRM-PL-B01-001 .. GRM-PL-B01-050
  name: string;
  subtitle: string;
  categoryGroup: Batch01CategoryGroup;
  industry: ProductUniverseIndustry;
  category: string;
  brandTrack: LibraryBrandTrack;
  isTestingPriority: boolean;
  selected: boolean;
  preparedLibraryId?: string;
}

export interface Batch02CandidateItem {
  id: string;
  itemNo: number;
  researchId: string; // GRM-PL-B02-001 .. GRM-PL-B02-050
  name: string;
  subtitle: string;
  categoryGroup: Batch02CategoryGroup;
  industry: ProductUniverseIndustry;
  category: string;
  brandTrack: LibraryBrandTrack;
  isTestingPriority: boolean;
  requiresFreshOrColdSupply: boolean;
  specialHandlingNote: string;
  selected: boolean;
  preparedLibraryId?: string;
}

export interface Batch03CandidateItem {
  id: string;
  itemNo: number;
  researchId: string; // GRM-PL-B03-001 .. GRM-PL-B03-050
  name: string;
  subtitle: string;
  categoryGroup: Batch03CategoryGroup;
  industry: ProductUniverseIndustry;
  category: string;
  brandTrack: LibraryBrandTrack;
  isTestingPriority: boolean;
  isGramosfuelOpportunity: boolean;
  handlingAndClaimsFlag: 'standard' | 'cold-chain-expiry' | 'claims-regulatory';
  specialHandlingNote: string;
  selected: boolean;
  preparedLibraryId?: string;
}

export interface Batch04CandidateItem {
  id: string;
  itemNo: number;
  researchId: string; // GRM-PL-B04-001 .. GRM-PL-B04-050
  name: string;
  subtitle: string;
  categoryGroup: Batch04CategoryGroup;
  industry: ProductUniverseIndustry;
  category: string;
  brandTrack: LibraryBrandTrack;
  isTestingPriority: boolean;
  isGramosfuelOpportunity: boolean;
  regulatoryFocus: 'cosmetics-standard' | 'medical-device-hygiene' | 'no-therapeutic-claims';
  specialHandlingNote: string;
  selected: boolean;
  preparedLibraryId?: string;
}

export interface Batch05CandidateItem {
  id: string;
  itemNo: number;
  researchId: string; // GRM-PL-B05-001 .. GRM-PL-B05-050
  name: string;
  subtitle: string;
  categoryGroup: Batch05CategoryGroup;
  industry: ProductUniverseIndustry;
  category: string;
  brandTrack: LibraryBrandTrack;
  isTestingPriority: boolean;
  isGramosfuelOpportunity: boolean;
  safetyRegulatoryFlag: 'standard-cleaning' | 'cibrc-pest-control' | 'corrosive-chemical-zone-e';
  specialHandlingNote: string;
  selected: boolean;
  preparedLibraryId?: string;
}

export interface LibraryEvaluationScorecard {
  productQuality: number; // 0 = unscored, 1–5 scored
  customerUsefulness: number;
  marketDemand: number;
  purchaseCost: number;
  potentialSellingPrice: number;
  grossMarginPotential: number;
  supplierReliability: number;
  packagingPresentation: number;
  storageShelfLife: number;
  repeatPurchasePotential: number;
}

export interface LibraryComplianceGate {
  sampleTested: boolean;
  safetyCheckPassed: boolean;
  legalLabellingPassed: boolean;
  qualityTestPassed: boolean;
}

export interface ProductLibraryRecord {
  id: string;
  libraryCode: string; // e.g., GRM-FD-SNK-0001 or GRM-PL-B01-001
  batchCode: string; // e.g., Batch 01
  productName: string;
  variantOrPackSize: string;
  industry: ProductUniverseIndustry;
  category: string;
  subcategory: string;
  description: string;
  marketRelevance: string;
  brandTrack: LibraryBrandTrack;
  sourcingOptions: string[];
  status: LibraryWorkflowStatus;
  linkedSupplierId?: string;
  linkedSupplierName?: string;
  // Separate estimates vs verified supplier quotations (Rule 6)
  estimatedCostRange: string;
  targetSellingPriceRange: string;
  actualQuotedLandedCost: number | null;
  actualProposedSellingPrice: number | null;
  actualMrp: number | null;
  quotationSourceRef: string;
  shelfLifeAndStorage: string;
  regulatoryRequirements: string;
  sampleTestingNotes: string;
  testingEvidenceLogged: boolean;
  rejectionReason: string;
  scorecard: LibraryEvaluationScorecard;
  complianceGate: LibraryComplianceGate;
  linkedRetailProductId?: string;
  linkedGramosfuelCandidateId?: string;
  linkedDakshReqCode?: string;
  discoveredDate: string;
  updatedAt: string;
}

export interface LibraryBatchRoadmapItem {
  id: string;
  batchCode: string;
  title: string;
  focusIndustries: string;
  status: 'Active' | 'Planned' | 'Completed';
  notes: string;
}

export interface ProductLibraryState {
  records: ProductLibraryRecord[];
  batches: LibraryBatchRoadmapItem[];
  batch01Candidates: Batch01CandidateItem[];
  batch02Candidates: Batch02CandidateItem[];
  batch03Candidates: Batch03CandidateItem[];
  batch04Candidates: Batch04CandidateItem[];
  batch05Candidates: Batch05CandidateItem[];
}
