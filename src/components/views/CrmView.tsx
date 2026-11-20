import React, { useState } from 'react';
import { MessageSquarePlus, ShieldAlert, UserPlus } from 'lucide-react';
import { useGramosStore } from '../../context/StoreContext';
import { CustomerComplaint, CustomerEnquiry, CustomerType } from '../../types/gramos';
import { formatDateShort, formatINR } from '../../utils/formatters';

export const CrmView: React.FC = () => {
  const {
    state,
    addCustomer,
    addEnquiry,
    updateEnquiryStatus,
    addComplaint,
    resolveComplaint,
    convertEnquiryToRequirement,
    convertEnquiryToGramosfuelIdea,
  } = useGramosStore();

  const [tab, setTab] = useState<'customers' | 'enquiries' | 'complaints'>('customers');
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showAddEnquiry, setShowAddEnquiry] = useState(false);
  const [showAddComplaint, setShowAddComplaint] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionText, setResolutionText] = useState('');

  const [cusForm, setCusForm] = useState({
    name: '',
    phone: '',
    type: 'Registered' as CustomerType,
    clubMember: true,
    whatsappOptIn: true,
    creditLimit: 0,
  });

  const [enqForm, setEnqForm] = useState({
    customerName: '',
    phone: '',
    requestedItem: '',
    channel: 'In-Store' as CustomerEnquiry['channel'],
    notes: '',
  });

  const [cmpForm, setCmpForm] = useState({
    customerName: '',
    billNo: '',
    productName: '',
    batchNumber: '',
    category: 'Product Quality' as CustomerComplaint['category'],
    description: '',
  });

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cusForm.name.trim()) return;
    addCustomer({
      name: cusForm.name.trim(),
      phone: cusForm.phone,
      type: cusForm.type,
      clubMember: cusForm.clubMember,
      whatsappOptIn: cusForm.whatsappOptIn,
      creditLimit: cusForm.creditLimit,
      outstandingCredit: 0,
      preferredCategories: [],
    });
    setShowAddCustomer(false);
    setCusForm({
      name: '',
      phone: '',
      type: 'Registered',
      clubMember: true,
      whatsappOptIn: true,
      creditLimit: 0,
    });
  };

  const handleCreateEnquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enqForm.requestedItem.trim()) return;
    addEnquiry({
      date: new Date().toISOString().slice(0, 10),
      customerName: enqForm.customerName || 'Walk-in Visitor',
      phone: enqForm.phone,
      requestedItem: enqForm.requestedItem.trim(),
      channel: enqForm.channel,
      status: 'Open',
      notes: enqForm.notes,
    });
    setShowAddEnquiry(false);
    setEnqForm({ customerName: '', phone: '', requestedItem: '', channel: 'In-Store', notes: '' });
  };

  const handleCreateComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmpForm.description.trim()) return;
    addComplaint({
      date: new Date().toISOString().slice(0, 10),
      customerName: cmpForm.customerName || 'Customer',
      billNo: cmpForm.billNo || 'N/A',
      productName: cmpForm.productName,
      batchNumber: cmpForm.batchNumber,
      category: cmpForm.category,
      description: cmpForm.description.trim(),
      actionTaken: 'Pending review',
      status: cmpForm.category === 'Safety Escalation' ? 'Escalated' : 'Open',
    });
    setShowAddComplaint(false);
    setCmpForm({
      customerName: '',
      billNo: '',
      productName: '',
      batchNumber: '',
      category: 'Product Quality',
      description: '',
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setTab('customers')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              tab === 'customers'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Customer Directory & Club ({state.customers.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('enquiries')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              tab === 'enquiries'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Demand Enquiries ({state.enquiries.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('complaints')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              tab === 'complaints'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Complaints & Resolution ({state.complaints.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          {tab === 'customers' && (
            <button
              type="button"
              onClick={() => setShowAddCustomer(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-800"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Register Customer (Voluntary)
            </button>
          )}
          {tab === 'enquiries' && (
            <button
              type="button"
              onClick={() => setShowAddEnquiry(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-800"
            >
              <MessageSquarePlus className="h-3.5 w-3.5" />
              Log Product Enquiry
            </button>
          )}
          {tab === 'complaints' && (
            <button
              type="button"
              onClick={() => setShowAddComplaint(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-amber-800"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              Log Customer Complaint
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: Customer Directory & Loyalty */}
      {tab === 'customers' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
            <strong>GRAMOS Mart Customer Club (Option A — Simple Membership):</strong> Voluntary registration only. Customers may shop freely without joining; WhatsApp updates require explicit opt-in consent.
          </div>

          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                    <th className="py-3 px-4">Customer ID & Name</th>
                    <th className="py-3 px-3">Type · Consent</th>
                    <th className="py-3 px-3">Customer Club</th>
                    <th className="py-3 px-3 text-right">Visits · Total Spent</th>
                    <th className="py-3 px-4 text-right">B2B Credit Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {state.customers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <div className="font-mono text-[11px] text-slate-500">
                          {c.customerCode}
                        </div>
                        <div className="text-xs font-semibold text-slate-900">{c.name}</div>
                        <div className="text-[11px] text-slate-500">{c.phone}</div>
                      </td>
                      <td className="py-3 px-3 text-xs">
                        <div className="font-medium text-slate-800">{c.type}</div>
                        <div className="text-[11px] text-slate-500">
                          WhatsApp: {c.whatsappOptIn ? 'Opted-in' : 'No promo'}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-xs">
                        {c.clubMember ? (
                          <span className="font-semibold text-teal-700">Club Member</span>
                        ) : (
                          <span className="text-slate-500">Standard Account</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-xs tabular-nums">
                        <div className="font-semibold text-slate-900">
                          {formatINR(c.totalSpent)}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {c.visitCount} visits · {formatDateShort(c.lastVisit)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs tabular-nums">
                        {c.creditLimit > 0 ? (
                          <div>
                            <div className="font-semibold text-slate-900">
                              {formatINR(c.outstandingCredit)}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Limit {formatINR(c.creditLimit)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">Cash / UPI only</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Unavailable Product Enquiries */}
      {tab === 'enquiries' && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="font-display text-base font-semibold text-slate-900">
              Customer Product Request & Enquiry Register (GRM-CRM-001 §8)
            </h3>
            <p className="text-xs text-slate-500">
              Record unavailable product requests to validate local Kota demand before procuring stock
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {state.enquiries.map((e) => (
              <div
                key={e.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="text-xs text-slate-500">
                    {formatDateShort(e.date)} · {e.channel} · {e.customerName} ({e.phone})
                  </div>
                  <div className="text-sm font-semibold text-slate-900 mt-0.5">
                    {e.requestedItem}
                  </div>
                  {e.notes && <div className="text-xs text-slate-600 mt-0.5">{e.notes}</div>}
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                  <button
                    type="button"
                    onClick={() => convertEnquiryToGramosfuelIdea(e.id)}
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
                  >
                    + GRAMOSFUEL Idea
                  </button>
                  <button
                    type="button"
                    onClick={() => convertEnquiryToRequirement(e.id)}
                    className="rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-100 transition-colors"
                  >
                    Send to Daksh Market
                  </button>
                  <select
                    value={e.status}
                    onChange={(ev) =>
                      updateEnquiryStatus(e.id, ev.target.value as CustomerEnquiry['status'])
                    }
                    aria-label="Enquiry status"
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800"
                  >
                    <option value="Open">Open</option>
                    <option value="Sourcing Evaluated">Sourcing Evaluated</option>
                    <option value="Stocked">Stocked</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Customer Complaints */}
      {tab === 'complaints' && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="font-display text-base font-semibold text-slate-900">
              Customer Complaint & Safety Escalation Register
            </h3>
            <p className="text-xs text-slate-500">
              Complaints are only marked resolved once concrete action and outcome are recorded
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {state.complaints.map((c) => (
              <div key={c.id} className="p-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs text-slate-500">
                    {formatDateShort(c.date)} · {c.category} · Bill {c.billNo} · Batch{' '}
                    <span className="font-mono">{c.batchNumber || 'N/A'}</span>
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      c.status === 'Resolved'
                        ? 'text-emerald-700'
                        : c.status === 'Escalated'
                        ? 'text-red-600'
                        : 'text-amber-700'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
                <div className="text-sm font-semibold text-slate-900">
                  {c.productName} — {c.customerName}
                </div>
                <p className="text-xs text-slate-700">{c.description}</p>
                <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <strong>Action & Outcome:</strong> {c.actionTaken}
                </div>

                {c.status !== 'Resolved' && (
                  <div className="pt-1">
                    {resolvingId === c.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={resolutionText}
                          onChange={(e) => setResolutionText(e.target.value)}
                          placeholder="Document refund, replacement, or supplier report..."
                          className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (resolutionText.trim()) {
                              resolveComplaint(c.id, resolutionText.trim());
                              setResolvingId(null);
                              setResolutionText('');
                            }
                          }}
                          className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          Confirm Resolution
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setResolvingId(c.id)}
                        className="text-xs font-semibold text-teal-700 hover:underline"
                      >
                        Record Resolution Action
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {showAddCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <form
            onSubmit={handleCreateCustomer}
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-4"
          >
            <h3 className="font-display text-base font-semibold text-slate-900">
              Voluntary Customer Registration
            </h3>
            <div className="space-y-3 text-xs">
              <label className="block">
                <span className="font-medium text-slate-700">Customer / Business Name</span>
                <input
                  required
                  type="text"
                  value={cusForm.name}
                  onChange={(e) => setCusForm({ ...cusForm, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="font-medium text-slate-700">Mobile Number</span>
                <input
                  type="text"
                  value={cusForm.phone}
                  onChange={(e) => setCusForm({ ...cusForm, phone: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="block">
                <span className="font-medium text-slate-700">Customer Classification</span>
                <select
                  value={cusForm.type}
                  onChange={(e) =>
                    setCusForm({ ...cusForm, type: e.target.value as CustomerType })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  <option value="Registered">Registered Retail</option>
                  <option value="Repeat">Repeat Customer</option>
                  <option value="Regional Buyer">Regional Hadoti Buyer</option>
                  <option value="Wholesale">Wholesale Retailer</option>
                  <option value="Institutional">Institutional / Hostel / Office</option>
                </select>
              </label>
              {(cusForm.type === 'Wholesale' || cusForm.type === 'Institutional') && (
                <label className="block">
                  <span className="font-medium text-slate-700">Approved Credit Limit (₹)</span>
                  <input
                    type="number"
                    min={0}
                    value={cusForm.creditLimit}
                    onChange={(e) =>
                      setCusForm({ ...cusForm, creditLimit: Number(e.target.value) || 0 })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                  />
                </label>
              )}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={cusForm.clubMember}
                  onChange={(e) => setCusForm({ ...cusForm, clubMember: e.target.checked })}
                  className="h-4 w-4 accent-teal-700"
                />
                <span>Enroll in GRAMOS Mart Customer Club</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={cusForm.whatsappOptIn}
                  onChange={(e) => setCusForm({ ...cusForm, whatsappOptIn: e.target.checked })}
                  className="h-4 w-4 accent-teal-700"
                />
                <span>Consent obtained for WhatsApp order & arrival updates</span>
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddCustomer(false)}
                className="rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white"
              >
                Generate Customer ID
              </button>
            </div>
          </form>
        </div>
      )}

      {showAddEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <form
            onSubmit={handleCreateEnquiry}
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-4"
          >
            <h3 className="font-display text-base font-semibold text-slate-900">
              Log Unavailable Product Enquiry
            </h3>
            <div className="space-y-3 text-xs">
              <label className="block">
                <span className="font-medium text-slate-700">Requested Product / Pack Size</span>
                <input
                  required
                  type="text"
                  value={enqForm.requestedItem}
                  onChange={(e) => setEnqForm({ ...enqForm, requestedItem: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="font-medium text-slate-700">Customer Name</span>
                <input
                  type="text"
                  value={enqForm.customerName}
                  onChange={(e) => setEnqForm({ ...enqForm, customerName: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="block">
                <span className="font-medium text-slate-700">Channel</span>
                <select
                  value={enqForm.channel}
                  onChange={(e) =>
                    setEnqForm({
                      ...enqForm,
                      channel: e.target.value as CustomerEnquiry['channel'],
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  <option value="In-Store">In-Store</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Phone">Phone</option>
                </select>
              </label>
              <label className="block">
                <span className="font-medium text-slate-700">Notes</span>
                <input
                  type="text"
                  value={enqForm.notes}
                  onChange={(e) => setEnqForm({ ...enqForm, notes: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddEnquiry(false)}
                className="rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white"
              >
                Log Enquiry
              </button>
            </div>
          </form>
        </div>
      )}

      {showAddComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <form
            onSubmit={handleCreateComplaint}
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-4"
          >
            <h3 className="font-display text-base font-semibold text-slate-900">
              Log Customer Complaint
            </h3>
            <div className="space-y-3 text-xs">
              <label className="block">
                <span className="font-medium text-slate-700">Category</span>
                <select
                  value={cmpForm.category}
                  onChange={(e) =>
                    setCmpForm({
                      ...cmpForm,
                      category: e.target.value as CustomerComplaint['category'],
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  <option value="Product Quality">Product Quality</option>
                  <option value="Packaging">Packaging</option>
                  <option value="Pricing">Pricing</option>
                  <option value="Billing">Billing</option>
                  <option value="Availability">Availability</option>
                  <option value="Safety Escalation">Safety Escalation (Immediate)</option>
                </select>
              </label>
              <label className="block">
                <span className="font-medium text-slate-700">Product Name</span>
                <input
                  required
                  type="text"
                  value={cmpForm.productName}
                  onChange={(e) => setCmpForm({ ...cmpForm, productName: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="font-medium text-slate-700">Bill Reference</span>
                  <input
                    type="text"
                    value={cmpForm.billNo}
                    onChange={(e) => setCmpForm({ ...cmpForm, billNo: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                  />
                </label>
                <label className="block">
                  <span className="font-medium text-slate-700">Batch Number</span>
                  <input
                    type="text"
                    value={cmpForm.batchNumber}
                    onChange={(e) => setCmpForm({ ...cmpForm, batchNumber: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                  />
                </label>
              </div>
              <label className="block">
                <span className="font-medium text-slate-700">Complaint Details</span>
                <textarea
                  required
                  rows={2}
                  value={cmpForm.description}
                  onChange={(e) => setCmpForm({ ...cmpForm, description: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddComplaint(false)}
                className="rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-amber-700 px-4 py-2 text-xs font-semibold text-white"
              >
                Record Complaint
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
