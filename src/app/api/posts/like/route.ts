import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("postId");

  // If postId is passed, fetch list of users who liked this specific post (Admins & Super Admins only)
  if (postId) {
    if (!session?.user || session.user.isActive === false) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = [Role.SUPER_ADMIN, Role.ADMIN].includes(session.user.role);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Permission denied. Only Admins can view users who liked posts." },
        { status: 403 }
      );
    }

    try {
      const likes = await prisma.postLike.findMany({
        where: { postId },
        orderBy: {
          createdAt: "desc",
        },
      });

      const userIds = likes.map((l) => l.userId);
      const users = await prisma.user.findMany({
        where: {
          id: { in: userIds },
        },
        select: {
          id: true,
          name: true,
          mobileNumber: true,
          role: true,
        },
      });

      const userMap = new Map(users.map((u) => [u.id, u]));
      const likers = userIds
        .map((uid) => userMap.get(uid))
        .filter(Boolean);

      return NextResponse.json({ likers });
    } catch (error) {
      console.error("Failed to fetch post likers:", error);
      return NextResponse.json(
        { error: "Failed to fetch liker user names." },
        { status: 500 }
      );
    }
  }

  // Aggregate likes list for all posts
  try {
    const allLikes = await prisma.postLike.findMany({
      select: {
        postId: true,
        userId: true,
      },
    });

    const likeCounts: Record<string, number> = {};
    const userLikedPosts: Record<string, boolean> = {};

    for (const like of allLikes) {
      likeCounts[like.postId] = (likeCounts[like.postId] || 0) + 1;
      if (userId && like.userId === userId) {
        userLikedPosts[like.postId] = true;
      }
    }

    return NextResponse.json({ likeCounts, userLikedPosts });
  } catch (error) {
    console.error("Failed to fetch likes:", error);
    return NextResponse.json(
      { error: "Failed to fetch like details from database." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.isActive === false) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { postId } = body;

    if (!postId || typeof postId !== "string") {
      return NextResponse.json({ error: "Post ID is required." }, { status: 400 });
    }

    const userId = session.user.id;

    // Check if like exists
    const existingLike = await prisma.postLike.findFirst({
      where: {
        postId,
        userId,
      },
    });

    let isLiked = false;

    if (existingLike) {
      // Remove like
      await prisma.postLike.delete({
        where: {
          id: existingLike.id,
        },
      });
      isLiked = false;
    } else {
      // Add like
      await prisma.postLike.create({
        data: {
          postId,
          userId,
        },
      });
      isLiked = true;
    }

    // Get updated total count for this postId
    const likeCount = await prisma.postLike.count({
      where: {
        postId,
      },
    });

    return NextResponse.json({
      postId,
      isLiked,
      likeCount,
    });
  } catch (error) {
    console.error("Failed to toggle like in database:", error);
    return NextResponse.json(
      { error: "Failed to toggle like." },
      { status: 500 }
    );
  }
}
