export interface ClinicSettings {
  id: number;
  consultation_fee: number;
  follow_up_fee: number;
  created_at: string;
}

export interface ClinicFeePolicy {
  id: number;
  validity_visits: number;
  validity_days: number;
  created_at: string;
}

export interface ClinicWeeklySchedule {
  day_of_week: number; // 0 = Sunday, 1 = Monday ... 6 = Saturday
  is_open: boolean;
  start_time: string | null; // e.g. "09:00:00"
  end_time: string | null;   // e.g. "17:00:00"
  slot_duration_mins: number;
  max_patients: number;
  created_at: string;
}

export interface ClinicDailyLimit {
  date: string; // YYYY-MM-DD
  max_patients: number;
  is_closed: boolean;
  created_at: string;
  notes?: string | null;
}

export interface ClinicQueueState {
  id: number;
  date: string; // YYYY-MM-DD
  current_token_serving: number;
  status: 'active' | 'paused' | 'closed';
  created_at: string;
}

export interface PatientFeeEntitlement {
  id: number;
  entitlement_code: string;
  phone: string;
  patient_name: string;
  guardian_name: string;
  amount_paid: number;
  valid_from: string; // YYYY-MM-DD
  valid_until: string; // YYYY-MM-DD
  allowed_visits: number;
  used_visits: number;
  status: 'active' | 'exhausted' | 'expired';
  created_at: string;
  updated_at: string;
}

export interface ReceptionAuth {
  id: number;
  username: string;
  email: string;
  password?: string;
  must_change_pw: boolean;
  created_at: string;
}

export type AppointmentStatus = 'waiting' | 'in_consultation' | 'completed' | 'cancelled' | 'no_show';
export type VisitType = 'new' | 'follow_up';

export interface ClinicAppointment {
  id: number;
  token_number: number;
  appointment_date: string;
  appointment_time: string;
  patient_name: string;
  guardian_name: string;
  phone: string;
  visit_type: VisitType;
  entitlement_id?: number | null;
  entitlement_code?: string | null;
  fee_amount: number;
  fee_status: 'paid' | 'covered_by_entitlement' | 'pending';
  status: AppointmentStatus;
  notes?: string;
  created_at: string;
}

export interface ClinicGalleryItem {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  category: string; // e.g. "Milestones", "Facilities", "Medical Camps", "Diagnostics", "Doctor & Care"
  image_url: string;
  description: string;
  is_milestone: boolean;
  created_at: string;
}

export interface ClinicSiteConfig {
  clinic_name: string;
  doctor_name: string;
  doctor_qualifications: string;
  doctor_specialties: string;
  tagline: string;
  subtagline: string;
  hero_badge_text: string;
  announcement_banner: string;
  show_announcement: boolean;
  logo_url: string;
  favicon_url: string;
  primary_phone: string;
  emergency_phone: string;
  whatsapp_number: string;
  email: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  pincode: string;
  google_maps_url: string;
  opd_timing_note: string;
  consultation_fee_description: string;
  follow_up_fee_description: string;
  footer_text: string;
  developer_pin: string;
  updated_at: string;
}

export interface ClinicDatabaseState {
  settings: ClinicSettings;
  fee_policy: ClinicFeePolicy;
  weekly_schedule: ClinicWeeklySchedule[];
  daily_limits: ClinicDailyLimit[];
  queue_states: ClinicQueueState[];
  entitlements: PatientFeeEntitlement[];
  appointments: ClinicAppointment[];
  reception_auth: ReceptionAuth;
  gallery: ClinicGalleryItem[];
  site_config: ClinicSiteConfig;
  last_modified_timestamp?: number;
}

