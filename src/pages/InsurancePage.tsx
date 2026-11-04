import React from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Car,
  Headphones,
  FileCheck,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { Link } from '../router.tsx';

export const InsurancePage: React.FC = () => {
  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-10 sm:py-16 space-y-14 transition-colors">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Verified Protection Guarantee</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-neutral-900 dark:text-white tracking-tight leading-tight">
          Comprehensive Insurance & Roadside Care
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-xl mx-auto">
          Every trip booked through Charvi Rental is covered by our trusted protection tiers, offering peace of mind to drivers and vehicle hosts across India.
        </p>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Plan 1: Standard Protection */}
        <div className="p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-6 flex flex-col justify-between shadow-2xs transition-colors">
          <div className="space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Included Tier</span>
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
                Included with All Bookings
              </span>
            </div>
            <h3 className="text-2xl font-black text-neutral-900 dark:text-white">Standard Protection</h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Ideal for confident everyday drivers who want primary legal compliance and essential emergency support.
            </p>

            <ul className="space-y-3 pt-2 text-xs text-neutral-700 dark:text-neutral-300">
              <li className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Statutory third-party motor insurance liability coverage</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>24/7 nationwide roadside assistance & highway towing</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Flat tyre assistance, jumpstart & emergency fuel delivery</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Zero security deposit on verified customer profiles</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">Cost: Free (Included)</span>
          </div>
        </div>

        {/* Plan 2: Comprehensive Shield */}
        <div className="p-8 rounded-3xl border-2 border-orange-500 dark:border-orange-500 bg-orange-50/20 dark:bg-orange-950/20 space-y-6 flex flex-col justify-between relative shadow-2xs transition-colors">
          <div className="absolute top-4 right-4 bg-orange-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
            Most Popular
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-extrabold uppercase tracking-wider text-orange-600 dark:text-orange-400">Full Coverage</span>
            </div>
            <h3 className="text-2xl font-black text-neutral-900 dark:text-white">Comprehensive Shield</h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Complete zero-stress driving with zero deductible, glass repair, FASTag toll support, and bumper-to-bumper protection.
            </p>

            <ul className="space-y-3 pt-2 text-xs text-neutral-700 dark:text-neutral-300">
              <li className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
                <span><strong>₹0 Out-of-pocket damage deductible</strong></span>
              </li>
              <li className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
                <span>₹50,00,000 extended third-party liability coverage</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
                <span>Windshield, glass & tyre puncture repair included</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
                <span>Priority concierge emergency dispatch & replacement car assistance</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-orange-200 dark:border-orange-800/80">
            <span className="text-xs font-extrabold text-neutral-800 dark:text-neutral-200">Available during booking at +₹499/day</span>
          </div>
        </div>
      </div>

      {/* Host Protection Section */}
      <div className="p-8 sm:p-10 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-neutral-900 dark:bg-neutral-900 text-white space-y-6 shadow-xl">
        <div className="max-w-2xl space-y-2">
          <span className="text-xs font-extrabold text-orange-400 uppercase tracking-wider">For Car Owners & Lenders</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            ₹1,00,00,000 Host Protection Guarantee
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
            When you lease your car on Charvi Rental, your personal auto insurance policy is never impacted. Our commercial fleet policy provides primary physical damage and liability protection from trip start to vehicle return.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-2">
          <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-800/50">
            <span className="font-bold text-white block mb-1">Physical Damage Coverage</span>
            <span className="text-neutral-400">Up to vehicle market value against collision, theft, or weather.</span>
          </div>
          <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-800/50">
            <span className="font-bold text-white block mb-1">Driver Screening</span>
            <span className="text-neutral-400">Strict driving record & DigiLocker verification prior to key handover.</span>
          </div>
          <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-800/50">
            <span className="font-bold text-white block mb-1">Fast Claim Reimbursement</span>
            <span className="text-neutral-400">Direct cashless repair authorizations at authorized brand service centers.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
