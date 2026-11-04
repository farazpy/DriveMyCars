import React, { useState } from 'react';
import {
  Car,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  IndianRupee
} from 'lucide-react';
import { Link } from '../router.tsx';
import { SEO } from '../components/SEO.tsx';

interface HostLeasingPageProps {
  onOpenListCarModal: () => void;
  onSwitchToLenderMode: () => void;
}

export const HostLeasingPage: React.FC<HostLeasingPageProps> = () => {
  const [estimatedDailyRate, setEstimatedDailyRate] = useState(3500);
  const [monthlyDaysRented, setMonthlyDaysRented] = useState(14);

  const monthlyGross = estimatedDailyRate * monthlyDaysRented;
  const hostNetEarnings = Math.round(monthlyGross * 0.9);
  const annualNetEarnings = hostNetEarnings * 12;

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-10 sm:py-16 space-y-16">
      <SEO
        title="List Your Car & Earn - Peer-to-Peer Car Sharing Host Program | Charvi Rental"
        description="Earn up to ₹45,000/month by leasing your idle car on Charvi Rental. Free listing, verified KYC drivers, 100% insurance backing, and flexible scheduling."
        canonicalPath="/host-leasing"
        ogType="website"
        keywords={['host car sharing India', 'earn money leasing car', 'list my car Pune', 'car rental passive income']}
      />
      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
            <Sparkles className="w-3.5 h-3.5 text-orange-600" />
            <span>Turn Idle Vehicles into Recurring Income</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-neutral-900 dark:text-white tracking-tight leading-tight">
            Earn up to ₹45,000/month by leasing your car.
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-2xl">
            Join thousands of car owners across Pune, Bengaluru, Mumbai, Delhi NCR, and Goa who offset their EMI and maintenance by hosting on Charvi Rental. You control the schedule, set your rates, and enjoy 100% verified KYC guests.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              to="/become-a-host"
              className="px-6 py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs rounded-2xl transition-colors shadow-sm flex items-center space-x-2 cursor-pointer"
            >
              <span>List Your Car Free (Become Host Wizard)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/how-it-works"
              className="px-6 py-3.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-bold text-xs rounded-2xl transition-colors"
            >
              See How It Works
            </Link>
          </div>
        </div>

        {/* Interactive Earnings Calculator */}
        <div className="lg:col-span-5">
          <div className="p-6 sm:p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-6 shadow-sm">
            <div className="space-y-1">
              <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                Host Earnings Calculator
              </span>
              <h3 className="text-xl font-black text-neutral-900 dark:text-white">Estimate Your Vehicle Income</h3>
            </div>

            {/* Slider 1: Daily Price in INR */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-neutral-500 dark:text-neutral-400">Your Daily Rental Rate</span>
                <span className="font-bold text-neutral-900 dark:text-white">₹{estimatedDailyRate.toLocaleString('en-IN')} / day</span>
              </div>
              <input
                type="range"
                min="1500"
                max="15000"
                step="250"
                value={estimatedDailyRate}
                onChange={(e) => setEstimatedDailyRate(Number(e.target.value))}
                className="w-full accent-orange-600 cursor-pointer"
              />
            </div>

            {/* Slider 2: Days per Month */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-neutral-500 dark:text-neutral-400">Estimated Days Rented / Month</span>
                <span className="font-bold text-neutral-900 dark:text-white">{monthlyDaysRented} days</span>
              </div>
              <input
                type="range"
                min="3"
                max="28"
                step="1"
                value={monthlyDaysRented}
                onChange={(e) => setMonthlyDaysRented(Number(e.target.value))}
                className="w-full accent-orange-600 cursor-pointer"
              />
            </div>

            {/* Net Payout Callout */}
            <div className="p-4 rounded-2xl bg-neutral-900 text-white text-center space-y-1">
              <span className="text-[11px] text-neutral-400 font-medium uppercase tracking-wider block">
                Estimated Net Host Earnings
              </span>
              <div className="text-3xl font-black text-orange-400">
                ₹{hostNetEarnings.toLocaleString('en-IN')} <span className="text-xs text-neutral-400 font-normal">/ month</span>
              </div>
              <span className="text-xs text-neutral-400 block pt-1">
                ≈ ₹{annualNetEarnings.toLocaleString('en-IN')} per year (90% host payout)
              </span>
            </div>

            <Link
              to="/become-a-host"
              className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-2xl transition-colors shadow-2xs flex items-center justify-center space-x-2"
            >
              <span>Start Host Onboarding Wizard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Host Advantages */}
      <div className="space-y-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white text-center">
          Why Host on Charvi Rental
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 flex items-center justify-center border border-orange-200 dark:border-orange-800">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-neutral-900 dark:text-white text-base">₹1,00,00,000 Host Protection</h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Every trip is protected by commercial liability cover, physical damage protection, and 24/7 towing assistance across India.
            </p>
          </div>

          <div className="p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-neutral-900 dark:text-white text-base">100% Aadhaar & DL Verified Guests</h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              We verify all renters against government transport ministry databases and DigiLocker before handovers are approved.
            </p>
          </div>

          <div className="p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 flex items-center justify-center border border-orange-200 dark:border-orange-800">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-neutral-900 dark:text-white text-base">Direct UPI / Bank Payouts</h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Receive 90% of trip revenue deposited automatically to your Indian bank account within 24 hours of trip completion.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
