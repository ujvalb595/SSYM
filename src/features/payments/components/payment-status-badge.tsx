import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { PaymentStatus } from "@prisma/client";

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  if (status === PaymentStatus.APPROVED) {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-200/80 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
        <CheckCircle2 size={13} className="text-emerald-600" /> Done
      </span>
    );
  }

  if (status === PaymentStatus.REJECTED) {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg border border-rose-200/80 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700">
        <XCircle size={13} className="text-rose-600" /> Reject
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-lg border border-amber-200/80 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
      <Clock size={13} className="text-amber-600" /> Pending
    </span>
  );
}
