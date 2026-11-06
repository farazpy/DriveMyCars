import React, { useState, useEffect } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  Circle,
  useMap
} from '@vis.gl/react-google-maps';
import { MapPin, Navigation, Compass, Sliders, CheckCircle2, Building2 } from 'lucide-react';
import { GooglePlaceAutocompleteInput } from './GooglePlaceAutocompleteInput.tsx';

interface CityHubRadiusMapProps {
  city: string;
  onCityChange: (city: string) => void;
  pickupAddress: string;
  onPickupAddressChange: (address: string) => void;
  radiusKm: number;
  onRadiusKmChange: (radius: number) => void;
  hubArea: string;
  onHubAreaChange: (area: string) => void;
  coords: { lat: number; lng: number };
  onCoordsChange: (coords: { lat: number; lng: number }) => void;
  availableCities: string[];
}

// Preset hubs for Pune and nearby regions
const PUNE_PRESET_HUBS = [
  {
    name: 'Pimpri-Chinchwad',
    radiusKm: 4,
    coords: { lat: 18.6298, lng: 73.7997 },
    sampleAddress: 'Chinchwad Station Road, Pimpri-Chinchwad, Pune 411019',
    description: '4 km radius covering Akurdi, Nigdi & Thergaon',
  },
  {
    name: 'Wakad',
    radiusKm: 3,
    coords: { lat: 18.5987, lng: 73.7684 },
    sampleAddress: 'Datta Mandir Road, Wakad, Pune, Maharashtra 411057',
    description: '3 km radius covering Wakad, Hinjawadi Bridge & Dange Chowk',
  },
  {
    name: 'Hinjawadi Phase 1',
    radiusKm: 5,
    coords: { lat: 18.5913, lng: 73.7389 },
    sampleAddress: 'Rajiv Gandhi Infotech Park, Hinjawadi Phase 1, Pune 411057',
    description: '5 km radius covering all Tech Parks & Mann Road',
  },
  {
    name: 'Baner - Balewadi',
    radiusKm: 3,
    coords: { lat: 18.5590, lng: 73.7868 },
    sampleAddress: 'High Street, Baner Road, Pune 411045',
    description: '3 km radius covering Balewadi High Street & Pashan',
  },
  {
    name: 'Viman Nagar / Airport',
    radiusKm: 4,
    coords: { lat: 18.5679, lng: 73.9143 },
    sampleAddress: 'Phoenix Market City Area, Viman Nagar, Pune 411014',
    description: '4 km radius covering Airport, Kalyani Nagar & Kharadi',
  },
  {
    name: 'Kothrud / Karve Road',
    radiusKm: 3,
    coords: { lat: 18.5074, lng: 73.8077 },
    sampleAddress: 'Paud Road, Kothrud, Pune, Maharashtra 411038',
    description: '3 km radius covering Karvenagar & Warje',
  },
];

const RADIUS_OPTIONS = [1, 2, 3, 4, 5, 8, 10];

// Internal map controller helper
const MapController: React.FC<{ center: { lat: number; lng: number }; zoom?: number }> = ({ center, zoom = 13 }) => {
  const map = useMap();
  useEffect(() => {
    if (map) {
      map.panTo(center);
    }
  }, [center, map]);
  return null;
};

export const CityHubRadiusMap: React.FC<CityHubRadiusMapProps> = ({
  city,
  onCityChange,
  pickupAddress,
  onPickupAddressChange,
  radiusKm,
  onRadiusKmChange,
  hubArea,
  onHubAreaChange,
  coords,
  onCoordsChange,
  availableCities,
}) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  const [activePreset, setActivePreset] = useState<string>(hubArea || 'Wakad');

  const handleSelectPreset = (hub: typeof PUNE_PRESET_HUBS[0]) => {
    setActivePreset(hub.name);
    onHubAreaChange(hub.name);
    onRadiusKmChange(hub.radiusKm);
    onCoordsChange(hub.coords);
    if (!pickupAddress || pickupAddress.includes('Wakad') || pickupAddress.includes('Pimpri')) {
      onPickupAddressChange(hub.sampleAddress);
    }
  };

  const handleMapClick = (e: any) => {
    if (e.detail?.latLng) {
      const newLat = e.detail.latLng.lat;
      const newLng = e.detail.latLng.lng;
      onCoordsChange({ lat: newLat, lng: newLng });
      setActivePreset('Custom Location');
      onHubAreaChange(`Custom Pin (${newLat.toFixed(4)}, ${newLng.toFixed(4)})`);
    }
  };

  return (
    <div className="space-y-4">
      {/* City Hub Selection & Primary Operational Unit with Google Maps Autocomplete */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
            Operating City
          </label>
          <div className="relative">
            <Building2 className="w-4 h-4 text-orange-600 absolute left-3.5 top-3.5" />
            <select
              value={city}
              onChange={(e) => onCityChange(e.target.value)}
              className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl pl-10 pr-4 py-3 text-xs font-bold text-neutral-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none appearance-none"
            >
              {availableCities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <p className="text-[10px] text-neutral-500 mt-1">Select from platform-approved operational cities.</p>
        </div>

        <div>
          <GooglePlaceAutocompleteInput
            label="Primary Operational Unit / Neighborhood Hub"
            value={hubArea || activePreset}
            onChange={(val) => {
              onHubAreaChange(val);
              setActivePreset(val);
            }}
            onPlaceSelect={(place) => {
              const name = place.displayName || place.formattedAddress.split(',')[0];
              onHubAreaChange(name);
              setActivePreset(name);
              if (place.lat && place.lng) {
                onCoordsChange({ lat: place.lat, lng: place.lng });
              }
              if (!pickupAddress) {
                onPickupAddressChange(place.formattedAddress);
              }
            }}
            placeholder="Search operational unit (e.g. Wakad, Hinjawadi Phase 1, Baner...)"
            icon={<Building2 className="w-4 h-4 text-orange-600" />}
            helperText="Primary fleet hub unit with live Google Maps place prediction."
          />
        </div>
      </div>

      {/* Quick Location Hub Presets */}
      <div>
        <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-2 flex items-center justify-between">
          <span>Quick Select Location Hub & Delivery Radius:</span>
          <span className="text-[10px] text-orange-600 font-semibold">Google Maps Live Integration</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PUNE_PRESET_HUBS.map((hub) => {
            const isSelected = activePreset === hub.name;
            return (
              <button
                key={hub.name}
                type="button"
                onClick={() => handleSelectPreset(hub)}
                className={`p-2.5 text-left rounded-xl border transition-all text-xs cursor-pointer ${
                  isSelected
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/40 text-orange-900 dark:text-orange-200 ring-2 ring-orange-500/20'
                    : 'border-neutral-200 dark:border-neutral-750 bg-white dark:bg-neutral-800 hover:border-orange-300 text-neutral-800 dark:text-neutral-200'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-[11px] mb-0.5">
                  <span className="truncate">{hub.name}</span>
                  <span className="px-1.5 py-0.5 rounded-md bg-orange-100 dark:bg-orange-900/60 text-orange-700 dark:text-orange-300 text-[10px]">
                    {hub.radiusKm} km
                  </span>
                </div>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 line-clamp-1">{hub.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Radius Adjuster Pills */}
      <div className="p-3 bg-neutral-50 dark:bg-neutral-900/60 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-orange-600" />
            Set Doorstep Delivery Radius:
          </span>
          <span className="text-xs font-black text-orange-600 bg-orange-50 dark:bg-orange-950/60 px-2 py-0.5 rounded-lg border border-orange-200 dark:border-orange-900">
            {radiusKm} KM Radius
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {RADIUS_OPTIONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onRadiusKmChange(r)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                radiusKm === r
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100'
              }`}
            >
              {r} Km
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Google Map with Radius Circle Overlay */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-orange-600" />
            Google Map Hub Zone (Click anywhere on map to reposition hub center)
          </span>
          <span className="text-[10px] text-neutral-500 font-mono">
            Lat: {coords.lat.toFixed(4)}, Lng: {coords.lng.toFixed(4)}
          </span>
        </div>

        <div className="relative w-full h-72 sm:h-80 rounded-2xl overflow-hidden border-2 border-neutral-200 dark:border-neutral-700 shadow-xs">
          <APIProvider apiKey={apiKey}>
            <Map
              defaultCenter={coords}
              defaultZoom={13}
              gestureHandling="greedy"
              disableDefaultUI={false}
              mapId="DEMO_MAP_ID"
              className="w-full h-full"
              onClick={handleMapClick}
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            >
              <MapController center={coords} zoom={radiusKm <= 3 ? 14 : radiusKm <= 5 ? 13 : 12} />

              {/* Service Delivery Radius Circle */}
              <Circle
                center={coords}
                radius={radiusKm * 1000} // Radius in meters
                strokeColor="#ea580c"
                strokeOpacity={0.9}
                strokeWeight={2.5}
                fillColor="#f97316"
                fillOpacity={0.2}
              />

              {/* Advanced Marker at Hub Center */}
              <AdvancedMarker position={coords} title={`${hubArea || city} Hub`}>
                <Pin background="#ea580c" glyphColor="#ffffff" borderColor="#c2410c" scale={1.2} />
              </AdvancedMarker>
            </Map>
          </APIProvider>

          {/* Floating Zone Tag */}
          <div className="absolute top-3 left-3 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-md flex items-center space-x-2 text-xs font-bold text-neutral-900 dark:text-white">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-600 animate-pulse"></div>
            <span>
              {hubArea || activePreset}: {radiusKm} Km Service Radius
            </span>
          </div>
        </div>

        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
          Guests within this <strong>{radiusKm} km radius circle</strong> around {hubArea || city} can book this vehicle with instant doorstep pickup & dropoff.
        </p>
      </div>

      {/* Precise Physical Address Input with Google Maps Autocomplete */}
      <div>
        <GooglePlaceAutocompleteInput
          label="Detailed Host Pickup & Handover Address"
          required
          value={pickupAddress}
          onChange={(val) => onPickupAddressChange(val)}
          onPlaceSelect={(place) => {
            onPickupAddressChange(place.formattedAddress);
            if (place.lat && place.lng) {
              onCoordsChange({ lat: place.lat, lng: place.lng });
            }
          }}
          placeholder="e.g. Datta Mandir Road, Wakad, Pune, Maharashtra 411057"
          icon={<Navigation className="w-4 h-4 text-orange-600" />}
          helperText="Autofills full street address and repositions the map marker automatically."
        />
      </div>
    </div>
  );
};
