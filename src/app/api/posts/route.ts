import { NextResponse } from "next/server";
import { PostMediaType, Role } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function getPinnedUntilDate(duration?: "24h" | "7d" | "PERMANENT") {
  const now = Date.now();
  if (duration === "24h") {
    return new Date(now + 24 * 60 * 60 * 1000);
  }
  if (duration === "7d") {
    return new Date(now + 7 * 24 * 60 * 60 * 1000);
  }
  return null; // PERMANENT or until unpinned
}

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";

  try {
    const now = new Date();

    // Regular users can ONLY see published posts (scheduledAt is null or scheduledAt <= now)
    const whereCondition = isAdmin
      ? {}
      : {
          OR: [
            { scheduledAt: null },
            { scheduledAt: { lte: now } },
          ],
        };

    const posts = await prisma.post.findMany({
      where: whereCondition,
      orderBy: [
        { isPinned: "desc" },
        { createdAt: "desc" },
      ],
    });

    const allLikes = await prisma.postLike.findMany({
      select: { postId: true, userId: true },
    });

    const likeCounts: Record<string, number> = {};
    const userLikedSet = new Set<string>();

    for (const like of allLikes) {
      likeCounts[like.postId] = (likeCounts[like.postId] || 0) + 1;
      if (userId && like.userId === userId) {
        userLikedSet.add(like.postId);
      }
    }

    const formattedPosts = posts.map((post) => {
      const isExpired = post.pinnedUntil ? new Date(post.pinnedUntil) < now : false;
      const activePinned = post.isPinned && !isExpired;
      const isScheduledFuture = post.scheduledAt ? new Date(post.scheduledAt) > now : false;

      return {
        id: post.id,
        caption: post.caption || "",
        media_type: post.mediaType,
        media_url: post.mediaUrl || undefined,
        permalink: "#",
        timestamp: post.createdAt.toISOString(),
        isLocal: true,
        like_count: likeCounts[post.id] || 0,
        isLiked: userLikedSet.has(post.id),
        isPinned: activePinned,
        pinnedUntil: activePinned ? post.pinnedUntil?.toISOString() || null : null,
        scheduledAt: post.scheduledAt?.toISOString() || null,
        isScheduled: isScheduledFuture,
      };
    });

    return NextResponse.json({ data: formattedPosts });
  } catch (error) {
    console.error("Failed to fetch database posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch custom database posts." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.isActive === false) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = [Role.SUPER_ADMIN, Role.ADMIN].includes(session.user.role);
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Permission denied. Only Admins can create posts." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { caption, mediaType, mediaUrl, isPinned, pinDuration, scheduledAt } = body;

    if (!caption?.trim() && !mediaUrl?.trim()) {
      return NextResponse.json(
        { error: "Post must contain either text or media." },
        { status: 400 }
      );
    }

    let validMediaType: PostMediaType = PostMediaType.TEXT;
    if (mediaType === "IMAGE") validMediaType = PostMediaType.IMAGE;
    if (mediaType === "VIDEO") validMediaType = PostMediaType.VIDEO;

    let pinnedUntil: Date | null = null;
    if (isPinned) {
      pinnedUntil = getPinnedUntilDate(pinDuration);
    }

    let parsedScheduledAt: Date | null = null;
    if (scheduledAt) {
      const date = new Date(scheduledAt);
      if (!isNaN(date.getTime())) {
        parsedScheduledAt = date;
      }
    }

    const newPost = await prisma.post.create({
      data: {
        caption: caption?.trim() || null,
        mediaType: validMediaType,
        mediaUrl: mediaUrl?.trim() || null,
        createdBy: session?.user?.id ? { connect: { id: session.user.id } } : undefined,
        isPinned: !!isPinned,
        pinnedUntil: pinnedUntil,
        scheduledAt: parsedScheduledAt,
      },
    });

    const formatted = {
      id: newPost.id,
      caption: newPost.caption || "",
      media_type: newPost.mediaType,
      media_url: newPost.mediaUrl || undefined,
      permalink: "#",
      timestamp: newPost.createdAt.toISOString(),
      isLocal: true,
      like_count: 0,
      isLiked: false,
      isPinned: newPost.isPinned,
      pinnedUntil: newPost.pinnedUntil?.toISOString() || null,
      scheduledAt: newPost.scheduledAt?.toISOString() || null,
      isScheduled: newPost.scheduledAt ? new Date(newPost.scheduledAt) > new Date() : false,
    };

    return NextResponse.json({ data: formatted }, { status: 201 });
  } catch (error) {
    console.error("Failed to create database post:", error);
    return NextResponse.json(
      { error: "Failed to save post to database." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.isActive === false) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = [Role.SUPER_ADMIN, Role.ADMIN].includes(session.user.role);
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Permission denied. Only Admins can edit posts." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { id, caption, mediaType, mediaUrl, isPinned, pinDuration } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Post ID is required." }, { status: 400 });
    }

    const existingPost = await prisma.post.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    // Check 15-minute edit time window
    const now = Date.now();
    const createdAtTime = new Date(existingPost.createdAt).getTime();
    const diffMinutes = (now - createdAtTime) / (1000 * 60);

    if (diffMinutes > 15) {
      return NextResponse.json(
        { error: "Edit time limit expired. Posts can only be edited within 15 minutes of creation." },
        { status: 403 }
      );
    }

    let validMediaType: PostMediaType = existingPost.mediaType;
    if (mediaType === "IMAGE") validMediaType = PostMediaType.IMAGE;
    if (mediaType === "VIDEO") validMediaType = PostMediaType.VIDEO;
    if (mediaType === "TEXT") validMediaType = PostMediaType.TEXT;

    let pinnedUntil = existingPost.pinnedUntil;
    let newIsPinned = existingPost.isPinned;
    if (isPinned !== undefined) {
      newIsPinned = !!isPinned;
      pinnedUntil = isPinned ? getPinnedUntilDate(pinDuration) : null;
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        caption: caption !== undefined ? caption?.trim() || null : existingPost.caption,
        mediaType: validMediaType,
        mediaUrl: mediaUrl !== undefined ? mediaUrl?.trim() || null : existingPost.mediaUrl,
        isPinned: newIsPinned,
        pinnedUntil: pinnedUntil,
      },
    });

    return NextResponse.json({
      data: {
        id: updatedPost.id,
        caption: updatedPost.caption || "",
        media_type: updatedPost.mediaType,
        media_url: updatedPost.mediaUrl || undefined,
        permalink: "#",
        timestamp: updatedPost.createdAt.toISOString(),
        isLocal: true,
        isPinned: updatedPost.isPinned,
        pinnedUntil: updatedPost.pinnedUntil?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error("Failed to update database post:", error);
    return NextResponse.json(
      { error: "Failed to update post." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.isActive === false) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = [Role.SUPER_ADMIN, Role.ADMIN].includes(session.user.role);
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Permission denied. Only Admins can pin posts." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { id, isPinned, pinDuration } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Post ID is required." }, { status: 400 });
    }

    let pinnedUntil: Date | null = null;
    if (isPinned) {
      pinnedUntil = getPinnedUntilDate(pinDuration);
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        isPinned: !!isPinned,
        pinnedUntil: pinnedUntil,
      },
    });

    return NextResponse.json({
      data: {
        id: updatedPost.id,
        isPinned: updatedPost.isPinned,
        pinnedUntil: updatedPost.pinnedUntil?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error("Failed to pin/unpin database post:", error);
    return NextResponse.json(
      { error: "Failed to update pin status." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.isActive === false) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = [Role.SUPER_ADMIN, Role.ADMIN].includes(session.user.role);
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Permission denied. Only Admins can delete posts." },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    let postId = searchParams.get("id");

    if (!postId) {
      const body = await request.json().catch(() => ({}));
      postId = body.id;
    }

    if (!postId || typeof postId !== "string") {
      return NextResponse.json({ error: "Post ID is required." }, { status: 400 });
    }

    // Delete associated likes first
    await prisma.postLike.deleteMany({
      where: { postId },
    });

    // Delete post
    await prisma.post.delete({
      where: { id: postId },
    });

    return NextResponse.json({ success: true, id: postId });
  } catch (error) {
    console.error("Failed to delete database post:", error);
    return NextResponse.json(
      { error: "Failed to delete post." },
      { status: 500 }
    );
  }
}
