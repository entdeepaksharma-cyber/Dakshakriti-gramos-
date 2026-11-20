import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  FlaskConical,
  IndianRupee,
  Layers,
  MapPin,
  PackagePlus,
  Plus,
  Printer,
  Send,
  ShieldCheck,
  Store,
} from 'lucide-react';
import { useGramosStore } from '../../context/StoreContext';
import {
  CommercialDecisionOutcome,
  GramosfuelIndustryGroup,
  GramosfuelLaunchStage,
  GramosfuelWorkspaceTab,
  ProductCandidate,
} from '../../types/gramos';
import { formatDateShort, formatINR } from '../../utils/formatters';

const GF_TABS: Array<{ id: GramosfuelWorkspaceTab; label: string }> = [
  { id: 'pipeline', label: '9-Stage Launch Pipeline' },
  { id: 'samples', label: 'Samples & Contract Mfg' },
  { id: 'economics', label: 'Unit Economics & Control' },
  { id: 'quality', label: 'Quality Spec & Compliance' },
  { id: 'roadmap', label: 'Distribution & Registers' },
];

const LAUNCH_STAGES: GramosfuelLaunchStage[] = [
  'Stage 1 — Idea',
  'Stage 2 — Research',
  'Stage 3 — Supplier Discovery',
  'Stage 4 — Sample',
  'Stage 5 — Costing',
  'Stage 6 — Compliance',
  'Stage 7 — Pilot',
  'Stage 8 — Customer Feedback',
  'Stage 9 — Commercial Decision',
];

const INDUSTRY_GROUPS: GramosfuelIndustryGroup[] = [
  'Industry A — Food and Nutrition',
  'Industry B — Household Essentials',
  'Industry C — Personal Care',
  'Industry D — Agriculture and Rural Products',
  'Industry E — Lifestyle and Utility',
];

export const GramosfuelView: React.FC = () => {
  const {
    state,
    gramosfuelTab,
    setGramosfuelTab,
    setActiveNav,
    createProductCandidate,
    advanceCandidateStage,
    recordSampleEvaluation,
    updateCandidateEconomics,
    updateCandidateSpec,
    linkCandidateSupplier,
    sendCandidateToDakshRfq,
    launchCandidateToPilotInventory,
    decideCandidateCommercial,
    toggleManufacturerCheckField,
    toggleGfDocumentCheck,
    updateDistributionPhaseStatus,
  } = useGramosStore();

  const gf = state.gramosfuel;

  // Modals & selected item state
  const [showNewIdea, setShowNewIdea] = useState(false);
  const [showNewSample, setShowNewSample] = useState(false);
  const [selectedEconId, setSelectedEconId] = useState<string>(
    gf.candidates[0]?.id || ''
  );
  const [selectedQualityId, setSelectedQualityId] = useState<string>(
    gf.candidates[0]?.id || ''
  );
  const [decisionNotesMap, setDecisionNotesMap] = useState<Record<string, string>>({});
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  const [ideaForm, setIdeaForm] = useState({
    name: '',
    industryGroup: 'Industry A — Food and Nutrition' as GramosfuelIndustryGroup,
    category: 'Sattu',
    unitSize: '500 g',
    customerProblem: '',
    competitorBenchmark: '',
    targetPriceBand: '',
    sourcingModel: 'Contract Manufacturing' as ProductCandidate['sourcingModel'],
    linkedSupplierId: state.suppliers[0]?.id || '',
  });

  const [sampleForm, setSampleForm] = useState({
    candidateId: gf.candidates[2]?.id || gf.candidates[0]?.id || '',
    supplierId: state.suppliers[0]?.id || '',
    receivedDate: new Date().toISOString().slice(0, 10),
    tasteOrPerformanceScore: 5,
    packagingScore: 4,
    shelfLifeAndSafetyScore: 5,
    verdict: 'Approved' as 'Approved' | 'Revise' | 'Rejected',
    reviewerNotes: '',
  });

  // Compute real retail POS feedback per linked retail product ID (no fabricated stats)
  const livePosMetricsByProductId = useMemo(() => {
    const map: Record<
      string,
      { unitsSold: number; revenue: number; repeatBuyers: number; complaints: number }
    > = {};
    const customerPurchaseCount: Record<string, Record<string, number>> = {};

    for (const sale of state.sales) {
      if (sale.isReturned) continue;
      for (const item of sale.items) {
        if (!map[item.productId]) {
          map[item.productId] = { unitsSold: 0, revenue: 0, repeatBuyers: 0, complaints: 0 };
          customerPurchaseCount[item.productId] = {};
        }
        map[item.productId].unitsSold += item.qty;
        map[item.productId].revenue += item.lineTotal;
        if (sale.customerId) {
          customerPurchaseCount[item.productId][sale.customerId] =
            (customerPurchaseCount[item.productId][sale.customerId] || 0) + 1;
        }
      }
    }

    for (const prodId of Object.keys(map)) {
      const custCounts = Object.values(customerPurchaseCount[prodId] || {});
      map[prodId].repeatBuyers = custCounts.filter((cnt) => cnt > 1).length;
      const prod = state.products.find((p) => p.id === prodId);
      if (prod) {
        map[prodId].complaints = state.complaints.filter(
          (cmp) => cmp.productName === prod.name
        ).length;
      }
    }
    return map;
  }, [state.sales, state.products, state.complaints]);

  const econCandidate =
    gf.candidates.find((c) => c.id === selectedEconId) || gf.candidates[0];
  const qualityCandidate =
    gf.candidates.find((c) => c.id === selectedQualityId) || gf.candidates[0];

  const computeCostBreakdown = (cand: ProductCandidate) => {
    const e = cand.economics;
    const directLanded =
      e.manufacturingCost +
      e.packagingCost +
      e.labellingCost +
      e.transportationCost +
      e.storageCost +
      e.taxesPerUnit;
    const channelAndOps =
      e.distributorMarginPerUnit +
      e.retailerMarginPerUnit +
      e.marketingPerUnit +
      e.wastageReservePerUnit;
    const totalFullCost = directLanded + channelAndOps;
    const brandNetProfit = e.proposedSellingPrice - totalFullCost;
    const netMarginPct =
      e.proposedSellingPrice > 0 ? (brandNetProfit / e.proposedSellingPrice) * 100 : 0;
    const pilotCapitalRequired = directLanded * e.pilotBatchUnits;
    return { directLanded, channelAndOps, totalFullCost, brandNetProfit, netMarginPct, pilotCapitalRequired };
  };

  const handleCreateIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ideaForm.name.trim()) return;
    const created = createProductCandidate({
      name: ideaForm.name,
      industryGroup: ideaForm.industryGroup,
      category: ideaForm.category,
      unitSize: ideaForm.unitSize,
      customerProblem: ideaForm.customerProblem || 'Everyday household utility demand in Hadoti',
      competitorBenchmark: ideaForm.competitorBenchmark || 'Local Kota market benchmark',
      targetPriceBand: ideaForm.targetPriceBand || 'Affordable everyday pricing',
      sourcingModel: ideaForm.sourcingModel,
      linkedSupplierId: ideaForm.linkedSupplierId || undefined,
    });
    setSelectedEconId(created.id);
    setSelectedQualityId(created.id);
    setShowNewIdea(false);
    setIdeaForm((prev) => ({ ...prev, name: '', customerProblem: '', competitorBenchmark: '' }));
  };

  const handleRecordSample = (e: React.FormEvent) => {
    e.preventDefault();
    const cand = gf.candidates.find((c) => c.id === sampleForm.candidateId);
    const sup = state.suppliers.find((s) => s.id === sampleForm.supplierId);
    if (!cand || !sup) return;
    recordSampleEvaluation({
      candidateId: cand.id,
      candidateName: cand.name,
      supplierId: sup.id,
      supplierName: sup.name,
      receivedDate: sampleForm.receivedDate,
      tasteOrPerformanceScore: sampleForm.tasteOrPerformanceScore,
      packagingScore: sampleForm.packagingScore,
      shelfLifeAndSafetyScore: sampleForm.shelfLifeAndSafetyScore,
      verdict: sampleForm.verdict,
      reviewerNotes: sampleForm.reviewerNotes || 'Sample evaluated at Kota pilot desk',
    });
    setShowNewSample(false);
    setSampleForm((prev) => ({ ...prev, reviewerNotes: '' }));
  };

  const handlePilotLaunch = (cand: ProductCandidate) => {
    const product = launchCandidateToPilotInventory(cand.id);
    if (!product) {
      setFeedbackBanner(
        `Cannot launch ${cand.ideaCode} yet: complete all 4 Compliance & Traceability checks in Quality Spec & Compliance first.`
      );
      setSelectedQualityId(cand.id);
      setGramosfuelTab('quality');
      return;
    }
    setFeedbackBanner(
      `${cand.ideaCode} launched to GRAMOS Mart Inventory as SKU ${product.sku} (${product.stockQty} units) and is now live in POS Billing.`
    );
  };

  const activePilotCount = gf.candidates.filter((c) => Boolean(c.linkedRetailProductId)).length;
  const approvedSamplesCount = gf.samples.filter((s) => s.verdict === 'Approved').length;

  return (
    <div className="space-y-5">
      {/* Header Blueprint Identity */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-[11px] font-medium text-teal-700">
            Project DKS-P04-GF · Doc GF-PF-001 · Dakshakriti Product & Service LLP
          </div>
          <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
            GRAMOSFUEL — Brand & Evidence-Based Product Sourcing OS
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            “Everyday products. Accessible prices. Local enterprise.” · {gf.candidates.length} tracked products ·{' '}
            {activePilotCount} live in GRAMOS Mart POS · {approvedSamplesCount} approved samples
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowNewSample(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100"
          >
            <FlaskConical className="h-3.5 w-3.5 text-teal-700" />
            Log Sample Eval
          </button>
          <button
            type="button"
            onClick={() => setShowNewIdea(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-800"
          >
            <Plus className="h-3.5 w-3.5" />
            New Product Idea
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackBanner && (
        <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 flex items-center justify-between gap-3 text-xs text-teal-900">
          <span>{feedbackBanner}</span>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            className="font-semibold underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Distinct Brand Architecture Identity Strip (Section 6) */}
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5 text-xs">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Parent Ecosystem
          </div>
          <div className="font-semibold text-slate-900">Dakshakriti LLP</div>
        </div>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-teal-700">
            Consumer Brand
          </div>
          <div className="font-semibold text-slate-900">GRAMOSFUEL (DKS-P04-GF)</div>
        </div>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Retail & Trading Unit
          </div>
          <div className="font-semibold text-slate-900">GRAMOS Mart (DKS-P05)</div>
        </div>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            B2B Commerce Engine
          </div>
          <div className="font-semibold text-slate-900">DAKSH MARKET Network</div>
        </div>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Regional Sourcing
          </div>
          <div className="font-semibold text-slate-900">Made in Hadoti · Gramodaya</div>
        </div>
      </div>

      {/* Workspace Tabs */}
      <div className="inline-flex flex-wrap rounded-lg border border-slate-200 bg-white p-1 gap-0.5">
        {GF_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setGramosfuelTab(t.id)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
              gramosfuelTab === t.id
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* =====================================================================
          TAB 1: 9-STAGE PRODUCT LAUNCH PIPELINE (Synced End-to-End)
         ===================================================================== */}
      {gramosfuelTab === 'pipeline' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
            <strong>Launch Discipline:</strong> Start with a few affordable products (Sattu drink &amp; Roasted chana hypotheses) → prove repeat demand in GRAMOS Mart POS → expand categories only after compliance, unit economics, and supplier verification pass.
          </div>

          <div className="space-y-4">
            {gf.candidates.map((cand) => {
              const stageIndex = LAUNCH_STAGES.indexOf(cand.stage);
              const econ = computeCostBreakdown(cand);
              const linkedSup = state.suppliers.find((s) => s.id === cand.linkedSupplierId);
              const linkedRetail = state.products.find(
                (p) => p.id === cand.linkedRetailProductId
              );
              const posPerf = cand.linkedRetailProductId
                ? livePosMetricsByProductId[cand.linkedRetailProductId]
                : undefined;
              const complianceReady =
                cand.spec.fssaiOrLicenceVerified &&
                cand.spec.labellingAndAllergenChecked &&
                cand.spec.noUnsubstantiatedClaimsVerified &&
                cand.spec.batchTraceabilityReady;

              return (
                <div
                  key={cand.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 space-y-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-1">
                      <div className="text-[11px] font-mono text-slate-500 tabular-nums">
                        {cand.ideaCode} · {cand.industryGroup} · {cand.unitSize} ·{' '}
                        {cand.sourcingModel}
                        {cand.isStartingHypothesis ? ' · Starting Hypothesis' : ''}
                        {cand.sourceEnquiryId ? ' · From CRM Enquiry' : ''}
                      </div>
                      <h3 className="font-display text-base font-semibold text-slate-900">
                        {cand.name}
                      </h3>
                      <p className="text-xs text-slate-600">{cand.customerProblem}</p>
                      <div className="text-[11px] text-slate-500">
                        Benchmark: {cand.competitorBenchmark} · Target Band: {cand.targetPriceBand}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <select
                        value={cand.stage}
                        onChange={(e) =>
                          advanceCandidateStage(cand.id, e.target.value as GramosfuelLaunchStage)
                        }
                        aria-label={`Launch stage for ${cand.name}`}
                        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-900"
                      >
                        {LAUNCH_STAGES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>

                      {!cand.linkedRetailProductId && (
                        <button
                          type="button"
                          onClick={() => handlePilotLaunch(cand)}
                          className="inline-flex items-center gap-1 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800"
                        >
                          <PackagePlus className="h-3.5 w-3.5" />
                          Launch Pilot to GRAMOS Mart
                        </button>
                      )}

                      {cand.linkedRetailProductId && (
                        <button
                          type="button"
                          onClick={() => setActiveNav('pos')}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                        >
                          <Store className="h-3.5 w-3.5" />
                          Live in POS ({linkedRetail?.sku})
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 9-Stage Visual Progress Bar */}
                  <div className="grid grid-cols-3 sm:grid-cols-9 gap-1">
                    {LAUNCH_STAGES.map((st, idx) => {
                      const done = idx <= stageIndex;
                      const short = st.split('—')[1]?.trim() || st;
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => advanceCandidateStage(cand.id, st)}
                          title={st}
                          className={`rounded px-1.5 py-1 text-[10px] font-medium text-left truncate border transition-colors ${
                            idx === stageIndex
                              ? 'border-teal-700 bg-teal-700 text-white font-semibold'
                              : done
                              ? 'border-teal-200 bg-teal-50 text-teal-900'
                              : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          {idx + 1}. {short}
                        </button>
                      );
                    })}
                  </div>

                  {/* Cross-Module Sync Row: Supplier/Daksh, Costing, Compliance, Live POS Feedback */}
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4 text-xs">
                    {/* Supplier & DAKSH MARKET Bridge */}
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1.5">
                      <div className="text-[11px] font-semibold text-slate-700">
                        Stage 3 · Manufacturer / Vendor
                      </div>
                      <select
                        value={cand.linkedSupplierId || ''}
                        onChange={(e) => linkCandidateSupplier(cand.id, e.target.value)}
                        aria-label={`Select supplier for ${cand.name}`}
                        className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-[11px]"
                      >
                        <option value="">Select Verified Supplier...</option>
                        {state.suppliers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <span className="text-[11px] text-slate-500 truncate">
                          {linkedSup ? linkedSup.paymentTerms : 'No supplier linked'}
                        </span>
                        <button
                          type="button"
                          onClick={() => sendCandidateToDakshRfq(cand.id)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:underline shrink-0"
                        >
                          <Send className="h-3 w-3" />
                          {cand.linkedDakshReqId ? cand.linkedDakshReqId : 'Source via Daksh RFQ'}
                        </button>
                      </div>
                    </div>

                    {/* Stage 5 Unit Economics */}
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-700">
                          Stage 5 · Unit Economics
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedEconId(cand.id);
                            setGramosfuelTab('economics');
                          }}
                          className="text-[11px] font-semibold text-teal-700 hover:underline"
                        >
                          Edit
                        </button>
                      </div>
                      <div className="font-mono tabular-nums text-slate-900">
                        Sell {formatINR(cand.economics.proposedSellingPrice)} · Cost{' '}
                        {formatINR(econ.totalFullCost)}
                      </div>
                      <div
                        className={`font-mono text-[11px] font-semibold tabular-nums ${
                          econ.brandNetProfit > 0 ? 'text-emerald-700' : 'text-red-600'
                        }`}
                      >
                        Net Contribution {formatINR(econ.brandNetProfit)}/unit (
                        {econ.netMarginPct.toFixed(1)}%)
                      </div>
                    </div>

                    {/* Stage 6 Compliance */}
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-700">
                          Stage 6 · Quality & Compliance
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedQualityId(cand.id);
                            setGramosfuelTab('quality');
                          }}
                          className="text-[11px] font-semibold text-teal-700 hover:underline"
                        >
                          Inspect
                        </button>
                      </div>
                      <div
                        className={`font-semibold ${
                          complianceReady ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {complianceReady
                          ? '4/4 Compliance Checks Passed'
                          : 'Pending Licence / Labelling Check'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Shelf life: {cand.spec.shelfLifeDays ? `${cand.spec.shelfLifeDays} days` : 'N/A'}
                      </div>
                    </div>

                    {/* Stage 8 & 9 Live POS Telemetry + Decision */}
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1">
                      <div className="text-[11px] font-semibold text-slate-700">
                        Stage 8–9 · Live POS & Decision
                      </div>
                      {linkedRetail ? (
                        <div className="font-mono text-[11px] tabular-nums text-slate-800">
                          Sold {posPerf?.unitsSold || 0} units · Rev{' '}
                          {formatINR(posPerf?.revenue || 0)} · Stock {linkedRetail.stockQty} ·
                          Compl {posPerf?.complaints || 0}
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-500">
                          Not yet in GRAMOS Mart POS (Pre-Pilot)
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <select
                          value={cand.commercialDecision}
                          onChange={(e) =>
                            decideCandidateCommercial(
                              cand.id,
                              e.target.value as CommercialDecisionOutcome,
                              decisionNotesMap[cand.id] || cand.decisionNotes
                            )
                          }
                          aria-label={`Commercial decision for ${cand.name}`}
                          className="rounded border border-slate-300 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-900"
                        >
                          <option value="Pending Review">Decision: Pending</option>
                          <option value="Expand">Decision: Expand</option>
                          <option value="Revise">Decision: Revise</option>
                          <option value="Pause">Decision: Pause</option>
                          <option value="Discontinue">Decision: Discontinue</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: SAMPLE EVALUATION & CONTRACT MANUFACTURING GOVERNANCE
         ===================================================================== */}
      {gramosfuelTab === 'samples' && (
        <div className="space-y-5">
          {/* Sample Evaluation Register */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-base font-semibold text-slate-900">
                  Sample Evaluation Register (Stage 4)
                </h3>
                <p className="text-xs text-slate-500">
                  Evaluate taste/performance, packaging integrity, and shelf life before approving unit costing
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewSample(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white self-start"
              >
                <FlaskConical className="h-3.5 w-3.5" />
                Record Sample Evaluation
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-medium text-slate-500">
                    <th className="py-3 px-4">Sample · Date</th>
                    <th className="py-3 px-3">Product Candidate & Supplier</th>
                    <th className="py-3 px-3 text-right">Taste/Perf</th>
                    <th className="py-3 px-3 text-right">Packaging</th>
                    <th className="py-3 px-3 text-right">Safety/Shelf</th>
                    <th className="py-3 px-4">Verdict & Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {gf.samples.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono">
                        <div className="font-semibold text-slate-900">{s.sampleCode}</div>
                        <div className="text-[11px] text-slate-500">
                          {formatDateShort(s.receivedDate)}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{s.candidateName}</div>
                        <div className="text-[11px] text-slate-500">{s.supplierName}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums">
                        {s.tasteOrPerformanceScore}/5
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums">
                        {s.packagingScore}/5
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums">
                        {s.shelfLifeAndSafetyScore}/5
                      </td>
                      <td className="py-3 px-4">
                        <div
                          className={`font-semibold ${
                            s.verdict === 'Approved'
                              ? 'text-emerald-700'
                              : s.verdict === 'Revise'
                              ? 'text-amber-700'
                              : 'text-red-600'
                          }`}
                        >
                          {s.verdict}
                        </div>
                        <div className="text-[11px] text-slate-600">{s.reviewerNotes}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Contract Manufacturer Due-Diligence Checklist (Section 11) */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4">
              <h3 className="font-display text-base font-semibold text-slate-900">
                Contract Manufacturing Evaluation Matrix (Section 11)
              </h3>
              <p className="text-xs text-slate-500">
                Manufacturer claims and compliance licences must be independently verified before private-label / contract runs
              </p>
            </div>
            <div className="divide-y divide-slate-100">
              {gf.manufacturerChecks.map((mc) => (
                <div key={mc.id} className="p-4 space-y-2.5 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-semibold text-sm text-slate-900">
                        {mc.supplierName}
                      </span>
                      {mc.dakshVendorId && (
                        <span className="ml-2 font-mono text-[11px] text-teal-700">
                          {mc.dakshVendorId}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500">{mc.notes}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                    {(
                      [
                        ['legalAndRegulatoryChecked', 'Legal / GST Checked'],
                        ['capacityVerified', 'Capacity Verified'],
                        ['sampleQualityApproved', 'Sample Approved'],
                        ['certificationsChecked', 'FSSAI / Licences'],
                        ['moqAndLeadTimeAgreed', 'MOQ & Lead Time'],
                        ['batchTraceabilityConfirmed', 'Batch Traceable'],
                      ] as const
                    ).map(([key, label]) => (
                      <label
                        key={key}
                        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={mc[key]}
                          onChange={() => toggleManufacturerCheckField(mc.id, key)}
                          className="accent-teal-700"
                        />
                        <span className="text-[11px] font-medium text-slate-800">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: FINANCIAL CONTROL & UNIT ECONOMICS CALCULATOR (Section 15)
         ===================================================================== */}
      {gramosfuelTab === 'economics' && econCandidate && (
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-display text-base font-semibold text-slate-900">
                  Full Unit Economics & Financial Control Calculator (Section 15)
                </h3>
                <p className="text-xs text-slate-500">
                  Do not confuse selling price with profit — account for every manufacturing, logistics, channel margin, marketing, and wastage cost
                </p>
              </div>
              <select
                value={econCandidate.id}
                onChange={(e) => setSelectedEconId(e.target.value)}
                aria-label="Select product candidate for economics"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900"
              >
                {gf.candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.ideaCode} · {c.name}
                  </option>
                ))}
              </select>
            </div>

            {(() => {
              const e = econCandidate.economics;
              const stats = computeCostBreakdown(econCandidate);
              return (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                  <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    {(
                      [
                        ['manufacturingCost', 'Manufacturing / Proc (₹)'],
                        ['packagingCost', 'Packaging (₹)'],
                        ['labellingCost', 'Labelling (₹)'],
                        ['transportationCost', 'Transportation (₹)'],
                        ['storageCost', 'Storage (₹)'],
                        ['taxesPerUnit', 'Taxes / GST (₹)'],
                        ['distributorMarginPerUnit', 'Distributor Margin (₹)'],
                        ['retailerMarginPerUnit', 'Retailer Margin (₹)'],
                        ['marketingPerUnit', 'Marketing / Sample (₹)'],
                        ['wastageReservePerUnit', 'Damage / Expiry Res (₹)'],
                        ['proposedMrp', 'Proposed MRP (₹)'],
                        ['proposedSellingPrice', 'Target Selling Price (₹)'],
                        ['pilotBatchUnits', 'Pilot Batch Qty (Units)'],
                      ] as const
                    ).map(([field, label]) => (
                      <label key={field} className="block">
                        <span className="font-medium text-slate-700 text-[11px]">{label}</span>
                        <input
                          type="number"
                          min={0}
                          value={e[field]}
                          onChange={(ev) =>
                            updateCandidateEconomics(econCandidate.id, {
                              [field]: Number(ev.target.value) || 0,
                            })
                          }
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 font-mono text-xs tabular-nums text-slate-900"
                        />
                      </label>
                    ))}
                  </div>

                  <div className="lg:col-span-5 space-y-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Direct Landed Cost / Unit</span>
                        <span className="font-mono font-semibold tabular-nums text-slate-900">
                          {formatINR(stats.directLanded)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Channel Margins + Mktg + Wastage</span>
                        <span className="font-mono font-semibold tabular-nums text-slate-900">
                          {formatINR(stats.channelAndOps)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-slate-200 pt-2">
                        <span className="font-semibold text-slate-800">Full All-In Unit Cost</span>
                        <span className="font-mono font-semibold tabular-nums text-slate-900">
                          {formatINR(stats.totalFullCost)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-800">Target Selling Price</span>
                        <span className="font-mono font-semibold tabular-nums text-slate-900">
                          {formatINR(e.proposedSellingPrice)}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-xl bg-slate-900 p-4 text-white space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-300">GRAMOSFUEL Brand Net Profit / Unit</span>
                        <span
                          className={`font-mono text-lg font-semibold tabular-nums flex items-center ${
                            stats.brandNetProfit > 0 ? 'text-teal-400' : 'text-red-400'
                          }`}
                        >
                          <IndianRupee className="h-4 w-4 mr-0.5" />
                          {stats.brandNetProfit} ({stats.netMarginPct.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-300 font-mono tabular-nums border-t border-slate-700 pt-2">
                        <span>Pilot Batch Working Capital ({e.pilotBatchUnits} units)</span>
                        <span>{formatINR(stats.pilotCapitalRequired)}</span>
                      </div>
                    </div>

                    {stats.netMarginPct < 10 && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex items-start gap-2 text-xs text-amber-900">
                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>
                          <strong>Thin Margin Alert (Section 15):</strong> Net contribution after channel margins, marketing, and wastage is below 10%. Revise pack size or negotiate contract rate before increasing production.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 4: PRODUCT SPECIFICATION & QUALITY GOVERNANCE (Section 10)
         ===================================================================== */}
      {gramosfuelTab === 'quality' && qualityCandidate && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900">
                Documented Product Specification & Compliance Gate (Section 10)
              </h3>
              <p className="text-xs text-slate-500">
                Mandatory specification sheet &amp; FSSAI / labelling / anti-unsubstantiated-claim gate before Stage 7 Pilot launch
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={qualityCandidate.id}
                onChange={(e) => setSelectedQualityId(e.target.value)}
                aria-label="Select candidate for quality spec"
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900"
              >
                {gf.candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.ideaCode} · {c.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 no-print"
              >
                <Printer className="h-3.5 w-3.5" />
                Print Spec
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
            <label className="block">
              <span className="font-medium text-slate-700">Ingredients / Materials</span>
              <textarea
                rows={2}
                value={qualityCandidate.spec.ingredientsOrMaterials}
                onChange={(e) =>
                  updateCandidateSpec(qualityCandidate.id, {
                    ingredientsOrMaterials: e.target.value,
                  })
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="font-medium text-slate-700">Composition Summary</span>
              <textarea
                rows={2}
                value={qualityCandidate.spec.compositionSummary}
                onChange={(e) =>
                  updateCandidateSpec(qualityCandidate.id, {
                    compositionSummary: e.target.value,
                  })
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="font-medium text-slate-700">Packaging Specification</span>
              <input
                type="text"
                value={qualityCandidate.spec.packagingSpec}
                onChange={(e) =>
                  updateCandidateSpec(qualityCandidate.id, { packagingSpec: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="font-medium text-slate-700">Quality Requirements</span>
              <input
                type="text"
                value={qualityCandidate.spec.qualityRequirements}
                onChange={(e) =>
                  updateCandidateSpec(qualityCandidate.id, {
                    qualityRequirements: e.target.value,
                  })
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="font-medium text-slate-700">Storage Conditions</span>
              <input
                type="text"
                value={qualityCandidate.spec.storageConditions}
                onChange={(e) =>
                  updateCandidateSpec(qualityCandidate.id, {
                    storageConditions: e.target.value,
                  })
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="font-medium text-slate-700">Validated Shelf Life (Days)</span>
              <input
                type="number"
                value={qualityCandidate.spec.shelfLifeDays ?? ''}
                onChange={(e) =>
                  updateCandidateSpec(qualityCandidate.id, {
                    shelfLifeDays: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 pt-2">
            {(
              [
                ['fssaiOrLicenceVerified', 'FSSAI / Statutory Licence Verified'],
                ['labellingAndAllergenChecked', 'Food Labelling & Allergen Checked'],
                ['noUnsubstantiatedClaimsVerified', 'Zero Unsubstantiated Health Claims'],
                ['batchTraceabilityReady', 'Batch / Lot Traceability Ready'],
              ] as const
            ).map(([field, label]) => (
              <label
                key={field}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={qualityCandidate.spec[field]}
                  onChange={() =>
                    updateCandidateSpec(qualityCandidate.id, {
                      [field]: !qualityCandidate.spec[field],
                    })
                  }
                  className="accent-teal-700"
                />
                <span className="font-medium text-slate-800">{label}</span>
              </label>
            ))}
          </div>

          {!qualityCandidate.linkedRetailProductId && (
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => handlePilotLaunch(qualityCandidate)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800"
              >
                <ShieldCheck className="h-4 w-4" />
                Verify Gate & Launch Stage 7 Pilot to GRAMOS Mart
              </button>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 5: PORTFOLIO INDUSTRIES, DISTRIBUTION PHASES & DOCUMENTATION
         ===================================================================== */}
      {gramosfuelTab === 'roadmap' && (
        <div className="space-y-5">
          {/* 4-Phase Regional Distribution Roadmap (Section 13) */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4">
              <h3 className="font-display text-base font-semibold text-slate-900 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-teal-700" />
                4-Phase Distribution Expansion Roadmap (Hadoti → Global)
              </h3>
              <p className="text-xs text-slate-500">
                Expand only when local validation, manufacturing consistency, and working capital support demand
              </p>
            </div>
            <div className="divide-y divide-slate-100">
              {gf.distributionPhases.map((dp) => (
                <div
                  key={dp.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-semibold text-sm text-slate-900">{dp.phase}</div>
                    <div className="text-slate-600 mt-0.5">Markets: {dp.markets}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Gate: {dp.gateCriteria}
                    </div>
                  </div>
                  <select
                    value={dp.status}
                    onChange={(e) =>
                      updateDistributionPhaseStatus(
                        dp.id,
                        e.target.value as typeof dp.status
                      )
                    }
                    aria-label={`Status for ${dp.phase}`}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 self-start sm:self-center"
                  >
                    <option value="Active">Active</option>
                    <option value="Preparing">Preparing</option>
                    <option value="Locked (Needs Proof)">Locked (Needs Proof)</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* 5-Industry Portfolio Architecture + 5-Phase Documentation & Offline Registers */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
              <h3 className="font-display text-base font-semibold text-slate-900 flex items-center gap-2">
                <Layers className="h-4 w-4 text-teal-700" />
                GRAMOSFUEL 5-Industry Portfolio Architecture
              </h3>
              <p className="text-xs text-slate-500">
                Categories activate only after supplier, safety, compliance, quality, and demand checks
              </p>
              <div className="space-y-2 text-xs">
                {INDUSTRY_GROUPS.map((ind) => {
                  const count = gf.candidates.filter((c) => c.industryGroup === ind).length;
                  const liveCount = gf.candidates.filter(
                    (c) => c.industryGroup === ind && Boolean(c.linkedRetailProductId)
                  ).length;
                  return (
                    <div
                      key={ind}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">{ind}</div>
                        <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                          {count} candidate(s) · {liveCount} live in pilot
                        </div>
                      </div>
                      <span
                        className={`text-[11px] font-semibold ${
                          liveCount > 0 ? 'text-emerald-700' : count > 0 ? 'text-amber-700' : 'text-slate-400'
                        }`}
                      >
                        {liveCount > 0 ? 'Active' : count > 0 ? 'Testing' : 'Future Scope'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-semibold text-slate-900 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-teal-700" />
                  Documentation &amp; Offline Register Sync
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveNav('registers')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:underline"
                >
                  Open 10 Registers <ArrowRight className="h-3 w-3" />
                </button>
              </div>
              <p className="text-xs text-slate-500">
                Offline physical registers operate independently while mirrored inside GRAMOS Mart &amp; GRAMOSFUEL
              </p>
              <div className="space-y-2">
                {gf.documentationRoadmap.map((doc) => (
                  <label
                    key={doc.id}
                    className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={doc.completed}
                      onChange={() => toggleGfDocumentCheck(doc.id)}
                      className="mt-0.5 accent-teal-700"
                    />
                    <div>
                      <div className={`font-semibold ${doc.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {doc.phase} — {doc.documentName}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Offline Register: {doc.offlineRegisterName}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODALS
         ===================================================================== */}
      {showNewIdea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto">
          <form
            onSubmit={handleCreateIdea}
            className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-4 my-6"
          >
            <h3 className="font-display text-base font-semibold text-slate-900">
              Stage 1 — Register New GRAMOSFUEL Product Idea
            </h3>
            <div className="space-y-3 text-xs">
              <label className="block">
                <span className="font-medium text-slate-700">Product Name</span>
                <input
                  required
                  type="text"
                  value={ideaForm.name}
                  onChange={(e) => setIdeaForm({ ...ideaForm, name: e.target.value })}
                  placeholder="e.g., GRAMOSFUEL Millet & Jaggery Breakfast Mix"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="font-medium text-slate-700">Industry Portfolio</span>
                  <select
                    value={ideaForm.industryGroup}
                    onChange={(e) =>
                      setIdeaForm({
                        ...ideaForm,
                        industryGroup: e.target.value as GramosfuelIndustryGroup,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2"
                  >
                    {INDUSTRY_GROUPS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="font-medium text-slate-700">Category</span>
                  <input
                    required
                    type="text"
                    value={ideaForm.category}
                    onChange={(e) => setIdeaForm({ ...ideaForm, category: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="font-medium text-slate-700">Pack Size / Unit</span>
                  <input
                    type="text"
                    value={ideaForm.unitSize}
                    onChange={(e) => setIdeaForm({ ...ideaForm, unitSize: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>
                <label className="block">
                  <span className="font-medium text-slate-700">Sourcing Model</span>
                  <select
                    value={ideaForm.sourcingModel}
                    onChange={(e) =>
                      setIdeaForm({
                        ...ideaForm,
                        sourcingModel: e.target.value as ProductCandidate['sourcingModel'],
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2"
                  >
                    <option value="Contract Manufacturing">Contract Manufacturing</option>
                    <option value="Regional Hadoti / Gramodaya">Regional Hadoti / Gramodaya</option>
                    <option value="Private Label">Private Label</option>
                  </select>
                </label>
              </div>
              <label className="block">
                <span className="font-medium text-slate-700">Customer Need / Problem</span>
                <textarea
                  rows={2}
                  value={ideaForm.customerProblem}
                  onChange={(e) =>
                    setIdeaForm({ ...ideaForm, customerProblem: e.target.value })
                  }
                  placeholder="Why do everyday Kota / Hadoti customers need this?"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="block">
                <span className="font-medium text-slate-700">Competitor &amp; Price Benchmark</span>
                <input
                  type="text"
                  value={ideaForm.competitorBenchmark}
                  onChange={(e) =>
                    setIdeaForm({ ...ideaForm, competitorBenchmark: e.target.value })
                  }
                  placeholder="e.g., Existing brands ₹140–₹160; target ₹115"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewIdea(false)}
                className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white"
              >
                Save to Launch Pipeline
              </button>
            </div>
          </form>
        </div>
      )}

      {showNewSample && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto">
          <form
            onSubmit={handleRecordSample}
            className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-4 my-6"
          >
            <h3 className="font-display text-base font-semibold text-slate-900">
              Stage 4 — Record Sample Evaluation
            </h3>
            <div className="space-y-3 text-xs">
              <label className="block">
                <span className="font-medium text-slate-700">Product Candidate</span>
                <select
                  value={sampleForm.candidateId}
                  onChange={(e) =>
                    setSampleForm({ ...sampleForm, candidateId: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                >
                  {gf.candidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.ideaCode} · {c.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="font-medium text-slate-700">Manufacturer / Supplier</span>
                <select
                  value={sampleForm.supplierId}
                  onChange={(e) =>
                    setSampleForm({ ...sampleForm, supplierId: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                >
                  {state.suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-3 gap-3">
                <label className="block">
                  <span className="font-medium text-slate-700">Taste / Perf (1-5)</span>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={sampleForm.tasteOrPerformanceScore}
                    onChange={(e) =>
                      setSampleForm({
                        ...sampleForm,
                        tasteOrPerformanceScore: Number(e.target.value) || 1,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                  />
                </label>
                <label className="block">
                  <span className="font-medium text-slate-700">Packaging (1-5)</span>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={sampleForm.packagingScore}
                    onChange={(e) =>
                      setSampleForm({
                        ...sampleForm,
                        packagingScore: Number(e.target.value) || 1,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                  />
                </label>
                <label className="block">
                  <span className="font-medium text-slate-700">Safety/Shelf (1-5)</span>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={sampleForm.shelfLifeAndSafetyScore}
                    onChange={(e) =>
                      setSampleForm({
                        ...sampleForm,
                        shelfLifeAndSafetyScore: Number(e.target.value) || 1,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                  />
                </label>
              </div>

              <label className="block">
                <span className="font-medium text-slate-700">Evaluation Verdict</span>
                <select
                  value={sampleForm.verdict}
                  onChange={(e) =>
                    setSampleForm({
                      ...sampleForm,
                      verdict: e.target.value as 'Approved' | 'Revise' | 'Rejected',
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                >
                  <option value="Approved">Approved (Advance to Stage 5 Costing)</option>
                  <option value="Revise">Revise Sample / Packaging</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </label>

              <label className="block">
                <span className="font-medium text-slate-700">Reviewer Notes</span>
                <textarea
                  rows={2}
                  value={sampleForm.reviewerNotes}
                  onChange={(e) =>
                    setSampleForm({ ...sampleForm, reviewerNotes: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewSample(false)}
                className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Save Sample Record
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
