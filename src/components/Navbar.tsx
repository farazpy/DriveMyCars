import React, { useState } from 'react';
import {
  Car,
  User as UserIcon,
  Database,
  LogOut,
  Menu,
  X,
  CalendarCheck,
  ChevronDown,
  ChevronRight,
  Sparkles,
  HelpCircle,
  ShieldCheck,
  Sun,
  Moon,
  Compass,
  MapPin,
  Check
} from 'lucide-react';
import { UserProfile, UserRole, DbStatusInfo } from '../types.ts';
import { Link, useRouter } from '../router.tsx';
import { useTheme } from '../context/ThemeContext.tsx';
import { usePlatformSettings } from '../context/PlatformSettingsContext.tsx';

export const POPULAR_CITIES = [
  { id: 'Pune', name: 'Pune', state: 'Maharashtra', tag: 'Primary Hub' },
  { id: 'Mumbai', name: 'Mumbai', state: 'Maharashtra', tag: 'Available' },
  { id: 'Delhi NCR', name: 'Delhi NCR', state: 'Delhi NCR', tag: 'Available' },
  { id: 'Bengaluru', name: 'Bengaluru', state: 'Karnataka', tag: 'Available' },
  { id: 'Hyderabad', name: 'Hyderabad', state: 'Telangana', tag: 'Available' },
  { id: 'Goa', name: 'Goa', state: 'Goa', tag: 'Available' },
];

interface NavbarProps {
  user: UserProfile | null;
  currentRole: UserRole;
  selectedCity?: string;
  onSelectCity?: (city: string) => void;
  onRoleChange: (role: UserRole) => void;
  onSignInClick: () => void;
  onSignOutClick: () => void;
  onOpenTripsModal: () => void;
  onOpenLenderPortal: () => void;
  onOpenListCarModal: () => void;
  dbStatus?: DbStatusInfo | null;
  onOpenDatabaseModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  selectedCity = 'Pune',
  onSelectCity,
  onSignInClick,
  onSignOutClick,
  dbStatus,
  onOpenDatabaseModal,
}) => {
  const { path } = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { settings } = usePlatformSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-[100] w-full max-w-full bg-white dark:bg-neutral-950 border-b border-neutral-200/80 dark:border-neutral-800 shadow-2xs transition-colors duration-200">
      <div className="w-full max-w-full px-3 sm:px-6 lg:px-12 h-16 flex items-center justify-between gap-2">
        
        {/* Left: Brand Logo + Header Version Badge + City Selector */}
        <div className="flex items-center space-x-2 sm:space-x-4 lg:space-x-5 min-w-0">
          <Link to="/" className="flex items-center space-x-2 sm:space-x-2.5 group min-w-0 shrink">
            {settings.logo_url ? (
              <img
                src={settings.logo_url}
                alt={settings.brand_name}
                className="h-8 sm:h-10 max-w-[90px] xs:max-w-[120px] sm:max-w-[150px] object-contain rounded-lg shrink-0"
              />
            ) : (
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-orange-600 hover:bg-orange-500 flex items-center justify-center text-white shadow-sm shadow-orange-600/20 group-hover:scale-105 transition-all duration-200 ease-out shrink-0">
                <Car className="w-4.5 h-4.5 sm:w-6 sm:h-6 transition-transform duration-200 group-hover:rotate-[-4deg]" />
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center space-x-1 sm:space-x-2 min-w-0">
                <span className="font-black text-sm sm:text-xl tracking-tight text-neutral-900 dark:text-white truncate">
                  {settings.brand_name}
                </span>
                <span className="text-[9px] sm:text-[10px] font-extrabold px-1 sm:px-1.5 py-0.5 rounded-md bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 shrink-0">
                  v1.5.8
                </span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onOpenDatabaseModal?.();
                  }}
                  className={`flex items-center justify-center p-1 rounded-md border transition-all ${
                    dbStatus?.connected
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
                      : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/60 animate-pulse'
                  }`}
                  title={dbStatus?.connected ? 'MySQL Database Connected' : 'Database Connection Failed - Click for Details'}
                >
                  <Database className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              </div>
              <span className="text-[9px] sm:text-[10px] tracking-wider text-neutral-400 font-bold uppercase -mt-0.5 hidden sm:block truncate">
                {settings.brand_tagline || 'Self-Drive Fleet · India'}
              </span>
            </div>
          </Link>

          {/* City Selector Button in Header */}
          <div className="relative shrink-0 z-[110]">
            <button
              type="button"
              onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border border-orange-200 dark:border-orange-900/60 bg-orange-50/80 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-950/70 text-orange-950 dark:text-orange-200 transition-all duration-200 cursor-pointer shadow-2xs group shrink-0"
              title="Select Operating City for Fleet Availability"
            >
              <MapPin className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-black tracking-tight">{selectedCity || 'Pune'}</span>
              <ChevronDown className={`w-3 h-3 text-orange-500 transition-transform duration-200 ${cityDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {cityDropdownOpen && (
              <div className="absolute left-0 mt-2 w-56 sm:w-64 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl py-2 z-[120] animate-in fade-in zoom-in-95 duration-200">
                <div className="px-3.5 py-2 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-neutral-900 dark:text-white">Select City</p>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400">Filter availability by city</p>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                    {selectedCity || 'Pune'} Active
                  </span>
                </div>

                <div className="py-1 max-h-60 overflow-y-auto">
                  {POPULAR_CITIES.map((c) => {
                    const isSelected = (selectedCity || 'Pune').toLowerCase() === c.name.toLowerCase();
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          onSelectCity?.(c.name);
                          setCityDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 font-bold'
                            : 'hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold'
                        }`}
                      >
                        <div className="flex items-center space-x-2 min-w-0">
                          <MapPin className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-orange-600' : 'text-neutral-400'}`} />
                          <div className="min-w-0">
                            <span className="text-xs block truncate">{c.name}</span>
                            <span className="text-[10px] text-neutral-400 block font-normal">{c.state}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 shrink-0">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                            c.name === 'Pune'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                          }`}>
                            {c.name === 'Pune' ? 'Primary Fleet' : c.tag}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-orange-600 shrink-0 ml-1" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1 text-xs font-semibold text-neutral-600 dark:text-neutral-300">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-xl transition-all duration-200 ${
                path === '/'
                  ? 'text-orange-600 font-bold bg-orange-50 dark:bg-orange-950/40'
                  : 'hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-900'
              }`}
            >
              Explore Fleet
            </Link>
            <Link
              to="/how-it-works"
              className={`px-3 py-1.5 rounded-xl transition-all duration-200 ${
                path === '/how-it-works'
                  ? 'text-orange-600 font-bold bg-orange-50 dark:bg-orange-950/40'
                  : 'hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-900'
              }`}
            >
              How It Works
            </Link>
            <Link
              to="/insurance-protection"
              className={`px-3 py-1.5 rounded-xl transition-all duration-200 ${
                path === '/insurance-protection'
                  ? 'text-orange-600 font-bold bg-orange-50 dark:bg-orange-950/40'
                  : 'hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-900'
              }`}
            >
              Protection & Care
            </Link>
            <Link
              to={user?.role === 'lender' || user?.role === 'admin' ? '/lender' : '/become-a-host'}
              className={`px-3 py-1.5 rounded-xl transition-all duration-200 ${
                path === '/become-a-host' || path === '/lender'
                  ? 'text-orange-600 font-bold bg-orange-50 dark:bg-orange-950/40'
                  : 'hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-900'
              }`}
            >
              {user?.role === 'lender' || user?.role === 'admin' ? 'Host Dashboard' : 'Become a Host'}
            </Link>
            <Link
              to="/about"
              className={`px-3 py-1.5 rounded-xl transition-all duration-200 ${
                path === '/about'
                  ? 'text-orange-600 font-bold bg-orange-50 dark:bg-orange-950/40'
                  : 'hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-900'
              }`}
            >
              About
            </Link>
          </nav>
        </div>

        {/* Desktop Right Side */}
        <div className="hidden md:flex items-center space-x-3">
          {/* Dark Mode Toggle Icon */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shadow-2xs"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-neutral-600 transition-transform duration-300 hover:-rotate-12" />
            )}
          </button>

          {/* Become a Host CTA */}
          <Link
            to={user?.role === 'lender' || user?.role === 'admin' ? '/lender' : '/become-a-host'}
            className="btn-shine flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 active:scale-95 rounded-xl transition-all duration-200 shadow-sm hover:shadow-orange-600/20 hover:-translate-y-0.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{user?.role === 'lender' || user?.role === 'admin' ? 'Host Dashboard' : 'Become a Host'}</span>
          </Link>

          {/* User Auto-Dashboard Link */}
          {user && (
            <Link
              to={user.role === 'admin' ? '/admin' : user.role === 'lender' ? '/lender' : '/customer'}
              className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 shadow-2xs cursor-pointer"
            >
              <CalendarCheck className="w-4 h-4 text-orange-600" />
              <span>
                {user.role === 'admin'
                  ? 'Admin Panel'
                  : user.role === 'lender'
                  ? 'Host Dashboard'
                  : 'Customer Dashboard'}
              </span>
            </Link>
          )}

          {/* User Profile or Google Sign In */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center space-x-2 p-1.5 pr-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-orange-500/40 bg-white dark:bg-neutral-900 shadow-2xs transition-all duration-200 cursor-pointer"
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name || 'User'}
                    className="w-7 h-7 rounded-lg object-cover border border-neutral-200 dark:border-neutral-700"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs">
                    {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 max-w-[110px] truncate">
                  {user.name?.split(' ')[0] || user.email?.split('@')[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400 transition-transform duration-200" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl py-2 z-50 text-xs text-neutral-900 dark:text-white animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-3.5 py-2.5 border-b border-neutral-100 dark:border-neutral-800">
                    <p className="font-bold text-neutral-900 dark:text-white truncate">{user.name || 'Verified Member'}</p>
                    <p className="text-neutral-500 dark:text-neutral-400 text-[11px] truncate">{user.email}</p>
                    <div className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 capitalize">
                      Role: {user.role === 'admin' ? 'Super Admin' : user.role === 'lender' ? 'Host' : 'Customer'}
                    </div>
                  </div>

                  <div className="py-1">
                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full text-left px-3.5 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center justify-between font-bold text-orange-600 dark:text-orange-400 transition-colors"
                      >
                        <span>System Admin Panel</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                    {user.role === 'lender' ? (
                      <Link
                        to="/lender"
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full text-left px-3.5 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center justify-between font-semibold transition-colors"
                      >
                        <span>Host Dashboard</span>
                        <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                      </Link>
                    ) : (
                      <Link
                        to="/customer"
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full text-left px-3.5 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center justify-between font-semibold transition-colors"
                      >
                        <span>Customer Dashboard</span>
                        <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                      </Link>
                    )}
                  </div>

                  <div className="border-t border-neutral-100 dark:border-neutral-800 pt-1">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onSignOutClick();
                      }}
                      className="w-full text-left px-3.5 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center space-x-2 font-semibold transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onSignInClick}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 bg-white dark:bg-neutral-900 text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-850 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 shadow-2xs cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.86c2.26-2.09 3.68-5.17 3.68-9.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.32 21.36 7.39 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.39 0 3.32 2.64 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                />
              </svg>
              <span>Sign in</span>
            </button>
          )}
        </div>

        {/* MOBILE HEADER BUTTONS */}
        <div className="flex md:hidden items-center space-x-1 sm:space-x-1.5 shrink-0">
          {/* 1. Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-1.5 sm:p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-neutral-600" />
            )}
          </button>

          {/* 2. Become a Host Quick Link (Shown on screens with enough width) */}
          <Link
            to="/become-a-host"
            className="hidden xs:flex items-center space-x-1 px-2.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-2xs shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-[11px] sm:text-xs">Become Host</span>
          </Link>

          {/* 3. Login / Profile Button */}
          {user ? (
            <Link
              to={user.role === 'admin' ? '/admin' : user.role === 'lender' ? '/lender' : '/customer'}
              className="p-1 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center space-x-1 shrink-0"
            >
              {user.avatar ? (
                <img src={user.avatar} alt="" className="w-6 h-6 rounded-lg object-cover" />
              ) : (
                <div className="w-6 h-6 rounded-lg bg-orange-100 text-orange-600 font-bold text-xs flex items-center justify-center">
                  {(user.name || 'U').charAt(0)}
                </div>
              )}
            </Link>
          ) : (
            <button
              onClick={onSignInClick}
              className="px-2 sm:px-2.5 py-1.5 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 rounded-xl text-xs font-bold shadow-2xs flex items-center space-x-1 shrink-0"
            >
              <UserIcon className="w-3.5 h-3.5 text-orange-600" />
              <span className="text-[11px] sm:text-xs hidden xxs:inline">Login</span>
            </button>
          )}

          {/* 4. Menu Drawer Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Open navigation menu"
            className="p-1.5 sm:p-2 rounded-xl text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shrink-0"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER MENU */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-4 space-y-4 animate-in slide-in-from-top-2 duration-200 max-h-[85vh] overflow-y-auto">
          {/* Mobile Nav Links */}
          <nav className="space-y-1 text-xs font-bold text-neutral-700 dark:text-neutral-300">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-900"
            >
              <div className="flex items-center space-x-2.5">
                <Car className="w-4 h-4 text-orange-600" />
                <span>Explore Fleet</span>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </Link>

            <Link
              to="/become-a-host"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-3 rounded-xl bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 font-extrabold"
            >
              <div className="flex items-center space-x-2.5">
                <Sparkles className="w-4 h-4 text-orange-600" />
                <span>Become a Host (Listing Wizard)</span>
              </div>
              <ChevronRight className="w-4 h-4 text-orange-400" />
            </Link>

            <Link
              to="/how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-900"
            >
              <div className="flex items-center space-x-2.5">
                <HelpCircle className="w-4 h-4 text-orange-600" />
                <span>How It Works</span>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </Link>

            <Link
              to="/insurance-protection"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-900"
            >
              <div className="flex items-center space-x-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Protection & Insurance</span>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </Link>

            <Link
              to="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-900"
            >
              <div className="flex items-center space-x-2.5">
                <Compass className="w-4 h-4 text-orange-600" />
                <span>About {settings.brand_name || 'Charvi Rental'}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </Link>
          </nav>

          {/* User Sign In / Sign Out CTA */}
          <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
            {user ? (
              <div className="flex items-center justify-between p-2">
                <div className="flex items-center space-x-2">
                  <img src={user.avatar || ''} className="w-8 h-8 rounded-lg object-cover" alt="" />
                  <div className="text-xs">
                    <p className="font-bold text-neutral-900 dark:text-white truncate">{user.name}</p>
                    <p className="text-neutral-500 text-[10px] truncate">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onSignOutClick();
                  }}
                  className="px-3 py-1.5 text-xs text-red-600 dark:text-red-400 font-bold border border-red-200 dark:border-red-900/50 rounded-lg hover:bg-red-50"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onSignInClick();
                }}
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shadow-2xs cursor-pointer"
              >
                <span>Sign in with Google</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
