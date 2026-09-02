"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Need = {
  id: number;
  title: string;
  description: string | null;
  category: string;
  city: string;
  locality: string;
  created_at: string;
};

type Interest = {
  need_id: number;
  interested_user_id: string;
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

export default function MyNeedsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [needs, setNeeds] = useState<Need[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [expandedNeed, setExpandedNeed] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    loadNeeds();
  }, []);

  async function loadNeeds() {
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
        "id, title, description, category, city, locality, created_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setNeeds(data || []);

    if (data && data.length > 0) {
      const needIds = data.map((need) => need.id);

      const { data: interestData, error: interestError } =
        await supabase
          .from("need_interests")
          .select("need_id, interested_user_id")
          .in("need_id", needIds);

      if (interestError) {
        console.error(interestError);
      } else {
        setInterests(interestData || []);
      }
    } else {
      setInterests([]);
    }

    setLoading(false);
  }

  async function deleteNeed(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this need?"
    );

    if (!confirmed) return;

    setDeletingId(id);
    setMessage("");

    const { error } = await supabase
      .from("needs")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      setMessage(error.message);
      setDeletingId(null);
      return;
    }

    setNeeds((current) =>
      current.filter((need) => need.id !== id)
    );

    setInterests((current) =>
      current.filter((interest) => interest.need_id !== id)
    );

    setExpandedNeed(null);
    setDeletingId(null);
  }

  function getInterestCount(needId: number) {
    return interests.filter(
      (interest) => interest.need_id === needId
    ).length;
  }

  function getPeopleForNeed(needId: number) {
    return interests.filter(
      (interest) => interest.need_id === needId
    );
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(needs.map((need) => need.category))
    );

    return ["All", ...unique];
  }, [needs]);

  const filteredNeeds = useMemo(() => {
    if (selectedCategory === "All") return needs;

    return needs.filter(
      (need) => need.category === selectedCategory
    );
  }, [needs, selectedCategory]);

  const totalInterested = interests.length;
  const needsWithInterest = needs.filter(
    (need) => getInterestCount(need.id) > 0
  ).length;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8f4]">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 animate-pulse items-center justify-center rounded-[1.75rem] bg-[#e9f3eb] text-4xl shadow-sm">
            🙋
          </div>

          <div className="mt-5 h-2 w-32 animate-pulse rounded-full bg-gray-200 mx-auto" />

          <p className="mt-4 font-medium text-gray-500">
            Loading your needs...
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
              Kaam Ka Saathi <span className="inline-block transition group-hover:rotate-12">♻️</span>
            </div>

            <p className="mt-0.5 text-xs text-gray-500 md:text-sm">
              Your community. Your needs.
            </p>
          </button>

          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => router.push("/needs/new")}
              className="rounded-xl bg-[#173d29] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition duration-300 hover:-translate-y-1 hover:bg-[#102d1f] hover:shadow-lg md:px-5"
            >
              <span className="hidden sm:inline">+ Post New Need</span>
              <span className="sm:hidden">+ Need</span>
            </button>

            <button
              onClick={() => router.push("/dashboard")}
              className="hidden rounded-xl border border-[#173d29] px-5 py-2.5 text-sm font-bold text-[#173d29] transition duration-300 hover:bg-[#173d29] hover:text-white sm:block"
            >
              Dashboard
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-[#c63868]/5 blur-3xl" />
        <div className="absolute -right-20 top-0 h-72 w-72 rounded-full bg-[#173d29]/5 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 pb-10 pt-12 md:px-6 md:pt-16">
          <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#f0d8e1] bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#c63868] shadow-sm">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#c63868]" />
                MY NEEDS
              </div>

              <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.05] tracking-tight text-[#173d29] md:text-6xl">
                Things I'm
                <span className="text-[#c63868]"> Looking For.</span>
                <span className="ml-2 inline-block animate-bounce">🙋</span>
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-gray-600 md:text-lg">
                Keep track of everything you've asked your community for.
                When someone can help, you'll see it right here.
              </p>
            </div>

            {/* SUMMARY CARD */}
            <div className="group overflow-hidden rounded-[2rem] border border-[#e7e4dc] bg-white p-6 shadow-[0_15px_45px_rgba(23,61,41,0.08)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_20px_55px_rgba(23,61,41,0.12)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-500">
                    Your activity
                  </p>

                  <p className="mt-1 text-4xl font-black text-[#173d29]">
                    {needs.length}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    {needs.length === 1
                      ? "need posted"
                      : "needs posted"}
                  </p>
                </div>

                <div className="flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-[#f8e7ed] text-3xl transition duration-500 group-hover:rotate-6 group-hover:scale-110">
                  📋
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[#f7f8f4] p-4">
                  <p className="text-2xl font-black text-[#c63868]">
                    {totalInterested}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Help offers
                  </p>
                </div>

                <div className="rounded-2xl bg-[#e9f3eb] p-4">
                  <p className="text-2xl font-black text-[#173d29]">
                    {needsWithInterest}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Getting responses
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK INFO STRIP */}
      {needs.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 md:px-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#e7e4dc] bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Posted
              </p>
              <p className="mt-1 font-bold text-[#173d29]">
                {needs.length} {needs.length === 1 ? "need" : "needs"}
              </p>
            </div>

            <div className="rounded-2xl border border-[#e7e4dc] bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Community response
              </p>
              <p className="mt-1 font-bold text-[#173d29]">
                {totalInterested > 0
                  ? `${totalInterested} help offer${totalInterested === 1 ? "" : "s"}`
                  : "Waiting for responses"}
              </p>
            </div>

            <div className="rounded-2xl border border-[#e7e4dc] bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Status
              </p>
              <p className="mt-1 font-bold text-[#173d29]">
                {needsWithInterest > 0
                  ? "Community is responding ✨"
                  : "Needs are active 🌱"}
              </p>
            </div>
          </div>
        </section>
      )}

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
                🙋
              </div>

              <p className="mt-7 text-xs font-black uppercase tracking-[0.2em] text-[#c63868]">
                START YOUR REQUEST
              </p>

              <h2 className="mt-3 text-3xl font-black text-[#173d29] md:text-4xl">
                Nothing here yet.
              </h2>

              <p className="mx-auto mt-4 max-w-lg leading-7 text-gray-600">
                Looking for something you don't have?
                Tell your community. Someone nearby might already
                have exactly what you need.
              </p>

              <button
                onClick={() => router.push("/needs/new")}
                className="mt-8 rounded-2xl bg-[#173d29] px-8 py-4 font-bold text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:bg-[#102d1f] hover:shadow-xl"
              >
                Post Your First Need
                <span className="ml-2">→</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* SECTION HEADING + FILTER */}
            <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#c63868]">
                  YOUR REQUESTS
                </p>

                <h2 className="mt-2 text-3xl font-black tracking-tight text-[#173d29]">
                  Everything you're looking for
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  Manage your needs and see who is ready to help.
                </p>
              </div>

              {/* CATEGORY FILTER */}
              <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition duration-300 ${
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

            {/* NO FILTER RESULTS */}
            {filteredNeeds.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-[#d9d6cc] bg-white p-12 text-center">
                <div className="text-4xl">🔎</div>

                <h3 className="mt-4 text-xl font-bold text-[#173d29]">
                  No needs in this category
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  Try another category to see your requests.
                </p>
              </div>
            ) : (
              /* CARDS */
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredNeeds.map((need) => {
                  const interestCount = getInterestCount(need.id);
                  const people = getPeopleForNeed(need.id);
                  const isExpanded = expandedNeed === need.id;

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
                      {/* TOP GRADIENT */}
                      <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-[#173d29] via-[#c63868] to-[#173d29] opacity-0 transition duration-500 group-hover:opacity-100" />

                      {/* HEADER */}
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

                      {/* RESPONSE AREA */}
                      <div className="mt-6">
                        {interestCount > 0 ? (
                          <div className="overflow-hidden rounded-2xl border border-green-100 bg-gradient-to-br from-green-50 to-white">
                            <div className="p-4">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                                    ❤️
                                  </div>

                                  <div>
                                    <p className="text-sm font-black text-green-700">
                                      {interestCount}{" "}
                                      {interestCount === 1
                                        ? "person is"
                                        : "people are"}{" "}
                                      interested
                                    </p>

                                    <p className="mt-0.5 text-xs text-green-600">
                                      Someone can help!
                                    </p>
                                  </div>
                                </div>

                                <button
                                  onClick={() =>
                                    setExpandedNeed(
                                      isExpanded ? null : need.id
                                    )
                                  }
                                  className="rounded-xl bg-white px-3 py-2 text-xs font-black text-green-700 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md"
                                >
                                  {isExpanded ? "Hide" : "View"}
                                </button>
                              </div>

                              {/* PEOPLE */}
                              {isExpanded && (
                                <div className="mt-4 border-t border-green-100 pt-4">
                                  <p className="mb-3 text-[10px] font-black uppercase tracking-[0.16em] text-green-700">
                                    People who offered help
                                  </p>

                                  <div className="space-y-2">
                                    {people.map((person, index) => (
                                      <div
                                        key={`${person.interested_user_id}-${index}`}
                                        className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm"
                                      >
                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e9f3eb] text-sm">
                                          👤
                                        </div>

                                        <div>
                                          <p className="text-sm font-bold text-[#173d29]">
                                            Community Member
                                          </p>

                                          <p className="text-xs text-gray-500">
                                            Has offered to help
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-dashed border-gray-200 bg-[#faf9f5] p-4 transition duration-300 group-hover:border-[#d8e6dc]">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                                🌱
                              </div>

                              <div>
                                <p className="text-sm font-bold text-gray-700">
                                  Waiting for someone
                                </p>

                                <p className="mt-0.5 text-xs text-gray-500">
                                  Your community hasn't responded yet.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* BUTTONS */}
                      <div className="mt-5 flex gap-3">
                        <button
                          onClick={() => router.push("/needs/new")}
                          className="flex-1 rounded-xl border border-[#173d29] px-4 py-2.5 text-sm font-bold text-[#173d29] transition duration-300 hover:-translate-y-0.5 hover:bg-[#173d29] hover:text-white hover:shadow-md"
                        >
                          + Post Another
                        </button>

                        <button
                          onClick={() => deleteNeed(need.id)}
                          disabled={deletingId === need.id}
                          className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-500 transition duration-300 hover:-translate-y-0.5 hover:bg-red-50 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId === need.id
                            ? "..."
                            : "Delete"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>

      {/* CTA */}
      {needs.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 pb-14 md:px-6">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-[#173d29] px-7 py-9 text-white shadow-[0_20px_50px_rgba(23,61,41,0.18)] md:px-10 md:py-10">
            <div className="absolute -right-10 -top-20 h-56 w-56 rounded-full bg-white/5 blur-2xl" />
            <div className="absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-[#c63868]/20 blur-3xl" />

            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-2xl font-black">
                  Still looking for something? 🌱
                </p>

                <p className="mt-2 max-w-xl text-sm leading-6 text-white/70">
                  Post another need and give your community a chance
                  to turn someone's extra into your useful.
                </p>
              </div>

              <button
                onClick={() => router.push("/needs/new")}
                className="shrink-0 rounded-2xl bg-white px-7 py-3.5 font-black text-[#173d29] shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                Post a New Need →
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
              Sharing more. Wasting less. Helping together.
            </p>
          </div>

          <p className="text-xs text-gray-400">
            Built for a more connected community.
          </p>
        </div>
      </footer>
    </main>
  );
}