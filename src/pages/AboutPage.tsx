import React from 'react';
import {
  ShieldCheck,
  Award,
  Users,
  Car,
  HeartHandshake,
  CheckCircle2,
  TrendingUp,
  MapPin,
  ArrowRight
} from 'lucide-react';
import { Link } from '../router.tsx';

export const AboutPage: React.FC = () => {
  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-10 sm:py-16 space-y-16 transition-colors">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
          <Award className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
          <span>Our Mission & Company Values</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-neutral-900 dark:text-white tracking-tight leading-tight">
          Redefining car rental through trusted peer-to-peer mobility.
        </h1>
        <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-2xl mx-auto">
          Charvi Rental was founded with a straightforward goal: replace rigid airport rental counters and hidden fees with a flexible marketplace that connects discerning travelers directly with local vehicle owners.
        </p>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 sm:p-8 rounded-3xl bg-neutral-900 dark:bg-neutral-900 text-white border border-neutral-800 shadow-xl">
        <div className="space-y-1">
          <span className="text-2xl sm:text-4xl font-black text-orange-500">18,000+</span>
          <p className="text-xs text-neutral-400 font-medium">Completed Trips</p>
        </div>
        <div className="space-y-1">
          <span className="text-2xl sm:text-4xl font-black text-white">4.96 / 5</span>
          <p className="text-xs text-neutral-400 font-medium">Average Guest Rating</p>
        </div>
        <div className="space-y-1">
          <span className="text-2xl sm:text-4xl font-black text-orange-500">2,400+</span>
          <p className="text-xs text-neutral-400 font-medium">Verified Vehicles</p>
        </div>
        <div className="space-y-1">
          <span className="text-2xl sm:text-4xl font-black text-white">50+</span>
          <p className="text-xs text-neutral-400 font-medium">Metro & Airport Hubs</p>
        </div>
      </div>

      {/* Core Principles */}
      <div className="space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white">
            Built on Safety, Transparency & Trust
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            Every feature on Charvi Rental is architected around security for both drivers and vehicle hosts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3 shadow-2xs transition-colors">
            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-200 dark:border-orange-800">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-neutral-900 dark:text-white">100% Identity Verification</h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Every driver is vetted through automated identity checks and motor vehicle record checks before being permitted to book any vehicle.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3 shadow-2xs transition-colors">
            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-200 dark:border-orange-800">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-neutral-900 dark:text-white">Fair Economics for Hosts</h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Car lenders retain up to 90% of trip earnings, turning their idle vehicles into steady income with comprehensive physical damage coverage.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3 shadow-2xs transition-colors">
            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-200 dark:border-orange-800">
              <Car className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-neutral-900 dark:text-white">The Exact Car You Choose</h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              No generic "or similar" rental gambles. The exact car model, color, year, and specifications you book are precisely what you drive.
            </p>
          </div>
        </div>
      </div>

      {/* Leadership & Story */}
      <div className="p-8 sm:p-10 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center shadow-2xs transition-colors">
        <div className="space-y-4">
          <span className="text-xs font-extrabold text-orange-600 dark:text-orange-400 uppercase tracking-wider">Our Story</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white">
            From two friends with idle cars to a nationwide mobility network.
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            In 2022, our founders noticed that the average personal vehicle sits parked 95% of the time, while traditional car rental fleets suffer from bureaucratic delays, opaque pricing, and outdated customer service.
          </p>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            We built Charvi Rental to bridge this gap: an intuitive web experience that allows verified guests to rent electric vehicles, sport convertibles, and spacious SUVs right from local hosts with contactless handovers.
          </p>
          <div className="pt-2">
            <Link
              to="/how-it-works"
              className="inline-flex items-center space-x-2 text-xs font-bold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
            >
              <span>Explore How Charvi Rental Works</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
        <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-950">
          <img
            src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80"
            alt="Charvi Rental Fleet"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};
