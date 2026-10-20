"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type CardProfile = {
  id: string;
  full_name: string | null;
  city: string | null;
  avatar_url: string | null;
  role: string | null;
  points: number | null;
};

const LEVELS = [
  { name: "Sathi", min: 0, next: 50, emoji: "🌱" },
  { name: "Helper", min: 50, next: 150, emoji: "🤝" },
  { name: "Hero", min: 150, next: null, emoji: "🏆" },
];

const CAN_DO = [
  { icon: "🎁", text: "Donate items" },
  { icon: "🔁", text: "Lend & borrow" },
  { icon: "💰", text: "Buy & sell" },
  { icon: "🛠️", text: "Find teachers, plumbers & more" },
  { icon: "💬", text: "Chat with your community" },
];

export default function MemberCard() {
  const supabase = createClient();
  const [profile, setProfile] = useState<CardProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, city, avatar_url, role, points")
        .eq("id", auth.user.id)
        .maybeSingle();

      if (error) console.error("MemberCard profile error:", error);
      setProfile(data);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="h-72 w-full max-w-md animate-pulse rounded-3xl bg-gray-200" />
    );
  }

  if (!profile) return null;

  const points = profile.points ?? 0;
  const level =
    [...LEVELS].reverse().find((l) => points >= l.min) ?? LEVELS[0];
  const progress = level.next
    ? Math.min(100, ((points - level.min) / (level.next - level.min)) * 100)
    : 100;
  const name = profile.full_name || "Member";
  const memberId = profile.id.slice(0, 8).toUpperCase();

  return (
    <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-[#173d29] p-6 text-white shadow-2xl">
      {/* decoration */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full border border-white/10" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-52 w-52 rounded-full bg-white/5" />

      {/* header: logo + level */}
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xl">
            ♻️
          </span>
          <span className="text-lg font-extrabold tracking-tight">
            Kaam Ka Sathi
          </span>
        </div>
        <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
          {level.emoji} {level.name}
        </span>
      </div>

      {/* member */}
      <div className="relative mt-6 flex items-center gap-4">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt={name}
            className="h-16 w-16 rounded-full border-2 border-white/40 object-cover"
          />
        ) : (
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#c63868] text-2xl font-black">
            {name.charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-xl font-black">{name}</p>
          <p className="text-xs text-green-200">
            {profile.city ? `📍 ${profile.city} · ` : ""}ID: {memberId}
          </p>
        </div>
      </div>

      {/* points */}
      <div className="relative mt-6">
        <div className="flex items-end justify-between">
          <p className="text-xs font-bold uppercase tracking-widest text-green-200">
            Helping points
          </p>
          <p className="text-2xl font-black">{points}</p>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-[#f5b942] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-green-100/80">
          {level.next
            ? `${level.next - points} more points to the next level`
            : "You reached the top level. Thank you for helping! 🎉"}
        </p>
      </div>

      {/* what you can do */}
      <div className="relative mt-6">
        <p className="text-xs font-bold uppercase tracking-widest text-green-200">
          What you can do
        </p>
        <ul className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          {CAN_DO.map((item) => (
            <li key={item.text} className="flex items-center gap-2">
              <span>{item.icon}</span>
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="relative mt-5 rounded-xl bg-white/10 p-3 text-xs leading-5 text-green-50">
        ⭐ Help someone and earn bonus points. Every helping hand counts!
      </p>

      <Link
        href="/dashboard"
        className="relative mt-5 block rounded-xl bg-white px-4 py-3 text-center text-sm font-bold text-[#173d29] transition hover:bg-green-50"
      >
        Go to my dashboard →
      </Link>
    </div>
  );
}
