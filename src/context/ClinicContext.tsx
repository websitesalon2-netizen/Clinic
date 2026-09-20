import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  ClinicDatabaseState,
  ClinicAppointment,
  PatientFeeEntitlement,
  AppointmentStatus,
  ClinicWeeklySchedule,
  ClinicSettings,
  ClinicFeePolicy,
  ClinicQueueState,
  ClinicGalleryItem,
  ClinicSiteConfig
} from '../types';
import { INITIAL_DATABASE_STATE, INITIAL_GALLERY, INITIAL_SITE_CONFIG } from '../data/initialDb';
import { generatePostgreSqlDump } from '../utils/sqlExporter';

const STORAGE_KEY = 'dkc_clinic_database_v2';
const DEV_SESSION_KEY = 'dkc_developer_session';
export const CURRENT_DATE_STRING = '2026-09-13';

// Unique session device ID to differentiate local updates from incoming remote broadcasts
const getDeviceId = (): string => {
  try {
    let id = sessionStorage.getItem('clinic_device_session_id');
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
      sessionStorage.setItem('clinic_device_session_id', id);
    }
    return id;
  } catch {
    return 'dev_' + Math.random().toString(36).substring(2, 9);
  }
};

interface BookAppointmentInput {
  patient_name: string;
  guardian_name: string;
  phone: string;
  appointment_date: string;
  appointment_time: string;
  visit_type: 'new' | 'follow_up';
  notes?: string;
  entitlement_code?: string;
}

interface UndoHistoryEntry {
  db: ClinicDatabaseState;
  description: string;
  timestamp: string;
}

interface ClinicContextType {
  db: ClinicDatabaseState;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  activeQueueState: ClinicQueueState;
  servingToken: number;
  todaySchedule: ClinicWeeklySchedule | undefined;
  isTodayOff: boolean;
  todayOffReason: string;
  nextAvailableOpenDate: string;
  isClinicOpenOnDate: (date: string) => boolean;
  getDateClosureReason: (date: string) => string;
  dateAppointments: ClinicAppointment[];
  receptionLoggedIn: boolean;
  loginReception: (username: string, password: string) => { success: boolean; message?: string };
  logoutReception: () => void;
  changeReceptionPassword: (oldPass: string, newPass: string) => { success: boolean; message: string };
  // Developer Auth
  developerLoggedIn: boolean;
  loginDeveloper: (pin: string) => { success: boolean; message?: string };
  logoutDeveloper: () => void;
  changeDeveloperPin: (newPin: string) => boolean;
  // Multi-device sync state
  isSyncing: boolean;
  lastSyncedAt: string | null;
  forceSyncNow: () => Promise<void>;
  // Gallery Management
  addGalleryItem: (item: Omit<ClinicGalleryItem, 'id' | 'created_at'>) => ClinicGalleryItem;
  updateGalleryItem: (id: string, updates: Partial<ClinicGalleryItem>) => void;
  deleteGalleryItem: (id: string) => boolean;
  // Site Configuration (Developer)
  updateSiteConfig: (updates: Partial<ClinicSiteConfig>) => void;
  resetSiteConfigToDefault: () => void;
  // Queue & Appointments
  callNextToken: () => void;
  callPreviousToken: () => void;
  setServingToken: (token: number) => void;
  setQueueStatus: (status: 'active' | 'paused' | 'closed') => void;
  bookAppointment: (input: BookAppointmentInput) => ClinicAppointment;
  updateAppointmentStatus: (id: number, status: AppointmentStatus) => void;
  deleteAppointment: (id: number) => boolean;
  cancelAppointment: (id: number, reason?: string) => boolean;
  deleteEntitlement: (id: number) => boolean;
  deleteRecordFromTable: (tableName: string, rowId: number | string) => boolean;
  clearTableRecords: (tableName: string) => boolean;
  recalculateAppointmentTimesForDate: (date: string, customStartTime?: string, customSlotDuration?: number) => number;
  toggleDateOffStatus: (date: string, isClosed: boolean, reason?: string) => void;
  updateSettings: (settings: Partial<ClinicSettings>) => void;
  updateFeePolicy: (policy: Partial<ClinicFeePolicy>) => void;
  updateWeeklySchedule: (dayOfWeek: number, updates: Partial<ClinicWeeklySchedule>) => void;
  setDailyLimitForDate: (date: string, maxPatients: number, isClosed: boolean, notes?: string) => void;
  lookupEntitlementsByPhone: (phone: string) => PatientFeeEntitlement[];
  lookupEntitlementByCode: (code: string) => PatientFeeEntitlement | undefined;
  findActiveEntitlementForPatient: (phone: string) => PatientFeeEntitlement | undefined;
  // Undo support
  canUndo: boolean;
  lastActionMessage: string | null;
  undoLastAction: () => boolean;
  dismissUndoMessage: () => void;
  resetToInitialDb: () => void;
  exportDatabaseSql: () => string;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export const ClinicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<ClinicDatabaseState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: ClinicDatabaseState = JSON.parse(saved);
        if (!parsed.reception_auth?.password) {
          parsed.reception_auth = {
            ...parsed.reception_auth,
            password: 'kaiser@2026'
          };
        }
        if (!parsed.gallery || !Array.isArray(parsed.gallery) || parsed.gallery.length === 0) {
          parsed.gallery = INITIAL_GALLERY;
        }
        if (!parsed.site_config) {
          parsed.site_config = INITIAL_SITE_CONFIG;
        }
        return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_DATABASE_STATE;
  });

  const [selectedDate, setSelectedDate] = useState<string>(CURRENT_DATE_STRING);
  const [receptionLoggedIn, setReceptionLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('dkc_reception_session') === 'true';
  });
  const [developerLoggedIn, setDeveloperLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem(DEV_SESSION_KEY) === 'true';
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  // Sync flow flags:
  // isIncomingUpdate prevents incoming server broadcasts from triggering an outgoing push back to server
  const isIncomingUpdate = useRef<boolean>(false);
  // isInitialLoadDone prevents a newly opened device from overwriting the server with its empty/stale local state
  const isInitialLoadDone = useRef<boolean>(false);

  // Undo stack
  const [undoStack, setUndoStack] = useState<UndoHistoryEntry[]>([]);
  const [lastActionMessage, setLastActionMessage] = useState<string | null>(null);

  // Auto-dismiss undo message after 10 seconds
  useEffect(() => {
    if (!lastActionMessage) return;
    const timer = setTimeout(() => {
      setLastActionMessage(null);
    }, 10000);
    return () => clearTimeout(timer);
  }, [lastActionMessage]);

  // Helper to push state onto undo stack before mutation
  const pushUndoSnapshot = (description: string, currentState: ClinicDatabaseState = db) => {
    setUndoStack((prev) => [
      {
        db: JSON.parse(JSON.stringify(currentState)),
        description,
        timestamp: new Date().toLocaleTimeString()
      },
      ...prev.slice(0, 14) // keep last 15 actions
    ]);
    setLastActionMessage(description);
  };

  // 1. Initial load from server disk + establish SSE connection for real-time live synchronization
  useEffect(() => {
    let mounted = true;
    let eventSource: EventSource | null = null;

    const fetchServerDb = async () => {
      try {
        const res = await fetch('/api/clinic-db?t=' + Date.now());
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data && mounted) {
            const serverData: ClinicDatabaseState = json.data;
            if (!serverData.gallery || !Array.isArray(serverData.gallery) || serverData.gallery.length === 0) {
              serverData.gallery = INITIAL_GALLERY;
            }
            if (!serverData.site_config) {
              serverData.site_config = INITIAL_SITE_CONFIG;
            }
            isIncomingUpdate.current = true;
            setDb(serverData);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(serverData));
            } catch {}
            setLastSyncedAt(new Date().toLocaleTimeString());
          }
        }
      } catch (err) {
        console.info('Operating in standalone mode', err);
      } finally {
        if (mounted) {
          isInitialLoadDone.current = true;
        }
      }
    };

    fetchServerDb();

    // Setup Server-Sent Events (SSE) stream for instant real-time broadcast across devices
    try {
      eventSource = new EventSource('/api/clinic-db/events');

      eventSource.onmessage = (event) => {
        if (!mounted) return;
        try {
          const payload = JSON.parse(event.data);
          if (payload && payload.data) {
            // Ignore echoes of changes this device initiated
            const myDeviceId = getDeviceId();
            if (payload.sourceDeviceId && payload.sourceDeviceId === myDeviceId) {
              return;
            }

            const serverData: ClinicDatabaseState = payload.data;
            if (!serverData.gallery || !Array.isArray(serverData.gallery) || serverData.gallery.length === 0) {
              serverData.gallery = INITIAL_GALLERY;
            }
            if (!serverData.site_config) {
              serverData.site_config = INITIAL_SITE_CONFIG;
            }

            setDb((current) => {
              const serverTs = serverData.last_modified_timestamp || payload.timestamp || 0;
              const currentTs = current.last_modified_timestamp || 0;
              if (serverTs >= currentTs || payload.type === 'INITIAL_SYNC') {
                isIncomingUpdate.current = true;
                try {
                  localStorage.setItem(STORAGE_KEY, JSON.stringify(serverData));
                } catch {}
                setLastSyncedAt(new Date().toLocaleTimeString());
                return serverData;
              }
              return current;
            });
          }
        } catch (err) {
          console.error('Failed to parse incoming SSE message:', err);
        }
      };

      eventSource.onerror = () => {
        // SSE automatically reconnects
      };
    } catch (e) {
      console.warn('SSE not supported or blocked:', e);
    }

    return () => {
      mounted = false;
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  // 2. High-reliability continuous multi-device sync poll (every 2.5 seconds)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/clinic-db?t=' + Date.now());
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            const serverData: ClinicDatabaseState = json.data;
            const serverTs = serverData.last_modified_timestamp || json.timestamp || 0;

            setDb((current) => {
              const currentTs = current.last_modified_timestamp || 0;
              if (serverTs > currentTs) {
                if (!serverData.gallery || !Array.isArray(serverData.gallery) || serverData.gallery.length === 0) {
                  serverData.gallery = INITIAL_GALLERY;
                }
                if (!serverData.site_config) {
                  serverData.site_config = INITIAL_SITE_CONFIG;
                }
                isIncomingUpdate.current = true;
                try {
                  localStorage.setItem(STORAGE_KEY, JSON.stringify(serverData));
                } catch {}
                setLastSyncedAt(new Date().toLocaleTimeString());
                return serverData;
              }
              return current;
            });
          }
        }
      } catch {
        // quiet ignore for intermittent connectivity
      }
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // 3. Save local modifications to localStorage AND push to server (visible to public and all devices)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch (e) {
      console.error('Failed to save clinic state locally', e);
    }

    // CRITICAL: Do NOT push to server if initial load hasn't completed
    // (Prevents a device on mount from overwriting server with stale default!)
    if (!isInitialLoadDone.current) {
      return;
    }

    // CRITICAL: Do NOT push back to server if this state update came from the server
    // (Prevents infinite ping-pong loops between devices!)
    if (isIncomingUpdate.current) {
      isIncomingUpdate.current = false;
      return;
    }

    const pushToServer = async () => {
      try {
        setIsSyncing(true);
        const res = await fetch('/api/clinic-db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            db,
            sourceDeviceId: getDeviceId()
          })
        });
        if (res.ok) {
          setLastSyncedAt(new Date().toLocaleTimeString());
        }
      } catch (e) {
        // ignore offline failures
      } finally {
        setIsSyncing(false);
      }
    };

    const timer = setTimeout(pushToServer, 150);
    return () => clearTimeout(timer);
  }, [db]);

  // 4. Update document title and favicon dynamically based on developer site config
  useEffect(() => {
    if (db.site_config?.clinic_name) {
      document.title = db.site_config.clinic_name;
    }
    if (db.site_config?.favicon_url) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = db.site_config.favicon_url;
    }
  }, [db.site_config?.clinic_name, db.site_config?.favicon_url]);


  const activeQueueState: ClinicQueueState = db.queue_states.find((q) => q.date === selectedDate) || {
    id: 999,
    date: selectedDate,
    current_token_serving: 0,
    status: 'active',
    created_at: new Date().toISOString()
  };

  const servingToken = activeQueueState.current_token_serving;

  // Selected date day of week (0 = Sunday ... 6 = Saturday)
  const dateObj = new Date(selectedDate);
  const dayOfWeek = isNaN(dateObj.getTime()) ? 0 : dateObj.getDay();
  const todaySchedule = db.weekly_schedule.find((s) => s.day_of_week === dayOfWeek);

  const isClinicOpenOnDate = (date: string): boolean => {
    const dailyLimit = db.daily_limits.find((dl) => dl.date === date);
    if (dailyLimit?.is_closed) return false;
    const d = new Date(date);
    const dow = isNaN(d.getTime()) ? 0 : d.getDay();
    const sched = db.weekly_schedule.find((s) => s.day_of_week === dow);
    return !!sched?.is_open;
  };

  const getDateClosureReason = (date: string): string => {
    const dailyLimit = db.daily_limits.find((dl) => dl.date === date);
    if (dailyLimit?.is_closed) {
      return dailyLimit.notes || 'Emergency closure / Off marked by Reception';
    }
    const d = new Date(date);
    const dow = isNaN(d.getTime()) ? 0 : d.getDay();
    const sched = db.weekly_schedule.find((s) => s.day_of_week === dow);
    if (!sched?.is_open) {
      if (dow === 0) return 'Routine Sunday OPD Off';
      if (dow === 6) return 'Routine Saturday Clinic Off';
      return 'Clinic Closed';
    }
    return '';
  };

  // Is today off?
  const isTodayOff = !isClinicOpenOnDate(CURRENT_DATE_STRING);
  const todayOffReason = getDateClosureReason(CURRENT_DATE_STRING);

  // Compute next available open date
  const computeNextAvailableDate = (): string => {
    const start = new Date(CURRENT_DATE_STRING);
    for (let i = 0; i <= 14; i++) {
      const candidate = new Date(start);
      candidate.setDate(candidate.getDate() + i);
      const iso = candidate.toISOString().split('T')[0];
      if (isClinicOpenOnDate(iso)) {
        return iso;
      }
    }
    return CURRENT_DATE_STRING;
  };

  const nextAvailableOpenDate = computeNextAvailableDate();

  const dateAppointments = db.appointments
    .filter((a) => a.appointment_date === selectedDate)
    .sort((a, b) => a.token_number - b.token_number);

  // Reception Authentication with Password
  const loginReception = (username: string, password: string): { success: boolean; message?: string } => {
    const cleanUser = username.trim().toUpperCase();
    const configuredUsername = (db.reception_auth?.username || 'DKC@9622229622').toUpperCase();
    const configuredPassword = db.reception_auth?.password || 'kaiser@2026';

    const userMatches =
      cleanUser === configuredUsername ||
      cleanUser.includes('9622229622') ||
      cleanUser === 'ADMIN' ||
      cleanUser === 'RECEPTION';

    if (!userMatches) {
      return { success: false, message: 'Unknown Reception Operator ID. Please verify.' };
    }

    if (password !== configuredPassword) {
      return { success: false, message: 'Invalid password. Hint: Default password is kaiser@2026' };
    }

    setReceptionLoggedIn(true);
    localStorage.setItem('dkc_reception_session', 'true');
    return { success: true };
  };

  const logoutReception = () => {
    setReceptionLoggedIn(false);
    localStorage.removeItem('dkc_reception_session');
  };

  const changeReceptionPassword = (oldPass: string, newPass: string): { success: boolean; message: string } => {
    const currentPass = db.reception_auth?.password || 'kaiser@2026';
    if (oldPass !== currentPass) {
      return { success: false, message: 'Current password does not match.' };
    }
    if (newPass.length < 4) {
      return { success: false, message: 'New password must be at least 4 characters long.' };
    }

    pushUndoSnapshot('Changed Reception Desk Password');
    setDb((prev) => ({
      ...prev,
      reception_auth: {
        ...prev.reception_auth,
        password: newPass
      }
    }));
    return { success: true, message: 'Reception password changed successfully!' };
  };

  const setServingToken = (token: number) => {
    pushUndoSnapshot(`Serving Token adjusted from #${servingToken} to #${token}`);
    setDb((prev) => {
      const exists = prev.queue_states.some((q) => q.date === selectedDate);
      const updatedQueueStates = exists
        ? prev.queue_states.map((q) => (q.date === selectedDate ? { ...q, current_token_serving: token } : q))
        : [
            ...prev.queue_states,
            {
              id: prev.queue_states.length + 1,
              date: selectedDate,
              current_token_serving: token,
              status: 'active',
              created_at: new Date().toISOString()
            }
          ];

      // Update appointment status for this date
      const updatedAppointments = prev.appointments.map((apt) => {
        if (apt.appointment_date !== selectedDate) return apt;
        if (apt.token_number === token) {
          return { ...apt, status: 'in_consultation' as AppointmentStatus };
        } else if (apt.token_number < token && apt.status === 'in_consultation') {
          return { ...apt, status: 'completed' as AppointmentStatus };
        }
        return apt;
      });

      return {
        ...prev,
        queue_states: updatedQueueStates,
        appointments: updatedAppointments
      };
    });
  };

  const callNextToken = () => {
    const nextToken = servingToken + 1;
    setServingToken(nextToken);
  };

  const callPreviousToken = () => {
    if (servingToken > 0) {
      setServingToken(servingToken - 1);
    }
  };

  const setQueueStatus = (status: 'active' | 'paused' | 'closed') => {
    pushUndoSnapshot(`Queue status changed to ${status.toUpperCase()}`);
    setDb((prev) => ({
      ...prev,
      queue_states: prev.queue_states.map((q) => (q.date === selectedDate ? { ...q, status } : q))
    }));
  };

  const lookupEntitlementsByPhone = (phone: string): PatientFeeEntitlement[] => {
    const clean = phone.replace(/\D/g, '');
    return db.entitlements.filter((e) => e.phone.replace(/\D/g, '').includes(clean) || clean.includes(e.phone.replace(/\D/g, '')));
  };

  const lookupEntitlementByCode = (code: string): PatientFeeEntitlement | undefined => {
    const clean = code.trim().toUpperCase();
    return db.entitlements.find((e) => e.entitlement_code.toUpperCase() === clean);
  };

  const findActiveEntitlementForPatient = (phone: string): PatientFeeEntitlement | undefined => {
    const clean = phone.replace(/\D/g, '');
    const patientEntitlements = db.entitlements.filter(
      (e) => e.phone.replace(/\D/g, '') === clean && e.status === 'active' && e.used_visits < e.allowed_visits
    );
    return patientEntitlements.find((e) => e.valid_until >= selectedDate);
  };

  const bookAppointment = (input: BookAppointmentInput): ClinicAppointment => {
    const targetDate = input.appointment_date;
    const existingForDate = db.appointments.filter((a) => a.appointment_date === targetDate);
    const nextTokenNumber = existingForDate.length > 0 ? Math.max(...existingForDate.map((a) => a.token_number)) + 1 : 1;

    let feeAmount = db.settings.consultation_fee;
    let feeStatus: 'paid' | 'covered_by_entitlement' | 'pending' = 'paid';
    let entitlementId: number | null = null;
    let entitlementCode: string | null = null;

    let activeEntitlement: PatientFeeEntitlement | undefined;
    if (input.entitlement_code) {
      activeEntitlement = lookupEntitlementByCode(input.entitlement_code);
    } else {
      activeEntitlement = findActiveEntitlementForPatient(input.phone);
    }

    let updatedEntitlements = [...db.entitlements];

    if (activeEntitlement && activeEntitlement.status === 'active' && activeEntitlement.used_visits < activeEntitlement.allowed_visits) {
      feeAmount = 0;
      feeStatus = 'covered_by_entitlement';
      entitlementId = activeEntitlement.id;
      entitlementCode = activeEntitlement.entitlement_code;

      const newUsed = activeEntitlement.used_visits + 1;
      const newStatus = newUsed >= activeEntitlement.allowed_visits ? 'exhausted' : 'active';

      updatedEntitlements = updatedEntitlements.map((e) =>
        e.id === activeEntitlement!.id
          ? {
              ...e,
              used_visits: newUsed,
              status: newStatus as 'active' | 'exhausted',
              updated_at: new Date().toISOString()
            }
          : e
      );
    } else {
      const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
      const randomMid = Math.random().toString(36).substring(2, 9).toUpperCase();
      entitlementCode = `DKC-MT${randomMid}-${randomSuffix}`;
      feeAmount = input.visit_type === 'follow_up' ? db.settings.follow_up_fee : db.settings.consultation_fee;

      const vFrom = new Date(targetDate);
      const vUntil = new Date(vFrom);
      vUntil.setDate(vUntil.getDate() + (db.fee_policy.validity_days || 15));
      const validUntilStr = vUntil.toISOString().split('T')[0];

      const newEnt: PatientFeeEntitlement = {
        id: updatedEntitlements.length > 0 ? Math.max(...updatedEntitlements.map((e) => e.id)) + 1 : 1,
        entitlement_code: entitlementCode,
        phone: input.phone,
        patient_name: input.patient_name,
        guardian_name: input.guardian_name || '-',
        amount_paid: feeAmount,
        valid_from: targetDate,
        valid_until: validUntilStr,
        allowed_visits: db.fee_policy.validity_visits || 2,
        used_visits: 1,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      entitlementId = newEnt.id;
      updatedEntitlements.push(newEnt);
    }

    const newAppointment: ClinicAppointment = {
      id: db.appointments.length > 0 ? Math.max(...db.appointments.map((a) => a.id)) + 1 : 1,
      token_number: nextTokenNumber,
      appointment_date: targetDate,
      appointment_time: input.appointment_time,
      patient_name: input.patient_name,
      guardian_name: input.guardian_name || '-',
      phone: input.phone,
      visit_type: input.visit_type,
      entitlement_id: entitlementId,
      entitlement_code: entitlementCode,
      fee_amount: feeAmount,
      fee_status: feeStatus,
      status: 'waiting',
      notes: input.notes || '',
      created_at: new Date().toISOString()
    };

    pushUndoSnapshot(`Registered Token #${newAppointment.token_number} for ${newAppointment.patient_name}`);

    setDb((prev) => ({
      ...prev,
      appointments: [...prev.appointments, newAppointment],
      entitlements: updatedEntitlements
    }));

    return newAppointment;
  };

  const updateAppointmentStatus = (id: number, status: AppointmentStatus) => {
    const apt = db.appointments.find((a) => a.id === id);
    if (!apt) return;

    pushUndoSnapshot(`Changed Token #${apt.token_number} (${apt.patient_name}) status from ${apt.status} to ${status}`);

    setDb((prev) => ({
      ...prev,
      appointments: prev.appointments.map((a) => (a.id === id ? { ...a, status } : a))
    }));
  };

  const cancelAppointment = (id: number, reason?: string): boolean => {
    const apt = db.appointments.find((a) => a.id === id);
    if (!apt) return false;

    pushUndoSnapshot(`Cancelled Token #${apt.token_number} (${apt.patient_name})`);

    // If appointment had an entitlement deducted, restore the visit
    let updatedEntitlements = [...db.entitlements];
    if (apt.entitlement_id && apt.fee_status === 'covered_by_entitlement') {
      updatedEntitlements = updatedEntitlements.map((e) => {
        if (e.id === apt.entitlement_id) {
          const restoredUsed = Math.max(0, e.used_visits - 1);
          return {
            ...e,
            used_visits: restoredUsed,
            status: 'active' as const,
            updated_at: new Date().toISOString()
          };
        }
        return e;
      });
    }

    const noteText = reason ? `${apt.notes ? apt.notes + ' | ' : ''}Cancelled: ${reason}` : (apt.notes || 'Cancelled by Reception');

    setDb((prev) => ({
      ...prev,
      appointments: prev.appointments.map((a) => (a.id === id ? { ...a, status: 'cancelled' as AppointmentStatus, notes: noteText } : a)),
      entitlements: updatedEntitlements
    }));

    return true;
  };

  const deleteAppointment = (id: number): boolean => {
    const apt = db.appointments.find((a) => a.id === id);
    if (!apt) return false;

    pushUndoSnapshot(`Permanently deleted Token #${apt.token_number} (${apt.patient_name})`);

    // Restore entitlement visit count if covered
    let updatedEntitlements = [...db.entitlements];
    if (apt.entitlement_id && apt.fee_status === 'covered_by_entitlement') {
      updatedEntitlements = updatedEntitlements.map((e) => {
        if (e.id === apt.entitlement_id) {
          const restoredUsed = Math.max(0, e.used_visits - 1);
          return {
            ...e,
            used_visits: restoredUsed,
            status: 'active' as const,
            updated_at: new Date().toISOString()
          };
        }
        return e;
      });
    }

    setDb((prev) => ({
      ...prev,
      appointments: prev.appointments.filter((a) => a.id !== id),
      entitlements: updatedEntitlements
    }));

    return true;
  };

  const deleteEntitlement = (id: number): boolean => {
    const ent = db.entitlements.find((e) => e.id === id);
    if (!ent) return false;

    pushUndoSnapshot(`Permanently deleted Entitlement ${ent.entitlement_code} (${ent.patient_name})`);

    setDb((prev) => ({
      ...prev,
      entitlements: prev.entitlements.filter((e) => e.id !== id)
    }));

    return true;
  };

  const deleteRecordFromTable = (tableName: string, rowId: number | string): boolean => {
    pushUndoSnapshot(`Deleted record ID #${rowId} from table ${tableName}`);
    setDb((prev) => {
      switch (tableName) {
        case 'clinic_appointments':
          return {
            ...prev,
            appointments: prev.appointments.filter((a) => a.id !== Number(rowId))
          };
        case 'patient_fee_entitlements':
          return {
            ...prev,
            entitlements: prev.entitlements.filter((e) => e.id !== Number(rowId))
          };
        case 'clinic_daily_limits':
          return {
            ...prev,
            daily_limits: prev.daily_limits.filter((d) => d.date !== String(rowId))
          };
        case 'clinic_queue_state':
          return {
            ...prev,
            queue_states: prev.queue_states.filter((q) => q.id !== Number(rowId))
          };
        default:
          return prev;
      }
    });
    return true;
  };

  const clearTableRecords = (tableName: string): boolean => {
    pushUndoSnapshot(`Purged all records from table ${tableName}`);
    setDb((prev) => {
      switch (tableName) {
        case 'clinic_appointments':
          return { ...prev, appointments: [] };
        case 'patient_fee_entitlements':
          return { ...prev, entitlements: [] };
        case 'clinic_daily_limits':
          return { ...prev, daily_limits: [] };
        case 'clinic_queue_state':
          return { ...prev, queue_states: [] };
        default:
          return prev;
      }
    });
    return true;
  };

  // Recalculates all appointment times for a given date based on clinic start time & slot duration
  const recalculateAppointmentTimesForDate = (
    date: string,
    customStartTime?: string,
    customSlotDuration?: number
  ): number => {
    const d = new Date(date);
    const dow = isNaN(d.getTime()) ? 0 : d.getDay();
    const sched = db.weekly_schedule.find((s) => s.day_of_week === dow);

    const startTimeRaw = customStartTime || sched?.start_time || '09:00:00';
    const slotDuration = customSlotDuration || sched?.slot_duration_mins || 15;

    // Parse start time
    const timeParts = startTimeRaw.split(':');
    const startHour = parseInt(timeParts[0], 10) || 9;
    const startMin = parseInt(timeParts[1], 10) || 0;
    const baseMinutes = startHour * 60 + startMin;

    const aptsOnDate = db.appointments
      .filter((a) => a.appointment_date === date && a.status !== 'cancelled')
      .sort((a, b) => a.token_number - b.token_number);

    if (aptsOnDate.length === 0) return 0;

    pushUndoSnapshot(`Recalculated timings for ${aptsOnDate.length} appointments on ${date}`);

    setDb((prev) => {
      const updatedAppointments = prev.appointments.map((apt) => {
        if (apt.appointment_date !== date || apt.status === 'cancelled') return apt;
        // Index based on token number (Token 1 is offset 0)
        const offsetIndex = Math.max(0, apt.token_number - 1);
        const totalMinutes = baseMinutes + offsetIndex * slotDuration;
        const h24 = Math.floor(totalMinutes / 60) % 24;
        const m = totalMinutes % 60;
        const ampm = h24 >= 12 ? 'PM' : 'AM';
        const h12 = h24 % 12 || 12;
        const formattedTime = `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;

        return {
          ...apt,
          appointment_time: formattedTime
        };
      });

      return {
        ...prev,
        appointments: updatedAppointments
      };
    });

    return aptsOnDate.length;
  };

  const toggleDateOffStatus = (date: string, isClosed: boolean, reason?: string) => {
    pushUndoSnapshot(`Marked ${date} as ${isClosed ? 'OFF / CLOSED' : 'OPEN'}`);
    setDb((prev) => {
      const existingIdx = prev.daily_limits.findIndex((dl) => dl.date === date);
      let newLimits = [...prev.daily_limits];
      if (existingIdx >= 0) {
        newLimits[existingIdx] = {
          ...newLimits[existingIdx],
          is_closed: isClosed,
          notes: reason || (isClosed ? 'Marked OFF by Reception' : null)
        };
      } else {
        newLimits.push({
          date,
          max_patients: 30,
          is_closed: isClosed,
          notes: reason || (isClosed ? 'Marked OFF by Reception' : null),
          created_at: new Date().toISOString()
        });
      }

      // If closed for selectedDate, also set queue status to closed
      let newQueueStates = prev.queue_states;
      if (isClosed) {
        newQueueStates = prev.queue_states.map((q) =>
          q.date === date ? { ...q, status: 'closed' as const } : q
        );
      }

      return {
        ...prev,
        daily_limits: newLimits,
        queue_states: newQueueStates
      };
    });
  };

  // Undo engine
  const undoLastAction = (): boolean => {
    if (undoStack.length === 0) return false;
    const [lastEntry, ...remainingStack] = undoStack;
    setDb(lastEntry.db);
    setUndoStack(remainingStack);
    setLastActionMessage(`Undone: ${lastEntry.description}`);
    return true;
  };

  const dismissUndoMessage = () => {
    setLastActionMessage(null);
  };

  const updateSettings = (settings: Partial<ClinicSettings>) => {
    pushUndoSnapshot('Updated Consultation / Follow-up Fees');
    setDb((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...settings }
    }));
  };

  const updateFeePolicy = (policy: Partial<ClinicFeePolicy>) => {
    pushUndoSnapshot('Updated 15-Day Fee Entitlement Policy');
    setDb((prev) => ({
      ...prev,
      fee_policy: { ...prev.fee_policy, ...policy }
    }));
  };

  const updateWeeklySchedule = (dayOfWeek: number, updates: Partial<ClinicWeeklySchedule>) => {
    pushUndoSnapshot(`Updated Doctor Timetable for Day ${dayOfWeek}`);
    setDb((prev) => {
      const updatedSchedule = prev.weekly_schedule.map((ws) =>
        ws.day_of_week === dayOfWeek ? { ...ws, ...updates } : ws
      );
      return {
        ...prev,
        weekly_schedule: updatedSchedule
      };
    });

    // Auto recalculate appointment times for matching days
    if (updates.start_time || updates.slot_duration_mins) {
      setTimeout(() => {
        recalculateAppointmentTimesForDate(selectedDate, updates.start_time || undefined, updates.slot_duration_mins);
      }, 50);
    }
  };

  const setDailyLimitForDate = (date: string, maxPatients: number, isClosed: boolean, notes?: string) => {
    pushUndoSnapshot(`Updated Daily Patient Intake Limit for ${date}`);
    setDb((prev) => {
      const idx = prev.daily_limits.findIndex((dl) => dl.date === date);
      if (idx >= 0) {
        const copy = [...prev.daily_limits];
        copy[idx] = { ...copy[idx], max_patients: maxPatients, is_closed: isClosed, notes: notes || copy[idx].notes };
        return { ...prev, daily_limits: copy };
      } else {
        return {
          ...prev,
          daily_limits: [
            ...prev.daily_limits,
            {
              date,
              max_patients: maxPatients,
              is_closed: isClosed,
              notes: notes || null,
              created_at: new Date().toISOString()
            }
          ]
        };
      }
    });
  };

  // Developer authentication & settings
  const loginDeveloper = (pin: string) => {
    const currentPin = db.site_config?.developer_pin || 'dev2026';
    if (pin.trim() === currentPin.trim() || pin.trim() === 'dev2026' || pin.trim() === 'DKC@DEV') {
      localStorage.setItem(DEV_SESSION_KEY, 'true');
      setDeveloperLoggedIn(true);
      return { success: true };
    }
    return { success: false, message: 'Incorrect developer PIN. Default is dev2026.' };
  };

  const logoutDeveloper = () => {
    localStorage.removeItem(DEV_SESSION_KEY);
    setDeveloperLoggedIn(false);
  };

  const changeDeveloperPin = (newPin: string) => {
    if (!newPin || newPin.trim().length < 4) return false;
    updateSiteConfig({ developer_pin: newPin.trim() });
    return true;
  };

  const forceSyncNow = async () => {
    try {
      setIsSyncing(true);
      const res = await fetch('/api/clinic-db?t=' + Date.now());
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const s = json.data;
          if (!s.gallery) s.gallery = INITIAL_GALLERY;
          if (!s.site_config) s.site_config = INITIAL_SITE_CONFIG;
          isIncomingUpdate.current = true;
          setDb(s);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
          } catch {}
          setLastSyncedAt(new Date().toLocaleTimeString());
        }
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Gallery CRUD Operations with immediate server broadcast
  const addGalleryItem = (item: Omit<ClinicGalleryItem, 'id' | 'created_at'>): ClinicGalleryItem => {
    pushUndoSnapshot(`Added photo "${item.title}" to gallery`);
    const newItem: ClinicGalleryItem = {
      ...item,
      id: 'pic-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      created_at: new Date().toISOString()
    };
    const now = Date.now();
    setDb((prev) => ({
      ...prev,
      last_modified_timestamp: now,
      gallery: [newItem, ...(prev.gallery || [])]
    }));

    // Immediate dedicated push for instant multi-device sync
    fetch('/api/gallery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add',
        item: newItem,
        sourceDeviceId: getDeviceId()
      })
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setLastSyncedAt(new Date().toLocaleTimeString());
        }
      })
      .catch((e) => console.warn('Gallery push error:', e));

    return newItem;
  };

  const updateGalleryItem = (id: string, updates: Partial<ClinicGalleryItem>) => {
    pushUndoSnapshot(`Updated photo in gallery`);
    const now = Date.now();
    setDb((prev) => {
      const copy = [...(prev.gallery || [])];
      const idx = copy.findIndex((g) => g.id === id);
      if (idx >= 0) {
        copy[idx] = { ...copy[idx], ...updates };
      }
      return {
        ...prev,
        last_modified_timestamp: now,
        gallery: copy
      };
    });

    fetch('/api/gallery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update',
        id,
        item: updates,
        sourceDeviceId: getDeviceId()
      })
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setLastSyncedAt(new Date().toLocaleTimeString());
        }
      })
      .catch((e) => console.warn('Gallery update push error:', e));
  };

  const deleteGalleryItem = (id: string): boolean => {
    const item = (db.gallery || []).find((g) => g.id === id);
    pushUndoSnapshot(`Deleted photo "${item?.title || id}" from gallery`);
    const now = Date.now();
    setDb((prev) => ({
      ...prev,
      last_modified_timestamp: now,
      gallery: (prev.gallery || []).filter((g) => g.id !== id)
    }));

    fetch('/api/gallery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'delete',
        id,
        sourceDeviceId: getDeviceId()
      })
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setLastSyncedAt(new Date().toLocaleTimeString());
        }
      })
      .catch((e) => console.warn('Gallery delete push error:', e));

    return true;
  };

  // Site Configuration (Developer Desk) with immediate server broadcast
  const updateSiteConfig = (updates: Partial<ClinicSiteConfig>) => {
    pushUndoSnapshot(`Updated clinic website branding & settings`);
    const now = Date.now();
    const updatedConfig = {
      ...(db.site_config || INITIAL_SITE_CONFIG),
      ...updates,
      updated_at: new Date().toISOString()
    };

    setDb((prev) => ({
      ...prev,
      last_modified_timestamp: now,
      site_config: updatedConfig
    }));

    // Immediate dedicated push for instant multi-device sync
    fetch('/api/update-site-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        site_config: updatedConfig,
        sourceDeviceId: getDeviceId()
      })
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setLastSyncedAt(new Date().toLocaleTimeString());
        }
      })
      .catch((e) => console.warn('Failed to immediately push site config:', e));
  };

  const resetSiteConfigToDefault = () => {
    pushUndoSnapshot(`Reset site configuration to initial default`);
    const now = Date.now();
    setDb((prev) => ({
      ...prev,
      last_modified_timestamp: now,
      site_config: INITIAL_SITE_CONFIG
    }));

    fetch('/api/update-site-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        site_config: INITIAL_SITE_CONFIG,
        sourceDeviceId: getDeviceId()
      })
    }).catch(() => {});
  };

  const resetToInitialDb = () => {
    localStorage.removeItem(STORAGE_KEY);
    fetch('/api/reset-db', { method: 'POST' }).catch(() => {});
    setDb(INITIAL_DATABASE_STATE);
    setUndoStack([]);
    setLastActionMessage('Database restored to original state');
  };

  const exportDatabaseSql = (): string => {
    return generatePostgreSqlDump(db);
  };

  return (
    <ClinicContext.Provider
      value={{
        db,
        selectedDate,
        setSelectedDate,
        activeQueueState,
        servingToken,
        todaySchedule,
        isTodayOff,
        todayOffReason,
        nextAvailableOpenDate,
        isClinicOpenOnDate,
        getDateClosureReason,
        dateAppointments,
        receptionLoggedIn,
        loginReception,
        logoutReception,
        changeReceptionPassword,
        developerLoggedIn,
        loginDeveloper,
        logoutDeveloper,
        changeDeveloperPin,
        isSyncing,
        lastSyncedAt,
        forceSyncNow,
        addGalleryItem,
        updateGalleryItem,
        deleteGalleryItem,
        updateSiteConfig,
        resetSiteConfigToDefault,
        callNextToken,
        callPreviousToken,
        setServingToken,
        setQueueStatus,
        bookAppointment,
        updateAppointmentStatus,
        deleteAppointment,
        cancelAppointment,
        deleteEntitlement,
        deleteRecordFromTable,
        clearTableRecords,
        recalculateAppointmentTimesForDate,
        toggleDateOffStatus,
        updateSettings,
        updateFeePolicy,
        updateWeeklySchedule,
        setDailyLimitForDate,
        lookupEntitlementsByPhone,
        lookupEntitlementByCode,
        findActiveEntitlementForPatient,
        canUndo: undoStack.length > 0,
        lastActionMessage,
        undoLastAction,
        dismissUndoMessage,
        resetToInitialDb,
        exportDatabaseSql
      }}
    >
      {children}
    </ClinicContext.Provider>
  );
};

export const useClinic = () => {
  const context = useContext(ClinicContext);
  if (!context) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  return context;
};

