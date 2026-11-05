import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface PlatformSettings {
  id: string;
  brand_name: string;
  brand_tagline: string;
  logo_url: string;
  logo_dark_url?: string;
  favicon_png_96_url?: string;
  favicon_svg_url?: string;
  favicon_ico_url?: string;
  apple_touch_icon_url?: string;
  webmanifest_url?: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  domain_name: string;
  support_hours: string;
  gst_number: string;
  social_instagram: string;
  social_twitter: string;
  social_facebook: string;
  commission_rate: number;
  gst_rate: number;
  security_deposit_default: number;
  min_booking_hours: number;
  default_km_limit: number;
  default_extra_km_rate: number;
  auto_approve_vehicles: boolean;
  auto_approve_hosts: boolean;
  updated_at?: string;
}

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  id: 'global',
  brand_name: 'Charvi Rental',
  brand_tagline: 'Self-Drive Fleet · India',
  logo_url: '',
  logo_dark_url: '',
  favicon_png_96_url: '/favicon-96x96.png',
  favicon_svg_url: '/favicon.svg',
  favicon_ico_url: '/favicon.ico',
  apple_touch_icon_url: '/apple-touch-icon.png',
  webmanifest_url: '/site.webmanifest',
  contact_email: 'operationalhtklabs@gmail.com',
  contact_phone: '+91 98765 43210',
  contact_address: 'Wakad, Pune, Maharashtra, India',
  domain_name: 'charvirental.com',
  support_hours: '24/7 Roadside & Concierge Support',
  gst_number: '27AAACD1234F1Z5',
  social_instagram: 'https://instagram.com/charvirental',
  social_twitter: 'https://twitter.com/charvirental',
  social_facebook: 'https://facebook.com/charvirental',
  commission_rate: 10,
  gst_rate: 18,
  security_deposit_default: 3000,
  min_booking_hours: 8,
  default_km_limit: 300,
  default_extra_km_rate: 12,
  auto_approve_vehicles: false,
  auto_approve_hosts: false,
};

interface PlatformSettingsContextType {
  settings: PlatformSettings;
  loading: boolean;
  updateSettings: (updates: Partial<PlatformSettings>) => Promise<boolean>;
  refreshSettings: () => Promise<void>;
}

const PlatformSettingsContext = createContext<PlatformSettingsContextType>({
  settings: DEFAULT_PLATFORM_SETTINGS,
  loading: true,
  updateSettings: async () => false,
  refreshSettings: async () => {},
});

export const PlatformSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_PLATFORM_SETTINGS);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings((prev) => ({ ...prev, ...data }));
      }
    } catch (e) {
      console.warn('Failed to fetch platform settings, using defaults:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Dynamically reflect uploaded favicons, icons and manifest live in document.head
  useEffect(() => {
    if (!settings) return;

    const setHeadLink = (rel: string, href: string | undefined, defaultHref: string, attrs: Record<string, string> = {}) => {
      const targetHref = href || defaultHref;
      let selector = `link[rel="${rel}"]`;
      if (attrs.type) selector += `[type="${attrs.type}"]`;
      if (attrs.sizes) selector += `[sizes="${attrs.sizes}"]`;

      let link = document.querySelector(selector) as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.rel = rel;
        Object.entries(attrs).forEach(([k, v]) => link!.setAttribute(k, v));
        document.head.appendChild(link);
      }
      link.href = targetHref;
    };

    setHeadLink('icon', settings.favicon_png_96_url, '/favicon-96x96.png', { type: 'image/png', sizes: '96x96' });
    setHeadLink('icon', settings.favicon_svg_url, '/favicon.svg', { type: 'image/svg+xml' });
    setHeadLink('shortcut icon', settings.favicon_ico_url, '/favicon.ico');
    setHeadLink('apple-touch-icon', settings.apple_touch_icon_url, '/apple-touch-icon.png', { sizes: '180x180' });
    setHeadLink('manifest', settings.webmanifest_url, '/site.webmanifest');
  }, [settings]);

  const updateSettings = async (updates: Partial<PlatformSettings>): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updated = await res.json();
        setSettings(updated);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to update platform settings:', e);
      return false;
    }
  };

  return (
    <PlatformSettingsContext.Provider
      value={{
        settings,
        loading,
        updateSettings,
        refreshSettings: fetchSettings,
      }}
    >
      {children}
    </PlatformSettingsContext.Provider>
  );
};

export const usePlatformSettings = () => useContext(PlatformSettingsContext);
