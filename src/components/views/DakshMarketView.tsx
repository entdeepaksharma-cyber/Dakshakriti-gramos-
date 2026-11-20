import React, { useMemo, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  ClipboardList,
  FolderKanban,
  Layers,
  Lock,
  PackagePlus,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Store,
  UserCheck,
} from 'lucide-react';
import { useGramosStore } from '../../context/StoreContext';
import {
  B2bOrderStage,
  CommissionStatus,
  DakshWorkspaceTab,
  OfferingType,
  OrganizationRoleType,
  Rfq,
} from '../../types/gramos';
import { formatDateShort, formatINR } from '../../utils/formatters';
import { RequirementAssistantModal } from '../daksh/RequirementAssistantModal';

const WORKSPACE_TABS: Array<{ id: DakshWorkspaceTab; label: string }> = [
  { id: 'buyer', label: 'Buyer OS' },
  { id: 'vendor', label: 'Vendor OS' },
  { id: 'seller', label: 'Seller OS' },
  { id: 'projects', label: 'Project Procurement OS' },
  { id: 'admin', label: 'Admin & Universal Taxonomy' },
];

const ALL_ROLES: OrganizationRoleType[] = [
  'Manufacturer',
  'Vendor',
  'Distributor',
  'Seller',
  'Buyer',
  'Service Provider',
  'Logistics Provider',
];

const OFFERING_TYPES: OfferingType[] = [
  'Physical Product',
  'Service',
  'Bundle / Kit',
  'Made-to-Order',
  'Custom Specification',
  'Rental Asset',
  'Project Line Item',
  'Recurring Supply',
  'Digital Offering',
];

export const DakshMarketView: React.FC = () => {
  const {
    state,
    dakshTab,
    setDakshTab,
    setActiveNav,
    addUniversalIndustry,
    createOrganization,
    updateOrganizationStatus,
    submitVendorListing,
    updateListingStatus,
    clarifyRequirement,
    runSupplyMatching,
    createRfqFromRequirement,
    submitQuotation,
    awardQuotationToOrder,
    advanceB2bOrderStage,
    updateCommissionStatus,
    createProject,
    updateBoqPackage,
  } = useGramosStore();

  const dm = state.dakshMarket;

  // Tenant / Organization Context Switcher for clean isolation
  const [activeOrgId, setActiveOrgId] = useState<string>('ADMIN');
  const activeOrg = useMemo(
    () => dm.organizations.find((o) => o.orgId === activeOrgId) || null,
    [dm.organizations, activeOrgId]
  );

  // Modals & Interactive State
  const [showReqAssistant, setShowReqAssistant] = useState(false);
  const [clarifyingReqId, setClarifyingReqId] = useState<string | null>(null);
  const [clarifyForm, setClarifyForm] = useState({
    budgetCeiling: '',
    targetDeliveryDate: '',
    installationNeeded: 'yes' as 'yes' | 'no',
  });

  // RFQ Modal state
  const [rfqTargetReqId, setRfqTargetReqId] = useState<string | null>(null);
  const [selectedVendorsForRfq, setSelectedVendorsForRfq] = useState<string[]>(['VND-000002']);
  const [rfqDueDate, setRfqDueDate] = useState('2026-11-22');

  // Vendor Quotation Modal state
  const [quotingRfq, setQuotingRfq] = useState<Rfq | null>(null);
  const [quoteVendorOrgId, setQuoteVendorOrgId] = useState<string>('ORG-000002');
  const [quoteForm, setQuoteForm] = useState({
    unitRatesSummary: '',
    subtotal: 25000,
    taxesTotal: 1500,
    freightTotal: 600,
    installationTotal: 0,
    deliveryDays: 5,
    validityDate: '2026-12-05',
    warrantyTerms: 'Standard manufacturer warranty',
    paymentTerms: '15-Day Credit or NEFT',
    moqMet: true,
  });

  // Vendor Listing Submission Form
  const [showListingForm, setShowListingForm] = useState(false);
  const [listingForm, setListingForm] = useState({
    vendorOrgId: 'ORG-000004',
    offeringType: 'Physical Product' as OfferingType,
    industry: dm.industries[8]?.name || dm.industries[0]?.name || 'Furniture and interiors',
    category: 'Furniture',
    subcategory: 'Commercial Seating',
    productFamily: 'Café & Bistro Furniture',
    productName: '',
    variant: '',
    sku: '',
    unitOfMeasure: 'Unit',
    moq: 10,
    leadTimeDays: 7,
    publicIndicativePrice: 2400,
    confidentialCostPrice: 2050,
    gstPercent: 18,
    availableCapacityOrStock: 100,
  });

  // Admin: Add Industry & Add Organization
  const [newIndustryName, setNewIndustryName] = useState('');
  const [showNewOrgForm, setShowNewOrgForm] = useState(false);
  const [newOrgForm, setNewOrgForm] = useState({
    name: '',
    city: 'Kota',
    state: 'Rajasthan',
    contactPerson: '',
    phone: '',
    email: '',
    gstOrLicense: '',
    roles: ['Vendor'] as OrganizationRoleType[],
    proposedCategoriesText: '',
  });

  // Project Creation Modal
  const [showNewProject, setShowNewProject] = useState(false);
  const [projectForm, setProjectForm] = useState({
    name: '',
    clientOrgId: 'ORG-000001',
    location: 'Kota, Rajasthan',
    totalBudget: 300000,
    targetLaunchDate: '2026-12-30',
    packageName: 'Primary Supply Package',
    packageCategory: 'Furniture',
    packageBudget: 150000,
  });

  // Order stage inline action
  const [orderRefMap, setOrderRefMap] = useState<Record<string, string>>({});

  // Real calculated counts (no fabricated numbers)
  const verifiedOrgsCount = dm.organizations.filter(
    (o) => o.verificationStatus === 'Verified' || o.verificationStatus === 'Approved'
  ).length;
  const publishedListingsCount = dm.listings.filter((l) => l.status === 'Published').length;
  const openRfqsCount = dm.rfqs.filter((r) => r.status !== 'Closed' && r.status !== 'Awarded').length;
  const commissionTotals = useMemo(() => {
    return dm.commissions.reduce(
      (acc, c) => {
        if (c.status === 'Estimated') acc.estimated += c.commissionAmount;
        if (c.status === 'Accrued') acc.accrued += c.commissionAmount;
        if (c.status === 'Approved' || c.status === 'Payable') acc.payable += c.commissionAmount;
        if (c.status === 'Paid') acc.paid += c.commissionAmount;
        return acc;
      },
      { estimated: 0, accrued: 0, payable: 0, paid: 0 }
    );
  }, [dm.commissions]);

  const vendorOrgs = dm.organizations.filter((o) => o.roleIds.vendorId);

  const visibleRfqsForVendor = useMemo(() => {
    if (activeOrg?.roleIds.vendorId) {
      return dm.rfqs.filter((r) => r.invitedVendorIds.includes(activeOrg.roleIds.vendorId!));
    }
    return dm.rfqs;
  }, [dm.rfqs, activeOrg]);

  const canSeeVendorCost = (vendorOrgId: string, vendorId: string): boolean => {
    if (activeOrgId === 'ADMIN') return true;
    if (activeOrg?.orgId === vendorOrgId) return true;
    if (activeOrg?.roleIds.sellerId) {
      return dm.relationships.some(
        (rel) =>
          rel.vendorId === vendorId &&
          rel.sellerId === activeOrg.roleIds.sellerId &&
          rel.status === 'Active' &&
          rel.permissions.includes('View Cost Price')
      );
    }
    return false;
  };

  const handleSubmitListing = (e: React.FormEvent) => {
    e.preventDefault();
    const vendorOrg = dm.organizations.find((o) => o.orgId === listingForm.vendorOrgId);
    if (!vendorOrg || !listingForm.productName.trim()) return;

    const seq = String(dm.listings.length + 1).padStart(3, '0');
    submitVendorListing({
      vendorOrgId: vendorOrg.orgId,
      vendorId: vendorOrg.roleIds.vendorId || 'VND-000001',
      vendorName: vendorOrg.name,
      manufacturerId: vendorOrg.roleIds.manufacturerId,
      inventoryOwnerOrgId: vendorOrg.orgId,
      offeringType: listingForm.offeringType,
      industry: listingForm.industry,
      category: listingForm.category.trim() || 'General',
      subcategory: listingForm.subcategory.trim() || 'Standard',
      productFamily: listingForm.productFamily.trim() || listingForm.category,
      productName: listingForm.productName.trim(),
      variant: listingForm.variant.trim() || 'Standard Commercial Spec',
      sku: listingForm.sku.trim() || `DM-${vendorOrg.roleIds.vendorId}-${seq}`,
      unitOfMeasure: listingForm.unitOfMeasure,
      moq: listingForm.moq,
      leadTimeDays: listingForm.leadTimeDays,
      publicIndicativePrice: listingForm.publicIndicativePrice,
      confidentialCostPrice: listingForm.confidentialCostPrice,
      gstPercent: listingForm.gstPercent,
      availableCapacityOrStock: listingForm.availableCapacityOrStock,
      status: 'Pending Review',
    });

    setShowListingForm(false);
    setListingForm((prev) => ({ ...prev, productName: '', variant: '', sku: '' }));
  };

  const handleCreateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgForm.name.trim() || newOrgForm.roles.length === 0) return;
    createOrganization({
      name: newOrgForm.name,
      city: newOrgForm.city,
      state: newOrgForm.state,
      contactPerson: newOrgForm.contactPerson || 'Primary Desk',
      phone: newOrgForm.phone || '+91 98000 00000',
      email: newOrgForm.email || 'desk@partner.example',
      gstOrLicense: newOrgForm.gstOrLicense,
      roles: newOrgForm.roles,
      proposedCategories: newOrgForm.proposedCategoriesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    });
    setShowNewOrgForm(false);
    setNewOrgForm({
      name: '',
      city: 'Kota',
      state: 'Rajasthan',
      contactPerson: '',
      phone: '',
      email: '',
      gstOrLicense: '',
      roles: ['Vendor'],
      proposedCategoriesText: '',
    });
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.name.trim()) return;
    createProject({
      name: projectForm.name,
      clientOrgId: projectForm.clientOrgId,
      location: projectForm.location,
      totalBudget: projectForm.totalBudget,
      targetLaunchDate: projectForm.targetLaunchDate,
      packages: [
        {
          packageName: projectForm.packageName,
          category: projectForm.packageCategory,
          estimatedBudget: projectForm.packageBudget,
          deliveryStatus: 'Pending',
          milestoneNotes: 'Created from Project Procurement OS',
        },
      ],
    });
    setShowNewProject(false);
    setProjectForm((prev) => ({ ...prev, name: '' }));
  };

  return (
    <div className="space-y-5">
      {/* Header & Tenant Isolation Switcher */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-[11px] font-medium text-teal-700">
            GRAMOS FULE Growth OS · Universal Commerce Engine
          </div>
          <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
            DAKSH MARKET — Multi-Industry B2B & Procurement Network
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {verifiedOrgsCount} verified organizations · {publishedListingsCount} published B2B SKUs ·{' '}
            {dm.industries.filter((i) => i.active).length} active industries · {openRfqsCount} active RFQs
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
            <Lock className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <span className="text-slate-500 whitespace-nowrap">Tenant View:</span>
            <select
              value={activeOrgId}
              onChange={(e) => setActiveOrgId(e.target.value)}
              aria-label="Active organization tenant view"
              className="bg-transparent font-semibold text-slate-900 focus:outline-none cursor-pointer max-w-[230px]"
            >
              <option value="ADMIN">Platform Admin (GRAMOS FULE)</option>
              {dm.organizations.map((org) => (
                <option key={org.orgId} value={org.orgId}>
                  {org.orgId} · {org.name} ({org.roles.join('/')})
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => setShowReqAssistant(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-800 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            New Requirement
          </button>
        </div>
      </div>

      {/* Workspace Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex flex-wrap rounded-lg border border-slate-200 bg-white p-1 gap-0.5">
          {WORKSPACE_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setDakshTab(t.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                dakshTab === t.id
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="text-[11px] font-mono text-slate-500 tabular-nums">
          Orders {dm.orders.length} · Accrued Commissions {formatINR(commissionTotals.accrued)}
        </div>
      </div>

      {/* =====================================================================
          TAB 1: BUYER OS (Requirements -> Matching -> RFQ -> Quotes -> PO)
         ===================================================================== */}
      {dakshTab === 'buyer' && (
        <div className="space-y-5">
          {/* Buyer Requirements & Evidence-Based Matching */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="font-display text-base font-semibold text-slate-900">
                  1. Structured Buyer Requirements & Evidence-Based Matching
                </h3>
                <p className="text-xs text-slate-500">
                  Matching labels strictly reflect verified catalogue evidence — unverified vendors show Insufficient Data rather than guessed prices
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowReqAssistant(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 self-start"
              >
                <Sparkles className="h-3.5 w-3.5 text-teal-700" />
                Launch Requirement Assistant
              </button>
            </div>

            <div className="divide-y divide-slate-200">
              {dm.requirements.map((req) => (
                <div key={req.id} className="p-5 space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-[11px] font-mono text-slate-500 tabular-nums">
                        {req.reqCode} · {req.buyerId} ({req.buyerName}) · {formatDateShort(req.createdAt)}
                        {req.projectId ? ` · Project ${req.projectId}` : ''}
                        {req.sourceEnquiryId ? ' · Synced from GRAMOS CRM' : ''}
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900 mt-0.5">{req.title}</h4>
                      <p className="text-xs text-slate-600 mt-0.5">{req.rawPrompt}</p>
                      <div className="mt-1.5 text-[11px] font-mono text-slate-500 tabular-nums">
                        Location: {req.deliveryLocation} · Budget:{' '}
                        {req.budgetCeiling ? formatINR(req.budgetCeiling) : 'Pending'} · Delivery:{' '}
                        {req.targetDeliveryDate ? formatDateShort(req.targetDeliveryDate) : 'Pending'} ·
                        Install:{' '}
                        {req.installationNeeded === null
                          ? 'Unconfirmed'
                          : req.installationNeeded
                          ? 'Yes'
                          : 'No'}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <span
                        className={`text-xs font-semibold ${
                          req.status === 'Awarded'
                            ? 'text-emerald-700'
                            : req.status === 'Clarification Needed'
                            ? 'text-amber-700'
                            : 'text-teal-700'
                        }`}
                      >
                        {req.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => runSupplyMatching(req.id)}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Re-run Matching
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRfqTargetReqId(req.id);
                          const matchedVendorIds = Array.from(
                            new Set(
                              req.matches
                                .filter((m) => m.vendorId && m.vendorId !== 'NONE')
                                .map((m) => m.vendorId)
                            )
                          );
                          setSelectedVendorsForRfq(
                            matchedVendorIds.length > 0 ? matchedVendorIds : ['VND-000002']
                          );
                        }}
                        className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-slate-800"
                      >
                        <Send className="h-3 w-3" />
                        Issue RFQ
                      </button>
                    </div>
                  </div>

                  {/* Missing Info Prompt + Inline Clarification */}
                  {req.missingInfoFlags.length > 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-xs text-amber-900">
                        <span className="font-semibold">Missing Info:</span>{' '}
                        {req.missingInfoFlags.join(' · ')}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setClarifyingReqId(req.id);
                          setClarifyForm({
                            budgetCeiling: req.budgetCeiling ? String(req.budgetCeiling) : '250000',
                            targetDeliveryDate: req.targetDeliveryDate || '2026-12-10',
                            installationNeeded: req.installationNeeded === false ? 'no' : 'yes',
                          });
                        }}
                        className="text-xs font-semibold text-amber-900 underline shrink-0 self-start sm:self-center"
                      >
                        Complete Missing Specs
                      </button>
                    </div>
                  )}

                  {clarifyingReqId === req.id && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 grid grid-cols-1 gap-2 sm:grid-cols-4 items-end">
                      <label className="block text-[11px]">
                        <span className="font-medium text-slate-700">Budget Ceiling (₹)</span>
                        <input
                          type="number"
                          value={clarifyForm.budgetCeiling}
                          onChange={(e) =>
                            setClarifyForm({ ...clarifyForm, budgetCeiling: e.target.value })
                          }
                          className="mt-1 w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs"
                        />
                      </label>
                      <label className="block text-[11px]">
                        <span className="font-medium text-slate-700">Target Delivery Date</span>
                        <input
                          type="date"
                          value={clarifyForm.targetDeliveryDate}
                          onChange={(e) =>
                            setClarifyForm({ ...clarifyForm, targetDeliveryDate: e.target.value })
                          }
                          className="mt-1 w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs"
                        />
                      </label>
                      <label className="block text-[11px]">
                        <span className="font-medium text-slate-700">Installation Required</span>
                        <select
                          value={clarifyForm.installationNeeded}
                          onChange={(e) =>
                            setClarifyForm({
                              ...clarifyForm,
                              installationNeeded: e.target.value as 'yes' | 'no',
                            })
                          }
                          className="mt-1 w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                        >
                          <option value="yes">Yes — On-site Install</option>
                          <option value="no">No — Delivery Only</option>
                        </select>
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            clarifyRequirement(req.id, {
                              budgetCeiling: Number(clarifyForm.budgetCeiling) || null,
                              targetDeliveryDate: clarifyForm.targetDeliveryDate || null,
                              installationNeeded: clarifyForm.installationNeeded === 'yes',
                            });
                            setClarifyingReqId(null);
                          }}
                          className="rounded bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setClarifyingReqId(null)}
                          className="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Line Items & Evidence Matches */}
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 space-y-1.5">
                      <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                        Structured Line Items ({req.items.length})
                      </div>
                      {req.items.map((it) => (
                        <div
                          key={it.id}
                          className="flex items-start justify-between gap-2 text-xs border-b border-slate-200/70 last:border-0 pb-1.5 last:pb-0"
                        >
                          <div>
                            <div className="font-medium text-slate-900">{it.description}</div>
                            <div className="text-[11px] text-slate-500">
                              {it.industry} · {it.offeringType}
                            </div>
                          </div>
                          <div className="font-mono text-xs font-semibold text-slate-800 tabular-nums shrink-0">
                            {it.qty} {it.unit}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 space-y-1.5">
                      <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                        Supply Matching Evidence ({req.matches.length})
                      </div>
                      {req.matches.map((m) => (
                        <div
                          key={m.id}
                          className="text-xs border-b border-slate-200/70 last:border-0 pb-1.5 last:pb-0"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-slate-900">
                              {m.vendorId !== 'NONE' ? `${m.vendorId} · ` : ''}
                              {m.vendorName}
                            </span>
                            <span
                              className={`text-[11px] font-semibold shrink-0 ${
                                m.status === 'Verified Match'
                                  ? 'text-emerald-700'
                                  : m.status === 'Potential Match'
                                  ? 'text-teal-700'
                                  : 'text-amber-700'
                              }`}
                            >
                              {m.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600 mt-0.5">{m.evidenceReason}</div>
                          {m.indicativeUnitPrice !== null && (
                            <div className="text-[11px] font-mono text-slate-500 tabular-nums mt-0.5">
                              SKU {m.sku} · Indicative {formatINR(m.indicativeUnitPrice)} · MOQ {m.moq}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. RFQs & Landed-Cost Quotation Comparison */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4">
              <h3 className="font-display text-base font-semibold text-slate-900">
                2. Multi-Vendor RFQs & Landed-Cost Quotation Comparison
              </h3>
              <p className="text-xs text-slate-500">
                Compare unit subtotal, taxes, freight, installation, MOQ, delivery days, and warranty before human-approved PO award
              </p>
            </div>

            <div className="divide-y divide-slate-200">
              {dm.rfqs.map((rfq) => {
                const quotes = dm.quotations.filter((q) => q.rfqId === rfq.id);
                return (
                  <div key={rfq.id} className="p-5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="text-[11px] font-mono text-slate-500 tabular-nums">
                          {rfq.rfqCode} · Buyer {rfq.buyerId} ({rfq.buyerName}) · Due{' '}
                          {formatDateShort(rfq.dueDate)}
                        </div>
                        <div className="text-sm font-semibold text-slate-900">{rfq.title}</div>
                        <div className="text-[11px] text-slate-500">
                          Invited Vendors: {rfq.invitedVendorIds.join(', ')}
                          {rfq.sellerId ? ` · Seller Desk: ${rfq.sellerId}` : ''}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-700">{rfq.status}</span>
                        {rfq.status !== 'Awarded' && (
                          <button
                            type="button"
                            onClick={() => {
                              setQuotingRfq(rfq);
                              const firstInvitedOrg = dm.organizations.find(
                                (o) => o.roleIds.vendorId === rfq.invitedVendorIds[0]
                              );
                              setQuoteVendorOrgId(firstInvitedOrg?.orgId || 'ORG-000002');
                            }}
                            className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-800 hover:bg-slate-100"
                          >
                            + Submit Vendor Quote
                          </button>
                        )}
                      </div>
                    </div>

                    {quotes.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-slate-200 p-4 text-xs text-slate-500">
                        No vendor quotations submitted yet for {rfq.rfqCode}. Switch to Vendor OS or click Submit Vendor Quote above.
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-lg border border-slate-200">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-medium text-slate-500">
                              <th className="py-2.5 px-3">Quote · Vendor</th>
                              <th className="py-2.5 px-3">Breakdown & Terms</th>
                              <th className="py-2.5 px-3 text-right">Subtotal + Tax + Freight</th>
                              <th className="py-2.5 px-3 text-right">Landed Total</th>
                              <th className="py-2.5 px-3 text-right">Decision</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {quotes.map((q) => (
                              <tr key={q.id}>
                                <td className="py-2.5 px-3">
                                  <div className="font-mono text-[11px] text-slate-500">
                                    {q.quoteCode} · Rev {q.revision}
                                  </div>
                                  <div className="font-semibold text-slate-900">
                                    {q.vendorId} · {q.vendorName}
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    Delivery {q.deliveryDays}d · Valid {formatDateShort(q.validityDate)}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="text-slate-800">{q.unitRatesSummary}</div>
                                  <div className="text-[11px] text-slate-500">
                                    {q.paymentTerms} · {q.warrantyTerms} · MOQ {q.moqMet ? 'Met' : 'Exception'}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">
                                  {formatINR(q.subtotal)} + {formatINR(q.taxesTotal)} +{' '}
                                  {formatINR(q.freightTotal + q.installationTotal)}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-semibold tabular-nums text-slate-900">
                                  {formatINR(q.landedTotal)}
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  {q.status === 'Awarded' ? (
                                    <span className="font-semibold text-emerald-700">PO Awarded</span>
                                  ) : q.status === 'Rejected' ? (
                                    <span className="text-slate-400">Closed</span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => awardQuotationToOrder(q.id)}
                                      className="rounded-md bg-teal-700 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-teal-800"
                                    >
                                      Approve & Award PO
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Active B2B Purchase Orders & Acceptance */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4">
              <h3 className="font-display text-base font-semibold text-slate-900">
                3. Awarded Purchase Orders, Payment Record & Delivery Acceptance
              </h3>
              <p className="text-xs text-slate-500">
                Direct B2B payment & fulfilment records (no platform escrow). Accepting delivery transitions seller commission from Estimated to Accrued and syncs GRAMOS Mart payables when applicable.
              </p>
            </div>
            {dm.orders.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No B2B Purchase Orders awarded yet. Approve a vendor quotation above (e.g., QTN-000001 on RFQ-000001) to initiate an order.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {dm.orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-[11px] font-mono text-slate-500 tabular-nums">
                        {ord.orderCode} · Buyer {ord.buyerId} → Vendor {ord.vendorId} ({ord.vendorName})
                        {ord.sellerId ? ` · Seller ${ord.sellerId}` : ''}
                      </div>
                      <div className="text-sm font-semibold text-slate-900">{ord.title}</div>
                      <div className="text-xs text-slate-600 font-mono tabular-nums mt-0.5">
                        Landed Value {formatINR(ord.landedTotal)} · Stage:{' '}
                        <span className="font-semibold text-teal-800">{ord.stage}</span>
                        {ord.paymentReference ? ` · Pay Ref: ${ord.paymentReference}` : ''}
                        {ord.fulfilmentTracking ? ` · Dispatch: ${ord.fulfilmentTracking}` : ''}
                        {ord.syncedToGramosInventory ? ' · Synced to GRAMOS Credit Ledger' : ''}
                      </div>
                    </div>

                    {ord.stage !== 'Delivered & Accepted' && ord.stage !== 'Cancelled' && (
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          value={orderRefMap[ord.id] || ''}
                          onChange={(e) =>
                            setOrderRefMap((prev) => ({ ...prev, [ord.id]: e.target.value }))
                          }
                          placeholder={
                            ord.stage === 'PO Issued'
                              ? 'Payment UTR / Cheque Ref...'
                              : ord.stage === 'Payment Recorded'
                              ? 'LR / Dispatch Tracking...'
                              : 'GRN / Acceptance Note...'
                          }
                          className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs w-48"
                        />
                        {ord.stage === 'PO Issued' && (
                          <button
                            type="button"
                            onClick={() =>
                              advanceB2bOrderStage(
                                ord.id,
                                'Payment Recorded',
                                orderRefMap[ord.id] || `NEFT-${Date.now().toString().slice(-5)}`
                              )
                            }
                            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                          >
                            Record Direct Payment
                          </button>
                        )}
                        {ord.stage === 'Payment Recorded' && (
                          <button
                            type="button"
                            onClick={() =>
                              advanceB2bOrderStage(
                                ord.id,
                                'In Fulfilment',
                                orderRefMap[ord.id] || `DSP-${Date.now().toString().slice(-4)}`
                              )
                            }
                            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                          >
                            Mark In Fulfilment
                          </button>
                        )}
                        {ord.stage === 'In Fulfilment' && (
                          <button
                            type="button"
                            onClick={() =>
                              advanceB2bOrderStage(
                                ord.id,
                                'Delivered & Accepted',
                                orderRefMap[ord.id] || 'Accepted on inspection',
                                ord.buyerOrgId === 'ORG-000001'
                              )
                            }
                            className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white"
                          >
                            Accept Delivery
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: VENDOR OS (Onboarding, 7-Level Catalogue Mapping, RFQ Inbox)
         ===================================================================== */}
      {dakshTab === 'vendor' && (
        <div className="space-y-5">
          {/* Configurable Onboarding Vendor Status Strip */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-display text-base font-semibold text-slate-900">
                  Vendor Onboarding & Configurable Catalogue Pipeline
                </h3>
                <p className="text-xs text-slate-500">
                  Vendors are onboarded strictly as configurable records — zero hardcoded products, stock, or prices until verified submission.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowListingForm(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-800 self-start"
              >
                <PackagePlus className="h-3.5 w-3.5" />
                Submit 7-Level Vendor SKU
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              {vendorOrgs.map((v) => {
                const count = dm.listings.filter((l) => l.vendorOrgId === v.orgId).length;
                return (
                  <div key={v.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
                    <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-slate-500">
                      <span>
                        {v.roleIds.vendorId} · {v.orgId}
                      </span>
                      <span
                        className={`font-sans font-semibold ${
                          v.verificationStatus === 'Verified' || v.verificationStatus === 'Approved'
                            ? 'text-emerald-700'
                            : 'text-amber-700'
                        }`}
                      >
                        {v.verificationStatus}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-slate-900 mt-1">{v.name}</div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      {v.city}, {v.state} · {count} submitted listing(s)
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1.5">
                      Proposed: {v.proposedCategories.join(', ') || 'None'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 7-Level Universal Catalogue Table */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-semibold text-slate-900">
                  7-Level Universal Catalogue & Inventory Ownership Separation
                </h3>
                <p className="text-xs text-slate-500">
                  Industry → Category → Subcategory → Product Family → Product → Variant → SKU. Confidential vendor cost is hidden unless tenant permission allows it.
                </p>
              </div>
              <span className="font-mono text-xs text-slate-500 tabular-nums">
                {dm.listings.length} total listings
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-medium text-slate-500">
                    <th className="py-3 px-4">7-Level Taxonomy & SKU</th>
                    <th className="py-3 px-3">Vendor · Inventory Owner</th>
                    <th className="py-3 px-3">Offering · MOQ · Lead</th>
                    <th className="py-3 px-3 text-right">Indicative Price</th>
                    <th className="py-3 px-3 text-right">Confidential Cost</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dm.listings.map((l) => {
                    const showCost = canSeeVendorCost(l.vendorOrgId, l.vendorId);
                    return (
                      <tr key={l.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4">
                          <div className="font-mono text-[11px] text-slate-500">
                            {l.listingCode} · {l.sku}
                          </div>
                          <div className="font-semibold text-slate-900">{l.productName}</div>
                          <div className="text-[11px] text-slate-500">
                            {l.industry} / {l.category} / {l.subcategory} / {l.variant}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-medium text-slate-900">
                            {l.vendorId} · {l.vendorName}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            Owner: {l.inventoryOwnerOrgId}
                            {l.syncedRetailProductId ? ' · Retail Synced' : ''}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono tabular-nums">
                          <div className="text-slate-800">{l.offeringType}</div>
                          <div className="text-[11px] text-slate-500">
                            MOQ {l.moq} {l.unitOfMeasure} · {l.leadTimeDays}d · Cap {l.availableCapacityOrStock}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold tabular-nums text-slate-900">
                          {formatINR(l.publicIndicativePrice)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums">
                          {showCost ? (
                            <span className="text-slate-700">{formatINR(l.confidentialCostPrice)}</span>
                          ) : (
                            <span className="text-slate-400">Restricted</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={`font-semibold ${
                              l.status === 'Published'
                                ? 'text-emerald-700'
                                : l.status === 'Pending Review'
                                ? 'text-amber-700'
                                : 'text-slate-500'
                            }`}
                          >
                            {l.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Vendor RFQ Inbox */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4">
              <h3 className="font-display text-base font-semibold text-slate-900">
                Vendor RFQ Inbox ({visibleRfqsForVendor.length})
              </h3>
              <p className="text-xs text-slate-500">
                Tenant-isolated: when viewing as a Vendor organization, only RFQs explicitly addressed to that vendor appear
              </p>
            </div>
            <div className="divide-y divide-slate-100">
              {visibleRfqsForVendor.map((rfq) => (
                <div
                  key={rfq.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-[11px] font-mono text-slate-500">
                      {rfq.rfqCode} · Invited: {rfq.invitedVendorIds.join(', ')} · Due{' '}
                      {formatDateShort(rfq.dueDate)}
                    </div>
                    <div className="text-sm font-semibold text-slate-900">{rfq.title}</div>
                    <div className="text-xs text-slate-600">
                      {rfq.buyerName} · {rfq.deliveryLocation} · {rfq.items.length} line item(s)
                    </div>
                  </div>

                  {rfq.status !== 'Awarded' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setQuotingRfq(rfq);
                        setQuoteVendorOrgId(
                          activeOrg?.roleIds.vendorId ? activeOrg.orgId : 'ORG-000002'
                        );
                      }}
                      className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 self-start sm:self-center"
                    >
                      Prepare & Approve Quote
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-700">Awarded</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: SELLER OS (Authorized Vendors, Agreements & Commission Ledger)
         ===================================================================== */}
      {dakshTab === 'seller' && (
        <div className="space-y-5">
          {/* Commission Summary Strip */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-xs text-slate-500">Estimated (PO Issued)</div>
              <div className="mt-1 font-mono text-xl font-semibold tabular-nums text-slate-900">
                {formatINR(commissionTotals.estimated)}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-xs text-slate-500">Accrued (Delivery Accepted)</div>
              <div className="mt-1 font-mono text-xl font-semibold tabular-nums text-teal-700">
                {formatINR(commissionTotals.accrued)}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-xs text-slate-500">Approved / Payable</div>
              <div className="mt-1 font-mono text-xl font-semibold tabular-nums text-amber-700">
                {formatINR(commissionTotals.payable)}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-xs text-slate-500">Settled & Paid</div>
              <div className="mt-1 font-mono text-xl font-semibold tabular-nums text-emerald-700">
                {formatINR(commissionTotals.paid)}
              </div>
            </div>
          </div>

          {/* Authorized Vendor-Seller Relationships */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4">
              <h3 className="font-display text-base font-semibold text-slate-900">
                Authorized Vendor Relationships & Catalogue Permissions
              </h3>
              <p className="text-xs text-slate-500">
                Sellers only access vendor cost pricing or quote buyers under explicit active agreements
              </p>
            </div>
            <div className="divide-y divide-slate-100">
              {dm.relationships.map((rel) => (
                <div
                  key={rel.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <div className="text-[11px] font-mono text-slate-500">
                      {rel.sellerId} → {rel.vendorId} · Effective {formatDateShort(rel.effectiveFrom)}
                      {rel.effectiveTo ? ` to ${formatDateShort(rel.effectiveTo)}` : ''}
                    </div>
                    <div className="text-sm font-semibold text-slate-900">
                      {rel.sellerName} ↔ {rel.vendorName}
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      Permissions: {rel.permissions.join(' · ')}
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      rel.status === 'Active' ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {rel.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Commission Agreements */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4">
              <h3 className="font-display text-base font-semibold text-slate-900">
                Active Seller Commission Agreements
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {dm.commissionAgreements.map((agr) => (
                <div key={agr.id} className="p-4 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-mono text-[11px] text-slate-500">
                      {agr.agreementCode} · {agr.sellerId} / {agr.vendorId}
                    </div>
                    <div className="font-semibold text-slate-900">{agr.vendorName}</div>
                    <div className="text-slate-600">
                      {agr.basis}:{' '}
                      <span className="font-mono font-semibold">
                        {agr.basis === 'Fixed Per Order'
                          ? formatINR(agr.fixedAmount)
                          : `${agr.ratePercent}%`}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`font-semibold ${
                      agr.status === 'Active' ? 'text-emerald-700' : 'text-slate-500'
                    }`}
                  >
                    {agr.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Commission Earnings Ledger */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4">
              <h3 className="font-display text-base font-semibold text-slate-900">
                Seller Commission Ledger (Lifecycle Governed)
              </h3>
              <p className="text-xs text-slate-500">
                Estimated (on PO Award) → Accrued (on Delivery Acceptance) → Approved → Payable → Paid
              </p>
            </div>
            {dm.commissions.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No commission entries yet. Award an RFQ linked to Seller SLR-000001 (such as RFQ-000001) to generate an Estimated commission entry.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-medium text-slate-500">
                      <th className="py-3 px-4">Entry · Order</th>
                      <th className="py-3 px-3">Seller · Vendor</th>
                      <th className="py-3 px-3 text-right">Order Subtotal</th>
                      <th className="py-3 px-3 text-right">Commission</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-4 text-right">Governance Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dm.commissions.map((c) => (
                      <tr key={c.id}>
                        <td className="py-3 px-4 font-mono">
                          <div className="font-semibold text-slate-900">{c.entryCode}</div>
                          <div className="text-[11px] text-slate-500">{c.orderCode}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-medium text-slate-900">{c.sellerId}</div>
                          <div className="text-[11px] text-slate-500">
                            {c.vendorId} · {c.vendorName}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums">
                          {formatINR(c.basisAmount)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold tabular-nums text-slate-900">
                          {formatINR(c.commissionAmount)}
                        </td>
                        <td className="py-3 px-3 font-semibold text-teal-800">
                          {c.status}
                          {c.paymentRef ? (
                            <div className="font-mono text-[10px] text-slate-500">{c.paymentRef}</div>
                          ) : null}
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          {c.status === 'Accrued' && (
                            <button
                              type="button"
                              onClick={() => updateCommissionStatus(c.id, 'Approved')}
                              className="rounded bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white"
                            >
                              Approve
                            </button>
                          )}
                          {c.status === 'Approved' && (
                            <button
                              type="button"
                              onClick={() => updateCommissionStatus(c.id, 'Payable')}
                              className="rounded bg-amber-700 px-2.5 py-1 text-[11px] font-semibold text-white"
                            >
                              Mark Payable
                            </button>
                          )}
                          {c.status === 'Payable' && (
                            <button
                              type="button"
                              onClick={() =>
                                updateCommissionStatus(
                                  c.id,
                                  'Paid',
                                  `COM-UTR-${Date.now().toString().slice(-5)}`
                                )
                              }
                              className="rounded bg-emerald-700 px-2.5 py-1 text-[11px] font-semibold text-white"
                            >
                              Record Payout
                            </button>
                          )}
                          {c.status === 'Estimated' && (
                            <span className="text-[11px] text-slate-400">Awaiting Delivery</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 4: PROJECT PROCUREMENT OS (Multi-vendor BOQ & Milestones)
         ===================================================================== */}
      {dakshTab === 'projects' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900">
                Multi-Vendor Project Procurement & BOQ Packages
              </h3>
              <p className="text-xs text-slate-500">
                Manage multi-category commercial rollouts, budget ceilings, partial deliveries, and installation sign-offs
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowNewProject(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-800"
            >
              <FolderKanban className="h-3.5 w-3.5" />
              New Project BOQ
            </button>
          </div>

          <div className="space-y-4">
            {dm.projects.map((prj) => {
              const packageSum = prj.packages.reduce((s, p) => s + p.estimatedBudget, 0);
              const completedCount = prj.packages.filter(
                (p) => p.deliveryStatus === 'Installed & Accepted'
              ).length;

              return (
                <div
                  key={prj.id}
                  className="rounded-xl border border-slate-200 bg-white overflow-hidden"
                >
                  <div className="border-b border-slate-200 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-[11px] font-mono text-slate-500 tabular-nums">
                        {prj.projectCode} · {prj.clientOrgId} · Launch Target{' '}
                        {formatDateShort(prj.targetLaunchDate)}
                      </div>
                      <h4 className="text-base font-semibold text-slate-900">{prj.name}</h4>
                      <div className="text-xs text-slate-600">{prj.location}</div>
                    </div>
                    <div className="text-left sm:text-right font-mono tabular-nums">
                      <div className="text-sm font-semibold text-slate-900">
                        Budget {formatINR(prj.totalBudget)}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        BOQ Sum {formatINR(packageSum)} · {completedCount}/{prj.packages.length} packages accepted
                      </div>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {prj.packages.map((pkg) => (
                      <div
                        key={pkg.id}
                        className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="font-semibold text-slate-900">{pkg.packageName}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Category: {pkg.category} · Est. {formatINR(pkg.estimatedBudget)}
                            {pkg.assignedVendorId ? ` · Assigned ${pkg.assignedVendorId}` : ''}
                          </div>
                          <div className="text-[11px] text-slate-600 mt-0.5">{pkg.milestoneNotes}</div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <select
                            value={pkg.deliveryStatus}
                            onChange={(e) =>
                              updateBoqPackage(prj.id, pkg.id, {
                                deliveryStatus: e.target.value as typeof pkg.deliveryStatus,
                              })
                            }
                            aria-label={`Milestone status for ${pkg.packageName}`}
                            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Partial Delivery">Partial Delivery</option>
                            <option value="Installed & Accepted">Installed & Accepted</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 5: ADMIN & UNIVERSAL TAXONOMY
         ===================================================================== */}
      {dakshTab === 'admin' && (
        <div className="space-y-5">
          {/* Universal Identity System Directory */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-base font-semibold text-slate-900">
                  Universal Business Identity System (Multi-Role Organizations)
                </h3>
                <p className="text-xs text-slate-500">
                  Independent system IDs (ORG-, PER-, MFR-, VND-, SLR-, BUY-). Approving a Vendor automatically syncs them into GRAMOS Mart Suppliers.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewOrgForm(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-800 self-start"
              >
                <Building2 className="h-3.5 w-3.5" />
                Register Organization
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {dm.organizations.map((org) => {
                const roleTags = [
                  org.roleIds.manufacturerId,
                  org.roleIds.vendorId,
                  org.roleIds.distributorId,
                  org.roleIds.sellerId,
                  org.roleIds.buyerId,
                ].filter(Boolean);

                return (
                  <div
                    key={org.id}
                    className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-mono text-[11px] text-slate-500">
                        {org.orgId} · {org.personId} · {roleTags.join(' · ')}
                        {org.linkedSupplierId ? ` · GRAMOS Supplier ${org.linkedSupplierId}` : ''}
                      </div>
                      <div className="text-sm font-semibold text-slate-900 mt-0.5">{org.name}</div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        {org.city}, {org.state} · {org.contactPerson} ({org.phone}) · {org.gstOrLicense}
                      </div>
                      {org.proposedCategories.length > 0 && (
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Categories: {org.proposedCategories.join(', ')}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <span
                        className={`font-semibold ${
                          org.verificationStatus === 'Verified' ||
                          org.verificationStatus === 'Approved'
                            ? 'text-emerald-700'
                            : org.verificationStatus === 'Suspended'
                            ? 'text-red-600'
                            : 'text-amber-700'
                        }`}
                      >
                        {org.verificationStatus}
                      </span>

                      {org.verificationStatus !== 'Verified' && (
                        <button
                          type="button"
                          onClick={() => updateOrganizationStatus(org.orgId, 'Verified')}
                          className="inline-flex items-center gap-1 rounded-md bg-emerald-700 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-800"
                        >
                          <UserCheck className="h-3 w-3" />
                          Verify & Sync
                        </button>
                      )}
                      {org.verificationStatus !== 'Suspended' && (
                        <button
                          type="button"
                          onClick={() => updateOrganizationStatus(org.orgId, 'Suspended')}
                          className="rounded-md border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100"
                        >
                          Suspend
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pending Listing Review & Retail SKU Sync */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4">
              <h3 className="font-display text-base font-semibold text-slate-900">
                Catalogue Governance & GRAMOS Mart SKU Sync
              </h3>
              <p className="text-xs text-slate-500">
                Approve vendor-submitted listings to publish them to DAKSH MARKET matching and optionally register them in GRAMOS Mart retail inventory
              </p>
            </div>
            <div className="divide-y divide-slate-100">
              {dm.listings.map((l) => (
                <div
                  key={l.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-mono text-[11px] text-slate-500">
                      {l.listingCode} · {l.vendorId} · {l.sku}
                    </div>
                    <div className="font-semibold text-slate-900">{l.productName}</div>
                    <div className="text-[11px] text-slate-500">
                      {l.industry} / {l.category} · Indicative {formatINR(l.publicIndicativePrice)} · Cost{' '}
                      {formatINR(l.confidentialCostPrice)}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <span className="font-semibold text-slate-700">{l.status}</span>
                    {l.status !== 'Published' && (
                      <>
                        <button
                          type="button"
                          onClick={() => updateListingStatus(l.id, 'Published', false)}
                          className="rounded-md bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white"
                        >
                          Approve & Publish
                        </button>
                        <button
                          type="button"
                          onClick={() => updateListingStatus(l.id, 'Published', true)}
                          className="rounded-md bg-teal-700 px-2.5 py-1 text-[11px] font-semibold text-white"
                        >
                          Publish + Sync to Retail SKU
                        </button>
                      </>
                    )}
                    {l.status === 'Published' && !l.syncedRetailProductId && (
                      <button
                        type="button"
                        onClick={() => updateListingStatus(l.id, 'Published', true)}
                        className="rounded-md border border-teal-200 bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-800"
                      >
                        Sync to GRAMOS Mart SKU
                      </button>
                    )}
                    {l.syncedRetailProductId && (
                      <button
                        type="button"
                        onClick={() => setActiveNav('inventory')}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:underline"
                      >
                        <Store className="h-3 w-3" />
                        View in Inventory
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Universal Industry Manager */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-base font-semibold text-slate-900 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-teal-700" />
                  Dynamic Universal Industry Directory ({dm.industries.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Add new industries dynamically without code changes. Updates sync immediately across DAKSH MARKET and GRAMOS Mart Inventory.
                </p>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newIndustryName.trim()) {
                    addUniversalIndustry(newIndustryName);
                    setNewIndustryName('');
                  }
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={newIndustryName}
                  onChange={(e) => setNewIndustryName(e.target.value)}
                  placeholder="e.g., Solar and renewable energy"
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs w-60"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Industry
                </button>
              </form>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 text-xs">
              {dm.industries.map((ind) => (
                <div
                  key={ind.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="font-mono text-[10px] text-slate-500">{ind.code}</div>
                    <div className="font-medium text-slate-900 truncate">{ind.name}</div>
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0">
                    {ind.isCoreGramos ? 'Core' : 'Universal'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODALS
         ===================================================================== */}
      {showReqAssistant && (
        <RequirementAssistantModal
          onClose={() => setShowReqAssistant(false)}
          defaultBuyerOrgId={activeOrg?.roleIds.buyerId ? activeOrg.orgId : undefined}
        />
      )}

      {/* Issue RFQ Modal */}
      {rfqTargetReqId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
            <h3 className="font-display text-base font-semibold text-slate-900">
              Issue Multi-Vendor RFQ
            </h3>
            <div className="space-y-2 text-xs">
              <div className="font-medium text-slate-700">Select Vendors to Invite:</div>
              {vendorOrgs.map((v) => {
                const vId = v.roleIds.vendorId!;
                const checked = selectedVendorsForRfq.includes(vId);
                return (
                  <label
                    key={v.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setSelectedVendorsForRfq((prev) =>
                            checked ? prev.filter((id) => id !== vId) : [...prev, vId]
                          )
                        }
                        className="accent-teal-700"
                      />
                      <span className="font-medium text-slate-900">
                        {vId} · {v.name}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500">{v.verificationStatus}</span>
                  </label>
                );
              })}

              <label className="block pt-2">
                <span className="font-medium text-slate-700">Quote Submission Due Date</span>
                <input
                  type="date"
                  value={rfqDueDate}
                  onChange={(e) => setRfqDueDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
                />
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRfqTargetReqId(null)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={selectedVendorsForRfq.length === 0}
                onClick={() => {
                  createRfqFromRequirement({
                    requirementId: rfqTargetReqId,
                    invitedVendorIds: selectedVendorsForRfq,
                    dueDate: rfqDueDate,
                    sellerId: 'SLR-000001',
                  });
                  setRfqTargetReqId(null);
                }}
                className="rounded-lg bg-teal-700 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
              >
                Confirm & Send RFQ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Vendor Quotation Modal */}
      {quotingRfq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const vOrg = dm.organizations.find((o) => o.orgId === quoteVendorOrgId);
              if (!vOrg) return;
              const landed =
                quoteForm.subtotal +
                quoteForm.taxesTotal +
                quoteForm.freightTotal +
                quoteForm.installationTotal;
              submitQuotation({
                rfqId: quotingRfq.id,
                vendorOrgId: vOrg.orgId,
                vendorId: vOrg.roleIds.vendorId || 'VND-000001',
                vendorName: vOrg.name,
                sellerId: quotingRfq.sellerId,
                revision: dm.quotations.filter((q) => q.rfqId === quotingRfq.id).length + 1,
                unitRatesSummary: quoteForm.unitRatesSummary || 'Complete BOQ commercial quote',
                subtotal: quoteForm.subtotal,
                taxesTotal: quoteForm.taxesTotal,
                freightTotal: quoteForm.freightTotal,
                installationTotal: quoteForm.installationTotal,
                landedTotal: landed,
                moqMet: quoteForm.moqMet,
                deliveryDays: quoteForm.deliveryDays,
                validityDate: quoteForm.validityDate,
                warrantyTerms: quoteForm.warrantyTerms,
                paymentTerms: quoteForm.paymentTerms,
              });
              setQuotingRfq(null);
            }}
            className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-4 my-6"
          >
            <h3 className="font-display text-base font-semibold text-slate-900">
              Human-Approved Vendor Quotation ({quotingRfq.rfqCode})
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
              <label className="block sm:col-span-2">
                <span className="font-medium text-slate-700">Quoting Vendor</span>
                <select
                  value={quoteVendorOrgId}
                  onChange={(e) => setQuoteVendorOrgId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                >
                  {vendorOrgs.map((v) => (
                    <option key={v.orgId} value={v.orgId}>
                      {v.roleIds.vendorId} · {v.name} ({v.verificationStatus})
                    </option>
                  ))}
                </select>
              </label>

              <label className="block sm:col-span-2">
                <span className="font-medium text-slate-700">Unit Rates Summary</span>
                <input
                  required
                  type="text"
                  value={quoteForm.unitRatesSummary}
                  onChange={(e) =>
                    setQuoteForm({ ...quoteForm, unitRatesSummary: e.target.value })
                  }
                  placeholder="e.g., 20 Tables @ ₹4,500 + 60 Chairs @ ₹1,800"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>

              <label className="block">
                <span className="font-medium text-slate-700">Net Subtotal (₹)</span>
                <input
                  type="number"
                  min={1}
                  value={quoteForm.subtotal}
                  onChange={(e) =>
                    setQuoteForm({ ...quoteForm, subtotal: Number(e.target.value) || 0 })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                />
              </label>
              <label className="block">
                <span className="font-medium text-slate-700">GST / Taxes (₹)</span>
                <input
                  type="number"
                  min={0}
                  value={quoteForm.taxesTotal}
                  onChange={(e) =>
                    setQuoteForm({ ...quoteForm, taxesTotal: Number(e.target.value) || 0 })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                />
              </label>
              <label className="block">
                <span className="font-medium text-slate-700">Freight (₹)</span>
                <input
                  type="number"
                  min={0}
                  value={quoteForm.freightTotal}
                  onChange={(e) =>
                    setQuoteForm({ ...quoteForm, freightTotal: Number(e.target.value) || 0 })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                />
              </label>
              <label className="block">
                <span className="font-medium text-slate-700">Installation (₹)</span>
                <input
                  type="number"
                  min={0}
                  value={quoteForm.installationTotal}
                  onChange={(e) =>
                    setQuoteForm({ ...quoteForm, installationTotal: Number(e.target.value) || 0 })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                />
              </label>
              <label className="block">
                <span className="font-medium text-slate-700">Delivery Lead Time (Days)</span>
                <input
                  type="number"
                  min={1}
                  value={quoteForm.deliveryDays}
                  onChange={(e) =>
                    setQuoteForm({ ...quoteForm, deliveryDays: Number(e.target.value) || 1 })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                />
              </label>
              <label className="block">
                <span className="font-medium text-slate-700">Payment Terms</span>
                <input
                  type="text"
                  value={quoteForm.paymentTerms}
                  onChange={(e) => setQuoteForm({ ...quoteForm, paymentTerms: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
            </div>

            <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 flex items-center justify-between text-xs">
              <span>Computed Landed Quote Total</span>
              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                {formatINR(
                  quoteForm.subtotal +
                    quoteForm.taxesTotal +
                    quoteForm.freightTotal +
                    quoteForm.installationTotal
                )}
              </span>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setQuotingRfq(null)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-lg bg-teal-700 px-4 py-1.5 text-xs font-semibold text-white"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Approve & Submit Quote
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Submit Vendor 7-Level Listing Modal */}
      {showListingForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto">
          <form
            onSubmit={handleSubmitListing}
            className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-4 my-6"
          >
            <h3 className="font-display text-base font-semibold text-slate-900">
              Submit Configurable Vendor Listing (7-Level Universal Schema)
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
              <label className="block">
                <span className="font-medium text-slate-700">Vendor Organization</span>
                <select
                  value={listingForm.vendorOrgId}
                  onChange={(e) =>
                    setListingForm({ ...listingForm, vendorOrgId: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                >
                  {vendorOrgs.map((v) => (
                    <option key={v.orgId} value={v.orgId}>
                      {v.roleIds.vendorId} · {v.name} ({v.verificationStatus})
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="font-medium text-slate-700">Offering Type</span>
                <select
                  value={listingForm.offeringType}
                  onChange={(e) =>
                    setListingForm({
                      ...listingForm,
                      offeringType: e.target.value as OfferingType,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                >
                  {OFFERING_TYPES.map((ot) => (
                    <option key={ot} value={ot}>
                      {ot}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="font-medium text-slate-700">Level 1 — Industry</span>
                <select
                  value={listingForm.industry}
                  onChange={(e) => setListingForm({ ...listingForm, industry: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                >
                  {dm.industries.map((ind) => (
                    <option key={ind.id} value={ind.name}>
                      {ind.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="font-medium text-slate-700">Level 2 — Category</span>
                <input
                  required
                  type="text"
                  value={listingForm.category}
                  onChange={(e) => setListingForm({ ...listingForm, category: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="font-medium text-slate-700">Level 5 — Product / Offering Name</span>
                <input
                  required
                  type="text"
                  value={listingForm.productName}
                  onChange={(e) =>
                    setListingForm({ ...listingForm, productName: e.target.value })
                  }
                  placeholder="e.g., Solid Sheesham 4-Seater Commercial Café Table"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>

              <label className="block">
                <span className="font-medium text-slate-700">Level 6 — Variant</span>
                <input
                  type="text"
                  value={listingForm.variant}
                  onChange={(e) => setListingForm({ ...listingForm, variant: e.target.value })}
                  placeholder="e.g., Walnut Matte 90x90 cm"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>

              <label className="block">
                <span className="font-medium text-slate-700">Level 7 — SKU (Optional)</span>
                <input
                  type="text"
                  value={listingForm.sku}
                  onChange={(e) => setListingForm({ ...listingForm, sku: e.target.value })}
                  placeholder="Auto-generated if blank"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                />
              </label>

              <label className="block">
                <span className="font-medium text-slate-700">Public Indicative Price (₹)</span>
                <input
                  type="number"
                  min={1}
                  value={listingForm.publicIndicativePrice}
                  onChange={(e) =>
                    setListingForm({
                      ...listingForm,
                      publicIndicativePrice: Number(e.target.value) || 0,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                />
              </label>

              <label className="block">
                <span className="font-medium text-slate-700">Confidential Vendor Cost (₹)</span>
                <input
                  type="number"
                  min={1}
                  value={listingForm.confidentialCostPrice}
                  onChange={(e) =>
                    setListingForm({
                      ...listingForm,
                      confidentialCostPrice: Number(e.target.value) || 0,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                />
              </label>

              <label className="block">
                <span className="font-medium text-slate-700">MOQ</span>
                <input
                  type="number"
                  min={1}
                  value={listingForm.moq}
                  onChange={(e) =>
                    setListingForm({ ...listingForm, moq: Number(e.target.value) || 1 })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                />
              </label>

              <label className="block">
                <span className="font-medium text-slate-700">Available Capacity / Stock</span>
                <input
                  type="number"
                  min={0}
                  value={listingForm.availableCapacityOrStock}
                  onChange={(e) =>
                    setListingForm({
                      ...listingForm,
                      availableCapacityOrStock: Number(e.target.value) || 0,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                />
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowListingForm(false)}
                className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white"
              >
                Submit for Admin Review
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Register Organization Modal */}
      {showNewOrgForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto">
          <form
            onSubmit={handleCreateOrg}
            className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-4 my-6"
          >
            <h3 className="font-display text-base font-semibold text-slate-900">
              Register Multi-Role Organization (Universal Business Identity)
            </h3>
            <div className="space-y-3 text-xs">
              <label className="block">
                <span className="font-medium text-slate-700">Organization Name</span>
                <input
                  required
                  type="text"
                  value={newOrgForm.name}
                  onChange={(e) => setNewOrgForm({ ...newOrgForm, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="font-medium text-slate-700">City</span>
                  <input
                    type="text"
                    value={newOrgForm.city}
                    onChange={(e) => setNewOrgForm({ ...newOrgForm, city: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>
                <label className="block">
                  <span className="font-medium text-slate-700">GST / Udyam / Reg No</span>
                  <input
                    type="text"
                    value={newOrgForm.gstOrLicense}
                    onChange={(e) =>
                      setNewOrgForm({ ...newOrgForm, gstOrLicense: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>
              </div>

              <div>
                <span className="font-medium text-slate-700 block mb-1">
                  Assign Roles (One org can hold multiple roles simultaneously)
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {ALL_ROLES.map((r) => {
                    const checked = newOrgForm.roles.includes(r);
                    return (
                      <label key={r} className="flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setNewOrgForm((prev) => ({
                              ...prev,
                              roles: checked
                                ? prev.roles.filter((x) => x !== r)
                                : [...prev.roles, r],
                            }))
                          }
                          className="accent-teal-700"
                        />
                        <span>{r}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <label className="block">
                <span className="font-medium text-slate-700">
                  Proposed Categories (comma-separated)
                </span>
                <input
                  type="text"
                  value={newOrgForm.proposedCategoriesText}
                  onChange={(e) =>
                    setNewOrgForm({ ...newOrgForm, proposedCategoriesText: e.target.value })
                  }
                  placeholder="e.g., Furniture, Lighting, Packaging"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewOrgForm(false)}
                className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white"
              >
                Create Organization ID
              </button>
            </div>
          </form>
        </div>
      )}

      {/* New Project BOQ Modal */}
      {showNewProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <form
            onSubmit={handleCreateProject}
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-4"
          >
            <h3 className="font-display text-base font-semibold text-slate-900">
              Create Project Procurement BOQ
            </h3>
            <div className="space-y-3 text-xs">
              <label className="block">
                <span className="font-medium text-slate-700">Project Name</span>
                <input
                  required
                  type="text"
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                  placeholder="e.g., Hostel Mess Kitchen & Dining Upgrade"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="block">
                <span className="font-medium text-slate-700">Location</span>
                <input
                  type="text"
                  value={projectForm.location}
                  onChange={(e) => setProjectForm({ ...projectForm, location: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="font-medium text-slate-700">Total Budget (₹)</span>
                  <input
                    type="number"
                    value={projectForm.totalBudget}
                    onChange={(e) =>
                      setProjectForm({ ...projectForm, totalBudget: Number(e.target.value) || 0 })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                  />
                </label>
                <label className="block">
                  <span className="font-medium text-slate-700">Target Launch</span>
                  <input
                    type="date"
                    value={projectForm.targetLaunchDate}
                    onChange={(e) =>
                      setProjectForm({ ...projectForm, targetLaunchDate: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                  />
                </label>
              </div>
              <label className="block">
                <span className="font-medium text-slate-700">Initial BOQ Package</span>
                <input
                  type="text"
                  value={projectForm.packageName}
                  onChange={(e) =>
                    setProjectForm({ ...projectForm, packageName: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewProject(false)}
                className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white"
              >
                Create Project
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
