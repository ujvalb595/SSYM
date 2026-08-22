"use client";

import { useEffect, useState, useRef, useCallback, ChangeEvent } from "react";
import { createPortal } from "react-dom";
import {
  Heart,
  Grid,
  SquareStack,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Search,
  PlusCircle,
  X,
  Upload,
  MessageSquareText,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Clock,
  Pin,
  MoreVertical,
  Eye,
  Calendar,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface InstagramMediaChild {
  id: string;
  media_type: "IMAGE" | "VIDEO";
  media_url: string;
  thumbnail_url?: string;
}

interface InstagramPost {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | "TEXT";
  media_product_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
  isLocal?: boolean;
  isPinned?: boolean;
  scheduledAt?: string | null;
  isScheduled?: boolean;
  children?: {
    data: InstagramMediaChild[];
  };
}

interface PostViewer {
  id: string;
  name: string;
  role: string;
  mobileNumber: string;
  viewedAt: string;
}

interface LikerUser {
  id: string;
  name: string;
  role: string;
  mobileNumber?: string;
}

// In-memory feed cache for instant 0ms tab switching
interface FeedCacheData {
  posts: InstagramPost[];
  likeCounts: Record<string, number>;
  likedPosts: Record<string, boolean>;
  viewCounts: Record<string, number>;
  timestamp: number;
}

let globalFeedCache: FeedCacheData | null = null;
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

const INITIAL_FEED_BATCH = 3;
const INITIAL_GRID_BATCH = 8;
const BATCH_INCREMENT = 3;

function InstagramPostSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-[#ebe7f6] bg-white shadow-xs animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between p-3.5 pb-2.5 border-b border-[#f7f6fc]">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-full bg-violet-100/80" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-32 rounded-lg bg-stone-200/80" />
            <div className="h-2.5 w-16 rounded-md bg-stone-100" />
          </div>
        </div>
        <div className="size-6 rounded-full bg-stone-100" />
      </div>

      {/* Media Placeholder */}
      <div className="aspect-[4/3] sm:aspect-square w-full bg-gradient-to-tr from-stone-100 via-violet-50/30 to-stone-100 relative overflow-hidden flex items-center justify-center">
        <div className="size-12 rounded-2xl bg-white/60 backdrop-blur-xs flex items-center justify-center shadow-xs">
          <div className="size-6 rounded-lg bg-violet-200/50" />
        </div>
      </div>

      {/* Post Actions & Caption */}
      <div className="p-4 pt-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-6 rounded-full bg-rose-100/70" />
            <div className="h-3 w-16 rounded-md bg-stone-200/70" />
          </div>
          <div className="h-2.5 w-14 rounded-md bg-stone-100" />
        </div>
        <div className="space-y-1.5 pt-1">
          <div className="h-3 w-4/5 rounded-md bg-stone-200/70" />
          <div className="h-3 w-3/5 rounded-md bg-stone-100" />
        </div>
      </div>
    </div>
  );
}

function InstagramGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="aspect-square rounded-2xl bg-gradient-to-br from-stone-100 via-violet-50/20 to-stone-100 border border-[#ebe7f6] relative overflow-hidden flex items-center justify-center"
        >
          <div className="size-7 rounded-xl bg-violet-100/50" />
        </div>
      ))}
    </div>
  );
}

function InstagramIcon({ size = 20, className = "" }: { size?: number; className?: string }) {
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
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  );
}

function FacebookIcon({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

// Relative time formatting
function formatTimeAgo(timestampString: string): string {
  try {
    const postDate = new Date(timestampString);
    const now = new Date();
    const diffMs = now.getTime() - postDate.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return "JUST NOW";
    if (diffMin < 60) return `${diffMin}M AGO`;
    if (diffHour < 24) return `${diffHour}H AGO`;
    if (diffDay < 7) return `${diffDay}D AGO`;
    if (diffDay < 30) return `${Math.floor(diffDay / 7)}W AGO`;

    return postDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase();
  } catch {
    return "RECENTLY";
  }
}

// Highlight hashtags in text/caption
function FormattedCaption({ caption }: { caption?: string }) {
  if (!caption) return null;

  const parts = caption.split(/(\s+)/);
  return (
    <span className="whitespace-pre-line leading-relaxed">
      {parts.map((part, index) => {
        if (part.startsWith("#")) {
          return (
            <span key={index} className="font-semibold text-[#7257f4] hover:underline cursor-pointer">
              {part}
            </span>
          );
        }
        if (part.startsWith("@")) {
          return (
            <span key={index} className="font-bold text-[#0095F6] hover:underline cursor-pointer">
              {part}
            </span>
          );
        }
        return part;
      })}
    </span>
  );
}

// Expandable Caption Component with "...more" button
function ExpandableCaption({ caption, maxLength = 100 }: { caption?: string; maxLength?: number }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!caption) return null;

  const shouldTruncate = caption.length > maxLength && !isExpanded;

  return (
    <div className="text-xs leading-relaxed text-[#24203a]">
      {shouldTruncate ? (
        <>
          <FormattedCaption caption={caption.slice(0, maxLength).trim()} />
          <span className="text-stone-400">... </span>
          <button
            onClick={() => setIsExpanded(true)}
            className="font-semibold text-stone-500 hover:text-[#7257f4] transition-colors cursor-pointer ml-0.5"
          >
            more
          </button>
        </>
      ) : (
        <>
          <FormattedCaption caption={caption} />
          {isExpanded && caption.length > maxLength && (
            <button
              onClick={() => setIsExpanded(false)}
              className="inline-block ml-1.5 font-semibold text-stone-400 hover:text-stone-600 text-[11px] cursor-pointer"
            >
              show less
            </button>
          )}
        </>
      )}
    </div>
  );
}

// Instagram Reel Video Player with Auto-Play on Viewport & Tap Controls + Lazy Preload
function InstaVideoPlayer({
  src,
  poster,
  permalink,
  onDoubleTap,
}: {
  src: string;
  poster?: string;
  permalink?: string;
  onDoubleTap?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showControlBadge, setShowControlBadge] = useState<"play" | "pause" | null>(null);

  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || hasError || !src) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            if (videoRef.current && !hasError) {
              videoRef.current.muted = isMuted;
              const playPromise = videoRef.current.play();
              if (playPromise !== undefined) {
                playPromise
                  .then(() => setIsPlaying(true))
                  .catch(() => setIsPlaying(false));
              }
            }
          } else {
            if (videoRef.current) {
              videoRef.current.pause();
              setIsPlaying(false);
            }
          }
        });
      },
      { threshold: 0.3, rootMargin: "150px" }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [hasError, src, isMuted]);

  const togglePlayPause = () => {
    if (!videoRef.current || hasError) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      setShowControlBadge("pause");
    } else {
      setInView(true);
      videoRef.current.muted = isMuted;
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setHasError(true));
      setShowControlBadge("play");
    }

    setTimeout(() => {
      setShowControlBadge(null);
    }, 700);
  };

  const handleContainerClick = () => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      onDoubleTap?.();
    } else {
      clickTimeoutRef.current = setTimeout(() => {
        clickTimeoutRef.current = null;
        togglePlayPause();
      }, 250);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      const nextMuted = !isMuted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
    }
  };

  if (hasError || !src) {
    return (
      <div
        className="relative w-full flex items-center justify-center bg-[#09090b] cursor-pointer select-none overflow-hidden min-h-[300px] max-h-[640px]"
        onDoubleClick={onDoubleTap}
      >
        {poster ? (
          <img
            src={poster}
            alt="Video thumbnail"
            loading="lazy"
            className="w-full max-h-[640px] object-contain"
          />
        ) : (
          <div className="flex h-56 w-full flex-col items-center justify-center gap-2 text-stone-400">
            <InstagramIcon size={36} />
            <span className="text-xs font-semibold">Video preview unavailable</span>
          </div>
        )}

        {permalink && (
          <a
            href={permalink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-3 right-3 z-20 flex items-center gap-1 rounded-full bg-black/70 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md transition-transform hover:scale-105 shadow-md"
          >
            <Play size={10} className="fill-white" /> Watch on Instagram
          </a>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      className="relative w-full flex items-center justify-center bg-[#09090b] cursor-pointer select-none overflow-hidden min-h-[300px] max-h-[640px]"
    >
      {poster && (
        <img
          src={poster}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover blur-2xl opacity-40 scale-125 pointer-events-none"
        />
      )}

      {inView ? (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          loop
          playsInline
          muted={isMuted}
          preload="metadata"
          onError={() => setHasError(true)}
          className="relative z-10 w-full max-h-[640px] object-contain"
        />
      ) : (
        <div className="relative z-10 w-full flex items-center justify-center min-h-[300px]">
          {poster ? (
            <img src={poster} alt="" loading="lazy" className="w-full max-h-[640px] object-contain" />
          ) : null}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md shadow-lg">
              <Play size={26} className="fill-white ml-1" />
            </div>
          </div>
        </div>
      )}

      {showControlBadge && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md animate-in zoom-in-50 duration-200">
            {showControlBadge === "play" ? (
              <Play size={30} className="fill-white ml-1" />
            ) : (
              <Pause size={30} className="fill-white" />
            )}
          </div>
        </div>
      )}

      {!isPlaying && !showControlBadge && inView && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md shadow-lg">
            <Play size={26} className="fill-white ml-1" />
          </div>
        </div>
      )}

      <button
        onClick={toggleMute}
        className="absolute bottom-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition-transform hover:scale-110 active:scale-95 shadow-md cursor-pointer"
        title={isMuted ? "Unmute sound" : "Mute sound"}
      >
        {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
      </button>
    </div>
  );
}

// Instagram Carousel component for multi-image / multi-video slide effect
function PostMediaCarousel({
  post,
  onDoubleTap,
}: {
  post: InstagramPost;
  onDoubleTap?: () => void;
  heartAnim?: boolean;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  const items: { id: string; media_type: string; media_url?: string; thumbnail_url?: string }[] = [];

  if (post.children?.data && post.children.data.length > 0) {
    items.push(...post.children.data);
  } else if (post.media_url || post.thumbnail_url) {
    items.push({
      id: post.id,
      media_type: post.media_type,
      media_url: post.media_url,
      thumbnail_url: post.thumbnail_url,
    });
  }

  if (items.length === 0) {
    return (
      <div className="flex h-56 w-full items-center justify-center bg-[#f7f6fb]">
        <InstagramIcon size={36} className="text-stone-300" />
      </div>
    );
  }

  const isMultiple = items.length > 1;

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeIndex < items.length - 1) {
      setActiveIndex((prev) => prev + 1);
    }
  };

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeIndex > 0) {
      setActiveIndex((prev) => prev - 1);
    }
  };

  return (
    <div className="relative w-full select-none overflow-hidden bg-[#f7f6fb] flex items-center justify-center min-h-[250px] max-h-[640px] group">
      <div
        className="flex w-full transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
      >
        {items.map((item, idx) => {
          const isVideo = item.media_type === "VIDEO";
          const imgUrl = isVideo ? item.thumbnail_url || item.media_url : item.media_url;

          return (
            <div
              key={item.id || idx}
              className="w-full shrink-0 flex items-center justify-center min-h-[250px] max-h-[640px] bg-black/5"
            >
              {isVideo ? (
                <InstaVideoPlayer
                  src={item.media_url || item.thumbnail_url || ""}
                  poster={item.thumbnail_url || item.media_url}
                  permalink={post.permalink}
                  onDoubleTap={onDoubleTap}
                />
              ) : imgUrl ? (
                <div
                  className="w-full flex items-center justify-center min-h-[250px] max-h-[640px]"
                  onDoubleClick={onDoubleTap}
                >
                  <img
                    src={imgUrl}
                    alt={post.caption?.slice(0, 80) || "Post image"}
                    className="w-full max-h-[640px] object-contain"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="flex h-56 w-full items-center justify-center">
                  <InstagramIcon size={36} className="text-stone-300" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isMultiple && (
        <div className="absolute top-3 right-3 z-10 rounded-full bg-black/60 px-2.5 py-0.5 text-[11px] font-bold text-white backdrop-blur-md tracking-wider">
          {activeIndex + 1}/{items.length}
        </div>
      )}

      {isMultiple && activeIndex > 0 && (
        <button
          onClick={prevSlide}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-[#24203a] shadow-md backdrop-blur-sm transition-all hover:bg-white hover:scale-110 active:scale-95 cursor-pointer"
          aria-label="Previous slide"
        >
          <ChevronLeft size={16} />
        </button>
      )}

      {isMultiple && activeIndex < items.length - 1 && (
        <button
          onClick={nextSlide}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-[#24203a] shadow-md backdrop-blur-sm transition-all hover:bg-white hover:scale-110 active:scale-95 cursor-pointer"
          aria-label="Next slide"
        >
          <ChevronRight size={16} />
        </button>
      )}

      {isMultiple && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 rounded-full bg-black/40 px-2 py-1 backdrop-blur-sm">
          {items.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setActiveIndex(idx);
              }}
              className={`size-1.5 rounded-full transition-all cursor-pointer ${
                idx === activeIndex ? "bg-white scale-125 w-3" : "bg-white/50"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function InstagramStoriesBar({
  posts,
  onSelectPost,
}: {
  posts: InstagramPost[];
  onSelectPost: (post: InstagramPost) => void;
}) {
  const storyItems = posts.filter((post) => post.isPinned);

  if (storyItems.length === 0) return null;

  return (
    <div className="mb-6 w-full overflow-x-auto pb-2 scrollbar-none select-none">
      <div className="flex items-center gap-4 px-1">
        {storyItems.map((post) => {
          const isVideo = post.media_type === "VIDEO";
          const imgUrl = isVideo ? post.thumbnail_url || post.media_url : post.media_url;
          const isText = post.media_type === "TEXT" || !imgUrl;

          return (
            <button
              key={post.id}
              onClick={() => onSelectPost(post)}
              className="group flex flex-col items-center gap-1.5 shrink-0 focus:outline-none cursor-pointer"
            >
              <div
                className={`relative flex h-16 w-16 items-center justify-center rounded-full p-[2.5px] transition-transform duration-300 group-hover:scale-105 ${
                  post.isPinned
                    ? "bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 shadow-md shadow-rose-200/50 ring-2 ring-amber-400/40"
                    : "bg-gradient-to-tr from-[#7257f4] via-[#bc59ec] to-[#f472b6]"
                }`}
              >
                <div className="h-full w-full overflow-hidden rounded-full border-2 border-white bg-stone-100 flex items-center justify-center relative">
                  {isText ? (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#7257f4] to-[#bc59ec] p-1 text-center text-[9px] font-bold text-white leading-tight">
                      SSYM
                    </div>
                  ) : (
                    <img
                      src={imgUrl}
                      alt={post.caption || "Story Highlight"}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  )}

                  {post.isPinned && (
                    <div className="absolute bottom-0 right-0 rounded-full bg-amber-500 p-0.5 text-white shadow-sm border border-white">
                      <Pin size={8} className="fill-white" />
                    </div>
                  )}
                </div>
              </div>

              <span className="max-w-[72px] truncate text-[11px] font-semibold text-[#24203a] group-hover:text-[#7257f4] transition-colors">
                {post.isPinned ? "📌 Pinned" : post.caption?.slice(0, 12) || "Highlight"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Visibility View Tracker for Posts (IntersectionObserver)
function PostViewTracker({
  postId,
  onVisible,
  children,
}: {
  postId: string;
  onVisible: (id: string) => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const recordedRef = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || recordedRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !recordedRef.current) {
            recordedRef.current = true;
            onVisible(postId);
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(node);

    return () => {
      if (node) observer.unobserve(node);
    };
  }, [postId, onVisible]);

  return <div ref={ref}>{children}</div>;
}

// Custom SSYM App-Themed Calendar & Time Picker Component
interface SSYMCalendarPickerProps {
  value: string;
  onChange: (val: string) => void;
}

function SSYMCalendarPicker({ value, onChange }: SSYMCalendarPickerProps) {
  const parseVal = (strVal: string) => {
    if (!strVal) return new Date();
    const d = new Date(strVal);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const initial = parseVal(value);
  const [viewDate, setViewDate] = useState<Date>(
    new Date(initial.getFullYear(), initial.getMonth(), 1)
  );
  const [selectedDay, setSelectedDay] = useState<number>(initial.getDate());

  let rawHour = initial.getHours();
  const initialAmpm = rawHour >= 12 ? "PM" : "AM";
  rawHour = rawHour % 12;
  rawHour = rawHour ? rawHour : 12;

  const [hour, setHour] = useState<number>(rawHour);
  const [minute, setMinute] = useState<number>(Math.floor(initial.getMinutes() / 5) * 5);
  const [ampm, setAmpm] = useState<"AM" | "PM">(initialAmpm);

  const emitChange = (y: number, m: number, d: number, h: number, min: number, ap: "AM" | "PM") => {
    let finalHour = h;
    if (ap === "PM" && finalHour < 12) finalHour += 12;
    if (ap === "AM" && finalHour === 12) finalHour = 0;

    const dt = new Date(y, m, d, finalHour, min);
    const localIso = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    onChange(localIso);
  };

  const handleDayClick = (d: number) => {
    setSelectedDay(d);
    emitChange(viewDate.getFullYear(), viewDate.getMonth(), d, hour, minute, ampm);
  };

  const prevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDay(now.getDate());
    let h = now.getHours();
    const ap = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    const m = Math.floor(now.getMinutes() / 5) * 5;
    setHour(h);
    setMinute(m);
    setAmpm(ap);
    emitChange(now.getFullYear(), now.getMonth(), now.getDate(), h, m, ap);
  };

  const handleClear = () => {
    onChange("");
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthName = viewDate.toLocaleString("default", { month: "long" });
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells = [];
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    cells.push({ day: daysInPrevMonth - i, isCurrent: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, isCurrent: true });
  }
  const total = cells.length > 35 ? 42 : 35;
  const rem = total - cells.length;
  for (let d = 1; d <= rem; d++) {
    cells.push({ day: d, isCurrent: false });
  }

  const getTime24String = () => {
    let h24 = hour;
    if (ampm === "PM" && h24 < 12) h24 += 12;
    if (ampm === "AM" && h24 === 12) h24 = 0;
    return `${h24.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  };

  const handleTimeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) return;
    const [hStr, mStr] = val.split(":");
    const h24 = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    const ap = h24 >= 12 ? "PM" : "AM";
    let h12 = h24 % 12;
    h12 = h12 ? h12 : 12;

    setHour(h12);
    setMinute(m);
    setAmpm(ap);
    emitChange(viewDate.getFullYear(), viewDate.getMonth(), selectedDay, h12, m, ap);
  };

  return (
    <div className="rounded-2xl border border-[#ebe7f6] bg-white p-3.5 shadow-sm text-[#24203a] select-none space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
        <div className="sm:col-span-7 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-[#24203a]">
              {monthName} {year}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevMonth}
                className="rounded-lg p-1 text-stone-500 hover:bg-[#f4f0ff] hover:text-[#7257f4] transition-colors cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="rounded-lg p-1 text-stone-500 hover:bg-[#f4f0ff] hover:text-[#7257f4] transition-colors cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 text-center text-[10px] font-extrabold text-stone-400">
            <span>S</span>
            <span>M</span>
            <span>T</span>
            <span>W</span>
            <span>T</span>
            <span>F</span>
            <span>S</span>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {cells.map((cell, idx) => {
              if (!cell.isCurrent) {
                return (
                  <span key={idx} className="p-1 text-[11px] font-semibold text-stone-300">
                    {cell.day}
                  </span>
                );
              }

              const isSelected = cell.day === selectedDay;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleDayClick(cell.day)}
                  className={`rounded-xl py-1 text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#7257f4] text-white shadow-md shadow-violet-200"
                      : "text-[#24203a] hover:bg-[#f4f0ff] hover:text-[#7257f4]"
                  }`}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#f5f2fd] text-[11px] font-bold text-[#7257f4]">
            <button type="button" onClick={handleClear} className="hover:underline cursor-pointer">
              Clear
            </button>
            <button type="button" onClick={handleToday} className="hover:underline cursor-pointer">
              Today
            </button>
          </div>
        </div>

        <div className="sm:col-span-5 border-t sm:border-t-0 sm:border-l border-[#f2effb] pt-3 sm:pt-0 sm:pl-3.5 flex flex-col justify-center space-y-2">
          <label className="text-[11px] font-bold text-[#24203a] flex items-center gap-1.5">
            <Clock size={14} className="text-[#7257f4]" /> Select Time
          </label>
          <input
            type="time"
            value={getTime24String()}
            onChange={handleTimeInputChange}
            className="w-full rounded-xl border border-[#e4dcf9] bg-white px-3.5 py-2.5 text-xs font-bold text-[#24203a] accent-[#7257f4] outline-none transition-all focus:border-[#7257f4] focus:ring-4 focus:ring-[#7257f4]/15 cursor-pointer"
          />
          <p className="text-[10px] font-medium text-stone-400">
            Type exact time or use picker
          </p>
        </div>
      </div>
    </div>
  );
}

export function InstagramFeed({ userRole }: { userRole?: string }) {
  const isAdmin = userRole === "SUPER_ADMIN" || userRole === "ADMIN";

  const [posts, setPosts] = useState<InstagramPost[]>(() => globalFeedCache?.posts || []);
  const [loading, setLoading] = useState(() => !globalFeedCache);
  const [error, setError] = useState(false);
  const [viewMode, setViewMode] = useState<"feed" | "grid">("feed");
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  // Progressive Batch Lazy-Loading (Instagram-style Infinite Scroll)
  const [visibleCount, setVisibleCount] = useState(INITIAL_FEED_BATCH);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // App-specific Like State
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>(() => globalFeedCache?.likedPosts || {});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>(() => globalFeedCache?.likeCounts || {});
  const [heartAnimId, setHeartAnimId] = useState<string | null>(null);

  // Likers Modal State
  const [likersModalPostId, setLikersModalPostId] = useState<string | null>(null);
  const [likers, setLikers] = useState<LikerUser[]>([]);
  const [loadingLikers, setLoadingLikers] = useState(false);

  // Modal State for "Create Post"
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCaption, setNewCaption] = useState("");
  const [newMediaUrl, setNewMediaUrl] = useState("");
  const [newMediaType, setNewMediaType] = useState<"IMAGE" | "VIDEO" | "TEXT">("TEXT");
  const [previewFile, setPreviewFile] = useState<string | null>(null);

  // Modal State for Pinning
  const [pinningPost, setPinningPost] = useState<InstagramPost | null>(null);
  const [isCreatePinned, setIsCreatePinned] = useState(false);
  const [createPinDuration, setCreatePinDuration] = useState<"24h" | "7d" | "PERMANENT">("PERMANENT");

  // Modal State for Scheduling Posts
  const [isCreateScheduled, setIsCreateScheduled] = useState(false);
  const [createScheduledAt, setCreateScheduledAt] = useState("");

  // 3-Dots Action Menu State
  const [openMenuPostId, setOpenMenuPostId] = useState<string | null>(null);

  // View tracking and viewers modal state
  const [viewCounts, setViewCounts] = useState<Record<string, number>>(() => globalFeedCache?.viewCounts || {});
  const [viewersModalOpen, setViewersModalOpen] = useState(false);
  const [viewersList, setViewersList] = useState<PostViewer[]>([]);
  const [viewersLoading, setViewersLoading] = useState(false);

  // Lightbox Modal state for Grid View
  const [selectedPost, setSelectedPost] = useState<InstagramPost | null>(null);

  // Modal State for "Edit Post"
  const [editingPost, setEditingPost] = useState<InstagramPost | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [editMediaUrl, setEditMediaUrl] = useState("");
  const [editMediaType, setEditMediaType] = useState<"IMAGE" | "VIDEO" | "TEXT">("TEXT");
  const [editPreviewFile, setEditPreviewFile] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update visible batch count when switching viewMode
  useEffect(() => {
    setVisibleCount(viewMode === "grid" ? INITIAL_GRID_BATCH : INITIAL_FEED_BATCH);
  }, [viewMode, searchQuery]);

  // STAGED & ASYNC DATA STREAMING WITH CLIENT CACHE
  useEffect(() => {
    let isCancelled = false;

    async function loadFeed() {
      // 1. Check SessionStorage cache if in-memory cache is empty
      if (!globalFeedCache) {
        try {
          const cachedJson = sessionStorage.getItem("ssym_feed_cache");
          if (cachedJson) {
            const parsed = JSON.parse(cachedJson) as FeedCacheData;
            if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
              globalFeedCache = parsed;
              setPosts(parsed.posts);
              setLikeCounts(parsed.likeCounts);
              setLikedPosts(parsed.likedPosts);
              setViewCounts(parsed.viewCounts);
              setLoading(false);
            }
          }
        } catch {
          // Ignore cache parse error
        }
      }

      // 2. Fetch Database posts immediately (~30ms)
      try {
        const dbRes = await fetch("/api/posts");
        if (isCancelled) return;

        let dbPosts: InstagramPost[] = [];
        if (dbRes.ok) {
          const result = await dbRes.json();
          dbPosts = result.data ?? [];
        }

        const initialLikedState: Record<string, boolean> = { ...likedPosts };
        const initialLikeCounts: Record<string, number> = { ...likeCounts };

        (dbPosts as (InstagramPost & { isLiked?: boolean })[]).forEach((post) => {
          if (post.isLiked) {
            initialLikedState[post.id] = true;
          }
          if (typeof post.like_count === "number") {
            initialLikeCounts[post.id] = post.like_count;
          }
        });

        // Show DB posts immediately if posts is empty
        if (dbPosts.length > 0) {
          setPosts((prev) => {
            const instaOnly = prev.filter((p) => !p.isLocal);
            const combined = [...dbPosts, ...instaOnly];
            return combined.sort((a, b) => {
              if (a.isPinned && !b.isPinned) return -1;
              if (!a.isPinned && b.isPinned) return 1;
              return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
            });
          });
          setLikeCounts(initialLikeCounts);
          setLikedPosts(initialLikedState);
          setLoading(false);
        }

        // 3. In background: Fetch Instagram API + likes + views
        const backgroundPromises: Promise<Response>[] = [
          fetch("/api/instagram"),
          fetch("/api/posts/like"),
        ];
        if (isAdmin) {
          backgroundPromises.push(fetch("/api/posts/view"));
        }

        const bgResults = await Promise.allSettled(backgroundPromises);
        if (isCancelled) return;

        const instaRes = bgResults[0];
        const likesRes = bgResults[1];
        const viewsRes = isAdmin ? bgResults[2] : undefined;

        let apiPosts: InstagramPost[] = [];
        if (instaRes.status === "fulfilled" && instaRes.value.ok) {
          const result = await instaRes.value.json();
          apiPosts = result.data ?? [];
        }

        if (likesRes.status === "fulfilled" && likesRes.value.ok) {
          const likesData = await likesRes.value.json();
          if (likesData.likeCounts) {
            Object.assign(initialLikeCounts, likesData.likeCounts);
          }
          if (likesData.userLikedPosts) {
            Object.assign(initialLikedState, likesData.userLikedPosts);
          }
        }

        let newViewCounts = { ...viewCounts };
        if (viewsRes && viewsRes.status === "fulfilled" && viewsRes.value.ok) {
          const viewsData = await viewsRes.value.json();
          if (viewsData.viewCounts) {
            newViewCounts = { ...newViewCounts, ...viewsData.viewCounts };
            setViewCounts(newViewCounts);
          }
        }

        const allCombined = [...dbPosts, ...apiPosts];
        allCombined.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });

        setPosts(allCombined);
        setLikeCounts(initialLikeCounts);
        setLikedPosts(initialLikedState);
        setLoading(false);

        // Update global cache & session storage
        const cachePayload: FeedCacheData = {
          posts: allCombined,
          likeCounts: initialLikeCounts,
          likedPosts: initialLikedState,
          viewCounts: newViewCounts,
          timestamp: Date.now(),
        };
        globalFeedCache = cachePayload;
        try {
          sessionStorage.setItem("ssym_feed_cache", JSON.stringify(cachePayload));
        } catch {
          // ignore quota error
        }
      } catch (err) {
        console.error("Error loading feed data:", err);
        if (!globalFeedCache) {
          setError(true);
        }
      } finally {
        setLoading(false);
      }
    }

    loadFeed();

    return () => {
      isCancelled = true;
    };
  }, [isAdmin]);

  // Close Modals on ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedPost(null);
        setEditingPost(null);
        setIsCreateModalOpen(false);
        setLikersModalPostId(null);
        setPinningPost(null);
        setViewersModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const recordPostView = async (postId: string) => {
    try {
      const res = await fetch("/api/posts/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.viewCount !== undefined) {
          setViewCounts((prev) => ({ ...prev, [postId]: data.viewCount }));
        }
      }
    } catch (err) {
      console.error("Error recording view:", err);
    }
  };

  const openViewersModal = async (postId: string) => {
    if (!isAdmin) return;
    setViewersModalOpen(true);
    setViewersLoading(true);
    try {
      const res = await fetch(`/api/posts/view?postId=${postId}`);
      if (res.ok) {
        const data = await res.json();
        setViewersList(data.viewers || []);
      }
    } catch (err) {
      console.error("Error fetching viewers:", err);
    } finally {
      setViewersLoading(false);
    }
  };

  const openLikersModal = async (postId: string) => {
    if (!isAdmin) return;
    setLikersModalPostId(postId);
    setLoadingLikers(true);
    try {
      const res = await fetch(`/api/posts/like?postId=${encodeURIComponent(postId)}`);
      if (res.ok) {
        const data = await res.json();
        setLikers(data.likers ?? []);
      }
    } catch (err) {
      console.error("Failed to fetch likers:", err);
    } finally {
      setLoadingLikers(false);
    }
  };

  const handleTogglePin = async (
    postId: string,
    targetIsPinned: boolean,
    duration?: "24h" | "7d" | "PERMANENT"
  ) => {
    try {
      const res = await fetch("/api/posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: postId,
          isPinned: targetIsPinned,
          pinDuration: duration || "PERMANENT",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to update pin status.");
        return;
      }

      setPosts((prev) => {
        const updated = prev.map((p) =>
          p.id === postId
            ? { ...p, isPinned: targetIsPinned, pinnedUntil: data.data?.pinnedUntil || null }
            : p
        );

        return [...updated].sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });
      });

      setPinningPost(null);
    } catch (err) {
      console.error("Failed to pin post:", err);
      alert("Error updating pin status.");
    }
  };

  const handleOpenEdit = (post: InstagramPost) => {
    const postTime = new Date(post.timestamp).getTime();
    const minutesPassed = (Date.now() - postTime) / (1000 * 60);

    if (minutesPassed > 15) {
      alert(`Edit window expired! Posts can only be edited within 15 minutes of creation.`);
      return;
    }

    setEditingPost(post);
    setEditCaption(post.caption || "");
    setEditMediaType(post.media_type === "CAROUSEL_ALBUM" ? "IMAGE" : (post.media_type as unknown as "IMAGE" | "VIDEO" | "TEXT"));
    setEditMediaUrl(post.media_url || "");
    setEditPreviewFile(post.media_url || post.thumbnail_url || null);
  };

  const handleEditFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVid = file.type.startsWith("video/");
    setEditMediaType(isVid ? "VIDEO" : "IMAGE");

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setEditPreviewFile(result);
      setEditMediaUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleEditPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;

    const finalMediaType = editMediaUrl.trim()
      ? editMediaType === "TEXT"
        ? "IMAGE"
        : editMediaType
      : "TEXT";

    try {
      const res = await fetch("/api/posts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingPost.id,
          caption: editCaption,
          mediaType: finalMediaType,
          mediaUrl: editMediaUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to update post.");
        return;
      }

      setPosts((prev) =>
        prev.map((p) => (p.id === editingPost.id ? { ...p, ...data.data } : p))
      );

      setEditingPost(null);
    } catch (err) {
      console.error("Failed to edit post:", err);
      alert("Error editing post.");
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const res = await fetch(`/api/posts?id=${encodeURIComponent(postId)}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to delete post.");
        return;
      }

      setPosts((prev) => prev.filter((p) => p.id !== postId));
      if (selectedPost?.id === postId) {
        setSelectedPost(null);
      }
    } catch (err) {
      console.error("Failed to delete post:", err);
      alert("Error deleting post.");
    }
  };

  const handleToggleLike = async (postId: string) => {
    const isCurrentlyLiked = !!likedPosts[postId];
    const willBeLiked = !isCurrentlyLiked;

    setLikedPosts((prev) => ({ ...prev, [postId]: willBeLiked }));
    setLikeCounts((prev) => {
      const currentCount = prev[postId] || 0;
      return { ...prev, [postId]: Math.max(0, currentCount + (willBeLiked ? 1 : -1)) };
    });

    try {
      const res = await fetch("/api/posts/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });

      if (res.ok) {
        const data = await res.json();
        setLikedPosts((prev) => ({ ...prev, [postId]: data.isLiked }));
        setLikeCounts((prev) => ({ ...prev, [postId]: data.likeCount }));
      } else {
        setLikedPosts((prev) => ({ ...prev, [postId]: isCurrentlyLiked }));
        setLikeCounts((prev) => {
          const currentCount = prev[postId] || 0;
          return { ...prev, [postId]: Math.max(0, currentCount + (isCurrentlyLiked ? 1 : -1)) };
        });
      }
    } catch (error) {
      console.error("Failed to toggle like:", error);
      setLikedPosts((prev) => ({ ...prev, [postId]: isCurrentlyLiked }));
      setLikeCounts((prev) => {
        const currentCount = prev[postId] || 0;
        return { ...prev, [postId]: Math.max(0, currentCount + (isCurrentlyLiked ? 1 : -1)) };
      });
    }
  };

  const handleDoubleTap = (postId: string) => {
    if (!likedPosts[postId]) {
      handleToggleLike(postId);
    }
    setHeartAnimId(postId);
    setTimeout(() => {
      setHeartAnimId(null);
    }, 800);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVid = file.type.startsWith("video/");
    setNewMediaType(isVid ? "VIDEO" : "IMAGE");

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setPreviewFile(result);
      setNewMediaUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaption.trim() && !newMediaUrl.trim()) return;

    const finalMediaType = newMediaUrl.trim()
      ? newMediaType === "TEXT"
        ? "IMAGE"
        : newMediaType
      : "TEXT";

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption: newCaption.trim(),
          mediaType: finalMediaType,
          mediaUrl: newMediaUrl.trim(),
          isPinned: isCreatePinned,
          pinDuration: createPinDuration,
          scheduledAt: isCreateScheduled && createScheduledAt ? new Date(createScheduledAt).toISOString() : null,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save post to database");
      }

      const result = await res.json();
      const newPost: InstagramPost = result.data;

      setPosts((prev) => {
        const updated = [newPost, ...prev];
        return updated.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });
      });

      setNewCaption("");
      setNewMediaUrl("");
      setNewMediaType("TEXT");
      setPreviewFile(null);
      setIsCreatePinned(false);
      setCreatePinDuration("PERMANENT");
      setIsCreateScheduled(false);
      setCreateScheduledAt("");
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error("Failed to create post:", err);
      alert("Failed to save post to database. Please try again.");
    }
  };

  // Filter posts by search query
  const filteredPosts = posts.filter((post) =>
    searchQuery
      ? post.caption?.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  // Progressive Batch Windowing
  const displayedPosts = filteredPosts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPosts.length;

  const handleLoadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) =>
        Math.min(
          prev + (viewMode === "grid" ? 4 : BATCH_INCREMENT),
          filteredPosts.length
        )
      );
      setLoadingMore(false);
    }, 350); // Instagram-like smooth skeleton delay while fetching next batch
  }, [loadingMore, hasMore, viewMode, filteredPosts.length]);

  // Auto Lazy-Load Sentinel Observer (scoped to internal scrollable container)
  useEffect(() => {
    const node = sentinelRef.current;
    const container = scrollContainerRef.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore();
        }
      },
      {
        root: container || null,
        rootMargin: "300px",
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, handleLoadMore]);

  return (
    <div className="w-full flex flex-col h-full overflow-hidden">
      {/* Top Controls Bar - Fixed Header that stays locked in place */}
      <div className="shrink-0 mb-4">
        <div className="card-base p-4 sm:p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Brand Logo & Social Icons */}
          <div className="flex items-center gap-2.5">
            <img
              src="/ssym-logo.png"
              alt="Shiv Sai Yuvak Mandal"
              className="h-10 w-10 object-contain rounded-2xl border border-[#ebe7f6] bg-white p-1 shadow-xs"
            />

            <a
              href="https://www.instagram.com/shivsaiyuvakmandal_official"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#7257f4] via-[#bc59ec] to-[#E1306C] text-white shadow-md shadow-pink-500/10 transition-transform hover:scale-105"
              title="Visit Official Instagram Profile"
            >
              <InstagramIcon size={20} />
            </a>

            <a
              href="https://www.facebook.com/shivsaiyuvakmandal"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1877F2] text-white shadow-md shadow-blue-500/10 transition-transform hover:scale-105"
              title="Visit Official Facebook Page"
            >
              <FacebookIcon size={20} />
            </a>
          </div>

          {/* Search & View Mode */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-48 lg:w-56 min-w-[120px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-base pl-8 pr-7 text-xs py-1.5"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {isAdmin && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-r from-[#7257f4] to-[#bc59ec] text-white shadow-md shadow-violet-200 transition-all hover:scale-105 cursor-pointer shrink-0"
                title="Create Post"
              >
                <PlusCircle size={18} />
              </button>
            )}

            <div className="flex items-center rounded-2xl border border-[#ebe7f6] bg-[#f8f7fc] p-1 shrink-0">
              <button
                onClick={() => setViewMode("feed")}
                className={`flex items-center justify-center rounded-xl p-1.5 transition-all cursor-pointer ${
                  viewMode === "feed"
                    ? "bg-white text-brand shadow-xs font-bold"
                    : "text-stone-500 hover:text-[#24203a]"
                }`}
                title="Feed View"
              >
                <SquareStack size={17} />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`flex items-center justify-center rounded-xl p-1.5 transition-all cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-white text-brand shadow-xs font-bold"
                    : "text-stone-500 hover:text-[#24203a]"
                }`}
                title="Grid View"
              >
                <Grid size={17} />
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Scrollable Posts Feed Area - ONLY this scrolls */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto pr-1 sm:pr-2 pb-6 space-y-6 scrollbar-thin scrollbar-thumb-violet-200/80 hover:scrollbar-thumb-violet-300 scrollbar-track-transparent select-text"
      >
        {/* Loading Skeleton */}
      {loading && (
        viewMode === "feed" ? (
          <div className="mx-auto max-w-md space-y-6">
            <InstagramPostSkeleton />
            <InstagramPostSkeleton />
          </div>
        ) : (
          <InstagramGridSkeleton count={8} />
        )
      )}

      {/* Error State */}
      {!loading && error && posts.length === 0 && (
        <div className="card-base p-8 text-center">
          <InstagramIcon size={36} className="mx-auto mb-3 text-stone-300" />
          <h3 className="text-sm font-bold text-[#24203a]">
            Instagram Feed Unavailable
          </h3>
          <p className="mt-1 text-xs text-stone-500">
            Visit our social profiles using the icons above.
          </p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredPosts.length === 0 && (
        <div className="card-base p-12 text-center">
          <InstagramIcon size={36} className="mx-auto mb-2 text-stone-300" />
          <h3 className="text-sm font-bold text-[#24203a]">No posts found</h3>
          <p className="mt-1 text-xs text-stone-500">
            {isAdmin ? "Click + above to create your first post!" : "Check back later for updates."}
          </p>
        </div>
      )}

      {/* FEED VIEW */}
      {!loading && viewMode === "feed" && filteredPosts.length > 0 && (
        <div className="mx-auto max-w-md space-y-6">
          <InstagramStoriesBar posts={filteredPosts} onSelectPost={setSelectedPost} />

          {displayedPosts.map((post) => {
            const isLiked = !!likedPosts[post.id];
            const appLikeCount = likeCounts[post.id] || 0;
            const isTextOnly = post.media_type === "TEXT" || (!post.media_url && !post.thumbnail_url);

            return (
              <PostViewTracker key={post.id} postId={post.id} onVisible={recordPostView}>
                <article className="overflow-hidden rounded-3xl border border-[#ebe7f6] bg-white shadow-xs transition-all hover:shadow-md">
                  {/* Clean Post Header */}
                  <div className="flex items-center justify-between p-3.5 pb-2.5 border-b border-[#f7f6fc]">
                    <div className="flex items-center gap-2.5">
                      <img
                        src="/ssym-logo.png"
                        alt="SSYM Logo"
                        className="h-8 w-8 object-contain rounded-full border border-[#ebe7f6] bg-white p-0.5 shadow-2xs"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#24203a]">
                          Shiv Sai Yuvak Mandal
                        </span>
                        {post.isPinned && (
                          <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200/60 shadow-2xs" title="Pinned Post">
                            <Pin size={10} className="fill-amber-600 text-amber-600" /> Pinned
                          </span>
                        )}
                        {post.isScheduled && (
                          <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200/60 shadow-2xs">
                            <Calendar size={10} className="text-blue-600" /> Scheduled
                          </span>
                        )}
                      </div>
                    </div>

                    {isAdmin && post.isLocal && (
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenuPostId(openMenuPostId === post.id ? null : post.id)}
                          className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-[#24203a] transition-colors cursor-pointer"
                        >
                          <MoreVertical size={18} />
                        </button>

                        {openMenuPostId === post.id && (
                          <>
                            <div
                              className="fixed inset-0 z-20"
                              onClick={() => setOpenMenuPostId(null)}
                            />
                            <div className="absolute right-0 top-8 z-30 w-44 overflow-hidden rounded-2xl bg-white p-1.5 shadow-xl border border-[#ebe7f6] animate-in fade-in zoom-in-95">
                              {post.isPinned ? (
                                <button
                                  onClick={() => {
                                    setOpenMenuPostId(null);
                                    handleTogglePin(post.id, false);
                                  }}
                                  className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 transition-colors text-left cursor-pointer"
                                >
                                  <Pin size={14} className="fill-amber-600 text-amber-600" /> Unpin Post
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setOpenMenuPostId(null);
                                    setPinningPost(post);
                                  }}
                                  className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-[#24203a] hover:bg-[#f5f2fa] hover:text-[#7257f4] transition-colors text-left cursor-pointer"
                                >
                                  <Pin size={14} className="text-amber-500" /> Pin Post
                                </button>
                              )}

                              {(() => {
                                const postTime = new Date(post.timestamp).getTime();
                                const minutesPassed = (Date.now() - postTime) / (1000 * 60);
                                const canEdit = minutesPassed <= 15;

                                return canEdit ? (
                                  <button
                                    onClick={() => {
                                      setOpenMenuPostId(null);
                                      handleOpenEdit(post);
                                    }}
                                    className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-[#24203a] hover:bg-[#f5f2fa] hover:text-[#7257f4] transition-colors text-left cursor-pointer"
                                  >
                                    <Pencil size={14} className="text-[#7257f4]" /> Edit Post
                                  </button>
                                ) : (
                                  <button
                                    disabled
                                    className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-stone-400 opacity-60 text-left cursor-not-allowed"
                                  >
                                    <Clock size={14} /> Edit expired
                                  </button>
                                );
                              })()}

                              <div className="my-1 border-t border-[#f0ecf9]" />

                              <button
                                onClick={() => {
                                  setOpenMenuPostId(null);
                                  handleDeletePost(post.id);
                                }}
                                className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                              >
                                <Trash2 size={14} /> Delete Post
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {isTextOnly ? (
                    <div
                      className="p-5 select-none relative"
                      onDoubleClick={() => handleDoubleTap(post.id)}
                    >
                      <div className="rounded-2xl border border-[#f0ecf9] bg-gradient-to-br from-[#fbfafd] via-white to-[#f7f3fe] p-5 shadow-inner">
                        <div className="text-sm font-medium text-[#24203a] leading-relaxed">
                          <FormattedCaption caption={post.caption} />
                        </div>
                      </div>

                      {heartAnimId === post.id && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                          <Heart
                            size={70}
                            className="animate-ping fill-rose-500 text-rose-500 opacity-90 transition-all duration-300"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative">
                      <PostMediaCarousel
                        post={post}
                        onDoubleTap={() => handleDoubleTap(post.id)}
                        heartAnim={heartAnimId === post.id}
                      />
                      {heartAnimId === post.id && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                          <Heart
                            size={70}
                            className="animate-ping fill-rose-500 text-rose-500 opacity-90 transition-all duration-300"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Post Footer */}
                  <div className="p-4 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggleLike(post.id)}
                          className="group/btn relative transition-transform active:scale-75 cursor-pointer"
                          title={isLiked ? "Unlike" : "Like"}
                        >
                          <Heart
                            size={22}
                            className={`transition-colors duration-200 ${
                              isLiked
                                ? "fill-[#FF3040] text-[#FF3040] scale-110"
                                : "text-[#24203a] hover:text-[#FF3040]"
                            }`}
                          />
                        </button>

                        {isAdmin ? (
                          <button
                            onClick={() => openLikersModal(post.id)}
                            className="text-xs font-bold text-[#24203a] hover:text-[#7257f4] hover:underline cursor-pointer transition-colors"
                          >
                            {appLikeCount} {appLikeCount === 1 ? "like" : "likes"}
                          </button>
                        ) : (
                          <span className="text-xs font-bold text-[#24203a]">
                            {appLikeCount} {appLikeCount === 1 ? "like" : "likes"}
                          </span>
                        )}

                        {isAdmin && (
                          <button
                            onClick={() => openViewersModal(post.id)}
                            className="flex items-center gap-1 text-xs font-bold text-stone-500 hover:text-[#7257f4] hover:underline cursor-pointer transition-colors ml-2 border-l border-stone-200 pl-3"
                          >
                            <Eye size={14} className="text-stone-400" />
                            {viewCounts[post.id] || 0} {viewCounts[post.id] === 1 ? "view" : "views"}
                          </button>
                        )}
                      </div>

                      <div className="text-[10px] font-semibold tracking-wider text-stone-400 uppercase">
                        {formatTimeAgo(post.timestamp)}
                      </div>
                    </div>

                    {!isTextOnly && post.caption && (
                      <div className="mt-2 text-xs leading-relaxed">
                        <ExpandableCaption caption={post.caption} maxLength={100} />
                      </div>
                    )}
                  </div>
                </article>
              </PostViewTracker>
            );
          })}

          {/* Instagram-style Bottom Shimmer Skeleton on Infinite Scroll */}
          {loadingMore && (
            <div className="space-y-6 pt-1">
              <InstagramPostSkeleton />
            </div>
          )}
        </div>
      )}

      {/* GRID VIEW */}
      {!loading && viewMode === "grid" && filteredPosts.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {displayedPosts.map((post) => {
              const appLikeCount = likeCounts[post.id] || 0;
              const isVideo = post.media_type === "VIDEO";
              const isCarousel = post.media_type === "CAROUSEL_ALBUM" || (post.children?.data && post.children.data.length > 1);
              const isTextOnly = post.media_type === "TEXT" || (!post.media_url && !post.thumbnail_url);
              const imageUrl = isVideo ? post.thumbnail_url || post.media_url : post.media_url;

              return (
                <PostViewTracker key={post.id} postId={post.id} onVisible={recordPostView}>
                  <div
                    onClick={() => setSelectedPost(post)}
                    className="group relative aspect-square cursor-pointer overflow-hidden rounded-2xl bg-stone-100 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                  >
                    {isTextOnly ? (
                      <div className="flex h-full w-full flex-col justify-between bg-gradient-to-br from-[#7257f4] to-[#bc59ec] p-3.5 text-white">
                        <MessageSquareText size={18} className="opacity-80" />
                        <p className="line-clamp-3 text-xs font-bold leading-snug">
                          {post.caption}
                        </p>
                        <span className="text-[9px] font-semibold opacity-75">
                          {formatTimeAgo(post.timestamp)}
                        </span>
                      </div>
                    ) : imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={post.caption?.slice(0, 80) || "Post"}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <InstagramIcon size={32} className="text-stone-300" />
                      </div>
                    )}

                    {isCarousel && (
                      <div className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white backdrop-blur-md">
                        <SquareStack size={12} />
                      </div>
                    )}

                    <div className="absolute inset-0 flex items-center justify-center gap-4 bg-black/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100 backdrop-blur-[2px]">
                      <div className="flex items-center gap-1 text-xs font-extrabold text-white">
                        <Heart size={16} className="fill-white text-white" />
                        {appLikeCount}
                      </div>
                      {isAdmin && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openViewersModal(post.id);
                          }}
                          className="flex items-center gap-1 text-xs font-extrabold text-white hover:text-amber-300 transition-colors cursor-pointer"
                        >
                          <Eye size={16} />
                          {viewCounts[post.id] || 0}
                        </button>
                      )}
                    </div>
                  </div>
                </PostViewTracker>
              );
            })}
          </div>

          {/* Instagram Grid Bottom Shimmer Skeleton on Infinite Scroll */}
          {loadingMore && (
            <div className="pt-2">
              <InstagramGridSkeleton count={4} />
            </div>
          )}
        </div>
      )}

      {/* INFINITE SCROLL SENTINEL */}
      {hasMore && (
        <div ref={sentinelRef} className="flex flex-col items-center justify-center py-6 gap-2">
          {!loadingMore && (
            <span className="text-[11px] text-stone-400 font-medium">
              Scroll down to load more ({filteredPosts.length - visibleCount} remaining)
            </span>
          )}
        </div>
      )}
      </div>

      {/* LIGHTBOX PREVIEW MODAL */}
      {selectedPost && mounted && createPortal(
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in cursor-pointer select-none"
          onClick={() => setSelectedPost(null)}
        >
          <button
            onClick={() => setSelectedPost(null)}
            className="absolute top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-all hover:bg-white/40 hover:scale-110 active:scale-95 shadow-xl cursor-pointer"
            title="Close preview (Esc)"
          >
            <X size={22} />
          </button>

          <div
            className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPost(null)}
              className="absolute top-3 right-3 z-40 rounded-full bg-black/60 p-2 text-white backdrop-blur-md hover:bg-black/80 shadow-md cursor-pointer transition-transform hover:scale-110"
              title="Close preview"
            >
              <X size={18} />
            </button>

            {selectedPost.media_type === "TEXT" || (!selectedPost.media_url && !selectedPost.thumbnail_url) ? (
              <div className="p-8 bg-gradient-to-br from-[#7257f4] to-[#bc59ec] text-white">
                <div className="flex items-center gap-2 mb-3">
                  <img
                    src="/ssym-logo.png"
                    alt="SSYM Logo"
                    className="h-8 w-8 object-contain rounded-full border border-white/30 bg-white p-0.5"
                  />
                  <span className="text-xs font-bold">Shiv Sai Yuvak Mandal</span>
                </div>
                <p className="text-base font-semibold leading-relaxed">
                  {selectedPost.caption}
                </p>
              </div>
            ) : (
              <PostMediaCarousel post={selectedPost} />
            )}

            <div className="p-4 border-t border-[#f4f2fa]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleLike(selectedPost.id)}
                    className="flex items-center gap-1.5 text-xs font-bold text-[#24203a] active:scale-95 transition-transform cursor-pointer"
                  >
                    <Heart
                      size={18}
                      className={
                        likedPosts[selectedPost.id]
                          ? "fill-[#FF3040] text-[#FF3040]"
                          : "text-[#24203a]"
                      }
                    />
                  </button>

                  {isAdmin ? (
                    <button
                      onClick={() => openLikersModal(selectedPost.id)}
                      className="text-xs font-bold text-[#24203a] hover:text-[#7257f4] hover:underline cursor-pointer"
                    >
                      {(likeCounts[selectedPost.id] || 0)} likes
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-[#24203a]">
                      {(likeCounts[selectedPost.id] || 0)} likes
                    </span>
                  )}
                </div>

                <span className="text-[10px] text-stone-400 font-medium">
                  {formatTimeAgo(selectedPost.timestamp)}
                </span>
              </div>

              {selectedPost.media_type !== "TEXT" && selectedPost.caption && (
                <div className="mt-2 text-xs">
                  <FormattedCaption caption={selectedPost.caption} />
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* CREATE POST MODAL DIALOG */}
      {isCreateModalOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-3xl bg-white p-4 sm:p-6 shadow-2xl border border-stone-100 no-scrollbar">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="heading-md">
                Create SSYM App Post
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-xl p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="mt-4 space-y-4">
              <div>
                <label className="input-label">
                  What&apos;s on your mind? (Text Post)
                </label>
                <textarea
                  rows={4}
                  placeholder="Type your message, announcement or hashtags (#shivsaiyuvakmandal)..."
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  className="input-base p-3 text-xs resize-none"
                />
              </div>

              <div>
                <label className="input-label">
                  Attach Photo / Video <span className="font-normal text-stone-400">(Optional)</span>
                </label>
                <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#ebe7f6] bg-[#fbfafd] p-3 text-center hover:bg-[#f7f4fd] transition-colors">
                  {previewFile ? (
                    <div className="relative h-36 w-full overflow-hidden rounded-xl bg-black">
                      {newMediaType === "VIDEO" ? (
                        <video src={previewFile} className="h-full w-full object-contain" controls />
                      ) : (
                        <img src={previewFile} alt="Preview" className="h-full w-full object-contain" />
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewFile(null);
                          setNewMediaUrl("");
                          setNewMediaType("TEXT");
                        }}
                        className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white hover:bg-black cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer flex-col items-center justify-center py-2">
                      <Upload size={20} className="text-[#7257f4] mb-1" />
                      <span className="text-xs font-bold text-[#24203a]">
                        Upload Image or Video
                      </span>
                      <span className="text-[10px] text-stone-400 mt-0.5">
                        PNG, JPG, MP4 supported
                      </span>
                      <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200/80 bg-amber-50/60 p-3">
                <label className="flex items-center justify-between cursor-pointer select-none">
                  <span className="text-xs font-bold text-[#24203a] flex items-center gap-1.5">
                    <Pin size={14} className="text-amber-600 fill-amber-500" /> Pin to Top & Stories
                  </span>
                  <input
                    type="checkbox"
                    checked={isCreatePinned}
                    onChange={(e) => setIsCreatePinned(e.target.checked)}
                    className="h-4 w-4 rounded accent-[#7257f4] cursor-pointer"
                  />
                </label>

                {isCreatePinned && (
                  <div className="mt-2.5 pt-2 border-t border-amber-200/60 flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-stone-600">Duration:</span>
                    {(["24h", "7d", "PERMANENT"] as const).map((dur) => (
                      <button
                        key={dur}
                        type="button"
                        onClick={() => setCreatePinDuration(dur)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          createPinDuration === dur
                            ? "bg-[#7257f4] text-white shadow-xs"
                            : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
                        }`}
                      >
                        {dur === "24h" ? "24 Hours" : dur === "7d" ? "7 Days" : "Until Changed"}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-violet-200/80 bg-[#f9f7fe] p-3.5 space-y-2">
                <label className="flex items-center justify-between cursor-pointer select-none">
                  <span className="text-xs font-bold text-[#24203a] flex items-center gap-1.5">
                    <Calendar size={15} className="text-[#7257f4]" /> Schedule Post for Later
                  </span>
                  <input
                    type="checkbox"
                    checked={isCreateScheduled}
                    onChange={(e) => {
                      setIsCreateScheduled(e.target.checked);
                      if (e.target.checked && !createScheduledAt) {
                        const defaultDate = new Date(Date.now() + 60 * 60 * 1000);
                        const localIso = new Date(defaultDate.getTime() - defaultDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                        setCreateScheduledAt(localIso);
                      }
                    }}
                    className="h-4 w-4 rounded accent-[#7257f4] cursor-pointer"
                  />
                </label>

                {isCreateScheduled && (
                  <div className="pt-2 border-t border-[#ebe3fa] space-y-2 animate-in fade-in">
                    <label className="input-label">
                      Publish Date & Time:
                    </label>
                    <SSYMCalendarPicker
                      value={createScheduledAt}
                      onChange={setCreateScheduledAt}
                    />
                    <p className="text-[10px] font-medium text-stone-400">
                      Post will be hidden from members until scheduled time arrives.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-stone-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={!newCaption.trim() && !newMediaUrl.trim()}
                >
                  {isCreateScheduled ? "Schedule Post" : "Publish Post"}
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* PIN DURATION MODAL */}
      {pinningPost && mounted && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white p-6 shadow-2xl border border-stone-100">
            <div className="flex items-center justify-between border-b border-[#f4f2fa] pb-3">
              <h3 className="heading-md flex items-center gap-2">
                <Pin size={18} className="text-amber-500 fill-amber-500" /> Pin Post Options
              </h3>
              <button
                onClick={() => setPinningPost(null)}
                className="rounded-xl p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-3 text-xs text-stone-600 font-medium leading-relaxed">
              Choose how long this post should stay pinned at top of feed and in stories:
            </p>

            <div className="mt-4 space-y-2.5">
              {[
                { key: "24h", label: "24 Hours", desc: "Unpins automatically after 24 hours" },
                { key: "7d", label: "7 Days", desc: "Unpins automatically after 7 days" },
                { key: "PERMANENT", label: "Until Changed", desc: "Stays pinned until manually unpinned" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => handleTogglePin(pinningPost.id, true, opt.key as "24h" | "7d" | "PERMANENT")}
                  className="w-full text-left p-3.5 rounded-2xl border border-[#f0ecf9] bg-[#fbfafd] hover:bg-[#f5f0fe] hover:border-[#7257f4]/40 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div>
                    <p className="text-xs font-bold text-[#24203a] group-hover:text-[#7257f4]">{opt.label}</p>
                    <p className="text-[10px] text-stone-400 mt-0.5">{opt.desc}</p>
                  </div>
                  <Pin size={15} className="text-stone-300 group-hover:text-[#7257f4] transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* EDIT POST MODAL */}
      {editingPost && mounted && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-2xl border border-stone-100">
            <div className="flex items-center justify-between border-b border-[#f4f2fa] pb-3">
              <h3 className="heading-md flex items-center gap-2">
                <Pencil size={16} className="text-[#7257f4]" /> Edit Post
              </h3>
              <button
                onClick={() => setEditingPost(null)}
                className="rounded-xl p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-2.5 text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200/60 font-semibold flex items-center gap-1.5">
              <Clock size={13} className="text-amber-600 shrink-0" /> Edit time limit: Posts can only be edited within 15 minutes of creation.
            </p>

            <form onSubmit={handleEditPost} className="mt-4 space-y-4">
              <div>
                <label className="input-label">
                  Edit Text / Caption
                </label>
                <textarea
                  rows={4}
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  className="input-base p-3 text-xs resize-none"
                />
              </div>

              <div>
                <label className="input-label">
                  Update Photo / Video <span className="font-normal text-stone-400">(Optional)</span>
                </label>
                <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#ebe7f6] bg-[#fbfafd] p-3 text-center">
                  {editPreviewFile ? (
                    <div className="relative h-36 w-full overflow-hidden rounded-xl bg-black">
                      {editMediaType === "VIDEO" ? (
                        <video src={editPreviewFile} className="h-full w-full object-contain" controls />
                      ) : (
                        <img src={editPreviewFile} alt="Preview" className="h-full w-full object-contain" />
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setEditPreviewFile(null);
                          setEditMediaUrl("");
                          setEditMediaType("TEXT");
                        }}
                        className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white hover:bg-black cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer flex-col items-center justify-center py-2">
                      <Upload size={20} className="text-[#7257f4] mb-1" />
                      <span className="text-xs font-bold text-[#24203a]">
                        Change Image or Video
                      </span>
                      <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleEditFileChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-stone-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditingPost(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* LIKERS MODAL */}
      {likersModalPostId && mounted && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative flex w-full max-w-sm flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-stone-100">
            <div className="flex items-center justify-between border-b border-[#f0ecf9] px-5 py-4">
              <h3 className="heading-md flex items-center gap-2">
                <Heart size={16} className="fill-[#FF3040] text-[#FF3040]" /> Liked by
              </h3>
              <button
                onClick={() => setLikersModalPostId(null)}
                className="rounded-xl p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-4 space-y-2.5">
              {loadingLikers ? (
                <div className="flex items-center justify-center py-8 text-xs font-medium text-stone-500">
                  <Loader2 size={16} className="animate-spin text-brand mr-2" />
                  Loading users...
                </div>
              ) : likers.length === 0 ? (
                <div className="py-8 text-center text-xs font-medium text-stone-400">
                  No likes yet for this post.
                </div>
              ) : (
                likers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between rounded-2xl border border-[#f5f2fa] bg-[#faf8fc] p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-[#7257f4] to-[#bc59ec] text-xs font-bold text-white shadow-xs">
                        {user.name?.slice(0, 2).toUpperCase() || "U"}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#24203a]">{user.name}</p>
                        {user.mobileNumber && (
                          <p className="text-[10px] text-stone-400">{user.mobileNumber}</p>
                        )}
                      </div>
                    </div>
                    <span className="badge-brand">
                      {user.role === "SUPER_ADMIN"
                        ? "Super Admin"
                        : user.role === "ADMIN"
                        ? "Admin"
                        : "Member"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* VIEWERS MODAL */}
      {viewersModalOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl border border-stone-100">
            <div className="flex items-center justify-between border-b border-[#f4f2fa] p-4">
              <h3 className="heading-md flex items-center gap-2">
                <Eye size={16} className="text-[#7257f4]" />
                Viewed By ({viewersList.length})
              </h3>
              <button
                onClick={() => setViewersModalOpen(false)}
                className="rounded-xl p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-4 space-y-2.5">
              {viewersLoading ? (
                <div className="flex items-center justify-center py-8 text-xs font-medium text-stone-500">
                  <Loader2 size={16} className="animate-spin text-brand mr-2" />
                  Loading viewers...
                </div>
              ) : viewersList.length === 0 ? (
                <div className="py-8 text-center text-xs font-medium text-stone-400">
                  No views recorded yet for this post.
                </div>
              ) : (
                viewersList.map((viewer) => (
                  <div
                    key={viewer.id}
                    className="flex items-center justify-between rounded-2xl border border-[#f5f2fa] bg-[#faf8fc] p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-[#7257f4] to-[#bc59ec] text-xs font-bold text-white shadow-xs">
                        {viewer.name?.slice(0, 2).toUpperCase() || "U"}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#24203a]">{viewer.name}</p>
                        {viewer.mobileNumber && (
                          <p className="text-[10px] text-stone-400">{viewer.mobileNumber}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="badge-brand">
                        {viewer.role === "SUPER_ADMIN"
                          ? "Super Admin"
                          : viewer.role === "ADMIN"
                          ? "Admin"
                          : "Member"}
                      </span>
                      <p className="text-[9px] text-stone-400 mt-1">
                        {formatTimeAgo(viewer.viewedAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
