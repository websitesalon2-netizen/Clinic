import React from 'react';
import { Printer, X, CheckCircle2, ShieldCheck, QrCode, Stethoscope } from 'lucide-react';
import { ClinicAppointment } from '../types';

interface PatientSlipModalProps {
  appointment: ClinicAppointment | null;
  onClose: () => void;
}

export const PatientSlipModal: React.FC<PatientSlipModalProps> = ({ appointment, onClose }) => {
  if (!appointment) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-100/80 border-b border-slate-200">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Appointment Token Slip
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Voucher Area */}
        <div id="printable-token-slip" className="p-6 bg-white">
          {/* Header */}
          <div className="text-center pb-4 border-b border-dashed border-slate-300">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-teal-100 text-teal-700 mb-2">
              <Stethoscope className="w-5 h-5" />
            </div>
            <h2 className="font-heading font-extrabold text-xl text-slate-900">Dr. Kaiser's Clinic</h2>
            <p className="text-xs text-slate-500 font-medium">Consultant Physician & Family Medicine</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Reception Desk: +91 96222 29622</p>
          </div>

          {/* Big Token Display */}
          <div className="my-5 p-4 rounded-xl bg-teal-50 border border-teal-200 text-center">
            <div className="text-xs font-semibold text-teal-800 uppercase tracking-wider">Your Queue Token</div>
            <div className="font-heading text-5xl font-black text-teal-900 my-1">
              #{appointment.token_number}
            </div>
            <div className="text-xs text-teal-700 font-medium">
              Estimated Time: <span className="font-bold">{appointment.appointment_time}</span> on {appointment.appointment_date}
            </div>
          </div>

          {/* Patient Details */}
          <div className="space-y-2.5 text-xs text-slate-700 py-2 border-b border-dashed border-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500">Patient Name:</span>
              <span className="font-bold text-slate-900 capitalize">{appointment.patient_name}</span>
            </div>
            {appointment.guardian_name && appointment.guardian_name !== '-' && (
              <div className="flex justify-between">
                <span className="text-slate-500">Guardian / Parent:</span>
                <span className="font-medium text-slate-800 capitalize">{appointment.guardian_name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Contact Number:</span>
              <span className="font-mono font-medium text-slate-800">{appointment.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Consultation Type:</span>
              <span className="font-semibold text-slate-800 capitalize">
                {appointment.visit_type === 'new' ? 'New Consultation' : 'Follow-up Visit'}
              </span>
            </div>
            {appointment.entitlement_code && (
              <div className="flex justify-between items-center bg-emerald-50 px-2 py-1.5 rounded border border-emerald-200">
                <span className="text-emerald-800 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Entitlement Code:
                </span>
                <span className="font-mono font-bold text-emerald-900 text-[11px]">
                  {appointment.entitlement_code}
                </span>
              </div>
            )}
            <div className="flex justify-between pt-1">
              <span className="text-slate-500">Fee Amount:</span>
              <span className="font-extrabold text-sm text-slate-900">
                {appointment.fee_amount === 0 ? (
                  <span className="text-emerald-600">₹0 (Covered by Entitlement)</span>
                ) : (
                  `₹${appointment.fee_amount}`
                )}
              </span>
            </div>
          </div>

          {/* Policy Notice & QR Simulation */}
          <div className="pt-4 flex items-center justify-between gap-4">
            <div className="text-[10px] text-slate-500 leading-relaxed">
              <p className="font-semibold text-slate-700">Notice to Patient:</p>
              <p>• Consultation valid for 2 visits within 15 days.</p>
              <p>• Please be present in the waiting lounge 10 mins prior.</p>
              <p>• Retain this slip for pharmacy & follow-up reference.</p>
            </div>
            <div className="p-2 bg-slate-100 rounded-lg text-slate-400 shrink-0">
              <QrCode className="w-12 h-12 text-slate-700" />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Token Slip
          </button>
        </div>
      </div>
    </div>
  );
};
