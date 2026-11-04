import React from 'react';
import { Database, Server, CheckCircle2, AlertTriangle, ShieldCheck, X } from 'lucide-react';
import { DbStatusInfo } from '../types.ts';

interface DatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: DbStatusInfo | null;
  onRefresh: () => void;
}

export const DatabaseModal: React.FC<DatabaseModalProps> = ({
  isOpen,
  onClose,
  status,
  onRefresh,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-white rounded-2xl border border-neutral-200 shadow-2xl overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-200 bg-neutral-50/80">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${status?.connected ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-orange-50 text-orange-600 border border-orange-200'}`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 text-lg">MySQL Database Architecture</h3>
              <p className="text-xs text-neutral-500">Persistent storage configuration & secrets</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Status banner */}
          <div className={`p-4 rounded-xl border ${status?.connected ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' : 'bg-amber-50/60 border-amber-200 text-amber-900'}`}>
            <div className="flex items-start space-x-3">
              {status?.connected ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="text-sm">
                <p className="font-medium">
                  {status?.connected ? 'MySQL Database is Connected & Active' : 'Operating in Standalone Storage Mode'}
                </p>
                <p className="mt-0.5 text-xs text-neutral-600">
                  {status?.message}
                </p>
              </div>
            </div>
          </div>

          {/* Connection Details */}
          <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200 space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-neutral-200">
              <span className="text-neutral-500 font-medium">Database Host</span>
              <span className="font-mono text-neutral-800">{status?.host || '127.0.0.1'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-200">
              <span className="text-neutral-500 font-medium">Port</span>
              <span className="font-mono text-neutral-800">{status?.port || 3306} (Default)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-200">
              <span className="text-neutral-500 font-medium">User</span>
              <span className="font-mono text-neutral-800">{status?.user || 'root'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-200">
              <span className="text-neutral-500 font-medium">Database Name</span>
              <span className="font-mono text-neutral-800">{status?.database || 'drivemycarz'}</span>
            </div>
            {status?.stats && (
              <div className="flex justify-between py-1 pt-2">
                <span className="text-neutral-500 font-medium">Loaded Tables & Records</span>
                <span className="text-neutral-800 font-semibold">
                  {status.stats.cars} Cars · {status.stats.bookings} Bookings · {status.stats.users} Users
                </span>
              </div>
            )}
          </div>

          {/* AI Studio Secrets Configuration Guide */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-neutral-900 flex items-center gap-1.5">
              <Server className="w-4 h-4 text-orange-600" />
              Configure MySQL in AI Studio Secrets
            </h4>
            <p className="text-xs text-neutral-600 leading-relaxed">
              To connect Charvi Rental to your remote MySQL server or Cloud SQL instance, define the following variables in the <strong>Secrets</strong> panel:
            </p>

            <div className="bg-neutral-900 text-neutral-200 rounded-lg p-3 text-xs font-mono space-y-1">
              <div className="text-neutral-400"># AI Studio Secrets / Environment Variables</div>
              <div><span className="text-orange-400">DB_HOST</span>=&quot;your-mysql-host.example.com&quot;</div>
              <div><span className="text-orange-400">DB_PORT</span>=&quot;3306&quot;</div>
              <div><span className="text-orange-400">DB_USER</span>=&quot;your_db_username&quot;</div>
              <div><span className="text-orange-400">DB_PASSWORD</span>=&quot;your_db_password&quot;</div>
              <div><span className="text-orange-400">DB_NAME</span>=&quot;drivemycarz&quot;</div>
            </div>
          </div>

          {/* Database Schema Overview */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-neutral-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-orange-600" />
              Relational Tables Managed
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg border border-neutral-200 bg-white">
                <div className="font-semibold text-neutral-800">users</div>
                <div className="text-neutral-500 text-[11px]">Google OAuth profiles & roles</div>
              </div>
              <div className="p-2.5 rounded-lg border border-neutral-200 bg-white">
                <div className="font-semibold text-neutral-800">cars</div>
                <div className="text-neutral-500 text-[11px]">Vehicles, specs, rates, location</div>
              </div>
              <div className="p-2.5 rounded-lg border border-neutral-200 bg-white">
                <div className="font-semibold text-neutral-800">bookings</div>
                <div className="text-neutral-500 text-[11px]">Reservations, dates, pricing</div>
              </div>
              <div className="p-2.5 rounded-lg border border-neutral-200 bg-white">
                <div className="font-semibold text-neutral-800">reviews</div>
                <div className="text-neutral-500 text-[11px]">Verified guest ratings & feedback</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-neutral-200 bg-neutral-50">
          <button
            onClick={onRefresh}
            className="px-3.5 py-1.5 text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-lg transition-colors"
          >
            Check Connection
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
