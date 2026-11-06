import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  X,
  Zap,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Loader2,
  Navigation,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { FilterState } from '../types.ts';
import { usePlatformSettings } from '../context/PlatformSettingsContext.tsx';
import { PuneAreaSelect2 } from './PuneAreaSelect2.tsx';

interface HeroSearchBarProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onResetFilters: () => void;
  totalResultsCount: number;
  onFind: () => void;
}

const POPULAR_PUNE_AREAS = [
  'Wakad, Pune',
  'Baner, Pune',
  'Koregaon Park, Pune',
  'Hinjawadi Phase 1, Pune',
  'Kharadi, Pune',
  'Pimple Saudagar, Pune',
  'Viman Nagar, Pune',
  'Kothrud, Pune',
];

export const HeroSearchBar: React.FC<HeroSearchBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  totalResultsCount,
  onFind,
}) => {
  const { settings } = usePlatformSettings();
  const availableCities = settings.available_cities || ['Pune', 'Mumbai', 'Bangalore', 'Delhi NCR', 'Goa', 'Hyderabad'];
  
  const [gpsLocating, setGpsLocating] = useState(false);
  const [gpsMessage, setGpsMessage] = useState<string | null>(null);

  // Calculate rental duration
  const calculateDays = () => {
    try {
      const start = new Date(`${filters.pickupDate}T${filters.pickupTime}`);
      const end = new Date(`${filters.dropoffDate}T${filters.dropoffTime}`);
      const diffTime = Math.max(0, end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 1;
    } catch {
      return 1;
    }
  };

  const rentalDays = calculateDays();

  // GPS Geolocation Detection
  const handleDetectLocation = () => {
    setGpsLocating(true);
    setGpsMessage('Locating...');

    const fallbackTimer = setTimeout(() => {
      onFilterChange({ location: 'Wakad, Pune' });
      setGpsMessage('Location set: Wakad, Pune');
      setGpsLocating(false);
      setTimeout(() => setGpsMessage(null), 3000);
    }, 2000);

    if (!navigator.geolocation) {
      clearTimeout(fallbackTimer);
      onFilterChange({ location: 'Wakad, Pune' });
      setGpsMessage('Location set: Wakad, Pune');
      setGpsLocating(false);
      setTimeout(() => setGpsMessage(null), 3000);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        clearTimeout(fallbackTimer);
        const { latitude, longitude } = pos.coords;
        let detectedCity = '';

        try {
          const controller = new AbortController();
          const reqTimeout = setTimeout(() => controller.abort(), 1500);
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { signal: controller.signal }
          );
          clearTimeout(reqTimeout);

          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const suburb = addr.suburb || addr.neighbourhood || addr.city_district || addr.road || '';
            if (suburb) {
              detectedCity = `${suburb}, Pune`;
            } else {
              detectedCity = 'Wakad, Pune';
            }
          }
        } catch {
          detectedCity = 'Wakad, Pune';
        }

        const finalLoc = detectedCity || 'Wakad, Pune';
        onFilterChange({ location: finalLoc });
        setGpsMessage(`Location: ${finalLoc}`);
        setGpsLocating(false);
        setTimeout(() => setGpsMessage(null), 3000);
      },
      () => {
        clearTimeout(fallbackTimer);
        onFilterChange({ location: 'Wakad, Pune' });
        setGpsMessage('Location: Wakad, Pune');
        setGpsLocating(false);
        setTimeout(() => setGpsMessage(null), 3000);
      },
      { timeout: 1800, enableHighAccuracy: true, maximumAge: 60000 }
    );
  };

  const handleSearchClick = () => {
    onFind();
    const fleetElement = document.getElementById('fleet-section');
    if (fleetElement) {
      fleetElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full bg-white dark:bg-neutral-950 border-b border-neutral-200/70 dark:border-neutral-800 transition-colors py-10 sm:py-14">
      <div className="w-full px-4 sm:px-8 lg:px-12">
        
        {/* 2-COLUMN LAYOUT: TEXT CONTENT ON LEFT, SIMPLE SEARCH FORM ON RIGHT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* LEFT COLUMN: BRAND TEXT CONTENT */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Category Badge */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
              <span>Premium Self-Drive Fleet · Zero Security Deposit · Available in {availableCities.length} Cities</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-neutral-950 dark:text-white tracking-tight leading-[1.12]">
              Rent extraordinary cars <span className="text-orange-600">on your terms</span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 font-normal max-w-xl leading-relaxed">
              Skip traditional rental counters. Book verified self-drive cars directly from vetted local hosts with doorstep delivery across {availableCities.join(', ')}.
            </p>

            {/* Highlights List */}
            <div className="space-y-2.5 pt-1 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 font-medium">
              <div className="flex items-center space-x-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span><strong>Zero security deposit</strong> on all verified member reservations</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span><strong>Active FASTag included</strong> with seamless cashless toll payments</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span><strong>Doorstep delivery & pick-up</strong> across all operational cities</span>
              </div>
            </div>

            <div className="inline-flex items-center space-x-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400 pt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{totalResultsCount} verified vehicles currently ready for instant booking in {availableCities.length} hubs</span>
            </div>

          </div>

          {/* RIGHT COLUMN: CLEAR, SIMPLE SEARCH FORM (NO FILTERS IN HERO) */}
          <div className="lg:col-span-5 w-full">
            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-7 shadow-xl shadow-neutral-900/5 dark:shadow-black/40 border border-neutral-200/90 dark:border-neutral-800 transition-all duration-200">
              
              <div className="mb-5">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-950 dark:text-white">
                  Search Available Cars
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Enter your location & dates to browse available fleet
                </p>
              </div>

              <div className="space-y-4">
                
                {/* 0. SELECT CITY */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                      Operational City
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableCities.map(city => (
                        <button
                          key={city}
                          type="button"
                          onClick={() => onFilterChange({ location: city })}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                            filters.location.toLowerCase().includes(city.toLowerCase())
                              ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                              : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:border-orange-500'
                          }`}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 1. PICK-UP LOCATION (SELECT2 COMPONENT) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      Specific Area / Hub (e.g. Wakad, Airport)
                    </label>
                  </div>

                  <PuneAreaSelect2
                    value={filters.location}
                    onChange={(loc) => onFilterChange({ location: loc })}
                    onDetectGps={handleDetectLocation}
                    gpsLocating={gpsLocating}
                    gpsMessage={gpsMessage}
                    cityName={availableCities.find(c => filters.location.includes(c)) || 'Pune'}
                  />

                  {gpsMessage && (
                    <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                      <span>{gpsMessage}</span>
                    </p>
                  )}
                </div>

                {/* QUICK AREA BUTTONS */}
                <div>
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="text-neutral-400 font-semibold mr-0.5">Quick Hubs:</span>
                    {POPULAR_PUNE_AREAS.slice(0, 5).map((area) => {
                      const areaName = area.split(',')[0];
                      const active = filters.location.toLowerCase().includes(areaName.toLowerCase());
                      return (
                        <button
                          key={area}
                          type="button"
                          onClick={() => onFilterChange({ location: area })}
                          className={`px-2 py-0.5 rounded-lg font-semibold transition-all cursor-pointer ${
                            active
                              ? 'bg-orange-600 text-white shadow-2xs'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                          }`}
                        >
                          {areaName}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. DATES: PICK-UP & DROP-OFF */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Pick-up */}
                  <div className="border border-neutral-200 dark:border-neutral-750 rounded-2xl p-3 bg-neutral-50 dark:bg-neutral-800/80">
                    <label className="block text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1">
                      Pick-up Date & Time
                    </label>
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 shrink-0" />
                        <input
                          type="date"
                          value={filters.pickupDate}
                          onChange={(e) => onFilterChange({ pickupDate: e.target.value })}
                          className="w-full bg-transparent text-xs font-bold text-neutral-900 dark:text-neutral-100 focus:outline-none cursor-pointer"
                        />
                      </div>
                      <div className="flex items-center space-x-1.5 pt-1 border-t border-neutral-200/80 dark:border-neutral-700/80">
                        <Clock className="w-3 h-3 text-neutral-400 shrink-0" />
                        <input
                          type="time"
                          value={filters.pickupTime}
                          onChange={(e) => onFilterChange({ pickupTime: e.target.value })}
                          className="w-full bg-transparent text-xs font-semibold text-neutral-800 dark:text-neutral-200 focus:outline-none cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Drop-off */}
                  <div className="border border-neutral-200 dark:border-neutral-750 rounded-2xl p-3 bg-neutral-50 dark:bg-neutral-800/80">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                        Drop-off Date & Time
                      </label>
                      <span className="text-[10px] font-extrabold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/60 px-1.5 py-0.2 rounded">
                        {rentalDays} {rentalDays === 1 ? 'day' : 'days'}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 shrink-0" />
                        <input
                          type="date"
                          value={filters.dropoffDate}
                          onChange={(e) => onFilterChange({ dropoffDate: e.target.value })}
                          className="w-full bg-transparent text-xs font-bold text-neutral-900 dark:text-neutral-100 focus:outline-none cursor-pointer"
                        />
                      </div>
                      <div className="flex items-center space-x-1.5 pt-1 border-t border-neutral-200/80 dark:border-neutral-700/80">
                        <Clock className="w-3 h-3 text-neutral-400 shrink-0" />
                        <input
                          type="time"
                          value={filters.dropoffTime}
                          onChange={(e) => onFilterChange({ dropoffTime: e.target.value })}
                          className="w-full bg-transparent text-xs font-semibold text-neutral-800 dark:text-neutral-200 focus:outline-none cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                </div>

                {/* 3. PRIMARY ACTION: SEARCH CARS CTA */}
                <button
                  type="button"
                  onClick={handleSearchClick}
                  className="btn-shine w-full bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white font-black py-4 rounded-2xl text-sm sm:text-base shadow-md shadow-orange-600/25 hover:shadow-orange-600/35 transition-all duration-200 cursor-pointer flex items-center justify-center space-x-2 mt-2 border-0"
                >
                  <Zap className="w-4 h-4 fill-white" />
                  <span>Search Available Cars</span>
                </button>

                {/* Bottom link: Reset */}
                <div className="flex items-center justify-between pt-1 text-xs text-neutral-400">
                  <span>Zero security deposit</span>
                  <button
                    type="button"
                    onClick={onResetFilters}
                    className="flex items-center space-x-1 text-neutral-500 hover:text-orange-600 dark:hover:text-orange-400 font-semibold cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset dates</span>
                  </button>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
