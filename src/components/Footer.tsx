import {
  Car,
  ShieldCheck,
  Zap,
  MapPin,
  HeartHandshake,
  CheckCircle2,
  Lock,
  ArrowRight,
  ExternalLink,
  Mail,
  Phone,
  Globe
} from 'lucide-react';
import { Link } from '../router.tsx';
import { usePlatformSettings } from '../context/PlatformSettingsContext.tsx';

export const Footer: React.FC = () => {
  const { settings } = usePlatformSettings();
  return (
    <footer className="w-full bg-white dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs transition-colors">
      {/* Top Value Badges: Detailed & Compact */}
      <div className="border-b border-neutral-100 dark:border-neutral-900 bg-neutral-50/70 dark:bg-neutral-900/40 py-4 px-4 sm:px-8 lg:px-12">
        <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 text-center sm:text-left">
          <div className="flex items-center space-x-2.5 justify-center sm:justify-start">
            <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-600 shrink-0">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold text-neutral-900 dark:text-neutral-200 block text-[11px]">Instant FASTag Active</span>
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400">Automated toll pass on highways</span>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 justify-center sm:justify-start">
            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold text-neutral-900 dark:text-neutral-200 block text-[11px]">₹0 Security Deposit</span>
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400">On verified Aadhaar & DL profiles</span>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 justify-center sm:justify-start">
            <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-600 shrink-0">
              <HeartHandshake className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold text-neutral-900 dark:text-neutral-200 block text-[11px]">24/7 Roadside Assistance</span>
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400">Pan-India emergency dispatch</span>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 justify-center sm:justify-start">
            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 shrink-0">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold text-neutral-900 dark:text-neutral-200 block text-[11px]">DigiLocker Verified</span>
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400">Automated government ID checks</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links Columns */}
      <div className="w-full px-4 sm:px-8 lg:px-12 py-8 sm:py-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 sm:gap-8">
          {/* Col 1: Brand Info */}
          <div className="col-span-2 space-y-3">
            <Link to="/" className="flex items-center space-x-2 group">
              {settings.logo_url || settings.logo_dark_url ? (
                <>
                  {settings.logo_url && (
                    <img
                      src={settings.logo_url}
                      alt={settings.brand_name}
                      className={`h-8 max-w-[140px] object-contain rounded-lg ${settings.logo_dark_url ? 'dark:hidden' : ''}`}
                    />
                  )}
                  {settings.logo_dark_url && (
                    <img
                      src={settings.logo_dark_url}
                      alt={settings.brand_name}
                      className={`h-8 max-w-[140px] object-contain rounded-lg ${settings.logo_url ? 'hidden dark:block' : ''}`}
                    />
                  )}
                </>
              ) : (
                <div className="w-7 h-7 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-2xs">
                  <Car className="w-4 h-4" />
                </div>
              )}
              <span className="font-black text-base text-neutral-900 dark:text-white tracking-tight">
                {settings.brand_name}
              </span>
            </Link>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-sm">
              {settings.brand_tagline || "India's premier peer-to-peer car rental platform. Connect directly with verified car owners for seamless, contactless self-drive travel."}
            </p>

            {/* Dynamic Contact Details in Footer */}
            <div className="pt-2 space-y-1.5 text-[11px] text-neutral-600 dark:text-neutral-400">
              {settings.contact_email && (
                <a
                  href={`mailto:${settings.contact_email}`}
                  className="flex items-center space-x-2 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                  <span>{settings.contact_email}</span>
                </a>
              )}
              {settings.contact_phone && (
                <a
                  href={`tel:${settings.contact_phone}`}
                  className="flex items-center space-x-2 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{settings.contact_phone}</span>
                </a>
              )}
              {settings.contact_address && (
                <div className="flex items-center space-x-2">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span>{settings.contact_address}</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 pt-1 text-[11px] text-neutral-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Fleet in Pune &amp; Metro Regions</span>
            </div>
          </div>

          {/* Col 2: Marketplace */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-xs text-neutral-900 dark:text-neutral-200 uppercase tracking-wider">
              Explore Fleet
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link to="/" className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                  All Vehicles
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                  SUVs & 4x4 Off-road
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                  Electric Vehicles (EV)
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                  Luxury & Sports
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                  How Booking Works
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: For Hosts & Lenders */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-xs text-neutral-900 dark:text-neutral-200 uppercase tracking-wider">
              Car Owners
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link to="/become-a-host" className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors font-bold text-orange-600 dark:text-orange-400">
                  Become a Host (Listing Wizard)
                </Link>
              </li>
              <li>
                <Link to="/host-leasing" className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                  Earn as a Host Program
                </Link>
              </li>
              <li>
                <Link to="/insurance-protection" className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                  Host Protection Shield
                </Link>
              </li>
              <li>
                <Link to="/lender" className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                  Host Dashboard
                </Link>
              </li>
              <li>
                <Link to="/customer" className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                  Customer Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Popular Hubs */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-xs text-neutral-900 dark:text-neutral-200 uppercase tracking-wider">
              Top Locations
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link to="/" className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                  Wakad, Pune
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                  Baner & Hinjawadi
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                  Koregaon Park & Viman Nagar
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                  Pimple Saudagar
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                  Kothrud & Deccan
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright & disclaimer */}
        <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-neutral-850 flex flex-col sm:flex-row items-center justify-between text-neutral-400 text-[11px] gap-3">
          <p>© {new Date().getFullYear()} {settings.brand_name} Technologies ({settings.domain_name || 'India'}). All rights reserved.</p>
          <div className="flex items-center space-x-4">
            <Link to="/insurance-protection" className="hover:text-neutral-600 dark:hover:text-neutral-300">Privacy & Protection</Link>
            <Link to="/how-it-works" className="hover:text-neutral-600 dark:hover:text-neutral-300">Terms of Service</Link>
            <Link to="/about" className="hover:text-neutral-600 dark:hover:text-neutral-300">About Platform</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
