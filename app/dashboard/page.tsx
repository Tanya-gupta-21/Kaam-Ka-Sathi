
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const supabase = createClient();

export default function DashboardPage() {
  const router = useRouter();

  const [userName, setUserName] = useState("User");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      if (profile?.full_name) {
        setUserName(profile.full_name);
      } else if (user.user_metadata?.full_name) {
        setUserName(user.user_metadata.full_name);
      }

      setLoading(false);
    }

    loadUser();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#faf9f5]">
        <p className="text-gray-600">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf9f5] text-[#193326]">
      {/* Navbar */}
      <nav className="border-b border-[#e7e4dc] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-[#173d29]">
              Kaam Ka Sathi ♻️
            </h1>

            <p className="text-sm text-gray-500">
              Your community dashboard
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-xl border border-[#c63868] px-5 py-2 font-semibold text-[#c63868] hover:bg-[#c63868] hover:text-white"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        {/* Welcome Banner */}
        <div className="rounded-3xl bg-[#173d29] p-8 text-white shadow-lg">
          <p className="text-green-100">Welcome back 👋</p>

          <h2 className="mt-2 text-4xl font-bold">
            Hello, {userName}!
          </h2>

          <p className="mt-3 max-w-2xl text-green-100">
            Give useful things a second chance and help someone find what
            they need.
          </p>
        </div>

        {/* Action Cards */}
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {/* Have Something */}
          <button
            onClick={() => router.push("/items/new")}
            className="rounded-2xl bg-white p-7 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="text-4xl">📦</div>

            <h3 className="mt-4 text-xl font-bold">
              I Have Something
            </h3>

            <p className="mt-2 text-sm text-gray-600">
              List an item that you no longer need.
            </p>
          </button>

          {/* Need Something */}
          <button
            onClick={() => router.push("/needs/new")}
            className="rounded-2xl bg-white p-7 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="text-4xl">🙋</div>

            <h3 className="mt-4 text-xl font-bold">
              I Need Something
            </h3>

            <p className="mt-2 text-sm text-gray-600">
              Post what you are looking for.
            </p>
          </button>

          {/* Browse Items */}
          <button
            onClick={() => router.push("/items")}
            className="rounded-2xl bg-white p-7 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="text-4xl">🔎</div>

            <h3 className="mt-4 text-xl font-bold">
              Browse Items
            </h3>

            <p className="mt-2 text-sm text-gray-600">
              Find useful things shared by others.
            </p>
          </button>
        </div>

        {/* Activity + Community */}
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {/* Activity */}
          <div className="rounded-2xl bg-white p-7 shadow-sm">
            <p className="text-sm font-semibold text-[#c63868]">
              YOUR ACTIVITY
            </p>

            <h3 className="mt-2 text-2xl font-bold">
              Start making an impact 🌱
            </h3>

            <p className="mt-3 text-gray-600">
              Share something useful or tell the community what you need.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => router.push("/items/new")}
                className="rounded-xl bg-[#173d29] px-5 py-3 font-semibold text-white"
              >
                Add Item
              </button>

              <button
                onClick={() => router.push("/needs/new")}
                className="rounded-xl border border-[#173d29] px-5 py-3 font-semibold text-[#173d29]"
              >
                Post Need
              </button>
            </div>
          </div>

          {/* Community */}
          <div className="rounded-2xl bg-[#f1eee6] p-7">
            <p className="text-sm font-semibold text-[#c63868]">
              KAAM KA SATHI
            </p>

            <h3 className="mt-2 text-2xl font-bold">
              One person's extra can be another person's need.
            </h3>

            <p className="mt-3 text-gray-600">
              Let's reduce waste and build a helpful local community
              together.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

