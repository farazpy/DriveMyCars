import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  Car as CarIcon,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  CalendarCheck,
  Search,
  Eye,
  Trash2,
  LogOut,
  Layers,
  IndianRupee,
  Lock,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  PlusCircle,
  Edit,
  Download,
  FileText,
  Scale,
  Gauge,
  SlidersHorizontal,
  Globe,
  Settings,
  Building2,
  Phone,
  Mail,
  Upload,
  Image as ImageIcon,
  Save
} from 'lucide-react';
import { Car, Booking, UserProfile } from '../types.ts';
import { Link, useRouter } from '../router.tsx';
import { EditCarModal } from '../components/EditCarModal.tsx';
import { InvoiceModal } from '../components/InvoiceModal.tsx';
import { usePlatformSettings, PlatformSettings } from '../context/PlatformSettingsContext.tsx';
import { VehicleOnboardingWizard } from '../components/VehicleOnboardingWizard.tsx';

interface AdminDashboardProps {
  user: UserProfile | null;
  onSignOut: () => void;
  onSignInRequired?: () => void;
  onOpenListCarModal?: () => void;
}

const AUTHORIZED_ADMIN_EMAILS = [
  'operationalhtklabs@gmail.com',
  'farazxs16@gmail.com'
];
const AUTHORIZED_ADMIN_EMAIL = AUTHORIZED_ADMIN_EMAILS[0];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  user,
  onSignOut,
  onSignInRequired,
  onOpenListCarModal,
}) => {
  const { navigate } = useRouter();
  const { settings, updateSettings } = usePlatformSettings();
  const [activeTab, setActiveTab] = useState<'overview' | 'cars' | 'users' | 'bookings' | 'ledger' | 'settings'>('overview');
  const [cars, setCars] = useState<Car[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [isOnboardingCar, setIsOnboardingCar] = useState(false);

  // Platform Brand Settings State
  const [settingsForm, setSettingsForm] = useState<PlatformSettings>(settings);
  const [savingSettings, setSavingSettings] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);

  useEffect(() => {
    if (settings) {
      setSettingsForm(settings);
    }
  }, [settings]);

  // Filters & Search
  const [filterApproval, setFilterApproval] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [carSearch, setCarSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'customer' | 'lender' | 'admin'>('all');
  const [userSearch, setUserSearch] = useState('');
  const [bookingFilter, setBookingFilter] = useState<'all' | 'disputed' | 'active' | 'cancelled'>('all');

  // Modals
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [invoiceBooking, setInvoiceBooking] = useState<Booking | null>(null);
  const [disputeModalBooking, setDisputeModalBooking] = useState<Booking | null>(null);
  const [disputeNotesInput, setDisputeNotesInput] = useState('');
  const [disputeStatusInput, setDisputeStatusInput] = useState<'none' | 'open' | 'resolved'>('resolved');

  const [notification, setNotification] = useState<string | null>(null);

  const isAuthorizedAdmin = Boolean(
    user?.role === 'admin' ||
    (user?.email && AUTHORIZED_ADMIN_EMAILS.includes(user.email.toLowerCase()))
  );

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const fetchAdminData = async () => {
    if (!isAuthorizedAdmin) return;
    setLoading(true);
    try {
      const [carsRes, usersRes, bookingsRes, healthRes] = await Promise.all([
        fetch('/api/admin/cars'),
        fetch('/api/admin/users'),
        fetch('/api/bookings'),
        fetch('/api/health')
      ]);

      if (carsRes.ok) {
        const cData = await carsRes.json();
        setCars(cData);
      }
      if (usersRes.ok) {
        const uData = await usersRes.json();
        setAllUsers(uData);
      }
      if (bookingsRes.ok) {
        const bData = await bookingsRes.json();
        setBookings(bData);
      }
      if (healthRes.ok) {
        const hData = await healthRes.json();
        setHealthStatus(hData);
      }
    } catch (e) {
      console.error('Failed to load admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  // Authentication guard: if user is logged out, immediately redirect to homepage
  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchAdminData();
  }, [user, isAuthorizedAdmin]);

  // Restricted Clearance Screen if not authorized
  // Actions moved after authorization check to avoid hook violations

  // 1. Car Approval & Deletion Actions
  const handleCarApproval = async (carId: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`/api/admin/cars/${carId}/approval`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approval_status: status }),
      });
      if (res.ok) {
        setCars(cars.map(c => (c.id === carId ? { ...c, approval_status: status } : c)));
        showNotification(
          `Vehicle set to ${status.toUpperCase()}! ${
            status === 'approved' ? 'Now LIVE on the public marketplace.' : 'Hidden from public marketplace.'
          }`
        );
      }
    } catch (e) {
      console.error('Failed to update car approval:', e);
    }
  };

  const handleDeleteCarAdmin = async (carId: string, title: string) => {
    if (!window.confirm(`Permanently remove "${title}" from the platform?`)) return;
    try {
      const res = await fetch(`/api/cars/${carId}`, { method: 'DELETE' });
      if (res.ok) {
        setCars(prev => prev.filter(c => c.id !== carId));
        showNotification(`Vehicle "${title}" permanently deleted.`);
      }
    } catch (e) {
      console.error('Failed to delete car:', e);
    }
  };

  // 2. User Role & Status Management
  const handleUpdateUserRoleOrStatus = async (
    targetUserId: string,
    updates: { role?: string; status?: string }
  ) => {
    try {
      const res = await fetch(`/api/admin/users/${targetUserId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updated = await res.json();
        setAllUsers(prev =>
          prev.map(u => (u.id === targetUserId ? { ...u, ...updates, ...(updated || {}) } : u))
        );
        showNotification('User role & governance clearance updated.');
      }
    } catch (e) {
      console.error('Failed to update user:', e);
    }
  };

  // 3. Booking Status, Dispute & Payout Ledger Overrides
  const handleUpdateBookingDetails = async (bookingId: string, updates: Record<string, any>) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/details`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updated = await res.json();
        setBookings(prev =>
          prev.map(b => (b.id === bookingId ? { ...b, ...updates, ...(updated || {}) } : b))
        );
        showNotification('Booking record & ledger updated.');
      }
    } catch (e) {
      console.error('Failed to update booking details:', e);
    }
  };

  const handleSaveDisputeResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeModalBooking) return;
    await handleUpdateBookingDetails(disputeModalBooking.id, {
      dispute_status: disputeStatusInput,
      dispute_notes: disputeNotesInput.trim(),
    });
    setDisputeModalBooking(null);
  };

  const handleExportLedgerCSV = () => {
    const headers = [
      'Booking ID',
      'Date',
      'Vehicle',
      'Renter Name',
      'Renter Email',
      'Status',
      'Gross Total (INR)',
      'Extra Km Charge (INR)',
      'Platform Commission 10% (INR)',
      'Net Host Payout 90% (INR)',
      'Payout Status'
    ];
    const rows = bookings.map(b => {
      const gross = Number(b.total_price || 0);
      const extraKm = Number(b.extra_km_charge || 0);
      const comm = b.platform_commission ? Number(b.platform_commission) : Math.round(gross * 0.1);
      const net = b.net_lender_payout ? Number(b.net_lender_payout) : Math.round(gross * 0.9) + extraKm;
      return [
        b.id,
        b.created_at ? new Date(b.created_at).toISOString().split('T')[0] : '',
        `"${(b.car_title || '').replace(/"/g, '""')}"`,
        `"${(b.renter_name || '').replace(/"/g, '""')}"`,
        b.renter_email || '',
        b.status,
        gross,
        extraKm,
        comm,
        net,
        b.payout_status || 'pending'
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `charvirental-platform-ledger-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    const ok = await updateSettings(settingsForm);
    setSavingSettings(false);
    if (ok) {
      showNotification('Platform branding, contact, and domain configurations saved successfully!');
    } else {
      showNotification('Failed to update platform settings. Please retry.');
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('caption', 'Platform Brand Logo');
      formData.append('file_name', file.name);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && (data.file_url || data.direct_link)) {
        const logoUrl = data.direct_link || data.file_url;
        setSettingsForm(prev => ({ ...prev, logo_url: logoUrl }));
        showNotification('Brand logo uploaded! Click Save to apply.');
      } else {
        showNotification(data.error || 'Failed to upload logo.');
      }
    } catch (err) {
      console.error('Logo upload error:', err);
      showNotification('Network error uploading logo.');
    } finally {
      setIsUploadingLogo(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingFavicon(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('caption', 'Platform Favicon');
      formData.append('file_name', file.name);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && (data.file_url || data.direct_link)) {
        const faviconUrl = data.direct_link || data.file_url;
        setSettingsForm(prev => ({ ...prev, favicon_url: faviconUrl }));
        showNotification('Browser Favicon uploaded! Click Save to apply.');
      } else {
        showNotification(data.error || 'Failed to upload favicon.');
      }
    } catch (err) {
      console.error('Favicon upload error:', err);
      showNotification('Network error uploading favicon.');
    } finally {
      setIsUploadingFavicon(false);
      if (e.target) e.target.value = '';
    }
  };

  // Computed KPIs
  const pendingCarsCount = cars.filter(c => c.approval_status === 'pending').length;
  const openDisputesCount = bookings.filter(b => b.dispute_status === 'open').length;
  const activeBookings = bookings.filter(b => b.status !== 'cancelled');
  const totalGMV = activeBookings.reduce(
    (sum, b) => sum + Number(b.total_price || 0) + Number(b.extra_km_charge || 0),
    0
  );
  const totalPlatformCommission = activeBookings.reduce(
    (sum, b) =>
      sum +
      (b.platform_commission
        ? Number(b.platform_commission)
        : Math.round(Number(b.total_price || 0) * 0.1)),
    0
  );
  const totalNetHostPayouts = activeBookings.reduce(
    (sum, b) =>
      sum +
      (b.net_lender_payout
        ? Number(b.net_lender_payout)
        : Math.round(Number(b.total_price || 0) * 0.9) + Number(b.extra_km_charge || 0)),
    0
  );

  // Filtered Lists
  const filteredCars = useMemo(() => {
    return cars.filter(c => {
      if (filterApproval !== 'all' && c.approval_status !== filterApproval) return false;
      if (carSearch.trim()) {
        const q = carSearch.toLowerCase();
        return (
          c.title.toLowerCase().includes(q) ||
          c.lender_name.toLowerCase().includes(q) ||
          (c.reg_number || '').toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [cars, filterApproval, carSearch]);

  const filteredUsers = useMemo(() => {
    return allUsers.filter(u => {
      if (userRoleFilter !== 'all' && u.role !== userRoleFilter) return false;
      if (userSearch.trim()) {
        const q = userSearch.toLowerCase();
        return (
          (u.name || '').toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q) ||
          (u.phone || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allUsers, userRoleFilter, userSearch]);

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      if (bookingFilter === 'disputed') return b.dispute_status === 'open';
      if (bookingFilter === 'active') return b.status === 'confirmed' || b.status === 'active';
      if (bookingFilter === 'cancelled') return b.status === 'cancelled';
      return true;
    });
  }, [bookings, bookingFilter]);

  // Restricted Clearance Screen if not authorized - MOVED HERE to respect Rules of Hooks
  if (!isAuthorizedAdmin) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-neutral-950 border border-neutral-800 rounded-3xl p-8 space-y-6 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-2xl bg-orange-600/20 text-orange-500 border border-orange-500/30 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-[11px] font-bold uppercase tracking-wider">
              Restricted Clearance
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Admin Access Restricted
            </h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Access to this system governance portal is strictly restricted to authorized administrator:
            </p>
            <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 font-mono text-xs font-bold text-orange-400 select-all">
              {AUTHORIZED_ADMIN_EMAILS.join(' or ')}
            </div>
          </div>

          {user ? (
            <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800 text-xs text-neutral-400 text-left space-y-1">
              <div className="flex justify-between text-[11px]">
                <span>Currently Signed In:</span>
                <span className="text-red-400 font-bold">Unauthorized Role</span>
              </div>
              <p className="font-bold text-white truncate">{user.email}</p>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-400">
              No Google account currently signed in.
            </div>
          )}

          <div className="space-y-3 pt-2">
            {onSignInRequired && (
              <button
                onClick={onSignInRequired}
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl transition-all shadow-2xs cursor-pointer flex items-center justify-center space-x-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Sign In with {AUTHORIZED_ADMIN_EMAIL}</span>
              </button>
            )}

            {user && (
              <button
                onClick={onSignOut}
                className="w-full py-2.5 border border-neutral-800 hover:bg-neutral-900 text-neutral-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Sign Out from {user.email?.split('@')[0]}
              </button>
            )}

            <Link
              to="/"
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-neutral-400 hover:text-white transition-colors pt-2"
            >
              <span>Back to Public Car Fleet</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-neutral-900 text-white px-4 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* ADMIN HEADER */}
      <header className="sticky top-0 z-30 w-full max-w-full overflow-x-hidden bg-neutral-900 text-white px-3 sm:px-8 py-3 flex items-center justify-between gap-2 shadow-md">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <Link to="/" className="flex items-center space-x-1.5 sm:space-x-2 font-extrabold text-sm sm:text-base text-white shrink min-w-0">
            {settings.logo_url ? (
              <img src={settings.logo_url} alt={settings.brand_name} className="h-7 sm:h-8 max-w-[80px] xs:max-w-[110px] sm:max-w-[120px] object-contain rounded shrink-0" />
            ) : (
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0">
                <ShieldAlert className="w-4 h-4" />
              </div>
            )}
            <span className="truncate max-w-[90px] xs:max-w-[130px] sm:max-w-none">{settings.brand_name}</span>
          </Link>
          <span className="text-[10px] font-extrabold px-1 sm:px-1.5 py-0.5 rounded-md bg-orange-950/60 text-orange-400 border border-orange-800 shrink-0">
            v1.3.7
          </span>
          <span className="text-neutral-600 hidden sm:inline">|</span>
          <div className="hidden lg:flex items-center space-x-2">
            <span className="text-xs font-bold text-neutral-200">System Governance Portal</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-500/20 text-orange-400 border border-orange-500/30">
              Super Admin: { (user?.email || AUTHORIZED_ADMIN_EMAIL).split('@')[0] }
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">
          <Link
            to="/"
            className="hidden sm:inline-block px-2.5 sm:px-3 py-1.5 rounded-xl border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-200 transition-colors"
          >
            Public Site
          </Link>

          <button
            onClick={() => {
              setActiveTab('cars');
              setIsOnboardingCar(true);
            }}
            className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-xs font-bold text-white shadow-2xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Add Vehicle</span>
          </button>

          <button
            onClick={onSignOut}
            title="Sign Out"
            className="p-1.5 text-neutral-400 hover:text-red-400 rounded-lg hover:bg-neutral-800 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* DASHBOARD LAYOUT: FIXED LEFT SIDEBAR + MAIN CONTENT */}
      <div className="flex-1 flex w-full">
        {/* FIXED LEFT SIDEBAR */}
        <aside className="w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 p-4 shrink-0 hidden md:flex flex-col justify-between">
          <div className="space-y-6">
            <div className="p-3.5 bg-neutral-900 text-white rounded-2xl flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center font-black text-sm">
                A
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-xs truncate">Executive Governance</h4>
                <p className="text-[10px] text-orange-400 truncate">{user?.email || AUTHORIZED_ADMIN_EMAIL}</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-1 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 font-bold border border-orange-200 dark:border-orange-800'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Executive Overview</span>
              </button>

              <button
                onClick={() => setActiveTab('cars')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'cars'
                    ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 font-bold border border-orange-200 dark:border-orange-800'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <CarIcon className="w-4 h-4" />
                  <span>Fleet & Photo Override</span>
                </div>
                {pendingCarsCount > 0 ? (
                  <span className="text-[10px] px-2 py-0.5 bg-orange-600 text-white font-black rounded-full">
                    {pendingCarsCount}
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-bold rounded-full tabular-nums">
                    {cars.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'users'
                    ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 font-bold border border-orange-200 dark:border-orange-800'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Users className="w-4 h-4" />
                  <span>Users & Role Access</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-bold rounded-full tabular-nums">
                  {allUsers.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('bookings')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'bookings'
                    ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 font-bold border border-orange-200 dark:border-orange-800'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <CalendarCheck className="w-4 h-4" />
                  <span>Trips & Disputes</span>
                </div>
                {openDisputesCount > 0 ? (
                  <span className="text-[10px] px-2 py-0.5 bg-red-600 text-white font-black rounded-full">
                    {openDisputesCount}
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-bold rounded-full tabular-nums">
                    {bookings.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('ledger')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'ledger'
                    ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 font-bold border border-orange-200 dark:border-orange-800'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <IndianRupee className="w-4 h-4 text-emerald-600" />
                  <span>Commission & Ledger</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  ₹{Math.round(totalPlatformCommission).toLocaleString('en-IN')}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 font-bold border border-orange-200 dark:border-orange-800'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <SlidersHorizontal className="w-4 h-4 text-orange-600" />
                  <span>Brand &amp; Platform Settings</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                  Global
                </span>
              </button>
            </nav>

            {onOpenListCarModal && (
              <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  onClick={onOpenListCarModal}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>List / Add a Car</span>
                </button>
              </div>
            )}
          </div>

          <div className="p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 text-xs text-neutral-500 dark:text-neutral-400 space-y-1">
            <span className="font-bold text-neutral-900 dark:text-neutral-200 block text-[11px]">
              Super-Editor Enabled
            </span>
            <p className="text-[10px]">
              Admins can edit any vehicle&apos;s cover photo, gallery, and pricing or override bookings and roles directly.
            </p>
          </div>
        </aside>

        {/* MAIN ADMIN CONTENT */}
        <main className="flex-1 p-4 sm:p-8 space-y-6 overflow-y-auto">
          {/* Mobile Tab Selectors */}
          <div className="md:hidden flex space-x-2 overflow-x-auto pb-2 text-xs font-bold">
            {(
              [
                { id: 'overview', label: 'Overview' },
                { id: 'cars', label: `Fleet (${cars.length})` },
                { id: 'users', label: `Users (${allUsers.length})` },
                { id: 'bookings', label: `Trips (${bookings.length})` },
                { id: 'ledger', label: 'Commission Ledger' },
                { id: 'settings', label: 'Brand & Settings' },
              ] as const
            ).map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-3.5 py-1.5 rounded-xl border whitespace-nowrap ${
                  activeTab === t.id
                    ? 'bg-orange-600 text-white border-orange-600'
                    : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* DATABASE CONNECTION ERROR BANNER (Request #11) */}
          {healthStatus && !healthStatus.db?.connected && (
            <div className="p-6 rounded-3xl border-2 border-red-500 bg-red-50 dark:bg-red-950/20 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-red-100 dark:bg-red-900/40 text-red-600 shrink-0">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-red-900 dark:text-red-400 uppercase tracking-tight">
                    MySQL Database Connection Failure
                  </h3>
                  <p className="text-xs text-red-700 dark:text-red-300 font-medium">
                    The platform is currently running on <span className="font-bold">stale in-memory storage</span>. Any changes made now will be lost on server restart.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-red-200 dark:border-red-900/50 space-y-2">
                  <span className="text-[10px] font-black uppercase text-red-500 tracking-widest flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Exact Diagnostic Error
                  </span>
                  <div className="font-mono text-[11px] text-neutral-600 dark:text-neutral-400 break-all bg-neutral-50 dark:bg-black/40 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800">
                    <p className="text-red-600 dark:text-red-400 font-bold mb-1">
                      {healthStatus.db.error?.code || 'UNKNOWN_ERROR'}: {healthStatus.db.error?.message || 'No specific error message returned.'}
                    </p>
                    <p>Host: {healthStatus.db.host}:{healthStatus.db.port}</p>
                    <p>User: {healthStatus.db.user}</p>
                    <p>Database: {healthStatus.db.database}</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-emerald-200 dark:border-emerald-900/50 space-y-2">
                  <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Recommended Solutions
                  </span>
                  <ul className="space-y-1.5 text-xs text-neutral-600 dark:text-neutral-400 list-disc pl-4">
                    {(healthStatus.db.solutions || []).map((solution: string, idx: number) => (
                      <li key={idx} className="leading-relaxed">{solution}</li>
                    ))}
                    <li className="font-bold text-neutral-900 dark:text-white">Verify credentials in /server/db.ts match your server settings.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Executive KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 text-xs tabular-nums">
            <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-1">
              <span className="text-[10px] text-neutral-400 font-bold uppercase block">Pending Moderation</span>
              <div className="text-2xl font-black text-orange-600">{pendingCarsCount}</div>
            </div>
            <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-1">
              <span className="text-[10px] text-neutral-400 font-bold uppercase block">Approved Live Fleet</span>
              <div className="text-2xl font-black text-emerald-600">
                {cars.filter(c => c.approval_status === 'approved').length}
              </div>
            </div>
            <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-1">
              <span className="text-[10px] text-neutral-400 font-bold uppercase block">Registered Accounts</span>
              <div className="text-2xl font-black text-neutral-900 dark:text-white">{allUsers.length}</div>
            </div>
            <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-1">
              <span className="text-[10px] text-neutral-400 font-bold uppercase block">Gross GMV Volume</span>
              <div className="text-2xl font-black text-neutral-900 dark:text-white">
                ₹{Math.round(totalGMV).toLocaleString('en-IN')}
              </div>
            </div>
            <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-1 col-span-2 sm:col-span-1">
              <span className="text-[10px] text-neutral-400 font-bold uppercase block">Platform Revenue (10%)</span>
              <div className="text-2xl font-black text-emerald-600">
                ₹{Math.round(totalPlatformCommission).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* TAB 1: EXECUTIVE OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="pb-4 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-xl font-black text-neutral-900 dark:text-white">
                    Platform Operations & Governance Center
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Real-time oversight of vehicle approvals, user role clearances, disputes, and host settlements.
                  </p>
                </div>
              </div>

              {pendingCarsCount > 0 && (
                <div className="p-5 rounded-3xl border-2 border-orange-500 bg-orange-50/40 dark:bg-orange-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-orange-800 dark:text-orange-300 uppercase flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-orange-600" />
                      Action Required: {pendingCarsCount} Vehicle(s) Pending Moderation
                    </span>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      Hosts have submitted vehicles awaiting photo inspection and approval before going live.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab('cars');
                      setFilterApproval('pending');
                    }}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold self-start sm:self-auto shadow-2xs cursor-pointer"
                  >
                    Inspect & Approve Cars
                  </button>
                </div>
              )}

              {openDisputesCount > 0 && (
                <div className="p-5 rounded-3xl border-2 border-red-500 bg-red-50/40 dark:bg-red-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-red-800 dark:text-red-300 uppercase flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      {openDisputesCount} Open Booking Dispute(s) Require Resolution
                    </span>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      Review customer/host dispute notes and record an official administrative resolution.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab('bookings');
                      setBookingFilter('disputed');
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold self-start sm:self-auto shadow-2xs cursor-pointer"
                  >
                    Resolve Disputes
                  </button>
                </div>
              )}

              {/* Quick Governance Modules Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 flex items-center justify-center">
                      <CarIcon className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                      Fleet & Live Photo Super-Editor
                    </h3>
                    <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      Override vehicle cover photos, upload S3 images, adjust daily pricing, and approve or reject listings.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('cars')}
                    className="text-orange-600 font-bold flex items-center gap-1 hover:underline cursor-pointer pt-2"
                  >
                    <span>Manage All {cars.length} Vehicles</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                      User Role & KYC Governance
                    </h3>
                    <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      Promote or change user roles (Customer, Host, Admin) and manage account approval or suspension statuses.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('users')}
                    className="text-orange-600 font-bold flex items-center gap-1 hover:underline cursor-pointer pt-2"
                  >
                    <span>Manage {allUsers.length} User Accounts</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
                      <IndianRupee className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                      Commission & Payout Ledger
                    </h3>
                    <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      Track 10% platform commission splits, 90% host net payouts, settlement statuses, and export CSV reports.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('ledger')}
                    className="text-orange-600 font-bold flex items-center gap-1 hover:underline cursor-pointer pt-2"
                  >
                    <span>Open Financial Ledger</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Recent Bookings Snapshot */}
              <div className="p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-neutral-900 dark:text-white text-sm">
                    Recent Platform Reservations
                  </h3>
                  <button
                    onClick={() => setActiveTab('bookings')}
                    className="text-xs font-bold text-orange-600 hover:underline cursor-pointer"
                  >
                    View All ({bookings.length})
                  </button>
                </div>
                <div className="space-y-2 text-xs tabular-nums">
                  {bookings.slice(0, 5).map(b => (
                    <div
                      key={b.id}
                      className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-neutral-900 dark:text-white">{b.car_title}</span>
                        <span className="text-neutral-500 dark:text-neutral-400 text-[11px] block">
                          {b.renter_name} ({b.renter_email})
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-orange-600">
                          ₹{Number(b.total_price).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-bold block uppercase">{b.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FLEET & PHOTO SUPER-EDITOR */}
          {activeTab === 'cars' && (
            isOnboardingCar ? (
              <VehicleOnboardingWizard
                user={user}
                isAdmin={true}
                onComplete={(newCar) => {
                  setCars(prev => [newCar, ...prev.filter(c => c.id !== newCar.id)]);
                  setIsOnboardingCar(false);
                  showNotification(`Vehicle "${newCar.title}" onboarded and published live on marketplace!`);
                }}
                onCancel={() => setIsOnboardingCar(false)}
              />
            ) : (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800 gap-3">
                <div>
                  <h2 className="text-xl font-black text-neutral-900 dark:text-white">
                    Vehicle Moderation & Live Photo Override
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Click &quot;Edit Car &amp; Photos&quot; on any vehicle to replace cover photos, edit specs, or override status.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsOnboardingCar(true)}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-2xs cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>+ Onboard Fleet Vehicle</span>
                  </button>

                  {/* Filter Pills */}
                  <div className="flex flex-wrap gap-1.5 text-xs font-bold">
                    {(['all', 'pending', 'approved', 'rejected'] as const).map(status => (
                      <button
                        key={status}
                        onClick={() => setFilterApproval(status)}
                        className={`px-3 py-1.5 rounded-xl border capitalize transition-colors cursor-pointer ${
                          filterApproval === status
                            ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-2xs'
                            : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50'
                        }`}
                      >
                        {status} ({status === 'all' ? cars.length : cars.filter(c => c.approval_status === status).length})
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative max-w-md">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  value={carSearch}
                  onChange={e => setCarSearch(e.target.value)}
                  placeholder="Search vehicle title, registration number, host name, or city..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Cars Moderation List */}
              <div className="space-y-3">
                {filteredCars.length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-400">
                    No vehicles match the selected filter criteria.
                  </div>
                ) : (
                  filteredCars.map((car) => (
                    <div
                      key={car.id}
                      className="p-4 sm:p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs"
                    >
                      <div className="flex items-center space-x-4">
                        <img
                          src={car.image_url}
                          alt={car.title}
                          className="w-24 h-18 rounded-2xl object-cover border border-neutral-200 dark:border-neutral-700 shrink-0"
                        />
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-bold text-neutral-900 dark:text-white text-sm">{car.title}</h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 font-bold text-neutral-600 dark:text-neutral-300">
                              {car.year} · {car.type}
                            </span>
                            {car.reg_number && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold">
                                {car.reg_number}
                              </span>
                            )}
                          </div>

                          <div className="text-neutral-500 dark:text-neutral-400 text-[11px] flex flex-wrap items-center gap-2 tabular-nums">
                            <span>
                              Host: <strong className="text-neutral-800 dark:text-neutral-200">{car.lender_name}</strong>
                            </span>
                            <span>·</span>
                            <span className="font-bold text-orange-600">
                              ₹{car.price_per_day.toLocaleString('en-IN')}/day
                            </span>
                            <span>·</span>
                            <span>{car.city}</span>
                            <span>·</span>
                            <span>{(car.images || [car.image_url]).length} gallery photo(s)</span>
                          </div>

                          {/* Approval & Availability Status Badges */}
                          <div className="pt-1 flex flex-wrap gap-2">
                            {car.approval_status === 'approved' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Approved (Live on Website)
                              </span>
                            ) : car.approval_status === 'pending' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2.5 py-0.5 rounded-full">
                                <Clock className="w-3 h-3 text-amber-600" />
                                Pending Admin Review (Hidden from Public)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-2.5 py-0.5 rounded-full">
                                <XCircle className="w-3 h-3 text-red-600" />
                                Rejected (Hidden)
                              </span>
                            )}

                            {!car.is_available && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-neutral-600 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-2.5 py-0.5 rounded-full">
                                <AlertTriangle className="w-3 h-3 text-neutral-500" />
                                Availability Paused by Host
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Admin Super-Editor & Approval Buttons */}
                      <div className="flex flex-wrap items-center gap-2 self-end lg:self-center border-t lg:border-t-0 pt-2 lg:pt-0">
                        <button
                          type="button"
                          onClick={() => setEditingCar(car)}
                          className="px-3.5 py-1.5 bg-neutral-900 dark:bg-neutral-800 hover:bg-orange-600 text-white rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5 text-orange-400" />
                          <span>Edit Car &amp; Photos</span>
                        </button>

                        {car.approval_status !== 'approved' && (
                          <button
                            onClick={() => handleCarApproval(car.id, 'approved')}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center space-x-1 shadow-2xs cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                        )}

                        {car.approval_status !== 'rejected' && (
                          <button
                            onClick={() => handleCarApproval(car.id, 'rejected')}
                            className="px-3 py-1.5 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-xl font-bold text-xs flex items-center space-x-1 cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        )}

                        <Link
                          to={`/car/${car.id}`}
                          className="p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl"
                          title="Preview car listing page"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleDeleteCarAdmin(car.id, car.title)}
                          className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl cursor-pointer"
                          title="Delete vehicle permanently"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            )
          )}

          {/* TAB 3: FULL USER ROLE & ACCOUNT STATUS MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800 gap-3">
                <div>
                  <h2 className="text-xl font-black text-neutral-900 dark:text-white">
                    User Directory, Role Assignment &amp; KYC Status
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Manage all registered customers, hosts, and administrators with instant role and status overrides.
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 text-xs font-bold">
                  {(['all', 'customer', 'lender', 'admin'] as const).map(r => (
                    <button
                      key={r}
                      onClick={() => setUserRoleFilter(r)}
                      className={`px-3 py-1.5 rounded-xl border capitalize transition-colors cursor-pointer ${
                        userRoleFilter === r
                          ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white'
                          : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800'
                      }`}
                    >
                      {r === 'lender' ? 'Hosts (Lenders)' : r} (
                      {r === 'all' ? allUsers.length : allUsers.filter(u => u.role === r).length})
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative max-w-md">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  placeholder="Search user by name, email, or phone..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-3">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-400">
                    No users found matching your filter.
                  </div>
                ) : (
                  filteredUsers.map((u) => (
                    <div
                      key={u.id}
                      className="p-4 sm:p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs"
                    >
                      <div className="flex items-start sm:items-center space-x-3.5">
                        <img
                          src={
                            u.avatar ||
                            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'
                          }
                          alt=""
                          className="w-12 h-12 rounded-2xl object-cover border border-neutral-200 dark:border-neutral-700 shrink-0"
                        />
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-bold text-neutral-900 dark:text-white text-sm">
                              {u.name || 'Verified Member'}
                            </h4>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                u.status === 'approved'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                  : u.status === 'suspended' || u.status === 'rejected'
                                  ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                              }`}
                            >
                              {u.status || 'approved'}
                            </span>
                          </div>
                          <div className="text-neutral-500 dark:text-neutral-400 text-[11px] flex flex-wrap items-center gap-2">
                            <span>{u.email}</span>
                            {u.phone && (
                              <>
                                <span>·</span>
                                <span>{u.phone}</span>
                              </>
                            )}
                            {u.licence_number && (
                              <>
                                <span>·</span>
                                <span className="font-mono text-neutral-700 dark:text-neutral-300">
                                  DL: {u.licence_number}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Role & Account Status Controls */}
                      <div className="flex flex-wrap items-center gap-3 self-end lg:self-center">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] font-bold uppercase text-neutral-400">Role:</span>
                          <select
                            value={u.role || 'customer'}
                            onChange={e => handleUpdateUserRoleOrStatus(u.id, { role: e.target.value })}
                            className="px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-bold cursor-pointer focus:outline-none focus:border-orange-500"
                          >
                            <option value="customer">Customer (Renter)</option>
                            <option value="lender">Host (Lender)</option>
                            <option value="admin">System Admin</option>
                          </select>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] font-bold uppercase text-neutral-400">Status:</span>
                          <select
                            value={u.status || 'approved'}
                            onChange={e => handleUpdateUserRoleOrStatus(u.id, { status: e.target.value })}
                            className="px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-bold cursor-pointer focus:outline-none focus:border-orange-500"
                          >
                            <option value="approved">Approved</option>
                            <option value="pending">Pending Verification</option>
                            <option value="suspended">Suspended</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: BOOKINGS, ODOMETER LOGS & DISPUTE OVERRIDES */}
          {activeTab === 'bookings' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800 gap-3">
                <div>
                  <h2 className="text-xl font-black text-neutral-900 dark:text-white">
                    Reservations, Handover Telemetry &amp; Dispute Overrides
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Inspect trip check-in/out odometer readings, resolve disputes, or override reservation statuses.
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 text-xs font-bold">
                  {(
                    [
                      { id: 'all', label: `All (${bookings.length})` },
                      { id: 'disputed', label: `Open Disputes (${openDisputesCount})` },
                      { id: 'active', label: 'Confirmed / Active' },
                      { id: 'cancelled', label: 'Cancelled' },
                    ] as const
                  ).map(f => (
                    <button
                      key={f.id}
                      onClick={() => setBookingFilter(f.id)}
                      className={`px-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                        bookingFilter === f.id
                          ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white'
                          : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {filteredBookings.length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-400">
                    No reservations match the selected filter.
                  </div>
                ) : (
                  filteredBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3.5 text-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                        <div className="flex items-center space-x-3">
                          {booking.car_image && (
                            <img
                              src={booking.car_image}
                              alt=""
                              className="w-14 h-10 rounded-xl object-cover border border-neutral-200 dark:border-neutral-700"
                            />
                          )}
                          <div>
                            <span className="font-mono text-[10px] text-neutral-400 block">{booking.id}</span>
                            <h4 className="font-bold text-neutral-900 dark:text-white text-sm">
                              {booking.car_title}
                            </h4>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {booking.dispute_status === 'open' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Dispute Open
                            </span>
                          )}
                          {booking.dispute_status === 'resolved' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                              Dispute Resolved
                            </span>
                          )}
                          <select
                            value={booking.status}
                            onChange={e =>
                              handleUpdateBookingDetails(booking.id, { status: e.target.value })
                            }
                            className="px-3 py-1 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-bold text-xs uppercase cursor-pointer"
                          >
                            <option value="confirmed">Confirmed</option>
                            <option value="active">Active On-Road</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-neutral-50 dark:bg-neutral-800/60 p-3.5 rounded-2xl border border-neutral-100 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 tabular-nums">
                        <div>
                          <span className="text-[10px] text-neutral-400 font-bold uppercase block">Renter</span>
                          <span className="font-bold text-neutral-900 dark:text-white">{booking.renter_name}</span>
                          <span className="block text-[11px] text-neutral-500 dark:text-neutral-400">
                            {booking.renter_email}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-400 font-bold uppercase block">Schedule</span>
                          <span className="font-bold text-neutral-900 dark:text-white">
                            {booking.pickup_datetime.replace('T', ' ')}
                          </span>
                          <span className="block text-[11px] text-neutral-500 dark:text-neutral-400">
                            to {booking.dropoff_datetime.replace('T', ' ')}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-400 font-bold uppercase block">
                            Handover &amp; Odometer
                          </span>
                          <span className="font-bold text-neutral-900 dark:text-white capitalize">
                            {(booking.handover_status || 'pending').replace('_', ' ')}
                          </span>
                          <span className="block text-[11px] text-neutral-500 font-mono">
                            {booking.start_odometer
                              ? `${booking.start_odometer} km → ${booking.end_odometer || 'Active'} km`
                              : 'Awaiting Check-In'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-400 font-bold uppercase block">
                            Platform Total
                          </span>
                          <span className="font-black text-orange-600 text-sm">
                            ₹{(Number(booking.total_price) + Number(booking.extra_km_charge || 0)).toLocaleString('en-IN')}
                          </span>
                          <span className="text-neutral-400 text-[10px] block">
                            ({booking.total_days}d · {booking.insurance_plan})
                          </span>
                        </div>
                      </div>

                      {(booking.dispute_notes || booking.cancellation_reason) && (
                        <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-[11px] space-y-1">
                          {booking.cancellation_reason && (
                            <p>
                              <strong className="text-red-600">Cancellation Reason:</strong>{' '}
                              {booking.cancellation_reason}
                            </p>
                          )}
                          {booking.dispute_notes && (
                            <p>
                              <strong className="text-amber-800 dark:text-amber-300">
                                Dispute / Governance Notes:
                              </strong>{' '}
                              {booking.dispute_notes}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setDisputeModalBooking(booking);
                            setDisputeNotesInput(booking.dispute_notes || '');
                            setDisputeStatusInput(
                              booking.dispute_status && booking.dispute_status !== 'none'
                                ? booking.dispute_status
                                : 'resolved'
                            );
                          }}
                          className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-bold text-xs flex items-center space-x-1.5 cursor-pointer"
                        >
                          <Scale className="w-3.5 h-3.5 text-orange-600" />
                          <span>Manage Dispute / Notes</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setInvoiceBooking(booking)}
                          className="px-3 py-1.5 rounded-xl bg-neutral-900 dark:bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs flex items-center space-x-1.5 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-orange-400" />
                          <span>GST Invoice &amp; Statement</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 5: PLATFORM COMMISSION & PAYOUT LEDGER */}
          {activeTab === 'ledger' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800 gap-3">
                <div>
                  <h2 className="text-xl font-black text-neutral-900 dark:text-white">
                    Platform Commission &amp; Host Payout Ledger
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    10% Platform Fee &amp; 90% Net Host Settlement ledger across all reservations.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleExportLedgerCSV}
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-2xs cursor-pointer self-start"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Ledger CSV</span>
                </button>
              </div>

              {/* Financial Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs tabular-nums">
                <div className="p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-1">
                  <span className="text-[10px] text-neutral-400 font-bold uppercase block">
                    Gross Booking Volume (GMV)
                  </span>
                  <div className="text-2xl font-black text-neutral-900 dark:text-white">
                    ₹{Math.round(totalGMV).toLocaleString('en-IN')}
                  </div>
                  <span className="text-[11px] text-neutral-500">Inclusive of extra km charges</span>
                </div>

                <div className="p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-1">
                  <span className="text-[10px] text-neutral-400 font-bold uppercase block">
                    Charvi Rental Commission (10%)
                  </span>
                  <div className="text-2xl font-black text-orange-600">
                    ₹{Math.round(totalPlatformCommission).toLocaleString('en-IN')}
                  </div>
                  <span className="text-[11px] text-neutral-500">Net platform treasury fee</span>
                </div>

                <div className="p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-1">
                  <span className="text-[10px] text-neutral-400 font-bold uppercase block">
                    Net Host Payouts (90%)
                  </span>
                  <div className="text-2xl font-black text-emerald-600">
                    ₹{Math.round(totalNetHostPayouts).toLocaleString('en-IN')}
                  </div>
                  <span className="text-[11px] text-neutral-500">Host settlement allocation</span>
                </div>
              </div>

              {/* Ledger Table */}
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs tabular-nums">
                    <thead>
                      <tr className="bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 text-[10px] font-bold uppercase text-neutral-400">
                        <th className="py-3.5 px-4">Booking Ref</th>
                        <th className="py-3.5 px-4">Vehicle &amp; Renter</th>
                        <th className="py-3.5 px-4 text-right">Gross Total</th>
                        <th className="py-3.5 px-4 text-right">Platform Fee (10%)</th>
                        <th className="py-3.5 px-4 text-right">Net Host Payout</th>
                        <th className="py-3.5 px-4">Payout Status</th>
                        <th className="py-3.5 px-4 text-right">Voucher</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                      {bookings.map(b => {
                        const gross = Number(b.total_price || 0);
                        const extraKm = Number(b.extra_km_charge || 0);
                        const comm = b.platform_commission
                          ? Number(b.platform_commission)
                          : Math.round(gross * 0.1);
                        const net = b.net_lender_payout
                          ? Number(b.net_lender_payout)
                          : Math.round(gross * 0.9) + extraKm;
                        return (
                          <tr key={b.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40">
                            <td className="py-3 px-4 font-mono text-[11px] text-neutral-500">{b.id}</td>
                            <td className="py-3 px-4">
                              <span className="font-bold text-neutral-900 dark:text-white block">
                                {b.car_title}
                              </span>
                              <span className="text-[11px] text-neutral-400">{b.renter_name}</span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold">
                              ₹{(gross + extraKm).toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-orange-600 font-semibold">
                              ₹{comm.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-black text-emerald-600">
                              ₹{net.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-4">
                              <select
                                value={b.payout_status || 'pending'}
                                onChange={e =>
                                  handleUpdateBookingDetails(b.id, {
                                    payout_status: e.target.value,
                                    platform_commission: comm,
                                    net_lender_payout: net,
                                  })
                                }
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase border cursor-pointer ${
                                  b.payout_status === 'paid'
                                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                    : b.payout_status === 'processing'
                                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                    : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                }`}
                              >
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="paid">Settled / Paid</option>
                              </select>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => setInvoiceBooking(b)}
                                className="px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[11px] font-bold cursor-pointer"
                              >
                                Statement
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: BRAND IDENTITY, DOMAIN & CONTACT SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800 gap-3">
                <div>
                  <h2 className="text-xl font-black text-neutral-900 dark:text-white flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5 text-orange-600" />
                    <span>Brand Identity, Domain &amp; Contact Configurations</span>
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Change app brand name, custom logo, domain name, support phone/email, and official address.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50 self-start sm:self-auto"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingSettings ? 'Saving Settings...' : 'Save All Settings'}</span>
                </button>
              </div>

              {/* Form Grid */}
              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Brand & Logo */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className="p-5 sm:p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-4">
                      <div className="flex items-center space-x-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                        <Building2 className="w-4 h-4 text-orange-600" />
                        <h3 className="font-extrabold text-sm text-neutral-900 dark:text-white">
                          Brand Identity &amp; Platform Domain
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                            App Brand Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={settingsForm.brand_name}
                            onChange={e => setSettingsForm({ ...settingsForm, brand_name: e.target.value })}
                            placeholder="e.g. Charvi Rental"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 font-bold text-xs focus:border-orange-500 focus:outline-none"
                          />
                          <span className="text-[10px] text-neutral-400 mt-0.5 block">Appears on headers, emails, invoices &amp; title</span>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                            Primary Domain Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={settingsForm.domain_name}
                            onChange={e => setSettingsForm({ ...settingsForm, domain_name: e.target.value })}
                            placeholder="e.g. charvirental.com"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 font-mono text-xs focus:border-orange-500 focus:outline-none"
                          />
                          <span className="text-[10px] text-neutral-400 mt-0.5 block">Primary web domain for customer access</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                          Brand Subtitle / Tagline
                        </label>
                        <input
                          type="text"
                          value={settingsForm.brand_tagline}
                          onChange={e => setSettingsForm({ ...settingsForm, brand_tagline: e.target.value })}
                          placeholder="e.g. Self-Drive Fleet · India"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-xs focus:border-orange-500 focus:outline-none"
                        />
                      </div>

                      {/* Logo Configuration */}
                      <div className="space-y-3 pt-2">
                        <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                          Custom Logo Image
                        </label>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                          <div className="w-24 h-16 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex items-center justify-center p-2 shrink-0 overflow-hidden">
                            {settingsForm.logo_url ? (
                              <img
                                src={settingsForm.logo_url}
                                alt="Logo Preview"
                                className="max-h-full max-w-full object-contain"
                              />
                            ) : (
                              <div className="flex flex-col items-center text-neutral-400">
                                <CarIcon className="w-6 h-6 text-orange-600 mb-0.5" />
                                <span className="text-[9px] font-bold">Default Icon</span>
                              </div>
                            )}
                          </div>

                          <div className="flex-1 space-y-2 w-full">
                            <input
                              type="url"
                              value={settingsForm.logo_url}
                              onChange={e => setSettingsForm({ ...settingsForm, logo_url: e.target.value })}
                              placeholder="Direct Image URL (https://.../logo.png)"
                              className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-mono focus:border-orange-500 focus:outline-none"
                            />

                            <div className="flex flex-wrap items-center gap-2">
                              <label className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 dark:bg-neutral-800 hover:bg-neutral-800 text-white text-xs font-bold cursor-pointer transition-colors">
                                <Upload className="w-3.5 h-3.5 text-orange-400" />
                                <span>{isUploadingLogo ? 'Uploading...' : 'Upload Logo to S3'}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleLogoUpload}
                                  disabled={isUploadingLogo}
                                  className="hidden"
                                />
                              </label>

                              {settingsForm.logo_url && (
                                <button
                                  type="button"
                                  onClick={() => setSettingsForm({ ...settingsForm, logo_url: '' })}
                                  className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-bold text-neutral-600 dark:text-neutral-300 cursor-pointer"
                                >
                                  Reset to Default Icon
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Favicon Configuration */}
                      <div className="space-y-3 pt-2">
                        <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider flex items-center justify-between">
                          <span>Browser Favicon (.ico, .png, .svg)</span>
                          <span className="text-[10px] font-extrabold text-orange-600 bg-orange-50 dark:bg-orange-950/60 px-2 py-0.5 rounded-md border border-orange-200 dark:border-orange-800">
                            Tab &amp; Bookmark Icon
                          </span>
                        </label>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                          <div className="w-16 h-16 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex items-center justify-center p-2 shrink-0 overflow-hidden shadow-2xs">
                            {settingsForm.favicon_url ? (
                              <img
                                src={settingsForm.favicon_url}
                                alt="Favicon Preview"
                                className="w-8 h-8 object-contain"
                              />
                            ) : (
                              <div className="flex flex-col items-center text-neutral-400">
                                <Globe className="w-6 h-6 text-orange-600 mb-0.5" />
                                <span className="text-[9px] font-bold">Default</span>
                              </div>
                            )}
                          </div>

                          <div className="flex-1 space-y-2 w-full">
                            <input
                              type="url"
                              value={settingsForm.favicon_url || ''}
                              onChange={e => setSettingsForm({ ...settingsForm, favicon_url: e.target.value })}
                              placeholder="Direct Favicon URL (https://.../favicon.ico or .png)"
                              className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-mono focus:border-orange-500 focus:outline-none"
                            />

                            <div className="flex flex-wrap items-center gap-2">
                              <label className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-2xs">
                                <Upload className="w-3.5 h-3.5 text-white" />
                                <span>{isUploadingFavicon ? 'Uploading Favicon...' : 'Upload Favicon Image'}</span>
                                <input
                                  type="file"
                                  accept="image/*,.ico,.svg"
                                  onChange={handleFaviconUpload}
                                  disabled={isUploadingFavicon}
                                  className="hidden"
                                />
                              </label>

                              {settingsForm.favicon_url && (
                                <button
                                  type="button"
                                  onClick={() => setSettingsForm({ ...settingsForm, favicon_url: '' })}
                                  className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-bold text-neutral-600 dark:text-neutral-300 cursor-pointer"
                                >
                                  Remove Favicon
                                </button>
                              )}
                            </div>
                            <span className="text-[10px] text-neutral-400 block">
                              Appears in browser tabs, mobile bookmarks, and search results (Recommended size: 32x32px or 64x64px PNG/ICO).
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Social Media Links */}
                    <div className="p-5 sm:p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-4">
                      <div className="flex items-center space-x-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                        <Globe className="w-4 h-4 text-orange-600" />
                        <h3 className="font-extrabold text-sm text-neutral-900 dark:text-white">
                          Social Media Profiles &amp; Handles
                        </h3>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                            Instagram URL
                          </label>
                          <input
                            type="url"
                            value={settingsForm.social_instagram || ''}
                            onChange={e => setSettingsForm({ ...settingsForm, social_instagram: e.target.value })}
                            placeholder="https://instagram.com/yourbrand"
                            className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-xs focus:border-orange-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                            Twitter / X URL
                          </label>
                          <input
                            type="url"
                            value={settingsForm.social_twitter || ''}
                            onChange={e => setSettingsForm({ ...settingsForm, social_twitter: e.target.value })}
                            placeholder="https://twitter.com/yourbrand"
                            className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-xs focus:border-orange-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                            Facebook Page URL
                          </label>
                          <input
                            type="url"
                            value={settingsForm.social_facebook || ''}
                            onChange={e => setSettingsForm({ ...settingsForm, social_facebook: e.target.value })}
                            placeholder="https://facebook.com/yourbrand"
                            className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-xs focus:border-orange-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Contact, GST & Hours */}
                  <div className="lg:col-span-5 space-y-6">
                    <div className="p-5 sm:p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-4">
                      <div className="flex items-center space-x-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                        <Phone className="w-4 h-4 text-emerald-600" />
                        <h3 className="font-extrabold text-sm text-neutral-900 dark:text-white">
                          Customer Support &amp; Concierge Contacts
                        </h3>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                            Official Support Email *
                          </label>
                          <div className="relative">
                            <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                            <input
                              type="email"
                              required
                              value={settingsForm.contact_email}
                              onChange={e => setSettingsForm({ ...settingsForm, contact_email: e.target.value })}
                              placeholder="support@domain.com"
                              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-xs font-semibold focus:border-orange-500 focus:outline-none"
                            />
                          </div>
                          <span className="text-[10px] text-neutral-400 mt-0.5 block">Displayed on footer, contact page &amp; customer receipts</span>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                            Official Dispatch &amp; Roadside Hotline *
                          </label>
                          <div className="relative">
                            <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                            <input
                              type="text"
                              required
                              value={settingsForm.contact_phone}
                              onChange={e => setSettingsForm({ ...settingsForm, contact_phone: e.target.value })}
                              placeholder="+91 98765 43210"
                              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-xs font-semibold focus:border-orange-500 focus:outline-none"
                            />
                          </div>
                          <span className="text-[10px] text-neutral-400 mt-0.5 block">Toll-free or emergency roadside contact number</span>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                            Operational Support Hours
                          </label>
                          <input
                            type="text"
                            value={settingsForm.support_hours}
                            onChange={e => setSettingsForm({ ...settingsForm, support_hours: e.target.value })}
                            placeholder="e.g. 24/7 Roadside & Concierge Support"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-xs focus:border-orange-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                            Registered Office Address *
                          </label>
                          <textarea
                            rows={3}
                            required
                            value={settingsForm.contact_address}
                            onChange={e => setSettingsForm({ ...settingsForm, contact_address: e.target.value })}
                            placeholder="e.g. Wakad, Pune, Maharashtra 411057, India"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-xs focus:border-orange-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                            Corporate GST Registration Number
                          </label>
                          <input
                            type="text"
                            value={settingsForm.gst_number}
                            onChange={e => setSettingsForm({ ...settingsForm, gst_number: e.target.value })}
                            placeholder="e.g. 27AAACD1234F1Z5"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 font-mono text-xs focus:border-orange-500 focus:outline-none"
                          />
                          <span className="text-[10px] text-neutral-400 mt-0.5 block">Printed on GST tax invoices</span>
                        </div>
                      </div>
                    </div>

                    {/* Live Preview Card */}
                    <div className="p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 space-y-3">
                      <span className="text-[11px] font-black uppercase text-neutral-400 tracking-wider block">
                        Live Brand Header Preview
                      </span>
                      <div className="p-3.5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          {settingsForm.logo_url ? (
                            <img
                              src={settingsForm.logo_url}
                              alt="Brand Logo"
                              className="h-8 max-w-[120px] object-contain rounded"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold">
                              <CarIcon className="w-4 h-4" />
                            </div>
                          )}
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-extrabold text-sm text-neutral-900 dark:text-white">
                                {settingsForm.brand_name || 'Brand Name'}
                              </span>
                              <span className="text-[9px] px-1 py-0.2 rounded bg-orange-100 text-orange-700 font-bold">
                                v1.3.5
                              </span>
                            </div>
                            <span className="text-[10px] text-neutral-400 block -mt-0.5">
                              {settingsForm.brand_tagline || 'Self-Drive Fleet'}
                            </span>
                          </div>
                        </div>

                        <span className="text-[11px] font-bold text-orange-600 font-mono">
                          {settingsForm.domain_name}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Platform Commission Rates & Operational Site Configurations (Request #2) */}
                <div className="p-6 sm:p-7 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800 gap-2">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 flex items-center justify-center">
                        <SlidersHorizontal className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base text-neutral-900 dark:text-white">
                          Platform Commission Rates &amp; Fleet Operational Configurations
                        </h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          Configure commission withholding rates, GST tax rules, rental limits, and instant verification controls.
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 w-fit">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Live Platform Policies
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {/* Platform Commission Rate */}
                    <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                          Platform Commission Rate (%)
                        </label>
                        <span className="text-xs font-black text-orange-600 font-mono">
                          {settingsForm.commission_rate ?? 15}%
                        </span>
                      </div>
                      <input
                        type="number"
                        min={0}
                        max={50}
                        step={1}
                        value={settingsForm.commission_rate ?? 15}
                        onChange={e => setSettingsForm({ ...settingsForm, commission_rate: Number(e.target.value) })}
                        className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-bold focus:border-orange-500 focus:outline-none"
                      />
                      <p className="text-[11px] text-neutral-400">
                        Platform revenue cut deducted from trip gross rental before host payout.
                      </p>
                    </div>

                    {/* GST Rate on Commission */}
                    <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                          GST on Platform Fee (%)
                        </label>
                        <span className="text-xs font-black text-orange-600 font-mono">
                          {settingsForm.gst_rate ?? 18}%
                        </span>
                      </div>
                      <input
                        type="number"
                        min={0}
                        max={28}
                        step={1}
                        value={settingsForm.gst_rate ?? 18}
                        onChange={e => setSettingsForm({ ...settingsForm, gst_rate: Number(e.target.value) })}
                        className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-bold focus:border-orange-500 focus:outline-none"
                      />
                      <p className="text-[11px] text-neutral-400">
                        Mandatory Goods &amp; Services Tax rate applied to platform invoice service fees.
                      </p>
                    </div>

                    {/* Default Security Deposit */}
                    <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                          Default Security Deposit (₹)
                        </label>
                        <span className="text-xs font-black text-orange-600 font-mono">
                          ₹{Number(settingsForm.security_deposit_default ?? 5000).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <input
                        type="number"
                        min={0}
                        step={500}
                        value={settingsForm.security_deposit_default ?? 5000}
                        onChange={e => setSettingsForm({ ...settingsForm, security_deposit_default: Number(e.target.value) })}
                        className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-bold focus:border-orange-500 focus:outline-none"
                      />
                      <p className="text-[11px] text-neutral-400">
                        Standard refundable security deposit held on user card during the rental duration.
                      </p>
                    </div>

                    {/* Minimum Booking Duration */}
                    <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                          Min Booking Hours
                        </label>
                        <span className="text-xs font-black text-orange-600 font-mono">
                          {settingsForm.min_booking_hours ?? 8} hrs
                        </span>
                      </div>
                      <input
                        type="number"
                        min={1}
                        max={72}
                        value={settingsForm.min_booking_hours ?? 8}
                        onChange={e => setSettingsForm({ ...settingsForm, min_booking_hours: Number(e.target.value) })}
                        className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-bold focus:border-orange-500 focus:outline-none"
                      />
                      <p className="text-[11px] text-neutral-400">
                        Minimum rental reservation window allowed for any self-drive car.
                      </p>
                    </div>

                    {/* Default Daily KM Limit */}
                    <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                          Included Daily KM
                        </label>
                        <span className="text-xs font-black text-orange-600 font-mono">
                          {settingsForm.default_km_limit ?? 250} km/day
                        </span>
                      </div>
                      <input
                        type="number"
                        min={50}
                        max={1000}
                        step={10}
                        value={settingsForm.default_km_limit ?? 250}
                        onChange={e => setSettingsForm({ ...settingsForm, default_km_limit: Number(e.target.value) })}
                        className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-bold focus:border-orange-500 focus:outline-none"
                      />
                      <p className="text-[11px] text-neutral-400">
                        Complimentary distance allowance bundled into 24-hour daily price.
                      </p>
                    </div>

                    {/* Extra KM Rate */}
                    <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                          Extra KM Rate (₹/km)
                        </label>
                        <span className="text-xs font-black text-orange-600 font-mono">
                          ₹{settingsForm.default_extra_km_rate ?? 12}/km
                        </span>
                      </div>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        step={1}
                        value={settingsForm.default_extra_km_rate ?? 12}
                        onChange={e => setSettingsForm({ ...settingsForm, default_extra_km_rate: Number(e.target.value) })}
                        className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-bold focus:border-orange-500 focus:outline-none"
                      />
                      <p className="text-[11px] text-neutral-400">
                        Default excess distance surcharge billed to renter during return checkout.
                      </p>
                    </div>
                  </div>

                  {/* Automated Moderation & KYC Policies */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <span className="font-bold text-xs text-neutral-900 dark:text-white block">
                          Instant Vehicle Publishing (Bypass Moderation)
                        </span>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          When enabled, vehicles listed by verified hosts immediately appear live on the public marketplace without waiting for manual admin approval.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={Boolean(settingsForm.auto_approve_vehicles)}
                        onChange={e => setSettingsForm({ ...settingsForm, auto_approve_vehicles: e.target.checked })}
                        className="w-5 h-5 accent-orange-600 rounded cursor-pointer mt-0.5"
                      />
                    </div>

                    <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <span className="font-bold text-xs text-neutral-900 dark:text-white block">
                          Instant Host KYC Verification
                        </span>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          When enabled, new lenders completing the Become a Host wizard are automatically granted Host Tier clearance and can list cars right away.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={Boolean(settingsForm.auto_approve_hosts)}
                        onChange={e => setSettingsForm({ ...settingsForm, auto_approve_hosts: e.target.checked })}
                        className="w-5 h-5 accent-orange-600 rounded cursor-pointer mt-0.5"
                      />
                    </div>
                  </div>

                  {/* Interactive Financial Model Simulator */}
                  <div className="p-5 rounded-2xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-orange-900 dark:text-orange-300 flex items-center gap-1.5">
                        <Scale className="w-4 h-4 text-orange-600" />
                        Live Payout Split Simulator (Sample ₹3,000 Booking)
                      </span>
                      <span className="text-[11px] text-neutral-500 font-mono">Formula: Gross - ({settingsForm.commission_rate ?? 15}% Comm)</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                        <span className="text-[10px] text-neutral-400 uppercase font-bold block">Gross Rental</span>
                        <span className="text-base font-black text-neutral-900 dark:text-white">₹3,000</span>
                      </div>
                      <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                        <span className="text-[10px] text-neutral-400 uppercase font-bold block">
                          Platform ({settingsForm.commission_rate ?? 15}%)
                        </span>
                        <span className="text-base font-black text-orange-600">
                          ₹{Math.round(3000 * ((settingsForm.commission_rate ?? 15) / 100))}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                        <span className="text-[10px] text-neutral-400 uppercase font-bold block">
                          Net Host Payout ({100 - (settingsForm.commission_rate ?? 15)}%)
                        </span>
                        <span className="text-base font-black text-emerald-600">
                          ₹{Math.round(3000 * (1 - ((settingsForm.commission_rate ?? 15) / 100)))}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                        <span className="text-[10px] text-neutral-400 uppercase font-bold block">
                          GST on Fee ({settingsForm.gst_rate ?? 18}%)
                        </span>
                        <span className="text-base font-black text-neutral-700 dark:text-neutral-300">
                          ₹{Math.round((3000 * ((settingsForm.commission_rate ?? 15) / 100)) * ((settingsForm.gst_rate ?? 18) / 100))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setSettingsForm(settings)}
                    className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 font-bold text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                  >
                    Reset Changes
                  </button>
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingSettings ? 'Saving Settings...' : 'Save All Settings'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* Admin Vehicle Super-Editor Modal */}
      <EditCarModal
        isOpen={Boolean(editingCar)}
        onClose={() => setEditingCar(null)}
        car={editingCar}
        isAdminMode={true}
        onCarUpdated={(updatedCar) => {
          setCars(prev => prev.map(c => (c.id === updatedCar.id ? updatedCar : c)));
          showNotification(`Vehicle "${updatedCar.title}" updated by Admin!`);
        }}
      />

      {/* GST Invoice & Payout Statement Modal */}
      <InvoiceModal
        isOpen={Boolean(invoiceBooking)}
        onClose={() => setInvoiceBooking(null)}
        booking={invoiceBooking}
        mode="admin"
      />

      {/* Dispute Resolution Modal */}
      {disputeModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <h3 className="font-extrabold text-sm text-neutral-900 dark:text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-orange-600" />
                <span>Booking Dispute &amp; Governance Override</span>
              </h3>
              <button
                type="button"
                onClick={() => setDisputeModalBooking(null)}
                className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDisputeResolution} className="space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase text-neutral-400 block">Reservation</span>
                <p className="font-bold text-neutral-900 dark:text-white">
                  {disputeModalBooking.car_title} ({disputeModalBooking.id})
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Dispute Status
                </label>
                <select
                  value={disputeStatusInput}
                  onChange={e => setDisputeStatusInput(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-bold"
                >
                  <option value="none">No Active Dispute</option>
                  <option value="open">Open — Under Investigation</option>
                  <option value="resolved">Resolved — Closed by Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Admin Resolution &amp; Audit Notes
                </label>
                <textarea
                  rows={3}
                  value={disputeNotesInput}
                  onChange={e => setDisputeNotesInput(e.target.value)}
                  placeholder="Enter dispute resolution summary, refund adjustments, or odometer verification notes..."
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDisputeModalBooking(null)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold cursor-pointer"
                >
                  Save Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
