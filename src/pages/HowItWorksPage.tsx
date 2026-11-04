import React, { useState } from 'react';
import {
  Search,
  KeyRound,
  ShieldCheck,
  Smile,
  Car,
  DollarSign,
  CalendarCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Link } from '../router.tsx';

export const HowItWorksPage: React.FC = () => {
  const [tab, setTab] = useState<'renter' | 'lender'>('renter');

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-10 sm:py-16 space-y-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
          <Sparkles className="w-3.5 h-3.5 text-orange-600" />
          <span>Simple, Transparent & Contactless</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-neutral-900 dark:text-white tracking-tight">
          How Charvi Rental Works
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Whether you want to rent a dream car for a weekend road trip or earn steady income from your personal vehicle, getting started is straightforward.
        </p>

        {/* Tab Selector */}
        <div className="inline-flex p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 mt-4">
          <button
            onClick={() => setTab('renter')}
            className={`px-5 py-2 text-xs font-bold rounded-lg transition-all ${
              tab === 'renter'
                ? 'bg-white dark:bg-neutral-950 text-orange-600 shadow-2xs border border-neutral-200/80 dark:border-neutral-800'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            For Renters
          </button>
          <button
            onClick={() => setTab('lender')}
            className={`px-5 py-2 text-xs font-bold rounded-lg transition-all ${
              tab === 'lender'
                ? 'bg-white dark:bg-neutral-950 text-orange-600 shadow-2xs border border-neutral-200/80 dark:border-neutral-800'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            For Lenders (Car Owners)
          </button>
        </div>
      </div>

      {/* Renter Walkthrough */}
      {tab === 'renter' ? (
        <div className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3 shadow-2xs">
              <span className="w-8 h-8 rounded-full bg-orange-600 text-white font-extrabold text-xs flex items-center justify-center">
                1
              </span>
              <h3 className="font-bold text-base text-neutral-900 dark:text-white">Find the Perfect Car</h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Enter your travel dates and pick-up spot. Filter by price, transmission, seating, or body type from verified local hosts.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3 shadow-2xs">
              <span className="w-8 h-8 rounded-full bg-orange-600 text-white font-extrabold text-xs flex items-center justify-center">
                2
              </span>
              <h3 className="font-bold text-base text-neutral-900 dark:text-white">Book Instantly</h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Sign in with your Google account. Select your protection plan, review the transparent price breakdown, and confirm reservation.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3 shadow-2xs">
              <span className="w-8 h-8 rounded-full bg-orange-600 text-white font-extrabold text-xs flex items-center justify-center">
                3
              </span>
              <h3 className="font-bold text-base text-neutral-900 dark:text-white">Pick Up & Drive</h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Meet your host or use remote unlock at airport/city curbside. Complete a quick digital walk-around inspection and hit the road.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3 shadow-2xs">
              <span className="w-8 h-8 rounded-full bg-orange-600 text-white font-extrabold text-xs flex items-center justify-center">
                4
              </span>
              <h3 className="font-bold text-base text-neutral-900 dark:text-white">Easy Return</h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Drop the car back at the agreed location with the same fuel/charge level. Leave a review for your host and collect trip receipts.
              </p>
            </div>
          </div>

          <div className="text-center pt-4">
            <Link
              to="/"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl transition-colors shadow-2xs"
            >
              <span>Explore Available Fleet</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        /* Lender Walkthrough */
        <div className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3 shadow-2xs">
              <span className="w-8 h-8 rounded-full bg-neutral-900 dark:bg-orange-600 text-white font-extrabold text-xs flex items-center justify-center">
                1
              </span>
              <h3 className="font-bold text-base text-neutral-900 dark:text-white">List Your Car Free</h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Sign in with Google, enter your car's make, model, year, and photos. Set your daily price and customizable house rules.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3 shadow-2xs">
              <span className="w-8 h-8 rounded-full bg-neutral-900 dark:bg-orange-600 text-white font-extrabold text-xs flex items-center justify-center">
                2
              </span>
              <h3 className="font-bold text-base text-neutral-900 dark:text-white">Set Schedule & Availability</h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Block off days you need the car for yourself. Enable instant bookings or manually review guest requests in advance.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3 shadow-2xs">
              <span className="w-8 h-8 rounded-full bg-neutral-900 dark:bg-orange-600 text-white font-extrabold text-xs flex items-center justify-center">
                3
              </span>
              <h3 className="font-bold text-base text-neutral-900 dark:text-white">Welcome Verified Guests</h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Hand over keys directly or offer lockbox/remote access. Every driver has passed identity and driving history checks.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3 shadow-2xs">
              <span className="w-8 h-8 rounded-full bg-neutral-900 dark:bg-orange-600 text-white font-extrabold text-xs flex items-center justify-center">
                4
              </span>
              <h3 className="font-bold text-base text-neutral-900 dark:text-white">Get Paid Regularly</h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Earn 90% of trip proceeds directly. Track earnings, reviews, and mileage in your real-time Host Dashboard.
              </p>
            </div>
          </div>

          <div className="text-center pt-4">
            <Link
              to="/host-leasing"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-xl transition-colors shadow-2xs"
            >
              <span>Learn More About Host Earnings</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Rules & Transparency Section */}
      <div className="p-6 sm:p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs transition-colors">
        <div className="space-y-1">
          <span className="font-bold text-neutral-900 dark:text-white text-sm block">Fuel & EV Battery Policy</span>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Return the car with the same fuel level or charge level (80%+) as handed over to avoid refueling adjustments.
          </p>
        </div>
        <div className="space-y-1">
          <span className="font-bold text-neutral-900 dark:text-white text-sm block">Daily Mileage Allowance</span>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Most rentals include 200 complimentary miles per day, with generous extended packages available on request.
          </p>
        </div>
        <div className="space-y-1">
          <span className="font-bold text-neutral-900 dark:text-white text-sm block">Flexible Cancellations</span>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Full refund on all trips cancelled up to 24 hours prior to scheduled pick-up time.
          </p>
        </div>
      </div>
    </div>
  );
};
