import React, { useState, useRef } from 'react';
import { useClinic } from '../context/ClinicContext';
import { ClinicGalleryItem } from '../types';
import {
  Upload,
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Tag,
  Check,
  Award,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Search,
  X,
  FileImage,
  RefreshCw
} from 'lucide-react';

const CLINICAL_PRESETS = [
  {
    title: 'Modern Ultrasound & Diagnostic Suite',
    category: 'Diagnostics',
    url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80',
    description: 'High-definition digital sonography workstation with color Doppler examination.'
  },
  {
    title: 'Specialized Cardiology & ECG Unit',
    category: 'Diagnostics',
    url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80',
    description: '12-lead digital electrocardiogram station with immediate computerized rhythm analysis.'
  },
  {
    title: 'Consultant Clinical Chamber & Records Office',
    category: 'Facilities',
    url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80',
    description: 'Quiet, private physician consultation suite ensuring complete patient confidentiality.'
  },
  {
    title: 'Annual Regional Health & Free Checkup Camp',
    category: 'Medical Camps',
    url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80',
    description: 'Physician team conducting free blood sugar, vitals, and preventive diagnostics.'
  },
  {
    title: 'Digital Pharmacy & Safe Medicine Dispensary',
    category: 'Facilities',
    url: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=1200&q=80',
    description: 'Temperature-controlled pharmaceutical inventory with verified batch auditing.'
  },
  {
    title: 'Patient Waiting Lounge & Token Display',
    category: 'Facilities',
    url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80',
    description: 'Air-conditioned patient lounge with live queue display monitors.'
  }
];

export const ManagerPictureDesk: React.FC = () => {
  const { db, addGalleryItem, updateGalleryItem, deleteGalleryItem, isSyncing, lastSyncedAt } = useClinic();
  const galleryItems = db.gallery || [];

  // Form State
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<ClinicGalleryItem | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Facilities');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isMilestone, setIsMilestone] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setTitle('');
    setDate(new Date().toISOString().split('T')[0]);
    setCategory('Facilities');
    setImageUrl('');
    setDescription('');
    setIsMilestone(false);
    setFormError('');
    setEditingItem(null);
    setShowAddForm(false);
  };

  const handleStartEdit = (item: ClinicGalleryItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setDate(item.date);
    setCategory(item.category);
    setImageUrl(item.image_url);
    setDescription(item.description);
    setIsMilestone(item.is_milestone);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormError('Please select a valid image file (PNG, JPG, WebP)');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setFormError('Image file is too large. Please select an image under 8MB.');
      return;
    }

    setIsUploading(true);
    setFormError('');

    const reader = new FileReader();
    reader.onload = async (loadEvt) => {
      const dataUrl = loadEvt.target?.result as string;
      try {
        // Try posting to /api/upload-image
        const res = await fetch('/api/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataUrl, filename: file.name })
        });
        if (res.ok) {
          const json = await res.json();
          if (json.url) {
            setImageUrl(json.url);
          } else {
            setImageUrl(dataUrl);
          }
        } else {
          setImageUrl(dataUrl);
        }
      } catch {
        // Fallback to direct base64 dataUrl
        setImageUrl(dataUrl);
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (preset: typeof CLINICAL_PRESETS[0]) => {
    setImageUrl(preset.url);
    if (!title) setTitle(preset.title);
    if (!description) setDescription(preset.description);
    setCategory(preset.category);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Please provide a picture title.');
      return;
    }
    if (!imageUrl.trim()) {
      setFormError('Please upload an image file or paste an image URL.');
      return;
    }

    if (editingItem) {
      updateGalleryItem(editingItem.id, {
        title: title.trim(),
        date,
        category,
        image_url: imageUrl.trim(),
        description: description.trim(),
        is_milestone: isMilestone
      });
    } else {
      addGalleryItem({
        title: title.trim(),
        date,
        category,
        image_url: imageUrl.trim(),
        description: description.trim(),
        is_milestone: isMilestone
      });
    }

    resetForm();
  };

  const handleDelete = (id: string) => {
    deleteGalleryItem(id);
    setDeleteConfirmId(null);
  };

  // Filtered list
  const filteredItems = galleryItems.filter((item) => {
    const matchesCat = filterCategory === 'All' || item.category === filterCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const uniqueCategories = ['All', ...Array.from(new Set(galleryItems.map((g) => g.category)))];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-teal-700 uppercase tracking-wider mb-1">
            <ImageIcon className="w-4 h-4" />
            <span>Manager Media & Timeline Management</span>
          </div>
          <h2 className="text-xl font-heading font-extrabold text-slate-900">
            Clinic Pictures & Milestones Desk
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload new photos, edit captions, mark key milestones, or remove archived pictures. Changes sync instantly across all public screens and devices.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            id="btn-add-picture-toggle"
            onClick={() => {
              if (showAddForm && !editingItem) {
                resetForm();
              } else {
                resetForm();
                setShowAddForm(true);
              }
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            {showAddForm && !editingItem ? (
              <>
                <X className="w-4 h-4" />
                <span>Close Form</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Upload New Picture</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sync status alert */}
      <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-teal-900">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>
            <strong>Live Sync Enabled:</strong> Picture additions and edits are visible to the public immediately on every device.
          </span>
        </div>
        {lastSyncedAt && (
          <span className="text-[11px] text-teal-700">
            Last synced: {lastSyncedAt}
          </span>
        )}
      </div>

      {/* ADD / EDIT FORM */}
      {showAddForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border-2 border-teal-500/40 p-6 shadow-md space-y-6 animate-fade-in"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                {editingItem ? <Edit2 className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-heading">
                  {editingItem ? `Editing: ${editingItem.title}` : 'Upload & Publish New Picture'}
                </h3>
                <p className="text-xs text-slate-500">
                  Fill in the details below. Mark as "Milestone" to highlight it in the Chronological Timeline.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left: Image Upload & Preview */}
            <div className="md:col-span-5 space-y-4">
              <label className="block text-xs font-bold text-slate-700">
                Picture Source & Image File <span className="text-red-500">*</span>
              </label>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-colors ${
                  imageUrl
                    ? 'border-teal-400 bg-teal-50/20'
                    : 'border-slate-300 hover:border-teal-500 bg-slate-50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                {imageUrl ? (
                  <div className="space-y-3">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-full h-44 object-cover rounded-xl shadow-xs"
                      referrerPolicy="no-referrer"
                    />
                    <p className="text-[11px] text-teal-700 font-semibold flex items-center justify-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Image loaded. Click here to change file.</span>
                    </p>
                  </div>
                ) : (
                  <div className="py-6 space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mx-auto">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="text-xs font-bold text-slate-700">
                      Click to upload picture from device
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Supports JPG, PNG, WEBP (up to 8MB)
                    </p>
                  </div>
                )}
              </div>

              {/* Or paste direct URL */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Or Paste External Image URL
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Preset selection */}
              <div>
                <div className="text-[11px] font-semibold text-slate-500 mb-1.5 flex items-center justify-between">
                  <span>Or Pick from Clinic Presets</span>
                  <Sparkles className="w-3 h-3 text-amber-500" />
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {CLINICAL_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className="group relative h-14 rounded-lg overflow-hidden border border-slate-200 hover:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      title={preset.title}
                    >
                      <img
                        src={preset.url}
                        alt={preset.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 text-[9px] text-white p-1 flex items-end font-semibold line-clamp-1">
                        {preset.category}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Metadata fields */}
            <div className="md:col-span-7 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Picture Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Diagnostic Ultrasound Suite Inauguration"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Event / Milestone Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category Tag <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="Facilities">Facilities & Clinic Rooms</option>
                    <option value="Diagnostics">Diagnostics & Laboratory</option>
                    <option value="Milestones">Milestones & Achievements</option>
                    <option value="Medical Camps">Community & Medical Camps</option>
                    <option value="Doctor & Care">Doctor Consultation & Patient Care</option>
                    <option value="Equipment">Medical Technology</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Detailed Description
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain what is shown in this picture, equipment specifications, camp outcomes, or medical context..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Milestone Checkbox */}
              <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="chk-milestone"
                  checked={isMilestone}
                  onChange={(e) => setIsMilestone(e.target.checked)}
                  className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                />
                <label htmlFor="chk-milestone" className="text-xs cursor-pointer">
                  <span className="font-bold text-amber-900 block">
                    Feature on Timeline as a Major Milestone
                  </span>
                  <span className="text-amber-700 text-[11px]">
                    This picture will receive high prominence on the public Timeline Chronicle view with a chronological milestone badge.
                  </span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingItem ? 'Save & Update Picture' : 'Publish to Website & Timeline'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* FILTER & INVENTORY BAR */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
          {uniqueCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filterCategory === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search gallery photos..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* PICTURES INVENTORY LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              {/* Picture Thumbnail */}
              <div className="relative h-44 bg-slate-100 overflow-hidden">
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-900/80 text-white">
                    {item.category}
                  </span>
                  {item.is_milestone && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500 text-white flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      Milestone
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                  <Calendar className="w-3 h-3 text-teal-600" />
                  <span>{item.date}</span>
                </div>
                <h4 className="font-heading font-bold text-sm text-slate-900 line-clamp-2">
                  {item.title}
                </h4>
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 pt-2 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-[10px] text-slate-400 font-mono">
                {item.id}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleStartEdit(item)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 rounded-lg flex items-center gap-1 shadow-2xs transition-colors"
                >
                  <Edit2 className="w-3 h-3 text-teal-600" />
                  <span>Edit</span>
                </button>

                {deleteConfirmId === item.id ? (
                  <div className="flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-200">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="px-2 py-1 text-[11px] font-bold bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="px-1.5 py-1 text-[11px] text-slate-600 hover:text-slate-900"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirmId(item.id)}
                    className="p-1.5 text-xs text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete picture"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-800">No photos in this view</h4>
          <p className="text-xs text-slate-500 mt-1">
            Upload your first clinic photo or change your filter selection.
          </p>
        </div>
      )}
    </div>
  );
};
