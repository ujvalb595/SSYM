import { NextResponse } from "next/server";

export async function GET() {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const instagramUserId = process.env.INSTAGRAM_USER_ID || "me";

  if (!accessToken) {
    return NextResponse.json(
      { error: "Instagram API access token is not configured." },
      { status: 500 }
    );
  }

  const isFacebookToken = accessToken.startsWith("EAA");
  const baseUrl = isFacebookToken
    ? "https://graph.facebook.com/v18.0"
    : "https://graph.instagram.com";

  try {
    const fields = [
      "id",
      "caption",
      "media_type",
      "media_product_type",
      "media_url",
      "thumbnail_url",
      "permalink",
      "timestamp",
      "like_count",
      "comments_count",
      "children{id,media_type,media_url,thumbnail_url}",
    ].join(",");

    const url = new URL(`${baseUrl}/${instagramUserId}/media`);
    url.searchParams.set("fields", fields);
    url.searchParams.set("limit", "100");
    url.searchParams.set("access_token", accessToken);

    const response = await fetch(url.toString(), {
      next: {
        revalidate: 300,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Instagram API Error:", data);

      return NextResponse.json(
        {
          error: "Unable to fetch dynamic Instagram posts.",
          details: data?.error?.message,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      data: data.data ?? [],
    });
  } catch (error) {
    console.error("Instagram fetch error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch dynamic Instagram posts.",
      },
      { status: 500 }
    );
  }
}