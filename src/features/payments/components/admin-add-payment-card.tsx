"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Sparkles, Check, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { MonthMultiSelect, MonthOption } from "@/components/ui/month-multi-select";
import { adminSubmitPaymentRequest } from "@/features/payments/actions/payment-actions";

interface UserOption {
  id: string;
  name: string;
  membershipNumber: string | null;
}

interface AdminAddPaymentCardProps {
  users: UserOption[];
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

export function AdminAddPaymentCard({ users }: AdminAddPaymentCardProps) {
  const router = useRouter();
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const totalAmount = selectedMonths.length * MONTHLY_FEE;

  const handleAdminPayment = async () => {
    if (!selectedUserId) {
      toast.error("Please select a user.");
      return;
    }
    if (selectedMonths.length === 0) {
      toast.error("Please select at least one month.");
      return;
    }
    if (!paymentDate) {
      toast.error("Please select a payment date.");
      return;
    }
    if (!isConfirmed) {
      toast.error("Please check the confirmation box.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await adminSubmitPaymentRequest(
        selectedUserId,
        selectedMonths,
        paymentDate
      );
      if (res?.success) {
        toast.success("Transaction Added!", {
          description: `Automatically approved payment for ${selectedMonths.length} month(s).`,
        });
        setSelectedMonths([]);
        setSelectedUserId("");
        setIsConfirmed(false);
        setShowForm(false);
        router.refresh();
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to add payment";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mb-8 rounded-2xl border border-white bg-white p-6 shadow-[0_12px_30px_rgb(77_55_135_/_0.07)] transition">
      <div 
        className="flex items-center justify-between cursor-pointer" 
        onClick={() => setShowForm(!showForm)}
      >
        <div className="flex items-center gap-2">
          <UserPlus className="text-emerald-500" size={20} />
          <h3 className="text-lg font-bold text-[#24203a]">
            Admin: Add User Payment
          </h3>
        </div>
        <ChevronDown 
          className={`text-stone-400 transition-transform ${showForm ? "rotate-180" : ""}`} 
        />
      </div>

      {showForm && (
        <div className="mt-6 flex flex-col gap-4 border-t border-stone-100 pt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                Select Member
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:border-[#7257f4] focus:outline-none focus:ring-1 focus:ring-[#7257f4]"
              >
                <option value="">-- Choose Member --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} {u.membershipNumber ? `(${u.membershipNumber})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                Payment Date
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:border-[#7257f4] focus:outline-none focus:ring-1 focus:ring-[#7257f4]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
              Select Months
            </label>
            <MonthMultiSelect
              options={BASE_MANDAL_MONTH_OPTIONS}
              selectedValues={selectedMonths}
              onChange={setSelectedMonths}
              placeholder="Select paid months"
            />
          </div>

          <div className="flex items-start gap-3 mt-2">
            <input
              type="checkbox"
              id="confirm-payment"
              checked={isConfirmed}
              onChange={(e) => setIsConfirmed(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="confirm-payment" className="text-sm text-stone-600 cursor-pointer">
              I confirm that I have received this payment offline/cash and want to add it directly as an <strong>approved</strong> transaction.
            </label>
          </div>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {selectedMonths.length > 0 ? (
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50/70 py-2 px-3 rounded-lg border border-emerald-100/80">
                <Sparkles size={14} />
                <span>
                  {selectedMonths.length} Month(s) selected • Total Amount:{" "}
                  <strong>₹{totalAmount.toLocaleString()}</strong>
                </span>
              </div>
            ) : <div />}

            <button
              type="button"
              onClick={handleAdminPayment}
              disabled={selectedMonths.length === 0 || !selectedUserId || !isConfirmed || submitting}
              className="h-11 px-6 rounded-xl font-semibold text-white bg-emerald-500 shadow-lg shadow-emerald-200 hover:brightness-105 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer text-sm"
            >
              <Check size={18} />
              {submitting
                ? "Processing..."
                : `Submit Transaction`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
