import React, { useState, useId } from 'react';
import { 
  Clock, 
  Users, 
  Bell, 
  CheckCircle2, 
  Hourglass, 
  Volume2, 
  Calendar, 
  ArrowRight,
  Stethoscope,
  Activity,
  Search,
  AlertTriangle
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';

interface LiveQueueTrackerProps {
  onOpenBookModal: () => void;
}

export const LiveQueueTracker: React.FC<LiveQueueTrackerProps> = ({ onOpenBookModal }) => {
  const { 
    servingToken, 
    dateAppointments, 
    activeQueueState, 
    selectedDate, 
    setSelectedDate,
    todaySchedule,
    isClinicOpenOnDate,
    getDateClosureReason
  } = useClinic();

  const [lookupQuery, setLookupQuery] = useState('');
  const [hasPlayedChime, setHasPlayedChime] = useState(false);
  const searchInputId = useId();
  const dateInputId = useId();

  const isClosedOnDate = !isClinicOpenOnDate(selectedDate);
  const closureReason = getDateClosureReason(selectedDate) || 'Clinic Closed / Doctor Off';

  // Play pleasant medical chime using Web Audio API
  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      osc.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.35); // D6

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.8);
      setHasPlayedChime(true);
      setTimeout(() => setHasPlayedChime(false), 1500);
    } catch {
      // ignore
    }
  };

  const completedCount = dateAppointments.filter((a) => a.status === 'completed').length;
  const waitingCount = dateAppointments.filter((a) => a.status === 'waiting').length;
  const inConsultation = dateAppointments.find((a) => a.token_number === servingToken || a.status === 'in_consultation');

  // Lookup patient
  const matchingAppointment = lookupQuery.trim()
    ? dateAppointments.find((a) => {
        const num = parseInt(lookupQuery.trim(), 10);
        if (!isNaN(num) && a.token_number === num) return true;
        return a.phone.includes(lookupQuery.trim()) || a.patient_name.toLowerCase().includes(lookupQuery.trim().toLowerCase());
      })
    : null;

  const tokensAhead = matchingAppointment ? Math.max(0, matchingAppointment.token_number - servingToken) : null;
  const estimatedWaitMins = tokensAhead !== null ? tokensAhead * (todaySchedule?.slot_duration_mins || 12) : null;

  return (
    <div className="space-y-6">
      {/* Clinic OFF Alert Banner */}
      {isClosedOnDate && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-800" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-200 text-amber-950 uppercase">
                  Clinic is OFF on {selectedDate}
                </span>
                <span className="text-xs font-semibold text-amber-800">
                  ({closureReason})
                </span>
              </div>
              <p className="text-xs text-amber-900/90 mt-0.5">
                The consultation queue is not in session for this date. No new walk-in tokens or visits are currently running.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenBookModal}
            className="px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs shrink-0 cursor-pointer"
          >
            Book Next Open Day
          </button>
        </div>
      )}

      {/* Date Header & Control Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading font-extrabold text-xl text-slate-900 tracking-tight">
              Live Token Queue
            </h2>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${
              activeQueueState.status === 'active' 
                ? 'bg-emerald-100 text-emerald-800' 
                : 'bg-amber-100 text-amber-800'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${activeQueueState.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
              {activeQueueState.status}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time doctor token status • Room 1 • Dr. Kaiser
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <label htmlFor={dateInputId} className="sr-only">Select Date</label>
            <input
              id={dateInputId}
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-0 text-slate-900 font-semibold focus:outline-hidden cursor-pointer"
            />
          </div>

          <button
            onClick={playChime}
            title="Test announcement bell chime"
            className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              hasPlayedChime 
                ? 'bg-teal-600 text-white border-teal-600' 
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
            }`}
          >
            <Volume2 className="w-4 h-4 text-teal-600" />
            <span className="hidden sm:inline">Chime</span>
          </button>
        </div>
      </div>

      {/* Main Queue Showcase Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Big Serving Token Display */}
        <div className="lg:col-span-2 bg-gradient-to-br from-teal-950 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-teal-800/40">
          {/* Decorative background medical rings */}
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-teal-500/10 pointer-events-none blur-2xl"></div>
          <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-cyan-500/10 pointer-events-none blur-2xl"></div>

          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-center sm:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-800/60 border border-teal-600/40 text-teal-300 text-xs font-semibold mb-3">
                <Activity className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
                Active Consultation Room
              </div>
              <h3 className="text-teal-200/80 text-sm font-medium tracking-wide uppercase">
                Now Serving Token Number
              </h3>
              
              <div className="font-heading font-black text-7xl sm:text-8xl tracking-tight text-white my-2 flex items-baseline justify-center sm:justify-start gap-2">
                <span>#{servingToken > 0 ? servingToken : '—'}</span>
                {servingToken > 0 && (
                  <span className="text-sm font-medium text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                    IN ROOM
                  </span>
                )}
              </div>

              {inConsultation ? (
                <div className="text-xs text-teal-200 mt-2 bg-teal-900/50 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-teal-700/50 inline-block">
                  Patient: <span className="font-bold text-white capitalize">{inConsultation.patient_name}</span> ({inConsultation.visit_type === 'new' ? 'New Consultation' : 'Follow-up'})
                </div>
              ) : (
                <div className="text-xs text-teal-300/70 mt-2">
                  {servingToken === 0 ? 'Queue starting shortly. Please take a seat.' : 'Waiting for next patient.'}
                </div>
              )}
            </div>

            {/* Quick stats mini-column */}
            <div className="w-full sm:w-56 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 space-y-3 shrink-0">
              <div className="flex items-center justify-between text-xs">
                <span className="text-teal-200">Total Booked:</span>
                <span className="font-bold text-white text-sm">{dateAppointments.length}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-teal-200">In Waiting Area:</span>
                <span className="font-bold text-amber-300 text-sm">{waitingCount}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-teal-200">Completed Today:</span>
                <span className="font-bold text-emerald-300 text-sm">{completedCount}</span>
              </div>
              <div className="pt-2 border-t border-white/10">
                <button
                  onClick={onOpenBookModal}
                  className="w-full py-2 px-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  Get Token Slip
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Patient Token Position Finder Widget */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <Hourglass className="w-4 h-4" />
              </div>
              <h3 className="font-heading font-bold text-base text-slate-900">
                Check Your Position
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Enter your Token # or phone to see how many patients are ahead and estimated wait time.
            </p>

            <div className="relative mb-3">
              <label htmlFor={searchInputId} className="sr-only">Token or Phone</label>
              <input
                id={searchInputId}
                type="text"
                value={lookupQuery}
                onChange={(e) => setLookupQuery(e.target.value)}
                placeholder="Enter Token # (e.g. 4) or phone..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-hidden"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>

            {matchingAppointment ? (
              <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-teal-700">Token #{matchingAppointment.token_number}</span>
                  <span className="font-bold text-xs capitalize bg-teal-200/60 px-2 py-0.5 rounded text-teal-900">
                    {matchingAppointment.status}
                  </span>
                </div>
                <div className="font-bold text-sm text-slate-900 capitalize">
                  {matchingAppointment.patient_name}
                </div>
                
                <div className="pt-2 border-t border-teal-200/60 text-xs">
                  {matchingAppointment.token_number === servingToken ? (
                    <div className="text-emerald-700 font-extrabold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      It is your turn! Please enter Room 1.
                    </div>
                  ) : matchingAppointment.token_number < servingToken ? (
                    <div className="text-slate-600 font-medium">
                      Consultation completed or passed.
                    </div>
                  ) : (
                    <div>
                      <div className="font-bold text-teal-900">
                        {tokensAhead} {tokensAhead === 1 ? 'patient' : 'patients'} ahead of you
                      </div>
                      <div className="text-teal-700 text-[11px] mt-0.5">
                        Estimated wait: ~{estimatedWaitMins} minutes
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : lookupQuery.trim() ? (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs text-center">
                No matching token found for {selectedDate}.
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs space-y-1">
                <div className="font-semibold text-slate-700">Example Patient:</div>
                <div>Token #4 • Zahra Fatima (Waiting)</div>
                <button 
                  onClick={() => setLookupQuery('4')}
                  className="text-teal-600 hover:text-teal-700 font-semibold underline text-[11px] cursor-pointer"
                >
                  Click to test with Token #4
                </button>
              </div>
            )}
          </div>

          <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Average time per patient:</span>
            <span className="font-bold text-slate-700">{todaySchedule?.slot_duration_mins || 12} mins</span>
          </div>
        </div>
      </div>

      {/* Today's Queue List Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-heading font-bold text-base text-slate-900">
              Today's Consultation Schedule ({selectedDate})
            </h3>
            <p className="text-xs text-slate-500">
              Sequential order of registered patient tokens
            </p>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Showing {dateAppointments.length} patient appointments
          </div>
        </div>

        {dateAppointments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No appointments booked yet for {selectedDate}.
            <div className="mt-3">
              <button
                onClick={onOpenBookModal}
                className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold hover:bg-teal-700"
              >
                Book First Token
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Token #</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">Visit Type</th>
                  <th className="py-3 px-4">Fee Status</th>
                  <th className="py-3 px-4">Queue Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dateAppointments.map((apt) => {
                  const isCurrent = apt.token_number === servingToken;
                  return (
                    <tr
                      key={apt.id}
                      className={`transition-colors ${
                        isCurrent
                          ? 'bg-teal-50/90 font-semibold text-teal-950'
                          : 'hover:bg-slate-50/60'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold font-mono text-sm ${
                            isCurrent
                              ? 'bg-teal-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            #{apt.token_number}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold bg-teal-200/80 text-teal-900 px-1.5 py-0.5 rounded uppercase">
                              Active
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 font-medium">
                        {apt.appointment_time}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 capitalize">{apt.patient_name}</div>
                        {apt.guardian_name && apt.guardian_name !== '-' && (
                          <div className="text-[11px] text-slate-500">c/o {apt.guardian_name}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="capitalize font-medium text-slate-700">
                          {apt.visit_type === 'new' ? 'New Consultation' : 'Follow-up'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {apt.fee_amount === 0 ? (
                          <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Entitlement (₹0)
                          </span>
                        ) : (
                          <span className="font-medium text-slate-700">
                            ₹{apt.fee_amount}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                          apt.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : apt.status === 'in_consultation'
                            ? 'bg-teal-600 text-white animate-pulse'
                            : apt.status === 'waiting'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {apt.status === 'in_consultation' ? 'With Doctor' : apt.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
