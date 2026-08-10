"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Sparkles, Wallet } from "lucide-react";
import { toast } from "sonner";
import { MonthMultiSelect, MonthOption } from "@/components/ui/month-multi-select";
import { submitPaymentRequest } from "@/features/payments/actions/payment-actions";

import { PaymentStatus } from "@prisma/client";

export interface UserPaymentRecord {
  month: number;
  year: number;
  status: PaymentStatus;
}

interface MakePaymentCardProps {
  userPayments?: UserPaymentRecord[];
}

// Generate Mandal Months for 1 year cycle (October 2026 to September 2027)
function generateMandalMonthOptions(): MonthOption[] {
  const options: MonthOption[] = [];
  const startYr = 2026;

  const cycleMonths = [
    { name: "Oct", monthNum: "10", yrOffset: 0 },
    { name: "Nov", monthNum: "11", yrOffset: 0 },
    { name: "Dec", monthNum: "12", yrOffset: 0 },
    { name: "Jan", monthNum: "01", yrOffset: 1 },
    { name: "Feb", monthNum: "02", yrOffset: 1 },
    { name: "Mar", monthNum: "03", yrOffset: 1 },
    { name: "Apr", monthNum: "04", yrOffset: 1 },
    { name: "May", monthNum: "05", yrOffset: 1 },
    { name: "Jun", monthNum: "06", yrOffset: 1 },
    { name: "Jul", monthNum: "07", yrOffset: 1 },
    { name: "Aug", monthNum: "08", yrOffset: 1 },
    { name: "Sept", monthNum: "09", yrOffset: 1 },
  ];

  cycleMonths.forEach((m) => {
    const actualYr = startYr + m.yrOffset;
    options.push({
      label: `${m.name} ${actualYr}`,
      value: `${actualYr}-${m.monthNum}`,
    });
  });

  return options;
}

const BASE_MANDAL_MONTH_OPTIONS = generateMandalMonthOptions();
const MONTHLY_FEE = 500; // ₹500 per month

export function MakePaymentCard({ userPayments = [] }: MakePaymentCardProps) {
  const router = useRouter();
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Map user payments to mark paid (APPROVED) or PENDING months as disabled
  const userPaymentStatusMap = new Map<string, PaymentStatus>();
  userPayments.forEach((p) => {
    const monthStr = String(p.month).padStart(2, "0");
    const key = `${p.year}-${monthStr}`;
    userPaymentStatusMap.set(key, p.status);
  });

  const monthOptions: MonthOption[] = BASE_MANDAL_MONTH_OPTIONS.map((opt) => {
    const status = userPaymentStatusMap.get(opt.value);
    if (status === PaymentStatus.APPROVED) {
      return { ...opt, disabled: true, disabledReason: "Done" };
    }
    if (status === PaymentStatus.PENDING) {
      return { ...opt, disabled: true, disabledReason: "Pending" };
    }
    return opt;
  });

  const totalAmount = selectedMonths.length * MONTHLY_FEE;

  const handleMakePayment = async () => {
    if (selectedMonths.length === 0) {
      toast.error("Please select at least one month for payment.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await submitPaymentRequest(selectedMonths);
      if (res?.success) {
        toast.success("Payment Request Submitted!", {
          description: `Payment requested for ${res.count} month(s) (Total ₹${totalAmount.toLocaleString()}). Pending admin approval.`,
        });
        setSelectedMonths([]);
        router.refresh();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to submit payment request";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mb-8 rounded-2xl border border-white bg-white p-6 shadow-[0_12px_30px_rgb(77_55_135_/_0.07)] transition">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="text-[#7257f4]" size={20} />
        <h3 className="text-lg font-bold text-[#24203a]">Make Payment</h3>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
          Select Months
        </label>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <MonthMultiSelect
              options={monthOptions}
              selectedValues={selectedMonths}
              onChange={setSelectedMonths}
              placeholder="Select months to pay (Oct to Sept)"
            />
          </div>

          <button
            type="button"
            onClick={handleMakePayment}
            disabled={selectedMonths.length === 0 || submitting}
            className="h-11 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-[#654dde] via-[#8657ef] to-[#bd5ce8] shadow-lg shadow-violet-200 hover:brightness-105 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer text-sm"
          >
            <Wallet size={18} />
            {submitting
              ? "Processing..."
              : selectedMonths.length > 0
              ? `Make Payment (₹${totalAmount.toLocaleString()})`
              : "Make Payment"}
          </button>
        </div>

        {selectedMonths.length > 0 && (
          <div className="mt-3 flex items-center gap-2 text-xs font-medium text-[#7257f4] bg-violet-50/70 py-2 px-3 rounded-lg border border-violet-100/80">
            <Sparkles size={14} />
            <span>
              {selectedMonths.length} Month(s) selected • Total Amount:{" "}
              <strong>₹{totalAmount.toLocaleString()}</strong>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
