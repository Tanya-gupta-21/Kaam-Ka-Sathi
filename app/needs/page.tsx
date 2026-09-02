"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Need = {
  id: number;
  user_id: string;
  title: string;
  description: string | null;
  category: string;
  city: string;
  locality: string;
  created_at: string;
};

const categoryIcons: Record<string, string> = {
  Books: "📚",
  Clothes: "👕",
  Bags: "🎒",
  Furniture: "🪑",
  Toys: "🧸",
  Electronics: "💻",
  Stationery: "✏️",
  Household: "🏠",
  Other: "✨",
};

const categoryStyles: Record<string, string> = {
  Books: "bg-blue-50 text-blue-600",
  Clothes: "bg-pink-50 text-pink-600",
  Bags: "bg-purple-50 text-purple-600",
  Furniture: "bg-orange-50 text-orange-600",
  Toys: "bg-yellow-50 text-yellow-700",
  Electronics: "bg-cyan-50 text-cyan-700",
  Stationery: "bg-indigo-50 text-indigo-600",
  Household: "bg-emerald-50 text-emerald-600",
  Other: "bg-gray-100 text-gray-600",
};

export default function CommunityNeedsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [needs, setNeeds] = useState<Need[]>([]);
  const [helpedNeeds, setHelpedNeeds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [helpingId, setHelpingId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    loadCommunityNeeds();
  }, []);

  async function loadCommunityNeeds() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("needs")
      .select(
        "id, user_id, title, description, category, city, locality, created_at"
      )
      .neq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setNeeds(data || []);

    const { data: interests, error: interestError } = await supabase
      .from("need_interests")
      .select("need_id")
      .eq("interested_user_id", user.id);

    if (interestError) {
      console.error(interestError);
    }

    if (interests) {
      setHelpedNeeds(
        interests.map((item) => Number(item.need_id))
      );
    }

    setLoading(false);
  }

  async function handleHelp(needId: number) {
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    if (helpedNeeds.includes(needId)) {
      return;
    }

    setHelpingId(needId);

    const { error } = await supabase
      .from("need_interests")
      .insert({
        need_id: needId,
        interested_user_id: user.id,
      });

    if (error) {
      if (error.code === "23505") {
        setHelpedNeeds((current) =>
          current.includes(needId)
            ? current
            : [...current, needId]
        );
        setHelpingId(null);
        return;
      }

      console.error(error);
      setMessage(error.message);
      setHelpingId(null);
      return;
    }

    setHelpedNeeds((current) =>
      current.includes(needId)
        ? current
        : [...current, needId]
    );

    setHelpingId(null);
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(needs.map((need) => need.category))
    );

    return ["All", ...uniqueCategories];
  }, [needs]);

  const filteredNeeds = useMemo(() => {
    if (selectedCategory === "All") {
      return needs;
    }

    return needs.filter(
      (need) => need.category === selectedCategory
    );
  }, [needs, selectedCategory]);

  const helpedCount = helpedNeeds.filter((id) =>
    needs.some((need) => need.id === id)
  ).length;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8f4]">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 animate-pulse items-center justify-center rounded-[1.75rem] bg-[#e9f3eb] text-4xl shadow-sm">
            ❤️
          </div>

          <div className="mx-auto mt-5 h-2 w-36 animate-pulse rounded-full bg-gray-200" />

          <p className="mt-4 font-medium text-gray-500">
            Finding people who need help...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8f4] text-[#193326]">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 border-b border-[#e7e4dc] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-6">
          <button
            onClick={() => router.push("/dashboard")}
            className="group text-left"
          >
            <div className="text-xl font-black tracking-tight text-[#173d29] transition group-hover:scale-[1.02] md:text-2xl">
              Kaam Ka Saathi{" "}
              <span className="inline-block transition group-hover:rotate-12">
                ♻️
              </span>
            </div>

            <p className="mt-0.5 text-xs text-gray-500 md:text-sm">
              Help someone find what they need
            </p>
          </button>

          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => router.push("/dashboard/needs")}
              className="rounded-xl border border-[#173d29] px-4 py-2.5 text-sm font-bold text-[#173d29] transition duration-300 hover:-translate-y-0.5 hover:bg-[#173d29] hover:text-white hover:shadow-md md:px-5"
            >
              My Needs
            </button>

            <button
              onClick={() => router.push("/dashboard")}
              className="hidden rounded-xl bg-[#173d29] px-5 py-2.5 text-sm font-bold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-[#102d1f] hover:shadow-lg sm:block"
            >
              Dashboard
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#c63868]/5 blur-3xl" />
        <div className="absolute -right-24 -top-10 h-80 w-80 rounded-full bg-[#173d29]/5 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 pb-10 pt-12 md:px-6 md:pt-16">
          <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#f0d8e1] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#c63868] shadow-sm">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#c63868]" />
                COMMUNITY NEEDS
              </div>

              <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.05] tracking-tight text-[#173d29] md:text-6xl">
                Someone might need
                <span className="text-[#c63868]"> your help.</span>
                <span className="ml-2 inline-block animate-bounce">
                  ❤️
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-gray-600 md:text-lg">
                Browse what people around your community are looking
                for. If you have something useful, turn your extra into
                someone's solution.
              </p>
            </div>

            {/* IMPACT CARD */}
            <div className="group overflow-hidden rounded-[2rem] border border-[#e7e4dc] bg-white p-6 shadow-[0_15px_45px_rgba(23,61,41,0.08)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_20px_55px_rgba(23,61,41,0.12)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-500">
                    Community board
                  </p>

                  <p className="mt-1 text-4xl font-black text-[#173d29]">
                    {needs.length}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    {needs.length === 1
                      ? "person looking for something"
                      : "people looking for something"}
                  </p>
                </div>

                <div className="flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-[#f8e7ed] text-3xl transition duration-500 group-hover:rotate-6 group-hover:scale-110">
                  🙋
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-[#e9f3eb] p-4">
                <p className="text-2xl font-black text-[#173d29]">
                  {helpedCount}
                </p>

                <p className="mt-1 text-xs font-medium text-gray-600">
                  {helpedCount === 1
                    ? "help offer you've made"
                    : "help offers you've made"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK VALUES */}
      <section className="mx-auto max-w-7xl px-5 md:px-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#e7e4dc] bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e9f3eb] text-xl">
                🤝
              </span>

              <div>
                <p className="text-sm font-black text-[#173d29]">
                  Share what you have
                </p>
                <p className="text-xs text-gray-500">
                  Help instead of letting things sit unused.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#e7e4dc] bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f8e7ed] text-xl">
                ❤️
              </span>

              <div>
                <p className="text-sm font-black text-[#173d29]">
                  Make an impact
                </p>
                <p className="text-xs text-gray-500">
                  A small act can solve someone's problem.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#e7e4dc] bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f1eee6] text-xl">
                🌱
              </span>

              <div>
                <p className="text-sm font-black text-[#173d29]">
                  Reduce waste
                </p>
                <p className="text-xs text-gray-500">
                  Keep useful things in use for longer.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="mx-auto max-w-7xl px-5 py-10 md:px-6 md:py-14">
        {message && (
          <div className="mb-7 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-medium text-red-600 shadow-sm">
            <span className="text-lg">⚠️</span>
            <span>{message}</span>
          </div>
        )}

        {/* EMPTY */}
        {needs.length === 0 ? (
          <div className="relative overflow-hidden rounded-[2.5rem] border border-[#e7e4dc] bg-white px-6 py-16 text-center shadow-[0_20px_60px_rgba(23,61,41,0.07)] md:px-12 md:py-24">
            <div className="absolute left-0 top-0 h-40 w-40 rounded-full bg-[#e9f3eb] blur-3xl" />
            <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-[#f8e7ed] blur-3xl" />

            <div className="relative">
              <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-[2rem] bg-[#e9f3eb] text-6xl shadow-sm transition duration-500 hover:rotate-3 hover:scale-105">
                🌱
              </div>

              <p className="mt-7 text-xs font-black uppercase tracking-[0.2em] text-[#c63868]">
                COMMUNITY BOARD
              </p>

              <h2 className="mt-3 text-3xl font-black text-[#173d29] md:text-4xl">
                No community needs yet.
              </h2>

              <p className="mx-auto mt-4 max-w-lg leading-7 text-gray-600">
                Looks like everyone is doing just fine for now.
                You can be the first person to post a need and start
                the conversation.
              </p>

              <button
                onClick={() => router.push("/needs/new")}
                className="mt-8 rounded-2xl bg-[#173d29] px-8 py-4 font-black text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:bg-[#102d1f] hover:shadow-xl"
              >
                Post a Need
                <span className="ml-2">🙋</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* SECTION HEADING */}
            <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#c63868]">
                  HELP YOUR COMMUNITY
                </p>

                <h2 className="mt-2 text-3xl font-black tracking-tight text-[#173d29]">
                  People are looking for...
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  Maybe you already have exactly what someone needs.
                </p>
              </div>

              {/* FILTERS */}
              <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`shrink-0 rounded-full px-4 py-2 text-xs font-black transition duration-300 ${
                      selectedCategory === category
                        ? "bg-[#173d29] text-white shadow-md"
                        : "border border-[#e1ded5] bg-white text-gray-600 hover:-translate-y-0.5 hover:border-[#173d29] hover:text-[#173d29]"
                    }`}
                  >
                    {category !== "All" && (
                      <span className="mr-1">
                        {categoryIcons[category] || "✨"}
                      </span>
                    )}

                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* FILTER EMPTY */}
            {filteredNeeds.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-[#d9d6cc] bg-white p-12 text-center">
                <div className="text-4xl">🔎</div>

                <h3 className="mt-4 text-xl font-black text-[#173d29]">
                  No requests in this category
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  Try another category to discover more ways to help.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredNeeds.map((need) => {
                  const alreadyHelped = helpedNeeds.includes(
                    need.id
                  );

                  const isHelping = helpingId === need.id;

                  const icon =
                    categoryIcons[need.category] || "🙋";

                  const badgeStyle =
                    categoryStyles[need.category] ||
                    "bg-gray-100 text-gray-600";

                  return (
                    <div
                      key={need.id}
                      className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-[#e7e4dc] bg-white p-6 shadow-[0_10px_35px_rgba(23,61,41,0.05)] transition duration-500 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(23,61,41,0.12)]"
                    >
                      {/* TOP LINE */}
                      <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-[#173d29] via-[#c63868] to-[#173d29] opacity-0 transition duration-500 group-hover:opacity-100" />

                      {/* CARD HEADER */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e9f3eb] text-3xl transition duration-500 group-hover:rotate-6 group-hover:scale-110">
                          {icon}
                        </div>

                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-black ${badgeStyle}`}
                        >
                          {need.category}
                        </span>
                      </div>

                      {/* TITLE */}
                      <h3 className="mt-6 text-xl font-black leading-snug text-[#173d29]">
                        {need.title}
                      </h3>

                      {need.description ? (
                        <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-600">
                          {need.description}
                        </p>
                      ) : (
                        <p className="mt-2 text-sm italic text-gray-400">
                          No description added
                        </p>
                      )}

                      {/* LOCATION */}
                      <div className="mt-5 space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f7f8f4]">
                            📍
                          </span>

                          <span>
                            {need.locality}, {need.city}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f7f8f4]">
                            📅
                          </span>

                          <span>
                            Posted {formatDate(need.created_at)}
                          </span>
                        </div>
                      </div>

                      {/* COMMUNITY MESSAGE */}
                      <div className="mt-5 rounded-2xl border border-[#f0d8e1] bg-[#fff8fa] p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                            💡
                          </div>

                          <div>
                            <p className="text-sm font-black text-[#173d29]">
                              Can you help?
                            </p>

                            <p className="mt-0.5 text-xs text-gray-500">
                              Offer help if you have this available.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* HELP BUTTON */}
                      <button
                        onClick={() => handleHelp(need.id)}
                        disabled={alreadyHelped || isHelping}
                        className={`mt-5 flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 font-black transition duration-300 ${
                          alreadyHelped
                            ? "cursor-default border border-green-200 bg-green-50 text-green-700"
                            : "bg-[#c63868] text-white shadow-sm hover:-translate-y-1 hover:bg-[#a92e57] hover:shadow-lg active:translate-y-0"
                        } disabled:cursor-not-allowed disabled:opacity-80`}
                      >
                        {isHelping ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                            Offering Help...
                          </>
                        ) : alreadyHelped ? (
                          <>
                            <span>✓</span>
                            Help Offered
                          </>
                        ) : (
                          <>
                            <span className="transition group-hover:scale-110">
                              ❤️
                            </span>
                            I Can Help
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>

      {/* BOTTOM CTA */}
      {needs.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 pb-14 md:px-6">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-[#173d29] px-7 py-10 text-white shadow-[0_20px_50px_rgba(23,61,41,0.18)] md:px-10">
            <div className="absolute -right-10 -top-20 h-56 w-56 rounded-full bg-white/5 blur-2xl" />
            <div className="absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-[#c63868]/20 blur-3xl" />

            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-2xl font-black">
                  Have something useful? ♻️
                </p>

                <p className="mt-2 max-w-xl text-sm leading-6 text-white/70">
                  Instead of letting it sit unused, share it with
                  someone who needs it.
                </p>
              </div>

              <button
                onClick={() => router.push("/items/new")}
                className="shrink-0 rounded-2xl bg-white px-7 py-3.5 font-black text-[#173d29] shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                Share an Item →
              </button>
            </div>
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className="border-t border-[#e7e4dc] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-8 text-center md:flex-row md:items-center md:justify-between md:text-left">
          <div>
            <p className="font-black text-[#173d29]">
              Kaam Ka Saathi ♻️
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Someone's extra can be someone else's need.
            </p>
          </div>

          <p className="text-xs text-gray-400">
            Sharing more. Wasting less. Helping together.
          </p>
        </div>
      </footer>
    </main>
  );
}