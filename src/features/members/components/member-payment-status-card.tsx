"use client";

import { AlertCircle, CheckCircle2, Clock, Wallet, XCircle } from "lucide-react";
import { PaymentStatus } from "@prisma/client";

export interface UserPaymentRecord {
  month: number;
  year: number;
  amount: number;
  status: PaymentStatus;
}

interface MemberPaymentStatusCardProps {
  payments: UserPaymentRecord[];
}

const MANDAL_MONTH_CYCLE = [
  { name: "Oct", fullMonth: "October", monthNum: 10, year: 2026 },
  { name: "Nov", fullMonth: "November", monthNum: 11, year: 2026 },
  { name: "Dec", fullMonth: "December", monthNum: 12, year: 2026 },
  { name: "Jan", fullMonth: "January", monthNum: 1, year: 2027 },
  { name: "Feb", fullMonth: "February", monthNum: 2, year: 2027 },
  { name: "Mar", fullMonth: "March", monthNum: 3, year: 2027 },
  { name: "Apr", fullMonth: "April", monthNum: 4, year: 2027 },
  { name: "May", fullMonth: "May", monthNum: 5, year: 2027 },
  { name: "Jun", fullMonth: "June", monthNum: 6, year: 2027 },
  { name: "Jul", fullMonth: "July", monthNum: 7, year: 2027 },
  { name: "Aug", fullMonth: "August", monthNum: 8, year: 2027 },
  { name: "Sept", fullMonth: "September", monthNum: 9, year: 2027 },
];

export function MemberPaymentStatusCard({ payments = [] }: MemberPaymentStatusCardProps) {
  // Map payments by key "YEAR-MONTH"
  const paymentMap = new Map<string, UserPaymentRecord>();
  payments.forEach((p) => {
    paymentMap.set(`${p.year}-${p.month}`, p);
  });

  const approvedPayments = payments.filter((p) => p.status === PaymentStatus.APPROVED);
  const pendingPayments = payments.filter((p) => p.status === PaymentStatus.PENDING);
  const totalPaidAmount = approvedPayments.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="rounded-2xl border border-white bg-white p-6 shadow-[0_12px_30px_rgb(77_55_135_/_0.07)]">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5 border-b border-stone-100 pb-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-violet-100 text-[#7257f4]">
            <Wallet size={20} />
          </span>
          <div>
            <h3 className="text-lg font-bold text-[#24203a]">Month-Wise Payment Status</h3>
            <p className="text-xs text-stone-500">Mandal contribution records (Oct 2026 – Sept 2027)</p>
          </div>
        </div>

        {/* Summary Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
            <CheckCircle2 size={14} />
            {approvedPayments.length} / 12 Paid (₹{totalPaidAmount.toLocaleString()})
          </span>

          {pendingPayments.length > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
              <Clock size={14} />
              {pendingPayments.length} Pending
            </span>
          )}
        </div>
      </div>

      {/* Month-wise Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {MANDAL_MONTH_CYCLE.map((item) => {
          const key = `${item.year}-${item.monthNum}`;
          const record = paymentMap.get(key);

          const status = record ? record.status : null;

          return (
            <div
              key={key}
              className={`flex flex-col justify-between rounded-xl border p-3.5 transition ${
                status === PaymentStatus.APPROVED
                  ? "border-emerald-200/80 bg-emerald-50/40"
                  : status === PaymentStatus.PENDING
                  ? "border-amber-200/80 bg-amber-50/40"
                  : status === PaymentStatus.REJECTED
                  ? "border-rose-200/80 bg-rose-50/40"
                  : "border-stone-200/60 bg-stone-50/50"
              }`}
            >
              <div>
                <p className="text-xs font-bold text-[#24203a]">
                  {item.name} <span className="font-normal text-stone-500">{item.year}</span>
                </p>
              </div>

              <div className="mt-3">
                {status === PaymentStatus.APPROVED ? (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-2 py-1 text-[11px] font-bold text-emerald-800">
                    <CheckCircle2 size={12} className="text-emerald-600" /> Done
                  </span>
                ) : status === PaymentStatus.PENDING ? (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-2 py-1 text-[11px] font-bold text-amber-800">
                    <Clock size={12} className="text-amber-600" /> Pending
                  </span>
                ) : status === PaymentStatus.REJECTED ? (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-rose-100 px-2 py-1 text-[11px] font-bold text-rose-800">
                    <XCircle size={12} className="text-rose-600" /> Rejected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-stone-200/70 px-2 py-1 text-[11px] font-semibold text-stone-600">
                    <AlertCircle size={12} className="text-stone-400" /> Unpaid
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
