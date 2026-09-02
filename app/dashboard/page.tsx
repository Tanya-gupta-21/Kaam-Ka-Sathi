
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

type Need = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  city: string;
  locality: string;
  created_at: string;
};

const categories = [
  { name: "Books", icon: "📚", color: "bg-blue-50", text: "text-blue-600" },
  { name: "Clothes", icon: "👕", color: "bg-pink-50", text: "text-pink-600" },
  {
    name: "Furniture",
    icon: "🪑",
    color: "bg-orange-50",
    text: "text-orange-600",
  },
  {
    name: "Electronics",
    icon: "💻",
    color: "bg-purple-50",
    text: "text-purple-600",
  },
  {
    name: "Toys",
    icon: "🧸",
    color: "bg-yellow-50",
    text: "text-yellow-600",
  },
  {
    name: "Household",
    icon: "🏠",
    color: "bg-green-50",
    text: "text-green-600",
  },
];

const exampleItems = [
  {
    icon: "📚",
    title: "School Books",
    category: "Books",
    location: "Kanpur",
    description: "Class 8 books in good condition",
  },
  {
    icon: "👕",
    title: "Winter Clothes",
    category: "Clothes",
    location: "Kakadeo",
    description: "Warm clothes that deserve a new home",
  },
  {
    icon: "🪑",
    title: "Study Table",
    category: "Furniture",
    location: "Swaroop Nagar",
    description: "Useful study table available for someone",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [userName, setUserName] = useState("User");
  const [loading, setLoading] = useState(true);
  const [needCount, setNeedCount] = useState(0);
  const [interestCount, setInterestCount] = useState(0);
  const [communityNeeds, setCommunityNeeds] = useState<Need[]>([]);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        // =========================
        // PROFILE
        // =========================

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();

        if (!mounted) return;

        if (profile?.full_name) {
          setUserName(profile.full_name);
        } else if (user.user_metadata?.full_name) {
          setUserName(user.user_metadata.full_name);
        }

        // =========================
        // MY NEEDS
        // =========================

        const { data: myNeeds, count } = await supabase
          .from("needs")
          .select("id", { count: "exact" })
          .eq("user_id", user.id);

        if (!mounted) return;

        setNeedCount(count || 0);

        // =========================
        // INTERESTS ON MY NEEDS
        // =========================

        if (myNeeds && myNeeds.length > 0) {
          const ids = myNeeds.map((item) => item.id);

          const { count: interests } = await supabase
            .from("need_interests")
            .select("*", {
              count: "exact",
              head: true,
            })
            .in("need_id", ids);

          if (!mounted) return;

          setInterestCount(interests || 0);
        } else {
          setInterestCount(0);
        }

        // =========================
        // COMMUNITY NEEDS
        // =========================

        const { data: needs } = await supabase
          .from("needs")
          .select(
            "id, title, description, category, city, locality, created_at"
          )
          .neq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(6);

        if (!mounted) return;

        setCommunityNeeds(needs || []);
      } catch (error) {
        console.error("Dashboard loading error:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, [router]);

  function formatDate(date: string) {
    const d = new Date(date);

    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  }

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8f4]">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#dfe7df] border-t-[#173d29]" />

          <p className="mt-4 font-medium text-gray-500">
            Preparing your dashboard...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f8f4] text-[#173d29]">
      {/* BACKGROUND DECORATION */}
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
        <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-green-100/60 blur-3xl" />

        <div className="absolute -right-40 top-[700px] h-96 w-96 rounded-full bg-pink-100/60 blur-3xl" />
      </div>

      {/* SHARED NAVBAR */}
      <Navbar />

      <div className="relative z-10">
        {/* ========================================================= */}
        {/* HERO */}
        {/* ========================================================= */}

        <section className="mx-auto max-w-7xl px-5 pb-10 pt-7 md:px-8 md:pt-10">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-[#173d29] shadow-2xl">
            {/* Decorative shapes */}

            <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full border-[50px] border-white/5" />

            <div className="absolute -bottom-40 right-32 h-96 w-96 rounded-full bg-[#c63868]/20 blur-3xl" />

            <div className="absolute left-1/2 top-10 h-40 w-40 rounded-full bg-green-300/10 blur-3xl" />

            <div className="relative grid gap-10 p-7 md:grid-cols-[1fr_340px] md:p-12 lg:p-14">
              {/* HERO TEXT */}

              <div className="flex flex-col justify-center">
                <div className="mb-5 flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-green-100 backdrop-blur">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-green-300" />

                  Your community dashboard
                </div>

                <p className="text-sm font-semibold tracking-wide text-green-200">
                  WELCOME BACK 👋
                </p>

                <h2 className="mt-3 max-w-2xl text-4xl font-black tracking-tight text-white md:text-6xl">
                  Hello,{" "}
                  <span className="text-[#f4b6c9]">{userName}!</span>
                </h2>

                <p className="mt-5 max-w-xl text-base leading-7 text-green-100 md:text-lg">
                  Your unused things can become someone else's useful
                  belongings. Let's make that connection happen.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    onClick={() => router.push("/items/new")}
                    className="rounded-2xl bg-white px-6 py-3.5 font-bold text-[#173d29] shadow-xl transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
                  >
                    📦 Share Something
                  </button>

                  <button
                    onClick={() => router.push("/needs/new")}
                    className="rounded-2xl border border-white/20 bg-white/10 px-6 py-3.5 font-bold text-white backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/20"
                  >
                    🙋 Tell What You Need
                  </button>
                </div>
              </div>

              {/* IMPACT CARD */}

              <div className="relative">
                <div className="absolute inset-0 rotate-3 rounded-[2rem] bg-white/5" />

                <div className="relative rounded-[2rem] border border-white/10 bg-white/10 p-7 text-white backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-green-100">
                      YOUR IMPACT
                    </p>

                    <span className="text-3xl">🌱</span>
                  </div>

                  <p className="mt-8 text-6xl font-black">
                    {needCount + interestCount}
                  </p>

                  <p className="mt-1 text-green-100">
                    actions made in the community
                  </p>

                  <div className="my-7 h-px bg-white/10" />

                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-green-100">
                        Needs posted
                      </span>

                      <b>{needCount}</b>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-sm text-green-100">
                        Help offers
                      </span>

                      <b>{interestCount}</b>
                    </div>
                  </div>

                  <div className="mt-6 rounded-xl bg-white/10 p-3 text-center text-sm">
                    Every little action counts 💚
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* STATS */}
        {/* ========================================================= */}

        <section className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="-mt-2 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              {
                icon: "📦",
                number: "∞",
                label: "Things can be reused",
              },
              {
                icon: "🙋",
                number: needCount,
                label: "Your needs",
              },
              {
                icon: "❤️",
                number: interestCount,
                label: "People interested",
              },
              {
                icon: "♻️",
                number: "100%",
                label: "Community focused",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-black/5 bg-white p-5 shadow-lg shadow-black/5 transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{stat.icon}</span>

                  <span className="text-xl font-black text-[#173d29]">
                    {stat.number}
                  </span>
                </div>

                <p className="mt-3 text-sm font-medium text-gray-500">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================= */}
        {/* ACTION SECTION */}
        {/* ========================================================= */}

        <section className="mx-auto max-w-7xl px-5 py-16 md:px-8">
          <div className="mb-7">
            <p className="text-xs font-black tracking-[0.2em] text-[#c63868]">
              GET STARTED
            </p>

            <div className="mt-2 flex flex-col justify-between gap-2 md:flex-row md:items-end">
              <h3 className="text-3xl font-black md:text-4xl">
                What brings you here today?
              </h3>

              <p className="text-sm text-gray-500">
                Choose an action and get started →
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {/* CARD 1 */}

            <button
              onClick={() => router.push("/items/new")}
              className="group relative min-h-[300px] overflow-hidden rounded-[2rem] bg-[#173d29] p-8 text-left text-white shadow-xl transition duration-500 hover:-translate-y-2 hover:shadow-2xl"
            >
              <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/5 transition duration-500 group-hover:scale-125" />

              <div className="relative flex h-full flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-4xl">
                      📦
                    </div>

                    <span className="text-3xl transition group-hover:translate-x-2">
                      ↗
                    </span>
                  </div>

                  <h4 className="mt-9 text-2xl font-black">
                    I Have Something
                  </h4>

                  <p className="mt-3 text-sm leading-6 text-green-100">
                    Clothes, books, furniture or anything useful that you no
                    longer need.
                  </p>
                </div>

                <span className="text-sm font-bold text-white/80">
                  Add an item →
                </span>
              </div>
            </button>

            {/* CARD 2 */}

            <button
              onClick={() => router.push("/needs/new")}
              className="group relative min-h-[300px] overflow-hidden rounded-[2rem] bg-[#c63868] p-8 text-left text-white shadow-xl transition duration-500 hover:-translate-y-2 hover:shadow-2xl"
            >
              <div className="absolute -bottom-20 -right-10 h-60 w-60 rounded-full bg-white/10 transition duration-500 group-hover:scale-125" />

              <div className="relative flex h-full flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-4xl">
                      🙋
                    </div>

                    <span className="text-3xl transition group-hover:translate-x-2">
                      ↗
                    </span>
                  </div>

                  <h4 className="mt-9 text-2xl font-black">
                    I Need Something
                  </h4>

                  <p className="mt-3 text-sm leading-6 text-pink-100">
                    Can't find something you need? Tell the community and let
                    someone help.
                  </p>
                </div>

                <span className="text-sm font-bold text-white/80">
                  Post a need →
                </span>
              </div>
            </button>

            {/* CARD 3 */}

            <button
              onClick={() => router.push("/items")}
              className="group relative min-h-[300px] overflow-hidden rounded-[2rem] bg-[#f1eee6] p-8 text-left shadow-xl transition duration-500 hover:-translate-y-2 hover:bg-white hover:shadow-2xl"
            >
              <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#173d29]/5 transition duration-500 group-hover:scale-125" />

              <div className="relative flex h-full flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-4xl shadow-sm">
                      🔎
                    </div>

                    <span className="text-3xl transition group-hover:translate-x-2">
                      ↗
                    </span>
                  </div>

                  <h4 className="mt-9 text-2xl font-black">
                    Explore Items
                  </h4>

                  <p className="mt-3 text-sm leading-6 text-gray-600">
                    Discover things people around you are sharing and find
                    something useful.
                  </p>
                </div>

                <span className="text-sm font-bold">
                  Browse community →
                </span>
              </div>
            </button>
          </div>
        </section>

        {/* ========================================================= */}
        {/* PEOPLE ARE SHARING */}
        {/* ========================================================= */}

        <section className="border-y border-black/5 bg-white py-16">
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-black tracking-[0.2em] text-[#173d29]">
                  FROM THE COMMUNITY
                </p>

                <h3 className="mt-2 text-3xl font-black md:text-4xl">
                  People are sharing 💚
                </h3>

                <p className="mt-2 max-w-xl text-gray-500">
                  Useful things don't have to end up unused. Here's what
                  sharing can look like.
                </p>
              </div>

              <button
                onClick={() => router.push("/items")}
                className="w-fit font-bold text-[#173d29] hover:underline"
              >
                View all items →
              </button>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {exampleItems.map((item) => (
                <div
                  key={item.title}
                  className="group overflow-hidden rounded-3xl border border-gray-100 bg-[#faf9f5] transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="flex h-40 items-center justify-center bg-[#edf3ed] text-7xl transition duration-300 group-hover:scale-[1.02]">
                    {item.icon}
                  </div>

                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-gray-500">
                        {item.category}
                      </span>

                      <span className="text-xs text-gray-400">
                        📍 {item.location}
                      </span>
                    </div>

                    <h4 className="mt-4 text-xl font-black">
                      {item.title}
                    </h4>

                    <p className="mt-2 text-sm leading-6 text-gray-500">
                      {item.description}
                    </p>

                    <button
                      onClick={() => router.push("/items")}
                      className="mt-5 text-sm font-bold text-[#173d29]"
                    >
                      Explore item →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* COMMUNITY NEEDS */}
        {/* ========================================================= */}

        <section className="mx-auto max-w-7xl px-5 py-16 md:px-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-black tracking-[0.2em] text-[#c63868]">
                MAYBE YOU CAN HELP
              </p>

              <h3 className="mt-2 text-3xl font-black md:text-4xl">
                People are looking for ❤️
              </h3>

              <p className="mt-2 max-w-xl text-gray-500">
                Someone nearby might be looking for exactly what you have.
              </p>
            </div>

            <button
              onClick={() => router.push("/needs")}
              className="w-fit font-bold text-[#c63868] hover:underline"
            >
              See all community needs →
            </button>
          </div>

          {communityNeeds.length > 0 ? (
            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {communityNeeds.map((need) => (
                <div
                  key={need.id}
                  className="group rounded-3xl border border-[#eee9e3] bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff0f4] text-2xl">
                      {need.category === "Books"
                        ? "📚"
                        : need.category === "Clothes"
                          ? "👕"
                          : need.category === "Furniture"
                            ? "🪑"
                            : need.category === "Electronics"
                              ? "💻"
                              : need.category === "Toys"
                                ? "🧸"
                                : "🙋"}
                    </div>

                    <span className="rounded-full bg-[#f8f5f0] px-3 py-1 text-xs font-semibold text-gray-500">
                      {need.category}
                    </span>
                  </div>

                  <h4 className="mt-5 text-xl font-black">{need.title}</h4>

                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-500">
                    {need.description ||
                      "Someone from the community needs this."}
                  </p>

                  <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                    <span className="text-xs text-gray-500">
                      📍 {need.locality}, {need.city}
                    </span>

                    <span className="text-xs text-gray-400">
                      {formatDate(need.created_at)}
                    </span>
                  </div>

                  <button
                    onClick={() => router.push("/needs")}
                    className="mt-5 w-full rounded-xl bg-[#fff0f4] py-3 text-sm font-bold text-[#c63868] transition hover:bg-[#c63868] hover:text-white"
                  >
                    ❤️ I Can Help
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center">
              <div className="text-5xl">🌱</div>

              <h4 className="mt-4 text-xl font-black">
                No community needs yet
              </h4>

              <p className="mt-2 text-sm text-gray-500">
                Be the first person to post a need and start a connection.
              </p>

              <button
                onClick={() => router.push("/needs/new")}
                className="mt-6 rounded-xl bg-[#c63868] px-5 py-3 font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#a92e57]"
              >
                Post a Need
              </button>
            </div>
          )}
        </section>

        {/* ========================================================= */}
        {/* CATEGORIES */}
        {/* ========================================================= */}

        <section className="bg-[#f1eee6] py-16">
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <div className="text-center">
              <p className="text-xs font-black tracking-[0.2em] text-[#c63868]">
                FIND YOUR CATEGORY
              </p>

              <h3 className="mt-2 text-3xl font-black md:text-4xl">
                What are you looking for?
              </h3>

              <p className="mx-auto mt-3 max-w-xl text-gray-500">
                From books to furniture, useful things can find useful homes.
              </p>
            </div>

            <div className="mt-9 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
              {categories.map((category) => (
                <button
                  key={category.name}
                  onClick={() => router.push("/items")}
                  className="group rounded-3xl bg-white p-5 text-center shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl"
                >
                  <div
                    className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${category.color} text-3xl transition duration-300 group-hover:scale-110`}
                  >
                    {category.icon}
                  </div>

                  <p className={`mt-4 font-bold ${category.text}`}>
                    {category.name}
                  </p>

                  <p className="mt-1 text-xs text-gray-400">Explore →</p>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* HOW IT WORKS */}
        {/* ========================================================= */}

        <section className="mx-auto max-w-7xl px-5 py-16 md:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-xs font-black tracking-[0.2em] text-[#173d29]">
                SIMPLE & USEFUL
              </p>

              <h3 className="mt-3 text-4xl font-black leading-tight md:text-5xl">
                How Kaam Ka Saathi works.
              </h3>

              <p className="mt-5 max-w-md leading-7 text-gray-500">
                No complicated process. Just share, discover and connect with
                people in your community.
              </p>

              <button
                onClick={() => router.push("/items")}
                className="mt-7 rounded-xl bg-[#173d29] px-6 py-3 font-bold text-white shadow-lg transition hover:-translate-y-1 hover:shadow-xl"
              >
                Explore Community
              </button>
            </div>

            <div className="space-y-4">
              {[
                {
                  number: "01",
                  icon: "📦",
                  title: "Share what you have",
                  text: "Post useful things that you no longer need.",
                },
                {
                  number: "02",
                  icon: "🔎",
                  title: "Find what you need",
                  text: "Browse items or community needs around you.",
                },
                {
                  number: "03",
                  icon: "🤝",
                  title: "Connect & help",
                  text: "Offer help and turn unused things into useful connections.",
                },
              ].map((step) => (
                <div
                  key={step.number}
                  className="group flex gap-5 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition duration-300 hover:-translate-x-1 hover:shadow-xl"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#edf3ed] text-2xl transition group-hover:scale-110">
                    {step.icon}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-black">{step.title}</h4>

                      <span className="text-sm font-black text-gray-300">
                        {step.number}
                      </span>
                    </div>

                    <p className="mt-1 text-sm leading-6 text-gray-500">
                      {step.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* IMPACT */}
        {/* ========================================================= */}

        <section className="mx-auto max-w-7xl px-5 pb-16 md:px-8">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-[#173d29] p-8 text-white md:p-12">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#c63868]/20 blur-3xl" />

            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-green-300/10 blur-3xl" />

            <div className="relative grid gap-10 lg:grid-cols-[1fr_0.7fr] lg:items-center">
              <div>
                <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-green-100">
                  🌱 WHY IT MATTERS
                </span>

                <h3 className="mt-6 text-3xl font-black md:text-5xl">
                  One person's extra can be another person's need.
                </h3>

                <p className="mt-5 max-w-2xl leading-7 text-green-100">
                  Instead of letting useful things sit unused, Kaam Ka Saathi
                  helps them reach people who can actually use them.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-white/10 p-5 text-center backdrop-blur">
                  <div className="text-3xl">♻️</div>

                  <p className="mt-3 text-sm font-bold">Reuse</p>
                </div>

                <div className="rounded-2xl bg-white/10 p-5 text-center backdrop-blur">
                  <div className="text-3xl">🤝</div>

                  <p className="mt-3 text-sm font-bold">Connect</p>
                </div>

                <div className="rounded-2xl bg-white/10 p-5 text-center backdrop-blur">
                  <div className="text-3xl">🌱</div>

                  <p className="mt-3 text-sm font-bold">Impact</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* FINAL CTA */}
        {/* ========================================================= */}

        <section className="mx-auto max-w-7xl px-5 pb-12 md:px-8">
          <div className="relative overflow-hidden rounded-[2rem] border border-[#eadfe3] bg-[#fff5f8] p-8 text-center md:p-12">
            <div className="absolute -left-10 top-0 text-7xl opacity-10">
              ❤️
            </div>

            <div className="absolute -right-10 bottom-0 text-7xl opacity-10">
              ♻️
            </div>

            <div className="relative">
              <p className="text-sm font-black tracking-[0.18em] text-[#c63868]">
                READY?
              </p>

              <h3 className="mt-3 text-3xl font-black md:text-4xl">
                Have something useful to share?
              </h3>

              <p className="mx-auto mt-3 max-w-xl text-gray-500">
                Someone in your community might be waiting for exactly that.
              </p>

              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => router.push("/items/new")}
                  className="rounded-xl bg-[#173d29] px-6 py-3.5 font-bold text-white shadow-lg transition hover:-translate-y-1 hover:shadow-xl"
                >
                  📦 Share an Item
                </button>

                <button
                  onClick={() => router.push("/needs")}
                  className="rounded-xl border border-[#c63868] bg-white px-6 py-3.5 font-bold text-[#c63868] transition hover:-translate-y-1 hover:bg-[#c63868] hover:text-white"
                >
                  ❤️ Help Someone
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* FOOTER */}
        {/* ========================================================= */}

        <footer className="border-t border-black/5 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 px-5 py-7 text-sm md:flex-row md:items-center md:px-8">
            <div>
              <p className="font-black text-[#173d29]">♻️ Kaam Ka Saathi</p>

              <p className="mt-1 text-gray-400">
                Share • Help • Reuse • Connect
              </p>
            </div>

            <div className="flex flex-wrap gap-5 text-gray-500">
              <button
                onClick={() => router.push("/items")}
                className="hover:text-[#173d29]"
              >
                Browse Items
              </button>

              <button
                onClick={() => router.push("/needs")}
                className="hover:text-[#c63868]"
              >
                Community Needs
              </button>

              <button
                onClick={() => router.push("/dashboard/needs")}
                className="hover:text-[#173d29]"
              >
                My Needs
              </button>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}

