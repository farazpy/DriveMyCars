import React, { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  canonicalPath?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product' | 'profile';
  keywords?: string[];
  schema?: Record<string, any> | Array<Record<string, any>>;
  noindex?: boolean;
}

const DEFAULT_IMAGE = '/assets/hero_cars_crop.png';
const SITE_NAME = 'Charvi Rental';
const BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://charvirental.com';

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  canonicalPath,
  ogImage = DEFAULT_IMAGE,
  ogType = 'website',
  keywords = [
    'self drive car rental',
    'car rental Pune',
    'peer to peer car rental India',
    'rent a car Mumbai',
    'Charvi Rental',
    'SUV rental',
    'luxury car hire',
    'host car sharing'
  ],
  schema,
  noindex = false,
}) => {
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const canonicalUrl = canonicalPath
    ? `${BASE_URL}${canonicalPath.startsWith('/') ? canonicalPath : '/' + canonicalPath}`
    : typeof window !== 'undefined'
    ? `${BASE_URL}${window.location.pathname}`
    : BASE_URL;

  const fullImageUrl = ogImage.startsWith('http')
    ? ogImage
    : `${BASE_URL}${ogImage.startsWith('/') ? ogImage : '/' + ogImage}`;

  useEffect(() => {
    // 1. Update Document Title
    document.title = fullTitle;

    // Helper to set or create meta tags
    const setMeta = (nameOrProperty: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${nameOrProperty}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, nameOrProperty);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 2. Standard Meta Tags
    setMeta('description', description);
    if (keywords.length > 0) {
      setMeta('keywords', keywords.join(', '));
    }
    setMeta('robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    setMeta('author', 'Charvi Rental Fleet');

    // 3. Open Graph Tags
    setMeta('og:site_name', SITE_NAME, true);
    setMeta('og:title', fullTitle, true);
    setMeta('og:description', description, true);
    setMeta('og:type', ogType, true);
    setMeta('og:url', canonicalUrl, true);
    setMeta('og:image', fullImageUrl, true);
    setMeta('og:locale', 'en_IN', true);

    // 4. Twitter Card Tags
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', description);
    setMeta('twitter:image', fullImageUrl);

    // 5. Canonical Link
    let canonicalTag = document.querySelector('link[rel="canonical"]');
    if (!canonicalTag) {
      canonicalTag = document.createElement('link');
      canonicalTag.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalTag);
    }
    canonicalTag.setAttribute('href', canonicalUrl);

    // 6. JSON-LD Structured Data
    const scriptId = 'charvi-structured-data-jsonld';
    let scriptTag = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (schema) {
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = scriptId;
        scriptTag.type = 'application/ld+json';
        document.head.appendChild(scriptTag);
      }
      scriptTag.text = JSON.stringify(schema);
    } else if (scriptTag) {
      scriptTag.remove();
    }
  }, [fullTitle, description, canonicalUrl, fullImageUrl, ogType, keywords, schema, noindex]);

  return null;
};
