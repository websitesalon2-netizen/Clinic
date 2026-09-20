import React, { useState, useRef } from 'react';
import { useClinic } from '../context/ClinicContext';
import { ClinicSiteConfig } from '../types';
import { ManagerPictureDesk } from './ManagerPictureDesk';
import {
  Code,
  Lock,
  Unlock,
  Building,
  MapPin,
  Phone,
  Mail,
  Globe,
  Sliders,
  Sparkles,
  Save,
  RotateCcw,
  Check,
  AlertCircle,
  FileJson,
  Upload,
  Download,
  Image as ImageIcon,
  Key,
  Layers,
  Radio,
  ExternalLink,
  MessageSquare,
  Clock,
  ShieldCheck,
  HelpCircle,
  Stethoscope,
  ArrowLeft
} from 'lucide-react';

interface DeveloperDeskProps {
  onBackToHome?: () => void;
}

export const DeveloperDesk: React.FC<DeveloperDeskProps> = ({ onBackToHome }) => {
  const {
    db,
    developerLoggedIn,
    loginDeveloper,
    logoutDeveloper,
    changeDeveloperPin,
    updateSiteConfig,
    resetSiteConfigToDefault,
    isSyncing,
    lastSyncedAt,
    forceSyncNow,
    resetToInitialDb
  } = useClinic();

  const siteConfig = db.site_config;

  // PIN Login State
  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // Active Developer Tab
  const [activeTab, setActiveTab] = useState<
    'branding' | 'contact' | 'copywriting' | 'pictures' | 'system'
  >('branding');

  // Form State initialized from siteConfig
  const [formData, setFormData] = useState<ClinicSiteConfig>(() => ({
    ...siteConfig
  }));

  // Sync internal state when siteConfig updates externally
  React.useEffect(() => {
    setFormData({ ...siteConfig });
  }, [siteConfig]);

  // Notifications
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

  // New PIN state
  const [newPin, setNewPin] = useState('');
  const [pinChangeMsg, setPinChangeMsg] = useState('');

  // Logo / Favicon file upload helpers
  const logoFileRef = useRef<HTMLInputElement>(null);
  const faviconFileRef = useRef<HTMLInputElement>(null);
  const jsonImportRef = useRef<HTMLInputElement>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const res = loginDeveloper(pinInput);
    if (res.success) {
      setPinInput('');
    } else {
      setLoginError(res.message || 'Incorrect Developer PIN');
    }
  };

  const handleSaveAll = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaveErrorMessage(null);
    try {
      updateSiteConfig(formData);
      setSaveSuccessMessage('All website settings and branding successfully saved and synced across all devices!');
      setTimeout(() => setSaveSuccessMessage(null), 6000);
    } catch (err: any) {
      setSaveErrorMessage('Failed to save configuration: ' + err.message);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const dataUrl = evt.target?.result as string;
      try {
        const res = await fetch('/api/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataUrl, filename: 'clinic_logo_' + file.name })
        });
        if (res.ok) {
          const json = await res.json();
          setFormData((prev) => ({ ...prev, logo_url: json.url || dataUrl }));
        } else {
          setFormData((prev) => ({ ...prev, logo_url: dataUrl }));
        }
      } catch {
        setFormData((prev) => ({ ...prev, logo_url: dataUrl }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      setFormData((prev) => ({ ...prev, favicon_url: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(db, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `dkc_clinic_database_${new Date().toISOString().split('T')[0]}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const raw = evt.target?.result as string;
        const parsed = JSON.parse(raw);
        if (!parsed.site_config || !parsed.appointments) {
          alert('Invalid clinic database backup file format.');
          return;
        }
        await fetch('/api/clinic-db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ db: parsed })
        });
        window.location.reload();
      } catch (err) {
        alert('Failed to parse JSON backup file: ' + err);
      }
    };
    reader.readAsText(file);
  };

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPin.trim() || newPin.trim().length < 4) {
      setPinChangeMsg('PIN must be at least 4 characters long');
      return;
    }
    const ok = changeDeveloperPin(newPin.trim());
    if (ok) {
      setPinChangeMsg('Developer PIN updated successfully!');
      setNewPin('');
      setTimeout(() => setPinChangeMsg(''), 4000);
    }
  };

  // IF NOT LOGGED IN, SHOW DEVELOPER AUTH GATE
  if (!developerLoggedIn) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 animate-fade-in space-y-4">
        {onBackToHome && (
          <button
            type="button"
            onClick={onBackToHome}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Clinic Website</span>
          </button>
        )}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-md">
            <Code className="w-7 h-7" />
          </div>

          <div className="text-center space-y-1.5">
            <h2 className="text-2xl font-heading font-extrabold text-slate-900">
              Developer Desk Access
            </h2>
            <p className="text-xs text-slate-500">
              Site Configuration, Global Content Management, and Dynamic Branding Engine
            </p>
          </div>

          {loginError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Developer Authorization PIN
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  id="dev-pin-input"
                  required
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Enter PIN (Default: dev2026)"
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400 flex items-center gap-1">
                <HelpCircle className="w-3 h-3 text-indigo-500" />
                <span>Default developer access PIN: <strong className="font-mono text-slate-700">dev2026</strong></span>
              </p>
            </div>

            <button
              type="submit"
              id="btn-dev-login"
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              <span>Unlock Developer Desk</span>
            </button>
          </form>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Developer Privileges</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Customize clinic name, doctor credentials, addresses, phone numbers, website logo, browser favicon, announcement notices, and photo chronicles with instant multi-device synchronization.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // LOGGED IN DEVELOPER DESK
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 animate-fade-in">
      {/* Top Header Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-semibold mb-2">
            <Code className="w-3.5 h-3.5 text-indigo-600" />
            <span>Developer Control Panel & Site CMS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 tracking-tight">
            Developer Desk: Live Website Editor
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Edit everything shown on the website (names, doctor degrees, addresses, logo, favicon, banners). All modifications immediately reflect on all connected devices and public pages.
          </p>
        </div>

        {/* Sync & Logout Controls */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {onBackToHome && (
            <button
              type="button"
              onClick={onBackToHome}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Website</span>
            </button>
          )}

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-600">
              {isSyncing ? 'Syncing...' : lastSyncedAt ? `Synced ${lastSyncedAt}` : 'Online'}
            </span>
          </div>

          <button
            onClick={() => forceSyncNow()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors"
            title="Force refresh database from central server"
          >
            <Radio className="w-3.5 h-3.5 text-teal-600" />
            <span>Force Sync</span>
          </button>

          <button
            onClick={logoutDeveloper}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock Desk</span>
          </button>

          <button
            onClick={() => handleSaveAll()}
            id="btn-save-all-site-config"
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save & Publish Live</span>
          </button>
        </div>
      </div>

      {/* Global Success / Error notifications */}
      {saveSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs sm:text-sm text-emerald-800 flex items-center justify-between gap-3 shadow-xs animate-fade-in">
          <div className="flex items-center gap-2.5">
            <Check className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{saveSuccessMessage}</span>
          </div>
          <button
            onClick={() => setSaveSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {saveErrorMessage && (
        <div className="p-4 bg-red-50 border border-red-300 rounded-2xl text-xs sm:text-sm text-red-800 flex items-center gap-2.5 shadow-xs">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{saveErrorMessage}</span>
        </div>
      )}

      {/* Main Developer Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-2 scrollbar-thin">
        <button
          id="tab-dev-branding"
          onClick={() => setActiveTab('branding')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'branding'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>1. Clinic & Doctor Branding</span>
        </button>

        <button
          id="tab-dev-contact"
          onClick={() => setActiveTab('contact')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'contact'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>2. Addresses & Contact Information</span>
        </button>

        <button
          id="tab-dev-copywriting"
          onClick={() => setActiveTab('copywriting')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'copywriting'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>3. Headlines, Banners & Copywriting</span>
        </button>

        <button
          id="tab-dev-pictures"
          onClick={() => setActiveTab('pictures')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'pictures'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>4. Pictures & Timeline Desk ({db.gallery?.length || 0})</span>
        </button>

        <button
          id="tab-dev-system"
          onClick={() => setActiveTab('system')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'system'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>5. Database Backup & System</span>
        </button>
      </div>

      {/* TAB 1: BRANDING & IDENTITY */}
      {activeTab === 'branding' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-heading font-extrabold text-slate-900">
                Clinic & Doctor Brand Identity
              </h3>
              <p className="text-xs text-slate-500">
                These fields dynamically update header titles, doctor credentials, logo imagery, and browser tab favicon on all devices.
              </p>
            </div>
            <button
              onClick={() => handleSaveAll()}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Save className="w-4 h-4" />
              <span>Save Branding</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Official Clinic Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="cfg-clinic-name"
                value={formData.clinic_name}
                onChange={(e) => setFormData({ ...formData, clinic_name: e.target.value })}
                placeholder="e.g. Dr. Kaiser's Clinic"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-semibold"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Appears in Navbar, Footer, Page Title, and printed consultation slips.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Consultant Doctor Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="cfg-doctor-name"
                value={formData.doctor_name}
                onChange={(e) => setFormData({ ...formData, doctor_name: e.target.value })}
                placeholder="e.g. Dr. Kaiser"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-semibold"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Displayed across OPD schedule, token calling, and prescription headers.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Doctor Qualifications & Degrees
              </label>
              <input
                type="text"
                id="cfg-doctor-qualifications"
                value={formData.doctor_qualifications}
                onChange={(e) => setFormData({ ...formData, doctor_qualifications: e.target.value })}
                placeholder="e.g. MBBS, MD (General Medicine)"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Doctor Specialties / Designation
              </label>
              <input
                type="text"
                id="cfg-doctor-specialties"
                value={formData.doctor_specialties}
                onChange={(e) => setFormData({ ...formData, doctor_specialties: e.target.value })}
                placeholder="e.g. Consultant Physician & Family Healthcare"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Logo & Favicon Controls */}
          <div className="pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Logo Settings */}
            <div className="space-y-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-indigo-600" />
                  <span>Website Logo (Navbar & Header)</span>
                </span>
                {formData.logo_url && (
                  <button
                    onClick={() => setFormData({ ...formData, logo_url: '' })}
                    className="text-[11px] text-red-600 hover:text-red-800 font-semibold"
                  >
                    Reset to Default Icon
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                  {formData.logo_url ? (
                    <img
                      src={formData.logo_url}
                      alt="Logo Preview"
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <div className="w-full h-full bg-teal-600 text-white flex items-center justify-center">
                      <Stethoscope className="w-8 h-8" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <input
                    type="file"
                    ref={logoFileRef}
                    onChange={handleLogoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => logoFileRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 shadow-2xs"
                  >
                    Upload Logo File
                  </button>
                  <input
                    type="url"
                    value={formData.logo_url}
                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                    placeholder="Or enter image URL (https://...)"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Favicon Settings */}
            <div className="space-y-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-indigo-600" />
                  <span>Browser Tab Favicon</span>
                </span>
                {formData.favicon_url && (
                  <button
                    onClick={() => setFormData({ ...formData, favicon_url: '' })}
                    className="text-[11px] text-red-600 hover:text-red-800 font-semibold"
                  >
                    Reset Favicon
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                  {formData.favicon_url ? (
                    <img
                      src={formData.favicon_url}
                      alt="Favicon Preview"
                      className="w-8 h-8 object-contain"
                    />
                  ) : (
                    <span className="text-2xl">🩺</span>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <input
                    type="file"
                    ref={faviconFileRef}
                    onChange={handleFaviconUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => faviconFileRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 shadow-2xs"
                  >
                    Upload Favicon File
                  </button>
                  <input
                    type="text"
                    value={formData.favicon_url}
                    onChange={(e) => setFormData({ ...formData, favicon_url: e.target.value })}
                    placeholder="Favicon URL or emoji (e.g. 🩺)"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ADDRESSES & CONTACT */}
      {activeTab === 'contact' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-heading font-extrabold text-slate-900">
                Clinic Location & Communications Directory
              </h3>
              <p className="text-xs text-slate-500">
                Update the physical address, Google Maps link, reception hotline, and emergency numbers.
              </p>
            </div>
            <button
              onClick={() => handleSaveAll()}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Save className="w-4 h-4" />
              <span>Save Contact Info</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Address Line 1 (Street & Building)
              </label>
              <input
                type="text"
                value={formData.address_line1}
                onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                placeholder="e.g. Main Road, Opp. Municipal Complex"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Address Line 2 (Area & Landmark)
              </label>
              <input
                type="text"
                value={formData.address_line2}
                onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                placeholder="e.g. Near Central Clock Tower, Medical Enclave"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Srinagar"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  State
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="Jammu & Kashmir"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Pincode
                </label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  placeholder="190001"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Google Maps Link
              </label>
              <input
                type="url"
                value={formData.google_maps_url}
                onChange={(e) => setFormData({ ...formData, google_maps_url: e.target.value })}
                placeholder="https://maps.google.com/?q=..."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Reception Primary Phone
              </label>
              <input
                type="text"
                value={formData.primary_phone}
                onChange={(e) => setFormData({ ...formData, primary_phone: e.target.value })}
                placeholder="9622229622"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Emergency Hotline
              </label>
              <input
                type="text"
                value={formData.emergency_phone}
                onChange={(e) => setFormData({ ...formData, emergency_phone: e.target.value })}
                placeholder="+91 96222 29622"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                WhatsApp Booking Number
              </label>
              <input
                type="text"
                value={formData.whatsapp_number}
                onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                placeholder="9622229622"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Official Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@drkaiserclinic.com"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HEADLINES & COPYWRITING */}
      {activeTab === 'copywriting' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-heading font-extrabold text-slate-900">
                Website Copywriting, Hero Headers & Announcement Banner
              </h3>
              <p className="text-xs text-slate-500">
                Control the hero headline, explanation texts, OPD timing policy, and emergency announcement notice.
              </p>
            </div>
            <button
              onClick={() => handleSaveAll()}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Save className="w-4 h-4" />
              <span>Save Copywriting</span>
            </button>
          </div>

          {/* Announcement Notice Banner Toggle */}
          <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="toggle-announcement" className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  id="toggle-announcement"
                  checked={formData.show_announcement}
                  onChange={(e) => setFormData({ ...formData, show_announcement: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="text-xs font-bold text-amber-900">
                  Display Top Live Announcement Banner to All Public Visitors
                </span>
              </label>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                {formData.show_announcement ? 'Banner Enabled' : 'Banner Hidden'}
              </span>
            </div>

            <textarea
              rows={2}
              value={formData.announcement_banner}
              onChange={(e) => setFormData({ ...formData, announcement_banner: e.target.value })}
              placeholder="e.g. Digital Queue Active: Check token status live. Free follow-up within 15 days."
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-amber-300 focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Hero Badge Eyebrow Text
              </label>
              <input
                type="text"
                value={formData.hero_badge_text}
                onChange={(e) => setFormData({ ...formData, hero_badge_text: e.target.value })}
                placeholder="Family Medicine & Clinical Consultation"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Hero Main Headline Tagline
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="Patient Care, Live Queue Tracking & Follow-up Entitlements"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-semibold"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Hero Subtitle Description
              </label>
              <textarea
                rows={3}
                value={formData.subtagline}
                onChange={(e) => setFormData({ ...formData, subtagline: e.target.value })}
                placeholder="Welcome to the official patient portal for Dr. Kaiser's Clinic..."
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                OPD Schedule & Timing Note
              </label>
              <textarea
                rows={2}
                value={formData.opd_timing_note}
                onChange={(e) => setFormData({ ...formData, opd_timing_note: e.target.value })}
                placeholder="Mon-Thu 9am-5/8pm, Friday 2pm-6pm..."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Consultation Fee Policy Description
              </label>
              <textarea
                rows={2}
                value={formData.consultation_fee_description}
                onChange={(e) => setFormData({ ...formData, consultation_fee_description: e.target.value })}
                placeholder="Includes 2 visits within 15 days validity"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Footer Copyright & Attribution Note
              </label>
              <input
                type="text"
                value={formData.footer_text}
                onChange={(e) => setFormData({ ...formData, footer_text: e.target.value })}
                placeholder="Dedicated to humane clinical excellence, patient-first care, and digital transparency."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PICTURES & TIMELINE MANAGER */}
      {activeTab === 'pictures' && (
        <div className="space-y-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 text-xs text-indigo-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>
                <strong>Developer Media Console:</strong> You can upload, edit, re-tag, or delete gallery pictures and milestones directly from here as well.
              </span>
            </div>
          </div>
          <ManagerPictureDesk />
        </div>
      )}

      {/* TAB 5: SYSTEM & DATABASE BACKUP */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          {/* Developer PIN Configuration */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-xs">
            <h3 className="text-lg font-heading font-extrabold text-slate-900 flex items-center gap-2">
              <Key className="w-5 h-5 text-indigo-600" />
              <span>Change Developer Authorization PIN</span>
            </h3>
            <p className="text-xs text-slate-500">
              Change the security PIN required to unlock this Developer Desk.
            </p>

            {pinChangeMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold">
                {pinChangeMsg}
              </div>
            )}

            <form onSubmit={handleChangePin} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-md">
              <input
                type="text"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="Enter new PIN (min 4 chars)"
                className="px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors shrink-0"
              >
                Update PIN
              </button>
            </form>
          </div>

          {/* Database Backup & Restore */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
            <div>
              <h3 className="text-lg font-heading font-extrabold text-slate-900 flex items-center gap-2">
                <FileJson className="w-5 h-5 text-teal-600" />
                <span>Full Clinic Database Backup & Restore</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Export all appointments, entitlements, weekly OPD schedules, fees, pictures, and website configurations to a portable JSON backup file.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                  <Download className="w-4 h-4 text-indigo-600" />
                  <span>Download Complete Backup</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Save snapshot of all clinic tables, patient lists, and website content to your local machine.
                </p>
                <button
                  onClick={handleExportJson}
                  className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-xl shadow-2xs transition-colors flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export JSON Backup</span>
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-teal-600" />
                  <span>Restore from JSON File</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Upload a previously exported clinic database JSON file to restore state immediately.
                </p>
                <input
                  type="file"
                  ref={jsonImportRef}
                  onChange={handleImportJson}
                  accept=".json"
                  className="hidden"
                />
                <button
                  onClick={() => jsonImportRef.current?.click()}
                  className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-xl shadow-2xs transition-colors flex items-center gap-2"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose JSON File to Restore</span>
                </button>
              </div>
            </div>

            {/* Factory Defaults Reset */}
            <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-red-700">Factory Reset Configuration</div>
                <p className="text-[11px] text-slate-500">
                  Reset branding and website text back to Dr. Kaiser Clinic standard defaults.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to reset site settings to initial default?')) {
                      resetSiteConfigToDefault();
                    }
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Reset Site Config
                </button>
                <button
                  onClick={() => {
                    if (confirm('DANGER: This will reset all clinic appointments, gallery, and settings to original state. Proceed?')) {
                      resetToInitialDb();
                    }
                  }}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-bold rounded-xl"
                >
                  Reset Entire Database
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
