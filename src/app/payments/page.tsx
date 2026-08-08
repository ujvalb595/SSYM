import { redirect } from "next/navigation";
import { History, UsersRound, Wallet } from "lucide-react";
import { auth } from "@/auth";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { MakePaymentCard } from "@/features/payments/components/make-payment-card";
import { PaymentsRequestsTable } from "@/features/payments/components/payments-requests-table";
import { PaymentHistoryTable } from "@/features/payments/components/payment-history-table";
import { getPaymentsData } from "@/features/payments/actions/payment-actions";

export default async function PaymentsPage() {
  const session = await auth();
  if (!session?.user?.isActive) redirect("/login");

  const { userPayments, allPayments, isAdmin } = await getPaymentsData();

  const pendingCount = isAdmin
    ? allPayments.filter((p) => p.status === "PENDING").length
    : userPayments.filter((p) => p.status === "PENDING").length;

  // Filter only completed (approved) payments across all members
  const approvedPayments = allPayments.filter((p) => p.status === "APPROVED");

  return (
    <DashboardShell section="Management" title="Payments">
      <main className="mx-auto max-w-7xl p-5 md:p-9">
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Payments</h2>
            <p className="mt-1 text-sm text-stone-500">
              View and manage your mandal payment requests.
            </p>
          </div>
        </div>

        {/* Make Payment Section */}
        <MakePaymentCard userPayments={userPayments} />

        {/* All Payment Requests Section */}
        <section className="mb-8 overflow-hidden rounded-2xl border border-white bg-white shadow-[0_12px_30px_rgb(77_55_135_/_0.07)]">
          <div className="flex flex-col gap-4 border-b border-stone-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-violet-100 p-2.5 text-[#7257f4]">
                <UsersRound size={20} />
              </span>
              <div>
                <h3 className="font-bold text-[#24203a]">All Payment Requests</h3>
                <p className="text-sm text-stone-500">
                  {pendingCount} Payment Request(s) Pending Approval
                </p>
              </div>
            </div>
          </div>
          <PaymentsRequestsTable initialRequests={allPayments} isAdmin={isAdmin} />
        </section>

        {/* User's Own Payment Requests Section */}
        <section className="mb-8 overflow-hidden rounded-2xl border border-white bg-white shadow-[0_12px_30px_rgb(77_55_135_/_0.07)]">
          <div className="flex flex-col gap-4 border-b border-stone-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-violet-100 p-2.5 text-[#7257f4]">
                <Wallet size={20} />
              </span>
              <div>
                <h3 className="font-bold text-[#24203a]">My Payment Requests</h3>
                <p className="text-sm text-stone-500">
                  Track the status of your submitted mandal payments (Done / Pending / Reject)
                </p>
              </div>
            </div>
          </div>
          <PaymentsRequestsTable initialRequests={userPayments} isAdmin={false} />
        </section>

        {/* All Payments History Section (Completed / Done Payments Across Mandal) */}
        <section className="overflow-hidden rounded-2xl border border-white bg-white shadow-[0_12px_30px_rgb(77_55_135_/_0.07)]">
          <div className="flex flex-col gap-4 border-b border-stone-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-emerald-100 p-2.5 text-emerald-600">
                <History size={20} />
              </span>
              <div>
                <h3 className="font-bold text-[#24203a]">All Payments History</h3>
                <p className="text-sm text-stone-500">
                  View completed and approved member payments ({approvedPayments.length} Completed)
                </p>
              </div>
            </div>
          </div>
          <PaymentHistoryTable items={approvedPayments} />
        </section>
      </main>
    </DashboardShell>
  );
}
