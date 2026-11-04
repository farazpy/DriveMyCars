import React, { useState } from 'react';
import {
  Star,
  MapPin,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Heart,
  Scale
} from 'lucide-react';
import { Car } from '../types.ts';
import { useRouter } from '../router.tsx';

interface CarCardProps {
  car: Car;
  rentalDays: number;
  onSelect?: (car: Car) => void;
  onQuickBook?: (car: Car) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (car: Car) => void;
  isCompared?: boolean;
  onToggleCompare?: (car: Car) => void;
}

export const CarCard: React.FC<CarCardProps> = ({
  car,
  rentalDays,
  isWishlisted = false,
  onToggleWishlist,
  isCompared = false,
  onToggleCompare,
}) => {
  const { navigate } = useRouter();
  const [imageIndex, setImageIndex] = useState(0);
  const images = car.images && car.images.length > 0 ? car.images : [car.image_url];
  const totalPrice = car.price_per_day * rentalDays;

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleClick = () => {
    navigate(`/car/${car.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className={`group glass-card rounded-2xl sm:rounded-3xl flex flex-col overflow-hidden cursor-pointer relative transition-all duration-300 ${
        isCompared ? 'ring-2 ring-orange-500 border-orange-500' : ''
      }`}
    >
      {/* Vehicle Image Carousel (1:1 Aspect Ratio) */}
      <div className="relative aspect-square w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        <img
          src={images[imageIndex]}
          alt={car.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
        />

        {/* Subtle Glass Gradient Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Admin Assured Pill */}
        <div className="absolute top-2.5 left-2.5 bg-neutral-950/80 backdrop-blur-md text-white font-bold px-2 py-0.5 rounded-lg text-[8px] sm:text-[9px] uppercase tracking-wider shadow-xs flex items-center space-x-1 border border-white/15">
          <ShieldCheck className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-orange-400" />
          <span>Verified</span>
        </div>

        {/* Wishlist & Compare Quick Actions */}
        <div className="absolute top-2.5 right-2.5 flex items-center space-x-1.5 z-10">
          {onToggleCompare && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleCompare(car);
              }}
              title={isCompared ? 'Remove from comparison' : 'Compare vehicle side-by-side'}
              className={`p-1.5 rounded-xl backdrop-blur-md border transition-all cursor-pointer ${
                isCompared
                  ? 'bg-orange-600 text-white border-orange-400 shadow-md'
                  : 'bg-black/55 hover:bg-black/75 text-white border-white/15'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
            </button>
          )}

          {onToggleWishlist && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleWishlist(car);
              }}
              title={isWishlisted ? 'Remove from saved wishlist' : 'Save to wishlist'}
              className={`p-1.5 rounded-xl backdrop-blur-md border transition-all cursor-pointer ${
                isWishlisted
                  ? 'bg-rose-600 text-white border-rose-400 shadow-md'
                  : 'bg-black/55 hover:bg-black/75 text-white border-white/15'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-white' : ''}`} />
            </button>
          )}
        </div>

        {/* Carousel arrows (if multiple images) */}
        {images.length > 1 && (
          <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              type="button"
              onClick={prevImage}
              className="p-1.5 rounded-full bg-white/85 dark:bg-neutral-900/85 backdrop-blur-md text-neutral-800 dark:text-neutral-200 hover:bg-white hover:scale-110 active:scale-90 shadow-md transition-all duration-200 cursor-pointer"
            >
              <ChevronLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
            <button
              type="button"
              onClick={nextImage}
              className="p-1.5 rounded-full bg-white/85 dark:bg-neutral-900/85 backdrop-blur-md text-neutral-800 dark:text-neutral-200 hover:bg-white hover:scale-110 active:scale-90 shadow-md transition-all duration-200 cursor-pointer"
            >
              <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>
        )}

        {/* Carousel Dots */}
        {images.length > 1 && (
          <div className="absolute bottom-2 inset-x-0 flex justify-center space-x-1">
            {images.map((_, i) => (
              <span
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === imageIndex ? 'bg-white w-3 shadow-xs' : 'bg-white/50 w-1'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between space-y-2.5">
        <div>
          {/* Top row: Year & Type + Rating */}
          <div className="flex items-center justify-between text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-400">
            <span className="font-extrabold text-orange-600 dark:text-orange-400 uppercase tracking-wider text-[9px] sm:text-[10px] truncate max-w-[65%]">
              {car.year} · {car.type}
            </span>
            <div className="flex items-center space-x-0.5 font-bold text-neutral-800 dark:text-neutral-200 shrink-0 tabular-nums">
              <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
              <span>{car.rating.toFixed(1)}</span>
              <span className="text-neutral-400 font-normal text-[9px]">({car.reviews_count})</span>
            </div>
          </div>

          {/* Car Title */}
          <h3 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-200 mt-1 line-clamp-1">
            {car.title}
          </h3>

          {/* Location */}
          <div className="flex items-center space-x-1 text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            <MapPin className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-neutral-400 shrink-0" />
            <span className="truncate">{car.city || car.location}</span>
          </div>

          {/* Clean Unboxed Spec Metadata Line */}
          <div className="mt-2.5 pt-2.5 border-t border-neutral-100/80 dark:border-white/5 text-[10px] sm:text-[11px] font-medium text-neutral-600 dark:text-neutral-400 flex items-center justify-between truncate">
            <span>{car.fuel}</span>
            <span className="text-neutral-300 dark:text-neutral-700">·</span>
            <span>{car.transmission === 'Automatic' ? 'Auto' : 'Manual'}</span>
            <span className="text-neutral-300 dark:text-neutral-700">·</span>
            <span>{car.seats} Seats</span>
          </div>
        </div>

        {/* Bottom row: Host Info & Price */}
        <div className="pt-2.5 border-t border-neutral-100/80 dark:border-white/5 flex items-center justify-between gap-1">
          {/* Host info */}
          <div className="flex items-center space-x-1.5 min-w-0">
            <img
              src={car.lender_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'}
              alt={car.lender_name}
              className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover border border-neutral-200/80 dark:border-white/10 shrink-0"
            />
            <div className="text-[9px] sm:text-[10px] leading-tight truncate">
              <div className="flex items-center space-x-0.5 text-neutral-800 dark:text-neutral-200 font-bold truncate">
                <span className="truncate">{car.lender_name.split(' ')[0]}</span>
                <CheckCircle className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
              </div>
            </div>
          </div>

          {/* Pricing in INR */}
          <div className="text-right shrink-0 tabular-nums">
            <div className="flex items-baseline justify-end space-x-0.5">
              <span className="text-xs sm:text-sm font-black text-neutral-900 dark:text-white">
                ₹{car.price_per_day.toLocaleString('en-IN')}
              </span>
              <span className="text-[9px] sm:text-[10px] text-neutral-500 font-medium">/d</span>
            </div>
            <div className="text-[8px] sm:text-[9px] text-neutral-400">
              ₹{totalPrice.toLocaleString('en-IN')} ({rentalDays}d)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
