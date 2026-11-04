import React, { useState } from 'react';
import {
  X,
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
  MessageSquare,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { Car, Review } from '../types.ts';

interface CarDetailsModalProps {
  car: Car | null;
  isOpen: boolean;
  onClose: () => void;
  pickupDate: string;
  pickupTime: string;
  dropoffDate: string;
  dropoffTime: string;
  rentalDays: number;
  onBookNow: (car: Car) => void;
  onAddReview: (carId: string, rating: number, comment: string) => Promise<void>;
  currentUser: any;
}

export const CarDetailsModal: React.FC<CarDetailsModalProps> = ({
  car,
  isOpen,
  onClose,
  pickupDate,
  pickupTime,
  dropoffDate,
  dropoffTime,
  rentalDays,
  onBookNow,
  onAddReview,
  currentUser,
}) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);

  if (!isOpen || !car) return null;

  const images = car.images && car.images.length > 0 ? car.images : [car.image_url];
  const subtotal = car.price_per_day * rentalDays;
  const serviceFee = Math.round(subtotal * 0.05);
  const total = subtotal + serviceFee;

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewComment.trim()) return;
    setSubmittingReview(true);
    try {
      await onAddReview(car.id, newReviewRating, newReviewComment.trim());
      setNewReviewComment('');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl sm:rounded-3xl border border-neutral-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Sticky Header with Close */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-200 bg-white/95 backdrop-blur-sm z-10">
          <div>
            <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
              {car.year} {car.make}
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-neutral-900 leading-tight">
              {car.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6 flex-1">
          {/* Gallery View */}
          <div className="space-y-2">
            <div className="aspect-[16/9] w-full rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200">
              <img
                src={images[selectedImage]}
                alt={car.title}
                className="w-full h-full object-cover transition-all duration-300"
              />
            </div>
            {images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`w-20 h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      selectedImage === idx ? 'border-orange-600 scale-102' : 'border-neutral-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Specs Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-100 flex items-center space-x-3">
              <Fuel className="w-5 h-5 text-orange-600" />
              <div>
                <span className="text-[10px] text-neutral-400 uppercase font-bold block">Fuel / Energy</span>
                <span className="text-xs font-bold text-neutral-900">{car.fuel}</span>
              </div>
            </div>
            <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-100 flex items-center space-x-3">
              <Gauge className="w-5 h-5 text-orange-600" />
              <div>
                <span className="text-[10px] text-neutral-400 uppercase font-bold block">Transmission</span>
                <span className="text-xs font-bold text-neutral-900">{car.transmission}</span>
              </div>
            </div>
            <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-100 flex items-center space-x-3">
              <Users className="w-5 h-5 text-orange-600" />
              <div>
                <span className="text-[10px] text-neutral-400 uppercase font-bold block">Seating</span>
                <span className="text-xs font-bold text-neutral-900">{car.seats} Passengers</span>
              </div>
            </div>
            <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-100 flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-orange-600" />
              <div className="truncate">
                <span className="text-[10px] text-neutral-400 uppercase font-bold block">City Hub</span>
                <span className="text-xs font-bold text-neutral-900 truncate block">{car.city}</span>
              </div>
            </div>
          </div>

          {/* Two-Column Details & Right Checkout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Description & Features */}
            <div className="lg:col-span-7 space-y-6">
              {/* Host info badge */}
              <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={car.lender_avatar}
                    alt={car.lender_name}
                    className="w-12 h-12 rounded-full object-cover border border-neutral-200"
                  />
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-sm text-neutral-900">{car.lender_name}</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-xs text-neutral-500">Verified Host on Charvi Rental</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1 text-xs font-bold text-neutral-900">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                    <span>{car.rating.toFixed(2)}</span>
                  </div>
                  <span className="text-[10px] text-neutral-400">{car.reviews_count} reviews</span>
                </div>
              </div>

              {/* Features List */}
              <div>
                <h4 className="text-sm font-bold text-neutral-900 mb-3">Vehicle Features & Amenities</h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-neutral-700">
                  {car.features.map((feature, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Guidelines */}
              <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50 text-xs text-neutral-600 space-y-2">
                <h4 className="font-bold text-neutral-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-orange-600" />
                  <span>Host Rules & Handover Guidelines</span>
                </h4>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-neutral-500">
                  <li>Valid Driving Licence required at digital pickup inspection.</li>
                  <li>FASTag active for automated toll deductions on national highways.</li>
                  <li>Clean car guarantee: sanitized and inspected before every trip.</li>
                </ul>
              </div>

              {/* Reviews Section */}
              <div className="pt-4 border-t border-neutral-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-neutral-900 flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4 text-orange-600" />
                    <span>Guest Reviews ({car.reviews?.length || car.reviews_count})</span>
                  </h4>
                  <div className="flex items-center space-x-1 text-xs font-semibold text-neutral-700">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                    <span>{car.rating.toFixed(2)} rating</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {car.reviews && car.reviews.length > 0 ? (
                    car.reviews.map((rev) => (
                      <div key={rev.id} className="p-3.5 rounded-xl border border-neutral-200 bg-white space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <img
                              src={rev.user_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'}
                              alt={rev.user_name}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                            <span className="font-semibold text-neutral-900">{rev.user_name}</span>
                          </div>
                          <div className="flex text-amber-500">
                            {[...Array(rev.rating)].map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-amber-400" />
                            ))}
                          </div>
                        </div>
                        <p className="text-neutral-600 leading-relaxed">{rev.comment}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-neutral-400 italic">Be the first to review this car after your trip!</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Reservation Breakdown & Checkout Card */}
            <div className="lg:col-span-5">
              <div className="sticky top-4 bg-white rounded-2xl border border-neutral-200 p-5 space-y-4 shadow-sm">
                {/* Rate in INR */}
                <div className="flex items-baseline justify-between border-b border-neutral-100 pb-3">
                  <div>
                    <span className="text-2xl font-black text-neutral-900">₹{car.price_per_day.toLocaleString('en-IN')}</span>
                    <span className="text-xs text-neutral-500 font-medium"> / day</span>
                  </div>
                  {car.is_instant_book && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                      <Zap className="w-3 h-3 fill-orange-500" />
                      Instant Confirmation
                    </span>
                  )}
                </div>

                {/* Trip Itinerary Card */}
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-neutral-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-orange-600" />
                      Pick-up:
                    </span>
                    <span className="font-semibold text-neutral-900">{pickupDate} at {pickupTime}</span>
                  </div>
                  <div className="flex justify-between items-center text-neutral-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-orange-600" />
                      Drop-off:
                    </span>
                    <span className="font-semibold text-neutral-900">{dropoffDate} at {dropoffTime}</span>
                  </div>
                  <div className="pt-2 border-t border-neutral-200 flex justify-between font-bold text-neutral-800">
                    <span>Duration</span>
                    <span className="text-orange-600">{rentalDays} {rentalDays === 1 ? 'day' : 'days'}</span>
                  </div>
                </div>

                {/* Price Breakdown in INR */}
                <div className="space-y-2 text-xs text-neutral-600">
                  <div className="flex justify-between">
                    <span>₹{car.price_per_day.toLocaleString('en-IN')} × {rentalDays} days</span>
                    <span className="font-medium text-neutral-900">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform & GST Fee</span>
                    <span className="font-medium text-neutral-900">₹{serviceFee.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Standard Protection</span>
                    <span className="font-medium text-emerald-600">Included free (₹0)</span>
                  </div>
                  <div className="pt-3 border-t border-neutral-200 flex justify-between text-sm font-black text-neutral-900">
                    <span>Total Trip Cost</span>
                    <span className="text-orange-600 text-lg">₹{total.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Book Now Button */}
                <button
                  onClick={() => onBookNow(car)}
                  className="w-full py-3.5 px-4 bg-orange-600 hover:bg-orange-700 active:scale-98 text-white font-bold text-sm rounded-xl transition-all shadow-sm flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>{car.is_instant_book ? 'Instant Book' : 'Request to Book'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <p className="text-[11px] text-center text-neutral-400">
                  Free cancellation up to 6 hours before trip start.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
