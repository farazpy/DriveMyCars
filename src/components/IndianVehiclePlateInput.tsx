import React, { useState, useEffect, useRef } from 'react';

interface IndianVehiclePlateInputProps {
  value: string;
  onChange: (fullPlate: string) => void;
  required?: boolean;
}

export const IndianVehiclePlateInput: React.FC<IndianVehiclePlateInputProps> = ({
  value,
  onChange,
  required = true,
}) => {
  // Parse incoming value like "MH 14 NH 7408" or "MH14NH7408"
  const parsePlate = (str: string) => {
    const cleaned = (str || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, ' ');
    const parts = cleaned.split(/\s+/).filter(Boolean);
    return {
      state: parts[0] || 'MH',
      rto: parts[1] || '14',
      series: parts[2] || 'NH',
      num: parts[3] || '7408',
    };
  };

  const initial = parsePlate(value);
  const [stateCode, setStateCode] = useState(initial.state);
  const [rtoCode, setRtoCode] = useState(initial.rto);
  const [seriesCode, setSeriesCode] = useState(initial.series);
  const [numCode, setNumCode] = useState(initial.num);

  const rtoRef = useRef<HTMLInputElement>(null);
  const seriesRef = useRef<HTMLInputElement>(null);
  const numRef = useRef<HTMLInputElement>(null);
  const stateRef = useRef<HTMLInputElement>(null);

  // Sync back to parent
  useEffect(() => {
    const full = `${stateCode} ${rtoCode} ${seriesCode} ${numCode}`.trim();
    if (full !== value) {
      onChange(full);
    }
  }, [stateCode, rtoCode, seriesCode, numCode]);

  // Update internal states if parent value changes externally
  useEffect(() => {
    if (value) {
      const parsed = parsePlate(value);
      if (
        parsed.state !== stateCode ||
        parsed.rto !== rtoCode ||
        parsed.series !== seriesCode ||
        parsed.num !== numCode
      ) {
        setStateCode(parsed.state);
        setRtoCode(parsed.rto);
        setSeriesCode(parsed.series);
        setNumCode(parsed.num);
      }
    }
  }, [value]);

  const handleStateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
    setStateCode(val);
    if (val.length === 2) {
      rtoRef.current?.focus();
    }
  };

  const handleRtoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
    setRtoCode(val);
    if (val.length === 2) {
      seriesRef.current?.focus();
    }
  };

  const handleSeriesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
    setSeriesCode(val);
    if (val.length >= 2) {
      numRef.current?.focus();
    }
  };

  const handleNumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
    setNumCode(val);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    currentValue: string,
    prevRef?: React.RefObject<HTMLInputElement | null>
  ) => {
    if (e.key === 'Backspace' && currentValue.length === 0 && prevRef?.current) {
      prevRef.current.focus();
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
          Indian Vehicle Registration Number {required && <span className="text-orange-600">*</span>}
        </label>
        <span className="text-[10px] text-neutral-400 font-medium">
          Format: State · District/RTO · Series · 4-Digit Number
        </span>
      </div>

      {/* 4 Separate Plate Input Boxes */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {/* Box 1: State Code */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">State (Box 1)</span>
          <input
            ref={stateRef}
            type="text"
            required={required}
            maxLength={2}
            value={stateCode}
            onChange={handleStateChange}
            placeholder="MH"
            className="w-full text-center py-2.5 px-1 sm:px-2 text-sm sm:text-base font-black font-mono tracking-widest rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white uppercase focus:ring-2 focus:ring-orange-500 focus:border-orange-500 shadow-2xs transition-all"
          />
        </div>

        {/* Box 2: RTO Code */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">RTO (Box 2)</span>
          <input
            ref={rtoRef}
            type="text"
            required={required}
            maxLength={2}
            value={rtoCode}
            onChange={handleRtoChange}
            onKeyDown={(e) => handleKeyDown(e, rtoCode, stateRef)}
            placeholder="14"
            className="w-full text-center py-2.5 px-1 sm:px-2 text-sm sm:text-base font-black font-mono tracking-widest rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 shadow-2xs transition-all"
          />
        </div>

        {/* Box 3: Series Code */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Series (Box 3)</span>
          <input
            ref={seriesRef}
            type="text"
            required={required}
            maxLength={3}
            value={seriesCode}
            onChange={handleSeriesChange}
            onKeyDown={(e) => handleKeyDown(e, seriesCode, rtoRef)}
            placeholder="NH"
            className="w-full text-center py-2.5 px-1 sm:px-2 text-sm sm:text-base font-black font-mono tracking-widest rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white uppercase focus:ring-2 focus:ring-orange-500 focus:border-orange-500 shadow-2xs transition-all"
          />
        </div>

        {/* Box 4: 4-digit Number */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Number (Box 4)</span>
          <input
            ref={numRef}
            type="text"
            required={required}
            maxLength={4}
            value={numCode}
            onChange={handleNumChange}
            onKeyDown={(e) => handleKeyDown(e, numCode, seriesRef)}
            placeholder="7408"
            className="w-full text-center py-2.5 px-1 sm:px-2 text-sm sm:text-base font-black font-mono tracking-widest rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 shadow-2xs transition-all"
          />
        </div>
      </div>

      {/* Realistic Indian HSRP Plate Preview */}
      <div className="p-2 sm:p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-750 flex items-center justify-between">
        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">HSRP Plate Preview:</span>
        <div className="inline-flex items-center bg-white dark:bg-neutral-950 border-2 border-neutral-900 dark:border-neutral-700 rounded-lg shadow-sm px-3 py-1 font-mono">
          <div className="flex flex-col items-center justify-center mr-2 pr-1.5 border-r border-blue-500/30 text-[8px] font-black text-blue-700 leading-tight">
            <span>🇮🇳</span>
            <span className="tracking-tighter">IND</span>
          </div>
          <span className="text-xs sm:text-sm font-black tracking-widest text-neutral-900 dark:text-neutral-100">
            {stateCode || 'MH'} {rtoCode || '14'} {seriesCode || 'NH'} {numCode || '7408'}
          </span>
        </div>
      </div>
    </div>
  );
};
