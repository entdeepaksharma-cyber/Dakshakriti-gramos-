import React, { useMemo, useState } from 'react';
import { Award, CheckCircle2, MapPin, Plus, Search } from 'lucide-react';
import { useGramosStore } from '../../context/StoreContext';
import { SupplierClassification, SupplierGroup } from '../../types/gramos';
import { formatINR } from '../../utils/formatters';

const SUPPLIER_GROUPS: SupplierGroup[] = [
  'Manufacturers',
  'Contract Manufacturers',
  'White-Label Manufacturers',
  'Distributors & Wholesalers',
  'Local Producers & SHGs',
  'Agricultural & Rural Producers',
  'Institutional & B2B Suppliers',
];

export const SuppliersView: React.FC = () => {
  const { state, activeRole, addSupplier } = useGramosStore();

  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState<'All' | 'Hadoti' | SupplierGroup>('All');
  const [showAddModal, setShowAddModal] = useState(false);

  const [form, setForm] = useState({
    name: '',
    group: 'Local Producers & SHGs' as SupplierGroup,
    location: 'Kota, Hadoti, Rajasthan',
    contactPerson: '',
    phone: '',
    gstOrLicense: '',
    categories: 'Traditional Snacks',
    paymentTerms: 'Consignment Sale-Linked' as const,
    creditLimit: 0,
    returnPolicy: 'Unsold stock returnable after 30 days',
    classification: 'Approved' as SupplierClassification,
    isRegionalHadoti: true,
    womenLedOrShg: false,
    quality: 4,
    pricing: 4,
    delivery: 4,
    documentation: 4,
    continuity: 4,
  });

  const canOnboard =
    activeRole === 'Founder / Operator' || activeRole === 'Store Manager';

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.suppliers.filter((s) => {
      if (groupFilter === 'Hadoti' && !s.isRegionalHadoti) return false;
      if (groupFilter !== 'All' && groupFilter !== 'Hadoti' && s.group !== groupFilter)
        return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.location.toLowerCase().includes(q) ||
        s.categories.some((c) => c.toLowerCase().includes(q))
      );
    });
  }, [state.suppliers, search, groupFilter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    addSupplier({
      name: form.name.trim(),
      group: form.group,
      location: form.location,
      contactPerson: form.contactPerson || 'Primary Contact',
      phone: form.phone,
      gstOrLicense: form.gstOrLicense || 'Verified Local Enterprise',
      categories: form.categories.split(',').map((c) => c.trim()).filter(Boolean),
      paymentTerms: form.paymentTerms,
      creditLimit: form.creditLimit,
      returnPolicy: form.returnPolicy,
      classification: form.classification,
      isRegionalHadoti: form.isRegionalHadoti,
      womenLedOrShg: form.womenLedOrShg,
      scores: {
        quality: form.quality,
        pricing: form.pricing,
        delivery: form.delivery,
        documentation: form.documentation,
        continuity: form.continuity,
      },
      verified: true,
    });
    setShowAddModal(false);
    setForm((prev) => ({ ...prev, name: '', contactPerson: '', phone: '' }));
  };

  return (
    <div className="space-y-5">
      {/* Header & Onboarding CTA */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">
            Supplier Network & Made in Hadoti Producers (GRM-SUP-001)
          </h2>
          <p className="text-xs text-slate-500">
            7 diversified supplier groups · Gramodaya Udyam sourcing & 9-step verification
          </p>
        </div>

        {canOnboard && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-800 transition-colors self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Onboard Supplier / Producer</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search supplier, Kota/Hadoti cluster, or product category..."
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-teal-600 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setGroupFilter(groupFilter === 'Hadoti' ? 'All' : 'Hadoti')}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              groupFilter === 'Hadoti'
                ? 'border-teal-700 bg-teal-50 text-teal-900 font-semibold'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Made in Hadoti Only
          </button>

          <select
            value={groupFilter === 'Hadoti' ? 'All' : groupFilter}
            onChange={(e) => setGroupFilter(e.target.value as 'All' | SupplierGroup)}
            aria-label="Filter by supplier group"
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
          >
            <option value="All">All 7 Supplier Groups</option>
            {SUPPLIER_GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Supplier Directory */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {filtered.map((s) => {
          const avgScore = (
            (s.scores.quality +
              s.scores.pricing +
              s.scores.delivery +
              s.scores.documentation +
              s.scores.continuity) /
            5
          ).toFixed(1);

          return (
            <div
              key={s.id}
              className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-medium text-teal-700">
                      {s.group}
                      {s.isRegionalHadoti ? ' · Made in Hadoti' : ''}
                      {s.womenLedOrShg ? ' · Women-Led / SHG' : ''}
                    </div>
                    <h3 className="font-display text-base font-bold text-slate-900 mt-0.5">
                      {s.name}
                    </h3>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="inline-flex items-center gap-1 text-xs font-semibold text-slate-900">
                      <Award className="h-3.5 w-3.5 text-teal-700" />
                      <span>{s.classification}</span>
                    </div>
                    <div className="font-mono text-[11px] text-slate-500 tabular-nums">
                      Score {avgScore}/5.0
                    </div>
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span>{s.location}</span>
                </div>

                <div className="mt-3 text-xs text-slate-700">
                  <span className="text-slate-500">Categories: </span>
                  {s.categories.join(' · ')}
                </div>

                <div className="mt-2 text-xs text-slate-600 font-mono">
                  {s.gstOrLicense}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-slate-500">Commercial Terms</div>
                  <div className="font-semibold text-slate-900">{s.paymentTerms}</div>
                  {s.creditLimit > 0 && (
                    <div className="font-mono text-[11px] text-slate-500 tabular-nums">
                      Limit: {formatINR(s.creditLimit)}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-slate-500">Contact & Verification</div>
                  <div className="font-medium text-slate-800">{s.contactPerson}</div>
                  <div className="inline-flex items-center gap-1 text-[11px] text-emerald-700">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>{s.phone}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Onboard Supplier Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-display text-lg font-semibold text-slate-900">
                9-Step Supplier & Producer Onboarding
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-xs text-slate-500 hover:text-slate-900"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
              <label className="block sm:col-span-2">
                <span className="font-medium text-slate-700">Supplier / Enterprise Name</span>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Kota Women's Millet Collective"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </label>

              <label className="block">
                <span className="font-medium text-slate-700">Supplier Group</span>
                <select
                  value={form.group}
                  onChange={(e) =>
                    setForm({ ...form, group: e.target.value as SupplierGroup })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  {SUPPLIER_GROUPS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="font-medium text-slate-700">Location</span>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>

              <label className="block">
                <span className="font-medium text-slate-700">Contact Person</span>
                <input
                  type="text"
                  value={form.contactPerson}
                  onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>

              <label className="block">
                <span className="font-medium text-slate-700">Phone</span>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98..."
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="font-medium text-slate-700">GSTIN / FSSAI / Udyam Verification</span>
                <input
                  type="text"
                  value={form.gstOrLicense}
                  onChange={(e) => setForm({ ...form, gstOrLicense: e.target.value })}
                  placeholder="GSTIN or FSSAI registration number"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                />
              </label>

              <label className="block">
                <span className="font-medium text-slate-700">Payment Terms</span>
                <select
                  value={form.paymentTerms}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      paymentTerms: e.target.value as typeof form.paymentTerms,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  <option value="Advance / Direct">Advance / Direct</option>
                  <option value="7-Day Credit">7-Day Credit</option>
                  <option value="15-Day Credit">15-Day Credit</option>
                  <option value="30-Day Credit">30-Day Credit</option>
                  <option value="Consignment Sale-Linked">Consignment Sale-Linked</option>
                </select>
              </label>

              <label className="block">
                <span className="font-medium text-slate-700">Approved Credit Limit (₹)</span>
                <input
                  type="number"
                  min={0}
                  value={form.creditLimit}
                  onChange={(e) =>
                    setForm({ ...form, creditLimit: Number(e.target.value) || 0 })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                />
              </label>

              <div className="sm:col-span-2 flex flex-wrap gap-4 pt-1">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isRegionalHadoti}
                    onChange={(e) =>
                      setForm({ ...form, isRegionalHadoti: e.target.checked })
                    }
                    className="h-4 w-4 accent-teal-700"
                  />
                  <span>Made in Hadoti Regional Producer</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.womenLedOrShg}
                    onChange={(e) =>
                      setForm({ ...form, womenLedOrShg: e.target.checked })
                    }
                    className="h-4 w-4 accent-teal-700"
                  />
                  <span>Women-Led Enterprise / SHG</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800"
              >
                Approve & Onboard Supplier
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
