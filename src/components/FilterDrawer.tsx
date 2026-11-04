import React from 'react';
import { X, Check } from 'lucide-react';
import { FilterState } from '../types.ts';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onResetFilters: () => void;
  resultsCount: number;
}

const VEHICLE_TYPES = ['All', 'SUV', 'Sedan', 'Electric', 'Convertible', 'Luxury'];
const TRANSMISSIONS = ['All', 'Automatic', 'Manual'];
const FUELS = ['All', 'Diesel', 'Gasoline', 'Electric', 'Hybrid'];
const SEAT_OPTIONS = [
  { label: 'Any', value: 0 },
  { label: '2+', value: 2 },
  { label: '4+', value: 4 },
  { label: '5+', value: 5 },
  { label: '7+', value: 7 },
];

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onResetFilters,
  resultsCount,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-neutral-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-200 bg-neutral-50/80">
          <div>
            <h3 className="font-extrabold text-neutral-900 text-lg">Filter Fleet</h3>
            <p className="text-xs text-neutral-500">Refine by daily rate, fuel, transmission & seating</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable filter options */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Price Range in INR */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                Max Daily Rate
              </span>
              <span className="text-sm font-black text-orange-600">
                ₹{filters.maxPrice >= 25000 ? '25,000+' : filters.maxPrice.toLocaleString('en-IN')} / day
              </span>
            </div>
            <input
              type="range"
              min="1500"
              max="25000"
              step="500"
              value={filters.maxPrice}
              onChange={(e) => onFilterChange({ maxPrice: Number(e.target.value) })}
              className="w-full accent-orange-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-neutral-400 mt-1">
              <span>₹1,500/day</span>
              <span>₹10,000/day</span>
              <span>₹25,000+/day</span>
            </div>
          </div>

          {/* Vehicle Type */}
          <div>
            <label className="block text-xs font-bold text-neutral-900 uppercase tracking-wider mb-2">
              Vehicle Type
            </label>
            <div className="flex flex-wrap gap-2">
              {VEHICLE_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => onFilterChange({ type })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    filters.type === type
                      ? 'bg-orange-50 border-orange-500 text-orange-700 font-bold'
                      : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Transmission */}
          <div>
            <label className="block text-xs font-bold text-neutral-900 uppercase tracking-wider mb-2">
              Transmission
            </label>
            <div className="grid grid-cols-3 gap-2">
              {TRANSMISSIONS.map((t) => (
                <button
                  key={t}
                  onClick={() => onFilterChange({ transmission: t })}
                  className={`py-2 px-3 text-center text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                    filters.transmission === t
                      ? 'bg-orange-50 border-orange-500 text-orange-700 font-bold'
                      : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Fuel / Powertrain */}
          <div>
            <label className="block text-xs font-bold text-neutral-900 uppercase tracking-wider mb-2">
              Fuel & Powertrain
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {FUELS.map((fuel) => (
                <button
                  key={fuel}
                  onClick={() => onFilterChange({ fuel })}
                  className={`py-2 px-3 text-center text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                    filters.fuel === fuel
                      ? 'bg-orange-50 border-orange-500 text-orange-700 font-bold'
                      : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  {fuel}
                </button>
              ))}
            </div>
          </div>

          {/* Minimum Seats */}
          <div>
            <label className="block text-xs font-bold text-neutral-900 uppercase tracking-wider mb-2">
              Minimum Seats
            </label>
            <div className="grid grid-cols-5 gap-2">
              {SEAT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onFilterChange({ seats: opt.value })}
                  className={`py-2 text-center text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                    filters.seats === opt.value
                      ? 'bg-orange-50 border-orange-500 text-orange-700 font-bold'
                      : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between">
          <button
            onClick={onResetFilters}
            className="text-xs font-bold text-neutral-500 hover:text-orange-600 transition-colors cursor-pointer"
          >
            Reset All
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
          >
            Show {resultsCount} Vehicles
          </button>
        </div>
      </div>
    </div>
  );
};
