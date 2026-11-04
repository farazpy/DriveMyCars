import React from 'react';
import {
  X,
  Printer,
  Download,
  Car as CarIcon,
  ShieldCheck,
  CheckCircle2,
  Building2,
  FileText
} from 'lucide-react';
import { Booking } from '../types.ts';
import { usePlatformSettings } from '../context/PlatformSettingsContext.tsx';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  mode?: 'customer' | 'lender' | 'admin';
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  booking,
  mode = 'customer',
}) => {
  const { settings } = usePlatformSettings();
  if (!isOpen || !booking) return null;

  const grossTotal = Number(booking.total_price || 0);
  const extraKmCharge = Number(booking.extra_km_charge || 0);
  const baseRentalSubtotal = Math.round(grossTotal / 1.18);
  const gstAmount = grossTotal - baseRentalSubtotal;
  const cgst = Math.round(gstAmount / 2);
  const sgst = gstAmount - cgst;

  const platformFee = booking.platform_commission
    ? Number(booking.platform_commission)
    : Math.round(grossTotal * 0.1);
  const netHostPayout = booking.net_lender_payout
    ? Number(booking.net_lender_payout)
    : Math.round(grossTotal * 0.9) + extraKmCharge;

  const invoiceNumber = `DMC-INV-${booking.id.replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase()}`;
  const invoiceDate = booking.created_at
    ? new Date(booking.created_at).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN');

  const handleDownloadStatement = () => {
    const lines = [
      `CHARVI RENTAL INDIA - ${mode === 'lender' ? 'HOST PAYOUT STATEMENT' : 'GST TAX INVOICE'}`,
      `===================================================================`,
      `Invoice Number   : ${invoiceNumber}`,
      `Booking Ref      : ${booking.id}`,
      `Issue Date       : ${invoiceDate}`,
      `GSTIN            : 27AABCD8921F1Z5 (Maharashtra)`,
      `-------------------------------------------------------------------`,
      `CUSTOMER DETAILS`,
      `Name             : ${booking.renter_name}`,
      `Email            : ${booking.renter_email}`,
      `-------------------------------------------------------------------`,
      `TRIP & VEHICLE DETAILS`,
      `Vehicle          : ${booking.car_title}`,
      `Pick-up          : ${booking.pickup_datetime.replace('T', ' ')}`,
      `Drop-off         : ${booking.dropoff_datetime.replace('T', ' ')}`,
      `Duration         : ${booking.total_days} Day(s)`,
      `Protection Plan  : ${booking.insurance_plan || 'Standard'}`,
      `Odometer Log     : ${booking.start_odometer ? `${booking.start_odometer} km -> ${booking.end_odometer || 'Active'} km` : 'Standard Digital Check-in'}`,
      `-------------------------------------------------------------------`,
      `FINANCIAL BREAKDOWN (INR)`,
      `Base Rental & Protection : Rs. ${baseRentalSubtotal.toLocaleString('en-IN')}`,
      `CGST (9%)                : Rs. ${cgst.toLocaleString('en-IN')}`,
      `SGST (9%)                : Rs. ${sgst.toLocaleString('en-IN')}`,
      `Extra Km Charges         : Rs. ${extraKmCharge.toLocaleString('en-IN')}`,
      `Total Gross Amount       : Rs. ${(grossTotal + extraKmCharge).toLocaleString('en-IN')}`,
      ...(mode !== 'customer'
        ? [
            `Platform Commission (10%): -Rs. ${platformFee.toLocaleString('en-IN')}`,
            `Net Host Settlement (90%): Rs. ${netHostPayout.toLocaleString('en-IN')}`,
            `Payout Status            : ${(booking.payout_status || 'pending').toUpperCase()}`,
          ]
        : []),
      `===================================================================`,
      `Thank you for choosing Charvi Rental Self-Drive Fleet!`,
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoiceNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 text-neutral-900 dark:text-neutral-100">
        {/* Top Action Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-orange-600 text-white">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-neutral-900 dark:text-white">
                {mode === 'lender' ? 'Host Payout & Settlement Voucher' : 'Official GST Tax Invoice'}
              </h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                {invoiceNumber} · Issued {invoiceDate}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-100 text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-orange-600" />
              <span>Print / PDF</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadStatement}
              className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs">
          {/* Brand & Tax Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-neutral-200 dark:border-neutral-800">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                {settings.logo_url ? (
                  <img src={settings.logo_url} alt={settings.brand_name} className="h-7 object-contain rounded" />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-orange-600 text-white flex items-center justify-center">
                    <CarIcon className="w-4 h-4" />
                  </div>
                )}
                <span className="font-black text-lg tracking-tight">
                  {settings.brand_name} Mobility
                </span>
              </div>
              <p className="text-neutral-500 dark:text-neutral-400 text-[11px]">
                {settings.contact_address || 'Wakad Hub, Pune, Maharashtra, India'}
              </p>
              <p className="text-neutral-500 dark:text-neutral-400 text-[11px] font-mono">
                GSTIN: {settings.gst_number || '27AABCD8921F1Z5'} · SAC Code: 996601
              </p>
            </div>

            <div className="sm:text-right space-y-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                {booking.status === 'cancelled' ? 'Cancelled' : 'Paid & Verified'}
              </span>
              <p className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                Ref: {booking.id}
              </p>
              <p className="text-[11px] text-neutral-400">Date: {invoiceDate}</p>
            </div>
          </div>

          {/* Billed To & Trip Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-50 dark:bg-neutral-950 p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                Billed To (Verified Renter)
              </span>
              <p className="font-bold text-sm text-neutral-900 dark:text-white">{booking.renter_name}</p>
              <p className="text-neutral-500 dark:text-neutral-400">{booking.renter_email}</p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 pt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" /> DigiLocker KYC & DL Verified
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                Vehicle & Schedule
              </span>
              <p className="font-bold text-sm text-neutral-900 dark:text-white">{booking.car_title}</p>
              <p className="text-neutral-600 dark:text-neutral-300">
                Pick-up: <strong>{booking.pickup_datetime.replace('T', ' ')}</strong>
              </p>
              <p className="text-neutral-600 dark:text-neutral-300">
                Drop-off: <strong>{booking.dropoff_datetime.replace('T', ' ')}</strong> ({booking.total_days}{' '}
                {booking.total_days === 1 ? 'day' : 'days'})
              </p>
            </div>
          </div>

          {/* Odometer & Handover Telemetry (if recorded) */}
          {(booking.start_odometer || booking.end_odometer || booking.fuel_level) && (
            <div className="p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-neutral-900">
              <div>
                <span className="text-[10px] font-bold uppercase text-neutral-400 block">Start Odometer</span>
                <span className="font-mono font-bold text-neutral-900 dark:text-white tabular-nums">
                  {booking.start_odometer ? `${booking.start_odometer.toLocaleString('en-IN')} km` : '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-neutral-400 block">End Odometer</span>
                <span className="font-mono font-bold text-neutral-900 dark:text-white tabular-nums">
                  {booking.end_odometer ? `${booking.end_odometer.toLocaleString('en-IN')} km` : 'In Progress'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-neutral-400 block">Total Distance Driven</span>
                <span className="font-mono font-bold text-orange-600 tabular-nums">
                  {booking.start_odometer && booking.end_odometer
                    ? `${Math.max(0, booking.end_odometer - booking.start_odometer)} km`
                    : '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-neutral-400 block">Handover Fuel Level</span>
                <span className="font-bold text-neutral-900 dark:text-white">{booking.fuel_level || '100% Full'}</span>
              </div>
            </div>
          )}

          {/* Itemized Financial Table */}
          <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-100 dark:bg-neutral-800/80 text-[10px] font-bold uppercase text-neutral-500 dark:text-neutral-400">
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Rate</th>
                  <th className="py-3 px-4 text-right">Qty</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-xs tabular-nums">
                <tr>
                  <td className="py-3 px-4">
                    <span className="font-bold text-neutral-900 dark:text-white block">
                      Self-Drive Vehicle Rental — {booking.car_title}
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      Includes {booking.insurance_plan || 'Standard'} Trip Protection & FASTag Access
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono">
                    ₹{Number(booking.price_per_day).toLocaleString('en-IN')}/day
                  </td>
                  <td className="py-3 px-4 text-right font-mono">{booking.total_days}d</td>
                  <td className="py-3 px-4 text-right font-mono font-bold">
                    ₹{baseRentalSubtotal.toLocaleString('en-IN')}
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 px-4 text-neutral-500">CGST (9% Central Goods & Services Tax)</td>
                  <td className="py-2.5 px-4 text-right font-mono">9%</td>
                  <td className="py-2.5 px-4 text-right font-mono">1</td>
                  <td className="py-2.5 px-4 text-right font-mono">₹{cgst.toLocaleString('en-IN')}</td>
                </tr>

                <tr>
                  <td className="py-2.5 px-4 text-neutral-500">SGST (9% State Goods & Services Tax)</td>
                  <td className="py-2.5 px-4 text-right font-mono">9%</td>
                  <td className="py-2.5 px-4 text-right font-mono">1</td>
                  <td className="py-2.5 px-4 text-right font-mono">₹{sgst.toLocaleString('en-IN')}</td>
                </tr>

                {extraKmCharge > 0 && (
                  <tr>
                    <td className="py-2.5 px-4 text-amber-700 dark:text-amber-300 font-semibold">
                      Excess Kilometer Odometer Adjustment
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono">As per log</td>
                    <td className="py-2.5 px-4 text-right font-mono">1</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold">
                      ₹{extraKmCharge.toLocaleString('en-IN')}
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-neutral-50 dark:bg-neutral-950 border-t-2 border-neutral-200 dark:border-neutral-800 tabular-nums">
                <tr>
                  <td colSpan={3} className="py-3 px-4 font-bold text-neutral-900 dark:text-white text-right">
                    Gross Invoice Total (Inclusive of 18% GST)
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-black text-base text-orange-600">
                    ₹{(grossTotal + extraKmCharge).toLocaleString('en-IN')}
                  </td>
                </tr>

                {mode !== 'customer' && (
                  <>
                    <tr className="border-t border-neutral-200/70 dark:border-neutral-800 text-neutral-500">
                      <td colSpan={3} className="py-2 px-4 text-right">
                        Less: Charvi Rental Platform Governance & Insurance Fee (10%)
                      </td>
                      <td className="py-2 px-4 text-right font-mono text-red-600">
                        -₹{platformFee.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr className="border-t border-neutral-200 dark:border-neutral-800 bg-emerald-50/50 dark:bg-emerald-950/30">
                      <td colSpan={3} className="py-3 px-4 font-extrabold text-emerald-800 dark:text-emerald-300 text-right">
                        Net Host Settlement Payout (90% + Extra Km)
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-base text-emerald-600 dark:text-emerald-400">
                        ₹{netHostPayout.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </>
                )}
              </tfoot>
            </table>
          </div>

          <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-2">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-orange-600" />
              Computer-generated electronic tax invoice · Valid without signature.
            </span>
            <span className="font-mono">{settings.brand_name} v1.3.4</span>
          </div>
        </div>
      </div>
    </div>
  );
};
