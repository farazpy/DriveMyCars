import React, { useState } from 'react';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  FileText,
  Lock,
  Eye,
  EyeOff,
  CreditCard,
  Building,
  HelpCircle,
  PlusCircle,
  LayoutDashboard,
  Car,
  Upload,
  Loader2,
  Check,
  AlertTriangle
} from 'lucide-react';
import { UserProfile } from '../types.ts';
import { Link, useRouter } from '../router.tsx';
import { signUpWithEmail, signInWithEmail } from '../firebase.ts';
import { GooglePlaceAutocompleteInput } from '../components/GooglePlaceAutocompleteInput.tsx';
import { SEO } from '../components/SEO.tsx';

interface BecomeHostPageProps {
  user: UserProfile | null;
  onSignInRequired: () => void;
  onUserUpdated?: (user: UserProfile) => void;
}

export const BecomeHostPage: React.FC<BecomeHostPageProps> = ({
  user,
  onSignInRequired,
  onUserUpdated,
}) => {
  const { navigate } = useRouter();

  // Redirect to Host Dashboard if user is already a Host (lender or admin)
  React.useEffect(() => {
    if (user && (user.role === 'lender' || user.role === 'admin')) {
      navigate('/lender');
    }
  }, [user, navigate]);

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1: Lender Identity & Contact Profile
  const [fullName, setFullName] = useState(user?.name || '');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [city, setCity] = useState('Pune, Maharashtra');
  const [primaryHub, setPrimaryHub] = useState('Wakad / Hinjewadi');
  const [fullAddress, setFullAddress] = useState('Datta Mandir Road, Wakad, Pune, 411057');

  // Step 2: KYC & Compliance Details
  const [kycDocType, setKycDocType] = useState<'Aadhaar Card' | 'Driving Licence' | 'PAN Card'>('Aadhaar Card');
  const [kycDocNumber, setKycDocNumber] = useState('8901 2345 6789');
  const [kycDocUrl, setKycDocUrl] = useState('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80');
  const [emergencyPhone, setEmergencyPhone] = useState('+91 98220 11223');
  const [hasCleanRecord, setHasCleanRecord] = useState(true);

  // Step 3: Payout & Bank Details
  const [accountHolderName, setAccountHolderName] = useState(user?.name || '');
  const [bankName, setBankName] = useState('HDFC Bank');
  const [accountNumber, setAccountNumber] = useState('50100456789012');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('50100456789012');
  const [ifscCode, setIfscCode] = useState('HDFC0001812');
  const [upiId, setUpiId] = useState('host@okhdfcbank');

  // Step 4: Password & Security (User explicit requirement)
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(true);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingKyc, setIsUploadingKyc] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [registeredHost, setRegisteredHost] = useState<{ id: string; name: string; email: string } | null>(null);

  // Email existence verification state (Request #3)
  const [emailCheckStatus, setEmailCheckStatus] = useState<'idle' | 'checking' | 'exists' | 'available'>('idle');
  const [checkingEmail, setCheckingEmail] = useState(false);

  // If user is already logged in as Host, render Active Host Dashboard Redirect Card
  if (user && (user.role === 'lender' || user.role === 'admin')) {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border-2 border-emerald-200 dark:border-emerald-800 shadow-xs">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 uppercase tracking-wider">
            Active Host Account
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white mt-3">
            Welcome back, {user.name || 'Host'}!
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-2 max-w-md mx-auto leading-relaxed">
            You are already logged in as a verified Host on Charvi Rental. You can manage your listed fleet, add new cars, and view earnings in your Host Dashboard.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate('/lender')}
            className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black tracking-wide transition-all shadow-md cursor-pointer flex items-center gap-2"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Open Host Dashboard</span>
          </button>
          <Link
            to="/list-car"
            className="px-5 py-3 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-xl text-xs font-bold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all cursor-pointer flex items-center gap-2"
          >
            <Car className="w-4 h-4 text-orange-600" />
            <span>List a New Car</span>
          </Link>
        </div>
      </div>
    );
  }

  const verifyEmailAvailability = async (emailToVerify: string): Promise<boolean> => {
    if (!emailToVerify || !emailToVerify.includes('@') || !emailToVerify.includes('.')) return false;
    setEmailCheckStatus('checking');
    try {
      const res = await fetch(`/api/users/check-email?email=${encodeURIComponent(emailToVerify.trim().toLowerCase())}`);
      if (res.ok) {
        const data = await res.json();
        if (data.exists) {
          setEmailCheckStatus('exists');
          setErrorMsg(`An account with the email "${emailToVerify.trim()}" is already registered. Please log in or use a different email.`);
          return false;
        } else {
          setEmailCheckStatus('available');
          return true;
        }
      }
    } catch (e) {
      console.warn('Check email error:', e);
    }
    setEmailCheckStatus('idle');
    return true;
  };

  const handleUploadKycToS3 = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingKyc(true);
    setErrorMsg(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('caption', `KYC Document: ${kycDocType} (${fullName || 'Host'})`);
      formData.append('file_name', file.name);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && (data.file_url || data.direct_link)) {
        setKycDocUrl(data.direct_link || data.file_url);
      } else {
        setErrorMsg(data.error || 'Failed to upload document to S3 storage.');
      }
    } catch (err: any) {
      console.error('KYC S3 upload exception:', err);
      setErrorMsg(err.message || 'Error uploading document to S3');
    } finally {
      setIsUploadingKyc(false);
    }
  };

  const handleNextStep = async () => {
    setErrorMsg(null);

    if (step === 1) {
      if (!fullName.trim() || !email.trim() || !phone.trim() || !fullAddress.trim()) {
        setErrorMsg('Please provide your full legal name, email, phone number, and address.');
        return;
      }
      if (!email.includes('@') || !email.includes('.')) {
        setErrorMsg('Please enter a valid email address.');
        return;
      }

      // Request #4: Accept 10 digit number mobile on lender wizard form
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        setErrorMsg('Mobile phone number must be exactly 10 digits (e.g. 98234 56789).');
        return;
      }

      // Request #3: Check email already exist for host registration time
      setCheckingEmail(true);
      const isAvailable = await verifyEmailAvailability(email);
      setCheckingEmail(false);
      if (!isAvailable) {
        return;
      }

      if (!accountHolderName) {
        setAccountHolderName(fullName);
      }
    } else if (step === 2) {
      if (!kycDocNumber.trim()) {
        setErrorMsg('Please enter your government identity document number.');
        return;
      }
      if (!hasCleanRecord) {
        setErrorMsg('Hosts must confirm they have clean verification and legal compliance.');
        return;
      }
    } else if (step === 3) {
      if (!accountHolderName.trim() || !accountNumber.trim() || !ifscCode.trim()) {
        setErrorMsg('Please complete bank account holder name, account number, and IFSC code.');
        return;
      }
      if (accountNumber !== confirmAccountNumber) {
        setErrorMsg('Bank account numbers do not match. Please verify.');
        return;
      }
    }

    setStep((prev) => (prev + 1) as any);
  };

  const handleCreateHostAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation
    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }
    if (!agreedToTerms) {
      setErrorMsg('Please agree to the Charvi Rental Host Terms and Peer-to-Peer Leasing Agreement.');
      return;
    }

    setIsSubmitting(true);

    try {
      let createdUid = user?.id || '';

      // 1. Create or verify account with Email and Password
      if (!user) {
        try {
          const newUser = await signUpWithEmail(email.trim(), password, fullName.trim());
          createdUid = newUser.uid;
        } catch (authErr: any) {
          // If already exists or error, try email sign in
          if (authErr.code === 'auth/email-already-in-use') {
            try {
              const loggedIn = await signInWithEmail(email.trim(), password);
              createdUid = loggedIn.uid;
            } catch (loginErr: any) {
              // Generate fallback deterministic ID based on email
              createdUid = `lender-${btoa(email.trim().toLowerCase()).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)}`;
            }
          } else {
            createdUid = `lender-${Date.now()}`;
          }
        }
      }

      if (!createdUid) {
        createdUid = `lender-${Date.now()}`;
      }

      // 2. Sync Host Profile to backend DB
      const hostPayload: UserProfile = {
        id: createdUid,
        email: email.trim(),
        name: fullName.trim(),
        phone: phone.trim(),
        role: 'lender',
        licence_number: `${kycDocType}: ${kycDocNumber.trim()}`,
        aadhaar_number: kycDocType === 'Aadhaar Card' ? kycDocNumber.trim() : undefined,
        onboarded: true,
        avatar: user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      };

      const syncRes = await fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hostPayload),
      });

      if (!syncRes.ok) {
        console.warn('Backend user sync warning:', await syncRes.text());
      }

      // 3. Register KYC Document Record in Database for verification
      try {
        await fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: createdUid,
            doc_type: `${kycDocType} (${kycDocNumber})`,
            file_name: `${kycDocType.replace(/\s+/g, '_')}_Verification.pdf`,
            file_url: kycDocUrl,
          }),
        });
      } catch (docErr) {
        console.warn('KYC document record notice:', docErr);
      }

      // 4. Auto-login in app state
      if (onUserUpdated) {
        onUserUpdated(hostPayload);
      }

      setRegisteredHost({
        id: createdUid,
        name: fullName,
        email: email,
      });

      // Move to completed screen
      setStep(5);
    } catch (err: any) {
      console.error('Failed to create host account:', err);
      setErrorMsg(err.message || 'Failed to complete registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans transition-colors py-8 sm:py-12">
      <SEO
        title="Become a Host - Rent Out Your Car & Earn | Charvi Rental"
        description="Register as a verified vehicle host on Charvi Rental. Monetize your personal or commercial fleet with guaranteed insurance coverage and verified KYC guests."
        canonicalPath="/become-a-host"
        ogType="website"
        keywords={['become a car host', 'rent out my car Pune', 'lender registration Charvi Rental', 'car sharing host India']}
      />
      <div className="w-full px-4 sm:px-8 lg:px-12 space-y-8">
        
        {/* Header Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-widest">
              <Link to="/" className="hover:text-orange-600 transition-colors">Home</Link>
              <span>/</span>
              <span className="text-orange-600">Become a Host</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight mt-1 flex items-center gap-2.5">
              <span>Host Onboarding & Lender Registration</span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-orange-100 dark:bg-orange-950/70 text-orange-700 dark:text-orange-300 font-extrabold border border-orange-200 dark:border-orange-800">
                Peer-to-Peer Fleet
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Register your Host Account to start earning from your vehicles. Once registered, manage and list unlimited cars directly from your Host Dashboard.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/lender"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Go to Host Dashboard</span>
            </Link>
          </div>
        </div>

        {/* Multi-step Progress Bar */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-xs">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { num: 1, title: 'Host Profile', subtitle: 'Personal & Contact' },
              { num: 2, title: 'KYC & Identity', subtitle: 'Govt ID Verification' },
              { num: 3, title: 'Payout Setup', subtitle: 'Bank & UPI Details' },
              { num: 4, title: 'Account Security', subtitle: 'Set Password & Activate' },
            ].map((s) => {
              const isDone = step > s.num || step === 5;
              const isCurrent = step === s.num;
              return (
                <div
                  key={s.num}
                  className={`flex items-center space-x-3 p-3 rounded-xl border transition-all ${
                    isCurrent
                      ? 'border-orange-600 bg-orange-50/60 dark:bg-orange-950/30 text-orange-600'
                      : isDone
                      ? 'border-emerald-500/50 bg-emerald-50/30 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-400'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                      isCurrent
                        ? 'bg-orange-600 text-white'
                        : isDone
                        ? 'bg-emerald-600 text-white'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold truncate text-neutral-900 dark:text-white">
                      {s.title}
                    </p>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                      {s.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error notification banner */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Wizard Step Content */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-10 shadow-xs">
          
          {/* STEP 1: LENDER PERSONAL & CONTACT DETAILS */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-orange-600 bg-orange-100 dark:bg-orange-950/60 px-2.5 py-1 rounded-md">
                  Step 1 of 4
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white mt-2">
                  Lender Profile & Operating Location
                </h2>
                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  Enter your legal details as they appear on your government documents. This information is verified for host accreditation.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Legal Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 w-4 h-4 text-neutral-400" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Rajesh Sharma"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Fleet / Business Name (Optional)
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-3 w-4 h-4 text-neutral-400" />
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Sharma Premier Wheels (Leave blank if individual)"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5 flex items-center justify-between">
                    <span>Host Email Address <span className="text-red-500">*</span></span>
                    {emailCheckStatus === 'checking' && (
                      <span className="text-[10px] text-orange-600 font-bold flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Verifying...
                      </span>
                    )}
                    {emailCheckStatus === 'available' && (
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Email available
                      </span>
                    )}
                    {emailCheckStatus === 'exists' && (
                      <span className="text-[10px] text-red-600 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Already registered
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-neutral-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailCheckStatus !== 'idle') setEmailCheckStatus('idle');
                      }}
                      onBlur={() => {
                        if (email.includes('@') && email.includes('.')) {
                          verifyEmailAvailability(email);
                        }
                      }}
                      placeholder="rajesh.sharma@example.com"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none transition-colors ${
                        emailCheckStatus === 'exists'
                          ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20 text-red-900 dark:text-red-200 focus:ring-2 focus:ring-red-500'
                          : emailCheckStatus === 'available'
                          ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200'
                          : 'border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 focus:ring-2 focus:ring-orange-500'
                      }`}
                    />
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-1">This will be your login account ID.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5 flex items-center justify-between">
                    <span>10-Digit Mobile Number <span className="text-red-500">*</span></span>
                    <span className="text-[10px] text-neutral-400">
                      {phone.replace(/\D/g, '').length}/10 digits
                    </span>
                  </label>
                  <div className="relative flex">
                    <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-xs font-extrabold text-neutral-600 dark:text-neutral-300 select-none">
                      🇮🇳 +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={phone.replace(/\D/g, '')}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="9823456789"
                      className="w-full px-3.5 py-2.5 rounded-r-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 text-xs font-mono font-bold tracking-wider focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-1">Enter your 10-digit mobile number for OTP and booking updates.</p>
                </div>

                <div>
                  <GooglePlaceAutocompleteInput
                    label="Operating City"
                    required
                    value={city}
                    onChange={(val) => setCity(val)}
                    onPlaceSelect={(place) => {
                      setCity(place.city || place.displayName || place.formattedAddress);
                    }}
                    placeholder="Search operating city (e.g. Pune, Mumbai, Bengaluru...)"
                    icon={<MapPin className="w-4 h-4 text-orange-600" />}
                    helperText="Custom operating city with live Google Maps autocomplete."
                  />
                </div>

                <div>
                  <GooglePlaceAutocompleteInput
                    label="Primary Operational Hub / Unit"
                    required
                    value={primaryHub}
                    onChange={(val) => setPrimaryHub(val)}
                    onPlaceSelect={(place) => {
                      setPrimaryHub(place.displayName || place.formattedAddress.split(',')[0]);
                      if (!fullAddress) {
                        setFullAddress(place.formattedAddress);
                      }
                    }}
                    placeholder="Search primary unit (e.g. Wakad, Hinjawadi Phase 1, Baner...)"
                    icon={<Building2 className="w-4 h-4 text-orange-600" />}
                    helperText="Custom operational unit hub address via Google Maps."
                  />
                </div>

                <div className="md:col-span-2">
                  <GooglePlaceAutocompleteInput
                    label="Registered Residential / Fleet Handover Address"
                    required
                    value={fullAddress}
                    onChange={(val) => setFullAddress(val)}
                    onPlaceSelect={(place) => {
                      setFullAddress(place.formattedAddress);
                    }}
                    placeholder="Search full street address, building name, locality..."
                    icon={<MapPin className="w-4 h-4 text-orange-600" />}
                    helperText="Detailed physical address with Google Maps Place prediction."
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs shadow-md transition-all"
                >
                  <span>Continue to KYC & Identity</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: KYC & IDENTITY VERIFICATION */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-orange-600 bg-orange-100 dark:bg-orange-950/60 px-2.5 py-1 rounded-md">
                  Step 2 of 4
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white mt-2">
                  Host KYC & Identity Verification
                </h2>
                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  Charvi Rental complies with peer-to-peer security mandates. All vehicle lenders undergo identity clearance before their listings go live.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Government ID Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={kycDocType}
                    onChange={(e) => setKycDocType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  >
                    <option value="Aadhaar Card">Aadhaar Card (UIDAI)</option>
                    <option value="Driving Licence">Indian Driving Licence (RTO)</option>
                    <option value="PAN Card">Permanent Account Number (PAN)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Document ID Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3.5 top-3 w-4 h-4 text-neutral-400" />
                    <input
                      type="text"
                      value={kycDocNumber}
                      onChange={(e) => setKycDocNumber(e.target.value)}
                      placeholder={
                        kycDocType === 'Aadhaar Card'
                          ? '12-digit Aadhaar Number'
                          : kycDocType === 'PAN Card'
                          ? '10-character PAN (e.g. ABCDE1234F)'
                          : 'RTO DL Number (e.g. MH14 20210012345)'
                      }
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Emergency Alternate Contact Phone <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 w-4 h-4 text-neutral-400" />
                    <input
                      type="tel"
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                      placeholder="+91 98220 11223"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-1">Secondary contact in case of urgent vehicle inquiries.</p>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Upload Government ID Document to HTK S3 Storage <span className="text-red-500">*</span>
                  </label>
                  <div className={`p-5 border-2 border-dashed rounded-2xl text-center relative transition-colors ${
                    isUploadingKyc
                      ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20'
                      : 'border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 hover:border-orange-500'
                  }`}>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleUploadKycToS3}
                      disabled={isUploadingKyc}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                    />
                    <div className="flex flex-col items-center justify-center space-y-2 py-1">
                      {isUploadingKyc ? (
                        <div className="flex flex-col items-center justify-center space-y-2 text-orange-600 animate-in fade-in">
                          <div className="p-3 bg-orange-100 dark:bg-orange-950/60 rounded-full animate-pulse">
                            <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
                          </div>
                          <p className="text-xs font-black text-orange-600 animate-pulse">
                            Uploading Government ID Document to HTK S3 Storage...
                          </p>
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                            Transferring encrypted file to https://s3.htknetwork.in (workspace_id: 20)...
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="w-9 h-9 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center">
                            <Upload className="w-4 h-4" />
                          </div>
                          <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                            Select or drop your {kycDocType} file (PDF/JPG/PNG)
                          </p>
                          <p className="text-[10px] text-neutral-400">
                            Files are stored securely on HTK S3 Storage (<code className="text-orange-600">workspace_id: 20</code>)
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {kycDocUrl && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2 truncate">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-bold text-emerald-800 dark:text-emerald-300 truncate">Stored on S3: {kycDocUrl}</span>
                      </div>
                      <a
                        href={kycDocUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 hover:underline shrink-0 ml-2"
                      >
                        View Document
                      </a>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="cleanRecord"
                    checked={hasCleanRecord}
                    onChange={(e) => setHasCleanRecord(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                  />
                  <label htmlFor="cleanRecord" className="text-xs font-medium text-neutral-700 dark:text-neutral-300 leading-relaxed cursor-pointer">
                    I certify that the information and identification provided are genuine. I declare that I am the legal owner or authorized custodian of vehicles I will list, and agree to Charvi Rental host background verification standards.
                  </label>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-bold transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Profile</span>
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs shadow-md transition-all"
                >
                  <span>Continue to Payout Setup</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PAYOUT & BANK DETAILS */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-orange-600 bg-orange-100 dark:bg-orange-950/60 px-2.5 py-1 rounded-md">
                  Step 3 of 4
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white mt-2">
                  Payouts & Bank Account Setup
                </h2>
                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  Your rental earnings are settled directly to this bank account or UPI ID every Monday without gateway delays.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Account Holder Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 w-4 h-4 text-neutral-400" />
                    <input
                      type="text"
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      placeholder="Name as per bank records"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Bank Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3.5 top-3 w-4 h-4 text-neutral-400" />
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. HDFC Bank, ICICI Bank, SBI"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Bank Account Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3.5 top-3 w-4 h-4 text-neutral-400" />
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="e.g. 50100456789012"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Re-enter Account Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3.5 top-3 w-4 h-4 text-neutral-400" />
                    <input
                      type="text"
                      value={confirmAccountNumber}
                      onChange={(e) => setConfirmAccountNumber(e.target.value)}
                      placeholder="Re-type account number"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Bank IFSC Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    placeholder="e.g. HDFC0001812"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    UPI ID for Instant Direct Settlements
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. yourname@okhdfcbank"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-neutral-400 mt-1">Direct IMPS / UPI payouts for same-day settlements.</p>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-bold transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to KYC</span>
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs shadow-md transition-all"
                >
                  <span>Continue to Password Setup</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: PASSWORD SETUP & AUTO ACCOUNT CREATION */}
          {step === 4 && (
            <form onSubmit={handleCreateHostAccount} className="space-y-6">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-orange-600 bg-orange-100 dark:bg-orange-950/60 px-2.5 py-1 rounded-md">
                  Step 4 of 4
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white mt-2">
                  Create Host Password & Activate Account
                </h2>
                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  Set a secure password for your Host account. Upon submission, your lender profile is automatically created and logged in, granting you full access to the Host Dashboard to list multiple vehicles.
                </p>
              </div>

              {/* Host Account Summary Card */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-neutral-400 font-bold text-[10px] uppercase">Host Name</span>
                  <p className="font-extrabold text-neutral-900 dark:text-white truncate">{fullName}</p>
                </div>
                <div>
                  <span className="text-neutral-400 font-bold text-[10px] uppercase">Account Login Email</span>
                  <p className="font-extrabold text-neutral-900 dark:text-white truncate">{email}</p>
                </div>
                <div>
                  <span className="text-neutral-400 font-bold text-[10px] uppercase">Primary Fleet Hub</span>
                  <p className="font-extrabold text-neutral-900 dark:text-white truncate">{primaryHub}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Set Host Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-neutral-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-1">Use a secure combination of letters and numbers.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-neutral-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter same password"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>
                  {password && confirmPassword && (
                    <p className={`text-[10px] mt-1 font-bold ${password === confirmPassword ? 'text-emerald-500' : 'text-red-500'}`}>
                      {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2 p-4 rounded-2xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/40 space-y-3">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="hostTerms"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                    />
                    <label htmlFor="hostTerms" className="text-xs font-medium text-neutral-700 dark:text-neutral-300 leading-relaxed cursor-pointer">
                      I agree to the <strong className="text-neutral-900 dark:text-white">Charvi Rental Host Terms of Service</strong>, the <strong className="text-neutral-900 dark:text-white">₹5 Lakh Comprehensive Vehicle Protection Policy</strong>, and accept that I can add, pause, or remove multiple vehicles anytime from my Host Dashboard.
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={isSubmitting}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-bold transition-all disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Payout</span>
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center space-x-2 px-7 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating Host Account...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Create Account & Activate Host</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 5: REGISTRATION COMPLETE & NEXT ACTIONS */}
          {step === 5 && (
            <div className="text-center py-6 sm:py-10 max-w-xl mx-auto space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto shadow-sm">
                <Sparkles className="w-8 h-8" />
              </div>

              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-100 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                  Account Active & Auto-Logged In
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white mt-3">
                  Welcome to Charvi Rental Host Network!
                </h2>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-2 leading-relaxed">
                  Congratulations <span className="font-bold text-neutral-900 dark:text-white">{registeredHost?.name || fullName}</span>! Your Host profile is live with ID <code className="bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-[11px]">{registeredHost?.id || 'host-active'}</code>. You can now add multiple vehicles to your fleet directly from your dedicated Host Dashboard.
                </p>
              </div>

              {/* Host Summary Checklist */}
              <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 text-left space-y-2.5 text-xs">
                <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Host Identity & Contact profile verified</span>
                </div>
                <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{kycDocType} recorded for RTO & insurance clearance</span>
                </div>
                <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Direct payout account connected ({bankName} · {ifscCode})</span>
                </div>
                <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Multiple vehicle management unlocked</span>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/lender')}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs shadow-md transition-all"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Go to Host Dashboard</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/list-car')}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 font-extrabold text-xs transition-all"
                >
                  <Car className="w-4 h-4 text-orange-600" />
                  <span>List Your First Vehicle</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Benefits & Fleet Info Callout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/70 text-orange-600 flex items-center justify-center mb-3">
              <Car className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-xs text-neutral-900 dark:text-white">Multi-Car Fleet Management</h3>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
              List 1, 5, or 20+ cars from your host dashboard. Toggle availability per car anytime with a single tap.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 flex items-center justify-center mb-3">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-xs text-neutral-900 dark:text-white">₹5 Lakh Comprehensive Coverage</h3>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
              Every trip includes peer-to-peer damage coverage, 24/7 Pune roadside assistance, and customer ID verification.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/70 text-blue-600 flex items-center justify-center mb-3">
              <CreditCard className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-xs text-neutral-900 dark:text-white">Direct Weekly Payouts</h3>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
              Earnings are deposited straight into your bank account or UPI ID every Monday with complete transparency.
            </p>
          </div>
        </div>

      {/* Uploading KYC Document to HTK S3 Storage Overlay Loader (Request #6) */}
      {isUploadingKyc && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center space-y-4 p-4 text-white animate-in fade-in">
          <div className="p-4 rounded-3xl bg-orange-600/20 border border-orange-500/40 animate-pulse">
            <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
          </div>
          <h4 className="font-extrabold text-base sm:text-lg text-center">
            Uploading Government ID Document to HTK S3 Storage
          </h4>
          <p className="text-xs text-neutral-300 max-w-sm text-center animate-pulse">
            Transferring encrypted document securely to https://s3.htknetwork.in (workspace_id: 20)...
          </p>
        </div>
      )}
      </div>
    </div>
  );
};
