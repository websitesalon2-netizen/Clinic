import React, { useState, useId } from 'react';
import { 
  Search, 
  ShieldCheck, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Copy, 
  Check, 
  AlertCircle,
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { PatientFeeEntitlement } from '../types';

interface EntitlementLookupProps {
  onBookWithEntitlement: (phone: string, code: string) => void;
}

export const EntitlementLookup: React.FC<EntitlementLookupProps> = ({ onBookWithEntitlement }) => {
  const { db, lookupEntitlementsByPhone, lookupEntitlementByCode } = useClinic();
  const [query, setQuery] = useState('9622229622'); // Pre-fill with user's active DB phone for instant demonstration
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const searchInputId = useId();

  // Perform search
  const clean = query.trim();
  let results: PatientFeeEntitlement[] = [];

  if (clean) {
    if (clean.toUpperCase().startsWith('DKC-')) {
      const single = lookupEntitlementByCode(clean);
      if (single) results = [single];
    } else {
      results = lookupEntitlementsByPhone(clean);
    }
  }

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-semibold mb-3 border border-teal-200">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            15-Day Fee Validity Verification
          </div>
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Patient Consultation Entitlement Status
          </h2>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            At Dr. Kaiser's Clinic, every standard consultation fee of ₹500 covers up to{' '}
            <strong className="text-slate-900">2 visits within a 15-day validity period</strong>. Enter your registered mobile number or entitlement code below to check your remaining free follow-up visits.
          </p>
        </div>

        {/* Search Input Bar */}
        <div className="mt-6 max-w-2xl">
          <div className="relative">
            <label htmlFor={searchInputId} className="sr-only">Mobile Number or Code</label>
            <input
              id={searchInputId}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter mobile number (e.g. 9622229622) or Entitlement Code..."
              className="w-full pl-11 pr-28 py-3.5 rounded-2xl border border-slate-300 bg-slate-50 text-slate-900 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-hidden transition-all shadow-xs"
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-4" />
            {clean && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-3 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
            <span>Quick try:</span>
            <button
              onClick={() => setQuery('9622229622')}
              className="text-teal-600 hover:text-teal-700 font-semibold underline cursor-pointer"
            >
              9622229622 (Patient Record)
            </button>
            <span>•</span>
            <button
              onClick={() => setQuery('DKC-MTZSXO2G-A9VU3')}
              className="text-teal-600 hover:text-teal-700 font-semibold underline cursor-pointer"
            >
              DKC-MTZSXO2G-A9VU3
            </button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-bold text-lg text-slate-900">
            Entitlement Records ({results.length})
          </h3>
          <span className="text-xs text-slate-500">
            Total {db.entitlements.length} entitlements registered in clinic database
          </span>
        </div>

        {results.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-slate-200">
            <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h4 className="font-bold text-slate-800 text-sm">No Entitlements Found</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              We couldn't find any records matching "{query}". If you are a new patient, book your first consultation to automatically generate an entitlement!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((ent) => {
              const remainingVisits = Math.max(0, ent.allowed_visits - ent.used_visits);
              const isActive = ent.status === 'active' && remainingVisits > 0;
              const percentUsed = Math.min(100, Math.round((ent.used_visits / ent.allowed_visits) * 100));

              return (
                <div
                  key={ent.id}
                  className={`rounded-2xl p-5 border transition-all ${
                    isActive
                      ? 'bg-gradient-to-br from-teal-50/50 via-white to-emerald-50/30 border-teal-300 shadow-sm'
                      : 'bg-white border-slate-200 opacity-90'
                  }`}
                >
                  {/* Top Header */}
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Entitlement Code
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {ent.entitlement_code}
                        </span>
                        <button
                          onClick={() => handleCopy(ent.entitlement_code)}
                          title="Copy Code"
                          className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {copiedCode === ent.entitlement_code ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${
                      isActive
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {isActive ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-slate-400" />
                          Exhausted
                        </>
                      )}
                    </span>
                  </div>

                  {/* Patient Info */}
                  <div className="py-3 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Patient Name:</span>
                      <span className="font-bold text-slate-900 capitalize">{ent.patient_name}</span>
                    </div>
                    {ent.guardian_name && ent.guardian_name !== '-' && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Guardian / Parent:</span>
                        <span className="font-medium text-slate-800 capitalize">{ent.guardian_name}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500">Mobile Number:</span>
                      <span className="font-mono font-medium text-slate-800">{ent.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Initial Fee Paid:</span>
                      <span className="font-semibold text-slate-800">₹{ent.amount_paid}</span>
                    </div>
                  </div>

                  {/* Visit Utilization Progress Bar */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 mb-3">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium text-slate-600">Consultation Visits:</span>
                      <span className="font-bold text-slate-900">
                        {ent.used_visits} of {ent.allowed_visits} used ({remainingVisits} remaining)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isActive ? 'bg-teal-600' : 'bg-slate-400'
                        }`}
                        style={{ width: `${percentUsed}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Validity Dates */}
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Valid: {ent.valid_from}</span>
                    </div>
                    <div>
                      <span>Expires: <strong className="text-slate-700">{ent.valid_until}</strong></span>
                    </div>
                  </div>

                  {/* Action */}
                  {isActive ? (
                    <button
                      onClick={() => onBookWithEntitlement(ent.phone, ent.entitlement_code)}
                      className="w-full py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Book Free Follow-up Visit (₹0)
                    </button>
                  ) : (
                    <div className="text-center text-[11px] text-slate-400 py-1">
                      All allocated visits used. A new consultation will renew entitlement.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Policy Card info */}
      <div className="p-5 bg-teal-900 text-teal-100 rounded-2xl flex items-start gap-3">
        <Info className="w-5 h-5 text-teal-300 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-bold text-white text-sm">Doctor Consultation Fee Policy Notice</p>
          <p className="text-teal-200">
            • Initial Consultation Fee: ₹500 (automatically grants 2 free doctor visits within 15 calendar days).
          </p>
          <p className="text-teal-200">
            • Follow-up Consultation Fee after 15 days or when visits are exhausted: ₹300.
          </p>
          <p className="text-teal-200">
            • Please present your Entitlement Code at the reception counter to ensure fee waiver.
          </p>
        </div>
      </div>
    </div>
  );
};
