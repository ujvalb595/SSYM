import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { postId } = await req.json();
    if (!postId) {
      return NextResponse.json({ error: "postId is required" }, { status: 400 });
    }

    // Record view in database (upsert to prevent duplicate errors for same user)
    await prisma.postView.upsert({
      where: {
        postId_userId: {
          postId,
          userId: session.user.id,
        },
      },
      create: {
        postId,
        userId: session.user.id,
      },
      update: {},
    });

    const viewCount = await prisma.postView.count({
      where: { postId },
    });

    return NextResponse.json({ success: true, postId, viewCount });
  } catch (error) {
    console.error("Error recording post view:", error);
    return NextResponse.json({ error: "Failed to record post view" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("postId");

  // Detailed viewer list mode for Admins
  if (postId) {
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    try {
      const views = await prisma.postView.findMany({
        where: { postId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
              mobileNumber: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const viewers = views.map((v: { user: { id: string; name: string | null; role: string; mobileNumber: string | null }; createdAt: Date }) => ({
        id: v.user.id,
        name: v.user.name || "Anonymous Member",
        role: v.user.role,
        mobileNumber: v.user.mobileNumber,
        viewedAt: v.createdAt.toISOString(),
      }));

      return NextResponse.json({
        postId,
        viewCount: viewers.length,
        viewers,
      });
    } catch (error) {
      console.error("Error fetching viewers list:", error);
      return NextResponse.json({ error: "Failed to fetch viewers list" }, { status: 500 });
    }
  }

  // Summary counts mode for all posts
  try {
    const countsGrouped = await prisma.postView.groupBy({
      by: ["postId"],
      _count: {
        id: true,
      },
    });

    const viewCounts: Record<string, number> = {};
    countsGrouped.forEach((group: { postId: string; _count: { id: number } }) => {
      viewCounts[group.postId] = group._count.id;
    });

    return NextResponse.json({ viewCounts });
  } catch (error) {
    console.error("Error fetching post view counts:", error);
    return NextResponse.json({ error: "Failed to fetch post view counts" }, { status: 500 });
  }
}
