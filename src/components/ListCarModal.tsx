import React, { useState } from 'react';
import {
  X,
  Car as CarIcon,
  MapPin,
  Upload,
  Zap,
  CheckCircle,
  Sparkles,
  Info,
  ShieldCheck,
  AlertCircle,
  Check,
  Camera,
  Trash2
} from 'lucide-react';
import { UserProfile } from '../types.ts';
import {
  POPULAR_VEHICLE_BRANDS,
  BRAND_MODELS_MAP,
  CATEGORIZED_FEATURES
} from '../data/vehicleData.ts';

interface ListCarModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onCarCreated: (carData: any) => Promise<void>;
  onSignInRequired: () => void;
}

export const ListCarModal: React.FC<ListCarModalProps> = ({
  isOpen,
  onClose,
  user,
  onCarCreated,
  onSignInRequired,
}) => {
  const [selectedBrand, setSelectedBrand] = useState('Mahindra');
  const [customBrand, setCustomBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('Thar 4x4 LX Hardtop');
  const [customModel, setCustomModel] = useState('');
  const [year, setYear] = useState(2024);
  const [type, setType] = useState<'SUV' | 'Sedan' | 'Electric' | 'Convertible' | 'Luxury' | 'Truck'>('SUV');
  const [transmission, setTransmission] = useState<'Automatic' | 'Manual'>('Automatic');
  const [fuel, setFuel] = useState<'Electric' | 'Hybrid' | 'Gasoline' | 'Diesel'>('Diesel');
  const [seats, setSeats] = useState(4);
  const [pricePerDay, setPricePerDay] = useState(3499);
  const [location, setLocation] = useState('Datta Mandir Road, Wakad');
  const [city, setCity] = useState('Pune, Maharashtra');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [isInstantBook, setIsInstantBook] = useState(true);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
    'FASTag Toll Enabled',
    'Apple CarPlay / Android Auto',
    'Reverse Camera & 360 Sensors',
    '24/7 Roadside Assistance',
    'Cleaned & Sanitized Before Trip'
  ]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const isCustomBrand = selectedBrand === 'OTHER';
  const effectiveBrand = isCustomBrand ? customBrand.trim() : selectedBrand;
  const brandModels = !isCustomBrand && BRAND_MODELS_MAP[selectedBrand] ? BRAND_MODELS_MAP[selectedBrand] : [];
  const isCustomModel = isCustomBrand || selectedModel === 'OTHER_MODEL';
  const effectiveModel = isCustomModel ? customModel.trim() : selectedModel;

  const handleBrandChange = (brand: string) => {
    setSelectedBrand(brand);
    if (brand === 'OTHER') {
      setSelectedModel('OTHER_MODEL');
      setCustomModel('');
    } else {
      const models = BRAND_MODELS_MAP[brand] || [];
      setSelectedModel(models.length > 0 ? models[0] : 'OTHER_MODEL');
      setCustomModel('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setUploadError(null);

    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('caption', `${effectiveBrand} ${effectiveModel} Photo`);
        formData.append('file_name', file.name);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (res.ok && (data.file_url || data.direct_link)) {
          urls.push(data.direct_link || data.file_url);
        } else {
          throw new Error(data.error || 'Failed to upload image to S3');
        }
      }
      setGalleryImages((prev) => [...prev, ...urls]);
    } catch (err: any) {
      setUploadError(err.message || 'Error uploading file to S3');
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const toggleFeature = (feat: string) => {
    if (selectedFeatures.includes(feat)) {
      setSelectedFeatures(selectedFeatures.filter(f => f !== feat));
    } else {
      setSelectedFeatures([...selectedFeatures, feat]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onSignInRequired();
      return;
    }

    if (!effectiveBrand) {
      setUploadError('Please select or specify a vehicle brand.');
      return;
    }
    if (!effectiveModel) {
      setUploadError('Please select or specify the vehicle model.');
      return;
    }
    if (galleryImages.length === 0) {
      setUploadError('Vehicle photo is required! Please upload at least 1 photo to HTK S3 before publishing.');
      return;
    }

    setIsSubmitting(true);
    try {
      const title = `${effectiveBrand} ${effectiveModel} ${year}`;
      await onCarCreated({
        lender_id: user.id,
        lender_name: user.name || 'Verified Host',
        lender_avatar: user.avatar || '',
        title,
        make: effectiveBrand,
        model: effectiveModel,
        year,
        type,
        transmission,
        fuel,
        seats,
        price_per_day: pricePerDay,
        location,
        city,
        image_url: galleryImages[0],
        images: galleryImages,
        features: selectedFeatures,
        is_instant_book: isInstantBook,
      });
      onClose();
    } catch (err: any) {
      console.error('Failed to list car:', err);
      setUploadError(err.message || 'Failed to save car');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 text-neutral-900 dark:text-neutral-100">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-orange-600 text-white shadow-2xs">
              <CarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-neutral-900 dark:text-white text-base sm:text-lg">
                List a Vehicle for Rent
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Host Portal · Verified Brands & HTK S3 Media Storage
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {uploadError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-300 font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Brand & Model Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-300 uppercase mb-1">
                Vehicle Brand <span className="text-orange-600">*</span>
              </label>
              <select
                value={selectedBrand}
                onChange={(e) => handleBrandChange(e.target.value)}
                className="w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-2.5 font-semibold focus:border-orange-500 focus:outline-none cursor-pointer"
              >
                {POPULAR_VEHICLE_BRANDS.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.country})
                  </option>
                ))}
              </select>
            </div>

            {isCustomBrand ? (
              <div>
                <label className="block text-[11px] font-bold text-orange-600 uppercase mb-1">
                  Specify Brand Name <span className="text-orange-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customBrand}
                  onChange={(e) => setCustomBrand(e.target.value)}
                  placeholder="e.g. Isuzu, Force Motors..."
                  className="w-full bg-white dark:bg-neutral-800 border border-orange-300 rounded-xl p-2.5 font-semibold focus:border-orange-500 focus:outline-none"
                />
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-300 uppercase mb-1">
                  Vehicle Model <span className="text-orange-600">*</span>
                </label>
                {brandModels.length > 0 ? (
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-2.5 font-semibold focus:border-orange-500 focus:outline-none cursor-pointer"
                  >
                    {brandModels.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                    <option value="OTHER_MODEL">+ Other (Enter custom model)</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                    placeholder="e.g. Model variant"
                    className="w-full bg-white dark:bg-neutral-800 border border-neutral-200 rounded-xl p-2.5 font-semibold focus:border-orange-500 focus:outline-none"
                  />
                )}
              </div>
            )}
          </div>

          {/* Custom Model input if OTHER_MODEL */}
          {!isCustomBrand && selectedModel === 'OTHER_MODEL' && (
            <div>
              <label className="block text-[11px] font-bold text-orange-600 uppercase mb-1">
                Enter Custom Model & Trim <span className="text-orange-600">*</span>
              </label>
              <input
                type="text"
                required
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                placeholder={`e.g. ${selectedBrand} Custom Edition...`}
                className="w-full bg-white dark:bg-neutral-800 border border-orange-300 rounded-xl p-2.5 font-semibold focus:border-orange-500 focus:outline-none"
              />
            </div>
          )}

          {/* Specs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-300 uppercase mb-1">
                Year
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                min="2015"
                max="2026"
                className="w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-2.5 font-semibold focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-300 uppercase mb-1">
                Body Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-2.5 font-semibold focus:border-orange-500 focus:outline-none cursor-pointer"
              >
                <option value="SUV">SUV</option>
                <option value="Sedan">Sedan</option>
                <option value="Electric">Electric</option>
                <option value="Luxury">Luxury</option>
                <option value="Convertible">Convertible</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-300 uppercase mb-1">
                Transmission
              </label>
              <select
                value={transmission}
                onChange={(e) => setTransmission(e.target.value as any)}
                className="w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-2.5 font-semibold focus:border-orange-500 focus:outline-none cursor-pointer"
              >
                <option value="Automatic">Automatic (AT)</option>
                <option value="Manual">Manual (MT)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-300 uppercase mb-1">
                Fuel
              </label>
              <select
                value={fuel}
                onChange={(e) => setFuel(e.target.value as any)}
                className="w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-2.5 font-semibold focus:border-orange-500 focus:outline-none cursor-pointer"
              >
                <option value="Diesel">Diesel</option>
                <option value="Gasoline">Petrol</option>
                <option value="Electric">Electric (EV)</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
          </div>

          {/* Pricing & Location in INR */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-300 uppercase mb-1">
                Daily Rate (₹ INR) <span className="text-orange-600">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 font-bold text-neutral-400">₹</span>
                <input
                  type="number"
                  value={pricePerDay}
                  onChange={(e) => setPricePerDay(Number(e.target.value))}
                  min="500"
                  step="100"
                  className="w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl pl-7 p-2.5 font-black text-neutral-900 dark:text-white focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-300 uppercase mb-1">
                City Hub
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Pune, Maharashtra"
                className="w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-2.5 font-semibold focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-300 uppercase mb-1">
                Pickup Address <span className="text-orange-600">*</span>
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Society, area, landmark"
                className="w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-2.5 font-semibold focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          {/* S3 Photo Uploader (Required, No stock templates) */}
          <div className="space-y-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-200 uppercase flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-orange-600" />
                <span>Upload Photos to HTK S3 Storage</span>
                <span className="text-red-500 font-extrabold text-[10px]">* Required</span>
              </label>
              {galleryImages.length > 0 && (
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  {galleryImages.length} photo(s) on S3
                </span>
              )}
            </div>

            <label className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-orange-500 rounded-2xl p-4 flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-850 cursor-pointer">
              <Upload className="w-6 h-6 text-orange-600 mb-1" />
              <span className="text-xs font-bold">
                {isUploading ? 'Uploading to HTK S3...' : 'Click to Upload Real Vehicle Photos'}
              </span>
              <span className="text-[10px] text-neutral-400">Multiple files supported (JPG, PNG, WEBP)</span>
              <input
                type="file"
                multiple
                accept="image/*"
                disabled={isUploading}
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {galleryImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {galleryImages.map((imgUrl, idx) => (
                  <div key={imgUrl} className="relative rounded-xl overflow-hidden border border-neutral-200 aspect-video">
                    <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                    {idx === 0 && (
                      <span className="absolute top-1 left-1 bg-orange-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded">
                        Cover
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setGalleryImages(galleryImages.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-md cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Instant Booking Toggle */}
          <label className="flex items-center justify-between p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-850 cursor-pointer">
            <div>
              <span className="font-bold text-neutral-900 dark:text-white block">Instant Booking</span>
              <span className="text-[11px] text-neutral-500">Renters book instantly without waiting for approval</span>
            </div>
            <input
              type="checkbox"
              checked={isInstantBook}
              onChange={(e) => setIsInstantBook(e.target.checked)}
              className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
            />
          </label>

          <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || galleryImages.length === 0}
              className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-2xs cursor-pointer flex items-center space-x-1.5"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>{isSubmitting ? 'Publishing...' : 'Publish Vehicle'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
