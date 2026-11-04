import React, { useState } from 'react';
import {
  ArrowLeft,
  Star,
  MapPin,
  Fuel,
  Gauge,
  Users,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Clock,
  Zap,
  Sparkles,
  ChevronRight,
  Car as CarIcon,
  MessageSquare,
  QrCode,
  ArrowRight,
  ShieldAlert,
  Send,
  Loader2
} from 'lucide-react';
import { Car, UserProfile } from '../types.ts';
import { Link, useRouter } from '../router.tsx';
import { SEO } from '../components/SEO.tsx';

interface CarDetailPageProps {
  carId: string;
  allCars: Car[];
  pickupDate: string;
  pickupTime: string;
  dropoffDate: string;
  dropoffTime: string;
  rentalDays: number;
  user: UserProfile | null;
  onConfirmBooking: (payload: any) => Promise<any>;
  onSignInRequired: () => void;
  onAddReview: (carId: string, rating: number, comment: string) => Promise<void>;
}

export const CarDetailPage: React.FC<CarDetailPageProps> = ({
  carId,
  allCars,
  pickupDate,
  pickupTime,
  dropoffDate,
  dropoffTime,
  rentalDays,
  user,
  onConfirmBooking,
  onSignInRequired,
  onAddReview,
}) => {
  const { navigate } = useRouter();
  const [selectedImage, setSelectedImage] = useState(0);
  const [protectionPlan, setProtectionPlan] = useState<'Standard' | 'Premium'>('Standard');
  const [deliveryOption, setDeliveryOption] = useState<'hub' | 'doorstep'>('hub');
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any | null>(null);

  // Review form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const [car, setCar] = useState<Car | null>(() => allCars.find((c) => c.id === carId) || null);
  const [loading, setLoading] = useState(!car);

  React.useEffect(() => {
    if (!car || car.id !== carId) {
      const found = allCars.find((c) => c.id === carId);
      if (found) {
        setCar(found);
        setLoading(false);
      } else {
        setLoading(true);
        fetch(`/api/cars/${carId}`)
          .then((res) => {
            if (res.ok) return res.json();
            throw new Error('Not found');
          })
          .then((data) => {
            setCar(data);
            setLoading(false);
          })
          .catch(() => {
            setCar(null);
            setLoading(false);
          });
      }
    }
  }, [carId, allCars]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 text-center space-y-4">
        <Loader2 className="w-10 h-10 text-orange-600 animate-spin mx-auto" />
        <p className="text-sm font-bold text-neutral-500">Loading vehicle details...</p>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Vehicle Not Found</h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">The vehicle you are looking for may have been removed or leased.</p>
        <Link to="/" className="inline-block px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700">
          Back to Available Fleet
        </Link>
      </div>
    );
  }

  // Filter other cars owned by this lender (excluding current car)
  const otherCarsByOwner = allCars.filter(
    (c) => c.lender_id === car.lender_id && c.id !== car.id
  );

  const images = car.images && car.images.length > 0 ? car.images : [car.image_url];
  const baseRate = car.price_per_day * rentalDays;
  const insuranceFee = protectionPlan === 'Premium' ? 499 * rentalDays : 0;
  const deliveryFee = deliveryOption === 'doorstep' ? 299 : 0;
  const serviceFee = Math.round(baseRate * 0.05);
  const totalCost = baseRate + insuranceFee + deliveryFee + serviceFee;

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onSignInRequired();
      return;
    }
    if (user && !user.onboarded) {
      onConfirmBooking(null).catch(() => {});
      return;
    }
    if (!agreedToTerms) return;

    setIsSubmitting(true);
    try {
      const res = await onConfirmBooking({
        car_id: car.id,
        car_title: car.title,
        car_image: car.image_url,
        renter_id: user.id,
        renter_name: user.name || 'Valued Guest',
        renter_email: user.email || '',
        lender_id: car.lender_id,
        pickup_datetime: `${pickupDate}T${pickupTime}`,
        dropoff_datetime: `${dropoffDate}T${dropoffTime}`,
        total_days: rentalDays,
        price_per_day: car.price_per_day,
        total_price: totalCost,
        insurance_plan: protectionPlan,
      });
      setBookingSuccess(res);
    } catch (err) {
      console.error('Booking failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    setSubmittingReview(true);
    try {
      await onAddReview(car.id, reviewRating, reviewComment.trim());
      setReviewComment('');
    } finally {
      setSubmittingReview(false);
    }
  };

  const seoTitle = car.seo_title || `Rent ${car.make || ''} ${car.model} (${car.year}) in ${car.city} - ₹${car.price_per_day}/day`;
  const seoDescription = car.seo_description || car.description || `Book ${car.year} ${car.make} ${car.model} in ${car.city} on Charvi Rental for ₹${car.price_per_day.toLocaleString('en-IN')}/day. ${car.transmission}, ${car.fuel}, ${car.seats} seats. Doorstep delivery & insurance included.`;

  const carJsonLd = {
    '@context': 'https://schema.org',
    '@type': ['Car', 'Product'],
    name: `${car.year} ${car.make} ${car.model}`,
    image: images,
    description: seoDescription,
    brand: {
      '@type': 'Brand',
      name: car.make || 'Automobile',
    },
    model: car.model,
    vehicleModelDate: String(car.year),
    vehicleTransmission: car.transmission,
    fuelType: car.fuel,
    seatingCapacity: car.seats,
    vehicleConfiguration: car.type,
    offers: {
      '@type': 'Offer',
      price: car.price_per_day,
      priceCurrency: 'INR',
      availability: car.is_available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `https://charvirental.com/car/${car.id}`,
      priceValidUntil: '2027-12-31',
      seller: {
        '@type': 'Person',
        name: car.lender_name,
      },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: car.rating ? car.rating.toFixed(2) : '4.95',
      reviewCount: Math.max(car.reviews_count || 1, 1),
    },
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 transition-colors overflow-x-hidden">
      <SEO
        title={seoTitle}
        description={seoDescription}
        canonicalPath={`/car/${car.id}`}
        ogImage={car.image_url}
        ogType="product"
        keywords={[
          `${car.make} ${car.model} rental`,
          `rent ${car.model} ${car.city}`,
          `${car.city} self drive car`,
          `${car.transmission} car rental`,
          'Charvi Rental car'
        ]}
        schema={carJsonLd}
      />
      {/* Back button & Breadcrumb */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
        <Link
          to="/"
          className="inline-flex items-center space-x-1 font-semibold text-neutral-700 dark:text-neutral-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Fleet</span>
        </Link>
        <span>/</span>
        <span className="text-neutral-400 dark:text-neutral-500">{car.city}</span>
        <span>/</span>
        <span className="font-bold text-neutral-900 dark:text-neutral-100 truncate max-w-[200px] sm:max-w-none">{car.title}</span>
      </div>

      {/* Title & Badge Header Bar */}
      <div className="pb-4 border-b border-neutral-200/70 dark:border-neutral-800/70">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
            {car.year} {car.make}
          </span>
          <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 px-2 py-0.5 rounded-full">
            FASTag Active
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-700 dark:text-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-200 dark:border-amber-800/80 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 fill-amber-500/10" />
            Admin Assured
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
          {car.title}
        </h1>
        <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400 mt-2">
          <div className="flex items-center space-x-1 font-bold text-neutral-900 dark:text-neutral-100">
            <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span>{car.rating.toFixed(2)}</span>
            <span className="text-neutral-400 dark:text-neutral-500 font-normal">({car.reviews_count} verified reviews)</span>
          </div>
          <span>•</span>
          <div className="flex items-center space-x-1">
            <MapPin className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
            <span>{car.location}, {car.city}</span>
          </div>
        </div>
      </div>

      {/* Main Responsive Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column: Photos + Specs + Host + Reviews */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          
          {/* Upper Row: Compact Photo Gallery (col-md-4 type) + Vehicle Specifications */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Compact Photo Gallery (1:1 Ratio Square Display) */}
            <div className="md:col-span-5 space-y-3">
              <div className="aspect-square w-full rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 shadow-xs relative group">
                <img
                  src={images[selectedImage]}
                  alt={car.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded-md text-[10px] font-bold text-white">
                  {selectedImage + 1} / {images.length}
                </div>
              </div>
              {images.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`w-12 h-12 aspect-square rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                        selectedImage === idx ? 'border-orange-600 scale-102 shadow-xs' : 'border-neutral-200 dark:border-neutral-800 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Vehicle Specifications Card (md:col-span-7) */}
            <div className="md:col-span-7 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 space-y-4 shadow-2xs transition-colors">
              <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center justify-between">
                <span>Vehicle Specifications</span>
                <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded-full">
                  {car.type}
                </span>
              </h3>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800/80">
                  <span className="text-neutral-400 dark:text-neutral-500 text-[10px] uppercase font-bold block">Transmission</span>
                  <span className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 mt-0.5">
                    <Gauge className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 shrink-0" />
                    {car.transmission}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800/80">
                  <span className="text-neutral-400 dark:text-neutral-500 text-[10px] uppercase font-bold block">Powertrain</span>
                  <span className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 mt-0.5">
                    <Fuel className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 shrink-0" />
                    {car.fuel}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800/80">
                  <span className="text-neutral-400 dark:text-neutral-500 text-[10px] uppercase font-bold block">Capacity</span>
                  <span className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 mt-0.5">
                    <Users className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 shrink-0" />
                    {car.seats} Seats
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800/80">
                  <span className="text-neutral-400 dark:text-neutral-500 text-[10px] uppercase font-bold block">Body Style</span>
                  <span className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 mt-0.5">
                    <CarIcon className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 shrink-0" />
                    {car.type}
                  </span>
                </div>
              </div>

              {/* Equipped Features */}
              {car.features && car.features.length > 0 && (
                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
                  <h4 className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">Included Features</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {car.features.map((feat, i) => (
                      <div key={i} className="flex items-center space-x-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="truncate">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Owner / Host Details Section */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 space-y-4 shadow-2xs transition-colors">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <Link
                to={`/host/${car.lender_id}`}
                className="flex items-center space-x-3 min-w-0 group cursor-pointer"
                title={`View ${car.lender_name}'s public host profile and fleet`}
              >
                <img
                  src={car.lender_avatar}
                  alt={car.lender_name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-orange-200 dark:border-orange-900 shrink-0 group-hover:border-orange-500 transition-colors"
                />
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                    <h3 className="font-bold text-sm text-neutral-900 dark:text-white truncate group-hover:text-orange-600 transition-colors">
                      {car.lender_name}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      Verified Host
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
                    Operating verified peer-to-peer vehicles in {car.city}.
                  </p>
                  <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400 inline-flex items-center gap-0.5 mt-0.5 group-hover:underline">
                    View Host Profile & Fleet <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
              <div className="text-right shrink-0">
                <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase block">Host Rating</span>
                <span className="text-xs text-amber-600 dark:text-amber-400 font-extrabold flex items-center justify-end gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-500" />
                  {car.rating.toFixed(2)} / 5.0
                </span>
              </div>
            </div>

            {/* Other Cars by this Owner */}
            {otherCarsByOwner.length > 0 && (
              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <h4 className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider mb-2.5">
                  More Vehicles by {car.lender_name.split(' ')[0]} ({otherCarsByOwner.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {otherCarsByOwner.map((otherCar) => (
                    <div
                      key={otherCar.id}
                      onClick={() => navigate(`/car/${otherCar.id}`)}
                      className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-orange-400 dark:hover:border-orange-500 transition-all flex items-center space-x-2.5 cursor-pointer bg-neutral-50 dark:bg-neutral-950 hover:bg-white dark:hover:bg-neutral-900"
                    >
                      <img
                        src={otherCar.image_url}
                        alt={otherCar.title}
                        className="w-14 h-11 rounded-lg object-cover border border-neutral-200 dark:border-neutral-800 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h5 className="font-bold text-xs text-neutral-900 dark:text-neutral-100 truncate">{otherCar.title}</h5>
                        <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                          <span>{otherCar.type}</span>
                          <span className="font-bold text-orange-600 dark:text-orange-400">₹{otherCar.price_per_day.toLocaleString('en-IN')}/day</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Customer Reviews Section */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 space-y-4 shadow-2xs transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Driver Reviews</h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Verified feedback from genuine renters</p>
              </div>
              <div className="flex items-center space-x-1 text-xs font-bold text-neutral-800 dark:text-neutral-200">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                <span>{car.rating.toFixed(2)}</span>
                <span className="text-neutral-400 dark:text-neutral-500 font-normal">({car.reviews_count})</span>
              </div>
            </div>

            {/* Write a Review */}
            <form onSubmit={handlePostReview} className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-2.5">
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 block">Leave a Verified Review</span>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400">Rating:</span>
                <div className="flex space-x-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setReviewRating(s)}
                      className="p-0.5 text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star className={`w-3.5 h-3.5 ${s <= reviewRating ? 'fill-amber-400 text-amber-500' : 'text-neutral-300 dark:text-neutral-700'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 flex-col sm:flex-row">
                <input
                  type="text"
                  placeholder="Share your driving experience with this car..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-orange-500 text-neutral-900 dark:text-neutral-100"
                />
                <button
                  type="submit"
                  disabled={submittingReview || !reviewComment.trim()}
                  className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center space-x-1 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post</span>
                </button>
              </div>
            </form>

            {/* Reviews List */}
            <div className="space-y-3">
              {car.reviews && car.reviews.length > 0 ? (
                car.reviews.map((rev) => (
                  <div key={rev.id} className="p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-950 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <img
                          src={rev.user_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'}
                          alt={rev.user_name}
                          className="w-6 h-6 rounded-full object-cover border border-neutral-200 dark:border-neutral-800"
                        />
                        <span className="text-xs font-bold text-neutral-900 dark:text-neutral-200">{rev.user_name}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-amber-500 text-xs font-bold">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>{rev.rating}</span>
                      </div>
                    </div>
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed pl-8">{rev.comment}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-neutral-400 dark:text-neutral-500 italic text-center py-3">
                  No written reviews yet for this vehicle. Be the first to review!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Booking Card */}
        <div className="lg:col-span-5 xl:col-span-4 sticky top-20">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 sm:p-6 shadow-2xs space-y-5 transition-colors">
            {bookingSuccess ? (
              <div className="text-center py-4 space-y-4 animate-in zoom-in-95 duration-200">
                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border-2 border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-extrabold text-neutral-900 dark:text-white text-lg">Booking Confirmed!</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Reference: <strong className="font-mono text-orange-600 dark:text-orange-400">{bookingSuccess.id}</strong>
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-neutral-500 dark:text-neutral-400">Pick-up</span>
                    <span className="font-bold text-neutral-800 dark:text-neutral-200">{pickupDate} ({pickupTime})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500 dark:text-neutral-400">Drop-off</span>
                    <span className="font-bold text-neutral-800 dark:text-neutral-200">{dropoffDate} ({dropoffTime})</span>
                  </div>
                  <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex justify-between font-bold text-sm">
                    <span className="text-neutral-700 dark:text-neutral-300">Paid</span>
                    <span className="text-orange-600 dark:text-orange-400">₹{totalCost.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/customer')}
                  className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Manage in Customer Portal
                </button>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                {/* Price Display */}
                <div className="flex items-baseline justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3.5">
                  <div>
                    <span className="text-2xl font-black text-neutral-900 dark:text-white">
                      ₹{car.price_per_day.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium"> / day</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/80">
                    Zero Deposit
                  </span>
                </div>

                {/* Rental Duration Summary */}
                <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500 dark:text-neutral-400 font-medium">Rental Schedule</span>
                    <span className="font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded">
                      {rentalDays} {rentalDays === 1 ? 'Day' : 'Days'} Total
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1.5 border-t border-neutral-100 dark:border-neutral-800/60 mt-1">
                    <div>
                      <span className="text-[10px] text-neutral-400 dark:text-neutral-500 block font-bold">PICK-UP</span>
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate block">{pickupDate}</span>
                      <span className="text-neutral-500 dark:text-neutral-400 block text-[11px]">{pickupTime}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-400 dark:text-neutral-500 block font-bold">DROP-OFF</span>
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate block">{dropoffDate}</span>
                      <span className="text-neutral-500 dark:text-neutral-400 block text-[11px]">{dropoffTime}</span>
                    </div>
                  </div>
                </div>

                {/* Handover Delivery Selection */}
                <div>
                  <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1.5">
                    Delivery Option
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setDeliveryOption('hub')}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                        deliveryOption === 'hub'
                          ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-500 dark:border-orange-500 text-orange-950 dark:text-orange-200 font-bold'
                          : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-850'
                      }`}
                    >
                      <span className="block truncate">Self Pick-up</span>
                      <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold truncate">Free at Hub</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryOption('doorstep')}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                        deliveryOption === 'doorstep'
                          ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-500 dark:border-orange-500 text-orange-950 dark:text-orange-200 font-bold'
                          : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-850'
                      }`}
                    >
                      <span className="block truncate">Doorstep Delivery</span>
                      <span className="block text-[10px] text-orange-600 dark:text-orange-400 font-semibold">+₹299</span>
                    </button>
                  </div>
                </div>

                {/* Protection Selection */}
                <div>
                  <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1.5">
                    Protection Plan
                  </label>
                  <div className="space-y-2">
                    <div
                      onClick={() => setProtectionPlan('Standard')}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        protectionPlan === 'Standard'
                          ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-500 dark:border-orange-500 text-orange-950 dark:text-orange-200 ring-1 ring-orange-500'
                          : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-350 dark:hover:border-neutral-750 bg-white dark:bg-neutral-900'
                      }`}
                    >
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-neutral-800 dark:text-neutral-200">Standard Protection</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">Included (₹0)</span>
                      </div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                        24/7 Roadside Assist, basic third-party cover.
                      </p>
                    </div>

                    <div
                      onClick={() => setProtectionPlan('Premium')}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        protectionPlan === 'Premium'
                          ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-500 dark:border-orange-500 text-orange-950 dark:text-orange-200 ring-1 ring-orange-500'
                          : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-350 dark:hover:border-neutral-750 bg-white dark:bg-neutral-900'
                      }`}
                    >
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-neutral-800 dark:text-neutral-200">Comprehensive Shield</span>
                        <span className="text-orange-600 dark:text-orange-400 font-bold text-[10px]">+₹499/day</span>
                      </div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                        Zero deductible, bumper-to-bumper damage protection.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pricing Summary */}
                <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-2 text-xs">
                  <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                    <span>Base Fare ({rentalDays} {rentalDays === 1 ? 'day' : 'days'})</span>
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">₹{baseRate.toLocaleString('en-IN')}</span>
                  </div>
                  {deliveryFee > 0 && (
                    <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                      <span>Doorstep Delivery</span>
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">₹{deliveryFee.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {insuranceFee > 0 && (
                    <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                      <span>Comprehensive Shield</span>
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">₹{insuranceFee.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                    <span>Platform Support & GST</span>
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">₹{serviceFee.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-baseline">
                    <span className="font-extrabold text-neutral-900 dark:text-white text-sm">Total Price</span>
                    <span className="text-xl font-black text-orange-600 dark:text-orange-400">₹{totalCost.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl text-xs font-black tracking-wide transition-all shadow-2xs cursor-pointer flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <span>Processing Reservation...</span>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-white" />
                      <span>Confirm Booking · ₹{totalCost.toLocaleString('en-IN')}</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
