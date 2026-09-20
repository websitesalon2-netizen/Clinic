import React from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  Users, 
  Phone, 
  MapPin, 
  Sparkles,
  DollarSign,
  AlertCircle,
  Lock
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';

const DAYS_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface ClinicScheduleViewProps {
  onOpenBookModal: () => void;
}

export const ClinicScheduleView: React.FC<ClinicScheduleViewProps> = ({ onOpenBookModal }) => {
  const { db } = useClinic();

  const sortedSchedule = [...db.weekly_schedule].sort((a, b) => a.day_of_week - b.day_of_week);

  return (
    <div className="space-y-8">
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-lg border border-teal-800/60">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-700/60 text-teal-200 text-xs font-semibold mb-3 border border-teal-600/40">
            <Clock className="w-3.5 h-3.5" />
            Official Consultation Schedule & Timings
          </span>
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight">
            Clinic Hours & Transparent Fee Policy
          </h2>
          <p className="text-teal-200/90 text-sm mt-2 sm:mt-3 leading-relaxed">
            Dr. Kaiser provides dedicated outpatient consultations with capped daily limits to ensure every patient receives personalized clinical care, thorough diagnostic evaluations, and structured follow-ups.
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-6">
            <button
              onClick={onOpenBookModal}
              className="px-5 py-2.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              Book an Appointment
            </button>
            <a
              href="tel:9622229622"
              className="px-4 py-2.5 rounded-xl bg-teal-900/80 hover:bg-teal-900 text-white font-semibold text-xs border border-teal-700 flex items-center gap-2 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-teal-400" />
              Reception Desk: +91 96222 29622
            </a>
          </div>
        </div>
      </div>

      {/* Grid: Weekly Schedule + Fee Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Schedule Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-heading font-bold text-lg text-slate-900">
                Weekly Doctor Timetable
              </h3>
              <p className="text-xs text-slate-500">
                Standard operating hours and patient intake limits
              </p>
            </div>
            <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
              Capped at 30 Patients/Day
            </span>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
            {sortedSchedule.map((item) => {
              const dayName = DAYS_NAMES[item.day_of_week];
              const isWeekend = item.day_of_week === 0 || item.day_of_week === 6;

              return (
                <div
                  key={item.day_of_week}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isWeekend ? 'bg-slate-50/70' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                        item.is_open
                          ? 'bg-teal-100 text-teal-800'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {dayName.slice(0, 3)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{dayName}</div>
                      <div className="text-xs text-slate-500">
                        {item.is_open ? (
                          <>Slot duration: {item.slot_duration_mins} mins • Max {item.max_patients} tokens</>
                        ) : (
                          <>Routine OPD Closed</>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:text-right">
                    {item.is_open ? (
                      <div>
                        <div className="font-mono font-bold text-sm text-teal-900">
                          {item.start_time?.slice(0, 5)} - {item.end_time?.slice(0, 5)}
                        </div>
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Consultations Open
                        </span>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-medium bg-slate-100 px-3 py-1 rounded-full">
                        <XCircle className="w-3.5 h-3.5" />
                        Closed
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Friday special hours notice */}
          <div className="mt-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Friday Timing Notice:</strong> On Fridays, the clinic operates during the afternoon session from <strong>02:00 PM to 06:00 PM</strong> following congregational prayers.
            </div>
          </div>
        </div>

        {/* Fee Policy Breakdown Column */}
        <div className="space-y-6">
          {/* Main Fee Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="font-heading font-bold text-base text-slate-900">
                Clinic Fee Policy
              </h3>
            </div>

            <div className="space-y-3 my-4">
              {/* Card 1 */}
              <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-900">New Consultation</span>
                  <span className="text-lg font-black text-teal-900">₹{db.settings.consultation_fee}</span>
                </div>
                <p className="text-[11px] text-teal-700 mt-1">
                  Includes comprehensive examination, prescription, and <strong>2 total visits</strong> valid for <strong>15 days</strong>.
                </p>
              </div>

              {/* Card 2 */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Follow-up within 15 Days</span>
                  <span className="text-sm font-extrabold text-emerald-600">FREE (₹0)</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Second visit covered automatically under your active Entitlement Code.
                </p>
              </div>

              {/* Card 3 */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Repeat Follow-up / Post 15d</span>
                  <span className="text-sm font-extrabold text-slate-900">₹{db.settings.follow_up_fee}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Subsequent review consultations after the 15-day entitlement period has lapsed.
                </p>
              </div>
            </div>

            <button
              onClick={onOpenBookModal}
              className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              Book Consultation Now
            </button>
          </div>

          {/* Centralized Reception Desk Notice */}
          <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
              <Lock className="w-3.5 h-3.5 text-teal-700" />
              <span>Controlled Exclusively by Reception Desk</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Timetable hours, appointment intervals, emergency closure notices, and consultation fees are maintained securely via the password-protected Reception Desk.
            </p>
          </div>

          {/* Contact & Location Info */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xs space-y-4">
            <h4 className="font-heading font-bold text-sm text-teal-300 uppercase tracking-wider">
              Clinic Information
            </h4>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Dr. Kaiser's Clinic (DKC)</div>
                  <div className="text-slate-400">Main Medical Enclave, Hospital Road</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">+91 96222 29622</div>
                  <div className="text-slate-400">Direct Reception & Emergency Inquiries</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
