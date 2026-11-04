import React, { useState } from 'react';
import {
  Car as CarIcon,
  PlusCircle,
  CalendarCheck,
  Star,
  Settings,
  Trash2,
  CheckCircle2,
  Clock,
  Zap,
  MapPin,
  X,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  TrendingUp
} from 'lucide-react';
import { Car, Booking, UserProfile } from '../types.ts';

interface LenderPortalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  cars: Car[];
  bookings: Booking[];
  onAddCar: (carData: any) => Promise<void>;
  onUpdateCar: (carId: string, updates: Partial<Car>) => Promise<void>;
  onDeleteCar: (carId: string) => Promise<void>;
  onUpdateBookingStatus: (bookingId: string, status: string) => Promise<void>;
  onOpenListCarModal: () => void;
}

export const LenderPortal: React.FC<LenderPortalProps> = ({
  isOpen,
  onClose,
  user,
  cars,
  bookings,
  onAddCar,
  onUpdateCar,
  onDeleteCar,
  onUpdateBookingStatus,
  onOpenListCarModal,
}) => {
  const [activeTab, setActiveTab] = useState<'fleet' | 'bookings'>('fleet');

  if (!isOpen) return null;

  // Filter cars owned by this lender
  const lenderCars = user ? cars.filter((c) => c.lender_id === user.id) : [];
  const displayCars = lenderCars.length > 0 ? lenderCars : cars.slice(0, 4);

  // Filter bookings for this lender's cars
  const lenderBookings = user ? bookings.filter((b) => b.lender_id === user.id) : bookings;

  // Compute stats
  const totalEarnings = lenderBookings.reduce((sum, b) => sum + (Number(b.total_price) * 0.9), 0);
  const activeBookingsCount = lenderBookings.filter((b) => b.status === 'confirmed' || b.status === 'active').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl sm:rounded-3xl border border-neutral-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-200 bg-neutral-50/80">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-orange-600 text-white shadow-2xs">
              <CarIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg sm:text-xl font-extrabold text-neutral-900">
                  Lender Fleet Dashboard
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700 uppercase">
                  Host Mode
                </span>
              </div>
              <p className="text-xs text-neutral-500">
                Manage your leased vehicles, monitor incoming reservations & view earnings
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:p-6 bg-neutral-50 border-b border-neutral-200 text-xs">
          <div className="p-3.5 rounded-xl border border-neutral-200 bg-white">
            <span className="text-neutral-400 font-semibold block text-[11px] uppercase">My Fleet</span>
            <div className="flex items-baseline space-x-1 mt-1">
              <span className="text-xl font-black text-neutral-900">{lenderCars.length}</span>
              <span className="text-neutral-500">vehicles</span>
            </div>
          </div>
          <div className="p-3.5 rounded-xl border border-neutral-200 bg-white">
            <span className="text-neutral-400 font-semibold block text-[11px] uppercase">Active Bookings</span>
            <div className="flex items-baseline space-x-1 mt-1">
              <span className="text-xl font-black text-orange-600">{activeBookingsCount}</span>
              <span className="text-neutral-500">trips</span>
            </div>
          </div>
          <div className="p-3.5 rounded-xl border border-neutral-200 bg-white">
            <span className="text-neutral-400 font-semibold block text-[11px] uppercase">Net Host Earnings</span>
            <div className="flex items-baseline space-x-1 mt-1">
              <span className="text-xl font-black text-emerald-600">₹{Math.round(totalEarnings).toLocaleString('en-IN')}</span>
              <span className="text-neutral-400 text-[10px]">(90% payout)</span>
            </div>
          </div>
          <div className="p-3.5 rounded-xl border border-neutral-200 bg-white">
            <span className="text-neutral-400 font-semibold block text-[11px] uppercase">Host Quality</span>
            <div className="flex items-baseline space-x-1 mt-1">
              <span className="text-xl font-black text-neutral-900">4.98</span>
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            </div>
          </div>
        </div>

        {/* Tab Switcher & Action button */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-neutral-200">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('fleet')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'fleet'
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              My Vehicles ({displayCars.length})
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'bookings'
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              Rental Bookings ({lenderBookings.length})
            </button>
          </div>

          <button
            onClick={onOpenListCarModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-2xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>List a New Car</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'fleet' ? (
            <div className="space-y-3">
              {displayCars.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-neutral-200 bg-white hover:border-neutral-300 transition-colors gap-4"
                >
                  <div className="flex items-center space-x-4">
                    <img
                      src={c.image_url}
                      alt={c.title}
                      className="w-20 h-16 rounded-xl object-cover border border-neutral-200 shrink-0"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-bold text-neutral-900 text-sm">{c.title}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 font-semibold text-neutral-600">
                          {c.year} · {c.type}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-neutral-500 mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-neutral-400" />
                          {c.city}
                        </span>
                        <span>·</span>
                        <span className="font-bold text-neutral-900">₹{c.price_per_day.toLocaleString('en-IN')} / day</span>
                        <span>·</span>
                        <span className="flex items-center gap-1 text-amber-600 font-medium">
                          <Star className="w-3 h-3 fill-amber-400" />
                          {c.rating} ({c.reviews_count} reviews)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions for this car */}
                  <div className="flex items-center space-x-3 border-t sm:border-t-0 pt-2 sm:pt-0 justify-end">
                    <button
                      onClick={() => onUpdateCar(c.id, { is_available: !c.is_available })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                        c.is_available
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${c.is_available ? 'bg-emerald-500' : 'bg-neutral-400'}`} />
                      <span>{c.is_available ? 'Active (Live)' : 'Paused'}</span>
                    </button>

                    <button
                      onClick={() => onDeleteCar(c.id)}
                      title="Delete listing"
                      className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {lenderBookings.length === 0 ? (
                <div className="text-center py-10 text-neutral-400 text-xs">
                  No rental bookings yet. When guests reserve your car, they will appear here!
                </div>
              ) : (
                lenderBookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-2xl border border-neutral-200 bg-white space-y-3 text-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="font-mono text-[10px] text-neutral-400 block">{b.id}</span>
                        <h4 className="font-bold text-neutral-900 text-sm">{b.car_title}</h4>
                      </div>
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase w-fit ${
                          b.status === 'confirmed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : b.status === 'active'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-neutral-50 p-3 rounded-xl border border-neutral-100 text-neutral-600">
                      <div>
                        <span className="text-[10px] text-neutral-400 font-semibold block uppercase">Guest Renter</span>
                        <span className="font-bold text-neutral-800">{b.renter_name}</span>
                        <span className="block text-[11px] text-neutral-500">{b.renter_email}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-400 font-semibold block uppercase">Trip Schedule</span>
                        <span className="font-medium text-neutral-800">{b.pickup_datetime.replace('T', ' ')}</span>
                        <span className="block text-neutral-500">to {b.dropoff_datetime.replace('T', ' ')}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-400 font-semibold block uppercase">Host Payout</span>
                        <span className="font-bold text-emerald-600 text-sm">
                          ₹{Math.round(Number(b.total_price) * 0.9).toLocaleString('en-IN')}
                        </span>
                        <span className="block text-[10px] text-neutral-400">Total: ₹{Number(b.total_price).toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {b.status === 'confirmed' && (
                      <div className="flex justify-end space-x-2 pt-1">
                        <button
                          onClick={() => onUpdateBookingStatus(b.id, 'completed')}
                          className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Mark Trip Completed
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
