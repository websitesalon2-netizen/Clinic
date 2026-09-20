import React, { useState, useEffect, useId } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  ShieldCheck,
  Stethoscope
} from 'lucide-react';
import { useClinic, CURRENT_DATE_STRING } from '../context/ClinicContext';
import { ClinicAppointment, PatientFeeEntitlement } from '../types';

interface BookAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookingSuccess: (appointment: ClinicAppointment) => void;
  initialPhone?: string;
  initialEntitlementCode?: string;
}

export const BookAppointmentModal: React.FC<BookAppointmentModalProps> = ({
  isOpen,
  onClose,
  onBookingSuccess,
  initialPhone = '',
  initialEntitlementCode = ''
}) => {
  const { 
    db, 
    bookAppointment, 
    findActiveEntitlementForPatient, 
    lookupEntitlementByCode,
    isClinicOpenOnDate,
    getDateClosureReason,
    nextAvailableOpenDate
  } = useClinic();

  const [date, setDate] = useState<string>(CURRENT_DATE_STRING);
  const [patientName, setPatientName] = useState<string>('');
  const [guardianName, setGuardianName] = useState<string>('');
  const [phone, setPhone] = useState<string>(initialPhone);
  const [visitType, setVisitType] = useState<'new' | 'follow_up'>('new');
  const [timeSlot, setTimeSlot] = useState<string>('10:30');
  const [notes, setNotes] = useState<string>('');
  const [detectedEntitlement, setDetectedEntitlement] = useState<PatientFeeEntitlement | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const dateInputId = useId();
  const timeInputId = useId();
  const nameInputId = useId();
  const guardianInputId = useId();
  const phoneInputId = useId();
  const notesInputId = useId();

  // Pre-fill phone if provided
  useEffect(() => {
    if (initialPhone) {
      setPhone(initialPhone);
    }
  }, [initialPhone]);

  // Detect active entitlement whenever phone changes
  useEffect(() => {
    if (initialEntitlementCode) {
      const ent = lookupEntitlementByCode(initialEntitlementCode);
      if (ent && ent.status === 'active' && ent.used_visits < ent.allowed_visits) {
        setDetectedEntitlement(ent);
        setVisitType('follow_up');
        if (ent.patient_name && !patientName) setPatientName(ent.patient_name);
        if (ent.guardian_name && !guardianName) setGuardianName(ent.guardian_name);
        return;
      }
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length >= 10) {
      const active = findActiveEntitlementForPatient(cleanPhone);
      if (active) {
        setDetectedEntitlement(active);
        setVisitType('follow_up');
        if (active.patient_name && !patientName) setPatientName(active.patient_name);
        if (active.guardian_name && !guardianName) setGuardianName(active.guardian_name);
      } else {
        setDetectedEntitlement(null);
      }
    } else {
      setDetectedEntitlement(null);
    }
  }, [phone, initialEntitlementCode, findActiveEntitlementForPatient, lookupEntitlementByCode, patientName, guardianName]);

  if (!isOpen) return null;

  // Day calculations
  const dateObj = new Date(date);
  const dayOfWeek = isNaN(dateObj.getTime()) ? 0 : dateObj.getDay();
  const sched = db.weekly_schedule.find((s) => s.day_of_week === dayOfWeek);
  const isOpenDate = isClinicOpenOnDate(date);
  const existingForDate = db.appointments.filter((a) => a.appointment_date === date);
  const dailyLimit = db.daily_limits.find((dl) => dl.date === date)?.max_patients || sched?.max_patients || 30;
  const isFull = existingForDate.length >= dailyLimit;

  // Fee computation
  const willBeFree = detectedEntitlement && visitType === 'follow_up';
  const expectedFee = willBeFree
    ? 0
    : visitType === 'follow_up'
    ? db.settings.follow_up_fee
    : db.settings.consultation_fee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!patientName.trim()) {
      setErrorMsg('Please provide the patient name.');
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      setErrorMsg('Please enter a valid 10-digit phone number.');
      return;
    }
    if (!isOpenDate) {
      setErrorMsg(`The clinic is closed on ${date}. Please select an open consultation day.`);
      return;
    }
    if (isFull) {
      setErrorMsg(`Booking limit reached (${dailyLimit} patients) for ${date}. Please select another date.`);
      return;
    }

    try {
      const appointment = bookAppointment({
        patient_name: patientName.trim(),
        guardian_name: guardianName.trim() || '-',
        phone: phone.trim(),
        appointment_date: date,
        appointment_time: timeSlot,
        visit_type: visitType,
        notes: notes.trim(),
        entitlement_code: detectedEntitlement?.entitlement_code
      });

      onBookingSuccess(appointment);
      onClose();
    } catch {
      setErrorMsg('Failed to create appointment. Please check details and try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-800 to-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-700/80 flex items-center justify-center text-teal-200">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-base text-white leading-tight">
                Book Consultation Token
              </h2>
              <p className="text-xs text-teal-200">Dr. Kaiser's Clinic • Instant Token & Slip</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-teal-300 hover:text-white hover:bg-teal-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Date & Clinic Availability */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor={dateInputId} className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                Appointment Date
              </label>
              <input
                id={dateInputId}
                type="date"
                value={date}
                min="2026-09-13"
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-hidden"
              />
              <div className="mt-1 text-[11px]">
                {isOpenDate ? (
                  <span className="text-emerald-700 font-medium">
                    ✓ Open ({sched?.start_time?.slice(0, 5)} - {sched?.end_time?.slice(0, 5)})
                  </span>
                ) : (
                  <div className="text-rose-600 font-bold flex items-center justify-between gap-1 mt-0.5">
                    <span>✗ Clinic OFF ({getDateClosureReason(date) || 'Closed'})</span>
                    <button
                      type="button"
                      onClick={() => setDate(nextAvailableOpenDate)}
                      className="text-teal-700 underline text-[10px] font-semibold cursor-pointer"
                    >
                      Pick {nextAvailableOpenDate}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label htmlFor={timeInputId} className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-600" />
                Preferred Time Slot
              </label>
              <select
                id={timeInputId}
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-hidden"
              >
                <option value="09:15">09:15 AM</option>
                <option value="09:45">09:45 AM</option>
                <option value="10:15">10:15 AM</option>
                <option value="10:45">10:45 AM</option>
                <option value="11:30">11:30 AM</option>
                <option value="12:15">12:15 PM</option>
                <option value="14:30">02:30 PM</option>
                <option value="15:30">03:30 PM</option>
                <option value="16:30">04:30 PM</option>
                <option value="18:30">06:30 PM (Mon Only)</option>
              </select>
              <div className="mt-1 text-[11px] text-slate-500">
                Booked: {existingForDate.length} / {dailyLimit} max patients
              </div>
            </div>
          </div>

          {/* Phone Number with Auto-entitlement detection */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor={phoneInputId} className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-teal-600" />
                Phone Number (Required)
              </label>
              <span className="text-[10px] text-slate-400">e.g. 9622229622</span>
            </div>
            <div className="relative">
              <input
                id={phoneInputId}
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter 10-digit mobile number"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-hidden"
              />
            </div>

            {/* Active Entitlement Alert Banner */}
            {detectedEntitlement && (
              <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-bold flex items-center gap-1.5">
                    Active Entitlement Found:
                    <span className="font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[11px]">
                      {detectedEntitlement.entitlement_code}
                    </span>
                  </div>
                  <p className="mt-0.5 text-emerald-700">
                    Patient has <strong>{detectedEntitlement.allowed_visits - detectedEntitlement.used_visits}</strong> free visit(s) remaining until{' '}
                    <strong>{detectedEntitlement.valid_until}</strong>. Consultation Fee is waived (₹0)!
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Patient Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor={nameInputId} className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-teal-600" />
                Patient Full Name
              </label>
              <input
                id={nameInputId}
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="e.g. Talib Haider"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-hidden capitalize"
              />
            </div>

            <div>
              <label htmlFor={guardianInputId} className="block font-semibold text-slate-700 mb-1">
                Guardian / Spouse / Parent
              </label>
              <input
                id={guardianInputId}
                type="text"
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
                placeholder="e.g. Sajjad Hussain"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-hidden capitalize"
              />
            </div>
          </div>

          {/* Visit Type */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Consultation Type</label>
            <div className="grid grid-cols-2 gap-2.5">
              <label
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  visitType === 'new'
                    ? 'border-teal-600 bg-teal-50/70 text-teal-900 font-semibold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div>
                  <div className="text-xs">New Consultation</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">₹{db.settings.consultation_fee} (Includes 2 visits in 15d)</div>
                </div>
                <input
                  type="radio"
                  name="visitType"
                  value="new"
                  checked={visitType === 'new'}
                  onChange={() => setVisitType('new')}
                  className="text-teal-600 focus:ring-teal-500"
                />
              </label>

              <label
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  visitType === 'follow_up'
                    ? 'border-teal-600 bg-teal-50/70 text-teal-900 font-semibold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div>
                  <div className="text-xs flex items-center gap-1">
                    Follow-up Visit
                    {detectedEntitlement && (
                      <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-1 rounded">
                        FREE
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {willBeFree ? '₹0 with active entitlement' : `₹${db.settings.follow_up_fee} standard follow-up`}
                  </div>
                </div>
                <input
                  type="radio"
                  name="visitType"
                  value="follow_up"
                  checked={visitType === 'follow_up'}
                  onChange={() => setVisitType('follow_up')}
                  className="text-teal-600 focus:ring-teal-500"
                />
              </label>
            </div>
          </div>

          {/* Notes / Symptoms */}
          <div>
            <label htmlFor={notesInputId} className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-teal-600" />
              Symptoms / Reason for Visit (Optional)
            </label>
            <input
              id={notesInputId}
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Viral fever, blood pressure checkup, report review"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-hidden"
            />
          </div>

          {/* Fee Summary Box */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-700">Total Consultation Fee Due</div>
              <div className="text-[11px] text-slate-500">Payable at clinic reception upon arrival</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-black text-slate-900">
                {expectedFee === 0 ? (
                  <span className="text-emerald-600">₹0 (Free Visit)</span>
                ) : (
                  `₹${expectedFee}`
                )}
              </div>
              {willBeFree && (
                <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Covered by Policy
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              id="btn-confirm-appointment"
              type="submit"
              disabled={!isOpenDate || isFull}
              className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md shadow-teal-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirm Booking & Generate Token
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
