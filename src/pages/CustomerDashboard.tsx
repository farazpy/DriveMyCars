import React, { useState, useEffect } from 'react';
import {
  User,
  FileText,
  CalendarCheck,
  Upload,
  CheckCircle2,
  ShieldCheck,
  Trash2,
  Car as CarIcon,
  LogOut,
  ArrowRight,
  FileUp,
  X,
  AlertTriangle,
  Heart,
  Printer,
  Calendar,
  Scale,
  Phone,
  Gauge,
  XCircle
} from 'lucide-react';
import { UserProfile, Booking, Car } from '../types.ts';
import { Link, useRouter } from '../router.tsx';
import { DeleteAccountModal } from '../components/DeleteAccountModal.tsx';
import { InvoiceModal } from '../components/InvoiceModal.tsx';
import { CarCard } from '../components/CarCard.tsx';
import { usePlatformSettings } from '../context/PlatformSettingsContext.tsx';

interface CustomerDashboardProps {
  user: UserProfile | null;
  allCars?: Car[];
  wishlistIds?: string[];
  onToggleWishlist?: (car: Car) => void;
  onSignInRequired: () => void;
  onSignOut: () => void;
}

interface DocItem {
  id: string;
  user_id: string;
  doc_type: string;
  file_name: string;
  file_url: string;
  status: 'verified' | 'pending' | 'rejected';
  uploaded_at: string;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  user,
  allCars = [],
  wishlistIds = [],
  onToggleWishlist,
  onSignInRequired,
  onSignOut,
}) => {
  const { navigate } = useRouter();
  const { settings } = usePlatformSettings();
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'history' | 'wishlist'>('overview');
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Authentication guard: if user is logged out, immediately redirect to homepage
  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);
  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  // Upload & Account Modals
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [docType, setDocType] = useState('Indian Driving Licence (Front)');
  const [fileName, setFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Trip Self-Service Modals (Invoice, Reschedule, Cancel, Dispute)
  const [invoiceBooking, setInvoiceBooking] = useState<Booking | null>(null);
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);
  const [newPickupDate, setNewPickupDate] = useState('');
  const [newDropoffDate, setNewDropoffDate] = useState('');

  const [cancelBookingTarget, setCancelBookingTarget] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const [disputeBookingTarget, setDisputeBookingTarget] = useState<Booking | null>(null);
  const [disputeIssueText, setDisputeIssueText] = useState('');

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Fetch bookings and documents for customer
  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const renterId = user.id;
      const [bookingsRes, docsRes] = await Promise.all([
        fetch(`/api/bookings?renter_id=${renterId}`),
        fetch(`/api/documents?user_id=${renterId}`)
      ]);

      if (bookingsRes.ok) {
        const bData = await bookingsRes.json();
        setBookings(bData);
      }
      if (docsRes.ok) {
        const dData = await docsRes.json();
        setDocuments(dData);
      }
    } catch (e) {
      console.error('Failed to fetch customer data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim()) return;
    setUploading(true);
    try {
      let uploadedUrl = 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80';

      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('caption', `${docType}: ${fileName.trim()}`);
        formData.append('file_name', selectedFile.name);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok && (uploadData.file_url || uploadData.direct_link)) {
          uploadedUrl = uploadData.direct_link || uploadData.file_url;
        }
      }

      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id || 'user-faraz',
          doc_type: docType,
          file_name: fileName.trim(),
          file_url: uploadedUrl,
        }),
      });
      if (res.ok) {
        const newDoc = await res.json();
        setDocuments([newDoc, ...documents]);
        setIsUploadOpen(false);
        setFileName('');
        setSelectedFile(null);
        showNotification('Verification document uploaded & encrypted.');
      }
    } catch (err) {
      console.error('Failed to upload document:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    if (!window.confirm('Delete this uploaded document?')) return;
    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDocuments(documents.filter(d => d.id !== id));
        showNotification('Document removed.');
      }
    } catch (err) {
      console.error('Failed to delete doc:', err);
    }
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleBooking || !newPickupDate || !newDropoffDate) return;
    const start = new Date(newPickupDate);
    const end = new Date(newDropoffDate);
    const diffDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const newTotal = diffDays * Number(rescheduleBooking.price_per_day);

    try {
      const res = await fetch(`/api/bookings/${rescheduleBooking.id}/details`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickup_datetime: `${newPickupDate}T10:00`,
          dropoff_datetime: `${newDropoffDate}T10:00`,
          total_days: diffDays,
          total_price: newTotal,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setBookings(prev =>
          prev.map(b =>
            b.id === rescheduleBooking.id
              ? {
                  ...b,
                  pickup_datetime: `${newPickupDate}T10:00`,
                  dropoff_datetime: `${newDropoffDate}T10:00`,
                  total_days: diffDays,
                  total_price: newTotal,
                  ...(updated || {}),
                }
              : b
          )
        );
        showNotification('Trip dates rescheduled successfully!');
        setRescheduleBooking(null);
      }
    } catch (err) {
      console.error('Failed to reschedule trip:', err);
    }
  };

  const handleCancelTripSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelBookingTarget) return;
    try {
      const res = await fetch(`/api/bookings/${cancelBookingTarget.id}/details`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'cancelled',
          cancellation_reason: cancelReason.trim() || 'Cancelled by customer via portal',
        }),
      });
      if (res.ok) {
        setBookings(prev =>
          prev.map(b =>
            b.id === cancelBookingTarget.id
              ? { ...b, status: 'cancelled', cancellation_reason: cancelReason.trim() }
              : b
          )
        );
        showNotification('Reservation cancelled.');
        setCancelBookingTarget(null);
        setCancelReason('');
      }
    } catch (err) {
      console.error('Failed to cancel trip:', err);
    }
  };

  const handleFileDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeBookingTarget || !disputeIssueText.trim()) return;
    try {
      const res = await fetch(`/api/bookings/${disputeBookingTarget.id}/details`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dispute_status: 'open',
          dispute_notes: `[Customer Report]: ${disputeIssueText.trim()}`,
        }),
      });
      if (res.ok) {
        setBookings(prev =>
          prev.map(b =>
            b.id === disputeBookingTarget.id
              ? {
                  ...b,
                  dispute_status: 'open',
                  dispute_notes: `[Customer Report]: ${disputeIssueText.trim()}`,
                }
              : b
          )
        );
        showNotification('Support ticket & dispute submitted to System Governance.');
        setDisputeBookingTarget(null);
        setDisputeIssueText('');
      }
    } catch (err) {
      console.error('Failed to file dispute:', err);
    }
  };

  const wishlistedCars = allCars.filter(c => wishlistIds.includes(c.id));

  // Helper to compute 4-stage trip progress step (1..4)
  const getTripStageIndex = (b: Booking) => {
    if (b.status === 'completed' || b.handover_status === 'checked_out') return 4;
    if (b.status === 'active' || b.handover_status === 'checked_in') return 3;
    if (b.status === 'confirmed') return 2;
    return 1;
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-neutral-950 flex flex-col font-sans transition-colors duration-200">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-neutral-900 text-white px-4 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* CUSTOMER DASHBOARD HEADER */}
      <header className="sticky top-0 z-30 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-3 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs transition-colors duration-200 max-w-full overflow-x-hidden">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <Link to="/" className="flex items-center space-x-2 text-neutral-900 dark:text-white font-extrabold text-base min-w-0">
            {settings.logo_url ? (
              <img src={settings.logo_url} alt={settings.brand_name} className="h-7 max-w-[100px] sm:max-w-[120px] object-contain rounded shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0">
                <CarIcon className="w-4 h-4" />
              </div>
            )}
            <span className="truncate max-w-[100px] sm:max-w-none">{settings.brand_name}</span>
          </Link>
          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 shrink-0">
            v1.3.7
          </span>
          <span className="text-neutral-300 dark:text-neutral-700 hidden xs:inline">|</span>
          <div className="hidden xs:flex items-center space-x-2 min-w-0">
            <span className="text-xs font-bold text-neutral-900 dark:text-neutral-200 truncate">Customer Portal</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50 hidden sm:flex items-center gap-1 shrink-0">
              <CheckCircle2 className="w-3 h-3" /> Verified Driver
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          <Link
            to="/"
            className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-bold text-neutral-700 dark:text-neutral-300 transition-colors shrink-0"
          >
            Explore Fleet
          </Link>

          {user ? (
            <div className="flex items-center space-x-2 pl-2 border-l border-neutral-200 dark:border-neutral-800 shrink-0">
              {user.avatar ? (
                <img src={user.avatar} className="w-7 h-7 rounded-lg object-cover" alt="" />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-600 font-bold text-xs flex items-center justify-center shrink-0">
                  {(user.name || 'U').charAt(0)}
                </div>
              )}
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 hidden md:inline truncate max-w-[120px]">
                {user.name || user.email}
              </span>
              <button
                onClick={onSignOut}
                title="Sign Out"
                className="p-1.5 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/45 cursor-pointer shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onSignInRequired}
              className="px-3.5 py-1.5 bg-orange-600 text-white rounded-xl text-xs font-bold shadow-2xs hover:bg-orange-700 cursor-pointer shrink-0"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* DASHBOARD LAYOUT: FIXED LEFT SIDEBAR + MAIN CONTENT */}
      <div className="flex-1 flex w-full px-2 sm:px-4 lg:px-8">
        {/* FIXED LEFT SIDEBAR */}
        <aside className="w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 p-4 shrink-0 hidden md:flex flex-col justify-between transition-colors duration-200">
          <div className="space-y-6">
            <div className="p-3 bg-neutral-50 dark:bg-neutral-950 rounded-2xl border border-neutral-100 dark:border-neutral-850 flex items-center space-x-3">
              {user?.avatar ? (
                <img src={user.avatar} className="w-10 h-10 rounded-xl object-cover border border-neutral-200 dark:border-neutral-850" alt="" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 font-black text-sm flex items-center justify-center">
                  {(user?.name || 'C').charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-xs text-neutral-900 dark:text-white truncate">{user?.name || 'Customer Guest'}</h4>
                <p className="text-[10px] text-neutral-400 dark:text-neutral-550 truncate">{user?.email || 'guest@charvirental.com'}</p>
              </div>
            </div>

            {/* Sidebar Navigation */}
            <nav className="space-y-1 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 font-bold border border-orange-200 dark:border-orange-900/50'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Account Overview</span>
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 font-bold border border-orange-200 dark:border-orange-900/50'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <CalendarCheck className="w-4 h-4" />
                  <span>My Trips &amp; Invoices</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 font-bold rounded-full tabular-nums">
                  {bookings.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('wishlist')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'wishlist'
                    ? 'bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 font-bold border border-orange-200 dark:border-orange-900/50'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Heart className="w-4 h-4 text-rose-500" />
                  <span>Saved Wishlist</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-full tabular-nums">
                  {wishlistedCars.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('documents')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'documents'
                    ? 'bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 font-bold border border-orange-200 dark:border-orange-900/50'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <FileText className="w-4 h-4" />
                  <span>KYC Documents</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-full tabular-nums">
                  {documents.length}
                </span>
              </button>
            </nav>
          </div>

          {/* Quick Support & Return */}
          <div className="p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs space-y-2 transition-colors">
            <span className="font-bold text-neutral-900 dark:text-white block text-[11px]">24/7 Roadside Concierge</span>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Need help with an active rental or key handover?</p>
            <Link to="/contact" className="text-orange-600 dark:text-orange-400 font-bold flex items-center gap-1 text-[11px] hover:underline">
              <span>Contact Dispatch</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </aside>

        {/* MAIN DASHBOARD CONTENT */}
        <main className="flex-1 p-4 sm:p-8 space-y-6 overflow-y-auto text-neutral-900 dark:text-neutral-100">
          {/* Mobile Tab Pills */}
          <div className="md:hidden flex space-x-2 overflow-x-auto pb-2 text-xs font-bold">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-1.5 rounded-xl border whitespace-nowrap ${
                activeTab === 'overview' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300'
              }`}
            >
              Account
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-1.5 rounded-xl border whitespace-nowrap ${
                activeTab === 'history' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300'
              }`}
            >
              Trips ({bookings.length})
            </button>
            <button
              onClick={() => setActiveTab('wishlist')}
              className={`px-3.5 py-1.5 rounded-xl border whitespace-nowrap ${
                activeTab === 'wishlist' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300'
              }`}
            >
              Wishlist ({wishlistedCars.length})
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`px-3.5 py-1.5 rounded-xl border whitespace-nowrap ${
                activeTab === 'documents' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300'
              }`}
            >
              Documents ({documents.length})
            </button>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800 gap-3">
                <div>
                  <h2 className="text-xl font-black text-neutral-900 dark:text-white">Driver Account Profile</h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Manage your verified customer credentials, trips, and tax invoices.</p>
                </div>
                <Link
                  to="/"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-2xs self-start"
                >
                  <CarIcon className="w-4 h-4" />
                  <span>Rent a Car</span>
                </Link>
              </div>

              {/* Profile Card */}
              <div className="p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs transition-colors">
                <div>
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase block">Full Name</span>
                  <span className="font-bold text-neutral-900 dark:text-white text-sm mt-0.5 block">{user?.name || 'Verified Customer'}</span>
                  <span className="text-neutral-500 text-[11px]">Google Authenticated</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase block">Verified Email</span>
                  <span className="font-bold text-neutral-900 dark:text-white text-sm mt-0.5 block truncate">{user?.email || 'pune.driver@charvirental.com'}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Identity Confirmed
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase block">Driver Clearance</span>
                  <span className="font-bold text-neutral-900 dark:text-white text-sm mt-0.5 block">Approved Self-Drive Tier</span>
                  <span className="text-neutral-500 dark:text-neutral-400 text-[11px]">Zero-hassle digital handover enabled</span>
                </div>
              </div>

              {/* Driver License & Identity details if onboarded */}
              {user?.onboarded && (
                <div className="p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3 transition-colors text-xs">
                  <h4 className="font-bold text-sm text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Transport Ministry KYC Verified
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1 text-[11px]">
                    <div>
                      <span className="text-neutral-400 block font-bold">DRIVING LICENCE</span>
                      <span className="font-bold text-neutral-800 dark:text-neutral-200 uppercase">{user.licence_number}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block font-bold">LICENCE EXPIRY</span>
                      <span className="font-bold text-neutral-800 dark:text-neutral-200">{user.licence_expiry}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block font-bold">DATE OF BIRTH</span>
                      <span className="font-bold text-neutral-800 dark:text-neutral-200">{user.dob}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block font-bold">GENDER</span>
                      <span className="font-bold text-neutral-800 dark:text-neutral-200">{user.gender}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Stat Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs tabular-nums">
                <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-1">
                  <span className="text-neutral-400 dark:text-neutral-500 font-bold text-[10px] uppercase">Total Trips Reserved</span>
                  <div className="text-2xl font-black text-neutral-900 dark:text-white">{bookings.length}</div>
                </div>
                <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-1">
                  <span className="text-neutral-400 dark:text-neutral-500 font-bold text-[10px] uppercase">Saved Wishlist Vehicles</span>
                  <div className="text-2xl font-black text-rose-600">{wishlistedCars.length}</div>
                </div>
                <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-1">
                  <span className="text-neutral-400 dark:text-neutral-500 font-bold text-[10px] uppercase">Uploaded KYC Docs</span>
                  <div className="text-2xl font-black text-orange-600">{documents.length}</div>
                </div>
              </div>

              {/* Danger Zone: Permanent Account Deletion */}
              <div className="p-5 rounded-2xl bg-red-50/60 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <h4 className="font-bold text-red-900 dark:text-red-300 text-xs flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                    Danger Zone: Permanently Delete Account
                  </h4>
                  <p className="text-[11px] text-red-700 dark:text-red-400 mt-0.5">
                    Erase customer profile, uploaded driver credentials, and rental history permanently from database.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Renter Account</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: DOCUMENTS UPLOAD */}
          {activeTab === 'documents' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800 gap-3">
                <div>
                  <h2 className="text-xl font-black text-neutral-900 dark:text-white">Uploaded Driver Documents</h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Government ID, driver&apos;s licences, and auto insurance records.</p>
                </div>
                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-2xs self-start cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Document</span>
                </button>
              </div>

              <div className="space-y-3">
                {documents.length === 0 ? (
                  <div className="text-center py-12 p-6 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-400 dark:text-neutral-500 transition-colors">
                    No documents uploaded yet. Upload your driver&apos;s licence to unlock instant contactless booking.
                  </div>
                ) : (
                  documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-900/50">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-neutral-900 dark:text-white text-sm">{doc.doc_type}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 uppercase">
                              {doc.status}
                            </span>
                          </div>
                          <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono block mt-0.5">{doc.file_name}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 self-end sm:self-center">
                        <span className="text-[11px] text-neutral-400 dark:text-neutral-500 mr-2">
                          Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => handleDeleteDoc(doc.id)}
                          title="Delete document"
                          className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/45 rounded-lg transition-colors cursor-pointer"
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

          {/* TAB 3: MY TRIPS, LIVE STATUS TRACKER, RESCHEDULE & GST INVOICES */}
          {activeTab === 'history' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800 gap-3">
                <div>
                  <h2 className="text-xl font-black text-neutral-900 dark:text-white">
                    My Trips, Live Handover Tracker &amp; GST Invoices
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Track real-time handover status, reschedule upcoming dates, or download official GST tax invoices.
                  </p>
                </div>
                <Link
                  to="/"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-2xs self-start"
                >
                  <CarIcon className="w-4 h-4" />
                  <span>Reserve Another Vehicle</span>
                </Link>
              </div>

              <div className="space-y-4">
                {bookings.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 space-y-3 transition-colors">
                    <CarIcon className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mx-auto" />
                    <h4 className="font-bold text-neutral-800 dark:text-neutral-200 text-sm">No reservations yet</h4>
                    <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                      Choose from our approved cars in Pune on the homepage and start your first journey.
                    </p>
                    <Link
                      to="/"
                      className="inline-block px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold"
                    >
                      Browse Available Fleet
                    </Link>
                  </div>
                ) : (
                  bookings.map((booking) => {
                    const stageIdx = getTripStageIndex(booking);
                    const matchedCar = allCars.find(c => c.id === booking.car_id);
                    return (
                      <div
                        key={booking.id}
                        className="p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-4 text-xs transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-850 pb-3">
                          <div className="flex items-center space-x-3">
                            <img
                              src={booking.car_image || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80'}
                              alt={booking.car_title}
                              className="w-16 h-12 rounded-xl object-cover border border-neutral-200 dark:border-neutral-850 shrink-0"
                            />
                            <div>
                              <span className="font-mono text-[10px] text-neutral-400 block">{booking.id}</span>
                              <h4 className="font-bold text-neutral-900 dark:text-white text-sm">{booking.car_title}</h4>
                              {matchedCar && (
                                <span className="text-[11px] text-neutral-500 flex items-center gap-1.5">
                                  <span>Host: <strong>{matchedCar.lender_name}</strong></span>
                                  <span>·</span>
                                  <span>{matchedCar.location}</span>
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {booking.dispute_status === 'open' && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300">
                                Support Ticket Open
                              </span>
                            )}
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

                        {/* Live 4-Stage Trip Status Tracker */}
                        {booking.status !== 'cancelled' && (
                          <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/70 dark:border-neutral-800">
                            <div className="grid grid-cols-4 gap-2 text-[10px] font-bold">
                              {[
                                { step: 1, label: '1. Reserved' },
                                { step: 2, label: '2. Confirmed & Ready' },
                                { step: 3, label: '3. Active Handover' },
                                { step: 4, label: '4. Trip Completed' },
                              ].map(s => {
                                const done = stageIdx >= s.step;
                                return (
                                  <div key={s.step} className="space-y-1">
                                    <div
                                      className={`h-1.5 rounded-full transition-colors ${
                                        done ? 'bg-orange-600' : 'bg-neutral-200 dark:bg-neutral-800'
                                      }`}
                                    />
                                    <span
                                      className={`block truncate ${
                                        done ? 'text-orange-600 dark:text-orange-400' : 'text-neutral-400'
                                      }`}
                                    >
                                      {s.label}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-neutral-50 dark:bg-neutral-950 p-3.5 rounded-2xl border border-neutral-100 dark:border-neutral-850 text-neutral-600 dark:text-neutral-400 transition-colors tabular-nums">
                          <div>
                            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase block">Pick-up</span>
                            <span className="font-bold text-neutral-900 dark:text-white text-xs">{booking.pickup_datetime.replace('T', ' ')}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase block">Drop-off</span>
                            <span className="font-bold text-neutral-900 dark:text-white text-xs">{booking.dropoff_datetime.replace('T', ' ')}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase block">Odometer &amp; Fuel Log</span>
                            <span className="font-mono font-bold text-neutral-900 dark:text-white text-xs">
                              {booking.start_odometer
                                ? `${booking.start_odometer} km → ${booking.end_odometer || 'Active'} km`
                                : 'Standard Check-In'}
                            </span>
                            {booking.fuel_level && (
                              <span className="block text-[10px] text-neutral-400">Fuel: {booking.fuel_level}</span>
                            )}
                          </div>
                          <div>
                            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase block">Paid Total (Incl. GST)</span>
                            <span className="font-black text-orange-600 dark:text-orange-400 text-sm">
                              ₹{(Number(booking.total_price) + Number(booking.extra_km_charge || 0)).toLocaleString('en-IN')}
                            </span>
                            <span className="text-neutral-400 dark:text-neutral-550 text-[10px] block">
                              ({booking.total_days} days · {booking.insurance_plan})
                            </span>
                          </div>
                        </div>

                        {/* Self-Service Action Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <div className="text-[11px] text-neutral-500 flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-emerald-600" />
                            <span>24/7 Host &amp; Roadside Desk: <strong>+91 20 6729 8800</strong></span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {booking.status === 'confirmed' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRescheduleBooking(booking);
                                    setNewPickupDate(booking.pickup_datetime.split('T')[0]);
                                    setNewDropoffDate(booking.dropoff_datetime.split('T')[0]);
                                  }}
                                  className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-bold text-xs flex items-center space-x-1.5 cursor-pointer"
                                >
                                  <Calendar className="w-3.5 h-3.5 text-orange-600" />
                                  <span>Modify Dates</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setCancelBookingTarget(booking)}
                                  className="px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 font-bold text-xs flex items-center space-x-1.5 cursor-pointer"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Cancel Trip</span>
                                </button>
                              </>
                            )}

                            <button
                              type="button"
                              onClick={() => setDisputeBookingTarget(booking)}
                              className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-bold text-xs flex items-center space-x-1.5 cursor-pointer"
                            >
                              <Scale className="w-3.5 h-3.5 text-amber-600" />
                              <span>Report Issue</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setInvoiceBooking(booking)}
                              className="px-3.5 py-1.5 rounded-xl bg-neutral-900 dark:bg-orange-600 hover:bg-neutral-800 dark:hover:bg-orange-700 text-white font-bold text-xs flex items-center space-x-1.5 cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Download GST Invoice</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SAVED WISHLIST CARS */}
          {activeTab === 'wishlist' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800 gap-3">
                <div>
                  <h2 className="text-xl font-black text-neutral-900 dark:text-white">Saved Favorite Vehicles</h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Bookmarked self-drive cars ready for instant comparison and reservation.
                  </p>
                </div>
                <Link
                  to="/"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold self-start"
                >
                  Explore More Cars
                </Link>
              </div>

              {wishlistedCars.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 space-y-3">
                  <Heart className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mx-auto" />
                  <h4 className="font-bold text-neutral-800 dark:text-neutral-200 text-sm">Your Wishlist is Empty</h4>
                  <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                    Tap the heart icon on any vehicle card in the public fleet to save it here for quick access.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {wishlistedCars.map(car => (
                    <CarCard
                      key={car.id}
                      car={car}
                      rentalDays={3}
                      isWishlisted={true}
                      onToggleWishlist={onToggleWishlist}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* UPLOAD DOCUMENT MODAL */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors text-neutral-900 dark:text-white">
            <div className="flex items-center justify-between p-5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-950/80">
              <h3 className="font-bold text-neutral-900 dark:text-white text-base">Upload Verification Document</h3>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadDoc} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                  Document Type
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-2.5 font-medium focus:border-orange-500 focus:outline-none dark:text-white cursor-pointer"
                >
                  <option value="Indian Driving Licence (Front)">Indian Driving Licence (Front)</option>
                  <option value="Indian Driving Licence (Back)">Indian Driving Licence (Back)</option>
                  <option value="Aadhaar Card (DigiLocker Verified)">Aadhaar Card (DigiLocker Verified)</option>
                  <option value="PAN Card (Identity Proof)">PAN Card (Identity Proof)</option>
                  <option value="Comprehensive Auto Insurance">Comprehensive Auto Insurance Policy</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                  File Name / Note
                </label>
                <input
                  type="text"
                  required
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="e.g. driving_licence_front.pdf"
                  className="w-full bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-2.5 font-medium focus:border-orange-500 focus:outline-none dark:text-white"
                />
              </div>

              <div className="p-4 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl text-center space-y-2 bg-neutral-50 dark:bg-neutral-950 relative hover:border-orange-500 transition-colors">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setSelectedFile(f);
                      if (!fileName) setFileName(f.name);
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <FileUp className="w-7 h-7 text-orange-600 mx-auto" />
                {selectedFile ? (
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </p>
                ) : (
                  <>
                    <span className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 block">
                      Click or drag document file to upload
                    </span>
                    <span className="text-[10px] text-neutral-400 block">
                      Encrypted &amp; stored on HTK S3 Cloud
                    </span>
                  </>
                )}
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-colors shadow-2xs cursor-pointer"
              >
                {uploading ? 'Encrypting & Saving...' : 'Save Document to Account'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* RESCHEDULE TRIP MODAL */}
      {rescheduleBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 space-y-4 text-xs text-neutral-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-600" />
                <span>Modify Trip Dates — {rescheduleBooking.car_title}</span>
              </h3>
              <button
                type="button"
                onClick={() => setRescheduleBooking(null)}
                className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-300 mb-1">
                    New Pick-up Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newPickupDate}
                    onChange={e => setNewPickupDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-300 mb-1">
                    New Drop-off Date
                  </label>
                  <input
                    type="date"
                    required
                    min={newPickupDate}
                    value={newDropoffDate}
                    onChange={e => setNewDropoffDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-semibold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRescheduleBooking(null)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold cursor-pointer"
                >
                  Confirm New Dates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCEL TRIP MODAL */}
      {cancelBookingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 space-y-4 text-xs text-neutral-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <h3 className="font-extrabold text-sm text-red-600 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                <span>Cancel Reservation — {cancelBookingTarget.car_title}</span>
              </h3>
              <button
                type="button"
                onClick={() => setCancelBookingTarget(null)}
                className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCancelTripSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-300 mb-1">
                  Reason for Cancellation
                </label>
                <textarea
                  rows={3}
                  required
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  placeholder="Please share why you need to cancel this reservation..."
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelBookingTarget(null)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 font-bold cursor-pointer"
                >
                  Keep Trip
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer"
                >
                  Confirm Cancellation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REPORT ISSUE / FILE DISPUTE MODAL */}
      {disputeBookingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 space-y-4 text-xs text-neutral-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <Scale className="w-4 h-4 text-orange-600" />
                <span>Report Trip Issue / Billing Dispute</span>
              </h3>
              <button
                type="button"
                onClick={() => setDisputeBookingTarget(null)}
                className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFileDisputeSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-300 mb-1">
                  Describe Issue (Handover, Vehicle Condition, or Billing)
                </label>
                <textarea
                  rows={3}
                  required
                  value={disputeIssueText}
                  onChange={e => setDisputeIssueText(e.target.value)}
                  placeholder="Provide details so our Admin Governance desk can investigate and resolve..."
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDisputeBookingTarget(null)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold cursor-pointer"
                >
                  Submit to Admin Desk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GST TAX INVOICE MODAL */}
      <InvoiceModal
        isOpen={Boolean(invoiceBooking)}
        onClose={() => setInvoiceBooking(null)}
        booking={invoiceBooking}
        mode="customer"
      />

      {/* Delete Account Modal */}
      {user && (
        <DeleteAccountModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          userId={user.id}
          userEmail={user.email || ''}
          userRole="customer"
          onAccountDeleted={async () => {
            onSignOut();
            navigate('/');
          }}
        />
      )}
    </div>
  );
};
