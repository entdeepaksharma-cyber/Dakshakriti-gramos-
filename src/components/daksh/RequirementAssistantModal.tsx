import React, { useState } from 'react';
import { Sparkles, AlertCircle, CheckCircle2, Plus, Trash2, X } from 'lucide-react';
import { useGramosStore } from '../../context/StoreContext';
import { OfferingType, RequirementLineItem } from '../../types/gramos';
import { formatINR } from '../../utils/formatters';

interface RequirementAssistantModalProps {
  onClose: () => void;
  defaultBuyerOrgId?: string;
  defaultProjectId?: string;
}

type DraftItem = Omit<RequirementLineItem, 'id'>;

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

function parseRequirementPrompt(
  prompt: string,
  industries: string[]
): {
  title: string;
  location: string;
  items: DraftItem[];
  missing: string[];
  budget: number | null;
  deliveryDate: string | null;
  installation: boolean | null;
} {
  const lower = prompt.toLowerCase();
  const items: DraftItem[] = [];

  // Extract location heuristics
  let location = 'Kota, Rajasthan';
  const locMatch = prompt.match(/in\s+([A-Za-z\s,]+?)(?:\.|$)/i);
  if (locMatch && locMatch[1].trim().length > 2) {
    location = locMatch[1].trim();
  }

  // Extract budget heuristics
  let budget: number | null = null;
  const budgetMatch = prompt.match(/(?:budget|under|max|rs\.?|₹)\s*([\d,]+)/i);
  if (budgetMatch) {
    const parsed = Number(budgetMatch[1].replace(/,/g, ''));
    if (parsed > 0) budget = parsed;
  }

  // Extract pattern matching for multi-item procurement prompts
  if (lower.includes('table')) {
    const m = prompt.match(/(\d+)\s*(?:caf[eé]\s*)?tables?/i);
    items.push({
      description: 'Commercial Café Dining Tables (4-Seater)',
      industry: industries.find((i) => i.toLowerCase().includes('furniture')) || 'Furniture and interiors',
      category: 'Furniture',
      offeringType: 'Physical Product',
      qty: m ? Number(m[1]) : 10,
      unit: 'Units',
      specs: 'Finish, dimensions & material grade to be confirmed',
    });
  }
  if (lower.includes('chair')) {
    const m = prompt.match(/(\d+)\s*(?:caf[eé]\s*)?chairs?/i);
    items.push({
      description: 'Commercial Café Seating Chairs',
      industry: industries.find((i) => i.toLowerCase().includes('furniture')) || 'Furniture and interiors',
      category: 'Furniture',
      offeringType: 'Physical Product',
      qty: m ? Number(m[1]) : 20,
      unit: 'Units',
      specs: 'Frame material & upholstery spec to be confirmed',
    });
  }
  if (lower.includes('light')) {
    const m = prompt.match(/(\d+)\s*(?:indoor\s*)?light(?:ing|s)?/i);
    items.push({
      description: 'Indoor Ambient & Pendant Lighting Fixtures',
      industry: industries.find((i) => i.toLowerCase().includes('electrical')) || 'Electrical and electronics',
      category: 'Lighting',
      offeringType: 'Physical Product',
      qty: m ? Number(m[1]) : 20,
      unit: 'Fixtures',
      specs: 'Warm white commercial LED fixtures',
    });
  }
  if (lower.includes('tableware') || lower.includes('crockery') || lower.includes('kitchen')) {
    items.push({
      description: 'Commercial Hospitality Tableware & Serving Set',
      industry:
        industries.find((i) => i.toLowerCase().includes('hospitality')) ||
        'Hospitality and restaurant supplies',
      category: 'Tableware',
      offeringType: 'Bundle / Kit',
      qty: 30,
      unit: 'Sets',
      specs: 'Cups, plates, bowls for commercial service',
    });
  }
  if (lower.includes('sattu')) {
    const m = prompt.match(/(\d+)\s*(?:cartons?|packs?|units?)?\s*(?:gramosfuel\s*)?(?:high-protein\s*)?sattu/i);
    items.push({
      description: 'GRAMOSFUEL High-Protein Chana Sattu (Bulk B2B Carton)',
      industry: 'GRAMOSFUEL Consumer Products',
      category: 'Sattu Products',
      offeringType: 'Recurring Supply',
      qty: m ? Number(m[1]) : 10,
      unit: 'Carton (10 kg)',
      specs: 'Batch freshness >= 4 months remaining',
    });
  }
  if (lower.includes('pickle') || lower.includes('achar')) {
    const m = prompt.match(/(\d+)\s*(?:cases?|jars?|units?)?\s*(?:hadoti\s*)?(?:mango\s*)?pickle/i);
    items.push({
      description: 'Hadoti Methi-Keri Artisanal Mango Pickle (B2B Case)',
      industry: 'Regional and Hadoti Products',
      category: 'Traditional Food Products',
      offeringType: 'Physical Product',
      qty: m ? Number(m[1]) : 5,
      unit: 'Case of 12',
      specs: '400 g sealed glass jars',
    });
  }
  if (lower.includes('energy bar') || lower.includes('bajra')) {
    const m = prompt.match(/(\d+)\s*(?:boxes?|packs?)?\s*(?:bajra\s*)?energy\s*bars?/i);
    items.push({
      description: 'GRAMOSFUEL Jaggery & Bajra Energy Bar (Master Box)',
      industry: 'GRAMOSFUEL Consumer Products',
      category: 'Energy Snacks',
      offeringType: 'Recurring Supply',
      qty: m ? Number(m[1]) : 5,
      unit: 'Master Box',
      specs: '12 packs x 4 bars per master box',
    });
  }

  if (items.length === 0 && prompt.trim()) {
    items.push({
      description: prompt.trim().slice(0, 90),
      industry: industries[0] || 'Utility and General Merchandise',
      category: 'General Procurement',
      offeringType: 'Physical Product',
      qty: 10,
      unit: 'Units',
      specs: 'Detailed commercial specification required before RFQ',
    });
  }

  const missing: string[] = [];
  if (!budget) missing.push('Target budget ceiling not specified');
  const deliveryDate: string | null = null;
  missing.push('Required delivery date not specified');
  const installation: boolean | null =
    lower.includes('install') ? true : null;
  if (installation === null) missing.push('Installation / setup scope not confirmed');

  const title =
    lower.includes('café') || lower.includes('cafe')
      ? `Café Opening Procurement — ${location}`
      : lower.includes('hostel')
      ? `Institutional Hostel Supply — ${location}`
      : `Structured B2B Requirement — ${location}`;

  return { title, location, items, missing, budget, deliveryDate, installation };
}

export const RequirementAssistantModal: React.FC<RequirementAssistantModalProps> = ({
  onClose,
  defaultBuyerOrgId,
  defaultProjectId,
}) => {
  const { state, createRequirement } = useGramosStore();

  const buyerOrgs = state.dakshMarket.organizations.filter((o) => o.roleIds.buyerId);
  const industryNames = state.dakshMarket.industries.filter((i) => i.active).map((i) => i.name);

  const [buyerOrgId, setBuyerOrgId] = useState(
    defaultBuyerOrgId || buyerOrgs[0]?.orgId || 'ORG-000001'
  );
  const [rawPrompt, setRawPrompt] = useState(
    'Need 20 café tables, 60 chairs, indoor lighting and tableware for a café opening in Kota, Rajasthan.'
  );
  const [parsedTitle, setParsedTitle] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('Kota, Rajasthan');
  const [budgetCeiling, setBudgetCeiling] = useState<string>('');
  const [targetDeliveryDate, setTargetDeliveryDate] = useState<string>('');
  const [installationScope, setInstallationScope] = useState<'unknown' | 'yes' | 'no'>('unknown');
  const [items, setItems] = useState<DraftItem[]>([]);
  const [missingFlags, setMissingFlags] = useState<string[]>([]);
  const [hasParsed, setHasParsed] = useState(false);

  const handleAnalyzePrompt = (promptOverride?: string) => {
    const source = promptOverride ?? rawPrompt;
    const result = parseRequirementPrompt(source, industryNames);
    setParsedTitle(result.title);
    setDeliveryLocation(result.location);
    setBudgetCeiling(result.budget ? String(result.budget) : '');
    setTargetDeliveryDate(result.deliveryDate || '');
    setInstallationScope(result.installation === true ? 'yes' : 'unknown');
    setItems(result.items);
    setMissingFlags(result.missing);
    setHasParsed(true);
  };

  const handleAddBlankItem = () => {
    setItems((prev) => [
      ...prev,
      {
        description: '',
        industry: industryNames[0] || 'Food and Grocery',
        category: '',
        offeringType: 'Physical Product',
        qty: 1,
        unit: 'Units',
        specs: '',
      },
    ]);
  };

  const handleSaveRequirement = (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = items.filter((i) => i.description.trim());
    if (validItems.length === 0) return;

    const flags: string[] = [];
    if (!budgetCeiling || Number(budgetCeiling) <= 0) {
      flags.push('Target budget ceiling not specified');
    }
    if (!targetDeliveryDate) {
      flags.push('Required delivery date not specified');
    }
    if (installationScope === 'unknown') {
      flags.push('Installation scope not confirmed');
    }

    createRequirement({
      buyerOrgId,
      title: parsedTitle.trim() || 'Structured B2B Requirement',
      rawPrompt,
      deliveryLocation,
      targetDeliveryDate: targetDeliveryDate || null,
      budgetCeiling: budgetCeiling ? Number(budgetCeiling) : null,
      installationNeeded:
        installationScope === 'unknown' ? null : installationScope === 'yes',
      missingInfoFlags: flags,
      items: validItems,
      projectId: defaultProjectId,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-xl border border-slate-200 bg-white shadow-xl my-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-teal-700" />
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900">
                Buyer Requirement Assistant (Human-Reviewed Draft)
              </h3>
              <p className="text-[11px] text-slate-500">
                Converts free-text procurement requests into structured line items, flags missing commercial data, and runs evidence-based matching.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close assistant"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSaveRequirement} className="p-5 space-y-4 max-h-[82vh] overflow-y-auto">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block text-xs">
              <span className="font-medium text-slate-700">Buyer Organization</span>
              <select
                value={buyerOrgId}
                onChange={(e) => setBuyerOrgId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
              >
                {buyerOrgs.map((org) => (
                  <option key={org.orgId} value={org.orgId}>
                    {org.roleIds.buyerId} · {org.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex flex-col justify-end gap-1.5">
              <span className="text-[11px] font-medium text-slate-500">Quick Sample Prompts</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const p =
                      'Need 20 café tables, 60 chairs, indoor lighting and tableware for a café opening in Kota, Rajasthan.';
                    setRawPrompt(p);
                    handleAnalyzePrompt(p);
                  }}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                >
                  Kota Café Fit-Out
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const p =
                      'Need 12 cartons GRAMOSFUEL high-protein sattu, 8 boxes bajra energy bars and 5 cases Hadoti mango pickle for hostel canteen in Vigyan Nagar, Kota. Budget 35000';
                    setRawPrompt(p);
                    handleAnalyzePrompt(p);
                  }}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                >
                  Verified Food & SHG Supply
                </button>
              </div>
            </div>
          </div>

          <label className="block text-xs">
            <span className="font-medium text-slate-700">Raw Requirement Prompt</span>
            <textarea
              rows={3}
              value={rawPrompt}
              onChange={(e) => setRawPrompt(e.target.value)}
              placeholder="Describe products, services, quantities, specs, or delivery city..."
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-teal-600 focus:outline-none"
            />
          </label>

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => handleAnalyzePrompt()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              <Sparkles className="h-3.5 w-3.5 text-teal-400" />
              Structure Line Items & Detect Missing Info
            </button>
            <span className="text-[11px] text-slate-500">
              AI drafts require buyer approval before publishing or issuing RFQs.
            </span>
          </div>

          {hasParsed && (
            <div className="space-y-4 border-t border-slate-200 pt-4">
              {missingFlags.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    Missing Commercial Information Detected ({missingFlags.length})
                  </div>
                  <ul className="list-disc pl-5 text-[11px] space-y-0.5">
                    {missingFlags.map((flag, i) => (
                      <li key={i}>{flag}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block text-xs sm:col-span-2">
                  <span className="font-medium text-slate-700">Requirement Title</span>
                  <input
                    required
                    type="text"
                    value={parsedTitle}
                    onChange={(e) => setParsedTitle(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  />
                </label>

                <label className="block text-xs">
                  <span className="font-medium text-slate-700">Delivery Location</span>
                  <input
                    type="text"
                    value={deliveryLocation}
                    onChange={(e) => setDeliveryLocation(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  />
                </label>

                <label className="block text-xs">
                  <span className="font-medium text-slate-700">
                    Budget Ceiling (₹) <span className="text-slate-400">(optional if clarifying later)</span>
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={budgetCeiling}
                    onChange={(e) => setBudgetCeiling(e.target.value)}
                    placeholder="e.g., 250000"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
                  />
                </label>

                <label className="block text-xs">
                  <span className="font-medium text-slate-700">Target Delivery Date</span>
                  <input
                    type="date"
                    value={targetDeliveryDate}
                    onChange={(e) => setTargetDeliveryDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
                  />
                </label>

                <label className="block text-xs">
                  <span className="font-medium text-slate-700">Installation / Fit-Out Required?</span>
                  <select
                    value={installationScope}
                    onChange={(e) =>
                      setInstallationScope(e.target.value as 'unknown' | 'yes' | 'no')
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
                  >
                    <option value="unknown">Not Yet Confirmed</option>
                    <option value="yes">Yes — Include Installation in Quote</option>
                    <option value="no">No — Delivery Only</option>
                  </select>
                </label>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800">
                    Structured Line Items ({items.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddBlankItem}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:underline"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Line Item
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-3 grid grid-cols-1 gap-2 sm:grid-cols-12 items-start"
                    >
                      <div className="sm:col-span-4">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            setItems((prev) =>
                              prev.map((it, i) =>
                                i === idx ? { ...it, description: e.target.value } : it
                              )
                            )
                          }
                          placeholder="Item description"
                          className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <select
                          value={item.industry}
                          onChange={(e) =>
                            setItems((prev) =>
                              prev.map((it, i) =>
                                i === idx ? { ...it, industry: e.target.value } : it
                              )
                            )
                          }
                          className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-[11px]"
                        >
                          {industryNames.map((ind) => (
                            <option key={ind} value={ind}>
                              {ind}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <select
                          value={item.offeringType}
                          onChange={(e) =>
                            setItems((prev) =>
                              prev.map((it, i) =>
                                i === idx
                                  ? { ...it, offeringType: e.target.value as OfferingType }
                                  : it
                              )
                            )
                          }
                          className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-[11px]"
                        >
                          {OFFERING_TYPES.map((ot) => (
                            <option key={ot} value={ot}>
                              {ot}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-2 flex gap-1">
                        <input
                          type="number"
                          min={1}
                          value={item.qty}
                          onChange={(e) =>
                            setItems((prev) =>
                              prev.map((it, i) =>
                                i === idx ? { ...it, qty: Number(e.target.value) || 1 } : it
                              )
                            )
                          }
                          className="w-14 rounded border border-slate-300 bg-white px-2 py-1.5 font-mono text-xs"
                        />
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) =>
                            setItems((prev) =>
                              prev.map((it, i) => (i === idx ? { ...it, unit: e.target.value } : it))
                            )
                          }
                          className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-[11px]"
                        />
                      </div>
                      <div className="sm:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                          aria-label="Remove item"
                          className="rounded p-1.5 text-slate-400 hover:bg-slate-200 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-slate-200 pt-3">
            <div className="text-[11px] text-slate-500">
              {budgetCeiling ? `Ceiling: ${formatINR(Number(budgetCeiling))}` : 'Budget open for clarification'}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!hasParsed || items.length === 0}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-40"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Approve & Save Requirement
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
