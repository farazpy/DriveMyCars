import React, { useState, useEffect, useRef } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { MapPin, Search, Loader2, X, Check } from 'lucide-react';

export interface PlaceSelectResult {
  formattedAddress: string;
  displayName: string;
  lat?: number;
  lng?: number;
  city?: string;
  state?: string;
}

interface GooglePlaceAutocompleteInputProps {
  value: string;
  onChange: (val: string) => void;
  onPlaceSelect?: (place: PlaceSelectResult) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
  inputClassName?: string;
  icon?: React.ReactNode;
  types?: string[];
  helperText?: string;
}

export const GooglePlaceAutocompleteInput: React.FC<GooglePlaceAutocompleteInputProps> = ({
  value,
  onChange,
  onPlaceSelect,
  placeholder = 'Search address, locality, landmark or city...',
  label,
  required = false,
  className = '',
  inputClassName = '',
  icon,
  types,
  helperText,
}) => {
  const placesLib = useMapsLibrary('places');
  const sessionTokenRef = useRef<any>(null);

  const [inputVal, setInputVal] = useState(value);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external value
  useEffect(() => {
    setInputVal(value);
  }, [value]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions with debounce
  useEffect(() => {
    if (!placesLib || !inputVal || inputVal.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const { AutocompleteSessionToken, AutocompleteSuggestion } = placesLib as any;
    if (!sessionTokenRef.current && AutocompleteSessionToken) {
      sessionTokenRef.current = new AutocompleteSessionToken();
    }

    const debounceTimer = setTimeout(async () => {
      try {
        setIsLoading(true);
        if (AutocompleteSuggestion?.fetchAutocompleteSuggestions) {
          const request: any = {
            input: inputVal.trim(),
            sessionToken: sessionTokenRef.current,
            includedRegionCodes: ['in'], // Defaults to India for Charvi Rental
          };
          if (types && types.length > 0) {
            request.includedPrimaryTypes = types;
          }

          const res = await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
          if (res?.suggestions) {
            setSuggestions(res.suggestions);
            // ONLY open if the user is currently focused on THIS input
            if (document.activeElement === inputRef.current) {
              setIsOpen(true);
            }
          }
        }
      } catch (err) {
        console.warn('[Places Autocomplete] Suggestion fetch error or fallback:', err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(debounceTimer);
  }, [placesLib, inputVal, types]);

  const handleSelectSuggestion = async (suggestion: any) => {
    const mainText =
      suggestion.placePrediction?.mainText?.toString() ||
      suggestion.placePrediction?.text?.toString() ||
      '';
    const secondaryText = suggestion.placePrediction?.secondaryText?.toString() || '';
    const fullText = secondaryText ? `${mainText}, ${secondaryText}` : mainText;

    setInputVal(fullText);
    onChange(fullText);
    setIsOpen(false);
    setSuggestions([]);

    try {
      if (suggestion.placePrediction?.toPlace) {
        const place = suggestion.placePrediction.toPlace();
        await place.fetchFields({
          fields: ['displayName', 'formattedAddress', 'location', 'addressComponents'],
        });

        let lat: number | undefined;
        let lng: number | undefined;
        if (place.location) {
          lat = typeof place.location.lat === 'function' ? place.location.lat() : place.location.lat;
          lng = typeof place.location.lng === 'function' ? place.location.lng() : place.location.lng;
        }

        let extractedCity = '';
        let extractedState = '';
        if (Array.isArray(place.addressComponents)) {
          for (const comp of place.addressComponents) {
            const t = comp.types || [];
            if (t.includes('locality')) extractedCity = comp.longText || comp.shortText || '';
            else if (!extractedCity && t.includes('administrative_area_level_2')) {
              extractedCity = comp.longText || comp.shortText || '';
            }
            if (t.includes('administrative_area_level_1')) {
              extractedState = comp.longText || comp.shortText || '';
            }
          }
        }

        const resolvedAddress = place.formattedAddress || fullText;
        if (onPlaceSelect) {
          onPlaceSelect({
            formattedAddress: resolvedAddress,
            displayName: place.displayName || mainText,
            lat,
            lng,
            city: extractedCity || mainText,
            state: extractedState,
          });
        }
      } else {
        if (onPlaceSelect) {
          onPlaceSelect({
            formattedAddress: fullText,
            displayName: mainText,
          });
        }
      }
    } catch (err) {
      console.warn('[Places Autocomplete] Place detail fetch failed:', err);
      if (onPlaceSelect) {
        onPlaceSelect({
          formattedAddress: fullText,
          displayName: mainText,
        });
      }
    } finally {
      // Reset session token after selection per Google Places API guidelines
      sessionTokenRef.current = null;
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5 flex items-center justify-between">
          <span>
            {label} {required && <span className="text-orange-600">*</span>}
          </span>
          <span className="text-[10px] text-neutral-400 font-normal">Google Maps Live</span>
        </label>
      )}

      <div className="relative flex items-center">
        <span className="absolute left-3.5 text-neutral-400 flex items-center pointer-events-none">
          {icon || <Search className="w-4 h-4 text-orange-600" />}
        </span>

        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          required={required}
          onChange={(e) => {
            setInputVal(e.target.value);
            onChange(e.target.value);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className={`w-full pl-10 pr-9 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-2xs ${inputClassName}`}
        />

        <div className="absolute right-3 flex items-center space-x-1">
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-orange-600 animate-spin" />
          ) : inputVal ? (
            <button
              type="button"
              onClick={() => {
                setInputVal('');
                onChange('');
                setSuggestions([]);
                setIsOpen(false);
              }}
              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      {helperText && <p className="text-[10px] text-neutral-400 mt-1">{helperText}</p>}

      {/* Dropdown Suggestions */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-3 py-1.5 bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[10px] text-neutral-400 font-semibold">
            <span>Select Matching Address / Unit:</span>
            <span>Google Places</span>
          </div>

          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {suggestions.map((sugg, idx) => {
              const main =
                sugg.placePrediction?.mainText?.toString() ||
                sugg.placePrediction?.text?.toString() ||
                '';
              const secondary = sugg.placePrediction?.secondaryText?.toString() || '';

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSuggestion(sugg)}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-orange-50 dark:hover:bg-neutral-800 flex items-start space-x-2.5 transition-colors cursor-pointer group"
                >
                  <MapPin className="w-4 h-4 text-neutral-400 group-hover:text-orange-600 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-neutral-900 dark:text-white truncate group-hover:text-orange-600">
                      {main}
                    </p>
                    {secondary && (
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                        {secondary}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
