import React, { useState } from 'react';
import { 
  Database, 
  Download, 
  Copy, 
  Check, 
  RotateCcw, 
  Table, 
  Code2, 
  CheckCircle2, 
  AlertTriangle,
  FileText,
  Trash2,
  Lock
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';

export const DatabaseInspector: React.FC = () => {
  const { db, resetToInitialDb, exportDatabaseSql, deleteRecordFromTable, clearTableRecords } = useClinic();
  const [activeTable, setActiveTable] = useState<string>('patient_fee_entitlements');
  const [viewMode, setViewMode] = useState<'table' | 'sql' | 'json'>('table');
  const [copied, setCopied] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<{ table: string; id: number | string } | null>(null);
  const [purgeConfirmTable, setPurgeConfirmTable] = useState<string | null>(null);

  const tables = [
    { key: 'patient_fee_entitlements', label: 'patient_fee_entitlements', count: db.entitlements.length, deletable: true },
    { key: 'clinic_appointments', label: 'clinic_appointments', count: db.appointments.length, deletable: true },
    { key: 'clinic_weekly_schedule', label: 'clinic_weekly_schedule', count: db.weekly_schedule.length, deletable: false },
    { key: 'clinic_queue_state', label: 'clinic_queue_state', count: db.queue_states.length, deletable: true },
    { key: 'clinic_daily_limits', label: 'clinic_daily_limits', count: db.daily_limits.length, deletable: true },
    { key: 'clinic_settings', label: 'clinic_settings', count: 1, deletable: false },
    { key: 'clinic_fee_policy', label: 'clinic_fee_policy', count: 1, deletable: false },
    { key: 'reception_auth', label: 'reception_auth', count: 1, deletable: false }
  ];

  const currentTableConfig = tables.find((t) => t.key === activeTable);
  const isDeletableTable = currentTableConfig?.deletable ?? false;

  const getTableData = () => {
    switch (activeTable) {
      case 'patient_fee_entitlements':
        return db.entitlements;
      case 'clinic_appointments':
        return db.appointments;
      case 'clinic_weekly_schedule':
        return db.weekly_schedule;
      case 'clinic_queue_state':
        return db.queue_states;
      case 'clinic_daily_limits':
        return db.daily_limits;
      case 'clinic_settings':
        return [db.settings];
      case 'clinic_fee_policy':
        return [db.fee_policy];
      case 'reception_auth':
        return [db.reception_auth];
      default:
        return [];
    }
  };

  const sqlDump = exportDatabaseSql();

  const handleDownloadSql = () => {
    const blob = new Blob([sqlDump], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dr-kaisers-clinic-dump-${new Date().toISOString().split('T')[0]}.sql`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlDump);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all data back to the original PostgreSQL database dump?')) {
      resetToInitialDb();
      setActionNotice('Database restored to the exact initial PostgreSQL dump!');
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  const handleRowDelete = (row: Record<string, unknown>) => {
    const id = (row.id ?? row.date) as number | string;
    if (id === undefined) return;
    deleteRecordFromTable(activeTable, id);
    setDeleteConfirmId(null);
    setActionNotice(`Deleted record ${id} from ${activeTable}. You can click "Undo" in the header if needed.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handlePurgeTable = (tableName: string) => {
    clearTableRecords(tableName);
    setPurgeConfirmTable(null);
    setActionNotice(`Purged all records from ${tableName}.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const currentData = getTableData();
  const columns = currentData.length > 0 ? Object.keys(currentData[0]) : [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 text-cyan-800 text-xs font-semibold mb-2 border border-cyan-200">
            <Database className="w-3.5 h-3.5 text-cyan-600" />
            Imported PostgreSQL Schema & Data
          </div>
          <h2 className="font-heading font-extrabold text-2xl text-slate-900 tracking-tight">
            Database Inspector & SQL Exporter
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Project: <code className="font-mono text-cyan-700 font-bold">dr-kaisers-clinic</code> • PostgreSQL 16.14 dump
          </p>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleDownloadSql}
            className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download .sql Dump
          </button>

          <button
            onClick={handleCopySql}
            className="px-3.5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy SQL'}</span>
          </button>

          <button
            onClick={handleReset}
            className="px-3.5 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="Reset to the exact original database provided"
          >
            <RotateCcw className="w-4 h-4 text-rose-600" />
            <span>Reset to Original</span>
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        {/* Table selector & view switcher */}
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          {/* Tables Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 no-scrollbar">
            {tables.map((t) => (
              <button
                key={t.key}
                onClick={() => {
                  setActiveTable(t.key);
                  setDeleteConfirmId(null);
                  setPurgeConfirmTable(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTable === t.key
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                <span>{t.label}</span>
                <span className="text-[10px] bg-slate-700/40 text-cyan-200 px-1.5 py-0.2 rounded-full font-sans">
                  {t.count}
                </span>
              </button>
            ))}
          </div>

          {/* Action Tools & Mode Switcher */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
            {isDeletableTable && currentData.length > 0 && (
              <button
                onClick={() => setPurgeConfirmTable(activeTable)}
                className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                title={`Purge all records from ${activeTable}`}
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Delete All in {activeTable}</span>
              </button>
            )}

            <div className="inline-flex rounded-xl border border-slate-200 p-1 bg-white shrink-0">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                  viewMode === 'table' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-600'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                Table
              </button>
              <button
                onClick={() => setViewMode('sql')}
                className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                  viewMode === 'sql' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-600'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                PostgreSQL
              </button>
              <button
                onClick={() => setViewMode('json')}
                className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                  viewMode === 'json' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-600'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                JSON
              </button>
            </div>
          </div>
        </div>

        {/* View Mode 1: Table Grid */}
        {viewMode === 'table' && (
          <div className="overflow-x-auto max-h-[500px]">
            {currentData.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No records currently exist in <code className="font-mono text-slate-600">{activeTable}</code>.
              </div>
            ) : (
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
                  <tr>
                    {columns.map((col) => (
                      <th key={col} className="py-2.5 px-4 font-mono uppercase tracking-wider text-[11px]">
                        {col}
                      </th>
                    ))}
                    {isDeletableTable && (
                      <th className="py-2.5 px-4 font-mono uppercase tracking-wider text-[11px] text-right">
                        Delete
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {currentData.map((row, idx) => {
                    const rowKey = ((row as Record<string, unknown>).id ?? (row as Record<string, unknown>).date ?? idx) as number | string;
                    return (
                      <tr key={idx} className="hover:bg-cyan-50/40 transition-colors">
                        {columns.map((col) => {
                          const val = (row as Record<string, unknown>)[col];
                          return (
                            <td key={col} className="py-2.5 px-4 whitespace-nowrap">
                              {val === null || val === undefined ? (
                                <span className="text-slate-400 italic">NULL</span>
                              ) : typeof val === 'boolean' ? (
                                <span className={val ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                                  {String(val)}
                                </span>
                              ) : (
                                String(val)
                              )}
                            </td>
                          );
                        })}
                        {isDeletableTable && (
                          <td className="py-2 px-4 whitespace-nowrap text-right">
                            <button
                              onClick={() => setDeleteConfirmId({ table: activeTable, id: rowKey })}
                              className="px-2 py-1 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-sans text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                              title="Delete this record"
                            >
                              <Trash2 className="w-3 h-3 text-rose-600" />
                              <span>Delete</span>
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* View Mode 2: Raw SQL Dump */}
        {viewMode === 'sql' && (
          <div className="p-4 bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto max-h-[500px]">
            <pre className="leading-relaxed whitespace-pre">{sqlDump}</pre>
          </div>
        )}

        {/* View Mode 3: JSON Representation */}
        {viewMode === 'json' && (
          <div className="p-4 bg-slate-950 text-cyan-300 font-mono text-xs overflow-x-auto max-h-[500px]">
            <pre className="leading-relaxed whitespace-pre">
              {JSON.stringify(currentData, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* CONFIRMATION MODAL: SINGLE ROW DELETE */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white max-w-sm w-full rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-base text-slate-900">Delete Record</h4>
                <p className="text-xs text-slate-500">Table: <code className="font-mono text-teal-700">{deleteConfirmId.table}</code> • ID: {String(deleteConfirmId.id)}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete this row? This action will immediately update the database dump.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Keep Record
              </button>
              <button
                onClick={() => {
                  const targetRow = (currentData as Record<string, unknown>[]).find(
                    (r) => ((r.id ?? r.date) === deleteConfirmId.id)
                  );
                  if (targetRow) {
                    handleRowDelete(targetRow);
                  } else {
                    deleteRecordFromTable(deleteConfirmId.table, deleteConfirmId.id);
                    setDeleteConfirmId(null);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: PURGE ALL ROWS IN TABLE */}
      {purgeConfirmTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-base text-slate-900">Purge Entire Table?</h4>
                <p className="text-xs text-slate-500">Table: <code className="font-mono text-rose-700">{purgeConfirmTable}</code></p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete <strong>ALL</strong> records in <code className="font-mono text-slate-900">{purgeConfirmTable}</code>? You can restore original sample data at any time by clicking "Reset to Original".
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setPurgeConfirmTable(null)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handlePurgeTable(purgeConfirmTable)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm cursor-pointer"
              >
                Purge All Records
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
