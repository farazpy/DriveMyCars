import React, { useState, useEffect } from 'react';
import {
  X,
  Car as CarIcon,
  IndianRupee,
  MapPin,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Trash2,
  Check,
  Save,
  Loader2,
  Sparkles,
  Layers,
  Info,
  ShieldCheck
} from 'lucide-react';
import { Car } from '../types.ts';
import { POPULAR_VEHICLE_BRANDS, BRAND_MODELS_MAP, CATEGORIZED_FEATURES } from '../data/vehicleData.ts';
import { IndianVehiclePlateInput } from './IndianVehiclePlateInput.tsx';
import { uploadFileToHTKS3 } from '../utils/s3Upload.ts';

interface EditCarModalProps {
  isOpen: boolean;
  onClose: () => void;
  car: Car | null;
  onCarUpdated: (updatedCar: Car) => void;
  isAdminMode?: boolean;
}

export const EditCarModal: React.FC<EditCarModalProps> = ({
  isOpen,
  onClose,
  car,
  onCarUpdated,
  isAdminMode = false,
}) => {
  const [selectedBrand, setSelectedBrand] = useState(car?.make || 'Hyundai');
  const [customBrand, setCustomBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState(car?.model || 'Creta');
  const [customModel, setCustomModel] = useState('');
  const [year, setYear] = useState(car?.year || 2024);
  const [type, setType] = useState(car?.type || 'SUV');
  const [transmission, setTransmission] = useState(car?.transmission || 'Automatic');
  const [fuel, setFuel] = useState(car?.fuel || 'Diesel');
  const [seats, setSeats] = useState(car?.seats || 5);
  const [mileage, setMileage] = useState(car?.mileage || '16 km/l');
  const [regNumber, setRegNumber] = useState(car?.reg_number || 'MH 14 NH 7408');

  // Rates & Location
  const [pricePerDay, setPricePerDay] = useState(car?.price_per_day || 3500);
  const [securityDeposit, setSecurityDeposit] = useState(car?.security_deposit || 2000);
  const [kmLimit, setKmLimit] = useState(car?.km_limit || 300);
  const [extraKmRate, setExtraKmRate] = useState(car?.extra_km_rate || 12);
  const [isInstantBook, setIsInstantBook] = useState(car?.is_instant_book ?? true);
  const [pickupAddress, setPickupAddress] = useState(car?.location || '');
  const [city, setCity] = useState(car?.city || 'Pune, Maharashtra');

  // Overview, SEO & Features
  const [description, setDescription] = useState(car?.description || '');
  const [seoTitle, setSeoTitle] = useState(car?.seo_title || '');
  const [seoDescription, setSeoDescription] = useState(car?.seo_description || '');
  const [customFeatureInput, setCustomFeatureInput] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(car?.features || []);

  // Photos
  const [galleryImages, setGalleryImages] = useState<string[]>(
    Array.isArray(car?.images) && car.images.length > 0 ? car.images : car?.image_url ? [car.image_url] : []
  );
  const [coverPhotoIndex, setCoverPhotoIndex] = useState(0);
  const [directImageUrlInput, setDirectImageUrlInput] = useState('');
  const [approvalStatus, setApprovalStatus] = useState<'approved' | 'pending' | 'rejected'>(
    car?.approval_status || 'approved'
  );

  // Uploading Loader & Save state
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadProgressMsg, setUploadProgressMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (car) {
      setSelectedBrand(car.make || 'Hyundai');
      setSelectedModel(car.model || 'Creta');
      setYear(car.year || 2024);
      setType(car.type || 'SUV');
      setTransmission(car.transmission || 'Automatic');
      setFuel(car.fuel || 'Diesel');
      setSeats(car.seats || 5);
      setMileage(car.mileage || '16 km/l');
      setRegNumber(car.reg_number || 'MH 14 NH 7408');
      setPricePerDay(car.price_per_day || 3500);
      setSecurityDeposit(car.security_deposit || 2000);
      setKmLimit(car.km_limit || 300);
      setExtraKmRate(car.extra_km_rate || 12);
      setIsInstantBook(car.is_instant_book ?? true);
      setPickupAddress(car.location || '');
      setCity(car.city || 'Pune, Maharashtra');
      setDescription(car.description || '');
      setSeoTitle(car.seo_title || '');
      setSeoDescription(car.seo_description || '');
      setSelectedFeatures(car.features || []);
      const imgs = Array.isArray(car.images) && car.images.length > 0 ? car.images : [car.image_url];
      setGalleryImages(imgs);
      const existingCoverIdx = imgs.findIndex((u) => u === car.image_url);
      setCoverPhotoIndex(existingCoverIdx >= 0 ? existingCoverIdx : 0);
      setApprovalStatus(car.approval_status || 'approved');
    }
  }, [car]);

  if (!isOpen || !car) return null;

  const isCustomBrand = selectedBrand === 'OTHER';
  const effectiveBrand = isCustomBrand ? customBrand.trim() : selectedBrand;
  const brandModels = !isCustomBrand && BRAND_MODELS_MAP[selectedBrand] ? BRAND_MODELS_MAP[selectedBrand] : [];
  const isCustomModel = isCustomBrand || selectedModel === 'OTHER_MODEL';
  const effectiveModel = isCustomModel ? customModel.trim() : selectedModel;

  const handleBrandChange = (b: string) => {
    setSelectedBrand(b);
    if (b === 'OTHER') {
      setSelectedModel('OTHER_MODEL');
    } else {
      const models = BRAND_MODELS_MAP[b] || [];
      setSelectedModel(models.length > 0 ? models[0] : 'OTHER_MODEL');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingPhoto(true);
    setErrorMsg(null);

    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgressMsg(`Uploading ${file.name} (${i + 1} of ${files.length}) to HTK S3 network...`);
        const url = await uploadFileToHTKS3(file, `${effectiveBrand} ${effectiveModel} Photo`, (msg) => {
          setUploadProgressMsg(`(${i + 1}/${files.length}) ${msg}`);
        });
        urls.push(url);
      }
      setGalleryImages((prev) => [...prev, ...urls]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error uploading file to HTK S3');
    } finally {
      setIsUploadingPhoto(false);
      setUploadProgressMsg('');
      if (e.target) e.target.value = '';
    }
  };

  const toggleFeature = (feat: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(feat) ? prev.filter((f) => f !== feat) : [...prev, feat]
    );
  };

  const handleAddCustomFeature = () => {
    const feat = customFeatureInput.trim();
    if (!feat) return;
    if (!selectedFeatures.includes(feat)) {
      setSelectedFeatures((prev) => [...prev, feat]);
    }
    setCustomFeatureInput('');
  };

  const handleRemoveImage = (idx: number) => {
    setGalleryImages((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (coverPhotoIndex >= next.length) setCoverPhotoIndex(Math.max(0, next.length - 1));
      return next;
    });
  };

  const activeCover = galleryImages[coverPhotoIndex] || galleryImages[0] || car.image_url;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveBrand || !effectiveModel) {
      setErrorMsg('Please select or enter the vehicle brand and model.');
      return;
    }
    if (!pickupAddress.trim()) {
      setErrorMsg('Detailed pickup address is required.');
      return;
    }
    if (galleryImages.length === 0) {
      setErrorMsg('At least one vehicle photo is required.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    const title = `${effectiveBrand} ${effectiveModel} ${year}`;
    const payload = {
      title,
      make: effectiveBrand,
      model: effectiveModel,
      year: Number(year),
      type,
      transmission,
      fuel,
      seats: Number(seats),
      mileage,
      reg_number: regNumber,
      price_per_day: Number(pricePerDay),
      security_deposit: Number(securityDeposit),
      km_limit: Number(kmLimit),
      extra_km_rate: Number(extraKmRate),
      is_instant_book: isInstantBook,
      location: pickupAddress.trim(),
      city,
      description: description.trim(),
      seo_title: seoTitle.trim(),
      seo_description: seoDescription.trim(),
      features: selectedFeatures,
      image_url: activeCover,
      images: galleryImages,
      ...(isAdminMode ? { approval_status: approvalStatus } : {}),
    };

    try {
      const res = await fetch(`/api/cars/${car.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updated = await res.json();
        onCarUpdated(updated);
        onClose();
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Failed to update vehicle details.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error while updating vehicle.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      {/* Uploading Progress Overlay */}
      {isUploadingPhoto && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center space-y-4 p-4 text-white">
          <div className="p-4 rounded-3xl bg-orange-600/20 border border-orange-500/40 animate-bounce">
            <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
          </div>
          <h4 className="font-extrabold text-lg">Uploading Vehicle Image to HTK S3 Cloud</h4>
          <p className="text-xs text-neutral-300 max-w-sm text-center animate-pulse">
            {uploadProgressMsg || 'Transferring high-res photo via dual-mode S3 network...'}
          </p>
        </div>
      )}

      <div className="relative w-full max-w-4xl bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 text-neutral-900 dark:text-neutral-100">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-orange-600 text-white shadow-2xs">
              <CarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-neutral-900 dark:text-white text-base sm:text-lg">
                Edit Vehicle Details — {car.title}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Update specifications, daily rental pricing, host location, preferences & S3 gallery photos.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-300 text-xs font-bold flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Specifications */}
          <div className="space-y-4">
            <h4 className="text-xs font-extrabold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <CarIcon className="w-4 h-4 text-orange-600" />
              <span>1. Vehicle Brand, Model & Specifications</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-300 mb-1">Brand / Make</label>
                <select
                  value={selectedBrand}
                  onChange={(e) => handleBrandChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  {POPULAR_VEHICLE_BRANDS.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-300 mb-1">Car Model</label>
                {!isCustomBrand && brandModels.length > 0 ? (
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    {brandModels.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                    <option value="OTHER_MODEL">+ Other Model</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                    placeholder="e.g. Creta, i20..."
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold focus:outline-none focus:border-orange-500"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-300 mb-1">Manufacturing Year</label>
                <input
                  type="number"
                  min={2015}
                  max={2026}
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-300 mb-1">Body Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="SUV">SUV</option>
                  <option value="Sedan">Sedan</option>
                  <option value="Electric">Electric</option>
                  <option value="Luxury">Luxury</option>
                  <option value="Convertible">Convertible</option>
                  <option value="Truck">Truck</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-300 mb-1">Transmission</label>
                <select
                  value={transmission}
                  onChange={(e) => setTransmission(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="Automatic">Automatic</option>
                  <option value="Manual">Manual</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-300 mb-1">Fuel Type</label>
                <select
                  value={fuel}
                  onChange={(e) => setFuel(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="Diesel">Diesel</option>
                  <option value="Gasoline">Petrol / Gasoline</option>
                  <option value="Electric">Electric</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <IndianVehiclePlateInput value={regNumber} onChange={setRegNumber} />
            </div>
          </div>

          {/* Section 2: Pricing & Location */}
          <div className="space-y-4 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <h4 className="text-xs font-extrabold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <IndianRupee className="w-4 h-4 text-orange-600" />
              <span>2. Daily Rental Rates, Security & Pickup Location</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-300 mb-1">Daily Rate (₹/day)</label>
                <input
                  type="number"
                  value={pricePerDay}
                  onChange={(e) => setPricePerDay(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-300 mb-1">Security Deposit (₹)</label>
                <input
                  type="number"
                  value={securityDeposit}
                  onChange={(e) => setSecurityDeposit(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-300 mb-1">Included Km Limit</label>
                <input
                  type="number"
                  value={kmLimit}
                  onChange={(e) => setKmLimit(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-300 mb-1">Detailed Host Pickup & Handover Address</label>
              <input
                type="text"
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                placeholder="e.g. Datta Mandir Road, Wakad, Pune..."
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Section 3: Overview, SEO & Preferences */}
          <div className="space-y-4 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <h4 className="text-xs font-extrabold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <Layers className="w-4 h-4 text-orange-600" />
              <span>3. Vehicle Overview, Custom Preferences & S3 Gallery</span>
            </h4>

            <div>
              <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-300 mb-1">Vehicle Description / Overview</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Custom Host Preferences Adder */}
            <div className="p-3.5 rounded-2xl bg-orange-50/60 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 space-y-2.5">
              <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                <span>Add Custom Preferences & Equipment</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customFeatureInput}
                  onChange={(e) => setCustomFeatureInput(e.target.value)}
                  placeholder="e.g. Pet Friendly, Dual Dashcam, Roof Box..."
                  className="flex-1 px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-semibold focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddCustomFeature}
                  className="px-3 py-1.5 bg-orange-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  + Add Preference
                </button>
              </div>

              {selectedFeatures.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedFeatures.map((feat) => (
                    <span key={feat} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-white dark:bg-neutral-900 border border-orange-300 dark:border-orange-800 text-xs font-bold text-orange-800 dark:text-orange-300">
                      <Check className="w-3 h-3 text-orange-600" />
                      <span>{feat}</span>
                      <button type="button" onClick={() => toggleFeature(feat)} className="ml-1 text-neutral-400 hover:text-red-600 cursor-pointer">&times;</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Photo Uploader & Direct URL Override */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-300 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-orange-600" />
                  <span>Vehicle Photos & Main Cover Selection ({galleryImages.length})</span>
                </label>
                <span className="text-[10px] text-neutral-400">
                  Click &quot;Set as Cover&quot; on any thumbnail to update the primary display photo
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-orange-500 rounded-2xl p-4 flex flex-col items-center justify-center bg-neutral-50/50 dark:bg-neutral-850/40 cursor-pointer transition-colors">
                  <Upload className="w-5 h-5 text-orange-600 mb-1" />
                  <span className="text-xs font-bold text-neutral-700 dark:text-neutral-200">
                    Upload New Photo to HTK S3
                  </span>
                  <span className="text-[10px] text-neutral-400">Supports JPG, PNG, WEBP</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    disabled={isUploadingPhoto}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <div className="p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-850/40 flex flex-col justify-between space-y-2">
                  <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                    Or Paste Direct Image URL (S3 / CDN Override)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={directImageUrlInput}
                      onChange={(e) => setDirectImageUrlInput(e.target.value)}
                      placeholder="https://s3.htknetwork.in/..."
                      className="flex-1 px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs focus:outline-none focus:border-orange-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const url = directImageUrlInput.trim();
                        if (!url) return;
                        setGalleryImages((prev) => {
                          const next = [...prev, url];
                          setCoverPhotoIndex(next.length - 1);
                          return next;
                        });
                        setDirectImageUrlInput('');
                      }}
                      className="px-3 py-1.5 bg-neutral-900 dark:bg-orange-600 text-white rounded-xl text-xs font-bold cursor-pointer shrink-0"
                    >
                      + Use Photo
                    </button>
                  </div>
                </div>
              </div>

              {galleryImages.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {galleryImages.map((img, idx) => {
                    const isCover = idx === coverPhotoIndex;
                    return (
                      <div
                        key={`${img}-${idx}`}
                        className={`relative group rounded-2xl overflow-hidden border aspect-[4/3] bg-neutral-100 dark:bg-neutral-800 ${
                          isCover
                            ? 'border-orange-500 ring-2 ring-orange-500/30 shadow-md'
                            : 'border-neutral-200 dark:border-neutral-800'
                        }`}
                      >
                        <img src={img} className="w-full h-full object-cover" alt="" />
                        {isCover && (
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-orange-600 text-white text-[9px] font-black uppercase tracking-wider shadow-xs">
                            Active Cover
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="p-1.5 rounded-lg bg-red-600 text-white cursor-pointer"
                              title="Remove photo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {!isCover && (
                            <button
                              type="button"
                              onClick={() => setCoverPhotoIndex(idx)}
                              className="w-full py-1 rounded-lg bg-white text-neutral-900 text-[10px] font-extrabold cursor-pointer"
                            >
                              Set as Cover
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {isAdminMode && (
              <div className="p-4 rounded-2xl bg-neutral-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 block">
                    Super Admin Governance Override
                  </span>
                  <p className="text-xs font-bold">Public Marketplace Approval Status</p>
                </div>
                <select
                  value={approvalStatus}
                  onChange={(e) => setApprovalStatus(e.target.value as any)}
                  className="px-3.5 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-xs font-bold text-white focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="approved">Approved (Live on Public Marketplace)</option>
                  <option value="pending">Pending Review (Withheld)</option>
                  <option value="rejected">Rejected (Hidden)</option>
                </select>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex justify-between items-center pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-bold text-neutral-600 dark:text-neutral-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || isUploadingPhoto}
              className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Changes...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
