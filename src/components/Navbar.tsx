import React from 'react';
import { 
  Stethoscope, 
  Clock, 
  Phone, 
  Users, 
  FileCheck, 
  ShieldCheck, 
  CalendarCheck2,
  Image as ImageIcon,
  Code,
  Sparkles,
  Megaphone
} from 'lucide-react';
import { useClinic, CURRENT_DATE_STRING } from '../context/ClinicContext';

export type ActiveTab = 'home' | 'queue' | 'book' | 'entitlements' | 'gallery' | 'schedule' | 'reception' | 'developer' | 'database';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenBookModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenBookModal }) => {
  const { todaySchedule, receptionLoggedIn, developerLoggedIn, selectedDate, isTodayOff, todayOffReason, db } = useClinic();
  const siteConfig = db.site_config;

  const isOpenToday = !isTodayOff && todaySchedule?.is_open;
  const timingText = isOpenToday
    ? `${todaySchedule?.start_time?.slice(0, 5)} - ${todaySchedule?.end_time?.slice(0, 5)}`
    : `Closed Today (${todayOffReason || 'Off'})`;

  const clinicName = siteConfig?.clinic_name || "Dr. Kaiser's Clinic";
  const doctorSpecialties = siteConfig?.doctor_specialties || "Consultant Physician & Family Healthcare";
  const primaryPhone = siteConfig?.primary_phone || "9622229622";
  const emergencyPhone = siteConfig?.emergency_phone || "+91 96222 29622";

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Dynamic Announcement Banner if enabled */}
      {siteConfig?.show_announcement && siteConfig?.announcement_banner && (
        <div className="bg-gradient-to-r from-teal-900 via-indigo-950 to-teal-900 text-teal-100 text-xs py-1.5 px-4 text-center font-medium border-b border-teal-800/40 flex items-center justify-center gap-2">
          <Megaphone className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-bounce" />
          <span className="line-clamp-1">{siteConfig.announcement_banner}</span>
        </div>
      )}

      {/* Top Banner with clinic contact & status */}
      <div className={`text-xs py-1 px-4 sm:px-6 transition-colors ${
        isOpenToday 
          ? 'bg-gradient-to-r from-teal-950 via-teal-900 to-slate-900 text-teal-100' 
          : 'bg-gradient-to-r from-amber-950 via-amber-900 to-slate-900 text-amber-100'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isOpenToday ? 'bg-emerald-400 opacity-75' : 'bg-amber-400 opacity-75'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isOpenToday ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              </span>
              {isOpenToday ? `OPD Open Today: ${timingText}` : `Clinic OFF Today (${todayOffReason || 'Closed'})`}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <a 
              href={`tel:${primaryPhone}`} 
              className="flex items-center gap-1 text-teal-100 hover:text-white transition-colors font-medium bg-teal-800/60 px-2 py-0.5 rounded text-[11px]"
            >
              <Phone className="w-3 h-3 text-teal-300" />
              Reception: {emergencyPhone}
            </a>
            <span className="text-teal-300/40 hidden sm:inline">|</span>
            <span className="text-teal-300 font-mono text-[11px] hidden sm:inline">Date: {selectedDate}</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Dynamic Logo & Clinic Title */}
          <div 
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => setActiveTab('home')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-600 flex items-center justify-center text-white shadow-sm shadow-teal-600/20 overflow-hidden shrink-0">
              {siteConfig?.logo_url ? (
                <img
                  src={siteConfig.logo_url}
                  alt={clinicName}
                  className="w-full h-full object-contain p-0.5"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Stethoscope className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-extrabold text-base sm:text-lg text-slate-900 tracking-tight leading-none line-clamp-1">
                  {clinicName}
                </h1>
                <span className="text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200/60 rounded px-1.5 py-0.5 uppercase tracking-wider hidden sm:inline">
                  DKC
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-none mt-1 line-clamp-1 max-w-[260px] sm:max-w-sm">
                {doctorSpecialties}
              </p>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium">
            <button
              id="nav-tab-home"
              onClick={() => setActiveTab('home')}
              className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'home'
                  ? 'bg-teal-50 text-teal-800 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Home
            </button>

            <button
              id="nav-tab-queue"
              onClick={() => setActiveTab('queue')}
              className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'queue'
                  ? 'bg-teal-50 text-teal-800 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-4 h-4 text-teal-600" />
              Live Queue
            </button>

            <button
              id="nav-tab-entitlements"
              onClick={() => setActiveTab('entitlements')}
              className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'entitlements'
                  ? 'bg-teal-50 text-teal-800 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileCheck className="w-4 h-4 text-teal-600" />
              Entitlement Check
            </button>

            {/* Reception Desk */}
            <button
              id="nav-tab-reception"
              onClick={() => setActiveTab('reception')}
              className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'reception'
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Reception Desk</span>
              {receptionLoggedIn && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" title="Reception Authenticated" />
              )}
            </button>
          </nav>

          {/* Quick Action Button */}
          <div className="flex items-center gap-2">
            <button
              id="btn-book-token-nav"
              onClick={onOpenBookModal}
              className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-medium text-sm flex items-center gap-2 shadow-sm shadow-teal-600/20 transition-all cursor-pointer"
            >
              <CalendarCheck2 className="w-4 h-4" />
              <span>Book Appointment</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex lg:hidden overflow-x-auto py-2 gap-1 border-t border-slate-100 no-scrollbar">
          <button
            onClick={() => setActiveTab('home')}
            className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium ${
              activeTab === 'home' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium flex items-center gap-1 ${
              activeTab === 'queue' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Queue
          </button>
          <button
            onClick={() => setActiveTab('entitlements')}
            className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium flex items-center gap-1 ${
              activeTab === 'entitlements' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            Entitlements
          </button>
          <button
            onClick={() => setActiveTab('reception')}
            className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium flex items-center gap-1 ${
              activeTab === 'reception' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Reception
          </button>
        </div>
      </div>
    </header>
  );
};

