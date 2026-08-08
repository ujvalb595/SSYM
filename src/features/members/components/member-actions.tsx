"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { DeleteMemberDialog } from "./delete-member-dialog";

export interface MemberActionItem {
  id: string;
  name: string;
}

export function MemberActions({ member }: { member: MemberActionItem }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        href={`/members/${member.id}`}
        aria-label={`Edit ${member.name}`}
        title="Edit user profile"
        className="rounded-lg p-2 text-violet-600 transition hover:bg-violet-100 focus:outline-none focus:ring-2 focus:ring-violet-300"
      >
        <Pencil size={17} />
      </Link>
      <DeleteMemberDialog memberId={member.id} memberName={member.name} />
    </div>
  );
}
