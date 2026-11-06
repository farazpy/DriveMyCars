import React, { useState, useEffect } from 'react';
import {
  Car as CarIcon,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  IndianRupee,
  Upload,
  Fuel,
  Gauge,
  Users as Passengers,
  Info,
  Check,
  Image as ImageIcon,
  AlertCircle,
  Camera,
  Layers,
  Sparkles,
  ShieldCheck,
  Trash2,
  Loader2,
  X,
  Building2,
  Star
} from 'lucide-react';
import { Car, UserProfile } from '../types.ts';
import {
  POPULAR_VEHICLE_BRANDS,
  BRAND_MODELS_MAP,
  CATEGORIZED_FEATURES
} from '../data/vehicleData.ts';
import { IndianVehiclePlateInput } from './IndianVehiclePlateInput.tsx';
import { CityHubRadiusMap } from './CityHubRadiusMap.tsx';
import { uploadFileToHTKS3 } from '../utils/s3Upload.ts';
import { usePlatformSettings } from '../context/PlatformSettingsContext.tsx';

interface VehicleOnboardingWizardProps {
  user: UserProfile | null;
  isAdmin?: boolean;
  onComplete: (car: Car) => void;
  onCancel: () => void;
}

export const VehicleOnboardingWizard: React.FC<VehicleOnboardingWizardProps> = ({
  user,
  isAdmin = false,
  onComplete,
  onCancel,
}) => {
  const { settings } = usePlatformSettings();
  const availableCities = settings.available_cities || ['Pune', 'Mumbai', 'Bangalore', 'Delhi NCR', 'Goa', 'Hyderabad'];

  const [formStep, setFormStep] = useState<1 | 2 | 3>(1);

  // Vehicle Specs
  const [selectedBrand, setSelectedBrand] = useState<string>('Mahindra');
  const [customBrand, setCustomBrand] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('Thar 4x4 LX Hardtop');
  const [customModel, setCustomModel] = useState<string>('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [regNumber, setRegNumber] = useState('');
  const [type, setType] = useState<'SUV' | 'Sedan' | 'Electric' | 'Convertible' | 'Luxury' | 'Truck'>('SUV');
  const [transmission, setTransmission] = useState<'Automatic' | 'Manual'>('Automatic');
  const [fuel, setFuel] = useState<'Diesel' | 'Gasoline' | 'Electric' | 'Hybrid'>('Diesel');
  const [seats, setSeats] = useState<number>(5);
  const [mileage, setMileage] = useState<string>('15.5 km/l');
  const [kmLimit, setKmLimit] = useState<number>(300);
  const [extraKmRate, setExtraKmRate] = useState<number>(12);

  // Pricing & Location
  const [pricePerDay, setPricePerDay] = useState<number>(3499);
  const [securityDeposit, setSecurityDeposit] = useState<number>(3000);
  const [city, setCity] = useState('Pune');
  const [hubArea, setHubArea] = useState('Wakad');
  const [serviceRadius, setServiceRadius] = useState<number>(4);
  const [hubCoords, setHubCoords] = useState<{ lat: number; lng: number }>({ lat: 18.5987, lng: 73.7684 });
  const [pickupAddress, setPickupAddress] = useState<string>(
    user?.location || user?.address || 'Datta Mandir Road, Wakad, Pune, Maharashtra 411057'
  );
  const [isInstantBook, setIsInstantBook] = useState(true);

  // Overview, SEO, Features & Photos
  const [description, setDescription] = useState<string>(
    'Well-maintained, sanitized vehicle ready for outstation road trips and city drives. Includes FASTag, phone mounts, and 24/7 support.'
  );
  const [seoTitle, setSeoTitle] = useState<string>('');
  const [seoDescription, setSeoDescription] = useState<string>('');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
    'FASTag Toll Enabled',
    'Apple CarPlay / Android Auto',
    'Reverse Camera & 360 Sensors',
    '24/7 Roadside Assistance',
    'Cleaned & Sanitized Before Trip'
  ]);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [coverPhotoIndex, setCoverPhotoIndex] = useState<number>(0);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const [uploadProgressMsg, setUploadProgressMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [hostPhone, setHostPhone] = useState<string>(user?.phone?.replace(/\D/g, '').slice(0, 10) || '9823044889');

  // Admin Specific Controls
  const [adminHostName, setAdminHostName] = useState<string>(isAdmin ? 'Charvi Rental Official Fleet' : (user?.name || 'Verified Host'));
  const [adminDirectApprove, setAdminDirectApprove] = useState<boolean>(isAdmin);

  // Derived Brand & Model
  const isCustomBrand = selectedBrand === 'OTHER';
  const effectiveBrand = isCustomBrand ? customBrand.trim() : selectedBrand;
  const brandModels = !isCustomBrand && BRAND_MODELS_MAP[selectedBrand] ? BRAND_MODELS_MAP[selectedBrand] : [];
  const isCustomModel = isCustomBrand || selectedModel === 'OTHER_MODEL';
  const effectiveModel = isCustomModel ? customModel.trim() : selectedModel;

  const handleBrandChange = (brand: string) => {
    setSelectedBrand(brand);
    setErrorMsg(null);
    if (brand === 'OTHER') {
      setSelectedModel('OTHER_MODEL');
      setCustomModel('');
    } else {
      const models = BRAND_MODELS_MAP[brand] || [];
      if (models.length > 0) {
        setSelectedModel(models[0]);
        setCustomModel('');
      } else {
        setSelectedModel('OTHER_MODEL');
        setCustomModel('');
      }
    }
  };

  const handleFileUploadToS3 = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingPhoto(true);
    setErrorMsg(null);

    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const caption = `${effectiveBrand || 'Vehicle'} ${effectiveModel || 'Gallery'} Photo`;
        setUploadProgressMsg(`Uploading ${file.name} (${i + 1} of ${files.length}) to HTK S3 network...`);
        const url = await uploadFileToHTKS3(file, caption, (msg) => {
          setUploadProgressMsg(`(${i + 1}/${files.length}) ${msg}`);
        });
        uploadedUrls.push(url);
      }

      setGalleryImages((prev) => [...prev, ...uploadedUrls]);
    } catch (err: any) {
      console.error('S3 upload exception:', err);
      setErrorMsg(err.message || 'Error uploading file to S3');
    } finally {
      setIsUploadingPhoto(false);
      setUploadProgressMsg('');
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveGalleryImage = (indexToRemove: number) => {
    setGalleryImages((prev) => {
      const next = prev.filter((_, idx) => idx !== indexToRemove);
      if (coverPhotoIndex >= next.length) {
        setCoverPhotoIndex(Math.max(0, next.length - 1));
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!effectiveBrand) {
      setErrorMsg('Please select or specify a brand.');
      return;
    }
    if (!effectiveModel) {
      setErrorMsg('Please select or specify a model.');
      return;
    }
    if (!pricePerDay || pricePerDay <= 0) {
      setErrorMsg('Please set a valid daily rental rate.');
      return;
    }
    if (!pickupAddress.trim()) {
      setErrorMsg('Please provide a complete handover pickup address.');
      return;
    }

    setIsSubmitting(true);

    const activeCoverPhoto =
      galleryImages.length > 0 && galleryImages[coverPhotoIndex]
        ? galleryImages[coverPhotoIndex]
        : 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80';

    const fullTitle = `${effectiveBrand} ${effectiveModel} ${year}`;

    const newCarPayload: Partial<Car> = {
      lender_id: user?.id || (isAdmin ? 'admin-system-fleet' : 'host-manual'),
      lender_name: isAdmin ? adminHostName : (user?.name || 'Verified Host'),
      lender_avatar: user?.avatar || '',
      title: fullTitle,
      make: effectiveBrand,
      model: effectiveModel,
      year: Number(year),
      type,
      transmission,
      fuel,
      seats: Number(seats),
      price_per_day: Number(pricePerDay),
      security_deposit: Number(securityDeposit),
      location: pickupAddress,
      city: `${city}, Maharashtra`,
      hub_area: hubArea,
      service_radius: serviceRadius,
      hub_lat: hubCoords.lat,
      hub_lng: hubCoords.lng,
      reg_number: regNumber,
      description: description.trim(),
      seo_title: seoTitle.trim(),
      seo_description: seoDescription.trim(),
      mileage: mileage.trim(),
      km_limit: Number(kmLimit),
      extra_km_rate: Number(extraKmRate),
      image_url: activeCoverPhoto,
      images: galleryImages.length > 0 ? galleryImages : [activeCoverPhoto],
      features: selectedFeatures,
      rating: 5.0,
      reviews_count: 0,
      is_instant_book: isInstantBook,
      is_available: true,
      lender_phone: hostPhone,
      approval_status: isAdmin && adminDirectApprove ? 'approved' : 'pending',
    };

    try {
      const res = await fetch('/api/cars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCarPayload),
      });

      if (res.ok) {
        const createdCar = await res.json();
        onComplete(createdCar);
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Failed to submit vehicle listing.');
      }
    } catch (err: any) {
      console.error('Create car error:', err);
      setErrorMsg('Network error while saving vehicle listing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800 gap-3">
        <div>
          <h2 className="text-xl font-black text-neutral-900 dark:text-white flex items-center gap-2">
            <CarIcon className="w-5 h-5 text-orange-600" />
            <span>
              {isAdmin ? 'Admin Vehicle Master Onboarding' : 'List a Vehicle in Your Fleet'}
            </span>
            {isAdmin && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 font-extrabold uppercase tracking-wider">
                Direct Master Publisher
              </span>
            )}
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {isAdmin
              ? 'Onboard fleet vehicles directly into the public marketplace with instant approval and live Google Maps positioning.'
              : 'Add vehicle specifications, daily rate, pickup location, and HTK S3 photos to start earning.'}
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="px-3.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer self-start sm:self-auto"
        >
          Cancel & Return
        </button>
      </div>

      {/* Wizard Step Navigation */}
      <div className="flex items-center space-x-2 border-b border-neutral-200 dark:border-neutral-800 pb-3 text-xs font-bold">
        <button
          type="button"
          onClick={() => setFormStep(1)}
          className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
            formStep === 1
              ? 'bg-orange-600 text-white shadow-xs'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
          }`}
        >
          1. Vehicle Specifications
        </button>
        <button
          type="button"
          onClick={() => setFormStep(2)}
          className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
            formStep === 2
              ? 'bg-orange-600 text-white shadow-xs'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
          }`}
        >
          2. Rates & Google Map Hub
        </button>
        <button
          type="button"
          onClick={() => setFormStep(3)}
          className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
            formStep === 3
              ? 'bg-orange-600 text-white shadow-xs'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
          }`}
        >
          3. Preferences & S3 Gallery
        </button>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-300 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* STEP 1: VEHICLE SPECIFICATIONS */}
        {formStep === 1 && (
          <div className="space-y-5 bg-white dark:bg-neutral-900 p-6 sm:p-7 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <CarIcon className="w-4 h-4 text-orange-600" />
                  <span>1. Vehicle Brand, Model & Registration</span>
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Select brand and verified model from database or specify custom variant.
                </p>
              </div>
              {effectiveBrand && effectiveModel && (
                <div className="hidden sm:flex items-center px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-900/50 text-[11px] font-bold">
                  {effectiveBrand} {effectiveModel} ({year})
                </div>
              )}
            </div>

            {/* Row 1: Brand, Model, Year */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-300 mb-1.5 flex items-center justify-between">
                  <span>Brand / Make <span className="text-orange-600">*</span></span>
                </label>
                <select
                  value={selectedBrand}
                  onChange={(e) => handleBrandChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  {POPULAR_VEHICLE_BRANDS.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.country})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-300 mb-1.5">
                  Car Model <span className="text-orange-600">*</span>
                </label>
                {!isCustomBrand && brandModels.length > 0 ? (
                  <select
                    value={selectedModel}
                    onChange={(e) => {
                      setSelectedModel(e.target.value);
                      if (e.target.value !== 'OTHER_MODEL') setCustomModel('');
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    {brandModels.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                    <option value="OTHER_MODEL">+ Other (Custom model)</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                    placeholder="e.g. Creta, Thar, i20..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold focus:outline-none focus:border-orange-500"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-300 mb-1.5">
                  Manufacturing Year <span className="text-orange-600">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={2015}
                  max={2026}
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* Custom Make/Model inputs if OTHER selected */}
            {(isCustomBrand || (!isCustomBrand && selectedModel === 'OTHER_MODEL')) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-2xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40">
                {isCustomBrand && (
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      Custom Brand Name <span className="text-orange-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={customBrand}
                      onChange={(e) => setCustomBrand(e.target.value)}
                      placeholder="e.g. Isuzu, Lexus..."
                      className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-semibold focus:outline-none focus:border-orange-500"
                    />
                  </div>
                )}
                {(!isCustomBrand && selectedModel === 'OTHER_MODEL') && (
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      Custom Model Name <span className="text-orange-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={customModel}
                      onChange={(e) => setCustomModel(e.target.value)}
                      placeholder="e.g. Special Edition LX..."
                      className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-semibold focus:outline-none focus:border-orange-500"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Row 2: Body Type, Transmission, Fuel, Seats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-300 mb-1.5">Body Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="SUV">SUV</option>
                  <option value="Sedan">Sedan</option>
                  <option value="Electric">Electric (EV)</option>
                  <option value="Luxury">Luxury</option>
                  <option value="Convertible">Convertible</option>
                  <option value="Truck">Pickup / Offroad</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-300 mb-1.5">Transmission</label>
                <select
                  value={transmission}
                  onChange={(e) => setTransmission(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="Automatic">Automatic (AT)</option>
                  <option value="Manual">Manual (MT)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-300 mb-1.5">Fuel Type</label>
                <select
                  value={fuel}
                  onChange={(e) => setFuel(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="Diesel">Diesel</option>
                  <option value="Gasoline">Petrol / Gasoline</option>
                  <option value="Electric">Electric</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-300 mb-1.5">Seating Capacity</label>
                <select
                  value={seats}
                  onChange={(e) => setSeats(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value={4}>4 Seater</option>
                  <option value={5}>5 Seater</option>
                  <option value={7}>7 Seater</option>
                  <option value={8}>8 Seater</option>
                </select>
              </div>
            </div>

            {/* Row 3: Registration Plate Input */}
            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <IndianVehiclePlateInput value={regNumber} onChange={setRegNumber} />
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <span className="text-xs text-neutral-400 font-bold">Step 1 of 3</span>
              <button
                type="button"
                onClick={() => {
                  if (!effectiveBrand) {
                    setErrorMsg('Please select or specify a vehicle brand.');
                    return;
                  }
                  if (!effectiveModel) {
                    setErrorMsg('Please select or specify the vehicle model.');
                    return;
                  }
                  setErrorMsg(null);
                  setFormStep(2);
                }}
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-sm"
              >
                <span>Next: Pricing & Google Map Hub</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: RATES & GOOGLE MAP HUB */}
        {formStep === 2 && (
          <div className="space-y-5 bg-white dark:bg-neutral-900 p-6 sm:p-7 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-orange-600" />
                  <span>2. Daily Rental Pricing, Security & Google Map Hub</span>
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Set daily rate, refundable deposit, kilometer limit, and live Google Maps handover hub.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-300 mb-1.5">
                  Daily Rate (₹/day) <span className="text-orange-600">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-neutral-400">₹</span>
                  <input
                    type="number"
                    required
                    min={500}
                    max={50000}
                    value={pricePerDay}
                    onChange={(e) => setPricePerDay(Number(e.target.value))}
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-300 mb-1.5">
                  Security Deposit (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-neutral-400">₹</span>
                  <input
                    type="number"
                    min={0}
                    max={20000}
                    value={securityDeposit}
                    onChange={(e) => setSecurityDeposit(Number(e.target.value))}
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-300 mb-1.5">
                  Included Daily Km Limit
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={100}
                    max={1000}
                    value={kmLimit}
                    onChange={(e) => setKmLimit(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold focus:outline-none focus:border-orange-500"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-bold text-neutral-400">km/day</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5 flex items-center justify-between">
                  <span>Host Contact Number (10 Digits) <span className="text-orange-600">*</span></span>
                  <span className="text-[10px] text-neutral-400">{hostPhone.length}/10</span>
                </label>
                <div className="relative flex">
                  <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-xs font-extrabold text-neutral-500 select-none">
                    🇮🇳 +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={hostPhone}
                    onChange={(e) => setHostPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9823456789"
                    className="w-full px-3.5 py-2.5 rounded-r-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-mono font-bold tracking-wider focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="flex flex-col justify-center p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center space-x-2.5">
                  <input
                    type="checkbox"
                    id="wizardInstantBook"
                    checked={isInstantBook}
                    onChange={(e) => setIsInstantBook(e.target.checked)}
                    className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="wizardInstantBook" className="text-xs font-bold text-neutral-800 dark:text-neutral-200 cursor-pointer">
                    Enable Instant Booking
                  </label>
                </div>
                <p className="text-[10px] text-neutral-400 mt-1 pl-6">
                  Guests can book instantly without manual confirmation.
                </p>
              </div>
            </div>

            {/* Interactive Google Map Hub Component with Autocomplete */}
            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <CityHubRadiusMap
                city={city}
                onCityChange={setCity}
                hubArea={hubArea}
                onHubAreaChange={setHubArea}
                radiusKm={serviceRadius}
                onRadiusKmChange={setServiceRadius}
                coords={hubCoords}
                onCoordsChange={setHubCoords}
                pickupAddress={pickupAddress}
                onPickupAddressChange={setPickupAddress}
                availableCities={availableCities}
              />
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setFormStep(1)}
                className="px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-bold cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Back to Specs
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!pickupAddress.trim()) {
                    setErrorMsg('Please specify the vehicle pickup and handover address.');
                    return;
                  }
                  setErrorMsg(null);
                  setFormStep(3);
                }}
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-sm"
              >
                <span>Next: Preferences & S3 Gallery</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: PREFERENCES, SEO & S3 GALLERY */}
        {formStep === 3 && (
          <div className="space-y-6 bg-white dark:bg-neutral-900 p-6 sm:p-7 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-orange-600" />
                  <span>3. Description, Preferences & S3 Photo Upload</span>
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Add vehicle description, features, and upload high-res photos to HTK S3 Storage.
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                {selectedFeatures.length} Features Selected
              </span>
            </div>

            {/* Admin Direct Publishing Controls */}
            {isAdmin && (
              <div className="p-4 rounded-2xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 space-y-3">
                <span className="text-xs font-extrabold uppercase text-orange-800 dark:text-orange-300 block">
                  Admin Master Publishing Controls
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      Assigned Host / Organization Name:
                    </label>
                    <input
                      type="text"
                      value={adminHostName}
                      onChange={(e) => setAdminHostName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-semibold"
                    />
                  </div>
                  <div className="flex items-center space-x-2.5 pt-4 sm:pt-5">
                    <input
                      type="checkbox"
                      id="adminDirectApprove"
                      checked={adminDirectApprove}
                      onChange={(e) => setAdminDirectApprove(e.target.checked)}
                      className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="adminDirectApprove" className="text-xs font-bold text-neutral-800 dark:text-neutral-200 cursor-pointer">
                      Publish Live Immediately (Skip Moderation Queue)
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-200 mb-1.5 flex items-center justify-between">
                <span>Vehicle Overview & Guidelines <span className="text-orange-600">*</span></span>
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe car condition, sanitization, guidelines, and trip policy..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs focus:outline-none focus:border-orange-500 leading-relaxed"
              />
            </div>

            {/* Categorized Features Selection */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Included Features & Amenities
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                {CATEGORIZED_FEATURES.flatMap(c => c.features).map((feat) => {
                  const featName = typeof feat === 'string' ? feat : feat.id || feat.label;
                  const featLabel = typeof feat === 'string' ? feat : feat.label;
                  const isChecked = selectedFeatures.includes(featName);
                  return (
                    <button
                      key={featName}
                      type="button"
                      onClick={() => {
                        setSelectedFeatures((prev) =>
                          isChecked ? prev.filter((f) => f !== featName) : [...prev, featName]
                        );
                      }}
                      className={`px-3 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between border transition-all cursor-pointer ${
                        isChecked
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/40 text-orange-900 dark:text-orange-200 shadow-2xs'
                          : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 text-neutral-700 dark:text-neutral-300 hover:border-orange-200'
                      }`}
                    >
                      <span className="truncate">{featLabel}</span>
                      {isChecked && <Check className="w-3.5 h-3.5 text-orange-600 shrink-0 ml-1.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* HTK S3 Multi-Photo Upload */}
            <div className="space-y-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-orange-600" />
                    <span>Upload Vehicle Photos to HTK S3 Storage</span>
                  </h4>
                  <p className="text-[11px] text-neutral-400">
                    High-res photos stored on secure S3 cloud storage. Click any image below to designate it as the primary cover photo.
                  </p>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div className="p-6 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl bg-neutral-50 dark:bg-neutral-850 text-center relative hover:border-orange-500 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUploadToS3}
                  disabled={isUploadingPhoto}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center">
                    {isUploadingPhoto ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Upload className="w-5 h-5" />
                    )}
                  </div>
                  <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                    {isUploadingPhoto ? uploadProgressMsg : 'Select or Drag & Drop Multiple Car Photos'}
                  </p>
                  <p className="text-[10px] text-neutral-400">
                    JPG, PNG, WEBP · Stored on https://s3.htknetwork.in (<code className="text-orange-600">workspace_id: 20</code>)
                  </p>
                </div>
              </div>

              {/* Uploaded Gallery Grid */}
              {galleryImages.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 block">
                    Uploaded Gallery ({galleryImages.length} images) · Cover photo marked with orange ring:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                    {galleryImages.map((img, idx) => {
                      const isCover = coverPhotoIndex === idx;
                      return (
                        <div
                          key={idx}
                          className={`group relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                            isCover
                              ? 'border-orange-500 ring-2 ring-orange-500/30'
                              : 'border-neutral-200 dark:border-neutral-700 hover:border-orange-300'
                          }`}
                          onClick={() => setCoverPhotoIndex(idx)}
                        >
                          <img
                            src={img}
                            alt={`Car gallery ${idx}`}
                            className="w-full h-20 object-cover"
                          />
                          {isCover && (
                            <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-orange-600 text-white text-[9px] font-black rounded-md shadow-xs">
                              Cover
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveGalleryImage(idx);
                            }}
                            className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-red-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Form Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setFormStep(2)}
                className="px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-bold cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Back to Rates & Hub
              </button>

              <button
                type="submit"
                disabled={isSubmitting || isUploadingPhoto}
                className="px-7 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Publishing Vehicle...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isAdmin ? 'Publish Vehicle Live to Platform' : 'Submit Listing for Review'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
