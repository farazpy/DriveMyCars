import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, Loader2, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
  userRole: 'customer' | 'lender' | 'renter' | 'admin';
  onAccountDeleted: () => Promise<void>;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  onClose,
  userId,
  userEmail,
  userRole,
  onAccountDeleted,
}) => {
  const [consentChecked, setConsentChecked] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isConfirmed = consentChecked && confirmInput.trim().toUpperCase() === 'DELETE';

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfirmed) return;

    setIsDeleting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await onAccountDeleted();
        onClose();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to delete account. Please try again.');
      }
    } catch (err: any) {
      console.error('Account deletion error:', err);
      setErrorMsg(err.message || 'Network error deleting account.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl border border-red-200 dark:border-red-900/60 shadow-2xl overflow-hidden flex flex-col text-neutral-900 dark:text-white transition-colors">
        
        {/* Top Danger Bar */}
        <div className="h-2 bg-gradient-to-r from-red-600 via-rose-600 to-red-600" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 space-y-5">
          {/* Header Icon & Title */}
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-neutral-900 dark:text-white">
                Permanently Delete Account
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                {userEmail ? `Target Account: ${userEmail}` : 'Charvi Rental User Account'}
              </p>
            </div>
          </div>

          {/* Warning Card */}
          <div className="p-4 rounded-2xl bg-red-50/80 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-xs space-y-2">
            <span className="font-extrabold text-red-900 dark:text-red-300 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
              This action is permanent and cannot be undone!
            </span>
            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed text-[11px]">
              Upon deletion, the following data will be permanently purged from MySQL database:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-neutral-700 dark:text-neutral-300 font-medium pl-1">
              <li>Your personal profile, contact information, and KYC verification records.</li>
              {userRole === 'lender' && (
                <li className="text-red-700 dark:text-red-300 font-bold">
                  All listed fleet vehicles in your collection and host earnings logs.
                </li>
              )}
              <li>All trip booking reservations and rental history associated with your ID.</li>
              <li>All uploaded documents (Driving Licence, Aadhaar Card, ID proofs).</li>
            </ul>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-300 rounded-xl text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleDelete} className="space-y-4 pt-1">
            {/* Explicit Consent Checkbox */}
            <label className="flex items-start space-x-3 p-3 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-neutral-300 text-red-600 focus:ring-red-500 cursor-pointer"
              />
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 leading-tight">
                I explicitly consent to deleting my account and understand that all my MySQL database records will be erased permanently.
              </span>
            </label>

            {/* Typing Confirmation Input */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Type <span className="text-red-600 dark:text-red-400 font-black">DELETE</span> below to confirm:
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="Type DELETE"
                className="w-full px-3.5 py-2 text-xs font-mono font-bold rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 tracking-wider"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!isConfirmed || isDeleting}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-2xs transition-colors cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Purging Account Data...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete My Account Permanently</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
