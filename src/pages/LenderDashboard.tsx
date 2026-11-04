import React, { useState, useEffect } from 'react';
import {
  Car as CarIcon,
  PlusCircle,
  CalendarCheck,
  TrendingUp,
  CheckCircle2,
  Clock,
  XCircle,
  Trash2,
  LogOut,
  MapPin,
  Star,
  Zap,
  ArrowRight,
  ShieldCheck,
  SlidersHorizontal,
  ChevronRight,
  IndianRupee,
  Upload,
  Fuel,
  Gauge,
  Users as Passengers,
  Info,
  Check,
  Image as ImageIcon,
  ArrowLeft,
  AlertCircle,
  AlertTriangle,
  Camera,
  Layers,
  Sparkles,
  User,
  UserCog,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Save,
  Phone,
  Mail,
  FileText,
  Edit,
  Bot,
  Loader2,
  Download,
  Calendar,
  Printer
} from 'lucide-react';
import { Car, Booking, UserProfile } from '../types.ts';
import { Link, useRouter } from '../router.tsx';
import {
  POPULAR_VEHICLE_BRANDS,
  BRAND_MODELS_MAP,
  CATEGORIZED_FEATURES
} from '../data/vehicleData.ts';
import { IndianVehiclePlateInput } from '../components/IndianVehiclePlateInput.tsx';
import { CityHubRadiusMap } from '../components/CityHubRadiusMap.tsx';
import { uploadFileToHTKS3 } from '../utils/s3Upload.ts';
import { EditCarModal } from '../components/EditCarModal.tsx';
import { AICarAssistant } from '../components/AICarAssistant.tsx';
import { DeleteAccountModal } from '../components/DeleteAccountModal.tsx';
import { InvoiceModal } from '../components/InvoiceModal.tsx';
import { usePlatformSettings } from '../context/PlatformSettingsContext.tsx';
import { VehicleOnboardingWizard } from '../components/VehicleOnboardingWizard.tsx';

interface LenderDashboardProps {
  user: UserProfile | null;
  initialTab?: 'fleet' | 'bookings' | 'earnings' | 'list-car' | 'profile';
  onSignInRequired: () => void;
  onSignOut: () => void;
  onUserUpdated?: (updatedUser: UserProfile) => void;
}

export const LenderDashboard: React.FC<LenderDashboardProps> = ({
  user,
  initialTab = 'fleet',
  onSignInRequired,
  onSignOut,
  onUserUpdated,
}) => {
  const { navigate } = useRouter();
  const { settings } = usePlatformSettings();
  const [activeTab, setActiveTab] = useState<'fleet' | 'bookings' | 'earnings' | 'list-car' | 'ai-assistant' | 'profile'>(initialTab);

  // Authentication guard: if user is logged out, immediately redirect to homepage
  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [cars, setCars] = useState<Car[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formStep, setFormStep] = useState(1);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const fetchLenderData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [carsRes, bookingsRes, healthRes] = await Promise.all([
        fetch(`/api/cars?lenderId=${user.id}`),
        fetch('/api/bookings'),
        fetch('/api/health')
      ]);

      if (carsRes.ok) {
        const cData = await carsRes.json();
        setCars(cData);
      }
      if (bookingsRes.ok) {
        const bData = await bookingsRes.json();
        // Filter bookings for this lender
        const filtered = bData.filter((b: any) => b.lender_id === user.id);
        setBookings(filtered);
      }
      if (healthRes.ok) {
        const hData = await healthRes.json();
        setHealthStatus(hData);
      }
    } catch (e) {
      console.error('Failed to load host data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLenderData();
  }, [user]);

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadProgressMsg, setUploadProgressMsg] = useState('');

  const handleDirectPublishAICar = async (carData: any) => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/cars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...carData,
          lender_id: user.id,
          lender_name: user.name,
          lender_avatar: user.avatar,
          approval_status: 'pending'
        }),
      });
      if (res.ok) {
        showNotification('AI-generated vehicle listing submitted for approval!');
        fetchLenderData();
        setActiveTab('fleet');
      }
    } catch (e) {
      console.error('Failed to publish AI car:', e);
    } finally {
      setLoading(false);
    }
  };

  // Availability & Blackout Dates Modal State
  const [calendarCar, setCalendarCar] = useState<Car | null>(null);
  const [newBlackoutDate, setNewBlackoutDate] = useState<string>('');

  // Digital Handover & Odometer Modal State
  const [handoverBooking, setHandoverBooking] = useState<Booking | null>(null);
  const [startOdoInput, setStartOdoInput] = useState<number>(0);
  const [endOdoInput, setEndOdoInput] = useState<number>(0);
  const [fuelLevelInput, setFuelLevelInput] = useState<string>('100% Full');
  const [handoverNotesInput, setHandoverNotesInput] = useState<string>('');
  const [extraKmChargeInput, setExtraKmChargeInput] = useState<number>(0);

  // Invoice Modal State
  const [invoiceBooking, setInvoiceBooking] = useState<Booking | null>(null);

  // Profile & Password Edit States
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '+91 98230 44889');
  const [profileBio, setProfileBio] = useState(user?.bio || 'Verified host and car enthusiast in Pune.');
  const [profileAvatar, setProfileAvatar] = useState(user?.avatar || '');
  const [profileAddress, setProfileAddress] = useState(
    user?.address || user?.location || 'Vardhaman Moonstone, Opposite to JSPM, Tathawade, Wakad, Pune, Maharashtra 411033'
  );
  const [profileDob, setProfileDob] = useState(user?.dob || '1992-05-15');
  const [profileGender, setProfileGender] = useState(user?.gender || 'Male');
  const [profileLicenceNumber, setProfileLicenceNumber] = useState(user?.licence_number || 'MH12 20180045889');
  const [profileLicenceExpiry, setProfileLicenceExpiry] = useState(user?.licence_expiry || '2035-12-31');
  const [profileAadhaar, setProfileAadhaar] = useState(user?.aadhaar_number || '4892 3892 1092');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.name) setProfileName(user.name);
      if (user.phone) setProfilePhone(user.phone);
      if (user.bio) setProfileBio(user.bio);
      if (user.avatar) setProfileAvatar(user.avatar);
      if (user.address || user.location) setProfileAddress(user.address || user.location || '');
      if (user.dob) setProfileDob(user.dob);
      if (user.gender) setProfileGender(user.gender);
      if (user.licence_number) setProfileLicenceNumber(user.licence_number);
      if (user.licence_expiry) setProfileLicenceExpiry(user.licence_expiry);
      if (user.aadhaar_number) setProfileAadhaar(user.aadhaar_number);
    }
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    setProfileErrorMsg(null);
    try {
      const url = await uploadFileToHTKS3(file, `${profileName || 'Host'} Avatar`);
      setProfileAvatar(url);
      showNotification('Avatar photo uploaded to HTK S3.');
    } catch (err: any) {
      setProfileErrorMsg(err.message || 'Error uploading avatar');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onSignInRequired();
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setProfileErrorMsg('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setProfileErrorMsg('New passwords do not match. Please re-enter.');
      return;
    }

    setIsSavingProfile(true);
    setProfileErrorMsg(null);
    setProfileSuccessMsg(null);

    try {
      const payload: any = {
        name: profileName.trim(),
        phone: profilePhone.trim(),
        bio: profileBio.trim(),
        avatar: profileAvatar.trim(),
        address: profileAddress.trim(),
        location: profileAddress.trim(),
        dob: profileDob,
        gender: profileGender,
        licence_number: profileLicenceNumber.trim(),
        licence_expiry: profileLicenceExpiry,
        aadhaar_number: profileAadhaar.trim(),
      };

      if (newPassword) {
        payload.password = newPassword;
      }

      const res = await fetch(`/api/users/${user.id}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updatedUser = await res.json();
        setProfileSuccessMsg('Profile details, address, and verification info saved successfully!');
        setNewPassword('');
        setConfirmPassword('');
        if (onUserUpdated) {
          onUserUpdated(updatedUser);
        }
        showNotification('Host profile & address updated successfully.');
      } else {
        const err = await res.json();
        setProfileErrorMsg(err.error || 'Failed to update profile.');
      }
    } catch (err: any) {
      setProfileErrorMsg(err.message || 'Network error updating profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleApplyAIDraft = (draft: any) => {
    // We navigate to list-car tab and we can pass draft if we want, but the wizard handles its own state.
    // For now, just switch tab.
    setActiveTab('list-car');
    showNotification('AI draft ready! Use the wizard to list your car.');
  };

  const handleToggleAvailability = async (carId: string, current: boolean) => {
    const nextState = !current;
    setCars(prev => prev.map(c => c.id === carId ? { ...c, is_available: nextState } : c));
    showNotification(
      nextState
        ? 'Vehicle is now LIVE and bookable by guests!'
        : 'Vehicle availability paused (hidden from active searches).'
    );

    try {
      const res = await fetch(`/api/cars/${carId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_available: nextState }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCars(prev => prev.map(c => c.id === carId ? updated : c));
      } else {
        setCars(prev => prev.map(c => c.id === carId ? { ...c, is_available: current } : c));
        showNotification('Failed to update vehicle availability. Please try again.');
      }
    } catch {
      setCars(prev => prev.map(c => c.id === carId ? { ...c, is_available: current } : c));
      showNotification('Network error while updating vehicle availability.');
    }
  };

  const handleDeleteCar = async (carId: string) => {
    if (!window.confirm('Delete this car listing?')) return;
    const res = await fetch(`/api/cars/${carId}`, { method: 'DELETE' });
    if (res.ok) {
      setCars(cars.filter(c => c.id !== carId));
      showNotification('Vehicle removed from fleet.');
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: string) => {
    const res = await fetch(`/api/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: status as any } : b));
      showNotification(`Trip status updated to ${status}.`);
    }
  };

  const handleSaveBlackoutDates = async (carId: string, updatedDates: string[]) => {
    try {
      const res = await fetch(`/api/cars/${carId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blackout_dates: updatedDates }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCars(prev => prev.map(c => (c.id === carId ? updated : c)));
        if (calendarCar && calendarCar.id === carId) {
          setCalendarCar(updated);
        }
        showNotification('Vehicle availability calendar updated.');
      }
    } catch (e) {
      console.error('Failed to update blackout dates:', e);
    }
  };

  const openHandoverModal = (b: Booking) => {
    setHandoverBooking(b);
    setStartOdoInput(b.start_odometer || 14200);
    setEndOdoInput(b.end_odometer || (b.start_odometer ? b.start_odometer + b.total_days * 180 : 14500));
    setFuelLevelInput(b.fuel_level || '100% Full');
    setHandoverNotesInput(b.handover_notes || '');
    setExtraKmChargeInput(Number(b.extra_km_charge || 0));
  };

  const handleSaveHandoverChecklist = async (mode: 'checkin' | 'checkout') => {
    if (!handoverBooking) return;
    const gross = Number(handoverBooking.total_price || 0);
    const allowedKm = (handoverBooking.total_days || 1) * 300;
    const drivenKm = Math.max(0, endOdoInput - startOdoInput);
    const autoExtraCharge =
      mode === 'checkout' && drivenKm > allowedKm ? (drivenKm - allowedKm) * 12 : extraKmChargeInput;
    const finalExtraCharge = extraKmChargeInput > 0 ? extraKmChargeInput : autoExtraCharge;

    const updates: Record<string, any> =
      mode === 'checkin'
        ? {
            start_odometer: Number(startOdoInput),
            fuel_level: fuelLevelInput,
            handover_notes: handoverNotesInput.trim(),
            handover_status: 'checked_in',
            status: 'active',
          }
        : {
            start_odometer: Number(startOdoInput),
            end_odometer: Number(endOdoInput),
            fuel_level: fuelLevelInput,
            handover_notes: handoverNotesInput.trim(),
            handover_status: 'checked_out',
            extra_km_charge: Number(finalExtraCharge),
            platform_commission: Math.round(gross * 0.1),
            net_lender_payout: Math.round(gross * 0.9) + Number(finalExtraCharge),
            status: 'completed',
          };

    try {
      const res = await fetch(`/api/bookings/${handoverBooking.id}/details`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updated = await res.json();
        setBookings(prev =>
          prev.map(b => (b.id === handoverBooking.id ? { ...b, ...updates, ...(updated || {}) } : b))
        );
        showNotification(
          mode === 'checkin'
            ? 'Pre-trip check-in recorded! Vehicle is now Active on-road.'
            : 'Post-trip check-out completed! Final odometer & payout calculated.'
        );
        setHandoverBooking(null);
      }
    } catch (e) {
      console.error('Failed to save handover checklist:', e);
    }
  };

  const handleExportHostEarningsCSV = () => {
    const headers = [
      'Booking ID',
      'Date',
      'Vehicle',
      'Guest Name',
      'Days',
      'Gross Rental (INR)',
      'Platform Fee 10% (INR)',
      'Extra Km Fee (INR)',
      'Net Host Payout (INR)',
      'Payout Status'
    ];
    const rows = bookings.map(b => {
      const gross = Number(b.total_price || 0);
      const extraKm = Number(b.extra_km_charge || 0);
      const fee = Math.round(gross * 0.1);
      const net = Math.round(gross * 0.9) + extraKm;
      return [
        b.id,
        b.created_at ? new Date(b.created_at).toISOString().split('T')[0] : '',
        `"${(b.car_title || '').replace(/"/g, '""')}"`,
        `"${(b.renter_name || '').replace(/"/g, '""')}"`,
        b.total_days,
        gross,
        fee,
        extraKm,
        net,
        b.payout_status || 'pending'
      ].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `host-earnings-statement-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const approvedCars = cars.filter(c => c.approval_status === 'approved');
  const pendingCars = cars.filter(c => c.approval_status === 'pending');
  const totalHostEarnings = bookings
    .filter(b => b.status !== 'cancelled')
    .reduce((sum, b) => sum + Math.round(Number(b.total_price) * 0.9) + Number(b.extra_km_charge || 0), 0);
  const activeTripsCount = bookings.filter(b => b.status === 'confirmed' || b.status === 'active').length;

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-neutral-950 flex flex-col font-sans transition-colors duration-200">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-neutral-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-neutral-800 text-xs font-bold flex items-center space-x-2 animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* DEDICATED LENDER DASHBOARD HEADER (No public header/homepage elements) */}
      <header className="sticky top-0 z-30 w-full max-w-full overflow-x-hidden bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-3 sm:px-6 h-14 flex items-center justify-between gap-2 shadow-2xs transition-colors duration-200">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <Link to="/" className="flex items-center space-x-1.5 sm:space-x-2 text-neutral-900 dark:text-white font-extrabold text-sm sm:text-base min-w-0 shrink">
            {settings.logo_url ? (
              <img src={settings.logo_url} alt={settings.brand_name} className="h-6 sm:h-7 max-w-[80px] xs:max-w-[110px] sm:max-w-[120px] object-contain rounded shrink-0" />
            ) : (
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-orange-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <CarIcon className="w-3.5 h-3.5" />
              </div>
            )}
            <span className="truncate max-w-[90px] xs:max-w-[130px] sm:max-w-none">{settings.brand_name}</span>
          </Link>
          <span className="text-[10px] font-extrabold px-1 sm:px-1.5 py-0.5 rounded-md bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 shrink-0">
            v1.3.7
          </span>
          <span className="text-neutral-300 dark:text-neutral-700 hidden sm:inline">|</span>
          <div className="hidden sm:flex items-center space-x-2">
            <span className="text-xs font-bold text-neutral-900 dark:text-neutral-200">Host Dashboard</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-900/50 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Host Tier
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">
          <button
            onClick={() => {
              setActiveTab('list-car');
              setFormStep(1);
            }}
            className="px-2.5 sm:px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 shadow-2xs cursor-pointer transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">+ List Car</span>
          </button>

          <Link
            to="/"
            className="hidden sm:inline-block px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300 transition-colors"
          >
            Public Site
          </Link>

          {user ? (
            <div className="flex items-center space-x-1.5 sm:space-x-2 pl-1.5 sm:pl-2 border-l border-neutral-200 dark:border-neutral-800">
              <button
                onClick={() => setActiveTab('profile')}
                title="View & Edit Host Profile"
                className="flex items-center space-x-1.5 hover:opacity-80 transition-opacity cursor-pointer group"
              >
                {user.avatar ? (
                  <img src={user.avatar} className="w-7 h-7 rounded-lg object-cover ring-1 ring-orange-400" alt="" />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-600 font-bold text-xs flex items-center justify-center">
                    {(user.name || 'H').charAt(0)}
                  </div>
                )}
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 hidden md:inline group-hover:text-orange-600 transition-colors">
                  {user.name || user.email}
                </span>
              </button>
              <button
                onClick={onSignOut}
                title="Sign Out"
                className="p-1.5 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onSignInRequired}
              className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-xs font-bold shadow-2xs hover:bg-orange-700 cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* DASHBOARD LAYOUT: FULL-BLEED FIXED LEFT SIDEBAR + UNIFIED MAIN CONTENT */}
      <div className="flex-1 flex w-full min-h-[calc(100vh-3.5rem)]">
        
        {/* FIXED LEFT SIDEBAR (DEDICATED DASHBOARD NAVIGATION) */}
        <aside className="w-60 lg:w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 p-3.5 shrink-0 hidden md:flex flex-col justify-between transition-colors duration-200">
          <div className="space-y-4">
            {/* Host Quick Profile Card */}
            <div className="p-3 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-100 dark:border-neutral-850">
              <div className="flex items-center space-x-2.5">
                {user?.avatar ? (
                  <img src={user.avatar} className="w-9 h-9 rounded-lg object-cover border border-neutral-200 dark:border-neutral-800" alt="" />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-orange-100 text-orange-600 font-black text-xs flex items-center justify-center">
                    {(user?.name || 'H').charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-xs text-neutral-900 dark:text-white truncate">{user?.name || 'Verified Host'}</h4>
                  <p className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate">{cars.length} Fleet Vehicles</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('profile')}
                className="mt-2.5 w-full py-1 px-2 text-[10px] font-bold text-neutral-600 dark:text-neutral-400 hover:text-orange-600 dark:hover:text-orange-400 bg-white dark:bg-neutral-900 hover:bg-orange-50 dark:hover:bg-neutral-850 rounded-lg border border-neutral-200 dark:border-neutral-800 flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <UserCog className="w-3 h-3" />
                <span>Edit Profile & Password</span>
              </button>
            </div>

            {/* Sidebar Navigation Links */}
            <nav className="space-y-1 text-xs font-medium">
              <button
                onClick={() => setActiveTab('fleet')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'fleet'
                    ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 font-bold border border-orange-200 dark:border-orange-900/60'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <CarIcon className="w-4 h-4 text-orange-600" />
                  <span>My Fleet</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-full">
                  {cars.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('list-car');
                  setFormStep(1);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'list-car'
                    ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 font-bold border border-orange-200 dark:border-orange-900/60'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <PlusCircle className="w-4 h-4 text-orange-600" />
                  <span>+ List a Car</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 font-bold rounded-md">
                  New
                </span>
              </button>

              <button
                onClick={() => setActiveTab('ai-assistant')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'ai-assistant'
                    ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 font-bold border border-orange-200 dark:border-orange-900/60'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Bot className="w-4 h-4 text-orange-600" />
                  <span>AI Car Assistant</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold rounded-md">
                  Gemini 3.1
                </span>
              </button>

              <button
                onClick={() => setActiveTab('bookings')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'bookings'
                    ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 font-bold border border-orange-200 dark:border-orange-900/60'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <CalendarCheck className="w-4 h-4 text-orange-600" />
                  <span>Guest Bookings</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 font-bold rounded-full">
                  {bookings.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('earnings')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'earnings'
                    ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 font-bold border border-orange-200 dark:border-orange-900/60'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Earnings & Payouts</span>
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                  ₹{Math.round(totalHostEarnings).toLocaleString('en-IN')}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 font-bold border border-orange-200 dark:border-orange-900/60'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <UserCog className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                  <span>Profile & Security</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Host Protection notice */}
          <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs space-y-1 transition-colors">
            <span className="font-bold text-neutral-900 dark:text-white flex items-center gap-1 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              ₹1,00,00,000 Shield
            </span>
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400">Commercial protection active on all listed cars.</p>
          </div>
        </aside>

        {/* MAIN DASHBOARD CONTENT AREA */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto bg-[#f8f9fa] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors">
          <div className="max-w-6xl mx-auto space-y-5">
          
          {/* DATABASE CONNECTION ERROR INDICATOR (Request #11 & #13) */}
          {healthStatus && !healthStatus.db?.connected && (
            <div className="p-6 rounded-3xl border-2 border-red-500 bg-red-50 dark:bg-red-950/20 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-red-100 dark:bg-red-900/40 text-red-600 shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-red-900 dark:text-red-400 uppercase tracking-tight">
                    MySQL Database Connection Failure
                  </h3>
                  <p className="text-xs text-red-700 dark:text-red-300 font-medium">
                    The host portal is currently running on <span className="font-bold">temporary in-memory storage</span>. Changes made to your fleet or profile will not be permanent until the connection is restored.
                  </p>
                </div>
                <button 
                  onClick={() => fetchLenderData()}
                  className="ml-auto px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase transition-colors shadow-sm"
                >
                  Retry Connection
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-red-200 dark:border-red-900/50 space-y-2">
                  <span className="text-[10px] font-black uppercase text-red-500 tracking-widest flex items-center gap-1.5">
                    Exact Diagnostic Error
                  </span>
                  <div className="font-mono text-[11px] text-neutral-600 dark:text-neutral-400 break-all bg-neutral-50 dark:bg-black/40 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800">
                    <p className="text-red-600 dark:text-red-400 font-bold mb-1">
                      {healthStatus.db.error?.code || 'UNKNOWN_ERROR'}: {healthStatus.db.error?.message || 'No specific error message returned.'}
                    </p>
                    <p>Host: {healthStatus.db.host}:{healthStatus.db.port}</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-emerald-200 dark:border-emerald-900/50 space-y-2">
                  <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest flex items-center gap-1.5">
                    Recommended Fixes
                  </span>
                  <ul className="space-y-1.5 text-xs text-neutral-600 dark:text-neutral-400 list-disc pl-4">
                    {(healthStatus.db.solutions || []).slice(0, 3).map((solution: string, idx: number) => (
                      <li key={idx} className="leading-relaxed">{solution}</li>
                    ))}
                    <li className="font-bold text-neutral-900 dark:text-white underline">Verify database credentials in server/db.ts</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          {/* Mobile Tab Selectors */}
          <div className="flex md:hidden items-center space-x-2 overflow-x-auto pb-2 text-xs">
            <button
              onClick={() => setActiveTab('fleet')}
              className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap cursor-pointer ${
                activeTab === 'fleet' ? 'bg-orange-600 text-white' : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800'
              }`}
            >
              My Fleet ({cars.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('list-car');
                setFormStep(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap cursor-pointer ${
                activeTab === 'list-car' ? 'bg-orange-600 text-white' : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800'
              }`}
            >
              + List a Car
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap cursor-pointer ${
                activeTab === 'bookings' ? 'bg-orange-600 text-white' : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800'
              }`}
            >
              Bookings ({bookings.length})
            </button>
            <button
              onClick={() => setActiveTab('earnings')}
              className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap cursor-pointer ${
                activeTab === 'earnings' ? 'bg-orange-600 text-white' : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800'
              }`}
            >
              Earnings
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap cursor-pointer ${
                activeTab === 'profile' ? 'bg-orange-600 text-white' : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800'
              }`}
            >
              Profile & Password
            </button>
          </div>

          {/* TOP METRICS SUMMARY BAR */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-0.5 shadow-2xs">
              <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase">Total Fleet</span>
              <div className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">{cars.length}</div>
            </div>
            <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-0.5 shadow-2xs">
              <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase">Live & Approved</span>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">{approvedCars.length}</div>
            </div>
            <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-0.5 shadow-2xs">
              <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase">Active Trips</span>
              <div className="text-xl sm:text-2xl font-black text-orange-600 dark:text-orange-400">{activeTripsCount}</div>
            </div>
            <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-0.5 shadow-2xs">
              <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase">Net Host Earnings</span>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">₹{Math.round(totalHostEarnings).toLocaleString('en-IN')}</div>
            </div>
          </div>

          {/* TAB 1: FLEET & VEHICLE MANAGEMENT */}
          {activeTab === 'fleet' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800 gap-3">
                <div>
                  <h2 className="text-xl font-black text-neutral-900 dark:text-white">Listed Vehicles & Approval Status</h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Only approved cars appear on the public marketplace.</p>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('list-car');
                    setFormStep(1);
                  }}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-2xs self-start cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>List a New Car</span>
                </button>
              </div>

              <div className="space-y-3">
                {cars.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 space-y-3 transition-colors">
                    <CarIcon className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mx-auto" />
                    <h4 className="font-bold text-neutral-800 dark:text-neutral-200 text-sm">No vehicles listed yet</h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-450 max-w-xs mx-auto">
                      List your car today to start leasing to verified renters in Pune, India.
                    </p>
                    <button
                      onClick={() => {
                        setActiveTab('list-car');
                        setFormStep(1);
                      }}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-orange-700 transition-colors"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>List Your First Car</span>
                    </button>
                  </div>
                ) : (
                  cars.map((car) => (
                    <div
                      key={car.id}
                      className="p-4 sm:p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-350 dark:hover:border-neutral-750 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                    >
                      <div className="flex items-center space-x-4">
                        <img
                          src={car.image_url}
                          alt={car.title}
                          className="w-20 h-16 rounded-2xl object-cover border border-neutral-200 dark:border-neutral-850 shrink-0"
                        />
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-bold text-neutral-900 dark:text-white text-sm">{car.title}</h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 font-bold text-neutral-600 dark:text-neutral-300">
                              {car.year} · {car.type}
                            </span>
                          </div>

                          <div className="flex items-center space-x-3 text-neutral-500 dark:text-neutral-400 text-[11px]">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-orange-600" />
                              {car.city}
                            </span>
                            <span>•</span>
                            <span className="font-bold text-neutral-900 dark:text-neutral-100">
                              ₹{car.price_per_day.toLocaleString('en-IN')}/day
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                              {car.rating} ({car.reviews_count} reviews)
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right side: Live Toggle & Controls */}
                      <div className="flex items-center space-x-4">
                        {/* Approval Badge */}
                        <div className="text-right">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                              car.approval_status === 'approved'
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                : car.approval_status === 'rejected'
                                ? 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300'
                                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                            }`}
                          >
                            {car.approval_status || 'approved'}
                          </span>
                        </div>

                        {/* Direct Toggle Switch */}
                        <div className="flex items-center space-x-2 pl-3 border-l border-neutral-200 dark:border-neutral-800">
                          <span className={`text-[11px] font-bold ${car.is_available ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-400'}`}>
                            {car.is_available ? 'Active' : 'Paused'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleAvailability(car.id, Boolean(car.is_available))}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              car.is_available ? 'bg-emerald-500' : 'bg-neutral-300 dark:bg-neutral-700'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                car.is_available ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => setCalendarCar(car)}
                          title="Manage availability calendar & blackout dates"
                          className="p-1.5 px-3 bg-neutral-100 dark:bg-neutral-800 hover:bg-orange-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:text-orange-600 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 border border-neutral-200 dark:border-neutral-700"
                        >
                          <Calendar className="w-3.5 h-3.5 text-orange-600" />
                          <span>
                            Dates{(car.blackout_dates || []).length > 0 ? ` (${(car.blackout_dates || []).length})` : ''}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditingCar(car)}
                          title="Edit vehicle details, pricing, description & features"
                          className="p-1.5 px-3 bg-neutral-100 dark:bg-neutral-800 hover:bg-orange-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:text-orange-600 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 border border-neutral-200 dark:border-neutral-700"
                        >
                          <Edit className="w-3.5 h-3.5 text-orange-600" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => handleDeleteCar(car.id)}
                          className="p-1.5 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB: LIST A CAR WIZARD (UNIFIED 3-STEP VEHICLE ONBOARDING WIZARD) */}
          {activeTab === 'list-car' && (
            <VehicleOnboardingWizard
              user={user}
              onComplete={(newCar) => {
                setCars(prev => [newCar, ...prev.filter(c => c.id !== newCar.id)]);
                setActiveTab('fleet');
                showNotification(`Vehicle "${newCar.title}" submitted successfully and sent for approval!`);
              }}
              onCancel={() => setActiveTab('fleet')}
            />
          )}

          {/* TAB: GEMINI 3.1 FLASH LITE AI FLEET ASSISTANT */}
          {activeTab === 'ai-assistant' && (
            <AICarAssistant
              user={user}
              onApplyDraftToForm={handleApplyAIDraft}
              onDirectPublishCar={handleDirectPublishAICar}
            />
          )}

          {/* TAB 2: LENDING HISTORY, HANDOVER CHECKLIST & ODOMETER LOG */}
          {activeTab === 'bookings' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800 gap-3">
                <div>
                  <h2 className="text-xl font-black text-neutral-900 dark:text-white">
                    Guest Reservations &amp; Digital Handover Checklist
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Record pre-trip check-in odometer &amp; fuel levels, and complete post-trip return check-out.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {bookings.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-400 dark:text-neutral-500 rounded-3xl transition-colors">
                    No reservations yet on your vehicles. When guests book, they will appear here in real time.
                  </div>
                ) : (
                  bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3.5 text-xs transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-850 pb-3">
                        <div>
                          <span className="font-mono text-[10px] text-neutral-400 dark:text-neutral-550 block">
                            {booking.id}
                          </span>
                          <h4 className="font-bold text-neutral-900 dark:text-white text-sm">{booking.car_title}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                            Handover: {(booking.handover_status || 'pending').replace('_', ' ')}
                          </span>
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase w-fit ${
                              booking.status === 'confirmed'
                                ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                                : booking.status === 'active'
                                ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300'
                                : booking.status === 'cancelled'
                                ? 'bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300'
                                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-350'
                            }`}
                          >
                            {booking.status}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-neutral-50 dark:bg-neutral-950 p-3.5 rounded-2xl border border-neutral-100 dark:border-neutral-850 text-neutral-600 dark:text-neutral-400 transition-colors tabular-nums">
                        <div>
                          <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase block">
                            Guest Driver
                          </span>
                          <span className="font-bold text-neutral-900 dark:text-white text-xs">{booking.renter_name}</span>
                          <span className="block text-[11px] text-neutral-500 dark:text-neutral-450">
                            {booking.renter_email}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase block">
                            Rental Dates
                          </span>
                          <span className="font-bold text-neutral-900 dark:text-white text-xs">
                            {booking.pickup_datetime.replace('T', ' ')}
                          </span>
                          <span className="block text-[11px] text-neutral-500 dark:text-neutral-450">
                            to {booking.dropoff_datetime.replace('T', ' ')}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase block">
                            Odometer &amp; Fuel
                          </span>
                          <span className="font-mono font-bold text-neutral-900 dark:text-white text-xs">
                            {booking.start_odometer
                              ? `${booking.start_odometer} km → ${booking.end_odometer || 'On-Road'} km`
                              : 'Not Checked-In'}
                          </span>
                          <span className="block text-[11px] text-neutral-500">
                            Fuel: {booking.fuel_level || 'Standard Full'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase block">
                            Net Host Payout (90%)
                          </span>
                          <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                            ₹
                            {(
                              Math.round(Number(booking.total_price) * 0.9) + Number(booking.extra_km_charge || 0)
                            ).toLocaleString('en-IN')}
                          </span>
                          <span className="text-neutral-450 dark:text-neutral-500 text-[10px] block">
                            Gross: ₹{Number(booking.total_price).toLocaleString('en-IN')}
                            {Number(booking.extra_km_charge || 0) > 0
                              ? ` + ₹${Number(booking.extra_km_charge).toLocaleString('en-IN')} extra km`
                              : ''}
                          </span>
                        </div>
                      </div>

                      {booking.handover_notes && (
                        <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/70 dark:border-neutral-800 text-[11px] text-neutral-600 dark:text-neutral-300">
                          <strong>Handover Checklist Notes:</strong> {booking.handover_notes}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                        {booking.status !== 'cancelled' && (
                          <button
                            type="button"
                            onClick={() => openHandoverModal(booking)}
                            className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-colors"
                          >
                            <Gauge className="w-3.5 h-3.5" />
                            <span>
                              {booking.handover_status === 'checked_in'
                                ? 'Complete Return & Odometer Check-Out'
                                : booking.handover_status === 'checked_out'
                                ? 'Update Handover Log'
                                : 'Start Handover & Odometer Check-In'}
                            </span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setInvoiceBooking(booking)}
                          className="px-3.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 text-orange-600" />
                          <span>Payout Statement</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: EARNINGS & PAYOUTS */}
          {activeTab === 'earnings' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800 gap-3">
                <div>
                  <h2 className="text-xl font-black text-neutral-900 dark:text-white">
                    Host Earnings &amp; Itemized Payout Ledger
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Direct 90% host share settlements via verified UPI / NEFT bank transfer with downloadable GST vouchers.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleExportHostEarningsCSV}
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-2xs cursor-pointer self-start"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Earnings CSV</span>
                </button>
              </div>

              <div className="p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs transition-colors tabular-nums">
                <div>
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase block">
                    Cumulative Net Host Payouts
                  </span>
                  <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    ₹{Math.round(totalHostEarnings).toLocaleString('en-IN')}
                  </div>
                  <span className="text-neutral-500 dark:text-neutral-400 text-[11px]">
                    90% host share + 100% extra km fees
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase block">
                    Payout Settlement Channel
                  </span>
                  <div className="font-bold text-neutral-900 dark:text-white text-sm mt-1">
                    Bank Transfer (UPI / IMPS / NEFT)
                  </div>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                    ● Auto-settlement active after trip check-out
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase block">
                    Average Fleet Daily Rate
                  </span>
                  <div className="text-2xl font-black text-neutral-900 dark:text-white mt-1">
                    ₹
                    {cars.length > 0
                      ? Math.round(cars.reduce((s, c) => s + c.price_per_day, 0) / cars.length).toLocaleString('en-IN')
                      : 0}
                  </div>
                  <span className="text-neutral-500 dark:text-neutral-400 text-[11px]">Across your active fleet</span>
                </div>
              </div>

              {/* Itemized Host Payout Ledger Table */}
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs tabular-nums">
                    <thead>
                      <tr className="bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 text-[10px] font-bold uppercase text-neutral-400">
                        <th className="py-3.5 px-4">Booking ID</th>
                        <th className="py-3.5 px-4">Vehicle &amp; Guest</th>
                        <th className="py-3.5 px-4 text-right">Gross Booking</th>
                        <th className="py-3.5 px-4 text-right">Platform Fee (10%)</th>
                        <th className="py-3.5 px-4 text-right">Extra Km Fee</th>
                        <th className="py-3.5 px-4 text-right">Net Payout</th>
                        <th className="py-3.5 px-4">Settlement</th>
                        <th className="py-3.5 px-4 text-right">Invoice</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                      {bookings.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-10 text-center text-neutral-400">
                            No completed or active trip payouts recorded yet.
                          </td>
                        </tr>
                      ) : (
                        bookings.map(b => {
                          const gross = Number(b.total_price || 0);
                          const extraKm = Number(b.extra_km_charge || 0);
                          const fee = Math.round(gross * 0.1);
                          const net = Math.round(gross * 0.9) + extraKm;
                          return (
                            <tr key={b.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40">
                              <td className="py-3 px-4 font-mono text-[11px] text-neutral-500">{b.id}</td>
                              <td className="py-3 px-4">
                                <span className="font-bold text-neutral-900 dark:text-white block">{b.car_title}</span>
                                <span className="text-[11px] text-neutral-400">
                                  {b.renter_name} · {b.total_days}d
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right font-mono">₹{gross.toLocaleString('en-IN')}</td>
                              <td className="py-3 px-4 text-right font-mono text-red-500">
                                -₹{fee.toLocaleString('en-IN')}
                              </td>
                              <td className="py-3 px-4 text-right font-mono text-amber-600">
                                +₹{extraKm.toLocaleString('en-IN')}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-black text-emerald-600">
                                ₹{net.toLocaleString('en-IN')}
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    b.payout_status === 'paid'
                                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                      : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                                  }`}
                                >
                                  {b.payout_status || 'pending'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => setInvoiceBooking(b)}
                                  className="px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[11px] font-bold cursor-pointer"
                                >
                                  Voucher
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PROFILE & SECURITY (CHANGE PROFILE INFO & EDIT/CHANGE PASSWORD) */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800 gap-3">
                <div>
                  <h2 className="text-xl font-black text-neutral-900 dark:text-white flex items-center gap-2">
                    <UserCog className="w-5 h-5 text-orange-600" />
                    Host Profile & Security Settings
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Update your public host profile, contact number, bio, and account login password.
                  </p>
                </div>
              </div>

              {profileSuccessMsg && (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{profileSuccessMsg}</span>
                </div>
              )}

              {profileErrorMsg && (
                <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-800 dark:text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{profileErrorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* LEFT: PERSONAL & HOST LOCATION INFORMATION */}
                  <div className="lg:col-span-7 bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-4 shadow-2xs">
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-neutral-850">
                      <User className="w-4 h-4 text-orange-600" />
                      Personal & Host Pickup Information
                    </h3>

                    {/* Avatar Upload */}
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-2">
                        Host Profile Picture
                      </label>
                      <div className="flex items-center space-x-4">
                        <div className="relative group">
                          {profileAvatar ? (
                            <img
                              src={profileAvatar}
                              alt="Profile avatar"
                              className="w-16 h-16 rounded-2xl object-cover border-2 border-orange-500 shadow-xs"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 font-black text-xl flex items-center justify-center border-2 border-orange-200 dark:border-orange-800">
                              {(profileName || user?.name || 'H').charAt(0)}
                            </div>
                          )}
                          {isUploadingAvatar && (
                            <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center">
                              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-1.5 flex-1">
                          <label className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-2xs">
                            <Camera className="w-3.5 h-3.5 text-neutral-500" />
                            <span>{isUploadingAvatar ? 'Uploading...' : 'Upload New Photo'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleAvatarUpload}
                              disabled={isUploadingAvatar}
                            />
                          </label>
                          <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
                            Images automatically uploaded and stored on HTK S3 network.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Name */}
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                        Full Name / Host Organization
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          required
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          placeholder="e.g. Vikram Malhotra"
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                        Contact Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          required
                          value={profilePhone}
                          onChange={(e) => setProfilePhone(e.target.value)}
                          placeholder="+91 98230 44889"
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>

                    {/* Email (Readonly) */}
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1 flex items-center justify-between">
                        <span>Account Email Address</span>
                        <span className="text-[10px] text-neutral-400 dark:text-neutral-500 flex items-center gap-1 font-normal">
                          <Lock className="w-3 h-3 text-orange-600" /> Email cannot be changed
                        </span>
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                        <input
                          type="email"
                          disabled
                          readOnly
                          value={user?.email || ''}
                          className="w-full pl-9 pr-10 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-850 text-neutral-500 dark:text-neutral-400 cursor-not-allowed font-medium select-none"
                        />
                        <Lock className="w-3.5 h-3.5 text-neutral-400 absolute right-3 top-2.5" />
                      </div>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-1">
                        <CheckCircle2 className="w-3 h-3" /> Verified Registered Account ID
                      </span>
                    </div>

                    {/* Detailed Host Pickup & Handover Address */}
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                        Detailed Host Pickup & Handover Address
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-orange-600 absolute left-3 top-2.5" />
                        <textarea
                          rows={2}
                          required
                          value={profileAddress}
                          onChange={(e) => setProfileAddress(e.target.value)}
                          placeholder="e.g. Vardhaman Moonstone, Opposite to JSPM, Tathawade, Wakad, Pune 411033"
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                        />
                      </div>
                      <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1">
                        Default location auto-filled when you list new cars in your fleet.
                      </p>
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                        Host Bio / About
                      </label>
                      <div className="relative">
                        <textarea
                          rows={2}
                          value={profileBio}
                          onChange={(e) => setProfileBio(e.target.value)}
                          placeholder="Tell guests about your car collection, maintenance standards, and hosting experience..."
                          className="w-full p-3 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                        />
                      </div>
                      <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1">
                        Displayed on your vehicle listing pages to build renter confidence.
                      </p>
                    </div>
                  </div>

                  {/* RIGHT: ONBOARDING VERIFICATION DETAILS & PASSWORD */}
                  <div className="lg:col-span-5 space-y-4">
                    
                    {/* Onboarding Identity & Verification Box */}
                    <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-3.5 shadow-2xs">
                      <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-850">
                        <FileText className="w-4 h-4 text-orange-600" />
                        Host Verification & KYC Documents
                      </h3>

                      {/* DOB & Gender */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                            Date of Birth
                          </label>
                          <input
                            type="date"
                            value={profileDob}
                            onChange={(e) => setProfileDob(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                            Gender
                          </label>
                          <select
                            value={profileGender}
                            onChange={(e) => setProfileGender(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      {/* Driving Licence Number */}
                      <div>
                        <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                          Driving Licence Number
                        </label>
                        <input
                          type="text"
                          value={profileLicenceNumber}
                          onChange={(e) => setProfileLicenceNumber(e.target.value)}
                          placeholder="e.g. MH12 20180045889"
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>

                      {/* Licence Expiry Date */}
                      <div>
                        <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                          Licence Expiry Date
                        </label>
                        <input
                          type="date"
                          value={profileLicenceExpiry}
                          onChange={(e) => setProfileLicenceExpiry(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>

                      {/* Aadhaar Card Number */}
                      <div>
                        <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                          Aadhaar Card / Govt ID Number
                        </label>
                        <input
                          type="text"
                          value={profileAadhaar}
                          onChange={(e) => setProfileAadhaar(e.target.value)}
                          placeholder="e.g. 4892 3892 1092"
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white tracking-widest focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>

                    {/* Change Password Card */}
                    <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-3 shadow-2xs">
                      <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-850">
                        <Lock className="w-4 h-4 text-orange-600" />
                        Change Password
                      </h3>

                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        Leave blank if you do not wish to change your password.
                      </p>

                      {/* New Password */}
                      <div>
                        <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                          New Password
                        </label>
                        <div className="relative">
                          <KeyRound className="w-4 h-4 text-neutral-400 absolute left-3 top-2" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="At least 6 characters"
                            className="w-full pl-9 pr-10 py-1.5 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Confirm Password */}
                      <div>
                        <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <KeyRound className="w-4 h-4 text-neutral-400 absolute left-3 top-2" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter new password"
                            className="w-full pl-9 pr-10 py-1.5 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Host Shield & Security Badge */}
                    <div className="p-3.5 rounded-2xl bg-orange-50/70 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 text-xs space-y-1">
                      <span className="font-bold text-orange-900 dark:text-orange-200 flex items-center gap-1.5 text-xs">
                        <ShieldCheck className="w-4 h-4 text-orange-600" />
                        Host Account Protection
                      </span>
                      <p className="text-[10px] text-orange-800 dark:text-orange-300 leading-relaxed">
                        Your account has active Host Tier privileges with 256-bit encrypted credential management and real-time trip notifications.
                      </p>
                    </div>

                    {/* DANGER ZONE: DELETE ACCOUNT */}
                    <div className="p-4 rounded-2xl bg-red-50/60 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h4 className="text-xs font-bold text-red-900 dark:text-red-300 flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                            Danger Zone: Permanently Delete Account
                          </h4>
                          <p className="text-[10px] text-red-700 dark:text-red-400 mt-0.5">
                            Purge host profile, fleet vehicles, booking history, and documents from MySQL database.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsDeleteModalOpen(true)}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Host Account</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* BOTTOM ACTIONS */}
                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                  <button
                    type="button"
                    onClick={() => {
                      if (user) {
                        setProfileName(user.name || '');
                        setProfilePhone(user.phone || '+91 98230 44889');
                        setProfileBio(user.bio || '');
                        setProfileAvatar(user.avatar || '');
                        setNewPassword('');
                        setConfirmPassword('');
                        setProfileErrorMsg(null);
                        setProfileSuccessMsg(null);
                      }
                      setActiveTab('fleet');
                    }}
                    className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSavingProfile || isUploadingAvatar}
                    className="px-5 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-2xs cursor-pointer transition-colors"
                  >
                    {isSavingProfile ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Profile & Security</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
          </div>
        </main>
      </div>

      {/* Edit Vehicle Modal */}
      <EditCarModal
        isOpen={Boolean(editingCar)}
        onClose={() => setEditingCar(null)}
        car={editingCar}
        onCarUpdated={(updatedCar) => {
          setCars((prev) => prev.map((c) => (c.id === updatedCar.id ? updatedCar : c)));
          showNotification(`Vehicle "${updatedCar.title}" updated successfully!`);
        }}
      />

      {/* Vehicle Availability & Blackout Dates Modal */}
      {calendarCar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 space-y-4 text-xs text-neutral-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <div>
                <h3 className="font-extrabold text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-orange-600" />
                  <span>Availability &amp; Blackout Dates</span>
                </h3>
                <p className="text-[11px] text-neutral-500">{calendarCar.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setCalendarCar(null)}
                className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Block dates when your car is in service, maintenance, or personal use. Blocked dates automatically hide this car from public searches for those days.
            </p>

            <div className="flex gap-2">
              <input
                type="date"
                value={newBlackoutDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setNewBlackoutDate(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-semibold"
              />
              <button
                type="button"
                onClick={() => {
                  if (!newBlackoutDate) return;
                  const current = calendarCar.blackout_dates || [];
                  if (!current.includes(newBlackoutDate)) {
                    const updated = [...current, newBlackoutDate].sort();
                    handleSaveBlackoutDates(calendarCar.id, updated);
                  }
                  setNewBlackoutDate('');
                }}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl cursor-pointer"
              >
                + Block Date
              </button>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pt-2">
              {(calendarCar.blackout_dates || []).length === 0 ? (
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 text-center text-neutral-400">
                  No blackout dates set. Vehicle is available all days.
                </div>
              ) : (
                (calendarCar.blackout_dates || []).map(d => (
                  <div
                    key={d}
                    className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                  >
                    <span className="font-mono font-bold">{d}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = (calendarCar.blackout_dates || []).filter(x => x !== d);
                        handleSaveBlackoutDates(calendarCar.id, next);
                      }}
                      className="text-red-500 hover:underline font-bold cursor-pointer"
                    >
                      Unblock
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Digital Trip Handover Checklist & Odometer Modal */}
      {handoverBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 space-y-4 text-xs text-neutral-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <div>
                <h3 className="font-extrabold text-sm flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-orange-600" />
                  <span>Digital Trip Handover &amp; Odometer Log</span>
                </h3>
                <p className="text-[11px] text-neutral-500">
                  {handoverBooking.car_title} · Guest: {handoverBooking.renter_name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHandoverBooking(null)}
                className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 tabular-nums">
              <div>
                <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-300 mb-1">
                  Pre-Trip Start Odometer (km)
                </label>
                <input
                  type="number"
                  value={startOdoInput}
                  onChange={e => setStartOdoInput(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-300 mb-1">
                  Post-Trip Return Odometer (km)
                </label>
                <input
                  type="number"
                  value={endOdoInput}
                  onChange={e => setEndOdoInput(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-300 mb-1">
                  Fuel / Battery Level at Handover
                </label>
                <select
                  value={fuelLevelInput}
                  onChange={e => setFuelLevelInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-bold"
                >
                  <option value="100% Full">100% Full Tank / Charge</option>
                  <option value="75% (3/4)">75% (3/4 Tank)</option>
                  <option value="50% (Half)">50% (Half Tank)</option>
                  <option value="25% (1/4)">25% (Quarter Tank)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-300 mb-1">
                  Extra Km / Fuel Adjustment (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={extraKmChargeInput}
                  onChange={e => setExtraKmChargeInput(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-300 mb-1">
                Vehicle Condition &amp; Handover Checklist Notes
              </label>
              <textarea
                rows={2}
                value={handoverNotesInput}
                onChange={e => setHandoverNotesInput(e.target.value)}
                placeholder="e.g. Tire pressure checked, FASTag active, no exterior scratches, original DL verified..."
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => handleSaveHandoverChecklist('checkin')}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
              >
                Save Pre-Trip Check-In (Start Trip)
              </button>
              <button
                type="button"
                onClick={() => handleSaveHandoverChecklist('checkout')}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
              >
                Complete Return Check-Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Host Payout Statement & GST Invoice Modal */}
      <InvoiceModal
        isOpen={Boolean(invoiceBooking)}
        onClose={() => setInvoiceBooking(null)}
        booking={invoiceBooking}
        mode="lender"
      />

      {/* Permanent Account Deletion Modal */}
      {user && (
        <DeleteAccountModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          userId={user.id}
          userEmail={user.email || ''}
          userRole="lender"
          onAccountDeleted={async () => {
            if (onSignOut) onSignOut();
            navigate('/');
          }}
        />
      )}

      {/* Uploading Photo Overlay Indicator */}
      {isUploadingPhoto && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center space-y-4 p-4 text-white animate-in fade-in">
          <div className="p-4 rounded-3xl bg-orange-600/20 border border-orange-500/40 animate-bounce">
            <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
          </div>
          <h4 className="font-extrabold text-lg">Uploading Vehicle Image to HTK S3 Cloud Storage</h4>
          <p className="text-xs text-neutral-300 max-w-sm text-center animate-pulse">
            {uploadProgressMsg || 'Transferring photo via dual-mode HTK S3 network...'}
          </p>
        </div>
      )}
    </div>
  );
};
