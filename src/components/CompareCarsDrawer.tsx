import React, { useState } from 'react';
import {
  X,
  Scale,
  Star,
  Check,
  ArrowRight,
  Trash2,
  ShieldCheck,
  MapPin
} from 'lucide-react';
import { Car } from '../types.ts';
import { useRouter } from '../router.tsx';

interface CompareCarsDrawerProps {
  compareCars: Car[];
  rentalDays: number;
  onRemoveCar: (carId: string) => void;
  onClearAll: () => void;
}

export const CompareCarsDrawer: React.FC<CompareCarsDrawerProps> = ({
  compareCars,
  rentalDays,
  onRemoveCar,
  onClearAll,
}) => {
  const { navigate } = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (compareCars.length === 0) return null;

  return (
    <>
      {/* Floating Sticky Comparison Dock */}
      <div className="fixed bottom-4 inset-x-0 z-40 px-4 pointer-events-none flex justify-center">
        <div className="pointer-events-auto w-full max-w-3xl bg-neutral-900/95 dark:bg-neutral-900 text-white border border-neutral-700/80 rounded-2xl shadow-2xl p-3 sm:px-5 flex flex-col sm:flex-row items-center justify-between gap-3 backdrop-blur-md animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center space-x-3 w-full sm:w-auto overflow-x-auto">
            <div className="flex items-center space-x-1.5 shrink-0">
              <div className="p-2 rounded-xl bg-orange-600 text-white">
                <Scale className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-extrabold block">Compare Fleet ({compareCars.length}/3)</span>
                <span className="text-[10px] text-neutral-400">Side-by-side specs</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 pl-2 border-l border-neutral-800">
              {compareCars.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center space-x-2 bg-neutral-800/90 border border-neutral-700 rounded-xl p-1.5 pr-2.5 shrink-0"
                >
                  <img
                    src={c.image_url}
                    alt={c.title}
                    className="w-9 h-7 rounded-lg object-cover"
                  />
                  <div className="text-[11px] max-w-[100px]">
                    <p className="font-bold truncate">{c.title}</p>
                    <p className="text-[10px] text-orange-400 font-mono tabular-nums">
                      ₹{c.price_per_day.toLocaleString('en-IN')}/d
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveCar(c.id)}
                    className="text-neutral-400 hover:text-red-400 p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end shrink-0">
            <button
              type="button"
              onClick={onClearAll}
              className="px-3 py-1.5 rounded-xl border border-neutral-700 hover:bg-neutral-800 text-neutral-300 text-xs font-semibold cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-extrabold flex items-center space-x-1.5 shadow-md cursor-pointer"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Compare Now</span>
            </button>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs">
          <div className="relative w-full max-w-5xl bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 text-neutral-900 dark:text-neutral-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-orange-600 text-white">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-neutral-900 dark:text-white">
                    Side-by-Side Vehicle Comparison
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Comparing {compareCars.length} verified self-drive vehicles for a {rentalDays}-day trip
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {compareCars.map((car) => {
                  const totalTrip = car.price_per_day * rentalDays;
                  return (
                    <div
                      key={car.id}
                      className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/60 overflow-hidden flex flex-col justify-between"
                    >
                      <div>
                        <div className="relative aspect-[16/10] bg-neutral-200 dark:bg-neutral-800">
                          <img
                            src={car.image_url}
                            alt={car.title}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => onRemoveCar(car.id)}
                            title="Remove from comparison"
                            className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/60 hover:bg-red-600 text-white transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <div className="absolute bottom-2.5 left-2.5 px-2.5 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold">
                            {car.year} · {car.type}
                          </div>
                        </div>

                        <div className="p-4 space-y-4 text-xs">
                          <div>
                            <h4 className="font-extrabold text-sm text-neutral-900 dark:text-white">
                              {car.title}
                            </h4>
                            <p className="text-[11px] text-neutral-500 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-orange-600 shrink-0" />
                              <span className="truncate">{car.city || car.location}</span>
                            </p>
                          </div>

                          {/* Spec Rows */}
                          <div className="space-y-2 pt-2 border-t border-neutral-200 dark:border-neutral-800 tabular-nums">
                            <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800/60">
                              <span className="text-neutral-500">Daily Rate</span>
                              <span className="font-black text-orange-600">
                                ₹{car.price_per_day.toLocaleString('en-IN')}/day
                              </span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800/60">
                              <span className="text-neutral-500">{rentalDays}-Day Estimate</span>
                              <span className="font-bold text-neutral-900 dark:text-white">
                                ₹{totalTrip.toLocaleString('en-IN')}
                              </span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800/60">
                              <span className="text-neutral-500">Security Deposit</span>
                              <span className="font-semibold">
                                ₹{Number(car.security_deposit || 2000).toLocaleString('en-IN')}
                              </span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800/60">
                              <span className="text-neutral-500">Powertrain & Fuel</span>
                              <span className="font-semibold">{car.fuel}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800/60">
                              <span className="text-neutral-500">Transmission</span>
                              <span className="font-semibold">{car.transmission}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800/60">
                              <span className="text-neutral-500">Capacity</span>
                              <span className="font-semibold">{car.seats} Seats</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800/60">
                              <span className="text-neutral-500">Included Distance</span>
                              <span className="font-semibold">{car.km_limit || 300} km/day</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800/60">
                              <span className="text-neutral-500">Extra Km Charge</span>
                              <span className="font-semibold">₹{car.extra_km_rate || 12}/km</span>
                            </div>
                            <div className="flex justify-between py-1">
                              <span className="text-neutral-500">Rating</span>
                              <span className="font-bold flex items-center gap-1">
                                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                                {car.rating.toFixed(1)} ({car.reviews_count})
                              </span>
                            </div>
                          </div>

                          {/* Features list */}
                          <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 space-y-1.5">
                            <span className="text-[10px] font-bold uppercase text-neutral-400 block">
                              Included Equipment
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {(car.features || []).slice(0, 5).map((feat) => (
                                <span
                                  key={feat}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[10px] font-semibold"
                                >
                                  <Check className="w-2.5 h-2.5 text-emerald-600" />
                                  {feat}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 pt-0">
                        <button
                          type="button"
                          onClick={() => {
                            setIsModalOpen(false);
                            navigate(`/car/${car.id}`);
                          }}
                          className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer"
                        >
                          <span>Inspect & Reserve</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
