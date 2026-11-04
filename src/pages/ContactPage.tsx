import React, { useState } from 'react';
import {
  Mail,
  MapPin,
  Headphones,
  CheckCircle2,
  ChevronDown,
  MessageSquare,
  Clock,
  Sparkles
} from 'lucide-react';

import { SEO } from '../components/SEO.tsx';

export const ContactPage: React.FC = () => {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('General Inquiries');
  const [message, setMessage] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setFormSubmitted(true);
  };

  const FAQS = [
    {
      q: 'What is required to rent a vehicle on Charvi Rental?',
      a: 'Renters must be at least 21 years old, possess a valid driver’s license, and pass our automated identity verification. International driver’s licenses are accepted with passport verification.'
    },
    {
      q: 'How does vehicle insurance work during the rental period?',
      a: 'All rentals automatically include statutory liability coverage and 24/7 roadside assistance. You can also opt for Premium Protection ($0 deductible) during checkout.'
    },
    {
      q: 'Can I lease my car if it has an existing auto loan?',
      a: 'Yes, most personal auto loans permit peer-to-peer hosting. Our commercial policy provides primary coverage during the entire booked trip.'
    },
    {
      q: 'What is the fuel and charging return policy?',
      a: 'Guests must return the vehicle at the same fuel or electric battery charge level as recorded at trip start.'
    }
  ];

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.a,
      },
    })),
  };

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-10 sm:py-16 space-y-16">
      <SEO
        title="24/7 Customer Support & Roadside Care | Charvi Rental"
        description="Get in touch with Charvi Rental 24/7 support. Instant roadside concierge, booking assistance, and host queries across India."
        canonicalPath="/contact"
        ogType="website"
        keywords={['Charvi Rental contact', 'car rental support Pune', 'roadside assistance phone number']}
        schema={faqSchema}
      />
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
          <Headphones className="w-3.5 h-3.5 text-orange-600" />
          <span>24/7 Customer Support Concierge</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-neutral-900 tracking-tight">
          We're Here Whenever You Need Us
        </h1>
        <p className="text-sm text-neutral-600">
          Have a question about a reservation, vehicle listing, or roadside care? Reach out to our dedicated support team anytime.
        </p>
      </div>

      {/* Main Grid: Form + Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Contact Form */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-sm space-y-6">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-neutral-900">Send an Inquiry</h3>
            <p className="text-xs text-neutral-500">Our concierge replies within an average of 15 minutes.</p>
          </div>

          {formSubmitted ? (
            <div className="p-8 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h4 className="text-lg font-bold text-emerald-950">Message Dispatched!</h4>
              <p className="text-xs text-emerald-800 max-w-xs mx-auto">
                Thank you, {name}. A support specialist will review your request and reply to <strong>{email}</strong> shortly.
              </p>
              <button
                onClick={() => {
                  setFormSubmitted(false);
                  setMessage('');
                }}
                className="mt-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full bg-white border border-neutral-200 rounded-lg p-2.5 font-medium focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@example.com"
                    className="w-full bg-white border border-neutral-200 rounded-lg p-2.5 font-medium focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">Subject</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-white border border-neutral-200 rounded-lg p-2.5 font-medium focus:border-orange-500 focus:outline-none"
                >
                  <option value="General Inquiries">General Rental Inquiries</option>
                  <option value="Host Listing Help">Host / Car Leasing Assistance</option>
                  <option value="Active Trip Support">Active Trip & Key Handover</option>
                  <option value="Billing & Protection">Billing & Insurance Question</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">Message</label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can our operations team assist you today?"
                  className="w-full bg-white border border-neutral-200 rounded-lg p-2.5 font-medium focus:border-orange-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs transition-colors shadow-2xs"
              >
                Submit Inquiry
              </button>
            </form>
          )}
        </div>

        {/* Quick Contact Info Cards */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-2xl border border-neutral-200 bg-white space-y-3 text-xs">
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-200">
              <Headphones className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-neutral-900 text-sm">24/7 Roadside Emergency Dispatch</h4>
            <p className="text-neutral-600 leading-relaxed">
              If you are currently on an active trip and experience a mechanical concern, flat tire, or require towing assistance:
            </p>
            <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 font-mono text-neutral-800 font-bold">
              1-800-555-CARZ (Toll-Free)
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-neutral-200 bg-white space-y-3 text-xs">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <Mail className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-neutral-900 text-sm">Direct Concierge Email</h4>
            <p className="text-neutral-600 leading-relaxed">
              For partnership inquiries, host fleet onboarding, or media requests:
            </p>
            <span className="font-semibold text-orange-600 block">concierge@charvirental.com</span>
          </div>

          <div className="p-6 rounded-2xl border border-neutral-200 bg-white space-y-2 text-xs">
            <div className="w-9 h-9 rounded-xl bg-neutral-100 text-neutral-800 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-neutral-900 text-sm">Headquarters & Operating Hubs</h4>
            <p className="text-neutral-600">
              Charvi Rental India<br />
              Wakad, Pune<br />
              Maharashtra 411057
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="space-y-4 max-w-3xl mx-auto pt-6">
        <h3 className="text-2xl font-black text-neutral-900 text-center">Frequently Asked Questions</h3>
        <div className="space-y-3 pt-2">
          {FAQS.map((faq, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl border border-neutral-200 bg-white cursor-pointer transition-colors"
              onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
            >
              <div className="flex justify-between items-center text-xs font-bold text-neutral-900">
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-neutral-400 transition-transform ${
                    openFaq === idx ? 'rotate-180 text-orange-600' : ''
                  }`}
                />
              </div>
              {openFaq === idx && (
                <p className="mt-2 text-xs text-neutral-600 leading-relaxed border-t border-neutral-100 pt-2">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
