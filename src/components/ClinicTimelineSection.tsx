import React from 'react';
import { useClinic } from '../context/ClinicContext';
import { ClinicGalleryItem } from '../types';
import { 
  Calendar, 
  Award, 
  ZoomIn, 
  ChevronRight, 
  Sparkles,
  Milestone,
  CheckCircle2
} from 'lucide-react';

interface ClinicTimelineSectionProps {
  onSelectPhoto: (item: ClinicGalleryItem) => void;
}

export const ClinicTimelineSection: React.FC<ClinicTimelineSectionProps> = ({ onSelectPhoto }) => {
  const { db } = useClinic();
  const galleryItems = db.gallery || [];
  const siteConfig = db.site_config;
  const clinicName = siteConfig?.clinic_name || "Dr. Kaiser's Clinic";

  // Filter milestone / key items for timeline, sorted chronologically descending
  const milestoneItems = [...galleryItems]
    .filter((item) => item.is_milestone || item.category === 'Milestones')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // If fewer than 2 flagged as milestones, take top 4 sorted items
  const timelineItems = milestoneItems.length >= 2 
    ? milestoneItems 
    : [...galleryItems].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  if (timelineItems.length === 0) {
    return null;
  }

  return (
    <section id="clinic-timeline-section" className="space-y-6 pt-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Official Journey & Chronicle</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 tracking-tight">
            Clinic Journey & Milestone Timeline
          </h2>
          <p className="mt-1 text-sm text-slate-600 max-w-2xl">
            A chronological timeline of medical milestones, diagnostic infrastructure upgrades, and community healthcare initiatives at {clinicName}.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-teal-800 bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200/60 self-start sm:self-auto">
          <Milestone className="w-4 h-4 text-teal-600" />
          <span>{timelineItems.length} Major Milestones</span>
        </div>
      </div>

      {/* Chronological Timeline Track */}
      <div className="relative pl-6 sm:pl-8 border-l-2 border-teal-300 space-y-8 ml-2 sm:ml-4 pt-2">
        {timelineItems.map((item, index) => {
          const formattedDate = new Date(item.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });

          return (
            <div key={item.id} className="relative group">
              {/* Timeline node icon */}
              <div className="absolute -left-[31px] sm:-left-[39px] top-3 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white border-4 border-teal-600 shadow-sm flex items-center justify-center group-hover:scale-110 group-hover:border-teal-500 transition-transform">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-600" />
              </div>

              {/* Timeline Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
                  {/* Photo Preview Thumbnail */}
                  <div
                    className="md:col-span-4 h-48 md:h-auto relative overflow-hidden cursor-pointer group/img bg-slate-100"
                    onClick={() => onSelectPhoto(item)}
                    title="Click to zoom picture"
                  >
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="bg-white/90 backdrop-blur-xs text-slate-800 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm">
                        <ZoomIn className="w-3.5 h-3.5 text-teal-600" />
                        <span>Enlarge Photo</span>
                      </div>
                    </div>
                    <div className="absolute top-2.5 left-2.5">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-900/80 backdrop-blur-xs text-white uppercase tracking-wider">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  {/* Content & Metadata */}
                  <div className="md:col-span-8 p-5 sm:p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-teal-700 mb-1.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formattedDate}</span>
                        </span>
                        {item.is_milestone && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">
                            <Award className="w-3 h-3 text-amber-600" />
                            Milestone
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-heading font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                        {item.title}
                      </h3>

                      <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-medium">
                        {clinicName} Chronicle
                      </span>
                      <button
                        type="button"
                        onClick={() => onSelectPhoto(item)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-900 cursor-pointer"
                      >
                        <span>View Photo</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
