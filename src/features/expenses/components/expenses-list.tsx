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

interface ExpensesListProps {
  expenses: ExpenseItemData[];
  currentUserId: string;
  currentUserRole: Role;
  canManageExpenses: boolean;
}

export function ExpensesList({
  expenses,
  currentUserRole,
  canManageExpenses
}: ExpensesListProps) {
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

  const canEdit = canManageExpenses || currentUserRole === Role.ADMIN || currentUserRole === Role.SUPER_ADMIN;

  return (
    <section className="space-y-6">
      {/* Metric Cards Bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="card-base flex items-center gap-4 p-5">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-[#7257f4] text-white shadow-md shadow-violet-200">
            <IndianRupee size={24} />
          </span>
          <div>
            <p className="text-caption text-violet-700/80">
              Total Amount Spent
            </p>
            <h4 className="text-2xl font-extrabold text-[#24203a]">
              ₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </h4>
          </div>
        </div>

        <div className="card-base flex items-center gap-4 p-5">
          <span className="btn-icon size-12 rounded-2xl">
            <ChartNoAxesCombined size={24} />
          </span>
          <div>
            <p className="text-caption">
              Total Expenses Logged
            </p>
            <h4 className="text-2xl font-extrabold text-[#24203a]">{expenses.length} Records</h4>
          </div>
        </div>        
      </div>

      {/* Main Expenses Table Card */}
      <div className="card-base overflow-hidden">
        {/* Table Top Toolbar */}
        <div className="flex flex-col gap-4 border-b border-stone-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="btn-icon size-10">
              <ChartNoAxesCombined size={20} />
            </span>
            <div>
              <h3 className="heading-md">All Mandal Expenses</h3>
              <p className="text-subtitle">
                Showing {filteredExpenses.length} of {expenses.length} expense entries
              </p>
            </div>
          </div>

          <label className="relative block">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
              size={16}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-base pl-9 text-xs sm:w-72"
              placeholder="Search by expense name or note..."
            />
          </label>
        </div>

        {/* Expenses Table */}
        <div className="overflow-x-auto">
          {filteredExpenses.length === 0 ? (
            <div className="p-12 text-center">
              <p className="heading-md">No Expense Records Found</p>
              <p className="text-subtitle mt-1">
                {search ? `No expenses matching "${search}".` : "Click Add Expense above to log your first expense."}
              </p>
            </div>
          ) : (
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-[#faf9ff] text-caption border-b border-stone-100">
                <tr>
                  <th className="px-6 py-4 font-bold">Expense Title</th>
                  <th className="px-6 py-4 font-bold">Detail / Purpose</th>
                  <th className="px-6 py-4 font-bold">Expense Date</th>
                  <th className="px-6 py-4 font-bold">Logged By</th>
                  <th className="px-6 py-4 text-right font-bold">Amount</th>
                  {canEdit && <th className="px-6 py-4 text-right font-bold">Action</th>}
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-stone-100 transition hover:bg-violet-50/40"
                  >
                    <td className="px-6 py-4 font-bold text-[#24203a]">
                      {item.title}
                    </td>

                    <td className="px-6 py-4 text-stone-600 max-w-xs truncate">
                      {item.description || "—"}
                    </td>

                    <td className="px-6 py-4 text-stone-600 font-medium">{item.date}</td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="flex size-7 items-center justify-center rounded-lg bg-violet-100 text-xs font-bold text-brand">
                          <User size={13} />
                        </span>
                        <span className="text-xs font-medium text-stone-700">
                          {item.createdByName}
                        </span>
                      </div>
                    </td>

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
