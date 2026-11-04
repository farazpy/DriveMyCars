import React from 'react';
import { X, KeyRound, Car, ArrowRight, ShieldCheck } from 'lucide-react';
import { UserRole } from '../types.ts';

interface RoleSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRole: (role: UserRole) => void;
  currentRole: UserRole;
  isInitialSignIn?: boolean;
}

export const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectRole,
  currentRole,
  isInitialSignIn = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-2xl sm:rounded-3xl border border-neutral-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-200 bg-neutral-50/80">
          <div>
            <h3 className="font-extrabold text-neutral-900 text-lg">
              {isInitialSignIn ? 'Choose Your Profile Role' : 'Switch Active Role'}
            </h3>
            <p className="text-xs text-neutral-500">You can switch between Renter and Lender anytime</p>
          </div>
          {!isInitialSignIn && (
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Option 1: Renter */}
          <div
            onClick={() => onSelectRole('renter')}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start space-x-4 ${
              currentRole === 'renter'
                ? 'border-orange-500 bg-orange-50/40 shadow-xs'
                : 'border-neutral-200 hover:border-neutral-300 bg-white'
            }`}
          >
            <div className="p-3 rounded-xl bg-orange-100 text-orange-600 shrink-0">
              <KeyRound className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-neutral-900 text-sm">Renter</h4>
                {currentRole === 'renter' && (
                  <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 mt-1 leading-normal">
                Browse verified cars, compare daily rates, filter by pick-up/drop-off dates, and book instantly.
              </p>
            </div>
          </div>

          {/* Option 2: Lender */}
          <div
            onClick={() => onSelectRole('lender')}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start space-x-4 ${
              currentRole === 'lender'
                ? 'border-orange-500 bg-orange-50/40 shadow-xs'
                : 'border-neutral-200 hover:border-neutral-300 bg-white'
            }`}
          >
            <div className="p-3 rounded-xl bg-neutral-900 text-white shrink-0">
              <Car className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-neutral-900 text-sm">Lender (Host)</h4>
                {currentRole === 'lender' && (
                  <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 mt-1 leading-normal">
                List and lease your personal vehicle, set your own daily rates, manage fleet availability, and earn revenue.
              </p>
            </div>
          </div>

          <div className="pt-2 text-center text-[11px] text-neutral-400 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Authenticated with Google OAuth 2.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};
