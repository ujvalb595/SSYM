import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { AddExpensesDialog } from "@/features/expenses/components/add-expenses-dialog";
import {
  ExpensesList,
  ExpenseItemData,
} from "@/features/expenses/components/expenses-list";

export default async function ExpensesPage() {
  const session = await auth();

  if (!session?.user || session.user.isActive === false) {
    redirect("/login");
  }

  let expenseItems: ExpenseItemData[] = [];

  try {
    const dbExpenses = await prisma.expense.findMany({
      include: {
        createdBy: {
          select: {
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    expenseItems = dbExpenses.map((e) => {
      const formattedDate = e.date
        ? new Date(e.date).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "N/A";

      return {
        id: e.id,
        title: e.title,
        description: e.description,
        amount: Number(e.amount),
        date: formattedDate,
        createdById: e.createdById,
        createdByName: e.createdBy?.name || "Unknown User",
        createdByRole: e.createdBy?.role || Role.USER,
      };
    });
  } catch (error) {
    console.error("Error fetching expenses from database:", error);
    expenseItems = [];
  }

  // Only ADMIN and SUPER_ADMIN can manage expenses
  const canManageExpenses =
    session.user.role === Role.ADMIN ||
    session.user.role === Role.SUPER_ADMIN;

  return (
    <DashboardShell section="Management" title="Expenses">
      <main className="mx-auto max-w-7xl space-y-7 p-5 md:p-9">
        {/* Top Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#24203a]">
              Expenses
            </h2>

            <p className="mt-1 text-sm text-stone-500">
              View and manage mandal expenses and expenditure records.
            </p>
          </div>

          {/* Only ADMIN and SUPER_ADMIN */}
          {canManageExpenses && <AddExpensesDialog />}
        </div>

        {/* Expenses Table */}
        <ExpensesList
          expenses={expenseItems}
          currentUserId={session.user.id}
          currentUserRole={session.user.role}
          canManageExpenses={canManageExpenses}
        />
      </main>
    </DashboardShell>
  );
}