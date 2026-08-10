"use client";

import { useState } from "react";
import { Role } from "@prisma/client";
import { ChartNoAxesCombined, IndianRupee, Search, User } from "lucide-react";
import { EditExpenseDialog } from "./edit-expense-dialog";

export interface ExpenseItemData {
  id: string;
  title: string;
  description?: string | null;
  amount: number;
  date: string;
  createdById: string;
  createdByName: string;
  createdByRole: Role;
}

export function ExpensesList({
  expenses,
  currentUserRole,
}: {
  expenses: ExpenseItemData[];
  currentUserId: string;
  currentUserRole: Role;
}) {
  const [search, setSearch] = useState("");

  const filteredExpenses = expenses.filter(
    (e) =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      (e.description && e.description.toLowerCase().includes(search.toLowerCase())) ||
      e.createdByName.toLowerCase().includes(search.toLowerCase()) ||
      e.amount.toString().includes(search) ||
      e.date.toLowerCase().includes(search.toLowerCase())
  );

  const totalAmount = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);

  const canEdit = currentUserRole === Role.ADMIN || currentUserRole === Role.SUPER_ADMIN;

  return (
    <section className="space-y-6">
      {/* Metric Cards Bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <span className="flex size-12 items-center justify-center rounded-xl bg-violet-100 text-[#7257f4]">
            <ChartNoAxesCombined size={24} />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Total Expenses Logged
            </p>
            <h4 className="text-2xl font-extrabold text-[#24203a]">{expenses.length} Records</h4>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50/80 to-purple-50/50 p-5 shadow-sm">
          <span className="flex size-12 items-center justify-center rounded-xl bg-[#7257f4] text-white shadow-md shadow-violet-200">
            <IndianRupee size={24} />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-700/80">
              Total Amount Spent
            </p>
            <h4 className="text-2xl font-extrabold text-[#24203a]">
              ₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </h4>
          </div>
        </div>
      </div>

      {/* Main Expenses Table Card */}
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        {/* Table Top Toolbar */}
        <div className="flex flex-col gap-4 border-b border-stone-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-violet-100 p-2.5 text-[#7257f4]">
              <ChartNoAxesCombined size={20} />
            </span>
            <div>
              <h3 className="font-bold text-[#24203a]">All Mandal Expenses</h3>
              <p className="text-xs text-stone-500">
                Showing {filteredExpenses.length} of {expenses.length} expense entries
              </p>
            </div>
          </div>

          <label className="relative block">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
              size={17}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[#e8e3f2] py-2 pl-10 pr-4 text-sm outline-none placeholder:text-stone-400 focus:border-[#8660ee] focus:ring-4 focus:ring-violet-100 sm:w-72"
              placeholder="Search by expense, detail, or user..."
            />
          </label>
        </div>

        {/* Expenses Table */}
        <div className="overflow-x-auto">
          {filteredExpenses.length === 0 ? (
            <div className="p-12 text-center">
              <p className="font-bold text-base text-[#24203a]">No Expense Records Found</p>
              <p className="mt-1 text-xs text-stone-500">
                {search ? `No expenses matching "${search}".` : "Click Add Expense above to log your first expense."}
              </p>
            </div>
          ) : (
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-[#faf9ff] text-xs uppercase tracking-wide text-stone-400">
                <tr>
                  <th className="px-6 py-4 font-semibold">Expense Added By</th>
                  <th className="px-6 py-4 font-semibold">Expense</th>
                  <th className="px-6 py-4 font-semibold">Expense Detail</th>
                  <th className="px-6 py-4 font-semibold">Expense Date</th>
                  <th className="px-6 py-4 text-right font-semibold">Amount</th>
                  {canEdit && <th className="px-6 py-4 text-right font-semibold">Action</th>}
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-stone-100 transition hover:bg-violet-50/40"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-8 items-center justify-center rounded-lg bg-violet-100 text-xs font-bold text-[#7257f4]">
                          <User size={14} />
                        </span>
                        <div>
                          <span className="font-semibold text-[#302a49] flex items-center gap-1.5">
                            {item.createdByName}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-semibold text-[#24203a]">{item.title}</td>

                    <td className="px-6 py-4 text-stone-600 max-w-xs truncate">
                      {item.description || "—"}
                    </td>

                    <td className="px-6 py-4 text-stone-600 font-medium">{item.date}</td>

                    <td className="px-6 py-4 text-right font-bold text-[#24203a]">
                      ₹{item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>

                    {canEdit && (
                      <td className="px-6 py-4 text-right">
                        <EditExpenseDialog expense={item} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
}
