import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Clock,
  Car as CarIcon,
  CreditCard,
  User,
  Mail,
  Phone,
  FileCheck,
  ArrowRight,
  ArrowLeft,
  Zap,
  MapPin,
  Sparkles,
  QrCode,
  ShieldAlert,
  Download
} from 'lucide-react';
import { Car, UserProfile } from '../types.ts';
import { useRouter } from '../router.tsx';

interface BookingModalProps {
  car: Car | null;
  isOpen: boolean;
  onClose: () => void;
  pickupDate: string;
  pickupTime: string;
  dropoffDate: string;
  dropoffTime: string;
  rentalDays: number;
  user: UserProfile | null;
  onConfirmBooking: (bookingPayload: any) => Promise<any>;
  onSignInRequired: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  car,
  isOpen,
  onClose,
  pickupDate,
  pickupTime,
  dropoffDate,
  dropoffTime,
  rentalDays,
  user,
  onConfirmBooking,
  onSignInRequired,
}) => {
  const { navigate } = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [protectionPlan, setProtectionPlan] = useState<'Standard' | 'Premium'>('Standard');
  const [deliveryOption, setDeliveryOption] = useState<'hub' | 'doorstep'>('hub');
  const [phoneNumber, setPhoneNumber] = useState('+91 98765 43210');
  const [dlNumber, setDlNumber] = useState('DL-0420190012345');
  const [city, setCity] = useState(car?.city || 'Bengaluru');
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any | null>(null);

  if (!isOpen || !car) return null;

  const basePrice = car.price_per_day * rentalDays;
  const insurancePrice = protectionPlan === 'Premium' ? 499 * rentalDays : 0;
  const deliveryFee = deliveryOption === 'doorstep' ? 299 : 0;
  const serviceFee = Math.round(basePrice * 0.05); // 5% platform fee
  const totalPrice = basePrice + insurancePrice + deliveryFee + serviceFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onSignInRequired();
      return;
    }
    if (user && !user.onboarded) {
      onConfirmBooking(null).catch(() => {});
      onClose();
      return;
    }
    if (!agreedToTerms) return;

    setIsSubmitting(true);
    try {
      const result = await onConfirmBooking({
        car_id: car.id,
        car_title: car.title,
        car_image: car.image_url,
        renter_id: user.id,
        renter_name: user.name || 'Faraz',
        renter_email: user.email || '',
        lender_id: car.lender_id,
        pickup_datetime: `${pickupDate}T${pickupTime}`,
        dropoff_datetime: `${dropoffDate}T${dropoffTime}`,
        total_days: rentalDays,
        price_per_day: car.price_per_day,
        total_price: totalPrice,
        insurance_plan: protectionPlan,
      });
      setBookingSuccess(result);
    } catch (err) {
      console.error('Booking failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setBookingSuccess(null);
    setStep(1);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs transition-colors">
      <div className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 transition-colors">
        
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-950/80 transition-colors">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-orange-600 text-white shadow-2xs">
              <CarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-neutral-900 dark:text-white text-base sm:text-lg tracking-tight">
                {bookingSuccess ? 'Booking Confirmed!' : 'Reserve Self-Drive Vehicle'}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {bookingSuccess
                  ? 'Digital vehicle handover pass active'
                  : 'Zero security deposit · Instant host confirmation'}
              </p>
            </div>
          </div>
          <button
            onClick={resetAndClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar (Only when not confirmed) */}
        {!bookingSuccess && (
          <div className="bg-orange-50/50 dark:bg-orange-950/20 border-b border-orange-100 dark:border-orange-900/30 px-6 py-2.5 flex items-center justify-between text-xs transition-colors">
            <div className="flex items-center space-x-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step >= 1 ? 'bg-orange-600 text-white' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
              }`}>
                1
              </span>
              <span className={`font-bold ${step === 1 ? 'text-orange-900 dark:text-orange-300' : 'text-neutral-500'}`}>Trip & Plan</span>
            </div>
            <div className="h-0.5 w-8 bg-neutral-200 dark:bg-neutral-800" />
            <div className="flex items-center space-x-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step >= 2 ? 'bg-orange-600 text-white' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
              }`}>
                2
              </span>
              <span className={`font-bold ${step === 2 ? 'text-orange-900 dark:text-orange-300' : 'text-neutral-500'}`}>Driver & KYC</span>
            </div>
            <div className="h-0.5 w-8 bg-neutral-200 dark:bg-neutral-800" />
            <div className="flex items-center space-x-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step >= 3 ? 'bg-orange-600 text-white' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
              }`}>
                3
              </span>
              <span className={`font-bold ${step === 3 ? 'text-orange-900 dark:text-orange-300' : 'text-neutral-500'}`}>Review & Pay</span>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-colors">
          {bookingSuccess ? (
            /* SUCCESS VIEW */
            <div className="text-center py-4 space-y-5 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border-2 border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-full text-xs font-bold">
                  Verified Booking Confirmed
                </span>
                <h4 className="text-2xl font-black text-neutral-900 dark:text-white mt-2">You're All Set to Drive!</h4>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 max-w-md mx-auto">
                  Your reservation reference <strong className="font-mono text-orange-600 dark:text-orange-400 text-sm">{bookingSuccess.id}</strong> has been created and synced with host <strong>{car.lender_name}</strong>.
                </p>
              </div>

              {/* Digital Car Pass Card */}
              <div className="max-w-md mx-auto p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-left space-y-3.5 shadow-2xs transition-colors">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-850">
                  <div className="flex items-center space-x-3">
                    <img
                      src={car.image_url}
                      alt={car.title}
                      className="w-12 h-10 rounded-lg object-cover border border-neutral-200 dark:border-neutral-800"
                    />
                    <div>
                      <h5 className="font-bold text-neutral-900 dark:text-white text-xs">{car.title}</h5>
                      <span className="text-[10px] text-neutral-500 dark:text-neutral-400">{car.city}</span>
                    </div>
                  </div>
                  <div className="p-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 rounded-lg">
                    <QrCode className="w-8 h-8 text-neutral-800 dark:text-neutral-200" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-neutral-400 dark:text-neutral-500 text-[10px] block">PICK-UP</span>
                    <span className="font-bold text-neutral-800 dark:text-neutral-200">{pickupDate} ({pickupTime})</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 dark:text-neutral-500 text-[10px] block">DROP-OFF</span>
                    <span className="font-bold text-neutral-800 dark:text-neutral-200">{dropoffDate} ({dropoffTime})</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 dark:text-neutral-500 text-[10px] block">HOST</span>
                    <span className="font-bold text-neutral-800 dark:text-neutral-200">{car.lender_name}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 dark:text-neutral-500 text-[10px] block">SECURITY DEPOSIT</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">₹0 (Zero Deposit)</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-200 dark:border-neutral-850 flex justify-between items-center text-xs">
                  <span className="font-semibold text-neutral-600 dark:text-neutral-400">Total Amount Paid</span>
                  <span className="text-base font-black text-orange-600 dark:text-orange-400">₹{totalPrice.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2 max-w-md mx-auto">
                <button
                  onClick={() => {
                    resetAndClose();
                    navigate('/customer');
                  }}
                  className="flex-1 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>View in Customer Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={resetAndClose}
                  className="px-4 py-2.5 border border-neutral-200 dark:border-neutral-850 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* STEPPED FLOW FORM */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* STEP 1: TRIP DURATION & PROTECTION PLAN */}
              {step === 1 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  {/* Selected Vehicle Snippet */}
                  <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between transition-colors">
                    <div className="flex items-center space-x-3">
                      <img
                        src={car.image_url}
                        alt={car.title}
                        className="w-16 h-12 rounded-xl object-cover border border-neutral-200 dark:border-neutral-800"
                      />
                      <div>
                        <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase">{car.make} · {car.type}</span>
                        <h4 className="font-bold text-sm text-neutral-900 dark:text-white">{car.title}</h4>
                        <div className="flex items-center space-x-2 text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                          <span>₹{car.price_per_day.toLocaleString('en-IN')}/day</span>
                          <span>·</span>
                          <span>{car.seats} Seats</span>
                          <span>·</span>
                          <span>FASTag Active</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Schedule Details */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 transition-colors">
                      <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase">Pick-up Schedule</span>
                      <div className="font-bold text-xs text-neutral-800 dark:text-neutral-200 mt-0.5 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                        <span>{pickupDate} at {pickupTime}</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 transition-colors">
                      <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase">Drop-off Schedule</span>
                      <div className="font-bold text-xs text-neutral-800 dark:text-neutral-200 mt-0.5 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                        <span>{dropoffDate} at {dropoffTime}</span>
                      </div>
                    </div>
                  </div>

                  {/* Handover & Delivery Selection */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-900 dark:text-neutral-200 uppercase tracking-wider mb-2">
                      Delivery & Handover Mode
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div
                        onClick={() => setDeliveryOption('hub')}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          deliveryOption === 'hub'
                            ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-500 dark:border-orange-500 text-orange-950 dark:text-orange-200 ring-1 ring-orange-500'
                            : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-350 dark:hover:border-neutral-750 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-xs">Self Pick-up at Hub</span>
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">FREE</span>
                        </div>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                          Pick up directly at {car.location}.
                        </p>
                      </div>

                      <div
                        onClick={() => setDeliveryOption('doorstep')}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          deliveryOption === 'doorstep'
                            ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-500 dark:border-orange-500 text-orange-950 dark:text-orange-200 ring-1 ring-orange-500'
                            : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-350 dark:hover:border-neutral-750 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-xs">Doorstep / Airport Delivery</span>
                          <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400">+₹299</span>
                        </div>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                          Host brings car to your address/terminal.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Protection Plan Selection */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-900 dark:text-neutral-200 uppercase tracking-wider mb-2">
                      Protection & Insurance Package
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div
                        onClick={() => setProtectionPlan('Standard')}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          protectionPlan === 'Standard'
                            ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-500 dark:border-orange-500 text-orange-950 dark:text-orange-200 ring-1 ring-orange-500'
                            : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-350 dark:hover:border-neutral-750 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-xs">Standard Protection</span>
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">INCLUDED</span>
                        </div>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                          Zero security deposit, 24/7 Roadside Assistance, third-party liability.
                        </p>
                      </div>

                      <div
                        onClick={() => setProtectionPlan('Premium')}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          protectionPlan === 'Premium'
                            ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-500 dark:border-orange-500 text-orange-950 dark:text-orange-200 ring-1 ring-orange-500'
                            : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-350 dark:hover:border-neutral-750 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-xs">Comprehensive Shield</span>
                          <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400">+₹499/day</span>
                        </div>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                          Zero deductible, bumper-to-bumper coverage, FASTag toll reimbursement.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="w-full sm:w-auto px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
                    >
                      <span>Continue to Driver Details</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: DRIVER INFO & KYC DECLARATION */}
              {step === 2 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/80 p-3.5 rounded-2xl flex items-center space-x-3 text-xs text-emerald-900 dark:text-emerald-300 transition-colors">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>
                      Instant KYC Verification enabled via DigiLocker / Indian Transport Ministry.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                        Primary Driver Full Name
                      </label>
                      <input
                        type="text"
                        defaultValue={user?.name || 'Faraz'}
                        className="w-full border border-neutral-200 dark:border-neutral-800 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-orange-500 dark:focus:border-orange-500 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100"
                        placeholder="Name as per Driving Licence"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                        Contact Mobile Number (+91)
                      </label>
                      <input
                        type="text"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full border border-neutral-200 dark:border-neutral-800 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-orange-500 dark:focus:border-orange-500 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100"
                        placeholder="+91 98765 43210"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                        Indian Driving Licence Number
                      </label>
                      <input
                        type="text"
                        value={dlNumber}
                        onChange={(e) => setDlNumber(e.target.value)}
                        className="w-full border border-neutral-200 dark:border-neutral-800 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-orange-500 dark:focus:border-orange-500 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 uppercase"
                        placeholder="e.g. DL-0420190012345"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                        City of Residence
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full border border-neutral-200 dark:border-neutral-800 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-orange-500 dark:focus:border-orange-500 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100"
                        placeholder="e.g. Bengaluru, Mumbai, Delhi"
                      />
                    </div>
                  </div>

                  {/* Declaration Checklist */}
                  <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-2 text-xs text-neutral-700 dark:text-neutral-300 transition-colors">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Valid Indian LMV (Light Motor Vehicle) Driving Licence held for 1+ year.</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Minimum age 21 years with verified Aadhaar / DigiLocker credentials.</span>
                    </div>
                  </div>

                  <div className="flex justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-4 py-2.5 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5"
                    >
                      <span>Review Pricing & Checkout</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: PRICING BREAKDOWN & FINAL CONFIRMATION */}
              {step === 3 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  {/* Detailed Pricing Card in INR */}
                  <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 space-y-2.5 text-xs transition-colors">
                    <div className="flex justify-between">
                      <span className="text-neutral-500 dark:text-neutral-400">
                        Daily Rate (₹{car.price_per_day.toLocaleString('en-IN')} × {rentalDays} {rentalDays === 1 ? 'day' : 'days'})
                      </span>
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">₹{basePrice.toLocaleString('en-IN')}</span>
                    </div>

                    {deliveryFee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-neutral-500 dark:text-neutral-400">Doorstep Delivery & Handover</span>
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200">₹{deliveryFee.toLocaleString('en-IN')}</span>
                      </div>
                    )}

                    {insurancePrice > 0 && (
                      <div className="flex justify-between">
                        <span className="text-neutral-500 dark:text-neutral-400">Comprehensive Shield (₹499 × {rentalDays} days)</span>
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200">₹{insurancePrice.toLocaleString('en-IN')}</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="text-neutral-500 dark:text-neutral-400">Platform & Roadside Support Fee</span>
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">₹{serviceFee.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex justify-between text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-50/80 dark:bg-emerald-950/20 p-2 rounded-lg">
                      <span>Refundable Security Deposit</span>
                      <span>₹0 (Zero Deposit)</span>
                    </div>

                    <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex justify-between font-black text-sm text-neutral-900 dark:text-white">
                      <span>Total Trip Cost</span>
                      <span className="text-orange-600 dark:text-orange-400 text-base">₹{totalPrice.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Terms check */}
                  <label className="flex items-start space-x-2.5 cursor-pointer text-xs text-neutral-600 dark:text-neutral-400">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-0.5 rounded text-orange-600 focus:ring-orange-500"
                    />
                    <span>
                      I agree to the Charvi Rental self-drive rental policy, FASTag toll usage terms, and confirm all driver details are accurate.
                    </span>
                  </label>

                  {/* Auth note if not signed in */}
                  {!user && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
                      <span>Google Account required to finalize reservation.</span>
                      <button
                        type="button"
                        onClick={onSignInRequired}
                        className="px-3 py-1 bg-amber-600 text-white rounded-lg font-bold text-xs"
                      >
                        Sign In with Google
                      </button>
                    </div>
                  )}

                  <div className="flex justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-4 py-2.5 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !agreedToTerms}
                      className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl text-xs font-black tracking-wide transition-all shadow-2xs cursor-pointer flex items-center space-x-2"
                    >
                      {isSubmitting ? (
                        <span>Confirming Reservation...</span>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 fill-white" />
                          <span>Book & Confirm (₹{totalPrice.toLocaleString('en-IN')})</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
