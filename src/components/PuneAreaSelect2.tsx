import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MapPin, Search, X, Check, Navigation, Loader2, Sparkles, Building2 } from 'lucide-react';
import { ALL_PUNE_AREAS, PuneArea } from '../data/puneAreas.ts';

interface PuneAreaSelect2Props {
  value: string;
  onChange: (location: string) => void;
  onDetectGps?: () => void;
  gpsLocating?: boolean;
  gpsMessage?: string | null;
  placeholder?: string;
  className?: string;
  cityName?: string;
}

const ZONES = ['All', 'Popular', 'IT Hubs & West', 'East Pune & IT', 'Central Pune', 'PCMC', 'South Pune'] as const;

export const PuneAreaSelect2: React.FC<PuneAreaSelect2Props> = ({
  value,
  onChange,
  onDetectGps,
  gpsLocating = false,
  gpsMessage = null,
  placeholder = 'Select or search area...',
  className = '',
  cityName = 'Pune',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState<string>('All');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Filtered areas calculation
  const filteredAreas = useMemo(() => {
    let result = ALL_PUNE_AREAS;

    if (selectedZone === 'Popular') {
      result = result.filter((a) => a.popular);
    } else if (selectedZone !== 'All') {
      result = result.filter((a) => a.zone === selectedZone);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.shortName.toLowerCase().includes(q) ||
          a.zone.toLowerCase().includes(q)
      );
    }

    return result;
  }, [searchQuery, selectedZone]);

  const handleSelect = (areaName: string) => {
    onChange(areaName);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchQuery('');
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Box */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-2xl pl-10 pr-10 py-3 text-xs sm:text-sm font-bold border transition-all cursor-pointer flex items-center justify-between shadow-2xs ${
          isOpen
            ? 'border-orange-500 ring-2 ring-orange-500/20 bg-white dark:bg-neutral-800'
            : 'border-neutral-200 dark:border-neutral-700/80'
        }`}
      >
        <MapPin className="w-4 h-4 text-orange-600 dark:text-orange-400 absolute left-3.5 top-3.5 shrink-0" />
        <span className="truncate flex-1 text-left">
          {value || <span className="text-neutral-400 font-normal">{placeholder}</span>}
        </span>

        {value ? (
          <button
            type="button"
            onClick={handleClear}
            title="Clear Area Selection"
            className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 absolute right-3 top-2.5 cursor-pointer rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/60 px-2 py-0.5 rounded-md border border-orange-200 dark:border-orange-800 shrink-0">
            Select2
          </span>
        )}
      </div>

      {/* Select2 Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl z-[150] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          
          {/* Header & Search Bar */}
          <div className="p-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/90 dark:bg-neutral-950/90 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-neutral-900 dark:text-white">
                <Building2 className="w-4 h-4 text-orange-600" />
                <span>Select {cityName} Pickup Area {cityName === 'Pune' ? `(${ALL_PUNE_AREAS.length} Areas)` : ''}</span>
              </div>
              {onDetectGps && (
                <button
                  type="button"
                  onClick={() => {
                    onDetectGps();
                    setIsOpen(false);
                  }}
                  disabled={gpsLocating}
                  className="text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center space-x-1 cursor-pointer bg-orange-50 dark:bg-orange-950/50 px-2.5 py-1 rounded-lg border border-orange-200 dark:border-orange-800"
                >
                  {gpsLocating ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Navigation className="w-3 h-3" />
                  )}
                  <span>{gpsLocating ? 'Detecting...' : 'Use GPS Location'}</span>
                </button>
              )}
            </div>

            {/* Live Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-3" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search area e.g. Baner, Kharadi, Kothrud, Airport..."
                className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl pl-9 pr-8 py-2 text-xs font-semibold text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Zone Filter Chips */}
            <div className="flex space-x-1 overflow-x-auto pb-1 text-[10px] font-bold scrollbar-none">
              {ZONES.map((zone) => (
                <button
                  key={zone}
                  type="button"
                  onClick={() => setSelectedZone(zone)}
                  className={`px-2.5 py-1 rounded-lg shrink-0 cursor-pointer transition-colors ${
                    selectedZone === zone
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                  }`}
                >
                  {zone}
                </button>
              ))}
            </div>
          </div>

          {/* Area Options List */}
          <div className="max-h-64 overflow-y-auto py-1 divide-y divide-neutral-100/60 dark:divide-neutral-800/60">
            {filteredAreas.length > 0 ? (
              filteredAreas.map((area) => {
                const isSelected = value.toLowerCase() === area.name.toLowerCase() || value.toLowerCase() === area.shortName.toLowerCase();
                return (
                  <button
                    key={area.name}
                    type="button"
                    onClick={() => handleSelect(area.name)}
                    className={`w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-orange-50/60 dark:hover:bg-orange-950/40 transition-colors cursor-pointer group ${
                      isSelected
                        ? 'bg-orange-50 dark:bg-orange-950/60 text-orange-900 dark:text-orange-200 font-bold'
                        : 'text-neutral-800 dark:text-neutral-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-orange-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 group-hover:text-orange-600'
                      }`}>
                        <MapPin className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold block truncate">{area.name}</span>
                        <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium block">
                          {area.zone} {area.popular && '• Popular Hub'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0 ml-2">
                      {area.popular && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 uppercase">
                          Popular
                        </span>
                      )}
                      {isSelected && <Check className="w-4 h-4 text-orange-600 shrink-0 ml-1" />}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center space-y-2">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 italic">
                  No predefined area match for "{searchQuery}".
                </p>
                {searchQuery.trim() && (
                  <button
                    type="button"
                    onClick={() => handleSelect(`${searchQuery.trim()}, Pune`)}
                    className="px-3 py-1.5 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Use "{searchQuery.trim()}, Pune" as Location</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="px-3.5 py-2 bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-center text-[10px] text-neutral-400">
            <span>Showing {filteredAreas.length} of {ALL_PUNE_AREAS.length} areas</span>
            <span>Free Doorstep Delivery at Pune Hubs</span>
          </div>

        </div>
      )}
    </div>
  );
};
