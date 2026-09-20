import React, { useState } from 'react';
import { useClinic } from '../context/ClinicContext';
import { ClinicGalleryItem } from '../types';
import { 
  Image as ImageIcon, 
  Calendar, 
  ZoomIn, 
  ChevronDown, 
  ChevronUp, 
  ChevronRight,
  Search, 
  X, 
  Sparkles,
  Layers
} from 'lucide-react';

interface ClinicGallerySectionProps {
  onSelectPhoto: (item: ClinicGalleryItem) => void;
}

export const ClinicGallerySection: React.FC<ClinicGallerySectionProps> = ({ onSelectPhoto }) => {
  const { db } = useClinic();
  const galleryItems = db.gallery || [];
  const siteConfig = db.site_config;
  const clinicName = siteConfig?.clinic_name || "Dr. Kaiser's Clinic";

  // State: expanded to show full gallery
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = ['All', ...Array.from(new Set(galleryItems.map((item) => item.category)))];

  // Filtered gallery when expanded
  const filteredItems = galleryItems.filter((item) => {
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Default live items: 4 pictures live
  const initialLiveCount = 4;
  const livePictures = galleryItems.slice(0, initialLiveCount);
  const remainingCount = Math.max(0, galleryItems.length - initialLiveCount);

  if (galleryItems.length === 0) {
    return null;
  }

  return (
    <section id="clinic-gallery-section" className="space-y-6 pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-semibold mb-2">
            <ImageIcon className="w-3.5 h-3.5 text-cyan-600" />
            <span>Facilities & Clinical Care</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 tracking-tight">
            Clinic Photo Gallery
          </h2>
          <p className="mt-1 text-sm text-slate-600 max-w-2xl">
            Take a look inside {clinicName}'s clinical chambers, state-of-the-art diagnostic testing units, patient care amenities, and community outreach.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            id="btn-toggle-gallery-expand"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all bg-white border border-teal-300 text-teal-800 hover:bg-teal-50 shadow-xs cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-teal-600" />
            <span>{isExpanded ? 'Show Less Photos' : `View All Photos (${galleryItems.length})`}</span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-teal-600" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-teal-600" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Controls: Filter Pills & Search */}
      {isExpanded && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 animate-fade-in">
          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pictures..."
              className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* PICTURES DISPLAY: If not expanded, show 3-4 live pictures; if expanded, show filtered list */}
      {isExpanded ? (
        filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-800">No photos match your filter</p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="mt-3 px-3 py-1.5 text-xs font-semibold bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredItems.map((item) => (
              <GalleryCard key={item.id} item={item} onSelectPhoto={onSelectPhoto} />
            ))}
          </div>
        )
      ) : (
        /* 3 to 4 LIVE PICTURES */
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {livePictures.map((item) => (
              <GalleryCard key={item.id} item={item} onSelectPhoto={onSelectPhoto} />
            ))}
          </div>

          {/* Option for more photos */}
          {remainingCount > 0 && (
            <div className="text-center pt-2">
              <button
                type="button"
                id="btn-view-more-photos"
                onClick={() => setIsExpanded(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 font-bold text-xs shadow-xs hover:shadow-sm transition-all cursor-pointer group"
              >
                <Layers className="w-4 h-4 text-teal-600 group-hover:scale-110 transition-transform" />
                <span>View More Photos ({remainingCount} More)</span>
                <ChevronDown className="w-4 h-4 text-teal-600 group-hover:translate-y-0.5 transition-transform" />
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

interface GalleryCardProps {
  item: ClinicGalleryItem;
  onSelectPhoto: (item: ClinicGalleryItem) => void;
}

const GalleryCard: React.FC<GalleryCardProps> = ({ item, onSelectPhoto }) => {
  return (
    <div
      onClick={() => onSelectPhoto(item)}
      className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col cursor-pointer"
      title="Click to enlarge"
    >
      <div className="relative h-44 sm:h-48 bg-slate-100 overflow-hidden">
        <img
          src={item.image_url}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="bg-white/90 backdrop-blur-xs text-slate-800 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm">
            <ZoomIn className="w-3.5 h-3.5 text-teal-600" />
            <span>Enlarge</span>
          </div>
        </div>
        <div className="absolute top-2.5 left-2.5">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900/80 backdrop-blur-xs text-white">
            {item.category}
          </span>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium mb-1">
            <Calendar className="w-3 h-3 text-teal-600" />
            <span>{item.date}</span>
          </div>
          <h4 className="font-heading font-bold text-xs sm:text-sm text-slate-900 group-hover:text-teal-700 transition-colors line-clamp-1">
            {item.title}
          </h4>
          <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-teal-700">
          <span>View details</span>
          <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
};
