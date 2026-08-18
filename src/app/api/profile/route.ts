import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      mobileNumber: true,
      image: true,
      role: true,
      isActive: true,
    },
  });

  if (!user) {
    return Response.json({ message: "User not found" }, { status: 404 });
  }

  return Response.json({ user });
}
