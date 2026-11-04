import React from 'react';
import {
  X,
  CalendarCheck,
  Calendar,
  Clock,
  Car as CarIcon,
  ShieldCheck,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { Booking } from '../types.ts';

interface RenterBookingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: Booking[];
  onOpenCarDetails?: (carId: string) => void;
}

export const RenterBookingsModal: React.FC<RenterBookingsModalProps> = ({
  isOpen,
  onClose,
  bookings,
  onOpenCarDetails,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl sm:rounded-3xl border border-neutral-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-200 bg-neutral-50/80">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-orange-600 text-white shadow-2xs">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-neutral-900 text-lg">My Car Bookings & Trips</h3>
              <p className="text-xs text-neutral-500">Verified contactless reservations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bookings List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {bookings.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mx-auto border border-orange-200">
                <CarIcon className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-neutral-800 text-sm">No reservations yet</h4>
              <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                Explore our available fleet across Indian cities, select your dates, and book your first drive!
              </p>
            </div>
          ) : (
            bookings.map((booking) => (
              <div
                key={booking.id}
                className="p-4 rounded-2xl border border-neutral-200 bg-white hover:border-neutral-300 transition-colors space-y-3 text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3">
                  <div className="flex items-center space-x-3">
                    <img
                      src={booking.car_image || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80'}
                      alt={booking.car_title}
                      className="w-16 h-12 rounded-xl object-cover border border-neutral-200"
                    />
                    <div>
                      <span className="font-mono text-[10px] text-neutral-400 block">{booking.id}</span>
                      <h4 className="font-bold text-neutral-900 text-sm">{booking.car_title}</h4>
                    </div>
                  </div>
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase w-fit ${
                      booking.status === 'confirmed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : booking.status === 'active'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    {booking.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-neutral-50 p-3 rounded-xl border border-neutral-100 text-neutral-600">
                  <div>
                    <span className="text-[10px] text-neutral-400 font-semibold uppercase block">Pick-up</span>
                    <span className="font-semibold text-neutral-900">{booking.pickup_datetime.replace('T', ' ')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 font-semibold uppercase block">Drop-off</span>
                    <span className="font-semibold text-neutral-900">{booking.dropoff_datetime.replace('T', ' ')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 font-semibold uppercase block">Total Price</span>
                    <span className="font-bold text-orange-600 text-sm">₹{Number(booking.total_price).toLocaleString('en-IN')}</span>
                    <span className="text-neutral-400 text-[10px] block">({booking.total_days} days · {booking.insurance_plan})</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[11px] text-neutral-500 pt-1">
                  <span>Reserved on {new Date(booking.created_at).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1 text-emerald-600 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Trip Protection Active
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
