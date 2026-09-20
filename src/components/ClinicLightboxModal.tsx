import React from 'react';
import { ClinicGalleryItem } from '../types';
import { useClinic } from '../context/ClinicContext';
import { X, Calendar, Award } from 'lucide-react';

interface ClinicLightboxModalProps {
  item: ClinicGalleryItem | null;
  onClose: () => void;
}

export const ClinicLightboxModal: React.FC<ClinicLightboxModalProps> = ({ item, onClose }) => {
  const { db } = useClinic();
  const siteConfig = db.site_config;
  const clinicName = siteConfig?.clinic_name || "Dr. Kaiser's Clinic";

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="bg-white rounded-3xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-100 text-teal-800">
              {item.category}
            </span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-teal-600" />
              {item.date}
            </span>
            {item.is_milestone && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                <Award className="w-3 h-3 text-amber-600" />
                Key Milestone
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Image Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="bg-slate-950 flex items-center justify-center max-h-[60vh]">
            <img
              src={item.image_url}
              alt={item.title}
              className="max-h-[60vh] w-auto max-w-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="p-6 sm:p-8 space-y-3">
            <h3 className="text-xl sm:text-2xl font-heading font-bold text-slate-900">
              {item.title}
            </h3>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              {item.description}
            </p>

            <div className="pt-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400 border-t border-slate-100">
              <span>Photo ID: {item.id}</span>
              <span>Captured for {clinicName}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
