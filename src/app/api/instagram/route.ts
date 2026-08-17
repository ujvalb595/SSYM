import { NextResponse } from "next/server";

const INSTAGRAM_API_URL = "https://graph.instagram.com/shivsaiyuvakmandal_official/media";

export async function GET() {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const instagramUserId = process.env.INSTAGRAM_USER_ID;

  if (!accessToken || !instagramUserId) {
    return NextResponse.json(
      {
        error: "Instagram API credentials are not configured.",
      },
      { status: 500 }
    );
  }

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
    ].join(",");

    const url = new URL(
      `${INSTAGRAM_API_URL}/${instagramUserId}/media`
    );

    url.searchParams.set("fields", fields);
    url.searchParams.set("limit", "8");
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
          error: "Unable to fetch Instagram posts.",
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
        error: "Failed to fetch Instagram posts.",
      },
      { status: 500 }
    );
  }
}