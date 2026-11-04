import React, { useState } from 'react';
import {
  X,
  User,
  Phone,
  Calendar,
  FileCheck,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Info
} from 'lucide-react';
import { UserProfile } from '../types.ts';

interface OnboardingWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onComplete: (onboardingData: {
    phone: string;
    dob: string;
    gender: string;
    licence_number: string;
    licence_expiry: string;
    aadhaar_number: string;
    role: 'renter' | 'lender';
  }) => Promise<void>;
}

export const OnboardingWizardModal: React.FC<OnboardingWizardModalProps> = ({
  isOpen,
  onClose,
  user,
  onComplete,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form states
  const [phone, setPhone] = useState(user?.phone || '');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [licenceNumber, setLicenceNumber] = useState('');
  const [licenceExpiry, setLicenceExpiry] = useState('');
  const [licenceState, setLicenceState] = useState('Maharashtra');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [digiLockerConsent, setDigiLockerConsent] = useState(true);
  const [primaryRole, setPrimaryRole] = useState<'renter' | 'lender'>('renter');

  // Errors state
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validateStep = (currentStep: number) => {
    const errs: Record<string, string> = {};
    if (currentStep === 1) {
      if (!phone.trim()) {
        errs.phone = 'Mobile phone number is required';
      } else if (!/^\+?([0-9\s-]{10,14})$/.test(phone.replace(/\s+/g, ''))) {
        errs.phone = 'Enter a valid phone number (e.g. 9876543210)';
      }
      if (!dob) {
        errs.dob = 'Date of birth is required';
      } else {
        const birthDate = new Date(dob);
        const age = new Date().getFullYear() - birthDate.getFullYear();
        if (age < 21) {
          errs.dob = 'You must be at least 21 years old to rent a car';
        }
      }
    } else if (currentStep === 2) {
      if (!licenceNumber.trim()) {
        errs.licenceNumber = 'Driving licence number is required';
      } else if (licenceNumber.trim().length < 10) {
        errs.licenceNumber = 'Enter a valid Indian driving licence number';
      }
      if (!licenceExpiry) {
        errs.licenceExpiry = 'Licence expiry date is required';
      } else {
        const expiryDate = new Date(licenceExpiry);
        if (expiryDate <= new Date()) {
          errs.licenceExpiry = 'Your driving licence has expired';
        }
      }
    } else if (currentStep === 3) {
      const cleanAadhaar = aadhaarNumber.replace(/\s+/g, '');
      if (!cleanAadhaar) {
        errs.aadhaarNumber = 'Aadhaar number is required';
      } else if (cleanAadhaar.length !== 12 || !/^\d+$/.test(cleanAadhaar)) {
        errs.aadhaarNumber = 'Aadhaar must be exactly 12 numeric digits';
      }
      if (!digiLockerConsent) {
        errs.digiLockerConsent = 'You must consent to DigiLocker verification';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => (prev + 1) as any);
    }
  };

  const handleBack = () => {
    setStep((prev) => (prev - 1) as any);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onComplete({
        phone: phone.trim(),
        dob,
        gender,
        licence_number: licenceNumber.trim().toUpperCase(),
        licence_expiry: licenceExpiry,
        aadhaar_number: aadhaarNumber.replace(/\s+/g, ''),
        role: primaryRole,
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setStep(1);
      }, 3000);
    } catch (err) {
      console.error(err);
      setErrors({ submit: 'Failed to save information to database. Please check connection.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format Aadhaar in groups of 4: 1234 5678 9012
  const handleAadhaarChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 12);
    const formatted = clean.replace(/(\d{4})(?=\d)/g, '$1 ');
    setAadhaarNumber(formatted);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs transition-all duration-300">
      <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 text-neutral-900 dark:text-white transition-colors">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-950/80 transition-colors">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-orange-600 text-white shadow-2xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-neutral-900 dark:text-white text-base tracking-tight">
                Profile Verification & Signup Wizard
              </h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Required for self-drive verification on public roads
              </p>
            </div>
          </div>
          {!success && (
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Progress Dots */}
        {!success && (
          <div className="bg-orange-50/50 dark:bg-orange-950/10 border-b border-orange-100/60 dark:border-orange-900/20 px-6 py-2.5 flex items-center justify-between text-xs transition-colors">
            <div className="flex items-center space-x-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step >= 1 ? 'bg-orange-600 text-white' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'
              }`}>1</span>
              <span className={`font-bold ${step === 1 ? 'text-orange-900 dark:text-orange-300' : 'text-neutral-400'}`}>Personal</span>
            </div>
            <div className="h-0.5 w-6 bg-neutral-200 dark:bg-neutral-800 flex-1 mx-2" />
            <div className="flex items-center space-x-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step >= 2 ? 'bg-orange-600 text-white' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'
              }`}>2</span>
              <span className={`font-bold ${step === 2 ? 'text-orange-900 dark:text-orange-300' : 'text-neutral-400'}`}>Licence</span>
            </div>
            <div className="h-0.5 w-6 bg-neutral-200 dark:bg-neutral-800 flex-1 mx-2" />
            <div className="flex items-center space-x-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step >= 3 ? 'bg-orange-600 text-white' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'
              }`}>3</span>
              <span className={`font-bold ${step === 3 ? 'text-orange-900 dark:text-orange-300' : 'text-neutral-400'}`}>KYC</span>
            </div>
            <div className="h-0.5 w-6 bg-neutral-200 dark:bg-neutral-800 flex-1 mx-2" />
            <div className="flex items-center space-x-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step >= 4 ? 'bg-orange-600 text-white' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'
              }`}>4</span>
              <span className={`font-bold ${step === 4 ? 'text-orange-900 dark:text-orange-300' : 'text-neutral-400'}`}>Confirm</span>
            </div>
          </div>
        )}

        {/* Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-colors">
          {success ? (
            <div className="text-center py-8 space-y-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border-2 border-emerald-200 dark:border-emerald-850">
                <CheckCircle2 className="w-10 h-10 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-black text-neutral-900 dark:text-white">Profile Verified & Registered!</h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
                  Aadhaar KYC matching complete. Driving details synced with Transport Ministry record. Redirecting to checkout...
                </p>
              </div>
              <div className="p-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-850 rounded-2xl flex items-center justify-center space-x-2 text-xs text-neutral-600 dark:text-neutral-300 font-medium">
                <Sparkles className="w-4 h-4 text-orange-500 shrink-0" />
                <span>Renter privileges activated for {user?.name || 'User'}</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.submit && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 rounded-xl flex items-center space-x-2">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>{errors.submit}</span>
                </div>
              )}

              {/* STEP 1: Personal info */}
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="bg-orange-50/70 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 p-3.5 rounded-2xl flex items-start space-x-2.5 text-xs text-orange-950 dark:text-orange-200 transition-colors">
                    <User className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
                    <p>
                      Welcome, <strong className="font-bold">{user?.name}</strong>! Let's verify your identity and driving status to enable instant peer-to-peer bookings.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      disabled
                      value={user?.name || ''}
                      className="w-full border border-neutral-200 dark:border-neutral-800 rounded-xl p-2.5 text-xs font-semibold bg-neutral-50 dark:bg-neutral-950 text-neutral-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      disabled
                      value={user?.email || ''}
                      className="w-full border border-neutral-200 dark:border-neutral-800 rounded-xl p-2.5 text-xs font-semibold bg-neutral-50 dark:bg-neutral-950 text-neutral-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      Mobile Number (+91) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 font-bold">
                        +91
                      </span>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className={`w-full border ${errors.phone ? 'border-red-500 focus:border-red-500' : 'border-neutral-200 dark:border-neutral-800 focus:border-orange-500'} rounded-xl pl-11 pr-3 py-2.5 text-xs font-semibold focus:outline-none bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100`}
                        placeholder="9876543210"
                      />
                    </div>
                    {errors.phone && <p className="text-[10px] text-red-500 font-medium mt-1">{errors.phone}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                        Date of Birth *
                      </label>
                      <input
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className={`w-full border ${errors.dob ? 'border-red-500 focus:border-red-500' : 'border-neutral-200 dark:border-neutral-800 focus:border-orange-500'} rounded-xl p-2.5 text-xs font-semibold focus:outline-none bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100`}
                      />
                      {errors.dob ? (
                        <p className="text-[10px] text-red-500 font-medium mt-1">{errors.dob}</p>
                      ) : (
                        <p className="text-[9px] text-neutral-400 mt-0.5">Must be 21+ years old</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                        Gender
                      </label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full border border-neutral-200 dark:border-neutral-800 rounded-xl p-2.5 text-xs font-semibold focus:outline-none bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 cursor-pointer"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 transition-colors cursor-pointer"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Driving licence */}
              {step === 2 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/80 p-3.5 rounded-2xl flex items-start space-x-2.5 text-xs text-emerald-900 dark:text-emerald-300 transition-colors">
                    <FileCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <p>
                      To guarantee safe transit, peer-to-peer vehicles require validated driving details registered under Indian licensing rules.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      Indian Driving Licence Number *
                    </label>
                    <input
                      type="text"
                      value={licenceNumber}
                      onChange={(e) => setLicenceNumber(e.target.value)}
                      className={`w-full border ${errors.licenceNumber ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-800'} rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-orange-500 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white uppercase`}
                      placeholder="e.g. MH-1220190012345"
                    />
                    {errors.licenceNumber ? (
                      <p className="text-[10px] text-red-500 font-medium mt-1">{errors.licenceNumber}</p>
                    ) : (
                      <p className="text-[9px] text-neutral-400 mt-0.5">Enter format MH-12YYYYNNNNNNN</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                        Expiry Date *
                      </label>
                      <input
                        type="date"
                        value={licenceExpiry}
                        onChange={(e) => setLicenceExpiry(e.target.value)}
                        className={`w-full border ${errors.licenceExpiry ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-800'} rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-orange-500 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white`}
                      />
                      {errors.licenceExpiry && <p className="text-[10px] text-red-500 font-medium mt-1">{errors.licenceExpiry}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                        State of Issue
                      </label>
                      <select
                        value={licenceState}
                        onChange={(e) => setLicenceState(e.target.value)}
                        className="w-full border border-neutral-200 dark:border-neutral-800 rounded-xl p-2.5 text-xs font-semibold focus:outline-none bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white cursor-pointer"
                      >
                        <option value="Maharashtra">Maharashtra</option>
                        <option value="Karnataka">Karnataka</option>
                        <option value="Delhi">Delhi</option>
                        <option value="Goa">Goa</option>
                        <option value="Gujarat">Gujarat</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-between pt-2">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="px-4 py-2.5 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 transition-colors cursor-pointer"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Identity info (Aadhaar / DigiLocker) */}
              {step === 3 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="bg-orange-50/70 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 p-3.5 rounded-2xl flex items-start space-x-2.5 text-xs text-orange-950 dark:text-orange-200 transition-colors">
                    <ShieldCheck className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
                    <p>
                      Government guidelines require a verified proof of identity (Aadhaar) to cross check license credentials in real-time.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      12-Digit Aadhaar Number *
                    </label>
                    <input
                      type="text"
                      value={aadhaarNumber}
                      onChange={(e) => handleAadhaarChange(e.target.value)}
                      className={`w-full border ${errors.aadhaarNumber ? 'border-red-500 focus:border-red-500' : 'border-neutral-200 dark:border-neutral-800 focus:border-orange-500'} rounded-xl p-2.5 text-xs font-semibold focus:outline-none bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white`}
                      placeholder="e.g. 5234 1234 5678"
                    />
                    {errors.aadhaarNumber && <p className="text-[10px] text-red-500 font-medium mt-1">{errors.aadhaarNumber}</p>}
                  </div>

                  <div className="p-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-850 rounded-xl space-y-2.5 text-xs">
                    <label className="flex items-start space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={digiLockerConsent}
                        onChange={(e) => setDigiLockerConsent(e.target.checked)}
                        className="mt-1 accent-orange-600"
                      />
                      <span className="text-[11px] text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed">
                        I hereby consent to Charvi Rental fetching my validated LMV Driving Licence from DigiLocker & Ministry of Road Transport (mParivahan) archives.
                      </span>
                    </label>
                    {errors.digiLockerConsent && <p className="text-[10px] text-red-500 font-medium">{errors.digiLockerConsent}</p>}
                  </div>

                  <div className="flex justify-between pt-2">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="px-4 py-2.5 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 transition-colors cursor-pointer"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: Review and Submit */}
              {step === 4 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-4 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 rounded-2xl text-xs space-y-3">
                    <h5 className="font-bold text-neutral-900 dark:text-white uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-800 pb-1.5">
                      Information Summary
                    </h5>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-neutral-400 block">PHONE NUMBER</span>
                        <span className="font-bold text-neutral-800 dark:text-neutral-200">+91 {phone}</span>
                      </div>
                      <div>
                        <span className="text-neutral-400 block">DATE OF BIRTH</span>
                        <span className="font-bold text-neutral-800 dark:text-neutral-200">{dob}</span>
                      </div>
                      <div>
                        <span className="text-neutral-400 block">DRIVING LICENCE</span>
                        <span className="font-bold text-neutral-800 dark:text-neutral-200 uppercase">{licenceNumber}</span>
                      </div>
                      <div>
                        <span className="text-neutral-400 block">LICENCE EXPIRY</span>
                        <span className="font-bold text-neutral-800 dark:text-neutral-200">{licenceExpiry}</span>
                      </div>
                      <div className="col-span-2 pt-1 border-t border-neutral-200 dark:border-neutral-800">
                        <span className="text-neutral-400 block">AADHAAR NUMBER</span>
                        <span className="font-bold text-neutral-800 dark:text-neutral-200">{aadhaarNumber}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                      What do you want to do first?
                    </label>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div
                        onClick={() => setPrimaryRole('renter')}
                        className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                          primaryRole === 'renter'
                            ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-500 text-orange-950 dark:text-orange-200 font-bold'
                            : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900'
                        }`}
                      >
                        Rent Peer Cars
                      </div>
                      <div
                        onClick={() => setPrimaryRole('lender')}
                        className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                          primaryRole === 'lender'
                            ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-500 text-orange-950 dark:text-orange-200 font-bold'
                            : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900'
                        }`}
                      >
                        Rent & Host My Cars
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-neutral-400 text-center leading-normal">
                    By clicking "Complete Verification", you agree to Charvi Rental driver lease agreements and confirm that all above information matches your official transport ministry records.
                  </p>

                  <div className="flex justify-between pt-2">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="px-4 py-2.5 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center space-x-1"
                    >
                      <span>{isSubmitting ? 'Syncing...' : 'Complete Verification'}</span>
                      <ArrowRight className="w-4 h-4" />
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
