import React, { useState } from 'react';
import { ClinicProvider, useClinic } from './context/ClinicContext';
import { Navbar, ActiveTab } from './components/Navbar';
import { HomeHero } from './components/HomeHero';
import { LiveQueueTracker } from './components/LiveQueueTracker';
import { EntitlementLookup } from './components/EntitlementLookup';
import { ClinicScheduleView } from './components/ClinicScheduleView';
import { ReceptionDashboard } from './components/ReceptionDashboard';
import { DatabaseInspector } from './components/DatabaseInspector';
import { PicturesGallery } from './components/PicturesGallery';
import { DeveloperDesk } from './components/DeveloperDesk';
import { BookAppointmentModal } from './components/BookAppointmentModal';
import { PatientSlipModal } from './components/PatientSlipModal';
import { ClinicAppointment } from './types';
import { Stethoscope, Phone, ShieldCheck, Image as ImageIcon, Code, Sparkles } from 'lucide-react';

function ClinicMainApp() {
  const { receptionLoggedIn, developerLoggedIn, db } = useClinic();
  const siteConfig = db.site_config;
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [isBookModalOpen, setIsBookModalOpen] = useState<boolean>(false);
  const [bookModalPhone, setBookModalPhone] = useState<string>('');
  const [bookModalEntitlementCode, setBookModalEntitlementCode] = useState<string>('');
  const [activeSlipAppointment, setActiveSlipAppointment] = useState<ClinicAppointment | null>(null);

  const clinicName = siteConfig?.clinic_name || "Dr. Kaiser's Clinic";
  const doctorSpecialties = siteConfig?.doctor_specialties || "Consultant Physician & Family Healthcare";
  const emergencyPhone = siteConfig?.emergency_phone || "+91 96222 29622";
  const addressText = [siteConfig?.address_line1, siteConfig?.city, siteConfig?.state].filter(Boolean).join(', ');

  const handleOpenBookModal = () => {
    setBookModalPhone('');
    setBookModalEntitlementCode('');
    setIsBookModalOpen(true);
  };

  const handleBookWithEntitlement = (phone: string, code: string) => {
    setBookModalPhone(phone);
    setBookModalEntitlementCode(code);
    setIsBookModalOpen(true);
  };

  const handleBookingSuccess = (appointment: ClinicAppointment) => {
    setActiveSlipAppointment(appointment);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased font-sans">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenBookModal={handleOpenBookModal}
      />

      {/* Main App Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'home' && (
          <HomeHero
            onOpenBookModal={handleOpenBookModal}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'queue' && (
          <LiveQueueTracker
            onOpenBookModal={handleOpenBookModal}
          />
        )}

        {activeTab === 'entitlements' && (
          <EntitlementLookup
            onBookWithEntitlement={handleBookWithEntitlement}
          />
        )}

        {activeTab === 'gallery' && (
          <PicturesGallery />
        )}

        {activeTab === 'schedule' && (
          receptionLoggedIn ? (
            <ClinicScheduleView
              onOpenBookModal={handleOpenBookModal}
            />
          ) : (
            <ReceptionDashboard
              onReprintSlip={(apt) => setActiveSlipAppointment(apt)}
            />
          )
        )}

        {activeTab === 'reception' && (
          <ReceptionDashboard
            onReprintSlip={(apt) => setActiveSlipAppointment(apt)}
          />
        )}

        {activeTab === 'developer' && (
          <DeveloperDesk onBackToHome={() => setActiveTab('home')} />
        )}

        {activeTab === 'database' && (
          receptionLoggedIn ? (
            <DatabaseInspector />
          ) : (
            <ReceptionDashboard
              onReprintSlip={(apt) => setActiveSlipAppointment(apt)}
            />
          )
        )}
      </main>

      {/* Modals */}
      <BookAppointmentModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        onBookingSuccess={handleBookingSuccess}
        initialPhone={bookModalPhone}
        initialEntitlementCode={bookModalEntitlementCode}
      />

      <PatientSlipModal
        appointment={activeSlipAppointment}
        onClose={() => setActiveSlipAppointment(null)}
      />

      {/* Professional Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto text-xs text-slate-500 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
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
                <div className="font-heading font-bold text-sm text-slate-900">{clinicName}</div>
                <p className="text-[11px] text-slate-400">{doctorSpecialties}</p>
                {addressText && <p className="text-[10px] text-slate-400 mt-0.5">{addressText}</p>}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('home');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="hover:text-teal-700 transition-colors cursor-pointer"
              >
                Home
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setActiveTab('queue')}
                className="hover:text-teal-700 transition-colors cursor-pointer"
              >
                Live Queue
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setActiveTab('entitlements')}
                className="hover:text-teal-700 transition-colors cursor-pointer"
              >
                Entitlements
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setActiveTab('reception')}
                className="hover:text-teal-700 transition-colors font-medium text-slate-700 flex items-center gap-1 cursor-pointer"
              >
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Reception Desk
              </button>
            </div>

            <div className="text-[11px] text-slate-400 text-center sm:text-right space-y-0.5">
              <div>Reception Desk Hotline: <span className="font-mono font-medium text-slate-700">{emergencyPhone}</span></div>
              <div className="text-slate-400">Consultation fee valid for 2 visits within 15 days</div>
              {siteConfig?.footer_text && (
                <div className="text-[10px] text-slate-400 max-w-xs">{siteConfig.footer_text}</div>
              )}
            </div>
          </div>

          {/* Bottom small sub-footer bar with Developer Desk */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
            <span>© {new Date().getFullYear()} {clinicName}. All rights reserved.</span>
            
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('developer');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                id="btn-footer-developer-desk"
                className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                Developer Desk
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ClinicProvider>
      <ClinicMainApp />
    </ClinicProvider>
  );
}

