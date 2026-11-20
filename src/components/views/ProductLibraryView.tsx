import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CheckSquare,
  ClipboardCheck,
  ExternalLink,
  FlaskConical,
  Layers,
  Network,
  PackageCheck,
  Plus,
  Search,
  ShieldAlert,
  Snowflake,
  Sparkles,
  Square,
  Store,
  XCircle,
} from 'lucide-react';
import { useGramosStore } from '../../context/StoreContext';
import { PRODUCT_UNIVERSE_INDUSTRIES } from '../../data/seedData';
import {
  Batch01CategoryGroup,
  Batch02CategoryGroup,
  Batch03CategoryGroup,
  Batch04CategoryGroup,
  Batch05CategoryGroup,
  LibraryBrandTrack,
  LibraryEvaluationScorecard,
  LibraryLevel,
  LibraryWorkflowStatus,
  LibraryWorkspaceTab,
  OwnershipType,
  Product,
  ProductLibraryRecord,
  ProductUniverseIndustry,
} from '../../types/gramos';
import { formatINR } from '../../utils/formatters';

const SCORECARD_FIELDS: {
  key: keyof LibraryEvaluationScorecard;
  label: string;
  hint: string;
}[] = [
  { key: 'productQuality', label: '1. Product Quality', hint: 'Taste, durability, ingredients & consistency' },
  { key: 'customerUsefulness', label: '2. Customer Usefulness', hint: 'Solves genuine everyday Kota household/student need' },
  { key: 'marketDemand', label: '3. Market Demand', hint: 'Observed walk-in, hostel & neighbourhood pull' },
  { key: 'purchaseCost', label: '4. Purchase Cost', hint: 'Competitiveness of verified landed supplier quote' },
  { key: 'potentialSellingPrice', label: '5. Selling Price Fit', hint: 'Affordability vs local kirana & D-Mart benchmark' },
  { key: 'grossMarginPotential', label: '6. Gross Margin Potential', hint: 'Sustainable net margin after GST & handling' },
  { key: 'supplierReliability', label: '7. Supplier Reliability', hint: 'Lead time, MOQ discipline & continuity' },
  { key: 'packagingPresentation', label: '8. Packaging & Presentation', hint: 'Seal strength, shelf appeal & Legal Metrology print' },
  { key: 'storageShelfLife', label: '9. Storage & Shelf-Life', hint: 'Stability in Kota ambient heat & Zone FEFO risk' },
  { key: 'repeatPurchasePotential', label: '10. Repeat-Purchase Potential', hint: 'Weekly/monthly replenishment velocity' },
];

const WORKFLOW_STAGES: LibraryWorkflowStatus[] = [
  'Discovered',
  'Shortlisted',
  'Supplier Identified',
  'Sample Requested',
  'Testing',
  'Approved',
  'Rejected',
  'Commercial Catalogue',
  'Market Performance',
];

const BRAND_TRACKS: LibraryBrandTrack[] = [
  'GRAMOSFUEL',
  'GRAMOS / Apna Bazar Select',
  'Made in Hadoti',
  'Third-Party Brand',
];

const getLibraryLevel = (status: LibraryWorkflowStatus): LibraryLevel => {
  if (status === 'Sample Requested' || status === 'Testing') {
    return 'Level 2 — Tested Product Library';
  }
  if (status === 'Approved' || status === 'Commercial Catalogue' || status === 'Market Performance') {
    return 'Level 3 — Approved Commercial Catalogue';
  }
  return 'Level 1 — Master Product Library';
};

const getLevelShortBadge = (level: LibraryLevel) => {
  if (level === 'Level 3 — Approved Commercial Catalogue') {
    return { label: 'L3 Commercial', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
  }
  if (level === 'Level 2 — Tested Product Library') {
    return { label: 'L2 Testing', cls: 'bg-amber-50 text-amber-800 border-amber-200' };
  }
  return { label: 'L1 Master', cls: 'bg-slate-100 text-slate-700 border-slate-200' };
};

const getStatusStyle = (status: LibraryWorkflowStatus) => {
  switch (status) {
    case 'Market Performance':
    case 'Commercial Catalogue':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case 'Approved':
      return 'bg-teal-50 text-teal-800 border-teal-200';
    case 'Testing':
    case 'Sample Requested':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'Rejected':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'Supplier Identified':
    case 'Shortlisted':
      return 'bg-sky-50 text-sky-800 border-sky-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const computeScoreSummary = (sc: LibraryEvaluationScorecard) => {
  const vals = Object.values(sc);
  const scored = vals.filter((v) => v > 0);
  const total = vals.reduce((sum, v) => sum + v, 0);
  return { total, scoredCount: scored.length };
};

export const ProductLibraryView: React.FC = () => {
  const {
    state,
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
    setActiveNav,
  } = useGramosStore();

  const records = state.productLibrary.records;
  const batches = state.productLibrary.batches;
  const batch01Candidates = state.productLibrary.batch01Candidates;
  const batch02Candidates = state.productLibrary.batch02Candidates;
  const batch03Candidates = state.productLibrary.batch03Candidates;
  const batch04Candidates = state.productLibrary.batch04Candidates;
  const batch05Candidates = state.productLibrary.batch05Candidates;

  // Batch 01 Decision Tracker Filters
  const [batch01CatFilter, setBatch01CatFilter] = useState<Batch01CategoryGroup | 'All'>('All');
  const [batch01Search, setBatch01Search] = useState('');
  // Batch 02 Decision Tracker Filters
  const [batch02CatFilter, setBatch02CatFilter] = useState<Batch02CategoryGroup | 'All'>('All');
  const [batch02Search, setBatch02Search] = useState('');
  // Batch 03 Decision Tracker Filters
  const [batch03CatFilter, setBatch03CatFilter] = useState<Batch03CategoryGroup | 'All'>('All');
  const [batch03Search, setBatch03Search] = useState('');
  // Batch 04 Decision Tracker Filters
  const [batch04CatFilter, setBatch04CatFilter] = useState<Batch04CategoryGroup | 'All'>('All');
  const [batch04Search, setBatch04Search] = useState('');
  // Batch 05 Decision Tracker Filters
  const [batch05CatFilter, setBatch05CatFilter] = useState<Batch05CategoryGroup | 'All'>('All');
  const [batch05Search, setBatch05Search] = useState('');
  const [variantPackInput, setVariantPackInput] = useState('');

  // Filters
  const [selectedIndustry, setSelectedIndustry] = useState<ProductUniverseIndustry | 'All'>('All');
  const [selectedLevel, setSelectedLevel] = useState<LibraryLevel | 'All'>('All');
  const [selectedBrandTrack, setSelectedBrandTrack] = useState<LibraryBrandTrack | 'All'>('All');
  const [selectedBatchFilter, setSelectedBatchFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected record for Research Card & Scorecard
  const [selectedRecordId, setSelectedRecordId] = useState<string>(records[0]?.id || '');

  // Add Discovery Product Drawer/Modal
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newVariant, setNewVariant] = useState('');
  const [newIndustry, setNewIndustry] = useState<ProductUniverseIndustry>('01. Food & Grocery');
  const [newCategory, setNewCategory] = useState('');
  const [newSubcategory, setNewSubcategory] = useState('');
  const [newBatchCode, setNewBatchCode] = useState('Batch 01');
  const [newBrandTrack, setNewBrandTrack] = useState<LibraryBrandTrack>('GRAMOS / Apna Bazar Select');
  const [newSourcing, setNewSourcing] = useState<string>('Supplier Purchase');
  const [newDescription, setNewDescription] = useState('');
  const [newRelevance, setNewRelevance] = useState('');
  const [newEstCost, setNewEstCost] = useState('');
  const [newTargetPrice, setNewTargetPrice] = useState('');
  const [newStorage, setNewStorage] = useState('');
  const [newRegReq, setNewRegReq] = useState('');

  // Inline feedback banner
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Edit Quote & Testing form state (synced on selection)
  const selectedRecord = useMemo(
    () => records.find((r) => r.id === selectedRecordId) || records[0] || null,
    [records, selectedRecordId]
  );

  const [quoteSupplierId, setQuoteSupplierId] = useState('');
  const [quoteLandedCost, setQuoteLandedCost] = useState('');
  const [quoteSellPrice, setQuoteSellPrice] = useState('');
  const [quoteMrp, setQuoteMrp] = useState('');
  const [quoteRef, setQuoteRef] = useState('');
  const [testingNotes, setTestingNotes] = useState('');
  const [rejectReasonInput, setRejectReasonInput] = useState('');

  // Promote to Commercial Catalogue form
  const [promoteOwnership, setPromoteOwnership] = useState<OwnershipType>('Self-Funded');
  const [promoteZone, setPromoteZone] = useState<Product['zone']>('Zone C');
  const [promoteQty, setPromoteQty] = useState('40');
  const [promoteGst, setPromoteGst] = useState('5');
  const [promoteBatchNo, setPromoteBatchNo] = useState('');
  const [promoteExpiry, setPromoteExpiry] = useState('');

  const selectRecord = (rec: ProductLibraryRecord) => {
    setSelectedRecordId(rec.id);
    setQuoteSupplierId(rec.linkedSupplierId || '');
    setQuoteLandedCost(
      rec.actualQuotedLandedCost !== null ? String(rec.actualQuotedLandedCost) : ''
    );
    setQuoteSellPrice(
      rec.actualProposedSellingPrice !== null ? String(rec.actualProposedSellingPrice) : ''
    );
    setQuoteMrp(rec.actualMrp !== null ? String(rec.actualMrp) : '');
    setQuoteRef(rec.quotationSourceRef || '');
    setTestingNotes(rec.sampleTestingNotes || '');
    setRejectReasonInput(rec.rejectionReason || '');
    setFeedback(null);
  };

  // Level counts
  const levelCounts = useMemo(() => {
    let l1 = 0;
    let l2 = 0;
    let l3 = 0;
    let rejected = 0;
    for (const r of records) {
      const lvl = getLibraryLevel(r.status);
      if (lvl === 'Level 1 — Master Product Library') l1 += 1;
      else if (lvl === 'Level 2 — Tested Product Library') l2 += 1;
      else l3 += 1;
      if (r.status === 'Rejected') rejected += 1;
    }
    return { total: records.length, l1, l2, l3, rejected };
  }, [records]);

  // Live POS performance metrics per retail Product ID
  const posPerformanceMap = useMemo(() => {
    const map: Record<string, { unitsSold: number; revenue: number; grossProfit: number }> = {};
    for (const sale of state.sales) {
      if (sale.isReturned) continue;
      for (const item of sale.items) {
        if (!map[item.productId]) {
          map[item.productId] = { unitsSold: 0, revenue: 0, grossProfit: 0 };
        }
        map[item.productId].unitsSold += item.qty;
        map[item.productId].revenue += item.lineTotal;
        map[item.productId].grossProfit += item.lineTotal - item.qty * item.landedCost;
      }
    }
    return map;
  }, [state.sales]);

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return records.filter((r) => {
      if (selectedIndustry !== 'All' && r.industry !== selectedIndustry) return false;
      if (selectedLevel !== 'All' && getLibraryLevel(r.status) !== selectedLevel) return false;
      if (selectedBrandTrack !== 'All' && r.brandTrack !== selectedBrandTrack) return false;
      if (selectedBatchFilter !== 'All' && r.batchCode !== selectedBatchFilter) return false;
      if (q) {
        const hay =
          `${r.libraryCode} ${r.productName} ${r.variantOrPackSize} ${r.category} ${r.subcategory} ${r.industry} ${r.brandTrack}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [records, selectedIndustry, selectedLevel, selectedBrandTrack, selectedBatchFilter, searchQuery]);

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newCategory.trim()) {
      setFeedback({ type: 'err', text: 'Product name and category are required.' });
      return;
    }
    const created = addLibraryProduct({
      productName: newName,
      variantOrPackSize: newVariant || 'Standard Pack',
      industry: newIndustry,
      category: newCategory,
      subcategory: newSubcategory || newCategory,
      batchCode: newBatchCode,
      description: newDescription || 'Added for systematic discovery evaluation.',
      marketRelevance: newRelevance || 'Kota households & student catchment evaluation pending.',
      brandTrack: newBrandTrack,
      sourcingOptions: [newSourcing],
      estimatedCostRange: newEstCost || 'Estimate pending',
      targetSellingPriceRange: newTargetPrice || 'Target TBD',
      shelfLifeAndStorage: newStorage || 'Check storage suitability before sampling',
      regulatoryRequirements: newRegReq || 'Verify FSSAI / Legal Metrology / GST compliance',
    });
    setShowAddForm(false);
    setNewName('');
    setNewVariant('');
    setNewCategory('');
    setNewSubcategory('');
    setNewDescription('');
    setNewRelevance('');
    setNewEstCost('');
    setNewTargetPrice('');
    setNewStorage('');
    setNewRegReq('');
    selectRecord(created);
    setFeedback({
      type: 'ok',
      text: `${created.libraryCode} added to Level 1 Master Product Library (${created.batchCode}) with zero capital committed.`,
    });
  };

  const handleSaveQuotationAndNotes = () => {
    if (!selectedRecord) return;
    const sup = state.suppliers.find((s) => s.id === quoteSupplierId);
    const landed = quoteLandedCost.trim() ? Number(quoteLandedCost) : null;
    const sell = quoteSellPrice.trim() ? Number(quoteSellPrice) : null;
    const mrp = quoteMrp.trim() ? Number(quoteMrp) : null;

    updateLibraryQuotationAndTesting(selectedRecord.id, {
      linkedSupplierId: sup ? sup.id : selectedRecord.linkedSupplierId,
      linkedSupplierName: sup ? sup.name : selectedRecord.linkedSupplierName,
      actualQuotedLandedCost: landed !== null && !Number.isNaN(landed) ? landed : null,
      actualProposedSellingPrice: sell !== null && !Number.isNaN(sell) ? sell : null,
      actualMrp: mrp !== null && !Number.isNaN(mrp) ? mrp : null,
      quotationSourceRef: quoteRef.trim() || selectedRecord.quotationSourceRef,
      sampleTestingNotes: testingNotes.trim() || selectedRecord.sampleTestingNotes,
    });
    setFeedback({
      type: 'ok',
      text: `Updated supplier link, verified quotation & testing notes for ${selectedRecord.libraryCode}.`,
    });
  };

  const handleWorkflowTransition = (status: LibraryWorkflowStatus) => {
    if (!selectedRecord) return;
    const res = updateLibraryStatus(
      selectedRecord.id,
      status,
      status === 'Rejected' ? rejectReasonInput : undefined
    );
    if (!res.ok) {
      setFeedback({ type: 'err', text: res.error || 'Workflow update blocked.' });
    } else {
      setFeedback({
        type: 'ok',
        text: `${selectedRecord.libraryCode} moved to stage "${status}".`,
      });
    }
  };

  const handlePromoteToCatalogue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    const res = promoteLibraryToCommercialCatalogue({
      libraryId: selectedRecord.id,
      ownershipType: promoteOwnership,
      zone: promoteZone,
      initialStockQty: Number(promoteQty) || 20,
      gstPercent: Number(promoteGst) || 0,
      batchNumber: promoteBatchNo || undefined,
      expiryDate: promoteExpiry ? promoteExpiry : null,
    });
    if (!res.ok) {
      setFeedback({ type: 'err', text: res.error || 'Promotion blocked.' });
    } else if (res.product) {
      setFeedback({
        type: 'ok',
        text: `Launched ${res.product.sku} into GRAMOS Mart Zone ${promoteZone.replace('Zone ', '')} & POS Billing (${res.product.stockQty} units).`,
      });
    }
  };

  const linkedRetailProduct = useMemo(() => {
    if (!selectedRecord?.linkedRetailProductId) return null;
    return state.products.find((p) => p.id === selectedRecord.linkedRetailProductId) || null;
  }, [selectedRecord, state.products]);

  const batch01SelectedCount = useMemo(
    () => batch01Candidates.filter((c) => c.selected).length,
    [batch01Candidates]
  );

  const batch01Groups: {
    group: Batch01CategoryGroup;
    range: string;
    shortTitle: string;
  }[] = [
    { group: 'Category A — Grains, rice and cereals', range: 'GRM-PL-B01-001 to 008', shortTitle: 'Grains and cereals' },
    { group: 'Category B — Pulses and legumes', range: 'GRM-PL-B01-009 to 016', shortTitle: 'Pulses and legumes' },
    { group: 'Category C — Flour and cooking ingredients', range: 'GRM-PL-B01-017 to 024', shortTitle: 'Flour and cooking ingredients' },
    { group: 'Category D — Oils, spices and condiments', range: 'GRM-PL-B01-025 to 032', shortTitle: 'Oils, spices and condiments' },
    { group: 'Category E — Everyday grocery essentials', range: 'GRM-PL-B01-033 to 040', shortTitle: 'Everyday grocery essentials' },
    { group: 'Category F — GRAMOSFUEL product opportunities', range: 'GRM-PL-B01-041 to 050', shortTitle: 'GRAMOSFUEL opportunities' },
  ];

  const handlePrepareBatch01Cards = () => {
    const res = prepareBatch01ResearchCards();
    if (res.firstRecordId === null) {
      setFeedback({
        type: 'err',
        text: 'Select at least 1 candidate from the Batch 01 tracker before preparing research cards.',
      });
      return;
    }
    setSelectedRecordId(res.firstRecordId);
    setLibraryTab('research');
    setFeedback({
      type: 'ok',
      text:
        res.createdCount > 0
          ? `Prepared ${res.createdCount} new Level 1 discovery research card(s) under Batch 01. Selection does not mean tested or approved.`
          : 'All selected Batch 01 candidates already have research cards ready — opened the first card below.',
    });
  };

  const batch02SelectedCount = useMemo(
    () => batch02Candidates.filter((c) => c.selected).length,
    [batch02Candidates]
  );

  const batch02Stats = useMemo(() => {
    const b02Recs = records.filter((r) => r.libraryCode.startsWith('GRM-PL-B02-'));
    const confirmedTested = b02Recs.filter(
      (r) => r.testingEvidenceLogged && r.complianceGate.sampleTested
    ).length;
    const confirmedApproved = b02Recs.filter(
      (r) =>
        r.status === 'Approved' ||
        r.status === 'Commercial Catalogue' ||
        r.status === 'Market Performance'
    ).length;
    return {
      listed: batch02Candidates.length,
      confirmedTested,
      confirmedApproved,
    };
  }, [records, batch02Candidates.length]);

  const batch02Groups: {
    group: Batch02CategoryGroup;
    range: string;
    shortTitle: string;
  }[] = [
    { group: 'Category 1 — Namkeen and Savoury Snacks', range: 'GRM-PL-B02-001 to 010', shortTitle: 'Namkeen & Savoury Snacks' },
    { group: 'Category 2 — Traditional Dry Snacks', range: 'GRM-PL-B02-011 to 020', shortTitle: 'Traditional Dry Snacks' },
    { group: 'Category 3 — Rajasthan and Hadoti Specialities', range: 'GRM-PL-B02-021 to 030', shortTitle: 'Rajasthan & Hadoti Specialities' },
    { group: 'Category 4 — Traditional Sweets and Confectionery', range: 'GRM-PL-B02-031 to 040', shortTitle: 'Traditional Sweets & Confectionery' },
    { group: 'Category 5 — Ready-to-Cook, Bakery and Regional Innovations', range: 'GRM-PL-B02-041 to 050', shortTitle: 'Ready-to-Cook & Bakery' },
  ];

  const batch02RegionalSpotlights: {
    candidateId: string;
    code: string;
    title: string;
    sourcingNote: string;
    supplyNote: string;
  }[] = [
    {
      candidateId: 'b02-21',
      code: 'GRM-PL-B02-021',
      title: 'Kota Kachori',
      sourcingNote: 'Fresh, frozen or packaged sourcing',
      supplyNote: 'Requires fresh or temperature-controlled check',
    },
    {
      candidateId: 'b02-25',
      code: 'GRM-PL-B02-025',
      title: 'Ker Sangri Mix',
      sourcingNote: 'Regional speciality',
      supplyNote: 'Hadoti & Rajasthan dry desert blend sourcing',
    },
    {
      candidateId: 'b02-27',
      code: 'GRM-PL-B02-027',
      title: 'Garlic Chutney',
      sourcingNote: 'Fresh, dry and packaged formats',
      supplyNote: 'Split wet refrigerated jars vs dry premix SKUs',
    },
    {
      candidateId: 'b02-40',
      code: 'GRM-PL-B02-040',
      title: 'Ghevar',
      sourcingNote: 'Seasonal sweet',
      supplyNote: 'Fresh / temperature-controlled & fragile handling',
    },
  ];

  const batch02TestingRequirements = [
    '1. Record actual manufacturer / supplier details (location, GST/FSSAI, capacity)',
    '2. Record sample procurement cost and minimum order quantity (MOQ)',
    '3. Taste, aroma, texture and consistency evaluation across batches',
    '4. Ingredient quality, oil quality and food safety evaluation',
    '5. Packaging strength, seal integrity and verified shelf-life evidence',
    '6. Actual landed cost, proposed MRP and gross margin calculation',
    '7. FSSAI compliance, ingredient/allergen label declarations and batch traceability',
    '8. Storage, moisture barrier and transport suitability verification',
  ];

  const handlePrepareBatch02Cards = () => {
    const res = prepareBatch02ResearchCards();
    if (res.firstRecordId === null) {
      setFeedback({
        type: 'err',
        text: 'Select at least 1 candidate from the Batch 02 tracker before preparing research cards.',
      });
      return;
    }
    setSelectedRecordId(res.firstRecordId);
    setLibraryTab('research');
    setFeedback({
      type: 'ok',
      text:
        res.createdCount > 0
          ? `Prepared ${res.createdCount} new Level 1 discovery research card(s) under Batch 02. Selection does not mean tested or approved.`
          : 'All selected Batch 02 candidates already have research cards ready — opened the first card below.',
    });
  };

  const batch03SelectedCount = useMemo(
    () => batch03Candidates.filter((c) => c.selected).length,
    [batch03Candidates]
  );

  const batch03Stats = useMemo(() => {
    const b03Recs = records.filter((r) => r.libraryCode.startsWith('GRM-PL-B03-'));
    const confirmedTested = b03Recs.filter(
      (r) => r.testingEvidenceLogged && r.complianceGate.sampleTested
    ).length;
    const confirmedApproved = b03Recs.filter(
      (r) =>
        r.status === 'Approved' ||
        r.status === 'Commercial Catalogue' ||
        r.status === 'Market Performance'
    ).length;
    const cumulativeTotal =
      batch01Candidates.length + batch02Candidates.length + batch03Candidates.length;
    return {
      listed: batch03Candidates.length,
      confirmedTested,
      confirmedApproved,
      cumulativeTotal,
    };
  }, [records, batch01Candidates.length, batch02Candidates.length, batch03Candidates.length]);

  const batch03Groups: {
    group: Batch03CategoryGroup;
    range: string;
    shortTitle: string;
  }[] = [
    { group: 'Category 1 — Traditional Indian Drinks', range: 'GRM-PL-B03-001 to 010', shortTitle: 'Traditional Indian Drinks' },
    { group: 'Category 2 — Health and Nutrition Drinks', range: 'GRM-PL-B03-011 to 020', shortTitle: 'Health & Nutrition Drinks' },
    { group: 'Category 3 — Tea, Coffee and Herbal Infusions', range: 'GRM-PL-B03-021 to 030', shortTitle: 'Tea, Coffee & Infusions' },
    { group: 'Category 4 — Fruit and Vegetable Beverages', range: 'GRM-PL-B03-031 to 040', shortTitle: 'Fruit & Vegetable Beverages' },
    { group: 'Category 5 — Dairy, Refreshers and Beverage Innovations', range: 'GRM-PL-B03-041 to 050', shortTitle: 'Dairy & Refreshers' },
  ];

  const batch03GramosfuelOpportunities: {
    candidateId: string;
    code: string;
    title: string;
    formatLabel: string;
    mappedName: string;
  }[] = [
    {
      candidateId: 'b03-01',
      code: 'GRM-PL-B03-001',
      title: 'Jaljeera Masala',
      formatLabel: 'Instant drink mix',
      mappedName: 'Jaljeera Mix',
    },
    {
      candidateId: 'b03-02',
      code: 'GRM-PL-B03-002',
      title: 'Aam Panna',
      formatLabel: 'Concentrate or premix',
      mappedName: 'Aam Panna Concentrate',
    },
    {
      candidateId: 'b03-12',
      code: 'GRM-PL-B03-012',
      title: 'Ragi Malt',
      formatLabel: 'Grain-based beverage',
      mappedName: 'Ragi Malt Drink Mix',
    },
    {
      candidateId: 'b03-03',
      code: 'GRM-PL-B03-003',
      title: 'Shikanji Mix',
      formatLabel: 'Summer refreshment',
      mappedName: 'Shikanji Masala',
    },
  ];

  const batch03ApprovalChecks = [
    '1. FSSAI category and licensing',
    '2. Ingredient declarations',
    '3. Nutritional claims verification',
    '4. Microbiological safety',
    '5. Shelf-life evidence',
    '6. Packaging compatibility',
    '7. Storage conditions',
    '8. Actual landed cost',
  ];

  const handlePrepareBatch03Cards = () => {
    const res = prepareBatch03ResearchCards();
    if (res.firstRecordId === null) {
      setFeedback({
        type: 'err',
        text: 'Select at least 1 candidate from the Batch 03 tracker before preparing research cards.',
      });
      return;
    }
    setSelectedRecordId(res.firstRecordId);
    setLibraryTab('research');
    setFeedback({
      type: 'ok',
      text:
        res.createdCount > 0
          ? `Prepared ${res.createdCount} new Level 1 discovery research card(s) under Batch 03. Candidates are for sample sourcing, not approved products.`
          : 'All selected Batch 03 candidates already have research cards ready — opened the first card below.',
    });
  };

  const batch04SelectedCount = useMemo(
    () => batch04Candidates.filter((c) => c.selected).length,
    [batch04Candidates]
  );

  const batch04Stats = useMemo(() => {
    const b04Recs = records.filter((r) => r.libraryCode.startsWith('GRM-PL-B04-'));
    const confirmedTested = b04Recs.filter(
      (r) => r.testingEvidenceLogged && r.complianceGate.sampleTested
    ).length;
    const confirmedApproved = b04Recs.filter(
      (r) =>
        r.status === 'Approved' ||
        r.status === 'Commercial Catalogue' ||
        r.status === 'Market Performance'
    ).length;
    const cumulativeTotal =
      batch01Candidates.length +
      batch02Candidates.length +
      batch03Candidates.length +
      batch04Candidates.length;
    return {
      listed: batch04Candidates.length,
      confirmedTested,
      confirmedApproved,
      cumulativeTotal,
    };
  }, [
    records,
    batch01Candidates.length,
    batch02Candidates.length,
    batch03Candidates.length,
    batch04Candidates.length,
  ]);

  const batch04Groups: {
    group: Batch04CategoryGroup;
    range: string;
    shortTitle: string;
  }[] = [
    { group: 'Category 1 — Bath and Body Care', range: 'GRM-PL-B04-001 to 010', shortTitle: 'Bath & Body Care' },
    { group: 'Category 2 — Hair Care', range: 'GRM-PL-B04-011 to 020', shortTitle: 'Hair Care' },
    { group: 'Category 3 — Face and Skin Care', range: 'GRM-PL-B04-021 to 030', shortTitle: 'Face & Skin Care' },
    { group: 'Category 4 — Oral Care and Hygiene', range: 'GRM-PL-B04-031 to 040', shortTitle: 'Oral Care & Hygiene' },
    { group: 'Category 5 — Grooming, Beauty and Accessories', range: 'GRM-PL-B04-041 to 050', shortTitle: 'Grooming & Beauty' },
  ];

  const batch04PrivateLabelOpportunities: {
    candidateId: string;
    code: string;
    title: string;
    opportunityType: string;
  }[] = [
    {
      candidateId: 'b04-02',
      code: 'GRM-PL-B04-002',
      title: 'Herbal Bath Soap',
      opportunityType: 'Contract manufacturing / private label',
    },
    {
      candidateId: 'b04-17',
      code: 'GRM-PL-B04-017',
      title: 'Coconut Hair Oil',
      opportunityType: 'White-label possibility',
    },
    {
      candidateId: 'b04-26',
      code: 'GRM-PL-B04-026',
      title: 'Aloe Vera Gel',
      opportunityType: 'Personal-care product',
    },
    {
      candidateId: 'b04-22',
      code: 'GRM-PL-B04-022',
      title: 'Herbal Face Wash',
      opportunityType: 'Personal-care product',
    },
  ];

  const batch04ApprovalChecks = [
    '1. Manufacturer licence',
    '2. Applicable cosmetics and product regulations',
    '3. Ingredient and label declarations',
    '4. Batch traceability',
    '5. Manufacturing and expiry dates',
    '6. Quality testing verification',
    '7. Packaging integrity',
    '8. Supplier reliability',
    '9. Actual landed cost',
  ];

  const handlePrepareBatch04Cards = () => {
    const res = prepareBatch04ResearchCards();
    if (res.firstRecordId === null) {
      setFeedback({
        type: 'err',
        text: 'Select at least 1 candidate from the Batch 04 tracker before preparing research cards.',
      });
      return;
    }
    setSelectedRecordId(res.firstRecordId);
    setLibraryTab('research');
    setFeedback({
      type: 'ok',
      text:
        res.createdCount > 0
          ? `Prepared ${res.createdCount} new Level 1 discovery research card(s) under Batch 04. Research priorities are not validated demand rankings.`
          : 'All selected Batch 04 candidates already have research cards ready — opened the first card below.',
    });
  };

  const batch05SelectedCount = useMemo(
    () => batch05Candidates.filter((c) => c.selected).length,
    [batch05Candidates]
  );

  const batch05Stats = useMemo(() => {
    const b05Recs = records.filter((r) => r.libraryCode.startsWith('GRM-PL-B05-'));
    const confirmedTested = b05Recs.filter(
      (r) => r.testingEvidenceLogged && r.complianceGate.sampleTested
    ).length;
    const confirmedApproved = b05Recs.filter(
      (r) =>
        r.status === 'Approved' ||
        r.status === 'Commercial Catalogue' ||
        r.status === 'Market Performance'
    ).length;
    const cumulativeTotal =
      batch01Candidates.length +
      batch02Candidates.length +
      batch03Candidates.length +
      batch04Candidates.length +
      batch05Candidates.length;
    return {
      listed: batch05Candidates.length,
      confirmedTested,
      confirmedApproved,
      cumulativeTotal,
    };
  }, [
    records,
    batch01Candidates.length,
    batch02Candidates.length,
    batch03Candidates.length,
    batch04Candidates.length,
    batch05Candidates.length,
  ]);

  const batch05Groups: {
    group: Batch05CategoryGroup;
    range: string;
    shortTitle: string;
  }[] = [
    { group: 'Category 1 — Laundry and Fabric Care', range: 'GRM-PL-B05-001 to 010', shortTitle: 'Laundry & Fabric Care' },
    { group: 'Category 2 — Floor and Surface Cleaning', range: 'GRM-PL-B05-011 to 020', shortTitle: 'Floor & Surface Cleaning' },
    { group: 'Category 3 — Dishwashing and Kitchen Hygiene', range: 'GRM-PL-B05-021 to 030', shortTitle: 'Dishwashing & Kitchen' },
    { group: 'Category 4 — Cleaning Tools and Consumables', range: 'GRM-PL-B05-031 to 040', shortTitle: 'Cleaning Tools & Supply' },
    { group: 'Category 5 — Household Hygiene and Pest Management', range: 'GRM-PL-B05-041 to 050', shortTitle: 'Hygiene & Pest Control' },
  ];

  const batch05GramosfuelOpportunities: {
    candidateId: string;
    code: string;
    title: string;
    formatDetail: string;
  }[] = [
    {
      candidateId: 'b05-01',
      code: 'GRM-PL-B05-001',
      title: 'Detergent Powder',
      formatDetail: 'Multiple pack sizes',
    },
    {
      candidateId: 'b05-22',
      code: 'GRM-PL-B05-022',
      title: 'Dishwash Liquid',
      formatDetail: 'Refill and bottle formats',
    },
    {
      candidateId: 'b05-11',
      code: 'GRM-PL-B05-011',
      title: 'Floor Cleaner',
      formatDetail: 'Concentrate and ready-to-use',
    },
    {
      candidateId: 'b05-12',
      code: 'GRM-PL-B05-012',
      title: 'Phenyl',
      formatDetail: 'Household cleaning range',
    },
  ];

  const batch05ComplianceChecks = [
    '1. Verify manufacturer',
    '2. Verify product composition',
    '3. Verify applicable BIS / QCO and regulatory requirements',
    '4. Check safety labelling',
    '5. Check usage instructions',
    '6. Verify batch details',
    '7. Inspect packaging leakage',
    '8. Test cleaning / functional performance',
    '9. Calculate actual landed cost',
  ];

  const handlePrepareBatch05Cards = () => {
    const res = prepareBatch05ResearchCards();
    if (res.firstRecordId === null) {
      setFeedback({
        type: 'err',
        text: 'Select at least 1 candidate from the Batch 05 tracker before preparing research cards.',
      });
      return;
    }
    setSelectedRecordId(res.firstRecordId);
    setLibraryTab('research');
    setFeedback({
      type: 'ok',
      text:
        res.createdCount > 0
          ? `Prepared ${res.createdCount} new Level 1 discovery research card(s) under Batch 05. Initial research priorities are not confirmed demand rankings.`
          : 'All selected Batch 05 candidates already have research cards ready — opened the first card below.',
    });
  };

  const handleCreateVariantCard = () => {
    if (!selectedRecord) return;
    if (!variantPackInput.trim()) {
      setFeedback({ type: 'err', text: 'Enter a distinct pack size or variant (e.g. 500 g Pouch).' });
      return;
    }
    const created = createVariantResearchCard(selectedRecord.id, variantPackInput);
    if (created) {
      setVariantPackInput('');
      selectRecord(created);
      setFeedback({
        type: 'ok',
        text: `Created distinct variant research ID ${created.libraryCode} for "${created.variantOrPackSize}".`,
      });
    }
  };

  const tabs: { id: LibraryWorkspaceTab; label: string; count?: string }[] = [
    { id: 'universe', label: '12 Industries & 3-Level Explorer', count: `${records.length}` },
    { id: 'batch01', label: 'Batch 01 · Food & Grocery (GRM-PL-B01)', count: `${batch01SelectedCount}/50` },
    { id: 'batch02', label: 'Batch 02 · Snacks & Regional (GRM-PL-B02)', count: `${batch02SelectedCount}/50` },
    { id: 'batch03', label: 'Batch 03 · Beverages & Mixes (GRM-PL-B03)', count: `${batch03SelectedCount}/50` },
    { id: 'batch04', label: 'Batch 04 · Personal Care (GRM-PL-B04)', count: `${batch04SelectedCount}/50` },
    { id: 'batch05', label: 'Batch 05 · Home Care (GRM-PL-B05)', count: `${batch05SelectedCount}/50` },
    { id: 'research', label: 'Research Cards & 8-Stage Pipeline' },
    { id: 'scorecard', label: '10-Parameter Scorecard & Gate' },
    { id: 'batches', label: 'Batches 01–10 Roadmap', count: `${batches.length}` },
  ];

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-teal-800">
              <span className="inline-flex items-center gap-1 font-mono bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                <Layers className="h-3.5 w-3.5" />
                GRM-PL-001
              </span>
              <span>Discover → Shortlist → Sample → Test → Approve → Commercial Catalogue</span>
            </div>
            <h2 className="mt-1.5 font-display text-xl font-bold text-slate-900">
              GRAMOS Universal Product Library
            </h2>
            <p className="mt-1 text-sm text-slate-600 max-w-3xl">
              Research hundreds of product candidates across 12 industries without committing working
              capital until samples, verified supplier quotations, and safety/legal checks pass.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowAddForm((v) => !v)}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-800 transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Discovery Product</span>
            </button>
          </div>
        </div>

        {/* 3-Level Separation KPI Strip */}
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <button
            type="button"
            onClick={() => {
              setSelectedLevel(
                selectedLevel === 'Level 1 — Master Product Library'
                  ? 'All'
                  : 'Level 1 — Master Product Library'
              );
              setLibraryTab('universe');
            }}
            className={`rounded-lg border p-3.5 text-left transition-colors cursor-pointer ${
              selectedLevel === 'Level 1 — Master Product Library'
                ? 'border-teal-600 bg-teal-50/40'
                : 'border-slate-200 bg-slate-50 hover:border-slate-300'
            }`}
          >
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Level 1 · Master Library
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="font-mono text-2xl font-bold tabular-nums text-slate-900">
                {levelCounts.l1}
              </span>
              <span className="text-[11px] text-slate-600">₹0 capital locked</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              Discovered, Shortlisted, Supplier Identified
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedLevel(
                selectedLevel === 'Level 2 — Tested Product Library'
                  ? 'All'
                  : 'Level 2 — Tested Product Library'
              );
              setLibraryTab('universe');
            }}
            className={`rounded-lg border p-3.5 text-left transition-colors cursor-pointer ${
              selectedLevel === 'Level 2 — Tested Product Library'
                ? 'border-amber-500 bg-amber-50/40'
                : 'border-slate-200 bg-slate-50 hover:border-slate-300'
            }`}
          >
            <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-800">
              Level 2 · Tested Library
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="font-mono text-2xl font-bold tabular-nums text-amber-900">
                {levelCounts.l2}
              </span>
              <span className="text-[11px] text-amber-700">Sample & Evaluation</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              Sample Requested & Active Testing
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedLevel(
                selectedLevel === 'Level 3 — Approved Commercial Catalogue'
                  ? 'All'
                  : 'Level 3 — Approved Commercial Catalogue'
              );
              setLibraryTab('universe');
            }}
            className={`rounded-lg border p-3.5 text-left transition-colors cursor-pointer ${
              selectedLevel === 'Level 3 — Approved Commercial Catalogue'
                ? 'border-emerald-600 bg-emerald-50/40'
                : 'border-slate-200 bg-slate-50 hover:border-slate-300'
            }`}
          >
            <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800">
              Level 3 · Commercial Catalogue
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="font-mono text-2xl font-bold tabular-nums text-emerald-900">
                {levelCounts.l3}
              </span>
              <span className="text-[11px] text-emerald-700">Sale-ready & Synced</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              Approved, Store Catalogue & POS Performance
            </div>
          </button>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-red-700">
              Rejected Preserved
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="font-mono text-2xl font-bold tabular-nums text-red-700">
                {levelCounts.rejected}
              </span>
              <span className="text-[11px] text-slate-600">Rule 6 Memory</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              Kept permanently to prevent repeat mistakes
            </div>
          </div>
        </div>
      </div>

      {/* Inline Feedback Alert */}
      {feedback && (
        <div
          className={`flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-xs font-medium ${
            feedback.type === 'ok'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-red-200 bg-red-50 text-red-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'ok' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-700" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs underline opacity-75 hover:opacity-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Add Discovery Product Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddProduct}
          className="rounded-xl border border-teal-200 bg-white p-5 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Add New Discovery Record (Level 1 — Zero Capital Committed)
              </h3>
              <p className="text-xs text-slate-500">
                Distinct pack sizes/variants must receive their own unique Library ID. Verified quotes
                remain empty until an actual supplier quote is received.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="space-y-1 text-xs">
              <span className="font-semibold text-slate-700">Product Name *</span>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., Cold-Pressed Sesame Oil"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
              />
            </label>
            <label className="space-y-1 text-xs">
              <span className="font-semibold text-slate-700">Variant / Pack Size *</span>
              <input
                type="text"
                required
                value={newVariant}
                onChange={(e) => setNewVariant(e.target.value)}
                placeholder="e.g., 500 ml Glass Bottle"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
              />
            </label>
            <label className="space-y-1 text-xs">
              <span className="font-semibold text-slate-700">Universe Industry (01–12)</span>
              <select
                value={newIndustry}
                onChange={(e) => setNewIndustry(e.target.value as ProductUniverseIndustry)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
              >
                {PRODUCT_UNIVERSE_INDUSTRIES.map((ind) => (
                  <option key={ind.id} value={ind.id}>
                    {ind.id}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs">
              <span className="font-semibold text-slate-700">Development Batch</span>
              <select
                value={newBatchCode}
                onChange={(e) => setNewBatchCode(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.batchCode}>
                    {b.batchCode} — {b.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-xs">
              <span className="font-semibold text-slate-700">Category *</span>
              <input
                type="text"
                required
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="e.g., Cooking Oils"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
              />
            </label>
            <label className="space-y-1 text-xs">
              <span className="font-semibold text-slate-700">Subcategory</span>
              <input
                type="text"
                value={newSubcategory}
                onChange={(e) => setNewSubcategory(e.target.value)}
                placeholder="e.g., Wood-Pressed Oil"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
              />
            </label>
            <label className="space-y-1 text-xs">
              <span className="font-semibold text-slate-700">Brand Track</span>
              <select
                value={newBrandTrack}
                onChange={(e) => setNewBrandTrack(e.target.value as LibraryBrandTrack)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
              >
                {BRAND_TRACKS.map((bt) => (
                  <option key={bt} value={bt}>
                    {bt}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs">
              <span className="font-semibold text-slate-700">Primary Sourcing Option</span>
              <select
                value={newSourcing}
                onChange={(e) => setNewSourcing(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
              >
                <option value="Supplier Purchase">Supplier Purchase</option>
                <option value="Contract Manufacturing">Contract Manufacturing</option>
                <option value="White-Label">White-Label</option>
                <option value="Regional Producer">Regional Producer (Hadoti)</option>
                <option value="Own Production">Own Production</option>
              </select>
            </label>

            <label className="space-y-1 text-xs">
              <span className="font-semibold text-slate-700">Unverified Est. Cost Range</span>
              <input
                type="text"
                value={newEstCost}
                onChange={(e) => setNewEstCost(e.target.value)}
                placeholder="e.g., ₹110–₹130 (Estimate)"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
              />
            </label>
            <label className="space-y-1 text-xs">
              <span className="font-semibold text-slate-700">Target Selling Price Range</span>
              <input
                type="text"
                value={newTargetPrice}
                onChange={(e) => setNewTargetPrice(e.target.value)}
                placeholder="e.g., ₹165–₹185"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
              />
            </label>
            <label className="space-y-1 text-xs">
              <span className="font-semibold text-slate-700">Shelf Life & Storage</span>
              <input
                type="text"
                value={newStorage}
                onChange={(e) => setNewStorage(e.target.value)}
                placeholder="e.g., 180 days · Cool dry Zone B"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
              />
            </label>
            <label className="space-y-1 text-xs">
              <span className="font-semibold text-slate-700">Regulatory / Legal Notes</span>
              <input
                type="text"
                value={newRegReq}
                onChange={(e) => setNewRegReq(e.target.value)}
                placeholder="e.g., FSSAI + 5% GST + Legal Metrology"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-xs">
              <span className="font-semibold text-slate-700">Product Description</span>
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Brief specification, material/ingredient note..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
              />
            </label>
            <label className="space-y-1 text-xs">
              <span className="font-semibold text-slate-700">Kota / Hadoti Market Relevance</span>
              <input
                type="text"
                value={newRelevance}
                onChange={(e) => setNewRelevance(e.target.value)}
                placeholder="Who buys it & expected repeat cycle..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
              />
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800 cursor-pointer"
            >
              Save to Level 1 Master Library
            </button>
          </div>
        </form>
      )}

      {/* Workspace Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        {tabs.map((t) => {
          const active = libraryTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setLibraryTab(t.id)}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                active
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>{t.label}</span>
              {t.count && (
                <span
                  className={`font-mono text-[11px] px-1.5 py-0.5 rounded ${
                    active ? 'bg-slate-700 text-slate-100' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: 12 Industries & 3-Level Explorer */}
      {libraryTab === 'universe' && (
        <div className="space-y-5">
          {/* 12 Discovery Universe Industries Grid */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  12-Industry Discovery Universe (01–12)
                </h3>
                <p className="text-xs text-slate-500">
                  Click any industry card to isolate discovery, testing, and commercial candidates.
                </p>
              </div>
              {selectedIndustry !== 'All' && (
                <button
                  type="button"
                  onClick={() => setSelectedIndustry('All')}
                  className="text-xs font-semibold text-teal-700 hover:underline cursor-pointer"
                >
                  Show All 12 Industries
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              {PRODUCT_UNIVERSE_INDUSTRIES.map((ind) => {
                const indRecs = records.filter((r) => r.industry === ind.id);
                const commercialCnt = indRecs.filter(
                  (r) => getLibraryLevel(r.status) === 'Level 3 — Approved Commercial Catalogue'
                ).length;
                const active = selectedIndustry === ind.id;

                return (
                  <button
                    key={ind.id}
                    type="button"
                    onClick={() => setSelectedIndustry(active ? 'All' : ind.id)}
                    className={`rounded-lg border p-3 text-left transition-colors cursor-pointer ${
                      active
                        ? 'border-teal-600 bg-teal-50/50'
                        : 'border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] font-semibold text-teal-800 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded">
                        {ind.code}
                      </span>
                      <span className="font-mono text-xs font-bold tabular-nums text-slate-800">
                        {indRecs.length} items
                      </span>
                    </div>
                    <div className="mt-1.5 text-xs font-bold text-slate-900 truncate">{ind.id}</div>
                    <div className="mt-0.5 text-[11px] text-slate-500 line-clamp-2">{ind.summary}</div>
                    <div className="mt-2 text-[10px] font-medium text-emerald-700">
                      {commercialCnt} live / approved in L3
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search & Cross-Filter Controls */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search ID, product, pack size, category..."
                  className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
                />
              </div>

              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value as LibraryLevel | 'All')}
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
              >
                <option value="All">All 3 Library Levels</option>
                <option value="Level 1 — Master Product Library">Level 1 — Master Product Library</option>
                <option value="Level 2 — Tested Product Library">Level 2 — Tested Product Library</option>
                <option value="Level 3 — Approved Commercial Catalogue">
                  Level 3 — Approved Commercial Catalogue
                </option>
              </select>

              <select
                value={selectedBrandTrack}
                onChange={(e) => setSelectedBrandTrack(e.target.value as LibraryBrandTrack | 'All')}
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
              >
                <option value="All">All Brand Tracks</option>
                {BRAND_TRACKS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>

              <select
                value={selectedBatchFilter}
                onChange={(e) => setSelectedBatchFilter(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
              >
                <option value="All">All Batches (01–10)</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.batchCode}>
                    {b.batchCode} — {b.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Master Records Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    <th className="py-2.5 px-3">Library ID & Batch</th>
                    <th className="py-2.5 px-3">Product & Variant / Pack</th>
                    <th className="py-2.5 px-3">Industry & Brand Track</th>
                    <th className="py-2.5 px-3">Level & Stage</th>
                    <th className="py-2.5 px-3">Est. vs Verified Quote</th>
                    <th className="py-2.5 px-3 text-right">Scorecard</th>
                    <th className="py-2.5 px-3 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map((rec) => {
                    const lvl = getLibraryLevel(rec.status);
                    const lvlBadge = getLevelShortBadge(lvl);
                    const sc = computeScoreSummary(rec.scorecard);
                    return (
                      <tr key={rec.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 align-top whitespace-nowrap">
                          <div className="font-mono font-semibold text-slate-900">{rec.libraryCode}</div>
                          <div className="text-[11px] text-slate-500">{rec.batchCode}</div>
                        </td>
                        <td className="py-2.5 px-3 align-top min-w-[220px]">
                          <div className="font-semibold text-slate-900">{rec.productName}</div>
                          <div className="text-[11px] text-slate-500">{rec.variantOrPackSize}</div>
                          {rec.status === 'Rejected' && rec.rejectionReason && (
                            <div className="mt-1 text-[11px] text-red-700 font-medium">
                              {rec.rejectionReason}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 align-top">
                          <div className="text-slate-800 font-medium">{rec.industry}</div>
                          <div className="text-[11px] text-slate-500">{rec.brandTrack}</div>
                        </td>
                        <td className="py-2.5 px-3 align-top whitespace-nowrap">
                          <div className="flex flex-col gap-1 items-start">
                            <span
                              className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-semibold ${lvlBadge.cls}`}
                            >
                              {lvlBadge.label}
                            </span>
                            <span
                              className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-medium ${getStatusStyle(
                                rec.status
                              )}`}
                            >
                              {rec.status}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 align-top">
                          <div className="text-[11px] text-slate-500">Est: {rec.estimatedCostRange}</div>
                          {rec.actualQuotedLandedCost !== null ? (
                            <div className="font-mono font-semibold text-emerald-800">
                              Quote: {formatINR(rec.actualQuotedLandedCost)} · Sell{' '}
                              {rec.actualProposedSellingPrice !== null
                                ? formatINR(rec.actualProposedSellingPrice)
                                : 'TBD'}
                            </div>
                          ) : (
                            <div className="text-[11px] font-medium text-amber-700">
                              Unverified — Pending Supplier Quote
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 align-top text-right whitespace-nowrap">
                          <div className="font-mono font-bold tabular-nums text-slate-900">
                            {sc.total}/50
                          </div>
                          <div className="text-[10px] text-slate-500">{sc.scoredCount}/10 rated</div>
                        </td>
                        <td className="py-2.5 px-3 align-top text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              selectRecord(rec);
                              setLibraryTab('research');
                            }}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                          >
                            <span>Open Card</span>
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredRecords.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-slate-500">
                        No library records match the selected filters. Click "Add Discovery Product" to
                        register a new candidate.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1B: Batch 01 — Food & Grocery Essentials (GRM-PL-B01 · 50 Discovery Candidates) */}
      {libraryTab === 'batch01' && (
        <div className="space-y-5">
          {/* Batch Identity & Discovery Boundary */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                  <span className="font-mono font-semibold text-teal-800">GRM-PL-B01</span>
                  <span aria-hidden="true">·</span>
                  <span>Parent Project: GRM-PL-001</span>
                  <span aria-hidden="true">·</span>
                  <span>Application: GRAMOS MART</span>
                </div>
                <h3 className="mt-1 font-display text-lg font-bold text-slate-900">
                  Batch 01 — Food &amp; Grocery Essentials (50 Discovery Candidates)
                </h3>
                <p className="mt-1 text-xs text-slate-600 max-w-3xl">
                  Everyday food and grocery candidates for supplier discovery, sample procurement,
                  personal testing and eventual commercial approval across retail, private labelling,
                  contract manufacturing and wholesale distribution.
                </p>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50/70 px-3.5 py-2.5 text-xs text-amber-900 max-w-sm">
                <span className="font-bold">Discovery Boundary:</span> All 50 products below are
                discovery candidates, not approved inventory.
              </div>
            </div>

            {/* Section 3: Initial Testing Priority (5 Candidates) */}
            <div className="border-t border-slate-100 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Initial Testing Priority (Recommended First 5 · GRAMOSFUEL Direction)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Testing priority only — not a claim that these candidates are commercially validated.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    selectBatch01PriorityFive();
                    setFeedback({
                      type: 'ok',
                      text: 'Selected the 5 initial GRAMOSFUEL priority testing candidates (41–45). Click "Prepare research cards" to generate Level 1 cards.',
                    });
                  }}
                  className="rounded-lg border border-teal-700 bg-white px-3 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-50 cursor-pointer whitespace-nowrap"
                >
                  Select Priority 5
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
                {batch01Candidates
                  .filter((c) => c.isTestingPriority)
                  .map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleBatch01Candidate(p.id)}
                      className={`rounded-lg border p-2.5 text-left transition-colors cursor-pointer ${
                        p.selected
                          ? 'border-teal-600 bg-teal-50/50'
                          : 'border-slate-200 bg-slate-50/60 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-slate-500">
                        <span>{String(p.itemNo).padStart(2, '0')}. {p.researchId}</span>
                        {p.selected ? (
                          <CheckSquare className="h-3.5 w-3.5 text-teal-700 shrink-0" />
                        ) : (
                          <Square className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        )}
                      </div>
                      <div className="mt-1 text-xs font-bold text-slate-900">{p.name}</div>
                    </button>
                  ))}
              </div>
            </div>

            {/* Section 4: Registration ID Index */}
            <div className="border-t border-slate-100 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <h4 className="text-xs font-bold text-slate-900">
                  Product Library Registration Groups (Research IDs 001–050)
                </h4>
                <span className="text-[11px] text-slate-500">
                  Distinct pack sizes or variants receive separate SKU identifiers.
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 text-xs">
                {batch01Groups.map((g) => (
                  <button
                    key={g.group}
                    type="button"
                    onClick={() =>
                      setBatch01CatFilter(batch01CatFilter === g.group ? 'All' : g.group)
                    }
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors cursor-pointer ${
                      batch01CatFilter === g.group
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-slate-50/70 text-slate-800 hover:bg-white'
                    }`}
                  >
                    <span className="font-semibold truncate">{g.shortTitle}</span>
                    <span
                      className={`font-mono text-[11px] shrink-0 ml-2 ${
                        batch01CatFilter === g.group ? 'text-slate-200' : 'text-slate-500'
                      }`}
                    >
                      {g.range}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 5: Batch 01 Decision Tracker */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">
                    Batch 01 Decision Tracker — Product Shortlist
                  </h4>
                  <span className="font-mono text-xs font-bold tabular-nums text-teal-800">
                    {batch01SelectedCount} / 50 selected
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select the products you want to investigate first. Selection does not mean tested or
                  approved.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={batch01Search}
                    onChange={(e) => setBatch01Search(e.target.value)}
                    placeholder="Filter 50 items..."
                    className="w-44 rounded-lg border border-slate-300 pl-8 pr-2.5 py-1.5 text-xs focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => selectAllBatch01Candidates(true)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={() => selectAllBatch01Candidates(false)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={handlePrepareBatch01Cards}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 cursor-pointer whitespace-nowrap"
                >
                  <span>Prepare research cards for selected products</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Category Groups A–F */}
            <div className="space-y-6">
              {batch01Groups
                .filter((g) => batch01CatFilter === 'All' || batch01CatFilter === g.group)
                .map((grp) => {
                  const q = batch01Search.trim().toLowerCase();
                  const items = batch01Candidates.filter((c) => {
                    if (c.categoryGroup !== grp.group) return false;
                    if (q) {
                      return `${c.itemNo} ${c.researchId} ${c.name} ${c.subtitle}`
                        .toLowerCase()
                        .includes(q);
                    }
                    return true;
                  });
                  if (items.length === 0) return null;

                  return (
                    <div key={grp.group} className="space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h5 className="text-xs font-bold text-slate-900">{grp.group}</h5>
                        <span className="font-mono text-[11px] text-slate-500">{grp.range}</span>
                      </div>

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        {items.map((item) => {
                          const linkedCard =
                            (item.preparedLibraryId &&
                              records.find((r) => r.id === item.preparedLibraryId)) ||
                            records.find((r) => r.libraryCode === item.researchId);

                          return (
                            <div
                              key={item.id}
                              className={`rounded-lg border p-3 transition-colors flex flex-col justify-between gap-2 ${
                                item.selected
                                  ? 'border-teal-600 bg-teal-50/40'
                                  : 'border-slate-200 bg-white hover:border-slate-300'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => toggleBatch01Candidate(item.id)}
                                className="w-full text-left space-y-1 cursor-pointer"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-mono text-[11px] font-semibold text-slate-500 tabular-nums">
                                    {String(item.itemNo).padStart(2, '0')}. · {item.researchId}
                                  </span>
                                  {item.selected ? (
                                    <CheckSquare className="h-4 w-4 text-teal-700 shrink-0" />
                                  ) : (
                                    <Square className="h-4 w-4 text-slate-300 shrink-0" />
                                  )}
                                </div>
                                <div className="text-xs font-bold text-slate-900">
                                  {item.name}
                                </div>
                                <div className="text-[11px] text-slate-600">{item.subtitle}</div>
                              </button>

                              <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-100 text-[11px]">
                                <span className="text-slate-500 truncate">
                                  {item.isTestingPriority ? 'Testing priority' : item.brandTrack}
                                </span>
                                {linkedCard ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      selectRecord(linkedCard);
                                      setLibraryTab('research');
                                    }}
                                    className="font-semibold text-teal-700 hover:underline cursor-pointer shrink-0"
                                  >
                                    Open Card →
                                  </button>
                                ) : (
                                  <span className="text-slate-400 shrink-0">Discovery</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 1C: Batch 02 — Traditional Snacks, Namkeen, Sweets & Regional Food Products (GRM-PL-B02) */}
      {libraryTab === 'batch02' && (
        <div className="space-y-5">
          {/* Batch Identity, Status & Discovery Boundary */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                  <span className="font-mono font-semibold text-teal-800">GRM-PL-B02</span>
                  <span aria-hidden="true">·</span>
                  <span>Project: GRM-PL-001</span>
                  <span aria-hidden="true">·</span>
                  <span>GRAMOS MART Sourcing &amp; GRAMOSFUEL Private-Label Research</span>
                </div>
                <h3 className="mt-1 font-display text-lg font-bold text-slate-900">
                  Batch 02 — Traditional Snacks, Namkeen, Sweets &amp; Regional Food Products
                </h3>
                <p className="mt-1 text-xs text-slate-600 max-w-3xl">
                  Dedicated 50-item regional snacks, namkeen, sweets, dry snacks and ready-to-cook
                  discovery catalogue organised for personal sample testing, regional vendor
                  evaluation and eventual GRAMOSFUEL brand opportunities.
                </p>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50/70 px-3.5 py-2.5 text-xs text-amber-900 max-w-sm">
                <span className="font-bold">Discovery Boundary:</span> Research catalogue only.
                None of the 50 candidates are tested or approved inventory until verified.
              </div>
            </div>

            {/* Batch 02 Live Status Strip */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 border-t border-slate-100 pt-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Status · Candidates Listed
                </div>
                <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-slate-900">
                  {batch02Stats.listed}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500">GRM-PL-B02-001 to 050</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Confirmed Tested
                </div>
                <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-amber-800">
                  {batch02Stats.confirmedTested}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500">Physical test + evidence logged</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Confirmed Approved
                </div>
                <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-emerald-800">
                  {batch02Stats.confirmedApproved}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500">Passed safety &amp; FSSAI gate</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Product Library Scale
                </div>
                <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-teal-800">
                  200+
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500">Across four 50-item batches</div>
              </div>
            </div>

            {/* 4 Regional Product Opportunities Spotlight */}
            <div className="border-t border-slate-100 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Regional Product Opportunities (Hadoti &amp; Rajasthan Spotlight)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Four distinct regional sourcing formats — click any opportunity to select or unselect it in the tracker.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                {batch02RegionalSpotlights.map((spot) => {
                  const candidate = batch02Candidates.find((c) => c.id === spot.candidateId);
                  const isSelected = Boolean(candidate?.selected);
                  return (
                    <button
                      key={spot.candidateId}
                      type="button"
                      onClick={() => toggleBatch02Candidate(spot.candidateId)}
                      className={`rounded-lg border p-3 text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50/50'
                          : 'border-slate-200 bg-slate-50/60 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-slate-500">
                        <span>{spot.code}</span>
                        {isSelected ? (
                          <CheckSquare className="h-3.5 w-3.5 text-teal-700 shrink-0" />
                        ) : (
                          <Square className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        )}
                      </div>
                      <div className="mt-1 text-xs font-bold text-slate-900">{spot.title}</div>
                      <div className="mt-0.5 text-[11px] font-medium text-teal-800">
                        {spot.sourcingNote}
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500">{spot.supplyNote}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 10 Initial Sample-Testing Priorities */}
            <div className="border-t border-slate-100 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Initial Sample-Testing Priorities (First 10 Candidates)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Suggested research priorities for initial sample evaluation — not confirmed sales performers.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    selectBatch02PriorityTen();
                    setFeedback({
                      type: 'ok',
                      text: 'Selected the 10 initial sample-testing priority candidates in Batch 02. Click "Prepare research cards" to create Level 1 cards.',
                    });
                  }}
                  className="rounded-lg border border-teal-700 bg-white px-3 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-50 cursor-pointer whitespace-nowrap"
                >
                  Select Priority 10
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
                {batch02Candidates
                  .filter((c) => c.isTestingPriority)
                  .map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleBatch02Candidate(p.id)}
                      className={`rounded-lg border p-2.5 text-left transition-colors cursor-pointer ${
                        p.selected
                          ? 'border-teal-600 bg-teal-50/50'
                          : 'border-slate-200 bg-slate-50/60 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-slate-500">
                        <span>{String(p.itemNo).padStart(2, '0')}. {p.researchId}</span>
                        {p.selected ? (
                          <CheckSquare className="h-3.5 w-3.5 text-teal-700 shrink-0" />
                        ) : (
                          <Square className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        )}
                      </div>
                      <div className="mt-1 text-xs font-bold text-slate-900">{p.name}</div>
                      {p.requiresFreshOrColdSupply && (
                        <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800">
                          <Snowflake className="h-3 w-3 shrink-0" />
                          <span>Fresh / cold check</span>
                        </div>
                      )}
                    </button>
                  ))}
              </div>
            </div>

            {/* 8 Mandatory Product Testing & Sourcing Requirements + Fresh/Cold Handling Alert */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-xs font-bold text-slate-900">
                  Mandatory Product Testing &amp; Sourcing Verification (8 Requirements)
                </h4>
                <span className="text-[11px] text-slate-500">
                  Required before moving any Batch 02 SKU to Level 3 Approved Commercial Catalogue
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 text-xs">
                {batch02TestingRequirements.map((req) => (
                  <div
                    key={req}
                    className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-slate-700"
                  >
                    {req}
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-2.5 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-950">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
                <div>
                  <span className="font-bold">Special Cold / Fresh Supply Warning: </span>
                  Kachori, kalakand and ghevar may require fresh or temperature-controlled supply. Do
                  not treat them like ordinary shelf-stable namkeen.
                </div>
              </div>
            </div>

            {/* Category Index (1–5) */}
            <div className="border-t border-slate-100 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <h4 className="text-xs font-bold text-slate-900">
                  Batch 02 Categories (Research IDs GRM-PL-B02-001 to 050)
                </h4>
                {batch02CatFilter !== 'All' && (
                  <button
                    type="button"
                    onClick={() => setBatch02CatFilter('All')}
                    className="text-xs font-semibold text-teal-700 hover:underline cursor-pointer"
                  >
                    Show All 5 Categories
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5 text-xs">
                {batch02Groups.map((g) => (
                  <button
                    key={g.group}
                    type="button"
                    onClick={() =>
                      setBatch02CatFilter(batch02CatFilter === g.group ? 'All' : g.group)
                    }
                    className={`flex flex-col justify-between rounded-lg border px-3 py-2 text-left transition-colors cursor-pointer ${
                      batch02CatFilter === g.group
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-slate-50/70 text-slate-800 hover:bg-white'
                    }`}
                  >
                    <span className="font-semibold">{g.shortTitle}</span>
                    <span
                      className={`mt-1 font-mono text-[10px] ${
                        batch02CatFilter === g.group ? 'text-slate-200' : 'text-slate-500'
                      }`}
                    >
                      {g.range}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive 50-Item Batch 02 Decision Tracker */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">
                    Batch 02 Decision Tracker — 50 Discovery Candidates
                  </h4>
                  <span className="font-mono text-xs font-bold tabular-nums text-teal-800">
                    {batch02SelectedCount} / 50 selected
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select products for supplier sourcing &amp; sample requests. Selection does not mean tested or approved.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={batch02Search}
                    onChange={(e) => setBatch02Search(e.target.value)}
                    placeholder="Filter 50 items..."
                    className="w-44 rounded-lg border border-slate-300 pl-8 pr-2.5 py-1.5 text-xs focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => selectAllBatch02Candidates(true)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={() => selectAllBatch02Candidates(false)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={handlePrepareBatch02Cards}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 cursor-pointer whitespace-nowrap"
                >
                  <span>Prepare research cards for selected products</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Category Groups 1–5 */}
            <div className="space-y-6">
              {batch02Groups
                .filter((g) => batch02CatFilter === 'All' || batch02CatFilter === g.group)
                .map((grp) => {
                  const q = batch02Search.trim().toLowerCase();
                  const items = batch02Candidates.filter((c) => {
                    if (c.categoryGroup !== grp.group) return false;
                    if (q) {
                      return `${c.itemNo} ${c.researchId} ${c.name} ${c.subtitle} ${c.specialHandlingNote}`
                        .toLowerCase()
                        .includes(q);
                    }
                    return true;
                  });
                  if (items.length === 0) return null;

                  return (
                    <div key={grp.group} className="space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h5 className="text-xs font-bold text-slate-900">{grp.group}</h5>
                        <span className="font-mono text-[11px] text-slate-500">{grp.range}</span>
                      </div>

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        {items.map((item) => {
                          const linkedCard =
                            (item.preparedLibraryId &&
                              records.find((r) => r.id === item.preparedLibraryId)) ||
                            records.find((r) => r.libraryCode === item.researchId);

                          return (
                            <div
                              key={item.id}
                              className={`rounded-lg border p-3 transition-colors flex flex-col justify-between gap-2 ${
                                item.selected
                                  ? 'border-teal-600 bg-teal-50/40'
                                  : 'border-slate-200 bg-white hover:border-slate-300'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => toggleBatch02Candidate(item.id)}
                                className="w-full text-left space-y-1 cursor-pointer"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-mono text-[11px] font-semibold text-slate-500 tabular-nums">
                                    {String(item.itemNo).padStart(2, '0')}. · {item.researchId}
                                  </span>
                                  {item.selected ? (
                                    <CheckSquare className="h-4 w-4 text-teal-700 shrink-0" />
                                  ) : (
                                    <Square className="h-4 w-4 text-slate-300 shrink-0" />
                                  )}
                                </div>
                                <div className="text-xs font-bold text-slate-900">
                                  {item.name}
                                </div>
                                <div className="text-[11px] text-slate-600">{item.subtitle}</div>
                                {item.requiresFreshOrColdSupply && (
                                  <div className="pt-0.5 flex items-center gap-1 text-[10px] font-semibold text-amber-800">
                                    <Snowflake className="h-3 w-3 shrink-0" />
                                    <span>Fresh / cold-supply check</span>
                                  </div>
                                )}
                              </button>

                              <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-100 text-[11px]">
                                <span className="text-slate-500 truncate">
                                  {item.isTestingPriority ? 'Sample priority' : item.brandTrack}
                                </span>
                                {linkedCard ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      selectRecord(linkedCard);
                                      setLibraryTab('research');
                                    }}
                                    className="font-semibold text-teal-700 hover:underline cursor-pointer shrink-0"
                                  >
                                    Open Card →
                                  </button>
                                ) : (
                                  <span className="text-slate-400 shrink-0">Discovery</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 1D: Batch 03 — Beverages, Traditional Drinks, Juices, Drink Mixes & Concentrates (GRM-PL-B03) */}
      {libraryTab === 'batch03' && (
        <div className="space-y-5">
          {/* Batch Identity, Status & Cumulative 3-Batch Counter */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                  <span className="font-mono font-semibold text-teal-800">GRM-PL-B03</span>
                  <span aria-hidden="true">·</span>
                  <span>Project: GRM-PL-001</span>
                  <span aria-hidden="true">·</span>
                  <span>Beverages, Traditional Drinks, Juices, Drink Mixes &amp; Concentrates</span>
                </div>
                <h3 className="mt-1 font-display text-lg font-bold text-slate-900">
                  Batch 03 — Beverages, Traditional Drinks, Juices &amp; Concentrates
                </h3>
                <p className="mt-1 text-xs text-slate-600 max-w-3xl">
                  Expands GRAMOS MART into packaged beverages, traditional Indian drinks, instant
                  drink mixes and beverage concentrates while creating private-label opportunities
                  for GRAMOSFUEL.
                </p>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50/70 px-3.5 py-2.5 text-xs text-amber-900 max-w-sm">
                <span className="font-bold">Discovery Boundary:</span> {batch03Stats.listed}{' '}
                discovered candidates · {batch03Stats.confirmedTested} confirmed tested ·{' '}
                {batch03Stats.confirmedApproved} confirmed commercially approved.
              </div>
            </div>

            {/* Library Status & Cumulative Three-Batch Strip */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 border-t border-slate-100 pt-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Batch 03 · Research Candidates
                </div>
                <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-slate-900">
                  {batch03Stats.listed}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500">GRM-PL-B03-001 to 050</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Confirmed Tested
                </div>
                <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-amber-800">
                  {batch03Stats.confirmedTested}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500">Sample &amp; micro/shelf checks logged</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Confirmed Commercially Approved
                </div>
                <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-emerald-800">
                  {batch03Stats.confirmedApproved}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500">Passed FSSAI &amp; claims gate</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Cumulative Library (B01–B03)
                </div>
                <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-teal-800">
                  {batch03Stats.cumulativeTotal}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500">
                  B01: {batch01Candidates.length} · B02: {batch02Candidates.length} · B03:{' '}
                  {batch03Candidates.length}
                </div>
              </div>
            </div>

            {/* 4 GRAMOSFUEL Opportunities */}
            <div className="border-t border-slate-100 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    GRAMOSFUEL Opportunities (Drink Mixes, Concentrates &amp; Grain Beverages)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Click any GRAMOSFUEL beverage opportunity to select or unselect it in the Batch 03 tracker.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                {batch03GramosfuelOpportunities.map((opp) => {
                  const candidate = batch03Candidates.find((c) => c.id === opp.candidateId);
                  const isSelected = Boolean(candidate?.selected);
                  return (
                    <button
                      key={opp.candidateId}
                      type="button"
                      onClick={() => toggleBatch03Candidate(opp.candidateId)}
                      className={`rounded-lg border p-3 text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50/50'
                          : 'border-slate-200 bg-slate-50/60 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-slate-500">
                        <span>{opp.code}</span>
                        {isSelected ? (
                          <CheckSquare className="h-3.5 w-3.5 text-teal-700 shrink-0" />
                        ) : (
                          <Square className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        )}
                      </div>
                      <div className="mt-1 text-xs font-bold text-slate-900">{opp.title}</div>
                      <div className="mt-0.5 text-[11px] font-medium text-teal-800">
                        {opp.formatLabel}
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500">
                        Catalogue ID: {opp.mappedName}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 8 Initial Research Priorities */}
            <div className="border-t border-slate-100 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Initial Research Priorities (8 Candidates for Sample Sourcing)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    These are candidates for sample sourcing, not approved products.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    selectBatch03PriorityEight();
                    setFeedback({
                      type: 'ok',
                      text: 'Selected the 8 initial sample-sourcing priority candidates in Batch 03. Click "Prepare research cards" to create Level 1 cards.',
                    });
                  }}
                  className="rounded-lg border border-teal-700 bg-white px-3 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-50 cursor-pointer whitespace-nowrap"
                >
                  Select Priority 8
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {batch03Candidates
                  .filter((c) => c.isTestingPriority)
                  .map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleBatch03Candidate(p.id)}
                      className={`rounded-lg border p-2.5 text-left transition-colors cursor-pointer ${
                        p.selected
                          ? 'border-teal-600 bg-teal-50/50'
                          : 'border-slate-200 bg-slate-50/60 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-slate-500">
                        <span>{String(p.itemNo).padStart(2, '0')}. {p.researchId}</span>
                        {p.selected ? (
                          <CheckSquare className="h-3.5 w-3.5 text-teal-700 shrink-0" />
                        ) : (
                          <Square className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        )}
                      </div>
                      <div className="mt-1 text-xs font-bold text-slate-900">{p.name}</div>
                      {p.handlingAndClaimsFlag === 'cold-chain-expiry' && (
                        <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800">
                          <Snowflake className="h-3 w-3 shrink-0" />
                          <span>Cold-chain &amp; expiry check</span>
                        </div>
                      )}
                    </button>
                  ))}
              </div>
            </div>

            {/* Important Checks Before Approval + Cold-Chain & Regulatory Claims Warnings */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-xs font-bold text-slate-900">
                  Important Checks Before Approval (8 Mandatory Verification Points)
                </h4>
                <span className="text-[11px] text-slate-500">
                  Must be verified prior to moving any Batch 03 beverage to Level 3 Commercial Catalogue
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 text-xs">
                {batch03ApprovalChecks.map((chk) => (
                  <div
                    key={chk}
                    className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-slate-700"
                  >
                    {chk}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <div className="flex items-start gap-2.5 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-950">
                  <Snowflake className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
                  <div>
                    <span className="font-bold">Cold-Chain &amp; Expiry Warning: </span>
                    Dairy and fresh juices need particular attention to cold-chain and expiry
                    management.
                  </div>
                </div>
                <div className="flex items-start gap-2.5 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-950">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
                  <div>
                    <span className="font-bold">Regulatory &amp; Claims Warning: </span>
                    Energy and electrolyte products require careful regulatory and claims review.
                  </div>
                </div>
              </div>
            </div>

            {/* Category Index (1–5) */}
            <div className="border-t border-slate-100 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <h4 className="text-xs font-bold text-slate-900">
                  Batch 03 Categories (Research IDs GRM-PL-B03-001 to 050)
                </h4>
                {batch03CatFilter !== 'All' && (
                  <button
                    type="button"
                    onClick={() => setBatch03CatFilter('All')}
                    className="text-xs font-semibold text-teal-700 hover:underline cursor-pointer"
                  >
                    Show All 5 Categories
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5 text-xs">
                {batch03Groups.map((g) => (
                  <button
                    key={g.group}
                    type="button"
                    onClick={() =>
                      setBatch03CatFilter(batch03CatFilter === g.group ? 'All' : g.group)
                    }
                    className={`flex flex-col justify-between rounded-lg border px-3 py-2 text-left transition-colors cursor-pointer ${
                      batch03CatFilter === g.group
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-slate-50/70 text-slate-800 hover:bg-white'
                    }`}
                  >
                    <span className="font-semibold">{g.shortTitle}</span>
                    <span
                      className={`mt-1 font-mono text-[10px] ${
                        batch03CatFilter === g.group ? 'text-slate-200' : 'text-slate-500'
                      }`}
                    >
                      {g.range}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive 50-Item Batch 03 Decision Tracker */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">
                    Batch 03 Decision Tracker — 50 Beverage Discovery Candidates
                  </h4>
                  <span className="font-mono text-xs font-bold tabular-nums text-teal-800">
                    {batch03SelectedCount} / 50 selected
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select beverage candidates for sample sourcing &amp; supplier discovery. Selection does not mean tested or approved.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={batch03Search}
                    onChange={(e) => setBatch03Search(e.target.value)}
                    placeholder="Filter 50 items..."
                    className="w-44 rounded-lg border border-slate-300 pl-8 pr-2.5 py-1.5 text-xs focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => selectAllBatch03Candidates(true)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={() => selectAllBatch03Candidates(false)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={handlePrepareBatch03Cards}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 cursor-pointer whitespace-nowrap"
                >
                  <span>Prepare research cards for selected products</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Category Groups 1–5 */}
            <div className="space-y-6">
              {batch03Groups
                .filter((g) => batch03CatFilter === 'All' || batch03CatFilter === g.group)
                .map((grp) => {
                  const q = batch03Search.trim().toLowerCase();
                  const items = batch03Candidates.filter((c) => {
                    if (c.categoryGroup !== grp.group) return false;
                    if (q) {
                      return `${c.itemNo} ${c.researchId} ${c.name} ${c.subtitle} ${c.specialHandlingNote}`
                        .toLowerCase()
                        .includes(q);
                    }
                    return true;
                  });
                  if (items.length === 0) return null;

                  return (
                    <div key={grp.group} className="space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h5 className="text-xs font-bold text-slate-900">{grp.group}</h5>
                        <span className="font-mono text-[11px] text-slate-500">{grp.range}</span>
                      </div>

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        {items.map((item) => {
                          const linkedCard =
                            (item.preparedLibraryId &&
                              records.find((r) => r.id === item.preparedLibraryId)) ||
                            records.find((r) => r.libraryCode === item.researchId);

                          return (
                            <div
                              key={item.id}
                              className={`rounded-lg border p-3 transition-colors flex flex-col justify-between gap-2 ${
                                item.selected
                                  ? 'border-teal-600 bg-teal-50/40'
                                  : 'border-slate-200 bg-white hover:border-slate-300'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => toggleBatch03Candidate(item.id)}
                                className="w-full text-left space-y-1 cursor-pointer"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-mono text-[11px] font-semibold text-slate-500 tabular-nums">
                                    {String(item.itemNo).padStart(2, '0')}. · {item.researchId}
                                  </span>
                                  {item.selected ? (
                                    <CheckSquare className="h-4 w-4 text-teal-700 shrink-0" />
                                  ) : (
                                    <Square className="h-4 w-4 text-slate-300 shrink-0" />
                                  )}
                                </div>
                                <div className="text-xs font-bold text-slate-900">
                                  {item.name}
                                </div>
                                <div className="text-[11px] text-slate-600">{item.subtitle}</div>
                                {item.handlingAndClaimsFlag === 'cold-chain-expiry' && (
                                  <div className="pt-0.5 flex items-center gap-1 text-[10px] font-semibold text-amber-800">
                                    <Snowflake className="h-3 w-3 shrink-0" />
                                    <span>Cold-chain &amp; expiry check</span>
                                  </div>
                                )}
                                {item.handlingAndClaimsFlag === 'claims-regulatory' && (
                                  <div className="pt-0.5 flex items-center gap-1 text-[10px] font-semibold text-amber-800">
                                    <ShieldAlert className="h-3 w-3 shrink-0" />
                                    <span>Regulatory &amp; claims review</span>
                                  </div>
                                )}
                              </button>

                              <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-100 text-[11px]">
                                <span className="text-slate-500 truncate">
                                  {item.isTestingPriority ? 'Sample priority' : item.brandTrack}
                                </span>
                                {linkedCard ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      selectRecord(linkedCard);
                                      setLibraryTab('research');
                                    }}
                                    className="font-semibold text-teal-700 hover:underline cursor-pointer shrink-0"
                                  >
                                    Open Card →
                                  </button>
                                ) : (
                                  <span className="text-slate-400 shrink-0">Discovery</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 1E: Batch 04 — Personal Care, Beauty, Hygiene & Daily-use Products (GRM-PL-B04) */}
      {libraryTab === 'batch04' && (
        <div className="space-y-5">
          {/* Batch Identity, Status & 200-Item Cumulative Library Progress */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                  <span className="font-mono font-semibold text-teal-800">GRM-PL-B04</span>
                  <span aria-hidden="true">·</span>
                  <span>Project: GRM-PL-001</span>
                  <span aria-hidden="true">·</span>
                  <span>Personal Care, Beauty, Hygiene &amp; Daily-use Products</span>
                </div>
                <h3 className="mt-1 font-display text-lg font-bold text-slate-900">
                  Batch 04 — Personal Care, Beauty, Hygiene &amp; Daily-use Products
                </h3>
                <p className="mt-1 text-xs text-slate-600 max-w-3xl">
                  Expands GRAMOS MART into personal-care essentials, grooming, skincare, haircare,
                  beauty and hygiene products with Zone E non-food separation and private-label
                  evaluation.
                </p>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50/70 px-3.5 py-2.5 text-xs text-amber-900 max-w-sm">
                <span className="font-bold">Library Status:</span> {batch04Stats.listed} research
                candidates created · {batch04Stats.confirmedTested} confirmed tested ·{' '}
                {batch04Stats.confirmedApproved} confirmed approved.
              </div>
            </div>

            {/* KPI Strip + Cumulative Table + Next Batch Preview */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 border-t border-slate-100 pt-4">
              <div className="lg:col-span-5 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Batch 04 Candidates
                  </div>
                  <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-slate-900">
                    {batch04Stats.listed}
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-500">GRM-PL-B04-001 to 050</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Confirmed Tested
                  </div>
                  <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-amber-800">
                    {batch04Stats.confirmedTested}
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-500">Quality &amp; label logged</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Confirmed Approved
                  </div>
                  <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-emerald-800">
                    {batch04Stats.confirmedApproved}
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-500">Cosmetic/BIS gate passed</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Cumulative Total
                  </div>
                  <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-teal-800">
                    {batch04Stats.cumulativeTotal}
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-500">Batches 01–04 combined</div>
                </div>
              </div>

              <div className="lg:col-span-7 rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 flex flex-col justify-between gap-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        <th className="py-1.5 pr-3">Batch</th>
                        <th className="py-1.5 text-right">Candidates</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/70">
                      <tr>
                        <td className="py-1.5 pr-3 font-medium text-slate-800">B01 — Grocery</td>
                        <td className="py-1.5 text-right font-mono font-semibold tabular-nums text-slate-900">
                          {batch01Candidates.length}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 pr-3 font-medium text-slate-800">B02 — Snacks &amp; Sweets</td>
                        <td className="py-1.5 text-right font-mono font-semibold tabular-nums text-slate-900">
                          {batch02Candidates.length}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 pr-3 font-medium text-slate-800">B03 — Beverages</td>
                        <td className="py-1.5 text-right font-mono font-semibold tabular-nums text-slate-900">
                          {batch03Candidates.length}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 pr-3 font-medium text-slate-800">B04 — Personal Care</td>
                        <td className="py-1.5 text-right font-mono font-semibold tabular-nums text-slate-900">
                          {batch04Candidates.length}
                        </td>
                      </tr>
                      <tr className="font-bold text-teal-900">
                        <td className="pt-2 pr-3">Cumulative total</td>
                        <td className="pt-2 text-right font-mono tabular-nums">
                          {batch04Stats.cumulativeTotal}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="rounded border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-700">
                  <span className="font-bold text-slate-900">Next: Batch 05 — </span>
                  Home Care, Cleaning, Laundry, Kitchen Hygiene and Household Essentials. This will
                  build the household-consumables section of GRAMOS MART.
                </div>
              </div>
            </div>

            {/* 4 GRAMOSFUEL / Private-Label Opportunities */}
            <div className="border-t border-slate-100 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    GRAMOSFUEL / Private-Label Opportunities
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Contract manufacturing and white-label personal-care candidates — click to toggle selection in the tracker.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                {batch04PrivateLabelOpportunities.map((opp) => {
                  const candidate = batch04Candidates.find((c) => c.id === opp.candidateId);
                  const isSelected = Boolean(candidate?.selected);
                  return (
                    <button
                      key={opp.candidateId}
                      type="button"
                      onClick={() => toggleBatch04Candidate(opp.candidateId)}
                      className={`rounded-lg border p-3 text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50/50'
                          : 'border-slate-200 bg-slate-50/60 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-slate-500">
                        <span>{opp.code}</span>
                        {isSelected ? (
                          <CheckSquare className="h-3.5 w-3.5 text-teal-700 shrink-0" />
                        ) : (
                          <Square className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        )}
                      </div>
                      <div className="mt-1 text-xs font-bold text-slate-900">{opp.title}</div>
                      <div className="mt-0.5 text-[11px] font-medium text-teal-800">
                        {opp.opportunityType}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 8 Initial Research Priorities */}
            <div className="border-t border-slate-100 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Initial Research Priorities (First 8 Daily-Use Candidates)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    These are research priorities, not validated demand rankings.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    selectBatch04PriorityEight();
                    setFeedback({
                      type: 'ok',
                      text: 'Selected the 8 initial personal-care & hygiene research priorities in Batch 04. Click "Prepare research cards" to generate Level 1 cards.',
                    });
                  }}
                  className="rounded-lg border border-teal-700 bg-white px-3 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-50 cursor-pointer whitespace-nowrap"
                >
                  Select Priority 8
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {batch04Candidates
                  .filter((c) => c.isTestingPriority)
                  .map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleBatch04Candidate(p.id)}
                      className={`rounded-lg border p-2.5 text-left transition-colors cursor-pointer ${
                        p.selected
                          ? 'border-teal-600 bg-teal-50/50'
                          : 'border-slate-200 bg-slate-50/60 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-slate-500">
                        <span>{String(p.itemNo).padStart(2, '0')}. {p.researchId}</span>
                        {p.selected ? (
                          <CheckSquare className="h-3.5 w-3.5 text-teal-700 shrink-0" />
                        ) : (
                          <Square className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        )}
                      </div>
                      <div className="mt-1 text-xs font-bold text-slate-900">{p.name}</div>
                    </button>
                  ))}
              </div>
            </div>

            {/* 9 Approval Checks & Medical/Therapeutic Claims Warning */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-xs font-bold text-slate-900">
                  Personal Care &amp; Hygiene Approval Checks (9 Mandatory Requirements)
                </h4>
                <span className="text-[11px] text-slate-500">
                  Required before commercial approval &amp; Zone E shelf placement
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 text-xs">
                {batch04ApprovalChecks.map((chk) => (
                  <div
                    key={chk}
                    className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-slate-700"
                  >
                    {chk}
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-2.5 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-950">
                <ShieldAlert className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
                <div>
                  <span className="font-bold">Claims &amp; Regulatory Guardrail: </span>
                  Personal-care products should not be sold with unverified medical or therapeutic
                  claims. Verify manufacturer cosmetic/AYUSH licences, batch traceability and mfg/expiry
                  declarations before onboarding.
                </div>
              </div>
            </div>

            {/* Category Index (1–5) */}
            <div className="border-t border-slate-100 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <h4 className="text-xs font-bold text-slate-900">
                  Batch 04 Categories (Research IDs GRM-PL-B04-001 to 050)
                </h4>
                {batch04CatFilter !== 'All' && (
                  <button
                    type="button"
                    onClick={() => setBatch04CatFilter('All')}
                    className="text-xs font-semibold text-teal-700 hover:underline cursor-pointer"
                  >
                    Show All 5 Categories
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5 text-xs">
                {batch04Groups.map((g) => (
                  <button
                    key={g.group}
                    type="button"
                    onClick={() =>
                      setBatch04CatFilter(batch04CatFilter === g.group ? 'All' : g.group)
                    }
                    className={`flex flex-col justify-between rounded-lg border px-3 py-2 text-left transition-colors cursor-pointer ${
                      batch04CatFilter === g.group
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-slate-50/70 text-slate-800 hover:bg-white'
                    }`}
                  >
                    <span className="font-semibold">{g.shortTitle}</span>
                    <span
                      className={`mt-1 font-mono text-[10px] ${
                        batch04CatFilter === g.group ? 'text-slate-200' : 'text-slate-500'
                      }`}
                    >
                      {g.range}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive 50-Item Batch 04 Decision Tracker */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">
                    Batch 04 Decision Tracker — 50 Personal Care &amp; Hygiene Candidates
                  </h4>
                  <span className="font-mono text-xs font-bold tabular-nums text-teal-800">
                    {batch04SelectedCount} / 50 selected
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select products for manufacturer licence check &amp; sample sourcing. Selection does not mean tested or approved.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={batch04Search}
                    onChange={(e) => setBatch04Search(e.target.value)}
                    placeholder="Filter 50 items..."
                    className="w-44 rounded-lg border border-slate-300 pl-8 pr-2.5 py-1.5 text-xs focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => selectAllBatch04Candidates(true)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={() => selectAllBatch04Candidates(false)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={handlePrepareBatch04Cards}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 cursor-pointer whitespace-nowrap"
                >
                  <span>Prepare research cards for selected products</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Category Groups 1–5 */}
            <div className="space-y-6">
              {batch04Groups
                .filter((g) => batch04CatFilter === 'All' || batch04CatFilter === g.group)
                .map((grp) => {
                  const q = batch04Search.trim().toLowerCase();
                  const items = batch04Candidates.filter((c) => {
                    if (c.categoryGroup !== grp.group) return false;
                    if (q) {
                      return `${c.itemNo} ${c.researchId} ${c.name} ${c.subtitle} ${c.specialHandlingNote}`
                        .toLowerCase()
                        .includes(q);
                    }
                    return true;
                  });
                  if (items.length === 0) return null;

                  return (
                    <div key={grp.group} className="space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h5 className="text-xs font-bold text-slate-900">{grp.group}</h5>
                        <span className="font-mono text-[11px] text-slate-500">{grp.range}</span>
                      </div>

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        {items.map((item) => {
                          const linkedCard =
                            (item.preparedLibraryId &&
                              records.find((r) => r.id === item.preparedLibraryId)) ||
                            records.find((r) => r.libraryCode === item.researchId);

                          return (
                            <div
                              key={item.id}
                              className={`rounded-lg border p-3 transition-colors flex flex-col justify-between gap-2 ${
                                item.selected
                                  ? 'border-teal-600 bg-teal-50/40'
                                  : 'border-slate-200 bg-white hover:border-slate-300'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => toggleBatch04Candidate(item.id)}
                                className="w-full text-left space-y-1 cursor-pointer"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-mono text-[11px] font-semibold text-slate-500 tabular-nums">
                                    {String(item.itemNo).padStart(2, '0')}. · {item.researchId}
                                  </span>
                                  {item.selected ? (
                                    <CheckSquare className="h-4 w-4 text-teal-700 shrink-0" />
                                  ) : (
                                    <Square className="h-4 w-4 text-slate-300 shrink-0" />
                                  )}
                                </div>
                                <div className="text-xs font-bold text-slate-900">
                                  {item.name}
                                </div>
                                <div className="text-[11px] text-slate-600">{item.subtitle}</div>
                                {item.regulatoryFocus !== 'cosmetics-standard' && (
                                  <div className="pt-0.5 flex items-center gap-1 text-[10px] font-semibold text-amber-800">
                                    <ShieldAlert className="h-3 w-3 shrink-0" />
                                    <span>
                                      {item.regulatoryFocus === 'medical-device-hygiene'
                                        ? 'Hygiene / BIS / CDSCO check'
                                        : 'No unverified medical claims'}
                                    </span>
                                  </div>
                                )}
                              </button>

                              <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-100 text-[11px]">
                                <span className="text-slate-500 truncate">
                                  {item.isTestingPriority ? 'Research priority' : item.brandTrack}
                                </span>
                                {linkedCard ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      selectRecord(linkedCard);
                                      setLibraryTab('research');
                                    }}
                                    className="font-semibold text-teal-700 hover:underline cursor-pointer shrink-0"
                                  >
                                    Open Card →
                                  </button>
                                ) : (
                                  <span className="text-slate-400 shrink-0">Discovery</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 1F: Batch 05 — Home Care, Cleaning, Laundry, Kitchen Hygiene & Household Essentials (GRM-PL-B05) */}
      {libraryTab === 'batch05' && (
        <div className="space-y-5">
          {/* Batch Identity, Status & 250-Item Cumulative Library Progress */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                  <span className="font-mono font-semibold text-teal-800">GRM-PL-B05</span>
                  <span aria-hidden="true">·</span>
                  <span>Project: GRM-PL-001</span>
                  <span aria-hidden="true">·</span>
                  <span>Home Care, Cleaning, Laundry, Kitchen Hygiene &amp; Household Essentials</span>
                </div>
                <h3 className="mt-1 font-display text-lg font-bold text-slate-900">
                  Batch 05 — Home Care, Cleaning, Laundry, Kitchen Hygiene &amp; Household Essentials
                </h3>
                <p className="mt-1 text-xs text-slate-600 max-w-3xl">
                  Builds the household-consumables section of GRAMOS MART with regular repeat-purchase
                  essentials, GRAMOSFUEL private-label opportunities, Zone E physical non-food
                  separation, and CIBRC pest-control compliance checks.
                </p>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50/70 px-3.5 py-2.5 text-xs text-amber-900 max-w-sm">
                <span className="font-bold">Library Status:</span> {batch05Stats.listed} research
                candidates listed · {batch05Stats.confirmedTested} confirmed tested ·{' '}
                {batch05Stats.confirmedApproved} confirmed approved.
              </div>
            </div>

            {/* KPI Strip + Cumulative B01–B05 Table + Next Batch Preview */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 border-t border-slate-100 pt-4">
              <div className="lg:col-span-5 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Batch 05 Candidates
                  </div>
                  <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-slate-900">
                    {batch05Stats.listed}
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-500">GRM-PL-B05-001 to 050</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Confirmed Tested
                  </div>
                  <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-amber-800">
                    {batch05Stats.confirmedTested}
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-500">Leakage &amp; quality logged</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Confirmed Approved
                  </div>
                  <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-emerald-800">
                    {batch05Stats.confirmedApproved}
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-500">BIS/QCO &amp; CIBRC cleared</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Cumulative Total
                  </div>
                  <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-teal-800">
                    {batch05Stats.cumulativeTotal}
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-500">Batches 01–05 combined</div>
                </div>
              </div>

              <div className="lg:col-span-7 rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 flex flex-col justify-between gap-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        <th className="py-1.5 pr-3">Batch</th>
                        <th className="py-1.5 text-right">Candidates</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/70">
                      <tr>
                        <td className="py-1.5 pr-3 font-medium text-slate-800">B01 — Grocery</td>
                        <td className="py-1.5 text-right font-mono font-semibold tabular-nums text-slate-900">
                          {batch01Candidates.length}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 pr-3 font-medium text-slate-800">B02 — Snacks &amp; Sweets</td>
                        <td className="py-1.5 text-right font-mono font-semibold tabular-nums text-slate-900">
                          {batch02Candidates.length}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 pr-3 font-medium text-slate-800">B03 — Beverages</td>
                        <td className="py-1.5 text-right font-mono font-semibold tabular-nums text-slate-900">
                          {batch03Candidates.length}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 pr-3 font-medium text-slate-800">B04 — Personal Care</td>
                        <td className="py-1.5 text-right font-mono font-semibold tabular-nums text-slate-900">
                          {batch04Candidates.length}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 pr-3 font-medium text-slate-800">B05 — Home Care</td>
                        <td className="py-1.5 text-right font-mono font-semibold tabular-nums text-slate-900">
                          {batch05Candidates.length}
                        </td>
                      </tr>
                      <tr className="font-bold text-teal-900">
                        <td className="pt-2 pr-3">Cumulative total</td>
                        <td className="pt-2 text-right font-mono tabular-nums">
                          {batch05Stats.cumulativeTotal}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="rounded border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-700">
                  <span className="font-bold text-slate-900">Next Planned: Batch 06 — </span>
                  Kitchen &amp; Utility Essentials (steel lunch boxes, utensils &amp; airtight storage
                  jars for Kota households and hostel students).
                </div>
              </div>
            </div>

            {/* 4 GRAMOSFUEL Private-Label Opportunities */}
            <div className="border-t border-slate-100 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    GRAMOSFUEL Private-Label Opportunities
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    High-repeat household consumables identified for potential GRAMOSFUEL private-label
                    evaluation — click to toggle selection in the tracker.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                {batch05GramosfuelOpportunities.map((opp) => {
                  const candidate = batch05Candidates.find((c) => c.id === opp.candidateId);
                  const isSelected = Boolean(candidate?.selected);
                  return (
                    <button
                      key={opp.candidateId}
                      type="button"
                      onClick={() => toggleBatch05Candidate(opp.candidateId)}
                      className={`rounded-lg border p-3 text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50/50'
                          : 'border-slate-200 bg-slate-50/60 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-slate-500">
                        <span>{opp.code}</span>
                        {isSelected ? (
                          <CheckSquare className="h-3.5 w-3.5 text-teal-700 shrink-0" />
                        ) : (
                          <Square className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        )}
                      </div>
                      <div className="mt-1 text-xs font-bold text-slate-900">{opp.title}</div>
                      <div className="mt-0.5 text-[11px] font-medium text-teal-800">
                        {opp.formatDetail}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 10 Initial Sourcing Priorities */}
            <div className="border-t border-slate-100 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Initial Sourcing Priorities (First 10 Household Consumable Candidates)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    These are initial research priorities, not confirmed demand rankings.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    selectBatch05PriorityTen();
                    setFeedback({
                      type: 'ok',
                      text: 'Selected the 10 initial home-care sourcing priorities in Batch 05. Click "Prepare research cards" to generate Level 1 cards.',
                    });
                  }}
                  className="rounded-lg border border-teal-700 bg-white px-3 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-50 cursor-pointer whitespace-nowrap"
                >
                  Select Priority 10
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
                {batch05Candidates
                  .filter((c) => c.isTestingPriority)
                  .map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleBatch05Candidate(p.id)}
                      className={`rounded-lg border p-2.5 text-left transition-colors cursor-pointer ${
                        p.selected
                          ? 'border-teal-600 bg-teal-50/50'
                          : 'border-slate-200 bg-slate-50/60 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-slate-500">
                        <span>{String(p.itemNo).padStart(2, '0')}. {p.researchId}</span>
                        {p.selected ? (
                          <CheckSquare className="h-3.5 w-3.5 text-teal-700 shrink-0" />
                        ) : (
                          <Square className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        )}
                      </div>
                      <div className="mt-1 text-xs font-bold text-slate-900">{p.name}</div>
                    </button>
                  ))}
              </div>
            </div>

            {/* 9 Quality & Compliance Checks + CIBRC Pest-Control Scrutiny & Zone E Separation Warning */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-xs font-bold text-slate-900">
                  Home Care Quality &amp; Compliance Checks (9 Mandatory Checks)
                </h4>
                <span className="text-[11px] text-slate-500">
                  Required before commercial approval &amp; Zone E non-food stocking
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 text-xs">
                {batch05ComplianceChecks.map((chk) => (
                  <div
                    key={chk}
                    className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-slate-700"
                  >
                    {chk}
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-2.5 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-950">
                <ShieldAlert className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
                <div className="space-y-1">
                  <div>
                    <span className="font-bold">CIBRC &amp; Chemical Safety Guardrail: </span>
                    Pest-control products need particular regulatory scrutiny; verify applicable CIBRC
                    requirements before considering sale.
                  </div>
                  <div className="text-[11px] text-amber-900">
                    All Batch 05 cleaning chemicals, phenyls, drain/toilet cleaners and pest-control
                    items (043–047) must be physically separated in Zone E away from food, grain,
                    beverage and snack shelves with leak-proof packaging verified.
                  </div>
                </div>
              </div>
            </div>

            {/* Category Index (1–5) */}
            <div className="border-t border-slate-100 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <h4 className="text-xs font-bold text-slate-900">
                  Batch 05 Categories (Research IDs GRM-PL-B05-001 to 050)
                </h4>
                {batch05CatFilter !== 'All' && (
                  <button
                    type="button"
                    onClick={() => setBatch05CatFilter('All')}
                    className="text-xs font-semibold text-teal-700 hover:underline cursor-pointer"
                  >
                    Show All 5 Categories
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5 text-xs">
                {batch05Groups.map((g) => (
                  <button
                    key={g.group}
                    type="button"
                    onClick={() =>
                      setBatch05CatFilter(batch05CatFilter === g.group ? 'All' : g.group)
                    }
                    className={`flex flex-col justify-between rounded-lg border px-3 py-2 text-left transition-colors cursor-pointer ${
                      batch05CatFilter === g.group
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-slate-50/70 text-slate-800 hover:bg-white'
                    }`}
                  >
                    <span className="font-semibold">{g.shortTitle}</span>
                    <span
                      className={`mt-1 font-mono text-[10px] ${
                        batch05CatFilter === g.group ? 'text-slate-200' : 'text-slate-500'
                      }`}
                    >
                      {g.range}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive 50-Item Batch 05 Decision Tracker */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">
                    Batch 05 Decision Tracker — 50 Home Care &amp; Household Essentials
                  </h4>
                  <span className="font-mono text-xs font-bold tabular-nums text-teal-800">
                    {batch05SelectedCount} / 50 selected
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select products for supplier sourcing, BIS/QCO &amp; CIBRC checks. Selection does not mean tested or approved.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={batch05Search}
                    onChange={(e) => setBatch05Search(e.target.value)}
                    placeholder="Filter 50 items..."
                    className="w-44 rounded-lg border border-slate-300 pl-8 pr-2.5 py-1.5 text-xs focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => selectAllBatch05Candidates(true)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={() => selectAllBatch05Candidates(false)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={handlePrepareBatch05Cards}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 cursor-pointer whitespace-nowrap"
                >
                  <span>Prepare research cards for selected products</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Category Groups 1–5 */}
            <div className="space-y-6">
              {batch05Groups
                .filter((g) => batch05CatFilter === 'All' || batch05CatFilter === g.group)
                .map((grp) => {
                  const q = batch05Search.trim().toLowerCase();
                  const items = batch05Candidates.filter((c) => {
                    if (c.categoryGroup !== grp.group) return false;
                    if (q) {
                      return `${c.itemNo} ${c.researchId} ${c.name} ${c.subtitle} ${c.specialHandlingNote}`
                        .toLowerCase()
                        .includes(q);
                    }
                    return true;
                  });
                  if (items.length === 0) return null;

                  return (
                    <div key={grp.group} className="space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h5 className="text-xs font-bold text-slate-900">{grp.group}</h5>
                        <span className="font-mono text-[11px] text-slate-500">{grp.range}</span>
                      </div>

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        {items.map((item) => {
                          const linkedCard =
                            (item.preparedLibraryId &&
                              records.find((r) => r.id === item.preparedLibraryId)) ||
                            records.find((r) => r.libraryCode === item.researchId);

                          return (
                            <div
                              key={item.id}
                              className={`rounded-lg border p-3 transition-colors flex flex-col justify-between gap-2 ${
                                item.selected
                                  ? 'border-teal-600 bg-teal-50/40'
                                  : 'border-slate-200 bg-white hover:border-slate-300'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => toggleBatch05Candidate(item.id)}
                                className="w-full text-left space-y-1 cursor-pointer"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-mono text-[11px] font-semibold text-slate-500 tabular-nums">
                                    {String(item.itemNo).padStart(2, '0')}. · {item.researchId}
                                  </span>
                                  {item.selected ? (
                                    <CheckSquare className="h-4 w-4 text-teal-700 shrink-0" />
                                  ) : (
                                    <Square className="h-4 w-4 text-slate-300 shrink-0" />
                                  )}
                                </div>
                                <div className="text-xs font-bold text-slate-900">
                                  {item.name}
                                </div>
                                <div className="text-[11px] text-slate-600">{item.subtitle}</div>
                                {item.safetyRegulatoryFlag !== 'standard-cleaning' && (
                                  <div
                                    className={`pt-0.5 flex items-center gap-1 text-[10px] font-semibold ${
                                      item.safetyRegulatoryFlag === 'cibrc-pest-control'
                                        ? 'text-red-700'
                                        : 'text-amber-800'
                                    }`}
                                  >
                                    <ShieldAlert className="h-3 w-3 shrink-0" />
                                    <span>
                                      {item.safetyRegulatoryFlag === 'cibrc-pest-control'
                                        ? 'CIBRC pest-control scrutiny'
                                        : 'Zone E chemical separation'}
                                    </span>
                                  </div>
                                )}
                              </button>

                              <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-100 text-[11px]">
                                <span className="text-slate-500 truncate">
                                  {item.isTestingPriority ? 'Research priority' : item.brandTrack}
                                </span>
                                {linkedCard ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      selectRecord(linkedCard);
                                      setLibraryTab('research');
                                    }}
                                    className="font-semibold text-teal-700 hover:underline cursor-pointer shrink-0"
                                  >
                                    Open Card →
                                  </button>
                                ) : (
                                  <span className="text-slate-400 shrink-0">Discovery</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Research Cards & 8-Stage Pipeline */}
      {libraryTab === 'research' && selectedRecord && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Left Selector List */}
          <div className="lg:col-span-4 rounded-xl border border-slate-200 bg-white p-3 space-y-2 max-h-[820px] overflow-y-auto">
            <div className="px-1 pb-2 border-b border-slate-100">
              <div className="text-xs font-bold text-slate-900">
                Product Research Directory ({filteredRecords.length})
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter cards..."
                className="mt-2 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs focus:border-teal-600 focus:outline-none"
              />
            </div>

            {filteredRecords.map((r) => {
              const active = r.id === selectedRecord.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => selectRecord(r)}
                  className={`w-full rounded-lg border p-2.5 text-left transition-colors cursor-pointer ${
                    active
                      ? 'border-teal-600 bg-teal-50/50'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-semibold text-slate-700">
                      {r.libraryCode}
                    </span>
                    <span
                      className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${getStatusStyle(
                        r.status
                      )}`}
                    >
                      {r.status}
                    </span>
                  </div>
                  <div className="mt-1 text-xs font-bold text-slate-900 truncate">
                    {r.productName}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">{r.variantOrPackSize}</div>
                </button>
              );
            })}
          </div>

          {/* Right Detailed Research Card */}
          <div className="lg:col-span-8 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-5">
              {/* Top Title & Level */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                      {selectedRecord.libraryCode}
                    </span>
                    <span className="text-xs font-semibold text-slate-600">
                      {selectedRecord.batchCode}
                    </span>
                    <span
                      className={`rounded border px-2 py-0.5 text-[11px] font-semibold ${
                        getLevelShortBadge(getLibraryLevel(selectedRecord.status)).cls
                      }`}
                    >
                      {getLibraryLevel(selectedRecord.status)}
                    </span>
                  </div>
                  <h3 className="mt-2 font-display text-lg font-bold text-slate-900">
                    {selectedRecord.productName}
                  </h3>
                  <div className="text-xs font-medium text-slate-600">
                    Pack / Variant:{' '}
                    <span className="text-slate-900 font-semibold">
                      {selectedRecord.variantOrPackSize}
                    </span>{' '}
                    · {selectedRecord.industry} → {selectedRecord.category} →{' '}
                    {selectedRecord.subcategory}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <button
                    type="button"
                    onClick={() => setLibraryTab('scorecard')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 cursor-pointer"
                  >
                    <ClipboardCheck className="h-3.5 w-3.5 text-teal-700" />
                    <span>
                      Scorecard ({computeScoreSummary(selectedRecord.scorecard).total}/50)
                    </span>
                  </button>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={variantPackInput}
                      onChange={(e) => setVariantPackInput(e.target.value)}
                      placeholder="New variant (e.g. 1 kg Pack)"
                      className="w-40 rounded-lg border border-slate-300 px-2.5 py-1 text-[11px] focus:border-teal-600 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCreateVariantCard}
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                    >
                      + Variant ID
                    </button>
                  </div>
                </div>
              </div>

              {/* Rejected Permanent Institutional Record Alert */}
              {selectedRecord.status === 'Rejected' && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-900">
                  <div className="flex items-center gap-2 font-bold">
                    <XCircle className="h-4 w-4 text-red-700" />
                    <span>Rejected — Preserved in Library Memory</span>
                  </div>
                  <p className="mt-1">{selectedRecord.rejectionReason}</p>
                </div>
              )}

              {/* Standard Research Card Metadata */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 space-y-2 text-xs">
                  <div className="font-bold text-slate-900">Research & Market Fit</div>
                  <p className="text-slate-700">{selectedRecord.description}</p>
                  <div className="pt-1 border-t border-slate-200/70">
                    <span className="font-semibold text-slate-700">Market Relevance: </span>
                    <span className="text-slate-600">{selectedRecord.marketRelevance}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Brand Track: </span>
                    <span className="text-slate-900 font-medium">{selectedRecord.brandTrack}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Sourcing Options: </span>
                    <span className="text-slate-700">
                      {selectedRecord.sourcingOptions.join(' · ')}
                    </span>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 space-y-2 text-xs">
                  <div className="font-bold text-slate-900">Storage, Regulatory & Economics Guard</div>
                  <div>
                    <span className="font-semibold text-slate-700">Shelf Life & Storage: </span>
                    <span className="text-slate-700">{selectedRecord.shelfLifeAndStorage}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Regulatory Checks: </span>
                    <span className="text-slate-700">{selectedRecord.regulatoryRequirements}</span>
                  </div>
                  <div className="pt-1 border-t border-slate-200/70">
                    <span className="font-semibold text-slate-700">Unverified Est. Cost: </span>
                    <span className="font-mono text-slate-800">{selectedRecord.estimatedCostRange}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Target Selling Range: </span>
                    <span className="font-mono text-slate-800">
                      {selectedRecord.targetSellingPriceRange}
                    </span>
                  </div>
                </div>
              </div>

              {/* 8-Stage Workflow Stepper */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-900">
                  8-Stage Product Lifecycle (Approval Hard-Gated by Compliance & Verified Quote)
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {WORKFLOW_STAGES.map((st) => {
                    const active = selectedRecord.status === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleWorkflowTransition(st)}
                        className={`rounded-md border px-2.5 py-1.5 text-[11px] font-semibold transition-colors cursor-pointer ${
                          active
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Verified Supplier Quotation & Sample Testing Logger */}
              <div className="rounded-lg border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-900">
                    Verified Supplier Quotation & Testing Notes (Separate from Estimates)
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                      selectedRecord.actualQuotedLandedCost !== null
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {selectedRecord.actualQuotedLandedCost !== null
                      ? 'Verified Quote Logged'
                      : 'No Real Quote Logged Yet'}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="space-y-1 text-xs">
                    <span className="font-semibold text-slate-700">Linked Supplier</span>
                    <select
                      value={quoteSupplierId || selectedRecord.linkedSupplierId || ''}
                      onChange={(e) => setQuoteSupplierId(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs focus:border-teal-600 focus:outline-none"
                    >
                      <option value="">-- Select Registered Supplier --</option>
                      {state.suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.paymentTerms})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1 text-xs">
                    <span className="font-semibold text-slate-700">Actual Quoted Landed (₹)</span>
                    <input
                      type="number"
                      step="0.01"
                      value={quoteLandedCost}
                      onChange={(e) => setQuoteLandedCost(e.target.value)}
                      placeholder="Leave blank if unquoted"
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-mono focus:border-teal-600 focus:outline-none"
                    />
                  </label>
                  <label className="space-y-1 text-xs">
                    <span className="font-semibold text-slate-700">Proposed Selling Price (₹)</span>
                    <input
                      type="number"
                      step="0.01"
                      value={quoteSellPrice}
                      onChange={(e) => setQuoteSellPrice(e.target.value)}
                      placeholder="e.g., 125"
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-mono focus:border-teal-600 focus:outline-none"
                    />
                  </label>
                  <label className="space-y-1 text-xs">
                    <span className="font-semibold text-slate-700">MRP (₹)</span>
                    <input
                      type="number"
                      step="0.01"
                      value={quoteMrp}
                      onChange={(e) => setQuoteMrp(e.target.value)}
                      placeholder="e.g., 140"
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-mono focus:border-teal-600 focus:outline-none"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="space-y-1 text-xs">
                    <span className="font-semibold text-slate-700">Quotation / Invoice Reference</span>
                    <input
                      type="text"
                      value={quoteRef}
                      onChange={(e) => setQuoteRef(e.target.value)}
                      placeholder="e.g., Written Quote Ref #..."
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs focus:border-teal-600 focus:outline-none"
                    />
                  </label>
                  <label className="space-y-1 text-xs">
                    <span className="font-semibold text-slate-700">Sample Evaluation & Testing Notes</span>
                    <input
                      type="text"
                      value={testingNotes}
                      onChange={(e) => setTestingNotes(e.target.value)}
                      placeholder="Taste, packaging, shelf-life test results..."
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs focus:border-teal-600 focus:outline-none"
                    />
                  </label>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => sendLibraryToDakshMarket(selectedRecord.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 cursor-pointer"
                    >
                      <Network className="h-3.5 w-3.5 text-teal-700" />
                      <span>
                        {selectedRecord.linkedDakshReqCode
                          ? `DAKSH RFQ (${selectedRecord.linkedDakshReqCode})`
                          : 'Send to DAKSH MARKET RFQ'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => sendLibraryToGramosfuel(selectedRecord.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 cursor-pointer"
                    >
                      <FlaskConical className="h-3.5 w-3.5 text-teal-700" />
                      <span>
                        {selectedRecord.linkedGramosfuelCandidateId
                          ? 'Open in GRAMOSFUEL OS'
                          : 'Route to GRAMOSFUEL Brand OS'}
                      </span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveQuotationAndNotes}
                    className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 cursor-pointer"
                  >
                    Save Verified Quote & Notes
                  </button>
                </div>
              </div>

              {/* Level 3 Commercial Promotion OR Live Store Market Performance */}
              {linkedRetailProduct ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                      <Store className="h-4 w-4 text-emerald-700" />
                      <span>
                        Live Store & POS Market Performance · SKU {linkedRetailProduct.sku}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveNav('inventory')}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:underline cursor-pointer"
                    >
                      <span>View in Store Catalogue</span>
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
                    <div className="rounded bg-white border border-emerald-200 p-2.5">
                      <div className="text-[10px] uppercase text-slate-500">Store Zone & Tier</div>
                      <div className="mt-0.5 font-semibold text-slate-900">
                        {linkedRetailProduct.zone} · {linkedRetailProduct.ownershipType}
                      </div>
                    </div>
                    <div className="rounded bg-white border border-emerald-200 p-2.5">
                      <div className="text-[10px] uppercase text-slate-500">Live Stock On Hand</div>
                      <div className="mt-0.5 font-mono font-bold text-slate-900">
                        {linkedRetailProduct.stockQty} units
                      </div>
                    </div>
                    <div className="rounded bg-white border border-emerald-200 p-2.5">
                      <div className="text-[10px] uppercase text-slate-500">POS Units Sold</div>
                      <div className="mt-0.5 font-mono font-bold text-emerald-800">
                        {posPerformanceMap[linkedRetailProduct.id]?.unitsSold || 0} units
                      </div>
                    </div>
                    <div className="rounded bg-white border border-emerald-200 p-2.5">
                      <div className="text-[10px] uppercase text-slate-500">Net POS Revenue</div>
                      <div className="mt-0.5 font-mono font-bold text-emerald-800">
                        {formatINR(posPerformanceMap[linkedRetailProduct.id]?.revenue || 0)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handlePromoteToCatalogue}
                  className="rounded-lg border border-teal-200 bg-teal-50/30 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-teal-900">
                      <PackageCheck className="h-4 w-4 text-teal-700" />
                      <span>Promote Approved Product to Level 3 Commercial Catalogue & POS</span>
                    </div>
                    <span className="text-[11px] font-medium text-teal-800">
                      Requires Status: Approved
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 text-xs">
                    <label className="space-y-1">
                      <span className="font-semibold text-slate-700">Inventory Tier</span>
                      <select
                        value={promoteOwnership}
                        onChange={(e) => setPromoteOwnership(e.target.value as OwnershipType)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
                      >
                        <option value="Self-Funded">Self-Funded</option>
                        <option value="Supplier-Credit">Supplier-Credit</option>
                        <option value="Consignment">Consignment</option>
                      </select>
                    </label>
                    <label className="space-y-1">
                      <span className="font-semibold text-slate-700">Store Zone</span>
                      <select
                        value={promoteZone}
                        onChange={(e) => setPromoteZone(e.target.value as Product['zone'])}
                        className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
                      >
                        <option value="Zone B">Zone B (Staples)</option>
                        <option value="Zone C">Zone C (GRAMOSFUEL / Snacks)</option>
                        <option value="Zone D">Zone D (Hadoti / Gifts)</option>
                        <option value="Zone E">Zone E (Household Non-Food)</option>
                      </select>
                    </label>
                    <label className="space-y-1">
                      <span className="font-semibold text-slate-700">Initial Qty</span>
                      <input
                        type="number"
                        min="1"
                        value={promoteQty}
                        onChange={(e) => setPromoteQty(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-mono"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="font-semibold text-slate-700">GST %</span>
                      <select
                        value={promoteGst}
                        onChange={(e) => setPromoteGst(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-mono"
                      >
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                      </select>
                    </label>
                    <label className="space-y-1">
                      <span className="font-semibold text-slate-700">Batch No</span>
                      <input
                        type="text"
                        value={promoteBatchNo}
                        onChange={(e) => setPromoteBatchNo(e.target.value)}
                        placeholder="Auto"
                        className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-mono"
                      />
                    </label>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="flex items-center gap-2 text-xs text-slate-700">
                      <span className="font-semibold">Expiry Date (if perishable):</span>
                      <input
                        type="date"
                        value={promoteExpiry}
                        onChange={(e) => setPromoteExpiry(e.target.value)}
                        className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-mono"
                      />
                    </label>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-800 cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Launch to Active Store Inventory</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: 10-Parameter Scorecard & Hard Compliance Gate */}
      {libraryTab === 'scorecard' && selectedRecord && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <div className="text-xs font-mono font-bold text-teal-800">
                  {selectedRecord.libraryCode} · {selectedRecord.variantOrPackSize}
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  10-Parameter Product Evaluation Scorecard
                </h3>
              </div>
              <div className="text-right">
                <div className="font-mono text-2xl font-bold tabular-nums text-slate-900">
                  {computeScoreSummary(selectedRecord.scorecard).total}
                  <span className="text-sm font-normal text-slate-500"> / 50</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  {computeScoreSummary(selectedRecord.scorecard).scoredCount} of 10 parameters rated
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {SCORECARD_FIELDS.map((field) => {
                const val = selectedRecord.scorecard[field.key];
                return (
                  <div
                    key={field.key}
                    className="py-2.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-900">{field.label}</div>
                      <div className="text-[11px] text-slate-500">{field.hint}</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {[0, 1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() =>
                            updateLibraryScorecard(selectedRecord.id, { [field.key]: rating })
                          }
                          className={`h-7 min-w-[28px] rounded border px-1.5 font-mono text-xs font-semibold transition-colors cursor-pointer ${
                            val === rating
                              ? rating === 0
                                ? 'border-slate-700 bg-slate-700 text-white'
                                : 'border-teal-700 bg-teal-700 text-white'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {rating === 0 ? '—' : rating}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            {/* Switch active card */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
              <label className="text-xs font-bold text-slate-900 block">
                Select Product Candidate to Score / Gate
              </label>
              <select
                value={selectedRecord.id}
                onChange={(e) => {
                  const found = records.find((r) => r.id === e.target.value);
                  if (found) selectRecord(found);
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
              >
                {records.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.libraryCode} · {r.productName} ({r.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Hard Safety, Legal & Quality Gate */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Mandatory Safety, Legal & Quality Gate
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Rule 6 Hard Gate: A high 10-parameter score NEVER overrides failed safety,
                    legal/labelling, or quality verification.
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  {
                    key: 'testingEvidenceLogged',
                    label: '1. Physical Testing Evidence Logged',
                    checked: selectedRecord.testingEvidenceLogged,
                    toggle: () =>
                      updateLibraryQuotationAndTesting(selectedRecord.id, {
                        testingEvidenceLogged: !selectedRecord.testingEvidenceLogged,
                      }),
                  },
                  {
                    key: 'sampleTested',
                    label: '2. Sample Physically Evaluated (Performance / Taste / Packaging)',
                    checked: selectedRecord.complianceGate.sampleTested,
                    toggle: () =>
                      updateLibraryQuotationAndTesting(selectedRecord.id, {
                        complianceGate: { sampleTested: !selectedRecord.complianceGate.sampleTested },
                      }),
                  },
                  {
                    key: 'safetyCheckPassed',
                    label: '3. Consumer & Food/Chemical Safety Check Passed',
                    checked: selectedRecord.complianceGate.safetyCheckPassed,
                    toggle: () =>
                      updateLibraryQuotationAndTesting(selectedRecord.id, {
                        complianceGate: {
                          safetyCheckPassed: !selectedRecord.complianceGate.safetyCheckPassed,
                        },
                      }),
                  },
                  {
                    key: 'legalLabellingPassed',
                    label: '4. Regulatory, FSSAI / Licence & Legal Metrology Labelling Verified',
                    checked: selectedRecord.complianceGate.legalLabellingPassed,
                    toggle: () =>
                      updateLibraryQuotationAndTesting(selectedRecord.id, {
                        complianceGate: {
                          legalLabellingPassed: !selectedRecord.complianceGate.legalLabellingPassed,
                        },
                      }),
                  },
                  {
                    key: 'qualityTestPassed',
                    label: '5. Storage Stability & Quality Consistency Approved',
                    checked: selectedRecord.complianceGate.qualityTestPassed,
                    toggle: () =>
                      updateLibraryQuotationAndTesting(selectedRecord.id, {
                        complianceGate: {
                          qualityTestPassed: !selectedRecord.complianceGate.qualityTestPassed,
                        },
                      }),
                  },
                ].map((chk) => (
                  <label
                    key={chk.key}
                    className={`flex items-center gap-2.5 rounded-lg border p-2.5 cursor-pointer transition-colors ${
                      chk.checked
                        ? 'border-emerald-200 bg-emerald-50/50 text-emerald-950'
                        : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={chk.checked}
                      onChange={chk.toggle}
                      className="h-4 w-4 accent-teal-700 rounded cursor-pointer"
                    />
                    <span className="font-medium">{chk.label}</span>
                  </label>
                ))}
              </div>

              {/* Approve / Reject Controls */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <button
                  type="button"
                  onClick={() => handleWorkflowTransition('Approved')}
                  className="w-full rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800 cursor-pointer"
                >
                  Approve Candidate for Level 3 Commercial Catalogue
                </button>

                <div className="space-y-2 rounded-lg border border-red-200 bg-red-50/40 p-3">
                  <div className="text-xs font-bold text-red-900">
                    Reject & Preserve Institutional Record
                  </div>
                  <input
                    type="text"
                    value={rejectReasonInput}
                    onChange={(e) => setRejectReasonInput(e.target.value)}
                    placeholder="Document exact reason (e.g., failed FSSAI/seal/cost)..."
                    className="w-full rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs focus:border-red-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleWorkflowTransition('Rejected')}
                    className="w-full rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 cursor-pointer"
                  >
                    Mark Rejected (Keep Permanent Record)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Batches 01–10 Development Sequence */}
      {libraryTab === 'batches' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Systematic Product Library Development Sequence (Batches 01–10)
            </h3>
            <p className="text-xs text-slate-500">
              Expand GRAMOS & GRAMOSFUEL systematically across batches without inventing suppliers or
              overcommitting inventory capital.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {batches.map((b) => {
              const batchRecs = records.filter((r) => r.batchCode === b.batchCode);
              const l3Count = batchRecs.filter(
                (r) => getLibraryLevel(r.status) === 'Level 3 — Approved Commercial Catalogue'
              ).length;
              const l2Count = batchRecs.filter(
                (r) => getLibraryLevel(r.status) === 'Level 2 — Tested Product Library'
              ).length;

              return (
                <div
                  key={b.id}
                  className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded">
                          {b.batchCode}
                        </span>
                        <span className="text-sm font-bold text-slate-900">{b.title}</span>
                      </div>
                      <select
                        value={b.status}
                        onChange={(e) =>
                          updateBatchStatus(
                            b.id,
                            e.target.value as 'Active' | 'Planned' | 'Completed'
                          )
                        }
                        className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700"
                      >
                        <option value="Active">Active</option>
                        <option value="Planned">Planned</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                    <div className="text-xs font-medium text-teal-800">{b.focusIndustries}</div>
                    <p className="text-xs text-slate-600">{b.notes}</p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-2.5 text-xs">
                    <div className="flex items-center gap-3 font-mono text-[11px] text-slate-700">
                      <span>{batchRecs.length} total</span>
                      <span className="text-amber-700">{l2Count} testing</span>
                      <span className="text-emerald-700">{l3Count} commercial</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {b.batchCode === 'Batch 01' && (
                        <button
                          type="button"
                          onClick={() => setLibraryTab('batch01')}
                          className="rounded border border-teal-600 bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-800 hover:bg-teal-100 cursor-pointer"
                        >
                          50-Item Tracker
                        </button>
                      )}
                      {b.batchCode === 'Batch 02' && (
                        <button
                          type="button"
                          onClick={() => setLibraryTab('batch02')}
                          className="rounded border border-teal-600 bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-800 hover:bg-teal-100 cursor-pointer"
                        >
                          50-Item Tracker
                        </button>
                      )}
                      {b.batchCode === 'Batch 03' && (
                        <button
                          type="button"
                          onClick={() => setLibraryTab('batch03')}
                          className="rounded border border-teal-600 bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-800 hover:bg-teal-100 cursor-pointer"
                        >
                          50-Item Tracker
                        </button>
                      )}
                      {b.batchCode === 'Batch 04' && (
                        <button
                          type="button"
                          onClick={() => setLibraryTab('batch04')}
                          className="rounded border border-teal-600 bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-800 hover:bg-teal-100 cursor-pointer"
                        >
                          50-Item Tracker
                        </button>
                      )}
                      {b.batchCode === 'Batch 05' && (
                        <button
                          type="button"
                          onClick={() => setLibraryTab('batch05')}
                          className="rounded border border-teal-600 bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-800 hover:bg-teal-100 cursor-pointer"
                        >
                          50-Item Tracker
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBatchFilter(b.batchCode);
                          setSelectedLevel('All');
                          setSelectedIndustry('All');
                          setLibraryTab('universe');
                        }}
                        className="rounded border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                      >
                        Filter Batch
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewBatchCode(b.batchCode);
                          setShowAddForm(true);
                        }}
                        className="rounded bg-teal-700 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-teal-800 cursor-pointer"
                      >
                        + Add to Batch
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
