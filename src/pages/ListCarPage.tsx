import React, { useState } from 'react';
import {
  Car as CarIcon,
  MapPin,
  IndianRupee,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Fuel,
  Gauge,
  Users as Passengers,
  Info,
  Building2,
  Plus,
  Trash2,
  Check,
  Zap,
  Image as ImageIcon,
  KeyRound,
  ChevronRight,
  Upload
} from 'lucide-react';
import { Car, UserProfile } from '../types.ts';
import { Link, useRouter } from '../router.tsx';
import { IndianVehiclePlateInput } from '../components/IndianVehiclePlateInput.tsx';
import { CityHubRadiusMap } from '../components/CityHubRadiusMap.tsx';
import { uploadFileToHTKS3 } from '../utils/s3Upload.ts';
import { usePlatformSettings } from '../context/PlatformSettingsContext.tsx';

interface ListCarPageProps {
  user: UserProfile | null;
  onSignInRequired: () => void;
  onCarCreated?: (carData: any) => Promise<void>;
}

const PRESET_PHOTO_OPTIONS = [
  { label: 'Mahindra Thar 4x4 (Black)', url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80' },
  { label: 'BMW 3 Series M Sport (White)', url: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Tata Nexon.ev / Electric (Teal)', url: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Toyota Fortuner 4x4 (Silver)', url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Hyundai Creta Sunroof (Grey)', url: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Porsche 718 Boxster (Yellow)', url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Audi A6 Matrix LED (Blue)', url: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Kia Seltos GT Line (Red)', url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80' },
];

const AVAILABLE_FEATURES = [
  'FASTag Toll Enabled',
  'Keyless Self-Pickup',
  'Apple CarPlay / Android Auto',
  'Electric Sunroof / Moonroof',
  'Reverse Camera & 360 Sensors',
  '24/7 Roadside Assistance',
  'Cleaned & Sanitized Before Trip',
  'Dashcam Equipped',
  'Child Safety ISOFIX Mounts',
  'Cruise Control'
];

export const ListCarPage: React.FC<ListCarPageProps> = ({
  user,
  onSignInRequired,
  onCarCreated,
}) => {
  const { settings } = usePlatformSettings();
  const availableCities = settings.available_cities || ['Pune', 'Mumbai', 'Bangalore', 'Delhi NCR', 'Goa', 'Hyderabad'];

  const { navigate } = useRouter();

  // Basic Details
  const [make, setMake] = useState('Mahindra');
  const [model, setModel] = useState('Thar 4x4 LX');
  const [year, setYear] = useState<number>(2024);
  const [regNumber, setRegNumber] = useState('MH 14 HZ 8899');
  const [type, setType] = useState<'SUV' | 'Sedan' | 'Electric' | 'Convertible' | 'Luxury' | 'Truck'>('SUV');
  const [transmission, setTransmission] = useState<'Automatic' | 'Manual'>('Automatic');
  const [fuel, setFuel] = useState<'Diesel' | 'Gasoline' | 'Electric' | 'Hybrid'>('Diesel');
  const [seats, setSeats] = useState<number>(4);

  // Pricing & Location
  const [pricePerDay, setPricePerDay] = useState<number>(3499);
  const [securityDeposit, setSecurityDeposit] = useState<number>(2000);
  const [city, setCity] = useState('Pune');
  const [hubArea, setHubArea] = useState('Wakad');
  const [serviceRadius, setServiceRadius] = useState<number>(3);
  const [hubCoords, setHubCoords] = useState<{ lat: number; lng: number }>({ lat: 18.5987, lng: 73.7684 });
  const [pickupAddress, setPickupAddress] = useState('Datta Mandir Road, Wakad, Pune, Maharashtra 411057');
  const [isInstantBook, setIsInstantBook] = useState(true);

  // Features & Photos
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
    'FASTag Toll Enabled',
    'Keyless Self-Pickup',
    'Apple CarPlay / Android Auto',
    'Cleaned & Sanitized Before Trip',
    '24/7 Roadside Assistance'
  ]);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string>(PRESET_PHOTO_OPTIONS[0].url);
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string>('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedCar, setSubmittedCar] = useState<Car | null>(null);

  const handleFileUploadToS3 = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    setErrorMsg(null);
    try {
      const s3Url = await uploadFileToHTKS3(file, `${year} ${make} ${model} Photo`);
      setCustomPhotoUrl(s3Url);
    } catch (err: any) {
      console.error('S3 upload exception:', err);
      setErrorMsg(err.message || 'Error uploading file to S3');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const toggleFeature = (feat: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(feat) ? prev.filter((f) => f !== feat) : [...prev, feat]
    );
  };

  const activePhoto = customPhotoUrl.trim() ? customPhotoUrl.trim() : selectedPhotoUrl;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      onSignInRequired();
      return;
    }

    if (!make.trim() || !model.trim() || !regNumber.trim() || !pickupAddress.trim()) {
      setErrorMsg('Please complete all required fields including registration and pickup location.');
      return;
    }

    if (pricePerDay < 500) {
      setErrorMsg('Daily rental rate must be at least ₹500.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const effectiveLenderId = user?.id || 'user-faraz';
    const effectiveLenderName = user?.name || 'Faraz (Verified Host)';
    const effectiveLenderAvatar = user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80';

    const title = `${year} ${make.trim()} ${model.trim()}`;
    const payload = {
      lender_id: effectiveLenderId,
      lender_name: effectiveLenderName,
      lender_avatar: effectiveLenderAvatar,
      title,
      make: make.trim(),
      model: model.trim(),
      year: Number(year),
      type,
      transmission,
      fuel,
      seats: Number(seats),
      price_per_day: Number(pricePerDay),
      security_deposit: Number(securityDeposit),
      location: pickupAddress.trim(),
      city: city.trim(),
      hub_area: hubArea,
      service_radius: serviceRadius,
      hub_lat: hubCoords.lat,
      hub_lng: hubCoords.lng,
      reg_number: regNumber,
      image_url: activePhoto,
      images: [activePhoto],
      features: selectedFeatures,
      is_instant_book: isInstantBook,
      is_available: true,
      approval_status: 'approved',
    };

    try {
      if (onCarCreated) {
        await onCarCreated(payload);
      } else {
        const res = await fetch('/api/cars', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to publish vehicle listing.');
        }
        const created = await res.json();
        setSubmittedCar(created);
      }
      setSubmittedCar(payload as any);
    } catch (err: any) {
      console.error('List car error:', err);
      setErrorMsg(err.message || 'Failed to publish vehicle listing. Please check your network connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans transition-colors py-8 sm:py-12">
      <div className="w-full px-4 sm:px-8 lg:px-12 max-w-5xl mx-auto space-y-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-neutral-500 dark:text-neutral-400">
            <Link
              to="/lender"
              className="inline-flex items-center space-x-1 font-semibold text-neutral-700 dark:text-neutral-300 hover:text-orange-600 dark:hover:text-orange-400"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Host Dashboard</span>
            </Link>
            <span>/</span>
            <span className="font-bold text-neutral-900 dark:text-white">List New Vehicle</span>
          </div>

          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
            <Sparkles className="w-3.5 h-3.5 text-orange-600" />
            <span>Host Listing Portal · Pune Fleet</span>
          </div>
        </div>

        {/* Success Confirmation Card */}
        {submittedCar ? (
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-8 sm:p-12 text-center space-y-6 shadow-xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2 max-w-lg mx-auto">
              <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
                Vehicle Submitted for Review!
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Your <strong className="text-neutral-900 dark:text-white">{submittedCar.title}</strong> has been saved to the database with registration <span className="font-mono font-bold text-neutral-700 dark:text-neutral-300">{regNumber}</span>.
              </p>
            </div>

            <div className="max-w-md mx-auto p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs text-left space-y-2.5">
              <div className="flex justify-between items-center pb-2 border-b border-neutral-200 dark:border-neutral-800">
                <span className="text-neutral-400 font-medium">Daily Rental Rate:</span>
                <span className="font-extrabold text-orange-600 text-sm">₹{pricePerDay.toLocaleString('en-IN')}/day</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-neutral-200 dark:border-neutral-800">
                <span className="text-neutral-400 font-medium">Initial Status:</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300">
                  Pending Admin Verification
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400 font-medium">Pickup Location:</span>
                <span className="font-semibold text-neutral-800 dark:text-neutral-200 text-right truncate max-w-[200px]">
                  {city}
                </span>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/lender"
                className="w-full sm:w-auto px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl text-xs font-extrabold shadow-sm flex items-center justify-center space-x-2"
              >
                <span>View in Host Dashboard</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSubmittedCar(null);
                  setModel('');
                  setRegNumber('');
                }}
                className="w-full sm:w-auto px-6 py-3 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-700 dark:text-neutral-300 rounded-2xl text-xs font-bold"
              >
                List Another Vehicle
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Header info */}
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
                List a Vehicle on Charvi Rental
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                Provide accurate vehicle specifications, daily pricing, and high-resolution photos to publish your listing to thousands of drivers.
              </p>
            </div>

            {errorMsg && (
              <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 rounded-2xl flex items-center space-x-2">
                <Info className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* SECTION 1: VEHICLE SPECIFICATIONS */}
            <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex items-center space-x-3 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center font-bold">
                  <CarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-neutral-900 dark:text-white text-base">Vehicle Specifications</h3>
                  <p className="text-xs text-neutral-400">Brand, model, fuel type, transmission, and seating</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider text-[11px]">
                    Brand / Manufacturer *
                  </label>
                  <input
                    type="text"
                    required
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    placeholder="e.g. Mahindra, Hyundai, BMW"
                    className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-orange-500 text-neutral-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider text-[11px]">
                    Model & Variant *
                  </label>
                  <input
                    type="text"
                    required
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="e.g. Thar 4x4 LX Hardtop"
                    className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-orange-500 text-neutral-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider text-[11px]">
                    Registration Year *
                  </label>
                  <input
                    type="number"
                    required
                    min={2015}
                    max={2026}
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-orange-500 text-neutral-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider text-[11px]">
                    Vehicle Body Type *
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-orange-500 text-neutral-900 dark:text-white"
                  >
                    <option value="SUV">SUV (Sport Utility)</option>
                    <option value="Sedan">Sedan (Executive)</option>
                    <option value="Electric">Electric Vehicle (EV)</option>
                    <option value="Luxury">Luxury / Premium</option>
                    <option value="Convertible">Convertible / Coupe</option>
                    <option value="Truck">Truck / Commercial</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider text-[11px]">
                    Transmission Type *
                  </label>
                  <select
                    value={transmission}
                    onChange={(e) => setTransmission(e.target.value as any)}
                    className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-orange-500 text-neutral-900 dark:text-white"
                  >
                    <option value="Automatic">Automatic (AT / DCT / CVT)</option>
                    <option value="Manual">Manual (MT)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider text-[11px]">
                    Fuel Engine Type *
                  </label>
                  <select
                    value={fuel}
                    onChange={(e) => setFuel(e.target.value as any)}
                    className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-orange-500 text-neutral-900 dark:text-white"
                  >
                    <option value="Diesel">Diesel (BS6 Compliant)</option>
                    <option value="Gasoline">Petrol / Gasoline</option>
                    <option value="Electric">Electric (Zero Emissions)</option>
                    <option value="Hybrid">Hybrid (Strong / Mild)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider text-[11px]">
                    Number of Seats *
                  </label>
                  <select
                    value={seats}
                    onChange={(e) => setSeats(Number(e.target.value))}
                    className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-orange-500 text-neutral-900 dark:text-white"
                  >
                    <option value={2}>2 Seater (Roadster / Coupe)</option>
                    <option value={4}>4 Seater</option>
                    <option value={5}>5 Seater (Standard)</option>
                    <option value={7}>7 Seater (Family SUV / MUV)</option>
                    <option value={8}>8 Seater</option>
                  </select>
                </div>

                <div className="lg:col-span-2">
                  <IndianVehiclePlateInput
                    value={regNumber}
                    onChange={setRegNumber}
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: PRICING & LOCATION */}
            <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex items-center space-x-3 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center font-bold">
                  <IndianRupee className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-neutral-900 dark:text-white text-base">Pricing & Pickup Address</h3>
                  <p className="text-xs text-neutral-400">Daily rental earnings, security deposit, and exact pickup hub</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider text-[11px]">
                    Daily Rental Rate (₹ INR) *
                  </label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="number"
                      required
                      min={500}
                      step={100}
                      value={pricePerDay}
                      onChange={(e) => setPricePerDay(Number(e.target.value))}
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl pl-10 pr-4 py-3 text-sm font-black focus:outline-none focus:border-orange-500 text-neutral-900 dark:text-white"
                    />
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Projected Host Revenue: <strong className="text-emerald-600">₹{(pricePerDay * 18).toLocaleString('en-IN')}</strong> / month (at ~18 rental days)
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider text-[11px]">
                    Refundable Security Deposit (₹ INR)
                  </label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="number"
                      min={0}
                      step={500}
                      value={securityDeposit}
                      onChange={(e) => setSecurityDeposit(Number(e.target.value))}
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl pl-10 pr-4 py-3 text-sm font-black focus:outline-none focus:border-orange-500 text-neutral-900 dark:text-white"
                    />
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Held securely in escrow during the trip and refunded post-inspection.
                  </p>
                </div>

                <div className="sm:col-span-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
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
              </div>
            </div>

            {/* SECTION 3: FEATURES & AMENITIES */}
            <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex items-center space-x-3 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-neutral-900 dark:text-white text-base">Features & Key Amenities</h3>
                  <p className="text-xs text-neutral-400">Select all accessories and capabilities available on this car</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {AVAILABLE_FEATURES.map((feat) => {
                  const isSelected = selectedFeatures.includes(feat);
                  return (
                    <button
                      key={feat}
                      type="button"
                      onClick={() => toggleFeature(feat)}
                      className={`p-3 rounded-2xl text-left border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'border-orange-600 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300'
                          : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300'
                      }`}
                    >
                      <span>{feat}</span>
                      {isSelected ? (
                        <div className="w-4 h-4 rounded-full bg-orange-600 text-white flex items-center justify-center shrink-0 ml-1">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-neutral-300 dark:border-neutral-700 shrink-0 ml-1" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SECTION 4: HIGH-RESOLUTION VEHICLE PHOTOS */}
            <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex items-center space-x-3 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center font-bold">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-neutral-900 dark:text-white text-base">Vehicle Photo Gallery</h3>
                  <p className="text-xs text-neutral-400">Choose from curated presets or provide your direct image URL</p>
                </div>
              </div>

              {/* Photo Preview Card */}
              <div className="aspect-[16/9] max-h-72 w-full rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 relative border border-neutral-200 dark:border-neutral-800">
                <img
                  src={activePhoto}
                  alt="Vehicle Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-3 left-3 bg-neutral-900/80 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1.5 rounded-xl flex items-center space-x-2">
                  <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                  <span>Preview: {year} {make} {model}</span>
                </div>
              </div>

              {/* Curated Presets */}
              <div className="space-y-2">
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider text-[11px]">
                  Select Pre-shot Verified Asset
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {PRESET_PHOTO_OPTIONS.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedPhotoUrl(item.url);
                        setCustomPhotoUrl('');
                      }}
                      className={`aspect-[16/10] rounded-xl overflow-hidden border-2 cursor-pointer transition-all relative group ${
                        activePhoto === item.url
                          ? 'border-orange-600 ring-2 ring-orange-600/20'
                          : 'border-neutral-200 dark:border-neutral-800 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={item.url} alt={item.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                        <span className="text-[10px] font-bold text-white truncate">{item.label}</span>
                      </div>
                      {activePhoto === item.url && (
                        <div className="absolute top-1.5 right-1.5 bg-orange-600 text-white rounded-full p-0.5">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Direct File Upload to S3 Network Storage & Custom URL */}
              <div className="space-y-3 pt-2">
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider text-[11px]">
                  Upload Direct Photo to HTK S3 Storage
                </label>
                <div className="p-4 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl bg-neutral-50 dark:bg-neutral-950 text-center relative hover:border-orange-500 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUploadToS3}
                    disabled={isUploadingPhoto}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center">
                      <Upload className="w-5 h-5" />
                    </div>
                    {isUploadingPhoto ? (
                      <p className="text-xs font-bold text-orange-600 animate-pulse">
                        Uploading file directly to https://s3.htknetwork.in...
                      </p>
                    ) : (
                      <>
                        <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                          Click or drag vehicle photo here to upload
                        </p>
                        <p className="text-[10px] text-neutral-400">
                          Files are automatically uploaded to HTK S3 Storage (<code className="text-orange-600">workspace_id: 1</code>)
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-neutral-500 dark:text-neutral-400 text-[10px] uppercase">
                    Or Paste S3 / External Direct Image Link
                  </label>
                  <input
                    type="url"
                    value={customPhotoUrl}
                    onChange={(e) => setCustomPhotoUrl(e.target.value)}
                    placeholder="https://s3.htknetwork.in/f/..."
                    className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-orange-500 text-neutral-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 5: AGREEMENT & PUBLISH */}
            <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 space-y-4 shadow-sm">
              <div className="flex items-center space-x-3 p-3 bg-neutral-50 dark:bg-neutral-950 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                <input
                  type="checkbox"
                  id="instantBookToggle"
                  checked={isInstantBook}
                  onChange={(e) => setIsInstantBook(e.target.checked)}
                  className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500 cursor-pointer"
                />
                <label htmlFor="instantBookToggle" className="text-xs font-bold text-neutral-800 dark:text-neutral-200 cursor-pointer">
                  Allow Instant Booking (Guests with verified KYC can book directly without manual approval wait)
                </label>
              </div>

              <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/60 text-xs text-orange-800 dark:text-orange-300 space-y-1.5">
                <div className="flex items-center space-x-2 font-bold">
                  <ShieldCheck className="w-4 h-4 text-orange-600" />
                  <span>Admin Quality & Identity Guarantee</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Upon submission, your listing is stored live in the database with status "Pending Review". Our admin operations team verifies the chassis and registration number before publishing to the main search index.
                </p>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <Link
                  to="/lender"
                  className="px-5 py-3 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-black rounded-2xl text-xs flex items-center space-x-2 shadow-lg shadow-orange-600/20 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Publishing Vehicle Listing...</span>
                  ) : (
                    <>
                      <span>Submit Vehicle Listing</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
