import { ClinicDatabaseState } from '../types';

export function generatePostgreSqlDump(db: ClinicDatabaseState): string {
  const timestamp = new Date().toISOString();
  let sql = `-- Hatchable data export
-- project: dr-kaisers-clinic
-- exported: ${timestamp}
-- Platform auth tables (users/sessions/...) are not included.

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

--
-- Data for Name: clinic_settings; Type: TABLE DATA
--
INSERT INTO clinic_settings (id, consultation_fee, follow_up_fee, created_at) VALUES 
  (${db.settings.id}, ${db.settings.consultation_fee}, ${db.settings.follow_up_fee}, '${db.settings.created_at}');

--
-- Data for Name: clinic_fee_policy; Type: TABLE DATA
--
INSERT INTO clinic_fee_policy (id, validity_visits, validity_days, created_at) VALUES 
  (${db.fee_policy.id}, ${db.fee_policy.validity_visits}, ${db.fee_policy.validity_days}, '${db.fee_policy.created_at}');

--
-- Data for Name: clinic_weekly_schedule; Type: TABLE DATA
--
`;

  db.weekly_schedule.forEach((ws) => {
    const st = ws.start_time ? `'${ws.start_time}'` : 'NULL';
    const et = ws.end_time ? `'${ws.end_time}'` : 'NULL';
    sql += `INSERT INTO clinic_weekly_schedule VALUES (${ws.day_of_week}, ${ws.is_open}, ${st}, ${et}, ${ws.slot_duration_mins}, ${ws.max_patients}, '${ws.created_at}');\n`;
  });

  sql += `\n--
-- Data for Name: clinic_daily_limits; Type: TABLE DATA
--
`;
  db.daily_limits.forEach((dl) => {
    sql += `INSERT INTO clinic_daily_limits VALUES ('${dl.date}', ${dl.max_patients}, ${dl.is_closed}, '${dl.created_at}', NULL, NULL, NULL);\n`;
  });

  sql += `\n--
-- Data for Name: clinic_queue_state; Type: TABLE DATA
--
`;
  db.queue_states.forEach((qs) => {
    sql += `INSERT INTO clinic_queue_state VALUES (${qs.id}, '${qs.date}', ${qs.current_token_serving}, '${qs.status}', '${qs.created_at}');\n`;
  });

  sql += `\n--
-- Data for Name: patient_fee_entitlements; Type: TABLE DATA
--
`;
  db.entitlements.forEach((ent) => {
    sql += `INSERT INTO patient_fee_entitlements VALUES (${ent.id}, '${ent.entitlement_code}', '${ent.phone}', '${ent.patient_name.replace(/'/g, "''")}', '${ent.guardian_name.replace(/'/g, "''")}', ${ent.amount_paid}, '${ent.valid_from}', '${ent.valid_until}', ${ent.allowed_visits}, ${ent.used_visits}, '${ent.status}', '${ent.created_at}', '${ent.updated_at}');\n`;
  });

  sql += `\n--
-- Data for Name: clinic_appointments; Type: TABLE DATA
--
`;
  db.appointments.forEach((apt) => {
    const entId = apt.entitlement_id ? apt.entitlement_id : 'NULL';
    const entCode = apt.entitlement_code ? `'${apt.entitlement_code}'` : 'NULL';
    sql += `INSERT INTO clinic_appointments VALUES (${apt.id}, ${apt.token_number}, '${apt.appointment_date}', '${apt.appointment_time}', '${apt.patient_name.replace(/'/g, "''")}', '${apt.guardian_name.replace(/'/g, "''")}', '${apt.phone}', '${apt.visit_type}', ${entId}, ${entCode}, ${apt.fee_amount}, '${apt.fee_status}', '${apt.status}', '${(apt.notes || '').replace(/'/g, "''")}', '${apt.created_at}');\n`;
  });

  sql += `\n--
-- Data for Name: reception_auth; Type: TABLE DATA
--
INSERT INTO reception_auth VALUES (${db.reception_auth.id}, '${db.reception_auth.username}', '${db.reception_auth.email}', ${db.reception_auth.must_change_pw}, '${db.reception_auth.created_at}');

--
-- PostgreSQL database dump complete
--
`;

  return sql;
}
