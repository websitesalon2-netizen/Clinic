import React, { useState, useId } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Phone, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Printer, 
  Lock, 
  LogOut, 
  Sliders, 
  PlusCircle, 
  RotateCcw,
  Volume2,
  Search,
  Settings,
  ChevronRight,
  ChevronLeft,
  CalendarDays,
  Hash,
  ExternalLink,
  Database,
  TrendingUp,
  FileCheck,
  Stethoscope,
  Trash2,
  Ban,
  Eye,
  EyeOff,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  KeyRound,
  Check,
  Image as ImageIcon
} from 'lucide-react';
import { useClinic, CURRENT_DATE_STRING } from '../context/ClinicContext';
import { ClinicAppointment, AppointmentStatus, PatientFeeEntitlement } from '../types';
import { DatabaseInspector } from './DatabaseInspector';
import { ManagerPictureDesk } from './ManagerPictureDesk';

interface ReceptionDashboardProps {
  onReprintSlip: (apt: ClinicAppointment) => void;
}

const DAYS_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const ReceptionDashboard: React.FC<ReceptionDashboardProps> = ({ onReprintSlip }) => {
  const {
    db,
    receptionLoggedIn,
    loginReception,
    logoutReception,
    changeReceptionPassword,
    selectedDate,
    setSelectedDate,
    activeQueueState,
    servingToken,
    callNextToken,
    callPreviousToken,
    setServingToken,
    setQueueStatus,
    bookAppointment,
    updateAppointmentStatus,
    deleteAppointment,
    cancelAppointment,
    deleteEntitlement,
    recalculateAppointmentTimesForDate,
    toggleDateOffStatus,
    updateSettings,
    updateFeePolicy,
    updateWeeklySchedule,
    setDailyLimitForDate,
    isTodayOff,
    todayOffReason,
    isClinicOpenOnDate,
    getDateClosureReason,
    canUndo,
    lastActionMessage,
    undoLastAction,
    dismissUndoMessage
  } = useClinic();

  // Login form state
  const [loginUsername, setLoginUsername] = useState('DKC@9622229622');
  const [loginPassword, setLoginPassword] = useState('kaiser@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Tab inside reception
  const [activeSubTab, setActiveSubTab] = useState<'queue' | 'timing_fees' | 'walkin' | 'pictures' | 'entitlements' | 'security' | 'db_dump'>('queue');

  // Walk-in form state
  const [walkinName, setWalkinName] = useState('');
  const [walkinGuardian, setWalkinGuardian] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('9622229622');
  const [walkinVisitType, setWalkinVisitType] = useState<'new' | 'follow_up'>('new');
  const [walkinNotes, setWalkinNotes] = useState('');
  const [walkinSuccessMsg, setWalkinSuccessMsg] = useState('');

  // Queue search filter
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Global Reference No. / Cross-Date Patient Lookup
  const [globalRefSearchQuery, setGlobalRefSearchQuery] = useState('');

  // Appointment delete/cancel dialog modal states
  const [cancelModalApt, setCancelModalApt] = useState<ClinicAppointment | null>(null);
  const [cancelReason, setCancelReason] = useState('Patient requested cancellation');
  const [deleteModalApt, setDeleteModalApt] = useState<ClinicAppointment | null>(null);
  const [deleteModalEntitlement, setDeleteModalEntitlement] = useState<PatientFeeEntitlement | null>(null);

  // Date helper methods for date-wise queue navigation
  const getTomorrowDate = () => {
    const d = new Date(CURRENT_DATE_STRING);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const getYesterdayDate = () => {
    const d = new Date(CURRENT_DATE_STRING);
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };

  const shiftSelectedDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // Timing & Fees controls
  const selectedDateObj = new Date(selectedDate);
  const selectedDow = isNaN(selectedDateObj.getTime()) ? 0 : selectedDateObj.getDay();
  const currentDaySchedule = db.weekly_schedule.find((s) => s.day_of_week === selectedDow);

  const [timingStartTime, setTimingStartTime] = useState(currentDaySchedule?.start_time?.slice(0, 5) || '09:00');
  const [timingEndTime, setTimingEndTime] = useState(currentDaySchedule?.end_time?.slice(0, 5) || '17:00');
  const [timingSlotDuration, setTimingSlotDuration] = useState(currentDaySchedule?.slot_duration_mins || 15);
  const [timingRescheduleSuccess, setTimingRescheduleSuccess] = useState<string | null>(null);

  // Day OFF toggle state for selected date
  const isSelectedDateClosed = !isClinicOpenOnDate(selectedDate);
  const [closureReasonInput, setClosureReasonInput] = useState(getDateClosureReason(selectedDate) || 'Clinic Closed / Doctor Off');

  // Fees policy states
  const [tempConsultFee, setTempConsultFee] = useState(db.settings.consultation_fee);
  const [tempFollowFee, setTempFollowFee] = useState(db.settings.follow_up_fee);
  const [tempValidityVisits, setTempValidityVisits] = useState(db.fee_policy.validity_visits);
  const [tempValidityDays, setTempValidityDays] = useState(db.fee_policy.validity_days);
  const [feeSaveSuccess, setFeeSaveSuccess] = useState(false);

  // Password change state
  const [oldPasswordInput, setOldPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [passwordChangeMsg, setPasswordChangeMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const usernameInputId = useId();
  const passwordInputId = useId();
  const walkinPhoneId = useId();
  const walkinNameId = useId();
  const walkinGuardianId = useId();
  const walkinNotesId = useId();
  const filterInputId = useId();
  const consultFeeId = useId();
  const followFeeId = useId();
  const validVisitsId = useId();
  const validDaysId = useId();

  // If not logged in, show password-protected login screen
  if (!receptionLoggedIn) {
    const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      setLoginError('');
      const result = loginReception(loginUsername, loginPassword);
      if (!result.success) {
        setLoginError(result.message || 'Authentication failed. Please verify password.');
      }
    };

    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 text-teal-400 flex items-center justify-center mx-auto mb-4 shadow-md shadow-slate-900/10">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="font-heading font-extrabold text-2xl text-slate-900">
          Reception Desk Sign-In
        </h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          Password-protected console for queue management, patient records, timing & fees control.
        </p>

        {loginError && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{loginError}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <div>
            <label htmlFor={usernameInputId} className="block text-xs font-semibold text-slate-700 mb-1">
              Reception Operator ID
            </label>
            <input
              id={usernameInputId}
              type="text"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              placeholder="DKC@9622229622"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-hidden font-mono"
            />
          </div>

          <div>
            <label htmlFor={passwordInputId} className="block text-xs font-semibold text-slate-700 mb-1">
              Reception Password
            </label>
            <div className="relative">
              <input
                id={passwordInputId}
                type={showPassword ? 'text' : 'password'}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-hidden pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="mt-1.5 p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
              <span>Default password:</span>
              <code className="font-mono font-bold text-teal-800 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                kaiser@2026
              </code>
            </div>
          </div>

          <button
            id="btn-reception-login"
            type="submit"
            className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Authenticate & Unlock Desk
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
          <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
          <span>Dr. Kaiser's Clinic Hospital System</span>
        </div>
      </div>
    );
  }

  // Filtered appointments for active date
  const dateAppointments = db.appointments
    .filter((a) => a.appointment_date === selectedDate)
    .filter((a) => (statusFilter === 'all' ? true : a.status === statusFilter))
    .filter((a) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        a.patient_name.toLowerCase().includes(q) ||
        a.phone.includes(q) ||
        String(a.token_number) === q ||
        (a.entitlement_code && a.entitlement_code.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => a.token_number - b.token_number);

  const handleWalkinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkinName.trim() || !walkinPhone.trim()) {
      return;
    }

    const apt = bookAppointment({
      patient_name: walkinName.trim(),
      guardian_name: walkinGuardian.trim() || '-',
      phone: walkinPhone.trim(),
      appointment_date: selectedDate,
      appointment_time: 'Immediate Walk-in',
      visit_type: walkinVisitType,
      notes: walkinNotes.trim()
    });

    setWalkinSuccessMsg(`Token #${apt.token_number} issued for ${apt.patient_name}! Fee: ₹${apt.fee_amount}`);
    setWalkinName('');
    setWalkinGuardian('');
    setWalkinNotes('');
    onReprintSlip(apt);
    setTimeout(() => setWalkinSuccessMsg(''), 5000);
  };

  // Reschedule existing appointments for the selected date based on new timing
  const handleApplyRescheduledTimings = () => {
    const updatedCount = recalculateAppointmentTimesForDate(
      selectedDate,
      timingStartTime,
      Number(timingSlotDuration)
    );
    setTimingRescheduleSuccess(
      `Successfully rescheduled ${updatedCount} appointments starting at ${timingStartTime} with ${timingSlotDuration}-minute intervals!`
    );
    setTimeout(() => setTimingRescheduleSuccess(null), 6000);
  };

  // Save consultation & follow-up fees
  const handleSaveFees = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      consultation_fee: Number(tempConsultFee),
      follow_up_fee: Number(tempFollowFee)
    });
    updateFeePolicy({
      validity_visits: Number(tempValidityVisits),
      validity_days: Number(tempValidityDays)
    });
    setFeeSaveSuccess(true);
    setTimeout(() => setFeeSaveSuccess(false), 3000);
  };

  // Password change handler
  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeMsg(null);

    if (newPasswordInput !== confirmPasswordInput) {
      setPasswordChangeMsg({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    const res = changeReceptionPassword(oldPasswordInput, newPasswordInput);
    if (res.success) {
      setPasswordChangeMsg({ type: 'success', text: res.message });
      setOldPasswordInput('');
      setNewPasswordInput('');
      setConfirmPasswordInput('');
    } else {
      setPasswordChangeMsg({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* UNDO NOTIFICATION BANNER (Instant mistake recovery) */}
      {lastActionMessage && (
        <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-lg border-2 border-teal-500/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-slate-300 font-medium">Last Reception Action:</div>
              <div className="text-sm font-bold text-white">{lastActionMessage}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={undoLastAction}
              className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              UNDO THIS ACTION
            </button>
            <button
              onClick={dismissUndoMessage}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Reception Top Bar */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading font-extrabold text-lg text-white">
                Reception Desk Console
              </h2>
              <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                Password Protected
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Operator: <span className="font-mono text-teal-300">DKC@9622229622</span> • System Date: {selectedDate}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Sub Navigation */}
          <div className="bg-slate-800 p-1 rounded-xl flex items-center gap-1 text-xs">
            <button
              onClick={() => setActiveSubTab('queue')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeSubTab === 'queue' ? 'bg-teal-600 text-white font-semibold' : 'text-slate-300 hover:text-white'
              }`}
            >
              Queue Deck
            </button>
            <button
              onClick={() => setActiveSubTab('timing_fees')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                activeSubTab === 'timing_fees' ? 'bg-teal-600 text-white font-semibold' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Clock className="w-3 h-3" />
              Timing & Fees
            </button>
            <button
              onClick={() => setActiveSubTab('walkin')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeSubTab === 'walkin' ? 'bg-teal-600 text-white font-semibold' : 'text-slate-300 hover:text-white'
              }`}
            >
              + Walk-in
            </button>
            <button
              id="btn-reception-tab-pictures"
              onClick={() => setActiveSubTab('pictures')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                activeSubTab === 'pictures' ? 'bg-teal-600 text-white font-semibold' : 'text-slate-300 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3 h-3 text-teal-300" />
              Pictures Desk ({db.gallery?.length || 0})
            </button>
            <button
              onClick={() => setActiveSubTab('entitlements')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeSubTab === 'entitlements' ? 'bg-teal-600 text-white font-semibold' : 'text-slate-300 hover:text-white'
              }`}
            >
              Entitlements ({db.entitlements.length})
            </button>
            <button
              onClick={() => setActiveSubTab('db_dump')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                activeSubTab === 'db_dump' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Database className="w-3 h-3 text-cyan-300" />
              DB Dump
            </button>
            <button
              onClick={() => setActiveSubTab('security')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                activeSubTab === 'security' ? 'bg-teal-600 text-white font-semibold' : 'text-slate-300 hover:text-white'
              }`}
            >
              <KeyRound className="w-3 h-3" />
              Password
            </button>
          </div>

          <button
            onClick={logoutReception}
            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 transition-colors cursor-pointer"
            title="Lock & Log out Reception Desk"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: QUEUE DECK & TOKEN CONTROLLER WITH MISTAKE RECOVERY */}
      {activeSubTab === 'queue' && (
        <div className="space-y-6">
          {/* 1. DATE-WISE QUEUE SELECTOR (Today, Tomorrow, Pick Date) */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-100">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Queue Date View</span>
                  {selectedDate === CURRENT_DATE_STRING ? (
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      TODAY
                    </span>
                  ) : selectedDate === getTomorrowDate() ? (
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                      TOMORROW
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                      SELECTED DATE
                    </span>
                  )}
                  {!isClinicOpenOnDate(selectedDate) && (
                    <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">
                      CLINIC OFF
                    </span>
                  )}
                </div>
                <h3 className="font-heading font-extrabold text-base text-slate-900 flex items-center gap-2 mt-0.5">
                  <span>
                    {new Date(selectedDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                  <span className="text-xs font-normal text-slate-500 font-sans">
                    ({dateAppointments.length} patients scheduled)
                  </span>
                </h3>
              </div>
            </div>

            {/* Quick Date Stepper & Picker */}
            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
              <div className="inline-flex rounded-xl border border-slate-200 p-1 bg-slate-50 shadow-xs">
                <button
                  type="button"
                  onClick={() => shiftSelectedDate(-1)}
                  className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 cursor-pointer transition-colors"
                  title="Previous Day"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDate(CURRENT_DATE_STRING)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    selectedDate === CURRENT_DATE_STRING ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:bg-white'
                  }`}
                >
                  Today (13 Sep)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDate(getTomorrowDate())}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    selectedDate === getTomorrowDate() ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:bg-white'
                  }`}
                >
                  Tomorrow (14 Sep)
                </button>
                <button
                  type="button"
                  onClick={() => shiftSelectedDate(1)}
                  className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 cursor-pointer transition-colors"
                  title="Next Day"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-xs">
                <Calendar className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-xs font-medium text-slate-700 bg-transparent border-none outline-hidden cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* 2. GLOBAL REFERENCE NUMBER & APPOINTMENT DATE LOOKUP (Cross-Date Search) */}
          <div className="bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
                  <Hash className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-sm text-white">
                    Reference Number & Date Lookup
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Find on what date any patient has taken an appointment across all dates
                  </p>
                </div>
              </div>
              {globalRefSearchQuery && (
                <button
                  onClick={() => setGlobalRefSearchQuery('')}
                  className="text-xs text-teal-400 hover:text-teal-300 font-medium cursor-pointer"
                >
                  Clear search
                </button>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                value={globalRefSearchQuery}
                onChange={(e) => setGlobalRefSearchQuery(e.target.value)}
                placeholder="Enter Reference # (e.g. DKC-MT...), Entitlement Code, Phone, or Patient Name..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-hidden"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>

            {/* Cross-Date Lookup Results */}
            {globalRefSearchQuery.trim() !== '' && (
              <div className="mt-4 pt-4 border-t border-slate-800 space-y-2.5">
                {(() => {
                  const q = globalRefSearchQuery.toLowerCase().trim();
                  const matches = db.appointments.filter((apt) => 
                    apt.patient_name.toLowerCase().includes(q) ||
                    apt.phone.includes(q) ||
                    (apt.entitlement_code && apt.entitlement_code.toLowerCase().includes(q)) ||
                    (apt.notes && apt.notes.toLowerCase().includes(q)) ||
                    String(apt.id).includes(q) ||
                    String(apt.token_number) === q
                  );

                  if (matches.length === 0) {
                    return (
                      <div className="p-4 rounded-xl bg-slate-800/60 text-center text-xs text-slate-400">
                        No appointments found matching "<span className="text-teal-300 font-mono">{globalRefSearchQuery}</span>" across the clinic records.
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2">
                      <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                        <span>Found {matches.length} matching appointment(s):</span>
                        <span className="text-teal-400">Click to switch Queue Date or Reprint Slip</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {matches.map((apt) => {
                          const isMatchDateToday = apt.appointment_date === CURRENT_DATE_STRING;
                          const isMatchDateTomorrow = apt.appointment_date === getTomorrowDate();
                          const isCurrentActiveQueueDate = apt.appointment_date === selectedDate;

                          return (
                            <div
                              key={apt.id}
                              className={`p-3.5 rounded-2xl border transition-all ${
                                isCurrentActiveQueueDate
                                  ? 'bg-slate-800 border-teal-500/60 shadow-xs'
                                  : 'bg-slate-800/80 border-slate-700 hover:border-slate-600'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono font-bold text-teal-300 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-800/60">
                                      Token #{apt.token_number}
                                    </span>
                                    {apt.entitlement_code ? (
                                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50">
                                        {apt.entitlement_code}
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded">
                                        Ref: #{apt.id}
                                      </span>
                                    )}
                                  </div>
                                  <div className="font-bold text-white text-sm mt-1">
                                    {apt.patient_name}
                                  </div>
                                  <div className="text-[11px] text-slate-400">
                                    Phone: {apt.phone}
                                  </div>
                                </div>

                                {/* Prominent Appointment Date Badge */}
                                <div className="text-right shrink-0">
                                  <div className="text-[10px] uppercase font-semibold text-slate-400">
                                    Appointment Date
                                  </div>
                                  <div className={`text-xs font-bold px-2 py-1 rounded-lg mt-0.5 inline-block ${
                                    isMatchDateToday
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                      : isMatchDateTomorrow
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                      : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                                  }`}>
                                    📅 {apt.appointment_date}
                                    {isMatchDateToday ? ' (Today)' : isMatchDateTomorrow ? ' (Tomorrow)' : ''}
                                  </div>
                                  <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                                    {apt.appointment_time?.slice(0, 5) || '09:15 AM'}
                                  </div>
                                </div>
                              </div>

                              <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between gap-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                                  apt.status === 'completed'
                                    ? 'bg-emerald-900/60 text-emerald-300'
                                    : apt.status === 'in_consultation'
                                    ? 'bg-blue-900/60 text-blue-300'
                                    : apt.status === 'cancelled'
                                    ? 'bg-rose-900/60 text-rose-300'
                                    : 'bg-amber-900/60 text-amber-300'
                                }`}>
                                  {apt.status.replace('_', ' ')}
                                </span>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => onReprintSlip(apt)}
                                    className="px-2 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                    title="Print token slip"
                                  >
                                    <Printer className="w-3 h-3" />
                                    Slip
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedDate(apt.appointment_date);
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                                    title="Open this date's Queue in Queue Deck"
                                  >
                                    <Calendar className="w-3 h-3" />
                                    <span>View {apt.appointment_date} Queue</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Quick Token Calling Controls */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Active Consultation Control
                </span>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-xs text-slate-500 font-medium">Currently Serving:</span>
                  <span className="font-heading font-black text-4xl text-teal-900">
                    Token #{servingToken}
                  </span>
                </div>
              </div>

              {/* Action Buttons with UNDO option */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={callPreviousToken}
                  disabled={servingToken <= 0}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40 text-xs font-semibold cursor-pointer"
                >
                  Previous
                </button>
                <button
                  onClick={callNextToken}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  Call Next Patient (#{servingToken + 1})
                </button>

                {/* UNDO LAST ACTION BUTTON */}
                <button
                  onClick={undoLastAction}
                  disabled={!canUndo}
                  title="Undo last action if clicked mistakenly"
                  className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    canUndo 
                      ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 shadow-xs' 
                      : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Undo
                </button>

                <button
                  onClick={() => setServingToken(0)}
                  className="p-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs cursor-pointer"
                  title="Reset token serving to 0"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Queue State Selector */}
            <div className="pt-4 flex items-center justify-between flex-wrap gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Queue Status:</span>
                <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                  <button
                    onClick={() => setQueueStatus('active')}
                    className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                      activeQueueState.status === 'active' ? 'bg-emerald-600 text-white' : 'text-slate-600'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setQueueStatus('paused')}
                    className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                      activeQueueState.status === 'paused' ? 'bg-amber-500 text-white' : 'text-slate-600'
                    }`}
                  >
                    Paused
                  </button>
                  <button
                    onClick={() => setQueueStatus('closed')}
                    className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                      activeQueueState.status === 'closed' ? 'bg-rose-600 text-white' : 'text-slate-600'
                    }`}
                  >
                    Closed
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500">Jump to Token #:</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={servingToken}
                  onChange={(e) => setServingToken(Number(e.target.value))}
                  className="w-16 px-2 py-1 border border-slate-300 rounded-lg text-center font-bold font-mono text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Appointments Table with Delete, Cancel, and Mistake Corrections */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-bold text-base text-slate-900">
                  Registered Patients Queue
                </h3>
                <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-full">
                  {dateAppointments.length} Total
                </span>
              </div>

              {/* Status Filters & Search */}
              <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                <div className="relative">
                  <label htmlFor={filterInputId} className="sr-only">Filter Patient</label>
                  <input
                    id={filterInputId}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name/phone/token..."
                    className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs w-44 focus:w-56 transition-all"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs bg-white text-slate-700 font-medium"
                >
                  <option value="all">All Statuses</option>
                  <option value="waiting">Waiting</option>
                  <option value="in_consultation">In Consultation</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="no_show">No Show</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Token & Time</th>
                    <th className="py-3 px-4">Patient & Contact</th>
                    <th className="py-3 px-4">Visit / Entitlement</th>
                    <th className="py-3 px-4">Fee Paid</th>
                    <th className="py-3 px-4">Change Status</th>
                    <th className="py-3 px-4 text-right">Actions (Cancel / Delete / Print)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dateAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No appointments found matching the current filters.
                      </td>
                    </tr>
                  ) : (
                    dateAppointments.map((apt) => (
                      <tr
                        key={apt.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          apt.token_number === servingToken ? 'bg-teal-50/80 font-medium' : ''
                        } ${apt.status === 'cancelled' ? 'opacity-60 bg-slate-50/50' : ''}`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-slate-900 bg-slate-100 px-2 py-1 rounded">
                              #{apt.token_number}
                            </span>
                            <span className="text-[11px] font-medium text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                              {apt.appointment_time}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 capitalize">{apt.patient_name}</div>
                          <div className="text-[11px] text-slate-500">
                            {apt.phone} {apt.guardian_name && apt.guardian_name !== '-' && `• c/o ${apt.guardian_name}`}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="capitalize font-medium text-slate-700">
                            {apt.visit_type === 'new' ? 'New Consultation' : 'Follow-up'}
                          </div>
                          {apt.entitlement_code && (
                            <div className="font-mono text-[10px] text-teal-700 font-semibold">
                              {apt.entitlement_code}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold">
                          {apt.fee_amount === 0 ? (
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Covered (₹0)
                            </span>
                          ) : (
                            <span className="text-slate-800">₹{apt.fee_amount}</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {/* Status dropdown allows immediate status change if clicked wrong patient */}
                          <select
                            value={apt.status}
                            onChange={(e) => updateAppointmentStatus(apt.id, e.target.value as AppointmentStatus)}
                            className={`px-2 py-1 rounded-lg text-xs font-semibold cursor-pointer border ${
                              apt.status === 'completed'
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                : apt.status === 'in_consultation'
                                ? 'bg-teal-600 border-teal-700 text-white'
                                : apt.status === 'waiting'
                                ? 'bg-amber-50 border-amber-300 text-amber-800'
                                : apt.status === 'cancelled'
                                ? 'bg-rose-50 border-rose-300 text-rose-800'
                                : 'bg-slate-100 border-slate-300 text-slate-700'
                            }`}
                          >
                            <option value="waiting">Waiting</option>
                            <option value="in_consultation">In Room</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="no_show">No Show</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {apt.status === 'waiting' && (
                              <button
                                onClick={() => {
                                  setServingToken(apt.token_number);
                                  updateAppointmentStatus(apt.id, 'in_consultation');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-teal-600 text-white hover:bg-teal-700 text-[11px] font-semibold cursor-pointer"
                                title="Call this patient now"
                              >
                                Call Now
                              </button>
                            )}

                            {/* CANCEL BUTTON */}
                            {apt.status !== 'cancelled' && (
                              <button
                                onClick={() => setCancelModalApt(apt)}
                                className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                                title="Cancel this appointment"
                              >
                                <Ban className="w-3 h-3" />
                                Cancel
                              </button>
                            )}

                            {/* DELETE BUTTON */}
                            <button
                              onClick={() => setDeleteModalApt(apt)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                              title="Delete appointment permanently"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            {/* REPRINT SLIP */}
                            <button
                              onClick={() => onReprintSlip(apt)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 cursor-pointer"
                              title="Reprint Token Voucher"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: TIMING & FEES CONTROL (EXCLUSIVE TO RECEPTIONIST) */}
      {activeSubTab === 'timing_fees' && (
        <div className="space-y-6">
          {/* Top Info Banner */}
          <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 text-teal-900 flex items-start gap-3">
            <Clock className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-heading font-bold text-sm">
                Reception Authority: Clinic Timing, Rescheduling & Fees Control
              </h3>
              <p className="text-xs text-teal-800/90 mt-0.5">
                All consultation timings, fees, validity policies, and emergency clinic closure status are exclusively controlled from this Reception Desk. When you adjust timings, you can instantly re-sequence all existing patient appointments.
              </p>
            </div>
          </div>

          {/* SECTION 1: TODAY'S TIMING & DYNAMIC APPOINTMENT RESCHEDULING */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                  Live Timing & Schedule Synchronization
                </span>
                <h3 className="font-heading font-extrabold text-xl text-slate-900 mt-0.5">
                  Adjust Hours for {selectedDate} ({DAYS_NAMES[selectedDow]})
                </h3>
                <p className="text-xs text-slate-500">
                  Changing timings recalculates every appointment's scheduled consultation time automatically.
                </p>
              </div>

              {/* Emergency Clinic OFF Toggle */}
              <div className="p-3 rounded-2xl border border-rose-200 bg-rose-50 flex items-center gap-3">
                <div>
                  <div className="text-xs font-bold text-rose-900">
                    Clinic Status: {isSelectedDateClosed ? 'OFF TODAY' : 'OPEN'}
                  </div>
                  <div className="text-[11px] text-rose-700">
                    {isSelectedDateClosed ? 'Closed for OPD' : 'Operating normally'}
                  </div>
                </div>
                <button
                  onClick={() => toggleDateOffStatus(selectedDate, !isSelectedDateClosed, closureReasonInput)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-all ${
                    isSelectedDateClosed
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-rose-600 hover:bg-rose-700 text-white'
                  }`}
                >
                  {isSelectedDateClosed ? 'Reopen Clinic Today' : 'Mark Clinic OFF Today'}
                </button>
              </div>
            </div>

            {isSelectedDateClosed && (
              <div className="mt-4 p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <div className="flex-1">
                  <strong>Notice displayed to patients:</strong> "Clinic is OFF Today ({getDateClosureReason(selectedDate)})".
                </div>
                <input
                  type="text"
                  value={closureReasonInput}
                  onChange={(e) => setClosureReasonInput(e.target.value)}
                  onBlur={() => toggleDateOffStatus(selectedDate, true, closureReasonInput)}
                  placeholder="Reason (e.g. Doctor on emergency rounds)"
                  className="bg-white px-2 py-1 rounded border border-amber-300 text-xs w-64 text-amber-950 font-medium"
                />
              </div>
            )}

            {/* Timings Reschedule Form */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  OPD Start Time (e.g. 09:00, 10:30)
                </label>
                <input
                  type="time"
                  value={timingStartTime}
                  onChange={(e) => setTimingStartTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 font-mono"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  First patient token starts at this time
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  OPD End Time
                </label>
                <input
                  type="time"
                  value={timingEndTime}
                  onChange={(e) => setTimingEndTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Slot Duration (Minutes per Token)
                </label>
                <select
                  value={timingSlotDuration}
                  onChange={(e) => setTimingSlotDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold text-slate-900"
                >
                  <option value={10}>10 minutes</option>
                  <option value={15}>15 minutes (Standard)</option>
                  <option value={20}>20 minutes (Detailed)</option>
                  <option value={30}>30 minutes</option>
                </select>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Spacing between sequential tokens
                </span>
              </div>
            </div>

            {/* ACTION BUTTON: Apply to existing appointments */}
            <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-slate-700">
                  {dateAppointments.length} Appointments Booked for {selectedDate}
                </div>
                <div className="text-[11px] text-slate-500">
                  Click below to recalculate every appointment's time according to the new start time ({timingStartTime}).
                </div>
              </div>

              <button
                id="btn-recalculate-timings"
                onClick={handleApplyRescheduledTimings}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Clock className="w-4 h-4" />
                Apply & Resequence Appointment Timings
              </button>
            </div>

            {timingRescheduleSuccess && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{timingRescheduleSuccess}</span>
              </div>
            )}
          </div>

          {/* SECTION 2: FEES AND ENTITLEMENT POLICY CONTROL */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
            <div className="pb-4 border-b border-slate-100 mb-6">
              <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                Fee & Entitlement Settings
              </span>
              <h3 className="font-heading font-extrabold text-xl text-slate-900 mt-0.5">
                Outpatient Consultation & Follow-up Charges
              </h3>
            </div>

            {feeSaveSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Fees and entitlement policies updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleSaveFees} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor={consultFeeId} className="block font-semibold text-slate-700 mb-1">
                    New Consultation Fee (₹)
                  </label>
                  <input
                    id={consultFeeId}
                    type="number"
                    value={tempConsultFee}
                    onChange={(e) => setTempConsultFee(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">Default: ₹500</span>
                </div>

                <div>
                  <label htmlFor={followFeeId} className="block font-semibold text-slate-700 mb-1">
                    Follow-up Fee (After Exhaustion) (₹)
                  </label>
                  <input
                    id={followFeeId}
                    type="number"
                    value={tempFollowFee}
                    onChange={(e) => setTempFollowFee(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">Default: ₹300</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor={validVisitsId} className="block font-semibold text-slate-700 mb-1">
                    Included Visits per Consultation Entitlement
                  </label>
                  <input
                    id={validVisitsId}
                    type="number"
                    value={tempValidityVisits}
                    onChange={(e) => setTempValidityVisits(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">Standard policy: 2 visits</span>
                </div>

                <div>
                  <label htmlFor={validDaysId} className="block font-semibold text-slate-700 mb-1">
                    Entitlement Validity Window (Days)
                  </label>
                  <input
                    id={validDaysId}
                    type="number"
                    value={tempValidityDays}
                    onChange={(e) => setTempValidityDays(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">Standard policy: 15 days</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Save Fee & Policy Changes
              </button>
            </form>
          </div>

          {/* SECTION 3: WEEKLY TIMETABLE MANAGER (7 DAYS) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
            <div className="pb-4 border-b border-slate-100 mb-4">
              <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                Doctor Timetable Configuration
              </span>
              <h3 className="font-heading font-extrabold text-xl text-slate-900 mt-0.5">
                Weekly Operating Days & Patient Intake Limits
              </h3>
            </div>

            <div className="divide-y divide-slate-100">
              {db.weekly_schedule.map((ws) => (
                <div key={ws.day_of_week} className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="w-32">
                    <span className="font-bold text-sm text-slate-900">{DAYS_NAMES[ws.day_of_week]}</span>
                    <div className="text-[11px] text-slate-500">
                      {ws.is_open ? 'Open' : 'Routine Off'}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ws.is_open}
                        onChange={(e) => updateWeeklySchedule(ws.day_of_week, { is_open: e.target.checked })}
                        className="rounded text-teal-600 focus:ring-teal-500"
                      />
                      <span className="font-semibold text-slate-700">Open Day</span>
                    </label>

                    {ws.is_open && (
                      <>
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400">Hours:</span>
                          <input
                            type="time"
                            value={ws.start_time?.slice(0, 5) || '09:00'}
                            onChange={(e) => updateWeeklySchedule(ws.day_of_week, { start_time: `${e.target.value}:00` })}
                            className="px-2 py-1 rounded border border-slate-300 font-mono font-bold"
                          />
                          <span className="text-slate-400">to</span>
                          <input
                            type="time"
                            value={ws.end_time?.slice(0, 5) || '17:00'}
                            onChange={(e) => updateWeeklySchedule(ws.day_of_week, { end_time: `${e.target.value}:00` })}
                            className="px-2 py-1 rounded border border-slate-300 font-mono font-bold"
                          />
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="text-slate-400">Slot:</span>
                          <select
                            value={ws.slot_duration_mins}
                            onChange={(e) => updateWeeklySchedule(ws.day_of_week, { slot_duration_mins: Number(e.target.value) })}
                            className="px-2 py-1 rounded border border-slate-300 font-medium"
                          >
                            <option value={10}>10m</option>
                            <option value={15}>15m</option>
                            <option value={20}>20m</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="text-slate-400">Max Patients:</span>
                          <input
                            type="number"
                            value={ws.max_patients}
                            onChange={(e) => updateWeeklySchedule(ws.day_of_week, { max_patients: Number(e.target.value) })}
                            className="w-14 px-2 py-1 rounded border border-slate-300 font-bold text-center"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: RAPID WALK-IN REGISTRATION */}
      {activeSubTab === 'walkin' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <PlusCircle className="w-4 h-4" />
            </div>
            <h3 className="font-heading font-bold text-lg text-slate-900">
              Front Desk Walk-in Registration
            </h3>
          </div>
          <p className="text-xs text-slate-500 mb-6">
            Quickly register a patient standing at the counter and generate an instant token slip.
          </p>

          {walkinSuccessMsg && (
            <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{walkinSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleWalkinSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor={walkinPhoneId} className="block font-semibold text-slate-700 mb-1">
                  Mobile Number (Required)
                </label>
                <input
                  id={walkinPhoneId}
                  type="tel"
                  value={walkinPhone}
                  onChange={(e) => setWalkinPhone(e.target.value)}
                  placeholder="9622229622"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium focus:ring-2 focus:ring-teal-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Visit Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className={`px-3 py-2 rounded-xl border text-center cursor-pointer ${walkinVisitType === 'new' ? 'bg-teal-50 border-teal-600 font-bold text-teal-900' : 'border-slate-200'}`}>
                    <span>New (₹{db.settings.consultation_fee})</span>
                    <input type="radio" name="walkinType" checked={walkinVisitType === 'new'} onChange={() => setWalkinVisitType('new')} className="sr-only" />
                  </label>
                  <label className={`px-3 py-2 rounded-xl border text-center cursor-pointer ${walkinVisitType === 'follow_up' ? 'bg-teal-50 border-teal-600 font-bold text-teal-900' : 'border-slate-200'}`}>
                    <span>Follow-up (₹0/{db.settings.follow_up_fee})</span>
                    <input type="radio" name="walkinType" checked={walkinVisitType === 'follow_up'} onChange={() => setWalkinVisitType('follow_up')} className="sr-only" />
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor={walkinNameId} className="block font-semibold text-slate-700 mb-1">
                  Patient Full Name
                </label>
                <input
                  id={walkinNameId}
                  type="text"
                  value={walkinName}
                  onChange={(e) => setWalkinName(e.target.value)}
                  placeholder="e.g. Talib Haider"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium focus:ring-2 focus:ring-teal-500 outline-hidden capitalize"
                />
              </div>

              <div>
                <label htmlFor={walkinGuardianId} className="block font-semibold text-slate-700 mb-1">
                  Guardian / Spouse / Parent
                </label>
                <input
                  id={walkinGuardianId}
                  type="text"
                  value={walkinGuardian}
                  onChange={(e) => setWalkinGuardian(e.target.value)}
                  placeholder="e.g. Sajjad Hussain"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium focus:ring-2 focus:ring-teal-500 outline-hidden capitalize"
                />
              </div>
            </div>

            <div>
              <label htmlFor={walkinNotesId} className="block font-semibold text-slate-700 mb-1">
                Clinical Reason / Notes (Optional)
              </label>
              <input
                id={walkinNotesId}
                type="text"
                value={walkinNotes}
                onChange={(e) => setWalkinNotes(e.target.value)}
                placeholder="e.g. BP follow-up, chest congestion review"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium focus:ring-2 focus:ring-teal-500 outline-hidden"
              />
            </div>

            <button
              id="btn-register-walkin"
              type="submit"
              className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              <Printer className="w-4 h-4" />
              Register Patient & Print Token Slip
            </button>
          </form>
        </div>
      )}

      {/* SUB-TAB 4: ENTITLEMENTS MASTER LEDGER (ALL 23 RECORDS FROM DB) */}
      {activeSubTab === 'entitlements' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-base text-slate-900">
                Patient Fee Entitlements Database ({db.entitlements.length})
              </h3>
              <p className="text-xs text-slate-500">
                PostgreSQL table: <code className="font-mono text-teal-700">patient_fee_entitlements</code>
              </p>
            </div>
            <span className="text-xs text-slate-500">
              15-Day Policy Tracking
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Patient & Contact</th>
                  <th className="py-3 px-4">Guardian</th>
                  <th className="py-3 px-4">Validity Period</th>
                  <th className="py-3 px-4">Visits Used</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {db.entitlements.map((ent) => (
                  <tr key={ent.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-teal-800 text-[11px]">
                      {ent.entitlement_code}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{ent.patient_name}</div>
                      <div className="text-[11px] text-slate-500">{ent.phone}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{ent.guardian_name}</td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      {ent.valid_from} to {ent.valid_until}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">
                        {ent.used_visits} / {ent.allowed_visits}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        ent.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {ent.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setDeleteModalEntitlement(ent)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                        title={`Delete Entitlement ${ent.entitlement_code}`}
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB: DB DUMP & POSTGRESQL INSPECTOR */}
      {activeSubTab === 'db_dump' && (
        <div className="space-y-4">
          <DatabaseInspector />
        </div>
      )}

      {/* SUB-TAB 5: RECEPTION SECURITY & PASSWORD MANAGEMENT */}
      {activeSubTab === 'security' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs max-w-md mx-auto">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-teal-400 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <h3 className="font-heading font-bold text-lg text-slate-900">
              Reception Password Protection
            </h3>
          </div>
          <p className="text-xs text-slate-500 mb-6">
            Ensure only authorized reception desk operators can access clinic controls, timings, and fees.
          </p>

          {passwordChangeMsg && (
            <div className={`mb-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              passwordChangeMsg.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {passwordChangeMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{passwordChangeMsg.text}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={oldPasswordInput}
                onChange={(e) => setOldPasswordInput(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-teal-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                placeholder="At least 4 characters"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-teal-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPasswordInput}
                onChange={(e) => setConfirmPasswordInput(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-teal-500 outline-hidden"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer mt-2"
            >
              Update Reception Password
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Operator: DKC@9622229622</span>
            <button
              onClick={logoutReception}
              className="text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
            >
              Lock Desk Now
            </button>
          </div>
        </div>
      )}

      {/* SUB-TAB 7: MANAGER PICTURES & MILESTONES DESK */}
      {activeSubTab === 'pictures' && (
        <div className="space-y-4">
          <ManagerPictureDesk />
        </div>
      )}

      {/* CONFIRMATION MODAL: CANCEL APPOINTMENT */}
      {cancelModalApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white max-w-sm w-full rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                <Ban className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-base text-slate-900">Cancel Appointment</h4>
                <p className="text-xs text-slate-500">Token #{cancelModalApt.token_number} • {cancelModalApt.patient_name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to cancel this appointment? The slot will be marked as cancelled, and entitlement visits will be restored.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Cancellation Reason</label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setCancelModalApt(null)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Keep Appointment
              </button>
              <button
                onClick={() => {
                  cancelAppointment(cancelModalApt.id, cancelReason);
                  setCancelModalApt(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm cursor-pointer"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: DELETE APPOINTMENT */}
      {deleteModalApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white max-w-sm w-full rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-base text-slate-900">Delete Permanently</h4>
                <p className="text-xs text-slate-500">Token #{deleteModalApt.token_number} • {deleteModalApt.patient_name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              This will permanently remove this record from the clinic database. If you mistakenly clicked the wrong patient, you can always click <strong>UNDO</strong> in the top banner.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteModalApt(null)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteAppointment(deleteModalApt.id);
                  setDeleteModalApt(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shadow-sm cursor-pointer"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: DELETE ENTITLEMENT */}
      {deleteModalEntitlement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white max-w-sm w-full rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-base text-slate-900">Delete Entitlement</h4>
                <p className="text-xs text-slate-500">{deleteModalEntitlement.entitlement_code} • {deleteModalEntitlement.patient_name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to delete this 15-day fee entitlement? The record will be permanently deleted from the database. (If mistakenly clicked, you can use the <strong>Undo</strong> button).
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <div><strong>Patient:</strong> {deleteModalEntitlement.patient_name}</div>
              <div><strong>Phone:</strong> {deleteModalEntitlement.phone}</div>
              <div><strong>Validity:</strong> {deleteModalEntitlement.valid_from} to {deleteModalEntitlement.valid_until}</div>
              <div><strong>Used Visits:</strong> {deleteModalEntitlement.used_visits} / {deleteModalEntitlement.allowed_visits}</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteModalEntitlement(null)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteEntitlement(deleteModalEntitlement.id);
                  setDeleteModalEntitlement(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shadow-sm cursor-pointer"
              >
                Delete Entitlement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
