import React from 'react';
import { ShieldCheck, Lock, CheckCircle2, X, FileCheck, Award, HeartHandshake } from 'lucide-react';

interface SecurityGuaranteeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityGuaranteeModal: React.FC<SecurityGuaranteeModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-white rounded-3xl border border-neutral-200 shadow-2xl overflow-hidden animate-in fade-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-200 bg-neutral-50/80">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-neutral-900 text-lg">Charvi Rental Trust & Safety</h3>
              <p className="text-xs text-neutral-500">Verified platform architecture & host standards</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs text-neutral-600">
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 flex items-start space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-sm">Protected Booking System</span>
              <p className="text-xs mt-0.5 text-emerald-900">
                All host profiles, vehicle availability dates, and reservations are verified in real time to prevent duplicate bookings or unauthorized access.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-start space-x-3 p-3.5 rounded-2xl border border-neutral-200 bg-white">
              <Lock className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-neutral-900 block text-xs">Google OAuth 2.0 Single Sign-On</span>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Secure cryptographic identity validation. We never store personal passwords or sensitive contact numbers publicly.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3.5 rounded-2xl border border-neutral-200 bg-white">
              <FileCheck className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-neutral-900 block text-xs">200-Point Host Vehicle Inspection</span>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Hosts must confirm maintenance standards, tire tread depth, and brake functionality before listing vehicles.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3.5 rounded-2xl border border-neutral-200 bg-white">
              <HeartHandshake className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-neutral-900 block text-xs">24/7 Roadside Concierge</span>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Every active rental comes with emergency assistance, lock-out service, towing, and flat-tire dispatch across North America.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-neutral-200 bg-neutral-50">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition-colors shadow-2xs"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
