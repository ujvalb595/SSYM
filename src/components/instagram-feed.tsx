"use client";
import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
interface InstagramPost {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_product_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
}
/** * Instagram logo * Using a local SVG so there is no dependency * on the installed lucide-react version. */ function InstagramIcon({
  size = 20,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {" "}
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        stroke="currentColor"
        strokeWidth="2"
      />{" "}
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />{" "}
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />{" "}
    </svg>
  );
}
export function InstagramFeed() {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    async function loadInstagramPosts() {
      try {
        setLoading(true);
        setError(false);
        const response = await fetch("/api/instagram");
        if (!response.ok) {
          throw new Error("Failed to load Instagram posts");
        }
        const result = await response.json();
        setPosts(result.data ?? []);
      } catch (error) {
        console.error("Instagram feed error:", error);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    loadInstagramPosts();
  }, []);
  return (
    <section className="">
      {" "}
      {/* Header */}{" "}
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {" "}
        <div>
          {" "}
          <div className="flex items-center gap-2">
            {" "}
            <InstagramIcon size={22} className="text-[#E1306C]" />{" "}
            <h2 className="text-xl font-bold text-[#24203a]">
              {" "}
              Follow Us on Instagram{" "}
            </h2>{" "}
          </div>{" "}
          <p className="mt-1 text-sm text-stone-500">
            {" "}
            Latest updates from Shiv Sai Yuvak Mandal{" "}
          </p>{" "}
        </div>{" "}
        <a
          href="https://www.instagram.com/shivsaiyuvakmandal_official"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-fit items-center gap-2 rounded-xl bg-gradient-to-r from-[#7257f4] to-[#bc59ec] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:scale-[1.02]"
        >
          {" "}
          <InstagramIcon size={17} /> Follow on Instagram{" "}
          <ExternalLink size={14} />{" "}
        </a>{" "}
      </div>{" "}
      {/* Loading */}{" "}
      {loading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {" "}
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="aspect-square animate-pulse rounded-2xl bg-stone-100"
            />
          ))}{" "}
        </div>
      )}{" "}
      {/* Error */}{" "}
      {!loading && error && (
        <div className="rounded-2xl border border-[#ebe7f6] bg-white p-8 text-center">
          {" "}
          <InstagramIcon
            size={36}
            className="mx-auto mb-3 text-stone-300"
          />{" "}
          <p className="font-semibold text-[#24203a]">
            {" "}
            Instagram posts are currently unavailable.{" "}
          </p>{" "}
          <p className="mt-1 text-sm text-stone-500">
            {" "}
            Please visit our Instagram page for the latest updates.{" "}
          </p>{" "}
          <a
            href="https://www.instagram.com/shivsaiyuvakmandal_official"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-violet-50 px-4 py-2 text-sm font-semibold text-[#7257f4] transition hover:bg-violet-100"
          >
            {" "}
            Visit Instagram <ExternalLink size={14} />{" "}
          </a>{" "}
        </div>
      )}{" "}
      {/* Empty */}{" "}
      {!loading && !error && posts.length === 0 && (
        <div className="rounded-2xl border border-[#ebe7f6] bg-white p-8 text-center">
          {" "}
          <InstagramIcon
            size={36}
            className="mx-auto mb-3 text-stone-300"
          />{" "}
          <p className="font-semibold text-[#24203a]">
            {" "}
            No Instagram posts available.{" "}
          </p>{" "}
        </div>
      )}{" "}
      {/* Instagram Posts */}{" "}
      {!loading && !error && posts.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {" "}
          {posts.map((post) => {
            const imageUrl =
              post.media_type === "VIDEO" ? post.thumbnail_url : post.media_url;
            return (
              <a
                key={post.id}
                href={post.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-square overflow-hidden rounded-2xl bg-stone-100 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                {" "}
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={
                      post.caption
                        ? post.caption.slice(0, 120)
                        : "Shiv Sai Yuvak Mandal Instagram post"
                    }
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    {" "}
                    <InstagramIcon size={40} className="text-stone-300" />{" "}
                  </div>
                )}{" "}
                {/* Hover overlay */}{" "}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />{" "}
                {/* Instagram icon */}{" "}
                <div className="absolute right-3 top-3 rounded-full bg-white/90 p-2 opacity-0 shadow-lg transition group-hover:opacity-100">
                  {" "}
                  <InstagramIcon size={16} className="text-[#E1306C]" />{" "}
                </div>{" "}
                {/* Caption */}{" "}
                {post.caption && (
                  <div className="absolute bottom-0 left-0 right-0 translate-y-full p-3 text-white transition-transform duration-300 group-hover:translate-y-0">
                    {" "}
                    <p className="line-clamp-2 text-xs font-medium">
                      {" "}
                      {post.caption}{" "}
                    </p>{" "}
                  </div>
                )}{" "}
                {/* Video indicator */}{" "}
                {post.media_type === "VIDEO" && (
                  <div className="absolute left-3 top-3 rounded-full bg-black/60 px-2 py-1 text-[10px] font-semibold text-white">
                    {" "}
                    VIDEO{" "}
                  </div>
                )}{" "}
              </a>
            );
          })}{" "}
        </div>
      )}{" "}
    </section>
  );
}
