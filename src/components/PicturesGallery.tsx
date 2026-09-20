import React, { useState } from 'react';
import { useClinic } from '../context/ClinicContext';
import { ClinicGalleryItem } from '../types';
import {
  Calendar,
  Image as ImageIcon,
  Tag,
  Search,
  Award,
  ChevronRight,
  ZoomIn,
  X,
  Clock,
  Sparkles,
  Layers,
  ArrowRight,
  Lock,
  Edit3
} from 'lucide-react';

interface PicturesGalleryProps {
  onGoToManagerDesk?: () => void;
}

export const PicturesGallery: React.FC<PicturesGalleryProps> = ({ onGoToManagerDesk }) => {
  const { db, receptionLoggedIn } = useClinic();
  const galleryItems = db.gallery || [];
  const siteConfig = db.site_config;

  const [activeTab, setActiveTab] = useState<'timeline' | 'gallery'>('timeline');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLightboxItem, setSelectedLightboxItem] = useState<ClinicGalleryItem | null>(null);

  // Extract unique categories
  const categories = ['All', ...Array.from(new Set(galleryItems.map((item) => item.category)))];

  // Filtered items for gallery
  const filteredGallery = galleryItems.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Chronological timeline items (sorted by date descending)
  const timelineItems = [...galleryItems]
    .filter((item) => item.is_milestone || item.category === 'Milestones')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Fallback to all items sorted if no milestone is flagged
  const displayTimeline = timelineItems.length > 0
    ? timelineItems
    : [...galleryItems].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 animate-fade-in">
      {/* Header section with Dynamic Branding */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Official Visual Chronicle</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-slate-900 tracking-tight">
            {siteConfig?.clinic_name || "Dr. Kaiser's Clinic"} Pictures & Timeline
          </h1>
          <p className="mt-2 text-base text-slate-600 max-w-2xl">
            Explore our journey, milestone achievements, advanced clinical diagnostics, patient care outreach, and state-of-the-art medical facilities.
          </p>
        </div>

        {/* View Switcher and Manager Desk shortcut */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
            <button
              id="btn-view-timeline"
              onClick={() => setActiveTab('timeline')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'timeline'
                  ? 'bg-white text-teal-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Timeline Chronicle</span>
            </button>
            <button
              id="btn-view-gallery"
              onClick={() => setActiveTab('gallery')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'gallery'
                  ? 'bg-white text-teal-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Full Photo Gallery ({galleryItems.length})</span>
            </button>
          </div>

          {onGoToManagerDesk && (
            <button
              id="btn-open-manager-desk"
              onClick={onGoToManagerDesk}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all shadow-xs"
              title={receptionLoggedIn ? "Manage photos in Manager Desk" : "Login to Manager Desk to edit photos"}
            >
              <Edit3 className="w-3.5 h-3.5 text-teal-600" />
              <span>Manager Desk</span>
              {!receptionLoggedIn && <Lock className="w-3 h-3 text-slate-400" />}
            </button>
          )}
        </div>
      </div>

      {/* TIMELINE VIEW */}
      {activeTab === 'timeline' && (
        <div className="space-y-10">
          <div className="bg-teal-900/5 rounded-2xl p-4 sm:p-6 border border-teal-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-heading">
                  Chronological Journey & Healthcare Milestones
                </h3>
                <p className="text-xs text-slate-600">
                  Tracking clinical growth, diagnostic upgrades, and community healthcare initiatives.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('gallery')}
              className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1 shrink-0"
            >
              <span>View all {galleryItems.length} photos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="relative pl-6 sm:pl-8 border-l-2 border-teal-200 space-y-12 ml-2 sm:ml-4">
            {displayTimeline.map((item, index) => {
              const formattedDate = new Date(item.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              });

              return (
                <div key={item.id} className="relative group">
                  {/* Timeline node icon */}
                  <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white border-4 border-teal-600 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
                      {/* Image Preview */}
                      <div
                        className="md:col-span-5 h-56 md:h-auto relative overflow-hidden cursor-pointer group/img bg-slate-100"
                        onClick={() => setSelectedLightboxItem(item)}
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
                        <div className="absolute top-3 left-3">
                          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-900/80 backdrop-blur-xs text-white uppercase tracking-wider">
                            {item.category}
                          </span>
                        </div>
                      </div>

                      {/* Content details */}
                      <div className="md:col-span-7 p-6 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 mb-2">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formattedDate}</span>
                            {item.is_milestone && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">
                                <Award className="w-3 h-3 text-amber-600" />
                                Key Milestone
                              </span>
                            )}
                          </div>
                          <h2 className="text-xl font-heading font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                            {item.title}
                          </h2>
                          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                            {item.description}
                          </p>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[11px] text-slate-400">
                            Dr. Kaiser's Clinic Archive
                          </span>
                          <button
                            onClick={() => setSelectedLightboxItem(item)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-900"
                          >
                            <span>View Full Picture</span>
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
        </div>
      )}

      {/* GALLERY GRID VIEW */}
      {activeTab === 'gallery' && (
        <div className="space-y-6">
          {/* Controls: Search & Category Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            {/* Category Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pictures & descriptions..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Results count */}
          <div className="text-xs text-slate-500 flex items-center justify-between px-1">
            <span>
              Showing {filteredGallery.length} of {galleryItems.length} photos
              {selectedCategory !== 'All' && ` in "${selectedCategory}"`}
            </span>
          </div>

          {/* Picture Grid */}
          {filteredGallery.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-800">No pictures match your filter</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Try selecting a different category or clearing your search term.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setSearchQuery('');
                }}
                className="mt-4 px-4 py-2 text-xs font-semibold bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGallery.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedLightboxItem(item)}
                  className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer"
                >
                  <div className="relative h-52 bg-slate-100 overflow-hidden">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <span className="text-white text-xs font-semibold flex items-center gap-1.5">
                        <ZoomIn className="w-3.5 h-3.5" />
                        <span>Click to enlarge</span>
                      </span>
                    </div>
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-900/80 backdrop-blur-xs text-white">
                        {item.category}
                      </span>
                      {item.is_milestone && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500 text-white flex items-center gap-1 shadow-xs">
                          <Award className="w-3 h-3" />
                          Milestone
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium mb-1.5">
                        <Calendar className="w-3 h-3 text-teal-600" />
                        <span>{item.date}</span>
                      </div>
                      <h4 className="font-heading font-bold text-sm text-slate-900 group-hover:text-teal-700 transition-colors line-clamp-2">
                        {item.title}
                      </h4>
                      <p className="mt-2 text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-teal-700">
                      <span>View details</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* LIGHTBOX MODAL */}
      {selectedLightboxItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in">
          <div className="bg-white rounded-3xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-100 text-teal-800">
                  {selectedLightboxItem.category}
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {selectedLightboxItem.date}
                </span>
                {selectedLightboxItem.is_milestone && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    Key Milestone
                  </span>
                )}
              </div>
              <button
                id="btn-close-lightbox"
                onClick={() => setSelectedLightboxItem(null)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Image Body */}
            <div className="flex-1 overflow-y-auto">
              <div className="bg-slate-950 flex items-center justify-center max-h-[60vh]">
                <img
                  src={selectedLightboxItem.image_url}
                  alt={selectedLightboxItem.title}
                  className="max-h-[60vh] w-auto max-w-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="p-6 sm:p-8 space-y-3">
                <h3 className="text-xl sm:text-2xl font-heading font-bold text-slate-900">
                  {selectedLightboxItem.title}
                </h3>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  {selectedLightboxItem.description}
                </p>

                <div className="pt-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400 border-t border-slate-100">
                  <span>Photo ID: {selectedLightboxItem.id}</span>
                  <span>Captured for {siteConfig?.clinic_name || "Dr. Kaiser's Clinic"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
