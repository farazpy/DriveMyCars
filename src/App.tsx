import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Car as CarIcon,
  Shield,
  Sparkles,
  Zap,
  CheckCircle2,
  Clock,
  MapPin,
  ChevronRight,
  ArrowUpDown,
  Filter,
  CarTaxiFront,
  Users,
  Headphones,
  Award,
  Heart,
  Scale
} from 'lucide-react';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { HeroSearchBar } from './components/HeroSearchBar.tsx';
import { FilterDrawer } from './components/FilterDrawer.tsx';
import { CarCard } from './components/CarCard.tsx';
import { BookingModal } from './components/BookingModal.tsx';
import { ListCarModal } from './components/ListCarModal.tsx';
import { SecurityGuaranteeModal } from './components/SecurityGuaranteeModal.tsx';
import { OnboardingWizardModal } from './components/OnboardingWizardModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { CompareCarsDrawer } from './components/CompareCarsDrawer.tsx';
import { DatabaseModal } from './components/DatabaseModal.tsx';
import { Car, Booking, UserProfile, UserRole, FilterState, DbStatusInfo } from './types.ts';
import { initAuth, googleSignIn, logout, updateFirebaseConfig } from './firebase.ts';
import { RouterProvider, useRouter, Link } from './router.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { PlatformSettingsProvider } from './context/PlatformSettingsContext.tsx';
import { APIProvider } from '@vis.gl/react-google-maps';

// Dedicated Pages
import { AboutPage } from './pages/AboutPage.tsx';
import { HowItWorksPage } from './pages/HowItWorksPage.tsx';
import { InsurancePage } from './pages/InsurancePage.tsx';
import { HostLeasingPage } from './pages/HostLeasingPage.tsx';
import { BecomeHostPage } from './pages/BecomeHostPage.tsx';
import { ListCarPage } from './pages/ListCarPage.tsx';
import { ContactPage } from './pages/ContactPage.tsx';
import { CarDetailPage } from './pages/CarDetailPage.tsx';
import { LenderProfilePage } from './pages/LenderProfilePage.tsx';
import { SEO } from './components/SEO.tsx';

// Dedicated Dashboards with fixed sidebar and separate dashboard headers
import { CustomerDashboard } from './pages/CustomerDashboard.tsx';
import { LenderDashboard } from './pages/LenderDashboard.tsx';
import { AdminDashboard } from './pages/AdminDashboard.tsx';

// Helper to format ISO date to YYYY-MM-DD
const formatDate = (date: Date) => {
  return date.toISOString().split('T')[0];
};

function AppContent() {
  const { path, navigate } = useRouter();

  // Initial default dates: tomorrow and 3 days later
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const threeDaysLater = new Date();
  threeDaysLater.setDate(threeDaysLater.getDate() + 4);

  // Authentication & Roles
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('renter');

  // Data
  const [cars, setCars] = useState<Car[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<DbStatusInfo | null>(null);
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState(false);

  const fetchDbStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setDbStatus(data.db);
      }
    } catch (e) {
      console.error('Failed to fetch DB status:', e);
    }
  }, []);

  // Selected City (Default: Pune)
  const [selectedCity, setSelectedCity] = useState<string>('Pune');

  // Filters (Prices in ₹ INR)
  const [filters, setFilters] = useState<FilterState>({
    location: 'Wakad, Pune',
    pickupDate: formatDate(tomorrow),
    pickupTime: '10:00',
    dropoffDate: formatDate(threeDaysLater),
    dropoffTime: '10:00',
    type: 'All',
    transmission: 'All',
    fuel: 'All',
    minPrice: 0,
    maxPrice: 25000,
    seats: 0,
    instantBookOnly: false,
    sortBy: 'recommended',
  });

  // Active search query that triggers the database fetching
  const [searchParams, setSearchParams] = useState<FilterState>({
    location: 'Wakad, Pune',
    pickupDate: formatDate(tomorrow),
    pickupTime: '10:00',
    dropoffDate: formatDate(threeDaysLater),
    dropoffTime: '10:00',
    type: 'All',
    transmission: 'All',
    fuel: 'All',
    minPrice: 0,
    maxPrice: 25000,
    seats: 0,
    instantBookOnly: false,
    sortBy: 'recommended',
  });

  const handleSelectCity = (city: string) => {
    setSelectedCity(city);
    const newLoc = city === 'Pune' ? 'Wakad, Pune' : city;
    setFilters((prev) => ({ ...prev, location: newLoc }));
    setSearchParams((prev) => ({ ...prev, location: newLoc }));
    showNotification(`City updated to ${city}. Showing fleet availability.`);
  };

  // Modals state
  const [selectedCarForBooking, setSelectedCarForBooking] = useState<Car | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isListCarModalOpen, setIsListCarModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Saved Wishlist & Side-by-Side Comparison state
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('dmc_wishlist_ids');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [showWishlistOnly, setShowWishlistOnly] = useState(false);
  const [compareCarIds, setCompareCarIds] = useState<string[]>([]);

  // Toast
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleToggleWishlist = (car: Car) => {
    setWishlistIds((prev) => {
      const exists = prev.includes(car.id);
      const next = exists ? prev.filter((id) => id !== car.id) : [...prev, car.id];
      try {
        localStorage.setItem('dmc_wishlist_ids', JSON.stringify(next));
      } catch {
        // ignore storage quota errors
      }
      showNotification(
        exists ? `Removed "${car.title}" from Saved Wishlist.` : `Saved "${car.title}" to your Wishlist!`
      );
      return next;
    });
  };

  const handleToggleCompare = (car: Car) => {
    setCompareCarIds((prev) => {
      if (prev.includes(car.id)) {
        return prev.filter((id) => id !== car.id);
      }
      if (prev.length >= 3) {
        showNotification('You can compare up to 3 vehicles side-by-side at once.');
        return prev;
      }
      showNotification(`Added "${car.title}" to comparison dock.`);
      return [...prev, car.id];
    });
  };

  // Fetch Cars with active filters
  const fetchCars = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchParams.pickupDate && searchParams.dropoffDate) {
        params.append('pickup', `${searchParams.pickupDate}T${searchParams.pickupTime}`);
        params.append('dropoff', `${searchParams.dropoffDate}T${searchParams.dropoffTime}`);
      }
      if (searchParams.location) params.append('location', searchParams.location);
      if (searchParams.type && searchParams.type !== 'All') params.append('type', searchParams.type);
      if (searchParams.transmission && searchParams.transmission !== 'All') params.append('transmission', searchParams.transmission);
      if (searchParams.fuel && searchParams.fuel !== 'All') params.append('fuel', searchParams.fuel);
      if (searchParams.seats > 0) params.append('seats', searchParams.seats.toString());
      if (searchParams.maxPrice < 25000) params.append('maxPrice', searchParams.maxPrice.toString());
      if (searchParams.instantBookOnly) params.append('instantBook', 'true');

      const res = await fetch(`/api/cars?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCars(data);
      }
    } catch (e) {
      console.error('Failed to fetch cars:', e);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchDbStatus();
  }, [fetchDbStatus]);

  // Fetch Bookings
  const fetchBookings = useCallback(async () => {
    if (!user) return;
    try {
      const params = new URLSearchParams();
      if (currentRole === 'renter') {
        params.append('renter_id', user.id);
      } else {
        params.append('lender_id', user.id);
      }
      const res = await fetch(`/api/bookings?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (e) {
      console.error('Failed to fetch bookings:', e);
    }
  }, [user, currentRole]);

  const syncAndLoadUser = async (baseProfile: UserProfile) => {
    try {
      const res = await fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(baseProfile),
      });
      if (res.ok) {
        const dbUser = await res.json();
        const effectiveRole: UserRole =
          dbUser.role === 'lender'
            ? 'lender'
            : dbUser.role === 'admin'
            ? 'admin'
            : 'renter';

        const merged: UserProfile = {
          ...baseProfile,
          ...dbUser,
          role: effectiveRole,
          onboarded: Boolean(dbUser.onboarded),
        };

        setUser(merged);
        setCurrentRole(effectiveRole);

        // Auto-navigate to user's registered role dashboard - REMOVED per user request
        // if (effectiveRole === 'lender') {
        //   navigate('/lender');
        //   showNotification(`Welcome back ${merged.name?.split(' ')[0] || 'Host'}! Logged in as Host (Lender).`);
        // } else if (effectiveRole === 'admin') {
        //   navigate('/admin');
        //   showNotification(`Welcome back ${merged.name?.split(' ')[0] || 'Admin'}! Logged in as System Admin.`);
        // } else {
        //   if (path === '/lender' || path === '/admin') {
        //     navigate('/customer');
        //   }
        // }

        if (!merged.onboarded) {
          setIsOnboardingOpen(true);
        }
        return merged;
      }
    } catch (e) {
      console.error('Failed to sync user:', e);
    }
    setUser(baseProfile);
    return baseProfile;
  };

  // Init Firebase Auth on load
  useEffect(() => {
    const unsubscribe = initAuth(
      (firebaseUser) => {
        const profile: UserProfile = {
          id: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName,
          avatar: firebaseUser.photoURL,
          role: 'renter',
        };
        syncAndLoadUser(profile);
      },
      () => {
        setUser(null);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    fetchCars();
  }, [fetchCars]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Calculate rental duration in days
  const rentalDays = useMemo(() => {
    try {
      const start = new Date(`${filters.pickupDate}T${filters.pickupTime}`);
      const end = new Date(`${filters.dropoffDate}T${filters.dropoffTime}`);
      const diffTime = Math.max(0, end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 1;
    } catch {
      return 1;
    }
  }, [filters.pickupDate, filters.pickupTime, filters.dropoffDate, filters.dropoffTime]);

  // Sorting & Wishlist filtering cars
  const sortedCars = useMemo(() => {
    let list = [...cars];
    if (showWishlistOnly) {
      list = list.filter((c) => wishlistIds.includes(c.id));
    }
    switch (filters.sortBy) {
      case 'price_asc':
        return list.sort((a, b) => a.price_per_day - b.price_per_day);
      case 'price_desc':
        return list.sort((a, b) => b.price_per_day - a.price_per_day);
      case 'rating':
        return list.sort((a, b) => b.rating - a.rating);
      default:
        return list;
    }
  }, [cars, filters.sortBy, showWishlistOnly, wishlistIds]);

  const compareCarsList = useMemo(
    () => cars.filter((c) => compareCarIds.includes(c.id)),
    [cars, compareCarIds]
  );

  // Sign In handler
  const handleSignIn = () => {
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = async (firebaseUser: any) => {
    const profile: any = {
      id: firebaseUser.uid,
      email: firebaseUser.email,
      name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Verified Member',
      avatar: firebaseUser.photoURL || '',
    };
    const loaded = await syncAndLoadUser(profile);
    const roleLabel =
      loaded.role === 'admin'
        ? 'Super Admin'
        : loaded.role === 'lender'
        ? 'Host (Lender)'
        : 'Customer';
    showNotification(`Welcome, ${loaded.name?.split(' ')[0]}! Signed in as ${roleLabel}.`);
  };

  const handleGoogleSignInAction = async () => {
    try {
      const res = await googleSignIn();
      if (res?.user) {
        const profile: any = {
          id: res.user.uid,
          email: res.user.email,
          name: res.user.displayName,
          avatar: res.user.photoURL,
        };
        const loaded = await syncAndLoadUser(profile);
        const roleLabel =
          loaded.role === 'admin'
            ? 'Super Admin'
            : loaded.role === 'lender'
            ? 'Host (Lender)'
            : 'Customer';
        showNotification(`Welcome, ${res.user.displayName?.split(' ')[0]}! Signed in as ${roleLabel}.`);
      }
    } catch (e: any) {
      console.error('Sign in error:', e);
      showNotification('Google sign-in interrupted.');
    }
  };

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    navigate('/');
    showNotification('Signed out successfully.');
  };

  const handleRoleChange = (newRole: UserRole) => {
    setCurrentRole(newRole);
    if (user) {
      setUser({ ...user, role: newRole });
      fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...user, role: newRole }),
      }).catch(console.warn);
    }
    showNotification(`Switched to ${newRole === 'renter' ? 'Renter' : 'Lender (Host)'} mode`);
  };

  const handleConfirmBooking = async (bookingPayload: any) => {
    if (user && !user.onboarded) {
      setIsOnboardingOpen(true);
      showNotification('Verify your driving details to complete reservation!');
      throw new Error('Onboarding required');
    }
    if (!bookingPayload) {
      setIsOnboardingOpen(true);
      return null;
    }
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingPayload),
    });
    if (!res.ok) throw new Error('Booking failed');
    const newBooking = await res.json();
    setBookings((prev) => [newBooking, ...prev]);
    showNotification(`Booking confirmed! Reference: ${newBooking.id}`);
    return newBooking;
  };

  const handleAddReview = async (carId: string, rating: number, comment: string) => {
    if (!user) {
      handleSignIn();
      return;
    }
    const res = await fetch(`/api/cars/${carId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        user_name: user.name || 'Guest Driver',
        user_avatar: user.avatar || '',
        rating,
        comment,
      }),
    });
    if (res.ok) {
      const rev = await res.json();
      setCars((prev) =>
        prev.map((c) => {
          if (c.id === carId) {
            const currentReviews = c.reviews || [];
            return {
              ...c,
              reviews: [rev, ...currentReviews],
              reviews_count: c.reviews_count + 1,
            };
          }
          return c;
        })
      );
      showNotification('Thank you! Your verified review has been published.');
    }
  };

  const handleCompleteOnboarding = async (onboardingData: any) => {
    if (!user) return;
    try {
      const res = await fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...user,
          ...onboardingData,
          onboarded: true,
        }),
      });
      if (res.ok) {
        const dbUser = await res.json();
        setUser((prev) => prev ? {
          ...prev,
          ...dbUser,
          onboarded: true,
        } : null);
        if (dbUser.role) {
          setCurrentRole(dbUser.role);
        }
        showNotification('Identity verified successfully! Privilege activated.');
        setIsOnboardingOpen(false);
      }
    } catch (e) {
      console.error('Onboarding sync failed:', e);
      showNotification('Verification error. Please retry.');
    }
  };

  const handleAddCar = async (carData: any) => {
    const res = await fetch('/api/cars', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(carData),
    });
    if (res.ok) {
      const newCar = await res.json();
      setCars((prev) => [newCar, ...prev]);
      showNotification(`Vehicle "${newCar.title}" submitted for admin approval!`);
    }
  };

  const handleUpdateCar = async (carId: string, updates: Partial<Car>) => {
    const res = await fetch(`/api/cars/${carId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const updated = await res.json();
      setCars((prev) => prev.map((c) => (c.id === carId ? updated : c)));
      showNotification('Vehicle settings updated.');
    }
  };

  const handleDeleteCar = async (carId: string) => {
    const confirmed = window.confirm('Are you sure you want to remove this vehicle listing?');
    if (!confirmed) return;
    const res = await fetch(`/api/cars/${carId}`, { method: 'DELETE' });
    if (res.ok) {
      setCars((prev) => prev.filter((c) => c.id !== carId));
      showNotification('Vehicle listing removed.');
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: string) => {
    const res = await fetch(`/api/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: status as any } : b)));
      showNotification(`Trip status updated to ${status}.`);
    }
  };

  // Route parser for /car/:id and /host/:id
  const isCarDetailRoute = path.startsWith('/car/') || path.startsWith('/cars/');
  const currentCarId = isCarDetailRoute ? path.split('/')[2] : null;

  const isHostProfileRoute = path.startsWith('/host/') || path.startsWith('/lender-profile/');
  const currentHostId = isHostProfileRoute ? path.split('/')[2] : null;

  const isDashboard = path === '/customer' || path === '/lender' || path === '/list-car' || path === '/admin';

  // ROUTING CONTENT DETERMINATION
  let mainContent: React.ReactNode = null;

  if (path === '/customer') {
    if (!user) {
      navigate('/');
      return null;
    }
    mainContent = (
      <CustomerDashboard
        user={user}
        allCars={cars}
        wishlistIds={wishlistIds}
        onToggleWishlist={handleToggleWishlist}
        onSignInRequired={handleSignIn}
        onSignOut={handleSignOut}
      />
    );
  } else if (path === '/lender' || path === '/list-car') {
    if (!user) {
      navigate('/');
      return null;
    }
    mainContent = (
      <LenderDashboard
        user={user}
        initialTab={path === '/list-car' ? 'list-car' : undefined}
        onSignInRequired={handleSignIn}
        onSignOut={handleSignOut}
        onUserUpdated={(updatedUser) => {
          setUser(updatedUser);
          showNotification('Host profile & security preferences saved.');
        }}
      />
    );
  } else if (path === '/admin') {
    mainContent = (
      <AdminDashboard
        user={user}
        onSignOut={handleSignOut}
        onSignInRequired={handleSignIn}
        onOpenListCarModal={() => setIsListCarModalOpen(true)}
        dbStatus={dbStatus}
        onOpenDatabaseModal={() => setIsDatabaseModalOpen(true)}
      />
    );
  } else {
    // 4. PUBLIC & LANDING PAGES (Old default block)
    mainContent = (
      <div className="flex-1">
        {isCarDetailRoute && currentCarId ? (
          /* 1. SEPARATE CAR VIEW PAGE WITH OWNER DETAILS & OTHER CARS */
          <CarDetailPage
            carId={currentCarId}
            allCars={cars}
            pickupDate={filters.pickupDate}
            pickupTime={filters.pickupTime}
            dropoffDate={filters.dropoffDate}
            dropoffTime={filters.dropoffTime}
            rentalDays={rentalDays}
            user={user}
            onConfirmBooking={handleConfirmBooking}
            onSignInRequired={handleSignIn}
            onAddReview={handleAddReview}
          />
        ) : isHostProfileRoute && currentHostId ? (
          /* 1.5 DEDICATED PUBLIC HOST / LENDER PROFILE & FLEET */
          <LenderProfilePage
            lenderId={currentHostId}
            allCars={cars}
            currentUser={user}
            onSignInRequired={handleSignIn}
          />
        ) : path === '/about' ? (
          /* 2. ABOUT PAGE */
          <AboutPage />
        ) : path === '/how-it-works' ? (
          /* 3. HOW IT WORKS PAGE */
          <HowItWorksPage />
        ) : path === '/insurance-protection' ? (
          /* 4. INSURANCE & PROTECTION PAGE */
          <InsurancePage />
        ) : path === '/host-leasing' ? (
          /* 5. EARN AS HOST PAGE */
          <HostLeasingPage
            onOpenListCarModal={() => setIsListCarModalOpen(true)}
            onSwitchToLenderMode={() => handleRoleChange('lender')}
          />
        ) : path === '/become-a-host' ? (
          /* 6. BECOME A HOST DEDICATED PAGE & WIZARD */
          <BecomeHostPage
            user={user}
            onSignInRequired={handleSignIn}
            onUserUpdated={(updatedUser) => {
              setUser(updatedUser);
              setCurrentRole('lender');
              showNotification(`Welcome, ${updatedUser.name}! Your Host account is active.`);
            }}
          />
        ) : path === '/list-car' ? (
          /* 7. DEDICATED FULL-PAGE CAR LISTING WIZARD */
          <ListCarPage
            user={user}
            onSignInRequired={handleSignIn}
            onCarCreated={handleAddCar}
          />
        ) : path === '/contact' ? (
          /* 7. CONTACT & SUPPORT PAGE */
          <ContactPage />
        ) : (
          /* 8. HOMEPAGE VIEW: 2-COLUMN FILTER GRID + AVAILABLE CARS */
          <div>
            <SEO
              title="Charvi Rental - Verified Self-Drive Car Rentals & Host Fleet in India"
              description="Rent premium self-drive cars in Pune, Mumbai, Delhi NCR, Bengaluru & Hyderabad. Zero security deposit options, verified hosts, doorstep delivery & 24/7 support."
              canonicalPath="/"
              ogImage="/assets/hero_cars_crop.png"
              ogType="website"
              keywords={[
                'self drive car rental Pune',
                'car rental Mumbai',
                'peer to peer car rental India',
                'rent SUV without driver',
                'Charvi Rental fleet',
                'list your car and earn India',
                'doorstep car delivery Pune'
              ]}
              schema={{
                '@context': 'https://schema.org',
                '@graph': [
                  {
                    '@type': 'AutoRental',
                    '@id': 'https://charvirental.com/#autorental',
                    name: 'Charvi Rental',
                    url: 'https://charvirental.com',
                    logo: 'https://charvirental.com/assets/hero_cars_crop.png',
                    image: 'https://charvirental.com/assets/hero_cars_crop.png',
                    description: 'India premier peer-to-peer and verified self-drive car rental marketplace.',
                    telephone: '+91 98765 43210',
                    priceRange: '₹₹',
                    address: {
                      '@type': 'PostalAddress',
                      streetAddress: 'Wakad',
                      addressLocality: 'Pune',
                      addressRegion: 'Maharashtra',
                      postalCode: '411057',
                      addressCountry: 'IN',
                    },
                    geo: {
                      '@type': 'GeoCoordinates',
                      latitude: 18.5987,
                      longitude: 73.7684,
                    },
                    areaServed: [
                      { '@type': 'City', name: 'Pune' },
                      { '@type': 'City', name: 'Mumbai' },
                      { '@type': 'City', name: 'Delhi NCR' },
                      { '@type': 'City', name: 'Bengaluru' },
                      { '@type': 'City', name: 'Hyderabad' },
                      { '@type': 'City', name: 'Goa' },
                    ],
                    openingHoursSpecification: {
                      '@type': 'OpeningHoursSpecification',
                      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                      opens: '00:00',
                      closes: '23:59',
                    },
                  },
                  {
                    '@type': 'WebSite',
                    '@id': 'https://charvirental.com/#website',
                    url: 'https://charvirental.com',
                    name: 'Charvi Rental',
                    potentialAction: {
                      '@type': 'SearchAction',
                      target: 'https://charvirental.com/?search={search_term_string}',
                      'query-input': 'required name=search_term_string',
                    },
                  },
                ],
              }}
            />
            {/* 2-COLUMN FILTER SEARCH BAR WITH ANDROID GPS DETECT */}
            <HeroSearchBar
              filters={filters}
              onFilterChange={(newFilters) => setFilters((prev) => ({ ...prev, ...newFilters }))}
              onResetFilters={() => {
                const fresh = {
                  location: 'Wakad, Pune',
                  pickupDate: formatDate(tomorrow),
                  pickupTime: '10:00',
                  dropoffDate: formatDate(threeDaysLater),
                  dropoffTime: '10:00',
                  type: 'All',
                  transmission: 'All',
                  fuel: 'All',
                  minPrice: 0,
                  maxPrice: 25000,
                  seats: 0,
                  instantBookOnly: false,
                  sortBy: 'recommended' as const,
                };
                setFilters(fresh);
                setSearchParams(fresh);
              }}
              onFind={() => {
                setSearchParams(filters);
                showNotification('Searching available fleet for selected dates...');
              }}
              totalResultsCount={sortedCars.length}
            />

            {/* Results Grid Section: Full width to device size */}
            <main id="fleet-section" className="w-full px-4 sm:px-8 lg:px-12 py-6">
              {/* Header and Quick Stats */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800 gap-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
                    <span>Available Vehicles</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300">
                      {sortedCars.length} cars
                    </span>
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Dates: <strong className="text-neutral-800 dark:text-neutral-200">{filters.pickupDate}</strong> to <strong className="text-neutral-800 dark:text-neutral-200">{filters.dropoffDate}</strong> ({rentalDays} {rentalDays === 1 ? 'day' : 'days'})
                  </p>
                </div>

                {/* Sort selector */}
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-neutral-500 dark:text-neutral-400 font-medium">Sort by:</span>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value as any }))}
                    className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl py-1.5 px-3 text-xs font-bold text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-orange-500 shadow-2xs cursor-pointer"
                  >
                    <option value="recommended">Recommended</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="rating">Highest Rated</option>
                  </select>
                </div>
              </div>

              {/* Quick Filters in Search Results Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  {['All', 'SUV', 'Sedan', 'Luxury', 'Electric', 'Hatchback'].map((typeName) => {
                    const isSelected = filters.type === typeName && !showWishlistOnly;
                    return (
                      <button
                        key={typeName}
                        onClick={() => {
                          setShowWishlistOnly(false);
                          const updated = { ...filters, type: typeName };
                          setFilters(updated);
                          setSearchParams(updated);
                        }}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs cursor-pointer ${
                          isSelected
                            ? 'bg-orange-600 text-white shadow-2xs'
                            : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                        }`}
                      >
                        {typeName === 'All' ? 'All Vehicles' : typeName}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setShowWishlistOnly((prev) => !prev)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs flex items-center space-x-1.5 cursor-pointer ${
                      showWishlistOnly
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${showWishlistOnly ? 'fill-white' : 'text-rose-500'}`} />
                    <span>Saved Wishlist ({wishlistIds.length})</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsFilterDrawerOpen(true)}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors shadow-2xs cursor-pointer"
                >
                  <Filter className="w-3.5 h-3.5 text-orange-600" />
                  <span>More Filters</span>
                  {(filters.type !== 'All' || filters.transmission !== 'All' || filters.fuel !== 'All' || filters.seats > 0 || filters.maxPrice < 25000 || filters.instantBookOnly) && (
                    <span className="w-2 h-2 rounded-full bg-orange-600" />
                  )}
                </button>
              </div>

              {/* Cars Grid: 2 columns on mobile, 4 columns on tablets (md), 5 columns on desktop (xl) */}
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5 py-6">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="rounded-2xl sm:rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 sm:p-4 space-y-3 animate-pulse">
                      <div className="aspect-[16/10] bg-neutral-200 dark:bg-neutral-800 rounded-xl sm:rounded-2xl" />
                      <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-2/3" />
                      <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-1/2" />
                      <div className="grid grid-cols-3 gap-1 pt-2">
                        <div className="h-5 bg-neutral-100 dark:bg-neutral-800 rounded" />
                        <div className="h-5 bg-neutral-100 dark:bg-neutral-800 rounded" />
                        <div className="h-5 bg-neutral-100 dark:bg-neutral-800 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : sortedCars.length === 0 ? (
                <div className="text-center py-16 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-600 flex items-center justify-center mx-auto border border-orange-200 dark:border-orange-800">
                    <CarTaxiFront className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white">No cars found for this search</h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
                      Try selecting different dates, clearing the location filter, or increasing the maximum price.
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setFilters({
                        location: '',
                        pickupDate: formatDate(tomorrow),
                        pickupTime: '10:00',
                        dropoffDate: formatDate(threeDaysLater),
                        dropoffTime: '10:00',
                        type: 'All',
                        transmission: 'All',
                        fuel: 'All',
                        minPrice: 0,
                        maxPrice: 25000,
                        seats: 0,
                        instantBookOnly: false,
                        sortBy: 'recommended',
                      })
                    }
                    className="px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 transition-colors shadow-2xs cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5 py-6">
                  {sortedCars.map((car) => (
                    <CarCard
                      key={car.id}
                      car={car}
                      rentalDays={rentalDays}
                      isWishlisted={wishlistIds.includes(car.id)}
                      onToggleWishlist={handleToggleWishlist}
                      isCompared={compareCarIds.includes(car.id)}
                      onToggleCompare={handleToggleCompare}
                    />
                  ))}
                </div>
              )}

              {/* Trust & Guarantees Strip */}
              <section className="mt-12 pt-8 border-t border-neutral-200/70 dark:border-white/10">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="p-6 rounded-3xl glass-card space-y-3">
                    <div className="w-11 h-11 rounded-2xl bg-orange-100/80 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center border border-orange-200/80 dark:border-orange-800/80 shadow-xs">
                      <Zap className="w-5 h-5 fill-orange-500" />
                    </div>
                    <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Instant Contactless Pick-up</h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      FASTag equipped and verified digital check-in. Skip lines and paperwork at airport counters.
                    </p>
                  </div>

                  <div className="p-6 rounded-3xl glass-card space-y-3">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center border border-emerald-200/80 dark:border-emerald-800/80 shadow-xs">
                      <Shield className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Comprehensive Driver Coverage</h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      Every trip includes 24/7 emergency roadside assistance and statutory insurance protection plans in India.
                    </p>
                  </div>

                  <div className="p-6 rounded-3xl glass-card space-y-3">
                    <div className="w-11 h-11 rounded-2xl bg-orange-100/80 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center border border-orange-200/80 dark:border-orange-800/80 shadow-xs">
                      <Award className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-sm text-neutral-900 dark:text-white">100% Verified Community</h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      Drivers and vehicle hosts are authenticated with Google credentials and DigiLocker driver licence validation.
                    </p>
                  </div>
                </div>
              </section>
            </main>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans selection:bg-orange-500 selection:text-white transition-colors">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-neutral-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-neutral-800 text-xs font-bold flex items-center space-x-2 animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Navigation Bar with Dark Mode Toggle & Mobile Buttons (Hidden on Dashboard Routes) */}
      {!['/admin', '/customer', '/lender', '/list-car'].includes(path) && (
        <Navbar
          user={user}
          currentRole={currentRole}
          selectedCity={selectedCity}
          onSelectCity={handleSelectCity}
          onRoleChange={handleRoleChange}
          onSignInClick={handleSignIn}
          onSignOutClick={handleSignOut}
          onOpenTripsModal={() => navigate('/customer')}
          onOpenLenderPortal={() => navigate('/lender')}
          onOpenListCarModal={() => setIsListCarModalOpen(true)}
          dbStatus={dbStatus}
          onOpenDatabaseModal={() => setIsDatabaseModalOpen(true)}
        />
      )}

      {mainContent}

      {/* Side-by-Side Vehicle Comparison Drawer */}
      <CompareCarsDrawer
        compareCars={compareCarsList}
        rentalDays={rentalDays}
        onRemoveCar={(id) => setCompareCarIds((prev) => prev.filter((cid) => cid !== id))}
        onClearAll={() => setCompareCarIds([])}
      />

      {/* Global Detailed Compact Footer */}
      {!isDashboard && <Footer />}

      {/* MODALS */}
      {/* 1. Direct Booking Modal */}
      <BookingModal
        car={selectedCarForBooking}
        isOpen={Boolean(selectedCarForBooking)}
        onClose={() => setSelectedCarForBooking(null)}
        pickupDate={filters.pickupDate}
        pickupTime={filters.pickupTime}
        dropoffDate={filters.dropoffDate}
        dropoffTime={filters.dropoffTime}
        rentalDays={rentalDays}
        user={user}
        onConfirmBooking={handleConfirmBooking}
        onSignInRequired={handleSignIn}
      />

      {/* 2. Advanced Filters Drawer */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={filters}
        onFilterChange={(newFilters) => setFilters((prev) => ({ ...prev, ...newFilters }))}
        onResetFilters={() =>
          setFilters({
            location: '',
            pickupDate: formatDate(tomorrow),
            pickupTime: '10:00',
            dropoffDate: formatDate(threeDaysLater),
            dropoffTime: '10:00',
            type: 'All',
            transmission: 'All',
            fuel: 'All',
            minPrice: 0,
            maxPrice: 25000,
            seats: 0,
            instantBookOnly: false,
            sortBy: 'recommended',
          })
        }
        resultsCount={sortedCars.length}
      />

      {/* 3. List New Car Modal */}
      <ListCarModal
        isOpen={isListCarModalOpen}
        onClose={() => setIsListCarModalOpen(false)}
        user={user}
        onCarCreated={handleAddCar}
        onSignInRequired={handleSignIn}
      />

      {/* 4. Security & Safety Guarantee Modal */}
      <SecurityGuaranteeModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />

      {/* 5. Onboarding Signup Wizard Modal */}
      <OnboardingWizardModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        user={user}
        onComplete={handleCompleteOnboarding}
      />

      {/* 6. Unified Premium Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        onGoogleSignIn={handleGoogleSignInAction}
      />

      <DatabaseModal
        isOpen={isDatabaseModalOpen}
        onClose={() => setIsDatabaseModalOpen(false)}
        status={dbStatus}
        onRefresh={fetchDbStatus}
      />
    </div>
  );
}

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export default function App() {
  return (
    <PlatformSettingsProvider>
      <ThemeProvider>
        <APIProvider apiKey={GOOGLE_MAPS_KEY}>
          <RouterProvider>
            <AppContent />
          </RouterProvider>
        </APIProvider>
      </ThemeProvider>
    </PlatformSettingsProvider>
  );
}
