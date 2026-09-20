import React, { useState } from 'react';
import { 
  Stethoscope, 
  Clock, 
  CalendarCheck, 
  ShieldCheck, 
  Users, 
  Phone, 
  CheckCircle2, 
  ArrowRight,
  HeartPulse,
  Activity,
  Calendar,
  FileCheck,
  AlertTriangle,
  AlertCircle,
  Image as ImageIcon,
  MapPin,
  Sparkles
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { ActiveTab } from './Navbar';
import { ClinicGalleryItem } from '../types';
import { ClinicTimelineSection } from './ClinicTimelineSection';
import { ClinicGallerySection } from './ClinicGallerySection';
import { ClinicLightboxModal } from './ClinicLightboxModal';

interface HomeHeroProps {
  onOpenBookModal: () => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export const HomeHero: React.FC<HomeHeroProps> = ({ onOpenBookModal, setActiveTab }) => {
  const { servingToken, todaySchedule, dateAppointments, db, isTodayOff, todayOffReason, nextAvailableOpenDate, receptionLoggedIn } = useClinic();
  const siteConfig = db.site_config;
  const [selectedLightboxPhoto, setSelectedLightboxPhoto] = useState<ClinicGalleryItem | null>(null);

  const isOpenToday = !isTodayOff && todaySchedule?.is_open;
  const timingText = isOpenToday
    ? `${todaySchedule?.start_time?.slice(0, 5)} - ${todaySchedule?.end_time?.slice(0, 5)}`
    : `Closed Today (${todayOffReason || 'Routine Off'})`;

  const clinicName = siteConfig?.clinic_name || "Dr. Kaiser's Clinic";
  const doctorName = siteConfig?.doctor_name || "Dr. Kaiser";
  const doctorQualifications = siteConfig?.doctor_qualifications || "MBBS, MD (General Medicine)";
  const heroBadge = siteConfig?.hero_badge_text || "Family Medicine & Clinical Consultation";
  const tagline = siteConfig?.tagline || "Patient Care, Live Queue Tracking & Follow-up Entitlements.";
  const subtagline = siteConfig?.subtagline || `Welcome to the official patient portal for ${clinicName}. Book an appointment online, monitor the live consultation queue from your phone, and verify your 15-day fee entitlement.`;
  const primaryPhone = siteConfig?.primary_phone || "9622229622";
  const emergencyPhone = siteConfig?.emergency_phone || "+91 96222 29622";

  return (
    <div className="space-y-8">
      {/* Clinic OFF / CLOSED Alert Banner */}
      {isTodayOff && (
        <div className="p-5 rounded-3xl bg-amber-50 border-2 border-amber-300 text-amber-900 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-200/80 text-amber-900 flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="w-6 h-6 text-amber-800" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-200 text-amber-950 uppercase tracking-wider">
                  Notice: Clinic is OFF Today
                </span>
                <span className="text-xs font-bold text-amber-800">
                  ({todayOffReason || 'Routine Closed'})
                </span>
              </div>
              <p className="text-xs text-amber-900/90 mt-1 leading-relaxed">
                Outpatient consultations are suspended for today. The next available appointment slot is on <strong>{nextAvailableOpenDate}</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 justify-end">
            <button
              onClick={onOpenBookModal}
              className="px-4 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              <CalendarCheck className="w-4 h-4" />
              Book for {nextAvailableOpenDate}
            </button>
            <a
              href={`tel:${primaryPhone}`}
              className="px-3.5 py-2.5 rounded-xl border border-amber-300 hover:bg-amber-100 text-amber-900 font-semibold text-xs transition-colors cursor-pointer"
            >
              Call Desk
            </a>
          </div>
        </div>
      )}

      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-10 lg:p-12 text-white shadow-xl relative overflow-hidden border border-teal-700/40">
        <div className="absolute right-0 top-0 w-96 h-96 rounded-full bg-teal-400/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-800/80 text-teal-200 text-xs font-semibold mb-4 border border-teal-600/40">
            <HeartPulse className="w-4 h-4 text-teal-300 animate-pulse" />
            <span>{heroBadge}</span>
          </div>

          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-tight">
            {tagline}
          </h2>

          <p className="text-teal-100/90 text-sm sm:text-base mt-4 leading-relaxed max-w-2xl font-normal">
            {subtagline}
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-8">
            <button
              id="btn-hero-book"
              onClick={onOpenBookModal}
              className="px-6 py-3.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-sm shadow-md shadow-teal-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <CalendarCheck className="w-4 h-4" />
              Book Appointment Token
            </button>

            <button
              onClick={() => setActiveTab('queue')}
              className="px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Clock className="w-4 h-4 text-teal-300" />
              View Live Queue (#{servingToken})
            </button>

            <button
              onClick={() => {
                const el = document.getElementById('clinic-timeline-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <ImageIcon className="w-4 h-4 text-teal-300" />
              Milestones & Gallery
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Feature Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Book Token */}
        <div
          onClick={onOpenBookModal}
          className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-teal-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-base text-slate-900 mb-1">
              Book Appointment
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Select your date and receive an instant token slip with estimated consultation time.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-teal-700 group-hover:text-teal-800 gap-1">
            <span>Book Now</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 2: Live Queue Monitor */}
        <div
          onClick={() => setActiveTab('queue')}
          className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-teal-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-700 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Clock className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-heading font-bold text-base text-slate-900">
                Live Token Queue
              </h3>
              <span className="text-[11px] font-mono font-bold bg-teal-100 text-teal-900 px-2 py-0.5 rounded-full">
                Now #{servingToken}
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Check who is in consultation, estimate remaining wait time, and avoid crowded waiting lounges.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-cyan-700 group-hover:text-cyan-800 gap-1">
            <span>Track Queue</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 3: Pictures & Milestones Chronicle */}
        <div
          onClick={() => {
            const el = document.getElementById('clinic-timeline-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-teal-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-heading font-bold text-base text-slate-900">
                Timeline & Gallery
              </h3>
              <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                {db.gallery?.length || 0} Photos
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Chronological healthcare milestones and live photo gallery visible below on this page.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-indigo-700 group-hover:text-indigo-800 gap-1">
            <span>View Below</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 4: 15-Day Fee Entitlement */}
        <div
          onClick={() => setActiveTab('entitlements')}
          className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-teal-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-base text-slate-900 mb-1">
              Fee Entitlements
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Enter phone number to check validity. Each consultation covers 2 visits within 15 days (₹0 fee).
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-emerald-700 group-hover:text-emerald-800 gap-1">
            <span>Check Validity</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Today's Live Status Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Today's Operating Status
            </span>
            <div className="flex items-center gap-2 pt-1">
              <span className={`w-3 h-3 rounded-full ${isOpenToday ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              <span className="font-heading font-bold text-lg text-slate-900">
                {isOpenToday ? 'OPD Consultations Active' : 'Clinic Closed Today'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {timingText}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Today's Patient Intake
            </span>
            <div className="font-heading font-bold text-lg text-slate-900 pt-1">
              {dateAppointments.length} Tokens Registered
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Daily safety quota: 30 patients max
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Reception Helpdesk
            </span>
            <div className="pt-1">
              <a
                href={`tel:${primaryPhone}`}
                className="font-heading font-bold text-lg text-teal-700 hover:text-teal-800"
              >
                {emergencyPhone}
              </a>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Call for token queries or emergency arrival
            </p>
          </div>
        </div>
      </div>

      {/* SECTION: CLINIC TIMELINE (Directly visible on opening of website, no click required) */}
      <ClinicTimelineSection onSelectPhoto={(photo) => setSelectedLightboxPhoto(photo)} />

      {/* SECTION: CLINIC GALLERY (Directly after timeline, 3-4 pictures live with option for more) */}
      <ClinicGallerySection onSelectPhoto={(photo) => setSelectedLightboxPhoto(photo)} />

      {/* Patient Care & Policy Notice */}
      <div className="bg-teal-50/60 border border-teal-200/80 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0 mt-0.5">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-heading font-bold text-slate-900 text-sm">
              Standard Consultation & Follow-up Commitment
            </h4>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Every consultation of ₹{db.settings.consultation_fee} guarantees clinical accountability: if symptoms persist or diagnostic test reviews are needed, your follow-up within 15 days is completely free (₹0) under our patient fee entitlement guarantee.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('clinic-gallery-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-4 py-2 rounded-xl bg-white border border-teal-300 text-teal-800 text-xs font-bold hover:bg-teal-100 transition-colors cursor-pointer"
          >
            Clinic Photos
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reception')}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Reception Desk
          </button>
        </div>
      </div>

      {/* Lightbox Modal for any selected photo */}
      <ClinicLightboxModal
        item={selectedLightboxPhoto}
        onClose={() => setSelectedLightboxPhoto(null)}
      />
    </div>
  );
};

