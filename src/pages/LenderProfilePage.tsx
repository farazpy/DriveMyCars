import React, { useState, useEffect } from 'react';
import {
  Star,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Clock,
  Car as CarIcon,
  ArrowLeft,
  ChevronRight,
  Gauge,
  Fuel,
  Users,
  Award,
  Zap,
  Phone,
  Mail,
  Share2,
  Loader2
} from 'lucide-react';
import { Car, UserProfile } from '../types.ts';
import { Link, useRouter } from '../router.tsx';
import { SEO } from '../components/SEO.tsx';

interface LenderProfilePageProps {
  lenderId: string;
  allCars?: Car[];
  currentUser: UserProfile | null;
  onSignInRequired?: () => void;
}

interface PublicLenderData {
  id: string;
  name: string;
  avatar: string;
  bio?: string;
  city?: string;
  location?: string;
  member_since?: string;
  rating?: number;
  trips_count?: number;
  response_rate?: string;
  verified?: boolean;
}

export const LenderProfilePage: React.FC<LenderProfilePageProps> = ({
  lenderId,
  allCars = [],
  currentUser,
}) => {
  const { navigate } = useRouter();
  const [lender, setLender] = useState<PublicLenderData | null>(null);
  const [hostCars, setHostCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    // Fetch lender public profile and their cars
    Promise.all([
      fetch(`/api/lenders/${lenderId}/profile`).then((res) => (res.ok ? res.json() : null)),
      fetch(`/api/cars?lenderId=${lenderId}`).then((res) => (res.ok ? res.json() : []))
    ])
      .then(([lenderData, carsData]) => {
        if (!isMounted) return;

        // If API returned lenderData, use it; otherwise deduce from cars list or fallback
        const carsList: Car[] = Array.isArray(carsData) && carsData.length > 0
          ? carsData
          : allCars.filter((c) => c.lender_id === lenderId);

        setHostCars(carsList);

        if (lenderData && lenderData.id) {
          setLender(lenderData);
        } else {
          // Fallback reconstruction from car details
          const firstCar = carsList[0];
          setLender({
            id: lenderId,
            name: firstCar ? firstCar.lender_name : 'Verified Host',
            avatar: firstCar ? firstCar.lender_avatar : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
            bio: 'Passionate automotive enthusiast and verified peer-to-peer car sharing host on Charvi Rental. Offering clean, well-maintained vehicles with seamless contactless key handovers.',
            city: firstCar ? firstCar.city : 'Pune',
            location: firstCar ? `${firstCar.city}, Maharashtra` : 'Pune, India',
            member_since: '2023',
            rating: firstCar ? firstCar.rating : 4.95,
            trips_count: 48,
            response_rate: '100% within 15 mins',
            verified: true,
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching host profile:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [lenderId, allCars]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${lender?.name || 'Verified Host'} - Car Fleet | Charvi Rental`,
        text: `Rent self-drive cars hosted by ${lender?.name} on Charvi Rental.`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 text-center space-y-4">
        <Loader2 className="w-10 h-10 text-orange-600 animate-spin mx-auto" />
        <p className="text-sm font-bold text-neutral-500">Loading Host profile and verified fleet...</p>
      </div>
    );
  }

  const hostName = lender?.name || 'Verified Host';
  const hostCity = lender?.city || 'Pune';
  const hostBio = lender?.bio || `Verified peer-to-peer host offering self-drive rentals in ${hostCity}. Quality assured, fully insured vehicles.`;
  const hostRating = lender?.rating ? lender.rating.toFixed(2) : '4.95';
  const hostTrips = lender?.trips_count || 35;
  const ogImg = hostCars[0]?.image_url || lender?.avatar || '/assets/hero_cars_crop.png';

  // Schema.org Structured Data
  const jsonLdSchema = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    name: `${hostName}'s Verified Fleet Profile`,
    description: hostBio,
    mainEntity: {
      '@type': 'AutoDealer',
      name: hostName,
      image: lender?.avatar,
      description: hostBio,
      address: {
        '@type': 'PostalAddress',
        addressLocality: hostCity,
        addressCountry: 'IN',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: hostRating,
        reviewCount: hostTrips,
      },
      makesOffer: hostCars.map((c) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Car',
          name: `${c.year} ${c.make} ${c.model}`,
          model: c.model,
          vehicleTransmission: c.transmission,
          fuelType: c.fuel,
          seatingCapacity: c.seats,
          image: c.image_url,
          url: `https://charvirental.com/car/${c.id}`,
        },
        price: c.price_per_day,
        priceCurrency: 'INR',
        availability: 'https://schema.org/InStock',
      })),
    },
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-20 transition-colors">
      <SEO
        title={`${hostName}'s Verified Car Fleet in ${hostCity}`}
        description={`Rent self-drive cars from verified host ${hostName} in ${hostCity}. Rating: ${hostRating}/5.0 (${hostTrips} trips). Doorstep delivery, comprehensive insurance.`}
        canonicalPath={`/host/${lenderId}`}
        ogImage={ogImg}
        ogType="profile"
        keywords={[
          `${hostName} car rental`,
          `host ${hostName} Charvi Rental`,
          `car rental ${hostCity}`,
          'self drive car host India',
          'peer to peer car rental'
        ]}
        schema={jsonLdSchema}
      />

      {/* Top Breadcrumb & Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Cars</span>
          </Link>
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:border-orange-500 hover:text-orange-600 transition-colors shadow-2xs cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copiedLink ? 'Link Copied!' : 'Share Host Profile'}</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Host Profile Header Card */}
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 shadow-sm transition-colors relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/5 dark:bg-orange-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            {/* Left: Avatar + Details */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 min-w-0">
              <div className="relative shrink-0">
                <img
                  src={lender?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                  alt={hostName}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl object-cover border-4 border-orange-100 dark:border-orange-950 shadow-md"
                />
                <span className="absolute -bottom-1 -right-1 bg-emerald-600 text-white p-1 rounded-full border-2 border-white dark:border-neutral-900" title="Identity & KYC Verified">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>

              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center space-x-2 flex-wrap gap-1">
                  <h1 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
                    {hostName}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" />
                    Verified Fleet Host
                  </span>
                </div>

                <div className="flex items-center space-x-3 text-xs text-neutral-500 dark:text-neutral-400 flex-wrap gap-2">
                  <span className="flex items-center gap-1 font-semibold text-neutral-700 dark:text-neutral-300">
                    <MapPin className="w-3.5 h-3.5 text-orange-600" />
                    {hostCity}, Maharashtra
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                    Host since {lender?.member_since || '2023'}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-amber-500" />
                    {hostRating} Rating ({hostTrips} trips)
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-2xl pt-1 leading-relaxed">
                  {hostBio}
                </p>
              </div>
            </div>

            {/* Right: Quick Verification Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full md:w-auto shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-neutral-100 dark:border-neutral-800">
              <div className="bg-neutral-50 dark:bg-neutral-950 p-3 rounded-2xl border border-neutral-100 dark:border-neutral-800/80 text-center">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Fleet Size</span>
                <span className="text-lg font-black text-neutral-900 dark:text-white flex items-center justify-center gap-1">
                  <CarIcon className="w-4 h-4 text-orange-600" />
                  {hostCars.length} Cars
                </span>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-950 p-3 rounded-2xl border border-neutral-100 dark:border-neutral-800/80 text-center">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Trips Completed</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {hostTrips}+
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1 bg-neutral-50 dark:bg-neutral-950 p-3 rounded-2xl border border-neutral-100 dark:border-neutral-800/80 text-center">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Response Rate</span>
                <span className="text-xs font-extrabold text-neutral-800 dark:text-neutral-200 block mt-1">
                  ⚡ 100% (within 15m)
                </span>
              </div>
            </div>
          </div>

          {/* Trust Guarantees */}
          <div className="mt-6 pt-5 border-t border-neutral-100 dark:border-neutral-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="flex items-center space-x-2 text-neutral-600 dark:text-neutral-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Full Comprehensive Insurance on every car</span>
            </div>
            <div className="flex items-center space-x-2 text-neutral-600 dark:text-neutral-400">
              <Zap className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Instant Confirmation & Fast Doorstep Handover</span>
            </div>
            <div className="flex items-center space-x-2 text-neutral-600 dark:text-neutral-400">
              <CheckCircle2 className="w-4 h-4 text-orange-600 shrink-0" />
              <span>Government KYC & RC Verified Vehicles</span>
            </div>
          </div>
        </div>

        {/* Vehicles Hosted by this Owner */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Vehicles Hosted by {hostName}</span>
                <span className="px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950/70 text-orange-700 dark:text-orange-300 text-xs font-bold">
                  {hostCars.length} Available
                </span>
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                All vehicles maintained to Charvi Rental 40-point safety and cleanliness standards.
              </p>
            </div>
          </div>

          {hostCars.length === 0 ? (
            <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-12 text-center space-y-3">
              <CarIcon className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto" />
              <p className="text-base font-bold text-neutral-700 dark:text-neutral-300">
                No active cars listed currently
              </p>
              <p className="text-xs text-neutral-500 max-w-md mx-auto">
                This host&apos;s vehicles are either on existing trips or pending scheduled maintenance. Check back shortly.
              </p>
              <Link
                to="/"
                className="inline-block mt-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Browse Other Cars
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {hostCars.map((car) => (
                <div
                  key={car.id}
                  className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col group"
                >
                  {/* Car Image with Badge */}
                  <div className="relative aspect-16/10 overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                    <img
                      src={car.image_url}
                      alt={`${car.year} ${car.make} ${car.model}`}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-neutral-900/80 backdrop-blur-md text-white uppercase tracking-wider">
                        {car.type}
                      </span>
                      {car.is_instant_book && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-500 text-neutral-950 flex items-center gap-0.5">
                          <Zap className="w-3 h-3 fill-neutral-950" />
                          Instant
                        </span>
                      )}
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md text-neutral-900 dark:text-white flex items-center gap-1 shadow-xs">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        {car.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-base text-neutral-900 dark:text-white group-hover:text-orange-600 transition-colors">
                          {car.make} {car.model}
                        </h3>
                        <span className="text-xs font-bold text-neutral-400">{car.year}</span>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-orange-600 shrink-0" />
                        {car.location || car.city}
                      </p>
                    </div>

                    {/* Specs Row */}
                    <div className="grid grid-cols-3 gap-2 py-2 border-y border-neutral-100 dark:border-neutral-800 text-[11px] font-bold text-neutral-600 dark:text-neutral-400">
                      <div className="flex items-center gap-1">
                        <Gauge className="w-3.5 h-3.5 text-neutral-400" />
                        <span className="truncate">{car.transmission}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Fuel className="w-3.5 h-3.5 text-neutral-400" />
                        <span className="truncate">{car.fuel}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-neutral-400" />
                        <span className="truncate">{car.seats} Seats</span>
                      </div>
                    </div>

                    {/* Price and CTA */}
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <span className="text-[10px] font-bold text-neutral-400 uppercase block">Daily Rate</span>
                        <div className="flex items-baseline space-x-1">
                          <span className="text-lg font-black text-neutral-900 dark:text-white">
                            ₹{car.price_per_day.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] font-bold text-neutral-500">/day</span>
                        </div>
                      </div>

                      <Link
                        to={`/car/${car.id}`}
                        className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all group-hover:scale-105"
                      >
                        <span>View & Book</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
